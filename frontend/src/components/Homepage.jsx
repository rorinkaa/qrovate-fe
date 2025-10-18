import React, { useMemo } from 'react';
import InstantGenerator from './InstantGenerator.jsx';

const FEATURE_CARDS = [
  {
    title: 'Customize Design',
    body: 'Pick gradients, frames, and logos in seconds — make every QR match your brand perfectly.'
  },
  {
    title: 'Edit Anytime',
    body: 'Dynamic links let you swap destinations instantly without re-printing your codes.'
  },
  {
    title: 'Track Scans',
    body: 'Watch real-time analytics to see which campaigns perform best and where scans happen.'
  }
];

export default function Homepage({ onRequestAuth }) {
  const featureList = useMemo(() => FEATURE_CARDS, []);

  return (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-gradient" />
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Create Beautiful &amp; Trackable QR Codes</h1>
            <p>Free to start. Customize colors, add your logo, and watch your scans grow.</p>
            <div className="hero-actions">
              <a href="#quick-generator" className="btn-primary">Generate QR</a>
              <button className="btn-secondary" onClick={() => onRequestAuth?.()}>Save my QR</button>
            </div>
          </div>
          <div className="hero-art">
            <img src="/hero-qr-1.png" alt="Colorful QR mockup" className="hero-qr float-fast" />
            <img src="/hero-qr-2.png" alt="Framed QR mockup" className="hero-qr float-med" />
            <img src="/hero-qr-3.png" alt="Minimal QR mockup" className="hero-qr float-slow" />
          </div>
        </div>
      </section>

      <section id="quick-generator" className="generator-section">
        <div className="section-heading">
          <h2>Instant QR Generator</h2>
          <p>Login to save &amp; track.</p>
        </div>
        <InstantGenerator isLoggedIn={false} />
      </section>

      <section className="features-section">
        <div className="section-heading">
          <h2>Why teams choose QRovate</h2>
          <p>Everything you need from first scan to full campaign analytics.</p>
        </div>
        <div className="features-grid">
          {featureList.map(card => (
            <article key={card.title} className="glass feature-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section glass">
        <div className="cta-inner">
          <h2>Ready to launch your QR experience?</h2>
          <p>Create a free account in seconds and unlock dynamic QR codes, analytics, and smart rules.</p>
          <button className="btn-primary" onClick={() => onRequestAuth?.()}>Create a Free Account</button>
        </div>
      </section>
    </div>
  );
}
