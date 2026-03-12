/**
 * Skill Tree System
 * Character progression through branching skill unlocks
 */

/**
 * Skill types
 */
export const SKILL_TYPES = {
  ACTIVE: 'active',
  PASSIVE: 'passive',
  BUFF: 'buff',
  ULTIMATE: 'ultimate',
};

/**
 * Skill tree categories
 */
export const TREE_CATEGORIES = {
  WARRIOR: 'warrior',
  MAGE: 'mage',
  ROGUE: 'rogue',
  HEALER: 'healer',
  UNIVERSAL: 'universal',
};

/**
 * Skill data definitions
 */
export const SKILL_TREES = {
  [TREE_CATEGORIES.WARRIOR]: {
    id: 'warrior',
    name: 'Warrior',
    icon: '\u2694\uFE0F',
    description: 'Combat mastery and physical prowess.',
    color: '#CC4444',
    skills: {
      // Tier 1
      'power-strike': {
        id: 'power-strike',
        name: 'Power Strike',
        icon: '\uD83D\uDCA5',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 2, y: 0 },
        maxRank: 5,
        cost: 1,
        requires: [],
        description: 'A powerful melee attack.',
        effects: [
          { rank: 1, damage: 120, mpCost: 5 },
          { rank: 2, damage: 140, mpCost: 5 },
          { rank: 3, damage: 160, mpCost: 5 },
          { rank: 4, damage: 180, mpCost: 4 },
          { rank: 5, damage: 200, mpCost: 4 },
        ],
      },
      'tough-skin': {
        id: 'tough-skin',
        name: 'Tough Skin',
        icon: '\uD83D\uDEE1\uFE0F',
        type: SKILL_TYPES.PASSIVE,
        tier: 1,
        position: { x: 0, y: 0 },
        maxRank: 3,
        cost: 1,
        requires: [],
        description: 'Increases base defense.',
        effects: [
          { rank: 1, defenseBonus: 5 },
          { rank: 2, defenseBonus: 10 },
          { rank: 3, defenseBonus: 15 },
        ],
      },
      'battle-shout': {
        id: 'battle-shout',
        name: 'Battle Shout',
        icon: '\uD83D\uDCE3',
        type: SKILL_TYPES.BUFF,
        tier: 1,
        position: { x: 4, y: 0 },
        maxRank: 3,
        cost: 1,
        requires: [],
        description: 'Increases party attack.',
        effects: [
          { rank: 1, attackBonus: 0.1, duration: 3 },
          { rank: 2, attackBonus: 0.15, duration: 4 },
          { rank: 3, attackBonus: 0.2, duration: 5 },
        ],
      },
      // Tier 2
      'cleave': {
        id: 'cleave',
        name: 'Cleave',
        icon: '\u2694\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 2,
        position: { x: 1, y: 1 },
        maxRank: 4,
        cost: 2,
        requires: ['power-strike'],
        description: 'Attack all enemies.',
        effects: [
          { rank: 1, damage: 80, mpCost: 10, targets: 'all' },
          { rank: 2, damage: 95, mpCost: 10, targets: 'all' },
          { rank: 3, damage: 110, mpCost: 9, targets: 'all' },
          { rank: 4, damage: 125, mpCost: 8, targets: 'all' },
        ],
      },
      'shield-wall': {
        id: 'shield-wall',
        name: 'Shield Wall',
        icon: '\uD83D\uDEE1\uFE0F',
        type: SKILL_TYPES.BUFF,
        tier: 2,
        position: { x: 0, y: 1 },
        maxRank: 3,
        cost: 2,
        requires: ['tough-skin'],
        description: 'Reduces incoming damage.',
        effects: [
          { rank: 1, damageReduction: 0.2, duration: 2 },
          { rank: 2, damageReduction: 0.3, duration: 3 },
          { rank: 3, damageReduction: 0.4, duration: 3 },
        ],
      },
      'weapon-mastery': {
        id: 'weapon-mastery',
        name: 'Weapon Mastery',
        icon: '\uD83D\uDDE1\uFE0F',
        type: SKILL_TYPES.PASSIVE,
        tier: 2,
        position: { x: 3, y: 1 },
        maxRank: 5,
        cost: 1,
        requires: ['power-strike'],
        description: 'Increases attack damage.',
        effects: [
          { rank: 1, attackPercent: 0.04 },
          { rank: 2, attackPercent: 0.08 },
          { rank: 3, attackPercent: 0.12 },
          { rank: 4, attackPercent: 0.16 },
          { rank: 5, attackPercent: 0.2 },
        ],
      },
      // Tier 3
      'execute': {
        id: 'execute',
        name: 'Execute',
        icon: '\u2620\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 3,
        position: { x: 2, y: 2 },
        maxRank: 3,
        cost: 3,
        requires: ['cleave', 'weapon-mastery'],
        description: 'Massive damage to low HP enemies.',
        effects: [
          { rank: 1, damage: 200, executeThreshold: 0.3, mpCost: 15 },
          { rank: 2, damage: 250, executeThreshold: 0.35, mpCost: 15 },
          { rank: 3, damage: 300, executeThreshold: 0.4, mpCost: 12 },
        ],
      },
      'berserker-rage': {
        id: 'berserker-rage',
        name: 'Berserker Rage',
        icon: '\uD83D\uDCA2',
        type: SKILL_TYPES.ULTIMATE,
        tier: 4,
        position: { x: 2, y: 3 },
        maxRank: 1,
        cost: 5,
        requires: ['execute'],
        description: 'Massive attack boost at low HP.',
        effects: [
          { rank: 1, attackBonus: 0.5, hpThreshold: 0.3, duration: 5 },
        ],
      },
    },
  },
  [TREE_CATEGORIES.MAGE]: {
    id: 'mage',
    name: 'Mage',
    icon: '\uD83E\uDE84',
    description: 'Arcane magic and elemental power.',
    color: '#4444CC',
    skills: {
      // Tier 1
      'fireball': {
        id: 'fireball',
        name: 'Fireball',
        icon: '\uD83D\uDD25',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 0, y: 0 },
        maxRank: 5,
        cost: 1,
        requires: [],
        description: 'Launch a ball of fire.',
        effects: [
          { rank: 1, damage: 100, element: 'fire', mpCost: 8 },
          { rank: 2, damage: 120, element: 'fire', mpCost: 8 },
          { rank: 3, damage: 140, element: 'fire', mpCost: 7 },
          { rank: 4, damage: 160, element: 'fire', mpCost: 7 },
          { rank: 5, damage: 180, element: 'fire', mpCost: 6 },
        ],
      },
      'ice-shard': {
        id: 'ice-shard',
        name: 'Ice Shard',
        icon: '\u2744\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 2, y: 0 },
        maxRank: 5,
        cost: 1,
        requires: [],
        description: 'Fire shards of ice.',
        effects: [
          { rank: 1, damage: 90, element: 'ice', freezeChance: 0.1, mpCost: 7 },
          { rank: 2, damage: 105, element: 'ice', freezeChance: 0.12, mpCost: 7 },
          { rank: 3, damage: 120, element: 'ice', freezeChance: 0.15, mpCost: 6 },
          { rank: 4, damage: 135, element: 'ice', freezeChance: 0.18, mpCost: 6 },
          { rank: 5, damage: 150, element: 'ice', freezeChance: 0.2, mpCost: 5 },
        ],
      },
      'arcane-intellect': {
        id: 'arcane-intellect',
        name: 'Arcane Intellect',
        icon: '\uD83D\uDCA0',
        type: SKILL_TYPES.PASSIVE,
        tier: 1,
        position: { x: 4, y: 0 },
        maxRank: 3,
        cost: 1,
        requires: [],
        description: 'Increases max MP.',
        effects: [
          { rank: 1, mpBonus: 20 },
          { rank: 2, mpBonus: 40 },
          { rank: 3, mpBonus: 60 },
        ],
      },
      // Tier 2
      'flame-burst': {
        id: 'flame-burst',
        name: 'Flame Burst',
        icon: '\uD83D\uDD25',
        type: SKILL_TYPES.ACTIVE,
        tier: 2,
        position: { x: 0, y: 1 },
        maxRank: 3,
        cost: 2,
        requires: ['fireball'],
        description: 'AoE fire damage.',
        effects: [
          { rank: 1, damage: 70, element: 'fire', targets: 'all', mpCost: 15 },
          { rank: 2, damage: 90, element: 'fire', targets: 'all', mpCost: 14 },
          { rank: 3, damage: 110, element: 'fire', targets: 'all', mpCost: 12 },
        ],
      },
      'frost-nova': {
        id: 'frost-nova',
        name: 'Frost Nova',
        icon: '\u2744\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 2,
        position: { x: 2, y: 1 },
        maxRank: 3,
        cost: 2,
        requires: ['ice-shard'],
        description: 'Freeze nearby enemies.',
        effects: [
          { rank: 1, damage: 50, element: 'ice', freezeChance: 0.3, targets: 'all', mpCost: 12 },
          { rank: 2, damage: 65, element: 'ice', freezeChance: 0.4, targets: 'all', mpCost: 11 },
          { rank: 3, damage: 80, element: 'ice', freezeChance: 0.5, targets: 'all', mpCost: 10 },
        ],
      },
      'mana-flow': {
        id: 'mana-flow',
        name: 'Mana Flow',
        icon: '\uD83D\uDCA7',
        type: SKILL_TYPES.PASSIVE,
        tier: 2,
        position: { x: 4, y: 1 },
        maxRank: 3,
        cost: 2,
        requires: ['arcane-intellect'],
        description: 'MP regen per turn.',
        effects: [
          { rank: 1, mpRegen: 3 },
          { rank: 2, mpRegen: 5 },
          { rank: 3, mpRegen: 8 },
        ],
      },
      // Tier 3
      'meteor': {
        id: 'meteor',
        name: 'Meteor',
        icon: '\u2604\uFE0F',
        type: SKILL_TYPES.ULTIMATE,
        tier: 3,
        position: { x: 1, y: 2 },
        maxRank: 1,
        cost: 5,
        requires: ['flame-burst'],
        description: 'Devastating fire damage.',
        effects: [
          { rank: 1, damage: 300, element: 'fire', targets: 'all', mpCost: 30 },
        ],
      },
      'blizzard': {
        id: 'blizzard',
        name: 'Blizzard',
        icon: '\uD83C\uDF28\uFE0F',
        type: SKILL_TYPES.ULTIMATE,
        tier: 3,
        position: { x: 3, y: 2 },
        maxRank: 1,
        cost: 5,
        requires: ['frost-nova'],
        description: 'Massive ice storm.',
        effects: [
          { rank: 1, damage: 250, element: 'ice', freezeChance: 0.6, targets: 'all', mpCost: 25 },
        ],
      },
    },
  },
  [TREE_CATEGORIES.ROGUE]: {
    id: 'rogue',
    name: 'Rogue',
    icon: '\uD83D\uDDE1\uFE0F',
    description: 'Stealth and precision strikes.',
    color: '#44AA44',
    skills: {
      // Tier 1
      'backstab': {
        id: 'backstab',
        name: 'Backstab',
        icon: '\uD83D\uDDE1\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 2, y: 0 },
        maxRank: 5,
        cost: 1,
        requires: [],
        description: 'Strike from behind.',
        effects: [
          { rank: 1, damage: 130, critBonus: 0.1, mpCost: 6 },
          { rank: 2, damage: 150, critBonus: 0.15, mpCost: 6 },
          { rank: 3, damage: 170, critBonus: 0.2, mpCost: 5 },
          { rank: 4, damage: 190, critBonus: 0.25, mpCost: 5 },
          { rank: 5, damage: 210, critBonus: 0.3, mpCost: 4 },
        ],
      },
      'quick-feet': {
        id: 'quick-feet',
        name: 'Quick Feet',
        icon: '\uD83D\uDCA8',
        type: SKILL_TYPES.PASSIVE,
        tier: 1,
        position: { x: 0, y: 0 },
        maxRank: 3,
        cost: 1,
        requires: [],
        description: 'Increases speed.',
        effects: [
          { rank: 1, speedBonus: 5 },
          { rank: 2, speedBonus: 10 },
          { rank: 3, speedBonus: 15 },
        ],
      },
      'poison-blade': {
        id: 'poison-blade',
        name: 'Poison Blade',
        icon: '\u2620\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 4, y: 0 },
        maxRank: 3,
        cost: 1,
        requires: [],
        description: 'Apply poison.',
        effects: [
          { rank: 1, damage: 60, poisonDamage: 10, poisonDuration: 3, mpCost: 8 },
          { rank: 2, damage: 75, poisonDamage: 15, poisonDuration: 3, mpCost: 8 },
          { rank: 3, damage: 90, poisonDamage: 20, poisonDuration: 4, mpCost: 7 },
        ],
      },
      // Tier 2
      'shadow-step': {
        id: 'shadow-step',
        name: 'Shadow Step',
        icon: '\uD83D\uDC7B',
        type: SKILL_TYPES.ACTIVE,
        tier: 2,
        position: { x: 1, y: 1 },
        maxRank: 2,
        cost: 2,
        requires: ['backstab', 'quick-feet'],
        description: 'Teleport and attack.',
        effects: [
          { rank: 1, damage: 150, evasionBuff: 0.2, duration: 1, mpCost: 12 },
          { rank: 2, damage: 180, evasionBuff: 0.3, duration: 2, mpCost: 10 },
        ],
      },
      'critical-eye': {
        id: 'critical-eye',
        name: 'Critical Eye',
        icon: '\uD83C\uDFAF',
        type: SKILL_TYPES.PASSIVE,
        tier: 2,
        position: { x: 3, y: 1 },
        maxRank: 5,
        cost: 1,
        requires: ['backstab'],
        description: 'Increases crit chance.',
        effects: [
          { rank: 1, critChance: 0.03 },
          { rank: 2, critChance: 0.06 },
          { rank: 3, critChance: 0.09 },
          { rank: 4, critChance: 0.12 },
          { rank: 5, critChance: 0.15 },
        ],
      },
      // Tier 3
      'assassinate': {
        id: 'assassinate',
        name: 'Assassinate',
        icon: '\uD83D\uDC80',
        type: SKILL_TYPES.ULTIMATE,
        tier: 3,
        position: { x: 2, y: 2 },
        maxRank: 1,
        cost: 5,
        requires: ['shadow-step', 'critical-eye'],
        description: 'Guaranteed critical hit.',
        effects: [
          { rank: 1, damage: 250, guaranteedCrit: true, critDamage: 0.5, mpCost: 20 },
        ],
      },
    },
  },
  [TREE_CATEGORIES.HEALER]: {
    id: 'healer',
    name: 'Healer',
    icon: '\u2728',
    description: 'Restoration and support magic.',
    color: '#AAAA44',
    skills: {
      // Tier 1
      'heal': {
        id: 'heal',
        name: 'Heal',
        icon: '\u2764\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 2, y: 0 },
        maxRank: 5,
        cost: 1,
        requires: [],
        description: 'Restore HP.',
        effects: [
          { rank: 1, healing: 50, mpCost: 8 },
          { rank: 2, healing: 70, mpCost: 8 },
          { rank: 3, healing: 90, mpCost: 7 },
          { rank: 4, healing: 110, mpCost: 7 },
          { rank: 5, healing: 130, mpCost: 6 },
        ],
      },
      'blessing': {
        id: 'blessing',
        name: 'Blessing',
        icon: '\u2728',
        type: SKILL_TYPES.BUFF,
        tier: 1,
        position: { x: 0, y: 0 },
        maxRank: 3,
        cost: 1,
        requires: [],
        description: 'Increase defense.',
        effects: [
          { rank: 1, defenseBonus: 0.15, duration: 3 },
          { rank: 2, defenseBonus: 0.2, duration: 4 },
          { rank: 3, defenseBonus: 0.25, duration: 5 },
        ],
      },
      'purify': {
        id: 'purify',
        name: 'Purify',
        icon: '\u2600\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 1,
        position: { x: 4, y: 0 },
        maxRank: 2,
        cost: 1,
        requires: [],
        description: 'Remove debuffs.',
        effects: [
          { rank: 1, removeDebuffs: 1, mpCost: 10 },
          { rank: 2, removeDebuffs: 2, mpCost: 8 },
        ],
      },
      // Tier 2
      'group-heal': {
        id: 'group-heal',
        name: 'Group Heal',
        icon: '\u2764\uFE0F',
        type: SKILL_TYPES.ACTIVE,
        tier: 2,
        position: { x: 2, y: 1 },
        maxRank: 3,
        cost: 2,
        requires: ['heal'],
        description: 'Heal all allies.',
        effects: [
          { rank: 1, healing: 40, targets: 'party', mpCost: 18 },
          { rank: 2, healing: 55, targets: 'party', mpCost: 16 },
          { rank: 3, healing: 70, targets: 'party', mpCost: 14 },
        ],
      },
      'regen': {
        id: 'regen',
        name: 'Regeneration',
        icon: '\uD83D\uDC9A',
        type: SKILL_TYPES.BUFF,
        tier: 2,
        position: { x: 1, y: 1 },
        maxRank: 3,
        cost: 2,
        requires: ['heal', 'blessing'],
        description: 'HP over time.',
        effects: [
          { rank: 1, regenAmount: 15, duration: 4, mpCost: 12 },
          { rank: 2, regenAmount: 25, duration: 5, mpCost: 11 },
          { rank: 3, regenAmount: 35, duration: 5, mpCost: 10 },
        ],
      },
      // Tier 3
      'revive': {
        id: 'revive',
        name: 'Revive',
        icon: '\uD83D\uDD06',
        type: SKILL_TYPES.ULTIMATE,
        tier: 3,
        position: { x: 2, y: 2 },
        maxRank: 1,
        cost: 5,
        requires: ['group-heal', 'regen'],
        description: 'Resurrect fallen ally.',
        effects: [
          { rank: 1, revivePercent: 0.5, mpCost: 40 },
        ],
      },
    },
  },
};

/**
 * Create skill tree state for a character
 * @param {string} primaryTree - Primary skill tree category
 * @returns {Object} Skill tree state
 */
export function createSkillTreeState(primaryTree = null) {
  return {
    skillPoints: 0,
    totalPointsSpent: 0,
    unlockedSkills: {},
    primaryTree,
  };
}

/**
 * Get skill tree data
 * @param {string} category - Tree category
 * @returns {Object|null} Tree data
 */
export function getSkillTreeData(category) {
  return SKILL_TREES[category] || null;
}

/**
 * Get skill data
 * @param {string} treeCategory - Tree category
 * @param {string} skillId - Skill ID
 * @returns {Object|null} Skill data
 */
export function getSkillData(treeCategory, skillId) {
  const tree = SKILL_TREES[treeCategory];
  if (!tree) return null;
  return tree.skills[skillId] || null;
}

/**
 * Check if skill is unlocked
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @param {string} skillId - Skill ID
 * @returns {boolean} Whether skill is unlocked
 */
export function isSkillUnlocked(state, treeCategory, skillId) {
  if (!state || !state.unlockedSkills) return false;
  const key = `${treeCategory}:${skillId}`;
  return state.unlockedSkills[key] !== undefined && state.unlockedSkills[key] > 0;
}

/**
 * Get skill rank
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @param {string} skillId - Skill ID
 * @returns {number} Current rank (0 if not unlocked)
 */
export function getSkillRank(state, treeCategory, skillId) {
  if (!state || !state.unlockedSkills) return 0;
  const key = `${treeCategory}:${skillId}`;
  return state.unlockedSkills[key] || 0;
}

/**
 * Check if skill can be unlocked
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @param {string} skillId - Skill ID
 * @returns {Object} Result with canUnlock and reason
 */
export function canUnlockSkill(state, treeCategory, skillId) {
  const skill = getSkillData(treeCategory, skillId);
  if (!skill) {
    return { canUnlock: false, reason: 'invalid_skill' };
  }
  
  const currentRank = getSkillRank(state, treeCategory, skillId);
  
  // Check max rank
  if (currentRank >= skill.maxRank) {
    return { canUnlock: false, reason: 'max_rank' };
  }
  
  // Check skill points
  if (state.skillPoints < skill.cost) {
    return { canUnlock: false, reason: 'insufficient_points' };
  }
  
  // Check prerequisites
  for (const reqId of skill.requires) {
    if (!isSkillUnlocked(state, treeCategory, reqId)) {
      return { canUnlock: false, reason: 'missing_prerequisite', missingSkill: reqId };
    }
  }
  
  return { canUnlock: true, reason: null };
}

/**
 * Unlock or upgrade a skill
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @param {string} skillId - Skill ID
 * @returns {Object} Result with updated state and success
 */
export function unlockSkill(state, treeCategory, skillId) {
  const check = canUnlockSkill(state, treeCategory, skillId);
  if (!check.canUnlock) {
    return { state, success: false, reason: check.reason };
  }
  
  const skill = getSkillData(treeCategory, skillId);
  const key = `${treeCategory}:${skillId}`;
  const currentRank = getSkillRank(state, treeCategory, skillId);
  
  return {
    state: {
      ...state,
      skillPoints: state.skillPoints - skill.cost,
      totalPointsSpent: state.totalPointsSpent + skill.cost,
      unlockedSkills: {
        ...state.unlockedSkills,
        [key]: currentRank + 1,
      },
    },
    success: true,
    newRank: currentRank + 1,
    skillName: skill.name,
  };
}

/**
 * Add skill points
 * @param {Object} state - Skill tree state
 * @param {number} points - Points to add
 * @returns {Object} Updated state
 */
export function addSkillPoints(state, points) {
  if (!state || points < 0) return state;
  return {
    ...state,
    skillPoints: state.skillPoints + points,
  };
}

/**
 * Get skill effect at current rank
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @param {string} skillId - Skill ID
 * @returns {Object|null} Effect data at current rank
 */
export function getSkillEffect(state, treeCategory, skillId) {
  const skill = getSkillData(treeCategory, skillId);
  if (!skill) return null;
  
  const rank = getSkillRank(state, treeCategory, skillId);
  if (rank === 0) return null;
  
  return skill.effects[rank - 1] || null;
}

/**
 * Get all unlocked skills
 * @param {Object} state - Skill tree state
 * @returns {Array} Array of unlocked skills with full data
 */
export function getAllUnlockedSkills(state) {
  if (!state || !state.unlockedSkills) return [];
  
  const skills = [];
  for (const [key, rank] of Object.entries(state.unlockedSkills)) {
    if (rank > 0) {
      const [treeCategory, skillId] = key.split(':');
      const skill = getSkillData(treeCategory, skillId);
      if (skill) {
        skills.push({
          treeCategory,
          skillId,
          rank,
          skill,
          effect: skill.effects[rank - 1],
        });
      }
    }
  }
  return skills;
}

/**
 * Get all active skills (usable in combat)
 * @param {Object} state - Skill tree state
 * @returns {Array} Array of active skills
 */
export function getActiveSkills(state) {
  return getAllUnlockedSkills(state).filter(s => 
    s.skill.type === SKILL_TYPES.ACTIVE || s.skill.type === SKILL_TYPES.ULTIMATE
  );
}

/**
 * Get all passive skills
 * @param {Object} state - Skill tree state
 * @returns {Array} Array of passive skills
 */
export function getPassiveSkills(state) {
  return getAllUnlockedSkills(state).filter(s => s.skill.type === SKILL_TYPES.PASSIVE);
}

/**
 * Calculate passive bonuses from skills
 * @param {Object} state - Skill tree state
 * @returns {Object} Combined passive bonuses
 */
export function calculatePassiveBonuses(state) {
  const passives = getPassiveSkills(state);
  const bonuses = {};
  
  for (const p of passives) {
    const effect = p.effect;
    for (const [key, value] of Object.entries(effect)) {
      if (key === 'rank') continue;
      if (typeof value === 'number') {
        bonuses[key] = (bonuses[key] || 0) + value;
      }
    }
  }
  
  return bonuses;
}

/**
 * Apply passive bonuses to stats
 * @param {Object} baseStats - Base stats
 * @param {Object} passiveBonuses - Passive bonuses
 * @returns {Object} Modified stats
 */
export function applyPassivesToStats(baseStats, passiveBonuses) {
  if (!baseStats) return baseStats;
  
  const modified = { ...baseStats };
  
  // Flat bonuses
  const flatBonuses = ['defenseBonus', 'speedBonus', 'mpBonus'];
  for (const bonus of flatBonuses) {
    if (passiveBonuses[bonus]) {
      const stat = bonus.replace('Bonus', '');
      if (stat === 'mp' && modified.maxMp !== undefined) {
        modified.maxMp = modified.maxMp + passiveBonuses[bonus];
      } else if (modified[stat] !== undefined) {
        modified[stat] = modified[stat] + passiveBonuses[bonus];
      }
    }
  }
  
  // Percentage bonuses
  if (passiveBonuses.attackPercent && modified.attack !== undefined) {
    modified.attack = Math.floor(modified.attack * (1 + passiveBonuses.attackPercent));
  }
  
  // Additive bonuses
  if (passiveBonuses.critChance && modified.critChance !== undefined) {
    modified.critChance = modified.critChance + passiveBonuses.critChance;
  }
  
  if (passiveBonuses.mpRegen !== undefined) {
    modified.mpRegen = (modified.mpRegen || 0) + passiveBonuses.mpRegen;
  }
  
  return modified;
}

/**
 * Get skill tree progress
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @returns {Object} Progress info
 */
export function getTreeProgress(state, treeCategory) {
  const tree = SKILL_TREES[treeCategory];
  if (!tree) return { found: false };
  
  const totalSkills = Object.keys(tree.skills).length;
  let unlockedCount = 0;
  let totalRanks = 0;
  let currentRanks = 0;
  
  for (const [skillId, skill] of Object.entries(tree.skills)) {
    totalRanks += skill.maxRank;
    const rank = getSkillRank(state, treeCategory, skillId);
    if (rank > 0) {
      unlockedCount++;
      currentRanks += rank;
    }
  }
  
  return {
    found: true,
    treeName: tree.name,
    totalSkills,
    unlockedCount,
    totalRanks,
    currentRanks,
    percentComplete: Math.floor((currentRanks / totalRanks) * 100),
  };
}

/**
 * Reset skill tree (refund points)
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Optional tree to reset (null = all)
 * @returns {Object} Updated state with refunded points
 */
export function resetSkillTree(state, treeCategory = null) {
  if (!state) return createSkillTreeState();
  
  let refundedPoints = 0;
  const newUnlocked = {};
  
  for (const [key, rank] of Object.entries(state.unlockedSkills || {})) {
    if (rank > 0) {
      const [tree, skillId] = key.split(':');
      if (treeCategory === null || tree === treeCategory) {
        const skill = getSkillData(tree, skillId);
        if (skill) {
          refundedPoints += skill.cost * rank;
        }
      } else {
        newUnlocked[key] = rank;
      }
    }
  }
  
  return {
    ...state,
    skillPoints: state.skillPoints + refundedPoints,
    totalPointsSpent: state.totalPointsSpent - refundedPoints,
    unlockedSkills: newUnlocked,
  };
}

/**
 * Get all tree categories
 * @returns {Array} Array of category strings
 */
export function getAllTreeCategories() {
  return Object.values(TREE_CATEGORIES);
}

/**
 * Get all trees data
 * @returns {Object} All skill trees
 */
export function getAllSkillTrees() {
  return SKILL_TREES;
}
