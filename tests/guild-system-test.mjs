/**
 * Guild System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  GUILD_RANK,
  GUILD_PERMISSION,
  GUILD_PERK,
  GUILD_QUESTS,
  createGuildSystemState,
  createGuild,
  getMaxMembers,
  getGuildLevelProgress,
  addGuildXp,
  addMember,
  removeMember,
  changeMemberRank,
  hasPermission,
  depositGold,
  withdrawGold,
  unlockPerk,
  getAvailablePerks,
  getGuildEffects,
  startGuildQuest,
  updateQuestProgress,
  getQuestStatus,
  disbandGuild,
  getGuildStats,
  validateGuild,
  escapeHtml
} from '../src/guild-system.js';

import {
  renderGuildPanel,
  renderCreateGuildForm,
  renderGuildBrowser,
  renderGuildHud,
  getGuildStyles
} from '../src/guild-system-ui.js';

// ============================================
// Constants Tests
// ============================================

describe('Guild System - Constants', () => {
  it('should define guild ranks', () => {
    assert.strictEqual(GUILD_RANK.LEADER, 'leader');
    assert.strictEqual(GUILD_RANK.OFFICER, 'officer');
    assert.strictEqual(GUILD_RANK.VETERAN, 'veteran');
    assert.strictEqual(GUILD_RANK.MEMBER, 'member');
    assert.strictEqual(GUILD_RANK.RECRUIT, 'recruit');
  });

  it('should define guild permissions', () => {
    assert.ok(GUILD_PERMISSION.INVITE);
    assert.ok(GUILD_PERMISSION.KICK);
    assert.ok(GUILD_PERMISSION.PROMOTE);
    assert.ok(GUILD_PERMISSION.DEMOTE);
    assert.ok(GUILD_PERMISSION.WITHDRAW_BANK);
    assert.ok(GUILD_PERMISSION.DEPOSIT_BANK);
    assert.ok(GUILD_PERMISSION.DISBAND);
  });

  it('should define guild perks', () => {
    assert.ok(GUILD_PERK.XP_BOOST);
    assert.ok(GUILD_PERK.GOLD_BOOST);
    assert.ok(GUILD_PERK.FAST_TRAVEL);
    assert.ok(GUILD_PERK.COMBAT_BONUS);
  });

  it('should have guild quests defined', () => {
    assert.ok(GUILD_QUESTS.weekly_hunt);
    assert.ok(GUILD_QUESTS.treasure_expedition);
    assert.ok(GUILD_QUESTS.dungeon_conquest);
  });

  it('should have valid quest structure', () => {
    const quest = GUILD_QUESTS.weekly_hunt;
    assert.ok(quest.id);
    assert.ok(quest.name);
    assert.ok(quest.target);
    assert.ok(quest.rewards);
  });
});

// ============================================
// State Creation Tests
// ============================================

describe('Guild System - State Creation', () => {
  it('should create initial guild system state', () => {
    const state = createGuildSystemState();
    assert.strictEqual(state.currentGuild, null);
    assert.ok(Array.isArray(state.guildInvites));
    assert.ok(state.contributionStats);
  });

  it('should have empty invites initially', () => {
    const state = createGuildSystemState();
    assert.strictEqual(state.guildInvites.length, 0);
  });

  it('should track contribution stats', () => {
    const state = createGuildSystemState();
    assert.strictEqual(state.contributionStats.totalGoldDonated, 0);
    assert.strictEqual(state.contributionStats.questsCompleted, 0);
  });
});

// ============================================
// Guild Creation Tests
// ============================================

describe('Guild System - Guild Creation', () => {
  it('should create a guild successfully', () => {
    const result = createGuild('Test Guild', {
      id: 'player1',
      name: 'Player One',
      gold: 1000
    });

    assert.ok(!result.error);
    assert.ok(result.guild);
    assert.strictEqual(result.guild.name, 'Test Guild');
    assert.strictEqual(result.guild.level, 1);
  });

  it('should set founder as leader', () => {
    const result = createGuild('Test Guild', {
      id: 'player1',
      name: 'Player One',
      gold: 1000
    });

    const founder = result.guild.members[0];
    assert.strictEqual(founder.id, 'player1');
    assert.strictEqual(founder.rank, GUILD_RANK.LEADER);
  });

  it('should reject short names', () => {
    const result = createGuild('AB', {
      id: 'player1',
      name: 'Player',
      gold: 1000
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('3 characters'));
  });

  it('should reject long names', () => {
    const result = createGuild('A'.repeat(35), {
      id: 'player1',
      name: 'Player',
      gold: 1000
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('30 characters'));
  });

  it('should reject special characters in name', () => {
    const result = createGuild('Test<script>', {
      id: 'player1',
      name: 'Player',
      gold: 1000
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('letters'));
  });

  it('should reject insufficient gold', () => {
    const result = createGuild('Test Guild', {
      id: 'player1',
      name: 'Player',
      gold: 100
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('gold'));
  });

  it('should set custom tag', () => {
    const result = createGuild('Test Guild', {
      id: 'player1',
      name: 'Player',
      gold: 1000
    }, { tag: 'TG' });
    assert.strictEqual(result.guild.tag, 'TG');
  });

  it('should auto-generate tag from name', () => {
    const result = createGuild('Test Guild', {
      id: 'player1',
      name: 'Player',
      gold: 1000
    });
    assert.strictEqual(result.guild.tag, 'TEST');
  });

  it('should initialize empty bank', () => {
    const result = createGuild('Test Guild', {
      id: 'player1',
      name: 'Player',
      gold: 1000
    });
    assert.strictEqual(result.guild.bank.gold, 0);
    assert.strictEqual(result.guild.bank.items.length, 0);
  });
});

// ============================================
// Member Management Tests
// ============================================

describe('Guild System - Member Management', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should add a member', () => {
    const result = addMember(guild, {
      id: 'player2',
      name: 'Player Two',
      level: 5
    });
    assert.ok(!result.error);
    assert.strictEqual(result.guild.members.length, 2);
  });

  it('should set new member as recruit', () => {
    const result = addMember(guild, {
      id: 'player2',
      name: 'Player Two',
      level: 5
    });
    const newMember = result.guild.members.find(m => m.id === 'player2');
    assert.strictEqual(newMember.rank, GUILD_RANK.RECRUIT);
  });

  it('should reject duplicate members', () => {
    addMember(guild, { id: 'player2', name: 'Player', level: 5 });
    const updated = { ...guild, members: [...guild.members, { id: 'player2', name: 'Player' }] };
    const result = addMember(updated, { id: 'player2', name: 'Player', level: 5 });
    assert.ok(result.error);
    assert.ok(result.error.includes('already'));
  });

  it('should enforce minimum level', () => {
    const guildWithMinLevel = {
      ...guild,
      settings: { ...guild.settings, minLevelToJoin: 10 }
    };
    const result = addMember(guildWithMinLevel, {
      id: 'player2',
      name: 'Player',
      level: 5
    });
    assert.ok(result.error);
    assert.ok(result.error.includes('level'));
  });

  it('should remove a member', () => {
    const { guild: withMember } = addMember(guild, {
      id: 'player2',
      name: 'Player',
      level: 5
    });
    const result = removeMember(withMember, 'player2', 'leader1');
    assert.ok(!result.error);
    assert.strictEqual(result.guild.members.length, 1);
  });

  it('should not remove the leader', () => {
    const result = removeMember(guild, 'leader1', 'leader1');
    assert.ok(result.error);
    assert.ok(result.error.includes('leader'));
  });

  it('should track inviter', () => {
    const result = addMember(guild, {
      id: 'player2',
      name: 'Player',
      level: 5
    }, 'leader1');
    const newMember = result.guild.members.find(m => m.id === 'player2');
    assert.strictEqual(newMember.invitedBy, 'leader1');
  });
});

// ============================================
// Rank System Tests
// ============================================

describe('Guild System - Rank System', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
    const { guild: withMember } = addMember(guild, {
      id: 'player2',
      name: 'Player',
      level: 5
    });
    guild = withMember;
  });

  it('should promote a member', () => {
    const result = changeMemberRank(guild, 'player2', GUILD_RANK.MEMBER, 'leader1');
    assert.ok(!result.error);
    const member = result.guild.members.find(m => m.id === 'player2');
    assert.strictEqual(member.rank, GUILD_RANK.MEMBER);
  });

  it('should demote a member', () => {
    // First promote
    let result = changeMemberRank(guild, 'player2', GUILD_RANK.VETERAN, 'leader1');
    // Then demote
    result = changeMemberRank(result.guild, 'player2', GUILD_RANK.MEMBER, 'leader1');
    const member = result.guild.members.find(m => m.id === 'player2');
    assert.strictEqual(member.rank, GUILD_RANK.MEMBER);
  });

  it('should not allow self-promotion', () => {
    const result = changeMemberRank(guild, 'player2', GUILD_RANK.OFFICER, 'player2');
    assert.ok(result.error);
    assert.ok(result.error.includes('own rank'));
  });

  it('should transfer leadership', () => {
    const result = changeMemberRank(guild, 'player2', GUILD_RANK.LEADER, 'leader1');
    assert.ok(!result.error);
    const newLeader = result.guild.members.find(m => m.id === 'player2');
    const oldLeader = result.guild.members.find(m => m.id === 'leader1');
    assert.strictEqual(newLeader.rank, GUILD_RANK.LEADER);
    assert.strictEqual(oldLeader.rank, GUILD_RANK.OFFICER);
  });

  it('should reject invalid rank', () => {
    const result = changeMemberRank(guild, 'player2', 'invalid_rank', 'leader1');
    assert.ok(result.error);
    assert.ok(result.error.includes('Invalid rank'));
  });
});

// ============================================
// Permission Tests
// ============================================

describe('Guild System - Permissions', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should grant all permissions to leader', () => {
    assert.ok(hasPermission(guild, 'leader1', GUILD_PERMISSION.INVITE));
    assert.ok(hasPermission(guild, 'leader1', GUILD_PERMISSION.KICK));
    assert.ok(hasPermission(guild, 'leader1', GUILD_PERMISSION.DISBAND));
  });

  it('should deny permissions to non-members', () => {
    assert.ok(!hasPermission(guild, 'nonmember', GUILD_PERMISSION.INVITE));
  });

  it('should limit recruit permissions', () => {
    const { guild: withMember } = addMember(guild, {
      id: 'recruit1',
      name: 'Recruit',
      level: 5
    });
    assert.ok(hasPermission(withMember, 'recruit1', GUILD_PERMISSION.DEPOSIT_BANK));
    assert.ok(!hasPermission(withMember, 'recruit1', GUILD_PERMISSION.KICK));
  });
});

// ============================================
// Guild Bank Tests
// ============================================

describe('Guild System - Guild Bank', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should deposit gold', () => {
    const result = depositGold(guild, 'leader1', 100);
    assert.ok(!result.error);
    assert.strictEqual(result.guild.bank.gold, 100);
  });

  it('should track contribution on deposit', () => {
    const result = depositGold(guild, 'leader1', 100);
    const leader = result.guild.members.find(m => m.id === 'leader1');
    assert.strictEqual(leader.contribution, 100);
  });

  it('should reject negative deposit', () => {
    const result = depositGold(guild, 'leader1', -50);
    assert.ok(result.error);
    assert.ok(result.error.includes('positive'));
  });

  it('should withdraw gold', () => {
    const { guild: withGold } = depositGold(guild, 'leader1', 200);
    const result = withdrawGold(withGold, 'leader1', 100);
    assert.ok(!result.error);
    assert.strictEqual(result.guild.bank.gold, 100);
  });

  it('should reject withdrawal exceeding balance', () => {
    const { guild: withGold } = depositGold(guild, 'leader1', 50);
    const result = withdrawGold(withGold, 'leader1', 100);
    assert.ok(result.error);
    assert.ok(result.error.includes('Insufficient'));
  });

  it('should update total gold donated stat', () => {
    const result = depositGold(guild, 'leader1', 100);
    assert.strictEqual(result.guild.stats.totalGoldDonated, 100);
  });
});

// ============================================
// Guild Level Tests
// ============================================

describe('Guild System - Guild Leveling', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should start at level 1', () => {
    assert.strictEqual(guild.level, 1);
    assert.strictEqual(guild.xp, 0);
  });

  it('should add XP', () => {
    const { guild: updated } = addGuildXp(guild, 50);
    assert.strictEqual(updated.xp, 50);
  });

  it('should level up when XP threshold reached', () => {
    const { guild: updated, levelUp } = addGuildXp(guild, 150);
    assert.strictEqual(updated.level, 2);
    assert.ok(levelUp);
    assert.strictEqual(levelUp.newLevel, 2);
  });

  it('should handle multiple level ups', () => {
    const { guild: updated } = addGuildXp(guild, 1000);
    assert.ok(updated.level > 2);
  });

  it('should track total XP earned', () => {
    const { guild: updated } = addGuildXp(guild, 100);
    assert.strictEqual(updated.stats.totalXpEarned, 100);
  });

  it('should calculate level progress', () => {
    const progress = getGuildLevelProgress(1, 50);
    assert.ok(progress.progress > 0);
    assert.ok(progress.xpNeeded > 0);
    assert.ok(!progress.isMaxLevel);
  });
});

// ============================================
// Max Members Tests
// ============================================

describe('Guild System - Max Members', () => {
  it('should return 10 for level 1', () => {
    assert.strictEqual(getMaxMembers(1), 10);
  });

  it('should increase with level', () => {
    assert.ok(getMaxMembers(5) > getMaxMembers(1));
    assert.ok(getMaxMembers(10) > getMaxMembers(5));
  });

  it('should cap at level 10 value', () => {
    assert.strictEqual(getMaxMembers(15), getMaxMembers(10));
  });
});

// ============================================
// Guild Perks Tests
// ============================================

describe('Guild System - Guild Perks', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
    guild.bank.gold = 5000;
    guild.level = 10;
  });

  it('should unlock a perk', () => {
    const result = unlockPerk(guild, GUILD_PERK.XP_BOOST, 'leader1');
    assert.ok(!result.error);
    assert.ok(result.guild.perks.includes(GUILD_PERK.XP_BOOST));
  });

  it('should deduct cost from bank', () => {
    const initialGold = guild.bank.gold;
    const result = unlockPerk(guild, GUILD_PERK.XP_BOOST, 'leader1');
    assert.ok(result.guild.bank.gold < initialGold);
  });

  it('should reject duplicate perk unlock', () => {
    const { guild: withPerk } = unlockPerk(guild, GUILD_PERK.XP_BOOST, 'leader1');
    const result = unlockPerk(withPerk, GUILD_PERK.XP_BOOST, 'leader1');
    assert.ok(result.error);
    assert.ok(result.error.includes('already'));
  });

  it('should enforce level requirement', () => {
    guild.level = 1;
    const result = unlockPerk(guild, GUILD_PERK.RARE_DROP_BOOST, 'leader1');
    assert.ok(result.error);
    assert.ok(result.error.includes('level'));
  });

  it('should reject insufficient funds', () => {
    guild.bank.gold = 10;
    const result = unlockPerk(guild, GUILD_PERK.XP_BOOST, 'leader1');
    assert.ok(result.error);
    assert.ok(result.error.includes('funds'));
  });

  it('should get available perks', () => {
    const perks = getAvailablePerks(guild);
    assert.ok(Array.isArray(perks));
    assert.ok(perks.length > 0);
    assert.ok(perks[0].id);
    assert.ok('unlocked' in perks[0]);
    assert.ok('canUnlock' in perks[0]);
  });

  it('should calculate guild effects', () => {
    const { guild: withPerk } = unlockPerk(guild, GUILD_PERK.XP_BOOST, 'leader1');
    const effects = getGuildEffects(withPerk);
    assert.ok(effects.xpMultiplier > 1);
  });

  it('should combine multiple perk effects', () => {
    let current = guild;
    current = unlockPerk(current, GUILD_PERK.XP_BOOST, 'leader1').guild;
    current = unlockPerk(current, GUILD_PERK.GOLD_BOOST, 'leader1').guild;
    const effects = getGuildEffects(current);
    assert.ok(effects.xpMultiplier > 1);
    assert.ok(effects.goldMultiplier > 1);
  });
});

// ============================================
// Guild Quests Tests
// ============================================

describe('Guild System - Guild Quests', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should start a quest', () => {
    const result = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    assert.ok(!result.error);
    assert.strictEqual(result.guild.activeQuests.length, 1);
  });

  it('should reject duplicate active quest', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const result = startGuildQuest(withQuest, 'weekly_hunt', 'leader1');
    assert.ok(result.error);
    assert.ok(result.error.includes('already'));
  });

  it('should update quest progress', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const result = updateQuestProgress(withQuest, 'weekly_hunt', 10, 'leader1');
    assert.ok(!result.error);
    const quest = result.guild.activeQuests.find(q => q.id === 'weekly_hunt');
    assert.strictEqual(quest.progress, 10);
  });

  it('should complete quest at target', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const result = updateQuestProgress(withQuest, 'weekly_hunt', 100, 'leader1');
    assert.ok(result.completed);
    assert.ok(result.rewards);
    assert.strictEqual(result.guild.activeQuests.length, 0);
  });

  it('should move completed quest to history', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const result = updateQuestProgress(withQuest, 'weekly_hunt', 100, 'leader1');
    assert.strictEqual(result.guild.completedQuests.length, 1);
  });

  it('should add rewards on completion', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const result = updateQuestProgress(withQuest, 'weekly_hunt', 100, 'leader1');
    assert.ok(result.guild.bank.gold > 0);
  });

  it('should get quest status', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const status = getQuestStatus(withQuest);
    assert.ok(status.active.length === 1);
    assert.ok(status.available.length > 0);
  });

  it('should track contributors', () => {
    const { guild: withQuest } = startGuildQuest(guild, 'weekly_hunt', 'leader1');
    const result = updateQuestProgress(withQuest, 'weekly_hunt', 10, 'leader1');
    const quest = result.guild.activeQuests.find(q => q.id === 'weekly_hunt');
    assert.ok(quest.contributors.includes('leader1'));
  });
});

// ============================================
// Guild Disband Tests
// ============================================

describe('Guild System - Guild Disband', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
    guild.bank.gold = 500;
  });

  it('should disband guild', () => {
    const result = disbandGuild(guild, 'leader1');
    assert.ok(result.disbanded);
    assert.strictEqual(result.guildId, guild.id);
  });

  it('should return bank gold', () => {
    const result = disbandGuild(guild, 'leader1');
    assert.strictEqual(result.goldReturned, 500);
  });

  it('should list former members', () => {
    const result = disbandGuild(guild, 'leader1');
    assert.ok(Array.isArray(result.formerMembers));
    assert.ok(result.formerMembers.includes('leader1'));
  });

  it('should reject non-leader disband', () => {
    const { guild: withMember } = addMember(guild, {
      id: 'member1',
      name: 'Member',
      level: 5
    });
    const result = disbandGuild(withMember, 'member1');
    assert.ok(result.error);
  });
});

// ============================================
// Guild Stats Tests
// ============================================

describe('Guild System - Guild Stats', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should return comprehensive stats', () => {
    const stats = getGuildStats(guild);
    assert.ok(stats.name);
    assert.ok(stats.level);
    assert.ok(stats.memberCount);
    assert.ok(stats.maxMembers);
    assert.ok(stats.levelProgress);
  });

  it('should count members by rank', () => {
    const stats = getGuildStats(guild);
    assert.ok(stats.membersByRank);
    assert.strictEqual(stats.membersByRank[GUILD_RANK.LEADER], 1);
  });

  it('should return top contributors', () => {
    const stats = getGuildStats(guild);
    assert.ok(Array.isArray(stats.topContributors));
  });

  it('should calculate guild age', () => {
    const stats = getGuildStats(guild);
    assert.ok(stats.age >= 0);
  });
});

// ============================================
// Validation Tests
// ============================================

describe('Guild System - Validation', () => {
  it('should validate correct guild', () => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    assert.ok(validateGuild(result.guild));
  });

  it('should reject null guild', () => {
    assert.ok(!validateGuild(null));
  });

  it('should reject guild without id', () => {
    assert.ok(!validateGuild({ name: 'Test', level: 1 }));
  });

  it('should reject guild without members', () => {
    assert.ok(!validateGuild({ id: 'g1', name: 'Test', level: 1, members: [] }));
  });

  it('should reject invalid level', () => {
    assert.ok(!validateGuild({ id: 'g1', name: 'Test', level: 0, members: [{}] }));
  });
});

// ============================================
// HTML Escaping Tests
// ============================================

describe('Guild System - HTML Escaping', () => {
  it('should escape HTML special characters', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
    assert.strictEqual(escapeHtml('"test"'), '&quot;test&quot;');
    assert.strictEqual(escapeHtml("'test'"), '&#039;test&#039;');
  });

  it('should handle non-string input', () => {
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(123), '');
  });
});

// ============================================
// UI Rendering Tests
// ============================================

describe('Guild System - UI Rendering', () => {
  let guild;

  beforeEach(() => {
    const result = createGuild('Test Guild', {
      id: 'leader1',
      name: 'Leader',
      gold: 1000
    });
    guild = result.guild;
  });

  it('should render guild panel', () => {
    const html = renderGuildPanel(guild, 'leader1');
    assert.ok(html.includes('guild-panel'));
    assert.ok(html.includes('Test Guild'));
  });

  it('should render no-guild panel when null', () => {
    const html = renderGuildPanel(null, 'player1');
    assert.ok(html.includes('No Guild'));
    assert.ok(html.includes('Create Guild'));
  });

  it('should show tabs when enabled', () => {
    const html = renderGuildPanel(guild, 'leader1', { showTabs: true });
    assert.ok(html.includes('guild-tabs'));
  });

  it('should render members list by default', () => {
    const html = renderGuildPanel(guild, 'leader1');
    assert.ok(html.includes('guild-members'));
    assert.ok(html.includes('Leader'));
  });

  it('should escape HTML in guild name', () => {
    guild.name = '<script>alert(1)</script>';
    const html = renderGuildPanel(guild, 'leader1');
    assert.ok(!html.includes('<script>alert'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('should render create guild form', () => {
    const html = renderCreateGuildForm(500);
    assert.ok(html.includes('Create Guild'));
    assert.ok(html.includes('500'));
  });

  it('should render guild browser', () => {
    const guilds = [guild];
    const html = renderGuildBrowser(guilds);
    assert.ok(html.includes('Browse Guilds'));
    assert.ok(html.includes('Test Guild'));
  });

  it('should render empty browser message', () => {
    const html = renderGuildBrowser([]);
    assert.ok(html.includes('No guilds found'));
  });

  it('should render guild HUD', () => {
    const html = renderGuildHud(guild);
    assert.ok(html.includes('guild-hud'));
    assert.ok(html.includes('TEST'));
  });

  it('should return empty HUD for no guild', () => {
    const html = renderGuildHud(null);
    assert.strictEqual(html, '');
  });

  it('should return CSS styles', () => {
    const styles = getGuildStyles();
    assert.ok(styles.includes('.guild-panel'));
    assert.ok(styles.includes('.member-row'));
  });
});

// ============================================
// Security Tests
// ============================================

describe('Guild System - Security', () => {
  it('should not contain banned words in source', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const srcPath = path.join(process.cwd(), 'src', 'guild-system.js');
    const uiPath = path.join(process.cwd(), 'src', 'guild-system-ui.js');

    const srcContent = fs.readFileSync(srcPath, 'utf8').toLowerCase();
    const uiContent = fs.readFileSync(uiPath, 'utf8').toLowerCase();
    const content = srcContent + uiContent;

    const bannedWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

    for (const word of bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      assert.ok(!regex.test(content), `Source contains banned word: ${word}`);
    }
  });

  it('should escape user-controlled guild name', () => {
    const result = createGuild('Safe Guild', {
      id: 'p1',
      name: '<script>xss</script>',
      gold: 1000
    });
    const html = renderGuildPanel(result.guild, 'p1');
    assert.ok(!html.includes('<script>xss'));
  });
});
