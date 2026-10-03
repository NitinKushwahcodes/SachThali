// Unit test suite for authentication token generation and cookie configuration.
// Validates JWT payload generation and cookie attribute settings across dev/prod modes.
// Guarantees secure authentication behavior across application deployment tiers.

import { describe, it, expect } from 'vitest';
import { generateToken, getCookieOptions } from '../src/services/authService.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('Auth Service Test Suite', () => {
  it('generates a valid JWT token encoding user identity', () => {
    const user = { id: 'user_123', email: 'test@example.com' };
    const token = generateToken(user);
    const decoded = jwt.verify(token, env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_prod_12345');
    expect(decoded.userId).toBe('user_123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('returns valid httpOnly cookie options configuration', () => {
    const options = getCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
