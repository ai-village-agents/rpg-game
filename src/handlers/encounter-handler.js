/**
 * Random Encounter Handler
 * Handles actions related to the random encounter system
 */

import {
  checkForEncounter,
  resolveEncounter,
  addEncounterModifier,
  removeEncounterModifier,
  clearExpiredModifiers,
  getEncounterStats,
  LOCATION_TYPE,
} from '../random-encounter-system.js';
import { getEnemy } from '../data/enemies.js';
import { applyDifficultyToEnemyHp } from '../difficulty.js';
import { getEnemyShieldData } from '../shield-break.js';
import { initIntentState } from '../enemy-intent.js';
import { createMomentumState } from '../momentum.js';
import { recordEncounter } from '../bestiary.js';
import { initCombatBattleLog } from '../combat-battle-log-integration.js';
import { isEnemyAttacksFirst } from '../world-events.js';
import { pushLog } from '../state.js';

// Map from (row, col) to room ID
const ROOM_GRID = [
  ['nw', 'n', 'ne'],
  ['w', 'center', 'e'],
  ['sw', 's', 'se'],
];

/**
 * Get room ID from row/col coordinates
 */
function getRoomIdFromCoords(roomRow, roomCol) {
  if (roomRow >= 0 && roomRow < 3 && roomCol >= 0 && roomCol < 3) {
    return ROOM_GRID[roomRow][roomCol];
  }
  return 'center';
}

/**
 * Map world room IDs to encounter location types
 */
function mapRoomToLocationType(roomId) {
  const mappings = {
    'nw': LOCATION_TYPE.FOREST,
    'n': LOCATION_TYPE.MOUNTAIN,
    'ne': LOCATION_TYPE.RUINS,
    'w': LOCATION_TYPE.SWAMP,
    'center': LOCATION_TYPE.TOWN,
    'e': LOCATION_TYPE.ROAD,
    'sw': LOCATION_TYPE.CAVE,
    's': LOCATION_TYPE.FOREST,
    'se': LOCATION_TYPE.DUNGEON,
  };
  return mappings[roomId] || LOCATION_TYPE.ROAD;
}

/**
 * Get current room ID from state
 * Supports both coordinate-based (roomRow/roomCol) and direct (currentRoom) lookups
 */
function getCurrentRoomId(state) {
  // Direct room ID takes priority if set
  if (state.world?.currentRoom) {
    return state.world.currentRoom;
  }
  const roomRow = state.world?.roomRow ?? 1;
  const roomCol = state.world?.roomCol ?? 1;
  return getRoomIdFromCoords(roomRow, roomCol);
}

/**
 * Handle encounter-related actions
 * @param {Object} state - Game state
 * @param {Object} action - Action to handle
 * @returns {Object|null} Updated state or null if action not handled
 */
export function handleEncounterAction(state, action) {
  const { type, payload } = action;

  switch (type) {
    case 'TRIGGER_RANDOM_ENCOUNTER': {
      const roomId = getCurrentRoomId(state);
      const locationType = mapRoomToLocationType(roomId);
      const playerLevel = state.player?.level || 1;
      
      const result = checkForEncounter(
        state.encounterState,
        locationType,
        playerLevel
      );

      if (result.encounter) {
        return {
          ...state,
          encounterState: result.state,
          currentEncounter: result.encounter,
          phase: 'random-encounter',
          previousPhase: state.phase,
        };
      }

      return {
        ...state,
        encounterState: result.state,
      };
    }

    case 'OPEN_ENCOUNTER_STATS': {
      return {
        ...state,
        phase: 'encounter-stats',
        previousPhase: state.phase,
      };
    }

    case 'CLOSE_ENCOUNTER_STATS': {
      return {
        ...state,
        phase: state.previousPhase || 'exploration',
      };
    }

    case 'RESOLVE_ENCOUNTER': {
      const { outcome, details } = payload || {};
      const result = resolveEncounter(
        state.encounterState,
        state.currentEncounter,
        outcome,
        details
      );

      // Extract state from result object
      return {
        ...state,
        encounterState: result.state,
        currentEncounter: null,
        phase: state.previousPhase || 'exploration',
      };
    }

    case 'FLEE_ENCOUNTER': {
      // Use 'flee' to match the outcome string expected by resolveEncounter
      const result = resolveEncounter(
        state.encounterState,
        state.currentEncounter,
        'flee',
        {}
      );

      // Extract state from result object
      return {
        ...state,
        encounterState: result.state,
        currentEncounter: null,
        phase: state.previousPhase || 'exploration',
      };
    }

    case 'ENGAGE_ENCOUNTER': {
      if (state.currentEncounter?.enemies && state.currentEncounter.enemies.length > 0) {
        const enemyId = state.currentEncounter.enemies[0];
        const enemyBase = getEnemy(enemyId);
        
        if (enemyBase) {
          const difficulty = state.difficulty || 'normal';
          const adjustedHp = applyDifficultyToEnemyHp(enemyBase.maxHp ?? enemyBase.hp, difficulty);
          
          let next = {
            ...state,
            enemy: {
              ...enemyBase,
              hp: adjustedHp,
              maxHp: adjustedHp,
              defending: false,
              statusEffects: [],
              ...getEnemyShieldData(enemyId),
              isBroken: false,
              breakTurnsRemaining: 0,
            },
            phase: 'player-turn',
            turn: 1,
            combatStats: null,
            combatStatsSummary: null,
            player: { ...state.player, defending: false, statusEffects: [] },
            momentumState: state.momentumState ? createMomentumState() : undefined,
            intentState: initIntentState(),
            encounterCombatActive: true,
            currentEnemyId: enemyId,
            bestiary: recordEncounter(state.bestiary || { encountered: [], defeatedCounts: {} }, enemyId),
          };

          if (isEnemyAttacksFirst(next.worldEvent || state.worldEvent)) {
            next = { ...next, phase: 'enemy-turn' };
            next = pushLog(next, 'The enemy strikes first!');
          }

          next = pushLog(next, 'A wild ' + (enemyBase.displayName || enemyBase.name) + ' appears!');
          initCombatBattleLog();
          next = pushLog(next, 'Your turn.');
          return next;
        }
      }
      return state;
    }

    case 'ADD_ENCOUNTER_MODIFIER': {
      const { modifier } = payload || {};
      if (!modifier) return state;

      const updatedState = addEncounterModifier(state.encounterState, modifier);
      return {
        ...state,
        encounterState: updatedState,
      };
    }

    case 'REMOVE_ENCOUNTER_MODIFIER': {
      const { modifierId } = payload || {};
      if (!modifierId) return state;

      const updatedState = removeEncounterModifier(state.encounterState, modifierId);
      return {
        ...state,
        encounterState: updatedState,
      };
    }

    case 'CLEAR_EXPIRED_MODIFIERS': {
      const updatedState = clearExpiredModifiers(state.encounterState);
      return {
        ...state,
        encounterState: updatedState,
      };
    }

    default:
      return null;
  }
}

/**
 * Check if random encounter should trigger during exploration
 * @param {Object} state - Game state
 * @returns {boolean} True if encounter should be checked
 */
export function shouldCheckForEncounter(state) {
  // Don't check in town or during combat
  if (state.phase !== 'exploration') return false;
  const roomId = getCurrentRoomId(state);
  if (roomId === 'center') return false; // Town is safe
  if (state.encounterState?.encounterCooldown > 0) return false;
  
  return true;
}

/**
 * Get encounter location type for current room
 * @param {Object} state - Game state
 * @returns {string} Location type
 */
export function getCurrentLocationType(state) {
  const roomId = getCurrentRoomId(state);
  return mapRoomToLocationType(roomId);
}
