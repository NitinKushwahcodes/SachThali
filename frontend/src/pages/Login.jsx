// Login page view handling authentication email/password submission.
// Sends credentials to POST /auth/login backend endpoint and stores httpOnly cookie.
// Redirects authenticated users to the /scan main dashboard route upon success.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';

// Component rendering user authentication login form.
export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Submits login credentials to backend auth API.
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (onLoginSuccess) onLoginSuccess(user);
      navigate('/scan');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to track your meals with AI</p>
        </div>

        {error && (
          <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#3F8F5F] text-white font-bold rounded-xl hover:bg-[#34774E] transition-colors shadow-sm mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#3F8F5F] font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
