/**
 * Bestiary UI Module — Renders the monster compendium panel.
 * Shows encountered enemies, their stats, and defeat counts.
 */

import {
  getAllBestiaryEntries,
  getEncounteredCount,
  getDefeatedUniqueCount,
  getCompletionPercent,
  getTotalEnemyCount,
} from './bestiary.js';
import { getEnemyShieldData, ELEMENT_ICONS, ENEMY_SHIELD_DATABASE } from './shield-break.js';

export const BESTIARY_SORT_DEFAULT = 'id';
export const BESTIARY_FILTER_DEFAULT = 'all';

export const BESTIARY_SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'hp', label: 'HP' },
  { value: 'defeated', label: 'Defeated' },
];

export const BESTIARY_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'bosses', label: 'Bosses' },
  { value: 'regular', label: 'Regular' },
  { value: 'encountered', label: 'Encountered' },
  { value: 'defeated', label: 'Defeated' },
];

function filterBestiaryEntries(entries, filter) {
  if (filter === 'bosses') return entries.filter((entry) => entry.isBoss);
  if (filter === 'regular') return entries.filter((entry) => !entry.isBoss);
  if (filter === 'encountered') return entries.filter((entry) => entry.encountered);
  if (filter === 'defeated') return entries.filter((entry) => (entry.timesDefeated || 0) > 0);
  return entries;
}

function sortBestiaryEntries(entries, sort) {
  const sorted = [...entries];
  if (sort === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    return sorted;
  }
  if (sort === 'hp') {
    sorted.sort((a, b) => (b.maxHp || 0) - (a.maxHp || 0) || a.id.localeCompare(b.id));
    return sorted;
  }
  if (sort === 'defeated') {
    sorted.sort((a, b) => (b.timesDefeated || 0) - (a.timesDefeated || 0) || a.id.localeCompare(b.id));
    return sorted;
  }
  sorted.sort((a, b) => a.id.localeCompare(b.id));
  return sorted;
}

export function renderShieldInfo(enemyId) {
  if (!enemyId || !Object.prototype.hasOwnProperty.call(ENEMY_SHIELD_DATABASE, enemyId)) {
    return '';
  }
  const data = getEnemyShieldData(enemyId);

  const renderElements = (elements) => {
    if (!elements || elements.length === 0) {
      return 'None';
    }
    return elements
      .map((element) => {
        const icon = ELEMENT_ICONS[element] || element;
        return `<span class="bestiary-element-tag bestiary-el-${element}" title="${element}">${icon}</span>`;
      })
      .join('');
  };

  let html = '<div class="bestiary-shield-info">';
  html += `<div>🛡️ Shields: ${data.shieldCount}${data.breakImmune ? ' (Break Immune)' : ''}</div>`;
  html += `<div>Weak: ${renderElements(data.weaknesses)}</div>`;
  if (data.immunities && data.immunities.length > 0) {
    html += `<div>Immune: ${renderElements(data.immunities)}</div>`;
  }
  if (data.absorbs && data.absorbs.length > 0) {
    html += `<div>Absorbs: ${renderElements(data.absorbs)}</div>`;
  }
  html += '</div>';

  return html;
}

/**
 * Render the bestiary panel as an HTML string.
 * @param {Object} state - Full game state (must include state.bestiary)
 * @returns {string} HTML string for the bestiary panel
 */
export function renderBestiaryPanel(state) {
  const bestiary = state.bestiary;
  const uiState = state.bestiaryUiState || {};
  const sort = uiState.sort || BESTIARY_SORT_DEFAULT;
  const filter = uiState.filter || BESTIARY_FILTER_DEFAULT;
  if (!bestiary) {
    return '<div class="bestiary-panel"><p>Bestiary not available.</p></div>';
  }

  const entries = sortBestiaryEntries(
    filterBestiaryEntries(getAllBestiaryEntries(bestiary), filter),
    sort
  );
  const encountered = getEncounteredCount(bestiary);
  const defeated = getDefeatedUniqueCount(bestiary);
  const total = getTotalEnemyCount();
  const percent = getCompletionPercent(bestiary);

  let html = '<div class="bestiary-panel">';
  html += '<h2>Bestiary</h2>';
  html += `<div class="bestiary-summary">`;
  html += `<span>Encountered: ${encountered}/${total}</span>`;
  html += ` | <span>Defeated: ${defeated}/${total}</span>`;
  html += ` | <span>Completion: ${percent}%</span>`;
  html += `</div>`;
  html += '<div class="bestiary-controls">';
  html += '<label for="bestiarySort">Sort:</label>';
  html += '<select id="bestiarySort" data-action="SORT_BESTIARY">';
  for (const option of BESTIARY_SORT_OPTIONS) {
    const selected = option.value === sort ? ' selected' : '';
    html += `<option value="${option.value}"${selected}>${option.label}</option>`;
  }
  html += '</select>';
  html += '<label for="bestiaryFilter">Filter:</label>';
  html += '<select id="bestiaryFilter" data-action="FILTER_BESTIARY">';
  for (const option of BESTIARY_FILTER_OPTIONS) {
    const selected = option.value === filter ? ' selected' : '';
    html += `<option value="${option.value}"${selected}>${option.label}</option>`;
  }
  html += '</select>';
  html += '</div>';

  html += '<div class="bestiary-list">';

  for (const entry of entries) {
    if (!entry.encountered) {
      html += `<div class="bestiary-entry bestiary-unknown">`;
      html += `<span class="bestiary-name">???</span>`;
      html += entry.isBoss ? ' <span class="bestiary-boss-tag">[Boss]</span>' : '';
      html += `</div>`;
      continue;
    }

    const bossTag = entry.isBoss ? ' <span class="bestiary-boss-tag">[Boss]</span>' : '';
    html += `<div class="bestiary-entry bestiary-known${entry.isBoss ? ' bestiary-boss' : ''}">`;
    html += `<div class="bestiary-entry-header">`;
    html += `<span class="bestiary-name">${entry.name}</span>${bossTag}`;
    html += `<span class="bestiary-element">${entry.element || 'none'}</span>`;
    html += `</div>`;

    if (entry.description) {
      html += `<div class="bestiary-description">${entry.description}</div>`;
    }

    html += `<div class="bestiary-stats">`;
    html += `HP: ${entry.maxHp} | ATK: ${entry.atk} | DEF: ${entry.def} | SPD: ${entry.spd}`;
    html += `</div>`;
    html += `<div class="bestiary-rewards">`;
    html += `XP: ${entry.xpReward} | Gold: ${entry.goldReward}`;
    if (entry.phases) {
      html += ` | Phases: ${entry.phases}`;
    }
    html += `</div>`;
    html += `<div class="bestiary-defeats">Defeated: ${entry.timesDefeated} time${entry.timesDefeated !== 1 ? 's' : ''}</div>`;
    html += renderShieldInfo(entry.id);
    html += `</div>`;
  }

  html += '</div>';
  html += '<button class="bestiary-close-btn" data-action="CLOSE_BESTIARY">Close</button>';
  html += '</div>';

  return html;
}
