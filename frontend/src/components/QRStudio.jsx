import React, { useEffect, useRef, useState } from 'react';
import QRious from 'qrious';
import { api, API } from '../api';

/* ---------- Config ---------- */

const TEMPLATES = [
  'URL','TEXT','Phone','SMS','Email','Whatsapp','Facetime','Location','WiFi','Event','Vcard',
  'Crypto','PayPal','UPI Payment','EPC Payment','PIX Payment'
];

const MODE = { STATIC: 'static', DYNAMIC: 'dynamic' };

const normalizeUrl = (u) => /^https?:\/\//i.test(u || '') ? u : (u ? `https://${u}` : '');

const FRONTEND_ORIGIN = (typeof window !== 'undefined' ? window.location.origin : '');
const makeDynamicTarget = (type, values) => {
  if (type === 'URL') return normalizeUrl(values.url || '');
  const payload = buildPayload(type, values);
  // landing page that renders payload for non-URL
  const url = new URL((FRONTEND_ORIGIN || '') + '/payload.html');
  url.searchParams.set('type', type);
  url.searchParams.set('data', payload);
  return url.toString();
};

/* ---------- Payload + validation (borrowed from your builder) ---------- */

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
      const lines = ['BCD','001','1','SCT', v.bic||'', v.name||'', v.iban||'', v.amount ? String(v.amount) : '', '', v.remittance||''];
      return lines.join('\n');
    }
    case 'PIX Payment': return v.payload || '';
    default: return '';
  }
}

function validators(type){
  const email = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const url = v => /^(https?:\/\/)/i.test(v);
  const phone = v => /^[+0-9()\-\s]{6,}$/.test(v);
  const required = v => (v!=null && String(v).trim().length>0);
  switch(type){
    case 'URL': return { url: [required, url] };
  }
  return {};
}
function useValidation(type, values){
  const rules = validators(type);
  const errors = {};
  for(const key of Object.keys(rules)){
    const fns = rules[key];
    for(const fn of fns){
      if(!fn(values[key]||'')){ errors[key] = true; break; }
    }
  }
  const isValid = Object.keys(errors).length===0;
  return { errors, isValid };
}

/* ---------- Local store for dynamic items ---------- */
// We keep editable metadata locally so users can switch template & values later.
const LS_KEY = 'qrovate_dynamic_items';
const loadDyn = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
};
const saveDyn = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

/* ---------- Component ---------- */

export default function QRStudio({ user }) {
  // Step 1: mode
  const [mode, setMode] = useState(MODE.STATIC);
  // Step 2: template
  const [tpl, setTpl] = useState('URL');
  // Form values for the current template
  const [values, setValues] = useState({});
  // Static preview
  const [payload, setPayload] = useState('');
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Dynamic management
  const [dynList, setDynList] = useState(loadDyn()); // [{id, name, template, values, target}]
  const [current, setCurrent] = useState(null);       // currently selected dynamic
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const { errors } = useValidation(tpl, values);

  // Build static payload + render
  useEffect(()=>{
    if (mode !== MODE.STATIC) return;
    const p = buildPayload(tpl, values);
    setPayload(p);
  }, [mode, tpl, values]);
  useEffect(()=>{
    if (mode !== MODE.STATIC) return;
    if (!payload) return;
    setLoading(true);
    new QRious({
      element: canvasRef.current,
      value: payload,
      size: 256,
      level: 'H',
      background: '#ffffff',
      foreground: '#000000'
    });
    setLoading(false);
  }, [mode, payload]);

  function onChangeValue(key, val){ setValues(v => ({ ...v, [key]: val })); }

  /* ----- Static download helpers (optional) ----- */
  function downloadPNG(){
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'qr.png'; a.click();
  }

  /* ----- Dynamic create/update/select ----- */
  async function createDynamic() {
    setErr(''); setMsg(''); setBusy(true);
    try{
      const name = prompt('Name this dynamic code (e.g. "WiFi store", "Facebook"):','My Dynamic QR') || 'My Dynamic QR';
      const target = makeDynamicTarget(tpl, values);            // ensures URL types get https://; others go to payload.html
      if (!target) throw new Error('Please fill required fields');

      const res = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      const item = { id: res.id, name, template: tpl, values: { ...values }, target: res.target };
      const updated = [item, ...dynList];
      setDynList(updated); saveDyn(updated);
      setCurrent(item);
      setMsg('Dynamic created.');
    }catch(e){ setErr(e.message || 'Failed to create'); }
    finally{ setBusy(false); }
  }

  async function updateDynamic() {
    if (!current?.id) return;
    setErr(''); setMsg(''); setBusy(true);
    try{
      const target = makeDynamicTarget(tpl, values);
      const res = await api('/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, target })
      });
      // update local snapshot
      const updated = dynList.map(d => d.id === current.id ? { ...d, template: tpl, values: { ...values }, target: res.target } : d);
      setDynList(updated); saveDyn(updated);
      setCurrent(updated.find(d => d.id === current.id));
      setMsg('Dynamic updated.');
    }catch(e){ setErr(e.message || 'Failed to update'); }
    finally{ setBusy(false); }
  }

  function selectDynamic(d){
    setCurrent(d);
    setTpl(d.template);
    setValues({ ...d.values });
    setMsg('Loaded dynamic for editing.');
    setErr('');
  }

  function renameDynamic(d){
    const name = prompt('Rename dynamic:', d.name) || d.name;
    const updated = dynList.map(x => x.id === d.id ? { ...x, name } : x);
    setDynList(updated); saveDyn(updated);
    setCurrent({ ...d, name });
  }

  function deleteDynamic(d){
    if(!confirm('Delete this dynamic locally? (The backend QR id remains, but it will disappear from this list.)')) return;
    const updated = dynList.filter(x => x.id !== d.id);
    setDynList(updated); saveDyn(updated);
    if(current?.id === d.id){ setCurrent(null); setMsg('Removed from local list.'); }
  }

  /* ----- UI ----- */
  return (
    <section className="card" style={{display:'grid', gap:12}}>
      <div className="label">QR Studio</div>

      {/* Step 1: choose mode */}
      <div className="row" style={{ gap: 12 }}>
        <label className="pill"><input type="radio" name="mode" checked={mode===MODE.STATIC} onChange={()=>setMode(MODE.STATIC)} /> Static</label>
        <label className="pill"><input type="radio" name="mode" checked={mode===MODE.DYNAMIC} onChange={()=>setMode(MODE.DYNAMIC)} /> Dynamic (editable)</label>
      </div>

      {/* Step 2: choose template */}
      <div className="row wrap" style={{ gap: 8 }}>
        {TEMPLATES.map(t => (
          <button key={t} className={tpl===t?'pill active':'pill'} onClick={()=>setTpl(t)}>{t}</button>
        ))}
      </div>

      {/* Template fields */}
      <TemplateFields type={tpl} values={values} errors={errors} onChange={onChangeValue} />

      {/* Static preview + download */}
      {mode === MODE.STATIC && (
        <div className="grid-2">
          <div>
            <div className="row" style={{ gap:10 }}>
              <button onClick={downloadPNG} disabled={loading || !payload}>Download PNG</button>
            </div>
          </div>
          <div className="center">
            <div className="qr-wrap">
              {loading && <div className="loading">Generating…</div>}
              <canvas ref={canvasRef} width={256} height={256} className="qr"></canvas>
            </div>
            <textarea readOnly value={payload} style={{width:'100%',height:80, marginTop:10}}/>
          </div>
        </div>
      )}

      {/* Dynamic controls */}
      {mode === MODE.DYNAMIC && (
        <>
          <div className="row" style={{ gap: 8 }}>
            <button onClick={createDynamic} disabled={busy}>{busy ? 'Please wait…' : 'Create Dynamic'}</button>
            <button onClick={updateDynamic} disabled={busy || !current?.id}>Update Dynamic</button>
          </div>

          {/* Preview of current dynamic (if any) */}
          {current?.id && (
            <div className="row" style={{ alignItems:'center', gap:12 }}>
              <img
                src={`${API}/qr/svg/${current.id}`}
                alt="dynamic qr"
                width={96}
                height={96}
                className="qr"
              />
              {/* keep stats by going through backend */}
              <a href={`${API}/qr/${current.id}`} target="_blank" rel="noreferrer">Open</a>
              <div style={{fontSize:12, color:'#666'}}>
                <div><b>{current.name}</b></div>
                <div>ID: <code>{current.id}</code></div>
                <div>Type: <code>{current.template}</code></div>
              </div>
            </div>
          )}

          {/* Local list of saved dynamics */}
          <div style={{marginTop:8}}>
            <div style={{fontWeight:600, marginBottom:4}}>My dynamic codes</div>
            {dynList.length === 0 ? (
              <div style={{color:'#666'}}>No dynamic items yet.</div>
            ) : (
              <div style={{display:'grid', gap:8}}>
                {dynList.map(d => (
                  <div key={d.id} className="row" style={{gap:8, alignItems:'center'}}>
                    <span style={{minWidth:80}}>{d.name}</span>
                    <span style={{fontSize:12, color:'#666'}}>({d.template})</span>
                    <a href={`${API}/qr/${d.id}`} target="_blank" rel="noreferrer">Open</a>
                    <button onClick={()=>selectDynamic(d)}>Edit</button>
                    <button onClick={()=>renameDynamic(d)}>Rename</button>
                    <button onClick={()=>deleteDynamic(d)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg && <div style={{ color:'#0a7' }}>{msg}</div>}
          {err && <div style={{ color:'#d33' }}>{err}</div>}
        </>
      )}
    </section>
  );
}

/* ---------- Template fields (simple version based on your file) ---------- */

function Field({label, error, children}){
  return (
    <div className="field">
      <div className="field-row">
        <label>{label}</label>
        {error && <span className="badge">Invalid</span>}
      </div>
      {children}
    </div>
  );
}

function TemplateFields({ type, values, errors, onChange }){
  switch(type){
    case 'URL':
      return <Field label="URL" error={errors.url}>
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
      return <Field label="PIX Payload"><textarea value={values.payload||''} onChange={e=>onChange('payload',e.target.value)} placeholder="Paste EMVCo payload"/></Field>;

    default:
      return null;
  }
}