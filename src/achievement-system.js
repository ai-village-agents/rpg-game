/**
 * Achievement System
 * Tracks player milestones and rewards
 */

/**
 * Achievement categories
 */
export const ACHIEVEMENT_CATEGORY = {
  COMBAT: 'combat',
  EXPLORATION: 'exploration',
  COLLECTION: 'collection',
  SOCIAL: 'social',
  PROGRESSION: 'progression',
  SECRET: 'secret',
};

/**
 * Achievement rarity
 */
export const ACHIEVEMENT_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

/**
 * Achievement trigger types
 */
export const TRIGGER_TYPE = {
  CUMULATIVE: 'cumulative',
  SINGLE: 'single',
  MULTI_CONDITION: 'multi',
};

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
  // Combat achievements
  'first-blood': {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Defeat your first enemy in combat.',
    icon: '\u2694\uFE0F',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'enemiesDefeated', threshold: 1 },
    rewards: { xp: 25, gold: 10 },
    hidden: false,
  },
  'warrior-apprentice': {
    id: 'warrior-apprentice',
    name: 'Warrior Apprentice',
    description: 'Defeat 25 enemies.',
    icon: '\uD83D\uDDE1\uFE0F',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'enemiesDefeated', threshold: 25 },
    rewards: { xp: 100, gold: 50 },
    hidden: false,
  },
  'battle-hardened': {
    id: 'battle-hardened',
    name: 'Battle Hardened',
    description: 'Defeat 100 enemies.',
    icon: '\uD83D\uDEE1\uFE0F',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'enemiesDefeated', threshold: 100 },
    rewards: { xp: 500, gold: 200, items: ['warrior-badge'] },
    hidden: false,
  },
  'slayer': {
    id: 'slayer',
    name: 'Slayer',
    description: 'Defeat 500 enemies.',
    icon: '\uD83D\uDC80',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'enemiesDefeated', threshold: 500 },
    rewards: { xp: 2000, gold: 1000, items: ['slayer-ring'] },
    hidden: false,
  },
  'boss-hunter': {
    id: 'boss-hunter',
    name: 'Boss Hunter',
    description: 'Defeat your first boss.',
    icon: '\uD83D\uDC09',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'bossesDefeated', threshold: 1 },
    rewards: { xp: 250, gold: 150 },
    hidden: false,
  },
  'no-damage-victory': {
    id: 'no-damage-victory',
    name: 'Untouchable',
    description: 'Win a battle without taking any damage.',
    icon: '\u2728',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.SINGLE, event: 'flawlessVictory' },
    rewards: { xp: 500, items: ['dodge-charm'] },
    hidden: false,
  },
  'critical-master': {
    id: 'critical-master',
    name: 'Critical Master',
    description: 'Land 100 critical hits.',
    icon: '\uD83D\uDCA5',
    category: ACHIEVEMENT_CATEGORY.COMBAT,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'criticalHits', threshold: 100 },
    rewards: { xp: 300, gold: 100 },
    hidden: false,
  },

  // Exploration achievements
  'curious-wanderer': {
    id: 'curious-wanderer',
    name: 'Curious Wanderer',
    description: 'Discover 5 different locations.',
    icon: '\uD83D\uDDFA\uFE0F',
    category: ACHIEVEMENT_CATEGORY.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'locationsDiscovered', threshold: 5 },
    rewards: { xp: 75 },
    hidden: false,
  },
  'pathfinder': {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Discover 20 different locations.',
    icon: '\uD83E\uDDED',
    category: ACHIEVEMENT_CATEGORY.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'locationsDiscovered', threshold: 20 },
    rewards: { xp: 400, items: ['explorer-boots'] },
    hidden: false,
  },
  'treasure-hunter': {
    id: 'treasure-hunter',
    name: 'Treasure Hunter',
    description: 'Open 25 treasure chests.',
    icon: '\uD83D\uDCBC',
    category: ACHIEVEMENT_CATEGORY.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'chestsOpened', threshold: 25 },
    rewards: { xp: 200, gold: 300 },
    hidden: false,
  },
  'dungeon-delver': {
    id: 'dungeon-delver',
    name: 'Dungeon Delver',
    description: 'Complete 10 dungeons.',
    icon: '\uD83C\uDFF0',
    category: ACHIEVEMENT_CATEGORY.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'dungeonsCompleted', threshold: 10 },
    rewards: { xp: 750, items: ['dungeon-key'] },
    hidden: false,
  },

  // Collection achievements
  'pack-rat': {
    id: 'pack-rat',
    name: 'Pack Rat',
    description: 'Collect 50 different items.',
    icon: '\uD83C\uDF92',
    category: ACHIEVEMENT_CATEGORY.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'uniqueItemsCollected', threshold: 50 },
    rewards: { xp: 300, gold: 100 },
    hidden: false,
  },
  'gold-hoarder': {
    id: 'gold-hoarder',
    name: 'Gold Hoarder',
    description: 'Accumulate 10,000 gold.',
    icon: '\uD83D\uDCB0',
    category: ACHIEVEMENT_CATEGORY.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'totalGoldEarned', threshold: 10000 },
    rewards: { xp: 500, items: ['gold-ring'] },
    hidden: false,
  },
  'potion-brewer': {
    id: 'potion-brewer',
    name: 'Potion Brewer',
    description: 'Use 50 potions.',
    icon: '\uD83E\uDDEA',
    category: ACHIEVEMENT_CATEGORY.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'potionsUsed', threshold: 50 },
    rewards: { xp: 150 },
    hidden: false,
  },
  'equipment-collector': {
    id: 'equipment-collector',
    name: 'Equipment Collector',
    description: 'Collect 25 pieces of equipment.',
    icon: '\uD83D\uDEE0\uFE0F',
    category: ACHIEVEMENT_CATEGORY.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'equipmentCollected', threshold: 25 },
    rewards: { xp: 250, gold: 150 },
    hidden: false,
  },

  // Social achievements
  'socialite': {
    id: 'socialite',
    name: 'Socialite',
    description: 'Talk to 10 different NPCs.',
    icon: '\uD83D\uDCAC',
    category: ACHIEVEMENT_CATEGORY.SOCIAL,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'npcsTalkedTo', threshold: 10 },
    rewards: { xp: 50, gold: 25 },
    hidden: false,
  },
  'team-player': {
    id: 'team-player',
    name: 'Team Player',
    description: 'Recruit all party members.',
    icon: '\uD83D\uDC65',
    category: ACHIEVEMENT_CATEGORY.SOCIAL,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'partyMembersRecruited', threshold: 6 },
    rewards: { xp: 1000, items: ['friendship-amulet'] },
    hidden: false,
  },
  'quest-helper': {
    id: 'quest-helper',
    name: 'Quest Helper',
    description: 'Complete 10 side quests.',
    icon: '\uD83D\uDCDD',
    category: ACHIEVEMENT_CATEGORY.SOCIAL,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'sideQuestsCompleted', threshold: 10 },
    rewards: { xp: 400, gold: 200 },
    hidden: false,
  },

  // Progression achievements
  'level-5': {
    id: 'level-5',
    name: 'Getting Started',
    description: 'Reach level 5.',
    icon: '\u2B50',
    category: ACHIEVEMENT_CATEGORY.PROGRESSION,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'playerLevel', threshold: 5 },
    rewards: { xp: 100 },
    hidden: false,
  },
  'level-10': {
    id: 'level-10',
    name: 'Rising Hero',
    description: 'Reach level 10.',
    icon: '\uD83C\uDF1F',
    category: ACHIEVEMENT_CATEGORY.PROGRESSION,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'playerLevel', threshold: 10 },
    rewards: { xp: 300, items: ['exp-boost-scroll'] },
    hidden: false,
  },
  'level-25': {
    id: 'level-25',
    name: 'Veteran',
    description: 'Reach level 25.',
    icon: '\uD83D\uDCAA',
    category: ACHIEVEMENT_CATEGORY.PROGRESSION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'playerLevel', threshold: 25 },
    rewards: { xp: 1000, gold: 500 },
    hidden: false,
  },
  'skill-master': {
    id: 'skill-master',
    name: 'Skill Master',
    description: 'Unlock 20 skills.',
    icon: '\uD83C\uDF93',
    category: ACHIEVEMENT_CATEGORY.PROGRESSION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.CUMULATIVE, stat: 'skillsUnlocked', threshold: 20 },
    rewards: { xp: 750, items: ['skill-tome'] },
    hidden: false,
  },
  'main-story-complete': {
    id: 'main-story-complete',
    name: 'Story Complete',
    description: 'Complete the main story.',
    icon: '\uD83C\uDFC6',
    category: ACHIEVEMENT_CATEGORY.PROGRESSION,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    trigger: { type: TRIGGER_TYPE.SINGLE, event: 'mainStoryComplete' },
    rewards: { xp: 5000, gold: 2500, items: ['hero-medal'] },
    hidden: false,
  },

  // Secret achievements
  'secret-area': {
    id: 'secret-area',
    name: '???',
    description: 'Find a hidden area.',
    icon: '\u2753',
    category: ACHIEVEMENT_CATEGORY.SECRET,
    rarity: ACHIEVEMENT_RARITY.RARE,
    trigger: { type: TRIGGER_TYPE.SINGLE, event: 'secretAreaFound' },
    rewards: { xp: 500, items: ['secret-map'] },
    hidden: true,
    unlockedName: 'Secret Keeper',
    unlockedDescription: 'You found a hidden area!',
  },
  'speed-runner': {
    id: 'speed-runner',
    name: '???',
    description: 'A mysterious achievement.',
    icon: '\u2753',
    category: ACHIEVEMENT_CATEGORY.SECRET,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    trigger: { type: TRIGGER_TYPE.SINGLE, event: 'speedRunComplete' },
    rewards: { xp: 2500, items: ['haste-boots'] },
    hidden: true,
    unlockedName: 'Speed Demon',
    unlockedDescription: 'Complete the game in under 2 hours.',
  },
};

/**
 * Create achievement state
 * @returns {Object} Achievement state
 */
export function createAchievementState() {
  return {
    unlocked: [],
    progress: {},
    stats: {
      enemiesDefeated: 0,
      bossesDefeated: 0,
      criticalHits: 0,
      locationsDiscovered: 0,
      chestsOpened: 0,
      dungeonsCompleted: 0,
      uniqueItemsCollected: 0,
      totalGoldEarned: 0,
      potionsUsed: 0,
      equipmentCollected: 0,
      npcsTalkedTo: 0,
      partyMembersRecruited: 0,
      sideQuestsCompleted: 0,
      playerLevel: 1,
      skillsUnlocked: 0,
    },
    totalPoints: 0,
    lastUnlocked: null,
  };
}

/**
 * Get achievement data by ID
 * @param {string} achievementId - Achievement ID
 * @returns {Object|null} Achievement data
 */
export function getAchievementData(achievementId) {
  return ACHIEVEMENTS[achievementId] || null;
}

/**
 * Get all achievements
 * @returns {Array} All achievement definitions
 */
export function getAllAchievements() {
  return Object.values(ACHIEVEMENTS);
}

/**
 * Get achievements by category
 * @param {string} category - Achievement category
 * @returns {Array} Achievements in that category
 */
export function getAchievementsByCategory(category) {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
}

/**
 * Get achievements by rarity
 * @param {string} rarity - Achievement rarity
 * @returns {Array} Achievements of that rarity
 */
export function getAchievementsByRarity(rarity) {
  return Object.values(ACHIEVEMENTS).filter(a => a.rarity === rarity);
}

/**
 * Check if achievement is unlocked
 * @param {Object} state - Achievement state
 * @param {string} achievementId - Achievement ID
 * @returns {boolean} Whether achievement is unlocked
 */
export function isAchievementUnlocked(state, achievementId) {
  return state.unlocked.includes(achievementId);
}

/**
 * Get achievement progress
 * @param {Object} state - Achievement state
 * @param {string} achievementId - Achievement ID
 * @returns {Object} Progress info
 */
export function getAchievementProgress(state, achievementId) {
  const achievement = getAchievementData(achievementId);
  if (!achievement) return { current: 0, target: 0, percent: 0 };

  if (isAchievementUnlocked(state, achievementId)) {
    return { current: 1, target: 1, percent: 100, complete: true };
  }

  const trigger = achievement.trigger;
  if (trigger.type === TRIGGER_TYPE.CUMULATIVE) {
    const current = state.stats[trigger.stat] || 0;
    const target = trigger.threshold;
    const percent = Math.min(100, Math.floor((current / target) * 100));
    return { current, target, percent, complete: current >= target };
  }

  return { current: 0, target: 1, percent: 0, complete: false };
}

/**
 * Update a stat
 * @param {Object} state - Achievement state
 * @param {string} statName - Stat name
 * @param {number} amount - Amount to add
 * @returns {Object} Result with state and any newly unlocked achievements
 */
export function updateStat(state, statName, amount = 1) {
  if (!state.stats.hasOwnProperty(statName)) {
    return { state, newlyUnlocked: [] };
  }

  const newStats = {
    ...state.stats,
    [statName]: (state.stats[statName] || 0) + amount,
  };

  const newState = { ...state, stats: newStats };
  return checkAchievements(newState);
}

/**
 * Set a stat value
 * @param {Object} state - Achievement state
 * @param {string} statName - Stat name
 * @param {number} value - New value
 * @returns {Object} Result with state and any newly unlocked achievements
 */
export function setStat(state, statName, value) {
  if (!state.stats.hasOwnProperty(statName)) {
    return { state, newlyUnlocked: [] };
  }

  const newStats = {
    ...state.stats,
    [statName]: value,
  };

  const newState = { ...state, stats: newStats };
  return checkAchievements(newState);
}

/**
 * Trigger a single event
 * @param {Object} state - Achievement state
 * @param {string} eventName - Event name
 * @returns {Object} Result with state and any newly unlocked achievements
 */
export function triggerEvent(state, eventName) {
  const newlyUnlocked = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (isAchievementUnlocked(state, achievement.id)) continue;

    const trigger = achievement.trigger;
    if (trigger.type === TRIGGER_TYPE.SINGLE && trigger.event === eventName) {
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length === 0) {
    return { state, newlyUnlocked: [] };
  }

  return unlockAchievements(state, newlyUnlocked);
}

/**
 * Check all achievements for unlocks
 * @param {Object} state - Achievement state
 * @returns {Object} Result with state and any newly unlocked achievements
 */
export function checkAchievements(state) {
  const newlyUnlocked = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (isAchievementUnlocked(state, achievement.id)) continue;

    const trigger = achievement.trigger;
    if (trigger.type === TRIGGER_TYPE.CUMULATIVE) {
      const current = state.stats[trigger.stat] || 0;
      if (current >= trigger.threshold) {
        newlyUnlocked.push(achievement);
      }
    }
  }

  if (newlyUnlocked.length === 0) {
    return { state, newlyUnlocked: [] };
  }

  return unlockAchievements(state, newlyUnlocked);
}

/**
 * Unlock achievements
 * @param {Object} state - Achievement state
 * @param {Array} achievements - Achievements to unlock
 * @returns {Object} Result with updated state
 */
function unlockAchievements(state, achievements) {
  const newUnlocked = [...state.unlocked];
  let newPoints = state.totalPoints;

  for (const achievement of achievements) {
    if (!newUnlocked.includes(achievement.id)) {
      newUnlocked.push(achievement.id);
      newPoints += getAchievementPoints(achievement);
    }
  }

  return {
    state: {
      ...state,
      unlocked: newUnlocked,
      totalPoints: newPoints,
      lastUnlocked: achievements[achievements.length - 1]?.id || state.lastUnlocked,
    },
    newlyUnlocked: achievements,
  };
}

/**
 * Get points for an achievement
 * @param {Object} achievement - Achievement data
 * @returns {number} Points value
 */
export function getAchievementPoints(achievement) {
  const pointsMap = {
    [ACHIEVEMENT_RARITY.COMMON]: 10,
    [ACHIEVEMENT_RARITY.UNCOMMON]: 25,
    [ACHIEVEMENT_RARITY.RARE]: 50,
    [ACHIEVEMENT_RARITY.EPIC]: 100,
    [ACHIEVEMENT_RARITY.LEGENDARY]: 200,
  };
  return pointsMap[achievement.rarity] || 10;
}

/**
 * Get unlocked achievements
 * @param {Object} state - Achievement state
 * @returns {Array} Array of unlocked achievement data
 */
export function getUnlockedAchievements(state) {
  return state.unlocked.map(id => getAchievementData(id)).filter(Boolean);
}

/**
 * Get locked achievements (visible only)
 * @param {Object} state - Achievement state
 * @returns {Array} Array of locked achievement data
 */
export function getLockedAchievements(state) {
  return Object.values(ACHIEVEMENTS).filter(a => 
    !isAchievementUnlocked(state, a.id) && !a.hidden
  );
}

/**
 * Get achievement display name (handles hidden achievements)
 * @param {Object} achievement - Achievement data
 * @param {boolean} unlocked - Whether achievement is unlocked
 * @returns {string} Display name
 */
export function getAchievementDisplayName(achievement, unlocked) {
  if (achievement.hidden && !unlocked) {
    return achievement.name; // Shows '???'
  }
  if (achievement.hidden && unlocked && achievement.unlockedName) {
    return achievement.unlockedName;
  }
  return achievement.name;
}

/**
 * Get achievement display description (handles hidden achievements)
 * @param {Object} achievement - Achievement data
 * @param {boolean} unlocked - Whether achievement is unlocked
 * @returns {string} Display description
 */
export function getAchievementDisplayDescription(achievement, unlocked) {
  if (achievement.hidden && !unlocked) {
    return achievement.description;
  }
  if (achievement.hidden && unlocked && achievement.unlockedDescription) {
    return achievement.unlockedDescription;
  }
  return achievement.description;
}

/**
 * Get completion percentage
 * @param {Object} state - Achievement state
 * @returns {number} Percentage of achievements unlocked
 */
export function getCompletionPercentage(state) {
  const total = Object.keys(ACHIEVEMENTS).length;
  const unlocked = state.unlocked.length;
  return Math.floor((unlocked / total) * 100);
}

/**
 * Get all achievement categories
 * @returns {Array} Category strings
 */
export function getAllCategories() {
  return Object.values(ACHIEVEMENT_CATEGORY);
}

/**
 * Get all achievement rarities
 * @returns {Array} Rarity strings
 */
export function getAllRarities() {
  return Object.values(ACHIEVEMENT_RARITY);
}

/**
 * Get stats summary
 * @param {Object} state - Achievement state
 * @returns {Object} Stats summary
 */
export function getStatsSummary(state) {
  return { ...state.stats };
}
