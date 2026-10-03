// Rewards page component displaying Glow Points, level progression, category breakdown, and Mental Health Score modal.
// Connects to GET /rewards API to show user level badge, progress bar, mindset score, and interactive explanation dialog.

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { Sparkles, Award, Zap, CheckCircle2, HeartHandshake, HelpCircle, ChevronRight, Brain, X, ShieldCheck } from 'lucide-react';

export default function Rewards() {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    async function fetchRewards() {
      try {
        const data = await apiFetch('/rewards');
        setRewards(data);
      } catch (err) {
        setError('Failed to load Glow Points');
      } finally {
        setLoading(false);
      }
    }
    fetchRewards();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const {
    patiencePoints = 0,
    balancePoints = 0,
    completionPoints = 0,
    totalPoints = 0,
    level = 1,
    title = 'Seed 💡',
    nextLevelPoints = 20,
    pointsToNext = 20,
  } = rewards || {};

  const currentLevelMin = level === 1 ? 0 : [0, 0, 20, 50, 100, 200, 400, 700][level] || 0;
  const progressPercent = level === 7
    ? 100
    : Math.min(100, Math.max(0, Math.round(((totalPoints - currentLevelMin) / Math.max(1, nextLevelPoints - currentLevelMin)) * 100)));

  return (
    <div className="max-w-md mx-auto space-y-6 relative">
      {/* Top Explanation Navigation Button */}
      <button
        onClick={() => setShowAboutModal(true)}
        className="w-full py-3 px-4 bg-emerald-100/80 hover:bg-emerald-200/80 text-[#3F8F5F] font-bold rounded-2xl text-xs flex items-center justify-between transition-colors border border-emerald-200 shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} />
          <span>What is Glow Rewards & Mental Health Score?</span>
        </div>
        <ChevronRight size={16} />
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>Glow Points</span>
          <Sparkles className="text-amber-500" size={24} />
        </h1>
        <p className="text-sm text-gray-500 mt-1">Earn points by scanning meals, staying balanced, and building healthy habits!</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Mental Health & Mindset Score Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs font-semibold text-amber-950 flex items-center gap-3 shadow-2xs">
        <Brain className="text-amber-600 flex-shrink-0" size={22} />
        <div>
          <span className="font-bold block text-amber-900">Your Food Relationship & Mental Health Score 🧠💚</span>
          <span className="text-[11px] text-amber-800 font-medium">Rewarding guilt-free mindful choices, patience, and food peace without strict diet pressure.</span>
        </div>
      </div>

      {/* Level Header Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-[#3F8F5F] rounded-3xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">Your Level</span>
            <h2 className="text-2xl font-extrabold mt-0.5">{title}</h2>
            <span className="text-xs text-emerald-100 font-medium">Level {level} of 7</span>
          </div>

          <div className="bg-white/20 backdrop-blur-xs border border-white/30 rounded-2xl px-4 py-2 text-center">
            <span className="text-2xl font-black block">{totalPoints}</span>
            <span className="text-[10px] text-emerald-100 uppercase font-bold">Total Points</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-emerald-100 font-semibold">
            <span>Progress to Next Level</span>
            <span>{level === 7 ? 'Max Level!' : `${pointsToNext} pts left`}</span>
          </div>
          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Points Breakdown Categories */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Award size={18} className="text-[#3F8F5F]" />
          <span>Points Breakdown</span>
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#3F8F5F] flex items-center justify-center font-bold">
                <HeartHandshake size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Patience Points</span>
                <span className="text-[11px] text-gray-500 font-medium">Multi-item thali scans & mindful waiting</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-[#3F8F5F]">+{patiencePoints}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Zap size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Balance Points</span>
                <span className="text-[11px] text-gray-500 font-medium">Nourishing, balanced "Eat Freely" choices</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-amber-600">+{balancePoints}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Completion Points</span>
                <span className="text-[11px] text-gray-500 font-medium">Daily meal logging & profile completion</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-blue-600">+{completionPoints}</span>
          </div>
        </div>
      </div>

      {/* How to Earn More Card */}
      <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-5 space-y-2 text-xs text-gray-700">
        <h4 className="font-bold text-[#3F8F5F] text-sm flex items-center gap-1.5">
          <span>💡 How to earn more Glow Points</span>
        </h4>
        <ul className="space-y-1.5 list-disc list-inside font-medium text-gray-600">
          <li>Log your meals daily (+2 completion points)</li>
          <li>Scan complete thalis with multiple dishes (+3 patience points)</li>
          <li>Choose balanced dishes tagged as "Eat Freely" (+5 balance points)</li>
          <li>Complete your profile setup (+2 completion points)</li>
        </ul>
      </div>

      {/* "What is Glow Rewards?" Warm Explanation Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Brain size={26} />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">What is Glow Rewards? 🌟</h2>
              <p className="text-xs font-semibold text-[#3F8F5F]">Your Food Relationship & Mental Health Score</p>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed font-medium">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-[#3F8F5F] text-sm flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  <span>Why we created Glow Rewards</span>
                </h3>
                <p>
                  Khane se darna nahi, khane ko samjhna seekhna hai! Normal diet apps hume calories count karke guilty feel karwati hain. Humne Glow Rewards isliye banaya hai taaki aapka **Mental Health & Relationship with Food** improve ho sake.
                </p>
                <p>
                  Ye koi strict diet score nahi hai — ye ek **Mindset Score** hai jo aapki patience, mindful choices aur guilt-free habit consistency ko reward karta hai!
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">How it calculates your score:</h3>
                <div className="space-y-2 text-[11px]">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="font-bold text-[#3F8F5F] block">🧘 Patience Points (+3)</span>
                    <span>Multi-item thalis scan karne aur bina jaldbazi ke khane ko evaluate karne par milte hain.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="font-bold text-amber-600 block">⚖️ Balance Points (+5)</span>
                    <span>Nourishing "Eat Freely" dishes choose karne par milte hain — bina kisi extreme starvation rule ke.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="font-bold text-blue-600 block">✅ Completion Points (+2)</span>
                    <span>Daily regular meal tracking aur profile maintenance par milte hain.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">The 7 Mindful Levels:</h3>
                <ul className="space-y-1.5 text-[11px]">
                  <li>💡 <strong>Level 1: Seed</strong> (0-19 pts) — Beginning mindful food awareness</li>
                  <li>🌱 <strong>Level 2: Sprout</strong> (20-49 pts) — Developing daily tracking consistency</li>
                  <li>🍃 <strong>Level 3: Leaf</strong> (50-99 pts) — Finding peace with Indian thalis</li>
                  <li>🌸 <strong>Level 4: Bloom</strong> (100-199 pts) — Guilt-free eating & balance</li>
                  <li>🌾 <strong>Level 5: Harvest</strong> (200-399 pts) — Deep nutritional intuition</li>
                  <li>🍱 <strong>Level 6: Master Thali</strong> (400-699 pts) — Food relationship mastery</li>
                  <li>👑 <strong>Level 7: Nutrition Guru</strong> (700+ pts) — Complete wellness & peace</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-3 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] text-xs shadow-md transition-colors"
            >
              Got it, let's build healthy habits! 💚
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
