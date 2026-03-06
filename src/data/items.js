export const rarityColors = {
  Common: '#999999',
  Uncommon: '#1EFF00',
  Rare: '#0070FF',
  Epic: '#A335EE',
  Legendary: '#FF8000',
};

export const items = {
  potion: {
    id: 'potion',
    name: 'Healing Potion',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Common',
    description: 'A basic red potion that restores a small amount of health.',
    heal: 20,
    effect: { heal: 20 },
    stats: {},
    value: 15,
  },
  hiPotion: {
    id: 'hiPotion',
    name: 'Hi-Potion',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Uncommon',
    description: 'A stronger brew that restores a larger amount of health.',
    heal: 50,
    effect: { heal: 50 },
    stats: {},
    value: 45,
  },
  ether: {
    id: 'ether',
    name: 'Ether',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Rare',
    description: 'Aether-infused vial that restores mana.',
    effect: { mana: 40 },
    stats: {},
    value: 60,
  },
  bomb: {
    id: 'bomb',
    name: 'Fire Bomb',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Uncommon',
    description: 'Throwable incendiary that deals area fire damage.',
    effect: { damage: 35, element: 'fire' },
    stats: {},
    value: 55,
  },
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    type: 'consumable',
    category: 'consumable',
    rarity: 'Common',
    description: 'Neutralizes common poisons and toxins.',
    effect: { cleanse: ['poison'] },
    stats: {},
    value: 20,
  },
  rustySword: {
    id: 'rustySword',
    name: 'Rusty Sword',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Common',
    description: 'Seen better days, but still sharp enough to defend yourself.',
    effect: {},
    stats: { attack: 5, critChance: 0 },
    value: 25,
  },
  ironSword: {
    id: 'ironSword',
    name: 'Iron Sword',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Uncommon',
    description: 'Reliable iron blade favored by rookie knights.',
    effect: {},
    stats: { attack: 12, critChance: 2 },
    value: 80,
  },
  huntersBow: {
    id: 'huntersBow',
    name: "Hunter's Bow",
    type: 'weapon',
    category: 'weapon',
    rarity: 'Rare',
    description: 'Light bow with excellent balance and range.',
    effect: {},
    stats: { attack: 15, speed: 3, critChance: 5 },
    value: 140,
  },
  arcaneStaff: {
    id: 'arcaneStaff',
    name: 'Arcane Staff',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Epic',
    description: 'Staff etched with runes that amplify spell power.',
    effect: { manaRegen: 3 },
    stats: { attack: 8, magic: 18, critChance: 4 },
    value: 280,
  },
  dragonSpear: {
    id: 'dragonSpear',
    name: 'Dragon Spear',
    type: 'weapon',
    category: 'weapon',
    rarity: 'Legendary',
    description: 'Forged from the fang of an ancient dragon, radiating heat.',
    effect: { burnChance: 15 },
    stats: { attack: 32, critChance: 10, speed: 4 },
    value: 520,
  },
  leatherArmor: {
    id: 'leatherArmor',
    name: 'Leather Armor',
    type: 'armor',
    category: 'armor',
    rarity: 'Common',
    description: 'Supple leather that offers modest protection.',
    effect: {},
    stats: { defense: 6, speed: 1 },
    value: 35,
  },
  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    type: 'armor',
    category: 'armor',
    rarity: 'Uncommon',
    description: 'Linked rings that provide balanced protection and weight.',
    effect: {},
    stats: { defense: 12, speed: -1 },
    value: 95,
  },
  mageRobe: {
    id: 'mageRobe',
    name: 'Mage Robe',
    type: 'armor',
    category: 'armor',
    rarity: 'Rare',
    description: 'Woven with enchanted thread to bolster spellcasting.',
    effect: { manaRegen: 2 },
    stats: { defense: 8, magic: 10 },
    value: 160,
  },
  shadowCloak: {
    id: 'shadowCloak',
    name: 'Shadow Cloak',
    type: 'armor',
    category: 'armor',
    rarity: 'Epic',
    description: 'Cloak that blends with darkness, enhancing evasiveness.',
    effect: { evasion: 8 },
    stats: { defense: 14, speed: 4 },
    value: 310,
  },
  ringOfFortune: {
    id: 'ringOfFortune',
    name: 'Ring of Fortune',
    type: 'accessory',
    category: 'accessory',
    rarity: 'Rare',
    description: 'Gold ring that seems to bend probability in your favor.',
    effect: { luck: 10 },
    stats: { critChance: 5 },
    value: 200,
  },
  amuletOfVigor: {
    id: 'amuletOfVigor',
    name: 'Amulet of Vigor',
    type: 'accessory',
    category: 'accessory',
    rarity: 'Epic',
    description: "Pulses with energy, quickening the wearer's step.",
    effect: { staminaRegen: 3 },
    stats: { speed: 5, defense: 3 },
    value: 260,
  },
  bootsOfSwiftness: {
    id: 'bootsOfSwiftness',
    name: 'Boots of Swiftness',
    type: 'accessory',
    category: 'accessory',
    rarity: 'Uncommon',
    description: 'Lightweight boots crafted for speed and agility.',
    effect: { sprintBoost: 10 },
    stats: { speed: 6 },
    value: 120,
  },
};

export const lootTables = {
  goblin: { rarityWeights: { Common: 70, Uncommon: 20, Rare: 8, Epic: 2, Legendary: 0 } },
  banditCaptain: { rarityWeights: { Common: 45, Uncommon: 30, Rare: 15, Epic: 8, Legendary: 2 } },
  forestChest: { rarityWeights: { Common: 40, Uncommon: 35, Rare: 15, Epic: 8, Legendary: 2 } },
  castleArmory: { rarityWeights: { Common: 20, Uncommon: 35, Rare: 25, Epic: 15, Legendary: 5 } },
  dragonHoard: { rarityWeights: { Common: 5, Uncommon: 10, Rare: 25, Epic: 30, Legendary: 30 } },
};

export function getRandomLoot(rarityWeights) {
  const entries = Object.entries(rarityWeights || {});
  const totalWeight = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);

  if (totalWeight <= 0) {
    return null;
  }

  let roll = Math.random() * totalWeight;
  let chosenRarity = entries[0][0];

  for (const [rarity, weight] of entries) {
    const clamped = Math.max(0, weight);
    if (roll < clamped) {
      chosenRarity = rarity;
      break;
    }
    roll -= clamped;
  }

  const pool = Object.values(items).filter((item) => item.rarity === chosenRarity);
  if (pool.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
