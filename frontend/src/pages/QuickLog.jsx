// QuickLog page view for natural language text-based meal logging.
// Submits Hinglish user text to POST /quick-log API endpoint and displays ResultCard breakdown.
// Reuses ResultCard and PortionEditor components to log confirmed meals to DailyLog.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResultCard } from '../components/scan/ResultCard';
import { apiFetch, formatUserFriendlyError } from '../lib/apiClient';
import { MessageSquare, Sparkles } from 'lucide-react';

// Component rendering typed natural language meal logger.
export default function QuickLog() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Submits typed text description to POST /quick-log API.
  const handleQuickLogSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await apiFetch('/quick-log', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setScanResult(result);
    } catch (err) {
      setError(formatUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Submits confirmed meal items to POST /log/entry.
  const handleConfirmMeal = async (confirmedItems) => {
    try {
      await apiFetch('/log/entry', {
        method: 'POST',
        body: JSON.stringify({ items: confirmedItems }),
      });
      // Check push notification permission after first meal log (Rule 0.2)
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      navigate('/log');
    } catch (err) {
      setError(formatUserFriendlyError(err));
    }
  };

  // Resets state to type a new meal.
  const handleReset = () => {
    setScanResult(null);
    setText('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Quick-Log Meal</h1>
        <p className="text-sm text-gray-500 mt-1">Type what you ate in natural Hinglish or plain English</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {scanResult ? (
        <ResultCard scanResult={scanResult} onConfirm={handleConfirmMeal} onRescan={handleReset} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleQuickLogSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <MessageSquare size={16} className="text-[#3F8F5F]" />
                <span>Meal Description</span>
              </label>
              <textarea
                rows={4}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. 2 Roti aur dal khaya, thoda ghee tha, 1 bowl rice"
                className="w-full border border-gray-300 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full py-3.5 bg-[#3F8F5F] text-white font-bold rounded-xl hover:bg-[#34774E] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Parsing Meal Text...</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze Meal Text</span>
                </>
              )}
            </button>
          </form>

          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span className="font-semibold block text-gray-500 mb-1">Examples you can try:</span>
            <ul className="space-y-1 list-disc list-inside">
              <li>"2 roti, 1 katori dal makhani with extra butter"</li>
              <li>"1 masala dosa with sambar and chutney"</li>
              <li>"Chole bhature khaya, high oil"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
