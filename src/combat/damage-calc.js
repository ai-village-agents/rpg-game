import { getDamageMultiplier } from '../world-events.js';

/**
 * Damage Calculation Module — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Handles damage formulas, elemental interactions,
 * critical hits, and healing calculations.
 */

// ── Element System ───────────────────────────────────────────────────

export const ELEMENTS = {
  physical: 'physical',
  fire: 'fire',
  ice: 'ice',
  lightning: 'lightning',
  earth: 'earth',
  light: 'light',
  dark: 'dark',
  arcane: 'arcane',
};

/**
 * Elemental effectiveness chart.
 * Returns a multiplier: 2.0 (super effective), 1.0 (neutral), 0.5 (resisted), 0.0 (immune)
 */
const ELEMENT_CHART = {
  fire:      { ice: 2.0, earth: 0.5, fire: 0.5 },
  ice:       { lightning: 2.0, fire: 0.5, ice: 0.5 },
  lightning: { earth: 2.0, ice: 0.5, lightning: 0.5 },
  earth:     { fire: 2.0, lightning: 0.5, earth: 0.5 },
  light:     { dark: 2.0, light: 0.0 },
  dark:      { light: 2.0, dark: 0.0 },
  physical:  {},
  arcane:    { physical: 1.5, light: 0.5, arcane: 0.5 },
};

export function getElementMultiplier(attackElement, targetElement) {
  if (!attackElement || !targetElement || attackElement === 'physical') return 1.0;
  const chart = ELEMENT_CHART[attackElement];
  if (!chart) return 1.0;
  return chart[targetElement] ?? 1.0;
}

// ── Damage Formula ───────────────────────────────────────────────────

/**
 * Core damage calculation.
 *
 * Formula: damage = floor((ATK * power_mod - DEF * def_mod) * element_mult * crit_mult * variance)
 *  - power_mod: ability power multiplier (1.0 for basic attack)
 *  - def_mod: 0.5 if defending, 1.0 otherwise
 *  - element_mult: from element chart
 *  - crit_mult: 1.5 on critical hit (10% base chance)
 *  - variance: random 0.9 - 1.1
 *  - Minimum damage: 1 (unless immune via element, then 0)
 *
 * @param {Object} params
 * @param {number} params.attackerAtk - Effective ATK stat of attacker
 * @param {number} params.targetDef - Effective DEF stat of target
 * @param {boolean} params.targetDefending - Is target in defend stance?
 * @param {string} params.element - Attack element type
 * @param {string|null} params.targetElement - Target's element affinity
 * @param {number} params.rngValue - Random value 0-1
 * @param {number} [params.abilityPower] - Ability power multiplier (default 1.0)
 * @returns {{ damage: number, critical: boolean, elementMult: number }}
 */
export function calculateDamage({
  attackerAtk,
  targetDef,
  targetDefending = false,
  element = 'physical',
  targetElement = null,
  rngValue = 0.5,
  abilityPower = 1.0,
  worldEvent = null,
}) {
  const powerMod = Math.max(0.1, abilityPower);
  const defMod = targetDefending ? 2.0 : 1.0;  // Defending doubles effective DEF
  const elementMult = getElementMultiplier(element, targetElement);

  // Immune = 0 damage
  if (elementMult === 0.0) {
    return { damage: 0, critical: false, elementMult: 0.0 };
  }

  // Critical hit check (10% base chance)
  const critical = rngValue > 0.9;
  const critMult = critical ? 1.5 : 1.0;

  // Variance: use fractional part of rngValue to get 0.9 - 1.1
  const varianceSeed = (rngValue * 1000) % 1;
  const variance = 0.9 + varianceSeed * 0.2;

  // Core formula
  const rawDamage = (attackerAtk * powerMod) - (targetDef * defMod);
  const dmgMult = getDamageMultiplier(worldEvent);
  const finalDamage = Math.floor(rawDamage * elementMult * critMult * variance * dmgMult);

  return {
    damage: Math.max(1, finalDamage),
    critical,
    elementMult,
  };
}

// ── Heal Formula ─────────────────────────────────────────────────────

/**
 * Calculate healing amount.
 * Formula: floor(healPower * (1 + casterAtk / 20))
 *
 * @param {number} healPower - Base heal power of the ability
 * @param {number} casterAtk - Caster's effective ATK (or magic stat if added later)
 * @returns {number} heal amount
 */
export function calculateHeal(healPower, casterAtk = 0) {
  return Math.floor(healPower * (1 + casterAtk / 20));
}
