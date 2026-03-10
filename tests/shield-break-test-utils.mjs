/**
 * Shield/Break Test Utilities — AI Village RPG
 * Shared mock creators and helpers for Shield/Break system tests
 *
 * Created Day 343 (Opus 4.5 Claude Code from #voted-out)
 * Used by all 6 Day 344 task test files
 *
 * Usage:
 * import { createMockPlayer, createMockEnemy, createMockCombatState } from './shield-break-test-utils.mjs';
 */

// ═══════════════════════════════════════════════════════════════════════════
// MOCK PLAYER FACTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a mock player with shield/break system properties
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock player object
 */
export function createMockPlayer(overrides = {}) {
  return {
    name: 'Hero',
    class: 'warrior',
    level: 5,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    atk: 15,
    def: 10,
    speed: 10,
    defending: false,
    statusEffects: [],
    equipment: {},
    abilities: ['attack', 'defend', 'fireball'],
    ...overrides
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK ENEMY FACTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a mock enemy with full shield/break properties
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock enemy object
 */
export function createMockEnemy(overrides = {}) {
  return {
    id: 'goblin',
    name: 'Goblin',
    hp: 50,
    maxHp: 50,
    atk: 8,
    def: 5,
    speed: 7,
    defending: false,
    statusEffects: [],
    element: null,
    // Shield/Break properties
    maxShields: 2,
    currentShields: 2,
    weaknesses: ['fire', 'holy'],
    immunities: [],
    absorbs: [],
    isBroken: false,
    breakTurnsRemaining: 0,
    ...overrides
  };
}

/**
 * Create a mock boss enemy with phase support
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock boss object
 */
export function createMockBoss(overrides = {}) {
  return {
    id: 'goblin_chief',
    name: 'Goblin Chief',
    tier: 'mini-boss',
    hp: 150,
    maxHp: 150,
    atk: 15,
    def: 10,
    speed: 8,
    defending: false,
    statusEffects: [],
    // Shield/Break properties
    maxShields: 5,
    currentShields: 5,
    weaknesses: ['fire', 'holy'],
    immunities: [],
    absorbs: [],
    isBroken: false,
    breakTurnsRemaining: 0,
    // Boss-specific
    currentPhase: 1,
    phases: [
      { trigger: 'hp_below_75', action: 'summon', shieldRegen: 2 },
      { trigger: 'hp_below_40', action: 'enrage' }
    ],
    isChanneling: false,
    channelTurnsRemaining: 0,
    ...overrides
  };
}

/**
 * Create a mock multi-part boss
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock multi-part boss object
 */
export function createMockMultiPartBoss(overrides = {}) {
  return {
    id: 'abyss_overlord',
    name: 'Abyss Overlord',
    tier: 'final-boss',
    hp: 500,
    maxHp: 500,
    atk: 35,
    def: 20,
    // Shield properties
    maxShields: 10,
    currentShields: 10,
    weaknesses: ['holy', 'lightning'],
    immunities: ['shadow'],
    absorbs: [],
    isBroken: false,
    breakTurnsRemaining: 0,
    currentPhase: 1,
    parts: [
      {
        id: 'left_arm',
        name: 'Left Arm',
        hp: 100,
        maxHp: 100,
        maxShields: 3,
        currentShields: 3,
        weaknesses: ['fire'],
        destroyed: false
      },
      {
        id: 'right_arm',
        name: 'Right Arm',
        hp: 100,
        maxHp: 100,
        maxShields: 3,
        currentShields: 3,
        weaknesses: ['ice'],
        destroyed: false
      }
    ],
    ...overrides
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK COMBAT STATE FACTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a complete mock combat state
 * @param {Object} overrides - Properties to override (can include player/enemy overrides)
 * @returns {Object} Mock combat state
 */
export function createMockCombatState(overrides = {}) {
  const { player: playerOverrides, enemy: enemyOverrides, ...stateOverrides } = overrides;

  return {
    phase: 'player-turn',
    turn: 1,
    player: createMockPlayer(playerOverrides),
    enemy: createMockEnemy(enemyOverrides),
    companions: [],
    worldEvent: null,
    log: [],
    rngSeed: 12345,
    ...stateOverrides
  };
}

/**
 * Create mock combat state with a boss
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock boss combat state
 */
export function createMockBossCombatState(overrides = {}) {
  const { player: playerOverrides, boss: bossOverrides, ...stateOverrides } = overrides;

  return {
    phase: 'player-turn',
    turn: 1,
    player: createMockPlayer(playerOverrides),
    enemy: createMockBoss(bossOverrides),
    companions: [],
    worldEvent: null,
    log: [],
    isBossFight: true,
    ...stateOverrides
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESET ENEMIES (from enemy-weakness-database.md)
// ═══════════════════════════════════════════════════════════════════════════

export const PRESET_ENEMIES = {
  // Tier 1 - Basic
  slime: () => createMockEnemy({
    id: 'slime', name: 'Slime',
    hp: 30, maxHp: 30, atk: 5, def: 2,
    maxShields: 2, currentShields: 2,
    weaknesses: ['fire', 'lightning'],
    immunities: []
  }),

  goblin: () => createMockEnemy({
    id: 'goblin', name: 'Goblin',
    hp: 40, maxHp: 40, atk: 8, def: 4,
    maxShields: 2, currentShields: 2,
    weaknesses: ['fire', 'holy']
  }),

  cave_bat: () => createMockEnemy({
    id: 'cave_bat', name: 'Cave Bat',
    hp: 20, maxHp: 20, atk: 6, def: 2,
    maxShields: 1, currentShields: 1,
    weaknesses: ['fire', 'lightning', 'holy']
  }),

  // Tier 2 - Standard
  skeleton: () => createMockEnemy({
    id: 'skeleton', name: 'Skeleton',
    hp: 60, maxHp: 60, atk: 12, def: 8,
    maxShields: 3, currentShields: 3,
    weaknesses: ['holy', 'fire'],
    immunities: ['shadow']
  }),

  orc: () => createMockEnemy({
    id: 'orc', name: 'Orc',
    hp: 80, maxHp: 80, atk: 15, def: 10,
    maxShields: 4, currentShields: 4,
    weaknesses: ['fire', 'holy']
  }),

  // Tier 3 - Elemental
  fire_spirit: () => createMockEnemy({
    id: 'fire-spirit', name: 'Fire Spirit',
    hp: 50, maxHp: 50, atk: 14, def: 6,
    element: 'fire',
    maxShields: 3, currentShields: 3,
    weaknesses: ['ice', 'holy'],
    immunities: ['fire'],
    absorbs: ['fire']
  }),

  ghost: () => createMockEnemy({
    id: 'ghost', name: 'Ghost',
    hp: 45, maxHp: 45, atk: 10, def: 4,
    maxShields: 4, currentShields: 4,
    weaknesses: ['holy', 'fire'],
    immunities: ['physical', 'shadow'],
    absorbs: ['shadow']
  }),

  // Special
  training_dummy: () => createMockEnemy({
    id: 'training_dummy', name: 'Training Dummy',
    hp: 999, maxHp: 999, atk: 0, def: 0,
    maxShields: 2, currentShields: 2,
    weaknesses: ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'],
    breakImmune: true
  })
};

// ═══════════════════════════════════════════════════════════════════════════
// PRESET BOSSES
// ═══════════════════════════════════════════════════════════════════════════

export const PRESET_BOSSES = {
  goblin_chief: () => createMockBoss({
    id: 'goblin_chief', name: 'Goblin Chief',
    hp: 150, maxHp: 150,
    maxShields: 5, currentShields: 5,
    weaknesses: ['fire', 'holy']
  }),

  dragon: () => createMockBoss({
    id: 'dragon', name: 'Dragon',
    tier: 'major-boss',
    hp: 350, maxHp: 350, atk: 25, def: 15,
    maxShields: 8, currentShields: 8,
    weaknesses: ['ice', 'holy'],
    immunities: ['fire'],
    phases: [
      { trigger: 'hp_below_60', action: 'begin_channel', channelTurns: 2 },
      { trigger: 'hp_below_25', action: 'desperate' }
    ]
  }),

  abyss_overlord: () => createMockMultiPartBoss()
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST ASSERTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard assert function with pass/fail tracking
 */
export function createAssert() {
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      passed++;
      console.log(`  ✅ ${msg}`);
    } else {
      failed++;
      console.error(`  ❌ FAIL: ${msg}`);
    }
  };

  assert.getStats = () => ({ passed, failed });
  assert.printSummary = (testName) => {
    console.log('\n========================================');
    console.log(`${testName}: ${passed} passed, ${failed} failed`);
    console.log('========================================');
    return failed;
  };

  return assert;
}

// ═══════════════════════════════════════════════════════════════════════════
// ELEMENT CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const ELEMENTS = ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'];

export const ELEMENT_ICONS = {
  physical: '⚔️',
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  shadow: '🌑',
  nature: '🌿',
  holy: '✨'
};

export const BANNED_WORDS = [
  'egg', 'easter', 'yolk', 'omelet', 'bunny',
  'rabbit', 'chick', 'basket', 'cockatrice', 'basilisk'
];

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY CHECK HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if text contains banned words
 * @param {string} text - Text to check
 * @returns {boolean} True if contains banned word
 */
export function containsBannedWord(text) {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word));
}

/**
 * Check for zero-width characters
 * @param {string} text - Text to check
 * @returns {boolean} True if contains zero-width chars
 */
export function containsZeroWidthChars(text) {
  const zeroWidthPattern = /[\u200B\u200C\u200D\uFEFF]/;
  return zeroWidthPattern.test(text);
}
