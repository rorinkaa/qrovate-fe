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

  return (
    <nav className={classes.join(' ')}>
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
            onClick={onSelect ? () => onSelect(index, step) : undefined}
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
