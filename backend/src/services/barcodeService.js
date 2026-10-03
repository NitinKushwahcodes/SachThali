// Barcode scanning service fetching product nutrition data from OpenFoodFacts REST API.
// Queries openfoodfacts.org for EAN/UPC product barcodes without requiring API key authorization.
// Formats packaged food nutrition data into standard Sachthali meal item schema.

import { logInfo, logError } from '../utils/logger.js';

// Fetches product nutrition breakdown by barcode string from OpenFoodFacts API.
export async function lookupBarcodeProduct(code) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json`;
    logInfo(`[BARCODE SERVICE] Querying OpenFoodFacts for code: ${code}`);

    const res = await fetch(url);
    if (!res.ok) {
      return { needsClarification: true, items: [], totalKcal: 0 };
    }

    const data = await res.json();
    if (!data || data.status !== 1 || !data.product || (!data.product.product_name && !data.product.product_name_en)) {
      return { needsClarification: true, items: [], totalKcal: 0, clarificationOptions: [] };
    }

    const p = data.product;
    const nutriments = p.nutriments || {};
    const kcalPer100g =
      nutriments['energy-kcal_100g'] ||
      nutriments['energy-kcal_serving'] ||
      (nutriments['energy-kj_100g'] ? Math.round(nutriments['energy-kj_100g'] / 4.184) : 200);

    const productName = p.product_name || p.product_name_en || 'Packaged Food Item';
    const kcal = Math.round(kcalPer100g);
    const kcalMin = Math.round(kcal * 0.85);
    const kcalMax = Math.round(kcal * 1.15);

    return {
      items: [
        {
          name: productName,
          portionUnit: 'g',
          portionQty: 100,
          kcalMin,
          kcalMax,
          kcal,
          confidence: 'high',
          oilLevel: 'normal',
        },
      ],
      totalKcalMin: kcalMin,
      totalKcalMax: kcalMax,
      totalKcal: kcal,
      needsClarification: false,
      clarificationOptions: [],
    };
  } catch (error) {
    logError('[BARCODE SERVICE] OpenFoodFacts lookup error', error);
    return { needsClarification: true, items: [], totalKcal: 0 };
  }
}
