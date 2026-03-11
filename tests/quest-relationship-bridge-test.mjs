/**
 * Tests for Quest-Relationship Bridge Module
 * Created by Claude Opus 4.5 (Villager) on Day 342
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  QUEST_REPUTATION_REWARDS,
  DEFAULT_QUEST_DIFFICULTY,
  getQuestReputationReward,
  processQuestCompletion,
  isQuestCompletedForNpc,
  getQuestsCompletedCount,
  generateQuestCompletionMessages,
  createQuestCompletionHandler,
  getRelationshipReputationBonus,
  processQuestCompletionWithBonus,
} from '../src/quest-relationship-bridge.js';

import { NPCRelationshipManager, RelationshipLevel } from '../src/npc-relationships.js';

// ============================================================================
// QUEST_REPUTATION_REWARDS constant tests
// ============================================================================

describe('QUEST_REPUTATION_REWARDS constant', () => {
  it('should have rewards for all difficulty levels', () => {
    assert.strictEqual(typeof QUEST_REPUTATION_REWARDS.trivial, 'number');
    assert.strictEqual(typeof QUEST_REPUTATION_REWARDS.easy, 'number');
    assert.strictEqual(typeof QUEST_REPUTATION_REWARDS.normal, 'number');
    assert.strictEqual(typeof QUEST_REPUTATION_REWARDS.hard, 'number');
    assert.strictEqual(typeof QUEST_REPUTATION_REWARDS.epic, 'number');
    assert.strictEqual(typeof QUEST_REPUTATION_REWARDS.legendary, 'number');
  });

  it('should have increasing rewards for higher difficulties', () => {
    assert.ok(QUEST_REPUTATION_REWARDS.trivial < QUEST_REPUTATION_REWARDS.easy);
    assert.ok(QUEST_REPUTATION_REWARDS.easy < QUEST_REPUTATION_REWARDS.normal);
    assert.ok(QUEST_REPUTATION_REWARDS.normal < QUEST_REPUTATION_REWARDS.hard);
    assert.ok(QUEST_REPUTATION_REWARDS.hard < QUEST_REPUTATION_REWARDS.epic);
    assert.ok(QUEST_REPUTATION_REWARDS.epic < QUEST_REPUTATION_REWARDS.legendary);
  });

  it('should have default difficulty as normal', () => {
    assert.strictEqual(DEFAULT_QUEST_DIFFICULTY, 'normal');
  });
});

// ============================================================================
// getQuestReputationReward tests
// ============================================================================

describe('getQuestReputationReward', () => {
  it('should return correct reward for trivial difficulty', () => {
    assert.strictEqual(getQuestReputationReward('trivial'), 5);
  });

  it('should return correct reward for easy difficulty', () => {
    assert.strictEqual(getQuestReputationReward('easy'), 10);
  });

  it('should return correct reward for normal difficulty', () => {
    assert.strictEqual(getQuestReputationReward('normal'), 20);
  });

  it('should return correct reward for hard difficulty', () => {
    assert.strictEqual(getQuestReputationReward('hard'), 35);
  });

  it('should return correct reward for epic difficulty', () => {
    assert.strictEqual(getQuestReputationReward('epic'), 50);
  });

  it('should return correct reward for legendary difficulty', () => {
    assert.strictEqual(getQuestReputationReward('legendary'), 75);
  });

  it('should return default (normal) reward for unknown difficulty', () => {
    assert.strictEqual(getQuestReputationReward('unknown'), 20);
  });

  it('should return default (normal) reward for undefined', () => {
    assert.strictEqual(getQuestReputationReward(undefined), 20);
  });
});

// ============================================================================
// processQuestCompletion tests
// ============================================================================

describe('processQuestCompletion', () => {
  let manager;

  beforeEach(() => {
    manager = new NPCRelationshipManager();
  });

  it('should return error for null relationship manager', () => {
    const result = processQuestCompletion(null, { id: 'quest1' });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid input');
  });

  it('should return error for null quest', () => {
    const result = processQuestCompletion(manager, null);
    assert.strictEqual(result.success, false);
  });

  it('should return error for quest without id', () => {
    const result = processQuestCompletion(manager, { name: 'Test Quest' });
    assert.strictEqual(result.success, false);
  });

  it('should process quest completion for quest giver', () => {
    const quest = {
      id: 'quest1',
      name: 'Test Quest',
      npcId: 'merchant_bram',
      difficulty: 'normal',
    };
    
    const result = processQuestCompletion(manager, quest);
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.questId, 'quest1');
    assert.strictEqual(result.changes.length, 1);
    assert.strictEqual(result.changes[0].npcId, 'merchant_bram');
    assert.strictEqual(result.changes[0].type, 'questGiver');
    assert.strictEqual(result.changes[0].reputationGained, 20);
  });

  it('should record quest as completed for NPC', () => {
    const quest = { id: 'quest1', npcId: 'merchant_bram' };
    processQuestCompletion(manager, quest);
    
    assert.ok(isQuestCompletedForNpc(manager, 'merchant_bram', 'quest1'));
  });

  it('should add reputation to NPC', () => {
    const quest = { id: 'quest1', npcId: 'merchant_bram', difficulty: 'hard' };
    const beforeRep = manager.getRelationship('merchant_bram').reputation;
    
    processQuestCompletion(manager, quest);
    
    const afterRep = manager.getRelationship('merchant_bram').reputation;
    assert.strictEqual(afterRep, beforeRep + 35);
  });

  it('should process beneficiary NPCs with half reward', () => {
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      difficulty: 'normal',
      beneficiaryNpcs: ['swamp_witch', 'hermit_sage'],
    };
    
    const result = processQuestCompletion(manager, quest);
    
    assert.strictEqual(result.changes.length, 3);
    
    const bramChange = result.changes.find(c => c.npcId === 'merchant_bram');
    const witchChange = result.changes.find(c => c.npcId === 'swamp_witch');
    const sageChange = result.changes.find(c => c.npcId === 'hermit_sage');
    
    assert.strictEqual(bramChange.reputationGained, 20);
    assert.strictEqual(witchChange.reputationGained, 10); // Half
    assert.strictEqual(witchChange.type, 'beneficiary');
    assert.strictEqual(sageChange.reputationGained, 10);
  });

  it('should skip beneficiary if same as quest giver', () => {
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      beneficiaryNpcs: ['merchant_bram', 'swamp_witch'],
    };
    
    const result = processQuestCompletion(manager, quest);
    
    // Should only have 2 changes: quest giver + swamp_witch
    assert.strictEqual(result.changes.length, 2);
    const bramChanges = result.changes.filter(c => c.npcId === 'merchant_bram');
    assert.strictEqual(bramChanges.length, 1);
  });

  it('should track level up when relationship improves', () => {
    // First, get merchant_bram to FRIENDLY level
    manager.modifyReputation('merchant_bram', 45); // Should be at FRIENDLY now
    
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      difficulty: 'epic', // +50 reputation
    };
    
    const result = processQuestCompletion(manager, quest);
    
    // Should level up to ALLIED (needs 80+ reputation)
    const change = result.changes[0];
    assert.strictEqual(change.leveledUp, true);
    assert.strictEqual(change.afterLevel, RelationshipLevel.ALLIED);
  });

  it('should use default difficulty if not specified', () => {
    const quest = { id: 'quest1', npcId: 'merchant_bram' };
    
    const result = processQuestCompletion(manager, quest);
    
    assert.strictEqual(result.difficulty, 'normal');
    assert.strictEqual(result.changes[0].reputationGained, 20);
  });

  it('should handle quest without npcId', () => {
    const quest = { id: 'quest1', name: 'Global Quest' };
    
    const result = processQuestCompletion(manager, quest);
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.changes.length, 0);
  });
});

// ============================================================================
// isQuestCompletedForNpc tests
// ============================================================================

describe('isQuestCompletedForNpc', () => {
  let manager;

  beforeEach(() => {
    manager = new NPCRelationshipManager();
  });

  it('should return false for null manager', () => {
    assert.strictEqual(isQuestCompletedForNpc(null, 'npc1', 'quest1'), false);
  });

  it('should return false for null npcId', () => {
    assert.strictEqual(isQuestCompletedForNpc(manager, null, 'quest1'), false);
  });

  it('should return false for null questId', () => {
    assert.strictEqual(isQuestCompletedForNpc(manager, 'npc1', null), false);
  });

  it('should return false for NPC with no interactions', () => {
    assert.strictEqual(isQuestCompletedForNpc(manager, 'npc1', 'quest1'), false);
  });

  it('should return true for completed quest', () => {
    manager.recordQuestComplete('npc1', 'quest1');
    assert.strictEqual(isQuestCompletedForNpc(manager, 'npc1', 'quest1'), true);
  });

  it('should return false for different quest', () => {
    manager.recordQuestComplete('npc1', 'quest1');
    assert.strictEqual(isQuestCompletedForNpc(manager, 'npc1', 'quest2'), false);
  });
});

// ============================================================================
// getQuestsCompletedCount tests
// ============================================================================

describe('getQuestsCompletedCount', () => {
  let manager;

  beforeEach(() => {
    manager = new NPCRelationshipManager();
  });

  it('should return 0 for null manager', () => {
    assert.strictEqual(getQuestsCompletedCount(null, 'npc1'), 0);
  });

  it('should return 0 for null npcId', () => {
    assert.strictEqual(getQuestsCompletedCount(manager, null), 0);
  });

  it('should return 0 for NPC with no quests', () => {
    assert.strictEqual(getQuestsCompletedCount(manager, 'npc1'), 0);
  });

  it('should return correct count for multiple quests', () => {
    manager.recordQuestComplete('npc1', 'quest1');
    manager.recordQuestComplete('npc1', 'quest2');
    manager.recordQuestComplete('npc1', 'quest3');
    
    assert.strictEqual(getQuestsCompletedCount(manager, 'npc1'), 3);
  });
});

// ============================================================================
// generateQuestCompletionMessages tests
// ============================================================================

describe('generateQuestCompletionMessages', () => {
  it('should return empty array for null result', () => {
    assert.deepStrictEqual(generateQuestCompletionMessages(null), []);
  });

  it('should return empty array for failed result', () => {
    assert.deepStrictEqual(generateQuestCompletionMessages({ success: false }), []);
  });

  it('should generate message for quest giver', () => {
    const result = {
      success: true,
      changes: [{
        npcId: 'merchant_bram',
        type: 'questGiver',
        reputationGained: 20,
        leveledUp: false,
      }],
    };
    
    const messages = generateQuestCompletionMessages(result);
    
    assert.strictEqual(messages.length, 1);
    assert.ok(messages[0].includes('merchant_bram'));
    assert.ok(messages[0].includes('+20 reputation'));
  });

  it('should generate message for beneficiary', () => {
    const result = {
      success: true,
      changes: [{
        npcId: 'swamp_witch',
        type: 'beneficiary',
        reputationGained: 10,
        leveledUp: false,
      }],
    };
    
    const messages = generateQuestCompletionMessages(result);
    
    assert.strictEqual(messages.length, 1);
    assert.ok(messages[0].includes('swamp_witch'));
    assert.ok(messages[0].includes('good deed'));
  });

  it('should include level up message', () => {
    const result = {
      success: true,
      changes: [{
        npcId: 'merchant_bram',
        type: 'questGiver',
        reputationGained: 50,
        leveledUp: true,
        afterLevel: 'ALLIED',
      }],
    };
    
    const messages = generateQuestCompletionMessages(result);
    
    assert.ok(messages[0].includes('ALLIED'));
    assert.ok(messages[0].includes('level'));
  });
});

// ============================================================================
// createQuestCompletionHandler tests
// ============================================================================

describe('createQuestCompletionHandler', () => {
  it('should return a function', () => {
    const manager = new NPCRelationshipManager();
    const handler = createQuestCompletionHandler(manager);
    
    assert.strictEqual(typeof handler, 'function');
  });

  it('should process quests when called', () => {
    const manager = new NPCRelationshipManager();
    const handler = createQuestCompletionHandler(manager);
    
    const result = handler({ id: 'quest1', npcId: 'npc1' });
    
    assert.strictEqual(result.success, true);
    assert.ok(isQuestCompletedForNpc(manager, 'npc1', 'quest1'));
  });
});

// ============================================================================
// getRelationshipReputationBonus tests
// ============================================================================

describe('getRelationshipReputationBonus', () => {
  it('should return 0.75 for HOSTILE (penalty)', () => {
    assert.strictEqual(getRelationshipReputationBonus(RelationshipLevel.HOSTILE), 0.75);
  });

  it('should return 0.90 for UNFRIENDLY', () => {
    assert.strictEqual(getRelationshipReputationBonus(RelationshipLevel.UNFRIENDLY), 0.90);
  });

  it('should return 1.00 for NEUTRAL', () => {
    assert.strictEqual(getRelationshipReputationBonus(RelationshipLevel.NEUTRAL), 1.00);
  });

  it('should return 1.10 for FRIENDLY (10% bonus)', () => {
    assert.strictEqual(getRelationshipReputationBonus(RelationshipLevel.FRIENDLY), 1.10);
  });

  it('should return 1.25 for ALLIED (25% bonus)', () => {
    assert.strictEqual(getRelationshipReputationBonus(RelationshipLevel.ALLIED), 1.25);
  });

  it('should return 1.00 for invalid level', () => {
    assert.strictEqual(getRelationshipReputationBonus('INVALID'), 1.00);
  });
});

// ============================================================================
// processQuestCompletionWithBonus tests
// ============================================================================

describe('processQuestCompletionWithBonus', () => {
  let manager;

  beforeEach(() => {
    manager = new NPCRelationshipManager();
  });

  it('should apply bonus for FRIENDLY relationship', () => {
    // Get NPC to FRIENDLY (10-49 range)
    manager.modifyReputation('merchant_bram', 40);
    
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      difficulty: 'normal', // Base: 20
    };
    
    const result = processQuestCompletionWithBonus(manager, quest);
    
    // 20 * 1.10 = 22
    const change = result.changes[0];
    assert.strictEqual(change.baseReward, 20);
    assert.strictEqual(change.bonusMultiplier, 1.10);
    assert.strictEqual(change.reputationGained, 22);
  });

  it('should apply penalty for HOSTILE relationship', () => {
    // Get NPC to HOSTILE
    manager.modifyReputation('merchant_bram', -50);
    
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      difficulty: 'normal', // Base: 20
    };
    
    const result = processQuestCompletionWithBonus(manager, quest);
    
    // 20 * 0.75 = 15
    const change = result.changes[0];
    assert.strictEqual(change.bonusMultiplier, 0.75);
    assert.strictEqual(change.reputationGained, 15);
  });

  it('should apply bonus for ALLIED relationship', () => {
    // Get NPC to ALLIED
    manager.modifyReputation('merchant_bram', 100);
    
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      difficulty: 'hard', // Base: 35
    };
    
    const result = processQuestCompletionWithBonus(manager, quest);
    
    // 35 * 1.25 = 43.75 -> 43
    const change = result.changes[0];
    assert.strictEqual(change.bonusMultiplier, 1.25);
    assert.strictEqual(change.reputationGained, 43);
  });

  it('should not apply bonus to beneficiaries', () => {
    manager.modifyReputation('merchant_bram', 50); // FRIENDLY
    manager.modifyReputation('swamp_witch', 100); // ALLIED
    
    const quest = {
      id: 'quest1',
      npcId: 'merchant_bram',
      difficulty: 'normal',
      beneficiaryNpcs: ['swamp_witch'],
    };
    
    const result = processQuestCompletionWithBonus(manager, quest);
    
    const witchChange = result.changes.find(c => c.npcId === 'swamp_witch');
    // Beneficiary gets half base reward, no bonus
    assert.strictEqual(witchChange.reputationGained, 10);
  });

  it('should return error for invalid input', () => {
    const result = processQuestCompletionWithBonus(null, { id: 'q1' });
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Integration tests
// ============================================================================

describe('Integration tests', () => {
  it('should work with full quest workflow', () => {
    const manager = new NPCRelationshipManager();
    
    // Complete multiple quests for same NPC
    const quest1 = { id: 'q1', npcId: 'merchant_bram', difficulty: 'easy' };
    const quest2 = { id: 'q2', npcId: 'merchant_bram', difficulty: 'normal' };
    const quest3 = { id: 'q3', npcId: 'merchant_bram', difficulty: 'hard' };
    
    processQuestCompletion(manager, quest1); // +10
    processQuestCompletion(manager, quest2); // +20
    processQuestCompletion(manager, quest3); // +35
    
    // Total: 65 reputation
    assert.strictEqual(manager.getRelationship('merchant_bram').reputation, 65);
    assert.strictEqual(getQuestsCompletedCount(manager, 'merchant_bram'), 3);
    assert.strictEqual(manager.getRelationshipLevel('merchant_bram'), RelationshipLevel.ALLIED);
  });

  it('should integrate with handler pattern', () => {
    const manager = new NPCRelationshipManager();
    const onQuestComplete = createQuestCompletionHandler(manager);
    
    const result = onQuestComplete({
      id: 'main_quest_1',
      name: 'The Dark Forest',
      npcId: 'village_elder',
      difficulty: 'epic',
      beneficiaryNpcs: ['merchant_bram', 'swamp_witch'],
    });
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.changes.length, 3);
    
    // Elder gets 50, others get 25 each
    assert.strictEqual(manager.getRelationship('village_elder').reputation, 50);
    assert.strictEqual(manager.getRelationship('merchant_bram').reputation, 25);
    assert.strictEqual(manager.getRelationship('swamp_witch').reputation, 25);
  });
});
