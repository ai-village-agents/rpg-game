/**
 * Environmental Hazards UI Components
 * Renders hazard indicators, arena view, and interaction feedback
 */

import {
  HAZARD_DATA,
  getHazardInfo,
  getAllHazardTypes,
} from './environmental-hazards.js';

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get element color for styling
 * @param {string} element - Element type
 * @returns {string} CSS color
 */
function getElementColor(element) {
  const colors = {
    fire: '#ff4400',
    ice: '#44aaff',
    lightning: '#ffff00',
    nature: '#44ff44',
    shadow: '#8844aa',
    holy: '#ffdd88',
    physical: '#888888',
  };
  return colors[element?.toLowerCase()] || '#666666';
}

/**
 * Render single hazard indicator
 * @param {Object} hazard - Hazard instance
 * @returns {string} HTML string
 */
export function renderHazardIndicator(hazard) {
  if (!hazard || !hazard.isActive) return '';

  const info = getHazardInfo(hazard.type);
  const color = getElementColor(info.element);
  const helpfulClass = hazard.isHelpful ? 'helpful' : 'harmful';

  return `
    <div class="hazard-indicator ${helpfulClass}" style="--hazard-color: ${color}">
      <span class="hazard-icon">${info.icon}</span>
      <div class="hazard-details">
        <span class="hazard-name">${escapeHtml(info.name)}</span>
        <span class="hazard-turns">${hazard.turnsRemaining} turns</span>
      </div>
      ${hazard.damagePerTurn > 0 ? `<span class="hazard-damage">-${hazard.damagePerTurn}</span>` : ''}
      ${hazard.healPerTurn > 0 ? `<span class="hazard-heal">+${hazard.healPerTurn}</span>` : ''}
    </div>
  `.trim();
}

/**
 * Render hazard tooltip with full details
 * @param {Object} hazard - Hazard instance
 * @returns {string} HTML string
 */
export function renderHazardTooltip(hazard) {
  if (!hazard) return '';

  const info = getHazardInfo(hazard.type);
  const color = getElementColor(info.element);

  const effectHtml = info.effect
    ? `<div class="tooltip-effect">
        <span class="effect-type">${escapeHtml(info.effect.type)}</span>
        <span class="effect-chance">${Math.round(info.effect.chance * 100)}% chance</span>
       </div>`
    : '';

  const counterHtml = info.counterElement
    ? `<div class="tooltip-counter">Counter: ${escapeHtml(info.counterElement)}</div>`
    : '';

  return `
    <div class="hazard-tooltip" style="--hazard-color: ${color}">
      <div class="tooltip-header">
        <span class="tooltip-icon">${info.icon}</span>
        <span class="tooltip-name">${escapeHtml(info.name)}</span>
        <span class="tooltip-element">${escapeHtml(info.element || 'physical')}</span>
      </div>
      <div class="tooltip-description">${escapeHtml(info.description)}</div>
      <div class="tooltip-stats">
        ${info.damagePerTurn > 0 ? `<span class="stat damage">${info.damagePerTurn} dmg/turn</span>` : ''}
        ${info.healPerTurn > 0 ? `<span class="stat heal">${info.healPerTurn} heal/turn</span>` : ''}
      </div>
      ${effectHtml}
      ${counterHtml}
      ${hazard.turnsRemaining !== undefined ? `<div class="tooltip-duration">${hazard.turnsRemaining} turns remaining</div>` : ''}
    </div>
  `.trim();
}

/**
 * Render arena hazards display
 * @param {Object} arena - Arena state
 * @returns {string} HTML string
 */
export function renderArenaHazards(arena) {
  if (!arena || !arena.hazards || arena.hazards.length === 0) {
    return `
      <div class="arena-hazards empty">
        <span class="no-hazards">No active hazards</span>
      </div>
    `.trim();
  }

  const hazardsHtml = arena.hazards
    .filter(h => h.isActive)
    .map((hazard, index) => `
      <div class="arena-hazard-item" data-index="${index}">
        ${renderHazardIndicator(hazard)}
      </div>
    `)
    .join('');

  return `
    <div class="arena-hazards">
      <div class="hazards-header">
        <span class="hazards-title">Environmental Hazards</span>
        <span class="hazards-count">${arena.hazards.filter(h => h.isActive).length}</span>
      </div>
      <div class="hazards-list">
        ${hazardsHtml}
      </div>
    </div>
  `.trim();
}

/**
 * Render hazard effect notification
 * @param {Object} result - Effect result from applyHazardEffect
 * @param {string} hazardName - Name of the hazard
 * @returns {string} HTML string
 */
export function renderHazardEffectNotification(result, hazardName) {
  if (!result || (result.damage === 0 && result.healing === 0 && !result.effect)) {
    return '';
  }

  const parts = [];

  if (result.damage > 0) {
    parts.push(`<span class="effect-damage">-${result.damage} HP</span>`);
  }
  if (result.healing > 0) {
    parts.push(`<span class="effect-heal">+${result.healing} HP</span>`);
  }
  if (result.effect) {
    parts.push(`<span class="effect-status">${escapeHtml(result.effect.type)}!</span>`);
  }

  return `
    <div class="hazard-effect-notification">
      <span class="effect-source">${escapeHtml(hazardName)}:</span>
      ${parts.join(' ')}
    </div>
  `.trim();
}

/**
 * Render element interaction result
 * @param {Object} interaction - Interaction result
 * @returns {string} HTML string
 */
export function renderInteractionResult(interaction) {
  if (!interaction || !interaction.message) return '';

  const typeClass = interaction.type || 'none';

  return `
    <div class="interaction-result ${typeClass}">
      <span class="interaction-icon">\u2728</span>
      <span class="interaction-message">${escapeHtml(interaction.message)}</span>
    </div>
  `.trim();
}

/**
 * Render hazard catalog (for reference/bestiary)
 * @returns {string} HTML string
 */
export function renderHazardCatalog() {
  const types = getAllHazardTypes();

  const itemsHtml = types.map(type => {
    const info = getHazardInfo(type);
    const color = getElementColor(info.element);

    return `
      <div class="catalog-item" style="--hazard-color: ${color}">
        <div class="catalog-header">
          <span class="catalog-icon">${info.icon}</span>
          <span class="catalog-name">${escapeHtml(info.name)}</span>
        </div>
        <div class="catalog-element">${escapeHtml(info.element || 'physical')}</div>
        <div class="catalog-description">${escapeHtml(info.description)}</div>
        <div class="catalog-stats">
          ${info.damagePerTurn > 0 ? `<span>DMG: ${info.damagePerTurn}</span>` : ''}
          ${info.healPerTurn > 0 ? `<span>HEAL: ${info.healPerTurn}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="hazard-catalog">
      <h3 class="catalog-title">Environmental Hazards</h3>
      <div class="catalog-grid">
        ${itemsHtml}
      </div>
    </div>
  `.trim();
}

/**
 * Render compact hazard bar for combat HUD
 * @param {Array} hazards - Array of active hazards
 * @returns {string} HTML string
 */
export function renderCompactHazardBar(hazards) {
  if (!Array.isArray(hazards) || hazards.length === 0) {
    return '';
  }

  const activeHazards = hazards.filter(h => h && h.isActive);
  if (activeHazards.length === 0) return '';

  const iconsHtml = activeHazards.map(hazard => {
    const info = getHazardInfo(hazard.type);
    const color = getElementColor(info.element);
    return `<span class="compact-hazard-icon" style="color: ${color}" title="${escapeHtml(info.name)}">${info.icon}</span>`;
  }).join('');

  return `
    <div class="compact-hazard-bar">
      <span class="compact-label">ENV:</span>
      ${iconsHtml}
    </div>
  `.trim();
}

/**
 * Render synergy indicator for elemental attacks
 * @param {string} attackElement - Element of the attack
 * @param {Object} hazard - Target hazard
 * @param {number} bonus - Synergy bonus
 * @returns {string} HTML string
 */
export function renderSynergyIndicator(attackElement, hazard, bonus) {
  if (!hazard || bonus <= 0) return '';

  const info = getHazardInfo(hazard.type);
  const bonusPercent = Math.round(bonus * 100);

  return `
    <div class="synergy-indicator">
      <span class="synergy-icon">\u2B50</span>
      <span class="synergy-text">
        ${escapeHtml(attackElement)} + ${info.icon} Synergy!
      </span>
      <span class="synergy-bonus">+${bonusPercent}%</span>
    </div>
  `.trim();
}

/**
 * Get CSS styles for environmental hazards UI
 * @returns {string} CSS string
 */
export function getEnvironmentalHazardsStyles() {
  return `
    .hazard-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%);
      border-left: 3px solid var(--hazard-color);
      border-radius: 4px;
    }

    .hazard-indicator.harmful {
      border-color: var(--hazard-color);
    }

    .hazard-indicator.helpful {
      border-color: #4f4;
      background: linear-gradient(135deg, rgba(0,64,0,0.4) 0%, rgba(0,0,0,0.4) 100%);
    }

    .hazard-icon {
      font-size: 1.4em;
    }

    .hazard-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .hazard-name {
      font-weight: bold;
      font-size: 0.9em;
    }

    .hazard-turns {
      font-size: 0.75em;
      color: #888;
    }

    .hazard-damage {
      color: #f44;
      font-weight: bold;
    }

    .hazard-heal {
      color: #4f4;
      font-weight: bold;
    }

    .hazard-tooltip {
      background: #222;
      border: 1px solid var(--hazard-color);
      border-radius: 8px;
      padding: 12px;
      max-width: 280px;
    }

    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .tooltip-icon {
      font-size: 1.5em;
    }

    .tooltip-name {
      font-weight: bold;
      flex: 1;
    }

    .tooltip-element {
      padding: 2px 8px;
      background: var(--hazard-color);
      border-radius: 4px;
      font-size: 0.75em;
      text-transform: uppercase;
    }

    .tooltip-description {
      color: #aaa;
      font-size: 0.9em;
      margin-bottom: 8px;
    }

    .tooltip-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 6px;
    }

    .tooltip-stats .damage { color: #f44; }
    .tooltip-stats .heal { color: #4f4; }

    .tooltip-effect {
      display: flex;
      gap: 8px;
      font-size: 0.85em;
      color: #fa4;
    }

    .tooltip-counter {
      margin-top: 8px;
      font-size: 0.85em;
      color: #4af;
    }

    .tooltip-duration {
      margin-top: 8px;
      font-size: 0.8em;
      color: #888;
    }

    .arena-hazards {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 8px;
      padding: 12px;
    }

    .arena-hazards.empty {
      text-align: center;
      color: #666;
      padding: 20px;
    }

    .hazards-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #333;
    }

    .hazards-title {
      font-weight: bold;
    }

    .hazards-count {
      background: #333;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.85em;
    }

    .hazards-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hazard-effect-notification {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(0,0,0,0.5);
      border-radius: 4px;
      animation: fade-in-up 0.3s ease;
    }

    .effect-source {
      color: #888;
    }

    .effect-damage { color: #f44; font-weight: bold; }
    .effect-heal { color: #4f4; font-weight: bold; }
    .effect-status { color: #fa4; }

    .interaction-result {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      animation: interaction-pop 0.4s ease;
    }

    .interaction-result.neutralize {
      background: linear-gradient(135deg, #234 0%, #345 100%);
      border: 1px solid #4af;
    }

    .interaction-result.intensify {
      background: linear-gradient(135deg, #432 0%, #543 100%);
      border: 1px solid #f84;
    }

    .interaction-result.transform {
      background: linear-gradient(135deg, #324 0%, #435 100%);
      border: 1px solid #a4f;
    }

    .interaction-icon {
      font-size: 1.2em;
    }

    .hazard-catalog {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
    }

    .catalog-title {
      margin: 0 0 16px;
      color: #fff;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .catalog-item {
      background: rgba(0,0,0,0.3);
      border-left: 3px solid var(--hazard-color);
      border-radius: 4px;
      padding: 10px;
    }

    .catalog-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .catalog-icon { font-size: 1.2em; }
    .catalog-name { font-weight: bold; }

    .catalog-element {
      font-size: 0.75em;
      color: var(--hazard-color);
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .catalog-description {
      font-size: 0.85em;
      color: #aaa;
      margin-bottom: 6px;
    }

    .catalog-stats {
      display: flex;
      gap: 12px;
      font-size: 0.8em;
      color: #888;
    }

    .compact-hazard-bar {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(0,0,0,0.4);
      border-radius: 4px;
      font-size: 0.9em;
    }

    .compact-label {
      color: #888;
      font-size: 0.8em;
    }

    .compact-hazard-icon {
      font-size: 1.1em;
      cursor: help;
    }

    .synergy-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: linear-gradient(135deg, #432 0%, #543 100%);
      border: 1px solid #fa4;
      border-radius: 4px;
      animation: synergy-glow 1s infinite;
    }

    .synergy-icon {
      color: #fc0;
    }

    .synergy-bonus {
      color: #4f4;
      font-weight: bold;
    }

    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes interaction-pop {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes synergy-glow {
      0%, 100% { box-shadow: 0 0 5px rgba(255, 170, 68, 0.4); }
      50% { box-shadow: 0 0 15px rgba(255, 170, 68, 0.7); }
    }
  `.trim();
}
