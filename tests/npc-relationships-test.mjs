import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  NPCRelationshipManager,
  RelationshipLevel,
  ReputationEvent,
} from '../src/npc-relationships.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULE_PATH = path.join(__dirname, '..', 'src', 'npc-relationships.js');

const createManager = () => new NPCRelationshipManager();

describe('NPCRelationshipManager', () => {
  describe('Constants', () => {
    test('RelationshipLevel constants include all levels', () => {
      const expected = {
        HOSTILE: 'HOSTILE',
        UNFRIENDLY: 'UNFRIENDLY',
        NEUTRAL: 'NEUTRAL',
        FRIENDLY: 'FRIENDLY',
        ALLIED: 'ALLIED',
      };
      assert.deepStrictEqual(RelationshipLevel, expected);
      assert.strictEqual(Object.keys(RelationshipLevel).length, 5);
    });

    test('ReputationEvent constants include all events with correct values', () => {
      const expected = {
        QUEST_COMPLETE: { type: 'QUEST_COMPLETE', value: 15 },
        QUEST_FAIL: { type: 'QUEST_FAIL', value: -20 },
        GIFT_GIVEN: { type: 'GIFT_GIVEN', minValue: 5, maxValue: 15 },
        HELPED_NPC: { type: 'HELPED_NPC', value: 10 },
        BETRAYED_NPC: { type: 'BETRAYED_NPC', value: -30 },
        DIALOGUE_POSITIVE: { type: 'DIALOGUE_POSITIVE', value: 3 },
        DIALOGUE_NEGATIVE: { type: 'DIALOGUE_NEGATIVE', value: -5 },
        COMBAT_VICTORY: { type: 'COMBAT_VICTORY', value: 2 },
        THEFT_CAUGHT: { type: 'THEFT_CAUGHT', value: -25 },
      };
      assert.deepStrictEqual(ReputationEvent, expected);
      assert.strictEqual(Object.keys(ReputationEvent).length, 9);
    });
  });

  describe('getRelationship', () => {
    test('creates a default relationship record', () => {
      const manager = createManager();
      const relationship = manager.getRelationship('npc-1');

      assert.strictEqual(relationship.reputation, 0);
      assert.strictEqual(relationship.level, RelationshipLevel.NEUTRAL);
      assert.deepStrictEqual(relationship.history, []);
      assert.strictEqual(relationship.lastInteraction, null);
      assert.deepStrictEqual(relationship.conversationMemory, []);
      assert.deepStrictEqual(relationship.gifts, []);
      assert.deepStrictEqual(relationship.questsCompleted, []);
    });

    test('throws when npcId is null or undefined', () => {
      const manager = createManager();
      assert.throws(() => manager.getRelationship(null));
      assert.throws(() => manager.getRelationship(undefined));
    });
  });

  describe('modifyReputation', () => {
    test('increases reputation and updates level', () => {
      const manager = createManager();
      const updated = manager.modifyReputation('npc-2', 20, 'quest');

      assert.strictEqual(updated.reputation, 20);
      assert.strictEqual(updated.level, RelationshipLevel.FRIENDLY);
    });

    test('decreases reputation and updates level', () => {
      const manager = createManager();
      const updated = manager.modifyReputation('npc-3', -20, 'insult');

      assert.strictEqual(updated.reputation, -20);
      assert.strictEqual(updated.level, RelationshipLevel.UNFRIENDLY);
    });

    test('clamps reputation to a minimum of -100', () => {
      const manager = createManager();
      const updated = manager.modifyReputation('npc-4', -200, 'betrayal');

      assert.strictEqual(updated.reputation, -100);
      assert.strictEqual(updated.level, RelationshipLevel.HOSTILE);
    });

    test('clamps reputation to a maximum of +100', () => {
      const manager = createManager();
      const updated = manager.modifyReputation('npc-5', 200, 'heroics');

      assert.strictEqual(updated.reputation, 100);
      assert.strictEqual(updated.level, RelationshipLevel.ALLIED);
    });

    test('logs history with correct from/to/change/reason and timestamp', () => {
      const manager = createManager();
      const fakeNow = 1_700_000_000_000;
      const originalNow = Date.now;
      Date.now = () => fakeNow;

      try {
        const updated = manager.modifyReputation('npc-6', 5, { type: 'DIALOGUE_POSITIVE', extra: true });
        assert.strictEqual(updated.history.length, 1);
        const entry = updated.history[0];
        assert.strictEqual(entry.timestamp, fakeNow);
        assert.strictEqual(entry.change, 5);
        assert.strictEqual(entry.reason, 'DIALOGUE_POSITIVE');
        assert.strictEqual(entry.from, 0);
        assert.strictEqual(entry.to, 5);
        assert.strictEqual(entry.level, RelationshipLevel.NEUTRAL);
        assert.strictEqual(updated.lastInteraction, fakeNow);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('getRelationshipLevel', () => {
    test('returns correct level at boundary reputation values', () => {
      const manager = createManager();
      const rel = manager.getRelationship('npc-7');

      rel.reputation = -50;
      assert.strictEqual(manager.getRelationshipLevel('npc-7'), RelationshipLevel.HOSTILE);

      rel.reputation = -10;
      assert.strictEqual(manager.getRelationshipLevel('npc-7'), RelationshipLevel.UNFRIENDLY);

      rel.reputation = 0;
      assert.strictEqual(manager.getRelationshipLevel('npc-7'), RelationshipLevel.NEUTRAL);

      rel.reputation = 10;
      assert.strictEqual(manager.getRelationshipLevel('npc-7'), RelationshipLevel.FRIENDLY);

      rel.reputation = 50;
      assert.strictEqual(manager.getRelationshipLevel('npc-7'), RelationshipLevel.ALLIED);
    });
  });

  describe('Conversation memory', () => {
    test('stores conversation entry with all fields', () => {
      const manager = createManager();
      const timestamp = 12345;
      manager.addConversationMemory('npc-8', 'dialog-1', 'node-1', { topicId: 'topic-1', text: 'Hello' }, timestamp);
      const relationship = manager.getRelationship('npc-8');
      const entry = relationship.conversationMemory[0];

      assert.deepStrictEqual(entry, {
        dialogId: 'dialog-1',
        nodeId: 'node-1',
        choice: { topicId: 'topic-1', text: 'Hello' },
        timestamp,
        topicId: 'topic-1',
      });
    });

    test('keeps only the 20 most recent conversation entries', () => {
      const manager = createManager();
      for (let i = 0; i < 25; i++) {
        manager.addConversationMemory('npc-9', `dialog-${i}`, `node-${i}`, `choice-${i}`, i);
      }
      const memory = manager.getConversationMemory('npc-9');

      assert.strictEqual(memory.length, 20);
      assert.strictEqual(memory[0].nodeId, 'node-5');
      assert.strictEqual(memory[memory.length - 1].nodeId, 'node-24');
    });

    test('returns conversation history array', () => {
      const manager = createManager();
      manager.addConversationMemory('npc-10', 'dialog-x', 'node-x', 'choice-x', 10);
      const relationship = manager.getRelationship('npc-10');
      const memory = manager.getConversationMemory('npc-10');

      assert.strictEqual(memory, relationship.conversationMemory);
      assert.strictEqual(memory.length, 1);
    });

    test('hasDiscussedTopic returns true when topic was discussed', () => {
      const manager = createManager();
      manager.addConversationMemory('npc-11', 'dialog-y', 'node-y', { topicId: 'topic-yes', id: 'c1' }, 20);

      assert.strictEqual(manager.hasDiscussedTopic('npc-11', 'topic-yes'), true);
    });

    test('hasDiscussedTopic returns false when topic was not discussed', () => {
      const manager = createManager();
      manager.addConversationMemory('npc-12', 'dialog-z', 'node-z', { topicId: 'topic-other' }, 30);

      assert.strictEqual(manager.hasDiscussedTopic('npc-12', 'topic-missing'), false);
    });
  });

  describe('Gifts and quests', () => {
    test('recordGift applies +5 reputation for low value gifts', () => {
      const manager = createManager();
      const relationship = manager.recordGift('npc-13', 'apple', 30);

      assert.strictEqual(relationship.reputation, 5);
      assert.strictEqual(relationship.level, RelationshipLevel.NEUTRAL);
      assert.strictEqual(relationship.gifts[0].delta, 5);
    });

    test('recordGift applies +10 reputation for medium value gifts', () => {
      const manager = createManager();
      const relationship = manager.recordGift('npc-14', 'bouquet', 75);

      assert.strictEqual(relationship.reputation, 10);
      assert.strictEqual(relationship.level, RelationshipLevel.FRIENDLY);
      assert.strictEqual(relationship.gifts[0].delta, 10);
    });

    test('recordGift applies +15 reputation for high value gifts', () => {
      const manager = createManager();
      const relationship = manager.recordGift('npc-15', 'artifact', 150);

      assert.strictEqual(relationship.reputation, 15);
      assert.strictEqual(relationship.level, RelationshipLevel.FRIENDLY);
      assert.strictEqual(relationship.gifts[0].delta, 15);
    });

    test('recordQuestComplete adds reputation and records quest id', () => {
      const manager = createManager();
      const relationship = manager.recordQuestComplete('npc-16', 'quest-1');
      manager.recordQuestComplete('npc-16', 'quest-1');

      assert.strictEqual(relationship.reputation, 30);
      assert.strictEqual(relationship.level, RelationshipLevel.FRIENDLY);
      assert.deepStrictEqual(relationship.questsCompleted, ['quest-1']);
    });

    test('recordQuestFail subtracts reputation', () => {
      const manager = createManager();
      const relationship = manager.recordQuestFail('npc-17', 'quest-2');

      assert.strictEqual(relationship.reputation, -20);
      assert.strictEqual(relationship.level, RelationshipLevel.UNFRIENDLY);
    });
  });

  describe('State management', () => {
    test('getState returns serializable state', () => {
      const manager = createManager();
      manager.modifyReputation('npc-18', 10, 'greet');
      manager.addConversationMemory('npc-18', 'dialog-a', 'node-a', 'choice-a', 1);
      const state = manager.getState();

      assert.ok(Array.isArray(state.relationships));
      assert.ok(state.relationships[0][0]);
      assert.doesNotThrow(() => JSON.parse(JSON.stringify(state)));
    });

    test('restoreState rebuilds relationships from saved state', () => {
      const storedHistory = [{ timestamp: 1, change: 5, reason: 'test', from: 0, to: 5, level: RelationshipLevel.NEUTRAL }];
      const storedConversation = Array.from({ length: 22 }, (_, i) => ({
        dialogId: `d-${i}`,
        nodeId: `n-${i}`,
        choice: `c-${i}`,
        timestamp: i,
      }));
      const savedState = {
        relationships: [
          ['npc-19', {
            reputation: 120,
            history: storedHistory,
            lastInteraction: 999,
            conversationMemory: storedConversation,
            gifts: [{ itemId: 'gift', value: 10 }],
            questsCompleted: ['quest-a'],
          }],
          ['npc-20', {
            reputation: -80,
            history: [],
            lastInteraction: null,
            conversationMemory: [],
            gifts: [],
            questsCompleted: [],
          }],
        ],
      };

      const manager = createManager();
      manager.restoreState(savedState);

      const rel1 = manager.getRelationship('npc-19');
      assert.strictEqual(rel1.reputation, 100);
      assert.strictEqual(rel1.level, RelationshipLevel.ALLIED);
      assert.deepStrictEqual(rel1.history, storedHistory);
      assert.strictEqual(rel1.lastInteraction, 999);
      assert.strictEqual(rel1.conversationMemory.length, 20);
      assert.strictEqual(rel1.conversationMemory[0].nodeId, 'n-2');
      assert.deepStrictEqual(rel1.gifts, [{ itemId: 'gift', value: 10 }]);
      assert.deepStrictEqual(rel1.questsCompleted, ['quest-a']);

      const rel2 = manager.getRelationship('npc-20');
      assert.strictEqual(rel2.reputation, -80);
      assert.strictEqual(rel2.level, RelationshipLevel.HOSTILE);
    });
  });

  describe('Level transitions', () => {
    test('reputation transition from NEUTRAL to FRIENDLY (0 to 10)', () => {
      const manager = createManager();
      const updated = manager.modifyReputation('npc-21', 10, 'assist');

      assert.strictEqual(updated.reputation, 10);
      assert.strictEqual(updated.level, RelationshipLevel.FRIENDLY);
    });

    test('reputation transition from NEUTRAL to UNFRIENDLY (0 to -10)', () => {
      const manager = createManager();
      const updated = manager.modifyReputation('npc-22', -10, 'insult');

      assert.strictEqual(updated.reputation, -10);
      assert.strictEqual(updated.level, RelationshipLevel.UNFRIENDLY);
    });
  });

  describe('Forbidden motifs', () => {
    test('module does not contain easter egg motifs', () => {
      const bannedWords = [
        'egg',
        'easter',
        'yolk',
        'omelet',
        'omelette',
        'bunny',
        'rabbit',
        'chick',
        'basket',
        'cockatrice',
        'basilisk',
      ];
      const fileText = fs.readFileSync(MODULE_PATH, 'utf8');

      for (const word of bannedWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        assert.ok(!regex.test(fileText), `Forbidden motif detected: ${word}`);
      }
    });
  });
});
