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
  const [mode, setMode] = useState('login');

  useEffect(()=>{
    const raw = localStorage.getItem('qr_user');
    if(raw) setUser(JSON.parse(raw));
  },[]);

  function onLogin(u){ localStorage.setItem('qr_user', JSON.stringify(u)); setUser(u); }
  function logout(){ localStorage.removeItem('qr_user'); setUser(null); }

  async function upgradeWithStripe(){
    if(!user) return;
    const r = await fetch(`${API}/billing/checkout`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: user.email }) });
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
              <button onClick={()=>setMode('login')}>Login</button>
              <button onClick={()=>setMode('register')}>Register</button>
            </div>
            {mode==='login' ? <LoginForm onLogin={onLogin}/> : <RegisterForm onRegister={onLogin}/>}
            <div className="small">Demo Pro user: <b>test@pro.com</b> / <b>test1234</b></div>
          </section>
        </>
      )}

      {user && (
        <>
          <h1>Dashboard</h1>
          <section className="card">
            <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
              <div>Signed in as <b>{user.email}</b> {user.is_pro ? <span className="badge">Pro</span> : <span className="badge">Free — Trial ends in {user.trial_days_left} days</span>}</div>
              {!user.is_pro && <button onClick={upgradeWithStripe}>Upgrade with Stripe</button>}
              <button onClick={logout}>Logout</button>
            </div>
          </section>

          <div className="grid">
            <StaticDesigner isPro={user.is_pro}/>
            <DynamicDashboard user={user}/>
          </div>
          <AdvancedQRBuilder user={user}/>
        </>
      )}
    </div>
  );
}
