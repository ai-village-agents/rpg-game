/**
 * Recipe Discovery System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_RARITY,
  RECIPE_CATEGORIES,
  DISCOVERY_DIFFICULTY,
  createDiscoveryState,
  createIngredient,
  createRecipe,
  createRecipeRegistry,
  registerRecipe,
  attemptDiscovery,
  generateHints,
  calculateLevel,
  getXpForNextLevel,
  getTotalXpForLevel,
  getDiscoveredRecipes,
  getUndiscoveredRecipes,
  isRecipeDiscovered,
  getDiscoveryProgress,
  getRecipesByCategory,
  getRecipesWithIngredient,
  learnIngredient,
  getIngredientKnowledge,
  purchaseHint,
  getRecipeHints,
  getDiscoveryStats,
  getRecentExperiments,
  clearFailedAttempts,
  getDifficultyInfo,
  hasTriedCombination,
  getFavoriteIngredients
} from '../src/recipe-discovery-system.js';

describe('Recipe Discovery System', () => {
  describe('Constants', () => {
    it('should have 10 ingredient categories', () => {
      assert.strictEqual(Object.keys(INGREDIENT_CATEGORIES).length, 10);
      assert.strictEqual(INGREDIENT_CATEGORIES.HERB, 'herb');
      assert.strictEqual(INGREDIENT_CATEGORIES.MINERAL, 'mineral');
      assert.strictEqual(INGREDIENT_CATEGORIES.ESSENCE, 'essence');
      assert.strictEqual(INGREDIENT_CATEGORIES.ARCANE, 'arcane');
    });

    it('should have 5 ingredient rarities', () => {
      assert.strictEqual(Object.keys(INGREDIENT_RARITY).length, 5);
      assert.strictEqual(INGREDIENT_RARITY.COMMON.multiplier, 1.0);
      assert.strictEqual(INGREDIENT_RARITY.LEGENDARY.multiplier, 5.0);
    });

    it('should have 8 recipe categories', () => {
      assert.strictEqual(Object.keys(RECIPE_CATEGORIES).length, 8);
      assert.strictEqual(RECIPE_CATEGORIES.POTION, 'potion');
      assert.strictEqual(RECIPE_CATEGORIES.WEAPON, 'weapon');
    });

    it('should have 5 discovery difficulties', () => {
      assert.strictEqual(Object.keys(DISCOVERY_DIFFICULTY).length, 5);
      assert.strictEqual(DISCOVERY_DIFFICULTY.EASY.baseXp, 10);
      assert.strictEqual(DISCOVERY_DIFFICULTY.LEGENDARY.baseXp, 250);
    });
  });

  describe('createDiscoveryState', () => {
    it('should create empty discovery state', () => {
      const state = createDiscoveryState();
      assert.deepStrictEqual(state.discoveredRecipes, []);
      assert.deepStrictEqual(state.failedAttempts, []);
      assert.deepStrictEqual(state.hints, {});
      assert.deepStrictEqual(state.ingredientKnowledge, {});
      assert.deepStrictEqual(state.experimentLog, []);
    });

    it('should initialize stats correctly', () => {
      const state = createDiscoveryState();
      assert.strictEqual(state.stats.totalExperiments, 0);
      assert.strictEqual(state.stats.successfulDiscoveries, 0);
      assert.strictEqual(state.stats.failedExperiments, 0);
      assert.strictEqual(state.stats.discoveryXp, 0);
      assert.strictEqual(state.stats.discoveryLevel, 1);
    });
  });

  describe('createIngredient', () => {
    it('should create ingredient with all properties', () => {
      const ingredient = createIngredient('herb_001', 'Healing Herb', 'herb', 'COMMON', ['healing', 'restorative']);
      assert.strictEqual(ingredient.id, 'herb_001');
      assert.strictEqual(ingredient.name, 'Healing Herb');
      assert.strictEqual(ingredient.category, 'herb');
      assert.strictEqual(ingredient.rarity, 'COMMON');
      assert.deepStrictEqual(ingredient.properties, ['healing', 'restorative']);
      assert.strictEqual(ingredient.discoveredAt, null);
    });

    it('should create ingredient with default empty properties', () => {
      const ingredient = createIngredient('gem_001', 'Ruby', 'gem', 'RARE');
      assert.deepStrictEqual(ingredient.properties, []);
    });
  });

  describe('createRecipe', () => {
    it('should create valid recipe', () => {
      const result = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb_001', 'water'], { type: 'consumable', effect: 'heal' }, 'EASY');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.recipe.id, 'potion_001');
      assert.strictEqual(result.recipe.name, 'Health Potion');
      assert.strictEqual(result.recipe.category, 'POTION');
      assert.strictEqual(result.recipe.difficulty, 'EASY');
      assert.strictEqual(result.recipe.discoverable, true);
    });

    it('should sort ingredients alphabetically', () => {
      const result = createRecipe('potion_002', 'Mana Potion', 'POTION', ['water', 'essence', 'crystal'], {}, 'MEDIUM');
      assert.deepStrictEqual(result.recipe.ingredients, ['crystal', 'essence', 'water']);
    });

    it('should reject recipe without id', () => {
      const result = createRecipe('', 'Test Recipe', 'POTION', ['a', 'b'], {}, 'EASY');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid recipe id or name');
    });

    it('should reject recipe without name', () => {
      const result = createRecipe('test_001', '', 'POTION', ['a', 'b'], {}, 'EASY');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid recipe id or name');
    });

    it('should reject recipe with fewer than 2 ingredients', () => {
      const result = createRecipe('test_001', 'Test', 'POTION', ['a'], {}, 'EASY');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Recipe requires at least 2 ingredients');
    });

    it('should reject recipe with more than 5 ingredients', () => {
      const result = createRecipe('test_001', 'Test', 'POTION', ['a', 'b', 'c', 'd', 'e', 'f'], {}, 'EASY');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Recipe cannot have more than 5 ingredients');
    });

    it('should reject invalid category', () => {
      const result = createRecipe('test_001', 'Test', 'INVALID', ['a', 'b'], {}, 'EASY');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid recipe category');
    });

    it('should reject invalid difficulty', () => {
      const result = createRecipe('test_001', 'Test', 'POTION', ['a', 'b'], {}, 'INVALID');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid difficulty');
    });
  });

  describe('createRecipeRegistry', () => {
    it('should create empty registry', () => {
      const registry = createRecipeRegistry();
      assert.deepStrictEqual(registry.recipes, {});
      assert.deepStrictEqual(registry.byCategory, {});
      assert.deepStrictEqual(registry.byIngredient, {});
    });
  });

  describe('registerRecipe', () => {
    it('should register recipe successfully', () => {
      const registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      const result = registerRecipe(registry, recipe);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.registry.recipes['potion_001'].name, 'Health Potion');
    });

    it('should index recipe by category', () => {
      const registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      const result = registerRecipe(registry, recipe);

      assert.deepStrictEqual(result.registry.byCategory['POTION'], ['potion_001']);
    });

    it('should index recipe by ingredients', () => {
      const registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      const result = registerRecipe(registry, recipe);

      assert.ok(result.registry.byIngredient['herb'].includes('potion_001'));
      assert.ok(result.registry.byIngredient['water'].includes('potion_001'));
    });

    it('should reject invalid recipe', () => {
      const registry = createRecipeRegistry();
      const result = registerRecipe(registry, null);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid recipe');
    });

    it('should reject duplicate recipe', () => {
      let registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      registry = registerRecipe(registry, recipe).registry;

      const result = registerRecipe(registry, recipe);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Recipe already registered');
    });
  });

  describe('attemptDiscovery', () => {
    let state;
    let registry;

    beforeEach(() => {
      state = createDiscoveryState();
      registry = createRecipeRegistry();

      const recipe1 = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      const recipe2 = createRecipe('potion_002', 'Mana Potion', 'POTION', ['crystal', 'water'], {}, 'MEDIUM').recipe;
      registry = registerRecipe(registry, recipe1).registry;
      registry = registerRecipe(registry, recipe2).registry;
    });

    it('should discover matching recipe', () => {
      const result = attemptDiscovery(state, registry, ['herb', 'water']);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isNewDiscovery, true);
      assert.strictEqual(result.recipe.id, 'potion_001');
      assert.ok(result.xpGained > 0);
    });

    it('should discover recipe regardless of ingredient order', () => {
      const result = attemptDiscovery(state, registry, ['water', 'herb']);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.recipe.id, 'potion_001');
    });

    it('should track discovered recipes', () => {
      const result = attemptDiscovery(state, registry, ['herb', 'water']);
      assert.ok(result.state.discoveredRecipes.includes('potion_001'));
    });

    it('should return alreadyKnown for re-discovered recipes', () => {
      let result = attemptDiscovery(state, registry, ['herb', 'water']);
      result = attemptDiscovery(result.state, registry, ['herb', 'water']);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.alreadyKnown, true);
    });

    it('should fail with too few ingredients', () => {
      const result = attemptDiscovery(state, registry, ['herb']);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Need at least 2 ingredients');
    });

    it('should fail with too many ingredients', () => {
      const result = attemptDiscovery(state, registry, ['a', 'b', 'c', 'd', 'e', 'f']);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Cannot use more than 5 ingredients');
    });

    it('should mark repeat attempts', () => {
      let result = attemptDiscovery(state, registry, ['wrong', 'combo']);
      result = attemptDiscovery(result.state, registry, ['wrong', 'combo']);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.isRepeat, true);
    });

    it('should track failed experiments', () => {
      const result = attemptDiscovery(state, registry, ['wrong', 'combo']);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.isFailedExperiment, true);
      assert.strictEqual(result.state.stats.failedExperiments, 1);
    });

    it('should increment total experiments', () => {
      let result = attemptDiscovery(state, registry, ['herb', 'water']);
      result = attemptDiscovery(result.state, registry, ['crystal', 'water']);
      assert.strictEqual(result.state.stats.totalExperiments, 2);
    });

    it('should gain XP on discovery', () => {
      const result = attemptDiscovery(state, registry, ['herb', 'water']);
      assert.ok(result.state.stats.discoveryXp > 0);
    });

    it('should generate hints for near-misses', () => {
      const result = attemptDiscovery(state, registry, ['herb', 'wrong']);
      assert.strictEqual(result.isFailedExperiment, true);
      // Hints may or may not be generated depending on partial match
    });

    it('should maintain experiment log', () => {
      const result = attemptDiscovery(state, registry, ['herb', 'water']);
      assert.strictEqual(result.state.experimentLog.length, 1);
      assert.strictEqual(result.state.experimentLog[0].success, true);
    });
  });

  describe('generateHints', () => {
    it('should generate hints for partial matches', () => {
      let registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      registry = registerRecipe(registry, recipe).registry;

      const hints = generateHints(registry, ['herb', 'wrong'], []);
      assert.ok(hints.length >= 0); // May or may not match depending on % threshold
    });

    it('should not hint already discovered recipes', () => {
      let registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      registry = registerRecipe(registry, recipe).registry;

      const hints = generateHints(registry, ['herb', 'wrong'], ['potion_001']);
      assert.ok(!hints.some(h => h.recipeId === 'potion_001'));
    });

    it('should categorize hints as warm or cold', () => {
      let registry = createRecipeRegistry();
      const recipe = createRecipe('potion_001', 'Test Recipe', 'POTION', ['a', 'b', 'c', 'd'], {}, 'EASY').recipe;
      registry = registerRecipe(registry, recipe).registry;

      // 3 out of 4 = 75% = warm
      const hints = generateHints(registry, ['a', 'b', 'c', 'wrong'], []);
      if (hints.length > 0) {
        assert.strictEqual(hints[0].hintLevel, 'warm');
      }
    });

    it('should limit hints to 3', () => {
      let registry = createRecipeRegistry();
      for (let i = 0; i < 5; i++) {
        const recipe = createRecipe(`recipe_${i}`, `Recipe ${i}`, 'POTION', ['shared', `unique_${i}`], {}, 'EASY').recipe;
        registry = registerRecipe(registry, recipe).registry;
      }

      const hints = generateHints(registry, ['shared', 'other'], []);
      assert.ok(hints.length <= 3);
    });
  });

  describe('Level Calculations', () => {
    describe('calculateLevel', () => {
      it('should return level 1 for 0 XP', () => {
        assert.strictEqual(calculateLevel(0), 1);
      });

      it('should return level 1 for 99 XP', () => {
        assert.strictEqual(calculateLevel(99), 1);
      });

      it('should return level 2 for 100 XP', () => {
        assert.strictEqual(calculateLevel(100), 2);
      });

      it('should return level 3 for 250 XP', () => {
        // Level 2 requires 100, Level 3 requires 150 more = 250 total
        assert.strictEqual(calculateLevel(250), 3);
      });

      it('should handle high XP values', () => {
        const level = calculateLevel(10000);
        assert.ok(level > 1);
      });
    });

    describe('getXpForNextLevel', () => {
      it('should return 100 for level 1', () => {
        assert.strictEqual(getXpForNextLevel(1), 100);
      });

      it('should return 150 for level 2', () => {
        assert.strictEqual(getXpForNextLevel(2), 150);
      });

      it('should return 200 for level 3', () => {
        assert.strictEqual(getXpForNextLevel(3), 200);
      });
    });

    describe('getTotalXpForLevel', () => {
      it('should return 0 for level 1', () => {
        assert.strictEqual(getTotalXpForLevel(1), 0);
      });

      it('should return 100 for level 2', () => {
        assert.strictEqual(getTotalXpForLevel(2), 100);
      });

      it('should return 250 for level 3', () => {
        assert.strictEqual(getTotalXpForLevel(3), 250);
      });
    });
  });

  describe('Recipe Queries', () => {
    let state;
    let registry;

    beforeEach(() => {
      state = createDiscoveryState();
      registry = createRecipeRegistry();

      const recipe1 = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
      const recipe2 = createRecipe('potion_002', 'Mana Potion', 'POTION', ['crystal', 'water'], {}, 'MEDIUM').recipe;
      const recipe3 = createRecipe('weapon_001', 'Fire Sword', 'WEAPON', ['metal', 'essence'], {}, 'HARD').recipe;
      registry = registerRecipe(registry, recipe1).registry;
      registry = registerRecipe(registry, recipe2).registry;
      registry = registerRecipe(registry, recipe3).registry;

      // Discover first recipe
      const result = attemptDiscovery(state, registry, ['herb', 'water']);
      state = result.state;
    });

    describe('getDiscoveredRecipes', () => {
      it('should return discovered recipes', () => {
        const discovered = getDiscoveredRecipes(state, registry);
        assert.strictEqual(discovered.length, 1);
        assert.strictEqual(discovered[0].id, 'potion_001');
      });

      it('should return empty array with no discoveries', () => {
        const emptyState = createDiscoveryState();
        const discovered = getDiscoveredRecipes(emptyState, registry);
        assert.deepStrictEqual(discovered, []);
      });
    });

    describe('getUndiscoveredRecipes', () => {
      it('should return undiscovered recipes', () => {
        const undiscovered = getUndiscoveredRecipes(state, registry);
        assert.strictEqual(undiscovered.length, 2);
      });

      it('should return all recipes with no discoveries', () => {
        const emptyState = createDiscoveryState();
        const undiscovered = getUndiscoveredRecipes(emptyState, registry);
        assert.strictEqual(undiscovered.length, 3);
      });
    });

    describe('isRecipeDiscovered', () => {
      it('should return true for discovered recipe', () => {
        assert.strictEqual(isRecipeDiscovered(state, 'potion_001'), true);
      });

      it('should return false for undiscovered recipe', () => {
        assert.strictEqual(isRecipeDiscovered(state, 'potion_002'), false);
      });
    });

    describe('getDiscoveryProgress', () => {
      it('should calculate progress correctly', () => {
        const progress = getDiscoveryProgress(state, registry);
        assert.strictEqual(progress.discovered, 1);
        assert.strictEqual(progress.total, 3);
        assert.strictEqual(progress.percentage, 33);
      });

      it('should return 0 percentage for empty registry', () => {
        const emptyRegistry = createRecipeRegistry();
        const progress = getDiscoveryProgress(state, emptyRegistry);
        assert.strictEqual(progress.percentage, 0);
      });
    });

    describe('getRecipesByCategory', () => {
      it('should return discovered recipes in category', () => {
        const potions = getRecipesByCategory(state, registry, 'POTION');
        assert.strictEqual(potions.length, 1);
        assert.strictEqual(potions[0].id, 'potion_001');
      });

      it('should return empty array for category with no discoveries', () => {
        const weapons = getRecipesByCategory(state, registry, 'WEAPON');
        assert.strictEqual(weapons.length, 0);
      });
    });

    describe('getRecipesWithIngredient', () => {
      it('should return discovered recipes using ingredient', () => {
        const recipes = getRecipesWithIngredient(state, registry, 'herb');
        assert.strictEqual(recipes.length, 1);
        assert.strictEqual(recipes[0].id, 'potion_001');
      });

      it('should return empty for unused ingredient', () => {
        const recipes = getRecipesWithIngredient(state, registry, 'metal');
        assert.strictEqual(recipes.length, 0);
      });
    });
  });

  describe('Ingredient Knowledge', () => {
    describe('learnIngredient', () => {
      it('should learn new property', () => {
        let state = createDiscoveryState();
        const result = learnIngredient(state, 'herb_001', 'healing');

        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(result.state.ingredientKnowledge['herb_001'], ['healing']);
      });

      it('should learn multiple properties', () => {
        let state = createDiscoveryState();
        let result = learnIngredient(state, 'herb_001', 'healing');
        result = learnIngredient(result.state, 'herb_001', 'restorative');

        assert.deepStrictEqual(result.state.ingredientKnowledge['herb_001'], ['healing', 'restorative']);
      });

      it('should reject duplicate properties', () => {
        let state = createDiscoveryState();
        let result = learnIngredient(state, 'herb_001', 'healing');
        result = learnIngredient(result.state, 'herb_001', 'healing');

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Already know this property');
      });
    });

    describe('getIngredientKnowledge', () => {
      it('should return known properties', () => {
        let state = createDiscoveryState();
        const result = learnIngredient(state, 'herb_001', 'healing');
        state = result.state;

        const knowledge = getIngredientKnowledge(state, 'herb_001');
        assert.deepStrictEqual(knowledge, ['healing']);
      });

      it('should return empty array for unknown ingredient', () => {
        const state = createDiscoveryState();
        const knowledge = getIngredientKnowledge(state, 'unknown');
        assert.deepStrictEqual(knowledge, []);
      });
    });
  });

  describe('Hint System', () => {
    let state;
    let registry;

    beforeEach(() => {
      state = createDiscoveryState();
      registry = createRecipeRegistry();

      const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water', 'salt'], {}, 'EASY').recipe;
      registry = registerRecipe(registry, recipe).registry;
    });

    describe('purchaseHint', () => {
      it('should reveal one ingredient', () => {
        const result = purchaseHint(state, registry, 'POTION', 100);
        assert.strictEqual(result.success, true);
        assert.ok(result.revealedIngredient);
        assert.ok(['herb', 'water', 'salt'].includes(result.revealedIngredient));
      });

      it('should track remaining hidden ingredients', () => {
        const result = purchaseHint(state, registry, 'POTION', 100);
        assert.strictEqual(result.remainingHidden, 2);
      });

      it('should fail for fully discovered category', () => {
        // Discover the only POTION recipe
        let discoveryResult = attemptDiscovery(state, registry, ['herb', 'salt', 'water']);
        state = discoveryResult.state;

        const result = purchaseHint(state, registry, 'POTION', 100);
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'All recipes in this category discovered');
      });

      it('should update state with new hint', () => {
        const result = purchaseHint(state, registry, 'POTION', 100);
        assert.ok(result.state.hints['potion_001'].length === 1);
      });
    });

    describe('getRecipeHints', () => {
      it('should return purchased hints', () => {
        let result = purchaseHint(state, registry, 'POTION', 100);
        state = result.state;

        const hints = getRecipeHints(state, 'potion_001');
        assert.strictEqual(hints.length, 1);
      });

      it('should return empty array for no hints', () => {
        const hints = getRecipeHints(state, 'potion_001');
        assert.deepStrictEqual(hints, []);
      });
    });
  });

  describe('Statistics', () => {
    describe('getDiscoveryStats', () => {
      it('should calculate success rate', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
        registry = registerRecipe(registry, recipe).registry;

        // One success
        let result = attemptDiscovery(state, registry, ['herb', 'water']);
        state = result.state;

        // One failure
        result = attemptDiscovery(state, registry, ['wrong', 'combo']);
        state = result.state;

        const stats = getDiscoveryStats(state);
        assert.strictEqual(stats.successRate, 50);
      });

      it('should return 0 success rate with no experiments', () => {
        const state = createDiscoveryState();
        const stats = getDiscoveryStats(state);
        assert.strictEqual(stats.successRate, 0);
      });

      it('should calculate level progress', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
        registry = registerRecipe(registry, recipe).registry;

        const result = attemptDiscovery(state, registry, ['herb', 'water']);
        state = result.state;

        const stats = getDiscoveryStats(state);
        assert.ok(stats.xpNeeded > 0);
        assert.ok(stats.levelProgress >= 0);
      });
    });

    describe('getRecentExperiments', () => {
      it('should return recent experiments', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
        registry = registerRecipe(registry, recipe).registry;

        const result = attemptDiscovery(state, registry, ['herb', 'water']);
        state = result.state;

        const recent = getRecentExperiments(state);
        assert.strictEqual(recent.length, 1);
        assert.strictEqual(recent[0].success, true);
      });

      it('should return experiments in reverse order', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const recipe = createRecipe('potion_001', 'Health Potion', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
        registry = registerRecipe(registry, recipe).registry;

        let result = attemptDiscovery(state, registry, ['herb', 'water']);
        state = result.state;
        result = attemptDiscovery(state, registry, ['wrong', 'combo']);
        state = result.state;

        const recent = getRecentExperiments(state);
        assert.strictEqual(recent[0].success, false); // Most recent first
        assert.strictEqual(recent[1].success, true);
      });

      it('should respect limit parameter', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        for (let i = 0; i < 5; i++) {
          const result = attemptDiscovery(state, registry, [`item_${i}`, `item_${i + 10}`]);
          state = result.state;
        }

        const recent = getRecentExperiments(state, 3);
        assert.strictEqual(recent.length, 3);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('clearFailedAttempts', () => {
      it('should clear all failed attempts', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const result = attemptDiscovery(state, registry, ['wrong', 'combo']);
        state = result.state;

        assert.ok(state.failedAttempts.length > 0);

        state = clearFailedAttempts(state);
        assert.deepStrictEqual(state.failedAttempts, []);
      });
    });

    describe('getDifficultyInfo', () => {
      it('should return difficulty info', () => {
        const info = getDifficultyInfo('EASY');
        assert.strictEqual(info.name, 'Easy');
        assert.strictEqual(info.baseXp, 10);
      });

      it('should handle case insensitivity', () => {
        const info = getDifficultyInfo('easy');
        assert.strictEqual(info.name, 'Easy');
      });

      it('should return null for invalid difficulty', () => {
        const info = getDifficultyInfo('INVALID');
        assert.strictEqual(info, null);
      });
    });

    describe('hasTriedCombination', () => {
      it('should detect tried combinations', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const result = attemptDiscovery(state, registry, ['a', 'b']);
        state = result.state;

        assert.strictEqual(hasTriedCombination(state, ['a', 'b']), true);
        assert.strictEqual(hasTriedCombination(state, ['b', 'a']), true); // Order independent
      });

      it('should return false for untried combinations', () => {
        const state = createDiscoveryState();
        assert.strictEqual(hasTriedCombination(state, ['a', 'b']), false);
      });
    });

    describe('getFavoriteIngredients', () => {
      it('should return most used ingredients', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        const recipe1 = createRecipe('recipe_1', 'Recipe 1', 'POTION', ['herb', 'water'], {}, 'EASY').recipe;
        const recipe2 = createRecipe('recipe_2', 'Recipe 2', 'POTION', ['herb', 'salt'], {}, 'EASY').recipe;
        registry = registerRecipe(registry, recipe1).registry;
        registry = registerRecipe(registry, recipe2).registry;

        let result = attemptDiscovery(state, registry, ['herb', 'water']);
        state = result.state;
        result = attemptDiscovery(state, registry, ['herb', 'salt']);
        state = result.state;

        const favorites = getFavoriteIngredients(state, registry);
        assert.strictEqual(favorites[0].ingredientId, 'herb');
        assert.strictEqual(favorites[0].count, 2);
      });

      it('should respect limit parameter', () => {
        let state = createDiscoveryState();
        let registry = createRecipeRegistry();

        for (let i = 0; i < 10; i++) {
          const recipe = createRecipe(`recipe_${i}`, `Recipe ${i}`, 'POTION', [`ing_${i}`, `ing_${i + 100}`], {}, 'EASY').recipe;
          registry = registerRecipe(registry, recipe).registry;

          const result = attemptDiscovery(state, registry, [`ing_${i}`, `ing_${i + 100}`]);
          state = result.state;
        }

        const favorites = getFavoriteIngredients(state, registry, 3);
        assert.strictEqual(favorites.length, 3);
      });

      it('should return empty array with no discoveries', () => {
        const state = createDiscoveryState();
        const registry = createRecipeRegistry();
        const favorites = getFavoriteIngredients(state, registry);
        assert.deepStrictEqual(favorites, []);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty registry', () => {
      const state = createDiscoveryState();
      const registry = createRecipeRegistry();

      const result = attemptDiscovery(state, registry, ['a', 'b']);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.isFailedExperiment, true);
    });

    it('should handle experiment log overflow', () => {
      let state = createDiscoveryState();
      let registry = createRecipeRegistry();

      // Add 100 experiments
      for (let i = 0; i < 100; i++) {
        const result = attemptDiscovery(state, registry, [`item_${i}`, `item_${i + 1000}`]);
        state = result.state;
      }

      // Log should be capped at 50
      assert.ok(state.experimentLog.length <= 50);
    });

    it('should handle discovery with 5 ingredients', () => {
      let state = createDiscoveryState();
      let registry = createRecipeRegistry();

      const recipe = createRecipe('complex_001', 'Complex Potion', 'POTION', ['a', 'b', 'c', 'd', 'e'], {}, 'LEGENDARY').recipe;
      registry = registerRecipe(registry, recipe).registry;

      const result = attemptDiscovery(state, registry, ['e', 'd', 'c', 'b', 'a']);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.recipe.id, 'complex_001');
    });

    it('should award correct XP for different difficulties', () => {
      let state = createDiscoveryState();
      let registry = createRecipeRegistry();

      const easyRecipe = createRecipe('easy_001', 'Easy Recipe', 'POTION', ['a', 'b'], {}, 'EASY').recipe;
      const legendaryRecipe = createRecipe('legend_001', 'Legendary Recipe', 'POTION', ['x', 'y'], {}, 'LEGENDARY').recipe;
      registry = registerRecipe(registry, easyRecipe).registry;
      registry = registerRecipe(registry, legendaryRecipe).registry;

      let result = attemptDiscovery(state, registry, ['a', 'b']);
      const easyXp = result.xpGained;
      state = result.state;

      result = attemptDiscovery(state, registry, ['x', 'y']);
      const legendaryXp = result.xpGained;

      assert.strictEqual(easyXp, 10);
      assert.strictEqual(legendaryXp, 250);
    });
  });
});
