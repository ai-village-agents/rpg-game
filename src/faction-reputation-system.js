/**
 * Faction Reputation System
 * Manages player standing with various in-game factions
 */

// Reputation levels
export const REPUTATION_LEVEL = {
  HATED: 'hated',
  HOSTILE: 'hostile',
  UNFRIENDLY: 'unfriendly',
  NEUTRAL: 'neutral',
  FRIENDLY: 'friendly',
  HONORED: 'honored',
  REVERED: 'revered',
  EXALTED: 'exalted'
};

// Reputation thresholds
const REPUTATION_THRESHOLDS = {
  [REPUTATION_LEVEL.HATED]: -42000,
  [REPUTATION_LEVEL.HOSTILE]: -6000,
  [REPUTATION_LEVEL.UNFRIENDLY]: -3000,
  [REPUTATION_LEVEL.NEUTRAL]: 0,
  [REPUTATION_LEVEL.FRIENDLY]: 3000,
  [REPUTATION_LEVEL.HONORED]: 9000,
  [REPUTATION_LEVEL.REVERED]: 21000,
  [REPUTATION_LEVEL.EXALTED]: 42000
};

// Faction categories
export const FACTION_CATEGORY = {
  KINGDOM: 'kingdom',
  GUILD: 'guild',
  TRIBE: 'tribe',
  ORDER: 'order',
  MERCHANT: 'merchant',
  CREATURE: 'creature'
};

// Faction definitions
export const FACTIONS = {
  // Kingdoms
  kingdom_valor: {
    id: 'kingdom_valor',
    name: 'Kingdom of Valor',
    description: 'A noble kingdom devoted to honor and justice',
    category: FACTION_CATEGORY.KINGDOM,
    isHidden: false,
    rivals: ['shadow_syndicate', 'chaos_cult'],
    allies: ['silver_order', 'merchant_league'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['valor_tabard'], discount: 0.05 },
      [REPUTATION_LEVEL.HONORED]: { items: ['valor_mount_license'], discount: 0.10 },
      [REPUTATION_LEVEL.REVERED]: { items: ['valor_weapon'], discount: 0.15 },
      [REPUTATION_LEVEL.EXALTED]: { items: ['valor_artifact', 'valor_title'], discount: 0.20 }
    }
  },
  forest_guardians: {
    id: 'forest_guardians',
    name: 'Forest Guardians',
    description: 'Protectors of the ancient woodland',
    category: FACTION_CATEGORY.TRIBE,
    isHidden: false,
    rivals: ['lumber_consortium'],
    allies: ['druids_circle'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['guardian_cloak'], discount: 0.05 },
      [REPUTATION_LEVEL.HONORED]: { items: ['forest_companion'], discount: 0.10 },
      [REPUTATION_LEVEL.REVERED]: { items: ['nature_staff'], discount: 0.15 },
      [REPUTATION_LEVEL.EXALTED]: { items: ['ancient_treant_mount'], discount: 0.20 }
    }
  },
  merchant_league: {
    id: 'merchant_league',
    name: 'Merchant League',
    description: 'A coalition of traders and craftsmen',
    category: FACTION_CATEGORY.MERCHANT,
    isHidden: false,
    rivals: ['thieves_guild'],
    allies: ['kingdom_valor'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { discount: 0.10 },
      [REPUTATION_LEVEL.HONORED]: { items: ['merchant_bag'], discount: 0.15 },
      [REPUTATION_LEVEL.REVERED]: { items: ['trade_permit'], discount: 0.20 },
      [REPUTATION_LEVEL.EXALTED]: { items: ['master_trader_title'], discount: 0.25 }
    }
  },
  silver_order: {
    id: 'silver_order',
    name: 'Silver Order',
    description: 'Knights dedicated to vanquishing evil',
    category: FACTION_CATEGORY.ORDER,
    isHidden: false,
    rivals: ['chaos_cult', 'undead_legion'],
    allies: ['kingdom_valor'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['silver_insignia'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['blessed_weapon'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['silver_armor'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['paladin_mount', 'knight_commander_title'] }
    }
  },
  shadow_syndicate: {
    id: 'shadow_syndicate',
    name: 'Shadow Syndicate',
    description: 'A secretive network of rogues and spies',
    category: FACTION_CATEGORY.GUILD,
    isHidden: true,
    rivals: ['kingdom_valor', 'silver_order'],
    allies: ['thieves_guild'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['shadow_cloak'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['assassin_blade'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['shadow_step_boots'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['master_assassin_title', 'shadow_mount'] }
    }
  },
  druids_circle: {
    id: 'druids_circle',
    name: "Druids' Circle",
    description: 'Keepers of natural balance',
    category: FACTION_CATEGORY.ORDER,
    isHidden: false,
    rivals: ['undead_legion'],
    allies: ['forest_guardians'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['druid_herbs'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['shapeshifter_totem'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['nature_blessing'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['archdruid_staff', 'nature_avatar_form'] }
    }
  },
  thieves_guild: {
    id: 'thieves_guild',
    name: "Thieves' Guild",
    description: 'Masters of stealth and acquisition',
    category: FACTION_CATEGORY.GUILD,
    isHidden: true,
    rivals: ['merchant_league', 'kingdom_valor'],
    allies: ['shadow_syndicate'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['lockpick_set'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['fence_access'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['master_thief_tools'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['guild_master_key', 'shadow_network_access'] }
    }
  },
  undead_legion: {
    id: 'undead_legion',
    name: 'Undead Legion',
    description: 'Servants of the dark necromancers',
    category: FACTION_CATEGORY.CREATURE,
    isHidden: true,
    rivals: ['silver_order', 'druids_circle', 'kingdom_valor'],
    allies: ['chaos_cult'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['bone_trinket'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['undead_minion'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['lich_robes'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['death_knight_armor', 'necromancer_title'] }
    }
  },
  chaos_cult: {
    id: 'chaos_cult',
    name: 'Chaos Cult',
    description: 'Worshippers of destruction and entropy',
    category: FACTION_CATEGORY.ORDER,
    isHidden: true,
    rivals: ['kingdom_valor', 'silver_order'],
    allies: ['undead_legion'],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['chaos_symbol'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['chaotic_weapon'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['demon_pact'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['avatar_of_chaos_form', 'chaos_lord_title'] }
    }
  },
  dragon_alliance: {
    id: 'dragon_alliance',
    name: 'Dragon Alliance',
    description: 'Ancient pact between mortals and dragons',
    category: FACTION_CATEGORY.CREATURE,
    isHidden: false,
    rivals: ['dragon_slayers'],
    allies: [],
    rewards: {
      [REPUTATION_LEVEL.FRIENDLY]: { items: ['dragon_scale'] },
      [REPUTATION_LEVEL.HONORED]: { items: ['dragon_tongue_scroll'] },
      [REPUTATION_LEVEL.REVERED]: { items: ['drake_companion'] },
      [REPUTATION_LEVEL.EXALTED]: { items: ['dragon_rider_title', 'dragon_mount'] }
    }
  }
};

/**
 * Creates initial faction reputation state
 * @returns {Object} Initial state
 */
export function createReputationState() {
  const standings = {};

  for (const factionId of Object.keys(FACTIONS)) {
    standings[factionId] = {
      reputation: 0,
      level: REPUTATION_LEVEL.NEUTRAL,
      discovered: !FACTIONS[factionId].isHidden,
      totalGained: 0,
      totalLost: 0,
      rewardsClaimed: []
    };
  }

  return {
    standings,
    reputationHistory: [],
    activeQuests: {},
    bonusMultiplier: 1.0
  };
}

/**
 * Gets reputation level for a reputation value
 * @param {number} reputation - Reputation value
 * @returns {string} Reputation level
 */
export function getReputationLevel(reputation) {
  const levels = Object.entries(REPUTATION_THRESHOLDS)
    .sort((a, b) => b[1] - a[1]);

  for (const [level, threshold] of levels) {
    if (reputation >= threshold) {
      return level;
    }
  }
  return REPUTATION_LEVEL.HATED;
}

/**
 * Gets progress to next reputation level
 * @param {number} reputation - Current reputation
 * @returns {Object} Progress info
 */
export function getReputationProgress(reputation) {
  const currentLevel = getReputationLevel(reputation);
  const levels = Object.keys(REPUTATION_THRESHOLDS);
  const currentIndex = levels.indexOf(currentLevel);

  if (currentIndex === levels.length - 1) {
    return {
      currentLevel,
      nextLevel: null,
      current: reputation,
      needed: 0,
      progress: 1.0,
      isMax: true
    };
  }

  const nextLevel = levels[currentIndex + 1];
  const currentThreshold = REPUTATION_THRESHOLDS[currentLevel];
  const nextThreshold = REPUTATION_THRESHOLDS[nextLevel];
  const range = nextThreshold - currentThreshold;
  const progress = (reputation - currentThreshold) / range;

  return {
    currentLevel,
    nextLevel,
    current: reputation - currentThreshold,
    needed: nextThreshold - reputation,
    total: range,
    progress: Math.max(0, Math.min(1, progress)),
    isMax: false
  };
}

/**
 * Modifies reputation with a faction
 * @param {Object} state - Current reputation state
 * @param {string} factionId - Faction to modify
 * @param {number} amount - Reputation change (positive or negative)
 * @param {string} reason - Reason for change
 * @returns {Object} Updated state and change info
 */
export function modifyReputation(state, factionId, amount, reason = '') {
  if (!state || !factionId) {
    return { error: 'Invalid parameters' };
  }

  const faction = FACTIONS[factionId];
  if (!faction) {
    return { error: 'Faction not found' };
  }

  const standing = state.standings[factionId];
  if (!standing) {
    return { error: 'Standing not found' };
  }

  // Apply bonus multiplier for gains
  const adjustedAmount = amount > 0
    ? Math.floor(amount * state.bonusMultiplier)
    : amount;

  const oldReputation = standing.reputation;
  const oldLevel = standing.level;
  const newReputation = oldReputation + adjustedAmount;
  const newLevel = getReputationLevel(newReputation);

  const historyEntry = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    factionId,
    amount: adjustedAmount,
    reason,
    timestamp: Date.now(),
    oldLevel,
    newLevel
  };

  const updatedStandings = {
    ...state.standings,
    [factionId]: {
      ...standing,
      reputation: newReputation,
      level: newLevel,
      discovered: true,
      totalGained: adjustedAmount > 0
        ? standing.totalGained + adjustedAmount
        : standing.totalGained,
      totalLost: adjustedAmount < 0
        ? standing.totalLost + Math.abs(adjustedAmount)
        : standing.totalLost
    }
  };

  // Handle rival faction reputation loss
  const rivalChanges = [];
  if (amount > 0 && faction.rivals) {
    for (const rivalId of faction.rivals) {
      if (state.standings[rivalId]) {
        const rivalLoss = Math.floor(amount * -0.25);
        if (rivalLoss !== 0) {
          const rivalStanding = state.standings[rivalId];
          const newRivalRep = rivalStanding.reputation + rivalLoss;
          updatedStandings[rivalId] = {
            ...rivalStanding,
            reputation: newRivalRep,
            level: getReputationLevel(newRivalRep),
            totalLost: rivalStanding.totalLost + Math.abs(rivalLoss)
          };
          rivalChanges.push({
            factionId: rivalId,
            amount: rivalLoss
          });
        }
      }
    }
  }

  // Handle allied faction reputation gain
  const allyChanges = [];
  if (amount > 0 && faction.allies) {
    for (const allyId of faction.allies) {
      if (state.standings[allyId]) {
        const allyGain = Math.floor(amount * 0.1);
        if (allyGain > 0) {
          const allyStanding = state.standings[allyId];
          const newAllyRep = allyStanding.reputation + allyGain;
          updatedStandings[allyId] = {
            ...allyStanding,
            reputation: newAllyRep,
            level: getReputationLevel(newAllyRep),
            totalGained: allyStanding.totalGained + allyGain
          };
          allyChanges.push({
            factionId: allyId,
            amount: allyGain
          });
        }
      }
    }
  }

  const newState = {
    ...state,
    standings: updatedStandings,
    reputationHistory: [...state.reputationHistory.slice(-99), historyEntry]
  };

  return {
    state: newState,
    change: {
      factionId,
      amount: adjustedAmount,
      oldReputation,
      newReputation,
      oldLevel,
      newLevel,
      levelChanged: oldLevel !== newLevel,
      rivalChanges,
      allyChanges
    }
  };
}

/**
 * Gets faction standing info
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction ID
 * @returns {Object} Standing info
 */
export function getFactionStanding(state, factionId) {
  if (!state || !factionId) return null;

  const faction = FACTIONS[factionId];
  const standing = state.standings[factionId];

  if (!faction || !standing) return null;

  return {
    ...standing,
    faction: {
      id: faction.id,
      name: faction.name,
      description: faction.description,
      category: faction.category
    },
    progress: getReputationProgress(standing.reputation),
    availableRewards: getAvailableRewards(faction, standing),
    claimableRewards: getClaimableRewards(faction, standing)
  };
}

/**
 * Gets rewards available at current standing
 * @param {Object} faction - Faction data
 * @param {Object} standing - Player standing
 * @returns {Array} Available rewards
 */
function getAvailableRewards(faction, standing) {
  const rewards = [];
  const levels = Object.keys(REPUTATION_THRESHOLDS);
  const currentIndex = levels.indexOf(standing.level);

  for (const [level, reward] of Object.entries(faction.rewards || {})) {
    const levelIndex = levels.indexOf(level);
    if (levelIndex <= currentIndex) {
      rewards.push({
        level,
        ...reward,
        claimed: standing.rewardsClaimed.includes(level)
      });
    }
  }

  return rewards;
}

/**
 * Gets rewards that can be claimed
 * @param {Object} faction - Faction data
 * @param {Object} standing - Player standing
 * @returns {Array} Claimable rewards
 */
function getClaimableRewards(faction, standing) {
  return getAvailableRewards(faction, standing)
    .filter(r => !r.claimed);
}

/**
 * Claims a faction reward
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction ID
 * @param {string} level - Reward level
 * @returns {Object} Result
 */
export function claimReward(state, factionId, level) {
  if (!state || !factionId || !level) {
    return { error: 'Invalid parameters' };
  }

  const faction = FACTIONS[factionId];
  const standing = state.standings[factionId];

  if (!faction || !standing) {
    return { error: 'Faction or standing not found' };
  }

  const reward = faction.rewards?.[level];
  if (!reward) {
    return { error: 'Reward not found' };
  }

  const levels = Object.keys(REPUTATION_THRESHOLDS);
  const requiredIndex = levels.indexOf(level);
  const currentIndex = levels.indexOf(standing.level);

  if (currentIndex < requiredIndex) {
    return { error: 'Insufficient reputation level' };
  }

  if (standing.rewardsClaimed.includes(level)) {
    return { error: 'Reward already claimed' };
  }

  const updatedStandings = {
    ...state.standings,
    [factionId]: {
      ...standing,
      rewardsClaimed: [...standing.rewardsClaimed, level]
    }
  };

  return {
    state: { ...state, standings: updatedStandings },
    reward: {
      level,
      items: reward.items || [],
      discount: reward.discount || 0
    }
  };
}

/**
 * Gets discount for a faction
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction ID
 * @returns {number} Discount percentage (0-1)
 */
export function getFactionDiscount(state, factionId) {
  if (!state || !factionId) return 0;

  const faction = FACTIONS[factionId];
  const standing = state.standings[factionId];

  if (!faction || !standing) return 0;

  const levels = Object.keys(REPUTATION_THRESHOLDS);
  const currentIndex = levels.indexOf(standing.level);

  let maxDiscount = 0;
  for (const [level, reward] of Object.entries(faction.rewards || {})) {
    const levelIndex = levels.indexOf(level);
    if (levelIndex <= currentIndex && reward.discount) {
      maxDiscount = Math.max(maxDiscount, reward.discount);
    }
  }

  return maxDiscount;
}

/**
 * Gets all faction standings summary
 * @param {Object} state - Reputation state
 * @param {Object} options - Filter options
 * @returns {Array} Standings summary
 */
export function getAllStandings(state, options = {}) {
  if (!state) return [];

  const standings = [];

  for (const [factionId, standing] of Object.entries(state.standings)) {
    const faction = FACTIONS[factionId];
    if (!faction) continue;

    // Filter by discovered
    if (!options.showHidden && !standing.discovered) continue;

    // Filter by category
    if (options.category && faction.category !== options.category) continue;

    standings.push({
      factionId,
      factionName: faction.name,
      category: faction.category,
      reputation: standing.reputation,
      level: standing.level,
      discovered: standing.discovered,
      progress: getReputationProgress(standing.reputation)
    });
  }

  // Sort by reputation (descending)
  standings.sort((a, b) => b.reputation - a.reputation);

  return standings;
}

/**
 * Checks if player can interact with a faction
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction ID
 * @param {string} interactionType - Type of interaction
 * @returns {Object} Can interact and reason
 */
export function canInteract(state, factionId, interactionType) {
  if (!state || !factionId) {
    return { canInteract: false, reason: 'Invalid parameters' };
  }

  const standing = state.standings[factionId];
  if (!standing) {
    return { canInteract: false, reason: 'Faction not found' };
  }

  const level = standing.level;
  const levelIndex = Object.keys(REPUTATION_THRESHOLDS).indexOf(level);

  switch (interactionType) {
    case 'shop':
      if (levelIndex < 3) { // Below neutral
        return { canInteract: false, reason: 'Reputation too low to trade' };
      }
      break;
    case 'quest':
      if (levelIndex < 3) {
        return { canInteract: false, reason: 'Reputation too low for quests' };
      }
      break;
    case 'special_quest':
      if (levelIndex < 5) { // Below honored
        return { canInteract: false, reason: 'Requires Honored reputation' };
      }
      break;
    case 'sanctuary':
      if (levelIndex < 4) { // Below friendly
        return { canInteract: false, reason: 'Requires Friendly reputation' };
      }
      break;
  }

  return { canInteract: true, discount: getFactionDiscount(state, factionId) };
}

/**
 * Discovers a hidden faction
 * @param {Object} state - Reputation state
 * @param {string} factionId - Faction to discover
 * @returns {Object} Updated state
 */
export function discoverFaction(state, factionId) {
  if (!state || !factionId) {
    return { error: 'Invalid parameters' };
  }

  const standing = state.standings[factionId];
  if (!standing) {
    return { error: 'Faction not found' };
  }

  if (standing.discovered) {
    return { state, alreadyDiscovered: true };
  }

  const updatedStandings = {
    ...state.standings,
    [factionId]: {
      ...standing,
      discovered: true
    }
  };

  return {
    state: { ...state, standings: updatedStandings },
    faction: FACTIONS[factionId]
  };
}

/**
 * Sets reputation bonus multiplier
 * @param {Object} state - Reputation state
 * @param {number} multiplier - Bonus multiplier
 * @returns {Object} Updated state
 */
export function setReputationBonus(state, multiplier) {
  if (!state || typeof multiplier !== 'number') {
    return { error: 'Invalid parameters' };
  }

  return {
    state: {
      ...state,
      bonusMultiplier: Math.max(0.1, Math.min(5.0, multiplier))
    }
  };
}

/**
 * Gets faction relationship summary
 * @param {string} factionId - Faction ID
 * @returns {Object} Relationships
 */
export function getFactionRelationships(factionId) {
  const faction = FACTIONS[factionId];
  if (!faction) return null;

  return {
    faction: {
      id: faction.id,
      name: faction.name
    },
    rivals: (faction.rivals || []).map(id => ({
      id,
      name: FACTIONS[id]?.name || 'Unknown'
    })),
    allies: (faction.allies || []).map(id => ({
      id,
      name: FACTIONS[id]?.name || 'Unknown'
    }))
  };
}

/**
 * Calculates faction score for achievements
 * @param {Object} state - Reputation state
 * @returns {Object} Score summary
 */
export function calculateFactionScore(state) {
  if (!state) return null;

  let totalPositive = 0;
  let totalNegative = 0;
  let factionsAtExalted = 0;
  let factionsDiscovered = 0;

  for (const standing of Object.values(state.standings)) {
    if (standing.discovered) factionsDiscovered++;
    if (standing.reputation > 0) totalPositive += standing.reputation;
    if (standing.reputation < 0) totalNegative += Math.abs(standing.reputation);
    if (standing.level === REPUTATION_LEVEL.EXALTED) factionsAtExalted++;
  }

  return {
    totalPositive,
    totalNegative,
    netReputation: totalPositive - totalNegative,
    factionsAtExalted,
    factionsDiscovered,
    totalFactions: Object.keys(FACTIONS).length
  };
}

/**
 * Validates reputation state
 * @param {Object} state - State to validate
 * @returns {boolean} Is valid
 */
export function validateReputationState(state) {
  if (!state || typeof state !== 'object') return false;
  if (!state.standings || typeof state.standings !== 'object') return false;
  if (!Array.isArray(state.reputationHistory)) return false;
  if (typeof state.bonusMultiplier !== 'number') return false;

  for (const [factionId, standing] of Object.entries(state.standings)) {
    if (!FACTIONS[factionId]) return false;
    if (typeof standing.reputation !== 'number') return false;
    if (!Object.values(REPUTATION_LEVEL).includes(standing.level)) return false;
  }

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
