import React from 'react';

const paneStyle = {
  flex: '1 1 320px',
  minWidth: 260,
  background: '#ffffff',
  border: '1px solid rgba(15,23,42,0.06)',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 20px 60px -28px rgba(15,23,42,0.22)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const headerStyle = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontWeight: 600,
  color: '#475569'
};

const titleStyle = {
  fontSize: 20,
  fontWeight: 600,
  color: '#0f172a',
  lineHeight: 1.2
};

const subtitleStyle = {
  fontSize: 14,
  color: '#475569',
  lineHeight: 1.5
};

const footerStyle = {
  marginTop: 'auto',
  fontSize: 13,
  color: '#64748b'
};

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

function firstLine(value, fallback = '') {
  if (!value) return fallback;
  return value.split(/\n|\r/).filter(Boolean)[0] || fallback;
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function Money({ amount, currency = 'USD' }) {
  const val = Number(amount);
  if (!Number.isFinite(val)) return `${amount || '0'} ${currency}`;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(val);
}

function renderTextContent(content) {
  if (content == null) return null;
  if (typeof content === 'string') {
    return content.split('\n').map((line, idx) => (
      <div key={idx} style={idx > 0 ? { marginTop: 4 } : undefined}>{line}</div>
    ));
  }
  return content;
}

function PreviewCard({ eyebrow, title, subtitle, body, footer, accent, illustration, highlight }) {
  return (
    <div style={{ ...paneStyle, borderColor: accent ? accent + '33' : paneStyle.border, boxShadow: accent ? `0 20px 60px -28px ${accent}66` : paneStyle.boxShadow }}>
      {eyebrow && <div style={{ ...headerStyle, color: accent || headerStyle.color }}>{eyebrow}</div>}
      <div style={{ display: 'flex', gap: 12, alignItems: illustration ? 'center' : 'flex-start' }}>
        {illustration}
        <div style={{ flex: 1 }}>
          {title && <div style={{ ...titleStyle, color: accent ? '#0b1120' : titleStyle.color }}>{title}</div>}
          {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
          {highlight && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 12,
              background: accent ? accent + '1a' : '#f1f5f9',
              color: accent ? accent : '#0f172a',
              fontWeight: 600,
              fontSize: 13
            }}>{highlight}</div>
          )}
        </div>
      </div>
      {body && <div style={{ ...subtitleStyle, color: '#1f2937' }}>{renderTextContent(body)}</div>}
      {footer && <div style={footerStyle}>{footer}</div>}
    </div>
  );
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

function renderUrlPreview(values) {
  const url = values.url || '';
  const brand = pickBrand(url);
  const host = cleanHost(url);
  return (
    <PreviewCard
      eyebrow={brand?.label || 'Website'}
      title={brand ? `${brand.icon} ${host}` : host}
      subtitle={brand ? 'Send visitors directly to your social page.' : 'Your link opens instantly when scanned.'}
      body={url ? url : 'Add your URL to see it here.'}
      footer="Tip: add UTM parameters to track campaigns."
      accent={brand?.accent || '#2563eb'}
      illustration={
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: brand ? brand.accent + '1a' : '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28
        }}>
          {brand?.icon || '🌐'}
        </div>
      }
    />
  );
}

function renderTextPreview(values) {
  const text = values.text || 'Hello there! 👋';
  return (
    <PreviewCard
      eyebrow="Text snippet"
      title="Instant message"
      body={`The camera will show this text:\n“${text.slice(0, 120)}${text.length > 120 ? '…' : ''}”`}
      footer="Great for coupons, promo codes, and short announcements."
      accent="#7c3aed"
    />
  );
}

function renderPhonePreview(values) {
  const phone = values.phone || '+1 555 123 4567';
  return (
    <PreviewCard
      eyebrow="Phone call"
      title="Tap to call"
      subtitle="Opens the dialer with this number"
      highlight={phone}
      footer="Perfect for support lines or booking numbers."
      accent="#ef4444"
      illustration={<div style={{ fontSize: 34 }}>📞</div>}
    />
  );
}

function renderSMSPreview(values) {
  const to = values.to || '+1 555 123 4567';
  const body = values.body || 'Hello! I found you via the QR code.';
  return (
    <PreviewCard
      eyebrow="SMS conversation"
      title="Auto-filled message"
      accent="#00a884"
      body={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChatBubble author="You" text={`To: ${to}`} tint="#dcfce7" />
          <ChatBubble author="Draft" text={body} tint="#e0f2fe" />
        </div>
      }
      footer="Users can hit send immediately."
    />
  );
}

function renderEmailPreview(values) {
  const to = values.to || 'hello@example.com';
  const subject = values.subject || 'Quick hello from your QR visitor';
  const body = values.body || 'Hi there! I scanned your QR code and would love to connect.';
  return (
    <PreviewCard
      eyebrow="Email draft"
      title={subject}
      subtitle={`To: ${to}`}
      body={body.length > 240 ? body.slice(0, 240) + '…' : body}
      footer="Opens the visitor’s default mail app with these fields filled in."
      accent="#2563eb"
      illustration={<div style={{ fontSize: 34 }}>✉️</div>}
    />
  );
}

function renderWhatsAppPreview(values) {
  const phone = values.phone || '+1 555 123 4567';
  const text = values.text || 'Hey! 👋 Thanks for scanning our QR — can I help you with anything?';
  return (
    <PreviewCard
      eyebrow="WhatsApp chat"
      title="Start a conversation"
      subtitle={`To: ${phone}`}
      body={<ChatBubble author="Message" text={text} tint="#dcfce7" />}
      accent="#25d366"
      footer="Opens WhatsApp with chat ready to send."
    />
  );
}

function renderFacetimePreview(values) {
  const target = values.target || 'user@example.com';
  return (
    <PreviewCard
      eyebrow="FaceTime call"
      title="Start a FaceTime session"
      subtitle={`Target: ${target}`}
      footer="Opens FaceTime with this address or number."
      accent="#38bdf8"
      illustration={<div style={{ fontSize: 34 }}>🎥</div>}
    />
  );
}

function renderWifiPreview(values) {
  const ssid = values.ssid || 'MyGuestWiFi';
  const auth = values.auth || 'WPA';
  const password = values.password || 'super-secret';
  return (
    <PreviewCard
      eyebrow="Wi‑Fi login"
      title={ssid}
      subtitle={`Security: ${auth}`}
      highlight={`Password: ${password || '—'}`}
      footer="Scanning connects guests without typing credentials."
      accent="#0ea5e9"
      illustration={<div style={{ fontSize: 34 }}>📶</div>}
    />
  );
}

function renderEventPreview(values) {
  const summary = values.summary || 'Product Launch Event';
  const start = formatDateTime(values.start);
  const location = values.location || 'Main HQ Auditorium';
  return (
    <PreviewCard
      eyebrow="Calendar event"
      title={summary}
      subtitle={start}
      body={location}
      footer="Adds the event to the attendee’s calendar app."
      accent="#f97316"
      illustration={<div style={{ fontSize: 34 }}>📅</div>}
    />
  );
}

function renderVcardPreview(values) {
  const name = [values.first, values.last].filter(Boolean).join(' ') || 'Alex Morgan';
  const title = values.title || values.org || 'Brand Ambassador • QRovate';
  const phone = values.phone || '+1 555 123 4567';
  const email = values.email || 'alex@example.com';
  return (
    <PreviewCard
      eyebrow="Digital business card"
      title={name}
      subtitle={title}
      body={`📞 ${phone}\n✉️ ${email}`}
      footer="Creates or updates a contact in their address book."
      accent="#8b5cf6"
      illustration={<div style={{ fontSize: 34 }}>🪪</div>}
    />
  );
}

function renderCryptoPreview(values) {
  const symbol = (values.symbol || 'BTC').toUpperCase();
  const address = values.address || 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7k5x0f3';
  const amount = values.amount;
  return (
    <PreviewCard
      eyebrow="Crypto payment"
      title={`${symbol} Payment`}
      subtitle={amount ? `Requesting ${amount} ${symbol}` : 'Ready to receive funds'}
      body={`Wallet: ${address.slice(0, 16)}…${address.slice(-6)}`}
      footer="Scanner opens the sender’s wallet with these details."
      accent="#f59e0b"
      illustration={<div style={{ fontSize: 34 }}>🪙</div>}
    />
  );
}

function renderPayPalPreview(values) {
  const username = values.username || 'yourbusiness';
  const amount = values.amount;
  return (
    <PreviewCard
      eyebrow="PayPal.me"
      title={`Pay @${username}`}
      subtitle={amount ? `Amount requested: ${Money({ amount })}` : 'No amount requested — payer chooses'}
      footer="Opens PayPal with your profile pre-selected."
      accent="#0070ba"
      illustration={<div style={{ fontSize: 34 }}>💸</div>}
    />
  );
}

function renderUPIPreview(values) {
  const vpa = values.vpa || 'merchant@upi';
  const name = values.name || 'Your business';
  const amount = values.amount;
  return (
    <PreviewCard
      eyebrow="UPI Payment"
      title={name}
      subtitle={`VPA: ${vpa}`}
      highlight={amount ? `Collecting ${amount} INR` : 'Amount entered by payer'}
      footer="Compatible with Google Pay, PhonePe, Paytm, and more."
      accent="#22c55e"
      illustration={<div style={{ fontSize: 34 }}>🇮🇳</div>}
    />
  );
}

function renderLocationPreview(values) {
  if (values.query) {
    return (
      <PreviewCard
        eyebrow="Maps search"
        title={firstLine(values.query, 'Pinned location')}
        subtitle="Opens in Maps with this search query"
        footer="Great for venues without an exact address."
        accent="#ef4444"
        illustration={<div style={{ fontSize: 34 }}>📍</div>}
      />
    );
  }
  const coords = values.lat && values.lng ? `${values.lat}, ${values.lng}` : '0,0';
  return (
    <PreviewCard
      eyebrow="Pinned coordinates"
      title={coords}
      subtitle="Opens the map at these coordinates"
      footer="Perfect for outdoor events or pop-up shops."
      accent="#ef4444"
      illustration={<div style={{ fontSize: 34 }}>🗺️</div>}
    />
  );
}

function renderEpcPreview(values) {
  const name = values.name || 'ACME GmbH';
  const iban = values.iban || 'DE89 3704 0044 0532 0130 00';
  const amount = values.amount ? `${values.amount} EUR` : 'Amount optional';
  return (
    <PreviewCard
      eyebrow="SEPA transfer"
      title={name}
      subtitle={`IBAN: ${iban}`}
      highlight={amount}
      footer="Customers can pay instantly with their banking app."
      accent="#0ea5e9"
      illustration={<div style={{ fontSize: 34 }}>🇪🇺</div>}
    />
  );
}

function renderPixPreview(values) {
  const payload = values.payload || 'Ready to paste your PIX payload';
  return (
    <PreviewCard
      eyebrow="PIX payment"
      title="PIX QR"
      body={payload.length > 180 ? payload.slice(0, 180) + '…' : payload}
      footer="Compatible with all Brazilian banks that support PIX."
      accent="#0ea5e9"
      illustration={<div style={{ fontSize: 34 }}>🇧🇷</div>}
    />
  );
}

const RENDERERS = {
  URL: renderUrlPreview,
  TEXT: renderTextPreview,
  Phone: renderPhonePreview,
  SMS: renderSMSPreview,
  Email: renderEmailPreview,
  Whatsapp: renderWhatsAppPreview,
  Facetime: renderFacetimePreview,
  WiFi: renderWifiPreview,
  Event: renderEventPreview,
  Vcard: renderVcardPreview,
  Location: renderLocationPreview,
  Crypto: renderCryptoPreview,
  PayPal: renderPayPalPreview,
  'UPI Payment': renderUPIPreview,
  'EPC Payment': renderEpcPreview,
  'PIX Payment': renderPixPreview
};

export default function TemplatePreview({ type, values }) {
  const renderer = RENDERERS[type];
  if (!renderer) {
    return (
      <div style={paneStyle}>
        <div style={headerStyle}>{type} preview</div>
        <div style={subtitleStyle}>Preview coming soon for this template.</div>
        <div style={footerStyle}>You can still configure the destination while we finish this design.</div>
      </div>
    );
  }

  const content = renderer(values || {});
  return content;
}
