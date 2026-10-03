// Router module handling AI coach message generation endpoints.
// Evaluates today's calorie budget status and returns context-aware Hinglish guidance.
// Connects coach engine services to authenticated HTTP GET endpoints.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getCoachMessageHandler } from '../controllers/coach.controller.js';

const router = Router();

router.get('/message', authenticateToken, getCoachMessageHandler);

export default router;
