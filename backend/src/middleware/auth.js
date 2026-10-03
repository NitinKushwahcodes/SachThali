// Authentication middleware verifying JWT tokens from httpOnly cookies.
// Protects private backend routes by validating user session state and credentials.
// Attaches decoded user payload (userId, email) to the Express request object.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Verifies JWT token present in request cookies or authorization header.
export function authenticateToken(req, res, next) {
  if (req.user && (req.user.userId || req.user.id)) {
    return next();
  }

  const token = req.cookies?.sid || req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
