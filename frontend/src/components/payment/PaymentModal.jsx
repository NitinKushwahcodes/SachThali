// Razorpay payment integration modal component for upgrading to Sachthali Pro subscription.
// Supports 3 plan tiers: monthly (₹29), half-yearly (₹120), and yearly (₹200).
// Calls POST /payment/create-order API endpoint to generate Razorpay checkout order ID.

import React, { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { ShieldCheck, Zap, X, CheckCircle } from 'lucide-react';

export function PaymentModal({ isOpen, onClose, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const plans = [
    { id: 'monthly', name: 'Monthly Pass', price: 29, duration: '1 Month', desc: '₹29 / month' },
    { id: 'half_yearly', name: '6-Month Pass', price: 120, duration: '6 Months', desc: '₹20 / month (save 31%)', popular: true },
    { id: 'yearly', name: 'Annual Pass', price: 200, duration: '1 Year', desc: '₹16 / month (save 45%)' },
  ];

  // Initiates Razorpay checkout flow for selected plan
  const handlePaymentStart = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = await apiFetch('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890ABCD',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Sachthali Pro History Unlock',
          description: `Unlock Full Meal History (${selectedPlan})`,
          order_id: orderData.orderId,
          handler: function (response) {
            if (onSuccess) onSuccess();
            onClose();
          },
          theme: { color: '#3F8F5F' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Test mode simulation fallback
        alert(`Simulating test payment for ${selectedPlan}...`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize payment checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const activePlanObj = plans.find((p) => p.id === selectedPlan) || plans[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full relative shadow-2xl space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-100 text-[#3F8F5F] rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Zap size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Unlock Full History</h2>
          <p className="text-xs text-gray-500">Access structured meal logs, macro trends & history</p>
        </div>

        {error && <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}

        <div className="space-y-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlan(p.id)}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                selectedPlan === p.id
                  ? 'border-[#3F8F5F] bg-emerald-50/70 ring-2 ring-[#3F8F5F]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                  <span>{p.name}</span>
                  {p.popular && (
                    <span className="text-[10px] bg-[#3F8F5F] text-white px-2 py-0.5 rounded-full font-bold">
                      Best Value
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{p.desc}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-gray-900">₹{p.price}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handlePaymentStart}
          disabled={loading}
          className="w-full py-3.5 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-colors shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <ShieldCheck size={18} />
          <span>{loading ? 'Processing...' : `Pay ₹${activePlanObj.price} via Razorpay`}</span>
        </button>
      </div>
    </div>
  );
}
