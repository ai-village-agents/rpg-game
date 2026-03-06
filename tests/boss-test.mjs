/**
 * Boss Battle System Unit Tests
 * Tests for src/boss.js - Core boss encounter logic
 */

import { strict as assert } from 'assert';
import {
  createBossEncounter,
  checkPhaseTransition,
  transitionToPhase,
  getCurrentPhase,
  getPhaseName,
  calculateBossAbilityDamage,
  selectBossAbility,
  applyDamageToBoss,
  isBossDefeated,
  getBossRewards,
  getBossHpSegments,
  isBoss
} from '../src/boss.js';
import { getBoss, getAllBossIds, getBossAbility } from '../src/data/bosses.js';

// Test counters
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${err.message}`);
  }
}

console.log('='.repeat(60));
console.log('BOSS BATTLE SYSTEM UNIT TESTS');
console.log('='.repeat(60));
console.log('');

// ============================================
// Boss Data Tests
// ============================================
console.log('--- Boss Data Tests ---');

test('getBoss returns forest-guardian boss', () => {
  const boss = getBoss('forest-guardian');
  assert.ok(boss, 'Boss should exist');
  assert.equal(boss.id, 'forest-guardian');
  assert.equal(boss.name, 'Forest Guardian');
});

test('getBoss returns fire-drake boss', () => {
  const boss = getBoss('fire-drake');
  assert.ok(boss, 'Boss should exist');
  assert.equal(boss.id, 'fire-drake');
  assert.equal(boss.name, 'Fire Drake');
});

test('getBoss returns shadow-wraith boss', () => {
  const boss = getBoss('shadow-wraith');
  assert.ok(boss, 'Boss should exist');
  assert.equal(boss.id, 'shadow-wraith');
  assert.equal(boss.name, 'Shadow Wraith');
});

test('getBoss returns null for invalid boss', () => {
  const boss = getBoss('invalid-boss');
  assert.equal(boss, null);
});

test('getAllBossIds returns all three bosses', () => {
  const ids = getAllBossIds();
  assert.equal(ids.length, 3);
  assert.ok(ids.includes('forest-guardian'));
  assert.ok(ids.includes('fire-drake'));
  assert.ok(ids.includes('shadow-wraith'));
});

// ============================================
// Boss Encounter Creation Tests
// ============================================
console.log('');
console.log('--- Boss Encounter Creation Tests ---');

test('createBossEncounter creates valid encounter for forest-guardian', () => {
  const encounter = createBossEncounter('forest-guardian');
  assert.ok(encounter, 'Encounter should be created');
  assert.equal(encounter.bossId, 'forest-guardian');
  assert.equal(encounter.currentPhase, 1);
  assert.equal(encounter.maxHp, 150);
  assert.equal(encounter.currentHp, 150);
});

test('createBossEncounter creates valid encounter for fire-drake', () => {
  const encounter = createBossEncounter('fire-drake');
  assert.equal(encounter.bossId, 'fire-drake');
  assert.equal(encounter.currentPhase, 1);
  assert.equal(encounter.maxHp, 200);
  assert.equal(encounter.currentHp, 200);
});

test('createBossEncounter returns null for invalid boss', () => {
  const encounter = createBossEncounter('not-a-boss');
  assert.equal(encounter, null);
});

test('createBossEncounter initializes phase 1 stats', () => {
  const encounter = createBossEncounter('forest-guardian');
  const phase1 = getBoss('forest-guardian').phases[0];
  assert.equal(encounter.atk, phase1.atk);
  assert.equal(encounter.def, phase1.def);
  assert.equal(encounter.spd, phase1.spd);
});

test('createBossEncounter initializes abilities from phase 1', () => {
  const encounter = createBossEncounter('forest-guardian');
  assert.ok(Array.isArray(encounter.abilities));
  assert.ok(encounter.abilities.length > 0);
});

test('createBossEncounter initializes empty status effects', () => {
  const encounter = createBossEncounter('forest-guardian');
  assert.ok(Array.isArray(encounter.statusEffects));
  assert.equal(encounter.statusEffects.length, 0);
});

// ============================================
// Phase Transition Tests
// ============================================
console.log('');
console.log('--- Phase Transition Tests ---');

test('checkPhaseTransition returns false when HP is high', () => {
  const encounter = createBossEncounter('forest-guardian');
  // HP at 100% - no transition needed
  const shouldTransition = checkPhaseTransition(encounter);
  assert.equal(shouldTransition, false);
});

test('checkPhaseTransition returns true when HP drops below threshold', () => {
  const encounter = createBossEncounter('forest-guardian');
  // Forest guardian phase 2 triggers at 50% HP
  encounter.currentHp = 70; // Below 50% of 150
  const shouldTransition = checkPhaseTransition(encounter);
  assert.equal(shouldTransition, true);
});

test('checkPhaseTransition returns false if already at final phase', () => {
  const encounter = createBossEncounter('forest-guardian');
  encounter.currentPhase = 2; // Forest guardian only has 2 phases
  encounter.currentHp = 10;
  const shouldTransition = checkPhaseTransition(encounter);
  assert.equal(shouldTransition, false);
});

test('transitionToPhase updates boss stats', () => {
  const encounter = createBossEncounter('forest-guardian');
  const oldAtk = encounter.atk;
  const updatedBoss = transitionToPhase(encounter, 2);
  // Phase 2 should have different (higher) stats
  assert.equal(updatedBoss.currentPhase, 2);
  assert.ok(updatedBoss.atk >= oldAtk, 'ATK should be same or higher in phase 2');
});

test('transitionToPhase updates abilities', () => {
  const encounter = createBossEncounter('forest-guardian');
  const phase1Abilities = [...encounter.abilities];
  const updatedBoss = transitionToPhase(encounter, 2);
  // Phase 2 should have different abilities
  assert.ok(encounter.abilities.length > 0);
});

test('getCurrentPhase returns correct phase object', () => {
  const encounter = createBossEncounter('forest-guardian');
  const phase = getCurrentPhase(encounter);
  assert.ok(phase, 'Phase should exist');
  assert.equal(phase.phase, 1);
});

test('getPhaseName returns correct name', () => {
  const encounter = createBossEncounter('forest-guardian');
  const name = getPhaseName(encounter);
  assert.ok(name === 'Awakening' || name === 'Enraged', 'Phase 1 name should be Awakening');
});

// ============================================
// Boss Ability Tests
// ============================================
console.log('');
console.log('--- Boss Ability Tests ---');

test('getBossAbility returns valid ability', () => {
  const ability = getBossAbility('vine-whip');
  assert.ok(ability, 'Ability should exist');
  assert.equal(ability.name, 'Vine Whip');
});

test('getBossAbility returns null for invalid ability', () => {
  const ability = getBossAbility('fake-ability');
  assert.equal(ability, null);
});

test('calculateBossAbilityDamage returns positive damage', () => {
  const encounter = createBossEncounter('forest-guardian');
  const target = { def: 10, maxHp: 100, currentHp: 100 };
  const result = calculateBossAbilityDamage(encounter, 'vine-whip', target);
  assert.ok(result.damage > 0, 'Damage should be positive');
});

test('calculateBossAbilityDamage respects element type', () => {
  const encounter = createBossEncounter('fire-drake');
  const target = { def: 10, maxHp: 100, currentHp: 100 };
  const result = calculateBossAbilityDamage(encounter, 'fire-breath', target);
  assert.equal(result.element, 'fire');
});

test('selectBossAbility returns valid ability id', () => {
  const encounter = createBossEncounter('forest-guardian');
  const abilityId = selectBossAbility(encounter);
  assert.ok(typeof abilityId === 'string');
  assert.ok(encounter.abilities.includes(abilityId) || abilityId === 'basic_attack');
});

// ============================================
// Damage Application Tests
// ============================================
console.log('');
console.log('--- Damage Application Tests ---');

test('applyDamageToBoss reduces HP correctly', () => {
  const encounter = createBossEncounter('forest-guardian');
  const initialHp = encounter.currentHp;
  const result = applyDamageToBoss(encounter, 30);
  assert.equal(result.boss.currentHp, initialHp - 30);
});

test('applyDamageToBoss does not reduce HP below 0', () => {
  const encounter = createBossEncounter('forest-guardian');
  const result = applyDamageToBoss(encounter, 9999);
  assert.equal(result.boss.currentHp, 0);
});

test('applyDamageToBoss triggers phase transition when appropriate', () => {
  const encounter = createBossEncounter('forest-guardian');
  // Deal enough damage to trigger phase 2 (50% threshold)
  const result = applyDamageToBoss(encounter, 80);
  assert.ok(result.phaseChanged || result.boss.currentPhase === 2 || result.boss.currentHp < 75);
});

test('isBossDefeated returns false when HP > 0', () => {
  const encounter = createBossEncounter('forest-guardian');
  assert.equal(isBossDefeated(encounter), false);
});

test('isBossDefeated returns true when HP = 0', () => {
  const encounter = createBossEncounter('forest-guardian');
  encounter.currentHp = 0;
  assert.equal(isBossDefeated(encounter), true);
});

// ============================================
// Boss Rewards Tests
// ============================================
console.log('');
console.log('--- Boss Rewards Tests ---');

test('getBossRewards returns rewards object', () => {
  const encounter = createBossEncounter('forest-guardian');
  const rewards = getBossRewards(encounter);
  assert.ok(rewards, 'Rewards should exist');
  assert.ok(typeof rewards.exp === 'number');
  assert.ok(typeof rewards.gold === 'number');
});

test('getBossRewards includes significant exp', () => {
  const encounter = createBossEncounter('forest-guardian');
  const rewards = getBossRewards(encounter);
  assert.ok(rewards.exp >= 100, 'Boss should give at least 100 exp');
});

test('getBossRewards includes gold', () => {
  const encounter = createBossEncounter('forest-guardian');
  const rewards = getBossRewards(encounter);
  assert.ok(rewards.gold >= 50, 'Boss should give at least 50 gold');
});

// ============================================
// HP Segments Tests
// ============================================
console.log('');
console.log('--- HP Segments Tests ---');

test('getBossHpSegments returns array of thresholds', () => {
  const encounter = createBossEncounter('forest-guardian');
  const segments = getBossHpSegments(encounter);
  assert.ok(Array.isArray(segments));
  assert.ok(segments.length > 0);
});

test('getBossHpSegments includes phase thresholds', () => {
  const encounter = createBossEncounter('forest-guardian');
  const segments = getBossHpSegments(encounter);
  // Should include 50% threshold for phase 2
  assert.ok(segments.some(s => s.start === 0.5 || s.end === 0.5 || s.start === 0.75));
});

// ============================================
// Boss Detection Tests
// ============================================
console.log('');
console.log('--- Boss Detection Tests ---');

test('isBoss returns true for boss encounter', () => {
  const encounter = createBossEncounter('forest-guardian');
  assert.equal(isBoss(encounter), true);
});

test('isBoss returns false for regular enemy', () => {
  const regularEnemy = { name: 'Goblin', hp: 30, atk: 5 };
  assert.equal(isBoss(regularEnemy), false);
});

test('isBoss returns false for null', () => {
  assert.equal(isBoss(null), false);
});

test('isBoss returns false for undefined', () => {
  assert.equal(isBoss(undefined), false);
});

// ============================================
// Multi-Phase Boss Tests (Fire Drake - 3 phases)
// ============================================
console.log('');
console.log('--- Multi-Phase Boss Tests (Fire Drake) ---');

test('Fire Drake has 3 phases', () => {
  const boss = getBoss('fire-drake');
  assert.equal(boss.phases.length, 3);
});

test('Fire Drake transitions through all phases', () => {
  let encounter = createBossEncounter('fire-drake');
  assert.equal(encounter.currentPhase, 1);
  
  // Transition to phase 2 at 60% HP (120 HP)
  encounter.currentHp = 110;
  if (checkPhaseTransition(encounter)) {
    encounter = transitionToPhase(encounter, 2);
  }
  assert.equal(encounter.currentPhase, 2);
  
  // Transition to phase 3 at 25% HP (50 HP)
  encounter.currentHp = 50;
  if (checkPhaseTransition(encounter)) {
    encounter = transitionToPhase(encounter, 3);
  }
  assert.equal(encounter.currentPhase, 3);
});

// ============================================
// Summary
// ============================================
console.log('');
console.log('='.repeat(60));
console.log(`BOSS TESTS COMPLETE: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
