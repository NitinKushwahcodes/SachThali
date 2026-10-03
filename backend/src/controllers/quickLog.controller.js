// Controller executing quick-log natural language text parsing and calorie estimation.
// Receives typed Hinglish meal descriptions, extracts items via AI, and passes items to RAG retriever.
// Reuses nutritionEngine calculation pipeline to output scan-compatible meal breakdown JSON.

import { z } from 'zod';
import { callVisionAndText } from '../services/ai/aiService.js';
import { buildQuickLogPrompt } from '../services/ai/promptTemplates.js';
import { retrieveDish } from '../services/rag/ragRetriever.js';
import { calculateItemKcal } from '../services/nutritionEngine.js';

const quickLogSchema = z.object({
  text: z.string().min(1, 'Quick log text is required'),
});

const quickLogAiResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      portionUnit: z.string().optional().default('piece'),
      portionQty: z.number().optional().default(1),
      oilLevel: z.string().optional().default('normal'),
      description: z.string().optional().default(''),
    })
  ),
});

// Handles POST /quick-log endpoint parsing text descriptions into meal item entries.
export async function quickLogHandler(req, res, next) {
  try {
    const { text } = quickLogSchema.parse(req.body);
    const prompt = buildQuickLogPrompt(text);

    const aiResult = await callVisionAndText({
      prompt,
      imageBuffer: null,
      zodSchema: quickLogAiResultSchema,
      isVision: false,
    });

    const items = [];
    let totalKcal = 0;
    let totalKcalMin = 0;
    let totalKcalMax = 0;
    let needsClarification = false;
    let clarificationOptions = [];

    for (const item of aiResult.items) {
      const query = item.name;
      const ragResult = await retrieveDish(query);
      const dish = ragResult.dish;
      const portionQty = item.portionQty || 1;
      const portionUnit = item.portionUnit || dish.defaultUnit || 'piece';
      const oilLevel = item.oilLevel || 'normal';

      const kcalCalc = calculateItemKcal(dish.kcalPerStandardUnit, portionQty, oilLevel);

      items.push({
        name: dish.name,
        portionUnit,
        portionQty,
        kcalMin: kcalCalc.kcalMin,
        kcalMax: kcalCalc.kcalMax,
        kcal: kcalCalc.kcal,
        confidence: ragResult.confidence,
        oilLevel,
      });

      totalKcal += kcalCalc.kcal;
      totalKcalMin += kcalCalc.kcalMin;
      totalKcalMax += kcalCalc.kcalMax;

      if (ragResult.matchType === 'clarification') {
        needsClarification = true;
        clarificationOptions.push(...ragResult.clarificationOptions);
      }
    }

    res.status(200).json({
      items,
      totalKcalMin,
      totalKcalMax,
      totalKcal,
      needsClarification,
      clarificationOptions,
    });
  } catch (error) {
    next(error);
  }
}
