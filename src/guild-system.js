/**
 * Guild System
 * Provides guild creation, management, and collaborative features
 */

// Guild ranks with permissions
export const GUILD_RANK = {
  LEADER: 'leader',
  OFFICER: 'officer',
  VETERAN: 'veteran',
  MEMBER: 'member',
  RECRUIT: 'recruit'
};

// Guild permission flags
export const GUILD_PERMISSION = {
  INVITE: 'invite',
  KICK: 'kick',
  PROMOTE: 'promote',
  DEMOTE: 'demote',
  WITHDRAW_BANK: 'withdraw_bank',
  DEPOSIT_BANK: 'deposit_bank',
  START_QUEST: 'start_quest',
  EDIT_MESSAGE: 'edit_message',
  MANAGE_RANKS: 'manage_ranks',
  DISBAND: 'disband'
};

// Default permissions by rank
const DEFAULT_PERMISSIONS = {
  [GUILD_RANK.LEADER]: Object.values(GUILD_PERMISSION),
  [GUILD_RANK.OFFICER]: [
    GUILD_PERMISSION.INVITE,
    GUILD_PERMISSION.KICK,
    GUILD_PERMISSION.PROMOTE,
    GUILD_PERMISSION.WITHDRAW_BANK,
    GUILD_PERMISSION.DEPOSIT_BANK,
    GUILD_PERMISSION.START_QUEST,
    GUILD_PERMISSION.EDIT_MESSAGE
  ],
  [GUILD_RANK.VETERAN]: [
    GUILD_PERMISSION.INVITE,
    GUILD_PERMISSION.DEPOSIT_BANK,
    GUILD_PERMISSION.START_QUEST
  ],
  [GUILD_RANK.MEMBER]: [
    GUILD_PERMISSION.DEPOSIT_BANK,
    GUILD_PERMISSION.START_QUEST
  ],
  [GUILD_RANK.RECRUIT]: [
    GUILD_PERMISSION.DEPOSIT_BANK
  ]
};

// Guild perks that can be unlocked
export const GUILD_PERK = {
  XP_BOOST: 'xp_boost',
  GOLD_BOOST: 'gold_boost',
  FAST_TRAVEL: 'fast_travel',
  SHARED_STORAGE: 'shared_storage',
  GROUP_HEALING: 'group_healing',
  COMBAT_BONUS: 'combat_bonus',
  MERCHANT_DISCOUNT: 'merchant_discount',
  RARE_DROP_BOOST: 'rare_drop_boost'
};

// Perk definitions
const PERK_DEFINITIONS = {
  [GUILD_PERK.XP_BOOST]: {
    name: 'Experience Boost',
    description: 'All members gain 10% bonus XP',
    cost: 1000,
    levelRequired: 2,
    effect: { xpMultiplier: 1.10 }
  },
  [GUILD_PERK.GOLD_BOOST]: {
    name: 'Gold Boost',
    description: 'All members gain 10% bonus gold',
    cost: 1500,
    levelRequired: 3,
    effect: { goldMultiplier: 1.10 }
  },
  [GUILD_PERK.FAST_TRAVEL]: {
    name: 'Guild Fast Travel',
    description: 'Members can fast travel to guild hall',
    cost: 2000,
    levelRequired: 4,
    effect: { fastTravel: true }
  },
  [GUILD_PERK.SHARED_STORAGE]: {
    name: 'Shared Storage',
    description: 'Unlock 20 shared storage slots',
    cost: 2500,
    levelRequired: 5,
    effect: { storageSlots: 20 }
  },
  [GUILD_PERK.GROUP_HEALING]: {
    name: 'Group Healing',
    description: 'Healing affects nearby guild members',
    cost: 3000,
    levelRequired: 6,
    effect: { groupHealing: true }
  },
  [GUILD_PERK.COMBAT_BONUS]: {
    name: 'Combat Synergy',
    description: '+5% damage when fighting alongside guild members',
    cost: 3500,
    levelRequired: 7,
    effect: { combatBonus: 0.05 }
  },
  [GUILD_PERK.MERCHANT_DISCOUNT]: {
    name: 'Merchant Connections',
    description: '5% discount at all shops',
    cost: 4000,
    levelRequired: 8,
    effect: { shopDiscount: 0.05 }
  },
  [GUILD_PERK.RARE_DROP_BOOST]: {
    name: 'Fortune Favor',
    description: '+5% rare item drop chance',
    cost: 5000,
    levelRequired: 10,
    effect: { rareDropBonus: 0.05 }
  }
};

// Guild quest templates
export const GUILD_QUESTS = {
  weekly_hunt: {
    id: 'weekly_hunt',
    name: 'Weekly Hunt',
    description: 'Defeat 100 enemies as a guild',
    type: 'collective',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    target: 100,
    rewards: { gold: 500, guildXp: 200 }
  },
  treasure_expedition: {
    id: 'treasure_expedition',
    name: 'Treasure Expedition',
    description: 'Collect 50 treasure chests as a guild',
    type: 'collective',
    duration: 3 * 24 * 60 * 60 * 1000,
    target: 50,
    rewards: { gold: 300, guildXp: 150, items: ['rare_chest'] }
  },
  dungeon_conquest: {
    id: 'dungeon_conquest',
    name: 'Dungeon Conquest',
    description: 'Complete 10 dungeon runs as a guild',
    type: 'collective',
    duration: 5 * 24 * 60 * 60 * 1000,
    target: 10,
    rewards: { gold: 800, guildXp: 350 }
  },
  arena_dominance: {
    id: 'arena_dominance',
    name: 'Arena Dominance',
    description: 'Win 25 arena matches as a guild',
    type: 'collective',
    duration: 7 * 24 * 60 * 60 * 1000,
    target: 25,
    rewards: { gold: 600, guildXp: 250 }
  },
  crafting_mastery: {
    id: 'crafting_mastery',
    name: 'Crafting Mastery',
    description: 'Craft 30 items as a guild',
    type: 'collective',
    duration: 5 * 24 * 60 * 60 * 1000,
    target: 30,
    rewards: { gold: 400, guildXp: 200, items: ['crafting_materials'] }
  }
};

// XP required per guild level
const GUILD_LEVEL_XP = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000,
  17000, 23000, 30000, 40000, 52000, 66000, 82000, 100000, 125000, 155000
];

// Max members per guild level
const MEMBERS_PER_LEVEL = {
  1: 10,
  2: 12,
  3: 15,
  4: 18,
  5: 22,
  6: 26,
  7: 30,
  8: 35,
  9: 40,
  10: 50
};

/**
 * Creates initial guild system state for a player
 * @returns {Object} Initial guild state
 */
export function createGuildSystemState() {
  return {
    currentGuild: null,
    guildInvites: [],
    guildHistory: [],
    contributionStats: {
      totalGoldDonated: 0,
      questsCompleted: 0,
      membersRecruited: 0
    }
  };
}

/**
 * Creates a new guild
 * @param {string} name - Guild name
 * @param {Object} founder - Founder player data
 * @param {Object} options - Guild options
 * @returns {Object} Created guild or error
 */
export function createGuild(name, founder, options = {}) {
  if (!name || typeof name !== 'string') {
    return { error: 'Invalid guild name' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    return { error: 'Guild name must be at least 3 characters' };
  }

  if (trimmedName.length > 30) {
    return { error: 'Guild name cannot exceed 30 characters' };
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
    return { error: 'Guild name can only contain letters, numbers, and spaces' };
  }

  if (!founder || !founder.id || !founder.name) {
    return { error: 'Invalid founder data' };
  }

  const creationCost = options.creationCost || 500;
  if (founder.gold < creationCost) {
    return { error: `Insufficient gold. Need ${creationCost} gold to create a guild` };
  }

  const guild = {
    id: `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: trimmedName,
    tag: options.tag || trimmedName.substring(0, 4).toUpperCase(),
    description: options.description || '',
    motd: options.motd || 'Welcome to the guild!',
    level: 1,
    xp: 0,
    members: [{
      id: founder.id,
      name: founder.name,
      rank: GUILD_RANK.LEADER,
      joinedAt: Date.now(),
      contribution: 0,
      lastActive: Date.now()
    }],
    bank: {
      gold: 0,
      items: []
    },
    perks: [],
    activeQuests: [],
    completedQuests: [],
    settings: {
      isPublic: options.isPublic !== false,
      minLevelToJoin: options.minLevelToJoin || 1,
      autoAcceptRequests: false,
      permissions: { ...DEFAULT_PERMISSIONS }
    },
    stats: {
      totalXpEarned: 0,
      totalGoldDonated: 0,
      totalQuestsCompleted: 0,
      membersRecruited: 0
    },
    createdAt: Date.now(),
    createdBy: founder.id
  };

  return { guild, cost: creationCost };
}

/**
 * Gets max members for guild level
 * @param {number} level - Guild level
 * @returns {number} Max members
 */
export function getMaxMembers(level) {
  if (level >= 10) return MEMBERS_PER_LEVEL[10];
  return MEMBERS_PER_LEVEL[level] || 10;
}

/**
 * Gets XP required for next guild level
 * @param {number} currentLevel - Current guild level
 * @returns {Object} XP info
 */
export function getGuildLevelProgress(currentLevel, currentXp) {
  const maxLevel = GUILD_LEVEL_XP.length;

  if (currentLevel >= maxLevel) {
    return {
      currentLevel,
      currentXp,
      nextLevelXp: null,
      xpNeeded: 0,
      progress: 1.0,
      isMaxLevel: true
    };
  }

  const nextLevelXp = GUILD_LEVEL_XP[currentLevel] || GUILD_LEVEL_XP[maxLevel - 1];
  const prevLevelXp = currentLevel > 1 ? GUILD_LEVEL_XP[currentLevel - 1] : 0;
  const levelRange = nextLevelXp - prevLevelXp;
  const currentProgress = currentXp - prevLevelXp;
  const progress = levelRange > 0 ? currentProgress / levelRange : 0;

  return {
    currentLevel,
    currentXp,
    nextLevelXp,
    xpNeeded: nextLevelXp - currentXp,
    progress: Math.max(0, Math.min(1, progress)),
    isMaxLevel: false
  };
}

/**
 * Adds XP to guild and handles level ups
 * @param {Object} guild - Guild object
 * @param {number} amount - XP to add
 * @returns {Object} Updated guild and level up info
 */
export function addGuildXp(guild, amount) {
  if (!guild || typeof amount !== 'number' || amount <= 0) {
    return { guild, levelUp: null };
  }

  const updatedGuild = {
    ...guild,
    xp: guild.xp + amount,
    stats: {
      ...guild.stats,
      totalXpEarned: guild.stats.totalXpEarned + amount
    }
  };

  // Check for level up
  let levelUp = null;
  const maxLevel = GUILD_LEVEL_XP.length;

  while (updatedGuild.level < maxLevel &&
         updatedGuild.xp >= GUILD_LEVEL_XP[updatedGuild.level]) {
    updatedGuild.level++;
    levelUp = {
      newLevel: updatedGuild.level,
      newMaxMembers: getMaxMembers(updatedGuild.level)
    };
  }

  return { guild: updatedGuild, levelUp };
}

/**
 * Adds a member to the guild
 * @param {Object} guild - Guild object
 * @param {Object} player - Player to add
 * @param {string} invitedBy - ID of inviting member
 * @returns {Object} Result
 */
export function addMember(guild, player, invitedBy = null) {
  if (!guild || !player || !player.id || !player.name) {
    return { error: 'Invalid guild or player data' };
  }

  const maxMembers = getMaxMembers(guild.level);
  if (guild.members.length >= maxMembers) {
    return { error: 'Guild is full' };
  }

  if (guild.members.find(m => m.id === player.id)) {
    return { error: 'Player is already a member' };
  }

  if (player.level < guild.settings.minLevelToJoin) {
    return { error: `Player must be level ${guild.settings.minLevelToJoin} to join` };
  }

  const newMember = {
    id: player.id,
    name: player.name,
    rank: GUILD_RANK.RECRUIT,
    joinedAt: Date.now(),
    contribution: 0,
    lastActive: Date.now(),
    invitedBy
  };

  const updatedGuild = {
    ...guild,
    members: [...guild.members, newMember],
    stats: {
      ...guild.stats,
      membersRecruited: guild.stats.membersRecruited + 1
    }
  };

  return { guild: updatedGuild, member: newMember };
}

/**
 * Removes a member from the guild
 * @param {Object} guild - Guild object
 * @param {string} memberId - Member to remove
 * @param {string} removedBy - ID of member performing removal
 * @returns {Object} Result
 */
export function removeMember(guild, memberId, removedBy) {
  if (!guild || !memberId) {
    return { error: 'Invalid guild or member ID' };
  }

  const member = guild.members.find(m => m.id === memberId);
  if (!member) {
    return { error: 'Member not found' };
  }

  if (member.rank === GUILD_RANK.LEADER) {
    return { error: 'Cannot remove the guild leader' };
  }

  const remover = guild.members.find(m => m.id === removedBy);
  if (!remover) {
    return { error: 'Remover is not a guild member' };
  }

  if (!hasPermission(guild, removedBy, GUILD_PERMISSION.KICK)) {
    return { error: 'No permission to remove members' };
  }

  const rankOrder = Object.values(GUILD_RANK);
  if (rankOrder.indexOf(member.rank) <= rankOrder.indexOf(remover.rank)) {
    return { error: 'Cannot remove member of equal or higher rank' };
  }

  const updatedGuild = {
    ...guild,
    members: guild.members.filter(m => m.id !== memberId)
  };

  return { guild: updatedGuild, removedMember: member };
}

/**
 * Changes a member's rank
 * @param {Object} guild - Guild object
 * @param {string} memberId - Member to change
 * @param {string} newRank - New rank
 * @param {string} changedBy - ID of member making change
 * @returns {Object} Result
 */
export function changeMemberRank(guild, memberId, newRank, changedBy) {
  if (!guild || !memberId || !newRank) {
    return { error: 'Invalid parameters' };
  }

  if (!Object.values(GUILD_RANK).includes(newRank)) {
    return { error: 'Invalid rank' };
  }

  const member = guild.members.find(m => m.id === memberId);
  if (!member) {
    return { error: 'Member not found' };
  }

  const changer = guild.members.find(m => m.id === changedBy);
  if (!changer) {
    return { error: 'Invalid changer' };
  }

  if (member.id === changedBy) {
    return { error: 'Cannot change your own rank' };
  }

  const rankOrder = Object.values(GUILD_RANK);
  const oldRankIndex = rankOrder.indexOf(member.rank);
  const newRankIndex = rankOrder.indexOf(newRank);
  const changerRankIndex = rankOrder.indexOf(changer.rank);

  // Check permissions
  if (newRankIndex < oldRankIndex) {
    // Promotion
    if (!hasPermission(guild, changedBy, GUILD_PERMISSION.PROMOTE)) {
      return { error: 'No permission to promote members' };
    }
  } else {
    // Demotion
    if (!hasPermission(guild, changedBy, GUILD_PERMISSION.DEMOTE)) {
      return { error: 'No permission to demote members' };
    }
  }

  // Can only change to ranks below your own
  if (newRankIndex <= changerRankIndex && changer.rank !== GUILD_RANK.LEADER) {
    return { error: 'Cannot assign rank equal to or higher than your own' };
  }

  // Handle leader transfer
  if (newRank === GUILD_RANK.LEADER) {
    if (changer.rank !== GUILD_RANK.LEADER) {
      return { error: 'Only the leader can transfer leadership' };
    }
  }

  const updatedMembers = guild.members.map(m => {
    if (m.id === memberId) {
      return { ...m, rank: newRank };
    }
    // Demote old leader if transferring leadership
    if (newRank === GUILD_RANK.LEADER && m.id === changedBy) {
      return { ...m, rank: GUILD_RANK.OFFICER };
    }
    return m;
  });

  return {
    guild: { ...guild, members: updatedMembers },
    oldRank: member.rank,
    newRank
  };
}

/**
 * Checks if a member has a permission
 * @param {Object} guild - Guild object
 * @param {string} memberId - Member ID
 * @param {string} permission - Permission to check
 * @returns {boolean} Has permission
 */
export function hasPermission(guild, memberId, permission) {
  if (!guild || !memberId || !permission) return false;

  const member = guild.members.find(m => m.id === memberId);
  if (!member) return false;

  const permissions = guild.settings.permissions[member.rank] || [];
  return permissions.includes(permission);
}

/**
 * Deposits gold to guild bank
 * @param {Object} guild - Guild object
 * @param {string} memberId - Member depositing
 * @param {number} amount - Amount to deposit
 * @returns {Object} Result
 */
export function depositGold(guild, memberId, amount) {
  if (!guild || !memberId || typeof amount !== 'number') {
    return { error: 'Invalid parameters' };
  }

  if (amount <= 0) {
    return { error: 'Amount must be positive' };
  }

  const member = guild.members.find(m => m.id === memberId);
  if (!member) {
    return { error: 'Member not found' };
  }

  if (!hasPermission(guild, memberId, GUILD_PERMISSION.DEPOSIT_BANK)) {
    return { error: 'No permission to deposit' };
  }

  const updatedMembers = guild.members.map(m => {
    if (m.id === memberId) {
      return { ...m, contribution: m.contribution + amount };
    }
    return m;
  });

  const updatedGuild = {
    ...guild,
    bank: {
      ...guild.bank,
      gold: guild.bank.gold + amount
    },
    members: updatedMembers,
    stats: {
      ...guild.stats,
      totalGoldDonated: guild.stats.totalGoldDonated + amount
    }
  };

  return { guild: updatedGuild, deposited: amount };
}

/**
 * Withdraws gold from guild bank
 * @param {Object} guild - Guild object
 * @param {string} memberId - Member withdrawing
 * @param {number} amount - Amount to withdraw
 * @returns {Object} Result
 */
export function withdrawGold(guild, memberId, amount) {
  if (!guild || !memberId || typeof amount !== 'number') {
    return { error: 'Invalid parameters' };
  }

  if (amount <= 0) {
    return { error: 'Amount must be positive' };
  }

  if (!hasPermission(guild, memberId, GUILD_PERMISSION.WITHDRAW_BANK)) {
    return { error: 'No permission to withdraw' };
  }

  if (guild.bank.gold < amount) {
    return { error: 'Insufficient funds in guild bank' };
  }

  const updatedGuild = {
    ...guild,
    bank: {
      ...guild.bank,
      gold: guild.bank.gold - amount
    }
  };

  return { guild: updatedGuild, withdrawn: amount };
}

/**
 * Unlocks a guild perk
 * @param {Object} guild - Guild object
 * @param {string} perkId - Perk to unlock
 * @param {string} unlockedBy - Member unlocking
 * @returns {Object} Result
 */
export function unlockPerk(guild, perkId, unlockedBy) {
  if (!guild || !perkId) {
    return { error: 'Invalid parameters' };
  }

  const perk = PERK_DEFINITIONS[perkId];
  if (!perk) {
    return { error: 'Invalid perk' };
  }

  if (guild.perks.includes(perkId)) {
    return { error: 'Perk already unlocked' };
  }

  if (guild.level < perk.levelRequired) {
    return { error: `Guild must be level ${perk.levelRequired} to unlock this perk` };
  }

  if (guild.bank.gold < perk.cost) {
    return { error: `Insufficient funds. Need ${perk.cost} gold` };
  }

  const updatedGuild = {
    ...guild,
    perks: [...guild.perks, perkId],
    bank: {
      ...guild.bank,
      gold: guild.bank.gold - perk.cost
    }
  };

  return { guild: updatedGuild, perk };
}

/**
 * Gets all available perks for guild
 * @param {Object} guild - Guild object
 * @returns {Array} Available perks
 */
export function getAvailablePerks(guild) {
  if (!guild) return [];

  return Object.entries(PERK_DEFINITIONS).map(([id, perk]) => ({
    id,
    ...perk,
    unlocked: guild.perks.includes(id),
    canUnlock: guild.level >= perk.levelRequired &&
               guild.bank.gold >= perk.cost &&
               !guild.perks.includes(id)
  }));
}

/**
 * Gets combined perk effects for a guild
 * @param {Object} guild - Guild object
 * @returns {Object} Combined effects
 */
export function getGuildEffects(guild) {
  if (!guild) return {};

  const effects = {
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    fastTravel: false,
    storageSlots: 0,
    groupHealing: false,
    combatBonus: 0,
    shopDiscount: 0,
    rareDropBonus: 0
  };

  for (const perkId of guild.perks) {
    const perk = PERK_DEFINITIONS[perkId];
    if (perk && perk.effect) {
      for (const [key, value] of Object.entries(perk.effect)) {
        if (typeof value === 'number' && typeof effects[key] === 'number') {
          if (key.includes('Multiplier')) {
            effects[key] *= value;
          } else {
            effects[key] += value;
          }
        } else if (typeof value === 'boolean') {
          effects[key] = effects[key] || value;
        }
      }
    }
  }

  return effects;
}

/**
 * Starts a guild quest
 * @param {Object} guild - Guild object
 * @param {string} questId - Quest to start
 * @param {string} startedBy - Member starting quest
 * @returns {Object} Result
 */
export function startGuildQuest(guild, questId, startedBy) {
  if (!guild || !questId) {
    return { error: 'Invalid parameters' };
  }

  if (!hasPermission(guild, startedBy, GUILD_PERMISSION.START_QUEST)) {
    return { error: 'No permission to start quests' };
  }

  const questTemplate = GUILD_QUESTS[questId];
  if (!questTemplate) {
    return { error: 'Invalid quest' };
  }

  if (guild.activeQuests.find(q => q.id === questId)) {
    return { error: 'Quest already active' };
  }

  const quest = {
    ...questTemplate,
    startedAt: Date.now(),
    expiresAt: Date.now() + questTemplate.duration,
    progress: 0,
    startedBy,
    contributors: []
  };

  const updatedGuild = {
    ...guild,
    activeQuests: [...guild.activeQuests, quest]
  };

  return { guild: updatedGuild, quest };
}

/**
 * Updates progress on a guild quest
 * @param {Object} guild - Guild object
 * @param {string} questId - Quest to update
 * @param {number} amount - Progress amount
 * @param {string} contributorId - Contributing member
 * @returns {Object} Result
 */
export function updateQuestProgress(guild, questId, amount, contributorId) {
  if (!guild || !questId || typeof amount !== 'number') {
    return { error: 'Invalid parameters' };
  }

  const questIndex = guild.activeQuests.findIndex(q => q.id === questId);
  if (questIndex === -1) {
    return { error: 'Quest not found' };
  }

  const quest = guild.activeQuests[questIndex];

  if (Date.now() > quest.expiresAt) {
    return { error: 'Quest has expired' };
  }

  const newProgress = Math.min(quest.progress + amount, quest.target);
  const isCompleted = newProgress >= quest.target;

  const updatedQuest = {
    ...quest,
    progress: newProgress,
    contributors: contributorId && !quest.contributors.includes(contributorId)
      ? [...quest.contributors, contributorId]
      : quest.contributors
  };

  let updatedGuild = {
    ...guild,
    activeQuests: [
      ...guild.activeQuests.slice(0, questIndex),
      updatedQuest,
      ...guild.activeQuests.slice(questIndex + 1)
    ]
  };

  let rewards = null;
  if (isCompleted) {
    // Move to completed and add rewards
    updatedGuild = {
      ...updatedGuild,
      activeQuests: updatedGuild.activeQuests.filter(q => q.id !== questId),
      completedQuests: [...updatedGuild.completedQuests, {
        ...updatedQuest,
        completedAt: Date.now()
      }],
      stats: {
        ...updatedGuild.stats,
        totalQuestsCompleted: updatedGuild.stats.totalQuestsCompleted + 1
      }
    };

    // Add rewards to bank
    if (quest.rewards.gold) {
      updatedGuild.bank.gold += quest.rewards.gold;
    }

    // Add guild XP
    if (quest.rewards.guildXp) {
      const { guild: withXp, levelUp } = addGuildXp(updatedGuild, quest.rewards.guildXp);
      updatedGuild = withXp;
      rewards = { ...quest.rewards, levelUp };
    } else {
      rewards = quest.rewards;
    }
  }

  return { guild: updatedGuild, completed: isCompleted, rewards };
}

/**
 * Gets guild quest status
 * @param {Object} guild - Guild object
 * @returns {Object} Quest status
 */
export function getQuestStatus(guild) {
  if (!guild) return { active: [], available: [], completed: 0 };

  const now = Date.now();
  const active = guild.activeQuests.filter(q => now <= q.expiresAt);
  const expired = guild.activeQuests.filter(q => now > q.expiresAt);

  // Remove expired quests
  const available = Object.values(GUILD_QUESTS).filter(
    q => !active.find(a => a.id === q.id)
  );

  return {
    active: active.map(q => ({
      ...q,
      timeRemaining: q.expiresAt - now,
      progressPercent: (q.progress / q.target) * 100
    })),
    available,
    completed: guild.completedQuests.length,
    expired: expired.length
  };
}

/**
 * Disbands a guild
 * @param {Object} guild - Guild object
 * @param {string} memberId - Member requesting disband
 * @returns {Object} Result
 */
export function disbandGuild(guild, memberId) {
  if (!guild || !memberId) {
    return { error: 'Invalid parameters' };
  }

  if (!hasPermission(guild, memberId, GUILD_PERMISSION.DISBAND)) {
    return { error: 'No permission to disband guild' };
  }

  const member = guild.members.find(m => m.id === memberId);
  if (!member || member.rank !== GUILD_RANK.LEADER) {
    return { error: 'Only the leader can disband the guild' };
  }

  // Return bank gold to leader
  const goldToReturn = guild.bank.gold;

  return {
    disbanded: true,
    guildId: guild.id,
    guildName: guild.name,
    goldReturned: goldToReturn,
    formerMembers: guild.members.map(m => m.id)
  };
}

/**
 * Gets guild statistics
 * @param {Object} guild - Guild object
 * @returns {Object} Guild stats
 */
export function getGuildStats(guild) {
  if (!guild) return null;

  const membersByRank = {};
  for (const rank of Object.values(GUILD_RANK)) {
    membersByRank[rank] = guild.members.filter(m => m.rank === rank).length;
  }

  const topContributors = [...guild.members]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);

  const levelProgress = getGuildLevelProgress(guild.level, guild.xp);

  return {
    name: guild.name,
    tag: guild.tag,
    level: guild.level,
    levelProgress,
    memberCount: guild.members.length,
    maxMembers: getMaxMembers(guild.level),
    bankGold: guild.bank.gold,
    bankItems: guild.bank.items.length,
    perksUnlocked: guild.perks.length,
    totalPerks: Object.keys(PERK_DEFINITIONS).length,
    membersByRank,
    topContributors,
    ...guild.stats,
    activeQuests: guild.activeQuests.length,
    age: Date.now() - guild.createdAt
  };
}

/**
 * Validates guild state
 * @param {Object} guild - Guild to validate
 * @returns {boolean} Is valid
 */
export function validateGuild(guild) {
  if (!guild || typeof guild !== 'object') return false;
  if (!guild.id || typeof guild.id !== 'string') return false;
  if (!guild.name || typeof guild.name !== 'string') return false;
  if (typeof guild.level !== 'number' || guild.level < 1) return false;
  if (!Array.isArray(guild.members) || guild.members.length === 0) return false;
  if (!guild.bank || typeof guild.bank.gold !== 'number') return false;
  if (!Array.isArray(guild.perks)) return false;
  return true;
}

/**
 * Escapes HTML for safe rendering
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
