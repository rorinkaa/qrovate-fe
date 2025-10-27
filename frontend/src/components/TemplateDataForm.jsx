import React, { useEffect, useMemo, useState } from 'react';
import { API, withAuth } from '../api';
import FileUpload from './FileUpload';
import { TEMPLATE_SCHEMAS, TEMPLATE_SECTION_ORDER, TEMPLATE_SECTION_TITLES } from './templateSchemas.js';

export const TEMPLATE_LIBRARY = [
  {
    id: 'URL',
    title: 'Website',
    description: 'Link to any website URL.',
    icon: 'link',
    category: 'links',
    accent: '#0ea5e9',
    accentSoft: 'rgba(14, 165, 233, 0.14)'
  },
  {
    id: 'TEXT',
    title: 'Text or note',
    description: 'Show announcements, offers, or simple copy.',
    icon: 'file',
    category: 'content',
    accent: '#7c3aed',
    accentSoft: 'rgba(124, 58, 237, 0.16)'
  },
  {
    id: 'PDF',
    title: 'PDF document',
    description: 'Publish a branded document landing with download CTA.',
    icon: 'file',
    category: 'content',
    accent: '#dc2626',
    accentSoft: 'rgba(220, 38, 38, 0.18)'
  },
  {
    id: 'MP3',
    title: 'Music release',
    description: 'Share a track with a rich player and streaming links.',
    icon: 'audio',
    category: 'content',
    accent: '#7c3aed',
    accentSoft: 'rgba(124, 58, 237, 0.16)'
  },
  {
    id: 'Vcard',
    title: 'Digital business card',
    description: 'Save your contact details to their phone.',
    icon: 'id',
    category: 'contact',
    accent: '#8b5cf6',
    accentSoft: 'rgba(139, 92, 246, 0.18)'
  },
  {
    id: 'LinkTree',
    title: 'Link hub',
    description: 'Curate multiple links with a branded hero and actions.',
    icon: 'list',
    category: 'links',
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.16)'
  },
  {
    id: 'AppLink',
    title: 'App smart link',
    description: 'Send people to the right app store with one scan.',
    icon: 'smartphone',
    category: 'links',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.16)'
  },
  {
    id: 'WiFi',
    title: 'Wi‑Fi login',
    description: 'Share SSID and password without typing.',
    icon: 'wifi',
    category: 'events',
    accent: '#14b8a6',
    accentSoft: 'rgba(20, 184, 166, 0.16)'
  },
  {
    id: 'Event',
    title: 'Calendar event',
    description: 'Add an event directly to the scanner’s calendar.',
    icon: 'calendar',
    category: 'events',
    accent: '#f97316',
    accentSoft: 'rgba(249, 115, 22, 0.18)'
  },
  {
    id: 'Gallery',
    title: 'Gallery or menu',
    description: 'Showcase dishes, projects, or products beautifully.',
    icon: 'image',
    category: 'content',
    accent: '#ec4899',
    accentSoft: 'rgba(236, 72, 153, 0.18)'
  }
];

export const TEMPLATE_CATEGORIES = [
  { id: 'links', label: 'Links & social' },
  { id: 'content', label: 'Content & info' },
  { id: 'contact', label: 'Contact & messaging' },
  { id: 'events', label: 'Events & access' }
];

export const TEMPLATE_LIBRARY_MAP = Object.fromEntries(TEMPLATE_LIBRARY.map(item => [item.id, item]));

export const TEMPLATES = TEMPLATE_LIBRARY.map(item => item.id);

export const COMING_SOON_TEMPLATES = new Set(['APPLINK', 'WIFI', 'EVENT', 'GALLERY']);

export function isComingSoonTemplate(id) {
  return COMING_SOON_TEMPLATES.has(String(id || '').toUpperCase());
}

export const TEMPLATE_DEFAULTS = {
  URL: { url: '' },
  TEXT: {
    text: '',
    headline: '',
    subheadline: '',
    accentColor: '#6366f1',
    backgroundImage: '',
    ctaLabel: '',
    ctaUrl: '',
    secondaryCtaLabel: '',
    secondaryCtaUrl: '',
    highlightText: '',
    bulletPoints: ''
  },
  Phone: { phone: '' },
  SMS: { to: '', body: '' },
  Email: { to: '', subject: '', body: '' },
  Whatsapp: { phone: '', text: '' },
  Facetime: { target: '' },
  Location: { lat: '', lng: '', query: '' },
  WiFi: { ssid: '', password: '', auth: 'WPA', hidden: false, venue: '', notes: '' },
  Event: {
    summary: '',
    start: '',
    end: '',
    location: '',
    description: '',
    timezone: '',
    heroImage: '',
    ctaLabel: '',
    ctaUrl: '',
    agenda: '',
    mapUrl: '',
    dressCode: ''
  },
  Vcard: {
    first: '',
    last: '',
    title: '',
    org: '',
    email: '',
    phone: '',
    address: '',
    url: '',
    avatarUrl: '',
    pronouns: '',
    bio: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: ''
  },
  PDF: {
    fileUrl: '',
    fileName: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#2563eb',
    title: '',
    description: '',
    version: '',
    updatedAt: '',
    fileSize: '',
    thumbnailUrl: '',
    tags: '',
    notes: '',
    openInline: true
  },
  MP3: {
    fileUrl: '',
    fileName: '',
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    title: '',
    artist: '',
    album: '',
    coverUrl: '',
    heroImage: '',
    description: '',
    streamingLinks: '',
    moreTracks: '',
    autoplay: false,
    loop: false,
    showQueue: true,
    enableMiniPlayer: true
  },
  AppLink: {
    headline: '',
    subheadline: '',
    iosUrl: '',
    androidUrl: '',
    macUrl: '',
    windowsUrl: '',
    fallbackUrl: '',
    accentColor: '#2563eb',
    backgroundImage: '',
    features: '',
    storeBadges: ''
  },
  LinkTree: {
    heroTitle: '',
    heroSubtitle: '',
    intro: '',
    primaryCtaLabel: '',
    primaryCtaUrl: '',
    secondaryLinks: '',
    accentColor: '#6366f1',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    backgroundImage: '',
    shareTitle: '',
    shareDescription: '',
    shareImage: '',
    showShareActions: true,
    enableCopyAll: false,
    buttonStyle: 'rounded'
  },
  Gallery: {
    title: '',
    intro: '',
    featuredImage: '',
    highlightCategory: '',
    items: '',
    ctaLabel: '',
    ctaUrl: ''
  },
  Voucher: { code: '', description: '', expiry: '' },
  Crypto: { symbol: 'BTC', address: '', amount: '' },
  PayPal: { username: '', amount: '' },
  'UPI Payment': { vpa: '', name: '', amount: '' },
  'EPC Payment': { bic: '', name: '', iban: '', amount: '', remittance: '' },
  'PIX Payment': { payload: '' }
};

export const normalizeUrl = (u) => /^https?:\/\//i.test(u || '') ? (u || '').trim() : (u ? `https://${u.trim()}` : '');

function getTemplateMeta(templateId) {
  const upperId = String(templateId || '').toUpperCase();
  return TEMPLATE_LIBRARY.find(item => item.id.toUpperCase() === upperId) || null;
}

const toICSDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('T')) {
    const [datePart, timePart = ''] = value.split('T');
    const dateClean = (datePart || '').replace(/-/g, '');
    const timeClean = (timePart || '').replace(/:/g, '').replace(/\.\d+/, '');
    if (!dateClean) return value;
    if (!timeClean) return dateClean;
    const padded = (timeClean + '000000').slice(0, 6);
    return `${dateClean}T${padded}`;
  }
  return value;
};

export function buildPayload(type, v = {}) {
  switch (type) {
    case 'TEXT':
      return v.text || '';
    case 'URL':
      return normalizeUrl(v.url || '');
    case 'Phone':
      return v.phone ? `tel:${v.phone}` : '';
    case 'SMS': {
      const to = v.to || '';
      const body = v.body || '';
      return body ? `SMSTO:${to}:${body}` : `SMSTO:${to}`;
    }
    case 'Email': {
      const to = v.to || '';
      const subject = v.subject || '';
      const body = v.body || '';
      if (subject || body) {
        return `MATMSG:TO:${to};SUB:${subject};BODY:${body};;`;
      }
      return `mailto:${to}`;
    }
    case 'Whatsapp': {
      const phone = v.phone || '';
      const text = v.text ? `?text=${encodeURIComponent(v.text)}` : '';
      return phone ? `https://wa.me/${phone}${text}` : '';
    }
    case 'Facetime':
      return v.target ? `facetime:${v.target}` : '';
    case 'Location': {
      if (v.lat && v.lng) return `geo:${v.lat},${v.lng}`;
      if (v.query) return `geo:0,0?q=${encodeURIComponent(v.query)}`;
      return '';
    }
    case 'WiFi': {
      const auth = v.auth || 'WPA';
      const hidden = v.hidden ? 'H:true;' : '';
      return `WIFI:T:${auth};S:${v.ssid || ''};P:${v.password || ''};${hidden};`;
    }
    case 'Event': {
      const { start = '', end = '', summary = '', location = '', description = '' } = v;
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${summary}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT'
      ].join('\n');
    }
    case 'Vcard': {
      const { last = '', first = '', email = '', phone = '', org = '', title = '', address = '', url = '' } = v;
      const fullName = [first, last].filter(Boolean).join(' ') || first || last || ' ';
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${last};${first}`,
        `FN:${fullName}`,
        `ORG:${org}`,
        `TITLE:${title}`,
        `EMAIL:${email}`,
        `TEL:${phone}`,
        `ADR:${address}`,
        `URL:${url}`,
        'END:VCARD'
      ].join('\n');
    }
    case 'PDF':
      return v.fileUrl ? normalizeUrl(v.fileUrl) : '';
    case 'MP3':
      return v.fileUrl ? normalizeUrl(v.fileUrl) : '';
    case 'Voucher': {
      const { code = '', description = '', expiry = '' } = v;
      return `Voucher Code: ${code}\nDescription: ${description}\nExpires: ${expiry}`;
    }
    case 'Crypto': {
      const scheme = (v.symbol || 'BTC').toLowerCase();
      const addr = v.address || '';
      const amt = v.amount ? `?amount=${v.amount}` : '';
      return `${scheme}:${addr}${amt}`;
    }
    case 'PayPal': {
      if (v.username && v.amount) return `https://paypal.me/${v.username}/${v.amount}`;
      if (v.username) return `https://paypal.me/${v.username}`;
      return '';
    }
    case 'UPI Payment': {
      const params = new URLSearchParams();
      if (v.vpa) params.set('pa', v.vpa);
      if (v.name) params.set('pn', v.name);
      if (v.amount) params.set('am', v.amount);
      params.set('cu', 'INR');
      return `upi://pay?${params.toString()}`;
    }
    case 'EPC Payment': {
      const lines = [
        'BCD',
        '001',
        '1',
        'SCT',
        v.bic || '',
        v.name || '',
        v.iban || '',
        v.amount ? String(v.amount) : '',
        '',
        v.remittance || ''
      ];
      return lines.join('\n');
    }
    case 'PIX Payment':
      return v.payload || '';
    case 'AppLink':
      return normalizeUrl(v.fallbackUrl || v.iosUrl || v.androidUrl || v.windowsUrl || v.macUrl || '');
    case 'Gallery':
      return normalizeUrl(v.ctaUrl || '');
    case 'LinkTree': {
      if (v.primaryCtaUrl) return normalizeUrl(v.primaryCtaUrl);
      const firstLink = (v.secondaryLinks || '').split('\n').map(line => line.split('|')[1]).find(Boolean);
      return normalizeUrl(firstLink || '');
    }
    default:
      return '';
  }
}

function ComingSoonNotice({ templateName, description }) {
  return (
    <div
      className="coming-soon-notice"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        padding: '28px 24px',
        borderRadius: 18,
        border: '1px dashed #cbd5f5',
        background: 'linear-gradient(135deg, rgba(241,245,249,0.9), rgba(226,232,240,0.6))'
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb' }}>In progress</span>
      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
        {templateName} is coming soon
      </h3>
      {description ? (
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#475569' }}>
          {description}
        </p>
      ) : null}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#64748b' }}>
        We’re polishing the experience for this template. Check back shortly or pick another QR type in the meantime.
      </p>
    </div>
  );
}

function SectionAccordion({ title, description, children, defaultOpen = false }) {
  return (
    <details className="template-section" open={defaultOpen}>
      <summary>
        <div className="template-section-copy">
          <span>{title}</span>
          {description ? <p>{description}</p> : null}
        </div>
      </summary>
      <div className="template-section-body">
        {children}
      </div>
    </details>
  );
}

function normalizeColorHex(input, fallback) {
  if (!input) return fallback;
  let value = input.trim();
  if (!value.startsWith('#')) value = `#${value}`;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    value = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  return fallback;
}

function ColorFieldInput({ value, onChange }) {
  const fallback = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2563eb';
  const [textValue, setTextValue] = useState(fallback);

  useEffect(() => {
    const normalized = normalizeColorHex(value, fallback);
    setTextValue(normalized);
  }, [value]);

  const handleColorChange = (e) => {
    const next = normalizeColorHex(e.target.value, fallback);
    setTextValue(next);
    onChange(next);
  };

  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  };

  const commitTextValue = () => {
    const normalized = normalizeColorHex(textValue, fallback);
    setTextValue(normalized);
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        border: '1px solid #d0d8e5',
        borderRadius: 12,
        background: '#f8fafc'
      }}
    >
      <div style={{ position: 'relative' }}>
        <input
          type="color"
          value={normalizeColorHex(textValue, fallback)}
          onChange={handleColorChange}
          style={{
            width: 40,
            height: 40,
            border: 'none',
            borderRadius: 12,
            padding: 0,
            background: 'transparent',
            cursor: 'pointer'
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            boxShadow: '0 0 0 1px rgba(15,23,42,0.08)'
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 auto' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>Hex</span>
        <input
          value={textValue}
          onChange={handleTextChange}
          onBlur={commitTextValue}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitTextValue(); } }}
          placeholder="#2563EB"
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #cbd5f5',
            background: '#ffffff',
            color: '#0f172a'
          }}
        />
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field" style={{ marginTop: 8 }}>
      <div className="field-row"><label>{label}</label></div>
      {hint ? (
        <div
          className="field-hint"
          style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}
        >
          {hint}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function multilineTextarea(value, onChange, placeholder) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      style={{ resize: 'vertical' }}
    />
  );
}

function SchemaField({ field, values, onChange, setUploading }) {
  const valueKey = field.valueKey || field.id;
  const fileNameKey = field.fileNameKey;
  const rawValue = values?.[valueKey];
  const defaultValue = field.defaultValue;
  const resolvedValue = rawValue !== undefined ? rawValue : defaultValue;

  switch (field.type) {
    case 'file': {
      const accept = field.accept || '*/*';
      const maxSize = field.maxSize || 10 * 1024 * 1024;
      const currentFile = resolvedValue || '';
      const fileName = fileNameKey ? values?.[fileNameKey] : undefined;
      return (
        <Field label={field.label} hint={field.hint}>
          <FileUpload
            accept={accept}
            maxSize={maxSize}
            currentFile={currentFile}
            fileName={fileName}
            onUpload={async (file) => {
              setUploading(true);
              const formData = new FormData();
              formData.append('file', file);
              try {
                const response = await fetch(`${API}/qr/upload`, withAuth({
                  method: 'POST',
                  body: formData
                }));
                const result = await response.json();
                if (result.url) {
                  onChange(valueKey, result.url);
                  if (fileNameKey) {
                    onChange(fileNameKey, result.originalName || file.name || '');
                  }
                } else {
                  console.error('Upload failed:', result.error);
                }
              } catch (error) {
                console.error('Upload failed:', error);
              } finally {
                setUploading(false);
              }
            }}
            onRemove={() => {
              onChange(valueKey, '');
              if (fileNameKey) onChange(fileNameKey, '');
            }}
          />
        </Field>
      );
    }
    case 'textarea': {
      return (
        <Field label={field.label} hint={field.hint}>
          {multilineTextarea(resolvedValue || '', e => onChange(valueKey, e.target.value), field.placeholder)}
        </Field>
      );
    }
    case 'color': {
      return (
        <Field label={field.label} hint={field.hint}>
          <ColorFieldInput
            value={resolvedValue || field.defaultValue || '#2563eb'}
            onChange={next => onChange(valueKey, next)}
          />
        </Field>
      );
    }
    case 'checkbox': {
      const checked = resolvedValue !== undefined ? Boolean(resolvedValue) : Boolean(defaultValue);
      return (
        <Field label={field.label} hint={field.hint}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(valueKey, e.target.checked)}
            aria-label={field.label}
            style={{ marginTop: 4, transform: 'scale(1.1)' }}
          />
        </Field>
      );
    }
    case 'text':
    default: {
      return (
        <Field label={field.label} hint={field.hint}>
          <input
            value={resolvedValue || ''}
            onChange={e => onChange(valueKey, e.target.value)}
            placeholder={field.placeholder}
          />
        </Field>
      );
    }
  }
}

function SchemaDrivenTemplateForm({ schema, values, onChange, setUploading }) {
  const groupedFields = useMemo(() => {
    const acc = {};
    TEMPLATE_SECTION_ORDER.forEach(section => {
      acc[section] = [];
    });
    (schema.fields || []).forEach(field => {
      const baseSection = field.section || 'content';
      const targetSection = field.advanced || baseSection === 'advanced' ? 'advanced' : baseSection;
      const entry = { ...field, __origin: baseSection };
      if (!acc[targetSection]) {
        acc[targetSection] = [];
      }
      acc[targetSection].push(entry);
    });
    return acc;
  }, [schema.fields]);

  return (
    <div className="template-schema-form">
      {TEMPLATE_SECTION_ORDER.map(sectionId => {
        const fields = groupedFields[sectionId] || [];
        if (!fields.length) return null;
        const title = TEMPLATE_SECTION_TITLES[sectionId] || sectionId;
        const defaultOpen = sectionId === 'content';
        return (
          <SectionAccordion
            key={sectionId}
            title={title}
            defaultOpen={defaultOpen}
            description={sectionId === 'advanced' ? 'Power options for fine-tuning this template.' : undefined}
          >
            {fields.map(field => (
              <SchemaField
                key={field.id}
                field={field}
                values={values}
                onChange={onChange}
                setUploading={setUploading}
              />
            ))}
          </SectionAccordion>
        );
      })}
    </div>
  );
}

export function TemplateDataForm({ type, values, onChange }) {
  const [, setUploading] = useState(false);
  const meta = useMemo(() => getTemplateMeta(type), [type]);
  const comingSoon = isComingSoonTemplate(type);

  if (comingSoon) {
    return (
      <ComingSoonNotice
        templateName={meta?.title || type || 'Template'}
        description={meta?.description}
      />
    );
  }

  const schema = TEMPLATE_SCHEMAS[type];
  if (schema) {
    return (
      <SchemaDrivenTemplateForm
        schema={schema}
        values={values}
        onChange={onChange}
        setUploading={setUploading}
      />
    );
  }



  switch (type) {
    case 'URL':
      return (
        <SectionAccordion title="Link destination" defaultOpen>
          <Field label="URL">
            <input value={values.url || ''} onChange={e => onChange('url', e.target.value)} placeholder="https://example.com" />
          </Field>
        </SectionAccordion>
      );
    case 'TEXT':
      return (
        <>
          <SectionAccordion title="Content" defaultOpen>
            <Field label="Headline">
              <input value={values.headline || ''} onChange={e => onChange('headline', e.target.value)} placeholder="Share your headline" />
            </Field>
            <Field label="Subheadline">
              <input value={values.subheadline || ''} onChange={e => onChange('subheadline', e.target.value)} placeholder="Optional supporting copy" />
            </Field>
            <Field label="Highlight text">
              <input value={values.highlightText || ''} onChange={e => onChange('highlightText', e.target.value)} placeholder="Key stat or short punchline" />
            </Field>
            <Field label="Body">
              {multilineTextarea(values.text || '', e => onChange('text', e.target.value), 'Write announcements, offers, or rich descriptions')}
            </Field>
            <Field label="Bullet points (one per line)">
              {multilineTextarea(values.bulletPoints || '', e => onChange('bulletPoints', e.target.value), 'Feature one\nFeature two\nFeature three')}
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Actions">
            <Field label="Primary button label">
              <input value={values.ctaLabel || ''} onChange={e => onChange('ctaLabel', e.target.value)} placeholder="Get started" />
            </Field>
            <Field label="Primary button link">
              <input value={values.ctaUrl || ''} onChange={e => onChange('ctaUrl', e.target.value)} placeholder="https://example.com/signup" />
            </Field>
            <Field label="Secondary link label">
              <input value={values.secondaryCtaLabel || ''} onChange={e => onChange('secondaryCtaLabel', e.target.value)} placeholder="View pricing" />
            </Field>
            <Field label="Secondary link URL">
              <input value={values.secondaryCtaUrl || ''} onChange={e => onChange('secondaryCtaUrl', e.target.value)} placeholder="https://example.com/pricing" />
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Design">
            <Field label="Accent color">
              <ColorFieldInput
                value={values.accentColor || '#6366f1'}
                onChange={next => onChange('accentColor', next)}
              />
            </Field>
            <Field label="Background image URL">
              <input value={values.backgroundImage || ''} onChange={e => onChange('backgroundImage', e.target.value)} placeholder="https://.../hero.jpg" />
            </Field>
          </SectionAccordion>
        </>
      );
    case 'Phone':
      return (
        <Field label="Phone number">
          <input value={values.phone || ''} onChange={e => onChange('phone', e.target.value)} placeholder="+1 555 123 4567" />
        </Field>
      );
    case 'SMS':
      return (
        <>
          <Field label="To">
            <input value={values.to || ''} onChange={e => onChange('to', e.target.value)} placeholder="+1 555 123 4567" />
          </Field>
          <Field label="Draft message">
            {multilineTextarea(values.body || '', e => onChange('body', e.target.value), 'Hey! I found you via QR...')}
          </Field>
        </>
      );
    case 'Email':
      return (
        <>
          <Field label="To">
            <input value={values.to || ''} onChange={e => onChange('to', e.target.value)} placeholder="user@example.com" />
          </Field>
          <Field label="Subject">
            <input value={values.subject || ''} onChange={e => onChange('subject', e.target.value)} placeholder="Subject" />
          </Field>
          <Field label="Body">
            {multilineTextarea(values.body || '', e => onChange('body', e.target.value), 'Message body')}
          </Field>
        </>
      );
    case 'Whatsapp':
      return (
        <>
          <Field label="Phone">
            <input value={values.phone || ''} onChange={e => onChange('phone', e.target.value)} placeholder="+1 555 123 4567" />
          </Field>
          <Field label="Message">
            {multilineTextarea(values.text || '', e => onChange('text', e.target.value), 'Message users see in WhatsApp')}
          </Field>
        </>
      );
    case 'Facetime':
      return (
        <Field label="FaceTime target">
          <input value={values.target || ''} onChange={e => onChange('target', e.target.value)} placeholder="user@example.com or phone" />
        </Field>
      );
    case 'Location':
      return (
        <>
          <Field label="Latitude">
            <input value={values.lat || ''} onChange={e => onChange('lat', e.target.value)} placeholder="40.7128" />
          </Field>
          <Field label="Longitude">
            <input value={values.lng || ''} onChange={e => onChange('lng', e.target.value)} placeholder="-74.0060" />
          </Field>
          <Field label="Maps search (optional)">
            <input value={values.query || ''} onChange={e => onChange('query', e.target.value)} placeholder="Times Square, NYC" />
          </Field>
          <div className="small" style={{ marginTop: 4, color: '#475569' }}>
            Provide either coordinates or a search query.
          </div>
        </>
      );
    case 'WiFi':
      return (
        <>
          <SectionAccordion title="Network details" defaultOpen>
            <Field label="SSID">
              <input value={values.ssid || ''} onChange={e => onChange('ssid', e.target.value)} placeholder="Network name" />
            </Field>
            <Field label="Password">
              <input value={values.password || ''} onChange={e => onChange('password', e.target.value)} placeholder="Password" />
            </Field>
            <Field label="Authentication">
              <select value={values.auth || 'WPA'} onChange={e => onChange('auth', e.target.value)}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open network</option>
              </select>
            </Field>
            <label className="row" style={{ marginTop: 8, alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!values.hidden} onChange={e => onChange('hidden', e.target.checked)} />
              <span>Hidden network</span>
            </label>
          </SectionAccordion>
          <SectionAccordion title="Guest guidance">
            <Field label="Venue or location (optional)">
              <input value={values.venue || ''} onChange={e => onChange('venue', e.target.value)} placeholder="Lobby, Conference room B..." />
            </Field>
            <Field label="Extra notes for guests">
              {multilineTextarea(values.notes || '', e => onChange('notes', e.target.value), 'Share hours, limits, or friendly reminders')}
            </Field>
          </SectionAccordion>
        </>
      );
    case 'Event':
      return (
        <>
          <SectionAccordion title="Event details" defaultOpen>
            <Field label="Event title">
              <input value={values.summary || ''} onChange={e => onChange('summary', e.target.value)} placeholder="Event name" />
            </Field>
            <Field label="Timezone">
              <input value={values.timezone || ''} onChange={e => onChange('timezone', e.target.value)} placeholder="e.g. PST, GMT+1" />
            </Field>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <Field label="Starts at">
                <input type="datetime-local" value={values.start || ''} onChange={e => onChange('start', e.target.value)} />
              </Field>
              <Field label="Ends at">
                <input type="datetime-local" value={values.end || ''} onChange={e => onChange('end', e.target.value)} />
              </Field>
            </div>
            <Field label="Location">
              <input value={values.location || ''} onChange={e => onChange('location', e.target.value)} placeholder="Venue or link" />
            </Field>
            <Field label="Description">
              {multilineTextarea(values.description || '', e => onChange('description', e.target.value), 'Agenda, notes, dress code...')}
            </Field>
            <Field label="Dress code or reminders">
              <input value={values.dressCode || ''} onChange={e => onChange('dressCode', e.target.value)} placeholder="Business casual" />
            </Field>
            <Field label="Agenda items (one per line)">
              {multilineTextarea(values.agenda || '', e => onChange('agenda', e.target.value), '10:00 - Registration\n10:30 - Keynote\n12:00 - Lunch')}
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Media & embeds">
            <Field label="Hero image URL">
              <input value={values.heroImage || ''} onChange={e => onChange('heroImage', e.target.value)} placeholder="https://.../hero.jpg" />
            </Field>
            <Field label="Map embed or image URL">
              <input value={values.mapUrl || ''} onChange={e => onChange('mapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Actions">
            <Field label="Primary CTA label">
              <input value={values.ctaLabel || ''} onChange={e => onChange('ctaLabel', e.target.value)} placeholder="RSVP now" />
            </Field>
            <Field label="Primary CTA link">
              <input value={values.ctaUrl || ''} onChange={e => onChange('ctaUrl', e.target.value)} placeholder="https://example.com/rsvp" />
            </Field>
          </SectionAccordion>
        </>
      );
    case 'Vcard':
      return (
        <>
          <Field label="First name">
            <input value={values.first || ''} onChange={e => onChange('first', e.target.value)} />
          </Field>
          <Field label="Last name">
            <input value={values.last || ''} onChange={e => onChange('last', e.target.value)} />
          </Field>
          <Field label="Title / Role">
            <input value={values.title || ''} onChange={e => onChange('title', e.target.value)} placeholder="Marketing Director" />
          </Field>
          <Field label="Company">
            <input value={values.org || ''} onChange={e => onChange('org', e.target.value)} placeholder="Company name" />
          </Field>
          <Field label="Phone">
            <input value={values.phone || ''} onChange={e => onChange('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={values.email || ''} onChange={e => onChange('email', e.target.value)} />
          </Field>
          <Field label="Address">
            {multilineTextarea(values.address || '', e => onChange('address', e.target.value), '123 Main St; City; State; ZIP; Country')}
          </Field>
          <Field label="Website">
            <input value={values.url || ''} onChange={e => onChange('url', e.target.value)} placeholder="https://example.com" />
          </Field>
          <Field label="Avatar image URL">
            <input value={values.avatarUrl || ''} onChange={e => onChange('avatarUrl', e.target.value)} placeholder="https://.../headshot.jpg" />
          </Field>
          <Field label="Pronouns">
            <input value={values.pronouns || ''} onChange={e => onChange('pronouns', e.target.value)} placeholder="she/her" />
          </Field>
          <Field label="Short bio">
            {multilineTextarea(values.bio || '', e => onChange('bio', e.target.value), 'Share what you do, areas of expertise, or a friendly welcome')}
          </Field>
          <Field label="LinkedIn URL">
            <input value={values.linkedin || ''} onChange={e => onChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username" />
          </Field>
          <Field label="Twitter / X URL">
            <input value={values.twitter || ''} onChange={e => onChange('twitter', e.target.value)} placeholder="https://x.com/username" />
          </Field>
          <Field label="Instagram URL">
            <input value={values.instagram || ''} onChange={e => onChange('instagram', e.target.value)} placeholder="https://instagram.com/username" />
          </Field>
          <Field label="Facebook URL">
            <input value={values.facebook || ''} onChange={e => onChange('facebook', e.target.value)} placeholder="https://facebook.com/username" />
          </Field>
        </>
      );
    case 'AppLink':
      return (
        <>
          <SectionAccordion title="Narrative" defaultOpen>
            <Field label="Headline">
              <input value={values.headline || ''} onChange={e => onChange('headline', e.target.value)} placeholder="Your app, everywhere" />
            </Field>
            <Field label="Subheadline">
              <input value={values.subheadline || ''} onChange={e => onChange('subheadline', e.target.value)} placeholder="Explain what scanners unlock after installing." />
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Store links">
            <Field label="iOS App Store link">
              <input value={values.iosUrl || ''} onChange={e => onChange('iosUrl', e.target.value)} placeholder="https://apps.apple.com/..." />
            </Field>
            <Field label="Google Play link">
              <input value={values.androidUrl || ''} onChange={e => onChange('androidUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." />
            </Field>
            <Field label="Mac App Store link (optional)">
              <input value={values.macUrl || ''} onChange={e => onChange('macUrl', e.target.value)} placeholder="https://apps.apple.com/app/id..." />
            </Field>
            <Field label="Windows / Web fallback link">
              <input value={values.windowsUrl || ''} onChange={e => onChange('windowsUrl', e.target.value)} placeholder="https://example.com/download" />
            </Field>
            <Field label="Fallback web URL">
              <input value={values.fallbackUrl || ''} onChange={e => onChange('fallbackUrl', e.target.value)} placeholder="https://example.com" />
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Design">
            <Field label="Accent color">
              <ColorFieldInput
                value={values.accentColor || '#2563eb'}
                onChange={next => onChange('accentColor', next)}
              />
            </Field>
            <Field label="Background image URL">
              <input value={values.backgroundImage || ''} onChange={e => onChange('backgroundImage', e.target.value)} placeholder="https://.../screenshot.jpg" />
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Highlights">
            <Field label="Feature highlights (one per line)">
              {multilineTextarea(values.features || '', e => onChange('features', e.target.value), 'One tap check-in\nSmart notifications\nOffline access')}
            </Field>
            <Field label="Store badges (one per line: label|url)">
              {multilineTextarea(values.storeBadges || '', e => onChange('storeBadges', e.target.value), 'App Store|https://apps.apple.com/...\nGoogle Play|https://play.google.com/...')}
            </Field>
          </SectionAccordion>
        </>
      );
    case 'Gallery':
      return (
        <>
          <SectionAccordion title="Content" defaultOpen>
            <Field label="Gallery title">
              <input value={values.title || ''} onChange={e => onChange('title', e.target.value)} placeholder="Seasonal menu" />
            </Field>
            <Field label="Intro copy">
              {multilineTextarea(values.intro || '', e => onChange('intro', e.target.value), 'Describe your collection or welcome note.')}
            </Field>
            <Field label="Highlight category">
              <input value={values.highlightCategory || ''} onChange={e => onChange('highlightCategory', e.target.value)} placeholder="Chef specials" />
            </Field>
            <Field label="Items (one per line: category|title|description|price|imageUrl)">
              {multilineTextarea(values.items || '', e => onChange('items', e.target.value), 'Brunch|Avocado Toast|Sourdough, heirloom tomato, feta|$12|https://.../toast.jpg')}
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Design">
            <Field label="Featured image URL">
              <input value={values.featuredImage || ''} onChange={e => onChange('featuredImage', e.target.value)} placeholder="https://.../hero.jpg" />
            </Field>
          </SectionAccordion>
          <SectionAccordion title="Actions">
            <Field label="Call-to-action label">
              <input value={values.ctaLabel || ''} onChange={e => onChange('ctaLabel', e.target.value)} placeholder="Order online" />
            </Field>
            <Field label="Call-to-action link">
              <input value={values.ctaUrl || ''} onChange={e => onChange('ctaUrl', e.target.value)} placeholder="https://example.com/order" />
            </Field>
          </SectionAccordion>
        </>
      );
    case 'Voucher':
      return (
        <>
          <Field label="Voucher Code">
            <input value={values.code || ''} onChange={e => onChange('code', e.target.value)} placeholder="SUMMER2024" />
          </Field>
          <Field label="Description">
            {multilineTextarea(values.description || '', e => onChange('description', e.target.value), '20% off your next purchase')}
          </Field>
          <Field label="Expiry Date">
            <input type="date" value={values.expiry || ''} onChange={e => onChange('expiry', e.target.value)} />
          </Field>
        </>
      );
    case 'Crypto':
      return (
        <>
          <Field label="Symbol">
            <input value={values.symbol || 'BTC'} onChange={e => onChange('symbol', e.target.value)} placeholder="BTC" />
          </Field>
          <Field label="Wallet address">
            <input value={values.address || ''} onChange={e => onChange('address', e.target.value)} placeholder="Wallet address" />
          </Field>
          <Field label="Amount (optional)">
            <input value={values.amount || ''} onChange={e => onChange('amount', e.target.value)} placeholder="0.025" />
          </Field>
        </>
      );
    case 'PayPal':
      return (
        <>
          <Field label="PayPal username">
            <input value={values.username || ''} onChange={e => onChange('username', e.target.value)} placeholder="yourbusiness" />
          </Field>
          <Field label="Amount (optional)">
            <input value={values.amount || ''} onChange={e => onChange('amount', e.target.value)} placeholder="19.99" />
          </Field>
        </>
      );
    case 'UPI Payment':
      return (
        <>
          <Field label="Virtual Payment Address">
            <input value={values.vpa || ''} onChange={e => onChange('vpa', e.target.value)} placeholder="merchant@upi" />
          </Field>
          <Field label="Payee name">
            <input value={values.name || ''} onChange={e => onChange('name', e.target.value)} placeholder="Your business" />
          </Field>
          <Field label="Amount (optional)">
            <input value={values.amount || ''} onChange={e => onChange('amount', e.target.value)} placeholder="399.00" />
          </Field>
        </>
      );
    case 'EPC Payment':
      return (
        <>
          <Field label="BIC">
            <input value={values.bic || ''} onChange={e => onChange('bic', e.target.value)} placeholder="BANKDEFFXXX" />
          </Field>
          <Field label="Account holder">
            <input value={values.name || ''} onChange={e => onChange('name', e.target.value)} placeholder="ACME GmbH" />
          </Field>
          <Field label="IBAN">
            <input value={values.iban || ''} onChange={e => onChange('iban', e.target.value)} placeholder="DE89370400440532013000" />
          </Field>
          <Field label="Amount EUR (optional)">
            <input value={values.amount || ''} onChange={e => onChange('amount', e.target.value)} placeholder="120.00" />
          </Field>
          <Field label="Reference / Remittance info">
            <input value={values.remittance || ''} onChange={e => onChange('remittance', e.target.value)} placeholder="Invoice 12345" />
          </Field>
        </>
      );
    case 'PIX Payment':
      return (
        <Field label="PIX payload">
          {multilineTextarea(values.payload || '', e => onChange('payload', e.target.value), 'PIX payload string')}
        </Field>
      );
    default:
      return (
        <div style={{ color: '#6b7280', marginTop: 8 }}>
          Form coming soon for “{type}”.
        </div>
      );
  }
}
