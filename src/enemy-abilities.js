/**
 * Enemy Abilities AI — AI Village RPG
 *
 * Provides deterministic enemy action selection and ability execution
 * for the turn-based combat system.
 */

import { getAbility } from './combat/abilities.js';
import { calculateDamage } from './combat/damage-calc.js';
import { clamp, pushLog } from './state.js';
import { nextRng, getPlayerStatusResist } from './combat.js';

const RNG_MOD = 2147483647;
const RNG_MULT = 48271;

const BEHAVIOR_WEIGHTS = {
  basic: { attack: 0.7, ability: 0.2, defend: 0.1 },
  aggressive: { attack: 0.5, ability: 0.4, defend: 0.1 },
  caster: { attack: 0.2, ability: 0.65, defend: 0.15 },
  support: { attack: 0.3, ability: 0.5, defend: 0.2 },
  boss: { attack: 0.3, ability: 0.55, defend: 0.15 },
};

function nextSeed(seed) {
  const safeSeed = Number.isFinite(seed) && seed > 0 ? seed : 1;
  const next = (safeSeed * RNG_MULT) % RNG_MOD;
  return { seed: next, value: next / RNG_MOD };
}

function addStatusEffect(target, effect) {
  const statusEffects = target.statusEffects ?? [];
  return { ...target, statusEffects: [...statusEffects, { ...effect }] };
}

/**
 * Select an enemy action based on AI behavior and available abilities.
 * @param {Object} enemy
 * @param {Object} player
 * @param {number} rngSeed
 * @returns {{ action: 'attack'|'ability'|'defend', abilityId: string|null, newSeed: number }}
 */
export function selectEnemyAction(enemy, player, rngSeed) {
  const behavior = BEHAVIOR_WEIGHTS[enemy?.aiBehavior] ?? BEHAVIOR_WEIGHTS.basic;
  const { seed: seedAfterAction, value: actionRoll } = nextSeed(rngSeed);

  let action = 'attack';
  if (actionRoll < behavior.attack) {
    action = 'attack';
  } else if (actionRoll < behavior.attack + behavior.ability) {
    action = 'ability';
  } else {
    action = 'defend';
  }

  let abilityId = null;
  let seed = seedAfterAction;

  if (action === 'ability') {
    const currentMp = enemy?.mp ?? 0;
    const abilityIds = enemy?.abilities ?? [];
    const usable = abilityIds.filter((id) => {
      const ability = getAbility(id);
      if (!ability) return false;
      return currentMp >= (ability.mpCost ?? 0);
    });

    if (usable.length === 0) {
      action = 'attack';
    } else {
      const { seed: nextSeedValue, value: abilityRoll } = nextSeed(seed);
      seed = nextSeedValue;
      const index = Math.floor(abilityRoll * usable.length);
      abilityId = usable[index];
    }
  }

  return { action, abilityId, newSeed: seed };
}

/**
 * Execute an enemy ability against the player or itself.
 * @param {Object} state
 * @param {string} abilityId
 * @returns {Object}
 */
export function executeEnemyAbility(state, abilityId) {
  const ability = getAbility(abilityId);
  if (!ability) return state;

  const currentMp = state.enemy.mp ?? 0;
  const newMp = clamp(currentMp - (ability.mpCost ?? 0), 0, state.enemy.maxMp ?? currentMp);

  let nextState = {
    ...state,
    enemy: { ...state.enemy, mp: newMp, defending: false },
  };

  const effect = ability.statusEffect ?? null;
  const extras = [];

  if (ability.targetType === 'single-enemy' || ability.targetType === 'all-enemies') {
    const { seed, value: rngValue } = nextRng(nextState.rngSeed);
    nextState = { ...nextState, rngSeed: seed };

    const { damage, critical, elementMult } = calculateDamage({
      attackerAtk: nextState.enemy.atk,
      targetDef: nextState.player.def,
      targetDefending: nextState.player.defending,
      element: ability.element,
      targetElement: null,
      rngValue,
      abilityPower: ability.power,
      worldEvent: nextState.worldEvent || null,
    });

    const newPlayerHp = clamp(
      nextState.player.hp - damage,
      0,
      nextState.player.maxHp
    );

    if (effect) {
      let resisted = false;
      const resistChance = getPlayerStatusResist(nextState.player, effect.type);
      if (resistChance > 0) {
        const { seed: resistSeed, value: resistRoll } = nextRng(nextState.rngSeed);
        nextState = { ...nextState, rngSeed: resistSeed };
        resisted = resistRoll < resistChance;
      }

      if (resisted) {
        nextState = {
          ...nextState,
          player: { ...nextState.player, hp: newPlayerHp, defending: false },
        };
        nextState = pushLog(nextState, `You resist the ${effect.name}!`);
      } else {
        nextState = {
          ...nextState,
          player: addStatusEffect({
            ...nextState.player,
            hp: newPlayerHp,
            defending: false,
          }, effect),
        };
        extras.push(effect.name);
      }
    } else {
      nextState = {
        ...nextState,
        player: { ...nextState.player, hp: newPlayerHp, defending: false },
      };
    }

    if (critical) extras.push('Critical!');
    if (elementMult > 1.0) extras.push('Elemental!');

    const suffix = extras.length > 0 ? ` (${extras.join(') (')})` : '';
    nextState = pushLog(
      nextState,
      `${nextState.enemy.name} uses ${ability.name} for ${damage} damage!${suffix}`
    );
  } else if (ability.targetType === 'self') {
    if (effect) {
      nextState = {
        ...nextState,
        enemy: addStatusEffect(nextState.enemy, effect),
      };
      if (effect.name && Number.isFinite(effect.duration)) {
        extras.push(`${effect.name} ${effect.duration} turns`);
      } else if (effect.name) {
        extras.push(effect.name);
      }
    }

    const suffix = extras.length > 0 ? ` (${extras.join(') (')})` : '';
    nextState = pushLog(
      nextState,
      `${nextState.enemy.name} uses ${ability.name}!${suffix}`
    );
  }

  if (nextState.player.hp <= 0) {
    nextState = { ...nextState, phase: 'defeat' };
  } else if (nextState.enemy.hp <= 0) {
    nextState = { ...nextState, phase: 'victory' };
  }

  return nextState;
}

/**
 * Get a display description for an enemy action.
 * @param {'attack'|'ability'|'defend'} action
 * @param {string|null} abilityId
 * @param {string} enemyName
 * @returns {string}
 */
export function getEnemyActionDescription(action, abilityId, enemyName) {
  if (action === 'ability') {
    const ability = abilityId ? getAbility(abilityId) : null;
    if (ability) return `${enemyName} uses ${ability.name}!`;
    return `${enemyName} attacks!`;
  }
  if (action === 'defend') return `${enemyName} defends!`;
  return `${enemyName} attacks!`;
}
