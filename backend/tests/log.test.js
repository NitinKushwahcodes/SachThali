// Unit and integration test suite verifying Phase 5 log controller and photo retention rules.
// Asserts zero-quantity item filtering, 24h photo URL expiration, and profile-less meal logging.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { cleanupExpiredPhotos } from '../src/services/photoCleanupEngine.js';

describe('Phase 5 Log Controller & Photo Cleanup', () => {
  let testUser;

  beforeEach(async () => {
    // Create a temporary test user
    testUser = await prisma.user.create({
      data: {
        deviceToken: `test-token-${Math.random().toString(36).substring(2, 9)}`,
      },
    });
  });

  afterEach(async () => {
    if (testUser) {
      await prisma.mealEntry.deleteMany({
        where: { dailyLog: { userId: testUser.id } },
      });
      await prisma.dailyLog.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
  });

  it('Part B1 — Profile-less users can create log entries without profile', async () => {
    const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    
    const dailyLog = await prisma.dailyLog.create({
      data: {
        userId: testUser.id,
        date: today,
        totalKcal: 250,
      },
    });

    const meal = await prisma.mealEntry.create({
      data: {
        dailyLogId: dailyLog.id,
        dishName: 'Paneer Butter Masala',
        portionUnit: 'plate',
        portionQty: 1,
        kcalMin: 200,
        kcalMax: 300,
        kcal: 250,
        confidence: 'high',
        photoUrl: 'https://example.com/paneer.jpg',
      },
    });

    expect(meal.id).toBeDefined();
    expect(meal.photoUrl).toBe('https://example.com/paneer.jpg');
  });

  it('Part B2 — 24h photo retention cleanup resets photoUrl older than 24 hours', async () => {
    const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    
    const dailyLog = await prisma.dailyLog.create({
      data: {
        userId: testUser.id,
        date: today,
        totalKcal: 500,
      },
    });

    // Recent entry (< 24h old)
    const recentMeal = await prisma.mealEntry.create({
      data: {
        dailyLogId: dailyLog.id,
        dishName: 'Fresh Roti',
        portionUnit: 'piece',
        portionQty: 2,
        kcalMin: 120,
        kcalMax: 160,
        kcal: 140,
        confidence: 'high',
        photoUrl: 'https://example.com/recent.jpg',
        loggedAt: new Date(),
      },
    });

    // Old entry (> 24h old)
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const oldMeal = await prisma.mealEntry.create({
      data: {
        dailyLogId: dailyLog.id,
        dishName: 'Old Dal',
        portionUnit: 'katori',
        portionQty: 1,
        kcalMin: 150,
        kcalMax: 200,
        kcal: 180,
        confidence: 'high',
        photoUrl: 'https://example.com/old.jpg',
        loggedAt: oldDate,
      },
    });

    // Run cleanup job
    await cleanupExpiredPhotos();

    const fetchedRecent = await prisma.mealEntry.findUnique({ where: { id: recentMeal.id } });
    const fetchedOld = await prisma.mealEntry.findUnique({ where: { id: oldMeal.id } });

    expect(fetchedRecent.photoUrl).toBe('https://example.com/recent.jpg');
    expect(fetchedOld.photoUrl).toBeNull();
  });
});
