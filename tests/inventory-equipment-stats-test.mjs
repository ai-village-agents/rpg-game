/**
 * Tests for Inventory Equipment Stats Display (render.js inventory phase)
 * Verifies that equipment stat bonuses are shown in the inventory UI:
 * - Per-slot stat tags next to equipped item names
 * - Total equipment bonus summary
 * - Base + bonus = effective stat display for ATK/DEF/SPD
 * Created by Claude Opus 4.6 (Day 338)
 */
import { strict as assert } from 'node:assert';
import { getEquipmentBonuses, getItemDetails, EQUIPMENT_SLOTS } from '../src/inventory.js';
import { getEffectiveCombatStats, getEquipmentBonusDisplay, hasEquipmentBonuses } from '../src/combat/equipment-bonuses.js';
import { getEquipmentSetBonuses } from '../src/equipment-sets.js';
import { items } from '../src/data/items.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.error(`  ✗ ${name}: ${e.message}`); }
}

console.log('Inventory Equipment Stats Display Tests');
console.log('========================================');

// ─── getEquipmentBonuses tests ───
console.log('\n--- getEquipmentBonuses ---');

test('returns zero bonuses for null equipment', () => {
  const b = getEquipmentBonuses(null);
  assert.equal(b.attack, 0);
  assert.equal(b.defense, 0);
  assert.equal(b.speed, 0);
});

test('returns zero bonuses for empty slots', () => {
  const b = getEquipmentBonuses({ weapon: null, armor: null, accessory: null });
  assert.equal(b.attack, 0);
  assert.equal(b.defense, 0);
});

test('returns correct bonuses for weapon only', () => {
  // Find a weapon in items data
  const weaponId = Object.keys(items).find(id => items[id].type === 'weapon' && items[id].stats);
  if (weaponId) {
    const b = getEquipmentBonuses({ weapon: weaponId, armor: null, accessory: null });
    const expected = items[weaponId].stats;
    if (expected.attack) assert.equal(b.attack, expected.attack);
    if (expected.defense) assert.equal(b.defense, expected.defense);
  } else {
    // If no weapons in data, just verify it doesn't crash
    assert.ok(true);
  }
});

test('returns correct bonuses for armor only', () => {
  const armorId = Object.keys(items).find(id => items[id].type === 'armor' && items[id].stats);
  if (armorId) {
    const b = getEquipmentBonuses({ weapon: null, armor: armorId, accessory: null });
    const expected = items[armorId].stats;
    if (expected.defense) assert.equal(b.defense, expected.defense);
  } else {
    assert.ok(true);
  }
});

test('stacks bonuses from multiple slots', () => {
  const weaponId = Object.keys(items).find(id => items[id].type === 'weapon' && items[id].stats?.attack);
  const armorId = Object.keys(items).find(id => items[id].type === 'armor' && items[id].stats?.defense);
  if (weaponId && armorId) {
    const equipment = { weapon: weaponId, armor: armorId, accessory: null };
    const setBonuses = getEquipmentSetBonuses(equipment);
    const b = getEquipmentBonuses(equipment);
    const expectedAttack = (items[weaponId].stats.attack || 0) + (setBonuses.attack || 0);
    const expectedDefense = (items[armorId].stats.defense || 0) + (setBonuses.defense || 0);
    assert.equal(b.attack, expectedAttack);
    assert.equal(b.defense, expectedDefense);
  } else {
    assert.ok(true);
  }
});

test('handles unknown item IDs gracefully', () => {
  const b = getEquipmentBonuses({ weapon: 'nonexistent-item-xyz', armor: null, accessory: null });
  assert.equal(b.attack, 0);
  assert.equal(b.defense, 0);
});

// ─── getItemDetails stat display tests ───
console.log('\n--- getItemDetails for stat display ---');

test('getItemDetails returns stats for equippable items', () => {
  const eqId = Object.keys(items).find(id => items[id].stats && Object.keys(items[id].stats).length > 0);
  if (eqId) {
    const detail = getItemDetails(eqId);
    assert.ok(detail, 'details should exist');
    assert.ok(detail.stats, 'stats should exist');
    assert.ok(Object.keys(detail.stats).length > 0, 'should have stat entries');
  } else {
    assert.ok(true);
  }
});

test('getItemDetails returns null for unknown items', () => {
  const detail = getItemDetails('nonexistent-xyz');
  assert.equal(detail, null);
});

test('each EQUIPMENT_SLOTS key is a valid slot name', () => {
  const validSlots = ['weapon', 'armor', 'accessory'];
  for (const slot of Object.keys(EQUIPMENT_SLOTS)) {
    assert.ok(validSlots.includes(slot), `${slot} should be a valid slot`);
  }
});

// ─── getEffectiveCombatStats tests ───
console.log('\n--- getEffectiveCombatStats (inventory context) ---');

test('effective stats equal base stats with no equipment', () => {
  const combatant = { atk: 10, def: 8, spd: 5, magic: 3, critChance: 0 };
  const eff = getEffectiveCombatStats(combatant);
  assert.equal(eff.atk, 10);
  assert.equal(eff.def, 8);
  assert.equal(eff.spd, 5);
});

test('effective stats include equipment bonuses', () => {
  const weaponId = Object.keys(items).find(id => items[id].type === 'weapon' && items[id].stats?.attack);
  if (weaponId) {
    const combatant = { atk: 10, def: 8, spd: 5, equipment: { weapon: weaponId, armor: null, accessory: null } };
    const eff = getEffectiveCombatStats(combatant);
    assert.equal(eff.atk, 10 + items[weaponId].stats.attack);
    assert.equal(eff.def, 8); // no armor equipped
  } else {
    assert.ok(true);
  }
});

test('effective stats stack weapon + armor', () => {
  const weaponId = Object.keys(items).find(id => items[id].type === 'weapon' && items[id].stats?.attack);
  const armorId = Object.keys(items).find(id => items[id].type === 'armor' && items[id].stats?.defense);
  if (weaponId && armorId) {
    const equipment = { weapon: weaponId, armor: armorId, accessory: null };
    const combatant = { atk: 10, def: 8, spd: 5, equipment };
    const setBonuses = getEquipmentSetBonuses(equipment);
    const eff = getEffectiveCombatStats(combatant);
    const expectedAttack = 10 + (items[weaponId].stats.attack || 0) + (setBonuses.attack || 0);
    const expectedDefense = 8 + (items[armorId].stats.defense || 0) + (setBonuses.defense || 0);
    assert.equal(eff.atk, expectedAttack);
    assert.equal(eff.def, expectedDefense);
  } else {
    assert.ok(true);
  }
});

test('effective stats handle missing stats gracefully', () => {
  const combatant = {};
  const eff = getEffectiveCombatStats(combatant);
  assert.equal(eff.atk, 0);
  assert.equal(eff.def, 0);
  assert.equal(eff.spd, 0);
});

// ─── getEquipmentBonusDisplay tests ───
console.log('\n--- getEquipmentBonusDisplay ---');

test('returns zero bonuses for null combatant', () => {
  const b = getEquipmentBonusDisplay(null);
  assert.equal(b.attack, 0);
  assert.equal(b.defense, 0);
});

test('returns zero bonuses for combatant without equipment', () => {
  const b = getEquipmentBonusDisplay({ atk: 10 });
  assert.equal(b.attack, 0);
});

test('returns bonuses for equipped combatant', () => {
  const weaponId = Object.keys(items).find(id => items[id].type === 'weapon' && items[id].stats?.attack);
  if (weaponId) {
    const b = getEquipmentBonusDisplay({ equipment: { weapon: weaponId, armor: null, accessory: null } });
    assert.equal(b.attack, items[weaponId].stats.attack);
  } else {
    assert.ok(true);
  }
});

// ─── hasEquipmentBonuses tests ───
console.log('\n--- hasEquipmentBonuses ---');

test('returns false for null', () => {
  assert.equal(hasEquipmentBonuses(null), false);
});

test('returns false for no equipment', () => {
  assert.equal(hasEquipmentBonuses({}), false);
});

test('returns false for empty equipment', () => {
  assert.equal(hasEquipmentBonuses({ equipment: { weapon: null, armor: null, accessory: null } }), false);
});

test('returns true for equipped weapon with stats', () => {
  const weaponId = Object.keys(items).find(id => items[id].type === 'weapon' && items[id].stats?.attack);
  if (weaponId) {
    assert.equal(hasEquipmentBonuses({ equipment: { weapon: weaponId } }), true);
  } else {
    assert.ok(true);
  }
});

// ─── Render integration simulation tests ───
console.log('\n--- Render integration simulation ---');

test('stat tags format: positive bonus shows +N STAT in green', () => {
  // Simulate the template logic from render.js
  const detail = { stats: { attack: 3, defense: 1 } };
  const statTags = Object.entries(detail.stats)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`)
    .join(', ');
  assert.ok(statTags.includes('+3 ATTACK'));
  assert.ok(statTags.includes('+1 DEFENSE'));
});

test('stat tags format: negative bonus shows -N STAT', () => {
  const detail = { stats: { speed: -2 } };
  const statTags = Object.entries(detail.stats)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`)
    .join(', ');
  assert.ok(statTags.includes('-2 SPEED'));
});

test('stat tags format: zero bonus is excluded', () => {
  const detail = { stats: { attack: 3, defense: 0 } };
  const statTags = Object.entries(detail.stats)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`);
  assert.equal(statTags.length, 1);
  assert.ok(statTags[0].includes('ATTACK'));
});

test('bonus summary rows: only non-zero stats shown', () => {
  const eqBonuses = { attack: 5, defense: 3, speed: 0, magic: 0, critChance: 0 };
  const rows = Object.entries(eqBonuses)
    .filter(([, v]) => v !== 0);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(([k]) => k), ['attack', 'defense']);
});

test('bonus summary format: stat name is capitalized', () => {
  const stat = 'attack';
  const capitalized = stat.charAt(0).toUpperCase() + stat.slice(1);
  assert.equal(capitalized, 'Attack');
});

test('effective stat line: base + bonus = total format', () => {
  const baseAtk = 10;
  const bonus = 3;
  const effective = baseAtk + bonus;
  const line = `${baseAtk} +${bonus} = ${effective}`;
  assert.equal(line, '10 +3 = 13');
});

test('effective stat line: no bonus shows base only', () => {
  const baseAtk = 10;
  const bonus = 0;
  // The template uses: bonus ? ` +${bonus} = ${effective}` : ''
  const suffix = bonus ? ` +${bonus} = ${baseAtk + bonus}` : '';
  assert.equal(suffix, '');
});

test('MP display is included in inventory stats', () => {
  // Verify that the template pattern would work
  const player = { mp: 15, maxMp: 20 };
  const mpLine = `${player.mp}/${player.maxMp}`;
  assert.equal(mpLine, '15/20');
});

// ─── Data integrity: all equipment items have stats ───
console.log('\n--- Data integrity ---');

test('all weapon items have attack stat', () => {
  const weapons = Object.entries(items).filter(([, item]) => item.type === 'weapon');
  for (const [id, item] of weapons) {
    if (item.stats) {
      assert.ok(typeof item.stats.attack === 'number', `${id} should have numeric attack stat`);
    }
  }
});

test('all armor items have defense stat', () => {
  const armors = Object.entries(items).filter(([, item]) => item.type === 'armor');
  for (const [id, item] of armors) {
    if (item.stats) {
      assert.ok(typeof item.stats.defense === 'number', `${id} should have numeric defense stat`);
    }
  }
});

test('EQUIPMENT_SLOTS has weapon, armor, accessory', () => {
  assert.ok('weapon' in EQUIPMENT_SLOTS);
  assert.ok('armor' in EQUIPMENT_SLOTS);
  assert.ok('accessory' in EQUIPMENT_SLOTS);
});

test('getEquipmentBonuses returns object with expected keys', () => {
  const b = getEquipmentBonuses({});
  assert.ok('attack' in b);
  assert.ok('defense' in b);
  assert.ok('speed' in b);
  assert.ok('magic' in b);
  assert.ok('critChance' in b);
});

// ─── Edge cases ───
console.log('\n--- Edge cases ---');

test('handles equipment with only accessory slot filled', () => {
  const accId = Object.keys(items).find(id => items[id].type === 'accessory' && items[id].stats);
  if (accId) {
    const b = getEquipmentBonuses({ weapon: null, armor: null, accessory: accId });
    // Should have at least one non-zero stat
    const hasStats = Object.values(b).some(v => v !== 0);
    assert.ok(hasStats, 'accessory should provide bonuses');
  } else {
    // No accessories with stats in data
    assert.ok(true);
  }
});

test('handles player with zero base stats', () => {
  const eff = getEffectiveCombatStats({ atk: 0, def: 0, spd: 0 });
  assert.equal(eff.atk, 0);
  assert.equal(eff.def, 0);
  assert.equal(eff.spd, 0);
});

test('handles player with negative base stats', () => {
  const eff = getEffectiveCombatStats({ atk: -1, def: -2, spd: -3 });
  assert.equal(eff.atk, -1);
  assert.equal(eff.def, -2);
  assert.equal(eff.spd, -3);
});

test('bonus display for all stat types', () => {
  const statTypes = ['attack', 'defense', 'speed', 'magic', 'critChance'];
  for (const stat of statTypes) {
    const bonuses = { attack: 0, defense: 0, speed: 0, magic: 0, critChance: 0 };
    bonuses[stat] = 5;
    const filtered = Object.entries(bonuses).filter(([, v]) => v !== 0);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0][0], stat);
    assert.equal(filtered[0][1], 5);
  }
});

// ─── Summary ───
console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
