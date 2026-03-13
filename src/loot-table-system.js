/**
 * Loot Table System
 * Define and roll random loot drops for enemies, chests, and events
 */

// Rarity levels
export const RARITY = {
  COMMON: { name: 'Common', weight: 60, color: '#AAAAAA' },
  UNCOMMON: { name: 'Uncommon', weight: 25, color: '#1EFF00' },
  RARE: { name: 'Rare', weight: 10, color: '#0070DD' },
  EPIC: { name: 'Epic', weight: 4, color: '#A335EE' },
  LEGENDARY: { name: 'Legendary', weight: 1, color: '#FF8000' }
};

// Drop conditions
export const CONDITIONS = {
  ALWAYS: 'always',
  PLAYER_LEVEL: 'playerLevel',
  BOSS_KILL: 'bossKill',
  FIRST_KILL: 'firstKill',
  QUEST_ACTIVE: 'questActive',
  CHANCE: 'chance'
};

// Create loot table entry
export function createLootEntry(itemId, options = {}) {
  if (!itemId) {
    return { success: false, error: 'Invalid item id' };
  }

  return {
    success: true,
    entry: {
      itemId,
      weight: options.weight ?? 10,
      minQuantity: options.minQuantity ?? 1,
      maxQuantity: options.maxQuantity ?? 1,
      rarity: options.rarity || 'COMMON',
      condition: options.condition || CONDITIONS.ALWAYS,
      conditionValue: options.conditionValue || null,
      guaranteed: options.guaranteed ?? false
    }
  };
}

// Create loot table
export function createLootTable(id, name, options = {}) {
  if (!id || !name) {
    return { success: false, error: 'Invalid table id or name' };
  }

  return {
    success: true,
    table: {
      id,
      name,
      entries: [],
      minDrops: options.minDrops ?? 1,
      maxDrops: options.maxDrops ?? 3,
      guaranteedDrops: options.guaranteedDrops ?? 0,
      emptyChance: options.emptyChance ?? 0,
      bonusChance: options.bonusChance ?? 0,
      levelScaling: options.levelScaling ?? false,
      tags: options.tags || []
    }
  };
}

// Add entry to table
export function addEntry(table, entry) {
  if (!entry || !entry.itemId) {
    return { success: false, error: 'Invalid entry' };
  }

  return {
    success: true,
    table: {
      ...table,
      entries: [...table.entries, entry]
    }
  };
}

// Remove entry from table
export function removeEntry(table, itemId) {
  const filtered = table.entries.filter(e => e.itemId !== itemId);
  if (filtered.length === table.entries.length) {
    return { success: false, error: 'Entry not found' };
  }

  return {
    success: true,
    table: {
      ...table,
      entries: filtered
    }
  };
}

// Create table registry
export function createTableRegistry() {
  return {
    tables: {},
    byTag: {}
  };
}

// Register table
export function registerTable(registry, table) {
  if (!table || !table.id) {
    return { success: false, error: 'Invalid table' };
  }

  if (registry.tables[table.id]) {
    return { success: false, error: 'Table already registered' };
  }

  const newTables = { ...registry.tables, [table.id]: table };

  // Index by tags
  const newByTag = { ...registry.byTag };
  for (const tag of table.tags) {
    newByTag[tag] = [...(newByTag[tag] || []), table.id];
  }

  return {
    success: true,
    registry: {
      tables: newTables,
      byTag: newByTag
    }
  };
}

// Check condition
export function checkCondition(entry, context = {}) {
  switch (entry.condition) {
    case CONDITIONS.ALWAYS:
      return true;

    case CONDITIONS.PLAYER_LEVEL:
      return (context.playerLevel || 1) >= (entry.conditionValue || 1);

    case CONDITIONS.BOSS_KILL:
      return context.isBoss === true;

    case CONDITIONS.FIRST_KILL:
      return context.isFirstKill === true;

    case CONDITIONS.QUEST_ACTIVE:
      return (context.activeQuests || []).includes(entry.conditionValue);

    case CONDITIONS.CHANCE:
      return Math.random() < (entry.conditionValue || 1);

    default:
      return true;
  }
}

// Filter entries by conditions
export function filterByConditions(entries, context = {}) {
  return entries.filter(entry => checkCondition(entry, context));
}

// Calculate total weight
export function calculateTotalWeight(entries) {
  return entries.reduce((sum, e) => sum + e.weight, 0);
}

// Select weighted random entry
export function selectWeightedEntry(entries, randomValue = Math.random()) {
  const totalWeight = calculateTotalWeight(entries);
  if (totalWeight === 0 || entries.length === 0) return null;

  let threshold = randomValue * totalWeight;

  for (const entry of entries) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry;
    }
  }

  return entries[entries.length - 1];
}

// Calculate quantity
export function calculateQuantity(entry, context = {}, randomValue = Math.random()) {
  let min = entry.minQuantity;
  let max = entry.maxQuantity;

  // Level scaling
  if (context.levelScaling && context.playerLevel) {
    const levelBonus = Math.floor(context.playerLevel / 10);
    max += levelBonus;
  }

  // Luck bonus
  if (context.luckBonus) {
    const extraChance = context.luckBonus / 100;
    if (Math.random() < extraChance) {
      max += 1;
    }
  }

  return Math.floor(min + randomValue * (max - min + 1));
}

// Roll loot table
export function rollLootTable(table, context = {}, randomFn = Math.random) {
  const drops = [];

  // Check for empty roll
  if (randomFn() < table.emptyChance) {
    return { success: true, drops: [], empty: true };
  }

  // Get valid entries
  const validEntries = filterByConditions(table.entries, context);

  // Get guaranteed entries
  const guaranteedEntries = validEntries.filter(e => e.guaranteed);
  for (const entry of guaranteedEntries) {
    const quantity = calculateQuantity(entry, context, randomFn());
    drops.push({
      itemId: entry.itemId,
      quantity,
      rarity: entry.rarity,
      guaranteed: true
    });
  }

  // Determine number of drops
  let numDrops = table.minDrops + Math.floor(randomFn() * (table.maxDrops - table.minDrops + 1));

  // Bonus drop chance
  if (randomFn() < table.bonusChance) {
    numDrops += 1;
  }

  // Roll for non-guaranteed drops
  const rollableEntries = validEntries.filter(e => !e.guaranteed);

  for (let i = 0; i < numDrops && rollableEntries.length > 0; i++) {
    const entry = selectWeightedEntry(rollableEntries, randomFn());
    if (entry) {
      const quantity = calculateQuantity(entry, context, randomFn());
      drops.push({
        itemId: entry.itemId,
        quantity,
        rarity: entry.rarity,
        guaranteed: false
      });
    }
  }

  return { success: true, drops, empty: false };
}

// Roll multiple tables
export function rollMultipleTables(registry, tableIds, context = {}, randomFn = Math.random) {
  const allDrops = [];

  for (const tableId of tableIds) {
    const table = registry.tables[tableId];
    if (table) {
      const result = rollLootTable(table, context, randomFn);
      if (result.success && !result.empty) {
        allDrops.push(...result.drops);
      }
    }
  }

  return { success: true, drops: consolidateDrops(allDrops) };
}

// Consolidate duplicate drops
export function consolidateDrops(drops) {
  const consolidated = {};

  for (const drop of drops) {
    const key = `${drop.itemId}_${drop.rarity}`;
    if (consolidated[key]) {
      consolidated[key].quantity += drop.quantity;
    } else {
      consolidated[key] = { ...drop };
    }
  }

  return Object.values(consolidated);
}

// Apply luck modifier
export function applyLuckModifier(table, luckPercent) {
  if (luckPercent <= 0) return table;

  const modifier = 1 + (luckPercent / 100);

  const modifiedEntries = table.entries.map(entry => {
    // Increase weight of rarer items
    const rarityData = RARITY[entry.rarity];
    if (rarityData && rarityData.weight < 30) {
      return {
        ...entry,
        weight: Math.round(entry.weight * modifier)
      };
    }
    return entry;
  });

  return {
    ...table,
    entries: modifiedEntries,
    bonusChance: Math.min(1, table.bonusChance * modifier)
  };
}

// Get rarity color
export function getRarityColor(rarity) {
  return RARITY[rarity?.toUpperCase()]?.color || '#FFFFFF';
}

// Get rarity name
export function getRarityName(rarity) {
  return RARITY[rarity?.toUpperCase()]?.name || 'Unknown';
}

// Get tables by tag
export function getTablesByTag(registry, tag) {
  const tableIds = registry.byTag[tag] || [];
  return tableIds.map(id => registry.tables[id]).filter(Boolean);
}

// Get table info
export function getTableInfo(registry, tableId) {
  return registry.tables[tableId] || null;
}

// Create preset tables
export function createPresetTable(presetType, level = 1) {
  const presets = {
    'common_mob': {
      name: 'Common Mob Drops',
      minDrops: 0,
      maxDrops: 2,
      emptyChance: 0.3,
      entries: [
        { itemId: 'gold', weight: 50, minQuantity: 1, maxQuantity: 5 + level, rarity: 'COMMON' },
        { itemId: 'healing_herb', weight: 20, rarity: 'COMMON' },
        { itemId: 'cloth', weight: 15, rarity: 'COMMON' }
      ]
    },
    'elite_mob': {
      name: 'Elite Mob Drops',
      minDrops: 1,
      maxDrops: 3,
      emptyChance: 0,
      bonusChance: 0.2,
      entries: [
        { itemId: 'gold', weight: 40, minQuantity: 10, maxQuantity: 25 + level * 2, rarity: 'COMMON' },
        { itemId: 'rare_material', weight: 25, rarity: 'UNCOMMON' },
        { itemId: 'equipment', weight: 15, rarity: 'RARE' }
      ]
    },
    'boss': {
      name: 'Boss Drops',
      minDrops: 2,
      maxDrops: 5,
      emptyChance: 0,
      guaranteedDrops: 1,
      bonusChance: 0.3,
      entries: [
        { itemId: 'gold', weight: 30, minQuantity: 50, maxQuantity: 100 + level * 5, rarity: 'COMMON', guaranteed: true },
        { itemId: 'boss_material', weight: 40, rarity: 'RARE', guaranteed: true },
        { itemId: 'epic_gear', weight: 20, rarity: 'EPIC' },
        { itemId: 'legendary_token', weight: 5, rarity: 'LEGENDARY' }
      ]
    },
    'chest': {
      name: 'Chest Loot',
      minDrops: 2,
      maxDrops: 4,
      emptyChance: 0,
      entries: [
        { itemId: 'gold', weight: 35, minQuantity: 20, maxQuantity: 50, rarity: 'COMMON' },
        { itemId: 'potion', weight: 25, rarity: 'COMMON' },
        { itemId: 'scroll', weight: 20, rarity: 'UNCOMMON' },
        { itemId: 'gem', weight: 15, rarity: 'RARE' },
        { itemId: 'rare_artifact', weight: 5, rarity: 'EPIC' }
      ]
    }
  };

  const preset = presets[presetType];
  if (!preset) {
    return { success: false, error: 'Unknown preset type' };
  }

  const tableResult = createLootTable(`${presetType}_${level}`, preset.name, {
    minDrops: preset.minDrops,
    maxDrops: preset.maxDrops,
    emptyChance: preset.emptyChance || 0,
    bonusChance: preset.bonusChance || 0,
    guaranteedDrops: preset.guaranteedDrops || 0
  });

  let table = tableResult.table;
  for (const entryData of preset.entries) {
    const entry = createLootEntry(entryData.itemId, entryData).entry;
    table = addEntry(table, entry).table;
  }

  return { success: true, table };
}

// Get drop preview (for UI)
export function getDropPreview(table, context = {}) {
  const validEntries = filterByConditions(table.entries, context);
  const totalWeight = calculateTotalWeight(validEntries.filter(e => !e.guaranteed));

  return validEntries.map(entry => {
    const chance = entry.guaranteed
      ? 100
      : Math.round((entry.weight / totalWeight) * 100 * 10) / 10;

    return {
      itemId: entry.itemId,
      chance,
      rarity: entry.rarity,
      minQuantity: entry.minQuantity,
      maxQuantity: entry.maxQuantity,
      guaranteed: entry.guaranteed
    };
  }).sort((a, b) => b.chance - a.chance);
}

// Simulate drops (for testing/preview)
export function simulateDrops(table, iterations = 1000, context = {}) {
  const results = {};
  let totalDrops = 0;
  let emptyRolls = 0;

  for (let i = 0; i < iterations; i++) {
    const roll = rollLootTable(table, context);
    if (roll.empty) {
      emptyRolls++;
      continue;
    }

    for (const drop of roll.drops) {
      const key = drop.itemId;
      if (!results[key]) {
        results[key] = { itemId: drop.itemId, count: 0, totalQuantity: 0, rarity: drop.rarity };
      }
      results[key].count++;
      results[key].totalQuantity += drop.quantity;
      totalDrops++;
    }
  }

  return {
    iterations,
    emptyRolls,
    emptyRate: Math.round((emptyRolls / iterations) * 100),
    avgDropsPerRoll: Math.round((totalDrops / (iterations - emptyRolls)) * 10) / 10,
    items: Object.values(results).map(r => ({
      ...r,
      dropRate: Math.round((r.count / iterations) * 100 * 10) / 10,
      avgQuantity: Math.round((r.totalQuantity / r.count) * 10) / 10
    })).sort((a, b) => b.dropRate - a.dropRate)
  };
}
