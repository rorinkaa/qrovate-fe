import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Icon from './ui/Icon.jsx';

export default function QRSearch({ onSelect, onResultsChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        if (onResultsChange) onResultsChange([]);
        return;
      }

      setLoading(true);
      try {
        const data = await api(`/qr/search?q=${encodeURIComponent(searchTerm)}`);
        setResults(data || []);
        if (onResultsChange) onResultsChange(data || []);
      } catch (e) {
        console.error('Search failed:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, onResultsChange]);

  return (
    <div className="qr-search">
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search your QR codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '16px 20px',
            paddingLeft: '48px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontSize: '16px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            e.target.style.borderColor = '#2563eb';
            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.7)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}>
          <Icon name="search" size={20} />
        </div>
        {loading && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
          </div>
        )}
      </div>
      
      {results.length > 0 && (
        <div className="search-results" style={{ marginTop: '12px' }}>
          {results.map(qr => (
            <div
              key={qr.id}
              onClick={() => onSelect && onSelect(qr)}
              className="search-result-item"
              style={{
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.transform = 'translateX(4px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.6)';
                e.target.style.transform = 'translateX(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>{qr.name}</div>
              <div style={{ fontSize: '14px', color: '#64748b', wordBreak: 'break-all' }}>{qr.target}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="stats" size={14} />
                <span>{qr.scanCount || 0} scans</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
