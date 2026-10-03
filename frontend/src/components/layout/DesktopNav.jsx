// Desktop sidebar navigation layout component rendered on desktop viewports (>=1024px).
// Features brand logo, navigation links to Scan, Log, Coach, Rewards, Weekly Report, Profile.
// Displays profile status (Profile Active vs Guest Session Active) and built by NK credit.

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, ClipboardList, MessageSquare, User, Type, BarChart3, Sparkles } from 'lucide-react';

export function DesktopNav({ user }) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show profile tooltip nudge if user has no profile, auto-dismissing after 4 seconds
    if (user && !user.hasProfile) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const navItems = [
    { label: 'Scan Food', path: '/scan', icon: Camera },
    { label: 'Quick-Log', path: '/quick-log', icon: Type },
    { label: 'Daily Log', path: '/log', icon: ClipboardList },
    { label: 'AI Coach', path: '/coach', icon: MessageSquare },
    { label: 'Glow Rewards', path: '/rewards', icon: Sparkles },
    { label: 'Weekly Report', path: '/weekly-report', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User, showDot: !user?.hasProfile },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-6 min-h-screen relative">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#3F8F5F] flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 tracking-tight">Sachthali</h1>
            <p className="text-xs text-gray-500">AI Nutrition Tracker</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.path} className="relative">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                      isActive
                        ? 'bg-[#3F8F5F] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>

                  {item.showDot && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                </NavLink>

                {/* 4-second auto-dismissing profile tooltip nudge */}
                {item.path === '/profile' && showTooltip && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg whitespace-nowrap z-50 animate-bounce">
                    Complete profile for target! 🎯
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-amber-500"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="text-center space-y-1 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 font-semibold">
          {user?.hasProfile ? 'Profile Active 👤' : 'Guest Session Active'}
        </div>
        <div className="text-[10px] text-gray-400 font-mono tracking-wider">
          built by NK
        </div>
      </div>
    </aside>
  );
}
