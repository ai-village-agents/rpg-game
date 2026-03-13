/**
 * Fishing System Tests
 * Comprehensive tests for fishing mini-game mechanics
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
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
} from '../src/fishing-system.js';

import {
  renderFishingPanel,
  renderLocationInfo,
  renderFishingControls,
  renderBaitSelector,
  renderCatchResult,
  renderFishInventory,
  renderFishCollection,
  renderRodInventory,
  renderLocationSelector,
  renderFishingStatsSummary,
  renderAchievementUnlocked,
  renderFishingMiniGame,
  renderBaitShop,
  getBaitPrice,
  RARITY_COLORS,
  LOCATION_ICONS,
  WEATHER_ICONS,
  TIME_ICONS
} from '../src/fishing-system-ui.js';

// ==================== Constants Tests ====================

describe('Fish Rarity', () => {
  it('should have all expected rarities', () => {
    assert.strictEqual(FISH_RARITY.COMMON, 'common');
    assert.strictEqual(FISH_RARITY.UNCOMMON, 'uncommon');
    assert.strictEqual(FISH_RARITY.RARE, 'rare');
    assert.strictEqual(FISH_RARITY.EPIC, 'epic');
    assert.strictEqual(FISH_RARITY.LEGENDARY, 'legendary');
  });

  it('should have 5 rarity levels', () => {
    assert.strictEqual(Object.keys(FISH_RARITY).length, 5);
  });
});

describe('Fishing Locations', () => {
  it('should have all expected locations', () => {
    assert.strictEqual(FISHING_LOCATION.POND, 'pond');
    assert.strictEqual(FISHING_LOCATION.RIVER, 'river');
    assert.strictEqual(FISHING_LOCATION.LAKE, 'lake');
    assert.strictEqual(FISHING_LOCATION.OCEAN, 'ocean');
    assert.strictEqual(FISHING_LOCATION.SWAMP, 'swamp');
    assert.strictEqual(FISHING_LOCATION.UNDERGROUND, 'underground');
    assert.strictEqual(FISHING_LOCATION.LAVA, 'lava');
    assert.strictEqual(FISHING_LOCATION.MAGIC_SPRING, 'magic_spring');
  });

  it('should have 8 locations', () => {
    assert.strictEqual(Object.keys(FISHING_LOCATION).length, 8);
  });
});

describe('Weather Types', () => {
  it('should have all weather types', () => {
    assert.strictEqual(WEATHER.SUNNY, 'sunny');
    assert.strictEqual(WEATHER.CLOUDY, 'cloudy');
    assert.strictEqual(WEATHER.RAINY, 'rainy');
    assert.strictEqual(WEATHER.STORMY, 'stormy');
    assert.strictEqual(WEATHER.FOGGY, 'foggy');
  });

  it('should have weather effects for each type', () => {
    Object.values(WEATHER).forEach(weather => {
      assert.ok(WEATHER_EFFECTS[weather], `Missing weather effect for ${weather}`);
    });
  });
});

describe('Time of Day', () => {
  it('should have all time periods', () => {
    assert.strictEqual(TIME_OF_DAY.DAWN, 'dawn');
    assert.strictEqual(TIME_OF_DAY.DAY, 'day');
    assert.strictEqual(TIME_OF_DAY.DUSK, 'dusk');
    assert.strictEqual(TIME_OF_DAY.NIGHT, 'night');
  });

  it('should have time effects for each period', () => {
    Object.values(TIME_OF_DAY).forEach(time => {
      assert.ok(TIME_EFFECTS[time], `Missing time effect for ${time}`);
    });
  });
});

describe('Bait Types', () => {
  it('should have all bait types', () => {
    assert.strictEqual(BAIT_TYPE.WORM, 'worm');
    assert.strictEqual(BAIT_TYPE.INSECT, 'insect');
    assert.strictEqual(BAIT_TYPE.MINNOW, 'minnow');
    assert.strictEqual(BAIT_TYPE.SHRIMP, 'shrimp');
    assert.strictEqual(BAIT_TYPE.MAGIC_LURE, 'magic_lure');
    assert.strictEqual(BAIT_TYPE.GOLDEN_LURE, 'golden_lure');
  });

  it('should have stats for each bait type', () => {
    Object.values(BAIT_TYPE).forEach(bait => {
      assert.ok(BAIT_STATS[bait], `Missing stats for bait ${bait}`);
    });
  });

  it('should have increasing bonuses for better bait', () => {
    assert.ok(BAIT_STATS[BAIT_TYPE.GOLDEN_LURE].catchBonus > BAIT_STATS[BAIT_TYPE.WORM].catchBonus);
  });
});

describe('Rod Types', () => {
  it('should have all rod types', () => {
    assert.strictEqual(ROD_TYPE.BASIC, 'basic');
    assert.strictEqual(ROD_TYPE.WOODEN, 'wooden');
    assert.strictEqual(ROD_TYPE.IRON, 'iron');
    assert.strictEqual(ROD_TYPE.STEEL, 'steel');
    assert.strictEqual(ROD_TYPE.MITHRIL, 'mithril');
    assert.strictEqual(ROD_TYPE.ENCHANTED, 'enchanted');
    assert.strictEqual(ROD_TYPE.LEGENDARY, 'legendary');
  });

  it('should have stats for each rod type', () => {
    Object.values(ROD_TYPE).forEach(rod => {
      assert.ok(ROD_STATS[rod], `Missing stats for rod ${rod}`);
    });
  });

  it('should have legendary rod with infinite durability', () => {
    assert.strictEqual(ROD_STATS[ROD_TYPE.LEGENDARY].durability, Infinity);
  });
});

describe('Fish Data', () => {
  it('should have fish defined', () => {
    assert.ok(Object.keys(FISH_DATA).length > 0);
  });

  it('should have valid fish properties', () => {
    Object.entries(FISH_DATA).forEach(([id, fish]) => {
      assert.ok(fish.name, `Fish ${id} missing name`);
      assert.ok(fish.rarity, `Fish ${id} missing rarity`);
      assert.ok(Array.isArray(fish.locations), `Fish ${id} missing locations`);
      assert.ok(fish.baseValue > 0, `Fish ${id} missing baseValue`);
      assert.ok(fish.minSize > 0, `Fish ${id} missing minSize`);
      assert.ok(fish.maxSize >= fish.minSize, `Fish ${id} invalid size range`);
    });
  });

  it('should have legendary fish', () => {
    const legendaryFish = Object.values(FISH_DATA).filter(f => f.rarity === FISH_RARITY.LEGENDARY);
    assert.ok(legendaryFish.length > 0);
  });

  it('should have fish for each location', () => {
    Object.values(FISHING_LOCATION).forEach(location => {
      const fishAtLocation = Object.values(FISH_DATA).filter(f => f.locations.includes(location));
      assert.ok(fishAtLocation.length > 0, `No fish at location ${location}`);
    });
  });
});

describe('Rarity Weights', () => {
  it('should have weights for all rarities', () => {
    Object.values(FISH_RARITY).forEach(rarity => {
      assert.ok(RARITY_WEIGHTS[rarity] !== undefined, `Missing weight for ${rarity}`);
    });
  });

  it('should have decreasing weights for rarer fish', () => {
    assert.ok(RARITY_WEIGHTS[FISH_RARITY.COMMON] > RARITY_WEIGHTS[FISH_RARITY.UNCOMMON]);
    assert.ok(RARITY_WEIGHTS[FISH_RARITY.UNCOMMON] > RARITY_WEIGHTS[FISH_RARITY.RARE]);
    assert.ok(RARITY_WEIGHTS[FISH_RARITY.RARE] > RARITY_WEIGHTS[FISH_RARITY.EPIC]);
    assert.ok(RARITY_WEIGHTS[FISH_RARITY.EPIC] > RARITY_WEIGHTS[FISH_RARITY.LEGENDARY]);
  });
});

// ==================== State Creation Tests ====================

describe('createFishingState', () => {
  it('should create empty state', () => {
    const state = createFishingState();
    assert.strictEqual(state.currentRod, null);
    assert.deepStrictEqual(state.inventory.bait, {});
    assert.deepStrictEqual(state.inventory.rods, {});
    assert.deepStrictEqual(state.inventory.fish, {});
  });

  it('should start with pond unlocked', () => {
    const state = createFishingState();
    assert.ok(state.unlockedLocations.includes(FISHING_LOCATION.POND));
    assert.strictEqual(state.unlockedLocations.length, 1);
  });

  it('should start at skill level 1', () => {
    const state = createFishingState();
    assert.strictEqual(state.skills.level, 1);
    assert.strictEqual(state.skills.xp, 0);
  });

  it('should start with empty stats', () => {
    const state = createFishingState();
    assert.strictEqual(state.stats.totalCatches, 0);
    assert.strictEqual(state.stats.largestCatch, null);
    assert.strictEqual(state.stats.rarestCatch, null);
  });

  it('should start with empty achievements', () => {
    const state = createFishingState();
    assert.deepStrictEqual(state.achievements, []);
  });
});

describe('getXpForLevel', () => {
  it('should return base XP for level 2', () => {
    const xp = getXpForLevel(2);
    assert.ok(xp >= 50 && xp <= 70);
  });

  it('should increase with level', () => {
    assert.ok(getXpForLevel(3) > getXpForLevel(2));
    assert.ok(getXpForLevel(5) > getXpForLevel(4));
  });
});

// ==================== Bait Tests ====================

describe('addBait', () => {
  it('should add bait to empty inventory', () => {
    const state = createFishingState();
    const result = addBait(state, BAIT_TYPE.WORM, 10);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.inventory.bait[BAIT_TYPE.WORM], 10);
  });

  it('should stack bait', () => {
    let state = createFishingState();
    state = addBait(state, BAIT_TYPE.WORM, 5).state;
    const result = addBait(state, BAIT_TYPE.WORM, 5);

    assert.strictEqual(result.state.inventory.bait[BAIT_TYPE.WORM], 10);
  });

  it('should fail for invalid bait type', () => {
    const state = createFishingState();
    const result = addBait(state, 'invalid_bait', 10);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid bait type');
  });
});

// ==================== Rod Tests ====================

describe('addRod', () => {
  it('should add rod to inventory', () => {
    const state = createFishingState();
    const result = addRod(state, ROD_TYPE.BASIC);

    assert.strictEqual(result.success, true);
    assert.ok(result.rod);
    assert.strictEqual(result.rod.type, ROD_TYPE.BASIC);
  });

  it('should create rod with full durability', () => {
    const state = createFishingState();
    const result = addRod(state, ROD_TYPE.IRON);
    const rodStats = ROD_STATS[ROD_TYPE.IRON];

    assert.strictEqual(result.rod.currentDurability, rodStats.durability);
    assert.strictEqual(result.rod.maxDurability, rodStats.durability);
  });

  it('should fail for invalid rod type', () => {
    const state = createFishingState();
    const result = addRod(state, 'invalid_rod');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid rod type');
  });

  it('should create unique rod IDs', () => {
    const state = createFishingState();
    const result1 = addRod(state, ROD_TYPE.BASIC);
    const result2 = addRod(result1.state, ROD_TYPE.BASIC);

    assert.notStrictEqual(result1.rod.id, result2.rod.id);
  });
});

describe('equipRod', () => {
  it('should equip rod', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.WOODEN);
    state = addResult.state;

    const result = equipRod(state, addResult.rod.id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.currentRod, addResult.rod.id);
  });

  it('should fail for non-existent rod', () => {
    const state = createFishingState();
    const result = equipRod(state, 'fake_id');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Rod not found');
  });

  it('should fail for broken rod', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.BASIC);
    state = addResult.state;

    // Break the rod
    state.inventory.rods[addResult.rod.id].currentDurability = 0;

    const result = equipRod(state, addResult.rod.id);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Rod is broken');
  });
});

// ==================== Location Tests ====================

describe('unlockLocation', () => {
  it('should unlock new location', () => {
    const state = createFishingState();
    const result = unlockLocation(state, FISHING_LOCATION.RIVER);

    assert.strictEqual(result.success, true);
    assert.ok(result.state.unlockedLocations.includes(FISHING_LOCATION.RIVER));
  });

  it('should fail for invalid location', () => {
    const state = createFishingState();
    const result = unlockLocation(state, 'invalid_location');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid location');
  });

  it('should fail for already unlocked location', () => {
    const state = createFishingState();
    const result = unlockLocation(state, FISHING_LOCATION.POND);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Location already unlocked');
  });
});

describe('getAvailableFish', () => {
  it('should return fish for pond', () => {
    const fish = getAvailableFish(FISHING_LOCATION.POND);
    assert.ok(fish.length > 0);
    fish.forEach(f => {
      assert.ok(f.locations.includes(FISHING_LOCATION.POND));
    });
  });

  it('should return different fish for different locations', () => {
    const pondFish = getAvailableFish(FISHING_LOCATION.POND);
    const oceanFish = getAvailableFish(FISHING_LOCATION.OCEAN);

    const pondIds = pondFish.map(f => f.id);
    const oceanIds = oceanFish.map(f => f.id);

    // At least some fish should be different
    const uniqueToOcean = oceanIds.filter(id => !pondIds.includes(id));
    assert.ok(uniqueToOcean.length > 0);
  });
});

// ==================== Catch Chance Tests ====================

describe('calculateCatchChance', () => {
  it('should return base chance without rod', () => {
    const state = createFishingState();
    const chance = calculateCatchChance(state, WEATHER.SUNNY, TIME_OF_DAY.DAY);
    assert.ok(chance > 0 && chance <= 1);
  });

  it('should increase with better rod', () => {
    let state = createFishingState();
    const baseChance = calculateCatchChance(state, WEATHER.SUNNY, TIME_OF_DAY.DAY);

    const addResult = addRod(state, ROD_TYPE.ENCHANTED);
    state = equipRod(addResult.state, addResult.rod.id).state;

    const rodChance = calculateCatchChance(state, WEATHER.SUNNY, TIME_OF_DAY.DAY);
    assert.ok(rodChance > baseChance);
  });

  it('should be affected by weather', () => {
    const state = createFishingState();
    const sunnyChance = calculateCatchChance(state, WEATHER.SUNNY, TIME_OF_DAY.DAY);
    const rainyChance = calculateCatchChance(state, WEATHER.RAINY, TIME_OF_DAY.DAY);

    assert.ok(rainyChance > sunnyChance);
  });

  it('should be affected by time of day', () => {
    const state = createFishingState();
    const dayChance = calculateCatchChance(state, WEATHER.SUNNY, TIME_OF_DAY.DAY);
    const dawnChance = calculateCatchChance(state, WEATHER.SUNNY, TIME_OF_DAY.DAWN);

    assert.ok(dawnChance > dayChance);
  });

  it('should cap at 95%', () => {
    let state = createFishingState();
    state.skills.level = 100; // Very high level

    const addResult = addRod(state, ROD_TYPE.LEGENDARY);
    state = equipRod(addResult.state, addResult.rod.id).state;

    const chance = calculateCatchChance(state, WEATHER.RAINY, TIME_OF_DAY.DAWN);
    assert.ok(chance <= 0.95);
  });
});

// ==================== Fishing Attempt Tests ====================

describe('attemptCatch', () => {
  it('should fail without rod', () => {
    let state = createFishingState();
    state = addBait(state, BAIT_TYPE.WORM, 10).state;

    const result = attemptCatch(state, FISHING_LOCATION.POND, BAIT_TYPE.WORM);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'No rod equipped');
  });

  it('should fail without bait', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.BASIC);
    state = equipRod(addResult.state, addResult.rod.id).state;

    const result = attemptCatch(state, FISHING_LOCATION.POND, BAIT_TYPE.WORM);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'No bait of that type');
  });

  it('should fail for locked location', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.BASIC);
    state = equipRod(addResult.state, addResult.rod.id).state;
    state = addBait(state, BAIT_TYPE.WORM, 10).state;

    const result = attemptCatch(state, FISHING_LOCATION.OCEAN, BAIT_TYPE.WORM);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Location not unlocked');
  });

  it('should consume bait on attempt', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.LEGENDARY); // Won't break
    state = equipRod(addResult.state, addResult.rod.id).state;
    state = addBait(state, BAIT_TYPE.WORM, 5).state;

    const result = attemptCatch(state, FISHING_LOCATION.POND, BAIT_TYPE.WORM);

    assert.strictEqual(result.state.inventory.bait[BAIT_TYPE.WORM], 4);
  });

  it('should reduce rod durability', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.BASIC);
    state = equipRod(addResult.state, addResult.rod.id).state;
    state = addBait(state, BAIT_TYPE.WORM, 10).state;

    const initialDurability = state.inventory.rods[addResult.rod.id].currentDurability;
    const result = attemptCatch(state, FISHING_LOCATION.POND, BAIT_TYPE.WORM);

    const newDurability = result.state.inventory.rods[addResult.rod.id].currentDurability;
    assert.strictEqual(newDurability, initialDurability - 1);
  });

  it('should not reduce legendary rod durability', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.LEGENDARY);
    state = equipRod(addResult.state, addResult.rod.id).state;
    state = addBait(state, BAIT_TYPE.WORM, 10).state;

    const result = attemptCatch(state, FISHING_LOCATION.POND, BAIT_TYPE.WORM);

    assert.strictEqual(
      result.state.inventory.rods[addResult.rod.id].currentDurability,
      Infinity
    );
  });
});

// ==================== Sell Fish Tests ====================

describe('sellFish', () => {
  it('should fail for non-existent fish', () => {
    const state = createFishingState();
    const result = sellFish(state, 'goldfish');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Fish not found in inventory');
  });

  it('should fail for invalid index', () => {
    let state = createFishingState();
    state.inventory.fish.goldfish = [{ id: 'goldfish', value: 10 }];

    const result = sellFish(state, 'goldfish', 5);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid fish index');
  });

  it('should return gold for sold fish', () => {
    let state = createFishingState();
    state.inventory.fish.goldfish = [
      { id: 'goldfish', name: 'Goldfish', value: 15 }
    ];

    const result = sellFish(state, 'goldfish', 0);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.goldEarned, 15);
  });

  it('should remove fish from inventory', () => {
    let state = createFishingState();
    state.inventory.fish.goldfish = [
      { id: 'goldfish', name: 'Goldfish', value: 10 }
    ];

    const result = sellFish(state, 'goldfish', 0);

    assert.strictEqual(result.state.inventory.fish.goldfish.length, 0);
  });
});

describe('sellAllFishOfType', () => {
  it('should sell all fish of a type', () => {
    let state = createFishingState();
    state.inventory.fish.goldfish = [
      { id: 'goldfish', value: 10 },
      { id: 'goldfish', value: 12 },
      { id: 'goldfish', value: 8 }
    ];

    const result = sellAllFishOfType(state, 'goldfish');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.goldEarned, 30);
    assert.strictEqual(result.fishSold, 3);
    assert.strictEqual(result.state.inventory.fish.goldfish.length, 0);
  });

  it('should fail for empty fish type', () => {
    const state = createFishingState();
    const result = sellAllFishOfType(state, 'trout');

    assert.strictEqual(result.success, false);
  });
});

// ==================== Stats Tests ====================

describe('getFishingStats', () => {
  it('should return initial stats', () => {
    const state = createFishingState();
    const stats = getFishingStats(state);

    assert.strictEqual(stats.totalCatches, 0);
    assert.strictEqual(stats.totalFish, 0);
    assert.strictEqual(stats.uniqueSpecies, 0);
    assert.ok(stats.totalSpecies > 0);
  });

  it('should calculate completion percent', () => {
    let state = createFishingState();
    state.stats.fishCaught = {
      goldfish: 5,
      trout: 3
    };

    const stats = getFishingStats(state);

    assert.ok(stats.completionPercent > 0);
    assert.strictEqual(stats.uniqueSpecies, 2);
  });
});

describe('getFishCollection', () => {
  it('should return all fish species', () => {
    const state = createFishingState();
    const collection = getFishCollection(state);

    const totalFishSpecies = Object.keys(FISH_DATA).length;
    assert.strictEqual(Object.keys(collection).length, totalFishSpecies);
  });

  it('should mark uncaught fish as undiscovered', () => {
    const state = createFishingState();
    const collection = getFishCollection(state);

    Object.values(collection).forEach(fish => {
      assert.strictEqual(fish.discovered, false);
    });
  });

  it('should mark caught fish as discovered', () => {
    let state = createFishingState();
    state.stats.fishCaught = { goldfish: 2 };

    const collection = getFishCollection(state);

    assert.strictEqual(collection.goldfish.discovered, true);
    assert.strictEqual(collection.goldfish.caught, 2);
  });
});

// ==================== Repair Tests ====================

describe('repairRod', () => {
  it('should repair damaged rod', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.IRON);
    state = addResult.state;

    // Damage the rod
    state.inventory.rods[addResult.rod.id].currentDurability = 50;

    const result = repairRod(state, addResult.rod.id, 100);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newDurability, 150);
  });

  it('should cap at max durability', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.BASIC);
    state = addResult.state;
    const maxDur = ROD_STATS[ROD_TYPE.BASIC].durability;

    state.inventory.rods[addResult.rod.id].currentDurability = maxDur - 10;

    const result = repairRod(state, addResult.rod.id, 50);

    assert.strictEqual(result.newDurability, maxDur);
  });

  it('should fail for non-existent rod', () => {
    const state = createFishingState();
    const result = repairRod(state, 'fake_id', 50);

    assert.strictEqual(result.success, false);
  });

  it('should fail for legendary rod', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.LEGENDARY);
    state = addResult.state;

    const result = repairRod(state, addResult.rod.id, 50);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('never breaks'));
  });
});

// ==================== Achievement Tests ====================

describe('checkAchievements', () => {
  it('should return first catch achievement', () => {
    let state = createFishingState();
    state.stats.totalCatches = 1;

    const achievements = checkAchievements(state);

    assert.ok(achievements.some(a => a.id === 'first_catch'));
  });

  it('should return century angler achievement', () => {
    let state = createFishingState();
    state.stats.totalCatches = 100;

    const achievements = checkAchievements(state);

    assert.ok(achievements.some(a => a.id === 'century_angler'));
  });

  it('should not return already earned achievements', () => {
    let state = createFishingState();
    state.stats.totalCatches = 1;
    state.achievements = ['first_catch'];

    const achievements = checkAchievements(state);

    assert.ok(!achievements.some(a => a.id === 'first_catch'));
  });
});

describe('awardAchievements', () => {
  it('should add achievements to state', () => {
    const state = createFishingState();
    const achievements = [
      { id: 'first_catch', name: 'First Catch' }
    ];

    const newState = awardAchievements(state, achievements);

    assert.ok(newState.achievements.includes('first_catch'));
  });

  it('should preserve existing achievements', () => {
    let state = createFishingState();
    state.achievements = ['existing'];

    const achievements = [{ id: 'new', name: 'New' }];
    const newState = awardAchievements(state, achievements);

    assert.ok(newState.achievements.includes('existing'));
    assert.ok(newState.achievements.includes('new'));
  });
});

// ==================== UI Tests ====================

describe('renderFishingPanel', () => {
  it('should render fishing panel', () => {
    const state = createFishingState();
    const html = renderFishingPanel(state, FISHING_LOCATION.POND, WEATHER.SUNNY, TIME_OF_DAY.DAY);

    assert.ok(html.includes('fishing-panel'));
    assert.ok(html.includes('Fishing'));
  });

  it('should show weather and time', () => {
    const state = createFishingState();
    const html = renderFishingPanel(state, FISHING_LOCATION.POND, WEATHER.RAINY, TIME_OF_DAY.NIGHT);

    assert.ok(html.includes('rainy'));
    assert.ok(html.includes('night'));
  });
});

describe('renderLocationInfo', () => {
  it('should show unlocked location', () => {
    const state = createFishingState();
    const html = renderLocationInfo(FISHING_LOCATION.POND, state);

    assert.ok(!html.includes('locked'));
    assert.ok(html.includes('species available'));
  });

  it('should show locked location', () => {
    const state = createFishingState();
    const html = renderLocationInfo(FISHING_LOCATION.OCEAN, state);

    assert.ok(html.includes('locked'));
  });
});

describe('renderCatchResult', () => {
  it('should render miss result', () => {
    const result = { caught: false };
    const html = renderCatchResult(result);

    assert.ok(html.includes('miss'));
    assert.ok(html.includes('got away'));
  });

  it('should render catch result', () => {
    const result = {
      caught: true,
      fish: {
        id: 'goldfish',
        name: 'Goldfish',
        rarity: FISH_RARITY.COMMON,
        size: 10,
        value: 15
      },
      xpGained: 10,
      leveledUp: false
    };

    const html = renderCatchResult(result);

    assert.ok(html.includes('success'));
    assert.ok(html.includes('Goldfish'));
    assert.ok(html.includes('10 cm'));
    assert.ok(html.includes('15 gold'));
  });

  it('should show level up', () => {
    const result = {
      caught: true,
      fish: {
        id: 'goldfish',
        name: 'Goldfish',
        rarity: FISH_RARITY.COMMON,
        size: 10,
        value: 15
      },
      xpGained: 10,
      leveledUp: true,
      newLevel: 5
    };

    const html = renderCatchResult(result);

    assert.ok(html.includes('Level Up'));
    assert.ok(html.includes('5'));
  });
});

describe('renderFishInventory', () => {
  it('should show empty message', () => {
    const state = createFishingState();
    const html = renderFishInventory(state);

    assert.ok(html.includes('empty'));
    assert.ok(html.includes('No fish'));
  });

  it('should show fish in inventory', () => {
    let state = createFishingState();
    state.inventory.fish = {
      goldfish: [
        { id: 'goldfish', name: 'Goldfish', value: 10 },
        { id: 'goldfish', name: 'Goldfish', value: 12 }
      ]
    };

    const html = renderFishInventory(state);

    assert.ok(html.includes('Goldfish'));
    assert.ok(html.includes('x2'));
  });
});

describe('renderFishCollection', () => {
  it('should render collection', () => {
    const state = createFishingState();
    const html = renderFishCollection(state);

    assert.ok(html.includes('Fish Encyclopedia'));
    assert.ok(html.includes('collection-grid'));
  });

  it('should show undiscovered fish', () => {
    const state = createFishingState();
    const html = renderFishCollection(state);

    assert.ok(html.includes('undiscovered'));
    assert.ok(html.includes('???'));
  });
});

describe('renderRodInventory', () => {
  it('should show empty message', () => {
    const state = createFishingState();
    const html = renderRodInventory(state);

    assert.ok(html.includes('empty'));
    assert.ok(html.includes('No fishing rods'));
  });

  it('should show rods', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.IRON);
    state = addResult.state;

    const html = renderRodInventory(state);

    assert.ok(html.includes('iron'));
    assert.ok(html.includes('Rod'));
  });

  it('should show equipped rod', () => {
    let state = createFishingState();
    const addResult = addRod(state, ROD_TYPE.STEEL);
    state = equipRod(addResult.state, addResult.rod.id).state;

    const html = renderRodInventory(state);

    assert.ok(html.includes('equipped'));
    assert.ok(html.includes('Equipped'));
  });
});

describe('renderLocationSelector', () => {
  it('should render all locations', () => {
    const state = createFishingState();
    const html = renderLocationSelector(state);

    assert.ok(html.includes('Fishing Locations'));
    assert.ok(html.includes('pond'));
    assert.ok(html.includes('ocean'));
  });
});

describe('renderFishingStatsSummary', () => {
  it('should render stats', () => {
    const state = createFishingState();
    const html = renderFishingStatsSummary(state);

    assert.ok(html.includes('Fishing Stats'));
    assert.ok(html.includes('Total Catches'));
    assert.ok(html.includes('Species Found'));
  });
});

describe('renderAchievementUnlocked', () => {
  it('should render achievement', () => {
    const achievement = {
      id: 'first_catch',
      name: 'First Catch',
      description: 'Catch your first fish'
    };

    const html = renderAchievementUnlocked(achievement);

    assert.ok(html.includes('achievement-unlocked'));
    assert.ok(html.includes('First Catch'));
    assert.ok(html.includes('Catch your first fish'));
  });
});

describe('renderFishingMiniGame', () => {
  it('should render mini-game', () => {
    const html = renderFishingMiniGame(1);

    assert.ok(html.includes('fishing-mini-game'));
    assert.ok(html.includes('Reel it in'));
    assert.ok(html.includes('target-zone'));
  });
});

describe('renderBaitShop', () => {
  it('should render bait shop', () => {
    const html = renderBaitShop();

    assert.ok(html.includes('bait-shop'));
    assert.ok(html.includes('Bait Shop'));
    assert.ok(html.includes('worm'));
  });
});

describe('getBaitPrice', () => {
  it('should return prices for all bait types', () => {
    Object.values(BAIT_TYPE).forEach(bait => {
      const price = getBaitPrice(bait);
      assert.ok(price > 0);
    });
  });

  it('should have increasing prices for better bait', () => {
    assert.ok(getBaitPrice(BAIT_TYPE.GOLDEN_LURE) > getBaitPrice(BAIT_TYPE.WORM));
  });
});

describe('UI Constants', () => {
  it('should have rarity colors', () => {
    Object.values(FISH_RARITY).forEach(rarity => {
      assert.ok(RARITY_COLORS[rarity]);
    });
  });

  it('should have location icons', () => {
    Object.values(FISHING_LOCATION).forEach(location => {
      assert.ok(LOCATION_ICONS[location]);
    });
  });

  it('should have weather icons', () => {
    Object.values(WEATHER).forEach(weather => {
      assert.ok(WEATHER_ICONS[weather]);
    });
  });

  it('should have time icons', () => {
    Object.values(TIME_OF_DAY).forEach(time => {
      assert.ok(TIME_ICONS[time]);
    });
  });
});
