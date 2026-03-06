/**
 * Enemy Data Integrity Tests - AI Village RPG
 *
 * Purpose: catch data-entry mistakes early (unknown ability IDs, mismatched IDs,
 * invalid aiBehavior, etc.).
 *
 * Run: node tests/enemy-data-integrity-test.mjs
 */

import { ENEMIES } from '../src/data/enemies.js';
import { getAbility } from '../src/combat/abilities.js';

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

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

const VALID_AI_BEHAVIORS = new Set(['basic', 'aggressive', 'caster', 'support', 'boss']);

console.log('\n--- Enemy Data Integrity ---');

const enemyEntries = Object.entries(ENEMIES);
assert(enemyEntries.length > 0, 'ENEMIES has at least one entry');

for (const [key, enemy] of enemyEntries) {
  assert(enemy && typeof enemy === 'object', `${key}: enemy is an object`);

  assert(enemy.id === key, `${key}: enemy.id matches ENEMIES key`);
  assert(typeof enemy.name === 'string' && enemy.name.trim().length > 0, `${key}: name is non-empty`);

  assert(isFiniteNumber(enemy.hp) && enemy.hp > 0, `${key}: hp is a positive number`);
  assert(isFiniteNumber(enemy.maxHp) && enemy.maxHp >= enemy.hp, `${key}: maxHp is >= hp`);

  assert(isFiniteNumber(enemy.mp) && enemy.mp >= 0, `${key}: mp is a non-negative number`);
  assert(isFiniteNumber(enemy.maxMp) && enemy.maxMp >= enemy.mp, `${key}: maxMp is >= mp`);

  assert(isFiniteNumber(enemy.atk) && enemy.atk >= 0, `${key}: atk is a number`);
  assert(isFiniteNumber(enemy.def) && enemy.def >= 0, `${key}: def is a number`);
  assert(isFiniteNumber(enemy.spd) && enemy.spd >= 0, `${key}: spd is a number`);

  assert(typeof enemy.element === 'string' && enemy.element.trim().length > 0, `${key}: element is non-empty`);

  assert(isFiniteNumber(enemy.xpReward) && enemy.xpReward >= 0, `${key}: xpReward is a non-negative number`);
  assert(isFiniteNumber(enemy.goldReward) && enemy.goldReward >= 0, `${key}: goldReward is a non-negative number`);

  assert(VALID_AI_BEHAVIORS.has(enemy.aiBehavior), `${key}: aiBehavior is one of ${[...VALID_AI_BEHAVIORS].join(', ')}`);

  const abilityIds = enemy.abilities;
  assert(Array.isArray(abilityIds), `${key}: abilities is an array`);
  assert(abilityIds.length > 0, `${key}: abilities is non-empty`);

  // Validate each ability ID resolves.
  const seen = new Set();
  for (const abilityId of abilityIds) {
    assert(typeof abilityId === 'string' && abilityId.trim().length > 0, `${key}: ability id is a non-empty string`);
    assert(!seen.has(abilityId), `${key}: ability id '${abilityId}' is not duplicated`);
    seen.add(abilityId);

    const ability = getAbility(abilityId);
    assert(Boolean(ability), `${key}: getAbility('${abilityId}') resolves`);

    if (ability) {
      assert(typeof ability.name === 'string' && ability.name.trim().length > 0, `${key}: ability '${abilityId}' has name`);
      assert(isFiniteNumber(ability.mpCost) && ability.mpCost >= 0, `${key}: ability '${abilityId}' has non-negative mpCost`);
    }
  }

}

console.log(`\nEnemy Data Integrity Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
