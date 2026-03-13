/**
 * Cooking System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  INGREDIENT_TYPES,
  RECIPE_DIFFICULTY,
  FOOD_QUALITY,
  FOOD_BUFFS,
  COOKING_METHODS,
  BASE_RECIPES,
  initCookingState,
  learnRecipe,
  addIngredient,
  removeIngredient,
  hasIngredients,
  cookRecipe,
  consumeDish,
  getActiveBuff,
  clearExpiredBuff,
  getCookingStats,
  getKnownRecipes,
  getIngredients,
  getRecipe,
  getCookingHistory
} from '../src/cooking-system.js';

import {
  renderCookingPanel,
  renderActiveBuff,
  renderRecipeList,
  renderRecipeCard,
  renderRecipeDetail,
  renderIngredientInventory,
  renderCookingHistory,
  renderCookingStats,
  renderCookingResult,
  renderQualityIndicator,
  renderCompactCookingStatus,
  renderIngredientTypes,
  renderCookingMethods
} from '../src/cooking-system-ui.js';

describe('Cooking System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initCookingState(state);
    state = result.state;
  });

  describe('INGREDIENT_TYPES', () => {
    it('has all types', () => {
      assert.ok(INGREDIENT_TYPES.MEAT);
      assert.ok(INGREDIENT_TYPES.FISH);
      assert.ok(INGREDIENT_TYPES.VEGETABLE);
      assert.ok(INGREDIENT_TYPES.FRUIT);
      assert.ok(INGREDIENT_TYPES.SPICE);
    });

    it('types have id and name', () => {
      Object.values(INGREDIENT_TYPES).forEach(type => {
        assert.ok(type.id);
        assert.ok(type.name);
      });
    });
  });

  describe('RECIPE_DIFFICULTY', () => {
    it('has all difficulties', () => {
      assert.ok(RECIPE_DIFFICULTY.SIMPLE);
      assert.ok(RECIPE_DIFFICULTY.EASY);
      assert.ok(RECIPE_DIFFICULTY.MODERATE);
      assert.ok(RECIPE_DIFFICULTY.COMPLEX);
      assert.ok(RECIPE_DIFFICULTY.MASTER);
    });

    it('difficulties have fail chance', () => {
      Object.values(RECIPE_DIFFICULTY).forEach(diff => {
        assert.ok(typeof diff.failChance === 'number');
      });
    });
  });

  describe('FOOD_QUALITY', () => {
    it('has all qualities', () => {
      assert.ok(FOOD_QUALITY.POOR);
      assert.ok(FOOD_QUALITY.COMMON);
      assert.ok(FOOD_QUALITY.FINE);
      assert.ok(FOOD_QUALITY.SUPERIOR);
      assert.ok(FOOD_QUALITY.EXQUISITE);
    });

    it('qualities have buff multiplier', () => {
      Object.values(FOOD_QUALITY).forEach(q => {
        assert.ok(typeof q.buffMultiplier === 'number');
      });
    });
  });

  describe('FOOD_BUFFS', () => {
    it('has buffs', () => {
      assert.ok(Object.keys(FOOD_BUFFS).length >= 5);
    });

    it('buffs have stat', () => {
      Object.values(FOOD_BUFFS).forEach(buff => {
        assert.ok(buff.stat);
      });
    });
  });

  describe('COOKING_METHODS', () => {
    it('has methods', () => {
      assert.ok(COOKING_METHODS.BOIL);
      assert.ok(COOKING_METHODS.FRY);
      assert.ok(COOKING_METHODS.GRILL);
      assert.ok(COOKING_METHODS.BAKE);
    });
  });

  describe('BASE_RECIPES', () => {
    it('has recipes', () => {
      assert.ok(Object.keys(BASE_RECIPES).length >= 3);
    });

    it('recipes have required fields', () => {
      Object.values(BASE_RECIPES).forEach(recipe => {
        assert.ok(recipe.id);
        assert.ok(recipe.name);
        assert.ok(recipe.ingredients);
        assert.ok(recipe.method);
        assert.ok(recipe.difficulty);
      });
    });
  });

  describe('initCookingState', () => {
    it('creates initial state', () => {
      const result = initCookingState({});
      assert.ok(result.success);
      assert.strictEqual(result.state.cooking.level, 1);
    });

    it('starts with bread recipe', () => {
      const result = initCookingState({});
      assert.ok(result.state.cooking.knownRecipes.includes('bread'));
    });
  });

  describe('learnRecipe', () => {
    it('learns a recipe', () => {
      const result = learnRecipe(state, 'grilled_meat');
      assert.ok(result.success);
      assert.ok(result.state.cooking.knownRecipes.includes('grilled_meat'));
    });

    it('fails for unknown recipe', () => {
      const result = learnRecipe(state, 'unknown_recipe');
      assert.ok(!result.success);
    });

    it('fails if already known', () => {
      let result = learnRecipe(state, 'grilled_meat');
      state = result.state;
      
      result = learnRecipe(state, 'grilled_meat');
      assert.ok(!result.success);
    });
  });

  describe('addIngredient', () => {
    it('adds ingredient', () => {
      const result = addIngredient(state, 'meat', 5);
      assert.ok(result.success);
      assert.strictEqual(result.newAmount, 5);
    });

    it('stacks ingredients', () => {
      let result = addIngredient(state, 'meat', 3);
      state = result.state;
      
      result = addIngredient(state, 'meat', 2);
      assert.strictEqual(result.newAmount, 5);
    });

    it('fails for invalid type', () => {
      const result = addIngredient(state, 'invalid_type');
      assert.ok(!result.success);
    });

    it('fails for non-positive amount', () => {
      const result = addIngredient(state, 'meat', 0);
      assert.ok(!result.success);
    });
  });

  describe('removeIngredient', () => {
    it('removes ingredient', () => {
      let result = addIngredient(state, 'meat', 5);
      state = result.state;
      
      result = removeIngredient(state, 'meat', 3);
      assert.ok(result.success);
      assert.strictEqual(result.newAmount, 2);
    });

    it('fails if not enough', () => {
      let result = addIngredient(state, 'meat', 2);
      state = result.state;
      
      result = removeIngredient(state, 'meat', 5);
      assert.ok(!result.success);
    });

    it('removes key when empty', () => {
      let result = addIngredient(state, 'meat', 2);
      state = result.state;
      
      result = removeIngredient(state, 'meat', 2);
      assert.strictEqual(result.state.cooking.ingredients['meat'], undefined);
    });
  });

  describe('hasIngredients', () => {
    it('returns true when has all', () => {
      let result = addIngredient(state, 'grain', 5);
      state = result.state;
      result = addIngredient(state, 'liquid', 3);
      state = result.state;
      
      const check = hasIngredients(state, 'bread');
      assert.ok(check.hasAll);
      assert.strictEqual(check.missing.length, 0);
    });

    it('returns missing ingredients', () => {
      const check = hasIngredients(state, 'bread');
      assert.ok(!check.hasAll);
      assert.ok(check.missing.length > 0);
    });

    it('fails for unknown recipe', () => {
      const check = hasIngredients(state, 'unknown');
      assert.ok(!check.hasAll);
      assert.ok(check.error);
    });
  });

  describe('cookRecipe', () => {
    beforeEach(() => {
      // Add ingredients for bread
      let result = addIngredient(state, 'grain', 5);
      state = result.state;
      result = addIngredient(state, 'liquid', 3);
      state = result.state;
    });

    it('cooks successfully', () => {
      const result = cookRecipe(state, 'bread', 0.5);
      assert.ok(result.success);
      assert.ok(result.dish);
    });

    it('consumes ingredients', () => {
      const result = cookRecipe(state, 'bread', 0.5);
      // Bread needs 2 grain, 1 liquid
      assert.strictEqual(result.state.cooking.ingredients['grain'], 3);
      assert.strictEqual(result.state.cooking.ingredients['liquid'], 2);
    });

    it('grants experience', () => {
      const result = cookRecipe(state, 'bread', 0.5);
      assert.ok(result.expGained > 0);
    });

    it('determines quality based on roll', () => {
      const result = cookRecipe(state, 'bread', 0.95);
      // High roll should give good quality
      assert.ok(['exquisite', 'superior', 'fine'].includes(result.dish.quality));
    });

    it('can fail with low roll', () => {
      const result = cookRecipe(state, 'bread', 0.01);
      // Very low roll should fail
      assert.ok(!result.success || result.failed);
    });

    it('fails if recipe not known', () => {
      const result = cookRecipe(state, 'feast_platter', 0.5);
      assert.ok(!result.success);
    });

    it('fails if missing ingredients', () => {
      const result = cookRecipe(state, 'grilled_meat', 0.5);
      assert.ok(!result.success);
    });

    it('increments dishes cooked', () => {
      const result = cookRecipe(state, 'bread', 0.5);
      if (result.success) {
        assert.strictEqual(result.state.cooking.stats.dishesCooked, 1);
      }
    });

    it('adds to history', () => {
      const result = cookRecipe(state, 'bread', 0.5);
      if (result.success) {
        assert.ok(result.state.cooking.history.length > 0);
      }
    });
  });

  describe('consumeDish', () => {
    it('applies buff', () => {
      const dish = {
        name: 'Test Dish',
        buff: 'health_regen',
        buffAmount: 10,
        duration: 300,
        quality: 'common'
      };
      
      const result = consumeDish(state, dish);
      assert.ok(result.success);
      assert.ok(result.buff);
    });

    it('sets expiration time', () => {
      const dish = {
        name: 'Test Dish',
        buff: 'attack_boost',
        buffAmount: 5,
        duration: 600,
        quality: 'fine'
      };
      
      const result = consumeDish(state, dish);
      assert.ok(result.state.cooking.buffExpiresAt);
    });

    it('fails for invalid dish', () => {
      const result = consumeDish(state, null);
      assert.ok(!result.success);
    });
  });

  describe('getActiveBuff', () => {
    it('returns inactive when no buff', () => {
      const result = getActiveBuff(state);
      assert.ok(!result.active);
    });

    it('returns active buff', () => {
      const dish = {
        name: 'Test Dish',
        buff: 'health_regen',
        buffAmount: 10,
        duration: 300,
        quality: 'common'
      };
      
      let result = consumeDish(state, dish);
      state = result.state;
      
      const buffCheck = getActiveBuff(state);
      assert.ok(buffCheck.active);
      assert.ok(buffCheck.timeRemaining > 0);
    });
  });

  describe('clearExpiredBuff', () => {
    it('does nothing when no buff', () => {
      const result = clearExpiredBuff(state);
      assert.ok(result.success);
      assert.ok(!result.cleared);
    });

    it('clears expired buff', () => {
      // Set up an expired buff
      state.cooking.activeBuff = { type: 'health_regen' };
      state.cooking.buffExpiresAt = Date.now() - 1000;
      
      const result = clearExpiredBuff(state);
      assert.ok(result.success);
      assert.ok(result.cleared);
    });
  });

  describe('getCookingStats', () => {
    it('returns stats', () => {
      const stats = getCookingStats(state);
      assert.strictEqual(stats.level, 1);
      assert.ok(typeof stats.dishesCooked === 'number');
    });
  });

  describe('getKnownRecipes', () => {
    it('returns known recipes', () => {
      const recipes = getKnownRecipes(state);
      assert.ok(recipes.length > 0);
    });

    it('includes can cook status', () => {
      const recipes = getKnownRecipes(state);
      assert.ok('canCook' in recipes[0]);
    });
  });

  describe('getIngredients', () => {
    it('returns empty when no ingredients', () => {
      const ingredients = getIngredients(state);
      assert.strictEqual(ingredients.length, 0);
    });

    it('returns ingredients with names', () => {
      let result = addIngredient(state, 'meat', 3);
      state = result.state;
      
      const ingredients = getIngredients(state);
      assert.strictEqual(ingredients.length, 1);
      assert.ok(ingredients[0].name);
    });
  });

  describe('getRecipe', () => {
    it('returns recipe by id', () => {
      const recipe = getRecipe('bread');
      assert.ok(recipe);
      assert.strictEqual(recipe.name, 'Bread');
    });

    it('returns null for unknown', () => {
      const recipe = getRecipe('unknown');
      assert.strictEqual(recipe, null);
    });
  });

  describe('getCookingHistory', () => {
    it('returns empty initially', () => {
      const history = getCookingHistory(state);
      assert.strictEqual(history.length, 0);
    });
  });
});

describe('Cooking System UI', () => {
  let state;

  beforeEach(() => {
    const result = initCookingState({});
    state = result.state;
  });

  describe('renderCookingPanel', () => {
    it('renders panel', () => {
      const html = renderCookingPanel(state);
      assert.ok(html.includes('cooking-panel'));
      assert.ok(html.includes('Cooking'));
    });

    it('shows level', () => {
      const html = renderCookingPanel(state);
      assert.ok(html.includes('Level 1'));
    });

    it('has tabs', () => {
      const html = renderCookingPanel(state);
      assert.ok(html.includes('Recipes'));
      assert.ok(html.includes('Ingredients'));
    });
  });

  describe('renderActiveBuff', () => {
    it('shows no buff message', () => {
      const html = renderActiveBuff({ active: false });
      assert.ok(html.includes('No active food buff'));
    });

    it('shows active buff', () => {
      const buffInfo = {
        active: true,
        buff: {
          name: 'Health Regen',
          fromDish: 'Bread',
          amount: 5,
          stat: 'healthRegen'
        },
        timeRemaining: 300000
      };
      
      const html = renderActiveBuff(buffInfo);
      assert.ok(html.includes('Health Regen'));
      assert.ok(html.includes('Bread'));
    });
  });

  describe('renderRecipeList', () => {
    it('shows no recipes message', () => {
      state.cooking.knownRecipes = [];
      const html = renderRecipeList(state);
      assert.ok(html.includes('No recipes known'));
    });

    it('renders recipe cards', () => {
      const html = renderRecipeList(state);
      assert.ok(html.includes('recipe-card'));
    });
  });

  describe('renderRecipeCard', () => {
    it('renders card', () => {
      const recipe = {
        name: 'Test Recipe',
        difficulty: 'simple',
        method: 'bake',
        ingredients: [{ type: 'grain', amount: 2 }],
        buff: 'health_regen',
        buffAmount: 5,
        duration: 300,
        exp: 10,
        canCook: true,
        missing: []
      };
      
      const html = renderRecipeCard(recipe);
      assert.ok(html.includes('Test Recipe'));
      assert.ok(html.includes('cook-btn'));
    });

    it('disables button when missing ingredients', () => {
      const recipe = {
        name: 'Test Recipe',
        difficulty: 'simple',
        method: 'bake',
        ingredients: [{ type: 'grain', amount: 2 }],
        buff: 'health_regen',
        buffAmount: 5,
        duration: 300,
        exp: 10,
        canCook: false,
        missing: [{ type: 'grain' }]
      };
      
      const html = renderRecipeCard(recipe);
      assert.ok(html.includes('disabled'));
    });
  });

  describe('renderRecipeDetail', () => {
    it('shows not found for invalid recipe', () => {
      const html = renderRecipeDetail(state, 'unknown');
      assert.ok(html.includes('not found'));
    });

    it('renders recipe details', () => {
      const html = renderRecipeDetail(state, 'bread');
      assert.ok(html.includes('Bread'));
      assert.ok(html.includes('Ingredients'));
    });
  });

  describe('renderIngredientInventory', () => {
    it('shows no ingredients message', () => {
      const html = renderIngredientInventory(state);
      assert.ok(html.includes('No ingredients'));
    });

    it('renders ingredients', () => {
      let result = addIngredient(state, 'meat', 3);
      state = result.state;
      
      const html = renderIngredientInventory(state);
      assert.ok(html.includes('ingredient-slot'));
    });
  });

  describe('renderCookingHistory', () => {
    it('shows no history message', () => {
      const html = renderCookingHistory(state);
      assert.ok(html.includes('No dishes cooked'));
    });
  });

  describe('renderCookingStats', () => {
    it('renders stats', () => {
      const html = renderCookingStats(state);
      assert.ok(html.includes('Cooking Statistics'));
      assert.ok(html.includes('Level'));
    });
  });

  describe('renderCookingResult', () => {
    it('renders failure', () => {
      const html = renderCookingResult({ success: false, failed: true });
      assert.ok(html.includes('Failed'));
    });

    it('renders success', () => {
      const result = {
        success: true,
        dish: {
          name: 'Bread',
          quality: 'fine',
          buff: 'health_regen',
          buffAmount: 6,
          duration: 300
        },
        expGained: 10,
        leveledUp: false
      };
      
      const html = renderCookingResult(result);
      assert.ok(html.includes('Bread'));
      assert.ok(html.includes('Fine'));
    });

    it('shows level up', () => {
      const result = {
        success: true,
        dish: {
          name: 'Bread',
          quality: 'common',
          buff: 'health_regen',
          buffAmount: 5,
          duration: 300
        },
        expGained: 10,
        leveledUp: true,
        newLevel: 2
      };
      
      const html = renderCookingResult(result);
      assert.ok(html.includes('Level Up'));
    });
  });

  describe('renderQualityIndicator', () => {
    it('renders quality', () => {
      const html = renderQualityIndicator('fine');
      assert.ok(html.includes('Fine'));
    });
  });

  describe('renderCompactCookingStatus', () => {
    it('renders compact status', () => {
      const html = renderCompactCookingStatus(state);
      assert.ok(html.includes('Cooking Lv.1'));
    });
  });

  describe('renderIngredientTypes', () => {
    it('renders all types', () => {
      const html = renderIngredientTypes();
      assert.ok(html.includes('Ingredient Types'));
      assert.ok(html.includes('Meat'));
    });
  });

  describe('renderCookingMethods', () => {
    it('renders methods', () => {
      const html = renderCookingMethods();
      assert.ok(html.includes('Cooking Methods'));
      assert.ok(html.includes('Bake'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes recipe names', () => {
      const recipe = {
        name: '<script>alert("xss")</script>',
        difficulty: 'simple',
        method: 'bake',
        ingredients: [],
        buff: 'health_regen',
        buffAmount: 5,
        duration: 300,
        exp: 10,
        canCook: true,
        missing: []
      };
      
      const html = renderRecipeCard(recipe);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes buff names', () => {
      const buffInfo = {
        active: true,
        buff: {
          name: '<img onerror="alert(1)">',
          fromDish: 'Test',
          amount: 5,
          stat: 'test'
        },
        timeRemaining: 300000
      };
      
      const html = renderActiveBuff(buffInfo);
      assert.ok(!html.includes('<img'));
    });
  });
});
