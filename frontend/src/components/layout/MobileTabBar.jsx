// Mobile fixed bottom tab bar navigation component rendered on small viewports (<1024px).
// Contains 5 navigation buttons (Scan, Log, Coach, Rewards, Profile) with touch targets.
// Displays profile badge dot for unconfigured user sessions.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, ClipboardList, MessageSquare, User, Sparkles } from 'lucide-react';

export function MobileTabBar({ user }) {
  const navItems = [
    { label: 'Scan', path: '/scan', icon: Camera },
    { label: 'Log', path: '/log', icon: ClipboardList },
    { label: 'Coach', path: '/coach', icon: MessageSquare },
    { label: 'Rewards', path: '/rewards', icon: Sparkles },
    { label: 'Profile', path: '/profile', icon: User, showDot: !user?.hasProfile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-1 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-2 rounded-lg text-xs font-medium transition-colors relative ${
                  isActive ? 'text-[#3F8F5F] font-bold' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} className="mb-0.5" />
                {item.showDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white animate-pulse"></span>
                )}
              </div>
              <span className="text-[11px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
