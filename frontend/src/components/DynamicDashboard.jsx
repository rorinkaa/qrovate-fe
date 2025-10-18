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
const SIZE_OPTIONS = [
  { label: 'Web • 256px', value: 256 },
  { label: 'Print • 512px', value: 512 },
  { label: 'Large • 1024px', value: 1024 }
];

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
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
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
  const [qrName, setQrName] = useState('New dynamic QR');
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
          setQrName(normalized[0].name || 'Untitled QR');
        } else {
          setSel(null);
          setQrName('New dynamic QR');
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
      setQrName('New dynamic QR');
      setHistory([]);
      setHistoryStatus('idle');
      setHistoryError('');
      return;
    }
    setStyle(prev => ({ ...prev, ...(sel.style || {}) }));
    setQrName(sel.name || 'Untitled QR');
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

  const onNameChange = (value) => setQrName(value);

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
    if (updated?.name) {
      setQrName(updated.name);
    }
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
        body: JSON.stringify({ id: sel.id, target, style: stylePayload, name: qrName })
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
    <section className="dynamic-panel glass fade-up">
      <div className="panel-header">
        <span className="eyebrow">Dynamic Manager</span>
        <h3>Create &amp; evolve your dynamic QR library</h3>
        <p>Switch templates, experiment with destinations, and keep previews synced in real time.</p>
      </div>

      <div className="template-pills">
        {TEMPLATES.map(t => (
          <button key={t} className={tpl === t ? 'pill active' : 'pill'} onClick={() => selectTemplate(t)}>{t}</button>
        ))}
      </div>

      <div className="dynamic-grid">
        <div className="dynamic-config">
          <div className="dynamic-forms">
            <label className="control-field">
              <span>QR name</span>
              <input value={qrName} onChange={e => onNameChange(e.target.value)} placeholder="Campaign headline" />
            </label>
            <TemplateDataForm type={tpl} values={values} onChange={onValueChange} />
            <TemplatePreview type={tpl} values={values} />
          </div>

          <div className="style-stack">
            <div className="style-section">
              <div className="style-title">Export size</div>
              <div className="size-options">
                {SIZE_OPTIONS.map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    className={style.size === opt.value ? 'size-chip active' : 'size-chip'}
                    onClick={() => onSizeSelect(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="style-section">
              <div className="style-title">Colors</div>
              <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
                <button className={style.colorMode === 'solid' ? 'pill active' : 'pill'} onClick={()=>onStyleChange('colorMode','solid')}>Solid</button>
                <button className={style.colorMode === 'gradient' ? 'pill active' : 'pill'} onClick={()=>onStyleChange('colorMode','gradient')}>Gradient</button>
              </div>
              <div className="row wrap" style={{ gap: 12, marginBottom: 12 }}>
                <label className="control-field color-field">
                  <span>Primary</span>
                  <div className="color-input">
                    <input type="color" value={style.foreground} onChange={e=>onStyleChange('foreground', e.target.value)} />
                    <span>{style.foreground.toUpperCase()}</span>
                  </div>
                </label>
                {style.colorMode === 'gradient' && (
                  <>
                    <label className="control-field color-field">
                      <span>Secondary</span>
                      <div className="color-input">
                        <input type="color" value={style.foregroundSecondary} onChange={e=>onStyleChange('foregroundSecondary', e.target.value)} />
                        <span>{style.foregroundSecondary.toUpperCase()}</span>
                      </div>
                    </label>
                    <label className="control-field">
                      <span>Angle ({Math.round(style.gradientAngle)}°)</span>
                      <input type="range" min="0" max="360" value={style.gradientAngle} onChange={e=>onStyleChange('gradientAngle', +e.target.value)} />
                    </label>
                  </>
                )}
              </div>
              <label className="control-field color-field">
                <span>Background</span>
                <div className="color-input">
                  <input type="color" value={style.background} onChange={e=>onStyleChange('background', e.target.value)} />
                  <span>{style.background.toUpperCase()}</span>
                </div>
              </label>
            </div>

            <div className="style-section">
              <div className="style-title">Frame</div>
              <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
                <button className={style.frameStyle==='none'?'pill active':'pill'} onClick={()=>onStyleChange('frameStyle','none')}>None</button>
                <button className={style.frameStyle==='rounded'?'pill active':'pill'} onClick={()=>onStyleChange('frameStyle','rounded')}>Rounded</button>
                <button className={style.frameStyle==='label'?'pill active':'pill'} onClick={()=>onStyleChange('frameStyle','label')}>Label</button>
              </div>
              {style.frameStyle !== 'none' && (
                <div className="row wrap" style={{ gap: 12 }}>
                  <label className="control-field color-field">
                    <span>Frame color</span>
                    <div className="color-input">
                      <input type="color" value={style.frameColor} onChange={e=>onStyleChange('frameColor', e.target.value)} />
                      <span>{style.frameColor.toUpperCase()}</span>
                    </div>
                  </label>
                  {style.frameStyle === 'label' && (
                    <>
                      <label className="control-field">
                        <span>Text</span>
                        <input value={style.frameText} onChange={e=>onStyleChange('frameText', e.target.value)} />
                      </label>
                      <label className="control-field color-field">
                        <span>Text color</span>
                        <div className="color-input">
                          <input type="color" value={style.frameTextColor} onChange={e=>onStyleChange('frameTextColor', e.target.value)} />
                          <span>{style.frameTextColor.toUpperCase()}</span>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="style-section">
              <div className="style-title">Logo overlay</div>
              {isPro ? (
                <div className="row wrap" style={{ gap: 12 }}>
                  <input type="file" accept="image/*" onChange={onLogoUpload} />
                  <label className="control-field">
                    <span>Size</span>
                    <input type="range" min="0.15" max="0.35" step="0.01" value={style.logoSizeRatio} onChange={e=>onStyleChange('logoSizeRatio', parseFloat(e.target.value))} />
                  </label>
                  {style.logoDataUrl && <button type="button" onClick={removeLogo}>Remove Logo</button>}
                </div>
              ) : (
                <div className="small">Upgrade to Pro to add a logo overlay</div>
              )}
            </div>
          </div>

          <div className="action-row">
            <button onClick={createDynamic} disabled={busy}>{busy ? 'Please wait…' : 'Create Dynamic QR'}</button>
            <button onClick={updateSelected} disabled={busy || !sel?.id}>Update Selected</button>
          </div>
          {err && <div className="alert-error">{err}</div>}
          {msg && <div className="alert-success">{msg}</div>}
        </div>

        <div className="dynamic-preview preview-card">
          <div className="preview-frame">
            <canvas ref={previewRef} style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
          {sel?.id ? (
            <>
              <div className="preview-meta">Preview: {Math.round(previewInfo.width)} × {Math.round(previewInfo.height)} px</div>
              <div className="download-row">
                <button type="button" className="btn-primary" onClick={()=>downloadStyled('png')}>Download PNG</button>
                <button type="button" className="btn-outline" onClick={()=>downloadStyled('jpeg')}>Download JPG</button>
              </div>
            </>
          ) : (
            <div className="preview-empty">Create a QR to see a styled preview.</div>
          )}
        </div>

        <aside className="dynamic-meta">
          <div className="stats-row">
            {stats.map(stat => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
            ))}
          </div>

          <div className="history-card glass">
            <div className="history-title">Recent activity</div>
            {historyStatus === 'loading' && <div className="history-muted">Loading…</div>}
            {historyStatus === 'error' && <div className="history-error">{historyError}</div>}
            {historyStatus === 'ready' && history.length === 0 && (
              <div className="history-muted">No activity recorded yet.</div>
            )}
            {historyStatus === 'ready' && history.length > 0 && (
              <ul className="history-list">
                {history.map((event, idx) => (
                  <li key={idx} className="history-item">
                    <span>{historyDescription(event)}</span>
                    <time>{formatRelative(event.ts)}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <div className="library-header">
        <h3>My dynamic codes</h3>
        <p>Each code previews in real time — select one to edit or share the public link.</p>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">No dynamic QR codes yet.</div>
      ) : (
        <div className="library-grid">
          {items.map(it => (
            <div
              key={it.id}
              className={sel?.id === it.id ? 'library-card active' : 'library-card'}
              onClick={() => {
                setSel(it);
                setQrName(it.name || 'Untitled QR');
              }}
            >
              <span>{it.name || it.id.slice(0, 8)}</span>
              <a href={`${API}/qr/${it.id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Open ↗</a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
