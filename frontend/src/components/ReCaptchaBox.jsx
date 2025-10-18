import React, { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
let scriptPromise = null;

function loadRecaptchaScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export default function ReCaptchaBox({ onChange }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState('');
  const hasSiteKey = Boolean(SITE_KEY);

  useEffect(() => {
    let cancelled = false;

    if (!hasSiteKey) {
      onChange?.('dev-human');
      return () => onChange?.(null);
    }

    onChange?.(null);
    setError('');

    loadRecaptchaScript()
      .then(() => {
        if (cancelled) return;
        if (!window.grecaptcha) {
          setError('reCAPTCHA unavailable.');
          return;
        }
        window.grecaptcha.ready(() => {
          if (cancelled || !containerRef.current) return;
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: SITE_KEY,
            callback(token) {
              onChange?.(token);
            },
            'expired-callback': () => onChange?.(null),
            'error-callback': () => {
              setError('Captcha error. Please reload the challenge.');
              onChange?.(null);
            }
          });
        });
      })
      .catch(() => {
        if (!cancelled) setError('Captcha failed to load.');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try { window.grecaptcha.reset(widgetIdRef.current); } catch {}
      }
      onChange?.(null);
    };
  }, [hasSiteKey, onChange]);

  if (!hasSiteKey) {
    return (
      <div className="auth-captcha-note">
        Human check disabled in development. Set <code>VITE_RECAPTCHA_SITE_KEY</code> to enable Google reCAPTCHA.
      </div>
    );
  }

  return (
    <div className="auth-captcha">
      <div ref={containerRef} className="auth-captcha-box" />
      {error && <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
