import React from 'react';

export default function CookieBanner({ onAccept, onReject, onDetails, consent }) {
  const statusLabel = consent === 'accepted'
    ? 'You previously accepted optional cookies.'
    : consent === 'rejected'
      ? 'You have disabled optional cookies.'
      : 'You have not set a preference yet.';
  return (
    <div className="cookie-banner" role="dialog" aria-live="polite">
      <div className="cookie-content">
        <div className="cookie-copy">
          <span className="cookie-pill">Cookies</span>
          <h3>We use cookies to power analytics and improve your experience.</h3>
          <p>
            Accepting lets us measure scans, remember preferences, and keep the workspace secure. You can opt out of non-essential cookies at any time.
          </p>
          <span className="cookie-status">{statusLabel}</span>
        </div>
        <div className="cookie-actions">
          <button type="button" className="btn-secondary ghost" onClick={onDetails}>
            Manage
          </button>
          <button type="button" className="btn-secondary" onClick={onReject}>
            Reject
          </button>
          <button type="button" className="btn-primary" onClick={onAccept}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
