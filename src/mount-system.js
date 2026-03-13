/**
 * Mount System
 * Manages mounts for travel speed bonuses and special abilities
 */

// Mount types
export const MOUNT_TYPES = {
  LAND: { id: 'land', name: 'Land Mount', terrain: ['plains', 'forest', 'mountain', 'desert'] },
  FLYING: { id: 'flying', name: 'Flying Mount', terrain: ['all'], ignoresTerrain: true },
  AQUATIC: { id: 'aquatic', name: 'Aquatic Mount', terrain: ['water', 'swamp', 'coastal'] },
  AMPHIBIOUS: { id: 'amphibious', name: 'Amphibious Mount', terrain: ['water', 'swamp', 'plains', 'forest'] }
};

// Mount rarities
export const MOUNT_RARITIES = {
  COMMON: { id: 'common', name: 'Common', speedBonus: 1.2, color: '#AAAAAA' },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', speedBonus: 1.4, color: '#00AA00' },
  RARE: { id: 'rare', name: 'Rare', speedBonus: 1.6, color: '#0066FF' },
  EPIC: { id: 'epic', name: 'Epic', speedBonus: 1.8, color: '#AA00AA' },
  LEGENDARY: { id: 'legendary', name: 'Legendary', speedBonus: 2.0, color: '#FF8800' }
};

// Available mounts
export const MOUNTS = {
  // Common land mounts
  draft_horse: {
    id: 'draft_horse',
    name: 'Draft Horse',
    type: 'land',
    rarity: 'common',
    baseSpeed: 100,
    stamina: 80,
    description: 'A sturdy workhorse, reliable for long journeys.',
    abilities: ['steady_pace']
  },
  mule: {
    id: 'mule',
    name: 'Pack Mule',
    type: 'land',
    rarity: 'common',
    baseSpeed: 80,
    stamina: 120,
    description: 'Slow but can carry extra supplies.',
    abilities: ['pack_carrier']
  },
  donkey: {
    id: 'donkey',
    name: 'Donkey',
    type: 'land',
    rarity: 'common',
    baseSpeed: 70,
    stamina: 100,
    description: 'A humble but dependable mount.',
    abilities: ['sure_footed']
  },

  // Uncommon mounts
  war_horse: {
    id: 'war_horse',
    name: 'War Horse',
    type: 'land',
    rarity: 'uncommon',
    baseSpeed: 120,
    stamina: 90,
    description: 'A trained battle steed, fearless in combat.',
    abilities: ['battle_charge', 'fearless']
  },
  giant_lizard: {
    id: 'giant_lizard',
    name: 'Giant Lizard',
    type: 'land',
    rarity: 'uncommon',
    baseSpeed: 90,
    stamina: 110,
    description: 'A scaled reptile adapted to harsh environments.',
    abilities: ['desert_adapted', 'wall_climb']
  },
  riding_wolf: {
    id: 'riding_wolf',
    name: 'Riding Wolf',
    type: 'land',
    rarity: 'uncommon',
    baseSpeed: 130,
    stamina: 70,
    description: 'A fierce wolf bred for speed and tracking.',
    abilities: ['tracking', 'night_vision']
  },

  // Rare mounts
  gryphon: {
    id: 'gryphon',
    name: 'Gryphon',
    type: 'flying',
    rarity: 'rare',
    baseSpeed: 150,
    stamina: 80,
    description: 'A majestic creature with the body of a lion and wings of an eagle.',
    abilities: ['aerial_dive', 'keen_sight']
  },
  giant_turtle: {
    id: 'giant_turtle',
    name: 'Giant Sea Turtle',
    type: 'aquatic',
    rarity: 'rare',
    baseSpeed: 60,
    stamina: 200,
    description: 'A massive turtle that can traverse oceans.',
    abilities: ['deep_dive', 'shell_protection']
  },
  nightmare_steed: {
    id: 'nightmare_steed',
    name: 'Nightmare Steed',
    type: 'land',
    rarity: 'rare',
    baseSpeed: 140,
    stamina: 100,
    description: 'A fiery horse wreathed in shadow flames.',
    abilities: ['flame_trail', 'shadow_step']
  },

  // Epic mounts
  wyvern: {
    id: 'wyvern',
    name: 'Wyvern',
    type: 'flying',
    rarity: 'epic',
    baseSpeed: 180,
    stamina: 90,
    description: 'A fearsome two-legged dragon with venomous tail.',
    abilities: ['venom_strike', 'aerial_agility', 'intimidating_presence']
  },
  frost_mammoth: {
    id: 'frost_mammoth',
    name: 'Frost Mammoth',
    type: 'land',
    rarity: 'epic',
    baseSpeed: 100,
    stamina: 180,
    description: 'An ancient creature from frozen lands.',
    abilities: ['frost_aura', 'trampling_charge', 'cold_immunity']
  },
  sea_serpent: {
    id: 'sea_serpent',
    name: 'Sea Serpent',
    type: 'aquatic',
    rarity: 'epic',
    baseSpeed: 200,
    stamina: 120,
    description: 'A mythical serpent that rules the depths.',
    abilities: ['whirlpool', 'lightning_speed', 'water_breathing']
  },

  // Legendary mounts
  elder_dragon: {
    id: 'elder_dragon',
    name: 'Elder Dragon',
    type: 'flying',
    rarity: 'legendary',
    baseSpeed: 250,
    stamina: 150,
    description: 'An ancient dragon of immense power.',
    abilities: ['dragon_breath', 'invulnerable_flight', 'telepathic_bond', 'elemental_mastery']
  },
  celestial_stag: {
    id: 'celestial_stag',
    name: 'Celestial Stag',
    type: 'land',
    rarity: 'legendary',
    baseSpeed: 220,
    stamina: 200,
    description: 'A divine creature from the heavens.',
    abilities: ['divine_protection', 'teleportation', 'healing_aura', 'starlight_trail']
  }
};

// Mount abilities
export const MOUNT_ABILITIES = {
  steady_pace: { id: 'steady_pace', name: 'Steady Pace', description: 'Reduces stamina consumption by 20%', staminaReduction: 0.2 },
  pack_carrier: { id: 'pack_carrier', name: 'Pack Carrier', description: 'Increases inventory capacity by 10 slots', inventoryBonus: 10 },
  sure_footed: { id: 'sure_footed', name: 'Sure-Footed', description: 'Cannot be dismounted by terrain hazards', preventsDismount: true },
  battle_charge: { id: 'battle_charge', name: 'Battle Charge', description: 'First attack in combat deals 50% more damage', chargeBonus: 0.5 },
  fearless: { id: 'fearless', name: 'Fearless', description: 'Immune to fear effects while mounted', immuneFear: true },
  desert_adapted: { id: 'desert_adapted', name: 'Desert Adapted', description: 'No speed penalty in desert terrain', desertBonus: true },
  wall_climb: { id: 'wall_climb', name: 'Wall Climb', description: 'Can scale vertical surfaces', wallClimb: true },
  tracking: { id: 'tracking', name: 'Tracking', description: 'Reveals nearby creatures and tracks', trackingRange: 50 },
  night_vision: { id: 'night_vision', name: 'Night Vision', description: 'See clearly in darkness', nightVision: true },
  aerial_dive: { id: 'aerial_dive', name: 'Aerial Dive', description: 'Dive attack deals double damage', diveBonus: 1.0 },
  keen_sight: { id: 'keen_sight', name: 'Keen Sight', description: 'Reveals hidden locations on map', revealRange: 100 },
  deep_dive: { id: 'deep_dive', name: 'Deep Dive', description: 'Can dive to ocean depths', deepDive: true },
  shell_protection: { id: 'shell_protection', name: 'Shell Protection', description: 'Take 50% less damage while mounted', damageReduction: 0.5 },
  flame_trail: { id: 'flame_trail', name: 'Flame Trail', description: 'Leaves damaging flames behind', trailDamage: 20 },
  shadow_step: { id: 'shadow_step', name: 'Shadow Step', description: 'Short-range teleport through shadows', shadowStep: true },
  venom_strike: { id: 'venom_strike', name: 'Venom Strike', description: 'Attacks apply poison damage', poisonDamage: 15 },
  aerial_agility: { id: 'aerial_agility', name: 'Aerial Agility', description: '30% evasion while flying', aerialEvasion: 0.3 },
  intimidating_presence: { id: 'intimidating_presence', name: 'Intimidating Presence', description: 'Enemies have reduced accuracy', enemyAccuracyPenalty: 0.15 },
  frost_aura: { id: 'frost_aura', name: 'Frost Aura', description: 'Nearby enemies are slowed', slowRadius: 30 },
  trampling_charge: { id: 'trampling_charge', name: 'Trampling Charge', description: 'Damages all enemies in path', trampleDamage: 40 },
  cold_immunity: { id: 'cold_immunity', name: 'Cold Immunity', description: 'Immune to cold damage and terrain', coldImmune: true },
  whirlpool: { id: 'whirlpool', name: 'Whirlpool', description: 'Create a whirlpool to trap enemies', whirlpoolDuration: 5000 },
  lightning_speed: { id: 'lightning_speed', name: 'Lightning Speed', description: '50% speed boost for 10 seconds', speedBurstBonus: 0.5 },
  water_breathing: { id: 'water_breathing', name: 'Water Breathing', description: 'Rider can breathe underwater', waterBreathing: true },
  dragon_breath: { id: 'dragon_breath', name: 'Dragon Breath', description: 'Powerful elemental breath attack', breathDamage: 100 },
  invulnerable_flight: { id: 'invulnerable_flight', name: 'Invulnerable Flight', description: 'Cannot be hit while at max altitude', maxAltitudeImmune: true },
  telepathic_bond: { id: 'telepathic_bond', name: 'Telepathic Bond', description: 'Summon mount from anywhere instantly', instantSummon: true },
  elemental_mastery: { id: 'elemental_mastery', name: 'Elemental Mastery', description: 'All elemental damage +25%', elementalBonus: 0.25 },
  divine_protection: { id: 'divine_protection', name: 'Divine Protection', description: 'Revive once per day at 50% HP', autoRevive: true },
  teleportation: { id: 'teleportation', name: 'Teleportation', description: 'Teleport to any visited location', globalTeleport: true },
  healing_aura: { id: 'healing_aura', name: 'Healing Aura', description: 'Slowly regenerate HP while mounted', hpRegen: 5 },
  starlight_trail: { id: 'starlight_trail', name: 'Starlight Trail', description: 'Leave a trail that buffs allies', allyBuff: true }
};

/**
 * Initialize mount state
 */
export function initMountState() {
  return {
    ownedMounts: [],
    activeMount: null,
    mountStats: {}, // mountId -> { experience, level, bond }
    stables: [],
    feedInventory: {},
    lastMounted: null,
    totalDistanceTraveled: 0,
    mountCollection: {}
  };
}

/**
 * Get mount state from game state
 */
export function getMountState(state) {
  return state.mounts || initMountState();
}

/**
 * Add mount to collection
 */
export function addMount(state, mountId) {
  const mountData = MOUNTS[mountId];
  if (!mountData) {
    return { state, added: false, error: 'Mount does not exist' };
  }

  const mountState = getMountState(state);

  if (mountState.ownedMounts.includes(mountId)) {
    return { state, added: false, error: 'Mount already owned' };
  }

  const newMountStats = {
    experience: 0,
    level: 1,
    bond: 0,
    happiness: 100,
    currentStamina: mountData.stamina,
    acquiredAt: Date.now()
  };

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        ownedMounts: [...mountState.ownedMounts, mountId],
        mountStats: {
          ...mountState.mountStats,
          [mountId]: newMountStats
        },
        mountCollection: {
          ...mountState.mountCollection,
          [mountId]: true
        }
      }
    },
    added: true,
    mount: mountData
  };
}

/**
 * Mount a specific mount
 */
export function mountUp(state, mountId) {
  const mountState = getMountState(state);
  const mountData = MOUNTS[mountId];

  if (!mountData) {
    return { state, mounted: false, error: 'Mount does not exist' };
  }

  if (!mountState.ownedMounts.includes(mountId)) {
    return { state, mounted: false, error: 'Mount not owned' };
  }

  const stats = mountState.mountStats[mountId];
  if (stats.currentStamina <= 0) {
    return { state, mounted: false, error: 'Mount is exhausted' };
  }

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        activeMount: mountId,
        lastMounted: Date.now()
      }
    },
    mounted: true,
    mount: mountData,
    speedBonus: calculateSpeedBonus(mountData, stats)
  };
}

/**
 * Dismount current mount
 */
export function dismount(state) {
  const mountState = getMountState(state);

  if (!mountState.activeMount) {
    return { state, dismounted: false, error: 'Not currently mounted' };
  }

  const rideDuration = Date.now() - mountState.lastMounted;
  const mountId = mountState.activeMount;
  const stats = mountState.mountStats[mountId];

  // Calculate experience and bond gained
  const expGained = Math.floor(rideDuration / 60000); // 1 exp per minute
  const bondGained = Math.floor(rideDuration / 300000); // 1 bond per 5 minutes

  const newStats = {
    ...stats,
    experience: stats.experience + expGained,
    bond: Math.min(100, stats.bond + bondGained)
  };

  // Check for level up
  const newLevel = calculateMountLevel(newStats.experience);
  if (newLevel > stats.level) {
    newStats.level = newLevel;
  }

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        activeMount: null,
        mountStats: {
          ...mountState.mountStats,
          [mountId]: newStats
        }
      }
    },
    dismounted: true,
    rideDuration,
    expGained,
    bondGained,
    leveledUp: newLevel > stats.level
  };
}

/**
 * Calculate speed bonus from mount
 */
export function calculateSpeedBonus(mountData, stats) {
  const rarityData = MOUNT_RARITIES[mountData.rarity.toUpperCase()];
  const rarityBonus = rarityData ? rarityData.speedBonus : 1.0;
  const levelBonus = 1 + (stats.level - 1) * 0.05; // 5% per level
  const bondBonus = 1 + (stats.bond / 100) * 0.2; // Up to 20% from bond

  return (mountData.baseSpeed / 100) * rarityBonus * levelBonus * bondBonus;
}

/**
 * Calculate mount level from experience
 */
export function calculateMountLevel(experience) {
  // Levels require exponentially more exp
  // Level 1: 0, Level 2: 100, Level 3: 300, Level 4: 600, etc.
  let level = 1;
  let requiredExp = 0;

  while (experience >= requiredExp + level * 100) {
    requiredExp += level * 100;
    level++;
    if (level >= 20) break; // Max level 20
  }

  return level;
}

/**
 * Use mount stamina
 */
export function useStamina(state, amount) {
  const mountState = getMountState(state);

  if (!mountState.activeMount) {
    return { state, used: false, error: 'Not mounted' };
  }

  const mountId = mountState.activeMount;
  const stats = mountState.mountStats[mountId];
  const mountData = MOUNTS[mountId];

  // Check for stamina reduction abilities
  let staminaCost = amount;
  for (const abilityId of mountData.abilities) {
    const ability = MOUNT_ABILITIES[abilityId];
    if (ability && ability.staminaReduction) {
      staminaCost *= (1 - ability.staminaReduction);
    }
  }

  const newStamina = Math.max(0, stats.currentStamina - staminaCost);
  const exhausted = newStamina <= 0;

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        mountStats: {
          ...mountState.mountStats,
          [mountId]: {
            ...stats,
            currentStamina: newStamina
          }
        },
        // Auto-dismount if exhausted
        activeMount: exhausted ? null : mountId
      }
    },
    used: true,
    staminaUsed: staminaCost,
    remaining: newStamina,
    exhausted
  };
}

/**
 * Rest mount to restore stamina
 */
export function restMount(state, mountId, duration = 60000) {
  const mountState = getMountState(state);
  const mountData = MOUNTS[mountId];

  if (!mountData) {
    return { state, rested: false, error: 'Mount does not exist' };
  }

  if (!mountState.ownedMounts.includes(mountId)) {
    return { state, rested: false, error: 'Mount not owned' };
  }

  if (mountState.activeMount === mountId) {
    return { state, rested: false, error: 'Cannot rest while mounted' };
  }

  const stats = mountState.mountStats[mountId];
  const recoveryRate = 1 + (stats.bond / 100); // Higher bond = faster recovery
  const staminaRecovered = Math.floor((duration / 1000) * recoveryRate);
  const newStamina = Math.min(mountData.stamina, stats.currentStamina + staminaRecovered);

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        mountStats: {
          ...mountState.mountStats,
          [mountId]: {
            ...stats,
            currentStamina: newStamina
          }
        }
      }
    },
    rested: true,
    staminaRecovered,
    currentStamina: newStamina,
    maxStamina: mountData.stamina
  };
}

/**
 * Feed mount to increase happiness and bond
 */
export function feedMount(state, mountId, feedItem) {
  const mountState = getMountState(state);
  const mountData = MOUNTS[mountId];

  if (!mountData) {
    return { state, fed: false, error: 'Mount does not exist' };
  }

  if (!mountState.ownedMounts.includes(mountId)) {
    return { state, fed: false, error: 'Mount not owned' };
  }

  const stats = mountState.mountStats[mountId];

  // Different feeds have different effects
  const feedEffects = {
    hay: { happiness: 5, bond: 1, stamina: 10 },
    oats: { happiness: 10, bond: 2, stamina: 20 },
    apple: { happiness: 15, bond: 3, stamina: 15 },
    carrot: { happiness: 12, bond: 2, stamina: 25 },
    sugar_cube: { happiness: 20, bond: 5, stamina: 5 },
    golden_apple: { happiness: 30, bond: 10, stamina: 50 }
  };

  const effect = feedEffects[feedItem];
  if (!effect) {
    return { state, fed: false, error: 'Invalid feed item' };
  }

  const newStats = {
    ...stats,
    happiness: Math.min(100, stats.happiness + effect.happiness),
    bond: Math.min(100, stats.bond + effect.bond),
    currentStamina: Math.min(mountData.stamina, stats.currentStamina + effect.stamina)
  };

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        mountStats: {
          ...mountState.mountStats,
          [mountId]: newStats
        }
      }
    },
    fed: true,
    effect,
    newStats
  };
}

/**
 * Get mount abilities
 */
export function getMountAbilities(mountId) {
  const mountData = MOUNTS[mountId];
  if (!mountData) return [];

  return mountData.abilities.map(abilityId => MOUNT_ABILITIES[abilityId]).filter(Boolean);
}

/**
 * Check if mount can traverse terrain
 */
export function canTraverseTerrain(mountId, terrain) {
  const mountData = MOUNTS[mountId];
  if (!mountData) return false;

  const typeData = MOUNT_TYPES[mountData.type.toUpperCase()];
  if (!typeData) return false;

  if (typeData.ignoresTerrain) return true;
  return typeData.terrain.includes(terrain) || typeData.terrain.includes('all');
}

/**
 * Get active mount info
 */
export function getActiveMountInfo(state) {
  const mountState = getMountState(state);

  if (!mountState.activeMount) {
    return { mounted: false };
  }

  const mountId = mountState.activeMount;
  const mountData = MOUNTS[mountId];
  const stats = mountState.mountStats[mountId];
  const abilities = getMountAbilities(mountId);

  return {
    mounted: true,
    mountId,
    mountData,
    stats,
    abilities,
    speedBonus: calculateSpeedBonus(mountData, stats)
  };
}

/**
 * Get collection statistics
 */
export function getCollectionStats(state) {
  const mountState = getMountState(state);
  const totalMounts = Object.keys(MOUNTS).length;
  const ownedCount = mountState.ownedMounts.length;

  const byRarity = {};
  for (const [rarity] of Object.entries(MOUNT_RARITIES)) {
    const rarityLower = rarity.toLowerCase();
    byRarity[rarityLower] = {
      total: Object.values(MOUNTS).filter(m => m.rarity === rarityLower).length,
      owned: mountState.ownedMounts.filter(id => MOUNTS[id]?.rarity === rarityLower).length
    };
  }

  const byType = {};
  for (const [type] of Object.entries(MOUNT_TYPES)) {
    const typeLower = type.toLowerCase();
    byType[typeLower] = {
      total: Object.values(MOUNTS).filter(m => m.type === typeLower).length,
      owned: mountState.ownedMounts.filter(id => MOUNTS[id]?.type === typeLower).length
    };
  }

  return {
    totalMounts,
    ownedCount,
    completionPercent: Math.round((ownedCount / totalMounts) * 100),
    byRarity,
    byType
  };
}

/**
 * Get all owned mounts with details
 */
export function getOwnedMounts(state) {
  const mountState = getMountState(state);

  return mountState.ownedMounts.map(mountId => {
    const mountData = MOUNTS[mountId];
    const stats = mountState.mountStats[mountId];
    return {
      ...mountData,
      stats,
      abilities: getMountAbilities(mountId),
      speedBonus: calculateSpeedBonus(mountData, stats),
      isActive: mountState.activeMount === mountId
    };
  });
}

/**
 * Store mount in stable
 */
export function storeInStable(state, mountId, stableId) {
  const mountState = getMountState(state);

  if (!mountState.ownedMounts.includes(mountId)) {
    return { state, stored: false, error: 'Mount not owned' };
  }

  if (mountState.activeMount === mountId) {
    return { state, stored: false, error: 'Cannot store active mount' };
  }

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        stables: [...mountState.stables.filter(s => s.mountId !== mountId), { mountId, stableId, storedAt: Date.now() }]
      }
    },
    stored: true
  };
}

/**
 * Remove mount from stable
 */
export function retrieveFromStable(state, mountId) {
  const mountState = getMountState(state);

  const stableEntry = mountState.stables.find(s => s.mountId === mountId);
  if (!stableEntry) {
    return { state, retrieved: false, error: 'Mount not in stable' };
  }

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        stables: mountState.stables.filter(s => s.mountId !== mountId)
      }
    },
    retrieved: true
  };
}

/**
 * Update total distance traveled
 */
export function recordDistance(state, distance) {
  const mountState = getMountState(state);

  if (!mountState.activeMount) {
    return { state, recorded: false };
  }

  return {
    state: {
      ...state,
      mounts: {
        ...mountState,
        totalDistanceTraveled: mountState.totalDistanceTraveled + distance
      }
    },
    recorded: true,
    totalDistance: mountState.totalDistanceTraveled + distance
  };
}
