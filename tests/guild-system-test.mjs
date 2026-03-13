/**
 * Guild System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  GUILD_RANKS,
  GUILD_PERMISSIONS,
  GUILD_ACTIVITIES,
  initGuildState,
  createGuild,
  getGuild,
  getPlayerGuild,
  hasPermission,
  inviteToGuild,
  acceptInvitation,
  leaveGuild,
  kickMember,
  promoteMember,
  depositToTreasury,
  withdrawFromTreasury,
  setMotd,
  transferLeadership,
  disbandGuild,
  addGuildExperience,
  getGuildLeaderboard,
  searchGuilds,
  getAllRanks,
  getGuildMembers
} from '../src/guild-system.js';

import {
  renderGuildCard,
  renderGuildBanner,
  renderMemberList,
  renderTreasuryPanel,
  renderRankBadge,
  renderGuildLeaderboard,
  renderInvitationList,
  renderGuildSearch,
  renderCreateGuildForm,
  renderGuildPage,
  renderRankPermissions
} from '../src/guild-system-ui.js';

describe('Guild System', () => {
  let state;

  beforeEach(() => {
    state = initGuildState({}).state;
  });

  describe('GUILD_RANKS', () => {
    it('has all ranks', () => {
      assert.ok(GUILD_RANKS.LEADER);
      assert.ok(GUILD_RANKS.OFFICER);
      assert.ok(GUILD_RANKS.VETERAN);
      assert.ok(GUILD_RANKS.MEMBER);
      assert.ok(GUILD_RANKS.RECRUIT);
    });

    it('leader has highest level', () => {
      assert.ok(GUILD_RANKS.LEADER.level > GUILD_RANKS.OFFICER.level);
    });
  });

  describe('initGuildState', () => {
    it('creates initial state', () => {
      assert.ok(state.guilds);
      assert.ok(state.guilds.allGuilds);
      assert.ok(state.guilds.playerGuilds);
    });
  });

  describe('createGuild', () => {
    it('creates a guild', () => {
      const result = createGuild(state, 'player1', 'Test Guild', 'TG');
      assert.ok(result.success);
      assert.ok(result.guild);
      assert.strictEqual(result.guild.name, 'Test Guild');
      assert.strictEqual(result.guild.tag, 'TG');
    });

    it('makes founder the leader', () => {
      const result = createGuild(state, 'player1', 'Test Guild', 'TG');
      assert.strictEqual(result.guild.leaderId, 'player1');
      assert.strictEqual(result.guild.members['player1'].rank, 'leader');
    });

    it('fails with short name', () => {
      const result = createGuild(state, 'player1', 'AB', 'TG');
      assert.ok(!result.success);
    });

    it('fails with invalid tag', () => {
      const result = createGuild(state, 'player1', 'Test Guild', 'T');
      assert.ok(!result.success);
    });

    it('fails if already in guild', () => {
      state = createGuild(state, 'player1', 'Test Guild', 'TG').state;
      const result = createGuild(state, 'player1', 'Another', 'AG');
      assert.ok(!result.success);
    });

    it('fails with duplicate name', () => {
      state = createGuild(state, 'player1', 'Test Guild', 'TG').state;
      const result = createGuild(state, 'player2', 'test guild', 'TG2');
      assert.ok(!result.success);
    });
  });

  describe('getGuild', () => {
    it('returns guild', () => {
      const createResult = createGuild(state, 'player1', 'Test', 'TG');
      state = createResult.state;
      const result = getGuild(state, createResult.guild.id);
      assert.ok(result.found);
    });

    it('returns not found', () => {
      const result = getGuild(state, 'invalid');
      assert.ok(!result.found);
    });
  });

  describe('getPlayerGuild', () => {
    it('returns player guild', () => {
      state = createGuild(state, 'player1', 'Test', 'TG').state;
      const result = getPlayerGuild(state, 'player1');
      assert.ok(result.found);
    });

    it('returns not found', () => {
      const result = getPlayerGuild(state, 'nobody');
      assert.ok(!result.found);
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
    });

    it('leader has all permissions', () => {
      assert.ok(hasPermission(state, 'leader', 'kick'));
      assert.ok(hasPermission(state, 'leader', 'invite'));
    });

    it('returns false for non-member', () => {
      assert.ok(!hasPermission(state, 'nobody', 'chat'));
    });
  });

  describe('inviteToGuild', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
    });

    it('invites player', () => {
      const result = inviteToGuild(state, 'leader', 'player2');
      assert.ok(result.success);
      assert.ok(result.state.guilds.invitations['player2']);
    });

    it('fails without permission', () => {
      const result = inviteToGuild(state, 'nobody', 'player2');
      assert.ok(!result.success);
    });

    it('fails if target in guild', () => {
      state = createGuild(state, 'player2', 'Other', 'OT').state;
      const result = inviteToGuild(state, 'leader', 'player2');
      assert.ok(!result.success);
    });
  });

  describe('acceptInvitation', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      state = inviteToGuild(state, 'leader', 'player2').state;
    });

    it('accepts invitation', () => {
      const guildId = getPlayerGuild(state, 'leader').guild.id;
      const result = acceptInvitation(state, 'player2', guildId);
      assert.ok(result.success);
      assert.ok(result.state.guilds.playerGuilds['player2']);
    });

    it('fails for invalid invitation', () => {
      const result = acceptInvitation(state, 'player2', 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('leaveGuild', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      state = inviteToGuild(state, 'leader', 'member').state;
      const guildId = getPlayerGuild(state, 'leader').guild.id;
      state = acceptInvitation(state, 'member', guildId).state;
    });

    it('member can leave', () => {
      const result = leaveGuild(state, 'member');
      assert.ok(result.success);
      assert.ok(!result.state.guilds.playerGuilds['member']);
    });

    it('leader cannot leave', () => {
      const result = leaveGuild(state, 'leader');
      assert.ok(!result.success);
    });
  });

  describe('kickMember', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      state = inviteToGuild(state, 'leader', 'member').state;
      const guildId = getPlayerGuild(state, 'leader').guild.id;
      state = acceptInvitation(state, 'member', guildId).state;
    });

    it('kicks member', () => {
      const result = kickMember(state, 'leader', 'member');
      assert.ok(result.success);
    });

    it('cannot kick leader', () => {
      const result = kickMember(state, 'member', 'leader');
      assert.ok(!result.success);
    });
  });

  describe('promoteMember', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      state = inviteToGuild(state, 'leader', 'member').state;
      const guildId = getPlayerGuild(state, 'leader').guild.id;
      state = acceptInvitation(state, 'member', guildId).state;
    });

    it('promotes member', () => {
      const result = promoteMember(state, 'leader', 'member');
      assert.ok(result.success);
      assert.ok(result.newRank);
    });
  });

  describe('depositToTreasury', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
    });

    it('deposits gold', () => {
      const result = depositToTreasury(state, 'leader', 100);
      assert.ok(result.success);
      assert.strictEqual(result.newBalance, 100);
    });

    it('fails with invalid amount', () => {
      const result = depositToTreasury(state, 'leader', -10);
      assert.ok(!result.success);
    });
  });

  describe('withdrawFromTreasury', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      state = depositToTreasury(state, 'leader', 500).state;
    });

    it('withdraws gold', () => {
      const result = withdrawFromTreasury(state, 'leader', 100);
      assert.ok(result.success);
      assert.strictEqual(result.newBalance, 400);
    });

    it('fails with insufficient funds', () => {
      const result = withdrawFromTreasury(state, 'leader', 1000);
      assert.ok(!result.success);
    });
  });

  describe('setMotd', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
    });

    it('sets MOTD', () => {
      const result = setMotd(state, 'leader', 'Hello guild!');
      assert.ok(result.success);
    });
  });

  describe('transferLeadership', () => {
    beforeEach(() => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      state = inviteToGuild(state, 'leader', 'member').state;
      const guildId = getPlayerGuild(state, 'leader').guild.id;
      state = acceptInvitation(state, 'member', guildId).state;
    });

    it('transfers leadership', () => {
      const result = transferLeadership(state, 'leader', 'member');
      assert.ok(result.success);
      const guild = getPlayerGuild(result.state, 'member').guild;
      assert.strictEqual(guild.leaderId, 'member');
    });
  });

  describe('disbandGuild', () => {
    it('disbands guild', () => {
      state = createGuild(state, 'leader', 'Test', 'TG').state;
      const result = disbandGuild(state, 'leader');
      assert.ok(result.success);
      assert.strictEqual(Object.keys(result.state.guilds.allGuilds).length, 0);
    });
  });

  describe('addGuildExperience', () => {
    it('adds experience', () => {
      const createResult = createGuild(state, 'leader', 'Test', 'TG');
      state = createResult.state;
      const result = addGuildExperience(state, createResult.guild.id, 500);
      assert.ok(result.success);
    });

    it('levels up', () => {
      const createResult = createGuild(state, 'leader', 'Test', 'TG');
      state = createResult.state;
      const result = addGuildExperience(state, createResult.guild.id, 1500);
      assert.ok(result.leveledUp);
    });
  });

  describe('getGuildLeaderboard', () => {
    it('returns leaderboard', () => {
      state = createGuild(state, 'p1', 'Guild1', 'G1').state;
      state = createGuild(state, 'p2', 'Guild2', 'G2').state;
      const lb = getGuildLeaderboard(state);
      assert.ok(lb.length === 2);
    });
  });

  describe('searchGuilds', () => {
    it('searches guilds', () => {
      state = createGuild(state, 'p1', 'Alpha Guild', 'AG').state;
      state = createGuild(state, 'p2', 'Beta Team', 'BT').state;
      const results = searchGuilds(state, 'alpha');
      assert.strictEqual(results.length, 1);
    });
  });

  describe('getAllRanks', () => {
    it('returns ranks', () => {
      const ranks = getAllRanks();
      assert.ok(ranks.length > 0);
    });
  });

  describe('getGuildMembers', () => {
    it('returns members', () => {
      const createResult = createGuild(state, 'leader', 'Test', 'TG');
      state = createResult.state;
      const result = getGuildMembers(state, createResult.guild.id);
      assert.ok(result.found);
      assert.strictEqual(result.members.length, 1);
    });
  });
});

describe('Guild System UI', () => {
  let state;
  let guildId;

  beforeEach(() => {
    state = initGuildState({}).state;
    const createResult = createGuild(state, 'leader', 'Test Guild', 'TG');
    state = createResult.state;
    guildId = createResult.guild.id;
    state = depositToTreasury(state, 'leader', 500).state;
  });

  describe('renderGuildCard', () => {
    it('renders card', () => {
      const guild = getGuild(state, guildId).guild;
      const html = renderGuildCard(guild);
      assert.ok(html.includes('guild-card'));
      assert.ok(html.includes('Test Guild'));
      assert.ok(html.includes('[TG]'));
    });
  });

  describe('renderGuildBanner', () => {
    it('renders banner', () => {
      const guild = getGuild(state, guildId).guild;
      const html = renderGuildBanner(guild);
      assert.ok(html.includes('guild-banner'));
      assert.ok(html.includes('Message of the Day'));
    });
  });

  describe('renderMemberList', () => {
    it('renders members', () => {
      const html = renderMemberList(state, guildId);
      assert.ok(html.includes('member-list'));
      assert.ok(html.includes('leader'));
    });
  });

  describe('renderTreasuryPanel', () => {
    it('renders treasury', () => {
      const html = renderTreasuryPanel(state, 'leader');
      assert.ok(html.includes('treasury-panel'));
      assert.ok(html.includes('500'));
    });
  });

  describe('renderRankBadge', () => {
    it('renders badge', () => {
      const html = renderRankBadge('leader');
      assert.ok(html.includes('rank-badge'));
      assert.ok(html.includes('Guild Leader'));
    });
  });

  describe('renderGuildLeaderboard', () => {
    it('renders leaderboard', () => {
      const html = renderGuildLeaderboard(state);
      assert.ok(html.includes('guild-leaderboard'));
    });
  });

  describe('renderInvitationList', () => {
    it('renders empty state', () => {
      const html = renderInvitationList(state, 'nobody');
      assert.ok(html.includes('No pending invitations'));
    });

    it('renders invitations', () => {
      state = inviteToGuild(state, 'leader', 'player2').state;
      const html = renderInvitationList(state, 'player2');
      assert.ok(html.includes('Accept'));
    });
  });

  describe('renderGuildSearch', () => {
    it('renders search', () => {
      const html = renderGuildSearch();
      assert.ok(html.includes('guild-search'));
      assert.ok(html.includes('input'));
    });
  });

  describe('renderCreateGuildForm', () => {
    it('renders form', () => {
      const html = renderCreateGuildForm();
      assert.ok(html.includes('create-guild-form'));
      assert.ok(html.includes('Guild Name'));
    });
  });

  describe('renderGuildPage', () => {
    it('renders page for member', () => {
      const html = renderGuildPage(state, 'leader');
      assert.ok(html.includes('guild-page'));
      assert.ok(html.includes('Test Guild'));
    });

    it('renders page for non-member', () => {
      const html = renderGuildPage(state, 'nobody');
      assert.ok(html.includes('You are not in a guild'));
    });
  });

  describe('renderRankPermissions', () => {
    it('renders permissions', () => {
      const html = renderRankPermissions('leader');
      assert.ok(html.includes('Guild Leader'));
      assert.ok(html.includes('all'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes guild names', () => {
      const maliciousState = createGuild(state, 'hacker', '<script>alert("xss")</script>', 'XSS');
      const guild = getGuild(maliciousState.state, maliciousState.guild.id).guild;
      const html = renderGuildCard(guild);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
