import React, { useEffect, useRef, useState } from 'react';
import { renderStyledQR } from '../lib/styledQr';

export default function StaticDesigner({ isPro }){
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(320);
  const [colorMode, setColorMode] = useState('solid');
  const [fg, setFg] = useState('#0B1120');
  const [fgSecondary, setFgSecondary] = useState('#2563EB');
  const [gradientAngle, setGradientAngle] = useState(45);
  const [bg, setBg] = useState('#F8FAFC');
  const [frameStyle, setFrameStyle] = useState('rounded');
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameTextColor, setFrameTextColor] = useState('#0B1120');
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(0.22);
  const [renderInfo, setRenderInfo] = useState({ width: size, height: size });
  const canvasRef = useRef(null);

  useEffect(()=>{
    let isCancelled = false;
    (async ()=>{
      const info = await renderStyledQR(canvasRef.current, text, {
        size,
        background: bg,
        colorMode,
        foreground: fg,
        foregroundSecondary: fgSecondary,
        gradientAngle,
        frameStyle,
        frameColor,
        frameText,
        frameTextColor,
        logoDataUrl: logo && isPro ? logo : null,
        logoSizeRatio: logoSize,
        allowLogo: isPro,
      });
      if (!isCancelled && info) setRenderInfo(info);
    })();
    return () => { isCancelled = true; };
  },[text, size, colorMode, fg, fgSecondary, gradientAngle, bg, frameStyle, frameColor, frameText, frameTextColor, logo, logoSize, isPro]);

  function onLogo(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }

  function download(type='png'){
    const mime = type==='png' ? 'image/png' : 'image/jpeg';
    const data = canvasRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    a.download = `static_qr.${type}`;
    a.click();
  }

  function resetLogo(){
    setLogo(null);
  }

  return (
    <section className="card">
      <div className="label">Static QR Designer {isPro ? <span className="badge">Pro</span> : <span className="badge">Free</span>}</div>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text or URL" style={{width:'100%'}}/>

        <div className="row wrap" style={{gap:12}}>
          <label className="small" style={{display:'flex', flexDirection:'column'}}>Size
            <input type="range" min="240" max="720" value={size} onChange={e=>setSize(+e.target.value)} />
          </label>
          <label className="small" style={{display:'flex', flexDirection:'column'}}>Background
            <input type="color" value={bg} onChange={e=>setBg(e.target.value)} />
          </label>
          <button onClick={()=>download('png')}>Download PNG</button>
          <button onClick={()=>download('jpeg')}>Download JPG</button>
        </div>

        <div>
          <div className="small" style={{fontWeight:600, marginBottom:6}}>Colors</div>
          <div className="row wrap" style={{gap:8}}>
            <button className={colorMode==='solid'?'pill active':'pill'} onClick={()=>setColorMode('solid')}>Solid</button>
            <button className={colorMode==='gradient'?'pill active':'pill'} onClick={()=>setColorMode('gradient')}>Gradient</button>
          </div>
          <div className="row wrap" style={{gap:12, marginTop:8}}>
            <label className="small" style={{display:'flex', flexDirection:'column'}}>Primary
              <input type="color" value={fg} onChange={e=>setFg(e.target.value)} />
            </label>
            {colorMode==='gradient' && (
              <>
                <label className="small" style={{display:'flex', flexDirection:'column'}}>Secondary
                  <input type="color" value={fgSecondary} onChange={e=>setFgSecondary(e.target.value)} />
                </label>
                <label className="small" style={{display:'flex', flexDirection:'column'}}>Angle ({gradientAngle}°)
                  <input type="range" min="0" max="360" value={gradientAngle} onChange={e=>setGradientAngle(+e.target.value)} />
                </label>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="small" style={{fontWeight:600, marginBottom:6}}>Frame</div>
          <div className="row wrap" style={{gap:8}}>
            <button className={frameStyle==='none'?'pill active':'pill'} onClick={()=>setFrameStyle('none')}>None</button>
            <button className={frameStyle==='rounded'?'pill active':'pill'} onClick={()=>setFrameStyle('rounded')}>Rounded</button>
            <button className={frameStyle==='label'?'pill active':'pill'} onClick={()=>setFrameStyle('label')}>Label</button>
          </div>
          {frameStyle!=='none' && (
            <div className="row wrap" style={{gap:12, marginTop:8}}>
              <label className="small" style={{display:'flex', flexDirection:'column'}}>Frame Color
                <input type="color" value={frameColor} onChange={e=>setFrameColor(e.target.value)} />
              </label>
              {frameStyle==='label' && (
                <>
                  <label className="small" style={{display:'flex', flexDirection:'column'}}>Text
                    <input value={frameText} onChange={e=>setFrameText(e.target.value)} />
                  </label>
                  <label className="small" style={{display:'flex', flexDirection:'column'}}>Text Color
                    <input type="color" value={frameTextColor} onChange={e=>setFrameTextColor(e.target.value)} />
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="small" style={{fontWeight:600, marginBottom:6}}>Logo Overlay</div>
          {isPro ? (
            <div className="row wrap" style={{gap:12}}>
              <input type="file" accept="image/*" onChange={onLogo} />
              <label className="small" style={{display:'flex', flexDirection:'column'}}>Size
                <input type="range" min="0.15" max="0.35" step="0.01" value={logoSize} onChange={e=>setLogoSize(parseFloat(e.target.value))} />
              </label>
              {logo && <button onClick={resetLogo}>Remove Logo</button>}
            </div>
          ) : (
            <div className="small">Upgrade to Pro to add a logo overlay</div>
          )}
        </div>

        <div className="small" style={{color:'#4B5563'}}>
          Export size: {Math.round(renderInfo.width)} × {Math.round(renderInfo.height)} px
        </div>

        <div style={{marginTop:10, display:'flex', justifyContent:'center'}}>
          <canvas ref={canvasRef} className="qr" style={{maxWidth:'100%', height:'auto'}} />
        </div>
      </div>
    </section>
  );
}
