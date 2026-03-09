import { clamp, pushLog } from './state.js';
import { items } from './data/items.js';
import { removeItemFromInventory, hasItem } from './items.js';
import { getEnemy, getEncounter } from './data/enemies.js';
import { getAbility, getAbilityDisplayInfo } from './combat/abilities.js';
import { calculateDamage, calculateHeal, getElementMultiplier } from './combat/damage-calc.js';
import { StatusEffect } from './combat/status-effects.js';
import { selectEnemyAction, executeEnemyAbility } from './enemy-abilities.js';
import { getEffectiveCombatStats } from './combat/equipment-bonuses.js';
import { getGoldMultiplier, getMpCostMultiplier, getDamageMultiplier } from './world-events.js';
import { recordEncounter, recordDefeat } from './bestiary.js';
import { rollLootDrop, applyLootToState } from './loot-tables.js';
import { logCombatVictory, logBossDefeat } from './journal.js';
import {
  companionsCombatTurn,
  selectEnemyTarget,
  enemyAttackCompanion,
  processCompanionCombatRewards,
  processCompanionDefeatPenalty,
  autoReviveCompanionsAfterCombat,
} from './companion-combat.js';

// Minimal deterministic RNG (Park-Miller LCG)
export function nextRng(seed) {
  const a = 48271;
  const m = 2147483647;
  const next = (seed * a) % m;
  return { seed: next, value: next / m };
}

function computeDamage({ attackerAtk, targetDef, targetDefending, worldEvent }) {
  const defendBonus = targetDefending ? 3 : 0;
  const raw = attackerAtk - (targetDef + defendBonus);
  const baseDamage = Math.max(1, raw);
  const mult = getDamageMultiplier(worldEvent);
  return Math.max(1, Math.floor(baseDamage * mult));
}

function isStunned(entity) {
  return (entity.statusEffects ?? []).some(
    (effect) => effect.type === 'stun' && effect.duration >= 0
  );
}

export function addStatusEffect(state, targetKey, effect) {
  const target = state[targetKey];
  if (!target) return state;
  const statusEffects = target.statusEffects ?? [];
  return {
    ...state,
    [targetKey]: { ...target, statusEffects: [...statusEffects, { ...effect }] },
  };
}

function processTurnStart(state, actorKey) {
  const actor = state[actorKey];
  if (!actor) return state;

  let nextState = state;
  const actorName = actorKey === 'player' ? 'You' : state.enemy.name;
  const actorPossessive = actorKey === 'player' ? 'Your' : `${state.enemy.name}'s`;
  let hp = actor.hp;
  const remainingEffects = [];

  for (const effect of actor.statusEffects ?? []) {
    const duration = effect.duration ?? 0;
    if (duration <= 0) {
      nextState = pushLog(nextState, `${actorPossessive} ${effect.type} wears off.`);
      continue;
    }

    const verb = actorKey === 'player' ? 'take' : 'takes';
    const healVerb = actorKey === 'player' ? 'regain' : 'regains';

    if (effect.type === 'poison' || effect.type === 'burn') {
      const damage = Math.max(0, effect.power ?? 0);
      if (damage > 0) {
        hp = clamp(hp - damage, 0, actor.maxHp);
        const source = effect.type === 'poison' ? 'poison' : 'burn';
        nextState = pushLog(nextState, `${actorName} ${verb} ${damage} ${source} damage.`);
      }
    } else if (effect.type === 'regen') {
      const heal = Math.max(0, effect.power ?? 0);
      if (heal > 0) {
        hp = clamp(hp + heal, 0, actor.maxHp);
        nextState = pushLog(nextState, `${actorName} ${healVerb} ${heal} HP.`);
      }
    }

    const newDuration = duration - 1;
    remainingEffects.push({ ...effect, duration: newDuration });
  }

  nextState = {
    ...nextState,
    [actorKey]: { ...actor, hp, statusEffects: remainingEffects },
  };

  return applyVictoryDefeat(nextState);
}

function applyVictoryDefeat(state) {
  if (state.enemy.hp <= 0) {
    const xpGained = state.enemy.xpReward ?? 0;
    const baseGold = state.enemy.goldReward ?? 0;
    const goldGained = Math.floor(baseGold * getGoldMultiplier(state.worldEvent));
    state = {
      ...state,
      phase: 'victory',
      xpGained,
      goldGained,
      player: {
        ...state.player,
        xp: (state.player.xp ?? 0) + xpGained,
        gold: (state.player.gold ?? 0) + goldGained,
      },
    };
    if (state.bestiary && state.currentEnemyId) { state = { ...state, bestiary: recordDefeat(state.bestiary, state.currentEnemyId) }; }
    // Generate loot drops
    if (state.currentEnemyId) {
      const lootSeed = state.rngSeed ?? Date.now();
      const { lootedItems, seed: newSeed } = rollLootDrop(state.currentEnemyId, lootSeed);
      state = applyLootToState(state, lootedItems);
      state = { ...state, rngSeed: newSeed };
      for (const loot of lootedItems) {
        state = pushLog(state, `Loot: ${loot.name} (${loot.rarity})`);
      }
    }
    state = pushLog(state, `Victory! The ${state.enemy.name} dissolves.`);
    // Log to journal
    state = logCombatVictory(state, state.enemy.name, goldGained, xpGained);
    if (state.enemy.isBoss) {
      state = logBossDefeat(state, state.enemy.name);
    }
    // Companion combat rewards: loyalty adjustments + auto-revive
    state = processCompanionCombatRewards(state);
    state = autoReviveCompanionsAfterCombat(state);
  }
  if (state.player.hp <= 0) {
    state = { ...state, phase: 'defeat' };
    state = pushLog(state, `Defeat... You collapse.`);
    // Companion defeat penalty: all companions lose loyalty
    state = processCompanionDefeatPenalty(state);
  }
  return state;
}

export function startNewEncounter(state, zoneLevel = 1) {
  const encounter = getEncounter(zoneLevel);
  const enemyId = encounter[0];
  const enemyBase = getEnemy(enemyId);
  const enemy = {
    ...enemyBase,
    hp: enemyBase.maxHp ?? enemyBase.hp,
    maxHp: enemyBase.maxHp ?? enemyBase.hp,
    defending: false,
    statusEffects: [],
  };

  let next = {
    ...state,
    enemy,
    phase: 'player-turn',
    turn: 1,
    player: { ...state.player, defending: false, statusEffects: [] },
  };
  next = { ...next, currentEnemyId: enemyId, bestiary: recordEncounter(next.bestiary || { encountered: [], defeatedCounts: {} }, enemyId) };

  next = pushLog(next, `A wild ${enemy.name} appears.`);
  next = pushLog(next, `Your turn.`);
  return next;
}

export function playerAttack(state) {
  if (state.phase !== 'player-turn') return state;

  if (isStunned(state.player)) {
    state = pushLog(state, 'Player is stunned!');
    state = processTurnStart(state, 'enemy');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    return { ...state, phase: 'enemy-turn' };
  }

  // Apply equipment bonuses to player's attack stat
  const playerStats = getEffectiveCombatStats(state.player);
  const damage = computeDamage({
    attackerAtk: playerStats.atk,
    targetDef: state.enemy.def,
    targetDefending: state.enemy.defending,
    worldEvent: state.worldEvent || null,
  });

  const enemyHp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
  state = {
    ...state,
    enemy: { ...state.enemy, hp: enemyHp, defending: false },
    player: { ...state.player, defending: false },
  };

  state = pushLog(state, `You strike for ${damage} damage.`);
  // Companions attack after player
  if (state.enemy.hp > 0) {
    const companionResult = companionsCombatTurn(state, state.rngSeed ?? 1);
    state = companionResult.state;
    state = { ...state, rngSeed: companionResult.seed };
  }
  state = applyVictoryDefeat(state);
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  state = processTurnStart(state, 'enemy');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  return { ...state, phase: 'enemy-turn' };
}

export function playerDefend(state) {
  if (state.phase !== 'player-turn') return state;
  if (isStunned(state.player)) {
    state = pushLog(state, 'Player is stunned!');
    state = processTurnStart(state, 'enemy');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    return { ...state, phase: 'enemy-turn' };
  }
  state = {
    ...state,
    player: { ...state.player, defending: true },
  };
  state = pushLog(state, `You brace for impact.`);
  state = processTurnStart(state, 'enemy');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  return { ...state, phase: 'enemy-turn' };
}

export function playerFlee(state) {
  if (state.phase !== 'player-turn') return state;
  if (isStunned(state.player)) {
    state = pushLog(state, 'Player is stunned!');
    state = processTurnStart(state, 'enemy');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    return { ...state, phase: 'enemy-turn' };
  }

  const { seed, value } = nextRng(state.rngSeed);
  state = { ...state, rngSeed: seed };

  if (value < 0.4) {
    state = pushLog(state, 'You fled successfully!');
    return { ...state, phase: 'fled' };
  }

  state = pushLog(state, 'Failed to flee!');
  state = processTurnStart(state, 'enemy');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  return { ...state, phase: 'enemy-turn' };
}

export function playerUsePotion(state) {
  if (state.phase !== 'player-turn') return state;

  if (isStunned(state.player)) {
    state = pushLog(state, 'Player is stunned!');
    state = processTurnStart(state, 'enemy');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    return { ...state, phase: 'enemy-turn' };
  }

  const count = state.player.inventory.potion ?? 0;
  if (count <= 0) {
    return pushLog(state, `You fumble for a potion, but you're out.`);
  }

  const heal = items.potion.heal;
  const hp = clamp(state.player.hp + heal, 0, state.player.maxHp);
  state = {
    ...state,
    player: {
      ...state.player,
      hp,
      defending: false,
      inventory: { ...state.player.inventory, potion: count - 1 },
    },
  };

  state = pushLog(state, `You drink a potion and heal ${hp - (state.player.hp)} HP.`);
  state = processTurnStart(state, 'enemy');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  return { ...state, phase: 'enemy-turn' };
}

export function playerUseAbility(state, abilityId) {
  if (state.phase !== 'player-turn') return state;

  const ability = getAbility(abilityId);
  if (!ability) {
    return pushLog(state, 'Unknown ability.');
  }

  // Check if the player actually has this ability
  const playerAbilities = state.player.abilities ?? [];
  if (!playerAbilities.includes(abilityId)) {
    return pushLog(state, `You don't know ${ability.name}.`);
  }

  // Check MP
  const currentMp = state.player.mp ?? 0;
  const effectiveMpCost = Math.max(
    1,
    Math.floor(ability.mpCost * getMpCostMultiplier(state.worldEvent))
  );
  if (currentMp < effectiveMpCost) {
    return pushLog(
      state,
      `Not enough MP! ${ability.name} costs ${effectiveMpCost} MP. You have ${currentMp} MP.`
    );
  }

  // Deduct MP
  state = {
    ...state,
    player: {
      ...state.player,
      mp: currentMp - effectiveMpCost,
      defending: false,
    },
  };

  state = pushLog(state, `You use ${ability.name}!`);

  // Get RNG value for damage calculations
  const { seed, value: rngValue } = nextRng(state.rngSeed);
  state = { ...state, rngSeed: seed };

  // Handle by target type
  if (ability.targetType === 'single-enemy' || ability.targetType === 'all-enemies') {
    // Damage ability targeting enemy
    if (ability.power > 0) {
      const abilityElement = ability.element ?? 'physical';
      // Apply equipment bonuses to player's attack stat for abilities
      const abilityPlayerStats = getEffectiveCombatStats(state.player);
      const { damage, critical } = calculateDamage({
        attackerAtk: abilityPlayerStats.atk,
        targetDef: state.enemy.def,
        targetDefending: state.enemy.defending,
        element: abilityElement,
        targetElement: state.enemy.element ?? null,
        rngValue,
        abilityPower: ability.power,
        worldEvent: state.worldEvent || null,
      });

      const enemyHp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
      state = {
        ...state,
        enemy: { ...state.enemy, hp: enemyHp },
      };
      let msg = `${state.enemy.name} takes ${damage} ${abilityElement} damage!`;
      if (critical) msg += ' Critical hit!';
      state = pushLog(state, msg);
    }

    // Apply status effect to enemy
    if (ability.statusEffect) {
      state = addStatusEffect(state, 'enemy', ability.statusEffect);
      state = pushLog(state, `${state.enemy.name} is afflicted with ${ability.statusEffect.name}!`);
    }
  } else if (ability.targetType === 'single-ally' || ability.targetType === 'all-allies' || ability.targetType === 'self') {
    // Healing ability targeting player
    if (ability.healPower > 0) {
      const healAmount = ability.healPower;
      const oldHp = state.player.hp;
      const newHp = clamp(oldHp + healAmount, 0, state.player.maxHp);
      state = {
        ...state,
        player: { ...state.player, hp: newHp },
      };
      state = pushLog(state, `You are healed for ${newHp - oldHp} HP!`);
    }

    // Apply buff/status to player
    if (ability.statusEffect) {
      state = addStatusEffect(state, 'player', ability.statusEffect);
      state = pushLog(state, `You gain ${ability.statusEffect.name}!`);
    }

    // Handle purify special: remove negative status effects
    if (ability.special === 'cleanse') {
      const currentEffects = state.player.statusEffects ?? [];
      const debuffTypes = ['poison', 'burn', 'stun', 'sleep', 'atk-down', 'def-down', 'spd-down'];
      const cleaned = currentEffects.filter(e => !debuffTypes.includes(e.type));
      state = {
        ...state,
        player: { ...state.player, statusEffects: cleaned },
      };
      state = pushLog(state, `Negative effects purified!`);
    }
  }

  // Transition to enemy turn
  state = { ...state, phase: 'enemy-turn' };
  return applyVictoryDefeat(state);
}


export function playerUseItem(state, itemId) {
  if (state.phase !== 'player-turn') return state;

  if (isStunned(state.player)) {
    state = pushLog(state, 'Player is stunned!');
    state = processTurnStart(state, 'enemy');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    return { ...state, phase: 'enemy-turn' };
  }

  const item = items[itemId];
  if (!item) {
    return pushLog(state, 'Unknown item.');
  }

  if (item.type !== 'consumable') {
    return pushLog(state, `${item.name} cannot be used in combat.`);
  }

  // Check if player has the item in inventory
  const inventory = state.player.inventory || {};
  if (!hasItem(inventory, itemId)) {
    return pushLog(state, `You don't have any ${item.name}.`);
  }

  // Remove item from inventory
  const newInventory = removeItemFromInventory(inventory, itemId, 1);
  state = {
    ...state,
    player: { ...state.player, inventory: newInventory, defending: false },
  };

  const effect = item.effect || {};

  // Handle healing items (potion, hiPotion)
  const healAmount = effect.heal ?? item.heal;
  if (healAmount !== undefined && healAmount !== null && healAmount > 0) {
    const oldHp = state.player.hp;
    const newHp = clamp(oldHp + healAmount, 0, state.player.maxHp);
    const actualHeal = newHp - oldHp;
    state = {
      ...state,
      player: { ...state.player, hp: newHp },
    };
    state = pushLog(state, `You use ${item.name} and restore ${actualHeal} HP.`);
  }

  // Handle mana restoration (ether)
  const manaAmount = effect.mana ?? effect.restoreMP;
  if (manaAmount !== undefined && manaAmount !== null && manaAmount > 0) {
    const oldMp = state.player.mp ?? 0;
    const maxMp = state.player.maxMp ?? 0;
    const newMp = clamp(oldMp + manaAmount, 0, maxMp);
    const actualRestore = newMp - oldMp;
    state = {
      ...state,
      player: { ...state.player, mp: newMp },
    };
    state = pushLog(state, `You use ${item.name} and restore ${actualRestore} MP.`);
  }

  // Handle damage items (bomb)
  if (effect.damage !== undefined && effect.damage > 0) {
    const damage = effect.damage;
    const element = effect.element || 'physical';
    const enemyHp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
    state = {
      ...state,
      enemy: { ...state.enemy, hp: enemyHp },
    };
    state = pushLog(state, `You throw ${item.name} for ${damage} ${element} damage!`);
    state = applyVictoryDefeat(state);
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
  }

  // Handle cleanse items (antidote)
  if (effect.cleanse && Array.isArray(effect.cleanse)) {
    const currentEffects = state.player.statusEffects ?? [];
    const cleaned = currentEffects.filter(e => !effect.cleanse.includes(e.type));
    const removed = currentEffects.length - cleaned.length;
    state = {
      ...state,
      player: { ...state.player, statusEffects: cleaned },
    };
    if (removed > 0) {
      state = pushLog(state, `You use ${item.name} and cure ${effect.cleanse.join(', ')}!`);
    } else {
      state = pushLog(state, `You use ${item.name}, but there was nothing to cure.`);
    }
  }

  // Transition to enemy turn
  state = processTurnStart(state, 'enemy');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  return { ...state, phase: 'enemy-turn' };
}

export function enemyAct(state) {
  if (state.phase !== 'enemy-turn') return state;
  if (state.enemy.hp <= 0 || state.player.hp <= 0) return applyVictoryDefeat(state);

  const wasEnemyStunned = (state.enemy.statusEffects ?? []).some(
    (effect) => effect.type === 'stun' && (effect.duration ?? 0) > 0
  );

  state = processTurnStart(state, 'enemy');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;

  if (wasEnemyStunned) {
    state = pushLog(state, `${state.enemy.name} is stunned and cannot act!`);
    state = processTurnStart(state, 'player');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    state = pushLog(state, `Your turn.`);
    return { ...state, phase: 'player-turn' };
  }

  const result = selectEnemyAction(state.enemy, state.player, state.rngSeed);
  state = { ...state, rngSeed: result.newSeed };

  if (result.action === 'defend') {
    state = {
      ...state,
      enemy: { ...state.enemy, defending: true },
      player: { ...state.player, defending: false },
      turn: state.turn + 1,
    };
    state = pushLog(state, `${state.enemy.name} takes a defensive stance.`);
  } else if (result.action === 'ability') {
    state = executeEnemyAbility(state, result.abilityId);
    state = { ...state, turn: state.turn + 1 };
    state = applyVictoryDefeat(state);
  } else if (result.action === 'attack') {
    // Select target: player or companion
    const targetResult = selectEnemyTarget(state, state.rngSeed ?? 1);
    state = { ...state, rngSeed: targetResult.seed };

    if (targetResult.targetType === 'companion' && targetResult.targetId) {
      // Enemy attacks a companion
      state = enemyAttackCompanion(state, targetResult.targetId, state.enemy.atk);
      state = {
        ...state,
        enemy: { ...state.enemy, defending: false },
        turn: state.turn + 1,
      };
    } else {
      // Apply equipment bonuses to player's defense stat
      const defenderStats = getEffectiveCombatStats(state.player);
      const damage = computeDamage({
        attackerAtk: state.enemy.atk,
        targetDef: defenderStats.def,
        targetDefending: state.player.defending,
        worldEvent: state.worldEvent || null,
      });

      const playerHp = clamp(state.player.hp - damage, 0, state.player.maxHp);
      state = {
        ...state,
        player: { ...state.player, hp: playerHp, defending: false },
        enemy: { ...state.enemy, defending: false },
        turn: state.turn + 1,
      };

      state = pushLog(state, `${state.enemy.name} slams you for ${damage} damage.`);
    }
    state = applyVictoryDefeat(state);
  }

  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  state = processTurnStart(state, 'player');
  if (state.phase === 'victory' || state.phase === 'defeat') return state;
  state = pushLog(state, `Your turn.`);
  return { ...state, phase: 'player-turn' };
}

export { getAbilityDisplayInfo };
