/**
 * Enemies Data Tests — AI Village RPG
 * Run: node tests/enemies-test.mjs
 */

import { getEnemy, getEncounter } from '../src/data/enemies.js';

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

function withMockedRandom(value, fn) {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

console.log('\n--- getEnemy ---');
const goblin = getEnemy('goblin');
assert(goblin !== null, 'Goblin exists');
assert(goblin.name === 'Goblin', 'Goblin name correct');
assert(goblin.hp === 22, 'Goblin HP correct');
assert(goblin.abilities.includes('power-strike'), 'Goblin has power-strike');

// Deep copy verification
goblin.hp = 1;
goblin.abilities.push('cheat-code');
const goblinReloaded = getEnemy('goblin');
assert(goblinReloaded.hp === 22, 'getEnemy returns a fresh copy');
assert(!goblinReloaded.abilities.includes('cheat-code'), 'Ability mutations do not persist');

const unknown = getEnemy('does-not-exist');
assert(unknown === null, 'Unknown enemy returns null');

console.log('\n--- getEncounter ---');
// Clamp low level to tier 1
const lvl0 = withMockedRandom(0, () => getEncounter(0));
assert(Array.isArray(lvl0), 'Encounter returns an array');
assert(lvl0[0] === 'slime', 'Level 0 clamps to tier 1 (slime pick)');

// Mutating returned array does not affect future results
lvl0.push('hack');
const lvl1 = withMockedRandom(0, () => getEncounter(1));
assert(lvl1.length === 1 && lvl1[0] === 'slime', 'Encounter arrays are independent copies');

// String level input handled
const lvl3 = withMockedRandom(0, () => getEncounter('3'));
assert(lvl3[0] === 'orc', 'String level 3 resolves to orc encounter');

// Clamp high level to tier 10
const lvl99 = withMockedRandom(0, () => getEncounter(99));
assert(lvl99[0] === 'void-stalker', 'Level 99 clamps to tier 10 (void-stalker pick)');

// Random index selection across options
const lvl2 = withMockedRandom(0.5, () => getEncounter(2));
assert(lvl2.length === 2 && lvl2.includes('wolf') && lvl2.includes('goblin'), 'Random selection picks a valid tier 2 group');

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
