import React, { useState, useEffect } from 'react';
import Icon from './ui/Icon.jsx';

export default function QRStats({ qrId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!qrId) return;
    
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/qr/stats/${qrId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [qrId]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="qr-stats glass-card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <Icon name="stats" size={20} />
        <span>Statistics</span>
      </h3>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.scanCount || 0}</div>
          <div className="stat-label">Total Scans</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.blockedCount || 0}</div>
          <div className="stat-label">Failed Scans</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(stats.successRate || 0)}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.lastScanAt ? new Date(stats.lastScanAt).toLocaleDateString() : 'Never'}
          </div>
          <div className="stat-label">Last Scan</div>
        </div>
      </div>
    </div>
  );
}


