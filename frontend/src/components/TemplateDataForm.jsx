import React from 'react';

export const TEMPLATES = [
  'URL',
  'TEXT',
  'Phone',
  'SMS',
  'Email',
  'Whatsapp',
  'Facetime',
  'Location',
  'WiFi',
  'Event',
  'Vcard',
  'Crypto',
  'PayPal',
  'UPI Payment',
  'EPC Payment',
  'PIX Payment'
];

export const TEMPLATE_DEFAULTS = {
  URL: { url: '' },
  TEXT: { text: '' },
  Phone: { phone: '' },
  SMS: { to: '', body: '' },
  Email: { to: '', subject: '', body: '' },
  Whatsapp: { phone: '', text: '' },
  Facetime: { target: '' },
  Location: { lat: '', lng: '', query: '' },
  WiFi: { ssid: '', password: '', auth: 'WPA', hidden: false },
  Event: { summary: '', start: '', end: '', location: '', description: '' },
  Vcard: { first: '', last: '', title: '', org: '', email: '', phone: '', address: '', url: '' },
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
  switch (type) {
    case 'URL':
      return (
        <Field label="URL">
          <input value={values.url || ''} onChange={e => onChange('url', e.target.value)} placeholder="https:// or facebook.com" />
        </Field>
      );
    case 'TEXT':
      return (
        <Field label="Text">
          {multilineTextarea(values.text || '', e => onChange('text', e.target.value), 'Write any message')}
        </Field>
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
        </>
      );
    case 'Event':
      return (
        <>
          <Field label="Event title">
            <input value={values.summary || ''} onChange={e => onChange('summary', e.target.value)} placeholder="Event name" />
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
