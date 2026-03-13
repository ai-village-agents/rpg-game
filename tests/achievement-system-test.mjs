/**
 * Achievement System Tests
 * Tests for achievements, badges, and progress tracking
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_REWARDS,
  createAchievementState,
  createAchievement,
  createAchievementRegistry,
  registerAchievement,
  isAchievementUnlocked,
  getAchievementProgress,
  updateProgress,
  unlockAchievement,
  checkTrigger,
  setActiveTitle,
  setDisplayedBadges,
  getAchievementsByCategory,
  getAchievementsByTier,
  getUnlockedAchievements,
  getLockedAchievements,
  getCompletionStats,
  getRecentUnlocks,
  searchAchievements,
  getAchievementDetails,
  getCategoryInfo,
  getTierInfo,
  getPointsToNextTier,
  getPlayerRank,
  getShowcase,
  createCombatAchievement,
  createExplorationAchievement,
  createCollectionAchievement
} from '../src/achievement-system.js';

// Helper to create test achievement
function createTestAchievement(id, name, category = 'COMBAT', tier = 'BRONZE') {
  const result = createAchievement(
    id,
    name,
    'Test achievement description',
    category,
    tier,
    { trigger: 'test_trigger', count: 5 },
    [{ type: 'title', value: `${name} Master` }]
  );
  return result.achievement;
}

// Helper to create test registry
function createTestRegistry() {
  let registry = createAchievementRegistry();

  const achievements = [
    createTestAchievement('ach_1', 'First Blood', 'COMBAT', 'BRONZE'),
    createTestAchievement('ach_2', 'Explorer', 'EXPLORATION', 'SILVER'),
    createTestAchievement('ach_3', 'Collector', 'COLLECTION', 'GOLD'),
    createTestAchievement('ach_4', 'Secret Find', 'SECRET', 'PLATINUM')
  ];

  for (const achievement of achievements) {
    const result = registerAchievement(registry, achievement);
    if (result.success) registry = result.registry;
  }

  return registry;
}

// ============================================
// Constants Tests
// ============================================
describe('Achievement System Constants', () => {
  test('ACHIEVEMENT_CATEGORIES has all categories', () => {
    assert.ok(ACHIEVEMENT_CATEGORIES.COMBAT);
    assert.ok(ACHIEVEMENT_CATEGORIES.EXPLORATION);
    assert.ok(ACHIEVEMENT_CATEGORIES.COLLECTION);
    assert.ok(ACHIEVEMENT_CATEGORIES.SOCIAL);
    assert.ok(ACHIEVEMENT_CATEGORIES.CRAFTING);
    assert.ok(ACHIEVEMENT_CATEGORIES.QUESTING);
    assert.ok(ACHIEVEMENT_CATEGORIES.PROGRESSION);
    assert.ok(ACHIEVEMENT_CATEGORIES.SECRET);
    assert.strictEqual(Object.keys(ACHIEVEMENT_CATEGORIES).length, 8);
  });

  test('categories have required properties', () => {
    for (const [key, cat] of Object.entries(ACHIEVEMENT_CATEGORIES)) {
      assert.ok(cat.name, `${key} should have name`);
      assert.ok(cat.icon, `${key} should have icon`);
      assert.ok(cat.color, `${key} should have color`);
    }
  });

  test('ACHIEVEMENT_TIERS has all tiers', () => {
    assert.ok(ACHIEVEMENT_TIERS.BRONZE);
    assert.ok(ACHIEVEMENT_TIERS.SILVER);
    assert.ok(ACHIEVEMENT_TIERS.GOLD);
    assert.ok(ACHIEVEMENT_TIERS.PLATINUM);
    assert.ok(ACHIEVEMENT_TIERS.DIAMOND);
    assert.strictEqual(Object.keys(ACHIEVEMENT_TIERS).length, 5);
  });

  test('tiers have required properties', () => {
    for (const [key, tier] of Object.entries(ACHIEVEMENT_TIERS)) {
      assert.ok(tier.name, `${key} should have name`);
      assert.ok(tier.color, `${key} should have color`);
      assert.ok(typeof tier.points === 'number', `${key} should have points`);
      assert.ok(typeof tier.multiplier === 'number', `${key} should have multiplier`);
    }
  });

  test('tier points increase with tier', () => {
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    for (let i = 1; i < tierOrder.length; i++) {
      const prevTier = ACHIEVEMENT_TIERS[tierOrder[i - 1]];
      const currTier = ACHIEVEMENT_TIERS[tierOrder[i]];
      assert.ok(currTier.points > prevTier.points, `${tierOrder[i]} points should exceed ${tierOrder[i-1]}`);
    }
  });
});

// ============================================
// State Creation Tests
// ============================================
describe('createAchievementState', () => {
  test('creates initial state', () => {
    const state = createAchievementState();
    assert.deepStrictEqual(state.unlocked, {});
    assert.deepStrictEqual(state.progress, {});
    assert.strictEqual(state.totalPoints, 0);
    assert.deepStrictEqual(state.titles, []);
    assert.strictEqual(state.activeTitle, null);
    assert.deepStrictEqual(state.badges, []);
    assert.deepStrictEqual(state.displayedBadges, []);
    assert.deepStrictEqual(state.recentUnlocks, []);
  });

  test('creates initial stats', () => {
    const state = createAchievementState();
    assert.strictEqual(state.stats.totalUnlocked, 0);
    assert.deepStrictEqual(state.stats.byCategory, {});
    assert.deepStrictEqual(state.stats.byTier, {});
    assert.strictEqual(state.stats.secretsFound, 0);
  });
});

describe('createAchievementRegistry', () => {
  test('creates empty registry', () => {
    const registry = createAchievementRegistry();
    assert.deepStrictEqual(registry.achievements, {});
    assert.deepStrictEqual(registry.byCategory, {});
    assert.deepStrictEqual(registry.byTier, {});
    assert.deepStrictEqual(registry.triggers, {});
  });
});

// ============================================
// Achievement Creation Tests
// ============================================
describe('createAchievement', () => {
  test('creates valid achievement', () => {
    const result = createAchievement(
      'ach_1',
      'Test Achievement',
      'Test description',
      'combat',
      'bronze',
      { trigger: 'enemy_killed', count: 10 },
      [{ type: 'title', value: 'Warrior' }]
    );

    assert.ok(result.success);
    assert.strictEqual(result.achievement.id, 'ach_1');
    assert.strictEqual(result.achievement.name, 'Test Achievement');
    assert.strictEqual(result.achievement.category, 'COMBAT');
    assert.strictEqual(result.achievement.tier, 'BRONZE');
    assert.ok(!result.achievement.isSecret);
  });

  test('marks secret achievements', () => {
    const result = createAchievement(
      'ach_secret',
      'Hidden',
      'Secret achievement',
      'secret',
      'gold',
      { count: 1 }
    );

    assert.ok(result.success);
    assert.ok(result.achievement.isSecret);
  });

  test('fails without id', () => {
    const result = createAchievement(null, 'Test', 'Desc', 'combat', 'bronze', {});
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid achievement id or name');
  });

  test('fails without name', () => {
    const result = createAchievement('id1', '', 'Desc', 'combat', 'bronze', {});
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid achievement id or name');
  });

  test('fails with invalid category', () => {
    const result = createAchievement('id1', 'Test', 'Desc', 'invalid', 'bronze', {});
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid category');
  });

  test('fails with invalid tier', () => {
    const result = createAchievement('id1', 'Test', 'Desc', 'combat', 'invalid', {});
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid tier');
  });
});

// ============================================
// Registry Tests
// ============================================
describe('registerAchievement', () => {
  test('registers achievement', () => {
    let registry = createAchievementRegistry();
    const achievement = createTestAchievement('ach_1', 'Test');
    const result = registerAchievement(registry, achievement);

    assert.ok(result.success);
    assert.ok(result.registry.achievements['ach_1']);
    assert.ok(result.registry.byCategory['COMBAT'].includes('ach_1'));
    assert.ok(result.registry.byTier['BRONZE'].includes('ach_1'));
  });

  test('indexes by trigger', () => {
    let registry = createAchievementRegistry();
    const achievement = createTestAchievement('ach_1', 'Test');
    const result = registerAchievement(registry, achievement);

    assert.ok(result.registry.triggers['test_trigger'].includes('ach_1'));
  });

  test('fails with invalid achievement', () => {
    const registry = createAchievementRegistry();
    const result = registerAchievement(registry, null);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid achievement');
  });

  test('fails with duplicate achievement', () => {
    let registry = createAchievementRegistry();
    const achievement = createTestAchievement('ach_1', 'Test');
    const result1 = registerAchievement(registry, achievement);
    const result2 = registerAchievement(result1.registry, achievement);

    assert.ok(!result2.success);
    assert.strictEqual(result2.error, 'Achievement already registered');
  });
});

// ============================================
// Unlock Status Tests
// ============================================
describe('isAchievementUnlocked', () => {
  test('returns false for locked achievement', () => {
    const state = createAchievementState();
    assert.ok(!isAchievementUnlocked(state, 'ach_1'));
  });

  test('returns true for unlocked achievement', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    assert.ok(isAchievementUnlocked(state, 'ach_1'));
  });
});

describe('getAchievementProgress', () => {
  test('returns default progress for new achievement', () => {
    const state = createAchievementState();
    const progress = getAchievementProgress(state, 'ach_1');

    assert.strictEqual(progress.current, 0);
    assert.strictEqual(progress.target, 1);
  });

  test('returns current progress', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = updateProgress(state, registry, 'ach_1', 3).state;

    const progress = getAchievementProgress(state, 'ach_1');
    assert.strictEqual(progress.current, 3);
  });
});

// ============================================
// Progress Update Tests
// ============================================
describe('updateProgress', () => {
  test('updates achievement progress', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = updateProgress(state, registry, 'ach_1', 2);

    assert.ok(result.success);
    assert.strictEqual(result.progress, 2);
    assert.strictEqual(result.target, 5);
    assert.ok(!result.justUnlocked);
  });

  test('auto-unlocks when target reached', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = updateProgress(state, registry, 'ach_1', 5);

    assert.ok(result.success);
    assert.ok(result.justUnlocked);
    assert.ok(isAchievementUnlocked(result.state, 'ach_1'));
  });

  test('caps progress at target', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = updateProgress(state, registry, 'ach_1', 100);

    assert.strictEqual(result.progress, 5);
  });

  test('fails for unknown achievement', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = updateProgress(state, registry, 'unknown', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Achievement not found');
  });

  test('fails for already unlocked achievement', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    const result = updateProgress(state, registry, 'ach_1', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Achievement already unlocked');
  });
});

// ============================================
// Unlock Achievement Tests
// ============================================
describe('unlockAchievement', () => {
  test('unlocks achievement', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'ach_1');

    assert.ok(result.success);
    assert.ok(result.achievement);
    assert.strictEqual(result.points, 10); // Bronze tier
    assert.ok(result.state.unlocked['ach_1']);
    assert.strictEqual(result.state.totalPoints, 10);
    assert.strictEqual(result.state.stats.totalUnlocked, 1);
  });

  test('grants title rewards', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'ach_1');

    assert.ok(result.state.titles.includes('First Blood Master'));
  });

  test('tracks by category', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'ach_1');

    assert.strictEqual(result.state.stats.byCategory['COMBAT'], 1);
  });

  test('tracks by tier', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'ach_1');

    assert.strictEqual(result.state.stats.byTier['BRONZE'], 1);
  });

  test('tracks secrets', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'ach_4'); // Secret achievement

    assert.strictEqual(result.state.stats.secretsFound, 1);
  });

  test('adds to recent unlocks', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'ach_1');

    assert.strictEqual(result.state.recentUnlocks.length, 1);
    assert.strictEqual(result.state.recentUnlocks[0].achievementId, 'ach_1');
  });

  test('fails for unknown achievement', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = unlockAchievement(state, registry, 'unknown');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Achievement not found');
  });

  test('fails for already unlocked', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    const result = unlockAchievement(state, registry, 'ach_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Achievement already unlocked');
  });
});

// ============================================
// Trigger Tests
// ============================================
describe('checkTrigger', () => {
  test('progresses achievements with matching trigger', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = checkTrigger(state, registry, 'test_trigger', { amount: 2 });

    assert.ok(result.triggered);
    assert.ok(result.results.length > 0);
  });

  test('ignores already unlocked achievements', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    const result = checkTrigger(state, registry, 'test_trigger');

    assert.ok(!result.results.some(r => r.achievementId === 'ach_1'));
  });

  test('returns empty for unknown trigger', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const result = checkTrigger(state, registry, 'unknown_trigger');

    assert.ok(!result.triggered);
    assert.strictEqual(result.results.length, 0);
  });
});

// ============================================
// Title and Badge Tests
// ============================================
describe('setActiveTitle', () => {
  test('sets unlocked title as active', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    const result = setActiveTitle(state, 'First Blood Master');

    assert.ok(result.success);
    assert.strictEqual(result.state.activeTitle, 'First Blood Master');
  });

  test('clears active title with null', () => {
    let state = createAchievementState();
    state = { ...state, titles: ['Test'], activeTitle: 'Test' };

    const result = setActiveTitle(state, null);

    assert.ok(result.success);
    assert.strictEqual(result.state.activeTitle, null);
  });

  test('fails for unlocked title', () => {
    const state = createAchievementState();

    const result = setActiveTitle(state, 'Unknown Title');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Title not unlocked');
  });
});

describe('setDisplayedBadges', () => {
  test('sets unlocked badges', () => {
    let state = createAchievementState();
    state = { ...state, badges: ['Badge1', 'Badge2', 'Badge3'] };

    const result = setDisplayedBadges(state, ['Badge1', 'Badge2']);

    assert.ok(result.success);
    assert.deepStrictEqual(result.state.displayedBadges, ['Badge1', 'Badge2']);
  });

  test('limits to max badges', () => {
    let state = createAchievementState();
    state = { ...state, badges: ['B1', 'B2', 'B3', 'B4', 'B5'] };

    const result = setDisplayedBadges(state, ['B1', 'B2', 'B3', 'B4'], 3);

    assert.strictEqual(result.state.displayedBadges.length, 3);
  });

  test('fails for unlocked badge', () => {
    const state = createAchievementState();

    const result = setDisplayedBadges(state, ['Unknown']);

    assert.ok(!result.success);
    assert.ok(result.error.includes('not unlocked'));
  });
});

// ============================================
// Query Tests
// ============================================
describe('getAchievementsByCategory', () => {
  test('returns achievements by category', () => {
    const registry = createTestRegistry();
    const combat = getAchievementsByCategory(registry, 'COMBAT');

    assert.ok(combat.length > 0);
    assert.ok(combat.every(a => a.category === 'COMBAT'));
  });

  test('returns empty for category with no achievements', () => {
    const registry = createTestRegistry();
    const social = getAchievementsByCategory(registry, 'SOCIAL');

    assert.strictEqual(social.length, 0);
  });
});

describe('getAchievementsByTier', () => {
  test('returns achievements by tier', () => {
    const registry = createTestRegistry();
    const bronze = getAchievementsByTier(registry, 'BRONZE');

    assert.ok(bronze.length > 0);
    assert.ok(bronze.every(a => a.tier === 'BRONZE'));
  });
});

describe('getUnlockedAchievements', () => {
  test('returns unlocked achievements', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;
    state = unlockAchievement(state, registry, 'ach_2').state;

    const unlocked = getUnlockedAchievements(state, registry);

    assert.strictEqual(unlocked.length, 2);
    assert.ok(unlocked[0].unlockedAt);
  });
});

describe('getLockedAchievements', () => {
  test('returns locked non-secret achievements', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    const locked = getLockedAchievements(state, registry);

    // Should not include secret achievement
    assert.ok(!locked.some(a => a.isSecret));
    assert.ok(locked.length > 0);
  });

  test('excludes unlocked achievements', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    const locked = getLockedAchievements(state, registry);

    assert.ok(!locked.some(a => a.id === 'ach_1'));
  });
});

// ============================================
// Stats Tests
// ============================================
describe('getCompletionStats', () => {
  test('returns comprehensive stats', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;

    const stats = getCompletionStats(state, registry);

    assert.strictEqual(stats.total, 4);
    assert.strictEqual(stats.unlocked, 1);
    assert.strictEqual(stats.percent, 25);
    assert.strictEqual(stats.points, 10);
    assert.ok(stats.byCategory);
    assert.ok(stats.byTier);
  });

  test('tracks secrets separately', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_4').state;

    const stats = getCompletionStats(state, registry);

    assert.strictEqual(stats.secretsFound, 1);
    assert.strictEqual(stats.secretsTotal, 1);
  });
});

describe('getRecentUnlocks', () => {
  test('returns recent unlocks', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;
    state = unlockAchievement(state, registry, 'ach_2').state;

    const recent = getRecentUnlocks(state, registry, 5);

    assert.strictEqual(recent.length, 2);
    // Most recent first
    assert.strictEqual(recent[0].id, 'ach_2');
  });

  test('limits results', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = unlockAchievement(state, registry, 'ach_1').state;
    state = unlockAchievement(state, registry, 'ach_2').state;
    state = unlockAchievement(state, registry, 'ach_3').state;

    const recent = getRecentUnlocks(state, registry, 2);

    assert.strictEqual(recent.length, 2);
  });
});

// ============================================
// Search and Details Tests
// ============================================
describe('searchAchievements', () => {
  test('searches by name', () => {
    const registry = createTestRegistry();
    const results = searchAchievements(registry, 'blood');

    assert.ok(results.length > 0);
    assert.ok(results.some(a => a.name.toLowerCase().includes('blood')));
  });

  test('searches by description', () => {
    const registry = createTestRegistry();
    const results = searchAchievements(registry, 'description');

    assert.ok(results.length > 0);
  });

  test('returns empty for no match', () => {
    const registry = createTestRegistry();
    const results = searchAchievements(registry, 'xyznonexistent');

    assert.strictEqual(results.length, 0);
  });
});

describe('getAchievementDetails', () => {
  test('returns full details', () => {
    let state = createAchievementState();
    const registry = createTestRegistry();
    state = updateProgress(state, registry, 'ach_1', 2).state;

    const details = getAchievementDetails(state, registry, 'ach_1');

    assert.ok(details);
    assert.ok(!details.isUnlocked);
    assert.strictEqual(details.progress.current, 2);
    assert.strictEqual(details.percentComplete, 40);
    assert.ok(details.tierInfo);
    assert.ok(details.categoryInfo);
  });

  test('returns null for unknown achievement', () => {
    const state = createAchievementState();
    const registry = createTestRegistry();

    assert.strictEqual(getAchievementDetails(state, registry, 'unknown'), null);
  });
});

// ============================================
// Info Function Tests
// ============================================
describe('getCategoryInfo', () => {
  test('returns category info', () => {
    const info = getCategoryInfo('combat');
    assert.ok(info);
    assert.strictEqual(info.name, 'Combat');
  });

  test('returns null for invalid category', () => {
    assert.strictEqual(getCategoryInfo('invalid'), null);
  });
});

describe('getTierInfo', () => {
  test('returns tier info', () => {
    const info = getTierInfo('gold');
    assert.ok(info);
    assert.strictEqual(info.name, 'Gold');
    assert.strictEqual(info.points, 50);
  });

  test('returns null for invalid tier', () => {
    assert.strictEqual(getTierInfo('invalid'), null);
  });
});

describe('getPointsToNextTier', () => {
  test('returns next tier info', () => {
    const result = getPointsToNextTier(50);

    assert.strictEqual(result.currentPoints, 50);
    assert.strictEqual(result.nextTier, 'Bronze');
    assert.strictEqual(result.pointsNeeded, 100);
    assert.strictEqual(result.remaining, 50);
  });

  test('returns null next tier at max', () => {
    const result = getPointsToNextTier(10000);

    assert.strictEqual(result.nextTier, null);
    assert.strictEqual(result.remaining, 0);
  });
});

describe('getPlayerRank', () => {
  test('returns unranked for low points', () => {
    const rank = getPlayerRank(50);
    assert.strictEqual(rank.rank, 'Unranked');
  });

  test('returns bronze for 100+ points', () => {
    const rank = getPlayerRank(100);
    assert.strictEqual(rank.rank, 'Bronze');
  });

  test('returns diamond for 7000+ points', () => {
    const rank = getPlayerRank(7000);
    assert.strictEqual(rank.rank, 'Diamond');
  });
});

describe('getShowcase', () => {
  test('returns showcase data', () => {
    let state = createAchievementState();
    state = { ...state, titles: ['Title1'], activeTitle: 'Title1', badges: ['B1', 'B2'], displayedBadges: ['B1'] };

    const showcase = getShowcase(state);

    assert.strictEqual(showcase.activeTitle, 'Title1');
    assert.deepStrictEqual(showcase.displayedBadges, ['B1']);
    assert.deepStrictEqual(showcase.availableTitles, ['Title1']);
    assert.deepStrictEqual(showcase.availableBadges, ['B1', 'B2']);
  });
});

// ============================================
// Helper Function Tests
// ============================================
describe('createCombatAchievement', () => {
  test('creates combat achievement', () => {
    const result = createCombatAchievement('kill_100', 'Slayer', 'Kill 100 enemies', 'silver', 100);

    assert.ok(result.success);
    assert.strictEqual(result.achievement.category, 'COMBAT');
    assert.strictEqual(result.achievement.requirements.trigger, 'enemy_killed');
    assert.strictEqual(result.achievement.requirements.count, 100);
  });
});

describe('createExplorationAchievement', () => {
  test('creates exploration achievement', () => {
    const result = createExplorationAchievement('explorer_10', 'Explorer', 'Discover 10 areas', 'bronze', 10);

    assert.ok(result.success);
    assert.strictEqual(result.achievement.category, 'EXPLORATION');
    assert.strictEqual(result.achievement.requirements.trigger, 'area_discovered');
  });
});

describe('createCollectionAchievement', () => {
  test('creates collection achievement', () => {
    const result = createCollectionAchievement('collect_50', 'Collector', 'Collect 50 items', 'gold', 50);

    assert.ok(result.success);
    assert.strictEqual(result.achievement.category, 'COLLECTION');
    assert.strictEqual(result.achievement.requirements.trigger, 'item_collected');
  });
});
