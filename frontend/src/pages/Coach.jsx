// AI Coach page view displaying context-aware Hinglish nutrition guidance.
// Queries GET /coach/message backend API endpoint to calculate budget verdict state.
// Renders CoachMessage card component with interactive refresh action.

import React, { useState, useEffect } from 'react';
import { CoachMessage } from '../components/coach/CoachMessage';
import { apiFetch } from '../lib/apiClient';
import { RefreshCw } from 'lucide-react';

// Component rendering AI coach interaction dashboard.
export default function Coach() {
  const [coachData, setCoachData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetches current AI coach recommendation from backend.
  const fetchCoachMessage = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/coach/message');
      setCoachData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch coach guidance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachMessage();
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Nutrition Coach</h1>
          <p className="text-sm text-gray-500 mt-1">Personalized Hinglish advice for your goals</p>
        </div>
        <button
          onClick={fetchCoachMessage}
          disabled={loading}
          className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
          title="Refresh advice"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-10 h-10 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <CoachMessage coachData={coachData} />
      )}
    </div>
  );
}
