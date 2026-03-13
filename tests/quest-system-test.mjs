/**
 * Quest System Tests
 * Tests for quest management, objectives, and completion
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  QUEST_TYPES,
  QUEST_STATUS,
  OBJECTIVE_TYPES,
  REWARD_TYPES,
  createQuestState,
  createQuest,
  createQuestRegistry,
  registerQuest,
  isQuestAvailable,
  acceptQuest,
  abandonQuest,
  updateObjective,
  areObjectivesComplete,
  completeQuest,
  failQuest,
  checkExpiredQuests,
  getQuestProgress,
  getAvailableQuests,
  getActiveQuests,
  getChainProgress,
  searchQuests,
  filterQuestsByType,
  getQuestTypeInfo,
  getObjectiveTypeInfo,
  createObjective,
  createReward,
  getQuestLog,
  getQuestStats,
  trackQuestsByType
} from '../src/quest-system.js';

// Helper to create test quest
function createTestQuest(id, name, type = 'SIDE', objectives = null) {
  const defaultObjectives = objectives || [
    { type: 'KILL', target: 5, description: 'Defeat 5 enemies' }
  ];
  const result = createQuest(
    id,
    name,
    type,
    'Test quest description',
    defaultObjectives,
    [{ type: 'gold', amount: 100 }]
  );
  return result.quest;
}

// Helper to create test registry
function createTestRegistry() {
  let registry = createQuestRegistry();

  const quests = [
    createTestQuest('quest_1', 'First Quest', 'MAIN'),
    createTestQuest('quest_2', 'Second Quest', 'SIDE'),
    createTestQuest('quest_3', 'Daily Task', 'DAILY'),
    createTestQuest('quest_4', 'Weekly Challenge', 'WEEKLY')
  ];

  for (const quest of quests) {
    const result = registerQuest(registry, quest);
    if (result.success) registry = result.registry;
  }

  return registry;
}

// ============================================
// Constants Tests
// ============================================
describe('Quest System Constants', () => {
  test('QUEST_TYPES has all types', () => {
    assert.ok(QUEST_TYPES.MAIN);
    assert.ok(QUEST_TYPES.SIDE);
    assert.ok(QUEST_TYPES.DAILY);
    assert.ok(QUEST_TYPES.WEEKLY);
    assert.ok(QUEST_TYPES.EVENT);
    assert.ok(QUEST_TYPES.HIDDEN);
    assert.strictEqual(Object.keys(QUEST_TYPES).length, 6);
  });

  test('quest types have required properties', () => {
    for (const [key, type] of Object.entries(QUEST_TYPES)) {
      assert.ok(type.name, `${key} should have name`);
      assert.ok(type.color, `${key} should have color`);
      assert.ok(typeof type.priority === 'number', `${key} should have priority`);
    }
  });

  test('QUEST_STATUS has all statuses', () => {
    assert.strictEqual(QUEST_STATUS.LOCKED, 'locked');
    assert.strictEqual(QUEST_STATUS.AVAILABLE, 'available');
    assert.strictEqual(QUEST_STATUS.ACTIVE, 'active');
    assert.strictEqual(QUEST_STATUS.COMPLETED, 'completed');
    assert.strictEqual(QUEST_STATUS.FAILED, 'failed');
    assert.strictEqual(QUEST_STATUS.EXPIRED, 'expired');
  });

  test('OBJECTIVE_TYPES has all types', () => {
    assert.ok(OBJECTIVE_TYPES.KILL);
    assert.ok(OBJECTIVE_TYPES.COLLECT);
    assert.ok(OBJECTIVE_TYPES.TALK);
    assert.ok(OBJECTIVE_TYPES.EXPLORE);
    assert.ok(OBJECTIVE_TYPES.DELIVER);
    assert.ok(OBJECTIVE_TYPES.ESCORT);
    assert.ok(OBJECTIVE_TYPES.CRAFT);
    assert.ok(OBJECTIVE_TYPES.USE);
    assert.strictEqual(Object.keys(OBJECTIVE_TYPES).length, 8);
  });

  test('objective types have required properties', () => {
    for (const [key, type] of Object.entries(OBJECTIVE_TYPES)) {
      assert.ok(type.name, `${key} should have name`);
      assert.ok(type.verb, `${key} should have verb`);
    }
  });
});

// ============================================
// State Creation Tests
// ============================================
describe('createQuestState', () => {
  test('creates initial state', () => {
    const state = createQuestState();
    assert.deepStrictEqual(state.quests, {});
    assert.deepStrictEqual(state.activeQuests, []);
    assert.deepStrictEqual(state.completedQuests, []);
    assert.deepStrictEqual(state.failedQuests, []);
    assert.deepStrictEqual(state.questLog, []);
  });

  test('creates initial stats', () => {
    const state = createQuestState();
    assert.strictEqual(state.stats.totalStarted, 0);
    assert.strictEqual(state.stats.totalCompleted, 0);
    assert.strictEqual(state.stats.totalFailed, 0);
    assert.strictEqual(state.stats.mainQuestsCompleted, 0);
    assert.strictEqual(state.stats.sideQuestsCompleted, 0);
  });
});

describe('createQuestRegistry', () => {
  test('creates empty registry', () => {
    const registry = createQuestRegistry();
    assert.deepStrictEqual(registry.quests, {});
    assert.deepStrictEqual(registry.chains, {});
    assert.deepStrictEqual(registry.byType, {});
  });
});

// ============================================
// Quest Creation Tests
// ============================================
describe('createQuest', () => {
  test('creates valid quest', () => {
    const result = createQuest(
      'quest_1',
      'Test Quest',
      'main',
      'A test quest',
      [{ type: 'KILL', target: 10, description: 'Kill 10 enemies' }],
      [{ type: 'gold', amount: 500 }]
    );

    assert.ok(result.success);
    assert.strictEqual(result.quest.id, 'quest_1');
    assert.strictEqual(result.quest.name, 'Test Quest');
    assert.strictEqual(result.quest.type, 'MAIN');
    assert.strictEqual(result.quest.objectives.length, 1);
    assert.ok(result.quest.objectives[0].id);
    assert.strictEqual(result.quest.objectives[0].current, 0);
  });

  test('fails without id', () => {
    const result = createQuest(null, 'Test', 'main', 'Desc', [{ type: 'KILL', target: 1 }]);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid quest id or name');
  });

  test('fails without name', () => {
    const result = createQuest('id1', '', 'main', 'Desc', [{ type: 'KILL', target: 1 }]);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid quest id or name');
  });

  test('fails with invalid type', () => {
    const result = createQuest('id1', 'Test', 'invalid', 'Desc', [{ type: 'KILL', target: 1 }]);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid quest type');
  });

  test('fails without objectives', () => {
    const result = createQuest('id1', 'Test', 'main', 'Desc', []);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest must have at least one objective');
  });

  test('accepts options', () => {
    const result = createQuest(
      'quest_1',
      'Chain Quest',
      'main',
      'Part of a chain',
      [{ type: 'TALK', target: 1 }],
      [],
      {
        prerequisites: ['quest_0'],
        levelRequirement: 10,
        timeLimit: 3600000,
        chainId: 'main_story',
        chainOrder: 2,
        repeatable: true
      }
    );

    assert.ok(result.success);
    assert.deepStrictEqual(result.quest.prerequisites, ['quest_0']);
    assert.strictEqual(result.quest.levelRequirement, 10);
    assert.strictEqual(result.quest.timeLimit, 3600000);
    assert.strictEqual(result.quest.chainId, 'main_story');
    assert.strictEqual(result.quest.chainOrder, 2);
    assert.strictEqual(result.quest.repeatable, true);
  });
});

// ============================================
// Registry Tests
// ============================================
describe('registerQuest', () => {
  test('registers quest', () => {
    let registry = createQuestRegistry();
    const quest = createTestQuest('quest_1', 'Test Quest', 'MAIN');
    const result = registerQuest(registry, quest);

    assert.ok(result.success);
    assert.ok(result.registry.quests['quest_1']);
    assert.ok(result.registry.byType['MAIN'].includes('quest_1'));
  });

  test('indexes chain quests', () => {
    let registry = createQuestRegistry();
    const result1 = createQuest('chain_1', 'Part 1', 'main', 'First', [{ type: 'TALK', target: 1 }], [], { chainId: 'story', chainOrder: 0 });
    const result2 = createQuest('chain_2', 'Part 2', 'main', 'Second', [{ type: 'TALK', target: 1 }], [], { chainId: 'story', chainOrder: 1 });

    let reg = registerQuest(registry, result1.quest);
    reg = registerQuest(reg.registry, result2.quest);

    assert.ok(reg.registry.chains['story']);
    assert.strictEqual(reg.registry.chains['story'].length, 2);
    assert.strictEqual(reg.registry.chains['story'][0], 'chain_1');
    assert.strictEqual(reg.registry.chains['story'][1], 'chain_2');
  });

  test('fails with invalid quest', () => {
    const registry = createQuestRegistry();
    const result = registerQuest(registry, null);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid quest');
  });

  test('fails with duplicate quest', () => {
    let registry = createQuestRegistry();
    const quest = createTestQuest('quest_1', 'Test');
    const result1 = registerQuest(registry, quest);
    const result2 = registerQuest(result1.registry, quest);

    assert.ok(!result2.success);
    assert.strictEqual(result2.error, 'Quest already registered');
  });
});

// ============================================
// Quest Availability Tests
// ============================================
describe('isQuestAvailable', () => {
  test('returns true for available quest', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    assert.ok(isQuestAvailable(state, registry, 'quest_1'));
  });

  test('returns false for active quest', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    assert.ok(!isQuestAvailable(state, registry, 'quest_1'));
  });

  test('returns false for completed non-repeatable quest', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = { ...state, completedQuests: ['quest_1'] };

    assert.ok(!isQuestAvailable(state, registry, 'quest_1'));
  });

  test('checks level requirement', () => {
    let registry = createQuestRegistry();
    const questResult = createQuest('high_level', 'High Level Quest', 'side', 'Desc', [{ type: 'KILL', target: 1 }], [], { levelRequirement: 50 });
    registry = registerQuest(registry, questResult.quest).registry;
    const state = createQuestState();

    assert.ok(!isQuestAvailable(state, registry, 'high_level', 10));
    assert.ok(isQuestAvailable(state, registry, 'high_level', 50));
  });

  test('checks prerequisites', () => {
    let registry = createQuestRegistry();
    const quest1 = createQuest('prereq', 'Prereq Quest', 'side', 'First', [{ type: 'TALK', target: 1 }]);
    const quest2 = createQuest('dependent', 'Dependent Quest', 'side', 'Second', [{ type: 'TALK', target: 1 }], [], { prerequisites: ['prereq'] });
    registry = registerQuest(registry, quest1.quest).registry;
    registry = registerQuest(registry, quest2.quest).registry;

    let state = createQuestState();
    assert.ok(!isQuestAvailable(state, registry, 'dependent'));

    state = { ...state, completedQuests: ['prereq'] };
    assert.ok(isQuestAvailable(state, registry, 'dependent'));
  });

  test('returns false for unknown quest', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    assert.ok(!isQuestAvailable(state, registry, 'unknown_quest'));
  });
});

// ============================================
// Accept Quest Tests
// ============================================
describe('acceptQuest', () => {
  test('accepts available quest', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    const result = acceptQuest(state, registry, 'quest_1');

    assert.ok(result.success);
    assert.ok(result.questInstance);
    assert.ok(result.state.activeQuests.includes('quest_1'));
    assert.ok(result.state.quests['quest_1']);
    assert.strictEqual(result.state.stats.totalStarted, 1);
  });

  test('creates quest log entry', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    const result = acceptQuest(state, registry, 'quest_1');

    assert.strictEqual(result.state.questLog.length, 1);
    assert.strictEqual(result.state.questLog[0].type, 'accepted');
    assert.strictEqual(result.state.questLog[0].questId, 'quest_1');
  });

  test('fails for unknown quest', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    const result = acceptQuest(state, registry, 'unknown');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest not found');
  });

  test('fails for already active quest', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = acceptQuest(state, registry, 'quest_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest already active');
  });

  test('fails for completed non-repeatable quest', () => {
    let state = createQuestState();
    state = { ...state, completedQuests: ['quest_1'] };
    const registry = createTestRegistry();

    const result = acceptQuest(state, registry, 'quest_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest already completed');
  });
});

// ============================================
// Abandon Quest Tests
// ============================================
describe('abandonQuest', () => {
  test('abandons active quest', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = abandonQuest(state, 'quest_1');

    assert.ok(result.success);
    assert.ok(!result.state.activeQuests.includes('quest_1'));
    assert.ok(!result.state.quests['quest_1']);
  });

  test('creates log entry', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = abandonQuest(state, 'quest_1');

    const lastLog = result.state.questLog[result.state.questLog.length - 1];
    assert.strictEqual(lastLog.type, 'abandoned');
  });

  test('fails for inactive quest', () => {
    const state = createQuestState();
    const result = abandonQuest(state, 'quest_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest not active');
  });
});

// ============================================
// Objective Tests
// ============================================
describe('updateObjective', () => {
  test('updates objective progress', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    const result = updateObjective(state, 'quest_1', objId, 2);

    assert.ok(result.success);
    assert.strictEqual(result.progress, 2);
    assert.ok(!result.justCompleted);
  });

  test('completes objective when target reached', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    const result = updateObjective(state, 'quest_1', objId, 5);

    assert.ok(result.success);
    assert.ok(result.justCompleted);
    assert.strictEqual(result.progress, 5);
  });

  test('caps progress at target', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    const result = updateObjective(state, 'quest_1', objId, 100);

    assert.strictEqual(result.progress, 5); // Target is 5
  });

  test('fails for inactive quest', () => {
    const state = createQuestState();
    const result = updateObjective(state, 'quest_1', 'obj_1', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest not active');
  });

  test('fails for unknown objective', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = updateObjective(state, 'quest_1', 'invalid_obj', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Objective not found');
  });

  test('fails for completed objective', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    state = updateObjective(state, 'quest_1', objId, 5).state;
    const result = updateObjective(state, 'quest_1', objId, 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Objective already completed');
  });
});

describe('areObjectivesComplete', () => {
  test('returns false when objectives incomplete', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    assert.ok(!areObjectivesComplete(state, 'quest_1'));
  });

  test('returns true when all objectives complete', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    state = updateObjective(state, 'quest_1', objId, 5).state;

    assert.ok(areObjectivesComplete(state, 'quest_1'));
  });

  test('returns false for unknown quest', () => {
    const state = createQuestState();
    assert.ok(!areObjectivesComplete(state, 'unknown'));
  });
});

// ============================================
// Complete Quest Tests
// ============================================
describe('completeQuest', () => {
  test('completes quest with all objectives done', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    state = updateObjective(state, 'quest_1', objId, 5).state;

    const result = completeQuest(state, registry, 'quest_1');

    assert.ok(result.success);
    assert.ok(result.rewards);
    assert.ok(!result.state.activeQuests.includes('quest_1'));
    assert.ok(result.state.completedQuests.includes('quest_1'));
    assert.strictEqual(result.state.stats.totalCompleted, 1);
  });

  test('tracks main quest completion', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state; // MAIN quest

    const objId = state.quests['quest_1'].objectives[0].id;
    state = updateObjective(state, 'quest_1', objId, 5).state;

    const result = completeQuest(state, registry, 'quest_1');

    assert.strictEqual(result.state.stats.mainQuestsCompleted, 1);
  });

  test('fails for inactive quest', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    const result = completeQuest(state, registry, 'quest_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest not active');
  });

  test('fails with incomplete objectives', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = completeQuest(state, registry, 'quest_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Objectives not complete');
  });
});

// ============================================
// Fail Quest Tests
// ============================================
describe('failQuest', () => {
  test('fails active quest', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = failQuest(state, 'quest_1', 'Test reason');

    assert.ok(result.success);
    assert.ok(!result.state.activeQuests.includes('quest_1'));
    assert.ok(result.state.failedQuests.includes('quest_1'));
    assert.strictEqual(result.state.stats.totalFailed, 1);
  });

  test('records failure reason in log', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const result = failQuest(state, 'quest_1', 'Time expired');

    const lastLog = result.state.questLog[result.state.questLog.length - 1];
    assert.strictEqual(lastLog.type, 'failed');
    assert.strictEqual(lastLog.reason, 'Time expired');
  });

  test('fails for inactive quest', () => {
    const state = createQuestState();
    const result = failQuest(state, 'quest_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Quest not active');
  });
});

// ============================================
// Expired Quest Tests
// ============================================
describe('checkExpiredQuests', () => {
  test('expires timed quests', () => {
    let state = createQuestState();
    let registry = createQuestRegistry();

    const timedQuest = createQuest('timed', 'Timed Quest', 'daily', 'Hurry!', [{ type: 'KILL', target: 1 }], [], { timeLimit: 1 });
    registry = registerQuest(registry, timedQuest.quest).registry;

    state = acceptQuest(state, registry, 'timed').state;
    // Manually set expiry in past
    state.quests['timed'].expiresAt = Date.now() - 1000;

    const result = checkExpiredQuests(state);

    assert.ok(result.expiredQuests.includes('timed'));
    assert.ok(result.state.failedQuests.includes('timed'));
  });

  test('does not expire valid quests', () => {
    let state = createQuestState();
    let registry = createQuestRegistry();

    const timedQuest = createQuest('timed', 'Timed Quest', 'daily', 'Hurry!', [{ type: 'KILL', target: 1 }], [], { timeLimit: 3600000 });
    registry = registerQuest(registry, timedQuest.quest).registry;

    state = acceptQuest(state, registry, 'timed').state;

    const result = checkExpiredQuests(state);

    assert.strictEqual(result.expiredQuests.length, 0);
  });
});

// ============================================
// Quest Progress Tests
// ============================================
describe('getQuestProgress', () => {
  test('returns quest progress', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const objId = state.quests['quest_1'].objectives[0].id;
    state = updateObjective(state, 'quest_1', objId, 2).state;

    const progress = getQuestProgress(state, 'quest_1');

    assert.ok(progress);
    assert.strictEqual(progress.questId, 'quest_1');
    assert.strictEqual(progress.completedObjectives, 0);
    assert.strictEqual(progress.totalObjectives, 1);
    assert.strictEqual(progress.percentComplete, 40); // 2/5 = 40%
  });

  test('returns null for unknown quest', () => {
    const state = createQuestState();
    assert.strictEqual(getQuestProgress(state, 'unknown'), null);
  });
});

// ============================================
// Available and Active Quests Tests
// ============================================
describe('getAvailableQuests', () => {
  test('returns available quests sorted by priority', () => {
    const state = createQuestState();
    const registry = createTestRegistry();

    const available = getAvailableQuests(state, registry);

    assert.ok(available.length > 0);
    // Main quest should be first (priority 1)
    assert.strictEqual(available[0].type, 'MAIN');
  });

  test('filters out active quests', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const available = getAvailableQuests(state, registry);

    assert.ok(!available.some(q => q.id === 'quest_1'));
  });
});

describe('getActiveQuests', () => {
  test('returns active quests with progress', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;
    state = acceptQuest(state, registry, 'quest_2').state;

    const active = getActiveQuests(state, registry);

    assert.strictEqual(active.length, 2);
    assert.ok(active[0].progress);
  });
});

// ============================================
// Chain Progress Tests
// ============================================
describe('getChainProgress', () => {
  test('returns chain progress', () => {
    let registry = createQuestRegistry();
    const quest1 = createQuest('chain_1', 'Part 1', 'main', 'First', [{ type: 'TALK', target: 1 }], [], { chainId: 'story', chainOrder: 0 });
    const quest2 = createQuest('chain_2', 'Part 2', 'main', 'Second', [{ type: 'TALK', target: 1 }], [], { chainId: 'story', chainOrder: 1 });
    registry = registerQuest(registry, quest1.quest).registry;
    registry = registerQuest(registry, quest2.quest).registry;

    let state = createQuestState();
    state = { ...state, completedQuests: ['chain_1'] };

    const progress = getChainProgress(state, registry, 'story');

    assert.ok(progress);
    assert.strictEqual(progress.completed, 1);
    assert.strictEqual(progress.total, 2);
    assert.strictEqual(progress.percentComplete, 50);
    assert.ok(!progress.isComplete);
  });

  test('returns null for unknown chain', () => {
    const state = createQuestState();
    const registry = createQuestRegistry();

    assert.strictEqual(getChainProgress(state, registry, 'unknown'), null);
  });
});

// ============================================
// Search and Filter Tests
// ============================================
describe('searchQuests', () => {
  test('searches by name', () => {
    const registry = createTestRegistry();
    const results = searchQuests(registry, 'first');

    assert.ok(results.length > 0);
    assert.ok(results.some(q => q.name.toLowerCase().includes('first')));
  });

  test('searches by description', () => {
    const registry = createTestRegistry();
    const results = searchQuests(registry, 'description');

    assert.ok(results.length > 0);
  });

  test('returns empty for no match', () => {
    const registry = createTestRegistry();
    const results = searchQuests(registry, 'xyznonexistent');

    assert.strictEqual(results.length, 0);
  });
});

describe('filterQuestsByType', () => {
  test('filters by type', () => {
    const registry = createTestRegistry();
    const mainQuests = filterQuestsByType(registry, 'MAIN');

    assert.ok(mainQuests.length > 0);
    assert.ok(mainQuests.every(q => q.type === 'MAIN'));
  });

  test('returns empty for type with no quests', () => {
    const registry = createTestRegistry();
    const eventQuests = filterQuestsByType(registry, 'EVENT');

    assert.strictEqual(eventQuests.length, 0);
  });
});

// ============================================
// Info and Helper Tests
// ============================================
describe('getQuestTypeInfo', () => {
  test('returns type info', () => {
    const info = getQuestTypeInfo('main');
    assert.ok(info);
    assert.strictEqual(info.name, 'Main Quest');
  });

  test('returns null for invalid type', () => {
    assert.strictEqual(getQuestTypeInfo('invalid'), null);
  });
});

describe('getObjectiveTypeInfo', () => {
  test('returns objective type info', () => {
    const info = getObjectiveTypeInfo('kill');
    assert.ok(info);
    assert.strictEqual(info.name, 'Kill');
    assert.strictEqual(info.verb, 'Defeat');
  });

  test('returns null for invalid type', () => {
    assert.strictEqual(getObjectiveTypeInfo('invalid'), null);
  });
});

describe('createObjective', () => {
  test('creates valid objective', () => {
    const result = createObjective('kill', 10, 'enemy_1', 'Kill 10 goblins');

    assert.ok(result.success);
    assert.strictEqual(result.objective.type, 'KILL');
    assert.strictEqual(result.objective.target, 10);
    assert.strictEqual(result.objective.targetId, 'enemy_1');
    assert.strictEqual(result.objective.description, 'Kill 10 goblins');
  });

  test('fails with invalid type', () => {
    const result = createObjective('invalid', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid objective type');
  });
});

describe('createReward', () => {
  test('creates reward', () => {
    const reward = createReward('gold', 500);

    assert.strictEqual(reward.type, 'gold');
    assert.strictEqual(reward.amount, 500);
  });

  test('creates item reward', () => {
    const reward = createReward('item', 1, 'sword_1');

    assert.strictEqual(reward.type, 'item');
    assert.strictEqual(reward.itemId, 'sword_1');
  });
});

// ============================================
// Quest Log and Stats Tests
// ============================================
describe('getQuestLog', () => {
  test('returns recent log entries', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;
    state = acceptQuest(state, registry, 'quest_2').state;

    const log = getQuestLog(state);

    assert.strictEqual(log.length, 2);
    // Most recent first
    assert.strictEqual(log[0].questId, 'quest_2');
  });

  test('limits results', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;
    state = acceptQuest(state, registry, 'quest_2').state;

    const log = getQuestLog(state, 1);

    assert.strictEqual(log.length, 1);
  });
});

describe('getQuestStats', () => {
  test('returns comprehensive stats', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state;

    const stats = getQuestStats(state);

    assert.strictEqual(stats.totalStarted, 1);
    assert.strictEqual(stats.activeCount, 1);
    assert.strictEqual(stats.completedCount, 0);
    assert.strictEqual(stats.completionRate, 0);
  });

  test('calculates completion rate', () => {
    let state = createQuestState();
    state = {
      ...state,
      stats: { totalStarted: 10, totalCompleted: 8, totalFailed: 2, mainQuestsCompleted: 3, sideQuestsCompleted: 5 },
      activeQuests: [],
      completedQuests: [],
      failedQuests: []
    };

    const stats = getQuestStats(state);

    assert.strictEqual(stats.completionRate, 80);
  });
});

describe('trackQuestsByType', () => {
  test('groups active quests by type', () => {
    let state = createQuestState();
    const registry = createTestRegistry();
    state = acceptQuest(state, registry, 'quest_1').state; // MAIN
    state = acceptQuest(state, registry, 'quest_2').state; // SIDE
    state = acceptQuest(state, registry, 'quest_3').state; // DAILY

    const tracked = trackQuestsByType(state, registry);

    assert.ok(tracked['MAIN']);
    assert.ok(tracked['SIDE']);
    assert.ok(tracked['DAILY']);
    assert.strictEqual(tracked['MAIN'].length, 1);
  });
});
