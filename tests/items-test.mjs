/**
 * Item System Tests — AI Village RPG
 * Run: node tests/items-test.mjs
 */

import { items, rarityColors, lootTables, getRandomLoot } from '../src/data/items.js';
import { useItem, addItemToInventory, removeItemFromInventory, getItemCount, hasItem, normalizeInventory, getInventoryDisplay } from '../src/items.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

// ── Test: Basic Item Structure ──────────────────────────────────────
console.log('\n--- Item Data ---');
const expectedItemIds = [
  'potion',
  'hiPotion',
  'ether',
  'bomb',
  'antidote',
  'rustySword',
  'ironSword',
  'huntersBow',
  'arcaneStaff',
  'dragonSpear',
  'leatherArmor',
  'chainmail',
  'mageRobe',
  'shadowCloak',
  'ringOfFortune',
  'amuletOfVigor',
  'bootsOfSwiftness',
];
assert(Object.keys(items).length >= expectedItemIds.length, 'Item catalog contains baseline items');
expectedItemIds.forEach((id) => {
  assert(!!items[id], `${id} exists`);
  const item = items[id];
  const requiredProps = ['id', 'name', 'type', 'category', 'rarity', 'description', 'effect', 'stats', 'value'];
  assert(requiredProps.every((prop) => prop in item), `${id} exposes required properties`);
  assert(typeof item.effect === 'object', `${id} effect is an object`);
  assert(typeof item.stats === 'object', `${id} stats is an object`);
  assert('category' in item, `${id} includes a category property`);
  assert(item.category === item.type, `${id} category matches item type`);
});

// ── Test: Rarity Colors ─────────────────────────────────────────────
console.log('\n--- Rarity Colors ---');
const rarityKeys = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
assert(rarityKeys.every((r) => rarityColors[r]), 'All rarity colors are defined');

// ── Test: Loot Tables ───────────────────────────────────────────────
console.log('\n--- Loot Tables ---');
const lootTableKeys = ['goblin', 'banditCaptain', 'forestChest', 'castleArmory', 'dragonHoard'];
lootTableKeys.forEach((table) => {
  const entry = lootTables[table];
  assert(!!entry, `${table} loot table exists`);
  assert(entry?.rarityWeights, `${table} has rarityWeights`);
  const weights = entry?.rarityWeights || {};
  assert(rarityKeys.every((r) => r in weights), `${table} defines weights for all rarities`);
});

// ── Test: getRandomLoot ─────────────────────────────────────────────
console.log('\n--- getRandomLoot ---');
const originalRandom = Math.random;
try {
  Math.random = () => 0.3;
  const loot = getRandomLoot(lootTables.goblin.rarityWeights);
  assert(loot !== null, 'Loot is returned for goblin table');
  assert(loot.rarity === 'Common', 'Weighted roll selects Common rarity at 0.3');
  assert(loot.id === 'antidote', `Deterministic selection returns second Common item (got ${loot.id})`);
} finally {
  Math.random = originalRandom;
}
assert(getRandomLoot({}) === null, 'Returns null when no weights provided');

// ── Test: Inventory Utilities ───────────────────────────────────────
console.log('\n--- Inventory Utilities ---');
let inventory = {};
inventory = addItemToInventory(inventory, 'potion');
assert(inventory.potion === 1, 'Add potion increments count');
inventory = addItemToInventory(inventory, 'potion', 2);
assert(inventory.potion === 3, 'Adding quantity stacks items');
inventory = addItemToInventory(inventory, 'ether', 1);
const afterRemove = removeItemFromInventory(inventory, 'potion', 2);
assert(afterRemove.potion === 1, 'Removing items decreases count');
const failedRemove = removeItemFromInventory(afterRemove, 'potion', 5);
assert(failedRemove.potion === 1, 'Removal fails gracefully when insufficient quantity');
assert(getItemCount(afterRemove, 'potion') === 1, 'getItemCount returns current amount');
assert(hasItem(afterRemove, 'potion'), 'hasItem true when enough quantity');
assert(!hasItem(afterRemove, 'bomb'), 'hasItem false when missing item');

// ── Test: useItem Functionality ─────────────────────────────────────
console.log('\n--- useItem ---');
const baseCharacter = { hp: 10, maxHp: 50, mp: 5, maxMp: 20, inventory: {} };
const potionResult = useItem('potion', { ...baseCharacter, inventory: { potion: 2 } }, {});
assert(potionResult.success, 'Potion use succeeds');
assert(potionResult.effects.hp === 30, 'Potion heals 20 HP');
assert(potionResult.effects.healed === 20, 'Potion healed amount reported');
assert(potionResult.effects.inventory.potion === 1, 'Potion count reduced by 1');

const hiPotionResult = useItem('hiPotion', { ...baseCharacter, inventory: { hiPotion: 1 } }, {});
assert(hiPotionResult.effects.hp === 50, 'Hi-Potion heals up to max HP');
assert(hiPotionResult.effects.healed === 40, 'Hi-Potion healing amount reported');
assert(hiPotionResult.effects.inventory.hiPotion === 0, 'Hi-Potion consumed');

const etherResult = useItem('ether', { ...baseCharacter, inventory: { ether: 1 } }, {});
assert(etherResult.effects.mp === 20, 'Ether restores MP up to max');
assert(etherResult.effects.restoredMP === 15, 'Ether restored MP amount reported');
assert(etherResult.effects.inventory.ether === 0, 'Ether consumed');

const antidoteResult = useItem('antidote', { ...baseCharacter, inventory: { antidote: 1 } }, {});
assert(Array.isArray(antidoteResult.effects.cureStatus) && antidoteResult.effects.cureStatus.includes('poison'), 'Antidote cleanses poison');
assert(antidoteResult.effects.inventory.antidote === 0, 'Antidote consumed');

// ── Test: Backward Compatibility ────────────────────────────────────
console.log('\n--- Backward Compatibility ---');
assert(items.potion.heal === 20, 'Legacy heal property remains on potion');

// ── Test: Inventory Normalization/Display ───────────────────────────
console.log('\n--- Inventory Normalization & Display ---');
const normalizedExisting = normalizeInventory({ potion: 2, ether: 1 });
assert(normalizedExisting.potion === 2 && normalizedExisting.ether === 1, 'Existing keyed inventory remains intact');
const normalizedLegacy = normalizeInventory({ potion: 3 });
assert(normalizedLegacy.potion === 3, 'Legacy potion count normalized');
const normalizedEmpty = normalizeInventory(null);
assert(Object.keys(normalizedEmpty).length === 0, 'Null inventory normalizes to empty object');

const display = getInventoryDisplay({ potion: 2, dragonSpear: 1, unknownItem: 4 });
assert(display.includes('Healing Potion ×2'), 'Display shows item names and counts');
assert(display.includes('Dragon Spear ×1'), 'Display resolves known item names');
assert(display.includes('unknownItem ×4'), 'Display falls back to ID for unknown items');

// ── Summary ─────────────────────────────────────────────────────────
console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
