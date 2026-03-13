/**
 * Skill Tree System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  SKILL_TREES,
  SKILL_TIERS,
  SKILL_TYPES,
  DEFAULT_SKILLS,
  initSkillTreeState,
  addSkillPoints,
  canUnlockSkill,
  unlockSkill,
  getSkillWithEffects,
  getTreeSkills,
  setSkillActive,
  removeActiveSkill,
  getActiveSkillBar,
  getPassiveBonuses,
  resetTree,
  resetAllTrees,
  getSkillTreeSummary,
  registerSkill,
  getAllTrees,
  getAllTiers
} from '../src/skill-tree-system.js';

import {
  renderSkillNode,
  renderSkillTooltip,
  renderSkillTree,
  renderTreeTabs,
  renderSkillPointsDisplay,
  renderActiveSkillBar,
  renderPassiveBonuses,
  renderTierLegend,
  renderTreeProgress,
  renderResetDialog,
  renderSkillUnlockNotification,
  renderSkillTreePage,
  renderCompactSkillSummary
} from '../src/skill-tree-system-ui.js';

describe('Skill Tree System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initSkillTreeState(state);
    state = result.state;
  });

  describe('SKILL_TREES', () => {
    it('has all trees', () => {
      assert.ok(SKILL_TREES.COMBAT);
      assert.ok(SKILL_TREES.MAGIC);
      assert.ok(SKILL_TREES.DEFENSE);
      assert.ok(SKILL_TREES.UTILITY);
    });

    it('has tree properties', () => {
      assert.strictEqual(SKILL_TREES.COMBAT.id, 'combat');
      assert.ok(SKILL_TREES.COMBAT.icon);
      assert.ok(SKILL_TREES.COMBAT.color);
    });
  });

  describe('SKILL_TIERS', () => {
    it('has all tiers', () => {
      assert.ok(SKILL_TIERS.NOVICE);
      assert.ok(SKILL_TIERS.APPRENTICE);
      assert.ok(SKILL_TIERS.ADEPT);
      assert.ok(SKILL_TIERS.EXPERT);
      assert.ok(SKILL_TIERS.MASTER);
    });

    it('has increasing point costs', () => {
      assert.ok(SKILL_TIERS.MASTER.pointCost > SKILL_TIERS.NOVICE.pointCost);
    });
  });

  describe('DEFAULT_SKILLS', () => {
    it('has skills defined', () => {
      assert.ok(DEFAULT_SKILLS.power_strike);
      assert.ok(DEFAULT_SKILLS.mana_bolt);
      assert.ok(DEFAULT_SKILLS.iron_skin);
    });
  });

  describe('initSkillTreeState', () => {
    it('creates initial state', () => {
      assert.ok(state.skillTrees);
      assert.strictEqual(state.skillTrees.availablePoints, 0);
      assert.ok(state.skillTrees.unlockedSkills);
      assert.ok(state.skillTrees.skillDefinitions);
    });

    it('initializes tree progress', () => {
      assert.strictEqual(state.skillTrees.treeProgress.combat, 0);
      assert.strictEqual(state.skillTrees.treeProgress.magic, 0);
    });
  });

  describe('addSkillPoints', () => {
    it('adds points', () => {
      const result = addSkillPoints(state, 5);
      assert.ok(result.success);
      assert.strictEqual(result.state.skillTrees.availablePoints, 5);
    });

    it('fails for invalid amount', () => {
      const result = addSkillPoints(state, -1);
      assert.ok(!result.success);
    });
  });

  describe('canUnlockSkill', () => {
    it('returns false without points', () => {
      const result = canUnlockSkill(state, 'power_strike');
      assert.ok(!result.canUnlock);
      assert.ok(result.reason.includes('points'));
    });

    it('returns true with points', () => {
      state = addSkillPoints(state, 5).state;
      const result = canUnlockSkill(state, 'power_strike');
      assert.ok(result.canUnlock);
    });

    it('checks prerequisites', () => {
      state = addSkillPoints(state, 10).state;
      const result = canUnlockSkill(state, 'critical_mastery');
      assert.ok(!result.canUnlock);
      // Could be "Requires X" or "Need X points in tree"
      assert.ok(result.reason.includes('Requires') || result.reason.includes('Need'));
    });

    it('returns false for unknown skill', () => {
      const result = canUnlockSkill(state, 'unknown');
      assert.ok(!result.canUnlock);
    });
  });

  describe('unlockSkill', () => {
    beforeEach(() => {
      state = addSkillPoints(state, 20).state;
    });

    it('unlocks a skill', () => {
      const result = unlockSkill(state, 'power_strike');
      assert.ok(result.success);
      assert.strictEqual(result.newRank, 1);
      assert.ok(result.isNewUnlock);
    });

    it('spends points', () => {
      const result = unlockSkill(state, 'power_strike');
      assert.ok(result.state.skillTrees.availablePoints < 20);
    });

    it('updates tree progress', () => {
      const result = unlockSkill(state, 'power_strike');
      assert.ok(result.state.skillTrees.treeProgress.combat > 0);
    });

    it('allows upgrading skills', () => {
      state = unlockSkill(state, 'power_strike').state;
      const result = unlockSkill(state, 'power_strike');
      assert.ok(result.success);
      assert.strictEqual(result.newRank, 2);
      assert.ok(!result.isNewUnlock);
    });

    it('fails when already maxed', () => {
      // Max out skill
      for (let i = 0; i < 5; i++) {
        state = unlockSkill(state, 'power_strike').state;
      }
      const result = unlockSkill(state, 'power_strike');
      assert.ok(!result.success);
    });
  });

  describe('getSkillWithEffects', () => {
    it('returns skill info', () => {
      const result = getSkillWithEffects(state, 'power_strike');
      assert.ok(result.found);
      assert.ok(!result.unlocked);
    });

    it('calculates effects based on rank', () => {
      state = addSkillPoints(state, 10).state;
      state = unlockSkill(state, 'power_strike').state;
      state = unlockSkill(state, 'power_strike').state;
      const result = getSkillWithEffects(state, 'power_strike');
      assert.ok(result.effects.damageMultiplier > 1.5);
    });
  });

  describe('getTreeSkills', () => {
    it('returns skills in tree', () => {
      const result = getTreeSkills(state, 'combat');
      assert.ok(result.tree);
      assert.ok(result.skills.length > 0);
    });

    it('includes unlock status', () => {
      state = addSkillPoints(state, 5).state;
      state = unlockSkill(state, 'power_strike').state;
      const result = getTreeSkills(state, 'combat');
      const skill = result.skills.find(s => s.id === 'power_strike');
      assert.strictEqual(skill.currentRank, 1);
    });
  });

  describe('setSkillActive', () => {
    beforeEach(() => {
      state = addSkillPoints(state, 10).state;
      state = unlockSkill(state, 'power_strike').state;
    });

    it('sets skill to slot', () => {
      const result = setSkillActive(state, 'power_strike', 0);
      assert.ok(result.success);
      assert.strictEqual(result.state.skillTrees.activeSkills.length, 1);
    });

    it('fails for locked skill', () => {
      const result = setSkillActive(state, 'whirlwind', 0);
      assert.ok(!result.success);
    });

    it('fails for passive skill', () => {
      // Need more points to unlock apprentice tier
      state = addSkillPoints(state, 20).state;
      // Unlock power_strike 5 times to get 5 tree points
      for (let i = 0; i < 4; i++) {
        state = unlockSkill(state, 'power_strike').state;
      }
      // Now unlock the passive skill
      const unlockResult = unlockSkill(state, 'critical_mastery');
      assert.ok(unlockResult.success, 'Should unlock critical_mastery');
      state = unlockResult.state;
      const result = setSkillActive(state, 'critical_mastery', 0);
      assert.ok(!result.success);
    });

    it('moves skill between slots', () => {
      state = setSkillActive(state, 'power_strike', 0).state;
      const result = setSkillActive(state, 'power_strike', 1);
      assert.ok(result.success);
      assert.ok(!result.state.skillTrees.activeSkills.find(s => s.slot === 0));
    });
  });

  describe('removeActiveSkill', () => {
    it('removes skill from bar', () => {
      state = addSkillPoints(state, 10).state;
      state = unlockSkill(state, 'power_strike').state;
      state = setSkillActive(state, 'power_strike', 0).state;
      const result = removeActiveSkill(state, 'power_strike');
      assert.strictEqual(result.state.skillTrees.activeSkills.length, 0);
    });
  });

  describe('getActiveSkillBar', () => {
    it('returns 10 slots', () => {
      const result = getActiveSkillBar(state);
      assert.strictEqual(result.length, 10);
    });

    it('includes assigned skills', () => {
      state = addSkillPoints(state, 10).state;
      state = unlockSkill(state, 'power_strike').state;
      state = setSkillActive(state, 'power_strike', 3).state;
      const result = getActiveSkillBar(state);
      assert.ok(result[3]);
      assert.strictEqual(result[3].id, 'power_strike');
    });
  });

  describe('getPassiveBonuses', () => {
    it('returns empty when no passives', () => {
      const result = getPassiveBonuses(state);
      assert.strictEqual(Object.keys(result).length, 0);
    });

    it('sums passive bonuses', () => {
      state = addSkillPoints(state, 20).state;
      // Unlock power_strike 5 times to get 5 tree points for apprentice tier
      for (let i = 0; i < 5; i++) {
        state = unlockSkill(state, 'power_strike').state;
      }
      // Now unlock the passive skill
      const unlockResult = unlockSkill(state, 'critical_mastery');
      assert.ok(unlockResult.success, 'Should unlock critical_mastery');
      state = unlockResult.state;
      const result = getPassiveBonuses(state);
      assert.ok(result.critChance > 0);
    });
  });

  describe('resetTree', () => {
    beforeEach(() => {
      state = addSkillPoints(state, 20).state;
      state = unlockSkill(state, 'power_strike').state;
      state = unlockSkill(state, 'power_strike').state;
    });

    it('refunds points', () => {
      const before = state.skillTrees.availablePoints;
      const result = resetTree(state, 'combat');
      assert.ok(result.success);
      assert.ok(result.state.skillTrees.availablePoints > before);
    });

    it('clears tree skills', () => {
      const result = resetTree(state, 'combat');
      assert.strictEqual(result.state.skillTrees.unlockedSkills['power_strike'], undefined);
    });

    it('resets tree progress', () => {
      const result = resetTree(state, 'combat');
      assert.strictEqual(result.state.skillTrees.treeProgress.combat, 0);
    });
  });

  describe('resetAllTrees', () => {
    it('refunds all points', () => {
      state = addSkillPoints(state, 20).state;
      state = unlockSkill(state, 'power_strike').state;
      state = unlockSkill(state, 'mana_bolt').state;
      const result = resetAllTrees(state);
      assert.ok(result.success);
      assert.strictEqual(result.state.skillTrees.totalPointsSpent, 0);
    });
  });

  describe('getSkillTreeSummary', () => {
    it('returns summary', () => {
      state = addSkillPoints(state, 10).state;
      const result = getSkillTreeSummary(state);
      assert.strictEqual(result.availablePoints, 10);
      assert.ok(result.trees.length > 0);
    });
  });

  describe('registerSkill', () => {
    it('registers custom skill', () => {
      const result = registerSkill(state, {
        id: 'custom_skill',
        name: 'Custom Skill',
        tree: 'combat',
        tier: 'novice',
        description: 'A custom skill'
      });
      assert.ok(result.success);
      assert.ok(result.state.skillTrees.skillDefinitions.custom_skill);
    });

    it('fails for invalid skill', () => {
      const result = registerSkill(state, { id: 'bad' });
      assert.ok(!result.success);
    });
  });

  describe('getAllTrees', () => {
    it('returns all trees', () => {
      const trees = getAllTrees();
      assert.ok(trees.length > 0);
      assert.ok(trees.find(t => t.id === 'combat'));
    });
  });

  describe('getAllTiers', () => {
    it('returns all tiers', () => {
      const tiers = getAllTiers();
      assert.ok(tiers.length > 0);
      assert.ok(tiers.find(t => t.id === 'novice'));
    });
  });
});

describe('Skill Tree System UI', () => {
  let state;

  beforeEach(() => {
    state = initSkillTreeState({}).state;
    state = addSkillPoints(state, 50).state;
    state = unlockSkill(state, 'power_strike').state;
    state = unlockSkill(state, 'mana_bolt').state;
  });

  describe('renderSkillNode', () => {
    it('renders skill node', () => {
      const html = renderSkillNode(state, 'power_strike');
      assert.ok(html.includes('skill-node'));
      assert.ok(html.includes('Power Strike'));
    });

    it('shows unlocked status', () => {
      const html = renderSkillNode(state, 'power_strike');
      assert.ok(html.includes('unlocked'));
    });

    it('shows locked status', () => {
      const html = renderSkillNode(state, 'whirlwind');
      assert.ok(html.includes('locked'));
    });

    it('renders compact mode', () => {
      const html = renderSkillNode(state, 'power_strike', { compact: true });
      assert.ok(html.includes('compact'));
    });
  });

  describe('renderSkillTooltip', () => {
    it('renders tooltip', () => {
      const html = renderSkillTooltip(state, 'power_strike');
      assert.ok(html.includes('skill-tooltip'));
      assert.ok(html.includes('Power Strike'));
    });

    it('shows effects', () => {
      const html = renderSkillTooltip(state, 'power_strike');
      assert.ok(html.includes('Effects'));
    });
  });

  describe('renderSkillTree', () => {
    it('renders tree', () => {
      const html = renderSkillTree(state, 'combat');
      assert.ok(html.includes('skill-tree'));
      assert.ok(html.includes('Combat'));
    });

    it('shows skills', () => {
      const html = renderSkillTree(state, 'combat');
      assert.ok(html.includes('Power Strike'));
    });
  });

  describe('renderTreeTabs', () => {
    it('renders tabs', () => {
      const html = renderTreeTabs('combat');
      assert.ok(html.includes('tree-tabs'));
      assert.ok(html.includes('Combat'));
      assert.ok(html.includes('Magic'));
    });

    it('marks selected tab', () => {
      const html = renderTreeTabs('combat');
      assert.ok(html.includes('active'));
    });
  });

  describe('renderSkillPointsDisplay', () => {
    it('renders points display', () => {
      const html = renderSkillPointsDisplay(state);
      assert.ok(html.includes('skill-points-display'));
      assert.ok(html.includes('Available Points'));
    });
  });

  describe('renderActiveSkillBar', () => {
    it('renders skill bar', () => {
      state = setSkillActive(state, 'power_strike', 0).state;
      const html = renderActiveSkillBar(state);
      assert.ok(html.includes('active-skill-bar'));
      assert.ok(html.includes('skill-slots'));
    });

    it('shows assigned skill', () => {
      state = setSkillActive(state, 'power_strike', 0).state;
      const html = renderActiveSkillBar(state);
      assert.ok(html.includes('Power Strike'));
    });
  });

  describe('renderPassiveBonuses', () => {
    it('renders passive bonuses', () => {
      // power_strike already unlocked in beforeEach
      // Unlock it more times to reach 5 tree points for apprentice tier
      state = unlockSkill(state, 'power_strike').state; // rank 2
      state = unlockSkill(state, 'power_strike').state; // rank 3
      state = unlockSkill(state, 'power_strike').state; // rank 4
      state = unlockSkill(state, 'power_strike').state; // rank 5 (maxed, 5 pts in tree)
      // Now can unlock apprentice tier skill
      const unlockResult = unlockSkill(state, 'critical_mastery');
      assert.ok(unlockResult.success, 'Should unlock critical_mastery');
      state = unlockResult.state;
      const html = renderPassiveBonuses(state);
      assert.ok(html.includes('passive-bonuses'));
    });

    it('shows empty state', () => {
      const emptyState = initSkillTreeState({}).state;
      const html = renderPassiveBonuses(emptyState);
      assert.ok(html.includes('No passive bonuses'));
    });
  });

  describe('renderTierLegend', () => {
    it('renders legend', () => {
      const html = renderTierLegend();
      assert.ok(html.includes('tier-legend'));
      assert.ok(html.includes('Novice'));
      assert.ok(html.includes('Master'));
    });
  });

  describe('renderTreeProgress', () => {
    it('renders progress bars', () => {
      const html = renderTreeProgress(state);
      assert.ok(html.includes('tree-progress-summary'));
      assert.ok(html.includes('Combat'));
    });
  });

  describe('renderResetDialog', () => {
    it('renders tree reset dialog', () => {
      const html = renderResetDialog('combat');
      assert.ok(html.includes('reset-dialog'));
      assert.ok(html.includes('Combat'));
    });

    it('renders full reset dialog', () => {
      const html = renderResetDialog();
      assert.ok(html.includes('All Skills'));
    });
  });

  describe('renderSkillUnlockNotification', () => {
    it('renders unlock notification', () => {
      const skill = state.skillTrees.skillDefinitions.power_strike;
      const html = renderSkillUnlockNotification(skill, 1, true);
      assert.ok(html.includes('skill-notification'));
      assert.ok(html.includes('Skill Unlocked'));
    });

    it('renders upgrade notification', () => {
      const skill = state.skillTrees.skillDefinitions.power_strike;
      const html = renderSkillUnlockNotification(skill, 2, false);
      assert.ok(html.includes('Skill Upgraded'));
    });
  });

  describe('renderSkillTreePage', () => {
    it('renders full page', () => {
      const html = renderSkillTreePage(state, 'combat');
      assert.ok(html.includes('skill-tree-page'));
      assert.ok(html.includes('Skill Trees'));
    });
  });

  describe('renderCompactSkillSummary', () => {
    it('renders compact summary', () => {
      const html = renderCompactSkillSummary(state);
      assert.ok(html.includes('compact-skill-summary'));
      assert.ok(html.includes('skills'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes skill names', () => {
      const maliciousState = { ...state };
      maliciousState.skillTrees.skillDefinitions = {
        ...maliciousState.skillTrees.skillDefinitions,
        xss_skill: {
          id: 'xss_skill',
          name: '<script>alert("xss")</script>',
          description: 'Test',
          tree: 'combat',
          tier: 'novice',
          type: 'active',
          maxRanks: 1,
          effects: {},
          effectsPerRank: {},
          prerequisites: [],
          position: { x: 0, y: 0 }
        }
      };
      const html = renderSkillNode(maliciousState, 'xss_skill');
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
