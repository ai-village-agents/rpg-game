/**
 * Quest System for tracking player objectives
 * Supports multi-stage quests with objectives and rewards
 */

export const QuestStatus = {
  UNKNOWN: 'unknown',
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ObjectiveStatus = {
  INCOMPLETE: 'incomplete',
  COMPLETE: 'complete',
};

/**
 * Creates a new quest state tracker
 */
export function createQuestState() {
  return {
    quests: {},
    completedQuests: [],
    activeQuestIds: [],
  };
}

/**
 * Gets quest instance from state, creating if needed
 */
function getOrCreateQuestInstance(questState, questDef) {
  if (questState.quests[questDef.id]) {
    return questState.quests[questDef.id];
  }

  return {
    id: questDef.id,
    status: QuestStatus.UNKNOWN,
    currentStage: 0,
    objectives: questDef.stages[0].objectives.map(obj => ({
      id: obj.id,
      status: ObjectiveStatus.INCOMPLETE,
      progress: 0,
      target: obj.target || 1,
    })),
    startedAt: null,
    completedAt: null,
  };
}

/**
 * Makes a quest available to the player
 */
export function discoverQuest(questState, questDef) {
  const instance = getOrCreateQuestInstance(questState, questDef);

  if (instance.status !== QuestStatus.UNKNOWN) {
    return questState;
  }

  return {
    ...questState,
    quests: {
      ...questState.quests,
      [questDef.id]: {
        ...instance,
        status: QuestStatus.AVAILABLE,
      },
    },
  };
}

/**
 * Starts a quest (moves from available to active)
 */
export function startQuest(questState, questDef) {
  const instance = getOrCreateQuestInstance(questState, questDef);

  if (instance.status !== QuestStatus.AVAILABLE && instance.status !== QuestStatus.UNKNOWN) {
    return questState;
  }

  const newInstance = {
    ...instance,
    status: QuestStatus.ACTIVE,
    startedAt: Date.now(),
    objectives: questDef.stages[0].objectives.map(obj => ({
      id: obj.id,
      status: ObjectiveStatus.INCOMPLETE,
      progress: 0,
      target: obj.target || 1,
    })),
  };

  return {
    ...questState,
    quests: {
      ...questState.quests,
      [questDef.id]: newInstance,
    },
    activeQuestIds: [...questState.activeQuestIds, questDef.id],
  };
}

/**
 * Updates progress on a quest objective
 */
export function updateObjective(questState, questId, objectiveId, amount = 1) {
  const instance = questState.quests[questId];
  if (!instance || instance.status !== QuestStatus.ACTIVE) {
    return questState;
  }

  const newObjectives = instance.objectives.map(obj => {
    if (obj.id !== objectiveId) return obj;

    const newProgress = Math.min(obj.progress + amount, obj.target);
    return {
      ...obj,
      progress: newProgress,
      status: newProgress >= obj.target ? ObjectiveStatus.COMPLETE : ObjectiveStatus.INCOMPLETE,
    };
  });

  return {
    ...questState,
    quests: {
      ...questState.quests,
      [questId]: {
        ...instance,
        objectives: newObjectives,
      },
    },
  };
}

/**
 * Checks if all objectives in current stage are complete
 */
export function isStageComplete(questState, questId) {
  const instance = questState.quests[questId];
  if (!instance) return false;

  return instance.objectives.every(obj => obj.status === ObjectiveStatus.COMPLETE);
}

/**
 * Advances quest to next stage or completes it
 */
export function advanceQuest(questState, questDef) {
  const instance = questState.quests[questDef.id];
  if (!instance || instance.status !== QuestStatus.ACTIVE) {
    return { state: questState, rewards: null, completed: false };
  }

  if (!isStageComplete(questState, questDef.id)) {
    return { state: questState, rewards: null, completed: false };
  }

  const nextStage = instance.currentStage + 1;

  // Quest complete
  if (nextStage >= questDef.stages.length) {
    const newState = {
      ...questState,
      quests: {
        ...questState.quests,
        [questDef.id]: {
          ...instance,
          status: QuestStatus.COMPLETED,
          completedAt: Date.now(),
        },
      },
      completedQuests: [...questState.completedQuests, questDef.id],
      activeQuestIds: questState.activeQuestIds.filter(id => id !== questDef.id),
    };

    return { state: newState, rewards: questDef.rewards, completed: true };
  }

  // Advance to next stage
  const nextStageDef = questDef.stages[nextStage];
  const newState = {
    ...questState,
    quests: {
      ...questState.quests,
      [questDef.id]: {
        ...instance,
        currentStage: nextStage,
        objectives: nextStageDef.objectives.map(obj => ({
          id: obj.id,
          status: ObjectiveStatus.INCOMPLETE,
          progress: 0,
          target: obj.target || 1,
        })),
      },
    },
  };

  return { state: newState, rewards: nextStageDef.rewards || null, completed: false };
}

/**
 * Fails a quest
 */
export function failQuest(questState, questId) {
  const instance = questState.quests[questId];
  if (!instance || instance.status !== QuestStatus.ACTIVE) {
    return questState;
  }

  return {
    ...questState,
    quests: {
      ...questState.quests,
      [questId]: {
        ...instance,
        status: QuestStatus.FAILED,
        completedAt: Date.now(),
      },
    },
    activeQuestIds: questState.activeQuestIds.filter(id => id !== questId),
  };
}

/**
 * Gets all active quests with their definitions
 */
export function getActiveQuests(questState, questDefinitions) {
  return questState.activeQuestIds
    .map(id => ({
      instance: questState.quests[id],
      definition: questDefinitions[id],
    }))
    .filter(q => q.definition);
}

/**
 * Gets current stage info for a quest
 */
export function getCurrentStage(questState, questDef) {
  const instance = questState.quests[questDef.id];
  if (!instance) return null;

  return {
    stage: questDef.stages[instance.currentStage],
    objectives: instance.objectives,
    stageNumber: instance.currentStage + 1,
    totalStages: questDef.stages.length,
  };
}

/**
 * Checks if a quest is available based on prerequisites
 */
export function checkPrerequisites(questDef, questState, gameState = {}) {
  if (!questDef.prerequisites) return true;

  const { requiredQuests = [], requiredFlags = [], requiredLevel = 1 } = questDef.prerequisites;

  // Check completed quests
  if (!requiredQuests.every(qid => questState.completedQuests.includes(qid))) {
    return false;
  }

  // Check flags
  if (!requiredFlags.every(flag => gameState.flags?.[flag])) {
    return false;
  }

  // Check level
  if (gameState.player?.level < requiredLevel) {
    return false;
  }

  return true;
}
