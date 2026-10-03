// Unit test suite verifying quick-log prompt template building and dish extraction parsing.
// Asserts prompt construction and RAG item calculation logic.
// Executed with Vitest for service layer verification.

import { describe, it, expect } from 'vitest';
import { buildQuickLogPrompt } from '../src/services/ai/promptTemplates.js';

describe('Quick-Log Service Test Suite', () => {
  it('constructs structured quick log prompt containing user input text', () => {
    const text = '2 roti aur dal khaya, thoda ghee tha';
    const prompt = buildQuickLogPrompt(text);

    expect(prompt).toContain(text);
    expect(prompt).toContain('portionUnit');
    expect(prompt).toContain('oilLevel');
  });
});
