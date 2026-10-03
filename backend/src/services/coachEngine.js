// AI Coach engine evaluating user daily calorie status and generating Hinglish guidance.
// Evaluates calorie budget deltas and constructs lean context payloads for LLM completion.
// Calls aiService with strict Zod validation schemas for single-sentence coach output.

import { z } from 'zod';
import { callVisionAndText } from './ai/aiService.js';
import { buildCoachPrompt } from './ai/promptTemplates.js';
import { evaluateMealVerdict } from './nutritionEngine.js';

const coachResultSchema = z.object({
  message: z.string(),
});

// Generates context JSON, calculates budget verdict, and queries AI for coach guidance sentence.
export async function generateCoachMessage({
  goal,
  targetKcal,
  consumedSoFar,
  newItem = null,
  todaysMealsSoFar = [],
  hasMedicalContext = false,
}) {
  const newItemKcal = newItem ? newItem.kcal : 0;
  const verdictObj = evaluateMealVerdict(targetKcal, consumedSoFar, newItemKcal);

  const contextJson = {
    goal,
    targetKcal,
    consumedSoFar,
    newItem,
    todaysMealsSoFar,
    verdict: verdictObj.verdict,
    deltaKcal: Math.abs(verdictObj.deltaKcal),
    hasMedicalContext,
  };

  const prompt = buildCoachPrompt(contextJson);

  try {
    const aiResult = await callVisionAndText({
      prompt,
      imageBuffer: null,
      zodSchema: coachResultSchema,
      isVision: false,
    });

    return {
      message: aiResult.message,
      verdict: verdictObj.verdict,
      deltaKcal: Math.abs(verdictObj.deltaKcal),
    };
  } catch (error) {
    // Fallback message if AI service fails
    let fallbackMsg = `Aapne aaj ${consumedSoFar} kcal consume kiya hai target ${targetKcal} kcal me se.`;
    if (verdictObj.verdict === 'over') {
      fallbackMsg = `Aapka calorie target ${Math.abs(verdictObj.deltaKcal)} kcal se surpass ho gaya hai, agla meal balanced rakhein!`;
    }
    if (hasMedicalContext) {
      fallbackMsg += ' Apne doctor/dietitian se bhi check kar lena.';
    }
    return {
      message: fallbackMsg,
      verdict: verdictObj.verdict,
      deltaKcal: Math.abs(verdictObj.deltaKcal),
    };
  }
}
