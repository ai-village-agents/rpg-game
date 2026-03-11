/**
 * Talent Sort/Filter Module - Logic for sorting and filtering talents
 * 
 * Works in conjunction with talents-ui.js to provide sort/filter functionality
 * for the talent tree interface.
 * 
 * Author: Claude Opus 4.5
 * Day 344 - AI Village RPG
 */

import { TALENTS, TALENT_CATEGORIES } from './data/talents.js';
import { getTalentRank, canAllocateTalent, isTierUnlocked, arePrerequisitesMet } from './talents.js';

// ============ SORT CONFIGURATION ============

export const TALENT_SORT_DEFAULT = 'category';

export const TALENT_SORT_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'tier', label: 'Tier' },
  { value: 'maxRank', label: 'Max Rank' },
  { value: 'allocated', label: 'Points Allocated' }
];

// ============ FILTER CONFIGURATION ============

export const TALENT_FILTER_DEFAULT = 'all';

export const TALENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Talents' },
  { value: 'combat', label: 'Combat Only' },
  { value: 'defense', label: 'Defense Only' },
  { value: 'magic', label: 'Magic Only' },
  { value: 'utility', label: 'Utility Only' },
  { value: 'tier1', label: 'Tier 1 Only' },
  { value: 'tier2', label: 'Tier 2 Only' },
  { value: 'tier3', label: 'Tier 3 Only' },
  { value: 'available', label: 'Available' },
  { value: 'allocated', label: 'Allocated' },
  { value: 'maxed', label: 'Maxed' },
  { value: 'locked', label: 'Locked' }
];

// ============ FILTER FUNCTIONS ============

/**
 * Filter talents by category
 * @param {Array} talents - Array of talent objects
 * @param {string} category - Category id (combat, defense, magic, utility)
 * @returns {Array} Filtered talents
 */
export function filterByCategory(talents, category) {
  if (!category || !TALENT_CATEGORIES[category]) return talents;
  return talents.filter(talent => talent.category === category);
}

/**
 * Filter talents by tier
 * @param {Array} talents - Array of talent objects
 * @param {number} tier - Tier number (1, 2, or 3)
 * @returns {Array} Filtered talents
 */
export function filterByTier(talents, tier) {
  const tierNum = parseInt(tier, 10);
  if (isNaN(tierNum) || tierNum < 1 || tierNum > 3) return talents;
  return talents.filter(talent => talent.tier === tierNum);
}

/**
 * Filter talents by allocation status
 * @param {Array} talents - Array of talent objects
 * @param {Object} talentState - Player's talent state
 * @param {string} status - Status filter (available, allocated, maxed, locked)
 * @returns {Array} Filtered talents
 */
export function filterByStatus(talents, talentState, status) {
  if (!talentState) return talents;
  
  return talents.filter(talent => {
    const currentRank = getTalentRank(talentState, talent.id);
    const { canAllocate } = canAllocateTalent(talentState, talent.id);
    const isMaxed = currentRank >= talent.maxRank;
    const isAllocated = currentRank > 0;
    const tierUnlocked = isTierUnlocked(talentState, talent.id);
    const prereqsMet = arePrerequisitesMet(talentState, talent.id);
    
    switch (status) {
      case 'available':
        return canAllocate;
      case 'allocated':
        return isAllocated && !isMaxed;
      case 'maxed':
        return isMaxed;
      case 'locked':
        return !isAllocated && (!tierUnlocked || !prereqsMet);
      default:
        return true;
    }
  });
}

/**
 * Apply a filter to talents based on filter value
 * @param {Array} talents - Array of talent objects
 * @param {string} filter - Filter value from TALENT_FILTER_OPTIONS
 * @param {Object} talentState - Player's talent state (required for status filters)
 * @returns {Array} Filtered talents
 */
export function filterTalents(talents, filter, talentState) {
  if (!filter || filter === 'all') return talents;
  
  // Category filters
  if (['combat', 'defense', 'magic', 'utility'].includes(filter)) {
    return filterByCategory(talents, filter);
  }
  
  // Tier filters
  if (filter.startsWith('tier')) {
    const tier = parseInt(filter.replace('tier', ''), 10);
    return filterByTier(talents, tier);
  }
  
  // Status filters
  if (['available', 'allocated', 'maxed', 'locked'].includes(filter)) {
    return filterByStatus(talents, talentState, filter);
  }
  
  return talents;
}

// ============ SORT FUNCTIONS ============

/**
 * Sort talents by name alphabetically
 * @param {Array} talents - Array of talent objects
 * @returns {Array} Sorted talents
 */
export function sortByName(talents) {
  return [...talents].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort talents by category, then by tier, then by name
 * @param {Array} talents - Array of talent objects
 * @returns {Array} Sorted talents
 */
export function sortByCategory(talents) {
  const categoryOrder = ['combat', 'defense', 'magic', 'utility'];
  return [...talents].sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort talents by tier (ascending), then by category, then by name
 * @param {Array} talents - Array of talent objects
 * @returns {Array} Sorted talents
 */
export function sortByTier(talents) {
  const categoryOrder = ['combat', 'defense', 'magic', 'utility'];
  return [...talents].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort talents by max rank (descending), then by name
 * @param {Array} talents - Array of talent objects
 * @returns {Array} Sorted talents
 */
export function sortByMaxRank(talents) {
  return [...talents].sort((a, b) => {
    if (b.maxRank !== a.maxRank) return b.maxRank - a.maxRank;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort talents by allocated points (descending), then by name
 * @param {Array} talents - Array of talent objects
 * @param {Object} talentState - Player's talent state
 * @returns {Array} Sorted talents
 */
export function sortByAllocated(talents, talentState) {
  if (!talentState) return sortByName(talents);
  
  return [...talents].sort((a, b) => {
    const rankA = getTalentRank(talentState, a.id);
    const rankB = getTalentRank(talentState, b.id);
    if (rankB !== rankA) return rankB - rankA;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Apply a sort to talents based on sort value
 * @param {Array} talents - Array of talent objects
 * @param {string} sort - Sort value from TALENT_SORT_OPTIONS
 * @param {Object} talentState - Player's talent state (required for allocated sort)
 * @returns {Array} Sorted talents
 */
export function sortTalents(talents, sort, talentState) {
  switch (sort) {
    case 'name':
      return sortByName(talents);
    case 'category':
      return sortByCategory(talents);
    case 'tier':
      return sortByTier(talents);
    case 'maxRank':
      return sortByMaxRank(talents);
    case 'allocated':
      return sortByAllocated(talents, talentState);
    default:
      return sortByCategory(talents);
  }
}

// ============ COMBINED SORT & FILTER ============

/**
 * Apply both filter and sort to get final talent list
 * @param {Object} options - Configuration object
 * @param {string} options.filter - Filter value
 * @param {string} options.sort - Sort value
 * @param {Object} options.talentState - Player's talent state
 * @returns {Array} Filtered and sorted talents
 */
export function getSortedFilteredTalents({ filter, sort, talentState }) {
  let talents = Object.values(TALENTS);
  
  // Apply filter first
  talents = filterTalents(talents, filter || TALENT_FILTER_DEFAULT, talentState);
  
  // Then sort
  talents = sortTalents(talents, sort || TALENT_SORT_DEFAULT, talentState);
  
  return talents;
}

/**
 * Get count of talents matching a filter
 * @param {string} filter - Filter value
 * @param {Object} talentState - Player's talent state
 * @returns {number} Count of matching talents
 */
export function getFilteredTalentCount(filter, talentState) {
  const talents = Object.values(TALENTS);
  return filterTalents(talents, filter, talentState).length;
}

/**
 * Get summary stats for talent filtering
 * @param {Object} talentState - Player's talent state
 * @returns {Object} Summary with counts per filter category
 */
export function getTalentFilterSummary(talentState) {
  const talents = Object.values(TALENTS);
  
  return {
    total: talents.length,
    byCategory: {
      combat: filterByCategory(talents, 'combat').length,
      defense: filterByCategory(talents, 'defense').length,
      magic: filterByCategory(talents, 'magic').length,
      utility: filterByCategory(talents, 'utility').length
    },
    byTier: {
      tier1: filterByTier(talents, 1).length,
      tier2: filterByTier(talents, 2).length,
      tier3: filterByTier(talents, 3).length
    },
    byStatus: {
      available: filterByStatus(talents, talentState, 'available').length,
      allocated: filterByStatus(talents, talentState, 'allocated').length,
      maxed: filterByStatus(talents, talentState, 'maxed').length,
      locked: filterByStatus(talents, talentState, 'locked').length
    }
  };
}

// ============ UI STATE HELPERS ============

/**
 * Create initial talent UI state
 * @returns {Object} Initial UI state with default sort and filter
 */
export function createTalentUiState() {
  return {
    sort: TALENT_SORT_DEFAULT,
    filter: TALENT_FILTER_DEFAULT
  };
}

/**
 * Update talent UI state with new sort value
 * @param {Object} uiState - Current UI state
 * @param {string} newSort - New sort value
 * @returns {Object} Updated UI state
 */
export function updateTalentSort(uiState, newSort) {
  const validSort = TALENT_SORT_OPTIONS.find(opt => opt.value === newSort);
  return {
    ...uiState,
    sort: validSort ? newSort : TALENT_SORT_DEFAULT
  };
}

/**
 * Update talent UI state with new filter value
 * @param {Object} uiState - Current UI state
 * @param {string} newFilter - New filter value
 * @returns {Object} Updated UI state
 */
export function updateTalentFilter(uiState, newFilter) {
  const validFilter = TALENT_FILTER_OPTIONS.find(opt => opt.value === newFilter);
  return {
    ...uiState,
    filter: validFilter ? newFilter : TALENT_FILTER_DEFAULT
  };
}
