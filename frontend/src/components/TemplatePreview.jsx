import React from 'react';
import { TEMPLATE_LIBRARY } from './TemplateDataForm.jsx';
import Icon from './ui/Icon.jsx';

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
  if (needle.includes('facebook.com')) return { label: 'Facebook Page', accent: '#1877f2', icon: 'facebook' };
  if (needle.includes('instagram.com')) return { label: 'Instagram', accent: '#E1306C', icon: 'instagram' };
  if (needle.includes('youtube.com') || needle.includes('youtu.be')) return { label: 'YouTube', accent: '#FF0000', icon: 'youtube' };
  if (needle.includes('linkedin.com')) return { label: 'LinkedIn', accent: '#0A66C2', icon: 'linkedin' };
  if (needle.includes('twitter.com') || needle.includes('x.com')) return { label: 'Twitter', accent: '#1DA1F2', icon: 'twitter' };
  return null;
}

function cleanHost(url) {
  if (!url) return 'your-website.com';
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    return hostname.replace(/^www\./i, '');
  } catch {
    return String(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '') || 'your-website.com';
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
  const icon = baseMeta?.icon || 'sparkles';

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
      const text = values.text || 'Hello there! Welcome to our QR.';
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
      const text = values.text || 'Thanks for scanning our QR — can I help you with anything?';
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
        body: `Phone: ${phone}\nEmail: ${email}`,
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
    case 'PDF': {
      const url = values.fileUrl || '';
      const host = cleanHost(url);
      const bgColor = values.backgroundColor || '#ffffff';
      const textColor = values.textColor || '#000000';
      const accentColor = values.accentColor || '#2563eb';
      const filename = values.fileName || (url ? (() => {
        try {
          const parts = String(url).split('/');
          return decodeURIComponent(parts[parts.length - 1] || '') || 'document.pdf';
        } catch {
          return 'document.pdf';
        }
      })() : 'document.pdf');
      return finalize({
        eyebrow: 'PDF Document',
        title: url ? host : 'PDF Download',
        subtitle: 'Tap to download or view the document.',
        body: (
          <div style={{
            background: bgColor,
            borderRadius: 8,
            padding: '16px',
            border: `1px solid ${accentColor}20`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 200
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                fontSize: 32,
                color: accentColor
              }}>
                <Icon name="file" size={32} />
              </div>
              <div style={{
                flex: 1,
                color: textColor
              }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{filename}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>PDF Document</div>
              </div>
            </div>
            <div style={{
              background: '#f8f9fa',
              borderRadius: 4,
              padding: '12px',
              fontSize: 12,
              color: '#666',
              lineHeight: 1.4
            }}>
              <div>Sample text from the PDF document...</div>
              <div style={{ marginTop: 4 }}>This is a preview of the content.</div>
              <div style={{ marginTop: 4 }}>Page 1 of 5</div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8
            }}>
              <button style={{
                background: accentColor,
                color: 'white',
                border: 'none',
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon name="download" size={16} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ),
        inlineSummary: url ? `PDF from ${host}` : 'Upload PDF file.',
        tip: 'Opens the PDF in the browser or downloads it.'
      });
    }
    case 'MP3': {
      const url = values.fileUrl || '';
      const host = cleanHost(url);
      const bgColor = values.backgroundColor || '#f1f5f9';
      const textColor = values.textColor || '#475569';
      const accentColor = values.accentColor || '#2563eb';
      const filename = values.fileName || (url ? (() => {
        try {
          const parts = String(url).split('/');
          return decodeURIComponent(parts[parts.length - 1] || '') || 'audio.mp3';
        } catch {
          return 'audio.mp3';
        }
      })() : 'audio.mp3');
      return finalize({
        eyebrow: 'Audio File',
        title: url ? host : 'Audio Player',
        subtitle: 'Tap to play the audio file.',
        body: (
          <div style={{
            background: bgColor,
            borderRadius: 8,
            padding: '16px',
            border: `1px solid ${accentColor}20`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 200
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                fontSize: 32,
                color: accentColor
              }}>
                <Icon name="audio" size={32} />
              </div>
              <div style={{
                flex: 1,
                color: textColor
              }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{filename}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Audio File</div>
              </div>
            </div>
            {url ? (
              <audio
                controls
                style={{ width: '100%', borderRadius: 8 }}
                onError={(e) => console.error('Audio load error:', e.target.error, 'URL:', url)}
                onLoadStart={() => console.log('Audio loading:', url)}
                onCanPlay={() => console.log('Audio can play:', url)}
              >
                <source src={url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div style={{
                background: '#f8f9fa',
                borderRadius: 4,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 18
                }}>▶</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: textColor }}>Preview Player</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Upload an MP3 to play</div>
                </div>
                <div style={{
                  width: 100,
                  height: 4,
                  background: '#e2e8f0',
                  borderRadius: 2,
                  position: 'relative'
                }}>
                  <div style={{
                    width: '0%',
                    height: '100%',
                    background: accentColor,
                    borderRadius: 2
                  }}></div>
                </div>
              </div>
            )}
          </div>
        ),
        inlineSummary: url ? `Audio from ${host}` : 'Upload audio file.',
        tip: 'Plays the MP3 directly in the browser.'
      });
    }
    case 'VOUCHER': {
      const code = values.code || 'SUMMER2024';
      const description = values.description || '20% off your next purchase';
      const expiry = values.expiry ? formatDateTime(values.expiry) : 'No expiry';
      return finalize({
        eyebrow: 'Discount Voucher',
        title: code,
        subtitle: description,
        body: `Expires: ${expiry}`,
        highlight: `Code: ${code}`,
        inlineSummary: `${code} • ${description}`,
        tip: 'Copy the code or save for later use.'
      });
    }
    default: {
      const url = values.url || '';
      const brand = pickBrand(url);
      const host = cleanHost(url);
      return finalize({
        eyebrow: brand?.label || 'Website',
        title: host,
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
        <div className="content-preview-avatar">
          <Icon name={icon || 'sparkles'} size={24} />
        </div>
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

export function EditableTemplatePreview({ type, values, onChange, variant = 'card' }) {
  const descriptor = describeTemplate(type, values);
  if (variant === 'inline') return <EditableInlinePreview descriptor={descriptor} onChange={onChange} />;
  if (variant === 'phone') return <EditablePhonePreview descriptor={descriptor} onChange={onChange} />;
  return <EditableInlinePreview descriptor={descriptor} onChange={onChange} />;
}

function EditableInlinePreview({ descriptor, onChange }) {
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
      className="inline-preview-card editable"
      style={{
        background: `linear-gradient(135deg, ${withAlpha(accent || '#2563eb', 0.12)}, ${withAlpha(accent || '#2563eb', 0.05)})`,
        border: `1px solid ${withAlpha(accent || '#2563eb', 0.18)}`
      }}
    >
      {eyebrow && <span className="inline-eyebrow">{eyebrow}</span>}
      <div className="inline-title" contentEditable onBlur={(e) => onChange('title', e.target.textContent)}>{title || 'Ready to preview'}</div>
      {subtitle && <div className="inline-subtitle" contentEditable onBlur={(e) => onChange('subtitle', e.target.textContent)}>{subtitle}</div>}
      {highlight && <div className="inline-highlight" contentEditable onBlur={(e) => onChange('highlight', e.target.textContent)}>{highlight}</div>}
      <div className="inline-summary" contentEditable onBlur={(e) => onChange('inlineSummary', e.target.textContent)}>{inlineSummary || ''}</div>
    </div>
  );
}

function EditablePhonePreview({ descriptor, onChange }) {
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
    <div className="content-preview-shell editable">
      <div className="content-preview-hero" style={{ background: `linear-gradient(160deg, ${withAlpha(accent || '#8b5cf6', 0.28)}, rgba(255,255,255,0.95))` }}>
        <div className="content-preview-avatar">
          <Icon name={icon || 'sparkles'} size={24} />
        </div>
        <div className="content-preview-copy">
          {eyebrow && <span className="content-preview-chip" contentEditable onBlur={(e) => onChange('eyebrow', e.target.textContent)}>{eyebrow}</span>}
          <h4 contentEditable onBlur={(e) => onChange('title', e.target.textContent)}>{title || 'Your preview title'}</h4>
          {subtitle && <p contentEditable onBlur={(e) => onChange('subtitle', e.target.textContent)}>{subtitle}</p>}
        </div>
      </div>

      <div className="content-preview-body">
        {React.isValidElement(body) ? (
          <div className="content-preview-rich">{body}</div>
        ) : (
          bodyLines.map((line, idx) => <p key={idx} contentEditable onBlur={(e) => onChange('body', e.target.textContent)}>{line}</p>)
        )}
      </div>

      {actionLines.length > 0 && (
        <div className="content-preview-actions">
          {actionLines.slice(0, 3).map((line, idx) => (
            <button type="button" className="content-preview-action" key={idx} contentEditable onBlur={(e) => onChange('action', e.target.textContent)}>
              <span>{line}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LivePreview({ type, values, variant = 'phone' }) {
  const descriptor = describeTemplate(type, values);
  if (variant === 'phone') return <LivePhonePreview descriptor={descriptor} />;
  return <LivePhonePreview descriptor={descriptor} />;
}

function LivePhonePreview({ descriptor }) {
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
    <div className="content-preview-shell live">
      <div className="content-preview-hero" style={{ background: `linear-gradient(160deg, ${withAlpha(accent || '#8b5cf6', 0.28)}, rgba(255,255,255,0.95))` }}>
        <div className="content-preview-avatar">
          <Icon name={icon || 'sparkles'} size={24} />
        </div>
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
