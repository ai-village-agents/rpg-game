/**
 * Bestiary Module — Monster Compendium
 * Tracks which enemies the player has encountered and defeated.
 * Provides lookup of enemy stats, weaknesses, and kill counts.
 * All functions are pure — they return new state objects.
 */

import { ENEMIES } from './data/enemies.js';
import { BOSSES } from './data/bosses.js';

/**
 * Create the initial bestiary state.
 * @returns {Object} Empty bestiary state
 */
export function createBestiaryState() {
  return {
    /** Set of enemy IDs the player has encountered */
    encountered: [],
    /** Map of enemy ID -> number of times defeated */
    defeatedCounts: {},
  };
}

/**
 * Record that the player has encountered an enemy.
 * @param {Object} bestiary - Current bestiary state
 * @param {string} enemyId - The enemy identifier
 * @returns {Object} Updated bestiary state
 */
export function recordEncounter(bestiary, enemyId) {
  if (!enemyId || typeof enemyId !== 'string') return bestiary;
  if (bestiary.encountered.includes(enemyId)) return bestiary;
  return {
    ...bestiary,
    encountered: [...bestiary.encountered, enemyId],
  };
}

/**
 * Record that the player has defeated an enemy.
 * Also records the encounter if not already tracked.
 * @param {Object} bestiary - Current bestiary state
 * @param {string} enemyId - The enemy identifier
 * @returns {Object} Updated bestiary state
 */
export function recordDefeat(bestiary, enemyId) {
  if (!enemyId || typeof enemyId !== 'string') return bestiary;
  const updated = recordEncounter(bestiary, enemyId);
  const counts = { ...updated.defeatedCounts };
  counts[enemyId] = (counts[enemyId] || 0) + 1;
  return {
    ...updated,
    defeatedCounts: counts,
  };
}

/**
 * Check if the player has encountered an enemy.
 * @param {Object} bestiary - Current bestiary state
 * @param {string} enemyId - The enemy identifier
 * @returns {boolean}
 */
export function hasEncountered(bestiary, enemyId) {
  return bestiary.encountered.includes(enemyId);
}

/**
 * Get the number of times an enemy has been defeated.
 * @param {Object} bestiary - Current bestiary state
 * @param {string} enemyId - The enemy identifier
 * @returns {number}
 */
export function getDefeatCount(bestiary, enemyId) {
  return bestiary.defeatedCounts[enemyId] || 0;
}

/**
 * Get total number of unique enemies encountered.
 * @param {Object} bestiary - Current bestiary state
 * @returns {number}
 */
export function getEncounteredCount(bestiary) {
  return bestiary.encountered.length;
}

/**
 * Get total number of unique enemies defeated at least once.
 * @param {Object} bestiary - Current bestiary state
 * @returns {number}
 */
export function getDefeatedUniqueCount(bestiary) {
  return Object.keys(bestiary.defeatedCounts).length;
}

/**
 * Get the full bestiary entry for an enemy (stats + player tracking).
 * Only returns full stats if the enemy has been encountered.
 * @param {Object} bestiary - Current bestiary state
 * @param {string} enemyId - The enemy identifier
 * @returns {Object|null} Bestiary entry or null if unknown
 */
export function getBestiaryEntry(bestiary, enemyId) {
  const enemy = ENEMIES[enemyId];
  const boss = BOSSES[enemyId];

  if (!enemy && !boss) return null;

  const encountered = hasEncountered(bestiary, enemyId);
  const timesDefeated = getDefeatCount(bestiary, enemyId);

  if (!encountered) {
    return {
      id: enemyId,
      name: '???',
      encountered: false,
      timesDefeated: 0,
      isBoss: !!boss,
    };
  }

  if (boss) {
    const phase1 = boss.phases[0];
    return {
      id: enemyId,
      name: boss.name,
      description: boss.description,
      encountered: true,
      timesDefeated,
      isBoss: true,
      element: boss.element,
      maxHp: phase1.maxHp,
      atk: phase1.atk,
      def: phase1.def,
      spd: phase1.spd,
      phases: boss.phases.length,
      xpReward: boss.xpReward,
      goldReward: boss.goldReward,
    };
  }

  return {
    id: enemyId,
    name: enemy.name,
    encountered: true,
    timesDefeated,
    isBoss: false,
    element: enemy.element,
    maxHp: enemy.maxHp ?? enemy.hp,
    atk: enemy.atk,
    def: enemy.def,
    spd: enemy.spd,
    xpReward: enemy.xpReward,
    goldReward: enemy.goldReward,
    aiBehavior: enemy.aiBehavior,
  };
}

/**
 * Get all bestiary entries (encountered and unencountered).
 * Unencountered entries show as '???' with minimal info.
 * @param {Object} bestiary - Current bestiary state
 * @returns {Object[]} Array of bestiary entries
 */
export function getAllBestiaryEntries(bestiary) {
  const entries = [];
  const seen = new Set();

  // Regular enemies
  for (const id of Object.keys(ENEMIES)) {
    seen.add(id);
    entries.push(getBestiaryEntry(bestiary, id));
  }

  // Boss enemies (skip if already in ENEMIES to avoid duplicates)
  for (const id of Object.keys(BOSSES)) {
    if (!seen.has(id)) {
      entries.push(getBestiaryEntry(bestiary, id));
    }
  }

  return entries;
}

/**
 * Get completion percentage (unique enemies defeated / total enemies).
 * @param {Object} bestiary - Current bestiary state
 * @returns {number} Percentage 0-100
 */
export function getCompletionPercent(bestiary) {
  const total = getTotalEnemyCount();
  if (total === 0) return 100;
  const defeated = getDefeatedUniqueCount(bestiary);
  return Math.round((defeated / total) * 100);
}

/**
 * Get the total number of enemies in the game (regular + boss).
 * @returns {number}
 */
export function getTotalEnemyCount() {
  const allKeys = new Set([...Object.keys(ENEMIES), ...Object.keys(BOSSES)]);
  return allKeys.size;
}
