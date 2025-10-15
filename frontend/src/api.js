export const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function withAuth(opts = {}){
  const token = localStorage.getItem('token');
  const headers = Object.assign({}, opts.headers || {});
  if(token) headers['Authorization'] = `Bearer ${token}`;
  return Object.assign({}, opts, { headers });
}

export async function api(path, opts={}){
  const r = await fetch(API + path, withAuth(opts));
  if(!r.ok){
    let msg = 'Request failed';
    try { const j = await r.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}
