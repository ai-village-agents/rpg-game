/**
 * sporeling-integration.js — Integrates creature evolution system with gameplay.
 *
 * Features:
 * - Recruit sporelings as special evolving companions
 * - Award evolution points after combat victories
 * - Trigger evolution when sporeling reaches threshold
 * - Sporeling stats scale with evolution stage
 */

import { pushLog } from './state.js';
import {
  createSporeling,
  getSporeling as getSporelingFromState,
  recruitSporeling as baseRecruitSporeling,
  awardEvolutionPoints as baseAwardEvolutionPoints,
  evolveSporeling as baseEvolveSporeling,
  canEvolve,
  getNextStage,
  getAvailableTraits,
  EVOLUTION_STAGES,
  EVOLUTION_TRAITS,
} from './creature-evolution.js';

/**
 * Get the sporeling companion from state if one exists.
 * @param {object} state
 * @returns {object|null}
 */
export function getSporeling(state) {
  return getSporelingFromState(state);
}

/**
 * Check if player already has a sporeling companion.
 * @param {object} state
 * @returns {boolean}
 */
export function hasSporeling(state) {
  return getSporeling(state) !== null;
}

/**
 * Recruit a new sporeling companion.
 * Players can only have one sporeling at a time.
 * @param {object} state
 * @param {string} [name='Sporeling'] - custom name for the sporeling
 * @returns {object} updated state
 */
export function recruitSporelingCompanion(state, name = 'Sporeling') {
  if (hasSporeling(state)) {
    return pushLog(state, 'You already have a sporeling companion.');
  }

  const companions = Array.isArray(state.companions) ? state.companions : [];
  const maxCompanions = state.maxCompanions ?? 2;

  if (companions.length >= maxCompanions) {
    return pushLog(state, 'Your party is full. Dismiss a companion first.');
  }

  // Use the base recruit function which handles state properly
  return baseRecruitSporeling(state, name);
}

/**
 * Dismiss the sporeling companion.
 * @param {object} state
 * @returns {object} updated state
 */
export function dismissSporeling(state) {
  const sporeling = getSporeling(state);
  if (!sporeling) {
    return pushLog(state, 'You do not have a sporeling companion.');
  }

  const companions = Array.isArray(state.companions) ? state.companions : [];
  const next = {
    ...state,
    companions: companions.filter((c) => c.type !== 'EVOLVING_CREATURE'),
  };

  return pushLog(next, `${sporeling.name} left your party.`);
}

/**
 * Award evolution points to sporeling after combat victory.
 * Points awarded based on enemy XP reward.
 * @param {object} state
 * @param {number} enemyXpReward - XP from defeated enemy
 * @returns {object} updated state
 */
export function awardSporelingCombatPoints(state, enemyXpReward) {
  const sporeling = getSporeling(state);
  if (!sporeling || !sporeling.alive) {
    return state;
  }

  // Award 1 evolution point per 5 XP (minimum 1)
  const pointsToAward = Math.max(1, Math.floor(enemyXpReward / 5));

  // Use base function which operates on state
  let next = baseAwardEvolutionPoints(state, pointsToAward);

  // Check if ready to evolve after awarding points
  const updatedSporeling = getSporeling(next);
  if (updatedSporeling && canEvolve(updatedSporeling)) {
    const nextStage = getNextStage(updatedSporeling);
    if (nextStage) {
      const stageName = EVOLUTION_STAGES[nextStage]?.name || nextStage;
      next = pushLog(next, `${updatedSporeling.name} is ready to evolve to ${stageName}!`);
    }
  }

  return next;
}

/**
 * Attempt to evolve the sporeling to the next stage.
 * @param {object} state
 * @param {string} [selectedTraitKey] - optional trait to unlock during evolution
 * @returns {object} updated state
 */
export function evolveSporelingCompanion(state, selectedTraitKey = null) {
  const sporeling = getSporeling(state);
  if (!sporeling) {
    return pushLog(state, 'You do not have a sporeling companion.');
  }

  if (!canEvolve(sporeling)) {
    const progress = getEvolutionProgress(sporeling);
    return pushLog(
      state,
      `${sporeling.name} needs ${progress.pointsToNextStage} more evolution points to evolve.`
    );
  }

  // If no trait selected, pick the first available one
  const traitKey = selectedTraitKey || Object.keys(EVOLUTION_TRAITS).find(
    key => !sporeling.traits.includes(key)
  );

  if (!traitKey) {
    return pushLog(state, 'No traits available for evolution.');
  }

  // Use base function which operates on state
  return baseEvolveSporeling(state, traitKey);
}

/**
 * Calculate evolution progress for a sporeling.
 * @param {object} sporeling
 * @returns {object}
 */
export function getEvolutionProgress(sporeling) {
  if (!sporeling) {
    return { evolutionPoints: 0, pointsToNextStage: 0, progressPercent: 0, canEvolve: false };
  }

  const nextStageKey = getNextStage(sporeling);
  if (!nextStageKey) {
    return {
      evolutionPoints: sporeling.evolutionPoints,
      pointsToNextStage: 0,
      progressPercent: 100,
      canEvolve: false,
    };
  }

  const nextStage = EVOLUTION_STAGES[nextStageKey];
  const currentStage = EVOLUTION_STAGES[sporeling.stage];
  const currentThreshold = currentStage?.evolutionPointsRequired || 0;
  const nextThreshold = nextStage.evolutionPointsRequired;

  const pointsNeeded = nextThreshold - currentThreshold;
  const pointsEarned = sporeling.evolutionPoints - currentThreshold;
  const pointsToNextStage = Math.max(0, nextThreshold - sporeling.evolutionPoints);
  const progressPercent = pointsNeeded > 0
    ? Math.min(100, Math.floor((pointsEarned / pointsNeeded) * 100))
    : 100;

  return {
    evolutionPoints: sporeling.evolutionPoints,
    pointsToNextStage,
    progressPercent,
    canEvolve: canEvolve(sporeling),
  };
}

/**
 * Get sporeling evolution status for UI display.
 * @param {object} state
 * @returns {object|null}
 */
export function getSporelingStatus(state) {
  const sporeling = getSporeling(state);
  if (!sporeling) return null;

  const progress = getEvolutionProgress(sporeling);
  const stageInfo = EVOLUTION_STAGES[sporeling.stage];

  return {
    name: sporeling.name,
    stage: stageInfo?.name || sporeling.stage,
    stageDescription: stageInfo?.description || '',
    evolutionPoints: sporeling.evolutionPoints,
    pointsToNextStage: progress.pointsToNextStage,
    progressPercent: progress.progressPercent,
    canEvolve: progress.canEvolve,
    traits: sporeling.traits || [],
    stats: sporeling.stats,
    alive: sporeling.alive,
    hp: sporeling.hp,
    maxHp: sporeling.maxHp,
  };
}

/**
 * Get available traits for next evolution.
 * @param {object} state
 * @returns {Array}
 */
export function getAvailableEvolutionTraits(state) {
  const sporeling = getSporeling(state);
  if (!sporeling) return [];

  return getAvailableTraits(sporeling);
}

// Re-export constants for convenience
export { EVOLUTION_STAGES, EVOLUTION_TRAITS };
