
import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRious from 'qrious';

// Local libs (UMD style attached on window if needed)
// import '../lib/qrcode-min'; // (placeholder for real generator if needed)

const TYPES = [
  'TEXT','URL','Phone','SMS','Email','Whatsapp','Facetime','Location','WiFi','Event','Vcard',
  'Crypto','PayPal','UPI Payment','EPC Payment','PIX Payment'
];

const initialState = {
  type: 'URL',
  values: {},
  size: 256,
  margin: 8,
  foreground: '#000000',
  background: '#ffffff',
  level: 'H',
  logo: null,
  loading: false
};

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
      // paypal.me/username/amount
      if(v.username && v.amount) return `https://paypal.me/${v.username}/${v.amount}`;
      if(v.username) return `https://paypal.me/${v.username}`;
      return '';
    }
    case 'UPI Payment': {
      // upi://pay?pa=VPA&pn=Name&am=10&cu=INR
      const params = new URLSearchParams();
      if(v.vpa) params.set('pa', v.vpa);
      if(v.name) params.set('pn', v.name);
      if(v.amount) params.set('am', v.amount);
      params.set('cu','INR');
      return `upi://pay?${params.toString()}`;
    }
    case 'EPC Payment': {
      // Simple SEPA: "BCD\n001\n1\nSCT\nBIC\nName\nIBAN\nAmount\n\nRemittance\n"
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
      // Simplified BR Code payload (placeholder)
      return v.payload || '';
    }
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
    case 'Email': return { to:[required, email] };
    case 'Phone': return { phone:[required, phone] };
    case 'Whatsapp': return { phone:[required, phone] };
    case 'WiFi': return { ssid:[required] };
    case 'Crypto': return { address:[required] };
    case 'PayPal': return { username:[required] };
    case 'UPI Payment': return { vpa:[required] };
    case 'EPC Payment': return { iban:[required], name:[required] };
    case 'Event': return { start:[required], end:[required], summary:[required] };
    default: return {};
  }
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

export default function AdvancedQRBuilder({ user }){
  const [state, setState] = useState(initialState);
  const canvasRef = useRef(null);
  const [payload, setPayload] = useState('');

  const { errors, isValid } = useValidation(state.type, state.values);

  useEffect(()=>{
    const p = buildPayload(state.type, state.values);
    setPayload(p);
  }, [state.type, state.values]);

  useEffect(()=>{
    if(!payload) return;
    setState(s=>({ ...s, loading: true }));
    const qr = new QRious({
      element: canvasRef.current,
      value: payload,
      size: state.size,
      level: state.level,
      background: state.background,
      foreground: state.foreground
    });
    // Draw logo overlay if provided
    if(state.logo){
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.onload = ()=>{
        const w = state.size * 0.22;
        const x = (state.size - w)/2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x-6, x-6, w+12, w+12);
        ctx.drawImage(img, x, x, w, w);
        setState(s=>({ ...s, loading:false }));
      };
      img.src = state.logo;
    }else{
      setState(s=>({ ...s, loading:false }));
    }
  }, [payload, state.size, state.level, state.background, state.foreground, state.logo]);

  function updateValue(key, value){
    setState(s=>({ ...s, values: { ...s.values, [key]: value } }));
  }
  function setType(t){
    setState(s=>({ ...s, type:t, values:{} }));
  }

  function onLogo(e){
    const f = e.target.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=> setState(s=>({ ...s, logo: reader.result }));
    reader.readAsDataURL(f);
  }

  function downloadPNG(){
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'qr.png'; a.click();
  }

  function generateSVGfromCanvas(){
    // approximate by embedding PNG into SVG (still vector container)
    const data = canvasRef.current.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${state.size}" height="${state.size}" viewBox="0 0 ${state.size} ${state.size}"><image href="${data}" x="0" y="0" width="${state.size}" height="${state.size}"/></svg>`;
    return new Blob([svg], {type:'image/svg+xml'});
  }

  function downloadSVG(){
    if(!user){ alert('Login required for SVG download.'); return; }
    const blob = generateSVGfromCanvas();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qr.svg'; a.click();
  }

  function downloadPDF(){
    if(!user){ alert('Login required for PDF download.'); return; }
    // tiny fake jsPDF replaced with native canvas toDataURL in a PDF shell
    // For demo: create a simple PDF-like blob (placeholder)
    const img = canvasRef.current.toDataURL('image/png');
    const html = `<html><body style="margin:0"><img src="${img}" width="512"/></body></html>`;
    const blob = new Blob([html], {type:'application/octet-stream'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qr.pdf'; a.click();
  }

  return (
    <section className="card">
      <div className="label">Advanced QR Builder</div>
      <div className="row wrap">
        {TYPES.map(t=>(
          <button key={t} className={state.type===t?'pill active':'pill'} onClick={()=>setType(t)}>{t}</button>
        ))}
      </div>

      <div className="grid-2">
        <div>
          <FormFields type={state.type} values={state.values} errors={errors} onChange={updateValue} />
          <div className="row">
            <label>Size <input type="range" min="128" max="1024" value={state.size} onChange={e=>setState(s=>({...s,size:+e.target.value}))}/></label>
            <label>Level
              <select value={state.level} onChange={e=>setState(s=>({...s,level:e.target.value}))}>
                <option>L</option><option>M</option><option>Q</option><option>H</option>
              </select>
            </label>
          </div>
          <div className="row">
            <label>Foreground <input type="color" value={state.foreground} onChange={e=>setState(s=>({...s,foreground:e.target.value}))}/></label>
            <label>Background <input type="color" value={state.background} onChange={e=>setState(s=>({...s,background:e.target.value}))}/></label>
            <label>Logo <input type="file" accept="image/*" onChange={onLogo}/></label>
          </div>
          {!isValid && <div className="error">Please fix invalid fields before generating.</div>}
        </div>

        <div className="center">
          <div className="qr-wrap">
            {state.loading && <div className="loading">Generating…</div>}
            <canvas ref={canvasRef} width={state.size} height={state.size} className="qr"></canvas>
          </div>
          <div className="row">
            <button onClick={downloadPNG} disabled={!isValid}>PNG</button>
            <button onClick={downloadSVG} disabled={!isValid}>SVG (login)</button>
            <button onClick={downloadPDF} disabled={!isValid}>PDF (login)</button>
          </div>
          <textarea readOnly value={payload} style={{width:'100%',height:80, marginTop:10}}/>
        </div>
      </div>
    </section>
  );
}

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

function FormFields({ type, values, errors, onChange }){
  switch(type){
    case 'TEXT':
      return <Field label="Text" error={errors.text}><input value={values.text||''} onChange={e=>onChange('text',e.target.value)} placeholder="Your text"/></Field>;
    case 'URL':
      return <Field label="URL" error={errors.url}><input value={values.url||''} onChange={e=>onChange('url',e.target.value)} placeholder="https://"/></Field>;
    case 'Phone':
      return <Field label="Phone" error={errors.phone}><input value={values.phone||''} onChange={e=>onChange('phone',e.target.value)} placeholder="+1 555-1234"/></Field>;
    case 'SMS':
      return <>
        <Field label="To" error={errors.to}><input value={values.to||''} onChange={e=>onChange('to',e.target.value)}/></Field>
        <Field label="Message"><input value={values.body||''} onChange={e=>onChange('body',e.target.value)}/></Field>
      </>;
    case 'Email':
      return <>
        <Field label="To" error={errors.to}><input value={values.to||''} onChange={e=>onChange('to',e.target.value)} placeholder="user@example.com"/></Field>
        <Field label="Subject"><input value={values.subject||''} onChange={e=>onChange('subject',e.target.value)}/></Field>
        <Field label="Body"><textarea value={values.body||''} onChange={e=>onChange('body',e.target.value)}/></Field>
      </>;
    case 'Whatsapp':
      return <>
        <Field label="Phone" error={errors.phone}><input value={values.phone||''} onChange={e=>onChange('phone',e.target.value)} placeholder="+359..."/></Field>
        <Field label="Text"><input value={values.text||''} onChange={e=>onChange('text',e.target.value)}/></Field>
      </>;
    case 'Facetime':
      return <Field label="Target"><input value={values.target||''} onChange={e=>onChange('target',e.target.value)} placeholder="email or phone"/></Field>;
    case 'Location':
      return <>
        <Field label="Latitude"><input value={values.lat||''} onChange={e=>onChange('lat',e.target.value)} /></Field>
        <Field label="Longitude"><input value={values.lng||''} onChange={e=>onChange('lng',e.target.value)} /></Field>
        <div style={{textAlign:'center', margin:'6px 0'}}>— or —</div>
        <Field label="Search"><input value={values.query||''} onChange={e=>onChange('query',e.target.value)} placeholder="E.g. Eiffel Tower"/></Field>
      </>;
    case 'WiFi':
      return <>
        <Field label="SSID" error={errors.ssid}><input value={values.ssid||''} onChange={e=>onChange('ssid',e.target.value)} /></Field>
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
        <Field label="Summary" error={errors.summary}><input value={values.summary||''} onChange={e=>onChange('summary',e.target.value)} /></Field>
        <Field label="Start (YYYYMMDDThhmmssZ)" error={errors.start}><input value={values.start||''} onChange={e=>onChange('start',e.target.value)} /></Field>
        <Field label="End (YYYYMMDDThhmmssZ)" error={errors.end}><input value={values.end||''} onChange={e=>onChange('end',e.target.value)} /></Field>
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
        <Field label="Address" error={errors.address}><input value={values.address||''} onChange={e=>onChange('address',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
      </>;
    case 'PayPal':
      return <>
        <Field label="PayPal Username" error={errors.username}><input value={values.username||''} onChange={e=>onChange('username',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
      </>;
    case 'UPI Payment':
      return <>
        <Field label="VPA (pa)" error={errors.vpa}><input value={values.vpa||''} onChange={e=>onChange('vpa',e.target.value)} /></Field>
        <Field label="Payee Name"><input value={values.name||''} onChange={e=>onChange('name',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
      </>;
    case 'EPC Payment':
      return <>
        <Field label="IBAN" error={errors.iban}><input value={values.iban||''} onChange={e=>onChange('iban',e.target.value)} /></Field>
        <Field label="BIC"><input value={values.bic||''} onChange={e=>onChange('bic',e.target.value)} /></Field>
        <Field label="Name" error={errors.name}><input value={values.name||''} onChange={e=>onChange('name',e.target.value)} /></Field>
        <Field label="Amount"><input value={values.amount||''} onChange={e=>onChange('amount',e.target.value)} /></Field>
        <Field label="Remittance"><input value={values.remittance||''} onChange={e=>onChange('remittance',e.target.value)} /></Field>
      </>;
    case 'PIX Payment':
      return <Field label="PIX Payload"><textarea value={values.payload||''} onChange={e=>onChange('payload',e.target.value)} placeholder="Paste EMVCo payload"/></Field>;
    default:
      return null;
  }
}
