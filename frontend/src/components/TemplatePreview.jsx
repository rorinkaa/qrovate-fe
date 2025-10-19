import React from 'react';

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
  switch ((type || 'URL').toUpperCase()) {
    case 'TEXT': {
      const text = values.text || 'Hello there! 👋';
      return {
        eyebrow: 'Text snippet',
        title: 'Instant message',
        subtitle: 'Shown immediately after scanning.',
        body: text,
        inlineSummary: text.slice(0, 90),
        tip: 'Great for coupons, promo codes, and short announcements.',
        accent: '#7c3aed',
        icon: '💬'
      };
    }
    case 'PHONE': {
      const phone = values.phone || '+1 555 123 4567';
      return {
        eyebrow: 'Phone call',
        title: 'Tap to call',
        subtitle: 'Opens the dialer with this number.',
        highlight: phone,
        inlineSummary: `Dial ${phone}`,
        tip: 'Great for support lines or booking numbers.',
        accent: '#ef4444',
        icon: '📞'
      };
    }
    case 'SMS': {
      const to = values.to || '+1 555 123 4567';
      const body = values.body || 'Hello! I found you via the QR code.';
      return {
        eyebrow: 'SMS conversation',
        title: 'Auto-filled message',
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChatBubble author="You" text={`To: ${to}`} tint="#dcfce7" />
            <ChatBubble author="Draft" text={body} tint="#e0f2fe" />
          </div>
        ),
        inlineSummary: `Text ${to}`,
        tip: 'Users can hit send immediately.',
        accent: '#00a884',
        icon: '💬'
      };
    }
    case 'EMAIL': {
      const to = values.to || 'hello@example.com';
      const subject = values.subject || 'Quick hello from your QR visitor';
      const body = values.body || 'Hi there! I scanned your QR code and would love to connect.';
      return {
        eyebrow: 'Email draft',
        title: subject,
        subtitle: `To: ${to}`,
        body: body.length > 240 ? `${body.slice(0, 240)}…` : body,
        inlineSummary: `Email ${to}`,
        tip: 'Opens the visitor’s default mail app with these fields filled in.',
        accent: '#2563eb',
        icon: '✉️'
      };
    }
    case 'WHATSAPP': {
      const phone = values.phone || '+1 555 123 4567';
      const text = values.text || 'Hey! 👋 Thanks for scanning our QR — can I help you with anything?';
      return {
        eyebrow: 'WhatsApp chat',
        title: 'Start a conversation',
        subtitle: `To: ${phone}`,
        body: <ChatBubble author="Message" text={text} tint="#dcfce7" />,
        inlineSummary: `WhatsApp ${phone}`,
        tip: 'Opens WhatsApp with chat ready to send.',
        accent: '#25d366',
        icon: '🟢'
      };
    }
    case 'FACETIME': {
      const target = values.target || 'user@example.com';
      return {
        eyebrow: 'FaceTime call',
        title: 'Start a FaceTime session',
        subtitle: `Target: ${target}`,
        inlineSummary: `FaceTime ${target}`,
        tip: 'Opens FaceTime with this address or number.',
        accent: '#38bdf8',
        icon: '🎥'
      };
    }
    case 'LOCATION': {
      const location = values.query || `${values.lat || ''}${values.lat && values.lng ? ', ' : ''}${values.lng || ''}` || 'Add a map target.';
      return {
        eyebrow: 'Maps location',
        title: 'Open directions',
        subtitle: location,
        inlineSummary: location,
        tip: 'Launches maps with the destination pinned.',
        accent: '#0ea5e9',
        icon: '📍'
      };
    }
    case 'WIFI': {
      const ssid = values.ssid || 'MyGuestWiFi';
      const auth = values.auth || 'WPA';
      const password = values.password || 'super-secret';
      return {
        eyebrow: 'Wi‑Fi login',
        title: ssid,
        subtitle: `Security: ${auth}`,
        highlight: `Password: ${password || '—'}`,
        inlineSummary: `Wi‑Fi SSID “${ssid}”`,
        tip: 'Scanning connects guests without typing credentials.',
        accent: '#0ea5e9',
        icon: '📶'
      };
    }
    case 'EVENT': {
      const summary = values.summary || 'Product Launch Event';
      const start = formatDateTime(values.start);
      const location = values.location || 'Main HQ Auditorium';
      return {
        eyebrow: 'Calendar event',
        title: summary,
        subtitle: start,
        body: location,
        inlineSummary: `${summary} • ${start}`,
        tip: 'Adds the event to the attendee’s calendar app.',
        accent: '#f97316',
        icon: '📅'
      };
    }
    case 'VCARD': {
      const name = [values.first, values.last].filter(Boolean).join(' ') || 'Alex Morgan';
      const title = values.title || values.org || 'Brand Ambassador • QRovate';
      const phone = values.phone || '+1 555 123 4567';
      const email = values.email || 'alex@example.com';
      return {
        eyebrow: 'Digital business card',
        title: name,
        subtitle: title,
        body: `📞 ${phone}\n✉️ ${email}`,
        inlineSummary: `${name} • ${phone}`,
        tip: 'Creates or updates a contact in their address book.',
        accent: '#8b5cf6',
        icon: '🪪'
      };
    }
    case 'CRYPTO': {
      const symbol = (values.symbol || 'BTC').toUpperCase();
      const address = values.address || 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7k5x0f3';
      const amount = values.amount;
      return {
        eyebrow: `${symbol} payment`,
        title: address.slice(0, 12) + '…',
        subtitle: address,
        highlight: amount ? `Amount requested: ${amount}` : undefined,
        inlineSummary: `${symbol} wallet`,
        tip: 'Opens the wallet app ready to send funds.',
        accent: '#fbbf24',
        icon: '₿'
      };
    }
    case 'PAYPAL': {
      const username = values.username || 'mybusiness';
      const amount = values.amount;
      return {
        eyebrow: 'PayPal checkout',
        title: `paypal.me/${username}`,
        subtitle: 'Tap to complete payment securely.',
        highlight: amount ? `Amount: ${amount}` : undefined,
        inlineSummary: `PayPal • ${username}`,
        tip: 'Perfect for donations or quick settlements.',
        accent: '#1070d1',
        icon: '💸'
      };
    }
    case 'UPI PAYMENT': {
      const vpa = values.vpa || 'merchant@upi';
      const name = values.name || 'QRovate Store';
      const amount = values.amount;
      return {
        eyebrow: 'UPI payment',
        title: name,
        subtitle: `VPA: ${vpa}`,
        highlight: amount ? `Amount: ₹${amount}` : 'Amount entered on device',
        inlineSummary: `UPI • ${vpa}`,
        tip: 'Works with Google Pay, PhonePe, and other UPI apps.',
        accent: '#0f766e',
        icon: '🇮🇳'
      };
    }
    case 'EPC PAYMENT': {
      const name = values.name || 'ACME GmbH';
      const iban = values.iban || 'DE02120300000000202051';
      const amount = values.amount ? `€${values.amount}` : 'Amount entered by sender';
      const remittance = values.remittance || 'Invoice 2024-04';
      return {
        eyebrow: 'SEPA transfer',
        title: name,
        subtitle: `IBAN: ${iban}`,
        body: `Purpose: ${remittance}`,
        highlight: amount,
        inlineSummary: `${name} • IBAN ending ${iban.slice(-4)}`,
        tip: 'Compatible with EU banking apps that support EPC QR.',
        accent: '#2563eb',
        icon: '🏦'
      };
    }
    case 'PIX PAYMENT': {
      const payload = values.payload || 'Add your PIX payload';
      return {
        eyebrow: 'PIX payment',
        title: 'Brazil instant payment',
        subtitle: 'Scan to open your banking app.',
        body: payload.slice(0, 160),
        inlineSummary: 'PIX payment request',
        tip: 'Works with Brazilian PIX-compliant apps.',
        accent: '#22d3ee',
        icon: '💠'
      };
    }
    default: {
      const url = values.url || '';
      const brand = pickBrand(url);
      const host = cleanHost(url);
      return {
        eyebrow: brand?.label || 'Website',
        title: brand ? `${brand.icon} ${host}` : host,
        subtitle: brand ? 'Send visitors directly to your social page.' : 'Opens instantly when scanned.',
        body: url || 'Add your URL to see it here.',
        inlineSummary: url || 'Add a destination URL.',
        tip: 'Tip: add UTM parameters to track campaigns.',
        accent: brand?.accent || '#2563eb',
        icon: brand?.icon || '🌐'
      };
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
