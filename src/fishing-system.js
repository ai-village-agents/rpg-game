/**
 * Fishing System
 * A mini-game for catching fish and collecting aquatic treasures
 */

// Fish rarity levels
const FISH_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Fishing location types
const FISHING_LOCATION = {
  POND: 'pond',
  RIVER: 'river',
  LAKE: 'lake',
  OCEAN: 'ocean',
  SWAMP: 'swamp',
  UNDERGROUND: 'underground',
  LAVA: 'lava',
  MAGIC_SPRING: 'magic_spring'
};

// Weather effects on fishing
const WEATHER = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  STORMY: 'stormy',
  FOGGY: 'foggy'
};

// Time of day effects
const TIME_OF_DAY = {
  DAWN: 'dawn',
  DAY: 'day',
  DUSK: 'dusk',
  NIGHT: 'night'
};

// Bait types
const BAIT_TYPE = {
  WORM: 'worm',
  INSECT: 'insect',
  MINNOW: 'minnow',
  SHRIMP: 'shrimp',
  MAGIC_LURE: 'magic_lure',
  GOLDEN_LURE: 'golden_lure'
};

// Rod types
const ROD_TYPE = {
  BASIC: 'basic',
  WOODEN: 'wooden',
  IRON: 'iron',
  STEEL: 'steel',
  MITHRIL: 'mithril',
  ENCHANTED: 'enchanted',
  LEGENDARY: 'legendary'
};

// Fish database
const FISH_DATA = {
  // Pond fish
  goldfish: { name: 'Goldfish', rarity: FISH_RARITY.COMMON, locations: [FISHING_LOCATION.POND], baseValue: 5, minSize: 5, maxSize: 15 },
  carp: { name: 'Carp', rarity: FISH_RARITY.COMMON, locations: [FISHING_LOCATION.POND, FISHING_LOCATION.LAKE], baseValue: 8, minSize: 20, maxSize: 60 },
  koi: { name: 'Koi', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.POND], baseValue: 25, minSize: 30, maxSize: 70 },

  // River fish
  trout: { name: 'Trout', rarity: FISH_RARITY.COMMON, locations: [FISHING_LOCATION.RIVER], baseValue: 10, minSize: 15, maxSize: 50 },
  salmon: { name: 'Salmon', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.RIVER], baseValue: 20, minSize: 40, maxSize: 90 },
  catfish: { name: 'Catfish', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.RIVER, FISHING_LOCATION.LAKE], baseValue: 15, minSize: 30, maxSize: 100 },
  sturgeon: { name: 'Sturgeon', rarity: FISH_RARITY.RARE, locations: [FISHING_LOCATION.RIVER], baseValue: 75, minSize: 100, maxSize: 300 },

  // Lake fish
  bass: { name: 'Bass', rarity: FISH_RARITY.COMMON, locations: [FISHING_LOCATION.LAKE], baseValue: 12, minSize: 20, maxSize: 60 },
  pike: { name: 'Pike', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.LAKE], baseValue: 30, minSize: 40, maxSize: 120 },
  lake_monster: { name: 'Lake Monster', rarity: FISH_RARITY.LEGENDARY, locations: [FISHING_LOCATION.LAKE], baseValue: 500, minSize: 200, maxSize: 500 },

  // Ocean fish
  mackerel: { name: 'Mackerel', rarity: FISH_RARITY.COMMON, locations: [FISHING_LOCATION.OCEAN], baseValue: 15, minSize: 20, maxSize: 50 },
  tuna: { name: 'Tuna', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.OCEAN], baseValue: 35, minSize: 50, maxSize: 200 },
  swordfish: { name: 'Swordfish', rarity: FISH_RARITY.RARE, locations: [FISHING_LOCATION.OCEAN], baseValue: 100, minSize: 100, maxSize: 300 },
  shark: { name: 'Shark', rarity: FISH_RARITY.EPIC, locations: [FISHING_LOCATION.OCEAN], baseValue: 200, minSize: 150, maxSize: 400 },
  sea_serpent: { name: 'Sea Serpent', rarity: FISH_RARITY.LEGENDARY, locations: [FISHING_LOCATION.OCEAN], baseValue: 750, minSize: 300, maxSize: 800 },

  // Swamp fish
  mudfish: { name: 'Mudfish', rarity: FISH_RARITY.COMMON, locations: [FISHING_LOCATION.SWAMP], baseValue: 6, minSize: 10, maxSize: 30 },
  snapping_turtle: { name: 'Snapping Turtle', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.SWAMP], baseValue: 25, minSize: 20, maxSize: 50 },
  swamp_eel: { name: 'Swamp Eel', rarity: FISH_RARITY.RARE, locations: [FISHING_LOCATION.SWAMP], baseValue: 60, minSize: 50, maxSize: 150 },

  // Underground fish
  cave_fish: { name: 'Cave Fish', rarity: FISH_RARITY.UNCOMMON, locations: [FISHING_LOCATION.UNDERGROUND], baseValue: 40, minSize: 10, maxSize: 30 },
  crystal_fish: { name: 'Crystal Fish', rarity: FISH_RARITY.RARE, locations: [FISHING_LOCATION.UNDERGROUND], baseValue: 120, minSize: 15, maxSize: 40 },
  abyssal_lurker: { name: 'Abyssal Lurker', rarity: FISH_RARITY.EPIC, locations: [FISHING_LOCATION.UNDERGROUND], baseValue: 300, minSize: 100, maxSize: 250 },

  // Lava fish
  magma_crab: { name: 'Magma Crab', rarity: FISH_RARITY.RARE, locations: [FISHING_LOCATION.LAVA], baseValue: 150, minSize: 20, maxSize: 50 },
  fire_eel: { name: 'Fire Eel', rarity: FISH_RARITY.EPIC, locations: [FISHING_LOCATION.LAVA], baseValue: 350, minSize: 40, maxSize: 100 },
  lava_leviathan: { name: 'Lava Leviathan', rarity: FISH_RARITY.LEGENDARY, locations: [FISHING_LOCATION.LAVA], baseValue: 1000, minSize: 200, maxSize: 600 },

  // Magic spring fish
  fairy_fish: { name: 'Fairy Fish', rarity: FISH_RARITY.RARE, locations: [FISHING_LOCATION.MAGIC_SPRING], baseValue: 100, minSize: 5, maxSize: 15 },
  starlight_koi: { name: 'Starlight Koi', rarity: FISH_RARITY.EPIC, locations: [FISHING_LOCATION.MAGIC_SPRING], baseValue: 400, minSize: 30, maxSize: 80 },
  celestial_whale: { name: 'Celestial Whale', rarity: FISH_RARITY.LEGENDARY, locations: [FISHING_LOCATION.MAGIC_SPRING], baseValue: 1500, minSize: 500, maxSize: 1000 }
};

// Rod stats
const ROD_STATS = {
  [ROD_TYPE.BASIC]: { catchBonus: 0, rarityBonus: 0, durability: 50 },
  [ROD_TYPE.WOODEN]: { catchBonus: 0.05, rarityBonus: 0, durability: 100 },
  [ROD_TYPE.IRON]: { catchBonus: 0.1, rarityBonus: 0.05, durability: 200 },
  [ROD_TYPE.STEEL]: { catchBonus: 0.15, rarityBonus: 0.1, durability: 400 },
  [ROD_TYPE.MITHRIL]: { catchBonus: 0.25, rarityBonus: 0.15, durability: 800 },
  [ROD_TYPE.ENCHANTED]: { catchBonus: 0.35, rarityBonus: 0.25, durability: 1000 },
  [ROD_TYPE.LEGENDARY]: { catchBonus: 0.5, rarityBonus: 0.4, durability: Infinity }
};

// Bait stats
const BAIT_STATS = {
  [BAIT_TYPE.WORM]: { catchBonus: 0, rarityBonus: 0 },
  [BAIT_TYPE.INSECT]: { catchBonus: 0.05, rarityBonus: 0 },
  [BAIT_TYPE.MINNOW]: { catchBonus: 0.1, rarityBonus: 0.05 },
  [BAIT_TYPE.SHRIMP]: { catchBonus: 0.15, rarityBonus: 0.1 },
  [BAIT_TYPE.MAGIC_LURE]: { catchBonus: 0.25, rarityBonus: 0.2 },
  [BAIT_TYPE.GOLDEN_LURE]: { catchBonus: 0.4, rarityBonus: 0.35 }
};

// Weather effects
const WEATHER_EFFECTS = {
  [WEATHER.SUNNY]: { catchMultiplier: 1.0, rarityMultiplier: 1.0 },
  [WEATHER.CLOUDY]: { catchMultiplier: 1.1, rarityMultiplier: 1.05 },
  [WEATHER.RAINY]: { catchMultiplier: 1.25, rarityMultiplier: 1.1 },
  [WEATHER.STORMY]: { catchMultiplier: 1.0, rarityMultiplier: 1.3 },
  [WEATHER.FOGGY]: { catchMultiplier: 0.9, rarityMultiplier: 1.2 }
};

// Time effects
const TIME_EFFECTS = {
  [TIME_OF_DAY.DAWN]: { catchMultiplier: 1.2, rarityMultiplier: 1.1 },
  [TIME_OF_DAY.DAY]: { catchMultiplier: 1.0, rarityMultiplier: 1.0 },
  [TIME_OF_DAY.DUSK]: { catchMultiplier: 1.2, rarityMultiplier: 1.1 },
  [TIME_OF_DAY.NIGHT]: { catchMultiplier: 0.8, rarityMultiplier: 1.25 }
};

// Rarity weights (lower = rarer)
const RARITY_WEIGHTS = {
  [FISH_RARITY.COMMON]: 100,
  [FISH_RARITY.UNCOMMON]: 40,
  [FISH_RARITY.RARE]: 15,
  [FISH_RARITY.EPIC]: 5,
  [FISH_RARITY.LEGENDARY]: 1
};

// Value multipliers by rarity
const RARITY_VALUE_MULTIPLIER = {
  [FISH_RARITY.COMMON]: 1,
  [FISH_RARITY.UNCOMMON]: 1.5,
  [FISH_RARITY.RARE]: 2.5,
  [FISH_RARITY.EPIC]: 4,
  [FISH_RARITY.LEGENDARY]: 8
};

/**
 * Create initial fishing state
 */
function createFishingState() {
  return {
    currentRod: null,
    inventory: {
      bait: {},
      rods: {},
      fish: {}
    },
    stats: {
      totalCatches: 0,
      fishCaught: {},
      largestCatch: null,
      rarestCatch: null,
      totalValue: 0
    },
    skills: {
      level: 1,
      xp: 0
    },
    unlockedLocations: [FISHING_LOCATION.POND],
    achievements: []
  };
}

/**
 * Get XP required for next level
 */
function getXpForLevel(level) {
  return Math.floor(50 * Math.pow(1.2, level - 1));
}

/**
 * Add bait to inventory
 */
function addBait(state, baitType, quantity) {
  if (!BAIT_STATS[baitType]) {
    return {
      success: false,
      error: 'Invalid bait type',
      state
    };
  }

  const currentAmount = state.inventory.bait[baitType] || 0;

  return {
    success: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        bait: {
          ...state.inventory.bait,
          [baitType]: currentAmount + quantity
        }
      }
    }
  };
}

/**
 * Add rod to inventory
 */
function addRod(state, rodType) {
  if (!ROD_STATS[rodType]) {
    return {
      success: false,
      error: 'Invalid rod type',
      state
    };
  }

  const rodId = `rod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const rodStats = ROD_STATS[rodType];

  const newRod = {
    id: rodId,
    type: rodType,
    currentDurability: rodStats.durability,
    maxDurability: rodStats.durability
  };

  return {
    success: true,
    rod: newRod,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        rods: {
          ...state.inventory.rods,
          [rodId]: newRod
        }
      }
    }
  };
}

/**
 * Equip a rod
 */
function equipRod(state, rodId) {
  const rod = state.inventory.rods[rodId];

  if (!rod) {
    return {
      success: false,
      error: 'Rod not found',
      state
    };
  }

  if (rod.currentDurability <= 0) {
    return {
      success: false,
      error: 'Rod is broken',
      state
    };
  }

  return {
    success: true,
    state: {
      ...state,
      currentRod: rodId
    }
  };
}

/**
 * Unlock a fishing location
 */
function unlockLocation(state, location) {
  if (!Object.values(FISHING_LOCATION).includes(location)) {
    return {
      success: false,
      error: 'Invalid location',
      state
    };
  }

  if (state.unlockedLocations.includes(location)) {
    return {
      success: false,
      error: 'Location already unlocked',
      state
    };
  }

  return {
    success: true,
    state: {
      ...state,
      unlockedLocations: [...state.unlockedLocations, location]
    }
  };
}

/**
 * Get available fish at a location
 */
function getAvailableFish(location) {
  return Object.entries(FISH_DATA)
    .filter(([_, data]) => data.locations.includes(location))
    .map(([id, data]) => ({ id, ...data }));
}

/**
 * Calculate catch chance
 */
function calculateCatchChance(state, weather, timeOfDay) {
  const baseCatch = 0.5;
  let bonus = 0;

  // Rod bonus
  if (state.currentRod) {
    const rod = state.inventory.rods[state.currentRod];
    if (rod) {
      const rodStats = ROD_STATS[rod.type];
      bonus += rodStats.catchBonus;
    }
  }

  // Weather and time effects
  const weatherEffect = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS[WEATHER.SUNNY];
  const timeEffect = TIME_EFFECTS[timeOfDay] || TIME_EFFECTS[TIME_OF_DAY.DAY];

  // Skill bonus (1% per level)
  const skillBonus = state.skills.level * 0.01;

  return Math.min(0.95, (baseCatch + bonus + skillBonus) * weatherEffect.catchMultiplier * timeEffect.catchMultiplier);
}

/**
 * Select fish based on rarity
 */
function selectFish(availableFish, rarityBonus) {
  // Calculate adjusted weights
  const weightedFish = availableFish.map(fish => {
    let weight = RARITY_WEIGHTS[fish.rarity];
    // Apply bonus for rarer fish
    if (fish.rarity !== FISH_RARITY.COMMON) {
      weight *= (1 + rarityBonus);
    }
    return { fish, weight };
  });

  const totalWeight = weightedFish.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of weightedFish) {
    random -= item.weight;
    if (random <= 0) {
      return item.fish;
    }
  }

  return weightedFish[0].fish;
}

/**
 * Generate fish size
 */
function generateFishSize(fish) {
  const range = fish.maxSize - fish.minSize;
  return fish.minSize + Math.floor(Math.random() * (range + 1));
}

/**
 * Calculate fish value
 */
function calculateFishValue(fish, size) {
  const sizeMultiplier = size / fish.minSize;
  const rarityMultiplier = RARITY_VALUE_MULTIPLIER[fish.rarity];
  return Math.floor(fish.baseValue * sizeMultiplier * rarityMultiplier);
}

/**
 * Attempt to catch a fish
 */
function attemptCatch(state, location, baitType, weather = WEATHER.SUNNY, timeOfDay = TIME_OF_DAY.DAY) {
  // Validate location
  if (!state.unlockedLocations.includes(location)) {
    return {
      success: false,
      error: 'Location not unlocked',
      state
    };
  }

  // Check rod
  if (!state.currentRod) {
    return {
      success: false,
      error: 'No rod equipped',
      state
    };
  }

  const rod = state.inventory.rods[state.currentRod];
  if (!rod || rod.currentDurability <= 0) {
    return {
      success: false,
      error: 'Rod is broken or missing',
      state
    };
  }

  // Check bait
  if (!state.inventory.bait[baitType] || state.inventory.bait[baitType] <= 0) {
    return {
      success: false,
      error: 'No bait of that type',
      state
    };
  }

  // Consume bait
  let newState = {
    ...state,
    inventory: {
      ...state.inventory,
      bait: {
        ...state.inventory.bait,
        [baitType]: state.inventory.bait[baitType] - 1
      }
    }
  };

  // Reduce rod durability
  if (rod.maxDurability !== Infinity) {
    newState = {
      ...newState,
      inventory: {
        ...newState.inventory,
        rods: {
          ...newState.inventory.rods,
          [state.currentRod]: {
            ...rod,
            currentDurability: rod.currentDurability - 1
          }
        }
      }
    };
  }

  // Calculate catch chance
  const catchChance = calculateCatchChance(state, weather, timeOfDay);
  const roll = Math.random();

  if (roll > catchChance) {
    return {
      success: true,
      caught: false,
      message: 'The fish got away!',
      state: newState
    };
  }

  // Get available fish
  const availableFish = getAvailableFish(location);
  if (availableFish.length === 0) {
    return {
      success: false,
      error: 'No fish available at this location',
      state: newState
    };
  }

  // Calculate rarity bonus
  const rodStats = ROD_STATS[rod.type];
  const baitStats = BAIT_STATS[baitType];
  const weatherEffect = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS[WEATHER.SUNNY];
  const timeEffect = TIME_EFFECTS[timeOfDay] || TIME_EFFECTS[TIME_OF_DAY.DAY];

  const rarityBonus = (rodStats.rarityBonus + baitStats.rarityBonus) *
                      weatherEffect.rarityMultiplier *
                      timeEffect.rarityMultiplier;

  // Select and generate fish
  const selectedFish = selectFish(availableFish, rarityBonus);
  const size = generateFishSize(selectedFish);
  const value = calculateFishValue(selectedFish, size);

  // Create caught fish record
  const caughtFish = {
    id: selectedFish.id,
    name: selectedFish.name,
    rarity: selectedFish.rarity,
    size,
    value,
    location,
    caughtAt: Date.now()
  };

  // Update fish inventory
  const fishInventory = { ...newState.inventory.fish };
  if (!fishInventory[selectedFish.id]) {
    fishInventory[selectedFish.id] = [];
  }
  fishInventory[selectedFish.id] = [...fishInventory[selectedFish.id], caughtFish];

  // Update stats
  const fishCaught = { ...newState.stats.fishCaught };
  fishCaught[selectedFish.id] = (fishCaught[selectedFish.id] || 0) + 1;

  let largestCatch = newState.stats.largestCatch;
  if (!largestCatch || size > largestCatch.size) {
    largestCatch = caughtFish;
  }

  let rarestCatch = newState.stats.rarestCatch;
  const rarityOrder = [FISH_RARITY.COMMON, FISH_RARITY.UNCOMMON, FISH_RARITY.RARE, FISH_RARITY.EPIC, FISH_RARITY.LEGENDARY];
  if (!rarestCatch || rarityOrder.indexOf(selectedFish.rarity) > rarityOrder.indexOf(rarestCatch.rarity)) {
    rarestCatch = caughtFish;
  }

  // Calculate XP
  const baseXp = 10;
  const rarityXpMultiplier = RARITY_VALUE_MULTIPLIER[selectedFish.rarity];
  const xpGained = Math.floor(baseXp * rarityXpMultiplier);

  // Check for level up
  let skills = { ...newState.skills, xp: newState.skills.xp + xpGained };
  let leveledUp = false;

  while (skills.xp >= getXpForLevel(skills.level + 1)) {
    skills.xp -= getXpForLevel(skills.level + 1);
    skills.level++;
    leveledUp = true;
  }

  newState = {
    ...newState,
    inventory: {
      ...newState.inventory,
      fish: fishInventory
    },
    stats: {
      ...newState.stats,
      totalCatches: newState.stats.totalCatches + 1,
      fishCaught,
      largestCatch,
      rarestCatch,
      totalValue: newState.stats.totalValue + value
    },
    skills
  };

  return {
    success: true,
    caught: true,
    fish: caughtFish,
    xpGained,
    leveledUp,
    newLevel: skills.level,
    state: newState
  };
}

/**
 * Sell a fish
 */
function sellFish(state, fishId, index = 0) {
  const fishCollection = state.inventory.fish[fishId];

  if (!fishCollection || fishCollection.length === 0) {
    return {
      success: false,
      error: 'Fish not found in inventory',
      state
    };
  }

  if (index < 0 || index >= fishCollection.length) {
    return {
      success: false,
      error: 'Invalid fish index',
      state
    };
  }

  const fish = fishCollection[index];
  const newCollection = [...fishCollection];
  newCollection.splice(index, 1);

  return {
    success: true,
    goldEarned: fish.value,
    soldFish: fish,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        fish: {
          ...state.inventory.fish,
          [fishId]: newCollection
        }
      }
    }
  };
}

/**
 * Sell all fish of a type
 */
function sellAllFishOfType(state, fishId) {
  const fishCollection = state.inventory.fish[fishId];

  if (!fishCollection || fishCollection.length === 0) {
    return {
      success: false,
      error: 'No fish of that type in inventory',
      state
    };
  }

  const totalValue = fishCollection.reduce((sum, fish) => sum + fish.value, 0);

  return {
    success: true,
    goldEarned: totalValue,
    fishSold: fishCollection.length,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        fish: {
          ...state.inventory.fish,
          [fishId]: []
        }
      }
    }
  };
}

/**
 * Get fishing stats summary
 */
function getFishingStats(state) {
  const totalFish = Object.values(state.stats.fishCaught).reduce((sum, count) => sum + count, 0);
  const uniqueSpecies = Object.keys(state.stats.fishCaught).length;
  const totalSpecies = Object.keys(FISH_DATA).length;

  return {
    totalCatches: state.stats.totalCatches,
    totalFish,
    uniqueSpecies,
    totalSpecies,
    completionPercent: Math.floor((uniqueSpecies / totalSpecies) * 100),
    largestCatch: state.stats.largestCatch,
    rarestCatch: state.stats.rarestCatch,
    totalValue: state.stats.totalValue,
    skillLevel: state.skills.level,
    skillXp: state.skills.xp,
    xpToNextLevel: getXpForLevel(state.skills.level + 1)
  };
}

/**
 * Get fish collection for display
 */
function getFishCollection(state) {
  const collection = {};

  Object.keys(FISH_DATA).forEach(fishId => {
    const fishData = FISH_DATA[fishId];
    const caught = state.stats.fishCaught[fishId] || 0;
    const inInventory = state.inventory.fish[fishId]?.length || 0;

    collection[fishId] = {
      ...fishData,
      id: fishId,
      caught,
      inInventory,
      discovered: caught > 0
    };
  });

  return collection;
}

/**
 * Repair a rod
 */
function repairRod(state, rodId, repairAmount) {
  const rod = state.inventory.rods[rodId];

  if (!rod) {
    return {
      success: false,
      error: 'Rod not found',
      state
    };
  }

  if (rod.maxDurability === Infinity) {
    return {
      success: false,
      error: 'This rod cannot be repaired (it never breaks)',
      state
    };
  }

  const newDurability = Math.min(rod.maxDurability, rod.currentDurability + repairAmount);

  return {
    success: true,
    newDurability,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        rods: {
          ...state.inventory.rods,
          [rodId]: {
            ...rod,
            currentDurability: newDurability
          }
        }
      }
    }
  };
}

/**
 * Check achievements
 */
function checkAchievements(state) {
  const achievements = [];
  const stats = getFishingStats(state);

  if (stats.totalCatches >= 1 && !state.achievements.includes('first_catch')) {
    achievements.push({ id: 'first_catch', name: 'First Catch', description: 'Catch your first fish' });
  }

  if (stats.totalCatches >= 100 && !state.achievements.includes('century_angler')) {
    achievements.push({ id: 'century_angler', name: 'Century Angler', description: 'Catch 100 fish' });
  }

  if (stats.uniqueSpecies >= 10 && !state.achievements.includes('collector')) {
    achievements.push({ id: 'collector', name: 'Collector', description: 'Discover 10 unique species' });
  }

  if (stats.completionPercent >= 50 && !state.achievements.includes('halfway_there')) {
    achievements.push({ id: 'halfway_there', name: 'Halfway There', description: 'Discover 50% of all fish species' });
  }

  if (stats.rarestCatch?.rarity === FISH_RARITY.LEGENDARY && !state.achievements.includes('legendary_catch')) {
    achievements.push({ id: 'legendary_catch', name: 'Legendary Catch', description: 'Catch a legendary fish' });
  }

  if (stats.skillLevel >= 10 && !state.achievements.includes('master_angler')) {
    achievements.push({ id: 'master_angler', name: 'Master Angler', description: 'Reach fishing skill level 10' });
  }

  return achievements;
}

/**
 * Award achievements
 */
function awardAchievements(state, achievements) {
  if (achievements.length === 0) return state;

  const newAchievements = achievements.map(a => a.id);

  return {
    ...state,
    achievements: [...state.achievements, ...newAchievements]
  };
}

// Export everything
export {
  FISH_RARITY,
  FISHING_LOCATION,
  WEATHER,
  TIME_OF_DAY,
  BAIT_TYPE,
  ROD_TYPE,
  FISH_DATA,
  ROD_STATS,
  BAIT_STATS,
  WEATHER_EFFECTS,
  TIME_EFFECTS,
  RARITY_WEIGHTS,
  RARITY_VALUE_MULTIPLIER,
  createFishingState,
  getXpForLevel,
  addBait,
  addRod,
  equipRod,
  unlockLocation,
  getAvailableFish,
  calculateCatchChance,
  attemptCatch,
  sellFish,
  sellAllFishOfType,
  getFishingStats,
  getFishCollection,
  repairRod,
  checkAchievements,
  awardAchievements
};
