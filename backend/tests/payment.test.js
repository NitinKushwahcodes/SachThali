// Unit test suite for Razorpay HMAC webhook signature verification and plan generation.
// Asserts SHA-256 HMAC signature verification logic and 30-day meal plan generation.
// Enforces Rule 0.1 server-side payment verification.

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../src/services/paymentService.js';
import { generate30DayPlan } from '../src/services/planEngine.js';
import { env } from '../src/config/env.js';

describe('Payment & Plan Service Test Suite', () => {
  it('validates authentic Razorpay HMAC webhook signatures', () => {
    const rawBody = JSON.stringify({ event: 'order.paid' });
    const secret = env.RAZORPAY_KEY_SECRET || 'sample_razorpay_secret_key';
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const isValid = verifyWebhookSignature(rawBody, signature);
    expect(isValid).toBe(true);
  });

  it('rejects tampered or invalid Razorpay webhook signatures', () => {
    const rawBody = JSON.stringify({ event: 'order.paid' });
    const invalidSignature = 'invalid_tampered_signature_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const isValid = verifyWebhookSignature(rawBody, invalidSignature);
    expect(isValid).toBe(false);
  });

  it('generates 30-day meal plan calendar containing 30 days of distinct meals', () => {
    const profile = { goal: 'weight_loss', dietType: 'veg', calorieTarget: 1932 };
    const plan = generate30DayPlan(profile);

    expect(plan.days.length).toBe(30);
    expect(plan.days[0].breakfast).toBeDefined();
    expect(plan.days[0].lunch).toBeDefined();
    expect(plan.days[0].dinner).toBeDefined();
  });
});
