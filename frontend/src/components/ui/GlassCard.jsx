import React from 'react';
export default function GlassCard({ as: Component = 'div', className = '', children, ...rest }) {
  const classes = ['glass-card', className].filter(Boolean).join(' ');
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
