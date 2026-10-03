// Interface to Google Gemini API text-embedding-004 model.
// Converts dish text descriptions into 768-dimensional vector embeddings.
// Utilized by datasetBuilder for dataset indexing and ragRetriever for query vector creation.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

let genAIInstance = null;

// Returns initialized GoogleGenerativeAI SDK singleton instance.
function getGenAIInstance() {
  if (!genAIInstance) {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    genAIInstance = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

// Generates numeric vector embedding for provided text string using gemini-embedding-001.
export async function embedText(text) {
  const ai = getGenAIInstance();
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-embedding-001' });
    const response = await model.embedContent(text);
    if (response?.embedding?.values) {
      return response.embedding.values;
    }
  } catch (err1) {
    try {
      const fallbackModel = ai.getGenerativeModel({ model: 'text-embedding-004' });
      const response = await fallbackModel.embedContent(text);
      if (response?.embedding?.values) {
        return response.embedding.values;
      }
    } catch (err2) {
      throw new Error(`Failed to generate text embedding: ${err1.message}`);
    }
  }
  throw new Error('Invalid embedding response structure received from Gemini API.');
}
