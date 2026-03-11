/**
 * Battle Summary Screen
 * Displays XP gained, gold earned, items looted, and level-ups after a combat victory.
 */

import { computeDerivedStats, formatCombatStatsDisplay } from './combat-stats-tracker.js';

/**
 * Create a battle summary object from the victory state.
 * @param {object} state - The current game state (should be in 'victory' phase)
 * @returns {object} Battle summary data
 */
export function createBattleSummary(state) {
  const xpGained = state.xpGained ?? 0;
  const goldGained = state.goldGained ?? 0;
  const enemyName = state.enemy?.name ?? 'Unknown Enemy';
  const lootedItems = Array.isArray(state.lootedItems) ? [...state.lootedItems] : [];
  const levelUps = Array.isArray(state.pendingLevelUps) ? [...state.pendingLevelUps] : [];

  const summary = {
    xpGained,
    goldGained,
    enemyName,
    lootedItems,
    levelUps,
  };

  summary.combatStats = state.combatStats ?? null;
  summary.combatStatsDisplay = state.combatStats
    ? formatCombatStatsDisplay(state.combatStats)
    : null;

  return summary;
}

/**
 * Format a battle summary for display.
 * @param {object} summary - The battle summary object from createBattleSummary
 * @returns {object} Display-ready object
 */
export function formatBattleSummary(summary) {
  const levelUpLines = summary.levelUps.map((lu) => {
    const name = lu.memberName ?? lu.name ?? 'Unknown';
    const newLevel = lu.newLevel ?? '?';
    return `${name} reached level ${newLevel}!`;
  });

  const lootLines = summary.lootedItems.length > 0
    ? summary.lootedItems.map((item) => {
        const itemName = typeof item === 'string' ? item : (item.name ?? item.id ?? 'Unknown Item');
        return `Found: ${itemName}`;
      })
    : ['No items looted.'];

  return {
    title: 'Battle Won!',
    enemyLine: `Defeated: ${summary.enemyName}`,
    xpLine: `XP Gained: +${summary.xpGained}`,
    goldLine: `Gold Earned: +${summary.goldGained}`,
    lootLines,
    levelUpLines,
    hasLevelUps: summary.levelUps.length > 0,
    hasLoot: summary.lootedItems.length > 0,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderCombatStatsHtml(combatStatsDisplay) {
  if (!combatStatsDisplay || !Array.isArray(combatStatsDisplay.sections) || combatStatsDisplay.sections.length === 0) {
    return '';
  }

  const ratingColors = {
    S: '#d4af37',
    A: '#4f4',
    B: '#4af',
    C: '#999',
    D: '#f44',
  };

  const sectionsHtml = combatStatsDisplay.sections.map((section) => {
    if (section?.type === 'header') {
      const rating = escapeHtml(section.rating ?? '');
      const title = escapeHtml(section.title ?? '');
      const subtitle = escapeHtml(section.subtitle ?? '');
      const color = ratingColors[section.rating] ?? '#999';

      return `
        <div style="display:flex;align-items:center;gap:12px;margin:10px 0;">
          <div style="font-size:40px;font-weight:700;line-height:1;color:${color};min-width:36px;text-align:center;">
            ${rating}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;">${title}</div>
            <div style="font-size:13px;opacity:0.8;">${subtitle}</div>
          </div>
        </div>
      `;
    }

    if (section?.type === 'stats') {
      const title = escapeHtml(section.title ?? '');
      const rows = Array.isArray(section.rows) ? section.rows : [];
      const rowsHtml = rows.map((row) => {
        const label = escapeHtml(row.label ?? '');
        const value = escapeHtml(row.value ?? '');
        const style = row.style === 'good'
          ? 'good'
          : row.style === 'bad'
            ? 'bad'
            : '';
        const valueStyle = row.style === 'good'
          ? 'color:#4f4;'
          : row.style === 'bad'
            ? 'color:#f44;'
            : '';

        return `
          <div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0;">
            <div>${label}</div>
            <div class="${style}" style="${valueStyle}">${value}</div>
          </div>
        `;
      }).join('');

      return `
        <div style="margin:12px 0;">
          <h3 style="margin:0 0 6px 0;font-size:16px;">${title}</h3>
          <div>${rowsHtml}</div>
        </div>
      `;
    }

    return '';
  }).join('');

  return `
    <div class="combat-stats-panel" style="margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(0,0,0,0.25);">
      ${sectionsHtml}
    </div>
  `;
}
