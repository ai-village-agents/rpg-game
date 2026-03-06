import { initialState, initialStateWithClass, loadFromLocalStorage, saveToLocalStorage, pushLog } from './state.js';
import { playerAttack, playerDefend, playerUsePotion, playerUseAbility, playerUseItem, enemyAct, startNewEncounter } from './combat.js';
import { render } from './render.js';
import { createInventoryState, handleInventoryAction } from './inventory.js';
import { keyToCardinalDirection } from './input.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';
import { movePlayer, getCurrentRoom, getRoomExits } from './map.js';
import { nextRng } from './combat.js';
import { checkLevelUps, createLevelUpState, advanceLevelUp, getCurrentLevelUp } from './level-up.js';
import { calcLevel } from './characters/stats.js';
import { getNPCsInRoom, createDialogState, advanceDialog } from './npc-dialog.js';
import { initQuestState, acceptQuest, onRoomEnter, getAvailableQuestsInRoom, getActiveQuestsSummary } from './quest-integration.js';
import { createBattleSummary } from './battle-summary.js';
import { initVisitedRooms, markRoomVisited } from './minimap.js';
import { createGameStats, recordEnemyDefeated, recordDamageDealt, recordDamageReceived, recordItemUsed, recordAbilityUsed, recordGoldEarned, recordXPEarned, recordBattleWon, recordBattleFled, recordTurnPlayed, getStatsSummary } from './game-stats.js';
import { loadSettings, saveSettings, updateSetting, resetSettings } from './settings.js';

const ENCOUNTER_RATE = 0.3; // 30% chance per move
const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];

let state = { phase: 'class-select', log: ['Welcome to AI Village RPG! Select your class.'] };

function setState(next) {
  // Detect level-ups when entering victory phase
  if (next.phase === 'victory' && state.phase !== 'victory' && state.phase !== 'level-up') {
    const player = next.player;
    if (player && player.classId) {
      const oldLevel = player.level ?? 1;
      const newLevel = calcLevel(player.xp ?? 0);
      if (newLevel > oldLevel) {
        // Build level-up data: simulate the stat growth
        const levelUps = checkLevelUps(
          [{ ...player, level: oldLevel, xp: (player.xp ?? 0) - (next.xpGained ?? 0) }],
          next.xpGained ?? 0
        );
        if (levelUps.length > 0) {
          // Update player level and stats to match post-level-up
          const lu = levelUps[0];
          next = {
            ...next,
            player: {
              ...player,
              level: lu.newLevel,
              maxHp: lu.newStats.maxHp,
              hp: player.hp + (lu.newStats.maxHp - lu.oldStats.maxHp), // Heal by the HP growth amount
              maxMp: lu.newStats.maxMp,
              mp: (player.mp ?? 0) + (lu.newStats.maxMp - (lu.oldStats.maxMp ?? 0)),
              atk: lu.newStats.atk,
              def: lu.newStats.def,
              spd: lu.newStats.spd,
            },
            pendingLevelUps: levelUps,
          };
          next = pushLog(next, `${player.name} reached level ${lu.newLevel}!`);
        }
      }
    }
  }

  // After level-up detection, transition victory → battle-summary
  if (next.phase === 'victory' && state.phase !== 'battle-summary' && state.phase !== 'level-up') {
    next = { ...next, phase: 'battle-summary', battleSummary: createBattleSummary(next) };
  }

  state = next;
  render(state, dispatch);

  // If it became enemy turn, resolve after a short pause.
  if (state.phase === 'enemy-turn') {
    window.setTimeout(() => {
      const hpBefore = state.player?.hp ?? 0;
      state = enemyAct(state);
      const dmgReceived = Math.max(0, hpBefore - (state.player?.hp ?? hpBefore));
      if (dmgReceived > 0) {
        state = { ...state, gameStats: recordDamageReceived(state.gameStats ?? createGameStats(), dmgReceived) };
      }
      render(state, dispatch);
    }, 450);
  }
}

function getRoomDescription(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

function getAvailableExits(worldState) {
  return getRoomExits(worldState);
}

function getRoomId(worldState) {
  if (!worldState) return null;
  return ROOM_ID_MAP[worldState.roomRow]?.[worldState.roomCol] ?? null;
}

function dispatch(action) {
  const type = action?.type;

  if (type === 'PLAYER_ATTACK') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerAttack(state);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    let gs = next.gameStats ?? createGameStats();
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    return setState({ ...next, gameStats: gs });
  }
  if (type === 'PLAYER_DEFEND') return setState(playerDefend(state));
  if (type === 'PLAYER_POTION') {
    const next = playerUsePotion(state);
    let gs = next.gameStats ?? createGameStats();
    gs = recordItemUsed(gs, 'potion');
    gs = recordTurnPlayed(gs);
    return setState({ ...next, gameStats: gs });
  }
  if (type === 'PLAYER_ABILITY') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerUseAbility(state, action.abilityId);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    let gs = next.gameStats ?? createGameStats();
    gs = recordAbilityUsed(gs, action.abilityId);
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    return setState({ ...next, gameStats: gs });
  }
  if (type === 'PLAYER_ITEM') {
    const next = playerUseItem(state, action.itemId);
    let gs = next.gameStats ?? createGameStats();
    gs = recordItemUsed(gs, action.itemId);
    gs = recordTurnPlayed(gs);
    return setState({ ...next, gameStats: gs });
  }

  if (type === 'SELECT_CLASS') {
    if (!CLASS_DEFINITIONS[action.classId]) {
      return setState(pushLog(state, 'Unknown class selected.'));
    }
    state = initialStateWithClass(action.classId);
    // Start in exploration phase instead of immediate combat
    state = {
      questState: initQuestState(),
      ...state,
      phase: 'exploration',
      log: [
        `You have chosen the path of the ${action.classId[0].toUpperCase() + action.classId.slice(1)}.`,
        `${getRoomDescription(state.world)} You may explore in any direction.`,
      ],
      visitedRooms: initVisitedRooms(1, 1),
      gameStats: createGameStats(),
    };
    return render(state, dispatch);
  }

  if (type === 'EXPLORE') {
    if (state.phase !== 'exploration') return;
    const direction = action.direction;
    if (!direction) return setState(pushLog(state, 'Choose a direction to move.'));

    const result = movePlayer(state.world, direction);
    if (!result.moved) {
      return setState(pushLog(state, `You cannot go ${direction}. The way is blocked.`));
    }

    let next = { ...state, world: result.worldState };
    if (result.transitioned) {
      next = {
        ...next,
        visitedRooms: markRoomVisited(
          next.visitedRooms || [],
          result.worldState.roomRow,
          result.worldState.roomCol
        ),
      };
    }
    // Update quest state on room enter
    const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
    const roomId = result.worldState?.roomRow !== undefined && result.worldState?.roomCol !== undefined
      ? ROOM_ID_MAP[result.worldState.roomRow]?.[result.worldState.roomCol]
      : null;
    if (roomId && next.questState) {
      const questResult = onRoomEnter(next.questState, roomId);
      next = { ...next, questState: questResult.questState };
    }
    const room = getCurrentRoom(result.worldState);
    const roomName = room?.name || 'a new area';

    // Room transition message
    if (result.transitioned) {
      next = pushLog(next, `You travel ${direction} and arrive at ${roomName}.`);
    } else {
      next = pushLog(next, `You move ${direction}.`);
    }

    // Check for random encounter (only on room transitions)
    if (result.transitioned) {
      const rng = nextRng(next.rngSeed || Date.now());
      next = { ...next, rngSeed: rng.seed };

      if (rng.value < ENCOUNTER_RATE) {
        // Start a new encounter based on zone level (default 1)
        next = startNewEncounter(next, 1);
        return setState(next);
      }
    }

    // No encounter - show exploration info
    const exits = getAvailableExits(result.worldState);
    next = pushLog(next, `Exits: ${exits.join(', ') || 'none'}.`);
    return setState(next);
  }

  if (type === 'MOVE') {
    if (state.phase !== 'exploration') {
      return setState(pushLog(state, 'You cannot move right now.'));
    }
    const direction = action.direction;
    if (!direction || !['north', 'south', 'east', 'west'].includes(direction)) {
      return setState(pushLog(state, 'Unknown direction.'));
    }
    const result = movePlayer(state.world, direction);
    if (!result.moved) {
      const reason = result.blocked === 'edge' ? 'The path ends here.' : 'Something blocks your way.';
      return setState(pushLog(state, reason));
    }
    const msg = result.transitioned && result.room
      ? `You move ${direction} into ${result.room.name}.`
      : `You move ${direction}.`;
    let next = pushLog({ ...state, world: result.worldState }, msg);
    if (result.transitioned) {
      next = {
        ...next,
        visitedRooms: markRoomVisited(
          next.visitedRooms || [],
          result.worldState.roomRow,
          result.worldState.roomCol
        ),
      };
    }
    // Update quest state on room enter
    const ROOM_ID_MAP_MOVE = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
    const moveRoomId = result.worldState?.roomRow !== undefined && result.worldState?.roomCol !== undefined
      ? ROOM_ID_MAP_MOVE[result.worldState.roomRow]?.[result.worldState.roomCol]
      : null;
    if (moveRoomId && next.questState) {
      const questResult = onRoomEnter(next.questState, moveRoomId);
      next = { ...next, questState: questResult.questState };
    }
    const logs = next.log;
    if (logs.length > 100) next = { ...next, log: logs.slice(logs.length - 100) };
    return setState(next);
  }

  if (type === 'VIEW_LEVEL_UPS') {
    // From victory screen, view the level-up details
    if (!state.pendingLevelUps || state.pendingLevelUps.length === 0) return;
    const luState = createLevelUpState(state.pendingLevelUps, 'victory');
    return setState({ ...state, phase: 'level-up', levelUpState: luState });
  }

  if (type === 'LEVEL_UP_CONTINUE') {
    if (state.phase !== 'level-up' || !state.levelUpState) return;
    const { levelUpState: nextLuState, done } = advanceLevelUp(state.levelUpState);
    if (done) {
      // All level-ups viewed, return to victory phase
      const returnPhase = state.levelUpState.returnPhase || 'victory';
      if (returnPhase === 'battle-summary-done') {
        const exits = getAvailableExits(state.world);
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
        return setState(next2);
      }
      return setState({ ...state, phase: returnPhase, levelUpState: undefined });
    }
    return setState({ ...state, levelUpState: nextLuState });
  }

  if (type === 'CONTINUE_AFTER_BATTLE') {
    if (state.phase !== 'battle-summary') return;
    // If there are pending level-ups, go to level-up phase
    if (state.pendingLevelUps && state.pendingLevelUps.length > 0) {
      const luState = createLevelUpState(state.pendingLevelUps, 'battle-summary-done');
      return setState({ ...state, phase: 'level-up', levelUpState: luState });
    }
    // Otherwise go straight to exploration
    const exits = getAvailableExits(state.world);
    let gs = state.gameStats ?? createGameStats();
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
    return setState(next);
  }

  if (type === 'CONTINUE_EXPLORING') {
    if (state.phase !== 'victory' && state.phase !== 'post-victory' && state.phase !== 'battle-summary-done') return;
    const exits = getAvailableExits(state.world);
    let next = {
      ...state,
      phase: 'exploration',
      player: { ...state.player, defending: false },
      levelUpState: undefined,
      pendingLevelUps: undefined,
    };
    next = pushLog(next, `You gather yourself and continue your journey.`);
    next = pushLog(next, `${getRoomDescription(state.world)} Exits: ${exits.join(', ') || 'none'}.`);
    return setState(next);
  }

  if (type === 'SEEK_ENCOUNTER') {
    if (state.phase !== 'exploration') return;
    // Force a new encounter (for players who want to grind)
    let next = pushLog(state, 'You search the area for monsters...');
    next = startNewEncounter(next, 1);
    return setState(next);
  }

  // TALK_TO_NPC: enter dialog phase with specific NPC (or first NPC in room)
  if (type === 'TALK_TO_NPC') {
    if (state.phase !== 'exploration') return;
    const roomId = getRoomId(state.world);
    const npcs = getNPCsInRoom(roomId);
    if (npcs.length === 0) {
      return setState(pushLog(state, 'There is no one here to talk to.'));
    }
    // Find NPC by id if provided, otherwise use first NPC
    const npc = action.npcId ? npcs.find((n) => n.id === action.npcId) : npcs[0];
    if (!npc) {
      return setState(pushLog(state, 'That person is not here.'));
    }
    const dialogState = createDialogState(npc);
    return setState({
      ...state,
      phase: 'dialog',
      dialogState,
      preDialogPhase: 'exploration',
    });
  }

  // DIALOG_NEXT: advance dialog or close when done
  if (type === 'DIALOG_NEXT') {
    if (state.phase !== 'dialog' || !state.dialogState) return;
    const next = advanceDialog(state.dialogState);
    if (next.done) {
      const returnPhase = state.preDialogPhase || 'exploration';
      const { dialogState: _ds, preDialogPhase: _pdp, ...rest } = state;
      return setState(pushLog({ ...rest, phase: returnPhase }, `${state.dialogState.npcName}: Farewell, traveler.`));
    }
    return setState({ ...state, dialogState: next });
  }

  // DIALOG_CLOSE: close dialog and return to exploration without farewell
  if (type === 'DIALOG_CLOSE') {
    if (state.phase !== 'dialog') return;
    const returnPhase = state.preDialogPhase || 'exploration';
    const { dialogState: _ds, preDialogPhase: _pdp, ...rest } = state;
    return setState({ ...rest, phase: returnPhase });
  }

  if (type === 'VIEW_INVENTORY') {
    if (state.phase === 'class-select') return;
    return setState({ ...state, phase: 'inventory', inventoryState: createInventoryState(state.phase) });
  }

  if (type === 'VIEW_QUESTS') {
    if (state.phase === 'class-select') return;
    return setState({ ...state, phase: 'quests', previousPhase: state.phase });
  }

  if (type === 'CLOSE_QUESTS') {
    if (state.phase !== 'quests') return;
    return setState({ ...state, phase: state.previousPhase || 'exploration' });
  }

  if (type === 'VIEW_STATS') {
    if (state.phase === 'class-select') return;
    return setState({ ...state, phase: 'stats', previousPhase: state.phase });
  }

  if (type === 'CLOSE_STATS') {
    if (state.phase !== 'stats') return;
    return setState({ ...state, phase: state.previousPhase || 'exploration' });
  }

  if (type === 'VIEW_SETTINGS') {
    if (state.phase === 'class-select') return;
    const settings = loadSettings();
    return setState({ ...state, phase: 'settings', previousPhase: state.phase, settings });
  }

  if (type === 'CLOSE_SETTINGS') {
    if (state.phase !== 'settings') return;
    return setState({ ...state, phase: state.previousPhase || 'exploration' });
  }

  if (type === 'UPDATE_SETTING') {
    if (!state.settings) return;
    const newSettings = updateSetting(state.settings, action.path, action.value);
    saveSettings(newSettings);
    return setState({ ...state, settings: newSettings });
  }

  if (type === 'RESET_SETTINGS') {
    const defaults = resetSettings();
    return setState({ ...state, settings: defaults });
  }

  if (type === 'ACCEPT_QUEST') {
    if (!state.questState) return setState(pushLog(state, 'Quest system not initialized.'));
    const result = acceptQuest(state.questState, action.questId);
    const next = { ...state, questState: result.questState };
    return setState(pushLog(next, result.message));
  }

  if (state.phase === 'inventory') {
    const inventoryActions = ['CLOSE_INVENTORY', 'INVENTORY_USE', 'INVENTORY_EQUIP', 'INVENTORY_UNEQUIP', 'INVENTORY_VIEW_DETAILS', 'INVENTORY_BACK'];
    if (inventoryActions.includes(type)) {
      return setState(handleInventoryAction(state, action));
    }
  }

  if (type === 'TRY_AGAIN') {
    // After defeat, record the loss before resetting
    let gs = state.gameStats ?? createGameStats();
    gs = recordBattleFled(gs);
    // Go back to class select
    state = { phase: 'class-select', log: ['The adventure ends... but another awaits. Select your class.'] };
    return render(state, dispatch);
  }

  if (type === 'NEW') return setState({ ...initialState(), gameStats: createGameStats() });

  if (type === 'LOAD') {
    const loaded = loadFromLocalStorage();
    if (loaded) {
      return setState({ ...loaded, log: [...(loaded.log ?? []), 'Save loaded.'] });
    }
    return setState(pushLog(state, 'No save found.'));
  }

  if (type === 'SAVE') {
    saveToLocalStorage(state);
    return setState(pushLog(state, 'Game saved.'));
  }

  if (type === 'LOG') {
    return setState(pushLog(state, action.line ?? '(log)'));
  }

  // Unknown action: no-op
  return setState(state);
}

render(state, dispatch);

// Keyboard shortcuts: WASD/arrow keys to explore
window.addEventListener('keydown', (event) => {
  const target = event.target;
  const tag = target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

  const direction = keyToCardinalDirection(event.key);
  if (!direction) return;

  event.preventDefault();
  dispatch({ type: 'EXPLORE', direction });
});
