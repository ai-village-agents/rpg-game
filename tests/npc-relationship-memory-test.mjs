import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getTimeAwareGreeting, updateNPCMemory } from '../src/npc-relationship-memory.js';
import { NPCRelationshipManager } from '../src/npc-relationships.js';

describe('NPC Relationship Memory', () => {
  describe('getTimeAwareGreeting', () => {
    it('returns "Greetings, traveler." for never-met NPC (no relationship)', () => {
      const manager = new NPCRelationshipManager();
      const greeting = getTimeAwareGreeting('unknown_npc', manager);
      assert.strictEqual(greeting, 'Greetings, traveler.');
    });

    it('returns "Hello, stranger." for first meeting (relationship exists, null lastInteraction)', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1'); // Creates relationship
      const relationship = manager.getRelationship('npc1');
      relationship.lastInteraction = null;
      const greeting = getTimeAwareGreeting('npc1', manager);
      assert.strictEqual(greeting, 'Hello, stranger.');
    });

    it('returns "Back so soon?" for recent return (<5 minutes)', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1');
      const relationship = manager.getRelationship('npc1');
      relationship.lastInteraction = Date.now() - (2 * 60 * 1000); // 2 minutes ago
      const greeting = getTimeAwareGreeting('npc1', manager);
      assert.strictEqual(greeting, 'Back so soon?');
    });

    it('returns "Good to see you again." for 5-30 minute return', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1');
      const relationship = manager.getRelationship('npc1');
      relationship.lastInteraction = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      const greeting = getTimeAwareGreeting('npc1', manager);
      assert.strictEqual(greeting, 'Good to see you again.');
    });

    it('returns "It\'s been a while!" for 30+ minute return', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1');
      const relationship = manager.getRelationship('npc1');
      relationship.lastInteraction = Date.now() - (60 * 60 * 1000); // 60 minutes ago
      const greeting = getTimeAwareGreeting('npc1', manager);
      assert.strictEqual(greeting, "It's been a while!");
    });

    it('works with snapshot state (array format)', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1');
      const relationship = manager.getRelationship('npc1');
      relationship.lastInteraction = Date.now() - (15 * 60 * 1000);
      const snapshot = manager.getState();
      const greeting = getTimeAwareGreeting('npc1', snapshot);
      assert.strictEqual(greeting, 'Good to see you again.');
    });

    it('handles null/undefined npcId gracefully', () => {
      const manager = new NPCRelationshipManager();
      assert.strictEqual(getTimeAwareGreeting(null, manager), 'Greetings, traveler.');
      assert.strictEqual(getTimeAwareGreeting(undefined, manager), 'Greetings, traveler.');
      assert.strictEqual(getTimeAwareGreeting('', manager), 'Greetings, traveler.');
    });

    it('handles null/undefined state gracefully', () => {
      const greeting = getTimeAwareGreeting('npc1', null);
      assert.strictEqual(greeting, 'Greetings, traveler.');
    });

    it('escapes HTML characters in greetings', () => {
      const manager = new NPCRelationshipManager();
      const greeting = getTimeAwareGreeting('npc1', manager);
      assert.ok(!greeting.includes('<script>'));
      assert.ok(!greeting.includes('&') || greeting.includes('&'));
    });
  });

  describe('updateNPCMemory', () => {
    it('updates lastInteraction timestamp for existing NPC', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1');
      const before = Date.now();
      const timestamp = updateNPCMemory('npc1', manager);
      const after = Date.now();
      assert.ok(timestamp !== null);
      assert.ok(timestamp >= before && timestamp <= after);
      const relationship = manager.getRelationship('npc1');
      assert.strictEqual(relationship.lastInteraction, timestamp);
    });

    it('returns null for invalid npcId', () => {
      const manager = new NPCRelationshipManager();
      assert.strictEqual(updateNPCMemory(null, manager), null);
      assert.strictEqual(updateNPCMemory(undefined, manager), null);
      assert.strictEqual(updateNPCMemory('', manager), null);
    });

    it('returns null for null state', () => {
      assert.strictEqual(updateNPCMemory('npc1', null), null);
    });

    it('works with snapshot state', () => {
      const manager = new NPCRelationshipManager();
      manager.getRelationship('npc1');
      const snapshot = manager.getState();
      const timestamp = updateNPCMemory('npc1', snapshot);
      assert.ok(timestamp !== null);
    });
  });
});
