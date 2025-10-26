import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Icon from './ui/Icon.jsx';

export default function LiveQRPreview({ qr }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!qr) return;
    
    const generateQR = async () => {
      try {
        setLoading(true);
        const url = qr.target || 'https://example.com';
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(dataUrl);
      } catch (e) {
        console.error('Failed to generate QR:', e);
      } finally {
        setLoading(false);
      }
    };
    
    generateQR();
  }, [qr]);

  const destination = qr?.target || 'https://example.com';
  const displayName = qr?.name || 'QR Code';

  return (
    <div className="qr-preview-card" style={{ marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="smartphone" size={20} />
          <span>Live Preview</span>
        </h3>
        <button
          className="glass-button"
          onClick={() => setScanned(!scanned)}
          style={{ padding: '8px 16px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {scanned ? (
            <>
              <Icon name="refresh" size={16} />
              <span>Reset</span>
            </>
          ) : (
            <>
              <Icon name="pointer" size={16} />
              <span>Simulate Scan</span>
            </>
          )}
        </button>
      </div>

      {/* QR Code Display */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        {loading ? (
          <div className="loading-shimmer" style={{ 
            width: '300px', 
            height: '300px', 
            borderRadius: '12px',
            margin: '0 auto'
          }} />
        ) : qrDataUrl ? (
          <div className="scan-effect" style={{ display: 'inline-block' }}>
            <img 
              src={qrDataUrl} 
              alt="QR Code" 
              style={{ 
                width: '300px',
                height: '300px',
                borderRadius: '12px',
                border: '4px solid #fff',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Mobile Preview */}
      {scanned && (
        <div className="mobile-preview">
          <div style={{ 
            color: 'white', 
            fontSize: '14px', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#00ff00',
              animation: 'pulse 2s infinite'
            }} />
            Scanning...
          </div>
          
          <div className="mobile-screen">
            <div style={{ 
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <Icon name="success" size={48} strokeWidth={1.8} className="icon-success" />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#2563eb' }}>Scan Successful!</h3>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
                You would be redirected to:
              </p>
              <div style={{ 
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                wordBreak: 'break-all',
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: '600'
              }}>
                {destination}
              </div>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {displayName}
              </div>
            </div>
          </div>
        </div>
      )}

      {!scanned && (
        <div style={{ 
          background: 'rgba(37, 99, 235, 0.1)',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#2563eb'
        }}>
          <p style={{ margin: '0', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Icon name="pointer" size={16} />
            <span>Click "Simulate Scan" to see what users will see!</span>
          </p>
        </div>
      )}
    </div>
  );
}

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);


