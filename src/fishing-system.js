/**
 * Fishing System
 * Manages fishing mechanics, catch types, and fishing skill progression
 */

// Fishing zones
export const FISHING_ZONES = {
  POND: { id: 'pond', name: 'Pond', difficulty: 1, fishTypes: ['common_freshwater'] },
  RIVER: { id: 'river', name: 'River', difficulty: 2, fishTypes: ['common_freshwater', 'uncommon_freshwater'] },
  LAKE: { id: 'lake', name: 'Lake', difficulty: 2, fishTypes: ['common_freshwater', 'uncommon_freshwater', 'rare_freshwater'] },
  OCEAN_SHORE: { id: 'ocean_shore', name: 'Ocean Shore', difficulty: 3, fishTypes: ['common_saltwater', 'uncommon_saltwater'] },
  DEEP_SEA: { id: 'deep_sea', name: 'Deep Sea', difficulty: 4, fishTypes: ['uncommon_saltwater', 'rare_saltwater', 'legendary_saltwater'] },
  UNDERGROUND: { id: 'underground', name: 'Underground Pool', difficulty: 5, fishTypes: ['rare_cave', 'legendary_cave'] }
};

// Fish rarities
export const FISH_RARITIES = {
  COMMON: { id: 'common', name: 'Common', color: '#AAAAAA', valueMultiplier: 1, catchRate: 0.6 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#00AA00', valueMultiplier: 2, catchRate: 0.25 },
  RARE: { id: 'rare', name: 'Rare', color: '#0066FF', valueMultiplier: 5, catchRate: 0.1 },
  EPIC: { id: 'epic', name: 'Epic', color: '#AA00AA', valueMultiplier: 15, catchRate: 0.04 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#FF8800', valueMultiplier: 50, catchRate: 0.01 }
};

// Available fish
export const FISH = {
  // Common freshwater
  bluegill: { id: 'bluegill', name: 'Bluegill', rarity: 'common', category: 'common_freshwater', baseValue: 5, weight: { min: 0.2, max: 1 } },
  perch: { id: 'perch', name: 'Perch', rarity: 'common', category: 'common_freshwater', baseValue: 6, weight: { min: 0.3, max: 1.5 } },
  sunfish: { id: 'sunfish', name: 'Sunfish', rarity: 'common', category: 'common_freshwater', baseValue: 4, weight: { min: 0.1, max: 0.8 } },
  carp: { id: 'carp', name: 'Carp', rarity: 'common', category: 'common_freshwater', baseValue: 7, weight: { min: 1, max: 5 } },

  // Uncommon freshwater
  bass: { id: 'bass', name: 'Largemouth Bass', rarity: 'uncommon', category: 'uncommon_freshwater', baseValue: 15, weight: { min: 1, max: 4 } },
  trout: { id: 'trout', name: 'Rainbow Trout', rarity: 'uncommon', category: 'uncommon_freshwater', baseValue: 18, weight: { min: 0.5, max: 3 } },
  pike: { id: 'pike', name: 'Northern Pike', rarity: 'uncommon', category: 'uncommon_freshwater', baseValue: 20, weight: { min: 2, max: 8 } },
  catfish: { id: 'catfish', name: 'Channel Catfish', rarity: 'uncommon', category: 'uncommon_freshwater', baseValue: 16, weight: { min: 2, max: 10 } },

  // Rare freshwater
  muskie: { id: 'muskie', name: 'Muskellunge', rarity: 'rare', category: 'rare_freshwater', baseValue: 45, weight: { min: 5, max: 20 } },
  sturgeon: { id: 'sturgeon', name: 'Lake Sturgeon', rarity: 'rare', category: 'rare_freshwater', baseValue: 60, weight: { min: 10, max: 50 } },
  golden_carp: { id: 'golden_carp', name: 'Golden Carp', rarity: 'rare', category: 'rare_freshwater', baseValue: 80, weight: { min: 2, max: 8 } },

  // Common saltwater
  mackerel: { id: 'mackerel', name: 'Mackerel', rarity: 'common', category: 'common_saltwater', baseValue: 8, weight: { min: 0.5, max: 2 } },
  sardine: { id: 'sardine', name: 'Sardine', rarity: 'common', category: 'common_saltwater', baseValue: 3, weight: { min: 0.05, max: 0.2 } },
  herring: { id: 'herring', name: 'Herring', rarity: 'common', category: 'common_saltwater', baseValue: 5, weight: { min: 0.1, max: 0.5 } },

  // Uncommon saltwater
  sea_bass: { id: 'sea_bass', name: 'Sea Bass', rarity: 'uncommon', category: 'uncommon_saltwater', baseValue: 25, weight: { min: 2, max: 10 } },
  flounder: { id: 'flounder', name: 'Flounder', rarity: 'uncommon', category: 'uncommon_saltwater', baseValue: 22, weight: { min: 1, max: 5 } },
  red_snapper: { id: 'red_snapper', name: 'Red Snapper', rarity: 'uncommon', category: 'uncommon_saltwater', baseValue: 28, weight: { min: 2, max: 8 } },

  // Rare saltwater
  tuna: { id: 'tuna', name: 'Bluefin Tuna', rarity: 'rare', category: 'rare_saltwater', baseValue: 100, weight: { min: 50, max: 200 } },
  swordfish: { id: 'swordfish', name: 'Swordfish', rarity: 'rare', category: 'rare_saltwater', baseValue: 120, weight: { min: 40, max: 150 } },
  marlin: { id: 'marlin', name: 'Blue Marlin', rarity: 'rare', category: 'rare_saltwater', baseValue: 150, weight: { min: 60, max: 250 } },

  // Legendary saltwater
  whale_shark: { id: 'whale_shark', name: 'Whale Shark', rarity: 'legendary', category: 'legendary_saltwater', baseValue: 500, weight: { min: 1000, max: 5000 } },
  giant_squid: { id: 'giant_squid', name: 'Giant Squid', rarity: 'legendary', category: 'legendary_saltwater', baseValue: 400, weight: { min: 100, max: 500 } },

  // Cave fish
  blind_cavefish: { id: 'blind_cavefish', name: 'Blind Cavefish', rarity: 'rare', category: 'rare_cave', baseValue: 75, weight: { min: 0.1, max: 0.5 } },
  crystal_fish: { id: 'crystal_fish', name: 'Crystal Fish', rarity: 'rare', category: 'rare_cave', baseValue: 90, weight: { min: 0.2, max: 1 } },
  ancient_leviathan: { id: 'ancient_leviathan', name: 'Ancient Leviathan', rarity: 'legendary', category: 'legendary_cave', baseValue: 800, weight: { min: 200, max: 1000 } }
};

// Fishing equipment
export const FISHING_RODS = {
  basic_rod: { id: 'basic_rod', name: 'Basic Fishing Rod', catchBonus: 0, rarityBonus: 0, cost: 50 },
  bamboo_rod: { id: 'bamboo_rod', name: 'Bamboo Rod', catchBonus: 0.05, rarityBonus: 0, cost: 150 },
  fiberglass_rod: { id: 'fiberglass_rod', name: 'Fiberglass Rod', catchBonus: 0.1, rarityBonus: 0.02, cost: 400 },
  carbon_fiber_rod: { id: 'carbon_fiber_rod', name: 'Carbon Fiber Rod', catchBonus: 0.15, rarityBonus: 0.05, cost: 1000 },
  legendary_rod: { id: 'legendary_rod', name: 'Legendary Angler\'s Rod', catchBonus: 0.25, rarityBonus: 0.1, cost: 5000 }
};

// Bait types
export const BAITS = {
  worm: { id: 'worm', name: 'Earthworm', catchBonus: 0.05, targets: ['common_freshwater', 'uncommon_freshwater'], cost: 2 },
  minnow: { id: 'minnow', name: 'Minnow', catchBonus: 0.1, targets: ['uncommon_freshwater', 'rare_freshwater'], cost: 5 },
  shrimp: { id: 'shrimp', name: 'Shrimp', catchBonus: 0.08, targets: ['common_saltwater', 'uncommon_saltwater'], cost: 8 },
  squid_bait: { id: 'squid_bait', name: 'Squid Bait', catchBonus: 0.15, targets: ['rare_saltwater', 'legendary_saltwater'], cost: 20 },
  glowworm: { id: 'glowworm', name: 'Glowworm', catchBonus: 0.12, targets: ['rare_cave', 'legendary_cave'], cost: 25 },
  golden_lure: { id: 'golden_lure', name: 'Golden Lure', catchBonus: 0.2, targets: ['all'], cost: 100 }
};

/**
 * Initialize fishing state
 */
export function initFishingState() {
  return {
    fishingLevel: 1,
    fishingExp: 0,
    totalFishCaught: 0,
    fishCollection: {}, // fishId -> { count, largestWeight, smallestWeight }
    equippedRod: 'basic_rod',
    currentBait: null,
    baitInventory: {},
    fishingStats: {
      totalCasts: 0,
      successfulCatches: 0,
      fishEscaped: 0,
      perfectCatches: 0
    },
    currentStreak: 0,
    bestStreak: 0,
    lastFishingTime: null
  };
}

/**
 * Get fishing state from game state
 */
export function getFishingState(state) {
  return state.fishing || initFishingState();
}

/**
 * Equip a fishing rod
 */
export function equipRod(state, rodId) {
  const rodData = FISHING_RODS[rodId];
  if (!rodData) {
    return { state, equipped: false, error: 'Invalid fishing rod' };
  }

  const fishingState = getFishingState(state);

  return {
    state: {
      ...state,
      fishing: {
        ...fishingState,
        equippedRod: rodId
      }
    },
    equipped: true,
    rod: rodData
  };
}

/**
 * Set bait for fishing
 */
export function setBait(state, baitId) {
  const baitData = BAITS[baitId];
  if (!baitData) {
    return { state, set: false, error: 'Invalid bait' };
  }

  const fishingState = getFishingState(state);
  const currentCount = fishingState.baitInventory[baitId] || 0;

  if (currentCount <= 0) {
    return { state, set: false, error: 'No bait available' };
  }

  return {
    state: {
      ...state,
      fishing: {
        ...fishingState,
        currentBait: baitId
      }
    },
    set: true,
    bait: baitData
  };
}

/**
 * Add bait to inventory
 */
export function addBait(state, baitId, amount = 1) {
  const baitData = BAITS[baitId];
  if (!baitData) {
    return { state, added: false, error: 'Invalid bait' };
  }

  const fishingState = getFishingState(state);
  const currentCount = fishingState.baitInventory[baitId] || 0;

  return {
    state: {
      ...state,
      fishing: {
        ...fishingState,
        baitInventory: {
          ...fishingState.baitInventory,
          [baitId]: currentCount + amount
        }
      }
    },
    added: true,
    newCount: currentCount + amount
  };
}

/**
 * Calculate catch chance
 */
export function calculateCatchChance(state, zoneId) {
  const fishingState = getFishingState(state);
  const zone = FISHING_ZONES[zoneId.toUpperCase()];
  const rod = FISHING_RODS[fishingState.equippedRod];
  const bait = fishingState.currentBait ? BAITS[fishingState.currentBait] : null;

  if (!zone) return 0;

  // Base chance from skill level
  let chance = 0.5 + (fishingState.fishingLevel * 0.02);

  // Zone difficulty penalty
  chance -= (zone.difficulty - 1) * 0.05;

  // Rod bonus
  if (rod) {
    chance += rod.catchBonus;
  }

  // Bait bonus
  if (bait) {
    chance += bait.catchBonus;
  }

  // Clamp between 0.1 and 0.95
  return Math.max(0.1, Math.min(0.95, chance));
}

/**
 * Cast fishing line
 */
export function castLine(state, zoneId) {
  const zone = FISHING_ZONES[zoneId.toUpperCase()];
  if (!zone) {
    return { state, cast: false, error: 'Invalid fishing zone' };
  }

  const fishingState = getFishingState(state);

  // Consume bait if equipped
  let newBaitInventory = { ...fishingState.baitInventory };
  let newCurrentBait = fishingState.currentBait;

  if (fishingState.currentBait) {
    const baitCount = newBaitInventory[fishingState.currentBait] || 0;
    if (baitCount > 0) {
      newBaitInventory[fishingState.currentBait] = baitCount - 1;
      if (newBaitInventory[fishingState.currentBait] <= 0) {
        newCurrentBait = null;
      }
    } else {
      newCurrentBait = null;
    }
  }

  return {
    state: {
      ...state,
      fishing: {
        ...fishingState,
        baitInventory: newBaitInventory,
        currentBait: newCurrentBait,
        fishingStats: {
          ...fishingState.fishingStats,
          totalCasts: fishingState.fishingStats.totalCasts + 1
        },
        lastFishingTime: Date.now()
      }
    },
    cast: true,
    zone,
    catchChance: calculateCatchChance(state, zoneId)
  };
}

/**
 * Attempt to catch a fish
 */
export function attemptCatch(state, zoneId, catchRoll = null) {
  const zone = FISHING_ZONES[zoneId.toUpperCase()];
  if (!zone) {
    return { state, caught: false, error: 'Invalid fishing zone' };
  }

  const fishingState = getFishingState(state);
  const catchChance = calculateCatchChance(state, zoneId);
  const roll = catchRoll !== null ? catchRoll : Math.random();

  if (roll > catchChance) {
    // Fish escaped
    return {
      state: {
        ...state,
        fishing: {
          ...fishingState,
          fishingStats: {
            ...fishingState.fishingStats,
            fishEscaped: fishingState.fishingStats.fishEscaped + 1
          },
          currentStreak: 0
        }
      },
      caught: false,
      escaped: true
    };
  }

  // Determine which fish was caught
  const fish = selectFish(state, zone);
  const weight = generateWeight(fish);
  const isPerfect = roll < catchChance * 0.2; // Top 20% of successful catches

  // Calculate experience and value
  const rarityData = FISH_RARITIES[fish.rarity.toUpperCase()];
  const expGained = Math.floor(10 * (rarityData?.valueMultiplier || 1) * (isPerfect ? 1.5 : 1));
  const value = Math.floor(fish.baseValue * (rarityData?.valueMultiplier || 1) * (weight / ((fish.weight.min + fish.weight.max) / 2)));

  // Update collection
  const collection = fishingState.fishCollection[fish.id] || { count: 0, largestWeight: 0, smallestWeight: Infinity };
  const newCollection = {
    count: collection.count + 1,
    largestWeight: Math.max(collection.largestWeight, weight),
    smallestWeight: Math.min(collection.smallestWeight, weight)
  };

  // Calculate new level
  const newExp = fishingState.fishingExp + expGained;
  const newLevel = calculateFishingLevel(newExp);
  const leveledUp = newLevel > fishingState.fishingLevel;

  const newStreak = fishingState.currentStreak + 1;

  return {
    state: {
      ...state,
      fishing: {
        ...fishingState,
        fishingLevel: newLevel,
        fishingExp: newExp,
        totalFishCaught: fishingState.totalFishCaught + 1,
        fishCollection: {
          ...fishingState.fishCollection,
          [fish.id]: newCollection
        },
        fishingStats: {
          ...fishingState.fishingStats,
          successfulCatches: fishingState.fishingStats.successfulCatches + 1,
          perfectCatches: fishingState.fishingStats.perfectCatches + (isPerfect ? 1 : 0)
        },
        currentStreak: newStreak,
        bestStreak: Math.max(fishingState.bestStreak, newStreak)
      }
    },
    caught: true,
    fish,
    weight,
    value,
    expGained,
    isPerfect,
    isNewRecord: weight > collection.largestWeight,
    isNewSpecies: collection.count === 0,
    leveledUp,
    newLevel
  };
}

/**
 * Select a fish from the zone
 */
export function selectFish(state, zone) {
  const fishingState = getFishingState(state);
  const rod = FISHING_RODS[fishingState.equippedRod];
  const bait = fishingState.currentBait ? BAITS[fishingState.currentBait] : null;

  // Get available fish from zone
  const availableFish = Object.values(FISH).filter(f => zone.fishTypes.includes(f.category));

  if (availableFish.length === 0) {
    // Fallback to any common fish
    return FISH.bluegill;
  }

  // Apply rarity weights
  const rarityBonus = (rod?.rarityBonus || 0) + (bait && bait.targets.includes('all') ? 0.05 : 0);

  // Weight fish by rarity (inverse catch rate)
  const weightedFish = availableFish.map(fish => {
    const rarity = FISH_RARITIES[fish.rarity.toUpperCase()];
    const baseWeight = rarity ? rarity.catchRate : 0.5;
    const adjustedWeight = baseWeight + rarityBonus * (1 - baseWeight);
    return { fish, weight: adjustedWeight };
  });

  // Select based on weights
  const totalWeight = weightedFish.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { fish, weight } of weightedFish) {
    random -= weight;
    if (random <= 0) {
      return fish;
    }
  }

  return weightedFish[0].fish;
}

/**
 * Generate fish weight
 */
export function generateWeight(fish) {
  const { min, max } = fish.weight;
  const weight = min + Math.random() * (max - min);
  return Math.round(weight * 100) / 100;
}

/**
 * Calculate fishing level from experience
 */
export function calculateFishingLevel(experience) {
  let level = 1;
  let requiredExp = 0;

  while (experience >= requiredExp + level * 50) {
    requiredExp += level * 50;
    level++;
    if (level >= 50) break;
  }

  return level;
}

/**
 * Get experience needed for next level
 */
export function getExpToNextLevel(state) {
  const fishingState = getFishingState(state);
  let requiredExp = 0;
  let level = 1;

  while (level < fishingState.fishingLevel) {
    requiredExp += level * 50;
    level++;
  }

  const nextLevelExp = requiredExp + fishingState.fishingLevel * 50;
  return {
    currentExp: fishingState.fishingExp,
    requiredExp: nextLevelExp,
    expRemaining: nextLevelExp - fishingState.fishingExp
  };
}

/**
 * Get fishing statistics
 */
export function getFishingStats(state) {
  const fishingState = getFishingState(state);

  const uniqueSpecies = Object.keys(fishingState.fishCollection).length;
  const totalSpecies = Object.keys(FISH).length;

  const successRate = fishingState.fishingStats.totalCasts > 0
    ? (fishingState.fishingStats.successfulCatches / fishingState.fishingStats.totalCasts) * 100
    : 0;

  const perfectRate = fishingState.fishingStats.successfulCatches > 0
    ? (fishingState.fishingStats.perfectCatches / fishingState.fishingStats.successfulCatches) * 100
    : 0;

  return {
    ...fishingState.fishingStats,
    fishingLevel: fishingState.fishingLevel,
    totalFishCaught: fishingState.totalFishCaught,
    uniqueSpecies,
    totalSpecies,
    collectionPercent: Math.round((uniqueSpecies / totalSpecies) * 100),
    successRate: Math.round(successRate * 10) / 10,
    perfectRate: Math.round(perfectRate * 10) / 10,
    currentStreak: fishingState.currentStreak,
    bestStreak: fishingState.bestStreak
  };
}

/**
 * Get fish collection details
 */
export function getFishCollection(state) {
  const fishingState = getFishingState(state);

  return Object.entries(fishingState.fishCollection).map(([fishId, data]) => {
    const fishData = FISH[fishId];
    const rarityData = FISH_RARITIES[fishData?.rarity?.toUpperCase()];

    return {
      ...fishData,
      ...data,
      rarityData,
      avgWeight: data.count > 0 ? (data.largestWeight + data.smallestWeight) / 2 : 0
    };
  }).sort((a, b) => b.count - a.count);
}

/**
 * Sell fish from collection
 */
export function sellFish(state, fishId, amount = 1) {
  const fishingState = getFishingState(state);
  const fishData = FISH[fishId];

  if (!fishData) {
    return { state, sold: false, error: 'Invalid fish' };
  }

  const collection = fishingState.fishCollection[fishId];
  if (!collection || collection.count < amount) {
    return { state, sold: false, error: 'Not enough fish' };
  }

  const rarityData = FISH_RARITIES[fishData.rarity.toUpperCase()];
  const pricePerFish = fishData.baseValue * (rarityData?.valueMultiplier || 1);
  const totalValue = pricePerFish * amount;

  const newCount = collection.count - amount;

  return {
    state: {
      ...state,
      fishing: {
        ...fishingState,
        fishCollection: {
          ...fishingState.fishCollection,
          [fishId]: newCount > 0 ? {
            ...collection,
            count: newCount
          } : undefined
        }
      }
    },
    sold: true,
    amount,
    value: totalValue
  };
}

/**
 * Get available fish for a zone
 */
export function getZoneFish(zoneId) {
  const zone = FISHING_ZONES[zoneId.toUpperCase()];
  if (!zone) return [];

  return Object.values(FISH)
    .filter(f => zone.fishTypes.includes(f.category))
    .map(fish => ({
      ...fish,
      rarityData: FISH_RARITIES[fish.rarity.toUpperCase()]
    }));
}

/**
 * Check if zone is accessible at current level
 */
export function canAccessZone(state, zoneId) {
  const fishingState = getFishingState(state);
  const zone = FISHING_ZONES[zoneId.toUpperCase()];

  if (!zone) return false;

  // Require level 5 * difficulty to access
  const requiredLevel = (zone.difficulty - 1) * 5 + 1;
  return fishingState.fishingLevel >= requiredLevel;
}

/**
 * Get accessible zones for current level
 */
export function getAccessibleZones(state) {
  const fishingState = getFishingState(state);

  return Object.entries(FISHING_ZONES).map(([id, zone]) => {
    const requiredLevel = (zone.difficulty - 1) * 5 + 1;
    return {
      ...zone,
      requiredLevel,
      accessible: fishingState.fishingLevel >= requiredLevel
    };
  });
}
