/**
 * Achievement System
 * Track and unlock achievements, badges, and milestones
 */

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  COMBAT: { name: 'Combat', icon: '⚔️', color: '#F44336' },
  EXPLORATION: { name: 'Exploration', icon: '🗺️', color: '#4CAF50' },
  COLLECTION: { name: 'Collection', icon: '📦', color: '#FF9800' },
  SOCIAL: { name: 'Social', icon: '👥', color: '#2196F3' },
  CRAFTING: { name: 'Crafting', icon: '🔨', color: '#795548' },
  QUESTING: { name: 'Questing', icon: '📜', color: '#9C27B0' },
  PROGRESSION: { name: 'Progression', icon: '📈', color: '#00BCD4' },
  SECRET: { name: 'Secret', icon: '❓', color: '#607D8B' }
};

// Achievement tiers
export const ACHIEVEMENT_TIERS = {
  BRONZE: { name: 'Bronze', color: '#CD7F32', points: 10, multiplier: 1 },
  SILVER: { name: 'Silver', color: '#C0C0C0', points: 25, multiplier: 1.5 },
  GOLD: { name: 'Gold', color: '#FFD700', points: 50, multiplier: 2 },
  PLATINUM: { name: 'Platinum', color: '#E5E4E2', points: 100, multiplier: 3 },
  DIAMOND: { name: 'Diamond', color: '#B9F2FF', points: 200, multiplier: 5 }
};

// Reward types
export const ACHIEVEMENT_REWARDS = {
  TITLE: 'title',
  BADGE: 'badge',
  CURRENCY: 'currency',
  ITEM: 'item',
  UNLOCK: 'unlock'
};

// Create initial achievement state
export function createAchievementState() {
  return {
    unlocked: {},
    progress: {},
    totalPoints: 0,
    titles: [],
    activeTitle: null,
    badges: [],
    displayedBadges: [],
    recentUnlocks: [],
    stats: {
      totalUnlocked: 0,
      byCategory: {},
      byTier: {},
      secretsFound: 0
    }
  };
}

// Create an achievement definition
export function createAchievement(id, name, description, category, tier, requirements, rewards = []) {
  if (!id || !name) {
    return { success: false, error: 'Invalid achievement id or name' };
  }

  if (!ACHIEVEMENT_CATEGORIES[category?.toUpperCase()]) {
    return { success: false, error: 'Invalid category' };
  }

  if (!ACHIEVEMENT_TIERS[tier?.toUpperCase()]) {
    return { success: false, error: 'Invalid tier' };
  }

  return {
    success: true,
    achievement: {
      id,
      name,
      description,
      category: category.toUpperCase(),
      tier: tier.toUpperCase(),
      requirements,
      rewards,
      isSecret: category.toUpperCase() === 'SECRET',
      createdAt: Date.now()
    }
  };
}

// Create achievement registry
export function createAchievementRegistry() {
  return {
    achievements: {},
    byCategory: {},
    byTier: {},
    triggers: {}
  };
}

// Register achievement
export function registerAchievement(registry, achievement) {
  if (!achievement || !achievement.id) {
    return { success: false, error: 'Invalid achievement' };
  }

  if (registry.achievements[achievement.id]) {
    return { success: false, error: 'Achievement already registered' };
  }

  const newAchievements = { ...registry.achievements, [achievement.id]: achievement };

  // Index by category
  const newByCategory = { ...registry.byCategory };
  newByCategory[achievement.category] = [...(newByCategory[achievement.category] || []), achievement.id];

  // Index by tier
  const newByTier = { ...registry.byTier };
  newByTier[achievement.tier] = [...(newByTier[achievement.tier] || []), achievement.id];

  // Index by trigger
  const newTriggers = { ...registry.triggers };
  if (achievement.requirements?.trigger) {
    const trigger = achievement.requirements.trigger;
    newTriggers[trigger] = [...(newTriggers[trigger] || []), achievement.id];
  }

  return {
    success: true,
    registry: {
      achievements: newAchievements,
      byCategory: newByCategory,
      byTier: newByTier,
      triggers: newTriggers
    }
  };
}

// Check if achievement is unlocked
export function isAchievementUnlocked(state, achievementId) {
  return !!state.unlocked[achievementId];
}

// Get achievement progress
export function getAchievementProgress(state, achievementId) {
  return state.progress[achievementId] || { current: 0, target: 1 };
}

// Update achievement progress
export function updateProgress(state, registry, achievementId, amount = 1) {
  const achievement = registry.achievements[achievementId];
  if (!achievement) {
    return { success: false, error: 'Achievement not found' };
  }

  if (isAchievementUnlocked(state, achievementId)) {
    return { success: false, error: 'Achievement already unlocked' };
  }

  const target = achievement.requirements?.count || 1;
  const currentProgress = state.progress[achievementId] || { current: 0, target };
  const newCurrent = Math.min(currentProgress.current + amount, target);

  const shouldUnlock = newCurrent >= target;

  let newState = {
    ...state,
    progress: {
      ...state.progress,
      [achievementId]: { current: newCurrent, target }
    }
  };

  // Auto-unlock if target reached
  if (shouldUnlock) {
    const unlockResult = unlockAchievement(newState, registry, achievementId);
    if (unlockResult.success) {
      newState = unlockResult.state;
    }
  }

  return {
    success: true,
    progress: newCurrent,
    target,
    justUnlocked: shouldUnlock,
    state: newState
  };
}

// Unlock achievement
export function unlockAchievement(state, registry, achievementId) {
  const achievement = registry.achievements[achievementId];
  if (!achievement) {
    return { success: false, error: 'Achievement not found' };
  }

  if (isAchievementUnlocked(state, achievementId)) {
    return { success: false, error: 'Achievement already unlocked' };
  }

  const tier = ACHIEVEMENT_TIERS[achievement.tier];
  const points = tier.points;

  // Process rewards
  let newTitles = [...state.titles];
  let newBadges = [...state.badges];

  for (const reward of achievement.rewards || []) {
    if (reward.type === ACHIEVEMENT_REWARDS.TITLE) {
      newTitles.push(reward.value);
    } else if (reward.type === ACHIEVEMENT_REWARDS.BADGE) {
      newBadges.push(reward.value);
    }
  }

  // Update stats
  const newByCategory = { ...state.stats.byCategory };
  newByCategory[achievement.category] = (newByCategory[achievement.category] || 0) + 1;

  const newByTier = { ...state.stats.byTier };
  newByTier[achievement.tier] = (newByTier[achievement.tier] || 0) + 1;

  const unlockRecord = {
    achievementId,
    timestamp: Date.now(),
    points
  };

  return {
    success: true,
    achievement,
    points,
    rewards: achievement.rewards,
    state: {
      ...state,
      unlocked: {
        ...state.unlocked,
        [achievementId]: unlockRecord
      },
      progress: {
        ...state.progress,
        [achievementId]: { current: achievement.requirements?.count || 1, target: achievement.requirements?.count || 1 }
      },
      totalPoints: state.totalPoints + points,
      titles: newTitles,
      badges: newBadges,
      recentUnlocks: [...state.recentUnlocks.slice(-9), unlockRecord],
      stats: {
        ...state.stats,
        totalUnlocked: state.stats.totalUnlocked + 1,
        byCategory: newByCategory,
        byTier: newByTier,
        secretsFound: state.stats.secretsFound + (achievement.isSecret ? 1 : 0)
      }
    }
  };
}

// Trigger-based achievement check
export function checkTrigger(state, registry, trigger, data = {}) {
  const achievementIds = registry.triggers[trigger] || [];
  const results = [];

  let newState = state;

  for (const achievementId of achievementIds) {
    const achievement = registry.achievements[achievementId];
    if (!achievement || isAchievementUnlocked(newState, achievementId)) {
      continue;
    }

    // Check if requirements are met
    let shouldProgress = true;
    const requirements = achievement.requirements;

    if (requirements.minValue !== undefined && data.value < requirements.minValue) {
      shouldProgress = false;
    }
    if (requirements.targetId && data.targetId !== requirements.targetId) {
      shouldProgress = false;
    }

    if (shouldProgress) {
      const amount = data.amount || 1;
      const result = updateProgress(newState, registry, achievementId, amount);
      if (result.success) {
        newState = result.state;
        results.push({
          achievementId,
          progress: result.progress,
          target: result.target,
          justUnlocked: result.justUnlocked
        });
      }
    }
  }

  return {
    triggered: results.length > 0,
    results,
    state: newState
  };
}

// Set active title
export function setActiveTitle(state, title) {
  if (title !== null && !state.titles.includes(title)) {
    return { success: false, error: 'Title not unlocked' };
  }

  return {
    success: true,
    state: {
      ...state,
      activeTitle: title
    }
  };
}

// Set displayed badges
export function setDisplayedBadges(state, badges, maxBadges = 3) {
  // Validate all badges are unlocked
  for (const badge of badges) {
    if (!state.badges.includes(badge)) {
      return { success: false, error: `Badge not unlocked: ${badge}` };
    }
  }

  return {
    success: true,
    state: {
      ...state,
      displayedBadges: badges.slice(0, maxBadges)
    }
  };
}

// Get achievements by category
export function getAchievementsByCategory(registry, category) {
  const categoryKey = category.toUpperCase();
  const ids = registry.byCategory[categoryKey] || [];
  return ids.map(id => registry.achievements[id]);
}

// Get achievements by tier
export function getAchievementsByTier(registry, tier) {
  const tierKey = tier.toUpperCase();
  const ids = registry.byTier[tierKey] || [];
  return ids.map(id => registry.achievements[id]);
}

// Get unlocked achievements
export function getUnlockedAchievements(state, registry) {
  return Object.keys(state.unlocked).map(id => ({
    ...registry.achievements[id],
    unlockedAt: state.unlocked[id].timestamp,
    points: state.unlocked[id].points
  }));
}

// Get locked achievements (non-secret)
export function getLockedAchievements(state, registry) {
  return Object.values(registry.achievements)
    .filter(a => !isAchievementUnlocked(state, a.id) && !a.isSecret)
    .map(a => ({
      ...a,
      progress: getAchievementProgress(state, a.id)
    }));
}

// Get achievement completion stats
export function getCompletionStats(state, registry) {
  const total = Object.keys(registry.achievements).length;
  const unlocked = state.stats.totalUnlocked;
  const secretTotal = Object.values(registry.achievements).filter(a => a.isSecret).length;

  const categoryStats = {};
  for (const [category, ids] of Object.entries(registry.byCategory)) {
    const categoryUnlocked = state.stats.byCategory[category] || 0;
    categoryStats[category] = {
      total: ids.length,
      unlocked: categoryUnlocked,
      percent: ids.length > 0 ? Math.round((categoryUnlocked / ids.length) * 100) : 0
    };
  }

  const tierStats = {};
  for (const [tier, ids] of Object.entries(registry.byTier)) {
    const tierUnlocked = state.stats.byTier[tier] || 0;
    tierStats[tier] = {
      total: ids.length,
      unlocked: tierUnlocked,
      percent: ids.length > 0 ? Math.round((tierUnlocked / ids.length) * 100) : 0
    };
  }

  return {
    total,
    unlocked,
    percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    points: state.totalPoints,
    secretsFound: state.stats.secretsFound,
    secretsTotal: secretTotal,
    byCategory: categoryStats,
    byTier: tierStats
  };
}

// Get recent unlocks
export function getRecentUnlocks(state, registry, limit = 5) {
  return state.recentUnlocks
    .slice(-limit)
    .reverse()
    .map(record => ({
      ...registry.achievements[record.achievementId],
      unlockedAt: record.timestamp,
      points: record.points
    }));
}

// Search achievements
export function searchAchievements(registry, query) {
  const lowerQuery = query.toLowerCase();
  return Object.values(registry.achievements).filter(a =>
    a.name.toLowerCase().includes(lowerQuery) ||
    a.description.toLowerCase().includes(lowerQuery)
  );
}

// Get achievement details
export function getAchievementDetails(state, registry, achievementId) {
  const achievement = registry.achievements[achievementId];
  if (!achievement) return null;

  const isUnlocked = isAchievementUnlocked(state, achievementId);
  const progress = getAchievementProgress(state, achievementId);
  const tier = ACHIEVEMENT_TIERS[achievement.tier];
  const category = ACHIEVEMENT_CATEGORIES[achievement.category];

  return {
    ...achievement,
    isUnlocked,
    progress,
    percentComplete: progress.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0,
    tierInfo: tier,
    categoryInfo: category,
    unlockedAt: isUnlocked ? state.unlocked[achievementId].timestamp : null
  };
}

// Get category info
export function getCategoryInfo(category) {
  return ACHIEVEMENT_CATEGORIES[category?.toUpperCase()] || null;
}

// Get tier info
export function getTierInfo(tier) {
  return ACHIEVEMENT_TIERS[tier?.toUpperCase()] || null;
}

// Calculate points to next tier
export function getPointsToNextTier(totalPoints) {
  const tiers = [
    { points: 100, name: 'Bronze' },
    { points: 500, name: 'Silver' },
    { points: 1500, name: 'Gold' },
    { points: 3500, name: 'Platinum' },
    { points: 7000, name: 'Diamond' }
  ];

  for (const tier of tiers) {
    if (totalPoints < tier.points) {
      return {
        currentPoints: totalPoints,
        nextTier: tier.name,
        pointsNeeded: tier.points,
        remaining: tier.points - totalPoints
      };
    }
  }

  return {
    currentPoints: totalPoints,
    nextTier: null,
    pointsNeeded: null,
    remaining: 0
  };
}

// Get player rank based on points
export function getPlayerRank(totalPoints) {
  if (totalPoints >= 7000) return { rank: 'Diamond', color: '#B9F2FF' };
  if (totalPoints >= 3500) return { rank: 'Platinum', color: '#E5E4E2' };
  if (totalPoints >= 1500) return { rank: 'Gold', color: '#FFD700' };
  if (totalPoints >= 500) return { rank: 'Silver', color: '#C0C0C0' };
  if (totalPoints >= 100) return { rank: 'Bronze', color: '#CD7F32' };
  return { rank: 'Unranked', color: '#888888' };
}

// Get showcase (titles + badges)
export function getShowcase(state) {
  return {
    activeTitle: state.activeTitle,
    displayedBadges: state.displayedBadges,
    availableTitles: state.titles,
    availableBadges: state.badges
  };
}

// Create achievement helper functions
export function createCombatAchievement(id, name, description, tier, killCount, rewards = []) {
  return createAchievement(id, name, description, 'COMBAT', tier, {
    trigger: 'enemy_killed',
    count: killCount
  }, rewards);
}

export function createExplorationAchievement(id, name, description, tier, areaCount, rewards = []) {
  return createAchievement(id, name, description, 'EXPLORATION', tier, {
    trigger: 'area_discovered',
    count: areaCount
  }, rewards);
}

export function createCollectionAchievement(id, name, description, tier, itemCount, rewards = []) {
  return createAchievement(id, name, description, 'COLLECTION', tier, {
    trigger: 'item_collected',
    count: itemCount
  }, rewards);
}
