import {
  SPECIALIZATION_LEVEL,
  getSpecializationsForClass,
  getSpecialization,
  canSpecialize,
  applySpecialization,
  isSpecialized,
} from './class-specializations.js';
import { formatStatName } from './level-up.js';

/**
 * Convert a kebab-case ability id into Title Case.
 *
 * @param {string} abilityId
 * @returns {string}
 */
export function formatAbilityName(abilityId) {
  if (!abilityId) {
    return '';
  }
  return String(abilityId)
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

/**
 * Determine if the specialization choice UI should be shown.
 *
 * @param {object} player
 * @returns {boolean}
 */
export function shouldShowSpecialization(player) {
  if (!player) {
    return false;
  }
  return (
    Number(player.level ?? 0) >= SPECIALIZATION_LEVEL &&
    !player.specialization &&
    Boolean(player.classId)
  );
}

const formatStatBonus = (stat, value) => ({
  stat,
  value,
  formatted: `${value > 0 ? '+' : ''}${value} ${formatStatName(stat)}`,
});

/**
 * Build specialization choices for a class, ready for rendering.
 *
 * @param {string} classId
 * @returns {Array<{id: string, name: string, description: string, statBonuses: Array<{stat: string, value: number, formatted: string}>, abilities: Array<{id: string, name: string}>, passive: {id: string, name: string, description: string} | null}>}
 */
export function getSpecializationChoices(classId) {
  return getSpecializationsForClass(classId).map((spec) => ({
    id: spec.id,
    name: spec.name,
    description: spec.description,
    statBonuses: Object.entries(spec.statBonuses ?? {}).map(([stat, value]) =>
      formatStatBonus(stat, value)
    ),
    abilities: (spec.abilities ?? []).map((abilityId) => ({
      id: abilityId,
      name: formatAbilityName(abilityId),
    })),
    passive: spec.passive
      ? {
          id: spec.passive.id,
          name: spec.passive.name,
          description: spec.passive.description,
        }
      : null,
  }));
}

/**
 * Create UI state for specialization selection.
 *
 * @param {object} player
 * @returns {{classId: string | null, choices: Array<{id: string, name: string, description: string, statBonuses: Array<{stat: string, value: number, formatted: string}>, abilities: Array<{id: string, name: string}>, passive: {id: string, name: string, description: string} | null}>, playerName: string | null}}
 */
export function createSpecializationState(player) {
  const classId = player?.classId ?? null;
  return {
    classId,
    choices: classId ? getSpecializationChoices(classId) : [],
    playerName: player?.name ?? null,
  };
}

export {
  SPECIALIZATION_LEVEL,
  getSpecializationsForClass,
  getSpecialization,
  canSpecialize,
  applySpecialization,
  isSpecialized,
};
