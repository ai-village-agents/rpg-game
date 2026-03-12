import { craftingMaterials, craftedItems, recipes } from './data/recipes.js';
import { items } from './data/items.js';
import { addItemToInventory, removeItemFromInventory, getItemCount } from './items.js';

/**
 * Create a new crafting state.
 * @returns {{ discoveredRecipes: string[], craftCount: Record<string, number> }}
 */
export function createCraftingState() {
  return { discoveredRecipes: [], craftCount: {} };
}

/**
 * Get a merged item map that includes base items, crafting materials, and crafted items.
 * @returns {Record<string, object>}
 */
export function getAllItems() {
  return { ...items, ...craftingMaterials, ...craftedItems };
}

/**
 * Look up an item by id across all item sources.
 * @param {string} itemId
 * @returns {object|null}
 */
export function lookupItem(itemId) {
  const allItems = getAllItems();
  return allItems[itemId] || null;
}

/**
 * Ensure the crafting state exists on the game state object.
 * @param {object} state
 * @returns {object} the ensured crafting state
 */
function ensureCraftingState(state) {
  if (!state.crafting) {
    state.crafting = createCraftingState();
    return state.crafting;
  }
  if (!Array.isArray(state.crafting.discoveredRecipes)) {
    state.crafting.discoveredRecipes = [];
  }
  if (!state.crafting.craftCount || typeof state.crafting.craftCount !== 'object') {
    state.crafting.craftCount = {};
  }
  return state.crafting;
}

/**
 * Discover a recipe if not already known.
 * @param {object} state
 * @param {string} recipeId
 * @returns {{ success: boolean, message: string }}
 */
export function discoverRecipe(state, recipeId) {
  const crafting = ensureCraftingState(state);
  if (!recipeId) {
    return { success: false, message: 'Invalid recipe id.' };
  }

  const recipe = getRecipeById(recipeId);
  if (!recipe) {
    return { success: false, message: `Recipe not found: ${recipeId}` };
  }

  if (crafting.discoveredRecipes.includes(recipeId)) {
    return { success: false, message: `${recipe.name} is already discovered.` };
  }

  crafting.discoveredRecipes.push(recipeId);
  return { success: true, message: `Discovered recipe: ${recipe.name}.` };
}

/**
 * Get all discovered recipes with crafting availability info.
 * @param {object} state
 * @returns {Array}
 */
export function getAvailableRecipes(state) {
  const crafting = ensureCraftingState(state);
  const known = new Set(crafting.discoveredRecipes || []);
  const playerLevel = state?.player?.level ?? 1;
  const inventory = state?.player?.inventory || {};

  return recipes
    .filter((recipe) => known.has(recipe.id))
    .map((recipe) => {
      const missingIngredients = getMissingIngredients(recipe, inventory);
      const levelOk = playerLevel >= (recipe.requiredLevel || 1);
      const canCraft = missingIngredients.length === 0 && levelOk;
      return { ...recipe, canCraft, missingIngredients };
    });
}

/**
 * Check if the player can craft a specific recipe.
 * @param {object} state
 * @param {string} recipeId
 * @returns {{ canCraft: boolean, reason: string|null, missingIngredients: Array }}
 */
export function canCraftRecipe(state, recipeId) {
  const crafting = ensureCraftingState(state);
  const recipe = getRecipeById(recipeId);

  if (!recipe) {
    return { canCraft: false, reason: `Recipe not found: ${recipeId}`, missingIngredients: [] };
  }

  if (!crafting.discoveredRecipes.includes(recipeId)) {
    return { canCraft: false, reason: 'Recipe not discovered.', missingIngredients: [] };
  }

  const playerLevel = state?.player?.level ?? 1;
  if (playerLevel < (recipe.requiredLevel || 1)) {
    return {
      canCraft: false,
      reason: `Requires level ${recipe.requiredLevel}.`,
      missingIngredients: [],
    };
  }

  const inventory = state?.player?.inventory || {};
  const missingIngredients = getMissingIngredients(recipe, inventory);
  if (missingIngredients.length > 0) {
    return {
      canCraft: false,
      reason: 'Missing required ingredients.',
      missingIngredients,
    };
  }

  return { canCraft: true, reason: null, missingIngredients: [] };
}

/**
 * Craft an item from a recipe if possible. Mutates state in place.
 * @param {object} state
 * @param {string} recipeId
 * @returns {{ success: boolean, message: string, item?: object }}
 */
export function craftItem(state, recipeId) {
  const check = canCraftRecipe(state, recipeId);
  if (!check.canCraft) {
    return { success: false, message: check.reason || 'Cannot craft.' };
  }

  const recipe = getRecipeById(recipeId);
  if (!recipe) {
    return { success: false, message: `Recipe not found: ${recipeId}` };
  }

  const crafting = ensureCraftingState(state);
  let inventory = state.player.inventory || {};

  for (const ingredient of recipe.ingredients) {
    inventory = removeItemFromInventory(inventory, ingredient.itemId, ingredient.quantity);
  }

  const result = recipe.result;
  inventory = addItemToInventory(inventory, result.itemId, result.quantity || 1);
  state.player.inventory = inventory;

  const currentCount = crafting.craftCount[recipeId] || 0;
  crafting.craftCount[recipeId] = currentCount + 1;

  const resultItem = lookupItem(result.itemId);
  const itemName = resultItem?.name || result.itemId;

  return {
    success: true,
    message: `Crafted ${itemName}!`,
    item: resultItem || { id: result.itemId },
  };
}

/**
 * Get a recipe by id.
 * @param {string} recipeId
 * @returns {object|null}
 */
export function getRecipeById(recipeId) {
  return recipes.find((recipe) => recipe.id === recipeId) || null;
}

/**
 * Get recipes by category.
 * @param {string} category
 * @returns {Array}
 */
export function getRecipesByCategory(category) {
  return recipes.filter((recipe) => recipe.category === category);
}

/**
 * Determine missing ingredients for a recipe.
 * @param {object} recipe
 * @param {object} inventory
 * @returns {Array<{ itemId: string, name: string, required: number, have: number }>}
 */
function getMissingIngredients(recipe, inventory) {
  const missing = [];
  for (const ingredient of recipe.ingredients || []) {
    const required = ingredient.quantity || 1;
    const have = getItemCount(inventory, ingredient.itemId);
    if (have < required) {
      const item = lookupItem(ingredient.itemId);
      missing.push({
        itemId: ingredient.itemId,
        name: item?.name || ingredient.itemId,
        required,
        have,
      });
    }
  }
  return missing;
}

/**
 * Get random crafting material drops based on enemy level.
 * @param {number} enemyLevel
 * @param {() => number} [rng=Math.random]
 * @returns {Array<{ materialId: string, quantity: number }>}
 */
export function getCraftingMaterialDrops(enemyLevel, rng = Math.random) {
  const level = Math.max(1, Number(enemyLevel) || 1);
  const pool = [
    'herbBundle',
    'ironOre',
    'beastFang',
  ];

  if (level >= 4) {
    pool.push('arcaneEssence', 'enchantedThread', 'crystalLens');
  }

  if (level >= 7) {
    pool.push('dragonScale', 'shadowShard');
  }

  if (level >= 10) {
    pool.push('ancientRune', 'infernalFeather');
  }

  const drops = [];
  for (const materialId of pool) {
    if (rng() < 0.3) {
      drops.push({ materialId, quantity: 1 });
    }
  }

  return drops;
}

/**
 * Check if a player has all ingredients for a recipe.
 * @param {object} inventory
 * @param {object} recipe
 * @returns {boolean}
 */
