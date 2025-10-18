import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

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

      {/* Fallback */}
      {(!['url','vcard','wifi'].includes(kind)) && (
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      )}
    </section>
  );
}