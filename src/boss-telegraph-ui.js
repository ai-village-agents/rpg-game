/**
 * Boss Telegraph UI Components
 * Renders telegraph warnings and predictions during boss battles
 */

import {
  TELEGRAPH_TYPES,
  TELEGRAPH_SEVERITY,
  getTelegraphSummary,
} from './boss-telegraph.js';

/**
 * CSS classes for severity levels
 */
const SEVERITY_CLASSES = {
  [TELEGRAPH_SEVERITY.LOW]: 'telegraph-low',
  [TELEGRAPH_SEVERITY.MEDIUM]: 'telegraph-medium',
  [TELEGRAPH_SEVERITY.HIGH]: 'telegraph-high',
  [TELEGRAPH_SEVERITY.CRITICAL]: 'telegraph-critical',
};

/**
 * Render the main telegraph panel
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {string} HTML string
 */
export function renderTelegraphPanel(boss, player) {
  if (!boss || !boss.isBoss) {
    return '';
  }

  const summary = getTelegraphSummary(boss, player);

  return `
    <div class="telegraph-panel ${summary.severityClass}">
      <div class="telegraph-header">
        <span class="telegraph-icon">${summary.typeIcon}</span>
        <span class="telegraph-title">Boss Action Preview</span>
        <span class="telegraph-confidence">${summary.confidencePercent}%</span>
      </div>
      <div class="telegraph-body">
        <div class="telegraph-warning">${escapeHtml(summary.warningText)}</div>
        <div class="telegraph-hint">${escapeHtml(summary.tacticalHint)}</div>
      </div>
      ${renderSeverityIndicator(summary.prediction.severity)}
    </div>
  `.trim();
}

/**
 * Render a compact telegraph indicator
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {string} HTML string
 */
export function renderTelegraphIndicator(boss, player) {
  if (!boss || !boss.isBoss) {
    return '';
  }

  const summary = getTelegraphSummary(boss, player);

  return `
    <div class="telegraph-indicator ${summary.severityClass}">
      <span class="indicator-icon">${summary.typeIcon}</span>
      <span class="indicator-text">${escapeHtml(summary.warningText)}</span>
    </div>
  `.trim();
}

/**
 * Render a tooltip with detailed prediction info
 * @param {Object} prediction - Prediction object
 * @returns {string} HTML string
 */
export function renderTelegraphTooltip(prediction) {
  if (!prediction || !prediction.ability) {
    return '<div class="telegraph-tooltip">Unknown move incoming</div>';
  }

  const ability = prediction.ability;

  return `
    <div class="telegraph-tooltip">
      <div class="tooltip-ability-name">${escapeHtml(ability.name)}</div>
      <div class="tooltip-type">${escapeHtml(ability.type || 'attack')}</div>
      ${ability.power ? `<div class="tooltip-power">Power: ${ability.power}</div>` : ''}
      ${ability.element ? `<div class="tooltip-element">Element: ${escapeHtml(ability.element)}</div>` : ''}
      ${ability.effect ? `<div class="tooltip-effect">Effect: ${escapeHtml(ability.effect.type)}</div>` : ''}
      <div class="tooltip-confidence">Confidence: ${Math.round(prediction.confidence * 100)}%</div>
    </div>
  `.trim();
}

/**
 * Render severity indicator bar
 * @param {string} severity - Severity level
 * @returns {string} HTML string
 */
function renderSeverityIndicator(severity) {
  const levels = [
    TELEGRAPH_SEVERITY.LOW,
    TELEGRAPH_SEVERITY.MEDIUM,
    TELEGRAPH_SEVERITY.HIGH,
    TELEGRAPH_SEVERITY.CRITICAL,
  ];

  const currentIndex = levels.indexOf(severity);

  const indicators = levels.map((level, index) => {
    const active = index <= currentIndex ? 'active' : '';
    return `<span class="severity-bar ${SEVERITY_CLASSES[level]} ${active}"></span>`;
  }).join('');

  return `<div class="severity-indicator">${indicators}</div>`;
}

/**
 * Render telegraph for combat log integration
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {Object} Log entry object
 */
export function renderBossCombatTelegraph(boss, player) {
  if (!boss || !boss.isBoss) {
    return null;
  }

  const summary = getTelegraphSummary(boss, player);

  return {
    type: 'telegraph',
    severity: summary.prediction.severity,
    message: summary.warningText,
    hint: summary.tacticalHint,
    icon: summary.typeIcon,
    timestamp: Date.now(),
  };
}

/**
 * Get telegraph data for external use
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {Object} Telegraph data
 */
export function getBossTelegraph(boss, player) {
  if (!boss || !boss.isBoss) {
    return null;
  }

  return getTelegraphSummary(boss, player);
}

/**
 * Get a single-line summary for status bar display
 * @param {Object} boss - The boss state
 * @param {Object} player - The player state
 * @returns {string} Summary text
 */
export function getTelegraphSummaryLine(boss, player) {
  if (!boss || !boss.isBoss) {
    return '';
  }

  const summary = getTelegraphSummary(boss, player);
  return `${summary.typeIcon} ${summary.warningText}`;
}

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
 * Get CSS styles for telegraph components
 * @returns {string} CSS string
 */
export function getTelegraphStyles() {
  return `
    .telegraph-panel {
      border: 2px solid #444;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    .telegraph-low { border-color: #4a9; }
    .telegraph-medium { border-color: #eb8; }
    .telegraph-high { border-color: #e85; }
    .telegraph-critical { border-color: #e44; animation: pulse 0.5s infinite; }

    .telegraph-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .telegraph-icon { font-size: 1.5em; }
    .telegraph-title { flex-grow: 1; font-weight: bold; }
    .telegraph-confidence { opacity: 0.7; font-size: 0.9em; }

    .telegraph-warning { font-size: 1.1em; margin-bottom: 4px; }
    .telegraph-hint { font-size: 0.9em; opacity: 0.8; font-style: italic; }

    .severity-indicator { display: flex; gap: 4px; margin-top: 8px; }
    .severity-bar { width: 20px; height: 4px; background: #333; border-radius: 2px; }
    .severity-bar.active.telegraph-low { background: #4a9; }
    .severity-bar.active.telegraph-medium { background: #eb8; }
    .severity-bar.active.telegraph-high { background: #e85; }
    .severity-bar.active.telegraph-critical { background: #e44; }

    .telegraph-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.5);
      border-left: 3px solid;
    }
    .telegraph-indicator.telegraph-low { border-color: #4a9; }
    .telegraph-indicator.telegraph-medium { border-color: #eb8; }
    .telegraph-indicator.telegraph-high { border-color: #e85; }
    .telegraph-indicator.telegraph-critical { border-color: #e44; }

    .telegraph-tooltip {
      background: #222;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 8px;
      font-size: 0.9em;
    }
    .tooltip-ability-name { font-weight: bold; margin-bottom: 4px; }
    .tooltip-type { color: #888; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `.trim();
}
