// Rewards points & level engine ("Glow Points") for user engagement and habit building.
// Calculates level progression across 7 tiers and awards points for scanning, balance, and completion.

import { prisma } from '../config/prisma.js';
import { logInfo, logError } from '../utils/logger.js';

// Level thresholds mapping total Glow Points to user level titles and requirements.
export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Seed 💡', minPoints: 0, nextPoints: 20 },
  { level: 2, title: 'Sprout 🌱', minPoints: 20, nextPoints: 50 },
  { level: 3, title: 'Leaf 🍃', minPoints: 50, nextPoints: 100 },
  { level: 4, title: 'Bloom 🌸', minPoints: 100, nextPoints: 200 },
  { level: 5, title: 'Harvest 🌾', minPoints: 200, nextPoints: 400 },
  { level: 6, title: 'Master Thali 🍱', minPoints: 400, nextPoints: 700 },
  { level: 7, title: 'Nutrition Guru 👑', minPoints: 700, nextPoints: 700 },
];

// Computes user level, title, next level milestone, and remaining points required.
export function calculateLevel(totalPoints = 0) {
  let currentTier = LEVEL_THRESHOLDS[0];
  for (const tier of LEVEL_THRESHOLDS) {
    if (totalPoints >= tier.minPoints) {
      currentTier = tier;
    }
  }

  const pointsToNext = Math.max(0, currentTier.nextPoints - totalPoints);
  return {
    level: currentTier.level,
    title: currentTier.title,
    currentPoints: totalPoints,
    nextLevelPoints: currentTier.nextPoints,
    pointsToNext: currentTier.level === 7 ? 0 : pointsToNext,
  };
}

// Retrieves current user Glow Points breakdown and level progress.
export async function getUserRewards(userId) {
  try {
    let rewards = await prisma.rewardPoints.findUnique({
      where: { userId },
    });

    if (!rewards) {
      rewards = {
        patiencePoints: 0,
        balancePoints: 0,
        completionPoints: 0,
      };
    }

    const totalPoints = rewards.patiencePoints + rewards.balancePoints + rewards.completionPoints;
    const levelInfo = calculateLevel(totalPoints);

    return {
      patiencePoints: rewards.patiencePoints,
      balancePoints: rewards.balancePoints,
      completionPoints: rewards.completionPoints,
      totalPoints,
      ...levelInfo,
    };
  } catch (error) {
    logError(`Error fetching rewards for user ${userId}`, error);
    throw error;
  }
}

// Awards points to user across patience, balance, and completion categories.
export async function awardPoints(userId, { patience = 0, balance = 0, completion = 0 }) {
  try {
    const rewards = await prisma.rewardPoints.upsert({
      where: { userId },
      create: {
        userId,
        patiencePoints: patience,
        balancePoints: balance,
        completionPoints: completion,
      },
      update: {
        patiencePoints: { increment: patience },
        balancePoints: { increment: balance },
        completionPoints: { increment: completion },
      },
    });

    const totalPoints = rewards.patiencePoints + rewards.balancePoints + rewards.completionPoints;
    const levelInfo = calculateLevel(totalPoints);

    logInfo(`[Rewards] User ${userId} awarded +${patience} patience, +${balance} balance, +${completion} completion. Total: ${totalPoints}`);

    return {
      patiencePoints: rewards.patiencePoints,
      balancePoints: rewards.balancePoints,
      completionPoints: rewards.completionPoints,
      totalPoints,
      ...levelInfo,
    };
  } catch (error) {
    logError(`Error awarding points to user ${userId}`, error);
    throw error;
  }
}
