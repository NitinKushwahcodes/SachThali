// Adaptive application shell component wrapping main application routes and pages.
// Uses useScreenSize hook to dynamically switch between DesktopNav sidebar and MobileTabBar.
// Centers content with max 1200px width on desktop and applies bottom padding on mobile.

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useScreenSize } from '../../hooks/useMediaQuery';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';

// Renders adaptive container layout for authenticated application screens.
export function AppShell({ user }) {
  const { isDesktop } = useScreenSize();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-900 flex flex-col lg:flex-row">
      {isDesktop ? (
        <DesktopNav user={user} />
      ) : null}

      <main className={`flex-1 ${isDesktop ? 'p-8 max-w-[1200px] mx-auto w-full' : 'p-4 pb-20 max-w-lg mx-auto w-full'}`}>
        <Outlet />
        <footer className="text-center pt-8 pb-4 text-[11px] text-gray-500 font-medium leading-relaxed space-y-1">
          <p>SachThali gives nutrition estimates, not medical advice. Please consult a doctor for health conditions.</p>
          <p className="text-[10px] text-gray-400 font-mono">built by NK</p>
        </footer>
      </main>

      {!isDesktop ? (
        <MobileTabBar user={user} />
      ) : null}
    </div>
  );
}
