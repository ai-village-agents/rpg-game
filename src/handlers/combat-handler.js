import { playerAttack, playerDefend, playerUsePotion, playerUseAbility, playerUseItem, enemyAct } from '../combat.js';
import { createGameStats, recordDamageDealt, recordTurnPlayed, recordItemUsed, recordAbilityUsed, recordDamageReceived } from '../game-stats.js';

/**
 * Handles combat-related actions dispatched during 'player-turn'.
 * Returns the new state if handled, or null if not handled.
 * @param {Object} state - Current game state
 * @param {Object} action - Action object
 * @returns {Object|null} New state or null
 */
export function handleCombatAction(state, action) {
  // Only handle actions if it's player's turn
  if (state.phase !== 'player-turn') return null;

  const type = action.type;

  if (type === 'PLAYER_ATTACK') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerAttack(state);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    
    let gs = next.gameStats || createGameStats();
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    
    return { ...next, gameStats: gs };
  }

  if (type === 'PLAYER_DEFEND') {
    return playerDefend(state);
  }

  if (type === 'PLAYER_POTION') {
    const next = playerUsePotion(state);
    let gs = next.gameStats || createGameStats();
    gs = recordItemUsed(gs, 'potion');
    gs = recordTurnPlayed(gs);
    return { ...next, gameStats: gs };
  }

  if (type === 'PLAYER_ABILITY') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerUseAbility(state, action.abilityId);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    
    let gs = next.gameStats || createGameStats();
    gs = recordAbilityUsed(gs, action.abilityId);
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    
    return { ...next, gameStats: gs };
  }

  if (type === 'PLAYER_ITEM') {
    const next = playerUseItem(state, action.itemId);
    let gs = next.gameStats || createGameStats();
    gs = recordItemUsed(gs, action.itemId);
    gs = recordTurnPlayed(gs);
    return { ...next, gameStats: gs };
  }

  return null;
}

/**
 * Encapsulates the logic for processing the enemy's turn, including stat recording.
 * To be called by the main loop/timeout when phase is 'enemy-turn'.
 * @param {Object} state - Current game state
 * @returns {Object} New state after enemy action
 */
export function handleEnemyTurnLogic(state) {
    const hpBefore = state.player?.hp ?? 0;
    const next = enemyAct(state);
    const dmgReceived = Math.max(0, hpBefore - (next.player?.hp ?? hpBefore));
    
    if (dmgReceived > 0) {
      const gs = recordDamageReceived(next.gameStats || createGameStats(), dmgReceived);
      return { ...next, gameStats: gs };
    }
    
    return next;
}
