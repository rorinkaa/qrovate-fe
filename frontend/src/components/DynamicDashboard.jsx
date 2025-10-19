import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import GlassCard from './ui/GlassCard.jsx';
import StepRail from './ui/StepRail.jsx';
import SectionHeading from './ui/SectionHeading.jsx';

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

const LEGACY_STATIC_KEY = 'qr_static_designs';
function staticSaveKey() {
  try {
    const u = JSON.parse(localStorage.getItem('qr_user') || 'null');
    return u && u.email ? `qr_static_designs:${u.email}` : `${LEGACY_STATIC_KEY}:anon`;
  } catch {
    return `${LEGACY_STATIC_KEY}:anon`;
  }
}
const MAX_STATIC_SAVED = 12;

const SIZE_OPTIONS = [
  { label: 'Web • 256px', value: 256 },
  { label: 'Print • 512px', value: 512 },
  { label: 'Large • 1024px', value: 1024 }
];
const STEP_COPY = {
  choose: {
    title: 'Choose QR type',
    caption: 'Pick between a trackable dynamic code or an instant static export.'
  },
  dynamicGoal: {
    title: 'Campaign goal',
    caption: 'Describe the purpose, name the QR, and pick a template.'
  },
  staticGoal: {
    title: 'Campaign goal',
    caption: 'Give this QR a name and pick the content template.'
  },
  dynamicDestination: {
    title: 'Destination',
    caption: 'Configure where the QR should send scanners.'
  },
  staticDestination: {
    title: 'Content & data',
    caption: 'Fill in the info that will be embedded in the static QR code.'
  },
  branding: {
    title: 'Branding',
    caption: 'Style colours, frames, and logos.'
  },
  dynamicReview: {
    title: 'Review & launch',
    caption: 'Test, save, and share your dynamic QR.'
  },
  staticReview: {
    title: 'Review & export',
    caption: 'Download and share your static QR.'
  }
};

const DYNAMIC_STEPS = [
  { id: 'type', title: STEP_COPY.choose.title, caption: STEP_COPY.choose.caption },
  { id: 'goal', title: STEP_COPY.dynamicGoal.title, caption: STEP_COPY.dynamicGoal.caption },
  { id: 'destination', title: STEP_COPY.dynamicDestination.title, caption: STEP_COPY.dynamicDestination.caption },
  { id: 'branding', title: STEP_COPY.branding.title, caption: STEP_COPY.branding.caption },
  { id: 'review', title: STEP_COPY.dynamicReview.title, caption: STEP_COPY.dynamicReview.caption }
];

const STATIC_STEPS = [
  { id: 'type', title: STEP_COPY.choose.title, caption: STEP_COPY.choose.caption },
  { id: 'goal', title: STEP_COPY.staticGoal.title, caption: STEP_COPY.staticGoal.caption },
  { id: 'destination', title: STEP_COPY.staticDestination.title, caption: STEP_COPY.staticDestination.caption },
  { id: 'branding', title: STEP_COPY.branding.title, caption: STEP_COPY.branding.caption },
  { id: 'review', title: STEP_COPY.staticReview.title, caption: STEP_COPY.staticReview.caption }
];


const TEMPLATE_META = {
  URL: { emoji: '🔗', title: 'Website link', description: 'Send scanners to any landing page or CTA.' },
  TEXT: { emoji: '💬', title: 'Text snippet', description: 'Show a note, Wi-Fi code, or promo instantly.' },
  Email: { emoji: '✉️', title: 'Email draft', description: 'Prefill subject & body for quick replies.' },
  SMS: { emoji: '📱', title: 'Text message', description: 'Trigger an SMS to your team or support line.' },
  Phone: { emoji: '📞', title: 'Phone call', description: 'Dial a hotline or concierge in one tap.' },
  Location: { emoji: '📍', title: 'Map destination', description: 'Open maps with directions to your venue.' },
  Event: { emoji: '🗓️', title: 'Calendar invite', description: 'Add your event to Apple or Google calendars.' },
  WiFi: { emoji: '📶', title: 'Wi‑Fi login', description: 'Share SSID and password without typing.' },
  Vcard: { emoji: '👤', title: 'Contact card', description: 'Save your profile to phone contacts.' },
  Whatsapp: { emoji: '💬', title: 'WhatsApp chat', description: 'Start a conversation with your team.' },
  PIX: { emoji: '💱', title: 'PIX payment', description: 'Collect payments via Brazil’s PIX system.' }
};

function destinationSummary(type, values) {
  if (!values) return 'Destination not configured yet.';
  switch (type) {
    case 'URL': {
      const url = (values.url || '').trim();
      return url ? normalizeUrl(url) : 'Add a landing page URL.';
    }
    case 'TEXT': {
      const text = (values.text || '').trim();
      if (!text) return 'Add the text people should see after scanning.';
      return text.length > 80 ? `${text.slice(0, 77)}…` : text;
    }
    case 'Phone': {
      return values.phone ? `Calls ${values.phone}` : 'Add a phone number to dial.';
    }
    case 'SMS': {
      return values.to ? `Texts ${values.to}` : 'Add the recipient & message.';
    }
    case 'Email': {
      return values.to ? `Emails ${values.to}` : 'Add the recipient & subject.';
    }
    case 'WiFi': {
      return values.ssid ? `Wi‑Fi SSID “${values.ssid}”` : 'Enter Wi‑Fi details.';
    }
    case 'Location': {
      if (values.query) return values.query;
      if (values.lat && values.lng) return `Map to ${values.lat}, ${values.lng}`;
      return 'Add a map location.';
    }
    case 'Event': {
      return values.summary ? `Calendar event: ${values.summary}` : 'Add event details for calendars.';
    }
    default:
      return 'Destination configured in the previous step.';
  }
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

export default function DynamicDashboard({ user, initialCodeId = null, initialType = null, onClose, onRefresh }) {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const normalizeFlow = (type) => (type && String(type).startsWith('static') ? 'static' : 'dynamic');
  const [flowType, setFlowType] = useState(normalizeFlow(initialType));
  const [tpl, setTpl] = useState('URL');
  const [values, setValues] = useState({ ...TEMPLATE_DEFAULTS.URL });
  const [style, setStyle] = useState({ ...STYLE_DEFAULTS });
  const [qrName, setQrName] = useState(normalizeFlow(initialType) === 'static' ? 'New static QR' : 'New dynamic QR');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const previewRef = useRef(null);
  const [previewInfo, setPreviewInfo] = useState({ width: 0, height: 0 });
  const [previewMode, setPreviewMode] = useState('qr');
  const draftsRef = useRef({});
  const prevSelRef = useRef(null);
  const isPro = !!user?.is_pro;
  const [step, setStep] = useState(initialCodeId ? 1 : 0);
  const isFreshFlow = !initialCodeId && (!initialType || String(initialType).includes('new'));
  const steps = useMemo(() => (flowType === 'static' ? STATIC_STEPS : DYNAMIC_STEPS), [flowType]);
  const safeStep = Math.min(step, steps.length - 1);
  const currentStep = steps[safeStep] || steps[0];
  const isDynamic = flowType === 'dynamic';
  const templateMeta = (key) => TEMPLATE_META[key] || { emoji: '✨', title: key, description: 'Customize this template for your flow.' };
  const stepNumberFor = (id) => {
    const idx = steps.findIndex(item => item.id === id);
    return `Step ${idx >= 0 ? idx + 1 : '?'}`;
  };
  const goToStepId = (id) => {
    const idx = steps.findIndex(item => item.id === id);
    if (idx >= 0) setStep(idx);
  };
  const previewStartIndex = useMemo(() => steps.findIndex(item => item.id === 'goal'), [steps]);

  useEffect(() => {
    (async () => {
      try {
        const list = await api('/qr/list');
        const normalized = (list || []).map(it => ({
          ...it,
          style: it.style || null
        }));
        setItems(normalized);
        if (isFreshFlow || !normalized.length) {
          setSel(null);
          setQrName(normalizeFlow(initialType) === 'static' ? 'New static QR' : 'New dynamic QR');
        }
        setErr('');
      } catch (e) {
        setErr('Failed to load your dynamic QR codes');
      }
    })();
  }, []);

  useEffect(() => {
    if (!initialCodeId || !items.length) return;
    const match = items.find(it => it.id === initialCodeId);
    if (match) {
      setSel(match);
      setQrName(match.name || 'Untitled QR');
    }
  }, [initialCodeId, items]);

  useEffect(() => {
    draftsRef.current = {};
    if (!sel) {
      setTpl('URL');
      setValues({ ...TEMPLATE_DEFAULTS.URL });
      setStyle({ ...STYLE_DEFAULTS });
      setQrName(flowType === 'static' ? 'New static QR' : 'New dynamic QR');
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
  }, [sel?.id]);

  useEffect(() => {
    if (!isDynamic) {
      prevSelRef.current = sel;
      return;
    }
    if (!sel) {
      setStep(0);
    }
    prevSelRef.current = sel;
  }, [sel, isDynamic]);

  useEffect(() => {
    if (previewStartIndex >= 0 && safeStep === previewStartIndex) {
      setPreviewMode('content');
    } else {
      setPreviewMode('qr');
    }
  }, [safeStep, flowType, sel?.id, previewStartIndex]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const clear = () => {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setPreviewInfo({ width: 0, height: 0 });
    };
    let cancelled = false;
    const styleOptions = {
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
    };
    (async () => {
      if (isDynamic) {
        if (!sel?.id) {
          clear();
          return;
        }
        const info = await renderStyledQR(canvas, `${API}/qr/${sel.id}`, styleOptions);
        if (!cancelled && info) setPreviewInfo(info);
      } else {
        const payload = buildPayload(tpl, values);
        const info = await renderStyledQR(canvas, payload || ' ', styleOptions);
        if (!cancelled && info) setPreviewInfo(info);
      }
    })();
    return () => { cancelled = true; };
  }, [isDynamic, sel?.id, style, tpl, values, isPro]);

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

  const onSizeSelect = (value) => {
    setStyle(prev => ({ ...prev, size: value }));
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

  const advanceTo = async (nextStepId) => {
    if (isDynamic && !sel) {
      const created = await createDynamic({ autoAdvance: false });
      if (!created) return;
    }
    goToStepId(nextStepId);
  };

  const handleSelectStep = (index) => {
    const maxIndex = steps.length - 1;
    if (isDynamic && !sel) {
      const destinationIndex = steps.findIndex(item => item.id === 'destination');
      const limit = destinationIndex > 0 ? destinationIndex - 1 : 0;
      if (index > limit) {
        setStep(limit);
        return;
      }
    }
    setStep(Math.max(0, Math.min(index, maxIndex)));
  };

  const downloadStyled = (type = 'png') => {
    if (!previewRef.current) return;
    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const data = previewRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    const safeName = (qrName || (sel?.id ? `qr_${sel.id}` : 'qr_code')).trim() || 'qr_code';
    a.download = `${safeName.replace(/\s+/g, '_').toLowerCase()}_${type.toUpperCase()}.${type}`;
    a.click();
  };

  const downloadPdf = () => {
    if (!previewRef.current) return;
    const data = previewRef.current.toDataURL('image/png');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) {
      setErr('Allow pop-ups to export as PDF.');
      return;
    }
    popup.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>QR export</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;"><img src="${data}" style="max-width:90vw;max-height:90vh;" /></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadSvg = () => {
    if (!previewRef.current) return;
    const canvas = previewRef.current;
    const data = canvas.toDataURL('image/png');
    const width = Math.round(previewInfo.width || style.size);
    const height = Math.round(previewInfo.height || style.size);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${data}" width="${width}" height="${height}"/></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const safeName = (qrName || (sel?.id ? `qr_${sel.id}` : 'qr_code')).trim() || 'qr_code';
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName.replace(/\s+/g, '_').toLowerCase()}_preview.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateListItem = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    setSel(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
    if (updated?.name) {
      setQrName(updated.name);
    }
  };

  const createDynamic = async ({ autoAdvance = true } = {}) => {
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const stylePayload = renderStylePayload(style, isPro);
      const created = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: '', style: stylePayload, name: qrName })
      });
      const normalized = { ...created, style: created.style || {} };
      setItems(prev => [normalized, ...prev]);
      setSel(normalized);
      setMsg('Dynamic QR created. Configure the destination and click “Save changes”.');
      if (autoAdvance) {
        setStep(1);
      }
      onRefresh?.();
      return normalized;
    } catch (e) {
      setErr(e.message || 'Create failed');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = async () => {
    if (!isDynamic || !sel?.id) return;
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
      onRefresh?.();
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const saveStaticDesign = () => {
    try {
      const design = {
        id: Date.now().toString(36),
        name: qrName || 'Static QR',
        createdAt: Date.now(),
        template: tpl,
        values: { ...values },
        style: renderStylePayload(style, isPro),
        payload: buildPayload(tpl, values)
      };
      const key = staticSaveKey();
      // migrate legacy key if present
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_STATIC_KEY) || 'null');
        if (Array.isArray(legacy) && legacy.length) {
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const merged = [...legacy, ...Array.isArray(existing) ? existing : []].slice(0, MAX_STATIC_SAVED);
          localStorage.setItem(key, JSON.stringify(merged));
          try { localStorage.removeItem(LEGACY_STATIC_KEY); } catch(_){}
        }
      } catch(_){}

      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [design, ...stored].slice(0, MAX_STATIC_SAVED);
      localStorage.setItem(key, JSON.stringify(next));
      setMsg('Static design saved locally.');
      setErr('');
      onRefresh?.();
    } catch (e) {
      setErr('Could not save static design locally.');
    }
  };

  const destinationSummaryText = destinationSummary(tpl, values);
  const showPreviewColumn = previewStartIndex >= 0 ? safeStep >= previewStartIndex : safeStep > 0;
  const layoutClasses = ['dynamic-wizard-layout'];
  if (!showPreviewColumn) layoutClasses.push('no-preview');
  const renderStepCard = () => {
    switch (currentStep.id) {
      case 'type': {
        return (
          <GlassCard className="dynamic-step-card">
            <SectionHeading
              eyebrow={stepNumberFor('type')}
              title="Choose your QR type"
              subtitle="Pick a dynamic code to edit destinations later or switch to a static code for instant exports."
            />
            <div className="template-grid">
              <button
                type="button"
                className={['template-card', isDynamic ? 'active' : ''].join(' ')}
                onClick={() => {
                  setFlowType('dynamic');
                }}
              >
                <span className="template-icon">📊</span>
                <div className="template-body">
                  <strong>Dynamic code</strong>
                  <p>Change destinations anytime, capture scan analytics, and manage codes from the library.</p>
                </div>
                <span className="template-chevron">→</span>
              </button>
              <button
                type="button"
                className={['template-card', !isDynamic ? 'active' : ''].join(' ')}
                onClick={() => {
                  setFlowType('static');
                }}
              >
                <span className="template-icon">⚡</span>
                <div className="template-body">
                  <strong>Static code</strong>
                  <p>Embed the payload directly in the QR, perfect for print-ready Wi-Fi, text, or contact details.</p>
                </div>
                <span className="template-chevron">→</span>
              </button>
            </div>
            <div className="dynamic-step-actions">
              <button
                className="btn-primary"
                onClick={() => advanceTo('goal')}
                disabled={isDynamic && busy}
              >
                {isDynamic && busy ? 'Preparing…' : 'Continue'}
              </button>
            </div>
          </GlassCard>
        );
      }
      case 'goal': {
        return (
          <GlassCard className="dynamic-step-card">
            <SectionHeading
              eyebrow={stepNumberFor('goal')}
              title="Define your campaign goal"
              subtitle={isDynamic
                ? 'Give this QR a memorable name and pick a template that matches how you plan to use it.'
                : 'Name your QR and select the content template you want to embed.'}
            />
            <label className="control-field">
              <span>QR name</span>
              <input
                value={qrName}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Spring launch promo"
              />
            </label>
            <div className="template-grid">
              {TEMPLATES.slice(0, 12).map(template => {
                const meta = templateMeta(template);
                const active = tpl === template;
                return (
                  <button
                    key={template}
                    type="button"
                    className={['template-card', active ? 'active' : ''].join(' ')}
                    onClick={() => {
                      selectTemplate(template);
                      if (sel) setStep(1);
                    }}
                  >
                    <span className="template-icon">{meta.emoji}</span>
                    <div className="template-body">
                      <strong>{meta.title}</strong>
                      <p>{meta.description}</p>
                    </div>
                    <span className="template-chevron">→</span>
                  </button>
                );
              })}
            </div>
            <div className="dynamic-step-actions">
              <button
                className="btn-primary"
                onClick={() => advanceTo('destination')}
                disabled={(isDynamic && busy && !sel) || !qrName.trim()}
              >
                {isDynamic
                  ? (!sel ? (busy ? 'Creating…' : 'Create & continue') : 'Continue to destination')
                  : 'Continue to content'}
              </button>
            </div>
          </GlassCard>
        );
      }
      case 'destination': {
        if (isDynamic && !sel) {
          return (
            <GlassCard className="dynamic-step-card">
              <SectionHeading
                eyebrow={stepNumberFor('destination')}
                title="Set your destination"
                subtitle="Create a dynamic QR first, then configure where it should send scanners."
              />
              <div className="dynamic-step-actions">
                <button className="btn-primary" onClick={() => advanceTo('goal')} disabled={busy}>
                  {busy ? 'Creating…' : 'Create dynamic QR'}
                </button>
              </div>
            </GlassCard>
          );
        }
        return (
          <GlassCard className="dynamic-step-card">
            <SectionHeading
              eyebrow={stepNumberFor('destination')}
              title={isDynamic ? 'Configure the scan destination' : 'Fill in your QR content'}
              subtitle={isDynamic
                ? 'Keep this QR flexible — you can swap destinations anytime without reprinting.'
                : 'Everything you enter here is encoded directly inside the QR.'}
            />
            <TemplateDataForm type={tpl} values={values} onChange={onValueChange} />
            <div className="dynamic-step-actions">
              <button className="btn-secondary ghost" onClick={() => goToStepId('goal')}>Back</button>
              <button className="btn-primary" onClick={() => goToStepId('branding')}>Next: Branding</button>
            </div>
          </GlassCard>
        );
      }
      case 'branding': {
        if (isDynamic && !sel) {
          return (
            <GlassCard className="dynamic-step-card">
              <SectionHeading
                eyebrow={stepNumberFor('branding')}
                title="Brand your QR"
                subtitle="Create a dynamic QR first, then style colors, frames, and logos."
              />
              <div className="dynamic-step-actions">
                <button className="btn-primary" onClick={() => advanceTo('goal')} disabled={busy}>
                  {busy ? 'Creating…' : 'Create dynamic QR'}
                </button>
              </div>
            </GlassCard>
          );
        }
        return (
          <GlassCard className="dynamic-step-card">
            <SectionHeading
              eyebrow={stepNumberFor('branding')}
              title="Brand your QR"
              subtitle="Match your palette, add frames, and drop in a logo if you’re on the Pro plan."
            />
            <div className="style-grid">
              <div className="style-card">
                <h4>Export size</h4>
                <p className="style-hint">Choose the default resolution for downloads.</p>
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
              <div className="style-card">
                <h4>Colors</h4>
                <p className="style-hint">Switch between solid and gradient ink to stand out.</p>
                <div className="pill-row">
                  <button className={style.colorMode === 'solid' ? 'pill active' : 'pill'} onClick={()=>onStyleChange('colorMode','solid')}>Solid</button>
                  <button className={style.colorMode === 'gradient' ? 'pill active' : 'pill'} onClick={()=>onStyleChange('colorMode','gradient')}>Gradient</button>
                </div>
                <div className="color-grid">
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
                  <label className="control-field color-field">
                    <span>Background</span>
                    <div className="color-input">
                      <input type="color" value={style.background} onChange={e=>onStyleChange('background', e.target.value)} />
                      <span>{style.background.toUpperCase()}</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="style-card">
                <h4>Frames</h4>
                <p className="style-hint">Highlight the QR with a border or call-to-action label.</p>
                <div className="pill-row">
                  <button className={style.frameStyle==='none'?'pill active':'pill'} onClick={()=>onStyleChange('frameStyle','none')}>None</button>
                  <button className={style.frameStyle==='rounded'?'pill active':'pill'} onClick={()=>onStyleChange('frameStyle','rounded')}>Rounded</button>
                  <button className={style.frameStyle==='label'?'pill active':'pill'} onClick={()=>onStyleChange('frameStyle','label')}>Label</button>
                </div>
                {style.frameStyle !== 'none' && (
                  <div className="color-grid">
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
                          <span>Label text</span>
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
              <div className="style-card">
                <h4>Logo overlay</h4>
                <p className="style-hint">{isPro ? 'Upload a logo to boost brand recognition.' : 'Upgrade to Pro to unlock logo overlays.'}</p>
                {isPro ? (
                  <div className="style-row">
                    <input type="file" accept="image/*" onChange={onLogoUpload} />
                    <label className="control-field">
                      <span>Size</span>
                      <input type="range" min="0.15" max="0.35" step="0.01" value={style.logoSizeRatio} onChange={e=>onStyleChange('logoSizeRatio', parseFloat(e.target.value))} />
                    </label>
                    {style.logoDataUrl && <button type="button" className="btn-secondary ghost" onClick={removeLogo}>Remove logo</button>}
                  </div>
                ) : (
                  <div className="small">Logos are reserved for Pro plans.</div>
                )}
              </div>
            </div>
            <div className="dynamic-step-actions">
              <button className="btn-secondary ghost" onClick={() => goToStepId('destination')}>Back</button>
              <button className="btn-primary" onClick={() => goToStepId('review')}>Next: Review</button>
            </div>
          </GlassCard>
        );
      }
      case 'review': {
        if (isDynamic && !sel) {
          return (
            <GlassCard className="dynamic-step-card">
              <SectionHeading
                eyebrow={stepNumberFor('review')}
                title="Review & launch"
                subtitle="Create a dynamic QR first, then you can review analytics and share it."
              />
              <div className="dynamic-step-actions">
                <button className="btn-primary" onClick={() => advanceTo('goal')} disabled={busy}>
                  {busy ? 'Creating…' : 'Create dynamic QR'}
                </button>
              </div>
            </GlassCard>
          );
        }
        const meta = templateMeta(tpl);
        if (isDynamic) {
          return (
            <GlassCard className="dynamic-step-card">
              <SectionHeading
                eyebrow={stepNumberFor('review')}
                title="Review & launch"
                subtitle="Run a quick test on desktop and mobile, then hit save to publish changes."
              />
              <div className="dynamic-review-grid">
                <div className="dynamic-review-item">
                  <span className="dynamic-review-label">Template</span>
                  <strong>{meta.title}</strong>
                  <p>{destinationSummaryText}</p>
                </div>
                <div className="dynamic-review-item">
                  <span className="dynamic-review-label">Styling</span>
                  <strong>{style.colorMode === 'gradient' ? 'Gradient ink' : 'Solid ink'}</strong>
                  <p>{style.frameStyle === 'none' ? 'No frame applied.' : `Frame: ${style.frameStyle}.`} {style.logoDataUrl ? 'Logo overlay active.' : 'No logo overlay.'}</p>
                </div>
                <div className="dynamic-review-item">
                  <span className="dynamic-review-label">Next steps</span>
                  <ul>
                    <li>Download the PNG for print or digital.</li>
                    <li>Use the public link to share or embed.</li>
                    <li>Monitor scans from the right-hand panel.</li>
                  </ul>
                </div>
              </div>
              <div className="dynamic-step-actions">
                <button className="btn-secondary ghost" onClick={() => goToStepId('branding')}>Back</button>
                <button className="btn-primary" onClick={updateSelected} disabled={busy || !sel?.id}>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </div>
              <div className="dynamic-download-row">
                <button type="button" className="btn-secondary" onClick={() => downloadStyled('png')}>Download PNG</button>
                <button type="button" className="btn-secondary" onClick={() => downloadStyled('jpeg')}>Download JPG</button>
                <button type="button" className="btn-secondary" onClick={downloadPdf}>Download PDF</button>
                <button type="button" className="btn-secondary" onClick={downloadSvg}>Download SVG</button>
              </div>
            </GlassCard>
          );
        }
        const staticPayload = buildPayload(tpl, values);
        return (
          <GlassCard className="dynamic-step-card">
            <SectionHeading
              eyebrow={stepNumberFor('review')}
              title="Review & export"
              subtitle="Download the assets and keep the payload handy for your records."
            />
            <div className="dynamic-review-grid">
              <div className="dynamic-review-item">
                <span className="dynamic-review-label">Template</span>
                <strong>{meta.title}</strong>
                <p>{destinationSummaryText}</p>
              </div>
              <div className="dynamic-review-item">
                <span className="dynamic-review-label">Styling</span>
                <strong>{style.colorMode === 'gradient' ? 'Gradient ink' : 'Solid ink'}</strong>
                <p>{style.frameStyle === 'none' ? 'No frame applied.' : `Frame: ${style.frameStyle}.`} {style.logoDataUrl ? 'Logo overlay active.' : 'No logo overlay.'}</p>
              </div>
              <div className="dynamic-review-item">
                <span className="dynamic-review-label">Payload</span>
                <textarea readOnly value={staticPayload} style={{ width: '100%', minHeight: 80 }} />
              </div>
            </div>
            <div className="dynamic-step-actions" style={{ gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-secondary ghost" onClick={() => goToStepId('branding')}>Back</button>
              <button type="button" className="btn-primary" onClick={saveStaticDesign}>Save static design</button>
            </div>
            <div className="dynamic-download-row">
              <button type="button" className="btn-secondary" onClick={() => downloadStyled('png')}>Download PNG</button>
              <button type="button" className="btn-secondary" onClick={() => downloadStyled('jpeg')}>Download JPG</button>
              <button type="button" className="btn-secondary" onClick={downloadPdf}>Download PDF</button>
              <button type="button" className="btn-secondary" onClick={downloadSvg}>Download SVG</button>
            </div>
          </GlassCard>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="dynamic-wizard fade-up">
      <div className="dynamic-header">
        <StepRail
          steps={steps}
          current={safeStep}
          onSelect={handleSelectStep}
          orientation="horizontal"
        />
      </div>

      <div className={layoutClasses.join(' ')}>
        <div className="dynamic-main-column">
          {(err || msg) && (
            <div className="dynamic-feedback">
              {err && <div className="alert-error">{err}</div>}
              {msg && <div className="alert-success">{msg}</div>}
            </div>
          )}
          {renderStepCard()}
        </div>

        {showPreviewColumn && (
          <div className="dynamic-preview-column">
            <GlassCard className="dynamic-preview-card">
              <div className="preview-toggle">
                <button
                  type="button"
                  className={previewMode === 'content' ? 'active' : ''}
                  onClick={() => setPreviewMode('content')}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className={previewMode === 'qr' ? 'active' : ''}
                  onClick={() => setPreviewMode('qr')}
                >
                  QR code
                </button>
              </div>
              <div className={`preview-frame ${previewMode === 'content' ? 'hidden' : 'visible'}`}>
                <canvas ref={previewRef} style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
              {previewMode === 'content' && (
                <div className="preview-phone">
                  <div className="preview-phone-notch" />
                  <div className="preview-phone-screen">
                    <TemplatePreview type={tpl} values={values} variant="phone" />
                  </div>
                </div>
              )}
              <div className="preview-note">
                {previewMode === 'content'
                  ? 'This is a friendly mock of what scanners will read after the QR loads.'
                  : isDynamic
                    ? (sel?.id ? 'The QR canvas mirrors your current settings.' : 'Create or select a dynamic QR to view the live canvas.')
                    : 'This QR is rendered locally from your static content.'}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
