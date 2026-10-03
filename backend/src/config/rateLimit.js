// Configures Express rate limiting middleware for api endpoints.
// Adjusts rate window and max request thresholds dynamically based on NODE_ENV (dev vs prod).
// Protects the server against DDoS and API abuse while allowing high limit developer iteration.

import rateLimit from 'express-rate-limit';

// Creates a rate limiter instance based on current environment settings.
export function createRateLimiter() {
  const isDev = process.env.NODE_ENV === 'development';

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: isDev ? 1000 : 100, // 1000 requests in dev, 100 in production
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: 'Too many requests, please try again later.',
    },
  });
}
