/**
 * Leaderboard System
 * Rankings and competitive tracking
 */

// Leaderboard types
export const LEADERBOARD_TYPES = {
  OVERALL: { id: 'overall', name: 'Overall', sortDir: 'desc' },
  LEVEL: { id: 'level', name: 'Level', sortDir: 'desc' },
  KILLS: { id: 'kills', name: 'Monster Kills', sortDir: 'desc' },
  PVP: { id: 'pvp', name: 'PvP Wins', sortDir: 'desc' },
  WEALTH: { id: 'wealth', name: 'Wealth', sortDir: 'desc' },
  ACHIEVEMENTS: { id: 'achievements', name: 'Achievement Points', sortDir: 'desc' },
  DUNGEONS: { id: 'dungeons', name: 'Dungeons Cleared', sortDir: 'desc' },
  CRAFTING: { id: 'crafting', name: 'Items Crafted', sortDir: 'desc' },
  EXPLORATION: { id: 'exploration', name: 'Areas Discovered', sortDir: 'desc' },
  REPUTATION: { id: 'reputation', name: 'Total Reputation', sortDir: 'desc' }
};

// Time periods
export const TIME_PERIODS = {
  ALL_TIME: { id: 'all_time', name: 'All Time', duration: null },
  MONTHLY: { id: 'monthly', name: 'Monthly', duration: 30 * 24 * 60 * 60 * 1000 },
  WEEKLY: { id: 'weekly', name: 'Weekly', duration: 7 * 24 * 60 * 60 * 1000 },
  DAILY: { id: 'daily', name: 'Daily', duration: 24 * 60 * 60 * 1000 }
};

// Rank tiers
export const RANK_TIERS = {
  UNRANKED: { id: 'unranked', name: 'Unranked', minRank: null, icon: '' },
  BRONZE: { id: 'bronze', name: 'Bronze', minRank: 1000, icon: '&#129352;' },
  SILVER: { id: 'silver', name: 'Silver', minRank: 500, icon: '&#129351;' },
  GOLD: { id: 'gold', name: 'Gold', minRank: 100, icon: '&#127942;' },
  PLATINUM: { id: 'platinum', name: 'Platinum', minRank: 50, icon: '&#128171;' },
  DIAMOND: { id: 'diamond', name: 'Diamond', minRank: 10, icon: '&#128142;' },
  CHAMPION: { id: 'champion', name: 'Champion', minRank: 1, icon: '&#127775;' }
};

/**
 * Get leaderboard state
 */
function getLeaderboardState(state) {
  return state.leaderboards || {
    boards: {},
    playerScores: {},
    history: [],
    lastUpdated: null,
    stats: {
      totalPlayers: 0,
      updatesProcessed: 0
    }
  };
}

/**
 * Initialize leaderboard state
 */
export function initLeaderboardState(state) {
  const boards = {};
  for (const type of Object.values(LEADERBOARD_TYPES)) {
    for (const period of Object.values(TIME_PERIODS)) {
      const key = `${type.id}_${period.id}`;
      boards[key] = {
        type: type.id,
        period: period.id,
        entries: [],
        lastReset: Date.now()
      };
    }
  }

  return {
    state: {
      ...state,
      leaderboards: {
        boards,
        playerScores: {},
        history: [],
        lastUpdated: Date.now(),
        stats: {
          totalPlayers: 0,
          updatesProcessed: 0
        }
      }
    },
    success: true
  };
}

/**
 * Update player score
 */
export function updateScore(state, playerId, leaderboardType, score) {
  if (!playerId) {
    return { state, success: false, error: 'Player ID required' };
  }

  if (!LEADERBOARD_TYPES[leaderboardType.toUpperCase()]) {
    return { state, success: false, error: 'Invalid leaderboard type' };
  }

  if (typeof score !== 'number' || score < 0) {
    return { state, success: false, error: 'Invalid score' };
  }

  const lbState = getLeaderboardState(state);
  const typeId = LEADERBOARD_TYPES[leaderboardType.toUpperCase()].id;

  const playerScores = {
    ...lbState.playerScores,
    [playerId]: {
      ...lbState.playerScores[playerId],
      [typeId]: {
        score,
        updatedAt: Date.now()
      }
    }
  };

  // Check if new player
  const isNewPlayer = !lbState.playerScores[playerId];

  return {
    state: {
      ...state,
      leaderboards: {
        ...lbState,
        playerScores,
        lastUpdated: Date.now(),
        stats: {
          ...lbState.stats,
          totalPlayers: isNewPlayer ? lbState.stats.totalPlayers + 1 : lbState.stats.totalPlayers,
          updatesProcessed: lbState.stats.updatesProcessed + 1
        }
      }
    },
    success: true,
    playerId,
    leaderboardType: typeId,
    score
  };
}

/**
 * Increment player score
 */
export function incrementScore(state, playerId, leaderboardType, amount = 1) {
  const lbState = getLeaderboardState(state);
  const typeId = LEADERBOARD_TYPES[leaderboardType.toUpperCase()]?.id;

  if (!typeId) {
    return { state, success: false, error: 'Invalid leaderboard type' };
  }

  const currentScore = lbState.playerScores[playerId]?.[typeId]?.score || 0;
  return updateScore(state, playerId, leaderboardType, currentScore + amount);
}

/**
 * Build leaderboard rankings
 */
export function buildLeaderboard(state, leaderboardType, period = 'all_time', limit = 100) {
  const lbState = getLeaderboardState(state);
  const typeId = LEADERBOARD_TYPES[leaderboardType.toUpperCase()]?.id;
  const periodId = TIME_PERIODS[period.toUpperCase()]?.id;

  if (!typeId) {
    return { entries: [], error: 'Invalid leaderboard type' };
  }

  const periodDuration = TIME_PERIODS[period.toUpperCase()]?.duration;
  const now = Date.now();

  // Collect scores
  const scores = [];
  for (const [playerId, playerData] of Object.entries(lbState.playerScores)) {
    const scoreData = playerData[typeId];
    if (!scoreData) continue;

    // Check time period
    if (periodDuration && (now - scoreData.updatedAt) > periodDuration) {
      continue;
    }

    scores.push({
      playerId,
      score: scoreData.score,
      updatedAt: scoreData.updatedAt
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Add ranks
  const entries = scores.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...entry,
    tier: getRankTier(index + 1)
  }));

  return {
    entries,
    count: entries.length,
    total: scores.length,
    type: typeId,
    period: periodId
  };
}

/**
 * Get rank tier for position
 */
export function getRankTier(rank) {
  if (rank <= 1) return RANK_TIERS.CHAMPION;
  if (rank <= 10) return RANK_TIERS.DIAMOND;
  if (rank <= 50) return RANK_TIERS.PLATINUM;
  if (rank <= 100) return RANK_TIERS.GOLD;
  if (rank <= 500) return RANK_TIERS.SILVER;
  if (rank <= 1000) return RANK_TIERS.BRONZE;
  return RANK_TIERS.UNRANKED;
}

/**
 * Get player rank
 */
export function getPlayerRank(state, playerId, leaderboardType, period = 'all_time') {
  const leaderboard = buildLeaderboard(state, leaderboardType, period, 10000);

  const entry = leaderboard.entries.find(e => e.playerId === playerId);
  if (!entry) {
    return {
      found: false,
      rank: null,
      score: 0,
      tier: RANK_TIERS.UNRANKED
    };
  }

  return {
    found: true,
    rank: entry.rank,
    score: entry.score,
    tier: entry.tier,
    totalPlayers: leaderboard.total
  };
}

/**
 * Get player scores across all leaderboards
 */
export function getPlayerScores(state, playerId) {
  const lbState = getLeaderboardState(state);
  const playerData = lbState.playerScores[playerId];

  if (!playerData) {
    return { found: false, scores: {} };
  }

  return {
    found: true,
    scores: { ...playerData }
  };
}

/**
 * Get top players
 */
export function getTopPlayers(state, leaderboardType, count = 10, period = 'all_time') {
  const leaderboard = buildLeaderboard(state, leaderboardType, period, count);
  return leaderboard.entries;
}

/**
 * Get nearby players
 */
export function getNearbyPlayers(state, playerId, leaderboardType, range = 5, period = 'all_time') {
  const leaderboard = buildLeaderboard(state, leaderboardType, period, 10000);
  const playerIndex = leaderboard.entries.findIndex(e => e.playerId === playerId);

  if (playerIndex === -1) {
    return { found: false, entries: [] };
  }

  const start = Math.max(0, playerIndex - range);
  const end = Math.min(leaderboard.entries.length, playerIndex + range + 1);

  return {
    found: true,
    entries: leaderboard.entries.slice(start, end),
    playerRank: playerIndex + 1
  };
}

/**
 * Reset periodic leaderboard
 */
export function resetLeaderboard(state, leaderboardType, period) {
  const lbState = getLeaderboardState(state);
  const typeId = LEADERBOARD_TYPES[leaderboardType.toUpperCase()]?.id;
  const periodId = TIME_PERIODS[period.toUpperCase()]?.id;

  if (!typeId || !periodId) {
    return { state, success: false, error: 'Invalid type or period' };
  }

  const key = `${typeId}_${periodId}`;
  const board = lbState.boards[key];

  if (!board) {
    return { state, success: false, error: 'Leaderboard not found' };
  }

  // Archive current standings
  const currentLeaderboard = buildLeaderboard(state, leaderboardType, period, 10);
  const historyEntry = {
    type: typeId,
    period: periodId,
    topPlayers: currentLeaderboard.entries,
    endedAt: Date.now()
  };

  return {
    state: {
      ...state,
      leaderboards: {
        ...lbState,
        boards: {
          ...lbState.boards,
          [key]: {
            ...board,
            entries: [],
            lastReset: Date.now()
          }
        },
        history: [historyEntry, ...lbState.history.slice(0, 49)]
      }
    },
    success: true,
    archived: historyEntry
  };
}

/**
 * Get leaderboard history
 */
export function getLeaderboardHistory(state, leaderboardType = null, period = null) {
  const lbState = getLeaderboardState(state);
  let history = [...lbState.history];

  if (leaderboardType) {
    const typeId = LEADERBOARD_TYPES[leaderboardType.toUpperCase()]?.id;
    history = history.filter(h => h.type === typeId);
  }

  if (period) {
    const periodId = TIME_PERIODS[period.toUpperCase()]?.id;
    history = history.filter(h => h.period === periodId);
  }

  return history;
}

/**
 * Get leaderboard stats
 */
export function getLeaderboardStats(state) {
  const lbState = getLeaderboardState(state);
  return {
    ...lbState.stats,
    lastUpdated: lbState.lastUpdated
  };
}

/**
 * Compare two players
 */
export function comparePlayers(state, player1Id, player2Id, leaderboardType, period = 'all_time') {
  const p1Rank = getPlayerRank(state, player1Id, leaderboardType, period);
  const p2Rank = getPlayerRank(state, player2Id, leaderboardType, period);

  return {
    player1: {
      playerId: player1Id,
      ...p1Rank
    },
    player2: {
      playerId: player2Id,
      ...p2Rank
    },
    scoreDifference: (p1Rank.score || 0) - (p2Rank.score || 0),
    rankDifference: (p2Rank.rank || 0) - (p1Rank.rank || 0)
  };
}

/**
 * Get all leaderboard types
 */
export function getAllLeaderboardTypes() {
  return Object.values(LEADERBOARD_TYPES);
}

/**
 * Get all time periods
 */
export function getAllTimePeriods() {
  return Object.values(TIME_PERIODS);
}

/**
 * Check if player is in top N
 */
export function isInTopN(state, playerId, leaderboardType, n = 100, period = 'all_time') {
  const rank = getPlayerRank(state, playerId, leaderboardType, period);
  return rank.found && rank.rank <= n;
}

/**
 * Get score percentile
 */
export function getScorePercentile(state, playerId, leaderboardType, period = 'all_time') {
  const rank = getPlayerRank(state, playerId, leaderboardType, period);

  if (!rank.found || !rank.totalPlayers) {
    return null;
  }

  const percentile = Math.floor(((rank.totalPlayers - rank.rank + 1) / rank.totalPlayers) * 100);
  return percentile;
}
