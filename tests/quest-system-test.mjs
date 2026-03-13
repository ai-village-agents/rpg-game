/**
 * Quest System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  QUEST_TYPES,
  OBJECTIVE_TYPES,
  QUEST_STATUS,
  initQuestState,
  createQuest,
  addQuestToAvailable,
  acceptQuest,
  updateObjective,
  turnInQuest,
  abandonQuest,
  getQuest,
  getActiveQuests,
  getAvailableQuests,
  getCompletedQuests,
  getQuestsByType,
  checkQuestExpiry,
  getQuestProgress,
  getQuestStats,
  getAllQuestTypes,
  getAllObjectiveTypes
} from '../src/quest-system.js';

import {
  renderQuestCard,
  renderQuestList,
  renderActiveQuests,
  renderAvailableQuests,
  renderCompletedQuests,
  renderQuestTracker,
  renderQuestDetails,
  renderQuestStats,
  renderQuestTypeFilter,
  renderQuestLogPage,
  renderQuestNotification
} from '../src/quest-system-ui.js';

describe('Quest System', () => {
  describe('QUEST_TYPES', () => {
    it('should have all quest types defined', () => {
      assert.ok(QUEST_TYPES.MAIN);
      assert.ok(QUEST_TYPES.SIDE);
      assert.ok(QUEST_TYPES.DAILY);
      assert.ok(QUEST_TYPES.WEEKLY);
      assert.ok(QUEST_TYPES.GUILD);
    });

    it('should have correct properties for each type', () => {
      assert.strictEqual(QUEST_TYPES.MAIN.id, 'main');
      assert.strictEqual(QUEST_TYPES.MAIN.name, 'Main Quest');
      assert.ok(QUEST_TYPES.MAIN.icon);
      assert.ok(QUEST_TYPES.MAIN.color);
    });
  });

  describe('OBJECTIVE_TYPES', () => {
    it('should have all objective types defined', () => {
      assert.ok(OBJECTIVE_TYPES.KILL);
      assert.ok(OBJECTIVE_TYPES.COLLECT);
      assert.ok(OBJECTIVE_TYPES.DELIVER);
      assert.ok(OBJECTIVE_TYPES.EXPLORE);
      assert.ok(OBJECTIVE_TYPES.INTERACT);
      assert.ok(OBJECTIVE_TYPES.CRAFT);
    });

    it('should have verb for each type', () => {
      assert.strictEqual(OBJECTIVE_TYPES.KILL.verb, 'Kill');
      assert.strictEqual(OBJECTIVE_TYPES.INTERACT.verb, 'Talk to');
    });
  });

  describe('QUEST_STATUS', () => {
    it('should have all status values', () => {
      assert.strictEqual(QUEST_STATUS.AVAILABLE, 'available');
      assert.strictEqual(QUEST_STATUS.ACTIVE, 'active');
      assert.strictEqual(QUEST_STATUS.COMPLETED, 'completed');
      assert.strictEqual(QUEST_STATUS.TURNED_IN, 'turned_in');
      assert.strictEqual(QUEST_STATUS.FAILED, 'failed');
    });
  });

  describe('initQuestState', () => {
    it('should initialize quest state', () => {
      const result = initQuestState({ player: { name: 'Hero' } });
      assert.ok(result.success);
      assert.ok(result.state.quests);
      assert.deepStrictEqual(result.state.quests.available, []);
      assert.deepStrictEqual(result.state.quests.active, []);
      assert.deepStrictEqual(result.state.quests.completed, []);
      assert.deepStrictEqual(result.state.quests.questLog, {});
    });

    it('should initialize quest stats', () => {
      const result = initQuestState({});
      assert.strictEqual(result.state.quests.stats.totalCompleted, 0);
      assert.strictEqual(result.state.quests.stats.totalFailed, 0);
      assert.strictEqual(result.state.quests.stats.dailiesCompleted, 0);
    });
  });

  describe('createQuest', () => {
    it('should create a valid quest', () => {
      const result = createQuest({
        name: 'Slay the Dragon',
        description: 'Defeat the dragon in the mountains',
        type: 'main',
        objectives: [{ type: 'kill', target: 'dragon', targetName: 'Mountain Dragon', required: 1 }],
        rewards: { gold: 1000, experience: 500 }
      });

      assert.ok(result.success);
      assert.ok(result.quest.id);
      assert.strictEqual(result.quest.name, 'Slay the Dragon');
      assert.strictEqual(result.quest.type, 'main');
      assert.strictEqual(result.quest.status, QUEST_STATUS.AVAILABLE);
    });

    it('should fail without name', () => {
      const result = createQuest({ description: 'Test', objectives: [{ type: 'kill', target: 'x' }] });
      assert.ok(!result.success);
      assert.ok(result.error.includes('name'));
    });

    it('should fail without objectives', () => {
      const result = createQuest({ name: 'Test', description: 'Test', objectives: [] });
      assert.ok(!result.success);
      assert.ok(result.error.includes('objectives'));
    });

    it('should fail with invalid quest type', () => {
      const result = createQuest({
        name: 'Test',
        description: 'Test',
        type: 'invalid_type',
        objectives: [{ type: 'kill', target: 'x' }]
      });
      assert.ok(!result.success);
      assert.ok(result.error.includes('type'));
    });

    it('should set default values for objectives', () => {
      const result = createQuest({
        name: 'Gather herbs',
        description: 'Collect herbs',
        objectives: [{ type: 'collect', target: 'herb' }]
      });

      assert.ok(result.success);
      assert.strictEqual(result.quest.objectives[0].required, 1);
      assert.strictEqual(result.quest.objectives[0].current, 0);
      assert.strictEqual(result.quest.objectives[0].completed, false);
    });

    it('should set rewards with defaults', () => {
      const result = createQuest({
        name: 'Test',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x' }],
        rewards: { gold: 100 }
      });

      assert.ok(result.success);
      assert.strictEqual(result.quest.rewards.gold, 100);
      assert.strictEqual(result.quest.rewards.experience, 0);
      assert.deepStrictEqual(result.quest.rewards.items, []);
    });
  });

  describe('addQuestToAvailable', () => {
    let state;

    beforeEach(() => {
      state = initQuestState({}).state;
    });

    it('should add quest to available list', () => {
      const quest = createQuest({
        name: 'Test Quest',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'wolf', required: 5 }]
      }).quest;

      const result = addQuestToAvailable(state, quest);
      assert.ok(result.success);
      assert.ok(result.state.quests.available.includes(quest.id));
      assert.ok(result.state.quests.questLog[quest.id]);
    });

    it('should fail for duplicate quest', () => {
      const quest = createQuest({
        name: 'Test Quest',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'wolf' }]
      }).quest;

      const result1 = addQuestToAvailable(state, quest);
      const result2 = addQuestToAvailable(result1.state, quest);
      assert.ok(!result2.success);
      assert.ok(result2.error.includes('exists'));
    });

    it('should fail for invalid quest', () => {
      const result = addQuestToAvailable(state, null);
      assert.ok(!result.success);
    });
  });

  describe('acceptQuest', () => {
    let state;
    let questId;

    beforeEach(() => {
      state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Wolf Hunt',
        description: 'Hunt wolves',
        objectives: [{ type: 'kill', target: 'wolf', required: 5 }]
      }).quest;
      questId = quest.id;
      state = addQuestToAvailable(state, quest).state;
    });

    it('should accept an available quest', () => {
      const result = acceptQuest(state, questId);
      assert.ok(result.success);
      assert.ok(result.state.quests.active.includes(questId));
      assert.ok(!result.state.quests.available.includes(questId));
      assert.strictEqual(result.state.quests.questLog[questId].status, QUEST_STATUS.ACTIVE);
    });

    it('should set startedAt time', () => {
      const before = Date.now();
      const result = acceptQuest(state, questId);
      const after = Date.now();
      const startedAt = result.state.quests.questLog[questId].startedAt;
      assert.ok(startedAt >= before && startedAt <= after);
    });

    it('should fail for non-existent quest', () => {
      const result = acceptQuest(state, 'fake_quest_id');
      assert.ok(!result.success);
      assert.ok(result.error.includes('not found'));
    });

    it('should fail if quest already active', () => {
      const result1 = acceptQuest(state, questId);
      const result2 = acceptQuest(result1.state, questId);
      assert.ok(!result2.success);
      assert.ok(result2.error.includes('not available'));
    });
  });

  describe('updateObjective', () => {
    let state;
    let questId;

    beforeEach(() => {
      state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Kill Wolves',
        description: 'Hunt wolves in the forest',
        objectives: [{ type: 'kill', target: 'wolf', required: 3 }]
      }).quest;
      questId = quest.id;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, questId).state;
    });

    it('should update objective progress', () => {
      const result = updateObjective(state, questId, 'obj_0', 1);
      assert.ok(result.success);
      assert.strictEqual(result.state.quests.questLog[questId].objectives[0].current, 1);
    });

    it('should mark objective complete when required met', () => {
      let current = state;
      current = updateObjective(current, questId, 'obj_0', 1).state;
      current = updateObjective(current, questId, 'obj_0', 1).state;
      const result = updateObjective(current, questId, 'obj_0', 1);
      assert.ok(result.success);
      assert.ok(result.objectiveCompleted);
      assert.strictEqual(result.state.quests.questLog[questId].objectives[0].completed, true);
    });

    it('should mark quest completed when all objectives done', () => {
      let current = state;
      current = updateObjective(current, questId, 'obj_0', 3).state;
      const quest = current.quests.questLog[questId];
      assert.strictEqual(quest.status, QUEST_STATUS.COMPLETED);
    });

    it('should not exceed required amount', () => {
      const result = updateObjective(state, questId, 'obj_0', 100);
      assert.strictEqual(result.state.quests.questLog[questId].objectives[0].current, 3);
    });

    it('should fail for non-active quest', () => {
      const inactiveState = initQuestState({}).state;
      const quest = createQuest({
        name: 'Test',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x' }]
      }).quest;
      const s = addQuestToAvailable(inactiveState, quest).state;
      const result = updateObjective(s, quest.id, 'obj_0', 1);
      assert.ok(!result.success);
    });
  });

  describe('turnInQuest', () => {
    let state;
    let questId;

    beforeEach(() => {
      state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Simple Task',
        description: 'Complete one objective',
        type: 'daily',
        objectives: [{ type: 'collect', target: 'item', required: 1 }],
        rewards: { gold: 50, experience: 25 }
      }).quest;
      questId = quest.id;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, questId).state;
      state = updateObjective(state, questId, 'obj_0', 1).state;
    });

    it('should turn in completed quest', () => {
      const result = turnInQuest(state, questId);
      assert.ok(result.success);
      assert.strictEqual(result.state.quests.questLog[questId].status, QUEST_STATUS.TURNED_IN);
      assert.ok(result.state.quests.completed.includes(questId));
      assert.ok(!result.state.quests.active.includes(questId));
    });

    it('should return rewards', () => {
      const result = turnInQuest(state, questId);
      assert.strictEqual(result.rewards.gold, 50);
      assert.strictEqual(result.rewards.experience, 25);
    });

    it('should update stats', () => {
      const result = turnInQuest(state, questId);
      assert.strictEqual(result.state.quests.stats.totalCompleted, 1);
      assert.strictEqual(result.state.quests.stats.dailiesCompleted, 1);
    });

    it('should fail for incomplete quest', () => {
      const incompleteState = initQuestState({}).state;
      const quest = createQuest({
        name: 'Test',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x', required: 5 }]
      }).quest;
      let s = addQuestToAvailable(incompleteState, quest).state;
      s = acceptQuest(s, quest.id).state;
      const result = turnInQuest(s, quest.id);
      assert.ok(!result.success);
    });
  });

  describe('abandonQuest', () => {
    let state;
    let questId;

    beforeEach(() => {
      state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Abandon Test',
        description: 'Test abandoning',
        objectives: [{ type: 'kill', target: 'x', required: 10 }]
      }).quest;
      questId = quest.id;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, questId).state;
    });

    it('should abandon active quest', () => {
      const result = abandonQuest(state, questId);
      assert.ok(result.success);
      assert.ok(!result.state.quests.active.includes(questId));
    });

    it('should mark non-repeatable quest as failed', () => {
      const result = abandonQuest(state, questId);
      assert.strictEqual(result.state.quests.questLog[questId].status, QUEST_STATUS.FAILED);
      assert.strictEqual(result.state.quests.stats.totalFailed, 1);
    });

    it('should reset repeatable quest to available', () => {
      const repeatableQuest = createQuest({
        name: 'Daily Task',
        description: 'Repeatable',
        repeatable: true,
        objectives: [{ type: 'kill', target: 'mob', required: 5 }]
      }).quest;
      let s = addQuestToAvailable(state, repeatableQuest).state;
      s = acceptQuest(s, repeatableQuest.id).state;
      s = updateObjective(s, repeatableQuest.id, 'obj_0', 3).state;
      
      const result = abandonQuest(s, repeatableQuest.id);
      assert.ok(result.success);
      assert.strictEqual(result.state.quests.questLog[repeatableQuest.id].status, QUEST_STATUS.AVAILABLE);
      assert.ok(result.state.quests.available.includes(repeatableQuest.id));
      assert.strictEqual(result.state.quests.questLog[repeatableQuest.id].objectives[0].current, 0);
    });
  });

  describe('getQuest', () => {
    it('should find existing quest', () => {
      let state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Find Me',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x' }]
      }).quest;
      state = addQuestToAvailable(state, quest).state;
      
      const result = getQuest(state, quest.id);
      assert.ok(result.found);
      assert.strictEqual(result.quest.name, 'Find Me');
    });

    it('should return not found for missing quest', () => {
      const state = initQuestState({}).state;
      const result = getQuest(state, 'nonexistent');
      assert.ok(!result.found);
    });
  });

  describe('getActiveQuests', () => {
    it('should return active quests', () => {
      let state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Active Quest',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x' }]
      }).quest;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, quest.id).state;
      
      const active = getActiveQuests(state);
      assert.strictEqual(active.length, 1);
      assert.strictEqual(active[0].name, 'Active Quest');
    });
  });

  describe('getAvailableQuests', () => {
    it('should return available quests', () => {
      let state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Available Quest',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x' }]
      }).quest;
      state = addQuestToAvailable(state, quest).state;
      
      const available = getAvailableQuests(state);
      assert.strictEqual(available.length, 1);
      assert.strictEqual(available[0].name, 'Available Quest');
    });
  });

  describe('getCompletedQuests', () => {
    it('should return completed quests', () => {
      let state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Complete Quest',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x', required: 1 }]
      }).quest;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, quest.id).state;
      state = updateObjective(state, quest.id, 'obj_0', 1).state;
      state = turnInQuest(state, quest.id).state;
      
      const completed = getCompletedQuests(state);
      assert.strictEqual(completed.length, 1);
    });
  });

  describe('getQuestsByType', () => {
    it('should filter quests by type', () => {
      let state = initQuestState({}).state;
      const mainQuest = createQuest({
        name: 'Main Quest',
        description: 'Main',
        type: 'main',
        objectives: [{ type: 'kill', target: 'x' }]
      }).quest;
      const sideQuest = createQuest({
        name: 'Side Quest',
        description: 'Side',
        type: 'side',
        objectives: [{ type: 'kill', target: 'y' }]
      }).quest;
      state = addQuestToAvailable(state, mainQuest).state;
      state = addQuestToAvailable(state, sideQuest).state;
      
      const mainQuests = getQuestsByType(state, 'main');
      assert.strictEqual(mainQuests.length, 1);
      assert.strictEqual(mainQuests[0].name, 'Main Quest');
    });
  });

  describe('getQuestProgress', () => {
    it('should calculate quest progress', () => {
      let state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Progress Quest',
        description: 'Test',
        objectives: [{ type: 'kill', target: 'x', required: 10 }]
      }).quest;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, quest.id).state;
      state = updateObjective(state, quest.id, 'obj_0', 5).state;
      
      const progress = getQuestProgress(state, quest.id);
      assert.ok(progress.found);
      assert.strictEqual(progress.progress, 50);
      assert.strictEqual(progress.totalCurrent, 5);
      assert.strictEqual(progress.totalRequired, 10);
    });

    it('should return not found for missing quest', () => {
      const state = initQuestState({}).state;
      const progress = getQuestProgress(state, 'nonexistent');
      assert.ok(!progress.found);
    });
  });

  describe('getQuestStats', () => {
    it('should return quest stats', () => {
      const state = initQuestState({}).state;
      const stats = getQuestStats(state);
      assert.strictEqual(stats.totalCompleted, 0);
      assert.strictEqual(stats.totalFailed, 0);
      assert.strictEqual(stats.dailiesCompleted, 0);
    });
  });

  describe('getAllQuestTypes', () => {
    it('should return all quest types', () => {
      const types = getAllQuestTypes();
      assert.strictEqual(types.length, 5);
      assert.ok(types.some(t => t.id === 'main'));
      assert.ok(types.some(t => t.id === 'daily'));
    });
  });

  describe('getAllObjectiveTypes', () => {
    it('should return all objective types', () => {
      const types = getAllObjectiveTypes();
      assert.strictEqual(types.length, 6);
      assert.ok(types.some(t => t.id === 'kill'));
      assert.ok(types.some(t => t.id === 'collect'));
    });
  });

  describe('checkQuestExpiry', () => {
    it('should expire timed quests', () => {
      let state = initQuestState({}).state;
      const quest = createQuest({
        name: 'Timed Quest',
        description: 'Expires quickly',
        timeLimit: -1000,
        objectives: [{ type: 'kill', target: 'x' }]
      }).quest;
      state = addQuestToAvailable(state, quest).state;
      state = acceptQuest(state, quest.id).state;
      
      const result = checkQuestExpiry(state);
      assert.ok(result.expiredQuests.includes(quest.id));
    });
  });
});

describe('Quest System UI', () => {
  let state;
  let testQuest;

  beforeEach(() => {
    state = initQuestState({}).state;
    testQuest = createQuest({
      name: 'Test Quest',
      description: 'A test quest for UI',
      type: 'main',
      objectives: [
        { type: 'kill', target: 'goblin', targetName: 'Goblins', required: 5 }
      ],
      rewards: { gold: 100, experience: 50, reputation: 10 }
    }).quest;
    state = addQuestToAvailable(state, testQuest).state;
  });

  describe('renderQuestCard', () => {
    it('should render quest card HTML', () => {
      const html = renderQuestCard(testQuest);
      assert.ok(html.includes('quest-card'));
      assert.ok(html.includes('Test Quest'));
      assert.ok(html.includes('A test quest for UI'));
    });

    it('should render compact card', () => {
      const html = renderQuestCard(testQuest, { compact: true });
      assert.ok(html.includes('compact'));
      assert.ok(html.includes('Test Quest'));
    });

    it('should render accept button for available quest', () => {
      const html = renderQuestCard(testQuest);
      assert.ok(html.includes('accept-quest'));
      assert.ok(html.includes('Accept'));
    });

    it('should render rewards', () => {
      const html = renderQuestCard(testQuest);
      assert.ok(html.includes('100'));
      assert.ok(html.includes('gold'));
      assert.ok(html.includes('50'));
      assert.ok(html.includes('XP'));
    });

    it('should escape HTML in quest name', () => {
      const xssQuest = { ...testQuest, name: '<script>alert("xss")</script>' };
      const html = renderQuestCard(xssQuest);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });

  describe('renderQuestList', () => {
    it('should render quest list', () => {
      const quests = [testQuest];
      const html = renderQuestList(quests, 'My Quests');
      assert.ok(html.includes('quest-list'));
      assert.ok(html.includes('My Quests'));
    });

    it('should render empty message', () => {
      const html = renderQuestList([], 'Empty List', 'No quests here');
      assert.ok(html.includes('empty'));
      assert.ok(html.includes('No quests here'));
    });
  });

  describe('renderActiveQuests', () => {
    it('should render active quests', () => {
      state = acceptQuest(state, testQuest.id).state;
      const html = renderActiveQuests(state);
      assert.ok(html.includes('Active Quests'));
      assert.ok(html.includes('Test Quest'));
    });
  });

  describe('renderAvailableQuests', () => {
    it('should render available quests', () => {
      const html = renderAvailableQuests(state);
      assert.ok(html.includes('Available Quests'));
      assert.ok(html.includes('Test Quest'));
    });
  });

  describe('renderCompletedQuests', () => {
    it('should render completed quests section', () => {
      const html = renderCompletedQuests(state);
      assert.ok(html.includes('Completed Quests'));
    });
  });

  describe('renderQuestTracker', () => {
    it('should render empty tracker', () => {
      const html = renderQuestTracker(state);
      assert.ok(html.includes('No tracked quests'));
    });

    it('should render tracker with active quests', () => {
      state = acceptQuest(state, testQuest.id).state;
      const html = renderQuestTracker(state);
      assert.ok(html.includes('Quest Tracker'));
      assert.ok(html.includes('Test Quest'));
    });
  });

  describe('renderQuestDetails', () => {
    it('should render quest details', () => {
      const html = renderQuestDetails(state, testQuest.id);
      assert.ok(html.includes('Test Quest'));
    });

    it('should render not found for missing quest', () => {
      const html = renderQuestDetails(state, 'nonexistent');
      assert.ok(html.includes('not found'));
    });
  });

  describe('renderQuestStats', () => {
    it('should render quest statistics', () => {
      const html = renderQuestStats(state);
      assert.ok(html.includes('Quest Statistics'));
      assert.ok(html.includes('Quests Completed'));
      assert.ok(html.includes('Quests Failed'));
    });
  });

  describe('renderQuestTypeFilter', () => {
    it('should render type filter buttons', () => {
      const html = renderQuestTypeFilter();
      assert.ok(html.includes('filter-btn'));
      assert.ok(html.includes('All'));
      assert.ok(html.includes('Main Quest'));
    });

    it('should mark selected type as active', () => {
      const html = renderQuestTypeFilter('main');
      assert.ok(html.includes('data-type="main"'));
    });
  });

  describe('renderQuestLogPage', () => {
    it('should render full quest log page', () => {
      const html = renderQuestLogPage(state);
      assert.ok(html.includes('Quest Log'));
      assert.ok(html.includes('quest-tracker'));
      assert.ok(html.includes('quest-stats'));
    });
  });

  describe('renderQuestNotification', () => {
    it('should render quest accepted notification', () => {
      const html = renderQuestNotification(testQuest, 'accepted');
      assert.ok(html.includes('quest-notification'));
      assert.ok(html.includes('accepted'));
      assert.ok(html.includes('Quest Accepted'));
    });

    it('should render quest completed notification', () => {
      const html = renderQuestNotification(testQuest, 'completed');
      assert.ok(html.includes('Quest Complete'));
    });
  });
});
