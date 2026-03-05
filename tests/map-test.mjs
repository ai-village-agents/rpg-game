/**
 * Map / World System Tests — AI Village RPG
 * Run: node tests/map-test.mjs
 */

import { DEFAULT_WORLD_DATA, WorldMap, createWorldState, movePlayer } from '../src/map.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + msg);
  } else {
    failed++;
    console.error('  FAIL: ' + msg);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const ROOM_W = DEFAULT_WORLD_DATA.roomWidth;
const ROOM_H = DEFAULT_WORLD_DATA.roomHeight;
const MID_X = Math.floor(ROOM_W / 2);
const MID_Y = Math.floor(ROOM_H / 2);

console.log('\n--- World state creation ---');
{
  const state = createWorldState();
  assert(state.roomRow === DEFAULT_WORLD_DATA.startRoom.row, 'Starts in default roomRow');
  assert(state.roomCol === DEFAULT_WORLD_DATA.startRoom.col, 'Starts in default roomCol');
  assert(state.x === DEFAULT_WORLD_DATA.startPosition.x, 'Starts at default x');
  assert(state.y === DEFAULT_WORLD_DATA.startPosition.y, 'Starts at default y');
}

console.log('\n--- Persisted state validation ---');
{
  // Out-of-range room should snap back to defaults.
  const badRoom = new WorldMap(DEFAULT_WORLD_DATA, { roomRow: 999, roomCol: 999, x: MID_X, y: MID_Y }).snapshot();
  assert(
    deepEqual(badRoom, {
      roomRow: DEFAULT_WORLD_DATA.startRoom.row,
      roomCol: DEFAULT_WORLD_DATA.startRoom.col,
      x: DEFAULT_WORLD_DATA.startPosition.x,
      y: DEFAULT_WORLD_DATA.startPosition.y,
    }),
    'Invalid room snaps to default state'
  );

  // A blocked tile should snap back (e.g., 0,0 is a perimeter wall).
  const blockedTile = new WorldMap(DEFAULT_WORLD_DATA, {
    roomRow: DEFAULT_WORLD_DATA.startRoom.row,
    roomCol: DEFAULT_WORLD_DATA.startRoom.col,
    x: 0,
    y: 0,
  }).snapshot();
  assert(blockedTile.x === DEFAULT_WORLD_DATA.startPosition.x, 'Blocked tile -> default x');
  assert(blockedTile.y === DEFAULT_WORLD_DATA.startPosition.y, 'Blocked tile -> default y');

  // A position just outside bounds should be clamped (if clamped spot is not blocked).
  const clamped = new WorldMap(DEFAULT_WORLD_DATA, {
    roomRow: DEFAULT_WORLD_DATA.startRoom.row,
    roomCol: DEFAULT_WORLD_DATA.startRoom.col,
    x: ROOM_W + 999,
    y: ROOM_H + 999,
  }).snapshot();

  assert(clamped.x >= 0 && clamped.x < ROOM_W, 'Clamps x into room bounds');
  assert(clamped.y >= 0 && clamped.y < ROOM_H, 'Clamps y into room bounds');
}

console.log('\n--- Movement within room ---');
{
  // Place near west wall but not on it.
  const world = new WorldMap(DEFAULT_WORLD_DATA, {
    roomRow: 1,
    roomCol: 1,
    x: 1,
    y: 1,
  });

  const before = world.snapshot();
  const west = world.move('west');
  assert(!west.moved, 'Cannot move into perimeter wall');
  assert(west.blocked === 'collision', 'Wall collision reported');
  assert(deepEqual(world.snapshot(), before), 'State unchanged on blocked move');

  const south = world.move('south');
  assert(south.moved, 'Can move south into open tile');
  assert(world.snapshot().y === 2, 'Y increments on south move');
}

console.log('\n--- Invalid direction ---');
{
  const world = new WorldMap(DEFAULT_WORLD_DATA);
  const res = world.move('up');
  assert(!res.moved, 'Invalid direction does not move');
  assert(res.blocked === 'invalid-direction', 'Invalid direction blocked reason');
}

console.log('\n--- Room transitions ---');
{
  // Transition north from the center room using the opened north edge.
  const startState = {
    roomRow: 1,
    roomCol: 1,
    x: MID_X,
    y: 0,
  };

  const res = movePlayer(startState, 'north');
  assert(res.moved, 'Moved on north transition');
  assert(res.transitioned, 'Transitioned to another room');
  assert(res.worldState.roomRow === 0, 'Room row decremented when moving north');
  assert(res.worldState.roomCol === 1, 'Room col unchanged when moving north');
  assert(res.worldState.x === MID_X, 'X preserved across transition');
  assert(res.worldState.y === ROOM_H - 1, 'Y set to opposite edge on transition');
  assert(res.room !== null && typeof res.room.name === 'string', 'movePlayer returns current room object');

  // Edge of world: attempt to go north again from top row should fail.
  const res2 = movePlayer({ ...res.worldState, x: MID_X, y: 0 }, 'north');
  assert(!res2.moved, 'No move when transitioning past world edge');
  assert(res2.blocked === 'edge', 'Blocked reason is edge at world boundary');
  assert(!res2.transitioned, 'No transition at world boundary');
}

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
