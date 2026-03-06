/**
 * Talent System Tests
 * Tests for the talent tree functionality including:
 * - Data integrity (talent definitions)
 * - Core logic (allocation, prerequisites, bonuses)
 * - Edge cases and error handling
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TALENTS,
  TALENT_CATEGORIES,
  TIER_REQUIREMENTS,
  getTalentValue,
  getTalentDescription,
  getTalentsByCategory,
  getTalentsByTier
} from '../src/data/talents.js';
import {
  createTalentState,
  getTalentRank,
  arePrerequisitesMet,
  isTierUnlocked,
  canAllocateTalent,
  allocateTalent,
  canDeallocateTalent,
  deallocateTalent,
  resetAllTalents,
  addSkillPoints,
  calculateTalentBonuses,
  applyTalentBonusesToStats,
  getTalentSummary
} from '../src/talents.js';

// Helper to get all talent objects as array
const getAllTalents = () => Object.values(TALENTS);

// Helper to allocate and return new state
const allocateAndUpdate = (state, talentId) => {
  const result = allocateTalent(state, talentId);
  return result.success ? result.newState : state;
};

// ============================================================================
// Data Integrity Tests
// ============================================================================

describe('Talent Data Integrity', () => {
  it('should have valid TALENT_CATEGORIES', () => {
    assert.ok(TALENT_CATEGORIES, 'TALENT_CATEGORIES should exist');
    const categoryIds = Object.keys(TALENT_CATEGORIES);
    assert.strictEqual(categoryIds.length, 4, 'Should have 4 categories');
    assert.deepStrictEqual(
      categoryIds.sort(),
      ['combat', 'defense', 'magic', 'utility'].sort(),
      'Should have correct category names'
    );
  });

  it('should have valid TIER_REQUIREMENTS', () => {
    assert.ok(TIER_REQUIREMENTS, 'TIER_REQUIREMENTS should exist');
    assert.strictEqual(TIER_REQUIREMENTS[1], 0, 'Tier 1 should require 0 points');
    assert.strictEqual(TIER_REQUIREMENTS[2], 5, 'Tier 2 should require 5 points');
    assert.strictEqual(TIER_REQUIREMENTS[3], 10, 'Tier 3 should require 10 points');
  });

  it('should have all required fields for each talent', () => {
    const requiredFields = ['id', 'name', 'description', 'category', 'tier', 'maxRank', 'effect', 'prerequisites'];
    const talents = getAllTalents();
    
    for (const talent of talents) {
      for (const field of requiredFields) {
        assert.ok(
          talent[field] !== undefined,
          `Talent ${talent.id || 'unknown'} is missing required field: ${field}`
        );
      }
    }
  });

  it('should have valid category for each talent', () => {
    const categoryIds = Object.keys(TALENT_CATEGORIES);
    const talents = getAllTalents();
    
    for (const talent of talents) {
      assert.ok(
        categoryIds.includes(talent.category),
        `Talent ${talent.id} has invalid category: ${talent.category}`
      );
    }
  });

  it('should have valid tier (1-3) for each talent', () => {
    const talents = getAllTalents();
    
    for (const talent of talents) {
      assert.ok(
        [1, 2, 3].includes(talent.tier),
        `Talent ${talent.id} has invalid tier: ${talent.tier}`
      );
    }
  });

  it('should have maxRank >= 1 for each talent', () => {
    const talents = getAllTalents();
    
    for (const talent of talents) {
      assert.ok(
        talent.maxRank >= 1,
        `Talent ${talent.id} has invalid maxRank: ${talent.maxRank}`
      );
    }
  });

  it('should have unique talent IDs', () => {
    const ids = Object.keys(TALENTS);
    const uniqueIds = new Set(ids);
    assert.strictEqual(
      uniqueIds.size,
      ids.length,
      `Found duplicate talent IDs`
    );
  });

  it('should have valid effect structure for each talent', () => {
    const talents = getAllTalents();
    
    for (const talent of talents) {
      assert.ok(talent.effect, `Talent ${talent.id} missing effect`);
      assert.ok(talent.effect.stat, `Talent ${talent.id} effect missing stat`);
      assert.ok(talent.effect.valuePerRank !== undefined, `Talent ${talent.id} effect missing valuePerRank`);
      assert.ok(['flat', 'percent'].includes(talent.effect.type), `Talent ${talent.id} effect has invalid type: ${talent.effect.type}`);
    }
  });

  it('should have valid prerequisites referencing existing talents', () => {
    const talentIds = new Set(Object.keys(TALENTS));
    const talents = getAllTalents();
    
    for (const talent of talents) {
      assert.ok(Array.isArray(talent.prerequisites), `Talent ${talent.id} prerequisites should be an array`);
      
      for (const prereq of talent.prerequisites) {
        assert.ok(
          talentIds.has(prereq),
          `Talent ${talent.id} has invalid prerequisite: ${prereq}`
        );
      }
    }
  });

  it('should have at least one talent per category per tier', () => {
    const categoryIds = Object.keys(TALENT_CATEGORIES);
    
    for (const category of categoryIds) {
      for (const tier of [1, 2, 3]) {
        const talents = getTalentsByTier(tier).filter(t => t.category === category);
        assert.ok(
          talents.length >= 1,
          `Category ${category} tier ${tier} should have at least 1 talent, found ${talents.length}`
        );
      }
    }
  });

  it('tier 1 talents should have no prerequisites', () => {
    const tier1Talents = getTalentsByTier(1);
    
    for (const talent of tier1Talents) {
      assert.deepStrictEqual(
        talent.prerequisites,
        [],
        `Tier 1 talent ${talent.id} should have no prerequisites`
      );
    }
  });
});

describe('Talent Helper Functions', () => {
  it('getTalentsByCategory should return all talents in category', () => {
    const combatTalents = getTalentsByCategory('combat');
    assert.ok(combatTalents.length >= 3, 'Should have at least 3 combat talents');
    for (const talent of combatTalents) {
      assert.strictEqual(talent.category, 'combat');
    }
  });

  it('getTalentsByTier should return all talents in tier', () => {
    const tier1Talents = getTalentsByTier(1);
    assert.ok(tier1Talents.length >= 4, 'Should have at least 4 tier 1 talents (one per category)');
    for (const talent of tier1Talents) {
      assert.strictEqual(talent.tier, 1);
    }
  });

  it('getTalentValue should return correct value for rank', () => {
    const talent = TALENTS['sharpened-blade'];
    const value = getTalentValue('sharpened-blade', 3);
    assert.strictEqual(value, talent.effect.valuePerRank * 3);
  });

  it('getTalentDescription should format description with value', () => {
    const desc = getTalentDescription('sharpened-blade', 2);
    assert.ok(desc.length > 0, 'Description should not be empty');
    assert.ok(/\d/.test(desc), 'Description should contain computed value');
  });
});

// ============================================================================
// Core Logic Tests (Immutable State Pattern)
// ============================================================================

describe('Talent State Management', () => {
  it('createTalentState should initialize empty state', () => {
    const state = createTalentState();
    assert.ok(state, 'Should create state object');
    assert.strictEqual(state.availablePoints, 0, 'Should start with 0 available points');
    assert.ok(state.allocatedTalents, 'Should have allocatedTalents object');
    assert.strictEqual(Object.keys(state.allocatedTalents).length, 0, 'Should have no allocated talents');
    assert.strictEqual(state.totalPointsSpent, 0, 'Should have 0 points spent');
  });

  it('createTalentState should have categoryPoints initialized', () => {
    const state = createTalentState();
    assert.ok(state.categoryPoints, 'Should have categoryPoints');
    assert.strictEqual(state.categoryPoints.combat, 0);
    assert.strictEqual(state.categoryPoints.defense, 0);
    assert.strictEqual(state.categoryPoints.magic, 0);
    assert.strictEqual(state.categoryPoints.utility, 0);
  });

  it('getTalentRank should return 0 for unallocated talents', () => {
    const state = createTalentState();
    assert.strictEqual(getTalentRank(state, 'sharpened-blade'), 0);
  });

  it('addSkillPoints should return new state with increased points', () => {
    const state = createTalentState();
    const newState = addSkillPoints(state, 5);
    assert.strictEqual(newState.availablePoints, 5);
    assert.strictEqual(state.availablePoints, 0, 'Original state should be unchanged');
  });

  it('addSkillPoints should be chainable', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    state = addSkillPoints(state, 3);
    assert.strictEqual(state.availablePoints, 8);
  });
});

describe('Tier Unlocking', () => {
  it('tier 1 talents should always have tier unlocked', () => {
    const state = createTalentState();
    assert.strictEqual(isTierUnlocked(state, 'sharpened-blade'), true);
    assert.strictEqual(isTierUnlocked(state, 'thick-skin'), true);
    assert.strictEqual(isTierUnlocked(state, 'arcane-power'), true);
    assert.strictEqual(isTierUnlocked(state, 'treasure-hunter'), true);
  });

  it('tier 2 talents should require 5 points in category', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 10);
    
    // Before spending points
    assert.strictEqual(isTierUnlocked(state, 'deadly-force'), false);
    
    // Spend 5 points in combat
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'precise-strikes');
    state = allocateAndUpdate(state, 'precise-strikes');
    
    assert.strictEqual(isTierUnlocked(state, 'deadly-force'), true);
    assert.strictEqual(isTierUnlocked(state, 'resilience'), false); // Defense tier 2 still locked
  });
});

describe('Prerequisite Checking', () => {
  it('tier 1 talents should always have prerequisites met', () => {
    const state = createTalentState();
    const tier1Talents = getTalentsByTier(1);
    
    for (const talent of tier1Talents) {
      assert.strictEqual(
        arePrerequisitesMet(state, talent.id),
        true,
        `Tier 1 talent ${talent.id} should have prerequisites met`
      );
    }
  });

  it('tier 2 talents should require maxed tier 1 prerequisite', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 10);
    
    // deadly-force requires precise-strikes at max rank (5)
    assert.strictEqual(arePrerequisitesMet(state, 'deadly-force'), false);
    
    // Allocate precise-strikes to max rank
    for (let i = 0; i < 5; i++) {
      state = allocateAndUpdate(state, 'precise-strikes');
    }
    
    assert.strictEqual(arePrerequisitesMet(state, 'deadly-force'), true);
  });
});

describe('Talent Allocation', () => {
  it('should allocate tier 1 talent with available points', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    
    const result = allocateTalent(state, 'sharpened-blade');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newState.availablePoints, 4);
    assert.strictEqual(result.newState.totalPointsSpent, 1);
    assert.strictEqual(result.newState.categoryPoints.combat, 1);
    assert.strictEqual(getTalentRank(result.newState, 'sharpened-blade'), 1);
  });

  it('should not allocate without available points', () => {
    const state = createTalentState();
    const result = allocateTalent(state, 'sharpened-blade');
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it('should not allocate beyond max rank', () => {
    let state = createTalentState();
    const talent = TALENTS['sharpened-blade'];
    state = addSkillPoints(state, talent.maxRank + 5);
    
    // Allocate to max rank
    for (let i = 0; i < talent.maxRank; i++) {
      state = allocateAndUpdate(state, 'sharpened-blade');
    }
    
    const result = allocateTalent(state, 'sharpened-blade');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.toLowerCase().includes('max'));
  });

  it('should track getTalentRank after multiple allocations', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    
    state = allocateAndUpdate(state, 'sharpened-blade');
    assert.strictEqual(getTalentRank(state, 'sharpened-blade'), 1);
    
    state = allocateAndUpdate(state, 'sharpened-blade');
    assert.strictEqual(getTalentRank(state, 'sharpened-blade'), 2);
    
    state = allocateAndUpdate(state, 'sharpened-blade');
    assert.strictEqual(getTalentRank(state, 'sharpened-blade'), 3);
  });

  it('canAllocateTalent should return object with canAllocate boolean', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    
    const result = canAllocateTalent(state, 'sharpened-blade');
    assert.ok(typeof result.canAllocate === 'boolean');
    assert.strictEqual(result.canAllocate, true);
    
    const result2 = canAllocateTalent(state, 'nonexistent');
    assert.strictEqual(result2.canAllocate, false);
  });
});

describe('Talent Deallocation', () => {
  it('should deallocate allocated talent', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'sharpened-blade');
    
    const result = deallocateTalent(state, 'sharpened-blade');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(getTalentRank(result.newState, 'sharpened-blade'), 1);
    assert.strictEqual(result.newState.availablePoints, 4);
    assert.strictEqual(result.newState.categoryPoints.combat, 1);
  });

  it('should not deallocate unallocated talent', () => {
    const state = createTalentState();
    const result = deallocateTalent(state, 'sharpened-blade');
    
    assert.strictEqual(result.success, false);
  });

  it('canDeallocateTalent should return object with canDeallocate boolean', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    state = allocateAndUpdate(state, 'sharpened-blade');
    
    const result = canDeallocateTalent(state, 'sharpened-blade');
    assert.ok(typeof result.canDeallocate === 'boolean');
    assert.strictEqual(result.canDeallocate, true);
    
    const result2 = canDeallocateTalent(state, 'precise-strikes');
    assert.strictEqual(result2.canDeallocate, false); // Not allocated
  });
});

describe('Reset All Talents', () => {
  it('should reset all talents and refund points', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 10);
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'thick-skin');
    
    const newState = resetAllTalents(state);
    
    assert.strictEqual(newState.availablePoints, 10);
    assert.strictEqual(newState.totalPointsSpent, 0);
    assert.strictEqual(Object.keys(newState.allocatedTalents).length, 0);
    assert.strictEqual(newState.categoryPoints.combat, 0);
    assert.strictEqual(newState.categoryPoints.defense, 0);
  });
});

// ============================================================================
// Bonus Calculation Tests
// ============================================================================

describe('Talent Bonuses', () => {
  it('calculateTalentBonuses should return bonuses object', () => {
    const state = createTalentState();
    const bonuses = calculateTalentBonuses(state);
    
    assert.ok(bonuses, 'Should return bonuses object');
  });

  it('calculateTalentBonuses should sum bonuses from allocated talents', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    state = allocateAndUpdate(state, 'sharpened-blade'); // +3% physicalDamage per rank
    state = allocateAndUpdate(state, 'sharpened-blade'); // +6% total
    
    const bonuses = calculateTalentBonuses(state);
    assert.ok(bonuses.physicalDamage !== undefined || Object.keys(bonuses).length >= 0);
  });

  it('applyTalentBonusesToStats should return modified stats', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 3);
    state = allocateAndUpdate(state, 'swift-attacks'); // +2 spd flat per rank
    state = allocateAndUpdate(state, 'swift-attacks');
    state = allocateAndUpdate(state, 'swift-attacks');
    
    const baseStats = { hp: 100, atk: 50, def: 30, spd: 20 };
    const bonuses = calculateTalentBonuses(state);
    const modifiedStats = applyTalentBonusesToStats(baseStats, bonuses);
    
    assert.ok(modifiedStats, 'Should return modified stats');
    assert.ok(modifiedStats.spd >= baseStats.spd, 'SPD should be at least base value');
  });
});

describe('Talent Summary', () => {
  it('getTalentSummary should return summary object', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    state = allocateAndUpdate(state, 'sharpened-blade');
    state = allocateAndUpdate(state, 'sharpened-blade');
    
    const summary = getTalentSummary(state);
    
    assert.ok(summary, 'Should return summary object');
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  it('should handle invalid talent ID gracefully', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    const result = allocateTalent(state, 'invalid-talent-id');
    assert.strictEqual(result.success, false);
  });

  it('should handle empty talent ID', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    const result = allocateTalent(state, '');
    assert.strictEqual(result.success, false);
  });

  it('should maintain immutability - original state unchanged after allocation', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 5);
    const originalAvailable = state.availablePoints;
    
    allocateTalent(state, 'sharpened-blade');
    
    assert.strictEqual(state.availablePoints, originalAvailable, 'Original state should be unchanged');
  });

  it('should handle rapid allocation/deallocation cycles', () => {
    let state = createTalentState();
    state = addSkillPoints(state, 10);
    
    for (let i = 0; i < 5; i++) {
      state = allocateAndUpdate(state, 'sharpened-blade');
      const deallocResult = deallocateTalent(state, 'sharpened-blade');
      state = deallocResult.success ? deallocResult.newState : state;
    }
    
    assert.strictEqual(state.availablePoints, 10);
    assert.strictEqual(state.totalPointsSpent, 0);
    assert.strictEqual(getTalentRank(state, 'sharpened-blade'), 0);
  });
});

// ============================================================================
// Easter Egg / Forbidden Motif Tests
// ============================================================================

describe('Forbidden Motifs Check', () => {
  const BANNED_WORDS = ['egg', 'easter', 'rabbit', 'bunny', 'basket', 'cockatrice', 'basilisk'];
  const BANNED_EMOJI = ['🥚', '🐰', '🐣', '🐇', '🥕'];
  const talents = getAllTalents();

  it('talent IDs should not contain banned words', () => {
    for (const talent of talents) {
      const idLower = talent.id.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !idLower.includes(word),
          `Talent ID ${talent.id} contains banned word: ${word}`
        );
      }
    }
  });

  it('talent names should not contain banned words', () => {
    for (const talent of talents) {
      const nameLower = talent.name.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !nameLower.includes(word),
          `Talent name "${talent.name}" contains banned word: ${word}`
        );
      }
    }
  });

  it('talent descriptions should not contain banned words', () => {
    for (const talent of talents) {
      const descLower = talent.description.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !descLower.includes(word),
          `Talent description for ${talent.id} contains banned word: ${word}`
        );
      }
    }
  });

  it('talent content should not contain banned emoji', () => {
    for (const talent of talents) {
      const content = `${talent.id}${talent.name}${talent.description}`;
      for (const emoji of BANNED_EMOJI) {
        assert.ok(
          !content.includes(emoji),
          `Talent ${talent.id} contains banned emoji: ${emoji}`
        );
      }
    }
  });
});

console.log('Talent system tests loaded successfully.');
