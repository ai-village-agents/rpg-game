/**
 * Behavior tests for src/dungeon-ui.js
 * Focus: rendering semantics and entrance gating.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  renderDungeonPanel,
  renderDungeonActions,
  shouldShowDungeonEntrance,
  getDungeonStyles,
} from '../src/dungeon-ui.js';

import {
  DUNGEON_FLOORS,
  createDungeonState,
  enterDungeon,
} from '../src/dungeon-floors.js';

function makeBaseState(overrides = {}) {
  return {
    phase: 'exploration',
    player: { level: 5 },
    world: { roomRow: 1, roomCol: 1 },
    dungeonState: createDungeonState(),
    ...overrides,
  };
}

function makeDungeonStateForFloor(floorId, extra = {}) {
  let ds = enterDungeon(createDungeonState());
  ds = {
    ...ds,
    currentFloor: floorId,
    deepestFloor: Math.max(ds.deepestFloor, floorId),
    ...extra,
  };
  return ds;
}

// ── renderDungeonPanel ────────────────────────────────────────────────

describe('renderDungeonPanel', () => {
  test('returns empty string when no dungeonState', () => {
    const state = makeBaseState({ dungeonState: null });
    const html = renderDungeonPanel(state);
    assert.equal(html, '');
  });

  test('returns empty string when not inDungeon', () => {
    const state = makeBaseState();
    const html = renderDungeonPanel(state);
    assert.equal(html, '');
  });

  test('renders error card for invalid floor id', () => {
    const state = makeBaseState({
      phase: 'dungeon',
      dungeonState: {
        ...createDungeonState(),
        inDungeon: true,
        currentFloor: 0,
      },
    });

    const html = renderDungeonPanel(state).trim();
    assert.equal(
      html,
      '<div class="card">Error: Invalid dungeon floor.</div>',
    );
  });

  test('renders floor name, id, description and progress', () => {
    const floor = DUNGEON_FLOORS.find((f) => f.id === 3);
    assert.ok(floor, 'expected floor 3 to exist');

    const state = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(3, {
        inDungeon: true,
        floorsCleared: [1, 2],
      }),
    });

    const html = renderDungeonPanel(state);

    assert.ok(html.includes('dungeon-panel'), 'panel wrapper class present');
    assert.ok(
      html.includes(`${floor.name} — Floor ${floor.id}`),
      'header shows floor name and id',
    );
    assert.ok(
      html.includes(floor.description),
      'description text is rendered',
    );

    // Progress text: 2 of 10 floors cleared => 20%.
    assert.ok(
      html.includes('2/10 floors cleared (20%)'),
      'progress text reflects cleared floors and percentage',
    );

    // Progress bar width should match percentComplete.
    assert.ok(
      html.includes('class="dungeon-progress-fill"'),
      'progress fill element present',
    );
    assert.ok(
      html.includes('width:20%'),
      'progress fill uses 20% width for two floors cleared',
    );
  });

  test('renders boss section with status based on clearance', () => {
    const bossFloor = DUNGEON_FLOORS.find((f) => f.bossFloor && f.id === 3);
    assert.ok(bossFloor, 'expected boss floor 3');

    // Not cleared yet.
    const stateAlive = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(bossFloor.id, {
        inDungeon: true,
        floorsCleared: [],
      }),
    });

    const htmlAlive = renderDungeonPanel(stateAlive);
    assert.ok(htmlAlive.includes('Boss'), 'boss label present');
    assert.ok(
      htmlAlive.includes(`${bossFloor.bossId} (Alive)`),
      'boss shown as alive when floor not cleared',
    );

    // Cleared.
    const stateDefeated = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(bossFloor.id, {
        inDungeon: true,
        floorsCleared: [bossFloor.id],
      }),
    });

    const htmlDefeated = renderDungeonPanel(stateDefeated);
    assert.ok(
      htmlDefeated.includes(`${bossFloor.bossId} (Defeated)`),
      'boss shown as defeated when floor cleared',
    );
  });

  test('renders floor list markers for all 10 floors', () => {
    const state = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(5, {
        inDungeon: true,
        floorsCleared: [1, 2, 3],
        deepestFloor: 7,
      }),
    });

    const html = renderDungeonPanel(state);

    // There should be one marker per floor.
    const markerMatches = html.match(/class=\"dungeon-floor-marker/g) || [];
    assert.equal(markerMatches.length, 10, 'one marker per floor');

    // Current floor should be marked as current.
    assert.ok(
      html.includes('dungeon-floor-marker current'),
      'current floor marker has current class',
    );

    // At least one cleared floor marker should be present.
    assert.ok(
      html.includes('dungeon-floor-marker cleared'),
      'at least one cleared floor marker present',
    );
  });
});

// ── renderDungeonActions ──────────────────────────────────────────────

describe('renderDungeonActions', () => {
  test('returns empty string when not inDungeon', () => {
    const state = makeBaseState();
    const html = renderDungeonActions(state);
    assert.equal(html, '');
  });

  test('shows basic buttons on a normal floor', () => {
    const state = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(2, {
        inDungeon: true,
        stairsFound: false,
        floorsCleared: [],
      }),
    });

    const html = renderDungeonActions(state);

    assert.ok(html.includes('btnDungeonSearch'), 'Search button present');
    assert.ok(html.includes('btnDungeonInventory'), 'Inventory button present');
    assert.ok(html.includes('btnDungeonExit'), 'Exit button present');

    assert.ok(!html.includes('btnDungeonBoss'), 'no Boss button on non-boss floor');
    assert.ok(
      !html.includes('btnDungeonAdvance'),
      'no Descend button when stairs not found / cannot advance',
    );
  });

  test('shows boss and descend buttons on a boss floor when eligible', () => {
    const bossFloor = DUNGEON_FLOORS.find((f) => f.bossFloor && f.id !== 10);
    assert.ok(bossFloor, 'expected a non-final boss floor');

    const state = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(bossFloor.id, {
        inDungeon: true,
        stairsFound: true,
        floorsCleared: [],
      }),
    });

    const html = renderDungeonActions(state);

    assert.ok(html.includes('btnDungeonSearch'), 'Search button present');
    assert.ok(html.includes('btnDungeonBoss'), 'Boss button present');
    assert.ok(
      html.includes('btnDungeonAdvance'),
      'Descend button present when canAdvance and not last floor',
    );
    assert.ok(html.includes('btnDungeonInventory'), 'Inventory button present');
    assert.ok(html.includes('btnDungeonExit'), 'Exit button present');
  });

  test('does not show descend button on last floor even if canAdvance', () => {
    const lastFloor = DUNGEON_FLOORS[DUNGEON_FLOORS.length - 1];
    assert.equal(lastFloor.id, 10, 'expected floor 10 to be last floor');

    const state = makeBaseState({
      phase: 'dungeon',
      dungeonState: makeDungeonStateForFloor(lastFloor.id, {
        inDungeon: true,
        stairsFound: true,
        floorsCleared: [],
      }),
    });

    const html = renderDungeonActions(state);

    assert.ok(html.includes('btnDungeonSearch'), 'Search button present');
    assert.ok(
      !html.includes('btnDungeonAdvance'),
      'no Descend button on last floor',
    );
  });
});

// ── shouldShowDungeonEntrance ─────────────────────────────────────────

describe('shouldShowDungeonEntrance', () => {
  test('returns false when phase is not exploration', () => {
    const state = makeBaseState({ phase: 'combat' });
    assert.equal(shouldShowDungeonEntrance(state), false);
  });

  test('returns false when player is missing or under-leveled', () => {
    const noPlayer = makeBaseState({ player: undefined });
    assert.equal(shouldShowDungeonEntrance(noPlayer), false, 'no player');

    const lowLevel = makeBaseState({ player: { level: 2 } });
    assert.equal(shouldShowDungeonEntrance(lowLevel), false, 'level 2 cannot enter');
  });

  test('returns false when not standing on dungeon entrance tile', () => {
    const state = makeBaseState({
      phase: 'exploration',
      player: { level: 10 },
      world: { roomRow: 1, roomCol: 1 }, // center tile, not SW
    });

    assert.equal(shouldShowDungeonEntrance(state), false);
  });

  test('returns true when in exploration, high enough level, and on SW tile', () => {
    const state = makeBaseState({
      phase: 'exploration',
      player: { level: 10 },
      world: { roomRow: 2, roomCol: 0 }, // maps to room id "sw"
    });

    assert.equal(shouldShowDungeonEntrance(state), true);
  });
});

// ── getDungeonStyles ─────────────────────────────────────────────────

describe('getDungeonStyles', () => {
  test('returns CSS string with key selectors', () => {
    const css = getDungeonStyles();

    assert.equal(typeof css, 'string');
    assert.ok(css.length > 0, 'CSS string is non-empty');

    const requiredSelectors = [
      '.dungeon-panel',
      '.dungeon-progress-bar',
      '.dungeon-progress-fill',
      '.dungeon-enter-btn',
    ];

    for (const selector of requiredSelectors) {
      assert.ok(
        css.includes(selector),
        `CSS includes selector ${selector}`,
      );
    }
  });
});

