/**
 * Leaderboard System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  LEADERBOARD_TYPES,
  TIME_PERIODS,
  RANK_TIERS,
  initLeaderboardState,
  updateScore,
  incrementScore,
  buildLeaderboard,
  getRankTier,
  getPlayerRank,
  getPlayerScores,
  getTopPlayers,
  getNearbyPlayers,
  resetLeaderboard,
  getLeaderboardHistory,
  getLeaderboardStats,
  comparePlayers,
  getAllLeaderboardTypes,
  getAllTimePeriods,
  isInTopN,
  getScorePercentile
} from '../src/leaderboard-system.js';

import {
  renderRankBadge,
  renderTierBadge,
  renderLeaderboardEntry,
  renderLeaderboard,
  renderPodium,
  renderPlayerRankCard,
  renderNearbyPlayers,
  renderTypeSelector,
  renderPeriodSelector,
  renderLeaderboardTabs,
  renderLeaderboardStats,
  renderTierLegend,
  renderCompactRank,
  renderPlayerSearch,
  renderPlayerComparison
} from '../src/leaderboard-system-ui.js';

describe('Leaderboard System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initLeaderboardState(state);
    state = result.state;
  });

  describe('LEADERBOARD_TYPES', () => {
    it('has all types', () => {
      assert.ok(LEADERBOARD_TYPES.OVERALL);
      assert.ok(LEADERBOARD_TYPES.LEVEL);
      assert.ok(LEADERBOARD_TYPES.KILLS);
      assert.ok(LEADERBOARD_TYPES.PVP);
    });
  });

  describe('TIME_PERIODS', () => {
    it('has periods', () => {
      assert.ok(TIME_PERIODS.ALL_TIME);
      assert.ok(TIME_PERIODS.WEEKLY);
      assert.ok(TIME_PERIODS.DAILY);
    });
  });

  describe('RANK_TIERS', () => {
    it('has tiers', () => {
      assert.ok(RANK_TIERS.CHAMPION);
      assert.ok(RANK_TIERS.DIAMOND);
      assert.ok(RANK_TIERS.BRONZE);
    });
  });

  describe('initLeaderboardState', () => {
    it('creates initial state', () => {
      assert.ok(state.leaderboards);
      assert.ok(state.leaderboards.boards);
      assert.deepStrictEqual(state.leaderboards.playerScores, {});
    });
  });

  describe('updateScore', () => {
    it('updates score', () => {
      const result = updateScore(state, 'player1', 'kills', 100);
      assert.ok(result.success);
      assert.strictEqual(result.score, 100);
      assert.ok(result.state.leaderboards.playerScores['player1']);
    });

    it('fails without player id', () => {
      const result = updateScore(state, '', 'kills', 100);
      assert.ok(!result.success);
    });

    it('fails for invalid type', () => {
      const result = updateScore(state, 'p1', 'invalid', 100);
      assert.ok(!result.success);
    });

    it('tracks new players', () => {
      const r1 = updateScore(state, 'p1', 'kills', 100);
      const r2 = updateScore(r1.state, 'p2', 'kills', 50);
      assert.strictEqual(r2.state.leaderboards.stats.totalPlayers, 2);
    });
  });

  describe('incrementScore', () => {
    it('increments from zero', () => {
      const result = incrementScore(state, 'p1', 'kills', 5);
      assert.ok(result.success);
      assert.strictEqual(result.score, 5);
    });

    it('increments existing score', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      const result = incrementScore(state, 'p1', 'kills', 10);
      assert.strictEqual(result.score, 110);
    });
  });

  describe('buildLeaderboard', () => {
    it('builds sorted leaderboard', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      state = updateScore(state, 'p2', 'kills', 200).state;
      state = updateScore(state, 'p3', 'kills', 150).state;
      const lb = buildLeaderboard(state, 'kills');
      assert.strictEqual(lb.entries[0].playerId, 'p2');
      assert.strictEqual(lb.entries[1].playerId, 'p3');
      assert.strictEqual(lb.entries[2].playerId, 'p1');
    });

    it('assigns ranks', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      state = updateScore(state, 'p2', 'kills', 200).state;
      const lb = buildLeaderboard(state, 'kills');
      assert.strictEqual(lb.entries[0].rank, 1);
      assert.strictEqual(lb.entries[1].rank, 2);
    });

    it('respects limit', () => {
      for (let i = 0; i < 20; i++) {
        state = updateScore(state, `p${i}`, 'kills', i * 10).state;
      }
      const lb = buildLeaderboard(state, 'kills', 'all_time', 5);
      assert.strictEqual(lb.entries.length, 5);
    });
  });

  describe('getRankTier', () => {
    it('returns champion for rank 1', () => {
      const tier = getRankTier(1);
      assert.strictEqual(tier.id, 'champion');
    });

    it('returns diamond for top 10', () => {
      const tier = getRankTier(5);
      assert.strictEqual(tier.id, 'diamond');
    });

    it('returns bronze for top 1000', () => {
      const tier = getRankTier(750);
      assert.strictEqual(tier.id, 'bronze');
    });
  });

  describe('getPlayerRank', () => {
    it('returns rank info', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      state = updateScore(state, 'p2', 'kills', 200).state;
      const rank = getPlayerRank(state, 'p1', 'kills');
      assert.ok(rank.found);
      assert.strictEqual(rank.rank, 2);
    });

    it('returns not found for unranked', () => {
      const rank = getPlayerRank(state, 'nobody', 'kills');
      assert.ok(!rank.found);
    });
  });

  describe('getPlayerScores', () => {
    it('returns all scores', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      state = updateScore(state, 'p1', 'level', 50).state;
      const scores = getPlayerScores(state, 'p1');
      assert.ok(scores.found);
      assert.ok(scores.scores.kills);
      assert.ok(scores.scores.level);
    });
  });

  describe('getTopPlayers', () => {
    it('returns top players', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      state = updateScore(state, 'p2', 'kills', 200).state;
      state = updateScore(state, 'p3', 'kills', 150).state;
      const top = getTopPlayers(state, 'kills', 2);
      assert.strictEqual(top.length, 2);
      assert.strictEqual(top[0].playerId, 'p2');
    });
  });

  describe('getNearbyPlayers', () => {
    it('returns nearby players', () => {
      for (let i = 0; i < 10; i++) {
        state = updateScore(state, `p${i}`, 'kills', (10 - i) * 100).state;
      }
      const nearby = getNearbyPlayers(state, 'p5', 'kills', 2);
      assert.ok(nearby.found);
      assert.ok(nearby.entries.length > 1);
    });

    it('returns not found for unranked', () => {
      const nearby = getNearbyPlayers(state, 'nobody', 'kills');
      assert.ok(!nearby.found);
    });
  });

  describe('comparePlayers', () => {
    it('compares two players', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      state = updateScore(state, 'p2', 'kills', 200).state;
      const comp = comparePlayers(state, 'p1', 'p2', 'kills');
      assert.strictEqual(comp.scoreDifference, -100);
    });
  });

  describe('isInTopN', () => {
    it('returns true when in top N', () => {
      state = updateScore(state, 'p1', 'kills', 100).state;
      assert.ok(isInTopN(state, 'p1', 'kills', 10));
    });

    it('returns false when not in top N', () => {
      for (let i = 0; i < 20; i++) {
        state = updateScore(state, `p${i}`, 'kills', (20 - i) * 100).state;
      }
      assert.ok(!isInTopN(state, 'p19', 'kills', 5));
    });
  });

  describe('getScorePercentile', () => {
    it('returns percentile', () => {
      for (let i = 0; i < 100; i++) {
        state = updateScore(state, `p${i}`, 'kills', i).state;
      }
      const percentile = getScorePercentile(state, 'p99', 'kills');
      assert.ok(percentile >= 99);
    });
  });

  describe('getAllLeaderboardTypes', () => {
    it('returns all types', () => {
      const types = getAllLeaderboardTypes();
      assert.ok(types.length > 0);
      assert.ok(types.find(t => t.id === 'kills'));
    });
  });
});

describe('Leaderboard System UI', () => {
  let state;

  beforeEach(() => {
    state = initLeaderboardState({}).state;
    state = updateScore(state, 'player1', 'kills', 1000).state;
    state = updateScore(state, 'player2', 'kills', 800).state;
    state = updateScore(state, 'player3', 'kills', 600).state;
  });

  describe('renderRankBadge', () => {
    it('renders first place', () => {
      const html = renderRankBadge(1);
      assert.ok(html.includes('1st'));
      assert.ok(html.includes('champion'));
    });

    it('renders other ranks', () => {
      const html = renderRankBadge(42);
      assert.ok(html.includes('42'));
    });
  });

  describe('renderTierBadge', () => {
    it('renders tier', () => {
      const html = renderTierBadge(RANK_TIERS.DIAMOND);
      assert.ok(html.includes('Diamond'));
    });
  });

  describe('renderLeaderboardEntry', () => {
    it('renders entry', () => {
      const entry = { rank: 1, playerId: 'player1', score: 1000, tier: RANK_TIERS.CHAMPION };
      const html = renderLeaderboardEntry(entry);
      assert.ok(html.includes('player1'));
      assert.ok(html.includes('1,000'));
    });

    it('highlights current player', () => {
      const entry = { rank: 1, playerId: 'player1', score: 1000 };
      const html = renderLeaderboardEntry(entry, true);
      assert.ok(html.includes('current-player'));
    });
  });

  describe('renderLeaderboard', () => {
    it('renders leaderboard', () => {
      const html = renderLeaderboard(state, 'kills');
      assert.ok(html.includes('leaderboard'));
      assert.ok(html.includes('player1'));
    });

    it('shows empty state', () => {
      const emptyState = initLeaderboardState({}).state;
      const html = renderLeaderboard(emptyState, 'kills');
      assert.ok(html.includes('No entries'));
    });
  });

  describe('renderPodium', () => {
    it('renders podium', () => {
      const html = renderPodium(state, 'kills');
      assert.ok(html.includes('podium'));
      assert.ok(html.includes('player1'));
    });
  });

  describe('renderPlayerRankCard', () => {
    it('renders rank card', () => {
      const html = renderPlayerRankCard(state, 'player1', 'kills');
      assert.ok(html.includes('player-rank-card'));
      assert.ok(html.includes('Score'));
    });

    it('shows unranked state', () => {
      const html = renderPlayerRankCard(state, 'nobody', 'kills');
      assert.ok(html.includes('Not ranked'));
    });
  });

  describe('renderNearbyPlayers', () => {
    it('renders nearby', () => {
      const html = renderNearbyPlayers(state, 'player2', 'kills');
      assert.ok(html.includes('nearby-players'));
    });
  });

  describe('renderTypeSelector', () => {
    it('renders types', () => {
      const html = renderTypeSelector('kills');
      assert.ok(html.includes('Monster Kills'));
      assert.ok(html.includes('Level'));
    });
  });

  describe('renderPeriodSelector', () => {
    it('renders periods', () => {
      const html = renderPeriodSelector('all_time');
      assert.ok(html.includes('All Time'));
      assert.ok(html.includes('Weekly'));
    });
  });

  describe('renderLeaderboardTabs', () => {
    it('renders tabs', () => {
      const html = renderLeaderboardTabs('kills');
      assert.ok(html.includes('tab'));
    });
  });

  describe('renderLeaderboardStats', () => {
    it('renders stats', () => {
      const html = renderLeaderboardStats(state);
      assert.ok(html.includes('Total Players'));
    });
  });

  describe('renderTierLegend', () => {
    it('renders legend', () => {
      const html = renderTierLegend();
      assert.ok(html.includes('Champion'));
      assert.ok(html.includes('Diamond'));
    });
  });

  describe('renderCompactRank', () => {
    it('renders compact', () => {
      const html = renderCompactRank(state, 'player1', 'kills');
      assert.ok(html.includes('#1'));
    });
  });

  describe('renderPlayerSearch', () => {
    it('renders search', () => {
      const html = renderPlayerSearch();
      assert.ok(html.includes('search'));
      assert.ok(html.includes('input'));
    });
  });

  describe('renderPlayerComparison', () => {
    it('renders comparison', () => {
      const p1 = { playerId: 'player1', rank: 1, score: 1000 };
      const p2 = { playerId: 'player2', rank: 2, score: 800 };
      const html = renderPlayerComparison(p1, p2);
      assert.ok(html.includes('VS'));
      assert.ok(html.includes('+200'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes player names', () => {
      const malicious = updateScore(state, '<script>alert("xss")</script>', 'kills', 999).state;
      const html = renderLeaderboard(malicious, 'kills');
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
