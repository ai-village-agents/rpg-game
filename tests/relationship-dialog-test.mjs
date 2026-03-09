/**
 * Relationship Dialog Tests
 * Owner: Claude Opus 4.5
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  RELATIONSHIP_LEVEL_ORDER,
  RelationshipDialogManager,
  getRelationshipAwareDialogVariant,
  createRelationshipBranchingDialog
} from '../src/relationship-dialog.js';
import { NPCRelationshipManager, RelationshipLevel } from '../src/npc-relationships.js';

const counts = { passed: 0, failed: 0 };
const countedTest = (name, fn) => test(name, async (t) => {
  try {
    await fn(t);
    counts.passed += 1;
  } catch (err) {
    counts.failed += 1;
    throw err;
  }
});

process.on('exit', () => {
  // Provides a simple per-file pass/fail counter to mirror lightweight CI output.
  console.log(`Test counter - passed: ${counts.passed}, failed: ${counts.failed}`);
});

class FakeRelationshipManager {
  constructor({
    level = RelationshipLevel.NEUTRAL,
    reputation = 0,
    discussed = false,
    gifts = [],
    questsCompleted = []
  } = {}) {
    this.level = level;
    this.reputation = reputation;
    this.discussed = discussed;
    this.gifts = gifts;
    this.questsCompleted = questsCompleted;
    this.calls = [];
  }

  getRelationshipLevel(npcId) {
    this.calls.push({ method: 'getRelationshipLevel', npcId });
    return this.level;
  }

  getRelationship(npcId) {
    this.calls.push({ method: 'getRelationship', npcId });
    return {
      reputation: this.reputation,
      gifts: this.gifts,
      questsCompleted: this.questsCompleted
    };
  }

  hasDiscussedTopic(npcId, topicId) {
    this.calls.push({ method: 'hasDiscussedTopic', npcId, topicId });
    return this.discussed;
  }
}

describe('RELATIONSHIP_LEVEL_ORDER', () => {
  countedTest('matches ascending hostility order', () => {
    assert.deepStrictEqual(RELATIONSHIP_LEVEL_ORDER, [
      RelationshipLevel.HOSTILE,
      RelationshipLevel.UNFRIENDLY,
      RelationshipLevel.NEUTRAL,
      RelationshipLevel.FRIENDLY,
      RelationshipLevel.ALLIED
    ]);
    assert.strictEqual(RELATIONSHIP_LEVEL_ORDER.length, 5);
  });

  countedTest('places NEUTRAL at the midpoint for comparisons', () => {
    const neutralIndex = RELATIONSHIP_LEVEL_ORDER.indexOf(RelationshipLevel.NEUTRAL);
    assert.strictEqual(neutralIndex, Math.floor(RELATIONSHIP_LEVEL_ORDER.length / 2));
  });
});

describe('RelationshipDialogManager - constructor', () => {
  countedTest('uses default NPCRelationshipManager when none provided', () => {
    const manager = new RelationshipDialogManager();
    assert.ok(manager.relationshipManager instanceof NPCRelationshipManager);
  });

  countedTest('uses injected relationship manager instance', () => {
    const fake = new FakeRelationshipManager();
    const manager = new RelationshipDialogManager(fake);
    assert.strictEqual(manager.relationshipManager, fake);
  });
});

describe('RelationshipDialogManager - evaluateCondition (relationship)', () => {
  const operatorCases = [
    { operator: '==', current: RelationshipLevel.FRIENDLY, target: RelationshipLevel.FRIENDLY, expected: true },
    { operator: '!=', current: RelationshipLevel.FRIENDLY, target: RelationshipLevel.NEUTRAL, expected: true },
    { operator: '>', current: RelationshipLevel.FRIENDLY, target: RelationshipLevel.NEUTRAL, expected: true },
    { operator: '>=', current: RelationshipLevel.FRIENDLY, target: RelationshipLevel.FRIENDLY, expected: true },
    { operator: '<', current: RelationshipLevel.UNFRIENDLY, target: RelationshipLevel.NEUTRAL, expected: true },
    { operator: '<=', current: RelationshipLevel.NEUTRAL, target: RelationshipLevel.FRIENDLY, expected: true }
  ];

  for (const { operator, current, target, expected } of operatorCases) {
    countedTest(`handles operator ${operator}`, () => {
      const fake = new FakeRelationshipManager({ level: current });
      const manager = new RelationshipDialogManager(fake);
      const result = manager.evaluateCondition({
        type: 'relationship',
        npcId: 'npc-1',
        level: target,
        operator
      });
      assert.strictEqual(result, expected);
    });
  }

  countedTest('returns false when npcId is missing', () => {
    const manager = new RelationshipDialogManager(new FakeRelationshipManager());
    assert.strictEqual(manager.evaluateCondition({ type: 'relationship', level: RelationshipLevel.ALLIED }), false);
  });

  countedTest('returns false when level is missing', () => {
    const manager = new RelationshipDialogManager(new FakeRelationshipManager());
    assert.strictEqual(manager.evaluateCondition({ type: 'relationship', npcId: 'npc-2' }), false);
  });
});

describe('RelationshipDialogManager - evaluateCondition (reputation)', () => {
  countedTest('compares reputation with >= operator', () => {
    const fake = new FakeRelationshipManager({ reputation: 25 });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'reputation',
      npcId: 'npc-3',
      value: 20,
      operator: '>='
    });
    assert.strictEqual(result, true);
  });

  countedTest('compares reputation with > operator', () => {
    const fake = new FakeRelationshipManager({ reputation: -5 });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'reputation',
      npcId: 'npc-4',
      value: -5,
      operator: '>'
    });
    assert.strictEqual(result, false);
  });

  countedTest('compares reputation with <= operator', () => {
    const fake = new FakeRelationshipManager({ reputation: 0 });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'reputation',
      npcId: 'npc-5',
      value: 10,
      operator: '<='
    });
    assert.strictEqual(result, true);
  });

  countedTest('returns false when npcId missing for reputation check', () => {
    const manager = new RelationshipDialogManager(new FakeRelationshipManager({ reputation: 5 }));
    assert.strictEqual(manager.evaluateCondition({ type: 'reputation', value: 5 }), false);
  });
});

describe('RelationshipDialogManager - evaluateCondition (discussed)', () => {
  countedTest('returns true when topic was discussed', () => {
    const fake = new FakeRelationshipManager({ discussed: true });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'discussed',
      npcId: 'npc-6',
      topicId: 'topic-1'
    });
    assert.strictEqual(result, true);
    assert.deepStrictEqual(fake.calls[0], { method: 'hasDiscussedTopic', npcId: 'npc-6', topicId: 'topic-1' });
  });

  countedTest('returns false when topic was not discussed', () => {
    const fake = new FakeRelationshipManager({ discussed: false });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'discussed',
      npcId: 'npc-7',
      topicId: 'topic-2'
    });
    assert.strictEqual(result, false);
  });
});

describe('RelationshipDialogManager - evaluateCondition (giftGiven)', () => {
  countedTest('returns true when gift item was given', () => {
    const fake = new FakeRelationshipManager({ gifts: [{ itemId: 'rose', value: 5 }] });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'giftGiven',
      npcId: 'npc-8',
      itemId: 'rose'
    });
    assert.strictEqual(result, true);
  });

  countedTest('returns false when gift item not found', () => {
    const fake = new FakeRelationshipManager({ gifts: [{ itemId: 'apple', value: 1 }] });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'giftGiven',
      npcId: 'npc-9',
      itemId: 'rose'
    });
    assert.strictEqual(result, false);
  });
});

describe('RelationshipDialogManager - evaluateCondition (questsCompletedFor)', () => {
  countedTest('compares completed quest count with >= operator', () => {
    const fake = new FakeRelationshipManager({ questsCompleted: ['q1', 'q2', 'q3'] });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'questsCompletedFor',
      npcId: 'npc-10',
      count: 2,
      operator: '>='
    });
    assert.strictEqual(result, true);
  });

  countedTest('compares completed quest count with > operator', () => {
    const fake = new FakeRelationshipManager({ questsCompleted: ['q1', 'q2'] });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'questsCompletedFor',
      npcId: 'npc-11',
      count: 2,
      operator: '>'
    });
    assert.strictEqual(result, false);
  });

  countedTest('compares completed quest count with <= operator', () => {
    const fake = new FakeRelationshipManager({ questsCompleted: ['q1'] });
    const manager = new RelationshipDialogManager(fake);
    const result = manager.evaluateCondition({
      type: 'questsCompletedFor',
      npcId: 'npc-12',
      count: 1,
      operator: '<='
    });
    assert.strictEqual(result, true);
  });
});

describe('RelationshipDialogManager - evaluateCondition fallback', () => {
  countedTest('delegates to base DialogManager for flag condition', () => {
    const manager = new RelationshipDialogManager(new FakeRelationshipManager());
    const result = manager.evaluateCondition(
      { type: 'flag', key: 'metNpc', value: true },
      { flags: { metNpc: true } }
    );
    assert.strictEqual(result, true);
  });
});

describe('RelationshipDialogManager - methods', () => {
  countedTest('getRelationshipAwareDialogVariant appends level suffix', () => {
    const fake = new FakeRelationshipManager({ level: RelationshipLevel.ALLIED });
    const manager = new RelationshipDialogManager(fake);
    const variant = manager.getRelationshipAwareDialogVariant('npc-13', 'intro');
    assert.strictEqual(variant, 'intro_allied');
  });

  countedTest('createRelationshipBranchingDialog builds conditional nodes in descending order', () => {
    const node = createRelationshipBranchingDialog('npc-14', {
      [RelationshipLevel.ALLIED]: 'node-allied',
      [RelationshipLevel.FRIENDLY]: 'node-friendly',
      [RelationshipLevel.NEUTRAL]: 'node-neutral',
      default: 'node-default'
    });

    assert.strictEqual(node.type, 'conditional');
    assert.strictEqual(node.conditions.length, 3);
    assert.deepStrictEqual(node.conditions[0].check, {
      type: 'relationship',
      npcId: 'npc-14',
      level: RelationshipLevel.ALLIED,
      operator: '>='
    });
    assert.strictEqual(node.conditions[0].then, 'node-allied');
    assert.deepStrictEqual(node.conditions[1].check.level, RelationshipLevel.FRIENDLY);
    assert.deepStrictEqual(node.conditions[2].check.level, RelationshipLevel.NEUTRAL);
    assert.strictEqual(node.else, 'node-default');
  });

  countedTest('createRelationshipBranchingDialog falls back to NEUTRAL when no default provided', () => {
    const node = createRelationshipBranchingDialog('npc-15', {
      [RelationshipLevel.FRIENDLY]: 'node-friendly',
      [RelationshipLevel.NEUTRAL]: 'node-neutral'
    });

    assert.strictEqual(node.conditions.length, 2);
    assert.strictEqual(node.else, 'node-neutral');
  });
});

describe('Standalone helpers - getRelationshipAwareDialogVariant', () => {
  countedTest('returns base dialog id unchanged when baseDialogId is null', () => {
    const result = getRelationshipAwareDialogVariant('npc-16', null, new FakeRelationshipManager());
    assert.strictEqual(result, null);
  });

  countedTest('returns base dialog id when npcId is missing', () => {
    const result = getRelationshipAwareDialogVariant(null, 'greeting', new FakeRelationshipManager());
    assert.strictEqual(result, 'greeting');
  });

  countedTest('returns base dialog id when manager is missing', () => {
    const result = getRelationshipAwareDialogVariant('npc-17', 'greeting');
    assert.strictEqual(result, 'greeting');
  });

  countedTest('appends lowercased relationship level suffix with provided manager', () => {
    const result = getRelationshipAwareDialogVariant(
      'npc-18',
      'greeting',
      new FakeRelationshipManager({ level: RelationshipLevel.HOSTILE })
    );
    assert.strictEqual(result, 'greeting_hostile');
  });
});

describe('Standalone helpers - createRelationshipBranchingDialog', () => {
  countedTest('creates conditional chain honoring RELATIONSHIP_LEVEL_ORDER', () => {
    const node = createRelationshipBranchingDialog('npc-19', {
      [RelationshipLevel.ALLIED]: 'node-allied',
      [RelationshipLevel.HOSTILE]: 'node-hostile'
    });

    assert.strictEqual(node.conditions.length, 2);
    assert.strictEqual(node.conditions[0].check.level, RelationshipLevel.ALLIED);
    assert.strictEqual(node.conditions[1].check.level, RelationshipLevel.HOSTILE);
  });

  countedTest('uses default branch when provided and no conditions match', () => {
    const node = createRelationshipBranchingDialog('npc-20', {
      [RelationshipLevel.FRIENDLY]: 'node-friendly',
      default: 'node-default'
    });

    assert.strictEqual(node.else, 'node-default');
  });
});

