/**
 * Abilities Module — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Defines all combat abilities/spells with their properties.
 * Target types: 'single-enemy', 'single-ally', 'all-enemies', 'all-allies', 'self'
 */

// ── Ability Database ─────────────────────────────────────────────────

const ABILITIES = {
  // ─── Warrior Abilities ───
  'power-strike': {
    id: 'power-strike',
    name: 'Power Strike',
    description: 'A mighty blow dealing 1.5x damage.',
    mpCost: 4,
    power: 1.5,
    healPower: 0,
    element: 'physical',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'warrior',
  },
  'shield-bash': {
    id: 'shield-bash',
    name: 'Shield Bash',
    description: 'Slam target with shield, dealing damage and stunning for 1 turn.',
    mpCost: 6,
    power: 0.8,
    healPower: 0,
    element: 'physical',
    targetType: 'single-enemy',
    statusEffect: { type: 'stun', name: 'Stun', duration: 1, power: 0 },
    class: 'warrior',
  },
  'war-cry': {
    id: 'war-cry',
    name: 'War Cry',
    description: 'Rally allies, boosting ATK for 3 turns.',
    mpCost: 5,
    power: 0,
    healPower: 0,
    element: 'physical',
    targetType: 'all-allies',
    statusEffect: { type: 'atk-up', name: 'ATK Up', duration: 3, power: 0 },
    class: 'warrior',
  },

  // ─── Mage Abilities ───
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurl a blazing fireball at one enemy.',
    mpCost: 6,
    power: 1.8,
    healPower: 0,
    element: 'fire',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'mage',
  },
  'blizzard': {
    id: 'blizzard',
    name: 'Blizzard',
    description: 'Unleash a freezing storm on all enemies.',
    mpCost: 10,
    power: 1.2,
    healPower: 0,
    element: 'ice',
    targetType: 'all-enemies',
    statusEffect: null,
    class: 'mage',
  },
  'thunder-bolt': {
    id: 'thunder-bolt',
    name: 'Thunder Bolt',
    description: 'Strike with lightning. May lower SPD.',
    mpCost: 7,
    power: 1.6,
    healPower: 0,
    element: 'lightning',
    targetType: 'single-enemy',
    statusEffect: { type: 'spd-down', name: 'SPD Down', duration: 2, power: 0 },
    class: 'mage',
  },
  'arcane-shield': {
    id: 'arcane-shield',
    name: 'Arcane Shield',
    description: 'Raise DEF of one ally for 3 turns.',
    mpCost: 5,
    power: 0,
    healPower: 0,
    element: 'physical',
    targetType: 'single-ally',
    statusEffect: { type: 'def-up', name: 'DEF Up', duration: 3, power: 0 },
    class: 'mage',
  },

  // ─── Rogue Abilities ───
  'backstab': {
    id: 'backstab',
    name: 'Backstab',
    description: 'Strike from the shadows with high critical potential.',
    mpCost: 5,
    power: 2.0,
    healPower: 0,
    element: 'physical',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'rogue',
  },
  'poison-blade': {
    id: 'poison-blade',
    name: 'Poison Blade',
    description: 'Slash with a poisoned weapon. Poisons target for 3 turns.',
    mpCost: 6,
    power: 1.0,
    healPower: 0,
    element: 'physical',
    targetType: 'single-enemy',
    statusEffect: { type: 'poison', name: 'Poison', duration: 3, power: 5 },
    class: 'rogue',
  },
  'smoke-bomb': {
    id: 'smoke-bomb',
    name: 'Smoke Bomb',
    description: 'Lowers all enemies DEF for 2 turns.',
    mpCost: 7,
    power: 0,
    healPower: 0,
    element: 'physical',
    targetType: 'all-enemies',
    statusEffect: { type: 'def-down', name: 'DEF Down', duration: 2, power: 0 },
    class: 'rogue',
  },

  // ─── Cleric Abilities ───
  'heal': {
    id: 'heal',
    name: 'Heal',
    description: 'Restore HP to one ally.',
    mpCost: 5,
    power: 0,
    healPower: 15,
    element: 'light',
    targetType: 'single-ally',
    statusEffect: null,
    class: 'cleric',
  },
  'group-heal': {
    id: 'group-heal',
    name: 'Group Heal',
    description: 'Restore HP to all allies.',
    mpCost: 12,
    power: 0,
    healPower: 10,
    element: 'light',
    targetType: 'all-allies',
    statusEffect: null,
    class: 'cleric',
  },
  'smite': {
    id: 'smite',
    name: 'Smite',
    description: 'Channel holy light to damage one enemy.',
    mpCost: 6,
    power: 1.5,
    healPower: 0,
    element: 'light',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'cleric',
  },
  'purify': {
    id: 'purify',
    name: 'Purify',
    description: 'Remove all negative status effects from one ally and grant regen.',
    mpCost: 8,
    power: 0,
    healPower: 0,
    element: 'light',
    targetType: 'single-ally',
    statusEffect: { type: 'regen', name: 'Regen', duration: 3, power: 5 },
    class: 'cleric',
    special: 'cleanse',  // Flag for special handling: remove debuffs
  },

  // ─── Enemy-specific Abilities ───
  'slime-splash': {
    id: 'slime-splash',
    name: 'Slime Splash',
    description: 'The slime hurls a glob of goo.',
    mpCost: 0,
    power: 1.2,
    healPower: 0,
    element: 'earth',
    targetType: 'single-enemy',
    statusEffect: { type: 'spd-down', name: 'SPD Down', duration: 2, power: 0 },
    class: 'monster',
  },
  'fire-breath': {
    id: 'fire-breath',
    name: 'Fire Breath',
    description: 'Breathe scorching flames on all enemies.',
    mpCost: 8,
    power: 1.4,
    healPower: 0,
    element: 'fire',
    targetType: 'all-enemies',
    statusEffect: null,
    class: 'monster',
  },
  'dark-pulse': {
    id: 'dark-pulse',
    name: 'Dark Pulse',
    description: 'Release a wave of darkness.',
    mpCost: 6,
    power: 1.6,
    healPower: 0,
    element: 'dark',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'monster',
  },
  'regenerate': {
    id: 'regenerate',
    name: 'Regenerate',
    description: 'Slowly restore HP over time.',
    mpCost: 4,
    power: 0,
    healPower: 0,
    element: 'physical',
    targetType: 'self',
    statusEffect: { type: 'regen', name: 'Regen', duration: 3, power: 6 },
    class: 'monster',
  },
};

// ── Lookup Functions ─────────────────────────────────────────────────

/**
 * Get an ability by its ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getAbility(id) {
  return ABILITIES[id] ?? null;
}

/**
 * Get all abilities for a given class.
 * @param {string} className - 'warrior', 'mage', 'rogue', 'cleric', 'monster'
 * @returns {Array}
 */
export function getAbilitiesByClass(className) {
  return Object.values(ABILITIES).filter(a => a.class === className);
}

/**
 * Get all ability IDs.
 * @returns {string[]}
 */
export function getAllAbilityIds() {
  return Object.keys(ABILITIES);
}

/**
 * Get ability display info for UI rendering.
 * @param {string[]} abilityIds
 * @param {number} currentMp
 * @returns {Array<{ id, name, description, mpCost, canUse }>}
 */
export function getAbilityDisplayInfo(abilityIds, currentMp) {
  return abilityIds.map(id => {
    const ability = getAbility(id);
    if (!ability) return null;
    return {
      id: ability.id,
      name: ability.name,
      description: ability.description,
      mpCost: ability.mpCost,
      canUse: currentMp >= ability.mpCost,
    };
  }).filter(Boolean);
}
