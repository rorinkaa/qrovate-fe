import React, { useEffect, useState } from 'react';
import { api, API } from '../api';

export default function DynamicDashboard({ user }){
  const [target, setTarget] = useState('https://example.com');
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  async function load(){
    try{ setItems(await api(`/qr/list?owner=${encodeURIComponent(user.email)}`)); }
    catch{ setMsg('Failed to load'); }
  }
  useEffect(()=>{ load(); }, [user.email]);

  async function create(){
    setMsg('');
    try{
      const data = await api('/qr/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ owner: user.email, target }) });
      setItems(prev => [data, ...prev]); setTarget('');
    }catch(err){ setMsg(err.message); }
  }

  async function save(id, value){
    try{
      const data = await api('/qr/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, owner: user.email, target: value }) });
      setItems(items.map(i => i.id===id ? data : i));
    }catch(err){ setMsg(err.message); }
  }

  async function refreshStats(id){
    try{
      const stat = await api(`/qr/stats/${id}`);
      setItems(items.map(i => i.id===id ? {...i, ...stat} : i));
    }catch{}
  }

  return (
    <section className="card">
      <div className="label">Dynamic QR (trial-gated)</div>
      {!user.is_pro && <div className="small">You are on Free plan — dynamic QR works for 7 days after registration.</div>}
      <div className="row" style={{marginTop:8}}>
        <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target URL" style={{flex:1}}/>
        <button onClick={create}>Create Dynamic QR</button>
      </div>
      <div className="small" style={{color:'crimson', marginTop:8}}>{msg}</div>

      <div style={{marginTop:12}}>
        {items.map(it => (
          <div key={it.id} className="row" style={{alignItems:'center'}}>
            <a href={`${API}/qr/${it.id}`} target="_blank" rel="noreferrer">
              <img className="qr" src={`${API}/qr/image/${it.id}`} alt="qr" width="96" height="96"/>
            </a>
            <input value={it.target} onChange={e=>{
              const v = e.target.value;
              setItems(items.map(x => x.id===it.id ? {...x, target:v} : x));
            }} style={{flex:1}}/>
            <button onClick={()=>save(it.id, it.target)}>Update</button>
            <button onClick={()=>refreshStats(it.id)}>Refresh stats</button>
            {typeof it.scanCount==='number' && <span className="badge">Scans: {it.scanCount}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
