// 30-Day meal plan page view rendering personalized breakfast, lunch, and dinner calendar.
// Queries GET /payment/plan backend API endpoint gated by requireSubscription middleware.
// Displays upgrade paywall PaymentModal if user does not hold an active paid subscription.

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { PaymentModal } from '../components/payment/PaymentModal';
import { Calendar, Lock, Sparkles } from 'lucide-react';

// Component rendering 30-day meal plan calendar dashboard.
export default function Plan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetches 30-day meal plan data from backend API.
  const loadPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/payment/plan');
      setPlan(data);
    } catch (err) {
      if (err.data?.requiresPayment || err.status === 403) {
        setShowPaymentModal(true);
      } else {
        setError(err.message || 'Failed to load meal plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
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
          <h1 className="text-2xl font-bold text-gray-900">30-Day Meal Plan</h1>
          <p className="text-sm text-gray-500 mt-1">Curated daily meals tailored to your calorie target</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#3F8F5F] flex items-center justify-center font-bold">
          <Calendar size={20} />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={loadPlan}
      />

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {!plan ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-[#E08A3E] rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Pro Subscription Required</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Unlock your full 30-day meal plan featuring varied breakfast, lunch, and dinner options.
          </p>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="py-3 px-6 bg-[#3F8F5F] text-white font-bold rounded-xl text-sm hover:bg-[#34774E]"
          >
            Unlock 30-Day Plan (₹149)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold text-gray-800">
            <span>Calorie Target: {plan.calorieTarget} kcal/day</span>
            <span className="text-[#3F8F5F] font-bold">30 Days Variety Guaranteed</span>
          </div>

          <div className="space-y-3">
            {plan.days.map((dayItem) => (
              <div key={dayItem.day} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-bold text-sm text-gray-900">Day {dayItem.day}</span>
                  <span className="text-xs font-semibold text-[#3F8F5F]">
                    ~{dayItem.totalEstimatedKcal} kcal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-semibold">Breakfast</span>
                    <span className="font-medium text-gray-800">{dayItem.breakfast.name}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-semibold">Lunch</span>
                    <span className="font-medium text-gray-800">{dayItem.lunch.name}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-semibold">Dinner</span>
                    <span className="font-medium text-gray-800">{dayItem.dinner.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
