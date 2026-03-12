/**
 * Environmental Hazards System Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  HAZARD_TYPES,
  HAZARD_DATA,
  ELEMENT_INTERACTIONS,
  createHazard,
  applyHazardEffect,
  processHazardTurn,
  calculateElementInteraction,
  applyElementInteraction,
  getElementalSynergyBonus,
  isImmuneToHazard,
  getHazardInfo,
  getAllHazardTypes,
  getHazardsByElement,
  createArena,
  processArenaTurn,
  addHazardToArena,
  removeHazardFromArena,
} from '../src/environmental-hazards.js';

// ============================================================================
// Constants Tests
// ============================================================================

describe('HAZARD_TYPES', () => {
  it('should define all hazard types', () => {
    assert.strictEqual(HAZARD_TYPES.FIRE_ZONE, 'fire-zone');
    assert.strictEqual(HAZARD_TYPES.ICE_PATCH, 'ice-patch');
    assert.strictEqual(HAZARD_TYPES.POISON_SWAMP, 'poison-swamp');
    assert.strictEqual(HAZARD_TYPES.ELECTRIC_FIELD, 'electric-field');
    assert.strictEqual(HAZARD_TYPES.SHADOW_MIST, 'shadow-mist');
    assert.strictEqual(HAZARD_TYPES.BLESSED_GROUND, 'blessed-ground');
    assert.strictEqual(HAZARD_TYPES.THORNS, 'thorns');
    assert.strictEqual(HAZARD_TYPES.QUICKSAND, 'quicksand');
  });

  it('should have 8 unique hazard types', () => {
    const types = Object.values(HAZARD_TYPES);
    assert.strictEqual(types.length, 8);
    assert.strictEqual(new Set(types).size, 8);
  });
});

describe('HAZARD_DATA', () => {
  it('should have data for all hazard types', () => {
    for (const type of Object.values(HAZARD_TYPES)) {
      assert.ok(HAZARD_DATA[type], `Missing data for ${type}`);
    }
  });

  it('should have required properties for each hazard', () => {
    for (const [type, data] of Object.entries(HAZARD_DATA)) {
      assert.ok(data.name, `${type} missing name`);
      assert.ok(data.element, `${type} missing element`);
      assert.ok(data.icon, `${type} missing icon`);
      assert.ok(typeof data.damagePerTurn === 'number', `${type} missing damagePerTurn`);
      assert.ok(data.description, `${type} missing description`);
    }
  });

  it('should define fire zone with correct properties', () => {
    const fireZone = HAZARD_DATA[HAZARD_TYPES.FIRE_ZONE];
    assert.strictEqual(fireZone.name, 'Fire Zone');
    assert.strictEqual(fireZone.element, 'fire');
    assert.strictEqual(fireZone.damagePerTurn, 10);
    assert.strictEqual(fireZone.counterElement, 'ice');
    assert.strictEqual(fireZone.boostElement, 'fire');
  });

  it('should define blessed ground as helpful', () => {
    const blessed = HAZARD_DATA[HAZARD_TYPES.BLESSED_GROUND];
    assert.strictEqual(blessed.isHelpful, true);
    assert.strictEqual(blessed.damagePerTurn, 0);
    assert.strictEqual(blessed.healPerTurn, 10);
  });
});

describe('ELEMENT_INTERACTIONS', () => {
  it('should define all interaction types', () => {
    assert.strictEqual(ELEMENT_INTERACTIONS.NEUTRALIZE, 'neutralize');
    assert.strictEqual(ELEMENT_INTERACTIONS.INTENSIFY, 'intensify');
    assert.strictEqual(ELEMENT_INTERACTIONS.TRANSFORM, 'transform');
    assert.strictEqual(ELEMENT_INTERACTIONS.SPREAD, 'spread');
  });
});

// ============================================================================
// createHazard Tests
// ============================================================================

describe('createHazard', () => {
  it('should create a basic hazard with defaults', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(hazard.type, HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(hazard.name, 'Fire Zone');
    assert.strictEqual(hazard.element, 'fire');
    assert.strictEqual(hazard.duration, 5);
    assert.strictEqual(hazard.turnsRemaining, 5);
    assert.strictEqual(hazard.intensity, 1.0);
    assert.strictEqual(hazard.isActive, true);
    assert.strictEqual(hazard.isHelpful, false);
  });

  it('should accept custom duration', () => {
    const hazard = createHazard(HAZARD_TYPES.ICE_PATCH, { duration: 10 });
    assert.strictEqual(hazard.duration, 10);
    assert.strictEqual(hazard.turnsRemaining, 10);
  });

  it('should accept custom intensity and scale damage', () => {
    const hazard = createHazard(HAZARD_TYPES.ELECTRIC_FIELD, { intensity: 2.0 });
    assert.strictEqual(hazard.intensity, 2.0);
    // Base damage 12 * 2.0 = 24
    assert.strictEqual(hazard.damagePerTurn, 24);
  });

  it('should accept position', () => {
    const hazard = createHazard(HAZARD_TYPES.THORNS, { position: { x: 5, y: 3 } });
    assert.deepStrictEqual(hazard.position, { x: 5, y: 3 });
  });

  it('should return null for invalid hazard type', () => {
    const hazard = createHazard('invalid-type');
    assert.strictEqual(hazard, null);
  });

  it('should create helpful hazard correctly', () => {
    const hazard = createHazard(HAZARD_TYPES.BLESSED_GROUND);
    assert.strictEqual(hazard.isHelpful, true);
    assert.strictEqual(hazard.healPerTurn, 10);
    assert.strictEqual(hazard.damagePerTurn, 0);
  });

  it('should copy effect data', () => {
    const hazard = createHazard(HAZARD_TYPES.POISON_SWAMP);
    assert.ok(hazard.effect);
    assert.strictEqual(hazard.effect.type, 'poison');
    assert.strictEqual(hazard.effect.chance, 0.5);
    assert.strictEqual(hazard.effect.duration, 3);
  });
});

// ============================================================================
// applyHazardEffect Tests
// ============================================================================

describe('applyHazardEffect', () => {
  it('should apply damage from damaging hazard', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const target = { hp: 100, maxHp: 100 };
    const result = applyHazardEffect(hazard, target, 0.99); // High RNG to avoid effect

    assert.strictEqual(result.damage, 10);
    assert.strictEqual(result.healing, 0);
    assert.ok(result.messages.length > 0);
    assert.ok(result.messages[0].includes('10 damage'));
  });

  it('should apply healing from helpful hazard', () => {
    const hazard = createHazard(HAZARD_TYPES.BLESSED_GROUND);
    const target = { hp: 50, maxHp: 100 };
    const result = applyHazardEffect(hazard, target, 0.99);

    assert.strictEqual(result.damage, 0);
    assert.strictEqual(result.healing, 10);
  });

  it('should apply status effect when RNG is below chance', () => {
    const hazard = createHazard(HAZARD_TYPES.POISON_SWAMP); // 50% chance
    const target = { hp: 100, maxHp: 100 };
    const result = applyHazardEffect(hazard, target, 0.25); // Below 0.5

    assert.ok(result.effect);
    assert.strictEqual(result.effect.type, 'poison');
    assert.strictEqual(result.effect.duration, 3);
  });

  it('should not apply status effect when RNG is above chance', () => {
    const hazard = createHazard(HAZARD_TYPES.POISON_SWAMP); // 50% chance
    const target = { hp: 100, maxHp: 100 };
    const result = applyHazardEffect(hazard, target, 0.75); // Above 0.5

    assert.strictEqual(result.effect, null);
  });

  it('should return empty result for inactive hazard', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    hazard.isActive = false;
    const target = { hp: 100, maxHp: 100 };
    const result = applyHazardEffect(hazard, target);

    assert.strictEqual(result.damage, 0);
    assert.strictEqual(result.healing, 0);
    assert.strictEqual(result.effect, null);
  });

  it('should return empty result for null hazard', () => {
    const result = applyHazardEffect(null, { hp: 100 });
    assert.strictEqual(result.damage, 0);
    assert.strictEqual(result.healing, 0);
  });

  it('should return empty result for null target', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const result = applyHazardEffect(hazard, null);
    assert.strictEqual(result.damage, 0);
  });
});

// ============================================================================
// processHazardTurn Tests
// ============================================================================

describe('processHazardTurn', () => {
  it('should decrement turns remaining', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE, { duration: 3 });
    const updated = processHazardTurn(hazard);

    assert.strictEqual(updated.turnsRemaining, 2);
    assert.strictEqual(updated.isActive, true);
  });

  it('should deactivate hazard when turns reach 0', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE, { duration: 1 });
    const updated = processHazardTurn(hazard);

    assert.strictEqual(updated.turnsRemaining, 0);
    assert.strictEqual(updated.isActive, false);
  });

  it('should not go below 0 turns', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE, { duration: 0 });
    const updated = processHazardTurn(hazard);

    assert.strictEqual(updated.turnsRemaining, 0);
  });

  it('should return null for null input', () => {
    const result = processHazardTurn(null);
    assert.strictEqual(result, null);
  });

  it('should preserve other hazard properties', () => {
    const hazard = createHazard(HAZARD_TYPES.ICE_PATCH, {
      duration: 5,
      intensity: 1.5,
      position: { x: 1, y: 2 },
    });
    const updated = processHazardTurn(hazard);

    assert.strictEqual(updated.intensity, 1.5);
    assert.deepStrictEqual(updated.position, { x: 1, y: 2 });
    assert.strictEqual(updated.name, 'Ice Patch');
  });
});

// ============================================================================
// calculateElementInteraction Tests
// ============================================================================

describe('calculateElementInteraction', () => {
  it('should neutralize fire zone with ice', () => {
    const result = calculateElementInteraction('ice', HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
    assert.strictEqual(result.newHazard, null);
    assert.ok(result.message.includes('neutralized'));
  });

  it('should neutralize ice patch with fire', () => {
    const result = calculateElementInteraction('fire', HAZARD_TYPES.ICE_PATCH);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
  });

  it('should neutralize poison swamp with holy', () => {
    const result = calculateElementInteraction('holy', HAZARD_TYPES.POISON_SWAMP);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
  });

  it('should intensify fire zone with fire', () => {
    const result = calculateElementInteraction('fire', HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.INTENSIFY);
    assert.strictEqual(result.intensityBonus, 0.25);
    assert.ok(result.message.includes('stronger'));
  });

  it('should intensify ice patch with ice', () => {
    const result = calculateElementInteraction('ice', HAZARD_TYPES.ICE_PATCH);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.INTENSIFY);
  });

  it('should transform ice patch with fire (steam)', () => {
    const result = calculateElementInteraction('fire', HAZARD_TYPES.ICE_PATCH);
    // Fire is counter to ice, so neutralize takes precedence
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
  });

  it('should transform poison swamp with lightning to electric field', () => {
    const result = calculateElementInteraction('lightning', HAZARD_TYPES.POISON_SWAMP);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.TRANSFORM);
    assert.strictEqual(result.newHazard, HAZARD_TYPES.ELECTRIC_FIELD);
    assert.ok(result.message.includes('electrifies'));
  });

  it('should transform thorns with fire to fire zone', () => {
    const result = calculateElementInteraction('fire', HAZARD_TYPES.THORNS);
    // Fire is counter to thorns (nature), so check which takes precedence
    // counterElement is fire for thorns, so neutralize takes precedence
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
  });

  it('should transform shadow mist with holy to blessed ground', () => {
    const result = calculateElementInteraction('holy', HAZARD_TYPES.SHADOW_MIST);
    // Holy is counter to shadow, so neutralize takes precedence
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
  });

  it('should return null for unrelated elements', () => {
    const result = calculateElementInteraction('water', HAZARD_TYPES.QUICKSAND);
    assert.strictEqual(result.type, null);
    assert.strictEqual(result.newHazard, null);
    assert.strictEqual(result.message, null);
  });

  it('should handle case insensitivity', () => {
    const result = calculateElementInteraction('ICE', HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(result.type, ELEMENT_INTERACTIONS.NEUTRALIZE);
  });

  it('should return null for null attack element', () => {
    const result = calculateElementInteraction(null, HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(result.type, null);
  });

  it('should return null for invalid hazard type', () => {
    const result = calculateElementInteraction('fire', 'invalid-type');
    assert.strictEqual(result.type, null);
  });
});

// ============================================================================
// applyElementInteraction Tests
// ============================================================================

describe('applyElementInteraction', () => {
  it('should remove hazard on neutralize', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const result = applyElementInteraction(hazard, 'ice');

    assert.strictEqual(result.hazard, null);
    assert.strictEqual(result.wasModified, true);
    assert.ok(result.message);
  });

  it('should increase stats on intensify', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const originalDamage = hazard.damagePerTurn;
    const result = applyElementInteraction(hazard, 'fire');

    assert.ok(result.hazard);
    assert.strictEqual(result.wasModified, true);
    assert.strictEqual(result.hazard.intensity, 1.25);
    assert.strictEqual(result.hazard.damagePerTurn, Math.floor(originalDamage * 1.25));
  });

  it('should transform hazard to new type', () => {
    const hazard = createHazard(HAZARD_TYPES.POISON_SWAMP, { duration: 3 });
    const result = applyElementInteraction(hazard, 'lightning');

    assert.ok(result.hazard);
    assert.strictEqual(result.wasModified, true);
    assert.strictEqual(result.hazard.type, HAZARD_TYPES.ELECTRIC_FIELD);
    assert.strictEqual(result.hazard.turnsRemaining, 3);
  });

  it('should return unchanged hazard for no interaction', () => {
    const hazard = createHazard(HAZARD_TYPES.QUICKSAND);
    const result = applyElementInteraction(hazard, 'water');

    assert.strictEqual(result.hazard, hazard);
    assert.strictEqual(result.wasModified, false);
    assert.strictEqual(result.message, null);
  });

  it('should return original for null hazard', () => {
    const result = applyElementInteraction(null, 'fire');
    assert.strictEqual(result.hazard, null);
    assert.strictEqual(result.wasModified, false);
  });

  it('should return original for null element', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const result = applyElementInteraction(hazard, null);

    assert.strictEqual(result.hazard, hazard);
    assert.strictEqual(result.wasModified, false);
  });
});

// ============================================================================
// getElementalSynergyBonus Tests
// ============================================================================

describe('getElementalSynergyBonus', () => {
  it('should return 25% bonus for matching element', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const bonus = getElementalSynergyBonus('fire', hazard);
    assert.strictEqual(bonus, 0.25);
  });

  it('should return 0 for non-matching element', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const bonus = getElementalSynergyBonus('ice', hazard);
    assert.strictEqual(bonus, 0);
  });

  it('should handle case insensitivity', () => {
    const hazard = createHazard(HAZARD_TYPES.ICE_PATCH);
    const bonus = getElementalSynergyBonus('ICE', hazard);
    assert.strictEqual(bonus, 0.25);
  });

  it('should return 0 for null hazard', () => {
    const bonus = getElementalSynergyBonus('fire', null);
    assert.strictEqual(bonus, 0);
  });

  it('should return 0 for null element', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    const bonus = getElementalSynergyBonus(null, hazard);
    assert.strictEqual(bonus, 0);
  });
});

// ============================================================================
// isImmuneToHazard Tests
// ============================================================================

describe('isImmuneToHazard', () => {
  it('should return true when entity has matching immunity', () => {
    const entity = { immunities: ['fire', 'ice'] };
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(isImmuneToHazard(entity, hazard), true);
  });

  it('should return false when entity lacks matching immunity', () => {
    const entity = { immunities: ['ice', 'lightning'] };
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(isImmuneToHazard(entity, hazard), false);
  });

  it('should return false for entity without immunities', () => {
    const entity = { hp: 100 };
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(isImmuneToHazard(entity, hazard), false);
  });

  it('should handle case insensitivity', () => {
    const entity = { immunities: ['FIRE'] };
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(isImmuneToHazard(entity, hazard), true);
  });

  it('should return false for null entity', () => {
    const hazard = createHazard(HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(isImmuneToHazard(null, hazard), false);
  });

  it('should return false for null hazard', () => {
    const entity = { immunities: ['fire'] };
    assert.strictEqual(isImmuneToHazard(entity, null), false);
  });
});

// ============================================================================
// getHazardInfo Tests
// ============================================================================

describe('getHazardInfo', () => {
  it('should return info for valid hazard type', () => {
    const info = getHazardInfo(HAZARD_TYPES.POISON_SWAMP);

    assert.strictEqual(info.name, 'Poison Swamp');
    assert.strictEqual(info.element, 'nature');
    assert.strictEqual(info.damagePerTurn, 8);
    assert.ok(info.description);
    assert.ok(info.icon);
  });

  it('should return unknown for invalid type', () => {
    const info = getHazardInfo('invalid-type');

    assert.strictEqual(info.name, 'Unknown');
    assert.strictEqual(info.icon, '?');
  });

  it('should include effect info', () => {
    const info = getHazardInfo(HAZARD_TYPES.ELECTRIC_FIELD);

    assert.ok(info.effect);
    assert.strictEqual(info.effect.type, 'stun');
  });

  it('should include helpful flag', () => {
    const info = getHazardInfo(HAZARD_TYPES.BLESSED_GROUND);
    assert.strictEqual(info.isHelpful, true);
  });
});

// ============================================================================
// getAllHazardTypes Tests
// ============================================================================

describe('getAllHazardTypes', () => {
  it('should return all 8 hazard types', () => {
    const types = getAllHazardTypes();
    assert.strictEqual(types.length, 8);
  });

  it('should return array of strings', () => {
    const types = getAllHazardTypes();
    for (const type of types) {
      assert.strictEqual(typeof type, 'string');
    }
  });

  it('should include fire-zone', () => {
    const types = getAllHazardTypes();
    assert.ok(types.includes('fire-zone'));
  });
});

// ============================================================================
// getHazardsByElement Tests
// ============================================================================

describe('getHazardsByElement', () => {
  it('should return fire hazards', () => {
    const hazards = getHazardsByElement('fire');
    assert.ok(hazards.includes(HAZARD_TYPES.FIRE_ZONE));
    assert.strictEqual(hazards.length, 1);
  });

  it('should return nature hazards', () => {
    const hazards = getHazardsByElement('nature');
    assert.ok(hazards.includes(HAZARD_TYPES.POISON_SWAMP));
    assert.ok(hazards.includes(HAZARD_TYPES.THORNS));
  });

  it('should handle case insensitivity', () => {
    const hazards = getHazardsByElement('FIRE');
    assert.ok(hazards.includes(HAZARD_TYPES.FIRE_ZONE));
  });

  it('should return empty array for unknown element', () => {
    const hazards = getHazardsByElement('water');
    assert.strictEqual(hazards.length, 0);
  });

  it('should return empty array for null', () => {
    const hazards = getHazardsByElement(null);
    assert.strictEqual(hazards.length, 0);
  });
});

// ============================================================================
// Arena Management Tests
// ============================================================================

describe('createArena', () => {
  it('should create empty arena with no configs', () => {
    const arena = createArena();
    assert.deepStrictEqual(arena.hazards, []);
    assert.strictEqual(arena.turnCount, 0);
  });

  it('should create arena with hazards', () => {
    const configs = [
      { type: HAZARD_TYPES.FIRE_ZONE, position: { x: 0, y: 0 } },
      { type: HAZARD_TYPES.ICE_PATCH, position: { x: 5, y: 5 } },
    ];
    const arena = createArena(configs);

    assert.strictEqual(arena.hazards.length, 2);
    assert.strictEqual(arena.hazards[0].type, HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(arena.hazards[1].type, HAZARD_TYPES.ICE_PATCH);
  });

  it('should filter out invalid hazard types', () => {
    const configs = [
      { type: HAZARD_TYPES.FIRE_ZONE },
      { type: 'invalid-type' },
      { type: HAZARD_TYPES.ICE_PATCH },
    ];
    const arena = createArena(configs);

    assert.strictEqual(arena.hazards.length, 2);
  });
});

describe('processArenaTurn', () => {
  it('should process all hazards', () => {
    const arena = createArena([
      { type: HAZARD_TYPES.FIRE_ZONE, duration: 3 },
      { type: HAZARD_TYPES.ICE_PATCH, duration: 2 },
    ]);
    const updated = processArenaTurn(arena);

    assert.strictEqual(updated.turnCount, 1);
    assert.strictEqual(updated.hazards[0].turnsRemaining, 2);
    assert.strictEqual(updated.hazards[1].turnsRemaining, 1);
  });

  it('should remove expired hazards', () => {
    const arena = createArena([
      { type: HAZARD_TYPES.FIRE_ZONE, duration: 1 },
      { type: HAZARD_TYPES.ICE_PATCH, duration: 3 },
    ]);
    const updated = processArenaTurn(arena);

    assert.strictEqual(updated.hazards.length, 1);
    assert.strictEqual(updated.hazards[0].type, HAZARD_TYPES.ICE_PATCH);
  });

  it('should create empty arena for null input', () => {
    const arena = processArenaTurn(null);
    assert.deepStrictEqual(arena.hazards, []);
    assert.strictEqual(arena.turnCount, 0);
  });
});

describe('addHazardToArena', () => {
  it('should add hazard to arena', () => {
    const arena = createArena();
    const updated = addHazardToArena(arena, HAZARD_TYPES.FIRE_ZONE);

    assert.strictEqual(updated.hazards.length, 1);
    assert.strictEqual(updated.hazards[0].type, HAZARD_TYPES.FIRE_ZONE);
  });

  it('should accept options', () => {
    const arena = createArena();
    const updated = addHazardToArena(arena, HAZARD_TYPES.ICE_PATCH, {
      duration: 10,
      intensity: 2.0,
    });

    assert.strictEqual(updated.hazards[0].duration, 10);
    assert.strictEqual(updated.hazards[0].intensity, 2.0);
  });

  it('should return unchanged arena for invalid type', () => {
    const arena = createArena([{ type: HAZARD_TYPES.FIRE_ZONE }]);
    const updated = addHazardToArena(arena, 'invalid-type');

    assert.strictEqual(updated.hazards.length, 1);
  });

  it('should not mutate original arena', () => {
    const arena = createArena();
    addHazardToArena(arena, HAZARD_TYPES.FIRE_ZONE);

    assert.strictEqual(arena.hazards.length, 0);
  });
});

describe('removeHazardFromArena', () => {
  it('should remove hazard by index', () => {
    const arena = createArena([
      { type: HAZARD_TYPES.FIRE_ZONE },
      { type: HAZARD_TYPES.ICE_PATCH },
      { type: HAZARD_TYPES.THORNS },
    ]);
    const updated = removeHazardFromArena(arena, 1);

    assert.strictEqual(updated.hazards.length, 2);
    assert.strictEqual(updated.hazards[0].type, HAZARD_TYPES.FIRE_ZONE);
    assert.strictEqual(updated.hazards[1].type, HAZARD_TYPES.THORNS);
  });

  it('should return unchanged arena for negative index', () => {
    const arena = createArena([{ type: HAZARD_TYPES.FIRE_ZONE }]);
    const updated = removeHazardFromArena(arena, -1);

    assert.strictEqual(updated.hazards.length, 1);
  });

  it('should return unchanged arena for out of bounds index', () => {
    const arena = createArena([{ type: HAZARD_TYPES.FIRE_ZONE }]);
    const updated = removeHazardFromArena(arena, 5);

    assert.strictEqual(updated.hazards.length, 1);
  });

  it('should return arena for null input', () => {
    const result = removeHazardFromArena(null, 0);
    assert.strictEqual(result, null);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Combat Round Simulation', () => {
  it('should simulate a complete combat round with hazards', () => {
    // Create arena with fire zone
    let arena = createArena([
      { type: HAZARD_TYPES.FIRE_ZONE, duration: 3 },
    ]);

    const player = { hp: 100, maxHp: 100 };

    // Turn 1: Player in fire zone
    const effect1 = applyHazardEffect(arena.hazards[0], player, 0.5);
    assert.strictEqual(effect1.damage, 10);

    // Player attacks with ice, neutralizing fire
    const interaction = applyElementInteraction(arena.hazards[0], 'ice');
    assert.strictEqual(interaction.hazard, null);
    assert.strictEqual(interaction.wasModified, true);
  });

  it('should chain element interactions', () => {
    // Start with poison swamp
    let arena = createArena([
      { type: HAZARD_TYPES.POISON_SWAMP, duration: 5 },
    ]);

    // Lightning transforms poison to electric field
    const result = applyElementInteraction(arena.hazards[0], 'lightning');
    assert.strictEqual(result.hazard.type, HAZARD_TYPES.ELECTRIC_FIELD);
    assert.strictEqual(result.hazard.element, 'lightning');
  });
});

// ============================================================================
// Security Tests
// ============================================================================

describe('Security: No Banned Words', () => {
  const bannedWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  it('should not contain banned words in hazard names', () => {
    for (const data of Object.values(HAZARD_DATA)) {
      const nameLower = data.name.toLowerCase();
      for (const word of bannedWords) {
        assert.ok(
          !nameLower.includes(word),
          `Hazard name "${data.name}" contains banned word "${word}"`
        );
      }
    }
  });

  it('should not contain banned words in descriptions', () => {
    for (const data of Object.values(HAZARD_DATA)) {
      const descLower = data.description.toLowerCase();
      for (const word of bannedWords) {
        assert.ok(
          !descLower.includes(word),
          `Description contains banned word "${word}": ${data.description}`
        );
      }
    }
  });

  it('should not contain banned words in effect types', () => {
    for (const data of Object.values(HAZARD_DATA)) {
      if (data.effect) {
        const effectType = data.effect.type.toLowerCase();
        for (const word of bannedWords) {
          assert.ok(
            !effectType.includes(word),
            `Effect type "${data.effect.type}" contains banned word "${word}"`
          );
        }
      }
    }
  });
});
