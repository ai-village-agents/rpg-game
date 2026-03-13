/**
 * Title/Badge System UI
 * Renders title selection, badge display, and unlock notifications
 */

import {
  TITLE_CATEGORY,
  TITLE_RARITY,
  BADGE_TYPE,
  TITLES,
  BADGES,
  getTitleBadgeState,
  getUnlockedTitles,
  getUnlockedBadges,
  getDisplayedBadges,
  getTitlesByCategory,
  getBadgesByType,
  getTitleStats,
  getNewUnlocks,
  getPlayerNameWithTitle,
  getTitleHistory
} from './title-badge-system.js';

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
 * Render the title selection panel
 */
export function renderTitlePanel(state, options = {}) {
  const {
    onEquipTitle = null,
    selectedCategory = null
  } = options;

  const tbState = getTitleBadgeState(state);
  const stats = getTitleStats(state);
  const categories = Object.values(TITLE_CATEGORY);

  let html = `
    <div class="title-panel">
      <div class="title-panel-header">
        <h2>Titles</h2>
        <div class="title-stats">
          <span class="stat">${stats.unlockedTitles}/${stats.totalTitles} Unlocked</span>
          <span class="stat points">${stats.titlePoints} Points</span>
        </div>
      </div>

      <div class="current-title">
        <span class="label">Current Title:</span>
        <span class="title-name" style="color: ${tbState.equippedTitle ? TITLES[tbState.equippedTitle]?.rarity.color : '#FFFFFF'}">
          ${tbState.equippedTitle ? escapeHtml(TITLES[tbState.equippedTitle]?.name) : 'None'}
        </span>
      </div>

      <div class="title-categories">
        ${categories.map(cat => `
          <button class="category-btn ${selectedCategory === cat.id ? 'active' : ''}"
                  style="border-color: ${cat.color}"
                  data-category="${cat.id}">
            ${escapeHtml(cat.name)}
          </button>
        `).join('')}
      </div>

      <div class="title-list">
        ${renderTitleList(state, selectedCategory || 'combat')}
      </div>
    </div>
  `;

  return html;
}

/**
 * Render list of titles for a category
 */
function renderTitleList(state, categoryId) {
  const titles = getTitlesByCategory(state, categoryId);

  if (titles.length === 0) {
    return '<div class="no-titles">No titles in this category</div>';
  }

  return titles.map(title => `
    <div class="title-item ${title.unlocked ? 'unlocked' : 'locked'} ${title.equipped ? 'equipped' : ''}"
         data-title-id="${title.id}">
      <div class="title-info">
        <span class="title-name" style="color: ${title.rarity.color}">
          ${escapeHtml(title.name)}
        </span>
        <span class="title-rarity" style="color: ${title.rarity.color}">
          ${escapeHtml(title.rarity.name)}
        </span>
      </div>
      <div class="title-description">
        ${title.unlocked ? escapeHtml(title.description) : '???'}
      </div>
      ${title.unlocked && !title.equipped ? `
        <button class="equip-btn" data-title-id="${title.id}">Equip</button>
      ` : ''}
      ${title.equipped ? '<span class="equipped-badge">Equipped</span>' : ''}
    </div>
  `).join('');
}

/**
 * Render the badge collection panel
 */
export function renderBadgePanel(state, options = {}) {
  const {
    onDisplayBadge = null,
    onHideBadge = null,
    selectedType = null
  } = options;

  const tbState = getTitleBadgeState(state);
  const stats = getTitleStats(state);
  const types = Object.values(BADGE_TYPE);

  let html = `
    <div class="badge-panel">
      <div class="badge-panel-header">
        <h2>Badges</h2>
        <div class="badge-stats">
          <span class="stat">${stats.unlockedBadges}/${stats.totalBadges} Collected</span>
          <span class="stat slots">Slots: ${tbState.displayedBadges.length}/${stats.badgeSlots}</span>
        </div>
      </div>

      <div class="displayed-badges">
        <h3>Displayed Badges</h3>
        <div class="badge-display-slots">
          ${renderBadgeSlots(state)}
        </div>
      </div>

      <div class="badge-types">
        ${types.map(type => `
          <button class="type-btn ${selectedType === type.id ? 'active' : ''}"
                  data-type="${type.id}">
            <span class="type-icon">${getBadgeTypeIcon(type.icon)}</span>
            ${escapeHtml(type.name)}
          </button>
        `).join('')}
      </div>

      <div class="badge-list">
        ${renderBadgeList(state, selectedType || 'milestone')}
      </div>
    </div>
  `;

  return html;
}

/**
 * Render badge display slots
 */
function renderBadgeSlots(state) {
  const tbState = getTitleBadgeState(state);
  const displayedBadges = getDisplayedBadges(state);
  const slots = [];

  for (let i = 0; i < tbState.badgeSlots; i++) {
    const badge = displayedBadges[i];
    if (badge) {
      slots.push(`
        <div class="badge-slot filled" data-index="${i}" data-badge-id="${badge.id}">
          <span class="badge-icon">${getBadgeTypeIcon(badge.icon)}</span>
          <span class="badge-name">${escapeHtml(badge.name)}</span>
          <button class="remove-badge-btn" data-badge-id="${badge.id}">x</button>
        </div>
      `);
    } else {
      slots.push(`
        <div class="badge-slot empty" data-index="${i}">
          <span class="empty-slot">Empty</span>
        </div>
      `);
    }
  }

  // Locked slots
  for (let i = tbState.badgeSlots; i < tbState.maxBadgeSlots; i++) {
    slots.push(`
      <div class="badge-slot locked" data-index="${i}">
        <span class="locked-icon">Locked</span>
      </div>
    `);
  }

  return slots.join('');
}

/**
 * Render list of badges for a type
 */
function renderBadgeList(state, typeId) {
  const badges = getBadgesByType(state, typeId);

  if (badges.length === 0) {
    return '<div class="no-badges">No badges in this category</div>';
  }

  return badges.map(badge => `
    <div class="badge-item ${badge.unlocked ? 'unlocked' : 'locked'} ${badge.displayed ? 'displayed' : ''}"
         data-badge-id="${badge.id}">
      <div class="badge-icon-large">
        ${badge.unlocked ? getBadgeTypeIcon(badge.icon) : '?'}
      </div>
      <div class="badge-info">
        <span class="badge-name">
          ${badge.unlocked ? escapeHtml(badge.name) : '???'}
        </span>
        <span class="badge-description">
          ${badge.unlocked ? escapeHtml(badge.description) : 'Locked'}
        </span>
      </div>
      ${badge.unlocked && !badge.displayed ? `
        <button class="display-btn" data-badge-id="${badge.id}">Display</button>
      ` : ''}
      ${badge.displayed ? '<span class="displayed-indicator">Displayed</span>' : ''}
    </div>
  `).join('');
}

/**
 * Get icon for badge type
 */
function getBadgeTypeIcon(iconName) {
  const icons = {
    'star': '\u2605',
    'star_bronze': '\u2606',
    'star_silver': '\u2605',
    'star_gold': '\u2b50',
    'trophy': '\ud83c\udfc6',
    'calendar': '\ud83d\udcc5',
    'eye': '\ud83d\udc41',
    'crown': '\ud83d\udc51',
    'coin_stack': '\ud83d\udcb0',
    'scroll': '\ud83d\udcdc',
    'sword_crossed': '\u2694',
    'shield_perfect': '\ud83d\udee1',
    'david_goliath': '\ud83c\udfc5',
    'snowflake': '\u2744',
    'cake': '\ud83c\udf82',
    'magnifier': '\ud83d\udd0d',
    'key_master': '\ud83d\udd11',
    'sword_master': '\ud83d\udde1',
    'hammer_master': '\ud83d\udd28'
  };
  return icons[iconName] || '\u2605';
}

/**
 * Render unlock notification
 */
export function renderUnlockNotification(unlock) {
  const isTitle = unlock.type === 'title';
  const data = unlock.data;

  return `
    <div class="unlock-notification ${unlock.type}">
      <div class="notification-icon">
        ${isTitle ? '\ud83c\udfc5' : getBadgeTypeIcon(data.icon)}
      </div>
      <div class="notification-content">
        <span class="notification-type">${isTitle ? 'Title Unlocked!' : 'Badge Earned!'}</span>
        <span class="notification-name" style="color: ${isTitle ? data.rarity.color : '#FFD700'}">
          ${escapeHtml(data.name)}
        </span>
        <span class="notification-desc">${escapeHtml(data.description)}</span>
      </div>
    </div>
  `;
}

/**
 * Render all pending unlock notifications
 */
export function renderUnlockNotifications(state) {
  const newUnlocks = getNewUnlocks(state);

  if (newUnlocks.length === 0) {
    return '';
  }

  return `
    <div class="unlock-notifications">
      ${newUnlocks.map(renderUnlockNotification).join('')}
    </div>
  `;
}

/**
 * Render player name with title for display
 */
export function renderPlayerNameWithTitle(state, options = {}) {
  const { showTitle = true, className = '' } = options;

  const tbState = getTitleBadgeState(state);
  const playerName = state.player?.name || 'Adventurer';

  if (!showTitle || !tbState.equippedTitle) {
    return `<span class="player-name ${className}">${escapeHtml(playerName)}</span>`;
  }

  const title = TITLES[tbState.equippedTitle];
  return `
    <span class="player-name-with-title ${className}">
      <span class="title" style="color: ${title.rarity.color}">${escapeHtml(title.name)}</span>
      <span class="name">${escapeHtml(playerName)}</span>
    </span>
  `;
}

/**
 * Render badge display bar (for showing on profile)
 */
export function renderBadgeDisplayBar(state, options = {}) {
  const { compact = false } = options;

  const displayedBadges = getDisplayedBadges(state);

  if (displayedBadges.length === 0) {
    return compact ? '' : '<div class="badge-bar empty">No badges displayed</div>';
  }

  return `
    <div class="badge-bar ${compact ? 'compact' : ''}">
      ${displayedBadges.map(badge => `
        <div class="badge-display-item" title="${escapeHtml(badge.name)}: ${escapeHtml(badge.description)}">
          <span class="badge-icon">${getBadgeTypeIcon(badge.icon)}</span>
          ${!compact ? `<span class="badge-label">${escapeHtml(badge.name)}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render title progress overview
 */
export function renderTitleProgress(state) {
  const stats = getTitleStats(state);

  const rarityProgress = Object.entries(stats.titlesByRarity).map(([rarity, data]) => {
    const rarityInfo = TITLE_RARITY[rarity.toUpperCase()];
    const percentage = data.total > 0 ? Math.round((data.unlocked / data.total) * 100) : 0;
    return `
      <div class="rarity-progress">
        <span class="rarity-label" style="color: ${rarityInfo?.color || '#AAA'}">
          ${rarityInfo?.name || rarity}
        </span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%; background-color: ${rarityInfo?.color || '#AAA'}"></div>
        </div>
        <span class="progress-text">${data.unlocked}/${data.total}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="title-progress">
      <h3>Title Progress</h3>
      <div class="overall-progress">
        <span class="total">${stats.unlockedTitles}/${stats.totalTitles} Titles</span>
        <span class="points">${stats.titlePoints} Points</span>
      </div>
      <div class="rarity-breakdown">
        ${rarityProgress}
      </div>
    </div>
  `;
}

/**
 * Render badge progress overview
 */
export function renderBadgeProgress(state) {
  const stats = getTitleStats(state);

  const typeProgress = Object.entries(stats.badgesByType).map(([typeId, data]) => {
    const typeInfo = BADGE_TYPE[typeId.toUpperCase()];
    const percentage = data.total > 0 ? Math.round((data.unlocked / data.total) * 100) : 0;
    return `
      <div class="type-progress">
        <span class="type-label">
          ${getBadgeTypeIcon(typeInfo?.icon || 'star')} ${typeInfo?.name || typeId}
        </span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <span class="progress-text">${data.unlocked}/${data.total}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="badge-progress">
      <h3>Badge Progress</h3>
      <div class="overall-progress">
        <span class="total">${stats.unlockedBadges}/${stats.totalBadges} Badges</span>
        <span class="slots">Slots: ${stats.badgeSlots}/${stats.maxBadgeSlots}</span>
      </div>
      <div class="type-breakdown">
        ${typeProgress}
      </div>
    </div>
  `;
}

/**
 * Render title history
 */
export function renderTitleHistory(state, options = {}) {
  const { limit = 10 } = options;

  const history = getTitleHistory(state).slice(0, limit);

  if (history.length === 0) {
    return '<div class="title-history empty">No titles unlocked yet</div>';
  }

  return `
    <div class="title-history">
      <h3>Recent Unlocks</h3>
      <div class="history-list">
        ${history.map(entry => `
          <div class="history-item">
            <span class="title-name" style="color: ${entry.title?.rarity.color}">
              ${escapeHtml(entry.title?.name || 'Unknown')}
            </span>
            <span class="unlock-date">${formatDate(entry.unlockedAt)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

/**
 * Render combined titles and badges summary
 */
export function renderTitleBadgeSummary(state) {
  const stats = getTitleStats(state);
  const tbState = getTitleBadgeState(state);

  return `
    <div class="title-badge-summary">
      <div class="summary-section titles">
        <h4>Titles</h4>
        <div class="equipped-title">
          ${tbState.equippedTitle
            ? `<span style="color: ${TITLES[tbState.equippedTitle]?.rarity.color}">${escapeHtml(TITLES[tbState.equippedTitle]?.name)}</span>`
            : '<span class="none">None equipped</span>'}
        </div>
        <div class="progress">${stats.unlockedTitles}/${stats.totalTitles}</div>
      </div>
      <div class="summary-section badges">
        <h4>Badges</h4>
        ${renderBadgeDisplayBar(state, { compact: true })}
        <div class="progress">${stats.unlockedBadges}/${stats.totalBadges}</div>
      </div>
    </div>
  `;
}

/**
 * Render title tooltip
 */
export function renderTitleTooltip(titleId) {
  const title = TITLES[titleId];
  if (!title) return '';

  return `
    <div class="title-tooltip">
      <div class="tooltip-header" style="color: ${title.rarity.color}">
        ${escapeHtml(title.name)}
      </div>
      <div class="tooltip-rarity" style="color: ${title.rarity.color}">
        ${escapeHtml(title.rarity.name)}
      </div>
      <div class="tooltip-category" style="color: ${title.category.color}">
        ${escapeHtml(title.category.name)}
      </div>
      <div class="tooltip-description">
        ${escapeHtml(title.description)}
      </div>
      <div class="tooltip-points">
        +${title.rarity.points} Points
      </div>
    </div>
  `;
}

/**
 * Render badge tooltip
 */
export function renderBadgeTooltip(badgeId) {
  const badge = BADGES[badgeId];
  if (!badge) return '';

  return `
    <div class="badge-tooltip">
      <div class="tooltip-icon">${getBadgeTypeIcon(badge.icon)}</div>
      <div class="tooltip-header">${escapeHtml(badge.name)}</div>
      <div class="tooltip-type">${escapeHtml(badge.type.name)}</div>
      <div class="tooltip-description">${escapeHtml(badge.description)}</div>
    </div>
  `;
}

/**
 * Get CSS styles for the title/badge system
 */
export function getTitleBadgeStyles() {
  return `
    .title-panel, .badge-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #fff;
    }

    .title-panel-header, .badge-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .title-stats, .badge-stats {
      display: flex;
      gap: 16px;
    }

    .current-title {
      padding: 12px;
      background: #2a2a4e;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .title-categories, .badge-types {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .category-btn, .type-btn {
      padding: 8px 16px;
      border: 2px solid;
      border-radius: 4px;
      background: transparent;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }

    .category-btn:hover, .type-btn:hover,
    .category-btn.active, .type-btn.active {
      background: rgba(255, 255, 255, 0.1);
    }

    .title-item, .badge-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #2a2a4e;
      border-radius: 4px;
      margin-bottom: 8px;
      gap: 12px;
    }

    .title-item.locked, .badge-item.locked {
      opacity: 0.5;
    }

    .title-item.equipped {
      border: 2px solid #FFD700;
    }

    .badge-display-slots {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .badge-slot {
      width: 80px;
      height: 80px;
      border: 2px dashed #444;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .badge-slot.filled {
      border-style: solid;
      border-color: #FFD700;
    }

    .badge-slot.locked {
      opacity: 0.3;
    }

    .remove-badge-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #ff4444;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      color: #fff;
    }

    .unlock-notification {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: linear-gradient(135deg, #1a1a2e, #2a2a4e);
      border-radius: 8px;
      border-left: 4px solid #FFD700;
      margin-bottom: 8px;
      animation: slideIn 0.3s ease-out;
    }

    .notification-icon {
      font-size: 32px;
    }

    .notification-content {
      display: flex;
      flex-direction: column;
    }

    .notification-type {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
    }

    .notification-name {
      font-size: 18px;
      font-weight: bold;
    }

    @keyframes slideIn {
      from {
        transform: translateX(-20px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .badge-bar {
      display: flex;
      gap: 8px;
    }

    .badge-bar.compact .badge-display-item {
      font-size: 20px;
    }

    .badge-display-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s;
    }

    .rarity-progress, .type-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .rarity-label, .type-label {
      width: 100px;
      font-size: 12px;
    }

    .title-tooltip, .badge-tooltip {
      background: #1a1a2e;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 12px;
      max-width: 250px;
    }
  `;
}
