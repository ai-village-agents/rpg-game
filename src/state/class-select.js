import { initialStateWithClass, pushLog } from '../state.js';
import { CLASS_DEFINITIONS } from '../characters/classes.js';
import { initQuestState } from '../quest-integration.js';
import { getCurrentRoom } from '../map.js';

function describeStartingRoom(worldState) {
  const room = getCurrentRoom(worldState);
  if (!room) return 'You stand in an unknown place.';
  return room.name || 'An unremarkable area.';
}

function formatClassName(classId) {
  if (!classId || typeof classId !== 'string') return 'Unknown';
  return classId[0].toUpperCase() + classId.slice(1);
}

export function blankCharacterState() {
  return {
    phase: 'class-select',
    log: ['Welcome to AI Village RPG! Select your class.'],
  };
}

export function handleClassSelection(state, action) {
  const classId = action?.classId;
  if (!CLASS_DEFINITIONS[classId]) {
    return pushLog(state, 'Unknown class selected.');
  }

  const baseState = initialStateWithClass(classId);
  const className = formatClassName(classId);

  return {
    questState: initQuestState(),
    ...baseState,
    phase: 'exploration',
    log: [
      `You have chosen the path of the ${className}.`,
      `${describeStartingRoom(baseState.world)} You may explore in any direction.`,
    ],
  };
}
