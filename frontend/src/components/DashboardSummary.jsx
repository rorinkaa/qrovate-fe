import React, { useMemo, useState } from 'react';
import GlassCard from './ui/GlassCard.jsx';
import RecentCard from './RecentCard.jsx';
import Icon from './ui/Icon.jsx';
import { FREE_PLAN_DYNAMIC_LIMIT, UPGRADES_ENABLED } from '../config/planLimits.js';

function formatNumber(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US').format(Number(value));
  } catch (_) {
    return String(value);
  }
}

function shortTarget(target) {
  if (!target) return '';
  const clean = target.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return clean.length > 40 ? `${clean.slice(0, 37)}…` : clean;
}

function formatRelative(dateLike) {
  if (!dateLike) return 'No updates yet';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default function DashboardSummary({ user, onCreateNew, onOpenCodes, lastCreated = null, onUpgrade }) {
  const upgradesEnabled = UPGRADES_ENABLED;
  const dynamicLimit = user.free_plan_dynamic_limit ?? FREE_PLAN_DYNAMIC_LIMIT;
  const dynamicCount = user.dynamic_count ?? 0;
  const remainingSlots = upgradesEnabled && !user.is_pro
    ? Math.max(0, dynamicLimit - dynamicCount)
    : Infinity;
  const planLabel = user.is_pro
    ? 'Pro plan active'
    : upgradesEnabled
      ? `Free plan · ${dynamicLimit} dynamic QR limit`
      : 'Free plan · unlimited dynamic QR';

  const scansToday = user.scans_today ?? user.scan_count ?? 0;
  const scanDelta = user.scan_delta ?? '+18% vs yesterday';
  const topCandidate = user.top_scan || (user.top_scans && user.top_scans[0]) || lastCreated;

  const navItems = useMemo(() => [
    {
      id: 'activity',
      label: 'Activity',
      subtitle: 'Scans & top links',
      icon: 'trend',
      action: null
    },
    {
      id: 'codes',
      label: 'My QR library',
      subtitle: 'Manage and export',
      icon: 'library',
      action: () => onOpenCodes?.()
    },
    {
      id: 'create',
      label: 'Create new',
      subtitle: 'Dynamic & static flows',
      icon: 'lightning',
      action: () => onCreateNew?.({ type: 'dynamic-new', codeId: null })
    },
    {
      id: 'templates',
      label: 'Campaign templates',
      subtitle: 'Jumpstart a project',
      icon: 'template',
      action: () => onOpenCodes?.()
    }
  ], [onCreateNew, onOpenCodes]);

  const [activeNav, setActiveNav] = useState(navItems[0]?.id ?? 'activity');

  const activityCards = useMemo(() => {
    const topLabel = topCandidate?.name || topCandidate?.label || shortTarget(topCandidate?.target) || 'Share your first QR';
    const topMeta = topCandidate?.scan_count != null
      ? `${formatNumber(topCandidate.scan_count)} total scans`
      : topCandidate?.target
        ? shortTarget(topCandidate.target)
        : 'Pick a campaign to start tracking';

    const lastLabel = lastCreated
      ? formatRelative(lastCreated.updatedAt || lastCreated.createdAt)
      : 'No edits yet';
    const lastMeta = lastCreated?.target ? shortTarget(lastCreated.target) : 'Make a change to see it here';

    return [
      {
        id: 'scans',
        icon: 'trend',
        label: 'Scans today',
        primary: formatNumber(scansToday),
        meta: scanDelta
      },
      {
        id: 'top',
        icon: 'sparkles',
        label: 'Top QR this week',
        primary: topLabel,
        meta: topMeta,
        onClick: () => onOpenCodes?.()
      },
      {
        id: 'updates',
        icon: 'refresh',
        label: 'Last update',
        primary: lastLabel,
        meta: lastMeta,
        onClick: lastCreated
          ? () => onCreateNew?.({ type: lastCreated.template ? 'static-edit' : 'dynamic-edit', codeId: lastCreated.id })
          : () => onCreateNew?.({ type: 'dynamic-new', codeId: null })
      }
    ];
  }, [lastCreated, onCreateNew, onOpenCodes, scanDelta, scansToday, topCandidate]);

  const assistantSteps = useMemo(() => {
    const steps = [];
    if (upgradesEnabled && !user.is_pro) {
      if (remainingSlots <= 1) {
        steps.push({
          id: 'upgrade',
          icon: 'rocket',
          title: 'Unlock unlimited dynamic QR codes',
          description: remainingSlots === 0
            ? 'You have used the free plan allotment. Upgrade to keep launching campaigns without limits.'
            : `Only ${remainingSlots} free dynamic slot${remainingSlots === 1 ? '' : 's'} remaining — upgrade to keep momentum.`,
          cta: onUpgrade ? { label: 'Upgrade to Pro', onClick: onUpgrade } : null
        });
      } else {
        steps.push({
          id: 'slot',
          icon: 'compass',
          title: 'Set up your next dynamic redirect',
          description: `You have ${remainingSlots} free slot${remainingSlots === 1 ? '' : 's'} ready. Use them for seasonal campaigns or menus.`,
          cta: { label: 'Create dynamic QR', onClick: () => onCreateNew?.({ type: 'dynamic-new', codeId: null }) }
        });
      }
    }

    if (lastCreated) {
      steps.push({
        id: 'automation',
        icon: 'refresh',
        title: 'Schedule an automation for your latest QR',
        description: 'Plan a timed redirect or add device-specific routing to keep the experience fresh.',
        cta: { label: 'Configure automation', onClick: () => onCreateNew?.({ type: lastCreated.template ? 'static-edit' : 'dynamic-edit', codeId: lastCreated.id }) }
      });
    }

    steps.push({
      id: 'static-kit',
      icon: 'printer',
      title: 'Export a fresh static kit',
      description: 'Generate branded PNG/SVG assets to share with your print or signage partners.',
      cta: { label: 'Open static studio', onClick: () => onCreateNew?.({ type: 'static-new', codeId: null }) }
    });

    return steps;
  }, [lastCreated, onCreateNew, onUpgrade, remainingSlots, upgradesEnabled, user.is_pro]);

  const quickActions = useMemo(() => [
    {
      icon: 'lightning',
      label: 'New dynamic QR',
      description: 'Editable target with analytics baked in.',
      onClick: () => onCreateNew?.({ type: 'dynamic-new', codeId: null })
    },
    {
      icon: 'static',
      label: 'Design static code',
      description: 'Jump into the static studio for instant exports.',
      onClick: () => onCreateNew?.({ type: 'static-new', codeId: null })
    },
    {
      icon: 'library',
      label: 'Manage QR library',
      description: 'Filter, share, or archive existing campaigns.',
      onClick: () => onOpenCodes?.()
    }
  ], [onCreateNew, onOpenCodes]);

  return (
    <div className="summary-shell">
      <aside className="summary-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-eyebrow">Workspace</span>
          <h2>{user.org || 'My dashboard'}</h2>
          <p>{planLabel}</p>
        </div>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={activeNav === item.id ? 'sidebar-nav-item active' : 'sidebar-nav-item'}
              onClick={() => {
                setActiveNav(item.id);
                item.action?.();
              }}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="sidebar-nav-copy">
                <strong>{item.label}</strong>
                {item.subtitle && <span>{item.subtitle}</span>}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {upgradesEnabled && !user.is_pro && onUpgrade && (
            <button type="button" className="btn-primary" onClick={onUpgrade}>Upgrade to Pro</button>
          )}
          <button type="button" className="btn-secondary ghost" onClick={() => onCreateNew?.({ type: 'dynamic-new', codeId: null })}>
            Launch new dynamic QR
          </button>
        </div>
      </aside>

      <div className="summary-main">
        <div className="summary-activity-grid">
          {activityCards.map(card => (
            <GlassCard
              key={card.id}
              className={card.onClick ? 'activity-card clickable' : 'activity-card'}
              role={card.onClick ? 'button' : undefined}
              tabIndex={card.onClick ? 0 : -1}
              onClick={card.onClick || undefined}
              onKeyDown={card.onClick ? (evt) => { if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); card.onClick(); } } : undefined}
            >
              <span className="activity-icon" aria-hidden="true">
                <Icon name={card.icon} size={18} />
              </span>
              <span className="activity-copy">
                <span className="activity-label">{card.label}</span>
                <strong className="activity-primary">{card.primary}</strong>
                {card.meta && <span className="activity-meta">{card.meta}</span>}
              </span>
            </GlassCard>
          ))}
        </div>

        <div className="summary-panels">
          <GlassCard className="assistant-card">
            <div className="assistant-header">
              <Icon name="sparkles" size={18} />
              <h3>Next best step</h3>
            </div>
            <ul className="assistant-list">
              {assistantSteps.map(step => (
                <li key={step.id}>
                  <span className="assistant-icon" aria-hidden="true">
                    <Icon name={step.icon} size={18} />
                  </span>
                  <div className="assistant-body">
                    <strong>{step.title}</strong>
                    {step.description && <p>{step.description}</p>}
                    {step.cta && (
                      <button type="button" onClick={step.cta.onClick}>{step.cta.label}</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="recent-card-wrap">
            <h3>Latest launch</h3>
            {lastCreated ? (
              <RecentCard
                item={lastCreated}
                onEdit={(item) => onCreateNew?.({ type: item.template ? 'static-edit' : 'dynamic-edit', codeId: item.id })}
              />
            ) : (
              <div className="recent-empty">
                <p>Launch a dynamic QR to see it here.</p>
                <button type="button" className="btn-primary" onClick={() => onCreateNew?.({ type: 'dynamic-new', codeId: null })}>
                  Create dynamic QR
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        <GlassCard className="quick-actions-card">
          <div className="quick-actions-header">
            <h3>Quick actions</h3>
            <span>Common flows at your fingertips.</span>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map(action => (
              <button
                key={action.label}
                type="button"
                className="quick-action-tile"
                onClick={action.onClick}
              >
                <Icon name={action.icon} size={20} />
                <div className="quick-action-copy">
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                </div>
                <span className="quick-action-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
