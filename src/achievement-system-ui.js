/**
 * Achievement System UI Components
 * Renders achievement panels, notifications, and progress displays
 */

import {
  ACHIEVEMENT_CATEGORY,
  ACHIEVEMENT_RARITY,
  ACHIEVEMENTS,
  getAchievementData,
  getAchievementProgress,
  isAchievementUnlocked,
  getAchievementDisplayName,
  getAchievementDisplayDescription,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementPoints,
  getCompletionPercentage,
  getAchievementsByCategory,
} from './achievement-system.js';

/**
 * Get CSS styles for achievement system
 * @returns {string} CSS styles
 */
export function getAchievementStyles() {
  return `
.achievement-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 10px;
  padding: 15px;
}

.achievement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.achievement-header h2 {
  margin: 0;
  font-size: 18px;
  color: #e8e8e8;
}

.achievement-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #888;
}

.achievement-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.achievement-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.achievement-tab {
  padding: 6px 12px;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(50, 50, 50, 0.3);
  color: #888;
  cursor: pointer;
  font-size: 11px;
  text-transform: capitalize;
  transition: all 0.2s ease;
}

.achievement-tab:hover {
  background: rgba(100, 100, 100, 0.3);
  color: #ccc;
}

.achievement-tab.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.achievement-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.achievement-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.achievement-card.unlocked {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.08);
}

.achievement-card.locked {
  opacity: 0.6;
}

.achievement-card.hidden {
  border-style: dashed;
}

.achievement-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.achievement-icon.common { background: rgba(150, 150, 150, 0.2); }
.achievement-icon.uncommon { background: rgba(100, 200, 100, 0.2); }
.achievement-icon.rare { background: rgba(100, 150, 255, 0.2); }
.achievement-icon.epic { background: rgba(200, 100, 255, 0.2); }
.achievement-icon.legendary { background: rgba(255, 200, 50, 0.2); }

.achievement-icon.unlocked {
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-size: 14px;
  font-weight: bold;
  color: #e8e8e8;
  margin-bottom: 2px;
}

.achievement-description {
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.achievement-rarity {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  text-transform: uppercase;
  margin-right: 6px;
}

.achievement-rarity.common { background: rgba(150, 150, 150, 0.3); color: #aaa; }
.achievement-rarity.uncommon { background: rgba(100, 200, 100, 0.3); color: #8f8; }
.achievement-rarity.rare { background: rgba(100, 150, 255, 0.3); color: #8af; }
.achievement-rarity.epic { background: rgba(200, 100, 255, 0.3); color: #c8f; }
.achievement-rarity.legendary { background: rgba(255, 200, 50, 0.3); color: #ffd700; }

.achievement-progress-bar {
  height: 4px;
  background: #333;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.achievement-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.3s ease;
}

.achievement-progress-fill.complete {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
}

.achievement-progress-text {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.achievement-points {
  font-size: 10px;
  color: #ffd700;
}

/* Achievement notification */
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
  border: 2px solid #ffd700;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  z-index: 1000;
  animation: achievement-pop 0.5s ease-out;
}

@keyframes achievement-pop {
  0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
  50% { transform: translateY(5px) scale(1.05); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.achievement-notification-header {
  font-size: 10px;
  color: #ffd700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.achievement-notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.achievement-notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 215, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.achievement-notification-info {
  flex: 1;
}

.achievement-notification-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.achievement-notification-desc {
  font-size: 11px;
  color: #aaa;
}

/* Completion display */
.completion-display {
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 15px;
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.completion-title {
  font-size: 14px;
  color: #e8e8e8;
}

.completion-percent {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.completion-bar {
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  transition: width 0.5s ease;
}

.completion-counts {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #888;
}

/* Recent achievements */
.recent-achievements {
  margin-top: 15px;
}

.recent-title {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.recent-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.recent-achievement {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: #ddd;
}

.recent-achievement-icon {
  font-size: 14px;
}
`;
}

/**
 * Render achievement panel
 * @param {Object} state - Achievement state
 * @param {string} activeCategory - Active category filter
 * @returns {string} HTML string
 */
export function renderAchievementPanel(state, activeCategory = 'all') {
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  const unlockedCount = state.unlocked.length;
  const completion = getCompletionPercentage(state);

  // Tab buttons
  const categories = ['all', ...Object.values(ACHIEVEMENT_CATEGORY)];
  const tabsHtml = categories.map(cat => 
    `<button class="achievement-tab ${cat === activeCategory ? 'active' : ''}" data-category="${escapeHtml(cat)}">${cat}</button>`
  ).join('');

  // Filter achievements
  let achievements;
  if (activeCategory === 'all') {
    achievements = Object.values(ACHIEVEMENTS);
  } else {
    achievements = getAchievementsByCategory(activeCategory);
  }

  // Sort: unlocked first, then by rarity
  achievements.sort((a, b) => {
    const aUnlocked = isAchievementUnlocked(state, a.id);
    const bUnlocked = isAchievementUnlocked(state, b.id);
    if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
    return 0;
  });

  const achievementsHtml = achievements.map(a => 
    renderAchievementCard(a, state)
  ).join('');

  return `
    <div class="achievement-panel">
      <div class="achievement-header">
        <h2>\uD83C\uDFC6 Achievements</h2>
        <div class="achievement-stats">
          <div class="achievement-stat">\uD83C\uDFC5 ${unlockedCount}/${totalAchievements}</div>
          <div class="achievement-stat">\u2B50 ${state.totalPoints} pts</div>
        </div>
      </div>
      ${renderCompletionDisplay(state)}
      <div class="achievement-tabs">
        ${tabsHtml}
      </div>
      <div class="achievement-grid">
        ${achievementsHtml}
      </div>
    </div>
  `.trim();
}

/**
 * Render achievement card
 * @param {Object} achievement - Achievement data
 * @param {Object} state - Achievement state
 * @returns {string} HTML string
 */
function renderAchievementCard(achievement, state) {
  const unlocked = isAchievementUnlocked(state, achievement.id);
  const progress = getAchievementProgress(state, achievement.id);
  const displayName = getAchievementDisplayName(achievement, unlocked);
  const displayDesc = getAchievementDisplayDescription(achievement, unlocked);
  const points = getAchievementPoints(achievement);

  const cardClass = [
    'achievement-card',
    unlocked ? 'unlocked' : 'locked',
    achievement.hidden && !unlocked ? 'hidden' : '',
  ].filter(Boolean).join(' ');

  const iconClass = `achievement-icon ${achievement.rarity} ${unlocked ? 'unlocked' : ''}`;

  let progressHtml = '';
  if (!unlocked && progress.target > 1) {
    progressHtml = `
      <div class="achievement-progress-bar">
        <div class="achievement-progress-fill ${progress.complete ? 'complete' : ''}" style="width: ${progress.percent}%"></div>
      </div>
      <div class="achievement-progress-text">${progress.current} / ${progress.target}</div>
    `;
  }

  return `
    <div class="${cardClass}" data-achievement="${escapeHtml(achievement.id)}">
      <div class="${iconClass}">${escapeHtml(achievement.icon)}</div>
      <div class="achievement-info">
        <div class="achievement-name">${escapeHtml(displayName)}</div>
        <div class="achievement-description">${escapeHtml(displayDesc)}</div>
        <span class="achievement-rarity ${achievement.rarity}">${achievement.rarity}</span>
        <span class="achievement-points">${points} pts</span>
        ${progressHtml}
      </div>
    </div>
  `;
}

/**
 * Render completion display
 * @param {Object} state - Achievement state
 * @returns {string} HTML string
 */
export function renderCompletionDisplay(state) {
  const total = Object.keys(ACHIEVEMENTS).length;
  const unlocked = state.unlocked.length;
  const percent = getCompletionPercentage(state);

  return `
    <div class="completion-display">
      <div class="completion-header">
        <span class="completion-title">Completion</span>
        <span class="completion-percent">${percent}%</span>
      </div>
      <div class="completion-bar">
        <div class="completion-fill" style="width: ${percent}%"></div>
      </div>
      <div class="completion-counts">
        <span>${unlocked} unlocked</span>
        <span>${total - unlocked} remaining</span>
      </div>
    </div>
  `.trim();
}

/**
 * Render achievement notification
 * @param {Object} achievement - Achievement data
 * @returns {string} HTML string
 */
export function renderAchievementNotification(achievement) {
  const points = getAchievementPoints(achievement);
  const displayName = achievement.unlockedName || achievement.name;
  const displayDesc = achievement.unlockedDescription || achievement.description;

  return `
    <div class="achievement-notification">
      <div class="achievement-notification-header">\uD83C\uDFC6 Achievement Unlocked!</div>
      <div class="achievement-notification-content">
        <div class="achievement-notification-icon">${escapeHtml(achievement.icon)}</div>
        <div class="achievement-notification-info">
          <div class="achievement-notification-name">${escapeHtml(displayName)}</div>
          <div class="achievement-notification-desc">${escapeHtml(displayDesc)}</div>
        </div>
        <div class="achievement-points">+${points} pts</div>
      </div>
    </div>
  `.trim();
}

/**
 * Render recent achievements
 * @param {Object} state - Achievement state
 * @param {number} limit - Max achievements to show
 * @returns {string} HTML string
 */
export function renderRecentAchievements(state, limit = 5) {
  const recent = state.unlocked.slice(-limit).reverse();
  
  if (recent.length === 0) {
    return '';
  }

  const recentHtml = recent.map(id => {
    const achievement = getAchievementData(id);
    if (!achievement) return '';
    const name = achievement.unlockedName || achievement.name;
    return `
      <div class="recent-achievement">
        <span class="recent-achievement-icon">${escapeHtml(achievement.icon)}</span>
        <span>${escapeHtml(name)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="recent-achievements">
      <div class="recent-title">Recent Achievements</div>
      <div class="recent-list">
        ${recentHtml}
      </div>
    </div>
  `.trim();
}

/**
 * Render achievement summary (for HUD)
 * @param {Object} state - Achievement state
 * @returns {string} HTML string
 */
export function renderAchievementSummary(state) {
  const total = Object.keys(ACHIEVEMENTS).length;
  const unlocked = state.unlocked.length;
  const percent = getCompletionPercentage(state);

  return `
    <div class="achievement-summary">
      <span class="summary-icon">\uD83C\uDFC6</span>
      <span class="summary-count">${unlocked}/${total}</span>
      <span class="summary-percent">(${percent}%)</span>
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
