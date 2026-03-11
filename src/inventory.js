// Inventory Management Module
// Handles INVENTORY phase: viewing items, using consumables, equipping gear
// Built on DeepSeek's items system (src/items.js, src/data/items.js)
// and Opus 4.6's exploration loop (PR #28)
// Created by Claude Opus 4.6 (Day 338)

import { items } from './data/items.js';
import { getEquipmentSetBonuses } from './equipment-sets.js';
import { useItem, getInventoryDisplay, addItemToInventory, removeItemFromInventory } from './items.js';

// Equipment slot definitions
export const EQUIPMENT_SLOTS = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
};

// Item type to equipment slot mapping
const TYPE_TO_SLOT = {
  weapon: 'weapon',
  armor: 'armor',
  accessory: 'accessory',
};

/**
 * Get the equipment slot for an item, or null if not equippable.
 * @param {string} itemId
 * @returns {string|null}
 */
export function getEquipSlot(itemId) {
  const item = items[itemId];
  if (!item) return null;
  return TYPE_TO_SLOT[item.type] || null;
}

/**
 * Check if an item is equippable (weapon, armor, or accessory).
 * @param {string} itemId
 * @returns {boolean}
 */
export function isEquippable(itemId) {
  return getEquipSlot(itemId) !== null;
}

/**
 * Check if an item is usable (consumable type).
 * @param {string} itemId
 * @returns {boolean}
 */
export function isUsable(itemId) {
  const item = items[itemId];
  return item?.type === 'consumable';
}

/**
 * Get item details for display purposes.
 * @param {string} itemId
 * @returns {object|null}
 */
export function getItemDetails(itemId) {
  const item = items[itemId];
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    description: item.description,
    stats: item.stats || {},
    effect: item.effect || {},
    value: item.value || 0,
    equippable: isEquippable(itemId),
    usable: isUsable(itemId),
    slot: getEquipSlot(itemId),
  };
}

/**
 * Initialize equipment on a player if not present.
 * @param {object} player
 * @returns {object} player with equipment field
 */
export function ensureEquipment(player) {
  if (player.equipment) return player;
  return {
    ...player,
    equipment: {
      weapon: null,
      armor: null,
      accessory: null,
    },
  };
}

/**
 * Get stat bonuses from all equipped items.
 * @param {object} equipment - { weapon, armor, accessory } with item IDs or null
 * @returns {object} - stat bonus totals
 */
export function getEquipmentBonuses(equipment) {
  const bonuses = { attack: 0, defense: 0, speed: 0, magic: 0, critChance: 0 };
  if (!equipment) return bonuses;

  for (const slot of Object.keys(EQUIPMENT_SLOTS)) {
    const itemId = equipment[slot];
    if (!itemId) continue;
    const item = items[itemId];
    if (!item || !item.stats) continue;
    for (const [stat, value] of Object.entries(item.stats)) {
      if (typeof value === 'number') {
        bonuses[stat] = (bonuses[stat] || 0) + value;
      }
    }
  }

  const setBonuses = getEquipmentSetBonuses(equipment);
  for (const [stat, value] of Object.entries(setBonuses)) {
    bonuses[stat] = (bonuses[stat] || 0) + value;
  }
  return bonuses;
}

/**
 * Equip an item from inventory. Returns updated player state.
 * If the slot already has an item, the old item is returned to inventory.
 * The equipped item is removed from inventory.
 * @param {object} player
 * @param {string} itemId
 * @returns {{ player: object, success: boolean, message: string }}
 */
export function equipItem(player, itemId) {
  const item = items[itemId];
  if (!item) {
    return { player, success: false, message: `Item not found: ${itemId}` };
  }

  const slot = getEquipSlot(itemId);
  if (!slot) {
    return { player, success: false, message: `${item.name} cannot be equipped.` };
  }

  const inventory = player.inventory || {};
  const count = inventory[itemId] || 0;
  if (count <= 0) {
    return { player, success: false, message: `You don't have ${item.name} in your inventory.` };
  }

  let p = ensureEquipment(player);
  let newInventory = removeItemFromInventory({ ...inventory }, itemId, 1);

  // Unequip current item in that slot (return to inventory)
  const currentEquipped = p.equipment[slot];
  if (currentEquipped) {
    newInventory = addItemToInventory(newInventory, currentEquipped, 1);
  }

  const newEquipment = { ...p.equipment, [slot]: itemId };

  return {
    player: { ...p, inventory: newInventory, equipment: newEquipment },
    success: true,
    message: currentEquipped
      ? `Equipped ${item.name}. Unequipped ${items[currentEquipped]?.name || currentEquipped}.`
      : `Equipped ${item.name}.`,
  };
}

/**
 * Unequip an item from a slot, returning it to inventory.
 * @param {object} player
 * @param {string} slot - 'weapon', 'armor', or 'accessory'
 * @returns {{ player: object, success: boolean, message: string }}
 */
export function unequipItem(player, slot) {
  if (!EQUIPMENT_SLOTS[slot]) {
    return { player, success: false, message: `Invalid equipment slot: ${slot}` };
  }

  let p = ensureEquipment(player);
  const currentEquipped = p.equipment[slot];
  if (!currentEquipped) {
    return { player: p, success: false, message: `Nothing equipped in ${EQUIPMENT_SLOTS[slot]} slot.` };
  }

  const newInventory = addItemToInventory({ ...(p.inventory || {}) }, currentEquipped, 1);
  const newEquipment = { ...p.equipment, [slot]: null };
  const itemName = items[currentEquipped]?.name || currentEquipped;

  return {
    player: { ...p, inventory: newInventory, equipment: newEquipment },
    success: true,
    message: `Unequipped ${itemName}.`,
  };
}

/**
 * Use a consumable item on the player character.
 * @param {object} player
 * @returns {{ player: object, success: boolean, message: string }}
 */
export function useConsumable(player, itemId) {
  const result = useItem(itemId, player, {});
  if (!result.success) {
    return { player, success: false, message: result.message };
  }

  let updatedPlayer = { ...player };
  const effects = result.effects || {};

  if (effects.hp !== undefined) updatedPlayer.hp = effects.hp;
  if (effects.mp !== undefined) updatedPlayer.mp = effects.mp;
  if (effects.inventory) updatedPlayer.inventory = effects.inventory;
  if (effects.cureStatus && Array.isArray(updatedPlayer.statusEffects)) {
    updatedPlayer.statusEffects = updatedPlayer.statusEffects.filter(
      (s) => !effects.cureStatus.includes(s)
    );
  }

  return { player: updatedPlayer, success: true, message: result.message };
}

/**
 * Get categorized inventory for display.
 * @param {object} inventory - { itemId: count }
 * @returns {{ consumables: Array, weapons: Array, armors: Array, accessories: Array, unknown: Array }}
 */
export function getCategorizedInventory(inventory) {
  const categories = {
    consumables: [],
    weapons: [],
    armors: [],
    accessories: [],
    unknown: [],
  };

  if (!inventory) return categories;

  for (const [itemId, count] of Object.entries(inventory)) {
    if (count <= 0) continue;
    const item = items[itemId];
    if (!item) {
      categories.unknown.push({ id: itemId, name: itemId, count });
      continue;
    }
    const entry = {
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      description: item.description,
      count,
      value: item.value || 0,
      stats: item.stats || {},
    };
    switch (item.type) {
      case 'consumable': categories.consumables.push(entry); break;
      case 'weapon': categories.weapons.push(entry); break;
      case 'armor': categories.armors.push(entry); break;
      case 'accessory': categories.accessories.push(entry); break;
      default: categories.unknown.push(entry);
    }
  }

  return categories;
}

/**
 * Get equipment display info.
 * @param {object} equipment - { weapon, armor, accessory } with item IDs
 * @returns {object} - { weapon: { name, stats, ... }|null, ... }
 */
export function getEquipmentDisplay(equipment) {
  const display = {};
  if (!equipment) {
    return { weapon: null, armor: null, accessory: null };
  }
  for (const [slot, itemId] of Object.entries(equipment)) {
    if (!itemId) {
      display[slot] = null;
      continue;
    }
    const item = items[itemId];
    display[slot] = item
      ? { id: item.id, name: item.name, rarity: item.rarity, stats: item.stats || {} }
      : { id: itemId, name: itemId, rarity: 'Common', stats: {} };
  }
  return display;
}


/**
 * Compare a candidate equippable item against the currently equipped item in the same slot.
 * Returns an array of { stat, current, candidate, diff } objects for all relevant stats.
 * @param {object} equipment - player.equipment { weapon, armor, accessory }
 * @param {string} candidateItemId - the item ID to compare
 * @returns {{ slot: string, comparisons: Array<{stat: string, current: number, candidate: number, diff: number}> } | null}
 */
export function getEquipmentComparison(equipment, candidateItemId) {
  const candidateItem = items[candidateItemId];
  if (!candidateItem) return null;
  const slot = TYPE_TO_SLOT[candidateItem.type];
  if (!slot) return null;

  const currentItemId = equipment ? equipment[slot] : null;
  const currentItem = currentItemId ? items[currentItemId] : null;

  const allStats = new Set();
  const candidateStats = candidateItem.stats || {};
  const currentStats = currentItem ? (currentItem.stats || {}) : {};

  for (const s of Object.keys(candidateStats)) allStats.add(s);
  for (const s of Object.keys(currentStats)) allStats.add(s);

  const comparisons = [];
  for (const stat of allStats) {
    const currentVal = typeof currentStats[stat] === 'number' ? currentStats[stat] : 0;
    const candidateVal = typeof candidateStats[stat] === 'number' ? candidateStats[stat] : 0;
    comparisons.push({
      stat,
      current: currentVal,
      candidate: candidateVal,
      diff: candidateVal - currentVal,
    });
  }

  return {
    slot,
    currentItemName: currentItem ? currentItem.name : null,
    comparisons,
  };
}

// --- Inventory sub-screens for the INVENTORY phase ---

export const INVENTORY_SCREENS = {
  MAIN: 'main',        // Overview: items + equipment summary
  USE_ITEM: 'useItem',  // Selecting a consumable to use
  EQUIP: 'equip',       // Selecting an item to equip
  UNEQUIP: 'unequip',   // Selecting a slot to unequip
  DETAILS: 'details',   // Viewing item details
};

/**
 * Create the initial inventory phase state.
 * @param {string} returnPhase - Phase to return to when closing inventory ('exploration', 'victory', etc.)
 * @returns {object}
 */
export function createInventoryState(returnPhase) {
  return {
    screen: INVENTORY_SCREENS.MAIN,
    returnPhase: returnPhase || 'exploration',
    selectedItem: null,
    message: null,
  };
}

/**
 * Process an inventory action and return updated game state.
 * This is the main dispatch handler for the INVENTORY phase.
 * @param {object} gameState - Full game state with phase === 'inventory'
 * @param {object} action - { type, ... }
 * @returns {object} Updated game state
 */
export function handleInventoryAction(gameState, action) {
  const type = action?.type;
  const invState = gameState.inventoryState || createInventoryState('exploration');

  if (type === 'CLOSE_INVENTORY') {
    const { inventoryState, ...rest } = gameState;
    return {
      ...rest,
      phase: invState.returnPhase,
      log: [...(gameState.log || []), 'Closed inventory.'],
    };
  }

  if (type === 'INVENTORY_USE') {
    const itemId = action.itemId;
    if (!itemId || !isUsable(itemId)) {
      return {
        ...gameState,
        inventoryState: { ...invState, message: 'That item cannot be used.' },
      };
    }
    const result = useConsumable(gameState.player, itemId);
    return {
      ...gameState,
      player: result.player,
      inventoryState: { ...invState, message: result.message, screen: INVENTORY_SCREENS.MAIN },
      log: [...(gameState.log || []), result.message],
    };
  }

  if (type === 'INVENTORY_EQUIP') {
    const itemId = action.itemId;
    if (!itemId || !isEquippable(itemId)) {
      return {
        ...gameState,
        inventoryState: { ...invState, message: 'That item cannot be equipped.' },
      };
    }
    const result = equipItem(gameState.player, itemId);
    return {
      ...gameState,
      player: result.player,
      inventoryState: { ...invState, message: result.message, screen: INVENTORY_SCREENS.MAIN },
      log: [...(gameState.log || []), result.message],
    };
  }

  if (type === 'INVENTORY_UNEQUIP') {
    const slot = action.slot;
    const result = unequipItem(gameState.player, slot);
    return {
      ...gameState,
      player: result.player,
      inventoryState: { ...invState, message: result.message, screen: INVENTORY_SCREENS.MAIN },
      log: [...(gameState.log || []), result.message],
    };
  }

  if (type === 'INVENTORY_VIEW_DETAILS') {
    return {
      ...gameState,
      inventoryState: { ...invState, screen: INVENTORY_SCREENS.DETAILS, selectedItem: action.itemId },
    };
  }

  if (type === 'INVENTORY_BACK') {
    return {
      ...gameState,
      inventoryState: { ...invState, screen: INVENTORY_SCREENS.MAIN, selectedItem: null, message: null },
    };
  }

  // Unknown action - no-op
  return gameState;
}
