/**
 * Crafting System
 * Create items from materials using recipes and workstations
 */

// Crafting categories
export const CRAFTING_CATEGORIES = {
  SMITHING: { name: 'Smithing', icon: '🔨', description: 'Forge weapons and armor' },
  ALCHEMY: { name: 'Alchemy', icon: '⚗️', description: 'Brew potions and elixirs' },
  COOKING: { name: 'Cooking', icon: '🍳', description: 'Prepare food and meals' },
  TAILORING: { name: 'Tailoring', icon: '🧵', description: 'Craft cloth and leather gear' },
  ENCHANTING: { name: 'Enchanting', icon: '✨', description: 'Imbue items with magic' },
  WOODWORKING: { name: 'Woodworking', icon: '🪓', description: 'Craft bows and staves' },
  JEWELRY: { name: 'Jewelry', icon: '💍', description: 'Create rings and amulets' },
  INSCRIPTION: { name: 'Inscription', icon: '📜', description: 'Write scrolls and glyphs' }
};

// Quality levels
export const QUALITY_LEVELS = {
  POOR: { name: 'Poor', multiplier: 0.75, color: '#808080' },
  NORMAL: { name: 'Normal', multiplier: 1.0, color: '#FFFFFF' },
  GOOD: { name: 'Good', multiplier: 1.25, color: '#1EFF00' },
  EXCELLENT: { name: 'Excellent', multiplier: 1.5, color: '#0070DD' },
  MASTERWORK: { name: 'Masterwork', multiplier: 2.0, color: '#A335EE' }
};

// Workstation types
export const WORKSTATIONS = {
  FORGE: { name: 'Forge', icon: '🔥', categories: ['SMITHING'] },
  ALCHEMY_TABLE: { name: 'Alchemy Table', icon: '🧪', categories: ['ALCHEMY'] },
  KITCHEN: { name: 'Kitchen', icon: '🏠', categories: ['COOKING'] },
  LOOM: { name: 'Loom', icon: '🧶', categories: ['TAILORING'] },
  ARCANE_ALTAR: { name: 'Arcane Altar', icon: '🔮', categories: ['ENCHANTING'] },
  WORKBENCH: { name: 'Workbench', icon: '🪑', categories: ['WOODWORKING'] },
  JEWELERS_BENCH: { name: "Jeweler's Bench", icon: '💎', categories: ['JEWELRY'] },
  WRITING_DESK: { name: 'Writing Desk', icon: '🖊️', categories: ['INSCRIPTION'] }
};

// Create initial crafting state
export function createCraftingState() {
  return {
    knownRecipes: [],
    craftingQueue: [],
    activeCraft: null,
    stats: {
      totalCrafts: 0,
      successfulCrafts: 0,
      failedCrafts: 0,
      criticalCrafts: 0,
      categoryStats: {}
    },
    skillLevels: {},
    discoveries: []
  };
}

// Create recipe definition
export function createRecipe(id, name, category, ingredients, output, options = {}) {
  if (!id || !name) {
    return { success: false, error: 'Invalid recipe id or name' };
  }

  if (!CRAFTING_CATEGORIES[category?.toUpperCase()]) {
    return { success: false, error: 'Invalid category' };
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return { success: false, error: 'Recipe must have ingredients' };
  }

  if (!output || !output.itemId) {
    return { success: false, error: 'Recipe must have output' };
  }

  return {
    success: true,
    recipe: {
      id,
      name,
      category: category.toUpperCase(),
      ingredients: ingredients.map(ing => ({
        itemId: ing.itemId,
        quantity: ing.quantity || 1
      })),
      output: {
        itemId: output.itemId,
        quantity: output.quantity || 1
      },
      requiredLevel: options.requiredLevel || 1,
      craftTime: options.craftTime || 1000,
      experienceGain: options.experienceGain || 10,
      difficulty: Math.min(100, Math.max(1, options.difficulty || 50)),
      workstation: options.workstation || null,
      discoverable: options.discoverable ?? false
    }
  };
}

// Create recipe registry
export function createRecipeRegistry() {
  return {
    recipes: {},
    byCategory: {},
    byOutput: {},
    discoveries: {}
  };
}

// Register recipe
export function registerRecipe(registry, recipe) {
  if (!recipe || !recipe.id) {
    return { success: false, error: 'Invalid recipe' };
  }

  if (registry.recipes[recipe.id]) {
    return { success: false, error: 'Recipe already registered' };
  }

  const newRecipes = { ...registry.recipes, [recipe.id]: recipe };

  // Index by category
  const newByCategory = { ...registry.byCategory };
  newByCategory[recipe.category] = [...(newByCategory[recipe.category] || []), recipe.id];

  // Index by output
  const newByOutput = { ...registry.byOutput };
  newByOutput[recipe.output.itemId] = [...(newByOutput[recipe.output.itemId] || []), recipe.id];

  return {
    success: true,
    registry: {
      ...registry,
      recipes: newRecipes,
      byCategory: newByCategory,
      byOutput: newByOutput
    }
  };
}

// Learn recipe
export function learnRecipe(state, recipeId) {
  if (state.knownRecipes.includes(recipeId)) {
    return { success: false, error: 'Recipe already known' };
  }

  return {
    success: true,
    state: {
      ...state,
      knownRecipes: [...state.knownRecipes, recipeId]
    }
  };
}

// Check if recipe is known
export function isRecipeKnown(state, recipeId) {
  return state.knownRecipes.includes(recipeId);
}

// Get known recipes
export function getKnownRecipes(state, registry) {
  return state.knownRecipes
    .map(id => registry.recipes[id])
    .filter(Boolean);
}

// Get recipes by category
export function getRecipesByCategory(state, registry, category) {
  const categoryKey = category.toUpperCase();
  const recipeIds = registry.byCategory[categoryKey] || [];

  return recipeIds
    .filter(id => state.knownRecipes.includes(id))
    .map(id => registry.recipes[id]);
}

// Check if has ingredients
export function hasIngredients(recipe, inventory) {
  if (!recipe || !inventory) return false;

  for (const ingredient of recipe.ingredients) {
    const available = inventory[ingredient.itemId] || 0;
    if (available < ingredient.quantity) {
      return false;
    }
  }

  return true;
}

// Get missing ingredients
export function getMissingIngredients(recipe, inventory) {
  if (!recipe) return [];

  const missing = [];
  for (const ingredient of recipe.ingredients) {
    const available = inventory[ingredient.itemId] || 0;
    if (available < ingredient.quantity) {
      missing.push({
        itemId: ingredient.itemId,
        required: ingredient.quantity,
        available,
        missing: ingredient.quantity - available
      });
    }
  }

  return missing;
}

// Get skill level
export function getSkillLevel(state, category) {
  return state.skillLevels[category?.toUpperCase()] || 0;
}

// Calculate success chance
export function calculateSuccessChance(state, recipe) {
  if (!recipe) return 0;

  const skillLevel = getSkillLevel(state, recipe.category);
  const levelDiff = skillLevel - recipe.requiredLevel;

  // Base 60% + skill bonus (capped at 99%)
  let chance = 60 + (levelDiff * 5);
  chance -= (recipe.difficulty - 50) * 0.5;

  return Math.min(99, Math.max(5, Math.round(chance)));
}

// Calculate critical chance
export function calculateCriticalChance(state, recipe) {
  if (!recipe) return 0;

  const skillLevel = getSkillLevel(state, recipe.category);
  const levelDiff = skillLevel - recipe.requiredLevel;

  // Base 5% + level bonus
  const chance = 5 + (levelDiff * 2);

  return Math.min(25, Math.max(1, Math.round(chance)));
}

// Start crafting
export function startCrafting(state, registry, recipeId, inventory, workstationId = null) {
  const recipe = registry.recipes[recipeId];

  if (!recipe) {
    return { success: false, error: 'Recipe not found' };
  }

  if (!state.knownRecipes.includes(recipeId)) {
    return { success: false, error: 'Recipe not learned' };
  }

  const skillLevel = getSkillLevel(state, recipe.category);
  if (skillLevel < recipe.requiredLevel) {
    return { success: false, error: 'Insufficient skill level', required: recipe.requiredLevel, current: skillLevel };
  }

  if (recipe.workstation && recipe.workstation !== workstationId) {
    return { success: false, error: 'Wrong workstation required', required: recipe.workstation };
  }

  if (!hasIngredients(recipe, inventory)) {
    return { success: false, error: 'Missing ingredients', missing: getMissingIngredients(recipe, inventory) };
  }

  if (state.activeCraft) {
    return { success: false, error: 'Already crafting' };
  }

  const startTime = Date.now();
  const successChance = calculateSuccessChance(state, recipe);
  const criticalChance = calculateCriticalChance(state, recipe);

  return {
    success: true,
    state: {
      ...state,
      activeCraft: {
        recipeId,
        startTime,
        endTime: startTime + recipe.craftTime,
        successChance,
        criticalChance
      }
    },
    consumedItems: recipe.ingredients
  };
}

// Cancel crafting
export function cancelCrafting(state) {
  if (!state.activeCraft) {
    return { success: false, error: 'No active craft' };
  }

  return {
    success: true,
    refundItems: [], // Could implement partial refund
    state: {
      ...state,
      activeCraft: null
    }
  };
}

// Complete crafting
export function completeCrafting(state, registry, randomValue = Math.random()) {
  if (!state.activeCraft) {
    return { success: false, error: 'No active craft' };
  }

  const recipe = registry.recipes[state.activeCraft.recipeId];
  if (!recipe) {
    return { success: false, error: 'Recipe not found' };
  }

  const now = Date.now();
  if (now < state.activeCraft.endTime) {
    return { success: false, error: 'Crafting not complete', remaining: state.activeCraft.endTime - now };
  }

  // Determine outcome
  const successRoll = randomValue * 100;
  const wasSuccessful = successRoll <= state.activeCraft.successChance;
  const wasCritical = wasSuccessful && successRoll <= state.activeCraft.criticalChance;

  // Calculate quality
  let quality = 'NORMAL';
  if (wasCritical) {
    quality = 'MASTERWORK';
  } else if (wasSuccessful) {
    const qualityRoll = randomValue * 100;
    if (qualityRoll > 90) quality = 'EXCELLENT';
    else if (qualityRoll > 70) quality = 'GOOD';
    else if (qualityRoll < 20) quality = 'POOR';
  }

  // Update stats
  const categoryStats = { ...state.stats.categoryStats };
  categoryStats[recipe.category] = (categoryStats[recipe.category] || 0) + 1;

  const result = {
    success: true,
    craftSuccess: wasSuccessful,
    critical: wasCritical,
    quality: wasSuccessful ? quality : null,
    output: wasSuccessful ? {
      itemId: recipe.output.itemId,
      quantity: recipe.output.quantity * (wasCritical ? 2 : 1),
      quality
    } : null,
    experienceGained: wasSuccessful ? recipe.experienceGain * (wasCritical ? 2 : 1) : Math.floor(recipe.experienceGain / 2),
    state: {
      ...state,
      activeCraft: null,
      stats: {
        totalCrafts: state.stats.totalCrafts + 1,
        successfulCrafts: state.stats.successfulCrafts + (wasSuccessful ? 1 : 0),
        failedCrafts: state.stats.failedCrafts + (wasSuccessful ? 0 : 1),
        criticalCrafts: state.stats.criticalCrafts + (wasCritical ? 1 : 0),
        categoryStats
      }
    }
  };

  return result;
}

// Add experience to skill
export function addSkillExperience(state, category, experience) {
  const categoryKey = category?.toUpperCase();
  if (!CRAFTING_CATEGORIES[categoryKey]) {
    return { success: false, error: 'Invalid category' };
  }

  const currentLevel = state.skillLevels[categoryKey] || 0;
  const expPerLevel = 100;
  const totalExp = currentLevel * expPerLevel + experience;
  const newLevel = Math.floor(totalExp / expPerLevel);

  const leveledUp = newLevel > currentLevel;

  return {
    success: true,
    leveledUp,
    previousLevel: currentLevel,
    newLevel,
    state: {
      ...state,
      skillLevels: {
        ...state.skillLevels,
        [categoryKey]: newLevel
      }
    }
  };
}

// Queue crafting
export function queueCrafting(state, recipeId, count = 1) {
  const newQueue = [...state.craftingQueue];

  for (let i = 0; i < count; i++) {
    newQueue.push({
      recipeId,
      queuedAt: Date.now(),
      index: newQueue.length
    });
  }

  return {
    ...state,
    craftingQueue: newQueue
  };
}

// Clear queue
export function clearQueue(state) {
  return {
    ...state,
    craftingQueue: []
  };
}

// Remove from queue
export function removeFromQueue(state, index) {
  if (index < 0 || index >= state.craftingQueue.length) {
    return { success: false, error: 'Invalid queue index' };
  }

  return {
    success: true,
    state: {
      ...state,
      craftingQueue: state.craftingQueue.filter((_, i) => i !== index)
    }
  };
}

// Get crafting progress
export function getCraftingProgress(state) {
  if (!state.activeCraft) {
    return { active: false, progress: 0 };
  }

  const now = Date.now();
  const total = state.activeCraft.endTime - state.activeCraft.startTime;
  const elapsed = now - state.activeCraft.startTime;
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

  return {
    active: true,
    recipeId: state.activeCraft.recipeId,
    progress: Math.round(progress),
    remaining: Math.max(0, state.activeCraft.endTime - now),
    successChance: state.activeCraft.successChance
  };
}

// Discover recipe
export function discoverRecipe(state, registry, ingredientIds) {
  // Find discoverable recipes that match ingredients
  const discoverable = Object.values(registry.recipes)
    .filter(r => r.discoverable && !state.knownRecipes.includes(r.id));

  for (const recipe of discoverable) {
    const recipeIngredients = recipe.ingredients.map(i => i.itemId).sort();
    const providedIngredients = [...ingredientIds].sort();

    if (recipeIngredients.length === providedIngredients.length &&
        recipeIngredients.every((id, i) => id === providedIngredients[i])) {
      return {
        success: true,
        discovered: recipe,
        state: {
          ...state,
          knownRecipes: [...state.knownRecipes, recipe.id],
          discoveries: [...state.discoveries, { recipeId: recipe.id, discoveredAt: Date.now() }]
        }
      };
    }
  }

  return { success: false, error: 'No matching recipe discovered' };
}

// Get craftable recipes
export function getCraftableRecipes(state, registry, inventory) {
  return getKnownRecipes(state, registry)
    .filter(recipe => {
      const skillLevel = getSkillLevel(state, recipe.category);
      return skillLevel >= recipe.requiredLevel && hasIngredients(recipe, inventory);
    });
}

// Get crafting stats
export function getCraftingStats(state) {
  const successRate = state.stats.totalCrafts > 0
    ? Math.round((state.stats.successfulCrafts / state.stats.totalCrafts) * 100)
    : 0;

  const criticalRate = state.stats.successfulCrafts > 0
    ? Math.round((state.stats.criticalCrafts / state.stats.successfulCrafts) * 100)
    : 0;

  return {
    ...state.stats,
    successRate,
    criticalRate,
    totalRecipesKnown: state.knownRecipes.length,
    totalDiscoveries: state.discoveries.length
  };
}

// Get category info
export function getCategoryInfo(category) {
  return CRAFTING_CATEGORIES[category?.toUpperCase()] || null;
}

// Get quality info
export function getQualityInfo(quality) {
  return QUALITY_LEVELS[quality?.toUpperCase()] || null;
}

// Get workstation info
export function getWorkstationInfo(workstationId) {
  return WORKSTATIONS[workstationId?.toUpperCase()] || null;
}

// Check if can use workstation
export function canUseWorkstation(workstationId, category) {
  const workstation = WORKSTATIONS[workstationId?.toUpperCase()];
  if (!workstation) return false;

  return workstation.categories.includes(category?.toUpperCase());
}
