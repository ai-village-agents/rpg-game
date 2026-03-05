/**
 * Items Module Tests - AI Village RPG
 * Tests for item utilities: inventory management, item usage
 * Run: node tests/items-test.mjs
 */

import {
  useItem,
  addItemToInventory,
  removeItemFromInventory,
  getItemCount,
  hasItem,
  normalizeInventory,
  getInventoryDisplay
} from '../src/items.js';
import { items } from '../src/data/items.js';

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

console.log('\n--- Item Data Integrity ---');
{
  assert(items.potion !== undefined, 'Potion item exists');
  assert(items.potion.id === 'potion', 'Potion has correct id');
  assert(items.potion.name === 'Potion', 'Potion has display name');
  assert(typeof items.potion.heal === 'number', 'Potion has heal value');
}

console.log('\n--- Add Item to Inventory ---');
{
  const empty = {};
  const result1 = addItemToInventory(empty, 'potion', 1);
  assert(result1.potion === 1, 'Added 1 potion to empty inventory');

  const result2 = addItemToInventory(result1, 'potion', 2);
  assert(result2.potion === 3, 'Added 2 more potions (total 3)');

  const result3 = addItemToInventory(empty, 'sword', 5);
  assert(result3.sword === 5, 'Can add any item id');

  // Original inventory unchanged (immutability)
  assert(empty.potion === undefined, 'Original inventory unchanged');
}

console.log('\n--- Remove Item from Inventory ---');
{
  const inv = { potion: 3, sword: 1 };

  const result1 = removeItemFromInventory(inv, 'potion', 1);
  assert(result1.potion === 2, 'Removed 1 potion (2 remaining)');

  const result2 = removeItemFromInventory(inv, 'potion', 3);
  assert(result2.potion === undefined, 'Removing all removes key');

  const result3 = removeItemFromInventory(inv, 'potion', 5);
  assert(result3.potion === 3, 'Cannot remove more than available');

  const result4 = removeItemFromInventory(inv, 'nonexistent', 1);
  assert(result4.nonexistent === undefined, 'Removing nonexistent item is safe');

  // Original unchanged
  assert(inv.potion === 3, 'Original inventory unchanged');
}

console.log('\n--- Get Item Count ---');
{
  const inv = { potion: 5, sword: 2 };
  assert(getItemCount(inv, 'potion') === 5, 'Count of potion is 5');
  assert(getItemCount(inv, 'sword') === 2, 'Count of sword is 2');
  assert(getItemCount(inv, 'nonexistent') === 0, 'Count of missing item is 0');
  assert(getItemCount({}, 'potion') === 0, 'Empty inventory returns 0');
}

console.log('\n--- Has Item ---');
{
  const inv = { potion: 3, sword: 1 };
  assert(hasItem(inv, 'potion', 1) === true, 'Has at least 1 potion');
  assert(hasItem(inv, 'potion', 3) === true, 'Has exactly 3 potions');
  assert(hasItem(inv, 'potion', 4) === false, 'Does not have 4 potions');
  assert(hasItem(inv, 'sword') === true, 'Has sword (default qty 1)');
  assert(hasItem(inv, 'nonexistent') === false, 'Does not have nonexistent');
  assert(hasItem({}, 'potion') === false, 'Empty inventory has nothing');
}

console.log('\n--- Normalize Inventory ---');
{
  const result1 = normalizeInventory(null);
  assert(typeof result1 === 'object', 'Null returns empty object');

  const result2 = normalizeInventory(undefined);
  assert(typeof result2 === 'object', 'Undefined returns empty object');

  const alreadyNormalized = { potion: 5 };
  const result3 = normalizeInventory(alreadyNormalized);
  assert(result3.potion === 5, 'Already normalized passes through');

  // Array returns empty
  const result4 = normalizeInventory([]);
  assert(Object.keys(result4).length === 0, 'Array returns empty object');
}

console.log('\n--- Get Inventory Display ---');
{
  const inv = { potion: 3 };
  const display = getInventoryDisplay(inv);
  assert(Array.isArray(display), 'Returns array');
  assert(display.length === 1, 'One item in display');
  assert(display[0] === 'Potion ×3', 'Formats as "Name ×count"');

  // Unknown item shows raw id
  const inv2 = { unknown_item: 2 };
  const display2 = getInventoryDisplay(inv2);
  assert(display2[0] === 'unknown_item ×2', 'Unknown items show raw id');

  // Empty inventory
  const display3 = getInventoryDisplay({});
  assert(display3.length === 0, 'Empty inventory returns empty array');
}

console.log('\n--- Use Item (No Item) ---');
{
  const character = { hp: 20, maxHp: 50, inventory: {} };
  const result = useItem('potion', character, {});
  assert(result.success === false, 'Cannot use item not in inventory');
  assert(result.message.includes("don't have"), 'Error mentions not having item');
}

console.log('\n--- Use Item (Unknown Item) ---');
{
  const character = { hp: 20, maxHp: 50, inventory: { fake_item: 1 } };
  const result = useItem('fake_item', character, {});
  assert(result.success === false, 'Cannot use unknown item');
  assert(result.message.includes('not found'), 'Error mentions not found');
}

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
