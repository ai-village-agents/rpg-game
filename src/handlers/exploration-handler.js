import { movePlayer, getCurrentRoom, getRoomExits } from '../map.js';
import { nextRng, startNewEncounter } from '../combat.js';
import { markRoomVisited } from '../minimap.js';
import { onRoomEnter, onNPCTalk } from '../quest-integration.js';
import { buildPendingRewards, hasPendingRewards } from '../quest-rewards.js';
import { getNPCsInRoom, createDialogState } from '../npc-dialog.js';
import { pushLog } from '../state.js';
import { advanceTime, tryChangeWeather, hasWeatherSystem } from '../weather.js';
import { logLocationDiscovery } from '../journal.js';
import { createNPCRelationshipManager, ReputationEvent, RelationshipLevel } from '../npc-relationships.js';
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
