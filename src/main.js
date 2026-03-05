import { initialState, initialStateWithClass, loadFromLocalStorage, saveToLocalStorage, pushLog } from './state.js';
import { playerAttack, playerDefend, playerUsePotion, enemyAct, startNewEncounter } from './combat.js';
import { render } from './render.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';
import { movePlayer, getCurrentRoom, getRoomExits } from './map.js';
import { nextRng } from './combat.js';

const ENCOUNTER_RATE = 0.3; // 30% chance per move

let state = { phase: 'class-select', log: ['Welcome to AI Village RPG! Select your class.'] };

function setState(next) {
  state = next;
  render(state, dispatch);

  // If it became enemy turn, resolve after a short pause.
  if (state.phase === 'enemy-turn') {
    window.setTimeout(() => {
      state = enemyAct(state);
      render(state, dispatch);

      // After enemy acts, check if combat ended and transition
      if (state.phase === 'victory') {
        // Auto-transition to post-victory exploration after short delay
      }
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

function dispatch(action) {
  const type = action?.type;

  if (type === 'PLAYER_ATTACK') return setState(playerAttack(state));
  if (type === 'PLAYER_DEFEND') return setState(playerDefend(state));
  if (type === 'PLAYER_POTION') return setState(playerUsePotion(state));

  if (type === 'SELECT_CLASS') {
    if (!CLASS_DEFINITIONS[action.classId]) {
      return setState(pushLog(state, 'Unknown class selected.'));
    }
    state = initialStateWithClass(action.classId);
    // Start in exploration phase instead of immediate combat
    state = {
      ...state,
      phase: 'exploration',
      log: [
        `You have chosen the path of the ${action.classId[0].toUpperCase() + action.classId.slice(1)}.`,
        `${getRoomDescription(state.world)} You may explore in any direction.`,
      ],
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

  if (type === 'CONTINUE_EXPLORING') {
    if (state.phase !== 'victory' && state.phase !== 'post-victory') return;
    const exits = getAvailableExits(state.world);
    let next = {
      ...state,
      phase: 'exploration',
      player: { ...state.player, defending: false },
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

  if (type === 'VIEW_INVENTORY') {
    if (state.phase === 'class-select') return;
    const inv = state.player?.inventory || {};
    const entries = Object.entries(inv)
      .filter(([, count]) => count > 0)
      .map(([item, count]) => `${item}: ${count}`);
    const gold = state.player?.gold ?? 0;
    const invMsg = entries.length > 0
      ? `Inventory: ${entries.join(', ')}. Gold: ${gold}.`
      : `Inventory is empty. Gold: ${gold}.`;
    return setState(pushLog(state, invMsg));
  }

  if (type === 'TRY_AGAIN') {
    // After defeat, go back to class select
    state = { phase: 'class-select', log: ['The adventure ends... but another awaits. Select your class.'] };
    return render(state, dispatch);
  }

  if (type === 'NEW') return setState(initialState());

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
