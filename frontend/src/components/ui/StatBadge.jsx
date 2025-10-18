import React from 'react';

export default function StatBadge({ label, value, trend, icon, tone = 'info' }) {
  return (
    <div className={['stat-badge', `tone-${tone}`].filter(Boolean).join(' ')}>
      <div className="stat-badge-icon">{icon || '★'}</div>
      <div className="stat-badge-body">
        <span className="stat-badge-label">{label}</span>
        <strong className="stat-badge-value">{value}</strong>
      </div>
      {trend && <span className="stat-badge-trend">{trend}</span>}
    </div>
  );
}
