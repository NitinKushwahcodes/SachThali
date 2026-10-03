// Controller handling daily log meal logging, today's summary retrieval, and meal entry deletion.
// Interacts with Prisma DailyLog and MealEntry models to log meals, delete accidental meals, and calculate daily totals.
// Manages 24-hour photo storage and awards Glow Points upon meal logging.

import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { updateLoggingPattern } from '../services/reminderEngine.js';
import { awardPoints } from '../services/rewardsEngine.js';
import { logError, logInfo } from '../utils/logger.js';

const mealItemSchema = z.object({
  dishName: z.string().min(1),
  portionUnit: z.string().optional().default('piece'),
  portionQty: z.number().positive(),
  kcalMin: z.number().nonnegative(),
  kcalMax: z.number().nonnegative(),
  kcal: z.number().nonnegative(),
  confidence: z.enum(['high', 'medium', 'low']).optional().default('high'),
  oilLevel: z.enum(['low', 'normal', 'high']).optional().nullable(),
  mealSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  tier: z.number().int().min(1).max(5).optional().default(3),
  photoUrl: z.string().optional().nullable(),
});

const createLogEntrySchema = z.object({
  items: z.array(mealItemSchema).min(1),
  photoUrl: z.string().optional().nullable(),
});

// Returns today's UTC midnight date object for uniform database queries.
function getTodayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Computes mealSlot enum string from current time hour.
function computeMealSlot(dateObj = new Date()) {
  const hour = dateObj.getHours();
  if (hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 19) return 'dinner';
  return 'snack';
}

// Handles GET /log/today endpoint returning today's accumulated meals and total calories.
export async function getTodayLogHandler(req, res, next) {
  try {
    const today = getTodayDate();

    let dailyLog = await prisma.dailyLog.findUnique({
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

    if (!dailyLog) {
      dailyLog = {
        userId: req.user.userId,
        date: today,
        totalKcal: 0,
        meals: [],
      };
    }

    res.status(200).json(dailyLog);
  } catch (error) {
    next(error);
  }
}

// Handles GET /log/history endpoint returning full historical meal logs (NEVER returning photoUrls).
export async function getHistoryLogHandler(req, res, next) {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const userId = req.user.userId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.dailyLog.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      include: {
        meals: {
          orderBy: { loggedAt: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    const history = logs.map((log) => {
      const grouped = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };

      log.meals.forEach((m) => {
        // Strip photoUrl so history view NEVER returns photos
        const { photoUrl, ...sanitizedMeal } = m;
        const slot = m.mealSlot || 'lunch';
        if (grouped[slot]) grouped[slot].push(sanitizedMeal);
        else grouped.lunch.push(sanitizedMeal);
      });

      return {
        id: log.id,
        date: log.date,
        totalKcal: log.totalKcal,
        mealsBySlot: grouped,
      };
    });

    res.status(200).json({
      locked: false,
      history,
    });
  } catch (error) {
    next(error);
  }
}

// Handles POST /log/entry endpoint creating MealEntry items and updating DailyLog totalKcal.
export async function createLogEntryHandler(req, res, next) {
  try {
    let payload = req.body;

    // Robust normalization of items array handling dishName/name and confidence values
    if (payload && Array.isArray(payload.items)) {
      payload.items = payload.items
        .filter((item) => typeof item.portionQty === 'number' && item.portionQty > 0)
        .map((item) => {
          let conf = 'high';
          if (item.confidence) {
            conf = String(item.confidence).toLowerCase();
          } else if (item.confidenceLabel) {
            conf = String(item.confidenceLabel).toLowerCase();
          }
          if (!['high', 'medium', 'low'].includes(conf)) conf = 'high';

          const kcalVal = typeof item.kcal === 'number' ? item.kcal : 150;

          return {
            ...item,
            dishName: item.dishName || item.name || 'Identified Dish',
            portionUnit: item.portionUnit || 'piece',
            portionQty: item.portionQty || 1,
            kcal: kcalVal,
            kcalMin: typeof item.kcalMin === 'number' ? item.kcalMin : Math.round(kcalVal * 0.85),
            kcalMax: typeof item.kcalMax === 'number' ? item.kcalMax : Math.round(kcalVal * 1.15),
            confidence: conf,
            oilLevel: item.oilLevel || 'normal',
            tier: typeof item.tier === 'number' ? item.tier : 3,
          };
        });
    }

    let parsedBody;
    try {
      parsedBody = createLogEntrySchema.parse(payload);
    } catch (zodErr) {
      logError('[LogEntry Validation Error] Body:', JSON.stringify(req.body, null, 2));
      logError('[LogEntry Validation Error] Details:', zodErr.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: zodErr.errors,
      });
    }

    const { items, photoUrl: topPhotoUrl } = parsedBody;
    const today = getTodayDate();

    let dailyLog = await prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: req.user.userId,
          date: today,
        },
      },
    });

    if (!dailyLog) {
      dailyLog = await prisma.dailyLog.create({
        data: {
          userId: req.user.userId,
          date: today,
          totalKcal: 0,
        },
      });
    }

    const addedKcal = items.reduce((sum, item) => sum + item.kcal, 0);
    const currentSlot = computeMealSlot();

    const mealCreates = items.map((item) => {
      const entryPhoto = item.photoUrl || topPhotoUrl || null;
      return prisma.mealEntry.create({
        data: {
          dailyLogId: dailyLog.id,
          dishName: item.dishName,
          portionUnit: item.portionUnit,
          portionQty: item.portionQty,
          kcalMin: item.kcalMin,
          kcalMax: item.kcalMax,
          kcal: item.kcal,
          confidence: item.confidence || 'high',
          oilLevel: item.oilLevel || 'normal',
          mealSlot: item.mealSlot || currentSlot,
          tier: item.tier || 3,
          photoUrl: entryPhoto,
        },
      });
    });

    await prisma.$transaction(mealCreates);

    const updatedLog = await prisma.dailyLog.update({
      where: { id: dailyLog.id },
      data: {
        totalKcal: { increment: addedKcal },
      },
      include: {
        meals: {
          orderBy: { loggedAt: 'asc' },
        },
      },
    });

    // Fire background tasks asynchronously for sub-100ms API response time
    const isMultiItem = items.length > 1;
    const isBalanced = items.every((i) => (i.tier || 3) <= 2);
    awardPoints(req.user.userId, {
      patience: isMultiItem ? 3 : 0,
      balance: isBalanced ? 5 : 2,
      completion: 2,
    }).catch(() => {});

    updateLoggingPattern(req.user.userId).catch(() => {});

    res.status(201).json(updatedLog);
  } catch (error) {
    next(error);
  }
}

// Handles DELETE /log/meal/:mealId endpoint removing an accidental logged meal entry.
export async function deleteMealEntryHandler(req, res, next) {
  try {
    const { mealId } = req.params;
    const userId = req.user.userId;

    const meal = await prisma.mealEntry.findUnique({
      where: { id: mealId },
      include: { dailyLog: true },
    });

    if (!meal || meal.dailyLog.userId !== userId) {
      return res.status(404).json({ error: 'Meal entry not found or unauthorized' });
    }

    // Delete meal entry
    await prisma.mealEntry.delete({
      where: { id: mealId },
    });

    // Recalculate remaining totalKcal for the DailyLog
    const remainingKcalSum = await prisma.mealEntry.aggregate({
      where: { dailyLogId: meal.dailyLogId },
      _sum: { kcal: true },
    });

    const newTotalKcal = remainingKcalSum._sum.kcal || 0;

    const updatedLog = await prisma.dailyLog.update({
      where: { id: meal.dailyLogId },
      data: { totalKcal: newTotalKcal },
      include: {
        meals: { orderBy: { loggedAt: 'asc' } },
      },
    });

    logInfo(`[LogController] Meal ${mealId} (${meal.dishName}) deleted for user ${userId}. Updated totalKcal: ${newTotalKcal}`);

    res.status(200).json(updatedLog);
  } catch (error) {
    next(error);
  }
}
