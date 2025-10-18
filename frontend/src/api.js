// src/api.js
export const API = import.meta.env.VITE_API_URL || "https://qrovate.onrender.com";

/** Read token from the places your app uses */
function readToken() {
  const direct = localStorage.getItem('token');
  if (direct) return direct;

  try {
    const u = JSON.parse(localStorage.getItem('qr_user') || 'null');
    // support common keys
    return u?.token || u?.jwt || null;
  } catch {
    return null;
  }
}

/** attach Authorization header if token exists */
export function withAuth(opts = {}) {
  const token = readToken();
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { ...opts, headers };
}

/** unified API helper */
export async function api(path, opts = {}) {
  const res = await fetch(API + path, withAuth(opts));

  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}

    if (res.status === 401) {
      // clear stale token, keep a clean state
      localStorage.removeItem('token');
      // NOTE: we don't force-redirect; UI can handle it gracefully
    }

    throw new Error(msg);
  }

  return res.json();
}