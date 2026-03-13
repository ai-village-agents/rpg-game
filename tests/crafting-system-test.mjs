/**
 * Crafting System Tests
 * 85 tests covering recipes, skills, crafting, quality, and discovery
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  CRAFTING_CATEGORIES,
  QUALITY_LEVELS,
  WORKSTATIONS,
  createCraftingState,
  createRecipe,
  createRecipeRegistry,
  registerRecipe,
  learnRecipe,
  isRecipeKnown,
  getKnownRecipes,
  getRecipesByCategory,
  hasIngredients,
  getMissingIngredients,
  getSkillLevel,
  calculateSuccessChance,
  calculateCriticalChance,
  startCrafting,
  cancelCrafting,
  completeCrafting,
  addSkillExperience,
  queueCrafting,
  clearQueue,
  removeFromQueue,
  getCraftingProgress,
  discoverRecipe,
  getCraftableRecipes,
  getCraftingStats,
  getCategoryInfo,
  getQualityInfo,
  getWorkstationInfo,
  canUseWorkstation
} from '../src/crafting-system.js';

// ============================================================================
// CRAFTING_CATEGORIES Tests (8 tests)
// ============================================================================

describe('CRAFTING_CATEGORIES', () => {
  it('has SMITHING category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.SMITHING.name, 'Smithing');
    assert.strictEqual(CRAFTING_CATEGORIES.SMITHING.icon, '🔨');
  });

  it('has ALCHEMY category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.ALCHEMY.name, 'Alchemy');
    assert.strictEqual(CRAFTING_CATEGORIES.ALCHEMY.icon, '⚗️');
  });

  it('has COOKING category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.COOKING.name, 'Cooking');
    assert.strictEqual(CRAFTING_CATEGORIES.COOKING.icon, '🍳');
  });

  it('has TAILORING category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.TAILORING.name, 'Tailoring');
  });

  it('has ENCHANTING category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.ENCHANTING.name, 'Enchanting');
  });

  it('has WOODWORKING category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.WOODWORKING.name, 'Woodworking');
  });

  it('has JEWELRY category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.JEWELRY.name, 'Jewelry');
  });

  it('has INSCRIPTION category', () => {
    assert.strictEqual(CRAFTING_CATEGORIES.INSCRIPTION.name, 'Inscription');
  });
});

// ============================================================================
// QUALITY_LEVELS Tests (5 tests)
// ============================================================================

describe('QUALITY_LEVELS', () => {
  it('has POOR quality', () => {
    assert.strictEqual(QUALITY_LEVELS.POOR.multiplier, 0.75);
  });

  it('has NORMAL quality', () => {
    assert.strictEqual(QUALITY_LEVELS.NORMAL.multiplier, 1.0);
  });

  it('has GOOD quality', () => {
    assert.strictEqual(QUALITY_LEVELS.GOOD.multiplier, 1.25);
  });

  it('has EXCELLENT quality', () => {
    assert.strictEqual(QUALITY_LEVELS.EXCELLENT.multiplier, 1.5);
  });

  it('has MASTERWORK quality', () => {
    assert.strictEqual(QUALITY_LEVELS.MASTERWORK.multiplier, 2.0);
  });
});

// ============================================================================
// WORKSTATIONS Tests (4 tests)
// ============================================================================

describe('WORKSTATIONS', () => {
  it('has FORGE workstation', () => {
    assert.strictEqual(WORKSTATIONS.FORGE.name, 'Forge');
    assert.deepStrictEqual(WORKSTATIONS.FORGE.categories, ['SMITHING']);
  });

  it('has ALCHEMY_TABLE workstation', () => {
    assert.strictEqual(WORKSTATIONS.ALCHEMY_TABLE.name, 'Alchemy Table');
  });

  it('has KITCHEN workstation', () => {
    assert.strictEqual(WORKSTATIONS.KITCHEN.name, 'Kitchen');
    assert.deepStrictEqual(WORKSTATIONS.KITCHEN.categories, ['COOKING']);
  });

  it('has ARCANE_ALTAR workstation', () => {
    assert.strictEqual(WORKSTATIONS.ARCANE_ALTAR.name, 'Arcane Altar');
  });
});

// ============================================================================
// createCraftingState Tests (5 tests)
// ============================================================================

describe('createCraftingState', () => {
  it('creates empty known recipes', () => {
    const state = createCraftingState();
    assert.deepStrictEqual(state.knownRecipes, []);
  });

  it('creates empty crafting queue', () => {
    const state = createCraftingState();
    assert.deepStrictEqual(state.craftingQueue, []);
  });

  it('has no active craft', () => {
    const state = createCraftingState();
    assert.strictEqual(state.activeCraft, null);
  });

  it('initializes stats to zero', () => {
    const state = createCraftingState();
    assert.strictEqual(state.stats.totalCrafts, 0);
    assert.strictEqual(state.stats.successfulCrafts, 0);
  });

  it('creates empty skill levels', () => {
    const state = createCraftingState();
    assert.deepStrictEqual(state.skillLevels, {});
  });
});

// ============================================================================
// createRecipe Tests (8 tests)
// ============================================================================

describe('createRecipe', () => {
  it('creates valid recipe', () => {
    const ingredients = [{ itemId: 'iron_ore', quantity: 3 }];
    const output = { itemId: 'iron_bar', quantity: 1 };
    const result = createRecipe('iron_bar_recipe', 'Iron Bar', 'smithing', ingredients, output);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.recipe.name, 'Iron Bar');
  });

  it('validates recipe id', () => {
    const result = createRecipe('', 'Test', 'smithing', [{ itemId: 'a' }], { itemId: 'b' });
    assert.strictEqual(result.success, false);
  });

  it('validates recipe name', () => {
    const result = createRecipe('test', '', 'smithing', [{ itemId: 'a' }], { itemId: 'b' });
    assert.strictEqual(result.success, false);
  });

  it('validates category', () => {
    const result = createRecipe('test', 'Test', 'invalid', [{ itemId: 'a' }], { itemId: 'b' });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid category'));
  });

  it('validates ingredients exist', () => {
    const result = createRecipe('test', 'Test', 'smithing', [], { itemId: 'b' });
    assert.strictEqual(result.success, false);
  });

  it('validates output exists', () => {
    const result = createRecipe('test', 'Test', 'smithing', [{ itemId: 'a' }], null);
    assert.strictEqual(result.success, false);
  });

  it('sets default values', () => {
    const ingredients = [{ itemId: 'iron_ore' }];
    const output = { itemId: 'iron_bar' };
    const result = createRecipe('test', 'Test', 'smithing', ingredients, output);
    assert.strictEqual(result.recipe.requiredLevel, 1);
    assert.strictEqual(result.recipe.craftTime, 1000);
  });

  it('accepts custom options', () => {
    const ingredients = [{ itemId: 'iron_ore' }];
    const output = { itemId: 'iron_bar' };
    const result = createRecipe('test', 'Test', 'smithing', ingredients, output, {
      requiredLevel: 10,
      craftTime: 5000,
      difficulty: 75
    });
    assert.strictEqual(result.recipe.requiredLevel, 10);
    assert.strictEqual(result.recipe.craftTime, 5000);
    assert.strictEqual(result.recipe.difficulty, 75);
  });
});

// ============================================================================
// registerRecipe Tests (4 tests)
// ============================================================================

describe('registerRecipe', () => {
  function makeRecipe() {
    return createRecipe('test', 'Test', 'smithing', [{ itemId: 'a' }], { itemId: 'b' }).recipe;
  }

  it('registers valid recipe', () => {
    const registry = createRecipeRegistry();
    const result = registerRecipe(registry, makeRecipe());
    assert.strictEqual(result.success, true);
    assert.ok(result.registry.recipes['test']);
  });

  it('indexes by category', () => {
    const registry = createRecipeRegistry();
    const result = registerRecipe(registry, makeRecipe());
    assert.deepStrictEqual(result.registry.byCategory['SMITHING'], ['test']);
  });

  it('indexes by output', () => {
    const registry = createRecipeRegistry();
    const result = registerRecipe(registry, makeRecipe());
    assert.deepStrictEqual(result.registry.byOutput['b'], ['test']);
  });

  it('prevents duplicate registration', () => {
    let registry = createRecipeRegistry();
    registry = registerRecipe(registry, makeRecipe()).registry;
    const result = registerRecipe(registry, makeRecipe());
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// learnRecipe Tests (3 tests)
// ============================================================================

describe('learnRecipe', () => {
  it('learns new recipe', () => {
    const state = createCraftingState();
    const result = learnRecipe(state, 'iron_bar');
    assert.strictEqual(result.success, true);
    assert.ok(result.state.knownRecipes.includes('iron_bar'));
  });

  it('prevents learning duplicate', () => {
    let state = createCraftingState();
    state = learnRecipe(state, 'iron_bar').state;
    const result = learnRecipe(state, 'iron_bar');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('already known'));
  });

  it('checks if recipe is known', () => {
    let state = createCraftingState();
    assert.strictEqual(isRecipeKnown(state, 'iron_bar'), false);
    state = learnRecipe(state, 'iron_bar').state;
    assert.strictEqual(isRecipeKnown(state, 'iron_bar'), true);
  });
});

// ============================================================================
// Ingredient Tests (5 tests)
// ============================================================================

describe('Ingredients', () => {
  function makeRecipe() {
    return createRecipe('test', 'Test', 'smithing',
      [{ itemId: 'iron_ore', quantity: 3 }, { itemId: 'coal', quantity: 1 }],
      { itemId: 'iron_bar' }
    ).recipe;
  }

  it('checks has all ingredients', () => {
    const recipe = makeRecipe();
    const inventory = { iron_ore: 5, coal: 2 };
    assert.strictEqual(hasIngredients(recipe, inventory), true);
  });

  it('checks missing ingredients', () => {
    const recipe = makeRecipe();
    const inventory = { iron_ore: 2, coal: 2 };
    assert.strictEqual(hasIngredients(recipe, inventory), false);
  });

  it('gets missing ingredients list', () => {
    const recipe = makeRecipe();
    const inventory = { iron_ore: 1 };
    const missing = getMissingIngredients(recipe, inventory);
    assert.strictEqual(missing.length, 2);
    assert.strictEqual(missing[0].itemId, 'iron_ore');
    assert.strictEqual(missing[0].missing, 2);
  });

  it('handles null recipe', () => {
    assert.strictEqual(hasIngredients(null, {}), false);
    assert.deepStrictEqual(getMissingIngredients(null, {}), []);
  });

  it('handles missing inventory keys', () => {
    const recipe = makeRecipe();
    const inventory = {};
    const missing = getMissingIngredients(recipe, inventory);
    assert.strictEqual(missing.length, 2);
  });
});

// ============================================================================
// Skill Level Tests (4 tests)
// ============================================================================

describe('Skill Levels', () => {
  it('gets skill level (default 0)', () => {
    const state = createCraftingState();
    assert.strictEqual(getSkillLevel(state, 'smithing'), 0);
  });

  it('adds experience and levels up', () => {
    let state = createCraftingState();
    const result = addSkillExperience(state, 'smithing', 250);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newLevel, 2);
    assert.strictEqual(result.leveledUp, true);
  });

  it('validates category', () => {
    const state = createCraftingState();
    const result = addSkillExperience(state, 'invalid', 100);
    assert.strictEqual(result.success, false);
  });

  it('tracks level changes', () => {
    let state = createCraftingState();
    state = addSkillExperience(state, 'ALCHEMY', 150).state;
    assert.strictEqual(getSkillLevel(state, 'alchemy'), 1);
  });
});

// ============================================================================
// Success/Critical Chance Tests (4 tests)
// ============================================================================

describe('Success and Critical Chance', () => {
  function makeRecipe(level = 1, difficulty = 50) {
    return createRecipe('test', 'Test', 'smithing', [{ itemId: 'a' }], { itemId: 'b' }, {
      requiredLevel: level,
      difficulty
    }).recipe;
  }

  it('calculates base success chance', () => {
    const state = createCraftingState();
    const recipe = makeRecipe(1, 50);
    const chance = calculateSuccessChance(state, recipe);
    assert.ok(chance >= 5 && chance <= 99);
  });

  it('increases success with skill level', () => {
    let state = createCraftingState();
    state = addSkillExperience(state, 'smithing', 500).state;
    const recipe = makeRecipe(1, 50);
    const chance = calculateSuccessChance(state, recipe);
    assert.ok(chance > 60);
  });

  it('calculates critical chance', () => {
    const state = createCraftingState();
    const recipe = makeRecipe(1, 50);
    const chance = calculateCriticalChance(state, recipe);
    assert.ok(chance >= 1 && chance <= 25);
  });

  it('returns 0 for null recipe', () => {
    const state = createCraftingState();
    assert.strictEqual(calculateSuccessChance(state, null), 0);
    assert.strictEqual(calculateCriticalChance(state, null), 0);
  });
});

// ============================================================================
// startCrafting Tests (7 tests)
// ============================================================================

describe('startCrafting', () => {
  function setup() {
    let registry = createRecipeRegistry();
    const recipe = createRecipe('iron_bar', 'Iron Bar', 'smithing',
      [{ itemId: 'iron_ore', quantity: 2 }],
      { itemId: 'iron_bar' },
      { requiredLevel: 1, workstation: 'FORGE' }
    ).recipe;
    registry = registerRecipe(registry, recipe).registry;
    let state = createCraftingState();
    state = learnRecipe(state, 'iron_bar').state;
    state = addSkillExperience(state, 'smithing', 100).state; // Get to level 1
    return { state, registry };
  }

  it('starts crafting with valid inputs', () => {
    const { state, registry } = setup();
    const inventory = { iron_ore: 5 };
    const result = startCrafting(state, registry, 'iron_bar', inventory, 'FORGE');
    assert.strictEqual(result.success, true);
    assert.ok(result.state.activeCraft);
  });

  it('validates recipe exists', () => {
    const { state, registry } = setup();
    const result = startCrafting(state, registry, 'nonexistent', {});
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('not found'));
  });

  it('validates recipe is learned', () => {
    let { state, registry } = setup();
    const recipe2 = createRecipe('steel_bar', 'Steel Bar', 'smithing',
      [{ itemId: 'iron_bar' }], { itemId: 'steel_bar' }).recipe;
    registry = registerRecipe(registry, recipe2).registry;
    const result = startCrafting(state, registry, 'steel_bar', { iron_bar: 1 });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('not learned'));
  });

  it('validates skill level', () => {
    let { registry } = setup();
    const recipe2 = createRecipe('master_sword', 'Master Sword', 'smithing',
      [{ itemId: 'steel' }], { itemId: 'sword' }, { requiredLevel: 50 }).recipe;
    registry = registerRecipe(registry, recipe2).registry;
    let state = createCraftingState();
    state = learnRecipe(state, 'master_sword').state;
    const result = startCrafting(state, registry, 'master_sword', { steel: 1 });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('skill level'));
  });

  it('validates workstation', () => {
    const { state, registry } = setup();
    const inventory = { iron_ore: 5 };
    const result = startCrafting(state, registry, 'iron_bar', inventory, 'KITCHEN');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('workstation'));
  });

  it('validates ingredients', () => {
    const { state, registry } = setup();
    const inventory = { iron_ore: 1 };
    const result = startCrafting(state, registry, 'iron_bar', inventory, 'FORGE');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('ingredients'));
  });

  it('prevents multiple active crafts', () => {
    let { state, registry } = setup();
    const inventory = { iron_ore: 10 };
    state = startCrafting(state, registry, 'iron_bar', inventory, 'FORGE').state;
    const result = startCrafting(state, registry, 'iron_bar', inventory, 'FORGE');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Already'));
  });
});

// ============================================================================
// cancelCrafting Tests (2 tests)
// ============================================================================

describe('cancelCrafting', () => {
  it('cancels active craft', () => {
    let state = createCraftingState();
    state = { ...state, activeCraft: { recipeId: 'test' } };
    const result = cancelCrafting(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeCraft, null);
  });

  it('fails with no active craft', () => {
    const state = createCraftingState();
    const result = cancelCrafting(state);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// completeCrafting Tests (6 tests)
// ============================================================================

describe('completeCrafting', () => {
  function setup() {
    let registry = createRecipeRegistry();
    const recipe = createRecipe('iron_bar', 'Iron Bar', 'smithing',
      [{ itemId: 'iron_ore', quantity: 2 }],
      { itemId: 'iron_bar' },
      { craftTime: 100, experienceGain: 20 }
    ).recipe;
    registry = registerRecipe(registry, recipe).registry;
    return registry;
  }

  it('completes successful craft', () => {
    const registry = setup();
    let state = createCraftingState();
    state = {
      ...state,
      activeCraft: {
        recipeId: 'iron_bar',
        startTime: Date.now() - 200,
        endTime: Date.now() - 100,
        successChance: 100,
        criticalChance: 0
      }
    };
    const result = completeCrafting(state, registry, 0.5); // 50% roll
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.craftSuccess, true);
    assert.ok(result.output);
  });

  it('handles failed craft', () => {
    const registry = setup();
    let state = createCraftingState();
    state = {
      ...state,
      activeCraft: {
        recipeId: 'iron_bar',
        startTime: Date.now() - 200,
        endTime: Date.now() - 100,
        successChance: 10,
        criticalChance: 0
      }
    };
    const result = completeCrafting(state, registry, 0.5); // 50% > 10%
    assert.strictEqual(result.craftSuccess, false);
    assert.strictEqual(result.output, null);
  });

  it('handles critical success', () => {
    const registry = setup();
    let state = createCraftingState();
    state = {
      ...state,
      activeCraft: {
        recipeId: 'iron_bar',
        startTime: Date.now() - 200,
        endTime: Date.now() - 100,
        successChance: 100,
        criticalChance: 20
      }
    };
    const result = completeCrafting(state, registry, 0.1); // 10% < 20%
    assert.strictEqual(result.critical, true);
    assert.strictEqual(result.output.quantity, 2); // Double output
  });

  it('updates stats', () => {
    const registry = setup();
    let state = createCraftingState();
    state = {
      ...state,
      activeCraft: {
        recipeId: 'iron_bar',
        startTime: Date.now() - 200,
        endTime: Date.now() - 100,
        successChance: 100,
        criticalChance: 0
      }
    };
    const result = completeCrafting(state, registry, 0.5);
    assert.strictEqual(result.state.stats.totalCrafts, 1);
    assert.strictEqual(result.state.stats.successfulCrafts, 1);
  });

  it('fails if not complete', () => {
    const registry = setup();
    let state = createCraftingState();
    state = {
      ...state,
      activeCraft: {
        recipeId: 'iron_bar',
        startTime: Date.now(),
        endTime: Date.now() + 10000,
        successChance: 100,
        criticalChance: 0
      }
    };
    const result = completeCrafting(state, registry);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('not complete'));
  });

  it('fails with no active craft', () => {
    const registry = setup();
    const state = createCraftingState();
    const result = completeCrafting(state, registry);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Queue Tests (5 tests)
// ============================================================================

describe('Crafting Queue', () => {
  it('queues single craft', () => {
    const state = createCraftingState();
    const result = queueCrafting(state, 'iron_bar', 1);
    assert.strictEqual(result.craftingQueue.length, 1);
    assert.strictEqual(result.craftingQueue[0].recipeId, 'iron_bar');
  });

  it('queues multiple crafts', () => {
    const state = createCraftingState();
    const result = queueCrafting(state, 'iron_bar', 3);
    assert.strictEqual(result.craftingQueue.length, 3);
  });

  it('clears queue', () => {
    let state = createCraftingState();
    state = queueCrafting(state, 'iron_bar', 5);
    const result = clearQueue(state);
    assert.strictEqual(result.craftingQueue.length, 0);
  });

  it('removes from queue', () => {
    let state = createCraftingState();
    state = queueCrafting(state, 'iron_bar', 3);
    const result = removeFromQueue(state, 1);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.craftingQueue.length, 2);
  });

  it('validates queue index', () => {
    const state = createCraftingState();
    const result = removeFromQueue(state, 0);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Progress Tests (3 tests)
// ============================================================================

describe('Crafting Progress', () => {
  it('returns inactive when no craft', () => {
    const state = createCraftingState();
    const progress = getCraftingProgress(state);
    assert.strictEqual(progress.active, false);
    assert.strictEqual(progress.progress, 0);
  });

  it('calculates progress percentage', () => {
    let state = createCraftingState();
    const startTime = Date.now() - 500;
    state = {
      ...state,
      activeCraft: {
        recipeId: 'test',
        startTime,
        endTime: startTime + 1000,
        successChance: 80
      }
    };
    const progress = getCraftingProgress(state);
    assert.strictEqual(progress.active, true);
    assert.ok(progress.progress >= 40 && progress.progress <= 60);
  });

  it('caps progress at 100', () => {
    let state = createCraftingState();
    state = {
      ...state,
      activeCraft: {
        recipeId: 'test',
        startTime: Date.now() - 2000,
        endTime: Date.now() - 1000,
        successChance: 80
      }
    };
    const progress = getCraftingProgress(state);
    assert.strictEqual(progress.progress, 100);
  });
});

// ============================================================================
// Discovery Tests (3 tests)
// ============================================================================

describe('Recipe Discovery', () => {
  function setup() {
    let registry = createRecipeRegistry();
    const recipe = createRecipe('secret_potion', 'Secret Potion', 'alchemy',
      [{ itemId: 'herb_a' }, { itemId: 'herb_b' }],
      { itemId: 'potion' },
      { discoverable: true }
    ).recipe;
    registry = registerRecipe(registry, recipe).registry;
    return registry;
  }

  it('discovers matching recipe', () => {
    const registry = setup();
    const state = createCraftingState();
    const result = discoverRecipe(state, registry, ['herb_a', 'herb_b']);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.discovered.id, 'secret_potion');
  });

  it('fails with wrong ingredients', () => {
    const registry = setup();
    const state = createCraftingState();
    const result = discoverRecipe(state, registry, ['herb_a', 'herb_c']);
    assert.strictEqual(result.success, false);
  });

  it('tracks discoveries', () => {
    const registry = setup();
    const state = createCraftingState();
    const result = discoverRecipe(state, registry, ['herb_a', 'herb_b']);
    assert.strictEqual(result.state.discoveries.length, 1);
    assert.ok(result.state.knownRecipes.includes('secret_potion'));
  });
});

// ============================================================================
// Utility Tests (9 tests)
// ============================================================================

describe('Utility Functions', () => {
  function setup() {
    let registry = createRecipeRegistry();
    const recipe1 = createRecipe('iron_bar', 'Iron Bar', 'smithing',
      [{ itemId: 'iron_ore', quantity: 2 }], { itemId: 'iron_bar' }).recipe;
    const recipe2 = createRecipe('steel_bar', 'Steel Bar', 'smithing',
      [{ itemId: 'iron_bar' }], { itemId: 'steel_bar' }, { requiredLevel: 5 }).recipe;
    registry = registerRecipe(registry, recipe1).registry;
    registry = registerRecipe(registry, recipe2).registry;
    let state = createCraftingState();
    state = learnRecipe(state, 'iron_bar').state;
    state = learnRecipe(state, 'steel_bar').state;
    return { state, registry };
  }

  it('gets known recipes', () => {
    const { state, registry } = setup();
    const recipes = getKnownRecipes(state, registry);
    assert.strictEqual(recipes.length, 2);
  });

  it('gets recipes by category', () => {
    const { state, registry } = setup();
    const recipes = getRecipesByCategory(state, registry, 'smithing');
    assert.strictEqual(recipes.length, 2);
  });

  it('gets craftable recipes', () => {
    let { state, registry } = setup();
    state = addSkillExperience(state, 'smithing', 100).state; // Get to level 1
    const inventory = { iron_ore: 5 };
    const craftable = getCraftableRecipes(state, registry, inventory);
    assert.strictEqual(craftable.length, 1);
    assert.strictEqual(craftable[0].id, 'iron_bar');
  });

  it('gets crafting stats', () => {
    let { state } = setup();
    state = { ...state, stats: { totalCrafts: 10, successfulCrafts: 8, criticalCrafts: 2, failedCrafts: 2 } };
    const stats = getCraftingStats(state);
    assert.strictEqual(stats.successRate, 80);
    assert.strictEqual(stats.criticalRate, 25);
  });

  it('gets category info', () => {
    const info = getCategoryInfo('smithing');
    assert.strictEqual(info.name, 'Smithing');
  });

  it('returns null for invalid category', () => {
    const info = getCategoryInfo('invalid');
    assert.strictEqual(info, null);
  });

  it('gets quality info', () => {
    const info = getQualityInfo('excellent');
    assert.strictEqual(info.multiplier, 1.5);
  });

  it('gets workstation info', () => {
    const info = getWorkstationInfo('forge');
    assert.strictEqual(info.name, 'Forge');
  });

  it('checks workstation compatibility', () => {
    assert.strictEqual(canUseWorkstation('forge', 'smithing'), true);
    assert.strictEqual(canUseWorkstation('forge', 'cooking'), false);
    assert.strictEqual(canUseWorkstation('kitchen', 'cooking'), true);
  });
});
