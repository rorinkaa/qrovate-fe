import React, { useEffect, useRef, useState } from 'react';
import QRious from 'qrious';
import { loadLocal, saveLocal } from '../utils';

export default function InstantGenerator({ isLoggedIn }){
  const params = new URLSearchParams(window.location.search);
  const prefill = params.get('prefill') || '';
  const [text, setText] = useState(prefill || 'https://example.com');
  const [size, setSize] = useState(256);
  const [fg, setFg] = useState(loadLocal('qr_fg', '#000000'));
  const [bg, setBg] = useState(loadLocal('qr_bg', '#ffffff'));
  const [logo, setLogo] = useState(null);
  const canvasRef = useRef(null);

  useEffect(()=>{
    const qr = new QRious({ element: canvasRef.current, value: text, size, background: bg, foreground: fg });
    if(logo){
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.onload = ()=>{
        const s = Math.floor(size * 0.2);
        ctx.fillStyle = bg;
        ctx.fillRect((size-s)/2 - 6, (size-s)/2 - 6, s+12, s+12);
        ctx.drawImage(img, (size-s)/2, (size-s)/2, s, s);
      };
      img.src = logo;
    }
    saveLocal('qr_fg', fg); saveLocal('qr_bg', bg);
  },[text, size, fg, bg, logo]);

  function onLogoFile(e){
    const f = e.target.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(f);
  }

  function downloadPNG(){
    const data = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a'); a.href = data; a.download = 'qr.png'; a.click();
  }
  function downloadSVG(){
    alert('SVG download for Instant uses PNG canvas right now. Use the Dynamic section to get SVG.');
  }

  return (
    <section className="card">
      <div className="label">Instant Generator</div>
      <div className="row">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Paste a link" style={{flex:1}}/>
      </div>
      <div className="row" style={{marginTop:8, gap:8}}>
        <label>Size <input type="range" min="128" max="512" value={size} onChange={e=>setSize(+e.target.value)} /></label>
        <label>Color <input type="color" value={fg} onChange={e=>setFg(e.target.value)} /></label>
        <label>Background <input type="color" value={bg} onChange={e=>setBg(e.target.value)} /></label>
        <label className="btn">Upload Logo <input type="file" accept="image/*" onChange={onLogoFile} style={{display:'none'}}/></label>
        <button onClick={downloadPNG}>Download PNG</button>
      </div>
      <div style={{marginTop:10}}>
        <canvas ref={canvasRef} width={size} height={size} className="qr"></canvas>
      </div>
    </section>
  );
}