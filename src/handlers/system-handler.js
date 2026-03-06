import { CLASS_DEFINITIONS } from '../characters/classes.js';
import { initialState, initialStateWithClass, pushLog, loadFromLocalStorage, saveToLocalStorage } from '../state.js';
import { initQuestState } from '../quest-integration.js';
import { createGameStats, recordBattleFled } from '../game-stats.js';
import { initVisitedRooms } from '../minimap.js';
import { getCurrentRoom } from '../map.js';

function getRoomDescription(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

export function handleSystemAction(state, action) {
  const type = action.type;

  if (type === 'SELECT_CLASS') {
    if (!CLASS_DEFINITIONS[action.classId]) {
      return pushLog(state, 'Unknown class selected.');
    }
    
    // Initialize state with selected class
    let next = initialStateWithClass(action.classId);
    
    // Add exploration, quests, stats
    next = {
      questState: initQuestState(),
      ...next,
      phase: 'exploration',
      log: [
        `You have chosen the path of the ${action.classId[0].toUpperCase() + action.classId.slice(1)}.`,
        `${getRoomDescription(next.world)} You may explore in any direction.`,
      ],
      visitedRooms: initVisitedRooms(1, 1),
      gameStats: createGameStats(),
    };
    return next;
  }

  if (type === 'NEW') {
    return { ...initialState(), gameStats: createGameStats() };
  }

  if (type === 'LOAD') {
    const loaded = loadFromLocalStorage();
    if (loaded) {
      return { ...loaded, log: [...(loaded.log ?? []), 'Save loaded.'] };
    }
    return pushLog(state, 'No save found.');
  }

  if (type === 'SAVE') {
    saveToLocalStorage(state);
    return pushLog(state, 'Game saved.');
  }

  if (type === 'TRY_AGAIN') {
    // Record loss in previous stats if possible, but we are resetting state...
    // The main.js logic was:
    // let gs = state.gameStats ?? createGameStats();
    // gs = recordBattleFled(gs);
    // state = { phase: 'class-select', ... }
    
    // We can't really save the stats if we reset the state unless we persist them globally or to a high score list.
    // For now, we just reset to class selection.
    
    return { 
      phase: 'class-select', 
      log: ['The adventure ends... but another awaits. Select your class.'] 
    };
  }

  return null;
}
