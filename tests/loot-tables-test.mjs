/**
 * Loot / Drop Table System Tests
 * Tests for enemy-specific drop tables, weighted selection, loot rolling, and state integration.
 * Created by Claude Opus 4.6 (Villager) on Day 342.
 */

import {
  ENEMY_DROP_TABLES,
  selectWeightedDrop,
  getDropTable,
  rollLootDrop,
  applyLootToState,
} from '../src/loot-tables.js';
import { items } from '../src/data/items.js';
import { ENEMIES } from '../src/data/enemies.js';
import { nextRng } from '../src/combat.js';

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

// ============================================================
console.log('\nENEMY_DROP_TABLES structure:');
// ============================================================

assert(typeof ENEMY_DROP_TABLES === 'object' && ENEMY_DROP_TABLES !== null,
  'ENEMY_DROP_TABLES is a non-null object');

assert(Object.isFrozen(ENEMY_DROP_TABLES),
  'ENEMY_DROP_TABLES is frozen');

const allEnemyIds = Object.keys(ENEMIES);
for (const enemyId of allEnemyIds) {
  assert(ENEMY_DROP_TABLES[enemyId] !== undefined,
    `Drop table exists for enemy: ${enemyId}`);
}

assert(Object.keys(ENEMY_DROP_TABLES).length === allEnemyIds.length,
  `Drop table count (${Object.keys(ENEMY_DROP_TABLES).length}) matches enemy count (${allEnemyIds.length})`);

// ============================================================
console.log('\nDrop table field validation:');
// ============================================================

for (const [enemyId, table] of Object.entries(ENEMY_DROP_TABLES)) {
  assert(typeof table.dropChance === 'number' && table.dropChance > 0 && table.dropChance <= 1,
    `${enemyId}: dropChance (${table.dropChance}) is in (0, 1]`);

  assert(Number.isInteger(table.maxDrops) && table.maxDrops >= 1,
    `${enemyId}: maxDrops (${table.maxDrops}) is a positive integer`);

  assert(Array.isArray(table.drops) && table.drops.length > 0,
    `${enemyId}: drops is a non-empty array`);

  for (const drop of table.drops) {
    assert(typeof drop.itemId === 'string' && items[drop.itemId] !== undefined,
      `${enemyId}: drop itemId '${drop.itemId}' exists in items data`);
    assert(typeof drop.weight === 'number' && drop.weight > 0,
      `${enemyId}: drop weight (${drop.weight}) for '${drop.itemId}' is positive`);
  }

  const brw = table.bonusRarityWeights;
  assert(typeof brw === 'object' && brw !== null,
    `${enemyId}: bonusRarityWeights is an object`);
  for (const rarity of ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']) {
    assert(typeof brw[rarity] === 'number' && brw[rarity] >= 0,
      `${enemyId}: bonusRarityWeights.${rarity} (${brw[rarity]}) is a non-negative number`);
  }
}

// ============================================================
console.log('\nselectWeightedDrop():');
// ============================================================

const testDrops = [
  { itemId: 'potion', weight: 50 },
  { itemId: 'ironSword', weight: 30 },
  { itemId: 'ether', weight: 20 },
];

assert(selectWeightedDrop(testDrops, 0.0) === 'potion',
  'rngValue 0.0 selects first item (potion)');

assert(selectWeightedDrop(testDrops, 0.49) === 'potion',
  'rngValue 0.49 selects first item (potion, weight 50/100)');

assert(selectWeightedDrop(testDrops, 0.51) === 'ironSword',
  'rngValue 0.51 selects second item (ironSword)');

assert(selectWeightedDrop(testDrops, 0.79) === 'ironSword',
  'rngValue 0.79 selects second item (ironSword, weight 30/100)');

assert(selectWeightedDrop(testDrops, 0.81) === 'ether',
  'rngValue 0.81 selects third item (ether)');

assert(selectWeightedDrop(testDrops, 0.999) === 'ether',
  'rngValue 0.999 selects last item (ether)');

assert(selectWeightedDrop([], 0.5) === null,
  'empty drops array returns null');

assert(selectWeightedDrop(null, 0.5) === null,
  'null drops returns null');

assert(selectWeightedDrop([{ itemId: 'potion', weight: 0 }], 0.5) === null,
  'all-zero weights returns null');

// Single item always selected
assert(selectWeightedDrop([{ itemId: 'bomb', weight: 100 }], 0.5) === 'bomb',
  'single item always selected');

// ============================================================
console.log('\ngetDropTable():');
// ============================================================

const slimeTable = getDropTable('slime');
assert(slimeTable !== null, 'getDropTable("slime") returns non-null');
assert(slimeTable.dropChance === 0.40, 'slime dropChance is 0.40');
assert(slimeTable.maxDrops === 1, 'slime maxDrops is 1');
assert(slimeTable.drops.length === 2, 'slime has 2 drop entries');

// Verify deep copy
slimeTable.dropChance = 999;
const slimeTable2 = getDropTable('slime');
assert(slimeTable2.dropChance === 0.40, 'getDropTable returns a deep copy (mutation does not affect original)');

assert(getDropTable('nonexistent') === null, 'getDropTable for unknown enemy returns null');

const dragonTable = getDropTable('dragon');
assert(dragonTable.dropChance === 0.90, 'dragon dropChance is 0.90');
assert(dragonTable.maxDrops === 3, 'dragon maxDrops is 3');
assert(dragonTable.drops.length === 7, 'dragon has 7 drop entries');

// ============================================================
console.log('\nrollLootDrop() - deterministic behavior:');
// ============================================================

// Same seed should produce same results
const result1 = rollLootDrop('slime', 12345);
const result2 = rollLootDrop('slime', 12345);
assert(JSON.stringify(result1) === JSON.stringify(result2),
  'Same seed produces identical loot results');

// Different seeds should produce different results (with high probability)
const result3 = rollLootDrop('dragon', 99999);
const result4 = rollLootDrop('dragon', 11111);
assert(result3.seed !== result4.seed,
  'Different seeds produce different final seeds');

// Unknown enemy returns empty loot
const unknownResult = rollLootDrop('unknown_enemy', 12345);
assert(unknownResult.lootedItems.length === 0, 'Unknown enemy returns empty loot');
assert(unknownResult.seed === 12345, 'Unknown enemy preserves seed');

// ============================================================
console.log('\nrollLootDrop() - loot item structure:');
// ============================================================

// Find a seed that produces loot for dragon (90% chance)
let lootResult = null;
for (let seed = 1; seed < 1000; seed++) {
  const r = rollLootDrop('dragon', seed);
  if (r.lootedItems.length > 0) {
    lootResult = r;
    break;
  }
}

assert(lootResult !== null, 'Dragon drops loot with some seed (90% chance)');
if (lootResult) {
  const firstItem = lootResult.lootedItems[0];
  assert(typeof firstItem.itemId === 'string', 'Looted item has itemId string');
  assert(typeof firstItem.name === 'string', 'Looted item has name string');
  assert(typeof firstItem.rarity === 'string', 'Looted item has rarity string');
  assert(items[firstItem.itemId] !== undefined, 'Looted itemId exists in items data');
  assert(firstItem.name === items[firstItem.itemId].name, 'Looted item name matches items data');
  assert(firstItem.rarity === items[firstItem.itemId].rarity, 'Looted item rarity matches items data');
}

// ============================================================
console.log('\nrollLootDrop() - maxDrops cap:');
// ============================================================

// Slime maxDrops = 1, so we should never get more than 1 item
let maxSlimeDrops = 0;
for (let seed = 1; seed < 500; seed++) {
  const r = rollLootDrop('slime', seed);
  if (r.lootedItems.length > maxSlimeDrops) {
    maxSlimeDrops = r.lootedItems.length;
  }
}
assert(maxSlimeDrops <= 1, `Slime never drops more than 1 item (max seen: ${maxSlimeDrops})`);

// Dragon maxDrops = 3, check that multi-drops are possible
let maxDragonDrops = 0;
for (let seed = 1; seed < 2000; seed++) {
  const r = rollLootDrop('dragon', seed);
  if (r.lootedItems.length > maxDragonDrops) {
    maxDragonDrops = r.lootedItems.length;
  }
}
assert(maxDragonDrops >= 2, `Dragon can drop 2+ items (max seen: ${maxDragonDrops})`);

// ============================================================
console.log('\nrollLootDrop() - no duplicate items:');
// ============================================================

let hasDuplicates = false;
for (let seed = 1; seed < 2000; seed++) {
  const r = rollLootDrop('dragon', seed);
  const ids = r.lootedItems.map(l => l.itemId);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    hasDuplicates = true;
    break;
  }
}
assert(!hasDuplicates, 'No duplicate items in any dragon loot roll (2000 seeds tested)');

// ============================================================
console.log('\nrollLootDrop() - seed advances:');
// ============================================================

const seedResult = rollLootDrop('goblin', 42);
assert(typeof seedResult.seed === 'number', 'Returned seed is a number');
assert(seedResult.seed !== 42, 'Seed advances from initial value');

// ============================================================
console.log('\napplyLootToState():');
// ============================================================

const baseState = {
  player: {
    hp: 50,
    maxHp: 100,
    gold: 20,
    inventory: { potion: 2 },
  },
  log: [],
};

// Empty loot
const emptyLootState = applyLootToState(baseState, []);
assert(Array.isArray(emptyLootState.lootedItems), 'Empty loot sets lootedItems to array');
assert(emptyLootState.lootedItems.length === 0, 'Empty loot produces empty lootedItems');
assert(emptyLootState.player.inventory.potion === 2, 'Empty loot preserves existing inventory');

// Single item loot
const singleLoot = [{ itemId: 'ironSword', name: 'Iron Sword', rarity: 'Uncommon' }];
const singleLootState = applyLootToState(baseState, singleLoot);
assert(singleLootState.player.inventory.ironSword === 1, 'Single loot adds new item to inventory');
assert(singleLootState.player.inventory.potion === 2, 'Single loot preserves existing items');
assert(singleLootState.lootedItems.length === 1, 'lootedItems has 1 entry');
assert(singleLootState.lootedItems[0].itemId === 'ironSword', 'lootedItems contains correct item');

// Stacking loot
const stackLoot = [{ itemId: 'potion', name: 'Healing Potion', rarity: 'Common' }];
const stackState = applyLootToState(baseState, stackLoot);
assert(stackState.player.inventory.potion === 3, 'Loot stacks with existing inventory (2 + 1 = 3)');

// Multiple items loot
const multiLoot = [
  { itemId: 'ether', name: 'Ether', rarity: 'Rare' },
  { itemId: 'bomb', name: 'Fire Bomb', rarity: 'Uncommon' },
];
const multiState = applyLootToState(baseState, multiLoot);
assert(multiState.player.inventory.ether === 1, 'Multi-loot adds first item');
assert(multiState.player.inventory.bomb === 1, 'Multi-loot adds second item');
assert(multiState.lootedItems.length === 2, 'Multi-loot has 2 entries in lootedItems');

// Immutability
assert(baseState.player.inventory.ironSword === undefined, 'Original state not mutated by single loot');
assert(baseState.player.inventory.potion === 2, 'Original state inventory count not mutated');
assert(baseState.lootedItems === undefined, 'Original state has no lootedItems');

// Null loot
const nullState = applyLootToState(baseState, null);
assert(nullState.lootedItems.length === 0, 'null loot sets empty lootedItems');

// Missing inventory in state
const noInvState = { player: { hp: 50 } };
const noInvResult = applyLootToState(noInvState, singleLoot);
assert(noInvResult.player.inventory.ironSword === 1, 'Handles missing inventory gracefully');

// ============================================================
console.log('\nThematic drop table validation:');
// ============================================================

// Dragon should have dragon-scale and dragonSpear
const dragonDrops = ENEMY_DROP_TABLES.dragon.drops.map(d => d.itemId);
assert(dragonDrops.includes('dragon-scale'), 'Dragon drops dragon-scale');
assert(dragonDrops.includes('dragonSpear'), 'Dragon drops dragonSpear');
assert(dragonDrops.includes('fire-gem'), 'Dragon drops fire-gem');

// Wraith should drop shadow-essence
const wraithDrops = ENEMY_DROP_TABLES.wraith.drops.map(d => d.itemId);
assert(wraithDrops.includes('shadow-essence'), 'Wraith drops shadow-essence');

// Fire spirit should drop fire-gem
const fireSpiritDrops = ENEMY_DROP_TABLES['fire-spirit'].drops.map(d => d.itemId);
assert(fireSpiritDrops.includes('fire-gem'), 'Fire Spirit drops fire-gem');

// Giant spider should drop antidote (thematic: poison)
const spiderDrops = ENEMY_DROP_TABLES['giant-spider'].drops.map(d => d.itemId);
assert(spiderDrops.includes('antidote'), 'Giant Spider drops antidote');

// Stone golem should drop guardian-bark
const golemDrops = ENEMY_DROP_TABLES['stone-golem'].drops.map(d => d.itemId);
assert(golemDrops.includes('guardian-bark'), 'Stone Golem drops guardian-bark');

// ============================================================
console.log('\nDrop rate scaling (stronger enemies = better drops):');
// ============================================================

assert(ENEMY_DROP_TABLES.dragon.dropChance > ENEMY_DROP_TABLES.slime.dropChance,
  'Dragon dropChance > Slime dropChance');

assert(ENEMY_DROP_TABLES.dragon.maxDrops > ENEMY_DROP_TABLES.slime.maxDrops,
  'Dragon maxDrops > Slime maxDrops');

assert(ENEMY_DROP_TABLES.dragon.bonusRarityWeights.Legendary > ENEMY_DROP_TABLES.slime.bonusRarityWeights.Legendary,
  'Dragon Legendary weight > Slime Legendary weight');

assert(ENEMY_DROP_TABLES.wraith.dropChance > ENEMY_DROP_TABLES.goblin.dropChance,
  'Wraith dropChance > Goblin dropChance');

// ============================================================
console.log('\nRNG determinism integration:');
// ============================================================

// Verify nextRng is deterministic
const rng1 = nextRng(42);
const rng2 = nextRng(42);
assert(rng1.seed === rng2.seed && rng1.value === rng2.value,
  'nextRng is deterministic');

// Verify rollLootDrop uses nextRng correctly (seed changes)
const lootA = rollLootDrop('orc', 100);
const lootB = rollLootDrop('orc', lootA.seed);
assert(lootA.seed !== 100, 'First roll advances seed');
assert(lootB.seed !== lootA.seed, 'Second roll further advances seed');

// ============================================================
console.log('\n==================================================');
console.log(`Loot Tables Tests: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('\nAll loot table tests passed! ✅');
} else {
  console.log(`\n${failed} test(s) FAILED ❌`);
  process.exit(1);
}
