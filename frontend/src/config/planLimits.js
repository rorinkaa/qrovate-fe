const rawUpgradeFlag = import.meta.env.VITE_ENABLE_PRO_UPGRADE;
export const UPGRADES_ENABLED = String(rawUpgradeFlag || '').toLowerCase() === 'true';
export const FREE_PLAN_DYNAMIC_LIMIT = UPGRADES_ENABLED
  ? Number(import.meta.env.VITE_FREE_PLAN_DYNAMIC_LIMIT || 1)
  : Infinity;
