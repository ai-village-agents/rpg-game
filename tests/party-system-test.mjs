/**
 * Party System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  PARTY_ROLES,
  LOOT_MODES,
  PARTY_SIZES,
  EXP_SHARE_MODES,
  PARTY_BUFFS,
  initPartyState,
  getPartyState,
  createParty,
  inviteToParty,
  acceptInvite,
  declineInvite,
  leaveParty,
  kickMember,
  promoteMember,
  changePartySettings,
  distributeLoot,
  shareExperience,
  getActiveBuffs,
  getPartyMembers,
  getPartyStats,
  disbandParty,
  setPreferredRole,
  toggleAutoDecline,
  canPerformAction
} from '../src/party-system.js';

import {
  renderPartyPanel,
  renderPartyCreationForm,
  renderPartySettingsForm,
  renderInviteForm,
  renderInviteNotification,
  renderLootDistribution,
  renderExpShare,
  renderPartyBuffs,
  renderAllPartyBuffs,
  renderRoleSelector,
  renderCompactPartyDisplay,
  renderPartyHistory
} from '../src/party-system-ui.js';

describe('Party System', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      party: initPartyState()
    };
  });

  describe('Party Roles', () => {
    it('has all roles', () => {
      assert.ok(PARTY_ROLES.LEADER);
      assert.ok(PARTY_ROLES.OFFICER);
      assert.ok(PARTY_ROLES.MEMBER);
    });

    it('leader has all permissions', () => {
      assert.strictEqual(PARTY_ROLES.LEADER.canInvite, true);
      assert.strictEqual(PARTY_ROLES.LEADER.canKick, true);
      assert.strictEqual(PARTY_ROLES.LEADER.canPromote, true);
      assert.strictEqual(PARTY_ROLES.LEADER.canSetLoot, true);
    });

    it('member has no permissions', () => {
      assert.strictEqual(PARTY_ROLES.MEMBER.canInvite, false);
      assert.strictEqual(PARTY_ROLES.MEMBER.canKick, false);
      assert.strictEqual(PARTY_ROLES.MEMBER.canPromote, false);
    });
  });

  describe('Loot Modes', () => {
    it('has all loot modes', () => {
      assert.ok(LOOT_MODES.FREE_FOR_ALL);
      assert.ok(LOOT_MODES.ROUND_ROBIN);
      assert.ok(LOOT_MODES.NEED_GREED);
      assert.ok(LOOT_MODES.LEADER_ASSIGNS);
      assert.ok(LOOT_MODES.RANDOM);
    });

    it('each mode has description', () => {
      Object.values(LOOT_MODES).forEach(mode => {
        assert.ok(mode.description);
      });
    });
  });

  describe('Party Sizes', () => {
    it('has different sizes', () => {
      assert.ok(PARTY_SIZES.SMALL);
      assert.ok(PARTY_SIZES.STANDARD);
      assert.ok(PARTY_SIZES.RAID);
    });

    it('sizes increase', () => {
      assert.ok(PARTY_SIZES.SMALL.maxMembers < PARTY_SIZES.STANDARD.maxMembers);
      assert.ok(PARTY_SIZES.STANDARD.maxMembers < PARTY_SIZES.RAID.maxMembers);
    });
  });

  describe('initPartyState', () => {
    it('creates initial state', () => {
      const state = initPartyState();
      assert.strictEqual(state.currentParty, null);
      assert.deepStrictEqual(state.pendingInvites, []);
      assert.strictEqual(state.totalPartiesJoined, 0);
    });
  });

  describe('createParty', () => {
    it('creates a party', () => {
      const result = createParty(gameState, 'player1');

      assert.strictEqual(result.created, true);
      assert.ok(result.party);
      assert.strictEqual(result.party.leaderId, 'player1');
      assert.strictEqual(result.party.members.length, 1);
    });

    it('sets leader role for creator', () => {
      const result = createParty(gameState, 'player1');

      const leader = result.party.members[0];
      assert.strictEqual(leader.role, 'leader');
      assert.strictEqual(leader.playerId, 'player1');
    });

    it('uses default settings', () => {
      const result = createParty(gameState, 'player1');

      assert.strictEqual(result.party.settings.partySize, 'standard');
      assert.strictEqual(result.party.settings.lootMode, 'need_greed');
    });

    it('accepts custom options', () => {
      const result = createParty(gameState, 'player1', {
        name: 'Test Party',
        partySize: 'raid',
        lootMode: 'round_robin'
      });

      assert.strictEqual(result.party.name, 'Test Party');
      assert.strictEqual(result.party.settings.partySize, 'raid');
      assert.strictEqual(result.party.settings.lootMode, 'round_robin');
    });

    it('fails if already in party', () => {
      const first = createParty(gameState, 'player1');
      const second = createParty(first.state, 'player1');

      assert.strictEqual(second.created, false);
      assert.ok(second.error.includes('Already'));
    });

    it('fails with invalid party size', () => {
      const result = createParty(gameState, 'player1', { partySize: 'invalid' });

      assert.strictEqual(result.created, false);
    });

    it('increments parties led count', () => {
      const result = createParty(gameState, 'player1');

      assert.strictEqual(result.state.party.totalPartiesLed, 1);
    });
  });

  describe('inviteToParty', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader');
      partyState = result.state;
    });

    it('invites a player', () => {
      const result = inviteToParty(partyState, 'leader', 'player2');

      assert.strictEqual(result.invited, true);
      assert.ok(result.invite);
    });

    it('adds to pending invites', () => {
      const result = inviteToParty(partyState, 'leader', 'player2');

      assert.ok(result.state.party.currentParty.pendingInvites.includes('player2'));
    });

    it('fails when not in party', () => {
      const result = inviteToParty(gameState, 'leader', 'player2');

      assert.strictEqual(result.invited, false);
    });

    it('fails without invite permission', () => {
      // Add a member without invite permission
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });

      const result = inviteToParty(partyState, 'member', 'player3');

      assert.strictEqual(result.invited, false);
    });

    it('fails if already invited', () => {
      const first = inviteToParty(partyState, 'leader', 'player2');
      const second = inviteToParty(first.state, 'leader', 'player2');

      assert.strictEqual(second.invited, false);
      assert.ok(second.error.includes('Already invited'));
    });

    it('fails if party is full', () => {
      // Fill the party
      for (let i = 0; i < 5; i++) {
        partyState.party.currentParty.members.push({
          playerId: `player${i}`,
          role: 'member',
          joinedAt: Date.now()
        });
      }

      const result = inviteToParty(partyState, 'leader', 'newplayer');

      assert.strictEqual(result.invited, false);
      assert.ok(result.error.includes('full'));
    });
  });

  describe('acceptInvite', () => {
    it('joins a party', () => {
      const created = createParty(gameState, 'leader');
      const invited = inviteToParty(created.state, 'leader', 'player2');

      // Simulate player2 accepting
      const freshState = { party: initPartyState() };
      const result = acceptInvite(
        freshState,
        'player2',
        invited.state.party.currentParty.id,
        invited.state.party.currentParty
      );

      assert.strictEqual(result.joined, true);
      assert.ok(result.party);
    });

    it('fails if already in party', () => {
      const created = createParty(gameState, 'leader');
      const result = acceptInvite(created.state, 'leader', 'some_party', {});

      assert.strictEqual(result.joined, false);
    });

    it('increments parties joined count', () => {
      const freshState = { party: initPartyState() };
      const partyData = { id: 'party1', name: 'Test', members: [], pendingInvites: ['player2'] };
      const result = acceptInvite(freshState, 'player2', 'party1', partyData);

      assert.strictEqual(result.state.party.totalPartiesJoined, 1);
    });
  });

  describe('declineInvite', () => {
    it('removes invite from pending', () => {
      gameState.party.pendingInvites = [{ partyId: 'party1' }];
      const result = declineInvite(gameState, 'party1');

      assert.strictEqual(result.declined, true);
      assert.strictEqual(result.state.party.pendingInvites.length, 0);
    });
  });

  describe('leaveParty', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader');
      partyState = result.state;
    });

    it('leaves the party', () => {
      // Add another member first
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });

      const result = leaveParty(partyState, 'member');

      assert.strictEqual(result.left, true);
      assert.strictEqual(result.state.party.currentParty, null);
    });

    it('disbands party when leader leaves alone', () => {
      const result = leaveParty(partyState, 'leader');

      assert.strictEqual(result.disbanded, true);
    });

    it('promotes new leader when leader leaves', () => {
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });

      const result = leaveParty(partyState, 'leader');

      assert.ok(result.newLeader);
    });

    it('fails when not in party', () => {
      const result = leaveParty(gameState, 'someone');

      assert.strictEqual(result.left, false);
    });
  });

  describe('kickMember', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader');
      partyState = result.state;
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });
    });

    it('kicks a member', () => {
      const result = kickMember(partyState, 'leader', 'member');

      assert.strictEqual(result.kicked, true);
      assert.strictEqual(result.kickedPlayer, 'member');
    });

    it('fails without permission', () => {
      const result = kickMember(partyState, 'member', 'leader');

      assert.strictEqual(result.kicked, false);
    });

    it('cannot kick the leader', () => {
      // Promote member to officer with kick permission (simulated)
      partyState.party.currentParty.members[1].role = 'officer';

      const result = kickMember(partyState, 'leader', 'leader');

      // Even leader can't kick themselves as "leader"
      assert.strictEqual(result.kicked, false);
    });
  });

  describe('promoteMember', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader');
      partyState = result.state;
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });
    });

    it('promotes a member', () => {
      const result = promoteMember(partyState, 'leader', 'member', 'officer');

      assert.strictEqual(result.promoted, true);
      assert.strictEqual(result.newRole, 'officer');
    });

    it('transfers leadership when promoting to leader', () => {
      const result = promoteMember(partyState, 'leader', 'member', 'leader');

      assert.strictEqual(result.promoted, true);
      assert.strictEqual(result.state.party.currentParty.leaderId, 'member');
    });

    it('fails without permission', () => {
      const result = promoteMember(partyState, 'member', 'leader', 'officer');

      assert.strictEqual(result.promoted, false);
    });

    it('fails with invalid role', () => {
      const result = promoteMember(partyState, 'leader', 'member', 'invalid');

      assert.strictEqual(result.promoted, false);
    });
  });

  describe('changePartySettings', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader');
      partyState = result.state;
    });

    it('changes settings', () => {
      const result = changePartySettings(partyState, 'leader', { lootMode: 'random' });

      assert.strictEqual(result.changed, true);
      assert.strictEqual(result.newSettings.lootMode, 'random');
    });

    it('fails without permission', () => {
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });

      const result = changePartySettings(partyState, 'member', { lootMode: 'random' });

      assert.strictEqual(result.changed, false);
    });
  });

  describe('distributeLoot', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader', { lootMode: 'round_robin' });
      partyState = result.state;
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });
    });

    it('distributes loot', () => {
      const result = distributeLoot(partyState, { name: 'Sword' });

      assert.strictEqual(result.distributed, true);
      assert.ok(result.recipient);
    });

    it('round robin cycles through members', () => {
      const result1 = distributeLoot(partyState, { name: 'Item1' });
      const result2 = distributeLoot(result1.state, { name: 'Item2' });

      assert.notStrictEqual(result1.recipient, result2.recipient);
    });

    it('increments loot count', () => {
      const result = distributeLoot(partyState, { name: 'Item' });

      assert.strictEqual(result.state.party.currentParty.totalLootDistributed, 1);
    });

    it('fails when not in party', () => {
      const result = distributeLoot(gameState, { name: 'Item' });

      assert.strictEqual(result.distributed, false);
    });
  });

  describe('shareExperience', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader', { expShareMode: 'equal' });
      partyState = result.state;
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });
    });

    it('shares experience equally', () => {
      const result = shareExperience(partyState, 100);

      assert.strictEqual(result.shared, true);
      assert.strictEqual(result.shares['leader'], 50);
      assert.strictEqual(result.shares['member'], 50);
    });

    it('tracks total shared', () => {
      const result = shareExperience(partyState, 100);

      assert.strictEqual(result.state.party.currentParty.totalExpShared, 100);
    });

    it('shares by contribution when set', () => {
      partyState.party.currentParty.settings.expShareMode = 'contribution';
      const contributions = { leader: 80, member: 20 };

      const result = shareExperience(partyState, 100, null, contributions);

      assert.ok(result.shares['leader'] > result.shares['member']);
    });

    it('fails when not in party', () => {
      const result = shareExperience(gameState, 100);

      assert.strictEqual(result.shared, false);
    });
  });

  describe('getActiveBuffs', () => {
    it('returns empty for solo', () => {
      const buffs = getActiveBuffs(gameState);
      assert.deepStrictEqual(buffs, []);
    });

    it('returns buffs when party is large enough', () => {
      const result = createParty(gameState, 'leader');
      for (let i = 0; i < 5; i++) {
        result.state.party.currentParty.members.push({
          playerId: `player${i}`,
          role: 'member',
          joinedAt: Date.now()
        });
      }

      const buffs = getActiveBuffs(result.state);
      assert.ok(buffs.length > 0);
    });
  });

  describe('getPartyMembers', () => {
    it('returns empty when not in party', () => {
      const members = getPartyMembers(gameState);
      assert.deepStrictEqual(members, []);
    });

    it('returns members with role data', () => {
      const result = createParty(gameState, 'leader');
      const members = getPartyMembers(result.state);

      assert.strictEqual(members.length, 1);
      assert.ok(members[0].roleData);
    });
  });

  describe('getPartyStats', () => {
    it('returns stats for solo player', () => {
      const stats = getPartyStats(gameState);

      assert.strictEqual(stats.inParty, false);
      assert.strictEqual(stats.totalPartiesJoined, 0);
    });

    it('returns full stats when in party', () => {
      const result = createParty(gameState, 'leader');
      const stats = getPartyStats(result.state);

      assert.strictEqual(stats.inParty, true);
      assert.strictEqual(stats.memberCount, 1);
    });
  });

  describe('disbandParty', () => {
    it('disbands the party', () => {
      const created = createParty(gameState, 'leader');
      const result = disbandParty(created.state, 'leader');

      assert.strictEqual(result.disbanded, true);
      assert.strictEqual(result.state.party.currentParty, null);
    });

    it('fails when not leader', () => {
      const created = createParty(gameState, 'leader');
      created.state.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });

      const result = disbandParty(created.state, 'member');

      assert.strictEqual(result.disbanded, false);
    });
  });

  describe('setPreferredRole', () => {
    it('sets preferred role', () => {
      const result = setPreferredRole(gameState, 'officer');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.preferredRole, 'officer');
    });

    it('fails with invalid role', () => {
      const result = setPreferredRole(gameState, 'invalid');

      assert.strictEqual(result.success, false);
    });

    it('allows null role', () => {
      const result = setPreferredRole(gameState, null);

      assert.strictEqual(result.success, true);
    });
  });

  describe('toggleAutoDecline', () => {
    it('toggles auto decline', () => {
      const result = toggleAutoDecline(gameState, true);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.autoDeclineInvites, true);
    });
  });

  describe('canPerformAction', () => {
    let partyState;

    beforeEach(() => {
      const result = createParty(gameState, 'leader');
      partyState = result.state;
    });

    it('allows leader actions', () => {
      const result = canPerformAction(partyState, 'leader', 'canKick');

      assert.strictEqual(result.allowed, true);
    });

    it('denies member actions', () => {
      partyState.party.currentParty.members.push({
        playerId: 'member',
        role: 'member',
        joinedAt: Date.now()
      });

      const result = canPerformAction(partyState, 'member', 'canKick');

      assert.strictEqual(result.allowed, false);
    });

    it('fails when not in party', () => {
      const result = canPerformAction(gameState, 'someone', 'canKick');

      assert.strictEqual(result.allowed, false);
    });
  });
});

describe('Party System UI', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      party: initPartyState()
    };
  });

  describe('renderPartyPanel', () => {
    it('renders no party message', () => {
      const html = renderPartyPanel(gameState, 'player1');

      assert.ok(html.includes('No Party'));
      assert.ok(html.includes('Create Party'));
    });

    it('renders party when in one', () => {
      const created = createParty(gameState, 'leader');
      const html = renderPartyPanel(created.state, 'leader');

      assert.ok(html.includes('party-panel'));
      assert.ok(html.includes('Members'));
    });

    it('shows pending invites', () => {
      gameState.party.pendingInvites = [{
        partyId: 'party1',
        partyName: 'Test Party',
        inviterId: 'someone'
      }];

      const html = renderPartyPanel(gameState, 'player1');

      assert.ok(html.includes('Pending Invites'));
      assert.ok(html.includes('Test Party'));
    });
  });

  describe('renderPartyCreationForm', () => {
    it('renders form', () => {
      const html = renderPartyCreationForm();

      assert.ok(html.includes('party-creation-form'));
      assert.ok(html.includes('Party Name'));
      assert.ok(html.includes('Party Size'));
      assert.ok(html.includes('Loot Distribution'));
    });

    it('shows all party sizes', () => {
      const html = renderPartyCreationForm();

      Object.values(PARTY_SIZES).forEach(size => {
        assert.ok(html.includes(size.name));
      });
    });

    it('shows all loot modes', () => {
      const html = renderPartyCreationForm();

      Object.values(LOOT_MODES).forEach(mode => {
        assert.ok(html.includes(mode.name));
      });
    });
  });

  describe('renderPartySettingsForm', () => {
    it('returns error when not in party', () => {
      const html = renderPartySettingsForm(gameState);

      assert.ok(html.includes('error'));
    });

    it('renders settings form', () => {
      const created = createParty(gameState, 'leader');
      const html = renderPartySettingsForm(created.state);

      assert.ok(html.includes('party-settings-form'));
      assert.ok(html.includes('Loot Distribution'));
    });
  });

  describe('renderInviteForm', () => {
    it('renders invite form', () => {
      const html = renderInviteForm();

      assert.ok(html.includes('invite-form'));
      assert.ok(html.includes('Player ID'));
      assert.ok(html.includes('Send Invite'));
    });
  });

  describe('renderInviteNotification', () => {
    it('renders notification', () => {
      const invite = {
        partyId: 'party1',
        partyName: 'Test Party',
        inviterId: 'leader'
      };

      const html = renderInviteNotification(invite);

      assert.ok(html.includes('party-invite-notification'));
      assert.ok(html.includes('Test Party'));
      assert.ok(html.includes('leader'));
    });
  });

  describe('renderLootDistribution', () => {
    it('renders distribution', () => {
      const result = {
        mode: 'round_robin',
        recipient: 'player1',
        item: { name: 'Sword' }
      };

      const html = renderLootDistribution(result);

      assert.ok(html.includes('loot-distribution'));
      assert.ok(html.includes('Sword'));
      assert.ok(html.includes('player1'));
    });
  });

  describe('renderExpShare', () => {
    it('renders experience share', () => {
      const result = {
        totalShared: 1000,
        shares: { player1: 500, player2: 500 }
      };

      const html = renderExpShare(result);

      assert.ok(html.includes('exp-share-notification'));
      assert.ok(html.includes('1,000'));
      assert.ok(html.includes('500'));
    });
  });

  describe('renderPartyBuffs', () => {
    it('renders no buffs message', () => {
      const html = renderPartyBuffs(gameState);

      assert.ok(html.includes('No party buffs'));
    });

    it('renders active buffs', () => {
      const created = createParty(gameState, 'leader');
      for (let i = 0; i < 5; i++) {
        created.state.party.currentParty.members.push({
          playerId: `player${i}`,
          role: 'member',
          joinedAt: Date.now()
        });
      }

      const html = renderPartyBuffs(created.state);

      assert.ok(html.includes('buff-card') || html.includes('party-buffs-display'));
    });
  });

  describe('renderAllPartyBuffs', () => {
    it('renders all buffs', () => {
      const html = renderAllPartyBuffs(0);

      assert.ok(html.includes('all-party-buffs'));
      Object.values(PARTY_BUFFS).forEach(buff => {
        assert.ok(html.includes(buff.name));
      });
    });

    it('marks active buffs', () => {
      const html = renderAllPartyBuffs(6);

      assert.ok(html.includes('active'));
    });
  });

  describe('renderRoleSelector', () => {
    it('renders role options', () => {
      const html = renderRoleSelector('member');

      assert.ok(html.includes('role-selector'));
      assert.ok(html.includes('Leader') || html.includes('Officer'));
    });
  });

  describe('renderCompactPartyDisplay', () => {
    it('renders solo indicator', () => {
      const html = renderCompactPartyDisplay(gameState);

      assert.ok(html.includes('Solo'));
    });

    it('renders party info', () => {
      const created = createParty(gameState, 'leader', { name: 'Test Party' });
      const html = renderCompactPartyDisplay(created.state);

      assert.ok(html.includes('compact-party'));
      assert.ok(html.includes('1/'));
    });
  });

  describe('renderPartyHistory', () => {
    it('renders no history message', () => {
      const html = renderPartyHistory(gameState);

      assert.ok(html.includes('No party history'));
    });

    it('renders history entries', () => {
      gameState.party.partyHistory = [
        { partyId: 'p1', partyName: 'Old Party', joinedAt: Date.now() }
      ];

      const html = renderPartyHistory(gameState);

      assert.ok(html.includes('Old Party'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes party name', () => {
      const created = createParty(gameState, 'leader', { name: '<script>alert("xss")</script>' });
      const html = renderPartyPanel(created.state, 'leader');

      assert.ok(!html.includes('<script>alert'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes player IDs', () => {
      const invite = {
        partyId: 'party1',
        partyName: 'Test',
        inviterId: '<img onerror="evil()">'
      };

      const html = renderInviteNotification(invite);

      assert.ok(!html.includes('<img onerror'));
      assert.ok(html.includes('&lt;img'));
    });
  });
});
