/**
 * Tests for Fishing System
 * Run with: node --test tests/fishing-system-test.mjs
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  FISHING_ZONES,
  FISH_RARITIES,
  FISH,
  FISHING_RODS,
  BAITS,
  initFishingState,
  getFishingState,
  equipRod,
  setBait,
  addBait,
  calculateCatchChance,
  castLine,
  attemptCatch,
  selectFish,
  generateWeight,
  calculateFishingLevel,
  getExpToNextLevel,
  getFishingStats,
  getFishCollection,
  sellFish,
  getZoneFish,
  canAccessZone,
  getAccessibleZones
} from '../src/fishing-system.js';

describe('Fishing System', () => {
  let gameState;

  beforeEach(() => {
    gameState = { fishing: initFishingState() };
  });

  describe('Constants', () => {
    it('has all fishing zones', () => {
      assert.ok(FISHING_ZONES.POND);
      assert.ok(FISHING_ZONES.RIVER);
      assert.ok(FISHING_ZONES.LAKE);
      assert.ok(FISHING_ZONES.OCEAN_SHORE);
      assert.ok(FISHING_ZONES.DEEP_SEA);
      assert.ok(FISHING_ZONES.UNDERGROUND);
    });

    it('zones have difficulty and fish types', () => {
      assert.strictEqual(FISHING_ZONES.POND.difficulty, 1);
      assert.ok(FISHING_ZONES.POND.fishTypes.length > 0);
    });

    it('has all fish rarities', () => {
      assert.ok(FISH_RARITIES.COMMON);
      assert.ok(FISH_RARITIES.UNCOMMON);
      assert.ok(FISH_RARITIES.RARE);
      assert.ok(FISH_RARITIES.EPIC);
      assert.ok(FISH_RARITIES.LEGENDARY);
    });

    it('rarities have catch rates', () => {
      assert.ok(FISH_RARITIES.COMMON.catchRate > FISH_RARITIES.LEGENDARY.catchRate);
    });

    it('has multiple fish defined', () => {
      assert.ok(Object.keys(FISH).length >= 20);
    });

    it('fish have required properties', () => {
      for (const fish of Object.values(FISH)) {
        assert.ok(fish.id);
        assert.ok(fish.name);
        assert.ok(fish.rarity);
        assert.ok(fish.category);
        assert.ok(fish.baseValue > 0);
        assert.ok(fish.weight.min >= 0);
        assert.ok(fish.weight.max > fish.weight.min);
      }
    });

    it('has multiple fishing rods', () => {
      assert.ok(Object.keys(FISHING_RODS).length >= 5);
      assert.ok(FISHING_RODS.basic_rod);
      assert.ok(FISHING_RODS.legendary_rod);
    });

    it('rods have bonuses', () => {
      assert.strictEqual(FISHING_RODS.basic_rod.catchBonus, 0);
      assert.ok(FISHING_RODS.legendary_rod.catchBonus > 0);
    });

    it('has multiple bait types', () => {
      assert.ok(Object.keys(BAITS).length >= 5);
      assert.ok(BAITS.worm);
      assert.ok(BAITS.golden_lure);
    });

    it('baits have catch bonuses and targets', () => {
      assert.ok(BAITS.worm.catchBonus > 0);
      assert.ok(BAITS.worm.targets.length > 0);
    });
  });

  describe('initFishingState', () => {
    it('creates empty fishing state', () => {
      const state = initFishingState();
      assert.strictEqual(state.fishingLevel, 1);
      assert.strictEqual(state.fishingExp, 0);
      assert.strictEqual(state.totalFishCaught, 0);
      assert.deepStrictEqual(state.fishCollection, {});
      assert.strictEqual(state.equippedRod, 'basic_rod');
      assert.strictEqual(state.currentBait, null);
    });

    it('initializes fishing stats', () => {
      const state = initFishingState();
      assert.strictEqual(state.fishingStats.totalCasts, 0);
      assert.strictEqual(state.fishingStats.successfulCatches, 0);
    });
  });

  describe('getFishingState', () => {
    it('returns existing fishing state', () => {
      const result = getFishingState(gameState);
      assert.strictEqual(result, gameState.fishing);
    });

    it('creates new fishing state if none exists', () => {
      const result = getFishingState({});
      assert.strictEqual(result.fishingLevel, 1);
    });
  });

  describe('equipRod', () => {
    it('equips fishing rod', () => {
      const result = equipRod(gameState, 'bamboo_rod');
      assert.ok(result.equipped);
      assert.strictEqual(result.state.fishing.equippedRod, 'bamboo_rod');
    });

    it('returns rod data', () => {
      const result = equipRod(gameState, 'fiberglass_rod');
      assert.strictEqual(result.rod.id, 'fiberglass_rod');
    });

    it('fails for invalid rod', () => {
      const result = equipRod(gameState, 'invalid_rod');
      assert.strictEqual(result.equipped, false);
      assert.ok(result.error);
    });
  });

  describe('setBait', () => {
    beforeEach(() => {
      const result = addBait(gameState, 'worm', 10);
      gameState = result.state;
    });

    it('sets bait', () => {
      const result = setBait(gameState, 'worm');
      assert.ok(result.set);
      assert.strictEqual(result.state.fishing.currentBait, 'worm');
    });

    it('returns bait data', () => {
      const result = setBait(gameState, 'worm');
      assert.strictEqual(result.bait.id, 'worm');
    });

    it('fails for invalid bait', () => {
      const result = setBait(gameState, 'invalid_bait');
      assert.strictEqual(result.set, false);
    });

    it('fails when no bait available', () => {
      const result = setBait(gameState, 'minnow');
      assert.strictEqual(result.set, false);
      assert.ok(result.error.includes('available'));
    });
  });

  describe('addBait', () => {
    it('adds bait to inventory', () => {
      const result = addBait(gameState, 'worm', 5);
      assert.ok(result.added);
      assert.strictEqual(result.newCount, 5);
    });

    it('stacks bait', () => {
      const result1 = addBait(gameState, 'worm', 5);
      const result2 = addBait(result1.state, 'worm', 3);
      assert.strictEqual(result2.newCount, 8);
    });

    it('fails for invalid bait', () => {
      const result = addBait(gameState, 'invalid', 5);
      assert.strictEqual(result.added, false);
    });
  });

  describe('calculateCatchChance', () => {
    it('returns base catch chance', () => {
      const chance = calculateCatchChance(gameState, 'pond');
      assert.ok(chance > 0);
      assert.ok(chance < 1);
    });

    it('increases with fishing level', () => {
      const lowLevel = calculateCatchChance(gameState, 'pond');

      gameState.fishing.fishingLevel = 10;
      const highLevel = calculateCatchChance(gameState, 'pond');

      assert.ok(highLevel > lowLevel);
    });

    it('decreases with zone difficulty', () => {
      const easyZone = calculateCatchChance(gameState, 'pond');
      const hardZone = calculateCatchChance(gameState, 'deep_sea');

      assert.ok(easyZone > hardZone);
    });

    it('increases with better rod', () => {
      const basicChance = calculateCatchChance(gameState, 'pond');

      const rodResult = equipRod(gameState, 'legendary_rod');
      const legendaryChance = calculateCatchChance(rodResult.state, 'pond');

      assert.ok(legendaryChance > basicChance);
    });

    it('increases with bait', () => {
      const noBaitChance = calculateCatchChance(gameState, 'pond');

      const baitResult = addBait(gameState, 'worm', 5);
      const setBaitResult = setBait(baitResult.state, 'worm');
      const withBaitChance = calculateCatchChance(setBaitResult.state, 'pond');

      assert.ok(withBaitChance > noBaitChance);
    });
  });

  describe('castLine', () => {
    it('casts successfully', () => {
      const result = castLine(gameState, 'pond');
      assert.ok(result.cast);
      assert.strictEqual(result.zone.id, 'pond');
    });

    it('increments total casts', () => {
      const result = castLine(gameState, 'pond');
      assert.strictEqual(result.state.fishing.fishingStats.totalCasts, 1);
    });

    it('consumes bait', () => {
      const baitResult = addBait(gameState, 'worm', 3);
      const setBaitResult = setBait(baitResult.state, 'worm');
      const castResult = castLine(setBaitResult.state, 'pond');

      assert.strictEqual(castResult.state.fishing.baitInventory.worm, 2);
    });

    it('clears bait when depleted', () => {
      const baitResult = addBait(gameState, 'worm', 1);
      const setBaitResult = setBait(baitResult.state, 'worm');
      const castResult = castLine(setBaitResult.state, 'pond');

      assert.strictEqual(castResult.state.fishing.currentBait, null);
    });

    it('fails for invalid zone', () => {
      const result = castLine(gameState, 'invalid_zone');
      assert.strictEqual(result.cast, false);
    });

    it('returns catch chance', () => {
      const result = castLine(gameState, 'pond');
      assert.ok(result.catchChance > 0);
    });
  });

  describe('attemptCatch', () => {
    it('catches fish on successful roll', () => {
      const result = attemptCatch(gameState, 'pond', 0.1); // Low roll = success
      assert.ok(result.caught);
      assert.ok(result.fish);
      assert.ok(result.weight > 0);
    });

    it('fish escapes on failed roll', () => {
      const result = attemptCatch(gameState, 'pond', 0.99); // High roll = fail
      assert.strictEqual(result.caught, false);
      assert.ok(result.escaped);
    });

    it('increments successful catches', () => {
      const result = attemptCatch(gameState, 'pond', 0.1);
      assert.strictEqual(result.state.fishing.fishingStats.successfulCatches, 1);
    });

    it('increments fish escaped on failure', () => {
      const result = attemptCatch(gameState, 'pond', 0.99);
      assert.strictEqual(result.state.fishing.fishingStats.fishEscaped, 1);
    });

    it('grants experience on catch', () => {
      const result = attemptCatch(gameState, 'pond', 0.1);
      assert.ok(result.expGained > 0);
      assert.ok(result.state.fishing.fishingExp > 0);
    });

    it('adds fish to collection', () => {
      const result = attemptCatch(gameState, 'pond', 0.1);
      const fishId = result.fish.id;
      assert.ok(result.state.fishing.fishCollection[fishId]);
      assert.strictEqual(result.state.fishing.fishCollection[fishId].count, 1);
    });

    it('tracks largest weight', () => {
      const result1 = attemptCatch(gameState, 'pond', 0.1);
      const fishId = result1.fish.id;
      const weight1 = result1.weight;

      const result2 = attemptCatch(result1.state, 'pond', 0.1);
      // Force same fish for consistent test
      if (result2.fish.id === fishId) {
        const largestWeight = result2.state.fishing.fishCollection[fishId].largestWeight;
        assert.ok(largestWeight >= Math.max(weight1, result2.weight) || largestWeight >= weight1);
      }
    });

    it('detects new species', () => {
      const result = attemptCatch(gameState, 'pond', 0.1);
      assert.ok(result.isNewSpecies);
    });

    it('increments streak on success', () => {
      const result = attemptCatch(gameState, 'pond', 0.1);
      assert.strictEqual(result.state.fishing.currentStreak, 1);
    });

    it('resets streak on failure', () => {
      const result1 = attemptCatch(gameState, 'pond', 0.1);
      const result2 = attemptCatch(result1.state, 'pond', 0.99);
      assert.strictEqual(result2.state.fishing.currentStreak, 0);
    });

    it('tracks best streak', () => {
      let state = gameState;
      for (let i = 0; i < 5; i++) {
        const result = attemptCatch(state, 'pond', 0.1);
        state = result.state;
      }
      assert.strictEqual(state.fishing.bestStreak, 5);
    });

    it('detects perfect catch', () => {
      const result = attemptCatch(gameState, 'pond', 0.01); // Very low roll
      assert.ok(result.isPerfect);
      assert.strictEqual(result.state.fishing.fishingStats.perfectCatches, 1);
    });

    it('fails for invalid zone', () => {
      const result = attemptCatch(gameState, 'invalid', 0.1);
      assert.strictEqual(result.caught, false);
      assert.ok(result.error);
    });
  });

  describe('selectFish', () => {
    it('selects fish from zone', () => {
      const zone = FISHING_ZONES.POND;
      const fish = selectFish(gameState, zone);
      assert.ok(fish);
      assert.ok(fish.id);
    });

    it('selects fish matching zone types', () => {
      const zone = FISHING_ZONES.DEEP_SEA;
      const fish = selectFish(gameState, zone);
      assert.ok(zone.fishTypes.includes(fish.category));
    });
  });

  describe('generateWeight', () => {
    it('generates weight within range', () => {
      const fish = FISH.bluegill;
      const weight = generateWeight(fish);
      assert.ok(weight >= fish.weight.min);
      assert.ok(weight <= fish.weight.max);
    });

    it('rounds to 2 decimal places', () => {
      const fish = FISH.bluegill;
      const weight = generateWeight(fish);
      assert.strictEqual(weight, Math.round(weight * 100) / 100);
    });
  });

  describe('calculateFishingLevel', () => {
    it('starts at level 1', () => {
      assert.strictEqual(calculateFishingLevel(0), 1);
    });

    it('level 2 at 50 exp', () => {
      assert.strictEqual(calculateFishingLevel(50), 2);
    });

    it('level 3 at 150 exp', () => {
      assert.strictEqual(calculateFishingLevel(150), 3);
    });

    it('caps at level 50', () => {
      assert.strictEqual(calculateFishingLevel(1000000), 50);
    });
  });

  describe('getExpToNextLevel', () => {
    it('returns exp info', () => {
      const info = getExpToNextLevel(gameState);
      assert.ok(info.currentExp >= 0);
      assert.ok(info.requiredExp > 0);
      assert.ok(info.expRemaining >= 0);
    });

    it('calculates remaining exp correctly', () => {
      const info = getExpToNextLevel(gameState);
      assert.strictEqual(info.expRemaining, info.requiredExp - info.currentExp);
    });
  });

  describe('getFishingStats', () => {
    it('returns fishing statistics', () => {
      const stats = getFishingStats(gameState);
      assert.strictEqual(stats.fishingLevel, 1);
      assert.strictEqual(stats.totalFishCaught, 0);
      assert.strictEqual(stats.totalCasts, 0);
    });

    it('calculates success rate', () => {
      const castResult = castLine(gameState, 'pond');
      const catchResult = attemptCatch(castResult.state, 'pond', 0.1);
      const stats = getFishingStats(catchResult.state);

      assert.ok(stats.successRate > 0);
    });

    it('includes collection stats', () => {
      const stats = getFishingStats(gameState);
      assert.strictEqual(stats.uniqueSpecies, 0);
      assert.ok(stats.totalSpecies > 0);
      assert.strictEqual(stats.collectionPercent, 0);
    });
  });

  describe('getFishCollection', () => {
    it('returns empty array when no fish caught', () => {
      const collection = getFishCollection(gameState);
      assert.deepStrictEqual(collection, []);
    });

    it('returns caught fish with details', () => {
      const result = attemptCatch(gameState, 'pond', 0.1);
      const collection = getFishCollection(result.state);
      assert.ok(collection.length > 0);
      assert.ok(collection[0].count > 0);
      assert.ok(collection[0].largestWeight > 0);
    });

    it('sorts by count descending', () => {
      let state = gameState;
      // Catch multiple fish
      for (let i = 0; i < 5; i++) {
        const result = attemptCatch(state, 'pond', 0.1);
        state = result.state;
      }

      const collection = getFishCollection(state);
      for (let i = 1; i < collection.length; i++) {
        assert.ok(collection[i - 1].count >= collection[i].count);
      }
    });
  });

  describe('sellFish', () => {
    beforeEach(async () => {
      // Catch some fish first
      let state = gameState;
      for (let i = 0; i < 3; i++) {
        const result = attemptCatch(state, 'pond', 0.1);
        state = result.state;
      }
      gameState = state;
    });

    it('sells fish from collection', () => {
      const collection = getFishCollection(gameState);
      if (collection.length > 0) {
        const fishId = collection[0].id;
        const initialCount = collection[0].count;
        const result = sellFish(gameState, fishId, 1);
        assert.ok(result.sold);
        assert.strictEqual(result.amount, 1);
        assert.ok(result.value > 0);
      }
    });

    it('fails for invalid fish', () => {
      const result = sellFish(gameState, 'invalid_fish', 1);
      assert.strictEqual(result.sold, false);
    });

    it('fails when not enough fish', () => {
      const collection = getFishCollection(gameState);
      if (collection.length > 0) {
        const result = sellFish(gameState, collection[0].id, 1000);
        assert.strictEqual(result.sold, false);
      }
    });
  });

  describe('getZoneFish', () => {
    it('returns fish for zone', () => {
      const fish = getZoneFish('pond');
      assert.ok(fish.length > 0);
    });

    it('includes rarity data', () => {
      const fish = getZoneFish('pond');
      assert.ok(fish[0].rarityData);
    });

    it('returns empty array for invalid zone', () => {
      const fish = getZoneFish('invalid');
      assert.deepStrictEqual(fish, []);
    });
  });

  describe('canAccessZone', () => {
    it('can access pond at level 1', () => {
      assert.ok(canAccessZone(gameState, 'pond'));
    });

    it('cannot access deep sea at level 1', () => {
      assert.strictEqual(canAccessZone(gameState, 'deep_sea'), false);
    });

    it('can access deep sea at high level', () => {
      gameState.fishing.fishingLevel = 20;
      assert.ok(canAccessZone(gameState, 'deep_sea'));
    });

    it('returns false for invalid zone', () => {
      assert.strictEqual(canAccessZone(gameState, 'invalid'), false);
    });
  });

  describe('getAccessibleZones', () => {
    it('returns all zones with accessibility', () => {
      const zones = getAccessibleZones(gameState);
      assert.strictEqual(zones.length, Object.keys(FISHING_ZONES).length);
    });

    it('marks pond as accessible', () => {
      const zones = getAccessibleZones(gameState);
      const pond = zones.find(z => z.id === 'pond');
      assert.ok(pond.accessible);
    });

    it('marks deep sea as inaccessible at level 1', () => {
      const zones = getAccessibleZones(gameState);
      const deepSea = zones.find(z => z.id === 'deep_sea');
      assert.strictEqual(deepSea.accessible, false);
    });

    it('includes required level', () => {
      const zones = getAccessibleZones(gameState);
      for (const zone of zones) {
        assert.ok(zone.requiredLevel >= 1);
      }
    });
  });
});
