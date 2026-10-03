// Global error handling middleware for express application routing.
// Catches unhandled errors, Zod validation failures, and service exceptions.
// Formats uniform JSON error responses and prevents server crashes.

import { ZodError } from 'zod';
import { logError } from '../utils/logger.js';

// Express error handling middleware function receiving caught exceptions.
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const firstIssue = err.errors[0]?.message || 'Invalid input parameters';
    return res.status(400).json({
      error: firstIssue.startsWith('Invalid') ? firstIssue : `Validation failed: ${firstIssue}`,
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  logError('Unhandled exception caught in route handler', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}
