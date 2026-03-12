/**
 * Quest Tracker HUD Module
 * Displays the current active quest objective on the game screen.
 * Shows a compact, minimized view that can be expanded for details.
 */

import { getExplorationQuest } from './data/exploration-quests.js';

/**
 * Initialize quest tracker state
 * @returns {Object} Initial tracker state
 */
export function initQuestTrackerState() {
  return {
    trackedQuestId: null,  // Currently tracked quest ID
    isExpanded: false,     // Whether the tracker is showing full details
    isMinimized: false     // Whether the tracker is hidden
  };
}

/**
 * Set the quest to track
 * @param {Object} state - Game state
 * @param {string} questId - Quest ID to track
 * @returns {Object} Updated state
 */
export function trackQuest(state, questId) {
  if (!state.questTrackerState) {
    state = { ...state, questTrackerState: initQuestTrackerState() };
  }
  
  // Verify quest is active
  if (!state.questState?.activeQuests?.includes(questId)) {
    return state;
  }
  
  return {
    ...state,
    questTrackerState: {
      ...state.questTrackerState,
      trackedQuestId: questId,
      isMinimized: false
    }
  };
}

/**
 * Stop tracking the current quest
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function untrackQuest(state) {
  if (!state.questTrackerState) {
    return state;
  }
  
  return {
    ...state,
    questTrackerState: {
      ...state.questTrackerState,
      trackedQuestId: null
    }
  };
}

/**
 * Toggle tracker expansion state
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function toggleTrackerExpanded(state) {
  if (!state.questTrackerState) {
    state = { ...state, questTrackerState: initQuestTrackerState() };
  }
  
  return {
    ...state,
    questTrackerState: {
      ...state.questTrackerState,
      isExpanded: !state.questTrackerState.isExpanded
    }
  };
}

/**
 * Toggle tracker minimized state
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function toggleTrackerMinimized(state) {
  if (!state.questTrackerState) {
    state = { ...state, questTrackerState: initQuestTrackerState() };
  }
  
  return {
    ...state,
    questTrackerState: {
      ...state.questTrackerState,
      isMinimized: !state.questTrackerState.isMinimized
    }
  };
}

/**
 * Get the current objective text for a tracked quest
 * @param {Object} state - Game state
 * @returns {Object|null} Current objective info or null
 */
export function getTrackedQuestObjective(state) {
  const trackerState = state.questTrackerState;
  if (!trackerState?.trackedQuestId) {
    return null;
  }
  
  const questId = trackerState.trackedQuestId;
  const quest = getExplorationQuest(questId);
  
  if (!quest) {
    return null;
  }
  
  const progress = state.questState?.questProgress?.[questId];
  const stageIndex = progress?.stageIndex ?? 0;
  const currentStage = quest.stages?.[stageIndex];
  
  if (!currentStage) {
    return null;
  }
  
  // Build objective progress text
  const objectives = currentStage.objectives || [];
  const objectiveTexts = objectives.map(obj => {
    const currentProgress = progress?.objectiveProgress?.[obj.id] ?? 0;
    const target = obj.count || 1;
    const completed = currentProgress >= target;
    
    return {
      id: obj.id,
      text: obj.description || obj.id,
      progress: currentProgress,
      target: target,
      completed: completed,
      type: obj.type
    };
  });
  
  return {
    questId: questId,
    questName: quest.name,
    stageName: currentStage.name || `Stage ${stageIndex + 1}`,
    objectives: objectiveTexts,
    stageIndex: stageIndex,
    totalStages: quest.stages?.length || 1
  };
}

/**
 * Auto-track the first active quest if none is tracked
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function autoTrackQuest(state) {
  if (!state.questTrackerState) {
    state = { ...state, questTrackerState: initQuestTrackerState() };
  }
  
  // If already tracking a valid quest, do nothing
  const currentTracked = state.questTrackerState.trackedQuestId;
  if (currentTracked && state.questState?.activeQuests?.includes(currentTracked)) {
    return state;
  }
  
  // Auto-track first active quest
  const activeQuests = state.questState?.activeQuests || [];
  if (activeQuests.length > 0) {
    return trackQuest(state, activeQuests[0]);
  }
  
  return untrackQuest(state);
}

/**
 * Cycle to the next active quest
 * @param {Object} state - Game state
 * @returns {Object} Updated state
 */
export function cycleTrackedQuest(state) {
  const activeQuests = state.questState?.activeQuests || [];
  if (activeQuests.length === 0) {
    return untrackQuest(state);
  }
  
  if (activeQuests.length === 1) {
    return trackQuest(state, activeQuests[0]);
  }
  
  const currentTracked = state.questTrackerState?.trackedQuestId;
  const currentIndex = activeQuests.indexOf(currentTracked);
  const nextIndex = (currentIndex + 1) % activeQuests.length;
  
  return trackQuest(state, activeQuests[nextIndex]);
}
