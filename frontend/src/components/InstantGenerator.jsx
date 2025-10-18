import React, { useEffect, useRef, useState } from 'react';
import QRious from 'qrious';
import { api } from '../api';
import { loadLocal, saveLocal } from '../utils';

const PREVIEW_SIZE = 260;
const SIZE_OPTIONS = [
  { label: 'Web • 256px', value: 256 },
  { label: 'Print • 512px', value: 512 },
  { label: 'Large • 1024px', value: 1024 }
];

function renderQr(canvas, value, { size, background, foreground, logo }) {
  return new Promise((resolve) => {
    new QRious({ element: canvas, value, size, background, foreground });
    if (!logo) {
      resolve();
      return;
    }
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const logoSize = Math.floor(size * 0.2);
      const inset = Math.floor(logoSize * 0.12);
      const start = (size - logoSize) / 2;
      ctx.fillStyle = background;
      ctx.fillRect(start - inset, start - inset, logoSize + inset * 2, logoSize + inset * 2);
      ctx.drawImage(img, start, start, logoSize, logoSize);
      resolve();
    };
    img.onerror = resolve;
    img.src = logo;
  });
}

export default function InstantGenerator({ isLoggedIn, onRequestAuth, showHeading = true }) {
  const params = new URLSearchParams(window.location.search);
  const prefill = params.get('prefill') || '';
  const [text, setText] = useState(prefill || 'https://example.com');
  const [downloadSize, setDownloadSize] = useState(SIZE_OPTIONS[0].value);
  const [fg, setFg] = useState(loadLocal('qr_fg', '#000000'));
  const [bg, setBg] = useState(loadLocal('qr_bg', '#ffffff'));
  const [logo, setLogo] = useState(null);
  const [svgBusy, setSvgBusy] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQr(canvas, text, { size: PREVIEW_SIZE, background: bg, foreground: fg, logo });
    saveLocal('qr_fg', fg);
    saveLocal('qr_bg', bg);
  }, [text, fg, bg, logo]);

  function onLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function downloadPNG() {
    const canvas = document.createElement('canvas');
    await renderQr(canvas, text, { size: Number(downloadSize), background: bg, foreground: fg, logo });
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = data;
    a.download = `qr-${downloadSize}.png`;
    a.click();
  }

  async function downloadSVG() {
    if (!isLoggedIn) {
      onRequestAuth?.();
      return;
    }
    if (svgBusy) return;
    try {
      setSvgBusy(true);
      const svgResponse = await api('/qr/instant-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, size: downloadSize, foreground: fg, background: bg })
      });
      if (svgResponse?.svg) {
        const blob = new Blob([svgResponse.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${downloadSize}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert('Could not prepare SVG right now. Please try again in a moment.');
    } finally {
      setSvgBusy(false);
    }
  }

  return (
    <div className="instant-generator">
      <div className="instant-shell glass">
        {showHeading && (
          <div className="instant-header">
            <span className="eyebrow">Instant Generator</span>
            <h3>Drop in a link &amp; get a QR instantly</h3>
            <p>Perfect for quick campaigns, menus, and stickers. Add your logo for extra polish.</p>
          </div>
        )}

        <div className="instant-layout">
          <form className="instant-controls" onSubmit={(e) => e.preventDefault()}>
            <label className="control-field">
              <span>Destination</span>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="https://yourdestinationsite.com" />
            </label>

            <div className="size-options">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={downloadSize === opt.value ? 'size-chip active' : 'size-chip'}
                  onClick={() => setDownloadSize(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="control-row">
              <label className="control-field color-field">
                <span>Foreground</span>
                <div className="color-input">
                  <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
                  <span>{fg.toUpperCase()}</span>
                </div>
              </label>
              <label className="control-field color-field">
                <span>Background</span>
                <div className="color-input">
                  <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
                  <span>{bg.toUpperCase()}</span>
                </div>
              </label>
            </div>

            <label className="upload-pill">
              <input type="file" accept="image/*" onChange={onLogoFile} />
              <span>{logo ? 'Logo added — change?' : 'Upload logo (PNG/SVG)'}</span>
            </label>

            <div className="instant-note">
              <strong>SVG export is free once you sign up.</strong> No credit card required — unlock unlimited downloads and analytics.
            </div>
          </form>

          <div className="instant-preview">
            <div className="preview-card">
              <div className="preview-frame">
                <canvas ref={canvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} />
              </div>
              <div className="download-row">
                <button type="button" className="btn-primary" onClick={downloadPNG}>Download PNG</button>
                {isLoggedIn ? (
                  <button type="button" className="btn-outline" onClick={downloadSVG} disabled={svgBusy}>
                    {svgBusy ? 'Preparing SVG…' : 'Download SVG'}
                  </button>
                ) : (
                  <button type="button" className="btn-outline" onClick={() => onRequestAuth?.()}>Unlock free SVG</button>
                )}
              </div>
              <div className="preview-footer">
                <div>
                  <span className="preview-label">Live Preview</span>
                  <p>Export size: {downloadSize}px</p>
                </div>
                <div className="preview-badge">100% vector ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
