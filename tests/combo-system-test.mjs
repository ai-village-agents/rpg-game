import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createComboState,
  getComboMultiplier,
  getComboTier,
  getComboTierDisplay,
  registerHit,
  checkComboDecay,
  resetCombo,
  getChainBonus,
  isComboBreaker,
  COMBO_DECAY_TURNS,
  MAX_COMBO_MULTIPLIER,
  COMBO_THRESHOLDS,
} from '../src/combo-system.js';

test('createComboState', async (t) => {
  await t.test('returns correct initial values', () => {
    const state = createComboState();
    assert.equal(state.hitCount, 0);
    assert.equal(state.lastHitTurn, 0);
    assert.equal(state.isActive, false);
    assert.equal(state.chainMultiplier, 1.0);
    assert.equal(state.highestCombo, 0);
    assert.equal(state.totalComboDamage, 0);
    assert.equal(state.comboStreak, 0);
  });
});

test('getComboMultiplier', async (t) => {
  await t.test('returns 1.0 at 0 hits', () => {
    const state = { hitCount: 0 };
    assert.equal(getComboMultiplier(state), 1.0);
  });

  await t.test('returns 1.1 at 1 hit', () => {
    const state = { hitCount: 1 };
    assert.equal(getComboMultiplier(state), 1.1);
  });

  await t.test('returns 1.5 at 5 hits', () => {
    const state = { hitCount: 5 };
    assert.equal(getComboMultiplier(state), 1.5);
  });

  await t.test('caps at MAX_COMBO_MULTIPLIER', () => {
    const state = { hitCount: 40 };
    assert.equal(getComboMultiplier(state), MAX_COMBO_MULTIPLIER);
  });
});

test('getComboTier', async (t) => {
  await t.test('returns none at 0 hits', () => {
    assert.equal(getComboTier(0), 'none');
  });

  await t.test('returns warming-up at 2 hits', () => {
    assert.equal(getComboTier(COMBO_THRESHOLDS.WARMING_UP), 'warming-up');
  });

  await t.test('returns on-fire at 5 hits', () => {
    assert.equal(getComboTier(COMBO_THRESHOLDS.ON_FIRE), 'on-fire');
  });

  await t.test('returns unstoppable at 10 hits', () => {
    assert.equal(getComboTier(COMBO_THRESHOLDS.UNSTOPPABLE), 'unstoppable');
  });

  await t.test('returns legendary at 15 hits', () => {
    assert.equal(getComboTier(COMBO_THRESHOLDS.LEGENDARY), 'legendary');
  });
});

test('getComboTierDisplay', async (t) => {
  await t.test('returns display for none', () => {
    assert.deepEqual(getComboTierDisplay('none'), { label: '', color: '#888', icon: '' });
  });

  await t.test('returns display for warming-up', () => {
    assert.deepEqual(getComboTierDisplay('warming-up'), {
      label: 'Warming Up!',
      color: '#ffdd00',
      icon: '⚡',
    });
  });

  await t.test('returns display for on-fire', () => {
    assert.deepEqual(getComboTierDisplay('on-fire'), {
      label: 'On Fire!',
      color: '#ff8800',
      icon: '🔥',
    });
  });

  await t.test('returns display for unstoppable', () => {
    assert.deepEqual(getComboTierDisplay('unstoppable'), {
      label: 'UNSTOPPABLE!',
      color: '#ff4400',
      icon: '💥',
    });
  });

  await t.test('returns display for legendary', () => {
    assert.deepEqual(getComboTierDisplay('legendary'), {
      label: 'LEGENDARY!!!',
      color: '#ff00ff',
      icon: '✨',
    });
  });
});

test('registerHit', async (t) => {
  await t.test('increments hitCount and sets active', () => {
    const state = createComboState();
    const next = registerHit(state, 3, 12);
    assert.equal(next.hitCount, 1);
    assert.equal(next.isActive, true);
    assert.equal(next.lastHitTurn, 3);
  });

  await t.test('tracks highestCombo and total damage', () => {
    const state = createComboState();
    const first = registerHit(state, 1, 10);
    const second = registerHit(first, 2, 15);
    assert.equal(second.highestCombo, 2);
    assert.equal(second.totalComboDamage, 25);
  });
});

test('checkComboDecay', async (t) => {
  await t.test('resets after COMBO_DECAY_TURNS passes', () => {
    const state = registerHit(createComboState(), 1, 5);
    const decayed = checkComboDecay(state, 1 + COMBO_DECAY_TURNS + 1);
    assert.equal(decayed.hitCount, 0);
    assert.equal(decayed.isActive, false);
  });

  await t.test('does not reset within decay window', () => {
    const state = registerHit(createComboState(), 1, 5);
    const stillActive = checkComboDecay(state, 1 + COMBO_DECAY_TURNS);
    assert.equal(stillActive.hitCount, 1);
    assert.equal(stillActive.isActive, true);
  });
});

test('resetCombo', async (t) => {
  await t.test('resets state but preserves lifetime stats', () => {
    const state = registerHit(createComboState(), 2, 9);
    const reset = resetCombo(state);
    assert.equal(reset.hitCount, 0);
    assert.equal(reset.isActive, false);
    assert.equal(reset.highestCombo, 1);
    assert.equal(reset.totalComboDamage, 9);
  });
});

test('getChainBonus', async (t) => {
  await t.test('returns empty bonuses below thresholds', () => {
    assert.deepEqual(getChainBonus({ hitCount: 1 }), {
      bonusDamage: 0,
      healPercent: 0,
      mpRestore: 0,
      momentumBonus: 0,
    });
  });

  await t.test('returns on-fire bonuses', () => {
    assert.deepEqual(getChainBonus({ hitCount: COMBO_THRESHOLDS.ON_FIRE }), {
      bonusDamage: 0,
      healPercent: 0,
      mpRestore: 0,
      momentumBonus: 10,
    });
  });

  await t.test('returns unstoppable bonuses', () => {
    assert.deepEqual(getChainBonus({ hitCount: COMBO_THRESHOLDS.UNSTOPPABLE }), {
      bonusDamage: 20,
      healPercent: 0,
      mpRestore: 0,
      momentumBonus: 15,
    });
  });

  await t.test('returns legendary bonuses', () => {
    assert.deepEqual(getChainBonus({ hitCount: COMBO_THRESHOLDS.LEGENDARY }), {
      bonusDamage: 40,
      healPercent: 0.05,
      mpRestore: 0,
      momentumBonus: 20,
    });
  });
});

test('isComboBreaker', async (t) => {
  await t.test('identifies breaking actions', () => {
    assert.equal(isComboBreaker('DEFEND'), true);
    assert.equal(isComboBreaker('USE_ITEM'), true);
    assert.equal(isComboBreaker('FLEE'), true);
    assert.equal(isComboBreaker('ENEMY_ATTACK'), true);
  });

  await t.test('allows non-breaking actions', () => {
    assert.equal(isComboBreaker('ATTACK'), false);
    assert.equal(isComboBreaker('SKILL'), false);
  });
});

test('full combo sequence', async (t) => {
  await t.test('reaches legendary at 15 hits', () => {
    let state = createComboState();
    for (let i = 1; i <= 15; i += 1) {
      state = registerHit(state, i, 3);
    }
    assert.equal(state.hitCount, 15);
    assert.equal(getComboTier(state.hitCount), 'legendary');
    assert.equal(getComboMultiplier(state), MAX_COMBO_MULTIPLIER);
  });
});
