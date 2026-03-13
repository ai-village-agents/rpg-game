/**
 * Leaderboard System Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  LEADERBOARD_CATEGORIES,
  CATEGORY_INFO,
  TIME_PERIODS,
  RANK_TIERS,
  createLeaderboardState,
  createEntry,
  submitScore,
  sortBoard,
  assignRanks,
  getTopEntries,
  getPlayerRank,
  getPlayerEntry,
  getEntriesAroundPlayer,
  getRankTier,
  filterByTimePeriod,
  getFilteredLeaderboard,
  getPlayerStats,
  formatScore,
  getCategoryInfo,
  getAllCategories,
  getTopAchievements,
  calculateOverallScore,
  removePlayer,
  clearLeaderboard,
  getLeaderboardStats,
  wouldMakeLeaderboard,
  batchUpdateScores
} from '../src/leaderboard-system.js';

import {
  renderLeaderboardPanel,
  renderLeaderboardEntry,
  getRankMedal,
  renderCategorySelector,
  renderPlayerProfile,
  renderMiniLeaderboard,
  renderNewHighScoreNotification,
  renderRankChangeAnimation,
  renderLeaderboardStats,
  renderPlayerComparison,
  renderRankTierLegend,
  renderPlayerContext
} from '../src/leaderboard-system-ui.js';

describe('Leaderboard Categories', () => {
  it('should have all expected categories', () => {
    assert.ok(LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.ok(LEADERBOARD_CATEGORIES.TOTAL_DAMAGE);
    assert.ok(LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED);
    assert.ok(LEADERBOARD_CATEGORIES.BOSSES_SLAIN);
    assert.ok(LEADERBOARD_CATEGORIES.DUNGEONS_CLEARED);
    assert.ok(LEADERBOARD_CATEGORIES.GOLD_EARNED);
  });

  it('should have 12 categories', () => {
    assert.strictEqual(Object.keys(LEADERBOARD_CATEGORIES).length, 12);
  });
});

describe('Category Info', () => {
  it('should have info for all categories', () => {
    for (const category of Object.values(LEADERBOARD_CATEGORIES)) {
      const info = CATEGORY_INFO[category];
      assert.ok(info, `Missing info for ${category}`);
      assert.ok(info.name);
      assert.ok(info.description);
      assert.ok(info.icon);
      assert.ok(info.sortOrder);
      assert.ok(info.format);
    }
  });

  it('should have valid sort orders', () => {
    for (const info of Object.values(CATEGORY_INFO)) {
      assert.ok(['asc', 'desc'].includes(info.sortOrder));
    }
  });
});

describe('Time Periods', () => {
  it('should have all time periods', () => {
    assert.ok(TIME_PERIODS.ALL_TIME);
    assert.ok(TIME_PERIODS.DAILY);
    assert.ok(TIME_PERIODS.WEEKLY);
    assert.ok(TIME_PERIODS.MONTHLY);
  });

  it('should have correct hours', () => {
    assert.strictEqual(TIME_PERIODS.DAILY.hours, 24);
    assert.strictEqual(TIME_PERIODS.WEEKLY.hours, 168);
    assert.strictEqual(TIME_PERIODS.ALL_TIME.hours, null);
  });
});

describe('Rank Tiers', () => {
  it('should have all tiers', () => {
    assert.ok(RANK_TIERS.LEGEND);
    assert.ok(RANK_TIERS.CHAMPION);
    assert.ok(RANK_TIERS.ELITE);
    assert.ok(RANK_TIERS.VETERAN);
    assert.ok(RANK_TIERS.ADVENTURER);
    assert.ok(RANK_TIERS.NOVICE);
  });

  it('should have proper rank ranges', () => {
    assert.strictEqual(RANK_TIERS.LEGEND.minRank, 1);
    assert.strictEqual(RANK_TIERS.LEGEND.maxRank, 1);
    assert.strictEqual(RANK_TIERS.CHAMPION.minRank, 2);
    assert.strictEqual(RANK_TIERS.CHAMPION.maxRank, 3);
  });
});

describe('createLeaderboardState', () => {
  it('should create empty state', () => {
    const state = createLeaderboardState();
    assert.ok(state.boards);
    assert.ok(state.settings);
    assert.strictEqual(state.lastUpdated, null);
  });

  it('should have board for each category', () => {
    const state = createLeaderboardState();
    for (const category of Object.values(LEADERBOARD_CATEGORIES)) {
      assert.ok(Array.isArray(state.boards[category]));
    }
  });
});

describe('createEntry', () => {
  it('should create entry with all fields', () => {
    const entry = createEntry('player1', 'TestPlayer', 100);
    assert.strictEqual(entry.playerId, 'player1');
    assert.strictEqual(entry.playerName, 'TestPlayer');
    assert.strictEqual(entry.score, 100);
    assert.ok(entry.timestamp);
    assert.strictEqual(entry.rank, null);
  });
});

describe('submitScore', () => {
  it('should submit score successfully', () => {
    const state = createLeaderboardState();
    const result = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 50);

    assert.ok(result.success);
    assert.ok(result.isNewRecord);
    assert.strictEqual(result.currentRank, 1);
    assert.strictEqual(result.state.boards[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL].length, 1);
  });

  it('should fail with invalid category', () => {
    const state = createLeaderboardState();
    const result = submitScore(state, 'invalid', 'p1', 'Player1', 50);
    assert.strictEqual(result.success, false);
  });

  it('should fail with invalid score', () => {
    const state = createLeaderboardState();
    const result = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', null);
    assert.strictEqual(result.success, false);
  });

  it('should fail with invalid player info', () => {
    const state = createLeaderboardState();
    const result = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, '', 'Player1', 50);
    assert.strictEqual(result.success, false);
  });

  it('should update existing entry if score is better', () => {
    let state = createLeaderboardState();
    let result = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 50);
    result = submitScore(result.state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100);

    assert.ok(result.isNewRecord);
    assert.strictEqual(result.previousScore, 50);
    assert.strictEqual(result.state.boards[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL][0].score, 100);
  });

  it('should not update if score is worse', () => {
    let state = createLeaderboardState();
    let result = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100);
    result = submitScore(result.state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 50);

    assert.strictEqual(result.isNewRecord, false);
    assert.strictEqual(result.state.boards[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL][0].score, 100);
  });

  it('should handle ascending sort (speedrun)', () => {
    let state = createLeaderboardState();
    let result = submitScore(state, LEADERBOARD_CATEGORIES.SPEEDRUN_BEST, 'p1', 'Player1', 100);
    result = submitScore(result.state, LEADERBOARD_CATEGORIES.SPEEDRUN_BEST, 'p1', 'Player1', 80);

    assert.ok(result.isNewRecord); // Lower is better for speedrun
    assert.strictEqual(result.state.boards[LEADERBOARD_CATEGORIES.SPEEDRUN_BEST][0].score, 80);
  });
});

describe('sortBoard', () => {
  it('should sort descending for most categories', () => {
    const board = [
      createEntry('p1', 'A', 50),
      createEntry('p2', 'B', 100),
      createEntry('p3', 'C', 75)
    ];
    const sorted = sortBoard(board, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.strictEqual(sorted[0].score, 100);
    assert.strictEqual(sorted[1].score, 75);
    assert.strictEqual(sorted[2].score, 50);
  });

  it('should sort ascending for speedrun', () => {
    const board = [
      createEntry('p1', 'A', 100),
      createEntry('p2', 'B', 50),
      createEntry('p3', 'C', 75)
    ];
    const sorted = sortBoard(board, LEADERBOARD_CATEGORIES.SPEEDRUN_BEST);
    assert.strictEqual(sorted[0].score, 50);
    assert.strictEqual(sorted[1].score, 75);
    assert.strictEqual(sorted[2].score, 100);
  });
});

describe('assignRanks', () => {
  it('should assign sequential ranks', () => {
    const board = [
      { playerId: 'p1', score: 100 },
      { playerId: 'p2', score: 75 },
      { playerId: 'p3', score: 50 }
    ];
    const ranked = assignRanks(board);
    assert.strictEqual(ranked[0].rank, 1);
    assert.strictEqual(ranked[1].rank, 2);
    assert.strictEqual(ranked[2].rank, 3);
  });

  it('should handle ties', () => {
    const board = [
      { playerId: 'p1', score: 100 },
      { playerId: 'p2', score: 100 },
      { playerId: 'p3', score: 50 }
    ];
    const ranked = assignRanks(board);
    assert.strictEqual(ranked[0].rank, 1);
    assert.strictEqual(ranked[1].rank, 1);
    assert.strictEqual(ranked[2].rank, 3);
  });
});

describe('getTopEntries', () => {
  it('should return top entries', () => {
    let state = createLeaderboardState();
    for (let i = 0; i < 15; i++) {
      const result = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, `p${i}`, `Player${i}`, i * 10);
      state = result.state;
    }

    const top = getTopEntries(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 5);
    assert.strictEqual(top.length, 5);
    assert.strictEqual(top[0].score, 140);
  });

  it('should return empty array for empty board', () => {
    const state = createLeaderboardState();
    const top = getTopEntries(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 10);
    assert.deepStrictEqual(top, []);
  });
});

describe('getPlayerRank', () => {
  it('should return player rank', () => {
    let state = createLeaderboardState();
    submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100);
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p2', 'Player2', 50).state;

    assert.strictEqual(getPlayerRank(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1'), 1);
    assert.strictEqual(getPlayerRank(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p2'), 2);
  });

  it('should return null for non-existent player', () => {
    const state = createLeaderboardState();
    assert.strictEqual(getPlayerRank(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'unknown'), null);
  });
});

describe('getPlayerEntry', () => {
  it('should return player entry', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;

    const entry = getPlayerEntry(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1');
    assert.ok(entry);
    assert.strictEqual(entry.score, 100);
  });

  it('should return null for non-existent player', () => {
    const state = createLeaderboardState();
    assert.strictEqual(getPlayerEntry(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'unknown'), null);
  });
});

describe('getEntriesAroundPlayer', () => {
  it('should return entries around player', () => {
    let state = createLeaderboardState();
    for (let i = 0; i < 10; i++) {
      state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, `p${i}`, `Player${i}`, (10 - i) * 10).state;
    }

    const entries = getEntriesAroundPlayer(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p5', 2);
    assert.strictEqual(entries.length, 5);
  });

  it('should return empty for non-existent player', () => {
    const state = createLeaderboardState();
    const entries = getEntriesAroundPlayer(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'unknown', 2);
    assert.deepStrictEqual(entries, []);
  });
});

describe('getRankTier', () => {
  it('should return correct tier for rank 1', () => {
    const tier = getRankTier(1);
    assert.strictEqual(tier.name, 'Legend');
  });

  it('should return correct tier for rank 2-3', () => {
    assert.strictEqual(getRankTier(2).name, 'Champion');
    assert.strictEqual(getRankTier(3).name, 'Champion');
  });

  it('should return correct tier for rank 4-10', () => {
    assert.strictEqual(getRankTier(5).name, 'Elite');
    assert.strictEqual(getRankTier(10).name, 'Elite');
  });

  it('should return Novice for high ranks', () => {
    assert.strictEqual(getRankTier(150).name, 'Novice');
  });

  it('should return Novice for null rank', () => {
    assert.strictEqual(getRankTier(null).name, 'Novice');
  });
});

describe('filterByTimePeriod', () => {
  it('should filter by time period', () => {
    const now = Date.now();
    const board = [
      { playerId: 'p1', score: 100, timestamp: now },
      { playerId: 'p2', score: 50, timestamp: now - (25 * 60 * 60 * 1000) } // 25 hours ago
    ];

    const filtered = filterByTimePeriod(board, 'DAILY');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].playerId, 'p1');
  });

  it('should return all for ALL_TIME', () => {
    const now = Date.now();
    const board = [
      { playerId: 'p1', score: 100, timestamp: now },
      { playerId: 'p2', score: 50, timestamp: now - (1000 * 60 * 60 * 1000) }
    ];

    const filtered = filterByTimePeriod(board, 'ALL_TIME');
    assert.strictEqual(filtered.length, 2);
  });
});

describe('getFilteredLeaderboard', () => {
  it('should return filtered and ranked entries', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p2', 'Player2', 50).state;

    const filtered = getFilteredLeaderboard(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'ALL_TIME', 10);
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered[0].rank);
  });
});

describe('getPlayerStats', () => {
  it('should return comprehensive stats', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED, 'p1', 'Player1', 500).state;

    const stats = getPlayerStats(state, 'p1');
    assert.strictEqual(stats.rankedCategories, 2);
    assert.ok(stats.rankings[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL]);
  });
});

describe('formatScore', () => {
  it('should format currency', () => {
    assert.strictEqual(formatScore(1500000, 'currency'), '1.5M');
    assert.strictEqual(formatScore(1500, 'currency'), '1.5K');
    assert.strictEqual(formatScore(500, 'currency'), '500');
  });

  it('should format time', () => {
    assert.strictEqual(formatScore(125, 'time'), '2:05');
    assert.strictEqual(formatScore(60, 'time'), '1:00');
  });

  it('should format percentage', () => {
    assert.strictEqual(formatScore(85.5, 'percentage'), '85.5%');
  });

  it('should format number with commas', () => {
    assert.strictEqual(formatScore(1000000, 'number'), '1,000,000');
  });
});

describe('getCategoryInfo', () => {
  it('should return category info', () => {
    const info = getCategoryInfo(LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.ok(info);
    assert.strictEqual(info.name, 'Highest Level');
  });

  it('should return null for invalid category', () => {
    assert.strictEqual(getCategoryInfo('invalid'), null);
  });
});

describe('getAllCategories', () => {
  it('should return all categories with info', () => {
    const categories = getAllCategories();
    assert.strictEqual(categories.length, 12);
    assert.ok(categories[0].key);
    assert.ok(categories[0].name);
  });
});

describe('getTopAchievements', () => {
  it('should return top achievements', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED, 'p1', 'Player1', 500).state;

    const achievements = getTopAchievements(state, 'p1', 10);
    assert.strictEqual(achievements.length, 2);
    assert.ok(achievements[0].categoryInfo);
  });

  it('should filter by top N', () => {
    let state = createLeaderboardState();
    // Add many players to push p1 out of top 3
    for (let i = 0; i < 5; i++) {
      state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, `other${i}`, `Other${i}`, 100 + i * 10).state;
    }
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 50).state;

    const achievements = getTopAchievements(state, 'p1', 3);
    assert.strictEqual(achievements.length, 0);
  });
});

describe('calculateOverallScore', () => {
  it('should calculate percentile score', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;

    const score = calculateOverallScore(state, 'p1');
    assert.strictEqual(score, 100); // Only player = 100th percentile
  });

  it('should return 0 for unranked player', () => {
    const state = createLeaderboardState();
    assert.strictEqual(calculateOverallScore(state, 'unknown'), 0);
  });
});

describe('removePlayer', () => {
  it('should remove player from all boards', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED, 'p1', 'Player1', 500).state;

    const newState = removePlayer(state, 'p1');
    assert.strictEqual(getPlayerEntry(newState, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1'), null);
    assert.strictEqual(getPlayerEntry(newState, LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED, 'p1'), null);
  });
});

describe('clearLeaderboard', () => {
  it('should clear specific leaderboard', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;

    const result = clearLeaderboard(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.ok(result.success);
    assert.strictEqual(result.state.boards[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL].length, 0);
  });

  it('should fail for invalid category', () => {
    const state = createLeaderboardState();
    const result = clearLeaderboard(state, 'invalid');
    assert.strictEqual(result.success, false);
  });
});

describe('getLeaderboardStats', () => {
  it('should return statistics', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p2', 'Player2', 50).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p3', 'Player3', 75).state;

    const stats = getLeaderboardStats(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.strictEqual(stats.totalEntries, 3);
    assert.strictEqual(stats.topScore, 100);
    assert.strictEqual(stats.averageScore, 75);
    assert.strictEqual(stats.medianScore, 75);
  });

  it('should handle empty board', () => {
    const state = createLeaderboardState();
    const stats = getLeaderboardStats(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.strictEqual(stats.totalEntries, 0);
    assert.strictEqual(stats.topScore, null);
  });
});

describe('wouldMakeLeaderboard', () => {
  it('should return true for empty board', () => {
    const state = createLeaderboardState();
    const result = wouldMakeLeaderboard(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 100);
    assert.ok(result.wouldRank);
    assert.strictEqual(result.estimatedRank, 1);
  });

  it('should estimate rank correctly', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p2', 'Player2', 50).state;

    const result = wouldMakeLeaderboard(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 75);
    assert.ok(result.wouldRank);
    assert.strictEqual(result.estimatedRank, 2);
  });
});

describe('batchUpdateScores', () => {
  it('should update multiple scores', () => {
    const state = createLeaderboardState();
    const scores = {
      [LEADERBOARD_CATEGORIES.HIGHEST_LEVEL]: 50,
      [LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED]: 100,
      [LEADERBOARD_CATEGORIES.GOLD_EARNED]: 5000
    };

    const result = batchUpdateScores(state, 'p1', 'Player1', scores);
    assert.strictEqual(result.results.length, 3);
    assert.ok(result.results.every(r => r.success));
  });
});

// UI Tests

describe('renderLeaderboardPanel', () => {
  it('should render panel', () => {
    const state = createLeaderboardState();
    const html = renderLeaderboardPanel(state, 'p1');
    assert.ok(html.includes('leaderboard-panel'));
    assert.ok(html.includes('Leaderboards'));
  });

  it('should show category tabs', () => {
    const state = createLeaderboardState();
    const html = renderLeaderboardPanel(state, 'p1');
    assert.ok(html.includes('category-tab'));
  });
});

describe('renderLeaderboardEntry', () => {
  it('should render entry', () => {
    const entry = { playerId: 'p1', playerName: 'Test', score: 100, rank: 1 };
    const categoryInfo = CATEGORY_INFO[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL];
    const html = renderLeaderboardEntry(entry, categoryInfo, false);

    assert.ok(html.includes('leaderboard-entry'));
    assert.ok(html.includes('Test'));
    assert.ok(html.includes('100'));
  });

  it('should highlight current player', () => {
    const entry = { playerId: 'p1', playerName: 'Test', score: 100, rank: 1 };
    const categoryInfo = CATEGORY_INFO[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL];
    const html = renderLeaderboardEntry(entry, categoryInfo, true);

    assert.ok(html.includes('current-player'));
  });
});

describe('getRankMedal', () => {
  it('should return gold for rank 1', () => {
    assert.strictEqual(getRankMedal(1), '🥇');
  });

  it('should return silver for rank 2', () => {
    assert.strictEqual(getRankMedal(2), '🥈');
  });

  it('should return bronze for rank 3', () => {
    assert.strictEqual(getRankMedal(3), '🥉');
  });

  it('should return number for other ranks', () => {
    assert.strictEqual(getRankMedal(5), '#5');
  });
});

describe('renderCategorySelector', () => {
  it('should render all categories', () => {
    const html = renderCategorySelector(LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.ok(html.includes('category-selector-modal'));

    for (const info of Object.values(CATEGORY_INFO)) {
      assert.ok(html.includes(info.name));
    }
  });
});

describe('renderPlayerProfile', () => {
  it('should render player profile', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;

    const html = renderPlayerProfile(state, 'p1');
    assert.ok(html.includes('player-profile'));
    assert.ok(html.includes('Overall Ranking'));
  });
});

describe('renderMiniLeaderboard', () => {
  it('should render mini leaderboard', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;

    const html = renderMiniLeaderboard(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 5);
    assert.ok(html.includes('mini-leaderboard'));
    assert.ok(html.includes('Player1'));
  });

  it('should return empty for invalid category', () => {
    const state = createLeaderboardState();
    const html = renderMiniLeaderboard(state, 'invalid', 'p1', 5);
    assert.strictEqual(html, '');
  });
});

describe('renderNewHighScoreNotification', () => {
  it('should render notification', () => {
    const entry = { playerId: 'p1', playerName: 'Test', score: 100, rank: 1 };
    const categoryInfo = CATEGORY_INFO[LEADERBOARD_CATEGORIES.HIGHEST_LEVEL];

    const html = renderNewHighScoreNotification(entry, categoryInfo, 5, 1);
    assert.ok(html.includes('high-score-notification'));
    assert.ok(html.includes('New Personal Best'));
    assert.ok(html.includes('+4 places'));
  });
});

describe('renderRankChangeAnimation', () => {
  it('should render up animation', () => {
    const html = renderRankChangeAnimation(10, 5, 'up');
    assert.ok(html.includes('⬆️'));
    assert.ok(html.includes('5'));
  });

  it('should render down animation', () => {
    const html = renderRankChangeAnimation(5, 10, 'down');
    assert.ok(html.includes('⬇️'));
    assert.ok(html.includes('5'));
  });
});

describe('renderLeaderboardStats', () => {
  it('should render stats', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;

    const html = renderLeaderboardStats(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.ok(html.includes('leaderboard-stats'));
    assert.ok(html.includes('Total Players'));
  });

  it('should handle empty board', () => {
    const state = createLeaderboardState();
    const html = renderLeaderboardStats(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL);
    assert.ok(html.includes('No statistics available'));
  });
});

describe('renderPlayerComparison', () => {
  it('should render comparison', () => {
    let state = createLeaderboardState();
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p1', 'Player1', 100).state;
    state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p2', 'Player2', 50).state;

    const html = renderPlayerComparison(state, 'p1', 'p2', 'Player1', 'Player2');
    assert.ok(html.includes('player-comparison'));
    assert.ok(html.includes('Player1'));
    assert.ok(html.includes('Player2'));
    assert.ok(html.includes('VS'));
  });
});

describe('renderRankTierLegend', () => {
  it('should render all tiers', () => {
    const html = renderRankTierLegend();
    assert.ok(html.includes('rank-tier-legend'));

    for (const tier of Object.values(RANK_TIERS)) {
      assert.ok(html.includes(tier.name));
    }
  });
});

describe('renderPlayerContext', () => {
  it('should render context around player', () => {
    let state = createLeaderboardState();
    for (let i = 0; i < 10; i++) {
      state = submitScore(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, `p${i}`, `Player${i}`, (10 - i) * 10).state;
    }

    const html = renderPlayerContext(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'p5');
    assert.ok(html.includes('player-context'));
    assert.ok(html.includes('Your Position'));
  });

  it('should show message for unranked player', () => {
    const state = createLeaderboardState();
    const html = renderPlayerContext(state, LEADERBOARD_CATEGORIES.HIGHEST_LEVEL, 'unknown');
    assert.ok(html.includes('haven\'t ranked'));
  });
});
