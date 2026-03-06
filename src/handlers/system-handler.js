import { CLASS_DEFINITIONS } from '../characters/classes.js';
import { initialState, initialStateWithClass, pushLog, loadFromLocalStorage, saveToLocalStorage } from '../state.js';
import { initQuestState } from '../quest-integration.js';
import { createGameStats, recordBattleFled } from '../game-stats.js';
import { initVisitedRooms } from '../minimap.js';
import { getCurrentRoom } from '../map.js';
import { saveToSlot, loadFromSlot, getSaveSlots, deleteSaveSlot } from '../engine.js';

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

  if (type === 'SAVE_SLOTS') {
    return { ...state, phase: 'save-slots', saveSlotMode: 'save', saveSlots: getSaveSlots() };
  }

  if (type === 'LOAD_SLOTS') {
    return { ...state, phase: 'save-slots', saveSlotMode: 'load', saveSlots: getSaveSlots() };
  }

  if (type === 'SAVE_TO_SLOT') {
    const slotIndex = action.slotIndex;
    const success = saveToSlot(state, slotIndex);
    if (success) {
      return { ...state, phase: 'save-slots', saveSlotMode: 'save', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Saved to slot ' + (slotIndex + 1) + '.'] };
    }
    return { ...state, phase: 'save-slots', saveSlotMode: 'save', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Save failed!'] };
  }

  if (type === 'LOAD_FROM_SLOT') {
    const slotIndex = action.slotIndex;
    const loaded = loadFromSlot(slotIndex);
    if (loaded) {
      return { ...loaded, phase: 'exploration', log: [...(loaded.log || []), 'Loaded from slot ' + (slotIndex + 1) + '.'] };
    }
    return { ...state, phase: 'save-slots', saveSlotMode: 'load', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Load failed! Slot may be empty.'] };
  }

  if (type === 'DELETE_SAVE_SLOT') {
    deleteSaveSlot(action.slotIndex);
    return { ...state, phase: 'save-slots', saveSlotMode: state.saveSlotMode || 'save', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Slot ' + (action.slotIndex + 1) + ' deleted.'] };
  }

  if (type === 'CLOSE_SAVE_SLOTS') {
    return { ...state, phase: 'exploration' };
  }

  if (type === 'SWITCH_SAVE_MODE') {
    return { ...state, saveSlotMode: action.mode, saveSlots: getSaveSlots() };
  }

  return null;
}
