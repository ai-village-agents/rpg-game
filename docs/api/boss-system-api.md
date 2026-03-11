# Boss Battle System API Documentation

**Version:** 1.0.0  
**Last Updated:** Day 343  
**Author:** Claude Opus 4.5 (from #voted-out)  
**Source File:** `src/boss.js` (325 lines)

## Table of Contents

1. [Overview](#overview)
2. [Boss Data Structure](#boss-data-structure)
3. [Phase System](#phase-system)
4. [Core API Functions](#core-api-functions)
5. [Combat Functions](#combat-functions)
6. [AI System](#ai-system)
7. [UI Helper Functions](#ui-helper-functions)
8. [Integration Guide](#integration-guide)
9. [Usage Examples](#usage-examples)

---

## Overview

The Boss Battle System handles multi-phase boss fights with special mechanics, AI behavior patterns, and phase transitions based on HP thresholds. Bosses have multiple phases with different stats, abilities, and behaviors.

### Key Features

- **Multi-Phase Fights:** Bosses transition through phases as HP decreases
- **HP Threshold Triggers:** Automatic phase transitions at specific HP percentages
- **AI Behavior Patterns:** Aggressive, caster, and basic behavior modes
- **Phase Dialogue:** Story moments during phase transitions
- **Special Abilities:** Boss-specific abilities with effects and MP costs

### Architecture Flow

```
createBossEncounter(bossId) → Initial boss state (phase 1)
        ↓
Player attacks → applyDamageToBoss(boss, damage)
        ↓
checkPhaseTransition(boss) → Is HP below threshold?
        ↓ (yes)
transitionToPhase(boss, newPhase) → Update stats/abilities
        ↓
selectBossAbility(boss) → AI chooses action
        ↓
calculateBossAbilityDamage() → Damage to player
        ↓
isBossDefeated(boss) → getBossRewards(boss)
```

---

## Boss Data Structure

### Boss Encounter State

Created by `createBossEncounter()`:

```javascript
{
  // Identity
  bossId: 'forest_guardian',
  id: 'forest_guardian',
  name: 'Forest Guardian',
  description: 'Ancient protector of the woods',
  isBoss: true,
  element: 'nature',
  
  // Current Stats (from active phase)
  currentHp: 500,
  hp: 500,              // Alias for currentHp
  maxHp: 500,
  mp: 100,
  maxMp: 100,
  atk: 35,
  def: 20,
  spd: 15,
  
  // Abilities (phase-specific)
  abilities: ['vine_whip', 'nature_heal', 'root_bind'],
  aiBehavior: 'balanced',
  
  // Phase Tracking
  currentPhase: 1,
  totalPhases: 3,
  phases: [...],        // Array of phase definitions
  phaseJustChanged: false,
  phaseChangeDialogue: null,
  
  // Status
  statusEffects: [],
  
  // Rewards
  xpReward: 250,
  goldReward: 100,
  drops: [{ itemId: 'forest_amulet', chance: 0.3 }]
}
```

### Phase Definition

Each phase in `boss.phases[]`:

```javascript
{
  phase: 2,              // Phase number (1-indexed)
  name: 'Enraged Form',
  hpThreshold: 0.5,      // Triggers at 50% HP
  maxHp: 500,            // Used for phase 1 only
  mp: 120,
  maxMp: 120,
  atk: 45,               // Stats change per phase
  def: 15,
  spd: 20,
  abilities: ['rage_strike', 'aoe_slam'],
  aiBehavior: 'aggressive',
  dialogue: 'You dare challenge me? Feel my wrath!'
}
```

### Boss Ability Definition

From `data/bosses.js`:

```javascript
{
  id: 'vine_whip',
  name: 'Vine Whip',
  description: 'Strikes with thorny vines',
  type: 'physical',      // 'physical' | 'magical' | 'buff' | 'heal' | 'drain'
  power: 40,
  mpCost: 10,
  element: 'nature',
  effect: {
    type: 'poison',
    duration: 3,
    chance: 0.4          // 40% chance to apply
  }
}
```

---

## Phase System

### HP Threshold Mechanics

Phases trigger when boss HP falls below thresholds:

| Phase | HP Threshold | Typical Use |
|-------|--------------|-------------|
| 1 | 1.0 (100%) | Initial state |
| 2 | 0.5 (50%) | Mid-fight escalation |
| 3 | 0.25 (25%) | Desperate/final form |

### Phase Transition Effects

When a phase transition occurs:
1. Stats (atk, def, spd) update to new phase values
2. Ability list changes
3. AI behavior may change
4. `phaseJustChanged` flag set to `true`
5. `phaseChangeDialogue` populated for UI display

### Phase Checking Logic

```javascript
// From checkPhaseTransition():
const hpPercent = boss.currentHp / boss.maxHp;

// Find highest phase where HP is below threshold
for (let i = phases.length - 1; i >= 0; i--) {
  if (hpPercent <= phases[i].hpThreshold && phases[i].phase > currentPhase) {
    return true; // Transition needed
  }
}
```

---

## Core API Functions

### createBossEncounter(bossId)

Creates a new boss encounter state from boss data.

```javascript
import { createBossEncounter } from './boss.js';

const boss = createBossEncounter('forest_guardian');
if (!boss) {
  console.error('Invalid boss ID');
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| bossId | string | Boss identifier from BOSSES data |

**Returns:** `Object | null` - Boss encounter state or null if invalid ID

---

### isBoss(enemy)

Type guard to check if an enemy is a boss.

```javascript
import { isBoss } from './boss.js';

if (isBoss(enemy)) {
  // Use boss-specific logic
  const phase = getCurrentPhase(enemy);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| enemy | Object | Enemy object to check |

**Returns:** `boolean` - True if `enemy.isBoss === true`

---

### checkPhaseTransition(boss)

Check if boss should transition to a new phase based on current HP.

```javascript
import { checkPhaseTransition } from './boss.js';

if (checkPhaseTransition(boss)) {
  // Find and apply the new phase
  const targetPhase = findTargetPhase(boss);
  boss = transitionToPhase(boss, targetPhase);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| boss | Object | Boss encounter state |

**Returns:** `boolean` - True if phase transition should occur

---

### transitionToPhase(boss, phaseNum)

Apply a phase transition, updating stats and abilities.

```javascript
import { transitionToPhase } from './boss.js';

const newBoss = transitionToPhase(boss, 2);
if (newBoss.phaseJustChanged) {
  displayPhaseTransitionDialogue(newBoss.phaseChangeDialogue);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| boss | Object | Boss encounter state |
| phaseNum | number | Target phase number (1-indexed) |

**Returns:** `Object` - Updated boss state with:
- New stats (atk, def, spd)
- New abilities array
- New aiBehavior
- `phaseJustChanged: true`
- `phaseChangeDialogue` if defined

---

### getCurrentPhase(boss)

Get the current phase data object.

```javascript
import { getCurrentPhase } from './boss.js';

const phase = getCurrentPhase(boss);
console.log(`Current phase: ${phase.name}`);
```

**Returns:** `Object | null` - Phase data or null if not a boss

---

### getPhaseName(boss)

Get the display name of the current phase.

```javascript
import { getPhaseName } from './boss.js';

const phaseName = getPhaseName(boss); // "Enraged Form"
```

**Returns:** `string` - Phase name or "Unknown"

---

## Combat Functions

### applyDamageToBoss(boss, damage)

Apply damage and check for phase transitions.

```javascript
import { applyDamageToBoss } from './boss.js';

const { boss: updatedBoss, phaseChanged } = applyDamageToBoss(boss, 75);
if (phaseChanged) {
  // Handle phase transition
  const targetPhase = findNextPhase(updatedBoss);
  finalBoss = transitionToPhase(updatedBoss, targetPhase);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| boss | Object | Boss encounter state |
| damage | number | Damage to apply |

**Returns:** `{ boss: Object, phaseChanged: boolean }`

**Note:** This function only updates HP and checks for transition. You must call `transitionToPhase()` separately if `phaseChanged` is true.

---

### calculateBossAbilityDamage(boss, abilityId, target)

Calculate damage for a boss ability.

```javascript
import { calculateBossAbilityDamage } from './boss.js';

const result = calculateBossAbilityDamage(boss, 'vine_whip', player);
// result: { damage: 45, isCrit: false, element: 'nature', effect: { type: 'poison', ... }, healAmount: 0 }
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| boss | Object | Boss encounter state |
| abilityId | string | Ability to use |
| target | Object | Target (player) state |

**Returns:**
```javascript
{
  damage: number,       // Calculated damage (min 1)
  isCrit: boolean,      // 10% crit chance
  element: string|null, // Ability element
  effect: Object|null,  // Applied status effect (if proc'd)
  healAmount: number    // For drain abilities
}
```

**Damage Formulas:**
- **Physical:** `(boss.atk * ability.power / 50) - (target.def / 2)`
- **Magical:** `ability.power * 1.2 - (target.def / 4)`
- **Crit:** `damage * 1.5`

---

### isBossDefeated(boss)

Check if boss HP has reached zero.

```javascript
import { isBossDefeated } from './boss.js';

if (isBossDefeated(boss)) {
  const rewards = getBossRewards(boss);
  displayVictory(rewards);
}
```

**Returns:** `boolean` - True if `boss.currentHp <= 0`

---

### getBossRewards(boss)

Calculate rewards for defeating the boss.

```javascript
import { getBossRewards } from './boss.js';

const rewards = getBossRewards(boss);
// rewards: { exp: 250, gold: 100, items: ['forest_amulet'] }
```

**Returns:**
```javascript
{
  exp: number,    // XP reward
  gold: number,   // Gold reward
  items: string[] // Array of dropped item IDs (based on drop chances)
}
```

---

## AI System

### selectBossAbility(boss)

AI-driven ability selection based on behavior pattern and MP.

```javascript
import { selectBossAbility } from './boss.js';

const abilityId = selectBossAbility(boss);
if (abilityId) {
  const damage = calculateBossAbilityDamage(boss, abilityId, player);
  boss.mp -= getBossAbility(abilityId).mpCost;
} else {
  // Basic attack (no MP required)
  performBasicAttack(boss, player);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| boss | Object | Boss encounter state |

**Returns:** `string | null` - Ability ID or null for basic attack

### AI Behavior Patterns

| Behavior | Description | Ability Preference |
|----------|-------------|-------------------|
| basic | Random selection | Any available |
| aggressive | Prioritize damage | physical, magical |
| caster | Prioritize spells | magical |
| defensive | (Future) | buff, heal |

**Selection Logic:**
1. Filter abilities by MP cost (must have enough MP)
2. If `aggressive`: prefer physical/magical abilities
3. If `caster`: prefer magical abilities
4. Default: random from available

---

## UI Helper Functions

### getBossHpSegments(boss)

Get HP bar segments for phase visualization.

```javascript
import { getBossHpSegments } from './boss.js';

const segments = getBossHpSegments(boss);
// segments: [
//   { start: 0.5, end: 1.0, phase: 1 },   // Phase 1: 50-100%
//   { start: 0.25, end: 0.5, phase: 2 },  // Phase 2: 25-50%
//   { start: 0, end: 0.25, phase: 3 }     // Phase 3: 0-25%
// ]

renderSegmentedHealthBar(boss.currentHp, boss.maxHp, segments);
```

**Returns:** `Array<{ start: number, end: number, phase: number }>`

**Usage:** Render HP bar with different colors per phase segment.

---

## Integration Guide

### Combat Integration

```javascript
import { 
  isBoss, 
  applyDamageToBoss, 
  checkPhaseTransition,
  transitionToPhase,
  selectBossAbility,
  calculateBossAbilityDamage,
  isBossDefeated,
  getBossRewards
} from './boss.js';

function processBossCombat(state, playerDamage) {
  let boss = state.combat.enemy;
  
  // Apply player damage
  const { boss: damagedBoss, phaseChanged } = applyDamageToBoss(boss, playerDamage);
  boss = damagedBoss;
  
  // Handle phase transition
  if (phaseChanged) {
    const targetPhase = findTargetPhase(boss);
    boss = transitionToPhase(boss, targetPhase);
    
    if (boss.phaseChangeDialogue) {
      state = showDialogue(state, boss.phaseChangeDialogue);
    }
  }
  
  // Check for defeat
  if (isBossDefeated(boss)) {
    const rewards = getBossRewards(boss);
    return handleVictory(state, rewards);
  }
  
  // Boss turn
  const abilityId = selectBossAbility(boss);
  const result = calculateBossAbilityDamage(boss, abilityId, state.player);
  
  return applyDamageToPlayer(state, result);
}
```

### Shield/Break Integration

Bosses interact with the Shield/Break system:

```javascript
import { getEnemyShieldData, initializeEnemyShields } from './shield-break.js';

function createBossWithShields(bossId) {
  const boss = createBossEncounter(bossId);
  const shieldData = getEnemyShieldData(bossId);
  
  return {
    ...boss,
    shields: initializeEnemyShields(bossId, 4), // Tier 4 = boss
    weaknesses: shieldData.weaknesses,
    breakState: null
  };
}
```

### Encounter Start

```javascript
import { createBossEncounter } from './boss.js';
import { BOSSES } from './data/bosses.js';

function startBossFight(state, bossId) {
  const boss = createBossEncounter(bossId);
  
  if (!boss) {
    console.error(`Boss not found: ${bossId}`);
    return state;
  }
  
  return {
    ...state,
    mode: 'combat',
    combat: {
      ...state.combat,
      enemy: boss,
      phase: 'player-turn',
      isBossFight: true
    }
  };
}
```

---

## Usage Examples

### Example 1: Full Boss Fight Flow

```javascript
import { 
  createBossEncounter,
  applyDamageToBoss,
  transitionToPhase,
  selectBossAbility,
  calculateBossAbilityDamage,
  isBossDefeated,
  getBossRewards,
  getPhaseName
} from './boss.js';

function simulateBossFight(bossId) {
  let boss = createBossEncounter(bossId);
  let turn = 1;
  
  while (!isBossDefeated(boss)) {
    console.log(`Turn ${turn}: ${boss.name} Phase ${boss.currentPhase} (${getPhaseName(boss)})`);
    console.log(`HP: ${boss.currentHp}/${boss.maxHp}`);
    
    // Player attacks
    const playerDamage = 50;
    const { boss: damaged, phaseChanged } = applyDamageToBoss(boss, playerDamage);
    boss = damaged;
    
    if (phaseChanged) {
      // Find next phase
      for (let p = boss.currentPhase + 1; p <= boss.totalPhases; p++) {
        const phase = boss.phases[p - 1];
        if (boss.currentHp / boss.maxHp <= phase.hpThreshold) {
          boss = transitionToPhase(boss, p);
          console.log(`>>> PHASE TRANSITION: ${boss.phaseChangeDialogue || 'Boss enrages!'}`);
          break;
        }
      }
    }
    
    if (isBossDefeated(boss)) break;
    
    // Boss attacks
    const ability = selectBossAbility(boss);
    console.log(`Boss uses: ${ability || 'Basic Attack'}`);
    
    turn++;
  }
  
  const rewards = getBossRewards(boss);
  console.log(`Victory! Rewards: ${rewards.exp} XP, ${rewards.gold} gold`);
  return rewards;
}
```

### Example 2: Phase-Based UI

```javascript
import { getBossHpSegments, getCurrentPhase } from './boss.js';

function renderBossUI(boss) {
  const segments = getBossHpSegments(boss);
  const currentPhase = getCurrentPhase(boss);
  
  return {
    name: boss.name,
    phase: currentPhase.name,
    phaseNumber: `Phase ${boss.currentPhase}/${boss.totalPhases}`,
    hpBar: {
      current: boss.currentHp,
      max: boss.maxHp,
      segments: segments.map(seg => ({
        ...seg,
        color: getPhaseColor(seg.phase)
      }))
    },
    abilities: boss.abilities,
    dialogue: boss.phaseJustChanged ? boss.phaseChangeDialogue : null
  };
}

function getPhaseColor(phaseNum) {
  const colors = {
    1: '#4CAF50',  // Green - healthy
    2: '#FF9800',  // Orange - damaged
    3: '#F44336'   // Red - critical
  };
  return colors[phaseNum] || '#9E9E9E';
}
```

### Example 3: Testing Phase Transitions

```javascript
import { createBossEncounter, applyDamageToBoss, transitionToPhase } from './boss.js';

function testPhaseTransitions(bossId) {
  const boss = createBossEncounter(bossId);
  
  // Test each phase threshold
  const results = [];
  for (const phase of boss.phases) {
    const testHp = Math.floor(boss.maxHp * phase.hpThreshold) - 1;
    const { boss: damaged, phaseChanged } = applyDamageToBoss(
      { ...boss, currentHp: testHp + 50 },
      50
    );
    
    results.push({
      phase: phase.phase,
      threshold: phase.hpThreshold,
      triggered: phaseChanged,
      expectedTrigger: damaged.currentHp / boss.maxHp <= phase.hpThreshold
    });
  }
  
  return results;
}
```

---

## Related Documentation

- `docs/shield-break-system.md` - Shield/Break integration with bosses
- `docs/combat-system-api.md` - Core combat system
- `docs/boss-design-templates.md` - Boss creation guidelines
- `src/data/bosses.js` - Boss definitions and abilities

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Day 343 | Initial documentation |

---

*Documentation generated from #voted-out by Claude Opus 4.5*
