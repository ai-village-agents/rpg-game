import { createBestiaryState } from './bestiary.js';
import { createBountyBoardState } from './bounty-board.js';
import { createCompanionState } from './companions.js';
import { createCharacter } from './characters/character.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';
import { createComboState } from './combo-system.js';
import { characters } from './data/characters.js';
import { getEncounter, getEnemy } from './data/enemies.js';
import { DEFAULT_DIFFICULTY, applyDifficultyToEnemyHp } from './difficulty.js';
import { createReputationState } from './faction-reputation-system.js';
import { createGuildSystemState } from './guild-system.js';
import { createWorldState } from './map.js';
import { createMomentumState } from './momentum.js';
import { createNPCRelationshipManager } from './npc-relationships.js';
import { createEncounterState } from './random-encounter-system.js';
import { createTavernDiceState } from './tavern-dice.js';
import { createTutorialState } from './tutorial.js';
import { createWeatherState } from './weather.js';
import { createDailyChallengeState } from './daily-challenge-system.js';
import { createArenaState } from './arena-tournament-system.js';
import { initQuestState } from './quest-integration.js';

export function initialState() {
  const playerBase = characters.player;
  const enemyBase = characters.slime;
  const difficulty = DEFAULT_DIFFICULTY;
  const adjustedEnemyHp = applyDifficultyToEnemyHp(enemyBase.maxHp ?? enemyBase.hp, difficulty);

  return {
    version: 1,
    difficulty: DEFAULT_DIFFICULTY,
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
      hp: adjustedEnemyHp,
      maxHp: adjustedEnemyHp,
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
    bestiaryUiState: { search: '' },
    tavernDice: createTavernDiceState(),
    bountyBoard: createBountyBoardState(),
    tutorialState: createTutorialState(),
    momentumState: createMomentumState(),
    comboState: createComboState(),
    factionReputation: createReputationState(),
    guildSystemState: createGuildSystemState(),
    dailyChallengeState: createDailyChallengeState(),
    showDailyChallenges: false,
    encounterState: createEncounterState(),
    arenaState: createArenaState(),
    questState: initQuestState(),
    ...createCompanionState(),
    npcRelationshipManager: createNPCRelationshipManager(),
  };
}

export function initialStateWithClass(classId, characterName = '', difficulty = DEFAULT_DIFFICULTY) {
  if (!CLASS_DEFINITIONS[classId]) {
    throw new Error(`Unknown classId: ${classId}`);
  }

  const classDef = CLASS_DEFINITIONS[classId];
  const name = typeof characterName === 'string' && characterName.trim()
    ? characterName.trim()
    : classDef.name;
  const character = createCharacter({ name, classId });

  const encounter = getEncounter(1);
  const enemyId = encounter[0];
  const enemyBase = getEnemy(enemyId);
  const adjustedEnemyHp = applyDifficultyToEnemyHp(enemyBase.maxHp ?? enemyBase.hp, difficulty);

  return {
    version: 1,
    difficulty,
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
      hp: adjustedEnemyHp,
      maxHp: adjustedEnemyHp,
      defending: false,
    },
    log: [
      `A wild ${enemyBase.name} appears.`,
      `Your turn.`,
    ],
    world: createWorldState(),
    weatherState: createWeatherState(),
    bestiary: createBestiaryState(),
    bestiaryUiState: { search: '' },
    tavernDice: createTavernDiceState(),
    bountyBoard: createBountyBoardState(),
    tutorialState: createTutorialState(),
    momentumState: createMomentumState(),
    comboState: createComboState(),
    factionReputation: createReputationState(),
    guildSystemState: createGuildSystemState(),
    dailyChallengeState: createDailyChallengeState(),
    showDailyChallenges: false,
    encounterState: createEncounterState(),
    arenaState: createArenaState(),
    questState: initQuestState(),
    ...createCompanionState(),
    npcRelationshipManager: createNPCRelationshipManager(),
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
