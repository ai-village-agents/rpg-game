/**
 * World Event definitions for the RPG game.
 * Events trigger randomly during exploration and have temporary effects.
 */

export const WORLD_EVENTS = {
  merchant_caravan: {
    id: 'merchant_caravan',
    name: 'Merchant Caravan',
    description: 'A traveling merchant caravan has set up camp nearby! Buy items at a 20% discount.',
    icon: '🛒',
    minMoves: 4,
    maxMoves: 6,
    effect: { type: 'shop_discount', value: 0.20 },
    rarity: 'common',
  },
  monster_horde: {
    id: 'monster_horde',
    name: 'Monster Horde',
    description: 'A monster horde is sweeping through the region! Encounter rate is doubled.',
    icon: '👹',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'encounter_rate_multiplier', value: 2.0 },
    rarity: 'common',
  },
  blessing_of_light: {
    id: 'blessing_of_light',
    name: 'Blessing of Light',
    description: 'A divine aura fills the land. You recover 10% of max HP after each room you enter.',
    icon: '✨',
    minMoves: 4,
    maxMoves: 7,
    effect: { type: 'heal_on_move', value: 0.10 },
    rarity: 'uncommon',
  },
  dark_omen: {
    id: 'dark_omen',
    name: 'Dark Omen',
    description: 'A dark omen looms over the land. All combat damage is increased by 15%.',
    icon: '🌑',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'damage_multiplier', value: 1.15 },
    rarity: 'common',
  },
  treasure_map_found: {
    id: 'treasure_map_found',
    name: 'Treasure Map Found',
    description: 'You discovered an ancient treasure map! Gold drops from enemies are doubled.',
    icon: '🗺️',
    minMoves: 4,
    maxMoves: 6,
    effect: { type: 'gold_multiplier', value: 2.0 },
    rarity: 'uncommon',
  },
  fog_of_war: {
    id: 'fog_of_war',
    name: 'Fog of War',
    description: 'A thick magical fog obscures your surroundings. The minimap is hidden.',
    icon: '🌫️',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'hide_minimap', value: true },
    rarity: 'common',
  },
  wandering_healer: {
    id: 'wandering_healer',
    name: 'Wandering Healer',
    description: 'A wandering healer has found you and restored your health and mana to full!',
    icon: '💚',
    minMoves: 3,
    maxMoves: 4,
    effect: { type: 'full_restore', value: true },
    rarity: 'rare',
  },
  ancient_ruins: {
    id: 'ancient_ruins',
    name: 'Ancient Ruins Discovered',
    description: 'Ancient ruins crackle with magical energy. Your spells cost 50% less MP.',
    icon: '🏛️',
    minMoves: 4,
    maxMoves: 6,
    effect: { type: 'mp_cost_multiplier', value: 0.50 },
    rarity: 'uncommon',
  },
  arcane_surge: {
    id: 'arcane_surge',
    name: 'Arcane Surge',
    description: 'Wild magical energy surges through the land. All damage (friendly and enemy) is increased by 25%.',
    icon: '🔮',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'damage_multiplier', value: 1.25 },
    rarity: 'common',
  },
  golden_age: {
    id: 'golden_age',
    name: 'Golden Age',
    description: 'Prosperity fills the realm! Gold drops from enemies are tripled.',
    icon: '👑',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'gold_multiplier', value: 3.0 },
    rarity: 'uncommon',
  },
  thieves_guild: {
    id: 'thieves_guild',
    name: 'Thieves Guild Active',
    description: 'The thieves guild is active in the area. Shop prices are 30% higher.',
    icon: '🗡️',
    minMoves: 3,
    maxMoves: 6,
    effect: { type: 'shop_price_increase', value: 0.30 },
    rarity: 'common',
  },
  celestial_alignment: {
    id: 'celestial_alignment',
    name: 'Celestial Alignment',
    description: 'The stars align in your favor. All healing effects are doubled.',
    icon: '⭐',
    minMoves: 4,
    maxMoves: 7,
    effect: { type: 'heal_multiplier', value: 2.0 },
    rarity: 'uncommon',
  },
  cursed_land: {
    id: 'cursed_land',
    name: 'Cursed Land',
    description: 'A dark curse hangs over this region. You lose 5% max HP each time you move.',
    icon: '💀',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'damage_on_move', value: 0.05 },
    rarity: 'common',
  },
  time_of_plenty: {
    id: 'time_of_plenty',
    name: 'Time of Plenty',
    description: 'Resources are abundant! Item drops from enemies are doubled.',
    icon: '🎁',
    minMoves: 4,
    maxMoves: 6,
    effect: { type: 'item_drop_multiplier', value: 2.0 },
    rarity: 'uncommon',
  },
  spirit_realm_rift: {
    id: 'spirit_realm_rift',
    name: 'Spirit Realm Rift',
    description: 'A rift to the spirit realm has opened nearby. Undead and shadow enemies appear more frequently.',
    icon: '👻',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'encounter_rate_multiplier', value: 1.5 },
    rarity: 'common',
  },
  mages_conference: {
    id: 'mages_conference',
    name: "Mages' Conference",
    description: 'A gathering of mages is nearby. All MP costs are reduced by 30% and spells deal 20% more damage.',
    icon: '📚',
    minMoves: 4,
    maxMoves: 6,
    effect: { type: 'mp_cost_multiplier', value: 0.70 },
    rarity: 'uncommon',
  },
  elemental_storm: {
    id: 'elemental_storm',
    name: 'Elemental Storm',
    description: 'A massive elemental storm rages! All elemental damage is boosted by 40% but enemies hit harder too.',
    icon: '⛈️',
    minMoves: 3,
    maxMoves: 4,
    effect: { type: 'damage_multiplier', value: 1.40 },
    rarity: 'rare',
  },
  harvest_festival: {
    id: 'harvest_festival',
    name: 'Harvest Festival',
    description: 'The village is celebrating! All healing items restore 50% more HP.',
    icon: '🎉',
    minMoves: 4,
    maxMoves: 7,
    effect: { type: 'heal_multiplier', value: 1.5 },
    rarity: 'uncommon',
  },
  bounty_hunters: {
    id: 'bounty_hunters',
    name: 'Bounty Hunters',
    description: 'Bounty hunters are tracking dangerous monsters in the area. Boss enemies drop 50% more gold.',
    icon: '🏹',
    minMoves: 4,
    maxMoves: 6,
    effect: { type: 'gold_multiplier', value: 1.5 },
    rarity: 'common',
  },
  veil_of_shadows: {
    id: 'veil_of_shadows',
    name: 'Veil of Shadows',
    description: 'Darkness shrouds the realm. Enemy encounters become ambushes — enemies attack first.',
    icon: '🌚',
    minMoves: 3,
    maxMoves: 5,
    effect: { type: 'enemy_attacks_first', value: true },
    rarity: 'rare',
  },
};

/** Weighted event pool: rare events appear less often */
export const EVENT_POOL = [
  // common (2x)
  'merchant_caravan', 'merchant_caravan',
  'monster_horde', 'monster_horde',
  'dark_omen', 'dark_omen',
  'fog_of_war', 'fog_of_war',
  'arcane_surge', 'arcane_surge',
  'thieves_guild', 'thieves_guild',
  'cursed_land', 'cursed_land',
  'spirit_realm_rift', 'spirit_realm_rift',
  'bounty_hunters', 'bounty_hunters',
  // uncommon (1x)
  'blessing_of_light',
  'treasure_map_found',
  'ancient_ruins',
  'golden_age',
  'celestial_alignment',
  'time_of_plenty',
  'mages_conference',
  'harvest_festival',
  // rare (1x)
  'wandering_healer',
  'elemental_storm',
  'veil_of_shadows',
];

/** Chance per room move to trigger a world event (when no event is active) */
export const WORLD_EVENT_TRIGGER_CHANCE = 0.15;

/**
 * Check if the current world event causes enemies to attack first
 * @param {Object} worldEvent - The active world event object
 * @returns {boolean} True if enemies should attack first
 */
export function isEnemyAttacksFirst(worldEvent) {
  if (!worldEvent) return false;
  const eventData = WORLD_EVENTS[worldEvent.id || worldEvent];
  if (!eventData) return false;
  return eventData.effect?.type === 'enemy_attacks_first' && eventData.effect?.value === true;
}
