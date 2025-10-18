import QRious from 'qrious';

const toRad = (deg) => (deg * Math.PI) / 180;

function drawRoundedRect(ctx, x, y, width, height, radius, fill, shadow) {
  if (!ctx) return;
  const r = Math.min(radius, width / 2, height / 2);
  ctx.save();
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
  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
  }
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function createLinearGradient(ctx, width, height, angleDeg, c1, c2) {
  const angle = toRad(angleDeg);
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const half = Math.max(width, height) / 2;
  const x0 = cx - dx * half;
  const y0 = cy - dy * half;
  const x1 = cx + dx * half;
  const y1 = cy + dy * half;
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(1, c2);
  return gradient;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const DEFAULTS = {
  size: 256,
  background: '#ffffff',
  colorMode: 'solid', // or 'gradient'
  foreground: '#111111',
  foregroundSecondary: '#0066ff',
  gradientAngle: 45,
  frameStyle: 'none', // 'none' | 'rounded' | 'label'
  frameColor: '#ffffff',
  frameText: 'SCAN ME',
  frameTextColor: '#111111',
  frameFont: '600 18px "Inter", system-ui, sans-serif',
  frameShadow: { color: 'rgba(0,0,0,0.12)', blur: 16, offsetX: 0, offsetY: 10 },
  logoSizeRatio: 0.22,
  allowLogo: true,
};

export async function renderStyledQR(canvas, value, opts = {}) {
  if (!canvas) return null;
  const options = { ...DEFAULTS, ...(opts || {}) };
  const {
    size,
    background,
    colorMode,
    foreground,
    foregroundSecondary,
    gradientAngle,
    frameStyle,
    frameColor,
    frameText,
    frameTextColor,
    frameFont,
    frameShadow,
    logoDataUrl,
    logoSizeRatio,
    allowLogo,
  } = options;

  const labelHeight = frameStyle === 'label' ? Math.round(size * 0.28) : 0;
  const framePadding = frameStyle === 'none' ? Math.round(size * 0.08) : Math.round(size * 0.14);
  const qrAreaSize = size;
  const totalWidth = qrAreaSize + framePadding * 2;
  const totalHeight = qrAreaSize + framePadding * 2 + labelHeight;

  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, totalWidth, totalHeight);

  // Background (outside frame)
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  const frameX = framePadding * 0.35;
  const frameY = framePadding * 0.35;
  const frameWidth = totalWidth - frameX * 2;
  const frameHeight = qrAreaSize + framePadding * 1.3;

  if (frameStyle === 'rounded' || frameStyle === 'label') {
    const radius = Math.min(frameWidth, frameHeight) * 0.12;
    drawRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, radius, frameColor, frameShadow);
  }

  const qrCanvas = document.createElement('canvas');
  const qr = new QRious({
    element: qrCanvas,
    value: value || ' ',
    size: qrAreaSize,
    background: '#ffffff',
    backgroundAlpha: 0,
    foreground: '#000000',
  });
  void qr; // silence lint regarding unused variable (side-effect constructor)

  const qctx = qrCanvas.getContext('2d');
  qctx.globalCompositeOperation = 'source-in';
  if (colorMode === 'gradient') {
    const gradient = createLinearGradient(qctx, qrAreaSize, qrAreaSize, gradientAngle, foreground, foregroundSecondary);
    qctx.fillStyle = gradient;
  } else {
    qctx.fillStyle = foreground;
  }
  qctx.fillRect(0, 0, qrAreaSize, qrAreaSize);
  qctx.globalCompositeOperation = 'source-over';

  const qrX = (totalWidth - qrAreaSize) / 2;
  const qrY = framePadding;
  ctx.drawImage(qrCanvas, qrX, qrY, qrAreaSize, qrAreaSize);

  if (frameStyle === 'label') {
    const labelTop = frameY + frameHeight - labelHeight + framePadding * 0.3;
    drawRoundedRect(
      ctx,
      frameX + framePadding * 0.3,
      labelTop,
      frameWidth - framePadding * 0.6,
      labelHeight - framePadding * 0.6,
      999,
      background,
      { color: 'transparent', blur: 0, offsetX: 0, offsetY: 0 }
    );
    ctx.fillStyle = frameTextColor;
    ctx.font = frameFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frameText, totalWidth / 2, labelTop + (labelHeight - framePadding * 0.6) / 2);
  }

  if (logoDataUrl && allowLogo) {
    try {
      const img = await loadImage(logoDataUrl);
      if (img) {
        const logoSize = qrAreaSize * Math.min(Math.max(logoSizeRatio, 0.1), 0.35);
        const logoX = qrX + (qrAreaSize - logoSize) / 2;
        const logoY = qrY + (qrAreaSize - logoSize) / 2;
        const pad = logoSize * 0.22;
        ctx.save();
        drawRoundedRect(
          ctx,
          logoX - pad / 2,
          logoY - pad / 2,
          logoSize + pad,
          logoSize + pad,
          logoSize * 0.2,
          '#ffffff',
          { color: 'rgba(0,0,0,0.12)', blur: 8, offsetX: 0, offsetY: 2 }
        );
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      }
    } catch (e) {
      console.warn('Failed to load logo image', e);
    }
  }

  return { width: totalWidth, height: totalHeight };
}
