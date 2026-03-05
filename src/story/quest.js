/**
 * Quest Module — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Provides quest tracking, objectives, and progression system.
 * Supports main quests, side quests, and nested objectives.
 */

// ── Quest Status Enum ────────────────────────────────────────────────
const QuestStatus = {
  LOCKED: 'locked',         // Not yet available
  AVAILABLE: 'available',   // Can be started
  ACTIVE: 'active',         // Currently in progress
  COMPLETED: 'completed',   // Successfully finished
  FAILED: 'failed'          // Failed (if applicable)
};

// ── Objective Types ──────────────────────────────────────────────────
const ObjectiveType = {
  TALK: 'talk',             // Talk to NPC
  KILL: 'kill',             // Defeat enemies
  COLLECT: 'collect',       // Collect items
  DELIVER: 'deliver',       // Deliver item to NPC
  EXPLORE: 'explore',       // Visit location
  ESCORT: 'escort',         // Protect NPC
  INTERACT: 'interact',     // Use object
  CUSTOM: 'custom'          // Custom objective logic
};

// ── Quest Manager Class ──────────────────────────────────────────────
class QuestManager {
  constructor() {
    this.questDefinitions = new Map();  // Quest templates
    this.activeQuests = new Map();      // Current quest states
    this.completedQuests = new Set();   // Completed quest IDs
    this.failedQuests = new Set();      // Failed quest IDs
    this.questLog = [];                 // History of quest events
    
    // Callbacks
    this.onQuestStart = null;
    this.onQuestComplete = null;
    this.onQuestFail = null;
    this.onObjectiveUpdate = null;
    this.onObjectiveComplete = null;
  }

  /**
   * Register a quest definition
   * @param {Object} quest - Quest definition object
   */
  registerQuest(quest) {
    if (!quest || !quest.id) {
      console.error('Invalid quest definition');
      return false;
    }
    this.questDefinitions.set(quest.id, quest);
    return true;
  }

  /**
   * Register multiple quests at once
   */
  registerQuests(quests) {
    quests.forEach(q => this.registerQuest(q));
  }

  /**
   * Check if a quest is available (prerequisites met)
   */
  isQuestAvailable(questId, gameState = {}) {
    const quest = this.questDefinitions.get(questId);
    if (!quest) return false;

    // Already active or completed
    if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
      return false;
    }

    // Check prerequisites
    if (quest.prerequisites) {
      return this.checkPrerequisites(quest.prerequisites, gameState);
    }

    return true;
  }

  /**
   * Check quest prerequisites
   */
  checkPrerequisites(prereqs, gameState) {
    for (const prereq of prereqs) {
      switch (prereq.type) {
        case 'quest':
          if (!this.completedQuests.has(prereq.questId)) return false;
          break;
        case 'level':
          if ((gameState.level || 1) < prereq.minLevel) return false;
          break;
        case 'item':
          if (!gameState.inventory?.includes(prereq.itemId)) return false;
          break;
        case 'flag':
          if (!gameState.flags?.[prereq.flagId]) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Start a quest
   * @param {string} questId - Quest to start
   * @returns {Object|null} Quest state or null if cannot start
   */
  startQuest(questId) {
    const quest = this.questDefinitions.get(questId);
    if (!quest) {
      console.error(`Quest "${questId}" not found`);
      return null;
    }

    if (this.activeQuests.has(questId)) {
      console.warn(`Quest "${questId}" is already active`);
      return this.activeQuests.get(questId);
    }

    // Create quest state
    const questState = {
      id: questId,
      name: quest.name,
      status: QuestStatus.ACTIVE,
      startTime: Date.now(),
      currentStage: 0,
      objectives: this.initializeObjectives(quest.stages[0]?.objectives || []),
      data: {}  // Quest-specific data
    };

    this.activeQuests.set(questId, questState);
    
    this.logQuestEvent(questId, 'started', quest.name);

    if (this.onQuestStart) {
      this.onQuestStart(questId, quest);
    }

    return questState;
  }

  /**
   * Initialize objective tracking
   */
  initializeObjectives(objectives) {
    return objectives.map((obj, index) => ({
      id: obj.id || `obj_${index}`,
      type: obj.type,
      description: obj.description,
      target: obj.target,
      required: obj.required || 1,
      current: 0,
      completed: false,
      optional: obj.optional || false
    }));
  }

  /**
   * Update objective progress
   * @param {string} questId - Quest ID
   * @param {string} objectiveId - Objective ID  
   * @param {number} amount - Amount to add (default 1)
   */
  updateObjective(questId, objectiveId, amount = 1) {
    const questState = this.activeQuests.get(questId);
    if (!questState) return null;

    const objective = questState.objectives.find(o => o.id === objectiveId);
    if (!objective || objective.completed) return null;

    objective.current = Math.min(objective.current + amount, objective.required);

    if (this.onObjectiveUpdate) {
      this.onObjectiveUpdate(questId, objectiveId, objective);
    }

    // Check if objective is now complete
    if (objective.current >= objective.required) {
      objective.completed = true;
      this.logQuestEvent(questId, 'objective_complete', objective.description);

      if (this.onObjectiveComplete) {
        this.onObjectiveComplete(questId, objectiveId, objective);
      }

      // Check if stage/quest is complete
      this.checkQuestProgress(questId);
    }

    return objective;
  }

  /**
   * Update objective by type and target (convenience method)
   * E.g., updateObjectiveByType('kill', 'goblin', 1) updates all kill-goblin objectives
   */
  updateObjectiveByType(type, target, amount = 1) {
    const results = [];
    
    for (const [questId, questState] of this.activeQuests) {
      for (const objective of questState.objectives) {
        if (objective.type === type && objective.target === target && !objective.completed) {
          const result = this.updateObjective(questId, objective.id, amount);
          if (result) results.push({ questId, objective: result });
        }
      }
    }

    return results;
  }

  /**
   * Check if quest stage or entire quest is complete
   */
  checkQuestProgress(questId) {
    const questState = this.activeQuests.get(questId);
    const quest = this.questDefinitions.get(questId);
    if (!questState || !quest) return;

    // Check if all required objectives for current stage are complete
    const requiredObjectives = questState.objectives.filter(o => !o.optional);
    const allComplete = requiredObjectives.every(o => o.completed);

    if (!allComplete) return;

    // Advance to next stage or complete quest
    const nextStageIndex = questState.currentStage + 1;
    
    if (nextStageIndex < quest.stages.length) {
      // Advance to next stage
      questState.currentStage = nextStageIndex;
      questState.objectives = this.initializeObjectives(quest.stages[nextStageIndex].objectives);
      this.logQuestEvent(questId, 'stage_advance', `Stage ${nextStageIndex + 1}`);
    } else {
      // Quest complete!
      this.completeQuest(questId);
    }
  }

  /**
   * Complete a quest
   */
  completeQuest(questId) {
    const questState = this.activeQuests.get(questId);
    const quest = this.questDefinitions.get(questId);
    if (!questState) return null;

    questState.status = QuestStatus.COMPLETED;
    questState.endTime = Date.now();

    this.completedQuests.add(questId);
    this.activeQuests.delete(questId);

    this.logQuestEvent(questId, 'completed', quest?.name || questId);

    if (this.onQuestComplete) {
      this.onQuestComplete(questId, quest?.rewards || {});
    }

    return quest?.rewards || {};
  }

  /**
   * Fail a quest
   */
  failQuest(questId, reason = '') {
    const questState = this.activeQuests.get(questId);
    const quest = this.questDefinitions.get(questId);
    if (!questState) return;

    questState.status = QuestStatus.FAILED;
    questState.endTime = Date.now();
    questState.failReason = reason;

    this.failedQuests.add(questId);
    this.activeQuests.delete(questId);

    this.logQuestEvent(questId, 'failed', reason);

    if (this.onQuestFail) {
      this.onQuestFail(questId, reason);
    }
  }

  /**
   * Get all available quests
   */
  getAvailableQuests(gameState = {}) {
    const available = [];
    for (const [questId, quest] of this.questDefinitions) {
      if (this.isQuestAvailable(questId, gameState)) {
        available.push(quest);
      }
    }
    return available;
  }

  /**
   * Get all active quests
   */
  getActiveQuests() {
    return Array.from(this.activeQuests.values());
  }

  /**
   * Get a specific quest state
   */
  getQuestState(questId) {
    return this.activeQuests.get(questId) || null;
  }

  /**
   * Get quest definition
   */
  getQuestDefinition(questId) {
    return this.questDefinitions.get(questId) || null;
  }

  /**
   * Check if quest is completed
   */
  isQuestCompleted(questId) {
    return this.completedQuests.has(questId);
  }

  /**
   * Log a quest event
   */
  logQuestEvent(questId, eventType, details) {
    this.questLog.push({
      questId,
      eventType,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      activeQuests: Object.fromEntries(this.activeQuests),
      completedQuests: Array.from(this.completedQuests),
      failedQuests: Array.from(this.failedQuests),
      questLog: this.questLog
    };
  }

  /**
   * Restore state from save
   */
  restoreState(state) {
    if (!state) return;

    this.activeQuests = new Map(Object.entries(state.activeQuests || {}));
    this.completedQuests = new Set(state.completedQuests || []);
    this.failedQuests = new Set(state.failedQuests || []);
    this.questLog = state.questLog || [];
  }
}

// ── Factory Functions ────────────────────────────────────────────────

/**
 * Create a new QuestManager instance
 */
function createQuestManager() {
  return new QuestManager();
}

/**
 * Create a quest definition
 */
function createQuest(id, name, options = {}) {
  return {
    id,
    name,
    description: options.description || '',
    type: options.type || 'side',  // 'main' or 'side'
    giver: options.giver || null,  // NPC who gives quest
    stages: options.stages || [],
    rewards: options.rewards || {},
    prerequisites: options.prerequisites || [],
    repeatable: options.repeatable || false,
    timeLimit: options.timeLimit || null  // null = no limit
  };
}

/**
 * Create a quest stage
 */
function createStage(description, objectives) {
  return { description, objectives };
}

/**
 * Create an objective
 */
function createObjective(type, description, options = {}) {
  return {
    id: options.id || null,
    type,
    description,
    target: options.target || null,
    required: options.required || 1,
    optional: options.optional || false
  };
}

// ── Exports ──────────────────────────────────────────────────────────
export {
  QuestManager,
  QuestStatus,
  ObjectiveType,
  createQuestManager,
  createQuest,
  createStage,
  createObjective
};
