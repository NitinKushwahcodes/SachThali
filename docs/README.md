# Sachthali — AI-Powered Indian Nutrition & Calorie Tracker

Sachthali is an AI-driven, privacy-conscious nutrition application specifically designed for Indian cuisine, street foods, and dietary habits. It features photo food scanning (powered by Google Gemini Vision), local vector database RAG grounding for accurate macro estimations, automated 24-hour photo retention cleanup, guest-first device-token authentication, single-sentence Hinglish AI coaching, and an engaging "Glow Points" Food Relationship & Mental Health Score engine.

---

## 🌟 Key Features

1. **Guest-First & Anonymous Sessions**: Instant food scanning without forced registration. Anonymous HTTP-only cookie JWT with device token identification.
2. **AI Photo Scan & Local RAG Grounding**: Fast food image identification using Gemini Vision integrated with an in-memory vector store (`indian-dishes.embeddings.json` with 458+ dishes including top 30 Indian fast foods and street foods) for precise calorie, macro, and health tier predictions.
3. **Food Relationship & Mental Health Score ("Glow Rewards")**: Measure and improve your relationship with food without toxic dieting or guilt. Earn points across Patience (+3), Balance (+5), and Completion (+2) categories across 7 level thresholds (*Seed* 💡 to *Nutrition Guru* 👑).
4. **24-Hour Photo Storage & Automatic Purging**: Image previews stored strictly for 24 hours on today's log entries, automatically purged by an hourly background `node-cron` job. Photos are never displayed in historical logs.
5. **Hinglish AI Coach**: Personalized single-sentence nutrition advice grounded in daily consumed meals (`todaysMealsSoFar`) and calculated calorie targets.
6. **Adaptive Desktop & Mobile PWA Interface**: Tailored desktop sidebar navigation and fixed mobile bottom tab bar navigation.

---

## 📁 Repository & Architecture Structure

```text
start1/
├── vercel.json                   # Vercel deployment configuration (SPA routing rewrites)
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM schema (User, Profile, DailyLog, MealEntry, RewardPoints, Subscription)
│   ├── src/
│   │   ├── config/               # Prisma, Environment, and Rate Limit configurations
│   │   ├── controllers/          # Express API controllers (auth, scan, log, coach, rewards, profile, payment)
│   │   ├── data/
│   │   │   └── indian-dishes.embeddings.json  # In-memory vector store (458 Indian dishes & fast foods)
│   │   ├── middleware/           # Anonymous sessions, authentication, subscription pass-through, error handlers
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Core engines (scanPipeline, nutritionEngine, coachEngine, rewardsEngine, photoCleanupEngine)
│   │   │   ├── ai/               # Gemini Vision & text AI service integration & Hinglish prompts
│   │   │   └── rag/              # In-memory vector store & dish similarity retriever
│   │   └── index.js              # Server entry point
│   └── tests/                    # Vitest unit & integration test suites
└── frontend/
    ├── vercel.json               # Frontend SPA client-side routing rewrite rules
    ├── src/
    │   ├── components/           # UI components (ScanCamera, ResultCard, DailyBudgetRing, AppShell, DesktopNav, MobileTabBar)
    │   ├── pages/                # SPA pages (Scan, Log, Coach, Rewards, Profile, QuickLog, WeeklyReport)
    │   └── lib/                  # API client wrapper
    └── vite.config.js            # Vite build & PWA configuration
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Neon or local)
- Google Gemini API Key (`GEMINI_API_KEY`)

### Environment Setup

Create `.env` inside `backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

### Server & Database Initialization

```bash
# Backend Setup
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev

# Frontend Setup
cd ../frontend
npm install
npm run dev
```

---

## 🌐 Vercel Deployment Guide

To deploy the frontend to Vercel without page refresh 404 issues:

1. Import repository in Vercel.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. `vercel.json` automatically rewrites all sub-routes (`/scan`, `/log`, `/rewards`, `/coach`, `/profile`) to `/index.html` preventing routing breaks on page reload.

---

## 🧪 Testing Protocol

Run all backend unit & integration tests:
```bash
cd backend
npx vitest run
```

Run frontend build verification:
```bash
cd frontend
npm run build
```

---

## 🛡️ Medical & Legal Disclaimer

Sachthali provides estimated nutritional insights based on machine learning models and standard dietary algorithms. It does **not** provide medical advice, diagnosis, or treatment. Users should consult a qualified healthcare professional or registered dietitian for medical condition management.
