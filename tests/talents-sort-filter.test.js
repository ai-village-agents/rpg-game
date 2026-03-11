/**
 * Tests for Talent Sort/Filter Module
 * 
 * Author: Claude Opus 4.5
 * Day 344 - AI Village RPG
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  TALENT_SORT_DEFAULT,
  TALENT_SORT_OPTIONS,
  TALENT_FILTER_DEFAULT,
  TALENT_FILTER_OPTIONS,
  filterByCategory,
  filterByTier,
  filterByStatus,
  filterTalents,
  sortByName,
  sortByCategory,
  sortByTier,
  sortByMaxRank,
  sortByAllocated,
  sortTalents,
  getSortedFilteredTalents,
  getFilteredTalentCount,
  getTalentFilterSummary,
  createTalentUiState,
  updateTalentSort,
  updateTalentFilter
} from '../src/talents-sort-filter.js';

import { TALENTS, TALENT_CATEGORIES } from '../src/data/talents.js';
import { createTalentState } from '../src/talents.js';

// Helper to create a talent state with some allocations
function createAllocatedTalentState() {
  return {
    allocatedTalents: {
      'sharpened-blade': 5,  // maxed combat tier 1
      'precise-strikes': 3, // partial combat tier 1
      'thick-skin': 2,      // partial defense tier 1
    },
    availablePoints: 2,
    totalPointsSpent: 10,
    categoryPoints: {
      combat: 8,
      defense: 2,
      magic: 0,
      utility: 0
    }
  };
}

describe('Talent Sort/Filter Module', () => {
  
  describe('Configuration Constants', () => {
    it('should have valid default sort', () => {
      assert.strictEqual(typeof TALENT_SORT_DEFAULT, 'string');
      const validSort = TALENT_SORT_OPTIONS.find(opt => opt.value === TALENT_SORT_DEFAULT);
      assert.ok(validSort, 'Default sort should be in sort options');
    });
    
    it('should have valid default filter', () => {
      assert.strictEqual(typeof TALENT_FILTER_DEFAULT, 'string');
      const validFilter = TALENT_FILTER_OPTIONS.find(opt => opt.value === TALENT_FILTER_DEFAULT);
      assert.ok(validFilter, 'Default filter should be in filter options');
    });
    
    it('should have sort options with value and label', () => {
      for (const opt of TALENT_SORT_OPTIONS) {
        assert.strictEqual(typeof opt.value, 'string');
        assert.strictEqual(typeof opt.label, 'string');
      }
    });
    
    it('should have filter options with value and label', () => {
      for (const opt of TALENT_FILTER_OPTIONS) {
        assert.strictEqual(typeof opt.value, 'string');
        assert.strictEqual(typeof opt.label, 'string');
      }
    });
  });
  
  describe('filterByCategory', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should return all talents for invalid category', () => {
      const result = filterByCategory(allTalents, 'invalid');
      assert.strictEqual(result.length, allTalents.length);
    });
    
    it('should return all talents for null category', () => {
      const result = filterByCategory(allTalents, null);
      assert.strictEqual(result.length, allTalents.length);
    });
    
    it('should filter combat talents correctly', () => {
      const result = filterByCategory(allTalents, 'combat');
      assert.ok(result.length > 0, 'Should have combat talents');
      assert.ok(result.every(t => t.category === 'combat'));
    });
    
    it('should filter defense talents correctly', () => {
      const result = filterByCategory(allTalents, 'defense');
      assert.ok(result.length > 0, 'Should have defense talents');
      assert.ok(result.every(t => t.category === 'defense'));
    });
    
    it('should filter magic talents correctly', () => {
      const result = filterByCategory(allTalents, 'magic');
      assert.ok(result.length > 0, 'Should have magic talents');
      assert.ok(result.every(t => t.category === 'magic'));
    });
    
    it('should filter utility talents correctly', () => {
      const result = filterByCategory(allTalents, 'utility');
      assert.ok(result.length > 0, 'Should have utility talents');
      assert.ok(result.every(t => t.category === 'utility'));
    });
  });
  
  describe('filterByTier', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should return all talents for invalid tier', () => {
      const result = filterByTier(allTalents, 'invalid');
      assert.strictEqual(result.length, allTalents.length);
    });
    
    it('should return all talents for tier 0', () => {
      const result = filterByTier(allTalents, 0);
      assert.strictEqual(result.length, allTalents.length);
    });
    
    it('should filter tier 1 talents correctly', () => {
      const result = filterByTier(allTalents, 1);
      assert.ok(result.length > 0, 'Should have tier 1 talents');
      assert.ok(result.every(t => t.tier === 1));
    });
    
    it('should filter tier 2 talents correctly', () => {
      const result = filterByTier(allTalents, 2);
      assert.ok(result.length > 0, 'Should have tier 2 talents');
      assert.ok(result.every(t => t.tier === 2));
    });
    
    it('should filter tier 3 talents correctly', () => {
      const result = filterByTier(allTalents, 3);
      assert.ok(result.length > 0, 'Should have tier 3 talents');
      assert.ok(result.every(t => t.tier === 3));
    });
    
    it('should handle string tier input', () => {
      const result = filterByTier(allTalents, '2');
      assert.ok(result.every(t => t.tier === 2));
    });
  });
  
  describe('filterByStatus', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should return all talents if no talentState', () => {
      const result = filterByStatus(allTalents, null, 'available');
      assert.strictEqual(result.length, allTalents.length);
    });
    
    it('should filter available talents', () => {
      const talentState = createTalentState();
      talentState.availablePoints = 5;
      const result = filterByStatus(allTalents, talentState, 'available');
      // With points available, tier 1 talents with no prereqs should be available
      assert.ok(result.length > 0, 'Should have available talents');
    });
    
    it('should filter allocated talents', () => {
      const talentState = createAllocatedTalentState();
      const result = filterByStatus(allTalents, talentState, 'allocated');
      // precise-strikes (rank 3/5) and thick-skin (rank 2/5) are allocated but not maxed
      assert.ok(result.length >= 2, 'Should have allocated talents');
    });
    
    it('should filter maxed talents', () => {
      const talentState = createAllocatedTalentState();
      const result = filterByStatus(allTalents, talentState, 'maxed');
      // sharpened-blade is maxed at 5/5
      assert.ok(result.length >= 1, 'Should have maxed talents');
      assert.ok(result.some(t => t.id === 'sharpened-blade'));
    });
    
    it('should filter locked talents', () => {
      const talentState = createTalentState();
      talentState.availablePoints = 0;
      const result = filterByStatus(allTalents, talentState, 'locked');
      // Tier 2 and 3 talents should be locked (tier requirement not met)
      assert.ok(result.length > 0, 'Should have locked talents');
    });
  });
  
  describe('filterTalents (combined)', () => {
    const allTalents = Object.values(TALENTS);
    const talentState = createAllocatedTalentState();
    
    it('should return all for "all" filter', () => {
      const result = filterTalents(allTalents, 'all', talentState);
      assert.strictEqual(result.length, allTalents.length);
    });
    
    it('should handle category filters', () => {
      const result = filterTalents(allTalents, 'combat', talentState);
      assert.ok(result.every(t => t.category === 'combat'));
    });
    
    it('should handle tier filters', () => {
      const result = filterTalents(allTalents, 'tier2', talentState);
      assert.ok(result.every(t => t.tier === 2));
    });
    
    it('should handle status filters', () => {
      const result = filterTalents(allTalents, 'maxed', talentState);
      assert.ok(result.some(t => t.id === 'sharpened-blade'));
    });
  });
  
  describe('sortByName', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should sort talents alphabetically by name', () => {
      const result = sortByName(allTalents);
      for (let i = 1; i < result.length; i++) {
        assert.ok(result[i-1].name.localeCompare(result[i].name) <= 0,
          `${result[i-1].name} should come before or equal to ${result[i].name}`);
      }
    });
    
    it('should not mutate original array', () => {
      const original = [...allTalents];
      sortByName(allTalents);
      assert.deepStrictEqual(allTalents, original);
    });
  });
  
  describe('sortByCategory', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should sort by category order (combat, defense, magic, utility)', () => {
      const result = sortByCategory(allTalents);
      const categoryOrder = ['combat', 'defense', 'magic', 'utility'];
      
      let lastCatIndex = 0;
      for (const talent of result) {
        const catIndex = categoryOrder.indexOf(talent.category);
        assert.ok(catIndex >= lastCatIndex, 'Categories should be in order');
        lastCatIndex = catIndex;
      }
    });
  });
  
  describe('sortByTier', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should sort by tier ascending', () => {
      const result = sortByTier(allTalents);
      let lastTier = 0;
      for (const talent of result) {
        assert.ok(talent.tier >= lastTier, 'Tiers should be ascending');
        lastTier = talent.tier;
      }
    });
  });
  
  describe('sortByMaxRank', () => {
    const allTalents = Object.values(TALENTS);
    
    it('should sort by max rank descending', () => {
      const result = sortByMaxRank(allTalents);
      let lastMaxRank = Infinity;
      for (const talent of result) {
        assert.ok(talent.maxRank <= lastMaxRank, 'Max rank should be descending');
        lastMaxRank = talent.maxRank;
      }
    });
  });
  
  describe('sortByAllocated', () => {
    it('should sort by allocated points descending', () => {
      const allTalents = Object.values(TALENTS);
      const talentState = createAllocatedTalentState();
      const result = sortByAllocated(allTalents, talentState);
      
      // sharpened-blade (5) should come first, then precise-strikes (3), then thick-skin (2)
      const sharpenedIndex = result.findIndex(t => t.id === 'sharpened-blade');
      const preciseIndex = result.findIndex(t => t.id === 'precise-strikes');
      const thickIndex = result.findIndex(t => t.id === 'thick-skin');
      
      assert.ok(sharpenedIndex < preciseIndex, 'sharpened-blade should come before precise-strikes');
      assert.ok(preciseIndex < thickIndex, 'precise-strikes should come before thick-skin');
    });
    
    it('should fall back to name sort if no talentState', () => {
      const allTalents = Object.values(TALENTS);
      const result = sortByAllocated(allTalents, null);
      // Should be sorted by name
      for (let i = 1; i < result.length; i++) {
        assert.ok(result[i-1].name.localeCompare(result[i].name) <= 0);
      }
    });
  });
  
  describe('sortTalents (combined)', () => {
    const allTalents = Object.values(TALENTS);
    const talentState = createAllocatedTalentState();
    
    it('should handle all sort options', () => {
      for (const opt of TALENT_SORT_OPTIONS) {
        const result = sortTalents(allTalents, opt.value, talentState);
        assert.ok(Array.isArray(result), `Sort ${opt.value} should return array`);
        assert.strictEqual(result.length, allTalents.length, `Sort ${opt.value} should preserve count`);
      }
    });
    
    it('should default to category sort for unknown sort', () => {
      const result = sortTalents(allTalents, 'unknown', talentState);
      const expected = sortByCategory(allTalents);
      assert.deepStrictEqual(result, expected);
    });
  });
  
  describe('getSortedFilteredTalents', () => {
    it('should apply both filter and sort', () => {
      const talentState = createAllocatedTalentState();
      const result = getSortedFilteredTalents({
        filter: 'combat',
        sort: 'name',
        talentState
      });
      
      // Should only have combat talents
      assert.ok(result.every(t => t.category === 'combat'));
      // Should be sorted by name
      for (let i = 1; i < result.length; i++) {
        assert.ok(result[i-1].name.localeCompare(result[i].name) <= 0);
      }
    });
    
    it('should use defaults when options not provided', () => {
      const result = getSortedFilteredTalents({});
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
    });
  });
  
  describe('getFilteredTalentCount', () => {
    const talentState = createAllocatedTalentState();
    
    it('should return count for each filter', () => {
      const allCount = getFilteredTalentCount('all', talentState);
      const combatCount = getFilteredTalentCount('combat', talentState);
      
      assert.strictEqual(allCount, Object.keys(TALENTS).length);
      assert.ok(combatCount < allCount, 'Combat count should be less than total');
    });
  });
  
  describe('getTalentFilterSummary', () => {
    it('should return summary with all category counts', () => {
      const talentState = createAllocatedTalentState();
      const summary = getTalentFilterSummary(talentState);
      
      assert.strictEqual(typeof summary.total, 'number');
      assert.ok(summary.total > 0);
      
      assert.strictEqual(typeof summary.byCategory.combat, 'number');
      assert.strictEqual(typeof summary.byCategory.defense, 'number');
      assert.strictEqual(typeof summary.byCategory.magic, 'number');
      assert.strictEqual(typeof summary.byCategory.utility, 'number');
      
      assert.strictEqual(typeof summary.byTier.tier1, 'number');
      assert.strictEqual(typeof summary.byTier.tier2, 'number');
      assert.strictEqual(typeof summary.byTier.tier3, 'number');
      
      assert.strictEqual(typeof summary.byStatus.available, 'number');
      assert.strictEqual(typeof summary.byStatus.allocated, 'number');
      assert.strictEqual(typeof summary.byStatus.maxed, 'number');
      assert.strictEqual(typeof summary.byStatus.locked, 'number');
    });
    
    it('should have category counts summing to total', () => {
      const talentState = createAllocatedTalentState();
      const summary = getTalentFilterSummary(talentState);
      
      const categorySum = summary.byCategory.combat + summary.byCategory.defense +
                         summary.byCategory.magic + summary.byCategory.utility;
      assert.strictEqual(categorySum, summary.total);
    });
    
    it('should have tier counts summing to total', () => {
      const talentState = createAllocatedTalentState();
      const summary = getTalentFilterSummary(talentState);
      
      const tierSum = summary.byTier.tier1 + summary.byTier.tier2 + summary.byTier.tier3;
      assert.strictEqual(tierSum, summary.total);
    });
  });
  
  describe('UI State Helpers', () => {
    describe('createTalentUiState', () => {
      it('should create state with defaults', () => {
        const state = createTalentUiState();
        assert.strictEqual(state.sort, TALENT_SORT_DEFAULT);
        assert.strictEqual(state.filter, TALENT_FILTER_DEFAULT);
      });
    });
    
    describe('updateTalentSort', () => {
      it('should update sort value', () => {
        const state = createTalentUiState();
        const updated = updateTalentSort(state, 'name');
        assert.strictEqual(updated.sort, 'name');
        assert.strictEqual(updated.filter, state.filter);
      });
      
      it('should reject invalid sort values', () => {
        const state = createTalentUiState();
        const updated = updateTalentSort(state, 'invalid');
        assert.strictEqual(updated.sort, TALENT_SORT_DEFAULT);
      });
    });
    
    describe('updateTalentFilter', () => {
      it('should update filter value', () => {
        const state = createTalentUiState();
        const updated = updateTalentFilter(state, 'combat');
        assert.strictEqual(updated.filter, 'combat');
        assert.strictEqual(updated.sort, state.sort);
      });
      
      it('should reject invalid filter values', () => {
        const state = createTalentUiState();
        const updated = updateTalentFilter(state, 'invalid');
        assert.strictEqual(updated.filter, TALENT_FILTER_DEFAULT);
      });
    });
  });
});
