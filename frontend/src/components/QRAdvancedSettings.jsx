import React, { useState } from 'react';
import { api } from '../api';

export default function QRAdvancedSettings({ qr, onUpdate }) {
  const [password, setPassword] = useState(qr?.password || '');
  const [hasPassword, setHasPassword] = useState(!!qr?.password);
  const [expiresAt, setExpiresAt] = useState(qr?.expiresAt ? new Date(qr.expiresAt).toISOString().split('T')[0] : '');
  const [scheduledStart, setScheduledStart] = useState(qr?.scheduledStart ? new Date(qr.scheduledStart).toISOString().slice(0, 16) : '');
  const [scheduledEnd, setScheduledEnd] = useState(qr?.scheduledEnd ? new Date(qr.scheduledEnd).toISOString().slice(0, 16) : '');
  const [alternateTarget, setAlternateTarget] = useState(qr?.alternateTarget || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!qr?.id) return;
    
    setSaving(true);
    try {
      await api('/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: qr.id,
          password: hasPassword ? password : null,
          expiresAt: expiresAt || null,
          scheduledStart: scheduledStart || null,
          scheduledEnd: scheduledEnd || null,
          alternateTarget: alternateTarget || null
        })
      });
      
      if (onUpdate) onUpdate();
      alert('Settings saved successfully!');
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qr-advanced-settings glass-card">
      <h3>Advanced Settings</h3>
      
      {/* Password Protection */}
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={hasPassword}
            onChange={(e) => setHasPassword(e.target.checked)}
          />
          <span>Password Protect</span>
        </label>
        {hasPassword && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mt-2"
          />
        )}
      </div>
      
      {/* Expiration */}
      <div className="setting-group">
        <label>Expiration Date</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <p className="small">QR code will redirect to alternate URL after this date</p>
      </div>
      
      {/* Scheduled Redirect */}
      <div className="setting-group">
        <label>Schedule Start</label>
        <input
          type="datetime-local"
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
        />
      </div>
      
      <div className="setting-group">
        <label>Schedule End</label>
        <input
          type="datetime-local"
          value={scheduledEnd}
          onChange={(e) => setScheduledEnd(e.target.value)}
        />
        <p className="small">QR code will redirect to alternate URL outside this schedule</p>
      </div>
      
      {/* Alternate Target */}
      <div className="setting-group">
        <label>Alternate Target URL</label>
        <input
          type="text"
          value={alternateTarget}
          onChange={(e) => setAlternateTarget(e.target.value)}
          placeholder="https://example.com/expired"
        />
        <p className="small">Where to redirect when expired or outside schedule</p>
      </div>
      
      <button 
        className="btn-primary" 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}


