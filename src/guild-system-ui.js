/**
 * Guild System UI
 * Renders guild interface components
 */

import {
  GUILD_RANK,
  GUILD_PERK,
  getGuildStats,
  getGuildLevelProgress,
  getAvailablePerks,
  getQuestStatus,
  getMaxMembers,
  escapeHtml
} from './guild-system.js';

// Rank display colors
const RANK_COLORS = {
  [GUILD_RANK.LEADER]: '#ffd700',
  [GUILD_RANK.OFFICER]: '#c0c0c0',
  [GUILD_RANK.VETERAN]: '#cd7f32',
  [GUILD_RANK.MEMBER]: '#4caf50',
  [GUILD_RANK.RECRUIT]: '#888888'
};

// Rank display icons
const RANK_ICONS = {
  [GUILD_RANK.LEADER]: '👑',
  [GUILD_RANK.OFFICER]: '⭐',
  [GUILD_RANK.VETERAN]: '🎖️',
  [GUILD_RANK.MEMBER]: '🛡️',
  [GUILD_RANK.RECRUIT]: '📜'
};

/**
 * Renders the main guild panel
 * @param {Object} guild - Guild object
 * @param {string} currentMemberId - Current player's member ID
 * @param {Object} options - Display options
 * @returns {string} HTML string
 */
export function renderGuildPanel(guild, currentMemberId, options = {}) {
  if (!guild) {
    return renderNoGuildPanel(options);
  }

  const stats = getGuildStats(guild);
  const currentMember = guild.members.find(m => m.id === currentMemberId);

  const html = `
    <div class="guild-panel" data-guild-id="${escapeHtml(guild.id)}">
      <div class="guild-header">
        <div class="guild-identity">
          <h2 class="guild-name">${escapeHtml(guild.name)}</h2>
          <span class="guild-tag">[${escapeHtml(guild.tag)}]</span>
        </div>
        <div class="guild-level">
          <span class="level-badge">Lv. ${stats.level}</span>
        </div>
      </div>

      ${guild.motd ? `<div class="guild-motd">${escapeHtml(guild.motd)}</div>` : ''}

      <div class="guild-stats-summary">
        ${renderLevelProgress(stats.levelProgress)}
        <div class="stats-row">
          <span class="stat">
            <span class="stat-icon">👥</span>
            ${stats.memberCount}/${stats.maxMembers}
          </span>
          <span class="stat">
            <span class="stat-icon">💰</span>
            ${stats.bankGold} gold
          </span>
          <span class="stat">
            <span class="stat-icon">✨</span>
            ${stats.perksUnlocked} perks
          </span>
        </div>
      </div>

      ${options.showTabs ? renderGuildTabs(options.activeTab || 'members') : ''}

      ${options.activeTab === 'members' || !options.showTabs
        ? renderMembersList(guild.members, currentMember)
        : ''}
      ${options.activeTab === 'bank' ? renderGuildBank(guild, currentMember) : ''}
      ${options.activeTab === 'perks' ? renderGuildPerks(guild) : ''}
      ${options.activeTab === 'quests' ? renderGuildQuests(guild) : ''}
      ${options.activeTab === 'settings' && currentMember?.rank === GUILD_RANK.LEADER
        ? renderGuildSettings(guild)
        : ''}
    </div>
  `;

  return html;
}

/**
 * Renders panel when player has no guild
 * @param {Object} options - Display options
 * @returns {string} HTML string
 */
function renderNoGuildPanel(options = {}) {
  return `
    <div class="guild-panel no-guild">
      <h2>No Guild</h2>
      <p>You are not a member of any guild.</p>
      <div class="guild-actions">
        <button class="guild-btn guild-btn-primary" data-action="create-guild">
          Create Guild
        </button>
        <button class="guild-btn guild-btn-secondary" data-action="browse-guilds">
          Browse Guilds
        </button>
      </div>
      ${options.invites && options.invites.length > 0
        ? renderGuildInvites(options.invites)
        : ''}
    </div>
  `;
}

/**
 * Renders guild tab navigation
 * @param {string} activeTab - Currently active tab
 * @returns {string} HTML string
 */
function renderGuildTabs(activeTab) {
  const tabs = [
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'bank', label: 'Bank', icon: '💰' },
    { id: 'perks', label: 'Perks', icon: '✨' },
    { id: 'quests', label: 'Quests', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return `
    <div class="guild-tabs">
      ${tabs.map(tab => `
        <button
          class="guild-tab ${activeTab === tab.id ? 'active' : ''}"
          data-tab="${tab.id}"
        >
          <span class="tab-icon">${tab.icon}</span>
          <span class="tab-label">${tab.label}</span>
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Renders level progress bar
 * @param {Object} progress - Level progress data
 * @returns {string} HTML string
 */
function renderLevelProgress(progress) {
  if (progress.isMaxLevel) {
    return `
      <div class="level-progress">
        <div class="progress-label">Maximum Level!</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 100%"></div>
        </div>
      </div>
    `;
  }

  const percentage = Math.round(progress.progress * 100);

  return `
    <div class="level-progress">
      <div class="progress-label">
        ${progress.currentXp} / ${progress.nextLevelXp} XP
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

/**
 * Renders members list
 * @param {Array} members - Guild members
 * @param {Object} currentMember - Current player's member data
 * @returns {string} HTML string
 */
function renderMembersList(members, currentMember) {
  const sortedMembers = [...members].sort((a, b) => {
    const rankOrder = Object.values(GUILD_RANK);
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });

  return `
    <div class="guild-members">
      <h3>Members (${members.length})</h3>
      <ul class="members-list">
        ${sortedMembers.map(member => renderMemberRow(member, currentMember)).join('')}
      </ul>
    </div>
  `;
}

/**
 * Renders a single member row
 * @param {Object} member - Member data
 * @param {Object} currentMember - Current player's member data
 * @returns {string} HTML string
 */
function renderMemberRow(member, currentMember) {
  const rankColor = RANK_COLORS[member.rank] || '#888';
  const rankIcon = RANK_ICONS[member.rank] || '';
  const isCurrentPlayer = currentMember && member.id === currentMember.id;
  const lastActiveText = formatLastActive(member.lastActive);

  return `
    <li class="member-row ${isCurrentPlayer ? 'is-current-player' : ''}"
        data-member-id="${escapeHtml(member.id)}">
      <div class="member-info">
        <span class="member-rank" style="color: ${rankColor}">
          ${rankIcon}
        </span>
        <span class="member-name">${escapeHtml(member.name)}</span>
        ${isCurrentPlayer ? '<span class="you-badge">(You)</span>' : ''}
      </div>
      <div class="member-details">
        <span class="member-contribution" title="Contribution">
          💰 ${member.contribution}
        </span>
        <span class="member-activity" title="Last active">
          ${escapeHtml(lastActiveText)}
        </span>
      </div>
      ${currentMember && canManageMember(currentMember, member) ? `
        <div class="member-actions">
          <button class="member-action" data-action="promote" title="Promote">⬆️</button>
          <button class="member-action" data-action="demote" title="Demote">⬇️</button>
          <button class="member-action" data-action="kick" title="Kick">❌</button>
        </div>
      ` : ''}
    </li>
  `;
}

/**
 * Checks if current member can manage another member
 * @param {Object} currentMember - Current member
 * @param {Object} targetMember - Target member
 * @returns {boolean} Can manage
 */
function canManageMember(currentMember, targetMember) {
  if (currentMember.id === targetMember.id) return false;
  const rankOrder = Object.values(GUILD_RANK);
  return rankOrder.indexOf(currentMember.rank) < rankOrder.indexOf(targetMember.rank);
}

/**
 * Formats last active time
 * @param {number} timestamp - Last active timestamp
 * @returns {string} Formatted string
 */
function formatLastActive(timestamp) {
  if (!timestamp) return 'Unknown';

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 5) return 'Online';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Renders guild bank view
 * @param {Object} guild - Guild object
 * @param {Object} currentMember - Current member
 * @returns {string} HTML string
 */
function renderGuildBank(guild, currentMember) {
  return `
    <div class="guild-bank">
      <h3>Guild Bank</h3>
      <div class="bank-balance">
        <span class="balance-icon">💰</span>
        <span class="balance-amount">${guild.bank.gold}</span>
        <span class="balance-label">Gold</span>
      </div>
      <div class="bank-actions">
        <button class="guild-btn guild-btn-primary" data-action="deposit">
          Deposit Gold
        </button>
        <button class="guild-btn guild-btn-secondary" data-action="withdraw"
          ${!canWithdraw(currentMember) ? 'disabled' : ''}>
          Withdraw Gold
        </button>
      </div>
      ${guild.bank.items.length > 0 ? renderBankItems(guild.bank.items) : `
        <div class="bank-items-empty">No items in bank</div>
      `}
    </div>
  `;
}

/**
 * Checks if member can withdraw
 * @param {Object} member - Member data
 * @returns {boolean} Can withdraw
 */
function canWithdraw(member) {
  const withdrawRanks = [GUILD_RANK.LEADER, GUILD_RANK.OFFICER];
  return member && withdrawRanks.includes(member.rank);
}

/**
 * Renders bank items
 * @param {Array} items - Bank items
 * @returns {string} HTML string
 */
function renderBankItems(items) {
  return `
    <div class="bank-items">
      <h4>Stored Items (${items.length})</h4>
      <div class="items-grid">
        ${items.map(item => `
          <div class="bank-item" data-item-id="${escapeHtml(item.id)}">
            <span class="item-name">${escapeHtml(item.name)}</span>
            ${item.quantity > 1 ? `<span class="item-qty">x${item.quantity}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Renders guild perks view
 * @param {Object} guild - Guild object
 * @returns {string} HTML string
 */
function renderGuildPerks(guild) {
  const perks = getAvailablePerks(guild);

  return `
    <div class="guild-perks">
      <h3>Guild Perks</h3>
      <div class="perks-list">
        ${perks.map(perk => renderPerkCard(perk)).join('')}
      </div>
    </div>
  `;
}

/**
 * Renders a perk card
 * @param {Object} perk - Perk data
 * @returns {string} HTML string
 */
function renderPerkCard(perk) {
  const statusClass = perk.unlocked ? 'unlocked' :
                      perk.canUnlock ? 'available' : 'locked';

  return `
    <div class="perk-card ${statusClass}" data-perk-id="${escapeHtml(perk.id)}">
      <div class="perk-header">
        <span class="perk-name">${escapeHtml(perk.name)}</span>
        ${perk.unlocked ? '<span class="perk-badge">Unlocked</span>' : ''}
      </div>
      <p class="perk-desc">${escapeHtml(perk.description)}</p>
      <div class="perk-footer">
        <span class="perk-level">Level ${perk.levelRequired}+</span>
        ${!perk.unlocked ? `
          <span class="perk-cost">${perk.cost} gold</span>
          ${perk.canUnlock ? `
            <button class="guild-btn guild-btn-small" data-action="unlock-perk">
              Unlock
            </button>
          ` : ''}
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Renders guild quests view
 * @param {Object} guild - Guild object
 * @returns {string} HTML string
 */
function renderGuildQuests(guild) {
  const questStatus = getQuestStatus(guild);

  return `
    <div class="guild-quests">
      <h3>Guild Quests</h3>

      ${questStatus.active.length > 0 ? `
        <div class="quests-section">
          <h4>Active Quests</h4>
          ${questStatus.active.map(quest => renderActiveQuest(quest)).join('')}
        </div>
      ` : ''}

      <div class="quests-section">
        <h4>Available Quests</h4>
        ${questStatus.available.length > 0
          ? questStatus.available.map(quest => renderAvailableQuest(quest)).join('')
          : '<div class="no-quests">No quests available</div>'}
      </div>

      <div class="quests-stats">
        Total Completed: ${questStatus.completed}
      </div>
    </div>
  `;
}

/**
 * Renders an active quest
 * @param {Object} quest - Quest data
 * @returns {string} HTML string
 */
function renderActiveQuest(quest) {
  const progressPercent = quest.progressPercent.toFixed(0);
  const timeRemaining = formatTimeRemaining(quest.timeRemaining);

  return `
    <div class="quest-card active" data-quest-id="${escapeHtml(quest.id)}">
      <div class="quest-header">
        <span class="quest-name">${escapeHtml(quest.name)}</span>
        <span class="quest-time">${escapeHtml(timeRemaining)}</span>
      </div>
      <p class="quest-desc">${escapeHtml(quest.description)}</p>
      <div class="quest-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <span class="progress-text">${quest.progress}/${quest.target}</span>
      </div>
      <div class="quest-rewards">
        ${quest.rewards.gold ? `<span>💰 ${quest.rewards.gold}</span>` : ''}
        ${quest.rewards.guildXp ? `<span>⭐ ${quest.rewards.guildXp} XP</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Renders an available quest
 * @param {Object} quest - Quest data
 * @returns {string} HTML string
 */
function renderAvailableQuest(quest) {
  const duration = formatDuration(quest.duration);

  return `
    <div class="quest-card available" data-quest-id="${escapeHtml(quest.id)}">
      <div class="quest-header">
        <span class="quest-name">${escapeHtml(quest.name)}</span>
        <span class="quest-duration">${escapeHtml(duration)}</span>
      </div>
      <p class="quest-desc">${escapeHtml(quest.description)}</p>
      <div class="quest-target">Target: ${quest.target}</div>
      <div class="quest-rewards">
        ${quest.rewards.gold ? `<span>💰 ${quest.rewards.gold}</span>` : ''}
        ${quest.rewards.guildXp ? `<span>⭐ ${quest.rewards.guildXp} XP</span>` : ''}
      </div>
      <button class="guild-btn guild-btn-small" data-action="start-quest">
        Start Quest
      </button>
    </div>
  `;
}

/**
 * Formats time remaining
 * @param {number} ms - Milliseconds remaining
 * @returns {string} Formatted string
 */
function formatTimeRemaining(ms) {
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  return 'Soon';
}

/**
 * Formats duration
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
function formatDuration(ms) {
  const days = Math.floor(ms / 86400000);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Renders guild settings view
 * @param {Object} guild - Guild object
 * @returns {string} HTML string
 */
function renderGuildSettings(guild) {
  return `
    <div class="guild-settings">
      <h3>Guild Settings</h3>

      <div class="setting-group">
        <label class="setting-label">Guild Name</label>
        <input type="text" class="setting-input" id="guild-name"
               value="${escapeHtml(guild.name)}" maxlength="30" />
      </div>

      <div class="setting-group">
        <label class="setting-label">Guild Tag</label>
        <input type="text" class="setting-input" id="guild-tag"
               value="${escapeHtml(guild.tag)}" maxlength="4" />
      </div>

      <div class="setting-group">
        <label class="setting-label">Message of the Day</label>
        <textarea class="setting-textarea" id="guild-motd"
                  maxlength="200">${escapeHtml(guild.motd || '')}</textarea>
      </div>

      <div class="setting-group">
        <label class="setting-label">Minimum Level to Join</label>
        <input type="number" class="setting-input" id="min-level"
               value="${guild.settings.minLevelToJoin}" min="1" max="100" />
      </div>

      <div class="setting-group">
        <label class="setting-checkbox">
          <input type="checkbox" id="is-public"
                 ${guild.settings.isPublic ? 'checked' : ''} />
          Public Guild (visible in browse)
        </label>
      </div>

      <div class="settings-actions">
        <button class="guild-btn guild-btn-primary" data-action="save-settings">
          Save Settings
        </button>
        <button class="guild-btn guild-btn-danger" data-action="disband-guild">
          Disband Guild
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders guild invites
 * @param {Array} invites - Pending invites
 * @returns {string} HTML string
 */
function renderGuildInvites(invites) {
  return `
    <div class="guild-invites">
      <h3>Pending Invites</h3>
      <ul class="invites-list">
        ${invites.map(invite => `
          <li class="invite-row">
            <span class="invite-guild">${escapeHtml(invite.guildName)}</span>
            <span class="invite-from">from ${escapeHtml(invite.inviterName)}</span>
            <div class="invite-actions">
              <button class="guild-btn guild-btn-small guild-btn-primary"
                      data-action="accept-invite"
                      data-guild-id="${escapeHtml(invite.guildId)}">
                Accept
              </button>
              <button class="guild-btn guild-btn-small"
                      data-action="decline-invite"
                      data-guild-id="${escapeHtml(invite.guildId)}">
                Decline
              </button>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Renders guild creation form
 * @param {number} cost - Creation cost
 * @returns {string} HTML string
 */
export function renderCreateGuildForm(cost = 500) {
  return `
    <div class="create-guild-form">
      <h2>Create Guild</h2>

      <div class="form-group">
        <label>Guild Name</label>
        <input type="text" id="new-guild-name" maxlength="30"
               placeholder="Enter guild name" />
        <span class="form-hint">3-30 characters, letters/numbers/spaces only</span>
      </div>

      <div class="form-group">
        <label>Guild Tag</label>
        <input type="text" id="new-guild-tag" maxlength="4"
               placeholder="TAG" />
        <span class="form-hint">1-4 characters</span>
      </div>

      <div class="form-group">
        <label>Description (optional)</label>
        <textarea id="new-guild-desc" maxlength="200"
                  placeholder="Describe your guild"></textarea>
      </div>

      <div class="form-cost">
        <span>Creation Cost:</span>
        <span class="cost-amount">💰 ${cost} gold</span>
      </div>

      <div class="form-actions">
        <button class="guild-btn guild-btn-primary" data-action="confirm-create">
          Create Guild
        </button>
        <button class="guild-btn" data-action="cancel-create">
          Cancel
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders guild browser
 * @param {Array} guilds - Available guilds
 * @param {Object} options - Filter options
 * @returns {string} HTML string
 */
export function renderGuildBrowser(guilds, options = {}) {
  const filteredGuilds = guilds.filter(g => g.settings?.isPublic !== false);

  return `
    <div class="guild-browser">
      <h2>Browse Guilds</h2>

      <div class="browser-filters">
        <input type="text" id="guild-search" placeholder="Search guilds..."
               value="${escapeHtml(options.search || '')}" />
      </div>

      <div class="guilds-list">
        ${filteredGuilds.length > 0
          ? filteredGuilds.map(guild => renderGuildListItem(guild)).join('')
          : '<div class="no-guilds">No guilds found</div>'}
      </div>

      <div class="browser-actions">
        <button class="guild-btn" data-action="close-browser">
          Close
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders a guild list item for browser
 * @param {Object} guild - Guild data
 * @returns {string} HTML string
 */
function renderGuildListItem(guild) {
  const maxMembers = getMaxMembers(guild.level);

  return `
    <div class="guild-list-item" data-guild-id="${escapeHtml(guild.id)}">
      <div class="guild-list-header">
        <span class="guild-list-name">${escapeHtml(guild.name)}</span>
        <span class="guild-list-tag">[${escapeHtml(guild.tag)}]</span>
        <span class="guild-list-level">Lv. ${guild.level}</span>
      </div>
      ${guild.description ? `
        <p class="guild-list-desc">${escapeHtml(guild.description)}</p>
      ` : ''}
      <div class="guild-list-info">
        <span>👥 ${guild.members.length}/${maxMembers}</span>
        <span>Min Lv. ${guild.settings?.minLevelToJoin || 1}</span>
      </div>
      <button class="guild-btn guild-btn-small guild-btn-primary"
              data-action="request-join"
              data-guild-id="${escapeHtml(guild.id)}">
        Request to Join
      </button>
    </div>
  `;
}

/**
 * Renders guild HUD element
 * @param {Object} guild - Guild object
 * @returns {string} HTML string
 */
export function renderGuildHud(guild) {
  if (!guild) {
    return '';
  }

  return `
    <div class="guild-hud">
      <span class="hud-tag">[${escapeHtml(guild.tag)}]</span>
      <span class="hud-name">${escapeHtml(guild.name)}</span>
    </div>
  `;
}

/**
 * Gets CSS styles for guild components
 * @returns {string} CSS string
 */
export function getGuildStyles() {
  return `
    .guild-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #ffffff;
    }

    .guild-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .guild-name {
      font-size: 1.5em;
      margin: 0;
    }

    .guild-tag {
      color: #888;
      margin-left: 8px;
    }

    .level-badge {
      background: linear-gradient(135deg, #ffd700, #ff8c00);
      padding: 4px 12px;
      border-radius: 16px;
      font-weight: bold;
    }

    .guild-motd {
      background: #252540;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-style: italic;
      color: #aaa;
    }

    .guild-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid #333;
      padding-bottom: 8px;
    }

    .guild-tab {
      background: transparent;
      border: none;
      color: #888;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px 4px 0 0;
    }

    .guild-tab.active {
      background: #252540;
      color: #fff;
    }

    .guild-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin: 4px;
    }

    .guild-btn-primary {
      background: #4caf50;
      color: white;
    }

    .guild-btn-secondary {
      background: #2196f3;
      color: white;
    }

    .guild-btn-danger {
      background: #f44336;
      color: white;
    }

    .guild-btn-small {
      padding: 4px 8px;
      font-size: 0.9em;
    }

    .members-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .member-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      border-bottom: 1px solid #333;
    }

    .member-row.is-current-player {
      background: rgba(33, 150, 243, 0.2);
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .you-badge {
      color: #2196f3;
      font-size: 0.8em;
    }

    .perk-card {
      background: #252540;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    }

    .perk-card.unlocked {
      border-left: 4px solid #4caf50;
    }

    .perk-card.available {
      border-left: 4px solid #2196f3;
    }

    .perk-card.locked {
      opacity: 0.6;
    }

    .quest-card {
      background: #252540;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    }

    .quest-card.active {
      border-left: 4px solid #ff9800;
    }

    .quest-progress .progress-bar {
      background: #333;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }

    .quest-progress .progress-fill {
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      height: 100%;
      transition: width 0.3s ease;
    }

    .quest-rewards {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      color: #888;
    }

    .bank-balance {
      text-align: center;
      font-size: 2em;
      margin: 16px 0;
    }

    .guild-settings .setting-group {
      margin: 12px 0;
    }

    .guild-settings .setting-label {
      display: block;
      margin-bottom: 4px;
      color: #888;
    }

    .guild-settings .setting-input,
    .guild-settings .setting-textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #333;
      border-radius: 4px;
      background: #252540;
      color: #fff;
    }

    .guild-hud {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9em;
    }

    .hud-tag {
      color: #ffd700;
    }
  `;
}
