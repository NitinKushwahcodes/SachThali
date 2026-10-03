// Controller managing Web Push subscriptions and public VAPID key distribution.
// Stores browser push subscription endpoints and keys in Prisma PushSubscription model.
// Returns VAPID public key required for frontend PushManager subscription registration.

import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// Handles POST /push/subscribe endpoint storing user browser push credentials.
export async function subscribePushHandler(req, res, next) {
  try {
    const { endpoint, keys } = pushSubscribeSchema.parse(req.body);

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.userId,
        keys,
      },
      create: {
        userId: req.user.userId,
        endpoint,
        keys,
      },
    });

    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
}

// Handles GET /push/vapid-key endpoint returning public key for WebPush subscription.
export async function getVapidKeyHandler(req, res) {
  res.status(200).json({ publicKey: env.VAPID_PUBLIC_KEY });
}
