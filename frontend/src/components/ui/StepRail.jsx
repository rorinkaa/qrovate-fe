import React from 'react';

export default function StepRail({
  steps = [],
  current = 0,
  onSelect,
  compact = false,
  orientation = 'vertical'
}) {
  const classes = ['step-rail'];
  if (compact) classes.push('compact');
  if (orientation === 'horizontal') classes.push('horizontal');

  const navRef = React.useRef(null);

  const focusIndex = (idx) => {
    const container = navRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll('.step-rail-item'));
    const target = buttons[idx];
    if (target) target.focus();
  };

  const onKey = (e) => {
    const container = navRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll('.step-rail-item'));
    const activeEl = document.activeElement;
    const idx = buttons.indexOf(activeEl);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min((idx >= 0 ? idx : current) + 1, buttons.length - 1);
      focusIndex(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max((idx >= 0 ? idx : current) - 1, 0);
      focusIndex(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusIndex(buttons.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (idx >= 0 && onSelect) {
        e.preventDefault();
        onSelect(idx, steps[idx]);
      }
    }
  };

  return (
    <nav className={classes.join(' ')} ref={navRef} onKeyDown={onKey} aria-label="Steps">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;
        return (
          <button
            key={step.id || index}
            type="button"
            className={[
              'step-rail-item',
              isActive ? 'active' : '',
              isComplete ? 'complete' : ''
            ].filter(Boolean).join(' ')}
            aria-current={isActive ? 'step' : undefined}
            onClick={onSelect ? () => onSelect(index, step) : undefined}
            tabIndex={0}
          >
            <span className="step-rail-index">{index + 1}</span>
            <div className="step-rail-copy">
              <span className="step-rail-title">{step.title}</span>
              {step.caption && <span className="step-rail-caption">{step.caption}</span>}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
