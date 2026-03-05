/**
 * Story Module - Dialog and Quest systems
 * Re-exports all story-related functionality
 */

export {
  DialogState,
  createDialogState,
  startDialog,
  selectChoice,
  continueDialog,
  endDialog,
  evaluateCondition,
  getAvailableChoices,
  getAvailableDialog,
} from './dialog.js';

export {
  QuestStatus,
  ObjectiveStatus,
  createQuestState,
  discoverQuest,
  startQuest,
  updateObjective,
  isStageComplete,
  advanceQuest,
  failQuest,
  getActiveQuests,
  getCurrentStage,
  checkPrerequisites,
} from './quests.js';
