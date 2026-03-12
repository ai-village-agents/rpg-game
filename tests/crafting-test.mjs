/**
 * Crafting System Tests
 */

import assert from 'node:assert';
import {
  createCraftingState,
  getAllItems,
  lookupItem,
  discoverRecipe,
  getAvailableRecipes,
  canCraftRecipe,
  craftItem,
  getRecipeById,
  getRecipesByCategory,
  getCraftingMaterialDrops,
} from '../src/crafting.js';
import { recipes, craftingMaterials, craftedItems } from '../src/data/recipes.js';
import { items } from '../src/data/items.js';
import { addItemToInventory } from '../src/items.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name} - ${err.message}`);
  }
}

function makeState(overrides = {}) {
  return {
    player: { level: 5, inventory: {}, ...(overrides.player || {}) },
    crafting: createCraftingState(),
    ...(overrides),
  };
}

console.log('\n=== Crafting System Tests ===\n');

// --- createCraftingState ---
console.log('-- createCraftingState --');

test('returns object with discoveredRecipes array', () => {
  const s = createCraftingState();
  assert.ok(Array.isArray(s.discoveredRecipes));
  assert.strictEqual(s.discoveredRecipes.length, 0);
});

test('returns object with empty craftCount', () => {
  const s = createCraftingState();
  assert.deepStrictEqual(s.craftCount, {});
});

// --- getAllItems ---
console.log('-- getAllItems --');

test('returns combined items from all sources', () => {
  const all = getAllItems();
  assert.ok(Object.keys(all).length >= 30);
});

test('includes base items', () => {
  const all = getAllItems();
  assert.ok(all['potion'], 'should have potion');
});

test('includes crafting materials', () => {
  const all = getAllItems();
  assert.ok(all['herbBundle'], 'should have herbBundle');
  assert.ok(all['ironOre'], 'should have ironOre');
});

test('includes crafted items', () => {
  const all = getAllItems();
  assert.ok(all['superPotion'], 'should have superPotion');
  assert.ok(all['steelSword'], 'should have steelSword');
});

// --- lookupItem ---
console.log('-- lookupItem --');

test('looks up base items', () => {
  const item = lookupItem('potion');
  assert.ok(item);
  assert.strictEqual(item.name, 'Healing Potion');
});

test('looks up crafting materials', () => {
  const item = lookupItem('ironOre');
  assert.ok(item);
  assert.strictEqual(item.name, 'Iron Ore');
});

test('looks up crafted items', () => {
  const item = lookupItem('steelSword');
  assert.ok(item);
  assert.strictEqual(item.name, 'Steel Sword');
});

test('returns null for unknown items', () => {
  assert.strictEqual(lookupItem('nonexistent'), null);
});

// --- getRecipeById ---
console.log('-- getRecipeById --');

test('finds recipe by full id', () => {
  const r = getRecipeById('recipe_superPotion');
  assert.ok(r);
  assert.strictEqual(r.name, 'Super Potion');
});

test('returns null for nonexistent recipe', () => {
  assert.strictEqual(getRecipeById('recipe_nonexistent'), null);
});

test('all recipes have required fields', () => {
  for (const recipe of recipes) {
    assert.ok(recipe.id, `recipe missing id`);
    assert.ok(recipe.name, `recipe ${recipe.id} missing name`);
    assert.ok(recipe.ingredients, `recipe ${recipe.id} missing ingredients`);
    assert.ok(recipe.result, `recipe ${recipe.id} missing result`);
    assert.ok(recipe.category, `recipe ${recipe.id} missing category`);
  }
});

// --- getRecipesByCategory ---
console.log('-- getRecipesByCategory --');

test('filters by weapon category', () => {
  const weapons = getRecipesByCategory('weapon');
  assert.ok(weapons.length >= 2);
  weapons.forEach(r => assert.strictEqual(r.category, 'weapon'));
});

test('filters by consumable category', () => {
  const consumables = getRecipesByCategory('consumable');
  assert.ok(consumables.length >= 3);
  consumables.forEach(r => assert.strictEqual(r.category, 'consumable'));
});

test('returns empty for unknown category', () => {
  assert.strictEqual(getRecipesByCategory('mythical').length, 0);
});

// --- discoverRecipe ---
console.log('-- discoverRecipe --');

test('discovers a valid recipe', () => {
  const state = makeState();
  const res = discoverRecipe(state, 'recipe_superPotion');
  assert.ok(res.success);
  assert.ok(state.crafting.discoveredRecipes.includes('recipe_superPotion'));
});

test('prevents duplicate discovery', () => {
  const state = makeState();
  discoverRecipe(state, 'recipe_superPotion');
  const res2 = discoverRecipe(state, 'recipe_superPotion');
  assert.strictEqual(res2.success, false);
  assert.ok(res2.message.includes('already discovered'));
});

test('fails for invalid recipe id', () => {
  const state = makeState();
  const res = discoverRecipe(state, 'recipe_nonexistent');
  assert.strictEqual(res.success, false);
});

test('fails for empty recipe id', () => {
  const state = makeState();
  const res = discoverRecipe(state, '');
  assert.strictEqual(res.success, false);
});

test('creates crafting state if missing', () => {
  const state = { player: { level: 1, inventory: {} } };
  discoverRecipe(state, 'recipe_superPotion');
  assert.ok(state.crafting);
  assert.ok(state.crafting.discoveredRecipes.includes('recipe_superPotion'));
});

// --- getAvailableRecipes ---
console.log('-- getAvailableRecipes --');

test('returns empty when nothing discovered', () => {
  const state = makeState();
  const available = getAvailableRecipes(state);
  assert.strictEqual(available.length, 0);
});

test('returns discovered recipes with canCraft info', () => {
  const state = makeState();
  discoverRecipe(state, 'recipe_superPotion');
  const available = getAvailableRecipes(state);
  assert.strictEqual(available.length, 1);
  assert.strictEqual(available[0].id, 'recipe_superPotion');
  assert.strictEqual(typeof available[0].canCraft, 'boolean');
});

test('canCraft is false when missing ingredients', () => {
  const state = makeState();
  discoverRecipe(state, 'recipe_superPotion');
  const available = getAvailableRecipes(state);
  assert.strictEqual(available[0].canCraft, false);
  assert.ok(available[0].missingIngredients.length > 0);
});

// --- canCraftRecipe ---
console.log('-- canCraftRecipe --');

test('returns false for undiscovered recipe', () => {
  const state = makeState();
  const result = canCraftRecipe(state, 'recipe_superPotion');
  assert.strictEqual(result.canCraft, false);
  assert.ok(result.reason.includes('not discovered'));
});

test('returns false for nonexistent recipe', () => {
  const result = canCraftRecipe(makeState(), 'recipe_fake');
  assert.strictEqual(result.canCraft, false);
});

test('returns false when missing ingredients', () => {
  const state = makeState();
  discoverRecipe(state, 'recipe_superPotion');
  const result = canCraftRecipe(state, 'recipe_superPotion');
  assert.strictEqual(result.canCraft, false);
  assert.ok(result.missingIngredients.length > 0);
});

test('returns false when level too low', () => {
  const state = makeState({ player: { level: 1, inventory: {} } });
  // Find a recipe that requires level > 1
  const highLvlRecipe = recipes.find(r => r.requiredLevel > 1);
  if (highLvlRecipe) {
    discoverRecipe(state, highLvlRecipe.id);
    // Add all ingredients
    for (const ing of highLvlRecipe.ingredients) {
      state.player.inventory = addItemToInventory(state.player.inventory, ing.itemId, ing.quantity);
    }
    const result = canCraftRecipe(state, highLvlRecipe.id);
    assert.strictEqual(result.canCraft, false);
    assert.ok(result.reason.includes('level'));
  }
});

test('returns true when all conditions met', () => {
  const state = makeState({ player: { level: 10, inventory: {} } });
  const recipe = recipes[0]; // superPotion
  discoverRecipe(state, recipe.id);
  for (const ing of recipe.ingredients) {
    state.player.inventory = addItemToInventory(state.player.inventory, ing.itemId, ing.quantity);
  }
  const result = canCraftRecipe(state, recipe.id);
  assert.strictEqual(result.canCraft, true);
  assert.strictEqual(result.reason, null);
});

// --- craftItem ---
console.log('-- craftItem --');

test('crafts item successfully', () => {
  const state = makeState({ player: { level: 10, inventory: {} } });
  const recipe = recipes[0];
  discoverRecipe(state, recipe.id);
  for (const ing of recipe.ingredients) {
    state.player.inventory = addItemToInventory(state.player.inventory, ing.itemId, ing.quantity);
  }
  const result = craftItem(state, recipe.id);
  assert.ok(result.success);
  assert.ok(result.message.includes('Crafted'));
  assert.ok(result.item);
});

test('removes ingredients after crafting', () => {
  const state = makeState({ player: { level: 10, inventory: {} } });
  const recipe = recipes[0];
  discoverRecipe(state, recipe.id);
  for (const ing of recipe.ingredients) {
    state.player.inventory = addItemToInventory(state.player.inventory, ing.itemId, ing.quantity);
  }
  craftItem(state, recipe.id);
  // After crafting, ingredients should be consumed
  for (const ing of recipe.ingredients) {
    // Check inventory no longer has the ingredient qty
    const count = state.player.inventory[ing.itemId] || 0;
    assert.ok(count < ing.quantity, `${ing.itemId} should be consumed`);
  }
});

test('adds result item to inventory', () => {
  const state = makeState({ player: { level: 10, inventory: {} } });
  const recipe = recipes[0];
  discoverRecipe(state, recipe.id);
  for (const ing of recipe.ingredients) {
    state.player.inventory = addItemToInventory(state.player.inventory, ing.itemId, ing.quantity);
  }
  craftItem(state, recipe.id);
  const resultId = recipe.result.itemId;
  const resultQty = recipe.result.quantity || 1;
  assert.ok(state.player.inventory[resultId] >= resultQty);
});

test('increments craftCount', () => {
  const state = makeState({ player: { level: 10, inventory: {} } });
  const recipe = recipes[0];
  discoverRecipe(state, recipe.id);
  for (const ing of recipe.ingredients) {
    state.player.inventory = addItemToInventory(state.player.inventory, ing.itemId, ing.quantity * 3);
  }
  craftItem(state, recipe.id);
  assert.strictEqual(state.crafting.craftCount[recipe.id], 1);
  craftItem(state, recipe.id);
  assert.strictEqual(state.crafting.craftCount[recipe.id], 2);
});

test('fails when cannot craft', () => {
  const state = makeState();
  const result = craftItem(state, 'recipe_superPotion');
  assert.strictEqual(result.success, false);
});

// --- getCraftingMaterialDrops ---
console.log('-- getCraftingMaterialDrops --');

test('returns array', () => {
  const drops = getCraftingMaterialDrops(1);
  assert.ok(Array.isArray(drops));
});

test('drops have materialId and quantity', () => {
  // Use a seeded rng that always returns 0 (always drops)
  const drops = getCraftingMaterialDrops(1, () => 0);
  assert.ok(drops.length > 0);
  for (const d of drops) {
    assert.ok(d.materialId);
    assert.strictEqual(d.quantity, 1);
  }
});

test('low-level enemies drop basic materials only', () => {
  const drops = getCraftingMaterialDrops(1, () => 0);
  const ids = drops.map(d => d.materialId);
  assert.ok(ids.includes('herbBundle'));
  assert.ok(ids.includes('ironOre'));
  assert.ok(!ids.includes('dragonScale'));
  assert.ok(!ids.includes('ancientRune'));
});

test('mid-level enemies drop additional materials', () => {
  const drops = getCraftingMaterialDrops(5, () => 0);
  const ids = drops.map(d => d.materialId);
  assert.ok(ids.includes('arcaneEssence'));
  assert.ok(ids.includes('enchantedThread'));
});

test('high-level enemies drop rare materials', () => {
  const drops = getCraftingMaterialDrops(8, () => 0);
  const ids = drops.map(d => d.materialId);
  assert.ok(ids.includes('dragonScale'));
  assert.ok(ids.includes('shadowShard'));
});

test('max-level enemies drop all materials', () => {
  const drops = getCraftingMaterialDrops(10, () => 0);
  const ids = drops.map(d => d.materialId);
  assert.ok(ids.includes('ancientRune'));
  assert.ok(ids.includes('infernalFeather'));
});

test('no drops with high rng', () => {
  const drops = getCraftingMaterialDrops(10, () => 0.99);
  assert.strictEqual(drops.length, 0);
});

test('handles invalid enemy level gracefully', () => {
  const drops = getCraftingMaterialDrops(0, () => 0);
  assert.ok(Array.isArray(drops));
  const drops2 = getCraftingMaterialDrops(-5, () => 0);
  assert.ok(Array.isArray(drops2));
});

// --- Data integrity ---
console.log('-- Data Integrity --');

test('all recipe ingredients reference valid items', () => {
  const allItems = getAllItems();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      assert.ok(allItems[ing.itemId], `Recipe ${recipe.id} references unknown item: ${ing.itemId}`);
    }
  }
});

test('all recipe results reference valid crafted items', () => {
  const allItems = getAllItems();
  for (const recipe of recipes) {
    assert.ok(allItems[recipe.result.itemId], `Recipe ${recipe.id} produces unknown item: ${recipe.result.itemId}`);
  }
});

test('recipe ids are unique', () => {
  const ids = recipes.map(r => r.id);
  const unique = new Set(ids);
  assert.strictEqual(ids.length, unique.size);
});

test('crafting material ids are unique', () => {
  const ids = Object.keys(craftingMaterials);
  const unique = new Set(ids);
  assert.strictEqual(ids.length, unique.size);
});

test('crafted item ids are unique', () => {
  const ids = Object.keys(craftedItems);
  const unique = new Set(ids);
  assert.strictEqual(ids.length, unique.size);
});

test('no id collisions between item sources', () => {
  const baseIds = new Set(Object.keys(items));
  const matIds = new Set(Object.keys(craftingMaterials));
  const craftIds = new Set(Object.keys(craftedItems));
  for (const id of matIds) {
    assert.ok(!baseIds.has(id), `Material ${id} collides with base items`);
  }
  for (const id of craftIds) {
    assert.ok(!baseIds.has(id), `Crafted item ${id} collides with base items`);
    assert.ok(!matIds.has(id), `Crafted item ${id} collides with materials`);
  }
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
