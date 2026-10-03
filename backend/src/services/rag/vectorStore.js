// In-memory vector database holding precomputed dish embeddings for fast RAG search.
// Loads indian-dishes.embeddings.json at module load time and calculates cosine similarity scores.
// Used by ragRetriever to identify top candidate dishes for vision AI classifications.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dishesWithVectors = [];

// Calculates cosine similarity scalar between two equal-length floating point arrays.
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Loads precomputed embeddings file from disk into RAM memory.
export function initializeVectorStore() {
  const filePath = path.resolve(__dirname, '../../data/indian-dishes.embeddings.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      dishesWithVectors = JSON.parse(data);
      logInfo(`[VECTOR STORE] Loaded ${dishesWithVectors.length} dish embeddings into memory.`);
    } else {
      logError(`[VECTOR STORE] Embeddings dataset file missing at ${filePath}. Fallback text matching active.`);
      dishesWithVectors = [];
    }
  } catch (error) {
    logError('[VECTOR STORE] Failed to load embeddings file', error);
    dishesWithVectors = [];
  }
}

// Auto-initialize vector store at module startup for zero query latency
initializeVectorStore();

// Searches in-memory vectors for top K matches ordered by highest cosine similarity.
export function findSimilar(queryVector, topK = 3) {
  if (!dishesWithVectors || dishesWithVectors.length === 0) {
    initializeVectorStore();
  }

  if (!queryVector || dishesWithVectors.length === 0) {
    return [];
  }

  const scored = dishesWithVectors.map((dish) => {
    const score = cosineSimilarity(queryVector, dish.vector);
    return { dish, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// Returns all loaded dish entities currently held in memory.
export function getAllDishes() {
  if (!dishesWithVectors || dishesWithVectors.length === 0) {
    initializeVectorStore();
  }
  return dishesWithVectors;
}
