/**
 * Quest System Tests
 * Tests quest state management, objectives, completion, and UI components
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  QUEST_TYPES,
  QUEST_STATUS,
  OBJECTIVE_TYPES,
  QUEST_DATA,
  createQuestState,
  getQuestData,
  getQuestStatus,
  canStartQuest,
  startQuest,
  abandonQuest,
  updateObjectiveProgress,
  getObjectiveProgress,
  areObjectivesComplete,
  completeQuest,
  getAvailableQuests,
  getActiveQuestsWithProgress,
  getCompletedQuests,
  getQuestsByType,
  getQuestsByChapter,
  resetDailyQuests,
  getQuestChain,
  getAllQuestTypes,
  getAllQuestData,
} from '../src/quest-system.js';

import {
  getQuestStyles,
  renderQuestPanel,
  renderQuestDetails,
  renderQuestTracker,
  renderQuestStartedNotice,
  renderQuestCompletedNotice,
  renderObjectiveCompletedNotice,
} from '../src/quest-system-ui.js';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Quest Constants', () => {
  test('QUEST_TYPES has all expected types', () => {
    assert.strictEqual(QUEST_TYPES.MAIN, 'main');
    assert.strictEqual(QUEST_TYPES.SIDE, 'side');
    assert.strictEqual(QUEST_TYPES.DAILY, 'daily');
    assert.strictEqual(QUEST_TYPES.REPEATABLE, 'repeatable');
  });

  test('QUEST_STATUS has all expected statuses', () => {
    assert.strictEqual(QUEST_STATUS.LOCKED, 'locked');
    assert.strictEqual(QUEST_STATUS.AVAILABLE, 'available');
    assert.strictEqual(QUEST_STATUS.ACTIVE, 'active');
    assert.strictEqual(QUEST_STATUS.COMPLETED, 'completed');
    assert.strictEqual(QUEST_STATUS.FAILED, 'failed');
  });

  test('OBJECTIVE_TYPES has all expected types', () => {
    assert.strictEqual(OBJECTIVE_TYPES.KILL, 'kill');
    assert.strictEqual(OBJECTIVE_TYPES.COLLECT, 'collect');
    assert.strictEqual(OBJECTIVE_TYPES.TALK, 'talk');
    assert.strictEqual(OBJECTIVE_TYPES.EXPLORE, 'explore');
    assert.strictEqual(OBJECTIVE_TYPES.REACH, 'reach');
    assert.strictEqual(OBJECTIVE_TYPES.ESCORT, 'escort');
    assert.strictEqual(OBJECTIVE_TYPES.DEFEND, 'defend');
    assert.strictEqual(OBJECTIVE_TYPES.CRAFT, 'craft');
  });
});

// ============================================================================
// Quest Data Validation Tests
// ============================================================================

describe('Quest Data Validation', () => {
  test('All quests have required fields', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      assert.strictEqual(quest.id, id, `Quest ${id} id mismatch`);
      assert.ok(quest.name, `Quest ${id} missing name`);
      assert.ok(quest.type, `Quest ${id} missing type`);
      assert.ok(quest.description, `Quest ${id} missing description`);
      assert.ok(Array.isArray(quest.objectives), `Quest ${id} missing objectives`);
      assert.ok(Array.isArray(quest.requires), `Quest ${id} missing requires`);
      assert.ok(quest.rewards, `Quest ${id} missing rewards`);
      assert.ok(typeof quest.minLevel === 'number', `Quest ${id} missing minLevel`);
    }
  });

  test('All objectives have required fields', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      for (const obj of quest.objectives) {
        assert.ok(obj.id, `Quest ${id} objective missing id`);
        assert.ok(obj.type, `Quest ${id} objective missing type`);
        assert.ok(obj.description, `Quest ${id} objective missing description`);
        assert.ok(obj.target, `Quest ${id} objective missing target`);
        assert.ok(typeof obj.amount === 'number', `Quest ${id} objective missing amount`);
      }
    }
  });

  test('Quest requirements reference valid quests', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      for (const req of quest.requires) {
        assert.ok(QUEST_DATA[req], `Quest ${id} requires unknown quest: ${req}`);
      }
    }
  });

  test('Quest unlocks array exists for all quests', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      assert.ok(Array.isArray(quest.unlocks), `Quest ${id} should have unlocks array`);
    }
  });

  test('Main story has correct chain', () => {
    const awakening = QUEST_DATA['awakening'];
    assert.deepStrictEqual(awakening.requires, []);
    assert.ok(awakening.unlocks.includes('first-battle'));
    
    const firstBattle = QUEST_DATA['first-battle'];
    assert.ok(firstBattle.requires.includes('awakening'));
  });
});

// ============================================================================
// Quest State Tests
// ============================================================================

describe('Quest State Management', () => {
  test('createQuestState returns valid initial state', () => {
    const state = createQuestState();
    assert.deepStrictEqual(state.quests, {});
    assert.deepStrictEqual(state.activeQuests, []);
    assert.deepStrictEqual(state.completedQuests, []);
    assert.deepStrictEqual(state.objectiveProgress, {});
    assert.strictEqual(state.lastDailyReset, null);
  });

  test('getQuestData returns quest by ID', () => {
    const quest = getQuestData('awakening');
    assert.strictEqual(quest.name, 'The Awakening');
  });

  test('getQuestData returns null for invalid ID', () => {
    assert.strictEqual(getQuestData('invalid'), null);
  });

  test('getAllQuestTypes returns all types', () => {
    const types = getAllQuestTypes();
    assert.ok(types.includes('main'));
    assert.ok(types.includes('side'));
    assert.ok(types.includes('daily'));
  });

  test('getAllQuestData returns complete data', () => {
    const data = getAllQuestData();
    assert.ok(data['awakening']);
    assert.ok(data['first-battle']);
  });
});

// ============================================================================
// Quest Status Tests
// ============================================================================

describe('Quest Status', () => {
  test('Initial quest with no requirements is available', () => {
    const state = createQuestState();
    const status = getQuestStatus(state, 'awakening');
    assert.strictEqual(status, QUEST_STATUS.AVAILABLE);
  });

  test('Quest with unmet requirements is locked', () => {
    const state = createQuestState();
    const status = getQuestStatus(state, 'first-battle');
    assert.strictEqual(status, QUEST_STATUS.LOCKED);
  });

  test('Quest becomes available when requirements met', () => {
    let state = createQuestState();
    state = { ...state, completedQuests: ['awakening'] };
    const status = getQuestStatus(state, 'first-battle');
    assert.strictEqual(status, QUEST_STATUS.AVAILABLE);
  });

  test('Active quest returns active status', () => {
    let state = createQuestState();
    const result = startQuest(state, 'awakening', 1);
    const status = getQuestStatus(result.state, 'awakening');
    assert.strictEqual(status, QUEST_STATUS.ACTIVE);
  });

  test('Invalid quest returns locked', () => {
    const state = createQuestState();
    assert.strictEqual(getQuestStatus(state, 'invalid'), QUEST_STATUS.LOCKED);
  });

  test('Null state returns locked', () => {
    assert.strictEqual(getQuestStatus(null, 'awakening'), QUEST_STATUS.LOCKED);
  });
});

// ============================================================================
// Starting Quests Tests
// ============================================================================

describe('Starting Quests', () => {
  test('canStartQuest returns true for available quest', () => {
    const state = createQuestState();
    const result = canStartQuest(state, 'awakening', 1);
    assert.strictEqual(result.canStart, true);
    assert.strictEqual(result.reason, null);
  });

  test('canStartQuest fails for locked quest', () => {
    const state = createQuestState();
    const result = canStartQuest(state, 'first-battle', 1);
    assert.strictEqual(result.canStart, false);
    assert.strictEqual(result.reason, 'locked');
  });

  test('canStartQuest fails for invalid quest', () => {
    const state = createQuestState();
    const result = canStartQuest(state, 'invalid', 1);
    assert.strictEqual(result.canStart, false);
    assert.strictEqual(result.reason, 'invalid_quest');
  });

  test('canStartQuest fails for level too low', () => {
    let state = createQuestState();
    state = { ...state, completedQuests: ['awakening', 'first-battle', 'village-defense'] };
    const result = canStartQuest(state, 'dark-forest', 1);
    assert.strictEqual(result.canStart, false);
    assert.strictEqual(result.reason, 'level_too_low');
    assert.strictEqual(result.required, 5);
  });

  test('canStartQuest fails when too many active', () => {
    let state = createQuestState();
    state = { ...state, activeQuests: ['a', 'b', 'c', 'd', 'e'] };
    const result = canStartQuest(state, 'awakening', 1);
    assert.strictEqual(result.canStart, false);
    assert.strictEqual(result.reason, 'too_many_active');
  });

  test('startQuest successfully starts quest', () => {
    const state = createQuestState();
    const result = startQuest(state, 'awakening', 1);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.questName, 'The Awakening');
    assert.ok(result.state.activeQuests.includes('awakening'));
    assert.strictEqual(result.state.quests['awakening'].status, QUEST_STATUS.ACTIVE);
  });

  test('startQuest initializes objective progress', () => {
    const state = createQuestState();
    const result = startQuest(state, 'awakening', 1);
    assert.strictEqual(result.state.objectiveProgress['awakening:wake'], 0);
    assert.strictEqual(result.state.objectiveProgress['awakening:elder'], 0);
  });

  test('startQuest fails for locked quest', () => {
    const state = createQuestState();
    const result = startQuest(state, 'first-battle', 1);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'locked');
  });

  test('startQuest fails for already active quest', () => {
    let state = createQuestState();
    const first = startQuest(state, 'awakening', 1);
    const second = startQuest(first.state, 'awakening', 1);
    assert.strictEqual(second.success, false);
    assert.strictEqual(second.reason, 'already_active');
  });
});

// ============================================================================
// Abandoning Quests Tests
// ============================================================================

describe('Abandoning Quests', () => {
  test('abandonQuest removes from active quests', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state = abandonQuest(state, 'awakening');
    assert.ok(!state.activeQuests.includes('awakening'));
  });

  test('abandonQuest sets status to available', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state = abandonQuest(state, 'awakening');
    assert.strictEqual(state.quests['awakening'].status, QUEST_STATUS.AVAILABLE);
  });

  test('abandonQuest clears objective progress', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state = abandonQuest(state, 'awakening');
    assert.strictEqual(state.objectiveProgress['awakening:wake'], undefined);
  });

  test('abandonQuest does nothing for inactive quest', () => {
    const state = createQuestState();
    const result = abandonQuest(state, 'awakening');
    assert.deepStrictEqual(result, state);
  });

  test('abandonQuest handles null state', () => {
    assert.strictEqual(abandonQuest(null, 'awakening'), null);
  });
});

// ============================================================================
// Objective Progress Tests
// ============================================================================

describe('Objective Progress', () => {
  test('updateObjectiveProgress increments correct objective', () => {
    let state = createQuestState();
    state = startQuest(state, 'first-battle', 1).state;
    state = { ...state, completedQuests: ['awakening'], activeQuests: ['first-battle'] };
    state = startQuest({ ...createQuestState(), completedQuests: ['awakening'] }, 'first-battle', 1).state;
    
    const result = updateObjectiveProgress(state, OBJECTIVE_TYPES.KILL, 'training-dummy', 1);
    assert.strictEqual(result.state.objectiveProgress['first-battle:defeat'], 1);
  });

  test('updateObjectiveProgress caps at required amount', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening'] };
    state = startQuest(state, 'first-battle', 1).state;
    
    // Add more than required
    let result = updateObjectiveProgress(state, OBJECTIVE_TYPES.KILL, 'training-dummy', 10);
    assert.strictEqual(result.state.objectiveProgress['first-battle:defeat'], 3);
  });

  test('updateObjectiveProgress tracks completed objectives', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening'] };
    state = startQuest(state, 'first-battle', 1).state;
    
    const result = updateObjectiveProgress(state, OBJECTIVE_TYPES.KILL, 'training-dummy', 3);
    assert.strictEqual(result.completedObjectives.length, 1);
    assert.strictEqual(result.completedObjectives[0].questId, 'first-battle');
    assert.strictEqual(result.completedObjectives[0].objectiveId, 'defeat');
  });

  test('updateObjectiveProgress handles any target', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening', 'first-battle'] };
    state = startQuest(state, 'daily-hunt', 1).state;
    
    const result = updateObjectiveProgress(state, OBJECTIVE_TYPES.KILL, 'any-monster', 1);
    assert.strictEqual(result.state.objectiveProgress['daily-hunt:monsters'], 1);
  });

  test('updateObjectiveProgress ignores wrong type', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening'] };
    state = startQuest(state, 'first-battle', 1).state;
    
    const result = updateObjectiveProgress(state, OBJECTIVE_TYPES.COLLECT, 'training-dummy', 1);
    assert.strictEqual(result.state.objectiveProgress['first-battle:defeat'], 0);
  });

  test('updateObjectiveProgress handles empty state', () => {
    const result = updateObjectiveProgress(null, OBJECTIVE_TYPES.KILL, 'target', 1);
    assert.deepStrictEqual(result.completedObjectives, []);
  });

  test('getObjectiveProgress returns current progress', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    
    assert.strictEqual(getObjectiveProgress(state, 'awakening', 'wake'), 1);
  });

  test('getObjectiveProgress returns 0 for missing progress', () => {
    const state = createQuestState();
    assert.strictEqual(getObjectiveProgress(state, 'awakening', 'wake'), 0);
  });
});

// ============================================================================
// Completing Quests Tests
// ============================================================================

describe('Completing Quests', () => {
  test('areObjectivesComplete returns true when all complete', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    
    assert.strictEqual(areObjectivesComplete(state, 'awakening'), true);
  });

  test('areObjectivesComplete returns false when incomplete', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 0;
    
    assert.strictEqual(areObjectivesComplete(state, 'awakening'), false);
  });

  test('areObjectivesComplete returns false for invalid quest', () => {
    const state = createQuestState();
    assert.strictEqual(areObjectivesComplete(state, 'invalid'), false);
  });

  test('completeQuest succeeds when objectives complete', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    
    const result = completeQuest(state, 'awakening');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.questName, 'The Awakening');
    assert.deepStrictEqual(result.rewards, { xp: 50, gold: 20 });
    assert.deepStrictEqual(result.unlocks, ['first-battle']);
  });

  test('completeQuest removes from active and adds to completed', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    
    const result = completeQuest(state, 'awakening');
    assert.ok(!result.state.activeQuests.includes('awakening'));
    assert.ok(result.state.completedQuests.includes('awakening'));
  });

  test('completeQuest clears objective progress', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    
    const result = completeQuest(state, 'awakening');
    assert.strictEqual(result.state.objectiveProgress['awakening:wake'], undefined);
  });

  test('completeQuest fails for inactive quest', () => {
    const state = createQuestState();
    const result = completeQuest(state, 'awakening');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'not_active');
  });

  test('completeQuest fails for incomplete objectives', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    
    const result = completeQuest(state, 'awakening');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'objectives_incomplete');
  });
});

// ============================================================================
// Quest Listing Tests
// ============================================================================

describe('Quest Listing Functions', () => {
  test('getAvailableQuests returns available quests', () => {
    const state = createQuestState();
    const available = getAvailableQuests(state, 1);
    assert.ok(available.some(q => q.id === 'awakening'));
  });

  test('getAvailableQuests filters by level', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening', 'first-battle', 'village-defense'] };
    const available = getAvailableQuests(state, 1);
    assert.ok(!available.some(q => q.id === 'dark-forest'));
  });

  test('getActiveQuestsWithProgress returns active quests', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    const active = getActiveQuestsWithProgress(state);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, 'awakening');
  });

  test('getActiveQuestsWithProgress includes progress data', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    
    const active = getActiveQuestsWithProgress(state);
    assert.ok(active[0].objectives[0].complete);
    assert.ok(active[0].percentComplete > 0);
  });

  test('getCompletedQuests returns completed quests', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    state = completeQuest(state, 'awakening').state;
    
    const completed = getCompletedQuests(state);
    assert.strictEqual(completed.length, 1);
    assert.strictEqual(completed[0].id, 'awakening');
  });

  test('getQuestsByType filters correctly', () => {
    const mainQuests = getQuestsByType(QUEST_TYPES.MAIN);
    assert.ok(mainQuests.length > 0);
    assert.ok(mainQuests.every(q => q.type === QUEST_TYPES.MAIN));
    
    const dailyQuests = getQuestsByType(QUEST_TYPES.DAILY);
    assert.ok(dailyQuests.length > 0);
    assert.ok(dailyQuests.every(q => q.type === QUEST_TYPES.DAILY));
  });

  test('getQuestsByChapter filters correctly', () => {
    const chapter1 = getQuestsByChapter(1);
    assert.ok(chapter1.length > 0);
    assert.ok(chapter1.every(q => q.chapter === 1));
    
    const chapter2 = getQuestsByChapter(2);
    assert.ok(chapter2.every(q => q.chapter === 2));
  });
});

// ============================================================================
// Daily Quest Reset Tests
// ============================================================================

describe('Daily Quest Reset', () => {
  test('resetDailyQuests resets completed daily quests', () => {
    let state = createQuestState();
    state = { ...state, completedQuests: ['awakening', 'daily-hunt'] };
    state.quests['daily-hunt'] = { status: QUEST_STATUS.COMPLETED };
    
    const reset = resetDailyQuests(state);
    assert.ok(!reset.completedQuests.includes('daily-hunt'));
    assert.strictEqual(reset.quests['daily-hunt'].status, QUEST_STATUS.AVAILABLE);
  });

  test('resetDailyQuests preserves non-daily completed quests', () => {
    let state = createQuestState();
    state = { ...state, completedQuests: ['awakening', 'daily-hunt'] };
    state.quests['daily-hunt'] = { status: QUEST_STATUS.COMPLETED };
    
    const reset = resetDailyQuests(state);
    assert.ok(reset.completedQuests.includes('awakening'));
  });

  test('resetDailyQuests sets lastDailyReset', () => {
    const state = createQuestState();
    const reset = resetDailyQuests(state);
    assert.ok(reset.lastDailyReset !== null);
  });

  test('resetDailyQuests handles null state', () => {
    const result = resetDailyQuests(null);
    assert.ok(result);
    assert.deepStrictEqual(result.quests, {});
  });
});

// ============================================================================
// Quest Chain Tests
// ============================================================================

describe('Quest Chain', () => {
  test('getQuestChain returns prerequisites in order', () => {
    const chain = getQuestChain('village-defense');
    assert.deepStrictEqual(chain, ['awakening', 'first-battle', 'village-defense']);
  });

  test('getQuestChain handles quest with no prereqs', () => {
    const chain = getQuestChain('awakening');
    assert.deepStrictEqual(chain, ['awakening']);
  });

  test('getQuestChain returns empty for invalid quest', () => {
    const chain = getQuestChain('invalid');
    assert.deepStrictEqual(chain, []);
  });
});

// ============================================================================
// UI Component Tests
// ============================================================================

describe('UI Components - Quest Styles', () => {
  test('getQuestStyles returns CSS string', () => {
    const styles = getQuestStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.includes('.quest-panel'));
    assert.ok(styles.includes('.quest-card'));
    assert.ok(styles.includes('.quest-tracker'));
    assert.ok(styles.includes('.quest-notification'));
  });
});

describe('UI Components - Quest Panel', () => {
  test('renderQuestPanel renders active tab', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    
    const html = renderQuestPanel(state, 'active', 1);
    assert.ok(html.includes('quest-panel'));
    assert.ok(html.includes('The Awakening'));
  });

  test('renderQuestPanel renders available tab', () => {
    const state = createQuestState();
    const html = renderQuestPanel(state, 'available', 1);
    assert.ok(html.includes('awakening'));
  });

  test('renderQuestPanel renders completed tab', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    state = completeQuest(state, 'awakening').state;
    
    const html = renderQuestPanel(state, 'completed', 1);
    assert.ok(html.includes('The Awakening'));
  });

  test('renderQuestPanel shows empty message when no quests', () => {
    const state = createQuestState();
    const html = renderQuestPanel(state, 'active', 1);
    assert.ok(html.includes('No active quests'));
  });
});

describe('UI Components - Quest Details', () => {
  test('renderQuestDetails shows quest info', () => {
    const state = createQuestState();
    const html = renderQuestDetails(state, 'awakening');
    assert.ok(html.includes('The Awakening'));
    assert.ok(html.includes('Chapter 1'));
    assert.ok(html.includes('50 XP'));
    assert.ok(html.includes('20 Gold'));
  });

  test('renderQuestDetails shows objectives', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    
    const html = renderQuestDetails(state, 'awakening');
    assert.ok(html.includes('Explore your surroundings'));
    assert.ok(html.includes('Speak with the village elder'));
  });

  test('renderQuestDetails shows Accept button for available', () => {
    const state = createQuestState();
    const html = renderQuestDetails(state, 'awakening');
    assert.ok(html.includes('Accept Quest'));
  });

  test('renderQuestDetails shows Complete button when ready', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    state.objectiveProgress['awakening:wake'] = 1;
    state.objectiveProgress['awakening:elder'] = 1;
    
    const html = renderQuestDetails(state, 'awakening');
    assert.ok(html.includes('Complete Quest'));
  });

  test('renderQuestDetails shows Abandon button for active incomplete', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    
    const html = renderQuestDetails(state, 'awakening');
    assert.ok(html.includes('Abandon'));
  });

  test('renderQuestDetails handles invalid quest', () => {
    const state = createQuestState();
    const html = renderQuestDetails(state, 'invalid');
    assert.ok(html.includes('Quest not found'));
  });
});

describe('UI Components - Quest Tracker', () => {
  test('renderQuestTracker shows active quests', () => {
    let state = createQuestState();
    state = startQuest(state, 'awakening', 1).state;
    
    const html = renderQuestTracker(state, 3);
    assert.ok(html.includes('Quest Tracker'));
    assert.ok(html.includes('The Awakening'));
  });

  test('renderQuestTracker limits quests shown', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening', 'first-battle'] };
    state = startQuest(state, 'herb-gathering', 1).state;
    state = startQuest(state, 'lost-ring', 1).state;
    state = startQuest(state, 'daily-gather', 1).state;
    
    const html = renderQuestTracker(state, 2);
    const questMatches = html.match(/tracked-quest-name/g) || [];
    assert.ok(questMatches.length <= 2);
  });

  test('renderQuestTracker returns empty for no active quests', () => {
    const state = createQuestState();
    const html = renderQuestTracker(state, 3);
    assert.strictEqual(html, '');
  });
});

describe('UI Components - Notifications', () => {
  test('renderQuestStartedNotice shows quest name', () => {
    const html = renderQuestStartedNotice('The Awakening');
    assert.ok(html.includes('Quest Started'));
    assert.ok(html.includes('The Awakening'));
    assert.ok(html.includes('quest-notification started'));
  });

  test('renderQuestCompletedNotice shows quest and rewards', () => {
    const html = renderQuestCompletedNotice('The Awakening', { xp: 50, gold: 20 });
    assert.ok(html.includes('Quest Complete'));
    assert.ok(html.includes('The Awakening'));
    assert.ok(html.includes('+50 XP'));
    assert.ok(html.includes('+20 Gold'));
  });

  test('renderQuestCompletedNotice handles no rewards', () => {
    const html = renderQuestCompletedNotice('Test Quest', {});
    assert.ok(html.includes('Quest Complete'));
    assert.ok(!html.includes('XP'));
  });

  test('renderObjectiveCompletedNotice shows description', () => {
    const html = renderObjectiveCompletedNotice('Defeat training dummies');
    assert.ok(html.includes('Objective Complete'));
    assert.ok(html.includes('Defeat training dummies'));
    assert.ok(html.includes('quest-notification objective'));
  });
});

// ============================================================================
// Security Tests - XSS Prevention
// ============================================================================

describe('Security - XSS Prevention', () => {
  test('renderQuestStartedNotice escapes HTML', () => {
    const html = renderQuestStartedNotice('<script>alert("xss")</script>');
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  test('renderQuestCompletedNotice escapes HTML', () => {
    const html = renderQuestCompletedNotice('<img onerror="alert(1)">', { xp: 50 });
    assert.ok(!html.includes('<img onerror'));
    assert.ok(html.includes('&lt;img'));
  });

  test('renderObjectiveCompletedNotice escapes HTML', () => {
    const html = renderObjectiveCompletedNotice('Test<script>alert(1)</script>');
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  test('renderQuestDetails escapes quest names', () => {
    const state = createQuestState();
    const html = renderQuestDetails(state, 'awakening');
    // Check that normal content is properly escaped
    assert.ok(typeof html === 'string');
    assert.ok(!html.includes('<script>'));
  });

  test('UI escapes apostrophes correctly', () => {
    const html = renderQuestStartedNotice("Hero's Journey");
    assert.ok(html.includes('&#039;'));
    assert.ok(!html.includes("Hero's"));
  });
});

// ============================================================================
// Security Tests - Banned Word Scanning
// ============================================================================

describe('Security - Banned Word Scanning', () => {
  // List of banned words to check for
  const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  test('Quest names do not contain banned words', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      const nameLower = quest.name.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!nameLower.includes(word), `Quest ${id} name contains banned word: ${word}`);
      }
    }
  });

  test('Quest descriptions do not contain banned words', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      const descLower = quest.description.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!descLower.includes(word), `Quest ${id} description contains banned word: ${word}`);
      }
    }
  });

  test('Objective descriptions do not contain banned words', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      for (const obj of quest.objectives) {
        const descLower = obj.description.toLowerCase();
        for (const word of BANNED_WORDS) {
          assert.ok(!descLower.includes(word), `Quest ${id} objective contains banned word: ${word}`);
        }
      }
    }
  });

  test('Quest target IDs do not contain banned words', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      for (const obj of quest.objectives) {
        const targetLower = obj.target.toLowerCase();
        for (const word of BANNED_WORDS) {
          assert.ok(!targetLower.includes(word), `Quest ${id} target contains banned word: ${word}`);
        }
      }
    }
  });

  test('Item rewards do not contain banned words', () => {
    for (const [id, quest] of Object.entries(QUEST_DATA)) {
      if (quest.rewards.items) {
        for (const item of quest.rewards.items) {
          const itemLower = item.toLowerCase();
          for (const word of BANNED_WORDS) {
            assert.ok(!itemLower.includes(word), `Quest ${id} reward item contains banned word: ${word}`);
          }
        }
      }
    }
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  test('getActiveQuestsWithProgress handles empty state', () => {
    assert.deepStrictEqual(getActiveQuestsWithProgress(null), []);
    assert.deepStrictEqual(getActiveQuestsWithProgress({}), []);
  });

  test('getCompletedQuests handles empty state', () => {
    assert.deepStrictEqual(getCompletedQuests(null), []);
    assert.deepStrictEqual(getCompletedQuests({}), []);
  });

  test('completeQuest handles null state', () => {
    const result = completeQuest(null, 'awakening');
    assert.strictEqual(result.success, false);
  });

  test('Multiple quests can track same objective type with any target', () => {
    let state = { ...createQuestState(), completedQuests: ['awakening', 'first-battle'] };
    state = startQuest(state, 'daily-hunt', 1).state;

    // Kill any monster - daily-hunt uses 'any' target
    const result = updateObjectiveProgress(state, OBJECTIVE_TYPES.KILL, 'goblin', 1);
    // Daily hunt tracks any monster kills
    assert.strictEqual(result.state.objectiveProgress['daily-hunt:monsters'], 1);
  });
});
