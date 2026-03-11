import { playerAttack, playerDefend, playerFlee, playerUsePotion, playerUseAbility, playerUseItem, enemyAct } from '../combat.js';
import { createGameStats, recordDamageDealt, recordTurnPlayed, recordItemUsed, recordAbilityUsed, recordDamageReceived, recordShieldBroken, recordWeaknessHit, recordDefeatedWhileBroken } from '../game-stats.js';
import { getCraftingMaterialDrops, lookupItem } from '../crafting.js';
import { addItemToInventory } from '../items.js';
import { trackAchievements } from '../achievements.js';
import { companionAutoAct } from '../companions.js';
import { createCombatStats, recordPlayerAttack, recordPlayerDefend, recordAbilityUse, recordItemUse, recordPotionUse, recordDamageReceived as csRecordDamageReceived, recordFleeAttempt, recordCompanionAction, recordTurn, finalizeCombatStats, formatCombatStatsDisplay } from '../combat-stats-tracker.js';

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

  let cs = state.combatStats || null;
  if (!cs && state.enemy) {
    cs = createCombatStats(state.enemy?.name || 'Unknown Enemy', state.enemy?.isBoss || false);
  }

  const type = action.type;

  if (type === 'PLAYER_ATTACK') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerAttack(state);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    
    let gs = next.gameStats || createGameStats();
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    if (next._triggeredShieldBreak) gs = recordShieldBroken(gs);
    if (next._hitWeakness) gs = recordWeaknessHit(gs);
    if (next._defeatedWhileBroken) gs = recordDefeatedWhileBroken(gs);
    applyCraftingMaterialDrops(next);

    if (cs) {
      recordPlayerAttack(cs, dmgDealt);
      recordTurn(cs, 'player');
    }
    
    return finalizeCombatState(next, { gameStats: gs, combatStats: cs });
  }

  if (type === 'PLAYER_DEFEND') {
    const next = playerDefend(state);
    if (cs) {
      recordPlayerDefend(cs);
      recordTurn(cs, 'player');
    }
    return finalizeCombatState(next, { combatStats: cs });
  }

  if (type === 'PLAYER_FLEE') {
    const next = playerFlee(state);
    let gs = next.gameStats || createGameStats();
    gs = recordTurnPlayed(gs);
    if (cs) {
      recordFleeAttempt(cs);
      recordTurn(cs, 'player');
      if (next.phase === 'fled') {
        finalizeCombatStats(cs, 'fled', next.player?.hp ?? 0, next.player?.maxHp ?? 100);
      }
    }
    const combatStatsSummary = cs && next.phase === 'fled' ? formatCombatStatsDisplay(cs) : undefined;
    return finalizeCombatState(next, { gameStats: gs, combatStats: cs, combatStatsSummary });
  }

  if (type === 'PLAYER_POTION') {
    const next = playerUsePotion(state);
    let gs = next.gameStats || createGameStats();
    gs = recordItemUsed(gs, 'potion');
    gs = recordTurnPlayed(gs);
    applyCraftingMaterialDrops(next);
    const healingDone = (next.player?.hp ?? 0) - (state.player?.hp ?? 0);
    if (cs) {
      recordPotionUse(cs, Math.max(0, healingDone));
      recordTurn(cs, 'player');
    }
    return finalizeCombatState(next, { gameStats: gs, combatStats: cs });
  }

  if (type === 'PLAYER_ABILITY') {
    const enemyHpBefore = state.enemy?.hp ?? 0;
    const next = playerUseAbility(state, action.abilityId);
    const dmgDealt = Math.max(0, enemyHpBefore - (next.enemy?.hp ?? 0));
    
    let gs = next.gameStats || createGameStats();
    gs = recordAbilityUsed(gs, action.abilityId);
    if (dmgDealt > 0) gs = recordDamageDealt(gs, dmgDealt);
    gs = recordTurnPlayed(gs);
    if (next._triggeredShieldBreak) gs = recordShieldBroken(gs);
    if (next._hitWeakness) gs = recordWeaknessHit(gs);
    if (next._defeatedWhileBroken) gs = recordDefeatedWhileBroken(gs);
    applyCraftingMaterialDrops(next);

    const healingDone = Math.max(0, (next.player?.hp ?? 0) - (state.player?.hp ?? 0));
    if (cs) {
      recordAbilityUse(cs, action.abilityId, dmgDealt, healingDone);
      recordTurn(cs, 'player');
    }
    
    return finalizeCombatState(next, { gameStats: gs, combatStats: cs });
  }

  if (type === 'PLAYER_ITEM') {
    const next = playerUseItem(state, action.itemId);
    let gs = next.gameStats || createGameStats();
    gs = recordItemUsed(gs, action.itemId);
    gs = recordTurnPlayed(gs);
    applyCraftingMaterialDrops(next);
    const healingDone = Math.max(0, (next.player?.hp ?? 0) - (state.player?.hp ?? 0));
    if (cs) {
      recordItemUse(cs, action.itemId, healingDone);
      recordTurn(cs, 'player');
    }
    return finalizeCombatState(next, { gameStats: gs, combatStats: cs });
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
  let cs = state.combatStats || null;
  if (!cs && state.enemy) {
    cs = createCombatStats(state.enemy?.name || 'Unknown Enemy', state.enemy?.isBoss || false);
  }
  const hpBefore = state.player?.hp ?? 0;
  const next = enemyAct(state);
  const dmgReceived = Math.max(0, hpBefore - (next.player?.hp ?? hpBefore));
  applyCraftingMaterialDrops(next);

  if (cs) {
    csRecordDamageReceived(cs, dmgReceived);
    recordTurn(cs, 'enemy');
  }
  
  if (dmgReceived > 0) {
    let withGs = { ...next, gameStats: recordDamageReceived(next.gameStats || createGameStats(), dmgReceived), combatStats: cs };
    // Companions auto-act after enemy turn (if still in combat)
    if (withGs.phase === 'player-turn' || withGs.phase === 'enemy-turn') {
      const enemyHpBeforeCompanion = withGs.enemy?.hp ?? 0;
      const playerHpBeforeCompanion = withGs.player?.hp ?? 0;
      const afterCompanion = companionAutoAct(withGs);
      withGs = { ...afterCompanion, combatStats: cs };
      if (cs) {
        const enemyHpAfterCompanion = withGs.enemy?.hp ?? enemyHpBeforeCompanion;
        const playerHpAfterCompanion = withGs.player?.hp ?? playerHpBeforeCompanion;
        const companionDmg = Math.max(0, enemyHpBeforeCompanion - enemyHpAfterCompanion);
        const companionHeal = Math.max(0, playerHpAfterCompanion - playerHpBeforeCompanion);
        if (companionDmg > 0 || companionHeal > 0) {
          recordCompanionAction(cs, companionDmg, companionHeal);
        }
      }
    }
    if (cs && (withGs.phase === 'victory' || withGs.phase === 'defeat')) {
      finalizeCombatStats(cs, withGs.phase, withGs.player?.hp ?? 0, withGs.player?.maxHp ?? 100);
      withGs = { ...withGs, combatStatsSummary: formatCombatStatsDisplay(cs) };
    }
    return withGs;
  }
  
  // Companions auto-act after enemy turn (if still in combat)
  if (next.phase === 'player-turn' || next.phase === 'enemy-turn') {
    const enemyHpBeforeCompanion = next.enemy?.hp ?? 0;
    const playerHpBeforeCompanion = next.player?.hp ?? 0;
    let withCompanion = companionAutoAct(next);
    if (cs) {
      const enemyHpAfterCompanion = withCompanion.enemy?.hp ?? enemyHpBeforeCompanion;
      const playerHpAfterCompanion = withCompanion.player?.hp ?? playerHpBeforeCompanion;
      const companionDmg = Math.max(0, enemyHpBeforeCompanion - enemyHpAfterCompanion);
      const companionHeal = Math.max(0, playerHpAfterCompanion - playerHpBeforeCompanion);
      if (companionDmg > 0 || companionHeal > 0) {
        recordCompanionAction(cs, companionDmg, companionHeal);
      }
    }
    if (cs && (withCompanion.phase === 'victory' || withCompanion.phase === 'defeat')) {
      finalizeCombatStats(cs, withCompanion.phase, withCompanion.player?.hp ?? 0, withCompanion.player?.maxHp ?? 100);
      withCompanion = { ...withCompanion, combatStatsSummary: formatCombatStatsDisplay(cs) };
    }
    return { ...withCompanion, combatStats: cs };
  }
  let finalized = next;
  if (cs && (finalized.phase === 'victory' || finalized.phase === 'defeat')) {
    finalizeCombatStats(cs, finalized.phase, finalized.player?.hp ?? 0, finalized.player?.maxHp ?? 100);
    finalized = { ...finalized, combatStatsSummary: formatCombatStatsDisplay(cs) };
  }
  return { ...finalized, combatStats: cs };
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
