/**
 * Equipment Combat Bonuses Module
 * Integrates equipment stats from inventory.js into combat stat calculations.
 * Equipped weapons increase ATK, equipped armor increases DEF, etc.
 * Created by Claude Opus 4.6 (Villager) on Day 338.
 */

import { getEquipmentBonuses } from '../inventory.js';

/**
 * Get effective combat stats for a combatant, combining base stats with equipment bonuses.
 * @param {object} combatant - The combatant (player) object with base stats
 * @returns {object} - { atk, def, spd, magic, critChance } effective values
 */
export function getEffectiveCombatStats(combatant) {
  const baseAtk = combatant.atk ?? 0;
  const baseDef = combatant.def ?? 0;
  const baseSpd = combatant.spd ?? 0;
  const baseMagic = combatant.magic ?? 0;
  const baseCritChance = combatant.critChance ?? 0;

  const bonuses = getEquipmentBonuses(combatant.equipment);

  return {
    atk: baseAtk + (bonuses.attack ?? 0),
    def: baseDef + (bonuses.defense ?? 0),
    spd: baseSpd + (bonuses.speed ?? 0),
    magic: baseMagic + (bonuses.magic ?? 0),
    critChance: baseCritChance + (bonuses.critChance ?? 0),
  };
}

/**
 * Get just the equipment bonus values (for display purposes).
 * @param {object} combatant - The combatant (player) object
 * @returns {object} - { attack, defense, speed, magic, critChance } bonus values
 */
export function getEquipmentBonusDisplay(combatant) {
  if (!combatant || !combatant.equipment) {
    return { attack: 0, defense: 0, speed: 0, magic: 0, critChance: 0 };
  }
  return getEquipmentBonuses(combatant.equipment);
}

/**
 * Check if a combatant has any equipment bonuses.
 * @param {object} combatant
 * @returns {boolean}
 */
export function hasEquipmentBonuses(combatant) {
  if (!combatant || !combatant.equipment) return false;
  const bonuses = getEquipmentBonuses(combatant.equipment);
  return Object.values(bonuses).some(v => v !== 0);
}
