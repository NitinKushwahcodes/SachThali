// Primary React application routing component using react-router-dom.
// Configures SPA route paths for guest-first app: Scan, QuickLog, Log, Coach, Rewards, WeeklyReport, Profile.
// Inspects anonymous user session state via GET /auth/me.

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Scan from './pages/Scan';
import Log from './pages/Log';
import Coach from './pages/Coach';
import Profile from './pages/Profile';
import QuickLog from './pages/QuickLog';
import Rewards from './pages/Rewards';
import WeeklyReport from './pages/WeeklyReport';
import { ProfileGate } from './components/onboarding/ProfileGate';
import { apiFetch } from './lib/apiClient';

function RequireProfile({ user, children }) {
  if (!user?.hasProfile) {
    return <ProfileGate />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiFetch('/auth/me');
        setUser(data);
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
    <Routes>
      <Route element={<AppShell user={user} />}>
        <Route path="/scan" element={<Scan />} />
        <Route
          path="/quick-log"
          element={
            <RequireProfile user={user}>
              <QuickLog />
            </RequireProfile>
          }
        />
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
  );
}
