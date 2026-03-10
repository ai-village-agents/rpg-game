import {
  createDungeonState,
  enterDungeon,
  exitDungeon,
  getFloorData,
  advanceFloor,
  clearFloor,
  findStairs,
  canAdvance,
  getScaledEnemy,
  canEnterDungeon,
  getBossForFloor,
  getDungeonProgress,
  DUNGEON_FLOORS,
} from '../dungeon-floors.js';
import { ENEMIES } from '../data/enemies.js';
import { pushLog } from '../state.js';
import { nextRng } from '../combat.js';

export function handleDungeonAction(state, action) {
  if (!action || !action.type) {
    return null;
  }

  if (action.type === 'ENTER_DUNGEON') {
    if (state.phase !== 'exploration') {
      return null;
    }

    if (!canEnterDungeon(state.player.level)) {
      return pushLog(state, 'You must be at least level 3 to enter the dungeon.');
    }

    const dungeonState = enterDungeon(state.dungeonState || createDungeonState());

    return pushLog(
      {
        ...state,
        dungeonState,
        phase: 'dungeon',
      },
      'You descend into the dungeon...'
    );
  }

  if (action.type === 'DUNGEON_SEARCH') {
    if (state.phase !== 'dungeon' || !state.dungeonState?.inDungeon) {
      return null;
    }

    const floorData = getFloorData(state.dungeonState.currentFloor);
    if (!floorData) {
      return pushLog(state, 'Something is wrong with this floor.');
    }

    const rng = nextRng(state.rngSeed || Date.now());
    const next = { ...state, rngSeed: rng.seed };
    const roll = rng.value;

    if (roll < floorData.encounterRate) {
      const poolIndex = Math.floor((rng.value * 1000) % floorData.enemyPool.length);
      const enemyId = floorData.enemyPool[poolIndex];
      const enemyBase = ENEMIES[enemyId];
      if (!enemyBase) {
        return pushLog(next, 'You search but find nothing unusual.');
      }

      const scaled = getScaledEnemy(enemyBase, state.dungeonState.currentFloor);
      const enemy = {
        ...scaled,
        hp: scaled.maxHp,
        defending: false,
        statusEffects: [],
      };

      return pushLog(
        pushLog(
          {
            ...next,
            enemy,
            phase: 'player-turn',
            turn: 1,
            player: {
              ...next.player,
              defending: false,
              statusEffects: [],
            },
            inDungeonCombat: true,
          },
          'You search the floor...'
        ),
        `A ${enemy.name} attacks! (Floor ${state.dungeonState.currentFloor})`
      );
    }

    if (roll < floorData.encounterRate + 0.25 && !state.dungeonState.stairsFound) {
      const dungeonState = findStairs(state.dungeonState);
      return pushLog(
        {
          ...next,
          dungeonState,
        },
        'You discover a stairway leading deeper!'
      );
    }

    return pushLog(next, 'You search the area but find nothing of interest.');
  }

  if (action.type === 'DUNGEON_ADVANCE') {
    if (state.phase !== 'dungeon' || !state.dungeonState?.inDungeon) {
      return null;
    }

    if (!canAdvance(state.dungeonState)) {
      if (!state.dungeonState.stairsFound) {
        return pushLog(state, 'You need to find the stairs before advancing.');
      }

      return pushLog(state, 'You cannot advance right now.');
    }

    if (state.dungeonState.currentFloor >= 10) {
      return pushLog(state, 'You have reached the deepest floor. There is nowhere deeper to go.');
    }

    const dungeonState = advanceFloor(state.dungeonState);
    const floorData = getFloorData(dungeonState.currentFloor);

    if (!floorData) {
      return pushLog({
        ...state,
        dungeonState,
      }, 'You descend, but the path feels unstable.');
    }

    return pushLog(
      {
        ...state,
        dungeonState,
      },
      `You descend to floor ${dungeonState.currentFloor}.`
    );
  }

  if (action.type === 'DUNGEON_FIGHT_BOSS') {
    if (state.phase !== 'dungeon' || !state.dungeonState?.inDungeon) {
      return null;
    }

    const floorData = getFloorData(state.dungeonState.currentFloor);
    if (!floorData || !floorData.bossFloor) {
      return pushLog(state, 'There is no boss on this floor.');
    }

    if (state.dungeonState.floorsCleared?.includes(state.dungeonState.currentFloor)) {
      return pushLog(state, 'You have already defeated the boss of this floor.');
    }

    const bossId = getBossForFloor(state.dungeonState.currentFloor);
    const enemyBase = ENEMIES[bossId];
    if (!enemyBase) {
      return pushLog(state, 'The boss cannot be found.');
    }

    const scaled = getScaledEnemy(enemyBase, state.dungeonState.currentFloor);
    const enemy = {
      ...scaled,
      hp: scaled.maxHp,
      defending: false,
      statusEffects: [],
    };

    return pushLog(
      pushLog(
        {
          ...state,
          enemy,
          phase: 'player-turn',
          turn: 1,
          player: {
            ...state.player,
            defending: false,
            statusEffects: [],
          },
          inDungeonCombat: true,
          dungeonBossFight: true,
        },
        'You challenge the floor boss!'
      ),
      `A mighty ${enemy.name} appears!`
    );
  }

  if (action.type === 'DUNGEON_EXIT') {
    if (state.phase !== 'dungeon') {
      return null;
    }

    const dungeonState = exitDungeon(state.dungeonState || createDungeonState());

    const { inDungeonCombat, ...rest } = state;

    return pushLog(
      {
        ...rest,
        dungeonState,
        phase: 'exploration',
      },
      'You leave the dungeon and return to the surface.'
    );
  }

  if (action.type === 'DUNGEON_RETURN') {
    if (!state.inDungeonCombat) {
      return null;
    }

    let dungeonState = state.dungeonState;
    if (state.dungeonBossFight && dungeonState) {
      dungeonState = clearFloor(dungeonState);
    }

    const { inDungeonCombat, dungeonBossFight, ...rest } = state;

    return pushLog(
      {
        ...rest,
        dungeonState,
        phase: 'dungeon',
      },
      'You continue exploring the dungeon.'
    );
  }

  return null;
}
