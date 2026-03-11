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
  },

  'lich-king': {
    id: 'lich-king',
    name: 'Lich King',
    description: 'An ancient sorcerer who conquered death itself, ruling an empire of undying servants from his throne of bone.',
    isBoss: true,
    element: 'shadow',
    phases: [
      {
        phase: 1,
        name: 'Necromantic Majesty',
        hpThreshold: 1.0,
        maxHp: 350,
        mp: 120,
        maxMp: 120,
        atk: 22,
        def: 16,
        spd: 12,
        abilities: ['soul-bolt', 'bone-armor', 'raise-dead'],
        aiBehavior: 'caster',
        dialogue: 'Kneel before eternity.'
      },
      {
        phase: 2,
        name: 'Phylactery Unleashed',
        hpThreshold: 0.55,
        maxHp: 350,
        mp: 120,
        maxMp: 120,
        atk: 28,
        def: 12,
        spd: 15,
        abilities: ['soul-bolt', 'death-wave', 'raise-dead', 'soul-drain'],
        aiBehavior: 'aggressive',
        dialogue: 'My phylactery sustains me. You cannot win!'
      },
      {
        phase: 3,
        name: 'Undying Fury',
        hpThreshold: 0.2,
        maxHp: 350,
        mp: 120,
        maxMp: 120,
        atk: 34,
        def: 8,
        spd: 18,
        abilities: ['death-wave', 'soul-drain', 'necrotic-storm'],
        aiBehavior: 'aggressive',
        dialogue: 'Even in death, I am supreme!'
      }
    ],
    xpReward: 500,
    goldReward: 350,
    drops: [{ itemId: 'lich-crown', chance: 1.0 }, { itemId: 'shadow-essence', chance: 0.6 }, { itemId: 'ether', chance: 0.8 }]
  },

  'primordial-titan': {
    id: 'primordial-titan',
    name: 'Primordial Titan',
    description: 'A being of raw creation energy, the first and mightiest force ever to walk the world.',
    isBoss: true,
    element: 'arcane',
    phases: [
      {
        phase: 1,
        name: 'Awakening of Ages',
        hpThreshold: 1.0,
        maxHp: 500,
        mp: 150,
        maxMp: 150,
        atk: 28,
        def: 20,
        spd: 10,
        abilities: ['primal-slam', 'creation-pulse', 'gravity-well'],
        aiBehavior: 'basic',
        dialogue: 'You dare approach the origin of all things?'
      },
      {
        phase: 2,
        name: 'Unraveling Reality',
        hpThreshold: 0.6,
        maxHp: 500,
        mp: 150,
        maxMp: 150,
        atk: 35,
        def: 16,
        spd: 14,
        abilities: ['primal-slam', 'reality-tear', 'gravity-well', 'cosmic-ray'],
        aiBehavior: 'aggressive',
        dialogue: 'Reality bends to MY will!'
      },
      {
        phase: 3,
        name: 'Cataclysm',
        hpThreshold: 0.3,
        maxHp: 500,
        mp: 150,
        maxMp: 150,
        atk: 42,
        def: 10,
        spd: 18,
        abilities: ['reality-tear', 'cosmic-ray', 'primordial-wrath', 'creation-pulse'],
        aiBehavior: 'aggressive',
        dialogue: 'I will unmake everything and begin anew!'
      },
      {
        phase: 4,
        name: 'Final Convergence',
        hpThreshold: 0.1,
        maxHp: 500,
        mp: 150,
        maxMp: 150,
        atk: 50,
        def: 5,
        spd: 22,
        abilities: ['primordial-wrath', 'cosmic-ray', 'reality-tear'],
        aiBehavior: 'aggressive',
        dialogue: 'This... cannot... be...'
      }
    ],
    xpReward: 1000,
    goldReward: 750,
    drops: [{ itemId: 'primordial-shard', chance: 1.0 }, { itemId: 'fire-gem', chance: 1.0 }, { itemId: 'dragon-scale', chance: 0.8 }]
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
  },
  // Lich King abilities
  'soul-bolt': {
    id: 'soul-bolt',
    name: 'Soul Bolt',
    type: 'magical',
    power: 30,
    mpCost: 10,
    description: 'Hurls a bolt of necrotic energy that pierces the soul.',
    element: 'shadow',
    effect: { type: 'mp-drain', duration: 1, power: 8, chance: 0.6 }
  },
  'bone-armor': {
    id: 'bone-armor',
    name: 'Bone Armor',
    type: 'buff',
    power: 0,
    mpCost: 15,
    description: 'Encases the Lich in a shield of animated bones.',
    element: 'shadow',
    effect: { type: 'def-up', duration: 3, power: 8, chance: 1.0 }
  },
  'raise-dead': {
    id: 'raise-dead',
    name: 'Raise Dead',
    type: 'magical',
    power: 20,
    mpCost: 20,
    description: 'Summons skeletal minions to attack the target.',
    element: 'shadow',
    effect: { type: 'atk-up', duration: 2, power: 5, chance: 0.8 }
  },
  'death-wave': {
    id: 'death-wave',
    name: 'Death Wave',
    type: 'magical',
    power: 45,
    mpCost: 25,
    description: 'Unleashes a wave of death energy that withers all life.',
    element: 'shadow',
    effect: { type: 'poison', duration: 3, power: 6, chance: 0.7 }
  },
  'soul-drain': {
    id: 'soul-drain',
    name: 'Soul Drain',
    type: 'magical',
    power: 35,
    mpCost: 18,
    description: 'Drains the target\'s life force to heal the Lich.',
    element: 'shadow',
    effect: { type: 'heal', duration: 1, power: 20, chance: 1.0 }
  },
  'necrotic-storm': {
    id: 'necrotic-storm',
    name: 'Necrotic Storm',
    type: 'magical',
    power: 55,
    mpCost: 35,
    description: 'A devastating storm of pure death magic that shreds body and spirit.',
    element: 'shadow',
    effect: { type: 'poison', duration: 4, power: 8, chance: 0.9 }
  },

  // Primordial Titan abilities
  'primal-slam': {
    id: 'primal-slam',
    name: 'Primal Slam',
    type: 'physical',
    power: 40,
    mpCost: 10,
    description: 'A devastating blow channeling the raw force of creation.',
    element: 'arcane',
    effect: { type: 'stun', duration: 1, power: 0, chance: 0.4 }
  },
  'creation-pulse': {
    id: 'creation-pulse',
    name: 'Creation Pulse',
    type: 'magical',
    power: 25,
    mpCost: 20,
    description: 'Releases a pulse of creation energy that heals and empowers.',
    element: 'arcane',
    effect: { type: 'heal', duration: 1, power: 30, chance: 1.0 }
  },
  'gravity-well': {
    id: 'gravity-well',
    name: 'Gravity Well',
    type: 'magical',
    power: 35,
    mpCost: 22,
    description: 'Creates a localized gravity anomaly that crushes the target.',
    element: 'arcane',
    effect: { type: 'spd-down', duration: 3, power: 6, chance: 0.8 }
  },
  'reality-tear': {
    id: 'reality-tear',
    name: 'Reality Tear',
    type: 'magical',
    power: 50,
    mpCost: 30,
    description: 'Rips a hole in the fabric of reality, dealing massive arcane damage.',
    element: 'arcane',
    effect: { type: 'def-down', duration: 2, power: 5, chance: 0.6 }
  },
  'cosmic-ray': {
    id: 'cosmic-ray',
    name: 'Cosmic Ray',
    type: 'magical',
    power: 45,
    mpCost: 25,
    description: 'Focuses stellar energy into a devastating beam.',
    element: 'arcane',
    effect: { type: 'burn', duration: 3, power: 7, chance: 0.7 }
  },
  'primordial-wrath': {
    id: 'primordial-wrath',
    name: 'Primordial Wrath',
    type: 'magical',
    power: 65,
    mpCost: 40,
    description: 'Channels the fury of creation itself in a cataclysmic blast.',
    element: 'arcane',
    effect: { type: 'stun', duration: 1, power: 0, chance: 0.5 }
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
