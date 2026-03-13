/**
 * Mount and Pet System
 * Provides companion creatures that grant passive bonuses, travel speed, and combat assistance
 */

// Mount types
const MOUNT_TYPE = {
  HORSE: 'horse',
  WOLF: 'wolf',
  BEAR: 'bear',
  DRAGON: 'dragon',
  GRIFFIN: 'griffin',
  UNICORN: 'unicorn',
  NIGHTMARE: 'nightmare',
  PHOENIX_BIRD: 'phoenix_bird'
};

// Pet types
const PET_TYPE = {
  CAT: 'cat',
  DOG: 'dog',
  OWL: 'owl',
  SNAKE: 'snake',
  FAIRY: 'fairy',
  IMP: 'imp',
  ELEMENTAL: 'elemental',
  MIMIC: 'mimic'
};

// Companion rarity
const COMPANION_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Pet ability types
const PET_ABILITY = {
  LOOT_FINDER: 'loot_finder',
  XP_BOOST: 'xp_boost',
  GOLD_BOOST: 'gold_boost',
  COMBAT_ASSIST: 'combat_assist',
  GATHERING_BOOST: 'gathering_boost',
  STEALTH_BONUS: 'stealth_bonus',
  HEALING_AURA: 'healing_aura',
  ELEMENTAL_RESIST: 'elemental_resist'
};

// Mount ability types
const MOUNT_ABILITY = {
  SPEED_BOOST: 'speed_boost',
  STAMINA_REGEN: 'stamina_regen',
  CARRY_CAPACITY: 'carry_capacity',
  TERRAIN_MASTERY: 'terrain_mastery',
  COMBAT_MOUNT: 'combat_mount',
  FLYING: 'flying',
  SWIMMING: 'swimming',
  CHARGE_ATTACK: 'charge_attack'
};

// Happiness levels affect bonuses
const HAPPINESS_LEVEL = {
  MISERABLE: 'miserable',
  UNHAPPY: 'unhappy',
  CONTENT: 'content',
  HAPPY: 'happy',
  ECSTATIC: 'ecstatic'
};

// Mount configurations
const MOUNT_CONFIG = {
  [MOUNT_TYPE.HORSE]: {
    name: 'Horse',
    rarity: COMPANION_RARITY.COMMON,
    baseSpeed: 1.5,
    abilities: [MOUNT_ABILITY.SPEED_BOOST, MOUNT_ABILITY.STAMINA_REGEN],
    maxLevel: 20,
    foodTypes: ['hay', 'apple', 'carrot']
  },
  [MOUNT_TYPE.WOLF]: {
    name: 'Dire Wolf',
    rarity: COMPANION_RARITY.UNCOMMON,
    baseSpeed: 1.8,
    abilities: [MOUNT_ABILITY.SPEED_BOOST, MOUNT_ABILITY.COMBAT_MOUNT],
    maxLevel: 25,
    foodTypes: ['meat', 'bone', 'fish']
  },
  [MOUNT_TYPE.BEAR]: {
    name: 'War Bear',
    rarity: COMPANION_RARITY.RARE,
    baseSpeed: 1.3,
    abilities: [MOUNT_ABILITY.CARRY_CAPACITY, MOUNT_ABILITY.COMBAT_MOUNT, MOUNT_ABILITY.TERRAIN_MASTERY],
    maxLevel: 30,
    foodTypes: ['meat', 'honey', 'fish', 'berries']
  },
  [MOUNT_TYPE.DRAGON]: {
    name: 'Drake',
    rarity: COMPANION_RARITY.LEGENDARY,
    baseSpeed: 2.5,
    abilities: [MOUNT_ABILITY.FLYING, MOUNT_ABILITY.COMBAT_MOUNT, MOUNT_ABILITY.CHARGE_ATTACK],
    maxLevel: 50,
    foodTypes: ['meat', 'gems', 'magical_essence']
  },
  [MOUNT_TYPE.GRIFFIN]: {
    name: 'Griffin',
    rarity: COMPANION_RARITY.EPIC,
    baseSpeed: 2.2,
    abilities: [MOUNT_ABILITY.FLYING, MOUNT_ABILITY.SPEED_BOOST],
    maxLevel: 40,
    foodTypes: ['meat', 'magical_essence']
  },
  [MOUNT_TYPE.UNICORN]: {
    name: 'Unicorn',
    rarity: COMPANION_RARITY.EPIC,
    baseSpeed: 2.0,
    abilities: [MOUNT_ABILITY.SPEED_BOOST, MOUNT_ABILITY.TERRAIN_MASTERY],
    maxLevel: 40,
    foodTypes: ['apple', 'starfruit', 'magical_essence']
  },
  [MOUNT_TYPE.NIGHTMARE]: {
    name: 'Nightmare',
    rarity: COMPANION_RARITY.LEGENDARY,
    baseSpeed: 2.3,
    abilities: [MOUNT_ABILITY.SPEED_BOOST, MOUNT_ABILITY.COMBAT_MOUNT, MOUNT_ABILITY.TERRAIN_MASTERY],
    maxLevel: 50,
    foodTypes: ['soul_shard', 'ember', 'magical_essence']
  },
  [MOUNT_TYPE.PHOENIX_BIRD]: {
    name: 'Fire Bird',
    rarity: COMPANION_RARITY.LEGENDARY,
    baseSpeed: 2.4,
    abilities: [MOUNT_ABILITY.FLYING, MOUNT_ABILITY.SPEED_BOOST],
    maxLevel: 50,
    foodTypes: ['ember', 'magical_essence', 'sunstone']
  }
};

// Pet configurations
const PET_CONFIG = {
  [PET_TYPE.CAT]: {
    name: 'Cat',
    rarity: COMPANION_RARITY.COMMON,
    abilities: [PET_ABILITY.LOOT_FINDER, PET_ABILITY.STEALTH_BONUS],
    maxLevel: 20,
    foodTypes: ['fish', 'meat', 'milk']
  },
  [PET_TYPE.DOG]: {
    name: 'Dog',
    rarity: COMPANION_RARITY.COMMON,
    abilities: [PET_ABILITY.COMBAT_ASSIST, PET_ABILITY.XP_BOOST],
    maxLevel: 20,
    foodTypes: ['meat', 'bone', 'treats']
  },
  [PET_TYPE.OWL]: {
    name: 'Owl',
    rarity: COMPANION_RARITY.UNCOMMON,
    abilities: [PET_ABILITY.XP_BOOST, PET_ABILITY.LOOT_FINDER],
    maxLevel: 25,
    foodTypes: ['meat', 'insects', 'mice']
  },
  [PET_TYPE.SNAKE]: {
    name: 'Serpent',
    rarity: COMPANION_RARITY.UNCOMMON,
    abilities: [PET_ABILITY.COMBAT_ASSIST, PET_ABILITY.STEALTH_BONUS],
    maxLevel: 25,
    foodTypes: ['mice', 'insects', 'small_game']
  },
  [PET_TYPE.FAIRY]: {
    name: 'Fairy',
    rarity: COMPANION_RARITY.RARE,
    abilities: [PET_ABILITY.HEALING_AURA, PET_ABILITY.GATHERING_BOOST],
    maxLevel: 30,
    foodTypes: ['nectar', 'berries', 'magical_essence']
  },
  [PET_TYPE.IMP]: {
    name: 'Imp',
    rarity: COMPANION_RARITY.RARE,
    abilities: [PET_ABILITY.GOLD_BOOST, PET_ABILITY.COMBAT_ASSIST],
    maxLevel: 30,
    foodTypes: ['gems', 'gold_dust', 'magical_essence']
  },
  [PET_TYPE.ELEMENTAL]: {
    name: 'Elemental Sprite',
    rarity: COMPANION_RARITY.EPIC,
    abilities: [PET_ABILITY.ELEMENTAL_RESIST, PET_ABILITY.COMBAT_ASSIST, PET_ABILITY.GATHERING_BOOST],
    maxLevel: 40,
    foodTypes: ['elemental_shard', 'magical_essence']
  },
  [PET_TYPE.MIMIC]: {
    name: 'Friendly Mimic',
    rarity: COMPANION_RARITY.EPIC,
    abilities: [PET_ABILITY.LOOT_FINDER, PET_ABILITY.GOLD_BOOST, PET_ABILITY.STEALTH_BONUS],
    maxLevel: 40,
    foodTypes: ['gold_dust', 'gems', 'magical_essence']
  }
};

// Happiness thresholds
const HAPPINESS_THRESHOLDS = {
  [HAPPINESS_LEVEL.MISERABLE]: 0,
  [HAPPINESS_LEVEL.UNHAPPY]: 20,
  [HAPPINESS_LEVEL.CONTENT]: 40,
  [HAPPINESS_LEVEL.HAPPY]: 70,
  [HAPPINESS_LEVEL.ECSTATIC]: 90
};

// Happiness multipliers for bonuses
const HAPPINESS_MULTIPLIERS = {
  [HAPPINESS_LEVEL.MISERABLE]: 0.5,
  [HAPPINESS_LEVEL.UNHAPPY]: 0.75,
  [HAPPINESS_LEVEL.CONTENT]: 1.0,
  [HAPPINESS_LEVEL.HAPPY]: 1.25,
  [HAPPINESS_LEVEL.ECSTATIC]: 1.5
};

// Rarity multipliers
const RARITY_MULTIPLIERS = {
  [COMPANION_RARITY.COMMON]: 1.0,
  [COMPANION_RARITY.UNCOMMON]: 1.15,
  [COMPANION_RARITY.RARE]: 1.3,
  [COMPANION_RARITY.EPIC]: 1.5,
  [COMPANION_RARITY.LEGENDARY]: 2.0
};

// XP required per level
function getXpForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * Create initial companion state
 */
function createCompanionState() {
  return {
    mounts: {},
    pets: {},
    activeMount: null,
    activePet: null,
    stable: {
      capacity: 5,
      upgrades: 0
    },
    kennel: {
      capacity: 5,
      upgrades: 0
    }
  };
}

/**
 * Create a new mount
 */
function createMount(mountType, customName = null) {
  const config = MOUNT_CONFIG[mountType];
  if (!config) {
    throw new Error(`Invalid mount type: ${mountType}`);
  }

  const id = `mount_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type: mountType,
    name: customName || config.name,
    rarity: config.rarity,
    level: 1,
    xp: 0,
    happiness: 50,
    hunger: 100,
    lastFed: Date.now(),
    abilities: [...config.abilities],
    stats: {
      speed: config.baseSpeed,
      stamina: 100,
      maxStamina: 100
    },
    equipped: false,
    bondLevel: 0
  };
}

/**
 * Create a new pet
 */
function createPet(petType, customName = null) {
  const config = PET_CONFIG[petType];
  if (!config) {
    throw new Error(`Invalid pet type: ${petType}`);
  }

  const id = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type: petType,
    name: customName || config.name,
    rarity: config.rarity,
    level: 1,
    xp: 0,
    happiness: 50,
    hunger: 100,
    lastFed: Date.now(),
    abilities: [...config.abilities],
    equipped: false,
    bondLevel: 0
  };
}

/**
 * Add mount to stable
 */
function addMount(state, mount) {
  const stableCount = Object.keys(state.mounts).length;
  if (stableCount >= state.stable.capacity) {
    return {
      success: false,
      error: 'Stable is full',
      state
    };
  }

  return {
    success: true,
    state: {
      ...state,
      mounts: {
        ...state.mounts,
        [mount.id]: mount
      }
    }
  };
}

/**
 * Add pet to kennel
 */
function addPet(state, pet) {
  const kennelCount = Object.keys(state.pets).length;
  if (kennelCount >= state.kennel.capacity) {
    return {
      success: false,
      error: 'Kennel is full',
      state
    };
  }

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        [pet.id]: pet
      }
    }
  };
}

/**
 * Equip mount
 */
function equipMount(state, mountId) {
  const mount = state.mounts[mountId];
  if (!mount) {
    return {
      success: false,
      error: 'Mount not found',
      state
    };
  }

  // Unequip current mount if any
  const updatedMounts = { ...state.mounts };
  if (state.activeMount) {
    updatedMounts[state.activeMount] = {
      ...updatedMounts[state.activeMount],
      equipped: false
    };
  }

  updatedMounts[mountId] = {
    ...updatedMounts[mountId],
    equipped: true
  };

  return {
    success: true,
    state: {
      ...state,
      mounts: updatedMounts,
      activeMount: mountId
    }
  };
}

/**
 * Unequip mount
 */
function unequipMount(state) {
  if (!state.activeMount) {
    return {
      success: false,
      error: 'No mount equipped',
      state
    };
  }

  const updatedMounts = {
    ...state.mounts,
    [state.activeMount]: {
      ...state.mounts[state.activeMount],
      equipped: false
    }
  };

  return {
    success: true,
    state: {
      ...state,
      mounts: updatedMounts,
      activeMount: null
    }
  };
}

/**
 * Equip pet
 */
function equipPet(state, petId) {
  const pet = state.pets[petId];
  if (!pet) {
    return {
      success: false,
      error: 'Pet not found',
      state
    };
  }

  // Unequip current pet if any
  const updatedPets = { ...state.pets };
  if (state.activePet) {
    updatedPets[state.activePet] = {
      ...updatedPets[state.activePet],
      equipped: false
    };
  }

  updatedPets[petId] = {
    ...updatedPets[petId],
    equipped: true
  };

  return {
    success: true,
    state: {
      ...state,
      pets: updatedPets,
      activePet: petId
    }
  };
}

/**
 * Unequip pet
 */
function unequipPet(state) {
  if (!state.activePet) {
    return {
      success: false,
      error: 'No pet equipped',
      state
    };
  }

  const updatedPets = {
    ...state.pets,
    [state.activePet]: {
      ...state.pets[state.activePet],
      equipped: false
    }
  };

  return {
    success: true,
    state: {
      ...state,
      pets: updatedPets,
      activePet: null
    }
  };
}

/**
 * Feed companion (mount or pet)
 */
function feedCompanion(state, companionId, foodItem, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  const companion = collection[companionId];

  if (!companion) {
    return {
      success: false,
      error: `${isMount ? 'Mount' : 'Pet'} not found`,
      state
    };
  }

  const config = isMount ? MOUNT_CONFIG[companion.type] : PET_CONFIG[companion.type];

  if (!config.foodTypes.includes(foodItem)) {
    return {
      success: false,
      error: `${companion.name} doesn't like ${foodItem}`,
      state
    };
  }

  const hungerRestore = 25;
  const happinessGain = 10;
  const xpGain = 5;

  const updatedCompanion = {
    ...companion,
    hunger: Math.min(100, companion.hunger + hungerRestore),
    happiness: Math.min(100, companion.happiness + happinessGain),
    xp: companion.xp + xpGain,
    lastFed: Date.now()
  };

  // Check for level up
  const levelUpResult = checkLevelUp(updatedCompanion, config.maxLevel, isMount);

  const updatedCollection = {
    ...collection,
    [companionId]: levelUpResult.companion
  };

  return {
    success: true,
    hungerRestored: hungerRestore,
    happinessGained: happinessGain,
    xpGained: xpGain,
    leveledUp: levelUpResult.leveledUp,
    newLevel: levelUpResult.companion.level,
    state: {
      ...state,
      [isMount ? 'mounts' : 'pets']: updatedCollection
    }
  };
}

/**
 * Check and process level up
 */
function checkLevelUp(companion, maxLevel, isMount) {
  let leveledUp = false;
  let current = { ...companion };

  while (current.level < maxLevel) {
    const xpNeeded = getXpForLevel(current.level + 1);
    if (current.xp >= xpNeeded) {
      current.xp -= xpNeeded;
      current.level += 1;
      leveledUp = true;

      // Level up bonuses for mounts
      if (isMount && current.stats) {
        current.stats = {
          ...current.stats,
          speed: current.stats.speed + 0.05,
          maxStamina: current.stats.maxStamina + 5
        };
      }
    } else {
      break;
    }
  }

  return { companion: current, leveledUp };
}

/**
 * Grant XP to companion
 */
function grantCompanionXp(state, companionId, xpAmount, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  const companion = collection[companionId];

  if (!companion) {
    return {
      success: false,
      error: `${isMount ? 'Mount' : 'Pet'} not found`,
      state
    };
  }

  const config = isMount ? MOUNT_CONFIG[companion.type] : PET_CONFIG[companion.type];

  const updatedCompanion = {
    ...companion,
    xp: companion.xp + xpAmount
  };

  const levelUpResult = checkLevelUp(updatedCompanion, config.maxLevel, isMount);

  const updatedCollection = {
    ...collection,
    [companionId]: levelUpResult.companion
  };

  return {
    success: true,
    xpGranted: xpAmount,
    leveledUp: levelUpResult.leveledUp,
    newLevel: levelUpResult.companion.level,
    state: {
      ...state,
      [isMount ? 'mounts' : 'pets']: updatedCollection
    }
  };
}

/**
 * Get happiness level from value
 */
function getHappinessLevel(happinessValue) {
  if (happinessValue >= HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.ECSTATIC]) {
    return HAPPINESS_LEVEL.ECSTATIC;
  }
  if (happinessValue >= HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.HAPPY]) {
    return HAPPINESS_LEVEL.HAPPY;
  }
  if (happinessValue >= HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.CONTENT]) {
    return HAPPINESS_LEVEL.CONTENT;
  }
  if (happinessValue >= HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.UNHAPPY]) {
    return HAPPINESS_LEVEL.UNHAPPY;
  }
  return HAPPINESS_LEVEL.MISERABLE;
}

/**
 * Calculate mount speed with bonuses
 */
function calculateMountSpeed(state) {
  if (!state.activeMount) {
    return 1.0; // Base player speed
  }

  const mount = state.mounts[state.activeMount];
  if (!mount) return 1.0;

  const config = MOUNT_CONFIG[mount.type];
  const happinessLevel = getHappinessLevel(mount.happiness);
  const happinessMultiplier = HAPPINESS_MULTIPLIERS[happinessLevel];
  const rarityMultiplier = RARITY_MULTIPLIERS[mount.rarity];
  const levelBonus = 1 + (mount.level - 1) * 0.02;

  return mount.stats.speed * happinessMultiplier * rarityMultiplier * levelBonus;
}

/**
 * Get active pet bonuses
 */
function getActivePetBonuses(state) {
  if (!state.activePet) {
    return {
      lootFinder: 0,
      xpBoost: 0,
      goldBoost: 0,
      combatAssist: 0,
      gatheringBoost: 0,
      stealthBonus: 0,
      healingAura: 0,
      elementalResist: 0
    };
  }

  const pet = state.pets[state.activePet];
  if (!pet) {
    return {
      lootFinder: 0,
      xpBoost: 0,
      goldBoost: 0,
      combatAssist: 0,
      gatheringBoost: 0,
      stealthBonus: 0,
      healingAura: 0,
      elementalResist: 0
    };
  }

  const happinessLevel = getHappinessLevel(pet.happiness);
  const happinessMultiplier = HAPPINESS_MULTIPLIERS[happinessLevel];
  const rarityMultiplier = RARITY_MULTIPLIERS[pet.rarity];
  const levelBonus = 1 + (pet.level - 1) * 0.03;
  const baseMultiplier = happinessMultiplier * rarityMultiplier * levelBonus;

  const bonuses = {
    lootFinder: 0,
    xpBoost: 0,
    goldBoost: 0,
    combatAssist: 0,
    gatheringBoost: 0,
    stealthBonus: 0,
    healingAura: 0,
    elementalResist: 0
  };

  pet.abilities.forEach(ability => {
    switch (ability) {
      case PET_ABILITY.LOOT_FINDER:
        bonuses.lootFinder = 0.1 * baseMultiplier;
        break;
      case PET_ABILITY.XP_BOOST:
        bonuses.xpBoost = 0.05 * baseMultiplier;
        break;
      case PET_ABILITY.GOLD_BOOST:
        bonuses.goldBoost = 0.1 * baseMultiplier;
        break;
      case PET_ABILITY.COMBAT_ASSIST:
        bonuses.combatAssist = 0.08 * baseMultiplier;
        break;
      case PET_ABILITY.GATHERING_BOOST:
        bonuses.gatheringBoost = 0.15 * baseMultiplier;
        break;
      case PET_ABILITY.STEALTH_BONUS:
        bonuses.stealthBonus = 0.1 * baseMultiplier;
        break;
      case PET_ABILITY.HEALING_AURA:
        bonuses.healingAura = 0.02 * baseMultiplier;
        break;
      case PET_ABILITY.ELEMENTAL_RESIST:
        bonuses.elementalResist = 0.1 * baseMultiplier;
        break;
    }
  });

  return bonuses;
}

/**
 * Get mount abilities
 */
function getMountAbilities(state) {
  if (!state.activeMount) {
    return [];
  }

  const mount = state.mounts[state.activeMount];
  if (!mount) return [];

  return mount.abilities;
}

/**
 * Check if mount can fly
 */
function canFly(state) {
  const abilities = getMountAbilities(state);
  return abilities.includes(MOUNT_ABILITY.FLYING);
}

/**
 * Check if mount can swim
 */
function canSwim(state) {
  const abilities = getMountAbilities(state);
  return abilities.includes(MOUNT_ABILITY.SWIMMING);
}

/**
 * Update hunger over time (call periodically)
 */
function updateHunger(state, elapsedMinutes) {
  const hungerDecay = elapsedMinutes * 0.5; // Lose 0.5 hunger per minute

  const updatedMounts = { ...state.mounts };
  Object.keys(updatedMounts).forEach(id => {
    const mount = updatedMounts[id];
    updatedMounts[id] = {
      ...mount,
      hunger: Math.max(0, mount.hunger - hungerDecay),
      happiness: mount.hunger <= 10 ? Math.max(0, mount.happiness - 1) : mount.happiness
    };
  });

  const updatedPets = { ...state.pets };
  Object.keys(updatedPets).forEach(id => {
    const pet = updatedPets[id];
    updatedPets[id] = {
      ...pet,
      hunger: Math.max(0, pet.hunger - hungerDecay),
      happiness: pet.hunger <= 10 ? Math.max(0, pet.happiness - 1) : pet.happiness
    };
  });

  return {
    ...state,
    mounts: updatedMounts,
    pets: updatedPets
  };
}

/**
 * Increase bond level
 */
function increaseBond(state, companionId, amount, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  const companion = collection[companionId];

  if (!companion) {
    return {
      success: false,
      error: `${isMount ? 'Mount' : 'Pet'} not found`,
      state
    };
  }

  const maxBond = 100;
  const newBond = Math.min(maxBond, companion.bondLevel + amount);

  const updatedCollection = {
    ...collection,
    [companionId]: {
      ...companion,
      bondLevel: newBond
    }
  };

  return {
    success: true,
    newBondLevel: newBond,
    state: {
      ...state,
      [isMount ? 'mounts' : 'pets']: updatedCollection
    }
  };
}

/**
 * Upgrade stable capacity
 */
function upgradeStable(state) {
  const maxUpgrades = 5;
  if (state.stable.upgrades >= maxUpgrades) {
    return {
      success: false,
      error: 'Stable already at maximum capacity',
      state
    };
  }

  return {
    success: true,
    newCapacity: state.stable.capacity + 2,
    state: {
      ...state,
      stable: {
        capacity: state.stable.capacity + 2,
        upgrades: state.stable.upgrades + 1
      }
    }
  };
}

/**
 * Upgrade kennel capacity
 */
function upgradeKennel(state) {
  const maxUpgrades = 5;
  if (state.kennel.upgrades >= maxUpgrades) {
    return {
      success: false,
      error: 'Kennel already at maximum capacity',
      state
    };
  }

  return {
    success: true,
    newCapacity: state.kennel.capacity + 2,
    state: {
      ...state,
      kennel: {
        capacity: state.kennel.capacity + 2,
        upgrades: state.kennel.upgrades + 1
      }
    }
  };
}

/**
 * Release companion (remove from collection)
 */
function releaseCompanion(state, companionId, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  const companion = collection[companionId];

  if (!companion) {
    return {
      success: false,
      error: `${isMount ? 'Mount' : 'Pet'} not found`,
      state
    };
  }

  // Can't release equipped companion
  if (isMount && state.activeMount === companionId) {
    return {
      success: false,
      error: 'Cannot release equipped mount',
      state
    };
  }
  if (!isMount && state.activePet === companionId) {
    return {
      success: false,
      error: 'Cannot release equipped pet',
      state
    };
  }

  const updatedCollection = { ...collection };
  delete updatedCollection[companionId];

  return {
    success: true,
    releasedCompanion: companion,
    state: {
      ...state,
      [isMount ? 'mounts' : 'pets']: updatedCollection
    }
  };
}

/**
 * Rename companion
 */
function renameCompanion(state, companionId, newName, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  const companion = collection[companionId];

  if (!companion) {
    return {
      success: false,
      error: `${isMount ? 'Mount' : 'Pet'} not found`,
      state
    };
  }

  if (!newName || newName.trim().length === 0) {
    return {
      success: false,
      error: 'Name cannot be empty',
      state
    };
  }

  if (newName.length > 30) {
    return {
      success: false,
      error: 'Name too long (max 30 characters)',
      state
    };
  }

  const updatedCollection = {
    ...collection,
    [companionId]: {
      ...companion,
      name: newName.trim()
    }
  };

  return {
    success: true,
    state: {
      ...state,
      [isMount ? 'mounts' : 'pets']: updatedCollection
    }
  };
}

/**
 * Get all companions sorted by level
 */
function getCompanionsSortedByLevel(state, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  return Object.values(collection).sort((a, b) => b.level - a.level);
}

/**
 * Get companion count by rarity
 */
function getCompanionCountByRarity(state, isMount = true) {
  const collection = isMount ? state.mounts : state.pets;
  const counts = {
    [COMPANION_RARITY.COMMON]: 0,
    [COMPANION_RARITY.UNCOMMON]: 0,
    [COMPANION_RARITY.RARE]: 0,
    [COMPANION_RARITY.EPIC]: 0,
    [COMPANION_RARITY.LEGENDARY]: 0
  };

  Object.values(collection).forEach(companion => {
    counts[companion.rarity]++;
  });

  return counts;
}

// Export everything
export {
  MOUNT_TYPE,
  PET_TYPE,
  COMPANION_RARITY,
  PET_ABILITY,
  MOUNT_ABILITY,
  HAPPINESS_LEVEL,
  MOUNT_CONFIG,
  PET_CONFIG,
  HAPPINESS_THRESHOLDS,
  HAPPINESS_MULTIPLIERS,
  RARITY_MULTIPLIERS,
  createCompanionState,
  createMount,
  createPet,
  addMount,
  addPet,
  equipMount,
  unequipMount,
  equipPet,
  unequipPet,
  feedCompanion,
  grantCompanionXp,
  getHappinessLevel,
  calculateMountSpeed,
  getActivePetBonuses,
  getMountAbilities,
  canFly,
  canSwim,
  updateHunger,
  increaseBond,
  upgradeStable,
  upgradeKennel,
  releaseCompanion,
  renameCompanion,
  getCompanionsSortedByLevel,
  getCompanionCountByRarity,
  getXpForLevel
};
