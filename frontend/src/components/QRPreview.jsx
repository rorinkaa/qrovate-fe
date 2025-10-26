import React, { useState } from 'react';
import QRCode from 'qrcode';

export default function QRPreview({ url, size = 256 }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!url) return;
    
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: size,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(dataUrl);
      } catch (e) {
        console.error('Failed to generate QR:', e);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };
    
    generateQR();
  }, [url, size]);

  if (loading) {
    return (
      <div className="qr-preview-loading" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '10px', color: '#64748b' }}>Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-preview-error" style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="qr-preview" style={{ textAlign: 'center', padding: '20px' }}>
      <img 
        src={qrDataUrl} 
        alt="QR Code Preview" 
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}
      />
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b', wordBreak: 'break-all' }}>
        {url}
      </p>
    </div>
  );
}


