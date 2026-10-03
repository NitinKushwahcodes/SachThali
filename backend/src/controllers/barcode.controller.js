// Controller for handling barcode scanner POST /barcode requests.
// Validates EAN/UPC product code string and invokes barcodeService lookup.
// Returns standardized item nutrition payload or clarification fallback signal.

import { z } from 'zod';
import { lookupBarcodeProduct } from '../services/barcodeService.js';

const barcodeSchema = z.object({
  code: z.string().min(3, 'Valid barcode is required'),
});

// Handles POST /barcode endpoint looking up packaged food items.
export async function barcodeHandler(req, res, next) {
  try {
    const { code } = barcodeSchema.parse(req.body);
    const result = await lookupBarcodeProduct(code);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
