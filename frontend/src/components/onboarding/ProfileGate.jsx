// ProfileGate component rendering upfront profile setup prompt for unconfigured sessions.
// Blocks access to Log, Coach, Rewards, QuickLog, and WeeklyReport until user creates profile.

import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Sparkles, Target } from 'lucide-react';

export function ProfileGate({ title = 'Pehle Profile Banaayein 👤✨' }) {
  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-md text-center space-y-6 my-6">
      <div className="w-16 h-16 bg-emerald-100 text-[#3F8F5F] rounded-full flex items-center justify-center mx-auto shadow-xs">
        <UserPlus size={32} />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          Daily Log, AI Coach, aur Glow Rewards access karne ke liye apni health profile setup karein. Isase hum aapke exact daily budget aur protein targets calculate kar paayenge!
        </p>
      </div>

      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-xs text-[#3F8F5F] font-semibold text-left space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Sparkles size={16} className="text-amber-500" />
          <span>Profile banane ke fayde:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-gray-600 font-medium">
          <li>Custom Calorie & Protein allowance calculation</li>
          <li>Personalized Hinglish AI Coach recommendations</li>
          <li>Glow Points & Mindset Level tracking</li>
        </ul>
      </div>

      <Link
        to="/profile"
        className="w-full py-3.5 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-all shadow-md flex items-center justify-center gap-2 text-sm block"
      >
        <Target size={18} />
        <span>Create My Profile Now</span>
      </Link>
    </div>
  );
}
