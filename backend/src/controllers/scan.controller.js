import { processFoodScan, recomputeItem, recomputeMeal } from '../services/scanPipeline.js';
import { logResolvedClarification } from '../services/rag/ragRetriever.js';

// Handles POST /scan endpoint for processing food image and optional user hints.
export async function scanHandler(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required for scan.' });
    }

    const { hint, pieces, oilLevel } = req.body;
    const result = await processFoodScan({
      imageBuffer: req.file.buffer,
      hint: hint || '',
      pieces: pieces ? parseFloat(pieces) : null,
      oilLevel: oilLevel || 'normal',
      remainingKcal: req.user?.remainingKcal || 1800,
      goal: req.user?.goal || 'weight_loss',
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Handles POST /scan/recompute-item endpoint for D2 variant switching (<300ms).
export async function recomputeItemHandler(req, res, next) {
  try {
    const { dishId, portionQty, portionUnit, oilLevel } = req.body;
    const item = recomputeItem({
      dishId,
      portionQty: portionQty ? parseFloat(portionQty) : 1,
      portionUnit,
      oilLevel: oilLevel || 'normal',
      remainingKcal: req.user?.remainingKcal || 1800,
      goal: req.user?.goal || 'weight_loss',
    });
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
}

// Handles POST /scan/recompute-meal endpoint for D5 live totals recalculation (<300ms).
export async function recomputeMealHandler(req, res, next) {
  try {
    const { items } = req.body;
    const totals = recomputeMeal({
      items: items || [],
      remainingKcal: req.user?.remainingKcal || 1800,
      goal: req.user?.goal || 'weight_loss',
    });
    res.status(200).json(totals);
  } catch (error) {
    next(error);
  }
}

// Handles POST /scan/resolve endpoint for logging user confirmed clarification selection.
export async function resolveClarificationHandler(req, res, next) {
  try {
    const { queryText, resolvedDishName } = req.body;
    await logResolvedClarification(queryText, resolvedDishName);
    res.status(200).json({ status: 'ok', logged: true });
  } catch (error) {
    next(error);
  }
}

