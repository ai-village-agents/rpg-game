import { NPCRelationshipManager } from './npc-relationships.js';

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

const GREETINGS = Object.freeze({
  NEVER_MET: 'Greetings, traveler.',
  FIRST_MEETING: 'Hello, stranger.',
  RECENT_RETURN: 'Back so soon?',
  FRIENDLY_RETURN: 'Good to see you again.',
  LONG_ABSENCE: "It's been a while!"
});

/**
 * Basic HTML escaping to keep strings safe for UI rendering.
 * @param {unknown} value - Potentially unsafe value.
 * @returns {string} Escaped string.
 */
function esc(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Resolve an NPCRelationshipManager instance from provided state.
 * @param {unknown} state - Relationship state container or manager.
 * @returns {NPCRelationshipManager|null} Resolved manager or null.
 */
function resolveRelationshipManager(state) {
  if (state instanceof NPCRelationshipManager) {
    return state;
  }
  if (state && state.relationshipManager instanceof NPCRelationshipManager) {
    return state.relationshipManager;
  }
  if (state && typeof state.getRelationship === 'function' && typeof state.getRelationshipLevel === 'function') {
    return state;
  }
  if (state && state.relationshipManager && typeof state.relationshipManager.getRelationship === 'function') {
    return state.relationshipManager;
  }
  return null;
}

/**
 * Check if a relationship already exists for an NPC without creating it.
 * @param {NPCRelationshipManager} manager - Relationship manager.
 * @param {string} npcId - Target NPC identifier.
 * @returns {boolean} True if a relationship record exists.
 */
function relationshipExists(manager, npcId) {
  if (!manager || !npcId) {
    return false;
  }
  if (typeof manager.getState === 'function') {
    const snapshot = manager.getState();
    if (snapshot && Array.isArray(snapshot.relationships)) {
      return snapshot.relationships.some(([id]) => id === npcId);
    }
  }
  return false;
}

/**
 * Retrieve a relationship record from any supported snapshot structure.
 * @param {unknown} state - State container that may hold relationships.
 * @param {string} npcId - Target NPC identifier.
 * @returns {object|null} Relationship record or null.
 */
function getRelationshipFromState(state, npcId) {
  if (!state || !npcId) {
    return null;
  }
  const relationships = state.relationships;
  if (relationships instanceof Map) {
    return relationships.get(npcId) || null;
  }
  if (Array.isArray(relationships)) {
    const entry = relationships.find(([id]) => id === npcId);
    return entry ? entry[1] : null;
  }
  if (relationships && typeof relationships === 'object' && npcId in relationships) {
    return relationships[npcId];
  }
  return null;
}

/**
 * Determine the appropriate greeting based on interaction timing.
 * @param {unknown} lastInteraction - Timestamp of the last interaction.
 * @returns {string} Greeting text.
 */
function selectGreeting(lastInteraction) {
  if (typeof lastInteraction !== 'number' || !Number.isFinite(lastInteraction)) {
    return GREETINGS.FIRST_MEETING;
  }
  const elapsed = Math.max(0, Date.now() - lastInteraction);
  if (elapsed < FIVE_MINUTES) {
    return GREETINGS.RECENT_RETURN;
  }
  if (elapsed < THIRTY_MINUTES) {
    return GREETINGS.FRIENDLY_RETURN;
  }
  return GREETINGS.LONG_ABSENCE;
}

/**
 * Provide a greeting that changes based on the player's recent interactions with an NPC.
 *
 * @param {string} npcId - Unique identifier for the NPC.
 * @param {object|NPCRelationshipManager} state - Relationship manager or state snapshot.
 * @returns {string} Time-aware greeting text.
 */
export function getTimeAwareGreeting(npcId, state) {
  const trimmedId = typeof npcId === 'string' ? npcId.trim() : '';
  if (!trimmedId) {
    return esc(GREETINGS.NEVER_MET);
  }

  const manager = resolveRelationshipManager(state);
  if (manager) {
    const hasExisting = relationshipExists(manager, trimmedId);
    if (!hasExisting) {
      return esc(GREETINGS.NEVER_MET);
    }
    try {
      const relationship = manager.getRelationship(trimmedId);
      if (!relationship || relationship.lastInteraction === null || relationship.lastInteraction === undefined) {
        return esc(GREETINGS.FIRST_MEETING);
      }
      return esc(selectGreeting(relationship.lastInteraction));
    } catch {
      return esc(GREETINGS.NEVER_MET);
    }
  }

  const snapshotRelationship = getRelationshipFromState(state, trimmedId);
  if (!snapshotRelationship) {
    return esc(GREETINGS.NEVER_MET);
  }
  if (snapshotRelationship.lastInteraction === null || snapshotRelationship.lastInteraction === undefined) {
    return esc(GREETINGS.FIRST_MEETING);
  }
  return esc(selectGreeting(snapshotRelationship.lastInteraction));
}

/**
 * Update the last interaction timestamp for an NPC relationship.
 *
 * @param {string} npcId - Unique identifier for the NPC.
 * @param {object|NPCRelationshipManager} state - Relationship manager or state snapshot.
 * @returns {number|null} The updated timestamp, or null if the update failed.
 */
export function updateNPCMemory(npcId, state) {
  const trimmedId = typeof npcId === 'string' ? npcId.trim() : '';
  if (!trimmedId) {
    return null;
  }

  const timestamp = Date.now();
  const manager = resolveRelationshipManager(state);
  if (manager) {
    if (typeof manager.getRelationship !== 'function') {
      return null;
    }
    try {
      const relationship = manager.getRelationship(trimmedId);
      if (!relationship || typeof relationship !== 'object') {
        return null;
      }
      relationship.lastInteraction = timestamp;
      return timestamp;
    } catch {
      return null;
    }
  }

  const snapshotRelationship = getRelationshipFromState(state, trimmedId);
  if (snapshotRelationship && typeof snapshotRelationship === 'object') {
    snapshotRelationship.lastInteraction = timestamp;
    return timestamp;
  }

  return null;
}
