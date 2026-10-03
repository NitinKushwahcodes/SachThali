// Express router module mapping authentication endpoints to auth controller methods.
// Defines public routes for signup/login and protected routes for identity inspection.
// Connects authentication middleware to sensitive account operations.

import { Router } from 'express';
import { signupHandler, loginHandler, meHandler, logoutHandler } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Routes for user registration, login, profile check, and logout
router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.get('/me', authenticateToken, meHandler);
router.post('/logout', logoutHandler);

export default router;
