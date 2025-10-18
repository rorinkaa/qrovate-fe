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

import { API } from './api.js';

export default function App(){
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [view, setView] = useState('dynamic'); // start on Dynamic after login
  const [authOpen, setAuthOpen] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

  useEffect(()=>{
    const raw = localStorage.getItem('qr_user');
    if(raw) setUser(JSON.parse(raw));
  },[]);

  function handleAuthSuccess(u){
    // persist minimal profile
    localStorage.setItem('qr_user', JSON.stringify(u));
    // NEW: persist token if the backend returns it in the user object
    if (u && (u.token || u.jwt)) {
      localStorage.setItem('token', u.token || u.jwt);
    }
    setUser(u);
    setView('dynamic');
    setAuthOpen(false);
  }

  function logout(){
    localStorage.removeItem('qr_user');
    localStorage.removeItem('token'); // NEW: clear token on logout
    setUser(null);
    setMode('login');
    setView('dynamic');
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
    setAuthOpen(true);
  }

  if (!user) {
    return (
      <div className="landing">
        <Homepage onRequestAuth={requestAuth} />
        <SiteFooter onShowTerms={()=>setInfoModal('terms')} onShowPrivacy={()=>setInfoModal('privacy')} />
        {authOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button className="modal-close" onClick={()=>setAuthOpen(false)} aria-label="Close">&times;</button>
              <div className="row" style={{ justifyContent: 'center', marginBottom: 16 }}>
                <button className={mode==='login'?'pill active':'pill'} onClick={()=>setMode('login')}>Login</button>
                <button className={mode==='register'?'pill active':'pill'} onClick={()=>setMode('register')}>Register</button>
              </div>
              {mode==='login'
                ? <LoginForm onLogin={handleAuthSuccess}/>
                : <RegisterForm onRegister={handleAuthSuccess}/>}
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
