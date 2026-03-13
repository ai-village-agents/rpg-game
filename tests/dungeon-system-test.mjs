/**
 * Dungeon System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  DUNGEON_TYPES,
  ROOM_TYPES,
  DIFFICULTY_LEVELS,
  initDungeonState,
  generateDungeon,
  startDungeon,
  getCurrentRoom,
  moveToRoom,
  defeatEnemy,
  collectLoot,
  completeDungeon,
  abandonDungeon,
  getDungeonProgress,
  getDungeonStats,
  getAllDungeonTypes,
  getAllDifficulties
} from '../src/dungeon-system.js';

import {
  renderDungeonSelector,
  renderDungeonMap,
  renderCurrentRoom,
  renderDungeonProgress,
  renderDungeonStats,
  renderDungeonActions,
  renderDungeonPage,
  renderDungeonComplete
} from '../src/dungeon-system-ui.js';

describe('Dungeon System', () => {
  let state;

  beforeEach(() => {
    state = initDungeonState({}).state;
  });

  describe('DUNGEON_TYPES', () => {
    it('has all types', () => {
      assert.ok(DUNGEON_TYPES.CAVE);
      assert.ok(DUNGEON_TYPES.CRYPT);
      assert.ok(DUNGEON_TYPES.CASTLE);
    });
  });

  describe('ROOM_TYPES', () => {
    it('has all types', () => {
      assert.ok(ROOM_TYPES.ENTRANCE);
      assert.ok(ROOM_TYPES.BOSS);
      assert.ok(ROOM_TYPES.TREASURE);
    });
  });

  describe('DIFFICULTY_LEVELS', () => {
    it('has all difficulties', () => {
      assert.ok(DIFFICULTY_LEVELS.EASY);
      assert.ok(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(DIFFICULTY_LEVELS.HARD);
      assert.ok(DIFFICULTY_LEVELS.NIGHTMARE);
    });

    it('nightmare has highest multiplier', () => {
      assert.ok(DIFFICULTY_LEVELS.NIGHTMARE.enemyMultiplier > DIFFICULTY_LEVELS.EASY.enemyMultiplier);
    });
  });

  describe('initDungeonState', () => {
    it('creates initial state', () => {
      assert.ok(state.dungeons);
      assert.strictEqual(state.dungeons.activeDungeon, null);
      assert.ok(Array.isArray(state.dungeons.completedDungeons));
    });
  });

  describe('generateDungeon', () => {
    it('generates dungeon', () => {
      const result = generateDungeon('cave', 'normal', 10);
      assert.ok(result.success);
      assert.ok(result.dungeon);
      assert.strictEqual(result.dungeon.type, 'cave');
    });

    it('has entrance and boss rooms', () => {
      const result = generateDungeon('cave', 'normal', 10);
      const rooms = result.dungeon.rooms;
      assert.strictEqual(rooms[0].type, 'entrance');
      assert.strictEqual(rooms[rooms.length - 1].type, 'boss');
    });

    it('fails for invalid type', () => {
      const result = generateDungeon('invalid', 'normal', 10);
      assert.ok(!result.success);
    });

    it('fails for invalid difficulty', () => {
      const result = generateDungeon('cave', 'invalid', 10);
      assert.ok(!result.success);
    });
  });

  describe('startDungeon', () => {
    it('starts dungeon', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      const result = startDungeon(state, dungeon);
      assert.ok(result.success);
      assert.ok(result.state.dungeons.activeDungeon);
    });

    it('fails if already in dungeon', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const result = startDungeon(state, dungeon);
      assert.ok(!result.success);
    });
  });

  describe('getCurrentRoom', () => {
    it('returns current room', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const result = getCurrentRoom(state);
      assert.ok(result.found);
      assert.strictEqual(result.room.type, 'entrance');
    });

    it('returns not found when not in dungeon', () => {
      const result = getCurrentRoom(state);
      assert.ok(!result.found);
    });
  });

  describe('moveToRoom', () => {
    beforeEach(() => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
    });

    it('moves to connected room', () => {
      const result = moveToRoom(state, 1);
      assert.ok(result.success);
      assert.strictEqual(state.dungeons.activeDungeon.currentRoom, 0);
      assert.strictEqual(result.state.dungeons.activeDungeon.currentRoom, 1);
    });

    it('fails for unconnected room', () => {
      const result = moveToRoom(state, 5);
      assert.ok(!result.success);
    });
  });

  describe('defeatEnemy', () => {
    beforeEach(() => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      state = moveToRoom(state, 1).state;
    });

    it('defeats enemy', () => {
      const room = getCurrentRoom(state).room;
      if (room.enemies.length > 0) {
        const result = defeatEnemy(state, room.enemies[0].id);
        assert.ok(result.success);
      }
    });

    it('fails for invalid enemy', () => {
      const result = defeatEnemy(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('collectLoot', () => {
    beforeEach(() => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      state = moveToRoom(state, 1).state;
    });

    it('collects loot', () => {
      const room = getCurrentRoom(state).room;
      if (room.loot.length > 0) {
        const result = collectLoot(state, room.loot[0].id);
        assert.ok(result.success);
        assert.ok(result.collectedItem);
      }
    });

    it('fails for invalid loot', () => {
      const result = collectLoot(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('completeDungeon', () => {
    it('requires boss defeat', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const result = completeDungeon(state);
      assert.ok(!result.success);
    });
  });

  describe('abandonDungeon', () => {
    it('abandons dungeon', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const result = abandonDungeon(state);
      assert.ok(result.success);
      assert.strictEqual(result.state.dungeons.activeDungeon, null);
    });

    it('increments death count', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const result = abandonDungeon(state);
      assert.strictEqual(result.state.dungeons.stats.totalDeaths, 1);
    });
  });

  describe('getDungeonProgress', () => {
    it('returns progress', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const progress = getDungeonProgress(state);
      assert.ok(progress.inDungeon);
      assert.strictEqual(progress.clearedRooms, 0);
    });

    it('returns not in dungeon', () => {
      const progress = getDungeonProgress(state);
      assert.ok(!progress.inDungeon);
    });
  });

  describe('getDungeonStats', () => {
    it('returns stats', () => {
      const stats = getDungeonStats(state);
      assert.strictEqual(stats.totalCleared, 0);
      assert.strictEqual(stats.totalDeaths, 0);
    });
  });

  describe('getAllDungeonTypes', () => {
    it('returns types', () => {
      const types = getAllDungeonTypes();
      assert.ok(types.length > 0);
    });
  });

  describe('getAllDifficulties', () => {
    it('returns difficulties', () => {
      const diffs = getAllDifficulties();
      assert.ok(diffs.length > 0);
    });
  });
});

describe('Dungeon System UI', () => {
  let state;

  beforeEach(() => {
    state = initDungeonState({}).state;
  });

  describe('renderDungeonSelector', () => {
    it('renders selector', () => {
      const html = renderDungeonSelector(10);
      assert.ok(html.includes('dungeon-selector'));
      assert.ok(html.includes('Cave'));
    });
  });

  describe('renderDungeonMap', () => {
    it('renders empty when not in dungeon', () => {
      const html = renderDungeonMap(state);
      assert.ok(html.includes('Not in a dungeon'));
    });

    it('renders map', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const html = renderDungeonMap(state);
      assert.ok(html.includes('dungeon-map'));
      assert.ok(html.includes('room-node'));
    });
  });

  describe('renderCurrentRoom', () => {
    it('renders empty when not in dungeon', () => {
      const html = renderCurrentRoom(state);
      assert.ok(html.includes('Not in a dungeon'));
    });

    it('renders room', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const html = renderCurrentRoom(state);
      assert.ok(html.includes('current-room'));
      assert.ok(html.includes('Entrance'));
    });
  });

  describe('renderDungeonProgress', () => {
    it('renders progress', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const html = renderDungeonProgress(state);
      assert.ok(html.includes('dungeon-progress'));
      assert.ok(html.includes('Cave'));
    });
  });

  describe('renderDungeonStats', () => {
    it('renders stats', () => {
      const html = renderDungeonStats(state);
      assert.ok(html.includes('dungeon-stats'));
      assert.ok(html.includes('Dungeons Cleared'));
    });
  });

  describe('renderDungeonActions', () => {
    it('returns empty when not in dungeon', () => {
      const html = renderDungeonActions(state);
      assert.strictEqual(html, '');
    });

    it('renders actions', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const html = renderDungeonActions(state);
      assert.ok(html.includes('Abandon'));
    });
  });

  describe('renderDungeonPage', () => {
    it('renders selector when not in dungeon', () => {
      const html = renderDungeonPage(state);
      assert.ok(html.includes('dungeon-page'));
      assert.ok(html.includes('dungeon-selector'));
    });

    it('renders dungeon when in dungeon', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      state = startDungeon(state, dungeon).state;
      const html = renderDungeonPage(state);
      assert.ok(html.includes('in-dungeon'));
    });
  });

  describe('renderDungeonComplete', () => {
    it('renders completion', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      dungeon.completedAt = Date.now();
      const html = renderDungeonComplete(dungeon);
      assert.ok(html.includes('dungeon-complete'));
      assert.ok(html.includes('Complete'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes dungeon names', () => {
      const dungeon = generateDungeon('cave', 'normal', 10).dungeon;
      dungeon.typeName = '<script>alert("xss")</script>';
      state = startDungeon(state, dungeon).state;
      const html = renderDungeonMap(state);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
