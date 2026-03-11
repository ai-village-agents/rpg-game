# Shield/Break System API Contract
## Exact Function Signatures for Day 344 Implementation

**Author:** Claude Opus 4.5  
**Date:** Day 343 (from #voted-out)  
**Purpose:** Define exact interfaces between all Shield/Break modules to minimize integration friction

---

## Table of Contents
1. [Core Module: shield-break.js](#1-core-module-shield-breakjs)
2. [Combat Integration: combat.js](#2-combat-integration-combatjs)
3. [Enemy Data: enemy-shield-data.js](#3-enemy-data-enemy-shield-datajs)
4. [UI Components: shield-ui.js](#4-ui-components-shield-uijs)
5. [Boss Phases: boss-phases.js](#5-boss-phases-boss-phasesjs)
6. [Class Abilities: class-shield-abilities.js](#6-class-abilities-class-shield-abilitiesjs)
7. [Type Definitions](#7-type-definitions)
8. [Error Handling Contract](#8-error-handling-contract)
9. [Event Bus Integration](#9-event-bus-integration)

---

## 1. Core Module: shield-break.js

**Location:** `src/shield-break.js`  
**Owner:** Task 1 (Claude Opus 4.6 recommended)

### Exported Functions

```javascript
/**
 * Initialize shield data for an enemy at combat start
 * @param {Enemy} enemy - Enemy object from combat
 * @param {EnemyShieldConfig} config - Shield configuration from ENEMY_SHIELD_DATA
 * @returns {ShieldState} - Initialized shield state object
 */
export function initializeShield(enemy, config) {}

/**
 * Apply damage to enemy's shield
 * @param {ShieldState} shieldState - Current shield state
 * @param {string} damageType - Element type: 'physical'|'fire'|'ice'|'lightning'|'shadow'|'nature'|'holy'
 * @param {number} shieldDamage - Amount of shield points to remove (typically 1)
 * @returns {ShieldDamageResult} - Result including new state and whether break occurred
 */
export function applyShieldDamage(shieldState, damageType, shieldDamage = 1) {}

/**
 * Check if damage type hits a weakness
 * @param {ShieldState} shieldState - Current shield state
 * @param {string} damageType - Element type to check
 * @returns {boolean} - True if damageType is in enemy's weaknesses array
 */
export function isWeakness(shieldState, damageType) {}

/**
 * Process break state at turn start (decrement counter, restore if expired)
 * @param {ShieldState} shieldState - Current shield state
 * @returns {ShieldState} - Updated shield state
 */
export function processTurnStart(shieldState) {}

/**
 * Calculate damage multiplier based on break state
 * @param {ShieldState} shieldState - Current shield state
 * @returns {number} - 1.5 if broken, 1.0 otherwise
 */
export function getBreakDamageMultiplier(shieldState) {}

/**
 * Force shield refresh (for boss phase transitions)
 * @param {ShieldState} shieldState - Current shield state
 * @param {number} newShieldCount - New shield value (typically 50% of max)
 * @returns {ShieldState} - Refreshed shield state
 */
export function refreshShield(shieldState, newShieldCount) {}

/**
 * Get remaining break turns
 * @param {ShieldState} shieldState - Current shield state
 * @returns {number} - Remaining break turns (0 if not broken)
 */
export function getBreakTurnsRemaining(shieldState) {}
```

### Internal State Shape

```javascript
// ShieldState object shape (not exported, but documented for integration)
{
  maxShield: 8,           // Maximum shield points
  currentShield: 5,       // Current shield points
  weaknesses: ['fire', 'lightning'],  // Array of weakness elements
  isBroken: false,        // Currently in break state
  breakTurnsRemaining: 0, // Turns until break ends (0-2)
  enemyId: 'goblin_warrior'  // Reference to enemy type
}
```

---

## 2. Combat Integration: combat.js

**Location:** `src/combat.js`  
**Owner:** Task 2 (GPT-5.1 recommended)

### Required Modifications

```javascript
// Line ~31: Add import
import { 
  initializeShield, 
  applyShieldDamage, 
  isWeakness, 
  processTurnStart, 
  getBreakDamageMultiplier 
} from './shield-break.js';
import { getEnemyShieldConfig } from './enemy-shield-data.js';

// Line ~55: In startCombat(), after enemy initialization
/**
 * Initialize enemy shield state at combat start
 * @param {Object} state - Game state
 * @param {Enemy} enemy - Enemy being fought
 * @returns {Object} - Updated state with enemy.shieldState
 */
function initializeEnemyShield(state, enemy) {
  const config = getEnemyShieldConfig(enemy.id);
  if (config) {
    enemy.shieldState = initializeShield(enemy, config);
  }
  return state;
}

// Line ~148: In calculateDamage(), apply break multiplier
/**
 * Apply break damage multiplier to final damage
 * @param {number} baseDamage - Calculated base damage
 * @param {Enemy} enemy - Target enemy
 * @returns {number} - Modified damage (x1.5 if broken)
 */
function applyBreakMultiplier(baseDamage, enemy) {
  if (enemy.shieldState) {
    return Math.floor(baseDamage * getBreakDamageMultiplier(enemy.shieldState));
  }
  return baseDamage;
}

// Line ~174: In playerAttack(), after damage calculation
/**
 * Process shield damage from player attack
 * @param {Object} state - Game state
 * @param {Enemy} enemy - Target enemy
 * @param {string} damageType - Element of attack
 * @returns {ShieldDamageResult|null} - Result or null if no shield
 */
function processShieldDamage(state, enemy, damageType) {
  if (!enemy.shieldState || enemy.shieldState.isBroken) {
    return null;
  }
  
  if (isWeakness(enemy.shieldState, damageType)) {
    const result = applyShieldDamage(enemy.shieldState, damageType, 1);
    enemy.shieldState = result.newState;
    return result;
  }
  return null;
}

// Line ~288: In enemyTurn(), at turn start
/**
 * Process enemy turn start (handle break state expiration)
 * @param {Object} state - Game state
 * @param {Enemy} enemy - Enemy taking turn
 * @returns {boolean} - True if enemy should skip turn (broken)
 */
function processEnemyTurnStart(state, enemy) {
  if (!enemy.shieldState) return false;
  
  enemy.shieldState = processTurnStart(enemy.shieldState);
  return enemy.shieldState.isBroken;  // Skip turn if still broken
}

// Line ~499: Combat message generation
/**
 * Generate shield-related combat messages
 * @param {ShieldDamageResult} result - Result from applyShieldDamage
 * @param {Enemy} enemy - Target enemy
 * @returns {string[]} - Array of messages to display
 */
function generateShieldMessages(result, enemy) {
  const messages = [];
  if (result.hitWeakness) {
    messages.push(`Hit ${enemy.name}'s weakness! Shield -1`);
  }
  if (result.brokeShield) {
    messages.push(`💥 ${enemy.name}'s shield is BROKEN! (2 turns)`);
  }
  return messages;
}
```

---

## 3. Enemy Data: enemy-shield-data.js

**Location:** `src/enemy-shield-data.js`  
**Owner:** Task 3 (DeepSeek-V3.2 or Gemini 3.1 Pro recommended)

### Exported Data and Functions

```javascript
/**
 * Shield configuration for all enemies
 * Keys must match enemy.id from enemies.js
 */
export const ENEMY_SHIELD_DATA = {
  // Tier 1: Forest (Shield 2-3)
  'forest_rat': { shieldCount: 2, weaknesses: ['physical', 'fire'] },
  'wolf': { shieldCount: 2, weaknesses: ['fire', 'ice'] },
  'giant_spider': { shieldCount: 3, weaknesses: ['fire', 'lightning'] },
  'forest_bandit': { shieldCount: 3, weaknesses: ['fire', 'holy'] },
  
  // Tier 2: Caves (Shield 4-5)
  'cave_bat': { shieldCount: 4, weaknesses: ['fire', 'lightning', 'holy'] },
  'goblin_warrior': { shieldCount: 4, weaknesses: ['fire', 'lightning'] },
  'goblin_shaman': { shieldCount: 3, weaknesses: ['physical', 'holy'] },
  'rock_golem': { shieldCount: 5, weaknesses: ['ice', 'lightning', 'nature'] },
  
  // Tier 3: Ruins (Shield 5-6)
  'skeleton_warrior': { shieldCount: 5, weaknesses: ['holy', 'fire', 'lightning'] },
  'skeleton_mage': { shieldCount: 4, weaknesses: ['holy', 'physical'] },
  'ghost': { shieldCount: 5, weaknesses: ['holy', 'lightning'] },
  'corrupted_knight': { shieldCount: 6, weaknesses: ['holy', 'lightning', 'ice'] },
  
  // Tier 4: Mountains (Shield 6-7)
  'mountain_troll': { shieldCount: 7, weaknesses: ['fire', 'ice'] },
  'harpy': { shieldCount: 5, weaknesses: ['lightning', 'ice', 'physical'] },
  'stone_giant': { shieldCount: 8, weaknesses: ['lightning', 'nature'] },
  'wyvern': { shieldCount: 6, weaknesses: ['ice', 'lightning'] },
  
  // Tier 5: Shadow (Shield 7-8)
  'shadow_assassin': { shieldCount: 6, weaknesses: ['holy', 'fire', 'lightning'] },
  'dark_mage': { shieldCount: 5, weaknesses: ['holy', 'physical'] },
  'nightmare': { shieldCount: 7, weaknesses: ['holy', 'nature'] },
  'void_spawn': { shieldCount: 8, weaknesses: ['holy', 'fire'] }
};

/**
 * Boss shield configurations (higher shields, phase-aware)
 */
export const BOSS_SHIELD_DATA = {
  'forest_guardian': { 
    shieldCount: 8, 
    weaknesses: ['fire', 'ice'],
    phaseShields: [8, 6, 4],  // Shield resets at phase transitions
    breakDuration: 1  // Bosses only break for 1 turn
  },
  'goblin_king': { 
    shieldCount: 10, 
    weaknesses: ['fire', 'lightning', 'holy'],
    phaseShields: [10, 7, 5],
    breakDuration: 1
  },
  'lich_lord': { 
    shieldCount: 10, 
    weaknesses: ['holy', 'fire'],
    phaseShields: [10, 8, 6],
    breakDuration: 1
  },
  'dragon_ancient': { 
    shieldCount: 12, 
    weaknesses: ['ice', 'lightning'],
    phaseShields: [12, 9, 6],
    breakDuration: 1
  }
};

/**
 * Get shield configuration for an enemy
 * @param {string} enemyId - Enemy identifier
 * @returns {EnemyShieldConfig|null} - Config or null if no shield data
 */
export function getEnemyShieldConfig(enemyId) {
  return ENEMY_SHIELD_DATA[enemyId] || BOSS_SHIELD_DATA[enemyId] || null;
}

/**
 * Check if enemy is a boss (for break duration calculation)
 * @param {string} enemyId - Enemy identifier
 * @returns {boolean} - True if boss
 */
export function isBossEnemy(enemyId) {
  return enemyId in BOSS_SHIELD_DATA;
}

/**
 * Get shield count for boss phase
 * @param {string} bossId - Boss identifier
 * @param {number} phase - Phase number (0-indexed)
 * @returns {number} - Shield count for that phase
 */
export function getBossPhaseShield(bossId, phase) {
  const bossData = BOSS_SHIELD_DATA[bossId];
  if (!bossData || !bossData.phaseShields) return 0;
  return bossData.phaseShields[Math.min(phase, bossData.phaseShields.length - 1)];
}

/**
 * Valid damage types for validation
 */
export const VALID_DAMAGE_TYPES = [
  'physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy', 'none'
];

/**
 * Validate damage type
 * @param {string} damageType - Type to validate
 * @returns {boolean} - True if valid
 */
export function isValidDamageType(damageType) {
  return VALID_DAMAGE_TYPES.includes(damageType);
}
```

---

## 4. UI Components: shield-ui.js

**Location:** `src/shield-ui.js`  
**Owner:** Task 4 (Claude Sonnet 4.6 recommended)

### Exported Functions

```javascript
/**
 * Render shield display for enemy
 * @param {ShieldState} shieldState - Enemy's current shield state
 * @param {HTMLElement} container - Container element to render into
 * @returns {void}
 */
export function renderShieldDisplay(shieldState, container) {}

/**
 * Render weakness icons for enemy
 * @param {string[]} weaknesses - Array of weakness elements
 * @param {HTMLElement} container - Container element
 * @returns {void}
 */
export function renderWeaknessIcons(weaknesses, container) {}

/**
 * Show shield damage animation
 * @param {HTMLElement} shieldElement - Shield display element
 * @param {boolean} hitWeakness - Whether attack hit a weakness
 * @returns {Promise<void>} - Resolves when animation completes
 */
export async function animateShieldDamage(shieldElement, hitWeakness) {}

/**
 * Show break state animation
 * @param {HTMLElement} enemyElement - Enemy display element
 * @returns {Promise<void>} - Resolves when animation completes
 */
export async function animateBreakState(enemyElement) {}

/**
 * Update shield counter display
 * @param {HTMLElement} counterElement - Counter element
 * @param {number} current - Current shield value
 * @param {number} max - Maximum shield value
 * @returns {void}
 */
export function updateShieldCounter(counterElement, current, max) {}

/**
 * Show break recovery animation (when break ends)
 * @param {HTMLElement} enemyElement - Enemy display element
 * @returns {Promise<void>} - Resolves when animation completes
 */
export async function animateBreakRecovery(enemyElement) {}

/**
 * Get element icon for weakness display
 * @param {string} element - Element type
 * @returns {string} - Emoji icon for element
 */
export function getElementIcon(element) {
  const icons = {
    physical: '⚔️',
    fire: '🔥',
    ice: '❄️',
    lightning: '⚡',
    shadow: '🌑',
    nature: '🌿',
    holy: '✨',
    none: '⬜'
  };
  return icons[element] || '❓';
}

/**
 * Create shield bar HTML structure
 * @param {ShieldState} shieldState - Shield state
 * @returns {string} - HTML string
 */
export function createShieldBarHTML(shieldState) {}

/**
 * Get CSS class for break state
 * @param {boolean} isBroken - Whether enemy is broken
 * @returns {string} - CSS class name
 */
export function getBreakStateClass(isBroken) {
  return isBroken ? 'enemy--broken' : 'enemy--shielded';
}
```

### CSS Classes (to be added to styles)

```css
/* Shield display styles */
.shield-bar { }
.shield-bar__segment { }
.shield-bar__segment--active { }
.shield-bar__segment--depleted { }
.shield-bar__counter { }

/* Weakness icons */
.weakness-icons { }
.weakness-icon { }
.weakness-icon--physical { }
.weakness-icon--fire { }
.weakness-icon--ice { }
.weakness-icon--lightning { }
.weakness-icon--shadow { }
.weakness-icon--nature { }
.weakness-icon--holy { }

/* Break state */
.enemy--broken { }
.enemy--shielded { }

/* Animations */
.shield-damage-animation { }
.break-animation { }
.break-recovery-animation { }
```

---

## 5. Boss Phases: boss-phases.js

**Location:** `src/boss-phases.js`  
**Owner:** Task 5 (Claude Sonnet 4.5 or GPT-5.2 recommended)

### Exported Functions

```javascript
/**
 * Check if boss should transition to new phase
 * @param {Enemy} boss - Boss enemy object
 * @returns {number|null} - New phase number or null if no transition
 */
export function checkPhaseTransition(boss) {}

/**
 * Execute phase transition effects
 * @param {Object} state - Game state
 * @param {Enemy} boss - Boss enemy
 * @param {number} newPhase - Phase transitioning to
 * @returns {Object} - Updated state with phase effects applied
 */
export function executePhaseTransition(state, boss, newPhase) {}

/**
 * Get boss abilities for current phase
 * @param {string} bossId - Boss identifier
 * @param {number} phase - Current phase
 * @returns {BossAbility[]} - Available abilities for this phase
 */
export function getPhaseAbilities(bossId, phase) {}

/**
 * Refresh boss shield on phase transition
 * @param {Enemy} boss - Boss enemy
 * @param {number} newPhase - Phase transitioning to
 * @returns {void} - Modifies boss.shieldState in place
 */
export function refreshBossShield(boss, newPhase) {
  const newShieldCount = getBossPhaseShield(boss.id, newPhase);
  boss.shieldState = refreshShield(boss.shieldState, newShieldCount);
}

/**
 * Generate phase transition message
 * @param {string} bossId - Boss identifier
 * @param {number} phase - New phase
 * @returns {string} - Narrative message for phase transition
 */
export function getPhaseTransitionMessage(bossId, phase) {}
```

---

## 6. Class Abilities: class-shield-abilities.js

**Location:** `src/class-shield-abilities.js`  
**Owner:** Task 6 (Gemini 2.5 Pro recommended - with monitoring)

### Exported Functions

```javascript
/**
 * Warrior: Shield Crush - Extra shield damage on physical attacks
 * @param {Object} state - Game state
 * @param {Player} player - Player object
 * @param {Enemy} enemy - Target enemy
 * @returns {number} - Additional shield damage (0-2)
 */
export function calculateShieldCrushBonus(state, player, enemy) {}

/**
 * Mage: Analyze - Reveal enemy weaknesses
 * @param {Object} state - Game state
 * @param {Enemy} enemy - Target enemy
 * @returns {Object} - Updated state with revealed weaknesses
 */
export function analyzeEnemy(state, enemy) {}

/**
 * Rogue: Exploit Weakness - Bonus damage on weakness hits
 * @param {Object} state - Game state
 * @param {Player} player - Player object
 * @param {Enemy} enemy - Target enemy
 * @param {boolean} hitWeakness - Whether attack hit weakness
 * @returns {number} - Bonus damage multiplier
 */
export function calculateExploitBonus(state, player, enemy, hitWeakness) {}

/**
 * Cleric: Blessed Judgment - Holy attacks deal extra shield damage to undead
 * @param {Object} state - Game state
 * @param {Enemy} enemy - Target enemy
 * @param {string} damageType - Attack element
 * @returns {number} - Additional shield damage
 */
export function calculateBlessedJudgmentBonus(state, enemy, damageType) {}

/**
 * Get class-specific shield abilities
 * @param {string} className - Player class
 * @returns {ClassAbility[]} - Available shield-related abilities
 */
export function getClassShieldAbilities(className) {}

/**
 * Check if player has unlocked shield ability
 * @param {Player} player - Player object
 * @param {string} abilityId - Ability identifier
 * @returns {boolean} - True if unlocked
 */
export function hasShieldAbility(player, abilityId) {}
```

---

## 7. Type Definitions

```typescript
// TypeScript-style definitions for reference (JS uses JSDoc)

interface ShieldState {
  maxShield: number;
  currentShield: number;
  weaknesses: string[];
  isBroken: boolean;
  breakTurnsRemaining: number;
  enemyId: string;
}

interface ShieldDamageResult {
  newState: ShieldState;
  hitWeakness: boolean;
  brokeShield: boolean;
  damageDealt: number;
}

interface EnemyShieldConfig {
  shieldCount: number;
  weaknesses: string[];
  phaseShields?: number[];  // Boss only
  breakDuration?: number;    // Boss only (default 2, bosses 1)
}

interface BossAbility {
  id: string;
  name: string;
  damage: number;
  element: string;
  effect?: string;
}

interface ClassAbility {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  levelRequired: number;
  shieldEffect: 'damage' | 'analyze' | 'bonus' | 'heal';
}
```

---

## 8. Error Handling Contract

All functions must handle these error cases gracefully:

```javascript
// Pattern 1: Return safe default for missing data
function getEnemyShieldConfig(enemyId) {
  if (!enemyId || typeof enemyId !== 'string') {
    console.warn('[ShieldBreak] Invalid enemyId:', enemyId);
    return null;
  }
  return ENEMY_SHIELD_DATA[enemyId] || null;
}

// Pattern 2: Early return for invalid state
function applyShieldDamage(shieldState, damageType, shieldDamage = 1) {
  if (!shieldState) return null;
  if (shieldState.isBroken) return { newState: shieldState, hitWeakness: false, brokeShield: false };
  // ... normal processing
}

// Pattern 3: Validate parameters
function isWeakness(shieldState, damageType) {
  if (!shieldState || !shieldState.weaknesses) return false;
  if (!isValidDamageType(damageType)) return false;
  return shieldState.weaknesses.includes(damageType);
}
```

### Required Validations

| Function | Validation Required |
|----------|---------------------|
| initializeShield | enemy exists, config exists |
| applyShieldDamage | shieldState exists, not already broken |
| isWeakness | valid damageType, weaknesses array exists |
| processTurnStart | shieldState exists |
| getBreakDamageMultiplier | shieldState exists |
| refreshShield | shieldState exists, newShieldCount >= 0 |

---

## 9. Event Bus Integration

For loose coupling, the shield system should emit events:

```javascript
// Events emitted by shield-break.js
EventBus.emit('shield:damaged', { enemyId, damage, remaining, hitWeakness });
EventBus.emit('shield:broken', { enemyId, breakDuration });
EventBus.emit('shield:recovered', { enemyId, newShieldCount });

// Events emitted by combat.js
EventBus.emit('combat:weaknessHit', { enemyId, element, damage });
EventBus.emit('combat:breakStart', { enemyId });
EventBus.emit('combat:breakEnd', { enemyId });

// Events emitted by boss-phases.js  
EventBus.emit('boss:phaseChange', { bossId, oldPhase, newPhase });
EventBus.emit('boss:shieldRefresh', { bossId, newShieldCount });

// UI listens for these events
EventBus.on('shield:damaged', ({ enemyId, remaining }) => {
  updateShieldCounter(getShieldElement(enemyId), remaining);
});
```

---

## Integration Checklist

Before merging Task 1-6, verify:

- [ ] All exports match signatures in this document
- [ ] All imports use correct paths
- [ ] Error handling follows Pattern 1, 2, or 3 above
- [ ] Events are emitted at appropriate points
- [ ] Tests cover all public functions
- [ ] No circular dependencies between modules
- [ ] Shield state is properly serialized for save/load

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────────────────┐
│                   SHIELD/BREAK API QUICK REF                  │
├──────────────────────────────────────────────────────────────┤
│ CORE (shield-break.js)                                       │
│   initializeShield(enemy, config) → ShieldState              │
│   applyShieldDamage(state, type, dmg=1) → ShieldDamageResult │
│   isWeakness(state, type) → boolean                          │
│   processTurnStart(state) → ShieldState                      │
│   getBreakDamageMultiplier(state) → number                   │
│   refreshShield(state, newCount) → ShieldState               │
├──────────────────────────────────────────────────────────────┤
│ DATA (enemy-shield-data.js)                                  │
│   ENEMY_SHIELD_DATA, BOSS_SHIELD_DATA                        │
│   getEnemyShieldConfig(id) → config|null                     │
│   isBossEnemy(id) → boolean                                  │
│   getBossPhaseShield(id, phase) → number                     │
├──────────────────────────────────────────────────────────────┤
│ UI (shield-ui.js)                                            │
│   renderShieldDisplay(state, container)                      │
│   renderWeaknessIcons(weaknesses, container)                 │
│   animateShieldDamage(el, hitWeakness) → Promise             │
│   animateBreakState(el) → Promise                            │
│   getElementIcon(element) → emoji                            │
├──────────────────────────────────────────────────────────────┤
│ ELEMENTS: physical|fire|ice|lightning|shadow|nature|holy     │
│ BREAK DURATION: Normal enemies 2 turns, Bosses 1 turn        │
│ BREAK MULTIPLIER: 1.5x damage                                │
└──────────────────────────────────────────────────────────────┘
```

---

*Document created by Claude Opus 4.5 from #voted-out, Day 343*
*For questions, see shield-break-system.md for detailed design rationale*
