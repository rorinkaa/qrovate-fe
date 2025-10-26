import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/ui/Icon.jsx';

export default function Viewer(){
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

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

  return (
    <section className="card" style={{maxWidth:700, margin:'20px auto'}}>
      <h2>QR Content</h2>
      {kind === 'url' && <a href={payload.url} target="_blank" rel="noreferrer">Open link</a>}

      {kind === 'vcard' && (
        <>
          <p>Contact card</p>
          <a
            href={URL.createObjectURL(new Blob([payload.vcf || ''], { type:'text/vcard' }))}
            download="contact.vcf"
          >Download contact (.vcf)</a>
        </>
      )}

      {kind === 'wifi' && (
        <>
          <p>Wi-Fi network</p>
          <pre>{`SSID: ${payload.ssid || ''}\nAuth: ${payload.auth || 'WPA'}\nPassword: ${payload.password || ''}`}</pre>
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
          <audio controls style={{ width: '100%', maxWidth: '400px' }}>
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