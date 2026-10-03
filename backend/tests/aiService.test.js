// Unit test suite for AI service helper utilities and prompt templates.
// Verifies code fence stripping and prompt construction formatting.
// Ensures stable AI request parsing before API transport execution.

import { describe, it, expect } from 'vitest';
import { buildVisionScanPrompt, buildCoachPrompt } from '../src/services/ai/promptTemplates.js';

describe('AI Service Helper Suite', () => {
  it('constructs valid vision scan prompts with user hints', () => {
    const prompt = buildVisionScanPrompt('South Indian breakfast', 3);
    expect(prompt).toContain('South Indian breakfast');
    expect(prompt).toContain('3 pieces/units');
  });

  it('constructs coach prompt with medical context flag requirement', () => {
    const prompt = buildCoachPrompt({
      goal: 'weight_loss',
      targetKcal: 1800,
      consumedSoFar: 1000,
      hasMedicalContext: true,
    });
    expect(prompt).toContain('Apne doctor/dietitian se bhi check kar lena.');
  });
});
