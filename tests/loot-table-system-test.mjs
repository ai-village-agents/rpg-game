/**
 * Loot Table System Tests
 * 75 tests covering entries, tables, conditions, rolling, and simulation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  RARITY,
  CONDITIONS,
  createLootEntry,
  createLootTable,
  addEntry,
  removeEntry,
  createTableRegistry,
  registerTable,
  checkCondition,
  filterByConditions,
  calculateTotalWeight,
  selectWeightedEntry,
  calculateQuantity,
  rollLootTable,
  rollMultipleTables,
  consolidateDrops,
  applyLuckModifier,
  getRarityColor,
  getRarityName,
  getTablesByTag,
  getTableInfo,
  createPresetTable,
  getDropPreview,
  simulateDrops
} from '../src/loot-table-system.js';

// ============================================================================
// Constants Tests (7 tests)
// ============================================================================

describe('RARITY', () => {
  it('has COMMON rarity', () => {
    assert.strictEqual(RARITY.COMMON.name, 'Common');
    assert.strictEqual(RARITY.COMMON.weight, 60);
  });

  it('has UNCOMMON rarity', () => {
    assert.strictEqual(RARITY.UNCOMMON.name, 'Uncommon');
  });

  it('has RARE rarity', () => {
    assert.strictEqual(RARITY.RARE.name, 'Rare');
  });

  it('has EPIC rarity', () => {
    assert.strictEqual(RARITY.EPIC.name, 'Epic');
  });

  it('has LEGENDARY rarity', () => {
    assert.strictEqual(RARITY.LEGENDARY.name, 'Legendary');
    assert.strictEqual(RARITY.LEGENDARY.weight, 1);
  });
});

describe('CONDITIONS', () => {
  it('has ALWAYS condition', () => {
    assert.strictEqual(CONDITIONS.ALWAYS, 'always');
  });

  it('has all condition types', () => {
    assert.strictEqual(CONDITIONS.PLAYER_LEVEL, 'playerLevel');
    assert.strictEqual(CONDITIONS.BOSS_KILL, 'bossKill');
    assert.strictEqual(CONDITIONS.FIRST_KILL, 'firstKill');
    assert.strictEqual(CONDITIONS.QUEST_ACTIVE, 'questActive');
    assert.strictEqual(CONDITIONS.CHANCE, 'chance');
  });
});

// ============================================================================
// createLootEntry Tests (5 tests)
// ============================================================================

describe('createLootEntry', () => {
  it('creates valid entry', () => {
    const result = createLootEntry('gold');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.entry.itemId, 'gold');
  });

  it('validates item id', () => {
    const result = createLootEntry('');
    assert.strictEqual(result.success, false);
  });

  it('sets default values', () => {
    const result = createLootEntry('gold');
    assert.strictEqual(result.entry.weight, 10);
    assert.strictEqual(result.entry.minQuantity, 1);
    assert.strictEqual(result.entry.rarity, 'COMMON');
  });

  it('accepts custom options', () => {
    const result = createLootEntry('gold', {
      weight: 50,
      minQuantity: 10,
      maxQuantity: 100,
      rarity: 'RARE'
    });
    assert.strictEqual(result.entry.weight, 50);
    assert.strictEqual(result.entry.minQuantity, 10);
    assert.strictEqual(result.entry.rarity, 'RARE');
  });

  it('supports guaranteed flag', () => {
    const result = createLootEntry('gold', { guaranteed: true });
    assert.strictEqual(result.entry.guaranteed, true);
  });
});

// ============================================================================
// createLootTable Tests (6 tests)
// ============================================================================

describe('createLootTable', () => {
  it('creates valid table', () => {
    const result = createLootTable('mob_drops', 'Mob Drops');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.table.name, 'Mob Drops');
  });

  it('validates table id', () => {
    const result = createLootTable('', 'Test');
    assert.strictEqual(result.success, false);
  });

  it('validates table name', () => {
    const result = createLootTable('test', '');
    assert.strictEqual(result.success, false);
  });

  it('sets default values', () => {
    const result = createLootTable('test', 'Test');
    assert.strictEqual(result.table.minDrops, 1);
    assert.strictEqual(result.table.maxDrops, 3);
    assert.strictEqual(result.table.emptyChance, 0);
  });

  it('accepts custom options', () => {
    const result = createLootTable('test', 'Test', {
      minDrops: 2,
      maxDrops: 5,
      emptyChance: 0.3
    });
    assert.strictEqual(result.table.minDrops, 2);
    assert.strictEqual(result.table.maxDrops, 5);
  });

  it('creates empty entries array', () => {
    const result = createLootTable('test', 'Test');
    assert.deepStrictEqual(result.table.entries, []);
  });
});

// ============================================================================
// Entry Management Tests (4 tests)
// ============================================================================

describe('Entry Management', () => {
  it('adds entry to table', () => {
    const table = createLootTable('test', 'Test').table;
    const entry = createLootEntry('gold').entry;
    const result = addEntry(table, entry);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.table.entries.length, 1);
  });

  it('validates entry on add', () => {
    const table = createLootTable('test', 'Test').table;
    const result = addEntry(table, null);
    assert.strictEqual(result.success, false);
  });

  it('removes entry from table', () => {
    let table = createLootTable('test', 'Test').table;
    const entry = createLootEntry('gold').entry;
    table = addEntry(table, entry).table;
    const result = removeEntry(table, 'gold');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.table.entries.length, 0);
  });

  it('fails to remove missing entry', () => {
    const table = createLootTable('test', 'Test').table;
    const result = removeEntry(table, 'missing');
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Registry Tests (5 tests)
// ============================================================================

describe('Table Registry', () => {
  it('creates empty registry', () => {
    const registry = createTableRegistry();
    assert.deepStrictEqual(registry.tables, {});
  });

  it('registers table', () => {
    const registry = createTableRegistry();
    const table = createLootTable('test', 'Test').table;
    const result = registerTable(registry, table);
    assert.strictEqual(result.success, true);
    assert.ok(result.registry.tables['test']);
  });

  it('indexes by tags', () => {
    const registry = createTableRegistry();
    const table = createLootTable('test', 'Test', { tags: ['mob', 'common'] }).table;
    const result = registerTable(registry, table);
    assert.deepStrictEqual(result.registry.byTag['mob'], ['test']);
  });

  it('prevents duplicates', () => {
    let registry = createTableRegistry();
    const table = createLootTable('test', 'Test').table;
    registry = registerTable(registry, table).registry;
    const result = registerTable(registry, table);
    assert.strictEqual(result.success, false);
  });

  it('gets tables by tag', () => {
    let registry = createTableRegistry();
    const table = createLootTable('test', 'Test', { tags: ['boss'] }).table;
    registry = registerTable(registry, table).registry;
    const tables = getTablesByTag(registry, 'boss');
    assert.strictEqual(tables.length, 1);
  });
});

// ============================================================================
// Condition Tests (6 tests)
// ============================================================================

describe('Conditions', () => {
  it('ALWAYS condition returns true', () => {
    const entry = createLootEntry('gold', { condition: CONDITIONS.ALWAYS }).entry;
    assert.strictEqual(checkCondition(entry, {}), true);
  });

  it('PLAYER_LEVEL checks level', () => {
    const entry = createLootEntry('gold', { condition: CONDITIONS.PLAYER_LEVEL, conditionValue: 10 }).entry;
    assert.strictEqual(checkCondition(entry, { playerLevel: 5 }), false);
    assert.strictEqual(checkCondition(entry, { playerLevel: 10 }), true);
    assert.strictEqual(checkCondition(entry, { playerLevel: 15 }), true);
  });

  it('BOSS_KILL checks boss flag', () => {
    const entry = createLootEntry('gold', { condition: CONDITIONS.BOSS_KILL }).entry;
    assert.strictEqual(checkCondition(entry, { isBoss: false }), false);
    assert.strictEqual(checkCondition(entry, { isBoss: true }), true);
  });

  it('FIRST_KILL checks first kill flag', () => {
    const entry = createLootEntry('gold', { condition: CONDITIONS.FIRST_KILL }).entry;
    assert.strictEqual(checkCondition(entry, { isFirstKill: false }), false);
    assert.strictEqual(checkCondition(entry, { isFirstKill: true }), true);
  });

  it('QUEST_ACTIVE checks active quests', () => {
    const entry = createLootEntry('gold', { condition: CONDITIONS.QUEST_ACTIVE, conditionValue: 'quest_1' }).entry;
    assert.strictEqual(checkCondition(entry, { activeQuests: [] }), false);
    assert.strictEqual(checkCondition(entry, { activeQuests: ['quest_1'] }), true);
  });

  it('filters entries by conditions', () => {
    const entries = [
      createLootEntry('gold', { condition: CONDITIONS.ALWAYS }).entry,
      createLootEntry('rare', { condition: CONDITIONS.PLAYER_LEVEL, conditionValue: 20 }).entry
    ];
    const filtered = filterByConditions(entries, { playerLevel: 10 });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].itemId, 'gold');
  });
});

// ============================================================================
// Weighted Selection Tests (5 tests)
// ============================================================================

describe('Weighted Selection', () => {
  it('calculates total weight', () => {
    const entries = [
      createLootEntry('a', { weight: 10 }).entry,
      createLootEntry('b', { weight: 20 }).entry,
      createLootEntry('c', { weight: 30 }).entry
    ];
    assert.strictEqual(calculateTotalWeight(entries), 60);
  });

  it('selects entry by weight', () => {
    const entries = [
      createLootEntry('a', { weight: 50 }).entry,
      createLootEntry('b', { weight: 50 }).entry
    ];
    // Random value 0.3 should select first entry (0-0.5 range)
    const result = selectWeightedEntry(entries, 0.3);
    assert.strictEqual(result.itemId, 'a');
  });

  it('selects second entry with higher random', () => {
    const entries = [
      createLootEntry('a', { weight: 50 }).entry,
      createLootEntry('b', { weight: 50 }).entry
    ];
    // Random value 0.7 should select second entry (0.5-1 range)
    const result = selectWeightedEntry(entries, 0.7);
    assert.strictEqual(result.itemId, 'b');
  });

  it('returns null for empty entries', () => {
    const result = selectWeightedEntry([], 0.5);
    assert.strictEqual(result, null);
  });

  it('handles zero total weight', () => {
    const result = selectWeightedEntry([{ weight: 0 }], 0.5);
    assert.strictEqual(result, null);
  });
});

// ============================================================================
// Quantity Tests (4 tests)
// ============================================================================

describe('Quantity Calculation', () => {
  it('calculates basic quantity', () => {
    const entry = createLootEntry('gold', { minQuantity: 1, maxQuantity: 10 }).entry;
    const qty = calculateQuantity(entry, {}, 0.5);
    assert.ok(qty >= 1 && qty <= 10);
  });

  it('respects min quantity', () => {
    const entry = createLootEntry('gold', { minQuantity: 5, maxQuantity: 10 }).entry;
    const qty = calculateQuantity(entry, {}, 0);
    assert.strictEqual(qty, 5);
  });

  it('respects max quantity', () => {
    const entry = createLootEntry('gold', { minQuantity: 5, maxQuantity: 10 }).entry;
    const qty = calculateQuantity(entry, {}, 0.99);
    assert.ok(qty >= 5 && qty <= 10);
  });

  it('applies level scaling', () => {
    const entry = createLootEntry('gold', { minQuantity: 1, maxQuantity: 10 }).entry;
    const qty = calculateQuantity(entry, { levelScaling: true, playerLevel: 30 }, 0.99);
    // Level 30 adds floor(30/10) = 3 to max
    assert.ok(qty <= 13);
  });
});

// ============================================================================
// Roll Tests (10 tests)
// ============================================================================

describe('rollLootTable', () => {
  function createTestTable() {
    let table = createLootTable('test', 'Test', { minDrops: 1, maxDrops: 2 }).table;
    table = addEntry(table, createLootEntry('gold', { weight: 50 }).entry).table;
    table = addEntry(table, createLootEntry('potion', { weight: 30 }).entry).table;
    table = addEntry(table, createLootEntry('gem', { weight: 20 }).entry).table;
    return table;
  }

  it('returns drops array', () => {
    const table = createTestTable();
    const result = rollLootTable(table, {}, () => 0.5);
    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.drops));
  });

  it('respects minDrops', () => {
    let table = createLootTable('test', 'Test', { minDrops: 2, maxDrops: 2 }).table;
    table = addEntry(table, createLootEntry('gold', { weight: 100 }).entry).table;
    const result = rollLootTable(table, {}, () => 0.5);
    assert.strictEqual(result.drops.length, 2);
  });

  it('handles empty chance', () => {
    let table = createLootTable('test', 'Test', { emptyChance: 1 }).table;
    table = addEntry(table, createLootEntry('gold').entry).table;
    const result = rollLootTable(table, {}, () => 0.5);
    assert.strictEqual(result.empty, true);
    assert.strictEqual(result.drops.length, 0);
  });

  it('includes guaranteed drops', () => {
    let table = createLootTable('test', 'Test', { minDrops: 1, maxDrops: 1 }).table;
    table = addEntry(table, createLootEntry('gold', { guaranteed: true }).entry).table;
    table = addEntry(table, createLootEntry('gem', { weight: 100 }).entry).table;
    const result = rollLootTable(table, {}, () => 0.5);
    const goldDrop = result.drops.find(d => d.itemId === 'gold');
    assert.ok(goldDrop);
    assert.strictEqual(goldDrop.guaranteed, true);
  });

  it('drops include rarity', () => {
    let table = createLootTable('test', 'Test').table;
    table = addEntry(table, createLootEntry('gold', { rarity: 'EPIC' }).entry).table;
    const result = rollLootTable(table, {}, () => 0.5);
    assert.strictEqual(result.drops[0].rarity, 'EPIC');
  });

  it('applies bonus drop chance', () => {
    let table = createLootTable('test', 'Test', { minDrops: 1, maxDrops: 1, bonusChance: 1 }).table;
    table = addEntry(table, createLootEntry('gold', { weight: 100 }).entry).table;
    const result = rollLootTable(table, {}, () => 0.5);
    assert.strictEqual(result.drops.length, 2);
  });

  it('filters by context conditions', () => {
    let table = createLootTable('test', 'Test').table;
    table = addEntry(table, createLootEntry('gold', { condition: CONDITIONS.ALWAYS }).entry).table;
    table = addEntry(table, createLootEntry('boss_loot', {
      condition: CONDITIONS.BOSS_KILL,
      guaranteed: true
    }).entry).table;

    const normalResult = rollLootTable(table, { isBoss: false }, () => 0.5);
    const bossResult = rollLootTable(table, { isBoss: true }, () => 0.5);

    assert.ok(!normalResult.drops.some(d => d.itemId === 'boss_loot'));
    assert.ok(bossResult.drops.some(d => d.itemId === 'boss_loot'));
  });
});

// ============================================================================
// Consolidation Tests (3 tests)
// ============================================================================

describe('consolidateDrops', () => {
  it('combines same items', () => {
    const drops = [
      { itemId: 'gold', quantity: 10, rarity: 'COMMON' },
      { itemId: 'gold', quantity: 15, rarity: 'COMMON' }
    ];
    const result = consolidateDrops(drops);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].quantity, 25);
  });

  it('keeps different rarities separate', () => {
    const drops = [
      { itemId: 'gem', quantity: 1, rarity: 'RARE' },
      { itemId: 'gem', quantity: 1, rarity: 'EPIC' }
    ];
    const result = consolidateDrops(drops);
    assert.strictEqual(result.length, 2);
  });

  it('handles empty array', () => {
    const result = consolidateDrops([]);
    assert.strictEqual(result.length, 0);
  });
});

// ============================================================================
// Multiple Tables Tests (2 tests)
// ============================================================================

describe('rollMultipleTables', () => {
  it('rolls multiple tables', () => {
    let registry = createTableRegistry();
    let table1 = createLootTable('t1', 'T1', { minDrops: 1, maxDrops: 1 }).table;
    table1 = addEntry(table1, createLootEntry('gold', { weight: 100 }).entry).table;
    let table2 = createLootTable('t2', 'T2', { minDrops: 1, maxDrops: 1 }).table;
    table2 = addEntry(table2, createLootEntry('gem', { weight: 100 }).entry).table;
    registry = registerTable(registry, table1).registry;
    registry = registerTable(registry, table2).registry;

    const result = rollMultipleTables(registry, ['t1', 't2'], {}, () => 0.5);
    assert.strictEqual(result.success, true);
    assert.ok(result.drops.some(d => d.itemId === 'gold'));
    assert.ok(result.drops.some(d => d.itemId === 'gem'));
  });

  it('ignores missing tables', () => {
    const registry = createTableRegistry();
    const result = rollMultipleTables(registry, ['missing'], {}, () => 0.5);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.drops.length, 0);
  });
});

// ============================================================================
// Luck Modifier Tests (2 tests)
// ============================================================================

describe('applyLuckModifier', () => {
  it('increases rare item weights', () => {
    let table = createLootTable('test', 'Test').table;
    table = addEntry(table, createLootEntry('common', { weight: 100, rarity: 'COMMON' }).entry).table;
    table = addEntry(table, createLootEntry('rare', { weight: 10, rarity: 'RARE' }).entry).table;

    const modified = applyLuckModifier(table, 50);
    const rareEntry = modified.entries.find(e => e.itemId === 'rare');
    assert.ok(rareEntry.weight > 10);
  });

  it('increases bonus chance', () => {
    let table = createLootTable('test', 'Test', { bonusChance: 0.1 }).table;
    const modified = applyLuckModifier(table, 100);
    assert.ok(modified.bonusChance > 0.1);
  });
});

// ============================================================================
// Utility Tests (6 tests)
// ============================================================================

describe('Utility Functions', () => {
  it('gets rarity color', () => {
    assert.strictEqual(getRarityColor('LEGENDARY'), '#FF8000');
    assert.strictEqual(getRarityColor('common'), '#AAAAAA');
  });

  it('returns white for unknown rarity', () => {
    assert.strictEqual(getRarityColor('invalid'), '#FFFFFF');
  });

  it('gets rarity name', () => {
    assert.strictEqual(getRarityName('EPIC'), 'Epic');
  });

  it('gets table info', () => {
    let registry = createTableRegistry();
    const table = createLootTable('test', 'Test').table;
    registry = registerTable(registry, table).registry;
    const info = getTableInfo(registry, 'test');
    assert.strictEqual(info.name, 'Test');
  });

  it('returns null for missing table', () => {
    const registry = createTableRegistry();
    const info = getTableInfo(registry, 'missing');
    assert.strictEqual(info, null);
  });
});

// ============================================================================
// Preset Tests (4 tests)
// ============================================================================

describe('createPresetTable', () => {
  it('creates common_mob preset', () => {
    const result = createPresetTable('common_mob', 5);
    assert.strictEqual(result.success, true);
    assert.ok(result.table.entries.length > 0);
  });

  it('creates boss preset', () => {
    const result = createPresetTable('boss', 10);
    assert.strictEqual(result.success, true);
    assert.ok(result.table.entries.some(e => e.guaranteed));
  });

  it('creates chest preset', () => {
    const result = createPresetTable('chest', 1);
    assert.strictEqual(result.success, true);
  });

  it('fails for unknown preset', () => {
    const result = createPresetTable('invalid', 1);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Preview and Simulation Tests (4 tests)
// ============================================================================

describe('Preview and Simulation', () => {
  function createTestTable() {
    let table = createLootTable('test', 'Test').table;
    table = addEntry(table, createLootEntry('gold', { weight: 50, guaranteed: true }).entry).table;
    table = addEntry(table, createLootEntry('gem', { weight: 30, rarity: 'RARE' }).entry).table;
    table = addEntry(table, createLootEntry('artifact', { weight: 20, rarity: 'EPIC' }).entry).table;
    return table;
  }

  it('generates drop preview', () => {
    const table = createTestTable();
    const preview = getDropPreview(table);
    assert.ok(preview.length > 0);
    const goldPreview = preview.find(p => p.itemId === 'gold');
    assert.strictEqual(goldPreview.guaranteed, true);
    assert.strictEqual(goldPreview.chance, 100);
  });

  it('calculates preview chances', () => {
    const table = createTestTable();
    const preview = getDropPreview(table);
    const gemPreview = preview.find(p => p.itemId === 'gem');
    assert.ok(gemPreview.chance > 0 && gemPreview.chance < 100);
  });

  it('simulates drops', () => {
    const table = createTestTable();
    const results = simulateDrops(table, 100);
    assert.strictEqual(results.iterations, 100);
    assert.ok(results.items.length > 0);
  });

  it('calculates simulation stats', () => {
    let table = createLootTable('test', 'Test', { emptyChance: 0.5 }).table;
    table = addEntry(table, createLootEntry('gold', { weight: 100 }).entry).table;
    const results = simulateDrops(table, 1000);
    assert.ok(results.emptyRate > 30 && results.emptyRate < 70);
  });
});
