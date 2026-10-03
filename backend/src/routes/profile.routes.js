// Router module handling profile management endpoints.
// Interacts with user profile controller to fetch and upsert dietary and physical targets.
// Protects profile updates with authentication middleware.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getProfileHandler, upsertProfileHandler } from '../controllers/profile.controller.js';

const router = Router();

router.get('/', authenticateToken, getProfileHandler);
router.post('/', authenticateToken, upsertProfileHandler);

export default router;
