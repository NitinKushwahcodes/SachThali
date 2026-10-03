// Controller delivering AI coach advice based on user calorie budget and logged meals.
// Evaluates today's consumed calories against calculated calorieTarget and goal context.
// Invokes coachEngine to generate a friendly single-sentence Hinglish recommendation using today's meals.

import { prisma } from '../config/prisma.js';
import { generateCoachMessage } from '../services/coachEngine.js';

// Returns today's UTC midnight date object.
function getTodayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Handles GET /coach/message endpoint returning current verdict and AI coach statement.
export async function getCoachMessageHandler(req, res, next) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    const today = getTodayDate();
    const dailyLog = await prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: today,
        },
      },
      include: {
        meals: {
          orderBy: { loggedAt: 'asc' },
        },
      },
    });

    const targetKcal = profile?.calorieTarget || 1800;
    const consumedSoFar = dailyLog?.totalKcal || 0;
    const meals = dailyLog?.meals || [];
    const todaysMealsSoFar = meals.map((m) => ({
      dishName: m.dishName,
      kcal: m.kcal,
      slot: m.mealSlot,
    }));
    const lastMeal = meals.length > 0 ? meals[meals.length - 1] : null;

    const coachResponse = await generateCoachMessage({
      goal: profile?.goal || 'general_health',
      targetKcal,
      consumedSoFar,
      newItem: lastMeal ? { name: lastMeal.dishName, kcal: lastMeal.kcal } : null,
      todaysMealsSoFar,
      hasMedicalContext: profile?.hasMedicalContext || false,
    });

    res.status(200).json(coachResponse);
  } catch (error) {
    next(error);
  }
}
