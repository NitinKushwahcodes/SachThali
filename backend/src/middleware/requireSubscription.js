// Middleware gating premium routes - updated in Phase 5 to grant free access to all features.
export async function requireSubscription(req, res, next) {
  next();
}

