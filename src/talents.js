/**
 * Talent System - Core logic for managing character talents
 * 
 * Handles:
 * - Allocating skill points to talents
 * - Checking prerequisites and tier requirements
 * - Calculating total talent bonuses
 * - Applying talent effects to combat stats
 */

import { TALENTS, TALENT_CATEGORIES, TIER_REQUIREMENTS, getTalentValue, getTalentsByCategory } from './data/talents.js';

/**
 * Create a new empty talent allocation object
 */
export function createTalentState() {
  return {
    allocatedTalents: {},  // { talentId: rank }
    availablePoints: 0,
    totalPointsSpent: 0,
    categoryPoints: {      // Points spent per category
      combat: 0,
      defense: 0,
      magic: 0,
      utility: 0
    }
  };
}

/**
 * Get the current rank of a talent (0 if not allocated)
 */
export function getTalentRank(talentState, talentId) {
  return talentState.allocatedTalents[talentId] || 0;
}

/**
 * Check if prerequisites are met for a talent
 */
export function arePrerequisitesMet(talentState, talentId) {
  const talent = TALENTS[talentId];
  if (!talent) return false;
  
  for (const prereqId of talent.prerequisites) {
    const prereqRank = getTalentRank(talentState, prereqId);
    const prereqTalent = TALENTS[prereqId];
    // Prerequisite must be at max rank
    if (!prereqTalent || prereqRank < prereqTalent.maxRank) {
      return false;
    }
  }
  return true;
}

/**
 * Check if tier requirement is met for a talent
 */
export function isTierUnlocked(talentState, talentId) {
  const talent = TALENTS[talentId];
  if (!talent) return false;
  
  const pointsInCategory = talentState.categoryPoints[talent.category] || 0;
  const requiredPoints = TIER_REQUIREMENTS[talent.tier] || 0;
  
  return pointsInCategory >= requiredPoints;
}

/**
 * Check if a talent can be allocated (has available point, prerequisites met, not maxed)
 */
export function canAllocateTalent(talentState, talentId) {
  const talent = TALENTS[talentId];
  if (!talent) return { canAllocate: false, reason: 'Talent not found' };
  
  // Check available points
  if (talentState.availablePoints <= 0) {
    return { canAllocate: false, reason: 'No skill points available' };
  }
  
  // Check if already at max rank
  const currentRank = getTalentRank(talentState, talentId);
  if (currentRank >= talent.maxRank) {
    return { canAllocate: false, reason: 'Talent already at maximum rank' };
  }
  
  // Check tier requirement
  if (!isTierUnlocked(talentState, talentId)) {
    const required = TIER_REQUIREMENTS[talent.tier];
    const current = talentState.categoryPoints[talent.category];
    return { 
      canAllocate: false, 
      reason: `Requires ${required} points in ${TALENT_CATEGORIES[talent.category].name} (have ${current})` 
    };
  }
  
  // Check prerequisites (only for first rank)
  if (currentRank === 0 && !arePrerequisitesMet(talentState, talentId)) {
    const prereqNames = talent.prerequisites.map(id => TALENTS[id]?.name || id).join(', ');
    return { canAllocate: false, reason: `Requires: ${prereqNames} at max rank` };
  }
  
  return { canAllocate: true, reason: null };
}

/**
 * Allocate a point to a talent
 * Returns { success: boolean, error?: string, newState: talentState }
 */
export function allocateTalent(talentState, talentId) {
  const { canAllocate, reason } = canAllocateTalent(talentState, talentId);
  
  if (!canAllocate) {
    return { success: false, error: reason, newState: talentState };
  }
  
  const talent = TALENTS[talentId];
  const currentRank = getTalentRank(talentState, talentId);
  
  const newState = {
    ...talentState,
    allocatedTalents: {
      ...talentState.allocatedTalents,
      [talentId]: currentRank + 1
    },
    availablePoints: talentState.availablePoints - 1,
    totalPointsSpent: talentState.totalPointsSpent + 1,
    categoryPoints: {
      ...talentState.categoryPoints,
      [talent.category]: talentState.categoryPoints[talent.category] + 1
    }
  };
  
  return { success: true, newState };
}

/**
 * Check if a talent can be deallocated (refunded)
 * Can only deallocate if no talents depend on it
 */
export function canDeallocateTalent(talentState, talentId) {
  const talent = TALENTS[talentId];
  if (!talent) return { canDeallocate: false, reason: 'Talent not found' };
  
  const currentRank = getTalentRank(talentState, talentId);
  if (currentRank <= 0) {
    return { canDeallocate: false, reason: 'Talent has no points allocated' };
  }
  
  // Check if this talent is a prerequisite for any allocated talents
  for (const [otherTalentId, otherRank] of Object.entries(talentState.allocatedTalents)) {
    if (otherRank > 0 && otherTalentId !== talentId) {
      const otherTalent = TALENTS[otherTalentId];
      if (otherTalent && otherTalent.prerequisites.includes(talentId)) {
        // Only block if we're at max rank (required for prerequisite)
        if (currentRank === talent.maxRank) {
          return { 
            canDeallocate: false, 
            reason: `${otherTalent.name} requires this talent` 
          };
        }
      }
    }
  }
  
  // Check if deallocating would break tier requirements for other talents
  const newCategoryPoints = talentState.categoryPoints[talent.category] - 1;
  for (const [otherTalentId, otherRank] of Object.entries(talentState.allocatedTalents)) {
    if (otherRank > 0 && otherTalentId !== talentId) {
      const otherTalent = TALENTS[otherTalentId];
      if (otherTalent && otherTalent.category === talent.category) {
        const tierReq = TIER_REQUIREMENTS[otherTalent.tier];
        if (newCategoryPoints < tierReq) {
          return { 
            canDeallocate: false, 
            reason: `Cannot reduce ${TALENT_CATEGORIES[talent.category].name} points - ${otherTalent.name} requires ${tierReq} points` 
          };
        }
      }
    }
  }
  
  return { canDeallocate: true, reason: null };
}

/**
 * Deallocate (refund) a point from a talent
 */
export function deallocateTalent(talentState, talentId) {
  const { canDeallocate, reason } = canDeallocateTalent(talentState, talentId);
  
  if (!canDeallocate) {
    return { success: false, error: reason, newState: talentState };
  }
  
  const talent = TALENTS[talentId];
  const currentRank = getTalentRank(talentState, talentId);
  
  const newAllocatedTalents = { ...talentState.allocatedTalents };
  if (currentRank === 1) {
    delete newAllocatedTalents[talentId];
  } else {
    newAllocatedTalents[talentId] = currentRank - 1;
  }
  
  const newState = {
    ...talentState,
    allocatedTalents: newAllocatedTalents,
    availablePoints: talentState.availablePoints + 1,
    totalPointsSpent: talentState.totalPointsSpent - 1,
    categoryPoints: {
      ...talentState.categoryPoints,
      [talent.category]: talentState.categoryPoints[talent.category] - 1
    }
  };
  
  return { success: true, newState };
}

/**
 * Reset all talents, refunding all points
 */
export function resetAllTalents(talentState) {
  const totalRefund = talentState.totalPointsSpent;
  return {
    ...createTalentState(),
    availablePoints: talentState.availablePoints + totalRefund
  };
}

/**
 * Add skill points (called on level up)
 */
export function addSkillPoints(talentState, points) {
  return {
    ...talentState,
    availablePoints: talentState.availablePoints + points
  };
}

/**
 * Calculate all talent bonuses from current allocation
 * Returns an object with all stat bonuses
 */
export function calculateTalentBonuses(talentState) {
  const bonuses = {
    // Combat
    physicalDamage: 0,      // % bonus
    critChance: 0,          // flat %
    critDamage: 0,          // flat % (added to base 150%)
    spd: 0,                 // flat bonus
    armorPen: 0,            // % of enemy def ignored
    doubleStrike: 0,        // % chance
    executeDamage: 0,       // % bonus to low HP enemies
    
    // Defense
    def: 0,                 // flat bonus
    maxHp: 0,               // % bonus
    dodge: 0,               // flat %
    damageReduction: 0,     // % reduction
    hpRegen: 0,             // % of max HP per turn
    counterChance: 0,       // % chance
    lowHpResist: 0,         // % reduction when low HP
    
    // Magic
    magicDamage: 0,         // % bonus
    maxMp: 0,               // % bonus
    mpCostReduction: 0,     // % reduction
    elementalDamage: 0,     // % bonus to fire/ice/lightning
    mpRegen: 0,             // flat MP per turn
    magicPen: 0,            // % of enemy resistance ignored
    freeSpellChance: 0,     // % chance to not consume MP
    
    // Utility
    goldBonus: 0,           // % bonus
    xpBonus: 0,             // % bonus
    itemDropRate: 0,        // % bonus
    shopDiscount: 0,        // % reduction
    battleStartBonus: 0,    // % stat bonus for 2 turns
    explorationFind: 0,     // % bonus
    rareItemChance: 0       // flat %
  };
  
  for (const [talentId, rank] of Object.entries(talentState.allocatedTalents)) {
    if (rank > 0) {
      const talent = TALENTS[talentId];
      if (talent && talent.effect) {
        const stat = talent.effect.stat;
        const value = getTalentValue(talentId, rank);
        if (stat in bonuses) {
          bonuses[stat] += value;
        }
      }
    }
  }
  
  return bonuses;
}

/**
 * Apply talent bonuses to base stats for combat
 */
export function applyTalentBonusesToStats(baseStats, talentBonuses) {
  const modifiedStats = { ...baseStats };
  
  // Apply flat bonuses
  modifiedStats.def = (modifiedStats.def || 0) + talentBonuses.def;
  modifiedStats.spd = (modifiedStats.spd || 0) + talentBonuses.spd;
  
  // Apply percentage bonuses to HP/MP
  if (modifiedStats.maxHp) {
    modifiedStats.maxHp = Math.floor(modifiedStats.maxHp * (1 + talentBonuses.maxHp / 100));
  }
  if (modifiedStats.maxMp) {
    modifiedStats.maxMp = Math.floor(modifiedStats.maxMp * (1 + talentBonuses.maxMp / 100));
  }
  
  return modifiedStats;
}

/**
 * Get a summary of allocated talents for display
 */
export function getTalentSummary(talentState) {
  const summary = [];
  
  for (const category of Object.keys(TALENT_CATEGORIES)) {
    const categoryTalents = [];
    for (const [talentId, rank] of Object.entries(talentState.allocatedTalents)) {
      if (rank > 0) {
        const talent = TALENTS[talentId];
        if (talent && talent.category === category) {
          categoryTalents.push({
            talent,
            rank,
            value: getTalentValue(talentId, rank)
          });
        }
      }
    }
    if (categoryTalents.length > 0) {
      summary.push({
        category: TALENT_CATEGORIES[category],
        points: talentState.categoryPoints[category],
        talents: categoryTalents
      });
    }
  }
  
  return summary;
}
