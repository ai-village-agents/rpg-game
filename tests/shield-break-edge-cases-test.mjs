// Shield/Break System Edge Case Tests
// Created by Claude Opus 4.5 (Day 343, #voted-out)
// Tests edge cases for multi-enemy, boss phases, and status effect interactions

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import {
  checkWeakness,
  applyShieldDamage,
  processBreakState,
  getWeaknessIcons,
  getEnemyShieldData,
  initializeEnemyShields,
  BREAK_DURATION,
  BREAK_DAMAGE_MULTIPLIER,
  ELEMENT_ICONS,
  ENEMY_SHIELD_DATABASE,
} from '../src/shield-break.js';

// ============================================================
// EDGE CASE 1: Break State Timing Across Multiple Turns
// ============================================================

describe('Shield/Break - Break State Timing', () => {
  it('should decrement breakTurnsRemaining each turn while broken', () => {
    const enemy = {
      isBroken: true,
      breakTurnsRemaining: 2,
      maxShields: 3,
    };

    // First turn processing
    const turn1 = processBreakState(enemy);
    assert.strictEqual(turn1.stillBroken, true, 'Should still be broken after 1st turn');
    assert.strictEqual(turn1.turnsRemaining, 1, 'Should have 1 turn remaining');
    assert.strictEqual(turn1.recoveredThisTurn, false, 'Should not recover on 1st turn');

    // Update enemy state for second turn
    const enemyTurn2 = {
      ...enemy,
      breakTurnsRemaining: turn1.turnsRemaining,
    };

    // Second turn processing
    const turn2 = processBreakState(enemyTurn2);
    assert.strictEqual(turn2.stillBroken, false, 'Should recover after 2nd turn');
    assert.strictEqual(turn2.recoveredThisTurn, true, 'Should recover this turn');
    assert.strictEqual(turn2.restoredShields, 3, 'Should restore shields to maxShields');
  });

  it('should handle breakTurnsRemaining = 0 gracefully', () => {
    const enemy = {
      isBroken: true,
      breakTurnsRemaining: 0,
      maxShields: 2,
    };

    const result = processBreakState(enemy);
    // With 0 turns remaining, should recover immediately
    assert.strictEqual(result.stillBroken, false);
    assert.strictEqual(result.recoveredThisTurn, true);
  });

  it('should return no change for non-broken enemy', () => {
    const enemy = {
      isBroken: false,
      breakTurnsRemaining: 0,
      maxShields: 3,
    };

    const result = processBreakState(enemy);
    assert.strictEqual(result.stillBroken, false);
    assert.strictEqual(result.recoveredThisTurn, false);
  });

  it('should handle null/undefined enemy gracefully', () => {
    const resultNull = processBreakState(null);
    assert.strictEqual(resultNull.stillBroken, false);
    assert.strictEqual(resultNull.recoveredThisTurn, false);

    const resultUndefined = processBreakState(undefined);
    assert.strictEqual(resultUndefined.stillBroken, false);
    assert.strictEqual(resultUndefined.recoveredThisTurn, false);
  });
});

// ============================================================
// EDGE CASE 2: Shield Refresh on Boss Phase Transitions
// ============================================================

describe('Shield/Break - Boss Phase Shield Refresh', () => {
  it('should support full shield refresh for boss phase transitions', () => {
    // Boss starts with 8 shields
    const bossId = 'dragon';
    const bossShields = initializeEnemyShields(bossId, 4);
    
    assert.strictEqual(bossShields.shieldCount, 8, 'Dragon should have 8 shields');
    assert.strictEqual(bossShields.maxShields, 8, 'maxShields should also be 8');

    // Simulate shields being broken during phase 1
    const bossAfterBreak = {
      ...bossShields,
      currentShields: 0,
      isBroken: true,
      breakTurnsRemaining: 0,
    };

    // Boss transitions to phase 2 - should be able to reset shields
    // This simulates what a boss phase transition would do
    const bossPhase2 = {
      ...bossAfterBreak,
      currentShields: Math.floor(bossAfterBreak.maxShields * 0.5), // 50% shield refresh
      isBroken: false,
      breakTurnsRemaining: 0,
    };

    assert.strictEqual(bossPhase2.currentShields, 4, 'Boss should have 50% shields in phase 2');
    assert.strictEqual(bossPhase2.isBroken, false, 'Boss should not be broken after phase transition');
  });

  it('should enforce minimum shield count for tier 4 bosses', () => {
    // Test with a low-shield enemy but tier 4
    const weakEnemyId = 'slime';
    const normalShields = initializeEnemyShields(weakEnemyId);
    const bossShields = initializeEnemyShields(weakEnemyId, 4);

    assert.strictEqual(normalShields.shieldCount, 2, 'Normal slime has 2 shields');
    assert.strictEqual(bossShields.shieldCount, 8, 'Tier 4 slime boss has minimum 8 shields');
  });

  it('should preserve weaknesses and immunities across phase transitions', () => {
    const dragonShields = initializeEnemyShields('dragon', 4);
    
    assert.ok(dragonShields.weaknesses.includes('ice'), 'Dragon should be weak to ice');
    assert.ok(dragonShields.weaknesses.includes('holy'), 'Dragon should be weak to holy');
    assert.ok(dragonShields.immunities.includes('fire'), 'Dragon should be immune to fire');
  });
});

// ============================================================
// EDGE CASE 3: Status Effect Interactions with Break State
// ============================================================

describe('Shield/Break - Status Effect Interactions', () => {
  it('should not prevent shield damage while enemy has status effects', () => {
    const enemy = {
      currentShields: 3,
      maxShields: 3,
      isBroken: false,
      statusEffects: [{ type: 'poison', duration: 2, power: 5 }],
    };

    // Enemy with poison should still take shield damage
    const result = applyShieldDamage(enemy, 1);
    assert.strictEqual(result.shieldsRemaining, 2, 'Shield damage should apply despite poison');
    assert.strictEqual(result.triggeredBreak, false, 'Should not trigger break yet');
  });

  it('should allow breaking while enemy is stunned', () => {
    const enemy = {
      currentShields: 1,
      maxShields: 3,
      isBroken: false,
      statusEffects: [{ type: 'stun', duration: 1 }],
    };

    const result = applyShieldDamage(enemy, 1);
    assert.strictEqual(result.shieldsRemaining, 0, 'Should deplete shields');
    assert.strictEqual(result.triggeredBreak, true, 'Should trigger break even while stunned');
  });

  it('should process break state independently of status effects', () => {
    const enemy = {
      isBroken: true,
      breakTurnsRemaining: 1,
      maxShields: 3,
      statusEffects: [
        { type: 'burn', duration: 3, power: 10 },
        { type: 'def-down', duration: 2 },
      ],
    };

    // Break recovery should happen regardless of status effects
    const result = processBreakState(enemy);
    assert.strictEqual(result.recoveredThisTurn, true, 'Should recover from break');
    assert.strictEqual(result.restoredShields, 3, 'Should restore shields');
  });

  it('should handle combined stun + break state correctly', () => {
    // Scenario: Enemy is both stunned AND broken
    // Break should still tick down, but enemy can't act due to stun
    const enemy = {
      isBroken: true,
      breakTurnsRemaining: 2,
      maxShields: 4,
      statusEffects: [{ type: 'stun', duration: 1 }],
    };

    const breakResult = processBreakState(enemy);
    
    // Break ticks even during stun
    assert.strictEqual(breakResult.stillBroken, true);
    assert.strictEqual(breakResult.turnsRemaining, 1);
    
    // Note: The actual combat logic would handle stun preventing action
    // This test just verifies break state processes independently
  });
});

// ============================================================
// EDGE CASE 4: Shield Damage Edge Cases
// ============================================================

describe('Shield/Break - Shield Damage Edge Cases', () => {
  it('should not deal shield damage when enemy is already broken', () => {
    const enemy = {
      currentShields: 0,
      maxShields: 3,
      isBroken: true,
      breakTurnsRemaining: 2,
    };

    const result = applyShieldDamage(enemy, 2);
    assert.strictEqual(result.shieldsRemaining, 0, 'Shields should remain at 0');
    assert.strictEqual(result.triggeredBreak, false, 'Should not re-trigger break');
  });

  it('should handle negative or zero shield damage', () => {
    const enemy = {
      currentShields: 3,
      maxShields: 3,
      isBroken: false,
    };

    const resultZero = applyShieldDamage(enemy, 0);
    assert.strictEqual(resultZero.shieldsRemaining, 3, 'Zero damage should not affect shields');
    assert.strictEqual(resultZero.triggeredBreak, false);

    const resultNegative = applyShieldDamage(enemy, -5);
    assert.strictEqual(resultNegative.shieldsRemaining, 3, 'Negative damage should not affect shields');
    assert.strictEqual(resultNegative.triggeredBreak, false);
  });

  it('should handle overkill shield damage', () => {
    const enemy = {
      currentShields: 2,
      maxShields: 2,
      isBroken: false,
    };

    // Deal more shield damage than shields remaining
    const result = applyShieldDamage(enemy, 10);
    assert.strictEqual(result.shieldsRemaining, 0, 'Shields should clamp to 0');
    assert.strictEqual(result.triggeredBreak, true, 'Should trigger break');
  });

  it('should handle non-integer shield damage', () => {
    const enemy = {
      currentShields: 3,
      maxShields: 3,
      isBroken: false,
    };

    // Non-integer damage should be treated as 0
    const resultFloat = applyShieldDamage(enemy, 1.5);
    assert.strictEqual(resultFloat.shieldsRemaining, 3, 'Float damage should be treated as 0');

    const resultString = applyShieldDamage(enemy, '2');
    assert.strictEqual(resultString.shieldsRemaining, 3, 'String damage should be treated as 0');
  });
});

// ============================================================
// EDGE CASE 5: Weakness Checking Edge Cases
// ============================================================

describe('Shield/Break - Weakness Checking Edge Cases', () => {
  it('should handle case-insensitive element matching', () => {
    const weaknesses = ['fire', 'ice'];
    
    assert.strictEqual(checkWeakness('FIRE', weaknesses), true, 'Uppercase should match');
    assert.strictEqual(checkWeakness('Fire', weaknesses), true, 'Mixed case should match');
    assert.strictEqual(checkWeakness('  fire  ', weaknesses), true, 'Whitespace should be trimmed');
  });

  it('should handle empty or malformed weaknesses array', () => {
    assert.strictEqual(checkWeakness('fire', []), false, 'Empty array returns false');
    assert.strictEqual(checkWeakness('fire', null), false, 'Null array returns false');
    assert.strictEqual(checkWeakness('fire', undefined), false, 'Undefined array returns false');
    assert.strictEqual(checkWeakness('fire', 'not an array'), false, 'Non-array returns false');
  });

  it('should handle empty or malformed element', () => {
    const weaknesses = ['fire', 'ice'];
    
    assert.strictEqual(checkWeakness('', weaknesses), false, 'Empty string returns false');
    assert.strictEqual(checkWeakness(null, weaknesses), false, 'Null element returns false');
    assert.strictEqual(checkWeakness(undefined, weaknesses), false, 'Undefined element returns false');
    assert.strictEqual(checkWeakness(123, weaknesses), false, 'Number element returns false');
  });

  it('should not match partial element names', () => {
    const weaknesses = ['fire', 'lightning'];
    
    assert.strictEqual(checkWeakness('fir', weaknesses), false, 'Partial match should fail');
    assert.strictEqual(checkWeakness('light', weaknesses), false, 'Partial match should fail');
    assert.strictEqual(checkWeakness('firefire', weaknesses), false, 'Extended match should fail');
  });
});

// ============================================================
// EDGE CASE 6: Enemy Shield Data Retrieval
// ============================================================

describe('Shield/Break - Enemy Shield Data Retrieval', () => {
  it('should return default shields for unknown enemy', () => {
    const data = getEnemyShieldData('totally_unknown_enemy_xyz');
    
    assert.strictEqual(data.shieldCount, 2, 'Unknown enemy gets default 2 shields');
    assert.deepStrictEqual(data.weaknesses, [], 'Unknown enemy has no weaknesses');
    assert.deepStrictEqual(data.immunities, [], 'Unknown enemy has no immunities');
    assert.deepStrictEqual(data.absorbs, [], 'Unknown enemy has no absorbs');
    assert.strictEqual(data.breakImmune, false, 'Unknown enemy is not break immune');
  });

  it('should handle enemy with alias (giant_spider vs giant-spider)', () => {
    const underscoreData = getEnemyShieldData('giant_spider');
    const dashData = getEnemyShieldData('giant-spider');
    
    assert.strictEqual(underscoreData.shieldCount, dashData.shieldCount, 'Both aliases should have same shields');
    assert.deepStrictEqual(underscoreData.weaknesses, dashData.weaknesses, 'Both aliases should have same weaknesses');
  });

  it('should handle break-immune enemies correctly', () => {
    const dummyData = getEnemyShieldData('training_dummy');
    
    assert.strictEqual(dummyData.breakImmune, true, 'Training dummy should be break immune');
    assert.ok(dummyData.weaknesses.length > 0, 'Training dummy should have weaknesses for testing');
  });

  it('should handle null/undefined enemy ID', () => {
    const nullData = getEnemyShieldData(null);
    const undefinedData = getEnemyShieldData(undefined);
    
    assert.strictEqual(nullData.shieldCount, 2, 'Null ID gets default shields');
    assert.strictEqual(undefinedData.shieldCount, 2, 'Undefined ID gets default shields');
  });
});

// ============================================================
// EDGE CASE 7: Weakness Icons Display
// ============================================================

describe('Shield/Break - Weakness Icons', () => {
  it('should return correct icons for valid weaknesses', () => {
    const icons = getWeaknessIcons(['fire', 'ice', 'lightning']);
    
    assert.ok(icons.includes('🔥'), 'Should include fire icon');
    assert.ok(icons.includes('❄️'), 'Should include ice icon');
    assert.ok(icons.includes('⚡'), 'Should include lightning icon');
  });

  it('should skip invalid/unknown elements', () => {
    const icons = getWeaknessIcons(['fire', 'invalid_element', 'ice']);
    
    assert.ok(icons.includes('🔥'), 'Should include fire icon');
    assert.ok(icons.includes('❄️'), 'Should include ice icon');
    assert.ok(!icons.includes('undefined'), 'Should not include undefined');
  });

  it('should return empty string for empty array', () => {
    assert.strictEqual(getWeaknessIcons([]), '', 'Empty array returns empty string');
    assert.strictEqual(getWeaknessIcons(null), '', 'Null returns empty string');
    assert.strictEqual(getWeaknessIcons(undefined), '', 'Undefined returns empty string');
  });

  it('should handle all valid elements', () => {
    const allElements = ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'];
    const icons = getWeaknessIcons(allElements);
    
    assert.ok(icons.includes('⚔️'), 'Should include physical icon');
    assert.ok(icons.includes('🔥'), 'Should include fire icon');
    assert.ok(icons.includes('❄️'), 'Should include ice icon');
    assert.ok(icons.includes('⚡'), 'Should include lightning icon');
    assert.ok(icons.includes('🌑'), 'Should include shadow icon');
    assert.ok(icons.includes('🌿'), 'Should include nature icon');
    assert.ok(icons.includes('✨'), 'Should include holy icon');
  });
});

// ============================================================
// EDGE CASE 8: Constants Validation
// ============================================================

describe('Shield/Break - Constants Validation', () => {
  it('should have correct BREAK_DURATION', () => {
    assert.strictEqual(BREAK_DURATION, 2, 'Break duration should be 2 turns');
  });

  it('should have correct BREAK_DAMAGE_MULTIPLIER', () => {
    assert.strictEqual(BREAK_DAMAGE_MULTIPLIER, 1.5, 'Break damage multiplier should be 1.5x');
  });

  it('should have all expected elements in ELEMENT_ICONS', () => {
    const expectedElements = ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'];
    
    for (const element of expectedElements) {
      assert.ok(ELEMENT_ICONS[element], `ELEMENT_ICONS should have ${element}`);
    }
  });

  it('should have valid data for all enemies in ENEMY_SHIELD_DATABASE', () => {
    for (const [enemyId, data] of Object.entries(ENEMY_SHIELD_DATABASE)) {
      assert.ok(typeof data.shieldCount === 'number', `${enemyId} should have numeric shieldCount`);
      assert.ok(data.shieldCount > 0, `${enemyId} should have positive shieldCount`);
      assert.ok(Array.isArray(data.weaknesses), `${enemyId} should have weaknesses array`);
    }
  });
});
