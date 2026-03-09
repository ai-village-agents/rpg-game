import { playerAttack, playerDefend, playerFlee, playerUsePotion, playerUseAbility, playerUseItem, enemyAct } from '../combat.js';
import { createGameStats, recordDamageDealt, recordTurnPlayed, recordItemUsed, recordAbilityUsed, recordDamageReceived } from '../game-stats.js';
import { getCraftingMaterialDrops, lookupItem } from '../crafting.js';
import { addItemToInventory } from '../items.js';
import { trackAchievements } from '../achievements.js';
import { companionAutoAct, getCompanionBonuses } from '../companions.js';

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
    applyCraftingMaterialDrops(next);
    
    return finalizeCombatState(next, { gameStats: gs });
  }

  if (type === 'PLAYER_DEFEND') {
    const next = playerDefend(state);
    return finalizeCombatState(next);
  }

  if (type === 'PLAYER_FLEE') {
    const next = playerFlee(state);
    let gs = next.gameStats || createGameStats();
    gs = recordTurnPlayed(gs);
    return finalizeCombatState(next, { gameStats: gs });
  }

  if (type === 'PLAYER_POTION') {
    const next = playerUsePotion(state);
    let gs = next.gameStats || createGameStats();
    gs = recordItemUsed(gs, 'potion');
    gs = recordTurnPlayed(gs);
    applyCraftingMaterialDrops(next);
    return finalizeCombatState(next, { gameStats: gs });
  }

  if (type === 'PLAYER_ABILITY') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerUseAbility(state, action.abilityId);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    
    let gs = next.gameStats || createGameStats();
    gs = recordAbilityUsed(gs, action.abilityId);
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    applyCraftingMaterialDrops(next);
    
    return finalizeCombatState(next, { gameStats: gs });
  }

  if (type === 'PLAYER_ITEM') {
    const next = playerUseItem(state, action.itemId);
    let gs = next.gameStats || createGameStats();
    gs = recordItemUsed(gs, action.itemId);
    gs = recordTurnPlayed(gs);
    applyCraftingMaterialDrops(next);
    return finalizeCombatState(next, { gameStats: gs });
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
    applyCraftingMaterialDrops(next);
    
    if (dmgReceived > 0) {
      let withGs = { ...next, gameStats: recordDamageReceived(next.gameStats || createGameStats(), dmgReceived) };
      // Companions auto-act after enemy turn (if still in combat)
      if (withGs.phase === 'player-turn' || withGs.phase === 'enemy-turn') {
        withGs = companionAutoAct(withGs);
      }
      return withGs;
    }
    
    // Companions auto-act after enemy turn (if still in combat)
    if (next.phase === 'player-turn' || next.phase === 'enemy-turn') {
      return companionAutoAct(next);
    }
    return next;
}

function finalizeCombatState(next, overrides = {}) {
  if (!next) return next;
  return trackAchievements({ ...next, ...overrides });
}

function applyCraftingMaterialDrops(state) {
  if (!state || state.phase !== 'victory') return;

  const enemyLevel = state.enemy?.level ?? state.player?.level ?? 1;
  const drops = getCraftingMaterialDrops(enemyLevel);
  if (!drops || drops.length === 0) return;

  const lootedItems = Array.isArray(state.lootedItems) ? [...state.lootedItems] : [];
  let inventory = state.player?.inventory || {};

  for (const drop of drops) {
    const qty = drop.quantity ?? 1;
    inventory = addItemToInventory(inventory, drop.materialId, qty);
    const item = lookupItem(drop.materialId);
    const name = item?.name || drop.materialId;
    const label = qty > 1 ? `${name} x${qty}` : name;
    lootedItems.push({ id: drop.materialId, name: label });
  }

  state.player = { ...state.player, inventory };
  state.lootedItems = lootedItems;
}
