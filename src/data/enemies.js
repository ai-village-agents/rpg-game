export const ENEMIES = {
  slime: {
    id: 'slime',
    name: 'Slime',
    hp: 18,
    maxHp: 18,
    mp: 0,
    maxMp: 0,
    atk: 5,
    def: 2,
    spd: 4,
    abilities: ['slime-splash'],
    element: 'earth',
    xpReward: 5,
    goldReward: 3,
    aiBehavior: 'basic',
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    hp: 22,
    maxHp: 22,
    mp: 5,
    maxMp: 5,
    atk: 7,
    def: 3,
    spd: 7,
    abilities: ['power-strike'],
    element: 'physical',
    xpReward: 8,
    goldReward: 6,
    aiBehavior: 'basic',
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    hp: 20,
    maxHp: 20,
    mp: 0,
    maxMp: 0,
    atk: 8,
    def: 2,
    spd: 12,
    abilities: ['power-strike'],
    element: 'physical',
    xpReward: 12,
    goldReward: 8,
    aiBehavior: 'aggressive',
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    hp: 28,
    maxHp: 28,
    mp: 6,
    maxMp: 6,
    atk: 9,
    def: 4,
    spd: 6,
    abilities: ['dark-pulse'],
    element: 'dark',
    xpReward: 15,
    goldReward: 10,
    aiBehavior: 'basic',
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    hp: 40,
    maxHp: 40,
    mp: 6,
    maxMp: 6,
    atk: 12,
    def: 7,
    spd: 6,
    abilities: ['power-strike', 'war-cry'],
    element: 'physical',
    xpReward: 25,
    goldReward: 18,
    aiBehavior: 'aggressive',
  },
  'fire-spirit': {
    id: 'fire-spirit',
    name: 'Fire Spirit',
    hp: 26,
    maxHp: 26,
    mp: 16,
    maxMp: 16,
    atk: 10,
    def: 3,
    spd: 9,
    abilities: ['fire-breath', 'fireball'],
    element: 'fire',
    xpReward: 22,
    goldReward: 15,
    aiBehavior: 'caster',
  },
  'ice-spirit': {
    id: 'ice-spirit',
    name: 'Ice Spirit',
    hp: 28,
    maxHp: 28,
    mp: 18,
    maxMp: 18,
    atk: 11,
    def: 4,
    spd: 8,
    abilities: ['blizzard'],
    element: 'ice',
    xpReward: 24,
    goldReward: 16,
    aiBehavior: 'caster',
  },
  'dark-cultist': {
    id: 'dark-cultist',
    name: 'Dark Cultist',
    hp: 32,
    maxHp: 32,
    mp: 20,
    maxMp: 20,
    atk: 9,
    def: 5,
    spd: 7,
    abilities: ['dark-pulse', 'heal'],
    element: 'dark',
    xpReward: 28,
    goldReward: 22,
    aiBehavior: 'support',
  },
  dragon: {
    id: 'dragon',
    name: 'Dragon',
    hp: 120,
    maxHp: 120,
    mp: 50,
    maxMp: 50,
    atk: 20,
    def: 12,
    spd: 10,
    abilities: ['fire-breath', 'power-strike', 'war-cry'],
    element: 'fire',
    xpReward: 150,
    goldReward: 120,
    aiBehavior: 'boss',
  },
  cockatrice: {
    id: 'cockatrice',
    name: 'Cockatrice',
    hp: 35,
    maxHp: 35,
    mp: 14,
    maxMp: 14,
    atk: 11,
    def: 5,
    spd: 11,
    abilities: ['stone-gaze', 'venomous-peck'],
    element: 'earth',
    xpReward: 30,
    goldReward: 24,
    aiBehavior: 'caster',
  },
};

const ENCOUNTER_TABLE = {
  1: [['slime'], ['goblin'], ['slime', 'goblin']],
  2: [['wolf'], ['skeleton'], ['wolf', 'goblin']],
  3: [['orc'], ['fire-spirit'], ['orc', 'goblin'], ['cockatrice']],
  4: [['ice-spirit'], ['dark-cultist'], ['ice-spirit', 'skeleton'], ['cockatrice', 'wolf']],
  5: [
    ['dragon'],
    ['orc', 'fire-spirit', 'dark-cultist'],
    ['dragon', 'goblin'],
  ],
};

/**
 * Get a deep copy of an enemy by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getEnemy(id) {
  const enemy = ENEMIES[id];
  if (!enemy) return null;
  return JSON.parse(JSON.stringify(enemy));
}

/**
 * Get an encounter group for a given zone level.
 * @param {number} zoneLevel - Level from 1-5
 * @returns {string[]} Array of enemy IDs
 */
export function getEncounter(zoneLevel) {
  const parsedLevel = Number(zoneLevel);
  const tier = Math.max(1, Math.min(5, Number.isFinite(parsedLevel) ? parsedLevel : 1));
  const options = ENCOUNTER_TABLE[tier] || ENCOUNTER_TABLE[1];
  const pick = options[Math.floor(Math.random() * options.length)];
  return [...pick];
}
