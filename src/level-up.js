/**
 * Level-Up System — detects XP threshold crossings after combat,
 * builds a level-up summary with before/after stat snapshots,
 * and applies stat growth from characters/stats.js.
 *
 * Pure functions — no side effects, no DOM, fully testable.
 */

import { calcLevel, applyLevelUp, STAT_GROWTH, XP_THRESHOLDS } from './characters/stats.js';

/**
 * Stat keys displayed in level-up summary.
 * @type {string[]}
 */
export const DISPLAY_STATS = ['maxHp', 'maxMp', 'atk', 'def', 'spd', 'int', 'lck'];

/**
 * Check which party members would level up from gaining XP.
 * Does NOT mutate — returns descriptive objects for each member that leveled.
 *
 * @param {object[]} members — array of character objects (with .level, .xp, .stats, .classId, .name)
 * @param {number} xpPerMember — XP each member would gain
 * @returns {{ memberIndex: number, name: string, classId: string, oldLevel: number, newLevel: number, oldStats: object, newStats: object }[]}
 */
export function checkLevelUps(members, xpPerMember) {
  if (!Array.isArray(members) || xpPerMember <= 0) return [];

  const results = [];

  for (let i = 0; i < members.length; i += 1) {
    const member = members[i];
    if (!member || !member.classId) continue;

    const oldLevel = member.level ?? 1;
    const oldXp = member.xp ?? 0;
    const newXp = oldXp + Math.max(0, Math.floor(xpPerMember));
    const newLevel = calcLevel(newXp);

    if (newLevel > oldLevel) {
      // Simulate stat growth to get before/after
      const oldStats = { ...member.stats };
      let simChar = { ...member, xp: newXp };
      for (let lvl = oldLevel; lvl < newLevel; lvl += 1) {
        simChar = applyLevelUp(simChar);
      }
      results.push({
        memberIndex: i,
        name: member.name,
        classId: member.classId,
        oldLevel,
        newLevel,
        oldStats,
        newStats: { ...simChar.stats },
      });
    }
  }

  return results;
}

/**
 * Create the level-up display state for rendering.
 *
 * @param {object[]} levelUpResults — from checkLevelUps()
 * @param {string} returnPhase — phase to return to after viewing all level-ups
 * @returns {{ screen: string, levelUps: object[], currentIndex: number, returnPhase: string }}
 */
export function createLevelUpState(levelUpResults, returnPhase) {
  return {
    screen: 'level-up',
    levelUps: levelUpResults || [],
    currentIndex: 0,
    returnPhase: returnPhase || 'victory',
  };
}

/**
 * Advance to the next level-up in the queue, or signal completion.
 *
 * @param {object} levelUpState — from createLevelUpState()
 * @returns {{ levelUpState: object, done: boolean }}
 */
export function advanceLevelUp(levelUpState) {
  if (!levelUpState || !levelUpState.levelUps) {
    return { levelUpState: null, done: true };
  }
  const nextIndex = levelUpState.currentIndex + 1;
  if (nextIndex >= levelUpState.levelUps.length) {
    return { levelUpState: null, done: true };
  }
  return {
    levelUpState: { ...levelUpState, currentIndex: nextIndex },
    done: false,
  };
}

/**
 * Get the current level-up entry being displayed.
 *
 * @param {object} levelUpState
 * @returns {object|null}
 */
export function getCurrentLevelUp(levelUpState) {
  if (!levelUpState || !levelUpState.levelUps) return null;
  return levelUpState.levelUps[levelUpState.currentIndex] ?? null;
}

/**
 * Build a stat-diff summary for display.
 * Returns array of { stat, oldValue, newValue, diff } for each stat that changed.
 *
 * @param {object} oldStats
 * @param {object} newStats
 * @returns {{ stat: string, oldValue: number, newValue: number, diff: number }[]}
 */
export function getStatDiffs(oldStats, newStats) {
  if (!oldStats || !newStats) return [];

  return DISPLAY_STATS
    .map((stat) => ({
      stat,
      oldValue: oldStats[stat] ?? 0,
      newValue: newStats[stat] ?? 0,
      diff: (newStats[stat] ?? 0) - (oldStats[stat] ?? 0),
    }))
    .filter((entry) => entry.diff !== 0);
}

/**
 * Format stat name for display (camelCase → Title Case).
 *
 * @param {string} stat — e.g. 'maxHp'
 * @returns {string} — e.g. 'Max HP'
 */
export function formatStatName(stat) {
  const MAP = {
    maxHp: 'Max HP',
    maxMp: 'Max MP',
    atk: 'ATK',
    def: 'DEF',
    spd: 'SPD',
    int: 'INT',
    lck: 'LCK',
    hp: 'HP',
    mp: 'MP',
  };
  return MAP[stat] || stat;
}

/**
 * Get XP needed for the next level after this one.
 *
 * @param {number} level — current level (after leveling up)
 * @returns {number} — XP threshold for next level, or 0 if maxed
 */
export function xpForNextLevel(level) {
  if (level >= XP_THRESHOLDS.length) return 0;
  return XP_THRESHOLDS[level] ?? 0;
}
