import { api } from '../api';

// Simple persistent sync queue for static designs saved locally.
// Items are stored in localStorage under 'qr_static_sync_queue'. Each item:
// { id, payload, attempts, createdAt }

const QUEUE_KEY = 'qr_static_sync_queue';
const MAX_ATTEMPTS = 6;
let processing = false;
let listeners = [];

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY) || '[]';
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeQueue(q) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch (e) {
    // ignore
  }
}

export function addToQueue(item) {
  // Skip queueing if we can save directly to server
  (async () => {
    try {
      const created = await api('/qr/static/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
      if (created && created.id) {
        // Successfully saved to server, no need to queue
        return;
      }
    } catch (e) {
      // Server failed, fall back to queue
    }
    // Add to queue as fallback
    const q = readQueue();
    const existing = q.find(i => i.id === item.id);
    if (existing) return;
    q.push({ id: item.id, payload: item, attempts: 0, createdAt: Date.now() });
    writeQueue(q);
    // kick off processing
    processQueue();
  })();
}

export function onItemSynced(cb) {
  if (typeof cb === 'function') listeners.push(cb);
  return () => { listeners = listeners.filter(f => f !== cb); };
}

function backoffDelay(attempts) {
  // exponential backoff with jitter (ms)
  const base = Math.min(30000, 1000 * Math.pow(2, attempts));
  const jitter = Math.floor(Math.random() * 800);
  return base + jitter;
}

export async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    let q = readQueue();
    for (let i = 0; i < q.length; i++) {
      const item = q[i];
      if (!item) continue;
      if (item.attempts >= MAX_ATTEMPTS) continue;
      // Try immediately
      try {
        const created = await api('/qr/static/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.payload) });
        if (created && created.id) {
          // notify listeners: (created, originalLocalId)
          listeners.forEach(fn => {
            try { fn(created, item.id); } catch (e) { /* ignore listener errors */ }
          });
          // remove item from queue
          q = q.filter(x => x.id !== item.id);
          writeQueue(q);
          // continue without delay
          i--;
          continue;
        }
      } catch (e) {
        // failed — schedule retry by updating attempts and delaying
        item.attempts = (item.attempts || 0) + 1;
        const delay = backoffDelay(item.attempts);
        writeQueue(q.map(x => x.id === item.id ? item : x));
        // schedule next attempt after delay
        setTimeout(() => {
          processQueue();
        }, delay);
        // break current loop to avoid aggressive retries
        break;
      }
    }
  } finally {
    processing = false;
  }
}

// start processing on module load (if localStorage available)
if (typeof window !== 'undefined') {
  // slight delay to allow app initialization
  setTimeout(() => processQueue(), 1200);
}
