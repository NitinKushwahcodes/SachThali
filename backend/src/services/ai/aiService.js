// Primary AI service orchestrating Gemini 2.5 Flash and Groq llama-3.3-70b fallback chain.
// Handles multimodal vision photo analysis and text coach message generation with JSON schema validation.
// Enforces 8s timeouts, model retries, fence stripping, and typed 503 error propagation.

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { logInfo, logError } from '../../utils/logger.js';

let genAiClient = null;
let groqClient = null;

// Helper returning GoogleGenerativeAI SDK instance initialized with GEMINI_API_KEY.
function getGenAiInstance() {
  if (!genAiClient) {
    genAiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAiClient;
}

// Helper returning Groq SDK instance initialized with GROQ_API_KEY.
function getGroqInstance() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClient;
}

// Strips code fences (e.g. ```json ... ```) from model raw response strings.
function stripJsonFences(text) {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// Executes a promise with an enforced timeout duration in milliseconds.
function withTimeout(promise, ms = 8000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI execution timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

// Calls Gemini model with text prompt and optional image buffer.
async function callGemini(modelName, prompt, imageBuffer = null) {
  const ai = getGenAiInstance();
  const model = ai.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const parts = [];
  if (imageBuffer) {
    parts.push({
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    });
  }
  parts.push(prompt);

  const response = await model.generateContent(parts);
  const rawText = response?.response?.text();
  return stripJsonFences(rawText);
}

// Calls Groq llama-3.3-70b-versatile for text-only fallback tasks.
async function callGroq(prompt) {
  const groq = getGroqInstance();
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });
  const rawText = completion.choices[0]?.message?.content || '';
  return stripJsonFences(rawText);
}

// Executes fallback chain across Gemini Flash, Gemini Flash-Lite, and Groq text fallback.
export async function callVisionAndText({ prompt, imageBuffer = null, zodSchema, isVision = false }) {
  const primaryModel = 'gemini-3.6-flash';
  const liteModel = 'gemini-3.5-flash-lite';

  // Step 1: Try Gemini Flash
  try {
    logInfo(`[AI SERVICE] Attempting primary model: ${primaryModel}`);
    const rawJson = await withTimeout(callGemini(primaryModel, prompt, imageBuffer), 8000);
    const parsed = JSON.parse(rawJson);
    return zodSchema.parse(parsed);
  } catch (err1) {
    logError(`[AI SERVICE] Primary model ${primaryModel} failed: ${err1.message}`);
  }

  // Step 2: Retry once on Gemini Flash-Lite / 8b
  try {
    logInfo(`[AI SERVICE] Retrying with secondary model: ${liteModel}`);
    const rawJson = await withTimeout(callGemini(liteModel, prompt, imageBuffer), 8000);
    const parsed = JSON.parse(rawJson);
    return zodSchema.parse(parsed);
  } catch (err2) {
    logError(`[AI SERVICE] Secondary model ${liteModel} failed: ${err2.message}`);
  }

  // Step 3: Text-only tasks try Groq fallback; Vision tasks fail with 503
  if (!isVision && !imageBuffer) {
    try {
      logInfo('[AI SERVICE] Invoking Groq llama-3.3-70b-versatile text fallback');
      const rawJson = await withTimeout(callGroq(prompt), 8000);
      const parsed = JSON.parse(rawJson);
      return zodSchema.parse(parsed);
    } catch (err3) {
      logError(`[AI SERVICE] Groq fallback failed: ${err3.message}`);
    }
  }

  // Step 4: Final failure output
  const error = new Error('AI service busy, try again in a moment.');
  error.statusCode = 503;
  throw error;
}
