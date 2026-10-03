// RAG retriever querying vector store embeddings and Fuse.js fuzzy text fallback.
// Implements confidence score thresholding (0.85 high confidence, 0.70-0.85 clarification options).
// Logs RetrievalMiss records to Prisma database when similarity drops below confidence thresholds.

import Fuse from 'fuse.js';
import { embedText } from './embeddingClient.js';
import { findSimilar, getAllDishes } from './vectorStore.js';
import { prisma } from '../../config/prisma.js';
import { logInfo, logError } from '../../utils/logger.js';

// Initializes Fuse.js instance over loaded dish dataset for fuzzy text fallback.
function createFuseInstance() {
  const dishes = getAllDishes();
  return new Fuse(dishes, {
    keys: ['name', 'aliases'],
    threshold: 0.4,
  });
}

// Retrieves dish candidate matches using embedding cosine similarity and fuzzy text fallback.
export async function retrieveDish(description) {
  try {
    const cleanDesc = (description || '').trim().toLowerCase();
    const allDishes = getAllDishes();

    // Fast exact name or alias match check (<1ms response time)
    const exactMatch = allDishes.find(
      (d) =>
        d.name.toLowerCase() === cleanDesc ||
        d.aliases.some((a) => a.toLowerCase() === cleanDesc)
    );

    if (exactMatch) {
      return {
        matchType: 'direct',
        dish: exactMatch,
        confidence: 'high',
        score: 1.0,
        clarificationOptions: [],
      };
    }

    let queryVector = null;
    try {
      queryVector = await embedText(description);
    } catch (embedError) {
      logError('[RAG RETRIEVER] Vector embedding failed, falling back to Fuse.js', embedError);
    }

    if (queryVector) {
      const topMatches = findSimilar(queryVector, 3);
      if (topMatches.length > 0) {
        const topMatch = topMatches[0];

        // High confidence match (>= 0.85)
        if (topMatch.score >= 0.85) {
          return {
            matchType: 'direct',
            dish: topMatch.dish,
            confidence: 'high',
            score: topMatch.score,
            clarificationOptions: [],
          };
        }

        // Medium confidence range (0.70 - 0.85) -> return top 3 clarification options
        if (topMatch.score >= 0.7) {
          return {
            matchType: 'clarification',
            dish: topMatch.dish,
            confidence: 'medium',
            score: topMatch.score,
            clarificationOptions: topMatches.map((m) => ({
              name: m.dish.name,
              defaultUnit: m.dish.defaultUnit,
              kcalPerStandardUnit: m.dish.kcalPerStandardUnit,
            })),
          };
        }
      }
    }

    // Fuzzy text search fallback with Fuse.js (< 0.70 embedding score or embedding failure)
    const fuse = createFuseInstance();
    const fuseResults = fuse.search(description);

    if (fuseResults.length > 0) {
      const bestFuse = fuseResults[0].item;
      return {
        matchType: 'fuzzy',
        dish: bestFuse,
        confidence: 'medium',
        score: 0.72,
        clarificationOptions: fuseResults.slice(0, 3).map((r) => ({
          name: r.item.name,
          defaultUnit: r.item.defaultUnit,
          kcalPerStandardUnit: r.item.kcalPerStandardUnit,
        })),
      };
    }

    // Record retrieval miss in database for analytics
    try {
      await prisma.retrievalMiss.create({
        data: {
          queryText: description,
          topMatchName: null,
          topMatchScore: 0,
        },
      });
    } catch (dbErr) {
      logError('[RAG RETRIEVER] Failed to log RetrievalMiss', dbErr);
    }

    // Generic fallback dish object
    return {
      matchType: 'generic_fallback',
      dish: {
        name: description || 'Indian Curry/Dish',
        aliases: [],
        category: 'general',
        defaultUnit: 'katori',
        kcalPerStandardUnit: 220,
        oneLineDescription: 'Generic Indian dish estimated average calories',
        dietType: 'veg',
      },
      confidence: 'low',
      score: 0.5,
      clarificationOptions: [],
    };
  } catch (error) {
    logError('[RAG RETRIEVER] Unexpected error during dish retrieval', error);
    return {
      matchType: 'generic_fallback',
      dish: {
        name: 'Indian Dish',
        defaultUnit: 'plate',
        kcalPerStandardUnit: 250,
      },
      confidence: 'low',
      score: 0.4,
      clarificationOptions: [],
    };
  }
}

// Logs user confirmed clarification choice into RetrievalMiss table for dataset self-enrichment.
export async function logResolvedClarification(queryText, resolvedDishName) {
  try {
    if (!queryText || !resolvedDishName) return;
    await prisma.retrievalMiss.create({
      data: {
        queryText: String(queryText),
        topMatchName: null,
        topMatchScore: null,
        resolvedDishName: String(resolvedDishName),
      },
    });
    logInfo(`[RAG RETRIEVER] Logged self-enriching signal: "${queryText}" -> "${resolvedDishName}"`);
  } catch (err) {
    logError('[RAG RETRIEVER] Failed to log resolved clarification feedback', err);
  }
}

