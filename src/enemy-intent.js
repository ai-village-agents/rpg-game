/**
 * Enemy Intent System — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Extends the boss telegraph system to provide visible intent indicators
 * for ALL enemies during combat, inspired by Slay the Spire's intent system.
 *
 * Features:
 * - Data-driven intent patterns per enemy behavior type
 * - Multi-turn intent forecasting (shows next 1-3 turns)
 * - Intent confidence levels (certain, likely, possible)
 * - Integration with existing enemy-ai behavior system
 * - Pattern-based move cycles for predictable enemies
 */

import { getAbility } from './combat/abilities.js';
import { getBossAbility } from './data/bosses.js';
import {
  URGENCY_LEVELS,
  ELEMENT_ICONS,
  getTelegraphIcon,
  getTelegraphUrgency,
} from './boss-telegraph.js';
import { selectTacticalAction } from './enemy-ai.js';

// ── Intent Types ─────────────────────────────────────────────────────
export const INTENT_TYPES = {
  ATTACK: 'attack',
  HEAVY_ATTACK: 'heavy_attack',
  ABILITY: 'ability',
  DEFEND: 'defend',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  HEAL: 'heal',
  MULTI_HIT: 'multi_hit',
  CHARGE: 'charge',
  UNKNOWN: 'unknown',
};

// ── Confidence Levels ────────────────────────────────────────────────
export const CONFIDENCE = {
  CERTAIN: 'certain',
  LIKELY: 'likely',
  POSSIBLE: 'possible',
};

// ── Intent Icons ─────────────────────────────────────────────────────
export const INTENT_ICONS = {
  [INTENT_TYPES.ATTACK]: '⚔️',
  [INTENT_TYPES.HEAVY_ATTACK]: '🗡️',
  [INTENT_TYPES.ABILITY]: '🔮',
  [INTENT_TYPES.DEFEND]: '🛡️',
  [INTENT_TYPES.BUFF]: '⬆️',
  [INTENT_TYPES.DEBUFF]: '⬇️',
  [INTENT_TYPES.HEAL]: '💚',
  [INTENT_TYPES.MULTI_HIT]: '🔄',
  [INTENT_TYPES.CHARGE]: '💫',
  [INTENT_TYPES.UNKNOWN]: '❓',
};

// ── Behavior-based Intent Patterns ───────────────────────────────────
// Each behavior type defines cyclic move patterns the enemy tends to follow.
// The AI will deviate from these based on HP/MP thresholds, but patterns
// give the player a baseline expectation.
export const BEHAVIOR_PATTERNS = {
  basic: {
    cycle: [INTENT_TYPES.ATTACK, INTENT_TYPES.ATTACK, INTENT_TYPES.DEFEND],
    deviation: 0.3,
  },
  aggressive: {
    cycle: [INTENT_TYPES.ATTACK, INTENT_TYPES.HEAVY_ATTACK, INTENT_TYPES.ATTACK, INTENT_TYPES.ABILITY],
    deviation: 0.2,
  },
  caster: {
    cycle: [INTENT_TYPES.ABILITY, INTENT_TYPES.ABILITY, INTENT_TYPES.DEFEND, INTENT_TYPES.ABILITY],
    deviation: 0.25,
  },
  support: {
    cycle: [INTENT_TYPES.BUFF, INTENT_TYPES.HEAL, INTENT_TYPES.ATTACK, INTENT_TYPES.DEFEND],
    deviation: 0.3,
  },
  boss: {
    cycle: [INTENT_TYPES.ABILITY, INTENT_TYPES.ATTACK, INTENT_TYPES.HEAVY_ATTACK, INTENT_TYPES.DEFEND, INTENT_TYPES.ABILITY],
    deviation: 0.15,
  },
  // Charging behavior: builds power over multiple turns before unleashing
  charger: {
    cycle: [INTENT_TYPES.CHARGE, INTENT_TYPES.CHARGE, INTENT_TYPES.HEAVY_ATTACK, INTENT_TYPES.DEFEND],
    deviation: 0.1,
  },
};

// ── Core Functions ───────────────────────────────────────────────────

/**
 * Classify an action+ability into a specific intent type.
 */
export function classifyIntent(action, abilityId) {
  if (action === 'defend') return INTENT_TYPES.DEFEND;
  if (action === 'attack') return INTENT_TYPES.ATTACK;
  if (action === 'ability' && abilityId) {
    const ability = getBossAbility(abilityId) ?? getAbility(abilityId);
    if (!ability) return INTENT_TYPES.ABILITY;

    if (ability.type === 'heal' || (ability.healPower ?? 0) > 0) return INTENT_TYPES.HEAL;
    if (ability.type === 'buff' || ability.targetType === 'self') return INTENT_TYPES.BUFF;
    if (ability.statusEffect && ability.targetType !== 'self') return INTENT_TYPES.DEBUFF;
    if (ability.hitCount && ability.hitCount > 1) return INTENT_TYPES.MULTI_HIT;
    if ((ability.power ?? 0) >= 1.8 || (ability.power ?? 0) >= 35) return INTENT_TYPES.HEAVY_ATTACK;
    return INTENT_TYPES.ABILITY;
  }
  return INTENT_TYPES.UNKNOWN;
}

/**
 * Get the pattern-based expected intent for a given turn.
 */
export function getPatternIntent(enemy, turnNumber) {
  const behavior = enemy?.aiBehavior ?? 'basic';
  const pattern = BEHAVIOR_PATTERNS[behavior] ?? BEHAVIOR_PATTERNS.basic;
  const cycleIndex = turnNumber % pattern.cycle.length;
  return pattern.cycle[cycleIndex];
}

/**
 * Calculate intent confidence based on behavior deviation and context.
 */
export function calculateConfidence(enemy, turnNumber, predictedIntent) {
  const behavior = enemy?.aiBehavior ?? 'basic';
  const pattern = BEHAVIOR_PATTERNS[behavior] ?? BEHAVIOR_PATTERNS.basic;
  const patternIntent = getPatternIntent(enemy, turnNumber);

  // If predicted matches pattern, high confidence
  if (predictedIntent === patternIntent) {
    const certaintyThreshold = 1 - pattern.deviation;
    if (certaintyThreshold >= 0.8) return CONFIDENCE.CERTAIN;
    if (certaintyThreshold >= 0.6) return CONFIDENCE.LIKELY;
    return CONFIDENCE.POSSIBLE;
  }

  // HP-based overrides are highly confident
  const hpPercent = (enemy?.hp ?? 0) / (enemy?.maxHp ?? 1);
  if (hpPercent < 0.2 && predictedIntent === INTENT_TYPES.HEAL) {
    return CONFIDENCE.LIKELY;
  }
  if (hpPercent < 0.3 && predictedIntent === INTENT_TYPES.DEFEND) {
    return CONFIDENCE.LIKELY;
  }

  return CONFIDENCE.POSSIBLE;
}

/**
 * Estimate damage range for an intent.
 */
export function estimateDamage(enemy, intentType, abilityId) {
  const atk = enemy?.atk ?? 0;
  if (intentType === INTENT_TYPES.DEFEND || intentType === INTENT_TYPES.BUFF ||
      intentType === INTENT_TYPES.HEAL || intentType === INTENT_TYPES.CHARGE) {
    return null;
  }

  if (intentType === INTENT_TYPES.ATTACK) {
    return { min: Math.floor(atk * 0.8), max: Math.floor(atk * 1.2) };
  }

  if (intentType === INTENT_TYPES.HEAVY_ATTACK) {
    return { min: Math.floor(atk * 1.3), max: Math.floor(atk * 1.8) };
  }

  if (abilityId) {
    const ability = getBossAbility(abilityId) ?? getAbility(abilityId);
    if (ability) {
      const power = ability.power ?? 1.0;
      const baseDmg = ability.baseDamage ?? Math.floor(atk * power);
      const hits = ability.hitCount ?? 1;
      return {
        min: Math.floor(baseDmg * 0.85) * hits,
        max: Math.floor(baseDmg * 1.15) * hits,
        hits,
      };
    }
  }

  return { min: Math.floor(atk * 0.7), max: Math.floor(atk * 1.3) };
}

/**
 * Generate a human-readable description for an intent.
 */
export function getIntentDescription(intentType, damage, abilityId) {
  const ability = abilityId ? (getBossAbility(abilityId) ?? getAbility(abilityId)) : null;

  switch (intentType) {
    case INTENT_TYPES.ATTACK:
      return damage ? `Basic attack (~${damage.min}-${damage.max} dmg)` : 'Preparing to attack';
    case INTENT_TYPES.HEAVY_ATTACK:
      return damage ? `Heavy strike (~${damage.min}-${damage.max} dmg)` : 'Winding up a powerful blow';
    case INTENT_TYPES.ABILITY:
      return ability?.name ?? 'Casting an ability';
    case INTENT_TYPES.DEFEND:
      return 'Raising defenses';
    case INTENT_TYPES.BUFF:
      return ability ? `Buffing: ${ability.name}` : 'Powering up';
    case INTENT_TYPES.DEBUFF:
      return ability ? `Debuff: ${ability.name}` : 'Preparing a curse';
    case INTENT_TYPES.HEAL:
      return ability ? `Healing: ${ability.name}` : 'Recovering health';
    case INTENT_TYPES.MULTI_HIT:
      return damage
        ? `Multi-hit x${damage.hits ?? 2} (~${damage.min}-${damage.max} total)`
        : 'Preparing rapid strikes';
    case INTENT_TYPES.CHARGE:
      return 'Gathering power... next attack will be devastating';
    default:
      return 'Intent unclear...';
  }
}

/**
 * Predict the enemy's next action and return a full intent object.
 * This is the main entry point for the intent system.
 */
export function predictIntent(enemy, turnNumber, rngSeed) {
  if (!enemy) return null;

  // Use the actual AI selection for the primary prediction
  const { action, abilityId } = selectTacticalAction(enemy, null, rngSeed, turnNumber);
  const intentType = classifyIntent(action, abilityId);
  const confidence = calculateConfidence(enemy, turnNumber, intentType);
  const damage = estimateDamage(enemy, intentType, abilityId);
  const description = getIntentDescription(intentType, damage, abilityId);
  const icon = INTENT_ICONS[intentType] ?? INTENT_ICONS[INTENT_TYPES.UNKNOWN];

  // Determine urgency using existing boss-telegraph system
  const urgency = getTelegraphUrgency(action, abilityId, enemy);

  return {
    type: intentType,
    action,
    abilityId,
    icon,
    description,
    damage,
    confidence,
    urgency,
    turnNumber,
    enemyId: enemy.id ?? enemy.name ?? 'unknown',
  };
}

/**
 * Predict multiple turns ahead (forecast).
 * Returns an array of intent objects for the next N turns.
 */
export function forecastIntents(enemy, currentTurn, rngSeed, turnsAhead) {
  const count = Math.min(turnsAhead ?? 1, 3);
  const intents = [];
  let seed = rngSeed;

  for (let i = 0; i < count; i++) {
    const turn = currentTurn + i;
    const intent = predictIntent(enemy, turn, seed);
    if (intent) {
      // Confidence degrades for further-out predictions
      if (i === 1) intent.confidence = CONFIDENCE.LIKELY;
      if (i >= 2) intent.confidence = CONFIDENCE.POSSIBLE;
      intents.push(intent);
    }
    // Advance seed for next prediction
    const RNG_MOD = 2147483647;
    const RNG_MULT = 48271;
    seed = (seed * RNG_MULT) % RNG_MOD;
  }

  return intents;
}

/**
 * Initialize the intent tracking state for combat.
 */
export function initIntentState() {
  return {
    currentIntent: null,
    forecast: [],
    history: [],
    showForecast: false,
    turnNumber: 0,
  };
}

/**
 * Update intent state at the start of each enemy turn.
 */
export function updateIntentState(intentState, enemy, rngSeed) {
  const turn = intentState?.turnNumber ?? 0;
  const currentIntent = predictIntent(enemy, turn, rngSeed);
  const forecast = forecastIntents(enemy, turn + 1, rngSeed, 2);
  const history = [...(intentState?.history ?? [])];

  if (currentIntent) {
    history.push({ ...currentIntent, resolvedAt: turn });
  }

  // Keep history bounded
  const maxHistory = 10;
  while (history.length > maxHistory) {
    history.shift();
  }

  return {
    currentIntent,
    forecast,
    history,
    showForecast: intentState?.showForecast ?? false,
    turnNumber: turn + 1,
  };
}

/**
 * Toggle forecast visibility.
 */
export function toggleForecast(intentState) {
  return {
    ...intentState,
    showForecast: !(intentState?.showForecast ?? false),
  };
}
