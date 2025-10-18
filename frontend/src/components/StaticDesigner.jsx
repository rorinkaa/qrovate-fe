import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderStyledQR } from '../lib/styledQr';
import { api } from '../api';
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
const SIZE_OPTIONS = [
  { label: 'Web • 256px', value: 256 },
  { label: 'Print • 512px', value: 512 },
  { label: 'Large • 1024px', value: 1024 }
];

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
  const onSizeSelect = (value) => setStyle(prev => ({ ...prev, size: value }));
  const [designName, setDesignName] = useState('My QR design');
  const [renderInfo, setRenderInfo] = useState({ width: STYLE_DEFAULTS.size, height: STYLE_DEFAULTS.size });
  const [previewTab, setPreviewTab] = useState('qr');
  const canvasRef = useRef(null);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      if (Array.isArray(stored)) setSavedDesigns(stored.map(item => ({
        ...item,
        name: item.name || 'Saved QR'
      })));
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

  const planCopy = isPro ? 'Unlimited exports and logo overlays unlocked.' : 'Free plan: download PNG and save up to 3 designs — upgrade for SVG and analytics.';

  const download = (type = 'png') => {
    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const data = canvasRef.current.toDataURL(mime);
    const a = document.createElement('a');
    a.href = data;
    a.download = `static_qr.${type}`;
    a.click();
  };

  const downloadSvg = async () => {
    const encoded = buildPayload(tpl, values);
    try {
      const data = await api('/qr/instant-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: encoded, size: style.size, foreground: style.foreground, background: style.background })
      });
      if (data?.svg) {
        const blob = new Blob([data.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'static_qr.svg';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert(data?.error || 'Could not export SVG.');
      }
    } catch (e) {
      alert('Could not export SVG right now.');
    }
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
    <section className="designer-panel glass fade-up">
      <div className="panel-header">
        <span className="eyebrow">Static Studio</span>
        <h3>Design on-brand static QR codes</h3>
        <p>{planCopy}</p>
      </div>
      {toast && <div className="alert-success">{toast}</div>}

      <div className="template-pills">
        {TEMPLATES.map(t => (
          <button key={t} className={tpl === t ? 'pill active' : 'pill'} onClick={() => selectTemplate(t)}>{t}</button>
        ))}
      </div>

      <div className="designer-layout">
        <div className="designer-settings">
          <TemplateDataForm type={tpl} values={values} onChange={onValueChange} />

          <div className="row wrap" style={{ gap: 12 }}>
            <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Design title
              <input value={designName} onChange={e => setDesignName(e.target.value)} placeholder="April campaign QR" />
            </label>
            <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Size
              <input type="range" min="240" max="720" value={style.size} onChange={e => onStyleChange('size', +e.target.value)} />
            </label>
            <label className="small" style={{ display: 'flex', flexDirection: 'column' }}>Background
              <input type="color" value={style.background} onChange={e => onStyleChange('background', e.target.value)} />
            </label>
          </div>

          <div className="row wrap" style={{ gap: 12 }}>
            <button onClick={() => download('png')}>Download PNG</button>
            <button onClick={() => download('jpeg')}>Download JPG</button>
            <button onClick={downloadSvg}>Download SVG</button>
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

      </div>
        <div className="designer-preview">
          <div className="preview-tabs">
            <button type="button" className={previewTab==='qr' ? 'pill active' : 'pill'} onClick={()=>setPreviewTab('qr')}>QR Preview</button>
            <button type="button" className={previewTab==='info' ? 'pill active' : 'pill'} onClick={()=>setPreviewTab('info')}>Template info</button>
          </div>
          {previewTab==='qr' ? (
            <canvas ref={canvasRef} className="qr" style={{ maxWidth: '100%', height: 'auto' }} />
          ) : (
            <TemplatePreview type={tpl} values={values} />
          )}
          <div className="small" style={{ color: '#4B5563' }}>Export size: {Math.round(renderInfo.width)} × {Math.round(renderInfo.height)} px</div>
        </div>
      </div>

      {savedDesigns.length > 0 && (
        <div className="saved-section">
          <h3>Saved designs</h3>
          <div className="saved-grid">
            {savedDesigns.map(design => (
              <div key={design.id} className="saved-card">
                <h4>{design.name || 'Saved QR'}</h4>
                <SavedQRThumb design={design} />
                <div className="saved-meta">{formatRelative(design.createdAt)}</div>
                {design.hasLogo && <div className="saved-meta" style={{ color: '#f97316' }}>Logo not stored. Re-upload after loading.</div>}
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

function SavedQRThumb({ design }) {
  const [dataUrl, setDataUrl] = React.useState('');
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = document.createElement('canvas');
      await renderStyledQR(canvas, buildPayload(design.template, design.values), {
        size: 220,
        background: design.style.background || STYLE_DEFAULTS.background,
        colorMode: design.style.colorMode || STYLE_DEFAULTS.colorMode,
        foreground: design.style.foreground || STYLE_DEFAULTS.foreground,
        foregroundSecondary: design.style.foregroundSecondary || STYLE_DEFAULTS.foregroundSecondary,
        gradientAngle: design.style.gradientAngle ?? STYLE_DEFAULTS.gradientAngle,
        frameStyle: design.style.frameStyle || STYLE_DEFAULTS.frameStyle,
        frameColor: design.style.frameColor || STYLE_DEFAULTS.frameColor,
        frameText: design.style.frameText || STYLE_DEFAULTS.frameText,
        frameTextColor: design.style.frameTextColor || STYLE_DEFAULTS.frameTextColor,
        logoDataUrl: null,
        logoSizeRatio: design.style.logoSizeRatio || 0.22,
        allowLogo: false
      });
      if (!cancelled) {
        setDataUrl(canvas.toDataURL('image/png'));
      }
    })();
    return () => { cancelled = true; };
  }, [design]);

  if (!dataUrl) return <div className="saved-thumb" />;
  return <img src={dataUrl} alt={design.name || 'QR preview'} className="saved-thumb" />;
}
