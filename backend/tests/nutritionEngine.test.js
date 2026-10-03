// Unit test suite verifying nutrition engine calculations against Section 7 and Phase 4 spec requirements.
// Asserts exact mathematical outputs for worked examples, G1 tier labels, G2 independent per-item scoring, and H health condition penalties.

import { describe, it, expect } from 'vitest';
import {
  calculateItemKcal,
  calculateProfileTargets,
  evaluateMealVerdict,
  calculateFoodTier,
} from '../src/services/nutritionEngine.js';

describe('nutritionEngine Worked Examples', () => {
  it('Example A — Idli/Sambar, medium confidence, no profile height/weight', () => {
    const idli = calculateItemKcal(58, 3, 'normal');
    expect(idli.kcal).toBe(174);
    expect(idli.kcalMin).toBe(148);
    expect(idli.kcalMax).toBe(200);

    const sambar = calculateItemKcal(100, 1, 'normal');
    expect(sambar.kcal).toBe(100);
    expect(sambar.kcalMin).toBe(85);
    expect(sambar.kcalMax).toBe(115);

    const totalKcal = idli.kcal + sambar.kcal;
    const totalKcalMin = idli.kcalMin + sambar.kcalMin;
    const totalKcalMax = idli.kcalMax + sambar.kcalMax;

    expect(totalKcal).toBe(274);
    expect(totalKcalMin).toBe(233);
    expect(totalKcalMax).toBe(315);

    const profileTargets = calculateProfileTargets({
      goal: 'general_health',
      heightCm: null,
      weightKg: null,
    });

    expect(profileTargets.calorieTarget).toBe(1800);
    expect(profileTargets.isEstimate).toBe(true);

    const verdict = evaluateMealVerdict(profileTargets.calorieTarget, 0, totalKcal);
    expect(verdict.verdict).toBe('under');
  });

  it('Example B — Chole Bhature, high oil, weight-loss profile', () => {
    const profileTargets = calculateProfileTargets({
      goal: 'weight_loss',
      heightCm: 170,
      weightKg: 68,
      ageRange: '22',
      activityLevel: 'medium',
    });

    expect(profileTargets.calorieTarget).toBe(1932);

    const choleBhature = calculateItemKcal(850, 1, 'high');
    expect(choleBhature.kcal).toBe(1063);
    expect(choleBhature.kcalMin).toBe(903);
    expect(choleBhature.kcalMax).toBe(1222);

    const verdict = evaluateMealVerdict(profileTargets.calorieTarget, 900, choleBhature.kcal);
    expect(verdict.verdict).toBe('over');
    expect(verdict.deltaKcal).toBe(31);
  });

  it('Example C — Missing height/weight AND missing oilLevel (defaults to "normal")', () => {
    const profileTargets = calculateProfileTargets({
      goal: 'weight_loss',
      hasMedicalContext: true,
      heightCm: null,
      weightKg: null,
    });

    expect(profileTargets.calorieTarget).toBe(1800);
    expect(profileTargets.isEstimate).toBe(true);

    const dishKcal = calculateItemKcal(100, 1, undefined);
    expect(dishKcal.kcal).toBe(100);
  });

  it('Part D3 Worked Example 1 — Chole Bhature Tier Calculation with Phase 4 Label', () => {
    const res = calculateFoodTier({
      itemKcal: 1063,
      remainingKcal: 600,
      isFried: true,
      highOil: true,
      highSugar: false,
      proteinG: 20,
      fiberG: 8,
      goal: 'weight_loss',
    });

    expect(res.score).toBe(20);
    expect(res.tier).toBe(1);
    expect(res.tierLabel).toBe('Avoid This One');
  });

  it('Part D3 Worked Example 2 — Idli+Sambar Combo Tier Calculation with Phase 4 Label', () => {
    const res = calculateFoodTier({
      itemKcal: 274,
      remainingKcal: 900,
      isFried: false,
      highOil: false,
      highSugar: false,
      proteinG: 12,
      fiberG: 4,
      goal: 'weight_loss',
    });

    expect(res.score).toBe(80);
    expect(res.tier).toBe(4);
    expect(res.tierLabel).toBe('Good Choice Today');
  });

  it('Part G2 — BUG FIX: Independent Per-Item Tier Scoring for a 3-Item Meal', () => {
    const remainingKcal = 1200;

    // Item 1: Heavy fried Bhatura (itemKcal = 800, fried/highOil) -> score 30 (Tier 2 "Better to Skip")
    const item1Tier = calculateFoodTier({
      itemKcal: 800,
      remainingKcal,
      isFried: true,
      highOil: true,
      highSugar: false,
      proteinG: 6,
      fiberG: 1,
      goal: 'weight_loss',
    });

    // Item 2: Fresh Cucumber Salad (itemKcal = 40, light, high fiber) -> score 85 (Tier 5 "Perfect for You")
    const item2Tier = calculateFoodTier({
      itemKcal: 40,
      remainingKcal,
      isFried: false,
      highOil: false,
      highSugar: false,
      proteinG: 2,
      fiberG: 3,
      goal: 'weight_loss',
    });

    // Item 3: Sweet Gulab Jamun (itemKcal = 1300, over budget, highSugar, fried) -> score 5 (Tier 1 "Avoid This One")
    const item3Tier = calculateFoodTier({
      itemKcal: 1300,
      remainingKcal,
      isFried: true,
      highOil: true,
      highSugar: true,
      proteinG: 2,
      fiberG: 0,
      goal: 'weight_loss',
    });

    // Assert that each item receives its OWN distinct tier based on its own metrics
    expect(item1Tier.tier).toBe(2); // "Better to Skip"
    expect(item2Tier.tier).toBe(5); // "Perfect for You"
    expect(item3Tier.tier).toBe(1); // "Avoid This One"

    // Prove that all 3 items returned DIFFERENT tiers from each other
    expect(item1Tier.tier).not.toBe(item2Tier.tier);
    expect(item2Tier.tier).not.toBe(item3Tier.tier);
    expect(item1Tier.tier).not.toBe(item3Tier.tier);
  });

  it('Part H — Health Condition Bounded Penalty (-10 for indulgent items)', () => {
    // Normal user without health condition
    const normalUserTier = calculateFoodTier({
      itemKcal: 200,
      remainingKcal: 1500,
      isFried: true,
      highOil: true,
      highSugar: false,
      proteinG: 4,
      fiberG: 1,
      hasHealthCondition: false,
    });

    // User with health condition (hasHealthCondition = true)
    const healthUserTier = calculateFoodTier({
      itemKcal: 200,
      remainingKcal: 1500,
      isFried: true,
      highOil: true,
      highSugar: false,
      proteinG: 4,
      fiberG: 1,
      hasHealthCondition: true,
    });

    // Assert extra -10 points deducted for health condition user on fried/highOil items
    expect(normalUserTier.score).toBe(55);
    expect(healthUserTier.score).toBe(45);
    expect(healthUserTier.score).toBe(normalUserTier.score - 10);
  });
});
