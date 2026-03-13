/**
 * Leaderboard System UI
 * UI components for displaying leaderboards and rankings
 */

import {
  LEADERBOARD_CATEGORIES,
  CATEGORY_INFO,
  TIME_PERIODS,
  RANK_TIERS,
  getTopEntries,
  getPlayerEntry,
  getEntriesAroundPlayer,
  getRankTier,
  getFilteredLeaderboard,
  getPlayerStats,
  formatScore,
  getAllCategories,
  getTopAchievements,
  calculateOverallScore,
  getLeaderboardStats
} from './leaderboard-system.js';

// Helper function to escape HTML
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render main leaderboard panel
export function renderLeaderboardPanel(state, currentPlayerId, selectedCategory = null) {
  const categories = getAllCategories();
  const activeCategory = selectedCategory || LEADERBOARD_CATEGORIES.HIGHEST_LEVEL;
  const categoryInfo = CATEGORY_INFO[activeCategory];
  const topEntries = getTopEntries(state, activeCategory, 10);
  const playerEntry = getPlayerEntry(state, activeCategory, currentPlayerId);
  const overallScore = calculateOverallScore(state, currentPlayerId);

  return `
    <div class="leaderboard-panel">
      <div class="leaderboard-header">
        <h2>🏆 Leaderboards</h2>
        <div class="overall-score">
          <span class="score-label">Your Ranking Score:</span>
          <span class="score-value">${overallScore}%</span>
        </div>
      </div>

      <div class="category-tabs">
        ${categories.slice(0, 6).map(cat => `
          <button class="category-tab ${cat.key === activeCategory ? 'active' : ''}"
                  data-category="${escapeHtml(cat.key)}">
            <span class="tab-icon">${cat.icon}</span>
            <span class="tab-name">${escapeHtml(cat.name)}</span>
          </button>
        `).join('')}
        <button class="category-tab more-btn" data-action="show-more">
          More...
        </button>
      </div>

      <div class="leaderboard-content">
        <div class="category-header">
          <span class="category-icon">${categoryInfo.icon}</span>
          <div class="category-info">
            <h3>${escapeHtml(categoryInfo.name)}</h3>
            <p>${escapeHtml(categoryInfo.description)}</p>
          </div>
        </div>

        <div class="time-filter">
          ${Object.entries(TIME_PERIODS).map(([key, period]) => `
            <button class="time-btn ${key === 'ALL_TIME' ? 'active' : ''}"
                    data-period="${escapeHtml(key)}">
              ${escapeHtml(period.name)}
            </button>
          `).join('')}
        </div>

        <div class="leaderboard-list">
          ${topEntries.length > 0
            ? topEntries.map(entry => renderLeaderboardEntry(entry, categoryInfo, entry.playerId === currentPlayerId)).join('')
            : '<div class="no-entries">No entries yet. Be the first!</div>'
          }
        </div>

        ${playerEntry && playerEntry.rank > 10 ? `
          <div class="player-position">
            <div class="divider">• • •</div>
            ${renderLeaderboardEntry(playerEntry, categoryInfo, true)}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Render a single leaderboard entry
export function renderLeaderboardEntry(entry, categoryInfo, isCurrentPlayer = false) {
  const tier = getRankTier(entry.rank);
  const formattedScore = formatScore(entry.score, categoryInfo.format);

  return `
    <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}"
         data-player-id="${escapeHtml(entry.playerId)}">
      <div class="rank-badge" style="background: ${tier.color}">
        ${entry.rank <= 3 ? getRankMedal(entry.rank) : `#${entry.rank}`}
      </div>
      <div class="player-info">
        <span class="player-name">${escapeHtml(entry.playerName)}</span>
        <span class="tier-name" style="color: ${tier.color}">${tier.icon} ${tier.name}</span>
      </div>
      <div class="score-display">
        ${formattedScore}
      </div>
    </div>
  `;
}

// Get medal emoji for top 3
export function getRankMedal(rank) {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

// Render category selector modal
export function renderCategorySelector(activeCategory) {
  const categories = getAllCategories();

  return `
    <div class="category-selector-modal">
      <h3>Select Category</h3>
      <div class="category-grid">
        ${categories.map(cat => `
          <button class="category-option ${cat.key === activeCategory ? 'selected' : ''}"
                  data-category="${escapeHtml(cat.key)}">
            <span class="option-icon">${cat.icon}</span>
            <span class="option-name">${escapeHtml(cat.name)}</span>
            <span class="option-desc">${escapeHtml(cat.description)}</span>
          </button>
        `).join('')}
      </div>
      <button class="close-modal-btn">Close</button>
    </div>
  `;
}

// Render player profile card
export function renderPlayerProfile(state, playerId) {
  const stats = getPlayerStats(state, playerId);
  const achievements = getTopAchievements(state, playerId, 10);
  const overallScore = calculateOverallScore(state, playerId);

  return `
    <div class="player-profile">
      <div class="profile-header">
        <div class="overall-ranking">
          <span class="ranking-value">${overallScore}%</span>
          <span class="ranking-label">Overall Ranking</span>
        </div>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">${stats.rankedCategories}</span>
            <span class="stat-label">Categories Ranked</span>
          </div>
          <div class="stat">
            <span class="stat-value">${achievements.length}</span>
            <span class="stat-label">Top 10 Finishes</span>
          </div>
        </div>
      </div>

      ${achievements.length > 0 ? `
        <div class="achievements-section">
          <h4>🏆 Top Achievements</h4>
          <div class="achievements-list">
            ${achievements.map(a => `
              <div class="achievement-badge" style="border-color: ${a.tier.color}">
                <span class="badge-icon">${a.categoryInfo.icon}</span>
                <div class="badge-info">
                  <span class="badge-rank" style="color: ${a.tier.color}">#${a.rank}</span>
                  <span class="badge-category">${escapeHtml(a.categoryInfo.name)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="rankings-breakdown">
        <h4>📊 Rankings Breakdown</h4>
        <div class="rankings-list">
          ${Object.entries(stats.rankings).map(([category, data]) => `
            <div class="ranking-row">
              <span class="row-icon">${CATEGORY_INFO[category].icon}</span>
              <span class="row-category">${escapeHtml(CATEGORY_INFO[category].name)}</span>
              <span class="row-rank" style="color: ${data.tier.color}">#${data.rank}</span>
              <span class="row-score">${formatScore(data.score, CATEGORY_INFO[category].format)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render mini leaderboard widget (for sidebar/HUD)
export function renderMiniLeaderboard(state, category, currentPlayerId, limit = 5) {
  const categoryInfo = CATEGORY_INFO[category];
  if (!categoryInfo) return '';

  const topEntries = getTopEntries(state, category, limit);
  const playerEntry = getPlayerEntry(state, category, currentPlayerId);

  return `
    <div class="mini-leaderboard">
      <div class="mini-header">
        <span>${categoryInfo.icon} ${escapeHtml(categoryInfo.name)}</span>
      </div>
      <div class="mini-entries">
        ${topEntries.map((entry, i) => `
          <div class="mini-entry ${entry.playerId === currentPlayerId ? 'is-player' : ''}">
            <span class="mini-rank">${getRankMedal(entry.rank)}</span>
            <span class="mini-name">${escapeHtml(entry.playerName)}</span>
            <span class="mini-score">${formatScore(entry.score, categoryInfo.format)}</span>
          </div>
        `).join('')}
      </div>
      ${playerEntry && playerEntry.rank > limit ? `
        <div class="mini-player">
          <span class="mini-rank">#${playerEntry.rank}</span>
          <span class="mini-name">You</span>
          <span class="mini-score">${formatScore(playerEntry.score, categoryInfo.format)}</span>
        </div>
      ` : ''}
    </div>
  `;
}

// Render new high score notification
export function renderNewHighScoreNotification(entry, categoryInfo, previousRank, newRank) {
  const improvement = previousRank ? previousRank - newRank : null;
  const tier = getRankTier(newRank);

  return `
    <div class="high-score-notification">
      <div class="notification-header">
        <span class="notification-icon">🎉</span>
        <span class="notification-title">New Personal Best!</span>
      </div>
      <div class="notification-content">
        <span class="category-icon">${categoryInfo.icon}</span>
        <span class="category-name">${escapeHtml(categoryInfo.name)}</span>
      </div>
      <div class="notification-score">
        <span class="score-value">${formatScore(entry.score, categoryInfo.format)}</span>
      </div>
      <div class="notification-rank" style="color: ${tier.color}">
        ${tier.icon} Rank #${newRank}
        ${improvement ? `<span class="rank-improvement">(+${improvement} places!)</span>` : ''}
      </div>
    </div>
  `;
}

// Render leaderboard entry animation (for climbing ranks)
export function renderRankChangeAnimation(oldRank, newRank, direction) {
  const change = Math.abs(oldRank - newRank);
  const directionIcon = direction === 'up' ? '⬆️' : '⬇️';
  const color = direction === 'up' ? '#4CAF50' : '#F44336';

  return `
    <div class="rank-change-animation" style="color: ${color}">
      <span class="change-icon">${directionIcon}</span>
      <span class="change-value">${change}</span>
    </div>
  `;
}

// Render leaderboard statistics
export function renderLeaderboardStats(state, category) {
  const stats = getLeaderboardStats(state, category);
  const categoryInfo = CATEGORY_INFO[category];

  if (!stats || stats.totalEntries === 0) {
    return `
      <div class="leaderboard-stats empty">
        <p>No statistics available yet.</p>
      </div>
    `;
  }

  return `
    <div class="leaderboard-stats">
      <h4>📈 ${escapeHtml(categoryInfo.name)} Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Players</span>
          <span class="stat-value">${stats.totalEntries}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Top Score</span>
          <span class="stat-value">${formatScore(stats.topScore, categoryInfo.format)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average</span>
          <span class="stat-value">${formatScore(stats.averageScore, categoryInfo.format)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Median</span>
          <span class="stat-value">${formatScore(stats.medianScore, categoryInfo.format)}</span>
        </div>
      </div>
    </div>
  `;
}

// Render comparison view between two players
export function renderPlayerComparison(state, player1Id, player2Id, player1Name, player2Name) {
  const stats1 = getPlayerStats(state, player1Id);
  const stats2 = getPlayerStats(state, player2Id);

  const categories = Object.keys(LEADERBOARD_CATEGORIES);

  return `
    <div class="player-comparison">
      <div class="comparison-header">
        <div class="player-col">${escapeHtml(player1Name)}</div>
        <div class="vs-col">VS</div>
        <div class="player-col">${escapeHtml(player2Name)}</div>
      </div>
      <div class="comparison-rows">
        ${categories.map(cat => {
          const catKey = LEADERBOARD_CATEGORIES[cat];
          const info = CATEGORY_INFO[catKey];
          const rank1 = stats1.rankings[catKey]?.rank || '-';
          const rank2 = stats2.rankings[catKey]?.rank || '-';
          const winner = determineWinner(rank1, rank2);

          return `
            <div class="comparison-row">
              <div class="rank-cell ${winner === 1 ? 'winner' : ''}">#${rank1}</div>
              <div class="category-cell">
                <span class="cat-icon">${info.icon}</span>
                <span class="cat-name">${escapeHtml(info.name)}</span>
              </div>
              <div class="rank-cell ${winner === 2 ? 'winner' : ''}">#${rank2}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Helper to determine winner in comparison
function determineWinner(rank1, rank2) {
  if (rank1 === '-' && rank2 === '-') return 0;
  if (rank1 === '-') return 2;
  if (rank2 === '-') return 1;
  if (rank1 < rank2) return 1;
  if (rank2 < rank1) return 2;
  return 0;
}

// Render rank tier legend
export function renderRankTierLegend() {
  return `
    <div class="rank-tier-legend">
      <h4>Rank Tiers</h4>
      <div class="tier-list">
        ${Object.values(RANK_TIERS).map(tier => `
          <div class="tier-item" style="border-left: 4px solid ${tier.color}">
            <span class="tier-icon">${tier.icon}</span>
            <span class="tier-name">${tier.name}</span>
            <span class="tier-range">${tier.minRank === tier.maxRank ? `#${tier.minRank}` : `#${tier.minRank}-${tier.maxRank === Infinity ? '∞' : tier.maxRank}`}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render context around player's position
export function renderPlayerContext(state, category, playerId) {
  const categoryInfo = CATEGORY_INFO[category];
  const entries = getEntriesAroundPlayer(state, category, playerId, 2);

  if (entries.length === 0) {
    return `
      <div class="player-context">
        <p>You haven't ranked in this category yet.</p>
      </div>
    `;
  }

  return `
    <div class="player-context">
      <h4>Your Position</h4>
      <div class="context-entries">
        ${entries.map(entry => renderLeaderboardEntry(entry, categoryInfo, entry.playerId === playerId)).join('')}
      </div>
    </div>
  `;
}

// Export CSS styles
export const LEADERBOARD_STYLES = `
  .leaderboard-panel {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    font-family: sans-serif;
  }

  .leaderboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .category-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .category-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    background: #2a2a4a;
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-tab.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .leaderboard-entry {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #2a2a4a;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: transform 0.2s;
  }

  .leaderboard-entry:hover {
    transform: translateX(4px);
  }

  .leaderboard-entry.current-player {
    background: linear-gradient(90deg, #2a2a4a 0%, #3a3a6a 100%);
    border: 2px solid #667eea;
  }

  .rank-badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 12px;
  }

  .player-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .player-name {
    font-weight: bold;
  }

  .tier-name {
    font-size: 12px;
  }

  .score-display {
    font-size: 18px;
    font-weight: bold;
    color: #FFD700;
  }

  .high-score-notification {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    animation: celebrate 0.5s ease-out;
  }

  @keyframes celebrate {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }

  .mini-leaderboard {
    background: #2a2a4a;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
  }

  .mini-entry {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }

  .mini-entry.is-player {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 4px;
    padding: 4px 8px;
    margin: 0 -8px;
  }
`;
