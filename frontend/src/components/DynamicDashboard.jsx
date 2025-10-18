import React, { useEffect, useState } from 'react';
import { api, API } from '../api';

// --- helpers ---
const normalizeUrl = (u) => /^https?:\/\//i.test(u || '') ? u : (u ? `https://${u}` : '');

const TEMPLATES = [
  'URL','TEXT','Phone','SMS','Email','Whatsapp','Facetime','Location','WiFi','Event','Vcard',
  'Crypto','PayPal','UPI Payment','EPC Payment','PIX Payment'
];

function buildPayload(type, v = {}) {
  switch (type) {
    case 'TEXT': return v.text || '';
    case 'URL': return (v.url || '').trim();
    case 'Phone': return v.phone ? `tel:${v.phone}` : '';
    case 'SMS': { const to=v.to||''; const body=v.body||''; return body?`SMSTO:${to}:${body}`:`SMSTO:${to}`; }
    case 'Email': { return (v.subject||v.body) ? `MATMSG:TO:${v.to||''};SUB:${v.subject||''};BODY:${v.body||''};;` : `mailto:${v.to||''}`; }
    case 'Whatsapp': return v.phone ? `https://wa.me/${v.phone}${v.text?`?text=${encodeURIComponent(v.text)}`:''}` : '';
    case 'Facetime': return v.target ? `facetime:${v.target}` : '';
    case 'Location': { if(v.lat&&v.lng) return `geo:${v.lat},${v.lng}`; if(v.query) return `geo:0,0?q=${encodeURIComponent(v.query)}`; return ''; }
    case 'WiFi': { const auth=v.auth||'WPA'; const hidden=v.hidden?'H:true;':''; return `WIFI:T:${auth};S:${v.ssid||''};P:${v.password||''};${hidden};`; }
    case 'Event': {
      const {start='',end='',summary='',location='',description=''}=v;
      return `BEGIN:VEVENT\nSUMMARY:${summary}\nDTSTART:${start}\nDTEND:${end}\nLOCATION:${location}\nDESCRIPTION:${description}\nEND:VEVENT`;
    }
    case 'Vcard': {
      const {last='',first='',email='',phone='',org='',title='',address='',url=''}=v;
      return `BEGIN:VCARD\nVERSION:3.0\nN:${last};${first}\nEMAIL:${email}\nTEL:${phone}\nORG:${org}\nTITLE:${title}\nADR:${address}\nURL:${url}\nEND:VCARD`;
    }
    case 'Crypto': {
      const scheme=(v.symbol||'BTC').toLowerCase(), addr=v.address||'', amt=v.amount?`?amount=${v.amount}`:'';
      return `${scheme}:${addr}${amt}`;
    }
    case 'PayPal': { if(v.username&&v.amount) return `https://paypal.me/${v.username}/${v.amount}`; if(v.username) return `https://paypal.me/${v.username}`; return ''; }
    case 'UPI Payment': {
      const p=new URLSearchParams(); if(v.vpa) p.set('pa',v.vpa); if(v.name) p.set('pn',v.name); if(v.amount) p.set('am',v.amount); p.set('cu','INR'); return `upi://pay?${p.toString()}`;
    }
    case 'EPC Payment': {
      const lines=['BCD','001','1','SCT',v.bic||'',v.name||'',v.iban||'',v.amount?String(v.amount):'','',v.remittance||'']; return lines.join('\n');
    }
    case 'PIX Payment': return v.payload || '';
    default: return '';
  }
}

function Field({label, children}) {
  return (
    <div className="field" style={{marginTop:8}}>
      <div className="field-row"><label>{label}</label></div>
      {children}
    </div>
  );
}

function TemplateFields({ type, values, onChange }) {
  switch(type){
    case 'URL':
      return <Field label="URL">
        <input value={values.url||''} onChange={e=>onChange('url', e.target.value)} placeholder="https:// or facebook.com" />
      </Field>;
    case 'TEXT':
      return <Field label="Text"><input value={values.text||''} onChange={e=>onChange('text',e.target.value)} /></Field>;
    case 'Phone':
      return <Field label="Phone"><input value={values.phone||''} onChange={e=>onChange('phone',e.target.value)} /></Field>;
    case 'SMS':
      return <>
        <Field label="To"><input value={values.to||''} onChange={e=>onChange('to',e.target.value)} /></Field>
        <Field label="Message"><input value={values.body||''} onChange={e=>onChange('body',e.target.value)} /></Field>
      </>;
    case 'Email':
      return <>
        <Field label="To"><input value={values.to||''} onChange={e=>onChange('to',e.target.value)} placeholder="user@example.com" /></Field>
        <Field label="Subject"><input value={values.subject||''} onChange={e=>onChange('subject',e.target.value)} /></Field>
        <Field label="Body"><textarea value={values.body||''} onChange={e=>onChange('body',e.target.value)} /></Field>
      </>;
    case 'WiFi':
      return <>
        <Field label="SSID"><input value={values.ssid||''} onChange={e=>onChange('ssid',e.target.value)} /></Field>
        <Field label="Password"><input value={values.password||''} onChange={e=>onChange('password',e.target.value)} /></Field>
        <Field label="Auth">
          <select value={values.auth||'WPA'} onChange={e=>onChange('auth',e.target.value)}>
            <option>WPA</option><option>WEP</option><option>nopass</option>
          </select>
        </Field>
        <label className="row"><input type="checkbox" checked={!!values.hidden} onChange={e=>onChange('hidden',e.target.checked)}/> Hidden</label>
      </>;
    case 'Vcard':
      return <>
        <Field label="First Name"><input value={values.first||''} onChange={e=>onChange('first',e.target.value)} /></Field>
        <Field label="Last Name"><input value={values.last||''} onChange={e=>onChange('last',e.target.value)} /></Field>
        <Field label="Email"><input value={values.email||''} onChange={e=>onChange('email',e.target.value)} /></Field>
        <Field label="Phone"><input value={values.phone||''} onChange={e=>onChange('phone',e.target.value)} /></Field>
        <Field label="Organization"><input value={values.org||''} onChange={e=>onChange('org',e.target.value)} /></Field>
      </>;
    default:
      return <div style={{color:'#666', marginTop:6}}>Fields for “{type}” can be expanded later.</div>;
  }
}

export default function DynamicDashboard({ user }) {
  const [items, setItems] = useState([]);      // [{id, target, ...}]
  const [sel, setSel] = useState(null);        // selected item
  const [tpl, setTpl] = useState('URL');
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // ---- load my dynamic codes (AUTH: uses api() which adds Authorization) ----
  useEffect(()=>{
    (async ()=>{
      try {
        const list = await api('/qr/list');   // IMPORTANT: no ?owner=… here
        setItems(list || []);
        if(list?.length) setSel(list[0]);
        setErr('');
      } catch(e){
        setErr('Failed to load your dynamic QR codes');
      }
    })();
  },[]);

  // reset editor when selection changes
  useEffect(()=>{
    if(!sel) return;
    setTpl('URL');
    setValues({ url: '' });
    setMsg('');
    setErr('');
  },[sel]);

  async function createDynamic() {
    setBusy(true); setMsg(''); setErr('');
    try{
      // For MVP, create with empty target; user can Update right away
      const created = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: '' })
      });
      const newList = [created, ...items];
      setItems(newList);
      setSel(created);
      setMsg('Dynamic QR created. Now choose a template and click "Update Selected".');
    }catch(e){
      setErr(e.message || 'Create failed');
    }finally{ setBusy(false); }
  }

  async function updateSelected() {
    if(!sel?.id) return;
    setBusy(true); setMsg(''); setErr('');
    try{
      let target = '';
      if (tpl === 'URL') {
        target = normalizeUrl(values.url || '');
      } else {
        // non-URL -> open through backend (keeps stats) then frontend viewer can fetch payload by id later
        target = `${window.location.origin}/payload.html?type=${encodeURIComponent(tpl)}&data=${encodeURIComponent(buildPayload(tpl, values))}`;
      }
      const updated = await api('/qr/update', {
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sel.id, target })
      });
      setItems(items.map(i => i.id===sel.id ? {...i, target: updated.target} : i));
      setSel({...sel, target: updated.target});
      setMsg('Saved.');
    }catch(e){
      setErr(e.message || 'Save failed');
    }finally{ setBusy(false); }
  }

  return (
    <section className="card">
      <div className="label">Dynamic (Create & Manage)</div>

      <div className="row wrap" style={{gap:8, marginBottom:10}}>
        {TEMPLATES.map(t => (
          <button key={t} className={tpl===t?'pill active':'pill'} onClick={()=>setTpl(t)}>{t}</button>
        ))}
      </div>

      <TemplateFields type={tpl} values={values} onChange={(k,v)=>setValues(s=>({...s,[k]:v}))} />

      <div className="row" style={{gap:8, marginTop:10}}>
        <button onClick={createDynamic} disabled={busy}>{busy?'Please wait…':'Create Dynamic QR'}</button>
        <button onClick={updateSelected} disabled={busy || !sel?.id}>Update Selected</button>
      </div>

      {err && <div style={{color:'#d33', marginTop:8}}>{err}</div>}
      {msg && <div style={{color:'#0a7', marginTop:8}}>{msg}</div>}

      <h3 style={{marginTop:16}}>My dynamic codes</h3>
      {items.length === 0 ? (
        <div style={{color:'#666'}}>No dynamic QR codes yet.</div>
      ) : (
        <div style={{display:'grid', gap:8}}>
          {items.map(it => (
            <div key={it.id} className="row" style={{gap:10, alignItems:'center'}}>
              <button className={sel?.id===it.id?'pill active':'pill'} onClick={()=>setSel(it)}>{it.id.slice(0,8)}…</button>
              <a href={`${API}/qr/${it.id}`} target="_blank" rel="noreferrer">Open</a>
              <img
                src={`${API}/qr/svg/${it.id}`}
                alt="qr"
                width={72}
                height={72}
                style={{border:'1px solid #eee', borderRadius:8}}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}