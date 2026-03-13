/**
 * Quest System - Story and daily quests with objectives and rewards
 */

export const QUEST_TYPES = {
  MAIN: { id: 'main', name: 'Main Quest', icon: '📜', color: '#ffd700' },
  SIDE: { id: 'side', name: 'Side Quest', icon: '📋', color: '#90caf9' },
  DAILY: { id: 'daily', name: 'Daily Quest', icon: '🌅', color: '#a5d6a7' },
  WEEKLY: { id: 'weekly', name: 'Weekly Quest', icon: '📅', color: '#ce93d8' },
  GUILD: { id: 'guild', name: 'Guild Quest', icon: '🏰', color: '#ffab91' }
};

export const OBJECTIVE_TYPES = {
  KILL: { id: 'kill', name: 'Kill', verb: 'Kill' },
  COLLECT: { id: 'collect', name: 'Collect', verb: 'Collect' },
  DELIVER: { id: 'deliver', name: 'Deliver', verb: 'Deliver' },
  EXPLORE: { id: 'explore', name: 'Explore', verb: 'Explore' },
  INTERACT: { id: 'interact', name: 'Interact', verb: 'Talk to' },
  CRAFT: { id: 'craft', name: 'Craft', verb: 'Craft' }
};

export const QUEST_STATUS = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TURNED_IN: 'turned_in',
  FAILED: 'failed'
};

function generateQuestId() {
  return 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function initQuestState(state) {
  return {
    state: {
      ...state,
      quests: {
        available: [],
        active: [],
        completed: [],
        questLog: {},
        stats: { totalCompleted: 0, totalFailed: 0, dailiesCompleted: 0 }
      }
    },
    success: true
  };
}

export function createQuest(options) {
  const {
    name, description, type = 'side', objectives = [], rewards = {},
    level = 1, timeLimit = null, repeatable = false, prerequisiteQuests = []
  } = options;

  if (!name || !description) return { success: false, error: 'Missing name or description' };
  if (objectives.length === 0) return { success: false, error: 'Quest must have objectives' };

  const questType = QUEST_TYPES[type.toUpperCase()];
  if (!questType) return { success: false, error: 'Invalid quest type' };

  const quest = {
    id: generateQuestId(),
    name,
    description,
    type: questType.id,
    typeName: questType.name,
    typeIcon: questType.icon,
    typeColor: questType.color,
    level,
    objectives: objectives.map((obj, idx) => ({
      id: 'obj_' + idx,
      type: obj.type || 'kill',
      target: obj.target,
      targetName: obj.targetName || obj.target,
      required: obj.required || 1,
      current: 0,
      completed: false,
      description: obj.description || ''
    })),
    rewards: {
      gold: rewards.gold || 0,
      experience: rewards.experience || 0,
      items: rewards.items || [],
      reputation: rewards.reputation || 0
    },
    timeLimit,
    startedAt: null,
    expiresAt: null,
    repeatable,
    prerequisiteQuests,
    status: QUEST_STATUS.AVAILABLE,
    createdAt: Date.now()
  };

  return { success: true, quest };
}

export function addQuestToAvailable(state, quest) {
  if (!quest || !quest.id) return { success: false, error: 'Invalid quest' };
  if (state.quests.questLog[quest.id]) return { success: false, error: 'Quest already exists' };

  return {
    success: true,
    state: {
      ...state,
      quests: {
        ...state.quests,
        available: [...state.quests.available, quest.id],
        questLog: { ...state.quests.questLog, [quest.id]: quest }
      }
    }
  };
}

export function acceptQuest(state, questId) {
  const quest = state.quests.questLog[questId];
  if (!quest) return { success: false, error: 'Quest not found' };
  if (quest.status !== QUEST_STATUS.AVAILABLE) return { success: false, error: 'Quest not available' };

  // Check prerequisites
  for (const prereqId of quest.prerequisiteQuests) {
    const prereq = state.quests.questLog[prereqId];
    if (!prereq || prereq.status !== QUEST_STATUS.TURNED_IN) {
      return { success: false, error: 'Prerequisites not met' };
    }
  }

  const now = Date.now();
  const updatedQuest = {
    ...quest,
    status: QUEST_STATUS.ACTIVE,
    startedAt: now,
    expiresAt: quest.timeLimit ? now + quest.timeLimit : null
  };

  return {
    success: true,
    state: {
      ...state,
      quests: {
        ...state.quests,
        available: state.quests.available.filter(id => id !== questId),
        active: [...state.quests.active, questId],
        questLog: { ...state.quests.questLog, [questId]: updatedQuest }
      }
    }
  };
}

export function updateObjective(state, questId, objectiveId, progress = 1) {
  const quest = state.quests.questLog[questId];
  if (!quest) return { success: false, error: 'Quest not found' };
  if (quest.status !== QUEST_STATUS.ACTIVE) return { success: false, error: 'Quest not active' };

  const objIndex = quest.objectives.findIndex(o => o.id === objectiveId);
  if (objIndex === -1) return { success: false, error: 'Objective not found' };

  const obj = quest.objectives[objIndex];
  const newCurrent = Math.min(obj.required, obj.current + progress);
  const completed = newCurrent >= obj.required;

  const updatedObjectives = [...quest.objectives];
  updatedObjectives[objIndex] = { ...obj, current: newCurrent, completed };

  const allComplete = updatedObjectives.every(o => o.completed);
  const updatedQuest = {
    ...quest,
    objectives: updatedObjectives,
    status: allComplete ? QUEST_STATUS.COMPLETED : quest.status
  };

  return {
    success: true,
    state: {
      ...state,
      quests: {
        ...state.quests,
        questLog: { ...state.quests.questLog, [questId]: updatedQuest }
      }
    },
    objectiveCompleted: completed,
    questCompleted: allComplete
  };
}

export function turnInQuest(state, questId) {
  const quest = state.quests.questLog[questId];
  if (!quest) return { success: false, error: 'Quest not found' };
  if (quest.status !== QUEST_STATUS.COMPLETED) return { success: false, error: 'Quest not completed' };

  const updatedQuest = {
    ...quest,
    status: QUEST_STATUS.TURNED_IN,
    completedAt: Date.now()
  };

  const isDaily = quest.type === 'daily';

  return {
    success: true,
    state: {
      ...state,
      quests: {
        ...state.quests,
        active: state.quests.active.filter(id => id !== questId),
        completed: [...state.quests.completed, questId],
        questLog: { ...state.quests.questLog, [questId]: updatedQuest },
        stats: {
          ...state.quests.stats,
          totalCompleted: state.quests.stats.totalCompleted + 1,
          dailiesCompleted: isDaily ? state.quests.stats.dailiesCompleted + 1 : state.quests.stats.dailiesCompleted
        }
      }
    },
    rewards: quest.rewards
  };
}

export function abandonQuest(state, questId) {
  const quest = state.quests.questLog[questId];
  if (!quest) return { success: false, error: 'Quest not found' };
  if (quest.status !== QUEST_STATUS.ACTIVE) return { success: false, error: 'Quest not active' };

  // Reset quest to available if repeatable
  const updatedQuest = quest.repeatable
    ? {
        ...quest,
        status: QUEST_STATUS.AVAILABLE,
        startedAt: null,
        expiresAt: null,
        objectives: quest.objectives.map(o => ({ ...o, current: 0, completed: false }))
      }
    : { ...quest, status: QUEST_STATUS.FAILED };

  const newAvailable = quest.repeatable ? [...state.quests.available, questId] : state.quests.available;

  return {
    success: true,
    state: {
      ...state,
      quests: {
        ...state.quests,
        active: state.quests.active.filter(id => id !== questId),
        available: newAvailable,
        questLog: { ...state.quests.questLog, [questId]: updatedQuest },
        stats: quest.repeatable ? state.quests.stats : {
          ...state.quests.stats,
          totalFailed: state.quests.stats.totalFailed + 1
        }
      }
    }
  };
}

export function getQuest(state, questId) {
  const quest = state.quests.questLog[questId];
  return quest ? { found: true, quest } : { found: false };
}

export function getActiveQuests(state) {
  return state.quests.active.map(id => state.quests.questLog[id]).filter(Boolean);
}

export function getAvailableQuests(state) {
  return state.quests.available.map(id => state.quests.questLog[id]).filter(Boolean);
}

export function getCompletedQuests(state) {
  return state.quests.completed.map(id => state.quests.questLog[id]).filter(Boolean);
}

export function getQuestsByType(state, type, status = null) {
  return Object.values(state.quests.questLog).filter(q => {
    if (q.type !== type) return false;
    if (status && q.status !== status) return false;
    return true;
  });
}

export function checkQuestExpiry(state) {
  const now = Date.now();
  let newState = state;
  const expired = [];

  for (const questId of state.quests.active) {
    const quest = state.quests.questLog[questId];
    if (quest.expiresAt && now > quest.expiresAt) {
      const result = abandonQuest(newState, questId);
      if (result.success) {
        newState = result.state;
        expired.push(questId);
      }
    }
  }

  return { state: newState, expiredQuests: expired };
}

export function getQuestProgress(state, questId) {
  const quest = state.quests.questLog[questId];
  if (!quest) return { found: false };

  const totalRequired = quest.objectives.reduce((sum, o) => sum + o.required, 0);
  const totalCurrent = quest.objectives.reduce((sum, o) => sum + o.current, 0);
  const percent = totalRequired > 0 ? Math.round((totalCurrent / totalRequired) * 100) : 0;

  return {
    found: true,
    questId,
    name: quest.name,
    status: quest.status,
    objectives: quest.objectives,
    progress: percent,
    totalCurrent,
    totalRequired
  };
}

export function getQuestStats(state) {
  return state.quests.stats;
}

export function getAllQuestTypes() {
  return Object.values(QUEST_TYPES);
}

export function getAllObjectiveTypes() {
  return Object.values(OBJECTIVE_TYPES);
}
