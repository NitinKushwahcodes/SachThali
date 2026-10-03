// Validation script for indian-dishes.json dataset.
// Validates schema types, positive calorie values, unique dish names, and required fields.

import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/indian-dishes.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const dishes = JSON.parse(rawData);

console.log(`[VALIDATION] Total entries found in JSON: ${dishes.length}`);

const requiredFields = [
  'name',
  'aliases',
  'category',
  'defaultUnit',
  'kcalPerStandardUnit',
  'proteinGPerUnit',
  'carbsGPerUnit',
  'fatGPerUnit',
  'fiberGPerUnit',
  'isFried',
  'highOil',
  'highSugar',
  'oneLineDescription',
  'dietType',
];

const nameSet = new Set();
const dishIdSet = new Set();
let errors = 0;

dishes.forEach((dish, idx) => {
  // Check required fields
  for (const field of requiredFields) {
    if (dish[field] === undefined || dish[field] === null) {
      console.error(`[ERROR] Item #${idx + 1} (${dish.name || 'UNNAMED'}) missing required field: ${field}`);
      errors++;
    }
  }

  // Check unique name
  const lowerName = (dish.name || '').trim().toLowerCase();
  if (nameSet.has(lowerName)) {
    console.error(`[ERROR] Duplicate dish name found: "${dish.name}"`);
    errors++;
  } else {
    nameSet.add(lowerName);
  }

  // Check numeric constraints
  if (typeof dish.kcalPerStandardUnit !== 'number' || dish.kcalPerStandardUnit <= 0 || dish.kcalPerStandardUnit > 2000) {
    console.error(`[ERROR] Item "${dish.name}" has invalid kcal: ${dish.kcalPerStandardUnit}`);
    errors++;
  }

  if (typeof dish.proteinGPerUnit !== 'number' || dish.proteinGPerUnit < 0) {
    console.error(`[ERROR] Item "${dish.name}" has invalid proteinGPerUnit`);
    errors++;
  }

  if (typeof dish.carbsGPerUnit !== 'number' || dish.carbsGPerUnit < 0) {
    console.error(`[ERROR] Item "${dish.name}" has invalid carbsGPerUnit`);
    errors++;
  }

  if (typeof dish.fatGPerUnit !== 'number' || dish.fatGPerUnit < 0) {
    console.error(`[ERROR] Item "${dish.name}" has invalid fatGPerUnit`);
    errors++;
  }

  if (typeof dish.fiberGPerUnit !== 'number' || dish.fiberGPerUnit < 0) {
    console.error(`[ERROR] Item "${dish.name}" has invalid fiberGPerUnit`);
    errors++;
  }

  if (!Array.isArray(dish.aliases)) {
    console.error(`[ERROR] Item "${dish.name}" aliases must be an array`);
    errors++;
  }

  if (typeof dish.isFried !== 'boolean' || typeof dish.highOil !== 'boolean' || typeof dish.highSugar !== 'boolean') {
    console.error(`[ERROR] Item "${dish.name}" boolean flags (isFried, highOil, highSugar) must be booleans`);
    errors++;
  }
});

if (errors === 0) {
  console.log(`✅ [VALIDATION SUCCESS] All ${dishes.length} dishes validated cleanly with zero schema errors.`);
  process.exit(0);
} else {
  console.error(`❌ [VALIDATION FAILED] Found ${errors} validation errors.`);
  process.exit(1);
}
