import { getToken, logout } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getErrorMessage(status, data, auth) {
  if (status === 401 && auth) return 'Your session has expired. Please sign in again.';
  if (status === 401) return data?.message || 'Invalid email or password.';
  if (status === 403) return 'You are not authorized.';
  if (status === 404) return data?.message || 'The requested item could not be found.';
  if (status === 400 || status === 409) return data?.message || 'Please check the information and try again.';
  if (status === 503) return data?.message || 'The requested service is temporarily unavailable.';
  if (status >= 500) return 'Something went wrong. Please try again later.';
  return data?.message || 'The request could not be completed.';
}

export async function apiFetch(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const token = auth ? getToken() : null;

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers
    });
  } catch {
    throw new Error('Unable to connect to server.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth) {
      logout();
      if (window.location.pathname !== '/login') window.location.replace('/login');
    }

    const error = new Error(getErrorMessage(response.status, data, auth));
    error.status = response.status;
    throw error;
  }

  return data;
}