// Post-first-scan profile creation prompt component encouraging target personalization.
// Triggered ONLY after user's first successful scan result has rendered on screen.
// Suppressed if user profile already exists or if user dismisses via 'Maybe later'.

import React from 'react';
import { UserCheck, Sparkles, X } from 'lucide-react';

// Renders profile creation prompt modal following successful first meal scan.
export function CreateProfileModal({ isOpen, onClose, onCreateProfile }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 bg-emerald-100 text-[#3F8F5F] rounded-full flex items-center justify-center mx-auto">
          <Sparkles size={28} />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Want this tailored to you?</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Create your profile to track calories, get suggestions for your goal, and see your meal history.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onCreateProfile}
            className="w-full py-3 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <UserCheck size={18} />
            <span>Create My Profile</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-transparent text-gray-500 hover:text-gray-800 font-semibold text-xs transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
