/**
 * Summoning System
 * Call forth allies to fight alongside you in combat
 */

/**
 * Summon tiers
 */
export const SUMMON_TIER = {
  MINOR: 'minor',     // Basic summons, low cost
  STANDARD: 'standard', // Mid-tier summons
  GREATER: 'greater',   // Powerful summons
  LEGENDARY: 'legendary', // Ultimate summons
};

/**
 * Summon behavior types
 */
export const SUMMON_BEHAVIOR = {
  AGGRESSIVE: 'aggressive',   // Prioritizes attacking
  DEFENSIVE: 'defensive',     // Prioritizes protecting
  SUPPORT: 'support',         // Prioritizes healing/buffs
  BALANCED: 'balanced',       // Mixed behavior
};

/**
 * Summon data definitions
 */
export const SUMMON_DATA = {
  // Minor Summons
  'fire-sprite': {
    id: 'fire-sprite',
    name: 'Fire Sprite',
    tier: SUMMON_TIER.MINOR,
    element: 'fire',
    icon: '\uD83D\uDD25', // 🔥
    behavior: SUMMON_BEHAVIOR.AGGRESSIVE,
    stats: { hp: 30, attack: 15, defense: 5, speed: 12 },
    abilities: ['ember-strike'],
    mpCost: 15,
    duration: 4,
    description: 'A small fire spirit that launches ember attacks.',
  },
  'ice-wisp': {
    id: 'ice-wisp',
    name: 'Ice Wisp',
    tier: SUMMON_TIER.MINOR,
    element: 'ice',
    icon: '\u2744\uFE0F', // ❄️
    behavior: SUMMON_BEHAVIOR.DEFENSIVE,
    stats: { hp: 35, attack: 10, defense: 10, speed: 8 },
    abilities: ['frost-shield'],
    mpCost: 15,
    duration: 4,
    description: 'A chilling wisp that provides protective frost.',
  },
  'nature-spirit': {
    id: 'nature-spirit',
    name: 'Nature Spirit',
    tier: SUMMON_TIER.MINOR,
    element: 'nature',
    icon: '\uD83C\uDF3F', // 🌿
    behavior: SUMMON_BEHAVIOR.SUPPORT,
    stats: { hp: 25, attack: 8, defense: 8, speed: 10 },
    abilities: ['heal-pulse'],
    mpCost: 18,
    duration: 4,
    description: 'A gentle spirit that heals allies each turn.',
  },

  // Standard Summons
  'shadow-wolf': {
    id: 'shadow-wolf',
    name: 'Shadow Wolf',
    tier: SUMMON_TIER.STANDARD,
    element: 'shadow',
    icon: '\uD83D\uDC3A', // 🐺
    behavior: SUMMON_BEHAVIOR.AGGRESSIVE,
    stats: { hp: 60, attack: 25, defense: 12, speed: 18 },
    abilities: ['shadow-fang', 'howl'],
    mpCost: 30,
    duration: 5,
    description: 'A fierce wolf cloaked in shadow.',
  },
  'stone-golem': {
    id: 'stone-golem',
    name: 'Stone Golem',
    tier: SUMMON_TIER.STANDARD,
    element: 'physical',
    icon: '\uD83E\uDDF1', // 🧱
    behavior: SUMMON_BEHAVIOR.DEFENSIVE,
    stats: { hp: 100, attack: 18, defense: 25, speed: 4 },
    abilities: ['rock-slam', 'fortify'],
    mpCost: 35,
    duration: 5,
    description: 'A sturdy golem that absorbs damage.',
  },
  'storm-hawk': {
    id: 'storm-hawk',
    name: 'Storm Hawk',
    tier: SUMMON_TIER.STANDARD,
    element: 'lightning',
    icon: '\uD83E\uDD85', // 🦅
    behavior: SUMMON_BEHAVIOR.BALANCED,
    stats: { hp: 50, attack: 22, defense: 10, speed: 22 },
    abilities: ['lightning-dive', 'gust'],
    mpCost: 32,
    duration: 5,
    description: 'A swift hawk crackling with electricity.',
  },

  // Greater Summons
  'infernal-knight': {
    id: 'infernal-knight',
    name: 'Infernal Knight',
    tier: SUMMON_TIER.GREATER,
    element: 'fire',
    icon: '\u2694\uFE0F', // ⚔️
    behavior: SUMMON_BEHAVIOR.AGGRESSIVE,
    stats: { hp: 120, attack: 40, defense: 25, speed: 14 },
    abilities: ['flame-slash', 'battle-cry', 'inferno-charge'],
    mpCost: 55,
    duration: 6,
    description: 'A blazing warrior from the infernal realm.',
  },
  'frost-guardian': {
    id: 'frost-guardian',
    name: 'Frost Guardian',
    tier: SUMMON_TIER.GREATER,
    element: 'ice',
    icon: '\uD83E\uDDCA', // 🧊
    behavior: SUMMON_BEHAVIOR.DEFENSIVE,
    stats: { hp: 150, attack: 25, defense: 40, speed: 8 },
    abilities: ['ice-barrier', 'frozen-counter', 'blizzard-aura'],
    mpCost: 55,
    duration: 6,
    description: 'An ancient guardian of frozen wastelands.',
  },
  'celestial-healer': {
    id: 'celestial-healer',
    name: 'Celestial Healer',
    tier: SUMMON_TIER.GREATER,
    element: 'holy',
    icon: '\uD83D\uDC7C', // 👼
    behavior: SUMMON_BEHAVIOR.SUPPORT,
    stats: { hp: 80, attack: 15, defense: 20, speed: 12 },
    abilities: ['divine-heal', 'purify', 'blessing'],
    mpCost: 60,
    duration: 6,
    description: 'A heavenly being that mends wounds.',
  },

  // Legendary Summons
  'ancient-dragon': {
    id: 'ancient-dragon',
    name: 'Ancient Dragon',
    tier: SUMMON_TIER.LEGENDARY,
    element: 'fire',
    icon: '\uD83D\uDC09', // 🐉
    behavior: SUMMON_BEHAVIOR.AGGRESSIVE,
    stats: { hp: 250, attack: 60, defense: 45, speed: 16 },
    abilities: ['dragon-breath', 'tail-sweep', 'infernal-roar', 'meteor-strike'],
    mpCost: 100,
    duration: 5,
    description: 'A legendary dragon of immense power.',
  },
  'void-titan': {
    id: 'void-titan',
    name: 'Void Titan',
    tier: SUMMON_TIER.LEGENDARY,
    element: 'shadow',
    icon: '\uD83C\uDF11', // 🌑
    behavior: SUMMON_BEHAVIOR.BALANCED,
    stats: { hp: 300, attack: 50, defense: 50, speed: 10 },
    abilities: ['void-crush', 'dark-shield', 'entropy-wave', 'reality-tear'],
    mpCost: 120,
    duration: 4,
    description: 'A being from beyond the void.',
  },
};

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  maxActiveSummons: 2,
  summonSlots: 3,
  loyaltyDecayPerTurn: 5,
  baseLoyalty: 100,
};

/**
 * Create a summon instance
 * @param {string} summonId - ID of the summon
 * @param {Object} options - Additional options
 * @returns {Object} Summon instance
 */
export function createSummon(summonId, options = {}) {
  const data = SUMMON_DATA[summonId];
  if (!data) return null;

  const { level = 1, bonusStats = {} } = options;

  // Scale stats with level
  const scaledStats = {};
  for (const [stat, value] of Object.entries(data.stats)) {
    const bonus = bonusStats[stat] || 0;
    scaledStats[stat] = Math.floor(value * (1 + (level - 1) * 0.1)) + bonus;
  }

  return {
    id: data.id,
    instanceId: `${data.id}-${Date.now()}`,
    name: data.name,
    tier: data.tier,
    element: data.element,
    icon: data.icon,
    behavior: data.behavior,
    stats: scaledStats,
    currentHp: scaledStats.hp,
    abilities: [...data.abilities],
    turnsRemaining: data.duration,
    loyalty: DEFAULT_CONFIG.baseLoyalty,
    level,
    isActive: true,
    hasActedThisTurn: false,
  };
}

/**
 * Check if player can summon
 * @param {Object} state - Game state with player and active summons
 * @param {string} summonId - Summon to check
 * @returns {Object} { canSummon, reason }
 */
export function canSummon(state, summonId) {
  const data = SUMMON_DATA[summonId];
  if (!data) {
    return { canSummon: false, reason: 'Invalid summon' };
  }

  const { player = {}, activeSummons = [] } = state;
  const currentMp = player.mp || 0;

  if (currentMp < data.mpCost) {
    return { canSummon: false, reason: `Not enough MP (need ${data.mpCost})` };
  }

  if (activeSummons.length >= DEFAULT_CONFIG.maxActiveSummons) {
    return { canSummon: false, reason: 'Maximum summons reached' };
  }

  // Check if same summon already active
  if (activeSummons.some(s => s.id === summonId)) {
    return { canSummon: false, reason: 'This summon is already active' };
  }

  return { canSummon: true, reason: null };
}

/**
 * Perform summoning
 * @param {Object} state - Game state
 * @param {string} summonId - Summon to create
 * @param {Object} options - Summon options
 * @returns {Object} Updated state with new summon
 */
export function performSummon(state, summonId, options = {}) {
  const check = canSummon(state, summonId);
  if (!check.canSummon) {
    return { state, success: false, reason: check.reason };
  }

  const data = SUMMON_DATA[summonId];
  const summon = createSummon(summonId, options);

  const newState = {
    ...state,
    player: {
      ...state.player,
      mp: state.player.mp - data.mpCost,
    },
    activeSummons: [...(state.activeSummons || []), summon],
  };

  return {
    state: newState,
    success: true,
    summon,
    mpSpent: data.mpCost,
  };
}

/**
 * Process summon turn
 * @param {Object} summon - Summon instance
 * @returns {Object} Updated summon
 */
export function processSummonTurn(summon) {
  if (!summon || !summon.isActive) return summon;

  const turnsRemaining = Math.max(0, summon.turnsRemaining - 1);
  const loyalty = Math.max(0, summon.loyalty - DEFAULT_CONFIG.loyaltyDecayPerTurn);
  const isActive = turnsRemaining > 0 && loyalty > 0;

  return {
    ...summon,
    turnsRemaining,
    loyalty,
    isActive,
    hasActedThisTurn: false,
  };
}

/**
 * Process all summons at turn end
 * @param {Array} summons - Array of active summons
 * @returns {Object} { summons, expired }
 */
export function processAllSummonTurns(summons) {
  if (!Array.isArray(summons)) return { summons: [], expired: [] };

  const processed = summons.map(s => processSummonTurn(s));
  const active = processed.filter(s => s.isActive);
  const expired = processed.filter(s => !s.isActive);

  return { summons: active, expired };
}

/**
 * Get summon action based on behavior
 * @param {Object} summon - Summon instance
 * @param {Object} context - Battle context
 * @returns {Object} Action to take
 */
export function getSummonAction(summon, context = {}) {
  if (!summon || summon.hasActedThisTurn) {
    return { action: 'wait', target: null };
  }

  const { enemies = [], allies = [], playerHp = 100, playerMaxHp = 100 } = context;

  switch (summon.behavior) {
    case SUMMON_BEHAVIOR.AGGRESSIVE:
      // Target lowest HP enemy
      if (enemies.length > 0) {
        const target = enemies.reduce((min, e) =>
          e.hp < min.hp ? e : min
        );
        return { action: 'attack', target, ability: summon.abilities[0] };
      }
      break;

    case SUMMON_BEHAVIOR.DEFENSIVE:
      // Protect if player low HP
      if (playerHp < playerMaxHp * 0.3) {
        return { action: 'defend', target: 'player', ability: summon.abilities[0] };
      }
      // Otherwise attack
      if (enemies.length > 0) {
        return { action: 'attack', target: enemies[0], ability: summon.abilities[0] };
      }
      break;

    case SUMMON_BEHAVIOR.SUPPORT:
      // Heal if any ally low HP
      const lowHpAlly = allies.find(a => a.hp < a.maxHp * 0.5);
      if (lowHpAlly || playerHp < playerMaxHp * 0.5) {
        return {
          action: 'heal',
          target: lowHpAlly || 'player',
          ability: summon.abilities[0],
        };
      }
      // Buff otherwise
      return { action: 'buff', target: 'player', ability: summon.abilities[0] };

    case SUMMON_BEHAVIOR.BALANCED:
    default:
      // 50/50 attack or support
      if (Math.random() < 0.5 && enemies.length > 0) {
        return { action: 'attack', target: enemies[0], ability: summon.abilities[0] };
      }
      return { action: 'defend', target: 'player', ability: summon.abilities[0] };
  }

  return { action: 'wait', target: null };
}

/**
 * Apply damage to summon
 * @param {Object} summon - Summon instance
 * @param {number} damage - Damage to apply
 * @returns {Object} Updated summon
 */
export function damageSummon(summon, damage) {
  if (!summon) return null;

  const actualDamage = Math.max(0, damage);
  const newHp = Math.max(0, summon.currentHp - actualDamage);

  return {
    ...summon,
    currentHp: newHp,
    isActive: newHp > 0,
  };
}

/**
 * Heal summon
 * @param {Object} summon - Summon instance
 * @param {number} amount - Heal amount
 * @returns {Object} Updated summon
 */
export function healSummon(summon, amount) {
  if (!summon || !summon.isActive) return summon;

  const maxHp = summon.stats.hp;
  const newHp = Math.min(maxHp, summon.currentHp + amount);

  return {
    ...summon,
    currentHp: newHp,
  };
}

/**
 * Dismiss a summon early
 * @param {Array} summons - Active summons
 * @param {string} instanceId - Instance ID to dismiss
 * @returns {Array} Updated summons array
 */
export function dismissSummon(summons, instanceId) {
  if (!Array.isArray(summons)) return [];
  return summons.filter(s => s.instanceId !== instanceId);
}

/**
 * Get summon data by ID
 * @param {string} summonId - Summon ID
 * @returns {Object} Summon data
 */
export function getSummonData(summonId) {
  return SUMMON_DATA[summonId] || null;
}

/**
 * Get all summons by tier
 * @param {string} tier - Summon tier
 * @returns {Array} Array of summon IDs
 */
export function getSummonsByTier(tier) {
  return Object.entries(SUMMON_DATA)
    .filter(([, data]) => data.tier === tier)
    .map(([id]) => id);
}

/**
 * Get all summons by element
 * @param {string} element - Element type
 * @returns {Array} Array of summon IDs
 */
export function getSummonsByElement(element) {
  if (!element) return [];
  const normalizedElement = element.toLowerCase();
  return Object.entries(SUMMON_DATA)
    .filter(([, data]) => data.element.toLowerCase() === normalizedElement)
    .map(([id]) => id);
}

/**
 * Get all available summons
 * @returns {Array} Array of summon IDs
 */
export function getAllSummons() {
  return Object.keys(SUMMON_DATA);
}

/**
 * Calculate summon power level
 * @param {Object} summon - Summon instance
 * @returns {number} Power level
 */
export function getSummonPowerLevel(summon) {
  if (!summon) return 0;
  const { stats } = summon;
  return Math.floor(
    (stats.hp / 10) +
    (stats.attack * 2) +
    (stats.defense * 1.5) +
    (stats.speed * 0.5)
  );
}

/**
 * Get summon summary
 * @param {Object} summon - Summon instance
 * @returns {Object} Summary info
 */
export function getSummonSummary(summon) {
  if (!summon) {
    return { name: 'None', hp: 0, turnsRemaining: 0 };
  }

  return {
    name: summon.name,
    icon: summon.icon,
    element: summon.element,
    hp: summon.currentHp,
    maxHp: summon.stats.hp,
    turnsRemaining: summon.turnsRemaining,
    loyalty: summon.loyalty,
    isActive: summon.isActive,
    behavior: summon.behavior,
  };
}

/**
 * Get tier display name
 * @param {string} tier - Tier value
 * @returns {string} Display name
 */
export function getTierDisplayName(tier) {
  const names = {
    [SUMMON_TIER.MINOR]: 'Minor',
    [SUMMON_TIER.STANDARD]: 'Standard',
    [SUMMON_TIER.GREATER]: 'Greater',
    [SUMMON_TIER.LEGENDARY]: 'Legendary',
  };
  return names[tier] || 'Unknown';
}
