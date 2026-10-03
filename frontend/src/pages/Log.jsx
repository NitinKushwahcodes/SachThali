// Daily log page view rendering today's calorie budget, logged meals, and full free meal history.
// Displays free today's log ring, meal entries with optional 24-hour photo thumbnail, meal deletion with confirmation modal, and un-gated history section.

import React, { useState, useEffect } from 'react';
import { DailyBudgetRing } from '../components/log/DailyBudgetRing';
import { apiFetch } from '../lib/apiClient';
import { Utensils, Calendar, ChevronRight, Trash2 } from 'lucide-react';

const tierBadges = {
  1: { label: 'Avoid Eating This ⚠️', bg: 'bg-red-100', text: 'text-red-800' },
  2: { label: 'Avoid Eating This ⚠️', bg: 'bg-red-100', text: 'text-red-800' },
  3: { label: 'Eat in Moderation ⚖️', bg: 'bg-amber-100', text: 'text-amber-800' },
  4: { label: 'Eat Freely 🥗', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  5: { label: 'Eat Freely 🥗', bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export default function Log() {
  const [logData, setLogData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Deletion modal state
  const [mealToDelete, setMealToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetches today's log entries and profile targets.
  const loadData = async () => {
    try {
      const [todayLog, userProfile] = await Promise.all([
        apiFetch('/log/today'),
        apiFetch('/profile').catch(() => null),
      ]);
      setLogData(todayLog);
      setProfile(userProfile);
    } catch (err) {
      setError(err.message || 'Failed to load log data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetches un-gated history data from GET /log/history
  const fetchHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const res = await apiFetch('/log/history?days=30');
      setHistoryData(res);
    } catch (err) {
      console.warn('Failed to load history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Executes meal deletion after user confirmation modal
  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;
    setDeleting(true);
    try {
      const updated = await apiFetch(`/log/meal/${mealToDelete.id}`, { method: 'DELETE' });
      setLogData(updated);
      setMealToDelete(null);
      if (showHistory) {
        fetchHistory();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove meal');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const targetKcal = profile?.calorieTarget || 1800;
  const isEstimate = profile?.isEstimate || false;
  const totalKcal = logData?.totalKcal || 0;
  const meals = logData?.meals || [];

  return (
    <div className="max-w-md mx-auto space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today's Log</h1>
        <p className="text-sm text-gray-500 mt-1">Track your daily calorie allowance and meals</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Free Today's Budget Ring */}
      <DailyBudgetRing totalKcal={totalKcal} targetKcal={targetKcal} isEstimate={isEstimate} />

      {/* Free Logged Meals Block */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Utensils size={20} className="text-[#3F8F5F]" />
          <h2 className="text-lg font-bold text-gray-900">Today's Meals</h2>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm font-medium">No meals logged today yet.</p>
            <p className="text-xs mt-1">Scan a meal photo to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const timeStr = new Date(meal.loggedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const badge = tierBadges[meal.tier] || tierBadges[3];
              return (
                <div
                  key={meal.id}
                  className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100 gap-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Render photo preview thumbnail if present (< 24h old) */}
                    {meal.photoUrl && (
                      <img
                        src={meal.photoUrl}
                        alt={meal.dishName}
                        className="w-12 h-12 rounded-xl object-contain bg-gray-900 border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm">{meal.dishName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-0.5 block capitalize">
                        {meal.mealSlot || 'lunch'} • {meal.portionQty} {meal.portionUnit} • {timeStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-extrabold text-gray-900 text-sm">{meal.kcal} kcal</span>
                      <span className="block text-[10px] text-gray-400 font-medium">
                        ({meal.kcalMin}-{meal.kcalMax})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMealToDelete(meal)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove meal entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Free Un-gated Meal History Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-[#3F8F5F]" />
            <h2 className="text-lg font-bold text-gray-900">Meal History</h2>
          </div>

          {!showHistory && (
            <button
              onClick={fetchHistory}
              className="text-xs font-bold text-[#3F8F5F] hover:underline flex items-center gap-1"
            >
              <span>View History</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {showHistory && (
          <div>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : historyData?.history ? (
              /* Structured Un-gated Meal History */
              <div className="space-y-4 pt-2">
                {historyData.history.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No past history found.</p>
                ) : (
                  historyData.history.map((day) => {
                    const dateStr = new Date(day.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    const slots = ['breakfast', 'lunch', 'dinner', 'snack'];
                    return (
                      <div key={day.id} className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-gray-50/50">
                        <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                          <span className="font-bold text-gray-900 text-sm">{dateStr}</span>
                          <span className="text-xs font-extrabold text-[#3F8F5F]">{day.totalKcal} kcal total</span>
                        </div>

                        {slots.map((slot) => {
                          const slotMeals = day.mealsBySlot?.[slot] || [];
                          if (slotMeals.length === 0) return null;

                          return (
                            <div key={slot} className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider capitalize block">
                                {slot}
                              </span>
                              {slotMeals.map((m) => {
                                const badge = tierBadges[m.tier] || tierBadges[3];
                                return (
                                  <div key={m.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-200 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-800">{m.dishName}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${badge.bg} ${badge.text}`}>
                                        {badge.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">{m.kcal} kcal</span>
                                      <button
                                        type="button"
                                        onClick={() => setMealToDelete(m)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Remove meal entry"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Meal Deletion */}
      {mealToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">You really wanna remove it? 🤔</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This will remove <span className="font-bold text-gray-900">{mealToDelete.dishName}</span> ({mealToDelete.kcal} kcal) from your daily log.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMealToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 text-xs transition-colors"
              >
                No, keep it
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteMeal}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Yes, remove it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
