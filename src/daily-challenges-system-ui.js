/**
 * Daily Challenges System UI
 * UI components for displaying and interacting with daily challenges
 */

import {
  CHALLENGE_TYPES,
  CHALLENGE_DIFFICULTY,
  CHALLENGE_DURATION,
  TOKEN_SHOP_ITEMS,
  getChallengeProgress,
  getTimeRemaining,
  getChallengeStats,
  getClaimableChallenges,
  getExpiringChallenges,
  getStreakBonus
} from './daily-challenges-system.js';

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

// Challenge type icons
export const TYPE_ICONS = {
  [CHALLENGE_TYPES.COMBAT]: '⚔️',
  [CHALLENGE_TYPES.EXPLORATION]: '🗺️',
  [CHALLENGE_TYPES.COLLECTION]: '💎',
  [CHALLENGE_TYPES.CRAFTING]: '🔨',
  [CHALLENGE_TYPES.TRADING]: '💰',
  [CHALLENGE_TYPES.SOCIAL]: '🤝',
  [CHALLENGE_TYPES.SURVIVAL]: '🛡️',
  [CHALLENGE_TYPES.SPEED]: '⚡'
};

// Duration icons
export const DURATION_ICONS = {
  DAILY: '📅',
  WEEKLY: '📆',
  WEEKEND: '🎉',
  EVENT: '🎊'
};

// Render the main challenges panel
export function renderChallengesPanel(state, currentTime = Date.now()) {
  const stats = getChallengeStats(state);
  const claimable = getClaimableChallenges(state);
  const expiring = getExpiringChallenges(state, 2);
  const streakBonus = getStreakBonus(state);

  return `
    <div class="challenges-panel">
      <div class="challenges-header">
        <h2>📋 Daily Challenges</h2>
        <div class="challenges-summary">
          <span class="token-count">🪙 ${stats.tokens} Tokens</span>
          <span class="streak-count">🔥 ${stats.streak} Day Streak</span>
          ${streakBonus > 0 ? `<span class="streak-bonus">+${streakBonus}% Bonus</span>` : ''}
        </div>
      </div>

      ${claimable.length > 0 ? `
        <div class="claimable-banner">
          ✨ ${claimable.length} challenge${claimable.length > 1 ? 's' : ''} ready to claim!
        </div>
      ` : ''}

      ${expiring.length > 0 ? `
        <div class="expiring-warning">
          ⏰ ${expiring.length} challenge${expiring.length > 1 ? 's' : ''} expiring soon!
        </div>
      ` : ''}

      <div class="challenges-tabs">
        <button class="tab-btn active" data-tab="active">Active (${stats.active})</button>
        <button class="tab-btn" data-tab="completed">Completed</button>
        <button class="tab-btn" data-tab="shop">Token Shop</button>
        <button class="tab-btn" data-tab="stats">Stats</button>
      </div>

      <div class="challenges-content">
        ${renderActiveChallenges(state, currentTime)}
      </div>
    </div>
  `;
}

// Render active challenges list
export function renderActiveChallenges(state, currentTime = Date.now()) {
  const activeChallenges = state.activeChallenges.filter(c => c.status === 'active' || c.status === 'completed');

  if (activeChallenges.length === 0) {
    return `
      <div class="no-challenges">
        <p>No active challenges!</p>
        <p>New daily challenges refresh every 24 hours.</p>
      </div>
    `;
  }

  // Group by duration
  const daily = activeChallenges.filter(c => c.duration === 'DAILY');
  const weekly = activeChallenges.filter(c => c.duration === 'WEEKLY');
  const other = activeChallenges.filter(c => c.duration !== 'DAILY' && c.duration !== 'WEEKLY');

  let html = '';

  if (daily.length > 0) {
    html += `
      <div class="challenge-section">
        <h3>📅 Daily Challenges</h3>
        <div class="challenge-list">
          ${daily.map(c => renderChallengeCard(c, currentTime)).join('')}
        </div>
      </div>
    `;
  }

  if (weekly.length > 0) {
    html += `
      <div class="challenge-section">
        <h3>📆 Weekly Challenge</h3>
        <div class="challenge-list">
          ${weekly.map(c => renderChallengeCard(c, currentTime)).join('')}
        </div>
      </div>
    `;
  }

  if (other.length > 0) {
    html += `
      <div class="challenge-section">
        <h3>🎉 Special Challenges</h3>
        <div class="challenge-list">
          ${other.map(c => renderChallengeCard(c, currentTime)).join('')}
        </div>
      </div>
    `;
  }

  return html;
}

// Render a single challenge card
export function renderChallengeCard(challenge, currentTime = Date.now()) {
  const progress = getChallengeProgress(challenge);
  const timeRemaining = getTimeRemaining(challenge, currentTime);
  const difficultyData = CHALLENGE_DIFFICULTY[challenge.difficulty];
  const typeIcon = TYPE_ICONS[challenge.type] || '📋';
  const isComplete = challenge.status === 'completed';
  const isExpiringSoon = !timeRemaining.expired && timeRemaining.hours < 2;

  return `
    <div class="challenge-card ${isComplete ? 'completed' : ''} ${isExpiringSoon ? 'expiring-soon' : ''}" data-challenge-id="${escapeHtml(challenge.id)}">
      <div class="challenge-icon">${typeIcon}</div>
      <div class="challenge-info">
        <div class="challenge-header">
          <span class="challenge-name">${escapeHtml(challenge.name)}</span>
          <span class="challenge-difficulty" style="color: ${difficultyData.color}">${difficultyData.name}</span>
        </div>
        <p class="challenge-description">${escapeHtml(challenge.description)}</p>
        <div class="challenge-progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
          <span class="progress-text">${challenge.currentCount}/${challenge.targetCount}</span>
        </div>
        <div class="challenge-footer">
          <span class="challenge-time ${isExpiringSoon ? 'urgent' : ''}">${timeRemaining.formatted}</span>
          <span class="challenge-rewards">🪙 ${challenge.rewards.tokens}</span>
        </div>
      </div>
      ${isComplete ? `
        <button class="claim-btn" data-challenge-id="${escapeHtml(challenge.id)}">Claim</button>
      ` : `
        <button class="abandon-btn" data-challenge-id="${escapeHtml(challenge.id)}" title="Abandon">✕</button>
      `}
    </div>
  `;
}

// Render completed challenges history
export function renderCompletedChallenges(state) {
  const recentCompleted = state.completedChallenges
    .filter(c => c.status === 'completed' || c.status === 'expired' || c.status === 'abandoned')
    .slice(-20)
    .reverse();

  if (recentCompleted.length === 0) {
    return `
      <div class="no-challenges">
        <p>No completed challenges yet.</p>
        <p>Complete challenges to see your history here!</p>
      </div>
    `;
  }

  return `
    <div class="completed-challenges">
      ${recentCompleted.map(c => renderCompletedCard(c)).join('')}
    </div>
  `;
}

// Render a completed challenge card
export function renderCompletedCard(challenge) {
  const typeIcon = TYPE_ICONS[challenge.type] || '📋';
  const statusClass = challenge.status === 'completed' ? 'success' :
                      challenge.status === 'expired' ? 'expired' : 'abandoned';
  const statusIcon = challenge.status === 'completed' ? '✅' :
                     challenge.status === 'expired' ? '⏰' : '❌';

  const completedDate = challenge.completedAt || challenge.expiredAt || challenge.abandonedAt;
  const dateStr = completedDate ? new Date(completedDate).toLocaleDateString() : 'Unknown';

  return `
    <div class="completed-card ${statusClass}">
      <span class="status-icon">${statusIcon}</span>
      <span class="type-icon">${typeIcon}</span>
      <div class="completed-info">
        <span class="challenge-name">${escapeHtml(challenge.name)}</span>
        <span class="completed-date">${dateStr}</span>
      </div>
      ${challenge.status === 'completed' ? `
        <span class="rewards-earned">+${challenge.rewards.tokens} 🪙</span>
      ` : ''}
    </div>
  `;
}

// Render token shop
export function renderTokenShop(state) {
  const items = Object.entries(TOKEN_SHOP_ITEMS);

  return `
    <div class="token-shop">
      <div class="shop-header">
        <h3>🛒 Token Shop</h3>
        <span class="token-balance">Your Tokens: 🪙 ${state.tokens}</span>
      </div>
      <div class="shop-items">
        ${items.map(([key, item]) => renderShopItem(key, item, state)).join('')}
      </div>
    </div>
  `;
}

// Render a shop item
export function renderShopItem(key, item, state) {
  const canAfford = state.tokens >= item.cost;

  return `
    <div class="shop-item ${canAfford ? '' : 'cannot-afford'}">
      <div class="item-info">
        <span class="item-name">${escapeHtml(item.name)}</span>
        <p class="item-description">${escapeHtml(item.description)}</p>
      </div>
      <div class="item-purchase">
        <span class="item-cost">🪙 ${item.cost}</span>
        <button class="purchase-btn" data-item="${escapeHtml(key)}" ${canAfford ? '' : 'disabled'}>
          ${canAfford ? 'Buy' : 'Need More'}
        </button>
      </div>
    </div>
  `;
}

// Render challenge stats
export function renderChallengeStatsPanel(state) {
  const stats = getChallengeStats(state);

  return `
    <div class="stats-panel">
      <h3>📊 Challenge Statistics</h3>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${stats.totalCompleted}</span>
          <span class="stat-label">Total Completed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.dailyCompleted}</span>
          <span class="stat-label">Daily Completed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.weeklyCompleted}</span>
          <span class="stat-label">Weekly Completed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.longestStreak}</span>
          <span class="stat-label">Longest Streak</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">🪙 ${stats.totalTokensEarned}</span>
          <span class="stat-label">Total Tokens Earned</span>
        </div>
        <div class="stat-card highlight">
          <span class="stat-value">🔥 ${stats.streak}</span>
          <span class="stat-label">Current Streak</span>
        </div>
      </div>

      <div class="streak-bonus-info">
        <h4>Streak Bonus</h4>
        <p>Complete at least one daily challenge each day to maintain your streak!</p>
        <div class="streak-tiers">
          <span class="tier ${stats.streak >= 3 ? 'active' : ''}">3+ Days: +30%</span>
          <span class="tier ${stats.streak >= 7 ? 'active' : ''}">7+ Days: +70%</span>
          <span class="tier ${stats.streak >= 10 ? 'active' : ''}">10+ Days: +100%</span>
        </div>
      </div>
    </div>
  `;
}

// Render reward claim popup
export function renderRewardClaimPopup(challenge, rewards, streakBonus) {
  const typeIcon = TYPE_ICONS[challenge.type] || '📋';

  return `
    <div class="reward-popup">
      <div class="reward-header">
        <span class="reward-icon">${typeIcon}</span>
        <h3>Challenge Complete!</h3>
      </div>
      <p class="challenge-name">${escapeHtml(challenge.name)}</p>

      <div class="rewards-breakdown">
        <div class="reward-row">
          <span>Base Tokens:</span>
          <span>🪙 ${challenge.rewards.tokens}</span>
        </div>
        ${rewards.bonusTokens > 0 ? `
          <div class="reward-row bonus">
            <span>Streak Bonus (+${streakBonus}%):</span>
            <span>🪙 +${rewards.bonusTokens}</span>
          </div>
        ` : ''}
        <div class="reward-row total">
          <span>Total:</span>
          <span>🪙 ${rewards.totalTokens}</span>
        </div>
        <div class="reward-row">
          <span>Gold:</span>
          <span>💰 ${rewards.gold}</span>
        </div>
        <div class="reward-row">
          <span>Experience:</span>
          <span>✨ ${rewards.experience} XP</span>
        </div>
      </div>

      <button class="close-popup-btn">Collect</button>
    </div>
  `;
}

// Render challenge notification (for when a challenge is completed)
export function renderChallengeCompleteNotification(challenge) {
  const typeIcon = TYPE_ICONS[challenge.type] || '📋';

  return `
    <div class="challenge-notification complete">
      <span class="notification-icon">${typeIcon}</span>
      <div class="notification-content">
        <strong>Challenge Complete!</strong>
        <span>${escapeHtml(challenge.name)}</span>
      </div>
      <span class="notification-reward">🪙 ${challenge.rewards.tokens}</span>
    </div>
  `;
}

// Render expiring challenge warning
export function renderExpiringWarning(challenges) {
  if (challenges.length === 0) return '';

  return `
    <div class="expiring-challenges-warning">
      <h4>⏰ Challenges Expiring Soon!</h4>
      <ul>
        ${challenges.map(c => {
          const time = getTimeRemaining(c);
          return `<li>${escapeHtml(c.name)} - ${time.formatted}</li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

// Render progress update notification
export function renderProgressNotification(challenge, previousCount, newCount) {
  const progress = getChallengeProgress(challenge);
  const typeIcon = TYPE_ICONS[challenge.type] || '📋';

  return `
    <div class="progress-notification">
      <span class="notification-icon">${typeIcon}</span>
      <div class="notification-content">
        <span class="challenge-name">${escapeHtml(challenge.name)}</span>
        <span class="progress-update">${newCount}/${challenge.targetCount} (${Math.round(progress)}%)</span>
      </div>
    </div>
  `;
}

// Render streak milestone notification
export function renderStreakMilestone(streak) {
  const milestones = {
    3: { message: '3 Day Streak!', bonus: '+30% Token Bonus' },
    7: { message: 'Week Warrior!', bonus: '+70% Token Bonus' },
    10: { message: 'Legendary Streak!', bonus: '+100% Token Bonus' },
    30: { message: 'Monthly Master!', bonus: 'Max Bonus Achieved!' }
  };

  const milestone = milestones[streak];
  if (!milestone) return '';

  return `
    <div class="streak-milestone">
      <div class="milestone-icon">🔥</div>
      <div class="milestone-content">
        <strong>${milestone.message}</strong>
        <span>${milestone.bonus}</span>
      </div>
    </div>
  `;
}

// Render mini challenge tracker (for HUD)
export function renderMiniTracker(state, currentTime = Date.now()) {
  const activeChallenges = state.activeChallenges.filter(c => c.status === 'active');
  const claimable = getClaimableChallenges(state);

  if (activeChallenges.length === 0 && claimable.length === 0) {
    return `<div class="mini-tracker empty">No active challenges</div>`;
  }

  // Show up to 3 challenges
  const displayChallenges = [...claimable, ...activeChallenges].slice(0, 3);

  return `
    <div class="mini-tracker">
      ${displayChallenges.map(c => {
        const progress = getChallengeProgress(c);
        const isComplete = c.status === 'completed';
        return `
          <div class="mini-challenge ${isComplete ? 'complete' : ''}">
            <span class="mini-icon">${TYPE_ICONS[c.type] || '📋'}</span>
            <div class="mini-progress" style="width: ${progress}%"></div>
            ${isComplete ? '<span class="claim-indicator">!</span>' : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Render purchase confirmation dialog
export function renderPurchaseConfirmation(itemKey, item) {
  return `
    <div class="purchase-confirmation">
      <h4>Confirm Purchase</h4>
      <p>Buy <strong>${escapeHtml(item.name)}</strong> for 🪙 ${item.cost} tokens?</p>
      <p class="item-desc">${escapeHtml(item.description)}</p>
      <div class="confirmation-buttons">
        <button class="confirm-btn" data-item="${escapeHtml(itemKey)}">Buy</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    </div>
  `;
}

// Render abandon confirmation dialog
export function renderAbandonConfirmation(challenge) {
  return `
    <div class="abandon-confirmation">
      <h4>Abandon Challenge?</h4>
      <p>Are you sure you want to abandon <strong>${escapeHtml(challenge.name)}</strong>?</p>
      <p class="warning">You will lose all progress and will not receive any rewards.</p>
      <div class="confirmation-buttons">
        <button class="confirm-abandon-btn" data-challenge-id="${escapeHtml(challenge.id)}">Abandon</button>
        <button class="cancel-btn">Keep</button>
      </div>
    </div>
  `;
}

// Export UI constants
export const CHALLENGE_STYLES = `
  .challenges-panel {
    font-family: sans-serif;
    max-width: 600px;
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    color: #eee;
  }

  .challenges-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .challenges-summary {
    display: flex;
    gap: 16px;
  }

  .streak-bonus {
    color: #ff9800;
    font-weight: bold;
  }

  .claimable-banner {
    background: linear-gradient(45deg, #4CAF50, #8BC34A);
    padding: 8px 16px;
    border-radius: 4px;
    text-align: center;
    margin-bottom: 12px;
    animation: pulse 2s infinite;
  }

  .expiring-warning {
    background: linear-gradient(45deg, #ff5722, #ff9800);
    padding: 8px 16px;
    border-radius: 4px;
    text-align: center;
    margin-bottom: 12px;
  }

  .challenge-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #2a2a4a;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: transform 0.2s;
  }

  .challenge-card:hover {
    transform: translateX(4px);
  }

  .challenge-card.completed {
    border-left: 4px solid #4CAF50;
  }

  .challenge-card.expiring-soon {
    border-left: 4px solid #ff9800;
  }

  .challenge-icon {
    font-size: 24px;
  }

  .challenge-info {
    flex: 1;
  }

  .challenge-progress-bar {
    height: 8px;
    background: #444;
    border-radius: 4px;
    position: relative;
    margin: 8px 0;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    border-radius: 4px;
    transition: width 0.3s;
  }

  .progress-text {
    position: absolute;
    right: 8px;
    top: -2px;
    font-size: 10px;
  }

  .challenge-time.urgent {
    color: #ff5722;
    font-weight: bold;
  }

  .claim-btn {
    background: linear-gradient(45deg, #4CAF50, #8BC34A);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-weight: bold;
  }

  .shop-item {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    background: #2a2a4a;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .shop-item.cannot-afford {
    opacity: 0.6;
  }
`;
