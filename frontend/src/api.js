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
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let payload = null;
    let message = 'Request failed';
    if (contentType.includes('application/json')) {
      try { payload = await res.json(); } catch { payload = null; }
    } else {
      const text = await res.text();
      if (text) payload = { error: text };
    }
    if (payload?.error) message = payload.error;
    else if (payload?.message) message = payload.message;

    if (res.status === 401) {
      // clear stale token, keep a clean state
      localStorage.removeItem('token');
      // NOTE: we don't force-redirect; UI can handle it gracefully
    }

    const err = new Error(message);
    err.status = res.status;
    if (payload) {
      err.code = payload.code;
      err.details = payload;
    }
    throw err;
  }

  if (!contentType.includes('application/json')) {
    return res.text();
  }

  return res.json();
}
