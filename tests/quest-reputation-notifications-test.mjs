/**
 * Tests for Quest Reputation Notifications Module
 * Created by Claude Opus 4.5 (Villager) on Day 342
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  RELATIONSHIP_ICONS,
  LEVEL_TRANSITION_TEXT,
  createReputationChangeNotification,
  generateQuestCompletionNotifications,
  getQuestCompletionSummary,
  formatNotificationsForLog,
  captureReputationState,
  getQuestReputationPreview,
} from '../src/quest-reputation-notifications.js';

import { RelationshipLevel, NPCRelationshipManager } from '../src/npc-relationships.js';
import { QUEST_REPUTATION_REWARDS } from '../src/quest-relationship-bridge.js';

describe('Quest Reputation Notifications Module', () => {
  
  describe('RELATIONSHIP_ICONS', () => {
    it('should have icons for all relationship levels', () => {
      assert.ok(RELATIONSHIP_ICONS[RelationshipLevel.HOSTILE]);
      assert.ok(RELATIONSHIP_ICONS[RelationshipLevel.UNFRIENDLY]);
      assert.ok(RELATIONSHIP_ICONS[RelationshipLevel.NEUTRAL]);
      assert.ok(RELATIONSHIP_ICONS[RelationshipLevel.FRIENDLY]);
      assert.ok(RELATIONSHIP_ICONS[RelationshipLevel.ALLIED]);
    });

    it('should use emoji icons', () => {
      assert.strictEqual(RELATIONSHIP_ICONS[RelationshipLevel.HOSTILE], '💢');
      assert.strictEqual(RELATIONSHIP_ICONS[RelationshipLevel.FRIENDLY], '😊');
      assert.strictEqual(RELATIONSHIP_ICONS[RelationshipLevel.ALLIED], '💖');
    });
  });

  describe('LEVEL_TRANSITION_TEXT', () => {
    it('should have transition text for all relationship levels', () => {
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.HOSTILE]);
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.UNFRIENDLY]);
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.NEUTRAL]);
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.FRIENDLY]);
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.ALLIED]);
    });

    it('should have descriptive text', () => {
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.ALLIED].includes('ally'));
      assert.ok(LEVEL_TRANSITION_TEXT[RelationshipLevel.HOSTILE].includes('hostile'));
    });
  });

  describe('createReputationChangeNotification', () => {
    it('should create notification for positive reputation change without level change', () => {
      const notification = createReputationChangeNotification(
        'Elder Thorn',
        15,
        RelationshipLevel.NEUTRAL,
        RelationshipLevel.NEUTRAL
      );

      assert.strictEqual(notification.type, 'reputation');
      assert.strictEqual(notification.npcName, 'Elder Thorn');
      assert.strictEqual(notification.reputationChange, 15);
      assert.strictEqual(notification.levelChanged, false);
      assert.strictEqual(notification.isPositive, true);
      assert.ok(notification.text.includes('Elder Thorn'));
      assert.ok(notification.text.includes('improved'));
      assert.ok(notification.text.includes('15'));
    });

    it('should create notification for negative reputation change', () => {
      const notification = createReputationChangeNotification(
        'Grumpy Merchant',
        -10,
        RelationshipLevel.NEUTRAL,
        RelationshipLevel.NEUTRAL
      );

      assert.strictEqual(notification.isPositive, false);
      assert.ok(notification.text.includes('decreased'));
      assert.ok(notification.text.includes('10'));
    });

    it('should create notification for level change', () => {
      const notification = createReputationChangeNotification(
        'Village Chief',
        20,
        RelationshipLevel.NEUTRAL,
        RelationshipLevel.FRIENDLY
      );

      assert.strictEqual(notification.levelChanged, true);
      assert.ok(notification.text.includes('friendly'));
      assert.ok(notification.text.includes('+20'));
    });

    it('should use appropriate icon based on new level', () => {
      const friendlyNotification = createReputationChangeNotification(
        'NPC',
        10,
        RelationshipLevel.NEUTRAL,
        RelationshipLevel.FRIENDLY
      );
      assert.ok(friendlyNotification.text.includes('😊'));

      const hostileNotification = createReputationChangeNotification(
        'NPC',
        -50,
        RelationshipLevel.NEUTRAL,
        RelationshipLevel.HOSTILE
      );
      assert.ok(hostileNotification.text.includes('💢'));
    });

    it('should include previous and new level in notification object', () => {
      const notification = createReputationChangeNotification(
        'Test NPC',
        25,
        RelationshipLevel.UNFRIENDLY,
        RelationshipLevel.NEUTRAL
      );

      assert.strictEqual(notification.previousLevel, RelationshipLevel.UNFRIENDLY);
      assert.strictEqual(notification.newLevel, RelationshipLevel.NEUTRAL);
    });
  });

  describe('generateQuestCompletionNotifications', () => {
    it('should return empty array for null states', () => {
      const notifications = generateQuestCompletionNotifications({}, null, null, {});
      assert.deepStrictEqual(notifications, []);
    });

    it('should generate notifications for affected NPCs', () => {
      const quest = {
        questGiver: 'elder_thorn',
        beneficiaryNpcs: ['villager_1'],
      };

      const beforeState = {
        reputations: { elder_thorn: 0, villager_1: 5 },
        levels: { elder_thorn: RelationshipLevel.NEUTRAL, villager_1: RelationshipLevel.NEUTRAL },
        affectedNpcs: ['elder_thorn', 'villager_1'],
      };

      const afterState = {
        reputations: { elder_thorn: 20, villager_1: 15 },
        levels: { elder_thorn: RelationshipLevel.FRIENDLY, villager_1: RelationshipLevel.FRIENDLY },
        affectedNpcs: ['elder_thorn', 'villager_1'],
      };

      const npcNames = {
        elder_thorn: 'Elder Thorn',
        villager_1: 'Village Farmer',
      };

      const notifications = generateQuestCompletionNotifications(quest, beforeState, afterState, npcNames);

      assert.strictEqual(notifications.length, 2);
      assert.ok(notifications.some(n => n.npcName === 'Elder Thorn'));
      assert.ok(notifications.some(n => n.npcName === 'Village Farmer'));
    });

    it('should not generate notification if reputation unchanged', () => {
      const quest = { questGiver: 'npc1' };

      const beforeState = {
        reputations: { npc1: 10 },
        levels: { npc1: RelationshipLevel.FRIENDLY },
        affectedNpcs: ['npc1'],
      };

      const afterState = {
        reputations: { npc1: 10 }, // No change
        levels: { npc1: RelationshipLevel.FRIENDLY },
        affectedNpcs: ['npc1'],
      };

      const notifications = generateQuestCompletionNotifications(quest, beforeState, afterState, {});
      assert.strictEqual(notifications.length, 0);
    });

    it('should use npcId as name if no name provided', () => {
      const quest = { questGiver: 'mysterious_stranger' };

      const beforeState = {
        reputations: { mysterious_stranger: 0 },
        levels: { mysterious_stranger: RelationshipLevel.NEUTRAL },
        affectedNpcs: ['mysterious_stranger'],
      };

      const afterState = {
        reputations: { mysterious_stranger: 20 },
        levels: { mysterious_stranger: RelationshipLevel.FRIENDLY },
        affectedNpcs: ['mysterious_stranger'],
      };

      const notifications = generateQuestCompletionNotifications(quest, beforeState, afterState, {});
      assert.ok(notifications[0].npcName === 'mysterious_stranger');
    });
  });

  describe('getQuestCompletionSummary', () => {
    it('should return simple message for quest with no reputation changes', () => {
      const summary = getQuestCompletionSummary('Gather Herbs', []);
      assert.strictEqual(summary, 'Quest completed: Gather Herbs');
    });

    it('should include total reputation in summary', () => {
      const notifications = [
        { reputationChange: 20, levelChanged: false, isPositive: true },
        { reputationChange: 10, levelChanged: false, isPositive: true },
      ];

      const summary = getQuestCompletionSummary('Save the Village', notifications);
      assert.ok(summary.includes('+30'));
      assert.ok(summary.includes('reputation'));
    });

    it('should mention relationship improvements', () => {
      const notifications = [
        { reputationChange: 20, levelChanged: true, isPositive: true },
        { reputationChange: 10, levelChanged: true, isPositive: true },
      ];

      const summary = getQuestCompletionSummary('Epic Quest', notifications);
      assert.ok(summary.includes('2 relationships improved'));
    });

    it('should handle single relationship improvement', () => {
      const notifications = [
        { reputationChange: 20, levelChanged: true, isPositive: true },
      ];

      const summary = getQuestCompletionSummary('Small Quest', notifications);
      assert.ok(summary.includes('1 relationship improved'));
    });

    it('should handle negative reputation changes', () => {
      const notifications = [
        { reputationChange: -10, levelChanged: false, isPositive: false },
      ];

      const summary = getQuestCompletionSummary('Questionable Quest', notifications);
      assert.ok(summary.includes('-10'));
    });
  });

  describe('formatNotificationsForLog', () => {
    it('should return empty array for null/undefined input', () => {
      assert.deepStrictEqual(formatNotificationsForLog(null), []);
      assert.deepStrictEqual(formatNotificationsForLog(undefined), []);
    });

    it('should extract text from notifications', () => {
      const notifications = [
        { text: 'First notification', type: 'reputation' },
        { text: 'Second notification', type: 'reputation' },
      ];

      const formatted = formatNotificationsForLog(notifications);
      assert.deepStrictEqual(formatted, ['First notification', 'Second notification']);
    });

    it('should handle non-array input', () => {
      assert.deepStrictEqual(formatNotificationsForLog('not an array'), []);
      assert.deepStrictEqual(formatNotificationsForLog({}), []);
    });
  });

  describe('captureReputationState', () => {
    let manager;

    beforeEach(() => {
      manager = new NPCRelationshipManager();
    });

    it('should return empty state for null manager', () => {
      const state = captureReputationState(null, ['npc1']);
      assert.deepStrictEqual(state.reputations, {});
      assert.deepStrictEqual(state.levels, {});
    });

    it('should return empty state for null/invalid npcIds', () => {
      const state = captureReputationState(manager, null);
      assert.deepStrictEqual(state.reputations, {});
    });

    it('should capture current reputation state for NPCs', () => {
      manager.modifyReputation('elder', 30, 'test');
      manager.modifyReputation('merchant', -20, 'test');

      const state = captureReputationState(manager, ['elder', 'merchant', 'unknown']);

      assert.strictEqual(state.reputations.elder, 30);
      assert.strictEqual(state.reputations.merchant, -20);
      assert.strictEqual(state.levels.elder, RelationshipLevel.FRIENDLY);
      assert.strictEqual(state.levels.merchant, RelationshipLevel.UNFRIENDLY);
    });

    it('should include affectedNpcs in state', () => {
      const state = captureReputationState(manager, ['npc1', 'npc2']);
      assert.deepStrictEqual(state.affectedNpcs, ['npc1', 'npc2']);
    });
  });

  describe('getQuestReputationPreview', () => {
    it('should return default values for null quest', () => {
      const preview = getQuestReputationPreview(null);
      assert.strictEqual(preview.baseReward, 0);
      assert.strictEqual(preview.bonusMultiplier, 1);
      assert.deepStrictEqual(preview.expectedChanges, []);
    });

    it('should calculate expected reputation for quest giver', () => {
      const quest = {
        id: 'test_quest',
        name: 'Test Quest',
        difficulty: 'normal',
        questGiver: 'elder_thorn',
      };

      const preview = getQuestReputationPreview(quest);

      assert.strictEqual(preview.baseReward, QUEST_REPUTATION_REWARDS.normal);
      assert.strictEqual(preview.expectedChanges.length, 1);
      assert.strictEqual(preview.expectedChanges[0].npcId, 'elder_thorn');
      assert.strictEqual(preview.expectedChanges[0].type, 'questGiver');
      assert.strictEqual(preview.expectedChanges[0].expectedGain, QUEST_REPUTATION_REWARDS.normal);
    });

    it('should calculate half reward for beneficiaries', () => {
      const quest = {
        id: 'test_quest',
        difficulty: 'normal',
        questGiver: 'elder',
        beneficiaryNpcs: ['villager1', 'villager2'],
      };

      const preview = getQuestReputationPreview(quest);

      assert.strictEqual(preview.expectedChanges.length, 3);
      
      const beneficiaries = preview.expectedChanges.filter(c => c.type === 'beneficiary');
      assert.strictEqual(beneficiaries.length, 2);
      assert.strictEqual(beneficiaries[0].expectedGain, Math.floor(QUEST_REPUTATION_REWARDS.normal / 2));
    });

    it('should apply relationship bonus multipliers when manager provided', () => {
      const manager = new NPCRelationshipManager();
      manager.modifyReputation('allied_npc', 60, 'test'); // ALLIED level

      const quest = {
        id: 'test_quest',
        difficulty: 'normal',
        questGiver: 'allied_npc',
      };

      const preview = getQuestReputationPreview(quest, manager);

      // ALLIED gives 1.25x multiplier
      const expectedGain = Math.round(QUEST_REPUTATION_REWARDS.normal * 1.25);
      assert.strictEqual(preview.expectedChanges[0].multiplier, 1.25);
      assert.strictEqual(preview.expectedChanges[0].expectedGain, expectedGain);
    });

    it('should handle different difficulty levels', () => {
      const difficulties = ['trivial', 'easy', 'normal', 'hard', 'epic', 'legendary'];

      for (const difficulty of difficulties) {
        const quest = {
          id: `quest_${difficulty}`,
          difficulty,
          questGiver: 'npc',
        };

        const preview = getQuestReputationPreview(quest);
        assert.strictEqual(preview.baseReward, QUEST_REPUTATION_REWARDS[difficulty]);
        assert.strictEqual(preview.difficulty, difficulty);
      }
    });

    it('should default to normal difficulty if not specified', () => {
      const quest = {
        id: 'test_quest',
        questGiver: 'npc',
      };

      const preview = getQuestReputationPreview(quest);
      assert.strictEqual(preview.baseReward, QUEST_REPUTATION_REWARDS.normal);
    });

    it('should include quest name in preview', () => {
      const quest = {
        id: 'test_quest',
        name: 'Rescue the Princess',
        questGiver: 'king',
      };

      const preview = getQuestReputationPreview(quest);
      assert.strictEqual(preview.questName, 'Rescue the Princess');
    });

    it('should use quest id if name not provided', () => {
      const quest = {
        id: 'rescue_quest',
        questGiver: 'king',
      };

      const preview = getQuestReputationPreview(quest);
      assert.strictEqual(preview.questName, 'rescue_quest');
    });
  });

  describe('Integration scenarios', () => {
    it('should work end-to-end for quest completion flow', () => {
      const manager = new NPCRelationshipManager();
      
      // Setup: capture state before quest
      const quest = {
        id: 'help_farmer',
        name: 'Help the Farmer',
        difficulty: 'easy',
        questGiver: 'farmer_joe',
        beneficiaryNpcs: ['farmer_wife'],
      };

      const npcNames = {
        farmer_joe: 'Farmer Joe',
        farmer_wife: "Farmer's Wife",
      };

      const beforeState = captureReputationState(manager, ['farmer_joe', 'farmer_wife']);

      // Simulate quest completion (modify reputations)
      manager.modifyReputation('farmer_joe', 10, 'quest completion');
      manager.modifyReputation('farmer_wife', 5, 'quest benefit');

      const afterState = captureReputationState(manager, ['farmer_joe', 'farmer_wife']);

      // Generate notifications
      const notifications = generateQuestCompletionNotifications(quest, beforeState, afterState, npcNames);
      
      assert.strictEqual(notifications.length, 2);
      
      // Get summary
      const summary = getQuestCompletionSummary(quest.name, notifications);
      assert.ok(summary.includes('Help the Farmer'));
      assert.ok(summary.includes('+15'));

      // Format for log
      const logMessages = formatNotificationsForLog(notifications);
      assert.strictEqual(logMessages.length, 2);
    });

    it('should handle quest preview before starting quest', () => {
      const manager = new NPCRelationshipManager();
      manager.modifyReputation('guild_master', 25, 'previous quests'); // FRIENDLY

      const quest = {
        id: 'guild_trial',
        name: 'The Guild Trial',
        difficulty: 'hard',
        questGiver: 'guild_master',
        beneficiaryNpcs: ['guild_member_1', 'guild_member_2'],
      };

      const preview = getQuestReputationPreview(quest, manager);

      assert.strictEqual(preview.questName, 'The Guild Trial');
      assert.strictEqual(preview.difficulty, 'hard');
      assert.strictEqual(preview.baseReward, QUEST_REPUTATION_REWARDS.hard); // 35

      // Guild master is FRIENDLY, gets 1.1x multiplier
      const guildMasterChange = preview.expectedChanges.find(c => c.npcId === 'guild_master');
      assert.strictEqual(guildMasterChange.multiplier, 1.1);
      assert.strictEqual(guildMasterChange.expectedGain, Math.round(35 * 1.1)); // 39

      // Beneficiaries get half base (17.5 -> 17), no relationship bonus (NEUTRAL = 1.0x)
      const beneficiaryChanges = preview.expectedChanges.filter(c => c.type === 'beneficiary');
      assert.strictEqual(beneficiaryChanges.length, 2);
      assert.strictEqual(beneficiaryChanges[0].expectedGain, 17);
    });
  });
});
