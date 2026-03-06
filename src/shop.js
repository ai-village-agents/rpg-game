// NPC Shop System — buy/sell items for gold
// Created by Claude Opus 4.6 (Villager) on Day 339

import { items as itemsData } from './data/items.js';
import { addItemToInventory, removeItemFromInventory, getItemCount } from './items.js';
import { getShopDiscount } from './world-events.js';

// Sell price is 50% of item value (standard RPG convention)
const SELL_MULTIPLIER = 0.5;

// Shop definitions keyed by NPC id
export const SHOPS = {
  merchant_bram: {
    name: "Bram's General Store",
    greeting: 'Welcome! Browse my wares, traveler.',
    stock: [
      { itemId: 'potion', quantity: 10 },
      { itemId: 'hiPotion', quantity: 5 },
      { itemId: 'ether', quantity: 3 },
      { itemId: 'antidote', quantity: 8 },
      { itemId: 'bomb', quantity: 4 },
      { itemId: 'rustySword', quantity: 2 },
      { itemId: 'leatherArmor', quantity: 2 },
      { itemId: 'bootsOfSwiftness', quantity: 1 },
    ],
  },
  swamp_witch: {
    name: "Helga's Potion Emporium",
    greeting: 'Potions, elixirs, and brews — all at fair prices, dearie!',
    stock: [
      { itemId: 'potion', quantity: 15 },
      { itemId: 'hiPotion', quantity: 8 },
      { itemId: 'ether', quantity: 6 },
      { itemId: 'antidote', quantity: 12 },
      { itemId: 'bomb', quantity: 6 },
    ],
  },
  hermit_sage: {
    name: "Sage's Arcane Wares",
    greeting: 'Knowledge has a price — so do these enchanted items.',
    stock: [
      { itemId: 'ether', quantity: 5 },
      { itemId: 'arcaneStaff', quantity: 1 },
      { itemId: 'mageRobe', quantity: 1 },
      { itemId: 'ringOfFortune', quantity: 1 },
      { itemId: 'amuletOfVigor', quantity: 1 },
    ],
  },
  wandering_knight: {
    name: "Sir Aldous's Arms",
    greeting: 'Fine weapons and sturdy armor — a knight must be well-equipped!',
    stock: [
      { itemId: 'ironSword', quantity: 2 },
      { itemId: 'huntersBow', quantity: 1 },
      { itemId: 'chainmail', quantity: 2 },
      { itemId: 'shadowCloak', quantity: 1 },
      { itemId: 'potion', quantity: 5 },
    ],
  },
};

/**
 * Get the buy price for an item (full value).
 * @param {string} itemId
 * @returns {number}
 */
export function getBuyPrice(itemId) {
  const item = itemsData[itemId];
  if (!item) return 0;
  return item.value ?? 0;
}

/**
 * Get the sell price for an item (half value, floored).
 * @param {string} itemId
 * @returns {number}
 */
export function getSellPrice(itemId) {
  const item = itemsData[itemId];
  if (!item) return 0;
  return Math.floor((item.value ?? 0) * SELL_MULTIPLIER);
}

/**
 * Check if a shop NPC exists for the given NPC id.
 * @param {string} npcId
 * @returns {boolean}
 */
export function hasShop(npcId) {
  return !!SHOPS[npcId];
}

/**
 * Get shop data for an NPC, with current stock.
 * @param {string} npcId
 * @returns {object|null}
 */
export function getShopData(npcId) {
  const shop = SHOPS[npcId];
  if (!shop) return null;
  return {
    npcId,
    name: shop.name,
    greeting: shop.greeting,
    stock: shop.stock.map(entry => ({
      ...entry,
      item: itemsData[entry.itemId],
      buyPrice: getBuyPrice(entry.itemId),
    })),
  };
}

/**
 * Create the shop state for UI rendering.
 * @param {string} npcId
 * @param {string} previousPhase - Phase to return to when closing shop
 * @returns {object}
 */
export function createShopState(npcId, previousPhase) {
  const shop = SHOPS[npcId];
  if (!shop) return null;
  return {
    npcId,
    shopName: shop.name,
    greeting: shop.greeting,
    stock: shop.stock.map(entry => ({ ...entry })),
    tab: 'buy', // 'buy' or 'sell'
    previousPhase: previousPhase || 'exploration',
    selectedItem: null,
    message: null,
  };
}

/**
 * Attempt to buy an item from the shop.
 * @param {object} player - Player state (must have gold, inventory)
 * @param {object} shopState - Current shop state
 * @param {string} itemId - Item to buy
 * @param {number} quantity - How many to buy (default 1)
 * @returns {{ success: boolean, player: object, shopState: object, message: string }}
 */
export function buyItem(player, shopState, itemId, quantity = 1, worldEvent = null) {
  const item = itemsData[itemId];
  if (!item) {
    return { success: false, player, shopState, message: 'Item not found.' };
  }

  const stockEntry = shopState.stock.find(s => s.itemId === itemId);
  if (!stockEntry || stockEntry.quantity < quantity) {
    return { success: false, player, shopState, message: `Not enough ${item.name} in stock.` };
  }

  const basePrice = getBuyPrice(itemId);
  const discount = getShopDiscount(worldEvent);
  const discountedPrice = Math.max(1, Math.floor(basePrice * (1 - discount)));
  const totalCost = discountedPrice * quantity;
  const playerGold = player.gold ?? 0;
  if (playerGold < totalCost) {
    return { success: false, player, shopState, message: `Not enough gold! Need ${totalCost}, have ${playerGold}.` };
  }

  // Deduct gold, add item, reduce stock
  const newPlayer = {
    ...player,
    gold: playerGold - totalCost,
    inventory: addItemToInventory(player.inventory || {}, itemId, quantity),
  };

  const newStock = shopState.stock.map(s =>
    s.itemId === itemId ? { ...s, quantity: s.quantity - quantity } : s
  );

  const newShopState = {
    ...shopState,
    stock: newStock,
    message: `Bought ${quantity}x ${item.name} for ${totalCost} gold.`,
  };

  return { success: true, player: newPlayer, shopState: newShopState, message: newShopState.message };
}

/**
 * Attempt to sell an item from the player's inventory.
 * @param {object} player - Player state
 * @param {object} shopState - Current shop state
 * @param {string} itemId - Item to sell
 * @param {number} quantity - How many to sell (default 1)
 * @returns {{ success: boolean, player: object, shopState: object, message: string }}
 */
export function sellItem(player, shopState, itemId, quantity = 1) {
  const item = itemsData[itemId];
  if (!item) {
    return { success: false, player, shopState, message: 'Item not found.' };
  }

  const owned = getItemCount(player.inventory || {}, itemId);
  if (owned < quantity) {
    return { success: false, player, shopState, message: `You don't have ${quantity}x ${item.name}.` };
  }

  const sellPrice = getSellPrice(itemId);
  if (sellPrice <= 0) {
    return { success: false, player, shopState, message: `${item.name} has no sell value.` };
  }

  const totalGold = sellPrice * quantity;
  const newPlayer = {
    ...player,
    gold: (player.gold ?? 0) + totalGold,
    inventory: removeItemFromInventory(player.inventory || {}, itemId, quantity),
  };

  const newShopState = {
    ...shopState,
    message: `Sold ${quantity}x ${item.name} for ${totalGold} gold.`,
  };

  return { success: true, player: newPlayer, shopState: newShopState, message: newShopState.message };
}

/**
 * Get sellable items from the player's inventory with prices.
 * @param {object} inventory - Player inventory object
 * @returns {Array<{itemId: string, item: object, count: number, sellPrice: number}>}
 */
export function getSellableItems(inventory) {
  if (!inventory) return [];
  return Object.entries(inventory)
    .filter(([, count]) => count > 0)
    .map(([itemId, count]) => ({
      itemId,
      item: itemsData[itemId],
      count,
      sellPrice: getSellPrice(itemId),
    }))
    .filter(entry => entry.item && entry.sellPrice > 0);
}
