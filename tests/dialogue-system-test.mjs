/**
 * Dialogue System Tests
 * Tests for NPC conversations and branching dialogue
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  NODE_TYPES,
  CONDITION_TYPES,
  ACTION_TYPES,
  createDialogueState,
  createDialogue,
  createTextNode,
  createChoiceNode,
  createBranchNode,
  createActionNode,
  createEndNode,
  createDialogueRegistry,
  registerDialogue,
  checkCondition,
  checkConditions,
  startDialogue,
  getCurrentNode,
  getAvailableChoices,
  advanceDialogue,
  selectChoice,
  endDialogue,
  setDialogueFlag,
  getDialogueFlag,
  setNpcState,
  getNpcState,
  getDialoguesForNpc,
  getBestDialogueForNpc,
  getDialogueStats,
  getConversationHistory,
  createCondition,
  createAction,
  processActions,
  hasDialogue,
  getNpcsWithDialogue
} from '../src/dialogue-system.js';

// Helper to create test dialogue
function createTestDialogue() {
  const nodes = {
    'start': createTextNode('start', 'Hello traveler!', 'choice1'),
    'choice1': createChoiceNode('choice1', 'What brings you here?', [
      { text: 'I seek adventure', next: 'adventure' },
      { text: 'Just passing through', next: 'passing' },
      { text: 'Got any quests?', next: 'quests', conditions: [{ type: 'level_min', value: 5 }] }
    ]),
    'adventure': createTextNode('adventure', 'A brave soul!', 'end'),
    'passing': createTextNode('passing', 'Safe travels.', 'end'),
    'quests': createTextNode('quests', 'I have a task for you.', 'end'),
    'end': createEndNode('end')
  };

  return createDialogue('test_dialogue', 'npc_merchant', nodes, 'start').dialogue;
}

// Helper to create test registry
function createTestRegistry() {
  let registry = createDialogueRegistry();
  const dialogue = createTestDialogue();
  registry = registerDialogue(registry, dialogue).registry;
  return registry;
}

// ============================================
// Constants Tests
// ============================================
describe('Dialogue System Constants', () => {
  test('NODE_TYPES has all types', () => {
    assert.strictEqual(NODE_TYPES.TEXT, 'text');
    assert.strictEqual(NODE_TYPES.CHOICE, 'choice');
    assert.strictEqual(NODE_TYPES.BRANCH, 'branch');
    assert.strictEqual(NODE_TYPES.ACTION, 'action');
    assert.strictEqual(NODE_TYPES.END, 'end');
  });

  test('CONDITION_TYPES has all types', () => {
    assert.ok(CONDITION_TYPES.QUEST_COMPLETE);
    assert.ok(CONDITION_TYPES.QUEST_ACTIVE);
    assert.ok(CONDITION_TYPES.ITEM_HAS);
    assert.ok(CONDITION_TYPES.LEVEL_MIN);
    assert.ok(CONDITION_TYPES.REPUTATION_MIN);
    assert.ok(CONDITION_TYPES.FLAG_SET);
    assert.ok(CONDITION_TYPES.STAT_MIN);
  });

  test('ACTION_TYPES has all types', () => {
    assert.ok(ACTION_TYPES.GIVE_ITEM);
    assert.ok(ACTION_TYPES.TAKE_ITEM);
    assert.ok(ACTION_TYPES.GIVE_GOLD);
    assert.ok(ACTION_TYPES.TAKE_GOLD);
    assert.ok(ACTION_TYPES.START_QUEST);
    assert.ok(ACTION_TYPES.COMPLETE_QUEST);
    assert.ok(ACTION_TYPES.SET_FLAG);
    assert.ok(ACTION_TYPES.ADD_REPUTATION);
    assert.ok(ACTION_TYPES.OPEN_SHOP);
  });
});

// ============================================
// State Creation Tests
// ============================================
describe('createDialogueState', () => {
  test('creates initial state', () => {
    const state = createDialogueState();
    assert.strictEqual(state.activeDialogue, null);
    assert.strictEqual(state.currentNode, null);
    assert.deepStrictEqual(state.history, []);
    assert.deepStrictEqual(state.flags, {});
    assert.deepStrictEqual(state.npcStates, {});
  });

  test('creates initial stats', () => {
    const state = createDialogueState();
    assert.strictEqual(state.stats.conversationsStarted, 0);
    assert.strictEqual(state.stats.conversationsCompleted, 0);
    assert.strictEqual(state.stats.choicesMade, 0);
  });
});

describe('createDialogueRegistry', () => {
  test('creates empty registry', () => {
    const registry = createDialogueRegistry();
    assert.deepStrictEqual(registry.dialogues, {});
    assert.deepStrictEqual(registry.byNpc, {});
  });
});

// ============================================
// Node Creation Tests
// ============================================
describe('createTextNode', () => {
  test('creates text node', () => {
    const node = createTextNode('node1', 'Hello!', 'node2');
    assert.strictEqual(node.id, 'node1');
    assert.strictEqual(node.type, NODE_TYPES.TEXT);
    assert.strictEqual(node.text, 'Hello!');
    assert.strictEqual(node.next, 'node2');
  });
});

describe('createChoiceNode', () => {
  test('creates choice node', () => {
    const node = createChoiceNode('choice1', 'Pick one:', [
      { text: 'Option A', next: 'nodeA' },
      { text: 'Option B', next: 'nodeB' }
    ]);

    assert.strictEqual(node.id, 'choice1');
    assert.strictEqual(node.type, NODE_TYPES.CHOICE);
    assert.strictEqual(node.text, 'Pick one:');
    assert.strictEqual(node.choices.length, 2);
  });

  test('includes conditions and actions in choices', () => {
    const node = createChoiceNode('choice1', 'Pick:', [
      { text: 'Option', next: 'next', conditions: [{ type: 'level_min', value: 5 }], actions: [{ type: 'give_gold', value: 100 }] }
    ]);

    assert.ok(node.choices[0].conditions.length > 0);
    assert.ok(node.choices[0].actions.length > 0);
  });
});

describe('createBranchNode', () => {
  test('creates branch node', () => {
    const node = createBranchNode('branch1', [
      { conditions: [{ type: 'flag_set', target: 'met_before' }], next: 'met' },
      { conditions: [{ type: 'level_min', value: 10 }], next: 'high_level' }
    ], 'default');

    assert.strictEqual(node.id, 'branch1');
    assert.strictEqual(node.type, NODE_TYPES.BRANCH);
    assert.strictEqual(node.branches.length, 2);
    assert.strictEqual(node.default, 'default');
  });
});

describe('createActionNode', () => {
  test('creates action node', () => {
    const node = createActionNode('action1', [
      { type: 'give_item', target: 'potion', value: 1 }
    ], 'next');

    assert.strictEqual(node.id, 'action1');
    assert.strictEqual(node.type, NODE_TYPES.ACTION);
    assert.strictEqual(node.actions.length, 1);
    assert.strictEqual(node.next, 'next');
  });
});

describe('createEndNode', () => {
  test('creates end node', () => {
    const node = createEndNode('end1');
    assert.strictEqual(node.id, 'end1');
    assert.strictEqual(node.type, NODE_TYPES.END);
  });
});

// ============================================
// Dialogue Creation Tests
// ============================================
describe('createDialogue', () => {
  test('creates valid dialogue', () => {
    const nodes = {
      'start': createTextNode('start', 'Hello', 'end'),
      'end': createEndNode('end')
    };

    const result = createDialogue('dialogue1', 'npc1', nodes, 'start');

    assert.ok(result.success);
    assert.strictEqual(result.dialogue.id, 'dialogue1');
    assert.strictEqual(result.dialogue.npcId, 'npc1');
    assert.strictEqual(result.dialogue.startNodeId, 'start');
  });

  test('fails without id', () => {
    const result = createDialogue(null, 'npc1', {}, 'start');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid dialogue id or npc id');
  });

  test('fails without npc id', () => {
    const result = createDialogue('id1', null, {}, 'start');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid dialogue id or npc id');
  });

  test('fails without nodes', () => {
    const result = createDialogue('id1', 'npc1', {}, 'start');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Dialogue must have at least one node');
  });

  test('fails with invalid start node', () => {
    const nodes = { 'other': createEndNode('other') };
    const result = createDialogue('id1', 'npc1', nodes, 'start');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Start node not found');
  });
});

// ============================================
// Registry Tests
// ============================================
describe('registerDialogue', () => {
  test('registers dialogue', () => {
    let registry = createDialogueRegistry();
    const dialogue = createTestDialogue();
    const result = registerDialogue(registry, dialogue);

    assert.ok(result.success);
    assert.ok(result.registry.dialogues['test_dialogue']);
    assert.ok(result.registry.byNpc['npc_merchant'].includes('test_dialogue'));
  });

  test('fails with invalid dialogue', () => {
    const registry = createDialogueRegistry();
    const result = registerDialogue(registry, null);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid dialogue');
  });

  test('fails with duplicate dialogue', () => {
    let registry = createDialogueRegistry();
    const dialogue = createTestDialogue();
    registry = registerDialogue(registry, dialogue).registry;
    const result = registerDialogue(registry, dialogue);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Dialogue already registered');
  });
});

// ============================================
// Condition Tests
// ============================================
describe('checkCondition', () => {
  test('checks quest_complete', () => {
    const gameState = { completedQuests: ['quest1'] };
    assert.ok(checkCondition({ type: 'quest_complete', target: 'quest1' }, gameState));
    assert.ok(!checkCondition({ type: 'quest_complete', target: 'quest2' }, gameState));
  });

  test('checks quest_active', () => {
    const gameState = { activeQuests: ['quest1'] };
    assert.ok(checkCondition({ type: 'quest_active', target: 'quest1' }, gameState));
    assert.ok(!checkCondition({ type: 'quest_active', target: 'quest2' }, gameState));
  });

  test('checks item_has', () => {
    const gameState = { inventory: { 'potion': 5 } };
    assert.ok(checkCondition({ type: 'item_has', target: 'potion', value: 3 }, gameState));
    assert.ok(!checkCondition({ type: 'item_has', target: 'potion', value: 10 }, gameState));
  });

  test('checks level_min', () => {
    const gameState = { level: 10 };
    assert.ok(checkCondition({ type: 'level_min', value: 5 }, gameState));
    assert.ok(!checkCondition({ type: 'level_min', value: 15 }, gameState));
  });

  test('checks reputation_min', () => {
    const gameState = { reputation: { 'guild': 50 } };
    assert.ok(checkCondition({ type: 'reputation_min', target: 'guild', value: 30 }, gameState));
    assert.ok(!checkCondition({ type: 'reputation_min', target: 'guild', value: 100 }, gameState));
  });

  test('checks flag_set', () => {
    const gameState = { flags: { 'met_npc': true } };
    assert.ok(checkCondition({ type: 'flag_set', target: 'met_npc' }, gameState));
    assert.ok(!checkCondition({ type: 'flag_set', target: 'other_flag' }, gameState));
  });

  test('checks stat_min', () => {
    const gameState = { stats: { 'strength': 20 } };
    assert.ok(checkCondition({ type: 'stat_min', target: 'strength', value: 15 }, gameState));
    assert.ok(!checkCondition({ type: 'stat_min', target: 'strength', value: 25 }, gameState));
  });

  test('returns true for unknown type', () => {
    assert.ok(checkCondition({ type: 'unknown' }, {}));
  });
});

describe('checkConditions', () => {
  test('returns true for empty conditions', () => {
    assert.ok(checkConditions([], {}));
    assert.ok(checkConditions(null, {}));
  });

  test('returns true when all conditions met', () => {
    const conditions = [
      { type: 'level_min', value: 5 },
      { type: 'flag_set', target: 'flag1' }
    ];
    const gameState = { level: 10, flags: { flag1: true } };

    assert.ok(checkConditions(conditions, gameState));
  });

  test('returns false when any condition fails', () => {
    const conditions = [
      { type: 'level_min', value: 5 },
      { type: 'level_min', value: 20 }
    ];
    const gameState = { level: 10 };

    assert.ok(!checkConditions(conditions, gameState));
  });
});

// ============================================
// Dialogue Flow Tests
// ============================================
describe('startDialogue', () => {
  test('starts dialogue', () => {
    const state = createDialogueState();
    const registry = createTestRegistry();

    const result = startDialogue(state, registry, 'test_dialogue');

    assert.ok(result.success);
    assert.ok(result.node);
    assert.strictEqual(result.state.activeDialogue, 'test_dialogue');
    assert.strictEqual(result.state.currentNode, 'start');
    assert.strictEqual(result.state.stats.conversationsStarted, 1);
  });

  test('adds to history', () => {
    const state = createDialogueState();
    const registry = createTestRegistry();

    const result = startDialogue(state, registry, 'test_dialogue');

    assert.strictEqual(result.state.history.length, 1);
    assert.strictEqual(result.state.history[0].dialogueId, 'test_dialogue');
  });

  test('fails for unknown dialogue', () => {
    const state = createDialogueState();
    const registry = createTestRegistry();

    const result = startDialogue(state, registry, 'unknown');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Dialogue not found');
  });

  test('fails when dialogue already active', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;

    const result = startDialogue(state, registry, 'test_dialogue');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Dialogue already active');
  });
});

describe('getCurrentNode', () => {
  test('returns current node', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;

    const node = getCurrentNode(state, registry);

    assert.ok(node);
    assert.strictEqual(node.id, 'start');
  });

  test('returns null when no active dialogue', () => {
    const state = createDialogueState();
    const registry = createTestRegistry();

    assert.strictEqual(getCurrentNode(state, registry), null);
  });
});

describe('getAvailableChoices', () => {
  test('returns available choices', () => {
    const node = createChoiceNode('choice', 'Pick:', [
      { text: 'A', next: 'a' },
      { text: 'B', next: 'b' }
    ]);

    const choices = getAvailableChoices(node, {});

    assert.strictEqual(choices.length, 2);
    assert.ok(choices[0].available);
  });

  test('filters by conditions', () => {
    const node = createChoiceNode('choice', 'Pick:', [
      { text: 'A', next: 'a' },
      { text: 'B', next: 'b', conditions: [{ type: 'level_min', value: 10 }] }
    ]);

    const lowLevel = getAvailableChoices(node, { level: 5 });
    const highLevel = getAvailableChoices(node, { level: 15 });

    assert.strictEqual(lowLevel.length, 1);
    assert.strictEqual(highLevel.length, 2);
  });

  test('returns empty for non-choice node', () => {
    const node = createTextNode('text', 'Hello', 'next');
    const choices = getAvailableChoices(node, {});

    assert.strictEqual(choices.length, 0);
  });
});

describe('advanceDialogue', () => {
  test('advances text node', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;

    const result = advanceDialogue(state, registry);

    assert.ok(result.success);
    assert.strictEqual(result.state.currentNode, 'choice1');
  });

  test('fails on choice node', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = advanceDialogue(state, registry).state;

    const result = advanceDialogue(state, registry);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Must select a choice');
  });

  test('ends on end node', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = advanceDialogue(state, registry).state; // to choice
    state = selectChoice(state, registry, 0, {}).state; // select adventure
    state = advanceDialogue(state, registry).state; // to end

    const result = advanceDialogue(state, registry);

    assert.ok(result.success);
    assert.strictEqual(result.state.activeDialogue, null);
  });

  test('fails when no active dialogue', () => {
    const state = createDialogueState();
    const registry = createTestRegistry();

    const result = advanceDialogue(state, registry);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'No active dialogue');
  });
});

describe('selectChoice', () => {
  test('selects valid choice', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = advanceDialogue(state, registry).state;

    const result = selectChoice(state, registry, 0, {});

    assert.ok(result.success);
    assert.strictEqual(result.chosenText, 'I seek adventure');
    assert.strictEqual(result.state.currentNode, 'adventure');
    assert.strictEqual(result.state.stats.choicesMade, 1);
  });

  test('fails for invalid index', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = advanceDialogue(state, registry).state;

    const result = selectChoice(state, registry, 99, {});

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid choice index');
  });

  test('fails when conditions not met', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = advanceDialogue(state, registry).state;

    // Choice 2 requires level 5
    const result = selectChoice(state, registry, 2, { level: 1 });

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Choice conditions not met');
  });

  test('allows choice when conditions met', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = advanceDialogue(state, registry).state;

    const result = selectChoice(state, registry, 2, { level: 10 });

    assert.ok(result.success);
    assert.strictEqual(result.state.currentNode, 'quests');
  });

  test('fails on non-choice node', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;

    const result = selectChoice(state, registry, 0, {});

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Current node is not a choice node');
  });
});

describe('endDialogue', () => {
  test('ends active dialogue', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;

    const result = endDialogue(state);

    assert.ok(result.success);
    assert.strictEqual(result.state.activeDialogue, null);
    assert.strictEqual(result.state.currentNode, null);
    assert.strictEqual(result.state.stats.conversationsCompleted, 1);
  });

  test('fails when no active dialogue', () => {
    const state = createDialogueState();

    const result = endDialogue(state);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'No active dialogue');
  });
});

// ============================================
// Flag and NPC State Tests
// ============================================
describe('setDialogueFlag and getDialogueFlag', () => {
  test('sets and gets flag', () => {
    let state = createDialogueState();
    state = setDialogueFlag(state, 'test_flag', true);

    assert.ok(getDialogueFlag(state, 'test_flag'));
  });

  test('returns false for unset flag', () => {
    const state = createDialogueState();
    assert.ok(!getDialogueFlag(state, 'unknown'));
  });
});

describe('setNpcState and getNpcState', () => {
  test('sets and gets NPC state', () => {
    let state = createDialogueState();
    state = setNpcState(state, 'npc1', { mood: 'happy', met: true });

    const npcState = getNpcState(state, 'npc1');

    assert.strictEqual(npcState.mood, 'happy');
    assert.ok(npcState.met);
  });

  test('returns empty object for unknown NPC', () => {
    const state = createDialogueState();
    assert.deepStrictEqual(getNpcState(state, 'unknown'), {});
  });

  test('merges NPC state', () => {
    let state = createDialogueState();
    state = setNpcState(state, 'npc1', { mood: 'happy' });
    state = setNpcState(state, 'npc1', { met: true });

    const npcState = getNpcState(state, 'npc1');

    assert.strictEqual(npcState.mood, 'happy');
    assert.ok(npcState.met);
  });
});

// ============================================
// Query Tests
// ============================================
describe('getDialoguesForNpc', () => {
  test('returns dialogues for NPC', () => {
    const registry = createTestRegistry();
    const dialogues = getDialoguesForNpc(registry, 'npc_merchant');

    assert.strictEqual(dialogues.length, 1);
    assert.strictEqual(dialogues[0].id, 'test_dialogue');
  });

  test('returns empty for unknown NPC', () => {
    const registry = createTestRegistry();
    const dialogues = getDialoguesForNpc(registry, 'unknown');

    assert.strictEqual(dialogues.length, 0);
  });
});

describe('getBestDialogueForNpc', () => {
  test('returns first available dialogue', () => {
    const registry = createTestRegistry();
    const dialogue = getBestDialogueForNpc(registry, 'npc_merchant');

    assert.ok(dialogue);
    assert.strictEqual(dialogue.id, 'test_dialogue');
  });

  test('returns null for unknown NPC', () => {
    const registry = createTestRegistry();
    const dialogue = getBestDialogueForNpc(registry, 'unknown');

    assert.strictEqual(dialogue, null);
  });
});

describe('hasDialogue', () => {
  test('returns true for NPC with dialogue', () => {
    const registry = createTestRegistry();
    assert.ok(hasDialogue(registry, 'npc_merchant'));
  });

  test('returns false for NPC without dialogue', () => {
    const registry = createTestRegistry();
    assert.ok(!hasDialogue(registry, 'unknown'));
  });
});

describe('getNpcsWithDialogue', () => {
  test('returns NPC IDs', () => {
    const registry = createTestRegistry();
    const npcs = getNpcsWithDialogue(registry);

    assert.ok(npcs.includes('npc_merchant'));
  });
});

// ============================================
// Stats and History Tests
// ============================================
describe('getDialogueStats', () => {
  test('returns comprehensive stats', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = setDialogueFlag(state, 'flag1', true);

    const stats = getDialogueStats(state);

    assert.strictEqual(stats.conversationsStarted, 1);
    assert.strictEqual(stats.flagsSet, 1);
    assert.ok(stats.isInDialogue);
  });
});

describe('getConversationHistory', () => {
  test('returns recent history', () => {
    let state = createDialogueState();
    const registry = createTestRegistry();
    state = startDialogue(state, registry, 'test_dialogue').state;
    state = endDialogue(state).state;

    const history = getConversationHistory(state, 5);

    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].dialogueId, 'test_dialogue');
  });
});

// ============================================
// Helper Function Tests
// ============================================
describe('createCondition', () => {
  test('creates condition', () => {
    const condition = createCondition('level_min', null, 10);

    assert.strictEqual(condition.type, 'level_min');
    assert.strictEqual(condition.value, 10);
  });
});

describe('createAction', () => {
  test('creates action', () => {
    const action = createAction('give_gold', null, 100);

    assert.strictEqual(action.type, 'give_gold');
    assert.strictEqual(action.value, 100);
  });
});

describe('processActions', () => {
  test('processes actions with descriptions', () => {
    const actions = [
      { type: 'give_item', target: 'sword', value: 1 },
      { type: 'give_gold', value: 100 },
      { type: 'start_quest', target: 'main_quest' }
    ];

    const results = processActions(actions);

    assert.strictEqual(results.length, 3);
    assert.ok(results[0].description.includes('sword'));
    assert.ok(results[1].description.includes('100'));
    assert.ok(results[2].description.includes('main_quest'));
  });

  test('returns empty for no actions', () => {
    assert.deepStrictEqual(processActions([]), []);
    assert.deepStrictEqual(processActions(null), []);
  });
});
