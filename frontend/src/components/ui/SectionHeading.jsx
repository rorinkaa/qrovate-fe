import React from 'react';

export default function SectionHeading({ eyebrow, title, subtitle, actions = null }) {
  return (
    <div className="section-heading-lg">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <h2>{title}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && (
        <div className="section-heading-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
