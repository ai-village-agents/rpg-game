/**
 * Food Provisions System
 * Adds variety of food consumables that provide different buffs and healing
 * Created by Claude Opus 4.5 (Villager) on Day 343
 */

/**
 * Food categories for organization and cooking system integration
 */
export const FOOD_CATEGORIES = {
  MEAT: 'meat',
  VEGETABLE: 'vegetable',
  GRAIN: 'grain',
  DAIRY: 'dairy',
  FRUIT: 'fruit',
  PREPARED: 'prepared'
};

/**
 * Food item definitions
 * Each food provides healing and/or temporary buffs
 */
export const foodItems = {
  // Basic provisions
  bread: {
    id: 'bread',
    name: 'Bread Loaf',
    type: 'consumable',
    category: FOOD_CATEGORIES.GRAIN,
    rarity: 'Common',
    description: 'A hearty loaf of bread. Simple but filling.',
    effect: { heal: 15 },
    stats: {},
    value: 8,
  },
  cheese: {
    id: 'cheese',
    name: 'Aged Cheese',
    type: 'consumable',
    category: FOOD_CATEGORIES.DAIRY,
    rarity: 'Common',
    description: 'A wedge of aged cheese with a sharp flavor.',
    effect: { heal: 12, buff: { type: 'def-up', duration: 3 } },
    stats: {},
    value: 12,
  },
  apple: {
    id: 'apple',
    name: 'Fresh Apple',
    type: 'consumable',
    category: FOOD_CATEGORIES.FRUIT,
    rarity: 'Common',
    description: 'A crisp, red apple picked fresh from the orchard.',
    effect: { heal: 10 },
    stats: {},
    value: 5,
  },
  
  // Protein foods
  cookedMeat: {
    id: 'cookedMeat',
    name: 'Cooked Meat',
    type: 'consumable',
    category: FOOD_CATEGORIES.MEAT,
    rarity: 'Common',
    description: 'A well-cooked piece of meat. Restores strength.',
    effect: { heal: 25, buff: { type: 'atk-up', duration: 3 } },
    stats: {},
    value: 18,
  },
  friedFish: {
    id: 'friedFish',
    name: 'Fried Fish',
    type: 'consumable',
    category: FOOD_CATEGORIES.MEAT,
    rarity: 'Uncommon',
    description: 'Freshly caught and fried to perfection.',
    effect: { heal: 30, buff: { type: 'spd-up', duration: 3 } },
    stats: {},
    value: 22,
  },
  
  // Prepared dishes
  vegetableStew: {
    id: 'vegetableStew',
    name: 'Vegetable Stew',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Uncommon',
    description: 'A warm stew packed with nutritious vegetables.',
    effect: { heal: 35, buff: { type: 'regen', duration: 4 } },
    stats: {},
    value: 28,
  },
  heartyBreakfast: {
    id: 'heartyBreakfast',
    name: 'Hearty Breakfast',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Uncommon',
    description: 'A full breakfast plate with all the trimmings.',
    effect: { heal: 40, buff: { type: 'atk-up', duration: 5 } },
    stats: {},
    value: 35,
  },
  
  // Tavern specialty foods
  tavernPie: {
    id: 'tavernPie',
    name: 'Tavern Meat Pie',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Rare',
    description: 'The tavern\'s famous meat pie. A local favorite.',
    effect: { heal: 50, buff: { type: 'def-up', duration: 5 } },
    stats: {},
    value: 45,
  },
  
  // Rare/exotic foods
  goldenHoneyBread: {
    id: 'goldenHoneyBread',
    name: 'Golden Honey Bread',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Rare',
    description: 'Bread glazed with rare golden honey. Invigorating.',
    effect: { heal: 45, restoreMP: 20 },
    stats: {},
    value: 55,
  },
  
  // Farm products - these naturally include eggs
  farmFreshOmelet: {
    id: 'farmFreshOmelet',
    name: 'Farm Fresh Omelet',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Uncommon',
    description: 'A fluffy omelet made with the freshest farm ingredients.',
    effect: { heal: 28, buff: { type: 'atk-up', duration: 4 } },
    stats: {},
    value: 24,
  },
  
  spicedScramble: {
    id: 'spicedScramble',
    name: 'Spiced Scramble',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Common',
    description: 'Scrambled with herbs and spices for a quick energy boost.',
    effect: { heal: 18, buff: { type: 'spd-up', duration: 3 } },
    stats: {},
    value: 14,
  },
  
  dragonNestSouffle: {
    id: 'dragonNestSouffle',
    name: 'Dragon Nest Soufflé',
    type: 'consumable',
    category: FOOD_CATEGORIES.PREPARED,
    rarity: 'Epic',
    description: 'A legendary dish said to grant the vigor of dragons. The recipe is a closely guarded secret.',
    effect: { heal: 80, restoreMP: 40, buff: { type: 'atk-up', duration: 8 } },
    stats: {},
    value: 180,
  },
};

/**
 * Get all food items
 * @returns {Object} Map of food item id to food item
 */
export function getAllFoodItems() {
  return { ...foodItems };
}

/**
 * Get food items by category
 * @param {string} category - The food category to filter by
 * @returns {Object[]} Array of food items in the category
 */
export function getFoodByCategory(category) {
  return Object.values(foodItems).filter(food => food.category === category);
}

/**
 * Get food items by rarity
 * @param {string} rarity - The rarity to filter by
 * @returns {Object[]} Array of food items with the specified rarity
 */
export function getFoodByRarity(rarity) {
  return Object.values(foodItems).filter(food => food.rarity === rarity);
}

/**
 * Calculate the total healing value of a food item including buffs
 * @param {Object} food - The food item
 * @returns {number} Estimated total value
 */
export function calculateFoodValue(food) {
  if (!food || !food.effect) return 0;
  
  let value = food.effect.heal || 0;
  value += (food.effect.restoreMP || 0) * 1.5; // MP is slightly more valuable
  
  if (food.effect.buff) {
    value += food.effect.buff.duration * 5; // Buffs add value based on duration
  }
  
  return value;
}

/**
 * Apply food consumption effects to a character
 * @param {Object} character - The character consuming the food
 * @param {string} foodId - The food item id
 * @returns {{ success: boolean, message: string, effects: Object }}
 */
export function consumeFood(character, foodId) {
  const food = foodItems[foodId];
  if (!food) {
    return { success: false, message: `Unknown food: ${foodId}`, effects: {} };
  }
  
  const effects = {};
  const messages = [];
  
  // Apply healing
  if (food.effect.heal) {
    const healAmount = Math.min(food.effect.heal, character.maxHp - character.hp);
    effects.hp = character.hp + healAmount;
    if (healAmount > 0) {
      messages.push(`Restored ${healAmount} HP`);
    }
  }
  
  // Apply MP restoration
  if (food.effect.restoreMP) {
    const mpAmount = Math.min(food.effect.restoreMP, (character.maxMp || 0) - (character.mp || 0));
    effects.mp = (character.mp || 0) + mpAmount;
    if (mpAmount > 0) {
      messages.push(`Restored ${mpAmount} MP`);
    }
  }
  
  // Apply buff (to be processed by combat system)
  if (food.effect.buff) {
    effects.buff = { ...food.effect.buff };
    messages.push(`Gained ${food.effect.buff.type} for ${food.effect.buff.duration} turns`);
  }
  
  return {
    success: true,
    message: `Consumed ${food.name}. ${messages.join('. ')}.`,
    effects
  };
}

/**
 * Get random food drop for shops or loot
 * @param {string} rarity - Target rarity (optional)
 * @returns {Object|null} Random food item or null
 */
export function getRandomFood(rarity) {
  const pool = rarity ? getFoodByRarity(rarity) : Object.values(foodItems);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
