import React, { useState } from 'react';
import { API, withAuth } from '../api';
import FileUpload from './FileUpload';

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
    id: 'Phone',
    title: 'Phone call',
    description: 'Dial a number instantly after scanning.',
    icon: 'phone',
    category: 'contact',
    accent: '#ef4444',
    accentSoft: 'rgba(239, 68, 68, 0.18)'
  },
  {
    id: 'SMS',
    title: 'SMS message',
    description: 'Prefill a text message to your team or hotline.',
    icon: 'message',
    category: 'contact',
    accent: '#00a884',
    accentSoft: 'rgba(0, 168, 132, 0.18)'
  },
  {
    id: 'Email',
    title: 'Email draft',
    description: 'Open a composed email with subject and body.',
    icon: 'envelope',
    category: 'contact',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.16)'
  },
  {
    id: 'Whatsapp',
    title: 'WhatsApp chat',
    description: 'Start a WhatsApp conversation instantly.',
    icon: 'message',
    category: 'contact',
    accent: '#25d366',
    accentSoft: 'rgba(37, 211, 102, 0.18)'
  },
  {
    id: 'Facetime',
    title: 'FaceTime call',
    description: 'Launch a FaceTime call or video session.',
    icon: 'video',
    category: 'contact',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.18)'
  },
  {
    id: 'Location',
    title: 'Map location',
    description: 'Open maps with directions to your venue.',
    icon: 'map',
    category: 'events',
    accent: '#0ea5e9',
    accentSoft: 'rgba(14, 165, 233, 0.12)'
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
    id: 'Vcard',
    title: 'Digital business card',
    description: 'Save your contact details to their phone.',
    icon: 'id',
    category: 'contact',
    accent: '#8b5cf6',
    accentSoft: 'rgba(139, 92, 246, 0.18)'
  },
  {
    id: 'PDF',
    title: 'PDF Document',
    description: 'Link to a PDF file for download or view.',
    icon: 'file',
    category: 'content',
    accent: '#dc2626',
    accentSoft: 'rgba(220, 38, 38, 0.18)'
  },
  {
    id: 'MP3',
    title: 'Audio File',
    description: 'Link to an MP3 or audio file.',
    icon: 'audio',
    category: 'content',
    accent: '#7c3aed',
    accentSoft: 'rgba(124, 58, 237, 0.16)'
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
    id: 'Gallery',
    title: 'Gallery or menu',
    description: 'Showcase dishes, projects, or products beautifully.',
    icon: 'image',
    category: 'content',
    accent: '#ec4899',
    accentSoft: 'rgba(236, 72, 153, 0.18)'
  },
  {
    id: 'Voucher',
    title: 'Discount Voucher',
    description: 'Share a promo code or voucher details.',
    icon: 'ticket',
    category: 'content',
    accent: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.18)'
  },
  {
    id: 'Crypto',
    title: 'Crypto payment',
    description: 'Request BTC, ETH, or other crypto payments.',
    icon: 'crypto',
    category: 'payments',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.2)'
  },
  {
    id: 'PayPal',
    title: 'PayPal checkout',
    description: 'Send users to your PayPal.me payment link.',
    icon: 'wallet',
    category: 'payments',
    accent: '#1070d1',
    accentSoft: 'rgba(16, 112, 209, 0.18)'
  },
  {
    id: 'UPI Payment',
    title: 'UPI payment',
    description: 'Collect INR payments via UPI apps.',
    icon: 'upi',
    category: 'payments',
    accent: '#0f766e',
    accentSoft: 'rgba(15, 118, 110, 0.2)'
  },
  {
    id: 'EPC Payment',
    title: 'SEPA transfer',
    description: 'Generate a single euro payments area QR.',
    icon: 'bank',
    category: 'payments',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.14)'
  },
  {
    id: 'PIX Payment',
    title: 'PIX payment',
    description: 'Request instant payments via PIX (Brazil).',
    icon: 'pix',
    category: 'payments',
    accent: '#22d3ee',
    accentSoft: 'rgba(34, 211, 238, 0.18)'
  }
];

export const TEMPLATE_CATEGORIES = [
  { id: 'links', label: 'Links & social' },
  { id: 'content', label: 'Content & info' },
  { id: 'contact', label: 'Contact & messaging' },
  { id: 'events', label: 'Events & access' },
  { id: 'payments', label: 'Payments & checkout' }
];

export const TEMPLATE_LIBRARY_MAP = Object.fromEntries(TEMPLATE_LIBRARY.map(item => [item.id, item]));

export const TEMPLATES = TEMPLATE_LIBRARY.map(item => item.id);

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
    notes: ''
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
    moreTracks: ''
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
    default:
      return '';
  }
}

function Field({ label, children }) {
  return (
    <div className="field" style={{ marginTop: 8 }}>
      <div className="field-row"><label>{label}</label></div>
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

export function TemplateDataForm({ type, values, onChange }) {
  const [uploading, setUploading] = useState(false);



  switch (type) {
    case 'URL':
      return (
        <Field label="URL">
          <input value={values.url || ''} onChange={e => onChange('url', e.target.value)} placeholder="https:// or facebook.com" />
        </Field>
      );
    case 'TEXT':
      return (
        <>
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
          <Field label="Accent color">
            <input type="color" value={values.accentColor || '#6366f1'} onChange={e => onChange('accentColor', e.target.value)} />
          </Field>
          <Field label="Background image URL">
            <input value={values.backgroundImage || ''} onChange={e => onChange('backgroundImage', e.target.value)} placeholder="https://.../hero.jpg" />
          </Field>
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
          <label className="row" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={!!values.hidden} onChange={e => onChange('hidden', e.target.checked)} />
            <span style={{ marginLeft: 6 }}>Hidden network</span>
          </label>
          <Field label="Venue or location (optional)">
            <input value={values.venue || ''} onChange={e => onChange('venue', e.target.value)} placeholder="Lobby, Conference room B..." />
          </Field>
          <Field label="Extra notes for guests">
            {multilineTextarea(values.notes || '', e => onChange('notes', e.target.value), 'Share hours, limits, or friendly reminders')}
          </Field>
        </>
      );
    case 'Event':
      return (
        <>
          <Field label="Event title">
            <input value={values.summary || ''} onChange={e => onChange('summary', e.target.value)} placeholder="Event name" />
          </Field>
          <Field label="Timezone">
            <input value={values.timezone || ''} onChange={e => onChange('timezone', e.target.value)} placeholder="e.g. PST, GMT+1" />
          </Field>
          <Field label="Starts at">
            <input type="datetime-local" value={values.start || ''} onChange={e => onChange('start', e.target.value)} />
          </Field>
          <Field label="Ends at">
            <input type="datetime-local" value={values.end || ''} onChange={e => onChange('end', e.target.value)} />
          </Field>
          <Field label="Location">
            <input value={values.location || ''} onChange={e => onChange('location', e.target.value)} placeholder="Venue or link" />
          </Field>
          <Field label="Description">
            {multilineTextarea(values.description || '', e => onChange('description', e.target.value), 'Agenda, notes, dress code...')}
          </Field>
          <Field label="Hero image URL">
            <input value={values.heroImage || ''} onChange={e => onChange('heroImage', e.target.value)} placeholder="https://.../hero.jpg" />
          </Field>
          <Field label="Map embed or image URL">
            <input value={values.mapUrl || ''} onChange={e => onChange('mapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
          </Field>
          <Field label="Dress code or reminders">
            <input value={values.dressCode || ''} onChange={e => onChange('dressCode', e.target.value)} placeholder="Business casual" />
          </Field>
          <Field label="Agenda items (one per line)">
            {multilineTextarea(values.agenda || '', e => onChange('agenda', e.target.value), '10:00 - Registration\n10:30 - Keynote\n12:00 - Lunch')}
          </Field>
          <Field label="Primary CTA label">
            <input value={values.ctaLabel || ''} onChange={e => onChange('ctaLabel', e.target.value)} placeholder="RSVP now" />
          </Field>
          <Field label="Primary CTA link">
            <input value={values.ctaUrl || ''} onChange={e => onChange('ctaUrl', e.target.value)} placeholder="https://example.com/rsvp" />
          </Field>
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
    case 'PDF':
      return (
        <>
          <Field label="Upload PDF File">
            <FileUpload
              accept=".pdf"
              maxSize={10 * 1024 * 1024} // 10MB
              onUpload={async (file) => {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const response = await fetch(`${API}/qr/upload`, withAuth({
                    method: 'POST',
                    body: formData,
                  }));
                  const result = await response.json();
                  if (result.url) {
                    onChange('fileUrl', result.url);
                    onChange('fileName', result.originalName || file.name || '');
                  } else {
                    console.error('Upload failed:', result.error);
                  }
                } catch (error) {
                  console.error('Upload failed:', error);
                } finally {
                  setUploading(false);
                }
              }}
              currentFile={values.fileUrl}
              fileName={values.fileName}
              onRemove={() => {
                onChange('fileUrl', '');
                onChange('fileName', '');
              }}
            />
          </Field>
          <Field label="Background Color">
            <input type="color" value={values.backgroundColor || '#ffffff'} onChange={e => onChange('backgroundColor', e.target.value)} />
          </Field>
          <Field label="Text Color">
            <input type="color" value={values.textColor || '#000000'} onChange={e => onChange('textColor', e.target.value)} />
          </Field>
          <Field label="Accent Color">
            <input type="color" value={values.accentColor || '#2563eb'} onChange={e => onChange('accentColor', e.target.value)} />
          </Field>
          <Field label="Document title">
            <input value={values.title || ''} onChange={e => onChange('title', e.target.value)} placeholder="Product brochure 2024" />
          </Field>
          <Field label="Short description">
            {multilineTextarea(values.description || '', e => onChange('description', e.target.value), 'Summarise what readers will find inside.')}
          </Field>
          <Field label="Version">
            <input value={values.version || ''} onChange={e => onChange('version', e.target.value)} placeholder="v2.1" />
          </Field>
          <Field label="Last updated">
            <input value={values.updatedAt || ''} onChange={e => onChange('updatedAt', e.target.value)} placeholder="2024-06-01" />
          </Field>
          <Field label="File size">
            <input value={values.fileSize || ''} onChange={e => onChange('fileSize', e.target.value)} placeholder="2.3 MB" />
          </Field>
          <Field label="Metadata tags (comma separated)">
            <input value={values.tags || ''} onChange={e => onChange('tags', e.target.value)} placeholder="Launch, Internal, V2" />
          </Field>
          <Field label="Preview thumbnail URL">
            <input value={values.thumbnailUrl || ''} onChange={e => onChange('thumbnailUrl', e.target.value)} placeholder="https://.../thumb.png" />
          </Field>
          <Field label="Version notes (one per line)">
            {multilineTextarea(values.notes || '', e => onChange('notes', e.target.value), '✅ Added section on pricing\n⚙️ Updated installation steps')}
          </Field>
        </>
      );
    case 'MP3':
      return (
        <>
          <Field label="Upload Audio File">
            <FileUpload
              accept=".mp3,.wav,.ogg"
              maxSize={50 * 1024 * 1024} // 50MB
              onUpload={async (file) => {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const response = await fetch(`${API}/qr/upload`, withAuth({
                    method: 'POST',
                    body: formData,
                  }));
                  const result = await response.json();
                  if (result.url) {
                    onChange('fileUrl', result.url);
                    onChange('fileName', result.originalName || file.name || '');
                  } else {
                    console.error('Upload failed:', result.error);
                  }
                } catch (error) {
                  console.error('Upload failed:', error);
                } finally {
                  setUploading(false);
                }
              }}
              currentFile={values.fileUrl}
              fileName={values.fileName}
              onRemove={() => {
                onChange('fileUrl', '');
                onChange('fileName', '');
              }}
            />
          </Field>
          <Field label="Background Color">
            <input type="color" value={values.backgroundColor || '#0f172a'} onChange={e => onChange('backgroundColor', e.target.value)} />
          </Field>
          <Field label="Text Color">
            <input type="color" value={values.textColor || '#e2e8f0'} onChange={e => onChange('textColor', e.target.value)} />
          </Field>
          <Field label="Accent Color">
            <input type="color" value={values.accentColor || '#38bdf8'} onChange={e => onChange('accentColor', e.target.value)} />
          </Field>
          <Field label="Track title">
            <input value={values.title || ''} onChange={e => onChange('title', e.target.value)} placeholder="Single name" />
          </Field>
          <Field label="Artist">
            <input value={values.artist || ''} onChange={e => onChange('artist', e.target.value)} placeholder="Artist name" />
          </Field>
          <Field label="Album or release">
            <input value={values.album || ''} onChange={e => onChange('album', e.target.value)} placeholder="Album title (optional)" />
          </Field>
          <Field label="Cover art URL">
            <input value={values.coverUrl || ''} onChange={e => onChange('coverUrl', e.target.value)} placeholder="https://.../cover.jpg" />
          </Field>
          <Field label="Hero background URL">
            <input value={values.heroImage || ''} onChange={e => onChange('heroImage', e.target.value)} placeholder="https://.../background.jpg" />
          </Field>
          <Field label="Track description">
            {multilineTextarea(values.description || '', e => onChange('description', e.target.value), 'Tell listeners what they should know.')}
          </Field>
          <Field label="Streaming links (one per line: label|url)">
            {multilineTextarea(values.streamingLinks || '', e => onChange('streamingLinks', e.target.value), 'Spotify|https://open.spotify.com/...\nApple Music|https://music.apple.com/...')}
          </Field>
          <Field label="More from the artist (one per line: title|duration|url)">
            {multilineTextarea(values.moreTracks || '', e => onChange('moreTracks', e.target.value), 'Acoustic Sessions|3:21|https://example.com/a\nBehind the scenes|2:48|https://example.com/b')}
          </Field>
        </>
      );
    case 'AppLink':
      return (
        <>
          <Field label="Headline">
            <input value={values.headline || ''} onChange={e => onChange('headline', e.target.value)} placeholder="Your app, everywhere" />
          </Field>
          <Field label="Subheadline">
            <input value={values.subheadline || ''} onChange={e => onChange('subheadline', e.target.value)} placeholder="Explain what scanners unlock after installing." />
          </Field>
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
          <Field label="Accent color">
            <input type="color" value={values.accentColor || '#2563eb'} onChange={e => onChange('accentColor', e.target.value)} />
          </Field>
          <Field label="Background image URL">
            <input value={values.backgroundImage || ''} onChange={e => onChange('backgroundImage', e.target.value)} placeholder="https://.../screenshot.jpg" />
          </Field>
          <Field label="Feature highlights (one per line)">
            {multilineTextarea(values.features || '', e => onChange('features', e.target.value), 'One tap check-in\nSmart notifications\nOffline access')}
          </Field>
          <Field label="Store badges (one per line: label|url)">
            {multilineTextarea(values.storeBadges || '', e => onChange('storeBadges', e.target.value), 'App Store|https://apps.apple.com/...\nGoogle Play|https://play.google.com/...')}
          </Field>
        </>
      );
    case 'Gallery':
      return (
        <>
          <Field label="Gallery title">
            <input value={values.title || ''} onChange={e => onChange('title', e.target.value)} placeholder="Seasonal menu" />
          </Field>
          <Field label="Intro copy">
            {multilineTextarea(values.intro || '', e => onChange('intro', e.target.value), 'Describe your collection or welcome note.')}
          </Field>
          <Field label="Featured image URL">
            <input value={values.featuredImage || ''} onChange={e => onChange('featuredImage', e.target.value)} placeholder="https://.../hero.jpg" />
          </Field>
          <Field label="Highlight category">
            <input value={values.highlightCategory || ''} onChange={e => onChange('highlightCategory', e.target.value)} placeholder="Chef specials" />
          </Field>
          <Field label="Items (one per line: category|title|description|price|imageUrl)">
            {multilineTextarea(values.items || '', e => onChange('items', e.target.value), 'Brunch|Avocado Toast|Sourdough, heirloom tomato, feta|$12|https://.../toast.jpg')}
          </Field>
          <Field label="Call-to-action label">
            <input value={values.ctaLabel || ''} onChange={e => onChange('ctaLabel', e.target.value)} placeholder="Order online" />
          </Field>
          <Field label="Call-to-action link">
            <input value={values.ctaUrl || ''} onChange={e => onChange('ctaUrl', e.target.value)} placeholder="https://example.com/order" />
          </Field>
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
