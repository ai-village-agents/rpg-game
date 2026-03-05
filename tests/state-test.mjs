/**
 * State Module Tests - AI Village RPG
 * Tests for state utilities: initialState, initialStateWithClass, clamp, pushLog, localStorage
 * Run: node tests/state-test.mjs
 */

import {
  initialState,
  initialStateWithClass,
  clamp,
  pushLog,
  saveToLocalStorage,
  loadFromLocalStorage
} from '../src/state.js';

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

// Mock localStorage for Node.js environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

console.log('\n--- initialState ---');
{
  const state = initialState();

  assert(state.version === 1, 'State has version 1');
  assert(typeof state.rngSeed === 'number', 'State has numeric rngSeed');
  assert(state.phase === 'player-turn', 'Phase starts as player-turn');
  assert(state.turn === 1, 'Turn starts at 1');

  // Player checks
  assert(state.player !== undefined, 'Player exists');
  assert(typeof state.player.name === 'string', 'Player has name');
  assert(typeof state.player.hp === 'number', 'Player has hp');
  assert(typeof state.player.maxHp === 'number', 'Player has maxHp');
  assert(state.player.hp <= state.player.maxHp, 'Player hp <= maxHp');
  assert(typeof state.player.atk === 'number', 'Player has atk');
  assert(typeof state.player.def === 'number', 'Player has def');
  assert(state.player.defending === false, 'Player not defending initially');
  assert(state.player.inventory !== undefined, 'Player has inventory');
  assert(state.player.inventory.potion >= 0, 'Player has potions');

  // Enemy checks
  assert(state.enemy !== undefined, 'Enemy exists');
  assert(typeof state.enemy.name === 'string', 'Enemy has name');
  assert(typeof state.enemy.hp === 'number', 'Enemy has hp');
  assert(typeof state.enemy.maxHp === 'number', 'Enemy has maxHp');
  assert(state.enemy.defending === false, 'Enemy not defending initially');

  // Log checks
  assert(Array.isArray(state.log), 'Log is array');
  assert(state.log.length >= 1, 'Log has initial entries');

  // World state check
  assert(state.world !== undefined, 'World state exists');
}

console.log('\n--- initialStateWithClass ---');
{
  // Test warrior class
  const warriorState = initialStateWithClass('warrior');
  assert(warriorState.player.classId === 'warrior', 'Warrior has correct classId');
  assert(warriorState.player.name === 'Warrior', 'Warrior has correct name');
  assert(warriorState.player.level === 1, 'Player starts at level 1');
  assert(warriorState.player.xp === 0, 'Player starts with 0 xp');
  assert(typeof warriorState.player.mp === 'number', 'Player has mp stat');
  assert(warriorState.world !== undefined, 'World state exists for class-based init');

  // Test mage class
  const mageState = initialStateWithClass('mage');
  assert(mageState.player.classId === 'mage', 'Mage has correct classId');
  assert(mageState.player.name === 'Mage', 'Mage has correct name');

  // Test rogue class
  const rogueState = initialStateWithClass('rogue');
  assert(rogueState.player.classId === 'rogue', 'Rogue has correct classId');
  assert(rogueState.player.name === 'Rogue', 'Rogue has correct name');

  // Test cleric class
  const clericState = initialStateWithClass('cleric');
  assert(clericState.player.classId === 'cleric', 'Cleric has correct classId');
  assert(clericState.player.name === 'Cleric', 'Cleric has correct name');

  // Test unknown class throws
  let threwError = false;
  try {
    initialStateWithClass('unknown_class');
  } catch (e) {
    threwError = true;
    assert(e.message.includes('Unknown classId'), 'Error mentions unknown classId');
  }
  assert(threwError, 'Unknown class throws error');
}

console.log('\n--- clamp ---');
{
  assert(clamp(5, 0, 10) === 5, 'Value in range unchanged');
  assert(clamp(-5, 0, 10) === 0, 'Value below range clamped to min');
  assert(clamp(15, 0, 10) === 10, 'Value above range clamped to max');
  assert(clamp(0, 0, 10) === 0, 'Value at min unchanged');
  assert(clamp(10, 0, 10) === 10, 'Value at max unchanged');
  assert(clamp(50, 50, 50) === 50, 'Single value range works');
  assert(clamp(-100, -50, -10) === -50, 'Negative range works');
}

console.log('\n--- pushLog ---');
{
  const state = { log: ['Line 1', 'Line 2'] };

  const result = pushLog(state, 'Line 3');
  assert(result.log.length === 3, 'Log length increased');
  assert(result.log[2] === 'Line 3', 'New line added at end');
  assert(state.log.length === 2, 'Original state unchanged (immutable)');

  // Test log truncation at 200 lines
  const bigState = { log: Array(200).fill('x') };
  const truncResult = pushLog(bigState, 'new line');
  assert(truncResult.log.length === 200, 'Log capped at 200 lines');
  assert(truncResult.log[199] === 'new line', 'New line at end after truncation');
  assert(truncResult.log[0] === 'x', 'Oldest line dropped was first');
}

console.log('\n--- saveToLocalStorage / loadFromLocalStorage ---');
{
  localStorage.clear();

  // Test save and load
  const testState = {
    version: 1,
    player: { name: 'TestHero', hp: 50 },
    turn: 10
  };

  saveToLocalStorage(testState);
  const loaded = loadFromLocalStorage();

  assert(loaded !== null, 'Loaded state is not null');
  assert(loaded.player.name === 'TestHero', 'Player name preserved');
  assert(loaded.player.hp === 50, 'Player hp preserved');
  assert(loaded.turn === 10, 'Turn preserved');

  // Test load from empty storage
  localStorage.clear();
  const emptyLoad = loadFromLocalStorage();
  assert(emptyLoad === null, 'Empty storage returns null');

  // Test load with invalid JSON
  localStorage.setItem('aiVillageRpgSave', 'not valid json');
  const invalidLoad = loadFromLocalStorage();
  assert(invalidLoad === null, 'Invalid JSON returns null');

  // Test load with non-object JSON
  localStorage.setItem('aiVillageRpgSave', '"just a string"');
  const stringLoad = loadFromLocalStorage();
  assert(stringLoad === null, 'Non-object JSON returns null');

  // Test load with null JSON
  localStorage.setItem('aiVillageRpgSave', 'null');
  const nullLoad = loadFromLocalStorage();
  assert(nullLoad === null, 'Null JSON returns null');
}

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
