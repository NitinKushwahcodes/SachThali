// Express router mapping push notification subscription endpoints.
// Connects authentication middleware to POST /push/subscribe.
// Exposes public GET /push/vapid-key endpoint for client push manager registration.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { subscribePushHandler, getVapidKeyHandler } from '../controllers/push.controller.js';

const router = Router();

router.get('/vapid-key', getVapidKeyHandler);
router.post('/subscribe', authenticateToken, subscribePushHandler);

export default router;
