import { createTavernDiceState } from './tavern-dice.js';
import { characters } from './data/characters.js';
import { createCharacter } from './characters/character.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';
import { getEncounter, getEnemy } from './data/enemies.js';
import { createWorldState } from './map.js';
import { createWeatherState } from './weather.js';
import { createBestiaryState } from './bestiary.js';
import { createCompanionState } from './companions.js';

export function initialState() {
  const playerBase = characters.player;
  const enemyBase = characters.slime;

  return {
    version: 1,
    rngSeed: Date.now() % 2147483647,
    phase: 'player-turn', // player-turn | enemy-turn | victory | defeat
    turn: 1,
    player: {
      name: playerBase.name,
      hp: playerBase.maxHp,
      maxHp: playerBase.maxHp,
      atk: playerBase.atk,
      def: playerBase.def,
      defending: false,
      inventory: { potion: 2 },
    },
    enemy: {
      name: enemyBase.name,
      hp: enemyBase.maxHp,
      maxHp: enemyBase.maxHp,
      atk: enemyBase.atk,
      def: enemyBase.def,
      defending: false,
    },
    log: [
      `A wild ${enemyBase.name} appears.`,
      `Your turn.`,
    ],
    world: createWorldState(),
    weatherState: createWeatherState(),
    bestiary: createBestiaryState(),
    tavernDice: createTavernDiceState(),
    ...createCompanionState(),
  };
}

export function initialStateWithClass(classId) {
  if (!CLASS_DEFINITIONS[classId]) {
    throw new Error(`Unknown classId: ${classId}`);
  }

  const name = classId === 'warrior'
    ? 'Warrior'
    : classId === 'mage'
      ? 'Mage'
      : classId === 'rogue'
        ? 'Rogue'
        : 'Cleric';
  const classDef = CLASS_DEFINITIONS[classId];
  const character = createCharacter({ name, classId });

  const encounter = getEncounter(1);
  const enemyId = encounter[0];
  const enemyBase = getEnemy(enemyId);

  return {
    version: 1,
    rngSeed: Date.now() % 2147483647,
    phase: 'player-turn', // player-turn | enemy-turn | victory | defeat
    turn: 1,
    player: {
      name: character.name,
      hp: character.stats.hp,
      maxHp: character.stats.maxHp ?? character.stats.hp,
      mp: character.stats.mp,
      maxMp: character.stats.maxMp ?? character.stats.mp,
      atk: character.stats.atk,
      def: character.stats.def,
      spd: character.stats.spd,
      classId,
      abilities: classDef.abilities,
      level: 1,
      xp: 0,
      defending: false,
      inventory: { potion: 3 },
    },
    enemy: {
      ...enemyBase,
      hp: enemyBase.maxHp ?? enemyBase.hp,
      maxHp: enemyBase.maxHp ?? enemyBase.hp,
      defending: false,
    },
    log: [
      `A wild ${enemyBase.name} appears.`,
      `Your turn.`,
    ],
    world: createWorldState(),
    weatherState: createWeatherState(),
    bestiary: createBestiaryState(),
    tavernDice: createTavernDiceState(),
    ...createCompanionState(),
  };
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function pushLog(state, line) {
  // keep last 200 lines
  const log = [...state.log, line].slice(-200);
  return { ...state, log };
}

export function saveToLocalStorage(state) {
  const payload = JSON.stringify(state);
  localStorage.setItem('aiVillageRpgSave', payload);
}

export function loadFromLocalStorage() {
  const raw = localStorage.getItem('aiVillageRpgSave');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}
