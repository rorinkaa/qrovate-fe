import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRious from 'qrious';

const DEMO_SCENARIOS = [
  {
    id: 'menu',
    label: 'Menu / Hospitality',
    value: 'https://qr.ovate/demo/menu',
    description: 'Perfect for restaurants that rotate specials daily.',
    accent: '#2563eb',
    defaultPalette: 'classic',
    gradient: [
      { offset: 0, color: '#bae6fd' },
      { offset: 0.58, color: '#60a5fa' },
      { offset: 1, color: '#2563eb' }
    ],
    finder: {
      outer: 'rgba(191, 219, 254, 0.88)',
      middle: '#3b82f6',
      inner: '#0f172a'
    },
    logo: {
      label: 'M',
      shape: 'circle',
      bg: '#ffffff',
      fg: '#1e3a8a',
      shellStops: ['#38bdf8', '#2563eb']
    },
    canvasOverlay:
      'conic-gradient(from -40deg at 50% 50%, rgba(14, 116, 144, 0.18), rgba(37, 99, 235, 0.32) 45%, rgba(37, 99, 235, 0.08) 85%)',
    canvasOutline: '1px solid rgba(14, 116, 144, 0.28)',
    floatBg: 'rgba(241, 245, 249, 0.92)',
    floatBorder: 'rgba(14, 116, 144, 0.2)',
    files: [{ type: 'pdf', icon: 'file', label: 'Seasonal Menu.pdf', pages: 3 }]
  },
  {
    id: 'event',
    label: 'Event Check-in',
    value: 'https://qr.ovate/demo/event',
    description: 'Automate ticket scanning and live announcements.',
    accent: '#f59e0b',
    defaultPalette: 'sunset',
    gradient: [
      { offset: 0, color: '#ffe7c0' },
      { offset: 0.5, color: '#fbbf24' },
      { offset: 1, color: '#f97316' }
    ],
    finder: {
      outer: 'rgba(254, 226, 189, 0.9)',
      middle: '#fbbf24',
      inner: '#7c2d12'
    },
    logo: {
      label: 'EV',
      shape: 'squircle',
      bg: '#fffbeb',
      fg: '#b45309',
      shellStops: ['#fcd34d', '#f97316']
    },
    canvasOverlay: 'linear-gradient(145deg, rgba(249, 115, 22, 0.24), rgba(251, 191, 36, 0.14))',
    canvasOutline: '1px solid rgba(251, 191, 36, 0.28)',
    floatBg: 'rgba(255, 247, 237, 0.95)',
    floatBorder: 'rgba(251, 191, 36, 0.24)',
    files: [{ type: 'mp3', icon: 'audio', label: 'Welcome Jingle.mp3', duration: '02:48' }]
  },
  {
    id: 'packaging',
    label: 'Packaging / Product',
    value: 'https://qr.ovate/demo/product',
    description: 'Turn unboxing into a branded microsite experience.',
    accent: '#16a34a',
    defaultPalette: 'forest',
    gradient: [
      { offset: 0, color: '#bbf7d0' },
      { offset: 0.52, color: '#4ade80' },
      { offset: 1, color: '#059669' }
    ],
    finder: {
      outer: 'rgba(187, 247, 208, 0.9)',
      middle: '#34d399',
      inner: '#064e3b'
    },
    logo: {
      label: 'PX',
      shape: 'diamond',
      bg: '#ecfdf5',
      fg: '#047857',
      shellStops: ['#22c55e', '#0f766e']
    },
    canvasOverlay:
      'radial-gradient(circle at 80% 20%, rgba(52, 211, 153, 0.22), transparent 62%), linear-gradient(170deg, rgba(45, 212, 191, 0.16), rgba(16, 185, 129, 0.1))',
    canvasOutline: '1px solid rgba(16, 185, 129, 0.26)',
    floatBg: 'rgba(240, 253, 244, 0.96)',
    floatBorder: 'rgba(16, 185, 129, 0.26)',
    files: [{ type: 'link', icon: 'link', label: 'Product microsite', hint: 'Dynamic product tour' }]
  }
];

const COLOR_PRESETS = [
  { id: 'classic', label: 'Classic', fg: '#0f172a', bg: '#ffffff' },
  { id: 'sunset', label: 'Sunset', fg: '#ffffff', bg: '#f97316' },
  { id: 'night', label: 'Nightfall', fg: '#cbd5f5', bg: '#312e81' },
  { id: 'forest', label: 'Forest', fg: '#064e3b', bg: '#ecfdf5' }
];

function withAlpha(hex, alpha) {
  if (!hex) return `rgba(37, 99, 235, ${alpha})`;
  let value = hex.replace('#', '');
  if (value.length === 3) {
    value = value.split('').map(char => char + char).join('');
  }
  const int = parseInt(value, 16);
  if (Number.isNaN(int)) {
    return `rgba(37, 99, 235, ${alpha})`;
  }
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function findPalette(id) {
  return COLOR_PRESETS.find((palette) => palette.id === id) || COLOR_PRESETS[0];
}

const TAU = Math.PI * 2;

function hexToRgb(hex) {
  if (!hex) return null;
  let value = hex.replace('#', '').trim();
  if (!value) return null;
  if (value.length === 3) {
    value = value.split('').map(char => char + char).join('');
  }
  if (value.length !== 6) return null;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function rgbToHex({ r, g, b }) {
  const clamp = (num) => Math.max(0, Math.min(255, Math.round(num)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

function mixColor(color, amount, target = '#ffffff') {
  const from = hexToRgb(color);
  const to = hexToRgb(target);
  if (!from || !to) return color;
  return rgbToHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount
  });
}

function resolveStops(stops, accent) {
  if (!stops || stops.length === 0) {
    return [
      { offset: 0, color: mixColor(accent, 0.55) },
      { offset: 1, color: accent }
    ];
  }
  const lastIndex = Math.max(1, stops.length - 1);
  return stops.map((stop, index) => {
    if (typeof stop === 'string') {
      return { offset: index / lastIndex, color: stop };
    }
    const offset = typeof stop?.offset === 'number' ? stop.offset : index / lastIndex;
    const color = stop?.color || accent;
    return { offset, color };
  });
}

function colorAt(stops, t, accent) {
  if (!stops?.length) {
    return hexToRgb(accent || '#2563eb') || { r: 37, g: 99, b: 235 };
  }
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  const clamped = Math.min(Math.max(t, 0), 1);

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (clamped >= start.offset && clamped <= end.offset) {
      const span = end.offset - start.offset || 1;
      const ratio = (clamped - start.offset) / span;
      const startRgb = hexToRgb(start.color) || hexToRgb(accent) || { r: 37, g: 99, b: 235 };
      const endRgb = hexToRgb(end.color) || hexToRgb(accent) || { r: 37, g: 99, b: 235 };
      return {
        r: startRgb.r + (endRgb.r - startRgb.r) * ratio,
        g: startRgb.g + (endRgb.g - startRgb.g) * ratio,
        b: startRgb.b + (endRgb.b - startRgb.b) * ratio
      };
    }
  }

  const last = sorted[sorted.length - 1];
  return hexToRgb(last.color) || hexToRgb(accent) || { r: 37, g: 99, b: 235 };
}

function stylizeQr(canvas, scenario, palette) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  if (!size) return;

  ctx.imageSmoothingEnabled = false;

  const accent = scenario?.accent || palette?.fg || '#2563eb';
  const stops = resolveStops(scenario?.gradient, accent);
  const bgRgb = hexToRgb(palette?.bg || '#ffffff') || { r: 255, g: 255, b: 255 };

  const image = ctx.getImageData(0, 0, size, size);
  const { data } = image;

  for (let y = 0; y < size; y += 1) {
    const progressY = y / (size - 1 || 1);
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 32) continue;

      const diff =
        Math.abs(data[index] - bgRgb.r) +
        Math.abs(data[index + 1] - bgRgb.g) +
        Math.abs(data[index + 2] - bgRgb.b);

      if (diff < 18) continue;

      const t = (x / (size - 1 || 1) + progressY) / 2;
      const rgb = colorAt(stops, t, accent);
      const contrast =
        Math.abs(rgb.r - bgRgb.r) +
        Math.abs(rgb.g - bgRgb.g) +
        Math.abs(rgb.b - bgRgb.b);

      if (contrast < 120) {
        const adjusted = hexToRgb(mixColor(rgbToHex(rgb), 0.32, '#000000')) || rgb;
        data[index] = adjusted.r;
        data[index + 1] = adjusted.g;
        data[index + 2] = adjusted.b;
      } else {
        data[index] = rgb.r;
        data[index + 1] = rgb.g;
        data[index + 2] = rgb.b;
      }
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  drawFinderPatterns(ctx, size, scenario, accent);
  drawDecorations(ctx, size, scenario, accent);
  drawLogo(ctx, size, scenario, accent);
}

function drawFinderPatterns(ctx, size, scenario, accent) {
  const finder = scenario?.finder || {};
  const outer = finder.outer || withAlpha(accent, 0.28);
  const middle = finder.middle || accent;
  const inner = finder.inner || '#ffffff';

  const radius = size * 0.135;
  const margin = size * 0.08;
  const centers = [
    { x: margin + radius, y: margin + radius },
    { x: size - margin - radius, y: margin + radius },
    { x: margin + radius, y: size - margin - radius }
  ];

  centers.forEach(({ x, y }) => drawFinder(ctx, x, y, radius, outer, middle, inner));
}

function drawFinder(ctx, cx, cy, radius, outer, middle, inner) {
  ctx.save();
  ctx.translate(cx, cy);

  drawRoundedRectPath(ctx, -radius * 2.1 / 2, -radius * 2.1 / 2, radius * 2.1, radius * 2.1, radius * 0.28, outer);
  drawRoundedRectPath(ctx, -radius * 1.32 / 2, -radius * 1.32 / 2, radius * 1.32, radius * 1.32, radius * 0.22, middle);
  drawRoundedRectPath(ctx, -radius * 0.7 / 2, -radius * 0.7 / 2, radius * 0.7, radius * 0.7, radius * 0.2, inner);

  ctx.restore();
}

function drawRoundedRectPath(ctx, x, y, width, height, radius, fillStyle) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawLogo(ctx, size, scenario, accent) {
  const logo = scenario?.logo;
  if (!logo) return;

  const shellStops = logo.shellStops?.length ? logo.shellStops : [mixColor(accent, 0.4), accent];
  const shellSize = size * (logo.scale || 0.34);
  const innerSize = shellSize * 0.62;
  const center = size / 2;

  ctx.save();
  ctx.translate(center, center);

  const gradient = ctx.createLinearGradient(-shellSize / 2, -shellSize / 2, shellSize / 2, shellSize / 2);
  shellStops.forEach((color, index) => {
    const ratio = shellStops.length > 1 ? index / (shellStops.length - 1) : 0;
    gradient.addColorStop(ratio, color);
  });

  ctx.fillStyle = gradient;
  drawShapePath(ctx, shellSize, logo.shape, shellSize * 0.32);
  ctx.fill();

  ctx.fillStyle = logo.bg || '#ffffff';
  drawShapePath(ctx, innerSize, logo.shape, innerSize * 0.32);
  ctx.fill();

  if (logo.label) {
    ctx.fillStyle = logo.fg || '#0f172a';
    ctx.font = `700 ${Math.round(innerSize * 0.42)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(logo.label, 0, 1);
  }

  ctx.restore();
}

function drawShapePath(ctx, size, shape, radius) {
  const half = size / 2;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, half, 0, TAU);
    ctx.closePath();
    return;
  }
  if (shape === 'diamond') {
    ctx.moveTo(0, -half);
    ctx.lineTo(half, 0);
    ctx.lineTo(0, half);
    ctx.lineTo(-half, 0);
    ctx.closePath();
    return;
  }
  drawRoundedRectPath(ctx, -half, -half, size, size, radius || size * 0.28, null);
}

function drawDecorations(ctx, size, scenario, accent) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (scenario?.id === 'menu') {
    ctx.strokeStyle = withAlpha(accent, 0.3);
    ctx.lineWidth = size * 0.018;
    ctx.beginPath();
    ctx.moveTo(size * 0.56, size * 0.22);
    ctx.quadraticCurveTo(size * 0.8, size * 0.1, size * 0.84, size * 0.32);
    ctx.stroke();

    ctx.strokeStyle = withAlpha(accent, 0.2);
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.58);
    ctx.quadraticCurveTo(size * 0.38, size * 0.74, size * 0.46, size * 0.6);
    ctx.stroke();
  } else if (scenario?.id === 'event') {
    drawStar(ctx, size * 0.78, size * 0.28, size * 0.072, withAlpha(accent, 0.55), withAlpha(accent, 0.16));
    drawStar(ctx, size * 0.28, size * 0.78, size * 0.052, withAlpha(accent, 0.4), withAlpha(accent, 0.12));
  } else if (scenario?.id === 'packaging') {
    ctx.strokeStyle = withAlpha(accent, 0.28);
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.arc(size * 0.74, size * 0.64, size * 0.18, Math.PI * 0.3, Math.PI * 1.32);
    ctx.stroke();

    ctx.fillStyle = withAlpha(accent, 0.18);
    ctx.beginPath();
    ctx.ellipse(size * 0.3, size * 0.26, size * 0.086, size * 0.12, -0.42, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawStar(ctx, cx, cy, outerRadius, fillColor, glowColor) {
  const spikes = 5;
  const innerRadius = outerRadius * 0.45;

  ctx.save();
  ctx.translate(cx, cy);

  if (glowColor) {
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * 1.4, 0, TAU);
    ctx.fill();
  }

  ctx.beginPath();
  for (let i = 0; i < spikes; i += 1) {
    const outerAngle = (i * 2 * Math.PI) / spikes;
    const innerAngle = outerAngle + Math.PI / spikes;

    ctx.lineTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
    ctx.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
  }
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.restore();
}

export default function HeroDemoPreview() {
  const canvasRef = useRef(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scenario = useMemo(() => DEMO_SCENARIOS[scenarioIndex], [scenarioIndex]);
  const palette = useMemo(() => findPalette(scenario?.defaultPalette), [scenario?.defaultPalette]);
  const audioFile = useMemo(() => scenario.files?.find((file) => ['mp3', 'audio'].includes(file.type)), [scenario]);
  const pdfFile = useMemo(() => scenario.files?.find((file) => ['pdf', 'document'].includes(file.type)), [scenario]);
  const linkFile = useMemo(() => scenario.files?.find((file) => ['link', 'url'].includes(file.type)), [scenario]);

  const accentStyle = useMemo(() => {
    const accent = scenario?.accent || palette?.fg || '#2563eb';
    const baseBg = palette?.bg || '#ffffff';
    const style = {
      '--demo-fg': accent,
      '--demo-bg': baseBg,
      '--demo-fg-soft': withAlpha(accent, 0.18),
      '--demo-bg-soft': withAlpha(baseBg, 0.6),
      '--demo-shadow': withAlpha(accent, 0.3),
      '--cycle-duration': '7500ms'
    };
    if (scenario?.canvasOverlay) style['--canvas-overlay'] = scenario.canvasOverlay;
    if (scenario?.canvasOutline) style['--canvas-outline'] = scenario.canvasOutline;
    if (scenario?.floatBg) style['--float-bg'] = scenario.floatBg;
    if (scenario?.floatBorder) style['--float-border'] = scenario.floatBorder;
    return style;
  }, [palette, scenario]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (!media) return;
    const handler = (event) => setReduceMotion(event.matches);
    setReduceMotion(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setScenarioIndex((prev) => (prev + 1) % DEMO_SCENARIOS.length);
    }, 7500);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scenario || !palette) return;
    new QRious({
      element: canvas,
      value: scenario.value || 'https://qr.ovate/demo',
      size: 200,
      background: palette.bg,
      foreground: palette.fg
    });
    stylizeQr(canvas, scenario, palette);
  }, [scenario, palette]);

  return (
    <div className="hero-demo" style={accentStyle} data-scenario={scenario?.id}>
      <div className="hero-demo-glow" aria-hidden="true" />
      <div className="hero-demo-orb hero-demo-orb-one" aria-hidden="true" />
      <div className="hero-demo-orb hero-demo-orb-two" aria-hidden="true" />

      <div className="hero-demo-inner">
        <div className="hero-demo-bar">
          <div className="hero-demo-progress" aria-label="QR scenarios preview">
            {DEMO_SCENARIOS.map((demo, index) => (
              <span
                key={demo.id}
                className={index === scenarioIndex ? 'hero-progress-dot active' : 'hero-progress-dot'}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="hero-demo-canvas">
          <canvas ref={canvasRef} width="200" height="200" />
        </div>

        <div className="hero-demo-meta">
          <span className="hero-demo-label">{scenario.label}</span>
          <p>{scenario.description}</p>
        </div>

        <div className="hero-demo-previews">
          {audioFile && (
            <div className="hero-media-bar hero-media-audio">
              <div className="hero-media-pill-icon" aria-hidden="true">
                <span>▶</span>
              </div>
              <div className="hero-media-bar-info">
                <div className="hero-media-bar-top">
                  <strong>{audioFile.label}</strong>
                  <span>{audioFile.duration || '02:10'}</span>
                </div>
                <div className="hero-media-progress">
                  <span className="hero-media-progress-fill" />
                </div>
              </div>
            </div>
          )}

          {pdfFile && (
            <div className="hero-media-bar hero-media-pdf">
              <div className="hero-media-pill-icon" aria-hidden="true">
                <span>PDF</span>
              </div>
              <div className="hero-media-bar-info">
                <div className="hero-media-bar-top">
                  <strong>{pdfFile.label}</strong>
                  <span>{pdfFile.pages ? `${pdfFile.pages} pages` : 'PDF file'}</span>
                </div>
              </div>
            </div>
          )}

          {linkFile && (
            <div className="hero-media-bar hero-media-link">
              <div className="hero-media-pill-icon" aria-hidden="true">
                <span>URL</span>
              </div>
              <div className="hero-media-bar-info">
                <div className="hero-media-bar-top">
                  <strong>{linkFile.label}</strong>
                  <span>{linkFile.hint || 'Live microsite'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hero-demo-float hero-demo-float-stats">
        <strong>+18%</strong>
        <span>Higher scan rate with branded colors</span>
      </div>
      <div className="hero-demo-float hero-demo-float-signal">
        <span className="dot" aria-hidden="true" />
        <span>Dynamic redirect ready</span>
      </div>
    </div>
  );
}
