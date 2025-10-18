// src/App.jsx
import React, { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import StaticDesigner from './components/StaticDesigner.jsx';
import DynamicDashboard from './components/DynamicDashboard.jsx';
import Terms from './components/Terms.jsx';
import Privacy from './components/Privacy.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import Homepage from './components/Homepage.jsx';

import { API, api } from './api.js';

export default function App(){
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [view, setView] = useState('dynamic'); // start on Dynamic after login
  const [authOpen, setAuthOpen] = useState(false);
  const [infoModal, setInfoModal] = useState(null);
  const [authAlert, setAuthAlert] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [dashboardAlert, setDashboardAlert] = useState(null);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(()=>{
    const raw = localStorage.getItem('qr_user');
    if(raw){
      try{
        const parsed = JSON.parse(raw);
        if (typeof parsed.email_verified === 'undefined') parsed.email_verified = true;
        setUser(parsed);
      }catch{ /* ignore */ }
    }
  },[]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlReset = params.get('reset');
    const verify = params.get('verify');
    if (urlReset) {
      setResetToken(urlReset);
      setMode('login');
      setAuthOpen(true);
      setAuthAlert({ type: 'info', text: 'Enter a new password to finish resetting your account.' });
    }
    if (verify) {
      setMode('login');
      setAuthOpen(true);
      verifyEmailToken(verify);
    }
  }, []);

  function clearAuthParams(keys = ['reset','verify']){
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let mutated = false;
    keys.forEach(key => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        mutated = true;
      }
    });
    if (mutated) {
      window.history.replaceState({}, '', url.toString());
    }
  }

  function handleAuthSuccess(u){
    if (!u) return;
    const normalized = { ...u };
    if (typeof normalized.email_verified === 'undefined') normalized.email_verified = true;
    // persist minimal profile
    localStorage.setItem('qr_user', JSON.stringify(normalized));
    // NEW: persist token if the backend returns it in the user object
    if (normalized && (normalized.token || normalized.jwt)) {
      localStorage.setItem('token', normalized.token || normalized.jwt);
    }
    setUser(normalized);
    setView('dynamic');
    setAuthAlert(null);
    setResetToken(null);
    clearAuthParams();
    setAuthOpen(false);
    setDashboardAlert(null);
    setResendBusy(false);
  }

  function logout(){
    localStorage.removeItem('qr_user');
    localStorage.removeItem('token'); // NEW: clear token on logout
    setUser(null);
    setMode('login');
    setView('dynamic');
    setAuthAlert(null);
    setResetToken(null);
    setDashboardAlert(null);
    setResendBusy(false);
  }

  async function upgradeWithStripe(){
    if(!user) return;
    const r = await fetch(`${API}/billing/checkout`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: user.email })
    });
    const j = await r.json();
    if(j.url) window.location.href = j.url;
    else alert(j.error || 'Checkout failed');
  }

  function requestAuth(){
    setMode('login');
    setAuthAlert(null);
    setResetToken(null);
    clearAuthParams();
    setAuthOpen(true);
  }

  function closeAuthModal(){
    setAuthOpen(false);
    setAuthAlert(null);
    setResetToken(null);
    clearAuthParams();
  }

  async function verifyEmailToken(token){
    if (!token) return;
    try{
      setAuthAlert({ type: 'info', text: 'Verifying your email…' });
      const result = await api('/auth/verify', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token })
      });
      setAuthAlert({ type: 'success', text: 'Email verified! You can now log in.' });
      if (result?.email && user?.email === result.email) {
        const next = { ...user, email_verified: true };
        setUser(next);
        localStorage.setItem('qr_user', JSON.stringify(next));
      }
      clearAuthParams(['verify']);
    }catch(err){
      setAuthAlert({ type: 'error', text: err.message || 'Verification failed. Please request a new email.' });
    }
  }

  function handleResetConsumed(){
    setResetToken(null);
    clearAuthParams(['reset']);
  }

  async function resendVerificationFromDashboard(){
    if (!user?.email) return;
    setResendBusy(true);
    setDashboardAlert(null);
    try{
      await api('/auth/resend-verification', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: user.email })
      });
      setDashboardAlert({ type: 'success', text: 'Verification email sent. Check your inbox for the latest link.' });
    }catch(err){
      setDashboardAlert({ type: 'error', text: err.message || 'Unable to send verification email right now.' });
    }finally{
      setResendBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="landing">
        <Homepage onRequestAuth={requestAuth} />
        <SiteFooter onShowTerms={()=>setInfoModal('terms')} onShowPrivacy={()=>setInfoModal('privacy')} />
        {authOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="auth-modal">
              <button className="modal-close" onClick={closeAuthModal} aria-label="Close">&times;</button>
              <div className="auth-illustration" aria-hidden="true">
                <span className="auth-illustration-badge">✨ Dynamic QR</span>
                <h3>Design today. Update tomorrow.</h3>
                <p>Showcase branded QR codes, schedule redirects, and watch scans in real time with Qrovate Pro.</p>
                <div className="auth-illustration-demo">
                  <div className="auth-illustration-qr">
                    <div className="auth-illustration-qr-inner" />
                  </div>
                  <div className="auth-illustration-stats">
                    <strong>1,248</strong>
                    <span>Scans this week</span>
                  </div>
                </div>
                <div className="auth-avatars">
                  <span className="auth-avatar">AM</span>
                  <span className="auth-avatar">JT</span>
                  <span className="auth-avatar">RX</span>
                  <span className="auth-avatar more">+8</span>
                </div>
              </div>
              <div className="auth-panel">
                <div className="auth-header">
                  <span className="eyebrow">Welcome back</span>
                  <h2>Sign in to your Qrovate workspace</h2>
                  <p className="auth-sub">Access saved designs, dynamic redirects, analytics, and bulk tools.</p>
                </div>
                {authAlert && (
                  <div className={`auth-alert ${authAlert.type || 'info'}`}>
                    {authAlert.text}
                  </div>
                )}
                {!resetToken && (
                  <div className="auth-toggle">
                    <button
                      type="button"
                      className={mode==='login'?'pill active':'pill'}
                      onClick={()=>{
                        setMode('login');
                        setAuthAlert(null);
                      }}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className={mode==='register'?'pill active':'pill'}
                      onClick={()=>{
                        setResetToken(null);
                        setAuthAlert(null);
                        setMode('register');
                      }}
                    >
                      Register
                    </button>
                  </div>
                )}
                {mode==='login'
                  ? (
                    <LoginForm
                      onLogin={handleAuthSuccess}
                      onNotice={setAuthAlert}
                      resetToken={resetToken}
                      onResetConsumed={handleResetConsumed}
                    />
                  )
                  : <RegisterForm onRegister={handleAuthSuccess} onNotice={setAuthAlert} />}
                <p className="auth-footnote">No credit card needed · Cancel anytime · GDPR safe</p>
              </div>
            </div>
          </div>
        )}
        {infoModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button className="modal-close" onClick={()=>setInfoModal(null)} aria-label="Close">&times;</button>
              {infoModal==='terms' ? <Terms /> : <Privacy />}
            </div>
          </div>
        )}
      </div>
    );
  }

  const nav = [
    { id: 'dynamic', label: 'Dynamic Dashboard', subtitle: 'Manage, retarget, and analyze every dynamic QR.', emoji: '🚀' },
    { id: 'static', label: 'Static Studio', subtitle: 'Create branded static codes with gradients and frames.', emoji: '🎨' }
  ];

  return (
    <>
      <div className="dashboard-shell">
        {dashboardAlert && (
          <div className={`dashboard-alert ${dashboardAlert.type || 'info'}`}>
            <span>{dashboardAlert.text}</span>
          </div>
        )}
        {user && user.email_verified === false && (
          <div className="dashboard-alert warning">
            <span>Verify your email to unlock analytics, scheduled redirects, and team features.</span>
            <button onClick={resendVerificationFromDashboard} disabled={resendBusy}>
              {resendBusy ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        )}
        <header className="dashboard-hero glass">
          <div>
            <span className="eyebrow">Welcome back</span>
            <h1>Hi, {user.email.split('@')[0] || 'there'}!</h1>
            <p>Your workspace tracks every scan and keeps QR edits a click away.</p>
          </div>
          <div className="hero-cta">
            {!user.is_pro && (
              <button className="btn-primary" onClick={upgradeWithStripe}>
                Upgrade to Pro
              </button>
            )}
            <button className="btn-secondary ghost" onClick={logout}>Logout</button>
            <div className="plan-pill">
              {user.is_pro ? 'Pro Plan active' : `Free Plan · ${user.trial_days_left} days left`}
            </div>
          </div>
        </header>

        <nav className="dashboard-nav">
          {nav.map(item => (
            <button
              key={item.id}
              className={view===item.id ? 'nav-card active' : 'nav-card'}
              onClick={()=>setView(item.id)}
            >
              <div className="nav-icon">{item.emoji}</div>
              <div>
                <div className="nav-label">{item.label}</div>
                <div className="nav-sub">{item.subtitle}</div>
              </div>
            </button>
          ))}
        </nav>

        <main className="dashboard-content">
          {view==='dynamic' && (<section className="panel-section fade-up"><h2>Dynamic QR Dashboard</h2><p className="section-sub">Launch new campaigns, update destinations, and monitor engagement.</p><DynamicDashboard user={user}/></section>)}
          {view==='static' && (<section className="panel-section fade-up"><h2>Static QR Studio</h2><p className="section-sub">Design premium static QR codes with gradients, frames, and logos.</p><StaticDesigner isPro={user.is_pro}/></section>)}
        </main>
        <SiteFooter onShowTerms={()=>setInfoModal('terms')} onShowPrivacy={()=>setInfoModal('privacy')} />
      </div>
      {infoModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" onClick={()=>setInfoModal(null)} aria-label="Close">&times;</button>
            {infoModal==='terms' ? <Terms /> : <Privacy />}
          </div>
        </div>
      )}
    </>
  );
}
