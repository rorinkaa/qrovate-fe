import React from 'react';
import { API } from '../api';

// Small presentational card to show the most recently created QR
export default function RecentCard({ item, onEdit }) {
  if (!item) return (
    <div className="recent-card empty" aria-hidden="true">No recent activity</div>
  );

  const isPending = item._pending === true;
  const id = item.id;
  const name = item.name || (id ? `QR ${id.slice(0, 8)}` : 'Untitled QR');
  const type = item.template ? 'Static' : (item.target ? 'Dynamic' : 'QR');
  const createdAgo = item.createdAt ? formatRelative(item.createdAt) : 'moments ago';

  function formatRelative(value) {
    if (!value) return 'moments ago';
    const diff = Date.now() - Number(value);
    const minutes = Math.round(diff / (60 * 1000));
    if (minutes < 1) return 'moments ago';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  const previewSrc = id ? `${API}/qr/svg/${id}` : null;

  return (
    <div className="recent-card">
      <div className="recent-preview">
        {previewSrc ? (
          <img src={previewSrc} alt={`Preview for ${name}`} />
        ) : (
          <div className="recent-placeholder">Preview</div>
        )}
      </div>

      <div className="recent-body">
        <div className="recent-head">
          <div className="recent-meta">
            <strong className="recent-name">{name}</strong>
            <div className="recent-sub">{type} • {createdAgo}{isPending ? ' • syncing…' : ''}</div>
          </div>
          <div className="recent-actions">
            {id && (
              <a className="icon-button" href={`${API}/qr/${id}`} target="_blank" rel="noreferrer" title="Open public link">🔗</a>
            )}
            {id && (
              <a className="icon-button" href={`${API}/qr/svg/${id}`} target="_blank" rel="noreferrer" title="Open SVG">🖼️</a>
            )}
            <button className="btn-secondary small" onClick={() => onEdit && onEdit(item)}>Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
