// src/App.jsx
import React, { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import StaticDesigner from './components/StaticDesigner.jsx';
import DynamicDashboard from './components/DynamicDashboard.jsx';
import InstantGenerator from './components/InstantGenerator.jsx';
import AdvancedQRBuilder from './components/AdvancedQRBuilder.jsx';
import TemplatesGallery from './components/TemplatesGallery.jsx';
import Terms from './components/Terms.jsx';
import Privacy from './components/Privacy.jsx';
import DesignerV2 from './components/DesignerV2.jsx';

import { API } from './api.js';

export default function App(){
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');         // auth tab (login/register)
  const [view, setView] = useState('dynamic');       // dashboard tab after login

  useEffect(()=>{
    const raw = localStorage.getItem('qr_user');
    if(raw) setUser(JSON.parse(raw));
  },[]);

  function onLogin(u){
    localStorage.setItem('qr_user', JSON.stringify(u));
    setUser(u);
    setView('dynamic');
  }

  function logout(){
    localStorage.removeItem('qr_user');
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

  return (
    <div className="container">
      {!user && (
        <>
          <div className="hero">
            <h1>Make a free QR code instantly</h1>
            <p>No account needed. Download PNG for free. Create an account to unlock SVG/PDF, dynamic QR, and analytics.</p>
            <InstantGenerator isLoggedIn={!!user} />
          </div>

          <section className="card">
            <div className="row">
              <button className={mode==='login'?'pill active':'pill'} onClick={()=>setMode('login')}>Login</button>
              <button className={mode==='register'?'pill active':'pill'} onClick={()=>setMode('register')}>Register</button>
            </div>
            {mode==='login' ? <LoginForm onLogin={onLogin}/> : <RegisterForm onRegister={onLogin}/>}
            <div className="small">Demo Pro user: <b>test@pro.com</b> / <b>test1234</b></div>
          </section>
        </>
      )}

      {user && (
        <>
          <section className="card">
            <div className="row" style={{justifyContent:'space-between', alignItems:'center', gap:8}}>
              <div>
                Signed in as <b>{user.email}</b>{' '}
                {user.is_pro
                  ? <span className="badge">Pro</span>
                  : <span className="badge">Free — Trial ends in {user.trial_days_left} days</span>}
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
              <button className={view==='designerV2'?'pill active':'pill'} onClick={()=>setView('designerV2')}>Designer v2</button>
              <button className={view==='terms'?'pill active':'pill'} onClick={()=>setView('terms')}>Terms</button>
              <button className={view==='privacy'?'pill active':'pill'} onClick={()=>setView('privacy')}>Privacy</button>
            </div>
          </section>

          {view==='dynamic' && (<><h1>Dynamic QR Dashboard</h1><DynamicDashboard user={user}/></>)}
          {view==='static' && (<><h1>Static QR Studio</h1><StaticDesigner isPro={user.is_pro}/></>)}
          {view==='advanced' && (<><h1>Advanced QR Builder</h1><AdvancedQRBuilder user={user}/></>)}
          {view==='templates' && (<><h1>Templates Gallery</h1><TemplatesGallery /></>)}
          {view==='designerV2' && (<><h1>Designer v2</h1><DesignerV2 /></>)}
          {view==='terms' && <Terms />}
          {view==='privacy' && <Privacy />}
        </>
      )}
    </div>
  );
}
