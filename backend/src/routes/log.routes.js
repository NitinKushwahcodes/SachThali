// Router module for daily meal logging, retrieval, and deletion endpoints.
// Allows users to submit confirmed meal entries, delete accidental entries, and retrieve daily budget statistics.
// Enforces user authentication across log query and mutation handlers.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getTodayLogHandler,
  getHistoryLogHandler,
  createLogEntryHandler,
  deleteMealEntryHandler,
} from '../controllers/log.controller.js';

const router = Router();

router.get('/today', authenticateToken, getTodayLogHandler);
router.get('/history', authenticateToken, getHistoryLogHandler);
router.post('/entry', authenticateToken, createLogEntryHandler);
router.delete('/meal/:mealId', authenticateToken, deleteMealEntryHandler);

export default router;
