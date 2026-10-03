// Core mathematical engine for BMR, TDEE, portion scaling, and calorie targets.
// Contains exact deterministic math formulas for Mifflin-St Jeor, activity multipliers, and goal adjustments.
// Evaluates calorie safety floors, meal verdict classifications, and item calorie ranges.

// Helper to parse age from numeric value or string range (e.g., "18-25" -> 21.5, "22" -> 22)
export function parseAge(ageInput) {
  if (!ageInput) return 25; // default fallback if age missing
  if (typeof ageInput === 'number') return ageInput;
  const str = String(ageInput).trim();
  if (str.includes('-')) {
    const parts = str.split('-').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2;
    }
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 25 : parsed;
}

// Calculates oil multiplier based on low (0.90), normal (1.00), or high (1.25) level.
export function getOilMultiplier(oilLevel) {
  switch (oilLevel?.toLowerCase()) {
    case 'low':
      return 0.9;
    case 'high':
      return 1.25;
    case 'normal':
    default:
      return 1.0;
  }
}

// Computes item calorie range (min, max, nominal) given base unit kcal, qty, and oil level.
export function calculateItemKcal(baseKcalPerUnit, portionQty = 1, oilLevel = 'normal') {
  const oilMult = getOilMultiplier(oilLevel);
  const itemKcalRaw = baseKcalPerUnit * portionQty * oilMult;
  const kcal = Math.round(itemKcalRaw);
  const kcalMin = Math.round(itemKcalRaw * 0.85);
  const kcalMax = Math.round(itemKcalRaw * 1.15);

  return { kcal, kcalMin, kcalMax };
}

// Computes user BMR, TDEE, daily calorieTarget, and proteinTargetG from profile metrics.
export function calculateProfileTargets(profile) {
  const { heightCm, weightKg, ageRange, activityLevel, goal } = profile;

  // Rule 6.7: Missing height or weight fallback
  if (!heightCm || !weightKg) {
    return {
      calorieTarget: 1800,
      proteinTargetG: 60,
      isEstimate: true,
      note: null,
    };
  }

  const age = parseAge(ageRange);

  // Rule 6.3: Sex-neutral Mifflin-St Jeor BMR average
  const maleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const femaleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const bmr = (maleBmr + femaleBmr) / 2;

  // Rule 6.4: Activity multiplier
  let actMult = 1.5; // default medium
  if (activityLevel === 'low') actMult = 1.2;
  if (activityLevel === 'high') actMult = 1.8;
  if (activityLevel === 'medium') actMult = 1.5;

  const tdee = bmr * actMult;

  // Rule 6.5: Goal adjustment
  let rawTarget = tdee;
  if (goal === 'weight_loss') rawTarget = tdee - 400;
  else if (goal === 'weight_gain') rawTarget = tdee + 400;
  // general_health, skin, medical, just_checking -> TDEE

  let calorieTarget = Math.round(rawTarget);
  let note = null;
  let isEstimate = false;

  // Rule 6.6: Calorie floor (hard safety clamp at 1200)
  if (calorieTarget < 1200) {
    calorieTarget = 1200;
    isEstimate = true;
    note = 'This is a safe minimum — please check with a doctor or dietitian before going lower.';
  }

  // Rule 6.8: Protein target
  const proteinTargetG = Math.round(weightKg * 0.8);

  return {
    calorieTarget,
    proteinTargetG,
    isEstimate,
    note,
  };
}

// Evaluates meal calories against remaining daily budget to return verdict and delta.
export function evaluateMealVerdict(calorieTarget, todayTotalSoFar, newItemKcal) {
  const remaining = calorieTarget - todayTotalSoFar;
  let verdict = 'under';
  let deltaKcal = newItemKcal - remaining;

  if (newItemKcal > remaining) {
    verdict = 'over';
  } else {
    // on_track if newItemKcal is within 90-110% of remaining
    const lowerBound = remaining * 0.9;
    const upperBound = remaining * 1.1;
    if (newItemKcal >= lowerBound && newItemKcal <= upperBound) {
      verdict = 'on_track';
    } else {
      verdict = 'under';
    }
  }

  return {
    verdict,
    remaining,
    deltaKcal,
  };
}

// Calculates food health tier score (1-5) and descriptive label per Part D3 & Phase 4 specs.
export function calculateFoodTier({
  itemKcal,
  remainingKcal = 1800,
  isFried = false,
  highOil = false,
  highSugar = false,
  proteinG = 0,
  fiberG = 0,
  goal = 'weight_loss',
  hasHealthCondition = false,
  hasMedicalContext = false,
}) {
  let score = 60; // neutral starting point

  const denom = Math.max(remainingKcal || 1800, 1);
  const budgetRatio = itemKcal / denom;
  if (budgetRatio > 1.0) score -= 30;
  else if (budgetRatio > 0.6) score -= 15;
  else if (budgetRatio < 0.25) score += 10;

  if (isFried || highOil) score -= 15;
  if (highSugar) score -= 10;

  // Part H: Extra -10 penalty for fried/highOil/highSugar if user has a health condition
  if ((hasHealthCondition || hasMedicalContext) && (isFried || highOil || highSugar)) {
    score -= 10;
  }

  const caloriesFromProtein = proteinG * 4;
  if ((goal === 'weight_loss' || goal === 'weight_gain') && itemKcal > 0 && caloriesFromProtein / itemKcal >= 0.15) {
    score += 15;
  }

  if (fiberG >= 3) score += 5;

  score = Math.max(0, Math.min(100, score));

  let tier = 3;
  let tierLabel = 'Okay in Moderation';

  if (score <= 20) {
    tier = 1;
    tierLabel = 'Avoid This One';
  } else if (score <= 40) {
    tier = 2;
    tierLabel = 'Better to Skip';
  } else if (score <= 60) {
    tier = 3;
    tierLabel = 'Okay in Moderation';
  } else if (score <= 80) {
    tier = 4;
    tierLabel = 'Good Choice Today';
  } else {
    tier = 5;
    tierLabel = 'Perfect for You';
  }

  return { score, tier, tierLabel };
}
