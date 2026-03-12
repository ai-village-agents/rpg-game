/**
 * Quest System
 * Manages main story, side quests, and objectives
 */

/**
 * Quest types
 */
export const QUEST_TYPES = {
  MAIN: 'main',
  SIDE: 'side',
  DAILY: 'daily',
  REPEATABLE: 'repeatable',
};

/**
 * Quest status
 */
export const QUEST_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Objective types
 */
export const OBJECTIVE_TYPES = {
  KILL: 'kill',
  COLLECT: 'collect',
  TALK: 'talk',
  EXPLORE: 'explore',
  REACH: 'reach',
  ESCORT: 'escort',
  DEFEND: 'defend',
  CRAFT: 'craft',
};

/**
 * Quest data definitions
 */
export const QUEST_DATA = {
  // Main Story
  'awakening': {
    id: 'awakening',
    name: 'The Awakening',
    type: QUEST_TYPES.MAIN,
    icon: '\u2B50',
    description: 'You awaken in a strange world. Find the village elder.',
    chapter: 1,
    requires: [],
    minLevel: 1,
    objectives: [
      { id: 'wake', type: OBJECTIVE_TYPES.EXPLORE, description: 'Explore your surroundings', target: 'starting-area', amount: 1 },
      { id: 'elder', type: OBJECTIVE_TYPES.TALK, description: 'Speak with the village elder', target: 'village-elder', amount: 1 },
    ],
    rewards: { xp: 50, gold: 20 },
    unlocks: ['first-battle'],
  },
  'first-battle': {
    id: 'first-battle',
    name: 'Trial by Combat',
    type: QUEST_TYPES.MAIN,
    icon: '\u2694\uFE0F',
    description: 'Prove yourself in battle against the training dummies.',
    chapter: 1,
    requires: ['awakening'],
    minLevel: 1,
    objectives: [
      { id: 'defeat', type: OBJECTIVE_TYPES.KILL, description: 'Defeat training dummies', target: 'training-dummy', amount: 3 },
    ],
    rewards: { xp: 100, gold: 50, items: ['iron-sword'] },
    unlocks: ['village-defense'],
  },
  'village-defense': {
    id: 'village-defense',
    name: 'Defending the Village',
    type: QUEST_TYPES.MAIN,
    icon: '\uD83D\uDEE1\uFE0F',
    description: 'Goblins are attacking! Help defend the village.',
    chapter: 1,
    requires: ['first-battle'],
    minLevel: 2,
    objectives: [
      { id: 'goblins', type: OBJECTIVE_TYPES.KILL, description: 'Defeat goblin raiders', target: 'goblin', amount: 5 },
      { id: 'boss', type: OBJECTIVE_TYPES.KILL, description: 'Defeat the goblin chief', target: 'goblin-chief', amount: 1 },
    ],
    rewards: { xp: 250, gold: 100, items: ['health-potion', 'health-potion'] },
    unlocks: ['dark-forest'],
  },
  'dark-forest': {
    id: 'dark-forest',
    name: 'Into the Dark Forest',
    type: QUEST_TYPES.MAIN,
    icon: '\uD83C\uDF32',
    description: 'Track the goblins to their hideout in the dark forest.',
    chapter: 2,
    requires: ['village-defense'],
    minLevel: 5,
    objectives: [
      { id: 'enter', type: OBJECTIVE_TYPES.REACH, description: 'Enter the dark forest', target: 'dark-forest-entrance', amount: 1 },
      { id: 'wolves', type: OBJECTIVE_TYPES.KILL, description: 'Clear the wolf pack', target: 'forest-wolf', amount: 3 },
      { id: 'hideout', type: OBJECTIVE_TYPES.EXPLORE, description: 'Find the goblin hideout', target: 'goblin-hideout', amount: 1 },
    ],
    rewards: { xp: 400, gold: 200, items: ['forest-cloak'] },
    unlocks: ['goblin-king'],
  },
  
  // Side Quests
  'herb-gathering': {
    id: 'herb-gathering',
    name: 'Medicinal Herbs',
    type: QUEST_TYPES.SIDE,
    icon: '\uD83C\uDF3F',
    description: 'The healer needs herbs from the forest.',
    chapter: 1,
    requires: ['first-battle'],
    minLevel: 1,
    objectives: [
      { id: 'herbs', type: OBJECTIVE_TYPES.COLLECT, description: 'Gather healing herbs', target: 'healing-herb', amount: 5 },
    ],
    rewards: { xp: 75, gold: 30, items: ['health-potion'] },
    unlocks: [],
  },
  'lost-ring': {
    id: 'lost-ring',
    name: 'The Lost Ring',
    type: QUEST_TYPES.SIDE,
    icon: '\uD83D\uDC8D',
    description: 'A villager lost their ring near the river.',
    chapter: 1,
    requires: ['awakening'],
    minLevel: 1,
    objectives: [
      { id: 'search', type: OBJECTIVE_TYPES.EXPLORE, description: 'Search the riverbank', target: 'riverbank', amount: 1 },
      { id: 'return', type: OBJECTIVE_TYPES.TALK, description: 'Return the ring', target: 'villager-marie', amount: 1 },
    ],
    rewards: { xp: 60, gold: 40 },
    unlocks: [],
  },
  'weapon-upgrade': {
    id: 'weapon-upgrade',
    name: 'Sharper Blades',
    type: QUEST_TYPES.SIDE,
    icon: '\uD83D\uDD28',
    description: 'The blacksmith can upgrade your weapon.',
    chapter: 1,
    requires: ['first-battle'],
    minLevel: 3,
    objectives: [
      { id: 'ore', type: OBJECTIVE_TYPES.COLLECT, description: 'Gather iron ore', target: 'iron-ore', amount: 3 },
      { id: 'smith', type: OBJECTIVE_TYPES.TALK, description: 'Deliver to the blacksmith', target: 'blacksmith', amount: 1 },
    ],
    rewards: { xp: 100, gold: 25, items: ['weapon-upgrade-token'] },
    unlocks: [],
  },
  'escort-merchant': {
    id: 'escort-merchant',
    name: 'Merchant Escort',
    type: QUEST_TYPES.SIDE,
    icon: '\uD83D\uDCB0',
    description: 'Escort the merchant safely to the next town.',
    chapter: 1,
    requires: ['village-defense'],
    minLevel: 4,
    objectives: [
      { id: 'escort', type: OBJECTIVE_TYPES.ESCORT, description: 'Escort the merchant', target: 'merchant-carlo', amount: 1 },
      { id: 'bandits', type: OBJECTIVE_TYPES.KILL, description: 'Defeat any bandits', target: 'bandit', amount: 0 },
    ],
    rewards: { xp: 150, gold: 100 },
    unlocks: [],
  },
  
  // Daily Quests
  'daily-hunt': {
    id: 'daily-hunt',
    name: 'Daily Hunt',
    type: QUEST_TYPES.DAILY,
    icon: '\uD83C\uDFAF',
    description: 'Help thin out the monster population.',
    chapter: 0,
    requires: ['first-battle'],
    minLevel: 1,
    objectives: [
      { id: 'monsters', type: OBJECTIVE_TYPES.KILL, description: 'Defeat any monsters', target: 'any', amount: 10 },
    ],
    rewards: { xp: 50, gold: 30 },
    unlocks: [],
    resetDaily: true,
  },
  'daily-gather': {
    id: 'daily-gather',
    name: 'Daily Gathering',
    type: QUEST_TYPES.DAILY,
    icon: '\uD83C\uDF3E',
    description: 'Gather materials for the village.',
    chapter: 0,
    requires: ['awakening'],
    minLevel: 1,
    objectives: [
      { id: 'materials', type: OBJECTIVE_TYPES.COLLECT, description: 'Gather any materials', target: 'any', amount: 5 },
    ],
    rewards: { xp: 30, gold: 20 },
    unlocks: [],
    resetDaily: true,
  },
};

/**
 * Create quest system state
 * @returns {Object} Quest state
 */
export function createQuestState() {
  return {
    quests: {},
    activeQuests: [],
    completedQuests: [],
    objectiveProgress: {},
    lastDailyReset: null,
  };
}

/**
 * Get quest data by ID
 * @param {string} questId - Quest ID
 * @returns {Object|null} Quest data
 */
export function getQuestData(questId) {
  return QUEST_DATA[questId] || null;
}

/**
 * Get quest status for a specific quest
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @returns {string} Quest status
 */
export function getQuestStatus(state, questId) {
  if (!state || !questId) return QUEST_STATUS.LOCKED;
  
  const questInfo = state.quests[questId];
  if (!questInfo) {
    // Check if available
    const quest = QUEST_DATA[questId];
    if (!quest) return QUEST_STATUS.LOCKED;
    
    // Check requirements
    const reqsMet = quest.requires.every(req => 
      state.completedQuests.includes(req)
    );
    
    return reqsMet ? QUEST_STATUS.AVAILABLE : QUEST_STATUS.LOCKED;
  }
  
  return questInfo.status;
}

/**
 * Check if quest can be started
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @param {number} playerLevel - Player's level
 * @returns {Object} Result with canStart and reason
 */
export function canStartQuest(state, questId, playerLevel = 1) {
  const quest = QUEST_DATA[questId];
  if (!quest) return { canStart: false, reason: 'invalid_quest' };
  
  const status = getQuestStatus(state, questId);
  
  if (status === QUEST_STATUS.ACTIVE) {
    return { canStart: false, reason: 'already_active' };
  }
  
  if (status === QUEST_STATUS.COMPLETED && !quest.resetDaily) {
    return { canStart: false, reason: 'already_completed' };
  }
  
  if (status === QUEST_STATUS.LOCKED) {
    return { canStart: false, reason: 'locked' };
  }
  
  if (playerLevel < quest.minLevel) {
    return { canStart: false, reason: 'level_too_low', required: quest.minLevel };
  }
  
  // Check max active quests
  if (state.activeQuests.length >= 5) {
    return { canStart: false, reason: 'too_many_active' };
  }
  
  return { canStart: true, reason: null };
}

/**
 * Start a quest
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @param {number} playerLevel - Player's level
 * @returns {Object} Result with state and success
 */
export function startQuest(state, questId, playerLevel = 1) {
  const check = canStartQuest(state, questId, playerLevel);
  if (!check.canStart) {
    return { state, success: false, reason: check.reason };
  }
  
  const quest = QUEST_DATA[questId];
  
  // Initialize objective progress
  const objectiveProgress = { ...state.objectiveProgress };
  for (const obj of quest.objectives) {
    objectiveProgress[`${questId}:${obj.id}`] = 0;
  }
  
  return {
    state: {
      ...state,
      quests: {
        ...state.quests,
        [questId]: {
          status: QUEST_STATUS.ACTIVE,
          startedAt: Date.now(),
        },
      },
      activeQuests: [...state.activeQuests, questId],
      objectiveProgress,
    },
    success: true,
    questName: quest.name,
  };
}

/**
 * Abandon a quest
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @returns {Object} Updated state
 */
export function abandonQuest(state, questId) {
  if (!state || !state.activeQuests.includes(questId)) {
    return state;
  }
  
  const quest = QUEST_DATA[questId];
  
  // Clear objective progress
  const objectiveProgress = { ...state.objectiveProgress };
  if (quest) {
    for (const obj of quest.objectives) {
      delete objectiveProgress[`${questId}:${obj.id}`];
    }
  }
  
  return {
    ...state,
    quests: {
      ...state.quests,
      [questId]: {
        status: QUEST_STATUS.AVAILABLE,
        abandonedAt: Date.now(),
      },
    },
    activeQuests: state.activeQuests.filter(q => q !== questId),
    objectiveProgress,
  };
}

/**
 * Update objective progress
 * @param {Object} state - Quest state
 * @param {string} objectiveType - Type of objective
 * @param {string} target - Target ID
 * @param {number} amount - Amount to add
 * @returns {Object} Result with state and any completed objectives
 */
export function updateObjectiveProgress(state, objectiveType, target, amount = 1) {
  if (!state || !state.activeQuests || state.activeQuests.length === 0) {
    return { state, completedObjectives: [] };
  }
  
  const completedObjectives = [];
  const objectiveProgress = { ...state.objectiveProgress };
  
  for (const questId of state.activeQuests) {
    const quest = QUEST_DATA[questId];
    if (!quest) continue;
    
    for (const obj of quest.objectives) {
      if (obj.type !== objectiveType) continue;
      if (obj.target !== target && obj.target !== 'any') continue;
      
      const key = `${questId}:${obj.id}`;
      const currentProgress = objectiveProgress[key] || 0;
      
      if (currentProgress < obj.amount) {
        const newProgress = Math.min(currentProgress + amount, obj.amount);
        objectiveProgress[key] = newProgress;
        
        if (newProgress >= obj.amount) {
          completedObjectives.push({
            questId,
            objectiveId: obj.id,
            description: obj.description,
          });
        }
      }
    }
  }
  
  return {
    state: { ...state, objectiveProgress },
    completedObjectives,
  };
}

/**
 * Get objective progress
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @param {string} objectiveId - Objective ID
 * @returns {number} Current progress
 */
export function getObjectiveProgress(state, questId, objectiveId) {
  if (!state || !state.objectiveProgress) return 0;
  return state.objectiveProgress[`${questId}:${objectiveId}`] || 0;
}

/**
 * Check if all objectives are complete
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @returns {boolean} Whether all objectives are complete
 */
export function areObjectivesComplete(state, questId) {
  const quest = QUEST_DATA[questId];
  if (!quest) return false;
  
  for (const obj of quest.objectives) {
    const progress = getObjectiveProgress(state, questId, obj.id);
    if (progress < obj.amount) return false;
  }
  
  return true;
}

/**
 * Complete a quest
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @returns {Object} Result with state, success, and rewards
 */
export function completeQuest(state, questId) {
  if (!state || !state.activeQuests.includes(questId)) {
    return { state, success: false, reason: 'not_active' };
  }
  
  if (!areObjectivesComplete(state, questId)) {
    return { state, success: false, reason: 'objectives_incomplete' };
  }
  
  const quest = QUEST_DATA[questId];
  if (!quest) return { state, success: false, reason: 'invalid_quest' };
  
  // Clear objective progress
  const objectiveProgress = { ...state.objectiveProgress };
  for (const obj of quest.objectives) {
    delete objectiveProgress[`${questId}:${obj.id}`];
  }
  
  // Update completed quests
  const completedQuests = state.completedQuests.includes(questId)
    ? state.completedQuests
    : [...state.completedQuests, questId];
  
  return {
    state: {
      ...state,
      quests: {
        ...state.quests,
        [questId]: {
          status: QUEST_STATUS.COMPLETED,
          completedAt: Date.now(),
        },
      },
      activeQuests: state.activeQuests.filter(q => q !== questId),
      completedQuests,
      objectiveProgress,
    },
    success: true,
    questName: quest.name,
    rewards: quest.rewards,
    unlocks: quest.unlocks,
  };
}

/**
 * Get all available quests
 * @param {Object} state - Quest state
 * @param {number} playerLevel - Player level
 * @returns {Array} Array of available quests
 */
export function getAvailableQuests(state, playerLevel = 1) {
  const available = [];
  
  for (const [questId, quest] of Object.entries(QUEST_DATA)) {
    const status = getQuestStatus(state, questId);
    
    if (status === QUEST_STATUS.AVAILABLE && playerLevel >= quest.minLevel) {
      available.push({ ...quest, status });
    }
  }
  
  return available;
}

/**
 * Get active quests with progress
 * @param {Object} state - Quest state
 * @returns {Array} Array of active quests with progress
 */
export function getActiveQuestsWithProgress(state) {
  if (!state || !state.activeQuests) return [];
  
  return state.activeQuests.map(questId => {
    const quest = QUEST_DATA[questId];
    if (!quest) return null;
    
    const objectives = quest.objectives.map(obj => ({
      ...obj,
      progress: getObjectiveProgress(state, questId, obj.id),
      complete: getObjectiveProgress(state, questId, obj.id) >= obj.amount,
    }));
    
    const totalProgress = objectives.reduce((sum, obj) => sum + obj.progress, 0);
    const totalRequired = objectives.reduce((sum, obj) => sum + obj.amount, 0);
    
    return {
      ...quest,
      objectives,
      percentComplete: Math.floor((totalProgress / totalRequired) * 100),
      isComplete: areObjectivesComplete(state, questId),
    };
  }).filter(Boolean);
}

/**
 * Get completed quests
 * @param {Object} state - Quest state
 * @returns {Array} Array of completed quest IDs with data
 */
export function getCompletedQuests(state) {
  if (!state || !state.completedQuests) return [];
  
  return state.completedQuests.map(questId => {
    const quest = QUEST_DATA[questId];
    return quest ? { ...quest, status: QUEST_STATUS.COMPLETED } : null;
  }).filter(Boolean);
}

/**
 * Get quests by type
 * @param {string} questType - Quest type
 * @returns {Array} Array of quests of that type
 */
export function getQuestsByType(questType) {
  return Object.values(QUEST_DATA).filter(q => q.type === questType);
}

/**
 * Get quests by chapter
 * @param {number} chapter - Chapter number
 * @returns {Array} Array of quests in that chapter
 */
export function getQuestsByChapter(chapter) {
  return Object.values(QUEST_DATA).filter(q => q.chapter === chapter);
}

/**
 * Reset daily quests
 * @param {Object} state - Quest state
 * @returns {Object} Updated state
 */
export function resetDailyQuests(state) {
  if (!state) return createQuestState();
  
  const dailyQuests = Object.values(QUEST_DATA).filter(q => q.resetDaily);
  const quests = { ...state.quests };
  let completedQuests = [...state.completedQuests];
  
  for (const quest of dailyQuests) {
    if (quests[quest.id]?.status === QUEST_STATUS.COMPLETED) {
      quests[quest.id] = { status: QUEST_STATUS.AVAILABLE };
      completedQuests = completedQuests.filter(q => q !== quest.id);
    }
  }
  
  return {
    ...state,
    quests,
    completedQuests,
    lastDailyReset: Date.now(),
  };
}

/**
 * Get quest chain (prerequisite tree)
 * @param {string} questId - Quest ID
 * @returns {Array} Array of quest IDs in order
 */
export function getQuestChain(questId) {
  const quest = QUEST_DATA[questId];
  if (!quest) return [];
  
  const chain = [];
  const visited = new Set();
  
  function addPrereqs(qId) {
    if (visited.has(qId)) return;
    visited.add(qId);
    
    const q = QUEST_DATA[qId];
    if (!q) return;
    
    for (const req of q.requires) {
      addPrereqs(req);
    }
    chain.push(qId);
  }
  
  addPrereqs(questId);
  return chain;
}

/**
 * Get all quest types
 * @returns {Array} Array of quest type strings
 */
export function getAllQuestTypes() {
  return Object.values(QUEST_TYPES);
}

/**
 * Get all quest data
 * @returns {Object} All quest data
 */
export function getAllQuestData() {
  return QUEST_DATA;
}
