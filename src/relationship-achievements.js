import { RelationshipLevel } from './npc-relationships.js';

export const FRIENDLY = RelationshipLevel?.FRIENDLY || 'FRIENDLY';
export const ALLIED = RelationshipLevel?.ALLIED || 'ALLIED';

/**
 * Check if a relationship level change triggers any social milestones.
 * @param {Object} state - Current game state.
 * @param {string} npcId - NPC identifier.
 * @param {string|null|undefined} previousLevel - Relationship level before the change.
 * @param {string} newLevel - Relationship level after the change.
 * @returns {{ achievementsUnlocked: string[], milestoneReached: string|null }} Milestone result.
 */
export function checkRelationshipMilestones(state, npcId, previousLevel, newLevel) {
  const result = { achievementsUnlocked: [], milestoneReached: null };
  const gameStats = state?.gameStats || {};

  if (newLevel === FRIENDLY && previousLevel !== FRIENDLY && !gameStats.firstFriendlyNpc) {
    result.milestoneReached = 'FRIENDLY';
    result.achievementsUnlocked.push('first_friend');
  }

  if (newLevel === ALLIED && previousLevel !== ALLIED && !gameStats.firstAlliedNpc) {
    result.milestoneReached = 'ALLIED';
    result.achievementsUnlocked.push('first_ally');
  }

  return result;
}

/**
 * Apply a relationship milestone to game state immutably.
 * @param {Object} state - Current game state.
 * @param {string} npcId - NPC identifier.
 * @param {string|null} milestone - Milestone key ('FRIENDLY' or 'ALLIED').
 * @returns {Object} Updated state with milestone applied.
 */
export function applyRelationshipMilestone(state, npcId, milestone) {
  const nextGameStats = { ...(state.gameStats || {}) };

  if (milestone === 'FRIENDLY') {
    nextGameStats.firstFriendlyNpc = npcId;
  } else if (milestone === 'ALLIED') {
    nextGameStats.firstAlliedNpc = npcId;
  }

  return { ...state, gameStats: nextGameStats };
}

export const RELATIONSHIP_ACHIEVEMENTS = [
  {
    id: 'first_friend',
    name: 'Making Friends',
    description: 'Reach FRIENDLY status with an NPC for the first time',
    category: 'social'
  },
  {
    id: 'first_ally',
    name: 'Trusted Ally',
    description: 'Reach ALLIED status with an NPC for the first time',
    category: 'social'
  }
];

/**
 * Compute progress toward relationship achievements.
 * @param {Object} state - Current game state.
 * @returns {{ friendlyNpcs: number, alliedNpcs: number, firstFriendlyNpc: string|null, firstAlliedNpc: string|null }} Progress summary.
 */
export function getRelationshipAchievementProgress(state) {
  const relationships = state?.npcRelationshipManager?.relationships;
  const records = relationships instanceof Map
    ? Array.from(relationships.values())
    : Array.isArray(relationships)
      ? relationships
      : relationships && typeof relationships === 'object'
        ? Object.values(relationships)
        : [];

  let friendlyNpcs = 0;
  let alliedNpcs = 0;

  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    if (record.level === FRIENDLY || record.level === ALLIED) {
      friendlyNpcs += 1;
    }
    if (record.level === ALLIED) {
      alliedNpcs += 1;
    }
  }

  const gameStats = state?.gameStats || {};

  return {
    friendlyNpcs,
    alliedNpcs,
    firstFriendlyNpc: gameStats.firstFriendlyNpc || null,
    firstAlliedNpc: gameStats.firstAlliedNpc || null
  };
}
