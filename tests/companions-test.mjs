/**
 * Companion/Party System Tests - AI Village RPG
 * Run: node tests/companions-test.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  createCompanionState,
  getAvailableCompanions,
  isCompanionRecruited,
  recruitCompanion,
  dismissCompanion,
  getCompanionById,
  companionAttack,
  companionTakeDamage,
  healCompanion,
  adjustLoyalty,
  getCompanionBonuses,
  companionAutoAct,
} from '../src/companions.js';

import {
  renderCompanionPanel,
  renderCompanionHUD,
  renderCompanionBadge,
} from '../src/companions-ui.js';

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ✅ ' + name);
    passed++;
  } catch (e) {
    console.log('  ❌ ' + name);
    console.log('     ' + e.message);
    failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(msg || 'Expected ' + expected + ', got ' + actual);
}

function freshState() {
  return {
    companions: [],
    maxCompanions: 2,
    enemy: { name: 'Slime', hp: 20, maxHp: 20, def: 2, atk: 5 },
    log: [],
    rngSeed: 12345,
  };
}

const recruit = (state, id) => recruitCompanion(state, id);

// 1. createCompanionState
console.log('\n--- createCompanionState ---');
test('returns object with companions array and maxCompanions=2', () => {
  const state = createCompanionState();
  assert(Array.isArray(state.companions), 'companions is array');
  assertEqual(state.maxCompanions, 2, 'maxCompanions is 2');
});

// 2. recruitCompanion
console.log('\n--- recruitCompanion ---');
test('recruits companion_fenris successfully', () => {
  const state = recruit(freshState(), 'companion_fenris');
  assertEqual(state.companions.length, 1, 'companion added');
  const fenris = state.companions[0];
  assertEqual(fenris.name, 'Fenris', 'name is Fenris');
  assertEqual(fenris.class, 'Warrior', 'class is Warrior');
  assertEqual(fenris.alive, true, 'alive is true');
  assertEqual(fenris.loyalty, 50, 'loyalty is 50');
  assert(isCompanionRecruited(state, 'companion_fenris'), 'isCompanionRecruited returns true');
});

test('recruits companion_lyra', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_lyra');
  assertEqual(state2.companions.length, 2, 'two companions recruited');
});

test('rejects recruiting when party full', () => {
  const state = {
    ...freshState(),
    companions: [{ id: 'companion_alpha' }, { id: 'companion_beta' }],
    maxCompanions: 2,
  };
  const after = recruit(state, 'companion_fenris');
  assertEqual(after.companions.length, 2, 'party size unchanged');
  assert(after.log.some((entry) => entry.includes('party is full')),
    'log indicates party is full');
});

test('rejects unknown companion ID', () => {
  const state = recruit(freshState(), 'companion_unknown');
  assertEqual(state.companions.length, 0, 'no companion added');
  assert(state.log.some((entry) => entry.includes('Unknown companion')),
    'log indicates unknown companion');
});

test('rejects duplicate recruitment', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_fenris');
  assertEqual(state2.companions.length, 1, 'duplicate not added');
});

// 3. dismissCompanion
console.log('\n--- dismissCompanion ---');
test('dismisses recruited companion', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = dismissCompanion(state1, 'companion_fenris');
  assertEqual(state2.companions.length, 0, 'companion removed');
});

test('handles missing companion gracefully', () => {
  const state = dismissCompanion(freshState(), 'companion_fenris');
  assertEqual(state.companions.length, 0, 'no companion removed');
});

// 4. getCompanionById
console.log('\n--- getCompanionById ---');
test('returns companion when found', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const companion = getCompanionById(state, 'companion_fenris');
  assert(companion !== null, 'companion found');
  assertEqual(companion.id, 'companion_fenris', 'companion id matches');
});

test('returns null when not found', () => {
  const companion = getCompanionById(freshState(), 'companion_fenris');
  assertEqual(companion, null, 'companion not found');
});

// 5. companionAttack
console.log('\n--- companionAttack ---');
test('deals damage to enemy', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const result = companionAttack(state, 'companion_fenris', 12345);
  assert(result.state.enemy.hp < 20, 'enemy hp decreased');
});

test('returns updated seed', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const result = companionAttack(state, 'companion_fenris', 12345);
  assert(result.seed !== 12345, 'seed updated');
});

test('does nothing if companion is not alive', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const deadState = {
    ...state,
    companions: state.companions.map((c) => ({ ...c, alive: false })),
  };
  const result = companionAttack(deadState, 'companion_fenris', 12345);
  assertEqual(result.state.enemy.hp, 20, 'enemy hp unchanged');
  assertEqual(result.seed, 12345, 'seed unchanged');
});

// 6. companionTakeDamage
console.log('\n--- companionTakeDamage ---');
test('reduces companion hp', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const next = companionTakeDamage(state, 'companion_fenris', 5);
  const fenris = getCompanionById(next, 'companion_fenris');
  assertEqual(fenris.hp, 40, 'hp reduced');
});

test('sets alive=false when hp reaches 0', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const next = companionTakeDamage(state, 'companion_fenris', 999);
  const fenris = getCompanionById(next, 'companion_fenris');
  assertEqual(fenris.hp, 0, 'hp clamped to 0');
  assertEqual(fenris.alive, false, 'alive is false');
});

test('adds fallen message to log', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const next = companionTakeDamage(state, 'companion_fenris', 999);
  assert(next.log.some((entry) => entry.includes('has fallen')),
    'log includes fallen message');
});

// 7. healCompanion
console.log('\n--- healCompanion ---');
test('restores hp up to maxHp', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const wounded = {
    ...state,
    companions: state.companions.map((c) => ({ ...c, hp: 30 })),
  };
  const healed = healCompanion(wounded, 'companion_fenris', 10);
  const fenris = getCompanionById(healed, 'companion_fenris');
  assertEqual(fenris.hp, 40, 'hp restored');
});

test('does not exceed maxHp', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const wounded = {
    ...state,
    companions: state.companions.map((c) => ({ ...c, hp: 44 })),
  };
  const healed = healCompanion(wounded, 'companion_fenris', 999);
  const fenris = getCompanionById(healed, 'companion_fenris');
  assertEqual(fenris.hp, fenris.maxHp, 'hp capped at maxHp');
});

// 8. adjustLoyalty
console.log('\n--- adjustLoyalty ---');
test('increases loyalty', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const next = adjustLoyalty(state, 'companion_fenris', 10);
  const fenris = getCompanionById(next, 'companion_fenris');
  assertEqual(fenris.loyalty, 60, 'loyalty increased');
});

test('decreases loyalty', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const next = adjustLoyalty(state, 'companion_fenris', -10);
  const fenris = getCompanionById(next, 'companion_fenris');
  assertEqual(fenris.loyalty, 40, 'loyalty decreased');
});

test('clamps loyalty to 0-100 range', () => {
  const stateHigh = recruit(freshState(), 'companion_fenris');
  const high = adjustLoyalty(stateHigh, 'companion_fenris', 60);
  const fenrisHigh = getCompanionById(high, 'companion_fenris');
  assertEqual(fenrisHigh.loyalty, 100, 'loyalty capped at 100');

  const stateLow = recruit(freshState(), 'companion_fenris');
  const low = adjustLoyalty(stateLow, 'companion_fenris', -80);
  const fenrisLow = getCompanionById(low, 'companion_fenris');
  assertEqual(fenrisLow.loyalty, 0, 'loyalty floored at 0');
});

// 9. getCompanionBonuses
console.log('\n--- getCompanionBonuses ---');
test('returns {attackBonus: 0, defenseBonus: 0} with no companions', () => {
  const bonuses = getCompanionBonuses(freshState());
  assertEqual(bonuses.attackBonus, 0, 'attack bonus 0');
  assertEqual(bonuses.defenseBonus, 0, 'defense bonus 0');
});

test('returns {attackBonus: 2, defenseBonus: 1} with 1 alive companion', () => {
  const state = recruit(freshState(), 'companion_fenris');
  const bonuses = getCompanionBonuses(state);
  assertEqual(bonuses.attackBonus, 2, 'attack bonus 2');
  assertEqual(bonuses.defenseBonus, 1, 'defense bonus 1');
});

test('returns {attackBonus: 4, defenseBonus: 2} with 2 alive companions', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_lyra');
  const bonuses = getCompanionBonuses(state2);
  assertEqual(bonuses.attackBonus, 4, 'attack bonus 4');
  assertEqual(bonuses.defenseBonus, 2, 'defense bonus 2');
});

test('dead companions do not count', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_lyra');
  const withDead = {
    ...state2,
    companions: state2.companions.map((c) => (c.id === 'companion_lyra' ? { ...c, alive: false } : c)),
  };
  const bonuses = getCompanionBonuses(withDead);
  assertEqual(bonuses.attackBonus, 2, 'attack bonus counts alive only');
  assertEqual(bonuses.defenseBonus, 1, 'defense bonus counts alive only');
});

// 10. companionAutoAct
console.log('\n--- companionAutoAct ---');
test('all alive companions attack enemy', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_lyra');
  const next = companionAutoAct(state2, 12345);
  assertEqual(next.enemy.hp, 6, 'enemy hp reduced by both companions');
  assert(Number.isFinite(next.rngSeed), 'rngSeed updated on state');
});

test('skips dead companions', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_lyra');
  const withDead = {
    ...state2,
    companions: state2.companions.map((c) => (c.id === 'companion_lyra' ? { ...c, alive: false } : c)),
  };
  const next = companionAutoAct(withDead, 12345);
  assertEqual(next.enemy.hp, 10, 'enemy hp reduced by alive companion only');
});

// 11. Companion UI
console.log('\n--- Companion UI ---');
test('renderCompanionPanel returns HTML with companion-panel class', () => {
  const html = renderCompanionPanel(freshState());
  assert(html.includes('companion-panel'), 'companion-panel class present');
});

test('renderCompanionHUD returns empty string with no companions', () => {
  const html = renderCompanionHUD(freshState());
  assertEqual(html, '', 'HUD empty when no companions');
});

test('renderCompanionBadge returns empty string with no companions', () => {
  const html = renderCompanionBadge(freshState());
  assertEqual(html, '', 'badge empty when no companions');
});

test('renderCompanionBadge shows count with recruited companions', () => {
  const state1 = recruit(freshState(), 'companion_fenris');
  const state2 = recruit(state1, 'companion_lyra');
  const html = renderCompanionBadge(state2);
  assert(html.includes('companion-badge'), 'badge class present');
  assert(html.includes('2/2'), 'badge shows count');
});

// 12. Forbidden Motifs Check
console.log('\n--- Forbidden Motifs Check ---');
test('source files do not contain forbidden words', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const companionsPath = join(here, '../src/companions.js');
  const companionsUiPath = join(here, '../src/companions-ui.js');
  const files = [companionsPath, companionsUiPath];
  const forbidden = ['egg', 'easter', 'rabbit', 'bunny', 'cockatrice', 'basilisk', 'yolk', 'omelet'];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const word of forbidden) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      assert(!re.test(text), `${word} found in ${file}`);
    }
  }
});

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
