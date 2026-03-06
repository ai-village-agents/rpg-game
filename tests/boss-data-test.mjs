/**
 * Boss Data Integrity Tests
 * Tests for src/data/bosses.js - Validates boss data structure and values
 */

import { strict as assert } from 'assert';
import { BOSSES, BOSS_ABILITIES, getBoss, getBossAbility, getAllBossIds } from '../src/data/bosses.js';

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

// Helper to iterate over bosses (BOSSES is an object)
const bossEntries = Object.entries(BOSSES);
const bossValues = Object.values(BOSSES);

console.log('='.repeat(60));
console.log('BOSS DATA INTEGRITY TESTS');
console.log('='.repeat(60));
console.log('');

// ============================================
// BOSSES Object Structure Tests
// ============================================
console.log('--- BOSSES Object Structure Tests ---');

test('BOSSES is a non-empty object', () => {
  assert.ok(typeof BOSSES === 'object');
  assert.ok(Object.keys(BOSSES).length > 0);
});

test('All bosses have required base properties', () => {
  const requiredProps = ['id', 'name', 'description', 'phases', 'xpReward', 'goldReward'];
  for (const [id, boss] of bossEntries) {
    for (const prop of requiredProps) {
      assert.ok(boss[prop] !== undefined, `Boss ${id} missing ${prop}`);
    }
  }
});

test('All boss IDs match their object keys', () => {
  for (const [key, boss] of bossEntries) {
    assert.equal(key, boss.id, `Boss key ${key} doesn't match id ${boss.id}`);
  }
});

test('All boss names are non-empty strings', () => {
  for (const boss of bossValues) {
    assert.ok(typeof boss.name === 'string' && boss.name.length > 0, 
      `Boss ${boss.id} has invalid name`);
  }
});

test('All bosses have isBoss flag set to true', () => {
  for (const boss of bossValues) {
    assert.equal(boss.isBoss, true, `Boss ${boss.id} should have isBoss=true`);
  }
});

// ============================================
// Boss Phase Structure Tests
// ============================================
console.log('');
console.log('--- Boss Phase Structure Tests ---');

test('All bosses have at least 2 phases', () => {
  for (const boss of bossValues) {
    assert.ok(boss.phases.length >= 2, `Boss ${boss.id} needs at least 2 phases`);
  }
});

test('All phases have required properties', () => {
  const requiredPhaseProps = ['phase', 'name', 'hpThreshold', 'maxHp', 'mp', 'atk', 'def', 'spd', 'abilities', 'aiBehavior'];
  for (const boss of bossValues) {
    for (const phase of boss.phases) {
      for (const prop of requiredPhaseProps) {
        assert.ok(phase[prop] !== undefined, 
          `Boss ${boss.id} phase ${phase.phase} missing ${prop}`);
      }
    }
  }
});

test('Phase numbers are sequential starting from 1', () => {
  for (const boss of bossValues) {
    const phaseNums = boss.phases.map(p => p.phase).sort((a, b) => a - b);
    for (let i = 0; i < phaseNums.length; i++) {
      assert.equal(phaseNums[i], i + 1, 
        `Boss ${boss.id} has non-sequential phases`);
    }
  }
});

test('First phase has hpThreshold of 1.0 (100%)', () => {
  for (const boss of bossValues) {
    const phase1 = boss.phases.find(p => p.phase === 1);
    assert.equal(phase1.hpThreshold, 1.0, 
      `Boss ${boss.id} phase 1 should have 1.0 (100%) HP threshold`);
  }
});

test('Later phases have lower HP thresholds', () => {
  for (const boss of bossValues) {
    let prevThreshold = 1.0;
    for (const phase of boss.phases.sort((a, b) => a.phase - b.phase)) {
      assert.ok(phase.hpThreshold <= prevThreshold, 
        `Boss ${boss.id} phase ${phase.phase} threshold should be <= previous`);
      prevThreshold = phase.hpThreshold;
    }
  }
});

// ============================================
// Boss Stats Validation Tests
// ============================================
console.log('');
console.log('--- Boss Stats Validation Tests ---');

test('All phase stats are positive numbers', () => {
  const statProps = ['maxHp', 'mp', 'atk', 'def', 'spd'];
  for (const boss of bossValues) {
    for (const phase of boss.phases) {
      for (const stat of statProps) {
        assert.ok(typeof phase[stat] === 'number' && phase[stat] > 0, 
          `Boss ${boss.id} phase ${phase.phase} has invalid ${stat}: ${phase[stat]}`);
      }
    }
  }
});

test('Boss HP is significantly higher than regular enemies (>=100)', () => {
  for (const boss of bossValues) {
    const phase1 = boss.phases[0];
    assert.ok(phase1.maxHp >= 100, 
      `Boss ${boss.id} HP ${phase1.maxHp} should be >= 100`);
  }
});

test('Later phases have equal or higher ATK (DEF may decrease for enraged phases)', () => {
  const combatStats = ['atk'];
  for (const boss of bossValues) {
    const sortedPhases = [...boss.phases].sort((a, b) => a.phase - b.phase);
    for (let i = 1; i < sortedPhases.length; i++) {
      for (const stat of combatStats) {
        assert.ok(sortedPhases[i][stat] >= sortedPhases[i-1][stat], 
          `Boss ${boss.id} phase ${sortedPhases[i].phase} ${stat} should be >= previous phase`);
      }
    }
  }
});

// ============================================
// Boss Abilities Validation Tests
// ============================================
console.log('');
console.log('--- Boss Abilities Validation Tests ---');

test('BOSS_ABILITIES is a non-empty object', () => {
  assert.ok(typeof BOSS_ABILITIES === 'object');
  assert.ok(Object.keys(BOSS_ABILITIES).length > 0);
});

test('All phase abilities reference valid BOSS_ABILITIES', () => {
  for (const boss of bossValues) {
    for (const phase of boss.phases) {
      for (const abilityId of phase.abilities) {
        assert.ok(BOSS_ABILITIES[abilityId], 
          `Boss ${boss.id} phase ${phase.phase} references invalid ability: ${abilityId}`);
      }
    }
  }
});

test('All phases have at least 2 abilities', () => {
  for (const boss of bossValues) {
    for (const phase of boss.phases) {
      assert.ok(phase.abilities.length >= 2, 
        `Boss ${boss.id} phase ${phase.phase} needs at least 2 abilities`);
    }
  }
});

test('BOSS_ABILITIES have required properties', () => {
  const requiredProps = ['name', 'power', 'element', 'description'];
  for (const [id, ability] of Object.entries(BOSS_ABILITIES)) {
    for (const prop of requiredProps) {
      assert.ok(ability[prop] !== undefined, 
        `Ability ${id} missing ${prop}`);
    }
  }
});

test('All ability powers are non-negative numbers', () => {
  for (const [id, ability] of Object.entries(BOSS_ABILITIES)) {
    assert.ok(typeof ability.power === 'number' && ability.power >= 0, 
      `Ability ${id} has invalid power: ${ability.power}`);
  }
});

test('All ability elements are valid types', () => {
  const validElements = ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy', 'none'];
  for (const [id, ability] of Object.entries(BOSS_ABILITIES)) {
    assert.ok(validElements.includes(ability.element), 
      `Ability ${id} has invalid element: ${ability.element}`);
  }
});

// ============================================
// AI Behavior Validation Tests
// ============================================
console.log('');
console.log('--- AI Behavior Validation Tests ---');

test('All aiBehavior properties are valid types', () => {
  const validBehaviors = ['basic', 'aggressive', 'defensive', 'balanced', 'caster', 'berserk'];
  for (const boss of bossValues) {
    for (const phase of boss.phases) {
      assert.ok(validBehaviors.includes(phase.aiBehavior), 
        `Boss ${boss.id} phase ${phase.phase} has invalid aiBehavior: ${phase.aiBehavior}`);
    }
  }
});

// ============================================
// Boss Rewards Validation Tests
// ============================================
console.log('');
console.log('--- Boss Rewards Validation Tests ---');

test('All bosses have xpReward and goldReward', () => {
  for (const boss of bossValues) {
    assert.ok(boss.xpReward !== undefined, `Boss ${boss.id} missing xpReward`);
    assert.ok(typeof boss.xpReward === 'number' && boss.xpReward > 0, 
      `Boss ${boss.id} missing or invalid exp reward`);
    assert.ok(typeof boss.goldReward === 'number' && boss.goldReward > 0, 
      `Boss ${boss.id} missing or invalid gold reward`);
  }
});

test('Boss xpReward is significant (>=100)', () => {
  for (const boss of bossValues) {
    assert.ok(boss.xpReward >= 100, 
      `Boss ${boss.id} exp ${boss.xpReward} should be >= 100`);
  }
});

test('Boss goldReward is significant (>=50)', () => {
  for (const boss of bossValues) {
    assert.ok(boss.goldReward >= 50, 
      `Boss ${boss.id} gold ${boss.goldReward} should be >= 50`);
  }
});

// ============================================
// Easter Egg Detection (Saboteur Check)
// ============================================
console.log('');
console.log('--- Easter Egg Detection (Saboteur Check) ---');

test('No easter egg keywords in boss names', () => {
  const eggPatterns = /\b(egg|easter|rabbit|bunny|hunt|basket)\b/i;
  for (const boss of bossValues) {
    assert.ok(!eggPatterns.test(boss.name), 
      `Boss ${boss.id} name contains easter egg keyword`);
  }
});

test('No easter egg keywords in boss descriptions', () => {
  const eggPatterns = /\b(egg|easter|rabbit|bunny|hunt|basket)\b/i;
  for (const boss of bossValues) {
    assert.ok(!eggPatterns.test(boss.description), 
      `Boss ${boss.id} description contains easter egg keyword`);
  }
});

test('No easter egg keywords in ability names', () => {
  const eggPatterns = /\b(egg|easter|rabbit|bunny|hunt|basket)\b/i;
  for (const [id, ability] of Object.entries(BOSS_ABILITIES)) {
    assert.ok(!eggPatterns.test(ability.name), 
      `Ability ${id} name contains easter egg keyword`);
  }
});

test('No easter egg keywords in ability descriptions', () => {
  const eggPatterns = /\b(egg|easter|rabbit|bunny|hunt|basket)\b/i;
  for (const [id, ability] of Object.entries(BOSS_ABILITIES)) {
    assert.ok(!eggPatterns.test(ability.description), 
      `Ability ${id} description contains easter egg keyword`);
  }
});

test('No obfuscation patterns in boss data', () => {
  const obfuscationPatterns = /(atob|btoa|eval\(|Function\(|fromCharCode)/;
  const bossString = JSON.stringify(BOSSES);
  assert.ok(!obfuscationPatterns.test(bossString), 
    'Boss data contains obfuscation patterns');
});

test('No suspicious whitespace patterns', () => {
  const bossString = JSON.stringify(BOSSES);
  const spaceCount = (bossString.match(/ /g) || []).length;
  const totalLength = bossString.length;
  const spaceRatio = spaceCount / totalLength;
  assert.ok(spaceRatio < 0.3, 
    `Suspicious whitespace ratio: ${(spaceRatio * 100).toFixed(1)}%`);
});

// ============================================
// Helper Function Tests
// ============================================
console.log('');
console.log('--- Helper Function Tests ---');

test('getBoss returns correct boss by id', () => {
  const boss = getBoss('forest-guardian');
  assert.equal(boss.name, 'Forest Guardian');
});

test('getBoss returns null for invalid boss', () => {
  const boss = getBoss('not-a-real-boss');
  assert.equal(boss, null);
});

test('getBossAbility returns correct ability by id', () => {
  const ability = getBossAbility('vine-whip');
  assert.equal(ability.name, 'Vine Whip');
});

test('getBossAbility returns null for invalid ability', () => {
  const ability = getBossAbility('not-a-real-ability');
  assert.equal(ability, null);
});

test('getAllBossIds returns array of all boss ids', () => {
  const ids = getAllBossIds();
  assert.equal(ids.length, Object.keys(BOSSES).length);
  for (const id of Object.keys(BOSSES)) {
    assert.ok(ids.includes(id));
  }
});

// ============================================
// Summary
// ============================================
console.log('');
console.log('='.repeat(60));
console.log(`BOSS DATA TESTS COMPLETE: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
