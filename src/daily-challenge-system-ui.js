/**
 * Daily Challenge System UI Components
 * Renders challenge panels, cards, and notifications
 */

import {
  CHALLENGE_TYPE,
  CHALLENGE_DIFFICULTY,
  getAllChallenges,
  getActiveChallenges,
  getCompletedChallenges,
  getClaimableChallenges,
  getChallengeProgress,
  getStreakBonus,
  getDailyCompletionPercentage,
  getTimeUntilReset,
} from './daily-challenge-system.js';

/**
 * Get CSS styles for daily challenge system
 * @returns {string} CSS styles
 */
export function getDailyChallengeStyles() {
  return `
.daily-challenge-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 10px;
  padding: 15px;
}

.daily-challenge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.daily-challenge-header h2 {
  margin: 0;
  font-size: 18px;
  color: #e8e8e8;
}

.daily-challenge-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
}

.daily-challenge-timer-icon {
  font-size: 14px;
}

.daily-challenge-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.daily-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 12px;
}

.daily-stat-icon {
  font-size: 16px;
}

.daily-stat-label {
  color: #888;
}

.daily-stat-value {
  color: #e8e8e8;
  font-weight: bold;
}

.streak-stat {
  border: 1px solid #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.streak-stat .daily-stat-value {
  color: #ffd700;
}

.daily-challenge-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.challenge-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.challenge-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.challenge-card.completed {
  border-color: #4a8;
  background: rgba(74, 170, 136, 0.1);
}

.challenge-card.claimed {
  opacity: 0.6;
}

.challenge-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.challenge-icon.combat { background: rgba(255, 100, 100, 0.2); }
.challenge-icon.exploration { background: rgba(100, 200, 255, 0.2); }
.challenge-icon.collection { background: rgba(255, 200, 100, 0.2); }
.challenge-icon.social { background: rgba(200, 100, 255, 0.2); }
.challenge-icon.mixed { background: rgba(150, 150, 150, 0.2); }

.challenge-icon.completed {
  background: rgba(74, 170, 136, 0.3);
}

.challenge-content {
  flex: 1;
  min-width: 0;
}

.challenge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.challenge-name {
  font-size: 14px;
  font-weight: bold;
  color: #e8e8e8;
}

.challenge-difficulty {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  text-transform: uppercase;
}

.challenge-difficulty.easy { background: rgba(100, 200, 100, 0.3); color: #8f8; }
.challenge-difficulty.medium { background: rgba(255, 200, 100, 0.3); color: #fc8; }
.challenge-difficulty.hard { background: rgba(255, 100, 100, 0.3); color: #f88; }
.challenge-difficulty.expert { background: rgba(200, 100, 255, 0.3); color: #c8f; }

.challenge-description {
  font-size: 11px;
  color: #888;
  margin-bottom: 8px;
}

.challenge-progress-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.challenge-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.3s ease;
}

.challenge-progress-fill.complete {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
}

.challenge-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.challenge-progress-text {
  font-size: 10px;
  color: #666;
}

.challenge-rewards {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.challenge-reward {
  display: flex;
  align-items: center;
  gap: 3px;
}

.challenge-reward-xp { color: #8af; }
.challenge-reward-gold { color: #ffd700; }
.challenge-reward-item { color: #c8f; }

.claim-button {
  padding: 4px 10px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.claim-button:hover {
  transform: scale(1.05);
}

.claim-button:disabled {
  background: #555;
  color: #888;
  cursor: not-allowed;
  transform: none;
}

/* Challenge notification */
.challenge-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #2a4a2e 0%, #1a2a1e 100%);
  border: 2px solid #4a8;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(74, 170, 136, 0.3);
  z-index: 1000;
  animation: challenge-complete 0.5s ease-out;
}

@keyframes challenge-complete {
  0% { transform: translateX(100px); opacity: 0; }
  50% { transform: translateX(-10px); }
  100% { transform: translateX(0); opacity: 1; }
}

.challenge-notification-header {
  font-size: 10px;
  color: #4a8;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.challenge-notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.challenge-notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(74, 170, 136, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.challenge-notification-info {
  flex: 1;
}

.challenge-notification-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.challenge-notification-reward {
  font-size: 11px;
  color: #aaa;
}

/* Streak display */
.streak-display {
  padding: 12px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.streak-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.streak-icon {
  font-size: 24px;
}

.streak-text {
  display: flex;
  flex-direction: column;
}

.streak-count {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.streak-label {
  font-size: 10px;
  color: #888;
}

.streak-bonus {
  padding: 4px 8px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: #ffd700;
}

/* Completion summary */
.completion-summary {
  padding: 10px;
  background: rgba(74, 170, 136, 0.1);
  border-radius: 6px;
  margin-bottom: 15px;
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.completion-title {
  font-size: 12px;
  color: #888;
}

.completion-percent {
  font-size: 14px;
  font-weight: bold;
  color: #4a8;
}

.completion-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.5s ease;
}

/* Mini challenge HUD */
.challenge-hud {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  font-size: 10px;
}

.challenge-hud-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.challenge-hud-icon {
  font-size: 12px;
}

.challenge-hud-progress {
  flex: 1;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}

.challenge-hud-fill {
  height: 100%;
  background: #4a8;
}

.challenge-hud-text {
  color: #888;
  min-width: 40px;
  text-align: right;
}

.daily-challenge-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1200;
}

.daily-challenge-modal {
  width: min(860px, 95vw);
  max-height: 88vh;
  overflow-y: auto;
}

.daily-challenge-modal-close {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
`;
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
 * Render daily challenge panel
 * @param {Object} state - Challenge state
 * @returns {string} HTML string
 */
export function renderDailyChallengePanel(state) {
  const challenges = getAllChallenges(state);
  const completionPercent = getDailyCompletionPercentage(state);
  const timeUntilReset = getTimeUntilReset();
  const streakBonus = getStreakBonus(state.streak);

  const challengesHtml = challenges.map(c => renderChallengeCard(c, state.streak)).join('');

  return `
    <div class="daily-challenge-panel">
      <div class="daily-challenge-header">
        <h2>\uD83D\uDCC5 Daily Challenges</h2>
        <div class="daily-challenge-timer">
          <span class="daily-challenge-timer-icon">\u23F1\uFE0F</span>
          <span>Resets in ${timeUntilReset.hours}h ${timeUntilReset.minutes}m</span>
        </div>
      </div>
      ${renderStreakDisplay(state.streak, streakBonus)}
      ${renderCompletionSummary(state, completionPercent)}
      <div class="daily-challenge-list">
        ${challengesHtml}
      </div>
    </div>
  `.trim();
}

/**
 * Render streak display
 * @param {number} streak - Current streak
 * @param {number} bonus - Streak bonus percentage
 * @returns {string} HTML string
 */
export function renderStreakDisplay(streak, bonus) {
  if (streak === 0) {
    return `
      <div class="streak-display" style="border-color: #555; background: rgba(100, 100, 100, 0.1);">
        <div class="streak-info">
          <span class="streak-icon">\uD83D\uDD25</span>
          <div class="streak-text">
            <span class="streak-count" style="color: #888;">No Streak</span>
            <span class="streak-label">Complete challenges to start!</span>
          </div>
        </div>
      </div>
    `.trim();
  }

  const bonusText = bonus > 0 ? `+${Math.floor(bonus * 100)}% Bonus` : '';

  return `
    <div class="streak-display">
      <div class="streak-info">
        <span class="streak-icon">\uD83D\uDD25</span>
        <div class="streak-text">
          <span class="streak-count">${streak} Day Streak</span>
          <span class="streak-label">Keep it up!</span>
        </div>
      </div>
      ${bonusText ? `<span class="streak-bonus">${bonusText}</span>` : ''}
    </div>
  `.trim();
}

/**
 * Render completion summary
 * @param {Object} state - Challenge state
 * @param {number} percent - Completion percentage
 * @returns {string} HTML string
 */
export function renderCompletionSummary(state, percent) {
  const total = state.currentChallenges.length;
  const completed = state.currentChallenges.filter(c => c.completed).length;

  return `
    <div class="completion-summary">
      <div class="completion-header">
        <span class="completion-title">Daily Progress</span>
        <span class="completion-percent">${completed}/${total} (${percent}%)</span>
      </div>
      <div class="completion-bar">
        <div class="completion-fill" style="width: ${percent}%"></div>
      </div>
    </div>
  `.trim();
}

/**
 * Render challenge card
 * @param {Object} challenge - Challenge object
 * @param {number} streak - Current streak for bonus calculation
 * @returns {string} HTML string
 */
export function renderChallengeCard(challenge, streak = 0) {
  const progress = getChallengeProgress(challenge);
  const streakBonus = getStreakBonus(streak);

  const cardClass = [
    'challenge-card',
    challenge.completed ? 'completed' : '',
    challenge.claimed ? 'claimed' : '',
  ].filter(Boolean).join(' ');

  const iconClass = `challenge-icon ${challenge.type} ${challenge.completed ? 'completed' : ''}`;
  const progressClass = `challenge-progress-fill ${challenge.completed ? 'complete' : ''}`;

  let rewardsHtml = `
    <span class="challenge-reward challenge-reward-xp">\u2728 ${challenge.rewards.xp} XP</span>
    <span class="challenge-reward challenge-reward-gold">\uD83D\uDCB0 ${challenge.rewards.gold}g</span>
  `;

  if (challenge.rewards.items && challenge.rewards.items.length > 0) {
    rewardsHtml += `<span class="challenge-reward challenge-reward-item">\uD83C\uDF81 +item</span>`;
  }

  if (streakBonus > 0 && !challenge.claimed) {
    rewardsHtml += `<span class="challenge-reward" style="color: #ffd700;">+${Math.floor(streakBonus * 100)}%</span>`;
  }

  let actionHtml = '';
  if (challenge.completed && !challenge.claimed) {
    actionHtml = `<button class="claim-button" data-challenge="${escapeHtml(challenge.id)}">Claim</button>`;
  } else if (challenge.claimed) {
    actionHtml = `<span style="color: #4a8; font-size: 10px;">\u2714 Claimed</span>`;
  }

  return `
    <div class="${cardClass}" data-challenge-id="${escapeHtml(challenge.id)}">
      <div class="${iconClass}">${escapeHtml(challenge.icon)}</div>
      <div class="challenge-content">
        <div class="challenge-header">
          <span class="challenge-name">${escapeHtml(challenge.name)}</span>
          <span class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty}</span>
        </div>
        <div class="challenge-description">${escapeHtml(challenge.description)}</div>
        <div class="challenge-progress-bar">
          <div class="${progressClass}" style="width: ${progress}%"></div>
        </div>
        <div class="challenge-footer">
          <span class="challenge-progress-text">${challenge.current}/${challenge.target}</span>
          <div class="challenge-rewards">
            ${rewardsHtml}
          </div>
          ${actionHtml}
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Render challenge completed notification
 * @param {Object} challenge - Completed challenge
 * @param {Object} rewards - Rewards received
 * @returns {string} HTML string
 */
export function renderChallengeNotification(challenge, rewards = null) {
  const displayRewards = rewards || challenge.rewards;
  let rewardText = `+${displayRewards.xp} XP, +${displayRewards.gold} gold`;
  if (displayRewards.streakBonus && displayRewards.streakBonus > 0) {
    rewardText += ` (${Math.floor(displayRewards.streakBonus * 100)}% streak bonus!)`;
  }

  return `
    <div class="challenge-notification">
      <div class="challenge-notification-header">\u2705 Challenge Complete!</div>
      <div class="challenge-notification-content">
        <div class="challenge-notification-icon">${escapeHtml(challenge.icon)}</div>
        <div class="challenge-notification-info">
          <div class="challenge-notification-name">${escapeHtml(challenge.name)}</div>
          <div class="challenge-notification-reward">${rewardText}</div>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Render challenge HUD (mini display)
 * @param {Object} state - Challenge state
 * @param {number} limit - Max challenges to show
 * @returns {string} HTML string
 */
export function renderChallengeHud(state, limit = 3) {
  const active = getActiveChallenges(state).slice(0, limit);

  if (active.length === 0) {
    const claimable = getClaimableChallenges(state);
    if (claimable.length > 0) {
      return `
        <div class="challenge-hud">
          <div class="challenge-hud-item" style="color: #ffd700;">
            <span class="challenge-hud-icon">\uD83C\uDF81</span>
            <span>${claimable.length} reward${claimable.length > 1 ? 's' : ''} to claim!</span>
          </div>
        </div>
      `.trim();
    }
    return `
      <div class="challenge-hud">
        <div class="challenge-hud-item" style="color: #4a8;">
          <span class="challenge-hud-icon">\u2714</span>
          <span>All challenges complete!</span>
        </div>
      </div>
    `.trim();
  }

  const hudItems = active.map(c => {
    const progress = getChallengeProgress(c);
    return `
      <div class="challenge-hud-item">
        <span class="challenge-hud-icon">${escapeHtml(c.icon)}</span>
        <div class="challenge-hud-progress">
          <div class="challenge-hud-fill" style="width: ${progress}%"></div>
        </div>
        <span class="challenge-hud-text">${c.current}/${c.target}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="challenge-hud">
      ${hudItems}
    </div>
  `.trim();
}

/**
 * Render daily stats summary
 * @param {Object} state - Challenge state
 * @returns {string} HTML string
 */
export function renderDailyStats(state) {
  const completed = state.currentChallenges.filter(c => c.completed).length;
  const total = state.currentChallenges.length;
  const streakBonus = getStreakBonus(state.streak);

  return `
    <div class="daily-challenge-stats">
      <div class="daily-stat">
        <span class="daily-stat-icon">\uD83D\uDCCA</span>
        <span class="daily-stat-label">Today:</span>
        <span class="daily-stat-value">${completed}/${total}</span>
      </div>
      <div class="daily-stat streak-stat">
        <span class="daily-stat-icon">\uD83D\uDD25</span>
        <span class="daily-stat-label">Streak:</span>
        <span class="daily-stat-value">${state.streak}</span>
      </div>
      ${streakBonus > 0 ? `
        <div class="daily-stat">
          <span class="daily-stat-icon">\u2B50</span>
          <span class="daily-stat-label">Bonus:</span>
          <span class="daily-stat-value" style="color: #ffd700;">+${Math.floor(streakBonus * 100)}%</span>
        </div>
      ` : ''}
      <div class="daily-stat">
        <span class="daily-stat-icon">\uD83C\uDFC6</span>
        <span class="daily-stat-label">Total:</span>
        <span class="daily-stat-value">${state.totalChallengesCompleted}</span>
      </div>
    </div>
  `.trim();
}

/**
 * Render all challenges complete message
 * @param {Object} state - Challenge state
 * @returns {string} HTML string
 */
export function renderAllCompleteMessage(state) {
  const timeUntilReset = getTimeUntilReset();

  return `
    <div class="all-complete-message" style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">\uD83C\uDF89</div>
      <div style="font-size: 16px; font-weight: bold; color: #4a8; margin-bottom: 5px;">
        All Challenges Complete!
      </div>
      <div style="font-size: 12px; color: #888;">
        New challenges in ${timeUntilReset.hours}h ${timeUntilReset.minutes}m
      </div>
      ${state.streak > 0 ? `
        <div style="margin-top: 10px; font-size: 11px; color: #ffd700;">
          \uD83D\uDD25 ${state.streak} day streak!
        </div>
      ` : ''}
    </div>
  `.trim();
}

/**
 * Render daily challenge modal UI into the document.
 * @param {Object} gameState - Full game state
 * @param {Function} dispatch - Game dispatcher
 */
export function renderDailyChallengesUI(gameState, dispatch) {
  if (typeof document === 'undefined') return;

  if (!document.getElementById('daily-challenge-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'daily-challenge-styles';
    styleEl.textContent = getDailyChallengeStyles();
    document.head.appendChild(styleEl);
  }

  let root = document.getElementById('daily-challenge-ui-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'daily-challenge-ui-root';
    document.body.appendChild(root);
  }

  const challengeState = gameState?.dailyChallengeState;
  const isOpen = Boolean(gameState?.showDailyChallenges);
  if (!challengeState || !isOpen) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <div class="daily-challenge-overlay">
      <div class="daily-challenge-modal">
        <div class="daily-challenge-modal-close">
          <button id="btnCloseDailyChallenges">Close</button>
        </div>
        ${renderDailyChallengePanel(challengeState)}
      </div>
    </div>
  `.trim();

  const closeBtn = document.getElementById('btnCloseDailyChallenges');
  if (closeBtn) {
    closeBtn.onclick = () => dispatch({ type: 'CLOSE_DAILY_CHALLENGES' });
  }

  root.querySelectorAll('.claim-button').forEach((btn) => {
    btn.onclick = () => dispatch({
      type: 'CLAIM_DAILY_CHALLENGE',
      challengeId: btn.dataset.challenge,
    });
  });
}
