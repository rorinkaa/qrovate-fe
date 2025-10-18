import React from 'react';
import DynamicDashboard from './DynamicDashboard.jsx';

export default function BuilderFlow({ user, config = {}, onClose, onRefresh }) {
  return (
    <div className="builder-flow dynamic">
      <DynamicDashboard
        user={user}
        initialCodeId={config.codeId ?? null}
        initialType={config.type ?? null}
        onClose={onClose}
        onRefresh={onRefresh}
      />
    </div>
  );
}
