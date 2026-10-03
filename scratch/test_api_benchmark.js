// Benchmark test script measuring API response times and verifying backend endpoints.
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
let cookieHeader = '';

async function benchmark() {
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

  // 4. GET /log/today (timing benchmark < 500ms)
  start = Date.now();
  const todayLogRes = await fetch(`${BASE_URL}/log/today`, {
    headers: { cookie: cookieHeader },
  });
  const todayLogTime = Date.now() - start;
  console.log(`[GET /log/today] ${todayLogTime}ms (Target: < 500ms) - Status: ${todayLogRes.status}`);

  // 5. POST /log/entry (timing benchmark < 500ms)
  start = Date.now();
  const logEntryRes = await fetch(`${BASE_URL}/log/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({
      items: [
        {
          dishName: 'Chole Bhature',
          portionUnit: 'plate',
          portionQty: 1,
          kcalMin: 903,
          kcalMax: 1222,
          kcal: 1063,
          confidence: 'high',
          oilLevel: 'high',
        },
      ],
    }),
  });
  const logEntryTime = Date.now() - start;
  console.log(`[POST /log/entry] ${logEntryTime}ms (Target: < 500ms) - Status: ${logEntryRes.status}`);

  // 6. GET /coach/message
  start = Date.now();
  const coachRes = await fetch(`${BASE_URL}/coach/message`, {
    headers: { cookie: cookieHeader },
  });
  const coachData = await coachRes.json();
  console.log(`[GET /coach/message] ${Date.now() - start}ms - Status: ${coachRes.status}`);
  console.log('Coach Response:', coachData);

  // 7. POST /scan with sample food photo (timing benchmark < 6s)
  const sampleImagePath = path.resolve('scratch/sample_idli.jpg');
  // Create a synthetic test image if missing
  try {
    await fs.access(sampleImagePath);
  } catch {
    // Generate a simple test image buffer using canvas or Sharp if needed
    const { default: sharp } = await import('sharp');
    const svg = `<svg width="400" height="400"><rect width="400" height="400" fill="#FAF7F2"/><circle cx="200" cy="200" r="80" fill="#FFFFFF"/><circle cx="150" cy="150" r="40" fill="#E08A3E"/></svg>`;
    await sharp(Buffer.from(svg)).jpeg().toFile(sampleImagePath);
  }

  const imageBuffer = await fs.readFile(sampleImagePath);
  const formData = new FormData();
  formData.append('photo', new Blob([imageBuffer], { type: 'image/jpeg' }), 'sample_idli.jpg');
  formData.append('hint', 'Idli with sambar');

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
  console.log('Total Kcal:', scanData.totalKcal);

  console.log('--- API Benchmark Complete ---');
}

benchmark().catch(console.error);
