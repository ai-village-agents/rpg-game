/**
 * Recipe Discovery System
 * Discover crafting recipes through experimentation
 */

// Ingredient categories
export const INGREDIENT_CATEGORIES = {
  HERB: 'herb',
  MINERAL: 'mineral',
  ESSENCE: 'essence',
  CREATURE: 'creature',
  FOOD: 'food',
  METAL: 'metal',
  WOOD: 'wood',
  CLOTH: 'cloth',
  GEM: 'gem',
  ARCANE: 'arcane'
};

// Ingredient rarities
export const INGREDIENT_RARITY = {
  COMMON: { name: 'Common', multiplier: 1.0, color: '#9E9E9E' },
  UNCOMMON: { name: 'Uncommon', multiplier: 1.5, color: '#4CAF50' },
  RARE: { name: 'Rare', multiplier: 2.0, color: '#2196F3' },
  EPIC: { name: 'Epic', multiplier: 3.0, color: '#9C27B0' },
  LEGENDARY: { name: 'Legendary', multiplier: 5.0, color: '#FF9800' }
};

// Recipe categories
export const RECIPE_CATEGORIES = {
  POTION: 'potion',
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  CONSUMABLE: 'consumable',
  ENCHANTMENT: 'enchantment',
  TOOL: 'tool',
  SPECIAL: 'special'
};

// Discovery difficulty
export const DISCOVERY_DIFFICULTY = {
  EASY: { name: 'Easy', hintThreshold: 1, baseXp: 10 },
  MEDIUM: { name: 'Medium', hintThreshold: 2, baseXp: 25 },
  HARD: { name: 'Hard', hintThreshold: 3, baseXp: 50 },
  MASTER: { name: 'Master', hintThreshold: 4, baseXp: 100 },
  LEGENDARY: { name: 'Legendary', hintThreshold: 5, baseXp: 250 }
};

// Create initial discovery state
export function createDiscoveryState() {
  return {
    discoveredRecipes: [],
    failedAttempts: [],
    hints: {},
    ingredientKnowledge: {},
    experimentLog: [],
    stats: {
      totalExperiments: 0,
      successfulDiscoveries: 0,
      failedExperiments: 0,
      discoveryXp: 0,
      discoveryLevel: 1
    }
  };
}

// Create an ingredient
export function createIngredient(id, name, category, rarity, properties = []) {
  return {
    id,
    name,
    category,
    rarity,
    properties,
    discoveredAt: null
  };
}

// Create a recipe definition
export function createRecipe(id, name, category, ingredients, result, difficulty) {
  if (!id || !name) {
    return { success: false, error: 'Invalid recipe id or name' };
  }

  if (!Array.isArray(ingredients) || ingredients.length < 2) {
    return { success: false, error: 'Recipe requires at least 2 ingredients' };
  }

  if (ingredients.length > 5) {
    return { success: false, error: 'Recipe cannot have more than 5 ingredients' };
  }

  if (!RECIPE_CATEGORIES[category?.toUpperCase()]) {
    return { success: false, error: 'Invalid recipe category' };
  }

  if (!DISCOVERY_DIFFICULTY[difficulty?.toUpperCase()]) {
    return { success: false, error: 'Invalid difficulty' };
  }

  return {
    success: true,
    recipe: {
      id,
      name,
      category,
      ingredients: [...ingredients].sort(),
      result,
      difficulty,
      discoverable: true
    }
  };
}

// Create a recipe registry
export function createRecipeRegistry() {
  return {
    recipes: {},
    byCategory: {},
    byIngredient: {}
  };
}

// Register a recipe in the registry
export function registerRecipe(registry, recipe) {
  if (!recipe || !recipe.id) {
    return { success: false, error: 'Invalid recipe' };
  }

  if (registry.recipes[recipe.id]) {
    return { success: false, error: 'Recipe already registered' };
  }

  // Add to main registry
  const newRecipes = { ...registry.recipes, [recipe.id]: recipe };

  // Index by category
  const categoryKey = recipe.category;
  const newByCategory = { ...registry.byCategory };
  newByCategory[categoryKey] = [...(newByCategory[categoryKey] || []), recipe.id];

  // Index by ingredients
  const newByIngredient = { ...registry.byIngredient };
  for (const ingredientId of recipe.ingredients) {
    newByIngredient[ingredientId] = [...(newByIngredient[ingredientId] || []), recipe.id];
  }

  return {
    success: true,
    registry: {
      recipes: newRecipes,
      byCategory: newByCategory,
      byIngredient: newByIngredient
    }
  };
}

// Attempt to discover a recipe by experimenting with ingredients
export function attemptDiscovery(state, registry, ingredientIds) {
  if (!Array.isArray(ingredientIds) || ingredientIds.length < 2) {
    return { success: false, error: 'Need at least 2 ingredients' };
  }

  if (ingredientIds.length > 5) {
    return { success: false, error: 'Cannot use more than 5 ingredients' };
  }

  // Sort for consistent comparison
  const sortedIngredients = [...ingredientIds].sort();
  const ingredientKey = sortedIngredients.join(',');

  // Check if already attempted
  if (state.failedAttempts.includes(ingredientKey)) {
    return { success: false, error: 'Already attempted this combination', isRepeat: true };
  }

  // Search for matching recipe
  let matchedRecipe = null;
  for (const recipe of Object.values(registry.recipes)) {
    if (arraysEqual(recipe.ingredients, sortedIngredients)) {
      matchedRecipe = recipe;
      break;
    }
  }

  const timestamp = Date.now();
  const experiment = {
    ingredients: sortedIngredients,
    timestamp,
    success: !!matchedRecipe,
    recipeId: matchedRecipe?.id || null
  };

  // Update stats
  const newStats = {
    ...state.stats,
    totalExperiments: state.stats.totalExperiments + 1
  };

  if (matchedRecipe) {
    // Check if already discovered
    if (state.discoveredRecipes.includes(matchedRecipe.id)) {
      return {
        success: true,
        alreadyKnown: true,
        recipe: matchedRecipe,
        state: {
          ...state,
          experimentLog: [...state.experimentLog.slice(-49), experiment],
          stats: newStats
        }
      };
    }

    // New discovery!
    const difficultyInfo = DISCOVERY_DIFFICULTY[matchedRecipe.difficulty.toUpperCase()];
    const xpGained = difficultyInfo?.baseXp || 10;
    newStats.successfulDiscoveries++;
    newStats.discoveryXp += xpGained;
    newStats.discoveryLevel = calculateLevel(newStats.discoveryXp);

    return {
      success: true,
      isNewDiscovery: true,
      recipe: matchedRecipe,
      xpGained,
      state: {
        ...state,
        discoveredRecipes: [...state.discoveredRecipes, matchedRecipe.id],
        experimentLog: [...state.experimentLog.slice(-49), experiment],
        stats: newStats
      }
    };
  }

  // Failed attempt
  newStats.failedExperiments++;

  // Generate hints based on partial matches
  const hints = generateHints(registry, sortedIngredients, state.discoveredRecipes);

  return {
    success: false,
    isFailedExperiment: true,
    hints,
    state: {
      ...state,
      failedAttempts: [...state.failedAttempts, ingredientKey],
      experimentLog: [...state.experimentLog.slice(-49), experiment],
      stats: newStats
    }
  };
}

// Generate hints for near-misses
export function generateHints(registry, usedIngredients, discoveredRecipes) {
  const hints = [];

  for (const recipe of Object.values(registry.recipes)) {
    // Skip already discovered
    if (discoveredRecipes.includes(recipe.id)) continue;

    // Count matching ingredients
    const matchCount = usedIngredients.filter(i => recipe.ingredients.includes(i)).length;
    const totalNeeded = recipe.ingredients.length;
    const matchPercent = matchCount / totalNeeded;

    if (matchPercent >= 0.5 && matchPercent < 1) {
      hints.push({
        recipeId: recipe.id,
        category: recipe.category,
        matchCount,
        totalNeeded,
        hintLevel: matchPercent >= 0.75 ? 'warm' : 'cold'
      });
    }
  }

  return hints.slice(0, 3);
}

// Calculate discovery level from XP
export function calculateLevel(xp) {
  // 100 XP per level, increasing by 50 each level
  let level = 1;
  let requiredXp = 100;
  let totalXp = 0;

  while (totalXp + requiredXp <= xp) {
    totalXp += requiredXp;
    level++;
    requiredXp += 50;
  }

  return level;
}

// Get XP needed for next level
export function getXpForNextLevel(currentLevel) {
  return 100 + (currentLevel - 1) * 50;
}

// Get total XP needed to reach a level
export function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += 100 + (i - 1) * 50;
  }
  return total;
}

// Get discovered recipes
export function getDiscoveredRecipes(state, registry) {
  return state.discoveredRecipes.map(id => registry.recipes[id]).filter(Boolean);
}

// Get undiscovered recipes (for hint system)
export function getUndiscoveredRecipes(state, registry) {
  return Object.values(registry.recipes).filter(
    recipe => !state.discoveredRecipes.includes(recipe.id)
  );
}

// Check if a recipe is discovered
export function isRecipeDiscovered(state, recipeId) {
  return state.discoveredRecipes.includes(recipeId);
}

// Get discovery progress
export function getDiscoveryProgress(state, registry) {
  const total = Object.keys(registry.recipes).length;
  const discovered = state.discoveredRecipes.length;

  return {
    discovered,
    total,
    percentage: total > 0 ? Math.round((discovered / total) * 100) : 0
  };
}

// Get recipes by category
export function getRecipesByCategory(state, registry, category) {
  const recipeIds = registry.byCategory[category] || [];
  return recipeIds
    .filter(id => state.discoveredRecipes.includes(id))
    .map(id => registry.recipes[id]);
}

// Get recipes that use a specific ingredient
export function getRecipesWithIngredient(state, registry, ingredientId) {
  const recipeIds = registry.byIngredient[ingredientId] || [];
  return recipeIds
    .filter(id => state.discoveredRecipes.includes(id))
    .map(id => registry.recipes[id]);
}

// Learn about an ingredient through experimentation
export function learnIngredient(state, ingredientId, property) {
  const currentKnowledge = state.ingredientKnowledge[ingredientId] || [];

  if (currentKnowledge.includes(property)) {
    return { success: false, error: 'Already know this property' };
  }

  return {
    success: true,
    state: {
      ...state,
      ingredientKnowledge: {
        ...state.ingredientKnowledge,
        [ingredientId]: [...currentKnowledge, property]
      }
    }
  };
}

// Get ingredient knowledge
export function getIngredientKnowledge(state, ingredientId) {
  return state.ingredientKnowledge[ingredientId] || [];
}

// Purchase a hint for a specific recipe category
export function purchaseHint(state, registry, category, cost) {
  const undiscovered = getUndiscoveredRecipes(state, registry)
    .filter(r => r.category === category);

  if (undiscovered.length === 0) {
    return { success: false, error: 'All recipes in this category discovered' };
  }

  // Pick a random undiscovered recipe
  const randomRecipe = undiscovered[Math.floor(Math.random() * undiscovered.length)];

  // Reveal one ingredient
  const currentHints = state.hints[randomRecipe.id] || [];
  const unrevealed = randomRecipe.ingredients.filter(i => !currentHints.includes(i));

  if (unrevealed.length === 0) {
    return { success: false, error: 'No more hints available for this recipe' };
  }

  const revealedIngredient = unrevealed[Math.floor(Math.random() * unrevealed.length)];

  return {
    success: true,
    recipeId: randomRecipe.id,
    category: randomRecipe.category,
    revealedIngredient,
    remainingHidden: unrevealed.length - 1,
    state: {
      ...state,
      hints: {
        ...state.hints,
        [randomRecipe.id]: [...currentHints, revealedIngredient]
      }
    }
  };
}

// Get available hints for a recipe
export function getRecipeHints(state, recipeId) {
  return state.hints[recipeId] || [];
}

// Get discovery statistics
export function getDiscoveryStats(state) {
  const successRate = state.stats.totalExperiments > 0
    ? Math.round((state.stats.successfulDiscoveries / state.stats.totalExperiments) * 100)
    : 0;

  const currentLevelXp = getTotalXpForLevel(state.stats.discoveryLevel);
  const nextLevelXp = getTotalXpForLevel(state.stats.discoveryLevel + 1);
  const progressToNextLevel = state.stats.discoveryXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    ...state.stats,
    successRate,
    progressToNextLevel,
    xpNeeded,
    levelProgress: Math.round((progressToNextLevel / xpNeeded) * 100)
  };
}

// Get recent experiments
export function getRecentExperiments(state, limit = 10) {
  return state.experimentLog.slice(-limit).reverse();
}

// Clear failed attempts (maybe after leveling up)
export function clearFailedAttempts(state) {
  return {
    ...state,
    failedAttempts: []
  };
}

// Helper: Check if two arrays have same elements
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

// Get recipe difficulty info
export function getDifficultyInfo(difficulty) {
  return DISCOVERY_DIFFICULTY[difficulty?.toUpperCase()] || null;
}

// Check if combination has been tried
export function hasTriedCombination(state, ingredientIds) {
  const sortedIngredients = [...ingredientIds].sort();
  const ingredientKey = sortedIngredients.join(',');
  return state.failedAttempts.includes(ingredientKey);
}

// Get favorite ingredients (most used in successful discoveries)
export function getFavoriteIngredients(state, registry, limit = 5) {
  const ingredientCounts = {};

  for (const recipeId of state.discoveredRecipes) {
    const recipe = registry.recipes[recipeId];
    if (recipe) {
      for (const ingredientId of recipe.ingredients) {
        ingredientCounts[ingredientId] = (ingredientCounts[ingredientId] || 0) + 1;
      }
    }
  }

  return Object.entries(ingredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ ingredientId: id, count }));
}
