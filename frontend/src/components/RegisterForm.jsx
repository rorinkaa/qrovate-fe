import React, { useEffect, useState } from 'react';
import { api } from '../api';
import ReCaptchaBox from './ReCaptchaBox.jsx';
import { FREE_PLAN_DYNAMIC_LIMIT, UPGRADES_ENABLED } from '../config/planLimits.js';

const requireCaptcha = Boolean(import.meta.env.VITE_RECAPTCHA_SITE_KEY);

export default function RegisterForm({ onRegister, onNotice }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('free');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const freePlanOption = UPGRADES_ENABLED
    ? `Free — unlimited static QR, ${FREE_PLAN_DYNAMIC_LIMIT} dynamic QR, PNG/SVG exports`
    : 'Free — unlimited static & dynamic QR (billing coming soon)';
  const freePlanHint = UPGRADES_ENABLED
    ? `Free plan includes unlimited static QR codes and ${FREE_PLAN_DYNAMIC_LIMIT} dynamic QR${FREE_PLAN_DYNAMIC_LIMIT === 1 ? '' : 's'}.`
    : 'Free plan includes unlimited static and dynamic QR codes while paid plans are unavailable.';

  useEffect(() => { setMsg(''); }, [plan]);

  function ensureCaptcha(){
    if (!requireCaptcha) return true;
    if (captchaToken) return true;
    setMsg('Please complete the captcha challenge first.');
    return false;
  }

  async function submit(e){
    e.preventDefault();
    setMsg('');
    if (busy) return;
    if (password.length < 8) {
      setMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!ensureCaptcha()) return;
    setBusy(true);
    try{
      const data = await api('/auth/register',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password, plan, captchaToken})
      });
      if (data?.requires_verification) {
        onNotice?.({
          type: 'success',
          text: 'Account created! Check your inbox for a verification link before logging in.'
        });
        if (data?.dev_verification_url) {
          console.info('[dev] verification link:', data.dev_verification_url);
        }
        setEmail('');
        setPassword('');
        setCaptchaToken(null);
        setCaptchaKey(k => k + 1);
      } else {
        const payload = data?.token ? { ...data.user, token: data.token } : data.user;
        onNotice?.(null);
        onRegister(payload);
      }
    }catch(err){
      setMsg(err.message || 'Registration failed.');
    }finally{
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          placeholder="Create a secure password"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="register-plan">Plan</label>
        <select
          id="register-plan"
          value={plan}
          onChange={e=>setPlan(e.target.value)}
        >
          <option value="free">{freePlanOption}</option>
          <option value="pro">Pro — analytics, scheduling, PDF/EPS, team seats</option>
        </select>
      </div>
      {requireCaptcha && <ReCaptchaBox key={captchaKey} onChange={setCaptchaToken} />}
      <button type="submit" className="btn-primary auth-submit" disabled={busy}>
        {busy ? 'Creating…' : 'Create account'}
      </button>
      <p className="auth-hint">{freePlanHint}</p>
      {msg && <div className="auth-error">{msg}</div>}
    </form>
  );
}
