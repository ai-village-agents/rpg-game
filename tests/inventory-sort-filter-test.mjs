// Tests for inventory sort & filter module
// Created by Claude Opus 4.6 (Day 344)

import { strict as assert } from 'node:assert';
import {
  SORT_MODES, FILTER_MODES,
  SORT_LABELS, FILTER_LABELS,
  filterItems, sortItems, filterAndSortItems,
  renderSortFilterControls,
} from '../src/inventory-sort-filter.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ❌ ${name}: ${e.message}`);
  }
}

// --- Test data ---
const items = [
  { id: 'potion', name: 'Healing Potion', type: 'consumable', rarity: 'Common', value: 10, stats: {} },
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', rarity: 'Common', value: 50, stats: { attack: 3 } },
  { id: 'mithril_armor', name: 'Mithril Armor', type: 'armor', rarity: 'Rare', value: 200, stats: { defense: 8, speed: -1 } },
  { id: 'fire_ring', name: 'Fire Ring', type: 'accessory', rarity: 'Epic', value: 500, stats: { attack: 2, magic: 5 } },
  { id: 'dragon_blade', name: 'Dragon Blade', type: 'weapon', rarity: 'Legendary', value: 1000, stats: { attack: 15, critChance: 5 } },
  { id: 'elixir', name: 'Elixir', type: 'consumable', rarity: 'Rare', value: 100, stats: {} },
  { id: 'leather_cap', name: 'Leather Cap', type: 'armor', rarity: 'Uncommon', value: 30, stats: { defense: 2 } },
  { id: 'amulet', name: 'Amulet of Wisdom', type: 'accessory', rarity: 'Uncommon', value: 75, stats: { magic: 3 } },
];

console.log('\n=== Inventory Sort & Filter Tests ===\n');

// --- Constants tests ---
console.log('Constants:');

test('SORT_MODES has all expected keys', () => {
  const keys = Object.keys(SORT_MODES);
  assert.ok(keys.includes('NAME_ASC'));
  assert.ok(keys.includes('NAME_DESC'));
  assert.ok(keys.includes('TYPE'));
  assert.ok(keys.includes('RARITY_ASC'));
  assert.ok(keys.includes('RARITY_DESC'));
  assert.ok(keys.includes('VALUE_ASC'));
  assert.ok(keys.includes('VALUE_DESC'));
  assert.ok(keys.includes('STAT_TOTAL_DESC'));
  assert.equal(keys.length, 8);
});

test('FILTER_MODES has all expected keys', () => {
  const keys = Object.keys(FILTER_MODES);
  assert.ok(keys.includes('ALL'));
  assert.ok(keys.includes('CONSUMABLE'));
  assert.ok(keys.includes('WEAPON'));
  assert.ok(keys.includes('ARMOR'));
  assert.ok(keys.includes('ACCESSORY'));
  assert.ok(keys.includes('EQUIPPABLE'));
  assert.equal(keys.length, 6);
});

test('SORT_LABELS has a label for every sort mode', () => {
  for (const mode of Object.values(SORT_MODES)) {
    assert.ok(SORT_LABELS[mode], `Missing label for sort mode: ${mode}`);
  }
});

test('FILTER_LABELS has a label for every filter mode', () => {
  for (const mode of Object.values(FILTER_MODES)) {
    assert.ok(FILTER_LABELS[mode], `Missing label for filter mode: ${mode}`);
  }
});

// --- Filter tests ---
console.log('\nFiltering:');

test('filterItems with ALL returns all items', () => {
  const result = filterItems(items, FILTER_MODES.ALL);
  assert.equal(result.length, items.length);
});

test('filterItems with null filter returns all items', () => {
  const result = filterItems(items, null);
  assert.equal(result.length, items.length);
});

test('filterItems with undefined filter returns all items', () => {
  const result = filterItems(items, undefined);
  assert.equal(result.length, items.length);
});

test('filterItems CONSUMABLE returns only consumables', () => {
  const result = filterItems(items, FILTER_MODES.CONSUMABLE);
  assert.equal(result.length, 2);
  assert.ok(result.every(i => i.type === 'consumable'));
});

test('filterItems WEAPON returns only weapons', () => {
  const result = filterItems(items, FILTER_MODES.WEAPON);
  assert.equal(result.length, 2);
  assert.ok(result.every(i => i.type === 'weapon'));
});

test('filterItems ARMOR returns only armor', () => {
  const result = filterItems(items, FILTER_MODES.ARMOR);
  assert.equal(result.length, 2);
  assert.ok(result.every(i => i.type === 'armor'));
});

test('filterItems ACCESSORY returns only accessories', () => {
  const result = filterItems(items, FILTER_MODES.ACCESSORY);
  assert.equal(result.length, 2);
  assert.ok(result.every(i => i.type === 'accessory'));
});

test('filterItems EQUIPPABLE returns weapons + armor + accessories', () => {
  const result = filterItems(items, FILTER_MODES.EQUIPPABLE);
  assert.equal(result.length, 6);
  assert.ok(result.every(i => ['weapon', 'armor', 'accessory'].includes(i.type)));
});

test('filterItems does not mutate original array', () => {
  const original = [...items];
  filterItems(items, FILTER_MODES.WEAPON);
  assert.deepEqual(items, original);
});

test('filterItems with empty array returns empty', () => {
  const result = filterItems([], FILTER_MODES.ALL);
  assert.equal(result.length, 0);
});

test('filterItems with non-array returns empty', () => {
  const result = filterItems(null, FILTER_MODES.ALL);
  assert.equal(result.length, 0);
});

test('filterItems with unknown filter returns all', () => {
  const result = filterItems(items, 'unknown-filter');
  assert.equal(result.length, items.length);
});

// --- Sort tests ---
console.log('\nSorting:');

test('sortItems NAME_ASC sorts alphabetically', () => {
  const result = sortItems(items, SORT_MODES.NAME_ASC);
  assert.equal(result[0].name, 'Amulet of Wisdom');
  assert.equal(result[1].name, 'Dragon Blade');
  assert.equal(result[2].name, 'Elixir');
  assert.equal(result[result.length - 1].name, 'Mithril Armor');
});

test('sortItems NAME_DESC sorts reverse alphabetically', () => {
  const result = sortItems(items, SORT_MODES.NAME_DESC);
  assert.equal(result[0].name, 'Mithril Armor');
  assert.equal(result[result.length - 1].name, 'Amulet of Wisdom');
});

test('sortItems TYPE groups by type order (consumable, weapon, armor, accessory)', () => {
  const result = sortItems(items, SORT_MODES.TYPE);
  const types = result.map(i => i.type);
  // Consumables come first, then weapons, then armor, then accessories
  const firstWeaponIdx = types.indexOf('weapon');
  const firstArmorIdx = types.indexOf('armor');
  const firstAccessoryIdx = types.indexOf('accessory');
  const lastConsumableIdx = types.lastIndexOf('consumable');
  assert.ok(lastConsumableIdx < firstWeaponIdx, 'consumables before weapons');
  assert.ok(firstWeaponIdx < firstArmorIdx, 'weapons before armor');
  assert.ok(firstArmorIdx < firstAccessoryIdx, 'armor before accessories');
});

test('sortItems TYPE sub-sorts by name within same type', () => {
  const result = sortItems(items, SORT_MODES.TYPE);
  const consumables = result.filter(i => i.type === 'consumable');
  assert.equal(consumables[0].name, 'Elixir');
  assert.equal(consumables[1].name, 'Healing Potion');
});

test('sortItems RARITY_ASC sorts Common → Legendary', () => {
  const result = sortItems(items, SORT_MODES.RARITY_ASC);
  const rarities = result.map(i => i.rarity);
  assert.equal(rarities[0], 'Common');
  assert.equal(rarities[rarities.length - 1], 'Legendary');
});

test('sortItems RARITY_DESC sorts Legendary → Common', () => {
  const result = sortItems(items, SORT_MODES.RARITY_DESC);
  const rarities = result.map(i => i.rarity);
  assert.equal(rarities[0], 'Legendary');
  assert.equal(rarities[rarities.length - 1], 'Common');
});

test('sortItems RARITY_ASC sub-sorts by name within same rarity', () => {
  const result = sortItems(items, SORT_MODES.RARITY_ASC);
  const commons = result.filter(i => i.rarity === 'Common');
  assert.equal(commons[0].name, 'Healing Potion');
  assert.equal(commons[1].name, 'Iron Sword');
});

test('sortItems VALUE_ASC sorts low to high', () => {
  const result = sortItems(items, SORT_MODES.VALUE_ASC);
  assert.equal(result[0].value, 10);
  assert.equal(result[result.length - 1].value, 1000);
});

test('sortItems VALUE_DESC sorts high to low', () => {
  const result = sortItems(items, SORT_MODES.VALUE_DESC);
  assert.equal(result[0].value, 1000);
  assert.equal(result[result.length - 1].value, 10);
});

test('sortItems STAT_TOTAL_DESC sorts by total stats descending', () => {
  const result = sortItems(items, SORT_MODES.STAT_TOTAL_DESC);
  // Dragon Blade: 15+5=20, Mithril Armor: 8-1=7, Fire Ring: 2+5=7, Iron Sword: 3, Amulet: 3, Potion: 0, Elixir: 0
  assert.equal(result[0].name, 'Dragon Blade'); // 20
  // Mithril Armor and Fire Ring both have 7, sub-sorted by name
  assert.equal(result[1].name, 'Fire Ring'); // 7 (F < M)
  assert.equal(result[2].name, 'Mithril Armor'); // 7
});

test('sortItems does not mutate original array', () => {
  const original = [...items];
  sortItems(items, SORT_MODES.NAME_ASC);
  assert.deepEqual(items, original);
});

test('sortItems with empty array returns empty', () => {
  const result = sortItems([], SORT_MODES.NAME_ASC);
  assert.equal(result.length, 0);
});

test('sortItems with non-array returns empty', () => {
  const result = sortItems(null, SORT_MODES.NAME_ASC);
  assert.equal(result.length, 0);
});

test('sortItems with null sort mode returns copy of original', () => {
  const result = sortItems(items, null);
  assert.equal(result.length, items.length);
  assert.equal(result[0].id, items[0].id);
});

// --- Combined filter + sort tests ---
console.log('\nCombined filter + sort:');

test('filterAndSortItems filters then sorts', () => {
  const result = filterAndSortItems(items, FILTER_MODES.WEAPON, SORT_MODES.VALUE_DESC);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Dragon Blade'); // 1000g
  assert.equal(result[1].name, 'Iron Sword'); // 50g
});

test('filterAndSortItems with ALL filter sorts everything', () => {
  const result = filterAndSortItems(items, FILTER_MODES.ALL, SORT_MODES.NAME_ASC);
  assert.equal(result.length, items.length);
  assert.equal(result[0].name, 'Amulet of Wisdom');
});

test('filterAndSortItems with EQUIPPABLE + RARITY_DESC', () => {
  const result = filterAndSortItems(items, FILTER_MODES.EQUIPPABLE, SORT_MODES.RARITY_DESC);
  assert.equal(result.length, 6);
  assert.equal(result[0].rarity, 'Legendary');
  assert.ok(result.every(i => i.type !== 'consumable'));
});

// --- Render controls tests ---
console.log('\nRender controls:');

test('renderSortFilterControls returns HTML string', () => {
  const html = renderSortFilterControls(SORT_MODES.NAME_ASC, FILTER_MODES.ALL, 10, 10);
  assert.equal(typeof html, 'string');
  assert.ok(html.includes('invSortSelect'));
});

test('renderSortFilterControls includes sort options', () => {
  const html = renderSortFilterControls(SORT_MODES.NAME_ASC, FILTER_MODES.ALL, 10, 10);
  assert.ok(html.includes('Name (A→Z)'));
  assert.ok(html.includes('Rarity ↑'));
  assert.ok(html.includes('Stats ↓'));
});

test('renderSortFilterControls marks current sort as selected', () => {
  const html = renderSortFilterControls(SORT_MODES.VALUE_DESC, FILTER_MODES.ALL, 10, 10);
  assert.ok(html.includes('value="value-desc" selected'));
});

test('renderSortFilterControls includes filter buttons', () => {
  const html = renderSortFilterControls(SORT_MODES.NAME_ASC, FILTER_MODES.ALL, 10, 10);
  assert.ok(html.includes('data-filter="all"'));
  assert.ok(html.includes('data-filter="consumable"'));
  assert.ok(html.includes('data-filter="weapon"'));
  assert.ok(html.includes('data-filter="armor"'));
  assert.ok(html.includes('data-filter="accessory"'));
  assert.ok(html.includes('data-filter="equippable"'));
});

test('renderSortFilterControls highlights active filter', () => {
  const html = renderSortFilterControls(SORT_MODES.NAME_ASC, FILTER_MODES.WEAPON, 10, 2);
  assert.ok(html.includes('data-filter="weapon"'));
  // The weapon button should have the active styling
  const weaponBtnMatch = html.match(/data-filter="weapon"[^>]*/);
  assert.ok(weaponBtnMatch, 'weapon filter button exists');
  assert.ok(weaponBtnMatch[0].includes('background:#4a9eff'), 'weapon button has active style');
});

test('renderSortFilterControls shows filtered count when different', () => {
  const html = renderSortFilterControls(SORT_MODES.NAME_ASC, FILTER_MODES.WEAPON, 10, 2);
  assert.ok(html.includes('Showing 2 of 10'));
});

test('renderSortFilterControls shows total count when not filtered', () => {
  const html = renderSortFilterControls(SORT_MODES.NAME_ASC, FILTER_MODES.ALL, 10, 10);
  assert.ok(html.includes('10 items'));
});

// --- Edge cases ---
console.log('\nEdge cases:');

test('items with missing name sort safely', () => {
  const edgeItems = [
    { id: 'a', type: 'weapon', rarity: 'Common', value: 10, stats: {} },
    { id: 'b', name: 'Blade', type: 'weapon', rarity: 'Common', value: 10, stats: {} },
  ];
  const result = sortItems(edgeItems, SORT_MODES.NAME_ASC);
  assert.equal(result.length, 2);
});

test('items with missing rarity sort safely', () => {
  const edgeItems = [
    { id: 'a', name: 'A', type: 'weapon', value: 10, stats: {} },
    { id: 'b', name: 'B', type: 'weapon', rarity: 'Rare', value: 10, stats: {} },
  ];
  const result = sortItems(edgeItems, SORT_MODES.RARITY_ASC);
  assert.equal(result.length, 2);
  // Item with missing rarity (-1) comes before Common (0)
  assert.equal(result[0].name, 'A');
});

test('items with missing value sort safely', () => {
  const edgeItems = [
    { id: 'a', name: 'A', type: 'weapon', rarity: 'Common', stats: {} },
    { id: 'b', name: 'B', type: 'weapon', rarity: 'Common', value: 100, stats: {} },
  ];
  const result = sortItems(edgeItems, SORT_MODES.VALUE_ASC);
  assert.equal(result[0].name, 'A'); // value 0 (default)
  assert.equal(result[1].name, 'B'); // value 100
});

test('items with missing stats sort safely for STAT_TOTAL_DESC', () => {
  const edgeItems = [
    { id: 'a', name: 'A', type: 'weapon' },
    { id: 'b', name: 'B', type: 'weapon', stats: { attack: 5 } },
  ];
  const result = sortItems(edgeItems, SORT_MODES.STAT_TOTAL_DESC);
  assert.equal(result[0].name, 'B'); // stat total 5
  assert.equal(result[1].name, 'A'); // stat total 0
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
