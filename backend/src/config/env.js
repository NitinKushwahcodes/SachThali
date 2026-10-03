// Loads and validates required environment variables for the Sachthali backend.
// Ensures critical API keys, database credentials, and secrets are present before application startup.
// Halts execution immediately with clear diagnostic logs if mandatory variables are missing.

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validates that required environment variables exist and are non-empty.
export function validateEnv() {
  // In test environment or CI execution, supply mock fallbacks for missing keys
  if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.CI) {
    if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = 'mock_gemini_api_key_ci_testing_123';
    if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/sachthalidb';
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'mock_jwt_secret_key_ci_testing_123';
    return;
  }

  const mandatoryKeys = ['GEMINI_API_KEY', 'DATABASE_URL', 'JWT_SECRET'];
  const missingKeys = [];

  for (const key of mandatoryKeys) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    console.error('\n==================================================');
    console.error('CRITICAL CONFIGURATION ERROR: Missing Mandatory Environment Variables!');
    missingKeys.forEach((key) => {
      console.error(`- Mandatory Variable "${key}" is missing or empty in backend/.env`);
    });
    console.error('Please configure all required variables to proceed.');
    console.error('==================================================\n');
    process.exit(1);
  }
}

export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_sachthali_prod_2026',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:admin@sachthali.com',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || '',
  AWS_S3_REGION: process.env.AWS_S3_REGION || 'ap-south-1',
};
