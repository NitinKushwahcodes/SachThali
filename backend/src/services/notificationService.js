// Web Push notification service configuring VAPID keys and sending push payloads.
// Wraps web-push library to deliver encrypted push notifications to browser endpoints.
// Utilized by reminderEngine to alert users about scheduled meal logging prompts.

import webPush from 'web-push';
import { env } from '../config/env.js';
import { logInfo, logError } from '../utils/logger.js';

// Initializes web-push VAPID details with public key, private key, and contact mailto.
export function initWebPush() {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
      env.VAPID_SUBJECT || 'mailto:admin@sachthali.com',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    logInfo('[NOTIFICATION SERVICE] Web Push VAPID keys initialized successfully.');
  } else {
    logError('[NOTIFICATION SERVICE] VAPID keys missing in env configuration.');
  }
}

// Sends encrypted Web Push payload to browser endpoint subscription object.
export async function sendPushNotification(pushSub, payload) {
  try {
    initWebPush();
    const subscriptionObj = {
      endpoint: pushSub.endpoint,
      keys: typeof pushSub.keys === 'string' ? JSON.parse(pushSub.keys) : pushSub.keys,
    };

    const payloadString = JSON.stringify(payload);
    await webPush.sendNotification(subscriptionObj, payloadString);
    logInfo(`[NOTIFICATION SERVICE] Push notification delivered to ${pushSub.endpoint.slice(0, 30)}...`);
    return true;
  } catch (error) {
    logError('[NOTIFICATION SERVICE] Push notification delivery failed', error);
    return false;
  }
}
