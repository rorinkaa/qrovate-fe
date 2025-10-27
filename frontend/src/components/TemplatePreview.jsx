import React from 'react';
import { TEMPLATE_LIBRARY, isComingSoonTemplate } from './TemplateDataForm.jsx';
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

  if (isComingSoonTemplate(normalizedType)) {
    return {
      eyebrow: 'Coming soon',
      title: baseMeta?.title || 'Template in development',
      subtitle: baseMeta?.description || 'We’re polishing this experience.',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>We’re putting the finishing touches on this template. Check back shortly for the full interactive preview.</p>
        </div>
      ),
      accent,
      icon,
      inlineSummary: 'Launching soon',
      tip: 'Pick another template or revisit when this goes live.'
    };
  }

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
      const headline = values.headline || 'Share an announcement';
      const subheadline = values.subheadline || 'Give scanners the context they need.';
      const body = values.text || 'Hello there! Welcome to our QR.';
      const bullets = (values.bulletPoints || '').split('\n').filter(Boolean);
      return finalize({
        eyebrow: 'Branded content',
        title: headline,
        subtitle: subheadline,
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>{body}</div>
            {bullets.length > 0 && (
              <ul style={{ paddingLeft: 18, margin: 0, color: '#475569', fontSize: 14 }}>
                {bullets.slice(0, 3).map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
            {(values.ctaLabel || values.secondaryCtaLabel) && (
              <div style={{ display: 'flex', gap: 8 }}>
                {values.ctaLabel && <span style={{ background: accent, color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>{values.ctaLabel}</span>}
                {values.secondaryCtaLabel && <span style={{ fontSize: 12, color: accent }}>{values.secondaryCtaLabel}</span>}
              </div>
            )}
          </div>
        ),
        inlineSummary: headline.slice(0, 70),
        tip: 'Use for landing copy with CTAs and bullet highlights.'
      });
    }
    case 'LINKTREE': {
      const heroTitle = values.heroTitle || 'Explore our world';
      const heroSubtitle = values.heroSubtitle || 'Stay connected across every channel.';
      const intro = values.intro || '';
      const accentColor = values.accentColor || accent;
      const textColor = values.textColor || '#0f172a';
      const buttonStyle = String(values.buttonStyle || 'rounded').toLowerCase();
      const primary = (values.primaryCtaLabel && values.primaryCtaUrl)
        ? { label: values.primaryCtaLabel, url: values.primaryCtaUrl }
        : null;
      const links = (values.secondaryLinks || '')
        .split('\n')
        .map(line => {
          const [label, url] = line.split('|').map(part => part?.trim());
          if (!label || !url) return null;
          return { label, url };
        })
        .filter(Boolean)
        .slice(0, 5);
      const totalLinks = (primary ? 1 : 0) + links.length;

      return finalize({
        eyebrow: 'Link hub',
        title: heroTitle,
        subtitle: heroSubtitle,
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: textColor }}>
            {intro && (
              <p style={{ margin: 0, lineHeight: 1.6 }}>{intro}</p>
            )}
            {primary && (
              <button
                type="button"
                style={{
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: buttonStyle === 'pill' ? 999 : 16,
                  padding: '12px 18px',
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: '0 8px 20px rgba(79, 70, 229, 0.18)'
                }}
              >
                {primary.label}
              </button>
            )}
            {links.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link, idx) => (
                  <div
                    key={`${link.label}-${idx}`}
                    style={{
                      borderRadius: buttonStyle === 'outline' ? 16 : 14,
                      border: `1px solid ${buttonStyle === 'outline' ? accentColor : 'rgba(148,163,184,0.3)'}`,
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                      color: buttonStyle === 'outline' ? accentColor : textColor,
                      background: buttonStyle === 'outline' ? 'transparent' : '#ffffff'
                    }}
                  >
                    <span>{link.label}</span>
                    <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Visit</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
        inlineSummary: totalLinks > 0 ? `${totalLinks} link${totalLinks === 1 ? '' : 's'} ready` : 'Add links to activate',
        tip: 'Perfect for bios, campaigns, and curated resources.',
        accent: accentColor
      }, { preserveAccent: true });
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
      const venue = values.venue || '';
      return finalize({
        eyebrow: 'Wi‑Fi login',
        title: ssid,
        subtitle: venue || `Security: ${auth}`,
        highlight: `Password: ${password || '—'}`,
        body: values.notes ? `Notes: ${values.notes}` : undefined,
        inlineSummary: `Wi‑Fi SSID “${ssid}”`,
        tip: 'Scanning connects guests without typing credentials.'
      });
    }
    case 'EVENT': {
      const summary = values.summary || 'Product Launch Event';
      const start = formatDateTime(values.start);
      const location = values.location || 'Main HQ Auditorium';
      const agenda = toLines(values.agenda);
      const timezone = values.timezone || '';
      return finalize({
        eyebrow: 'Calendar event',
        title: summary,
        subtitle: timezone ? `${start} • ${timezone}` : start,
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div><strong>Venue:</strong> {location}</div>
            {agenda.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569' }}>
                {agenda.slice(0, 3).map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            )}
            {values.ctaLabel && <div style={{ color: accent }}>CTA: {values.ctaLabel}</div>}
          </div>
        ),
        inlineSummary: `${summary} • ${start}`,
        tip: 'Adds the event to the attendee’s calendar app.'
      });
    }
    case 'VCARD': {
      const name = [values.first, values.last].filter(Boolean).join(' ') || 'Alex Morgan';
      const title = values.title || values.org || 'Brand Ambassador • QRovate';
      const phone = values.phone || '+1 555 123 4567';
      const email = values.email || 'alex@example.com';
      const pronouns = values.pronouns || '';
      const bio = values.bio || '';
      const socials = [
        { label: 'LinkedIn', value: values.linkedin },
        { label: 'Instagram', value: values.instagram },
        { label: 'Twitter', value: values.twitter },
        { label: 'Facebook', value: values.facebook },
        { label: 'Website', value: values.url }
      ].filter(item => !!item.value);
      return finalize({
        eyebrow: 'Digital business card',
        title: name,
        subtitle: pronouns ? `${title} • ${pronouns}` : title,
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>Phone: {phone}</div>
            <div>Email: {email}</div>
            {bio && <div style={{ fontSize: 13, color: '#475569' }}>{bio}</div>}
            {socials.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {socials.slice(0, 4).map(item => (
                  <span key={item.label} style={{ padding: '4px 10px', borderRadius: 999, background: `${accent}16`, color: accent, fontSize: 11, fontWeight: 600 }}>{item.label}</span>
                ))}
              </div>
            )}
          </div>
        ),
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
      const title = values.title || '';
      const description = values.description || '';
      const tags = (values.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
      const notes = (values.notes || '').split('\n').filter(Boolean);
      const filename = values.fileName || (url ? (() => {
        try {
          const parts = String(url).split('/');
          return decodeURIComponent(parts[parts.length - 1] || '') || 'document.pdf';
        } catch {
          return 'document.pdf';
        }
      })() : 'document.pdf');
      return finalize({
        eyebrow: 'PDF handout',
        title: title || filename,
        subtitle: description || (url ? `Hosted on ${host}` : 'Tap to tailor your PDF download page.'),
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
            <div style={{ display: 'flex', gap: 12 }}>
              {values.thumbnailUrl && (
                <img
                  src={values.thumbnailUrl}
                  alt=""
                  style={{
                    width: 76,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 10,
                    boxShadow: '0 18px 32px -18px rgba(15,23,42,0.35)'
                  }}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="file" size={28} style={{ color: accentColor }} />
                  <div style={{ fontWeight: 600, fontSize: 16, color: textColor }}>{filename}</div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 12 }}>
                  {values.version && <span>Version {values.version}</span>}
                  {values.fileSize && <span>{values.fileSize}</span>}
                </div>
                {values.updatedAt && (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Updated {values.updatedAt}</div>
                )}
              </div>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.slice(0, 5).map(tag => (
                  <span key={tag} style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: `${accentColor}15`,
                    color: accentColor,
                    fontSize: 11,
                    fontWeight: 600
                  }}>{tag}</span>
                ))}
              </div>
            )}
            <div style={{ background: '#f8fafc', borderRadius: 6, padding: '12px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor, marginBottom: 6 }}>Version notes</strong>
              {notes.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {notes.slice(0, 3).map((note, idx) => <li key={idx}>{note}</li>)}
                </ul>
              ) : (
                <div>Add bullet points to highlight what changed.</div>
              )}
            </div>
            <button
              style={{
                background: accentColor,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 'auto',
                alignSelf: 'flex-start'
              }}
            >
              <Icon name="download" size={16} />
              <span>Download PDF</span>
            </button>
          </div>
        ),
        inlineSummary: url ? `PDF from ${host}` : 'Upload PDF file.',
        tip: 'Opens the PDF in the browser or downloads it.'
      });
    }
    case 'MP3': {
      const url = values.fileUrl || '';
      const host = cleanHost(url);
      const bgColor = values.backgroundColor || '#0f172a';
      const textColor = values.textColor || '#e2e8f0';
      const accentColor = values.accentColor || '#38bdf8';
      const title = values.title || 'Featured track';
      const artist = values.artist || 'Artist name';
      const album = values.album || '';
      const coverUrl = values.coverUrl || '';
      const streaming = (values.streamingLinks || '').split('\n').map(line => {
        const [label, link] = line.split('|').map(part => part?.trim());
        if (!label || !link) return null;
        return { label, link };
      }).filter(Boolean);
      const moreTracks = (values.moreTracks || '').split('\n').map(line => {
        const [trackTitle, duration, link] = line.split('|').map(part => part?.trim());
        if (!trackTitle) return null;
        return { title: trackTitle, duration, link };
      }).filter(Boolean);
      const filename = values.fileName || (url ? (() => {
        try {
          const parts = String(url).split('/');
          return decodeURIComponent(parts[parts.length - 1] || '') || 'audio.mp3';
        } catch {
          return 'audio.mp3';
        }
      })() : 'audio.mp3');
      return finalize({
        eyebrow: 'Music landing',
        title,
        subtitle: artist ? `${artist}${album ? ` • ${album}` : ''}` : (url ? host : 'Upload audio to design the player.'),
        body: (
          <div style={{
            background: bgColor,
            borderRadius: 12,
            padding: '18px',
            border: `1px solid ${accentColor}25`,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minHeight: 220
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 24, overflow: 'hidden', background: '#1f2937', boxShadow: '0 24px 40px -28px rgba(15,23,42,0.65)' }}>
                {coverUrl ? (
                  <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                    <Icon name="audio" size={30} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, color: textColor, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>{artist}{album ? ` • ${album}` : ''}</div>
                {streaming.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {streaming.slice(0, 2).map(item => (
                      <span key={item.label} style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 999, fontSize: 11 }}>{item.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {url ? (
              <audio
                controls
                style={{ width: '100%', borderRadius: 12, background: 'rgba(15,23,42,0.5)', padding: 4 }}
              >
                <source src={url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div style={{
                background: 'rgba(15,23,42,0.55)',
                borderRadius: 12,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  fontSize: 18
                }}>▶</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: textColor }}>Preview Player</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Upload MP3 to enable controls</div>
                </div>
              </div>
            )}
            {streaming.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {streaming.slice(0, 3).map(item => (
                  <span key={item.label} style={{
                    background: '#0b1120',
                    color: accentColor,
                    border: `1px solid ${accentColor}55`,
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: 12
                  }}>{item.label}</span>
                ))}
              </div>
            )}
            {moreTracks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>More from the artist</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {moreTracks.slice(0, 3).map(item => (
                    <div key={item.title} style={{
                      flex: '1 1 0',
                      background: 'rgba(15,23,42,0.6)',
                      borderRadius: 12,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 12,
                      color: '#cbd5f5'
                    }}>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      {item.duration && <div style={{ color: '#94a3b8' }}>{item.duration}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b' }}>{filename}</div>
          </div>
        ),
        inlineSummary: url ? `MP3 from ${host}` : 'Upload audio file.',
        tip: 'Opens an immersive audio landing with player and track list.'
      });
    }
    case 'APPLINK': {
      const headline = values.headline || 'Install our app';
      const subheadline = values.subheadline || 'One link takes scanners to the right store.';
      const features = (values.features || '').split('\n').filter(Boolean);
      const badges = (values.storeBadges || '').split('\n').map(line => {
        const [label] = line.split('|');
        return label?.trim();
      }).filter(Boolean);
      return finalize({
        eyebrow: 'Smart app link',
        title: headline,
        subtitle: subheadline,
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {badges.slice(0, 3).map((label) => (
                <span key={label} style={{ background: `${accent}16`, color: accent, padding: '6px 12px', borderRadius: 999, fontSize: 12 }}>{label}</span>
              ))}
            </div>
            {features.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569' }}>
                {features.slice(0, 3).map((feature, idx) => <li key={idx}>{feature}</li>)}
              </ul>
            )}
          </div>
        ),
        inlineSummary: 'Smart app redirection',
        tip: 'Detects iOS, Android, desktop, and falls back gracefully.'
      });
    }
    case 'GALLERY': {
      const title = values.title || 'Showcase gallery';
      const intro = values.intro || 'Highlight your dishes, projects, or inventory.';
      const items = (values.items || '').split('\n').map(line => {
        const [category, itemTitle] = line.split('|');
        return { category: (category || '').trim(), title: (itemTitle || '').trim() };
      }).filter(item => item.title);
      return finalize({
        eyebrow: 'Gallery/menu',
        title,
        subtitle: intro,
        body: (
          <div style={{ display: 'grid', gap: 8 }}>
            {items.slice(0, 3).map((item, idx) => (
              <div key={idx} style={{ borderRadius: 10, padding: '10px 12px', background: 'rgba(148, 163, 184, 0.14)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{item.title}</span>
                {item.category && <span style={{ color: accent, fontWeight: 600 }}>{item.category}</span>}
              </div>
            ))}
            {values.ctaLabel && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <Icon name="external" size={14} style={{ color: accent }} />
                <span style={{ color: accent }}>{values.ctaLabel}</span>
              </div>
            )}
          </div>
        ),
        inlineSummary: `${items.length} featured items`,
        tip: 'Perfect for menus, lookbooks, and product teasers.'
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
