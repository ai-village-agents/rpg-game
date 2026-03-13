/**
 * Dialogue System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  NODE_TYPES,
  SPEAKER_TYPES,
  EMOTIONS,
  REQUIREMENT_TYPES,
  initDialogueState,
  createDialogue,
  createNode,
  createChoice,
  startDialogue,
  getCurrentNode,
  advanceDialogue,
  makeChoice,
  endDialogue,
  checkRequirement,
  getAvailableChoices,
  setVariable,
  getVariable,
  wasDialogueCompleted,
  getDialogueStats,
  isDialogueActive,
  getChoiceHistory
} from '../src/dialogue-system.js';

import {
  renderDialogueBox,
  renderChoices,
  renderChoice,
  renderRequirementHint,
  renderContinueButton,
  renderDialogueHistory,
  renderDialogueStats,
  renderDialogueIndicator,
  renderNpcPrompt,
  renderEmotionSelector,
  renderSpeakerSelector,
  renderNodeTypeSelector,
  renderRequirementSelector,
  renderTypewriterText,
  renderSkipButton
} from '../src/dialogue-system-ui.js';

describe('Dialogue System', () => {
  let state;
  let testDialogue;

  beforeEach(() => {
    state = {};
    const result = initDialogueState(state);
    state = result.state;

    // Create test dialogue
    const nodes = [
      createNode({ id: 'start', type: 'text', text: 'Hello adventurer!', nextNodeId: 'choice1' }),
      createNode({ 
        id: 'choice1', 
        type: 'choice', 
        text: 'How can I help?',
        choices: [
          createChoice({ id: 'c1', text: 'Tell me about quests', nextNodeId: 'quests' }),
          createChoice({ id: 'c2', text: 'Goodbye', nextNodeId: 'end' })
        ]
      }),
      createNode({ id: 'quests', type: 'text', text: 'I have many quests!', nextNodeId: 'end' }),
      createNode({ id: 'end', type: 'end', text: 'Farewell!' })
    ];

    const dialogueResult = createDialogue('test_dialogue', 'Elder', nodes);
    testDialogue = dialogueResult.dialogue;
  });

  describe('NODE_TYPES', () => {
    it('has all types', () => {
      assert.ok(NODE_TYPES.TEXT);
      assert.ok(NODE_TYPES.CHOICE);
      assert.ok(NODE_TYPES.END);
    });
  });

  describe('SPEAKER_TYPES', () => {
    it('has speaker types', () => {
      assert.ok(SPEAKER_TYPES.NPC);
      assert.ok(SPEAKER_TYPES.PLAYER);
      assert.ok(SPEAKER_TYPES.NARRATOR);
    });
  });

  describe('EMOTIONS', () => {
    it('has emotions', () => {
      assert.ok(EMOTIONS.NEUTRAL);
      assert.ok(EMOTIONS.HAPPY);
      assert.ok(EMOTIONS.ANGRY);
    });
  });

  describe('initDialogueState', () => {
    it('creates initial state', () => {
      const result = initDialogueState({});
      assert.ok(result.success);
      assert.ok(!result.state.dialogue.activeDialogue);
    });
  });

  describe('createDialogue', () => {
    it('creates dialogue tree', () => {
      const nodes = [createNode({ text: 'Hello' })];
      const result = createDialogue('test', 'npc1', nodes);
      assert.ok(result.success);
      assert.ok(result.dialogue);
    });

    it('fails without id', () => {
      const result = createDialogue(null, 'npc1');
      assert.ok(result.error);
    });

    it('indexes nodes', () => {
      assert.ok(testDialogue.nodes['start']);
      assert.ok(testDialogue.nodes['choice1']);
    });
  });

  describe('createNode', () => {
    it('creates node with defaults', () => {
      const node = createNode({});
      assert.ok(node.id);
      assert.strictEqual(node.type, 'text');
    });

    it('accepts options', () => {
      const node = createNode({ text: 'Hello', emotion: 'happy' });
      assert.strictEqual(node.text, 'Hello');
      assert.strictEqual(node.emotion, 'happy');
    });
  });

  describe('createChoice', () => {
    it('creates choice', () => {
      const choice = createChoice({ text: 'Option 1' });
      assert.ok(choice.id);
      assert.strictEqual(choice.text, 'Option 1');
    });
  });

  describe('startDialogue', () => {
    it('starts dialogue', () => {
      const result = startDialogue(state, testDialogue);
      assert.ok(result.success);
      assert.ok(result.state.dialogue.activeDialogue);
    });

    it('sets current node', () => {
      const result = startDialogue(state, testDialogue);
      assert.strictEqual(result.state.dialogue.currentNodeId, 'start');
    });

    it('returns start node', () => {
      const result = startDialogue(state, testDialogue);
      assert.ok(result.node);
      assert.strictEqual(result.node.text, 'Hello adventurer!');
    });

    it('fails if dialogue active', () => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      
      result = startDialogue(state, testDialogue);
      assert.ok(!result.success);
    });

    it('increments stats', () => {
      const result = startDialogue(state, testDialogue);
      assert.strictEqual(result.state.dialogue.stats.dialoguesStarted, 1);
    });
  });

  describe('getCurrentNode', () => {
    it('returns inactive when no dialogue', () => {
      const result = getCurrentNode(state);
      assert.ok(!result.active);
    });

    it('returns current node', () => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      
      const current = getCurrentNode(state);
      assert.ok(current.active);
      assert.ok(current.node);
    });
  });

  describe('advanceDialogue', () => {
    beforeEach(() => {
      const result = startDialogue(state, testDialogue);
      state = result.state;
    });

    it('advances to next node', () => {
      const result = advanceDialogue(state);
      assert.ok(result.success);
      assert.strictEqual(result.state.dialogue.currentNodeId, 'choice1');
    });

    it('tracks visited nodes', () => {
      const result = advanceDialogue(state);
      assert.ok(result.state.dialogue.visitedNodes.includes('choice1'));
    });

    it('ends when reaching end node', () => {
      let result = advanceDialogue(state);
      state = result.state;
      result = makeChoice(state, 'c2'); // Goodbye -> end
      assert.ok(!result.state.dialogue.activeDialogue);
    });
  });

  describe('makeChoice', () => {
    beforeEach(() => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      result = advanceDialogue(state); // Move to choice node
      state = result.state;
    });

    it('makes a choice', () => {
      const result = makeChoice(state, 'c1');
      assert.ok(result.success);
    });

    it('advances to choice target', () => {
      const result = makeChoice(state, 'c1');
      assert.strictEqual(result.state.dialogue.currentNodeId, 'quests');
    });

    it('records choice history', () => {
      const result = makeChoice(state, 'c1');
      assert.strictEqual(result.state.dialogue.choiceHistory.length, 1);
    });

    it('increments choice stats', () => {
      const result = makeChoice(state, 'c1');
      assert.strictEqual(result.state.dialogue.stats.choicesMade, 1);
    });

    it('fails for invalid choice', () => {
      const result = makeChoice(state, 'invalid');
      assert.ok(!result.success);
    });

    it('fails on non-choice node', () => {
      // Go back to start (text node)
      state.dialogue.currentNodeId = 'start';
      const result = makeChoice(state, 'c1');
      assert.ok(!result.success);
    });
  });

  describe('endDialogue', () => {
    it('ends active dialogue', () => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      
      result = endDialogue(state);
      assert.ok(result.success);
      assert.ok(!result.state.dialogue.activeDialogue);
    });

    it('records completed dialogue', () => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      
      result = endDialogue(state);
      assert.ok(result.state.dialogue.completedDialogues.includes('test_dialogue'));
    });

    it('increments completed stats', () => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      
      result = endDialogue(state);
      assert.strictEqual(result.state.dialogue.stats.dialoguesCompleted, 1);
    });
  });

  describe('checkRequirement', () => {
    it('passes with no requirement', () => {
      const result = checkRequirement(state, null);
      assert.ok(result.met);
    });

    it('checks stat requirement', () => {
      const req = { type: 'stat', stat: 'strength', value: 10 };
      
      let result = checkRequirement(state, req, { strength: 5 });
      assert.ok(!result.met);
      
      result = checkRequirement(state, req, { strength: 15 });
      assert.ok(result.met);
    });

    it('checks item requirement', () => {
      const req = { type: 'item', itemId: 'key1' };
      
      let result = checkRequirement(state, req, { inventory: [] });
      assert.ok(!result.met);
      
      result = checkRequirement(state, req, { inventory: ['key1'] });
      assert.ok(result.met);
    });
  });

  describe('getAvailableChoices', () => {
    beforeEach(() => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      result = advanceDialogue(state);
      state = result.state;
    });

    it('returns choices', () => {
      const result = getAvailableChoices(state);
      assert.ok(result.hasChoices);
      assert.strictEqual(result.choices.length, 2);
    });
  });

  describe('setVariable', () => {
    it('sets variable', () => {
      const result = setVariable(state, 'mood', 'happy');
      assert.strictEqual(getVariable(result.state, 'mood'), 'happy');
    });
  });

  describe('wasDialogueCompleted', () => {
    it('returns false initially', () => {
      assert.ok(!wasDialogueCompleted(state, 'test_dialogue'));
    });

    it('returns true after completion', () => {
      let result = startDialogue(state, testDialogue);
      state = result.state;
      result = endDialogue(state);
      state = result.state;
      
      assert.ok(wasDialogueCompleted(state, 'test_dialogue'));
    });
  });

  describe('getDialogueStats', () => {
    it('returns stats', () => {
      const stats = getDialogueStats(state);
      assert.ok('dialoguesStarted' in stats);
      assert.ok('dialoguesCompleted' in stats);
    });
  });

  describe('isDialogueActive', () => {
    it('returns false initially', () => {
      assert.ok(!isDialogueActive(state));
    });

    it('returns true when active', () => {
      const result = startDialogue(state, testDialogue);
      assert.ok(isDialogueActive(result.state));
    });
  });

  describe('getChoiceHistory', () => {
    it('returns empty initially', () => {
      const history = getChoiceHistory(state);
      assert.strictEqual(history.length, 0);
    });
  });
});

describe('Dialogue System UI', () => {
  let state;
  let testDialogue;

  beforeEach(() => {
    const result = initDialogueState({});
    state = result.state;

    const nodes = [
      createNode({ id: 'start', type: 'choice', text: 'Hello!', choices: [
        createChoice({ id: 'c1', text: 'Hi', available: true }),
        createChoice({ id: 'c2', text: 'Need item', available: false, requirementInfo: { met: false, itemId: 'key' } })
      ]})
    ];
    const dialogueResult = createDialogue('test', 'Elder', nodes);
    testDialogue = dialogueResult.dialogue;
  });

  describe('renderDialogueBox', () => {
    it('returns empty when no dialogue', () => {
      const html = renderDialogueBox(state);
      assert.strictEqual(html, '');
    });

    it('renders dialogue box', () => {
      const result = startDialogue(state, testDialogue);
      state = result.state;
      
      const html = renderDialogueBox(state);
      assert.ok(html.includes('dialogue-box'));
      assert.ok(html.includes('Hello!'));
    });
  });

  describe('renderChoices', () => {
    it('renders choices', () => {
      const result = startDialogue(state, testDialogue);
      state = result.state;
      
      const html = renderChoices(state);
      assert.ok(html.includes('dialogue-choices'));
    });
  });

  describe('renderChoice', () => {
    it('renders available choice', () => {
      const choice = { id: 'c1', text: 'Hello', available: true };
      const html = renderChoice(choice);
      assert.ok(html.includes('available'));
      assert.ok(!html.includes('disabled'));
    });

    it('renders unavailable choice', () => {
      const choice = { id: 'c1', text: 'Hello', available: false, requirementInfo: { met: false } };
      const html = renderChoice(choice);
      assert.ok(html.includes('unavailable'));
      assert.ok(html.includes('disabled'));
    });
  });

  describe('renderRequirementHint', () => {
    it('returns empty when met', () => {
      const html = renderRequirementHint({ met: true });
      assert.strictEqual(html, '');
    });

    it('shows stat requirement', () => {
      const html = renderRequirementHint({ met: false, required: 10, current: 5 });
      assert.ok(html.includes('10'));
      assert.ok(html.includes('5'));
    });
  });

  describe('renderContinueButton', () => {
    it('renders continue button', () => {
      const html = renderContinueButton();
      assert.ok(html.includes('continue-btn'));
      assert.ok(html.includes('Continue'));
    });
  });

  describe('renderDialogueHistory', () => {
    it('shows no history message', () => {
      const html = renderDialogueHistory(state);
      assert.ok(html.includes('No dialogue history'));
    });
  });

  describe('renderDialogueStats', () => {
    it('renders stats', () => {
      const html = renderDialogueStats(state);
      assert.ok(html.includes('dialogue-stats'));
      assert.ok(html.includes('Started'));
    });
  });

  describe('renderDialogueIndicator', () => {
    it('shows inactive', () => {
      const html = renderDialogueIndicator(state);
      assert.ok(html.includes('inactive'));
    });

    it('shows active', () => {
      const result = startDialogue(state, testDialogue);
      const html = renderDialogueIndicator(result.state);
      assert.ok(html.includes('active'));
    });
  });

  describe('renderNpcPrompt', () => {
    it('renders prompt', () => {
      const html = renderNpcPrompt('Elder');
      assert.ok(html.includes('Elder'));
      assert.ok(html.includes('talk'));
    });

    it('returns empty when no dialogue', () => {
      const html = renderNpcPrompt('Elder', false);
      assert.strictEqual(html, '');
    });
  });

  describe('renderEmotionSelector', () => {
    it('renders emotions', () => {
      const html = renderEmotionSelector('neutral');
      assert.ok(html.includes('emotion-selector'));
      assert.ok(html.includes('Happy'));
    });
  });

  describe('renderSpeakerSelector', () => {
    it('renders speakers', () => {
      const html = renderSpeakerSelector('npc');
      assert.ok(html.includes('speaker-selector'));
      assert.ok(html.includes('NPC'));
    });
  });

  describe('renderNodeTypeSelector', () => {
    it('renders node types', () => {
      const html = renderNodeTypeSelector('text');
      assert.ok(html.includes('node-type-select'));
    });
  });

  describe('renderRequirementSelector', () => {
    it('renders requirement types', () => {
      const html = renderRequirementSelector('none');
      assert.ok(html.includes('requirement-select'));
    });
  });

  describe('renderTypewriterText', () => {
    it('renders typewriter text', () => {
      const html = renderTypewriterText('Hello World', 5);
      assert.ok(html.includes('typewriter-visible'));
      assert.ok(html.includes('typewriter-cursor'));
    });
  });

  describe('renderSkipButton', () => {
    it('renders skip button', () => {
      const html = renderSkipButton();
      assert.ok(html.includes('skip-dialogue-btn'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes dialogue text', () => {
      const nodes = [createNode({ text: '<script>alert("xss")</script>' })];
      const dialogueResult = createDialogue('xss', 'Bad', nodes);
      const result = startDialogue(state, dialogueResult.dialogue);
      
      const html = renderDialogueBox(result.state);
      assert.ok(!html.includes('<script>alert'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes choice text', () => {
      const choice = { id: 'c1', text: '<img onerror="alert(1)">', available: true };
      const html = renderChoice(choice);
      assert.ok(!html.includes('<img'));
    });
  });
});
