/**
 * Leaderboard System UI
 * Rendering functions for leaderboard interface
 */

import {
  LEADERBOARD_TYPES,
  TIME_PERIODS,
  RANK_TIERS,
  buildLeaderboard,
  getPlayerRank,
  getTopPlayers,
  getNearbyPlayers,
  getLeaderboardStats,
  getScorePercentile,
  getAllLeaderboardTypes,
  getAllTimePeriods
} from './leaderboard-system.js';

/**
 * Escape HTML to prevent XSS
 */
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
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Render rank badge
 */
export function renderRankBadge(rank) {
  if (rank === 1) return '<span class="rank-badge champion">&#127775; 1st</span>';
  if (rank === 2) return '<span class="rank-badge second">&#129352; 2nd</span>';
  if (rank === 3) return '<span class="rank-badge third">&#129353; 3rd</span>';
  return `<span class="rank-badge">#${rank}</span>`;
}

/**
 * Render tier badge
 */
export function renderTierBadge(tier) {
  if (!tier) return '';
  return `<span class="tier-badge tier-${tier.id}">${tier.icon} ${escapeHtml(tier.name)}</span>`;
}

/**
 * Render leaderboard entry
 */
export function renderLeaderboardEntry(entry, isCurrentPlayer = false) {
  if (!entry) return '';

  return `
    <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''} rank-${entry.rank <= 3 ? entry.rank : 'other'}">
      <div class="entry-rank">${renderRankBadge(entry.rank)}</div>
      <div class="entry-player">
        <span class="player-name">${escapeHtml(entry.playerId)}</span>
        ${entry.tier ? renderTierBadge(entry.tier) : ''}
      </div>
      <div class="entry-score">${formatNumber(entry.score)}</div>
    </div>
  `;
}

/**
 * Render full leaderboard
 */
export function renderLeaderboard(state, leaderboardType, period = 'all_time', currentPlayerId = null, limit = 100) {
  const data = buildLeaderboard(state, leaderboardType, period, limit);
  const typeInfo = LEADERBOARD_TYPES[leaderboardType.toUpperCase()];
  const periodInfo = TIME_PERIODS[period.toUpperCase()];

  if (data.entries.length === 0) {
    return `
      <div class="leaderboard empty">
        <h3>${escapeHtml(typeInfo?.name || leaderboardType)} Leaderboard</h3>
        <p>No entries yet</p>
      </div>
    `;
  }

  return `
    <div class="leaderboard">
      <div class="leaderboard-header">
        <h3>${escapeHtml(typeInfo?.name || leaderboardType)}</h3>
        <span class="period-badge">${escapeHtml(periodInfo?.name || period)}</span>
      </div>
      <div class="leaderboard-entries">
        ${data.entries.map(entry =>
          renderLeaderboardEntry(entry, entry.playerId === currentPlayerId)
        ).join('')}
      </div>
      <div class="leaderboard-footer">
        <span class="total-players">${data.total} total players</span>
      </div>
    </div>
  `;
}

/**
 * Render top 3 podium
 */
export function renderPodium(state, leaderboardType, period = 'all_time') {
  const top3 = getTopPlayers(state, leaderboardType, 3, period);

  if (top3.length === 0) {
    return '<div class="podium empty">No rankings yet</div>';
  }

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return `
    <div class="podium">
      <div class="podium-place second">
        ${second ? `
          <div class="podium-player">
            <span class="medal">&#129352;</span>
            <span class="name">${escapeHtml(second.playerId)}</span>
            <span class="score">${formatNumber(second.score)}</span>
          </div>
          <div class="podium-block">2</div>
        ` : '<div class="podium-empty">-</div>'}
      </div>
      <div class="podium-place first">
        ${first ? `
          <div class="podium-player">
            <span class="medal">&#127942;</span>
            <span class="name">${escapeHtml(first.playerId)}</span>
            <span class="score">${formatNumber(first.score)}</span>
          </div>
          <div class="podium-block">1</div>
        ` : '<div class="podium-empty">-</div>'}
      </div>
      <div class="podium-place third">
        ${third ? `
          <div class="podium-player">
            <span class="medal">&#129353;</span>
            <span class="name">${escapeHtml(third.playerId)}</span>
            <span class="score">${formatNumber(third.score)}</span>
          </div>
          <div class="podium-block">3</div>
        ` : '<div class="podium-empty">-</div>'}
      </div>
    </div>
  `;
}

/**
 * Render player rank card
 */
export function renderPlayerRankCard(state, playerId, leaderboardType, period = 'all_time') {
  const rank = getPlayerRank(state, playerId, leaderboardType, period);
  const percentile = getScorePercentile(state, playerId, leaderboardType, period);
  const typeInfo = LEADERBOARD_TYPES[leaderboardType.toUpperCase()];

  if (!rank.found) {
    return `
      <div class="player-rank-card unranked">
        <h4>${escapeHtml(typeInfo?.name || leaderboardType)}</h4>
        <p>Not ranked yet</p>
      </div>
    `;
  }

  return `
    <div class="player-rank-card">
      <h4>${escapeHtml(typeInfo?.name || leaderboardType)}</h4>
      <div class="rank-display">
        ${renderRankBadge(rank.rank)}
        ${renderTierBadge(rank.tier)}
      </div>
      <div class="score-display">
        <span class="score">${formatNumber(rank.score)}</span>
        <span class="label">Score</span>
      </div>
      ${percentile !== null ? `
        <div class="percentile">Top ${100 - percentile}%</div>
      ` : ''}
      <div class="total-info">of ${formatNumber(rank.totalPlayers)} players</div>
    </div>
  `;
}

/**
 * Render nearby players list
 */
export function renderNearbyPlayers(state, playerId, leaderboardType, period = 'all_time') {
  const nearby = getNearbyPlayers(state, playerId, leaderboardType, 5, period);

  if (!nearby.found) {
    return '<div class="nearby-players empty">You are not ranked</div>';
  }

  return `
    <div class="nearby-players">
      <h4>Your Ranking Area</h4>
      <div class="nearby-entries">
        ${nearby.entries.map(entry =>
          renderLeaderboardEntry(entry, entry.playerId === playerId)
        ).join('')}
      </div>
    </div>
  `;
}

/**
 * Render leaderboard type selector
 */
export function renderTypeSelector(selectedType) {
  const types = getAllLeaderboardTypes();

  return `
    <div class="leaderboard-type-selector">
      <select name="leaderboard-type">
        ${types.map(type => `
          <option value="${escapeHtml(type.id)}" ${selectedType === type.id ? 'selected' : ''}>
            ${escapeHtml(type.name)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render period selector
 */
export function renderPeriodSelector(selectedPeriod) {
  const periods = getAllTimePeriods();

  return `
    <div class="period-selector">
      ${periods.map(period => `
        <button class="period-btn ${selectedPeriod === period.id ? 'active' : ''}"
                data-period="${escapeHtml(period.id)}">
          ${escapeHtml(period.name)}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render leaderboard tabs
 */
export function renderLeaderboardTabs(activeType) {
  const types = getAllLeaderboardTypes();

  return `
    <div class="leaderboard-tabs">
      ${types.slice(0, 5).map(type => `
        <button class="tab ${activeType === type.id ? 'active' : ''}"
                data-type="${escapeHtml(type.id)}">
          ${escapeHtml(type.name)}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render leaderboard stats
 */
export function renderLeaderboardStats(state) {
  const stats = getLeaderboardStats(state);

  return `
    <div class="leaderboard-stats">
      <div class="stat-item">
        <span class="stat-value">${formatNumber(stats.totalPlayers)}</span>
        <span class="stat-label">Total Players</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${formatNumber(stats.updatesProcessed)}</span>
        <span class="stat-label">Score Updates</span>
      </div>
    </div>
  `;
}

/**
 * Render tier legend
 */
export function renderTierLegend() {
  return `
    <div class="tier-legend">
      <h4>Rank Tiers</h4>
      ${Object.values(RANK_TIERS).filter(t => t.id !== 'unranked').map(tier => `
        <div class="tier-item tier-${tier.id}">
          <span class="tier-icon">${tier.icon}</span>
          <span class="tier-name">${escapeHtml(tier.name)}</span>
          <span class="tier-range">${tier.minRank === 1 ? '#1' : `Top ${tier.minRank}`}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render compact rank display
 */
export function renderCompactRank(state, playerId, leaderboardType) {
  const rank = getPlayerRank(state, playerId, leaderboardType);

  if (!rank.found) {
    return '<span class="compact-rank unranked">-</span>';
  }

  return `
    <span class="compact-rank">
      ${rank.tier?.icon || ''} #${rank.rank}
    </span>
  `;
}

/**
 * Render search box
 */
export function renderPlayerSearch() {
  return `
    <div class="player-search">
      <input type="text" name="search-player" placeholder="Search player...">
      <button class="search-btn">&#128269;</button>
    </div>
  `;
}

/**
 * Render comparison view
 */
export function renderPlayerComparison(player1, player2) {
  if (!player1 || !player2) {
    return '<div class="comparison empty">Select two players to compare</div>';
  }

  const diff = player1.score - player2.score;

  return `
    <div class="player-comparison">
      <div class="comparison-player">
        <span class="player-name">${escapeHtml(player1.playerId)}</span>
        <span class="player-rank">#${player1.rank || '-'}</span>
        <span class="player-score">${formatNumber(player1.score || 0)}</span>
      </div>
      <div class="comparison-vs">
        <span class="vs">VS</span>
        <span class="diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}">${diff > 0 ? '+' : ''}${formatNumber(diff)}</span>
      </div>
      <div class="comparison-player">
        <span class="player-name">${escapeHtml(player2.playerId)}</span>
        <span class="player-rank">#${player2.rank || '-'}</span>
        <span class="player-score">${formatNumber(player2.score || 0)}</span>
      </div>
    </div>
  `;
}
