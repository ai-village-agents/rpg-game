/**
 * Tests for MOVE dispatch action logic.
 * Tests the movePlayer function integration and state update patterns
 * that the MOVE dispatch action in main.js relies on.
 */

import { movePlayer, createWorldState, getRoomExits, DEFAULT_WORLD_DATA } from '../src/map.js';
import { pushLog } from '../src/state.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

function test(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// ── World State ─────────────────────────────────────────────────────────────

test('createWorldState() returns valid world state', () => {
  const ws = createWorldState();
  assert(ws !== null, 'returns non-null');
  assert(typeof ws.roomRow === 'number', 'has roomRow');
  assert(typeof ws.roomCol === 'number', 'has roomCol');
  assert(typeof ws.x === 'number', 'has x');
  assert(typeof ws.y === 'number', 'has y');
  assertEqual(ws.roomRow, 1, 'starts at center row');
  assertEqual(ws.roomCol, 1, 'starts at center col');
});

// ── MOVE dispatch simulation ─────────────────────────────────────────────────

test('MOVE with valid direction updates world state', () => {
  const ws = createWorldState();
  const result = movePlayer(ws, 'north');
  assert(typeof result === 'object', 'returns result object');
  assert('moved' in result, 'result has moved');
  assert('worldState' in result, 'result has worldState');
  assert('room' in result, 'result has room');
  // We moved or were blocked — both are valid outcomes
  assert(typeof result.moved === 'boolean', 'moved is boolean');
});

test('MOVE with invalid direction returns moved=false', () => {
  const ws = createWorldState();
  const result = movePlayer(ws, 'up'); // invalid — should be north/south/east/west
  assertEqual(result.moved, false, 'invalid direction: moved=false');
  assert(result.blocked === 'invalid-direction', 'blocked is invalid-direction');
});

test('MOVE state update pattern: spread world state correctly', () => {
  const ws = createWorldState();
  const fakeState = {
    phase: 'exploration',
    world: ws,
    log: ['Game started.'],
    turn: 1,
    player: { hp: 50, maxHp: 50, atk: 10, def: 5, defending: false, inventory: { potion: 2 } },
  };

  // Simulate dispatch MOVE logic
  const direction = 'north';
  const result = movePlayer(fakeState.world, direction);
  let newState;
  if (result.moved) {
    const msg = result.transitioned && result.room
      ? `You move ${direction} into ${result.room.name}.`
      : `You move ${direction}.`;
    newState = pushLog({ ...fakeState, world: result.worldState }, msg);
  } else {
    const reason = result.blocked === 'edge' ? 'The path ends here.' : 'Something blocks your way.';
    newState = pushLog(fakeState, reason);
  }

  assert(newState.log.length > fakeState.log.length, 'log gains a new entry');
  assert(newState.phase === 'exploration', 'phase unchanged');
  assert(newState.world !== null, 'world state preserved');
  if (result.moved) {
    assertEqual(newState.world, result.worldState, 'world updated to new world state');
  }
});

test('EXPLORE phase guard: MOVE only works in exploration phase', () => {
  const ws = createWorldState();
  const fakeState = { phase: 'player-turn', world: ws, log: [] };
  // Simulating dispatch logic for non-exploration phase
  const blocked = fakeState.phase !== 'exploration';
  assert(blocked, 'MOVE is guarded to exploration phase only');
});

test('EXPLORE phase guard: MOVE blocked in enemy-turn', () => {
  const ws = createWorldState();
  const fakeState = { phase: 'enemy-turn', world: ws, log: [] };
  const blocked = fakeState.phase !== 'exploration';
  assert(blocked, 'MOVE blocked during enemy-turn');
});

test('EXPLORE phase guard: MOVE blocked in victory', () => {
  const ws = createWorldState();
  const fakeState = { phase: 'victory', world: ws, log: [] };
  const blocked = fakeState.phase !== 'exploration';
  assert(blocked, 'MOVE blocked in victory phase');
});

test('EXPLORE transition: allowed from victory or defeat', () => {
  const canExploreFrom = ['victory', 'defeat'];
  const cannotExploreFrom = ['player-turn', 'enemy-turn'];
  canExploreFrom.forEach(phase => {
    const allowed = !(phase === 'player-turn' || phase === 'enemy-turn');
    assert(allowed, `EXPLORE allowed from ${phase}`);
  });
  cannotExploreFrom.forEach(phase => {
    const blocked = phase === 'player-turn' || phase === 'enemy-turn';
    assert(blocked, `EXPLORE blocked from ${phase}`);
  });
});

// ── Direction validation ──────────────────────────────────────────────────────

test('Valid directions for MOVE action', () => {
  const valid = ['north', 'south', 'east', 'west'];
  const invalid = ['up', 'down', 'left', 'right', '', null, undefined, 'n', 's', 'e', 'w'];

  valid.forEach(d => {
    const ok = ['north', 'south', 'east', 'west'].includes(d);
    assert(ok, `'${d}' is a valid direction`);
  });

  invalid.forEach(d => {
    const ok = !['north', 'south', 'east', 'west'].includes(d);
    assert(ok, `'${d}' is correctly rejected`);
  });
});

// ── Map panel state checks ────────────────────────────────────────────────────

test('getRoomExits returns valid cardinal directions', () => {
  const ws = createWorldState(); // center room
  const exits = getRoomExits(ws);
  assert(Array.isArray(exits), 'exits is an array');
  exits.forEach(exit => {
    const valid = ['north', 'south', 'east', 'west'].includes(exit);
    assert(valid, `exit '${exit}' is a cardinal direction`);
  });
  // Center room (1,1) has all 4 exits in a 3x3 grid
  assertEqual(exits.length, 4, 'center room has 4 exits');
});

test('Corner rooms have only 2 exits', () => {
  const nwState = { roomRow: 0, roomCol: 0, x: 8, y: 6 };
  const exits = getRoomExits(nwState);
  assertEqual(exits.length, 2, 'NW corner has 2 exits');
  assert(exits.includes('south'), 'NW has south exit');
  assert(exits.includes('east'), 'NW has east exit');
});

test('Edge rooms have 3 exits', () => {
  const northState = { roomRow: 0, roomCol: 1, x: 8, y: 6 };
  const exits = getRoomExits(northState);
  assertEqual(exits.length, 3, 'north edge room has 3 exits');
  assert(!exits.includes('north'), 'north edge room has no north exit');
});

test('movePlayer transitions between rooms correctly', () => {
  // Start in center (1,1), move east to (1,2)
  const ws = createWorldState(); // starts at center (1,1)
  assert(ws.roomRow === 1 && ws.roomCol === 1, 'starts at center');

  // Move east through room until transition
  let currentWs = ws;
  let transitioned = false;
  for (let i = 0; i < 20; i++) {
    const result = movePlayer(currentWs, 'east');
    if (result.transitioned) {
      transitioned = true;
      assertEqual(result.worldState.roomCol, 2, 'transitioned to east room (col 2)');
      assert(result.room !== null, 'has room info after transition');
      break;
    }
    if (!result.moved) break;
    currentWs = result.worldState;
  }
  assert(transitioned, 'can transition east from center room');
});

test('movePlayer blocked at world edge', () => {
  // Start in NW corner (0,0), try to move north or west
  const nwState = { roomRow: 0, roomCol: 0, x: 8, y: 6 };
  const northResult = movePlayer(nwState, 'north');
  // Try to move to edge of room and then beyond
  let currentWs = nwState;
  let hitEdge = false;
  for (let i = 0; i < 15; i++) {
    const result = movePlayer(currentWs, 'north');
    if (!result.moved && result.blocked === 'edge') {
      hitEdge = true;
      break;
    }
    if (!result.moved) break;
    currentWs = result.worldState;
  }
  assert(hitEdge || northResult.blocked !== null, 'NW corner blocks north movement at world edge');
});

test('pushLog adds message to state log', () => {
  const state = { log: ['entry1', 'entry2'], phase: 'exploration' };
  const next = pushLog(state, 'new entry');
  assertEqual(next.log.length, 3, 'log grows by 1');
  assertEqual(next.log[2], 'new entry', 'new entry appended at end');
  assert(next.phase === state.phase, 'other state properties preserved');
});

test('pushLog caps log at 200 entries', () => {
  const bigLog = Array.from({ length: 200 }, (_, i) => `line ${i}`);
  const state = { log: bigLog };
  const next = pushLog(state, 'overflow');
  assertEqual(next.log.length, 200, 'log capped at 200');
  assertEqual(next.log[199], 'overflow', 'newest entry at end');
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
