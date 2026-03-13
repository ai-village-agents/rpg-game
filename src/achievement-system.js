/**
 * Achievement System
 * Unlockable achievements with progress tracking and rewards
 */

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  COMBAT: { id: 'combat', name: 'Combat', icon: '&#9876;' },
  EXPLORATION: { id: 'exploration', name: 'Exploration', icon: '&#127757;' },
  COLLECTION: { id: 'collection', name: 'Collection', icon: '&#128230;' },
  SOCIAL: { id: 'social', name: 'Social', icon: '&#128101;' },
  CRAFTING: { id: 'crafting', name: 'Crafting', icon: '&#128295;' },
  PROGRESSION: { id: 'progression', name: 'Progression', icon: '&#11088;' },
  SECRET: { id: 'secret', name: 'Secret', icon: '&#10067;' },
  EVENT: { id: 'event', name: 'Event', icon: '&#127881;' }
};

// Achievement tiers
export const ACHIEVEMENT_TIERS = {
  BRONZE: { id: 'bronze', name: 'Bronze', points: 10, color: '#cd7f32' },
  SILVER: { id: 'silver', name: 'Silver', points: 25, color: '#c0c0c0' },
  GOLD: { id: 'gold', name: 'Gold', points: 50, color: '#ffd700' },
  PLATINUM: { id: 'platinum', name: 'Platinum', points: 100, color: '#e5e4e2' },
  DIAMOND: { id: 'diamond', name: 'Diamond', points: 200, color: '#b9f2ff' }
};

// Achievement types
export const ACHIEVEMENT_TYPES = {
  COUNTER: { id: 'counter', name: 'Counter', trackable: true },
  MILESTONE: { id: 'milestone', name: 'Milestone', trackable: false },
  COLLECTION: { id: 'collection', name: 'Collection', trackable: true },
  DISCOVERY: { id: 'discovery', name: 'Discovery', trackable: false }
};

// Reward types
export const REWARD_TYPES = {
  TITLE: { id: 'title', name: 'Title' },
  ITEM: { id: 'item', name: 'Item' },
  CURRENCY: { id: 'currency', name: 'Currency' },
  EXPERIENCE: { id: 'experience', name: 'Experience' },
  COSMETIC: { id: 'cosmetic', name: 'Cosmetic' },
  UNLOCK: { id: 'unlock', name: 'Unlock' }
};

/**
 * Get achievement state
 */
function getAchievementState(state) {
  return state.achievements || {
    definitions: {},
    unlocked: {},
    progress: {},
    points: 0,
    recentUnlocks: [],
    stats: {
      totalUnlocked: 0,
      bronzeCount: 0,
      silverCount: 0,
      goldCount: 0,
      platinumCount: 0,
      diamondCount: 0
    }
  };
}

/**
 * Initialize achievement state
 */
export function initAchievementState(state) {
  return {
    state: {
      ...state,
      achievements: {
        definitions: {},
        unlocked: {},
        progress: {},
        points: 0,
        recentUnlocks: [],
        stats: {
          totalUnlocked: 0,
          bronzeCount: 0,
          silverCount: 0,
          goldCount: 0,
          platinumCount: 0,
          diamondCount: 0
        }
      }
    },
    success: true
  };
}

/**
 * Register an achievement definition
 */
export function registerAchievement(state, achievement) {
  if (!achievement || !achievement.id) {
    return { state, success: false, error: 'Achievement ID required' };
  }

  if (!achievement.name) {
    return { state, success: false, error: 'Achievement name required' };
  }

  const achState = getAchievementState(state);

  if (achState.definitions[achievement.id]) {
    return { state, success: false, error: 'Achievement already registered' };
  }

  const category = ACHIEVEMENT_CATEGORIES[achievement.category?.toUpperCase()];
  const tier = ACHIEVEMENT_TIERS[achievement.tier?.toUpperCase()] || ACHIEVEMENT_TIERS.BRONZE;
  const type = ACHIEVEMENT_TYPES[achievement.type?.toUpperCase()] || ACHIEVEMENT_TYPES.MILESTONE;

  const definition = {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description || '',
    category: category?.id || 'progression',
    tier: tier.id,
    type: type.id,
    target: achievement.target || 1,
    hidden: achievement.hidden || false,
    rewards: achievement.rewards || [],
    prerequisite: achievement.prerequisite || null,
    createdAt: Date.now()
  };

  return {
    state: {
      ...state,
      achievements: {
        ...achState,
        definitions: {
          ...achState.definitions,
          [achievement.id]: definition
        }
      }
    },
    success: true,
    achievement: definition
  };
}

/**
 * Update achievement progress
 */
export function updateProgress(state, achievementId, amount = 1) {
  const achState = getAchievementState(state);
  const definition = achState.definitions[achievementId];

  if (!definition) {
    return { state, success: false, error: 'Achievement not found' };
  }

  // Already unlocked
  if (achState.unlocked[achievementId]) {
    return { state, success: true, alreadyUnlocked: true };
  }

  const currentProgress = achState.progress[achievementId] || 0;
  const newProgress = currentProgress + amount;

  // Check if unlocked
  if (newProgress >= definition.target) {
    return unlockAchievement(
      {
        ...state,
        achievements: {
          ...achState,
          progress: {
            ...achState.progress,
            [achievementId]: newProgress
          }
        }
      },
      achievementId
    );
  }

  return {
    state: {
      ...state,
      achievements: {
        ...achState,
        progress: {
          ...achState.progress,
          [achievementId]: newProgress
        }
      }
    },
    success: true,
    progress: newProgress,
    target: definition.target
  };
}

/**
 * Set absolute progress
 */
export function setProgress(state, achievementId, progress) {
  const achState = getAchievementState(state);
  const definition = achState.definitions[achievementId];

  if (!definition) {
    return { state, success: false, error: 'Achievement not found' };
  }

  if (achState.unlocked[achievementId]) {
    return { state, success: true, alreadyUnlocked: true };
  }

  if (progress >= definition.target) {
    return unlockAchievement(
      {
        ...state,
        achievements: {
          ...achState,
          progress: {
            ...achState.progress,
            [achievementId]: progress
          }
        }
      },
      achievementId
    );
  }

  return {
    state: {
      ...state,
      achievements: {
        ...achState,
        progress: {
          ...achState.progress,
          [achievementId]: progress
        }
      }
    },
    success: true,
    progress,
    target: definition.target
  };
}

/**
 * Unlock an achievement
 */
export function unlockAchievement(state, achievementId) {
  const achState = getAchievementState(state);
  const definition = achState.definitions[achievementId];

  if (!definition) {
    return { state, success: false, error: 'Achievement not found' };
  }

  if (achState.unlocked[achievementId]) {
    return { state, success: false, error: 'Already unlocked' };
  }

  // Check prerequisite
  if (definition.prerequisite && !achState.unlocked[definition.prerequisite]) {
    return { state, success: false, error: 'Prerequisite not met' };
  }

  const tier = ACHIEVEMENT_TIERS[definition.tier.toUpperCase()];
  const points = tier?.points || 10;

  const unlockData = {
    achievementId,
    unlockedAt: Date.now(),
    tier: definition.tier
  };

  const tierCountKey = `${definition.tier}Count`;

  return {
    state: {
      ...state,
      achievements: {
        ...achState,
        unlocked: {
          ...achState.unlocked,
          [achievementId]: unlockData
        },
        points: achState.points + points,
        recentUnlocks: [unlockData, ...achState.recentUnlocks.slice(0, 9)],
        stats: {
          ...achState.stats,
          totalUnlocked: achState.stats.totalUnlocked + 1,
          [tierCountKey]: (achState.stats[tierCountKey] || 0) + 1
        }
      }
    },
    success: true,
    achievement: definition,
    points,
    rewards: definition.rewards
  };
}

/**
 * Check if achievement is unlocked
 */
export function isUnlocked(state, achievementId) {
  const achState = getAchievementState(state);
  return !!achState.unlocked[achievementId];
}

/**
 * Get achievement progress
 */
export function getProgress(state, achievementId) {
  const achState = getAchievementState(state);
  const definition = achState.definitions[achievementId];

  if (!definition) {
    return { found: false };
  }

  const current = achState.progress[achievementId] || 0;
  const unlocked = !!achState.unlocked[achievementId];

  return {
    found: true,
    current,
    target: definition.target,
    percentage: Math.min(100, Math.floor((current / definition.target) * 100)),
    unlocked
  };
}

/**
 * Get all achievements by category
 */
export function getAchievementsByCategory(state, category) {
  const achState = getAchievementState(state);
  const achievements = Object.values(achState.definitions);

  if (!category) {
    return achievements;
  }

  return achievements.filter(a => a.category === category);
}

/**
 * Get unlocked achievements
 */
export function getUnlockedAchievements(state) {
  const achState = getAchievementState(state);
  return Object.keys(achState.unlocked).map(id => ({
    ...achState.definitions[id],
    ...achState.unlocked[id]
  }));
}

/**
 * Get locked achievements
 */
export function getLockedAchievements(state, includeHidden = false) {
  const achState = getAchievementState(state);
  const locked = Object.values(achState.definitions).filter(
    a => !achState.unlocked[a.id] && (includeHidden || !a.hidden)
  );
  return locked;
}

/**
 * Get recent unlocks
 */
export function getRecentUnlocks(state, count = 5) {
  const achState = getAchievementState(state);
  return achState.recentUnlocks.slice(0, count).map(u => ({
    ...achState.definitions[u.achievementId],
    ...u
  }));
}

/**
 * Get achievement stats
 */
export function getAchievementStats(state) {
  const achState = getAchievementState(state);
  const totalDefined = Object.keys(achState.definitions).length;

  return {
    ...achState.stats,
    points: achState.points,
    totalDefined,
    completionPercentage: totalDefined > 0
      ? Math.floor((achState.stats.totalUnlocked / totalDefined) * 100)
      : 0
  };
}

/**
 * Get total points
 */
export function getTotalPoints(state) {
  const achState = getAchievementState(state);
  return achState.points;
}

/**
 * Get achievement by ID
 */
export function getAchievement(state, achievementId) {
  const achState = getAchievementState(state);
  const definition = achState.definitions[achievementId];

  if (!definition) {
    return null;
  }

  const progress = achState.progress[achievementId] || 0;
  const unlocked = achState.unlocked[achievementId];

  return {
    ...definition,
    progress,
    unlocked: !!unlocked,
    unlockedAt: unlocked?.unlockedAt || null
  };
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(state, tier) {
  const achState = getAchievementState(state);
  return Object.values(achState.definitions).filter(a => a.tier === tier);
}

/**
 * Check multiple achievements at once
 */
export function checkAchievements(state, checks) {
  let currentState = state;
  const results = [];

  for (const check of checks) {
    const { achievementId, progress } = check;

    if (progress !== undefined) {
      const result = setProgress(currentState, achievementId, progress);
      currentState = result.state;
      results.push({ achievementId, ...result });
    } else {
      const result = unlockAchievement(currentState, achievementId);
      currentState = result.state;
      results.push({ achievementId, ...result });
    }
  }

  return {
    state: currentState,
    results,
    success: true
  };
}

/**
 * Reset achievement progress (for debugging/testing)
 */
export function resetProgress(state, achievementId) {
  const achState = getAchievementState(state);

  if (!achState.definitions[achievementId]) {
    return { state, success: false, error: 'Achievement not found' };
  }

  const { [achievementId]: _, ...remainingProgress } = achState.progress;
  const { [achievementId]: __, ...remainingUnlocked } = achState.unlocked;

  let pointsToRemove = 0;
  if (achState.unlocked[achievementId]) {
    const definition = achState.definitions[achievementId];
    const tier = ACHIEVEMENT_TIERS[definition.tier.toUpperCase()];
    pointsToRemove = tier?.points || 10;
  }

  return {
    state: {
      ...state,
      achievements: {
        ...achState,
        progress: remainingProgress,
        unlocked: remainingUnlocked,
        points: Math.max(0, achState.points - pointsToRemove)
      }
    },
    success: true
  };
}

/**
 * Get available rewards from unlocked achievements
 */
export function getAvailableRewards(state) {
  const achState = getAchievementState(state);
  const rewards = [];

  for (const achievementId of Object.keys(achState.unlocked)) {
    const definition = achState.definitions[achievementId];
    if (definition?.rewards) {
      rewards.push(...definition.rewards.map(r => ({
        ...r,
        fromAchievement: achievementId
      })));
    }
  }

  return rewards;
}

/**
 * Get completion summary for a category
 */
export function getCategorySummary(state, category) {
  const achState = getAchievementState(state);
  const achievements = Object.values(achState.definitions).filter(
    a => a.category === category
  );

  const total = achievements.length;
  const unlocked = achievements.filter(a => achState.unlocked[a.id]).length;

  return {
    category,
    total,
    unlocked,
    locked: total - unlocked,
    percentage: total > 0 ? Math.floor((unlocked / total) * 100) : 0
  };
}

/**
 * Get all category summaries
 */
export function getAllCategorySummaries(state) {
  return Object.values(ACHIEVEMENT_CATEGORIES).map(cat =>
    getCategorySummary(state, cat.id)
  );
}
