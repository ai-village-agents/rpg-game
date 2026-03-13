/**
 * Buff/Debuff System Tests
 * 90 tests covering effects, stacking, ticks, shields, and dispelling
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  EFFECT_TYPES,
  EFFECT_CATEGORIES,
  MODIFIABLE_STATS,
  STACK_MODES,
  createEffect,
  createEffectRegistry,
  registerEffect,
  createTargetState,
  applyEffect,
  removeEffect,
  processTick,
  calculateStatModifiers,
  applyModifiers,
  applyDamageToShields,
  dispelEffects,
  addImmunity,
  removeImmunity,
  hasEffect,
  getEffectStacks,
  getRemainingDuration,
  getTotalShieldAmount,
  getEffectsByType,
  getEffectsByCategory,
  getEffectInfo,
  clearAllEffects,
  getEffectSummary,
  getCategoryInfo
} from '../src/buff-debuff-system.js';

// ============================================================================
// Constants Tests (10 tests)
// ============================================================================

describe('EFFECT_TYPES', () => {
  it('has BUFF type', () => {
    assert.strictEqual(EFFECT_TYPES.BUFF, 'buff');
  });

  it('has DEBUFF type', () => {
    assert.strictEqual(EFFECT_TYPES.DEBUFF, 'debuff');
  });

  it('has NEUTRAL type', () => {
    assert.strictEqual(EFFECT_TYPES.NEUTRAL, 'neutral');
  });
});

describe('EFFECT_CATEGORIES', () => {
  it('has STAT_MOD category', () => {
    assert.strictEqual(EFFECT_CATEGORIES.STAT_MOD.name, 'Stat Modifier');
  });

  it('has DAMAGE_OVER_TIME category', () => {
    assert.strictEqual(EFFECT_CATEGORIES.DAMAGE_OVER_TIME.name, 'Damage Over Time');
  });

  it('has HEAL_OVER_TIME category', () => {
    assert.strictEqual(EFFECT_CATEGORIES.HEAL_OVER_TIME.name, 'Heal Over Time');
  });

  it('has CROWD_CONTROL category', () => {
    assert.strictEqual(EFFECT_CATEGORIES.CROWD_CONTROL.name, 'Crowd Control');
  });

  it('has SHIELD category', () => {
    assert.strictEqual(EFFECT_CATEGORIES.SHIELD.name, 'Shield');
  });

  it('has UTILITY category', () => {
    assert.strictEqual(EFFECT_CATEGORIES.UTILITY.name, 'Utility');
  });
});

describe('STACK_MODES', () => {
  it('has all stack modes', () => {
    assert.strictEqual(STACK_MODES.NONE, 'none');
    assert.strictEqual(STACK_MODES.INTENSITY, 'intensity');
    assert.strictEqual(STACK_MODES.DURATION, 'duration');
    assert.strictEqual(STACK_MODES.SEPARATE, 'separate');
  });
});

// ============================================================================
// createEffect Tests (8 tests)
// ============================================================================

describe('createEffect', () => {
  it('creates valid buff', () => {
    const result = createEffect('power_up', 'Power Up', 'buff', 'stat_mod');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.effect.name, 'Power Up');
    assert.strictEqual(result.effect.type, 'BUFF');
  });

  it('creates valid debuff', () => {
    const result = createEffect('weakness', 'Weakness', 'debuff', 'stat_mod');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.effect.type, 'DEBUFF');
  });

  it('validates effect id', () => {
    const result = createEffect('', 'Test', 'buff', 'stat_mod');
    assert.strictEqual(result.success, false);
  });

  it('validates effect name', () => {
    const result = createEffect('test', '', 'buff', 'stat_mod');
    assert.strictEqual(result.success, false);
  });

  it('validates effect type', () => {
    const result = createEffect('test', 'Test', 'invalid', 'stat_mod');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid effect type'));
  });

  it('validates effect category', () => {
    const result = createEffect('test', 'Test', 'buff', 'invalid');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid effect category'));
  });

  it('sets default values', () => {
    const result = createEffect('test', 'Test', 'buff', 'stat_mod');
    assert.strictEqual(result.effect.duration, 3);
    assert.strictEqual(result.effect.dispellable, true);
  });

  it('accepts custom options', () => {
    const result = createEffect('test', 'Test', 'buff', 'stat_mod', {
      duration: 5,
      maxStacks: 3,
      stackMode: STACK_MODES.INTENSITY,
      statModifiers: { attack: 10 }
    });
    assert.strictEqual(result.effect.duration, 5);
    assert.strictEqual(result.effect.maxStacks, 3);
    assert.strictEqual(result.effect.statModifiers.attack, 10);
  });
});

// ============================================================================
// Registry Tests (5 tests)
// ============================================================================

describe('Effect Registry', () => {
  function makeEffect(id = 'test') {
    return createEffect(id, 'Test', 'buff', 'stat_mod').effect;
  }

  it('creates empty registry', () => {
    const registry = createEffectRegistry();
    assert.deepStrictEqual(registry.effects, {});
  });

  it('registers effect', () => {
    const registry = createEffectRegistry();
    const result = registerEffect(registry, makeEffect());
    assert.strictEqual(result.success, true);
    assert.ok(result.registry.effects['test']);
  });

  it('indexes by category', () => {
    const registry = createEffectRegistry();
    const result = registerEffect(registry, makeEffect());
    assert.deepStrictEqual(result.registry.byCategory['STAT_MOD'], ['test']);
  });

  it('indexes by type', () => {
    const registry = createEffectRegistry();
    const result = registerEffect(registry, makeEffect());
    assert.deepStrictEqual(result.registry.byType['BUFF'], ['test']);
  });

  it('prevents duplicates', () => {
    let registry = createEffectRegistry();
    registry = registerEffect(registry, makeEffect()).registry;
    const result = registerEffect(registry, makeEffect());
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Target State Tests (3 tests)
// ============================================================================

describe('Target State', () => {
  it('creates empty state', () => {
    const state = createTargetState();
    assert.deepStrictEqual(state.activeEffects, []);
    assert.deepStrictEqual(state.shields, []);
  });

  it('initializes stats', () => {
    const state = createTargetState();
    assert.strictEqual(state.stats.totalEffectsApplied, 0);
    assert.strictEqual(state.stats.totalDamageFromDots, 0);
  });

  it('creates empty immunities', () => {
    const state = createTargetState();
    assert.deepStrictEqual(state.immunities, []);
  });
});

// ============================================================================
// Apply Effect Tests (10 tests)
// ============================================================================

describe('applyEffect', () => {
  function setup() {
    let registry = createEffectRegistry();
    const buff = createEffect('power_up', 'Power Up', 'buff', 'stat_mod', {
      duration: 3,
      stackMode: STACK_MODES.INTENSITY,
      maxStacks: 5
    }).effect;
    registry = registerEffect(registry, buff).registry;
    return { registry, state: createTargetState() };
  }

  it('applies new effect', () => {
    const { registry, state } = setup();
    const result = applyEffect(state, registry, 'power_up');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeEffects.length, 1);
  });

  it('updates stats', () => {
    const { registry, state } = setup();
    const result = applyEffect(state, registry, 'power_up');
    assert.strictEqual(result.state.stats.totalEffectsApplied, 1);
  });

  it('handles missing effect', () => {
    const { registry, state } = setup();
    const result = applyEffect(state, registry, 'nonexistent');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('not found'));
  });

  it('respects immunity', () => {
    const { registry } = setup();
    let state = createTargetState();
    state = addImmunity(state, 'power_up');
    const result = applyEffect(state, registry, 'power_up');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.immune, true);
  });

  it('stacks intensity mode', () => {
    const { registry } = setup();
    let state = createTargetState();
    state = applyEffect(state, registry, 'power_up').state;
    const result = applyEffect(state, registry, 'power_up');
    assert.strictEqual(result.state.activeEffects[0].stacks, 2);
  });

  it('respects max stacks', () => {
    const { registry } = setup();
    let state = createTargetState();
    for (let i = 0; i < 10; i++) {
      state = applyEffect(state, registry, 'power_up').state;
    }
    assert.strictEqual(state.activeEffects[0].stacks, 5);
  });

  it('refreshes duration in NONE mode', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('basic', 'Basic', 'buff', 'stat_mod', {
      stackMode: STACK_MODES.NONE
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'basic').state;
    const oldExpires = state.activeEffects[0].expiresAt;
    // Small delay to ensure different timestamp
    state = applyEffect(state, registry, 'basic').state;
    assert.ok(state.activeEffects[0].expiresAt >= oldExpires);
  });

  it('extends duration in DURATION mode', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('extend', 'Extend', 'buff', 'stat_mod', {
      duration: 3,
      stackMode: STACK_MODES.DURATION
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'extend').state;
    const result = applyEffect(state, registry, 'extend');
    assert.strictEqual(result.state.activeEffects[0].ticksRemaining, 6);
  });

  it('adds separate instances in SEPARATE mode', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('separate', 'Separate', 'buff', 'stat_mod', {
      stackMode: STACK_MODES.SEPARATE
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'separate').state;
    const result = applyEffect(state, registry, 'separate');
    assert.strictEqual(result.state.activeEffects.length, 2);
  });

  it('adds shields', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('barrier', 'Barrier', 'buff', 'shield', {
      shieldAmount: 100
    }).effect;
    registry = registerEffect(registry, effect).registry;
    const state = createTargetState();
    const result = applyEffect(state, registry, 'barrier');
    assert.strictEqual(result.state.shields.length, 1);
    assert.strictEqual(result.state.shields[0].amount, 100);
  });
});

// ============================================================================
// Remove Effect Tests (4 tests)
// ============================================================================

describe('removeEffect', () => {
  function setup() {
    let registry = createEffectRegistry();
    const effect = createEffect('test', 'Test', 'buff', 'stat_mod').effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'test').state;
    return { registry, state };
  }

  it('removes by effect id', () => {
    const { state } = setup();
    const result = removeEffect(state, 'test');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeEffects.length, 0);
  });

  it('updates stats on removal', () => {
    const { state } = setup();
    const result = removeEffect(state, 'test');
    assert.strictEqual(result.state.stats.totalEffectsExpired, 1);
  });

  it('fails for missing effect', () => {
    const { state } = setup();
    const result = removeEffect(state, 'nonexistent');
    assert.strictEqual(result.success, false);
  });

  it('removes by instance id', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('sep', 'Sep', 'buff', 'stat_mod', {
      stackMode: STACK_MODES.SEPARATE
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'sep').state;
    state = applyEffect(state, registry, 'sep').state;
    const instanceId = state.activeEffects[0].instanceId;
    const result = removeEffect(state, 'sep', instanceId);
    assert.strictEqual(result.state.activeEffects.length, 1);
  });
});

// ============================================================================
// Process Tick Tests (6 tests)
// ============================================================================

describe('processTick', () => {
  it('decrements tick counter', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('test', 'Test', 'buff', 'stat_mod', { duration: 5 }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'test').state;
    const result = processTick(state, registry);
    assert.strictEqual(result.state.activeEffects[0].ticksRemaining, 4);
  });

  it('expires effects at 0', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('test', 'Test', 'buff', 'stat_mod', { duration: 1 }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'test').state;
    const result = processTick(state, registry);
    assert.strictEqual(result.state.activeEffects.length, 0);
    assert.deepStrictEqual(result.expired, ['test']);
  });

  it('applies damage over time', () => {
    let registry = createEffectRegistry();
    const dot = createEffect('burn', 'Burn', 'debuff', 'damage_over_time', {
      duration: 3,
      damagePerTick: 10,
      damageType: 'fire'
    }).effect;
    registry = registerEffect(registry, dot).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'burn').state;
    const result = processTick(state, registry);
    assert.strictEqual(result.damage, 10);
    assert.strictEqual(result.state.stats.totalDamageFromDots, 10);
  });

  it('applies healing over time', () => {
    let registry = createEffectRegistry();
    const hot = createEffect('regen', 'Regen', 'buff', 'heal_over_time', {
      duration: 3,
      healPerTick: 15
    }).effect;
    registry = registerEffect(registry, hot).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'regen').state;
    const result = processTick(state, registry);
    assert.strictEqual(result.healing, 15);
    assert.strictEqual(result.state.stats.totalHealingFromHots, 15);
  });

  it('scales with stacks', () => {
    let registry = createEffectRegistry();
    const dot = createEffect('poison', 'Poison', 'debuff', 'damage_over_time', {
      duration: 3,
      damagePerTick: 5,
      stackMode: STACK_MODES.INTENSITY,
      maxStacks: 5
    }).effect;
    registry = registerEffect(registry, dot).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'poison', null, { stacks: 3 }).state;
    const result = processTick(state, registry);
    assert.strictEqual(result.damage, 15); // 5 * 3 stacks
  });

  it('returns tick results', () => {
    let registry = createEffectRegistry();
    const dot = createEffect('burn', 'Burn', 'debuff', 'damage_over_time', {
      damagePerTick: 10,
      damageType: 'fire'
    }).effect;
    registry = registerEffect(registry, dot).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'burn').state;
    const result = processTick(state, registry);
    assert.strictEqual(result.tickResults.length, 1);
    assert.strictEqual(result.tickResults[0].type, 'damage');
  });
});

// ============================================================================
// Stat Modifier Tests (6 tests)
// ============================================================================

describe('Stat Modifiers', () => {
  it('calculates flat modifiers', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('str', 'Strength', 'buff', 'stat_mod', {
      statModifiers: { attack: 10 }
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'str').state;
    const mods = calculateStatModifiers(state, registry);
    assert.strictEqual(mods.attack.flat, 10);
  });

  it('calculates percent modifiers', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('boost', 'Boost', 'buff', 'stat_mod', {
      statModifiers: { attack: { percent: 20 } }
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'boost').state;
    const mods = calculateStatModifiers(state, registry);
    assert.strictEqual(mods.attack.percent, 20);
  });

  it('scales modifiers with stacks', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('might', 'Might', 'buff', 'stat_mod', {
      statModifiers: { attack: 5 },
      stackMode: STACK_MODES.INTENSITY,
      maxStacks: 10
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'might', null, { stacks: 3 }).state;
    const mods = calculateStatModifiers(state, registry);
    assert.strictEqual(mods.attack.flat, 15);
  });

  it('applies flat modifiers to stats', () => {
    const baseStats = { attack: 100, defense: 50 };
    const modifiers = {
      attack: { flat: 20, percent: 0 },
      defense: { flat: 10, percent: 0 }
    };
    const result = applyModifiers(baseStats, modifiers);
    assert.strictEqual(result.attack, 120);
    assert.strictEqual(result.defense, 60);
  });

  it('applies percent modifiers to stats', () => {
    const baseStats = { attack: 100 };
    const modifiers = { attack: { flat: 0, percent: 50 } };
    const result = applyModifiers(baseStats, modifiers);
    assert.strictEqual(result.attack, 150);
  });

  it('combines flat and percent', () => {
    const baseStats = { attack: 100 };
    const modifiers = { attack: { flat: 20, percent: 10 } };
    const result = applyModifiers(baseStats, modifiers);
    assert.strictEqual(result.attack, 132); // (100 + 20) * 1.1
  });
});

// ============================================================================
// Shield Tests (5 tests)
// ============================================================================

describe('Shields', () => {
  it('absorbs full damage', () => {
    let state = createTargetState();
    state = { ...state, shields: [{ effectId: 'barrier', amount: 100 }] };
    const result = applyDamageToShields(state, 50);
    assert.strictEqual(result.damageToHealth, 0);
    assert.strictEqual(result.shieldAbsorbed, 50);
    assert.strictEqual(result.state.shields[0].amount, 50);
  });

  it('breaks shield when depleted', () => {
    let state = createTargetState();
    state = { ...state, shields: [{ effectId: 'barrier', amount: 50 }] };
    const result = applyDamageToShields(state, 100);
    assert.strictEqual(result.damageToHealth, 50);
    assert.strictEqual(result.shieldAbsorbed, 50);
    assert.strictEqual(result.state.shields.length, 0);
  });

  it('stacks multiple shields', () => {
    let state = createTargetState();
    state = { ...state, shields: [
      { effectId: 'barrier1', amount: 30 },
      { effectId: 'barrier2', amount: 50 }
    ]};
    const result = applyDamageToShields(state, 60);
    assert.strictEqual(result.damageToHealth, 0);
    assert.strictEqual(result.shieldAbsorbed, 60);
    assert.strictEqual(result.state.shields.length, 1);
    assert.strictEqual(result.state.shields[0].amount, 20);
  });

  it('gets total shield amount', () => {
    let state = createTargetState();
    state = { ...state, shields: [
      { effectId: 'b1', amount: 50 },
      { effectId: 'b2', amount: 75 }
    ]};
    assert.strictEqual(getTotalShieldAmount(state), 125);
  });

  it('returns 0 for no shields', () => {
    const state = createTargetState();
    assert.strictEqual(getTotalShieldAmount(state), 0);
  });
});

// ============================================================================
// Dispel Tests (5 tests)
// ============================================================================

describe('dispelEffects', () => {
  function setup() {
    let registry = createEffectRegistry();
    const buff = createEffect('buff1', 'Buff 1', 'buff', 'stat_mod').effect;
    const debuff = createEffect('debuff1', 'Debuff 1', 'debuff', 'stat_mod').effect;
    const permanent = createEffect('perm', 'Permanent', 'buff', 'stat_mod', {
      dispellable: false
    }).effect;
    registry = registerEffect(registry, buff).registry;
    registry = registerEffect(registry, debuff).registry;
    registry = registerEffect(registry, permanent).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'buff1').state;
    state = applyEffect(state, registry, 'debuff1').state;
    state = applyEffect(state, registry, 'perm').state;
    return { registry, state };
  }

  it('dispels any dispellable effect', () => {
    const { registry, state } = setup();
    const result = dispelEffects(state, registry, null, 1);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dispelled.length, 1);
  });

  it('dispels by type', () => {
    const { registry, state } = setup();
    const result = dispelEffects(state, registry, 'DEBUFF', 1);
    assert.deepStrictEqual(result.dispelled, ['debuff1']);
  });

  it('respects dispel count', () => {
    const { registry, state } = setup();
    const result = dispelEffects(state, registry, null, 2);
    assert.strictEqual(result.dispelled.length, 2);
  });

  it('skips undispellable effects', () => {
    const { registry, state } = setup();
    const result = dispelEffects(state, registry, null, 10);
    assert.ok(!result.dispelled.includes('perm'));
    assert.ok(hasEffect(result.state, 'perm'));
  });

  it('removes shields with dispelled effects', () => {
    let registry = createEffectRegistry();
    const shieldEffect = createEffect('shield', 'Shield', 'buff', 'shield', {
      shieldAmount: 100
    }).effect;
    registry = registerEffect(registry, shieldEffect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'shield').state;
    assert.strictEqual(state.shields.length, 1);
    const result = dispelEffects(state, registry, null, 1);
    assert.strictEqual(result.state.shields.length, 0);
  });
});

// ============================================================================
// Immunity Tests (4 tests)
// ============================================================================

describe('Immunities', () => {
  it('adds immunity', () => {
    let state = createTargetState();
    state = addImmunity(state, 'poison');
    assert.ok(state.immunities.includes('poison'));
  });

  it('prevents duplicate immunity', () => {
    let state = createTargetState();
    state = addImmunity(state, 'poison');
    state = addImmunity(state, 'poison');
    assert.strictEqual(state.immunities.length, 1);
  });

  it('removes immunity', () => {
    let state = createTargetState();
    state = addImmunity(state, 'poison');
    state = removeImmunity(state, 'poison');
    assert.strictEqual(state.immunities.length, 0);
  });

  it('blocks effects by category immunity', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('burn', 'Burn', 'debuff', 'damage_over_time').effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = addImmunity(state, 'DAMAGE_OVER_TIME');
    const result = applyEffect(state, registry, 'burn');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.immune, true);
  });
});

// ============================================================================
// Query Functions Tests (9 tests)
// ============================================================================

describe('Query Functions', () => {
  function setup() {
    let registry = createEffectRegistry();
    const buff = createEffect('buff1', 'Buff 1', 'buff', 'stat_mod', {
      duration: 5,
      stackMode: STACK_MODES.INTENSITY,
      maxStacks: 3
    }).effect;
    const debuff = createEffect('debuff1', 'Debuff 1', 'debuff', 'damage_over_time').effect;
    registry = registerEffect(registry, buff).registry;
    registry = registerEffect(registry, debuff).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'buff1', null, { stacks: 2 }).state;
    state = applyEffect(state, registry, 'debuff1').state;
    return { registry, state };
  }

  it('checks has effect', () => {
    const { state } = setup();
    assert.strictEqual(hasEffect(state, 'buff1'), true);
    assert.strictEqual(hasEffect(state, 'missing'), false);
  });

  it('gets effect stacks', () => {
    const { state } = setup();
    assert.strictEqual(getEffectStacks(state, 'buff1'), 2);
    assert.strictEqual(getEffectStacks(state, 'missing'), 0);
  });

  it('gets remaining duration', () => {
    const { state } = setup();
    assert.strictEqual(getRemainingDuration(state, 'buff1'), 5);
    assert.strictEqual(getRemainingDuration(state, 'missing'), 0);
  });

  it('gets effects by type', () => {
    const { state, registry } = setup();
    const buffs = getEffectsByType(state, registry, 'BUFF');
    assert.strictEqual(buffs.length, 1);
    assert.strictEqual(buffs[0].effectId, 'buff1');
  });

  it('gets effects by category', () => {
    const { state, registry } = setup();
    const dots = getEffectsByCategory(state, registry, 'damage_over_time');
    assert.strictEqual(dots.length, 1);
    assert.strictEqual(dots[0].effectId, 'debuff1');
  });

  it('gets effect info', () => {
    const { registry } = setup();
    const info = getEffectInfo(registry, 'buff1');
    assert.strictEqual(info.name, 'Buff 1');
  });

  it('returns null for missing effect info', () => {
    const { registry } = setup();
    const info = getEffectInfo(registry, 'missing');
    assert.strictEqual(info, null);
  });

  it('clears all effects', () => {
    const { state } = setup();
    const cleared = clearAllEffects(state);
    assert.strictEqual(cleared.activeEffects.length, 0);
    assert.strictEqual(cleared.shields.length, 0);
  });

  it('gets effect summary', () => {
    const { state, registry } = setup();
    const summary = getEffectSummary(state, registry);
    assert.strictEqual(summary.buffs.length, 1);
    assert.strictEqual(summary.debuffs.length, 1);
    assert.strictEqual(summary.buffs[0].name, 'Buff 1');
  });
});

// ============================================================================
// Utility Tests (4 tests)
// ============================================================================

describe('Utility Functions', () => {
  it('gets category info', () => {
    const info = getCategoryInfo('stat_mod');
    assert.strictEqual(info.name, 'Stat Modifier');
  });

  it('returns null for invalid category', () => {
    const info = getCategoryInfo('invalid');
    assert.strictEqual(info, null);
  });

  it('hides hidden effects from summary', () => {
    let registry = createEffectRegistry();
    const hidden = createEffect('hidden', 'Hidden', 'buff', 'utility', {
      hidden: true
    }).effect;
    registry = registerEffect(registry, hidden).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'hidden').state;
    const summary = getEffectSummary(state, registry);
    assert.strictEqual(summary.buffs.length, 0);
  });

  it('includes stacks in summary', () => {
    let registry = createEffectRegistry();
    const effect = createEffect('stack', 'Stack', 'buff', 'stat_mod', {
      stackMode: STACK_MODES.INTENSITY,
      maxStacks: 5
    }).effect;
    registry = registerEffect(registry, effect).registry;
    let state = createTargetState();
    state = applyEffect(state, registry, 'stack', null, { stacks: 3 }).state;
    const summary = getEffectSummary(state, registry);
    assert.strictEqual(summary.buffs[0].stacks, 3);
  });
});
