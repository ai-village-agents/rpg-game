/**
 * Tests for Treasure Map System
 * Run with: node --test tests/treasure-map-system-test.mjs
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  MAP_RARITIES,
  TREASURE_TYPES,
  PUZZLE_TYPES,
  MAP_REGIONS,
  initTreasureMapState,
  getTreasureMapState,
  generateMap,
  addMap,
  startHunt,
  updateHuntProgress,
  solvePuzzle,
  claimTreasure,
  abandonHunt,
  combineFragments,
  addFragments,
  calculateTreasureHunterLevel,
  getTreasureStats,
  getAvailableMaps,
  getCompletedMaps,
  discoverLocation,
  getCurrentHunt
} from '../src/treasure-map-system.js';

describe('Treasure Map System', () => {
  let gameState;

  beforeEach(() => {
    gameState = { treasureMaps: initTreasureMapState() };
  });

  describe('Constants', () => {
    it('has all map rarities', () => {
      assert.ok(MAP_RARITIES.TATTERED);
      assert.ok(MAP_RARITIES.WORN);
      assert.ok(MAP_RARITIES.PRISTINE);
      assert.ok(MAP_RARITIES.ANCIENT);
      assert.ok(MAP_RARITIES.LEGENDARY);
    });

    it('rarities have reward multipliers', () => {
      assert.strictEqual(MAP_RARITIES.TATTERED.rewardMultiplier, 1);
      assert.strictEqual(MAP_RARITIES.LEGENDARY.rewardMultiplier, 8);
    });

    it('has all treasure types', () => {
      assert.ok(TREASURE_TYPES.GOLD_CACHE);
      assert.ok(TREASURE_TYPES.EQUIPMENT_CHEST);
      assert.ok(TREASURE_TYPES.ARTIFACT);
      assert.ok(TREASURE_TYPES.CURSED_CHEST);
    });

    it('treasure types have values', () => {
      for (const treasure of Object.values(TREASURE_TYPES)) {
        assert.ok(treasure.baseValue > 0);
        assert.ok(treasure.category);
      }
    });

    it('has all puzzle types', () => {
      assert.ok(PUZZLE_TYPES.NONE);
      assert.ok(PUZZLE_TYPES.RIDDLE);
      assert.ok(PUZZLE_TYPES.CIPHER);
      assert.ok(PUZZLE_TYPES.GUARDIAN);
    });

    it('puzzles have difficulty levels', () => {
      assert.strictEqual(PUZZLE_TYPES.NONE.difficulty, 0);
      assert.ok(PUZZLE_TYPES.GUARDIAN.difficulty > PUZZLE_TYPES.RIDDLE.difficulty);
    });

    it('has all map regions', () => {
      assert.ok(MAP_REGIONS.FOREST);
      assert.ok(MAP_REGIONS.MOUNTAIN);
      assert.ok(MAP_REGIONS.DESERT);
      assert.ok(MAP_REGIONS.RUINS);
      assert.ok(MAP_REGIONS.UNDERGROUND);
    });

    it('regions have terrain bonuses', () => {
      assert.ok(MAP_REGIONS.FOREST.terrainBonus);
      assert.ok(MAP_REGIONS.MOUNTAIN.terrainBonus);
    });
  });

  describe('initTreasureMapState', () => {
    it('creates empty state', () => {
      const state = initTreasureMapState();
      assert.deepStrictEqual(state.ownedMaps, []);
      assert.strictEqual(state.completedMaps, 0);
      assert.strictEqual(state.treasureHunterLevel, 1);
      assert.strictEqual(state.mapFragments, 0);
    });
  });

  describe('getTreasureMapState', () => {
    it('returns existing state', () => {
      const result = getTreasureMapState(gameState);
      assert.strictEqual(result, gameState.treasureMaps);
    });

    it('creates new state if none exists', () => {
      const result = getTreasureMapState({});
      assert.deepStrictEqual(result.ownedMaps, []);
    });
  });

  describe('generateMap', () => {
    it('generates a map', () => {
      const result = generateMap('tattered');
      assert.ok(result.generated);
      assert.ok(result.map.id);
      assert.strictEqual(result.map.rarity, 'tattered');
    });

    it('generates map with random region', () => {
      const result = generateMap('worn');
      assert.ok(result.map.region);
      assert.ok(MAP_REGIONS[result.map.region.toUpperCase()]);
    });

    it('generates map with random treasure type', () => {
      const result = generateMap('pristine');
      assert.ok(result.map.treasureType);
      assert.ok(TREASURE_TYPES[result.map.treasureType.toUpperCase()]);
    });

    it('generates map with puzzle', () => {
      const result = generateMap('ancient');
      assert.ok(result.map.puzzle);
    });

    it('generates hints', () => {
      const result = generateMap('tattered');
      assert.ok(result.map.hints);
      assert.ok(result.map.hints.length > 0);
    });

    it('fails for invalid rarity', () => {
      const result = generateMap('invalid');
      assert.strictEqual(result.generated, false);
    });

    it('accepts specific region', () => {
      const result = generateMap('worn', 'forest');
      assert.strictEqual(result.map.region, 'forest');
    });

    it('accepts specific treasure type', () => {
      const result = generateMap('worn', null, 'artifact');
      assert.strictEqual(result.map.treasureType, 'artifact');
    });
  });

  describe('addMap', () => {
    it('adds map to collection', () => {
      const mapResult = generateMap('tattered');
      const result = addMap(gameState, mapResult.map);
      assert.ok(result.added);
      assert.strictEqual(result.state.treasureMaps.ownedMaps.length, 1);
    });

    it('fails for invalid map', () => {
      const result = addMap(gameState, null);
      assert.strictEqual(result.added, false);
    });

    it('fails for map without id', () => {
      const result = addMap(gameState, { rarity: 'tattered' });
      assert.strictEqual(result.added, false);
    });
  });

  describe('startHunt', () => {
    let mapId;

    beforeEach(() => {
      const mapResult = generateMap('tattered');
      const addResult = addMap(gameState, mapResult.map);
      gameState = addResult.state;
      mapId = mapResult.map.id;
    });

    it('starts a hunt', () => {
      const result = startHunt(gameState, mapId);
      assert.ok(result.started);
      assert.ok(result.state.treasureMaps.currentHunt);
      assert.strictEqual(result.state.treasureMaps.currentHunt.mapId, mapId);
    });

    it('fails for non-existent map', () => {
      const result = startHunt(gameState, 'invalid_id');
      assert.strictEqual(result.started, false);
    });

    it('fails when already on a hunt', () => {
      const result1 = startHunt(gameState, mapId);
      const mapResult2 = generateMap('worn');
      const addResult2 = addMap(result1.state, mapResult2.map);
      const result2 = startHunt(addResult2.state, mapResult2.map.id);
      assert.strictEqual(result2.started, false);
      assert.ok(result2.error.includes('Already'));
    });

    it('fails for completed map', () => {
      // Complete the map first
      const startResult = startHunt(gameState, mapId);
      const progressResult = updateHuntProgress(startResult.state, 100);
      const solveResult = solvePuzzle(progressResult.state, 'answer');
      const claimResult = claimTreasure(solveResult.state);

      const result = startHunt(claimResult.state, mapId);
      assert.strictEqual(result.started, false);
    });
  });

  describe('updateHuntProgress', () => {
    let mapId;

    beforeEach(() => {
      const mapResult = generateMap('tattered');
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      gameState = startResult.state;
      mapId = mapResult.map.id;
    });

    it('updates progress', () => {
      const result = updateHuntProgress(gameState, 25);
      assert.ok(result.updated);
      assert.strictEqual(result.newProgress, 25);
    });

    it('caps progress at 100', () => {
      const result = updateHuntProgress(gameState, 150);
      assert.strictEqual(result.newProgress, 100);
      assert.ok(result.discovered);
    });

    it('fails when no active hunt', () => {
      const abandonResult = abandonHunt(gameState);
      const result = updateHuntProgress(abandonResult.state, 25);
      assert.strictEqual(result.updated, false);
    });
  });

  describe('solvePuzzle', () => {
    beforeEach(() => {
      const mapResult = generateMap('tattered');
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      gameState = startResult.state;
    });

    it('solves puzzle with solution', () => {
      const result = solvePuzzle(gameState, 'any_answer');
      assert.ok(result.solved);
    });

    it('fails with null solution', () => {
      const result = solvePuzzle(gameState, null);
      assert.strictEqual(result.solved, false);
    });

    it('fails when no active hunt', () => {
      const abandonResult = abandonHunt(gameState);
      const result = solvePuzzle(abandonResult.state, 'answer');
      assert.strictEqual(result.solved, false);
    });
  });

  describe('claimTreasure', () => {
    beforeEach(() => {
      const mapResult = generateMap('tattered', 'forest', 'gold_cache');
      // Force no puzzle for easier testing
      mapResult.map.puzzle = 'none';
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      const progressResult = updateHuntProgress(startResult.state, 100);
      gameState = progressResult.state;
    });

    it('claims treasure when ready', () => {
      const result = claimTreasure(gameState);
      assert.ok(result.claimed);
      assert.ok(result.treasure);
      assert.ok(result.treasure.value > 0);
    });

    it('grants experience', () => {
      const result = claimTreasure(gameState);
      assert.ok(result.expGained > 0);
    });

    it('updates stats', () => {
      const result = claimTreasure(gameState);
      assert.strictEqual(result.state.treasureMaps.completedMaps, 1);
      assert.ok(result.state.treasureMaps.totalTreasureValue > 0);
    });

    it('clears current hunt', () => {
      const result = claimTreasure(gameState);
      assert.strictEqual(result.state.treasureMaps.currentHunt, null);
    });

    it('fails when progress incomplete', () => {
      // Use fresh state to avoid conflict with beforeEach hunt
      const freshState = { treasureMaps: initTreasureMapState() };
      const mapResult = generateMap('worn');
      mapResult.map.puzzle = 'none';
      const addResult = addMap(freshState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);

      const result = claimTreasure(startResult.state);
      assert.strictEqual(result.claimed, false);
    });

    it('fails when puzzle not solved', () => {
      // Use fresh state to avoid conflict with beforeEach hunt
      const freshState = { treasureMaps: initTreasureMapState() };
      const mapResult = generateMap('ancient', 'ruins', 'artifact');
      mapResult.map.puzzle = 'cipher';
      const addResult = addMap(freshState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      const progressResult = updateHuntProgress(startResult.state, 100);

      const result = claimTreasure(progressResult.state);
      assert.strictEqual(result.claimed, false);
    });
  });

  describe('abandonHunt', () => {
    beforeEach(() => {
      const mapResult = generateMap('tattered');
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      gameState = startResult.state;
    });

    it('abandons hunt', () => {
      const result = abandonHunt(gameState);
      assert.ok(result.abandoned);
      assert.strictEqual(result.state.treasureMaps.currentHunt, null);
    });

    it('fails when no active hunt', () => {
      const result1 = abandonHunt(gameState);
      const result2 = abandonHunt(result1.state);
      assert.strictEqual(result2.abandoned, false);
    });
  });

  describe('addFragments', () => {
    it('adds fragments', () => {
      const result = addFragments(gameState, 3);
      assert.ok(result.added);
      assert.strictEqual(result.newTotal, 3);
    });

    it('stacks fragments', () => {
      const result1 = addFragments(gameState, 2);
      const result2 = addFragments(result1.state, 3);
      assert.strictEqual(result2.newTotal, 5);
    });
  });

  describe('combineFragments', () => {
    beforeEach(() => {
      const result = addFragments(gameState, 10);
      gameState = result.state;
    });

    it('combines fragments into map', () => {
      const result = combineFragments(gameState);
      assert.ok(result.combined);
      assert.ok(result.map);
      assert.strictEqual(result.fragmentsUsed, 5);
    });

    it('reduces fragment count', () => {
      const result = combineFragments(gameState);
      assert.strictEqual(result.state.treasureMaps.mapFragments, 5);
    });

    it('fails with insufficient fragments', () => {
      const lowState = { treasureMaps: initTreasureMapState() };
      const result = combineFragments(lowState);
      assert.strictEqual(result.combined, false);
    });
  });

  describe('calculateTreasureHunterLevel', () => {
    it('starts at level 1', () => {
      assert.strictEqual(calculateTreasureHunterLevel(0), 1);
    });

    it('level 2 at 100 exp', () => {
      assert.strictEqual(calculateTreasureHunterLevel(100), 2);
    });

    it('level 3 at 300 exp', () => {
      assert.strictEqual(calculateTreasureHunterLevel(300), 3);
    });

    it('caps at level 30', () => {
      assert.strictEqual(calculateTreasureHunterLevel(1000000), 30);
    });
  });

  describe('getTreasureStats', () => {
    it('returns stats', () => {
      const stats = getTreasureStats(gameState);
      assert.strictEqual(stats.level, 1);
      assert.strictEqual(stats.totalMaps, 0);
      assert.strictEqual(stats.completedMaps, 0);
    });

    it('counts maps by rarity', () => {
      const mapResult1 = generateMap('tattered');
      const addResult1 = addMap(gameState, mapResult1.map);
      const mapResult2 = generateMap('worn');
      const addResult2 = addMap(addResult1.state, mapResult2.map);

      const stats = getTreasureStats(addResult2.state);
      assert.strictEqual(stats.totalMaps, 2);
      assert.ok(stats.mapsByRarity.tattered >= 1);
    });
  });

  describe('getAvailableMaps', () => {
    it('returns empty array when no maps', () => {
      const maps = getAvailableMaps(gameState);
      assert.deepStrictEqual(maps, []);
    });

    it('returns uncompleted maps', () => {
      const mapResult = generateMap('tattered');
      const addResult = addMap(gameState, mapResult.map);
      const maps = getAvailableMaps(addResult.state);
      assert.strictEqual(maps.length, 1);
    });

    it('excludes completed maps', () => {
      const mapResult = generateMap('tattered');
      mapResult.map.puzzle = 'none';
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      const progressResult = updateHuntProgress(startResult.state, 100);
      const claimResult = claimTreasure(progressResult.state);

      const maps = getAvailableMaps(claimResult.state);
      assert.strictEqual(maps.length, 0);
    });

    it('includes rarity data', () => {
      const mapResult = generateMap('worn');
      const addResult = addMap(gameState, mapResult.map);
      const maps = getAvailableMaps(addResult.state);
      assert.ok(maps[0].rarityData);
    });
  });

  describe('getCompletedMaps', () => {
    it('returns empty array when no completed', () => {
      const maps = getCompletedMaps(gameState);
      assert.deepStrictEqual(maps, []);
    });

    it('returns completed maps', () => {
      const mapResult = generateMap('tattered');
      mapResult.map.puzzle = 'none';
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);
      const progressResult = updateHuntProgress(startResult.state, 100);
      const claimResult = claimTreasure(progressResult.state);

      const maps = getCompletedMaps(claimResult.state);
      assert.strictEqual(maps.length, 1);
    });
  });

  describe('discoverLocation', () => {
    it('discovers new location', () => {
      const result = discoverLocation(gameState, 'hidden_cave');
      assert.ok(result.discovered);
      assert.ok(result.state.treasureMaps.discoveredLocations.includes('hidden_cave'));
    });

    it('detects already known location', () => {
      const result1 = discoverLocation(gameState, 'hidden_cave');
      const result2 = discoverLocation(result1.state, 'hidden_cave');
      assert.strictEqual(result2.discovered, false);
      assert.ok(result2.alreadyKnown);
    });
  });

  describe('getCurrentHunt', () => {
    it('returns inactive when no hunt', () => {
      const info = getCurrentHunt(gameState);
      assert.strictEqual(info.active, false);
    });

    it('returns hunt info when active', () => {
      const mapResult = generateMap('worn', 'mountain');
      const addResult = addMap(gameState, mapResult.map);
      const startResult = startHunt(addResult.state, mapResult.map.id);

      const info = getCurrentHunt(startResult.state);
      assert.ok(info.active);
      assert.ok(info.map);
      assert.ok(info.hunt);
      assert.ok(info.regionData);
    });
  });
});
