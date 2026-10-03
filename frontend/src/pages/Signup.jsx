// Signup page view handling new user registration email/password submission.
// Sends payload to POST /auth/signup endpoint and initializes session httpOnly cookie.
// Navigates newly registered users directly into the onboarding workflow.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';

// Component rendering user account registration form.
export default function Signup({ onSignupSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handles new account creation form submission.
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (onSignupSuccess) onSignupSuccess(user);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#3F8F5F] text-white font-bold rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Start tracking Indian food with AI accuracy</p>
        </div>

        {error && (
          <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@domain.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#3F8F5F] text-white font-bold rounded-xl hover:bg-[#34774E] transition-colors shadow-sm mt-2"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#3F8F5F] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
