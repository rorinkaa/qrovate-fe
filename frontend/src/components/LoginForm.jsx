import React, { useState } from 'react';
import { api } from '../api';

export default function LoginForm({ onLogin }){
  const [email, setEmail] = useState('test@pro.com');
  const [password, setPassword] = useState('test1234');
  const [msg, setMsg] = useState('');

  async function submit(e){
    e.preventDefault(); setMsg('');
    try{
      const data = await api('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      onLogin(data.user);
    }catch(err){ setMsg(err.message); }
  }

  return (
    <form onSubmit={submit}>
      <div className="label">Login</div>
      <div className="row">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
        <button type="submit">Login</button>
      </div>
      <div className="small" style={{color:'crimson', marginTop:8}}>{msg}</div>
    </form>
  );
}
