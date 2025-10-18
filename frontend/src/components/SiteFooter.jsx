import React from 'react';

export default function SiteFooter({ onShowTerms, onShowPrivacy }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">© {new Date().getFullYear()} QRovate — Free SVG downloads after login.</div>
        <div className="footer-links">
          <button type="button" onClick={onShowTerms}>Terms</button>
          <button type="button" onClick={onShowPrivacy}>Privacy</button>
        </div>
      </div>
    </footer>
  );
}
