import { applyTheme } from '../data/themes.js';
import { applyReducedMotion } from '../accessibility.js';
import { startTavernDice, guessTavernDice, cashOutTavernDice } from '../tavern-dice.js';
import { generateBounties, acceptBounty } from '../bounty-board.js';
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
import { clearFloor as clearDungeonFloor, TOTAL_FLOORS } from '../dungeon-floors.js';
import { handleProvisionAction } from './provisions-handler.js';
import { BESTIARY_FILTER_DEFAULT, BESTIARY_SORT_DEFAULT } from '../bestiary-ui.js';
import { completeTutorialStep, dismissCurrentHint, showHint, createTutorialState, resetTutorial } from '../tutorial.js';
import { getAllStandings, modifyReputation, getFactionStanding, claimReward } from '../faction-reputation-system.js';
import { renderReputationPanel } from '../faction-reputation-system-ui.js';
import { processMatchResult, createTournament, recordTournamentMatchResult, getTournamentRewards, resetSeason, generateOpponent } from '../arena-tournament-system.js';

function getRoomDescription(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

export function handleUIAction(state, action) {
  const type = action.type;
  const isPreAdventure = state.phase === 'class-select' || state.phase === 'background-select';

  if (type === "TOGGLE_HELP") {
    return { ...state, showHelp: !state.showHelp };
  }

  if (type === "CLOSE_HELP") {
    return { ...state, showHelp: false };
  }

  // Journal
  if (type === 'OPEN_JOURNAL') {
    if (isPreAdventure) return null;
    const next = markAllRead(state);
    return { ...next, phase: 'journal', previousPhase: state.phase };
  }

  if (type === 'CLOSE_JOURNAL') {
    if (state.phase !== 'journal') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  // Settings
  if (type === 'VIEW_SETTINGS') {
    if (isPreAdventure) return null;
    return { ...state, phase: 'settings', previousPhase: state.phase, settings: loadSettings() };
  }

  if (type === 'CLOSE_SETTINGS') {
    if (state.phase !== 'settings') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  // Achievements
  if (type === 'VIEW_ACHIEVEMENTS') {
    if (isPreAdventure) return null;
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
    if (action.path === 'display.theme') applyTheme(action.value);
    if (action.path === 'display.reducedMotion') applyReducedMotion(action.value);
    return { ...state, settings: newSettings };
  }

  if (type === 'RESET_SETTINGS') {
    if (state.phase !== 'settings') return null;
    const newSettings = resetSettings();
    updateAudioSettings(newSettings);
    applyTheme(newSettings.display?.theme || 'midnight');
    applyReducedMotion(newSettings.display?.reducedMotion || false);
    return pushLog({ ...state, settings: newSettings }, 'Settings reset to defaults.');
  }


  // Inventory
  if (type === 'VIEW_INVENTORY') {
    if (isPreAdventure) return null;
    return { ...state, phase: 'inventory', inventoryState: createInventoryState(state.phase) };
  }

  const inventoryActions = ['CLOSE_INVENTORY', 'INVENTORY_USE', 'INVENTORY_EQUIP', 'INVENTORY_UNEQUIP', 'INVENTORY_VIEW_DETAILS', 'INVENTORY_BACK'];
  if (inventoryActions.includes(type) && state.phase === 'inventory') {
    return handleInventoryAction(state, action);
  }

  // Quests / Quest Log
  if (type === 'VIEW_QUESTS' || type === 'VIEW_QUEST_LOG') {
    if (isPreAdventure) return null;
    return { ...state, phase: 'quests', previousPhase: state.phase };
  }

  if (type === 'VIEW_STATS') {
    if (isPreAdventure) return null;
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

    // Track battle stats
    let gs = state.gameStats || createGameStats();
    gs = recordBattleWon(gs);
    if (state.enemy?.name) gs = recordEnemyDefeated(gs, state.enemy.name);
    if ((state.xpGained ?? 0) > 0) gs = recordXPEarned(gs, state.xpGained);
    if ((state.goldGained ?? 0) > 0) gs = recordGoldEarned(gs, state.goldGained);

    // Return to dungeon if in dungeon combat
    if (state.inDungeonCombat && state.dungeonState?.inDungeon) {
      let dungeonState = state.dungeonState;
      const wasBossFight = state.dungeonBossFight;
      if (wasBossFight) {
        dungeonState = clearDungeonFloor(dungeonState);
      }
      const { inDungeonCombat, dungeonBossFight, ...rest } = state;

      // Check if the final floor boss was just defeated → game complete!
      const isFinalBossCleared = wasBossFight
        && dungeonState.currentFloor === TOTAL_FLOORS
        && dungeonState.floorsCleared.includes(TOTAL_FLOORS);

      let next = {
        ...rest,
        dungeonState,
        phase: isFinalBossCleared ? 'game-complete' : 'dungeon',
        player: { ...state.player, defending: false },
        battleSummary: undefined,
        pendingLevelUps: undefined,
        gameStats: gs,
      };
      next = pushLog(next, isFinalBossCleared
        ? 'The Oblivion Lord is vanquished! Light returns to the realm!'
        : 'You continue exploring the dungeon.');
      return next;
    }

    // Return to exploration
    const exits = getRoomExits(state.world);
    
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
    if (isPreAdventure) return null;
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
    if (isPreAdventure) return null;
    if (!state.talentState) {
      state = { ...state, talentState: createTalentState() };
    }
    return {
      ...state,
      phase: 'talents',
      previousPhase: state.phase,
      talentUiState: state.talentUiState || { sortMethod: 'tier', filterText: '' },
    };
  }

  if (type === 'SET_TALENT_SORT_METHOD') {
    if (state.phase !== 'talents') return null;
    return {
      ...state,
      talentUiState: {
        ...(state.talentUiState || {}),
        sortMethod: action.sortMethod || 'tier',
      },
    };
  }

  if (type === 'SET_TALENT_FILTER_TEXT') {
    if (state.phase !== 'talents') return null;
    return {
      ...state,
      talentUiState: {
        ...(state.talentUiState || {}),
        filterText: action.filterText || '',
      },
    };
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
    if (isPreAdventure) return null;
    return { ...state, phase: 'companions', previousPhase: state.phase };
  }

  if (type === 'CLOSE_COMPANIONS') {
    if (state.phase !== 'companions') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  // Factions and Reputation
  if (type === 'OPEN_FACTIONS') {
    if (isPreAdventure) return null;
    return { ...state, phase: 'factions', previousPhase: state.phase };
  }

  if (type === 'CLOSE_FACTIONS') {
    if (state.phase !== 'factions') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }

  // Arena
  if (type === 'OPEN_ARENA') {
    if (isPreAdventure) return null;
    return { ...state, phase: 'arena' };
  }

  if (type === 'CLOSE_ARENA') {
    if (state.phase !== 'arena') return null;
    return { ...state, phase: 'exploration' };
  }

  if (type === 'START_ARENA_MATCH') {
    if (isPreAdventure || !state.arenaState) return null;
    const playerLevel = state.player.level || 1;
    const opponent = generateOpponent(playerLevel);
    const levelDelta = playerLevel - opponent.level;
    const winChance = Math.min(0.85, Math.max(0.15, 0.5 + (levelDelta * 0.05)));
    const result = Math.random() < winChance ? 'win' : 'loss';
    const opponentRating = Math.max(0, (state.arenaState.rating || 1000) + ((opponent.level - playerLevel) * 25));
    const matchData = {
      opponentRating,
      result,
      duration: 60 + Math.floor(Math.random() * 120),
      damageDealt: Math.floor(opponent.stats.hp * (result === 'win' ? 1 : 0.6)),
      damageTaken: Math.floor(opponent.stats.hp * (result === 'win' ? 0.4 : 1))
    };
    const { state: arenaState } = processMatchResult(state.arenaState, matchData);
    const next = { ...state, arenaState, phase: 'exploration' };
    return pushLog(next, 'You enter the arena for a quick match!');
  }

  if (type === 'ENTER_TOURNAMENT') {
    if (!action.tournamentId || !state.arenaState) return null;
    const tournament = createTournament(action.tournamentId, {
      name: state.player.name,
      level: state.player.level || 1,
      rating: state.arenaState.rating
    });
    if (tournament.error) {
      return pushLog(state, tournament.error);
    }
    const arenaState = {
      ...state.arenaState,
      tournaments: {
        ...state.arenaState.tournaments,
        [action.tournamentId]: tournament
      },
      activeTournament: action.tournamentId
    };
    const next = { ...state, arenaState, phase: 'exploration' };
    return pushLog(next, `You enter the ${tournament.name}.`);
  }

  if (type === 'ARENA_CLAIM_REWARDS') {
    const activeId = state.arenaState?.activeTournament;
    const activeTournament = activeId ? state.arenaState.tournaments?.[activeId] : null;
    if (!activeTournament || activeTournament.status !== 'completed') return null;
    const rewards = getTournamentRewards(activeTournament);
    if (!rewards) return null;
    const next = {
      ...state,
      player: {
        ...state.player,
        gold: (state.player.gold || 0) + (rewards.gold || 0)
      }
    };
    return next;
  }

  if (type === 'MODIFY_REPUTATION') {
    if (!action.factionId || action.amount === undefined) return null;
    const result = modifyReputation(state.factionReputation, action.factionId, action.amount, action.multiplier);
    if (result.error) return null;
    return { ...state, factionReputation: result.state };
  }

  if (type === 'CLAIM_FACTION_REWARD') {
    if (!action.factionId || !action.level) return null;
    const result = claimReward(state.factionReputation, action.factionId, action.level);
    if (result.error) return null;
    return { ...state, factionReputation: result.state };
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
    if (isPreAdventure) return null;
    return { ...state, phase: 'bestiary', previousPhase: state.phase };
  }
  if (type === 'CLOSE_BESTIARY') {
    if (state.phase !== 'bestiary') return null;
    return { ...state, phase: state.previousPhase || 'exploration' };
  }
  if (type === 'SORT_BESTIARY') {
    const sort = action.sort || BESTIARY_SORT_DEFAULT;
    return {
      ...state,
      bestiaryUiState: {
        ...(state.bestiaryUiState || {}),
        sort,
      },
    };
  }
  if (type === 'FILTER_BESTIARY') {
    const filter = action.filter || BESTIARY_FILTER_DEFAULT;
    return {
      ...state,
      bestiaryUiState: {
        ...(state.bestiaryUiState || {}),
        filter,
      },
    };
  }
  if (type === 'SEARCH_BESTIARY') {
    const search = action.search ?? '';
    return {
      ...state,
      bestiaryUiState: {
        ...(state.bestiaryUiState || {}),
        search,
      },
    };
  }
  
  
  if (type === 'VIEW_BOUNTY_BOARD') {
    return generateBounties({ ...state, phase: 'bounty-board', previousPhase: state.phase });
  }

  if (type === 'CLOSE_BOUNTY_BOARD') {
    if (state.phase !== 'bounty-board') return null;
    return { ...state, phase: state.previousPhase || 'town' };
  }

  if (type === 'REFRESH_BOUNTIES') {
    if (state.phase !== 'bounty-board') return null;
    return generateBounties({ ...state, bountyBoard: { ...state.bountyBoard, lastRefreshTime: 0 } });
  }

  if (type === 'ACCEPT_BOUNTY') {
    if (state.phase !== 'bounty-board') return null;
    return acceptBounty(state, action.id);
  }

  if (type === 'VIEW_TAVERN') {
    if (isPreAdventure) return null;
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

  // --- Provisions actions ---
  const provisionActions = [
    'OPEN_PROVISIONS', 'CLOSE_PROVISIONS', 'PROVISIONS_SELECT',
    'PROVISIONS_SWITCH_TAB', 'USE_PROVISION', 'COOK_PROVISION',
    'TICK_PROVISIONS'
  ];
  if (provisionActions.includes(type)) {
    const result = handleProvisionAction(state, action);
    if (result) return result;
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

  if (action.type === 'TUTORIAL_SHOW') {
    if (!state.tutorialState) return null;
    return {
      ...state,
      tutorialState: showHint(state.tutorialState, action.stepId),
    };
  }

  if (action.type === 'TUTORIAL_DISMISS') {
    if (!state.tutorialState || !state.tutorialState.currentHint) return null;
    const stepId = state.tutorialState.currentHint.id;
    return {
      ...state,
      tutorialState: completeTutorialStep(
        dismissCurrentHint(state.tutorialState),
        stepId
      ),
    };
  }

  if (action.type === 'TUTORIAL_DISABLE') {
    if (!state.tutorialState) return null;
    return {
      ...state,
      tutorialState: {
        ...dismissCurrentHint(state.tutorialState),
        hintsEnabled: false,
      },
    };
  }

  if (action.type === 'VIEW_TUTORIAL_PROGRESS') {
    if (!state.tutorialState) return null;
    return {
      ...state,
      ui: {
        ...state.ui,
        tutorialProgressVisible: true,
      },
    };
  }

  if (action.type === 'CLOSE_TUTORIAL_PROGRESS') {
    return {
      ...state,
      ui: {
        ...state.ui,
        tutorialProgressVisible: false,
      },
    };
  }

  if (action.type === 'TUTORIAL_REENABLE_HINTS') {
    if (!state.tutorialState) return null;
    return {
      ...state,
      tutorialState: {
        ...state.tutorialState,
        hintsEnabled: true,
      },
    };
  }

  if (action.type === 'TUTORIAL_RESET') {
    if (!state.tutorialState) return null;
    return {
      ...state,
      tutorialState: resetTutorial(),
    };
  }

  return null;
}
