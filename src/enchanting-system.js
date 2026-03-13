/**
 * Enchanting System
 * Manages magical item enhancement, rune inscription, and enchantment management
 */

// Enchantment types
export const ENCHANTMENT_TYPES = {
  DAMAGE: { id: 'damage', name: 'Damage', category: 'offensive', color: '#FF4444' },
  DEFENSE: { id: 'defense', name: 'Defense', category: 'defensive', color: '#4444FF' },
  SPEED: { id: 'speed', name: 'Speed', category: 'utility', color: '#44FF44' },
  LIFESTEAL: { id: 'lifesteal', name: 'Lifesteal', category: 'offensive', color: '#AA0000' },
  MANA_REGEN: { id: 'mana_regen', name: 'Mana Regeneration', category: 'utility', color: '#0088FF' },
  CRITICAL: { id: 'critical', name: 'Critical Strike', category: 'offensive', color: '#FFAA00' },
  THORNS: { id: 'thorns', name: 'Thorns', category: 'defensive', color: '#884400' },
  ELEMENTAL_FIRE: { id: 'elemental_fire', name: 'Fire Damage', category: 'elemental', color: '#FF6600' },
  ELEMENTAL_ICE: { id: 'elemental_ice', name: 'Ice Damage', category: 'elemental', color: '#00CCFF' },
  ELEMENTAL_LIGHTNING: { id: 'elemental_lightning', name: 'Lightning Damage', category: 'elemental', color: '#FFFF00' },
  DURABILITY: { id: 'durability', name: 'Durability', category: 'utility', color: '#888888' },
  LUCK: { id: 'luck', name: 'Luck', category: 'utility', color: '#00FF88' }
};

// Enchantment tiers
export const ENCHANTMENT_TIERS = {
  MINOR: { id: 'minor', name: 'Minor', multiplier: 0.5, maxLevel: 3, color: '#AAAAAA' },
  STANDARD: { id: 'standard', name: 'Standard', multiplier: 1.0, maxLevel: 5, color: '#55FF55' },
  GREATER: { id: 'greater', name: 'Greater', multiplier: 1.5, maxLevel: 7, color: '#5555FF' },
  SUPERIOR: { id: 'superior', name: 'Superior', multiplier: 2.0, maxLevel: 10, color: '#AA55FF' },
  LEGENDARY: { id: 'legendary', name: 'Legendary', multiplier: 3.0, maxLevel: 15, color: '#FFAA00' }
};

// Runes for enchanting
export const RUNES = {
  RUNE_OF_POWER: { id: 'rune_of_power', name: 'Rune of Power', types: ['damage', 'critical'], rarity: 'common' },
  RUNE_OF_PROTECTION: { id: 'rune_of_protection', name: 'Rune of Protection', types: ['defense', 'thorns'], rarity: 'common' },
  RUNE_OF_SWIFTNESS: { id: 'rune_of_swiftness', name: 'Rune of Swiftness', types: ['speed'], rarity: 'common' },
  RUNE_OF_VAMPIRISM: { id: 'rune_of_vampirism', name: 'Rune of Vampirism', types: ['lifesteal'], rarity: 'uncommon' },
  RUNE_OF_ARCANA: { id: 'rune_of_arcana', name: 'Rune of Arcana', types: ['mana_regen'], rarity: 'uncommon' },
  RUNE_OF_FLAME: { id: 'rune_of_flame', name: 'Rune of Flame', types: ['elemental_fire'], rarity: 'rare' },
  RUNE_OF_FROST: { id: 'rune_of_frost', name: 'Rune of Frost', types: ['elemental_ice'], rarity: 'rare' },
  RUNE_OF_STORM: { id: 'rune_of_storm', name: 'Rune of Storm', types: ['elemental_lightning'], rarity: 'rare' },
  RUNE_OF_FORTUNE: { id: 'rune_of_fortune', name: 'Rune of Fortune', types: ['luck'], rarity: 'rare' },
  RUNE_OF_ETERNITY: { id: 'rune_of_eternity', name: 'Rune of Eternity', types: ['durability'], rarity: 'uncommon' }
};

// Item slot restrictions
export const SLOT_ENCHANTMENTS = {
  weapon: ['damage', 'critical', 'lifesteal', 'elemental_fire', 'elemental_ice', 'elemental_lightning', 'speed'],
  armor: ['defense', 'thorns', 'durability', 'mana_regen'],
  helmet: ['defense', 'mana_regen', 'luck'],
  boots: ['speed', 'defense'],
  gloves: ['damage', 'critical', 'speed'],
  accessory: ['luck', 'mana_regen', 'lifesteal', 'critical']
};

// Base enchantment values per level
const BASE_VALUES = {
  damage: 5,
  defense: 3,
  speed: 2,
  lifesteal: 1,
  mana_regen: 2,
  critical: 1,
  thorns: 2,
  elemental_fire: 4,
  elemental_ice: 4,
  elemental_lightning: 4,
  durability: 5,
  luck: 1
};

// Success rate modifiers
const BASE_SUCCESS_RATE = 0.9;
const LEVEL_PENALTY = 0.05;

/**
 * Initialize enchanting state
 */
export function initEnchantingState() {
  return {
    enchantingLevel: 1,
    enchantingExp: 0,
    totalEnchantments: 0,
    successfulEnchantments: 0,
    failedEnchantments: 0,
    runesUsed: 0,
    discoveredEnchantments: [],
    favoriteEnchantments: [],
    enchantmentHistory: []
  };
}

/**
 * Get enchanting state from game state
 */
export function getEnchantingState(state) {
  return state.enchanting || initEnchantingState();
}

/**
 * Calculate success rate for enchantment
 */
export function calculateSuccessRate(currentLevel, tier, enchantingLevel) {
  const tierData = ENCHANTMENT_TIERS[tier.toUpperCase()];
  if (!tierData) return 0;

  // Base rate minus penalty per level
  let rate = BASE_SUCCESS_RATE - (currentLevel * LEVEL_PENALTY);

  // Tier difficulty
  const tierPenalties = { minor: 0, standard: 0.05, greater: 0.1, superior: 0.15, legendary: 0.25 };
  rate -= tierPenalties[tierData.id] || 0;

  // Enchanting skill bonus (up to 15%)
  rate += Math.min(0.15, enchantingLevel * 0.01);

  return Math.max(0.05, Math.min(0.95, rate));
}

/**
 * Apply an enchantment to an item
 */
export function applyEnchantment(state, itemId, enchantmentType, tier = 'standard', options = {}) {
  const enchantType = ENCHANTMENT_TYPES[enchantmentType.toUpperCase()];
  if (!enchantType) {
    return { state, success: false, error: 'Invalid enchantment type' };
  }

  const tierData = ENCHANTMENT_TIERS[tier.toUpperCase()];
  if (!tierData) {
    return { state, success: false, error: 'Invalid tier' };
  }

  const enchantingState = getEnchantingState(state);
  const { runeId = null, forceSuccess = false } = options;

  // Get current enchantment level on item (simulated - would check item in real implementation)
  const currentLevel = options.currentLevel || 0;

  // Check if at max level for tier
  if (currentLevel >= tierData.maxLevel) {
    return { state, success: false, error: 'Already at maximum level for this tier' };
  }

  // Calculate success chance
  const successRate = forceSuccess ? 1.0 : calculateSuccessRate(currentLevel, tier, enchantingState.enchantingLevel);
  const roll = Math.random();
  const succeeded = roll <= successRate;

  // Calculate enchantment value
  const baseValue = BASE_VALUES[enchantType.id] || 1;
  const newLevel = currentLevel + 1;
  const enchantmentValue = Math.floor(baseValue * newLevel * tierData.multiplier);

  // Calculate experience
  const baseExp = 10 + (newLevel * 5);
  const expGained = succeeded ? baseExp : Math.floor(baseExp * 0.3);
  const newExp = enchantingState.enchantingExp + expGained;
  const newEnchantingLevel = calculateEnchantingLevel(newExp);

  // Create enchantment result
  const enchantment = {
    id: `ench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    itemId,
    type: enchantType.id,
    tier: tierData.id,
    level: newLevel,
    value: enchantmentValue,
    runeUsed: runeId,
    timestamp: Date.now(),
    succeeded
  };

  // Track discovery
  const newDiscovered = [...enchantingState.discoveredEnchantments];
  if (!newDiscovered.includes(enchantType.id)) {
    newDiscovered.push(enchantType.id);
  }

  return {
    state: {
      ...state,
      enchanting: {
        ...enchantingState,
        enchantingLevel: newEnchantingLevel,
        enchantingExp: newExp,
        totalEnchantments: enchantingState.totalEnchantments + 1,
        successfulEnchantments: enchantingState.successfulEnchantments + (succeeded ? 1 : 0),
        failedEnchantments: enchantingState.failedEnchantments + (succeeded ? 0 : 1),
        runesUsed: enchantingState.runesUsed + (runeId ? 1 : 0),
        discoveredEnchantments: newDiscovered,
        enchantmentHistory: [...enchantingState.enchantmentHistory, enchantment].slice(-100)
      }
    },
    success: succeeded,
    enchantment,
    successRate,
    roll,
    expGained,
    leveledUp: newEnchantingLevel > enchantingState.enchantingLevel
  };
}

/**
 * Calculate enchanting level from experience
 */
export function calculateEnchantingLevel(exp) {
  let level = 1;
  let required = 0;

  while (exp >= required + level * 100) {
    required += level * 100;
    level++;
    if (level >= 100) break;
  }

  return level;
}

/**
 * Remove enchantment from item
 */
export function removeEnchantment(state, itemId, enchantmentId) {
  const enchantingState = getEnchantingState(state);

  // In a real implementation, this would modify the item
  // For now, just track the removal

  return {
    state: {
      ...state,
      enchanting: {
        ...enchantingState,
        enchantmentHistory: [
          ...enchantingState.enchantmentHistory,
          {
            id: `remove_${Date.now()}`,
            itemId,
            removedEnchantmentId: enchantmentId,
            action: 'remove',
            timestamp: Date.now()
          }
        ].slice(-100)
      }
    },
    success: true,
    removed: true
  };
}

/**
 * Transfer enchantment from one item to another
 */
export function transferEnchantment(state, sourceItemId, targetItemId, enchantmentId, options = {}) {
  const enchantingState = getEnchantingState(state);
  const { preserveSource = false } = options;

  // Transfer success rate (lower than applying new)
  const baseTransferRate = 0.7;
  const skillBonus = Math.min(0.2, enchantingState.enchantingLevel * 0.01);
  const successRate = baseTransferRate + skillBonus;

  const roll = Math.random();
  const succeeded = roll <= successRate;

  const expGained = succeeded ? 25 : 8;
  const newExp = enchantingState.enchantingExp + expGained;
  const newLevel = calculateEnchantingLevel(newExp);

  return {
    state: {
      ...state,
      enchanting: {
        ...enchantingState,
        enchantingLevel: newLevel,
        enchantingExp: newExp,
        totalEnchantments: enchantingState.totalEnchantments + 1,
        successfulEnchantments: enchantingState.successfulEnchantments + (succeeded ? 1 : 0),
        failedEnchantments: enchantingState.failedEnchantments + (succeeded ? 0 : 1),
        enchantmentHistory: [
          ...enchantingState.enchantmentHistory,
          {
            id: `transfer_${Date.now()}`,
            sourceItemId,
            targetItemId,
            enchantmentId,
            action: 'transfer',
            succeeded,
            preservedSource: preserveSource && succeeded,
            timestamp: Date.now()
          }
        ].slice(-100)
      }
    },
    success: succeeded,
    sourcePreserved: preserveSource && succeeded,
    successRate,
    expGained
  };
}

/**
 * Combine two enchantments of the same type
 */
export function combineEnchantments(state, itemId, enchantmentId1, enchantmentId2) {
  const enchantingState = getEnchantingState(state);

  // Combination always works but produces variable results
  const bonusRoll = Math.random();
  let combinationBonus = 'standard';

  if (bonusRoll < 0.1) combinationBonus = 'perfect'; // 10% chance for perfect combination
  else if (bonusRoll < 0.3) combinationBonus = 'good'; // 20% chance for good
  else if (bonusRoll > 0.9) combinationBonus = 'poor'; // 10% chance for poor

  const bonusMultipliers = {
    perfect: 1.5,
    good: 1.2,
    standard: 1.0,
    poor: 0.8
  };

  const expGained = 30;
  const newExp = enchantingState.enchantingExp + expGained;
  const newLevel = calculateEnchantingLevel(newExp);

  return {
    state: {
      ...state,
      enchanting: {
        ...enchantingState,
        enchantingLevel: newLevel,
        enchantingExp: newExp,
        totalEnchantments: enchantingState.totalEnchantments + 1,
        successfulEnchantments: enchantingState.successfulEnchantments + 1,
        enchantmentHistory: [
          ...enchantingState.enchantmentHistory,
          {
            id: `combine_${Date.now()}`,
            itemId,
            enchantment1: enchantmentId1,
            enchantment2: enchantmentId2,
            action: 'combine',
            result: combinationBonus,
            multiplier: bonusMultipliers[combinationBonus],
            timestamp: Date.now()
          }
        ].slice(-100)
      }
    },
    success: true,
    combinationResult: combinationBonus,
    multiplier: bonusMultipliers[combinationBonus],
    expGained
  };
}

/**
 * Get valid enchantments for an item slot
 */
export function getValidEnchantments(slotType) {
  const validTypes = SLOT_ENCHANTMENTS[slotType.toLowerCase()];
  if (!validTypes) return [];

  return validTypes.map(typeId => ENCHANTMENT_TYPES[typeId.toUpperCase()]).filter(Boolean);
}

/**
 * Get runes that can produce an enchantment type
 */
export function getRunesForEnchantment(enchantmentType) {
  return Object.values(RUNES).filter(rune =>
    rune.types.includes(enchantmentType.toLowerCase())
  );
}

/**
 * Calculate enchantment value
 */
export function calculateEnchantmentValue(enchantmentType, level, tier) {
  const enchantType = ENCHANTMENT_TYPES[enchantmentType.toUpperCase()];
  const tierData = ENCHANTMENT_TIERS[tier.toUpperCase()];

  if (!enchantType || !tierData) return 0;

  const baseValue = BASE_VALUES[enchantType.id] || 1;
  return Math.floor(baseValue * level * tierData.multiplier);
}

/**
 * Get enchanting statistics
 */
export function getEnchantingStats(state) {
  const enchantingState = getEnchantingState(state);

  const successRate = enchantingState.totalEnchantments > 0
    ? (enchantingState.successfulEnchantments / enchantingState.totalEnchantments * 100).toFixed(1)
    : 0;

  return {
    level: enchantingState.enchantingLevel,
    experience: enchantingState.enchantingExp,
    totalEnchantments: enchantingState.totalEnchantments,
    successful: enchantingState.successfulEnchantments,
    failed: enchantingState.failedEnchantments,
    successRate: parseFloat(successRate),
    runesUsed: enchantingState.runesUsed,
    discoveredCount: enchantingState.discoveredEnchantments.length,
    totalEnchantmentTypes: Object.keys(ENCHANTMENT_TYPES).length
  };
}

/**
 * Get enchantment history
 */
export function getEnchantmentHistory(state, limit = 10) {
  const enchantingState = getEnchantingState(state);
  return enchantingState.enchantmentHistory.slice(-limit).reverse();
}

/**
 * Add enchantment to favorites
 */
export function addFavoriteEnchantment(state, enchantmentType) {
  const enchantingState = getEnchantingState(state);

  if (enchantingState.favoriteEnchantments.includes(enchantmentType)) {
    return { state, added: false, alreadyFavorite: true };
  }

  return {
    state: {
      ...state,
      enchanting: {
        ...enchantingState,
        favoriteEnchantments: [...enchantingState.favoriteEnchantments, enchantmentType]
      }
    },
    added: true
  };
}

/**
 * Remove enchantment from favorites
 */
export function removeFavoriteEnchantment(state, enchantmentType) {
  const enchantingState = getEnchantingState(state);

  if (!enchantingState.favoriteEnchantments.includes(enchantmentType)) {
    return { state, removed: false, notFavorite: true };
  }

  return {
    state: {
      ...state,
      enchanting: {
        ...enchantingState,
        favoriteEnchantments: enchantingState.favoriteEnchantments.filter(e => e !== enchantmentType)
      }
    },
    removed: true
  };
}

/**
 * Check if enchantment type is discovered
 */
export function isEnchantmentDiscovered(state, enchantmentType) {
  const enchantingState = getEnchantingState(state);
  return enchantingState.discoveredEnchantments.includes(enchantmentType.toLowerCase());
}

/**
 * Get all discovered enchantments
 */
export function getDiscoveredEnchantments(state) {
  const enchantingState = getEnchantingState(state);
  return enchantingState.discoveredEnchantments.map(typeId =>
    ENCHANTMENT_TYPES[typeId.toUpperCase()]
  ).filter(Boolean);
}

/**
 * Estimate cost for enchantment
 */
export function estimateEnchantmentCost(enchantmentType, tier, level) {
  const tierData = ENCHANTMENT_TIERS[tier.toUpperCase()];
  if (!tierData) return 0;

  const baseCost = 50;
  const tierMultipliers = { minor: 0.5, standard: 1, greater: 2, superior: 4, legendary: 10 };

  return Math.floor(baseCost * level * (tierMultipliers[tierData.id] || 1));
}

/**
 * Get tier progression info
 */
export function getTierProgression(tier, currentLevel) {
  const tierData = ENCHANTMENT_TIERS[tier.toUpperCase()];
  if (!tierData) return null;

  return {
    tier: tierData,
    currentLevel,
    maxLevel: tierData.maxLevel,
    atMax: currentLevel >= tierData.maxLevel,
    progress: Math.min(100, Math.floor((currentLevel / tierData.maxLevel) * 100))
  };
}

/**
 * Get all runes
 */
export function getAllRunes() {
  return Object.values(RUNES);
}

/**
 * Get rune by ID
 */
export function getRuneById(runeId) {
  return RUNES[runeId.toUpperCase()] || null;
}
