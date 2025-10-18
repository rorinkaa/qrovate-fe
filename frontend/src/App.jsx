// src/App.jsx
import React, { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import StaticDesigner from './components/StaticDesigner.jsx';
import DynamicDashboard from './components/DynamicDashboard.jsx';
import AdvancedQRBuilder from './components/AdvancedQRBuilder.jsx';
import TemplatesGallery from './components/TemplatesGallery.jsx';
import Terms from './components/Terms.jsx';
import Privacy from './components/Privacy.jsx';
import Homepage from './components/Homepage.jsx';

import { API } from './api.js';

export default function App(){
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [view, setView] = useState('dynamic'); // start on Dynamic after login
  const [authOpen, setAuthOpen] = useState(false);

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

        <section className="card auth-card">
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className={mode==='login'?'pill active':'pill'} onClick={()=>setMode('login')}>Login</button>
            <button className={mode==='register'?'pill active':'pill'} onClick={()=>setMode('register')}>Register</button>
          </div>
          {mode==='login'
            ? <LoginForm onLogin={handleAuthSuccess}/>
            : <RegisterForm onRegister={handleAuthSuccess}/>}
          <div className="small">Demo Pro user: <b>test@pro.com</b> / <b>test1234</b></div>
        </section>

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
      </div>
    );
  }

  return (
    <div className="container">
      <section className="card">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center', gap:8}}>
          <div>Signed in as <b>{user.email}</b>{' '}
            {user.is_pro ? <span className="badge">Pro</span> : <span className="badge">Free — Trial ends in {user.trial_days_left} days</span>}
          </div>
          <div className="row" style={{gap:8}}>
            {!user.is_pro && <button onClick={upgradeWithStripe}>Upgrade with Stripe</button>}
            <button onClick={logout}>Logout</button>
          </div>
        </div>
        <div className="row wrap" style={{marginTop:10, gap:8}}>
          <button className={view==='dynamic'?'pill active':'pill'} onClick={()=>setView('dynamic')}>Dynamic (Manage)</button>
          <button className={view==='static'?'pill active':'pill'} onClick={()=>setView('static')}>Static (Create)</button>
          <button className={view==='advanced'?'pill active':'pill'} onClick={()=>setView('advanced')}>Advanced Builder</button>
          <button className={view==='templates'?'pill active':'pill'} onClick={()=>setView('templates')}>Templates</button>
          <button className={view==='terms'?'pill active':'pill'} onClick={()=>setView('terms')}>Terms</button>
          <button className={view==='privacy'?'pill active':'pill'} onClick={()=>setView('privacy')}>Privacy</button>
        </div>
      </section>

      {view==='dynamic' && (<><h1>Dynamic QR Dashboard</h1><DynamicDashboard user={user}/></>)}
      {view==='static' && (<><h1>Static QR Studio</h1><StaticDesigner isPro={user.is_pro}/></>)}
      {view==='advanced' && (<><h1>Advanced QR Builder</h1><AdvancedQRBuilder user={user}/></>)}
      {view==='templates' && (<><h1>Templates Gallery</h1><TemplatesGallery /></>)}
      {view==='terms' && <Terms />}
      {view==='privacy' && <Privacy />}
    </div>
  );
}
