/**
 * Talent System Data - Passive abilities players can unlock with skill points
 * 
 * Each talent has:
 * - id: unique identifier
 * - name: display name
 * - description: what the talent does
 * - maxRank: maximum ranks (1-5 typically)
 * - category: combat, defense, magic, or utility
 * - effect: object describing the stat/bonus per rank
 * - prerequisites: array of talent ids required (can be empty)
 * - tier: 1-3, higher tiers require more points in category
 */

export const TALENT_CATEGORIES = {
  combat: {
    id: 'combat',
    name: 'Combat',
    description: 'Offensive abilities that increase damage output',
    color: '#e74c3c'
  },
  defense: {
    id: 'defense',
    name: 'Defense',
    description: 'Defensive abilities that increase survivability',
    color: '#3498db'
  },
  magic: {
    id: 'magic',
    name: 'Magic',
    description: 'Magical abilities that enhance spellcasting',
    color: '#9b59b6'
  },
  utility: {
    id: 'utility',
    name: 'Utility',
    description: 'Utility abilities that provide various bonuses',
    color: '#2ecc71'
  }
};

export const TALENTS = {
  // === COMBAT TALENTS (Tier 1) ===
  'sharpened-blade': {
    id: 'sharpened-blade',
    name: 'Sharpened Blade',
    description: 'Increases physical attack damage by {value}%',
    maxRank: 5,
    category: 'combat',
    tier: 1,
    effect: { stat: 'physicalDamage', valuePerRank: 3, type: 'percent' },
    prerequisites: []
  },
  'precise-strikes': {
    id: 'precise-strikes',
    name: 'Precise Strikes',
    description: 'Increases critical hit chance by {value}%',
    maxRank: 5,
    category: 'combat',
    tier: 1,
    effect: { stat: 'critChance', valuePerRank: 2, type: 'flat' },
    prerequisites: []
  },
  'swift-attacks': {
    id: 'swift-attacks',
    name: 'Swift Attacks',
    description: 'Increases attack speed (SPD) by {value}',
    maxRank: 3,
    category: 'combat',
    tier: 1,
    effect: { stat: 'spd', valuePerRank: 2, type: 'flat' },
    prerequisites: []
  },

  // === COMBAT TALENTS (Tier 2) ===
  'deadly-force': {
    id: 'deadly-force',
    name: 'Deadly Force',
    description: 'Increases critical hit damage by {value}%',
    maxRank: 3,
    category: 'combat',
    tier: 2,
    effect: { stat: 'critDamage', valuePerRank: 10, type: 'flat' },
    prerequisites: ['precise-strikes']
  },
  'armor-piercing': {
    id: 'armor-piercing',
    name: 'Armor Piercing',
    description: 'Attacks ignore {value}% of enemy defense',
    maxRank: 3,
    category: 'combat',
    tier: 2,
    effect: { stat: 'armorPen', valuePerRank: 5, type: 'percent' },
    prerequisites: ['sharpened-blade']
  },
  'relentless': {
    id: 'relentless',
    name: 'Relentless',
    description: 'Gain {value}% chance for attacks to strike twice',
    maxRank: 3,
    category: 'combat',
    tier: 2,
    effect: { stat: 'doubleStrike', valuePerRank: 5, type: 'flat' },
    prerequisites: ['swift-attacks']
  },

  // === COMBAT TALENTS (Tier 3) ===
  'executioner': {
    id: 'executioner',
    name: 'Executioner',
    description: 'Deal {value}% more damage to enemies below 30% HP',
    maxRank: 2,
    category: 'combat',
    tier: 3,
    effect: { stat: 'executeDamage', valuePerRank: 15, type: 'percent' },
    prerequisites: ['deadly-force', 'armor-piercing']
  },

  // === DEFENSE TALENTS (Tier 1) ===
  'thick-skin': {
    id: 'thick-skin',
    name: 'Thick Skin',
    description: 'Increases defense (DEF) by {value}',
    maxRank: 5,
    category: 'defense',
    tier: 1,
    effect: { stat: 'def', valuePerRank: 2, type: 'flat' },
    prerequisites: []
  },
  'vitality': {
    id: 'vitality',
    name: 'Vitality',
    description: 'Increases maximum HP by {value}%',
    maxRank: 5,
    category: 'defense',
    tier: 1,
    effect: { stat: 'maxHp', valuePerRank: 4, type: 'percent' },
    prerequisites: []
  },
  'evasion': {
    id: 'evasion',
    name: 'Evasion',
    description: 'Gain {value}% chance to dodge attacks',
    maxRank: 3,
    category: 'defense',
    tier: 1,
    effect: { stat: 'dodge', valuePerRank: 3, type: 'flat' },
    prerequisites: []
  },

  // === DEFENSE TALENTS (Tier 2) ===
  'resilience': {
    id: 'resilience',
    name: 'Resilience',
    description: 'Reduces incoming damage by {value}%',
    maxRank: 3,
    category: 'defense',
    tier: 2,
    effect: { stat: 'damageReduction', valuePerRank: 3, type: 'percent' },
    prerequisites: ['thick-skin']
  },
  'regeneration': {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Recover {value}% of max HP at the start of each turn',
    maxRank: 3,
    category: 'defense',
    tier: 2,
    effect: { stat: 'hpRegen', valuePerRank: 1, type: 'percent' },
    prerequisites: ['vitality']
  },
  'counter-stance': {
    id: 'counter-stance',
    name: 'Counter Stance',
    description: 'Gain {value}% chance to counter-attack when hit',
    maxRank: 3,
    category: 'defense',
    tier: 2,
    effect: { stat: 'counterChance', valuePerRank: 5, type: 'flat' },
    prerequisites: ['evasion']
  },

  // === DEFENSE TALENTS (Tier 3) ===
  'last-stand': {
    id: 'last-stand',
    name: 'Last Stand',
    description: 'Take {value}% less damage when below 25% HP',
    maxRank: 2,
    category: 'defense',
    tier: 3,
    effect: { stat: 'lowHpResist', valuePerRank: 15, type: 'percent' },
    prerequisites: ['resilience', 'regeneration']
  },

  // === MAGIC TALENTS (Tier 1) ===
  'arcane-power': {
    id: 'arcane-power',
    name: 'Arcane Power',
    description: 'Increases magical damage by {value}%',
    maxRank: 5,
    category: 'magic',
    tier: 1,
    effect: { stat: 'magicDamage', valuePerRank: 3, type: 'percent' },
    prerequisites: []
  },
  'mana-well': {
    id: 'mana-well',
    name: 'Mana Well',
    description: 'Increases maximum MP by {value}%',
    maxRank: 5,
    category: 'magic',
    tier: 1,
    effect: { stat: 'maxMp', valuePerRank: 5, type: 'percent' },
    prerequisites: []
  },
  'spell-efficiency': {
    id: 'spell-efficiency',
    name: 'Spell Efficiency',
    description: 'Reduces MP cost of abilities by {value}%',
    maxRank: 3,
    category: 'magic',
    tier: 1,
    effect: { stat: 'mpCostReduction', valuePerRank: 5, type: 'percent' },
    prerequisites: []
  },

  // === MAGIC TALENTS (Tier 2) ===
  'elemental-mastery': {
    id: 'elemental-mastery',
    name: 'Elemental Mastery',
    description: 'Increases fire, ice, and lightning damage by {value}%',
    maxRank: 3,
    category: 'magic',
    tier: 2,
    effect: { stat: 'elementalDamage', valuePerRank: 5, type: 'percent' },
    prerequisites: ['arcane-power']
  },
  'meditation': {
    id: 'meditation',
    name: 'Meditation',
    description: 'Recover {value} MP at the start of each turn',
    maxRank: 3,
    category: 'magic',
    tier: 2,
    effect: { stat: 'mpRegen', valuePerRank: 2, type: 'flat' },
    prerequisites: ['mana-well']
  },
  'spell-penetration': {
    id: 'spell-penetration',
    name: 'Spell Penetration',
    description: 'Magical attacks ignore {value}% of enemy resistance',
    maxRank: 3,
    category: 'magic',
    tier: 2,
    effect: { stat: 'magicPen', valuePerRank: 5, type: 'percent' },
    prerequisites: ['spell-efficiency']
  },

  // === MAGIC TALENTS (Tier 3) ===
  'archmage': {
    id: 'archmage',
    name: 'Archmage',
    description: 'Abilities have {value}% chance to not consume MP',
    maxRank: 2,
    category: 'magic',
    tier: 3,
    effect: { stat: 'freeSpellChance', valuePerRank: 10, type: 'flat' },
    prerequisites: ['elemental-mastery', 'meditation']
  },

  // === UTILITY TALENTS (Tier 1) ===
  'treasure-hunter': {
    id: 'treasure-hunter',
    name: 'Treasure Hunter',
    description: 'Increases gold gained from battles by {value}%',
    maxRank: 5,
    category: 'utility',
    tier: 1,
    effect: { stat: 'goldBonus', valuePerRank: 5, type: 'percent' },
    prerequisites: []
  },
  'quick-learner': {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Increases XP gained from battles by {value}%',
    maxRank: 5,
    category: 'utility',
    tier: 1,
    effect: { stat: 'xpBonus', valuePerRank: 4, type: 'percent' },
    prerequisites: []
  },
  'lucky': {
    id: 'lucky',
    name: 'Lucky',
    description: 'Increases item drop rate by {value}%',
    maxRank: 3,
    category: 'utility',
    tier: 1,
    effect: { stat: 'itemDropRate', valuePerRank: 5, type: 'percent' },
    prerequisites: []
  },

  // === UTILITY TALENTS (Tier 2) ===
  'merchant': {
    id: 'merchant',
    name: 'Merchant',
    description: 'Shop prices reduced by {value}%',
    maxRank: 3,
    category: 'utility',
    tier: 2,
    effect: { stat: 'shopDiscount', valuePerRank: 5, type: 'percent' },
    prerequisites: ['treasure-hunter']
  },
  'veteran': {
    id: 'veteran',
    name: 'Veteran',
    description: 'Start battles with {value}% bonus to all stats for 2 turns',
    maxRank: 3,
    category: 'utility',
    tier: 2,
    effect: { stat: 'battleStartBonus', valuePerRank: 3, type: 'percent' },
    prerequisites: ['quick-learner']
  },
  'scavenger': {
    id: 'scavenger',
    name: 'Scavenger',
    description: 'Find {value}% more items in exploration',
    maxRank: 3,
    category: 'utility',
    tier: 2,
    effect: { stat: 'explorationFind', valuePerRank: 10, type: 'percent' },
    prerequisites: ['lucky']
  },

  // === UTILITY TALENTS (Tier 3) ===
  'fortune-favors': {
    id: 'fortune-favors',
    name: 'Fortune Favors',
    description: 'Gain {value}% chance to find rare items from battles',
    maxRank: 2,
    category: 'utility',
    tier: 3,
    effect: { stat: 'rareItemChance', valuePerRank: 5, type: 'flat' },
    prerequisites: ['merchant', 'scavenger']
  }
};

// Tier requirements: how many points must be spent in a category to unlock each tier
export const TIER_REQUIREMENTS = {
  1: 0,   // Tier 1 talents are available immediately
  2: 5,   // Need 5 points in category for tier 2
  3: 10   // Need 10 points in category for tier 3
};

// Skill points earned per level
export const SKILL_POINTS_PER_LEVEL = 1;

// Starting skill points (level 1)
export const STARTING_SKILL_POINTS = 0;

/**
 * Get the total value of a talent at a given rank
 */
export function getTalentValue(talentId, rank) {
  const talent = TALENTS[talentId];
  if (!talent || rank <= 0) return 0;
  return talent.effect.valuePerRank * Math.min(rank, talent.maxRank);
}

/**
 * Get the description with the actual value inserted
 */
export function getTalentDescription(talentId, rank = 1) {
  const talent = TALENTS[talentId];
  if (!talent) return '';
  const value = getTalentValue(talentId, rank);
  return talent.description.replace('{value}', value);
}

/**
 * Get all talents in a category
 */
export function getTalentsByCategory(category) {
  return Object.values(TALENTS).filter(t => t.category === category);
}

/**
 * Get all talents of a specific tier
 */
export function getTalentsByTier(tier) {
  return Object.values(TALENTS).filter(t => t.tier === tier);
}
