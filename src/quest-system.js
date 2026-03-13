/**
 * Quest System
 * Main quests, side quests, quest chains, objectives, and rewards
 */

// Quest types
export const QUEST_TYPES = {
  MAIN: { name: 'Main Quest', color: '#FFD700', priority: 1 },
  SIDE: { name: 'Side Quest', color: '#87CEEB', priority: 2 },
  DAILY: { name: 'Daily Quest', color: '#90EE90', priority: 3 },
  WEEKLY: { name: 'Weekly Quest', color: '#DDA0DD', priority: 4 },
  EVENT: { name: 'Event Quest', color: '#FF6B6B', priority: 5 },
  HIDDEN: { name: 'Hidden Quest', color: '#808080', priority: 6 }
};

// Quest status
export const QUEST_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// Objective types
export const OBJECTIVE_TYPES = {
  KILL: { name: 'Kill', verb: 'Defeat' },
  COLLECT: { name: 'Collect', verb: 'Gather' },
  TALK: { name: 'Talk', verb: 'Speak with' },
  EXPLORE: { name: 'Explore', verb: 'Discover' },
  DELIVER: { name: 'Deliver', verb: 'Bring' },
  ESCORT: { name: 'Escort', verb: 'Protect' },
  CRAFT: { name: 'Craft', verb: 'Create' },
  USE: { name: 'Use', verb: 'Use' }
};

// Reward types
export const REWARD_TYPES = {
  GOLD: 'gold',
  EXPERIENCE: 'experience',
  ITEM: 'item',
  REPUTATION: 'reputation',
  SKILL_POINT: 'skill_point',
  UNLOCK: 'unlock'
};

// Create initial quest state
export function createQuestState() {
  return {
    quests: {},
    activeQuests: [],
    completedQuests: [],
    failedQuests: [],
    questLog: [],
    stats: {
      totalStarted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      mainQuestsCompleted: 0,
      sideQuestsCompleted: 0
    }
  };
}

// Create a quest definition
export function createQuest(id, name, type, description, objectives, rewards, options = {}) {
  if (!id || !name) {
    return { success: false, error: 'Invalid quest id or name' };
  }

  if (!QUEST_TYPES[type?.toUpperCase()]) {
    return { success: false, error: 'Invalid quest type' };
  }

  if (!Array.isArray(objectives) || objectives.length === 0) {
    return { success: false, error: 'Quest must have at least one objective' };
  }

  return {
    success: true,
    quest: {
      id,
      name,
      type: type.toUpperCase(),
      description,
      objectives: objectives.map((obj, index) => ({
        id: `${id}_obj_${index}`,
        ...obj,
        current: 0,
        completed: false
      })),
      rewards: rewards || [],
      prerequisites: options.prerequisites || [],
      levelRequirement: options.levelRequirement || 1,
      timeLimit: options.timeLimit || null,
      chainId: options.chainId || null,
      chainOrder: options.chainOrder || 0,
      repeatable: options.repeatable || false,
      createdAt: Date.now()
    }
  };
}

// Create a quest registry
export function createQuestRegistry() {
  return {
    quests: {},
    chains: {},
    byType: {}
  };
}

// Register a quest
export function registerQuest(registry, quest) {
  if (!quest || !quest.id) {
    return { success: false, error: 'Invalid quest' };
  }

  if (registry.quests[quest.id]) {
    return { success: false, error: 'Quest already registered' };
  }

  const newQuests = { ...registry.quests, [quest.id]: quest };

  // Index by type
  const newByType = { ...registry.byType };
  newByType[quest.type] = [...(newByType[quest.type] || []), quest.id];

  // Index by chain
  const newChains = { ...registry.chains };
  if (quest.chainId) {
    newChains[quest.chainId] = [...(newChains[quest.chainId] || []), quest.id];
    // Sort by chain order
    newChains[quest.chainId].sort((a, b) => {
      const questA = newQuests[a];
      const questB = newQuests[b];
      return (questA?.chainOrder || 0) - (questB?.chainOrder || 0);
    });
  }

  return {
    success: true,
    registry: {
      quests: newQuests,
      chains: newChains,
      byType: newByType
    }
  };
}

// Check if quest is available
export function isQuestAvailable(state, registry, questId, playerLevel = 1) {
  const quest = registry.quests[questId];
  if (!quest) return false;

  // Already completed or active
  if (state.completedQuests.includes(questId) && !quest.repeatable) {
    return false;
  }
  if (state.activeQuests.includes(questId)) {
    return false;
  }

  // Level requirement
  if (playerLevel < quest.levelRequirement) {
    return false;
  }

  // Prerequisites
  for (const prereq of quest.prerequisites) {
    if (!state.completedQuests.includes(prereq)) {
      return false;
    }
  }

  // Chain order check
  if (quest.chainId && quest.chainOrder > 0) {
    const chainQuests = registry.chains[quest.chainId] || [];
    const previousQuest = chainQuests.find(qId => {
      const q = registry.quests[qId];
      return q && q.chainOrder === quest.chainOrder - 1;
    });
    if (previousQuest && !state.completedQuests.includes(previousQuest)) {
      return false;
    }
  }

  return true;
}

// Accept a quest
export function acceptQuest(state, registry, questId) {
  const quest = registry.quests[questId];
  if (!quest) {
    return { success: false, error: 'Quest not found' };
  }

  if (state.activeQuests.includes(questId)) {
    return { success: false, error: 'Quest already active' };
  }

  if (state.completedQuests.includes(questId) && !quest.repeatable) {
    return { success: false, error: 'Quest already completed' };
  }

  // Create quest instance
  const questInstance = {
    questId,
    status: QUEST_STATUS.ACTIVE,
    objectives: quest.objectives.map(obj => ({
      ...obj,
      current: 0,
      completed: false
    })),
    startedAt: Date.now(),
    expiresAt: quest.timeLimit ? Date.now() + quest.timeLimit : null
  };

  const logEntry = {
    type: 'accepted',
    questId,
    questName: quest.name,
    timestamp: Date.now()
  };

  return {
    success: true,
    questInstance,
    state: {
      ...state,
      quests: {
        ...state.quests,
        [questId]: questInstance
      },
      activeQuests: [...state.activeQuests, questId],
      questLog: [...state.questLog.slice(-99), logEntry],
      stats: {
        ...state.stats,
        totalStarted: state.stats.totalStarted + 1
      }
    }
  };
}

// Abandon a quest
export function abandonQuest(state, questId) {
  if (!state.activeQuests.includes(questId)) {
    return { success: false, error: 'Quest not active' };
  }

  const questInstance = state.quests[questId];
  const newQuests = { ...state.quests };
  delete newQuests[questId];

  const logEntry = {
    type: 'abandoned',
    questId,
    timestamp: Date.now()
  };

  return {
    success: true,
    state: {
      ...state,
      quests: newQuests,
      activeQuests: state.activeQuests.filter(q => q !== questId),
      questLog: [...state.questLog.slice(-99), logEntry]
    }
  };
}

// Update objective progress
export function updateObjective(state, questId, objectiveId, amount = 1) {
  if (!state.activeQuests.includes(questId)) {
    return { success: false, error: 'Quest not active' };
  }

  const questInstance = state.quests[questId];
  if (!questInstance) {
    return { success: false, error: 'Quest instance not found' };
  }

  const objIndex = questInstance.objectives.findIndex(o => o.id === objectiveId);
  if (objIndex === -1) {
    return { success: false, error: 'Objective not found' };
  }

  const objective = questInstance.objectives[objIndex];
  if (objective.completed) {
    return { success: false, error: 'Objective already completed' };
  }

  const newCurrent = Math.min(objective.current + amount, objective.target);
  const justCompleted = newCurrent >= objective.target && !objective.completed;

  const newObjectives = [...questInstance.objectives];
  newObjectives[objIndex] = {
    ...objective,
    current: newCurrent,
    completed: newCurrent >= objective.target
  };

  const newQuestInstance = {
    ...questInstance,
    objectives: newObjectives
  };

  return {
    success: true,
    justCompleted,
    progress: newCurrent,
    target: objective.target,
    state: {
      ...state,
      quests: {
        ...state.quests,
        [questId]: newQuestInstance
      }
    }
  };
}

// Check if all objectives are complete
export function areObjectivesComplete(state, questId) {
  const questInstance = state.quests[questId];
  if (!questInstance) return false;

  return questInstance.objectives.every(obj => obj.completed);
}

// Complete a quest
export function completeQuest(state, registry, questId) {
  if (!state.activeQuests.includes(questId)) {
    return { success: false, error: 'Quest not active' };
  }

  const questInstance = state.quests[questId];
  if (!questInstance) {
    return { success: false, error: 'Quest instance not found' };
  }

  if (!areObjectivesComplete(state, questId)) {
    return { success: false, error: 'Objectives not complete' };
  }

  const quest = registry.quests[questId];
  const newQuests = { ...state.quests };
  delete newQuests[questId];

  const logEntry = {
    type: 'completed',
    questId,
    questName: quest?.name || questId,
    rewards: quest?.rewards || [],
    timestamp: Date.now()
  };

  const isMainQuest = quest?.type === 'MAIN';

  return {
    success: true,
    rewards: quest?.rewards || [],
    state: {
      ...state,
      quests: newQuests,
      activeQuests: state.activeQuests.filter(q => q !== questId),
      completedQuests: [...state.completedQuests, questId],
      questLog: [...state.questLog.slice(-99), logEntry],
      stats: {
        ...state.stats,
        totalCompleted: state.stats.totalCompleted + 1,
        mainQuestsCompleted: state.stats.mainQuestsCompleted + (isMainQuest ? 1 : 0),
        sideQuestsCompleted: state.stats.sideQuestsCompleted + (!isMainQuest ? 1 : 0)
      }
    }
  };
}

// Fail a quest
export function failQuest(state, questId, reason = 'Unknown') {
  if (!state.activeQuests.includes(questId)) {
    return { success: false, error: 'Quest not active' };
  }

  const newQuests = { ...state.quests };
  delete newQuests[questId];

  const logEntry = {
    type: 'failed',
    questId,
    reason,
    timestamp: Date.now()
  };

  return {
    success: true,
    state: {
      ...state,
      quests: newQuests,
      activeQuests: state.activeQuests.filter(q => q !== questId),
      failedQuests: [...state.failedQuests, questId],
      questLog: [...state.questLog.slice(-99), logEntry],
      stats: {
        ...state.stats,
        totalFailed: state.stats.totalFailed + 1
      }
    }
  };
}

// Check for expired quests
export function checkExpiredQuests(state) {
  const now = Date.now();
  const expiredQuests = [];

  for (const questId of state.activeQuests) {
    const questInstance = state.quests[questId];
    if (questInstance?.expiresAt && questInstance.expiresAt < now) {
      expiredQuests.push(questId);
    }
  }

  let newState = state;
  for (const questId of expiredQuests) {
    const result = failQuest(newState, questId, 'Expired');
    if (result.success) {
      newState = result.state;
    }
  }

  return {
    expiredQuests,
    state: newState
  };
}

// Get quest progress
export function getQuestProgress(state, questId) {
  const questInstance = state.quests[questId];
  if (!questInstance) return null;

  const totalObjectives = questInstance.objectives.length;
  const completedObjectives = questInstance.objectives.filter(o => o.completed).length;
  const totalProgress = questInstance.objectives.reduce((sum, o) => sum + o.current, 0);
  const totalTarget = questInstance.objectives.reduce((sum, o) => sum + o.target, 0);

  return {
    questId,
    status: questInstance.status,
    objectives: questInstance.objectives,
    completedObjectives,
    totalObjectives,
    percentComplete: totalTarget > 0 ? Math.round((totalProgress / totalTarget) * 100) : 0,
    startedAt: questInstance.startedAt,
    expiresAt: questInstance.expiresAt,
    timeRemaining: questInstance.expiresAt ? Math.max(0, questInstance.expiresAt - Date.now()) : null
  };
}

// Get available quests
export function getAvailableQuests(state, registry, playerLevel = 1) {
  const available = [];

  for (const questId of Object.keys(registry.quests)) {
    if (isQuestAvailable(state, registry, questId, playerLevel)) {
      available.push(registry.quests[questId]);
    }
  }

  // Sort by priority (main quests first)
  available.sort((a, b) => {
    const priorityA = QUEST_TYPES[a.type]?.priority || 99;
    const priorityB = QUEST_TYPES[b.type]?.priority || 99;
    return priorityA - priorityB;
  });

  return available;
}

// Get active quests
export function getActiveQuests(state, registry) {
  return state.activeQuests.map(questId => ({
    ...registry.quests[questId],
    progress: getQuestProgress(state, questId)
  }));
}

// Get quest chain progress
export function getChainProgress(state, registry, chainId) {
  const chainQuests = registry.chains[chainId];
  if (!chainQuests || chainQuests.length === 0) {
    return null;
  }

  const completed = chainQuests.filter(qId => state.completedQuests.includes(qId)).length;
  const total = chainQuests.length;
  const currentQuest = chainQuests.find(qId =>
    state.activeQuests.includes(qId) || isQuestAvailable(state, registry, qId)
  );

  return {
    chainId,
    completed,
    total,
    percentComplete: Math.round((completed / total) * 100),
    currentQuestId: currentQuest || null,
    isComplete: completed === total
  };
}

// Search quests
export function searchQuests(registry, query) {
  const lowerQuery = query.toLowerCase();

  return Object.values(registry.quests).filter(quest =>
    quest.name.toLowerCase().includes(lowerQuery) ||
    quest.description.toLowerCase().includes(lowerQuery)
  );
}

// Filter quests by type
export function filterQuestsByType(registry, type) {
  const typeKey = type.toUpperCase();
  const questIds = registry.byType[typeKey] || [];
  return questIds.map(id => registry.quests[id]);
}

// Get quest type info
export function getQuestTypeInfo(type) {
  return QUEST_TYPES[type?.toUpperCase()] || null;
}

// Get objective type info
export function getObjectiveTypeInfo(type) {
  return OBJECTIVE_TYPES[type?.toUpperCase()] || null;
}

// Create objective helper
export function createObjective(type, target, targetId, description) {
  if (!OBJECTIVE_TYPES[type?.toUpperCase()]) {
    return { success: false, error: 'Invalid objective type' };
  }

  return {
    success: true,
    objective: {
      type: type.toUpperCase(),
      target: target || 1,
      targetId: targetId || null,
      description: description || ''
    }
  };
}

// Create reward helper
export function createReward(type, amount, itemId = null) {
  return {
    type,
    amount,
    itemId
  };
}

// Get quest log
export function getQuestLog(state, limit = 20) {
  return state.questLog.slice(-limit).reverse();
}

// Get quest stats
export function getQuestStats(state) {
  return {
    ...state.stats,
    activeCount: state.activeQuests.length,
    completedCount: state.completedQuests.length,
    failedCount: state.failedQuests.length,
    completionRate: state.stats.totalStarted > 0
      ? Math.round((state.stats.totalCompleted / state.stats.totalStarted) * 100)
      : 0
  };
}

// Track quest by type
export function trackQuestsByType(state, registry) {
  const tracked = {};

  for (const questId of state.activeQuests) {
    const quest = registry.quests[questId];
    if (quest) {
      if (!tracked[quest.type]) {
        tracked[quest.type] = [];
      }
      tracked[quest.type].push({
        ...quest,
        progress: getQuestProgress(state, questId)
      });
    }
  }

  return tracked;
}
