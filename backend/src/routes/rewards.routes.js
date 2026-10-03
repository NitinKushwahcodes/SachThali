// Express router mapping Glow Points rewards endpoints (/rewards, /rewards/skip-reward).
// Applies authenticateToken middleware ensuring session context for all reward requests.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getRewardsHandler, skipRewardHandler } from '../controllers/rewards.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getRewardsHandler);
router.post('/skip-reward', skipRewardHandler);

export default router;
