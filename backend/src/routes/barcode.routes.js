// Express router module mapping barcode scanning POST /barcode endpoint.
// Protects barcode lookup requests with authentication middleware.
// Connects barcode controller handler to incoming Express requests.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { barcodeHandler } from '../controllers/barcode.controller.js';

const router = Router();

router.post('/', authenticateToken, barcodeHandler);

export default router;
