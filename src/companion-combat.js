/**
 * companion-combat.js — Integrates companions into the combat system.
 *
 * Features:
 * - Companions attack during player turn (after player action)
 * - Enemies can target companions instead of player
 * - Loyalty affects companion combat performance
 * - Dead companions skip turns; revival mechanic
 * - Companion defense: reduces damage to player when alive
 */

import { pushLog, clamp } from './state.js';
import { nextRng } from './combat.js';
import {
  companionAttack,
  companionTakeDamage,
  healCompanion,
  getCompanionById,
} from './companions.js';
import { getLoyaltyEffects } from './companion-loyalty-events.js';
import { adjustLoyaltyWithEvents } from './companion-loyalty-events.js';

/**
 * Get all alive companions from state.
 * @param {object} state
 * @returns {Array}
 */
export function getAliveCompanions(state) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  return companions.filter((c) => c.alive);
}

/**
 * Get all dead companions from state.
 * @param {object} state
 * @returns {Array}
 */
export function getDeadCompanions(state) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  return companions.filter((c) => !c.alive);
}

/**
 * Apply loyalty-based attack modifier to a companion's base attack.
 * @param {object} companion
 * @returns {number} effective attack value
 */
export function getEffectiveCompanionAttack(companion) {
  const baseAtk = companion.attack ?? 1;
  const effects = getLoyaltyEffects(companion.loyalty ?? 0);
  return Math.max(0, baseAtk + (effects.attackMod ?? 0));
}

/**
 * Apply loyalty-based defense modifier to a companion's base defense.
 * @param {object} companion
 * @returns {number} effective defense value
 */
export function getEffectiveCompanionDefense(companion) {
  const baseDef = companion.defense ?? 0;
  const effects = getLoyaltyEffects(companion.loyalty ?? 0);
  return Math.max(0, baseDef + (effects.defenseMod ?? 0));
}

/**
 * Perform companion attacks after a player action.
 * Each alive companion attacks the enemy, with loyalty modifiers applied.
 * @param {object} state - game state (must have enemy)
 * @param {number} rngSeed
 * @returns {{ state: object, seed: number }}
 */
export function companionsCombatTurn(state, rngSeed) {
  const alive = getAliveCompanions(state);
  if (alive.length === 0 || !state.enemy || state.enemy.hp <= 0) {
    return { state, seed: rngSeed };
  }

  let working = state;
  let seed = rngSeed;

  for (const companion of alive) {
    if (working.enemy.hp <= 0) break;

    const effects = getLoyaltyEffects(companion.loyalty ?? 0);

    // Abandoned companions may refuse to fight
    if (effects.leaves) {
      working = pushLog(working, `${companion.name} refuses to fight due to low loyalty!`);
      continue;
    }

    const effectiveAtk = getEffectiveCompanionAttack(companion);
    const enemyDef = working.enemy.def ?? 0;
    const damage = Math.max(1, effectiveAtk - enemyDef);

    const enemyMaxHp = working.enemy.maxHp ?? working.enemy.hp ?? 0;
    const nextHp = Math.max(0, Math.min(enemyMaxHp, (working.enemy.hp ?? 0) - damage));

    const rngResult = nextRng(seed);
    seed = rngResult.seed;

    working = {
      ...working,
      enemy: { ...working.enemy, hp: nextHp },
    };
    working = pushLog(working, `${companion.name} attacks for ${damage} damage!`);
  }

  return { state: working, seed };
}

/**
 * Select which target(s) the enemy attacks.
 * Uses RNG to decide: each alive companion has a chance to be targeted.
 * Target chance: 30% per alive companion, remainder goes to player.
 * @param {object} state
 * @param {number} rngSeed
 * @returns {{ targetType: 'player'|'companion', targetId: string|null, seed: number }}
 */
export function selectEnemyTarget(state, rngSeed) {
  const alive = getAliveCompanions(state);
  if (alive.length === 0) {
    return { targetType: 'player', targetId: null, seed: rngSeed };
  }

  const rngResult = nextRng(rngSeed);
  const roll = rngResult.value;

  // Each companion has 25% chance of being targeted
  const companionChance = 0.25;
  let threshold = 0;

  for (const companion of alive) {
    threshold += companionChance;
    if (roll < threshold) {
      return { targetType: 'companion', targetId: companion.id, seed: rngResult.seed };
    }
  }

  return { targetType: 'player', targetId: null, seed: rngResult.seed };
}

/**
 * Apply enemy attack damage to a companion target.
 * Uses companion's effective defense (with loyalty modifier).
 * @param {object} state
 * @param {string} companionId
 * @param {number} enemyAtk
 * @returns {object} updated state
 */
export function enemyAttackCompanion(state, companionId, enemyAtk) {
  const companion = getCompanionById(state, companionId);
  if (!companion || !companion.alive) return state;

  const effectiveDef = getEffectiveCompanionDefense(companion);
  const damage = Math.max(1, enemyAtk - effectiveDef);

  let next = companionTakeDamage(state, companionId, damage);

  // Check if companion died
  const updated = getCompanionById(next, companionId);
  if (updated && !updated.alive) {
    next = pushLog(next, `${companion.name} has been knocked out!`);
  }

  return next;
}

/**
 * Revive a dead companion with partial HP.
 * Can be used after combat or via special items.
 * @param {object} state
 * @param {string} companionId
 * @param {number} [hpPercent=0.25] - percentage of maxHp to restore
 * @returns {object} updated state
 */
export function reviveCompanion(state, companionId, hpPercent = 0.25) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  const companion = companions.find((c) => c.id === companionId);
  if (!companion) return pushLog(state, 'Companion not found.');
  if (companion.alive) return pushLog(state, `${companion.name} is already alive.`);

  const maxHp = companion.maxHp ?? 1;
  const restoredHp = Math.max(1, Math.floor(maxHp * clamp(hpPercent, 0, 1)));

  const updated = { ...companion, hp: restoredHp, alive: true };
  const next = {
    ...state,
    companions: companions.map((c) => (c.id === companionId ? updated : c)),
  };
  return pushLog(next, `${companion.name} has been revived with ${restoredHp} HP!`);
}

/**
 * After a victory, apply loyalty bonuses for participating companions.
 * Alive companions gain loyalty; dead companions lose loyalty.
 * @param {object} state
 * @returns {object} updated state
 */
export function processCompanionCombatRewards(state) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  if (companions.length === 0) return state;

  let working = state;

  for (const companion of companions) {
    if (companion.alive) {
      // Alive companions gain +3 loyalty for surviving combat
      working = adjustLoyaltyWithEvents(working, companion.id, 3);
    } else {
      // Dead companions lose -2 loyalty (they feel abandoned)
      working = adjustLoyaltyWithEvents(working, companion.id, -2);
    }
  }

  return working;
}

/**
 * After defeat, apply loyalty penalties to all companions.
 * @param {object} state
 * @returns {object} updated state
 */
export function processCompanionDefeatPenalty(state) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  if (companions.length === 0) return state;

  let working = state;

  for (const companion of companions) {
    // All companions lose -5 loyalty on defeat
    working = adjustLoyaltyWithEvents(working, companion.id, -5);
  }

  return working;
}

/**
 * Auto-revive companions after combat ends (with 25% HP).
 * Called during victory phase transition.
 * @param {object} state
 * @returns {object} updated state
 */
export function autoReviveCompanionsAfterCombat(state) {
  const dead = getDeadCompanions(state);
  let working = state;

  for (const companion of dead) {
    working = reviveCompanion(working, companion.id, 0.25);
  }

  return working;
}

/**
 * Get a combat summary for companions (for battle summary screen).
 * @param {object} state
 * @returns {Array<{ id: string, name: string, participated: boolean, alive: boolean, hp: number, maxHp: number }>}
 */
export function getCompanionCombatSummary(state) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  return companions.map((c) => ({
    id: c.id,
    name: c.name,
    participated: true,
    alive: c.alive,
    hp: c.hp ?? 0,
    maxHp: c.maxHp ?? 1,
  }));
}
