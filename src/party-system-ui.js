/**
 * Party System UI
 * Renders party interfaces, member lists, and group controls
 */

import {
  PARTY_ROLES,
  LOOT_MODES,
  PARTY_SIZES,
  EXP_SHARE_MODES,
  PARTY_BUFFS,
  getPartyState,
  getPartyMembers,
  getPartyStats,
  getActiveBuffs,
  canPerformAction
} from './party-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render the main party panel
 */
export function renderPartyPanel(state, currentPlayerId) {
  const stats = getPartyStats(state);

  if (!stats.inParty) {
    return renderNoPartyPanel(state);
  }

  const members = getPartyMembers(state);
  const buffs = stats.activeBuffs;

  return `
    <div class="party-panel">
      <div class="party-header">
        <h2>${escapeHtml(stats.partyName)}</h2>
        <span class="member-count">${stats.memberCount}/${stats.maxMembers}</span>
      </div>

      ${buffs.length > 0 ? `
        <div class="party-buffs">
          ${buffs.map(buff => `
            <span class="buff-badge" title="${escapeHtml(buff.effect)}">
              ${escapeHtml(buff.name)}
            </span>
          `).join('')}
        </div>
      ` : ''}

      <div class="party-members">
        <h3>Members</h3>
        <ul class="member-list">
          ${members.map(member => renderMemberRow(member, currentPlayerId, state)).join('')}
        </ul>
      </div>

      <div class="party-settings-preview">
        <div class="setting">
          <span class="label">Loot:</span>
          <span class="value">${escapeHtml(LOOT_MODES[stats.lootMode.toUpperCase()]?.name || stats.lootMode)}</span>
        </div>
        <div class="setting">
          <span class="label">Experience:</span>
          <span class="value">${escapeHtml(EXP_SHARE_MODES[stats.expShareMode.toUpperCase()]?.name || stats.expShareMode)}</span>
        </div>
      </div>

      <div class="party-stats">
        <div class="stat">
          <span class="value">${stats.totalLootDistributed}</span>
          <span class="label">Loot Distributed</span>
        </div>
        <div class="stat">
          <span class="value">${stats.totalExpShared.toLocaleString()}</span>
          <span class="label">XP Shared</span>
        </div>
      </div>

      <div class="party-actions">
        ${renderPartyActions(state, currentPlayerId)}
      </div>
    </div>
  `;
}

/**
 * Render panel when not in a party
 */
function renderNoPartyPanel(state) {
  const partyState = getPartyState(state);

  return `
    <div class="party-panel no-party">
      <div class="party-header">
        <h2>No Party</h2>
      </div>

      ${partyState.pendingInvites.length > 0 ? `
        <div class="pending-invites">
          <h3>Pending Invites (${partyState.pendingInvites.length})</h3>
          <ul class="invite-list">
            ${partyState.pendingInvites.map(invite => `
              <li class="invite-item">
                <span class="party-name">${escapeHtml(invite.partyName)}</span>
                <span class="inviter">from ${escapeHtml(invite.inviterId)}</span>
                <div class="invite-actions">
                  <button class="btn-accept" data-action="accept-invite" data-party-id="${escapeHtml(invite.partyId)}">Accept</button>
                  <button class="btn-decline" data-action="decline-invite" data-party-id="${escapeHtml(invite.partyId)}">Decline</button>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="party-history-summary">
        <p>Parties Joined: ${partyState.totalPartiesJoined}</p>
        <p>Parties Led: ${partyState.totalPartiesLed}</p>
      </div>

      <div class="party-actions">
        <button class="btn-primary" data-action="create-party">Create Party</button>
      </div>
    </div>
  `;
}

/**
 * Render a single member row
 */
function renderMemberRow(member, currentPlayerId, state) {
  const isCurrentPlayer = member.playerId === currentPlayerId;
  const canKick = canPerformAction(state, currentPlayerId, 'canKick').allowed;
  const canPromote = canPerformAction(state, currentPlayerId, 'canPromote').allowed;

  const roleColors = {
    leader: '#FFD700',
    officer: '#87CEEB',
    member: '#FFFFFF'
  };

  return `
    <li class="member-row ${isCurrentPlayer ? 'current-player' : ''}" data-player-id="${escapeHtml(member.playerId)}">
      <span class="member-role" style="color: ${roleColors[member.role] || '#FFF'}">
        ${escapeHtml(member.roleData?.name || member.role)}
      </span>
      <span class="member-name">${escapeHtml(member.playerId)}</span>
      ${!isCurrentPlayer && (canKick || canPromote) ? `
        <div class="member-actions">
          ${canPromote ? `
            <button class="btn-small" data-action="promote-member" data-target-id="${escapeHtml(member.playerId)}">
              Promote
            </button>
          ` : ''}
          ${canKick && member.role !== 'leader' ? `
            <button class="btn-small btn-danger" data-action="kick-member" data-target-id="${escapeHtml(member.playerId)}">
              Kick
            </button>
          ` : ''}
        </div>
      ` : ''}
    </li>
  `;
}

/**
 * Render party action buttons
 */
function renderPartyActions(state, currentPlayerId) {
  const canInvite = canPerformAction(state, currentPlayerId, 'canInvite').allowed;
  const canSetLoot = canPerformAction(state, currentPlayerId, 'canSetLoot').allowed;
  const partyState = getPartyState(state);
  const isLeader = partyState.currentParty?.leaderId === currentPlayerId;

  return `
    ${canInvite ? `
      <button class="btn-primary" data-action="invite-player">Invite Player</button>
    ` : ''}
    ${canSetLoot ? `
      <button class="btn-secondary" data-action="party-settings">Settings</button>
    ` : ''}
    <button class="btn-secondary" data-action="leave-party">Leave Party</button>
    ${isLeader ? `
      <button class="btn-danger" data-action="disband-party">Disband</button>
    ` : ''}
  `;
}

/**
 * Render party creation form
 */
export function renderPartyCreationForm() {
  return `
    <div class="party-creation-form">
      <h3>Create Party</h3>

      <div class="form-group">
        <label>Party Name</label>
        <input type="text" name="partyName" placeholder="Enter party name..." />
      </div>

      <div class="form-group">
        <label>Party Size</label>
        <select name="partySize">
          ${Object.values(PARTY_SIZES).map(size => `
            <option value="${escapeHtml(size.id)}">${escapeHtml(size.name)} (max ${size.maxMembers})</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Loot Distribution</label>
        <select name="lootMode">
          ${Object.values(LOOT_MODES).map(mode => `
            <option value="${escapeHtml(mode.id)}">${escapeHtml(mode.name)} - ${escapeHtml(mode.description)}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Experience Sharing</label>
        <select name="expShareMode">
          ${Object.values(EXP_SHARE_MODES).map(mode => `
            <option value="${escapeHtml(mode.id)}">${escapeHtml(mode.name)} - ${escapeHtml(mode.description)}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="isPrivate" />
          Private Party (invite only)
        </label>
      </div>

      <div class="form-actions">
        <button class="btn-primary" data-action="submit-create-party">Create</button>
        <button class="btn-secondary" data-action="cancel-create">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render party settings form
 */
export function renderPartySettingsForm(state) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return '<div class="error">Not in a party</div>';
  }

  const settings = party.settings;

  return `
    <div class="party-settings-form">
      <h3>Party Settings</h3>

      <div class="form-group">
        <label>Loot Distribution</label>
        <select name="lootMode">
          ${Object.values(LOOT_MODES).map(mode => `
            <option value="${escapeHtml(mode.id)}" ${settings.lootMode === mode.id ? 'selected' : ''}>
              ${escapeHtml(mode.name)}
            </option>
          `).join('')}
        </select>
        <p class="help-text">${escapeHtml(LOOT_MODES[settings.lootMode.toUpperCase()]?.description || '')}</p>
      </div>

      <div class="form-group">
        <label>Experience Sharing</label>
        <select name="expShareMode">
          ${Object.values(EXP_SHARE_MODES).map(mode => `
            <option value="${escapeHtml(mode.id)}" ${settings.expShareMode === mode.id ? 'selected' : ''}>
              ${escapeHtml(mode.name)}
            </option>
          `).join('')}
        </select>
        <p class="help-text">${escapeHtml(EXP_SHARE_MODES[settings.expShareMode.toUpperCase()]?.description || '')}</p>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" name="isPrivate" ${settings.isPrivate ? 'checked' : ''} />
          Private Party
        </label>
      </div>

      <div class="form-actions">
        <button class="btn-primary" data-action="save-settings">Save</button>
        <button class="btn-secondary" data-action="cancel-settings">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render invite player form
 */
export function renderInviteForm() {
  return `
    <div class="invite-form">
      <h3>Invite Player</h3>

      <div class="form-group">
        <label>Player ID or Name</label>
        <input type="text" name="inviteeId" placeholder="Enter player ID..." />
      </div>

      <div class="form-actions">
        <button class="btn-primary" data-action="send-invite">Send Invite</button>
        <button class="btn-secondary" data-action="cancel-invite">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render party invite notification
 */
export function renderInviteNotification(invite) {
  return `
    <div class="party-invite-notification">
      <div class="invite-header">
        <span class="icon">&#9733;</span>
        <span class="title">Party Invite</span>
      </div>
      <div class="invite-content">
        <p><strong>${escapeHtml(invite.inviterId)}</strong> has invited you to join</p>
        <p class="party-name">${escapeHtml(invite.partyName)}</p>
      </div>
      <div class="invite-actions">
        <button class="btn-accept" data-action="accept-invite" data-party-id="${escapeHtml(invite.partyId)}">Join</button>
        <button class="btn-decline" data-action="decline-invite" data-party-id="${escapeHtml(invite.partyId)}">Decline</button>
      </div>
    </div>
  `;
}

/**
 * Render loot distribution notification
 */
export function renderLootDistribution(result) {
  const modeData = LOOT_MODES[result.mode.toUpperCase()];

  return `
    <div class="loot-distribution">
      <div class="loot-header">
        <span class="icon">&#128176;</span>
        <span class="title">Loot Distributed</span>
      </div>
      <div class="loot-content">
        <p class="item-name">${escapeHtml(result.item?.name || 'Item')}</p>
        ${result.recipient ? `
          <p class="recipient">Awarded to: <strong>${escapeHtml(result.recipient)}</strong></p>
        ` : `
          <p class="mode-info">${escapeHtml(modeData?.description || result.mode)}</p>
        `}
      </div>
    </div>
  `;
}

/**
 * Render experience share notification
 */
export function renderExpShare(result) {
  return `
    <div class="exp-share-notification">
      <div class="exp-header">
        <span class="icon">&#11088;</span>
        <span class="title">Experience Shared</span>
      </div>
      <div class="exp-content">
        <p>Total: ${result.totalShared.toLocaleString()} XP</p>
        <ul class="share-list">
          ${Object.entries(result.shares).map(([playerId, exp]) => `
            <li>
              <span class="player">${escapeHtml(playerId)}</span>
              <span class="exp">+${exp.toLocaleString()} XP</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Render party buffs display
 */
export function renderPartyBuffs(state) {
  const buffs = getActiveBuffs(state);

  if (buffs.length === 0) {
    return '<p class="no-buffs">No party buffs active</p>';
  }

  return `
    <div class="party-buffs-display">
      <h4>Active Buffs</h4>
      <div class="buffs-list">
        ${buffs.map(buff => `
          <div class="buff-card">
            <span class="buff-name">${escapeHtml(buff.name)}</span>
            <span class="buff-effect">${escapeHtml(buff.effect)}</span>
            <span class="buff-req">Requires ${buff.requirement}+ members</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render all available party buffs
 */
export function renderAllPartyBuffs(currentMemberCount = 0) {
  return `
    <div class="all-party-buffs">
      <h4>Party Buffs</h4>
      <div class="buffs-grid">
        ${Object.values(PARTY_BUFFS).map(buff => {
          const active = currentMemberCount >= buff.requirement;
          return `
            <div class="buff-card ${active ? 'active' : 'inactive'}">
              <span class="buff-name">${escapeHtml(buff.name)}</span>
              <span class="buff-effect">${escapeHtml(buff.effect)}</span>
              <span class="buff-req">${buff.requirement}+ members</span>
              ${active ? '<span class="status active">Active</span>' : '<span class="status locked">Locked</span>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render role selector for promotion
 */
export function renderRoleSelector(currentRole) {
  const availableRoles = Object.values(PARTY_ROLES).filter(r => r.id !== currentRole);

  return `
    <div class="role-selector">
      <select name="newRole">
        ${availableRoles.map(role => `
          <option value="${escapeHtml(role.id)}">${escapeHtml(role.name)}</option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render compact party display (for HUD)
 */
export function renderCompactPartyDisplay(state) {
  const stats = getPartyStats(state);

  if (!stats.inParty) {
    return '<span class="party-indicator none">Solo</span>';
  }

  const buffs = stats.activeBuffs;

  return `
    <div class="compact-party">
      <span class="party-name-short">${escapeHtml(stats.partyName.substring(0, 10))}</span>
      <span class="member-count">${stats.memberCount}/${stats.maxMembers}</span>
      ${buffs.length > 0 ? `<span class="buff-count">${buffs.length} buffs</span>` : ''}
    </div>
  `;
}

/**
 * Render party history
 */
export function renderPartyHistory(state, limit = 10) {
  const partyState = getPartyState(state);
  const history = partyState.partyHistory.slice(-limit).reverse();

  if (history.length === 0) {
    return '<p class="no-history">No party history</p>';
  }

  return `
    <div class="party-history">
      <h4>Recent Parties</h4>
      <ul class="history-list">
        ${history.map(entry => `
          <li class="history-entry">
            <span class="party-name">${escapeHtml(entry.partyName)}</span>
            <span class="date">${new Date(entry.joinedAt || entry.leftAt || entry.disbandedAt).toLocaleDateString()}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}
