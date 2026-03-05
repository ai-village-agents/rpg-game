// Item utility module - handles item usage, inventory management
// Compatible with both old and new item systems
// Created by DeepSeek-V3.2 (Villager) on Day 338

import { items } from './data/items.js';

export function useItem(itemId, character, state) {
  const item = items[itemId];
  if (!item) {
    return { success: false, message: `Item ${itemId} not found.` };
  }
  
  // Check if character has item
  const count = character.inventory?.[itemId] || 0;
  if (count <= 0) {
    return { success: false, message: `You don't have any ${item.name}.` };
  }
  
  // Apply item effects based on type
  const result = { success: true, message: '', effects: {} };
  
  switch (item.type) {
    case 'consumable':
      if (item.effect.heal) {
        const healAmount = item.effect.heal;
        const newHp = Math.min(character.hp + healAmount, character.maxHp);
        result.effects.hp = newHp;
        result.effects.healed = newHp - character.hp;
        result.message = `${item.name} restored ${result.effects.healed} HP.`;
      }
      if (item.effect.restoreMP) {
        const restoreAmount = item.effect.restoreMP;
        const newMp = Math.min((character.mp || 0) + restoreAmount, (character.maxMp || 0));
        result.effects.mp = newMp;
        result.effects.restoredMP = newMp - (character.mp || 0);
        result.message += ` ${item.name} restored ${result.effects.restoredMP} MP.`;
      }
      if (item.effect.cureStatus) {
        result.effects.cureStatus = item.effect.cureStatus;
        result.message += ` ${item.name} cured ${item.effect.cureStatus.join(', ')}.`;
      }
      break;
      
    default:
      return { success: false, message: `${item.name} cannot be used directly.` };
  }
  
  // Reduce item count
  result.effects.inventory = {
    ...character.inventory,
    [itemId]: count - 1
  };
  
  return result;
}

export function addItemToInventory(inventory, itemId, quantity = 1) {
  const current = inventory[itemId] || 0;
  return {
    ...inventory,
    [itemId]: current + quantity
  };
}

export function removeItemFromInventory(inventory, itemId, quantity = 1) {
  const current = inventory[itemId] || 0;
  if (current < quantity) {
    return inventory; // Not enough items
  }
  const newCount = current - quantity;
  const newInventory = { ...inventory };
  if (newCount === 0) {
    delete newInventory[itemId];
  } else {
    newInventory[itemId] = newCount;
  }
  return newInventory;
}

export function getItemCount(inventory, itemId) {
  return inventory[itemId] || 0;
}

export function hasItem(inventory, itemId, quantity = 1) {
  return (inventory[itemId] || 0) >= quantity;
}

// Backward compatibility: converts old inventory format to new
export function normalizeInventory(oldInventory) {
  if (!oldInventory) return {};
  
  // If it's already in new format (object with item IDs), return as-is
  if (typeof oldInventory === 'object' && !Array.isArray(oldInventory)) {
    // Check if it's already normalized (has known item IDs)
    const hasKnownItem = Object.keys(oldInventory).some(key => items[key]);
    if (hasKnownItem) return oldInventory;
    
    // Convert old format { potion: 2 } to new format
    const normalized = {};
    if (oldInventory.potion !== undefined) {
      normalized.potion = oldInventory.potion;
    }
    // Add other legacy items if they exist
    return normalized;
  }
  
  return {};
}

// Get display name for inventory item
export function getInventoryDisplay(inventory) {
  const display = [];
  Object.entries(inventory).forEach(([itemId, count]) => {
    const item = items[itemId];
    if (item) {
      display.push(`${item.name} ×${count}`);
    } else {
      display.push(`${itemId} ×${count}`);
    }
  });
  return display;
}
