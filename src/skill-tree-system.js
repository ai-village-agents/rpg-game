/**
 * Skill Tree System - Character ability progression trees
 * Players unlock skills in branching paths for combat and utility
 */

// Skill tree categories
export const SKILL_TREES = {
  COMBAT: { id: 'combat', name: 'Combat', icon: '⚔️', color: '#f44336' },
  MAGIC: { id: 'magic', name: 'Magic', icon: '✨', color: '#9c27b0' },
  DEFENSE: { id: 'defense', name: 'Defense', icon: '🛡️', color: '#2196f3' },
  UTILITY: { id: 'utility', name: 'Utility', icon: '🔧', color: '#4caf50' },
  CRAFTING: { id: 'crafting', name: 'Crafting', icon: '🔨', color: '#ff9800' },
  STEALTH: { id: 'stealth', name: 'Stealth', icon: '🗡️', color: '#607d8b' }
};

// Skill tiers
export const SKILL_TIERS = {
  NOVICE: { id: 'novice', name: 'Novice', level: 1, pointCost: 1, requiredTreePoints: 0 },
  APPRENTICE: { id: 'apprentice', name: 'Apprentice', level: 2, pointCost: 2, requiredTreePoints: 5 },
  ADEPT: { id: 'adept', name: 'Adept', level: 3, pointCost: 3, requiredTreePoints: 15 },
  EXPERT: { id: 'expert', name: 'Expert', level: 4, pointCost: 4, requiredTreePoints: 30 },
  MASTER: { id: 'master', name: 'Master', level: 5, pointCost: 5, requiredTreePoints: 50 }
};

// Skill types
export const SKILL_TYPES = {
  ACTIVE: { id: 'active', name: 'Active', description: 'Manually activated abilities' },
  PASSIVE: { id: 'passive', name: 'Passive', description: 'Always-on bonuses' },
  TOGGLE: { id: 'toggle', name: 'Toggle', description: 'Can be turned on/off' }
};

// Default skill definitions
export const DEFAULT_SKILLS = {
  // Combat tree
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A powerful melee attack dealing 150% damage',
    tree: 'combat',
    tier: 'novice',
    type: 'active',
    maxRanks: 5,
    effects: { damageMultiplier: 1.5 },
    effectsPerRank: { damageMultiplier: 0.1 },
    prerequisites: [],
    position: { x: 0, y: 0 }
  },
  critical_mastery: {
    id: 'critical_mastery',
    name: 'Critical Mastery',
    description: 'Increases critical hit chance',
    tree: 'combat',
    tier: 'apprentice',
    type: 'passive',
    maxRanks: 5,
    effects: { critChance: 5 },
    effectsPerRank: { critChance: 2 },
    prerequisites: ['power_strike'],
    position: { x: 0, y: 1 }
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spin attack hitting all nearby enemies',
    tree: 'combat',
    tier: 'adept',
    type: 'active',
    maxRanks: 3,
    effects: { aoeRadius: 3, damageMultiplier: 1.2 },
    effectsPerRank: { damageMultiplier: 0.15 },
    prerequisites: ['critical_mastery'],
    position: { x: 0, y: 2 }
  },

  // Magic tree
  mana_bolt: {
    id: 'mana_bolt',
    name: 'Mana Bolt',
    description: 'Basic magic projectile',
    tree: 'magic',
    tier: 'novice',
    type: 'active',
    maxRanks: 5,
    effects: { magicDamage: 20 },
    effectsPerRank: { magicDamage: 5 },
    prerequisites: [],
    position: { x: 0, y: 0 }
  },
  mana_efficiency: {
    id: 'mana_efficiency',
    name: 'Mana Efficiency',
    description: 'Reduces mana cost of all spells',
    tree: 'magic',
    tier: 'apprentice',
    type: 'passive',
    maxRanks: 5,
    effects: { manaCostReduction: 5 },
    effectsPerRank: { manaCostReduction: 3 },
    prerequisites: ['mana_bolt'],
    position: { x: 0, y: 1 }
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Explosive fire spell with area damage',
    tree: 'magic',
    tier: 'adept',
    type: 'active',
    maxRanks: 3,
    effects: { fireDamage: 50, aoeRadius: 2 },
    effectsPerRank: { fireDamage: 15 },
    prerequisites: ['mana_efficiency'],
    position: { x: -1, y: 2 }
  },
  frost_nova: {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: 'Freezing burst that slows enemies',
    tree: 'magic',
    tier: 'adept',
    type: 'active',
    maxRanks: 3,
    effects: { iceDamage: 40, slowPercent: 30 },
    effectsPerRank: { iceDamage: 10, slowPercent: 5 },
    prerequisites: ['mana_efficiency'],
    position: { x: 1, y: 2 }
  },

  // Defense tree
  iron_skin: {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Increases armor rating',
    tree: 'defense',
    tier: 'novice',
    type: 'passive',
    maxRanks: 5,
    effects: { armor: 10 },
    effectsPerRank: { armor: 5 },
    prerequisites: [],
    position: { x: 0, y: 0 }
  },
  shield_block: {
    id: 'shield_block',
    name: 'Shield Block',
    description: 'Chance to block incoming attacks',
    tree: 'defense',
    tier: 'apprentice',
    type: 'passive',
    maxRanks: 5,
    effects: { blockChance: 5 },
    effectsPerRank: { blockChance: 3 },
    prerequisites: ['iron_skin'],
    position: { x: 0, y: 1 }
  },

  // Utility tree
  swift_feet: {
    id: 'swift_feet',
    name: 'Swift Feet',
    description: 'Increases movement speed',
    tree: 'utility',
    tier: 'novice',
    type: 'passive',
    maxRanks: 5,
    effects: { moveSpeed: 5 },
    effectsPerRank: { moveSpeed: 2 },
    prerequisites: [],
    position: { x: 0, y: 0 }
  },
  treasure_hunter: {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Increases gold and item drop rates',
    tree: 'utility',
    tier: 'apprentice',
    type: 'passive',
    maxRanks: 5,
    effects: { goldBonus: 10, dropBonus: 5 },
    effectsPerRank: { goldBonus: 5, dropBonus: 3 },
    prerequisites: ['swift_feet'],
    position: { x: 0, y: 1 }
  }
};

/**
 * Initialize skill tree state
 */
export function initSkillTreeState(state) {
  return {
    state: {
      ...state,
      skillTrees: {
        availablePoints: 0,
        totalPointsSpent: 0,
        unlockedSkills: {},
        activeSkills: [],
        skillDefinitions: { ...DEFAULT_SKILLS },
        treeProgress: {
          combat: 0,
          magic: 0,
          defense: 0,
          utility: 0,
          crafting: 0,
          stealth: 0
        }
      }
    },
    success: true
  };
}

/**
 * Add skill points
 */
export function addSkillPoints(state, amount) {
  if (amount <= 0) {
    return { success: false, error: 'Invalid point amount' };
  }

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        availablePoints: state.skillTrees.availablePoints + amount
      }
    },
    newTotal: state.skillTrees.availablePoints + amount
  };
}

/**
 * Check if skill can be unlocked
 */
export function canUnlockSkill(state, skillId) {
  const skill = state.skillTrees.skillDefinitions[skillId];
  if (!skill) {
    return { canUnlock: false, reason: 'Skill not found' };
  }

  const currentRanks = state.skillTrees.unlockedSkills[skillId] || 0;

  // Check max ranks
  if (currentRanks >= skill.maxRanks) {
    return { canUnlock: false, reason: 'Already at max rank' };
  }

  // Get tier info
  const tier = Object.values(SKILL_TIERS).find(t => t.id === skill.tier);
  if (!tier) {
    return { canUnlock: false, reason: 'Invalid tier' };
  }

  // Check available points
  if (state.skillTrees.availablePoints < tier.pointCost) {
    return { canUnlock: false, reason: 'Not enough skill points' };
  }

  // Check tree progress requirement
  const treeProgress = state.skillTrees.treeProgress[skill.tree] || 0;
  if (treeProgress < tier.requiredTreePoints) {
    return { canUnlock: false, reason: `Need ${tier.requiredTreePoints} points in ${skill.tree} tree` };
  }

  // Check prerequisites
  for (const prereqId of skill.prerequisites) {
    const prereqRanks = state.skillTrees.unlockedSkills[prereqId] || 0;
    if (prereqRanks === 0) {
      const prereq = state.skillTrees.skillDefinitions[prereqId];
      return { canUnlock: false, reason: `Requires ${prereq?.name || prereqId}` };
    }
  }

  return { canUnlock: true, pointCost: tier.pointCost };
}

/**
 * Unlock or upgrade a skill
 */
export function unlockSkill(state, skillId) {
  const check = canUnlockSkill(state, skillId);
  if (!check.canUnlock) {
    return { success: false, error: check.reason };
  }

  const skill = state.skillTrees.skillDefinitions[skillId];
  const currentRanks = state.skillTrees.unlockedSkills[skillId] || 0;
  const newRanks = currentRanks + 1;
  const tier = Object.values(SKILL_TIERS).find(t => t.id === skill.tier);

  const newUnlockedSkills = {
    ...state.skillTrees.unlockedSkills,
    [skillId]: newRanks
  };

  const newTreeProgress = {
    ...state.skillTrees.treeProgress,
    [skill.tree]: state.skillTrees.treeProgress[skill.tree] + tier.pointCost
  };

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        availablePoints: state.skillTrees.availablePoints - tier.pointCost,
        totalPointsSpent: state.skillTrees.totalPointsSpent + tier.pointCost,
        unlockedSkills: newUnlockedSkills,
        treeProgress: newTreeProgress
      }
    },
    skill,
    newRank: newRanks,
    pointsSpent: tier.pointCost,
    isNewUnlock: currentRanks === 0
  };
}

/**
 * Get skill with calculated effects based on rank
 */
export function getSkillWithEffects(state, skillId) {
  const skill = state.skillTrees.skillDefinitions[skillId];
  if (!skill) {
    return { found: false };
  }

  const currentRanks = state.skillTrees.unlockedSkills[skillId] || 0;
  if (currentRanks === 0) {
    return {
      found: true,
      skill,
      rank: 0,
      effects: {},
      unlocked: false
    };
  }

  // Calculate effects based on rank
  const effects = { ...skill.effects };
  if (skill.effectsPerRank) {
    for (const [key, perRank] of Object.entries(skill.effectsPerRank)) {
      effects[key] = (effects[key] || 0) + (perRank * (currentRanks - 1));
    }
  }

  return {
    found: true,
    skill,
    rank: currentRanks,
    effects,
    unlocked: true
  };
}

/**
 * Get all skills in a tree
 */
export function getTreeSkills(state, treeId) {
  const skills = Object.values(state.skillTrees.skillDefinitions)
    .filter(skill => skill.tree === treeId)
    .map(skill => {
      const currentRanks = state.skillTrees.unlockedSkills[skill.id] || 0;
      const check = canUnlockSkill(state, skill.id);
      return {
        ...skill,
        currentRank: currentRanks,
        maxRank: skill.maxRanks,
        canUnlock: check.canUnlock,
        unlockReason: check.reason,
        isMaxed: currentRanks >= skill.maxRanks
      };
    });

  const tree = SKILL_TREES[treeId.toUpperCase()];
  const progress = state.skillTrees.treeProgress[treeId] || 0;

  return {
    tree,
    skills,
    progress,
    skillCount: skills.length,
    unlockedCount: skills.filter(s => s.currentRank > 0).length
  };
}

/**
 * Set skill as active (for hotbar)
 */
export function setSkillActive(state, skillId, slot) {
  const skillInfo = getSkillWithEffects(state, skillId);
  if (!skillInfo.found || !skillInfo.unlocked) {
    return { success: false, error: 'Skill not unlocked' };
  }

  const skill = skillInfo.skill;
  if (skill.type !== 'active') {
    return { success: false, error: 'Only active skills can be assigned to slots' };
  }

  if (slot < 0 || slot > 9) {
    return { success: false, error: 'Invalid slot (0-9)' };
  }

  // Remove skill from other slots
  let newActiveSkills = state.skillTrees.activeSkills.filter(s => s.skillId !== skillId);

  // Remove any skill currently in target slot
  newActiveSkills = newActiveSkills.filter(s => s.slot !== slot);

  // Add to new slot
  newActiveSkills.push({ skillId, slot });

  // Sort by slot
  newActiveSkills.sort((a, b) => a.slot - b.slot);

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        activeSkills: newActiveSkills
      }
    }
  };
}

/**
 * Remove skill from active slots
 */
export function removeActiveSkill(state, skillId) {
  const newActiveSkills = state.skillTrees.activeSkills.filter(s => s.skillId !== skillId);

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        activeSkills: newActiveSkills
      }
    }
  };
}

/**
 * Get active skill bar
 */
export function getActiveSkillBar(state) {
  const slots = Array(10).fill(null);

  for (const active of state.skillTrees.activeSkills) {
    const skillInfo = getSkillWithEffects(state, active.skillId);
    if (skillInfo.found && skillInfo.unlocked) {
      slots[active.slot] = {
        ...skillInfo.skill,
        rank: skillInfo.rank,
        effects: skillInfo.effects
      };
    }
  }

  return slots;
}

/**
 * Get all passive bonuses from unlocked skills
 */
export function getPassiveBonuses(state) {
  const bonuses = {};

  for (const [skillId, ranks] of Object.entries(state.skillTrees.unlockedSkills)) {
    if (ranks === 0) continue;

    const skill = state.skillTrees.skillDefinitions[skillId];
    if (!skill || skill.type !== 'passive') continue;

    const skillInfo = getSkillWithEffects(state, skillId);
    if (!skillInfo.found) continue;

    for (const [effect, value] of Object.entries(skillInfo.effects)) {
      bonuses[effect] = (bonuses[effect] || 0) + value;
    }
  }

  return bonuses;
}

/**
 * Reset a single tree
 */
export function resetTree(state, treeId) {
  const tree = SKILL_TREES[treeId.toUpperCase()];
  if (!tree) {
    return { success: false, error: 'Invalid tree' };
  }

  let refundedPoints = 0;
  const newUnlockedSkills = { ...state.skillTrees.unlockedSkills };
  const skillsToRemove = [];

  // Find all skills in tree
  for (const skill of Object.values(state.skillTrees.skillDefinitions)) {
    if (skill.tree === treeId) {
      const ranks = newUnlockedSkills[skill.id] || 0;
      if (ranks > 0) {
        const tier = Object.values(SKILL_TIERS).find(t => t.id === skill.tier);
        refundedPoints += tier.pointCost * ranks;
        skillsToRemove.push(skill.id);
        delete newUnlockedSkills[skill.id];
      }
    }
  }

  // Remove from active skills
  const newActiveSkills = state.skillTrees.activeSkills.filter(
    s => !skillsToRemove.includes(s.skillId)
  );

  const newTreeProgress = {
    ...state.skillTrees.treeProgress,
    [treeId]: 0
  };

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        availablePoints: state.skillTrees.availablePoints + refundedPoints,
        totalPointsSpent: state.skillTrees.totalPointsSpent - refundedPoints,
        unlockedSkills: newUnlockedSkills,
        activeSkills: newActiveSkills,
        treeProgress: newTreeProgress
      }
    },
    refundedPoints,
    skillsReset: skillsToRemove.length
  };
}

/**
 * Reset all trees
 */
export function resetAllTrees(state) {
  const totalRefund = state.skillTrees.totalPointsSpent;

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        availablePoints: state.skillTrees.availablePoints + totalRefund,
        totalPointsSpent: 0,
        unlockedSkills: {},
        activeSkills: [],
        treeProgress: {
          combat: 0,
          magic: 0,
          defense: 0,
          utility: 0,
          crafting: 0,
          stealth: 0
        }
      }
    },
    refundedPoints: totalRefund
  };
}

/**
 * Get skill tree summary
 */
export function getSkillTreeSummary(state) {
  const trees = Object.values(SKILL_TREES).map(tree => {
    const treeData = getTreeSkills(state, tree.id);
    return {
      ...tree,
      progress: treeData.progress,
      skillCount: treeData.skillCount,
      unlockedCount: treeData.unlockedCount
    };
  });

  return {
    trees,
    availablePoints: state.skillTrees.availablePoints,
    totalPointsSpent: state.skillTrees.totalPointsSpent,
    totalSkillsUnlocked: Object.values(state.skillTrees.unlockedSkills).filter(r => r > 0).length,
    activeSkillCount: state.skillTrees.activeSkills.length
  };
}

/**
 * Register a custom skill
 */
export function registerSkill(state, skill) {
  if (!skill.id || !skill.name || !skill.tree || !skill.tier) {
    return { success: false, error: 'Invalid skill definition' };
  }

  if (!SKILL_TREES[skill.tree.toUpperCase()]) {
    return { success: false, error: 'Invalid tree' };
  }

  if (!Object.values(SKILL_TIERS).find(t => t.id === skill.tier)) {
    return { success: false, error: 'Invalid tier' };
  }

  const fullSkill = {
    maxRanks: 1,
    effects: {},
    effectsPerRank: {},
    prerequisites: [],
    position: { x: 0, y: 0 },
    type: 'active',
    ...skill
  };

  return {
    success: true,
    state: {
      ...state,
      skillTrees: {
        ...state.skillTrees,
        skillDefinitions: {
          ...state.skillTrees.skillDefinitions,
          [skill.id]: fullSkill
        }
      }
    },
    skill: fullSkill
  };
}

/**
 * Get all trees
 */
export function getAllTrees() {
  return Object.values(SKILL_TREES);
}

/**
 * Get all tiers
 */
export function getAllTiers() {
  return Object.values(SKILL_TIERS);
}
