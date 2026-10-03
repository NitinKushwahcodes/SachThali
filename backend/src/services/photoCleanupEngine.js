// Photo retention engine running background cron jobs to purge photo URLs older than 24 hours.
// Maintains privacy by removing image references from MealEntry records automatically.

import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { logInfo, logError } from '../utils/logger.js';

// Purges photo URLs from MealEntry records created more than 24 hours ago.
export async function cleanupExpiredPhotos() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.mealEntry.updateMany({
      where: {
        loggedAt: { lt: cutoff },
        photoUrl: { not: null },
      },
      data: {
        photoUrl: null,
      },
    });
    logInfo(`[Cron] 24h photo retention cleanup: cleared ${result.count} expired photo URLs.`);
    return result.count;
  } catch (error) {
    logError('[Cron] Failed to purge expired meal photos', error);
    throw error;
  }
}

// Starts hourly cron scheduler executing 24h photo retention cleanup.
export function startPhotoCleanupScheduler() {
  // Run at minute 0 of every hour
  cron.schedule('0 * * * *', () => {
    cleanupExpiredPhotos().catch(() => {});
  });
}
