import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, API } from '../api';
import { renderStyledQR } from '../lib/styledQr';
import { addToQueue } from '../lib/syncQueue';
import TemplatePreview, { EditableTemplatePreview } from './TemplatePreview.jsx';
import {
  TEMPLATES,
  TEMPLATE_DEFAULTS,
  buildPayload,
  TemplateDataForm,
  normalizeUrl,
  isComingSoonTemplate
} from './TemplateDataForm.jsx';
import GlassCard from './ui/GlassCard.jsx';
import StepRail from './ui/StepRail.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import FileUpload from './FileUpload.jsx';
import Icon from './ui/Icon.jsx';
import { FREE_PLAN_DYNAMIC_LIMIT, UPGRADES_ENABLED } from '../config/planLimits.js';

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

const DYNAMIC_EDIT_STEPS = [
  { id: 'goal', title: STEP_COPY.dynamicGoal.title, caption: STEP_COPY.dynamicGoal.caption },
  { id: 'destination', title: STEP_COPY.dynamicDestination.title, caption: STEP_COPY.dynamicDestination.caption },
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
  URL: { icon: 'link', title: 'Website link', description: 'Send scanners to any landing page or CTA.' },
  TEXT: { icon: 'message', title: 'Text snippet', description: 'Show a note, Wi-Fi code, or promo instantly.' },
  Email: { icon: 'envelope', title: 'Email draft', description: 'Prefill subject & body for quick replies.' },
  SMS: { icon: 'sms', title: 'Text message', description: 'Trigger an SMS to your team or support line.' },
  Phone: { icon: 'phone', title: 'Phone call', description: 'Dial a hotline or concierge in one tap.' },
  Location: { icon: 'map', title: 'Map destination', description: 'Open maps with directions to your venue.' },
  Event: { icon: 'calendar', title: 'Calendar invite', description: 'Add your event to Apple or Google calendars.' },
  WiFi: { icon: 'wifi', title: 'Wi‑Fi login', description: 'Share SSID and password without typing.' },
  Vcard: { icon: 'contact', title: 'Contact card', description: 'Save your profile to phone contacts.' },
  Whatsapp: { icon: 'message', title: 'WhatsApp chat', description: 'Start a conversation with your team.' },
  PDF: { icon: 'file', title: 'PDF Document', description: 'Link to a PDF file for download or view.' },
  MP3: { icon: 'audio', title: 'Audio File', description: 'Link to an MP3 or audio file.' },
  LinkTree: { icon: 'list', title: 'Link hub', description: 'Curate multiple links with a branded landing experience.' },
  Voucher: { icon: 'ticket', title: 'Discount Voucher', description: 'Share a promo code or voucher details.' },
  PIX: { icon: 'pix', title: 'PIX payment', description: 'Collect payments via Brazil’s PIX system.' }
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
    case 'PDF': {
      const url = String(values.fileUrl || '').trim();
      return url ? normalizeUrl(url) : 'Upload a PDF file.';
    }
    case 'MP3': {
      const url = String(values.fileUrl || '').trim();
      return url ? normalizeUrl(url) : 'Upload an audio file.';
    }
    case 'LinkTree': {
      const primaryUrl = (values.primaryCtaUrl || '').trim();
      if (primaryUrl) {
        const label = (values.primaryCtaLabel || 'Primary link').trim();
        return `${label} → ${normalizeUrl(primaryUrl)}`;
      }
      const links = (values.secondaryLinks || '').split('\n').map(line => line.split('|')[1]).filter(Boolean);
      if (links.length > 0) {
        return `Link hub with ${links.length} link${links.length === 1 ? '' : 's'}.`;
      }
      return 'Add at least one link.';
    }
    case 'Voucher': {
      return values.code ? `Voucher: ${values.code}` : 'Add voucher details.';
    }
    default:
      return 'Destination configured in the previous step.';
  }
}

const REQUIRED_HINTS = {
  URL: 'Add a valid link such as https://example.com',
  TEXT: 'Write the message scanners should read.',
  PHONE: 'Include the phone number to dial.',
  SMS: 'Provide the phone number that will receive the text message.',
  EMAIL: 'Set the recipient email address.',
  WHATSAPP: 'Add the WhatsApp phone number.',
  FACETIME: 'Provide the FaceTime phone number or email address.',
  LOCATION: 'Enter coordinates or a map search query.',
  WIFI: 'This template is coming soon — stay tuned.',
  EVENT: 'This template is coming soon — stay tuned.',
  APPLINK: 'This template is coming soon — stay tuned.',
  GALLERY: 'This template is coming soon — stay tuned.',
  VCARD: 'Add contact details such as name, email, or phone.',
  PDF: 'Upload a PDF file to link to.',
  MP3: 'Upload an audio file to link to.',
  VOUCHER: 'Enter the voucher or coupon code.',
  CRYPTO: 'Add the crypto wallet address.',
  PAYPAL: 'Enter your PayPal username.',
  'UPI PAYMENT': 'Provide your UPI handle (VPA).',
  'EPC PAYMENT': 'Enter the account name and IBAN.',
  'PIX PAYMENT': 'Paste the PIX payload string.',
  LINKTREE: 'Add at least one link or CTA for your hub.'
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
};

function isDestinationComplete(template, values = {}) {
  if (isComingSoonTemplate(template)) return false;
  const type = (template || 'URL').toUpperCase();
  switch (type) {
    case 'URL':
      return hasValue(values.url);
    case 'TEXT':
      return hasValue(values.text);
    case 'PHONE':
      return hasValue(values.phone);
    case 'SMS':
      return hasValue(values.to);
    case 'EMAIL':
      return hasValue(values.to);
    case 'WHATSAPP':
      return hasValue(values.phone);
    case 'FACETIME':
      return hasValue(values.target);
    case 'LOCATION':
      return (hasValue(values.lat) && hasValue(values.lng)) || hasValue(values.query);
    case 'WIFI': {
      if (!hasValue(values.ssid)) return false;
      const auth = (values.auth || 'WPA').toUpperCase();
      return auth === 'NOPASS' || hasValue(values.password);
    }
    case 'EVENT':
      return hasValue(values.summary) && hasValue(values.start);
    case 'VCARD':
      return hasValue(values.first) || hasValue(values.last) || hasValue(values.email) || hasValue(values.phone);
    case 'PDF':
    case 'MP3':
      return hasValue(values.fileUrl);
    case 'LINKTREE': {
      if (hasValue(values.primaryCtaUrl)) return true;
      const links = (values.secondaryLinks || '').split('\n').map(line => line.split('|')[1]).filter(item => hasValue(item));
      return links.length > 0;
    }
    case 'VOUCHER':
      return hasValue(values.code);
    case 'CRYPTO':
      return hasValue(values.address);
    case 'PAYPAL':
      return hasValue(values.username);
    case 'UPI PAYMENT':
      return hasValue(values.vpa);
    case 'EPC PAYMENT':
      return hasValue(values.iban) && hasValue(values.name);
    case 'PIX PAYMENT':
      return hasValue(values.payload);
    default:
      return true;
  }
}

function destinationValidationMessage(template) {
  const type = (template || 'URL').toUpperCase();
  return REQUIRED_HINTS[type] || 'Complete the required fields above to continue.';
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

export default function DynamicDashboard({ user, initialCodeId = null, initialType = null, onClose, onRefresh, onUpgrade }) {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const normalizeFlow = (type) => (type && String(type).startsWith('static') ? 'static' : 'dynamic');
  const normalizedInitialFlow = normalizeFlow(initialType);
  const initialMode = initialCodeId ? 'edit' : 'create';
  const initialSteps = normalizedInitialFlow === 'static'
    ? STATIC_STEPS
    : (initialMode === 'edit' ? DYNAMIC_EDIT_STEPS : DYNAMIC_STEPS);
  const [mode, setMode] = useState(initialMode);
  const [flowType, setFlowType] = useState(normalizedInitialFlow);
  const [tpl, setTpl] = useState('URL');
  const [values, setValues] = useState({ ...TEMPLATE_DEFAULTS.URL });
  const [style, setStyle] = useState({ ...STYLE_DEFAULTS });
  const [qrName, setQrName] = useState(normalizedInitialFlow === 'static' ? 'New static QR' : 'New dynamic QR');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const previewRef = useRef(null);
  const mobilePreviewRef = useRef(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [mobilePreviewData, setMobilePreviewData] = useState(null);
  const [previewInfo, setPreviewInfo] = useState({ width: 0, height: 0 });
  const [previewMode, setPreviewMode] = useState('qr');
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const previewData = useMemo(() => {
    try {
      return JSON.stringify(values ?? {});
    } catch {
      return '';
    }
  }, [values]);
  const previewUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (!tpl) return '';
    if (!previewData) return '';
    try {
      const typeParam = encodeURIComponent(String(tpl).toUpperCase());
      const dataParam = encodeURIComponent(previewData);
      return `${window.location.origin}/payload.html?type=${typeParam}&data=${dataParam}`;
    } catch {
      return '';
    }
  }, [tpl, previewData]);
  const draftsRef = useRef({});
  const prevSelRef = useRef(null);
  const [lastCreatedId, setLastCreatedId] = useState(null);
  const [planLimitError, setPlanLimitError] = useState(false);
  const isPro = !!user?.is_pro;
  const upgradesEnabled = UPGRADES_ENABLED;
  const planDynamicLimit = user?.free_plan_dynamic_limit ?? FREE_PLAN_DYNAMIC_LIMIT;
  const limitApplies = upgradesEnabled && !isPro && Number.isFinite(planDynamicLimit);
  const remainingDynamicSlots = useMemo(() => (
    limitApplies ? Math.max(0, planDynamicLimit - items.length) : Infinity
  ), [limitApplies, planDynamicLimit, items.length]);
  const dynamicLimitReached = limitApplies && remainingDynamicSlots <= 0;
  const freePlanLimitMessage = useMemo(() => {
    if (!limitApplies) return '';
    const plural = planDynamicLimit === 1 ? '' : 's';
    return `Free plan includes ${planDynamicLimit} dynamic QR${plural}. Upgrade to Pro to add more.`;
  }, [limitApplies, planDynamicLimit]);
  const handleUpgradeClick = useCallback(() => {
    if (upgradesEnabled && onUpgrade) onUpgrade();
  }, [upgradesEnabled, onUpgrade]);

  const goalValid = useMemo(() => hasValue(qrName) && !!tpl, [qrName, tpl]);
  const destinationAccessible = flowType === 'static' || !!sel?.id;
  const destinationValid = useMemo(
    () => (destinationAccessible ? isDestinationComplete(tpl, values) : false),
    [destinationAccessible, tpl, values]
  );
  const destinationHint = destinationValidationMessage(tpl);
  useEffect(() => {
    setMode(initialCodeId ? 'edit' : 'create');
  }, [initialCodeId]);
  const initialStepIndex = (() => {
    if (initialCodeId) {
      const preferredId = 'goal';
      const idx = initialSteps.findIndex(item => item.id === preferredId);
      if (idx >= 0) return idx;
    }
    return 0;
  })();
  const [step, setStep] = useState(initialStepIndex);
  const isFreshFlow = !initialCodeId && (!initialType || String(initialType).includes('new'));
  const isEditMode = mode === 'edit';
  const editingDynamic = flowType === 'dynamic' && isEditMode;
  const steps = useMemo(() => {
    if (flowType === 'static') return STATIC_STEPS;
    return editingDynamic ? DYNAMIC_EDIT_STEPS : DYNAMIC_STEPS;
  }, [flowType, editingDynamic]);
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
  const destinationStepIndex = useMemo(() => steps.findIndex(item => item.id === 'destination'), [steps]);
  const hasBrandingStep = useMemo(() => steps.some(item => item.id === 'branding'), [steps]);
  useEffect(() => {
    const maxIndex = steps.length - 1;
    setStep(prev => {
      let next = Math.min(prev, maxIndex);
      if (editingDynamic) {
        const goalIdx = steps.findIndex(item => item.id === 'goal');
        if (goalIdx >= 0 && next < goalIdx) {
          next = goalIdx;
        }
      }
      return next;
    });
  }, [steps, editingDynamic]);

  const stepStatusById = useMemo(() => {
    const mapping = {};
    steps.forEach((step, index) => {
      let status = 'pending';
      switch (step.id) {
        case 'type':
          status = index <= safeStep ? 'complete' : 'pending';
          break;
        case 'goal':
          status = goalValid ? (index <= safeStep ? 'complete' : 'pending') : (safeStep >= index ? 'error' : 'pending');
          break;
        case 'destination':
          if (!destinationAccessible) {
            status = 'pending';
          } else if (!destinationValid) {
            status = safeStep >= index ? 'error' : 'pending';
          } else {
            status = index <= safeStep ? 'complete' : 'pending';
          }
          break;
        case 'review': {
          const ready = goalValid && (!destinationAccessible || destinationValid);
          status = ready ? (index < safeStep ? 'complete' : 'pending') : (safeStep >= index ? 'error' : 'pending');
          break;
        }
        default:
          status = index < safeStep ? 'complete' : 'pending';
      }
      mapping[step.id] = status;
    });
    return mapping;
  }, [steps, safeStep, goalValid, destinationAccessible, destinationValid]);

  useEffect(() => {
    if (!limitApplies) {
      if (planLimitError) setPlanLimitError(false);
      return;
    }
    if (planLimitError && remainingDynamicSlots > 0) {
      setPlanLimitError(false);
      if (err === freePlanLimitMessage) setErr('');
    }
  }, [limitApplies, planLimitError, remainingDynamicSlots, err, freePlanLimitMessage]);

  useEffect(() => {
    (async () => {
      try {
        const list = await api('/qr/list');
        const normalized = Array.isArray(list) ? list.map(it => ({ ...it, style: it.style || null })) : [];
        setItems(prev => {
          // if server returned a non-empty list, use it
          if (Array.isArray(list) && list.length > 0) {
            // ensure selection stays consistent when possible
            if (isFreshFlow || !normalized.length) {
              setSel(null);
              setQrName(normalizeFlow(initialType) === 'static' ? 'New static QR' : 'New dynamic QR');
            }
            setErr('');
            return normalized;
          }
          // server returned an empty list but we already have items locally -> keep them
          if (Array.isArray(list) && list.length === 0 && prev && prev.length > 0) {
            setErr('Server returned an empty list — keeping locally cached items.');
            return prev;
          }
          // fallback: replace with whatever normalized value is (likely empty)
          if (isFreshFlow || !normalized.length) {
            setSel(null);
            setQrName(normalizeFlow(initialType) === 'static' ? 'New static QR' : 'New dynamic QR');
          }
          setErr('');
          return normalized;
        });
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
      setMode('create');
      setLastCreatedId(null);
      setTpl('URL');
      setValues({ ...TEMPLATE_DEFAULTS.URL });
      setStyle({ ...STYLE_DEFAULTS });
      setQrName(flowType === 'static' ? 'New static QR' : 'New dynamic QR');
      return;
    }
    const createdRecently = lastCreatedId && sel.id === lastCreatedId;
    if (!createdRecently) setMode('edit');
    setStyle(prev => ({ ...prev, ...(sel.style || {}) }));
    setQrName(sel.name || 'Untitled QR');
    const target = sel.target || '';

    // Detect template type from target URL
    if (target && !target.includes('/payload.html')) {
      // Simple URL - assume URL template
      setTpl('URL');
      setValues({ ...TEMPLATE_DEFAULTS.URL, url: target });
    } else if (target && target.includes('/payload.html')) {
      // Complex payload - try to parse from URL params
      try {
        const url = new URL(target);
        const type = url.searchParams.get('type');
        const data = url.searchParams.get('data');
        if (type && data) {
          const decodedData = decodeURIComponent(data);
          const parsedValues = JSON.parse(decodedData);
          setTpl(type);
          const defaults = TEMPLATE_DEFAULTS[type] || {};
          const nextValues = { ...defaults, ...parsedValues };
          if ((type === 'PDF' || type === 'MP3') && nextValues.fileUrl && !nextValues.fileName) {
            try {
              const parts = String(nextValues.fileUrl).split('/');
              nextValues.fileName = decodeURIComponent(parts[parts.length - 1] || '');
            } catch {
              nextValues.fileName = '';
            }
          }
          setValues(nextValues);
        } else {
          setTpl('URL');
          setValues({ ...TEMPLATE_DEFAULTS.URL });
        }
      } catch (e) {
        console.warn('Failed to parse payload URL:', target, e);
        setTpl('URL');
        setValues({ ...TEMPLATE_DEFAULTS.URL });
      }
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
      prevSelRef.current = null;
      if (isEditMode) {
        const goalIndex = steps.findIndex(item => item.id === 'goal');
        const fallbackStep = goalIndex >= 0 ? goalIndex : 0;
        setStep(fallbackStep);
      }
      return;
    }
    if (!isEditMode) {
      prevSelRef.current = sel;
      return;
    }
    const prevId = prevSelRef.current?.id;
    if (!prevId || prevId !== sel.id) {
      const destinationIdx = steps.findIndex(item => item.id === 'destination');
      if (destinationIdx >= 0) {
        setStep(destinationIdx);
      } else {
        const goalIndex = steps.findIndex(item => item.id === 'goal');
        if (goalIndex >= 0) setStep(goalIndex);
      }
    }
    prevSelRef.current = sel;
  }, [sel, isDynamic, isEditMode, steps]);

  const brandingIndex = useMemo(() => steps.findIndex(item => item.id === 'branding'), [steps]);
  useEffect(() => {
    const withinContent =
      previewStartIndex >= 0 &&
      safeStep >= previewStartIndex &&
      (brandingIndex === -1 || safeStep < brandingIndex);
    setPreviewMode(withinContent ? 'content' : 'qr');
  }, [safeStep, flowType, sel?.id, previewStartIndex, brandingIndex]);

  useEffect(() => {
    const canvas = previewRef.current;
    const mobileCanvas = mobilePreviewRef.current;
    if (!canvas) return;
    const clear = () => {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setPreviewInfo({ width: 0, height: 0 });
      if (mobileCanvas) {
        const mctx = mobileCanvas.getContext('2d');
        mctx?.clearRect(0, 0, mobileCanvas.width, mobileCanvas.height);
      }
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
        try {
          const info = await renderStyledQR(canvas, `${API}/qr/${sel.id}`, styleOptions);
          if (!cancelled && info) setPreviewInfo(info);
        } catch {}
        if (mobileCanvas) {
          try { await renderStyledQR(mobileCanvas, `${API}/qr/${sel.id}`, { ...styleOptions, size: 140 }); } catch {}
        }
      } else {
        const payload = buildPayload(tpl, values);
        try {
          const info = await renderStyledQR(canvas, payload || ' ', styleOptions);
          if (!cancelled && info) setPreviewInfo(info);
        } catch {}
        if (mobileCanvas) {
          try { await renderStyledQR(mobileCanvas, payload || ' ', { ...styleOptions, size: 140 }); } catch {}
        }
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

  const onLogoUpload = (file) => {
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

  // touch swipe support for mobile step header
  const touchStartXRef = React.useRef(null);
  const touchStartTimeRef = React.useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartXRef.current = t.clientX;
    touchStartTimeRef.current = Date.now();
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches?.[0];
    if (!t || touchStartXRef.current == null) return;
    const dx = t.clientX - touchStartXRef.current;
    const dt = Date.now() - touchStartTimeRef.current;
    const absDx = Math.abs(dx);
    // require a minimum distance and reasonable speed
    if (absDx > 50 && dt < 800) {
      if (dx < 0) {
        // swipe left -> next
        setStep(s => Math.min(steps.length - 1, s + 1));
      } else {
        // swipe right -> prev
        setStep(s => Math.max(0, s - 1));
      }
    }
    touchStartXRef.current = null;
    touchStartTimeRef.current = null;
  };

  // pointer-based drag for smoother mobile UX
  const dragState = React.useRef({ startX: 0, startY: 0, dragging: false, canceled: false });
  const [dragOffset, setDragOffset] = React.useState(0);
  const [animDirection, setAnimDirection] = React.useState(null); // 'left' | 'right' or null

  const onPointerDown = (e) => {
    // only track primary pointer
    dragState.current.startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    dragState.current.startY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    dragState.current.dragging = true;
    dragState.current.canceled = false;
    setDragOffset(0);
  };

  const onPointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const y = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    const dx = x - dragState.current.startX;
    const dy = y - dragState.current.startY;
    // cancel drag if vertical scrolling dominant
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      dragState.current.canceled = true;
      setDragOffset(0);
      return;
    }
    // limit offset for feel
    const limited = Math.max(-window.innerWidth, Math.min(window.innerWidth, dx));
    setDragOffset(limited);
  };

  const onPointerUp = (e) => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    if (dragState.current.canceled) {
      setDragOffset(0);
      return;
    }
    const endX = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX) || 0;
    const dx = endX - dragState.current.startX;
    const threshold = Math.max(60, window.innerWidth * 0.15);
    if (dx < -threshold) {
      setAnimDirection('left');
      setStep(s => Math.min(steps.length - 1, s + 1));
    } else if (dx > threshold) {
      setAnimDirection('right');
      setStep(s => Math.max(0, s - 1));
    }
    // reset drag offset after a frame so animation can play
    requestAnimationFrame(() => setDragOffset(0));
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
    if (dynamicLimitReached) {
      setPlanLimitError(true);
      if (freePlanLimitMessage) setErr(freePlanLimitMessage);
      return null;
    }
    setBusy(true);
    setMsg('');
    setErr('');
    setPlanLimitError(false);
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
      setLastCreatedId(normalized.id);
      setMode('create');
      setMsg('Dynamic QR created. Configure the destination and click “Save changes”.');
      if (autoAdvance) {
        const nextDestinationIndex = destinationStepIndex >= 0 ? destinationStepIndex : Math.min(steps.length - 1, 1);
        setStep(nextDestinationIndex);
      }
      onRefresh?.();
      return normalized;
    } catch (e) {
      if (e?.status === 403 && e?.code === 'PLAN_LIMIT_DYNAMIC') {
        setPlanLimitError(true);
        const remaining = typeof e?.details?.remaining === 'number' ? e.details.remaining : 0;
        if (remaining > 0) {
          const plural = remaining === 1 ? '' : 's';
          setErr(`Free plan can add ${remaining} more dynamic QR${plural}. Try a smaller batch or upgrade for unlimited codes.`);
        } else if (freePlanLimitMessage) {
          setErr(freePlanLimitMessage);
        } else {
          setErr(e.message || 'Plan limit reached.');
        }
      } else {
        setPlanLimitError(false);
        setErr(e.message || 'Create failed');
      }
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
        const url = `${window.location.origin}/payload.html?type=${encodeURIComponent(tpl)}&data=${encodeURIComponent(JSON.stringify(values))}`;
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

      // optimistic local save and background sync
      const pending = { ...design, _pending: true };
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [pending, ...stored].slice(0, MAX_STATIC_SAVED);
      localStorage.setItem(key, JSON.stringify(next));
      setMsg('Static design saved locally. Syncing…');
      setErr('');
      onRefresh?.();

      // add to persistent retry queue — syncQueue will call the API and notify via listeners
      try {
        addToQueue(pending);
        setMsg('Static design saved locally. Will sync in background.');
      } catch (_e) {
        setMsg('Saved locally. Will retry sync when online.');
      }
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
            <div className="onboarding-callout" role="note">
              <Icon name="sparkles" size={20} />
              <div>
                <p><strong>Dynamic QR codes</strong> stay flexible — you can update destinations, track scans, and reuse the same printout.</p>
                <p><strong>Static QR codes</strong> encode the content itself, making them perfect for menus, Wi‑Fi details, or contact cards that never change.</p>
              </div>
            </div>
            <div className="template-grid">
              <button
                type="button"
                className={['template-card', isDynamic ? 'active' : ''].join(' ')}
                onClick={() => {
                  setFlowType('dynamic');
                }}
              >
                <span className="template-icon">
                  <Icon name="chart" size={18} />
                </span>
                <div className="template-body">
                  <strong>Dynamic code</strong>
                  <p>Change destinations anytime, capture scan analytics, and manage codes from the library.</p>
                </div>
                <span className="template-chevron">→</span>
              </button>
              <button
                type="button"
                className={['template-card', !isDynamic ? 'active' : '', sel ? 'disabled' : ''].join(' ')}
                disabled={!!sel}
                onClick={() => {
                  if (!sel) setFlowType('static');
                }}
              >
                <span className="template-icon">
                  <Icon name="lightning" size={18} />
                </span>
                <div className="template-body">
                  <strong>Static code</strong>
                  <p>Embed the payload directly in the QR, perfect for print-ready Wi-Fi, text, or contact details.</p>
                  {sel && <small style={{ color: '#ef4444' }}>Cannot switch to static when editing existing QR</small>}
                </div>
                <span className="template-chevron">→</span>
              </button>
            </div>
            <div className="dynamic-step-actions step-actions-sticky">
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
        const isCreatingNewDynamic = isDynamic && !sel;
        const continueDisabled = (!goalValid) || (isCreatingNewDynamic && (busy || dynamicLimitReached));
        const goalIssues = [];
        if (!hasValue(qrName)) goalIssues.push('Add a name for this QR');
        if (!tpl) goalIssues.push('Pick a template');
        return (
          <GlassCard className="dynamic-step-card">
            <SectionHeading
              eyebrow={stepNumberFor('goal')}
              title="Define your campaign goal"
              subtitle={isDynamic
                ? 'Give this QR a memorable name and pick a template that matches how you plan to use it.'
                : 'Name your QR and select the content template you want to embed.'}
            />
            {!isPro && (
              <div className={`plan-inline-note${!dynamicLimitReached ? ' positive' : ''}`} style={{ marginBottom: 16 }}>
                {dynamicLimitReached
                  ? freePlanLimitMessage
                  : `You can create ${remainingDynamicSlots} more dynamic QR${remainingDynamicSlots === 1 ? '' : 's'} on the free plan.`}
                {dynamicLimitReached && onUpgrade && (
                  <button type="button" className="btn-secondary upgrade-inline" onClick={handleUpgradeClick}>
                    Upgrade to Pro
                  </button>
                )}
              </div>
            )}
            <label className="control-field">
              <span>QR name</span>
              <input
                value={qrName}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Spring launch promo"
              />
            </label>
            <div className="template-grid">
              {TEMPLATES.slice(0, 13).map(template => {
                const meta = templateMeta(template);
                const active = tpl === template;
                const comingSoon = isComingSoonTemplate(template);
                const classes = ['template-card'];
                if (active) classes.push('active');
                if (comingSoon) classes.push('coming-soon');
                return (
                  <button
                    key={template}
                    type="button"
                    className={classes.join(' ')}
                    aria-disabled={comingSoon}
                    onClick={() => {
                      selectTemplate(template);
                      if (sel) {
                        const index = destinationStepIndex >= 0 ? destinationStepIndex : Math.min(steps.length - 1, 1);
                        setStep(index);
                      }
                    }}
                  >
                    <span className="template-icon">
                      <Icon name={meta.icon} size={18} />
                    </span>
                    <div className="template-body">
                      <strong>{meta.title}</strong>
                      <p>{meta.description}</p>
                      {comingSoon && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#2563eb'
                        }}>
                          <Icon name="sparkles" size={14} /> Coming soon
                        </span>
                      )}
                    </div>
                    <span className="template-chevron">→</span>
                  </button>
                );
              })}
            </div>
            {goalIssues.length > 0 && (
              <div className="inline-validation" role="alert">
                <Icon name="error" size={16} />
                <span>{goalIssues.join('. ')}.</span>
              </div>
            )}
            <div className="dynamic-step-actions step-actions-sticky">
              <button
                className="btn-primary"
                onClick={() => advanceTo('destination')}
                disabled={continueDisabled}
              >
                {isDynamic
                  ? (isCreatingNewDynamic
                      ? (dynamicLimitReached ? 'Upgrade required' : (busy ? 'Creating…' : 'Create & continue'))
                      : 'Continue to destination')
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
              <div className="dynamic-step-actions step-actions-sticky">
                <button className="btn-primary" onClick={() => advanceTo('goal')} disabled={busy}>
                  {busy ? 'Creating…' : 'Create dynamic QR'}
                </button>
              </div>
            </GlassCard>
          );
        }
        const destinationContinueDisabled = !destinationAccessible || !destinationValid;
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
            {destinationAccessible && !destinationValid && (
              <div className="inline-validation" role="alert">
                <Icon name="error" size={16} />
                <span>{destinationHint}</span>
              </div>
            )}
            <div className="dynamic-step-actions step-actions-sticky">
              <button className="btn-secondary ghost" onClick={() => goToStepId('goal')}>Back</button>
              <button
                className="btn-primary"
                onClick={() => goToStepId(hasBrandingStep ? 'branding' : 'review')}
                disabled={destinationContinueDisabled}
              >
                {hasBrandingStep ? 'Next: Branding' : 'Continue to review'}
              </button>
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
            <div className="dynamic-step-actions step-actions-sticky">
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
                    <FileUpload
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      onUpload={onLogoUpload}
                      currentFile={style.logoDataUrl}
                      onRemove={removeLogo}
                    />
                    <label className="control-field">
                      <span>Size</span>
                      <input type="range" min="0.15" max="0.35" step="0.01" value={style.logoSizeRatio} onChange={e=>onStyleChange('logoSizeRatio', parseFloat(e.target.value))} />
                    </label>
                  </div>
                ) : (
                  <div className="small">Logos are reserved for Pro plans.</div>
                )}
              </div>
            </div>
            <div className="dynamic-step-actions step-actions-sticky">
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
              <div className="dynamic-step-actions step-actions-sticky">
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
              <div className="dynamic-step-actions step-actions-sticky">
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
            <div className="dynamic-step-actions step-actions-sticky">
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
        {/* Desktop step rail (hidden on mobile) */}
        <div className="desktop-step-rail">
          <StepRail
            steps={steps}
            current={safeStep}
            onSelect={handleSelectStep}
            orientation="horizontal"
            statusById={stepStatusById}
          />
        </div>
        {/* Mobile step header (visible only on small screens) */}
        <div
          className="mobile-step-header"
          role="region"
          aria-label="Step header"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button type="button" className="icon-button" aria-label="Previous step" onClick={() => setStep(s => Math.max(0, s - 1))}>◀</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{currentStep.caption ? currentStep.caption.split('.')[0] : 'Step'}</div>
            <div style={{ fontWeight: 700 }}>{safeStep + 1} / {steps.length}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{currentStep.title}</div>
          </div>
          <div className="mobile-step-header-controls">
            <button
              type="button"
              className="icon-button"
              aria-label="Open step navigator"
              onClick={() => setMobileRailOpen(true)}
              aria-haspopup="dialog"
            >
              <Icon name="menu" size={16} />
            </button>
            <button type="button" className="icon-button" aria-label="Next step" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>▶</button>
          </div>
        </div>
      </div>

      {mobileRailOpen && (
        <div className="mobile-step-rail-overlay" role="dialog" aria-modal="true" aria-label="Step navigation">
          <div className="mobile-step-rail-card">
            <div className="mobile-step-rail-card-header">
              <span>Jump to a step</span>
              <button type="button" className="icon-button" onClick={() => setMobileRailOpen(false)} aria-label="Close step navigation">
                <Icon name="close" size={16} />
              </button>
            </div>
            <StepRail
              steps={steps}
              current={safeStep}
              onSelect={(index, step) => {
                handleSelectStep(index, step);
                setMobileRailOpen(false);
              }}
              statusById={stepStatusById}
              compact
            />
          </div>
        </div>
      )}

      <div className={layoutClasses.join(' ')}>
        <div className="dynamic-main-column">
          {/* Mobile inline preview (visible only on small screens) */}
          <div
            className="mobile-inline-preview-wrap"
            role="button"
            tabIndex={0}
            aria-label="Open QR preview"
            onClick={async () => {
              try {
                if (!mobilePreviewRef.current) return;
                const data = mobilePreviewRef.current.toDataURL('image/png');
                setMobilePreviewData(data);
                setMobilePreviewOpen(true);
              } catch {}
            }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
          >
            <canvas ref={mobilePreviewRef} className="mobile-inline-preview" width="140" height="140" aria-hidden="true" />
          </div>
          {(err || msg) && (
            <div className="dynamic-feedback">
              {err && (
                <div className="alert-error" role="alert">
                  {err}
                  {planLimitError && onUpgrade && (
                    <button type="button" className="btn-secondary upgrade-inline" onClick={handleUpgradeClick}>
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              )}
              {msg && <div className="alert-success">{msg}</div>}
            </div>
          )}
          <div
            className={["step-card-wrap", animDirection ? `slide-${animDirection}` : ''].join(' ')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            style={{ transform: `translateX(${dragOffset}px)` }}
          >
            {renderStepCard()}
          </div>
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
                <PayloadPreviewFrame src={previewUrl} />
              )}
              <div className="preview-note">
                {previewMode === 'content'
                  ? 'This live preview matches the landing page your scanners will see.'
                  : isDynamic
                    ? (sel?.id ? 'The QR canvas mirrors your current settings.' : 'Create or select a dynamic QR to view the live canvas.')
                    : 'This QR is rendered locally from your static content.'}
              </div>
            </GlassCard>
          </div>
        )}
        {/* (bottom toolbar removed — mobile header provides step controls) */}
        {/* Mobile preview modal */}
        <MobilePreviewModal open={mobilePreviewOpen} data={mobilePreviewData} onClose={() => setMobilePreviewOpen(false)} />
      </div>
    </div>
  );
}

// Mobile preview modal component styles are in styles.css
function MobilePreviewModal({ open, data, onClose }) {
  if (!open) return null;
  let FocusTrap;
  try { FocusTrap = require('focus-trap-react').default; } catch (e) { FocusTrap = null; }
  const content = (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card small" role="document">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={data} alt="QR preview" style={{ maxWidth: '90vw', maxHeight: '80vh' }} tabIndex={0} />
        </div>
      </div>
    </div>
  );
  if (FocusTrap) {
    return (
      <FocusTrap focusTrapOptions={{ onDeactivate: onClose, initialFocus: false }}>
        {content}
      </FocusTrap>
    );
  }
  return content;
}

function PayloadPreviewFrame({ src }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe) return;
    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const bodyHeight = doc.body ? doc.body.scrollHeight : 0;
        const docHeight = doc.documentElement ? doc.documentElement.scrollHeight : 0;
        const ideal = Math.max(bodyHeight, docHeight, 540);
        iframe.style.height = `${Math.min(Math.max(ideal, 540), 1200)}px`;
      } catch {
        iframe.style.height = '720px';
      }
    };
    iframe.style.height = '720px';
    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [src]);

  if (!src) {
    return (
      <div className="live-preview-frame fallback">
        <p>Populate the template details to see the live landing experience.</p>
      </div>
    );
  }

  return (
    <div className="live-preview-frame">
      <iframe
        key={src}
        ref={frameRef}
        src={src}
        title="QR landing preview"
        loading="lazy"
        allow="clipboard-write"
      />
    </div>
  );
}
