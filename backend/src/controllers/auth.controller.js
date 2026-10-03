// Controller for user authentication endpoints (signup, login, me, logout).
// Validates input request bodies using Zod schemas and invokes authService methods.
// Sets httpOnly cookies for session state management and returns sanitized user JSON data.

import { z } from 'zod';
import { registerUser, loginUser, generateToken, getCookieOptions } from '../services/authService.js';
import { prisma } from '../config/prisma.js';

const authSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Handles POST /auth/signup endpoint for registering new accounts.
export async function signupHandler(req, res, next) {
  try {
    const { email, password } = authSchema.parse(req.body);
    const user = await registerUser(email, password);
    const token = generateToken(user);

    res.cookie('token', token, getCookieOptions());
    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    next(error);
  }
}

// Handles POST /auth/login endpoint for authenticating user credentials.
export async function loginHandler(req, res, next) {
  try {
    const { email, password } = authSchema.parse(req.body);
    const user = await loginUser(email, password);
    const token = generateToken(user);

    res.cookie('token', token, getCookieOptions());
    res.status(200).json({ id: user.id, email: user.email });
  } catch (error) {
    next(error);
  }
}

// Handles GET /auth/me endpoint returning current authenticated user context.
export async function meHandler(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      hasProfile: !!user.profile,
      visitCount: user.visitCount || 1,
      lastVisitAt: user.lastVisitAt,
    });
  } catch (error) {
    next(error);
  }
}

// Handles POST /auth/logout endpoint clearing httpOnly authentication cookie.
export async function logoutHandler(req, res) {
  res.clearCookie('token', getCookieOptions());
  res.status(200).json({ success: true });
}
