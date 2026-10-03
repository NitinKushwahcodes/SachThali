// Backend API end-to-end benchmark test script measuring response times and verifying real AI calls.
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
let cookieHeader = '';

// Executes full end-to-end API test flow and measures response latencies.
export async function runBenchmark() {
  console.log('--- Starting API Benchmark & Functionality Verification ---');

  // 1. Signup
  let start = Date.now();
  const email = `user_${Date.now()}@test.com`;
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  cookieHeader = signupRes.headers.get('set-cookie') || '';
  const signupData = await signupRes.json();
  console.log(`[POST /auth/signup] ${Date.now() - start}ms - Status: ${signupRes.status}`, signupData);

  // 2. Auth /me
  start = Date.now();
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { cookie: cookieHeader },
  });
  console.log(`[GET /auth/me] ${Date.now() - start}ms - Status: ${meRes.status}`, await meRes.json());

  // 3. Post Profile
  start = Date.now();
  const profileRes = await fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({
      goal: 'weight_loss',
      dietType: 'veg',
      heightCm: 170,
      weightKg: 68,
      ageRange: '22',
      activityLevel: 'medium',
      hasMedicalContext: false,
    }),
  });
  const profileData = await profileRes.json();
  console.log(`[POST /profile] ${Date.now() - start}ms - Status: ${profileRes.status}`);
  console.log('Calculated calorieTarget:', profileData.calorieTarget, '(Expected: 1932)');

  // 4. GET /log/today (warm connection timing check)
  start = Date.now();
  const todayLogRes = await fetch(`${BASE_URL}/log/today`, {
    headers: { cookie: cookieHeader },
  });
  const todayLogTime = Date.now() - start;
  console.log(`[GET /log/today] ${todayLogTime}ms (Target: < 500ms) - Status: ${todayLogRes.status}`);

  // 5. POST /log/entry (warm connection timing check)
  start = Date.now();
  const logEntryRes = await fetch(`${BASE_URL}/log/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({
      items: [
        {
          dishName: 'Idli',
          portionUnit: 'piece',
          portionQty: 3,
          kcalMin: 148,
          kcalMax: 200,
          kcal: 174,
          confidence: 'high',
          oilLevel: 'normal',
        },
      ],
    }),
  });
  const logEntryTime = Date.now() - start;
  console.log(`[POST /log/entry] ${logEntryTime}ms (Target: < 500ms) - Status: ${logEntryRes.status}`);

  // 5b. Second POST /log/entry on warm pool
  start = Date.now();
  const logEntryRes2 = await fetch(`${BASE_URL}/log/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({
      items: [
        {
          dishName: 'Sambar',
          portionUnit: 'katori',
          portionQty: 1,
          kcalMin: 85,
          kcalMax: 115,
          kcal: 100,
          confidence: 'high',
          oilLevel: 'normal',
        },
      ],
    }),
  });
  const logEntryTime2 = Date.now() - start;
  console.log(`[POST /log/entry (warm)] ${logEntryTime2}ms (Target: < 500ms) - Status: ${logEntryRes2.status}`);

  // 6. GET /coach/message
  start = Date.now();
  const coachRes = await fetch(`${BASE_URL}/coach/message`, {
    headers: { cookie: cookieHeader },
  });
  const coachData = await coachRes.json();
  console.log(`[GET /coach/message] ${Date.now() - start}ms - Status: ${coachRes.status}`);
  console.log('Coach Response:', coachData);

  // 7. POST /scan with sample food photo
  const sampleImagePath = path.resolve(__dirname, 'sample_idli.jpg');
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#FAF7F2"/><circle cx="150" cy="200" r="60" fill="#FFFFFF"/><circle cx="250" cy="200" r="60" fill="#FFFFFF"/><circle cx="200" cy="280" r="40" fill="#E08A3E"/></svg>`;
  const imageBuffer = await sharp(Buffer.from(svg)).jpeg().toBuffer();

  const formData = new FormData();
  formData.append('photo', new Blob([imageBuffer], { type: 'image/jpeg' }), 'sample_idli.jpg');
  formData.append('hint', '3 Steamed Idli and Sambar');

  start = Date.now();
  const scanRes = await fetch(`${BASE_URL}/scan`, {
    method: 'POST',
    headers: { cookie: cookieHeader },
    body: formData,
  });
  const scanTime = Date.now() - start;
  const scanData = await scanRes.json();
  console.log(`[POST /scan] ${scanTime}ms (Target: < 6000ms) - Status: ${scanRes.status}`);
  console.log('Scan Items:', scanData.items);
  console.log('Total Kcal:', scanData.totalKcal, 'Needs Clarification:', scanData.needsClarification);

  console.log('--- API Benchmark Complete ---');
}

runBenchmark().catch(console.error);
