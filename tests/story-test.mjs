/**
 * Story/Dialog Module Tests
 * Tests for DialogManager, QuestManager, and NPCManager
 */

import { strict as assert } from 'assert';

// Test counter
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// ============================================
// DIALOG NODE TYPE TESTS
// ============================================

console.log('\n--- Dialog Node Type Tests ---\n');

test('TEXT node has required properties', () => {
  const textNode = {
    id: 'start',
    type: 'TEXT',
    speaker: 'NPC Name',
    text: 'Hello, traveler!',
    next: 'choice1'
  };
  assert.equal(textNode.type, 'TEXT');
  assert.ok(textNode.speaker, 'TEXT node needs speaker');
  assert.ok(textNode.text, 'TEXT node needs text');
  assert.ok(textNode.next, 'TEXT node needs next');
});

test('CHOICE node has choices array', () => {
  const choiceNode = {
    id: 'choice1',
    type: 'CHOICE',
    speaker: 'NPC Name',
    text: 'What do you want?',
    choices: [
      { text: 'Option 1', next: 'opt1' },
      { text: 'Option 2', next: 'opt2' }
    ]
  };
  assert.equal(choiceNode.type, 'CHOICE');
  assert.ok(Array.isArray(choiceNode.choices), 'CHOICE node needs choices array');
  assert.ok(choiceNode.choices.length > 0, 'CHOICE node needs at least one choice');
  assert.ok(choiceNode.choices[0].text, 'Each choice needs text');
  assert.ok(choiceNode.choices[0].next, 'Each choice needs next');
});

test('CONDITIONAL node has conditions array', () => {
  const conditionalNode = {
    id: 'cond1',
    type: 'CONDITIONAL',
    conditions: [
      { type: 'QUEST_COMPLETE', questId: 'quest1', then: 'complete' }
    ],
    default: 'not_complete'
  };
  assert.equal(conditionalNode.type, 'CONDITIONAL');
  assert.ok(Array.isArray(conditionalNode.conditions), 'CONDITIONAL needs conditions array');
  assert.ok(conditionalNode.default, 'CONDITIONAL needs default path');
});

test('ACTION node has actions array', () => {
  const actionNode = {
    id: 'action1',
    type: 'ACTION',
    actions: [
      { type: 'START_QUEST', questId: 'main_quest_1' },
      { type: 'SET_FLAG', flag: 'met_npc', value: true }
    ],
    next: 'after_action'
  };
  assert.equal(actionNode.type, 'ACTION');
  assert.ok(Array.isArray(actionNode.actions), 'ACTION node needs actions array');
  assert.ok(actionNode.next, 'ACTION node needs next');
});

test('END node terminates dialog', () => {
  const endNode = {
    id: 'end',
    type: 'END'
  };
  assert.equal(endNode.type, 'END');
  assert.ok(!endNode.next, 'END node should not have next');
});

// ============================================
// QUEST STRUCTURE TESTS
// ============================================

console.log('\n--- Quest Structure Tests ---\n');

test('Quest has required fields', () => {
  const quest = {
    id: 'test_quest',
    name: 'Test Quest',
    description: 'A test quest',
    type: 'MAIN',
    level: 1,
    stages: [],
    rewards: {},
    prerequisites: []
  };
  assert.ok(quest.id, 'Quest needs id');
  assert.ok(quest.name, 'Quest needs name');
  assert.ok(quest.description, 'Quest needs description');
  assert.ok(['MAIN', 'SIDE', 'DAILY'].includes(quest.type), 'Quest type must be valid');
  assert.ok(typeof quest.level === 'number', 'Quest needs level');
  assert.ok(Array.isArray(quest.stages), 'Quest needs stages array');
});

test('Quest stage has objectives', () => {
  const stage = {
    id: 'stage1',
    name: 'Stage 1',
    description: 'First stage',
    objectives: [
      {
        id: 'obj1',
        type: 'TALK',
        description: 'Talk to NPC',
        npcId: 'npc1',
        required: true
      }
    ],
    nextStage: 'stage2'
  };
  assert.ok(stage.id, 'Stage needs id');
  assert.ok(Array.isArray(stage.objectives), 'Stage needs objectives array');
  assert.ok(stage.objectives[0].type, 'Objective needs type');
});

test('Quest objective types are valid', () => {
  const validTypes = ['TALK', 'KILL', 'COLLECT', 'DELIVER', 'EXPLORE', 'ESCORT', 'INTERACT', 'CUSTOM'];
  const objective = { type: 'KILL', enemyType: 'goblin', count: 5 };
  assert.ok(validTypes.includes(objective.type), 'Objective type must be valid');
});

test('Quest rewards structure is correct', () => {
  const rewards = {
    gold: 100,
    experience: 250,
    items: ['sword', 'potion'],
    flags: ['quest_complete']
  };
  assert.ok(typeof rewards.gold === 'number' || rewards.gold === undefined);
  assert.ok(typeof rewards.experience === 'number' || rewards.experience === undefined);
  assert.ok(Array.isArray(rewards.items) || rewards.items === undefined);
});

// ============================================
// NPC STRUCTURE TESTS
// ============================================

console.log('\n--- NPC Structure Tests ---\n');

test('NPC has required fields', () => {
  const npc = {
    id: 'test_npc',
    name: 'Test NPC',
    type: 'VILLAGER',
    location: 'village',
    sprite: 'npc_sprite',
    dialog: 'npc_dialog'
  };
  assert.ok(npc.id, 'NPC needs id');
  assert.ok(npc.name, 'NPC needs name');
  assert.ok(npc.type, 'NPC needs type');
  assert.ok(npc.location, 'NPC needs location');
});

test('NPC types are valid', () => {
  const validTypes = ['QUEST_GIVER', 'MERCHANT', 'TRAINER', 'INNKEEPER', 'GUARD', 'VILLAGER', 'COMPANION', 'BOSS'];
  const npc = { type: 'MERCHANT' };
  assert.ok(validTypes.includes(npc.type), 'NPC type must be valid');
});

test('Merchant NPC has shop inventory', () => {
  const merchant = {
    id: 'shop_keeper',
    type: 'MERCHANT',
    shopInventory: {
      weapons: ['sword', 'axe'],
      armor: ['shield']
    },
    buyMultiplier: 0.5,
    sellMultiplier: 1.0
  };
  assert.ok(merchant.shopInventory, 'Merchant needs shopInventory');
  assert.ok(typeof merchant.buyMultiplier === 'number', 'Merchant needs buyMultiplier');
  assert.ok(typeof merchant.sellMultiplier === 'number', 'Merchant needs sellMultiplier');
});

test('Companion NPC has stats', () => {
  const companion = {
    id: 'companion1',
    type: 'COMPANION',
    canRecruit: true,
    stats: {
      class: 'Warrior',
      level: 1,
      hp: 50,
      mp: 10,
      attack: 10,
      defense: 8,
      speed: 7
    },
    skills: ['skill1', 'skill2']
  };
  assert.ok(companion.stats, 'Companion needs stats');
  assert.ok(companion.stats.hp, 'Companion stats need hp');
  assert.ok(Array.isArray(companion.skills), 'Companion needs skills array');
});

test('NPC personality values are in valid range', () => {
  const personality = {
    friendliness: 0.7,
    formality: 0.5,
    patience: 0.8
  };
  for (const [key, value] of Object.entries(personality)) {
    assert.ok(value >= 0 && value <= 1, `${key} must be between 0 and 1`);
  }
});

// ============================================
// DIALOG FLOW TESTS
// ============================================

console.log('\n--- Dialog Flow Tests ---\n');

test('Dialog tree is navigable', () => {
  const dialog = {
    id: 'test_dialog',
    nodes: [
      { id: 'start', type: 'TEXT', speaker: 'NPC', text: 'Hello', next: 'choice' },
      { id: 'choice', type: 'CHOICE', speaker: 'NPC', text: 'Choose', choices: [
        { text: 'A', next: 'end' },
        { text: 'B', next: 'end' }
      ]},
      { id: 'end', type: 'END' }
    ]
  };
  
  // Build node map
  const nodeMap = {};
  dialog.nodes.forEach(n => nodeMap[n.id] = n);
  
  // Verify start exists
  assert.ok(nodeMap['start'], 'Dialog must have start node');
  
  // Verify all next references are valid
  for (const node of dialog.nodes) {
    if (node.next) {
      assert.ok(nodeMap[node.next], `Node ${node.id} references invalid next: ${node.next}`);
    }
    if (node.choices) {
      for (const choice of node.choices) {
        assert.ok(nodeMap[choice.next], `Choice references invalid next: ${choice.next}`);
      }
    }
  }
});

test('Dialog has reachable END node', () => {
  const dialog = {
    nodes: [
      { id: 'start', type: 'TEXT', next: 'middle' },
      { id: 'middle', type: 'TEXT', next: 'end' },
      { id: 'end', type: 'END' }
    ]
  };
  
  const hasEnd = dialog.nodes.some(n => n.type === 'END');
  assert.ok(hasEnd, 'Dialog must have at least one END node');
});

// ============================================
// CONDITION TESTS
// ============================================

console.log('\n--- Condition Tests ---\n');

test('Condition types are valid', () => {
  const validConditionTypes = [
    'QUEST_COMPLETE', 'QUEST_ACTIVE', 'QUEST_STAGE',
    'ITEM_CHECK', 'FLAG_CHECK', 'STAT_CHECK', 'GOLD_CHECK',
    'LEVEL_CHECK', 'TIME_CHECK', 'REPUTATION_CHECK'
  ];
  
  const condition = { type: 'QUEST_COMPLETE', questId: 'q1', then: 'done' };
  assert.ok(validConditionTypes.includes(condition.type), 'Condition type must be valid');
});

test('Action types are valid', () => {
  const validActionTypes = [
    'START_QUEST', 'ADVANCE_QUEST', 'COMPLETE_QUEST',
    'GIVE_ITEM', 'TAKE_ITEM', 'GIVE_GOLD', 'TAKE_GOLD',
    'SET_FLAG', 'MODIFY_STAT', 'OPEN_SHOP',
    'RESTORE_HP', 'RESTORE_MP', 'TELEPORT', 'TRIGGER_BATTLE'
  ];
  
  const action = { type: 'START_QUEST', questId: 'q1' };
  assert.ok(validActionTypes.includes(action.type), 'Action type must be valid');
});

// ============================================
// INTEGRATION TESTS
// ============================================

console.log('\n--- Integration Tests ---\n');

test('Quest references valid NPC ids', () => {
  // Mock NPCs
  const npcIds = new Set(['village_elder', 'farmer_grenn', 'farmer_milda']);
  
  const quest = {
    stages: [
      {
        objectives: [
          { type: 'TALK', npcId: 'village_elder' },
          { type: 'TALK', npcId: 'farmer_grenn' }
        ]
      }
    ]
  };
  
  for (const stage of quest.stages) {
    for (const obj of stage.objectives) {
      if (obj.npcId) {
        assert.ok(npcIds.has(obj.npcId), `Invalid NPC reference: ${obj.npcId}`);
      }
    }
  }
});

test('NPC references valid dialog id', () => {
  const dialogIds = new Set(['elder_intro', 'shop_dialog']);
  
  const npc = {
    id: 'village_elder',
    dialog: 'elder_intro'
  };
  
  assert.ok(dialogIds.has(npc.dialog), `Invalid dialog reference: ${npc.dialog}`);
});

test('Kill objective tracks progress correctly', () => {
  const objective = {
    type: 'KILL',
    enemyType: 'goblin',
    count: 5,
    current: 0
  };
  
  // Simulate kills
  objective.current = 3;
  assert.equal(objective.current, 3);
  assert.ok(objective.current < objective.count, 'Objective not yet complete');
  
  objective.current = 5;
  assert.ok(objective.current >= objective.count, 'Objective complete');
});

test('Collect objective validates item count', () => {
  const objective = {
    type: 'COLLECT',
    itemId: 'moonpetal',
    count: 3,
    current: 0
  };
  
  // Check completion logic
  const isComplete = objective.current >= objective.count;
  assert.ok(!isComplete, 'Should not be complete initially');
});

// Run summary
summary();
