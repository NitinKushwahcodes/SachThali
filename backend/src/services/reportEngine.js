// Weekly report aggregator summarizing recent 7-day user meal logs and performance.
// Computes average calorie intake, days over/under budget target, and top logged dishes.
// Uses pure Prisma database SQL aggregations without AI dependencies.

import { prisma } from '../config/prisma.js';

// Generates 7-day meal log summary report for authenticated user.
export async function generateWeeklyReport(userId) {
  const now = new Date();
  const sevenDaysAgo = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 6));

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const targetKcal = profile?.calorieTarget || 1800;

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
    include: { meals: true },
    orderBy: { date: 'asc' },
  });

  const daysCount = logs.length || 1;
  const totalKcalSum = logs.reduce((sum, log) => sum + log.totalKcal, 0);
  const avgKcal = Math.round(totalKcalSum / daysCount);

  let daysOverTarget = 0;
  let daysUnderTarget = 0;

  const dishCounts = {};
  for (const log of logs) {
    if (log.totalKcal > targetKcal) daysOverTarget++;
    else daysUnderTarget++;

    for (const meal of log.meals) {
      dishCounts[meal.dishName] = (dishCounts[meal.dishName] || 0) + 1;
    }
  }

  const topDishes = Object.entries(dishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    periodDays: 7,
    targetKcal,
    logsFound: logs.length,
    averageDailyKcal: avgKcal,
    daysOverTarget,
    daysUnderTarget,
    topDishes,
    dailyBreakdown: logs.map((l) => ({
      date: l.date.toISOString().slice(0, 10),
      totalKcal: l.totalKcal,
      mealCount: l.meals.length,
    })),
  };
}
