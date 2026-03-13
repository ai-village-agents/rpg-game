/**
 * Daily Challenges System
 * Time-limited challenges that reset daily/weekly with special rewards
 */

// Challenge types
export const CHALLENGE_TYPES = {
  COMBAT: 'combat',
  EXPLORATION: 'exploration',
  COLLECTION: 'collection',
  CRAFTING: 'crafting',
  TRADING: 'trading',
  SOCIAL: 'social',
  SURVIVAL: 'survival',
  SPEED: 'speed'
};

// Challenge difficulty tiers
export const CHALLENGE_DIFFICULTY = {
  EASY: { name: 'Easy', multiplier: 1.0, color: '#4CAF50' },
  MEDIUM: { name: 'Medium', multiplier: 1.5, color: '#FF9800' },
  HARD: { name: 'Hard', multiplier: 2.0, color: '#F44336' },
  EXTREME: { name: 'Extreme', multiplier: 3.0, color: '#9C27B0' }
};

// Challenge duration types
export const CHALLENGE_DURATION = {
  DAILY: { name: 'Daily', hours: 24, bonusMultiplier: 1.0 },
  WEEKLY: { name: 'Weekly', hours: 168, bonusMultiplier: 2.5 },
  WEEKEND: { name: 'Weekend', hours: 48, bonusMultiplier: 1.5 },
  EVENT: { name: 'Event', hours: 72, bonusMultiplier: 2.0 }
};

// Reward types
export const REWARD_TYPES = {
  GOLD: 'gold',
  EXPERIENCE: 'experience',
  ITEM: 'item',
  TOKENS: 'tokens',
  TITLE: 'title',
  COSMETIC: 'cosmetic'
};

// Challenge templates
export const CHALLENGE_TEMPLATES = {
  // Combat challenges
  defeat_enemies: {
    type: CHALLENGE_TYPES.COMBAT,
    nameTemplate: 'Defeat {count} enemies',
    descriptionTemplate: 'Vanquish {count} foes in battle',
    targetKey: 'enemiesDefeated',
    baseCount: 10,
    scaleFactor: 1.5
  },
  defeat_enemy_type: {
    type: CHALLENGE_TYPES.COMBAT,
    nameTemplate: 'Slay {count} {enemyType}',
    descriptionTemplate: 'Hunt down and defeat {count} {enemyType}',
    targetKey: 'specificEnemyDefeated',
    baseCount: 5,
    scaleFactor: 1.2
  },
  win_without_damage: {
    type: CHALLENGE_TYPES.COMBAT,
    nameTemplate: 'Flawless Victory',
    descriptionTemplate: 'Win {count} battles without taking damage',
    targetKey: 'flawlessVictories',
    baseCount: 1,
    scaleFactor: 1.0
  },
  deal_damage: {
    type: CHALLENGE_TYPES.COMBAT,
    nameTemplate: 'Deal {count} damage',
    descriptionTemplate: 'Inflict a total of {count} damage to enemies',
    targetKey: 'totalDamageDealt',
    baseCount: 1000,
    scaleFactor: 2.0
  },
  use_abilities: {
    type: CHALLENGE_TYPES.COMBAT,
    nameTemplate: 'Use abilities {count} times',
    descriptionTemplate: 'Execute {count} combat abilities',
    targetKey: 'abilitiesUsed',
    baseCount: 20,
    scaleFactor: 1.5
  },

  // Exploration challenges
  explore_rooms: {
    type: CHALLENGE_TYPES.EXPLORATION,
    nameTemplate: 'Explore {count} rooms',
    descriptionTemplate: 'Discover {count} new areas',
    targetKey: 'roomsExplored',
    baseCount: 15,
    scaleFactor: 1.5
  },
  find_secrets: {
    type: CHALLENGE_TYPES.EXPLORATION,
    nameTemplate: 'Find {count} secrets',
    descriptionTemplate: 'Uncover {count} hidden secrets',
    targetKey: 'secretsFound',
    baseCount: 3,
    scaleFactor: 1.2
  },
  complete_dungeons: {
    type: CHALLENGE_TYPES.EXPLORATION,
    nameTemplate: 'Clear {count} dungeons',
    descriptionTemplate: 'Complete {count} dungeon runs',
    targetKey: 'dungeonsCompleted',
    baseCount: 2,
    scaleFactor: 1.0
  },

  // Collection challenges
  collect_gold: {
    type: CHALLENGE_TYPES.COLLECTION,
    nameTemplate: 'Collect {count} gold',
    descriptionTemplate: 'Amass {count} gold coins',
    targetKey: 'goldCollected',
    baseCount: 500,
    scaleFactor: 2.0
  },
  collect_items: {
    type: CHALLENGE_TYPES.COLLECTION,
    nameTemplate: 'Collect {count} items',
    descriptionTemplate: 'Gather {count} items of any type',
    targetKey: 'itemsCollected',
    baseCount: 10,
    scaleFactor: 1.5
  },
  collect_rare_items: {
    type: CHALLENGE_TYPES.COLLECTION,
    nameTemplate: 'Find {count} rare items',
    descriptionTemplate: 'Obtain {count} rare or better items',
    targetKey: 'rareItemsCollected',
    baseCount: 2,
    scaleFactor: 1.0
  },

  // Crafting challenges
  craft_items: {
    type: CHALLENGE_TYPES.CRAFTING,
    nameTemplate: 'Craft {count} items',
    descriptionTemplate: 'Create {count} items at a crafting station',
    targetKey: 'itemsCrafted',
    baseCount: 5,
    scaleFactor: 1.2
  },
  craft_quality: {
    type: CHALLENGE_TYPES.CRAFTING,
    nameTemplate: 'Craft {count} quality items',
    descriptionTemplate: 'Create {count} items of superior quality',
    targetKey: 'qualityItemsCrafted',
    baseCount: 2,
    scaleFactor: 1.0
  },

  // Trading challenges
  sell_items: {
    type: CHALLENGE_TYPES.TRADING,
    nameTemplate: 'Sell {count} items',
    descriptionTemplate: 'Sell {count} items to merchants',
    targetKey: 'itemsSold',
    baseCount: 10,
    scaleFactor: 1.5
  },
  earn_from_trading: {
    type: CHALLENGE_TYPES.TRADING,
    nameTemplate: 'Earn {count} gold trading',
    descriptionTemplate: 'Profit {count} gold from buying and selling',
    targetKey: 'tradingProfit',
    baseCount: 200,
    scaleFactor: 2.0
  },

  // Survival challenges
  survive_waves: {
    type: CHALLENGE_TYPES.SURVIVAL,
    nameTemplate: 'Survive {count} waves',
    descriptionTemplate: 'Endure {count} enemy waves in survival mode',
    targetKey: 'wavesCleared',
    baseCount: 5,
    scaleFactor: 1.2
  },
  heal_total: {
    type: CHALLENGE_TYPES.SURVIVAL,
    nameTemplate: 'Heal {count} HP',
    descriptionTemplate: 'Recover a total of {count} health points',
    targetKey: 'totalHealed',
    baseCount: 500,
    scaleFactor: 2.0
  },

  // Speed challenges
  speedrun_dungeon: {
    type: CHALLENGE_TYPES.SPEED,
    nameTemplate: 'Speedrun challenge',
    descriptionTemplate: 'Complete a dungeon in under {count} minutes',
    targetKey: 'speedrunTime',
    baseCount: 10,
    scaleFactor: 0.8,
    isTimeBased: true
  },
  quick_kills: {
    type: CHALLENGE_TYPES.SPEED,
    nameTemplate: '{count} quick kills',
    descriptionTemplate: 'Defeat {count} enemies in under 30 seconds each',
    targetKey: 'quickKills',
    baseCount: 5,
    scaleFactor: 1.2
  }
};

// Challenge token rewards for the special shop
export const TOKEN_SHOP_ITEMS = {
  rare_chest: { name: 'Rare Chest', cost: 50, description: 'Contains a guaranteed rare item' },
  legendary_chest: { name: 'Legendary Chest', cost: 200, description: 'Contains a guaranteed legendary item' },
  exp_boost: { name: 'XP Boost (1h)', cost: 30, description: '50% bonus experience for 1 hour' },
  gold_boost: { name: 'Gold Boost (1h)', cost: 30, description: '50% bonus gold for 1 hour' },
  cosmetic_aura: { name: 'Champion Aura', cost: 100, description: 'Exclusive visual effect' },
  title_challenger: { name: 'Title: Challenger', cost: 75, description: 'Exclusive title' },
  title_legend: { name: 'Title: Living Legend', cost: 300, description: 'Prestigious title' },
  pet_token: { name: 'Challenge Pet', cost: 500, description: 'Exclusive companion' }
};

// Create initial challenge state
export function createChallengeState() {
  return {
    activeChallenges: [],
    completedChallenges: [],
    challengeProgress: {},
    tokens: 0,
    streak: 0,
    lastCompletionDate: null,
    totalChallengesCompleted: 0,
    purchasedItems: [],
    stats: {
      dailyCompleted: 0,
      weeklyCompleted: 0,
      perfectDays: 0,
      longestStreak: 0,
      totalTokensEarned: 0
    }
  };
}

// Generate a random challenge based on parameters
export function generateChallenge(templateKey, difficulty, duration, seed = null) {
  const template = CHALLENGE_TEMPLATES[templateKey];
  if (!template) {
    return { success: false, error: 'Unknown challenge template' };
  }

  const difficultyData = CHALLENGE_DIFFICULTY[difficulty];
  if (!difficultyData) {
    return { success: false, error: 'Invalid difficulty' };
  }

  const durationData = CHALLENGE_DURATION[duration];
  if (!durationData) {
    return { success: false, error: 'Invalid duration' };
  }

  // Calculate target count based on difficulty
  const baseTarget = template.baseCount;
  const scaledTarget = Math.ceil(baseTarget * template.scaleFactor * difficultyData.multiplier);

  // Calculate rewards
  const baseTokens = 10;
  const tokenReward = Math.ceil(baseTokens * difficultyData.multiplier * durationData.bonusMultiplier);
  const goldReward = Math.ceil(50 * difficultyData.multiplier * durationData.bonusMultiplier);
  const expReward = Math.ceil(100 * difficultyData.multiplier * durationData.bonusMultiplier);

  // Generate expiration time
  const now = Date.now();
  const expiresAt = now + (durationData.hours * 60 * 60 * 1000);

  // Create challenge ID
  const id = seed ? `${templateKey}_${seed}` : `${templateKey}_${now}`;

  // Format name and description
  const name = template.nameTemplate.replace('{count}', scaledTarget);
  const description = template.descriptionTemplate.replace('{count}', scaledTarget);

  const challenge = {
    id,
    templateKey,
    type: template.type,
    name,
    description,
    difficulty,
    duration,
    targetKey: template.targetKey,
    targetCount: scaledTarget,
    currentCount: 0,
    isTimeBased: template.isTimeBased || false,
    rewards: {
      tokens: tokenReward,
      gold: goldReward,
      experience: expReward
    },
    createdAt: now,
    expiresAt,
    status: 'active'
  };

  return { success: true, challenge };
}

// Generate daily challenges (typically 3 challenges of varying difficulty)
export function generateDailyChallenges(state, currentTime = Date.now()) {
  const templateKeys = Object.keys(CHALLENGE_TEMPLATES);
  const newChallenges = [];

  // Generate one easy, one medium, one hard challenge
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const usedTemplates = new Set();

  for (const difficulty of difficulties) {
    // Pick a random template that hasn't been used
    let templateKey;
    let attempts = 0;
    do {
      const randomIndex = Math.floor((currentTime + attempts) % templateKeys.length);
      templateKey = templateKeys[randomIndex];
      attempts++;
    } while (usedTemplates.has(templateKey) && attempts < templateKeys.length);

    usedTemplates.add(templateKey);

    const result = generateChallenge(templateKey, difficulty, 'DAILY', currentTime);
    if (result.success) {
      newChallenges.push(result.challenge);
    }
  }

  return {
    ...state,
    activeChallenges: [...state.activeChallenges, ...newChallenges]
  };
}

// Generate weekly challenge (harder, better rewards)
export function generateWeeklyChallenge(state, currentTime = Date.now()) {
  const templateKeys = Object.keys(CHALLENGE_TEMPLATES);
  const randomIndex = Math.floor((currentTime / 7) % templateKeys.length);
  const templateKey = templateKeys[randomIndex];

  const result = generateChallenge(templateKey, 'EXTREME', 'WEEKLY', currentTime);

  if (!result.success) {
    return { success: false, error: result.error, state };
  }

  return {
    success: true,
    state: {
      ...state,
      activeChallenges: [...state.activeChallenges, result.challenge]
    },
    challenge: result.challenge
  };
}

// Update challenge progress
export function updateChallengeProgress(state, targetKey, amount = 1) {
  let updated = false;
  const updatedChallenges = state.activeChallenges.map(challenge => {
    if (challenge.targetKey === targetKey && challenge.status === 'active') {
      const newCount = challenge.isTimeBased
        ? amount // For time-based challenges, set directly
        : challenge.currentCount + amount;

      updated = true;

      // Check if completed
      const isComplete = challenge.isTimeBased
        ? newCount <= challenge.targetCount // For time-based, lower is better
        : newCount >= challenge.targetCount;

      return {
        ...challenge,
        currentCount: newCount,
        status: isComplete ? 'completed' : 'active',
        completedAt: isComplete ? Date.now() : null
      };
    }
    return challenge;
  });

  if (!updated) {
    return { success: false, state, error: 'No matching challenge found' };
  }

  return {
    success: true,
    state: {
      ...state,
      activeChallenges: updatedChallenges
    }
  };
}

// Claim rewards for a completed challenge
export function claimChallengeReward(state, challengeId) {
  const challenge = state.activeChallenges.find(c => c.id === challengeId);

  if (!challenge) {
    return { success: false, error: 'Challenge not found' };
  }

  if (challenge.status !== 'completed') {
    return { success: false, error: 'Challenge not completed' };
  }

  // Remove from active, add to completed
  const newActiveChallenges = state.activeChallenges.filter(c => c.id !== challengeId);
  const completedChallenge = { ...challenge, claimedAt: Date.now() };

  // Update streak
  const today = new Date().toDateString();
  const lastDate = state.lastCompletionDate ? new Date(state.lastCompletionDate).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let newStreak = state.streak;
  if (lastDate === yesterday) {
    newStreak = state.streak + 1;
  } else if (lastDate !== today) {
    newStreak = 1;
  }

  // Calculate streak bonus
  const streakBonus = Math.min(newStreak * 0.1, 1.0); // Max 100% bonus
  const bonusTokens = Math.ceil(challenge.rewards.tokens * streakBonus);
  const totalTokens = challenge.rewards.tokens + bonusTokens;

  const newState = {
    ...state,
    activeChallenges: newActiveChallenges,
    completedChallenges: [...state.completedChallenges, completedChallenge],
    tokens: state.tokens + totalTokens,
    streak: newStreak,
    lastCompletionDate: Date.now(),
    totalChallengesCompleted: state.totalChallengesCompleted + 1,
    stats: {
      ...state.stats,
      dailyCompleted: challenge.duration === 'DAILY'
        ? state.stats.dailyCompleted + 1
        : state.stats.dailyCompleted,
      weeklyCompleted: challenge.duration === 'WEEKLY'
        ? state.stats.weeklyCompleted + 1
        : state.stats.weeklyCompleted,
      longestStreak: Math.max(state.stats.longestStreak, newStreak),
      totalTokensEarned: state.stats.totalTokensEarned + totalTokens
    }
  };

  return {
    success: true,
    state: newState,
    rewards: {
      ...challenge.rewards,
      bonusTokens,
      totalTokens
    },
    streakBonus: Math.round(streakBonus * 100)
  };
}

// Process expired challenges
export function processExpiredChallenges(state, currentTime = Date.now()) {
  const expired = [];
  const stillActive = [];

  for (const challenge of state.activeChallenges) {
    if (challenge.expiresAt <= currentTime && challenge.status === 'active') {
      expired.push({ ...challenge, status: 'expired', expiredAt: currentTime });
    } else {
      stillActive.push(challenge);
    }
  }

  if (expired.length === 0) {
    return { success: true, state, expiredCount: 0 };
  }

  // Reset streak if daily challenge expired without completion
  const dailyExpired = expired.some(c => c.duration === 'DAILY');

  return {
    success: true,
    state: {
      ...state,
      activeChallenges: stillActive,
      completedChallenges: [...state.completedChallenges, ...expired],
      streak: dailyExpired ? 0 : state.streak
    },
    expiredCount: expired.length,
    expiredChallenges: expired
  };
}

// Purchase item from token shop
export function purchaseTokenItem(state, itemKey) {
  const item = TOKEN_SHOP_ITEMS[itemKey];

  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  if (state.tokens < item.cost) {
    return { success: false, error: 'Insufficient tokens' };
  }

  const purchase = {
    itemKey,
    name: item.name,
    purchasedAt: Date.now()
  };

  return {
    success: true,
    state: {
      ...state,
      tokens: state.tokens - item.cost,
      purchasedItems: [...state.purchasedItems, purchase]
    },
    item: purchase
  };
}

// Get challenge progress percentage
export function getChallengeProgress(challenge) {
  if (challenge.isTimeBased) {
    // For time-based, invert the percentage
    return Math.max(0, Math.min(100, (challenge.targetCount / challenge.currentCount) * 100));
  }
  return Math.min(100, (challenge.currentCount / challenge.targetCount) * 100);
}

// Get active challenges by type
export function getActiveChallengesByType(state, type) {
  return state.activeChallenges.filter(c => c.type === type && c.status === 'active');
}

// Get completed challenges for today
export function getTodayChallenges(state) {
  const today = new Date().toDateString();
  return state.completedChallenges.filter(c => {
    if (!c.completedAt) return false;
    return new Date(c.completedAt).toDateString() === today;
  });
}

// Get challenge stats summary
export function getChallengeStats(state) {
  const active = state.activeChallenges.filter(c => c.status === 'active').length;
  const completed = state.activeChallenges.filter(c => c.status === 'completed').length;
  const todayCompleted = getTodayChallenges(state).length;

  return {
    active,
    completed,
    todayCompleted,
    tokens: state.tokens,
    streak: state.streak,
    totalCompleted: state.totalChallengesCompleted,
    ...state.stats
  };
}

// Calculate time remaining for a challenge
export function getTimeRemaining(challenge, currentTime = Date.now()) {
  const remaining = challenge.expiresAt - currentTime;

  if (remaining <= 0) {
    return { expired: true, hours: 0, minutes: 0, seconds: 0, formatted: 'Expired' };
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  let formatted;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    formatted = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else {
    formatted = `${minutes}m ${seconds}s`;
  }

  return { expired: false, hours, minutes, seconds, formatted };
}

// Check if player can claim any rewards
export function hasClaimableRewards(state) {
  return state.activeChallenges.some(c => c.status === 'completed');
}

// Get all claimable challenges
export function getClaimableChallenges(state) {
  return state.activeChallenges.filter(c => c.status === 'completed');
}

// Abandon a challenge (gives up on it without penalty other than lost progress)
export function abandonChallenge(state, challengeId) {
  const challenge = state.activeChallenges.find(c => c.id === challengeId);

  if (!challenge) {
    return { success: false, error: 'Challenge not found' };
  }

  if (challenge.status !== 'active') {
    return { success: false, error: 'Can only abandon active challenges' };
  }

  const abandonedChallenge = {
    ...challenge,
    status: 'abandoned',
    abandonedAt: Date.now()
  };

  return {
    success: true,
    state: {
      ...state,
      activeChallenges: state.activeChallenges.filter(c => c.id !== challengeId),
      completedChallenges: [...state.completedChallenges, abandonedChallenge]
    }
  };
}

// Get challenges that are about to expire (within specified hours)
export function getExpiringChallenges(state, withinHours = 2) {
  const threshold = Date.now() + (withinHours * 60 * 60 * 1000);
  return state.activeChallenges.filter(c =>
    c.status === 'active' && c.expiresAt <= threshold
  );
}

// Check if all daily challenges are complete
export function areDailyChallengesComplete(state) {
  const dailyChallenges = state.activeChallenges.filter(c => c.duration === 'DAILY');
  return dailyChallenges.length > 0 &&
    dailyChallenges.every(c => c.status === 'completed' || c.status !== 'active');
}

// Get streak bonus percentage
export function getStreakBonus(state) {
  return Math.min(state.streak * 10, 100);
}
