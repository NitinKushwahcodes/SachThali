// Prompt template definitions for vision food analysis and AI coach message generation.
// Enforces structured JSON output schema instructions and Hinglish tone constraints.
// Supplied to aiService to guide Gemini and Groq model generations.

// Prompt template instructing vision AI to identify dishes and portions in uploaded photos.
export function buildVisionScanPrompt(hint = '', pieces = null) {
  let prompt = `Analyze this food image (Indian cuisine, street foods, fast foods, thali, snacks, noodles, rice, breads).
IMPORTANT CLASSIFICATION RULES:
1. Distinguish carefully between long strands/noodle dishes (Chowmein, Hakka Noodles, Schezwan Noodles) vs rice grains (Fried Rice, Biryani, Pulao). If you see long noodle strands, classify as Chowmein / Noodles!
2. Distinguish carefully between Pani Puri / Golgappe / Dahi Puri vs Samosa.
3. Distinguish carefully between Momos vs Dumplings / Samosa.

Return ONLY a valid JSON object matching this exact schema:
{
  "mealDescription": "A concise one-sentence description of the plate of food seen in the photo",
  "items": [
    {
      "name": "Exact or best-known name of dish (e.g. Veg Chowmein, Pani Puri, Steamed Momos)",
      "portionUnit": "piece | katori | plate | cup | g",
      "portionQty": 1.0,
      "description": "Short description of the dish item"
    }
  ]
}`;

  if (hint) {
    prompt += `\nCRITICAL USER SPECIFIED DETAIL / DISH HINT: "${hint}". Use this exact detail to disambiguate dish names, oil levels, variants, and ingredients!`;
  }
  if (pieces) {
    prompt += `\nUser specified portion quantity hint: ${pieces} pieces/units.`;
  }

  return prompt;
}

// Prompt template constructing single-sentence Hinglish AI coach guidance.
export function buildCoachPrompt(context) {
  return `You are Sachthali's friendly Indian AI nutrition coach.
Write ONE short, friendly Hinglish sentence using only these numbers:
Context JSON: ${JSON.stringify(context)}

Rules:
1. Never invent numbers not given in the context JSON.
2. Never suggest skipping meals or exercising to compensate.
3. Keep the response to exactly ONE concise sentence in natural Hinglish.
4. ${context.hasMedicalContext ? "Since hasMedicalContext is true, end the sentence with: 'Apne doctor/dietitian se bhi check kar lena.'" : ''}
Return ONLY a JSON object: { "message": "Your one Hinglish sentence here." }`;
}

// Prompt template instructing text AI to extract food items, portions, and oil levels from typed user input.
export function buildQuickLogPrompt(text) {
  return `Extract all food dishes, portion sizes, and oil levels mentioned in this user text log:
User Input: "${text}"

Return ONLY a valid JSON object matching this exact schema:
{
  "items": [
    {
      "name": "Standard name of the dish (e.g. Roti, Dal Tadka, Ghee)",
      "portionUnit": "piece | katori | plate | cup | g",
      "portionQty": 1.0,
      "oilLevel": "low | normal | high",
      "description": "Short description of extracted item"
    }
  ]
}`;
}
