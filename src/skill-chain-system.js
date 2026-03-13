/**
 * Skill Chain System
 * Create custom sequences of skills that trigger in succession with bonuses
 */

// Skill elements for combo interactions
export const SKILL_ELEMENTS = {
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',
  EARTH: 'earth',
  WIND: 'wind',
  WATER: 'water',
  LIGHT: 'light',
  DARK: 'dark',
  PHYSICAL: 'physical',
  ARCANE: 'arcane'
};

// Element synergies (bonus when chained)
export const ELEMENT_SYNERGIES = {
  [SKILL_ELEMENTS.FIRE]: [SKILL_ELEMENTS.WIND, SKILL_ELEMENTS.EARTH],
  [SKILL_ELEMENTS.ICE]: [SKILL_ELEMENTS.WATER, SKILL_ELEMENTS.WIND],
  [SKILL_ELEMENTS.LIGHTNING]: [SKILL_ELEMENTS.WATER, SKILL_ELEMENTS.WIND],
  [SKILL_ELEMENTS.EARTH]: [SKILL_ELEMENTS.FIRE, SKILL_ELEMENTS.LIGHTNING],
  [SKILL_ELEMENTS.WIND]: [SKILL_ELEMENTS.FIRE, SKILL_ELEMENTS.ICE],
  [SKILL_ELEMENTS.WATER]: [SKILL_ELEMENTS.ICE, SKILL_ELEMENTS.LIGHTNING],
  [SKILL_ELEMENTS.LIGHT]: [SKILL_ELEMENTS.DARK, SKILL_ELEMENTS.ARCANE],
  [SKILL_ELEMENTS.DARK]: [SKILL_ELEMENTS.LIGHT, SKILL_ELEMENTS.PHYSICAL],
  [SKILL_ELEMENTS.PHYSICAL]: [SKILL_ELEMENTS.EARTH, SKILL_ELEMENTS.DARK],
  [SKILL_ELEMENTS.ARCANE]: [SKILL_ELEMENTS.LIGHT, SKILL_ELEMENTS.LIGHTNING]
};

// Element conflicts (penalty when chained)
export const ELEMENT_CONFLICTS = {
  [SKILL_ELEMENTS.FIRE]: [SKILL_ELEMENTS.WATER, SKILL_ELEMENTS.ICE],
  [SKILL_ELEMENTS.ICE]: [SKILL_ELEMENTS.FIRE],
  [SKILL_ELEMENTS.LIGHTNING]: [SKILL_ELEMENTS.EARTH],
  [SKILL_ELEMENTS.EARTH]: [SKILL_ELEMENTS.LIGHTNING, SKILL_ELEMENTS.WIND],
  [SKILL_ELEMENTS.WIND]: [SKILL_ELEMENTS.EARTH],
  [SKILL_ELEMENTS.WATER]: [SKILL_ELEMENTS.FIRE],
  [SKILL_ELEMENTS.LIGHT]: [],
  [SKILL_ELEMENTS.DARK]: [],
  [SKILL_ELEMENTS.PHYSICAL]: [],
  [SKILL_ELEMENTS.ARCANE]: []
};

// Skill types for chain bonuses
export const SKILL_TYPES = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  HEAL: 'heal',
  UTILITY: 'utility'
};

// Chain bonus types
export const CHAIN_BONUSES = {
  DAMAGE_BOOST: { name: 'Damage Boost', perLink: 0.1, maxBonus: 0.5 },
  MANA_REDUCTION: { name: 'Mana Reduction', perLink: 0.05, maxBonus: 0.3 },
  COOLDOWN_REDUCTION: { name: 'Cooldown Reduction', perLink: 0.08, maxBonus: 0.4 },
  CRITICAL_CHANCE: { name: 'Critical Chance', perLink: 0.05, maxBonus: 0.25 },
  EFFECT_DURATION: { name: 'Effect Duration', perLink: 0.15, maxBonus: 0.6 }
};

// Chain rarity based on synergies
export const CHAIN_RARITY = {
  COMMON: { name: 'Common', minSynergy: 0, color: '#9E9E9E', bonusMult: 1.0 },
  UNCOMMON: { name: 'Uncommon', minSynergy: 2, color: '#4CAF50', bonusMult: 1.2 },
  RARE: { name: 'Rare', minSynergy: 4, color: '#2196F3', bonusMult: 1.5 },
  EPIC: { name: 'Epic', minSynergy: 6, color: '#9C27B0', bonusMult: 2.0 },
  LEGENDARY: { name: 'Legendary', minSynergy: 8, color: '#FF9800', bonusMult: 3.0 }
};

// Create initial skill chain state
export function createSkillChainState() {
  return {
    savedChains: [],
    activeChain: null,
    chainHistory: [],
    unlockedSlots: 3,
    maxSavedChains: 10,
    stats: {
      chainsExecuted: 0,
      perfectChains: 0,
      totalDamageBonus: 0,
      longestChain: 0,
      favoriteChain: null
    }
  };
}

// Create a skill for use in chains
export function createSkill(id, name, element, type, manaCost, cooldown, baseDamage = 0) {
  return {
    id,
    name,
    element,
    type,
    manaCost,
    cooldown,
    baseDamage,
    tags: []
  };
}

// Create a new skill chain
export function createChain(name, skills) {
  if (!name || typeof name !== 'string') {
    return { success: false, error: 'Invalid chain name' };
  }

  if (!Array.isArray(skills) || skills.length < 2) {
    return { success: false, error: 'Chain requires at least 2 skills' };
  }

  if (skills.length > 6) {
    return { success: false, error: 'Chain cannot exceed 6 skills' };
  }

  // Validate all skills
  for (const skill of skills) {
    if (!skill || !skill.id || !skill.element || !skill.type) {
      return { success: false, error: 'Invalid skill in chain' };
    }
  }

  const analysis = analyzeChain(skills);
  const id = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const chain = {
    id,
    name,
    skills: [...skills],
    length: skills.length,
    ...analysis,
    createdAt: Date.now(),
    timesUsed: 0
  };

  return { success: true, chain };
}

// Analyze a chain for synergies and bonuses
export function analyzeChain(skills) {
  let synergyCount = 0;
  let conflictCount = 0;
  const elementCounts = {};
  const typeCounts = {};

  // Count elements and types
  for (const skill of skills) {
    elementCounts[skill.element] = (elementCounts[skill.element] || 0) + 1;
    typeCounts[skill.type] = (typeCounts[skill.type] || 0) + 1;
  }

  // Check synergies and conflicts between consecutive skills
  for (let i = 0; i < skills.length - 1; i++) {
    const current = skills[i];
    const next = skills[i + 1];

    const synergies = ELEMENT_SYNERGIES[current.element] || [];
    const conflicts = ELEMENT_CONFLICTS[current.element] || [];

    if (synergies.includes(next.element)) {
      synergyCount++;
    }
    if (conflicts.includes(next.element)) {
      conflictCount++;
    }
  }

  // Calculate rarity
  const rarity = calculateRarity(synergyCount);

  // Calculate bonuses
  const bonuses = calculateBonuses(skills.length, synergyCount, conflictCount, rarity);

  // Calculate total mana cost and cooldown
  const totalManaCost = skills.reduce((sum, s) => sum + s.manaCost, 0);
  const totalCooldown = Math.max(...skills.map(s => s.cooldown));

  // Check for special combos
  const specialCombos = findSpecialCombos(skills, elementCounts, typeCounts);

  return {
    synergyCount,
    conflictCount,
    rarity,
    bonuses,
    totalManaCost,
    totalCooldown,
    elementCounts,
    typeCounts,
    specialCombos,
    isPerfect: conflictCount === 0 && synergyCount >= skills.length - 1
  };
}

// Calculate chain rarity based on synergy count
export function calculateRarity(synergyCount) {
  for (const [key, rarity] of Object.entries(CHAIN_RARITY).reverse()) {
    if (synergyCount >= rarity.minSynergy) {
      return rarity;
    }
  }
  return CHAIN_RARITY.COMMON;
}

// Calculate bonuses for a chain
export function calculateBonuses(chainLength, synergyCount, conflictCount, rarity) {
  const bonuses = {};
  const netSynergy = Math.max(0, synergyCount - conflictCount);

  for (const [key, bonus] of Object.entries(CHAIN_BONUSES)) {
    const rawBonus = netSynergy * bonus.perLink * rarity.bonusMult;
    bonuses[key] = Math.min(rawBonus, bonus.maxBonus);
  }

  // Length bonus
  bonuses.lengthBonus = Math.min((chainLength - 2) * 0.1, 0.4);

  return bonuses;
}

// Find special combos in a chain
export function findSpecialCombos(skills, elementCounts, typeCounts) {
  const combos = [];

  // Elemental mastery (3+ same element)
  for (const [element, count] of Object.entries(elementCounts)) {
    if (count >= 3) {
      combos.push({
        name: `${element.charAt(0).toUpperCase() + element.slice(1)} Mastery`,
        type: 'elemental',
        bonus: { damageBoost: 0.25 }
      });
    }
  }

  // Assault combo (3+ attacks)
  if (typeCounts[SKILL_TYPES.ATTACK] >= 3) {
    combos.push({
      name: 'Assault Combo',
      type: 'offensive',
      bonus: { damageBoost: 0.2 }
    });
  }

  // Support combo (2+ buffs and heals)
  const supportCount = (typeCounts[SKILL_TYPES.BUFF] || 0) + (typeCounts[SKILL_TYPES.HEAL] || 0);
  if (supportCount >= 2) {
    combos.push({
      name: 'Support Combo',
      type: 'support',
      bonus: { effectDuration: 0.3 }
    });
  }

  // Debilitate combo (2+ debuffs)
  if (typeCounts[SKILL_TYPES.DEBUFF] >= 2) {
    combos.push({
      name: 'Debilitate Combo',
      type: 'control',
      bonus: { effectDuration: 0.25 }
    });
  }

  // Elemental storm (4+ different elements)
  if (Object.keys(elementCounts).length >= 4) {
    combos.push({
      name: 'Elemental Storm',
      type: 'versatile',
      bonus: { damageBoost: 0.15, criticalChance: 0.1 }
    });
  }

  return combos;
}

// Save a chain to the player's collection
export function saveChain(state, chain) {
  if (!chain || !chain.id) {
    return { success: false, error: 'Invalid chain' };
  }

  if (state.savedChains.length >= state.maxSavedChains) {
    return { success: false, error: 'Maximum saved chains reached' };
  }

  // Check for duplicate names
  if (state.savedChains.some(c => c.name === chain.name)) {
    return { success: false, error: 'Chain with this name already exists' };
  }

  return {
    success: true,
    state: {
      ...state,
      savedChains: [...state.savedChains, chain]
    }
  };
}

// Delete a saved chain
export function deleteChain(state, chainId) {
  const chainIndex = state.savedChains.findIndex(c => c.id === chainId);

  if (chainIndex < 0) {
    return { success: false, error: 'Chain not found' };
  }

  const newChains = [...state.savedChains];
  newChains.splice(chainIndex, 1);

  return {
    success: true,
    state: {
      ...state,
      savedChains: newChains,
      activeChain: state.activeChain?.id === chainId ? null : state.activeChain
    }
  };
}

// Set the active chain
export function setActiveChain(state, chainId) {
  const chain = state.savedChains.find(c => c.id === chainId);

  if (!chain) {
    return { success: false, error: 'Chain not found' };
  }

  return {
    success: true,
    state: {
      ...state,
      activeChain: chain
    }
  };
}

// Execute a skill chain
export function executeChain(state, chainId, currentMana) {
  const chain = state.savedChains.find(c => c.id === chainId);

  if (!chain) {
    return { success: false, error: 'Chain not found' };
  }

  // Check mana (apply reduction bonus)
  const manaReduction = chain.bonuses.MANA_REDUCTION || 0;
  const actualManaCost = Math.floor(chain.totalManaCost * (1 - manaReduction));

  if (currentMana < actualManaCost) {
    return { success: false, error: 'Insufficient mana' };
  }

  // Calculate total damage with bonuses
  const baseDamage = chain.skills.reduce((sum, s) => sum + (s.baseDamage || 0), 0);
  const damageBoost = chain.bonuses.DAMAGE_BOOST || 0;
  const lengthBonus = chain.bonuses.lengthBonus || 0;

  // Add special combo bonuses
  let specialBonus = 0;
  for (const combo of chain.specialCombos) {
    if (combo.bonus.damageBoost) {
      specialBonus += combo.bonus.damageBoost;
    }
  }

  const totalDamage = Math.floor(baseDamage * (1 + damageBoost + lengthBonus + specialBonus));

  // Update chain usage
  const updatedChains = state.savedChains.map(c => {
    if (c.id === chainId) {
      return { ...c, timesUsed: c.timesUsed + 1 };
    }
    return c;
  });

  // Record execution
  const execution = {
    chainId,
    chainName: chain.name,
    damage: totalDamage,
    manaCost: actualManaCost,
    timestamp: Date.now(),
    wasPerfect: chain.isPerfect
  };

  // Update stats
  const newStats = {
    ...state.stats,
    chainsExecuted: state.stats.chainsExecuted + 1,
    perfectChains: state.stats.perfectChains + (chain.isPerfect ? 1 : 0),
    totalDamageBonus: state.stats.totalDamageBonus + (totalDamage - baseDamage),
    longestChain: Math.max(state.stats.longestChain, chain.length)
  };

  return {
    success: true,
    state: {
      ...state,
      savedChains: updatedChains,
      chainHistory: [...state.chainHistory.slice(-19), execution],
      stats: newStats
    },
    execution: {
      ...execution,
      skills: chain.skills.map(s => s.name),
      bonuses: chain.bonuses,
      specialCombos: chain.specialCombos
    }
  };
}

// Get chain by ID
export function getChain(state, chainId) {
  return state.savedChains.find(c => c.id === chainId) || null;
}

// Get all saved chains
export function getSavedChains(state) {
  return state.savedChains;
}

// Get chains sorted by usage
export function getMostUsedChains(state, limit = 5) {
  return [...state.savedChains]
    .sort((a, b) => b.timesUsed - a.timesUsed)
    .slice(0, limit);
}

// Get chains by rarity
export function getChainsByRarity(state, rarityName) {
  return state.savedChains.filter(c => c.rarity.name === rarityName);
}

// Update a chain's name
export function renameChain(state, chainId, newName) {
  if (!newName || typeof newName !== 'string') {
    return { success: false, error: 'Invalid name' };
  }

  if (state.savedChains.some(c => c.name === newName && c.id !== chainId)) {
    return { success: false, error: 'Name already in use' };
  }

  const updatedChains = state.savedChains.map(c => {
    if (c.id === chainId) {
      return { ...c, name: newName };
    }
    return c;
  });

  return {
    success: true,
    state: {
      ...state,
      savedChains: updatedChains
    }
  };
}

// Unlock additional chain slots
export function unlockSlot(state) {
  if (state.unlockedSlots >= 6) {
    return { success: false, error: 'Maximum slots already unlocked' };
  }

  return {
    success: true,
    state: {
      ...state,
      unlockedSlots: state.unlockedSlots + 1
    }
  };
}

// Calculate effective cooldown with reduction
export function getEffectiveCooldown(chain) {
  const reduction = chain.bonuses.COOLDOWN_REDUCTION || 0;
  return Math.floor(chain.totalCooldown * (1 - reduction));
}

// Calculate effective mana cost with reduction
export function getEffectiveManaCost(chain) {
  const reduction = chain.bonuses.MANA_REDUCTION || 0;
  return Math.floor(chain.totalManaCost * (1 - reduction));
}

// Get chain statistics
export function getChainStats(state) {
  return {
    ...state.stats,
    totalChains: state.savedChains.length,
    averageChainLength: state.savedChains.length > 0
      ? state.savedChains.reduce((sum, c) => sum + c.length, 0) / state.savedChains.length
      : 0,
    rarityBreakdown: getRarityBreakdown(state)
  };
}

// Get breakdown of chains by rarity
export function getRarityBreakdown(state) {
  const breakdown = {};
  for (const rarity of Object.values(CHAIN_RARITY)) {
    breakdown[rarity.name] = state.savedChains.filter(c => c.rarity.name === rarity.name).length;
  }
  return breakdown;
}

// Validate if skills can be chained together
export function canChain(skill1, skill2) {
  if (!skill1 || !skill2) return false;

  const conflicts = ELEMENT_CONFLICTS[skill1.element] || [];
  const hasSynergy = (ELEMENT_SYNERGIES[skill1.element] || []).includes(skill2.element);
  const hasConflict = conflicts.includes(skill2.element);

  return {
    canChain: true, // Skills can always be chained technically
    hasSynergy,
    hasConflict,
    recommendation: hasConflict ? 'poor' : hasSynergy ? 'excellent' : 'neutral'
  };
}

// Get recommendations for next skill in chain
export function getChainRecommendations(currentSkills, availableSkills) {
  if (!currentSkills || currentSkills.length === 0) {
    return availableSkills;
  }

  const lastSkill = currentSkills[currentSkills.length - 1];
  const synergies = ELEMENT_SYNERGIES[lastSkill.element] || [];
  const conflicts = ELEMENT_CONFLICTS[lastSkill.element] || [];

  return availableSkills
    .map(skill => ({
      skill,
      score: synergies.includes(skill.element) ? 2 :
             conflicts.includes(skill.element) ? 0 : 1
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => ({
      ...item.skill,
      recommendation: item.score === 2 ? 'synergy' :
                      item.score === 0 ? 'conflict' : 'neutral'
    }));
}
