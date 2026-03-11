/**
 * Dungeon Floors Tests — AI Village RPG
 * Run: node tests/dungeon-floors-test.mjs
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as dungeon from '../src/dungeon-floors.js';

const {
  DUNGEON_FLOORS,
  createDungeonState,
  enterDungeon,
  exitDungeon,
  getFloorData,
  advanceFloor,
  clearFloor,
  findStairs,
  canAdvance,
  getScaledEnemy,
  getRandomEncounter,
  getDungeonProgress,
  isFloorCleared,
  getFloorTheme,
  canEnterDungeon,
  getBossForFloor,
} = dungeon;

const clone = (value) => JSON.parse(JSON.stringify(value));

const requiredFields = [
  'id',
  'name',
  'theme',
  'description',
  'enemyPool',
  'difficultyMultiplier',
  'encounterRate',
  'bossFloor',
  'bossId',
  'minLevel',
];

const makeState = (overrides = {}) => ({
  currentFloor: 0,
  deepestFloor: 0,
  floorsCleared: [],
  inDungeon: false,
  stairsFound: false,
  ...overrides,
});

const getRoll = (seed) => ((seed * 16807) % 2147483647) / 2147483647;

describe('DUNGEON_FLOORS', () => {
  test('has exactly 10 floors', () => {
    assert.equal(DUNGEON_FLOORS.length, 10);
  });

  test('each floor has required fields', () => {
    for (const floor of DUNGEON_FLOORS) {
      for (const field of requiredFields) {
        assert.ok(Object.prototype.hasOwnProperty.call(floor, field));
      }
    }
  });

  test('floor IDs are sequential 1-10', () => {
    const ids = DUNGEON_FLOORS.map((floor) => floor.id);
    assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test('boss floors are 3, 6, 9, 10', () => {
    const bossFloors = DUNGEON_FLOORS.filter((floor) => floor.bossFloor).map(
      (floor) => floor.id
    );
    assert.deepEqual(bossFloors, [3, 6, 9, 10]);
  });

  test('non-boss floors have bossId null', () => {
    for (const floor of DUNGEON_FLOORS) {
      if (!floor.bossFloor) {
        assert.equal(floor.bossId, null);
      }
    }
  });

  test('difficultyMultiplier increases with floor number', () => {
    for (let i = 1; i < DUNGEON_FLOORS.length; i += 1) {
      assert.ok(
        DUNGEON_FLOORS[i].difficultyMultiplier >
          DUNGEON_FLOORS[i - 1].difficultyMultiplier
      );
    }
  });

  test('encounterRate increases with floor number', () => {
    for (let i = 1; i < DUNGEON_FLOORS.length; i += 1) {
      assert.ok(
        DUNGEON_FLOORS[i].encounterRate > DUNGEON_FLOORS[i - 1].encounterRate
      );
    }
  });

  test('minLevel increases with floor number', () => {
    for (let i = 1; i < DUNGEON_FLOORS.length; i += 1) {
      assert.ok(DUNGEON_FLOORS[i].minLevel > DUNGEON_FLOORS[i - 1].minLevel);
    }
  });

  test('enemyPool entries are strings', () => {
    for (const floor of DUNGEON_FLOORS) {
      for (const entry of floor.enemyPool) {
        assert.equal(typeof entry, 'string');
      }
    }
  });
});

describe('createDungeonState()', () => {
  test('returns an object with expected keys', () => {
    const state = createDungeonState();
    assert.deepEqual(Object.keys(state).sort(), [
      'currentFloor',
      'deepestFloor',
      'floorsCleared',
      'inDungeon',
      'stairsFound',
    ]);
  });

  test('currentFloor is 0', () => {
    assert.equal(createDungeonState().currentFloor, 0);
  });

  test('inDungeon is false', () => {
    assert.equal(createDungeonState().inDungeon, false);
  });

  test('floorsCleared is empty array', () => {
    assert.deepEqual(createDungeonState().floorsCleared, []);
  });

  test('stairsFound is false', () => {
    assert.equal(createDungeonState().stairsFound, false);
  });
});

describe('enterDungeon(state)', () => {
  test('sets inDungeon to true', () => {
    const result = enterDungeon(makeState());
    assert.equal(result.inDungeon, true);
  });

  test('sets currentFloor to 1', () => {
    const result = enterDungeon(makeState());
    assert.equal(result.currentFloor, 1);
  });

  test('resets stairsFound to false', () => {
    const result = enterDungeon(makeState({ stairsFound: true }));
    assert.equal(result.stairsFound, false);
  });

  test('does not mutate input', () => {
    const original = makeState({ stairsFound: true, currentFloor: 4 });
    const snapshot = clone(original);
    enterDungeon(original);
    assert.deepEqual(original, snapshot);
  });
});

describe('exitDungeon(state)', () => {
  test('sets inDungeon to false', () => {
    const result = exitDungeon(makeState({ inDungeon: true }));
    assert.equal(result.inDungeon, false);
  });

  test('sets currentFloor to 0', () => {
    const result = exitDungeon(makeState({ currentFloor: 5 }));
    assert.equal(result.currentFloor, 0);
  });

  test('does not mutate input', () => {
    const original = makeState({ inDungeon: true, currentFloor: 5 });
    const snapshot = clone(original);
    exitDungeon(original);
    assert.deepEqual(original, snapshot);
  });
});

describe('getFloorData(floorNumber)', () => {
  test('returns correct floor for floor 1', () => {
    assert.equal(getFloorData(1), DUNGEON_FLOORS[0]);
  });

  test('returns correct floor for floor 5', () => {
    assert.equal(getFloorData(5), DUNGEON_FLOORS[4]);
  });

  test('returns correct floor for floor 10', () => {
    assert.equal(getFloorData(10), DUNGEON_FLOORS[9]);
  });

  test('returns null for floor 0', () => {
    assert.equal(getFloorData(0), null);
  });

  test('returns null for floor 11', () => {
    assert.equal(getFloorData(11), null);
  });

  test('returns null for negative floor numbers', () => {
    assert.equal(getFloorData(-1), null);
  });
});

describe('advanceFloor(state)', () => {
  test('increments currentFloor by 1', () => {
    const result = advanceFloor(makeState({ currentFloor: 1 }));
    assert.equal(result.currentFloor, 2);
  });

  test('updates deepestFloor when going deeper', () => {
    const result = advanceFloor(makeState({ currentFloor: 1, deepestFloor: 1 }));
    assert.equal(result.deepestFloor, 2);
  });

  test('does not decrease deepestFloor', () => {
    const result = advanceFloor(makeState({ currentFloor: 5, deepestFloor: 7 }));
    assert.equal(result.deepestFloor, 7);
  });

  test('caps at floor 10', () => {
    const result = advanceFloor(makeState({ currentFloor: 10, deepestFloor: 10 }));
    assert.equal(result.currentFloor, 10);
  });

  test('resets stairsFound', () => {
    const result = advanceFloor(makeState({ currentFloor: 2, stairsFound: true }));
    assert.equal(result.stairsFound, false);
  });

  test('does not mutate input', () => {
    const original = makeState({ currentFloor: 3, deepestFloor: 4, stairsFound: true });
    const snapshot = clone(original);
    advanceFloor(original);
    assert.deepEqual(original, snapshot);
  });
});

describe('clearFloor(state)', () => {
  test('adds current floor to floorsCleared', () => {
    const result = clearFloor(makeState({ currentFloor: 2 }));
    assert.deepEqual(result.floorsCleared, [2]);
  });

  test('does not add duplicates', () => {
    const result = clearFloor(
      makeState({ currentFloor: 2, floorsCleared: [2] })
    );
    assert.deepEqual(result.floorsCleared, [2]);
  });

  test('returns unchanged copy if currentFloor is 0', () => {
    const original = makeState({ currentFloor: 0, floorsCleared: [1] });
    const result = clearFloor(original);
    assert.deepEqual(result, original);
    assert.notStrictEqual(result, original);
  });

  test('does not mutate input', () => {
    const original = makeState({ currentFloor: 4, floorsCleared: [1, 2] });
    const snapshot = clone(original);
    clearFloor(original);
    assert.deepEqual(original, snapshot);
  });
});

describe('findStairs(state)', () => {
  test('sets stairsFound to true', () => {
    const result = findStairs(makeState());
    assert.equal(result.stairsFound, true);
  });

  test('does not mutate input', () => {
    const original = makeState({ stairsFound: false });
    const snapshot = clone(original);
    findStairs(original);
    assert.deepEqual(original, snapshot);
  });
});

describe('canAdvance(state)', () => {
  test('returns false if stairsFound is false', () => {
    const result = canAdvance(makeState({ currentFloor: 2, stairsFound: false }));
    assert.equal(result, false);
  });

  test('returns false for invalid floor', () => {
    const result = canAdvance(makeState({ currentFloor: 0, stairsFound: true }));
    assert.equal(result, false);
  });

  test('returns true when stairs found and floor cleared (non-boss)', () => {
    const result = canAdvance(
      makeState({ currentFloor: 2, stairsFound: true, floorsCleared: [2] })
    );
    assert.equal(result, true);
  });

  test('returns true when stairs found on boss floor even if not cleared', () => {
    const result = canAdvance(makeState({ currentFloor: 3, stairsFound: true }));
    assert.equal(result, true);
  });
});

describe('getScaledEnemy(enemy, floorNumber)', () => {
  const baseEnemy = {
    id: 'test',
    hp: 10,
    maxHp: 10,
    atk: 5,
    def: 4,
    spd: 3,
    xpReward: 7,
    goldReward: 6,
  };

  test('returns same stats for floor 1 (multiplier 1.0)', () => {
    const scaled = getScaledEnemy(baseEnemy, 1);
    assert.deepEqual(scaled, baseEnemy);
  });

  test('returns higher stats for higher floors', () => {
    const scaled = getScaledEnemy(baseEnemy, 2);
    assert.ok(scaled.hp > baseEnemy.hp);
    assert.ok(scaled.atk > baseEnemy.atk);
  });

  test('scales all relevant fields', () => {
    const scaled = getScaledEnemy(baseEnemy, 5);
    assert.ok(scaled.hp !== baseEnemy.hp);
    assert.ok(scaled.maxHp !== baseEnemy.maxHp);
    assert.ok(scaled.atk !== baseEnemy.atk);
    assert.ok(scaled.def !== baseEnemy.def);
    assert.ok(scaled.spd !== baseEnemy.spd);
    assert.ok(scaled.xpReward !== baseEnemy.xpReward);
    assert.ok(scaled.goldReward !== baseEnemy.goldReward);
  });

  test('returns copy of enemy if floor not found', () => {
    const scaled = getScaledEnemy(baseEnemy, 0);
    assert.deepEqual(scaled, baseEnemy);
    assert.notStrictEqual(scaled, baseEnemy);
  });

  test('returns null if enemy is null', () => {
    assert.equal(getScaledEnemy(null, 1), null);
  });

  test('does not mutate input enemy', () => {
    const original = clone(baseEnemy);
    const scaled = getScaledEnemy(baseEnemy, 2);
    scaled.hp = 1;
    assert.deepEqual(baseEnemy, original);
  });
});

describe('getRandomEncounter(state, seed)', () => {
  test('returns null when not in dungeon (currentFloor 0)', () => {
    const result = getRandomEncounter(makeState({ currentFloor: 0 }), 1);
    assert.equal(result, null);
  });

  test('returns null with seed 0', () => {
    const result = getRandomEncounter(makeState({ currentFloor: 1 }), 0);
    assert.equal(result, null);
  });

  test('returns null with undefined seed', () => {
    const result = getRandomEncounter(makeState({ currentFloor: 1 }));
    assert.equal(result, null);
  });

  test('returns object with enemyId and seed when encounter happens', () => {
    const result = getRandomEncounter(makeState({ currentFloor: 1 }), 1);
    assert.ok(result);
    assert.equal(result.enemyId, 'slime');
    assert.equal(result.seed, 16807);
  });

  test('enemyId is from current floor enemyPool', () => {
    const result = getRandomEncounter(makeState({ currentFloor: 1 }), 1);
    const pool = getFloorData(1).enemyPool;
    assert.ok(pool.includes(result.enemyId));
  });

  test('deterministic - same seed gives same result', () => {
    const first = getRandomEncounter(makeState({ currentFloor: 1 }), 1);
    const second = getRandomEncounter(makeState({ currentFloor: 1 }), 1);
    assert.deepEqual(first, second);
  });

  test('sometimes returns null based on encounter rate', () => {
    const seed = 50000;
    const roll = getRoll(seed);
    assert.ok(roll > getFloorData(1).encounterRate);
    const result = getRandomEncounter(makeState({ currentFloor: 1 }), seed);
    assert.equal(result, null);
  });
});

describe('getDungeonProgress(state)', () => {
  test('returns correct structure', () => {
    const progress = getDungeonProgress(makeState());
    assert.deepEqual(Object.keys(progress).sort(), [
      'currentFloor',
      'deepestFloor',
      'floorsCleared',
      'percentComplete',
      'totalFloors',
    ]);
  });

  test('percentComplete is 0 when no floors cleared', () => {
    const progress = getDungeonProgress(makeState());
    assert.equal(progress.percentComplete, 0);
  });

  test('percentComplete is 100 when all floors cleared', () => {
    const progress = getDungeonProgress(
      makeState({ floorsCleared: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] })
    );
    assert.equal(progress.percentComplete, 100);
  });

  test('totalFloors is 10', () => {
    const progress = getDungeonProgress(makeState());
    assert.equal(progress.totalFloors, 10);
  });
});

describe('isFloorCleared(state, floorNumber)', () => {
  test('returns true for cleared floors', () => {
    const result = isFloorCleared(makeState({ floorsCleared: [2] }), 2);
    assert.equal(result, true);
  });

  test('returns false for uncleared floors', () => {
    const result = isFloorCleared(makeState({ floorsCleared: [2] }), 3);
    assert.equal(result, false);
  });
});

describe('getFloorTheme(floorNumber)', () => {
  test('returns correct theme for floor 1', () => {
    assert.equal(getFloorTheme(1), 'cavern');
  });

  test('returns correct theme for floor 3', () => {
    assert.equal(getFloorTheme(3), 'goblin_stronghold');
  });

  test('returns correct theme for floor 10', () => {
    assert.equal(getFloorTheme(10), 'abyss');
  });

  test('returns null for invalid floor', () => {
    assert.equal(getFloorTheme(0), null);
  });
});

describe('canEnterDungeon(playerLevel)', () => {
  test('returns false for level 1', () => {
    assert.equal(canEnterDungeon(1), false);
  });

  test('returns false for level 2', () => {
    assert.equal(canEnterDungeon(2), false);
  });

  test('returns true for level 3 and above', () => {
    assert.equal(canEnterDungeon(3), true);
  });
});

describe('getBossForFloor(floorNumber)', () => {
  test('returns bossId for floor 3', () => {
    assert.equal(getBossForFloor(3), 'goblin_chief');
  });

  test('returns bossId for floor 10', () => {
    assert.equal(getBossForFloor(10), 'abyss_overlord');
  });

  test('returns null for non-boss floors', () => {
    assert.equal(getBossForFloor(2), null);
  });

  test('returns null for invalid floor number', () => {
    assert.equal(getBossForFloor(0), null);
  });
});
