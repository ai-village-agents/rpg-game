import { movePlayer, getCurrentRoom, getRoomExits } from '../map.js';
import { nextRng, startNewEncounter } from '../combat.js';
import { markRoomVisited } from '../minimap.js';
import { onRoomEnter } from '../quest-integration.js';
import { getNPCsInRoom, createDialogState } from '../npc-dialog.js';
import { pushLog } from '../state.js';

const ENCOUNTER_RATE = 0.3;
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

    // Quest Integration
    const roomId = getRoomId(result.worldState);
    if (roomId && next.questState) {
      const questResult = onRoomEnter(next.questState, roomId);
      next = { ...next, questState: questResult.questState };
    }

    const room = getCurrentRoom(result.worldState);
    const roomName = room?.name || 'a new area';

    if (result.transitioned) {
      next = pushLog(next, `You travel ${direction} and arrive at ${roomName}.`);
    } else {
      next = pushLog(next, `You move ${direction}.`);
    }

    // Random Encounter
    if (result.transitioned) {
      const rng = nextRng(next.rngSeed || Date.now());
      next = { ...next, rngSeed: rng.seed };

      if (rng.value < ENCOUNTER_RATE) {
        return startNewEncounter(next, 1);
      }
    }

    const exits = getAvailableExits(result.worldState);
    next = pushLog(next, `Exits: ${exits.join(', ') || 'none'}.`);
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
    const dialogState = createDialogState(npc);
    return {
      ...state,
      phase: 'dialog',
      dialogState,
      preDialogPhase: 'exploration',
    };
  }

  return null;
}
