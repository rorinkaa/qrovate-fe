import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from './ui/GlassCard.jsx';
import { api, API } from '../api';
import TemplatePreview from './TemplatePreview.jsx';
import { buildPayload } from './TemplateDataForm.jsx';
import { renderStyledQR } from '../lib/styledQr';

const STATIC_SAVE_KEY = 'qr_static_designs';
const STATIC_STYLE_DEFAULTS = {
  size: 320,
  background: '#ffffff',
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

export default function MyQRCodes({ onCreateNew, onEdit, version = 0 }) {
  const [dynamicCodes, setDynamicCodes] = useState([]);
  const [staticDesigns, setStaticDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const formatRelative = useCallback((value) => {
    if (!value) return 'moments ago';
    const diff = Date.now() - Number(value);
    const minutes = Math.round(diff / (60 * 1000));
    if (minutes < 1) return 'moments ago';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }, []);

  const loadStaticDesigns = useCallback(() => {
    if (typeof window === 'undefined') {
      setStaticDesigns([]);
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(STATIC_SAVE_KEY) || '[]');
      setStaticDesigns(Array.isArray(stored) ? stored : []);
    } catch {
      setStaticDesigns([]);
    }
  }, []);

  useEffect(() => {
    loadStaticDesigns();
  }, [version, loadStaticDesigns]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const list = await api('/qr/list');
        if (!ignore) {
          setDynamicCodes(list || []);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to fetch QR codes');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [version]);

  const handleDeleteStatic = useCallback((id) => {
    const next = staticDesigns.filter(design => design.id !== id);
    setStaticDesigns(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STATIC_SAVE_KEY, JSON.stringify(next));
    }
  }, [staticDesigns]);

  const onStartStatic = () => onCreateNew?.({ type: 'static-new', codeId: null });

  return (
    <div className="mycodes-page">
      <GlassCard className="summary-hero compact">
        <div className="summary-heading">
          <span className="eyebrow">Library</span>
          <h2>Your QR workspace</h2>
          <p className="summary-text">
            Browse dynamic campaigns from the backend and any static designs saved locally on this device.
          </p>
        </div>
        <div className="summary-actions">
          <button className="btn-secondary ghost" onClick={() => onCreateNew?.({ type: 'dynamic-new', codeId: null })}>
            New dynamic QR
          </button>
          <button className="btn-primary" onClick={onStartStatic}>
            Design static QR
          </button>
        </div>
      </GlassCard>

      <GlassCard className="library-card-grid">
        <header className="library-section-header">
          <div>
            <h3>Dynamic QR codes</h3>
            <p>Synced from your backend. Edit destinations, download assets, or review scans.</p>
          </div>
          <button className="btn-secondary ghost" onClick={() => onCreateNew?.({ type: 'dynamic-new', codeId: null })}>
            Create new
          </button>
        </header>

        {loading ? (
          <div className="history-muted">Loading your dynamic library…</div>
        ) : error ? (
          <div className="history-error">{error}</div>
        ) : dynamicCodes.length === 0 ? (
          <div className="empty-state">
            <strong>Nothing yet.</strong>
            <p>Create your first dynamic QR and it will show up here automatically.</p>
          </div>
        ) : (
          <div className="code-card-grid">
            {dynamicCodes.map(code => {
              const isExpanded = expandedId === code.id;
              return (
                <article key={code.id} className={['code-card', isExpanded ? 'expanded' : ''].join(' ')}>
                  <div className="code-card-header">
                    <div>
                      <span className="badge subtle">Dynamic</span>
                      <h4>{code.name || `QR ${code.id.slice(0, 6)}`}</h4>
                    </div>
                    <span className="meta">{formatRelative(code.updatedAt || code.createdAt)}</span>
                  </div>
                  <p className="code-card-target">{code.target || 'No destination configured yet.'}</p>
                  <div className="code-card-actions">
                    <button type="button" className="btn-secondary ghost" onClick={() => onEdit?.({ type: 'dynamic', codeId: code.id })}>
                      Edit flow
                    </button>
                    <a className="btn-secondary ghost" href={`${API}/qr/${code.id}`} target="_blank" rel="noreferrer">
                      Open link
                    </a>
                    <a className="btn-secondary ghost" href={`${API}/qr/svg/${code.id}`} target="_blank" rel="noreferrer">
                      Download SVG
                    </a>
                    <button
                      type="button"
                      className="btn-secondary ghost"
                      onClick={() => setExpandedId(isExpanded ? null : code.id)}
                    >
                      {isExpanded ? 'Hide stats' : 'View stats'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="code-card-stats">
                      <div><span>Total scans</span><strong>{code.scanCount ?? 0}</strong></div>
                      <div><span>Blocked scans</span><strong>{code.blockedCount ?? 0}</strong></div>
                      <div><span>Last scan</span><strong>{code.lastScanAt ? new Date(code.lastScanAt).toLocaleString() : 'Not yet scanned'}</strong></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="library-card-grid">
        <header className="library-section-header">
          <div>
            <h3>Static designs on this device</h3>
            <p>Saved locally for quick access. Download assets or remove designs you no longer need.</p>
          </div>
          <button className="btn-secondary ghost" onClick={onStartStatic}>
            New static design
          </button>
        </header>

        {staticDesigns.length === 0 ? (
          <div className="empty-state">
            <strong>No static designs saved.</strong>
            <p>Use the builder to create a static QR and hit “Save static design” on the review step.</p>
          </div>
        ) : (
          <div className="static-grid">
            {staticDesigns.map(design => (
              <StaticDesignCard
                key={design.id}
                design={design}
                onDelete={handleDeleteStatic}
                formatRelative={formatRelative}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function StaticDesignCard({ design, onDelete, formatRelative }) {
  const canvasRef = useRef(null);
  const payload = useMemo(() => design.payload || buildPayload(design.template, design.values), [design]);
  const style = useMemo(() => ({ ...STATIC_STYLE_DEFAULTS, ...(design.style || {}) }), [design]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!canvasRef.current) return;
      try {
        await renderStyledQR(canvasRef.current, payload, { ...style, allowLogo: true });
      } catch {
        // ignore rendering errors
      }
    })();
    return () => { ignore = true; };
  }, [payload, style]);

  const getSafeName = () => (design.name || 'static_qr').trim().replace(/\s+/g, '_').toLowerCase();

  const downloadFromCanvas = (type = 'png') => {
    if (!canvasRef.current) return;
    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const data = canvasRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    a.download = `${getSafeName()}_${type.toUpperCase()}.${type}`;
    a.click();
  };

  const downloadPdf = () => {
    if (!canvasRef.current) return;
    const data = canvasRef.current.toDataURL('image/png');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${design.name}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;"><img src="${data}" style="max-width:90vw;max-height:90vh;" /></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadSvg = () => {
    if (!canvasRef.current) return;
    const data = canvasRef.current.toDataURL('image/png');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${data}" width="${width}" height="${height}"/></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSafeName()}_preview.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const templateLabel = design.template || 'Template';

  return (
    <article className="static-card">
      <div className="static-card-preview">
        <canvas ref={canvasRef} />
      </div>
      <div className="static-card-body">
        <div className="static-card-meta">
          <span className="badge subtle">{templateLabel}</span>
          <h4>{design.name || 'Static QR design'}</h4>
          <p>{formatStaticSummary(design.template, design.values)}</p>
        </div>
        <div className="static-card-content">
          <div className="static-card-mock">
            <div className="preview-phone">
              <div className="preview-phone-notch" />
              <div className="preview-phone-screen">
                <TemplatePreview type={design.template} values={design.values} />
              </div>
            </div>
          </div>
          <div className="static-card-controls">
            <div className="download-chip-row">
              <button className="btn-secondary ghost" onClick={() => downloadFromCanvas('png')}>PNG</button>
              <button className="btn-secondary ghost" onClick={() => downloadFromCanvas('jpeg')}>JPG</button>
              <button className="btn-secondary ghost" onClick={downloadPdf}>PDF</button>
              <button className="btn-secondary ghost" onClick={downloadSvg}>SVG</button>
            </div>
            <div className="static-card-footer">
              <span>Saved {formatRelative(design.createdAt)}</span>
              <button className="link danger" onClick={() => onDelete(design.id)}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatStaticSummary(template, values = {}) {
  switch (template) {
    case 'URL':
      return values.url ? `Opens ${values.url}` : 'Add a destination URL.';
    case 'TEXT':
      return values.text ? `Displays “${values.text.slice(0, 60)}${values.text.length > 60 ? '…' : ''}”` : 'Shows a text snippet.';
    case 'Email':
      return values.to ? `Drafts email to ${values.to}` : 'Draft an email for the scanner.';
    case 'Phone':
      return values.phone ? `Calls ${values.phone}` : 'Dial a phone number.';
    case 'SMS':
      return values.to ? `Texts ${values.to}` : 'Send an SMS message.';
    case 'WiFi':
      return values.ssid ? `Wi‑Fi network “${values.ssid}”` : 'Share Wi‑Fi credentials.';
    case 'Event':
      return values.summary ? `Calendar event: ${values.summary}` : 'Save an event to the calendar.';
    default:
      return 'Encodes static content in the QR.';
  }
}
