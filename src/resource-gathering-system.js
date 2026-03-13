/**
 * Resource Gathering System
 * Allows players to gather resources from nodes in the world
 * Includes mining, foraging, woodcutting, and fishing (basic)
 */

// Gathering skill types
export const GATHERING_SKILL = {
  MINING: { id: 'mining', name: 'Mining', icon: 'pickaxe', color: '#8B4513' },
  FORAGING: { id: 'foraging', name: 'Foraging', icon: 'leaf', color: '#228B22' },
  WOODCUTTING: { id: 'woodcutting', name: 'Woodcutting', icon: 'axe', color: '#8B7355' },
  SKINNING: { id: 'skinning', name: 'Skinning', icon: 'knife', color: '#CD853F' }
};

// Resource rarity
export const RESOURCE_RARITY = {
  COMMON: { id: 'common', name: 'Common', color: '#AAAAAA', expMultiplier: 1 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#1EFF00', expMultiplier: 1.5 },
  RARE: { id: 'rare', name: 'Rare', color: '#0070DD', expMultiplier: 2 },
  EPIC: { id: 'epic', name: 'Epic', color: '#A335EE', expMultiplier: 3 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#FF8000', expMultiplier: 5 }
};

// Node types and their resources
export const RESOURCE_NODES = {
  // Mining nodes
  copper_vein: {
    id: 'copper_vein',
    name: 'Copper Vein',
    skill: GATHERING_SKILL.MINING,
    requiredLevel: 1,
    baseExp: 10,
    gatherTime: 3000,
    resources: [
      { id: 'copper_ore', chance: 0.9, minAmount: 1, maxAmount: 3 },
      { id: 'rough_stone', chance: 0.4, minAmount: 1, maxAmount: 2 },
      { id: 'small_gem', chance: 0.05, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.25
  },
  iron_vein: {
    id: 'iron_vein',
    name: 'Iron Vein',
    skill: GATHERING_SKILL.MINING,
    requiredLevel: 10,
    baseExp: 20,
    gatherTime: 4000,
    resources: [
      { id: 'iron_ore', chance: 0.85, minAmount: 1, maxAmount: 3 },
      { id: 'coal', chance: 0.3, minAmount: 1, maxAmount: 2 },
      { id: 'jade_chunk', chance: 0.08, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.3
  },
  gold_vein: {
    id: 'gold_vein',
    name: 'Gold Vein',
    skill: GATHERING_SKILL.MINING,
    requiredLevel: 25,
    baseExp: 40,
    gatherTime: 5000,
    resources: [
      { id: 'gold_ore', chance: 0.8, minAmount: 1, maxAmount: 2 },
      { id: 'silver_ore', chance: 0.4, minAmount: 1, maxAmount: 2 },
      { id: 'sapphire', chance: 0.1, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.4
  },
  mythril_vein: {
    id: 'mythril_vein',
    name: 'Mythril Vein',
    skill: GATHERING_SKILL.MINING,
    requiredLevel: 40,
    baseExp: 75,
    gatherTime: 6000,
    resources: [
      { id: 'mythril_ore', chance: 0.75, minAmount: 1, maxAmount: 2 },
      { id: 'diamond', chance: 0.1, minAmount: 1, maxAmount: 1 },
      { id: 'stardust', chance: 0.05, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.5
  },

  // Foraging nodes
  herb_patch: {
    id: 'herb_patch',
    name: 'Herb Patch',
    skill: GATHERING_SKILL.FORAGING,
    requiredLevel: 1,
    baseExp: 8,
    gatherTime: 2000,
    resources: [
      { id: 'common_herb', chance: 0.9, minAmount: 1, maxAmount: 4 },
      { id: 'wildflower', chance: 0.3, minAmount: 1, maxAmount: 2 }
    ],
    depleteChance: 0.2
  },
  mushroom_cluster: {
    id: 'mushroom_cluster',
    name: 'Mushroom Cluster',
    skill: GATHERING_SKILL.FORAGING,
    requiredLevel: 8,
    baseExp: 15,
    gatherTime: 2500,
    resources: [
      { id: 'common_mushroom', chance: 0.85, minAmount: 1, maxAmount: 3 },
      { id: 'glowing_mushroom', chance: 0.15, minAmount: 1, maxAmount: 1 },
      { id: 'poison_cap', chance: 0.1, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.25
  },
  rare_flower: {
    id: 'rare_flower',
    name: 'Rare Flower',
    skill: GATHERING_SKILL.FORAGING,
    requiredLevel: 20,
    baseExp: 30,
    gatherTime: 3500,
    resources: [
      { id: 'moonpetal', chance: 0.6, minAmount: 1, maxAmount: 2 },
      { id: 'sunbloom', chance: 0.4, minAmount: 1, maxAmount: 1 },
      { id: 'starlight_seed', chance: 0.08, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.6
  },
  ancient_root: {
    id: 'ancient_root',
    name: 'Ancient Root',
    skill: GATHERING_SKILL.FORAGING,
    requiredLevel: 35,
    baseExp: 55,
    gatherTime: 4500,
    resources: [
      { id: 'ancient_bark', chance: 0.7, minAmount: 1, maxAmount: 2 },
      { id: 'lifesap', chance: 0.3, minAmount: 1, maxAmount: 1 },
      { id: 'world_tree_splinter', chance: 0.03, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.7
  },

  // Woodcutting nodes
  oak_tree: {
    id: 'oak_tree',
    name: 'Oak Tree',
    skill: GATHERING_SKILL.WOODCUTTING,
    requiredLevel: 1,
    baseExp: 12,
    gatherTime: 4000,
    resources: [
      { id: 'oak_log', chance: 0.95, minAmount: 1, maxAmount: 3 },
      { id: 'acorn', chance: 0.2, minAmount: 1, maxAmount: 3 },
      { id: 'birds_nest', chance: 0.05, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.15
  },
  maple_tree: {
    id: 'maple_tree',
    name: 'Maple Tree',
    skill: GATHERING_SKILL.WOODCUTTING,
    requiredLevel: 15,
    baseExp: 25,
    gatherTime: 5000,
    resources: [
      { id: 'maple_log', chance: 0.9, minAmount: 1, maxAmount: 3 },
      { id: 'maple_syrup', chance: 0.15, minAmount: 1, maxAmount: 1 },
      { id: 'spirit_sap', chance: 0.05, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.2
  },
  ironwood_tree: {
    id: 'ironwood_tree',
    name: 'Ironwood Tree',
    skill: GATHERING_SKILL.WOODCUTTING,
    requiredLevel: 30,
    baseExp: 45,
    gatherTime: 6000,
    resources: [
      { id: 'ironwood_log', chance: 0.85, minAmount: 1, maxAmount: 2 },
      { id: 'hardened_resin', chance: 0.2, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.3
  },
  world_tree_sapling: {
    id: 'world_tree_sapling',
    name: 'World Tree Sapling',
    skill: GATHERING_SKILL.WOODCUTTING,
    requiredLevel: 45,
    baseExp: 80,
    gatherTime: 8000,
    resources: [
      { id: 'world_tree_wood', chance: 0.7, minAmount: 1, maxAmount: 2 },
      { id: 'essence_of_nature', chance: 0.1, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 0.6
  },

  // Skinning (from defeated creatures)
  beast_carcass: {
    id: 'beast_carcass',
    name: 'Beast Carcass',
    skill: GATHERING_SKILL.SKINNING,
    requiredLevel: 1,
    baseExp: 10,
    gatherTime: 3000,
    resources: [
      { id: 'leather_scraps', chance: 0.9, minAmount: 1, maxAmount: 3 },
      { id: 'beast_bone', chance: 0.4, minAmount: 1, maxAmount: 2 },
      { id: 'animal_fat', chance: 0.3, minAmount: 1, maxAmount: 2 }
    ],
    depleteChance: 1.0
  },
  drake_carcass: {
    id: 'drake_carcass',
    name: 'Drake Carcass',
    skill: GATHERING_SKILL.SKINNING,
    requiredLevel: 20,
    baseExp: 35,
    gatherTime: 5000,
    resources: [
      { id: 'drake_scales', chance: 0.8, minAmount: 2, maxAmount: 4 },
      { id: 'drake_fang', chance: 0.3, minAmount: 1, maxAmount: 2 },
      { id: 'fire_gland', chance: 0.15, minAmount: 1, maxAmount: 1 }
    ],
    depleteChance: 1.0
  },
  dragon_carcass: {
    id: 'dragon_carcass',
    name: 'Dragon Carcass',
    skill: GATHERING_SKILL.SKINNING,
    requiredLevel: 40,
    baseExp: 100,
    gatherTime: 10000,
    resources: [
      { id: 'dragon_scale', chance: 0.7, minAmount: 3, maxAmount: 6 },
      { id: 'dragon_heart', chance: 0.2, minAmount: 1, maxAmount: 1 },
      { id: 'dragon_blood', chance: 0.4, minAmount: 1, maxAmount: 2 }
    ],
    depleteChance: 1.0
  }
};

// Tool definitions
export const GATHERING_TOOLS = {
  // Mining tools
  basic_pickaxe: {
    id: 'basic_pickaxe',
    name: 'Basic Pickaxe',
    skill: GATHERING_SKILL.MINING,
    speedBonus: 0,
    yieldBonus: 0,
    rareChanceBonus: 0
  },
  steel_pickaxe: {
    id: 'steel_pickaxe',
    name: 'Steel Pickaxe',
    skill: GATHERING_SKILL.MINING,
    speedBonus: 0.15,
    yieldBonus: 0.1,
    rareChanceBonus: 0.02
  },
  mythril_pickaxe: {
    id: 'mythril_pickaxe',
    name: 'Mythril Pickaxe',
    skill: GATHERING_SKILL.MINING,
    speedBonus: 0.3,
    yieldBonus: 0.2,
    rareChanceBonus: 0.05
  },

  // Foraging tools
  basic_sickle: {
    id: 'basic_sickle',
    name: 'Basic Sickle',
    skill: GATHERING_SKILL.FORAGING,
    speedBonus: 0,
    yieldBonus: 0,
    rareChanceBonus: 0
  },
  silver_sickle: {
    id: 'silver_sickle',
    name: 'Silver Sickle',
    skill: GATHERING_SKILL.FORAGING,
    speedBonus: 0.2,
    yieldBonus: 0.15,
    rareChanceBonus: 0.03
  },

  // Woodcutting tools
  basic_hatchet: {
    id: 'basic_hatchet',
    name: 'Basic Hatchet',
    skill: GATHERING_SKILL.WOODCUTTING,
    speedBonus: 0,
    yieldBonus: 0,
    rareChanceBonus: 0
  },
  steel_axe: {
    id: 'steel_axe',
    name: 'Steel Axe',
    skill: GATHERING_SKILL.WOODCUTTING,
    speedBonus: 0.2,
    yieldBonus: 0.1,
    rareChanceBonus: 0.02
  },

  // Skinning tools
  basic_knife: {
    id: 'basic_knife',
    name: 'Basic Skinning Knife',
    skill: GATHERING_SKILL.SKINNING,
    speedBonus: 0,
    yieldBonus: 0,
    rareChanceBonus: 0
  },
  sharp_knife: {
    id: 'sharp_knife',
    name: 'Sharp Skinning Knife',
    skill: GATHERING_SKILL.SKINNING,
    speedBonus: 0.15,
    yieldBonus: 0.2,
    rareChanceBonus: 0.03
  }
};

/**
 * Initialize gathering state
 */
export function initGatheringState() {
  return {
    skills: {
      mining: { level: 1, exp: 0 },
      foraging: { level: 1, exp: 0 },
      woodcutting: { level: 1, exp: 0 },
      skinning: { level: 1, exp: 0 }
    },
    equippedTools: {
      mining: null,
      foraging: null,
      woodcutting: null,
      skinning: null
    },
    activeGathering: null, // { nodeId, instanceId, startTime, endTime }
    nodeInstances: {}, // instanceId -> { nodeId, depleted, respawnAt }
    gatheringLog: [],
    totalGathered: {},
    dailyBonus: { date: null, bonusUsed: false }
  };
}

/**
 * Get gathering state from game state
 */
export function getGatheringState(state) {
  return state.gathering || initGatheringState();
}

/**
 * Calculate exp needed for next level
 */
export function getExpForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * Get current skill level and progress
 */
export function getSkillProgress(state, skillId) {
  const gatheringState = getGatheringState(state);
  const skill = gatheringState.skills[skillId];
  if (!skill) {
    return { level: 1, exp: 0, expToNext: 100, progress: 0 };
  }
  const expToNext = getExpForLevel(skill.level);
  const progress = Math.min(1, skill.exp / expToNext);
  return {
    level: skill.level,
    exp: skill.exp,
    expToNext,
    progress
  };
}

/**
 * Add experience to a gathering skill
 */
export function addGatheringExp(state, skillId, amount) {
  const gatheringState = getGatheringState(state);
  const skill = gatheringState.skills[skillId];
  if (!skill) {
    return { state, leveledUp: false };
  }

  let newExp = skill.exp + amount;
  let newLevel = skill.level;
  let leveledUp = false;
  const levelsGained = [];

  while (newExp >= getExpForLevel(newLevel)) {
    newExp -= getExpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
    levelsGained.push(newLevel);
  }

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        skills: {
          ...gatheringState.skills,
          [skillId]: { level: newLevel, exp: newExp }
        }
      }
    },
    leveledUp,
    levelsGained,
    newLevel
  };
}

/**
 * Equip a gathering tool
 */
export function equipTool(state, toolId) {
  const tool = GATHERING_TOOLS[toolId];
  if (!tool) {
    return { state, equipped: false, error: 'Invalid tool' };
  }

  const gatheringState = getGatheringState(state);
  const skillId = tool.skill.id;

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        equippedTools: {
          ...gatheringState.equippedTools,
          [skillId]: toolId
        }
      }
    },
    equipped: true,
    tool
  };
}

/**
 * Unequip a gathering tool
 */
export function unequipTool(state, skillId) {
  const gatheringState = getGatheringState(state);

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        equippedTools: {
          ...gatheringState.equippedTools,
          [skillId]: null
        }
      }
    },
    unequipped: true
  };
}

/**
 * Get equipped tool for a skill
 */
export function getEquippedTool(state, skillId) {
  const gatheringState = getGatheringState(state);
  const toolId = gatheringState.equippedTools[skillId];
  return toolId ? GATHERING_TOOLS[toolId] : null;
}

/**
 * Check if player can gather from a node
 */
export function canGatherNode(state, nodeId) {
  const node = RESOURCE_NODES[nodeId];
  if (!node) {
    return { canGather: false, error: 'Invalid node' };
  }

  const gatheringState = getGatheringState(state);
  const skillId = node.skill.id;
  const skill = gatheringState.skills[skillId];

  if (skill.level < node.requiredLevel) {
    return {
      canGather: false,
      error: `Requires ${node.skill.name} level ${node.requiredLevel}`
    };
  }

  if (gatheringState.activeGathering) {
    return { canGather: false, error: 'Already gathering' };
  }

  return { canGather: true };
}

/**
 * Start gathering from a node
 */
export function startGathering(state, nodeId, instanceId = null) {
  const canResult = canGatherNode(state, nodeId);
  if (!canResult.canGather) {
    return { state, started: false, error: canResult.error };
  }

  const node = RESOURCE_NODES[nodeId];
  const gatheringState = getGatheringState(state);
  const tool = getEquippedTool(state, node.skill.id);

  const speedBonus = tool ? tool.speedBonus : 0;
  const gatherTime = Math.floor(node.gatherTime * (1 - speedBonus));

  const now = Date.now();
  const activeGathering = {
    nodeId,
    instanceId: instanceId || `${nodeId}_${now}`,
    startTime: now,
    endTime: now + gatherTime,
    gatherTime
  };

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        activeGathering
      }
    },
    started: true,
    gatherTime,
    endTime: activeGathering.endTime
  };
}

/**
 * Cancel active gathering
 */
export function cancelGathering(state) {
  const gatheringState = getGatheringState(state);

  if (!gatheringState.activeGathering) {
    return { state, cancelled: false, error: 'Not gathering' };
  }

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        activeGathering: null
      }
    },
    cancelled: true
  };
}

/**
 * Complete gathering and get resources
 */
export function completeGathering(state, randomFn = Math.random) {
  const gatheringState = getGatheringState(state);
  const active = gatheringState.activeGathering;

  if (!active) {
    return { state, completed: false, error: 'Not gathering' };
  }

  const now = Date.now();
  if (now < active.endTime) {
    return { state, completed: false, error: 'Gathering not finished' };
  }

  const node = RESOURCE_NODES[active.nodeId];
  const tool = getEquippedTool(state, node.skill.id);
  const yieldBonus = tool ? tool.yieldBonus : 0;
  const rareBonus = tool ? tool.rareChanceBonus : 0;

  // Determine gathered resources
  const gathered = [];
  for (const resource of node.resources) {
    const chance = Math.min(1, resource.chance + rareBonus);
    if (randomFn() <= chance) {
      const baseAmount = Math.floor(
        randomFn() * (resource.maxAmount - resource.minAmount + 1)
      ) + resource.minAmount;
      const amount = Math.max(1, Math.floor(baseAmount * (1 + yieldBonus)));
      gathered.push({ id: resource.id, amount });
    }
  }

  // Calculate exp
  const skillId = node.skill.id;
  const exp = node.baseExp;

  // Check if node depletes
  const depleted = randomFn() <= node.depleteChance;

  // Update total gathered
  const newTotalGathered = { ...gatheringState.totalGathered };
  for (const item of gathered) {
    newTotalGathered[item.id] = (newTotalGathered[item.id] || 0) + item.amount;
  }

  // Add to log
  const logEntry = {
    nodeId: active.nodeId,
    timestamp: now,
    gathered,
    exp
  };

  // Add exp
  let resultState = {
    ...state,
    gathering: {
      ...gatheringState,
      activeGathering: null,
      totalGathered: newTotalGathered,
      gatheringLog: [...gatheringState.gatheringLog.slice(-99), logEntry]
    }
  };

  const expResult = addGatheringExp(resultState, skillId, exp);

  return {
    state: expResult.state,
    completed: true,
    gathered,
    exp,
    depleted,
    leveledUp: expResult.leveledUp,
    newLevel: expResult.newLevel
  };
}

/**
 * Check gathering progress
 */
export function getGatheringProgress(state) {
  const gatheringState = getGatheringState(state);
  const active = gatheringState.activeGathering;

  if (!active) {
    return { isGathering: false };
  }

  const now = Date.now();
  const elapsed = now - active.startTime;
  const total = active.gatherTime;
  const remaining = Math.max(0, active.endTime - now);
  const progress = Math.min(1, elapsed / total);
  const isComplete = now >= active.endTime;

  const node = RESOURCE_NODES[active.nodeId];

  return {
    isGathering: true,
    nodeId: active.nodeId,
    nodeName: node?.name || 'Unknown',
    progress,
    elapsed,
    remaining,
    total,
    isComplete
  };
}

/**
 * Create a node instance in the world
 */
export function createNodeInstance(state, nodeId, locationId) {
  const node = RESOURCE_NODES[nodeId];
  if (!node) {
    return { state, created: false, error: 'Invalid node' };
  }

  const gatheringState = getGatheringState(state);
  const instanceId = `${nodeId}_${locationId}_${Date.now()}`;

  const instance = {
    nodeId,
    locationId,
    depleted: false,
    respawnAt: null
  };

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        nodeInstances: {
          ...gatheringState.nodeInstances,
          [instanceId]: instance
        }
      }
    },
    created: true,
    instanceId
  };
}

/**
 * Deplete a node instance
 */
export function depleteNodeInstance(state, instanceId, respawnTime = 300000) {
  const gatheringState = getGatheringState(state);
  const instance = gatheringState.nodeInstances[instanceId];

  if (!instance) {
    return { state, depleted: false, error: 'Invalid instance' };
  }

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        nodeInstances: {
          ...gatheringState.nodeInstances,
          [instanceId]: {
            ...instance,
            depleted: true,
            respawnAt: Date.now() + respawnTime
          }
        }
      }
    },
    depleted: true,
    respawnAt: Date.now() + respawnTime
  };
}

/**
 * Respawn depleted nodes
 */
export function respawnNodes(state) {
  const gatheringState = getGatheringState(state);
  const now = Date.now();
  let respawned = [];

  const newInstances = { ...gatheringState.nodeInstances };

  for (const [instanceId, instance] of Object.entries(newInstances)) {
    if (instance.depleted && instance.respawnAt && now >= instance.respawnAt) {
      newInstances[instanceId] = {
        ...instance,
        depleted: false,
        respawnAt: null
      };
      respawned.push(instanceId);
    }
  }

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        nodeInstances: newInstances
      }
    },
    respawned
  };
}

/**
 * Get all available nodes at a location
 */
export function getNodesAtLocation(state, locationId) {
  const gatheringState = getGatheringState(state);
  const nodes = [];

  for (const [instanceId, instance] of Object.entries(gatheringState.nodeInstances)) {
    if (instance.locationId === locationId) {
      const node = RESOURCE_NODES[instance.nodeId];
      nodes.push({
        instanceId,
        ...instance,
        node
      });
    }
  }

  return nodes;
}

/**
 * Get gathering statistics
 */
export function getGatheringStats(state) {
  const gatheringState = getGatheringState(state);

  const skills = {};
  for (const [skillId, skill] of Object.entries(gatheringState.skills)) {
    skills[skillId] = {
      ...skill,
      expToNext: getExpForLevel(skill.level)
    };
  }

  return {
    skills,
    totalGathered: gatheringState.totalGathered,
    totalUniqueResources: Object.keys(gatheringState.totalGathered).length,
    recentGathers: gatheringState.gatheringLog.slice(-10)
  };
}

/**
 * Get nodes available for a skill level
 */
export function getAvailableNodes(skillId, level) {
  return Object.values(RESOURCE_NODES)
    .filter(node => node.skill.id === skillId && node.requiredLevel <= level)
    .sort((a, b) => a.requiredLevel - b.requiredLevel);
}

/**
 * Get all nodes for a skill
 */
export function getNodesForSkill(skillId) {
  return Object.values(RESOURCE_NODES)
    .filter(node => node.skill.id === skillId)
    .sort((a, b) => a.requiredLevel - b.requiredLevel);
}

/**
 * Calculate bonus yield from skill level
 */
export function getSkillLevelBonus(level) {
  return {
    speedBonus: Math.min(0.5, (level - 1) * 0.01),
    yieldBonus: Math.min(0.5, (level - 1) * 0.02),
    rareBonus: Math.min(0.1, (level - 1) * 0.005)
  };
}

/**
 * Get daily gathering bonus status
 */
export function getDailyBonusStatus(state) {
  const gatheringState = getGatheringState(state);
  const today = new Date().toDateString();

  if (gatheringState.dailyBonus.date !== today) {
    return { available: true, used: false };
  }

  return {
    available: false,
    used: gatheringState.dailyBonus.bonusUsed
  };
}

/**
 * Use daily gathering bonus
 */
export function useDailyBonus(state) {
  const gatheringState = getGatheringState(state);
  const today = new Date().toDateString();

  if (gatheringState.dailyBonus.date === today && gatheringState.dailyBonus.bonusUsed) {
    return { state, used: false, error: 'Daily bonus already used' };
  }

  return {
    state: {
      ...state,
      gathering: {
        ...gatheringState,
        dailyBonus: {
          date: today,
          bonusUsed: true
        }
      }
    },
    used: true,
    bonusMultiplier: 2
  };
}
