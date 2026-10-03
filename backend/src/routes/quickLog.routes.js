// Express router mapping typed natural language meal logging endpoints.
// Connects authentication middleware to POST /quick-log endpoint.
// Invokes quickLogHandler to process Hinglish meal text inputs.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { quickLogHandler } from '../controllers/quickLog.controller.js';

const router = Router();

router.post('/', authenticateToken, quickLogHandler);

export default router;
