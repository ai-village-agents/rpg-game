import { startTavernDice, guessTavernDice, cashOutTavernDice } from '../tavern-dice.js';
import { updateAudioSettings } from '../audio-system.js';
import { createInventoryState, handleInventoryAction } from '../inventory.js';
import { markAllRead } from '../journal.js';
import { createLevelUpState, advanceLevelUp } from '../level-up.js';
import { acceptQuest } from '../quest-integration.js';
import { claimAllQuestRewards, hasPendingRewards } from '../quest-rewards.js';
import { createGameStats, recordBattleFled, recordBattleWon, recordEnemyDefeated, recordXPEarned, recordGoldEarned } from '../game-stats.js';
import { pushLog } from '../state.js';
import { getCurrentRoom, getRoomExits } from '../map.js';
import { advanceDialog } from '../npc-dialog.js';
import { renderAchievementsPanel } from '../achievements-ui.js';
import { loadSettings, updateSetting, resetSettings, saveSettings } from '../settings.js';
import { createShopState, buyItem, sellItem } from '../shop.js';
import { createCraftingState, craftItem } from '../crafting.js';
import { createTalentState, allocateTalent, deallocateTalent, resetAllTalents } from '../talents.js';
import { recruitCompanion, dismissCompanion } from '../companions.js';
import { shouldShowSpecialization, createSpecializationState, applySpecialization } from '../specialization-ui.js';

function getRoomDescription(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

export function handleUIAction(state, action) {
  const type = action.type;

  if (type === "TOGGLE_HELP") {
    return { ...state, showHelp: !state.showHelp };
  }

  if (type === "CLOSE_HELP") {
    return { ...state, showHelp: false };
  }

  // Journal
  if (type === 'OPEN_JOURNAL') {
    if (state.phase === 'class-select') return null;
    const next = markAllRead(state);
    return { ...next, phase: 'journal', previousPhase: state.phase };
  }

  if (type === 'CLOSE_JOURNAL') {
    if (state.phase !== 'journal') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  // Settings
  if (type === 'VIEW_SETTINGS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'settings', previousPhase: state.phase, settings: loadSettings() };
  }

  if (type === 'CLOSE_SETTINGS') {
    if (state.phase !== 'settings') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  // Achievements
  if (type === 'VIEW_ACHIEVEMENTS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'achievements', previousPhase: state.phase };
  }

  if (type === 'CLOSE_ACHIEVEMENTS') {
    if (state.phase !== 'achievements') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  if (type === 'UPDATE_SETTING') {
    if (state.phase !== 'settings') return null;
    const newSettings = updateSetting(state.settings || {}, action.path, action.value);
    saveSettings(newSettings);
    updateAudioSettings(newSettings);
    return { ...state, settings: newSettings };
  }

  if (type === 'RESET_SETTINGS') {
    if (state.phase !== 'settings') return null;
    const newSettings = resetSettings();
    updateAudioSettings(newSettings);
    return pushLog({ ...state, settings: newSettings }, 'Settings reset to defaults.');
  }


  // Inventory
  if (type === 'VIEW_INVENTORY') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'inventory', inventoryState: createInventoryState(state.phase) };
  }

  const inventoryActions = ['CLOSE_INVENTORY', 'INVENTORY_USE', 'INVENTORY_EQUIP', 'INVENTORY_UNEQUIP', 'INVENTORY_VIEW_DETAILS', 'INVENTORY_BACK'];
  if (inventoryActions.includes(type) && state.phase === 'inventory') {
    return handleInventoryAction(state, action);
  }

  // Quests / Quest Log
  if (type === 'VIEW_QUESTS' || type === 'VIEW_QUEST_LOG') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'quests', previousPhase: state.phase };
  }

  if (type === 'VIEW_STATS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'stats', previousPhase: state.phase };
  }

  if (type === 'CLOSE_QUESTS' || type === 'CLOSE_QUEST_LOG') {
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
        // Check if player needs to choose a specialization
        if (shouldShowSpecialization(state.player)) {
          const specState = createSpecializationState(state.player);
          let next2 = {
            ...state,
            phase: 'specialization',
            specializationState: specState,
            levelUpState: undefined,
          };
          next2 = pushLog(next2, 'You have reached the level of mastery! Choose your specialization path.');
          return next2;
        }
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
    
    // Check if player needs to choose a specialization (reached level 5+ without pending level-ups)
    if (shouldShowSpecialization(state.player)) {
      const specState = createSpecializationState(state.player);
      let next = {
        ...state,
        phase: 'specialization',
        specializationState: specState,
        battleSummary: undefined,
        pendingLevelUps: undefined,
      };
      next = pushLog(next, 'You have reached the level of mastery! Choose your specialization path.');
      return next;
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

  if (type === 'CONTINUE_AFTER_FLEE') {
    if (state.phase !== 'fled') return null;
    const exits = getRoomExits(state.world);
    let gs = state.gameStats || createGameStats();
    gs = recordBattleFled(gs);
    let next = {
      ...state,
      phase: 'exploration',
      player: { ...state.player, defending: false },
      enemy: undefined,
      battleSummary: undefined,
      pendingLevelUps: undefined,
      gameStats: gs,
    };
    next = pushLog(next, 'You slip away and return to safety.');
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

  if (type === 'CLAIM_QUEST_REWARDS') {
    if (state.phase !== 'quest-reward') return null;
    const pendingRewards = state.pendingQuestRewards || [];
    const { playerState, messages } = claimAllQuestRewards(state.player, pendingRewards);
    const returnPhase = state.preRewardPhase || 'exploration';
    let next = {
      ...state,
      phase: returnPhase,
      player: playerState,
      pendingQuestRewards: [],
      preRewardPhase: undefined,
    };
    for (const msg of messages) {
      next = pushLog(next, msg);
    }
    return next;
  }

  // Shop Actions
  if (type === 'VIEW_SHOP') {
    if (!action.npcId) return null;
    const shopState = createShopState(action.npcId, state.preDialogPhase || state.phase);
    if (!shopState) return pushLog(state, 'This person has nothing to sell.');
    return { ...state, phase: 'shop', shopState };
  }

  if (type === 'BUY_ITEM') {
    if (state.phase !== 'shop' || !state.shopState) return null;
    const result = buyItem(state.player, state.shopState, action.itemId, action.quantity || 1, state.worldEvent || null);
    return { ...state, player: result.player, shopState: result.shopState };
  }

  if (type === 'SELL_ITEM') {
    if (state.phase !== 'shop' || !state.shopState) return null;
    const result = sellItem(state.player, state.shopState, action.itemId, action.quantity || 1);
    return { ...state, player: result.player, shopState: result.shopState };
  }

  if (type === 'SHOP_SWITCH_TAB') {
    if (state.phase !== 'shop' || !state.shopState) return null;
    return { ...state, shopState: { ...state.shopState, tab: action.tab || 'buy', message: null } };
  }

  if (type === 'CLOSE_SHOP') {
    if (state.phase !== 'shop') return null;
    const returnPhase = state.shopState?.previousPhase || 'exploration';
    const { shopState: _ss, ...rest } = state;
    return { ...rest, phase: returnPhase };
  }


  // Crafting Actions
  if (type === 'VIEW_CRAFTING') {
    if (state.phase === 'class-select') return null;
    if (!state.crafting) {
      state = { ...state, crafting: createCraftingState() };
    }
    return {
      ...state,
      phase: 'crafting',
      previousPhase: state.phase,
      craftingUI: { category: 'all', selectedRecipe: null, message: null },
    };
  }

  if (type === 'CLOSE_CRAFTING') {
    if (state.phase !== 'crafting') return null;
    const returnPhase = state.previousPhase || 'exploration';
    return { ...state, phase: returnPhase, craftingUI: undefined };
  }

  if (type === 'CRAFTING_SET_CATEGORY') {
    if (state.phase !== 'crafting') return null;
    return {
      ...state,
      craftingUI: { ...state.craftingUI, category: action.category || 'all', selectedRecipe: null, message: null },
    };
  }

  if (type === 'CRAFTING_SELECT_RECIPE') {
    if (state.phase !== 'crafting') return null;
    return {
      ...state,
      craftingUI: { ...state.craftingUI, selectedRecipe: action.recipeId || null, message: null },
    };
  }

  if (type === 'CRAFT_ITEM') {
    if (state.phase !== 'crafting' || !action.recipeId) return null;
    const result = craftItem(state, action.recipeId);
    return {
      ...state,
      craftingUI: { ...state.craftingUI, message: result.message },
    };
  }

  // Talents
  if (type === 'VIEW_TALENTS') {
    if (state.phase === 'class-select') return null;
    if (!state.talentState) {
      state = { ...state, talentState: createTalentState() };
    }
    return { ...state, phase: 'talents', previousPhase: state.phase };
  }

  if (type === 'ALLOCATE_TALENT') {
    if (state.phase !== 'talents' || !action.talentId || !state.talentState) return null;
    const result = allocateTalent(state.talentState, action.talentId);
    if (result.success) {
      return pushLog({ ...state, talentState: result.newState }, 'Allocated talent point.');
    }
    return pushLog(state, result.error || 'Unable to allocate talent.');
  }

  if (type === 'DEALLOCATE_TALENT') {
    if (state.phase !== 'talents' || !action.talentId || !state.talentState) return null;
    const result = deallocateTalent(state.talentState, action.talentId);
    if (result.success) {
      return pushLog({ ...state, talentState: result.newState }, 'Deallocated talent point.');
    }
    return pushLog(state, result.error || 'Unable to deallocate talent.');
  }

  if (type === 'RESET_TALENTS') {
    if (state.phase !== 'talents' || !state.talentState) return null;
    const talentState = resetAllTalents(state.talentState);
    return pushLog({ ...state, talentState }, 'All talents have been reset.');
  }

  if (type === 'CLOSE_TALENTS') {
    if (state.phase !== 'talents') return null;
    const returnPhase = state.previousPhase || 'exploration';
    return { ...state, phase: returnPhase };
  }

  // Companions
  if (type === 'OPEN_COMPANIONS') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'companions', previousPhase: state.phase };
  }

  if (type === 'CLOSE_COMPANIONS') {
    if (state.phase !== 'companions') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  if (type === 'RECRUIT_COMPANION') {
    if (!action.companionId) return null;
    const result = recruitCompanion(state, action.companionId);
    return result;
  }

  if (type === 'DISMISS_COMPANION') {
    if (!action.companionId) return null;
    const result = dismissCompanion(state, action.companionId);
    return result;
  }

  // Bestiary
  if (type === 'VIEW_BESTIARY') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'bestiary', previousPhase: state.phase };
  }
  if (type === 'CLOSE_BESTIARY') {
    if (state.phase !== 'bestiary') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }
  
  if (type === 'VIEW_TAVERN') {
    if (state.phase === 'class-select') return null;
    return { ...state, phase: 'tavern-dice', previousPhase: state.phase };
  }
  if (type === 'CLOSE_TAVERN') {
    if (state.phase !== 'tavern-dice') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }
  if (type === 'TAVERN_START') {
    return startTavernDice(state, parseInt(action.wager, 10));
  }
  if (type === 'TAVERN_GUESS') {
    return guessTavernDice(state, action.guess);
  }
  if (type === 'TAVERN_CASH_OUT') {
    return cashOutTavernDice(state);
  }

  // Specialization Choice
  if (type === 'CHOOSE_SPECIALIZATION') {
    if (state.phase !== 'specialization') return null;
    const specId = action.specId;
    if (!specId) return null;
    
    const updatedPlayer = applySpecialization(state.player, specId);
    if (!updatedPlayer) return null;
    
    const exits = getRoomExits(state.world);
    let gs = state.gameStats || createGameStats();
    gs = recordBattleWon(gs);
    if (state.enemy?.name) gs = recordEnemyDefeated(gs, state.enemy.name);
    if ((state.xpGained ?? 0) > 0) gs = recordXPEarned(gs, state.xpGained);
    if ((state.goldGained ?? 0) > 0) gs = recordGoldEarned(gs, state.goldGained);
    
    let next = {
      ...state,
      phase: 'exploration',
      player: { ...updatedPlayer, defending: false },
      specializationState: undefined,
      battleSummary: undefined,
      pendingLevelUps: undefined,
      gameStats: gs,
    };
    const specName = action.specName || specId;
    next = pushLog(next, 'You have chosen the path of the ' + specName + '!');
    next = pushLog(next, 'New abilities and stat bonuses have been applied.');
    next = pushLog(next, `${getRoomDescription(state.world)} Exits: ${exits.join(', ') || 'none'}.`);
    return next;
  }

  return null;
}
