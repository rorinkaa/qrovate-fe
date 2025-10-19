import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import ReCaptchaBox from './ReCaptchaBox.jsx';

const requireCaptcha = Boolean(import.meta.env.VITE_RECAPTCHA_SITE_KEY);

const STEP_LOGIN = 'login';
const STEP_FORGOT = 'forgot';
const STEP_RESEND = 'resend';
const STEP_RESET = 'reset';

export default function LoginForm({ onLogin, onNotice, resetToken = null, onResetConsumed }){
  const [email, setEmail] = useState('test@pro.com');
  const [password, setPassword] = useState('test1234');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(resetToken ? STEP_RESET : STEP_LOGIN);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  useEffect(() => {
    setStep(resetToken ? STEP_RESET : STEP_LOGIN);
    if (resetToken) {
      onNotice?.({ type: 'info', text: 'Enter a new password to finish resetting your account.' });
    }
  }, [resetToken, onNotice]);

  useEffect(() => {
    setMsg('');
    setCaptchaToken(null);
    setCaptchaKey(k => k + 1);
  }, [step]);

  const heading = useMemo(() => {
    switch(step){
      case STEP_FORGOT: return 'Forgot password';
      case STEP_RESEND: return 'Resend verification email';
      case STEP_RESET: return 'Reset your password';
      default: return 'Login';
    }
  }, [step]);

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
    if (!ensureCaptcha()) return;
    if (step !== STEP_LOGIN) return;
    setBusy(true);
    try{
      const data = await api('/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password,captchaToken})
      });
      const payload = data?.token ? { ...data.user, token: data.token } : data.user;
      onNotice?.(null);
      onLogin(payload);
    }catch(err){
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
        onNotice?.({
          type: 'warning',
          text: 'Your email is not verified yet. Click "Resend verification email" to receive a new link.'
        });
        setStep(STEP_RESEND);
      } else {
        setMsg(err.message || 'Login failed');
      }
    }finally{
      setBusy(false);
    }
  }

  async function handleForgot(e){
    e.preventDefault();
    setMsg('');
    if (busy) return;
    if (!ensureCaptcha()) return;
    setBusy(true);
    try{
      await api('/auth/password/forgot', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, captchaToken })
      });
      onNotice?.({
        type: 'success',
        text: 'Password reset link sent. Check your email to continue.'
      });
      setStep(STEP_LOGIN);
    }catch(err){
      setMsg(err.message || 'Unable to send reset email.');
    }finally{
      setBusy(false);
    }
  }

  async function handleResend(e){
    e.preventDefault();
    setMsg('');
    if (busy) return;
    if (!ensureCaptcha()) return;
    setBusy(true);
    try{
      await api('/auth/resend-verification', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, captchaToken })
      });
      onNotice?.({
        type: 'success',
        text: 'Verification email sent. Please check your inbox.'
      });
      setStep(STEP_LOGIN);
    }catch(err){
      setMsg(err.message || 'Unable to resend verification email.');
    }finally{
      setBusy(false);
    }
  }

  async function handleReset(e){
    e.preventDefault();
    setMsg('');
    if (!resetToken) {
      setMsg('Missing reset token.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setMsg('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('Passwords do not match.');
      return;
    }
    setBusy(true);
    try{
      await api('/auth/password/reset', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      setNewPassword('');
      setConfirmPassword('');
      onNotice?.({
        type: 'success',
        text: 'Password updated. You can now log in with the new credentials.'
      });
      onResetConsumed?.();
      setStep(STEP_LOGIN);
    }catch(err){
      setMsg(err.message || 'Failed to reset password.');
    }finally{
      setBusy(false);
    }
  }

  function renderCaptcha() {
    if (!requireCaptcha) return null;
    if (step === STEP_RESET) return null;
    return <ReCaptchaBox key={captchaKey} onChange={setCaptchaToken} />;
  }

  const showLinks = step === STEP_LOGIN;

  return (
    <>
      {step !== STEP_LOGIN && <div className="auth-section-title">{heading}</div>}
      {step === STEP_RESET && (
        <form className="auth-form" onSubmit={handleReset}>
          <div className="auth-field">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={e=>setNewPassword(e.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reset-confirm">Confirm password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={e=>setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? 'Updating…' : 'Save new password'}
          </button>
          {msg && <div className="auth-error">{msg}</div>}
          <div className="auth-links">
            <button type="button" onClick={() => setStep(STEP_LOGIN)}>← Back to login</button>
          </div>
        </form>
      )}

      {step === STEP_LOGIN && (
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          {renderCaptcha()}
          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Login'}
          </button>
          {msg && <div className="auth-error">{msg}</div>}
        </form>
      )}

      {step === STEP_FORGOT && (
        <form className="auth-form" onSubmit={handleForgot}>
          <div className="auth-field">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          {renderCaptcha()}
          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          {msg && <div className="auth-error">{msg}</div>}
          <div className="auth-links">
            <button type="button" onClick={() => setStep(STEP_LOGIN)}>← Back to login</button>
          </div>
        </form>
      )}

      {step === STEP_RESEND && (
        <form className="auth-form" onSubmit={handleResend}>
          <div className="auth-field">
            <label htmlFor="resend-email">Email</label>
            <input
              id="resend-email"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          {renderCaptcha()}
          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send verification email'}
          </button>
          {msg && <div className="auth-error">{msg}</div>}
          <div className="auth-links">
            <button type="button" onClick={() => setStep(STEP_LOGIN)}>← Back to login</button>
          </div>
        </form>
      )}

      {showLinks && (
        <div className="auth-links">
          <button type="button" onClick={() => setStep(STEP_FORGOT)}>Forgot password?</button>
          <button type="button" onClick={() => setStep(STEP_RESEND)}>Resend verification email</button>
        </div>
      )}
    </>
  );
}
