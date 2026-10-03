// Express router mapping payment order creation, webhook verification, and premium plan endpoints.
// Applies requireSubscription middleware exclusively to premium /plan and /weekly-report routes.
// Exposes unauthenticated webhook endpoint for Razorpay server-to-server signature validation.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireSubscription } from '../middleware/requireSubscription.js';
import {
  createOrderHandler,
  webhookHandler,
  getSubscriptionStatusHandler,
  getPlanHandler,
  getWeeklyReportHandler,
} from '../controllers/payment.controller.js';

const router = Router();

// Public webhook route (verified inside controller via Razorpay HMAC signature)
router.post('/webhook', webhookHandler);

// Protected subscription & order creation routes
router.post('/create-order', authenticateToken, createOrderHandler);
router.get('/status', authenticateToken, getSubscriptionStatusHandler);

// Gated premium route for 30-day meal plan
router.get('/plan', authenticateToken, requireSubscription, getPlanHandler);

// Un-gated weekly report route
router.get('/weekly-report', authenticateToken, getWeeklyReportHandler);

export default router;
