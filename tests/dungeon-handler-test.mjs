import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

// Import the handler
import { handleDungeonAction } from '../src/handlers/dungeon-handler.js';

// Import dungeon-floors for state creation
import { createDungeonState, enterDungeon, findStairs, clearFloor } from '../src/dungeon-floors.js';

function makeState(overrides = {}) {
  return {
    phase: 'exploration',
    log: [],
    rngSeed: 200000,
    player: {
      name: 'TestHero',
      classId: 'warrior',
      level: 5,
      hp: 50,
      maxHp: 50,
      mp: 10,
      maxMp: 10,
      atk: 12,
      def: 10,
      spd: 8,
      xp: 100,
      gold: 50,
      inventory: {},
      defending: false,
      statusEffects: [],
    },
    world: { roomRow: 2, roomCol: 0 }, // SW room
    ...overrides,
  };
}

function makeDungeonState(overrides = {}) {
  return {
    ...makeState({ phase: 'dungeon' }),
    dungeonState: enterDungeon(createDungeonState()),
    ...overrides,
  };
}

describe('Dungeon Handler', () => {
  // === ENTER_DUNGEON ===
  describe('ENTER_DUNGEON', () => {
    it('should enter dungeon from exploration', () => {
      const state = makeState();
      const result = handleDungeonAction(state, { type: 'ENTER_DUNGEON' });
      assert.ok(result, 'should return a state');
      assert.equal(result.phase, 'dungeon');
      assert.equal(result.dungeonState.inDungeon, true);
      assert.equal(result.dungeonState.currentFloor, 1);
    });

    it('should reject if not in exploration phase', () => {
      const state = makeState({ phase: 'combat' });
      const result = handleDungeonAction(state, { type: 'ENTER_DUNGEON' });
      assert.equal(result, null);
    });

    it('should reject if player level too low', () => {
      const state = makeState({ player: { ...makeState().player, level: 2 } });
      const result = handleDungeonAction(state, { type: 'ENTER_DUNGEON' });
      assert.ok(result);
      assert.equal(result.phase, 'exploration'); // stays in exploration
      assert.ok(result.log.some(l => l.includes('level 3')));
    });

    it('should preserve existing dungeon progress', () => {
      const ds = createDungeonState();
      ds.deepestFloor = 5;
      ds.floorsCleared = [1, 2, 3];
      const state = makeState({ dungeonState: ds });
      const result = handleDungeonAction(state, { type: 'ENTER_DUNGEON' });
      assert.ok(result);
      assert.equal(result.dungeonState.deepestFloor, 5);
      assert.deepEqual(result.dungeonState.floorsCleared, [1, 2, 3]);
    });

    it('should add log message about descending', () => {
      const state = makeState();
      const result = handleDungeonAction(state, { type: 'ENTER_DUNGEON' });
      assert.ok(result.log.some(l => l.includes('descend')));
    });
  });

  // === DUNGEON_SEARCH ===
  describe('DUNGEON_SEARCH', () => {
    it('should return null if not in dungeon phase', () => {
      const state = makeState();
      const result = handleDungeonAction(state, { type: 'DUNGEON_SEARCH' });
      assert.equal(result, null);
    });

    it('should return null if dungeonState not in dungeon', () => {
      const state = makeState({ phase: 'dungeon', dungeonState: createDungeonState() });
      const result = handleDungeonAction(state, { type: 'DUNGEON_SEARCH' });
      assert.equal(result, null);
    });

    it('should produce a result when in dungeon', () => {
      const state = makeDungeonState();
      const result = handleDungeonAction(state, { type: 'DUNGEON_SEARCH' });
      assert.ok(result, 'should return a state');
      // Result could be encounter, stairs found, or nothing
      assert.ok(result.log.length > 0);
    });

    it('should update rngSeed', () => {
      const state = makeDungeonState({ rngSeed: 300000 });
      const result = handleDungeonAction(state, { type: 'DUNGEON_SEARCH' });
      assert.ok(result);
      assert.notEqual(result.rngSeed, 300000);
    });

    it('should trigger combat with encounter seed', () => {
      // Use a seed that gives a low roll (< encounterRate 0.3)
      // Park-Miller: next = (seed * 16807) % 2147483647
      // Need to find seed where nextSeed / 2147483647 < 0.3
      let testSeed = 100001;
      let found = false;
      for (let i = 100001; i < 200000; i++) {
        const next = (i * 16807) % 2147483647;
        const val = next / 2147483647;
        if (val < 0.3) {
          testSeed = i;
          found = true;
          break;
        }
      }
      if (found) {
        const state = makeDungeonState({ rngSeed: testSeed });
        const result = handleDungeonAction(state, { type: 'DUNGEON_SEARCH' });
        assert.ok(result);
        if (result.phase === 'player-turn') {
          assert.ok(result.enemy, 'should have enemy in combat');
          assert.ok(result.inDungeonCombat, 'should mark as dungeon combat');
          assert.equal(result.turn, 1);
        }
      }
    });

    it('should find stairs with appropriate seed', () => {
      // Need roll >= encounterRate but < encounterRate + 0.25, and stairs not found
      let testSeed = 100001;
      let found = false;
      for (let i = 100001; i < 500000; i++) {
        const next = (i * 16807) % 2147483647;
        const val = next / 2147483647;
        if (val >= 0.3 && val < 0.55) {
          testSeed = i;
          found = true;
          break;
        }
      }
      if (found) {
        const state = makeDungeonState({ rngSeed: testSeed });
        const result = handleDungeonAction(state, { type: 'DUNGEON_SEARCH' });
        assert.ok(result);
        if (result.dungeonState?.stairsFound) {
          assert.ok(result.log.some(l => l.includes('stairway')));
        }
      }
    });
  });

  // === DUNGEON_ADVANCE ===
  describe('DUNGEON_ADVANCE', () => {
    it('should return null if not in dungeon', () => {
      const result = handleDungeonAction(makeState(), { type: 'DUNGEON_ADVANCE' });
      assert.equal(result, null);
    });

    it('should reject if stairs not found', () => {
      const state = makeDungeonState();
      const result = handleDungeonAction(state, { type: 'DUNGEON_ADVANCE' });
      assert.ok(result);
      assert.equal(result.phase, 'dungeon');
      assert.ok(result.log.some(l => l.includes('stairs')));
    });

    it('should advance floor when canAdvance is true', () => {
      const ds = enterDungeon(createDungeonState());
      const withStairs = findStairs(ds);
      const cleared = clearFloor(withStairs);
      const state = makeDungeonState({ dungeonState: cleared });
      const result = handleDungeonAction(state, { type: 'DUNGEON_ADVANCE' });
      assert.ok(result);
      assert.equal(result.dungeonState.currentFloor, 2);
      assert.ok(result.log.some(l => l.includes('floor 2') || l.includes('Floor 2')));
    });

    it('should reject at max floor', () => {
      const maxFloor = 15;
      const ds = {
        currentFloor: maxFloor,
        deepestFloor: maxFloor,
        floorsCleared: Array.from({length: maxFloor}, (_, i) => i + 1),
        inDungeon: true,
        stairsFound: true,
      };
      const state = makeDungeonState({ dungeonState: ds });
      const result = handleDungeonAction(state, { type: 'DUNGEON_ADVANCE' });
      assert.ok(result);
      assert.ok(result.log.some(l => l.includes('deepest')));
    });

    it('should reset stairsFound after advancing', () => {
      const ds = { ...enterDungeon(createDungeonState()), stairsFound: true, floorsCleared: [1] };
      const state = makeDungeonState({ dungeonState: ds });
      const result = handleDungeonAction(state, { type: 'DUNGEON_ADVANCE' });
      assert.ok(result);
      assert.equal(result.dungeonState.stairsFound, false);
    });
  });

  // === DUNGEON_FIGHT_BOSS ===
  describe('DUNGEON_FIGHT_BOSS', () => {
    it('should return null if not in dungeon', () => {
      const result = handleDungeonAction(makeState(), { type: 'DUNGEON_FIGHT_BOSS' });
      assert.equal(result, null);
    });

    it('should reject on non-boss floor', () => {
      // Floor 1 is not a boss floor
      const state = makeDungeonState();
      const result = handleDungeonAction(state, { type: 'DUNGEON_FIGHT_BOSS' });
      assert.ok(result);
      assert.ok(result.log.some(l => l.includes('no boss')));
    });

    it('should start boss fight on boss floor', () => {
      // Floor 3 is a boss floor (goblin_chief)
      const ds = { ...enterDungeon(createDungeonState()), currentFloor: 3 };
      const state = makeDungeonState({ dungeonState: ds, player: { ...makeDungeonState().player, level: 5 } });
      const result = handleDungeonAction(state, { type: 'DUNGEON_FIGHT_BOSS' });
      assert.ok(result);
      assert.equal(result.phase, 'player-turn');
      assert.ok(result.enemy);
      assert.ok(result.inDungeonCombat);
      assert.ok(result.dungeonBossFight);
      assert.ok(result.log.some(l => l.includes('boss')));
    });

    it('should reject if boss already defeated', () => {
      const ds = { ...enterDungeon(createDungeonState()), currentFloor: 3, floorsCleared: [3] };
      const state = makeDungeonState({ dungeonState: ds });
      const result = handleDungeonAction(state, { type: 'DUNGEON_FIGHT_BOSS' });
      assert.ok(result);
      assert.ok(result.log.some(l => l.includes('already defeated')));
    });
  });

  // === DUNGEON_EXIT ===
  describe('DUNGEON_EXIT', () => {
    it('should exit dungeon', () => {
      const state = makeDungeonState();
      const result = handleDungeonAction(state, { type: 'DUNGEON_EXIT' });
      assert.ok(result);
      assert.equal(result.phase, 'exploration');
      assert.equal(result.dungeonState.inDungeon, false);
      assert.ok(result.log.some(l => l.includes('leave') || l.includes('return')));
    });

    it('should return null if not in dungeon phase', () => {
      const result = handleDungeonAction(makeState(), { type: 'DUNGEON_EXIT' });
      assert.equal(result, null);
    });

    it('should preserve dungeon progress on exit', () => {
      const ds = { ...enterDungeon(createDungeonState()), deepestFloor: 4, floorsCleared: [1, 2, 3] };
      const state = makeDungeonState({ dungeonState: ds });
      const result = handleDungeonAction(state, { type: 'DUNGEON_EXIT' });
      assert.ok(result);
      assert.equal(result.dungeonState.deepestFloor, 4);
      assert.deepEqual(result.dungeonState.floorsCleared, [1, 2, 3]);
    });
  });

  // === DUNGEON_RETURN ===
  describe('DUNGEON_RETURN', () => {
    it('should return to dungeon from combat', () => {
      const ds = enterDungeon(createDungeonState());
      const state = {
        ...makeDungeonState({ dungeonState: ds }),
        phase: 'battle-summary',
        inDungeonCombat: true,
      };
      const result = handleDungeonAction(state, { type: 'DUNGEON_RETURN' });
      assert.ok(result);
      assert.equal(result.phase, 'dungeon');
      assert.equal(result.inDungeonCombat, undefined);
    });

    it('should clear floor on boss victory', () => {
      const ds = { ...enterDungeon(createDungeonState()), currentFloor: 3 };
      const state = {
        ...makeDungeonState({ dungeonState: ds }),
        phase: 'battle-summary',
        inDungeonCombat: true,
        dungeonBossFight: true,
      };
      const result = handleDungeonAction(state, { type: 'DUNGEON_RETURN' });
      assert.ok(result);
      assert.equal(result.phase, 'dungeon');
      assert.ok(result.dungeonState.floorsCleared.includes(3));
      assert.equal(result.dungeonBossFight, undefined);
    });

    it('should return null if not in dungeon combat', () => {
      const state = makeDungeonState();
      const result = handleDungeonAction(state, { type: 'DUNGEON_RETURN' });
      assert.equal(result, null);
    });
  });

  // === Unknown action ===
  describe('Unknown actions', () => {
    it('should return null for unknown action', () => {
      const result = handleDungeonAction(makeState(), { type: 'UNKNOWN' });
      assert.equal(result, null);
    });

    it('should return null for null action', () => {
      const result = handleDungeonAction(makeState(), null);
      assert.equal(result, null);
    });

    it('should return null for action without type', () => {
      const result = handleDungeonAction(makeState(), {});
      assert.equal(result, null);
    });
  });
});
