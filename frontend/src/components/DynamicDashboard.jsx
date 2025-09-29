import React, { useEffect, useState } from 'react';
import { api, API } from '../api';

export default function DynamicDashboard({ user }) {
  const [target, setTarget] = useState('https://example.com');
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const list = await api(`/qr/list?owner=${encodeURIComponent(user.email)}`);
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setMsg('Failed to load your dynamic QR codes');
    }
  }
  useEffect(() => { load(); }, [user.email]);

  async function create() {
    setMsg('');
    try {
      const data = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: user.email, target })
      });
      setTarget('');
      setItems(prev => [data, ...prev]);
    } catch (err) {
      setMsg(err.message || 'Failed to create');
    }
  }

  async function save(id, newTarget) {
    try {
      const data = await api('/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, owner: user.email, target: newTarget })
      });
      setItems(items.map(i => i.id === id ? data : i));
    } catch (err) {
      setMsg(err.message || 'Failed to update');
    }
  }

  async function refreshStats(id) {
    try {
      const stat = await api(`/qr/stats/${id}`);
      setItems(items.map(i => i.id === id ? { ...i, ...stat } : i));
    } catch { /* ignore */ }
  }

  return (
    <section className="card">
      <div className="label">Dynamic QR (editable)</div>

      <div className="row" style={{ marginTop: 8, gap: 8 }}>
        <input
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Target URL"
          style={{ flex: 1 }}
        />
        <button onClick={create}>Create Dynamic QR</button>
      </div>
      {msg && <div className="small" style={{ color: 'crimson', marginTop: 8 }}>{msg}</div>}

      <div style={{ marginTop: 12 }}>
        {items.map(it => (
          <div key={it.id} className="row" style={{ alignItems: 'center', gap: 12 }}>
            <img
              src={`${API}/qr/svg/${it.id}`}
              alt="qr"
              width="64"
              height="64"
              style={{ background: '#fff', padding: 4, borderRadius: 8 }}
            />
            <a className="btn secondary" href={`${API}/qr/${it.id}`} target="_blank" rel="noreferrer">Open</a>
            <input
              value={it.target || ''}
              onChange={e => {
                const v = e.target.value;
                setItems(items.map(x => x.id === it.id ? { ...x, target: v } : x));
              }}
              style={{ flex: 1 }}
            />
            <button onClick={() => save(it.id, it.target)}>Update</button>
            <button onClick={() => refreshStats(it.id)}>Refresh stats</button>
            {typeof it.scanCount === 'number' && (
              <span className="badge">Scans: {it.scanCount}</span>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="muted">No dynamic QR codes yet.</p>}
      </div>
    </section>
  );
}