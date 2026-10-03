// Database seed script initializing starting data for Sachthali application.
// Seeds initial dish entries or test account records into Neon PostgreSQL database.
// Executed via npx prisma db seed during database setup workflows.

import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// Executes database seeding procedures.
export async function seedDatabase() {
  console.log('[SEED] Seeding database initial records...');
  
  const testEmail = 'testuser@sachthali.com';
  const existing = await prisma.user.findUnique({ where: { email: testEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        profile: {
          create: {
            goal: 'weight_loss',
            dietType: 'veg',
            heightCm: 170,
            weightKg: 68,
            ageRange: '18-25',
            activityLevel: 'medium',
            calorieTarget: 1932,
            proteinTargetG: 54,
            isEstimate: false,
          },
        },
      },
    });
    console.log(`[SEED] Created default test user: ${user.email}`);
  } else {
    console.log('[SEED] Test user already exists, skipping.');
  }

  await prisma.$disconnect();
}

seedDatabase().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
