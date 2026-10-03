// Controller handling rewards ("Glow Points") inspection and interaction handlers.
// Exposes GET /rewards and POST /rewards/skip-reward endpoints for client apps.

import { getUserRewards } from '../services/rewardsEngine.js';

// Handles GET /rewards returning user point breakdown and level progress.
export async function getRewardsHandler(req, res, next) {
  try {
    const rewards = await getUserRewards(req.user.userId);
    res.status(200).json(rewards);
  } catch (error) {
    next(error);
  }
}

// Handles POST /rewards/skip-reward allowing users to dismiss reward popups.
export async function skipRewardHandler(req, res, next) {
  try {
    const rewards = await getUserRewards(req.user.userId);
    res.status(200).json({ skipped: true, ...rewards });
  } catch (error) {
    next(error);
  }
}
