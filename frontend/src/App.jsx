// Primary React application routing component using react-router-dom.
// Configures SPA route paths for guest-first app: Scan, QuickLog, Log, Coach, Rewards, WeeklyReport, Profile.
// Inspects anonymous user session state via GET /auth/me.

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Scan from './pages/Scan';
import { ProfileGate } from './components/onboarding/ProfileGate';
import { apiFetch } from './lib/apiClient';

// Lazy-load secondary pages for optimal initial bundle size and instant PWA load speed
const Log = lazy(() => import('./pages/Log'));
const Coach = lazy(() => import('./pages/Coach'));
const Profile = lazy(() => import('./pages/Profile'));
const QuickLog = lazy(() => import('./pages/QuickLog'));
const Rewards = lazy(() => import('./pages/Rewards'));
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'));

function RequireProfile({ user, children }) {
  if (!user?.hasProfile) {
    return <ProfileGate />;
  }
  return children;
}

// Lightweight fallback UI during route chunk loading
function RouteLoadingFallback() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-10 h-10 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function App() {
  // Stale-while-revalidate local cache strategy for zero-latency app startup
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('sachthali_user_session');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !user);

  const refreshUser = async () => {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data);
      localStorage.setItem('sachthali_user_session', JSON.stringify(data));
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiFetch('/auth/me');
        setUser(data);
        localStorage.setItem('sachthali_user_session', JSON.stringify(data));
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route element={<AppShell user={user} />}>
        <Route path="/scan" element={<Scan />} />
        <Route path="/quick-log" element={<QuickLog />} />
        <Route
          path="/log"
          element={
            <RequireProfile user={user}>
              <Log />
            </RequireProfile>
          }
        />
        <Route
          path="/coach"
          element={
            <RequireProfile user={user}>
              <Coach />
            </RequireProfile>
          }
        />
        <Route
          path="/rewards"
          element={
            <RequireProfile user={user}>
              <Rewards />
            </RequireProfile>
          }
        />
        <Route
          path="/weekly-report"
          element={
            <RequireProfile user={user}>
              <WeeklyReport />
            </RequireProfile>
          }
        />
        <Route path="/profile" element={<Profile refreshUser={refreshUser} />} />
        <Route path="/" element={<Navigate to="/scan" replace />} />
        <Route path="/login" element={<Navigate to="/scan" replace />} />
        <Route path="/signup" element={<Navigate to="/scan" replace />} />
        <Route path="/plan" element={<Navigate to="/scan" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/scan" replace />} />
    </Routes>
    </Suspense>
  );
}
