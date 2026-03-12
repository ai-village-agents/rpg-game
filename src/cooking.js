import { addItemToInventory, removeItemFromInventory, getItemCount } from './items.js';

export const COOKING_INGREDIENTS = {
  goldenWheat: {
    id: 'goldenWheat',
    name: 'Golden Wheat',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Common',
    description: 'Sun-kissed grain from the eastern fields.',
    value: 3
  },
  wildMushroom: {
    id: 'wildMushroom',
    name: 'Wild Mushroom',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Common',
    description: 'A plump forest mushroom with earthy aroma.',
    value: 4
  },
  dragonPepper: {
    id: 'dragonPepper',
    name: 'Dragon Pepper',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Uncommon',
    description: 'Fiery red pepper that burns the tongue.',
    value: 8
  },
  moonMilk: {
    id: 'moonMilk',
    name: 'Moon Milk',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Uncommon',
    description: 'Silvery liquid collected under a full moon.',
    value: 10
  },
  abyssalSalt: {
    id: 'abyssalSalt',
    name: 'Abyssal Salt',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Rare',
    description: 'Dark crystalline salt harvested from deep caverns.',
    value: 15
  },
  fabergeSpice: {
    id: 'fabergeSpice',
    name: 'Fabergé Spice',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Epic',
    description:
      'An ornate, jewel-toned spice of extraordinary rarity. Prized by master chefs across the realm.',
    value: 50
  },
  starHoney: {
    id: 'starHoney',
    name: 'Star Honey',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Rare',
    description: 'Golden honey infused with celestial energy.',
    value: 20
  },
  frostBerries: {
    id: 'frostBerries',
    name: 'Frost Berries',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Uncommon',
    description: 'Icy blue berries that never thaw.',
    value: 7
  },
  sunflowerOil: {
    id: 'sunflowerOil',
    name: 'Sunflower Oil',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Common',
    description: 'Pressed from giant sunflowers, a basic cooking staple.',
    value: 3
  },
  thunderRoot: {
    id: 'thunderRoot',
    name: 'Thunder Root',
    type: 'ingredient',
    category: 'cooking',
    rarity: 'Rare',
    description: 'A crackling tuber charged with lightning essence.',
    value: 18
  }
};

export const COOKING_RECIPES = [
  {
    id: 'fieldBread',
    name: 'Field Bread',
    description: 'A hearty loaf that restores vigor.',
    ingredients: [
      { id: 'goldenWheat', qty: 2 },
      { id: 'sunflowerOil', qty: 1 }
    ],
    result: { type: 'consumable', heal: 25, name: 'Field Bread' },
    difficulty: 1,
    requiredLevel: 1
  },
  {
    id: 'mushroomStew',
    name: 'Mushroom Stew',
    description: 'Thick savory stew that boosts defense.',
    ingredients: [
      { id: 'wildMushroom', qty: 2 },
      { id: 'abyssalSalt', qty: 1 }
    ],
    result: { type: 'consumable', buff: { def: 5, duration: 3 }, name: 'Mushroom Stew' },
    difficulty: 2,
    requiredLevel: 3
  },
  {
    id: 'sunnyDelight',
    name: 'Sunny Delight',
    description:
      'A warm golden drink that fills you with radiant energy. Best served easy, over a morning fire.',
    ingredients: [
      { id: 'starHoney', qty: 1 },
      { id: 'moonMilk', qty: 1 },
      { id: 'sunflowerOil', qty: 1 }
    ],
    result: { type: 'consumable', buff: { atk: 8, spd: 4, duration: 5 }, name: 'Sunny Delight' },
    difficulty: 3,
    requiredLevel: 5
  },
  {
    id: 'frostTonic',
    name: 'Frost Tonic',
    description: 'Chilling elixir that grants ice resistance.',
    ingredients: [
      { id: 'frostBerries', qty: 3 },
      { id: 'moonMilk', qty: 1 }
    ],
    result: {
      type: 'consumable',
      buff: { def: 3, iceResist: 50, duration: 4 },
      name: 'Frost Tonic'
    },
    difficulty: 2,
    requiredLevel: 4
  },
  {
    id: 'dragonfireSoup',
    name: 'Dragonfire Soup',
    description: 'Scorching broth that empowers fire attacks.',
    ingredients: [
      { id: 'dragonPepper', qty: 2 },
      { id: 'thunderRoot', qty: 1 },
      { id: 'abyssalSalt', qty: 1 }
    ],
    result: {
      type: 'consumable',
      buff: { atk: 10, fireBoost: 30, duration: 4 },
      name: 'Dragonfire Soup'
    },
    difficulty: 3,
    requiredLevel: 7
  },
  {
    id: 'humptysFortuneStew',
    name: "Humpty's Fortune Stew",
    description:
      'A legendary recipe said to have been devised by the great chef Humpty, who had a great fall from grace before rediscovering his passion. Restores full HP and grants luck.',
    ingredients: [
      { id: 'fabergeSpice', qty: 1 },
      { id: 'starHoney', qty: 1 },
      { id: 'goldenWheat', qty: 2 },
      { id: 'moonMilk', qty: 1 }
    ],
    result: {
      type: 'consumable',
      heal: 999,
      buff: { luck: 20, duration: 10 },
      name: "Humpty's Fortune Stew"
    },
    difficulty: 5,
    requiredLevel: 10
  },
  {
    id: 'thunderBiscuit',
    name: 'Thunder Biscuit',
    description: 'Crackles with electric energy when bitten.',
    ingredients: [
      { id: 'thunderRoot', qty: 1 },
      { id: 'goldenWheat', qty: 1 }
    ],
    result: { type: 'consumable', buff: { spd: 6, duration: 3 }, name: 'Thunder Biscuit' },
    difficulty: 2,
    requiredLevel: 4
  },
  {
    id: 'overEasyElixir',
    name: 'Over-Easy Elixir',
    description:
      'A smooth, balanced potion that slides down easy. Grants a relaxed focus in battle.',
    ingredients: [
      { id: 'sunflowerOil', qty: 2 },
      { id: 'starHoney', qty: 1 },
      { id: 'frostBerries', qty: 1 }
    ],
    result: {
      type: 'consumable',
      buff: { atk: 4, def: 4, spd: 4, duration: 6 },
      name: 'Over-Easy Elixir'
    },
    difficulty: 3,
    requiredLevel: 6
  }
];

export function createCookingState() {
  return {
    discoveredRecipes: [],
    cookingLevel: 1,
    cookCount: {}
  };
}

export function canCook(inventory, recipe) {
  if (!recipe || !Array.isArray(recipe.ingredients)) return false;
  const safeInventory = inventory || {};
  return recipe.ingredients.every(({ id, qty }) => getItemCount(safeInventory, id) >= qty);
}

export function cookRecipe(state, inventory, recipeId) {
  const recipe = COOKING_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) {
    return { success: false, message: 'Missing ingredients' };
  }
  const safeInventory = inventory || {};
  if (!canCook(safeInventory, recipe)) {
    return { success: false, message: 'Missing ingredients' };
  }

  let updatedInventory = { ...safeInventory };
  recipe.ingredients.forEach(({ id, qty }) => {
    updatedInventory = removeItemFromInventory(updatedInventory, id, qty);
  });
  updatedInventory = addItemToInventory(updatedInventory, recipe.id, 1);

  const newState = {
    ...state,
    cookCount: { ...(state?.cookCount || {}) }
  };
  newState.cookCount[recipe.id] = (newState.cookCount[recipe.id] || 0) + 1;

  const totalCooks = Object.values(newState.cookCount).reduce((sum, count) => sum + count, 0);
  newState.cookingLevel = 1 + Math.floor(totalCooks / 5);

  return {
    success: true,
    state: newState,
    inventory: updatedInventory,
    message: `Cooked ${recipe.name}!`,
    item: recipe.result
  };
}

export function getCookingDrops(areaName, rng = Math.random) {
  const drops = [];
  const addDrop = (ingredientId, chance) => {
    if (rng() < chance) {
      const ingredient = COOKING_INGREDIENTS[ingredientId];
      if (ingredient) {
        drops.push({ ingredientId, quantity: 1, name: ingredient.name });
      }
    }
  };

  switch (areaName) {
    case 'Eastern Fields':
    case 'Village Square':
      addDrop('goldenWheat', 0.3);
      addDrop('sunflowerOil', 0.3);
      break;
    case 'Northwest Grove':
      addDrop('wildMushroom', 0.25);
      addDrop('frostBerries', 0.25);
      break;
    case 'Northeast Ridge':
      addDrop('thunderRoot', 0.2);
      addDrop('dragonPepper', 0.2);
      break;
    case 'Southwest Marsh':
      addDrop('abyssalSalt', 0.2);
      addDrop('moonMilk', 0.2);
      break;
    case 'Southern Road':
      addDrop('starHoney', 0.15);
      break;
    case 'Southeast Dock':
      addDrop('fabergeSpice', 0.05);
      break;
    default:
      break;
  }

  return drops;
}
