import React from 'react';
import GlassCard from './ui/GlassCard.jsx';
import SectionHeading from './ui/SectionHeading.jsx';

function HeroIllustration() {
  return (
    <div className="hero-illustration" aria-hidden="true">
      <div className="hero-gradient" />
      <svg className="hero-svg" viewBox="0 0 360 240">
        <defs>
          <linearGradient id="heroOrb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="heroCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
        </defs>
        <g className="hero-orbits">
          <ellipse cx="180" cy="110" rx="120" ry="78" fill="none" stroke="rgba(255,255,255,0.32)" strokeDasharray="6 12" />
          <ellipse cx="180" cy="110" rx="150" ry="102" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="4 10" />
        </g>
        <g className="hero-orbit-dot">
          <circle cx="280" cy="80" r="6" fill="#22d3ee" />
          <circle cx="92" cy="60" r="7" fill="#fbbf24" />
          <circle cx="130" cy="180" r="6" fill="#a855f7" />
        </g>
        <g className="hero-main-card">
          <rect x="120" y="75" width="160" height="112" rx="26" fill="url(#heroCard)" stroke="rgba(148,163,184,0.28)" />
          <text x="140" y="110" className="hero-kpi-eyebrow">LIVE SCANS</text>
          <text x="140" y="148" className="hero-kpi-value">3,248</text>
          <text x="140" y="176" className="hero-kpi-sub">Dynamic redirects active</text>
        </g>
      </svg>
    </div>
  );
}

export default function DashboardSummary({ user, onCreateNew, onOpenCodes }) {
  const verified = user.email_verified !== false;
  const name = user.email.split('@')[0] || 'there';
  const planLabel = user.is_pro ? 'Pro plan active' : `Free plan · ${user.trial_days_left} days left`;
  const studioShortcuts = [
    { label: 'Dynamic', icon: '⚡', description: 'Editable URLs, analytics, retargeting.', action: () => onCreateNew?.({ type: 'dynamic-new', codeId: null }) },
    { label: 'Static', icon: '🎨', description: 'Instant SVG/PNG exports encoded with data.', action: () => onCreateNew?.({ type: 'static-new', codeId: null }) },
    { label: 'Templates', icon: '🗂️', description: 'Start from curated campaign layouts.', action: onOpenCodes }
  ];

  const metrics = [
    { label: 'Dynamic codes live', value: user.dynamic_count ?? '—', trend: '+12%', tone: 'success' },
    { label: 'Static designs saved', value: user.static_count ?? '—', trend: '+4 this week', tone: 'warning' },
    { label: 'Scans this week', value: user.scan_count ?? '—', trend: '+18% vs last', tone: 'info' }
  ];

  const highlights = [
    { title: 'Smart redirect', description: 'Route scanners by device to optimize conversions.', icon: '🧭' },
    { title: 'Schedule launch', description: 'Pick a go-live date for your next campaign.', icon: '⏱️' },
    { title: 'Add branded frame', description: 'Apply seasonal colours and CTAs in minutes.', icon: '🎨' }
  ];

  const tasks = [
    verified ? null : 'Verify your email to unlock analytics and automations.',
    user.is_pro
      ? 'Schedule a redirect to test the new automation workflow.'
      : 'Upgrade to Pro to add logos, schedule redirects, and track deeper analytics.',
    'Create at least one static and one dynamic QR to finish onboarding.'
  ].filter(Boolean);

  const timeline = [
    { time: 'Today', detail: 'Launch the “Spring Pop-up” QR experience.', icon: '🚀' },
    { time: 'Tomorrow', detail: 'Review campaign scans and export PDF kit.', icon: '📈' },
    { time: 'Friday', detail: 'Share static codes with your print vendor.', icon: '🖨️' }
  ];

  return (
    <div className="dashboard-summary">
      <div className="dashboard-summary-grid">
        <GlassCard className="summary-hero dashboard-animate" style={{ '--delay': '0s' }}>
          <div>
            <div className="hero-copy">
              <SectionHeading
                eyebrow="Workspace overview"
                title={`Welcome back, ${name}!`}
                subtitle="Everything you launch from here is tracked, branded, and ready to update without reprinting."
              />
              <div className="summary-actions">
                <button
                  className="btn-primary"
                  onClick={()=>onCreateNew?.({ type: 'dynamic-new', codeId: null })}
                >
                  Create dynamic QR
                </button>
                <button
                  className="btn-secondary ghost"
                  onClick={()=>onCreateNew?.({ type: 'static-new', codeId: null })}
                >
                  Open static studio
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="summary-card metrics-card dashboard-animate" style={{ '--delay': '0.05s' }}>
          <h3>Performance pulse</h3>
          <div className="summary-metrics-grid">
            {metrics.map((metric, idx) => (
              <div
                key={metric.label}
                className="metric-card"
                style={{ '--delay': `${idx * 0.08}s` }}
              >
                <span className="metric-label">{metric.label}</span>
                <strong className={`metric-value ${metric.tone}`}>{metric.value}</strong>
                <span className="metric-trend">{metric.trend}</span>
              </div>
            ))}
          </div>
        </GlassCard>


        <GlassCard className="summary-card studio-card dashboard-animate" style={{ '--delay': '0.34s' }}>
          <h3>Launch a new experience</h3>
          <p className="summary-text">Pick the flow that matches your project and we’ll pre-load best-practice settings.</p>
          <div className="studio-grid">
            {studioShortcuts.map((shortcut, idx) => (
              <button
                key={shortcut.label}
                type="button"
                className="studio-tile"
                style={{ '--delay': `${idx * 0.08}s` }}
                onClick={shortcut.action}
              >
                <div className="studio-icon">{shortcut.icon}</div>
                <div className="studio-content">
                  <strong>{shortcut.label}</strong>
                  <p>{shortcut.description}</p>
                </div>
                <span className="studio-arrow">→</span>
              </button>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
