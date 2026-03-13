/**
 * Treasure Map System
 * Manages treasure hunting, map discovery, and hidden rewards
 */

// Map rarities
export const MAP_RARITIES = {
  TATTERED: { id: 'tattered', name: 'Tattered Map', rewardMultiplier: 1, color: '#AAAAAA' },
  WORN: { id: 'worn', name: 'Worn Map', rewardMultiplier: 1.5, color: '#00AA00' },
  PRISTINE: { id: 'pristine', name: 'Pristine Map', rewardMultiplier: 2.5, color: '#0066FF' },
  ANCIENT: { id: 'ancient', name: 'Ancient Map', rewardMultiplier: 4, color: '#AA00AA' },
  LEGENDARY: { id: 'legendary', name: 'Legendary Map', rewardMultiplier: 8, color: '#FF8800' }
};

// Treasure types
export const TREASURE_TYPES = {
  GOLD_CACHE: { id: 'gold_cache', name: 'Gold Cache', category: 'currency', baseValue: 100 },
  EQUIPMENT_CHEST: { id: 'equipment_chest', name: 'Equipment Chest', category: 'equipment', baseValue: 200 },
  GEM_DEPOSIT: { id: 'gem_deposit', name: 'Gem Deposit', category: 'gems', baseValue: 150 },
  ARTIFACT: { id: 'artifact', name: 'Ancient Artifact', category: 'artifact', baseValue: 500 },
  RECIPE_SCROLL: { id: 'recipe_scroll', name: 'Recipe Scroll', category: 'recipe', baseValue: 250 },
  MATERIAL_STASH: { id: 'material_stash', name: 'Material Stash', category: 'materials', baseValue: 120 },
  SKILL_TOME: { id: 'skill_tome', name: 'Skill Tome', category: 'skill', baseValue: 400 },
  CURSED_CHEST: { id: 'cursed_chest', name: 'Cursed Chest', category: 'cursed', baseValue: 300 }
};

// Puzzle types for treasure hunting
export const PUZZLE_TYPES = {
  NONE: { id: 'none', name: 'No Puzzle', difficulty: 0 },
  RIDDLE: { id: 'riddle', name: 'Riddle', difficulty: 1 },
  SEQUENCE: { id: 'sequence', name: 'Sequence Puzzle', difficulty: 2 },
  COMBINATION: { id: 'combination', name: 'Combination Lock', difficulty: 2 },
  CIPHER: { id: 'cipher', name: 'Cipher Decode', difficulty: 3 },
  MAZE: { id: 'maze', name: 'Maze Navigation', difficulty: 3 },
  GUARDIAN: { id: 'guardian', name: 'Guardian Battle', difficulty: 4 }
};

// Map regions
export const MAP_REGIONS = {
  FOREST: { id: 'forest', name: 'Whispering Woods', terrainBonus: 'stealth' },
  MOUNTAIN: { id: 'mountain', name: 'Craggy Peaks', terrainBonus: 'climbing' },
  DESERT: { id: 'desert', name: 'Shifting Sands', terrainBonus: 'survival' },
  SWAMP: { id: 'swamp', name: 'Murky Marshes', terrainBonus: 'nature' },
  RUINS: { id: 'ruins', name: 'Ancient Ruins', terrainBonus: 'history' },
  COASTAL: { id: 'coastal', name: 'Stormy Coast', terrainBonus: 'navigation' },
  UNDERGROUND: { id: 'underground', name: 'Deep Caverns', terrainBonus: 'mining' },
  VOLCANIC: { id: 'volcanic', name: 'Ember Fields', terrainBonus: 'fire_resistance' }
};

/**
 * Initialize treasure map state
 */
export function initTreasureMapState() {
  return {
    ownedMaps: [], // { id, rarity, region, treasureType, puzzle, discovered, completed, hints }
    completedMaps: 0,
    totalTreasureValue: 0,
    discoveredLocations: [],
    treasureHunterLevel: 1,
    treasureHunterExp: 0,
    mapFragments: 0,
    legendaryMapsFound: 0,
    currentHunt: null
  };
}

/**
 * Get treasure map state from game state
 */
export function getTreasureMapState(state) {
  return state.treasureMaps || initTreasureMapState();
}

/**
 * Generate a new treasure map
 */
export function generateMap(rarity = 'tattered', region = null, treasureType = null) {
  const rarityData = MAP_RARITIES[rarity.toUpperCase()];
  if (!rarityData) {
    return { generated: false, error: 'Invalid rarity' };
  }

  // Random region if not specified
  const regionKeys = Object.keys(MAP_REGIONS);
  const selectedRegion = region || regionKeys[Math.floor(Math.random() * regionKeys.length)].toLowerCase();

  // Random treasure type if not specified
  const treasureKeys = Object.keys(TREASURE_TYPES);
  const selectedTreasure = treasureType || treasureKeys[Math.floor(Math.random() * treasureKeys.length)].toLowerCase();

  // Higher rarity = harder puzzle
  const puzzleKeys = Object.keys(PUZZLE_TYPES);
  const rarityIndex = Object.keys(MAP_RARITIES).indexOf(rarity.toUpperCase());
  const minPuzzleIndex = Math.min(rarityIndex, puzzleKeys.length - 1);
  const puzzleIndex = Math.floor(Math.random() * (puzzleKeys.length - minPuzzleIndex)) + minPuzzleIndex;
  const selectedPuzzle = puzzleKeys[Math.min(puzzleIndex, puzzleKeys.length - 1)].toLowerCase();

  // Generate hints based on rarity
  const numHints = Math.max(1, 4 - rarityIndex);
  const hints = generateHints(selectedRegion, selectedTreasure, numHints);

  const map = {
    id: `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    rarity: rarity.toLowerCase(),
    region: selectedRegion,
    treasureType: selectedTreasure,
    puzzle: selectedPuzzle,
    discovered: false,
    completed: false,
    hints,
    createdAt: Date.now(),
    progress: 0
  };

  return { generated: true, map };
}

/**
 * Generate hints for a map
 */
function generateHints(region, treasureType, count) {
  const regionData = MAP_REGIONS[region.toUpperCase()];
  const treasureData = TREASURE_TYPES[treasureType.toUpperCase()];

  const possibleHints = [
    `The treasure lies within ${regionData?.name || 'unknown lands'}.`,
    `Look for signs of ${treasureData?.category || 'valuable items'}.`,
    `The terrain favors those skilled in ${regionData?.terrainBonus || 'exploration'}.`,
    `Ancient markings point the way.`,
    `Follow the path less traveled.`,
    `The treasure is hidden where few dare to venture.`,
    `Seek the landmark mentioned in old tales.`,
    `The guardians protect something of great value.`
  ];

  const selectedHints = [];
  for (let i = 0; i < count && i < possibleHints.length; i++) {
    const index = Math.floor(Math.random() * possibleHints.length);
    selectedHints.push(possibleHints.splice(index, 1)[0]);
  }

  return selectedHints;
}

/**
 * Add map to player's collection
 */
export function addMap(state, map) {
  if (!map || !map.id) {
    return { state, added: false, error: 'Invalid map' };
  }

  const treasureState = getTreasureMapState(state);

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        ownedMaps: [...treasureState.ownedMaps, map]
      }
    },
    added: true,
    map
  };
}

/**
 * Start a treasure hunt
 */
export function startHunt(state, mapId) {
  const treasureState = getTreasureMapState(state);
  const map = treasureState.ownedMaps.find(m => m.id === mapId);

  if (!map) {
    return { state, started: false, error: 'Map not found' };
  }

  if (map.completed) {
    return { state, started: false, error: 'Map already completed' };
  }

  if (treasureState.currentHunt) {
    return { state, started: false, error: 'Already on a treasure hunt' };
  }

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        currentHunt: {
          mapId,
          startedAt: Date.now(),
          steps: [],
          puzzleSolved: false
        }
      }
    },
    started: true,
    map
  };
}

/**
 * Update hunt progress
 */
export function updateHuntProgress(state, progressAmount) {
  const treasureState = getTreasureMapState(state);

  if (!treasureState.currentHunt) {
    return { state, updated: false, error: 'No active hunt' };
  }

  const mapIndex = treasureState.ownedMaps.findIndex(m => m.id === treasureState.currentHunt.mapId);
  if (mapIndex === -1) {
    return { state, updated: false, error: 'Map not found' };
  }

  const map = treasureState.ownedMaps[mapIndex];
  const newProgress = Math.min(100, map.progress + progressAmount);

  const updatedMaps = [...treasureState.ownedMaps];
  updatedMaps[mapIndex] = { ...map, progress: newProgress };

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        ownedMaps: updatedMaps
      }
    },
    updated: true,
    newProgress,
    discovered: newProgress >= 100
  };
}

/**
 * Solve puzzle for treasure
 */
export function solvePuzzle(state, solution) {
  const treasureState = getTreasureMapState(state);

  if (!treasureState.currentHunt) {
    return { state, solved: false, error: 'No active hunt' };
  }

  const map = treasureState.ownedMaps.find(m => m.id === treasureState.currentHunt.mapId);
  if (!map) {
    return { state, solved: false, error: 'Map not found' };
  }

  const puzzleData = PUZZLE_TYPES[map.puzzle.toUpperCase()];
  if (!puzzleData || puzzleData.id === 'none') {
    // No puzzle needed
    return {
      state: {
        ...state,
        treasureMaps: {
          ...treasureState,
          currentHunt: {
            ...treasureState.currentHunt,
            puzzleSolved: true
          }
        }
      },
      solved: true,
      noPuzzle: true
    };
  }

  // Simulate puzzle solving (in real implementation, validate solution)
  const success = solution !== null && solution !== undefined;

  if (!success) {
    return { state, solved: false, error: 'Incorrect solution' };
  }

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        currentHunt: {
          ...treasureState.currentHunt,
          puzzleSolved: true
        }
      }
    },
    solved: true,
    puzzleType: puzzleData.name
  };
}

/**
 * Claim treasure from completed hunt
 */
export function claimTreasure(state) {
  const treasureState = getTreasureMapState(state);

  if (!treasureState.currentHunt) {
    return { state, claimed: false, error: 'No active hunt' };
  }

  const mapIndex = treasureState.ownedMaps.findIndex(m => m.id === treasureState.currentHunt.mapId);
  if (mapIndex === -1) {
    return { state, claimed: false, error: 'Map not found' };
  }

  const map = treasureState.ownedMaps[mapIndex];

  if (map.progress < 100) {
    return { state, claimed: false, error: 'Treasure not yet discovered' };
  }

  if (!treasureState.currentHunt.puzzleSolved) {
    const puzzleData = PUZZLE_TYPES[map.puzzle.toUpperCase()];
    if (puzzleData && puzzleData.id !== 'none') {
      return { state, claimed: false, error: 'Puzzle not solved' };
    }
  }

  // Calculate rewards
  const rarityData = MAP_RARITIES[map.rarity.toUpperCase()];
  const treasureData = TREASURE_TYPES[map.treasureType.toUpperCase()];
  const baseValue = treasureData?.baseValue || 100;
  const finalValue = Math.floor(baseValue * (rarityData?.rewardMultiplier || 1));

  // Experience gained
  const expGained = Math.floor(50 * (rarityData?.rewardMultiplier || 1));
  const newExp = treasureState.treasureHunterExp + expGained;
  const newLevel = calculateTreasureHunterLevel(newExp);
  const leveledUp = newLevel > treasureState.treasureHunterLevel;

  // Update map as completed
  const updatedMaps = [...treasureState.ownedMaps];
  updatedMaps[mapIndex] = { ...map, completed: true };

  // Check if legendary
  const isLegendary = map.rarity === 'legendary';

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        ownedMaps: updatedMaps,
        completedMaps: treasureState.completedMaps + 1,
        totalTreasureValue: treasureState.totalTreasureValue + finalValue,
        treasureHunterExp: newExp,
        treasureHunterLevel: newLevel,
        legendaryMapsFound: treasureState.legendaryMapsFound + (isLegendary ? 1 : 0),
        currentHunt: null
      }
    },
    claimed: true,
    treasure: {
      type: treasureData,
      value: finalValue,
      rarity: rarityData
    },
    expGained,
    leveledUp,
    newLevel
  };
}

/**
 * Abandon current hunt
 */
export function abandonHunt(state) {
  const treasureState = getTreasureMapState(state);

  if (!treasureState.currentHunt) {
    return { state, abandoned: false, error: 'No active hunt' };
  }

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        currentHunt: null
      }
    },
    abandoned: true
  };
}

/**
 * Combine map fragments into a full map
 */
export function combineFragments(state, fragmentCount = 5) {
  const treasureState = getTreasureMapState(state);

  if (treasureState.mapFragments < fragmentCount) {
    return { state, combined: false, error: 'Not enough fragments' };
  }

  // Higher fragment count = better rarity chance
  const rarityRoll = Math.random();
  let rarity = 'tattered';
  if (rarityRoll < 0.05) {
    rarity = 'legendary';
  } else if (rarityRoll < 0.15) {
    rarity = 'ancient';
  } else if (rarityRoll < 0.35) {
    rarity = 'pristine';
  } else if (rarityRoll < 0.6) {
    rarity = 'worn';
  }

  const mapResult = generateMap(rarity);
  if (!mapResult.generated) {
    return { state, combined: false, error: 'Failed to generate map' };
  }

  const addResult = addMap(
    {
      ...state,
      treasureMaps: {
        ...treasureState,
        mapFragments: treasureState.mapFragments - fragmentCount
      }
    },
    mapResult.map
  );

  return {
    state: addResult.state,
    combined: true,
    map: mapResult.map,
    fragmentsUsed: fragmentCount
  };
}

/**
 * Add map fragments
 */
export function addFragments(state, amount = 1) {
  const treasureState = getTreasureMapState(state);

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        mapFragments: treasureState.mapFragments + amount
      }
    },
    added: true,
    newTotal: treasureState.mapFragments + amount
  };
}

/**
 * Calculate treasure hunter level from experience
 */
export function calculateTreasureHunterLevel(experience) {
  let level = 1;
  let requiredExp = 0;

  while (experience >= requiredExp + level * 100) {
    requiredExp += level * 100;
    level++;
    if (level >= 30) break;
  }

  return level;
}

/**
 * Get treasure hunting statistics
 */
export function getTreasureStats(state) {
  const treasureState = getTreasureMapState(state);

  const mapsByRarity = {};
  const mapsByRegion = {};
  let activeMaps = 0;

  for (const map of treasureState.ownedMaps) {
    if (!map.completed) activeMaps++;

    mapsByRarity[map.rarity] = (mapsByRarity[map.rarity] || 0) + 1;
    mapsByRegion[map.region] = (mapsByRegion[map.region] || 0) + 1;
  }

  return {
    level: treasureState.treasureHunterLevel,
    experience: treasureState.treasureHunterExp,
    totalMaps: treasureState.ownedMaps.length,
    activeMaps,
    completedMaps: treasureState.completedMaps,
    totalValue: treasureState.totalTreasureValue,
    legendaryFound: treasureState.legendaryMapsFound,
    fragments: treasureState.mapFragments,
    mapsByRarity,
    mapsByRegion,
    currentHunt: treasureState.currentHunt
  };
}

/**
 * Get available maps (not completed)
 */
export function getAvailableMaps(state) {
  const treasureState = getTreasureMapState(state);

  return treasureState.ownedMaps
    .filter(m => !m.completed)
    .map(map => ({
      ...map,
      rarityData: MAP_RARITIES[map.rarity.toUpperCase()],
      regionData: MAP_REGIONS[map.region.toUpperCase()],
      treasureData: TREASURE_TYPES[map.treasureType.toUpperCase()],
      puzzleData: PUZZLE_TYPES[map.puzzle.toUpperCase()]
    }));
}

/**
 * Get completed maps history
 */
export function getCompletedMaps(state) {
  const treasureState = getTreasureMapState(state);

  return treasureState.ownedMaps
    .filter(m => m.completed)
    .map(map => ({
      ...map,
      rarityData: MAP_RARITIES[map.rarity.toUpperCase()],
      regionData: MAP_REGIONS[map.region.toUpperCase()],
      treasureData: TREASURE_TYPES[map.treasureType.toUpperCase()]
    }));
}

/**
 * Discover a location from a map
 */
export function discoverLocation(state, locationId) {
  const treasureState = getTreasureMapState(state);

  if (treasureState.discoveredLocations.includes(locationId)) {
    return { state, discovered: false, alreadyKnown: true };
  }

  return {
    state: {
      ...state,
      treasureMaps: {
        ...treasureState,
        discoveredLocations: [...treasureState.discoveredLocations, locationId]
      }
    },
    discovered: true
  };
}

/**
 * Get current hunt info
 */
export function getCurrentHunt(state) {
  const treasureState = getTreasureMapState(state);

  if (!treasureState.currentHunt) {
    return { active: false };
  }

  const map = treasureState.ownedMaps.find(m => m.id === treasureState.currentHunt.mapId);
  if (!map) {
    return { active: false };
  }

  return {
    active: true,
    map,
    hunt: treasureState.currentHunt,
    rarityData: MAP_RARITIES[map.rarity.toUpperCase()],
    regionData: MAP_REGIONS[map.region.toUpperCase()],
    treasureData: TREASURE_TYPES[map.treasureType.toUpperCase()],
    puzzleData: PUZZLE_TYPES[map.puzzle.toUpperCase()]
  };
}
