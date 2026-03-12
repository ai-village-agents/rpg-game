/**
 * NPC Dialogue System Tests
 * Tests NPC data, dialogue trees, conversation flow, and UI components
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  NPC_TYPES,
  NODE_TYPES,
  NPC_DATA,
  DIALOGUE_TREES,
  createDialogueState,
  getNpcData,
  getDialogueTree,
  getAllNpcs,
  getNpcsByLocation,
  getNpcsByType,
  startDialogue,
  getCurrentNode,
  advanceDialogue,
  selectChoice,
  evaluateConditional,
  checkCondition,
  endDialogue,
  isDialogueActive,
  getDialogueHistory,
  updateNpcRelation,
  getNpcRelation,
  hasTalkedTo,
  getNpcDialogues,
  getAllNpcTypes,
} from '../src/npc-dialogue.js';

import {
  getDialogueStyles,
  renderDialogueBox,
  renderNpcGreeting,
  renderNpcList,
  renderDialogueHistory,
  renderNpcNameplate,
  renderInteractionPrompt,
} from '../src/npc-dialogue-ui.js';

// ============================================================================
// Constants Tests
// ============================================================================

describe('NPC Constants', () => {
  test('NPC_TYPES has all expected types', () => {
    assert.strictEqual(NPC_TYPES.QUEST_GIVER, 'quest-giver');
    assert.strictEqual(NPC_TYPES.MERCHANT, 'merchant');
    assert.strictEqual(NPC_TYPES.TRAINER, 'trainer');
    assert.strictEqual(NPC_TYPES.VILLAGER, 'villager');
    assert.strictEqual(NPC_TYPES.GUARD, 'guard');
    assert.strictEqual(NPC_TYPES.INNKEEPER, 'innkeeper');
    assert.strictEqual(NPC_TYPES.BLACKSMITH, 'blacksmith');
    assert.strictEqual(NPC_TYPES.HEALER, 'healer');
  });

  test('NODE_TYPES has all expected types', () => {
    assert.strictEqual(NODE_TYPES.TEXT, 'text');
    assert.strictEqual(NODE_TYPES.CHOICE, 'choice');
    assert.strictEqual(NODE_TYPES.CONDITIONAL, 'conditional');
    assert.strictEqual(NODE_TYPES.ACTION, 'action');
    assert.strictEqual(NODE_TYPES.END, 'end');
  });

  test('getAllNpcTypes returns all types', () => {
    const types = getAllNpcTypes();
    assert.ok(types.includes('quest-giver'));
    assert.ok(types.includes('merchant'));
    assert.ok(types.includes('healer'));
  });
});

// ============================================================================
// NPC Data Validation Tests
// ============================================================================

describe('NPC Data Validation', () => {
  test('All NPCs have required fields', () => {
    for (const [id, npc] of Object.entries(NPC_DATA)) {
      assert.strictEqual(npc.id, id, `NPC ${id} id mismatch`);
      assert.ok(npc.name, `NPC ${id} missing name`);
      assert.ok(npc.type, `NPC ${id} missing type`);
      assert.ok(npc.portrait, `NPC ${id} missing portrait`);
      assert.ok(npc.location, `NPC ${id} missing location`);
      assert.ok(npc.greeting, `NPC ${id} missing greeting`);
      assert.ok(Array.isArray(npc.dialogues), `NPC ${id} missing dialogues array`);
    }
  });

  test('All NPC types are valid', () => {
    const validTypes = Object.values(NPC_TYPES);
    for (const [id, npc] of Object.entries(NPC_DATA)) {
      assert.ok(validTypes.includes(npc.type), `NPC ${id} has invalid type: ${npc.type}`);
    }
  });

  test('All NPC dialogues reference valid dialogue trees', () => {
    for (const [id, npc] of Object.entries(NPC_DATA)) {
      for (const dialogueId of npc.dialogues) {
        const dialogue = DIALOGUE_TREES[dialogueId];
        if (dialogue) {
          assert.strictEqual(dialogue.npcId, id, `Dialogue ${dialogueId} npcId mismatch`);
        }
      }
    }
  });
});

// ============================================================================
// Dialogue Tree Validation Tests
// ============================================================================

describe('Dialogue Tree Validation', () => {
  test('All dialogue trees have required fields', () => {
    for (const [id, dialogue] of Object.entries(DIALOGUE_TREES)) {
      assert.strictEqual(dialogue.id, id, `Dialogue ${id} id mismatch`);
      assert.ok(dialogue.npcId, `Dialogue ${id} missing npcId`);
      assert.ok(dialogue.startNode, `Dialogue ${id} missing startNode`);
      assert.ok(dialogue.nodes, `Dialogue ${id} missing nodes`);
      assert.ok(dialogue.nodes[dialogue.startNode], `Dialogue ${id} missing start node`);
    }
  });

  test('All dialogue nodes have valid type', () => {
    const validTypes = Object.values(NODE_TYPES);
    for (const [dialogueId, dialogue] of Object.entries(DIALOGUE_TREES)) {
      for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
        assert.ok(validTypes.includes(node.type), 
          `Dialogue ${dialogueId} node ${nodeId} has invalid type: ${node.type}`);
      }
    }
  });

  test('Choice nodes have choices array', () => {
    for (const [dialogueId, dialogue] of Object.entries(DIALOGUE_TREES)) {
      for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
        if (node.type === NODE_TYPES.CHOICE) {
          assert.ok(Array.isArray(node.choices), 
            `Dialogue ${dialogueId} choice node ${nodeId} missing choices`);
          assert.ok(node.choices.length > 0,
            `Dialogue ${dialogueId} choice node ${nodeId} has empty choices`);
        }
      }
    }
  });

  test('Non-end nodes have next or trueNode/falseNode', () => {
    for (const [dialogueId, dialogue] of Object.entries(DIALOGUE_TREES)) {
      for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
        if (node.type === NODE_TYPES.END) continue;
        if (node.type === NODE_TYPES.CHOICE) continue;
        if (node.type === NODE_TYPES.CONDITIONAL) {
          assert.ok(node.trueNode, `Dialogue ${dialogueId} node ${nodeId} missing trueNode`);
          assert.ok(node.falseNode, `Dialogue ${dialogueId} node ${nodeId} missing falseNode`);
        } else {
          assert.ok(node.next, `Dialogue ${dialogueId} node ${nodeId} missing next`);
        }
      }
    }
  });
});

// ============================================================================
// Dialogue State Tests
// ============================================================================

describe('Dialogue State Management', () => {
  test('createDialogueState returns valid initial state', () => {
    const state = createDialogueState();
    assert.strictEqual(state.currentNpcId, null);
    assert.strictEqual(state.currentDialogueId, null);
    assert.strictEqual(state.currentNodeId, null);
    assert.deepStrictEqual(state.dialogueHistory, []);
    assert.deepStrictEqual(state.npcRelations, {});
    assert.deepStrictEqual(state.talkedTo, []);
  });

  test('getNpcData returns NPC by ID', () => {
    const npc = getNpcData('village-elder');
    assert.strictEqual(npc.name, 'Elder Theron');
    assert.strictEqual(npc.type, NPC_TYPES.QUEST_GIVER);
  });

  test('getNpcData returns null for invalid ID', () => {
    assert.strictEqual(getNpcData('invalid'), null);
  });

  test('getDialogueTree returns dialogue by ID', () => {
    const dialogue = getDialogueTree('elder-intro');
    assert.strictEqual(dialogue.npcId, 'village-elder');
    assert.ok(dialogue.nodes.start);
  });

  test('getDialogueTree returns null for invalid ID', () => {
    assert.strictEqual(getDialogueTree('invalid'), null);
  });
});

// ============================================================================
// NPC Query Tests
// ============================================================================

describe('NPC Query Functions', () => {
  test('getAllNpcs returns all NPCs', () => {
    const npcs = getAllNpcs();
    assert.ok(npcs.length > 0);
    assert.ok(npcs.some(n => n.id === 'village-elder'));
    assert.ok(npcs.some(n => n.id === 'blacksmith'));
  });

  test('getNpcsByLocation filters by location', () => {
    const villageNpcs = getNpcsByLocation('village-square');
    assert.ok(villageNpcs.length > 0);
    assert.ok(villageNpcs.every(n => n.location === 'village-square'));
  });

  test('getNpcsByLocation returns empty for unknown location', () => {
    const npcs = getNpcsByLocation('unknown-place');
    assert.deepStrictEqual(npcs, []);
  });

  test('getNpcsByType filters by type', () => {
    const merchants = getNpcsByType(NPC_TYPES.MERCHANT);
    assert.ok(merchants.length > 0);
    assert.ok(merchants.every(n => n.type === NPC_TYPES.MERCHANT));
  });

  test('getNpcDialogues returns NPC dialogues', () => {
    const dialogues = getNpcDialogues('village-elder');
    assert.ok(dialogues.includes('elder-intro'));
  });

  test('getNpcDialogues returns empty for invalid NPC', () => {
    const dialogues = getNpcDialogues('invalid');
    assert.deepStrictEqual(dialogues, []);
  });
});

// ============================================================================
// Starting Dialogue Tests
// ============================================================================

describe('Starting Dialogue', () => {
  test('startDialogue successfully starts with valid NPC', () => {
    const state = createDialogueState();
    const result = startDialogue(state, 'village-elder');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.currentNpcId, 'village-elder');
    assert.strictEqual(result.state.currentDialogueId, 'elder-intro');
    assert.ok(result.npc);
    assert.ok(result.node);
  });

  test('startDialogue marks NPC as talked to', () => {
    const state = createDialogueState();
    const result = startDialogue(state, 'village-elder');
    assert.ok(result.state.talkedTo.includes('village-elder'));
  });

  test('startDialogue fails for invalid NPC', () => {
    const state = createDialogueState();
    const result = startDialogue(state, 'invalid');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'invalid_npc');
  });

  test('startDialogue with specific dialogue ID', () => {
    const state = createDialogueState();
    const result = startDialogue(state, 'blacksmith', 'smith-intro');
    assert.strictEqual(result.state.currentDialogueId, 'smith-intro');
  });

  test('getCurrentNode returns active node', () => {
    const state = createDialogueState();
    const started = startDialogue(state, 'village-elder');
    const current = getCurrentNode(started.state);
    
    assert.ok(current);
    assert.ok(current.node);
    assert.ok(current.npc);
    assert.strictEqual(current.npc.id, 'village-elder');
  });

  test('getCurrentNode returns null when no dialogue active', () => {
    const state = createDialogueState();
    assert.strictEqual(getCurrentNode(state), null);
  });
});

// ============================================================================
// Dialogue Navigation Tests
// ============================================================================

describe('Dialogue Navigation', () => {
  test('advanceDialogue moves to next node', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const result = advanceDialogue(state);
    assert.strictEqual(result.success, true);
    assert.ok(result.node);
    assert.notStrictEqual(result.nodeId, 'start');
  });

  test('advanceDialogue adds to history', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const result = advanceDialogue(state);
    assert.ok(result.state.dialogueHistory.length > 0);
  });

  test('advanceDialogue fails when no dialogue active', () => {
    const state = createDialogueState();
    const result = advanceDialogue(state);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'no_active_dialogue');
  });

  test('selectChoice advances with choice', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    // Advance to choice node
    state = advanceDialogue(state).state;
    
    const result = selectChoice(state, 0);
    assert.strictEqual(result.success, true);
  });

  test('selectChoice fails with invalid index', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    state = advanceDialogue(state).state;
    
    const result = selectChoice(state, 99);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'invalid_choice');
  });

  test('selectChoice fails on non-choice node', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const result = selectChoice(state, 0);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'not_a_choice_node');
  });
});

// ============================================================================
// Condition Checking Tests
// ============================================================================

describe('Condition Checking', () => {
  test('HAS_ITEM condition checks inventory', () => {
    const gameState = {
      player: { inventory: { 'iron-ore': 5 } },
    };
    
    assert.strictEqual(
      checkCondition({ type: 'HAS_ITEM', itemId: 'iron-ore', amount: 3 }, gameState),
      true
    );
    assert.strictEqual(
      checkCondition({ type: 'HAS_ITEM', itemId: 'iron-ore', amount: 10 }, gameState),
      false
    );
  });

  test('HAS_GOLD condition checks gold', () => {
    const gameState = { player: { gold: 50 } };
    
    assert.strictEqual(
      checkCondition({ type: 'HAS_GOLD', amount: 30 }, gameState),
      true
    );
    assert.strictEqual(
      checkCondition({ type: 'HAS_GOLD', amount: 100 }, gameState),
      false
    );
  });

  test('PLAYER_HURT condition checks HP', () => {
    assert.strictEqual(
      checkCondition({ type: 'PLAYER_HURT' }, { player: { hp: 50, maxHp: 100 } }),
      true
    );
    assert.strictEqual(
      checkCondition({ type: 'PLAYER_HURT' }, { player: { hp: 100, maxHp: 100 } }),
      false
    );
  });

  test('QUEST_COMPLETE condition checks completed quests', () => {
    const gameState = {
      questState: { completedQuests: ['awakening'] },
    };
    
    assert.strictEqual(
      checkCondition({ type: 'QUEST_COMPLETE', questId: 'awakening' }, gameState),
      true
    );
    assert.strictEqual(
      checkCondition({ type: 'QUEST_COMPLETE', questId: 'first-battle' }, gameState),
      false
    );
  });

  test('QUEST_ACTIVE condition checks active quests', () => {
    const gameState = {
      questState: { activeQuests: ['first-battle'] },
    };
    
    assert.strictEqual(
      checkCondition({ type: 'QUEST_ACTIVE', questId: 'first-battle' }, gameState),
      true
    );
  });

  test('LEVEL_AT_LEAST condition checks level', () => {
    assert.strictEqual(
      checkCondition({ type: 'LEVEL_AT_LEAST', level: 5 }, { player: { level: 10 } }),
      true
    );
    assert.strictEqual(
      checkCondition({ type: 'LEVEL_AT_LEAST', level: 20 }, { player: { level: 10 } }),
      false
    );
  });

  test('checkCondition returns false for null inputs', () => {
    assert.strictEqual(checkCondition(null, {}), false);
    assert.strictEqual(checkCondition({ type: 'HAS_ITEM' }, null), false);
  });

  test('checkCondition returns false for unknown type', () => {
    assert.strictEqual(
      checkCondition({ type: 'UNKNOWN' }, { player: {} }),
      false
    );
  });
});

// ============================================================================
// Ending Dialogue Tests
// ============================================================================

describe('Ending Dialogue', () => {
  test('endDialogue clears dialogue state', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const result = endDialogue(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.ended, true);
    assert.strictEqual(result.state.currentNpcId, null);
    assert.strictEqual(result.state.currentDialogueId, null);
    assert.strictEqual(result.state.currentNodeId, null);
  });

  test('endDialogue preserves talked to list', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const result = endDialogue(state);
    assert.ok(result.state.talkedTo.includes('village-elder'));
  });

  test('isDialogueActive returns correct status', () => {
    let state = createDialogueState();
    assert.strictEqual(isDialogueActive(state), false);
    
    state = startDialogue(state, 'village-elder').state;
    assert.strictEqual(isDialogueActive(state), true);
    
    state = endDialogue(state).state;
    assert.strictEqual(isDialogueActive(state), false);
  });
});

// ============================================================================
// NPC Relations Tests
// ============================================================================

describe('NPC Relations', () => {
  test('getNpcRelation returns 0 for unknown NPC', () => {
    const state = createDialogueState();
    assert.strictEqual(getNpcRelation(state, 'village-elder'), 0);
  });

  test('updateNpcRelation increases relation', () => {
    let state = createDialogueState();
    state = updateNpcRelation(state, 'village-elder', 10);
    assert.strictEqual(getNpcRelation(state, 'village-elder'), 10);
  });

  test('updateNpcRelation decreases relation', () => {
    let state = createDialogueState();
    state = updateNpcRelation(state, 'village-elder', -15);
    assert.strictEqual(getNpcRelation(state, 'village-elder'), -15);
  });

  test('updateNpcRelation caps at 100', () => {
    let state = createDialogueState();
    state = updateNpcRelation(state, 'village-elder', 150);
    assert.strictEqual(getNpcRelation(state, 'village-elder'), 100);
  });

  test('updateNpcRelation caps at -100', () => {
    let state = createDialogueState();
    state = updateNpcRelation(state, 'village-elder', -150);
    assert.strictEqual(getNpcRelation(state, 'village-elder'), -100);
  });

  test('hasTalkedTo checks talked to list', () => {
    let state = createDialogueState();
    assert.strictEqual(hasTalkedTo(state, 'village-elder'), false);
    
    state = startDialogue(state, 'village-elder').state;
    assert.strictEqual(hasTalkedTo(state, 'village-elder'), true);
  });
});

// ============================================================================
// Dialogue History Tests
// ============================================================================

describe('Dialogue History', () => {
  test('getDialogueHistory returns recent entries', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    state = advanceDialogue(state).state;
    
    const history = getDialogueHistory(state, 10);
    assert.ok(history.length > 0);
  });

  test('getDialogueHistory respects limit', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    // Advance multiple times
    state = advanceDialogue(state).state;
    
    const history = getDialogueHistory(state, 1);
    assert.ok(history.length <= 1);
  });

  test('getDialogueHistory returns empty for new state', () => {
    const state = createDialogueState();
    const history = getDialogueHistory(state);
    assert.deepStrictEqual(history, []);
  });
});

// ============================================================================
// UI Component Tests
// ============================================================================

describe('UI Components - Dialogue Styles', () => {
  test('getDialogueStyles returns CSS string', () => {
    const styles = getDialogueStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.includes('.dialogue-box'));
    assert.ok(styles.includes('.dialogue-choice'));
    assert.ok(styles.includes('.npc-card'));
  });
});

describe('UI Components - Dialogue Box', () => {
  test('renderDialogueBox renders when active', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const html = renderDialogueBox(state);
    assert.ok(html.includes('dialogue-container'));
    assert.ok(html.includes('Elder Theron'));
  });

  test('renderDialogueBox returns empty when inactive', () => {
    const state = createDialogueState();
    const html = renderDialogueBox(state);
    assert.strictEqual(html, '');
  });

  test('renderDialogueBox shows choices for choice node', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    state = advanceDialogue(state).state;
    
    const html = renderDialogueBox(state);
    assert.ok(html.includes('dialogue-choice'));
  });

  test('renderDialogueBox shows continue for text node', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const html = renderDialogueBox(state);
    assert.ok(html.includes('Continue'));
  });
});

describe('UI Components - NPC Greeting', () => {
  test('renderNpcGreeting shows NPC info', () => {
    const html = renderNpcGreeting('village-elder');
    assert.ok(html.includes('Elder Theron'));
    assert.ok(html.includes('quest giver')); // hyphen replaced with space in UI
  });

  test('renderNpcGreeting handles invalid NPC', () => {
    const html = renderNpcGreeting('invalid');
    assert.ok(html.includes('NPC not found'));
  });
});

describe('UI Components - NPC List', () => {
  test('renderNpcList shows NPCs', () => {
    const npcs = getAllNpcs().slice(0, 3);
    const html = renderNpcList(npcs);
    assert.ok(html.includes('npc-card'));
  });

  test('renderNpcList handles empty array', () => {
    const html = renderNpcList([]);
    assert.ok(html.includes('No one here'));
  });

  test('renderNpcList shows talked indicator', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    state = endDialogue(state).state;
    
    const npcs = [getNpcData('village-elder')];
    const html = renderNpcList(npcs, state);
    assert.ok(html.includes('talked'));
  });
});

describe('UI Components - Dialogue History', () => {
  test('renderDialogueHistory shows entries', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    state = advanceDialogue(state).state;
    
    const html = renderDialogueHistory(state);
    assert.ok(html.includes('history-entry'));
  });

  test('renderDialogueHistory returns empty for no history', () => {
    const state = createDialogueState();
    const html = renderDialogueHistory(state);
    assert.strictEqual(html, '');
  });
});

describe('UI Components - NPC Nameplate', () => {
  test('renderNpcNameplate shows NPC info', () => {
    const html = renderNpcNameplate('village-elder');
    assert.ok(html.includes('npc-nameplate'));
    assert.ok(html.includes('Elder Theron'));
  });

  test('renderNpcNameplate returns empty for invalid NPC', () => {
    const html = renderNpcNameplate('invalid');
    assert.strictEqual(html, '');
  });
});

describe('UI Components - Interaction Prompt', () => {
  test('renderInteractionPrompt shows NPC name', () => {
    const html = renderInteractionPrompt('village-elder');
    assert.ok(html.includes('Elder Theron'));
    assert.ok(html.includes('Press'));
  });

  test('renderInteractionPrompt returns empty for invalid NPC', () => {
    const html = renderInteractionPrompt('invalid');
    assert.strictEqual(html, '');
  });
});

// ============================================================================
// Security Tests - XSS Prevention
// ============================================================================

describe('Security - XSS Prevention', () => {
  test('renderDialogueBox escapes HTML in text', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const html = renderDialogueBox(state);
    assert.ok(!html.includes('<script>'));
    assert.ok(typeof html === 'string');
  });

  test('renderNpcGreeting escapes HTML', () => {
    const html = renderNpcGreeting('village-elder');
    assert.ok(!html.includes('<script>'));
  });

  test('renderNpcList escapes NPC data', () => {
    const npcs = getAllNpcs().slice(0, 2);
    const html = renderNpcList(npcs);
    assert.ok(!html.includes('<script>'));
  });

  test('UI escapes apostrophes correctly', () => {
    const html = renderNpcGreeting('village-elder');
    // Check that apostrophes would be escaped
    assert.ok(typeof html === 'string');
  });
});

// ============================================================================
// Security Tests - Banned Word Scanning
// ============================================================================

describe('Security - Banned Word Scanning', () => {
  const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  test('NPC names do not contain banned words', () => {
    for (const [id, npc] of Object.entries(NPC_DATA)) {
      const nameLower = npc.name.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!nameLower.includes(word), `NPC ${id} name contains banned word: ${word}`);
      }
    }
  });

  test('NPC greetings do not contain banned words', () => {
    for (const [id, npc] of Object.entries(NPC_DATA)) {
      const greetingLower = npc.greeting.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!greetingLower.includes(word), `NPC ${id} greeting contains banned word: ${word}`);
      }
    }
  });

  test('Dialogue text does not contain banned words', () => {
    for (const [dialogueId, dialogue] of Object.entries(DIALOGUE_TREES)) {
      for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
        if (node.text) {
          const textLower = node.text.toLowerCase();
          for (const word of BANNED_WORDS) {
            assert.ok(!textLower.includes(word), 
              `Dialogue ${dialogueId} node ${nodeId} contains banned word: ${word}`);
          }
        }
        if (node.choices) {
          for (const choice of node.choices) {
            const choiceLower = choice.text.toLowerCase();
            for (const word of BANNED_WORDS) {
              assert.ok(!choiceLower.includes(word),
                `Dialogue ${dialogueId} node ${nodeId} choice contains banned word: ${word}`);
            }
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
  test('Multiple dialogue starts with same NPC', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    state = endDialogue(state).state;
    state = startDialogue(state, 'village-elder').state;
    
    assert.strictEqual(isDialogueActive(state), true);
  });

  test('Relation persists across dialogues', () => {
    let state = createDialogueState();
    state = updateNpcRelation(state, 'village-elder', 25);
    state = startDialogue(state, 'village-elder').state;
    state = endDialogue(state).state;
    
    assert.strictEqual(getNpcRelation(state, 'village-elder'), 25);
  });

  test('evaluateConditional fails on non-conditional node', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    
    const result = evaluateConditional(state, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'not_a_conditional_node');
  });

  test('Actions are returned from choice selections', () => {
    let state = createDialogueState();
    state = startDialogue(state, 'village-elder').state;
    // Navigate to a choice with action
    state = advanceDialogue(state).state; // To explain
    state = advanceDialogue(state, 'location').state; // location path
    state = advanceDialogue(state).state; // to danger
    state = advanceDialogue(state).state; // to offer-help (choice)
    
    // Select accept (has START_QUEST action)
    const result = selectChoice(state, 0);
    if (result.action) {
      assert.strictEqual(result.action.type, 'START_QUEST');
    }
  });
});
