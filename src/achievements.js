// achievements.js - Achievement tracking and management system

// Helper function to safely access state properties with fallback
function safeState(state) {
  return {
    kills: state.kills || 0,
    perfectCombat: state.perfectCombat || 0,
    explored: state.explored || [],
    level: state.level || 1,
    gold: state.gold || 0,
    inventory: state.inventory || [],
    equipment: state.equipment || {},
    xp: state.xp || 0,
    shopPurchases: state.shopPurchases || 0,
    completedQuests: state.completedQuests || [],
    bossesDefeated: state.bossesDefeated || 0
  };
}

function extractAchievementData(state) {
  const legacy = safeState(state);
  return {
    ...legacy,
    kills: state.gameStats?.enemiesDefeated ?? legacy.kills,
    gold: state.player?.gold ?? legacy.gold,
    level: state.player?.level ?? legacy.level,
    xp: state.player?.xp ?? legacy.xp,
    explored: state.questState?.discoveredRooms ?? legacy.explored,
    quests: state.questState?.activeQuests ?? state.quests ?? [],
    completedQuests: state.questState?.completedQuests ?? legacy.completedQuests,
    inventory: state.player?.inventory ?? legacy.inventory,
    equipment: state.player?.equipment ?? legacy.equipment,
    perfectCombat: state.gameStats?.perfectCombat ?? legacy.perfectCombat,
    shopPurchases: state.gameStats?.shopPurchases ?? legacy.shopPurchases,
    bossesDefeated: state.gameStats?.bossesDefeated ?? legacy.bossesDefeated
  };
}

// Achievement definitions
const ACHIEVEMENTS = [
  // Combat achievements
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Defeat your first enemy',
    category: 'combat',
    condition: (data) => data.kills >= 1,
    getProgress: (data) => data.kills
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Defeat 10 enemies',
    category: 'combat',
    condition: (data) => data.kills >= 10,
    getProgress: (data) => data.kills
  },
  {
    id: 'slayer',
    name: 'Slayer',
    description: 'Defeat 50 enemies',
    category: 'combat',
    condition: (data) => data.kills >= 50,
    getProgress: (data) => data.kills
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Defeat 100 enemies',
    category: 'combat',
    condition: (data) => data.kills >= 100,
    getProgress: (data) => data.kills
  },
  {
    id: 'perfect_combat',
    name: 'Perfect Combat',
    description: 'Win a battle without taking damage',
    category: 'combat',
    condition: (data) => data.perfectCombat >= 1,
    getProgress: (data) => data.perfectCombat
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeat a boss enemy',
    category: 'combat',
    condition: (data) => data.bossesDefeated >= 1,
    getProgress: (data) => data.bossesDefeated
  },

  // Exploration achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Explore 5 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 5,
    getProgress: (data) => data.explored.length
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Explore 20 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 20,
    getProgress: (data) => data.explored.length
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Explore 50 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 50,
    getProgress: (data) => data.explored.length
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    description: 'Explore 100 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 100,
    getProgress: (data) => data.explored.length
  },

  // Progression achievements
  {
    id: 'apprentice',
    name: 'Apprentice',
    description: 'Reach level 5',
    category: 'progression',
    condition: (data) => data.level >= 5,
    getProgress: (data) => data.level
  },
  {
    id: 'journeyman',
    name: 'Journeyman',
    description: 'Reach level 10',
    category: 'progression',
    condition: (data) => data.level >= 10,
    getProgress: (data) => data.level
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Reach level 15',
    category: 'progression',
    condition: (data) => data.level >= 15,
    getProgress: (data) => data.level
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Reach level 20',
    category: 'progression',
    condition: (data) => data.level >= 20,
    getProgress: (data) => data.level
  },
  {
    id: 'xp_hunter',
    name: 'XP Hunter',
    description: 'Earn 1000 total XP',
    category: 'progression',
    condition: (data) => data.xp >= 1000,
    getProgress: (data) => data.xp
  },
  {
    id: 'xp_master',
    name: 'XP Master',
    description: 'Earn 5000 total XP',
    category: 'progression',
    condition: (data) => data.xp >= 5000,
    getProgress: (data) => data.xp
  },

  // Collection achievements
  {
    id: 'first_coin',
    name: 'First Coin',
    description: 'Collect 100 gold',
    category: 'collection',
    condition: (data) => data.gold >= 100,
    getProgress: (data) => data.gold
  },
  {
    id: 'wealthy',
    name: 'Wealthy',
    description: 'Collect 1000 gold',
    category: 'collection',
    condition: (data) => data.gold >= 1000,
    getProgress: (data) => data.gold
  },
  {
    id: 'tycoon',
    name: 'Tycoon',
    description: 'Collect 5000 gold',
    category: 'collection',
    condition: (data) => data.gold >= 5000,
    getProgress: (data) => data.gold
  },
  {
    id: 'rare_collector',
    name: 'Rare Collector',
    description: 'Own a rare item',
    category: 'collection',
    condition: (data) => {
      const allItems = [...data.inventory, ...Object.values(data.equipment || {})].filter(Boolean);
      return allItems.some(item => item.rarity === 'rare');
    },
    getProgress: (data) => {
      const allItems = [...data.inventory, ...Object.values(data.equipment || {})].filter(Boolean);
      return allItems.some(item => item.rarity === 'rare') ? 1 : 0;
    }
  },
  {
    id: 'epic_collector',
    name: 'Epic Collector',
    description: 'Own an epic item',
    category: 'collection',
    condition: (data) => {
      const allItems = [...data.inventory, ...Object.values(data.equipment || {})].filter(Boolean);
      return allItems.some(item => item.rarity === 'epic');
    },
    getProgress: (data) => {
      const allItems = [...data.inventory, ...Object.values(data.equipment || {})].filter(Boolean);
      return allItems.some(item => item.rarity === 'epic') ? 1 : 0;
    }
  },
  {
    id: 'merchant',
    name: 'Merchant',
    description: 'Purchase 5 items from shops',
    category: 'collection',
    condition: (data) => data.shopPurchases >= 5,
    getProgress: (data) => data.shopPurchases
  },
  {
    id: 'shopaholic',
    name: 'Shopaholic',
    description: 'Purchase 20 items from shops',
    category: 'collection',
    condition: (data) => data.shopPurchases >= 20,
    getProgress: (data) => data.shopPurchases
  },

  // Quest achievements
  {
    id: 'quest_starter',
    name: 'Quest Starter',
    description: 'Complete your first quest',
    category: 'quests',
    condition: (data) => data.completedQuests.length >= 1,
    getProgress: (data) => data.completedQuests.length
  },
  {
    id: 'quest_seeker',
    name: 'Quest Seeker',
    description: 'Complete 5 quests',
    category: 'quests',
    condition: (data) => data.completedQuests.length >= 5,
    getProgress: (data) => data.completedQuests.length
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Complete 10 quests',
    category: 'quests',
    condition: (data) => data.completedQuests.length >= 10,
    getProgress: (data) => data.completedQuests.length
  }
];

// Track achievements and return newly unlocked ones
export function trackAchievements(state) {
  const newUnlocked = [];
  const unlockedAchievements = state.unlockedAchievements || state.achievements || [];
  const data = extractAchievementData(state);

  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedAchievements.includes(achievement.id) && achievement.condition(data)) {
      newUnlocked.push(achievement.id);
    }
  }

  const normalizedUnlocked = [...new Set([...unlockedAchievements, ...newUnlocked])];

  return {
    ...state,
    achievements: state.achievements || normalizedUnlocked,
    unlockedAchievements: normalizedUnlocked
  };
}

// Check if a specific achievement is unlocked
export function isUnlocked(state, achievementId) {
  const unlockedAchievements = state.unlockedAchievements || state.achievements || [];
  return unlockedAchievements.includes(achievementId);
}

// Get progress for a specific achievement (returns number)
export function getProgress(state, achievementId) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return 0;
  const data = extractAchievementData(state);
  return achievement.getProgress(data);
}

// Get all achievements
export function getAllAchievements() {
  return [...ACHIEVEMENTS];
}

// Get achievements by category
export function getAchievementsByCategory(category) {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

// Get count of unlocked achievements
export function getUnlockedCount(state) {
  const unlockedAchievements = state.unlockedAchievements || state.achievements || [];
  return unlockedAchievements.length;
}

// Get total count of achievements
export function getTotalCount() {
  return ACHIEVEMENTS.length;
}
