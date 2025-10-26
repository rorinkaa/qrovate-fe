import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/ui/Icon.jsx';
import { useClipboard } from '../lib/useClipboard.js';

export default function Viewer(){
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const { copy: copyToClipboard } = useClipboard();

  const actionButtonStyle = {
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.45)',
    background: '#eef2ff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer'
  };

  useEffect(()=>{
    (async ()=>{
      try{
        // backend should return { kind, payload }
        const res = await api(`/qr/data/${id}`);
        setData(res);
      }catch(e){ setErr(e.message || 'Failed to load'); }
    })();
  },[id]);

  if(err) return <div className="card">Error: {err}</div>;
  if(!data) return <div className="card">Loading…</div>;

  const { kind, payload={} } = data;
  const shareUrl = typeof payload.url === 'string' ? payload.url : '';
  const contactPhone = payload.phone || payload.tel || '';
  const contactEmail = payload.email || '';
  const wifiPassword = payload.password || '';
  const wifiSsid = payload.ssid || '';

  return (
    <section className="card" style={{maxWidth:700, margin:'20px auto'}}>
      <h2>QR Content</h2>
      {kind === 'url' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          {shareUrl ? (
            <a href={shareUrl} target="_blank" rel="noreferrer" aria-label="Open destination link in a new tab">
              Open link
            </a>
          ) : (
            <span>No link configured.</span>
          )}
          {shareUrl && (
            <button
              type="button"
              style={actionButtonStyle}
              onClick={() => copyToClipboard(shareUrl, {
                successMessage: 'Link copied to clipboard',
                errorMessage: 'Could not copy link. Try again.'
              })}
              aria-label="Copy destination link to clipboard"
            >
              Copy link
            </button>
          )}
        </div>
      )}

      {kind === 'vcard' && (
        <>
          <p>Contact card</p>
          <a
            href={URL.createObjectURL(new Blob([payload.vcf || ''], { type:'text/vcard' }))}
            download="contact.vcf"
            aria-label="Download contact as VCF file"
          >Download contact (.vcf)</a>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {contactPhone && (
              <button
                type="button"
                style={actionButtonStyle}
                onClick={() => copyToClipboard(contactPhone, {
                  successMessage: 'Phone number copied',
                  errorMessage: 'Could not copy phone number.'
                })}
                aria-label="Copy phone number to clipboard"
              >
                Copy phone
              </button>
            )}
            {contactEmail && (
              <button
                type="button"
                style={actionButtonStyle}
                onClick={() => copyToClipboard(contactEmail, {
                  successMessage: 'Email address copied',
                  errorMessage: 'Could not copy email address.'
                })}
                aria-label="Copy email address to clipboard"
              >
                Copy email
              </button>
            )}
          </div>
        </>
      )}

      {kind === 'wifi' && (
        <>
          <p>Wi-Fi network</p>
          <pre>{`SSID: ${payload.ssid || ''}\nAuth: ${payload.auth || 'WPA'}\nPassword: ${payload.password || ''}`}</pre>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              style={actionButtonStyle}
              onClick={() => copyToClipboard(wifiPassword, {
                successMessage: 'Wi-Fi password copied',
                errorMessage: 'Nothing to copy — add a Wi-Fi password first.'
              })}
              aria-label="Copy Wi-Fi password to clipboard"
            >
              Copy password
            </button>
            <button
              type="button"
              style={actionButtonStyle}
              onClick={() => copyToClipboard(wifiSsid, {
                successMessage: 'Wi-Fi network copied',
                errorMessage: 'Nothing to copy — add a Wi-Fi network name first.'
              })}
              aria-label="Copy Wi-Fi network name to clipboard"
            >
              Copy network name
            </button>
          </div>
        </>
      )}

      {kind === 'pdf' && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: payload.backgroundColor || '#ffffff',
          color: payload.textColor || '#000000',
          minHeight: '100vh'
        }}>
          <h3 style={{ color: payload.textColor || '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Icon name="file" size={22} />
            <span>PDF Document</span>
          </h3>
          <p>Click below to download or view the PDF</p>
          <a
            href={payload.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Download or open PDF in a new tab"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: payload.accentColor || '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <Icon name="download" size={18} />
            <span>Download PDF</span>
          </a>
        </div>
      )}

      {kind === 'mp3' && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: payload.backgroundColor || '#f1f5f9',
          color: payload.textColor || '#475569',
          minHeight: '100vh'
        }}>
          <h3 style={{ color: payload.textColor || '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Icon name="audio" size={22} />
            <span>Audio File</span>
          </h3>
          <p>Play the audio file below</p>
          <audio controls style={{ width: '100%', maxWidth: '400px' }} aria-label="Audio playback for QR content">
            <source src={payload.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = payload.url;
                link.download = 'audio.mp3';
                link.click();
              }}
              aria-label="Download audio file"
              style={{
                background: payload.accentColor || '#2563eb',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 5,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon name="download" size={18} />
              <span>Download Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* Fallback */}
      {(!['url','vcard','wifi','pdf','mp3'].includes(kind)) && (
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      )}
    </section>
  );
}
