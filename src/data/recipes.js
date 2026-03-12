/**
 * @typedef {Object} ItemDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} category
 * @property {string} rarity
 * @property {string} description
 * @property {Object} effect
 * @property {Object} stats
 * @property {number} value
 */

/**
 * @typedef {Object} MaterialDefinition
 * @property {string} id
 * @property {string} name
 * @property {'material'} type
 * @property {'material'} category
 * @property {'Common' | 'Uncommon' | 'Rare' | 'Epic'} rarity
 * @property {string} description
 * @property {number} value
 */

/**
 * @typedef {Object} RecipeIngredient
 * @property {string} itemId
 * @property {number} quantity
 */

/**
 * @typedef {Object} RecipeResult
 * @property {string} itemId
 * @property {number} quantity
 */

/**
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {RecipeIngredient[]} ingredients
 * @property {RecipeResult} result
 * @property {'consumable' | 'weapon' | 'armor' | 'accessory'} category
 * @property {number} requiredLevel
 */

/**
 * Crafting materials that can be gathered or dropped.
 * @type {Record<string, MaterialDefinition>}
 */
export const craftingMaterials = {
  herbBundle: {
    id: 'herbBundle',
    name: 'Herb Bundle',
    type: 'material',
    category: 'material',
    rarity: 'Common',
    description: 'A bundle of medicinal herbs.',
    value: 5,
  },
  ironOre: {
    id: 'ironOre',
    name: 'Iron Ore',
    type: 'material',
    category: 'material',
    rarity: 'Common',
    description: 'Raw iron ore, ready for smelting.',
    value: 8,
  },
  arcaneEssence: {
    id: 'arcaneEssence',
    name: 'Arcane Essence',
    type: 'material',
    category: 'material',
    rarity: 'Uncommon',
    description: 'Crystallized magical energy.',
    value: 25,
  },
  dragonScale: {
    id: 'dragonScale',
    name: 'Dragon Scale',
    type: 'material',
    category: 'material',
    rarity: 'Rare',
    description: 'A shimmering scale from a fire drake.',
    value: 80,
  },
  shadowShard: {
    id: 'shadowShard',
    name: 'Shadow Shard',
    type: 'material',
    category: 'material',
    rarity: 'Rare',
    description: 'A fragment of solidified darkness.',
    value: 75,
  },
  infernalFeather: {
    id: 'infernalFeather',
    name: 'Phoenix Feather',
    type: 'material',
    category: 'material',
    rarity: 'Epic',
    description: 'A radiant feather imbued with rebirth.',
    value: 150,
  },
  beastFang: {
    id: 'beastFang',
    name: 'Beast Fang',
    type: 'material',
    category: 'material',
    rarity: 'Common',
    description: 'A sharp fang from a wild beast.',
    value: 10,
  },
  enchantedThread: {
    id: 'enchantedThread',
    name: 'Enchanted Thread',
    type: 'material',
    category: 'material',
    rarity: 'Uncommon',
    description: 'Thread woven with protective magic.',
    value: 30,
  },
  crystalLens: {
    id: 'crystalLens',
    name: 'Crystal Lens',
    type: 'material',
    category: 'material',
    rarity: 'Uncommon',
    description: 'A precisely cut crystal that focuses energy.',
    value: 35,
  },
  ancientRune: {
    id: 'ancientRune',
    name: 'Ancient Rune',
    type: 'material',
    category: 'material',
    rarity: 'Rare',
    description: 'A stone tablet inscribed with forgotten power.',
    value: 90,
  },
};

/**
 * Items that can only be obtained through crafting.
 * @type {Record<string, ItemDefinition>}
 */
export const craftedItems = {
  superPotion: {
    id: 'superPotion',
    name: 'Super Potion',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Rare',
    description: 'A potent draught that restores a large amount of health.',
    effect: { heal: 100 },
    stats: {},
    value: 100,
  },
  megaEther: {
    id: 'megaEther',
    name: 'Mega Ether',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Rare',
    description: 'A concentrated infusion that restores mana to its user.',
    effect: { mana: 80 },
    stats: {},
    value: 120,
  },
  flameBomb: {
    id: 'flameBomb',
    name: 'Flame Bomb',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Rare',
    description: 'An explosive charge that erupts in searing flame.',
    effect: { damage: 70, element: 'fire' },
    stats: {},
    value: 110,
  },
  steelSword: {
    id: 'steelSword',
    name: 'Steel Sword',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Rare',
    description: 'A refined blade forged from hardened steel.',
    effect: {},
    stats: { attack: 15, critChance: 5 },
    value: 200,
  },
  dragonBlade: {
    id: 'dragonBlade',
    name: 'Dragon Blade',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Epic',
    description: 'A blazing blade that channels draconic heat.',
    effect: { element: 'fire' },
    stats: { attack: 25, critChance: 8 },
    value: 600,
  },
  reinforcedArmor: {
    id: 'reinforcedArmor',
    name: 'Reinforced Armor',
    type: 'armor',
    category: 'armor',
    rarity: 'Rare',
    description: 'Sturdy armor plated with additional reinforcement.',
    effect: {},
    stats: { defense: 12, maxHp: 20 },
    value: 220,
  },
  shadowVeil: {
    id: 'shadowVeil',
    name: 'Shadow Veil',
    type: 'armor',
    category: 'armor',
    rarity: 'Epic',
    description: 'A veil of darkness that enhances evasive maneuvers.',
    effect: {},
    stats: { defense: 18, evasion: 15, critChance: 5 },
    value: 500,
  },
  crystalAmulet: {
    id: 'crystalAmulet',
    name: 'Crystal Amulet',
    type: 'accessory',
    category: 'accessory',
    rarity: 'Rare',
    description: 'A glimmering charm that amplifies magical reserves.',
    effect: {},
    stats: { maxMp: 30, magicAttack: 8 },
    value: 300,
  },
  infernalRing: {
    id: 'infernalRing',
    name: 'Phoenix Ring',
    type: 'accessory',
    category: 'accessory',
    rarity: 'Epic',
    description: 'A ring that grants a brief spark of rebirth in battle.',
    effect: { revive: true },
    stats: { maxHp: 50 },
    value: 700,
  },
  herbalRemedy: {
    id: 'herbalRemedy',
    name: 'Herbal Remedy',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Uncommon',
    description: 'A soothing mixture that cures poison and burns.',
    effect: { cleanse: ['poison', 'burn'] },
    stats: {},
    value: 35,
  },
  beastKnuckles: {
    id: 'beastKnuckles',
    name: 'Beast Knuckles',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Uncommon',
    description: 'Weighted gauntlets tipped with hardened fangs.',
    effect: {},
    stats: { attack: 10, critChance: 3 },
    value: 100,
  },
  enchantedRobe: {
    id: 'enchantedRobe',
    name: 'Enchanted Robe',
    type: 'armor',
    category: 'armor',
    rarity: 'Rare',
    description: 'A robe infused with magic for defense and mana.',
    effect: {},
    stats: { defense: 8, maxMp: 25, magicDefense: 10 },
    value: 280,
  },
};

/**
 * Crafting recipes for the RPG crafting system.
 * @type {Recipe[]}
 */
export const recipes = [
  {
    id: 'recipe_superPotion',
    name: 'Super Potion',
    description: 'Brews a Super Potion that restores 100 HP.',
    ingredients: [
      { itemId: 'hiPotion', quantity: 2 },
      { itemId: 'herbBundle', quantity: 1 },
    ],
    result: { itemId: 'superPotion', quantity: 1 },
    category: 'consumable',
    requiredLevel: 3,
  },
  {
    id: 'recipe_megaEther',
    name: 'Mega Ether',
    description: 'Distills a Mega Ether that restores 80 MP.',
    ingredients: [
      { itemId: 'ether', quantity: 1 },
      { itemId: 'arcaneEssence', quantity: 2 },
    ],
    result: { itemId: 'megaEther', quantity: 1 },
    category: 'consumable',
    requiredLevel: 4,
  },
  {
    id: 'recipe_flameBomb',
    name: 'Flame Bomb',
    description: 'Creates a Flame Bomb that deals heavy fire damage.',
    ingredients: [
      { itemId: 'bomb', quantity: 2 },
      { itemId: 'dragonScale', quantity: 1 },
    ],
    result: { itemId: 'flameBomb', quantity: 1 },
    category: 'consumable',
    requiredLevel: 5,
  },
  {
    id: 'recipe_steelSword',
    name: 'Steel Sword',
    description: 'Forges a Steel Sword with improved sharpness.',
    ingredients: [
      { itemId: 'ironSword', quantity: 1 },
      { itemId: 'ironOre', quantity: 3 },
    ],
    result: { itemId: 'steelSword', quantity: 1 },
    category: 'weapon',
    requiredLevel: 3,
  },
  {
    id: 'recipe_dragonBlade',
    name: 'Dragon Blade',
    description: 'Forges a Dragon Blade infused with draconic fire.',
    ingredients: [
      { itemId: 'steelSword', quantity: 1 },
      { itemId: 'dragonScale', quantity: 2 },
      { itemId: 'ancientRune', quantity: 1 },
    ],
    result: { itemId: 'dragonBlade', quantity: 1 },
    category: 'weapon',
    requiredLevel: 7,
  },
  {
    id: 'recipe_reinforcedArmor',
    name: 'Reinforced Armor',
    description: 'Reinforces chainmail into heavier armor plating.',
    ingredients: [
      { itemId: 'chainmail', quantity: 1 },
      { itemId: 'ironOre', quantity: 3 },
      { itemId: 'enchantedThread', quantity: 1 },
    ],
    result: { itemId: 'reinforcedArmor', quantity: 1 },
    category: 'armor',
    requiredLevel: 4,
  },
  {
    id: 'recipe_shadowVeil',
    name: 'Shadow Veil',
    description: 'Weaves a Shadow Veil that excels at evasion.',
    ingredients: [
      { itemId: 'shadowCloak', quantity: 1 },
      { itemId: 'shadowShard', quantity: 2 },
      { itemId: 'enchantedThread', quantity: 1 },
    ],
    result: { itemId: 'shadowVeil', quantity: 1 },
    category: 'armor',
    requiredLevel: 6,
  },
  {
    id: 'recipe_crystalAmulet',
    name: 'Crystal Amulet',
    description: 'Sets a Crystal Amulet that augments magical power.',
    ingredients: [
      { itemId: 'amuletOfVigor', quantity: 1 },
      { itemId: 'crystalLens', quantity: 2 },
      { itemId: 'arcaneEssence', quantity: 1 },
    ],
    result: { itemId: 'crystalAmulet', quantity: 1 },
    category: 'accessory',
    requiredLevel: 5,
  },
  {
    id: 'recipe_infernalRing',
    name: 'Phoenix Ring',
    description: 'Forges a Phoenix Ring that grants a rebirth spark.',
    ingredients: [
      { itemId: 'ringOfFortune', quantity: 1 },
      { itemId: 'infernalFeather', quantity: 1 },
      { itemId: 'ancientRune', quantity: 1 },
    ],
    result: { itemId: 'infernalRing', quantity: 1 },
    category: 'accessory',
    requiredLevel: 8,
  },
  {
    id: 'recipe_herbalRemedy',
    name: 'Herbal Remedy',
    description: 'Blends an Herbal Remedy that cures poison and burns.',
    ingredients: [
      { itemId: 'herbBundle', quantity: 2 },
      { itemId: 'antidote', quantity: 1 },
    ],
    result: { itemId: 'herbalRemedy', quantity: 1 },
    category: 'consumable',
    requiredLevel: 1,
  },
  {
    id: 'recipe_beastKnuckles',
    name: 'Beast Knuckles',
    description: 'Crafts Beast Knuckles for close-range combat.',
    ingredients: [
      { itemId: 'rustySword', quantity: 1 },
      { itemId: 'beastFang', quantity: 3 },
    ],
    result: { itemId: 'beastKnuckles', quantity: 1 },
    category: 'weapon',
    requiredLevel: 2,
  },
  {
    id: 'recipe_enchantedRobe',
    name: 'Enchanted Robe',
    description: 'Enhances a Mage Robe with additional enchantments.',
    ingredients: [
      { itemId: 'mageRobe', quantity: 1 },
      { itemId: 'enchantedThread', quantity: 2 },
      { itemId: 'arcaneEssence', quantity: 1 },
    ],
    result: { itemId: 'enchantedRobe', quantity: 1 },
    category: 'armor',
    requiredLevel: 5,
  },
];
