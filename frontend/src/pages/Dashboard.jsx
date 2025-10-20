import React, { useEffect, useState } from 'react';
import { api, API } from '../api';
import DashboardSummary from '../components/DashboardSummary.jsx';

// ---- helpers ----
const normalizeUrl = (u) => /^https?:\/\//i.test(u || '') ? u : (u ? `https://${u}` : '');
const FRONTEND_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

const buildPayload = (type, v = {}) => {
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
};

// if non-URL, point to viewer page /p/:id (we’ll add in step 3)
const makeDynamicTarget = (type, values, idForViewer) => {
  if (type === 'URL') return normalizeUrl(values.url || '');
  // temporary viewer by id (short URL; avoid huge query strings)
  const base = FRONTEND_ORIGIN || '';
  return `${base}/p/${idForViewer}`;
};

const ALL_TEMPLATES = [
  'URL','TEXT','Phone','SMS','Email','Whatsapp','Facetime','Location','WiFi','Event','Vcard',
  'Crypto','PayPal','UPI Payment','EPC Payment','PIX Payment'
];

export default function Dashboard() {
  const [items, setItems] = useState([]);      // dynamic codes from backend
  const [sel, setSel] = useState(null);        // selected {id,target,...}
  const [tpl, setTpl] = useState('URL');       // template
  const [values, setValues] = useState({});    // template values
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // load my dynamic codes
  useEffect(()=>{
    (async ()=>{
      try {
        // if your backend doesnt have it yet, temporarily comment the next line
        const list = await api('/qr/list'); // expect array [{id, target, ...}]
        if (Array.isArray(list) && list.length > 0) {
          setItems(list);
          setSel(list[0]);
        } else {
          // If server returned empty but we already have local items, preserve them
          const prev = items || [];
          if (!prev.length && Array.isArray(list) && list.length === 0) {
            setItems([]);
          }
          // otherwise, keep existing items (do not wipe out when server returns empty)
        }
      } catch(e){ setErr(e.message || 'Failed to load'); }
    })();
  },[]);

  useEffect(()=>{
    if(!sel) return;
    setTpl('URL');
    setValues({ url: '' });
    setMsg('Pick a template, edit the fields, then Save to update this QR.');
    setErr('');
  },[sel]);

  async function saveChanges(){
    if(!sel?.id) return;
    setSaving(true); setMsg(''); setErr('');
    try{
      // for URL, save the normalized url; for others, save path to viewer
      const target = makeDynamicTarget(tpl, values, sel.id);
      // store payload for viewer to fetch by id
      const payload = buildPayload(tpl, values);

      const updated = await api('/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sel.id, target, kind: tpl.toLowerCase(), payload })
      });
      setItems(items.map(i => i.id===sel.id ? {...i, target: updated.target} : i));
      setSel({...sel, target: updated.target});
      setMsg('Saved.');
    }catch(e){ setErr(e.message || 'Save failed'); }
    finally{ setSaving(false); }
  }

  // compute last created (newest) item if present
  const lastCreated = items && items.length ? items.slice().sort((a,b)=> (b.createdAt||0) - (a.createdAt||0))[0] : null;

  return (
    <section className="card" style={{display:'grid', gap:12}}>
      <div className="label">Dynamic QR settings</div>
      <DashboardSummary lastCreated={lastCreated} />

      <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:16}}>
        <div style={{borderRight:'1px solid #eee', paddingRight:12}}>
          <div style={{fontWeight:600, marginBottom:8}}>My dynamic codes</div>
          {items.length === 0 ? (
            <div style={{color:'#666'}}>No items yet. Create one from your main page.</div>
          ) : (
            <div style={{display:'grid', gap:6}}>
              {items.map(it => (
                <button
                  key={it.id}
                  className={sel?.id===it.id ? 'pill active':'pill'}
                  onClick={()=>setSel(it)}
                  style={{justifyContent:'flex-start'}}
                >
                  {it.id.slice(0,8)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {!sel ? (
            <div style={{color:'#666'}}>Pick a QR from the left.</div>
          ) : (
            <>
              <div className="row wrap" style={{gap:8}}>
                {ALL_TEMPLATES.map(t => (
                  <button key={t} className={tpl===t?'pill active':'pill'} onClick={()=>setTpl(t)}>{t}</button>
                ))}
              </div>

              <TemplateFields type={tpl} values={values} onChange={(k,v)=>setValues(s=>({...s,[k]:v}))} />

              <div className="row" style={{gap:8, marginTop:8}}>
                <button onClick={saveChanges} disabled={saving}>{saving?'Saving':'Save'}</button>
                <a href={`${API}/qr/${sel.id}`} target="_blank" rel="noreferrer">Open</a>
                <img
                  src={`${API}/qr/svg/${sel.id}`}
                  alt="qr"
                  width={88}
                  height={88}
                  style={{border:'1px solid #eee', borderRadius:8, marginLeft:8}}
                />
              </div>

              {msg && <div style={{color:'#0a7', marginTop:6}}>{msg}</div>}
              {err && <div style={{color:'#d33', marginTop:6}}>{err}</div>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------- fields ------- */
function Field({label, children}){
  return (
    <div className="field" style={{marginTop:8}}>
      <div className="field-row"><label>{label}</label></div>
      {children}
    </div>
  );
}
function TemplateFields({ type, values, onChange }){
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