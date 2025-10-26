import React, { useState } from 'react';
import Icon from './ui/Icon.jsx';

export default function QRDownload({ qrId, qrName, iconSize = 18 }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format) => {
    if (!qrId) return;
    
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/qr/download/${qrId}?format=${format}&size=512`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qrName || 'qr-code'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      className="icon-button"
      onClick={() => handleDownload('png')}
      disabled={downloading}
      title="Download PNG"
      aria-label="Download PNG"
    >
      {downloading ? (
        <Icon name="loader" className="icon-spin" size={iconSize} />
      ) : (
        <Icon name="download" size={iconSize} />
      )}
    </button>
  );
}
