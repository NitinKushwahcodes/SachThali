// Express application setup configuring middleware, CORS, body parsing, and routing.
// Mounts authentication, profile, scan, log, coach, quick-log, barcode, push, payment, and rewards routes.
// Registers global rate limiting, raw body middleware for webhooks, and error handling components.

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createRateLimiter } from './config/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureAnonymousSession } from './middleware/ensureAnonymousSession.js';
import { startReminderScheduler } from './services/reminderEngine.js';
import { startPhotoCleanupScheduler } from './services/photoCleanupEngine.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import scanRoutes from './routes/scan.routes.js';
import logRoutes from './routes/log.routes.js';
import coachRoutes from './routes/coach.routes.js';
import quickLogRoutes from './routes/quickLog.routes.js';
import barcodeRoutes from './routes/barcode.routes.js';
import pushRoutes from './routes/push.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import rewardsRoutes from './routes/rewards.routes.js';

const app = express();

// Configure CORS for local development and SPA frontend credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Capture raw body for webhook HMAC signature verification
app.use((req, res, next) => {
  if (req.originalUrl === '/payment/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(ensureAnonymousSession);
app.use(createRateLimiter());

// Register API route modules
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/scan', scanRoutes);
app.use('/log', logRoutes);
app.use('/coach', coachRoutes);
app.use('/quick-log', quickLogRoutes);
app.use('/barcode', barcodeRoutes);
app.use('/push', pushRoutes);
app.use('/payment', paymentRoutes);
app.use('/rewards', rewardsRoutes);

// Root healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'sachthali-backend' });
});

// Initialize background schedulers
startReminderScheduler();
startPhotoCleanupScheduler();

// Global error handler
app.use(errorHandler);

export default app;
