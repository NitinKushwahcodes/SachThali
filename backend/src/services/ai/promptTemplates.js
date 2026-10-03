// Prompt template definitions for vision food analysis and AI coach message generation.
// Enforces structured JSON output schema instructions and Hinglish tone constraints.
// Supplied to aiService to guide Gemini and Groq model generations.

// Prompt template instructing vision AI to identify dishes and portions in uploaded photos.
export function buildVisionScanPrompt(hint = '', pieces = null) {
  let prompt = `Analyze this image (Indian cuisine, thalis, street foods, fast foods, snacks, noodles, rice, breads, fruits, fruit chaat, salads, juices, beverages).

IMPORTANT CLASSIFICATION & DISAMBIGUATION RULES:
1. NON-FOOD DETECTOR: If the photo does NOT contain any edible food or beverage item (e.g. shoe, book, wall, document, person, car, animal, electronic device, furniture, random non-edible object), set "isFood": false, "mealDescription": "No edible food detected in this photo. Please snap a clear photo of your food plate!", and "items": [].
2. FRUIT CHAAT vs STREET SNACKS: Distinguish carefully between Fruit Chaat / Mixed Fruit Salad vs Street Snacks (Pani Puri, Sev Puri, Samosa). If you see cut fruits (apple, papaya, pomegranate, banana, watermelon, grapes), classify strictly as "Fruit Chaat" or specific fruit name, NEVER Pani Puri / Sev Puri!
3. JUICES & BEVERAGES: For fresh fruit juices (Mosambi Juice, Orange Juice, Sugarcane Juice, Watermelon Juice, Coconut Water), identify as Juices with portion unit 'cup'!
4. SALADS & VEGGIES: For fresh raw vegetables/salads (Cucumber, Tomato, Green Salad, Sprouts), identify as Green Salad / Salads!
5. NOODLES vs RICE: Distinguish carefully between long strands/noodle dishes (Chowmein, Hakka Noodles) vs rice grains.
6. PANI PURI vs SAMOSA: Distinguish carefully between Pani Puri / Golgappe / Dahi Puri vs Samosa.

Return ONLY a valid JSON object matching this exact schema:
{
  "isFood": true,
  "mealDescription": "A concise one-sentence description of the food plate seen in the photo",
  "items": [
    {
      "name": "Exact or best-known name of dish (e.g. Fruit Chaat, Veg Chowmein, Pani Puri, Mosambi Juice)",
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
