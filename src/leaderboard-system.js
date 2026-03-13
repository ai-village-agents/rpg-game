/**
 * Leaderboard System
 * Track and display player rankings across various categories
 */

// Leaderboard categories
export const LEADERBOARD_CATEGORIES = {
  HIGHEST_LEVEL: 'highest_level',
  TOTAL_DAMAGE: 'total_damage',
  ENEMIES_DEFEATED: 'enemies_defeated',
  BOSSES_SLAIN: 'bosses_slain',
  DUNGEONS_CLEARED: 'dungeons_cleared',
  GOLD_EARNED: 'gold_earned',
  ITEMS_COLLECTED: 'items_collected',
  QUESTS_COMPLETED: 'quests_completed',
  SPEEDRUN_BEST: 'speedrun_best',
  COMBO_HIGHEST: 'combo_highest',
  PERFECT_BATTLES: 'perfect_battles',
  ACHIEVEMENTS_UNLOCKED: 'achievements_unlocked'
};

// Category metadata
export const CATEGORY_INFO = {
  [LEADERBOARD_CATEGORIES.HIGHEST_LEVEL]: {
    name: 'Highest Level',
    description: 'Players with the highest character levels',
    icon: '⭐',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.TOTAL_DAMAGE]: {
    name: 'Total Damage Dealt',
    description: 'Cumulative damage dealt to enemies',
    icon: '⚔️',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.ENEMIES_DEFEATED]: {
    name: 'Enemies Defeated',
    description: 'Total number of enemies vanquished',
    icon: '💀',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.BOSSES_SLAIN]: {
    name: 'Bosses Slain',
    description: 'Number of boss enemies defeated',
    icon: '👑',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.DUNGEONS_CLEARED]: {
    name: 'Dungeons Cleared',
    description: 'Total dungeons successfully completed',
    icon: '🏰',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.GOLD_EARNED]: {
    name: 'Gold Earned',
    description: 'Lifetime gold earned',
    icon: '💰',
    sortOrder: 'desc',
    format: 'currency'
  },
  [LEADERBOARD_CATEGORIES.ITEMS_COLLECTED]: {
    name: 'Items Collected',
    description: 'Total unique items found',
    icon: '🎒',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.QUESTS_COMPLETED]: {
    name: 'Quests Completed',
    description: 'Total quests finished',
    icon: '📜',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.SPEEDRUN_BEST]: {
    name: 'Fastest Speedrun',
    description: 'Best dungeon completion time',
    icon: '⚡',
    sortOrder: 'asc',
    format: 'time'
  },
  [LEADERBOARD_CATEGORIES.COMBO_HIGHEST]: {
    name: 'Highest Combo',
    description: 'Longest hit combo achieved',
    icon: '🔥',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.PERFECT_BATTLES]: {
    name: 'Perfect Battles',
    description: 'Battles won without taking damage',
    icon: '✨',
    sortOrder: 'desc',
    format: 'number'
  },
  [LEADERBOARD_CATEGORIES.ACHIEVEMENTS_UNLOCKED]: {
    name: 'Achievements',
    description: 'Total achievements unlocked',
    icon: '🏆',
    sortOrder: 'desc',
    format: 'number'
  }
};

// Time periods for leaderboard filtering
export const TIME_PERIODS = {
  ALL_TIME: { name: 'All Time', hours: null },
  DAILY: { name: 'Today', hours: 24 },
  WEEKLY: { name: 'This Week', hours: 168 },
  MONTHLY: { name: 'This Month', hours: 720 }
};

// Rank tiers
export const RANK_TIERS = {
  LEGEND: { name: 'Legend', minRank: 1, maxRank: 1, color: '#FFD700', icon: '👑' },
  CHAMPION: { name: 'Champion', minRank: 2, maxRank: 3, color: '#E5E4E2', icon: '🥈' },
  ELITE: { name: 'Elite', minRank: 4, maxRank: 10, color: '#CD7F32', icon: '🥉' },
  VETERAN: { name: 'Veteran', minRank: 11, maxRank: 50, color: '#9932CC', icon: '⭐' },
  ADVENTURER: { name: 'Adventurer', minRank: 51, maxRank: 100, color: '#4169E1', icon: '🌟' },
  NOVICE: { name: 'Novice', minRank: 101, maxRank: Infinity, color: '#808080', icon: '📍' }
};

// Create initial leaderboard state
export function createLeaderboardState() {
  const boards = {};
  for (const category of Object.values(LEADERBOARD_CATEGORIES)) {
    boards[category] = [];
  }

  return {
    boards,
    playerStats: {},
    lastUpdated: null,
    settings: {
      maxEntriesPerBoard: 100,
      updateInterval: 60000, // 1 minute
      showRealNames: false
    }
  };
}

// Create a leaderboard entry
export function createEntry(playerId, playerName, score, timestamp = Date.now()) {
  return {
    playerId,
    playerName,
    score,
    timestamp,
    rank: null
  };
}

// Submit a score to a leaderboard
export function submitScore(state, category, playerId, playerName, score) {
  if (!CATEGORY_INFO[category]) {
    return { success: false, error: 'Invalid category' };
  }

  if (score === null || score === undefined || typeof score !== 'number') {
    return { success: false, error: 'Invalid score' };
  }

  if (!playerId || !playerName) {
    return { success: false, error: 'Invalid player information' };
  }

  const board = state.boards[category] || [];
  const categoryInfo = CATEGORY_INFO[category];
  const timestamp = Date.now();

  // Check if player already has an entry
  const existingIndex = board.findIndex(e => e.playerId === playerId);
  let isNewRecord = false;
  let previousScore = null;

  if (existingIndex >= 0) {
    previousScore = board[existingIndex].score;
    // Only update if new score is better
    const isBetter = categoryInfo.sortOrder === 'desc'
      ? score > previousScore
      : score < previousScore;

    if (isBetter) {
      board[existingIndex] = createEntry(playerId, playerName, score, timestamp);
      isNewRecord = true;
    }
  } else {
    board.push(createEntry(playerId, playerName, score, timestamp));
    isNewRecord = true;
  }

  // Sort the board
  const newBoard = sortBoard(board, category);

  // Trim to max entries
  const trimmedBoard = newBoard.slice(0, state.settings.maxEntriesPerBoard);

  // Assign ranks
  const rankedBoard = assignRanks(trimmedBoard);

  // Get player's rank
  const playerEntry = rankedBoard.find(e => e.playerId === playerId);
  const playerRank = playerEntry ? playerEntry.rank : null;

  // Update state
  const newState = {
    ...state,
    boards: {
      ...state.boards,
      [category]: rankedBoard
    },
    lastUpdated: timestamp
  };

  return {
    success: true,
    state: newState,
    isNewRecord,
    previousScore,
    currentRank: playerRank,
    entry: playerEntry
  };
}

// Sort a leaderboard based on category rules
export function sortBoard(board, category) {
  const categoryInfo = CATEGORY_INFO[category];
  if (!categoryInfo) return board;

  return [...board].sort((a, b) => {
    if (categoryInfo.sortOrder === 'asc') {
      return a.score - b.score;
    }
    return b.score - a.score;
  });
}

// Assign ranks to sorted entries
export function assignRanks(board) {
  let currentRank = 1;
  let previousScore = null;
  let skipCount = 0;

  return board.map((entry, index) => {
    if (previousScore !== null && entry.score !== previousScore) {
      currentRank = index + 1;
    }
    previousScore = entry.score;

    return {
      ...entry,
      rank: currentRank
    };
  });
}

// Get top entries for a category
export function getTopEntries(state, category, limit = 10) {
  const board = state.boards[category];
  if (!board) return [];

  return board.slice(0, limit);
}

// Get player's rank in a category
export function getPlayerRank(state, category, playerId) {
  const board = state.boards[category];
  if (!board) return null;

  const entry = board.find(e => e.playerId === playerId);
  return entry ? entry.rank : null;
}

// Get player's entry in a category
export function getPlayerEntry(state, category, playerId) {
  const board = state.boards[category];
  if (!board) return null;

  return board.find(e => e.playerId === playerId) || null;
}

// Get entries around a player's position
export function getEntriesAroundPlayer(state, category, playerId, range = 2) {
  const board = state.boards[category];
  if (!board || board.length === 0) return [];

  const playerIndex = board.findIndex(e => e.playerId === playerId);
  if (playerIndex < 0) return [];

  const start = Math.max(0, playerIndex - range);
  const end = Math.min(board.length, playerIndex + range + 1);

  return board.slice(start, end);
}

// Get rank tier for a position
export function getRankTier(rank) {
  if (rank === null || rank === undefined) return RANK_TIERS.NOVICE;

  for (const tier of Object.values(RANK_TIERS)) {
    if (rank >= tier.minRank && rank <= tier.maxRank) {
      return tier;
    }
  }

  return RANK_TIERS.NOVICE;
}

// Filter entries by time period
export function filterByTimePeriod(board, period) {
  const periodInfo = TIME_PERIODS[period];
  if (!periodInfo || !periodInfo.hours) {
    return board;
  }

  const cutoff = Date.now() - (periodInfo.hours * 60 * 60 * 1000);
  return board.filter(entry => entry.timestamp >= cutoff);
}

// Get leaderboard with time filter applied
export function getFilteredLeaderboard(state, category, period, limit = 10) {
  const board = state.boards[category];
  if (!board) return [];

  const filtered = filterByTimePeriod(board, period);
  const sorted = sortBoard(filtered, category);
  const ranked = assignRanks(sorted);

  return ranked.slice(0, limit);
}

// Get player stats summary
export function getPlayerStats(state, playerId) {
  const stats = {
    playerId,
    rankings: {},
    bestRanks: [],
    totalCategories: Object.keys(LEADERBOARD_CATEGORIES).length,
    rankedCategories: 0
  };

  for (const [key, category] of Object.entries(LEADERBOARD_CATEGORIES)) {
    const entry = getPlayerEntry(state, category, playerId);
    if (entry) {
      stats.rankings[category] = {
        rank: entry.rank,
        score: entry.score,
        tier: getRankTier(entry.rank)
      };
      stats.rankedCategories++;

      if (entry.rank <= 10) {
        stats.bestRanks.push({
          category,
          categoryInfo: CATEGORY_INFO[category],
          rank: entry.rank,
          score: entry.score
        });
      }
    }
  }

  // Sort best ranks by rank
  stats.bestRanks.sort((a, b) => a.rank - b.rank);

  return stats;
}

// Format score for display
export function formatScore(score, format) {
  switch (format) {
    case 'currency':
      if (score >= 1000000) {
        return `${(score / 1000000).toFixed(1)}M`;
      }
      if (score >= 1000) {
        return `${(score / 1000).toFixed(1)}K`;
      }
      return score.toLocaleString();

    case 'time':
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;

    case 'percentage':
      return `${score.toFixed(1)}%`;

    default:
      return score.toLocaleString();
  }
}

// Get category by key
export function getCategoryInfo(category) {
  return CATEGORY_INFO[category] || null;
}

// Get all categories
export function getAllCategories() {
  return Object.entries(CATEGORY_INFO).map(([key, info]) => ({
    key,
    ...info
  }));
}

// Check if player is in top N for any category
export function getTopAchievements(state, playerId, topN = 10) {
  const achievements = [];

  for (const [key, category] of Object.entries(LEADERBOARD_CATEGORIES)) {
    const entry = getPlayerEntry(state, category, playerId);
    if (entry && entry.rank <= topN) {
      achievements.push({
        category,
        categoryInfo: CATEGORY_INFO[category],
        rank: entry.rank,
        score: entry.score,
        tier: getRankTier(entry.rank)
      });
    }
  }

  return achievements.sort((a, b) => a.rank - b.rank);
}

// Calculate overall ranking score (average percentile)
export function calculateOverallScore(state, playerId) {
  let totalPercentile = 0;
  let categoriesRanked = 0;

  for (const category of Object.values(LEADERBOARD_CATEGORIES)) {
    const board = state.boards[category];
    if (!board || board.length === 0) continue;

    const entry = getPlayerEntry(state, category, playerId);
    if (entry) {
      const percentile = 100 * (1 - (entry.rank - 1) / board.length);
      totalPercentile += percentile;
      categoriesRanked++;
    }
  }

  if (categoriesRanked === 0) return 0;
  return Math.round(totalPercentile / categoriesRanked);
}

// Remove a player from all leaderboards
export function removePlayer(state, playerId) {
  const newBoards = {};

  for (const [category, board] of Object.entries(state.boards)) {
    const filtered = board.filter(e => e.playerId !== playerId);
    newBoards[category] = assignRanks(filtered);
  }

  return {
    ...state,
    boards: newBoards,
    lastUpdated: Date.now()
  };
}

// Clear a specific leaderboard
export function clearLeaderboard(state, category) {
  if (!CATEGORY_INFO[category]) {
    return { success: false, error: 'Invalid category' };
  }

  return {
    success: true,
    state: {
      ...state,
      boards: {
        ...state.boards,
        [category]: []
      },
      lastUpdated: Date.now()
    }
  };
}

// Get leaderboard statistics
export function getLeaderboardStats(state, category) {
  const board = state.boards[category];
  if (!board || board.length === 0) {
    return {
      totalEntries: 0,
      topScore: null,
      averageScore: null,
      medianScore: null
    };
  }

  const categoryInfo = CATEGORY_INFO[category];
  const scores = board.map(e => e.score);
  const sortedScores = [...scores].sort((a, b) => b - a);

  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const mid = Math.floor(sortedScores.length / 2);
  const median = sortedScores.length % 2 === 0
    ? (sortedScores[mid - 1] + sortedScores[mid]) / 2
    : sortedScores[mid];

  return {
    totalEntries: board.length,
    topScore: categoryInfo.sortOrder === 'desc' ? sortedScores[0] : sortedScores[sortedScores.length - 1],
    averageScore: Math.round(avg),
    medianScore: Math.round(median)
  };
}

// Check if a score would make the leaderboard
export function wouldMakeLeaderboard(state, category, score) {
  const board = state.boards[category];
  const categoryInfo = CATEGORY_INFO[category];
  const maxEntries = state.settings.maxEntriesPerBoard;

  if (!board || board.length === 0) {
    return { wouldRank: true, estimatedRank: 1 };
  }

  // Calculate estimated rank by finding position in sorted board
  let estimatedRank = board.length + 1;
  for (let i = 0; i < board.length; i++) {
    const isBetter = categoryInfo.sortOrder === 'desc'
      ? score > board[i].score
      : score < board[i].score;
    if (isBetter) {
      estimatedRank = i + 1;
      break;
    }
  }

  // If board is not full, we would always make it
  if (board.length < maxEntries) {
    return { wouldRank: true, estimatedRank };
  }

  // If board is full, check if score beats the worst entry
  const worstEntry = categoryInfo.sortOrder === 'desc'
    ? board[board.length - 1]
    : board[0];

  const wouldRank = categoryInfo.sortOrder === 'desc'
    ? score > worstEntry.score
    : score < worstEntry.score;

  return { wouldRank, estimatedRank };
}

// Batch update multiple scores for a player
export function batchUpdateScores(state, playerId, playerName, scores) {
  let currentState = state;
  const results = [];

  for (const [category, score] of Object.entries(scores)) {
    if (CATEGORY_INFO[category]) {
      const result = submitScore(currentState, category, playerId, playerName, score);
      if (result.success) {
        currentState = result.state;
      }
      results.push({ category, ...result });
    }
  }

  return {
    state: currentState,
    results
  };
}
