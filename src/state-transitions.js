import { calcLevel } from './characters/stats.js';
import { checkLevelUps } from './level-up.js';
import { createBattleSummary } from './battle-summary.js';
import { pushLog } from './state.js';

/**
 * Handles automatic state updates based on phase transitions.
 * e.g. Level-up detection, Battle Summary creation.
 * @param {Object} prevState - The previous state
 * @param {Object} nextState - The proposed next state
 * @returns {Object} The final next state (possibly modified)
 */
export function handleStateTransitions(prevState, nextState) {
  let next = nextState;
  
  // Detect level-ups when entering victory phase
  if (next.phase === 'victory' && prevState.phase !== 'victory' && prevState.phase !== 'level-up') {
    const player = next.player;
    if (player && player.classId) {
      const oldLevel = player.level ?? 1;
      const newLevel = calcLevel(player.xp ?? 0);
      if (newLevel > oldLevel) {
        // Build level-up data: simulate the stat growth
        const levelUps = checkLevelUps(
          [{ ...player, level: oldLevel, xp: (player.xp ?? 0) - (next.xpGained ?? 0) }],
          next.xpGained ?? 0
        );
        if (levelUps.length > 0) {
          // Update player level and stats to match post-level-up
          const lu = levelUps[0];
          next = {
            ...next,
            player: {
              ...player,
              level: lu.newLevel,
              maxHp: lu.newStats.maxHp,
              hp: player.hp + (lu.newStats.maxHp - lu.oldStats.maxHp), // Heal by the HP growth amount
              maxMp: lu.newStats.maxMp,
              mp: (player.mp ?? 0) + (lu.newStats.maxMp - (lu.oldStats.maxMp ?? 0)),
              atk: lu.newStats.atk,
              def: lu.newStats.def,
              spd: lu.newStats.spd,
            },
            pendingLevelUps: levelUps,
          };
          next = pushLog(next, `${player.name} reached level ${lu.newLevel}!`);
        }
      }
    }
  }

  // After level-up detection, transition victory → battle-summary
  if (next.phase === 'victory' && prevState.phase !== 'battle-summary' && prevState.phase !== 'level-up') {
    next = { ...next, phase: 'battle-summary', battleSummary: createBattleSummary(next) };
  }
  
  return next;
}
