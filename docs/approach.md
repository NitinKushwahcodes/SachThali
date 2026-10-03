# Sachthali — Architectural & Technical Design Approach

This document outlines the core design decisions, mathematical models, AI processing pipeline, vector grounding architecture, and Vercel deployment setup for Sachthali.

---

## 1. Mathematical Nutrition Engine (`nutritionEngine.js`)

All calorie, TDEE, and macro calculations follow deterministic scientific formulas rather than LLM guesswork:

- **BMR Calculation**: Sex-neutral average of Mifflin-St Jeor equation:
  $$\text{Male BMR} = 10W + 6.25H - 5A + 5$$
  $$\text{Female BMR} = 10W + 6.25H - 5A - 161$$
  $$\text{BMR} = \frac{\text{Male BMR} + \text{Female BMR}}{2}$$
- **TDEE & Goal Adjustments**: Applied via activity multipliers ($1.2$, $1.5$, $1.8$) and goal offsets ($-400$ kcal for weight loss, $+400$ kcal for weight gain).
- **Calorie Safety Floor**: Clamped at a hard minimum of $1,200\text{ kcal/day}$.
- **Oil Level Multipliers**: Low ($0.9\times$), Normal ($1.0\times$), High ($1.25\times$).

---

## 2. AI Vision & Fast Food Vector Grounding Pipeline

1. **Image Optimization**: Sharp resizes incoming photo buffers to a maximum resolution of $1024\times1024\text{ px}$ in JPEG format.
2. **Gemini Vision Classification**: Prompt incorporates `"Add More Detail"` hints to guide dish identification, portion sizes, and oil levels.
3. **Parallel RAG Grounding**: `Promise.all` queries an in-memory vector store (`indian-dishes.embeddings.json` with 458 dishes) using cosine similarity to retrieve exact nutritional properties, family variants, and health scores.
4. **Distinct Food Families**:
   - `pani_puri`: Masala Dahi Pani Puri, Meetha Pani Puri, Khatta Teekha Pani Puri, Dahi Puri, Sev Puri, Bhel Puri (separated from `samosa`).
   - `noodles`: Veg Chowmein, Hakka Noodles, Schezwan Noodles, Egg Chowmein, Chicken Chowmein (separated from `rice`).
   - `momos`: Steamed Veg Momos, Fried Momos, Kurkure Momos, Paneer Momos, Chicken Momos.
   - `burger`, `sandwich`, `pizza`, `pasta`, `chinese`, `pav`, `roll`.

---

## 3. Privacy & 24-Hour Photo Storage Protocol

- **Photo Retention Policy**: Uploaded meal photos are stored solely on today's `MealEntry` records.
- **Automated Hourly Cron Job**: `photoCleanupEngine.js` executes an hourly `UPDATE` query resetting `photoUrl` to `null` for entries older than 24 hours:
  $$\text{loggedAt} < \text{Now} - 24\text{ hours}$$
- **History View Isolation**: The `GET /log/history` API strips `photoUrl` from returned datasets to guarantee privacy.

---

## 4. Glow Points & Mental Health Score Engine (`rewardsEngine.js`)

Glow Points act as a **Food Relationship & Mental Health Score** measuring guilt-free mindful eating habits, patience, and consistency without toxic diet pressure. Points are persisted in the `RewardPoints` table across three pillars:
- **Patience Points (+3)**: Scanning multi-item thalis and evaluating meals without rushing.
- **Balance Points (+5)**: Choosing nourishing, balanced meals ("Eat Freely" items) without starvation rules.
- **Completion Points (+2)**: Daily meal logging and setting user profiles.

### Level Progression Tiers
1. **Seed 💡**: 0 – 19 pts
2. **Sprout 🌱**: 20 – 49 pts
3. **Leaf 🍃**: 50 – 99 pts
4. **Bloom 🌸**: 100 – 199 pts
5. **Harvest 🌾**: 200 – 399 pts
6. **Master Thali 🍱**: 400 – 699 pts
7. **Nutrition Guru 👑**: 700+ pts

---

## 5. Vercel SPA Routing Configuration (`vercel.json`)

To prevent page refresh 404 errors on single-page application (SPA) client routes (`/scan`, `/log`, `/rewards`, `/coach`, `/profile`), `vercel.json` applies a rewrite rule mapping all requests to `/index.html`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This guarantees instantaneous client-side navigation and smooth page reloads on Vercel edge infrastructure.
