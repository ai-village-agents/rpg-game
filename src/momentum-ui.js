/**
 * Momentum/Overdrive UI Components
 * Renders momentum gauge and overdrive status
 */

import {
  getMomentumPercent,
  getMomentumLevel,
  canUseOverdrive,
  getOverdriveAbility,
  getActionVariety,
} from './momentum.js';

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
 * Get level-based CSS class for momentum gauge
 * @param {string} level - Momentum level
 * @returns {string} CSS class
 */
function getLevelClass(level) {
  switch (level) {
    case 'full': return 'momentum-full';
    case 'high': return 'momentum-high';
    case 'medium': return 'momentum-medium';
    case 'low': return 'momentum-low';
    default: return 'momentum-empty';
  }
}

/**
 * Render the main momentum gauge
 * @param {Object} momentumState - Current momentum state
 * @param {string} characterClass - Character's class for overdrive display
 * @returns {string} HTML string
 */
export function renderMomentumGauge(momentumState, characterClass = 'default') {
  if (!momentumState) {
    return '';
  }

  const percent = getMomentumPercent(momentumState);
  const level = getMomentumLevel(momentumState);
  const isReady = canUseOverdrive(momentumState);
  const overdrive = getOverdriveAbility(characterClass);

  const readyClass = isReady ? 'overdrive-ready' : '';
  const levelClass = getLevelClass(level);

  return `
    <div class="momentum-gauge ${levelClass} ${readyClass}">
      <div class="momentum-header">
        <span class="momentum-label">Momentum</span>
        <span class="momentum-value">${percent}%</span>
      </div>
      <div class="momentum-bar-container">
        <div class="momentum-bar" style="width: ${percent}%"></div>
        ${renderBarSegments()}
      </div>
      ${isReady ? renderOverdriveReady(overdrive) : ''}
    </div>
  `.trim();
}

/**
 * Render bar segments (quarter marks)
 * @returns {string} HTML string
 */
function renderBarSegments() {
  return `
    <div class="momentum-segments">
      <span class="segment" style="left: 25%"></span>
      <span class="segment" style="left: 50%"></span>
      <span class="segment" style="left: 75%"></span>
    </div>
  `.trim();
}

/**
 * Render overdrive ready indicator
 * @param {Object} overdrive - Overdrive ability data
 * @returns {string} HTML string
 */
function renderOverdriveReady(overdrive) {
  return `
    <div class="overdrive-indicator">
      <span class="overdrive-icon">\u26A1</span>
      <span class="overdrive-text">${escapeHtml(overdrive.name)} Ready!</span>
    </div>
  `.trim();
}

/**
 * Render compact momentum indicator for HUD
 * @param {Object} momentumState - Current momentum state
 * @returns {string} HTML string
 */
export function renderMomentumIndicator(momentumState) {
  if (!momentumState) {
    return '';
  }

  const percent = getMomentumPercent(momentumState);
  const isReady = canUseOverdrive(momentumState);
  const level = getMomentumLevel(momentumState);

  const icon = isReady ? '\u26A1' : '\u2B50';
  const readyClass = isReady ? 'ready' : '';

  return `
    <div class="momentum-indicator ${getLevelClass(level)} ${readyClass}">
      <span class="icon">${icon}</span>
      <span class="value">${percent}%</span>
    </div>
  `.trim();
}

/**
 * Render overdrive button for combat actions
 * @param {Object} momentumState - Current momentum state
 * @param {string} characterClass - Character's class
 * @returns {string} HTML string
 */
export function renderOverdriveButton(momentumState, characterClass = 'default') {
  if (!momentumState || !canUseOverdrive(momentumState)) {
    return renderDisabledOverdriveButton(momentumState, characterClass);
  }

  const overdrive = getOverdriveAbility(characterClass);

  return `
    <button class="overdrive-button ready" data-action="overdrive">
      <span class="button-icon">\u26A1</span>
      <span class="button-text">${escapeHtml(overdrive.name)}</span>
    </button>
  `.trim();
}

/**
 * Render disabled overdrive button
 * @param {Object} momentumState - Current momentum state
 * @param {string} characterClass - Character's class
 * @returns {string} HTML string
 */
function renderDisabledOverdriveButton(momentumState, characterClass) {
  const overdrive = getOverdriveAbility(characterClass);
  const percent = getMomentumPercent(momentumState || { current: 0, max: 100 });

  return `
    <button class="overdrive-button disabled" data-action="overdrive" disabled>
      <span class="button-icon">\u26A1</span>
      <span class="button-text">${escapeHtml(overdrive.name)} (${percent}%)</span>
    </button>
  `.trim();
}

/**
 * Render overdrive ability tooltip
 * @param {string} characterClass - Character's class
 * @returns {string} HTML string
 */
export function renderOverdriveTooltip(characterClass = 'default') {
  const overdrive = getOverdriveAbility(characterClass);

  return `
    <div class="overdrive-tooltip">
      <div class="tooltip-header">
        <span class="ability-name">${escapeHtml(overdrive.name)}</span>
        <span class="ability-type">${escapeHtml(overdrive.type)}</span>
      </div>
      <div class="tooltip-description">${escapeHtml(overdrive.description)}</div>
      ${overdrive.hits ? `<div class="tooltip-stats">Hits: ${overdrive.hits}</div>` : ''}
      ${overdrive.powerPerHit ? `<div class="tooltip-stats">Power: ${overdrive.powerPerHit}</div>` : ''}
      ${overdrive.healPercent ? `<div class="tooltip-stats">Heals: ${Math.round(overdrive.healPercent * 100)}% HP</div>` : ''}
    </div>
  `.trim();
}

/**
 * Render momentum gain notification
 * @param {number} amount - Amount gained
 * @param {string} source - Source of momentum gain
 * @returns {string} HTML string
 */
export function renderMomentumGainNotification(amount, source = '') {
  if (amount <= 0) {
    return '';
  }

  return `
    <div class="momentum-notification gain">
      <span class="icon">\u2B50</span>
      <span class="amount">+${amount} Momentum</span>
      ${source ? `<span class="source">(${escapeHtml(source)})</span>` : ''}
    </div>
  `.trim();
}

/**
 * Render variety bonus indicator
 * @param {Object} momentumState - Current momentum state
 * @returns {string} HTML string
 */
export function renderVarietyBonus(momentumState) {
  const variety = getActionVariety(momentumState);
  const stars = Math.round(variety * 4);

  if (variety === 0) {
    return '';
  }

  const starIcons = '\u2605'.repeat(stars) + '\u2606'.repeat(4 - stars);

  return `
    <div class="variety-bonus">
      <span class="label">Variety:</span>
      <span class="stars">${starIcons}</span>
    </div>
  `.trim();
}

/**
 * Render momentum for combat log integration
 * @param {number} amount - Momentum gained
 * @param {string} source - Source of momentum
 * @returns {Object} Log entry
 */
export function renderMomentumLogEntry(amount, source) {
  return {
    type: 'momentum',
    message: `Gained ${amount} momentum${source ? ` from ${source}` : ''}`,
    amount,
    source,
    icon: '\u2B50',
    timestamp: Date.now(),
  };
}

/**
 * Render overdrive activation log entry
 * @param {string} characterClass - Character's class
 * @returns {Object} Log entry
 */
export function renderOverdriveLogEntry(characterClass) {
  const overdrive = getOverdriveAbility(characterClass);

  return {
    type: 'overdrive',
    message: `Activated ${overdrive.name}!`,
    abilityName: overdrive.name,
    icon: '\u26A1',
    timestamp: Date.now(),
  };
}

/**
 * Get CSS styles for momentum UI
 * @returns {string} CSS string
 */
export function getMomentumStyles() {
  return `
    .momentum-gauge {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #333;
      border-radius: 8px;
      padding: 8px 12px;
      min-width: 180px;
    }

    .momentum-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 0.9em;
    }

    .momentum-label { color: #aaa; }
    .momentum-value { font-weight: bold; }

    .momentum-bar-container {
      position: relative;
      height: 12px;
      background: #222;
      border-radius: 6px;
      overflow: hidden;
    }

    .momentum-bar {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease;
    }

    .momentum-empty .momentum-bar { background: #444; }
    .momentum-low .momentum-bar { background: linear-gradient(90deg, #4a5568, #667); }
    .momentum-medium .momentum-bar { background: linear-gradient(90deg, #6b7, #9d4); }
    .momentum-high .momentum-bar { background: linear-gradient(90deg, #f90, #fc0); }
    .momentum-full .momentum-bar {
      background: linear-gradient(90deg, #f44, #f90);
      animation: pulse-glow 1s infinite;
    }

    .momentum-segments {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .momentum-segments .segment {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(255,255,255,0.2);
    }

    .overdrive-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 4px 8px;
      background: rgba(255, 100, 0, 0.2);
      border-radius: 4px;
      animation: pulse-bg 1s infinite;
    }

    .overdrive-icon { font-size: 1.2em; }
    .overdrive-text { font-weight: bold; color: #fc0; }

    .momentum-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      background: rgba(0,0,0,0.4);
    }

    .momentum-indicator.ready {
      background: rgba(255, 100, 0, 0.3);
      animation: pulse-border 1s infinite;
    }

    .overdrive-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 2px solid #444;
      border-radius: 6px;
      background: #222;
      color: #888;
      cursor: not-allowed;
      font-size: 1em;
    }

    .overdrive-button.ready {
      background: linear-gradient(135deg, #633 0%, #843 100%);
      border-color: #f90;
      color: #fff;
      cursor: pointer;
      animation: ready-pulse 1.5s infinite;
    }

    .overdrive-button.ready:hover {
      background: linear-gradient(135deg, #844 0%, #a54 100%);
    }

    .overdrive-tooltip {
      background: #222;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      max-width: 250px;
    }

    .tooltip-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .ability-name { font-weight: bold; color: #fc0; }
    .ability-type { color: #888; font-size: 0.9em; }
    .tooltip-description { margin-bottom: 6px; color: #ccc; }
    .tooltip-stats { font-size: 0.9em; color: #9b9; }

    .momentum-notification {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(100, 180, 100, 0.2);
      animation: fade-slide-up 2s forwards;
    }

    .variety-bonus {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85em;
      color: #9b9;
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 5px rgba(255, 100, 0, 0.5); }
      50% { box-shadow: 0 0 15px rgba(255, 100, 0, 0.8); }
    }

    @keyframes pulse-bg {
      0%, 100% { background: rgba(255, 100, 0, 0.2); }
      50% { background: rgba(255, 100, 0, 0.4); }
    }

    @keyframes pulse-border {
      0%, 100% { border-color: #f90; }
      50% { border-color: #fc0; }
    }

    @keyframes ready-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes fade-slide-up {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-20px); }
    }
  `.trim();
}
