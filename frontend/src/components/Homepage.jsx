import React, { useMemo } from 'react';
import InstantGenerator from './InstantGenerator.jsx';

const FEATURE_CARDS = [
  {
    title: '🎨 Custom Design',
    description: 'Gradients, frames, and logo overlays that feel on-brand out of the box.'
  },
  {
    title: '📊 Dynamic & Trackable',
    description: 'Swap destinations anytime and watch real scan analytics roll in.'
  },
  {
    title: '⚡ Fast & Free',
    description: 'Generate unlimited static QR codes. No signup walls, ever.'
  },
  {
    title: '🖨️ Print-Ready Files',
    description: 'Export PNG, SVG, PDF, or EPS so your codes look crisp everywhere.'
  }
];

const HOW_STEPS = [
  {
    step: '①',
    title: 'Enter your link',
    copy: 'Drop in any URL, text, or menu and preview the QR instantly.',
    action: { label: 'Start generating', type: 'link', target: '#quick-generator' }
  },
  {
    step: '②',
    title: 'Customize the design',
    copy: 'Pick colors, shapes, and add your logo to match your brand or event.',
    action: { label: 'See styling options', type: 'link', target: '#quick-generator' }
  },
  {
    step: '③',
    title: 'Download & share',
    copy: 'Export in PNG, SVG, PDF, or EPS. Ready for print, packaging, and social posts.',
    action: { label: 'Save to dashboard', type: 'auth' }
  }
];

const TRUST_POINTS = [
  'No signup for static codes',
  'GDPR-safe & hosted in the EU/US',
  'Works for menus, events, and retail displays',
  'Learn how to make QR codes that always scan'
];

const USE_CASES = ['Restaurants', 'Events', 'Packaging', 'Creators', 'Product inserts', 'Personal links'];

export default function Homepage({ onRequestAuth }) {
  const features = useMemo(() => FEATURE_CARDS, []);
  const steps = useMemo(() => HOW_STEPS, []);

  function handleAction(action) {
    if (!action) return;
    if (action.type === 'link' && action.target) {
      document.querySelector(action.target)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (action.type === 'auth') {
      onRequestAuth?.();
    }
  }

  return (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-gradient" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-badge">Free QR code platform</span>
            <h1>Create Beautiful, Free QR Codes — Instantly.</h1>
            <p>No signup required. Download in PNG, SVG, or PDF. Free forever for static codes.</p>
            <div className="hero-actions">
              <a className="btn-primary" href="#quick-generator">Start Generating</a>
              <button className="btn-secondary ghost" onClick={() => onRequestAuth?.()}>Try Pro (Dynamic QR)</button>
            </div>
            <div className="hero-proof">
              <strong>Trusted by 10,000+ creators &amp; small businesses</strong>
              <div className="hero-logos">
                {USE_CASES.map(use => (
                  <span key={use} className="hero-logo">{use}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-carousel">
              <div className="hero-card float-fast">
                <div className="hero-card-qr" />
                <div className="hero-card-caption">
                  <span className="hero-card-label">Gradient QR</span>
                  <span className="hero-card-meta">SVG • Logo badge</span>
                </div>
              </div>
              <div className="hero-card float-med">
                <div className="hero-card-qr alt" />
                <div className="hero-card-caption">
                  <span className="hero-card-label">Event Ticket</span>
                  <span className="hero-card-meta">Dynamic • Scan stats</span>
                </div>
              </div>
            </div>
            <div className="hero-glow" />
          </div>
        </div>
      </section>

      <section id="quick-generator" className="generator-wrap fade-up">
        <div className="halo halo-left" />
        <div className="halo halo-right" />
        <div className="panel generator-panel">
          <div className="panel-header">
            <span className="eyebrow">Instant QR Generator</span>
            <h2>Generate, customize, and download in seconds</h2>
            <p>Design your QR, export as PNG, SVG, PDF, or save it to your dashboard when you’re ready.</p>
          </div>
          <InstantGenerator isLoggedIn={false} onRequestAuth={onRequestAuth} showHeading={false} />
          <div className="panel-footer">
            <span className="dot online" />
            <span>Pro tip: Add a logo to boost scan confidence by 80%.</span>
          </div>
        </div>
      </section>

      <section className="features-section fade-up">
        <div className="section-heading">
          <h2>Why marketers switch to Qrovate</h2>
          <p>Everything you need to launch a QR experience with polish and real analytics.</p>
        </div>
        <div className="features-grid">
          {features.map(card => (
            <article className="glass feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="how-section fade-up">
        <div className="section-heading">
          <h2>How it works</h2>
          <p>Three simple steps to a QR code that looks great and delivers results.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ step, title, copy, action }) => (
            <article className="glass step-card" key={title}>
              <div className="step-pill">{step}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
              {action && (
                <button
                  className={action.type === 'auth' ? 'btn-primary' : 'btn-outline'}
                  onClick={() => handleAction(action)}
                >
                  {action.label}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="upsell-section fade-up">
        <div className="upsell-card glass">
          <div>
            <span className="eyebrow">Dynamic QR Pro</span>
            <h2>Need to edit a QR after printing?</h2>
            <p>
              Upgrade to Dynamic QR and unlock scan analytics, A/B targeting, scheduled redirects, and team
              workspaces. Perfect for campaigns that need to change on the fly.
            </p>
          </div>
          <div className="upsell-actions">
            <button className="btn-primary" onClick={() => onRequestAuth?.()}>Try Pro (Beta)</button>
            <button className="btn-secondary ghost" onClick={() => onRequestAuth?.()}>See dashboard tour</button>
          </div>
        </div>
      </section>

      <section className="trust-section fade-up">
        <div className="trust-grid">
          <div className="trust-card glass">
            <h2>Built for teams that need trust &amp; polish</h2>
            <ul>
              {TRUST_POINTS.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="trust-card glass">
            <h3>Use cases</h3>
            <div className="usecase-tags">
              {USE_CASES.map(use => (
                <span key={use}>{use}</span>
              ))}
            </div>
            <p className="trust-note">
              See how hospitality brands keep menus fresh, event teams swap last-minute schedules, and creators
              launch digital downloads with QRovate.
            </p>
            <a className="btn-link" href="#quick-generator">Explore quick generator →</a>
          </div>
        </div>
      </section>

      <section className="cta-section glass fade-up">
        <div className="cta-inner">
          <div className="cta-badge">Launch today</div>
          <h2>Ready to create a QR that always scans?</h2>
          <p>Spin up your free account, design stunning codes, and track every scan with confidence.</p>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => onRequestAuth?.()}>Create a free account</button>
            <button className="btn-secondary ghost" onClick={() => document.querySelector('#quick-generator')?.scrollIntoView({ behavior: 'smooth' })}>
              Generate without signing up
            </button>
          </div>
        </div>
      </section>

      <div className="floating-cta">
        <span>Need a QR fast?</span>
        <a href="#quick-generator" className="btn-primary">Open Quick Generator</a>
        <button className="btn-secondary ghost" onClick={() => onRequestAuth?.()}>Unlock Dynamic</button>
      </div>
    </div>
  );
}
