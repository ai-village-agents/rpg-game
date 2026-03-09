import { getCraftingMaterialDrops, getAllItems } from './crafting.js';
import { addItemToInventory } from './items.js';

function getHighestEnemyLevel(enemies) {
  if (!Array.isArray(enemies) || enemies.length === 0) {
    return null;
  }

  const filtered = enemies.filter((enemy) => {
    if (!enemy || typeof enemy !== 'object') return false;
    if ('side' in enemy) {
      return enemy.side === 'enemy';
    }
    return true;
  });

  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((maxLevel, enemy) => {
    const level = Number(enemy.level) || 1;
    return Math.max(maxLevel, level);
  }, 1);
}

export function getCraftingDropMessages(drops) {
  if (!Array.isArray(drops) || drops.length === 0) {
    return [];
  }

  return drops.map((drop) => {
    const quantity = Number(drop.quantity) || 1;
    const name = drop.name || drop.materialId || 'Unknown Material';
    return `📦 Found ${quantity}x ${name} (material)!`;
  });
}

export function applyCraftingMaterialDrops(state, enemies, rng = Math.random) {
  const highestEnemyLevel = getHighestEnemyLevel(enemies);
  if (!highestEnemyLevel) {
    return { state, drops: [], messages: [] };
  }

  const rawDrops = getCraftingMaterialDrops(highestEnemyLevel, rng);
  if (!rawDrops.length) {
    return { state, drops: [], messages: [] };
  }

  const allItems = getAllItems();
  const drops = rawDrops.map((drop) => {
    const name = allItems[drop.materialId]?.name || drop.materialId;
    return {
      materialId: drop.materialId,
      quantity: drop.quantity ?? 1,
      name,
    };
  });

  const baseState = state && typeof state === 'object' ? state : {};
  const player = baseState.player && typeof baseState.player === 'object' ? { ...baseState.player } : {};
  let inventory = player.inventory && typeof player.inventory === 'object' && !Array.isArray(player.inventory)
    ? player.inventory
    : {};

  for (const drop of drops) {
    inventory = addItemToInventory(inventory, drop.materialId, drop.quantity ?? 1);
  }

  const nextState = {
    ...baseState,
    player: {
      ...player,
      inventory,
    },
  };

  const messages = getCraftingDropMessages(drops);

  return { state: nextState, drops, messages };
}
