/**
 * Guild System UI - Rendering functions for guild management
 */

import {
  GUILD_RANKS,
  GUILD_PERMISSIONS,
  GUILD_ACTIVITIES,
  getGuild,
  getPlayerGuild,
  hasPermission,
  getGuildLeaderboard,
  getGuildMembers,
  getAllRanks
} from './guild-system.js';

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatNumber(num) {
  return num.toLocaleString();
}

export function renderGuildCard(guild, options = {}) {
  const { showDetails = true } = options;
  return '<div class="guild-card" data-guild-id="' + escapeHtml(guild.id) + '">' +
    '<div class="guild-header">' +
      '<span class="guild-tag">[' + escapeHtml(guild.tag) + ']</span>' +
      '<span class="guild-name">' + escapeHtml(guild.name) + '</span>' +
    '</div>' +
    '<div class="guild-info">' +
      '<span class="guild-level">Lv. ' + guild.level + '</span>' +
      '<span class="guild-members">' + guild.memberCount + '/' + guild.maxMembers + ' members</span>' +
    '</div>' +
    (showDetails ? '<div class="guild-treasury">Treasury: ' + formatNumber(guild.treasury.gold) + ' gold</div>' : '') +
  '</div>';
}

export function renderGuildBanner(guild) {
  return '<div class="guild-banner">' +
    '<div class="banner-content">' +
      '<h1 class="guild-name">[' + escapeHtml(guild.tag) + '] ' + escapeHtml(guild.name) + '</h1>' +
      '<div class="guild-stats">' +
        '<span class="stat">Level ' + guild.level + '</span>' +
        '<span class="stat">' + guild.memberCount + ' Members</span>' +
        '<span class="stat">' + formatNumber(guild.treasury.gold) + ' Gold</span>' +
      '</div>' +
    '</div>' +
    '<div class="guild-motd">' +
      '<h3>Message of the Day</h3>' +
      '<p>' + escapeHtml(guild.motd) + '</p>' +
    '</div>' +
  '</div>';
}

export function renderMemberList(state, guildId, currentPlayerId = null) {
  const result = getGuildMembers(state, guildId);
  if (!result.found) return '<div class="member-list empty">Guild not found</div>';

  const memberRows = result.members.map(m => {
    const isCurrent = m.playerId === currentPlayerId;
    return '<div class="member-row' + (isCurrent ? ' current' : '') + (m.isLeader ? ' leader' : '') + '">' +
      '<span class="member-name">' + escapeHtml(m.playerId) + '</span>' +
      '<span class="member-rank">' + escapeHtml(m.rankName) + '</span>' +
      '<span class="member-contribution">' + formatNumber(m.contribution) + ' contributed</span>' +
    '</div>';
  }).join('');

  return '<div class="member-list">' +
    '<div class="list-header"><span>Member</span><span>Rank</span><span>Contribution</span></div>' +
    '<div class="list-body">' + memberRows + '</div>' +
  '</div>';
}

export function renderTreasuryPanel(state, playerId) {
  const result = getPlayerGuild(state, playerId);
  if (!result.found) return '<div class="treasury-panel empty">Not in a guild</div>';
  const guild = result.guild;
  const canWithdraw = hasPermission(state, playerId, 'treasury_withdraw');
  const canDeposit = hasPermission(state, playerId, 'treasury_deposit');

  const logEntries = guild.treasury.log.slice(-10).reverse().map(entry => {
    return '<div class="log-entry ' + entry.type + '">' +
      '<span class="log-type">' + escapeHtml(entry.type) + '</span>' +
      '<span class="log-player">' + escapeHtml(entry.playerId) + '</span>' +
      '<span class="log-amount">' + formatNumber(entry.amount) + '</span>' +
    '</div>';
  }).join('');

  return '<div class="treasury-panel">' +
    '<div class="treasury-balance">' +
      '<span class="label">Guild Treasury</span>' +
      '<span class="amount">' + formatNumber(guild.treasury.gold) + ' / ' + formatNumber(guild.treasury.maxGold) + '</span>' +
    '</div>' +
    '<div class="treasury-actions">' +
      (canDeposit ? '<button class="btn deposit" data-action="deposit">Deposit</button>' : '') +
      (canWithdraw ? '<button class="btn withdraw" data-action="withdraw">Withdraw</button>' : '') +
    '</div>' +
    '<div class="treasury-log"><h4>Recent Transactions</h4>' + (logEntries || '<p>No transactions</p>') + '</div>' +
  '</div>';
}

export function renderRankBadge(rankId) {
  const rank = Object.values(GUILD_RANKS).find(r => r.id === rankId);
  if (!rank) return '<span class="rank-badge unknown">Unknown</span>';
  return '<span class="rank-badge rank-' + rank.id + '">' + escapeHtml(rank.name) + '</span>';
}

export function renderGuildLeaderboard(state, sortBy = 'level', limit = 10) {
  const leaderboard = getGuildLeaderboard(state, sortBy, limit);
  if (leaderboard.length === 0) return '<div class="guild-leaderboard empty">No guilds found</div>';

  const rows = leaderboard.map(guild => {
    return '<div class="leaderboard-row">' +
      '<span class="rank">#' + guild.rank + '</span>' +
      '<span class="guild-info">[' + escapeHtml(guild.tag) + '] ' + escapeHtml(guild.name) + '</span>' +
      '<span class="level">Lv. ' + guild.level + '</span>' +
      '<span class="members">' + guild.memberCount + '</span>' +
    '</div>';
  }).join('');

  return '<div class="guild-leaderboard">' +
    '<div class="leaderboard-header"><span>Rank</span><span>Guild</span><span>Level</span><span>Members</span></div>' +
    '<div class="leaderboard-body">' + rows + '</div>' +
  '</div>';
}

export function renderInvitationList(state, playerId) {
  const invites = state.guilds.invitations[playerId] || [];
  if (invites.length === 0) return '<div class="invitation-list empty">No pending invitations</div>';

  const rows = invites.map(inv => {
    return '<div class="invitation-row">' +
      '<span class="guild-name">' + escapeHtml(inv.guildName) + '</span>' +
      '<span class="inviter">From: ' + escapeHtml(inv.inviterId) + '</span>' +
      '<button class="btn accept" data-action="accept-invite" data-guild-id="' + escapeHtml(inv.guildId) + '">Accept</button>' +
      '<button class="btn decline" data-action="decline-invite" data-guild-id="' + escapeHtml(inv.guildId) + '">Decline</button>' +
    '</div>';
  }).join('');

  return '<div class="invitation-list"><h4>Guild Invitations</h4>' + rows + '</div>';
}

export function renderGuildSearch(query = '') {
  return '<div class="guild-search">' +
    '<input type="text" class="search-input" placeholder="Search guilds..." value="' + escapeHtml(query) + '">' +
    '<button class="btn search" data-action="search">Search</button>' +
  '</div>';
}

export function renderCreateGuildForm() {
  return '<div class="create-guild-form">' +
    '<h3>Create New Guild</h3>' +
    '<div class="form-group"><label>Guild Name</label><input type="text" class="guild-name-input" maxlength="32" placeholder="3-32 characters"></div>' +
    '<div class="form-group"><label>Guild Tag</label><input type="text" class="guild-tag-input" maxlength="5" placeholder="2-5 characters"></div>' +
    '<button class="btn create" data-action="create-guild">Create Guild</button>' +
  '</div>';
}

export function renderGuildPage(state, playerId, selectedGuildId = null) {
  const playerGuild = getPlayerGuild(state, playerId);
  let content;

  if (playerGuild.found) {
    const guild = playerGuild.guild;
    content = renderGuildBanner(guild) +
      '<div class="guild-content">' +
        '<div class="main-panel">' + renderMemberList(state, guild.id, playerId) + '</div>' +
        '<div class="side-panel">' + renderTreasuryPanel(state, playerId) + '</div>' +
      '</div>';
  } else {
    content = '<div class="no-guild">' +
      '<h2>You are not in a guild</h2>' +
      renderCreateGuildForm() +
      renderInvitationList(state, playerId) +
      '<h3>Top Guilds</h3>' +
      renderGuildLeaderboard(state) +
    '</div>';
  }

  return '<div class="guild-page"><header class="page-header"><h1>Guild</h1></header><div class="page-content">' + content + '</div></div>';
}

export function renderRankPermissions(rankId) {
  const rank = Object.values(GUILD_RANKS).find(r => r.id === rankId);
  if (!rank) return '<div class="rank-permissions empty">Unknown rank</div>';

  const perms = rank.permissions.map(p => '<li>' + escapeHtml(p) + '</li>').join('');
  return '<div class="rank-permissions"><h4>' + escapeHtml(rank.name) + ' Permissions</h4><ul>' + perms + '</ul></div>';
}
