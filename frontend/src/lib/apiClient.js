// Client-side HTTP fetch utility for interacting with backend REST API endpoints.
// Sets default credentials: 'include' for cross-origin httpOnly cookie authentication.
// Supports production VITE_API_URL and VITE_API_BASE_URL environment variables for AWS Amplify and Vercel deployments.

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Generic JSON fetch wrapper attaching content-type headers and cookie credentials.
export async function apiFetch(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status} Error`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Multipart form-data fetch helper for file uploads (e.g. food photo scans).
export async function apiUpload(endpoint, formData) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status} Error`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Formats technical API errors into warm, human-friendly messages for end users.
export function formatUserFriendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  if (typeof err === 'string') return err;

  const status = err.status;
  const msg = err.message || '';

  if (status === 401) return 'Your session expired. Please log in again.';
  if (status === 403) return 'Access denied. Upgrade your plan to unlock this feature.';
  if (status === 404) return 'The requested information was not found.';
  if (status === 413 || msg.toLowerCase().includes('large') || msg.toLowerCase().includes('file')) {
    return 'Photo file size is too large. Try taking a smaller photo.';
  }
  if (status >= 500) return 'Couldn\'t process request right now. Please try again in a moment.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  if (msg.includes('Error:') || msg.includes('ZodError') || msg.includes('Prisma') || msg.includes('at ')) {
    return 'Could not process food details clearly. Try a clearer photo or use Quick-Log.';
  }

  return msg;
}
