// achievements.js - Achievement tracking and management system
import { getSfx } from './audio-system.js';
import { DUNGEON_FLOORS } from './dungeon-floors.js';

// Helper function to safely access state properties with fallback
function safeState(state) {
  return {
    kills: state.kills || 0,
    perfectCombat: state.perfectCombat || 0,
    explored: state.explored || [],
    level: state.level || 1,
    gold: state.gold || 0,
  inventory: Array.isArray(state.inventory) ? [...state.inventory] : [],
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
    activeQuests: state.questState?.activeQuests ?? state.quests ?? [],
    completedQuests: state.questState?.completedQuests ?? legacy.completedQuests,
  inventory: Array.isArray(state.player?.inventory) ? state.player.inventory : (Array.isArray(legacy.inventory) ? legacy.inventory : []),
    equipment: state.player?.equipment ?? legacy.equipment,
    perfectCombat: state.gameStats?.perfectCombat ?? legacy.perfectCombat,
    shopPurchases: state.gameStats?.shopPurchases ?? legacy.shopPurchases,
    bossesDefeated: state.gameStats?.bossesDefeated ?? legacy.bossesDefeated,
    highestTavernStreak: state.gameStats?.highestTavernStreak ?? 0,
    tavernBusts: state.gameStats?.tavernBusts ?? 0,
    lastCombatRating: state.combatStatsSummary?.sections?.[0]?.rating || null,
    lastBattleMaxHit: state.combatStats?.maxSingleHit || 0,
    shieldsBroken: state.gameStats?.shieldsBroken ?? 0,
    weaknessHits: state.gameStats?.weaknessHits ?? 0,
    defeatedWhileBroken: state.gameStats?.defeatedWhileBroken ?? 0,
    deepestFloor: state.dungeonState?.deepestFloor ?? 0,
    floorsCleared: state.dungeonState?.floorsCleared ?? [],
    floorsCompletedCount: (state.dungeonState?.floorsCleared ?? []).length,
    floor: typeof state.dungeonState?.currentFloor === 'number'
      ? state.dungeonState.currentFloor
      : typeof state.currentFloor === 'number'
        ? state.currentFloor
        : 0,
    victory: Boolean(
      state.victory
      || state.gameFlags?.victory
      || state.gameStats?.gameCompleted
      || state.dungeonState?.gameCompleted
      || state.phase === 'victory'
    ),
    playTime: state.playTime ?? state.stats?.playTime ?? (
      typeof state.playTimeSeconds === 'number' ? state.playTimeSeconds * 1000 : 0
    ),
    bestiary: state.gameStats?.bestiary ?? state.bestiary ?? {},
    knownRecipes: Array.isArray(state.crafting?.knownRecipes)
      ? state.crafting.knownRecipes
      : Array.isArray(state.knownRecipes)
        ? state.knownRecipes
        : [],
    uniqueEquipmentFound: state.gameStats?.uniqueEquipmentFound ?? state.uniqueEquipmentFound ?? 0
  };
}

// Achievement definitions
const ACHIEVEMENTS = [
  // Combat achievements
  {
    id: 'flawless_execution',
    name: 'Flawless Execution',
    description: 'Achieve an S-Rank in combat',
    category: 'combat',
    condition: (data) => data.lastCombatRating === 'S',
    getProgress: (data) => data.lastCombatRating === 'S' ? 1 : 0
  },
  {
    id: 'efficiency_expert',
    name: 'Efficiency Expert',
    description: 'Achieve an A-Rank or higher in combat',
    category: 'combat',
    condition: (data) => data.lastCombatRating === 'S' || data.lastCombatRating === 'A',
    getProgress: (data) => (data.lastCombatRating === 'S' || data.lastCombatRating === 'A') ? 1 : 0
  },
  {
    id: 'overkill',
    name: 'Overkill',
    description: 'Deal 50 or more damage in a single hit',
    category: 'combat',
    condition: (data) => data.lastBattleMaxHit >= 50,
    getProgress: (data) => Math.min(50, data.lastBattleMaxHit)
  },
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
  {
    id: 'shield_breaker',
    name: 'Shield Breaker',
    description: 'Break an enemy shield',
    category: 'combat',
    condition: (data) => data.shieldsBroken >= 1,
    getProgress: (data) => data.shieldsBroken
  },
  {
    id: 'weakness_exploiter',
    name: 'Weakness Exploiter',
    description: 'Hit enemy weaknesses 10 times',
    category: 'combat',
    condition: (data) => data.weaknessHits >= 10,
    getProgress: (data) => data.weaknessHits
  },
  {
    id: 'shield_master',
    name: 'Shield Master',
    description: 'Break 25 enemy shields',
    category: 'combat',
    condition: (data) => data.shieldsBroken >= 25,
    getProgress: (data) => data.shieldsBroken
  },
  {
    id: 'elemental_tactician',
    name: 'Elemental Tactician',
    description: 'Hit enemy weaknesses 50 times',
    category: 'combat',
    condition: (data) => data.weaknessHits >= 50,
    getProgress: (data) => data.weaknessHits
  },
  {
    id: 'break_specialist',
    name: 'Break Specialist',
    description: 'Defeat 10 enemies while they are broken',
    category: 'combat',
    condition: (data) => data.defeatedWhileBroken >= 10,
    getProgress: (data) => data.defeatedWhileBroken
  },

  // Exploration achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Explore your first room',
    category: 'exploration',
    condition: (data) => data.explored.length >= 1,
    getProgress: (data) => data.explored.length
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Explore 5 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 5,
    getProgress: (data) => data.explored.length
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Explore 15 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 15,
    getProgress: (data) => data.explored.length
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    description: 'Explore 30 rooms',
    category: 'exploration',
    condition: (data) => data.explored.length >= 30,
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
    description: 'Collect 500 gold',
    category: 'collection',
    condition: (data) => data.gold >= 500,
    getProgress: (data) => data.gold
  },
  {
    id: 'tycoon',
    name: 'Tycoon',
    description: 'Collect 2000 gold',
    category: 'collection',
    condition: (data) => data.gold >= 2000,
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
    description: 'Accept your first quest',
    category: 'quests',
    condition: (data) => (data.activeQuests?.length ?? 0) >= 1,
    getProgress: (data) => data.activeQuests?.length ?? 0
  },
  {
    id: 'quest_seeker',
    name: 'Quest Seeker',
    description: 'Complete 3 quests',
    category: 'quests',
    condition: (data) => data.completedQuests.length >= 3,
    getProgress: (data) => data.completedQuests.length
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Complete 10 quests',
    category: 'quests',
    condition: (data) => data.completedQuests.length >= 10,
    getProgress: (data) => data.completedQuests.length
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Achieve a 3-win streak in the Tavern Dice game',
    category: 'collection',
    condition: (data) => data.highestTavernStreak >= 3,
    getProgress: (data) => data.highestTavernStreak
  },
  {
    id: 'house_always_wins',
    name: 'The House Always Wins',
    description: 'Lose a pot in the Tavern Dice game',
    category: 'collection',
    condition: (data) => data.tavernBusts >= 1,
    getProgress: (data) => data.tavernBusts
  },

  // Additional boss achievements
  {
    id: 'boss_hunter',
    name: 'Boss Hunter',
    description: 'Defeat 3 dungeon bosses',
    category: 'combat',
    condition: (data) => data.bossesDefeated >= 3,
    getProgress: (data) => data.bossesDefeated
  },
  {
    id: 'boss_bane',
    name: 'Boss Bane',
    description: 'Defeat 5 dungeon bosses',
    category: 'combat',
    condition: (data) => data.bossesDefeated >= 5,
    getProgress: (data) => data.bossesDefeated
  },

  // Dungeon floor progression achievements
  {
    id: 'dungeon_initiate',
    name: 'Dungeon Initiate',
    description: 'Enter the dungeon for the first time',
    category: 'dungeon',
    condition: (data) => data.deepestFloor >= 1,
    getProgress: (data) => Math.min(data.deepestFloor, 1)
  },
  {
    id: 'floor_crawler',
    name: 'Floor Crawler',
    description: 'Reach floor 3 of the dungeon',
    category: 'dungeon',
    condition: (data) => data.deepestFloor >= 3,
    getProgress: (data) => Math.min(data.deepestFloor, 3)
  },
  {
    id: 'dungeon_explorer',
    name: 'Dungeon Explorer',
    description: 'Reach floor 5 of the dungeon',
    category: 'dungeon',
    condition: (data) => data.deepestFloor >= 5,
    getProgress: (data) => Math.min(data.deepestFloor, 5)
  },
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    description: 'Reach floor 7 of the dungeon',
    category: 'dungeon',
    condition: (data) => data.deepestFloor >= 7,
    getProgress: (data) => Math.min(data.deepestFloor, 7)
  },
  {
    id: 'abyss_conqueror',
    name: 'Abyss Conqueror',
    description: 'Reach floor 10 — the Abyssal Throne',
    category: 'dungeon',
    condition: (data) => data.deepestFloor >= DUNGEON_FLOORS.length,
    getProgress: (data) => Math.min(data.deepestFloor, DUNGEON_FLOORS.length)
  },
  {
    id: 'oblivion_master',
    name: 'Oblivion Master',
    description: 'Reach floor 15 — the Primordial Depths',
    category: 'dungeon',
    condition: (data) => data.deepestFloor >= 15,
    getProgress: (data) => Math.min(data.deepestFloor, 15)
  },
  {
    id: 'floor_clearer',
    name: 'Floor Clearer',
    description: 'Clear all enemies on 3 dungeon floors',
    category: 'dungeon',
    condition: (data) => data.floorsCompletedCount >= 3,
    getProgress: (data) => data.floorsCompletedCount
  },
  {
    id: 'dungeon_master',
    name: 'Dungeon Master',
    description: 'Clear all 10 dungeon floors',
    category: 'dungeon',
    condition: (data) => data.floorsCompletedCount >= 10,
    getProgress: (data) => data.floorsCompletedCount
  },

  // Playstyle achievements
  {
    id: 'pacifist_floor_5',
    name: 'Peaceful Explorer',
    description: 'Reach floor 5 without killing any enemies',
    category: 'playstyle',
    condition: (data) => data.floor >= 5 && data.kills === 0,
    getProgress: (data) => (data.kills === 0 ? data.floor : 0)
  },
  {
    id: 'pacifist_floor_10',
    name: 'Merciful Wanderer',
    description: 'Reach floor 10 without killing any enemies',
    category: 'playstyle',
    condition: (data) => data.floor >= 10 && data.kills === 0,
    getProgress: (data) => (data.kills === 0 ? data.floor : 0)
  },
  {
    id: 'low_kill_victory',
    name: 'Minimal Violence',
    description: 'Complete the game with fewer than 20 kills',
    category: 'playstyle',
    condition: (data) => data.victory && data.kills < 20,
    getProgress: (data) => (data.victory && data.kills < 20 ? 1 : 0)
  },

  // Collection achievements
  {
    id: 'bestiary_complete',
    name: 'Monster Scholar',
    description: 'Discover all enemy types in the bestiary',
    category: 'collection',
    condition: (data) => Object.keys(data.bestiary || {}).length >= 41,
    getProgress: (data) => Object.keys(data.bestiary || {}).length
  },
  {
    id: 'recipe_master',
    name: 'Culinary Expert',
    description: 'Learn all crafting recipes',
    category: 'collection',
    condition: (data) => (data.knownRecipes || []).length >= 34,
    getProgress: (data) => (data.knownRecipes || []).length
  },
  {
    id: 'equipment_collector',
    name: 'Armory Completionist',
    description: 'Obtain at least one of every equipment type',
    category: 'collection',
    condition: (data) => (data.uniqueEquipmentFound ?? 0) >= 25,
    getProgress: (data) => data.uniqueEquipmentFound || 0
  },

  // Challenge achievements
  {
    id: 'speed_runner',
    name: 'Swift Adventurer',
    description: 'Complete the game in under 60 minutes',
    category: 'challenge',
    condition: (data) => data.victory && (data.playTime ?? 0) < 3600000,
    getProgress: (data) => (data.victory ? Math.max(0, 3600000 - (data.playTime || 0)) : 0)
  },
  {
    id: 'speed_demon',
    name: 'Lightning Champion',
    description: 'Complete the game in under 30 minutes',
    category: 'challenge',
    condition: (data) => data.victory && (data.playTime ?? 0) < 1800000,
    getProgress: (data) => (data.victory ? Math.max(0, 1800000 - (data.playTime || 0)) : 0)
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
  const newNotifs = newUnlocked.length > 0
    ? newUnlocked.map((id) => {
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        return {
          id,
          name: achievement?.name || id,
          timestamp: Date.now()
        };
      })
    : [];

  if (newUnlocked.length > 0) {
    try {
      const sfx = getSfx?.();
      if (sfx && typeof sfx.play === 'function') {
        sfx.play('ui_achievement');
      }
    } catch {
      // Ignore audio failures to keep function side-effect free for state
    }
  }

  return {
    ...state,
    achievements: state.achievements || normalizedUnlocked,
    unlockedAchievements: normalizedUnlocked,
    achievementNotifications: [...(state.achievementNotifications || []), ...newNotifs]
  };
}

export function consumeAchievementNotifications(state) {
  return { ...state, achievementNotifications: [] };
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
  const normalizedCategory = typeof category === 'string' ? category.toLowerCase() : '';
  return ACHIEVEMENTS.filter(a => (a.category || '').toLowerCase() === normalizedCategory);
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
