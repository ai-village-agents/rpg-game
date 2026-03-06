import { createInventoryState, handleInventoryAction } from '../inventory.js';
import { createLevelUpState, advanceLevelUp } from '../level-up.js';
import { acceptQuest } from '../quest-integration.js';
import { createGameStats, recordBattleWon, recordEnemyDefeated, recordXPEarned, recordGoldEarned } from '../game-stats.js';
import { pushLog } from '../state.js';
import { getCurrentRoom, getRoomExits } from '../map.js';
import { advanceDialog } from '../npc-dialog.js';
import { loadSettings, saveSettings, updateSetting, resetSettings } from '../settings.js';


function getRoomDescription(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

export function handleUIAction(state, action) {
  const type = action.type;

  // Inventory
  if (type === 'VIEW_INVENTORY') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'inventory', inventoryState: createInventoryState(state.phase) };
  }

  const inventoryActions = ['CLOSE_INVENTORY', 'INVENTORY_USE', 'INVENTORY_EQUIP', 'INVENTORY_UNEQUIP', 'INVENTORY_VIEW_DETAILS', 'INVENTORY_BACK'];
  if (inventoryActions.includes(type) && state.phase === 'inventory') {
    return handleInventoryAction(state, action);
  }

  // Quests
  if (type === 'VIEW_QUESTS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'quests', previousPhase: state.phase };
  }

  if (type === 'VIEW_STATS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'stats', previousPhase: state.phase };
  }

  if (type === 'CLOSE_QUESTS') {
    if (state.phase !== 'quests') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  if (type === 'CLOSE_STATS') {
    if (state.phase !== 'stats') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  if (type === 'ACCEPT_QUEST') {
    if (!state.questState) return pushLog(state, 'Quest system not initialized.');
    const result = acceptQuest(state.questState, action.questId);
    const next = { ...state, questState: result.questState };
    return pushLog(next, result.message);
  }

  // Level Up
  if (type === 'VIEW_LEVEL_UPS') {
    if (!state.pendingLevelUps || state.pendingLevelUps.length === 0) return null;
    const luState = createLevelUpState(state.pendingLevelUps, 'victory');
    return { ...state, phase: 'level-up', levelUpState: luState };
  }

  if (type === 'LEVEL_UP_CONTINUE') {
    if (state.phase !== 'level-up' || !state.levelUpState) return null;
    const { levelUpState: nextLuState, done } = advanceLevelUp(state.levelUpState);
    if (done) {
      const returnPhase = state.levelUpState.returnPhase || 'victory';
      if (returnPhase === 'battle-summary-done') {
        const exits = getRoomExits(state.world);
        let next2 = {
          ...state,
          phase: 'exploration',
          player: { ...state.player, defending: false },
          battleSummary: undefined,
          levelUpState: undefined,
          pendingLevelUps: undefined,
        };
        next2 = pushLog(next2, 'You gather yourself and continue your journey.');
        next2 = pushLog(next2, `${getRoomDescription(state.world)} Exits: ${exits.join(', ') || 'none'}.`);
        return next2;
      }
      return { ...state, phase: returnPhase, levelUpState: undefined };
    }
    return { ...state, levelUpState: nextLuState };
  }

  // Battle Summary & Continuation
  if (type === 'CONTINUE_AFTER_BATTLE') {
    if (state.phase !== 'battle-summary') return null;
    
    // Pending Level Ups Check
    if (state.pendingLevelUps && state.pendingLevelUps.length > 0) {
      const luState = createLevelUpState(state.pendingLevelUps, 'battle-summary-done');
      return { ...state, phase: 'level-up', levelUpState: luState };
    }
    
    // Return to exploration
    const exits = getRoomExits(state.world);
    let gs = state.gameStats || createGameStats();
    gs = recordBattleWon(gs);
    if (state.enemy?.name) gs = recordEnemyDefeated(gs, state.enemy.name);
    if ((state.xpGained ?? 0) > 0) gs = recordXPEarned(gs, state.xpGained);
    if ((state.goldGained ?? 0) > 0) gs = recordGoldEarned(gs, state.goldGained);
    
    let next = {
      ...state,
      phase: 'exploration',
      player: { ...state.player, defending: false },
      battleSummary: undefined,
      pendingLevelUps: undefined,
      gameStats: gs,
    };
    next = pushLog(next, 'You gather yourself and continue your journey.');
    next = pushLog(next, `${getRoomDescription(state.world)} Exits: ${exits.join(', ') || 'none'}.`);
    return next;
  }

  if (type === 'CONTINUE_EXPLORING') {
    if (state.phase !== 'victory' && state.phase !== 'post-victory' && state.phase !== 'battle-summary-done') return null;
    const exits = getRoomExits(state.world);
    let next = {
      ...state,
      phase: 'exploration',
      player: { ...state.player, defending: false },
      levelUpState: undefined,
      pendingLevelUps: undefined,
    };
    next = pushLog(next, `You gather yourself and continue your journey.`);
    next = pushLog(next, `${getRoomDescription(state.world)} Exits: ${exits.join(', ') || 'none'}.`);
    return next;
  }

  if (type === 'LOG') {
    return pushLog(state, action.line ?? '(log)');
  }
  
  // Dialog Actions
  if (type === 'DIALOG_NEXT') {
    if (state.phase !== 'dialog' || !state.dialogState) return null;
    const next = advanceDialog(state.dialogState);
    if (next.done) {
      const returnPhase = state.preDialogPhase || 'exploration';
      const { dialogState: _ds, preDialogPhase: _pdp, ...rest } = state;
      return pushLog({ ...rest, phase: returnPhase }, `${state.dialogState.npcName}: Farewell, traveler.`);
    }
    return { ...state, dialogState: next };
  }
  
  if (type === 'DIALOG_CLOSE') {
    if (state.phase !== 'dialog') return null;
    const returnPhase = state.preDialogPhase || 'exploration';
    const { dialogState: _ds, preDialogPhase: _pdp, ...rest } = state;
    return { ...rest, phase: returnPhase };
  }

  
  // Settings Actions
  if (type === 'VIEW_SETTINGS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'settings', previousPhase: state.phase, settings: loadSettings() };
  }

  if (type === 'CLOSE_SETTINGS') {
    if (state.phase !== 'settings') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  if (type === 'UPDATE_SETTING') {
    if (state.phase !== 'settings') return null;
    const newSettings = updateSetting(state.settings || {}, action.path, action.value);
    saveSettings(newSettings);
    return { ...state, settings: newSettings };
  }

  if (type === 'RESET_SETTINGS') {
    if (state.phase !== 'settings') return null;
    const defaultSettings = resetSettings();
    saveSettings(defaultSettings);
    return pushLog({ ...state, settings: defaultSettings }, 'Settings reset to defaults.');
  }

return null;
}
