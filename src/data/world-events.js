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
};

/** Weighted event pool: rare events appear less often */
export const EVENT_POOL = [
  'merchant_caravan',
  'merchant_caravan',
  'monster_horde',
  'monster_horde',
  'blessing_of_light',
  'dark_omen',
  'dark_omen',
  'treasure_map_found',
  'fog_of_war',
  'fog_of_war',
  'wandering_healer',
  'ancient_ruins',
];

/** Chance per room move to trigger a world event (when no event is active) */
export const WORLD_EVENT_TRIGGER_CHANCE = 0.15;
