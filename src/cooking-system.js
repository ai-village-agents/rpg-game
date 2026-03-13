/**
 * Cooking System
 * Recipe-based food crafting with buffs and ingredients
 */

// Ingredient categories
export const INGREDIENT_TYPES = {
  MEAT: { id: 'meat', name: 'Meat', icon: 'meat' },
  FISH: { id: 'fish', name: 'Fish', icon: 'fish' },
  VEGETABLE: { id: 'vegetable', name: 'Vegetable', icon: 'vegetable' },
  FRUIT: { id: 'fruit', name: 'Fruit', icon: 'fruit' },
  GRAIN: { id: 'grain', name: 'Grain', icon: 'grain' },
  DAIRY: { id: 'dairy', name: 'Dairy', icon: 'dairy' },
  SPICE: { id: 'spice', name: 'Spice', icon: 'spice' },
  HERB: { id: 'herb', name: 'Herb', icon: 'herb' },
  SWEETENER: { id: 'sweetener', name: 'Sweetener', icon: 'sweetener' },
  LIQUID: { id: 'liquid', name: 'Liquid', icon: 'liquid' }
};

// Recipe difficulty levels
export const RECIPE_DIFFICULTY = {
  SIMPLE: { id: 'simple', name: 'Simple', expMultiplier: 1.0, failChance: 0.05 },
  EASY: { id: 'easy', name: 'Easy', expMultiplier: 1.2, failChance: 0.10 },
  MODERATE: { id: 'moderate', name: 'Moderate', expMultiplier: 1.5, failChance: 0.15 },
  COMPLEX: { id: 'complex', name: 'Complex', expMultiplier: 2.0, failChance: 0.25 },
  MASTER: { id: 'master', name: 'Master', expMultiplier: 3.0, failChance: 0.35 }
};

// Food quality tiers
export const FOOD_QUALITY = {
  POOR: { id: 'poor', name: 'Poor', buffMultiplier: 0.5, color: '#808080' },
  COMMON: { id: 'common', name: 'Common', buffMultiplier: 1.0, color: '#ffffff' },
  FINE: { id: 'fine', name: 'Fine', buffMultiplier: 1.25, color: '#00ff00' },
  SUPERIOR: { id: 'superior', name: 'Superior', buffMultiplier: 1.5, color: '#0088ff' },
  EXQUISITE: { id: 'exquisite', name: 'Exquisite', buffMultiplier: 2.0, color: '#aa00ff' }
};

// Buff types from food
export const FOOD_BUFFS = {
  HEALTH_REGEN: { id: 'health_regen', name: 'Health Regeneration', stat: 'healthRegen' },
  MANA_REGEN: { id: 'mana_regen', name: 'Mana Regeneration', stat: 'manaRegen' },
  ATTACK_BOOST: { id: 'attack_boost', name: 'Attack Boost', stat: 'attack' },
  DEFENSE_BOOST: { id: 'defense_boost', name: 'Defense Boost', stat: 'defense' },
  SPEED_BOOST: { id: 'speed_boost', name: 'Speed Boost', stat: 'speed' },
  CRIT_BOOST: { id: 'crit_boost', name: 'Critical Boost', stat: 'critChance' },
  EXP_BOOST: { id: 'exp_boost', name: 'Experience Boost', stat: 'expGain' },
  LUCK_BOOST: { id: 'luck_boost', name: 'Luck Boost', stat: 'luck' }
};

// Cooking methods
export const COOKING_METHODS = {
  RAW: { id: 'raw', name: 'Raw', timeMultiplier: 0 },
  BOIL: { id: 'boil', name: 'Boil', timeMultiplier: 1.0 },
  FRY: { id: 'fry', name: 'Fry', timeMultiplier: 0.8 },
  GRILL: { id: 'grill', name: 'Grill', timeMultiplier: 1.2 },
  BAKE: { id: 'bake', name: 'Bake', timeMultiplier: 1.5 },
  STEAM: { id: 'steam', name: 'Steam', timeMultiplier: 1.0 },
  SMOKE: { id: 'smoke', name: 'Smoke', timeMultiplier: 2.0 },
  STEW: { id: 'stew', name: 'Stew', timeMultiplier: 1.8 }
};

// Base recipes
export const BASE_RECIPES = {
  BREAD: {
    id: 'bread',
    name: 'Bread',
    ingredients: [{ type: 'grain', amount: 2 }, { type: 'liquid', amount: 1 }],
    method: 'bake',
    difficulty: 'simple',
    buff: 'health_regen',
    buffAmount: 5,
    duration: 300,
    exp: 10
  },
  GRILLED_MEAT: {
    id: 'grilled_meat',
    name: 'Grilled Meat',
    ingredients: [{ type: 'meat', amount: 1 }, { type: 'spice', amount: 1 }],
    method: 'grill',
    difficulty: 'easy',
    buff: 'attack_boost',
    buffAmount: 10,
    duration: 600,
    exp: 15
  },
  FISH_STEW: {
    id: 'fish_stew',
    name: 'Fish Stew',
    ingredients: [{ type: 'fish', amount: 2 }, { type: 'vegetable', amount: 1 }, { type: 'herb', amount: 1 }],
    method: 'stew',
    difficulty: 'moderate',
    buff: 'mana_regen',
    buffAmount: 8,
    duration: 900,
    exp: 25
  },
  FRUIT_PIE: {
    id: 'fruit_pie',
    name: 'Fruit Pie',
    ingredients: [{ type: 'fruit', amount: 3 }, { type: 'grain', amount: 1 }, { type: 'sweetener', amount: 1 }],
    method: 'bake',
    difficulty: 'complex',
    buff: 'exp_boost',
    buffAmount: 15,
    duration: 1200,
    exp: 40
  },
  FEAST_PLATTER: {
    id: 'feast_platter',
    name: 'Feast Platter',
    ingredients: [
      { type: 'meat', amount: 2 },
      { type: 'vegetable', amount: 2 },
      { type: 'grain', amount: 1 },
      { type: 'spice', amount: 2 }
    ],
    method: 'grill',
    difficulty: 'master',
    buff: 'attack_boost',
    buffAmount: 25,
    duration: 1800,
    exp: 75
  }
};

/**
 * Get cooking state from game state
 */
function getCookingState(state) {
  return state.cooking || {
    level: 1,
    exp: 0,
    expToNext: 100,
    knownRecipes: [],
    ingredients: {},
    activeBuff: null,
    history: [],
    stats: {
      dishesCooked: 0,
      perfectDishes: 0,
      failedAttempts: 0
    }
  };
}

/**
 * Initialize cooking state
 */
export function initCookingState(state) {
  return {
    state: {
      ...state,
      cooking: {
        level: 1,
        exp: 0,
        expToNext: 100,
        knownRecipes: ['bread'],
        ingredients: {},
        activeBuff: null,
        buffExpiresAt: null,
        history: [],
        stats: {
          dishesCooked: 0,
          perfectDishes: 0,
          failedAttempts: 0
        }
      }
    },
    success: true
  };
}

/**
 * Learn a new recipe
 */
export function learnRecipe(state, recipeId) {
  const recipeKey = recipeId.toUpperCase();
  
  if (!BASE_RECIPES[recipeKey]) {
    return { state, success: false, error: 'Recipe not found' };
  }

  const cookingState = getCookingState(state);
  
  if (cookingState.knownRecipes.includes(recipeId.toLowerCase())) {
    return { state, success: false, error: 'Recipe already known' };
  }

  return {
    state: {
      ...state,
      cooking: {
        ...cookingState,
        knownRecipes: [...cookingState.knownRecipes, recipeId.toLowerCase()]
      }
    },
    success: true,
    recipe: BASE_RECIPES[recipeKey]
  };
}

/**
 * Add ingredients to inventory
 */
export function addIngredient(state, ingredientType, amount = 1) {
  const typeKey = ingredientType.toUpperCase();
  
  if (!INGREDIENT_TYPES[typeKey]) {
    return { state, success: false, error: 'Invalid ingredient type' };
  }

  if (amount < 1) {
    return { state, success: false, error: 'Amount must be positive' };
  }

  const cookingState = getCookingState(state);
  const currentAmount = cookingState.ingredients[ingredientType.toLowerCase()] || 0;

  return {
    state: {
      ...state,
      cooking: {
        ...cookingState,
        ingredients: {
          ...cookingState.ingredients,
          [ingredientType.toLowerCase()]: currentAmount + amount
        }
      }
    },
    success: true,
    ingredient: ingredientType.toLowerCase(),
    newAmount: currentAmount + amount
  };
}

/**
 * Remove ingredients from inventory
 */
export function removeIngredient(state, ingredientType, amount = 1) {
  const cookingState = getCookingState(state);
  const currentAmount = cookingState.ingredients[ingredientType.toLowerCase()] || 0;

  if (currentAmount < amount) {
    return { state, success: false, error: 'Not enough ingredients' };
  }

  const newAmount = currentAmount - amount;
  const newIngredients = { ...cookingState.ingredients };
  
  if (newAmount === 0) {
    delete newIngredients[ingredientType.toLowerCase()];
  } else {
    newIngredients[ingredientType.toLowerCase()] = newAmount;
  }

  return {
    state: {
      ...state,
      cooking: {
        ...cookingState,
        ingredients: newIngredients
      }
    },
    success: true,
    ingredient: ingredientType.toLowerCase(),
    newAmount
  };
}

/**
 * Check if player has required ingredients
 */
export function hasIngredients(state, recipeId) {
  const recipeKey = recipeId.toUpperCase();
  const recipe = BASE_RECIPES[recipeKey];
  
  if (!recipe) {
    return { hasAll: false, missing: [], error: 'Recipe not found' };
  }

  const cookingState = getCookingState(state);
  const missing = [];

  for (const req of recipe.ingredients) {
    const have = cookingState.ingredients[req.type] || 0;
    if (have < req.amount) {
      missing.push({ type: req.type, need: req.amount, have });
    }
  }

  return {
    hasAll: missing.length === 0,
    missing,
    recipe
  };
}

/**
 * Cook a recipe
 */
export function cookRecipe(state, recipeId, qualityRoll = Math.random()) {
  const recipeKey = recipeId.toUpperCase();
  const recipe = BASE_RECIPES[recipeKey];
  
  if (!recipe) {
    return { state, success: false, error: 'Recipe not found' };
  }

  const cookingState = getCookingState(state);
  
  if (!cookingState.knownRecipes.includes(recipeId.toLowerCase())) {
    return { state, success: false, error: 'Recipe not known' };
  }

  // Check ingredients
  const ingredientCheck = hasIngredients(state, recipeId);
  if (!ingredientCheck.hasAll) {
    return { state, success: false, error: 'Missing ingredients', missing: ingredientCheck.missing };
  }

  // Get difficulty
  const difficulty = RECIPE_DIFFICULTY[recipe.difficulty.toUpperCase()] || RECIPE_DIFFICULTY.SIMPLE;
  
  // Check for failure (modified by cooking level)
  const levelBonus = cookingState.level * 0.02;
  const adjustedFailChance = Math.max(0.01, difficulty.failChance - levelBonus);
  
  // Use deterministic outcome based on qualityRoll
  if (qualityRoll < adjustedFailChance) {
    // Failed - consume half ingredients
    let newState = state;
    for (const req of recipe.ingredients) {
      const halfAmount = Math.ceil(req.amount / 2);
      const result = removeIngredient(newState, req.type, halfAmount);
      newState = result.state;
    }

    return {
      state: {
        ...newState,
        cooking: {
          ...getCookingState(newState),
          stats: {
            ...getCookingState(newState).stats,
            failedAttempts: getCookingState(newState).stats.failedAttempts + 1
          }
        }
      },
      success: false,
      error: 'Cooking failed!',
      failed: true
    };
  }

  // Consume ingredients
  let newState = state;
  for (const req of recipe.ingredients) {
    const result = removeIngredient(newState, req.type, req.amount);
    newState = result.state;
  }

  // Determine quality
  let quality;
  const qualityScore = qualityRoll + (cookingState.level * 0.05);
  
  if (qualityScore >= 0.95) {
    quality = FOOD_QUALITY.EXQUISITE;
  } else if (qualityScore >= 0.80) {
    quality = FOOD_QUALITY.SUPERIOR;
  } else if (qualityScore >= 0.60) {
    quality = FOOD_QUALITY.FINE;
  } else if (qualityScore >= 0.30) {
    quality = FOOD_QUALITY.COMMON;
  } else {
    quality = FOOD_QUALITY.POOR;
  }

  // Calculate experience
  const expGained = Math.floor(recipe.exp * difficulty.expMultiplier);
  const newExp = cookingState.exp + expGained;
  
  // Check for level up
  let newLevel = cookingState.level;
  let expRemaining = newExp;
  let expToNext = cookingState.expToNext;
  
  while (expRemaining >= expToNext && newLevel < 100) {
    expRemaining -= expToNext;
    newLevel++;
    expToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
  }

  // Create cooked dish
  const dish = {
    id: `dish_${Date.now()}`,
    recipeId: recipe.id,
    name: recipe.name,
    quality: quality.id,
    buff: recipe.buff,
    buffAmount: Math.floor(recipe.buffAmount * quality.buffMultiplier),
    duration: recipe.duration,
    cookedAt: Date.now()
  };

  const isPerfect = quality.id === 'exquisite';

  const updatedCookingState = getCookingState(newState);

  return {
    state: {
      ...newState,
      cooking: {
        ...updatedCookingState,
        level: newLevel,
        exp: expRemaining,
        expToNext,
        history: [...updatedCookingState.history.slice(-49), dish],
        stats: {
          ...updatedCookingState.stats,
          dishesCooked: updatedCookingState.stats.dishesCooked + 1,
          perfectDishes: updatedCookingState.stats.perfectDishes + (isPerfect ? 1 : 0)
        }
      }
    },
    success: true,
    dish,
    quality: quality.id,
    expGained,
    leveledUp: newLevel > cookingState.level,
    newLevel
  };
}

/**
 * Consume a dish for its buff
 */
export function consumeDish(state, dish) {
  if (!dish || !dish.buff) {
    return { state, success: false, error: 'Invalid dish' };
  }

  const cookingState = getCookingState(state);
  const buffType = FOOD_BUFFS[dish.buff.toUpperCase()];
  
  if (!buffType) {
    return { state, success: false, error: 'Invalid buff type' };
  }

  const buff = {
    type: dish.buff,
    name: buffType.name,
    stat: buffType.stat,
    amount: dish.buffAmount,
    duration: dish.duration,
    expiresAt: Date.now() + (dish.duration * 1000),
    fromDish: dish.name,
    quality: dish.quality
  };

  return {
    state: {
      ...state,
      cooking: {
        ...cookingState,
        activeBuff: buff,
        buffExpiresAt: buff.expiresAt
      }
    },
    success: true,
    buff
  };
}

/**
 * Get active food buff
 */
export function getActiveBuff(state) {
  const cookingState = getCookingState(state);
  
  if (!cookingState.activeBuff) {
    return { active: false, buff: null };
  }

  const now = Date.now();
  if (now >= cookingState.buffExpiresAt) {
    return { active: false, buff: null, expired: true };
  }

  const timeRemaining = cookingState.buffExpiresAt - now;

  return {
    active: true,
    buff: cookingState.activeBuff,
    timeRemaining
  };
}

/**
 * Clear expired buff
 */
export function clearExpiredBuff(state) {
  const cookingState = getCookingState(state);
  
  if (!cookingState.activeBuff) {
    return { state, success: true, cleared: false };
  }

  const now = Date.now();
  if (now < cookingState.buffExpiresAt) {
    return { state, success: true, cleared: false };
  }

  return {
    state: {
      ...state,
      cooking: {
        ...cookingState,
        activeBuff: null,
        buffExpiresAt: null
      }
    },
    success: true,
    cleared: true
  };
}

/**
 * Get cooking stats
 */
export function getCookingStats(state) {
  const cookingState = getCookingState(state);

  return {
    level: cookingState.level,
    exp: cookingState.exp,
    expToNext: cookingState.expToNext,
    recipesKnown: cookingState.knownRecipes.length,
    totalRecipes: Object.keys(BASE_RECIPES).length,
    ...cookingState.stats
  };
}

/**
 * Get known recipes
 */
export function getKnownRecipes(state) {
  const cookingState = getCookingState(state);
  
  return cookingState.knownRecipes.map(id => {
    const recipe = BASE_RECIPES[id.toUpperCase()];
    if (!recipe) return null;
    
    const canCook = hasIngredients(state, id);
    
    return {
      ...recipe,
      canCook: canCook.hasAll,
      missing: canCook.missing
    };
  }).filter(r => r !== null);
}

/**
 * Get ingredient inventory
 */
export function getIngredients(state) {
  const cookingState = getCookingState(state);
  
  return Object.entries(cookingState.ingredients).map(([type, amount]) => {
    const typeInfo = INGREDIENT_TYPES[type.toUpperCase()];
    return {
      type,
      name: typeInfo ? typeInfo.name : type,
      amount
    };
  });
}

/**
 * Get recipe by ID
 */
export function getRecipe(recipeId) {
  const recipeKey = recipeId.toUpperCase();
  return BASE_RECIPES[recipeKey] || null;
}

/**
 * Get cooking history
 */
export function getCookingHistory(state) {
  const cookingState = getCookingState(state);
  return cookingState.history.slice(-20).reverse();
}
