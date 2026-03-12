import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

import {
  FLOOR_THEME_ICONS,
  FLOOR_STATUS,
  BOSS_FLOORS,
  getFloorStatus,
  renderDungeonMapPanel,
  getDungeonMapSummary,
} from '../src/dungeon-map.js';
import { DUNGEON_FLOORS } from '../src/dungeon-floors.js';

test('FLOOR_THEME_ICONS contains cavern icon', () => {
  assert.strictEqual(FLOOR_THEME_ICONS.cavern, '🪨');
});

test('FLOOR_THEME_ICONS contains goblin_stronghold icon', () => {
  assert.strictEqual(FLOOR_THEME_ICONS.goblin_stronghold, '⚔️');
});

test('FLOOR_THEME_ICONS contains default icon', () => {
  assert.strictEqual(FLOOR_THEME_ICONS.default, '🗺️');
});

test('FLOOR_THEME_ICONS has 13 entries', () => {
  assert.strictEqual(Object.keys(FLOOR_THEME_ICONS).length, 13);
});

test('FLOOR_STATUS.LOCKED equals locked', () => {
  assert.strictEqual(FLOOR_STATUS.LOCKED, 'locked');
});

test('FLOOR_STATUS.UNVISITED equals unvisited', () => {
  assert.strictEqual(FLOOR_STATUS.UNVISITED, 'unvisited');
});

test('FLOOR_STATUS.CURRENT equals current', () => {
  assert.strictEqual(FLOOR_STATUS.CURRENT, 'current');
});

test('FLOOR_STATUS.CLEARED equals cleared', () => {
  assert.strictEqual(FLOOR_STATUS.CLEARED, 'cleared');
});

test('BOSS_FLOORS is derived from DUNGEON_FLOORS', () => {
  const expected = DUNGEON_FLOORS.filter((floor) => floor.bossFloor).map((floor) => floor.id);
  assert.deepStrictEqual(BOSS_FLOORS, expected);
});

test('BOSS_FLOORS includes floor 3', () => {
  assert.ok(BOSS_FLOORS.includes(3));
});

test('BOSS_FLOORS includes floor 15', () => {
  assert.ok(BOSS_FLOORS.includes(15));
});

test('BOSS_FLOORS has 6 entries', () => {
  assert.strictEqual(BOSS_FLOORS.length, 6);
});

test('getFloorStatus returns CLEARED when floor in floorsCleared', () => {
  const dungeonState = { floorsCleared: [1, 2, 3], currentFloor: 4, deepestFloor: 4 };
  assert.strictEqual(getFloorStatus(dungeonState, 1), FLOOR_STATUS.CLEARED);
});

test('getFloorStatus returns CURRENT for currentFloor', () => {
  const dungeonState = { floorsCleared: [], currentFloor: 2, deepestFloor: 2 };
  assert.strictEqual(getFloorStatus(dungeonState, 2), FLOOR_STATUS.CURRENT);
});

test('getFloorStatus returns UNVISITED for floor <= deepestFloor but not cleared or current', () => {
  const dungeonState = { floorsCleared: [], currentFloor: 3, deepestFloor: 5 };
  assert.strictEqual(getFloorStatus(dungeonState, 4), FLOOR_STATUS.UNVISITED);
});

test('getFloorStatus returns LOCKED for floor > deepestFloor', () => {
  const dungeonState = { floorsCleared: [], currentFloor: 1, deepestFloor: 2 };
  assert.strictEqual(getFloorStatus(dungeonState, 5), FLOOR_STATUS.LOCKED);
});

test('getFloorStatus CLEARED takes precedence over CURRENT', () => {
  const dungeonState = { floorsCleared: [1], currentFloor: 1, deepestFloor: 1 };
  assert.strictEqual(getFloorStatus(dungeonState, 1), FLOOR_STATUS.CLEARED);
});

test('getFloorStatus LOCKED for floor above deepest even if id equals currentFloor somehow', () => {
  const dungeonState = { floorsCleared: [], currentFloor: 10, deepestFloor: 3 };
  assert.strictEqual(getFloorStatus(dungeonState, 10), FLOOR_STATUS.CURRENT);
});

test('renderDungeonMapPanel returns a string', () => {
  const result = renderDungeonMapPanel(null);
  assert.strictEqual(typeof result, 'string');
});

test('renderDungeonMapPanel with null state includes dungeon-map-panel class', () => {
  const result = renderDungeonMapPanel(null);
  assert.ok(result.includes('dungeon-map-panel'));
});

test('renderDungeonMapPanel includes all 15 floor entries', () => {
  const result = renderDungeonMapPanel(null);
  const matches = result.match(/dungeon-map-floor dungeon-map-floor--/g) ?? [];
  assert.strictEqual(matches.length, 15);
});

test('renderDungeonMapPanel shows floors as locked when no dungeon state', () => {
  const result = renderDungeonMapPanel(null);
  assert.ok(result.includes('dungeon-map-floor--locked'));
});

test('renderDungeonMapPanel with active dungeon state marks current floor correctly', () => {
  const state = {
    dungeonState: { inDungeon: true, currentFloor: 3, floorsCleared: [1, 2], deepestFloor: 3 },
  };
  const result = renderDungeonMapPanel(state);
  assert.ok(result.includes('dungeon-map-floor--current'));
});

test('renderDungeonMapPanel with active dungeon state marks cleared floors correctly', () => {
  const state = {
    dungeonState: { inDungeon: true, currentFloor: 3, floorsCleared: [1, 2], deepestFloor: 3 },
  };
  const result = renderDungeonMapPanel(state);
  assert.ok(result.includes('dungeon-map-floor--cleared'));
});

test('renderDungeonMapPanel shows boss badge on boss floors', () => {
  const state = {
    dungeonState: { inDungeon: true, currentFloor: 1, floorsCleared: [], deepestFloor: 3 },
  };
  const result = renderDungeonMapPanel(state);
  assert.ok(result.includes('dungeon-map-boss-badge'));
});

test('renderDungeonMapPanel progress text shows correct cleared count', () => {
  const state = {
    dungeonState: { inDungeon: true, currentFloor: 3, floorsCleared: [1, 2], deepestFloor: 3 },
  };
  const result = renderDungeonMapPanel(state);
  assert.ok(result.includes('2 /'));
});

test('renderDungeonMapPanel includes connector elements between floors', () => {
  const result = renderDungeonMapPanel(null);
  assert.ok(result.includes('dungeon-map-connector'));
});

test('renderDungeonMapPanel includes floor numbers in output', () => {
  const result = renderDungeonMapPanel(null);
  assert.ok(result.includes("data-floor-id='1'"));
});

test('renderDungeonMapPanel handles undefined state gracefully', () => {
  assert.doesNotThrow(() => renderDungeonMapPanel(undefined));
});

test('getDungeonMapSummary returns correct totalFloors', () => {
  const dungeonState = { floorsCleared: [], deepestFloor: 0 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.totalFloors, DUNGEON_FLOORS.length);
});

test('getDungeonMapSummary returns correct floorsCleared count', () => {
  const dungeonState = { floorsCleared: [1, 2, 3], deepestFloor: 3 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.floorsCleared, 3);
});

test('getDungeonMapSummary counts only boss floors for bossesDefeated', () => {
  const dungeonState = { floorsCleared: [1, 2, 3, 4], deepestFloor: 4 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.bossesDefeated, 1);
});

test('getDungeonMapSummary returns correct deepestFloor', () => {
  const dungeonState = { floorsCleared: [1], deepestFloor: 5 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.deepestFloor, 5);
});

test('getDungeonMapSummary percentComplete is 0 when no floors cleared', () => {
  const dungeonState = { floorsCleared: [], deepestFloor: 0 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.percentComplete, 0);
});

test('getDungeonMapSummary percentComplete is 100 when all 15 floors cleared', () => {
  const dungeonState = { floorsCleared: Array.from({ length: 15 }, (_, i) => i + 1), deepestFloor: 15 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.percentComplete, 100);
});

test('getDungeonMapSummary percentComplete rounds correctly for partial clear', () => {
  const dungeonState = { floorsCleared: [1, 2, 3], deepestFloor: 3 };
  const result = getDungeonMapSummary(dungeonState);
  assert.strictEqual(result.percentComplete, 20);
});

test('dungeon-map.js has no egg-related content', () => {
  const dungeonMapPath = new URL('../src/dungeon-map.js', import.meta.url);
  const source = readFileSync(dungeonMapPath, 'utf8');
  const bannedWords = ['egg', 'easter', 'yolk', 'omelet', 'bunny', 'rabbit', 'chick', 'basket'];
  const lower = source.toLowerCase();
  const found = bannedWords.filter((word) => lower.includes(word));
  assert.deepStrictEqual(found, []);
});
