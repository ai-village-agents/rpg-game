import { CLASS_DEFINITIONS } from '../characters/classes.js';
import { BACKGROUNDS } from '../data/backgrounds.js';
import { initialState, initialStateWithClass, pushLog, loadFromLocalStorage, saveToLocalStorage } from '../state.js';
import { initQuestState } from '../quest-integration.js';
import { createGameStats, recordBattleFled } from '../game-stats.js';
import { initVisitedRooms } from '../minimap.js';
import { getCurrentRoom } from '../map.js';
import { saveToSlot, loadFromSlot, getSaveSlots, deleteSaveSlot } from '../engine.js';
import { consumeAchievementNotifications } from '../achievements.js';
import { DIFFICULTY_LEVELS } from '../difficulty.js';
import { completeTutorialStep, dismissCurrentHint } from '../tutorial.js';

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

    const selectedName = typeof action.name === 'string' ? action.name.trim() : '';
    const difficulty = Object.values(DIFFICULTY_LEVELS).includes(action.difficulty)
      ? action.difficulty
      : DIFFICULTY_LEVELS.NORMAL;

    // Initialize state with selected class
    const baseState = initialStateWithClass(action.classId, selectedName, difficulty);
    const className = action.classId[0].toUpperCase() + action.classId.slice(1);

    const nextTutorialState = state.tutorialState
      ? completeTutorialStep(dismissCurrentHint(state.tutorialState), 'welcome')
      : state.tutorialState;

    return {
      ...baseState,
      tutorialState: nextTutorialState || baseState.tutorialState,
      phase: 'background-select',
      log: [
        `You have chosen the path of the ${className}.`,
        'Choose your background.',
      ],
    };
  }

  if (type === 'SELECT_BACKGROUND') {
    const background = BACKGROUNDS[action.backgroundId];
    if (!background) {
      return pushLog(state, 'Unknown background selected.');
    }

    const bonuses = background.bonuses || {};
    const player = { ...(state.player || {}), backgroundId: background.id };

    const applyFlat = (key) => {
      if (typeof bonuses[key] === 'number') {
        player[key] = (player[key] ?? 0) + bonuses[key];
      }
    };

    applyFlat('hp');
    applyFlat('maxHp');
    applyFlat('mp');
    applyFlat('maxMp');
    applyFlat('atk');
    applyFlat('def');
    applyFlat('spd');
    applyFlat('gold');

    if (bonuses.inventory && typeof bonuses.inventory === 'object') {
      const inventory = { ...(player.inventory || {}) };
      for (const [itemId, count] of Object.entries(bonuses.inventory)) {
        if (typeof count === 'number') {
          inventory[itemId] = (inventory[itemId] ?? 0) + count;
        }
      }
      player.inventory = inventory;
    }

    if (typeof player.maxHp === 'number' && typeof player.hp === 'number') {
      player.hp = Math.min(player.hp, player.maxHp);
    }
    if (typeof player.maxMp === 'number' && typeof player.mp === 'number') {
      player.mp = Math.min(player.mp, player.maxMp);
    }

    const classId = state.player?.classId;
    const className = typeof classId === 'string' && classId
      ? classId[0].toUpperCase() + classId.slice(1)
      : 'Adventurer';

    const next = {
      questState: initQuestState(),
      ...state,
      player,
      phase: 'exploration',
      log: [
        `You have chosen the path of the ${className}.`,
        `You carry the experience of a ${background.name}.`,
        `${getRoomDescription(state.world)} You may explore in any direction.`,
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
      log: ['The adventure ends... but another awaits. Select your class.'],
      tutorialState: state.tutorialState,
    };
  }

  if (type === 'NEW_GAME_PLUS') {
    const player = state.player || {};
    const ngPlusCount = (state.newGamePlusCount || 0) + 1;
    return {
      phase: 'exploration',
      player: {
        ...player,
        hp: player.maxHp || 50,
        mp: player.maxMp || 15,
        defending: false,
      },
      gold: Math.floor((state.gold || 0) * 0.5),
      inventory: { potion: 2 },
      log: [
        `New Game+ ${ngPlusCount} begins! Your power carries forward, but the dungeon grows stronger...`,
        'The Oblivion Lord has reformed. The cycle continues.',
      ],
      newGamePlus: true,
      newGamePlusCount: ngPlusCount,
      newGamePlusBonus: ngPlusCount,
      gameStats: state.gameStats,
      bestiary: state.bestiary,
      tutorialState: state.tutorialState,
    };
  }

  if (type === 'RETURN_TO_TITLE') {
    return {
      phase: 'class-select',
      log: ['The hero\'s legend is complete. A new adventure begins.'],
      tutorialState: state.tutorialState,
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

  if (type === 'CONSUME_ACHIEVEMENT_NOTIFICATIONS') {
    return consumeAchievementNotifications(state);
  }

  return null;
}
