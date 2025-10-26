import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from './ui/GlassCard.jsx';
import Icon from './ui/Icon.jsx';
import { api, API } from '../api';
import { onItemSynced } from '../lib/syncQueue';
import { buildPayload } from './TemplateDataForm.jsx';
import { renderStyledQR } from '../lib/styledQr';
import BulkQRGenerator from './BulkQRGenerator.jsx';
import { FREE_PLAN_DYNAMIC_LIMIT, UPGRADES_ENABLED } from '../config/planLimits.js';

import QRStats from './QRStats.jsx';
import QRDownload from './QRDownload.jsx';

// localStorage key per-user to avoid leaking designs between accounts
const LEGACY_STATIC_KEY = 'qr_static_designs';
function staticSaveKey() {
  try {
    const u = JSON.parse(localStorage.getItem('qr_user') || 'null');
    return u && u.email ? `qr_static_designs:${u.email}` : `${LEGACY_STATIC_KEY}:anon`;
  } catch {
    return `${LEGACY_STATIC_KEY}:anon`;
  }
}

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

export default function MyQRCodes({ user, onCreateNew, onEdit, onCountsChange, onUpgrade, version = 0 }) {
  const [dynamicCodes, setDynamicCodes] = useState([]);
  const [staticDesigns, setStaticDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [planNotice, setPlanNotice] = useState('');
  const isPro = !!user?.is_pro;
  const dynamicLimit = user?.free_plan_dynamic_limit ?? FREE_PLAN_DYNAMIC_LIMIT;
  const upgradesEnabled = UPGRADES_ENABLED;
  const remainingDynamicSlots = isPro ? Infinity : Math.max(0, dynamicLimit - dynamicCodes.length);
  const canCreateMoreDynamic = isPro || remainingDynamicSlots > 0;
  const freeLimitMessage = useMemo(() => {
    if (!upgradesEnabled || isPro) return '';
    const plural = dynamicLimit === 1 ? '' : 's';
    return `Free plan includes ${dynamicLimit} dynamic QR${plural}. Upgrade to Pro to add more.`;
  }, [upgradesEnabled, dynamicLimit, isPro]);

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
    (async () => {
      let server = null;
      try {
        server = await api('/qr/static/list');
      } catch (e) {
        server = null;
      }

      try {
        const key = staticSaveKey();
        // migrate legacy global key into per-user key if needed
        try {
          const legacy = JSON.parse(localStorage.getItem(LEGACY_STATIC_KEY) || 'null');
          if (Array.isArray(legacy) && legacy.length) {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const merged = [...legacy, ...(Array.isArray(existing) ? existing : [])].slice(0, 100);
            localStorage.setItem(key, JSON.stringify(merged));
            try { localStorage.removeItem(LEGACY_STATIC_KEY); } catch(_){ }
          }
        } catch(_){ }

        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        const localArr = Array.isArray(stored) ? stored : [];

        if (Array.isArray(server)) {
          // If server returned an empty list but local has items, prefer local.
          if (server.length === 0 && localArr.length > 0) {
            setStaticDesigns(localArr);
            return;
          }
          // Merge: server items first (fresh), then local items without duplicate ids
          const byId = new Map();
          server.forEach(item => { if (item && item.id) byId.set(item.id, item); });
          localArr.forEach(item => { if (item && item.id && !byId.has(item.id)) byId.set(item.id, item); });
          const merged = Array.from(byId.values()).slice(0, 100);
          setStaticDesigns(merged);
        } else {
          setStaticDesigns(localArr);
        }
      } catch {
        setStaticDesigns([]);
      }
    })();
  }, []);

  useEffect(() => {
    loadStaticDesigns();
  }, [version, loadStaticDesigns]);

  // subscribe to background sync events to replace pending local items
  useEffect(() => {
    const unsub = onItemSynced((created, localId) => {
      try {
        setStaticDesigns(prev => prev.map(d => d.id === localId ? created : d));
        const key = staticSaveKey();
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = stored.map(d => d.id === localId ? created : d);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (_){ }
    });
    return unsub;
  }, []);

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

  useEffect(() => {
    if (!upgradesEnabled) {
      if (planNotice) setPlanNotice('');
      return;
    }
    if (canCreateMoreDynamic && planNotice) {
      setPlanNotice('');
    }
  }, [upgradesEnabled, canCreateMoreDynamic, planNotice]);

  useEffect(() => {
    if (onCountsChange && !loading) {
      onCountsChange({
        dynamic: dynamicCodes.length,
        staticCount: staticDesigns.length
      });
    }
  }, [dynamicCodes.length, staticDesigns.length, onCountsChange, loading]);

  const handleCreateDynamicRequest = () => {
    if (upgradesEnabled && !canCreateMoreDynamic) {
      if (freeLimitMessage) setPlanNotice(freeLimitMessage);
      return;
    }
    setPlanNotice('');
    onCreateNew?.({ type: 'dynamic-new', codeId: null });
  };

  const handleBulkGeneratorOpen = () => {
    if (upgradesEnabled && !isPro && remainingDynamicSlots <= 0) {
      if (freeLimitMessage) setPlanNotice(freeLimitMessage);
      return;
    }
    setPlanNotice('');
    setShowBulkGenerator(true);
  };

  const handleDeleteStatic = useCallback((id) => {
    (async () => {
      // prefer server delete when possible
      try {
        await api('/qr/static/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        setStaticDesigns(prev => prev.filter(d => d.id !== id));
        return;
      } catch (e) {
        // fallback to local deletion
      }
      const next = staticDesigns.filter(design => design.id !== id);
      setStaticDesigns(next);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(staticSaveKey(), JSON.stringify(next)); } catch(_){}
      }
    })();
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
          {upgradesEnabled && !isPro && onUpgrade && (
            <button className="btn-secondary" onClick={onUpgrade} type="button">
              Upgrade to Pro
            </button>
          )}
          <button
            className="btn-secondary ghost btn-with-icon"
            onClick={handleBulkGeneratorOpen}
            disabled={!isPro && remainingDynamicSlots <= 0}
            title={!isPro && remainingDynamicSlots <= 0 ? freeLimitMessage : undefined}
          >
            <Icon name="bulk" size={18} />
            <span>Bulk Create</span>
          </button>
          <button
            className="btn-secondary ghost"
            onClick={handleCreateDynamicRequest}
            disabled={!canCreateMoreDynamic}
            title={!canCreateMoreDynamic ? freeLimitMessage : undefined}
          >
            New dynamic QR
          </button>
          <button className="btn-primary" onClick={onStartStatic}>
            Design static QR
          </button>
        </div>
      </GlassCard>

      {upgradesEnabled && planNotice && (
        <div className="plan-notice">
          <div className="alert-error" role="alert">{planNotice}</div>
          {!isPro && onUpgrade && (
            <button type="button" className="btn-primary btn-upgrade" onClick={onUpgrade}>
              Upgrade to Pro
            </button>
          )}
        </div>
      )}

      {/* Bulk Generator Modal */}
      {showBulkGenerator && (
        <div className="modal-overlay" onClick={() => setShowBulkGenerator(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBulkGenerator(false)}>×</button>
            <BulkQRGenerator onSuccess={(results) => {
              setShowBulkGenerator(false);
              window.location.reload(); // Refresh to show new codes
            }} />
          </div>
        </div>
      )}



      <GlassCard className="library-card-grid">
        <header className="library-section-header">
          <div>
            <h3>Dynamic QR codes</h3>
            <div className="library-subtext">
              Synced from your backend. Edit destinations, download assets, or review scans.
              {!isPro && upgradesEnabled && (
                <span className={`plan-inline-note${remainingDynamicSlots > 0 ? ' positive' : ''}`}>
                  {remainingDynamicSlots > 0
                    ? `Free plan includes ${dynamicLimit} dynamic QR${dynamicLimit === 1 ? '' : 's'}. You have ${remainingDynamicSlots} slot${remainingDynamicSlots === 1 ? '' : 's'} remaining.`
                    : `Free plan includes ${dynamicLimit} dynamic QR${dynamicLimit === 1 ? '' : 's'}. Upgrade to unlock unlimited codes.`}
                  {(!canCreateMoreDynamic) && onUpgrade && (
                    <button type="button" className="btn-secondary upgrade-inline" onClick={onUpgrade}>
                      Upgrade to Pro
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>
          <button
            className="btn-secondary ghost"
            onClick={handleCreateDynamicRequest}
            disabled={!canCreateMoreDynamic}
            title={!canCreateMoreDynamic ? freeLimitMessage : undefined}
          >
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
          <div className="code-table">
            <div className="code-table-head">
              <span>Preview</span>
              <span>Destination</span>
              <span>Activity</span>
              <span>Actions</span>
            </div>
            {dynamicCodes.map(code => {
              const isExpanded = expandedId === code.id;
              const displayName = code.name || `QR ${code.id.slice(0, 6)}`;
              const destination = code.target || 'No destination configured yet.';
              const updatedAgo = formatRelative(code.updatedAt || code.createdAt);
              const lastScan = code.lastScanAt ? formatRelative(code.lastScanAt) : '—';
              return (
                <React.Fragment key={code.id}>
                  <div className="code-row">
                    <div className="code-cell code-preview">
                      <img
                        src={`${API}/qr/svg/${code.id}`}
                        alt={`QR preview for ${displayName}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="code-cell code-info">
                      <div className="code-name-line">
                        <span className="badge subtle">Dynamic</span>
                        <strong>{displayName}</strong>
                      </div>
                      <span className="code-target" title={destination}>{destination}</span>
                      <span className="code-meta">Updated {updatedAgo}</span>
                    </div>
                    <div className="code-cell code-metrics">
                      <div>
                        <span>Scans</span>
                        <strong>{code.scanCount ?? 0}</strong>
                      </div>
                      <div>
                        <span>Blocked</span>
                        <strong>{code.blockedCount ?? 0}</strong>
                      </div>
                      <div>
                        <span>Last</span>
                        <strong>{lastScan}</strong>
                      </div>
                    </div>
                    <div className="code-cell code-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onEdit?.({ type: 'dynamic', codeId: code.id })}
                        aria-label="Edit dynamic QR"
                        title="Edit dynamic QR"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <a
                        className="icon-button"
                        href={`${API}/qr/${code.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open redirect link"
                        title="Open redirect link"
                      >
                        <Icon name="link" size={18} />
                      </a>
                      <a
                        className="icon-button"
                        href={`${API}/qr/svg/${code.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Download SVG"
                        title="Download SVG"
                      >
                        <Icon name="download" size={18} />
                      </a>
                      <QRDownload qrId={code.id} qrName={displayName} />
                      <button
                        type="button"
                        className={['icon-button', isExpanded ? 'active' : ''].join(' ')}
                        onClick={() => setExpandedId(isExpanded ? null : code.id)}
                        aria-label={isExpanded ? 'Hide stats' : 'View stats'}
                        title={isExpanded ? 'Hide stats' : 'View stats'}
                      >
                        <Icon name="stats" size={18} />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="code-row code-row-details">
                      <QRStats qrId={code.id} />
                      <div className="code-details-grid">
                        <div>
                          <span>Created</span>
                          <strong>{code.createdAt ? new Date(code.createdAt).toLocaleString() : '—'}</strong>
                        </div>
                        <div>
                          <span>Last scan</span>
                          <strong>{code.lastScanAt ? new Date(code.lastScanAt).toLocaleString() : 'Not yet scanned'}</strong>
                        </div>
                        <div className="code-details-target" title={destination}>
                          <span>Destination</span>
                          <strong>{destination}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
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
          <div className="static-table">
            <div className="static-table-head">
              <span>Preview</span>
              <span>Details</span>
              <span>Actions</span>
            </div>
            {staticDesigns.map(design => (
              <StaticDesignRow
                key={design.id}
                design={design}
                onDelete={handleDeleteStatic}
                onRetry={async (id) => {
                  // attempt to sync a pending design by id
                  try {
                    const key = staticSaveKey();
                    const stored = JSON.parse(localStorage.getItem(key) || '[]');
                    const item = stored.find(s => s.id === id) || staticDesigns.find(s => s.id === id);
                    if (!item) return;
                    // send to server (omit _pending)
                    const payload = { ...item };
                    delete payload._pending;
                    const created = await api('/qr/static/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (created && created.id) {
                      // replace in state and storage
                      setStaticDesigns(prev => prev.map(d => d.id === id ? created : d));
                      try {
                        const storedNow = JSON.parse(localStorage.getItem(key) || '[]');
                        const updated = storedNow.map(d => d.id === id ? created : d);
                        localStorage.setItem(key, JSON.stringify(updated));
                      } catch (_){ }
                    }
                  } catch (e) {
                    setMsg('Retry failed. Will try again later.');
                  }
                }}
                formatRelative={formatRelative}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function StaticDesignRow({ design, onDelete, onRetry, formatRelative }) {
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
  const savedAgo = design.createdAt ? formatRelative(design.createdAt) : 'moments ago';

  return (
    <div className="static-row">
      <div className="static-cell static-preview">
        <canvas ref={canvasRef} width="72" height="72" />
      </div>
      <div className="static-cell static-info">
        <div className="static-name-line">
          <strong>{design.name || 'Static QR design'}</strong>
          <span className="badge subtle">{templateLabel}</span>
        </div>
        <p className="static-summary">{formatStaticSummary(design.template, design.values)}</p>
        <span className="static-meta">Saved {savedAgo}</span>
      </div>
      <div className="static-cell static-actions">
        {design._pending ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tiny-spinner" aria-hidden="true" />
            <small style={{ color: '#64748b' }}>Syncing…</small>
            <button
              className="icon-button"
              type="button"
              title="Retry sync"
              aria-label="Retry sync"
              onClick={() => {
                try {
                  // add the design back into the persistent queue
                  const key = staticSaveKey();
                  const stored = JSON.parse(localStorage.getItem(key) || '[]');
                  const item = stored.find(s => s.id === design.id) || design;
                  import('../lib/syncQueue').then(mod => mod.addToQueue(item)).catch(() => { if (onRetry) onRetry(design.id); });
                } catch (e) { if (onRetry) onRetry(design.id); }
              }}
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>
        ) : (
          <>
            <button
              className="icon-button"
              onClick={() => downloadFromCanvas('png')}
              aria-label="Download PNG"
              title="Download PNG"
              type="button"
            >
              <Icon name="image" size={18} />
            </button>
            <button
              className="icon-button"
              onClick={() => downloadFromCanvas('jpeg')}
              aria-label="Download JPG"
              title="Download JPG"
              type="button"
            >
              <Icon name="camera" size={18} />
            </button>
            <button
              className="icon-button"
              onClick={downloadPdf}
              aria-label="Print PDF"
              title="Print PDF"
              type="button"
            >
              <Icon name="printer" size={18} />
            </button>
            <button
              className="icon-button"
              onClick={downloadSvg}
              aria-label="Download SVG"
              title="Download SVG"
              type="button"
            >
              <Icon name="download" size={18} />
            </button>
            <button
              className="icon-button danger"
              onClick={() => onDelete(design.id)}
              aria-label="Delete static design"
              title="Delete static design"
              type="button"
            >
              <Icon name="trash" size={18} />
            </button>
          </>
        )}
      </div>
    </div>
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
