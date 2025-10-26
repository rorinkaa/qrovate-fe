import React, { useMemo, useState } from 'react';
import BulkQRGenerator from './BulkQRGenerator.jsx';
import QRStats from './QRStats.jsx';
import QRDownload from './QRDownload.jsx';
import QRSearch from './QRSearch.jsx';
import QRPreview from './QRPreview.jsx';
import GlassCard from './ui/GlassCard.jsx';
import Icon from './ui/Icon.jsx';

const FEATURE_TABS = [
  { id: 'preview', label: 'Preview', icon: 'eye' },
  { id: 'bulk', label: 'Bulk Create', icon: 'bulk' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'stats', label: 'Stats', icon: 'stats' },
  { id: 'download', label: 'Download', icon: 'download' }
];

export default function FeaturesDemo() {
  const [activeTab, setActiveTab] = useState('preview');
  const tabBaseStyle = useMemo(() => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  }), []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <Icon name="sparkles" size={28} />
        <span>New QRovate Features Demo</span>
      </h1>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FEATURE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabBaseStyle,
                backgroundColor: isActive ? '#2563eb' : '#e2e8f0',
                color: isActive ? 'white' : '#0f172a'
              }}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'preview' && (
          <GlassCard>
            <h2>QR Code Preview</h2>
            <p>Generate a real-time preview of any QR code:</p>
            <QRPreview url="https://example.com" size={256} />
          </GlassCard>
        )}

        {activeTab === 'bulk' && (
          <BulkQRGenerator 
            onSuccess={(results) => {
              console.log('Created QR codes:', results);
              alert(`Successfully created ${results.filter(r => r.success).length} QR codes!`);
            }}
          />
        )}

        {activeTab === 'search' && (
          <GlassCard>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="search" size={22} />
              <span>Search QR Codes</span>
            </h2>
            <p>Search through your QR codes:</p>
            <QRSearch 
              onSelect={(qr) => alert(`Selected: ${qr.name}`)}
              onResultsChange={(results) => console.log('Found:', results.length, 'results')}
            />
          </GlassCard>
        )}

        {activeTab === 'stats' && (
          <GlassCard>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="stats" size={22} />
              <span>QR Statistics</span>
            </h2>
            <p>View detailed statistics for your QR codes:</p>
            <QRStats qrId="demo-qr-id" />
          </GlassCard>
        )}

        {activeTab === 'download' && (
          <GlassCard>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="download" size={22} />
              <span>Download QR Code</span>
            </h2>
            <p>Download your QR code in different formats:</p>
            <QRDownload qrId="demo-qr-id" qrName="Demo QR" />
          </GlassCard>
        )}
      </div>

      {/* Backend Info */}
      <GlassCard style={{ marginTop: '30px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon name="link" size={20} />
          <span>Backend Endpoints</span>
        </h3>
        <div style={{ fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px' }}>
          <div>GET /qr/templates - Get QR templates</div>
          <div>GET /qr/search?q=term - Search QR codes</div>
          <div>GET /qr/stats/:id - Get statistics</div>
          <div>GET /qr/download/:id - Download QR code</div>
          <div>POST /qr/bulk-create - Bulk create QR codes</div>
        </div>
      </GlassCard>
    </div>
  );
}
