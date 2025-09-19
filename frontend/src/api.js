// Change this to your Render backend URL:
export const API = "https://qrovate.onrender.com";

// Utility for API calls
export async function api(path, opts = {}) {
  const r = await fetch(API + path, opts);
  if (!r.ok) {
    let msg = 'Request failed';
    try { const j = await r.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}
