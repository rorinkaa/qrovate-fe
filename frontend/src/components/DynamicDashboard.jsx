
import React, { useEffect, useState } from 'react';
import { api, API } from '../api';

/**
 * DynamicDashboard (enhanced)
 * - Choose template (URL, WiFi, Vcard, etc.)
 * - Fill fields, Create a dynamic QR (POST /qr/create with computed target)
 * - Pick any existing code from your list, switch template & values, Update
 * - Preview SVG from backend and Open via /qr/:id (keeps stats)
 *
 * Backwards-compatible with your current backend:
 *  - Listing via: GET /qr/list?owner=<email>
 *  - Create via:  POST /qr/create { target }
 *  - Update via:  POST /qr/update { id, target }
 */
const TEMPLATES = [
  'URL','TEXT','Phone','SMS','Email','Whatsapp','Facetime','Location','WiFi','Event','Vcard',
  'Crypto','PayPal','UPI Payment','EPC Payment','PIX Payment'
];

const normalizeUrl = (u) => /^https?:\/\//i.test(u || '') ? u : (u ? `https://${u}` : '');
const FRONTEND_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

function buildPayload(type, v){
  switch(type){
    case 'TEXT': return v.text || '';
    case 'URL': return (v.url||'').trim();
    case 'Phone': return v.phone ? `tel:${v.phone}` : '';
    case 'SMS': {
      const to = v.to || ''; const body = v.body || '';
      return body ? `SMSTO:${to}:${body}` : `SMSTO:${to}`;
    }
    case 'Email': {
      if(v.subject || v.body) return `MATMSG:TO:${v.to||''};SUB:${v.subject||''};BODY:${v.body||''};;`;
      return `mailto:${v.to||''}`;
    }
    case 'Whatsapp': return v.phone ? `https://wa.me/${v.phone}${v.text ? ('?text='+encodeURIComponent(v.text)) : ''}` : '';
    case 'Facetime': return v.target ? `facetime:${v.target}` : '';
    case 'Location': {
      if(v.lat && v.lng) return `geo:${v.lat},${v.lng}`;
      if(v.query) return `geo:0,0?q=${encodeURIComponent(v.query)}`;
      return '';
    }
    case 'WiFi': {
      const auth = v.auth || 'WPA';
      const hidden = v.hidden ? 'H:true;' : '';
      return `WIFI:T:${auth};S:${v.ssid||''};P:${v.password||''};${hidden};`;
    }
    case 'Event': {
      const start = v.start || ''; const end = v.end || '';
      const summary = v.summary || ''; const location = v.location || ''; const desc = v.description || '';
      return `BEGIN:VEVENT\nSUMMARY:${summary}\nDTSTART:${start}\nDTEND:${end}\nLOCATION:${location}\nDESCRIPTION:${desc}\nEND:VEVENT`;
    }
    case 'Vcard': {
      return `BEGIN:VCARD\nVERSION:3.0\nN:${v.last||''};${v.first||''}\nEMAIL:${v.email||''}\nTEL:${v.phone||''}\nORG:${v.org||''}\nTITLE:${v.title||''}\nADR:${v.address||''}\nURL:${v.url||''}\nEND:VCARD`;
    }
    case 'Crypto': {
      const scheme = (v.symbol||'BTC').toLowerCase();
      const addr = v.address||'';
      const amount = v.amount? `?amount=${v.amount}`:'';
      return `${scheme}:${addr}${amount}`;
    }
    case 'PayPal': {
      if(v.username && v.amount) return `https://paypal.me/${v.username}/${v.amount}`;
      if(v.username) return `https://paypal.me/${v.username}`;
      return '';
    }
    case 'UPI Payment': {
      const params = new URLSearchParams();
      if(v.vpa) params.set('pa', v.vpa);
      if(v.name) params.set('pn', v.name);
      if(v.amount) params.set('am', v.amount);
      params.set('cu','INR');
      return `upi://pay?${params.toString()}`;
    }
    case 'EPC Payment': {
      const lines = [
        'BCD','001','1','SCT',
        v.bic||'',
        v.name||'',
        v.iban||'',
        v.amount ? String(v.amount) : '',
        '', // purpose
        v.remittance||''
      ];
      return lines.join('\n');
    }
    case 'PIX Payment': {
      return v.payload || '';
    }
    default: return '';
  }
}

/** For non-URL dynamic types, send users to a simple viewer page with payload in the query. */
function makeDynamicTarget(type, values){
  if(type === 'URL') return normalizeUrl(values.url || '');
  const payload = buildPayload(type, values);
  const url = new URL((FRONTEND_ORIGIN || '') + '/payload.html');
  url.searchParams.set('type', type);
  url.searchParams.set('data', payload);
  return url.toString();
}

export default function DynamicDashboard({ user }){
  const [items, setItems] = useState([]);
  const [tpl, setTpl] = useState('URL');
  const [values, setValues] = useState({});
  const [current, setCurrent] = useState(null); // selected item from list
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load(){
    try{
      const list = await api(`/qr/list?owner=${encodeURIComponent(user.email)}`);
      setItems(Array.isArray(list) ? list : []);
    }catch(e){
      setErr('Failed to load your dynamic QR codes');
    }
  }
  useEffect(()=>{ load(); }, []);

  function onChange(k,v){ setValues(s=>({ ...s, [k]: v })); }

  async function createDynamic(){
    setBusy(true); setMsg(''); setErr('');
    try{
      const target = makeDynamicTarget(tpl, values);
      if(!target) throw new Error('Fill the required fields');
      const res = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      setItems([res, ...items]);
      setCurrent(res);
      setMsg('Dynamic QR created.');
    }catch(e){ setErr(e.message || 'Create failed'); }
    finally{ setBusy(false); }
  }

  async function updateDynamic(){
    if(!current?.id) return;
    setBusy(true); setMsg(''); setErr('');
    try{
      const target = makeDynamicTarget(tpl, values);
      const res = await api('/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, target })
      });
      setItems(items.map(it => it.id===current.id ? { ...it, target: res.target } : it));
      setCurrent({ ...current, target: res.target });
      setMsg('Updated.');
    }catch(e){ setErr(e.message || 'Update failed'); }
    finally{ setBusy(false); }
  }

  async function refreshStats(id){
    try{
      const s = await api(`/qr/stats/${id}`);
      setItems(items.map(it => it.id===id ? { ...it, scanCount: s.scanCount, lastScan: s.lastScan } : it));
    }catch{
      setErr('Could not refresh stats');
    }
  }

  return (
    <section className="card">
      <div className="label">Dynamic (Create & Manage)</div>

      {/* Editor */}
      <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
        {TEMPLATES.map(t => (
          <button key={t} className={tpl===t?'pill active':'pill'} onClick={()=>setTpl(t)}>{t}</button>
        ))}
      </div>

      <TemplateFields type={tpl} values={values} onChange={onChange} />

      <div className="row" style={{ gap:8, marginTop:8 }}>
        <button onClick={createDynamic} disabled={busy}>{busy ? 'Please wait…' : 'Create Dynamic QR'}</button>
        <button onClick={updateDynamic} disabled={busy || !current?.id}>Update Selected</button>
      </div>
      {msg && <div style={{ color:'#0a7', marginTop:6 }}>{msg}</div>}
      {err && <div style={{ color:'#d33', marginTop:6 }}>{err}</div>}

      {/* List */}
      <div style={{ marginTop:16 }}>
        <div style={{fontWeight:600, marginBottom:6}}>My dynamic codes</div>
        {items.map(it => (
          <div key={it.id} className="row" style={{ gap:10, alignItems:'center', marginBottom:8 }}>
            <img src={`${API}/qr/svg/${it.id}`} alt="qr" width={64} height={64} style={{border:'1px solid #eee', borderRadius:8}} />
            <a href={`${API}/qr/${it.id}`} target="_blank" rel="noreferrer">Open</a>
            <code style={{fontSize:12, color:'#666'}}>{it.id}</code>
            <span className="muted" style={{fontSize:12}}>{it.lastScan ? `Last scan: ${new Date(it.lastScan).toLocaleString()}` : ''}</span>
            {typeof it.scanCount === 'number' && <span className="badge">Scans: {it.scanCount}</span>}
            <button onClick={()=>{ setCurrent(it); setMsg(`Selected ${it.id}. Choose a template, change fields, then click "Update Selected".`); }}>
              Edit
            </button>
            <button onClick={()=>refreshStats(it.id)}>Refresh stats</button>
          </div>
        ))}
        {items.length===0 && <div className="muted">No dynamic QR codes yet.</div>}
      </div>
    </section>
  );
}

function Field({label, children}){
  return (
    <div className="field">
      <div className="field-row"><label>{label}</label></div>
      {children}
    </div>
  );
}

function TemplateFields({ type, values, onChange }){
  switch(type){
    case 'URL':
      return <Field label="URL">
        <input value={values.url||''} onChange={e=>onChange('url',e.target.value)} placeholder="https:// or facebook.com" />
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
    case 'Whatsapp':
      return <>
        <Field label="Phone"><input value={values.phone||''} onChange={e=>onChange('phone',e.target.value)} /></Field>
        <Field label="Text"><input value={values.text||''} onChange={e=>onChange('text',e.target.value)} /></Field>
      </>;
    case 'Facetime':
      return <Field label="Target"><input value={values.target||''} onChange={e=>onChange('target',e.target.value)} placeholder="email or phone" /></Field>;
    case 'Location':
      return <>
        <Field label="Latitude"><input value={values.lat||''} onChange={e=>onChange('lat',e.target.value)} /></Field>
        <Field label="Longitude"><input value={values.lng||''} onChange={e=>onChange('lng',e.target.value)} /></Field>
        <div style={{textAlign:'center', margin:'6px 0'}}>— or —</div>
        <Field label="Search"><input value={values.query||''} onChange={e=>onChange('query',e.target.value)} placeholder="E.g. Eiffel Tower" /></Field>
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
        <label className="row"><input type="checkbox" checked={!!values.hidden} onChange={e=>onChange('hidden',e.target.checked)}/> Hidden network</label>
      </>;
    case 'Event':
      return <>
        <Field label="Summary"><input value={values.summary||''} onChange={e=>onChange('summary',e.target.value)} /></Field>
        <Field label="Start (YYYYMMDDThhmmssZ)"><input value={values.start||''} onChange={e=>onChange('start',e.target.value)} /></Field>
        <Field label="End (YYYYMMDDThhmmssZ)"><input value={values.end||''} onChange={e=>onChange('end',e.target.value)} /></Field>
        <Field label="Location"><input value={values.location||''} onChange={e=>onChange('location',e.target.value)} /></Field>
        <Field label="Description"><textarea value={values.description||''} onChange={e=>onChange('description',e.target.value)} /></Field>
      </>;
    case 'Vcard':
      return <>
        <Field label="First Name"><input value={values.first||''} onChange={e=>onChange('first',e.target.value)} /></Field>
        <Field label="Last Name"><input value={values.last||''} onChange={e=>onChange('last',e.target.value)} /></Field>
        <Field label="Email"><input value={values.email||''} onChange={e=>onChange('email',e.target.value)} /></Field>
        <Field label="Phone"><input value={values.phone||''} onChange={e=>onChange('phone',e.target.value)} /></Field>
        <Field label="Organization"><input value={values.org||''} onChange={e=>onChange('org',e.target.value)} /></Field>
        <Field label="Title"><input value={values.title||''} onChange={e=>onChange('title',e.target.value)} /></Field>
        <Field label="Address"><input value={values.address||''} onChange={e=>onChange('address',e.target.value)} /></Field>
        <Field label="URL"><input value={values.url||''} onChange={e=>onChange('url',e.target.value)} /></Field>
      </>;
    case 'Crypto':
      return <>
        <Field label="Symbol"><input value={values.symbol||'BTC'} onChange={e=>onChange('symbol',e.target.value)} /></Field>
        <Field label="Address"><input value={values.address||''} onChange={e=>onChange('address',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
      </>;
    case 'PayPal':
      return <>
        <Field label="PayPal Username"><input value={values.username||''} onChange={e=>onChange('username',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
      </>;
    case 'UPI Payment':
      return <>
        <Field label="VPA (pa)"><input value={values.vpa||''} onChange={e=>onChange('vpa',e.target.value)} /></Field>
        <Field label="Payee Name"><input value={values.name||''} onChange={e=>onChange('name',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
      </>;
    case 'EPC Payment':
      return <>
        <Field label="IBAN"><input value={values.iban||''} onChange={e=>onChange('iban',e.target.value)} /></Field>
        <Field label="BIC"><input value={values.bic||''} onChange={e=>onChange('bic',e.target.value)} /></Field>
        <Field label="Name"><input value={values.name||''} onChange={e=>onChange('name',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
        <Field label="Remittance"><input value={values.remittance||''} onChange={e=>onChange('remittance',e.target.value)} /></Field>
      </>;
    case 'PIX Payment':
      return <Field label="PIX Payload">
        <textarea value={values.payload||''} onChange={e=>onChange('payload',e.target.value)} placeholder="Paste EMVCo payload"/>
      </Field>;
    default:
      return null;
  }
}
