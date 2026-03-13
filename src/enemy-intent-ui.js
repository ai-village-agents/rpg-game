/**
 * Enemy Intent UI — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Renders enemy intent indicators during combat, showing players
 * what the enemy is likely to do next. Inspired by Slay the Spire.
 */

import {
  INTENT_TYPES,
  CONFIDENCE,
  INTENT_ICONS,
  predictIntent,
  forecastIntents,
} from './enemy-intent.js';
import { URGENCY_LEVELS } from './boss-telegraph.js';

// ── Style injection ──────────────────────────────────────────────────

const STYLE_ID = 'enemy-intent-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .enemy-intent-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
      animation: intent-fade-in 0.3s ease-out;
    }

    @keyframes intent-fade-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .enemy-intent-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      border: 2px solid;
      min-width: 120px;
      justify-content: center;
      position: relative;
      cursor: help;
    }

    .enemy-intent-badge[data-urgency="low"] {
      background: rgba(76, 175, 80, 0.15);
      border-color: #4caf50;
      color: #4caf50;
    }

    .enemy-intent-badge[data-urgency="medium"] {
      background: rgba(255, 193, 7, 0.15);
      border-color: #ffc107;
      color: #ffc107;
    }

    .enemy-intent-badge[data-urgency="high"] {
      background: rgba(255, 87, 34, 0.15);
      border-color: #ff5722;
      color: #ff5722;
    }

    .enemy-intent-badge[data-urgency="extreme"] {
      background: rgba(244, 67, 54, 0.2);
      border-color: #f44336;
      color: #f44336;
      animation: intent-pulse 1s infinite;
    }

    @keyframes intent-pulse {
      0%, 100% { box-shadow: 0 0 4px rgba(244, 67, 54, 0.3); }
      50% { box-shadow: 0 0 12px rgba(244, 67, 54, 0.6); }
    }

    .enemy-intent-icon {
      font-size: 18px;
      line-height: 1;
    }

    .enemy-intent-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .enemy-intent-damage {
      font-size: 12px;
      opacity: 0.85;
      font-weight: 400;
    }

    .enemy-intent-confidence {
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .enemy-intent-confidence[data-confidence="certain"] {
      background: #4caf50;
      color: white;
    }

    .enemy-intent-confidence[data-confidence="likely"] {
      background: #ffc107;
      color: #333;
    }

    .enemy-intent-confidence[data-confidence="possible"] {
      background: #9e9e9e;
      color: white;
    }

    .enemy-intent-tooltip {
      display: none;
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #222;
      color: #eee;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: none;
    }

    .enemy-intent-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #222;
    }

    .enemy-intent-badge:hover .enemy-intent-tooltip {
      display: block;
    }

    .enemy-intent-forecast {
      display: flex;
      gap: 4px;
      opacity: 0.6;
      font-size: 12px;
    }

    .enemy-intent-forecast-item {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(128, 128, 128, 0.15);
      border: 1px solid rgba(128, 128, 128, 0.3);
    }

    .enemy-intent-forecast-label {
      font-size: 10px;
      opacity: 0.7;
      margin-bottom: 2px;
    }

    .enemy-intent-toggle {
      font-size: 11px;
      opacity: 0.5;
      cursor: pointer;
      border: none;
      background: none;
      color: inherit;
      text-decoration: underline;
      padding: 0;
    }

    .enemy-intent-toggle:hover {
      opacity: 0.8;
    }


    .enemy-intent-badge[data-intent="charge"] {
      position: relative;
      overflow: visible;
    }

    .enemy-intent-badge[data-intent="charge"]::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 8px;
      width: 18px;
      height: 22px;
      transform: translateY(-50%);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      background: radial-gradient(ellipse, rgba(255, 215, 0, 0.4), transparent 70%);
      animation: charge-pulse 1.5s ease-in-out infinite;
      pointer-events: none;
      z-index: 0;
    }

    @keyframes charge-pulse {
      0%, 100% { opacity: 0.3; transform: translateY(-50%) scale(0.8); }
      50% { opacity: 0.8; transform: translateY(-50%) scale(1.2); }
    }

    @media (prefers-reduced-motion: reduce) {
      .enemy-intent-container { animation: none; }
      .enemy-intent-badge[data-urgency="extreme"] { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

// ── Render Functions ─────────────────────────────────────────────────

function getUrgencyLabel(urgency) {
  switch (urgency) {
    case URGENCY_LEVELS.EXTREME: return 'DANGER';
    case URGENCY_LEVELS.HIGH: return 'Warning';
    case URGENCY_LEVELS.MEDIUM: return 'Caution';
    case URGENCY_LEVELS.LOW: return 'Safe';
    default: return '';
  }
}

function renderDamageText(damage) {
  if (!damage) return '';
  const hitsText = damage.hits && damage.hits > 1 ? ` (${damage.hits} hits)` : '';
  return `<span class="enemy-intent-damage">${damage.min}-${damage.max}${hitsText}</span>`;
}

function renderIntentBadge(intent) {
  if (!intent) return '<div class="enemy-intent-container"></div>';

  const urgencyLabel = getUrgencyLabel(intent.urgency);
  const damageHtml = renderDamageText(intent.damage);
  const confidenceLabel = intent.confidence === CONFIDENCE.CERTAIN ? ''
    : `<span class="enemy-intent-confidence" data-confidence="${intent.confidence}">${intent.confidence}</span>`;

  return `
    <div class="enemy-intent-badge" data-urgency="${intent.urgency}" data-intent="${intent.type}" title="${intent.description}">
      <span class="enemy-intent-icon">${intent.icon}</span>
      <span class="enemy-intent-label">${getIntentLabel(intent.type)}</span>
      ${damageHtml}
      ${confidenceLabel}
      <div class="enemy-intent-tooltip">${intent.description}</div>
    </div>
  `;
}

function getIntentLabel(intentType) {
  switch (intentType) {
    case INTENT_TYPES.ATTACK: return 'Attack';
    case INTENT_TYPES.HEAVY_ATTACK: return 'Heavy Attack';
    case INTENT_TYPES.ABILITY: return 'Ability';
    case INTENT_TYPES.DEFEND: return 'Defend';
    case INTENT_TYPES.BUFF: return 'Buff';
    case INTENT_TYPES.DEBUFF: return 'Debuff';
    case INTENT_TYPES.HEAL: return 'Heal';
    case INTENT_TYPES.MULTI_HIT: return 'Multi-hit';
    case INTENT_TYPES.CHARGE: return 'Charging';
    default: return 'Unknown';
  }
}

function renderForecast(forecast) {
  if (!forecast || forecast.length === 0) return '';

  const items = forecast.map((intent, i) => `
    <div class="enemy-intent-forecast-item" title="Turn +${i + 1}: ${intent.description}">
      <span>${intent.icon}</span>
      <span>${getIntentLabel(intent.type)}</span>
    </div>
  `).join('');

  return `
    <div class="enemy-intent-forecast-label">Upcoming:</div>
    <div class="enemy-intent-forecast">${items}</div>
  `;
}

/**
 * Render the full enemy intent display.
 * @param {Object} intentState - Current intent tracking state
 * @returns {string} HTML string
 */
export function renderEnemyIntent(intentState) {
  injectStyles();

  if (!intentState?.currentIntent) {
    return '';
  }

  const badgeHtml = renderIntentBadge(intentState.currentIntent);
  const forecastHtml = intentState.showForecast
    ? renderForecast(intentState.forecast)
    : '';
  const toggleLabel = intentState.showForecast ? 'Hide forecast' : 'Show forecast';

  return `
    <div class="enemy-intent-container">
      ${badgeHtml}
      <button class="enemy-intent-toggle" data-action="toggle-intent-forecast">
        ${toggleLabel}
      </button>
      ${forecastHtml}
    </div>
  `;
}

/**
 * Create a compact intent indicator for the combat HUD.
 * Shows just the icon and damage range.
 */
export function renderCompactIntent(intent) {
  injectStyles();
  if (!intent) return '';

  const dmg = intent.damage
    ? `<span class="enemy-intent-damage">${intent.damage.min}-${intent.damage.max}</span>`
    : '';

  return `
    <span class="enemy-intent-badge" data-urgency="${intent.urgency}" data-intent="${intent.type}" style="padding: 3px 8px; font-size: 12px; min-width: auto;">
      <span class="enemy-intent-icon" style="font-size: 14px;">${intent.icon}</span>
      ${dmg}
    </span>
  `;
}
