import React from 'react';
import { TEMPLATE_LIBRARY } from './TemplateDataForm.jsx';

const TEMPLATE_META_LOOKUP = Object.fromEntries(
  TEMPLATE_LIBRARY.map(item => [item.id.toUpperCase(), item])
);

const paneBase = {
  flex: '1 1 320px',
  minWidth: 260,
  borderRadius: 24,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const headerStyle = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontWeight: 600
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1.25
};

const subtitleStyle = {
  fontSize: 15,
  lineHeight: 1.6
};

const footerStyle = {
  marginTop: 'auto',
  fontSize: 13
};

function withAlpha(hex = '#000000', alpha = 0.15) {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3 ? sanitized.split('').map(ch => ch + ch).join('') : sanitized;
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pickBrand(url) {
  if (!url) return null;
  const needle = url.toLowerCase();
  if (needle.includes('facebook.com')) return { label: 'Facebook Page', accent: '#1877f2', icon: '📘' };
  if (needle.includes('instagram.com')) return { label: 'Instagram', accent: '#E1306C', icon: '📸' };
  if (needle.includes('youtube.com') || needle.includes('youtu.be')) return { label: 'YouTube', accent: '#FF0000', icon: '▶️' };
  if (needle.includes('linkedin.com')) return { label: 'LinkedIn', accent: '#0A66C2', icon: '💼' };
  if (needle.includes('twitter.com') || needle.includes('x.com')) return { label: 'Twitter', accent: '#1DA1F2', icon: '🐦' };
  return null;
}

function cleanHost(url) {
  if (!url) return 'your-website.com';
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    return hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '') || 'your-website.com';
  }
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function ChatBubble({ author, text, tint }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      background: tint || '#f1f5f9',
      borderRadius: 18,
      padding: '12px 16px',
      color: '#0f172a',
      boxShadow: 'inset 0 -1px 0 rgba(15,23,42,0.08)'
    }}>
      <div style={{ fontWeight: 600 }}>{author}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function describeTemplate(type, values) {
  const normalizedType = (type || 'URL').toUpperCase();
  const baseMeta = TEMPLATE_META_LOOKUP[normalizedType];
  const accent = baseMeta?.accent || '#2563eb';
  const icon = baseMeta?.icon || '✨';

  const finalize = (descriptor, { preserveAccent = false, preserveIcon = false } = {}) => {
    const result = { ...descriptor };
    if (preserveAccent) {
      result.accent = result.accent || accent;
    } else {
      result.accent = accent;
    }
    if (preserveIcon) {
      result.icon = result.icon || icon;
    } else {
      result.icon = icon;
    }
    return result;
  };

  switch (normalizedType) {
    case 'TEXT': {
      const text = values.text || 'Hello there! 👋';
      return finalize({
        eyebrow: 'Text snippet',
        title: 'Instant message',
        subtitle: 'Shown immediately after scanning.',
        body: text,
        inlineSummary: text.slice(0, 90),
        tip: 'Great for coupons, promo codes, and short announcements.'
      });
    }
    case 'PHONE': {
      const phone = values.phone || '+1 555 123 4567';
      return finalize({
        eyebrow: 'Phone call',
        title: 'Tap to call',
        subtitle: 'Opens the dialer with this number.',
        highlight: phone,
        inlineSummary: `Dial ${phone}`,
        tip: 'Great for support lines or booking numbers.'
      });
    }
    case 'SMS': {
      const to = values.to || '+1 555 123 4567';
      const body = values.body || 'Hello! I found you via the QR code.';
      return finalize({
        eyebrow: 'SMS conversation',
        title: 'Auto-filled message',
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChatBubble author="You" text={`To: ${to}`} tint="#dcfce7" />
            <ChatBubble author="Draft" text={body} tint="#e0f2fe" />
          </div>
        ),
        inlineSummary: `Text ${to}`,
        tip: 'Users can hit send immediately.'
      }, { preserveIcon: true });
    }
    case 'EMAIL': {
      const to = values.to || 'hello@example.com';
      const subject = values.subject || 'Quick hello from your QR visitor';
      const body = values.body || 'Hi there! I scanned your QR code and would love to connect.';
      return finalize({
        eyebrow: 'Email draft',
        title: subject,
        subtitle: `To: ${to}`,
        body: body.length > 240 ? `${body.slice(0, 240)}…` : body,
        inlineSummary: `Email ${to}`,
        tip: 'Opens the visitor’s default mail app with these fields filled in.'
      });
    }
    case 'WHATSAPP': {
      const phone = values.phone || '+1 555 123 4567';
      const text = values.text || 'Hey! 👋 Thanks for scanning our QR — can I help you with anything?';
      return finalize({
        eyebrow: 'WhatsApp chat',
        title: 'Start a conversation',
        subtitle: `To: ${phone}`,
        body: <ChatBubble author="Message" text={text} tint="#dcfce7" />,
        inlineSummary: `WhatsApp ${phone}`,
        tip: 'Opens WhatsApp with chat ready to send.'
      });
    }
    case 'FACETIME': {
      const target = values.target || 'user@example.com';
      return finalize({
        eyebrow: 'FaceTime call',
        title: 'Start a FaceTime session',
        subtitle: `Target: ${target}`,
        inlineSummary: `FaceTime ${target}`,
        tip: 'Opens FaceTime with this address or number.'
      });
    }
    case 'LOCATION': {
      const location = values.query || `${values.lat || ''}${values.lat && values.lng ? ', ' : ''}${values.lng || ''}` || 'Add a map target.';
      return finalize({
        eyebrow: 'Maps location',
        title: 'Open directions',
        subtitle: location,
        inlineSummary: location,
        tip: 'Launches maps with the destination pinned.'
      });
    }
    case 'WIFI': {
      const ssid = values.ssid || 'MyGuestWiFi';
      const auth = values.auth || 'WPA';
      const password = values.password || 'super-secret';
      return finalize({
        eyebrow: 'Wi‑Fi login',
        title: ssid,
        subtitle: `Security: ${auth}`,
        highlight: `Password: ${password || '—'}`,
        inlineSummary: `Wi‑Fi SSID “${ssid}”`,
        tip: 'Scanning connects guests without typing credentials.'
      });
    }
    case 'EVENT': {
      const summary = values.summary || 'Product Launch Event';
      const start = formatDateTime(values.start);
      const location = values.location || 'Main HQ Auditorium';
      return finalize({
        eyebrow: 'Calendar event',
        title: summary,
        subtitle: start,
        body: location,
        inlineSummary: `${summary} • ${start}`,
        tip: 'Adds the event to the attendee’s calendar app.'
      });
    }
    case 'VCARD': {
      const name = [values.first, values.last].filter(Boolean).join(' ') || 'Alex Morgan';
      const title = values.title || values.org || 'Brand Ambassador • QRovate';
      const phone = values.phone || '+1 555 123 4567';
      const email = values.email || 'alex@example.com';
      return finalize({
        eyebrow: 'Digital business card',
        title: name,
        subtitle: title,
        body: `📞 ${phone}\n✉️ ${email}`,
        inlineSummary: `${name} • ${phone}`,
        tip: 'Creates or updates a contact in their address book.'
      }, { preserveIcon: true });
    }
    case 'CRYPTO': {
      const symbol = (values.symbol || 'BTC').toUpperCase();
      const address = values.address || 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7k5x0f3';
      const amount = values.amount;
      return finalize({
        eyebrow: `${symbol} payment`,
        title: address.slice(0, 12) + '…',
        subtitle: address,
        highlight: amount ? `Amount requested: ${amount}` : undefined,
        inlineSummary: `${symbol} wallet`,
        tip: 'Opens the wallet app ready to send funds.'
      }, { preserveIcon: true });
    }
    case 'PAYPAL': {
      const username = values.username || 'mybusiness';
      const amount = values.amount;
      return finalize({
        eyebrow: 'PayPal checkout',
        title: `paypal.me/${username}`,
        subtitle: 'Tap to complete payment securely.',
        highlight: amount ? `Amount: ${amount}` : undefined,
        inlineSummary: `PayPal • ${username}`,
        tip: 'Perfect for donations or quick settlements.'
      });
    }
    case 'UPI PAYMENT': {
      const vpa = values.vpa || 'merchant@upi';
      const name = values.name || 'QRovate Store';
      const amount = values.amount;
      return finalize({
        eyebrow: 'UPI payment',
        title: name,
        subtitle: `VPA: ${vpa}`,
        highlight: amount ? `Amount: ₹${amount}` : 'Amount entered on device',
        inlineSummary: `UPI • ${vpa}`,
        tip: 'Works with Google Pay, PhonePe, and other UPI apps.'
      });
    }
    case 'EPC PAYMENT': {
      const name = values.name || 'ACME GmbH';
      const iban = values.iban || 'DE02120300000000202051';
      const amount = values.amount ? `€${values.amount}` : 'Amount entered by sender';
      const remittance = values.remittance || 'Invoice 2024-04';
      return finalize({
        eyebrow: 'SEPA transfer',
        title: name,
        subtitle: `IBAN: ${iban}`,
        body: `Purpose: ${remittance}`,
        highlight: amount,
        inlineSummary: `${name} • IBAN ending ${iban.slice(-4)}`,
        tip: 'Compatible with EU banking apps that support EPC QR.'
      });
    }
    case 'PIX PAYMENT': {
      const payload = values.payload || 'Add your PIX payload';
      return finalize({
        eyebrow: 'PIX payment',
        title: 'Brazil instant payment',
        subtitle: 'Scan to open your banking app.',
        body: payload.slice(0, 160),
        inlineSummary: 'PIX payment request',
        tip: 'Works with Brazilian PIX-compliant apps.'
      });
    }
    default: {
      const url = values.url || '';
      const brand = pickBrand(url);
      const host = cleanHost(url);
      return finalize({
        eyebrow: brand?.label || 'Website',
        title: brand ? `${brand.icon} ${host}` : host,
        subtitle: brand ? 'Send visitors directly to your social page.' : 'Opens instantly when scanned.',
        body: url || 'Add your URL to see it here.',
        inlineSummary: url || 'Add a destination URL.',
        tip: 'Tip: add UTM parameters to track campaigns.',
        accent: brand?.accent,
        icon: brand?.icon
      }, { preserveAccent: true, preserveIcon: true });
    }
  }
}

function coerceString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(' ');
  if (React.isValidElement(value)) return '';
  return String(value);
}

function toLines(value) {
  const str = coerceString(value);
  if (!str) return [];
  return str.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function PhonePreview({ descriptor }) {
  const {
    eyebrow,
    title,
    subtitle,
    body,
    highlight,
    inlineSummary,
    accent,
    icon
  } = descriptor;

  const bodyLines = typeof body === 'string' ? toLines(body) : [];
  const highlightLines = toLines(highlight);
  const actionLines = [];
  if (highlightLines.length) actionLines.push(...highlightLines);
  if (inlineSummary) actionLines.push(inlineSummary);
  if (bodyLines.length && actionLines.length === 0) {
    actionLines.push(...bodyLines.slice(0, 2));
  }

  return (
    <div className="content-preview-shell">
      <div className="content-preview-hero" style={{ background: `linear-gradient(160deg, ${withAlpha(accent || '#8b5cf6', 0.28)}, rgba(255,255,255,0.95))` }}>
        <div className="content-preview-avatar">{icon || '✨'}</div>
        <div className="content-preview-copy">
          {eyebrow && <span className="content-preview-chip">{eyebrow}</span>}
          <h4>{title || 'Your preview title'}</h4>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="content-preview-body">
        {React.isValidElement(body) ? (
          <div className="content-preview-rich">{body}</div>
        ) : (
          bodyLines.map((line, idx) => <p key={idx}>{line}</p>)
        )}
      </div>

      {actionLines.length > 0 && (
        <div className="content-preview-actions">
          {actionLines.slice(0, 3).map((line, idx) => (
            <button type="button" className="content-preview-action" key={idx}>
              <span>{line}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InlinePreview({ descriptor }) {
  const {
    eyebrow,
    title,
    subtitle,
    highlight,
    inlineSummary,
    accent
  } = descriptor;
  return (
    <div
      className="inline-preview-card"
      style={{
        background: `linear-gradient(135deg, ${withAlpha(accent || '#2563eb', 0.12)}, ${withAlpha(accent || '#2563eb', 0.05)})`,
        border: `1px solid ${withAlpha(accent || '#2563eb', 0.18)}`
      }}
    >
      {eyebrow && <span className="inline-eyebrow">{eyebrow}</span>}
      <div className="inline-title">{title || 'Ready to preview'}</div>
      {subtitle && <div className="inline-subtitle">{subtitle}</div>}
      {highlight && <div className="inline-highlight">{highlight}</div>}
      <div className="inline-summary">{inlineSummary || ''}</div>
    </div>
  );
}

export default function TemplatePreview({ type, values, variant = 'card' }) {
  const descriptor = describeTemplate(type, values);
  if (variant === 'inline') return <InlinePreview descriptor={descriptor} />;
  if (variant === 'phone') return <PhonePreview descriptor={descriptor} />;
  return <InlinePreview descriptor={descriptor} />;
}
