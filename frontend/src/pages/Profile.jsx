// Profile page view displaying user targets and physical metric settings.
// Queries GET /profile backend API to inspect current targets or mounts OnboardingStepper.
// Displays target calorie allowance, protein goal in grams, and medical flags.

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { OnboardingStepper } from '../components/onboarding/OnboardingStepper';
import { Target, Award, Activity } from 'lucide-react';

// Component rendering user profile summary and target metrics.
export default function Profile({ refreshUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  // Fetches current profile data from backend API.
  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/profile');
      setProfile(data);
    } catch (err) {
      if (err.status === 404) {
        setProfile(null);
      } else {
        setError(err.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handles completion of profile onboarding form stepper.
  const handleOnboardingComplete = async (updatedProfile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
    if (refreshUser) {
      await refreshUser();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-[#3F8F5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile || isEditing) {
    return <OnboardingStepper onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Health Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Calorie & protein target calculations</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-[#3F8F5F] text-white font-semibold rounded-xl text-xs hover:bg-[#34774E]"
        >
          Edit Profile
        </button>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#3F8F5F] flex items-center justify-center mb-2">
            <Target size={18} />
          </div>
          <span className="text-xs text-gray-500 font-medium">Daily Calorie Target</span>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {profile.calorieTarget} <span className="text-xs font-normal text-gray-500">kcal</span>
          </div>
          {profile.isEstimate && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium mt-1 inline-block">
              Estimated Target
            </span>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
            <Award size={18} />
          </div>
          <span className="text-xs text-gray-500 font-medium">Daily Protein Goal</span>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {profile.proteinTargetG} <span className="text-xs font-normal text-gray-500">g</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={18} className="text-[#3F8F5F]" />
          <h2 className="font-bold text-gray-900 text-base">Profile Metrics</h2>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
          <span className="text-gray-500">Goal</span>
          <span className="font-semibold text-gray-900 capitalize">
            {profile.goal?.replace('_', ' ')}
          </span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
          <span className="text-gray-500">Diet Type</span>
          <span className="font-semibold text-gray-900 capitalize">
            {profile.dietType || 'Not specified'}
          </span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
          <span className="text-gray-500">Height / Weight</span>
          <span className="font-semibold text-gray-900">
            {profile.heightCm ? `${profile.heightCm} cm` : 'N/A'} /{' '}
            {profile.weightKg ? `${profile.weightKg} kg` : 'N/A'}
          </span>
        </div>

        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500">Medical Context</span>
          <span className="font-semibold text-gray-900">
            {profile.hasMedicalContext ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}
