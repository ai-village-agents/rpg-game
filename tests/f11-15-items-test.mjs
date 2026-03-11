/**
 * F11-15 Tier Items Tests
 * Validates presence, structure, rarity tiers, and loot table placement for new items.
 */

import { items } from '../src/data/items.js';
import { ENEMY_DROP_TABLES } from '../src/loot-tables.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ ${msg}`);
  }
}

const tierItems = [
  'twilightBlade',
  'sanctumPlate',
  'twilightCrystal',
  'labyrinthinStaff',
  'arcaneSentinelArmor',
  'runeInscribedRing',
  'voidReaper',
  'voidforgedMail',
  'thresholdPendant',
  'celestialBlade',
  'celestialPlate',
  'celestialSignet',
  'oblivionEdge',
  'eternityArmor',
  'oblivionCrown',
  'voidElixir',
  'celestialVial',
  'oblivionShard',
];

const equipmentTypes = new Set(['weapon', 'armor', 'accessory']);

// ============================================================
console.log('\nF11-15 items exist in items data:');
// ============================================================

for (const itemId of tierItems) {
  assert(items[itemId] !== undefined, `Item exists: ${itemId}`);
}

// ============================================================
console.log('\nRequired fields + stats for equipment:');
// ============================================================

for (const itemId of tierItems) {
  const item = items[itemId];
  if (!item) continue;

  assert(typeof item.id === 'string', `${itemId}: has id`);
  assert(typeof item.name === 'string', `${itemId}: has name`);
  assert(typeof item.type === 'string', `${itemId}: has type`);
  assert(typeof item.rarity === 'string', `${itemId}: has rarity`);
  assert(typeof item.value === 'number', `${itemId}: has value`);

  if (equipmentTypes.has(item.type)) {
    assert(typeof item.stats === 'object' && item.stats !== null, `${itemId}: equipment has stats object`);
  }
}

// ============================================================
console.log('\nRarity progression by floor tier:');
// ============================================================

const f11Items = ['twilightBlade', 'sanctumPlate', 'twilightCrystal'];
const f12Items = ['labyrinthinStaff', 'arcaneSentinelArmor', 'runeInscribedRing'];
const f13Items = ['voidReaper', 'voidforgedMail', 'thresholdPendant'];
const f14Items = ['celestialBlade', 'celestialPlate', 'celestialSignet'];
const f15Items = ['oblivionEdge', 'eternityArmor', 'oblivionCrown'];

for (const itemId of f11Items) {
  const rarity = items[itemId]?.rarity;
  assert(rarity === 'Epic' || rarity === 'Rare', `${itemId}: F11 rarity is Epic/Rare`);
}

for (const itemId of f12Items) {
  const rarity = items[itemId]?.rarity;
  assert(rarity === 'Epic' || rarity === 'Legendary', `${itemId}: F12 rarity is Epic/Legendary`);
}

for (const itemId of f13Items) {
  const rarity = items[itemId]?.rarity;
  assert(rarity === 'Epic' || rarity === 'Legendary', `${itemId}: F13 rarity is Epic/Legendary`);
}

for (const itemId of f14Items) {
  const rarity = items[itemId]?.rarity;
  assert(rarity === 'Legendary', `${itemId}: F14 rarity is Legendary`);
}

for (const itemId of f15Items) {
  const rarity = items[itemId]?.rarity;
  assert(rarity === 'Legendary', `${itemId}: F15 rarity is Legendary`);
}

// ============================================================
console.log('\nEnemy loot table placement:');
// ============================================================

function dropIds(enemyId) {
  const table = ENEMY_DROP_TABLES[enemyId];
  return table ? table.drops.map(d => d.itemId) : [];
}

const crystalSentinelDrops = dropIds('crystal-sentinel');
assert(crystalSentinelDrops.includes('twilightBlade'), 'crystal-sentinel drops twilightBlade');
assert(crystalSentinelDrops.includes('sanctumPlate'), 'crystal-sentinel drops sanctumPlate');

const emberDrakeDrops = dropIds('ember-drake');
assert(emberDrakeDrops.includes('twilightCrystal'), 'ember-drake drops twilightCrystal');

const arcaneGuardianDrops = dropIds('arcane-guardian');
assert(arcaneGuardianDrops.includes('labyrinthinStaff'), 'arcane-guardian drops labyrinthinStaff');
assert(arcaneGuardianDrops.includes('arcaneSentinelArmor'), 'arcane-guardian drops arcaneSentinelArmor');

const voidKnightDrops = dropIds('void-knight');
assert(voidKnightDrops.includes('voidReaper'), 'void-knight drops voidReaper');
assert(voidKnightDrops.includes('voidforgedMail'), 'void-knight drops voidforgedMail');

const abyssalWardenDrops = dropIds('abyssal-warden');
assert(abyssalWardenDrops.includes('celestialBlade'), 'abyssal-warden drops celestialBlade');

const oblivionLordDrops = dropIds('oblivion-lord');
assert(oblivionLordDrops.includes('oblivionEdge'), 'oblivion-lord drops oblivionEdge');
assert(oblivionLordDrops.includes('oblivionCrown'), 'oblivion-lord drops oblivionCrown');
assert(oblivionLordDrops.includes('celestialVial'), 'oblivion-lord drops celestialVial');

// ============================================================
console.log('\nConsumables and crafting materials:');
// ============================================================

const voidElixir = items.voidElixir;
assert(voidElixir?.type === 'consumable', 'voidElixir is a consumable');
assert(typeof voidElixir?.effect === 'object' && typeof voidElixir?.effect?.heal === 'number',
  'voidElixir has a healing effect');

const celestialVial = items.celestialVial;
assert(celestialVial?.type === 'consumable', 'celestialVial is a consumable');
assert(typeof celestialVial?.effect === 'object' && typeof celestialVial?.effect?.heal === 'number',
  'celestialVial has a healing effect');

const oblivionShard = items.oblivionShard;
assert(oblivionShard?.type === 'consumable', 'oblivionShard is a consumable');
assert(oblivionShard?.effect?.craftingMaterial === true, 'oblivionShard is a crafting material');

// ============================================================
console.log('\n==================================================');
console.log(`# tests ${passed + failed}`);
console.log(`# pass ${passed}`);
console.log(`# fail ${failed}`);
process.exit(failed > 0 ? 1 : 0);
