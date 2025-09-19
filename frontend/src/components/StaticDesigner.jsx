import React, { useEffect, useRef, useState } from 'react';
import QRious from 'qrious';

export default function StaticDesigner({ isPro }){
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [fg, setFg] = useState('#111111');
  const [bg, setBg] = useState('#ffffff');
  const [logo, setLogo] = useState(null);
  const canvasRef = useRef(null);

  useEffect(()=>{
    const canvas = canvasRef.current;
    const qr = new QRious({ element: canvas, value: text, size, foreground: fg, background: bg });
    if (logo && isPro) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const s = size * 0.25;
        ctx.drawImage(img, (size - s)/2, (size - s)/2, s, s);
      };
      img.src = logo;
    }
  },[text, size, fg, bg, logo, isPro]);

  function onLogo(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }

  function download(type='png'){
    const data = canvasRef.current.toDataURL(type==='png'?'image/png':'image/jpeg');
    const a = document.createElement('a'); a.href = data; a.download = `static_qr.${type}`; a.click();
  }

  return (
    <section className="card">
      <div className="label">Static QR Designer {isPro ? <span className="badge">Pro</span> : <span className="badge">Free</span>}</div>
      <div className="row">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text or URL" style={{flex:1}}/>
      </div>
      <div className="row">
        <label>Size <input type="range" min="128" max="768" value={size} onChange={e=>setSize(+e.target.value)} /></label>
        <label>FG <input type="color" value={fg} onChange={e=>setFg(e.target.value)} /></label>
        <label>BG <input type="color" value={bg} onChange={e=>setBg(e.target.value)} /></label>
        <button onClick={()=>download('png')}>Download PNG</button>
      </div>
      {isPro ? (
        <div className="row">
          <input type="file" accept="image/*" onChange={onLogo} />
          <div className="small">Pro: overlay a logo in the center</div>
        </div>
      ) : (
        <div className="small">Upgrade to Pro to add a logo overlay</div>
      )}
      <div style={{marginTop:10}}>
        <canvas ref={canvasRef} width={size} height={size} className="qr"></canvas>
      </div>
    </section>
  );
}
