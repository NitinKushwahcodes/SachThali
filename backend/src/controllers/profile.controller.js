// Controller handling profile queries and upserts for physical and dietary goals.
// Calls nutritionEngine calculation functions to derive daily calorie and protein targets.
// Persists profile details to Prisma database and returns structured profile response JSON.

import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { calculateProfileTargets } from '../services/nutritionEngine.js';

const profileSchema = z.object({
  fullName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  age: z.number().positive().optional().nullable(),
  gender: z.enum(['male', 'female', 'prefer_not_to_say']).optional().nullable(),
  purpose: z.enum(['general', 'diet_tracking', 'calorie_tracking', 'weight_loss', 'weight_gain']).optional().nullable(),
  hasHealthCondition: z.boolean().optional().default(false),
  conditionDescription: z.string().optional().nullable(),
  conditionSeverity: z.enum(['mild', 'moderate', 'severe']).optional().nullable(),
  consultingDoctor: z.boolean().optional().nullable(),
  goal: z.enum(['weight_loss', 'weight_gain', 'general_health', 'skin', 'medical', 'just_checking']).optional().nullable(),
  dietType: z.enum(['veg', 'egg', 'non_veg', 'jain']).optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  ageRange: z.string().optional().nullable(),
  activityLevel: z.enum(['low', 'medium', 'high']).optional().nullable(),
  region: z.string().optional().nullable(),
  hasMedicalContext: z.boolean().optional().default(false),
});

// Handles GET /profile endpoint to fetch current user profile details.
export async function getProfileHandler(req, res, next) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

// Handles POST /profile endpoint for upserting user physical targets and diet preferences.
export async function upsertProfileHandler(req, res, next) {
  try {
    const body = profileSchema.parse(req.body);

    let goal = body.goal;
    if (!goal && body.purpose) {
      if (body.purpose === 'weight_loss') goal = 'weight_loss';
      else if (body.purpose === 'weight_gain') goal = 'weight_gain';
      else goal = 'general_health';
    }
    if (!goal) goal = 'general_health';

    const hasMedicalContext = body.hasHealthCondition !== undefined ? body.hasHealthCondition : body.hasMedicalContext;

    const payload = {
      ...body,
      goal,
      hasMedicalContext,
      ageRange: body.age ? String(body.age) : body.ageRange,
    };

    const calculated = calculateProfileTargets(payload);

    const profile = await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update: {
        ...payload,
        calorieTarget: calculated.calorieTarget,
        proteinTargetG: calculated.proteinTargetG,
        isEstimate: calculated.isEstimate,
      },
      create: {
        userId: req.user.userId,
        ...payload,
        calorieTarget: calculated.calorieTarget,
        proteinTargetG: calculated.proteinTargetG,
        isEstimate: calculated.isEstimate,
      },
    });

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}
