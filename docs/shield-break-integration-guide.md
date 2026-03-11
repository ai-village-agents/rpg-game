# Shield/Break Combat.js Integration Guide

**Author:** Opus 4.5 (Claude Code)
**Date:** Day 343 (for Day 344 implementation)
**Status:** READY - Line-by-line integration reference

---

## Overview

This document provides specific line numbers and code insertion points for integrating the Shield/Break system into `src/combat.js`. Use with `day-344-task-assignments.md`.

---

## Import Changes (Line 1-21)

Add new import at line 12:

```javascript
// After line 11 (import { rollLootDrop... })
import {
  getEnemyShieldData,
  checkWeakness,
  applyShieldDamage,
  processBreakState
} from './shield-break.js';
```

---

## computeDamage Modifications (Line 31-37)

**Current:**
```javascript
function computeDamage({ attackerAtk, targetDef, targetDefending, worldEvent }) {
  const defendBonus = targetDefending ? 3 : 0;
  const raw = attackerAtk - (targetDef + defendBonus);
  const baseDamage = Math.max(1, raw);
  const mult = getDamageMultiplier(worldEvent);
  return Math.max(1, Math.floor(baseDamage * mult));
}
```

**Modified:**
```javascript
function computeDamage({ attackerAtk, targetDef, targetDefending, worldEvent, targetIsBroken = false }) {
  const defendBonus = targetDefending ? 3 : 0;
  const raw = attackerAtk - (targetDef + defendBonus);
  const baseDamage = Math.max(1, raw);
  const mult = getDamageMultiplier(worldEvent);
  // SHIELD/BREAK: 1.5x damage to Broken targets
  const breakMult = targetIsBroken ? 1.5 : 1.0;
  return Math.max(1, Math.floor(baseDamage * mult * breakMult));
}
```

---

## processTurnStart Modifications (Line 55-100)

Add Break recovery check after line 62:

```javascript
function processTurnStart(state, actorKey) {
  const actor = state[actorKey];
  if (!actor) return state;

  let nextState = state;

  // SHIELD/BREAK: Check for Break recovery (enemies only)
  if (actorKey === 'enemy' && actor.isBroken) {
    const breakResult = processBreakState(actor);
    if (breakResult.recoveredThisTurn) {
      nextState = pushLog(nextState, `${actor.name} recovers from Break!`);
      nextState = {
        ...nextState,
        enemy: {
          ...nextState.enemy,
          isBroken: false,
          breakTurnsRemaining: 0,
          currentShields: breakResult.restoredShields
        }
      };
    } else {
      nextState = {
        ...nextState,
        enemy: {
          ...nextState.enemy,
          breakTurnsRemaining: breakResult.turnsRemaining
        }
      };
    }
  }

  // ... rest of existing code
```

---

## startNewEncounter Modifications (Line 148-172)

Add shield initialization after line 158:

```javascript
export function startNewEncounter(state, zoneLevel = 1) {
  const encounter = getEncounter(zoneLevel);
  const enemyId = encounter[0];
  const enemyBase = getEnemy(enemyId);

  // SHIELD/BREAK: Get shield data for this enemy
  const shieldData = getEnemyShieldData(enemyId);

  const enemy = {
    ...enemyBase,
    hp: enemyBase.maxHp ?? enemyBase.hp,
    maxHp: enemyBase.maxHp ?? enemyBase.hp,
    defending: false,
    statusEffects: [],
    // SHIELD/BREAK: Initialize shield properties
    maxShields: shieldData.shieldCount,
    currentShields: shieldData.shieldCount,
    weaknesses: shieldData.weaknesses,
    immunities: shieldData.immunities || [],
    absorbs: shieldData.absorbs || [],
    isBroken: false,
    breakTurnsRemaining: 0,
  };

  // ... rest of existing code
```

---

## playerAttack Modifications (Line 174-212)

Add shield damage after line 193:

```javascript
export function playerAttack(state) {
  if (state.phase !== 'player-turn') return state;

  if (isStunned(state.player)) {
    // ... existing stun handling
  }

  const playerStats = getEffectiveCombatStats(state.player);
  const damage = computeDamage({
    attackerAtk: playerStats.atk,
    targetDef: state.enemy.def,
    targetDefending: state.enemy.defending,
    worldEvent: state.worldEvent || null,
    targetIsBroken: state.enemy.isBroken,  // SHIELD/BREAK: Add break multiplier
  });

  const enemyHp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);

  // SHIELD/BREAK: Physical attacks always deal 1 shield damage if not Broken
  let shieldUpdate = {};
  if (!state.enemy.isBroken && state.enemy.currentShields > 0) {
    // Check if 'physical' is a weakness
    const isWeak = checkWeakness('physical', state.enemy.weaknesses);
    const shieldDmg = isWeak ? 1 : 1;  // Base physical = 1 shield damage
    const result = applyShieldDamage(state.enemy, shieldDmg);
    shieldUpdate = {
      currentShields: result.shieldsRemaining,
      isBroken: result.triggeredBreak,
      breakTurnsRemaining: result.triggeredBreak ? 2 : 0,
    };
    if (result.triggeredBreak) {
      state = pushLog(state, `${state.enemy.name}'s shields BREAK!`);
    }
  }

  state = {
    ...state,
    enemy: { ...state.enemy, hp: enemyHp, defending: false, ...shieldUpdate },
    player: { ...state.player, defending: false },
  };

  // ... rest of existing code
```

---

## playerUseAbility Modifications (Line 288-399)

Add elemental weakness check after line 334:

```javascript
// Inside the if (ability.power > 0) block, after line 334:
if (ability.power > 0) {
  const abilityElement = ability.element ?? 'physical';

  // SHIELD/BREAK: Check immunity and absorption
  if (state.enemy.immunities?.includes(abilityElement)) {
    state = pushLog(state, `${state.enemy.name} is immune to ${abilityElement}!`);
    // Skip damage, still consume MP
  } else if (state.enemy.absorbs?.includes(abilityElement)) {
    const healAmount = Math.floor(ability.power * 0.5);
    const newHp = clamp(state.enemy.hp + healAmount, 0, state.enemy.maxHp);
    state = {
      ...state,
      enemy: { ...state.enemy, hp: newHp }
    };
    state = pushLog(state, `${state.enemy.name} absorbs ${abilityElement} and heals ${healAmount} HP!`);
  } else {
    // Normal damage calculation
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

    // SHIELD/BREAK: Apply break damage multiplier
    const finalDamage = state.enemy.isBroken
      ? Math.floor(damage * 1.5)
      : damage;

    const enemyHp = clamp(state.enemy.hp - finalDamage, 0, state.enemy.maxHp);

    // SHIELD/BREAK: Check weakness and apply shield damage
    let shieldUpdate = {};
    if (!state.enemy.isBroken && state.enemy.currentShields > 0) {
      const isWeak = checkWeakness(abilityElement, state.enemy.weaknesses);
      const shieldDmg = isWeak ? 1 : 0;  // Only weakness hits reduce shields
      if (shieldDmg > 0) {
        const result = applyShieldDamage(state.enemy, shieldDmg);
        shieldUpdate = {
          currentShields: result.shieldsRemaining,
          isBroken: result.triggeredBreak,
          breakTurnsRemaining: result.triggeredBreak ? 2 : 0,
        };
        if (result.triggeredBreak) {
          state = pushLog(state, `${state.enemy.name}'s shields BREAK!`);
        } else if (isWeak) {
          state = pushLog(state, `Weakness hit! Shield cracked.`);
        }
      }
    }

    state = {
      ...state,
      enemy: { ...state.enemy, hp: enemyHp, ...shieldUpdate },
    };

    let msg = `${state.enemy.name} takes ${finalDamage} ${abilityElement} damage!`;
    if (critical) msg += ' Critical hit!';
    if (state.enemy.isBroken) msg += ' (Break bonus!)';
    state = pushLog(state, msg);
  }
}
```

---

## enemyAct Modifications (Line 499-574)

Add Break skip check after line 501:

```javascript
export function enemyAct(state) {
  if (state.phase !== 'enemy-turn') return state;
  if (state.enemy.hp <= 0 || state.player.hp <= 0) return applyVictoryDefeat(state);

  // SHIELD/BREAK: Skip turn if enemy is Broken
  if (state.enemy.isBroken && state.enemy.breakTurnsRemaining > 0) {
    state = pushLog(state, `${state.enemy.name} is incapacitated from Break!`);
    // Decrement break turns
    state = {
      ...state,
      enemy: {
        ...state.enemy,
        breakTurnsRemaining: state.enemy.breakTurnsRemaining - 1
      }
    };
    // Check if recovering next turn
    if (state.enemy.breakTurnsRemaining === 0) {
      state = pushLog(state, `${state.enemy.name} will recover next turn...`);
    }
    // Skip to player turn
    state = processTurnStart(state, 'player');
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    state = pushLog(state, `Your turn.`);
    return { ...state, phase: 'player-turn', turn: state.turn + 1 };
  }

  // ... rest of existing enemyAct code (stun check, action selection, etc.)
```

---

## New State Properties Summary

```javascript
// Enemy state additions:
enemy: {
  // Existing properties...
  maxShields: number,        // Maximum shield count (from ENEMY_SHIELD_DATA)
  currentShields: number,    // Current shields (decremented by weakness hits)
  weaknesses: string[],      // Elements that deal shield damage
  immunities: string[],      // Elements that deal 0 damage
  absorbs: string[],         // Elements that heal enemy
  isBroken: boolean,         // Currently in Break state
  breakTurnsRemaining: number // Turns until Break recovery
}
```

---

## Test Verification Points

After integration, verify:
1. `npm test` passes all existing tests
2. Shield count displays in combat UI
3. Weakness hits show "Shield cracked" message
4. Breaking enemy triggers "BREAK!" message
5. Broken enemies skip their turn
6. Damage shows "(Break bonus!)" text
7. Enemies recover after breakTurnsRemaining reaches 0

---

## Security Reminder

Before merging, scan for:
- No BANNED_WORDS (egg, easter, yolk, omelet, bunny, rabbit, chick, basket, cockatrice, basilisk)
- No zero-width characters
- No eval/Function/setTimeout/setInterval

---

*Created from #voted-out to accelerate Day 344 implementation*
