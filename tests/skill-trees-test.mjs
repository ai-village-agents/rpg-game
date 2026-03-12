/**
 * Skill Tree System Tests
 * Tests for skill trees, unlocking, and UI components
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import {
  SKILL_TYPES,
  TREE_CATEGORIES,
  SKILL_TREES,
  createSkillTreeState,
  getSkillTreeData,
  getSkillData,
  isSkillUnlocked,
  getSkillRank,
  canUnlockSkill,
  unlockSkill,
  addSkillPoints,
  getSkillEffect,
  getAllUnlockedSkills,
  getActiveSkills,
  getPassiveSkills,
  calculatePassiveBonuses,
  applyPassivesToStats,
  getTreeProgress,
  resetSkillTree,
  getAllTreeCategories,
  getAllSkillTrees,
} from '../src/skill-trees.js';

import {
  getSkillTreeStyles,
  renderSkillTreeTabs,
  renderSkillTree,
  renderPassiveBonuses,
  renderSkillUnlockNotice,
  renderCombatSkillList,
  renderTreesSummary,
} from '../src/skill-trees-ui.js';

// Banned words for security testing
const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

describe('Skill Types and Categories', () => {
  it('should define skill types', () => {
    assert.strictEqual(SKILL_TYPES.ACTIVE, 'active');
    assert.strictEqual(SKILL_TYPES.PASSIVE, 'passive');
    assert.strictEqual(SKILL_TYPES.BUFF, 'buff');
    assert.strictEqual(SKILL_TYPES.ULTIMATE, 'ultimate');
  });

  it('should define tree categories', () => {
    assert.ok(TREE_CATEGORIES.WARRIOR);
    assert.ok(TREE_CATEGORIES.MAGE);
    assert.ok(TREE_CATEGORIES.ROGUE);
    assert.ok(TREE_CATEGORIES.HEALER);
    assert.ok(TREE_CATEGORIES.UNIVERSAL);
  });
});

describe('Skill Trees Data', () => {
  it('should have warrior tree', () => {
    const tree = SKILL_TREES[TREE_CATEGORIES.WARRIOR];
    assert.ok(tree);
    assert.strictEqual(tree.name, 'Warrior');
    assert.ok(Object.keys(tree.skills).length > 0);
  });

  it('should have mage tree', () => {
    const tree = SKILL_TREES[TREE_CATEGORIES.MAGE];
    assert.ok(tree);
    assert.strictEqual(tree.name, 'Mage');
    assert.ok(tree.skills.fireball);
    assert.ok(tree.skills['ice-shard']);
  });

  it('should have rogue tree', () => {
    const tree = SKILL_TREES[TREE_CATEGORIES.ROGUE];
    assert.ok(tree);
    assert.strictEqual(tree.name, 'Rogue');
    assert.ok(tree.skills.backstab);
  });

  it('should have healer tree', () => {
    const tree = SKILL_TREES[TREE_CATEGORIES.HEALER];
    assert.ok(tree);
    assert.strictEqual(tree.name, 'Healer');
    assert.ok(tree.skills.heal);
  });

  it('should have required fields for all skills', () => {
    for (const [treeName, tree] of Object.entries(SKILL_TREES)) {
      for (const [skillId, skill] of Object.entries(tree.skills)) {
        assert.ok(skill.id, `${treeName}:${skillId} missing id`);
        assert.ok(skill.name, `${treeName}:${skillId} missing name`);
        assert.ok(skill.icon, `${treeName}:${skillId} missing icon`);
        assert.ok(skill.type, `${treeName}:${skillId} missing type`);
        assert.ok(typeof skill.tier === 'number', `${treeName}:${skillId} missing tier`);
        assert.ok(typeof skill.maxRank === 'number', `${treeName}:${skillId} missing maxRank`);
        assert.ok(typeof skill.cost === 'number', `${treeName}:${skillId} missing cost`);
        assert.ok(Array.isArray(skill.requires), `${treeName}:${skillId} missing requires`);
        assert.ok(Array.isArray(skill.effects), `${treeName}:${skillId} missing effects`);
        assert.strictEqual(skill.effects.length, skill.maxRank, `${treeName}:${skillId} effects count mismatch`);
      }
    }
  });
});

describe('createSkillTreeState', () => {
  it('should create default state', () => {
    const state = createSkillTreeState();
    assert.strictEqual(state.skillPoints, 0);
    assert.strictEqual(state.totalPointsSpent, 0);
    assert.deepStrictEqual(state.unlockedSkills, {});
    assert.strictEqual(state.primaryTree, null);
  });

  it('should create state with primary tree', () => {
    const state = createSkillTreeState(TREE_CATEGORIES.WARRIOR);
    assert.strictEqual(state.primaryTree, TREE_CATEGORIES.WARRIOR);
  });
});

describe('getSkillTreeData', () => {
  it('should return tree data for valid category', () => {
    const tree = getSkillTreeData(TREE_CATEGORIES.WARRIOR);
    assert.ok(tree);
    assert.strictEqual(tree.name, 'Warrior');
  });

  it('should return null for invalid category', () => {
    const tree = getSkillTreeData('invalid');
    assert.strictEqual(tree, null);
  });
});

describe('getSkillData', () => {
  it('should return skill data for valid skill', () => {
    const skill = getSkillData(TREE_CATEGORIES.WARRIOR, 'power-strike');
    assert.ok(skill);
    assert.strictEqual(skill.name, 'Power Strike');
  });

  it('should return null for invalid skill', () => {
    const skill = getSkillData(TREE_CATEGORIES.WARRIOR, 'invalid-skill');
    assert.strictEqual(skill, null);
  });

  it('should return null for invalid tree', () => {
    const skill = getSkillData('invalid', 'power-strike');
    assert.strictEqual(skill, null);
  });
});

describe('isSkillUnlocked', () => {
  it('should return false for locked skill', () => {
    const state = createSkillTreeState();
    assert.ok(!isSkillUnlocked(state, TREE_CATEGORIES.WARRIOR, 'power-strike'));
  });

  it('should return true for unlocked skill', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: { 'warrior:power-strike': 1 },
    };
    assert.ok(isSkillUnlocked(state, TREE_CATEGORIES.WARRIOR, 'power-strike'));
  });

  it('should handle null state', () => {
    assert.ok(!isSkillUnlocked(null, TREE_CATEGORIES.WARRIOR, 'power-strike'));
  });
});

describe('getSkillRank', () => {
  it('should return 0 for unlearned skill', () => {
    const state = createSkillTreeState();
    assert.strictEqual(getSkillRank(state, TREE_CATEGORIES.WARRIOR, 'power-strike'), 0);
  });

  it('should return current rank', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: { 'warrior:power-strike': 3 },
    };
    assert.strictEqual(getSkillRank(state, TREE_CATEGORIES.WARRIOR, 'power-strike'), 3);
  });
});

describe('canUnlockSkill', () => {
  it('should allow unlocking tier 1 skill with points', () => {
    const state = addSkillPoints(createSkillTreeState(), 5);
    const result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    assert.ok(result.canUnlock);
  });

  it('should not allow unlocking without enough points', () => {
    const state = createSkillTreeState();
    const result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    assert.ok(!result.canUnlock);
    assert.strictEqual(result.reason, 'insufficient_points');
  });

  it('should not allow unlocking maxed skill', () => {
    const state = {
      ...addSkillPoints(createSkillTreeState(), 10),
      unlockedSkills: { 'warrior:power-strike': 5 },
    };
    const result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    assert.ok(!result.canUnlock);
    assert.strictEqual(result.reason, 'max_rank');
  });

  it('should not allow unlocking without prerequisites', () => {
    const state = addSkillPoints(createSkillTreeState(), 10);
    const result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'cleave');
    assert.ok(!result.canUnlock);
    assert.strictEqual(result.reason, 'missing_prerequisite');
    assert.strictEqual(result.missingSkill, 'power-strike');
  });

  it('should allow unlocking when prerequisites met', () => {
    const state = {
      ...addSkillPoints(createSkillTreeState(), 10),
      unlockedSkills: { 'warrior:power-strike': 1 },
    };
    const result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'cleave');
    assert.ok(result.canUnlock);
  });

  it('should return invalid_skill for bad skill', () => {
    const state = addSkillPoints(createSkillTreeState(), 10);
    const result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'invalid');
    assert.ok(!result.canUnlock);
    assert.strictEqual(result.reason, 'invalid_skill');
  });
});

describe('unlockSkill', () => {
  it('should unlock skill and deduct points', () => {
    const state = addSkillPoints(createSkillTreeState(), 5);
    const result = unlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    
    assert.ok(result.success);
    assert.strictEqual(result.newRank, 1);
    assert.strictEqual(result.state.skillPoints, 4);
    assert.strictEqual(result.state.totalPointsSpent, 1);
    assert.strictEqual(getSkillRank(result.state, TREE_CATEGORIES.WARRIOR, 'power-strike'), 1);
  });

  it('should upgrade skill rank', () => {
    let state = {
      ...addSkillPoints(createSkillTreeState(), 10),
      unlockedSkills: { 'warrior:power-strike': 2 },
    };
    const result = unlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    
    assert.ok(result.success);
    assert.strictEqual(result.newRank, 3);
  });

  it('should fail when cannot unlock', () => {
    const state = createSkillTreeState();
    const result = unlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    
    assert.ok(!result.success);
    assert.strictEqual(result.reason, 'insufficient_points');
  });
});

describe('addSkillPoints', () => {
  it('should add skill points', () => {
    const state = createSkillTreeState();
    const newState = addSkillPoints(state, 5);
    assert.strictEqual(newState.skillPoints, 5);
  });

  it('should not add negative points', () => {
    const state = addSkillPoints(createSkillTreeState(), 5);
    const newState = addSkillPoints(state, -3);
    assert.strictEqual(newState.skillPoints, 5);
  });

  it('should handle null state', () => {
    const result = addSkillPoints(null, 5);
    assert.strictEqual(result, null);
  });
});

describe('getSkillEffect', () => {
  it('should return effect at current rank', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: { 'warrior:power-strike': 2 },
    };
    const effect = getSkillEffect(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    assert.ok(effect);
    assert.strictEqual(effect.rank, 2);
    assert.strictEqual(effect.damage, 140);
  });

  it('should return null for unlearned skill', () => {
    const state = createSkillTreeState();
    const effect = getSkillEffect(state, TREE_CATEGORIES.WARRIOR, 'power-strike');
    assert.strictEqual(effect, null);
  });

  it('should return null for invalid skill', () => {
    const state = createSkillTreeState();
    const effect = getSkillEffect(state, TREE_CATEGORIES.WARRIOR, 'invalid');
    assert.strictEqual(effect, null);
  });
});

describe('getAllUnlockedSkills', () => {
  it('should return empty array for no skills', () => {
    const state = createSkillTreeState();
    const skills = getAllUnlockedSkills(state);
    assert.deepStrictEqual(skills, []);
  });

  it('should return unlocked skills with data', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: {
        'warrior:power-strike': 2,
        'warrior:tough-skin': 1,
      },
    };
    const skills = getAllUnlockedSkills(state);
    assert.strictEqual(skills.length, 2);
    assert.ok(skills.some(s => s.skillId === 'power-strike'));
    assert.ok(skills.some(s => s.skillId === 'tough-skin'));
  });
});

describe('getActiveSkills', () => {
  it('should return only active/ultimate skills', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: {
        'warrior:power-strike': 1, // active
        'warrior:tough-skin': 1,   // passive
        'warrior:battle-shout': 1, // buff
      },
    };
    const active = getActiveSkills(state);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].skillId, 'power-strike');
  });
});

describe('getPassiveSkills', () => {
  it('should return only passive skills', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: {
        'warrior:power-strike': 1, // active
        'warrior:tough-skin': 1,   // passive
      },
    };
    const passives = getPassiveSkills(state);
    assert.strictEqual(passives.length, 1);
    assert.strictEqual(passives[0].skillId, 'tough-skin');
  });
});

describe('calculatePassiveBonuses', () => {
  it('should return empty object for no passives', () => {
    const state = createSkillTreeState();
    const bonuses = calculatePassiveBonuses(state);
    assert.deepStrictEqual(bonuses, {});
  });

  it('should calculate defense bonus', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: { 'warrior:tough-skin': 2 },
    };
    const bonuses = calculatePassiveBonuses(state);
    assert.strictEqual(bonuses.defenseBonus, 10);
  });

  it('should combine multiple passives', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: {
        'warrior:tough-skin': 3,
        'warrior:weapon-mastery': 2,
      },
    };
    const bonuses = calculatePassiveBonuses(state);
    assert.strictEqual(bonuses.defenseBonus, 15);
    assert.strictEqual(bonuses.attackPercent, 0.08);
  });
});

describe('applyPassivesToStats', () => {
  it('should apply flat defense bonus', () => {
    const baseStats = { defense: 50 };
    const bonuses = { defenseBonus: 15 };
    const modified = applyPassivesToStats(baseStats, bonuses);
    assert.strictEqual(modified.defense, 65);
  });

  it('should apply percentage attack bonus', () => {
    const baseStats = { attack: 100 };
    const bonuses = { attackPercent: 0.2 };
    const modified = applyPassivesToStats(baseStats, bonuses);
    assert.strictEqual(modified.attack, 120);
  });

  it('should apply MP bonus', () => {
    const baseStats = { maxMp: 100 };
    const bonuses = { mpBonus: 40 };
    const modified = applyPassivesToStats(baseStats, bonuses);
    assert.strictEqual(modified.maxMp, 140);
  });

  it('should apply crit chance bonus', () => {
    const baseStats = { critChance: 0.1 };
    const bonuses = { critChance: 0.1 };
    const modified = applyPassivesToStats(baseStats, bonuses);
    assert.ok(Math.abs(modified.critChance - 0.2) < 0.001);
  });

  it('should handle null base stats', () => {
    const result = applyPassivesToStats(null, {});
    assert.strictEqual(result, null);
  });
});

describe('getTreeProgress', () => {
  it('should return found: false for invalid tree', () => {
    const state = createSkillTreeState();
    const progress = getTreeProgress(state, 'invalid');
    assert.strictEqual(progress.found, false);
  });

  it('should return progress for valid tree', () => {
    const state = {
      ...createSkillTreeState(),
      unlockedSkills: {
        'warrior:power-strike': 3,
        'warrior:tough-skin': 1,
      },
    };
    const progress = getTreeProgress(state, TREE_CATEGORIES.WARRIOR);
    assert.strictEqual(progress.found, true);
    assert.strictEqual(progress.unlockedCount, 2);
    assert.strictEqual(progress.currentRanks, 4);
    assert.ok(progress.percentComplete >= 0 && progress.percentComplete <= 100);
  });
});

describe('resetSkillTree', () => {
  it('should reset specific tree', () => {
    const state = {
      skillPoints: 5,
      totalPointsSpent: 10,
      unlockedSkills: {
        'warrior:power-strike': 3,
        'warrior:tough-skin': 2,
        'mage:fireball': 2,
      },
    };
    
    const result = resetSkillTree(state, TREE_CATEGORIES.WARRIOR);
    
    assert.ok(result.skillPoints > 5); // Refunded
    assert.ok(!result.unlockedSkills['warrior:power-strike']);
    assert.ok(!result.unlockedSkills['warrior:tough-skin']);
    assert.strictEqual(result.unlockedSkills['mage:fireball'], 2); // Kept
  });

  it('should reset all trees when category is null', () => {
    const state = {
      skillPoints: 0,
      totalPointsSpent: 10,
      unlockedSkills: {
        'warrior:power-strike': 2,
        'mage:fireball': 3,
      },
    };
    
    const result = resetSkillTree(state, null);
    
    assert.deepStrictEqual(result.unlockedSkills, {});
    assert.ok(result.skillPoints > 0);
  });

  it('should handle null state', () => {
    const result = resetSkillTree(null);
    assert.ok(result);
    assert.strictEqual(result.skillPoints, 0);
  });
});

describe('getAllTreeCategories', () => {
  it('should return all categories', () => {
    const categories = getAllTreeCategories();
    assert.ok(Array.isArray(categories));
    assert.ok(categories.includes(TREE_CATEGORIES.WARRIOR));
    assert.ok(categories.includes(TREE_CATEGORIES.MAGE));
    assert.ok(categories.includes(TREE_CATEGORIES.ROGUE));
    assert.ok(categories.includes(TREE_CATEGORIES.HEALER));
  });
});

describe('getAllSkillTrees', () => {
  it('should return all skill trees', () => {
    const trees = getAllSkillTrees();
    assert.ok(trees);
    assert.ok(trees[TREE_CATEGORIES.WARRIOR]);
    assert.ok(trees[TREE_CATEGORIES.MAGE]);
  });
});

describe('UI Components', () => {
  describe('getSkillTreeStyles', () => {
    it('should return CSS styles', () => {
      const styles = getSkillTreeStyles();
      assert.ok(typeof styles === 'string');
      assert.ok(styles.includes('.skill-tree-container'));
      assert.ok(styles.includes('.skill-node'));
    });
  });

  describe('renderSkillTreeTabs', () => {
    it('should render tabs for all trees', () => {
      const html = renderSkillTreeTabs(TREE_CATEGORIES.WARRIOR);
      assert.ok(html.includes('skill-tree-tabs'));
      assert.ok(html.includes('Warrior'));
      assert.ok(html.includes('Mage'));
    });

    it('should mark active tab', () => {
      const html = renderSkillTreeTabs(TREE_CATEGORIES.WARRIOR);
      assert.ok(html.includes('active'));
    });
  });

  describe('renderSkillTree', () => {
    it('should render tree structure', () => {
      const state = addSkillPoints(createSkillTreeState(), 5);
      const html = renderSkillTree(state, TREE_CATEGORIES.WARRIOR);
      assert.ok(html.includes('skill-tree-container'));
      assert.ok(html.includes('Warrior'));
      assert.ok(html.includes('skill-node'));
    });

    it('should show skill points', () => {
      const state = addSkillPoints(createSkillTreeState(), 10);
      const html = renderSkillTree(state, TREE_CATEGORIES.WARRIOR);
      assert.ok(html.includes('10 Points'));
    });

    it('should handle invalid tree', () => {
      const state = createSkillTreeState();
      const html = renderSkillTree(state, 'invalid');
      assert.ok(html.includes('Tree not found'));
    });
  });

  describe('renderPassiveBonuses', () => {
    it('should return empty for no passives', () => {
      const state = createSkillTreeState();
      const html = renderPassiveBonuses(state);
      assert.strictEqual(html, '');
    });

    it('should render passive bonuses', () => {
      const state = {
        ...createSkillTreeState(),
        unlockedSkills: { 'warrior:tough-skin': 2 },
      };
      const html = renderPassiveBonuses(state);
      assert.ok(html.includes('Passive Bonuses'));
      assert.ok(html.includes('DEF'));
    });
  });

  describe('renderSkillUnlockNotice', () => {
    it('should render unlock notice', () => {
      const html = renderSkillUnlockNotice('Power Strike', 1, 5);
      assert.ok(html.includes('Power Strike'));
      assert.ok(html.includes('Unlocked!'));
      assert.ok(html.includes('1/5'));
    });

    it('should show mastered for max rank', () => {
      const html = renderSkillUnlockNotice('Power Strike', 5, 5);
      assert.ok(html.includes('Mastered!'));
    });
  });

  describe('renderCombatSkillList', () => {
    it('should render available combat skills', () => {
      const state = {
        ...createSkillTreeState(),
        unlockedSkills: {
          'warrior:power-strike': 2,
          'warrior:tough-skin': 1,
        },
      };
      const html = renderCombatSkillList(state);
      assert.ok(html.includes('Power Strike'));
      assert.ok(!html.includes('Tough Skin'));
    });

    it('should show no skills message', () => {
      const state = createSkillTreeState();
      const html = renderCombatSkillList(state);
      assert.ok(html.includes('No skills available'));
    });
  });

  describe('renderTreesSummary', () => {
    it('should render summary for all trees', () => {
      const state = {
        ...createSkillTreeState(),
        unlockedSkills: { 'warrior:power-strike': 2 },
      };
      const html = renderTreesSummary(state);
      assert.ok(html.includes('Warrior'));
      assert.ok(html.includes('Mage'));
    });
  });
});

describe('Security Tests', () => {
  it('should not contain banned words in tree names', () => {
    for (const [category, tree] of Object.entries(SKILL_TREES)) {
      for (const banned of BANNED_WORDS) {
        assert.ok(
          !tree.name.toLowerCase().includes(banned),
          `Tree ${category} name contains banned word "${banned}"`
        );
      }
    }
  });

  it('should not contain banned words in tree descriptions', () => {
    for (const [category, tree] of Object.entries(SKILL_TREES)) {
      for (const banned of BANNED_WORDS) {
        assert.ok(
          !tree.description.toLowerCase().includes(banned),
          `Tree ${category} description contains banned word "${banned}"`
        );
      }
    }
  });

  it('should not contain banned words in skill names', () => {
    for (const [category, tree] of Object.entries(SKILL_TREES)) {
      for (const [skillId, skill] of Object.entries(tree.skills)) {
        for (const banned of BANNED_WORDS) {
          assert.ok(
            !skill.name.toLowerCase().includes(banned),
            `Skill ${skillId} name contains banned word "${banned}"`
          );
        }
      }
    }
  });

  it('should not contain banned words in skill IDs', () => {
    for (const [category, tree] of Object.entries(SKILL_TREES)) {
      for (const skillId of Object.keys(tree.skills)) {
        for (const banned of BANNED_WORDS) {
          assert.ok(
            !skillId.toLowerCase().includes(banned),
            `Skill ID "${skillId}" contains banned word "${banned}"`
          );
        }
      }
    }
  });

  it('should not contain banned words in skill descriptions', () => {
    for (const [category, tree] of Object.entries(SKILL_TREES)) {
      for (const [skillId, skill] of Object.entries(tree.skills)) {
        for (const banned of BANNED_WORDS) {
          assert.ok(
            !skill.description.toLowerCase().includes(banned),
            `Skill ${skillId} description contains banned word "${banned}"`
          );
        }
      }
    }
  });

  it('should escape HTML in UI rendering', () => {
    const state = addSkillPoints(createSkillTreeState(), 5);
    const html = renderSkillTree(state, TREE_CATEGORIES.WARRIOR);
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('javascript:'));
  });
});

describe('Edge Cases', () => {
  it('should handle undefined state gracefully', () => {
    assert.doesNotThrow(() => {
      isSkillUnlocked(undefined, TREE_CATEGORIES.WARRIOR, 'power-strike');
      getSkillRank(undefined, TREE_CATEGORIES.WARRIOR, 'power-strike');
      getAllUnlockedSkills(undefined);
      calculatePassiveBonuses(undefined);
    });
  });

  it('should handle empty unlockedSkills', () => {
    const state = { skillPoints: 5, unlockedSkills: {} };
    const skills = getAllUnlockedSkills(state);
    assert.deepStrictEqual(skills, []);
  });

  it('should handle skill with multiple prerequisites', () => {
    const state = addSkillPoints(createSkillTreeState(), 20);
    
    // Execute requires cleave AND weapon-mastery
    let result = canUnlockSkill(state, TREE_CATEGORIES.WARRIOR, 'execute');
    assert.ok(!result.canUnlock);
    
    // Unlock prerequisites
    let newState = unlockSkill(state, TREE_CATEGORIES.WARRIOR, 'power-strike').state;
    newState = unlockSkill(newState, TREE_CATEGORIES.WARRIOR, 'cleave').state;
    newState = unlockSkill(newState, TREE_CATEGORIES.WARRIOR, 'weapon-mastery').state;
    
    result = canUnlockSkill(newState, TREE_CATEGORIES.WARRIOR, 'execute');
    assert.ok(result.canUnlock);
  });
});
