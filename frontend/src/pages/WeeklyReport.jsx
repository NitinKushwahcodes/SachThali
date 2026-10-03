// Weekly report page view summarizing recent 7-day calorie averages and meal history.
// Queries GET /payment/weekly-report backend API endpoint gated by requireSubscription.
// Displays upgrade paywall PaymentModal if user does not hold an active paid subscription.

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { PaymentModal } from '../components/payment/PaymentModal';
import { BarChart3, Lock, Flame, Award } from 'lucide-react';

// Component rendering weekly progress aggregation dashboard.
export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetches 7-day progress report data from backend API.
  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/payment/weekly-report');
      setReport(data);
    } catch (err) {
      if (err.data?.requiresPayment || err.status === 403) {
        setShowPaymentModal(true);
      } else {
        setError(err.message || 'Failed to load weekly report.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Summary</h1>
          <p className="text-sm text-gray-500 mt-1">7-day aggregated calorie performance & top meals</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#3F8F5F] flex items-center justify-center font-bold">
          <BarChart3 size={20} />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={loadReport}
      />

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {!report ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-[#E08A3E] rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Pro Subscription Required</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Unlock weekly analytics, average calorie intake, and your top logged food habits.
          </p>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="py-3 px-6 bg-[#3F8F5F] text-white font-bold rounded-xl text-sm hover:bg-[#34774E]"
          >
            Unlock Weekly Report (₹149)
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#3F8F5F] flex items-center justify-center mb-2">
                <Flame size={18} />
              </div>
              <span className="text-xs text-gray-500 font-medium">Avg Daily Calories</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {report.averageDailyKcal} <span className="text-xs font-normal text-gray-500">kcal</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <Award size={18} />
              </div>
              <span className="text-xs text-gray-500 font-medium">Days Under Budget</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {report.daysUnderTarget} <span className="text-xs font-normal text-gray-500">/ 7 days</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-base">Top Logged Dishes</h3>
            {report.topDishes.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No meals logged in the last 7 days.</p>
            ) : (
              <div className="space-y-2">
                {report.topDishes.map((dish) => (
                  <div key={dish.name} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">{dish.name}</span>
                    <span className="text-xs font-bold text-[#3F8F5F] bg-emerald-50 px-2.5 py-1 rounded-full">
                      Logged {dish.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
