import React, { useState } from 'react';
import { api } from '../api';

export default function RegisterForm({ onRegister }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e){
    e.preventDefault(); setMsg('');
    if (busy) return;
    setBusy(true);
    try{
      const data = await api('/auth/register',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password})
      });
      const payload = data?.token ? { ...data.user, token: data.token } : data.user;
      onRegister(payload);
    }catch(err){ setMsg(err.message); }
    finally{ setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="label">Register (Free: PNG, 1 dynamic; Pro: analytics, SVG/PDF, rules)</div>
      <div className="row">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
        <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </div>
      <div className="small" style={{color:'crimson', marginTop:8}}>{msg}</div>
    </form>
  );
}
