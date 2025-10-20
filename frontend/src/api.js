// src/api.js
// Prefer explicit VITE_API_URL, otherwise use localhost in dev, production host in prod
const DEFAULT_API = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://qrovate.onrender.com');
export const API = DEFAULT_API;

function apiHostKey() {
  try {
    const url = new URL(API);
    // use host (hostname:port) as namespace
    return url.host.replace(/[:\/\.@]/g, '_');
  } catch {
    return 'default';
  }
}

/** Read token from namespaced storage (avoid mixing prod/dev tokens) */
function readToken() {
  const ns = apiHostKey();
  // 1) namespaced token key
  const directNamespaced = localStorage.getItem(`token@${ns}`);
  if (directNamespaced) return directNamespaced;

  // 2) legacy global token
  const direct = localStorage.getItem('token');
  if (direct) return direct;

  // 3) namespaced qr_user
  try {
    const raw = localStorage.getItem(`qr_user@${ns}`) || localStorage.getItem('qr_user') || 'null';
    const u = JSON.parse(raw);
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
      // clear stale token for this API host and legacy key
      try { const ns = apiHostKey(); localStorage.removeItem(`token@${ns}`); } catch(_){}
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
