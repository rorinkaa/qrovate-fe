import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderStyledQR } from '../lib/styledQr';
import TemplatePreview from './TemplatePreview.jsx';
import {
  TEMPLATES,
  TEMPLATE_DEFAULTS,
  buildPayload,
  TemplateDataForm
} from './TemplateDataForm.jsx';

const STYLE_DEFAULTS = {
  size: 320,
  colorMode: 'solid',
  foreground: '#0B1120',
  foregroundSecondary: '#2563EB',
  gradientAngle: 45,
  background: '#F8FAFC',
  frameStyle: 'rounded',
  frameColor: '#FFFFFF',
  frameText: 'SCAN ME',
  frameTextColor: '#0B1120'
};

const SAVED_KEY = 'qr_static_designs';
const MAX_SAVED = 12;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function formatRelative(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.round(diff / minute)}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  return `${Math.round(diff / day)}d ago`;
}

export default function StaticDesigner({ isPro }) {
  const [tpl, setTpl] = useState('URL');
  const [values, setValues] = useState({ ...TEMPLATE_DEFAULTS.URL, url: 'https://example.com' });
  const draftsRef = useRef({});
  const [style, setStyle] = useState({ ...STYLE_DEFAULTS });
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(0.22);
  const [renderInfo, setRenderInfo] = useState({ width: STYLE_DEFAULTS.size, height: STYLE_DEFAULTS.size });
  const canvasRef = useRef(null);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      if (Array.isArray(stored)) setSavedDesigns(stored);
    } catch {
      setSavedDesigns([]);
    }
  }, []);

  const encodedValue = useMemo(() => buildPayload(tpl, values), [tpl, values]);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      const info = await renderStyledQR(canvasRef.current, encodedValue, {
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
        logoDataUrl: logo && isPro ? logo : null,
        logoSizeRatio: logoSize,
        allowLogo: isPro
      });
      if (!isCancelled && info) setRenderInfo(info);
    })();
    return () => { isCancelled = true; };
  }, [encodedValue, style, logo, logoSize, isPro]);

  const onValueChange = (key, value) => setValues(prev => ({ ...prev, [key]: value }));

  const onStyleChange = (key, value) => setStyle(prev => ({ ...prev, [key]: value }));

  const selectTemplate = (next) => {
    draftsRef.current[tpl] = values;
    const draft = draftsRef.current[next] || TEMPLATE_DEFAULTS[next] || {};
    const initial = next === 'URL' && !draft.url ? { url: 'https://example.com' } : {};
    setValues({ ...initial, ...draft });
    setTpl(next);
  };

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const download = (type = 'png') => {
    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const data = canvasRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    a.download = `static_qr.${type}`;
    a.click();
  };

  const saveDesign = () => {
    const design = {
      id: Date.now().toString(36),
      createdAt: Date.now(),
      template: tpl,
      values: clone(values),
      style: {
        ...clone(style),
        logoSizeRatio: logoSize
      },
      hasLogo: !!logo && isPro
    };
    const next = [design, ...savedDesigns].slice(0, MAX_SAVED);
    setSavedDesigns(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setToast(design.hasLogo ? 'Saved design (logo not stored for privacy).' : 'Design saved.');
    setTimeout(() => setToast(''), 2500);
  };

  const applyDesign = (design) => {
    draftsRef.current = {};
    setTpl(design.template);
    setValues(clone(design.values));
    setStyle(prev => ({ ...prev, ...clone(design.style), size: design.style?.size || prev.size }));
    setLogo(null);
    setLogoSize(design.style?.logoSizeRatio || 0.22);
    setToast('Design loaded. Add logo again if needed.');
    setTimeout(() => setToast(''), 2500);
  };

  const deleteDesign = (id) => {
    const next = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  return (
    <section className="card">
      <div className="label">Static QR Designer {isPro ? <span className="badge">Pro</span> : <span className="badge">Free</span>}</div>
      {toast && <div className="small" style={{ color: '#0a7', marginBottom: 8 }}>{toast}</div>}

      <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
        {TEMPLATES.map(t => (
          <button key={t} className={tpl === t ? 'pill active' : 'pill'} onClick={() => selectTemplate(t)}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: '1 1 320px', minWidth: 260 }}>
          <TemplateDataForm type={tpl} values={values} onChange={onValueChange} />
        </div>
        <TemplatePreview type={tpl} values={values} />
      </div>

      <div className="row wrap" style={{ gap: 12 }}>
        <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Size
          <input type="range" min="240" max="720" value={style.size} onChange={e => onStyleChange('size', +e.target.value)} />
        </label>
        <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Background
          <input type="color" value={style.background} onChange={e => onStyleChange('background', e.target.value)} />
        </label>
        <button onClick={() => download('png')}>Download PNG</button>
        <button onClick={() => download('jpeg')}>Download JPG</button>
        <button onClick={saveDesign}>Save design</button>
      </div>

      <div>
        <div className="small" style={{ fontWeight: 600, marginTop: 16 }}>Colors</div>
        <div className="row wrap" style={{ gap: 8, marginTop: 6 }}>
          <button className={style.colorMode === 'solid' ? 'pill active' : 'pill'} onClick={() => onStyleChange('colorMode', 'solid')}>Solid</button>
          <button className={style.colorMode === 'gradient' ? 'pill active' : 'pill'} onClick={() => onStyleChange('colorMode', 'gradient')}>Gradient</button>
        </div>
        <div className="row wrap" style={{ gap: 12, marginTop: 8 }}>
          <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Primary
            <input type="color" value={style.foreground} onChange={e => onStyleChange('foreground', e.target.value)} />
          </label>
          {style.colorMode === 'gradient' && (
            <>
              <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Secondary
                <input type="color" value={style.foregroundSecondary} onChange={e => onStyleChange('foregroundSecondary', e.target.value)} />
              </label>
              <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Angle ({style.gradientAngle}°)
                <input type="range" min="0" max="360" value={style.gradientAngle} onChange={e => onStyleChange('gradientAngle', +e.target.value)} />
              </label>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Frame</div>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className={style.frameStyle === 'none' ? 'pill active' : 'pill'} onClick={() => onStyleChange('frameStyle', 'none')}>None</button>
          <button className={style.frameStyle === 'rounded' ? 'pill active' : 'pill'} onClick={() => onStyleChange('frameStyle', 'rounded')}>Rounded</button>
          <button className={style.frameStyle === 'label' ? 'pill active' : 'pill'} onClick={() => onStyleChange('frameStyle', 'label')}>Label</button>
        </div>
        {style.frameStyle !== 'none' && (
          <div className="row wrap" style={{ gap: 12, marginTop: 8 }}>
            <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Frame Color
              <input type="color" value={style.frameColor} onChange={e => onStyleChange('frameColor', e.target.value)} />
            </label>
            {style.frameStyle === 'label' && (
              <>
                <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Text
                  <input value={style.frameText} onChange={e => onStyleChange('frameText', e.target.value)} />
                </label>
                <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Text Color
                  <input type="color" value={style.frameTextColor} onChange={e => onStyleChange('frameTextColor', e.target.value)} />
                </label>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Logo Overlay</div>
        {isPro ? (
          <div className="row wrap" style={{ gap: 12 }}>
            <input type="file" accept="image/*" onChange={onLogo} />
            <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Size
              <input type="range" min="0.15" max="0.35" step="0.01" value={logoSize} onChange={e => setLogoSize(parseFloat(e.target.value))} />
            </label>
            {logo && <button onClick={() => setLogo(null)}>Remove Logo</button>}
          </div>
        ) : (
          <div className="small">Upgrade to Pro to add a logo overlay</div>
        )}
      </div>

      <div className="small" style={{ color: '#4B5563', marginTop: 12 }}>
        Export size: {Math.round(renderInfo.width)} × {Math.round(renderInfo.height)} px
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
        <canvas ref={canvasRef} className="qr" style={{ maxWidth: '100%', height: 'auto' }} />
      </div>

      {savedDesigns.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Saved designs</h3>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {savedDesigns.map(design => (
              <div key={design.id} style={{
                borderRadius: 16,
                border: '1px solid rgba(15,23,42,0.08)',
                background: '#ffffff',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <TemplatePreview type={design.template} values={design.values} />
                <div className="small" style={{ color: '#94a3b8' }}>{formatRelative(design.createdAt)}</div>
                {design.hasLogo && <div className="small" style={{ color: '#f97316' }}>Logo not stored. Re-upload after loading.</div>}
                <div className="row wrap" style={{ gap: 8 }}>
                  <button onClick={() => applyDesign(design)}>Load</button>
                  <button onClick={() => deleteDesign(design.id)} style={{ background: '#fee2e2', color: '#b91c1c' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
