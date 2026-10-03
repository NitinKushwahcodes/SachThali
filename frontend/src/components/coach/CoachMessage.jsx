// Coach message display component rendering Hinglish AI coach advice and verdict badges.
// Displays verdict status chips (under=green, on_track=blue-gray, over=amber).
// Formats AI recommendation card with friendly avatar and clean typography.

import React from 'react';
import { Sparkles } from 'lucide-react';

// Renders coach advice card with verdict indicator badge.
export function CoachMessage({ coachData }) {
  if (!coachData) return null;

  const { message, verdict, deltaKcal } = coachData;

  const verdictConfig = {
    under: { label: 'Under Budget', bg: 'bg-emerald-100', text: 'text-[#3F8F5F]' },
    on_track: { label: 'On Track', bg: 'bg-slate-100', text: 'text-[#4A6572]' },
    over: { label: 'Over Budget', bg: 'bg-amber-100', text: 'text-[#E08A3E]' },
  };

  const badge = verdictConfig[verdict] || verdictConfig.under;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#3F8F5F] flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <span className="font-bold text-gray-900">Sachthali Coach</span>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
          {badge.label} {deltaKcal > 0 && `(${deltaKcal} kcal)`}
        </span>
      </div>

      <p className="text-gray-800 text-base font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
        "{message}"
      </p>
    </div>
  );
}
