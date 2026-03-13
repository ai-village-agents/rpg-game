/**
 * Reputation System
 * Manages player standing with factions, NPCs, and regions
 */

// Reputation tiers
export const REPUTATION_TIERS = {
  HATED: { id: 'hated', name: 'Hated', minValue: -1000, color: '#8B0000', discount: -0.5 },
  HOSTILE: { id: 'hostile', name: 'Hostile', minValue: -500, color: '#FF0000', discount: -0.3 },
  UNFRIENDLY: { id: 'unfriendly', name: 'Unfriendly', minValue: -200, color: '#FF6600', discount: -0.1 },
  NEUTRAL: { id: 'neutral', name: 'Neutral', minValue: -50, color: '#FFFF00', discount: 0 },
  FRIENDLY: { id: 'friendly', name: 'Friendly', minValue: 100, color: '#00FF00', discount: 0.05 },
  HONORED: { id: 'honored', name: 'Honored', minValue: 500, color: '#00CCFF', discount: 0.1 },
  REVERED: { id: 'revered', name: 'Revered', minValue: 1000, color: '#9900FF', discount: 0.15 },
  EXALTED: { id: 'exalted', name: 'Exalted', minValue: 3000, color: '#FFD700', discount: 0.2 }
};

// Factions
export const FACTIONS = {
  MERCHANTS_GUILD: {
    id: 'merchants_guild',
    name: 'Merchants Guild',
    description: 'A powerful trade organization',
    startingRep: 0,
    allies: ['craftsmen_union'],
    enemies: ['shadow_syndicate']
  },
  WARRIORS_ORDER: {
    id: 'warriors_order',
    name: 'Warriors Order',
    description: 'Elite fighters protecting the realm',
    startingRep: 0,
    allies: ['royal_guard'],
    enemies: ['chaos_cult']
  },
  MAGES_CIRCLE: {
    id: 'mages_circle',
    name: 'Mages Circle',
    description: 'Scholarly arcane practitioners',
    startingRep: 0,
    allies: ['scholars_academy'],
    enemies: ['witch_hunters']
  },
  THIEVES_NETWORK: {
    id: 'thieves_network',
    name: 'Thieves Network',
    description: 'Underground information brokers',
    startingRep: -100,
    allies: ['shadow_syndicate'],
    enemies: ['royal_guard']
  },
  ROYAL_GUARD: {
    id: 'royal_guard',
    name: 'Royal Guard',
    description: 'Protectors of the crown',
    startingRep: 50,
    allies: ['warriors_order'],
    enemies: ['thieves_network', 'chaos_cult']
  },
  NATURE_KEEPERS: {
    id: 'nature_keepers',
    name: 'Nature Keepers',
    description: 'Guardians of the wild places',
    startingRep: 0,
    allies: ['druids_grove'],
    enemies: []
  },
  CRAFTSMEN_UNION: {
    id: 'craftsmen_union',
    name: 'Craftsmen Union',
    description: 'Master artisans and builders',
    startingRep: 0,
    allies: ['merchants_guild'],
    enemies: []
  },
  SCHOLARS_ACADEMY: {
    id: 'scholars_academy',
    name: 'Scholars Academy',
    description: 'Seekers of knowledge',
    startingRep: 0,
    allies: ['mages_circle'],
    enemies: []
  },
  SHADOW_SYNDICATE: {
    id: 'shadow_syndicate',
    name: 'Shadow Syndicate',
    description: 'Mysterious criminal organization',
    startingRep: -200,
    allies: ['thieves_network'],
    enemies: ['royal_guard', 'merchants_guild']
  },
  DRUIDS_GROVE: {
    id: 'druids_grove',
    name: 'Druids Grove',
    description: 'Ancient keepers of natural balance',
    startingRep: 0,
    allies: ['nature_keepers'],
    enemies: []
  }
};

// Reputation decay rate per day (if not interacted with)
const REPUTATION_DECAY_RATE = 1;

// Maximum reputation value
const MAX_REPUTATION = 5000;
const MIN_REPUTATION = -2000;

/**
 * Initialize reputation state
 */
export function initReputationState() {
  const factionRep = {};
  Object.values(FACTIONS).forEach(faction => {
    factionRep[faction.id] = {
      value: faction.startingRep,
      tier: getTierForValue(faction.startingRep),
      history: [],
      lastChange: Date.now()
    };
  });

  return {
    factions: factionRep,
    npcRelations: {},
    regionStanding: {},
    totalRepGained: 0,
    totalRepLost: 0,
    reputationLevel: 1,
    reputationExp: 0
  };
}

/**
 * Get reputation state from game state
 */
export function getReputationState(state) {
  return state.reputation || initReputationState();
}

/**
 * Get tier for a reputation value
 */
export function getTierForValue(value) {
  const tiers = Object.values(REPUTATION_TIERS).sort((a, b) => b.minValue - a.minValue);
  for (const tier of tiers) {
    if (value >= tier.minValue) {
      return tier.id;
    }
  }
  return 'hated';
}

/**
 * Get faction reputation
 */
export function getFactionReputation(state, factionId) {
  const repState = getReputationState(state);
  const faction = FACTIONS[factionId.toUpperCase()];

  if (!faction) {
    return null;
  }

  const factionRep = repState.factions[factionId] || {
    value: faction.startingRep,
    tier: getTierForValue(faction.startingRep),
    history: [],
    lastChange: Date.now()
  };

  const tier = REPUTATION_TIERS[factionRep.tier.toUpperCase()];

  return {
    faction,
    value: factionRep.value,
    tier,
    nextTier: getNextTier(factionRep.value),
    progressToNext: getProgressToNextTier(factionRep.value)
  };
}

/**
 * Get next tier information
 */
function getNextTier(value) {
  const tiers = Object.values(REPUTATION_TIERS).sort((a, b) => a.minValue - b.minValue);
  for (const tier of tiers) {
    if (tier.minValue > value) {
      return tier;
    }
  }
  return null;
}

/**
 * Get progress to next tier (0-100)
 */
function getProgressToNextTier(value) {
  const currentTier = REPUTATION_TIERS[getTierForValue(value).toUpperCase()];
  const nextTier = getNextTier(value);

  if (!nextTier) return 100;

  const rangeStart = currentTier.minValue;
  const rangeEnd = nextTier.minValue;
  const progress = ((value - rangeStart) / (rangeEnd - rangeStart)) * 100;

  return Math.min(100, Math.max(0, Math.floor(progress)));
}

/**
 * Modify faction reputation
 */
export function modifyReputation(state, factionId, amount, reason = null) {
  const faction = FACTIONS[factionId.toUpperCase()];
  if (!faction) {
    return { state, success: false, error: 'Invalid faction' };
  }

  const repState = getReputationState(state);
  const currentFactionRep = repState.factions[factionId] || {
    value: faction.startingRep,
    tier: getTierForValue(faction.startingRep),
    history: [],
    lastChange: Date.now()
  };

  const oldValue = currentFactionRep.value;
  const oldTier = currentFactionRep.tier;

  // Clamp the new value
  const newValue = Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, oldValue + amount));
  const newTier = getTierForValue(newValue);
  const tierChanged = oldTier !== newTier;

  // Create history entry
  const historyEntry = {
    amount,
    reason,
    oldValue,
    newValue,
    timestamp: Date.now()
  };

  // Calculate ally/enemy reputation spillover
  const spilloverChanges = [];
  const spilloverRate = 0.25; // 25% of the change

  if (faction.allies) {
    faction.allies.forEach(allyId => {
      spilloverChanges.push({
        factionId: allyId,
        amount: Math.floor(amount * spilloverRate)
      });
    });
  }

  if (faction.enemies) {
    faction.enemies.forEach(enemyId => {
      spilloverChanges.push({
        factionId: enemyId,
        amount: Math.floor(-amount * spilloverRate * 0.5) // Enemies get negative at half rate
      });
    });
  }

  // Update main faction
  let newFactions = {
    ...repState.factions,
    [factionId]: {
      value: newValue,
      tier: newTier,
      history: [...currentFactionRep.history, historyEntry].slice(-50),
      lastChange: Date.now()
    }
  };

  // Apply spillover changes
  spilloverChanges.forEach(change => {
    const allyFaction = FACTIONS[change.factionId.toUpperCase()];
    if (allyFaction) {
      const current = newFactions[change.factionId] || {
        value: allyFaction.startingRep,
        tier: getTierForValue(allyFaction.startingRep),
        history: [],
        lastChange: Date.now()
      };
      const updatedValue = Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, current.value + change.amount));
      newFactions[change.factionId] = {
        ...current,
        value: updatedValue,
        tier: getTierForValue(updatedValue),
        lastChange: Date.now()
      };
    }
  });

  // Track totals
  const totalGained = repState.totalRepGained + (amount > 0 ? amount : 0);
  const totalLost = repState.totalRepLost + (amount < 0 ? Math.abs(amount) : 0);

  // Calculate reputation experience
  const expGained = Math.abs(amount);
  const newExp = repState.reputationExp + expGained;
  const newLevel = calculateReputationLevel(newExp);

  return {
    state: {
      ...state,
      reputation: {
        ...repState,
        factions: newFactions,
        totalRepGained: totalGained,
        totalRepLost: totalLost,
        reputationExp: newExp,
        reputationLevel: newLevel
      }
    },
    success: true,
    oldValue,
    newValue,
    change: amount,
    tierChanged,
    oldTier,
    newTier: tierChanged ? newTier : null,
    spillover: spilloverChanges
  };
}

/**
 * Calculate reputation level from experience
 */
export function calculateReputationLevel(exp) {
  let level = 1;
  let required = 0;

  while (exp >= required + level * 200) {
    required += level * 200;
    level++;
    if (level >= 50) break;
  }

  return level;
}

/**
 * Set NPC relation
 */
export function setNpcRelation(state, npcId, value, name = null) {
  const repState = getReputationState(state);

  const clampedValue = Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, value));

  return {
    state: {
      ...state,
      reputation: {
        ...repState,
        npcRelations: {
          ...repState.npcRelations,
          [npcId]: {
            value: clampedValue,
            tier: getTierForValue(clampedValue),
            name: name || npcId,
            lastChange: Date.now()
          }
        }
      }
    },
    success: true,
    value: clampedValue,
    tier: getTierForValue(clampedValue)
  };
}

/**
 * Modify NPC relation
 */
export function modifyNpcRelation(state, npcId, amount, reason = null) {
  const repState = getReputationState(state);
  const current = repState.npcRelations[npcId] || { value: 0, name: npcId };

  const newValue = Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, current.value + amount));
  const newTier = getTierForValue(newValue);
  const tierChanged = current.tier !== newTier;

  return {
    state: {
      ...state,
      reputation: {
        ...repState,
        npcRelations: {
          ...repState.npcRelations,
          [npcId]: {
            ...current,
            value: newValue,
            tier: newTier,
            lastChange: Date.now()
          }
        }
      }
    },
    success: true,
    oldValue: current.value,
    newValue,
    change: amount,
    tierChanged,
    newTier: tierChanged ? newTier : null
  };
}

/**
 * Get NPC relation
 */
export function getNpcRelation(state, npcId) {
  const repState = getReputationState(state);
  const relation = repState.npcRelations[npcId];

  if (!relation) {
    return {
      npcId,
      value: 0,
      tier: REPUTATION_TIERS.NEUTRAL,
      name: npcId
    };
  }

  return {
    npcId,
    value: relation.value,
    tier: REPUTATION_TIERS[relation.tier.toUpperCase()],
    name: relation.name
  };
}

/**
 * Set region standing
 */
export function setRegionStanding(state, regionId, value, name = null) {
  const repState = getReputationState(state);

  const clampedValue = Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, value));

  return {
    state: {
      ...state,
      reputation: {
        ...repState,
        regionStanding: {
          ...repState.regionStanding,
          [regionId]: {
            value: clampedValue,
            tier: getTierForValue(clampedValue),
            name: name || regionId,
            lastChange: Date.now()
          }
        }
      }
    },
    success: true,
    value: clampedValue,
    tier: getTierForValue(clampedValue)
  };
}

/**
 * Get region standing
 */
export function getRegionStanding(state, regionId) {
  const repState = getReputationState(state);
  const standing = repState.regionStanding[regionId];

  if (!standing) {
    return {
      regionId,
      value: 0,
      tier: REPUTATION_TIERS.NEUTRAL,
      name: regionId
    };
  }

  return {
    regionId,
    value: standing.value,
    tier: REPUTATION_TIERS[standing.tier.toUpperCase()],
    name: standing.name
  };
}

/**
 * Get all faction reputations
 */
export function getAllFactionReputations(state) {
  const repState = getReputationState(state);

  return Object.keys(FACTIONS).map(factionId => {
    const faction = FACTIONS[factionId];
    const rep = repState.factions[factionId.toLowerCase()] || {
      value: faction.startingRep,
      tier: getTierForValue(faction.startingRep)
    };

    return {
      faction,
      value: rep.value,
      tier: REPUTATION_TIERS[rep.tier.toUpperCase()],
      progressToNext: getProgressToNextTier(rep.value)
    };
  });
}

/**
 * Check if player can access faction services
 */
export function canAccessFactionServices(state, factionId, serviceLevel = 'basic') {
  const rep = getFactionReputation(state, factionId);
  if (!rep) return { canAccess: false, error: 'Invalid faction' };

  const requirements = {
    basic: 'neutral',
    standard: 'friendly',
    advanced: 'honored',
    elite: 'revered',
    exclusive: 'exalted'
  };

  const requiredTier = requirements[serviceLevel] || 'neutral';
  const tierOrder = ['hated', 'hostile', 'unfriendly', 'neutral', 'friendly', 'honored', 'revered', 'exalted'];

  const currentIndex = tierOrder.indexOf(rep.tier.id);
  const requiredIndex = tierOrder.indexOf(requiredTier);

  const canAccess = currentIndex >= requiredIndex;

  return {
    canAccess,
    currentTier: rep.tier.id,
    requiredTier,
    shortfall: canAccess ? 0 : REPUTATION_TIERS[requiredTier.toUpperCase()].minValue - rep.value
  };
}

/**
 * Get merchant discount based on faction reputation
 */
export function getFactionDiscount(state, factionId) {
  const rep = getFactionReputation(state, factionId);
  if (!rep) return 0;

  return rep.tier.discount || 0;
}

/**
 * Check faction hostility
 */
export function isFactionHostile(state, factionId) {
  const rep = getFactionReputation(state, factionId);
  if (!rep) return false;

  return ['hated', 'hostile'].includes(rep.tier.id);
}

/**
 * Apply reputation decay
 */
export function applyReputationDecay(state, daysPassed = 1) {
  const repState = getReputationState(state);
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  let newFactions = { ...repState.factions };

  Object.keys(newFactions).forEach(factionId => {
    const faction = newFactions[factionId];
    const daysSinceChange = (now - faction.lastChange) / msPerDay;

    // Only decay if no recent interaction (more than 7 days)
    if (daysSinceChange > 7) {
      const decayAmount = REPUTATION_DECAY_RATE * daysPassed;
      // Decay towards 0 (neutral)
      if (faction.value > 0) {
        faction.value = Math.max(0, faction.value - decayAmount);
      } else if (faction.value < 0) {
        faction.value = Math.min(0, faction.value + decayAmount);
      }
      faction.tier = getTierForValue(faction.value);
    }
  });

  return {
    state: {
      ...state,
      reputation: {
        ...repState,
        factions: newFactions
      }
    },
    decayed: true
  };
}

/**
 * Get reputation summary stats
 */
export function getReputationSummary(state) {
  const repState = getReputationState(state);

  const factionStats = {
    exalted: 0,
    revered: 0,
    honored: 0,
    friendly: 0,
    neutral: 0,
    unfriendly: 0,
    hostile: 0,
    hated: 0
  };

  Object.values(repState.factions).forEach(faction => {
    if (factionStats[faction.tier] !== undefined) {
      factionStats[faction.tier]++;
    }
  });

  return {
    level: repState.reputationLevel,
    experience: repState.reputationExp,
    totalGained: repState.totalRepGained,
    totalLost: repState.totalRepLost,
    factionBreakdown: factionStats,
    npcRelationsCount: Object.keys(repState.npcRelations).length,
    regionsCount: Object.keys(repState.regionStanding).length
  };
}

/**
 * Get reputation history for a faction
 */
export function getFactionHistory(state, factionId, limit = 10) {
  const repState = getReputationState(state);
  const faction = repState.factions[factionId];

  if (!faction || !faction.history) {
    return [];
  }

  return faction.history.slice(-limit).reverse();
}

/**
 * Check if two factions are allied
 */
export function areFactionsAllied(factionId1, factionId2) {
  const faction1 = FACTIONS[factionId1.toUpperCase()];
  const faction2 = FACTIONS[factionId2.toUpperCase()];

  if (!faction1 || !faction2) return false;

  return (faction1.allies && faction1.allies.includes(factionId2.toLowerCase())) ||
         (faction2.allies && faction2.allies.includes(factionId1.toLowerCase()));
}

/**
 * Check if two factions are enemies
 */
export function areFactionsEnemies(factionId1, factionId2) {
  const faction1 = FACTIONS[factionId1.toUpperCase()];
  const faction2 = FACTIONS[factionId2.toUpperCase()];

  if (!faction1 || !faction2) return false;

  return (faction1.enemies && faction1.enemies.includes(factionId2.toLowerCase())) ||
         (faction2.enemies && faction2.enemies.includes(factionId1.toLowerCase()));
}
