// Integration test suite verifying RAG retriever dish matching and fuzzy text fallback logic.
// Tests retrieval confidence scoring, direct match handling, and fallback behavior.
// Runs using Vitest for backend service verification.

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeVectorStore } from '../src/services/rag/vectorStore.js';
import { retrieveDish } from '../src/services/rag/ragRetriever.js';

describe('RAG Retriever Test Suite', () => {
  beforeAll(() => {
    initializeVectorStore();
  });

  it('retrieves crisp exact/alias dish matches via Fuse.js or vector store', async () => {
    const result = await retrieveDish('Idli');
    expect(result.dish).toBeDefined();
    expect(result.dish.name).toBe('Idli');
  });

  it('handles unknown dishes with fallback structure', async () => {
    const result = await retrieveDish('UnknownExoticFruitItem999');
    expect(result.dish).toBeDefined();
    expect(result.confidence).toBe('low');
  });
});
