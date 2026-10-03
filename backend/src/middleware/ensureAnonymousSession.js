// Middleware ensuring every visitor has an anonymous User session and httpOnly 'sid' cookie.
// Generates random deviceToken, creates User record, signs JWT, and sets cookie on first visit.
// Enables guest-first food scanning without requiring email/password registration.

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { logInfo, logError } from '../utils/logger.js';

// Ensures an anonymous user session exists for every request via 'sid' httpOnly cookie.
export async function ensureAnonymousSession(req, res, next) {
  try {
    const token = req.cookies?.sid || req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const targetId = decoded.userId || decoded.id;
        
        if (targetId) {
          const user = await prisma.user.findUnique({
            where: { id: targetId },
            include: { profile: true },
          });

          if (user) {
            const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
            const now = new Date();
            let currentVisitCount = user.visitCount || 1;
            let currentLastVisitAt = user.lastVisitAt || now;

            if (now - new Date(currentLastVisitAt) > FOUR_HOURS_MS) {
              currentVisitCount += 1;
              currentLastVisitAt = now;
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  visitCount: currentVisitCount,
                  lastVisitAt: currentLastVisitAt,
                },
              });
            }

            req.user = {
              id: user.id,
              userId: user.id,
              deviceToken: user.deviceToken,
              hasProfile: !!user.profile,
              visitCount: currentVisitCount,
              lastVisitAt: currentLastVisitAt,
              hasHealthCondition: !!user.profile?.hasHealthCondition,
              goal: user.profile?.goal || 'weight_loss',
            };
            return next();
          }
        }
      } catch (err) {
        // Token invalid or expired, fallback to creating fresh session below
      }
    }

    // Generate new anonymous user session
    const deviceToken = crypto.randomBytes(24).toString('hex');
    const newUser = await prisma.user.create({
      data: {
        deviceToken,
      },
      include: { profile: true },
    });

    const sessionToken = jwt.sign({ userId: newUser.id, id: newUser.id }, env.JWT_SECRET, {
      expiresIn: '365d',
    });

    const isProd = env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    };

    res.cookie('sid', sessionToken, cookieOptions);
    res.cookie('token', sessionToken, cookieOptions);

    req.user = {
      id: newUser.id,
      userId: newUser.id,
      deviceToken: newUser.deviceToken,
      hasProfile: false,
    };

    logInfo(`[ANONYMOUS SESSION] Created anonymous user session: ${newUser.id}`);
    next();
  } catch (error) {
    logError('[ANONYMOUS SESSION] Failed to ensure anonymous session', error);
    next(error);
  }
}
