/**
 * Equipment Sets UI — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Provides visual display of active equipment sets and their bonuses.
 * Shows which sets the player has completed and the stat bonuses they grant.
 */

import { equipmentSets, getActiveEquipmentSetIds, getEquipmentSetBonuses } from './equipment-sets.js';
import { items } from './data/items.js';

/**
 * Get detailed information about all equipment sets with active status.
 * @param {object|null} equipment - Player's equipped items { weapon, armor, accessory }
 * @returns {Array<{ set: object, isActive: boolean, equippedCount: number, totalRequired: number, missingItems: string[] }>}
 */
export function getEquipmentSetsStatus(equipment) {
  const equippedIds = equipment ? new Set(Object.values(equipment).filter(Boolean)) : new Set();
  
  return equipmentSets.map(set => {
    const equippedFromSet = set.requiredItems.filter(id => equippedIds.has(id));
    const missingItems = set.requiredItems.filter(id => !equippedIds.has(id));
    
    return {
      set,
      isActive: equippedFromSet.length === set.requiredItems.length,
      equippedCount: equippedFromSet.length,
      totalRequired: set.requiredItems.length,
      missingItems,
    };
  });
}

/**
 * Format a stat name for display.
 * @param {string} stat - Raw stat key (e.g., 'critChance')
 * @returns {string} Formatted stat name (e.g., 'Crit Chance')
 */
function formatStatName(stat) {
  const statNames = {
    attack: 'ATK',
    defense: 'DEF',
    speed: 'SPD',
    magic: 'MAG',
    critChance: 'Crit%',
  };
  return statNames[stat] || stat;
}

/**
 * Render HTML for the equipment set bonuses panel.
 * Shows active sets prominently and inactive sets with progress.
 * @param {object|null} equipment - Player's equipped items
 * @param {object} options - Display options
 * @param {boolean} [options.showInactive=true] - Whether to show inactive sets
 * @param {boolean} [options.compact=false] - Use compact display mode
 * @returns {string} HTML string
 */
export function renderEquipmentSetsPanel(equipment, options = {}) {
  const { showInactive = true, compact = false } = options;
  const setsStatus = getEquipmentSetsStatus(equipment);
  const activeSets = setsStatus.filter(s => s.isActive);
  const inactiveSets = setsStatus.filter(s => !s.isActive);
  
  let html = '<div class="equipment-sets-panel">';
  html += '<h3 class="sets-header">⚔️ Equipment Sets</h3>';
  
  // Active sets section
  if (activeSets.length > 0) {
    html += '<div class="active-sets">';
    for (const { set } of activeSets) {
      html += renderSetCard(set, true, compact);
    }
    html += '</div>';
  } else {
    html += '<p class="no-active-sets">No complete sets equipped</p>';
  }
  
  // Inactive sets section (collapsible/optional)
  if (showInactive && inactiveSets.length > 0) {
    html += '<div class="inactive-sets">';
    html += '<h4 class="inactive-header">Available Sets</h4>';
    for (const { set, equippedCount, totalRequired, missingItems } of inactiveSets) {
      html += renderSetProgress(set, equippedCount, totalRequired, missingItems, compact);
    }
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * Render an active set card with full bonus display.
 * @param {object} set - Equipment set definition
 * @param {boolean} isActive - Whether the set is active
 * @param {boolean} compact - Use compact mode
 * @returns {string} HTML string
 */
function renderSetCard(set, isActive, compact) {
  const bonusEntries = Object.entries(set.bonuses).filter(([_, v]) => v > 0);
  const bonusText = bonusEntries.map(([stat, val]) => `+${val} ${formatStatName(stat)}`).join(', ');
  
  if (compact) {
    return `
      <div class="set-card set-card--active set-card--compact">
        <span class="set-name">✨ ${escapeHtml(set.name)}</span>
        <span class="set-bonuses">${bonusText}</span>
      </div>
    `;
  }
  
  return `
    <div class="set-card set-card--active">
      <div class="set-header">
        <span class="set-icon">✨</span>
        <span class="set-name">${escapeHtml(set.name)}</span>
      </div>
      <p class="set-flavor">${escapeHtml(set.flavor)}</p>
      <div class="set-bonuses">
        ${bonusEntries.map(([stat, val]) => 
          `<span class="bonus-item bonus-item--${stat}">+${val} ${formatStatName(stat)}</span>`
        ).join('')}
      </div>
      <div class="set-items">
        ${set.requiredItems.map(id => {
          const item = items[id];
          return `<span class="set-item set-item--equipped">✓ ${escapeHtml(item?.name || id)}</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render an inactive set with progress indicator.
 * @param {object} set - Equipment set definition
 * @param {number} equippedCount - Number of set items currently equipped
 * @param {number} totalRequired - Total items needed for set
 * @param {string[]} missingItems - IDs of items not yet equipped
 * @param {boolean} compact - Use compact mode
 * @returns {string} HTML string
 */
function renderSetProgress(set, equippedCount, totalRequired, missingItems, compact) {
  const progressPct = Math.round((equippedCount / totalRequired) * 100);
  const bonusEntries = Object.entries(set.bonuses).filter(([_, v]) => v > 0);
  const bonusText = bonusEntries.map(([stat, val]) => `+${val} ${formatStatName(stat)}`).join(', ');
  
  if (compact) {
    return `
      <div class="set-card set-card--inactive set-card--compact">
        <span class="set-name">${escapeHtml(set.name)}</span>
        <span class="set-progress">${equippedCount}/${totalRequired}</span>
      </div>
    `;
  }
  
  return `
    <div class="set-card set-card--inactive">
      <div class="set-header">
        <span class="set-name">${escapeHtml(set.name)}</span>
        <span class="set-progress-badge">${equippedCount}/${totalRequired}</span>
      </div>
      <div class="set-progress-bar">
        <div class="set-progress-fill" style="width: ${progressPct}%"></div>
      </div>
      <div class="set-bonuses set-bonuses--preview">
        ${bonusText}
      </div>
      <div class="set-items">
        ${set.requiredItems.map(id => {
          const item = items[id];
          const isEquipped = !missingItems.includes(id);
          const cls = isEquipped ? 'set-item--equipped' : 'set-item--missing';
          const icon = isEquipped ? '✓' : '○';
          return `<span class="set-item ${cls}">${icon} ${escapeHtml(item?.name || id)}</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Get CSS styles for the equipment sets panel.
 * @returns {string} CSS string
 */
export function getEquipmentSetsPanelStyles() {
  return `
    .equipment-sets-panel {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #3a3a5a;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    }
    
    .sets-header {
      color: #ffd700;
      font-size: 1.1em;
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #3a3a5a;
    }
    
    .no-active-sets {
      color: #888;
      font-style: italic;
      margin: 8px 0;
    }
    
    .inactive-header {
      color: #aaa;
      font-size: 0.9em;
      margin: 12px 0 6px 0;
    }
    
    .set-card {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      padding: 10px;
      margin: 6px 0;
    }
    
    .set-card--active {
      border: 1px solid #4a9;
      box-shadow: 0 0 8px rgba(68, 170, 153, 0.3);
    }
    
    .set-card--inactive {
      border: 1px solid #444;
      opacity: 0.85;
    }
    
    .set-card--compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
    }
    
    .set-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    
    .set-icon {
      font-size: 1.2em;
    }
    
    .set-name {
      color: #fff;
      font-weight: bold;
    }
    
    .set-card--active .set-name {
      color: #4a9;
    }
    
    .set-flavor {
      color: #999;
      font-size: 0.85em;
      font-style: italic;
      margin: 4px 0;
    }
    
    .set-progress-badge {
      background: #333;
      color: #aaa;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85em;
      margin-left: auto;
    }
    
    .set-progress-bar {
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin: 6px 0;
      overflow: hidden;
    }
    
    .set-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4a9 0%, #6cb 100%);
      transition: width 0.3s ease;
    }
    
    .set-bonuses {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 6px 0;
    }
    
    .set-bonuses--preview {
      color: #888;
      font-size: 0.85em;
    }
    
    .bonus-item {
      background: rgba(68, 170, 153, 0.2);
      color: #4a9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    
    .set-items {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    
    .set-item {
      font-size: 0.85em;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    .set-item--equipped {
      color: #4a9;
      background: rgba(68, 170, 153, 0.15);
    }
    
    .set-item--missing {
      color: #888;
      background: rgba(136, 136, 136, 0.15);
    }
  `;
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
