import React, { useEffect, useRef, useState } from 'react';
import { api, API } from '../api';
import { renderStyledQR } from '../lib/styledQr';
import TemplatePreview from './TemplatePreview.jsx';
import {
  TEMPLATES,
  TEMPLATE_DEFAULTS,
  buildPayload,
  TemplateDataForm,
  normalizeUrl
} from './TemplateDataForm.jsx';

const STYLE_DEFAULTS = {
  size: 320,
  background: '#F8FAFC',
  colorMode: 'solid',
  foreground: '#0B1120',
  foregroundSecondary: '#2563EB',
  gradientAngle: 45,
  frameStyle: 'none',
  frameColor: '#FFFFFF',
  frameText: 'SCAN ME',
  frameTextColor: '#0B1120',
  logoSizeRatio: 0.22,
  logoDataUrl: null
};

const MAX_HISTORY_ITEMS = 60;

function formatNumber(num) {
  return new Intl.NumberFormat().format(Number(num || 0));
}

function formatTimestamp(ts) {
  if (!ts) return 'Never';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRelative(ts) {
  if (!ts) return '—';
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) {
    const seconds = Math.round(diff / 1000);
    return seconds === 0 ? 'just now' : `${Math.abs(seconds)}s ${seconds > 0 ? 'from now' : 'ago'}`;
  }
  if (abs < hour) {
    const minutes = Math.round(diff / minute);
    return `${Math.abs(minutes)}m ${minutes > 0 ? 'from now' : 'ago'}`;
  }
  if (abs < day) {
    const hours = Math.round(diff / hour);
    return `${Math.abs(hours)}h ${hours > 0 ? 'from now' : 'ago'}`;
  }
  const days = Math.round(diff / day);
  return `${Math.abs(days)}d ${days > 0 ? 'from now' : 'ago'}`;
}

function historyDescription(event) {
  if (!event) return '';
  switch (event.type) {
    case 'create':
      return 'QR created';
    case 'update':
      return 'Destination updated';
    case 'scan':
      return event.ok ? 'Scan recorded' : 'Scan blocked';
    default:
      return event.type;
  }
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{
      flex: '1 1 140px',
      minWidth: 120,
      borderRadius: 16,
      background: '#fff',
      border: '1px solid rgba(15,23,42,0.08)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</div>}
    </div>
  );
}

const renderStylePayload = (style, allowLogo) => {
  const safe = {
    size: Math.round(style.size),
    background: style.background,
    colorMode: style.colorMode,
    foreground: style.foreground,
    foregroundSecondary: style.foregroundSecondary,
    gradientAngle: Math.round(style.gradientAngle),
    frameStyle: style.frameStyle,
    frameColor: style.frameColor,
    frameText: style.frameText,
    frameTextColor: style.frameTextColor,
    logoSizeRatio: Number(style.logoSizeRatio || STYLE_DEFAULTS.logoSizeRatio)
  };
  if (allowLogo && style.logoDataUrl) {
    safe.logoDataUrl = style.logoDataUrl;
  }
  return safe;
};

export default function DynamicDashboard({ user }) {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const [tpl, setTpl] = useState('URL');
  const [values, setValues] = useState({ ...TEMPLATE_DEFAULTS.URL });
  const [style, setStyle] = useState({ ...STYLE_DEFAULTS });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [history, setHistory] = useState([]);
  const [historyStatus, setHistoryStatus] = useState('idle'); // idle | loading | error | ready
  const [historyError, setHistoryError] = useState('');
  const previewRef = useRef(null);
  const [previewInfo, setPreviewInfo] = useState({ width: 0, height: 0 });
  const draftsRef = useRef({});
  const isPro = !!user?.is_pro;

  useEffect(() => {
    (async () => {
      try {
        const list = await api('/qr/list');
        const normalized = (list || []).map(it => ({
          ...it,
          style: it.style || null
        }));
        setItems(normalized);
        if (normalized.length) {
          setSel(normalized[0]);
        } else {
          setSel(null);
        }
        setErr('');
      } catch (e) {
        setErr('Failed to load your dynamic QR codes');
      }
    })();
  }, []);

  useEffect(() => {
    draftsRef.current = {};
    if (!sel) {
      setTpl('URL');
      setValues({ ...TEMPLATE_DEFAULTS.URL });
      setStyle({ ...STYLE_DEFAULTS });
      setHistory([]);
      setHistoryStatus('idle');
      setHistoryError('');
      return;
    }
    setStyle(prev => ({ ...prev, ...(sel.style || {}) }));
    const target = sel.target || '';
    if (target && !target.includes('/payload.html')) {
      setTpl('URL');
      setValues({ ...TEMPLATE_DEFAULTS.URL, url: target });
    } else {
      setTpl('URL');
      setValues({ ...TEMPLATE_DEFAULTS.URL });
    }
    loadHistory(sel.id);
  }, [sel?.id]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!sel?.id || !canvas) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      setPreviewInfo({ width: 0, height: 0 });
      return;
    }
    let cancelled = false;
    (async () => {
      const info = await renderStyledQR(canvas, `${API}/qr/${sel.id}`, {
        size: style.size,
        background: style.background,
        colorMode: style.colorMode,
        foreground: style.foreground,
        foregroundSecondary: style.foregroundSecondary,
        gradientAngle: style.gradientAngle,
        frameStyle: style.frameStyle,
        frameColor: style.frameColor,
        frameText: style.frameText,
        frameTextColor: style.frameTextColor,
        logoDataUrl: isPro ? style.logoDataUrl : null,
        logoSizeRatio: style.logoSizeRatio,
        allowLogo: isPro
      });
      if (!cancelled && info) setPreviewInfo(info);
    })();
    return () => { cancelled = true; };
  }, [sel?.id, style, isPro]);

  const selectTemplate = (next) => {
    draftsRef.current[tpl] = values;
    const stored = draftsRef.current[next] || TEMPLATE_DEFAULTS[next] || {};
    setValues({ ...stored });
    setTpl(next);
  };

  const onValueChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const onStyleChange = (key, value) => {
    setStyle(prev => ({ ...prev, [key]: value }));
  };

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onStyleChange('logoDataUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => onStyleChange('logoDataUrl', null);

  const downloadStyled = (type = 'png') => {
    if (!sel?.id || !previewRef.current) return;
    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const data = previewRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    a.download = `${sel.id}_styled.${type}`;
    a.click();
  };

  const loadHistory = async (id) => {
    if (!id) return;
    setHistoryStatus('loading');
    setHistoryError('');
    try {
      const data = await api(`/qr/history/${id}`);
      const events = (data?.events || []).slice(-MAX_HISTORY_ITEMS);
      setHistory(events.reverse());
      setHistoryStatus('ready');
    } catch (e) {
      setHistoryError('Failed to load history');
      setHistoryStatus('error');
    }
  };

  const updateListItem = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    setSel(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const createDynamic = async () => {
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const stylePayload = renderStylePayload(style, isPro);
      const created = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: '', style: stylePayload })
      });
      const normalized = { ...created, style: created.style || {} };
      setItems(prev => [normalized, ...prev]);
      setSel(normalized);
      setMsg('Dynamic QR created. Configure the destination and click “Update Selected”.');
      await loadHistory(normalized.id);
    } catch (e) {
      setErr(e.message || 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = async () => {
    if (!sel?.id) return;
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const payload = buildPayload(tpl, values);
      let target = '';
      if (tpl === 'URL') {
        target = normalizeUrl(payload);
      } else {
        const url = `${window.location.origin}/payload.html?type=${encodeURIComponent(tpl)}&data=${encodeURIComponent(payload)}`;
        target = url;
      }
      const stylePayload = renderStylePayload(style, isPro);
      const updated = await api('/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sel.id, target, style: stylePayload })
      });
      const normalized = { ...updated, style: updated.style || {} };
      updateListItem(normalized);
      setMsg('Saved.');
      await loadHistory(sel.id);
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: 'Total scans', value: formatNumber(sel?.scanCount || 0) },
    { label: 'Blocked', value: formatNumber(sel?.blockedCount || 0) },
    { label: 'Last scan', value: formatTimestamp(sel?.lastScanAt) }
  ];

  return (
    <section className="card">
      <div className="label">Dynamic (Create & Manage)</div>

      <div className="row wrap" style={{ gap: 8, marginBottom: 10 }}>
        {TEMPLATES.map(t => (
          <button key={t} className={tpl === t ? 'pill active' : 'pill'} onClick={() => selectTemplate(t)}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: '1 1 320px', minWidth: 260 }}>
          <TemplateDataForm type={tpl} values={values} onChange={onValueChange} />
        </div>
        <TemplatePreview type={tpl} values={values} />
      </div>

      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button onClick={createDynamic} disabled={busy}>{busy ? 'Please wait…' : 'Create Dynamic QR'}</button>
        <button onClick={updateSelected} disabled={busy || !sel?.id}>Update Selected</button>
      </div>

      {err && <div style={{ color: '#d33', marginTop: 8 }}>{err}</div>}
      {msg && <div style={{ color: '#0a7', marginTop: 8 }}>{msg}</div>}

      <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 320px', textAlign: 'center' }}>
          <canvas ref={previewRef} style={{ maxWidth: '100%', height: 'auto' }} />
          {sel?.id ? (
            <>
              <div className="small" style={{ marginTop: 8, color: '#4B5563' }}>
                Preview: {Math.round(previewInfo.width)} × {Math.round(previewInfo.height)} px
              </div>
              <div className="row wrap" style={{ gap: 8, justifyContent: 'center', marginTop: 8 }}>
                <button onClick={() => downloadStyled('png')}>Download PNG</button>
                <button onClick={() => downloadStyled('jpeg')}>Download JPG</button>
              </div>
            </>
          ) : (
            <div className="small" style={{ marginTop: 8, color: '#6B7280' }}>Create a QR to see a styled preview.</div>
          )}
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Design & styling</div>
            <label className="small" style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>QR Size
              <input type="range" min="240" max="720" value={style.size} onChange={e => onStyleChange('size', +e.target.value)} />
            </label>

            <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Colors</div>
            <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
              <button className={style.colorMode === 'solid' ? 'pill active' : 'pill'} onClick={() => onStyleChange('colorMode', 'solid')}>Solid</button>
              <button className={style.colorMode === 'gradient' ? 'pill active' : 'pill'} onClick={() => onStyleChange('colorMode', 'gradient')}>Gradient</button>
            </div>
            <div className="row wrap" style={{ gap: 12, marginBottom: 12 }}>
              <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Primary
                <input type="color" value={style.foreground} onChange={e => onStyleChange('foreground', e.target.value)} />
              </label>
              {style.colorMode === 'gradient' && (
                <>
                  <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Secondary
                    <input type="color" value={style.foregroundSecondary} onChange={e => onStyleChange('foregroundSecondary', e.target.value)} />
                  </label>
                  <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Angle ({Math.round(style.gradientAngle)}°)
                    <input type="range" min="0" max="360" value={style.gradientAngle} onChange={e => onStyleChange('gradientAngle', +e.target.value)} />
                  </label>
                </>
              )}
            </div>

            <label className="small" style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>Background
              <input type="color" value={style.background} onChange={e => onStyleChange('background', e.target.value)} />
            </label>

            <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Frame</div>
            <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
              <button className={style.frameStyle === 'none' ? 'pill active' : 'pill'} onClick={() => onStyleChange('frameStyle', 'none')}>None</button>
              <button className={style.frameStyle === 'rounded' ? 'pill active' : 'pill'} onClick={() => onStyleChange('frameStyle', 'rounded')}>Rounded</button>
              <button className={style.frameStyle === 'label' ? 'pill active' : 'pill'} onClick={() => onStyleChange('frameStyle', 'label')}>Label</button>
            </div>
            {style.frameStyle !== 'none' && (
              <div className="row wrap" style={{ gap: 12, marginBottom: 12 }}>
                <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Frame color
                  <input type="color" value={style.frameColor} onChange={e => onStyleChange('frameColor', e.target.value)} />
                </label>
                {style.frameStyle === 'label' && (
                  <>
                    <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Text
                      <input value={style.frameText} onChange={e => onStyleChange('frameText', e.target.value)} />
                    </label>
                    <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Text color
                      <input type="color" value={style.frameTextColor} onChange={e => onStyleChange('frameTextColor', e.target.value)} />
                    </label>
                  </>
                )}
              </div>
            )}

            <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Logo (Pro)</div>
            {isPro ? (
              <div className="row wrap" style={{ gap: 12, marginBottom: 12 }}>
                <input type="file" accept="image/*" onChange={onLogoUpload} />
                <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Size
                  <input type="range" min="0.15" max="0.35" step="0.01" value={style.logoSizeRatio} onChange={e => onStyleChange('logoSizeRatio', parseFloat(e.target.value))} />
                </label>
                {style.logoDataUrl && <button onClick={removeLogo}>Remove Logo</button>}
              </div>
            ) : (
              <div className="small" style={{ marginBottom: 12 }}>Upgrade to Pro to add a logo overlay</div>
            )}
          </div>

          <div>
            <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Analytics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {stats.map(stat => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
              ))}
            </div>

            <div style={{
              borderRadius: 16,
              background: '#fff',
              border: '1px solid rgba(15,23,42,0.08)',
              padding: '16px 18px',
              maxHeight: 220,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Activity</div>
              {historyStatus === 'loading' && <div className="small" style={{ color: '#94a3b8' }}>Loading…</div>}
              {historyStatus === 'error' && <div className="small" style={{ color: '#dc2626' }}>{historyError}</div>}
              {historyStatus === 'ready' && history.length === 0 && (
                <div className="small" style={{ color: '#94a3b8' }}>No activity recorded yet.</div>
              )}
              {historyStatus === 'ready' && history.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.map((event, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ fontSize: 14, color: '#0f172a' }}>{historyDescription(event)}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatRelative(event.ts)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>My dynamic codes</h3>
      {items.length === 0 ? (
        <div style={{ color: '#666' }}>No dynamic QR codes yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(it => (
            <div key={it.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
              <button className={sel?.id === it.id ? 'pill active' : 'pill'} onClick={() => setSel(it)}>{it.id.slice(0, 8)}…</button>
              <a href={`${API}/qr/${it.id}`} target="_blank" rel="noreferrer">Open</a>
              <img
                src={`${API}/qr/svg/${it.id}`}
                alt="qr"
                width={72}
                height={72}
                style={{ border: '1px solid #eee', borderRadius: 8 }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
