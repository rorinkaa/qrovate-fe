
export function saveLocal(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
export function loadLocal(key, def=null){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; } }
export function uid(){ return Date.now() + '_' + Math.random().toString(36).slice(2,8); }
