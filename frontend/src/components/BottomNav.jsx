import React from 'react';

export default function BottomNav({ nav = [], view, setView, openBuilder, setDashboardAlert }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {nav.map(item => {
        const isActive = view === item.id || (item.id === 'builder' && view === 'builder');
        const short = item.id === 'summary' ? 'Home' : (item.id === 'codes' ? 'Codes' : 'New');
        return (
          <button
            key={item.id}
            className={isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}
            onClick={() => {
              setDashboardAlert && setDashboardAlert(null);
              if (item.id === 'builder') {
                openBuilder && openBuilder({ type: 'dynamic-new', codeId: null });
                return;
              }
              setView && setView(item.id);
            }}
            aria-label={item.label}
            title={item.label}
          >
            <div className="bni-icon" aria-hidden="true">
              {item.id === 'summary' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" fill="currentColor"/></svg>
              )}
              {item.id === 'codes' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h4v4H3V5zm6 0h4v4H9V5zM3 11h4v4H3v-4zm6 0h4v4H9v-4zM15 5h4v4h-4V5zM15 11h4v4h-4v-4zM3 17h4v2H3v-2zm6 0h4v2H9v-2zM15 17h4v2h-4v-2z" fill="currentColor"/></svg>
              )}
              {item.id === 'builder' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 11V3h2v8h8v2h-8v8h-2v-8H3v-2h8z" fill="currentColor"/></svg>
              )}
            </div>
            <div className="bni-label">{short}</div>
          </button>
        );
      })}
    </nav>
  );
}
