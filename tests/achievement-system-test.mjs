/**
 * Achievement System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_TYPES,
  REWARD_TYPES,
  initAchievementState,
  registerAchievement,
  updateProgress,
  setProgress,
  unlockAchievement,
  isUnlocked,
  getProgress,
  getAchievementsByCategory,
  getUnlockedAchievements,
  getLockedAchievements,
  getRecentUnlocks,
  getAchievementStats,
  getTotalPoints,
  getAchievement,
  getAchievementsByTier,
  checkAchievements,
  resetProgress,
  getAvailableRewards,
  getCategorySummary,
  getAllCategorySummaries
} from '../src/achievement-system.js';

import {
  renderAchievementCard,
  renderAchievementList,
  renderCategoryTabs,
  renderCategorySummary,
  renderAllCategorySummaries,
  renderAchievementStats,
  renderRecentUnlocks,
  renderUnlockNotification,
  renderPointsDisplay,
  renderTierFilter,
  renderProgressBar,
  renderCompletionOverview,
  renderAchievementDetails
} from '../src/achievement-system-ui.js';

describe('Achievement System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initAchievementState(state);
    state = result.state;
  });

  describe('ACHIEVEMENT_CATEGORIES', () => {
    it('has all categories', () => {
      assert.ok(ACHIEVEMENT_CATEGORIES.COMBAT);
      assert.ok(ACHIEVEMENT_CATEGORIES.EXPLORATION);
      assert.ok(ACHIEVEMENT_CATEGORIES.COLLECTION);
      assert.ok(ACHIEVEMENT_CATEGORIES.SOCIAL);
    });
  });

  describe('ACHIEVEMENT_TIERS', () => {
    it('has ascending points', () => {
      assert.ok(ACHIEVEMENT_TIERS.BRONZE.points < ACHIEVEMENT_TIERS.SILVER.points);
      assert.ok(ACHIEVEMENT_TIERS.SILVER.points < ACHIEVEMENT_TIERS.GOLD.points);
      assert.ok(ACHIEVEMENT_TIERS.GOLD.points < ACHIEVEMENT_TIERS.PLATINUM.points);
    });
  });

  describe('initAchievementState', () => {
    it('creates initial state', () => {
      assert.ok(state.achievements);
      assert.deepStrictEqual(state.achievements.definitions, {});
      assert.strictEqual(state.achievements.points, 0);
    });
  });

  describe('registerAchievement', () => {
    it('registers achievement', () => {
      const result = registerAchievement(state, {
        id: 'first_kill',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        category: 'combat',
        tier: 'bronze'
      });
      assert.ok(result.success);
      assert.ok(result.state.achievements.definitions['first_kill']);
    });

    it('fails without id', () => {
      const result = registerAchievement(state, { name: 'Test' });
      assert.ok(!result.success);
    });

    it('fails for duplicate', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      const result = registerAchievement(state, { id: 'a1', name: 'Duplicate' });
      assert.ok(!result.success);
    });
  });

  describe('updateProgress', () => {
    it('updates progress', () => {
      state = registerAchievement(state, {
        id: 'kills_10',
        name: '10 Kills',
        type: 'counter',
        target: 10
      }).state;
      const result = updateProgress(state, 'kills_10', 5);
      assert.ok(result.success);
      assert.strictEqual(result.progress, 5);
    });

    it('unlocks when target reached', () => {
      state = registerAchievement(state, {
        id: 'kills_10',
        name: '10 Kills',
        type: 'counter',
        target: 10
      }).state;
      const result = updateProgress(state, 'kills_10', 10);
      assert.ok(result.success);
      assert.ok(result.state.achievements.unlocked['kills_10']);
    });
  });

  describe('setProgress', () => {
    it('sets absolute progress', () => {
      state = registerAchievement(state, {
        id: 'level_50',
        name: 'Level 50',
        type: 'counter',
        target: 50
      }).state;
      const result = setProgress(state, 'level_50', 25);
      assert.ok(result.success);
      assert.strictEqual(result.progress, 25);
    });
  });

  describe('unlockAchievement', () => {
    it('unlocks achievement', () => {
      state = registerAchievement(state, {
        id: 'first_login',
        name: 'First Login',
        tier: 'bronze'
      }).state;
      const result = unlockAchievement(state, 'first_login');
      assert.ok(result.success);
      assert.ok(result.state.achievements.unlocked['first_login']);
    });

    it('awards points', () => {
      state = registerAchievement(state, {
        id: 'gold_ach',
        name: 'Gold Achievement',
        tier: 'gold'
      }).state;
      const result = unlockAchievement(state, 'gold_ach');
      assert.strictEqual(result.points, 50);
      assert.strictEqual(result.state.achievements.points, 50);
    });

    it('fails for already unlocked', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = unlockAchievement(state, 'a1').state;
      const result = unlockAchievement(state, 'a1');
      assert.ok(!result.success);
    });

    it('checks prerequisite', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = registerAchievement(state, { id: 'a2', name: 'A2', prerequisite: 'a1' }).state;
      const result = unlockAchievement(state, 'a2');
      assert.ok(!result.success);
      assert.ok(result.error.includes('Prerequisite'));
    });
  });

  describe('isUnlocked', () => {
    it('returns false when locked', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      assert.strictEqual(isUnlocked(state, 'a1'), false);
    });

    it('returns true when unlocked', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = unlockAchievement(state, 'a1').state;
      assert.strictEqual(isUnlocked(state, 'a1'), true);
    });
  });

  describe('getProgress', () => {
    it('returns progress info', () => {
      state = registerAchievement(state, {
        id: 'kills',
        name: 'Kills',
        type: 'counter',
        target: 100
      }).state;
      state = updateProgress(state, 'kills', 25).state;
      const progress = getProgress(state, 'kills');
      assert.strictEqual(progress.current, 25);
      assert.strictEqual(progress.target, 100);
      assert.strictEqual(progress.percentage, 25);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('filters by category', () => {
      state = registerAchievement(state, { id: 'c1', name: 'Combat 1', category: 'combat' }).state;
      state = registerAchievement(state, { id: 'e1', name: 'Explore 1', category: 'exploration' }).state;
      const combat = getAchievementsByCategory(state, 'combat');
      assert.strictEqual(combat.length, 1);
      assert.strictEqual(combat[0].category, 'combat');
    });
  });

  describe('getUnlockedAchievements', () => {
    it('returns unlocked only', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = registerAchievement(state, { id: 'a2', name: 'A2' }).state;
      state = unlockAchievement(state, 'a1').state;
      const unlocked = getUnlockedAchievements(state);
      assert.strictEqual(unlocked.length, 1);
      assert.strictEqual(unlocked[0].id, 'a1');
    });
  });

  describe('getLockedAchievements', () => {
    it('returns locked only', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = registerAchievement(state, { id: 'a2', name: 'A2' }).state;
      state = unlockAchievement(state, 'a1').state;
      const locked = getLockedAchievements(state);
      assert.strictEqual(locked.length, 1);
      assert.strictEqual(locked[0].id, 'a2');
    });

    it('excludes hidden by default', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = registerAchievement(state, { id: 'h1', name: 'Hidden', hidden: true }).state;
      const locked = getLockedAchievements(state, false);
      assert.strictEqual(locked.length, 1);
    });
  });

  describe('getRecentUnlocks', () => {
    it('returns recent unlocks', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1' }).state;
      state = unlockAchievement(state, 'a1').state;
      const recent = getRecentUnlocks(state);
      assert.strictEqual(recent.length, 1);
    });
  });

  describe('getAchievementStats', () => {
    it('returns stats', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1', tier: 'gold' }).state;
      state = unlockAchievement(state, 'a1').state;
      const stats = getAchievementStats(state);
      assert.strictEqual(stats.totalUnlocked, 1);
      assert.strictEqual(stats.goldCount, 1);
      assert.strictEqual(stats.points, 50);
    });
  });

  describe('getTotalPoints', () => {
    it('returns total points', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1', tier: 'silver' }).state;
      state = unlockAchievement(state, 'a1').state;
      assert.strictEqual(getTotalPoints(state), 25);
    });
  });

  describe('getAchievement', () => {
    it('returns achievement with progress', () => {
      state = registerAchievement(state, {
        id: 'a1',
        name: 'A1',
        type: 'counter',
        target: 10
      }).state;
      state = updateProgress(state, 'a1', 5).state;
      const ach = getAchievement(state, 'a1');
      assert.strictEqual(ach.name, 'A1');
      assert.strictEqual(ach.progress, 5);
    });
  });

  describe('checkAchievements', () => {
    it('checks multiple achievements', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1', target: 10, type: 'counter' }).state;
      state = registerAchievement(state, { id: 'a2', name: 'A2' }).state;
      const result = checkAchievements(state, [
        { achievementId: 'a1', progress: 10 },
        { achievementId: 'a2' }
      ]);
      assert.ok(result.success);
      assert.ok(result.state.achievements.unlocked['a1']);
      assert.ok(result.state.achievements.unlocked['a2']);
    });
  });

  describe('resetProgress', () => {
    it('resets progress', () => {
      state = registerAchievement(state, { id: 'a1', name: 'A1', target: 10, type: 'counter' }).state;
      state = updateProgress(state, 'a1', 5).state;
      const result = resetProgress(state, 'a1');
      assert.ok(result.success);
      assert.strictEqual(result.state.achievements.progress['a1'], undefined);
    });
  });

  describe('getCategorySummary', () => {
    it('returns summary', () => {
      state = registerAchievement(state, { id: 'c1', name: 'C1', category: 'combat' }).state;
      state = registerAchievement(state, { id: 'c2', name: 'C2', category: 'combat' }).state;
      state = unlockAchievement(state, 'c1').state;
      const summary = getCategorySummary(state, 'combat');
      assert.strictEqual(summary.total, 2);
      assert.strictEqual(summary.unlocked, 1);
      assert.strictEqual(summary.percentage, 50);
    });
  });
});

describe('Achievement System UI', () => {
  let state;
  let achievement;

  beforeEach(() => {
    state = initAchievementState({}).state;
    state = registerAchievement(state, {
      id: 'first_kill',
      name: 'First Blood',
      description: 'Defeat your first enemy',
      category: 'combat',
      tier: 'bronze',
      type: 'milestone'
    }).state;
    achievement = state.achievements.definitions['first_kill'];
  });

  describe('renderAchievementCard', () => {
    it('renders card', () => {
      const html = renderAchievementCard(achievement);
      assert.ok(html.includes('First Blood'));
      assert.ok(html.includes('achievement-card'));
    });

    it('shows unlocked state', () => {
      state = unlockAchievement(state, 'first_kill').state;
      const unlocked = { ...achievement, unlocked: true };
      const html = renderAchievementCard(unlocked);
      assert.ok(html.includes('unlocked'));
    });
  });

  describe('renderAchievementList', () => {
    it('renders list', () => {
      const html = renderAchievementList(state);
      assert.ok(html.includes('achievement-list'));
      assert.ok(html.includes('First Blood'));
    });

    it('shows empty state', () => {
      const emptyState = initAchievementState({}).state;
      const html = renderAchievementList(emptyState);
      assert.ok(html.includes('No achievements'));
    });
  });

  describe('renderCategoryTabs', () => {
    it('renders tabs', () => {
      const html = renderCategoryTabs();
      assert.ok(html.includes('Combat'));
      assert.ok(html.includes('Exploration'));
    });
  });

  describe('renderCategorySummary', () => {
    it('renders summary', () => {
      const html = renderCategorySummary(state, 'combat');
      assert.ok(html.includes('Combat'));
      assert.ok(html.includes('category-summary'));
    });
  });

  describe('renderAchievementStats', () => {
    it('renders stats', () => {
      const html = renderAchievementStats(state);
      assert.ok(html.includes('Achievement Statistics'));
      assert.ok(html.includes('Unlocked'));
    });
  });

  describe('renderRecentUnlocks', () => {
    it('shows empty state', () => {
      const html = renderRecentUnlocks(state);
      assert.ok(html.includes('No recent unlocks'));
    });

    it('shows unlocks', () => {
      state = unlockAchievement(state, 'first_kill').state;
      const html = renderRecentUnlocks(state);
      assert.ok(html.includes('First Blood'));
    });
  });

  describe('renderUnlockNotification', () => {
    it('renders notification', () => {
      const html = renderUnlockNotification(achievement);
      assert.ok(html.includes('Achievement Unlocked'));
      assert.ok(html.includes('First Blood'));
    });
  });

  describe('renderPointsDisplay', () => {
    it('renders points', () => {
      const html = renderPointsDisplay(state);
      assert.ok(html.includes('Achievement Points'));
    });
  });

  describe('renderTierFilter', () => {
    it('renders filter', () => {
      const html = renderTierFilter();
      assert.ok(html.includes('Bronze'));
      assert.ok(html.includes('Gold'));
    });
  });

  describe('renderProgressBar', () => {
    it('renders progress', () => {
      const html = renderProgressBar(50, 100);
      assert.ok(html.includes('50%'));
      assert.ok(html.includes('50/100'));
    });
  });

  describe('renderCompletionOverview', () => {
    it('renders overview', () => {
      const html = renderCompletionOverview(state);
      assert.ok(html.includes('completion-overview'));
    });
  });

  describe('renderAchievementDetails', () => {
    it('renders details', () => {
      const html = renderAchievementDetails(achievement);
      assert.ok(html.includes('First Blood'));
      assert.ok(html.includes('Defeat your first enemy'));
    });

    it('handles null', () => {
      const html = renderAchievementDetails(null);
      assert.ok(html.includes('Select an achievement'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes achievement name', () => {
      const malicious = {
        id: 'x',
        name: '<script>alert("xss")</script>',
        description: 'Test'
      };
      const html = renderAchievementCard(malicious);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
