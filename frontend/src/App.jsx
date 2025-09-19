import React, { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import StaticDesigner from './components/StaticDesigner.jsx';
import DynamicDashboard from './components/DynamicDashboard.jsx';

export default function App(){
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');

  useEffect(()=>{
    const raw = localStorage.getItem('qr_user');
    if(raw) setUser(JSON.parse(raw));
  },[]);

  function onLogin(u){ localStorage.setItem('qr_user', JSON.stringify(u)); setUser(u); }
  function logout(){ localStorage.removeItem('qr_user'); setUser(null); }

  return (
    <div className="container">
      <h1>QR System</h1>

      {!user && (
        <section className="card">
          <div className="row">
            <button onClick={()=>setMode('login')}>Login</button>
            <button onClick={()=>setMode('register')}>Register</button>
          </div>
          {mode==='login' ? <LoginForm onLogin={onLogin}/> : <RegisterForm onRegister={onLogin}/>}
          <div className="small">Demo Pro user: <b>test@pro.com</b> / <b>test1234</b></div>
        </section>
      )}

      {user && (
        <>
          <section className="card">
            <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
              <div>Signed in as <b>{user.email}</b> {user.is_pro ? <span className="badge">Pro</span> : <span className="badge">Free</span>}</div>
              {!user.is_pro && <button onClick={()=>window.open(`${location.protocol}//${location.hostname}:4000/upgrade?email=${encodeURIComponent(user.email)}`,'_blank')}>Upgrade</button>}
              <button onClick={logout}>Logout</button>
            </div>
          </section>

          <div className="grid">
            <StaticDesigner isPro={user.is_pro}/>
            <DynamicDashboard user={user}/>
          </div>
        </>
      )}
    </div>
  );
}
