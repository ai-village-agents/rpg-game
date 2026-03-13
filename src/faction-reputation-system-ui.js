/**
 * Faction Reputation System UI
 * Renders faction and reputation interface components
 */

import {
  REPUTATION_LEVEL,
  FACTION_CATEGORY,
  FACTIONS,
  getAllStandings,
  getFactionStanding,
  getReputationProgress,
  getFactionRelationships,
  calculateFactionScore,
  escapeHtml
} from './faction-reputation-system.js';

// Reputation level colors
const LEVEL_COLORS = {
  [REPUTATION_LEVEL.HATED]: '#8b0000',
  [REPUTATION_LEVEL.HOSTILE]: '#ff0000',
  [REPUTATION_LEVEL.UNFRIENDLY]: '#ff6600',
  [REPUTATION_LEVEL.NEUTRAL]: '#808080',
  [REPUTATION_LEVEL.FRIENDLY]: '#00cc00',
  [REPUTATION_LEVEL.HONORED]: '#0099ff',
  [REPUTATION_LEVEL.REVERED]: '#9900ff',
  [REPUTATION_LEVEL.EXALTED]: '#ffd700'
};

// Category icons
const CATEGORY_ICONS = {
  [FACTION_CATEGORY.KINGDOM]: '👑',
  [FACTION_CATEGORY.GUILD]: '🏛️',
  [FACTION_CATEGORY.TRIBE]: '🏕️',
  [FACTION_CATEGORY.ORDER]: '⚔️',
  [FACTION_CATEGORY.MERCHANT]: '💰',
  [FACTION_CATEGORY.CREATURE]: '🐲'
};

/**
 * Renders the faction reputation panel
 * @param {Object} state - Reputation state
 * @param {Object} options - Display options
 * @returns {string} HTML string
 */
export function renderReputationPanel(state, options = {}) {
  if (!state) {
    return '<div class="faction-panel">No faction data available</div>';
  }

  const standings = getAllStandings(state, {
    showHidden: options.showHidden,
    category: options.filterCategory
  });

  const score = calculateFactionScore(state);

  const html = `
    <div class="faction-panel">
      <div class="faction-header">
        <h2>Factions</h2>
        <div class="faction-score">
          <span title="Exalted factions">${score.factionsAtExalted} Exalted</span>
          <span title="Discovered">${score.factionsDiscovered}/${score.totalFactions}</span>
        </div>
      </div>

      ${options.showFilters ? renderCategoryFilters(options.filterCategory) : ''}

      <div class="faction-list">
        ${standings.length > 0
          ? standings.map(s => renderFactionRow(s)).join('')
          : '<div class="no-factions">No factions discovered</div>'}
      </div>
    </div>
  `;

  return html;
}

/**
 * Renders category filter buttons
 * @param {string} activeCategory - Currently active filter
 * @returns {string} HTML string
 */
function renderCategoryFilters(activeCategory) {
  const categories = [
    { id: null, label: 'All' },
    ...Object.values(FACTION_CATEGORY).map(cat => ({
      id: cat,
      label: formatCategoryName(cat),
      icon: CATEGORY_ICONS[cat]
    }))
  ];

  return `
    <div class="category-filters">
      ${categories.map(cat => `
        <button
          class="filter-btn ${activeCategory === cat.id ? 'active' : ''}"
          data-category="${cat.id || ''}"
        >
          ${cat.icon || ''} ${cat.label}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Formats category name for display
 * @param {string} category - Category ID
 * @returns {string} Formatted name
 */
function formatCategoryName(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Renders a faction row in the list
 * @param {Object} standing - Faction standing data
 * @returns {string} HTML string
 */
function renderFactionRow(standing) {
  const levelColor = LEVEL_COLORS[standing.level] || '#808080';
  const categoryIcon = CATEGORY_ICONS[standing.category] || '';
  const progressPercent = Math.round(standing.progress.progress * 100);

  return `
    <div class="faction-row" data-faction="${escapeHtml(standing.factionId)}">
      <div class="faction-info">
        <span class="faction-icon">${categoryIcon}</span>
        <span class="faction-name">${escapeHtml(standing.factionName)}</span>
      </div>
      <div class="faction-standing">
        <span class="standing-level" style="color: ${levelColor}">
          ${escapeHtml(formatLevelName(standing.level))}
        </span>
        <span class="standing-rep">${formatReputation(standing.reputation)}</span>
      </div>
      <div class="faction-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%; background: ${levelColor}"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Formats reputation level name
 * @param {string} level - Level ID
 * @returns {string} Formatted name
 */
function formatLevelName(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Formats reputation number
 * @param {number} reputation - Reputation value
 * @returns {string} Formatted string
 */
function formatReputation(reputation) {
  if (reputation >= 0) {
    return `+${reputation.toLocaleString()}`;
  }
  return reputation.toLocaleString();
}

/**
 * Renders detailed faction view
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction to display
 * @returns {string} HTML string
 */
export function renderFactionDetail(state, factionId) {
  const standing = getFactionStanding(state, factionId);
  if (!standing) {
    return '<div class="faction-detail">Faction not found</div>';
  }

  const faction = FACTIONS[factionId];
  const relationships = getFactionRelationships(factionId);
  const levelColor = LEVEL_COLORS[standing.level] || '#808080';

  const html = `
    <div class="faction-detail" data-faction="${escapeHtml(factionId)}">
      <div class="detail-header">
        <button class="back-btn" data-action="back">&larr; Back</button>
        <span class="detail-category">${CATEGORY_ICONS[faction.category] || ''} ${escapeHtml(formatCategoryName(faction.category))}</span>
      </div>

      <h2 class="detail-name">${escapeHtml(faction.name)}</h2>
      <p class="detail-desc">${escapeHtml(faction.description)}</p>

      <div class="detail-standing">
        <div class="standing-display">
          <span class="standing-level-large" style="color: ${levelColor}">
            ${escapeHtml(formatLevelName(standing.level))}
          </span>
          <span class="standing-rep-large">${formatReputation(standing.reputation)}</span>
        </div>
        ${renderDetailedProgress(standing.progress, levelColor)}
      </div>

      <div class="detail-stats">
        <div class="stat-item">
          <span class="stat-label">Total Gained</span>
          <span class="stat-value positive">+${standing.totalGained.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Lost</span>
          <span class="stat-value negative">-${standing.totalLost.toLocaleString()}</span>
        </div>
      </div>

      ${renderRelationships(relationships)}
      ${renderRewardsList(standing.availableRewards, standing.claimableRewards)}
    </div>
  `;

  return html;
}

/**
 * Renders detailed progress bar
 * @param {Object} progress - Progress data
 * @param {string} color - Level color
 * @returns {string} HTML string
 */
function renderDetailedProgress(progress, color) {
  if (progress.isMax) {
    return `
      <div class="detailed-progress">
        <div class="progress-label">Maximum reputation reached!</div>
        <div class="progress-bar large">
          <div class="progress-fill" style="width: 100%; background: ${color}"></div>
        </div>
      </div>
    `;
  }

  const percent = Math.round(progress.progress * 100);

  return `
    <div class="detailed-progress">
      <div class="progress-label">
        ${progress.current.toLocaleString()} / ${progress.total.toLocaleString()} to ${escapeHtml(formatLevelName(progress.nextLevel))}
      </div>
      <div class="progress-bar large">
        <div class="progress-fill" style="width: ${percent}%; background: ${color}"></div>
      </div>
      <div class="progress-needed">${progress.needed.toLocaleString()} more needed</div>
    </div>
  `;
}

/**
 * Renders faction relationships
 * @param {Object} relationships - Relationship data
 * @returns {string} HTML string
 */
function renderRelationships(relationships) {
  if (!relationships) return '';

  let html = '<div class="faction-relationships">';

  if (relationships.allies.length > 0) {
    html += `
      <div class="relationship-group allies">
        <h4>Allied Factions</h4>
        <ul>
          ${relationships.allies.map(a => `
            <li class="ally" data-faction="${escapeHtml(a.id)}">${escapeHtml(a.name)}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (relationships.rivals.length > 0) {
    html += `
      <div class="relationship-group rivals">
        <h4>Rival Factions</h4>
        <ul>
          ${relationships.rivals.map(r => `
            <li class="rival" data-faction="${escapeHtml(r.id)}">${escapeHtml(r.name)}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Renders rewards list
 * @param {Array} available - Available rewards
 * @param {Array} claimable - Claimable rewards
 * @returns {string} HTML string
 */
function renderRewardsList(available, claimable) {
  if (!available || available.length === 0) {
    return '<div class="faction-rewards"><h4>Rewards</h4><p>No rewards available</p></div>';
  }

  return `
    <div class="faction-rewards">
      <h4>Rewards</h4>
      <ul class="rewards-list">
        ${available.map(reward => renderRewardItem(reward)).join('')}
      </ul>
    </div>
  `;
}

/**
 * Renders a single reward item
 * @param {Object} reward - Reward data
 * @returns {string} HTML string
 */
function renderRewardItem(reward) {
  const levelColor = LEVEL_COLORS[reward.level] || '#808080';
  const statusClass = reward.claimed ? 'claimed' : 'available';

  let rewardContent = '';
  if (reward.items && reward.items.length > 0) {
    rewardContent += reward.items.map(item =>
      `<span class="reward-item">${escapeHtml(formatItemName(item))}</span>`
    ).join('');
  }
  if (reward.discount) {
    rewardContent += `<span class="reward-discount">${Math.round(reward.discount * 100)}% discount</span>`;
  }

  return `
    <li class="reward-entry ${statusClass}">
      <span class="reward-level" style="color: ${levelColor}">${escapeHtml(formatLevelName(reward.level))}</span>
      <div class="reward-content">${rewardContent}</div>
      ${!reward.claimed ? `
        <button class="claim-btn" data-action="claim-reward" data-level="${escapeHtml(reward.level)}">
          Claim
        </button>
      ` : '<span class="claimed-badge">Claimed</span>'}
    </li>
  `;
}

/**
 * Formats item name for display
 * @param {string} itemId - Item ID
 * @returns {string} Formatted name
 */
function formatItemName(itemId) {
  return itemId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Renders reputation change notification
 * @param {Object} change - Change data
 * @returns {string} HTML string
 */
export function renderReputationChange(change) {
  const faction = FACTIONS[change.factionId];
  if (!faction) return '';

  const isPositive = change.amount > 0;
  const changeClass = isPositive ? 'positive' : 'negative';
  const changeSign = isPositive ? '+' : '';
  const levelColor = LEVEL_COLORS[change.newLevel] || '#808080';

  let html = `
    <div class="reputation-change ${changeClass}">
      <div class="change-header">
        <span class="faction-name">${escapeHtml(faction.name)}</span>
        <span class="change-amount">${changeSign}${change.amount}</span>
      </div>
  `;

  if (change.levelChanged) {
    html += `
      <div class="level-change">
        ${change.newLevel !== change.oldLevel ? `
          <span class="level-transition">
            ${escapeHtml(formatLevelName(change.oldLevel))} →
            <span style="color: ${levelColor}">${escapeHtml(formatLevelName(change.newLevel))}</span>
          </span>
        ` : ''}
      </div>
    `;
  }

  if (change.rivalChanges && change.rivalChanges.length > 0) {
    html += `
      <div class="secondary-changes rivals">
        ${change.rivalChanges.map(r => `
          <span class="rival-change">${escapeHtml(FACTIONS[r.factionId]?.name || 'Unknown')}: ${r.amount}</span>
        `).join('')}
      </div>
    `;
  }

  if (change.allyChanges && change.allyChanges.length > 0) {
    html += `
      <div class="secondary-changes allies">
        ${change.allyChanges.map(a => `
          <span class="ally-change">${escapeHtml(FACTIONS[a.factionId]?.name || 'Unknown')}: +${a.amount}</span>
        `).join('')}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Renders faction HUD element
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction to display
 * @returns {string} HTML string
 */
export function renderFactionHud(state, factionId) {
  if (!state || !factionId) return '';

  const standing = state.standings[factionId];
  if (!standing || !standing.discovered) return '';

  const faction = FACTIONS[factionId];
  const levelColor = LEVEL_COLORS[standing.level] || '#808080';

  return `
    <div class="faction-hud">
      <span class="hud-name">${escapeHtml(faction.name)}</span>
      <span class="hud-level" style="color: ${levelColor}">${escapeHtml(formatLevelName(standing.level))}</span>
    </div>
  `;
}

/**
 * Renders faction discovery notification
 * @param {Object} faction - Discovered faction
 * @returns {string} HTML string
 */
export function renderFactionDiscovery(faction) {
  if (!faction) return '';

  const categoryIcon = CATEGORY_ICONS[faction.category] || '';

  return `
    <div class="faction-discovery">
      <div class="discovery-header">
        <span class="discovery-icon">${categoryIcon}</span>
        <span class="discovery-label">Faction Discovered!</span>
      </div>
      <h3 class="discovery-name">${escapeHtml(faction.name)}</h3>
      <p class="discovery-desc">${escapeHtml(faction.description)}</p>
    </div>
  `;
}

/**
 * Renders reputation summary for character sheet
 * @param {Object} state - Reputation state
 * @returns {string} HTML string
 */
export function renderReputationSummary(state) {
  if (!state) return '';

  const score = calculateFactionScore(state);
  const topFactions = getAllStandings(state, { showHidden: false })
    .slice(0, 3);

  return `
    <div class="reputation-summary">
      <h4>Reputation</h4>
      <div class="summary-stats">
        <span>${score.factionsDiscovered} factions discovered</span>
        <span>${score.factionsAtExalted} at Exalted</span>
      </div>
      ${topFactions.length > 0 ? `
        <div class="top-factions">
          ${topFactions.map(f => `
            <div class="top-faction">
              <span class="tf-name">${escapeHtml(f.factionName)}</span>
              <span class="tf-level" style="color: ${LEVEL_COLORS[f.level]}">${escapeHtml(formatLevelName(f.level))}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Gets CSS styles for faction components
 * @returns {string} CSS string
 */
export function getFactionStyles() {
  return `
    .faction-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #ffffff;
    }

    .faction-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .category-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 6px 12px;
      border: 1px solid #333;
      border-radius: 4px;
      background: transparent;
      color: #888;
      cursor: pointer;
    }

    .filter-btn.active {
      background: #333;
      color: #fff;
      border-color: #555;
    }

    .faction-row {
      display: grid;
      grid-template-columns: 1fr 150px 100px;
      gap: 12px;
      align-items: center;
      padding: 12px;
      background: #252540;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .faction-row:hover {
      background: #303050;
    }

    .faction-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .faction-standing {
      text-align: right;
    }

    .standing-level {
      font-weight: bold;
      display: block;
    }

    .standing-rep {
      color: #888;
      font-size: 0.9em;
    }

    .progress-bar {
      background: #333;
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar.large {
      height: 8px;
      border-radius: 4px;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .faction-detail {
      padding: 16px;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .back-btn {
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 1em;
    }

    .detail-name {
      margin: 0 0 8px 0;
    }

    .detail-desc {
      color: #888;
      margin-bottom: 24px;
    }

    .detail-standing {
      background: #252540;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .standing-level-large {
      font-size: 1.5em;
      font-weight: bold;
    }

    .detail-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .stat-value.positive { color: #4caf50; }
    .stat-value.negative { color: #f44336; }

    .faction-relationships {
      margin-bottom: 16px;
    }

    .relationship-group {
      margin-bottom: 12px;
    }

    .relationship-group h4 {
      margin: 0 0 8px 0;
      font-size: 0.9em;
      color: #888;
    }

    .relationship-group ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .relationship-group li {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
      cursor: pointer;
    }

    .ally { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
    .rival { background: rgba(244, 67, 54, 0.2); color: #f44336; }

    .faction-rewards h4 {
      margin: 0 0 12px 0;
    }

    .rewards-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .reward-entry {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-bottom: 1px solid #333;
    }

    .reward-entry.claimed {
      opacity: 0.6;
    }

    .reward-level {
      font-weight: bold;
      min-width: 80px;
    }

    .reward-content {
      flex: 1;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .reward-item {
      background: #333;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .reward-discount {
      color: #4caf50;
    }

    .claim-btn {
      background: #4caf50;
      color: white;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
    }

    .claimed-badge {
      color: #888;
      font-size: 0.9em;
    }

    .reputation-change {
      background: #252540;
      padding: 12px;
      border-radius: 8px;
      margin: 8px 0;
    }

    .reputation-change.positive {
      border-left: 4px solid #4caf50;
    }

    .reputation-change.negative {
      border-left: 4px solid #f44336;
    }

    .change-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .change-amount {
      font-weight: bold;
    }

    .positive .change-amount { color: #4caf50; }
    .negative .change-amount { color: #f44336; }

    .secondary-changes {
      font-size: 0.9em;
      color: #888;
      margin-top: 8px;
    }

    .faction-hud {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 0.9em;
    }

    .faction-discovery {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, #1a1a2e, #252540);
      border-radius: 8px;
    }

    .discovery-icon {
      font-size: 2em;
    }

    .discovery-label {
      color: #ffd700;
      font-weight: bold;
    }

    .reputation-summary {
      padding: 12px;
    }

    .top-factions {
      margin-top: 8px;
    }

    .top-faction {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
  `;
}
