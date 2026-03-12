/**
 * Tests for Difficulty Settings Module
 * Created by Claude Opus 4.5 (Day 345)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_NAMES,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_DIFFICULTY,
  getDifficultyName,
  getDifficultyDescription,
  getDifficultyMultipliers,
  applyDifficultyToEnemyHp,
  applyDifficultyToEnemyDamage,
  applyDifficultyToXpReward,
  applyDifficultyToGoldReward,
  isValidDifficulty,
  getAllDifficultyLevels,
  getDifficultyIcon,
  getDifficultyColor,
} from '../src/difficulty.js';

describe('Difficulty Settings Module', () => {
  describe('DIFFICULTY_LEVELS', () => {
    it('should have four difficulty levels', () => {
      const levels = Object.values(DIFFICULTY_LEVELS);
      assert.strictEqual(levels.length, 4);
    });

    it('should include easy, normal, hard, and nightmare', () => {
      assert.strictEqual(DIFFICULTY_LEVELS.EASY, 'easy');
      assert.strictEqual(DIFFICULTY_LEVELS.NORMAL, 'normal');
      assert.strictEqual(DIFFICULTY_LEVELS.HARD, 'hard');
      assert.strictEqual(DIFFICULTY_LEVELS.NIGHTMARE, 'nightmare');
    });
  });

  describe('DEFAULT_DIFFICULTY', () => {
    it('should default to normal', () => {
      assert.strictEqual(DEFAULT_DIFFICULTY, DIFFICULTY_LEVELS.NORMAL);
    });
  });

  describe('getDifficultyName', () => {
    it('should return correct name for easy', () => {
      assert.strictEqual(getDifficultyName(DIFFICULTY_LEVELS.EASY), 'Easy');
    });

    it('should return correct name for normal', () => {
      assert.strictEqual(getDifficultyName(DIFFICULTY_LEVELS.NORMAL), 'Normal');
    });

    it('should return correct name for hard', () => {
      assert.strictEqual(getDifficultyName(DIFFICULTY_LEVELS.HARD), 'Hard');
    });

    it('should return correct name for nightmare', () => {
      assert.strictEqual(getDifficultyName(DIFFICULTY_LEVELS.NIGHTMARE), 'Nightmare');
    });

    it('should return default name for invalid difficulty', () => {
      assert.strictEqual(getDifficultyName('invalid'), 'Normal');
    });
  });

  describe('getDifficultyDescription', () => {
    it('should return description for each level', () => {
      Object.values(DIFFICULTY_LEVELS).forEach(level => {
        const desc = getDifficultyDescription(level);
        assert.ok(typeof desc === 'string');
        assert.ok(desc.length > 0);
      });
    });

    it('should return default description for invalid difficulty', () => {
      const desc = getDifficultyDescription('invalid');
      assert.strictEqual(desc, DIFFICULTY_DESCRIPTIONS[DEFAULT_DIFFICULTY]);
    });
  });

  describe('getDifficultyMultipliers', () => {
    it('should return multipliers with all required keys', () => {
      Object.values(DIFFICULTY_LEVELS).forEach(level => {
        const mult = getDifficultyMultipliers(level);
        assert.ok('enemyDamage' in mult);
        assert.ok('enemyHp' in mult);
        assert.ok('xpReward' in mult);
        assert.ok('goldReward' in mult);
      });
    });

    it('should return 1.0 for all normal multipliers', () => {
      const mult = getDifficultyMultipliers(DIFFICULTY_LEVELS.NORMAL);
      assert.strictEqual(mult.enemyDamage, 1.0);
      assert.strictEqual(mult.enemyHp, 1.0);
      assert.strictEqual(mult.xpReward, 1.0);
      assert.strictEqual(mult.goldReward, 1.0);
    });

    it('should return reduced enemy stats for easy', () => {
      const mult = getDifficultyMultipliers(DIFFICULTY_LEVELS.EASY);
      assert.ok(mult.enemyDamage < 1.0);
      assert.ok(mult.enemyHp < 1.0);
    });

    it('should return increased enemy stats for hard', () => {
      const mult = getDifficultyMultipliers(DIFFICULTY_LEVELS.HARD);
      assert.ok(mult.enemyDamage > 1.0);
      assert.ok(mult.enemyHp > 1.0);
    });

    it('should return increased rewards for hard', () => {
      const mult = getDifficultyMultipliers(DIFFICULTY_LEVELS.HARD);
      assert.ok(mult.xpReward > 1.0);
      assert.ok(mult.goldReward > 1.0);
    });

    it('should return highest multipliers for nightmare', () => {
      const nightmare = getDifficultyMultipliers(DIFFICULTY_LEVELS.NIGHTMARE);
      const hard = getDifficultyMultipliers(DIFFICULTY_LEVELS.HARD);
      assert.ok(nightmare.enemyDamage > hard.enemyDamage);
      assert.ok(nightmare.enemyHp > hard.enemyHp);
      assert.ok(nightmare.xpReward > hard.xpReward);
    });

    it('should return default multipliers for invalid difficulty', () => {
      const mult = getDifficultyMultipliers('invalid');
      assert.deepStrictEqual(mult, DIFFICULTY_MULTIPLIERS[DEFAULT_DIFFICULTY]);
    });
  });

  describe('applyDifficultyToEnemyHp', () => {
    it('should reduce HP on easy difficulty', () => {
      const baseHp = 100;
      const adjusted = applyDifficultyToEnemyHp(baseHp, DIFFICULTY_LEVELS.EASY);
      assert.ok(adjusted < baseHp);
      assert.strictEqual(adjusted, 80); // 0.80 multiplier
    });

    it('should keep HP unchanged on normal', () => {
      const baseHp = 100;
      const adjusted = applyDifficultyToEnemyHp(baseHp, DIFFICULTY_LEVELS.NORMAL);
      assert.strictEqual(adjusted, baseHp);
    });

    it('should increase HP on hard', () => {
      const baseHp = 100;
      const adjusted = applyDifficultyToEnemyHp(baseHp, DIFFICULTY_LEVELS.HARD);
      assert.ok(adjusted > baseHp);
      assert.strictEqual(adjusted, 125); // 1.25 multiplier
    });

    it('should increase HP significantly on nightmare', () => {
      const baseHp = 100;
      const adjusted = applyDifficultyToEnemyHp(baseHp, DIFFICULTY_LEVELS.NIGHTMARE);
      assert.strictEqual(adjusted, 150); // 1.50 multiplier
    });

    it('should round results', () => {
      const baseHp = 33;
      const adjusted = applyDifficultyToEnemyHp(baseHp, DIFFICULTY_LEVELS.EASY);
      assert.strictEqual(adjusted, Math.round(33 * 0.80));
    });
  });

  describe('applyDifficultyToEnemyDamage', () => {
    it('should reduce damage on easy', () => {
      const baseDmg = 40;
      const adjusted = applyDifficultyToEnemyDamage(baseDmg, DIFFICULTY_LEVELS.EASY);
      assert.strictEqual(adjusted, 30); // 0.75 multiplier
    });

    it('should keep damage unchanged on normal', () => {
      const baseDmg = 40;
      const adjusted = applyDifficultyToEnemyDamage(baseDmg, DIFFICULTY_LEVELS.NORMAL);
      assert.strictEqual(adjusted, baseDmg);
    });

    it('should increase damage on hard', () => {
      const baseDmg = 40;
      const adjusted = applyDifficultyToEnemyDamage(baseDmg, DIFFICULTY_LEVELS.HARD);
      assert.strictEqual(adjusted, 50); // 1.25 multiplier
    });

    it('should increase damage on nightmare', () => {
      const baseDmg = 40;
      const adjusted = applyDifficultyToEnemyDamage(baseDmg, DIFFICULTY_LEVELS.NIGHTMARE);
      assert.strictEqual(adjusted, 60); // 1.50 multiplier
    });
  });

  describe('applyDifficultyToXpReward', () => {
    it('should keep XP unchanged on easy', () => {
      const baseXp = 100;
      const adjusted = applyDifficultyToXpReward(baseXp, DIFFICULTY_LEVELS.EASY);
      assert.strictEqual(adjusted, 100);
    });

    it('should keep XP unchanged on normal', () => {
      const baseXp = 100;
      const adjusted = applyDifficultyToXpReward(baseXp, DIFFICULTY_LEVELS.NORMAL);
      assert.strictEqual(adjusted, 100);
    });

    it('should increase XP on hard', () => {
      const baseXp = 100;
      const adjusted = applyDifficultyToXpReward(baseXp, DIFFICULTY_LEVELS.HARD);
      assert.strictEqual(adjusted, 120); // 1.20 multiplier
    });

    it('should increase XP significantly on nightmare', () => {
      const baseXp = 100;
      const adjusted = applyDifficultyToXpReward(baseXp, DIFFICULTY_LEVELS.NIGHTMARE);
      assert.strictEqual(adjusted, 150); // 1.50 multiplier
    });
  });

  describe('applyDifficultyToGoldReward', () => {
    it('should keep gold unchanged on easy', () => {
      const baseGold = 50;
      const adjusted = applyDifficultyToGoldReward(baseGold, DIFFICULTY_LEVELS.EASY);
      assert.strictEqual(adjusted, 50);
    });

    it('should keep gold unchanged on normal', () => {
      const baseGold = 50;
      const adjusted = applyDifficultyToGoldReward(baseGold, DIFFICULTY_LEVELS.NORMAL);
      assert.strictEqual(adjusted, 50);
    });

    it('should increase gold on hard', () => {
      const baseGold = 50;
      const adjusted = applyDifficultyToGoldReward(baseGold, DIFFICULTY_LEVELS.HARD);
      assert.strictEqual(adjusted, 60); // 1.20 multiplier
    });

    it('should increase gold significantly on nightmare', () => {
      const baseGold = 50;
      const adjusted = applyDifficultyToGoldReward(baseGold, DIFFICULTY_LEVELS.NIGHTMARE);
      assert.strictEqual(adjusted, 75); // 1.50 multiplier
    });
  });

  describe('isValidDifficulty', () => {
    it('should return true for all valid difficulties', () => {
      Object.values(DIFFICULTY_LEVELS).forEach(level => {
        assert.strictEqual(isValidDifficulty(level), true);
      });
    });

    it('should return false for invalid difficulties', () => {
      assert.strictEqual(isValidDifficulty('invalid'), false);
      assert.strictEqual(isValidDifficulty(''), false);
      assert.strictEqual(isValidDifficulty(null), false);
      assert.strictEqual(isValidDifficulty(undefined), false);
      assert.strictEqual(isValidDifficulty(123), false);
    });
  });

  describe('getAllDifficultyLevels', () => {
    it('should return array of all difficulty levels', () => {
      const levels = getAllDifficultyLevels();
      assert.strictEqual(Array.isArray(levels), true);
      assert.strictEqual(levels.length, 4);
    });

    it('should include id, name, description, and multipliers for each level', () => {
      const levels = getAllDifficultyLevels();
      levels.forEach(level => {
        assert.ok('id' in level);
        assert.ok('name' in level);
        assert.ok('description' in level);
        assert.ok('multipliers' in level);
      });
    });

    it('should have levels in correct order', () => {
      const levels = getAllDifficultyLevels();
      assert.strictEqual(levels[0].id, 'easy');
      assert.strictEqual(levels[1].id, 'normal');
      assert.strictEqual(levels[2].id, 'hard');
      assert.strictEqual(levels[3].id, 'nightmare');
    });
  });

  describe('getDifficultyIcon', () => {
    it('should return emoji for each difficulty', () => {
      assert.strictEqual(getDifficultyIcon(DIFFICULTY_LEVELS.EASY), '🌱');
      assert.strictEqual(getDifficultyIcon(DIFFICULTY_LEVELS.NORMAL), '⚔️');
      assert.strictEqual(getDifficultyIcon(DIFFICULTY_LEVELS.HARD), '🔥');
      assert.strictEqual(getDifficultyIcon(DIFFICULTY_LEVELS.NIGHTMARE), '💀');
    });

    it('should return default icon for invalid difficulty', () => {
      assert.strictEqual(getDifficultyIcon('invalid'), '⚔️');
    });
  });

  describe('getDifficultyColor', () => {
    it('should return hex color for each difficulty', () => {
      Object.values(DIFFICULTY_LEVELS).forEach(level => {
        const color = getDifficultyColor(level);
        assert.ok(typeof color === 'string');
        assert.ok(color.startsWith('#'));
      });
    });

    it('should return green for easy', () => {
      assert.strictEqual(getDifficultyColor(DIFFICULTY_LEVELS.EASY), '#4ade80');
    });

    it('should return blue for normal', () => {
      assert.strictEqual(getDifficultyColor(DIFFICULTY_LEVELS.NORMAL), '#60a5fa');
    });

    it('should return orange for hard', () => {
      assert.strictEqual(getDifficultyColor(DIFFICULTY_LEVELS.HARD), '#f97316');
    });

    it('should return red for nightmare', () => {
      assert.strictEqual(getDifficultyColor(DIFFICULTY_LEVELS.NIGHTMARE), '#ef4444');
    });
  });
});
