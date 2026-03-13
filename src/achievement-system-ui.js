/**
 * Achievement System UI
 * Rendering functions for achievement interface
 */

import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_TYPES,
  getAchievementsByCategory,
  getUnlockedAchievements,
  getLockedAchievements,
  getRecentUnlocks,
  getAchievementStats,
  getProgress,
  getCategorySummary,
  getAllCategorySummaries,
  getTotalPoints
} from './achievement-system.js';

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
 * Format date
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Render achievement card
 */
export function renderAchievementCard(achievement, progress = null) {
  if (!achievement) return '';

  const category = ACHIEVEMENT_CATEGORIES[achievement.category?.toUpperCase()];
  const tier = ACHIEVEMENT_TIERS[achievement.tier?.toUpperCase()];
  const isUnlocked = achievement.unlocked || false;
  const isHidden = achievement.hidden && !isUnlocked;

  const progressPercent = progress?.percentage || 0;
  const currentProgress = progress?.current || 0;
  const target = achievement.target || 1;

  return `
    <div class="achievement-card ${tier?.id || 'bronze'} ${isUnlocked ? 'unlocked' : 'locked'} ${isHidden ? 'hidden' : ''}"
         data-achievement-id="${escapeHtml(achievement.id)}">
      <div class="achievement-icon">
        ${isHidden ? '&#10067;' : (category?.icon || '&#11088;')}
      </div>
      <div class="achievement-content">
        <div class="achievement-header">
          <h4 class="achievement-name">${isHidden ? '???' : escapeHtml(achievement.name)}</h4>
          <span class="achievement-tier tier-${tier?.id || 'bronze'}">${escapeHtml(tier?.name || 'Bronze')}</span>
        </div>
        <p class="achievement-description">
          ${isHidden ? 'Hidden achievement' : escapeHtml(achievement.description)}
        </p>
        ${!isUnlocked && achievement.type === 'counter' ? `
          <div class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-text">${currentProgress}/${target}</span>
          </div>
        ` : ''}
        ${isUnlocked && achievement.unlockedAt ? `
          <div class="unlocked-date">Unlocked: ${formatDate(achievement.unlockedAt)}</div>
        ` : ''}
      </div>
      ${isUnlocked ? '<div class="achievement-check">&#10004;</div>' : ''}
    </div>
  `;
}

/**
 * Render achievement list
 */
export function renderAchievementList(state, options = {}) {
  const { category, showLocked = true, showHidden = false } = options;

  const achievements = category
    ? getAchievementsByCategory(state, category)
    : [...getUnlockedAchievements(state), ...(showLocked ? getLockedAchievements(state, showHidden) : [])];

  if (achievements.length === 0) {
    return '<div class="achievement-list empty">No achievements found</div>';
  }

  return `
    <div class="achievement-list">
      ${achievements.map(ach => {
        const progress = getProgress(state, ach.id);
        return renderAchievementCard(ach, progress);
      }).join('')}
    </div>
  `;
}

/**
 * Render category tabs
 */
export function renderCategoryTabs(activeCategory = null) {
  return `
    <div class="category-tabs">
      <button class="category-tab ${!activeCategory ? 'active' : ''}" data-category="">
        All
      </button>
      ${Object.values(ACHIEVEMENT_CATEGORIES).map(cat => `
        <button class="category-tab ${activeCategory === cat.id ? 'active' : ''}" data-category="${escapeHtml(cat.id)}">
          ${cat.icon} ${escapeHtml(cat.name)}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render category summary
 */
export function renderCategorySummary(state, category) {
  const summary = getCategorySummary(state, category);
  const categoryInfo = ACHIEVEMENT_CATEGORIES[category.toUpperCase()];

  return `
    <div class="category-summary" data-category="${escapeHtml(category)}">
      <div class="category-icon">${categoryInfo?.icon || '&#11088;'}</div>
      <div class="category-info">
        <span class="category-name">${escapeHtml(categoryInfo?.name || category)}</span>
        <span class="category-progress">${summary.unlocked}/${summary.total}</span>
      </div>
      <div class="category-bar">
        <div class="bar-fill" style="width: ${summary.percentage}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render all category summaries
 */
export function renderAllCategorySummaries(state) {
  const summaries = getAllCategorySummaries(state);

  return `
    <div class="category-summaries">
      <h4>Categories</h4>
      ${summaries.map(s => renderCategorySummary(state, s.category)).join('')}
    </div>
  `;
}

/**
 * Render achievement stats
 */
export function renderAchievementStats(state) {
  const stats = getAchievementStats(state);

  return `
    <div class="achievement-stats">
      <h4>Achievement Statistics</h4>
      <div class="stats-overview">
        <div class="stat-big">
          <span class="stat-value">${stats.totalUnlocked}</span>
          <span class="stat-label">Unlocked</span>
        </div>
        <div class="stat-big">
          <span class="stat-value">${stats.points}</span>
          <span class="stat-label">Points</span>
        </div>
        <div class="stat-big">
          <span class="stat-value">${stats.completionPercentage}%</span>
          <span class="stat-label">Complete</span>
        </div>
      </div>
      <div class="tier-counts">
        <span class="tier tier-diamond">&#128142; ${stats.diamondCount}</span>
        <span class="tier tier-platinum">&#128171; ${stats.platinumCount}</span>
        <span class="tier tier-gold">&#127942; ${stats.goldCount}</span>
        <span class="tier tier-silver">&#129351; ${stats.silverCount}</span>
        <span class="tier tier-bronze">&#129352; ${stats.bronzeCount}</span>
      </div>
    </div>
  `;
}

/**
 * Render recent unlocks
 */
export function renderRecentUnlocks(state, count = 5) {
  const recent = getRecentUnlocks(state, count);

  if (recent.length === 0) {
    return '<div class="recent-unlocks empty">No recent unlocks</div>';
  }

  return `
    <div class="recent-unlocks">
      <h4>Recent Unlocks</h4>
      <div class="unlock-list">
        ${recent.map(ach => `
          <div class="recent-unlock">
            <span class="unlock-name">${escapeHtml(ach.name)}</span>
            <span class="unlock-date">${formatDate(ach.unlockedAt)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render unlock notification
 */
export function renderUnlockNotification(achievement) {
  if (!achievement) return '';

  const tier = ACHIEVEMENT_TIERS[achievement.tier?.toUpperCase()];

  return `
    <div class="achievement-notification tier-${tier?.id || 'bronze'}">
      <div class="notification-header">
        &#127942; Achievement Unlocked!
      </div>
      <div class="notification-content">
        <div class="achievement-icon">${ACHIEVEMENT_CATEGORIES[achievement.category?.toUpperCase()]?.icon || '&#11088;'}</div>
        <div class="achievement-info">
          <span class="achievement-name">${escapeHtml(achievement.name)}</span>
          <span class="achievement-tier">${escapeHtml(tier?.name || 'Bronze')} - ${tier?.points || 10} points</span>
        </div>
      </div>
      ${achievement.rewards && achievement.rewards.length > 0 ? `
        <div class="notification-rewards">
          Rewards: ${achievement.rewards.map(r => escapeHtml(r.name || r.type)).join(', ')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render points display
 */
export function renderPointsDisplay(state) {
  const points = getTotalPoints(state);

  return `
    <div class="points-display">
      <span class="points-icon">&#127942;</span>
      <span class="points-value">${points}</span>
      <span class="points-label">Achievement Points</span>
    </div>
  `;
}

/**
 * Render tier filter
 */
export function renderTierFilter(selectedTier) {
  return `
    <div class="tier-filter">
      <select name="tier-filter">
        <option value="">All Tiers</option>
        ${Object.values(ACHIEVEMENT_TIERS).map(tier => `
          <option value="${escapeHtml(tier.id)}" ${selectedTier === tier.id ? 'selected' : ''}>
            ${escapeHtml(tier.name)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render progress bar
 */
export function renderProgressBar(current, target, showText = true) {
  const percentage = target > 0 ? Math.min(100, Math.floor((current / target) * 100)) : 0;

  return `
    <div class="achievement-progress-bar">
      <div class="progress-track">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      ${showText ? `<span class="progress-text">${current}/${target} (${percentage}%)</span>` : ''}
    </div>
  `;
}

/**
 * Render completion overview
 */
export function renderCompletionOverview(state) {
  const stats = getAchievementStats(state);

  return `
    <div class="completion-overview">
      <div class="completion-circle">
        <svg viewBox="0 0 36 36">
          <path class="circle-bg" d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"></path>
          <path class="circle-fill" stroke-dasharray="${stats.completionPercentage}, 100" d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"></path>
        </svg>
        <span class="completion-text">${stats.completionPercentage}%</span>
      </div>
      <div class="completion-details">
        <span class="unlocked">${stats.totalUnlocked} Unlocked</span>
        <span class="total">of ${stats.totalDefined} Total</span>
      </div>
    </div>
  `;
}

/**
 * Render achievement details panel
 */
export function renderAchievementDetails(achievement, progress = null) {
  if (!achievement) {
    return '<div class="achievement-details empty">Select an achievement to view details</div>';
  }

  const category = ACHIEVEMENT_CATEGORIES[achievement.category?.toUpperCase()];
  const tier = ACHIEVEMENT_TIERS[achievement.tier?.toUpperCase()];
  const type = ACHIEVEMENT_TYPES[achievement.type?.toUpperCase()];
  const isUnlocked = achievement.unlocked || false;

  return `
    <div class="achievement-details ${isUnlocked ? 'unlocked' : 'locked'}">
      <div class="details-header tier-${tier?.id || 'bronze'}">
        <div class="header-icon">${category?.icon || '&#11088;'}</div>
        <div class="header-info">
          <h3>${escapeHtml(achievement.name)}</h3>
          <span class="header-tier">${escapeHtml(tier?.name || 'Bronze')} Achievement</span>
        </div>
      </div>
      <div class="details-body">
        <p class="description">${escapeHtml(achievement.description)}</p>
        <div class="details-meta">
          <div class="meta-item">
            <span class="meta-label">Category:</span>
            <span class="meta-value">${escapeHtml(category?.name || achievement.category)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Type:</span>
            <span class="meta-value">${escapeHtml(type?.name || achievement.type)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Points:</span>
            <span class="meta-value">${tier?.points || 10}</span>
          </div>
        </div>
        ${progress && !isUnlocked ? `
          <div class="details-progress">
            <h4>Progress</h4>
            ${renderProgressBar(progress.current, achievement.target)}
          </div>
        ` : ''}
        ${isUnlocked && achievement.unlockedAt ? `
          <div class="unlock-info">
            <span class="unlock-icon">&#10004;</span>
            Unlocked on ${formatDate(achievement.unlockedAt)}
          </div>
        ` : ''}
        ${achievement.rewards && achievement.rewards.length > 0 ? `
          <div class="details-rewards">
            <h4>Rewards</h4>
            <ul>
              ${achievement.rewards.map(r => `
                <li>${escapeHtml(r.name || r.type)}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
