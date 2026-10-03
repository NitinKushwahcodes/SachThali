// First-visit welcome popup component introducing guest-first food scanning capability.
// Displayed once on initial app load, tracked via localStorage 'hasSeenWelcome' flag.
// Provides immediate call-to-action to scan food without mandatory account signup.

import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';

// Renders first-time visitor welcome modal with instant food scanning action.
export function WelcomeModal({ onScanClick }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenWelcome');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  const handleScan = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
    if (onScanClick) onScanClick();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative space-y-4 text-center">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close welcome modal"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl">
          🍛
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-gray-900">Know what's really in your plate</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Snap a photo, get instant honest numbers — no sign-up needed.
          </p>
        </div>

        <button
          onClick={handleScan}
          className="w-full py-3.5 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-all shadow-md flex items-center justify-center gap-2 text-sm"
        >
          <Camera size={18} />
          <span>Scan My Food</span>
        </button>
      </div>
    </div>
  );
}
