// Router module handling food photo scanning endpoints.
// Accepts multipart image uploads, executes vision AI and RAG dish lookup pipelines.
// Returns estimated portion ranges and calorie calculations to the frontend.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  scanHandler,
  recomputeItemHandler,
  recomputeMealHandler,
  resolveClarificationHandler,
} from '../controllers/scan.controller.js';

const router = Router();

router.post('/', authenticateToken, upload.single('photo'), scanHandler);
router.post('/recompute-item', authenticateToken, recomputeItemHandler);
router.post('/recompute-meal', authenticateToken, recomputeMealHandler);
router.post('/resolve', authenticateToken, resolveClarificationHandler);

export default router;
