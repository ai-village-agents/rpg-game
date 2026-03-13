/**
 * Companion System
 * Pet and companion management with abilities, loyalty, and training
 */

// Companion types
export const COMPANION_TYPES = {
  BEAST: { id: 'beast', name: 'Beast', baseHealth: 100, baseDamage: 15 },
  BIRD: { id: 'bird', name: 'Bird', baseHealth: 60, baseDamage: 10 },
  ELEMENTAL: { id: 'elemental', name: 'Elemental', baseHealth: 80, baseDamage: 20 },
  SPIRIT: { id: 'spirit', name: 'Spirit', baseHealth: 70, baseDamage: 12 },
  DRAGON: { id: 'dragon', name: 'Dragon', baseHealth: 150, baseDamage: 25 },
  GOLEM: { id: 'golem', name: 'Golem', baseHealth: 200, baseDamage: 18 },
  FAIRY: { id: 'fairy', name: 'Fairy', baseHealth: 40, baseDamage: 8 },
  UNDEAD: { id: 'undead', name: 'Undead', baseHealth: 90, baseDamage: 14 }
};

// Companion rarities
export const COMPANION_RARITIES = {
  COMMON: { id: 'common', name: 'Common', statMod: 1.0, abilitySlots: 1 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', statMod: 1.2, abilitySlots: 2 },
  RARE: { id: 'rare', name: 'Rare', statMod: 1.5, abilitySlots: 3 },
  EPIC: { id: 'epic', name: 'Epic', statMod: 1.8, abilitySlots: 4 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', statMod: 2.2, abilitySlots: 5 },
  MYTHIC: { id: 'mythic', name: 'Mythic', statMod: 3.0, abilitySlots: 6 }
};

// Companion moods
export const COMPANION_MOODS = {
  ECSTATIC: { id: 'ecstatic', name: 'Ecstatic', statBonus: 0.2 },
  HAPPY: { id: 'happy', name: 'Happy', statBonus: 0.1 },
  CONTENT: { id: 'content', name: 'Content', statBonus: 0 },
  UNHAPPY: { id: 'unhappy', name: 'Unhappy', statBonus: -0.1 },
  MISERABLE: { id: 'miserable', name: 'Miserable', statBonus: -0.2 }
};

// Companion abilities
export const COMPANION_ABILITIES = {
  ATTACK: { id: 'attack', name: 'Attack', type: 'offensive', cooldown: 0 },
  DEFEND: { id: 'defend', name: 'Defend', type: 'defensive', cooldown: 3 },
  HEAL: { id: 'heal', name: 'Heal', type: 'support', cooldown: 5 },
  SCOUT: { id: 'scout', name: 'Scout', type: 'utility', cooldown: 2 },
  FETCH: { id: 'fetch', name: 'Fetch', type: 'utility', cooldown: 4 },
  TAUNT: { id: 'taunt', name: 'Taunt', type: 'defensive', cooldown: 3 },
  BUFF: { id: 'buff', name: 'Buff', type: 'support', cooldown: 6 },
  SPECIAL: { id: 'special', name: 'Special Attack', type: 'offensive', cooldown: 8 }
};

// Food types for companions
export const COMPANION_FOODS = {
  BASIC_FOOD: { id: 'basic_food', name: 'Basic Food', satiety: 20, happiness: 5 },
  QUALITY_FOOD: { id: 'quality_food', name: 'Quality Food', satiety: 40, happiness: 15 },
  PREMIUM_FOOD: { id: 'premium_food', name: 'Premium Food', satiety: 60, happiness: 25 },
  TREAT: { id: 'treat', name: 'Treat', satiety: 10, happiness: 40 },
  SPECIAL_DIET: { id: 'special_diet', name: 'Special Diet', satiety: 50, happiness: 20, expBonus: 10 }
};

/**
 * Get companion state
 */
function getCompanionState(state) {
  return state.companions || {
    owned: {},
    active: null,
    maxSlots: 3,
    inventory: [],
    stats: {
      companionsTamed: 0,
      companionsReleased: 0,
      totalBattles: 0,
      totalExp: 0
    }
  };
}

/**
 * Initialize companion state
 */
export function initCompanionState(state, maxSlots = 3) {
  return {
    state: {
      ...state,
      companions: {
        owned: {},
        active: null,
        maxSlots,
        inventory: [],
        stats: {
          companionsTamed: 0,
          companionsReleased: 0,
          totalBattles: 0,
          totalExp: 0
        }
      }
    },
    success: true
  };
}

/**
 * Create a companion
 */
export function createCompanion(options = {}) {
  const {
    id,
    name,
    type = 'beast',
    rarity = 'common',
    level = 1,
    abilities = ['attack']
  } = options;

  if (!id || !name) {
    return { companion: null, error: 'ID and name required' };
  }

  const compType = COMPANION_TYPES[type.toUpperCase()];
  const compRarity = COMPANION_RARITIES[rarity.toUpperCase()];

  if (!compType) {
    return { companion: null, error: 'Invalid companion type' };
  }

  if (!compRarity) {
    return { companion: null, error: 'Invalid rarity' };
  }

  const baseHealth = Math.floor(compType.baseHealth * compRarity.statMod);
  const baseDamage = Math.floor(compType.baseDamage * compRarity.statMod);

  const companion = {
    id,
    name,
    type: compType.id,
    rarity: compRarity.id,
    level,
    exp: 0,
    expToLevel: level * 100,
    health: baseHealth + (level - 1) * 10,
    maxHealth: baseHealth + (level - 1) * 10,
    damage: baseDamage + (level - 1) * 2,
    abilities: abilities.slice(0, compRarity.abilitySlots),
    loyalty: 50,
    happiness: 50,
    hunger: 100,
    mood: 'content',
    cooldowns: {},
    createdAt: Date.now(),
    battleCount: 0,
    kills: 0
  };

  return { companion, success: true };
}

/**
 * Add companion to collection
 */
export function addCompanion(state, companion) {
  if (!companion || !companion.id) {
    return { state, success: false, error: 'Invalid companion' };
  }

  const compState = getCompanionState(state);

  if (compState.owned[companion.id]) {
    return { state, success: false, error: 'Companion ID already exists' };
  }

  const ownedCount = Object.keys(compState.owned).length;
  if (ownedCount >= compState.maxSlots) {
    return { state, success: false, error: 'No available companion slots' };
  }

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companion.id]: companion
        },
        stats: {
          ...compState.stats,
          companionsTamed: compState.stats.companionsTamed + 1
        }
      }
    },
    success: true,
    companion
  };
}

/**
 * Release a companion
 */
export function releaseCompanion(state, companionId) {
  const compState = getCompanionState(state);

  if (!compState.owned[companionId]) {
    return { state, success: false, error: 'Companion not found' };
  }

  const released = compState.owned[companionId];
  const { [companionId]: _, ...remaining } = compState.owned;

  let newActive = compState.active;
  if (compState.active === companionId) {
    newActive = null;
  }

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: remaining,
        active: newActive,
        stats: {
          ...compState.stats,
          companionsReleased: compState.stats.companionsReleased + 1
        }
      }
    },
    success: true,
    released
  };
}

/**
 * Set active companion
 */
export function setActiveCompanion(state, companionId) {
  const compState = getCompanionState(state);

  if (companionId !== null && !compState.owned[companionId]) {
    return { state, success: false, error: 'Companion not found' };
  }

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        active: companionId
      }
    },
    success: true,
    activeCompanion: companionId ? compState.owned[companionId] : null
  };
}

/**
 * Get active companion
 */
export function getActiveCompanion(state) {
  const compState = getCompanionState(state);

  if (!compState.active) {
    return { companion: null, isActive: false };
  }

  return {
    companion: compState.owned[compState.active],
    isActive: true
  };
}

/**
 * Feed companion
 */
export function feedCompanion(state, companionId, foodType) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const food = COMPANION_FOODS[foodType.toUpperCase()];
  if (!food) {
    return { state, success: false, error: 'Invalid food type' };
  }

  const newHunger = Math.min(100, companion.hunger + food.satiety);
  const newHappiness = Math.min(100, companion.happiness + food.happiness);
  const expGain = food.expBonus || 0;

  const updatedCompanion = {
    ...companion,
    hunger: newHunger,
    happiness: newHappiness,
    exp: companion.exp + expGain,
    mood: getMoodFromHappiness(newHappiness)
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    hungerRestored: food.satiety,
    happinessGained: food.happiness
  };
}

/**
 * Get mood from happiness value
 */
function getMoodFromHappiness(happiness) {
  if (happiness >= 90) return 'ecstatic';
  if (happiness >= 70) return 'happy';
  if (happiness >= 40) return 'content';
  if (happiness >= 20) return 'unhappy';
  return 'miserable';
}

/**
 * Train companion (gain exp)
 */
export function trainCompanion(state, companionId, expGain) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  if (expGain <= 0) {
    return { state, success: false, error: 'Invalid exp amount' };
  }

  let newExp = companion.exp + expGain;
  let newLevel = companion.level;
  let levelsGained = 0;
  let expToLevel = companion.expToLevel;

  // Check for level ups
  while (newExp >= expToLevel && newLevel < 100) {
    newExp -= expToLevel;
    newLevel++;
    levelsGained++;
    expToLevel = newLevel * 100;
  }

  const compType = COMPANION_TYPES[companion.type.toUpperCase()];
  const compRarity = COMPANION_RARITIES[companion.rarity.toUpperCase()];
  const baseHealth = Math.floor(compType.baseHealth * compRarity.statMod);
  const baseDamage = Math.floor(compType.baseDamage * compRarity.statMod);

  const updatedCompanion = {
    ...companion,
    exp: newExp,
    expToLevel,
    level: newLevel,
    maxHealth: baseHealth + (newLevel - 1) * 10,
    health: Math.min(companion.health + levelsGained * 10, baseHealth + (newLevel - 1) * 10),
    damage: baseDamage + (newLevel - 1) * 2,
    loyalty: Math.min(100, companion.loyalty + (levelsGained > 0 ? 5 : 1))
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        },
        stats: {
          ...compState.stats,
          totalExp: compState.stats.totalExp + expGain
        }
      }
    },
    success: true,
    levelsGained,
    newLevel
  };
}

/**
 * Teach ability to companion
 */
export function teachAbility(state, companionId, abilityId) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const ability = COMPANION_ABILITIES[abilityId.toUpperCase()];
  if (!ability) {
    return { state, success: false, error: 'Invalid ability' };
  }

  if (companion.abilities.includes(ability.id)) {
    return { state, success: false, error: 'Companion already knows this ability' };
  }

  const compRarity = COMPANION_RARITIES[companion.rarity.toUpperCase()];
  if (companion.abilities.length >= compRarity.abilitySlots) {
    return { state, success: false, error: 'No available ability slots' };
  }

  const updatedCompanion = {
    ...companion,
    abilities: [...companion.abilities, ability.id]
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    ability: ability.id
  };
}

/**
 * Remove ability from companion
 */
export function removeAbility(state, companionId, abilityId) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  if (!companion.abilities.includes(abilityId)) {
    return { state, success: false, error: 'Companion does not know this ability' };
  }

  if (companion.abilities.length <= 1) {
    return { state, success: false, error: 'Cannot remove last ability' };
  }

  const updatedCompanion = {
    ...companion,
    abilities: companion.abilities.filter(a => a !== abilityId)
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    removed: abilityId
  };
}

/**
 * Use companion ability
 */
export function useAbility(state, companionId, abilityId) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  if (!companion.abilities.includes(abilityId)) {
    return { state, success: false, error: 'Companion does not know this ability' };
  }

  const ability = COMPANION_ABILITIES[abilityId.toUpperCase()];
  if (!ability) {
    return { state, success: false, error: 'Invalid ability' };
  }

  // Check cooldown
  if (companion.cooldowns[abilityId] && companion.cooldowns[abilityId] > 0) {
    return { state, success: false, error: 'Ability on cooldown', remaining: companion.cooldowns[abilityId] };
  }

  // Calculate effect based on companion stats
  const moodMod = COMPANION_MOODS[companion.mood.toUpperCase()]?.statBonus || 0;
  const loyaltyMod = companion.loyalty / 100;
  const effectPower = Math.floor(companion.damage * (1 + moodMod) * loyaltyMod);

  const updatedCompanion = {
    ...companion,
    cooldowns: {
      ...companion.cooldowns,
      [abilityId]: ability.cooldown
    }
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    ability: ability.id,
    type: ability.type,
    power: effectPower
  };
}

/**
 * Reduce cooldowns (called each turn)
 */
export function reduceCooldowns(state, companionId) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const newCooldowns = {};
  for (const [ability, turns] of Object.entries(companion.cooldowns)) {
    if (turns > 1) {
      newCooldowns[ability] = turns - 1;
    }
  }

  const updatedCompanion = {
    ...companion,
    cooldowns: newCooldowns
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true
  };
}

/**
 * Damage companion
 */
export function damageCompanion(state, companionId, damage) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const newHealth = Math.max(0, companion.health - damage);
  const isKnockedOut = newHealth === 0;

  const updatedCompanion = {
    ...companion,
    health: newHealth
  };

  let newActive = compState.active;
  if (isKnockedOut && compState.active === companionId) {
    newActive = null;
  }

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        },
        active: newActive
      }
    },
    success: true,
    newHealth,
    isKnockedOut
  };
}

/**
 * Heal companion
 */
export function healCompanion(state, companionId, amount) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const newHealth = Math.min(companion.maxHealth, companion.health + amount);
  const healed = newHealth - companion.health;

  const updatedCompanion = {
    ...companion,
    health: newHealth
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    healed,
    newHealth
  };
}

/**
 * Revive knocked out companion
 */
export function reviveCompanion(state, companionId, healthPercent = 50) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  if (companion.health > 0) {
    return { state, success: false, error: 'Companion is not knocked out' };
  }

  const newHealth = Math.floor(companion.maxHealth * (healthPercent / 100));

  const updatedCompanion = {
    ...companion,
    health: Math.max(1, newHealth)
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    newHealth: updatedCompanion.health
  };
}

/**
 * Update hunger (time decay)
 */
export function updateHunger(state, companionId, hungerDecay = 5) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const newHunger = Math.max(0, companion.hunger - hungerDecay);
  const isStarving = newHunger === 0;

  // Happiness decreases when hungry
  let newHappiness = companion.happiness;
  if (newHunger < 30) {
    newHappiness = Math.max(0, companion.happiness - 5);
  }

  const updatedCompanion = {
    ...companion,
    hunger: newHunger,
    happiness: newHappiness,
    mood: getMoodFromHappiness(newHappiness)
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        }
      }
    },
    success: true,
    newHunger,
    isStarving
  };
}

/**
 * Record battle participation
 */
export function recordBattle(state, companionId, kills = 0) {
  const compState = getCompanionState(state);
  const companion = compState.owned[companionId];

  if (!companion) {
    return { state, success: false, error: 'Companion not found' };
  }

  const updatedCompanion = {
    ...companion,
    battleCount: companion.battleCount + 1,
    kills: companion.kills + kills
  };

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        owned: {
          ...compState.owned,
          [companionId]: updatedCompanion
        },
        stats: {
          ...compState.stats,
          totalBattles: compState.stats.totalBattles + 1
        }
      }
    },
    success: true
  };
}

/**
 * Get all owned companions
 */
export function getOwnedCompanions(state) {
  const compState = getCompanionState(state);
  return Object.values(compState.owned);
}

/**
 * Get companion by ID
 */
export function getCompanion(state, companionId) {
  const compState = getCompanionState(state);
  return compState.owned[companionId] || null;
}

/**
 * Get companion stats
 */
export function getCompanionStats(state) {
  const compState = getCompanionState(state);
  return { ...compState.stats };
}

/**
 * Calculate companion combat power
 */
export function calculateCombatPower(companion) {
  if (!companion) return 0;

  const moodMod = COMPANION_MOODS[companion.mood.toUpperCase()]?.statBonus || 0;
  const loyaltyMod = companion.loyalty / 100;
  const rarityMod = COMPANION_RARITIES[companion.rarity.toUpperCase()]?.statMod || 1;

  const basePower = companion.damage * companion.level;
  const totalPower = Math.floor(basePower * (1 + moodMod) * loyaltyMod * rarityMod);

  return totalPower;
}

/**
 * Get available slots
 */
export function getAvailableSlots(state) {
  const compState = getCompanionState(state);
  const ownedCount = Object.keys(compState.owned).length;
  return {
    used: ownedCount,
    max: compState.maxSlots,
    available: compState.maxSlots - ownedCount
  };
}

/**
 * Upgrade max slots
 */
export function upgradeMaxSlots(state, additionalSlots = 1) {
  const compState = getCompanionState(state);

  return {
    state: {
      ...state,
      companions: {
        ...compState,
        maxSlots: compState.maxSlots + additionalSlots
      }
    },
    success: true,
    newMax: compState.maxSlots + additionalSlots
  };
}
