/**
 * Title/Badge System
 * Allows players to earn and display titles and badges
 * Titles appear before player name, badges are collectible achievements
 */

// Title categories
export const TITLE_CATEGORY = {
  COMBAT: { id: 'combat', name: 'Combat', color: '#FF4444' },
  EXPLORATION: { id: 'exploration', name: 'Exploration', color: '#44FF44' },
  CRAFTING: { id: 'crafting', name: 'Crafting', color: '#FFAA44' },
  SOCIAL: { id: 'social', name: 'Social', color: '#44AAFF' },
  COLLECTION: { id: 'collection', name: 'Collection', color: '#AA44FF' },
  SPECIAL: { id: 'special', name: 'Special', color: '#FFD700' }
};

// Title rarity levels
export const TITLE_RARITY = {
  COMMON: { id: 'common', name: 'Common', color: '#AAAAAA', points: 5 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#1EFF00', points: 10 },
  RARE: { id: 'rare', name: 'Rare', color: '#0070DD', points: 25 },
  EPIC: { id: 'epic', name: 'Epic', color: '#A335EE', points: 50 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#FF8000', points: 100 }
};

// Badge types (small collectible icons)
export const BADGE_TYPE = {
  MILESTONE: { id: 'milestone', name: 'Milestone', icon: 'star' },
  CHALLENGE: { id: 'challenge', name: 'Challenge', icon: 'trophy' },
  EVENT: { id: 'event', name: 'Event', icon: 'calendar' },
  SECRET: { id: 'secret', name: 'Secret', icon: 'eye' },
  MASTERY: { id: 'mastery', name: 'Mastery', icon: 'crown' }
};

// Title definitions
export const TITLES = {
  // Combat titles
  first_blood: {
    id: 'first_blood',
    name: 'Blooded',
    description: 'Won your first battle',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.COMMON,
    requirement: { type: 'battles_won', value: 1 }
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: 'Won 10 battles',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.COMMON,
    requirement: { type: 'battles_won', value: 10 }
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran',
    description: 'Won 50 battles',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.UNCOMMON,
    requirement: { type: 'battles_won', value: 50 }
  },
  champion: {
    id: 'champion',
    name: 'Champion',
    description: 'Won 100 battles',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'battles_won', value: 100 }
  },
  warlord: {
    id: 'warlord',
    name: 'Warlord',
    description: 'Won 500 battles',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.EPIC,
    requirement: { type: 'battles_won', value: 500 }
  },
  legend_of_war: {
    id: 'legend_of_war',
    name: 'Legend of War',
    description: 'Won 1000 battles',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'battles_won', value: 1000 }
  },
  boss_slayer: {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeated 10 bosses',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'bosses_defeated', value: 10 }
  },
  unstoppable: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Win 10 battles without taking damage',
    category: TITLE_CATEGORY.COMBAT,
    rarity: TITLE_RARITY.EPIC,
    requirement: { type: 'flawless_victories', value: 10 }
  },

  // Exploration titles
  wanderer: {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Visited 5 different locations',
    category: TITLE_CATEGORY.EXPLORATION,
    rarity: TITLE_RARITY.COMMON,
    requirement: { type: 'locations_visited', value: 5 }
  },
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visited 15 different locations',
    category: TITLE_CATEGORY.EXPLORATION,
    rarity: TITLE_RARITY.UNCOMMON,
    requirement: { type: 'locations_visited', value: 15 }
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Visited 30 different locations',
    category: TITLE_CATEGORY.EXPLORATION,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'locations_visited', value: 30 }
  },
  world_traveler: {
    id: 'world_traveler',
    name: 'World Traveler',
    description: 'Visited all locations',
    category: TITLE_CATEGORY.EXPLORATION,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'all_locations_visited', value: true }
  },
  dungeon_delver: {
    id: 'dungeon_delver',
    name: 'Dungeon Delver',
    description: 'Completed 10 dungeons',
    category: TITLE_CATEGORY.EXPLORATION,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'dungeons_completed', value: 10 }
  },

  // Crafting titles
  apprentice_crafter: {
    id: 'apprentice_crafter',
    name: 'Apprentice Crafter',
    description: 'Crafted 10 items',
    category: TITLE_CATEGORY.CRAFTING,
    rarity: TITLE_RARITY.COMMON,
    requirement: { type: 'items_crafted', value: 10 }
  },
  journeyman_crafter: {
    id: 'journeyman_crafter',
    name: 'Journeyman Crafter',
    description: 'Crafted 50 items',
    category: TITLE_CATEGORY.CRAFTING,
    rarity: TITLE_RARITY.UNCOMMON,
    requirement: { type: 'items_crafted', value: 50 }
  },
  master_crafter: {
    id: 'master_crafter',
    name: 'Master Crafter',
    description: 'Crafted 200 items',
    category: TITLE_CATEGORY.CRAFTING,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'items_crafted', value: 200 }
  },
  artisan: {
    id: 'artisan',
    name: 'Artisan',
    description: 'Crafted a legendary item',
    category: TITLE_CATEGORY.CRAFTING,
    rarity: TITLE_RARITY.EPIC,
    requirement: { type: 'legendary_items_crafted', value: 1 }
  },
  grandmaster_smith: {
    id: 'grandmaster_smith',
    name: 'Grandmaster Smith',
    description: 'Reached max smithing skill',
    category: TITLE_CATEGORY.CRAFTING,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'skill_maxed', value: 'smithing' }
  },

  // Social titles
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Befriended 5 NPCs',
    category: TITLE_CATEGORY.SOCIAL,
    rarity: TITLE_RARITY.COMMON,
    requirement: { type: 'npcs_befriended', value: 5 }
  },
  diplomat: {
    id: 'diplomat',
    name: 'Diplomat',
    description: 'Reached max reputation with a faction',
    category: TITLE_CATEGORY.SOCIAL,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'faction_max_rep', value: 1 }
  },
  beloved: {
    id: 'beloved',
    name: 'Beloved',
    description: 'Reached max reputation with all factions',
    category: TITLE_CATEGORY.SOCIAL,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'all_factions_max_rep', value: true }
  },
  guild_leader: {
    id: 'guild_leader',
    name: 'Guild Leader',
    description: 'Created and led a guild',
    category: TITLE_CATEGORY.SOCIAL,
    rarity: TITLE_RARITY.EPIC,
    requirement: { type: 'guild_leader', value: true }
  },

  // Collection titles
  collector: {
    id: 'collector',
    name: 'Collector',
    description: 'Collected 100 unique items',
    category: TITLE_CATEGORY.COLLECTION,
    rarity: TITLE_RARITY.UNCOMMON,
    requirement: { type: 'unique_items', value: 100 }
  },
  hoarder: {
    id: 'hoarder',
    name: 'Hoarder',
    description: 'Collected 500 unique items',
    category: TITLE_CATEGORY.COLLECTION,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'unique_items', value: 500 }
  },
  completionist: {
    id: 'completionist',
    name: 'Completionist',
    description: 'Collected all items in the game',
    category: TITLE_CATEGORY.COLLECTION,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'all_items_collected', value: true }
  },
  bestiary_scholar: {
    id: 'bestiary_scholar',
    name: 'Bestiary Scholar',
    description: 'Discovered all creatures in the bestiary',
    category: TITLE_CATEGORY.COLLECTION,
    rarity: TITLE_RARITY.EPIC,
    requirement: { type: 'bestiary_complete', value: true }
  },

  // Special titles
  hero_of_the_realm: {
    id: 'hero_of_the_realm',
    name: 'Hero of the Realm',
    description: 'Completed the main story',
    category: TITLE_CATEGORY.SPECIAL,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'main_story_complete', value: true }
  },
  speedrunner: {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: 'Completed the game in under 2 hours',
    category: TITLE_CATEGORY.SPECIAL,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'speedrun', value: 7200 }
  },
  iron_man: {
    id: 'iron_man',
    name: 'Iron Man',
    description: 'Completed the game without dying',
    category: TITLE_CATEGORY.SPECIAL,
    rarity: TITLE_RARITY.LEGENDARY,
    requirement: { type: 'no_deaths', value: true }
  },
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Played during the beta period',
    category: TITLE_CATEGORY.SPECIAL,
    rarity: TITLE_RARITY.RARE,
    requirement: { type: 'beta_player', value: true }
  }
};

// Badge definitions
export const BADGES = {
  // Milestone badges
  level_10: {
    id: 'level_10',
    name: 'Level 10',
    description: 'Reached level 10',
    type: BADGE_TYPE.MILESTONE,
    icon: 'star_bronze',
    requirement: { type: 'level', value: 10 }
  },
  level_25: {
    id: 'level_25',
    name: 'Level 25',
    description: 'Reached level 25',
    type: BADGE_TYPE.MILESTONE,
    icon: 'star_silver',
    requirement: { type: 'level', value: 25 }
  },
  level_50: {
    id: 'level_50',
    name: 'Level 50',
    description: 'Reached level 50',
    type: BADGE_TYPE.MILESTONE,
    icon: 'star_gold',
    requirement: { type: 'level', value: 50 }
  },
  gold_millionaire: {
    id: 'gold_millionaire',
    name: 'Millionaire',
    description: 'Accumulated 1,000,000 gold',
    type: BADGE_TYPE.MILESTONE,
    icon: 'coin_stack',
    requirement: { type: 'total_gold_earned', value: 1000000 }
  },
  first_quest: {
    id: 'first_quest',
    name: 'Questor',
    description: 'Completed your first quest',
    type: BADGE_TYPE.MILESTONE,
    icon: 'scroll',
    requirement: { type: 'quests_completed', value: 1 }
  },

  // Challenge badges
  solo_boss: {
    id: 'solo_boss',
    name: 'Solo Victor',
    description: 'Defeated a boss without companions',
    type: BADGE_TYPE.CHALLENGE,
    icon: 'sword_crossed',
    requirement: { type: 'solo_boss_kill', value: 1 }
  },
  no_damage_boss: {
    id: 'no_damage_boss',
    name: 'Perfect Victory',
    description: 'Defeated a boss without taking damage',
    type: BADGE_TYPE.CHALLENGE,
    icon: 'shield_perfect',
    requirement: { type: 'flawless_boss_kill', value: 1 }
  },
  underleveled: {
    id: 'underleveled',
    name: 'Underdog',
    description: 'Defeated an enemy 10 levels higher',
    type: BADGE_TYPE.CHALLENGE,
    icon: 'david_goliath',
    requirement: { type: 'underleveled_kill', value: 10 }
  },

  // Event badges
  holiday_2024: {
    id: 'holiday_2024',
    name: 'Winter 2024',
    description: 'Participated in Winter 2024 event',
    type: BADGE_TYPE.EVENT,
    icon: 'snowflake',
    requirement: { type: 'event', value: 'winter_2024' }
  },
  anniversary: {
    id: 'anniversary',
    name: 'Anniversary',
    description: 'Played on the game anniversary',
    type: BADGE_TYPE.EVENT,
    icon: 'cake',
    requirement: { type: 'event', value: 'anniversary' }
  },

  // Secret badges
  hidden_area: {
    id: 'hidden_area',
    name: 'Secret Seeker',
    description: 'Found a hidden area',
    type: BADGE_TYPE.SECRET,
    icon: 'magnifier',
    requirement: { type: 'hidden_areas_found', value: 1 }
  },
  all_secrets: {
    id: 'all_secrets',
    name: 'Master Detective',
    description: 'Found all secrets in the game',
    type: BADGE_TYPE.SECRET,
    icon: 'key_master',
    requirement: { type: 'all_secrets_found', value: true }
  },

  // Mastery badges
  combat_master: {
    id: 'combat_master',
    name: 'Combat Master',
    description: 'Mastered all combat abilities',
    type: BADGE_TYPE.MASTERY,
    icon: 'sword_master',
    requirement: { type: 'all_combat_skills', value: true }
  },
  craft_master: {
    id: 'craft_master',
    name: 'Craft Master',
    description: 'Mastered all crafting skills',
    type: BADGE_TYPE.MASTERY,
    icon: 'hammer_master',
    requirement: { type: 'all_craft_skills', value: true }
  }
};

/**
 * Initialize title/badge system state
 */
export function initTitleBadgeState() {
  return {
    unlockedTitles: [],
    unlockedBadges: [],
    equippedTitle: null,
    displayedBadges: [], // Up to 5 badges displayed
    titlePoints: 0,
    badgeSlots: 3, // Can be upgraded
    maxBadgeSlots: 5,
    titleHistory: [], // Track when titles were earned
    newUnlocks: [] // For notifications
  };
}

/**
 * Get title/badge state from game state
 */
export function getTitleBadgeState(state) {
  return state.titleBadges || initTitleBadgeState();
}

/**
 * Check if a title is unlocked
 */
export function isTitleUnlocked(state, titleId) {
  const tbState = getTitleBadgeState(state);
  return tbState.unlockedTitles.includes(titleId);
}

/**
 * Check if a badge is unlocked
 */
export function isBadgeUnlocked(state, badgeId) {
  const tbState = getTitleBadgeState(state);
  return tbState.unlockedBadges.includes(badgeId);
}

/**
 * Unlock a title
 */
export function unlockTitle(state, titleId) {
  const title = TITLES[titleId];
  if (!title) {
    return { state, unlocked: false, error: 'Invalid title ID' };
  }

  const tbState = getTitleBadgeState(state);

  if (tbState.unlockedTitles.includes(titleId)) {
    return { state, unlocked: false, error: 'Title already unlocked' };
  }

  const newUnlockedTitles = [...tbState.unlockedTitles, titleId];
  const newTitlePoints = tbState.titlePoints + title.rarity.points;
  const newHistory = [...tbState.titleHistory, {
    titleId,
    unlockedAt: Date.now()
  }];
  const newNewUnlocks = [...tbState.newUnlocks, { type: 'title', id: titleId }];

  return {
    state: {
      ...state,
      titleBadges: {
        ...tbState,
        unlockedTitles: newUnlockedTitles,
        titlePoints: newTitlePoints,
        titleHistory: newHistory,
        newUnlocks: newNewUnlocks
      }
    },
    unlocked: true,
    title
  };
}

/**
 * Unlock a badge
 */
export function unlockBadge(state, badgeId) {
  const badge = BADGES[badgeId];
  if (!badge) {
    return { state, unlocked: false, error: 'Invalid badge ID' };
  }

  const tbState = getTitleBadgeState(state);

  if (tbState.unlockedBadges.includes(badgeId)) {
    return { state, unlocked: false, error: 'Badge already unlocked' };
  }

  const newUnlockedBadges = [...tbState.unlockedBadges, badgeId];
  const newNewUnlocks = [...tbState.newUnlocks, { type: 'badge', id: badgeId }];

  return {
    state: {
      ...state,
      titleBadges: {
        ...tbState,
        unlockedBadges: newUnlockedBadges,
        newUnlocks: newNewUnlocks
      }
    },
    unlocked: true,
    badge
  };
}

/**
 * Equip a title
 */
export function equipTitle(state, titleId) {
  if (titleId !== null && !TITLES[titleId]) {
    return { state, equipped: false, error: 'Invalid title ID' };
  }

  const tbState = getTitleBadgeState(state);

  if (titleId !== null && !tbState.unlockedTitles.includes(titleId)) {
    return { state, equipped: false, error: 'Title not unlocked' };
  }

  return {
    state: {
      ...state,
      titleBadges: {
        ...tbState,
        equippedTitle: titleId
      }
    },
    equipped: true,
    previousTitle: tbState.equippedTitle
  };
}

/**
 * Display a badge (add to displayed badges)
 */
export function displayBadge(state, badgeId) {
  const badge = BADGES[badgeId];
  if (!badge) {
    return { state, displayed: false, error: 'Invalid badge ID' };
  }

  const tbState = getTitleBadgeState(state);

  if (!tbState.unlockedBadges.includes(badgeId)) {
    return { state, displayed: false, error: 'Badge not unlocked' };
  }

  if (tbState.displayedBadges.includes(badgeId)) {
    return { state, displayed: false, error: 'Badge already displayed' };
  }

  if (tbState.displayedBadges.length >= tbState.badgeSlots) {
    return { state, displayed: false, error: 'No available badge slots' };
  }

  const newDisplayedBadges = [...tbState.displayedBadges, badgeId];

  return {
    state: {
      ...state,
      titleBadges: {
        ...tbState,
        displayedBadges: newDisplayedBadges
      }
    },
    displayed: true,
    badge
  };
}

/**
 * Hide a badge (remove from displayed badges)
 */
export function hideBadge(state, badgeId) {
  const tbState = getTitleBadgeState(state);

  if (!tbState.displayedBadges.includes(badgeId)) {
    return { state, hidden: false, error: 'Badge not displayed' };
  }

  const newDisplayedBadges = tbState.displayedBadges.filter(id => id !== badgeId);

  return {
    state: {
      ...state,
      titleBadges: {
        ...tbState,
        displayedBadges: newDisplayedBadges
      }
    },
    hidden: true
  };
}

/**
 * Upgrade badge slots
 */
export function upgradeBadgeSlots(state, cost = 1000) {
  const tbState = getTitleBadgeState(state);

  if (tbState.badgeSlots >= tbState.maxBadgeSlots) {
    return { state, upgraded: false, error: 'Max badge slots reached' };
  }

  const playerGold = state.player?.gold || 0;
  if (playerGold < cost) {
    return { state, upgraded: false, error: 'Not enough gold' };
  }

  return {
    state: {
      ...state,
      player: {
        ...state.player,
        gold: playerGold - cost
      },
      titleBadges: {
        ...tbState,
        badgeSlots: tbState.badgeSlots + 1
      }
    },
    upgraded: true,
    newSlots: tbState.badgeSlots + 1
  };
}

/**
 * Get formatted player name with title
 */
export function getPlayerNameWithTitle(state) {
  const tbState = getTitleBadgeState(state);
  const playerName = state.player?.name || 'Adventurer';

  if (!tbState.equippedTitle) {
    return playerName;
  }

  const title = TITLES[tbState.equippedTitle];
  if (!title) {
    return playerName;
  }

  return `${title.name} ${playerName}`;
}

/**
 * Get all unlocked titles
 */
export function getUnlockedTitles(state) {
  const tbState = getTitleBadgeState(state);
  return tbState.unlockedTitles.map(id => ({
    ...TITLES[id],
    unlocked: true
  }));
}

/**
 * Get all unlocked badges
 */
export function getUnlockedBadges(state) {
  const tbState = getTitleBadgeState(state);
  return tbState.unlockedBadges.map(id => ({
    ...BADGES[id],
    unlocked: true,
    displayed: tbState.displayedBadges.includes(id)
  }));
}

/**
 * Get displayed badges
 */
export function getDisplayedBadges(state) {
  const tbState = getTitleBadgeState(state);
  return tbState.displayedBadges.map(id => BADGES[id]).filter(Boolean);
}

/**
 * Get titles by category
 */
export function getTitlesByCategory(state, categoryId) {
  const tbState = getTitleBadgeState(state);
  return Object.values(TITLES)
    .filter(t => t.category.id === categoryId)
    .map(t => ({
      ...t,
      unlocked: tbState.unlockedTitles.includes(t.id),
      equipped: tbState.equippedTitle === t.id
    }));
}

/**
 * Get badges by type
 */
export function getBadgesByType(state, typeId) {
  const tbState = getTitleBadgeState(state);
  return Object.values(BADGES)
    .filter(b => b.type.id === typeId)
    .map(b => ({
      ...b,
      unlocked: tbState.unlockedBadges.includes(b.id),
      displayed: tbState.displayedBadges.includes(b.id)
    }));
}

/**
 * Get title progress statistics
 */
export function getTitleStats(state) {
  const tbState = getTitleBadgeState(state);
  const totalTitles = Object.keys(TITLES).length;
  const totalBadges = Object.keys(BADGES).length;

  const titlesByRarity = {};
  for (const rarity of Object.values(TITLE_RARITY)) {
    const total = Object.values(TITLES).filter(t => t.rarity.id === rarity.id).length;
    const unlocked = tbState.unlockedTitles.filter(id =>
      TITLES[id]?.rarity.id === rarity.id
    ).length;
    titlesByRarity[rarity.id] = { total, unlocked };
  }

  const badgesByType = {};
  for (const type of Object.values(BADGE_TYPE)) {
    const total = Object.values(BADGES).filter(b => b.type.id === type.id).length;
    const unlocked = tbState.unlockedBadges.filter(id =>
      BADGES[id]?.type.id === type.id
    ).length;
    badgesByType[type.id] = { total, unlocked };
  }

  return {
    totalTitles,
    unlockedTitles: tbState.unlockedTitles.length,
    totalBadges,
    unlockedBadges: tbState.unlockedBadges.length,
    titlePoints: tbState.titlePoints,
    badgeSlots: tbState.badgeSlots,
    maxBadgeSlots: tbState.maxBadgeSlots,
    titlesByRarity,
    badgesByType
  };
}

/**
 * Clear new unlock notifications
 */
export function clearNewUnlocks(state) {
  const tbState = getTitleBadgeState(state);
  return {
    ...state,
    titleBadges: {
      ...tbState,
      newUnlocks: []
    }
  };
}

/**
 * Get new unlocks for notifications
 */
export function getNewUnlocks(state) {
  const tbState = getTitleBadgeState(state);
  return tbState.newUnlocks.map(unlock => {
    if (unlock.type === 'title') {
      return { ...unlock, data: TITLES[unlock.id] };
    } else {
      return { ...unlock, data: BADGES[unlock.id] };
    }
  });
}

/**
 * Check requirements and auto-unlock titles/badges
 */
export function checkAndUnlockRewards(state, stats) {
  let currentState = state;
  const newlyUnlocked = [];

  // Check titles
  for (const [titleId, title] of Object.entries(TITLES)) {
    if (isTitleUnlocked(currentState, titleId)) continue;

    const req = title.requirement;
    let met = false;

    switch (req.type) {
      case 'battles_won':
        met = (stats.battlesWon || 0) >= req.value;
        break;
      case 'bosses_defeated':
        met = (stats.bossesDefeated || 0) >= req.value;
        break;
      case 'flawless_victories':
        met = (stats.flawlessVictories || 0) >= req.value;
        break;
      case 'locations_visited':
        met = (stats.locationsVisited || 0) >= req.value;
        break;
      case 'all_locations_visited':
        met = stats.allLocationsVisited === true;
        break;
      case 'dungeons_completed':
        met = (stats.dungeonsCompleted || 0) >= req.value;
        break;
      case 'items_crafted':
        met = (stats.itemsCrafted || 0) >= req.value;
        break;
      case 'legendary_items_crafted':
        met = (stats.legendaryItemsCrafted || 0) >= req.value;
        break;
      case 'skill_maxed':
        met = stats.maxedSkills?.includes(req.value);
        break;
      case 'npcs_befriended':
        met = (stats.npcsBefriended || 0) >= req.value;
        break;
      case 'faction_max_rep':
        met = (stats.factionsMaxRep || 0) >= req.value;
        break;
      case 'all_factions_max_rep':
        met = stats.allFactionsMaxRep === true;
        break;
      case 'guild_leader':
        met = stats.isGuildLeader === true;
        break;
      case 'unique_items':
        met = (stats.uniqueItems || 0) >= req.value;
        break;
      case 'all_items_collected':
        met = stats.allItemsCollected === true;
        break;
      case 'bestiary_complete':
        met = stats.bestiaryComplete === true;
        break;
      case 'main_story_complete':
        met = stats.mainStoryComplete === true;
        break;
      case 'speedrun':
        met = (stats.gameTime || Infinity) <= req.value;
        break;
      case 'no_deaths':
        met = stats.noDeaths === true;
        break;
      case 'beta_player':
        met = stats.betaPlayer === true;
        break;
    }

    if (met) {
      const result = unlockTitle(currentState, titleId);
      if (result.unlocked) {
        currentState = result.state;
        newlyUnlocked.push({ type: 'title', id: titleId, data: title });
      }
    }
  }

  // Check badges
  for (const [badgeId, badge] of Object.entries(BADGES)) {
    if (isBadgeUnlocked(currentState, badgeId)) continue;

    const req = badge.requirement;
    let met = false;

    switch (req.type) {
      case 'level':
        met = (stats.level || 0) >= req.value;
        break;
      case 'total_gold_earned':
        met = (stats.totalGoldEarned || 0) >= req.value;
        break;
      case 'quests_completed':
        met = (stats.questsCompleted || 0) >= req.value;
        break;
      case 'solo_boss_kill':
        met = (stats.soloBossKills || 0) >= req.value;
        break;
      case 'flawless_boss_kill':
        met = (stats.flawlessBossKills || 0) >= req.value;
        break;
      case 'underleveled_kill':
        met = (stats.underleveledKills || 0) >= req.value;
        break;
      case 'event':
        met = stats.participatedEvents?.includes(req.value);
        break;
      case 'hidden_areas_found':
        met = (stats.hiddenAreasFound || 0) >= req.value;
        break;
      case 'all_secrets_found':
        met = stats.allSecretsFound === true;
        break;
      case 'all_combat_skills':
        met = stats.allCombatSkillsMaxed === true;
        break;
      case 'all_craft_skills':
        met = stats.allCraftSkillsMaxed === true;
        break;
    }

    if (met) {
      const result = unlockBadge(currentState, badgeId);
      if (result.unlocked) {
        currentState = result.state;
        newlyUnlocked.push({ type: 'badge', id: badgeId, data: badge });
      }
    }
  }

  return { state: currentState, newlyUnlocked };
}

/**
 * Swap badge positions in display
 */
export function swapBadgePositions(state, index1, index2) {
  const tbState = getTitleBadgeState(state);
  const badges = [...tbState.displayedBadges];

  if (index1 < 0 || index1 >= badges.length ||
      index2 < 0 || index2 >= badges.length) {
    return { state, swapped: false, error: 'Invalid badge index' };
  }

  [badges[index1], badges[index2]] = [badges[index2], badges[index1]];

  return {
    state: {
      ...state,
      titleBadges: {
        ...tbState,
        displayedBadges: badges
      }
    },
    swapped: true
  };
}

/**
 * Get title unlock history
 */
export function getTitleHistory(state) {
  const tbState = getTitleBadgeState(state);
  return tbState.titleHistory.map(entry => ({
    ...entry,
    title: TITLES[entry.titleId]
  })).sort((a, b) => b.unlockedAt - a.unlockedAt);
}
