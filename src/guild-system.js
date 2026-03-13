/**
 * Guild System - Player organizations with ranks, treasury, and activities
 */

// Guild ranks with permissions
export const GUILD_RANKS = {
  LEADER: {
    id: 'leader',
    name: 'Guild Leader',
    level: 5,
    permissions: ['all']
  },
  OFFICER: {
    id: 'officer',
    name: 'Officer',
    level: 4,
    permissions: ['invite', 'kick', 'promote', 'treasury_withdraw', 'set_motd', 'manage_events']
  },
  VETERAN: {
    id: 'veteran',
    name: 'Veteran',
    level: 3,
    permissions: ['invite', 'treasury_deposit', 'view_treasury']
  },
  MEMBER: {
    id: 'member',
    name: 'Member',
    level: 2,
    permissions: ['treasury_deposit', 'view_treasury', 'chat']
  },
  RECRUIT: {
    id: 'recruit',
    name: 'Recruit',
    level: 1,
    permissions: ['chat']
  }
};

// Guild permissions
export const GUILD_PERMISSIONS = {
  ALL: 'all',
  INVITE: 'invite',
  KICK: 'kick',
  PROMOTE: 'promote',
  DEMOTE: 'demote',
  TREASURY_DEPOSIT: 'treasury_deposit',
  TREASURY_WITHDRAW: 'treasury_withdraw',
  VIEW_TREASURY: 'view_treasury',
  SET_MOTD: 'set_motd',
  MANAGE_EVENTS: 'manage_events',
  CHAT: 'chat'
};

// Guild activity types
export const GUILD_ACTIVITIES = {
  RAID: { id: 'raid', name: 'Guild Raid', minMembers: 5, rewardMultiplier: 2.0 },
  DUNGEON: { id: 'dungeon', name: 'Guild Dungeon', minMembers: 3, rewardMultiplier: 1.5 },
  WAR: { id: 'war', name: 'Guild War', minMembers: 10, rewardMultiplier: 3.0 },
  TOURNAMENT: { id: 'tournament', name: 'Tournament', minMembers: 4, rewardMultiplier: 1.75 }
};

function generateGuildId() {
  return 'guild_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function initGuildState(state) {
  return {
    state: {
      ...state,
      guilds: {
        allGuilds: {},
        playerGuilds: {},
        invitations: {},
        stats: { totalGuilds: 0, totalMembers: 0 }
      }
    },
    success: true
  };
}

export function createGuild(state, founderId, name, tag) {
  if (!founderId || !name || !tag) return { success: false, error: 'Missing required fields' };
  if (name.length < 3 || name.length > 32) return { success: false, error: 'Name must be 3-32 characters' };
  if (tag.length < 2 || tag.length > 5) return { success: false, error: 'Tag must be 2-5 characters' };
  if (state.guilds.playerGuilds[founderId]) return { success: false, error: 'Player already in a guild' };
  
  const existing = Object.values(state.guilds.allGuilds).find(g => g.name.toLowerCase() === name.toLowerCase());
  if (existing) return { success: false, error: 'Guild name already taken' };

  const guildId = generateGuildId();
  const guild = {
    id: guildId, name, tag: tag.toUpperCase(), description: '', motd: 'Welcome to the guild!',
    leaderId: founderId,
    members: { [founderId]: { playerId: founderId, rank: 'leader', joinedAt: Date.now(), contribution: 0 } },
    memberCount: 1, maxMembers: 50, level: 1, experience: 0, experienceToNextLevel: 1000,
    treasury: { gold: 0, maxGold: 10000, log: [] },
    upgrades: { treasury_capacity: 0, member_capacity: 0, xp_bonus: 0, gold_bonus: 0 },
    createdAt: Date.now(),
    stats: { raidsCompleted: 0, dungeonsCompleted: 0, warsWon: 0, totalContributions: 0 }
  };

  return {
    success: true,
    state: {
      ...state,
      guilds: {
        ...state.guilds,
        allGuilds: { ...state.guilds.allGuilds, [guildId]: guild },
        playerGuilds: { ...state.guilds.playerGuilds, [founderId]: guildId },
        stats: { totalGuilds: state.guilds.stats.totalGuilds + 1, totalMembers: state.guilds.stats.totalMembers + 1 }
      }
    },
    guild
  };
}

export function getGuild(state, guildId) {
  const guild = state.guilds.allGuilds[guildId];
  return guild ? { found: true, guild } : { found: false };
}

export function getPlayerGuild(state, playerId) {
  const guildId = state.guilds.playerGuilds[playerId];
  return guildId ? getGuild(state, guildId) : { found: false };
}

export function hasPermission(state, playerId, permission) {
  const result = getPlayerGuild(state, playerId);
  if (!result.found) return false;
  const member = result.guild.members[playerId];
  if (!member) return false;
  const rank = Object.values(GUILD_RANKS).find(r => r.id === member.rank);
  return rank && (rank.permissions.includes('all') || rank.permissions.includes(permission));
}

export function inviteToGuild(state, inviterId, targetPlayerId) {
  if (!hasPermission(state, inviterId, 'invite')) return { success: false, error: 'No permission to invite' };
  if (state.guilds.playerGuilds[targetPlayerId]) return { success: false, error: 'Player already in a guild' };
  const result = getPlayerGuild(state, inviterId);
  if (!result.found) return { success: false, error: 'Inviter not in a guild' };
  const guild = result.guild;
  if (guild.memberCount >= guild.maxMembers) return { success: false, error: 'Guild is full' };

  const inviteId = 'invite_' + Date.now();
  const newInvitations = {
    ...state.guilds.invitations,
    [targetPlayerId]: [...(state.guilds.invitations[targetPlayerId] || []), {
      id: inviteId, guildId: guild.id, guildName: guild.name, inviterId,
      createdAt: Date.now(), expiresAt: Date.now() + 604800000
    }]
  };

  return { success: true, state: { ...state, guilds: { ...state.guilds, invitations: newInvitations } }, inviteId };
}

export function acceptInvitation(state, playerId, guildId) {
  const invites = state.guilds.invitations[playerId] || [];
  const invite = invites.find(i => i.guildId === guildId);
  if (!invite) return { success: false, error: 'Invitation not found' };
  if (Date.now() > invite.expiresAt) return { success: false, error: 'Invitation expired' };
  if (state.guilds.playerGuilds[playerId]) return { success: false, error: 'Already in a guild' };
  
  const guild = state.guilds.allGuilds[guildId];
  if (!guild) return { success: false, error: 'Guild not found' };
  if (guild.memberCount >= guild.maxMembers) return { success: false, error: 'Guild is full' };

  const updatedGuild = {
    ...guild,
    members: { ...guild.members, [playerId]: { playerId, rank: 'recruit', joinedAt: Date.now(), contribution: 0 } },
    memberCount: guild.memberCount + 1
  };

  return {
    success: true,
    state: {
      ...state,
      guilds: {
        ...state.guilds,
        allGuilds: { ...state.guilds.allGuilds, [guildId]: updatedGuild },
        playerGuilds: { ...state.guilds.playerGuilds, [playerId]: guildId },
        invitations: { ...state.guilds.invitations, [playerId]: invites.filter(i => i.guildId !== guildId) },
        stats: { ...state.guilds.stats, totalMembers: state.guilds.stats.totalMembers + 1 }
      }
    },
    guild: updatedGuild
  };
}

export function leaveGuild(state, playerId) {
  const result = getPlayerGuild(state, playerId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  if (guild.leaderId === playerId) return { success: false, error: 'Leader cannot leave. Transfer leadership or disband.' };

  const { [playerId]: removed, ...remainingMembers } = guild.members;
  const { [playerId]: removedPlayer, ...remainingPlayerGuilds } = state.guilds.playerGuilds;

  return {
    success: true,
    state: {
      ...state,
      guilds: {
        ...state.guilds,
        allGuilds: { ...state.guilds.allGuilds, [guild.id]: { ...guild, members: remainingMembers, memberCount: guild.memberCount - 1 } },
        playerGuilds: remainingPlayerGuilds,
        stats: { ...state.guilds.stats, totalMembers: state.guilds.stats.totalMembers - 1 }
      }
    }
  };
}

export function kickMember(state, kickerId, targetPlayerId) {
  if (!hasPermission(state, kickerId, 'kick')) return { success: false, error: 'No permission to kick' };
  const result = getPlayerGuild(state, kickerId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  if (!guild.members[targetPlayerId]) return { success: false, error: 'Target not in guild' };
  if (guild.leaderId === targetPlayerId) return { success: false, error: 'Cannot kick the leader' };

  const kickerRank = Object.values(GUILD_RANKS).find(r => r.id === guild.members[kickerId].rank);
  const targetRank = Object.values(GUILD_RANKS).find(r => r.id === guild.members[targetPlayerId].rank);
  if (targetRank.level >= kickerRank.level) return { success: false, error: 'Cannot kick someone of equal or higher rank' };

  const { [targetPlayerId]: removedMember, ...remainingMembers } = guild.members;
  const { [targetPlayerId]: removedPlayer, ...remainingPlayerGuilds } = state.guilds.playerGuilds;

  return {
    success: true,
    state: {
      ...state,
      guilds: {
        ...state.guilds,
        allGuilds: { ...state.guilds.allGuilds, [guild.id]: { ...guild, members: remainingMembers, memberCount: guild.memberCount - 1 } },
        playerGuilds: remainingPlayerGuilds,
        stats: { ...state.guilds.stats, totalMembers: state.guilds.stats.totalMembers - 1 }
      }
    }
  };
}

export function promoteMember(state, promoterId, targetPlayerId) {
  if (!hasPermission(state, promoterId, 'promote')) return { success: false, error: 'No permission to promote' };
  const result = getPlayerGuild(state, promoterId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  const member = guild.members[targetPlayerId];
  if (!member) return { success: false, error: 'Target not in guild' };

  const currentRank = Object.values(GUILD_RANKS).find(r => r.id === member.rank);
  const promoterRank = Object.values(GUILD_RANKS).find(r => r.id === guild.members[promoterId].rank);
  if (currentRank.level >= promoterRank.level - 1) return { success: false, error: 'Cannot promote to or above your rank' };

  const nextRank = Object.values(GUILD_RANKS).find(r => r.level === currentRank.level + 1);
  if (!nextRank || nextRank.id === 'leader') return { success: false, error: 'Already at maximum rank' };

  return {
    success: true,
    state: {
      ...state,
      guilds: {
        ...state.guilds,
        allGuilds: { ...state.guilds.allGuilds, [guild.id]: { ...guild, members: { ...guild.members, [targetPlayerId]: { ...member, rank: nextRank.id } } } }
      }
    },
    newRank: nextRank
  };
}

export function depositToTreasury(state, playerId, amount) {
  if (!hasPermission(state, playerId, 'treasury_deposit')) return { success: false, error: 'No permission to deposit' };
  if (amount <= 0) return { success: false, error: 'Invalid amount' };
  const result = getPlayerGuild(state, playerId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  if (guild.treasury.gold + amount > guild.treasury.maxGold) return { success: false, error: 'Would exceed treasury capacity' };

  const logEntry = { type: 'deposit', playerId, amount, timestamp: Date.now() };
  const updatedGuild = {
    ...guild,
    members: { ...guild.members, [playerId]: { ...guild.members[playerId], contribution: guild.members[playerId].contribution + amount } },
    treasury: { ...guild.treasury, gold: guild.treasury.gold + amount, log: [...guild.treasury.log.slice(-99), logEntry] },
    stats: { ...guild.stats, totalContributions: guild.stats.totalContributions + amount }
  };

  return { success: true, state: { ...state, guilds: { ...state.guilds, allGuilds: { ...state.guilds.allGuilds, [guild.id]: updatedGuild } } }, newBalance: updatedGuild.treasury.gold };
}

export function withdrawFromTreasury(state, playerId, amount) {
  if (!hasPermission(state, playerId, 'treasury_withdraw')) return { success: false, error: 'No permission to withdraw' };
  if (amount <= 0) return { success: false, error: 'Invalid amount' };
  const result = getPlayerGuild(state, playerId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  if (guild.treasury.gold < amount) return { success: false, error: 'Insufficient funds' };

  const logEntry = { type: 'withdraw', playerId, amount, timestamp: Date.now() };
  const updatedGuild = { ...guild, treasury: { ...guild.treasury, gold: guild.treasury.gold - amount, log: [...guild.treasury.log.slice(-99), logEntry] } };

  return { success: true, state: { ...state, guilds: { ...state.guilds, allGuilds: { ...state.guilds.allGuilds, [guild.id]: updatedGuild } } }, newBalance: updatedGuild.treasury.gold };
}

export function setMotd(state, playerId, motd) {
  if (!hasPermission(state, playerId, 'set_motd')) return { success: false, error: 'No permission to set MOTD' };
  if (motd.length > 500) return { success: false, error: 'MOTD too long' };
  const result = getPlayerGuild(state, playerId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;

  return { success: true, state: { ...state, guilds: { ...state.guilds, allGuilds: { ...state.guilds.allGuilds, [guild.id]: { ...guild, motd } } } } };
}

export function transferLeadership(state, leaderId, newLeaderId) {
  const result = getPlayerGuild(state, leaderId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  if (guild.leaderId !== leaderId) return { success: false, error: 'Only the leader can transfer leadership' };
  if (!guild.members[newLeaderId]) return { success: false, error: 'New leader must be in the guild' };

  const updatedGuild = {
    ...guild,
    leaderId: newLeaderId,
    members: {
      ...guild.members,
      [leaderId]: { ...guild.members[leaderId], rank: 'officer' },
      [newLeaderId]: { ...guild.members[newLeaderId], rank: 'leader' }
    }
  };

  return { success: true, state: { ...state, guilds: { ...state.guilds, allGuilds: { ...state.guilds.allGuilds, [guild.id]: updatedGuild } } } };
}

export function disbandGuild(state, leaderId) {
  const result = getPlayerGuild(state, leaderId);
  if (!result.found) return { success: false, error: 'Not in a guild' };
  const guild = result.guild;
  if (guild.leaderId !== leaderId) return { success: false, error: 'Only the leader can disband' };

  const { [guild.id]: removed, ...remainingGuilds } = state.guilds.allGuilds;
  const newPlayerGuilds = { ...state.guilds.playerGuilds };
  Object.keys(guild.members).forEach(id => delete newPlayerGuilds[id]);

  return {
    success: true,
    state: {
      ...state,
      guilds: {
        ...state.guilds,
        allGuilds: remainingGuilds,
        playerGuilds: newPlayerGuilds,
        stats: { totalGuilds: state.guilds.stats.totalGuilds - 1, totalMembers: state.guilds.stats.totalMembers - guild.memberCount }
      }
    }
  };
}

export function addGuildExperience(state, guildId, amount) {
  const guild = state.guilds.allGuilds[guildId];
  if (!guild) return { success: false, error: 'Guild not found' };

  let newExp = guild.experience + amount;
  let newLevel = guild.level;
  let newExpToNext = guild.experienceToNextLevel;

  while (newExp >= newExpToNext) {
    newExp -= newExpToNext;
    newLevel++;
    newExpToNext = Math.floor(1000 * Math.pow(1.5, newLevel - 1));
  }

  const updatedGuild = { ...guild, level: newLevel, experience: newExp, experienceToNextLevel: newExpToNext };
  return { success: true, state: { ...state, guilds: { ...state.guilds, allGuilds: { ...state.guilds.allGuilds, [guildId]: updatedGuild } } }, leveledUp: newLevel > guild.level, newLevel };
}

export function getGuildLeaderboard(state, sortBy = 'level', limit = 10) {
  const guilds = Object.values(state.guilds.allGuilds);
  const sorted = [...guilds].sort((a, b) => {
    if (sortBy === 'members') return b.memberCount - a.memberCount;
    if (sortBy === 'treasury') return b.treasury.gold - a.treasury.gold;
    return b.level - a.level || b.experience - a.experience;
  });
  return sorted.slice(0, limit).map((guild, i) => ({ rank: i + 1, ...guild }));
}

export function searchGuilds(state, query) {
  const q = query.toLowerCase();
  return Object.values(state.guilds.allGuilds).filter(g => g.name.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q));
}

export function getAllRanks() {
  return Object.values(GUILD_RANKS);
}

export function getGuildMembers(state, guildId) {
  const guild = state.guilds.allGuilds[guildId];
  if (!guild) return { found: false };
  const members = Object.values(guild.members).map(m => {
    const rank = Object.values(GUILD_RANKS).find(r => r.id === m.rank);
    return { ...m, rankName: rank?.name || m.rank, rankLevel: rank?.level || 0, isLeader: m.playerId === guild.leaderId };
  }).sort((a, b) => b.rankLevel - a.rankLevel);
  return { found: true, members };
}
