/**
 * Enemy Intent System Tests — AI Village RPG
 * Tests pure logic functions that don't require external module dependencies.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import the module — it relies on boss-telegraph and enemy-abilities,
// so we test the data structures and pure logic directly.
import {
  INTENT_TYPES,
  CONFIDENCE,
  INTENT_ICONS,
  BEHAVIOR_PATTERNS,
  classifyIntent,
  getPatternIntent,
  calculateConfidence,
  estimateDamage,
  getIntentDescription,
  initIntentState,
  toggleForecast,
} from '../src/enemy-intent.js';

// ── Tests ────────────────────────────────────────────────────────────

describe('INTENT_TYPES', () => {
  it('should define all expected intent types', () => {
    assert.equal(INTENT_TYPES.ATTACK, 'attack');
    assert.equal(INTENT_TYPES.HEAVY_ATTACK, 'heavy_attack');
    assert.equal(INTENT_TYPES.DEFEND, 'defend');
    assert.equal(INTENT_TYPES.BUFF, 'buff');
    assert.equal(INTENT_TYPES.DEBUFF, 'debuff');
    assert.equal(INTENT_TYPES.HEAL, 'heal');
    assert.equal(INTENT_TYPES.MULTI_HIT, 'multi_hit');
    assert.equal(INTENT_TYPES.CHARGE, 'charge');
    assert.equal(INTENT_TYPES.UNKNOWN, 'unknown');
  });

  it('should have 9 distinct types', () => {
    const types = Object.values(INTENT_TYPES);
    assert.equal(types.length, 10);
    assert.equal(new Set(types).size, 10);
  });
});

describe('CONFIDENCE', () => {
  it('should define three levels', () => {
    assert.equal(CONFIDENCE.CERTAIN, 'certain');
    assert.equal(CONFIDENCE.LIKELY, 'likely');
    assert.equal(CONFIDENCE.POSSIBLE, 'possible');
  });
});

describe('INTENT_ICONS', () => {
  it('should have an icon for every intent type', () => {
    for (const type of Object.values(INTENT_TYPES)) {
      assert.ok(INTENT_ICONS[type], `Missing icon for intent type: ${type}`);
    }
  });

  it('should use emoji strings', () => {
    for (const icon of Object.values(INTENT_ICONS)) {
      assert.ok(typeof icon === 'string' && icon.length > 0);
    }
  });
});

describe('BEHAVIOR_PATTERNS', () => {
  it('should define patterns for all behavior types', () => {
    const expectedBehaviors = ['basic', 'aggressive', 'caster', 'support', 'boss', 'charger'];
    for (const behavior of expectedBehaviors) {
      assert.ok(BEHAVIOR_PATTERNS[behavior], `Missing pattern for behavior: ${behavior}`);
      assert.ok(Array.isArray(BEHAVIOR_PATTERNS[behavior].cycle), `${behavior} should have a cycle array`);
      assert.ok(BEHAVIOR_PATTERNS[behavior].cycle.length >= 3, `${behavior} cycle should have at least 3 entries`);
      assert.ok(typeof BEHAVIOR_PATTERNS[behavior].deviation === 'number', `${behavior} should have deviation`);
      assert.ok(BEHAVIOR_PATTERNS[behavior].deviation >= 0 && BEHAVIOR_PATTERNS[behavior].deviation <= 1,
        `${behavior} deviation should be between 0 and 1`);
    }
  });

  it('all cycle entries should be valid intent types', () => {
    const validTypes = new Set(Object.values(INTENT_TYPES));
    for (const [name, pattern] of Object.entries(BEHAVIOR_PATTERNS)) {
      for (const entry of pattern.cycle) {
        assert.ok(validTypes.has(entry), `Invalid cycle entry '${entry}' in ${name}`);
      }
    }
  });

  it('charger pattern should charge before heavy attack', () => {
    const cycle = BEHAVIOR_PATTERNS.charger.cycle;
    const chargeIdx = cycle.indexOf(INTENT_TYPES.CHARGE);
    assert.ok(chargeIdx >= 0, 'charger should have CHARGE');
    // Find the heavy attack index after the first charge
    const heavyIdx = cycle.indexOf(INTENT_TYPES.HEAVY_ATTACK, chargeIdx);
    assert.ok(heavyIdx > chargeIdx, 'HEAVY_ATTACK should come after CHARGE');
  });

  it('charger should have low deviation (predictable)', () => {
    assert.ok(BEHAVIOR_PATTERNS.charger.deviation <= 0.15);
  });
});

describe('classifyIntent', () => {
  it('should classify defend action', () => {
    assert.equal(classifyIntent('defend', null), INTENT_TYPES.DEFEND);
  });

  it('should classify basic attack', () => {
    assert.equal(classifyIntent('attack', null), INTENT_TYPES.ATTACK);
  });

  it('should return UNKNOWN for ability with null abilityId', () => {
    assert.equal(classifyIntent('ability', null), INTENT_TYPES.UNKNOWN);
  });

  it('should return ABILITY for unknown ability id', () => {
    assert.equal(classifyIntent('ability', 'nonexistent_xyz'), INTENT_TYPES.ABILITY);
  });

  it('should return UNKNOWN for unknown action type', () => {
    assert.equal(classifyIntent('flee', null), INTENT_TYPES.UNKNOWN);
    assert.equal(classifyIntent('', null), INTENT_TYPES.UNKNOWN);
    assert.equal(classifyIntent(null, null), INTENT_TYPES.UNKNOWN);
  });
});

describe('getPatternIntent', () => {
  it('should return pattern-based intent for basic enemy', () => {
    const enemy = { aiBehavior: 'basic' };
    const cycle = BEHAVIOR_PATTERNS.basic.cycle;
    assert.equal(getPatternIntent(enemy, 0), cycle[0]);
    assert.equal(getPatternIntent(enemy, 1), cycle[1]);
    assert.equal(getPatternIntent(enemy, 2), cycle[2]);
  });

  it('should cycle for turns beyond cycle length', () => {
    const enemy = { aiBehavior: 'basic' };
    const cycle = BEHAVIOR_PATTERNS.basic.cycle;
    assert.equal(getPatternIntent(enemy, cycle.length), cycle[0]);
    assert.equal(getPatternIntent(enemy, cycle.length + 1), cycle[1]);
  });

  it('should default to basic for unknown behavior', () => {
    const enemy = { aiBehavior: 'nonexistent' };
    assert.equal(getPatternIntent(enemy, 0), BEHAVIOR_PATTERNS.basic.cycle[0]);
  });

  it('should default to basic for null enemy', () => {
    assert.equal(getPatternIntent(null, 0), BEHAVIOR_PATTERNS.basic.cycle[0]);
  });

  it('should handle charger behavior', () => {
    const enemy = { aiBehavior: 'charger' };
    const cycle = BEHAVIOR_PATTERNS.charger.cycle;
    for (let i = 0; i < cycle.length; i++) {
      assert.equal(getPatternIntent(enemy, i), cycle[i]);
    }
  });
});

describe('calculateConfidence', () => {
  it('should return CERTAIN for low-deviation pattern match', () => {
    const enemy = { aiBehavior: 'charger', hp: 100, maxHp: 100 };
    const patternIntent = BEHAVIOR_PATTERNS.charger.cycle[0]; // CHARGE
    const result = calculateConfidence(enemy, 0, patternIntent);
    assert.equal(result, CONFIDENCE.CERTAIN);
  });

  it('should return LIKELY for heal at low HP (non-matching pattern)', () => {
    const enemy = { aiBehavior: 'basic', hp: 10, maxHp: 100 };
    const result = calculateConfidence(enemy, 0, INTENT_TYPES.HEAL);
    assert.equal(result, CONFIDENCE.LIKELY);
  });

  it('should return LIKELY for defend at low HP', () => {
    const enemy = { aiBehavior: 'basic', hp: 25, maxHp: 100 };
    const result = calculateConfidence(enemy, 0, INTENT_TYPES.DEFEND);
    assert.equal(result, CONFIDENCE.LIKELY);
  });

  it('should return POSSIBLE for non-matching intent at full HP', () => {
    const enemy = { aiBehavior: 'basic', hp: 100, maxHp: 100 };
    const result = calculateConfidence(enemy, 0, INTENT_TYPES.BUFF);
    assert.equal(result, CONFIDENCE.POSSIBLE);
  });
});

describe('estimateDamage', () => {
  it('should return null for non-damage intents', () => {
    const enemy = { atk: 20 };
    assert.equal(estimateDamage(enemy, INTENT_TYPES.DEFEND, null), null);
    assert.equal(estimateDamage(enemy, INTENT_TYPES.BUFF, null), null);
    assert.equal(estimateDamage(enemy, INTENT_TYPES.HEAL, null), null);
    assert.equal(estimateDamage(enemy, INTENT_TYPES.CHARGE, null), null);
  });

  it('should estimate basic attack damage', () => {
    const enemy = { atk: 20 };
    const dmg = estimateDamage(enemy, INTENT_TYPES.ATTACK, null);
    assert.equal(dmg.min, 16); // floor(20 * 0.8)
    assert.equal(dmg.max, 24); // floor(20 * 1.2)
  });

  it('should estimate heavy attack damage (higher range)', () => {
    const enemy = { atk: 20 };
    const dmg = estimateDamage(enemy, INTENT_TYPES.HEAVY_ATTACK, null);
    assert.equal(dmg.min, 26); // floor(20 * 1.3)
    assert.equal(dmg.max, 36); // floor(20 * 1.8)
  });

  it('should handle 0 atk', () => {
    const enemy = { atk: 0 };
    const dmg = estimateDamage(enemy, INTENT_TYPES.ATTACK, null);
    assert.equal(dmg.min, 0);
    assert.equal(dmg.max, 0);
  });

  it('should handle missing atk', () => {
    const enemy = {};
    const dmg = estimateDamage(enemy, INTENT_TYPES.ATTACK, null);
    assert.equal(dmg.min, 0);
    assert.equal(dmg.max, 0);
  });

  it('should estimate unknown ability damage from atk', () => {
    const enemy = { atk: 30 };
    const dmg = estimateDamage(enemy, INTENT_TYPES.ABILITY, 'nonexistent');
    assert.ok(dmg.min > 0);
    assert.ok(dmg.max > dmg.min);
  });
});

describe('getIntentDescription', () => {
  it('should describe attack with damage range', () => {
    const desc = getIntentDescription(INTENT_TYPES.ATTACK, { min: 16, max: 24 }, null);
    assert.ok(desc.includes('16'));
    assert.ok(desc.includes('24'));
  });

  it('should describe attack without damage', () => {
    const desc = getIntentDescription(INTENT_TYPES.ATTACK, null, null);
    assert.ok(desc.toLowerCase().includes('attack'));
  });

  it('should describe defend', () => {
    const desc = getIntentDescription(INTENT_TYPES.DEFEND, null, null);
    assert.ok(desc.toLowerCase().includes('defense') || desc.toLowerCase().includes('defending'));
  });

  it('should describe charge', () => {
    const desc = getIntentDescription(INTENT_TYPES.CHARGE, null, null);
    assert.ok(desc.toLowerCase().includes('power') || desc.toLowerCase().includes('gathering'));
  });

  it('should describe unknown intent', () => {
    const desc = getIntentDescription(INTENT_TYPES.UNKNOWN, null, null);
    assert.ok(desc.includes('unclear'));
  });

  it('should describe multi-hit with hits count', () => {
    const desc = getIntentDescription(INTENT_TYPES.MULTI_HIT, { min: 30, max: 60, hits: 3 }, null);
    assert.ok(desc.includes('3'));
  });
});

describe('initIntentState', () => {
  it('should return clean initial state', () => {
    const state = initIntentState();
    assert.equal(state.currentIntent, null);
    assert.deepStrictEqual(state.forecast, []);
    assert.deepStrictEqual(state.history, []);
    assert.equal(state.showForecast, false);
    assert.equal(state.turnNumber, 0);
  });
});

describe('toggleForecast', () => {
  it('should toggle showForecast from false to true', () => {
    const state = initIntentState();
    const toggled = toggleForecast(state);
    assert.equal(toggled.showForecast, true);
  });

  it('should toggle showForecast from true to false', () => {
    const state = { ...initIntentState(), showForecast: true };
    const toggled = toggleForecast(state);
    assert.equal(toggled.showForecast, false);
  });

  it('should handle null input', () => {
    const toggled = toggleForecast(null);
    assert.equal(toggled.showForecast, true);
  });

  it('should preserve other state fields', () => {
    const state = { ...initIntentState(), turnNumber: 5, history: [{ type: 'attack' }] };
    const toggled = toggleForecast(state);
    assert.equal(toggled.turnNumber, 5);
    assert.equal(toggled.history.length, 1);
  });
});
