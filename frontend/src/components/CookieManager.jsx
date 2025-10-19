import React from 'react';

const categories = [
  {
    id: 'essential',
    label: 'Essential cookies',
    description: 'Required for authentication, security, and basic site functionality. These are always on.',
    managed: false
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Helps us understand how QR codes perform so we can improve features. Disabling limits insights.',
    managed: true
  },
  {
    id: 'personalization',
    label: 'Personalization',
    description: 'Saves dashboards, layouts, and recent activity to speed up repeat visits.',
    managed: true
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Allows limited emails about new features, templates, and offers. Never shared with third parties.',
    managed: true
  }
];

export default function CookieManager({ preferences, onUpdate, onSave, onClose }) {
  return (
    <div className="cookie-manager">
      <header className="cookie-manager-header">
        <span className="legal-pill">Cookie preferences</span>
        <h2>Control how we can use cookies</h2>
        <p>
          Choose which categories you want to enable. Essential cookies keep the app secure and can’t be turned off.
          You can revisit this panel from the footer at any time.
        </p>
      </header>

      <div className="cookie-manager-options">
        {categories.map(category => (
          <article key={category.id} className="cookie-option">
            <div>
              <h3>{category.label}</h3>
              <p>{category.description}</p>
            </div>
            <div className="cookie-toggle">
              {category.managed ? (
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!preferences[category.id]}
                    onChange={e => onUpdate(category.id, e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              ) : (
                <span className="cookie-required">Always on</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <footer className="cookie-manager-footer">
        <button type="button" className="btn-secondary ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-secondary" onClick={() => onSave('rejected')}>
          Save minimal
        </button>
        <button type="button" className="btn-primary" onClick={() => onSave('accepted')}>
          Save & accept selected
        </button>
      </footer>
    </div>
  );
}
