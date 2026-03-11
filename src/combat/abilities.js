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
  // ─── New Enemy Abilities with Status Effects ───
  'venomous-bite': {
    id: 'venomous-bite',
    name: 'Venomous Bite',
    description: 'A toxic bite that poisons and deals damage.',
    mpCost: 0,
    power: 1.1,
    healPower: 0,
    element: 'physical',
    targetType: 'single-enemy',
    statusEffect: { type: 'poison', name: 'Poison', duration: 3, power: 4 },
    class: 'monster',
  },
  'frost-breath': {
    id: 'frost-breath',
    name: 'Frost Breath',
    description: 'Exhale freezing air, potentially freezing the target.',
    mpCost: 5,
    power: 1.3,
    healPower: 0,
    element: 'ice',
    targetType: 'single-enemy',
    statusEffect: { type: 'freeze', name: 'Freeze', duration: 1, power: 0 },
    class: 'monster',
  },
  'rending-claws': {
    id: 'rending-claws',
    name: 'Rending Claws',
    description: 'Tear into the target, causing bleeding.',
    mpCost: 0,
    power: 1.3,
    healPower: 0,
    element: 'physical',
    targetType: 'single-enemy',
    statusEffect: { type: 'bleed', name: 'Bleed', duration: 4, power: 3 },
    class: 'monster',
  },
  'blinding-flash': {
    id: 'blinding-flash',
    name: 'Blinding Flash',
    description: 'A burst of light that blinds enemies, reducing accuracy.',
    mpCost: 4,
    power: 0.6,
    healPower: 0,
    element: 'light',
    targetType: 'all-enemies',
    statusEffect: { type: 'blind', name: 'Blind', duration: 2, power: 0 },
    class: 'monster',
  },
  'silence-hex': {
    id: 'silence-hex',
    name: 'Silence Hex',
    description: 'A dark hex that prevents spellcasting for 2 turns.',
    mpCost: 6,
    power: 0.5,
    healPower: 0,
    element: 'dark',
    targetType: 'single-enemy',
    statusEffect: { type: 'silence', name: 'Silence', duration: 2, power: 0 },
    class: 'monster',
  },
  'death-curse': {
    id: 'death-curse',
    name: 'Death Curse',
    description: 'Lay a terrible curse that weakens the target.',
    mpCost: 8,
    power: 0.8,
    healPower: 0,
    element: 'dark',
    targetType: 'single-enemy',
    statusEffect: { type: 'curse', name: 'Curse', duration: 3, power: 0 },
    class: 'monster',
  },
  'flame-lash': {
    id: 'flame-lash',
    name: 'Flame Lash',
    description: 'A whip of fire that burns the target.',
    mpCost: 4,
    power: 1.2,
    healPower: 0,
    element: 'fire',
    targetType: 'single-enemy',
    statusEffect: { type: 'burn', name: 'Burn', duration: 3, power: 4 },
    class: 'monster',
  },
  'howl': {
    id: 'howl',
    name: 'Howl',
    description: 'A terrifying howl that lowers all enemies ATK.',
    mpCost: 3,
    power: 0,
    healPower: 0,
    element: 'physical',
    targetType: 'all-enemies',
    statusEffect: { type: 'atk-down', name: 'ATK Down', duration: 3, power: 0 },
    class: 'monster',
  },
  'shadow-strike': {
    id: 'shadow-strike',
    name: 'Shadow Strike',
    description: 'Strike from the shadows with dark energy.',
    mpCost: 5,
    power: 1.7,
    healPower: 0,
    element: 'dark',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'monster',
  },
  'web-trap': {
    id: 'web-trap',
    name: 'Web Trap',
    description: 'Shoot sticky webs that slow the target.',
    mpCost: 0,
    power: 0.5,
    healPower: 0,
    element: 'earth',
    targetType: 'single-enemy',
    statusEffect: { type: 'spd-down', name: 'SPD Down', duration: 3, power: 0 },
    class: 'monster',
  },
  'drain-life': {
    id: 'drain-life',
    name: 'Drain Life',
    description: 'Siphon life force from the target.',
    mpCost: 6,
    power: 1.2,
    healPower: 0,
    element: 'dark',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'monster',
    special: 'lifedrain',
  },
  'thunderclap': {
    id: 'thunderclap',
    name: 'Thunderclap',
    description: 'A massive thunderclap that stuns all enemies.',
    mpCost: 10,
    power: 1.0,
    healPower: 0,
    element: 'lightning',
    targetType: 'all-enemies',
    statusEffect: { type: 'stun', name: 'Stun', duration: 1, power: 0 },
    class: 'monster',
  },
  'void-eruption': {
    id: 'void-eruption',
    name: 'Void Eruption',
    description: 'Unleash a violent eruption of void energy that hits all enemies.',
    mpCost: 20,
    power: 2.2,
    healPower: 0,
    element: 'shadow',
    targetType: 'all-enemies',
    statusEffect: { type: 'curse', name: 'Curse', duration: 3, power: 0 },
    class: 'monster',
  },
  'shadow-bind': {
    id: 'shadow-bind',
    name: 'Shadow Bind',
    description: 'Bind the target in shadow chains, silencing and slowing them.',
    mpCost: 12,
    power: 1.0,
    healPower: 0,
    element: 'shadow',
    targetType: 'single-enemy',
    statusEffect: { type: 'silence', name: 'Silence', duration: 3, power: 0 },
    class: 'monster',
  },
  'abyss-pulse': {
    id: 'abyss-pulse',
    name: 'Abyss Pulse',
    description: 'Send a pulse of abyssal energy that deals massive shadow damage.',
    mpCost: 18,
    power: 2.8,
    healPower: 0,
    element: 'shadow',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'monster',
  },
  'dark-dominion': {
    id: 'dark-dominion',
    name: 'Dark Dominion',
    description: 'Assert dark dominion — raise own ATK and lower enemy DEF.',
    mpCost: 15,
    power: 0,
    healPower: 0,
    element: 'shadow',
    targetType: 'self',
    statusEffect: { type: 'atk-up', name: 'ATK Up', duration: 4, power: 0 },
    class: 'monster',
    special: 'buff',
  },
  'soul-drain': {
    id: 'soul-drain',
    name: 'Soul Drain',
    description: 'Drain the life force of the target, healing self for 50% of damage dealt.',
    mpCost: 22,
    power: 1.9,
    healPower: 0,
    element: 'shadow',
    targetType: 'single-enemy',
    statusEffect: null,
    class: 'monster',
    special: 'lifedrain',
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
