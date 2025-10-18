import React, { useMemo } from 'react';
import InstantGenerator from './InstantGenerator.jsx';


const FEATURE_CARDS = [
  {
    title: 'Customize Design',
    action: 'generator',
    icon: '🎨',
    body: 'Pick gradients, frames, and logos in seconds — make every QR match your brand perfectly.'
  },
  {
    title: 'Edit Anytime',
    action: 'login',
    icon: '🧭',
    body: 'Dynamic links let you swap destinations instantly without re-printing your codes.'
  },
  {
    title: 'Track Scans',
    action: 'tutorial',
    icon: '📈',
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
          </div>
        </div>
      </section>

      <section id="quick-generator" className="generator-wrap fade-up">
        <div className="halo halo-left" />
        <div className="halo halo-right" />
        <div className="panel generator-panel">
          <div className="panel-header">
            <span className="eyebrow">Instant QR Generator</span>
            <h2>Create a QR in seconds</h2>
            <p>Design your QR, download for print, or save it once you sign up.</p>
          </div>
          <InstantGenerator isLoggedIn={false} onRequestAuth={onRequestAuth} showHeading={false} />
          <div className="panel-footer">
            <span className="dot online" />
            <span>Pro tip: Upload a logo to increase brand recall by 80%.</span>
          </div>
        </div>
      </section>

      <section className="features-section fade-up">
        <div className="section-heading">
          <h2>Why teams choose QRovate</h2>
          <p>Everything you need from first scan to full campaign analytics.</p>
        </div>
        <div className="features-grid">
          {featureList.map(card => (
            <article key={card.title} className="glass feature-card" onClick={()=>{
              if(card.action === 'generator'){
                document.getElementById('quick-generator')?.scrollIntoView({ behavior:'smooth' });
              } else if(card.action === 'login'){
                onRequestAuth?.();
              } else if(card.action === 'tutorial'){
                document.getElementById('how-it-works')?.scrollIntoView({ behavior:'smooth' });
              }
            }}>
              <div className="feature-head">
                <span className="feature-icon">{card.icon}</span>
                <h3>{card.title}</h3>
              </div>
              <p>{card.body}</p>
              <div className="feature-divider" />
              <span className="feature-link">See how it works →</span>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="how-section fade-up">
        <div className="section-heading">
          <h2>How it works</h2>
          <p>From first scan to analytics — here’s what happens when you click through.</p>
        </div>
        <div className="steps-grid">
          <article className="glass step-card">
            <div className="step-pill">Step 1</div>
            <h3>Create in seconds</h3>
            <p>Paste your link and brand it with colors or logos. The preview updates as you type.</p>
            <button className="btn-outline" onClick={()=>document.getElementById('quick-generator')?.scrollIntoView({behavior:'smooth'})}>Try the generator</button>
          </article>
          <article className="glass step-card">
            <div className="step-pill">Step 2</div>
            <h3>Save &amp; edit anytime</h3>
            <p>Sign up (it’s free) to store your QR codes, swap destinations, and keep branding ready.</p>
            <button className="btn-primary" onClick={()=>onRequestAuth?.()}>Create free account</button>
          </article>
          <article className="glass step-card analytics-card">
            <div className="step-pill">Step 3</div>
            <h3>Track scans</h3>
            <p>Monitor location, time, and device performance with built-in analytics dashboards.</p>
            <div className="analytics-peek">
              <div className="analytics-header">
                <span className="spark-line" />
                <span className="badge-live">Live demo</span>
              </div>
              <div className="analytics-body">
                <div>
                  <strong>1,248</strong>
                  <small>Total scans</small>
                </div>
                <div>
                  <strong>34%</strong>
                  <small>Repeat visitors</small>
                </div>
                <div>
                  <strong>Top</strong>
                  <small>NYC · Berlin · Tokyo</small>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="cta-section glass fade-up">
        <div className="cta-inner">
          <div className="cta-badge">Launch in minutes</div>
          <h2>Ready to launch your QR experience?</h2>
          <p>Create a free account in seconds and unlock dynamic QR codes, analytics, and smart rules.</p>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => onRequestAuth?.()}>Create a Free Account</button>
            <button className="btn-secondary ghost" onClick={() => onRequestAuth?.()}>View live demo</button>
          </div>
        </div>
      </section>
    </div>
  );
}
