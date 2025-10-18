import React, { useEffect, useMemo, useRef, useState } from "react";
import qrLibUrl from "../lib/qrcode-min.js?url";

/**
 * Requires ./lib/qrcode-min.js (already in project).
 * It attaches window.QRCode which we use to compute the module matrix.
 */
function ensureQRLib(){
  if(typeof window !== 'undefined' && !window.QRCode){
    const s = document.createElement('script');
    s.src = qrLibUrl;
    document.head.appendChild(s);
  }
}
ensureQRLib();

const DESTS = [
  { id:'website', label:'Website', sample:'https://example.com' },
  { id:'google', label:'Google Doc', sample:'https://docs.google.com/document/d/...' },
  { id:'youtube', label:'YouTube', sample:'https://youtu.be/dQw4w9WgXcQ' },
  { id:'facebook', label:'Facebook', sample:'https://facebook.com/yourpage' },
  { id:'upload', label:'Upload a file', sample:'https://files.example.com/yourfile.pdf' },
  { id:'instagram', label:'Instagram', sample:'https://instagram.com/yourhandle' },
  { id:'sms', label:'Text message', sample:'SMSTO:+123456789:Hello' },
  { id:'email', label:'Email', sample:'mailto:hello@example.com?subject=Hi&body=Message' },
  { id:'wifi', label:'Wi‑Fi', sample:'WIFI:T:WPA;S:MyWifi;P:pass123;;' },
];

const PATTERNS = [
  { id:'square', title:'■', hint:'Squares' },
  { id:'dots', title:'●', hint:'Dots' },
];

function makeMatrix(text, ecc='M'){
  if(!window.QRCode) return null;
  const qr = new window.QRCode(-1, ecc);
  qr.addData(text || ' ');
  qr.make();
  const n = qr.getModuleCount();
  const matrix = [];
  for(let r=0;r<n;r++){
    const row = [];
    for(let c=0;c<n;c++){
      row.push(qr.isDark(r,c) ? 1 : 0);
    }
    matrix.push(row);
  }
  return matrix;
}

function svgFromMatrix(matrix, size, fg, bg, pattern, logoDataUrl){
  if(!matrix) return '';
  const n = matrix.length;
  const cell = size / n;
  const r = Math.floor(cell/2);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  if(bg) svg += `<rect width="100%" height="100%" fill="${bg}"/>`;

  // draw modules
  svg += `<g fill="${fg}">`;
  for(let y=0;y<n;y++){
    for(let x=0;x<n;x++){
      if(!matrix[y][x]) continue;
      const cx = x*cell, cy = y*cell;
      if(pattern === 'dots'){
        const cxm = cx + cell/2, cym = cy + cell/2;
        const rad = Math.max(1, cell*0.38);
        svg += `<circle cx="${cxm.toFixed(2)}" cy="${cym.toFixed(2)}" r="${rad.toFixed(2)}"/>`;
      }else{
        svg += `<rect x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
      }
    }
  }
  svg += `</g>`;

  // logo overlay (center)
  if(logoDataUrl){
    const s = size * 0.22;
    const x = (size - s)/2, y = (size - s)/2;
    // white padding behind logo
    svg += `<rect x="${x-8}" y="${y-8}" width="${s+16}" height="${s+16}" fill="${bg || '#fff'}" rx="12" ry="12"/>`;
    svg += `<image href="${logoDataUrl}" x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice"/>`;
  }

  svg += `</svg>`;
  return svg;
}

function download(dataUrl, name){
  const a = document.createElement('a');
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

export default function DesignerV2(){
  const [dest, setDest] = useState(DESTS[0].id);
  const [text, setText] = useState(DESTS[0].sample);
  const [size, setSize] = useState(280);
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [pattern, setPattern] = useState('square');
  const [logo, setLogo] = useState(null);

  const matrix = useMemo(()=>makeMatrix(text, 'M'), [text]);
  const svg = useMemo(()=>svgFromMatrix(matrix, size, fg, bg, pattern, logo), [matrix, size, fg, bg, pattern, logo]);

  function onLogoFile(e){
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(f);
  }

  function dlSVG(){
    const blob = new Blob([svg], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    download(url, 'qr.svg'); URL.revokeObjectURL(url);
  }
  function dlPNGorJPG(type='image/png', name='qr.png'){
    const img = new Image();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = ()=>{
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0,0,size,size);
      ctx.drawImage(img, 0, 0);
      download(c.toDataURL(type), name);
    };
    img.src = url;
  }

  useEffect(()=>{
    // when destination tab changes, fill sample
    const t = DESTS.find(d=>d.id===dest)?.sample || '';
    setText(t);
  }, [dest]);

  return (
    <section className="card">
      <div className="label">Designer (patterns, colors, logo)</div>
      <div className="row" style={{alignItems:'stretch', gap:16}}>
        {/* Destination Sidebar */}
        <div style={{width:180}}>
          {DESTS.map(d=>(
            <button key={d.id}
              className={"btn " + (dest===d.id ? 'primary' : 'secondary')}
              style={{display:'block', width:'100%', marginBottom:6}}
              onClick={()=>setDest(d.id)}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Center: input + preview */}
        <div style={{flex:1}}>
          <input value={text} onChange={e=>setText(e.target.value)} style={{width:'100%'}} />
          <div style={{marginTop:12, padding:12, background:'#f6f7fb', borderRadius:12, display:'flex', gap:16}}>
            <div dangerouslySetInnerHTML={{__html: svg}} />
            <div>
              <div className="row" style={{gap:8}}>
                <label>Size <input type="range" min="200" max="600" value={size} onChange={e=>setSize(+e.target.value)}/></label>
                <label>Color <input type="color" value={fg} onChange={e=>setFg(e.target.value)}/></label>
                <label>Background <input type="color" value={bg} onChange={e=>setBg(e.target.value)}/></label>
              </div>
              <div style={{marginTop:8}}>
                <b>Pattern:</b>
                <div className="row" style={{gap:8, marginTop:6}}>
                  {PATTERNS.map(p=>(
                    <button key={p.id} className={"btn " + (pattern===p.id?'primary':'secondary')} onClick={()=>setPattern(p.id)}>{p.title}</button>
                  ))}
                </div>
              </div>
              <div style={{marginTop:8}}>
                <label className="btn">Upload Logo
                  <input type="file" accept="image/*" onChange={onLogoFile} style={{display:'none'}}/>
                </label>
                {logo && <button className="btn secondary" onClick={()=>setLogo(null)} style={{marginLeft:8}}>Remove Logo</button>}
              </div>
              <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
                <button className="btn" onClick={dlSVG}>Download SVG</button>
                <button className="btn" onClick={()=>dlPNGorJPG('image/png','qr.png')}>Download PNG</button>
                <button className="btn" onClick={()=>dlPNGorJPG('image/jpeg','qr.jpg')}>Download JPG</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
