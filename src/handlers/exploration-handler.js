import { movePlayer, getCurrentRoom, getRoomExits } from '../map.js';
import { nextRng, startNewEncounter } from '../combat.js';
import { markRoomVisited } from '../minimap.js';
import { onRoomEnter, onNPCTalk, onNPCDeliver } from '../quest-integration.js';
import { buildPendingRewards, hasPendingRewards } from '../quest-rewards.js';
import { getNPCsInRoom, createDialogState } from '../npc-dialog.js';
import { pushLog } from '../state.js';
import { advanceTime, tryChangeWeather, hasWeatherSystem } from '../weather.js';
import { logLocationDiscovery } from '../journal.js';
import { createNPCRelationshipManager, ReputationEvent, RelationshipLevel } from '../npc-relationships.js';
import { removeItemFromInventory } from '../items.js';
import { getExplorationQuest } from '../data/exploration-quests.js';
import { processQuestCompletionWithBonus, generateQuestCompletionMessages } from '../quest-relationship-bridge.js';
import {
  tryTriggerWorldEvent,
  tickWorldEvent,
  applyImmediateEffect,
  applyPerMoveEffect,
  getEffectiveEncounterRate,
  hasActiveWorldEvent,
  getWorldEventBanner,
} from '../world-events.js';

const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];

function getRoomId(worldState) {
  if (!worldState) return null;
  return ROOM_ID_MAP[worldState.roomRow]?.[worldState.roomCol] ?? null;
}

function getRoomDescription(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

function getAvailableExits(worldState) {
  return getRoomExits(worldState);
}

function mapLevelToDifficulty(level) {
  const lvl = Number(level);
  if (!Number.isFinite(lvl)) return 'normal';
  if (lvl <= 1) return 'trivial';
  if (lvl === 2) return 'easy';
  if (lvl === 3) return 'normal';
  if (lvl === 4) return 'hard';
  if (lvl === 5) return 'epic';
  return 'legendary';
}

function inferQuestRelationshipInfo(questDef, fallbackName) {
  if (!questDef) return null;

  const objectiveNpcIds = new Set();
  for (const stage of questDef.stages || []) {
    for (const objective of stage.objectives || []) {
      if (objective.npcId) objectiveNpcIds.add(objective.npcId);
      if (objective.targetNpcId) objectiveNpcIds.add(objective.targetNpcId);
    }
  }

  let npcId = questDef.questGiver || questDef.npcId || null;
  if (!npcId && objectiveNpcIds.size === 1) {
    npcId = [...objectiveNpcIds][0];
  }

  const objectiveNpcList = [...objectiveNpcIds];
  let beneficiaryNpcs = questDef.beneficiaryNpcs;
  if (!beneficiaryNpcs && objectiveNpcList.length > 0) {
    if (objectiveNpcList.length > 1) {
      beneficiaryNpcs = objectiveNpcList.filter((id) => id !== npcId);
    } else if (!npcId) {
      beneficiaryNpcs = objectiveNpcList;
    }
  }

  const difficulty = questDef.difficulty || mapLevelToDifficulty(questDef.level);

  return {
    id: questDef.id,
    name: questDef.name || fallbackName || questDef.id,
    npcId,
    difficulty,
    beneficiaryNpcs,
  };
}

function applyQuestRelationshipEffects(nextState, completedQuests) {
  if (!completedQuests || completedQuests.length === 0) return nextState;

  let state = nextState;
  let manager = nextState.npcRelationshipManager;
  let managerUsed = false;

  for (const completed of completedQuests) {
    if (!completed?.questId) continue;
    const questDef = getExplorationQuest(completed.questId);
    if (!questDef) continue;

    const relationshipInfo = inferQuestRelationshipInfo(questDef, completed.questName);
    if (!relationshipInfo) continue;

    const hasBeneficiaries = relationshipInfo.beneficiaryNpcs && relationshipInfo.beneficiaryNpcs.length > 0;
    if (!relationshipInfo.npcId && !hasBeneficiaries) continue;

    if (!managerUsed) {
      manager = manager ?? createNPCRelationshipManager();
      state = { ...state, npcRelationshipManager: manager };
      managerUsed = true;
    }

    const result = processQuestCompletionWithBonus(manager, relationshipInfo);
    const messages = generateQuestCompletionMessages(result);
    for (const msg of messages) {
      state = pushLog(state, msg);
    }
  }

  if (managerUsed && state.npcRelationshipManager !== manager) {
    state = { ...state, npcRelationshipManager: manager };
  }

  return state;
}

export function handleExplorationAction(state, action) {
  // Check if phase is exploration (except maybe SEEK_ENCOUNTER which forces it? No, checks phase too)
  if (state.phase !== 'exploration') return null;

  const type = action.type;

  if (type === 'EXPLORE') {
    const direction = action.direction;
    if (!direction) return pushLog(state, 'Choose a direction to move.');

    const result = movePlayer(state.world, direction);
    if (!result.moved) {
      return pushLog(state, `You cannot go ${direction}. The way is blocked.`);
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

    if (hasWeatherSystem(state)) {
      const previousWeather = next.weatherState?.weather;
      let updatedWeather = advanceTime(next.weatherState);
      updatedWeather = tryChangeWeather(updatedWeather, next.rngSeed || Date.now());
      next = { ...next, weatherState: updatedWeather };
      if (previousWeather && updatedWeather.weather !== previousWeather) {
        next = pushLog(next, `The weather shifts to ${updatedWeather.weather}.`);
      }
    }

    // Quest Integration
    const roomId = getRoomId(result.worldState);
    if (roomId && next.questState) {
      const questResult = onRoomEnter(next.questState, roomId);
      next = { ...next, questState: questResult.questState };
      // Queue rewards if quests completed
      const newRewards = buildPendingRewards(questResult.completedQuests);
      if (newRewards.length > 0) {
        const existing = next.pendingQuestRewards || [];
        next = { ...next, pendingQuestRewards: [...existing, ...newRewards] };
      }
      next = applyQuestRelationshipEffects(next, questResult.completedQuests);
    }

    const room = getCurrentRoom(result.worldState);
    const roomName = room?.name || 'a new area';

    if (result.transitioned) {
      next = pushLog(next, `You travel ${direction} and arrive at ${roomName}.`);
      next = logLocationDiscovery(next, roomName);
    } else {
      next = pushLog(next, `You move ${direction}.`);
    }

    let newWorldEvent = tickWorldEvent(state.worldEvent);
    if (state.worldEvent && !newWorldEvent) {
      next = pushLog(next, 'The world event has ended.');
    }

    if (!hasActiveWorldEvent(newWorldEvent)) {
      const triggeredEvent = tryTriggerWorldEvent(next.rngSeed, newWorldEvent);
      if (triggeredEvent) {
        newWorldEvent = triggeredEvent;
        next = applyImmediateEffect(next, newWorldEvent);
        const banner = getWorldEventBanner(newWorldEvent);
        if (banner) next = pushLog(next, banner);
      }
    }

    next = { ...next, worldEvent: newWorldEvent };
    next = applyPerMoveEffect(next, next.worldEvent);

    // Random Encounter
    if (result.transitioned) {
      const rng = nextRng(next.rngSeed || Date.now());
      next = { ...next, rngSeed: rng.seed };

      if (rng.value < getEffectiveEncounterRate(0.3, next.worldEvent)) {
        return startNewEncounter(next, 1);
      }
    }

    const exits = getAvailableExits(result.worldState);
    next = pushLog(next, `Exits: ${exits.join(', ') || 'none'}.`);

    // Transition to quest reward phase if rewards pending
    if (hasPendingRewards(next.pendingQuestRewards)) {
      return { ...next, phase: 'quest-reward', preRewardPhase: 'exploration' };
    }

    return next;
  }

  if (type === 'MOVE') {
    const direction = action.direction;
    if (!direction || !['north', 'south', 'east', 'west'].includes(direction)) {
        return pushLog(state, 'Unknown direction.');
    }
    const result = movePlayer(state.world, direction);
    if (!result.moved) {
      const reason = result.blocked === 'edge' ? 'The path ends here.' : 'Something blocks your way.';
      return pushLog(state, reason);
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
    
    // Quest Integration
    const roomId = getRoomId(result.worldState);
    if (roomId && next.questState) {
      const questResult = onRoomEnter(next.questState, roomId);
      next = { ...next, questState: questResult.questState };
      // Queue rewards if quests completed
      const newRewards = buildPendingRewards(questResult.completedQuests);
      if (newRewards.length > 0) {
        const existing = next.pendingQuestRewards || [];
        next = { ...next, pendingQuestRewards: [...existing, ...newRewards] };
      }
      next = applyQuestRelationshipEffects(next, questResult.completedQuests);
    }

    const logs = next.log;
    if (logs.length > 100) next = { ...next, log: logs.slice(logs.length - 100) };
    return next;
  }
  
  if (type === 'SEEK_ENCOUNTER') {
     let next = pushLog(state, 'You search the area for monsters...');
     return startNewEncounter(next, 1);
  }
  
  if (type === 'TALK_TO_NPC') {
    const roomId = getRoomId(state.world);
    const npcs = getNPCsInRoom(roomId);
    if (npcs.length === 0) {
      return pushLog(state, 'There is no one here to talk to.');
    }
    const npc = action.npcId ? npcs.find((n) => n.id === action.npcId) : npcs[0];
    if (!npc) {
      return pushLog(state, 'That person is not here.');
    }
    let next = state;

    // Quest TALK objective integration
    if (next.questState) {
      const questResult = onNPCTalk(next.questState, npc.id);
      next = { ...next, questState: questResult.questState };

      for (const msg of questResult.messages) {
        next = pushLog(next, msg);
      }

      const newRewards = buildPendingRewards(questResult.completedQuests);
      if (newRewards.length > 0) {
        const existing = next.pendingQuestRewards || [];
        next = { ...next, pendingQuestRewards: [...existing, ...newRewards] };
      }
      next = applyQuestRelationshipEffects(next, questResult.completedQuests);
    }

    // Quest DELIVER objective integration
    if (next.questState && next.player?.inventory) {
      const deliverResult = onNPCDeliver(next.questState, npc.id, next.player.inventory);
      next = { ...next, questState: deliverResult.questState };

      for (const msg of deliverResult.messages) {
        next = pushLog(next, msg);
      }

      // Consume delivered items from player inventory
      if (deliverResult.itemsConsumed.length > 0) {
        let newInventory = { ...next.player.inventory };
        for (const { itemId, quantity } of deliverResult.itemsConsumed) {
          newInventory = removeItemFromInventory(newInventory, itemId, quantity);
        }
        next = { ...next, player: { ...next.player, inventory: newInventory } };
      }

      // Queue pending quest rewards
      const newDeliverRewards = buildPendingRewards(deliverResult.completedQuests);
      if (newDeliverRewards.length > 0) {
        const existing = next.pendingQuestRewards || [];
        next = { ...next, pendingQuestRewards: [...existing, ...newDeliverRewards] };
      }
      next = applyQuestRelationshipEffects(next, deliverResult.completedQuests);
    }

    // NPC relationship greeting/reputation
    const npcRelationshipManager = next.npcRelationshipManager ?? createNPCRelationshipManager();
    npcRelationshipManager.modifyReputation(
      npc.id,
      ReputationEvent.DIALOGUE_POSITIVE.value,
      ReputationEvent.DIALOGUE_POSITIVE
    );

    const relationshipLevel =
      npcRelationshipManager.getRelationshipLevel(npc.id) || RelationshipLevel.NEUTRAL;

    const dialogState = createDialogState(npc, relationshipLevel);
    return {
      ...next,
      phase: 'dialog',
      dialogState,
      preDialogPhase: 'exploration',
      npcRelationshipManager,
    };
  }

  if (type === 'DISMISS_WORLD_EVENT') {
    const next = pushLog({ ...state, worldEvent: null }, 'You dismiss the world event notification.');
    return next;
  }

  return null;
}

// Fast Travel Handlers

import {
  getUnlockedFastTravelDestinations,
  isRoomUnlockedForFastTravel,
  executeFastTravel,
  canUseFastTravel,
} from '../fast-travel.js';

export function handleFastTravelAction(state, action) {
  if (state.phase !== 'exploration' && action.type !== 'CLOSE_FAST_TRAVEL') {
    return null;
  }

  const type = action.type;

  if (type === 'OPEN_FAST_TRAVEL') {
    const { canTravel, reason } = canUseFastTravel(state);
    if (!canTravel) {
      return pushLog(state, reason || 'Fast travel is not available right now.');
    }
    return { ...state, fastTravelModalOpen: true };
  }

  if (type === 'CLOSE_FAST_TRAVEL') {
    return { ...state, fastTravelModalOpen: false };
  }

  if (type === 'FAST_TRAVEL') {
    const destinationId = action.destination;
    if (!destinationId) {
      return pushLog(state, 'No destination specified for fast travel.');
    }

    // Check if destination is unlocked
    if (!isRoomUnlockedForFastTravel(state.visitedRooms, destinationId)) {
      return pushLog(state, 'You have not discovered that location yet.');
    }

    // Execute the fast travel
    const result = executeFastTravel(state.world, destinationId);
    if (!result.success) {
      return pushLog(state, result.message);
    }

    let next = {
      ...state,
      world: result.worldState,
      fastTravelModalOpen: false,
    };

    next = pushLog(next, result.message);

    // Quest Integration - check for room-based quest completion
    const roomId = destinationId;
    if (next.questState) {
      const questResult = onRoomEnter(next.questState, roomId);
      next = { ...next, questState: questResult.questState };
      const newRewards = buildPendingRewards(questResult.completedQuests);
      if (newRewards.length > 0) {
        const existing = next.pendingQuestRewards || [];
        next = { ...next, pendingQuestRewards: [...existing, ...newRewards] };
      }
      next = applyQuestRelationshipEffects(next, questResult.completedQuests);
    }

    // Transition to quest reward phase if rewards pending
    if (hasPendingRewards(next.pendingQuestRewards)) {
      return { ...next, phase: 'quest-reward', preRewardPhase: 'exploration' };
    }

    return next;
  }

  return null;
}
