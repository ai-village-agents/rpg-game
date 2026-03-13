/**
 * Threat/Aggro System UI
 * Renders threat meters, aggro indicators, and stance displays
 */

import {
  THREAT_MODIFIERS,
  THREAT_REDUCTION,
  TANK_STANCES,
  AGGRO_STATE,
  getThreatState,
  getThreatTable,
  getTargetThreat,
  getThreatTarget,
  getAggroState,
  getThreatStats,
  getEnemiesTargeting,
  hasAggro
} from './threat-aggro-system.js';

// HTML escape utility
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render threat meter for a specific enemy
 */
export function renderThreatMeter(state, enemyId, options = {}) {
  const { playersData = {}, maxDisplay = 5, showValues = true } = options;

  const threatTable = getThreatTable(state, enemyId);
  const currentTarget = getThreatTarget(state, enemyId);
  const aggroState = getAggroState(state, enemyId);

  if (threatTable.length === 0) {
    return `
      <div class="threat-meter empty">
        <span class="no-threat">No threat</span>
      </div>
    `;
  }

  const maxThreat = threatTable[0]?.threat || 1;

  return `
    <div class="threat-meter" data-enemy-id="${enemyId}">
      <div class="meter-header">
        <span class="title">Threat</span>
        <span class="aggro-state" style="color: ${aggroState.color}">
          ${escapeHtml(aggroState.name)}
        </span>
      </div>
      <div class="threat-bars">
        ${threatTable.slice(0, maxDisplay).map((entry, index) => {
          const player = playersData[entry.targetId];
          const name = player?.name || entry.targetId;
          const percent = (entry.threat / maxThreat) * 100;
          const isTarget = currentTarget.targetId === entry.targetId;
          const barColor = getBarColor(index, isTarget);

          return `
            <div class="threat-bar-row ${isTarget ? 'current-target' : ''}"
                 data-target-id="${entry.targetId}">
              <span class="rank">${index + 1}</span>
              <span class="name">${escapeHtml(name)}</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${percent}%; background: ${barColor}"></div>
              </div>
              ${showValues ? `<span class="value">${formatThreat(entry.threat)}</span>` : ''}
              ${isTarget ? '<span class="target-marker">\u25B6</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Get bar color based on rank
 */
function getBarColor(rank, isTarget) {
  if (isTarget) return '#FF4444';
  const colors = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7'];
  return colors[rank] || '#888888';
}

/**
 * Format threat value for display
 */
function formatThreat(value) {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Render compact threat indicator for a player
 */
export function renderThreatIndicator(state, playerId, enemyId) {
  const threat = getTargetThreat(state, playerId, enemyId);
  const hasAggroFlag = hasAggro(state, playerId, enemyId);
  const threatTable = getThreatTable(state, enemyId);
  const rank = threatTable.findIndex(t => t.targetId === playerId) + 1;

  if (threat === 0) {
    return '<span class="threat-indicator no-threat">-</span>';
  }

  return `
    <span class="threat-indicator ${hasAggroFlag ? 'has-aggro' : ''}"
          title="Rank ${rank}: ${formatThreat(threat)} threat">
      ${hasAggroFlag ? '\ud83d\udfe2' : '\u26a0'}
      ${formatThreat(threat)}
    </span>
  `;
}

/**
 * Render aggro warning for player
 */
export function renderAggroWarning(state, playerId, enemiesData = {}) {
  const enemies = getEnemiesTargeting(state, playerId);

  if (enemies.length === 0) {
    return '';
  }

  return `
    <div class="aggro-warning">
      <span class="warning-icon">\u26a0</span>
      <span class="warning-text">
        ${enemies.length === 1 ? 'Enemy targeting you!' : `${enemies.length} enemies targeting you!`}
      </span>
      <div class="targeting-enemies">
        ${enemies.map(enemyId => {
          const enemy = enemiesData[enemyId];
          return `<span class="enemy-name">${escapeHtml(enemy?.name || enemyId)}</span>`;
        }).join(', ')}
      </div>
    </div>
  `;
}

/**
 * Render stance selector
 */
export function renderStanceSelector(state, playerId) {
  const threatState = getThreatState(state);
  const currentStance = threatState.playerStances[playerId] || 'normal';

  return `
    <div class="stance-selector">
      <h4>Combat Stance</h4>
      <div class="stance-buttons">
        ${Object.values(TANK_STANCES).map(stance => `
          <button class="stance-btn ${currentStance === stance.id ? 'active' : ''}"
                  data-stance="${stance.id}"
                  title="Threat: ${Math.round(stance.threatMod * 100)}%, Damage: ${Math.round(stance.damageMod * 100)}%">
            <span class="stance-name">${escapeHtml(stance.name)}</span>
            <span class="stance-mods">
              <span class="threat-mod">${stance.threatMod > 1 ? '+' : ''}${Math.round((stance.threatMod - 1) * 100)}% Threat</span>
            </span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render enemy aggro indicator on nameplate
 */
export function renderNameplateAggro(state, enemyId) {
  const aggroState = getAggroState(state, enemyId);
  const { targetId, reason } = getThreatTarget(state, enemyId);

  return `
    <div class="nameplate-aggro" style="border-color: ${aggroState.color}">
      <span class="aggro-dot" style="background: ${aggroState.color}"></span>
      ${reason === 'fixate' ? '<span class="fixate-icon" title="Fixated">\ud83d\udd12</span>' : ''}
    </div>
  `;
}

/**
 * Render threat table panel (detailed view)
 */
export function renderThreatTablePanel(state, enemyId, options = {}) {
  const { playersData = {}, enemyData = null } = options;

  const threatTable = getThreatTable(state, enemyId);
  const aggroState = getAggroState(state, enemyId);
  const { targetId: currentTarget, reason } = getThreatTarget(state, enemyId);

  return `
    <div class="threat-table-panel">
      <div class="panel-header">
        <h3>${escapeHtml(enemyData?.name || 'Enemy')} - Threat Table</h3>
        <div class="aggro-info">
          <span class="state" style="color: ${aggroState.color}">${escapeHtml(aggroState.name)}</span>
          ${reason === 'fixate' ? '<span class="fixate-badge">FIXATED</span>' : ''}
        </div>
      </div>

      <div class="current-target">
        <span class="label">Target:</span>
        <span class="target-name">
          ${currentTarget ? escapeHtml(playersData[currentTarget]?.name || currentTarget) : 'None'}
        </span>
      </div>

      <div class="threat-list">
        ${threatTable.length === 0 ? '<div class="no-threat">No threats on table</div>' : ''}
        ${threatTable.map((entry, index) => {
          const player = playersData[entry.targetId];
          const isTarget = entry.targetId === currentTarget;
          const threatPercent = threatTable[0]?.threat > 0
            ? Math.round((entry.threat / threatTable[0].threat) * 100)
            : 0;

          return `
            <div class="threat-entry ${isTarget ? 'is-target' : ''}"
                 data-target-id="${entry.targetId}">
              <span class="rank">#${index + 1}</span>
              <span class="name">${escapeHtml(player?.name || entry.targetId)}</span>
              <div class="threat-bar">
                <div class="fill" style="width: ${threatPercent}%"></div>
              </div>
              <span class="value">${formatThreat(entry.threat)}</span>
              <span class="percent">(${threatPercent}%)</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render threat statistics panel
 */
export function renderThreatStatsPanel(state, options = {}) {
  const { playersData = {} } = options;
  const stats = getThreatStats(state);

  return `
    <div class="threat-stats-panel">
      <div class="panel-header">
        <h3>Threat Overview</h3>
      </div>

      <div class="stats-grid">
        <div class="stat">
          <span class="label">Tracked Enemies</span>
          <span class="value">${stats.enemyCount}</span>
        </div>
        <div class="stat">
          <span class="label">Active Combat</span>
          <span class="value">${stats.activeEnemies}</span>
        </div>
      </div>

      <div class="top-threats">
        <h4>Top Threat Generators</h4>
        ${stats.topThreats.length === 0 ? '<div class="no-data">No threat data</div>' : ''}
        ${stats.topThreats.map((entry, index) => {
          const player = playersData[entry.targetId];
          return `
            <div class="top-threat-row">
              <span class="rank">#${index + 1}</span>
              <span class="name">${escapeHtml(player?.name || entry.targetId)}</span>
              <span class="total-threat">${formatThreat(entry.threat)} total</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render threat history log
 */
export function renderThreatHistory(state, options = {}) {
  const { limit = 10, playersData = {}, enemiesData = {} } = options;
  const threatState = getThreatState(state);
  const history = threatState.threatHistory.slice(-limit).reverse();

  if (history.length === 0) {
    return '<div class="threat-history empty">No recent threat activity</div>';
  }

  return `
    <div class="threat-history">
      <h4>Recent Threat</h4>
      <div class="history-entries">
        ${history.map(entry => {
          const player = playersData[entry.targetId];
          const enemy = enemiesData[entry.enemyId];
          const time = new Date(entry.timestamp).toLocaleTimeString();
          return `
            <div class="history-entry">
              <span class="time">${time}</span>
              <span class="player">${escapeHtml(player?.name || entry.targetId)}</span>
              <span class="threat">+${formatThreat(entry.finalThreat)}</span>
              <span class="target">vs ${escapeHtml(enemy?.name || entry.enemyId)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render taunt button/ability
 */
export function renderTauntButton(cooldownRemaining = 0) {
  const onCooldown = cooldownRemaining > 0;

  return `
    <button class="taunt-btn ${onCooldown ? 'on-cooldown' : ''}"
            ${onCooldown ? 'disabled' : ''}>
      <span class="icon">\ud83d\udee1</span>
      <span class="label">Taunt</span>
      ${onCooldown ? `<span class="cooldown">${Math.ceil(cooldownRemaining / 1000)}s</span>` : ''}
    </button>
  `;
}

/**
 * Render threat reduction abilities
 */
export function renderThreatReductionAbilities(abilities = []) {
  return `
    <div class="threat-reduction-abilities">
      ${abilities.map(ability => `
        <button class="ability-btn ${ability.onCooldown ? 'on-cooldown' : ''}"
                data-ability="${ability.id}"
                ${ability.onCooldown ? 'disabled' : ''}>
          <span class="icon">${ability.icon || '\u2728'}</span>
          <span class="label">${escapeHtml(ability.name)}</span>
          <span class="effect">-${Math.round(ability.reduction * 100)}% threat</span>
          ${ability.onCooldown ? `<span class="cooldown">${ability.cooldownRemaining}s</span>` : ''}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render HUD threat display (minimal)
 */
export function renderHudThreatDisplay(state, playerId, primaryEnemyId = null) {
  if (!primaryEnemyId) {
    return '';
  }

  const threat = getTargetThreat(state, playerId, primaryEnemyId);
  const hasAggroFlag = hasAggro(state, playerId, primaryEnemyId);
  const threatTable = getThreatTable(state, primaryEnemyId);
  const rank = threatTable.findIndex(t => t.targetId === playerId) + 1;
  const topThreat = threatTable[0]?.threat || 1;
  const percent = Math.round((threat / topThreat) * 100);

  return `
    <div class="hud-threat-display ${hasAggroFlag ? 'has-aggro' : ''}">
      <div class="threat-info">
        <span class="rank">#${rank || '-'}</span>
        <span class="value">${formatThreat(threat)}</span>
      </div>
      <div class="mini-bar">
        <div class="fill" style="width: ${percent}%"></div>
      </div>
      ${hasAggroFlag ? '<span class="aggro-alert">\ud83d\udfe2 AGGRO</span>' : ''}
    </div>
  `;
}

/**
 * Get CSS styles for threat system
 */
export function getThreatStyles() {
  return `
    .threat-meter {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 12px;
      color: #fff;
    }

    .threat-meter.empty {
      text-align: center;
      color: #666;
    }

    .meter-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .threat-bars {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .threat-bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.2);
    }

    .threat-bar-row.current-target {
      background: rgba(255, 68, 68, 0.2);
      border: 1px solid #FF4444;
    }

    .threat-bar-row .rank {
      width: 20px;
      text-align: center;
      font-weight: bold;
    }

    .threat-bar-row .name {
      width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .threat-bar-row .bar-container {
      flex: 1;
      height: 12px;
      background: #333;
      border-radius: 2px;
      overflow: hidden;
    }

    .threat-bar-row .bar-fill {
      height: 100%;
      transition: width 0.3s;
    }

    .threat-bar-row .value {
      width: 50px;
      text-align: right;
      font-family: monospace;
    }

    .target-marker {
      color: #FF4444;
      font-size: 12px;
    }

    .threat-indicator {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      background: rgba(255, 170, 0, 0.2);
    }

    .threat-indicator.has-aggro {
      background: rgba(255, 68, 68, 0.3);
      border: 1px solid #FF4444;
    }

    .threat-indicator.no-threat {
      color: #666;
    }

    .aggro-warning {
      background: linear-gradient(135deg, #3a1a1a, #4a2a2a);
      border: 2px solid #FF4444;
      border-radius: 8px;
      padding: 12px;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .aggro-warning .warning-icon {
      font-size: 20px;
      margin-right: 8px;
    }

    .stance-selector {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 12px;
    }

    .stance-buttons {
      display: flex;
      gap: 8px;
    }

    .stance-btn {
      flex: 1;
      padding: 8px;
      border: 2px solid #444;
      border-radius: 4px;
      background: transparent;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .stance-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .stance-btn.active {
      border-color: #4CAF50;
      background: rgba(76, 175, 80, 0.2);
    }

    .stance-mods {
      display: block;
      font-size: 10px;
      color: #888;
      margin-top: 4px;
    }

    .nameplate-aggro {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      border: 2px solid;
    }

    .aggro-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .fixate-icon, .fixate-badge {
      color: #FF4444;
      font-weight: bold;
    }

    .threat-table-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #fff;
    }

    .threat-entry {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .threat-entry.is-target {
      background: rgba(255, 68, 68, 0.2);
    }

    .threat-entry .threat-bar {
      flex: 1;
      height: 8px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
    }

    .threat-entry .fill {
      height: 100%;
      background: #FF6B6B;
    }

    .hud-threat-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
    }

    .hud-threat-display.has-aggro {
      border: 1px solid #FF4444;
    }

    .hud-threat-display .mini-bar {
      width: 60px;
      height: 6px;
      background: #333;
      border-radius: 3px;
      overflow: hidden;
    }

    .hud-threat-display .fill {
      height: 100%;
      background: #FF6B6B;
    }

    .aggro-alert {
      color: #FF4444;
      font-weight: bold;
      font-size: 12px;
    }

    .taunt-btn {
      padding: 8px 16px;
      background: #FFD700;
      color: #000;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .taunt-btn.on-cooldown {
      background: #666;
      color: #999;
      cursor: not-allowed;
    }
  `;
}
