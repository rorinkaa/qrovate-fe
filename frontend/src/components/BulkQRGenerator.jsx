import React, { useState } from 'react';
import Icon from './ui/Icon.jsx';

export default function BulkQRGenerator({ onSuccess }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      // Parse input - can be URLs separated by newlines or CSV format
      const lines = input.trim().split('\n').filter(line => line.trim());
      const items = lines.map((line, index) => {
        line = line.trim();
        
        // Check if CSV format (URL,Name)
        if (line.includes(',')) {
          const [target, ...nameParts] = line.split(',');
          return {
            target: target.trim(),
            name: nameParts.join(',').trim() || `QR Code ${index + 1}`
          };
        }
        
        // Otherwise treat as URL
        return {
          target: line,
          name: `QR Code ${index + 1}`
        };
      });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/qr/bulk-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR codes');
      }
      
      setResults(data.results || []);
      
      if (onSuccess) {
        onSuccess(data.results);
      }
    } catch (e) {
      alert('Failed to generate QR codes: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-generator glass-card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icon name="bulk" size={22} />
        <span>Bulk QR Code Generator</span>
      </h3>
      <p className="small" style={{ marginBottom: '16px' }}>
        Enter URLs, one per line. Or use CSV format: URL,Name
      </p>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="https://example.com/page1, Landing Page 1&#10;https://example.com/page2, Landing Page 2&#10;https://example.com/page3, Landing Page 3"
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          minHeight: '150px',
          fontFamily: 'monospace',
          fontSize: '14px',
          marginBottom: '16px'
        }}
        rows={8}
      />
      
      <button 
        className="btn-primary btn-with-icon" 
        onClick={handleGenerate}
        disabled={loading || !input.trim()}
        style={{ width: '100%', marginBottom: '16px' }}
      >
        {loading ? (
          <>
            <Icon name="loader" className="icon-spin" />
            <span>Generating…</span>
          </>
        ) : (
          <>
            <Icon name="sparkles" />
            <span>Generate QR Codes</span>
          </>
        )}
      </button>
      
      {results.length > 0 && (
        <div className="bulk-results" style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>Results:</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((result, i) => (
              <div 
                key={i} 
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  borderRadius: '4px',
                  backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
                  color: result.success ? '#166534' : '#991b1b',
                  fontSize: '14px'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Icon
                    name={result.success ? 'success' : 'error'}
                    className={result.success ? 'icon-success' : 'icon-error'}
                  />
                  <span>{result.name || result.id}</span>
                </span>
                {result.error && <span style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>Error: {result.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

