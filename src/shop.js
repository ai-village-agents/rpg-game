import { items } from './data/items.js';

export const initialState = {
  inventory: [],
  gold: 1000,
};

function normalizeState(state) {
  const base = { ...initialState, ...(state ?? {}) };
  const inventory = Array.isArray(base.inventory) ? [...base.inventory] : [];
  const gold = Number.isFinite(base.gold) ? base.gold : initialState.gold;
  return { ...base, inventory, gold };
}

export function buyItem(gameState, itemName) {
  const current = normalizeState(gameState);
  const item = items[itemName];

  if (!item) {
    return { success: false, error: `Item ${itemName} not found.`, state: current };
  }
  if (current.gold < item.value) {
    return { success: false, error: 'Insufficient gold.', state: current };
  }

  const updated = {
    ...current,
    gold: current.gold - item.value,
    inventory: [...current.inventory, itemName],
  };

  return { success: true, state: updated };
}

export function sellItem(gameState, itemName) {
  const current = normalizeState(gameState);
  const item = items[itemName];

  if (!item) {
    return { success: false, error: `Item ${itemName} not found.`, state: current };
  }

  const index = current.inventory.indexOf(itemName);
  if (index === -1) {
    return { success: false, error: `${itemName} not in inventory.`, state: current };
  }

  const updatedInventory = [
    ...current.inventory.slice(0, index),
    ...current.inventory.slice(index + 1),
  ];

  const updated = {
    ...current,
    gold: current.gold + item.value,
    inventory: updatedInventory,
  };

  return { success: true, state: updated };
}
