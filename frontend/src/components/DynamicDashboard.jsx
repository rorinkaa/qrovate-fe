import React, { useEffect, useRef, useState } from 'react';
import { api, API } from '../api';
import { renderStyledQR } from '../lib/styledQr';

// --- helpers ---
const normalizeUrl = (u) => /^https?:\/\//i.test(u || '') ? u : (u ? `https://${u}` : '');

const TEMPLATES = [
  'URL','TEXT','Phone','SMS','Email','Whatsapp','Facetime','Location','WiFi','Event','Vcard',
  'Crypto','PayPal','UPI Payment','EPC Payment','PIX Payment'
];

const STYLE_DEFAULTS = {
  size: 320,
  background: '#F8FAFC',
  colorMode: 'solid',
  foreground: '#0B1120',
  foregroundSecondary: '#2563EB',
  gradientAngle: 45,
  frameStyle: 'none',
  frameColor: '#FFFFFF',
  frameText: 'SCAN ME',
  frameTextColor: '#0B1120',
  logoSizeRatio: 0.22,
  logoDataUrl: null,
};

const normalizeStyleState = (raw) => {
  if (!raw || typeof raw !== 'object') return { ...STYLE_DEFAULTS };
  const merged = { ...STYLE_DEFAULTS };
  Object.keys(merged).forEach((key) => {
    if (raw[key] !== undefined && raw[key] !== null) merged[key] = raw[key];
  });
  if (!Number.isFinite(merged.size)) merged.size = STYLE_DEFAULTS.size;
  if (!Number.isFinite(merged.gradientAngle)) merged.gradientAngle = STYLE_DEFAULTS.gradientAngle;
  if (!Number.isFinite(merged.logoSizeRatio)) merged.logoSizeRatio = STYLE_DEFAULTS.logoSizeRatio;
  merged.size = Math.min(720, Math.max(240, merged.size));
  merged.gradientAngle = Math.min(360, Math.max(0, merged.gradientAngle));
  merged.logoSizeRatio = Math.min(0.35, Math.max(0.15, merged.logoSizeRatio));
  return merged;
};

const buildStylePayload = (style, allowLogo) => {
  const payload = {
    size: Math.round(style.size),
    background: style.background,
    colorMode: style.colorMode,
    foreground: style.foreground,
    foregroundSecondary: style.foregroundSecondary,
    gradientAngle: Math.round(style.gradientAngle),
    frameStyle: style.frameStyle,
    frameColor: style.frameColor,
    frameText: style.frameText,
    frameTextColor: style.frameTextColor,
    logoSizeRatio: Number(style.logoSizeRatio || STYLE_DEFAULTS.logoSizeRatio),
  };
  if (allowLogo && style.logoDataUrl) {
    payload.logoDataUrl = style.logoDataUrl;
  }
  return payload;
};

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
  const [style, setStyle] = useState(() => ({ ...STYLE_DEFAULTS }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const previewRef = useRef(null);
  const [previewInfo, setPreviewInfo] = useState({ width: 0, height: 0 });

  const isPro = !!user?.is_pro;

  // ---- load my dynamic codes (AUTH: uses api() which adds Authorization) ----
  useEffect(()=>{
    (async ()=>{
      try {
        const list = await api('/qr/list');   // IMPORTANT: no ?owner=… here
        const normalized = (list || []).map(it => ({ ...it, style: normalizeStyleState(it.style) }));
        setItems(normalized);
        if(normalized.length){
          setSel(normalized[0]);
          setStyle(normalizeStyleState(normalized[0].style));
        }
        setErr('');
      } catch(e){
        setErr('Failed to load your dynamic QR codes');
      }
    })();
  },[]);

  // reset editor when selection changes
  useEffect(()=>{
    if(!sel){
      setStyle({ ...STYLE_DEFAULTS });
      return;
    }
    setTpl('URL');
    setValues({ url: '' });
    setMsg('');
    setErr('');
    setStyle(normalizeStyleState(sel.style));
  },[sel?.id]);

  useEffect(()=>{
    const canvas = previewRef.current;
    if(!sel?.id || !canvas){
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      setPreviewInfo({ width: 0, height: 0 });
      return;
    }
    let cancelled = false;
    (async ()=>{
      const info = await renderStyledQR(canvas, `${API}/qr/${sel.id}`, {
        size: style.size,
        background: style.background,
        colorMode: style.colorMode,
        foreground: style.foreground,
        foregroundSecondary: style.foregroundSecondary,
        gradientAngle: style.gradientAngle,
        frameStyle: style.frameStyle,
        frameColor: style.frameColor,
        frameText: style.frameText,
        frameTextColor: style.frameTextColor,
        logoDataUrl: isPro ? style.logoDataUrl : null,
        logoSizeRatio: style.logoSizeRatio,
        allowLogo: isPro,
      });
      if (!cancelled && info) setPreviewInfo(info);
    })();
    return () => { cancelled = true; };
  },[sel?.id, style, isPro]);

  async function createDynamic() {
    setBusy(true); setMsg(''); setErr('');
    try{
      // For MVP, create with empty target; user can Update right away
      const stylePayload = buildStylePayload(style, isPro);
      const created = await api('/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: '', style: stylePayload })
      });
      const normalized = normalizeStyleState(created.style);
      const newItem = { ...created, style: normalized };
      setItems(prev => [newItem, ...prev]);
      setSel(newItem);
      setStyle(normalized);
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
      const stylePayload = buildStylePayload(style, isPro);
      const updated = await api('/qr/update', {
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sel.id, target, style: stylePayload })
      });
      const normalized = normalizeStyleState(updated.style);
      setItems(prev => prev.map(i => i.id===sel.id ? {...i, target: updated.target, style: normalized} : i));
      setSel({...sel, target: updated.target, style: normalized});
      setStyle(normalized);
      setMsg('Saved.');
    }catch(e){
      setErr(e.message || 'Save failed');
    }finally{ setBusy(false); }
  }

  function updateStyle(key, val){
    setStyle(s => ({ ...s, [key]: val }));
  }

  function onLogoFile(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateStyle('logoDataUrl', reader.result);
    };
    reader.readAsDataURL(file);
  }

  function removeLogo(){
    updateStyle('logoDataUrl', null);
  }

  function downloadStyled(type='png'){
    if(!sel?.id || !previewRef.current) return;
    const mime = type==='png' ? 'image/png' : 'image/jpeg';
    const data = previewRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    a.download = `${sel.id}_styled.${type}`;
    a.click();
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

      <div style={{marginTop:20, display:'flex', flexWrap:'wrap', gap:24, alignItems:'flex-start'}}>
        <div style={{flex:'1 1 280px', minWidth:260}}>
          <div className="small" style={{fontWeight:600, marginBottom:6}}>Design & styling</div>

          <label className="small" style={{display:'flex', flexDirection:'column', marginBottom:12}}>QR Size
            <input type="range" min="240" max="720" value={style.size} onChange={e=>updateStyle('size', +e.target.value)} />
          </label>

          <div className="small" style={{fontWeight:600, marginBottom:6}}>Colors</div>
          <div className="row wrap" style={{gap:8, marginBottom:8}}>
            <button className={style.colorMode==='solid'?'pill active':'pill'} onClick={()=>updateStyle('colorMode','solid')}>Solid</button>
            <button className={style.colorMode==='gradient'?'pill active':'pill'} onClick={()=>updateStyle('colorMode','gradient')}>Gradient</button>
          </div>
          <div className="row wrap" style={{gap:12, marginBottom:12}}>
            <label className="small" style={{display:'flex', flexDirection:'column'}}>Primary
              <input type="color" value={style.foreground} onChange={e=>updateStyle('foreground', e.target.value)} />
            </label>
            {style.colorMode==='gradient' && (
              <>
                <label className="small" style={{display:'flex', flexDirection:'column'}}>Secondary
                  <input type="color" value={style.foregroundSecondary} onChange={e=>updateStyle('foregroundSecondary', e.target.value)} />
                </label>
                <label className="small" style={{display:'flex', flexDirection:'column'}}>Angle ({Math.round(style.gradientAngle)}°)
                  <input type="range" min="0" max="360" value={style.gradientAngle} onChange={e=>updateStyle('gradientAngle', +e.target.value)} />
                </label>
              </>
            )}
          </div>

          <label className="small" style={{display:'flex', flexDirection:'column', marginBottom:12}}>Background
            <input type="color" value={style.background} onChange={e=>updateStyle('background', e.target.value)} />
          </label>

          <div className="small" style={{fontWeight:600, marginBottom:6}}>Frame</div>
          <div className="row wrap" style={{gap:8, marginBottom:8}}>
            <button className={style.frameStyle==='none'?'pill active':'pill'} onClick={()=>updateStyle('frameStyle','none')}>None</button>
            <button className={style.frameStyle==='rounded'?'pill active':'pill'} onClick={()=>updateStyle('frameStyle','rounded')}>Rounded</button>
            <button className={style.frameStyle==='label'?'pill active':'pill'} onClick={()=>updateStyle('frameStyle','label')}>Label</button>
          </div>
          {style.frameStyle!=='none' && (
            <div className="row wrap" style={{gap:12, marginBottom:12}}>
              <label className="small" style={{display:'flex', flexDirection:'column'}}>Frame Color
                <input type="color" value={style.frameColor} onChange={e=>updateStyle('frameColor', e.target.value)} />
              </label>
              {style.frameStyle==='label' && (
                <>
                  <label className="small" style={{display:'flex', flexDirection:'column'}}>Text
                    <input value={style.frameText} onChange={e=>updateStyle('frameText', e.target.value)} />
                  </label>
                  <label className="small" style={{display:'flex', flexDirection:'column'}}>Text Color
                    <input type="color" value={style.frameTextColor} onChange={e=>updateStyle('frameTextColor', e.target.value)} />
                  </label>
                </>
              )}
            </div>
          )}

          <div className="small" style={{fontWeight:600, marginBottom:6}}>Logo (Pro)</div>
          {isPro ? (
            <div className="row wrap" style={{gap:12, marginBottom:12}}>
              <input type="file" accept="image/*" onChange={onLogoFile} />
              <label className="small" style={{display:'flex', flexDirection:'column'}}>Size
                <input type="range" min="0.15" max="0.35" step="0.01" value={style.logoSizeRatio} onChange={e=>updateStyle('logoSizeRatio', parseFloat(e.target.value))} />
              </label>
              {style.logoDataUrl && <button onClick={removeLogo}>Remove Logo</button>}
            </div>
          ) : (
            <div className="small" style={{marginBottom:12}}>Upgrade to Pro to add a logo overlay</div>
          )}
        </div>

        <div style={{flex:'0 0 320px', textAlign:'center'}}>
          <canvas ref={previewRef} style={{maxWidth:'100%', height:'auto'}} />
          {sel?.id ? (
            <>
              <div className="small" style={{marginTop:8, color:'#4B5563'}}>
                Preview: {Math.round(previewInfo.width)} × {Math.round(previewInfo.height)} px
              </div>
              <div className="row wrap" style={{gap:8, justifyContent:'center', marginTop:8}}>
                <button onClick={()=>downloadStyled('png')}>Download PNG</button>
                <button onClick={()=>downloadStyled('jpeg')}>Download JPG</button>
              </div>
            </>
          ) : (
            <div className="small" style={{marginTop:8, color:'#6B7280'}}>Create a dynamic QR to see the styled preview.</div>
          )}
        </div>
      </div>

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
