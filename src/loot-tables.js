/**
 * Loot / Drop Table System
 * Enemy-specific drop tables with rarity-weighted random selection.
 * Uses deterministic RNG (nextRng) for reproducible drops.
 * Created by Claude Opus 4.6 (Villager) on Day 342.
 */

import { nextRng } from './combat.js';
import { items } from './data/items.js';
import { getItemDropMultiplier } from './world-events.js';

/**
 * Enemy-specific drop tables.
 * Each entry maps an enemy ID to:
 *   dropChance  – base probability (0-1) of getting any loot
 *   maxDrops    – maximum items per kill
 *   drops       – [{itemId, weight}] specific item pool
 *   bonusRarityWeights – {Common,Uncommon,Rare,Epic,Legendary} for bonus random drops
 */
export const ENEMY_DROP_TABLES = Object.freeze({
  slime: {
    dropChance: 0.40,
    maxDrops: 1,
    drops: [
      { itemId: 'potion', weight: 80 },
      { itemId: 'antidote', weight: 20 },
    ],
    bonusRarityWeights: { Common: 85, Uncommon: 14, Rare: 1, Epic: 0, Legendary: 0 },
  },
  goblin: {
    dropChance: 0.50,
    maxDrops: 1,
    drops: [
      { itemId: 'potion', weight: 40 },
      { itemId: 'rustySword', weight: 25 },
      { itemId: 'leatherArmor', weight: 20 },
      { itemId: 'bomb', weight: 15 },
    ],
    bonusRarityWeights: { Common: 70, Uncommon: 25, Rare: 4, Epic: 1, Legendary: 0 },
  },
  goblin_chief: {
    dropChance: 0.75,
    maxDrops: 2,
    drops: [
      { itemId: 'ironSword', weight: 30 },
      { itemId: 'chainmail', weight: 25 },
      { itemId: 'hiPotion', weight: 20 },
      { itemId: 'bomb', weight: 15 },
      { itemId: 'bootsOfSwiftness', weight: 10 },
    ],
    bonusRarityWeights: { Common: 50, Uncommon: 30, Rare: 15, Epic: 5, Legendary: 0 },
  },
  cave_bat: {
    dropChance: 0.25,
    maxDrops: 1,
    drops: [
      { itemId: 'potion', weight: 70 },
      { itemId: 'antidote', weight: 30 },
    ],
    bonusRarityWeights: { Common: 90, Uncommon: 9, Rare: 1, Epic: 0, Legendary: 0 },
  },
  giant_spider: {
    dropChance: 0.45,
    maxDrops: 1,
    drops: [
      { itemId: 'antidote', weight: 40 },
      { itemId: 'potion', weight: 35 },
      { itemId: 'leatherArmor', weight: 25 },
    ],
    bonusRarityWeights: { Common: 70, Uncommon: 25, Rare: 5, Epic: 0, Legendary: 0 },
  },
  training_dummy: {
    dropChance: 0.10,
    maxDrops: 1,
    drops: [
      { itemId: 'potion', weight: 100 },
    ],
    bonusRarityWeights: { Common: 100, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0 },
  },
  wolf: {
    dropChance: 0.35,
    maxDrops: 1,
    drops: [
      { itemId: 'potion', weight: 50 },
      { itemId: 'leatherArmor', weight: 30 },
      { itemId: 'antidote', weight: 20 },
    ],
    bonusRarityWeights: { Common: 75, Uncommon: 20, Rare: 5, Epic: 0, Legendary: 0 },
  },
  skeleton: {
    dropChance: 0.55,
    maxDrops: 2,
    drops: [
      { itemId: 'potion', weight: 25 },
      { itemId: 'ironSword', weight: 20 },
      { itemId: 'chainmail', weight: 15 },
      { itemId: 'ether', weight: 20 },
      { itemId: 'bomb', weight: 20 },
    ],
    bonusRarityWeights: { Common: 60, Uncommon: 25, Rare: 12, Epic: 3, Legendary: 0 },
  },
  orc: {
    dropChance: 0.60,
    maxDrops: 2,
    drops: [
      { itemId: 'ironSword', weight: 25 },
      { itemId: 'chainmail', weight: 25 },
      { itemId: 'hiPotion', weight: 20 },
      { itemId: 'bomb', weight: 15 },
      { itemId: 'bootsOfSwiftness', weight: 15 },
    ],
    bonusRarityWeights: { Common: 50, Uncommon: 30, Rare: 15, Epic: 5, Legendary: 0 },
  },
  'fire-spirit': {
    dropChance: 0.55,
    maxDrops: 2,
    drops: [
      { itemId: 'fire-gem', weight: 30 },
      { itemId: 'ether', weight: 25 },
      { itemId: 'bomb', weight: 20 },
      { itemId: 'mageRobe', weight: 15 },
      { itemId: 'arcaneStaff', weight: 10 },
    ],
    bonusRarityWeights: { Common: 45, Uncommon: 30, Rare: 18, Epic: 7, Legendary: 0 },
  },
  'ice-spirit': {
    dropChance: 0.55,
    maxDrops: 2,
    drops: [
      { itemId: 'ether', weight: 30 },
      { itemId: 'mageRobe', weight: 25 },
      { itemId: 'hiPotion', weight: 20 },
      { itemId: 'arcaneStaff', weight: 15 },
      { itemId: 'ringOfFortune', weight: 10 },
    ],
    bonusRarityWeights: { Common: 45, Uncommon: 30, Rare: 18, Epic: 7, Legendary: 0 },
  },
  'dark-cultist': {
    dropChance: 0.60,
    maxDrops: 2,
    drops: [
      { itemId: 'shadow-essence', weight: 25 },
      { itemId: 'ether', weight: 20 },
      { itemId: 'mageRobe', weight: 20 },
      { itemId: 'arcaneStaff', weight: 15 },
      { itemId: 'shadowCloak', weight: 10 },
      { itemId: 'amuletOfVigor', weight: 10 },
    ],
    bonusRarityWeights: { Common: 40, Uncommon: 30, Rare: 20, Epic: 8, Legendary: 2 },
  },
  'giant-spider': {
    dropChance: 0.40,
    maxDrops: 1,
    drops: [
      { itemId: 'antidote', weight: 40 },
      { itemId: 'potion', weight: 30 },
      { itemId: 'leatherArmor', weight: 20 },
      { itemId: 'bootsOfSwiftness', weight: 10 },
    ],
    bonusRarityWeights: { Common: 75, Uncommon: 20, Rare: 4, Epic: 1, Legendary: 0 },
  },
  bandit: {
    dropChance: 0.55,
    maxDrops: 2,
    drops: [
      { itemId: 'potion', weight: 20 },
      { itemId: 'ironSword', weight: 20 },
      { itemId: 'chainmail', weight: 15 },
      { itemId: 'bomb', weight: 15 },
      { itemId: 'ringOfFortune', weight: 10 },
      { itemId: 'hiPotion', weight: 20 },
    ],
    bonusRarityWeights: { Common: 55, Uncommon: 25, Rare: 15, Epic: 5, Legendary: 0 },
  },
  wraith: {
    dropChance: 0.65,
    maxDrops: 2,
    drops: [
      { itemId: 'shadow-essence', weight: 30 },
      { itemId: 'ether', weight: 20 },
      { itemId: 'shadowCloak', weight: 20 },
      { itemId: 'amuletOfVigor', weight: 15 },
      { itemId: 'arcaneStaff', weight: 15 },
    ],
    bonusRarityWeights: { Common: 35, Uncommon: 30, Rare: 22, Epic: 10, Legendary: 3 },
  },
  'stone-golem': {
    dropChance: 0.60,
    maxDrops: 2,
    drops: [
      { itemId: 'guardian-bark', weight: 25 },
      { itemId: 'chainmail', weight: 25 },
      { itemId: 'ironSword', weight: 20 },
      { itemId: 'amuletOfVigor', weight: 15 },
      { itemId: 'shadowCloak', weight: 15 },
    ],
    bonusRarityWeights: { Common: 40, Uncommon: 30, Rare: 20, Epic: 8, Legendary: 2 },
  },
  'thunder-hawk': {
    dropChance: 0.45,
    maxDrops: 1,
    drops: [
      { itemId: 'ether', weight: 30 },
      { itemId: 'bootsOfSwiftness', weight: 25 },
      { itemId: 'ringOfFortune', weight: 20 },
      { itemId: 'hiPotion', weight: 25 },
    ],
    bonusRarityWeights: { Common: 55, Uncommon: 25, Rare: 15, Epic: 5, Legendary: 0 },
  },
  dragon: {
    dropChance: 0.90,
    maxDrops: 3,
    drops: [
      { itemId: 'dragon-scale', weight: 25 },
      { itemId: 'dragonSpear', weight: 15 },
      { itemId: 'fire-gem', weight: 20 },
      { itemId: 'shadowCloak', weight: 10 },
      { itemId: 'arcaneStaff', weight: 10 },
      { itemId: 'amuletOfVigor', weight: 10 },
      { itemId: 'ringOfFortune', weight: 10 },
    ],
    bonusRarityWeights: { Common: 10, Uncommon: 20, Rare: 30, Epic: 25, Legendary: 15 },
  },
  abyss_overlord: {
    dropChance: 0.98,
    maxDrops: 4,
    drops: [
      { itemId: 'abyssalShard', weight: 20 },
      { itemId: 'abyssalRing', weight: 10 },
      { itemId: 'abyssalMail', weight: 15 },
      { itemId: 'phoenixPinion', weight: 8 },
      { itemId: 'voidblade', weight: 12 },
      { itemId: 'abyssalScepter', weight: 10 },
      { itemId: 'megaPotion', weight: 15 },
      { itemId: 'lightningOrb', weight: 10 },
    ],
    bonusRarityWeights: { Common: 5, Uncommon: 15, Rare: 25, Epic: 35, Legendary: 20 },
  },
});

/**
 * Select an item from a weighted drops array given an RNG value (0-1).
 * @param {Array<{itemId:string, weight:number}>} drops
 * @param {number} rngValue - A value between 0 and 1
 * @returns {string} The selected itemId
 */
export function selectWeightedDrop(drops, rngValue) {
  if (!drops || drops.length === 0) return null;

  const totalWeight = drops.reduce((sum, d) => sum + Math.max(0, d.weight), 0);
  if (totalWeight <= 0) return null;

  let threshold = rngValue * totalWeight;
  for (const drop of drops) {
    const w = Math.max(0, drop.weight);
    if (threshold < w) {
      return drop.itemId;
    }
    threshold -= w;
  }
  // Fallback to last item (floating-point edge case)
  return drops[drops.length - 1].itemId;
}

/**
 * Get a deep copy of the drop table for an enemy.
 * @param {string} enemyId
 * @returns {object|null}
 */
export function getDropTable(enemyId) {
  const table = ENEMY_DROP_TABLES[enemyId];
  if (!table) return null;
  return JSON.parse(JSON.stringify(table));
}

/**
 * Roll loot drops for a defeated enemy using deterministic RNG.
 * @param {string} enemyId - The enemy identifier
 * @param {number} seed - RNG seed
 * @returns {{lootedItems: Array<{itemId:string, name:string, rarity:string}>, seed: number}}
 */
export function rollLootDrop(enemyId, seed, worldEvent = null) {
  const table = ENEMY_DROP_TABLES[enemyId];
  if (!table) {
    return { lootedItems: [], seed };
  }

  // Roll against dropChance
  let rng = nextRng(seed);
  seed = rng.seed;
  if (rng.value >= table.dropChance) {
    return { lootedItems: [], seed };
  }

  // Determine number of drops (1 to maxDrops)
  rng = nextRng(seed);
  seed = rng.seed;
  const numDrops = Math.min(table.maxDrops, 1 + Math.floor(rng.value * table.maxDrops));
  const dropMultiplier = getItemDropMultiplier(worldEvent);
  const effectiveNumDrops = Math.min(table.maxDrops * 2, Math.ceil(numDrops * dropMultiplier));

  const lootedItems = [];
  const seenIds = new Set();

  for (let i = 0; i < effectiveNumDrops; i++) {
    // Roll for item selection
    rng = nextRng(seed);
    seed = rng.seed;
    let selectedId = selectWeightedDrop(table.drops, rng.value);

    // Avoid duplicates: if already seen, try one reroll
    if (seenIds.has(selectedId)) {
      rng = nextRng(seed);
      seed = rng.seed;
      selectedId = selectWeightedDrop(table.drops, rng.value);
    }

    // If still duplicate after reroll, skip this slot
    if (seenIds.has(selectedId)) {
      continue;
    }

    seenIds.add(selectedId);

    const itemData = items[selectedId];
    lootedItems.push({
      itemId: selectedId,
      name: itemData ? itemData.name : selectedId,
      rarity: itemData ? itemData.rarity : 'Common',
    });
  }

  return { lootedItems, seed };
}

/**
 * Apply looted items to the game state immutably.
 * Adds items to player.inventory and sets state.lootedItems for battle-summary.
 * @param {object} state - Current game state
 * @param {Array<{itemId:string, name:string, rarity:string}>} lootedItems
 * @returns {object} New state with loot applied
 */
export function applyLootToState(state, lootedItems) {
  if (!lootedItems || lootedItems.length === 0) {
    return { ...state, lootedItems: [] };
  }

  let inventory = { ...(state.player?.inventory ?? {}) };
  for (const loot of lootedItems) {
    const current = inventory[loot.itemId] || 0;
    inventory[loot.itemId] = current + 1;
  }

  return {
    ...state,
    lootedItems,
    player: {
      ...state.player,
      inventory,
    },
  };
}
