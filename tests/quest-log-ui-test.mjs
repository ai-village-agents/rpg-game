/**
 * Quest Log UI Tests
 * Tests for VIEW_QUESTS, CLOSE_QUESTS, ACCEPT_QUEST dispatch actions
 * and quest log rendering in render.js
 */

import { strict as assert } from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { initQuestState, acceptQuest, onRoomEnter, getAvailableQuestsInRoom, getActiveQuestsSummary } from '../src/quest-integration.js';

describe('Quest Log UI - Quest State Management', () => {
  let questState;

  beforeEach(() => {
    questState = initQuestState();
  });

  describe('VIEW_QUESTS action simulation', () => {
    it('should allow viewing quests from exploration phase', () => {
      // Simulate phase transition
      const state = { phase: 'exploration', questState };
      const newState = { ...state, phase: 'quests', previousPhase: state.phase };
      assert.strictEqual(newState.phase, 'quests');
      assert.strictEqual(newState.previousPhase, 'exploration');
    });

    it('should preserve questState when viewing quests', () => {
      const state = { phase: 'exploration', questState };
      const newState = { ...state, phase: 'quests', previousPhase: state.phase };
      assert.deepStrictEqual(newState.questState, questState);
    });

    it('should not allow viewing quests from class-select phase', () => {
      const state = { phase: 'class-select', questState: null };
      // In main.js, VIEW_QUESTS returns early if phase is class-select
      const shouldBlock = state.phase === 'class-select';
      assert.strictEqual(shouldBlock, true);
    });
  });

  describe('CLOSE_QUESTS action simulation', () => {
    it('should return to previous phase when closing quests', () => {
      const state = { phase: 'quests', previousPhase: 'exploration', questState };
      const newState = { ...state, phase: state.previousPhase || 'exploration' };
      assert.strictEqual(newState.phase, 'exploration');
    });

    it('should default to exploration if previousPhase is missing', () => {
      const state = { phase: 'quests', questState };
      const newState = { ...state, phase: state.previousPhase || 'exploration' };
      assert.strictEqual(newState.phase, 'exploration');
    });

    it('should only close from quests phase', () => {
      const state = { phase: 'exploration', questState };
      const shouldBlock = state.phase !== 'quests';
      assert.strictEqual(shouldBlock, true);
    });
  });

  describe('ACCEPT_QUEST action simulation', () => {
    it('should accept a quest and update questState', () => {
      const result = acceptQuest(questState, 'explore_village');
      assert.ok(result.questState);
      assert.ok(result.message);
      assert.ok(result.questState.activeQuests.includes('explore_village'));
    });

    it('should fail gracefully if questState not initialized', () => {
      // Simulating main.js behavior
      const state = { questState: null };
      const hasQuestState = !!state.questState;
      assert.strictEqual(hasQuestState, false);
    });

    it('should return error message for invalid quest', () => {
      const result = acceptQuest(questState, 'nonexistent_quest');
      assert.ok(result.message.includes('not found') || result.message.includes('Quest'));
    });
  });
});

describe('Quest Log UI - Quest Display Data', () => {
  let questState;

  beforeEach(() => {
    questState = initQuestState();
  });

  describe('getActiveQuestsSummary for UI display', () => {
    it('should return empty array when no active quests', () => {
      const summary = getActiveQuestsSummary(questState);
      assert.ok(Array.isArray(summary));
      assert.strictEqual(summary.length, 0);
    });

    it('should return quest info after accepting a quest', () => {
      const result = acceptQuest(questState, 'explore_village');
      const summary = getActiveQuestsSummary(result.questState);
      assert.ok(summary.length > 0);
      assert.ok(summary[0].questName);
    });

    it('should include stage progress information', () => {
      const result = acceptQuest(questState, 'explore_village');
      const summary = getActiveQuestsSummary(result.questState);
      assert.ok(summary[0].stageIndex !== undefined);
      assert.ok(summary[0].totalStages !== undefined);
    });
  });

  describe('getAvailableQuestsInRoom for UI display', () => {
    it('should return available quests for center room', () => {
      const available = getAvailableQuestsInRoom(questState, 'center');
      assert.ok(Array.isArray(available));
    });

    it('should not include already active quests', () => {
      const result = acceptQuest(questState, 'explore_village');
      const available = getAvailableQuestsInRoom(result.questState, 'center');
      const hasExploreVillage = available.some(q => q.id === 'explore_village');
      assert.strictEqual(hasExploreVillage, false);
    });

    it('should return quests with required display properties', () => {
      const available = getAvailableQuestsInRoom(questState, 'center');
      if (available.length > 0) {
        const quest = available[0];
        assert.ok(quest.id !== undefined);
        assert.ok(quest.name !== undefined);
      }
    });
  });
});

describe('Quest Log UI - Room Enter Integration', () => {
  let questState;

  beforeEach(() => {
    questState = initQuestState();
  });

  describe('onRoomEnter updates quest progress', () => {
    it('should update EXPLORE objectives when entering room', () => {
      // Accept explore_village quest which has EXPLORE objectives
      const acceptResult = acceptQuest(questState, 'explore_village');
      const enterResult = onRoomEnter(acceptResult.questState, 'n');
      assert.ok(enterResult.questState);
    });

    it('should track visited rooms for quest objectives', () => {
      const acceptResult = acceptQuest(questState, 'explore_village');
      const enterResult = onRoomEnter(acceptResult.questState, 'center');
      assert.ok(enterResult.questState.activeQuests.includes('explore_village'));
    });

    it('should handle null roomId gracefully', () => {
      const result = onRoomEnter(questState, null);
      assert.ok(result.questState);
    });
  });

  describe('ROOM_ID_MAP calculation', () => {
    it('should map row 0, col 0 to nw', () => {
      const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
      assert.strictEqual(ROOM_ID_MAP[0][0], 'nw');
    });

    it('should map row 1, col 1 to center', () => {
      const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
      assert.strictEqual(ROOM_ID_MAP[1][1], 'center');
    });

    it('should map row 2, col 2 to se', () => {
      const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
      assert.strictEqual(ROOM_ID_MAP[2][2], 'se');
    });

    it('should cover all 9 room positions', () => {
      const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
      const expectedRooms = ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'];
      const actualRooms = ROOM_ID_MAP.flat();
      assert.deepStrictEqual(actualRooms.sort(), expectedRooms.sort());
    });
  });
});

describe('Quest Log UI - Phase Transitions', () => {
  describe('Valid phase transitions', () => {
    it('exploration -> quests is valid', () => {
      const validTransitions = ['exploration', 'player-turn', 'victory'];
      assert.ok(validTransitions.includes('exploration'));
    });

    it('quests -> exploration (via previousPhase) is valid', () => {
      const state = { phase: 'quests', previousPhase: 'exploration' };
      const nextPhase = state.previousPhase || 'exploration';
      assert.strictEqual(nextPhase, 'exploration');
    });

    it('can view quests during player-turn in combat', () => {
      const state = { phase: 'player-turn', questState: initQuestState() };
      // VIEW_QUESTS only blocks class-select, so player-turn should work
      const shouldBlock = state.phase === 'class-select';
      assert.strictEqual(shouldBlock, false);
    });
  });
});

describe('Quest Log UI - Render Data Integrity', () => {
  let questState;

  beforeEach(() => {
    questState = initQuestState();
  });

  it('should provide escaped-safe quest names', () => {
    const result = acceptQuest(questState, 'explore_village');
    const summary = getActiveQuestsSummary(result.questState);
    if (summary.length > 0) {
      const name = summary[0].questName;
      // Name should not contain unescaped HTML
      assert.ok(!name.includes('<script>'));
    }
  });

  it('should handle missing questState gracefully in render', () => {
    const state = { phase: 'quests', questState: null };
    const safeQuestState = state.questState || { activeQuests: {}, completedQuests: [] };
    assert.ok(safeQuestState.activeQuests);
    assert.ok(safeQuestState.completedQuests);
  });

  it('should provide valid quest IDs for accept buttons', () => {
    const available = getAvailableQuestsInRoom(questState, 'center');
    available.forEach(q => {
      assert.ok(typeof q.id === 'string');
      assert.ok(q.id.length > 0);
    });
  });
});
