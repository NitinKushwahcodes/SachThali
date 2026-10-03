// Scan processing pipeline linking Sharp image optimization, vision AI, RAG, and nutrition math.
// Implements rich scan results with macros, tier scoring, family variants, live recomputation, and <8s performance optimization.
// Discards uploaded image buffer from RAM after scan processing finishes.

import sharp from 'sharp';
import { z } from 'zod';
import { callVisionAndText } from './ai/aiService.js';
import { buildVisionScanPrompt } from './ai/promptTemplates.js';
import { retrieveDish } from './rag/ragRetriever.js';
import { getAllDishes } from './rag/vectorStore.js';
import { calculateFoodTier, getOilMultiplier } from './nutritionEngine.js';
import { logInfo, logError } from '../utils/logger.js';

const visionResultSchema = z.object({
  isFood: z.boolean().optional().default(true),
  mealDescription: z.string().optional().default('Plate with identified Indian dishes'),
  items: z.array(
    z.object({
      name: z.string(),
      portionUnit: z.string().optional().default('piece'),
      portionQty: z.number().optional().default(1),
      description: z.string().optional().default(''),
    })
  ).optional().default([]),
});

// Resizes and converts raw input image buffer to JPEG format for efficient AI processing.
export async function optimizeImage(buffer) {
  return await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// Formats a single dish item into Part D1 rich schema item with macros, tier, and family variants.
export function formatRichItem({
  dish,
  portionQty = 1,
  portionUnit,
  oilLevel = 'normal',
  ragResult = {},
  remainingKcal = 1800,
  goal = 'weight_loss',
  hasHealthCondition = false,
  hasMedicalContext = false,
}) {
  const pQty = portionQty !== undefined ? portionQty : 1;
  const pUnit = portionUnit || dish.defaultUnit || 'piece';
  const oilMult = getOilMultiplier(oilLevel);

  const baseKcal = dish.kcalPerStandardUnit || 150;
  const kcal = Math.round(baseKcal * pQty * oilMult);
  const kcalMin = Math.round(kcal * 0.85);
  const kcalMax = Math.round(kcal * 1.15);

  const proteinG = Math.round((dish.proteinGPerUnit || 5) * pQty);
  const carbsG = Math.round((dish.carbsGPerUnit || 20) * pQty);
  const fatG = Math.round((dish.fatGPerUnit || 5) * pQty * oilMult);
  const fiberG = Math.round((dish.fiberGPerUnit || 2) * pQty);

  const tierCalc = calculateFoodTier({
    itemKcal: kcal,
    remainingKcal,
    isFried: !!dish.isFried,
    highOil: !!dish.highOil,
    highSugar: !!dish.highSugar,
    proteinG,
    fiberG,
    goal,
    hasHealthCondition: hasHealthCondition || hasMedicalContext,
  });

  const score = ragResult.score !== undefined ? ragResult.score : 0.85;
  const confidencePercent = Math.round(score * 100);
  let confidenceLabel = 'High';
  if (confidencePercent < 60) confidenceLabel = 'Low';
  else if (confidencePercent < 85) confidenceLabel = 'Medium';

  const dishId = dish.dishId || dish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Find family variants if dish has a family
  let familyVariants = [];
  if (dish.family) {
    const all = getAllDishes();
    familyVariants = all
      .filter((d) => d.family === dish.family)
      .map((d) => ({
        dishId: d.dishId || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: d.name,
      }));
  }

  const portionText = `${pQty} ${pUnit}${pQty > 1 ? 's' : ''}`;

  return {
    id: `item-${dishId}-${Math.random().toString(36).substring(2, 7)}`,
    dishId,
    name: dish.name,
    confidencePercent,
    confidenceLabel,
    portionText,
    portionQty: pQty,
    portionUnit: pUnit,
    oilLevel,
    kcal,
    kcalMin,
    kcalMax,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    isFried: !!dish.isFried,
    highOil: !!dish.highOil,
    highSugar: !!dish.highSugar,
    tier: pQty === 0 ? 0 : tierCalc.tier,
    tierLabel: pQty === 0 ? 'Not Included' : tierCalc.tierLabel,
    familyVariants,
  };
}

// Formats aggregate totals object for Part D1 rich scan results.
export function formatMealTotals(items, remainingKcal = 1800, goal = 'weight_loss', hasHealthCondition = false) {
  const includedItems = items.filter((i) => (i.portionQty !== undefined ? i.portionQty > 0 : true));

  if (includedItems.length === 0) {
    return {
      kcal: 0,
      kcalMarginPercent: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      tier: 6,
      tierLabel: 'No Food Detected 🚫',
      isNonFood: true,
    };
  }

  const kcal = includedItems.reduce((sum, i) => sum + (i.kcal || 0), 0);
  const proteinG = includedItems.reduce((sum, i) => sum + (i.proteinG || 0), 0);
  const carbsG = includedItems.reduce((sum, i) => sum + (i.carbsG || 0), 0);
  const fatG = includedItems.reduce((sum, i) => sum + (i.fatG || 0), 0);
  const fiberG = includedItems.reduce((sum, i) => sum + (i.fiberG || 0), 0);

  const isFried = includedItems.some((i) => i.isFried);
  const highOil = includedItems.some((i) => i.highOil);
  const highSugar = includedItems.some((i) => i.highSugar);

  const mealTier = calculateFoodTier({
    itemKcal: kcal,
    remainingKcal,
    isFried,
    highOil,
    highSugar,
    proteinG,
    fiberG,
    goal,
    hasHealthCondition,
  });

  return {
    kcal,
    kcalMarginPercent: 25,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    tier: mealTier.tier,
    tierLabel: mealTier.tierLabel,
  };
}

// Executes full food photo scanning workflow with timing metrics and parallel RAG retrieval.
export async function processFoodScan({ imageBuffer, hint = '', pieces = null, oilLevel = 'normal', remainingKcal = 1800, goal = 'weight_loss' }) {
  const startTime = Date.now();
  logInfo('[SCAN TIMING] Starting scan pipeline execution');

  // Step 1: Optimize image
  const t0 = Date.now();
  const optimizedBuffer = await optimizeImage(imageBuffer);
  logInfo(`[SCAN TIMING] Image optimization completed in ${Date.now() - t0}ms`);

  // Step 2: Gemini Vision API call
  const prompt = buildVisionScanPrompt(hint, pieces);
  const t1 = Date.now();
  const aiResult = await callVisionAndText({
    prompt,
    imageBuffer: optimizedBuffer,
    zodSchema: visionResultSchema,
    isVision: true,
  });
  logInfo(`[SCAN TIMING] Gemini Vision call completed in ${Date.now() - t1}ms`);

  // NON-FOOD SCAN CHECK: If Gemini detects non-food photo or 0 items
  if (aiResult.isFood === false || !aiResult.items || aiResult.items.length === 0) {
    logInfo('[SCAN PIPELINE] Non-food image detected by Gemini Vision');
    return {
      isNonFood: true,
      mealDescription: aiResult.mealDescription || 'No edible food detected in this photo. Please upload a clear photo of your food plate!',
      items: [],
      totals: {
        kcal: 0,
        kcalMarginPercent: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        tier: 6,
        tierLabel: 'No Food Detected 🚫',
        isNonFood: true,
      },
      totalKcalMin: 0,
      totalKcalMax: 0,
      totalKcal: 0,
      needsClarification: false,
      clarificationOptions: [],
    };
  }

  // Step 3: Parallel RAG Dish Retrieval using Promise.all
  const t2 = Date.now();
  const itemRetrievalPromises = aiResult.items.map(async (item) => {
    let query = item.description ? `${item.name} - ${item.description}` : item.name;
    const lower = (query + ' ' + (hint || '')).toLowerCase();

    // Query routing guards for Fruit Chaat, Salads, Juices, and Noodles
    if (lower.includes('fruit chaat') || lower.includes('fruit salad') || lower.includes('mixed fruit') || lower.includes('cut fruit')) {
      query = 'Fruit Chaat';
    } else if (lower.includes('mosambi juice') || lower.includes('sweet lime juice')) {
      query = 'Mosambi Juice';
    } else if (lower.includes('orange juice') || lower.includes('santra juice')) {
      query = 'Orange Juice';
    } else if (lower.includes('sugarcane juice') || lower.includes('ganne ka ras')) {
      query = 'Sugarcane Juice';
    } else if (lower.includes('nariyal paani') || lower.includes('coconut water')) {
      query = 'Nariyal Paani (Coconut Water)';
    } else if (lower.includes('watermelon juice') || lower.includes('tarbooz juice')) {
      query = 'Watermelon Juice';
    } else if (lower.includes('green salad') || lower.includes('kheera salad') || lower.includes('cucumber salad')) {
      query = 'Green Salad';
    } else if (lower.includes('sprout') && lower.includes('salad')) {
      query = 'Sprouted Moong Salad';
    } else if (lower.includes('noodle') || lower.includes('chowmein') || lower.includes('chow mein')) {
      if (!lower.includes('chicken') && !lower.includes('egg')) {
        query = 'Veg Chowmein';
      }
    }

    const ragResult = await retrieveDish(query);
    return { item, ragResult };
  });

  const retrievedResults = await Promise.all(itemRetrievalPromises);
  logInfo(`[SCAN TIMING] Parallel RAG dish retrieval for ${retrievedResults.length} items completed in ${Date.now() - t2}ms`);

  const items = [];
  let totalKcalMin = 0;
  let totalKcalMax = 0;
  let needsClarification = false;
  let clarificationOptions = [];

  for (const { item, ragResult } of retrievedResults) {
    const dish = ragResult.dish;

    const richItem = formatRichItem({
      dish,
      portionQty: item.portionQty || 1,
      portionUnit: item.portionUnit || dish.defaultUnit || 'piece',
      oilLevel,
      ragResult,
      remainingKcal,
      goal,
    });

    items.push(richItem);
    totalKcalMin += richItem.kcalMin;
    totalKcalMax += richItem.kcalMax;

    if (ragResult.matchType === 'clarification') {
      needsClarification = true;
      clarificationOptions.push(...ragResult.clarificationOptions);
    }
  }

  const totals = formatMealTotals(items, remainingKcal, goal);

  const totalTime = Date.now() - startTime;
  logInfo(`[SCAN TIMING] Total scan pipeline executed in ${totalTime}ms`);

  return {
    isNonFood: false,
    mealDescription: aiResult.mealDescription || 'Plate of identified Indian food items',
    items,
    totals,
    totalKcalMin,
    totalKcalMax,
    totalKcal: totals.kcal,
    needsClarification,
    clarificationOptions,
  };
}

// Part D2: Pure nutrition lookup and item recomputation for variant switching (<300ms).
export function recomputeItem({ dishId, portionQty = 1, portionUnit, oilLevel = 'normal', remainingKcal = 1800, goal = 'weight_loss' }) {
  const all = getAllDishes();
  const targetId = (dishId || '').toLowerCase();
  
  let dish = all.find((d) => (d.dishId || '').toLowerCase() === targetId || d.name.toLowerCase() === targetId);

  if (!dish) {
    dish = {
      dishId: dishId || 'generic',
      name: dishId || 'Custom Dish',
      defaultUnit: portionUnit || 'piece',
      kcalPerStandardUnit: 200,
    };
  }

  return formatRichItem({
    dish,
    portionQty,
    portionUnit,
    oilLevel,
    ragResult: { score: 0.95 },
    remainingKcal,
    goal,
  });
}

// Part D5: Pure aggregate meal totals recomputation (<300ms).
export function recomputeMeal({ items = [], remainingKcal = 1800, goal = 'weight_loss' }) {
  const all = getAllDishes();

  const formattedItems = items.map((item) => {
    const targetId = (item.dishId || item.name || '').toLowerCase();
    let dish = all.find((d) => (d.dishId || '').toLowerCase() === targetId || d.name.toLowerCase() === targetId);

    if (!dish) {
      dish = {
        dishId: item.dishId || 'generic',
        name: item.name || 'Custom Dish',
        defaultUnit: item.portionUnit || 'piece',
        kcalPerStandardUnit: item.kcal || 200,
        proteinGPerUnit: item.proteinG || 5,
        carbsGPerUnit: item.carbsG || 20,
        fatGPerUnit: item.fatG || 5,
        fiberGPerUnit: item.fiberG || 2,
        isFried: !!item.isFried,
        highOil: !!item.highOil,
        highSugar: !!item.highSugar,
      };
    }

    return formatRichItem({
      dish,
      portionQty: item.portionQty || 1,
      portionUnit: item.portionUnit || dish.defaultUnit || 'piece',
      oilLevel: item.oilLevel || 'normal',
      ragResult: { score: 0.9 },
      remainingKcal,
      goal,
    });
  });

  return formatMealTotals(formattedItems, remainingKcal, goal);
}
