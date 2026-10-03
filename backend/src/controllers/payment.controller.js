// Controller handling payment order creation, webhook verification, and premium feature queries.
// Enforces server-side Razorpay webhook signature validation before marking subscriptions as paid.
// Serves gated 30-day meal plans and 7-day progress reports to subscribed users.

import { prisma } from '../config/prisma.js';
import { createSubscriptionOrder, verifyWebhookSignature, handlePaymentWebhook } from '../services/paymentService.js';
import { generate30DayPlan } from '../services/planEngine.js';
import { generateWeeklyReport } from '../services/reportEngine.js';

// Handles POST /payment/create-order endpoint creating Razorpay checkout order.
export async function createOrderHandler(req, res, next) {
  try {
    const plan = req.body?.plan || 'monthly';
    const orderData = await createSubscriptionOrder(req.user.userId, plan);
    res.status(200).json(orderData);
  } catch (error) {
    next(error);
  }
}

// Handles POST /payment/webhook server-to-server webhook endpoint verifying HMAC signatures.
export async function webhookHandler(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    await handlePaymentWebhook(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Handles GET /payment/status returning authenticated user subscription state.
export async function getSubscriptionStatusHandler(req, res, next) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.userId },
    });

    const now = new Date();
    const isPaid =
      subscription &&
      subscription.status === 'paid' &&
      subscription.expiresAt &&
      new Date(subscription.expiresAt) > now;

    res.status(200).json({
      isPaid: !!isPaid,
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

// Handles GET /payment/plan returning 30-day meal plan for active subscribers.
export async function getPlanHandler(req, res, next) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    const plan = generate30DayPlan(profile);
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
}

// Handles GET /payment/weekly-report returning 7-day aggregated progress metrics.
export async function getWeeklyReportHandler(req, res, next) {
  try {
    const report = await generateWeeklyReport(req.user.userId);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
}
