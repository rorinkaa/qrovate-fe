import React, { useState } from 'react';
import { api } from '../api';

export default function BulkGenerator({ onSuccess }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      // Parse CSV format: URL,Name
      const lines = input.trim().split('\n');
      const items = lines.map(line => {
        const [target, name] = line.split(',').map(s => s.trim());
        return { target, name: name || 'Untitled QR' };
      });
      
      const response = await api('/qr/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      setResults(response.results || []);
      if (onSuccess) onSuccess(response.results);
    } catch (e) {
      alert('Failed to generate QR codes: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-generator glass-card">
      <h3>Bulk QR Code Generator</h3>
      <p className="small">Enter URLs, one per line, or CSV format: URL,Name</p>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="https://example.com/page1, Landing Page 1&#10;https://example.com/page2, Landing Page 2&#10;https://example.com/page3, Landing Page 3"
        className="bulk-input"
        rows={8}
      />
      
      <button 
        className="btn-primary" 
        onClick={handleGenerate}
        disabled={loading || !input.trim()}
      >
        {loading ? 'Generating...' : 'Generate QR Codes'}
      </button>
      
      {results.length > 0 && (
        <div className="bulk-results">
          <h4>Results:</h4>
          <ul>
            {results.map((result, i) => (
              <li key={i}>
                {result.success ? '✅' : '❌'} {result.name || result.id}
                {result.error && <span className="error"> - {result.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


