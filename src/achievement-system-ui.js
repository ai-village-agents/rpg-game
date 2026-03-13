/**
 * Achievement System UI Components
 * UI for achievements, badges, and progress tracking
 */

import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
  getAchievementDetails,
  getCompletionStats,
  getUnlockedAchievements,
  getLockedAchievements,
  getRecentUnlocks,
  getPlayerRank,
  getPointsToNextTier,
  getShowcase
} from './achievement-system.js';

// HTML escape helper
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render achievement card
export function renderAchievementCard(state, registry, achievementId) {
  const details = getAchievementDetails(state, registry, achievementId);
  if (!details) return '';

  const tierColor = details.tierInfo?.color || '#888';
  const categoryIcon = details.categoryInfo?.icon || '🏆';
  const isLocked = !details.isUnlocked;

  let progressBar = '';
  if (isLocked && details.requirements?.count > 1) {
    progressBar = `
      <div class="achievement-progress">
        <div class="achievement-progress-bar">
          <div class="achievement-progress-fill" style="width: ${details.percentComplete}%"></div>
        </div>
        <span class="achievement-progress-text">${details.progress.current}/${details.progress.target}</span>
      </div>
    `;
  }

  return `
    <div class="achievement-card ${isLocked ? 'achievement-locked' : 'achievement-unlocked'}" data-achievement-id="${escapeHtml(details.id)}">
      <div class="achievement-icon" style="border-color: ${tierColor}">
        ${categoryIcon}
      </div>
      <div class="achievement-content">
        <div class="achievement-header">
          <h4 class="achievement-name">${details.isSecret && isLocked ? '???' : escapeHtml(details.name)}</h4>
          <span class="achievement-tier" style="color: ${tierColor}">${escapeHtml(details.tierInfo?.name || '')}</span>
        </div>
        <p class="achievement-description">${details.isSecret && isLocked ? 'Secret achievement' : escapeHtml(details.description)}</p>
        ${progressBar}
        ${details.isUnlocked ? `<span class="achievement-unlocked-date">Unlocked ${formatDate(details.unlockedAt)}</span>` : ''}
      </div>
      <div class="achievement-points">
        <span class="points-value">${details.tierInfo?.points || 0}</span>
        <span class="points-label">pts</span>
      </div>
    </div>
  `;
}

// Format date helper
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

// Render achievement list
export function renderAchievementList(state, registry, filter = 'all') {
  let achievements = [];

  if (filter === 'unlocked') {
    achievements = getUnlockedAchievements(state, registry);
  } else if (filter === 'locked') {
    achievements = getLockedAchievements(state, registry);
  } else {
    achievements = Object.values(registry.achievements);
  }

  if (achievements.length === 0) {
    return '<p class="no-achievements">No achievements found</p>';
  }

  return `
    <div class="achievement-list">
      ${achievements.map(a => renderAchievementCard(state, registry, a.id)).join('')}
    </div>
  `;
}

// Render category tabs
export function renderCategoryTabs(activeCategory = 'all') {
  const categories = [
    { key: 'all', name: 'All', icon: '📋' },
    ...Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, cat]) => ({
      key,
      name: cat.name,
      icon: cat.icon
    }))
  ];

  return `
    <div class="achievement-category-tabs">
      ${categories.map(cat => `
        <button class="category-tab ${activeCategory === cat.key ? 'active' : ''}" data-category="${escapeHtml(cat.key)}">
          <span class="tab-icon">${cat.icon}</span>
          <span class="tab-name">${escapeHtml(cat.name)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

// Render progress overview
export function renderProgressOverview(state, registry) {
  const stats = getCompletionStats(state, registry);
  const rank = getPlayerRank(state.totalPoints);
  const nextTier = getPointsToNextTier(state.totalPoints);

  return `
    <div class="achievement-overview">
      <div class="overview-header">
        <div class="player-rank" style="border-color: ${rank.color}">
          <span class="rank-name" style="color: ${rank.color}">${escapeHtml(rank.rank)}</span>
          <span class="total-points">${stats.points} Points</span>
        </div>
        <div class="completion-circle">
          <svg viewBox="0 0 36 36">
            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
            <path class="circle-progress" stroke-dasharray="${stats.percent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
          </svg>
          <span class="circle-text">${stats.percent}%</span>
        </div>
      </div>

      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-value">${stats.unlocked}</span>
          <span class="stat-label">Unlocked</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.total}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.secretsFound}/${stats.secretsTotal}</span>
          <span class="stat-label">Secrets</span>
        </div>
      </div>

      ${nextTier.nextTier ? `
        <div class="next-tier-progress">
          <span class="next-tier-label">Next: ${escapeHtml(nextTier.nextTier)}</span>
          <div class="tier-progress-bar">
            <div class="tier-progress-fill" style="width: ${Math.round((nextTier.currentPoints / nextTier.pointsNeeded) * 100)}%"></div>
          </div>
          <span class="tier-progress-text">${nextTier.remaining} points to go</span>
        </div>
      ` : '<div class="max-rank">Maximum rank achieved!</div>'}
    </div>
  `;
}

// Render tier breakdown
export function renderTierBreakdown(state, registry) {
  const stats = getCompletionStats(state, registry);

  const tierRows = Object.entries(ACHIEVEMENT_TIERS).map(([key, tier]) => {
    const tierStats = stats.byTier[key] || { total: 0, unlocked: 0, percent: 0 };
    return `
      <div class="tier-row">
        <span class="tier-name" style="color: ${tier.color}">${escapeHtml(tier.name)}</span>
        <div class="tier-bar">
          <div class="tier-bar-fill" style="width: ${tierStats.percent}%; background-color: ${tier.color}"></div>
        </div>
        <span class="tier-count">${tierStats.unlocked}/${tierStats.total}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="tier-breakdown">
      <h3>By Tier</h3>
      ${tierRows}
    </div>
  `;
}

// Render category breakdown
export function renderCategoryBreakdown(state, registry) {
  const stats = getCompletionStats(state, registry);

  const categoryRows = Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, cat]) => {
    const catStats = stats.byCategory[key] || { total: 0, unlocked: 0, percent: 0 };
    return `
      <div class="category-row">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">${escapeHtml(cat.name)}</span>
        <span class="category-count">${catStats.unlocked}/${catStats.total}</span>
        <span class="category-percent">${catStats.percent}%</span>
      </div>
    `;
  }).join('');

  return `
    <div class="category-breakdown">
      <h3>By Category</h3>
      ${categoryRows}
    </div>
  `;
}

// Render recent unlocks
export function renderRecentUnlocks(state, registry, limit = 5) {
  const recent = getRecentUnlocks(state, registry, limit);

  if (recent.length === 0) {
    return `
      <div class="recent-unlocks">
        <h3>Recent Unlocks</h3>
        <p class="no-recent">No achievements unlocked yet</p>
      </div>
    `;
  }

  const items = recent.map(achievement => `
    <div class="recent-item">
      <span class="recent-icon">${ACHIEVEMENT_CATEGORIES[achievement.category]?.icon || '🏆'}</span>
      <div class="recent-info">
        <span class="recent-name">${escapeHtml(achievement.name)}</span>
        <span class="recent-date">${formatDate(achievement.unlockedAt)}</span>
      </div>
      <span class="recent-points">+${achievement.points}</span>
    </div>
  `).join('');

  return `
    <div class="recent-unlocks">
      <h3>Recent Unlocks</h3>
      ${items}
    </div>
  `;
}

// Render showcase editor
export function renderShowcaseEditor(state) {
  const showcase = getShowcase(state);

  const titleOptions = ['None', ...showcase.availableTitles].map(title => `
    <option value="${escapeHtml(title || '')}" ${(title || '') === (showcase.activeTitle || '') ? 'selected' : ''}>
      ${title || 'None'}
    </option>
  `).join('');

  const badgeItems = showcase.availableBadges.map(badge => `
    <div class="badge-option ${showcase.displayedBadges.includes(badge) ? 'selected' : ''}" data-badge="${escapeHtml(badge)}">
      ${escapeHtml(badge)}
    </div>
  `).join('');

  return `
    <div class="showcase-editor">
      <h3>Customize Showcase</h3>

      <div class="showcase-section">
        <label>Active Title</label>
        <select class="title-select">${titleOptions}</select>
      </div>

      <div class="showcase-section">
        <label>Display Badges (max 3)</label>
        <div class="badge-grid">
          ${badgeItems || '<p class="no-badges">No badges unlocked</p>'}
        </div>
      </div>

      <div class="showcase-preview">
        <h4>Preview</h4>
        <div class="preview-card">
          ${showcase.activeTitle ? `<span class="preview-title">${escapeHtml(showcase.activeTitle)}</span>` : ''}
          <div class="preview-badges">
            ${showcase.displayedBadges.map(b => `<span class="preview-badge">${escapeHtml(b)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render unlock notification
export function renderUnlockNotification(achievement) {
  const tier = ACHIEVEMENT_TIERS[achievement.tier];
  const category = ACHIEVEMENT_CATEGORIES[achievement.category];

  return `
    <div class="achievement-notification" style="border-color: ${tier?.color || '#888'}">
      <div class="notification-glow" style="background-color: ${tier?.color || '#888'}"></div>
      <div class="notification-icon">${category?.icon || '🏆'}</div>
      <div class="notification-content">
        <span class="notification-label">Achievement Unlocked!</span>
        <span class="notification-name">${escapeHtml(achievement.name)}</span>
        <span class="notification-points" style="color: ${tier?.color || '#888'}">+${tier?.points || 0} points</span>
      </div>
    </div>
  `;
}

// Render achievement panel (full view)
export function renderAchievementPanel(state, registry) {
  return `
    <div class="achievement-panel">
      <h2>Achievements</h2>

      ${renderProgressOverview(state, registry)}

      <div class="achievement-content-area">
        <div class="achievement-main">
          ${renderCategoryTabs()}
          ${renderAchievementList(state, registry)}
        </div>

        <div class="achievement-sidebar">
          ${renderRecentUnlocks(state, registry)}
          ${renderTierBreakdown(state, registry)}
          ${renderCategoryBreakdown(state, registry)}
        </div>
      </div>
    </div>
  `;
}

// Get achievement panel styles
export function getAchievementStyles() {
  return `
    .achievement-panel { padding: 20px; max-width: 1200px; margin: 0 auto; }

    .achievement-overview { background: #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .overview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .player-rank { border: 3px solid; border-radius: 8px; padding: 10px 20px; text-align: center; }
    .rank-name { font-size: 18px; font-weight: bold; display: block; }
    .total-points { font-size: 14px; color: #aaa; }

    .completion-circle { width: 80px; height: 80px; position: relative; }
    .completion-circle svg { transform: rotate(-90deg); }
    .circle-bg { fill: none; stroke: #444; stroke-width: 3; }
    .circle-progress { fill: none; stroke: #4CAF50; stroke-width: 3; stroke-linecap: round; }
    .circle-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; }

    .overview-stats { display: flex; gap: 40px; justify-content: center; margin-bottom: 20px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; display: block; }
    .stat-label { font-size: 12px; color: #888; }

    .achievement-card { display: flex; gap: 15px; padding: 15px; background: #333; border-radius: 8px; margin-bottom: 10px; align-items: center; }
    .achievement-locked { opacity: 0.7; }
    .achievement-icon { width: 50px; height: 50px; border: 3px solid; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .achievement-content { flex: 1; }
    .achievement-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .achievement-name { margin: 0; font-size: 16px; }
    .achievement-tier { font-size: 12px; font-weight: bold; }
    .achievement-description { margin: 0; font-size: 13px; color: #aaa; }
    .achievement-points { text-align: center; }
    .points-value { font-size: 20px; font-weight: bold; display: block; }
    .points-label { font-size: 11px; color: #888; }

    .achievement-progress { margin-top: 8px; }
    .achievement-progress-bar { height: 6px; background: #555; border-radius: 3px; }
    .achievement-progress-fill { height: 100%; background: #4CAF50; border-radius: 3px; }
    .achievement-progress-text { font-size: 11px; color: #888; }

    .achievement-category-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 15px; }
    .category-tab { display: flex; align-items: center; gap: 5px; padding: 8px 12px; background: #444; border: none; border-radius: 6px; cursor: pointer; }
    .category-tab.active { background: #666; }

    .achievement-notification { position: fixed; top: 80px; right: 20px; background: #1a1a1a; border: 2px solid; border-radius: 12px; padding: 15px 20px; display: flex; gap: 15px; align-items: center; animation: slideIn 0.3s ease; z-index: 1000; }
    .notification-icon { font-size: 32px; }
    .notification-label { font-size: 11px; color: #888; display: block; }
    .notification-name { font-size: 16px; font-weight: bold; display: block; }
    .notification-points { font-size: 14px; font-weight: bold; }

    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .recent-unlocks, .tier-breakdown, .category-breakdown { background: #2a2a2a; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .recent-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #444; align-items: center; }
    .recent-item:last-child { border-bottom: none; }
    .recent-icon { font-size: 20px; }
    .recent-info { flex: 1; }
    .recent-name { display: block; font-weight: bold; font-size: 13px; }
    .recent-date { font-size: 11px; color: #888; }
    .recent-points { color: #4CAF50; font-weight: bold; }

    .tier-row, .category-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .tier-bar { flex: 1; height: 8px; background: #444; border-radius: 4px; }
    .tier-bar-fill { height: 100%; border-radius: 4px; }
  `;
}
