/**
 * Arena Tournament System
 * Provides competitive arena battles and tournament gameplay
 */

// Tournament types
export const TOURNAMENT_TYPE = {
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
  GAUNTLET: 'gauntlet'
};

// Arena tiers
export const ARENA_TIER = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
  CHAMPION: 'champion'
};

// Match result types
export const MATCH_RESULT = {
  WIN: 'win',
  LOSS: 'loss',
  DRAW: 'draw',
  FORFEIT: 'forfeit'
};

// Arena tier thresholds
const TIER_THRESHOLDS = {
  [ARENA_TIER.BRONZE]: 0,
  [ARENA_TIER.SILVER]: 500,
  [ARENA_TIER.GOLD]: 1200,
  [ARENA_TIER.PLATINUM]: 2000,
  [ARENA_TIER.DIAMOND]: 3000,
  [ARENA_TIER.CHAMPION]: 4500
};

// Tier rewards multipliers
const TIER_REWARD_MULTIPLIERS = {
  [ARENA_TIER.BRONZE]: 1.0,
  [ARENA_TIER.SILVER]: 1.25,
  [ARENA_TIER.GOLD]: 1.5,
  [ARENA_TIER.PLATINUM]: 2.0,
  [ARENA_TIER.DIAMOND]: 2.5,
  [ARENA_TIER.CHAMPION]: 3.0
};

// Tournament definitions
export const TOURNAMENTS = {
  weekly_brawl: {
    id: 'weekly_brawl',
    name: 'Weekly Brawl',
    description: 'A standard 8-player single elimination tournament',
    type: TOURNAMENT_TYPE.SINGLE_ELIMINATION,
    participants: 8,
    entryFee: 100,
    minLevel: 5,
    rewards: {
      first: { gold: 1000, xp: 500, items: ['tournament_medal'] },
      second: { gold: 500, xp: 250 },
      third: { gold: 250, xp: 125 }
    }
  },
  grand_championship: {
    id: 'grand_championship',
    name: 'Grand Championship',
    description: 'Elite 16-player double elimination tournament',
    type: TOURNAMENT_TYPE.DOUBLE_ELIMINATION,
    participants: 16,
    entryFee: 500,
    minLevel: 15,
    rewards: {
      first: { gold: 5000, xp: 2500, items: ['champion_trophy', 'legendary_weapon'] },
      second: { gold: 2500, xp: 1250, items: ['silver_trophy'] },
      third: { gold: 1250, xp: 625, items: ['bronze_trophy'] }
    }
  },
  survival_gauntlet: {
    id: 'survival_gauntlet',
    name: 'Survival Gauntlet',
    description: 'Face 10 increasingly difficult opponents',
    type: TOURNAMENT_TYPE.GAUNTLET,
    participants: 1,
    rounds: 10,
    entryFee: 200,
    minLevel: 10,
    rewards: {
      perRound: { gold: 100, xp: 50 },
      completion: { gold: 2000, xp: 1000, items: ['gauntlet_survivor_badge'] }
    }
  },
  league_match: {
    id: 'league_match',
    name: 'League Match',
    description: 'Round robin league play against 7 opponents',
    type: TOURNAMENT_TYPE.ROUND_ROBIN,
    participants: 8,
    entryFee: 150,
    minLevel: 8,
    rewards: {
      perWin: { gold: 75, xp: 40, ratingPoints: 25 },
      perDraw: { gold: 30, xp: 15, ratingPoints: 10 },
      perLoss: { gold: 0, xp: 10, ratingPoints: -15 },
      first: { gold: 1500, xp: 750, items: ['league_champion_title'] }
    }
  }
};

// NPC opponent templates by level range
const OPPONENT_TEMPLATES = {
  novice: {
    levelRange: [1, 5],
    names: ['Rookie Fighter', 'Arena Initiate', 'Aspiring Warrior', 'Young Challenger'],
    statMultiplier: 0.8,
    aiAggression: 0.3
  },
  intermediate: {
    levelRange: [6, 10],
    names: ['Seasoned Fighter', 'Arena Regular', 'Proven Warrior', 'Skilled Combatant'],
    statMultiplier: 1.0,
    aiAggression: 0.5
  },
  advanced: {
    levelRange: [11, 15],
    names: ['Veteran Fighter', 'Arena Champion', 'Battle Master', 'Elite Warrior'],
    statMultiplier: 1.2,
    aiAggression: 0.7
  },
  expert: {
    levelRange: [16, 20],
    names: ['Grand Champion', 'Arena Legend', 'War Hero', 'Combat Virtuoso'],
    statMultiplier: 1.4,
    aiAggression: 0.85
  },
  master: {
    levelRange: [21, 99],
    names: ['Immortal Champion', 'Arena Deity', 'Supreme Warrior', 'Living Legend'],
    statMultiplier: 1.6,
    aiAggression: 1.0
  }
};

/**
 * Creates initial arena state
 * @returns {Object} Initial arena state
 */
export function createArenaState() {
  return {
    rating: 1000,
    tier: ARENA_TIER.BRONZE,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestWinStreak: 0,
    totalMatches: 0,
    tournaments: {},
    activeTournament: null,
    matchHistory: [],
    achievements: [],
    lastMatchTime: null,
    seasonStats: {
      season: 1,
      rating: 1000,
      highestRating: 1000,
      wins: 0,
      losses: 0
    }
  };
}

/**
 * Gets the tier for a given rating
 * @param {number} rating - Player rating
 * @returns {string} Arena tier
 */
export function getTierForRating(rating) {
  const tiers = Object.entries(TIER_THRESHOLDS)
    .sort((a, b) => b[1] - a[1]);

  for (const [tier, threshold] of tiers) {
    if (rating >= threshold) {
      return tier;
    }
  }
  return ARENA_TIER.BRONZE;
}

/**
 * Gets rating points needed for next tier
 * @param {number} rating - Current rating
 * @returns {Object} Progress to next tier
 */
export function getNextTierProgress(rating) {
  const currentTier = getTierForRating(rating);
  const tiers = Object.keys(TIER_THRESHOLDS);
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex === tiers.length - 1) {
    return {
      currentTier,
      nextTier: null,
      pointsNeeded: 0,
      progress: 1.0
    };
  }

  const nextTier = tiers[currentIndex + 1];
  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  const pointsNeeded = nextThreshold - rating;
  const tierRange = nextThreshold - currentThreshold;
  const progress = (rating - currentThreshold) / tierRange;

  return {
    currentTier,
    nextTier,
    pointsNeeded,
    progress: Math.max(0, Math.min(1, progress))
  };
}

/**
 * Generates an NPC opponent based on player level
 * @param {number} playerLevel - Player's level
 * @param {number} difficulty - Difficulty modifier (0.5-1.5)
 * @returns {Object} Generated opponent
 */
export function generateOpponent(playerLevel, difficulty = 1.0) {
  const template = Object.values(OPPONENT_TEMPLATES).find(
    t => playerLevel >= t.levelRange[0] && playerLevel <= t.levelRange[1]
  ) || OPPONENT_TEMPLATES.novice;

  const name = template.names[Math.floor(Math.random() * template.names.length)];
  const level = Math.max(1, Math.floor(playerLevel * difficulty));
  const baseStats = {
    hp: 50 + (level * 15),
    maxHp: 50 + (level * 15),
    attack: 10 + (level * 3),
    defense: 5 + (level * 2),
    speed: 8 + (level * 1.5)
  };

  // Apply template multiplier
  Object.keys(baseStats).forEach(stat => {
    if (stat !== 'hp' && stat !== 'maxHp') {
      baseStats[stat] = Math.floor(baseStats[stat] * template.statMultiplier * difficulty);
    } else {
      baseStats[stat] = Math.floor(baseStats[stat] * template.statMultiplier * difficulty);
    }
  });

  return {
    id: `opponent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    level,
    stats: baseStats,
    aiAggression: template.aiAggression,
    abilities: generateOpponentAbilities(level),
    rewards: {
      gold: Math.floor(20 * level * difficulty),
      xp: Math.floor(30 * level * difficulty)
    }
  };
}

/**
 * Generates abilities for an opponent
 * @param {number} level - Opponent level
 * @returns {Array} List of abilities
 */
function generateOpponentAbilities(level) {
  const abilities = ['basic_attack'];

  if (level >= 3) abilities.push('power_strike');
  if (level >= 5) abilities.push('defensive_stance');
  if (level >= 8) abilities.push('heavy_blow');
  if (level >= 12) abilities.push('berserker_rage');
  if (level >= 16) abilities.push('ultimate_attack');

  return abilities;
}

/**
 * Calculates rating change after a match
 * @param {number} playerRating - Player's current rating
 * @param {number} opponentRating - Opponent's rating
 * @param {string} result - Match result
 * @returns {number} Rating change
 */
export function calculateRatingChange(playerRating, opponentRating, result) {
  const K = 32; // Rating adjustment factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  let actualScore;
  switch (result) {
    case MATCH_RESULT.WIN:
      actualScore = 1;
      break;
    case MATCH_RESULT.LOSS:
      actualScore = 0;
      break;
    case MATCH_RESULT.DRAW:
      actualScore = 0.5;
      break;
    case MATCH_RESULT.FORFEIT:
      actualScore = 0;
      break;
    default:
      actualScore = 0;
  }

  return Math.round(K * (actualScore - expectedScore));
}

/**
 * Processes an arena match result
 * @param {Object} state - Current arena state
 * @param {Object} matchData - Match data
 * @returns {Object} Updated state and rewards
 */
export function processMatchResult(state, matchData) {
  const { opponentRating, result, duration, damageDealt, damageTaken } = matchData;

  const ratingChange = calculateRatingChange(state.rating, opponentRating, result);
  const newRating = Math.max(0, state.rating + ratingChange);
  const newTier = getTierForRating(newRating);

  const tierMultiplier = TIER_REWARD_MULTIPLIERS[state.tier] || 1.0;

  let rewards = {
    gold: 0,
    xp: 0,
    ratingChange
  };

  if (result === MATCH_RESULT.WIN) {
    rewards.gold = Math.floor(50 * tierMultiplier);
    rewards.xp = Math.floor(75 * tierMultiplier);
  } else if (result === MATCH_RESULT.DRAW) {
    rewards.gold = Math.floor(20 * tierMultiplier);
    rewards.xp = Math.floor(30 * tierMultiplier);
  } else {
    rewards.xp = Math.floor(15 * tierMultiplier);
  }

  const newWinStreak = result === MATCH_RESULT.WIN ? state.winStreak + 1 : 0;

  const matchRecord = {
    id: `match_${Date.now()}`,
    timestamp: Date.now(),
    result,
    ratingChange,
    opponentRating,
    duration,
    damageDealt,
    damageTaken,
    tierAtTime: state.tier
  };

  const newState = {
    ...state,
    rating: newRating,
    tier: newTier,
    wins: result === MATCH_RESULT.WIN ? state.wins + 1 : state.wins,
    losses: result === MATCH_RESULT.LOSS || result === MATCH_RESULT.FORFEIT ? state.losses + 1 : state.losses,
    draws: result === MATCH_RESULT.DRAW ? state.draws + 1 : state.draws,
    winStreak: newWinStreak,
    bestWinStreak: Math.max(state.bestWinStreak, newWinStreak),
    totalMatches: state.totalMatches + 1,
    matchHistory: [...state.matchHistory.slice(-99), matchRecord],
    lastMatchTime: Date.now(),
    seasonStats: {
      ...state.seasonStats,
      rating: newRating,
      highestRating: Math.max(state.seasonStats.highestRating, newRating),
      wins: result === MATCH_RESULT.WIN ? state.seasonStats.wins + 1 : state.seasonStats.wins,
      losses: result === MATCH_RESULT.LOSS ? state.seasonStats.losses + 1 : state.seasonStats.losses
    }
  };

  // Check for tier promotion achievement
  if (newTier !== state.tier && getTierRank(newTier) > getTierRank(state.tier)) {
    rewards.tierPromotion = {
      from: state.tier,
      to: newTier
    };
    rewards.gold += 200 * getTierRank(newTier);
  }

  // Streak bonus
  if (newWinStreak >= 3) {
    const streakBonus = Math.min(newWinStreak, 10) * 10;
    rewards.gold += streakBonus;
    rewards.streakBonus = streakBonus;
  }

  return { state: newState, rewards };
}

/**
 * Gets numeric rank for tier comparison
 * @param {string} tier - Arena tier
 * @returns {number} Tier rank
 */
function getTierRank(tier) {
  const ranks = {
    [ARENA_TIER.BRONZE]: 1,
    [ARENA_TIER.SILVER]: 2,
    [ARENA_TIER.GOLD]: 3,
    [ARENA_TIER.PLATINUM]: 4,
    [ARENA_TIER.DIAMOND]: 5,
    [ARENA_TIER.CHAMPION]: 6
  };
  return ranks[tier] || 0;
}

/**
 * Creates a tournament instance
 * @param {string} tournamentId - Tournament ID
 * @param {Object} playerData - Player data
 * @returns {Object} Tournament instance
 */
export function createTournament(tournamentId, playerData) {
  const template = TOURNAMENTS[tournamentId];
  if (!template) {
    return { error: 'Tournament not found' };
  }

  if (playerData.level < template.minLevel) {
    return { error: `Minimum level ${template.minLevel} required` };
  }

  if (playerData.gold < template.entryFee) {
    return { error: 'Insufficient gold for entry fee' };
  }

  const participants = generateTournamentParticipants(
    template.participants - 1,
    playerData.level
  );

  participants.push({
    id: 'player',
    name: playerData.name || 'Player',
    level: playerData.level,
    isPlayer: true
  });

  // Shuffle participants
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  return {
    id: `tournament_${Date.now()}`,
    templateId: tournamentId,
    type: template.type,
    name: template.name,
    participants,
    bracket: generateBracket(participants, template.type),
    currentRound: 0,
    status: 'in_progress',
    playerStatus: 'active',
    startTime: Date.now(),
    rewards: template.rewards,
    entryFee: template.entryFee
  };
}

/**
 * Generates tournament participants
 * @param {number} count - Number of participants to generate
 * @param {number} playerLevel - Player level for scaling
 * @returns {Array} Generated participants
 */
function generateTournamentParticipants(count, playerLevel) {
  const participants = [];
  for (let i = 0; i < count; i++) {
    const levelVariance = Math.floor(Math.random() * 5) - 2;
    const level = Math.max(1, playerLevel + levelVariance);
    const opponent = generateOpponent(level, 0.9 + Math.random() * 0.3);
    participants.push({
      id: opponent.id,
      name: opponent.name,
      level: opponent.level,
      stats: opponent.stats,
      isPlayer: false
    });
  }
  return participants;
}

/**
 * Generates tournament bracket
 * @param {Array} participants - Tournament participants
 * @param {string} type - Tournament type
 * @returns {Object} Tournament bracket
 */
function generateBracket(participants, type) {
  switch (type) {
    case TOURNAMENT_TYPE.SINGLE_ELIMINATION:
      return generateSingleEliminationBracket(participants);
    case TOURNAMENT_TYPE.DOUBLE_ELIMINATION:
      return generateDoubleEliminationBracket(participants);
    case TOURNAMENT_TYPE.ROUND_ROBIN:
      return generateRoundRobinBracket(participants);
    case TOURNAMENT_TYPE.GAUNTLET:
      return generateGauntletBracket(participants);
    default:
      return generateSingleEliminationBracket(participants);
  }
}

/**
 * Generates single elimination bracket
 * @param {Array} participants - Tournament participants
 * @returns {Object} Bracket structure
 */
function generateSingleEliminationBracket(participants) {
  const rounds = Math.ceil(Math.log2(participants.length));
  const bracket = {
    type: TOURNAMENT_TYPE.SINGLE_ELIMINATION,
    rounds: [],
    totalRounds: rounds
  };

  // First round matches
  const firstRoundMatches = [];
  for (let i = 0; i < participants.length; i += 2) {
    firstRoundMatches.push({
      id: `match_r0_${i/2}`,
      participant1: participants[i],
      participant2: participants[i + 1] || null,
      winner: participants[i + 1] ? null : participants[i], // Bye
      status: participants[i + 1] ? 'pending' : 'bye'
    });
  }
  bracket.rounds.push(firstRoundMatches);

  // Generate placeholder rounds
  let matchCount = Math.ceil(firstRoundMatches.length / 2);
  for (let r = 1; r < rounds; r++) {
    const roundMatches = [];
    for (let m = 0; m < matchCount; m++) {
      roundMatches.push({
        id: `match_r${r}_${m}`,
        participant1: null,
        participant2: null,
        winner: null,
        status: 'waiting'
      });
    }
    bracket.rounds.push(roundMatches);
    matchCount = Math.ceil(matchCount / 2);
  }

  return bracket;
}

/**
 * Generates double elimination bracket
 * @param {Array} participants - Tournament participants
 * @returns {Object} Bracket structure
 */
function generateDoubleEliminationBracket(participants) {
  const winnersBracket = generateSingleEliminationBracket(participants);

  return {
    type: TOURNAMENT_TYPE.DOUBLE_ELIMINATION,
    winners: winnersBracket,
    losers: {
      rounds: [],
      totalRounds: winnersBracket.totalRounds
    },
    grandFinal: null
  };
}

/**
 * Generates round robin bracket
 * @param {Array} participants - Tournament participants
 * @returns {Object} Bracket structure
 */
function generateRoundRobinBracket(participants) {
  const matches = [];
  const standings = participants.map(p => ({
    participant: p,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0
  }));

  // Generate all matchups
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: `match_${i}_${j}`,
        participant1: participants[i],
        participant2: participants[j],
        winner: null,
        status: 'pending'
      });
    }
  }

  return {
    type: TOURNAMENT_TYPE.ROUND_ROBIN,
    matches,
    standings,
    currentMatchIndex: 0
  };
}

/**
 * Generates gauntlet bracket
 * @param {Array} participants - Tournament participants
 * @returns {Object} Bracket structure
 */
function generateGauntletBracket(participants) {
  const player = participants.find(p => p.isPlayer);
  const rounds = 10;
  const opponents = [];

  for (let i = 0; i < rounds; i++) {
    const difficulty = 0.8 + (i * 0.1);
    const opponent = generateOpponent(player.level + Math.floor(i / 2), difficulty);
    opponents.push({
      round: i + 1,
      opponent,
      status: 'pending',
      result: null
    });
  }

  return {
    type: TOURNAMENT_TYPE.GAUNTLET,
    player,
    rounds: opponents,
    currentRound: 0,
    completed: false
  };
}

/**
 * Gets the next match for the player in a tournament
 * @param {Object} tournament - Tournament instance
 * @returns {Object} Next match or null
 */
export function getNextPlayerMatch(tournament) {
  if (tournament.playerStatus !== 'active') {
    return null;
  }

  const bracket = tournament.bracket;

  switch (bracket.type) {
    case TOURNAMENT_TYPE.SINGLE_ELIMINATION:
    case TOURNAMENT_TYPE.DOUBLE_ELIMINATION:
      return findNextBracketMatch(bracket, tournament);

    case TOURNAMENT_TYPE.ROUND_ROBIN:
      return findNextRoundRobinMatch(bracket);

    case TOURNAMENT_TYPE.GAUNTLET:
      return findNextGauntletMatch(bracket);

    default:
      return null;
  }
}

/**
 * Finds next match in bracket tournament
 * @param {Object} bracket - Tournament bracket
 * @param {Object} tournament - Tournament instance
 * @returns {Object} Next match or null
 */
function findNextBracketMatch(bracket, tournament) {
  const rounds = bracket.type === TOURNAMENT_TYPE.DOUBLE_ELIMINATION
    ? bracket.winners.rounds
    : bracket.rounds;

  for (const round of rounds) {
    for (const match of round) {
      if (match.status === 'pending') {
        const hasPlayer =
          (match.participant1 && match.participant1.isPlayer) ||
          (match.participant2 && match.participant2.isPlayer);
        if (hasPlayer) {
          return match;
        }
      }
    }
  }
  return null;
}

/**
 * Finds next match in round robin
 * @param {Object} bracket - Tournament bracket
 * @returns {Object} Next match or null
 */
function findNextRoundRobinMatch(bracket) {
  const match = bracket.matches.find(m =>
    m.status === 'pending' &&
    (m.participant1.isPlayer || m.participant2.isPlayer)
  );
  return match || null;
}

/**
 * Finds next match in gauntlet
 * @param {Object} bracket - Tournament bracket
 * @returns {Object} Next match or null
 */
function findNextGauntletMatch(bracket) {
  if (bracket.completed) return null;
  const round = bracket.rounds[bracket.currentRound];
  if (round && round.status === 'pending') {
    return {
      participant1: bracket.player,
      participant2: round.opponent,
      round: round.round
    };
  }
  return null;
}

/**
 * Records tournament match result
 * @param {Object} tournament - Tournament instance
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner participant ID
 * @returns {Object} Updated tournament
 */
export function recordTournamentMatchResult(tournament, matchId, winnerId) {
  const bracket = tournament.bracket;

  switch (bracket.type) {
    case TOURNAMENT_TYPE.SINGLE_ELIMINATION:
      return recordSingleEliminationResult(tournament, matchId, winnerId);

    case TOURNAMENT_TYPE.DOUBLE_ELIMINATION:
      return recordDoubleEliminationResult(tournament, matchId, winnerId);

    case TOURNAMENT_TYPE.ROUND_ROBIN:
      return recordRoundRobinResult(tournament, matchId, winnerId);

    case TOURNAMENT_TYPE.GAUNTLET:
      return recordGauntletResult(tournament, winnerId);

    default:
      return tournament;
  }
}

/**
 * Records single elimination result
 * @param {Object} tournament - Tournament instance
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner ID
 * @returns {Object} Updated tournament
 */
function recordSingleEliminationResult(tournament, matchId, winnerId) {
  const bracket = { ...tournament.bracket };
  let matchFound = false;
  let roundIndex = -1;
  let matchIndex = -1;

  for (let r = 0; r < bracket.rounds.length; r++) {
    for (let m = 0; m < bracket.rounds[r].length; m++) {
      if (bracket.rounds[r][m].id === matchId) {
        matchFound = true;
        roundIndex = r;
        matchIndex = m;
        const match = bracket.rounds[r][m];
        match.winner = match.participant1.id === winnerId
          ? match.participant1
          : match.participant2;
        match.status = 'completed';
        break;
      }
    }
    if (matchFound) break;
  }

  if (matchFound && roundIndex < bracket.rounds.length - 1) {
    // Advance winner to next round
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = bracket.rounds[roundIndex + 1][nextMatchIndex];
    const winner = bracket.rounds[roundIndex][matchIndex].winner;

    if (matchIndex % 2 === 0) {
      nextMatch.participant1 = winner;
    } else {
      nextMatch.participant2 = winner;
    }

    if (nextMatch.participant1 && nextMatch.participant2) {
      nextMatch.status = 'pending';
    }
  }

  // Check for player elimination
  const loser = bracket.rounds[roundIndex][matchIndex].participant1.id === winnerId
    ? bracket.rounds[roundIndex][matchIndex].participant2
    : bracket.rounds[roundIndex][matchIndex].participant1;

  const playerStatus = loser && loser.isPlayer ? 'eliminated' : tournament.playerStatus;

  // Check for tournament completion
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const isComplete = finalRound[0].status === 'completed';

  return {
    ...tournament,
    bracket,
    playerStatus,
    status: isComplete ? 'completed' : 'in_progress',
    winner: isComplete ? finalRound[0].winner : null
  };
}

/**
 * Records double elimination result
 * @param {Object} tournament - Tournament instance
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner ID
 * @returns {Object} Updated tournament
 */
function recordDoubleEliminationResult(tournament, matchId, winnerId) {
  // Simplified - would need full losers bracket logic
  return recordSingleEliminationResult(tournament, matchId, winnerId);
}

/**
 * Records round robin result
 * @param {Object} tournament - Tournament instance
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner ID or 'draw'
 * @returns {Object} Updated tournament
 */
function recordRoundRobinResult(tournament, matchId, winnerId) {
  const bracket = { ...tournament.bracket };
  const match = bracket.matches.find(m => m.id === matchId);

  if (match) {
    match.status = 'completed';

    if (winnerId === 'draw') {
      match.winner = null;
      // Update standings for draw
      const standing1 = bracket.standings.find(s => s.participant.id === match.participant1.id);
      const standing2 = bracket.standings.find(s => s.participant.id === match.participant2.id);
      if (standing1) { standing1.draws++; standing1.points += 1; }
      if (standing2) { standing2.draws++; standing2.points += 1; }
    } else {
      match.winner = match.participant1.id === winnerId
        ? match.participant1
        : match.participant2;

      const loser = match.participant1.id === winnerId
        ? match.participant2
        : match.participant1;

      const winnerStanding = bracket.standings.find(s => s.participant.id === winnerId);
      const loserStanding = bracket.standings.find(s => s.participant.id === loser.id);

      if (winnerStanding) { winnerStanding.wins++; winnerStanding.points += 3; }
      if (loserStanding) { loserStanding.losses++; }
    }

    bracket.currentMatchIndex++;
  }

  // Sort standings
  bracket.standings.sort((a, b) => b.points - a.points);

  const isComplete = bracket.matches.every(m => m.status === 'completed');

  return {
    ...tournament,
    bracket,
    status: isComplete ? 'completed' : 'in_progress',
    winner: isComplete ? bracket.standings[0].participant : null
  };
}

/**
 * Records gauntlet result
 * @param {Object} tournament - Tournament instance
 * @param {string} winnerId - Winner ID
 * @returns {Object} Updated tournament
 */
function recordGauntletResult(tournament, winnerId) {
  const bracket = { ...tournament.bracket };
  const currentRound = bracket.rounds[bracket.currentRound];

  const playerWon = winnerId === 'player' || winnerId === bracket.player.id;

  currentRound.status = 'completed';
  currentRound.result = playerWon ? 'win' : 'loss';

  if (!playerWon) {
    bracket.completed = true;
    return {
      ...tournament,
      bracket,
      playerStatus: 'eliminated',
      status: 'completed',
      finalRound: bracket.currentRound + 1
    };
  }

  bracket.currentRound++;

  if (bracket.currentRound >= bracket.rounds.length) {
    bracket.completed = true;
    return {
      ...tournament,
      bracket,
      playerStatus: 'champion',
      status: 'completed',
      finalRound: bracket.rounds.length
    };
  }

  return {
    ...tournament,
    bracket,
    currentRound: tournament.currentRound + 1
  };
}

/**
 * Gets tournament rewards based on placement
 * @param {Object} tournament - Completed tournament
 * @returns {Object} Rewards earned
 */
export function getTournamentRewards(tournament) {
  const template = TOURNAMENTS[tournament.templateId];
  if (!template) return null;

  if (tournament.bracket.type === TOURNAMENT_TYPE.GAUNTLET) {
    const roundsCompleted = tournament.finalRound || tournament.bracket.currentRound;
    const perRound = template.rewards.perRound;
    const rewards = {
      gold: perRound.gold * roundsCompleted,
      xp: perRound.xp * roundsCompleted
    };

    if (tournament.playerStatus === 'champion') {
      rewards.gold += template.rewards.completion.gold;
      rewards.xp += template.rewards.completion.xp;
      rewards.items = template.rewards.completion.items;
    }

    return rewards;
  }

  if (tournament.playerStatus === 'champion' ||
      (tournament.winner && tournament.winner.isPlayer)) {
    return { ...template.rewards.first };
  }

  // Determine placement for bracket tournaments
  const placement = getPlayerPlacement(tournament);

  if (placement === 2 && template.rewards.second) {
    return { ...template.rewards.second };
  }

  if (placement <= 4 && template.rewards.third) {
    return { ...template.rewards.third };
  }

  return { gold: Math.floor(template.entryFee * 0.5), xp: 25 };
}

/**
 * Gets player placement in tournament
 * @param {Object} tournament - Tournament instance
 * @returns {number} Placement (1 = winner)
 */
function getPlayerPlacement(tournament) {
  if (tournament.winner && tournament.winner.isPlayer) return 1;

  const bracket = tournament.bracket;

  if (bracket.type === TOURNAMENT_TYPE.ROUND_ROBIN) {
    const playerStanding = bracket.standings.findIndex(s => s.participant.isPlayer);
    return playerStanding + 1;
  }

  // For elimination, find the round where player was eliminated
  let playerEliminatedRound = 0;
  const rounds = bracket.type === TOURNAMENT_TYPE.DOUBLE_ELIMINATION
    ? bracket.winners.rounds
    : bracket.rounds;

  for (let r = 0; r < rounds.length; r++) {
    for (const match of rounds[r]) {
      if (match.status === 'completed') {
        const loser = match.winner === match.participant1
          ? match.participant2
          : match.participant1;
        if (loser && loser.isPlayer) {
          playerEliminatedRound = r;
          break;
        }
      }
    }
  }

  // Convert round to placement
  const totalRounds = rounds.length;
  const playersAtRound = Math.pow(2, totalRounds - playerEliminatedRound);
  return Math.ceil(playersAtRound / 2) + 1;
}

/**
 * Gets arena statistics summary
 * @param {Object} state - Arena state
 * @returns {Object} Statistics summary
 */
export function getArenaStats(state) {
  const winRate = state.totalMatches > 0
    ? ((state.wins / state.totalMatches) * 100).toFixed(1)
    : 0;

  const recentMatches = state.matchHistory.slice(-10);
  const recentWins = recentMatches.filter(m => m.result === MATCH_RESULT.WIN).length;
  const recentWinRate = recentMatches.length > 0
    ? ((recentWins / recentMatches.length) * 100).toFixed(1)
    : 0;

  return {
    rating: state.rating,
    tier: state.tier,
    tierProgress: getNextTierProgress(state.rating),
    totalMatches: state.totalMatches,
    wins: state.wins,
    losses: state.losses,
    draws: state.draws,
    winRate: parseFloat(winRate),
    recentWinRate: parseFloat(recentWinRate),
    winStreak: state.winStreak,
    bestWinStreak: state.bestWinStreak,
    seasonStats: state.seasonStats
  };
}

/**
 * Resets arena season
 * @param {Object} state - Arena state
 * @returns {Object} Updated state for new season
 */
export function resetSeason(state) {
  const newSeasonNumber = state.seasonStats.season + 1;

  // Soft rating reset - move towards 1000
  const resetRating = Math.round((state.rating + 1000) / 2);

  return {
    ...state,
    rating: resetRating,
    tier: getTierForRating(resetRating),
    seasonStats: {
      season: newSeasonNumber,
      rating: resetRating,
      highestRating: resetRating,
      wins: 0,
      losses: 0
    },
    // Keep historical data
    previousSeasons: [
      ...(state.previousSeasons || []),
      {
        season: state.seasonStats.season,
        finalRating: state.rating,
        highestRating: state.seasonStats.highestRating,
        wins: state.seasonStats.wins,
        losses: state.seasonStats.losses
      }
    ]
  };
}

/**
 * Validates arena state
 * @param {Object} state - State to validate
 * @returns {boolean} Whether state is valid
 */
export function validateArenaState(state) {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.rating !== 'number' || state.rating < 0) return false;
  if (!Object.values(ARENA_TIER).includes(state.tier)) return false;
  if (typeof state.wins !== 'number' || state.wins < 0) return false;
  if (typeof state.losses !== 'number' || state.losses < 0) return false;
  if (!Array.isArray(state.matchHistory)) return false;
  return true;
}

/**
 * Escapes HTML for safe rendering
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
