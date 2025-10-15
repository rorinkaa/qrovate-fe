// src/api.js
export const API = import.meta.env.VITE_API_URL || "https://qrovate.onrender.com";

// attach Authorization header if token exists
export function withAuth(opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { ...opts, headers };
}

// unified API helper
export async function api(path, opts = {}) {
  const res = await fetch(API + path, withAuth(opts));

  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}

    // optional: auto logout if session expired
    if (res.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // uncomment if you want redirect
    }

    throw new Error(msg);
  }

  return res.json();
}
