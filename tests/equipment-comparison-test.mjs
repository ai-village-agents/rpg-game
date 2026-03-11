// Equipment Comparison Tests
// Tests for getEquipmentComparison() in src/inventory.js
// Created by Claude Opus 4.6 (Day 344)

import { getEquipmentComparison } from '../src/inventory.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

function test(name, fn) {
  try {
    fn();
  } catch (e) {
    failed++;
    console.error(`  FAIL: ${name} - ${e.message}`);
  }
}

console.log('=== Equipment Comparison Tests ===');

test('returns null for invalid item', () => {
  const result = getEquipmentComparison({ weapon: null, armor: null, accessory: null }, 'nonexistent_item_xyz');
  assert(result === null, 'should return null for invalid item');
});

test('returns null for non-equippable item (consumable)', () => {
  const result = getEquipmentComparison({ weapon: null, armor: null, accessory: null }, 'healthPotion');
  assert(result === null, 'should return null for consumable items');
});

test('compares weapon against empty slot', () => {
  const equipment = { weapon: null, armor: null, accessory: null };
  const result = getEquipmentComparison(equipment, 'rustySword');
  assert(result !== null, 'should return comparison object');
  assert(result.slot === 'weapon', 'slot should be weapon');
  assert(result.currentItemName === null, 'currentItemName should be null when nothing equipped');
  assert(Array.isArray(result.comparisons), 'comparisons should be an array');
  const atkComp = result.comparisons.find(c => c.stat === 'attack');
  assert(atkComp !== undefined, 'should have attack comparison');
  assert(atkComp.current === 0, 'current attack should be 0 when nothing equipped');
  assert(atkComp.candidate === 5, 'candidate attack should be 5 for Rusty Sword');
  assert(atkComp.diff === 5, 'diff should be +5 attack');
});

test('compares weapon against equipped weapon (upgrade)', () => {
  const equipment = { weapon: 'rustySword', armor: null, accessory: null };
  const result = getEquipmentComparison(equipment, 'ironSword');
  assert(result !== null, 'should return comparison object');
  assert(result.slot === 'weapon', 'slot should be weapon');
  assert(result.currentItemName === 'Rusty Sword', 'should show current item name');
  const atkComp = result.comparisons.find(c => c.stat === 'attack');
  assert(atkComp !== undefined, 'should have attack comparison');
  assert(atkComp.current === 5, 'current attack should be 5');
  assert(atkComp.candidate === 12, 'candidate attack should be 12');
  assert(atkComp.diff === 7, 'diff should be +7 attack');
});

test('compares weapon against equipped weapon (downgrade)', () => {
  const equipment = { weapon: 'ironSword', armor: null, accessory: null };
  const result = getEquipmentComparison(equipment, 'rustySword');
  assert(result !== null, 'should return comparison object');
  const atkComp = result.comparisons.find(c => c.stat === 'attack');
  assert(atkComp.diff === -7, 'diff should be -7 attack for downgrade');
});

test('handles stats present on one item but not the other', () => {
  // huntersBow has attack, speed, critChance; rustySword has attack, critChance
  const equipment = { weapon: 'rustySword', armor: null, accessory: null };
  const result = getEquipmentComparison(equipment, 'huntersBow');
  assert(result !== null, 'should return comparison');
  const speedComp = result.comparisons.find(c => c.stat === 'speed');
  assert(speedComp !== undefined, 'should include speed stat even if only on one item');
  assert(speedComp.current === 0, 'current speed should be 0 (rustySword has no speed)');
  assert(speedComp.candidate === 3, 'candidate speed should be 3');
  assert(speedComp.diff === 3, 'diff should be +3 speed');
});

test('compares armor items', () => {
  const equipment = { weapon: null, armor: 'leatherArmor', accessory: null };
  const result = getEquipmentComparison(equipment, 'chainmail');
  assert(result !== null, 'should return comparison');
  assert(result.slot === 'armor', 'slot should be armor');
  assert(result.currentItemName === 'Leather Armor', 'should show Leather Armor as current');
  const defComp = result.comparisons.find(c => c.stat === 'defense');
  assert(defComp !== undefined, 'should have defense comparison');
  assert(defComp.diff > 0, 'chainmail should be better defense than leather');
});

test('compares same item against itself', () => {
  const equipment = { weapon: 'rustySword', armor: null, accessory: null };
  const result = getEquipmentComparison(equipment, 'rustySword');
  assert(result !== null, 'should return comparison');
  const allZero = result.comparisons.every(c => c.diff === 0);
  assert(allZero, 'all diffs should be 0 when comparing same item');
});

test('handles null equipment object', () => {
  const result = getEquipmentComparison(null, 'rustySword');
  assert(result !== null, 'should handle null equipment');
  assert(result.currentItemName === null, 'currentItemName should be null');
  const atkComp = result.comparisons.find(c => c.stat === 'attack');
  assert(atkComp.current === 0, 'current should be 0 with null equipment');
  assert(atkComp.candidate === 5, 'candidate should be 5 for Rusty Sword');
});

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);
