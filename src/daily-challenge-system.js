/**
 * Daily Challenge System
 * Provides rotating daily challenges with bonus rewards
 */

/**
 * Challenge types
 */
export const CHALLENGE_TYPE = {
  COMBAT: 'combat',
  EXPLORATION: 'exploration',
  COLLECTION: 'collection',
  SOCIAL: 'social',
  MIXED: 'mixed',
};

/**
 * Challenge difficulty
 */
export const CHALLENGE_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
};

/**
 * Challenge templates
 */
export const CHALLENGE_TEMPLATES = {
  // Combat challenges
  'defeat-enemies': {
    id: 'defeat-enemies',
    name: 'Monster Slayer',
    description: 'Defeat {target} enemies in combat.',
    type: CHALLENGE_TYPE.COMBAT,
    icon: '\u2694\uFE0F',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [5, 10],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [15, 25],
      [CHALLENGE_DIFFICULTY.HARD]: [30, 50],
      [CHALLENGE_DIFFICULTY.EXPERT]: [60, 100],
    },
    stat: 'enemiesDefeated',
  },
  'defeat-boss': {
    id: 'defeat-boss',
    name: 'Boss Hunter',
    description: 'Defeat {target} boss enemy.',
    type: CHALLENGE_TYPE.COMBAT,
    icon: '\uD83D\uDC09',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [1, 1],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [1, 2],
      [CHALLENGE_DIFFICULTY.HARD]: [2, 3],
      [CHALLENGE_DIFFICULTY.EXPERT]: [3, 5],
    },
    stat: 'bossesDefeated',
  },
  'deal-damage': {
    id: 'deal-damage',
    name: 'Damage Dealer',
    description: 'Deal {target} total damage.',
    type: CHALLENGE_TYPE.COMBAT,
    icon: '\uD83D\uDCA5',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [500, 1000],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [2000, 4000],
      [CHALLENGE_DIFFICULTY.HARD]: [5000, 10000],
      [CHALLENGE_DIFFICULTY.EXPERT]: [15000, 25000],
    },
    stat: 'totalDamageDealt',
  },
  'critical-hits': {
    id: 'critical-hits',
    name: 'Critical Striker',
    description: 'Land {target} critical hits.',
    type: CHALLENGE_TYPE.COMBAT,
    icon: '\u26A1',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [3, 5],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [8, 12],
      [CHALLENGE_DIFFICULTY.HARD]: [15, 25],
      [CHALLENGE_DIFFICULTY.EXPERT]: [30, 50],
    },
    stat: 'criticalHits',
  },
  'win-battles': {
    id: 'win-battles',
    name: 'Victor',
    description: 'Win {target} battles.',
    type: CHALLENGE_TYPE.COMBAT,
    icon: '\uD83C\uDFC6',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [3, 5],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [6, 10],
      [CHALLENGE_DIFFICULTY.HARD]: [12, 18],
      [CHALLENGE_DIFFICULTY.EXPERT]: [20, 30],
    },
    stat: 'battlesWon',
  },

  // Exploration challenges
  'discover-locations': {
    id: 'discover-locations',
    name: 'Explorer',
    description: 'Discover {target} new locations.',
    type: CHALLENGE_TYPE.EXPLORATION,
    icon: '\uD83D\uDDFA\uFE0F',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [2, 3],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [4, 6],
      [CHALLENGE_DIFFICULTY.HARD]: [7, 10],
      [CHALLENGE_DIFFICULTY.EXPERT]: [12, 15],
    },
    stat: 'locationsDiscovered',
  },
  'open-chests': {
    id: 'open-chests',
    name: 'Treasure Seeker',
    description: 'Open {target} treasure chests.',
    type: CHALLENGE_TYPE.EXPLORATION,
    icon: '\uD83D\uDCBC',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [3, 5],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [6, 10],
      [CHALLENGE_DIFFICULTY.HARD]: [12, 18],
      [CHALLENGE_DIFFICULTY.EXPERT]: [20, 30],
    },
    stat: 'chestsOpened',
  },
  'complete-dungeons': {
    id: 'complete-dungeons',
    name: 'Dungeon Crawler',
    description: 'Complete {target} dungeon floors.',
    type: CHALLENGE_TYPE.EXPLORATION,
    icon: '\uD83C\uDFF0',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [1, 2],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [3, 5],
      [CHALLENGE_DIFFICULTY.HARD]: [6, 8],
      [CHALLENGE_DIFFICULTY.EXPERT]: [10, 15],
    },
    stat: 'dungeonsCompleted',
  },
  'travel-distance': {
    id: 'travel-distance',
    name: 'Wanderer',
    description: 'Travel {target} steps.',
    type: CHALLENGE_TYPE.EXPLORATION,
    icon: '\uD83D\uDC63',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [100, 200],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [300, 500],
      [CHALLENGE_DIFFICULTY.HARD]: [600, 1000],
      [CHALLENGE_DIFFICULTY.EXPERT]: [1500, 2500],
    },
    stat: 'stepsTaken',
  },

  // Collection challenges
  'collect-gold': {
    id: 'collect-gold',
    name: 'Gold Gatherer',
    description: 'Collect {target} gold.',
    type: CHALLENGE_TYPE.COLLECTION,
    icon: '\uD83D\uDCB0',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [100, 200],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [300, 500],
      [CHALLENGE_DIFFICULTY.HARD]: [750, 1200],
      [CHALLENGE_DIFFICULTY.EXPERT]: [1500, 2500],
    },
    stat: 'goldCollected',
  },
  'gather-items': {
    id: 'gather-items',
    name: 'Collector',
    description: 'Gather {target} items.',
    type: CHALLENGE_TYPE.COLLECTION,
    icon: '\uD83C\uDF92',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [5, 10],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [12, 20],
      [CHALLENGE_DIFFICULTY.HARD]: [25, 40],
      [CHALLENGE_DIFFICULTY.EXPERT]: [50, 80],
    },
    stat: 'itemsGathered',
  },
  'use-potions': {
    id: 'use-potions',
    name: 'Alchemist',
    description: 'Use {target} potions.',
    type: CHALLENGE_TYPE.COLLECTION,
    icon: '\uD83E\uDDEA',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [3, 5],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [6, 10],
      [CHALLENGE_DIFFICULTY.HARD]: [12, 18],
      [CHALLENGE_DIFFICULTY.EXPERT]: [20, 30],
    },
    stat: 'potionsUsed',
  },
  'craft-items': {
    id: 'craft-items',
    name: 'Artisan',
    description: 'Craft {target} items.',
    type: CHALLENGE_TYPE.COLLECTION,
    icon: '\u2692\uFE0F',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [2, 3],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [4, 6],
      [CHALLENGE_DIFFICULTY.HARD]: [8, 12],
      [CHALLENGE_DIFFICULTY.EXPERT]: [15, 25],
    },
    stat: 'itemsCrafted',
  },

  // Social challenges
  'talk-npcs': {
    id: 'talk-npcs',
    name: 'Conversationalist',
    description: 'Talk to {target} NPCs.',
    type: CHALLENGE_TYPE.SOCIAL,
    icon: '\uD83D\uDCAC',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [3, 5],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [6, 10],
      [CHALLENGE_DIFFICULTY.HARD]: [12, 18],
      [CHALLENGE_DIFFICULTY.EXPERT]: [20, 30],
    },
    stat: 'npcsTalkedTo',
  },
  'complete-quests': {
    id: 'complete-quests',
    name: 'Quest Champion',
    description: 'Complete {target} quests.',
    type: CHALLENGE_TYPE.SOCIAL,
    icon: '\uD83D\uDCDD',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [1, 2],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [2, 3],
      [CHALLENGE_DIFFICULTY.HARD]: [3, 5],
      [CHALLENGE_DIFFICULTY.EXPERT]: [5, 8],
    },
    stat: 'questsCompleted',
  },
  'shop-purchases': {
    id: 'shop-purchases',
    name: 'Shopper',
    description: 'Make {target} shop purchases.',
    type: CHALLENGE_TYPE.SOCIAL,
    icon: '\uD83D\uDED2',
    targetRanges: {
      [CHALLENGE_DIFFICULTY.EASY]: [2, 3],
      [CHALLENGE_DIFFICULTY.MEDIUM]: [4, 6],
      [CHALLENGE_DIFFICULTY.HARD]: [8, 12],
      [CHALLENGE_DIFFICULTY.EXPERT]: [15, 20],
    },
    stat: 'shopPurchases',
  },
};

/**
 * Reward multipliers by difficulty
 */
export const REWARD_MULTIPLIERS = {
  [CHALLENGE_DIFFICULTY.EASY]: 1.0,
  [CHALLENGE_DIFFICULTY.MEDIUM]: 1.5,
  [CHALLENGE_DIFFICULTY.HARD]: 2.0,
  [CHALLENGE_DIFFICULTY.EXPERT]: 3.0,
};

/**
 * Base rewards
 */
export const BASE_REWARDS = {
  xp: 100,
  gold: 50,
};

/**
 * Streak bonus percentages
 */
export const STREAK_BONUSES = {
  3: 0.1,   // +10% at 3 days
  7: 0.25,  // +25% at 7 days
  14: 0.5,  // +50% at 14 days
  30: 1.0,  // +100% at 30 days
};

/**
 * Create daily challenge state
 * @returns {Object} Challenge state
 */
export function createDailyChallengeState() {
  return {
    currentChallenges: [],
    completedToday: [],
    dailyProgress: {},
    streak: 0,
    lastCompletedDate: null,
    totalChallengesCompleted: 0,
    history: [],
  };
}

/**
 * Generate a seeded random number (for daily consistency)
 * @param {number} seed - Seed value
 * @returns {Function} Random function
 */
function seededRandom(seed) {
  return function () {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Get seed from date
 * @param {Date} date - Date to generate seed from
 * @returns {number} Seed value
 */
function getSeedFromDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

/**
 * Generate daily challenges
 * @param {Date} date - Date to generate challenges for
 * @param {number} count - Number of challenges to generate
 * @returns {Array} Array of challenges
 */
export function generateDailyChallenges(date = new Date(), count = 3) {
  const seed = getSeedFromDate(date);
  const random = seededRandom(seed);

  const templateIds = Object.keys(CHALLENGE_TEMPLATES);
  const difficulties = Object.values(CHALLENGE_DIFFICULTY);
  const challenges = [];
  const usedTemplates = new Set();

  for (let i = 0; i < count; i++) {
    // Pick a template we haven't used
    let templateId;
    let attempts = 0;
    do {
      const index = Math.floor(random() * templateIds.length);
      templateId = templateIds[index];
      attempts++;
    } while (usedTemplates.has(templateId) && attempts < 20);

    usedTemplates.add(templateId);

    // Pick difficulty (weighted toward medium)
    const difficultyRoll = random();
    let difficulty;
    if (difficultyRoll < 0.2) {
      difficulty = CHALLENGE_DIFFICULTY.EASY;
    } else if (difficultyRoll < 0.6) {
      difficulty = CHALLENGE_DIFFICULTY.MEDIUM;
    } else if (difficultyRoll < 0.85) {
      difficulty = CHALLENGE_DIFFICULTY.HARD;
    } else {
      difficulty = CHALLENGE_DIFFICULTY.EXPERT;
    }

    challenges.push(createChallenge(templateId, difficulty, seed + i));
  }

  return challenges;
}

/**
 * Create a single challenge
 * @param {string} templateId - Template ID
 * @param {string} difficulty - Difficulty level
 * @param {number} seed - Random seed
 * @returns {Object} Challenge object
 */
export function createChallenge(templateId, difficulty, seed = Date.now()) {
  const template = CHALLENGE_TEMPLATES[templateId];
  if (!template) return null;

  const random = seededRandom(seed);
  const [min, max] = template.targetRanges[difficulty];
  const target = Math.floor(random() * (max - min + 1)) + min;

  const multiplier = REWARD_MULTIPLIERS[difficulty];
  const rewards = {
    xp: Math.floor(BASE_REWARDS.xp * multiplier),
    gold: Math.floor(BASE_REWARDS.gold * multiplier),
  };

  // Add bonus item for hard/expert
  if (difficulty === CHALLENGE_DIFFICULTY.HARD) {
    rewards.items = ['reward-chest'];
  } else if (difficulty === CHALLENGE_DIFFICULTY.EXPERT) {
    rewards.items = ['rare-reward-chest'];
  }

  return {
    id: `${templateId}-${seed}`,
    templateId,
    name: template.name,
    description: template.description.replace('{target}', target),
    type: template.type,
    icon: template.icon,
    difficulty,
    target,
    stat: template.stat,
    rewards,
    current: 0,
    completed: false,
    claimed: false,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Initialize daily challenges
 * @param {Object} state - Challenge state
 * @param {Date} date - Current date
 * @returns {Object} Updated state
 */
export function initializeDailyChallenges(state, date = new Date()) {
  const today = getDateString(date);
  const lastDate = state.lastCompletedDate;

  // Check if we need to reset for a new day
  if (lastDate !== today) {
    const challenges = generateDailyChallenges(date);

    // Check streak
    let newStreak = 0;
    if (lastDate) {
      const yesterday = getDateString(new Date(date.getTime() - 86400000));
      if (lastDate === yesterday && state.completedToday.length > 0) {
        newStreak = state.streak + 1;
      }
    }

    return {
      ...state,
      currentChallenges: challenges,
      completedToday: [],
      dailyProgress: {},
      streak: newStreak,
      lastCompletedDate: today,
    };
  }

  return state;
}

/**
 * Get date string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Date string
 */
function getDateString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Update challenge progress
 * @param {Object} state - Challenge state
 * @param {string} stat - Stat name
 * @param {number} amount - Amount to add
 * @returns {Object} Result with state and completed challenges
 */
export function updateChallengeProgress(state, stat, amount = 1) {
  const newProgress = {
    ...state.dailyProgress,
    [stat]: (state.dailyProgress[stat] || 0) + amount,
  };

  const newChallenges = state.currentChallenges.map(challenge => {
    if (challenge.completed || challenge.stat !== stat) {
      return challenge;
    }

    const newCurrent = Math.min(challenge.target, (challenge.current || 0) + amount);
    const completed = newCurrent >= challenge.target;

    return {
      ...challenge,
      current: newCurrent,
      completed,
    };
  });

  const newlyCompleted = newChallenges.filter(
    (c, i) => c.completed && !state.currentChallenges[i].completed
  );

  return {
    state: {
      ...state,
      currentChallenges: newChallenges,
      dailyProgress: newProgress,
    },
    newlyCompleted,
  };
}

/**
 * Claim challenge reward
 * @param {Object} state - Challenge state
 * @param {string} challengeId - Challenge ID to claim
 * @returns {Object} Result with state and rewards
 */
export function claimChallengeReward(state, challengeId) {
  const challenge = state.currentChallenges.find(c => c.id === challengeId);

  if (!challenge) {
    return { state, rewards: null, error: 'Challenge not found' };
  }

  if (!challenge.completed) {
    return { state, rewards: null, error: 'Challenge not completed' };
  }

  if (challenge.claimed) {
    return { state, rewards: null, error: 'Reward already claimed' };
  }

  // Apply streak bonus
  const streakBonus = getStreakBonus(state.streak);
  const finalRewards = {
    xp: Math.floor(challenge.rewards.xp * (1 + streakBonus)),
    gold: Math.floor(challenge.rewards.gold * (1 + streakBonus)),
    items: challenge.rewards.items || [],
    streakBonus,
  };

  const newChallenges = state.currentChallenges.map(c =>
    c.id === challengeId ? { ...c, claimed: true } : c
  );

  const today = getDateString(new Date());
  const newCompletedToday = [...state.completedToday, challengeId];

  return {
    state: {
      ...state,
      currentChallenges: newChallenges,
      completedToday: newCompletedToday,
      lastCompletedDate: today,
      totalChallengesCompleted: state.totalChallengesCompleted + 1,
      history: [
        ...state.history.slice(-99),
        {
          challengeId,
          templateId: challenge.templateId,
          difficulty: challenge.difficulty,
          completedAt: new Date().toISOString(),
        },
      ],
    },
    rewards: finalRewards,
  };
}

/**
 * Get streak bonus percentage
 * @param {number} streak - Current streak
 * @returns {number} Bonus percentage (0-1)
 */
export function getStreakBonus(streak) {
  let bonus = 0;
  for (const [days, pct] of Object.entries(STREAK_BONUSES)) {
    if (streak >= parseInt(days)) {
      bonus = pct;
    }
  }
  return bonus;
}

/**
 * Get challenge by ID
 * @param {Object} state - Challenge state
 * @param {string} challengeId - Challenge ID
 * @returns {Object|null} Challenge or null
 */
export function getChallenge(state, challengeId) {
  return state.currentChallenges.find(c => c.id === challengeId) || null;
}

/**
 * Get all challenges
 * @param {Object} state - Challenge state
 * @returns {Array} Array of challenges
 */
export function getAllChallenges(state) {
  return [...state.currentChallenges];
}

/**
 * Get active (incomplete) challenges
 * @param {Object} state - Challenge state
 * @returns {Array} Array of active challenges
 */
export function getActiveChallenges(state) {
  return state.currentChallenges.filter(c => !c.completed);
}

/**
 * Get completed challenges
 * @param {Object} state - Challenge state
 * @returns {Array} Array of completed challenges
 */
export function getCompletedChallenges(state) {
  return state.currentChallenges.filter(c => c.completed);
}

/**
 * Get unclaimed completed challenges
 * @param {Object} state - Challenge state
 * @returns {Array} Array of claimable challenges
 */
export function getClaimableChallenges(state) {
  return state.currentChallenges.filter(c => c.completed && !c.claimed);
}

/**
 * Get challenge progress percentage
 * @param {Object} challenge - Challenge object
 * @returns {number} Progress percentage (0-100)
 */
export function getChallengeProgress(challenge) {
  if (!challenge || challenge.target === 0) return 0;
  return Math.min(100, Math.floor((challenge.current / challenge.target) * 100));
}

/**
 * Get challenges by type
 * @param {Object} state - Challenge state
 * @param {string} type - Challenge type
 * @returns {Array} Challenges of specified type
 */
export function getChallengesByType(state, type) {
  return state.currentChallenges.filter(c => c.type === type);
}

/**
 * Get challenges by difficulty
 * @param {Object} state - Challenge state
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Challenges of specified difficulty
 */
export function getChallengesByDifficulty(state, difficulty) {
  return state.currentChallenges.filter(c => c.difficulty === difficulty);
}

/**
 * Get daily completion count
 * @param {Object} state - Challenge state
 * @returns {number} Number completed today
 */
export function getDailyCompletionCount(state) {
  return state.completedToday.length;
}

/**
 * Get total challenges available
 * @param {Object} state - Challenge state
 * @returns {number} Total challenges
 */
export function getTotalChallenges(state) {
  return state.currentChallenges.length;
}

/**
 * Get daily completion percentage
 * @param {Object} state - Challenge state
 * @returns {number} Completion percentage
 */
export function getDailyCompletionPercentage(state) {
  const total = state.currentChallenges.length;
  if (total === 0) return 0;
  const completed = state.currentChallenges.filter(c => c.completed).length;
  return Math.floor((completed / total) * 100);
}

/**
 * Check if all daily challenges are complete
 * @param {Object} state - Challenge state
 * @returns {boolean} Whether all are complete
 */
export function areAllChallengesComplete(state) {
  return state.currentChallenges.every(c => c.completed);
}

/**
 * Get time until reset
 * @param {Date} now - Current time
 * @returns {Object} Hours and minutes until reset
 */
export function getTimeUntilReset(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

/**
 * Get all challenge types
 * @returns {Array} Array of challenge types
 */
export function getAllChallengeTypes() {
  return Object.values(CHALLENGE_TYPE);
}

/**
 * Get all difficulty levels
 * @returns {Array} Array of difficulty levels
 */
export function getAllDifficulties() {
  return Object.values(CHALLENGE_DIFFICULTY);
}

/**
 * Get challenge template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template or null
 */
export function getChallengeTemplate(templateId) {
  return CHALLENGE_TEMPLATES[templateId] || null;
}

/**
 * Get all challenge templates
 * @returns {Array} Array of templates
 */
export function getAllChallengeTemplates() {
  return Object.values(CHALLENGE_TEMPLATES);
}

/**
 * Get templates by type
 * @param {string} type - Challenge type
 * @returns {Array} Templates of specified type
 */
export function getTemplatesByType(type) {
  return Object.values(CHALLENGE_TEMPLATES).filter(t => t.type === type);
}
