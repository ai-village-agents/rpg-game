/**
 * Summoning System UI Components
 * Renders summon selection, active summons, and actions
 */

import {
  SUMMON_TIER,
  SUMMON_BEHAVIOR,
  SUMMON_DATA,
  getSummonData,
  getSummonSummary,
  getTierDisplayName,
  canSummon,
} from './summoning-system.js';

/**
 * Get CSS styles for summoning system
 * @returns {string} CSS styles
 */
export function getSummoningStyles() {
  return `
.summon-container {
  padding: 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  margin-bottom: 10px;
}

.summon-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.summon-icon {
  font-size: 28px;
  line-height: 1;
}

.summon-info {
  flex: 1;
}

.summon-name {
  font-size: 14px;
  font-weight: bold;
  color: #e8e8e8;
}

.summon-tier {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
}

.summon-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.summon-stat {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
}

.summon-stat.hp { color: #8f8; }
.summon-stat.atk { color: #f88; }
.summon-stat.def { color: #88f; }
.summon-stat.spd { color: #ff8; }

.summon-hp-bar {
  width: 100%;
  height: 6px;
  background: #2a2a2a;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 6px;
}

.summon-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.3s ease;
}

.summon-hp-fill.low {
  background: linear-gradient(90deg, #a44 0%, #f88 100%);
}

.summon-duration {
  font-size: 10px;
  color: #aaa;
  margin-top: 4px;
}

/* Summon selection list */
.summon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summon-option {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.summon-option:hover:not(.disabled) {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}

.summon-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summon-option-icon {
  font-size: 24px;
  margin-right: 10px;
}

.summon-option-info {
  flex: 1;
}

.summon-option-name {
  font-size: 13px;
  font-weight: bold;
  color: #e8e8e8;
}

.summon-option-desc {
  font-size: 10px;
  color: #888;
}

.summon-option-cost {
  font-size: 12px;
  color: #88f;
  font-weight: bold;
}

/* Tier colors */
.tier-minor { border-left: 3px solid #888; }
.tier-standard { border-left: 3px solid #4a8; }
.tier-greater { border-left: 3px solid #84f; }
.tier-legendary { border-left: 3px solid #fa4; }

/* Element colors */
.element-fire { color: #f84; }
.element-ice { color: #8df; }
.element-lightning { color: #ff8; }
.element-nature { color: #8f8; }
.element-shadow { color: #a8f; }
.element-holy { color: #ffa; }
.element-physical { color: #ccc; }

/* Behavior indicators */
.behavior-tag {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 6px;
}

.behavior-aggressive { background: #622; color: #f88; }
.behavior-defensive { background: #226; color: #88f; }
.behavior-support { background: #262; color: #8f8; }
.behavior-balanced { background: #442; color: #ff8; }

/* Active summons panel */
.active-summons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.active-summon-card {
  flex: 1;
  min-width: 140px;
  max-width: 180px;
  padding: 8px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1a2a3a 0%, #0f1f2f 100%);
  border: 1px solid #2a4a6a;
  position: relative;
}

.active-summon-card.acted {
  opacity: 0.7;
}

.active-summon-card .dismiss-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(200,50,50,0.5);
  border: none;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  line-height: 1;
}

.active-summon-card .dismiss-btn:hover {
  background: rgba(200,50,50,0.8);
}

/* Summon action display */
.summon-action {
  font-size: 11px;
  color: #aaa;
  margin-top: 6px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
}

/* Summon catalog */
.summon-catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.summon-catalog-item {
  padding: 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
}

/* Animation for summoning */
@keyframes summon-appear {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.summon-appear {
  animation: summon-appear 0.5s ease-out;
}

@keyframes summon-dismiss {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.5); opacity: 0; }
}

.summon-dismiss {
  animation: summon-dismiss 0.3s ease-in;
}
`;
}

/**
 * Render summon selection menu
 * @param {Array} availableSummons - Array of summon IDs
 * @param {Object} state - Game state for checking costs
 * @returns {string} HTML string
 */
export function renderSummonMenu(availableSummons, state) {
  if (!availableSummons || availableSummons.length === 0) {
    return '<div class="summon-list"><p>No summons available</p></div>';
  }

  const items = availableSummons.map(summonId => {
    const data = getSummonData(summonId);
    if (!data) return '';

    const check = canSummon(state, summonId);
    const disabledClass = check.canSummon ? '' : 'disabled';
    const tierClass = `tier-${data.tier}`;

    return `
      <div class="summon-option ${tierClass} ${disabledClass}" data-summon-id="${escapeHtml(summonId)}">
        <span class="summon-option-icon">${escapeHtml(data.icon)}</span>
        <div class="summon-option-info">
          <div class="summon-option-name">
            ${escapeHtml(data.name)}
            <span class="behavior-tag behavior-${data.behavior}">${capitalize(data.behavior)}</span>
          </div>
          <div class="summon-option-desc">${escapeHtml(data.description)}</div>
          ${!check.canSummon ? `<div class="summon-option-desc" style="color:#f88">${escapeHtml(check.reason)}</div>` : ''}
        </div>
        <span class="summon-option-cost">${data.mpCost} MP</span>
      </div>
    `;
  });

  return `<div class="summon-list">${items.join('')}</div>`;
}

/**
 * Render active summon card
 * @param {Object} summon - Summon instance
 * @returns {string} HTML string
 */
export function renderActiveSummon(summon) {
  if (!summon) return '';

  const summary = getSummonSummary(summon);
  const hpPercent = Math.round((summary.hp / summary.maxHp) * 100);
  const lowHp = hpPercent < 30;
  const actedClass = summon.hasActedThisTurn ? 'acted' : '';

  return `
    <div class="active-summon-card ${actedClass}" data-instance-id="${escapeHtml(summon.instanceId)}">
      <button class="dismiss-btn" title="Dismiss">\u2715</button>
      <div class="summon-header">
        <span class="summon-icon">${escapeHtml(summary.icon)}</span>
        <div class="summon-info">
          <div class="summon-name element-${summary.element}">${escapeHtml(summary.name)}</div>
          <div class="summon-tier">${escapeHtml(getTierDisplayName(summon.tier))}</div>
        </div>
      </div>
      <div class="summon-hp-bar">
        <div class="summon-hp-fill ${lowHp ? 'low' : ''}" style="width: ${hpPercent}%"></div>
      </div>
      <div class="summon-stats">
        <span class="summon-stat hp">HP: ${summary.hp}/${summary.maxHp}</span>
        <span class="summon-stat atk">ATK: ${summon.stats.attack}</span>
      </div>
      <div class="summon-duration">${summary.turnsRemaining} turns | Loyalty: ${summary.loyalty}%</div>
    </div>
  `.trim();
}

/**
 * Render all active summons
 * @param {Array} summons - Array of active summons
 * @returns {string} HTML string
 */
export function renderActiveSummons(summons) {
  if (!summons || summons.length === 0) {
    return '<div class="active-summons"><p style="color:#888">No active summons</p></div>';
  }

  const cards = summons.map(s => renderActiveSummon(s)).join('');
  return `<div class="active-summons">${cards}</div>`;
}

/**
 * Render summon action indicator
 * @param {Object} action - Action object from getSummonAction
 * @param {Object} summon - Summon performing action
 * @returns {string} HTML string
 */
export function renderSummonAction(action, summon) {
  if (!action || !summon) return '';

  const actionTexts = {
    attack: `${summon.name} attacks!`,
    defend: `${summon.name} defends!`,
    heal: `${summon.name} heals!`,
    buff: `${summon.name} provides support!`,
    wait: `${summon.name} waits...`,
  };

  const text = actionTexts[action.action] || `${summon.name} acts`;

  return `
    <div class="summon-action">
      ${escapeHtml(summon.icon)} ${escapeHtml(text)}
    </div>
  `.trim();
}

/**
 * Render summon catalog (all summons info)
 * @returns {string} HTML string
 */
export function renderSummonCatalog() {
  const items = Object.entries(SUMMON_DATA).map(([id, data]) => {
    const tierClass = `tier-${data.tier}`;
    return `
      <div class="summon-catalog-item ${tierClass}">
        <div class="summon-header">
          <span class="summon-icon">${escapeHtml(data.icon)}</span>
          <div class="summon-info">
            <div class="summon-name element-${data.element}">${escapeHtml(data.name)}</div>
            <div class="summon-tier">${escapeHtml(getTierDisplayName(data.tier))} | ${data.mpCost} MP</div>
          </div>
        </div>
        <div class="summon-stats">
          <span class="summon-stat hp">HP: ${data.stats.hp}</span>
          <span class="summon-stat atk">ATK: ${data.stats.attack}</span>
          <span class="summon-stat def">DEF: ${data.stats.defense}</span>
          <span class="summon-stat spd">SPD: ${data.stats.speed}</span>
        </div>
        <p style="font-size:11px;color:#888;margin-top:6px">${escapeHtml(data.description)}</p>
      </div>
    `;
  });

  return `<div class="summon-catalog">${items.join('')}</div>`;
}

/**
 * Render summon expired notification
 * @param {Object} summon - Expired summon
 * @param {string} reason - Reason for expiration
 * @returns {string} HTML string
 */
export function renderSummonExpiredNotice(summon, reason = 'duration') {
  if (!summon) return '';

  const reasons = {
    duration: 'duration expired',
    loyalty: 'lost loyalty',
    defeated: 'was defeated',
    dismissed: 'was dismissed',
  };

  return `
    <div class="summon-action" style="background:rgba(100,50,50,0.3)">
      ${escapeHtml(summon.icon)} ${escapeHtml(summon.name)} ${reasons[reason] || 'faded away'}
    </div>
  `.trim();
}

/**
 * Render summon summoned notification
 * @param {Object} summon - Summoned creature
 * @returns {string} HTML string
 */
export function renderSummonedNotice(summon) {
  if (!summon) return '';

  return `
    <div class="summon-action summon-appear" style="background:rgba(50,100,50,0.3)">
      ${escapeHtml(summon.icon)} ${escapeHtml(summon.name)} has been summoned!
    </div>
  `.trim();
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
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

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (typeof str !== 'string' || str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
