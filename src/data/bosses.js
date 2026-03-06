/**
 * Boss enemy definitions for the RPG game
 * Bosses have multiple phases with different stats and abilities
 */

export const BOSSES = {
  'forest-guardian': {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    description: 'An ancient tree spirit that protects the Eastern Woods.',
    isBoss: true,
    element: 'nature',
    phases: [
      {
        phase: 1,
        name: 'Awakening',
        hpThreshold: 1.0,
        maxHp: 150,
        mp: 50,
        maxMp: 50,
        atk: 14,
        def: 8,
        spd: 5,
        abilities: ['vine-whip', 'nature-shield'],
        aiBehavior: 'basic',
        dialogue: 'You dare disturb my forest?'
      },
      {
        phase: 2,
        name: 'Enraged',
        hpThreshold: 0.5,
        maxHp: 150,
        mp: 50,
        maxMp: 50,
        atk: 18,
        def: 6,
        spd: 7,
        abilities: ['vine-whip', 'thorn-storm', 'regenerate'],
        aiBehavior: 'aggressive',
        dialogue: 'You will pay for this transgression!'
      }
    ],
    xpReward: 150,
    goldReward: 100,
    drops: [{ itemId: 'guardian-bark', chance: 1.0 }, { itemId: 'hi-potion', chance: 0.5 }]
  },
  
  'fire-drake': {
    id: 'fire-drake',
    name: 'Fire Drake',
    description: 'A fearsome dragon that dwells in the volcanic caves.',
    isBoss: true,
    element: 'fire',
    phases: [
      {
        phase: 1,
        name: 'Prowling',
        hpThreshold: 1.0,
        maxHp: 200,
        mp: 60,
        maxMp: 60,
        atk: 16,
        def: 10,
        spd: 8,
        abilities: ['fire-breath', 'claw-slash'],
        aiBehavior: 'basic',
        dialogue: 'Another foolish adventurer...'
      },
      {
        phase: 2,
        name: 'Furious',
        hpThreshold: 0.6,
        maxHp: 200,
        mp: 60,
        maxMp: 60,
        atk: 20,
        def: 8,
        spd: 10,
        abilities: ['fire-breath', 'inferno', 'tail-swipe'],
        aiBehavior: 'aggressive',
        dialogue: 'Feel my flames!'
      },
      {
        phase: 3,
        name: 'Desperate',
        hpThreshold: 0.25,
        maxHp: 200,
        mp: 60,
        maxMp: 60,
        atk: 24,
        def: 5,
        spd: 12,
        abilities: ['inferno', 'desperate-strike', 'self-immolate'],
        aiBehavior: 'aggressive',
        dialogue: 'I will not fall here!'
      }
    ],
    xpReward: 300,
    goldReward: 200,
    drops: [{ itemId: 'dragon-scale', chance: 1.0 }, { itemId: 'fire-gem', chance: 0.3 }]
  },
  
  'shadow-wraith': {
    id: 'shadow-wraith',
    name: 'Shadow Wraith',
    description: 'A malevolent spirit from the realm of darkness.',
    isBoss: true,
    element: 'shadow',
    phases: [
      {
        phase: 1,
        name: 'Ethereal',
        hpThreshold: 1.0,
        maxHp: 180,
        mp: 80,
        maxMp: 80,
        atk: 12,
        def: 12,
        spd: 10,
        abilities: ['shadow-bolt', 'phase-shift', 'life-drain'],
        aiBehavior: 'caster',
        dialogue: 'Your soul will be mine...'
      },
      {
        phase: 2,
        name: 'Corporeal',
        hpThreshold: 0.4,
        maxHp: 180,
        mp: 80,
        maxMp: 80,
        atk: 18,
        def: 6,
        spd: 14,
        abilities: ['shadow-bolt', 'nightmare', 'dark-embrace'],
        aiBehavior: 'aggressive',
        dialogue: 'You cannot escape the darkness!'
      }
    ],
    xpReward: 250,
    goldReward: 150,
    drops: [{ itemId: 'shadow-essence', chance: 1.0 }, { itemId: 'ether', chance: 0.5 }]
  }
};

/**
 * Boss ability definitions
 */
export const BOSS_ABILITIES = {
  // Forest Guardian abilities
  'vine-whip': {
    element: 'nature',
    id: 'vine-whip',
    name: 'Vine Whip',
    type: 'physical',
    power: 25,
    mpCost: 0,
    description: 'Strikes with thorny vines.',
    effect: null
  },
  'nature-shield': {
    id: 'nature-shield',
    name: 'Nature Shield',
    element: 'nature',
    type: 'buff',
    power: 0,
    mpCost: 10,
    description: 'Raises defense temporarily.',
    effect: { type: 'def-up', duration: 3, power: 5 }
  },
  'thorn-storm': {
    id: 'thorn-storm',
    name: 'Thorn Storm',
    type: 'magical',
    power: 35,
    mpCost: 15,
    description: 'Unleashes a storm of thorns.',
    element: 'nature',
    effect: null
  },
  'regenerate': {
    id: 'regenerate',
    name: 'Regenerate',
    element: 'nature',
    type: 'heal',
    power: 20,
    mpCost: 12,
    description: 'Heals over time.',
    effect: { type: 'regen', duration: 3, power: 10 }
  },
  
  // Fire Drake abilities
  'fire-breath': {
    id: 'fire-breath',
    name: 'Fire Breath',
    type: 'magical',
    power: 30,
    mpCost: 8,
    description: 'Breathes scorching flames.',
    element: 'fire',
    effect: { type: 'burn', duration: 2, power: 5, chance: 0.3 }
  },
  'claw-slash': {
    id: 'claw-slash',
    name: 'Claw Slash',
    element: 'physical',
    type: 'physical',
    power: 28,
    mpCost: 0,
    description: 'Slashes with razor claws.',
    effect: null
  },
  'inferno': {
    id: 'inferno',
    name: 'Inferno',
    type: 'magical',
    power: 45,
    mpCost: 18,
    description: 'Engulfs the area in flames.',
    element: 'fire',
    effect: { type: 'burn', duration: 3, power: 8, chance: 0.5 }
  },
  'tail-swipe': {
    id: 'tail-swipe',
    name: 'Tail Swipe',
    element: 'physical',
    type: 'physical',
    power: 22,
    mpCost: 0,
    description: 'A powerful tail attack.',
    effect: { type: 'stun', duration: 1, chance: 0.2 }
  },
  'desperate-strike': {
    id: 'desperate-strike',
    name: 'Desperate Strike',
    element: 'physical',
    type: 'physical',
    power: 50,
    mpCost: 0,
    description: 'A reckless all-out attack.',
    effect: null
  },
  'self-immolate': {
    id: 'self-immolate',
    name: 'Self-Immolate',
    element: 'fire',
    type: 'buff',
    power: 0,
    mpCost: 20,
    description: 'Surrounds self in flames, boosting attack.',
    effect: { type: 'atk-up', duration: 3, power: 8 }
  },
  
  // Shadow Wraith abilities
  'shadow-bolt': {
    id: 'shadow-bolt',
    name: 'Shadow Bolt',
    type: 'magical',
    power: 28,
    mpCost: 6,
    description: 'Hurls a bolt of dark energy.',
    element: 'shadow',
    effect: null
  },
  'phase-shift': {
    id: 'phase-shift',
    name: 'Phase Shift',
    element: 'shadow',
    type: 'buff',
    power: 0,
    mpCost: 15,
    description: 'Becomes partially incorporeal.',
    effect: { type: 'def-up', duration: 2, power: 10 }
  },
  'life-drain': {
    id: 'life-drain',
    name: 'Life Drain',
    type: 'drain',
    power: 25,
    mpCost: 12,
    description: 'Drains life from the target.',
    element: 'shadow',
    healPercent: 0.5
  },
  'nightmare': {
    id: 'nightmare',
    name: 'Nightmare',
    type: 'magical',
    power: 20,
    mpCost: 10,
    description: 'Invades the mind with terror.',
    element: 'shadow',
    effect: { type: 'sleep', duration: 2, chance: 0.4 }
  },
  'dark-embrace': {
    id: 'dark-embrace',
    name: 'Dark Embrace',
    type: 'magical',
    power: 40,
    mpCost: 20,
    description: 'Envelops the target in darkness.',
    element: 'shadow',
    effect: { type: 'atk-down', duration: 3, power: 4, chance: 0.5 }
  }
};

/**
 * Get a boss by ID
 * @param {string} bossId - The boss identifier
 * @returns {Object|null} Boss data or null if not found
 */
export function getBoss(bossId) {
  return BOSSES[bossId] || null;
}

/**
 * Get a boss ability by ID
 * @param {string} abilityId - The ability identifier
 * @returns {Object|null} Ability data or null if not found
 */
export function getBossAbility(abilityId) {
  return BOSS_ABILITIES[abilityId] || null;
}

/**
 * Get all boss IDs
 * @returns {string[]} Array of boss IDs
 */
export function getAllBossIds() {
  return Object.keys(BOSSES);
}
