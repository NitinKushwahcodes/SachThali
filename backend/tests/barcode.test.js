// Unit test suite verifying OpenFoodFacts barcode lookup service parsing and fallback behavior.
// Asserts fallback structure handling when barcode products are not found.
// Executed with Vitest for service layer verification.

import { describe, it, expect } from 'vitest';
import { lookupBarcodeProduct } from '../src/services/barcodeService.js';

describe('Barcode Service Test Suite', () => {
  it('returns needsClarification fallback for invalid/non-existent barcode string', async () => {
    const result = await lookupBarcodeProduct('99999999999999999999');
    expect(result.needsClarification).toBe(true);
    expect(result.items.length).toBe(0);
  });
});
