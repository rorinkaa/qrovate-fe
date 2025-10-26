import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from './ui/GlassCard.jsx';
import Icon from './ui/Icon.jsx';
import { api, API } from '../api';
import { onItemSynced } from '../lib/syncQueue';
import { buildPayload } from './TemplateDataForm.jsx';
import { renderStyledQR } from '../lib/styledQr';
import { useClipboard } from '../lib/useClipboard.js';
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

const TAGS_STORAGE_KEY_BASE = 'qr_dynamic_tags';
const AUTOMATION_STORAGE_KEY_BASE = 'qr_dynamic_automation';
const AUTOMATION_DEFAULTS = {
  autoPauseOnBlocked: true,
  notifyOnScan: false,
  summaryEmail: 'weekly',
  quietHours: false,
  scheduleEnabled: false,
  scheduleFrequency: 'weekly',
  scheduleTime: '09:00'
};

function scopedKey(base, user) {
  if (!user) return `${base}:anon`;
  const identifier = user.email || user.id || 'anon';
  return `${base}:${identifier}`;
}

export default function MyQRCodes({ user, onCreateNew, onEdit, onCountsChange, onUpgrade, version = 0 }) {
  const [dynamicCodes, setDynamicCodes] = useState([]);
  const [staticDesigns, setStaticDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSort, setActiveSort] = useState('recent');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [codeTags, setCodeTags] = useState({});
  const [tagDraft, setTagDraft] = useState('');
  const [automationSettings, setAutomationSettings] = useState({});
  const [bulkFeedback, setBulkFeedback] = useState(null);
  const [automationFocusKey, setAutomationFocusKey] = useState(0);
  const [automationHighlight, setAutomationHighlight] = useState(false);
  const tagsLoadedRef = useRef(false);
  const automationLoadedRef = useRef(false);
  const automationSectionRef = useRef(null);
  const tagStorageKey = useMemo(() => scopedKey(TAGS_STORAGE_KEY_BASE, user), [user]);
  const automationStorageKey = useMemo(() => scopedKey(AUTOMATION_STORAGE_KEY_BASE, user), [user]);

  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const { copy: copyToClipboard } = useClipboard();
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

  useEffect(() => {
    if (typeof window === 'undefined' || !tagStorageKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(tagStorageKey) || '{}');
      if (stored && typeof stored === 'object') {
        setCodeTags(stored);
      }
    } catch (_error) {
      setCodeTags({});
    } finally {
      tagsLoadedRef.current = true;
    }
  }, [tagStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !automationStorageKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(automationStorageKey) || '{}');
      if (stored && typeof stored === 'object') {
        const normalized = {};
        Object.entries(stored).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            normalized[key] = { ...AUTOMATION_DEFAULTS, ...value };
          }
        });
        setAutomationSettings(normalized);
      }
    } catch (_error) {
      setAutomationSettings({});
    } finally {
      automationLoadedRef.current = true;
    }
  }, [automationStorageKey]);

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
    if (!tagsLoadedRef.current || typeof window === 'undefined' || !tagStorageKey) return;
    try {
      localStorage.setItem(tagStorageKey, JSON.stringify(codeTags));
    } catch (_error) { /* noop */ }
  }, [codeTags, tagStorageKey]);

  useEffect(() => {
    if (!automationLoadedRef.current || typeof window === 'undefined' || !automationStorageKey) return;
    try {
      localStorage.setItem(automationStorageKey, JSON.stringify(automationSettings));
    } catch (_error) { /* noop */ }
  }, [automationSettings, automationStorageKey]);

  useEffect(() => {
    if (!automationFocusKey || !automationSectionRef.current) return;
    setAutomationHighlight(true);
    automationSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const timeout = setTimeout(() => setAutomationHighlight(false), 1600);
    return () => clearTimeout(timeout);
  }, [automationFocusKey]);

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

  useEffect(() => {
    setSelectedCodes((prev) => prev.filter((id) => dynamicCodes.some((code) => code.id === id)));
  }, [dynamicCodes]);

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    Object.values(codeTags).forEach((tags) => {
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          if (tag && typeof tag === 'string') {
            tagSet.add(tag);
          }
        });
      }
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [codeTags]);

  const decoratedDynamicCodes = useMemo(() => {
    return dynamicCodes.map((code) => ({
      ...code,
      tags: Array.isArray(codeTags[code.id]) ? codeTags[code.id] : [],
      automation: automationSettings[code.id] || { ...AUTOMATION_DEFAULTS }
    }));
  }, [dynamicCodes, codeTags, automationSettings]);

  const filteredDynamicCodes = useMemo(() => {
    let list = decoratedDynamicCodes;
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter((code) => {
        const name = (code.name || '').toLowerCase();
        const target = (code.target || '').toLowerCase();
        const id = (code.id || '').toLowerCase();
        const tags = (code.tags || []).map((t) => t.toLowerCase());
        return (
          name.includes(query) ||
          target.includes(query) ||
          id.includes(query) ||
          tags.some((tag) => tag.includes(query))
        );
      });
    }
    if (selectedTags.length) {
      list = list.filter((code) => selectedTags.every((tag) => code.tags?.includes(tag)));
    }
    const sorted = [...list];
    switch (activeSort) {
      case 'scans':
        sorted.sort((a, b) => (b.scanCount ?? 0) - (a.scanCount ?? 0));
        break;
      case 'alphabetical':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        sorted.sort((a, b) => {
          const updatedA = a.updatedAt || a.createdAt || 0;
          const updatedB = b.updatedAt || b.createdAt || 0;
          return (updatedB ?? 0) - (updatedA ?? 0);
        });
        break;
    }
    return sorted;
  }, [decoratedDynamicCodes, searchTerm, selectedTags, activeSort]);

  useEffect(() => {
    if (!filteredDynamicCodes.length) {
      setFocusedId(null);
      return;
    }
    if (!focusedId || !filteredDynamicCodes.some((code) => code.id === focusedId)) {
      setFocusedId(filteredDynamicCodes[0].id);
    }
  }, [filteredDynamicCodes, focusedId]);

  const bulkSelectedCodes = useMemo(
    () => decoratedDynamicCodes.filter((code) => selectedCodes.includes(code.id)),
    [decoratedDynamicCodes, selectedCodes]
  );

  const selectedCount = selectedCodes.length;
  const hasAnySelection = selectedCount > 0;
  const focusedCode = decoratedDynamicCodes.find((code) => code.id === focusedId) || null;
  const focusedAutomation = focusedCode?.automation || { ...AUTOMATION_DEFAULTS };

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

  const toggleCodeSelection = useCallback((id) => {
    setSelectedCodes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((codeId) => codeId !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleSelectAllVisible = () => {
    const ids = filteredDynamicCodes.map((code) => code.id);
    const allSelected = ids.every((id) => selectedCodes.includes(id));
    if (allSelected) {
      setSelectedCodes((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedCodes(Array.from(new Set([...selectedCodes, ...ids])));
    }
  };

  const clearSelection = () => {
    setSelectedCodes([]);
  };

  const emitFeedback = useCallback((type, message) => {
    setBulkFeedback({ type, message, timestamp: Date.now() });
  }, []);

  useEffect(() => {
    if (!bulkFeedback) return;
    const timeout = setTimeout(() => setBulkFeedback(null), 4200);
    return () => clearTimeout(timeout);
  }, [bulkFeedback]);

  const handleBulkDownloadCSV = () => {
    if (!bulkSelectedCodes.length) return;
    const header = ['id', 'name', 'target', 'scanCount', 'blockedCount', 'updatedAt', 'lastScanAt', 'tags'];
    const rows = bulkSelectedCodes.map((code) => [
      code.id,
      code.name || '',
      code.target || '',
      code.scanCount ?? 0,
      code.blockedCount ?? 0,
      code.updatedAt || '',
      code.lastScanAt || '',
      (code.tags || []).join('|')
    ]);
    const csv = [header.join(','), ...rows.map((row) => row.map((cell) => {
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-dynamic-codes.csv';
    link.click();
    URL.revokeObjectURL(url);
    emitFeedback('success', `Exported ${rows.length} code${rows.length === 1 ? '' : 's'} to CSV`);
  };

  const handleBulkCopyLinks = async () => {
    if (!bulkSelectedCodes.length) return;
    const links = bulkSelectedCodes.map((code) => `${API}/qr/${code.id}`).join('\n');
    const ok = await copyToClipboard(links, {
      successMessage: 'Copied redirect links to clipboard',
      errorMessage: 'Could not copy links. Try manually copying from the sidebar.'
    });
    emitFeedback(ok ? 'success' : 'error', ok
      ? 'Copied redirect links to clipboard'
      : 'Could not copy links. Try manually copying from the sidebar.');
  };

  const handleBulkApplyTag = () => {
    if (!bulkSelectedCodes.length) return;
    const input = prompt('Apply tag to selected codes', '');
    const trimmed = (input || '').trim();
    if (!trimmed) return;
    setCodeTags((prev) => {
      const next = { ...prev };
      bulkSelectedCodes.forEach((code) => {
        const current = Array.isArray(next[code.id]) ? next[code.id] : [];
        if (!current.includes(trimmed)) {
          next[code.id] = [...current, trimmed];
        }
      });
      return next;
    });
    emitFeedback('success', `Applied tag “${trimmed}” to ${bulkSelectedCodes.length} codes`);
  };

  const handleTagFilterToggle = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setActiveSort('recent');
  };

  const handleAddTagToFocused = (event) => {
    event.preventDefault();
    if (!focusedCode) return;
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    setCodeTags((prev) => {
      const existing = Array.isArray(prev[focusedCode.id]) ? prev[focusedCode.id] : [];
      if (existing.includes(trimmed)) return prev;
      return { ...prev, [focusedCode.id]: [...existing, trimmed] };
    });
    setTagDraft('');
    emitFeedback('success', `Tag “${trimmed}” added`);
  };

  const handleRemoveTagFromFocused = (tag) => {
    if (!focusedCode) return;
    setCodeTags((prev) => {
      const existing = Array.isArray(prev[focusedCode.id]) ? prev[focusedCode.id] : [];
      const nextTags = existing.filter((t) => t !== tag);
      const next = { ...prev };
      if (nextTags.length) {
        next[focusedCode.id] = nextTags;
      } else {
        delete next[focusedCode.id];
      }
      return next;
    });
  };

  const updateAutomation = (codeId, patch) => {
    setAutomationSettings((prev) => {
      const current = prev[codeId] || { ...AUTOMATION_DEFAULTS };
      return { ...prev, [codeId]: { ...current, ...patch } };
    });
    emitFeedback('success', 'Automation settings saved');
  };

  const handleAutomationToggle = (field) => {
    if (!focusedCode) return;
    const current = automationSettings[focusedCode.id] || { ...AUTOMATION_DEFAULTS };
    updateAutomation(focusedCode.id, { [field]: !current[field] });
  };

  const handleAutomationSummaryChange = (event) => {
    if (!focusedCode) return;
    updateAutomation(focusedCode.id, { summaryEmail: event.target.value });
  };

  const handleAutomationScheduleFrequencyChange = (event) => {
    if (!focusedCode) return;
    updateAutomation(focusedCode.id, { scheduleFrequency: event.target.value });
  };

  const handleAutomationScheduleTimeChange = (event) => {
    if (!focusedCode) return;
    updateAutomation(focusedCode.id, { scheduleTime: event.target.value });
  };

  useEffect(() => {
    setTagDraft('');
  }, [focusedId]);
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
  let dynamicContent;
  if (loading) {
    dynamicContent = <div className="history-muted">Loading your dynamic library…</div>;
  } else if (error) {
    dynamicContent = <div className="history-error">{error}</div>;
  } else if (dynamicCodes.length === 0) {
    dynamicContent = (
      <div className="empty-state enhanced">
        <strong>You haven’t created any dynamic codes yet.</strong>
        <p>Spin up your first campaign to unlock automation, analytics, and bulk actions.</p>
        <div className="empty-state-actions">
          <button type="button" className="btn-primary" onClick={handleCreateDynamicRequest}>
            Create a dynamic QR
          </button>
          <button type="button" className="btn-secondary ghost" onClick={onStartStatic}>
            Design a static QR instead
          </button>
        </div>
      </div>
    );
  } else if (filteredDynamicCodes.length === 0) {
    dynamicContent = (
      <div className="empty-state filtered">
        <strong>No codes match your filters.</strong>
        <p>Try adjusting the search or tag filters to bring codes back into view.</p>
        <button type="button" className="btn-secondary ghost" onClick={handleClearFilters}>
          Clear filters
        </button>
      </div>
    );
  } else {
    dynamicContent = (
      <div className="dynamic-library-layout">
        <div className="code-table compact">
          <div className="code-table-head">
            <span className="table-select-col">
              <input
                type="checkbox"
                aria-label="Select visible codes"
                checked={filteredDynamicCodes.every((code) => selectedCodes.includes(code.id))}
                onChange={handleSelectAllVisible}
              />
            </span>
            <span>QR</span>
            <span>Basics</span>
            <span>Stats</span>
            <span className="table-actions-col">Actions</span>
          </div>
          {filteredDynamicCodes.map((code) => {
            const displayName = code.name || `QR ${code.id.slice(0, 6)}`;
            const destination = code.target || 'No destination configured yet.';
            const updatedAgo = formatRelative(code.updatedAt || code.createdAt);
            const lastScan = code.lastScanAt ? formatRelative(code.lastScanAt) : '—';
            const isSelected = selectedCodes.includes(code.id);
            return (
              <div
                key={code.id}
                className={`code-row compact${isSelected ? ' selected' : ''}`}
                onClick={() => setFocusedId(code.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setFocusedId(code.id);
                  }
                }}
              >
                <div className="code-cell table-select-col" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCodeSelection(code.id)}
                  />
                </div>
                <div className="code-cell code-preview tiny-preview">
                  <img
                    src={`${API}/qr/svg/${code.id}`}
                    alt={`QR preview for ${displayName}`}
                    loading="lazy"
                  />
                </div>
                <div className="code-cell code-info compact-info">
                  <div className="code-name-line">
                    <strong>{displayName}</strong>
                    <span className="badge subtle">Dynamic</span>
                  </div>
                  <span className="code-target ellipsis" title={destination}>{destination}</span>
                  <div className="inline-meta">
                    <span>Updated {updatedAgo}</span>
                    {(code.tags || []).length > 0 && (
                      <span className="inline-tags-chip">
                        {code.tags.slice(0, 2).join(', ')}
                        {code.tags.length > 2 && ` +${code.tags.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="code-cell code-metrics compact-metrics">
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
                <div className="code-cell code-actions compact-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit?.({ type: 'dynamic', codeId: code.id });
                    }}
                    aria-label="Edit dynamic QR"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <a
                    className="icon-button"
                    onClick={(event) => event.stopPropagation()}
                    href={`${API}/qr/${code.id}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open redirect link"
                  >
                    <Icon name="link" size={16} />
                  </a>
                  <div onClick={(event) => event.stopPropagation()}>
                    <QRDownload qrId={code.id} qrName={displayName} iconSize={16} />
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFocusedId(code.id);
                      setAutomationFocusKey(Date.now());
                    }}
                    aria-label="Automation settings"
                  >
                    <Icon name="timer" size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFocusedId(code.id);
                    }}
                    aria-label="View details"
                  >
                    <Icon name="stats" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <aside className={`code-detail-sidebar${focusedCode ? ' open' : ''}`}>
          {focusedCode ? (
            <div className="sidebar-content">
              <div className="sidebar-header">
                <span className="badge subtle">Dynamic</span>
                <h4>{focusedCode.name || `QR ${focusedCode.id.slice(0, 6)}`}</h4>
                <p>Created {focusedCode.createdAt ? new Date(focusedCode.createdAt).toLocaleString() : '—'}</p>
              </div>
              <div className="sidebar-section">
                <span className="sidebar-label">Destination</span>
                <a
                  href={focusedCode.target || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="sidebar-link"
                >
                  {focusedCode.target || 'No destination configured yet.'}
                </a>
              </div>
              <div className="sidebar-section metrics">
                <div>
                  <span>Scans</span>
                  <strong>{focusedCode.scanCount ?? 0}</strong>
                </div>
                <div>
                  <span>Blocked</span>
                  <strong>{focusedCode.blockedCount ?? 0}</strong>
                </div>
                <div>
                  <span>Last scan</span>
                  <strong>{focusedCode.lastScanAt ? formatRelative(focusedCode.lastScanAt) : 'Not yet scanned'}</strong>
                </div>
              </div>
              <div className="sidebar-section">
                <h5>Tags</h5>
                <div className="tag-chip-group editable">
                  {(focusedCode.tags || []).length ? (
                    focusedCode.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="tag-chip active removable"
                        onClick={() => handleRemoveTagFromFocused(tag)}
                      >
                        {tag}
                        <span aria-hidden="true">×</span>
                      </button>
                    ))
                  ) : (
                    <span className="tag-placeholder">No tags yet. Add one to group this campaign.</span>
                  )}
                </div>
                <form className="tag-form" onSubmit={handleAddTagToFocused}>
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    placeholder="Add tag (press enter)"
                  />
                  <button type="submit">Add</button>
                </form>
              </div>
              <div
                className={`sidebar-section automation${automationHighlight ? ' highlight' : ''}`}
                ref={automationSectionRef}
              >
                <h5>Automation settings</h5>
                <p className="sidebar-help">
                  Configure how QRovate should react when this code is scanned or flagged.
                </p>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={focusedAutomation.autoPauseOnBlocked}
                    onChange={() => handleAutomationToggle('autoPauseOnBlocked')}
                  />
                  <div>
                    <strong>Auto-pause on suspicious spikes</strong>
                    <span>Disable redirect if blocked scans exceed safe thresholds.</span>
                  </div>
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={focusedAutomation.notifyOnScan}
                    onChange={() => handleAutomationToggle('notifyOnScan')}
                  />
                  <div>
                    <strong>Notify on first daily scan</strong>
                    <span>Send a quick alert the first time this code is scanned each day.</span>
                  </div>
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={focusedAutomation.quietHours}
                    onChange={() => handleAutomationToggle('quietHours')}
                  />
                  <div>
                    <strong>Respect quiet hours</strong>
                    <span>Suppress notifications overnight between 10pm and 6am.</span>
                  </div>
                </label>
                <div className="select-row">
                  <label htmlFor="automation-summary">
                    Email summary cadence
                  </label>
                  <select
                    id="automation-summary"
                    value={focusedAutomation.summaryEmail}
                    onChange={handleAutomationSummaryChange}
                  >
                    <option value="none">Do not send summaries</option>
                    <option value="daily">Daily snapshot</option>
                    <option value="weekly">Weekly digest</option>
                    <option value="monthly">Monthly rollup</option>
                  </select>
                </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={focusedAutomation.scheduleEnabled}
                    onChange={() => handleAutomationToggle('scheduleEnabled')}
                  />
                  <div>
                    <strong>Enable automation schedule</strong>
                    <span>Trigger automated tasks on a recurring cadence.</span>
                  </div>
                </label>
                {focusedAutomation.scheduleEnabled && (
                  <div className="schedule-grid">
                    <label>
                      <span>Frequency</span>
                      <select
                        value={focusedAutomation.scheduleFrequency}
                        onChange={handleAutomationScheduleFrequencyChange}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>
                    <label>
                      <span>Local time</span>
                      <input
                        type="time"
                        value={focusedAutomation.scheduleTime}
                        onChange={handleAutomationScheduleTimeChange}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="sidebar-section">
                <h5>Performance</h5>
                <QRStats qrId={focusedCode.id} />
              </div>
            </div>
          ) : (
            <div className="sidebar-empty">
              <strong>Select a code to view details</strong>
              <p>Use the command bar to search, tag, or queue automations.</p>
            </div>
          )}
        </aside>
      </div>
    );
  }

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
              Synced from your backend. Search, tag, and orchestrate automations from here.
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

        <div className="command-bar">
          <div className="command-bar-left">
            <div className="command-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, destination, tag or ID…"
              />
            </div>
            {filteredDynamicCodes.length > 0 && (
              <button
                type="button"
                className="command-chip"
                onClick={handleSelectAllVisible}
              >
                {filteredDynamicCodes.every((code) => selectedCodes.includes(code.id)) ? 'Clear visible selection' : 'Select visible'}
              </button>
            )}
          </div>
          <div className="command-bar-right">
            <div className="filter-chip-group">
              <button
                type="button"
                className={`command-chip${activeSort === 'recent' ? ' active' : ''}`}
                onClick={() => setActiveSort('recent')}
              >
                Recent
              </button>
              <button
                type="button"
                className={`command-chip${activeSort === 'scans' ? ' active' : ''}`}
                onClick={() => setActiveSort('scans')}
              >
                Most scans
              </button>
              <button
                type="button"
                className={`command-chip${activeSort === 'alphabetical' ? ' active' : ''}`}
                onClick={() => setActiveSort('alphabetical')}
              >
                A–Z
              </button>
            </div>
            {availableTags.length > 0 && (
              <div className="tag-chip-group">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip${selectedTags.includes(tag) ? ' active' : ''}`}
                    onClick={() => handleTagFilterToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {(searchTerm || selectedTags.length || activeSort !== 'recent') && (
              <button type="button" className="command-reset" onClick={handleClearFilters}>
                Reset
              </button>
            )}
          </div>
        </div>

        {bulkFeedback && (
          <div className={`command-feedback ${bulkFeedback.type}`}>
            {bulkFeedback.message}
          </div>
        )}

        {hasAnySelection && (
          <div className="bulk-actions-bar">
            <span><strong>{selectedCount}</strong> selected</span>
            <div className="bulk-actions">
              <button type="button" onClick={handleBulkDownloadCSV}>
                Export CSV
              </button>
              <button type="button" onClick={handleBulkCopyLinks} aria-label="Copy selected QR redirect links to clipboard">
                Copy links
              </button>
              <button type="button" onClick={handleBulkApplyTag}>
                Apply tag
              </button>
              <button type="button" onClick={clearSelection} className="ghost-link small">
                Clear
              </button>
            </div>
          </div>
        )}
        {dynamicContent}
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
