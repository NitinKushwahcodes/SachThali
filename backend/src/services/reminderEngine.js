// Smart reminder engine tracking user habit patterns and scheduling web push notifications.
// Calculates rolling exponential moving averages for breakfast, lunch, and dinner logging times.
// Enforces quiet hours (10pm-7am), max 3 notifications/day cap, and curated dish suggestions.

import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { sendPushNotification } from './notificationService.js';
import { getAllDishes } from './rag/vectorStore.js';
import { logInfo, logError } from '../utils/logger.js';

// Map tracking daily notification counts per user to enforce 3/day hard limit.
const dailyNotificationCounts = new Map();

// Helper resetting daily notification count map at midnight.
function resetDailyNotificationCounts() {
  dailyNotificationCounts.clear();
}

// Updates rolling average logging pattern for breakfast, lunch, or dinner slots.
export async function updateLoggingPattern(userId, loggedAt = new Date()) {
  try {
    const hours = loggedAt.getHours();
    const minutes = loggedAt.getMinutes();
    const todayMinutes = hours * 60 + minutes;

    let slot = null;
    if (todayMinutes < 660) {
      slot = 'avgBreakfastMin';
    } else if (todayMinutes >= 660 && todayMinutes <= 960) {
      slot = 'avgLunchMin';
    } else if (todayMinutes >= 1140) {
      slot = 'avgDinnerMin';
    }

    if (!slot) return; // In between slot windows, skip updating average

    const existingPattern = await prisma.loggingPattern.findUnique({
      where: { userId },
    });

    const oldAvg = existingPattern ? existingPattern[slot] : null;
    const newAvg = oldAvg ? Math.round(oldAvg * 0.8 + todayMinutes * 0.2) : todayMinutes;

    await prisma.loggingPattern.upsert({
      where: { userId },
      update: { [slot]: newAvg },
      create: {
        userId,
        [slot]: newAvg,
      },
    });

    logInfo(`[REMINDER ENGINE] Updated ${slot} for user ${userId} to ${newAvg} minutes.`);
  } catch (error) {
    logError('[REMINDER ENGINE] Error updating logging pattern', error);
  }
}

// Evaluates all users for scheduled meal reminders respecting quiet hours and caps.
export async function checkAndSendReminders() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = currentHour * 60 + now.getMinutes();

    // Rule 0.3: Quiet hours check (no push between 10pm (22:00) and 7am (7:00))
    if (currentHour >= 22 || currentHour < 7) {
      logInfo('[REMINDER ENGINE] Quiet hours active (10pm-7am). Suppressing reminders.');
      return;
    }

    const todayDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Fetch users with active push subscriptions
    const pushSubs = await prisma.pushSubscription.findMany({
      include: {
        user: {
          include: {
            profile: true,
            loggingPattern: true,
            dailyLogs: {
              where: { date: todayDate },
              include: { meals: true },
            },
          },
        },
      },
    });

    const dishes = getAllDishes();

    for (const sub of pushSubs) {
      const user = sub.user;
      const countKey = `${user.id}_${todayDate.toISOString().slice(0, 10)}`;
      const sentCount = dailyNotificationCounts.get(countKey) || 0;

      // Rule 0.3: Hard cap of 3 notifications per day per user
      if (sentCount >= 3) continue;

      const pattern = user.loggingPattern;
      const avgBreakfast = pattern?.avgBreakfastMin || 540; // Default 9:00am
      const avgLunch = pattern?.avgLunchMin || 810; // Default 1:30pm
      const avgDinner = pattern?.avgDinnerMin || 1230; // Default 8:30pm

      const todayMeals = user.dailyLogs?.[0]?.meals || [];

      let mealPromptSlot = null;
      if (currentMin > avgBreakfast + 45 && currentMin < 660 && todayMeals.length === 0) {
        mealPromptSlot = 'breakfast';
      } else if (currentMin > avgLunch + 45 && currentMin <= 1020 && todayMeals.length === 0) {
        mealPromptSlot = 'lunch';
      } else if (currentMin > avgDinner + 45 && currentMin <= 1320 && todayMeals.length < 3) {
        mealPromptSlot = 'dinner';
      }

      if (mealPromptSlot) {
        const dietType = user.profile?.dietType || 'veg';
        const filteredDishes = dishes.filter((d) => !dietType || d.dietType === dietType);
        const suggestions = filteredDishes.slice(0, 4).map((d) => d.name);

        const payload = {
          title: `Time to log your ${mealPromptSlot}! 🍛`,
          body: `Don't forget to log your meal. Healthy suggestions: ${suggestions.join(', ')}`,
          url: '/scan',
        };

        const success = await sendPushNotification(sub, payload);
        if (success) {
          dailyNotificationCounts.set(countKey, sentCount + 1);
        }
      }
    }
  } catch (error) {
    logError('[REMINDER ENGINE] Error during reminder cron run', error);
  }
}

// Initializes node-cron scheduled background job running every 15 minutes.
export function startReminderScheduler() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    logInfo('[REMINDER SCHEDULER] Triggering 15-minute reminder check...');
    checkAndSendReminders();
  });

  // Reset notification counts at midnight
  cron.schedule('0 0 * * *', () => {
    resetDailyNotificationCounts();
  });

  logInfo('[REMINDER SCHEDULER] Scheduled 15-minute reminder cron job initialized.');
}
