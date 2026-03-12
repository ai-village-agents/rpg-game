import {
  COOKING_INGREDIENTS,
  COOKING_RECIPES,
  createCookingState,
  canCook,
  cookRecipe,
  getCookingDrops,
} from '../src/cooking.js';

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    passed += 1;
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.error(`❌ ${name}`);
  }
}

assert(
  Object.keys(COOKING_INGREDIENTS).length === 10,
  'COOKING_INGREDIENTS has 10 ingredients',
);

assert(
  COOKING_RECIPES.length === 8,
  'COOKING_RECIPES has 8 recipes',
);

assert(
  Object.values(COOKING_INGREDIENTS).every(
    (ingredient) =>
      ingredient.id &&
      ingredient.name &&
      ingredient.type &&
      ingredient.category &&
      ingredient.rarity &&
      ingredient.description &&
      ingredient.value !== undefined,
  ),
  'Each ingredient has required fields',
);

assert(
  COOKING_RECIPES.every(
    (recipe) =>
      recipe.id &&
      recipe.name &&
      recipe.description &&
      recipe.ingredients &&
      recipe.result &&
      recipe.difficulty &&
      recipe.requiredLevel !== undefined,
  ),
  'Each recipe has required fields',
);

const initialState = createCookingState();
assert(
  Array.isArray(initialState.discoveredRecipes) &&
    initialState.cookingLevel === 1 &&
    typeof initialState.cookCount === 'object',
  'createCookingState returns valid initial state',
);

assert(
  canCook({}, COOKING_RECIPES[0]) === false,
  'canCook returns false with empty inventory',
);

assert(
  canCook({ goldenWheat: 2, sunflowerOil: 1 }, COOKING_RECIPES[0]) === true,
  'canCook returns true with sufficient ingredients',
);

assert(
  canCook({ goldenWheat: 1, sunflowerOil: 1 }, COOKING_RECIPES[0]) === false,
  'canCook returns false with insufficient ingredients',
);

assert(
  canCook(null, COOKING_RECIPES[0]) === false,
  'canCook handles null inventory',
);

assert(
  canCook({}, null) === false,
  'canCook handles null recipe',
);

assert(
  cookRecipe({}, {}, 'nonexistent').success === false,
  'cookRecipe returns failure for unknown recipe',
);

assert(
  cookRecipe(createCookingState(), {}, 'fieldBread').success === false,
  'cookRecipe returns failure with missing ingredients',
);

const successCook = cookRecipe(
  createCookingState(),
  { goldenWheat: 2, sunflowerOil: 1 },
  'fieldBread',
);

assert(
  successCook.success === true,
  'cookRecipe succeeds with correct ingredients',
);

assert(
  (successCook.inventory.goldenWheat === undefined || successCook.inventory.goldenWheat === 0) &&
    (successCook.inventory.sunflowerOil === undefined || successCook.inventory.sunflowerOil === 0),
  'cookRecipe removes ingredients from inventory',
);

assert(
  successCook.inventory.fieldBread === 1,
  'cookRecipe adds result item to inventory',
);

assert(
  successCook.state.cookCount.fieldBread === 1,
  'cookRecipe increments cookCount',
);

let levelState = createCookingState();
let levelInventory = { goldenWheat: 2, sunflowerOil: 1 };
for (let i = 0; i < 5; i += 1) {
  const result = cookRecipe(levelState, levelInventory, 'fieldBread');
  levelState = result.state;
  levelInventory = result.inventory;
  levelInventory.goldenWheat = (levelInventory.goldenWheat || 0) + 2;
  levelInventory.sunflowerOil = (levelInventory.sunflowerOil || 0) + 1;
}

assert(
  levelState.cookingLevel === 2,
  'cookRecipe increases cookingLevel after 5 cooks',
);

assert(
  Array.isArray(getCookingDrops('Eastern Fields')),
  'getCookingDrops returns array',
);

const easternDrops = getCookingDrops('Eastern Fields', () => 0);
assert(
  easternDrops.length === 2 &&
    easternDrops.some(d => d.ingredientId === 'goldenWheat') &&
    easternDrops.some(d => d.ingredientId === 'sunflowerOil'),
  'getCookingDrops returns drops for valid area with rng=0',
);

assert(
  getCookingDrops('Eastern Fields', () => 1).length === 0,
  'getCookingDrops returns empty for valid area with rng=1',
);

assert(
  getCookingDrops('Unknown Area').length === 0,
  'getCookingDrops returns empty for unknown area',
);

assert(
  getCookingDrops('Southeast Dock', () => 0).some(d => d.ingredientId === 'fabergeSpice'),
  'getCookingDrops Southeast Dock drops fabergeSpice with rng=0',
);

assert(
  COOKING_RECIPES.every((recipe) =>
    recipe.ingredients.every((ingredient) => COOKING_INGREDIENTS[ingredient.id]),
  ),
  'All recipe ingredient IDs exist in COOKING_INGREDIENTS',
);

const recipeIds = COOKING_RECIPES.map((recipe) => recipe.id);
assert(
  recipeIds.length === new Set(recipeIds).size,
  'Recipes have unique IDs',
);

const ingredientIds = Object.values(COOKING_INGREDIENTS).map((ingredient) => ingredient.id);
assert(
  ingredientIds.length === new Set(ingredientIds).size,
  'Ingredients have unique IDs',
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
