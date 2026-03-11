import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  ALLIED,
  FRIENDLY,
  RELATIONSHIP_ACHIEVEMENTS,
  applyRelationshipMilestone,
  checkRelationshipMilestones,
  getRelationshipAchievementProgress,
} from '../src/relationship-achievements.js';

describe('relationship-achievements', () => {
  describe('constants', () => {
    it('FRIENDLY equals "FRIENDLY"', () => {
      assert.strictEqual(FRIENDLY, 'FRIENDLY');
    });

    it('ALLIED equals "ALLIED"', () => {
      assert.strictEqual(ALLIED, 'ALLIED');
    });
  });

  describe('checkRelationshipMilestones', () => {
    it('returns empty achievements and null milestone when no level change', () => {
      const state = { gameStats: {} };

      const result = checkRelationshipMilestones(state, 'npc-1', 'NEUTRAL', 'NEUTRAL');

      assert.deepStrictEqual(result, { achievementsUnlocked: [], milestoneReached: null });
    });

    it('returns first_friend when transitioning to FRIENDLY for the first time', () => {
      const state = { gameStats: {} };

      const result = checkRelationshipMilestones(state, 'npc-2', 'NEUTRAL', FRIENDLY);

      assert.deepStrictEqual(result, {
        achievementsUnlocked: ['first_friend'],
        milestoneReached: 'FRIENDLY',
      });
    });

    it('returns first_ally when transitioning to ALLIED for the first time', () => {
      const state = { gameStats: {} };

      const result = checkRelationshipMilestones(state, 'npc-3', FRIENDLY, ALLIED);

      assert.deepStrictEqual(result, {
        achievementsUnlocked: ['first_ally'],
        milestoneReached: 'ALLIED',
      });
    });

    it('does not return first_friend if a friendly NPC is already recorded', () => {
      const state = { gameStats: { firstFriendlyNpc: 'npc-early' } };

      const result = checkRelationshipMilestones(state, 'npc-4', 'NEUTRAL', FRIENDLY);

      assert.deepStrictEqual(result, { achievementsUnlocked: [], milestoneReached: null });
    });

    it('does not return first_ally if an allied NPC is already recorded', () => {
      const state = { gameStats: { firstAlliedNpc: 'npc-ally' } };

      const result = checkRelationshipMilestones(state, 'npc-5', FRIENDLY, ALLIED);

      assert.deepStrictEqual(result, { achievementsUnlocked: [], milestoneReached: null });
    });

    it('does not trigger when already at the same relationship level', () => {
      const state = { gameStats: {} };

      const friendlyResult = checkRelationshipMilestones(state, 'npc-6', FRIENDLY, FRIENDLY);
      const alliedResult = checkRelationshipMilestones(state, 'npc-7', ALLIED, ALLIED);

      assert.deepStrictEqual(friendlyResult, { achievementsUnlocked: [], milestoneReached: null });
      assert.deepStrictEqual(alliedResult, { achievementsUnlocked: [], milestoneReached: null });
    });

    it('handles missing gameStats gracefully', () => {
      const state = {};

      const result = checkRelationshipMilestones(state, 'npc-8', 'NEUTRAL', FRIENDLY);

      assert.deepStrictEqual(result, {
        achievementsUnlocked: ['first_friend'],
        milestoneReached: 'FRIENDLY',
      });
    });
  });

  describe('applyRelationshipMilestone', () => {
    it('sets firstFriendlyNpc when milestone is FRIENDLY', () => {
      const state = { gameStats: {} };

      const result = applyRelationshipMilestone(state, 'npc-9', 'FRIENDLY');

      assert.strictEqual(result.gameStats.firstFriendlyNpc, 'npc-9');
    });

    it('sets firstAlliedNpc when milestone is ALLIED', () => {
      const state = { gameStats: {} };

      const result = applyRelationshipMilestone(state, 'npc-10', 'ALLIED');

      assert.strictEqual(result.gameStats.firstAlliedNpc, 'npc-10');
    });

    it('returns a new state object and does not mutate the original', () => {
      const state = { gameStats: { firstFriendlyNpc: 'npc-existing' } };

      const result = applyRelationshipMilestone(state, 'npc-11', 'ALLIED');

      assert.notStrictEqual(result, state);
      assert.notStrictEqual(result.gameStats, state.gameStats);
      assert.deepStrictEqual(state, { gameStats: { firstFriendlyNpc: 'npc-existing' } });
    });

    it('does not modify the original state while setting milestones', () => {
      const state = { gameStats: {} };

      const result = applyRelationshipMilestone(state, 'npc-12', 'FRIENDLY');

      assert.deepStrictEqual(state, { gameStats: {} });
      assert.strictEqual(result.gameStats.firstFriendlyNpc, 'npc-12');
    });

    it('handles missing gameStats gracefully', () => {
      const state = {};

      const result = applyRelationshipMilestone(state, 'npc-13', 'ALLIED');

      assert.strictEqual(result.gameStats.firstAlliedNpc, 'npc-13');
      assert.deepStrictEqual(state, {});
    });
  });

  describe('RELATIONSHIP_ACHIEVEMENTS', () => {
    it('contains exactly two achievements', () => {
      assert.strictEqual(RELATIONSHIP_ACHIEVEMENTS.length, 2);
    });

    it('contains first_friend achievement with correct properties', () => {
      const achievement = RELATIONSHIP_ACHIEVEMENTS.find((item) => item.id === 'first_friend');

      assert.ok(achievement, 'first_friend achievement should exist');
      assert.deepStrictEqual(achievement, {
        id: 'first_friend',
        name: 'Making Friends',
        description: 'Reach FRIENDLY status with an NPC for the first time',
        category: 'social',
      });
    });

    it('contains first_ally achievement with correct properties', () => {
      const achievement = RELATIONSHIP_ACHIEVEMENTS.find((item) => item.id === 'first_ally');

      assert.ok(achievement, 'first_ally achievement should exist');
      assert.deepStrictEqual(achievement, {
        id: 'first_ally',
        name: 'Trusted Ally',
        description: 'Reach ALLIED status with an NPC for the first time',
        category: 'social',
      });
    });

    it('ensures all achievements are in the social category', () => {
      const allSocial = RELATIONSHIP_ACHIEVEMENTS.every((item) => item.category === 'social');

      assert.strictEqual(allSocial, true);
    });
  });

  describe('getRelationshipAchievementProgress', () => {
    it('returns zeros when no relationships exist', () => {
      const state = { npcRelationshipManager: { relationships: [] }, gameStats: {} };

      const progress = getRelationshipAchievementProgress(state);

      assert.deepStrictEqual(progress, {
        friendlyNpcs: 0,
        alliedNpcs: 0,
        firstFriendlyNpc: null,
        firstAlliedNpc: null,
      });
    });

    it('counts friendly NPCs correctly including allied NPCs', () => {
      const relationships = [
        { level: FRIENDLY },
        { level: ALLIED },
        { level: 'NEUTRAL' },
      ];
      const state = { npcRelationshipManager: { relationships }, gameStats: {} };

      const progress = getRelationshipAchievementProgress(state);

      assert.strictEqual(progress.friendlyNpcs, 2);
      assert.strictEqual(progress.alliedNpcs, 1);
    });

    it('returns firstFriendlyNpc and firstAlliedNpc from gameStats', () => {
      const state = {
        npcRelationshipManager: { relationships: [] },
        gameStats: { firstFriendlyNpc: 'npc-20', firstAlliedNpc: 'npc-21' },
      };

      const progress = getRelationshipAchievementProgress(state);

      assert.strictEqual(progress.firstFriendlyNpc, 'npc-20');
      assert.strictEqual(progress.firstAlliedNpc, 'npc-21');
    });

    it('handles npcRelationshipManager relationships stored in a Map', () => {
      const relationships = new Map([
        ['npc-30', { level: FRIENDLY }],
        ['npc-31', { level: ALLIED }],
        ['npc-32', { level: 'HOSTILE' }],
      ]);
      const state = { npcRelationshipManager: { relationships }, gameStats: {} };

      const progress = getRelationshipAchievementProgress(state);

      assert.strictEqual(progress.friendlyNpcs, 2);
      assert.strictEqual(progress.alliedNpcs, 1);
    });

    it('handles missing npcRelationshipManager gracefully', () => {
      const state = { gameStats: {} };

      const progress = getRelationshipAchievementProgress(state);

      assert.deepStrictEqual(progress, {
        friendlyNpcs: 0,
        alliedNpcs: 0,
        firstFriendlyNpc: null,
        firstAlliedNpc: null,
      });
    });

    it('handles empty state gracefully', () => {
      const progress = getRelationshipAchievementProgress({});

      assert.deepStrictEqual(progress, {
        friendlyNpcs: 0,
        alliedNpcs: 0,
        firstFriendlyNpc: null,
        firstAlliedNpc: null,
      });
    });
  });
});
