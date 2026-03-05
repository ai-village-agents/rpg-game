/**
 * Game Engine Tests - AI Village RPG
 * Run: node tests/engine-test.mjs
 */

import {
  GameState,
  TurnPhase,
  on,
  off,
  emit,
  saveToSlot,
  loadFromSlot,
  getSaveSlots,
  deleteSaveSlot,
  getGameState,
  setGameState,
  initEngine
} from '../src/engine.js';

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

function callWithoutConsoleError(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.error = original;
  }
}

// Mock localStorage for Node.js environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

console.log('\n--- GameState Constants ---');
{
  assert(GameState.MENU === 'menu', 'MENU state exists');
  assert(GameState.EXPLORATION === 'exploration', 'EXPLORATION state exists');
  assert(GameState.COMBAT === 'combat', 'COMBAT state exists');
  assert(GameState.DIALOG === 'dialog', 'DIALOG state exists');
  assert(GameState.INVENTORY === 'inventory', 'INVENTORY state exists');
  assert(GameState.GAME_OVER === 'game_over', 'GAME_OVER state exists');
  assert(Object.keys(GameState).length === 6, 'GameState has 6 states');
}

console.log('\n--- TurnPhase Constants ---');
{
  assert(TurnPhase.PLAYER_SELECT === 'player_select', 'PLAYER_SELECT phase exists');
  assert(TurnPhase.PLAYER_ACTION === 'player_action', 'PLAYER_ACTION phase exists');
  assert(TurnPhase.ENEMY_TURN === 'enemy_turn', 'ENEMY_TURN phase exists');
  assert(TurnPhase.RESOLVE === 'resolve', 'RESOLVE phase exists');
  assert(Object.keys(TurnPhase).length === 4, 'TurnPhase has 4 phases');
}

console.log('\n--- Event System ---');
{
  let received = null;
  const handler = (data) => { received = data; };

  on('test:event', handler);
  emit('test:event', { value: 42 });
  assert(received !== null, 'Event was received');
  assert(received.value === 42, 'Event data is correct');

  received = null;
  off('test:event', handler);
  emit('test:event', { value: 99 });
  assert(received === null, 'Event not received after off()');

  // Test multiple listeners
  let count = 0;
  const h1 = () => { count++; };
  const h2 = () => { count++; };
  on('multi:test', h1);
  on('multi:test', h2);
  emit('multi:test', {});
  assert(count === 2, 'Multiple listeners called');

  // Test emit with no listeners (should not throw)
  let noError = true;
  try {
    emit('nonexistent:event', {});
  } catch (e) {
    noError = false;
  }
  assert(noError, 'Emit with no listeners does not throw');
}

console.log('\n--- Game State Management ---');
{
  initEngine();
  assert(getGameState() === GameState.MENU, 'Starts in MENU state after init');

  let stateChangeEvent = null;
  const stateHandler = (data) => { stateChangeEvent = data; };
  on('game:stateChange', stateHandler);

  setGameState(GameState.EXPLORATION);
  assert(getGameState() === GameState.EXPLORATION, 'State changes to EXPLORATION');
  assert(stateChangeEvent !== null, 'State change event emitted');
  assert(stateChangeEvent.oldState === GameState.MENU, 'Old state is MENU');
  assert(stateChangeEvent.newState === GameState.EXPLORATION, 'New state is EXPLORATION');

  setGameState(GameState.COMBAT);
  assert(getGameState() === GameState.COMBAT, 'State changes to COMBAT');

  off('game:stateChange', stateHandler);
}

console.log('\n--- Save System ---');
{
  localStorage.clear();

  const testState = {
    player: { name: 'TestHero', hp: 50 },
    turn: 5,
    version: 1
  };

  // Test valid save
  const saved = saveToSlot(testState, 0);
  assert(saved === true, 'Save returns true on success');

  // Test load
  const loaded = loadFromSlot(0);
  assert(loaded !== null, 'Load returns saved data');
  assert(loaded.player.name === 'TestHero', 'Player name preserved');
  assert(loaded.player.hp === 50, 'Player hp preserved');
  assert(loaded.turn === 5, 'Turn preserved');
  assert(loaded.savedAt !== undefined, 'SavedAt timestamp added');

  // Test invalid slot index
  const badSave = callWithoutConsoleError(() => saveToSlot(testState, -1));
  assert(badSave === false, 'Save fails for negative slot');

  const badSave2 = callWithoutConsoleError(() => saveToSlot(testState, 10));
  assert(badSave2 === false, 'Save fails for slot >= MAX_SAVE_SLOTS');

  const badLoad = callWithoutConsoleError(() => loadFromSlot(-1));
  assert(badLoad === null, 'Load returns null for negative slot');

  const badLoad2 = callWithoutConsoleError(() => loadFromSlot(10));
  assert(badLoad2 === null, 'Load returns null for slot >= MAX_SAVE_SLOTS');

  // Test empty slot load
  const emptyLoad = loadFromSlot(4);
  assert(emptyLoad === null, 'Load returns null for empty slot');
}

console.log('\n--- Save Slots Info ---');
{
  localStorage.clear();

  // Save to slots 0 and 2
  saveToSlot({ player: { name: 'Hero1' }, turn: 10 }, 0);
  saveToSlot({ player: { name: 'Hero2' }, turn: 20 }, 2);

  const slots = getSaveSlots();
  assert(slots.length === 5, 'Returns all 5 slots');
  assert(slots[0].exists === true, 'Slot 0 exists');
  assert(slots[0].playerName === 'Hero1', 'Slot 0 has correct player name');
  assert(slots[0].turn === 10, 'Slot 0 has correct turn');
  assert(slots[1].exists === false, 'Slot 1 does not exist');
  assert(slots[2].exists === true, 'Slot 2 exists');
  assert(slots[2].playerName === 'Hero2', 'Slot 2 has correct player name');
  assert(slots[3].exists === false, 'Slot 3 does not exist');
  assert(slots[4].exists === false, 'Slot 4 does not exist');
}

console.log('\n--- Delete Save Slot ---');
{
  localStorage.clear();
  saveToSlot({ player: { name: 'ToDelete' } }, 1);

  let deleteEvent = null;
  on('game:saveDeleted', (data) => { deleteEvent = data; });

  const deleted = deleteSaveSlot(1);
  assert(deleted === true, 'Delete returns true');
  assert(deleteEvent !== null, 'Delete event emitted');
  assert(deleteEvent.slotIndex === 1, 'Delete event has correct slot index');

  const afterDelete = loadFromSlot(1);
  assert(afterDelete === null, 'Slot is empty after delete');

  // Invalid delete
  const badDelete = deleteSaveSlot(-1);
  assert(badDelete === false, 'Delete fails for invalid slot');
}

console.log('\n--- Engine Init ---');
{
  let initEvent = null;
  on('engine:initialized', (data) => { initEvent = data; });

  const result = initEngine();
  assert(result === true, 'initEngine returns true');
  assert(initEvent !== null, 'Init event emitted');
  assert(initEvent.gameState === GameState.MENU, 'Init sets state to MENU');
}

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
