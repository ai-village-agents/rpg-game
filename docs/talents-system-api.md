# Talents System API Documentation

**Version:** 1.0.0  
**Last Updated:** Day 343  
**Author:** Claude Opus 4.5 (from #voted-out)  
**Source Files:** `src/talents.js` (350 lines), `src/data/talents.js` (225 lines)

## Table of Contents

1. [Overview](#overview)
2. [Data Structures](#data-structures)
3. [Constants & Configuration](#constants--configuration)
4. [Core API Functions](#core-api-functions)
5. [Validation Functions](#validation-functions)
6. [Bonus Calculation](#bonus-calculation)
7. [Data Helper Functions](#data-helper-functions)
8. [Integration Guide](#integration-guide)
9. [Usage Examples](#usage-examples)

---

## Overview

The Talent System provides a skill point allocation mechanism allowing players to customize their character builds. Players earn skill points on level up and allocate them across four categories with tiered progression.

### Key Features

- **4 Categories:** Combat, Defense, Magic, Utility
- **3 Tier System:** Higher tiers require category point investment
- **28 Total Talents:** Each with 1-5 ranks
- **Prerequisite Chains:** Advanced talents require mastery of lower-tier talents
- **Respec Support:** Full talent reset with point refund

### Architecture Flow

```
Level Up → addSkillPoints() → availablePoints++
                ↓
Player selects talent → canAllocateTalent() validates
                ↓
allocateTalent() → updates talentState
                ↓
calculateTalentBonuses() → combat stat modifiers
                ↓
applyTalentBonusesToStats() → modified combat stats
```

---

## Data Structures

### TalentState

The core state object tracking all talent allocations:

```javascript
{
  allocatedTalents: {      // { talentId: rank }
    'sharpened-blade': 3,
    'precise-strikes': 5,
    'deadly-force': 2
  },
  availablePoints: 2,      // Unspent skill points
  totalPointsSpent: 10,    // Total points allocated
  categoryPoints: {        // Points per category
    combat: 10,
    defense: 0,
    magic: 0,
    utility: 0
  }
}
```

### Talent Definition

Individual talent schema in `TALENTS` object:

```javascript
{
  id: 'sharpened-blade',
  name: 'Sharpened Blade',
  description: 'Increases physical attack damage by {value}%',
  maxRank: 5,
  category: 'combat',     // 'combat' | 'defense' | 'magic' | 'utility'
  tier: 1,                // 1, 2, or 3
  effect: {
    stat: 'physicalDamage',
    valuePerRank: 3,
    type: 'percent'       // 'percent' | 'flat'
  },
  prerequisites: []       // Array of required talent IDs
}
```

### TalentCategory Definition

Category metadata in `TALENT_CATEGORIES`:

```javascript
{
  id: 'combat',
  name: 'Combat',
  description: 'Offensive abilities that increase damage output',
  color: '#e74c3c'
}
```

### Allocation Result

Return type for allocate/deallocate operations:

```javascript
{
  success: boolean,
  error?: string,         // Present if success === false
  newState: TalentState
}
```

### Validation Result

Return type for canAllocate/canDeallocate checks:

```javascript
{
  canAllocate: boolean,   // or canDeallocate
  reason: string | null   // Reason if cannot allocate
}
```

---

## Constants & Configuration

### TALENT_CATEGORIES

```javascript
import { TALENT_CATEGORIES } from './data/talents.js';

// Available categories:
TALENT_CATEGORIES.combat   // { id, name, description, color: '#e74c3c' }
TALENT_CATEGORIES.defense  // { id, name, description, color: '#3498db' }
TALENT_CATEGORIES.magic    // { id, name, description, color: '#9b59b6' }
TALENT_CATEGORIES.utility  // { id, name, description, color: '#2ecc71' }
```

### TIER_REQUIREMENTS

Points required in a category to unlock each tier:

```javascript
import { TIER_REQUIREMENTS } from './data/talents.js';

TIER_REQUIREMENTS[1] = 0   // Tier 1: Available immediately
TIER_REQUIREMENTS[2] = 5   // Tier 2: Need 5 points in category
TIER_REQUIREMENTS[3] = 10  // Tier 3: Need 10 points in category
```

### Skill Point Progression

```javascript
import { SKILL_POINTS_PER_LEVEL, STARTING_SKILL_POINTS } from './data/talents.js';

SKILL_POINTS_PER_LEVEL = 1  // Points earned each level
STARTING_SKILL_POINTS = 0   // Points at level 1
```

---

## Core API Functions

### createTalentState()

Creates a new empty talent state object.

```javascript
import { createTalentState } from './talents.js';

const talentState = createTalentState();
// Returns:
// {
//   allocatedTalents: {},
//   availablePoints: 0,
//   totalPointsSpent: 0,
//   categoryPoints: { combat: 0, defense: 0, magic: 0, utility: 0 }
// }
```

**Returns:** `TalentState` - Fresh talent state object

---

### getTalentRank(talentState, talentId)

Gets the current rank of a specific talent.

```javascript
import { getTalentRank } from './talents.js';

const rank = getTalentRank(state.talents, 'sharpened-blade');
// Returns: 0-5 (0 if not allocated)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| talentState | TalentState | Current talent state |
| talentId | string | Talent identifier |

**Returns:** `number` - Current rank (0 if unallocated)

---

### allocateTalent(talentState, talentId)

Allocates one point to a talent.

```javascript
import { allocateTalent } from './talents.js';

const result = allocateTalent(state.talents, 'sharpened-blade');
if (result.success) {
  state.talents = result.newState;
} else {
  console.log('Failed:', result.error);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| talentState | TalentState | Current talent state |
| talentId | string | Talent to allocate |

**Returns:** `{ success: boolean, error?: string, newState: TalentState }`

**Side Effects:**
- Decrements `availablePoints` by 1
- Increments talent rank by 1
- Increments `totalPointsSpent` by 1
- Increments category-specific point counter

---

### deallocateTalent(talentState, talentId)

Removes one point from a talent (refund).

```javascript
import { deallocateTalent } from './talents.js';

const result = deallocateTalent(state.talents, 'sharpened-blade');
if (result.success) {
  state.talents = result.newState;
} else {
  console.log('Cannot refund:', result.error);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| talentState | TalentState | Current talent state |
| talentId | string | Talent to deallocate |

**Returns:** `{ success: boolean, error?: string, newState: TalentState }`

**Restrictions:**
- Cannot deallocate if talent is prerequisite for another allocated talent
- Cannot deallocate if it would break tier requirements for other talents

---

### resetAllTalents(talentState)

Resets all talents and refunds all points.

```javascript
import { resetAllTalents } from './talents.js';

const newState = resetAllTalents(state.talents);
// All points refunded to availablePoints
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| talentState | TalentState | Current talent state |

**Returns:** `TalentState` - Fresh state with all points refunded

---

### addSkillPoints(talentState, points)

Adds skill points (typically called on level up).

```javascript
import { addSkillPoints } from './talents.js';

// On level up:
const newState = addSkillPoints(state.talents, SKILL_POINTS_PER_LEVEL);
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| talentState | TalentState | Current talent state |
| points | number | Points to add |

**Returns:** `TalentState` - Updated state with additional points

---

## Validation Functions

### canAllocateTalent(talentState, talentId)

Checks if a talent can be allocated.

```javascript
import { canAllocateTalent } from './talents.js';

const { canAllocate, reason } = canAllocateTalent(state.talents, 'deadly-force');
if (!canAllocate) {
  showTooltip(reason); // "Requires 5 points in Combat (have 3)"
}
```

**Validation Checks:**
1. Talent exists in TALENTS database
2. Player has available points > 0
3. Talent not already at max rank
4. Tier requirement met (category points >= TIER_REQUIREMENTS[tier])
5. Prerequisites met (all prereqs at max rank)

**Returns:** `{ canAllocate: boolean, reason: string | null }`

**Possible Reasons:**
- `"Talent not found"`
- `"No skill points available"`
- `"Talent already at maximum rank"`
- `"Requires X points in [Category] (have Y)"`
- `"Requires: [Talent Names] at max rank"`

---

### canDeallocateTalent(talentState, talentId)

Checks if a talent can be deallocated.

```javascript
import { canDeallocateTalent } from './talents.js';

const { canDeallocate, reason } = canDeallocateTalent(state.talents, 'precise-strikes');
// reason: "Deadly Force requires this talent"
```

**Validation Checks:**
1. Talent exists
2. Talent has at least 1 point allocated
3. No other allocated talents depend on this as prerequisite
4. Removing point won't break tier requirements for other talents

**Returns:** `{ canDeallocate: boolean, reason: string | null }`

---

### arePrerequisitesMet(talentState, talentId)

Internal function checking if prerequisites are satisfied.

```javascript
import { arePrerequisitesMet } from './talents.js';

const met = arePrerequisitesMet(state.talents, 'executioner');
// true only if 'deadly-force' AND 'armor-piercing' are at max rank
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| talentState | TalentState | Current talent state |
| talentId | string | Talent to check |

**Returns:** `boolean`

---

### isTierUnlocked(talentState, talentId)

Checks if player has enough category points to unlock a talent's tier.

```javascript
import { isTierUnlocked } from './talents.js';

const unlocked = isTierUnlocked(state.talents, 'executioner'); // tier 3
// true if combat category has >= 10 points
```

**Returns:** `boolean`

---

## Bonus Calculation

### calculateTalentBonuses(talentState)

Calculates all stat bonuses from current allocations.

```javascript
import { calculateTalentBonuses } from './talents.js';

const bonuses = calculateTalentBonuses(state.talents);
// Returns object with all bonus values
```

**Returns:** Bonus object with these fields:

#### Combat Bonuses
| Field | Type | Description |
|-------|------|-------------|
| physicalDamage | number | % bonus to physical damage |
| critChance | number | Flat % critical hit chance |
| critDamage | number | Flat % added to base 150% crit |
| spd | number | Flat speed bonus |
| armorPen | number | % of enemy defense ignored |
| doubleStrike | number | % chance for double attack |
| executeDamage | number | % bonus vs enemies < 30% HP |

#### Defense Bonuses
| Field | Type | Description |
|-------|------|-------------|
| def | number | Flat defense bonus |
| maxHp | number | % max HP bonus |
| dodge | number | Flat % dodge chance |
| damageReduction | number | % damage reduction |
| hpRegen | number | % of max HP regen per turn |
| counterChance | number | % chance to counter |
| lowHpResist | number | % reduction when low HP |

#### Magic Bonuses
| Field | Type | Description |
|-------|------|-------------|
| magicDamage | number | % bonus to magic damage |
| maxMp | number | % max MP bonus |
| mpCostReduction | number | % MP cost reduction |
| elementalDamage | number | % bonus to fire/ice/lightning |
| mpRegen | number | Flat MP regen per turn |
| magicPen | number | % magic resistance ignored |
| freeSpellChance | number | % chance to cast free |

#### Utility Bonuses
| Field | Type | Description |
|-------|------|-------------|
| goldBonus | number | % gold from battles |
| xpBonus | number | % XP from battles |
| itemDropRate | number | % item drop rate bonus |
| shopDiscount | number | % shop price reduction |
| battleStartBonus | number | % stats for 2 turns |
| explorationFind | number | % exploration finds |
| rareItemChance | number | Flat % rare item chance |

---

### applyTalentBonusesToStats(baseStats, talentBonuses)

Applies talent bonuses to base combat stats.

```javascript
import { applyTalentBonusesToStats, calculateTalentBonuses } from './talents.js';

const bonuses = calculateTalentBonuses(state.talents);
const modifiedStats = applyTalentBonusesToStats(player.stats, bonuses);
```

**Applied Modifications:**
- `def` += talentBonuses.def (flat)
- `spd` += talentBonuses.spd (flat)
- `maxHp` *= (1 + talentBonuses.maxHp / 100)
- `maxMp` *= (1 + talentBonuses.maxMp / 100)

**Returns:** `object` - Modified stats object

**Note:** Other bonuses (critChance, physicalDamage, etc.) are applied during combat calculations, not here.

---

## Data Helper Functions

From `src/data/talents.js`:

### getTalentValue(talentId, rank)

Gets the total stat value at a specific rank.

```javascript
import { getTalentValue } from './data/talents.js';

const value = getTalentValue('sharpened-blade', 3);
// valuePerRank (3) * rank (3) = 9% physical damage
```

**Returns:** `number` - Calculated value

---

### getTalentDescription(talentId, rank)

Gets description with actual values inserted.

```javascript
import { getTalentDescription } from './data/talents.js';

const desc = getTalentDescription('sharpened-blade', 3);
// "Increases physical attack damage by 9%"
```

**Returns:** `string` - Formatted description

---

### getTalentsByCategory(category)

Gets all talents in a category.

```javascript
import { getTalentsByCategory } from './data/talents.js';

const combatTalents = getTalentsByCategory('combat');
// Array of talent objects in combat category
```

**Returns:** `Talent[]` - Array of talent objects

---

### getTalentsByTier(tier)

Gets all talents of a specific tier.

```javascript
import { getTalentsByTier } from './data/talents.js';

const tier3Talents = getTalentsByTier(3);
// [executioner, last-stand, archmage, fortune-favors]
```

**Returns:** `Talent[]` - Array of talent objects

---

## Integration Guide

### Level Up Integration

```javascript
import { addSkillPoints } from './talents.js';
import { SKILL_POINTS_PER_LEVEL } from './data/talents.js';

function handleLevelUp(state) {
  return {
    ...state,
    player: {
      ...state.player,
      level: state.player.level + 1
    },
    talents: addSkillPoints(state.talents, SKILL_POINTS_PER_LEVEL)
  };
}
```

### Combat Integration

```javascript
import { calculateTalentBonuses, applyTalentBonusesToStats } from './talents.js';

function getEffectiveCombatStats(player, talents) {
  const bonuses = calculateTalentBonuses(talents);
  const baseStats = applyTalentBonusesToStats(player.stats, bonuses);
  
  return {
    ...baseStats,
    critChance: (player.baseCritChance || 5) + bonuses.critChance,
    critDamage: 150 + bonuses.critDamage,
    // ... apply other bonuses during damage calculation
  };
}
```

### Save/Load Integration

```javascript
// Saving
const saveData = {
  ...state,
  talents: state.talents // TalentState is JSON-serializable
};

// Loading
function loadGame(saveData) {
  return {
    ...saveData,
    talents: saveData.talents || createTalentState()
  };
}
```

### UI Integration

```javascript
import { canAllocateTalent, allocateTalent } from './talents.js';
import { TALENTS, TALENT_CATEGORIES, getTalentDescription } from './data/talents.js';

function renderTalentButton(talentId, talentState) {
  const talent = TALENTS[talentId];
  const currentRank = getTalentRank(talentState, talentId);
  const { canAllocate, reason } = canAllocateTalent(talentState, talentId);
  
  return {
    name: talent.name,
    description: getTalentDescription(talentId, currentRank || 1),
    rankText: `${currentRank}/${talent.maxRank}`,
    disabled: !canAllocate,
    tooltip: reason,
    categoryColor: TALENT_CATEGORIES[talent.category].color
  };
}
```

---

## Usage Examples

### Example 1: Building a Combat Character

```javascript
import { createTalentState, allocateTalent, calculateTalentBonuses } from './talents.js';

let talents = createTalentState();
talents = { ...talents, availablePoints: 15 }; // Simulate level 15

// Tier 1: Invest in combat basics
allocateTalent(talents, 'sharpened-blade'); // 5 times
allocateTalent(talents, 'precise-strikes'); // 5 times

// After 10 points in combat, tier 3 unlocks
// But need tier 2 prerequisites first
allocateTalent(talents, 'deadly-force'); // 3 times (needs precise-strikes)
allocateTalent(talents, 'armor-piercing'); // 2 times

// Now can allocate executioner (tier 3)
const result = allocateTalent(talents, 'executioner');

const bonuses = calculateTalentBonuses(talents);
// bonuses.physicalDamage = 15 (5 ranks * 3%)
// bonuses.critChance = 10 (5 ranks * 2%)
// bonuses.critDamage = 30 (3 ranks * 10%)
// bonuses.armorPen = 10 (2 ranks * 5%)
// bonuses.executeDamage = 15 (1 rank * 15%)
```

### Example 2: Checking Unlock Requirements

```javascript
import { isTierUnlocked, arePrerequisitesMet, canAllocateTalent } from './talents.js';
import { TALENTS, TIER_REQUIREMENTS } from './data/talents.js';

function getTalentUnlockStatus(talentState, talentId) {
  const talent = TALENTS[talentId];
  const tierUnlocked = isTierUnlocked(talentState, talentId);
  const prereqsMet = arePrerequisitesMet(talentState, talentId);
  const { canAllocate, reason } = canAllocateTalent(talentState, talentId);
  
  return {
    talentName: talent.name,
    tier: talent.tier,
    tierRequirement: TIER_REQUIREMENTS[talent.tier],
    currentCategoryPoints: talentState.categoryPoints[talent.category],
    tierUnlocked,
    prerequisites: talent.prerequisites.map(id => TALENTS[id].name),
    prereqsMet,
    canAllocate,
    blockingReason: reason
  };
}
```

### Example 3: Full Respec Flow

```javascript
import { resetAllTalents, allocateTalent } from './talents.js';

function performRespec(state) {
  // Reset all talents
  const freshTalents = resetAllTalents(state.talents);
  
  // Now player has all points back
  console.log(`Refunded ${freshTalents.availablePoints} skill points`);
  
  // Player can reallocate
  return {
    ...state,
    talents: freshTalents
  };
}
```

---

## Complete Talent List

### Combat Talents (7 total)

| Talent ID | Name | Max Rank | Tier | Effect | Prerequisites |
|-----------|------|----------|------|--------|---------------|
| sharpened-blade | Sharpened Blade | 5 | 1 | +3%/rank physical damage | None |
| precise-strikes | Precise Strikes | 5 | 1 | +2%/rank crit chance | None |
| swift-attacks | Swift Attacks | 3 | 1 | +2/rank SPD | None |
| deadly-force | Deadly Force | 3 | 2 | +10%/rank crit damage | precise-strikes |
| armor-piercing | Armor Piercing | 3 | 2 | +5%/rank armor pen | sharpened-blade |
| relentless | Relentless | 3 | 2 | +5%/rank double strike | swift-attacks |
| executioner | Executioner | 2 | 3 | +15%/rank execute damage | deadly-force, armor-piercing |

### Defense Talents (7 total)

| Talent ID | Name | Max Rank | Tier | Effect | Prerequisites |
|-----------|------|----------|------|--------|---------------|
| thick-skin | Thick Skin | 5 | 1 | +2/rank DEF | None |
| vitality | Vitality | 5 | 1 | +4%/rank max HP | None |
| evasion | Evasion | 3 | 1 | +3%/rank dodge | None |
| fortitude | Fortitude | 3 | 2 | +3%/rank damage reduction | thick-skin |
| regeneration | Regeneration | 3 | 2 | +1%/rank HP regen | vitality |
| riposte | Riposte | 3 | 2 | +5%/rank counter chance | evasion |
| last-stand | Last Stand | 2 | 3 | +15%/rank low HP resist | fortitude, regeneration |

### Magic Talents (7 total)

| Talent ID | Name | Max Rank | Tier | Effect | Prerequisites |
|-----------|------|----------|------|--------|---------------|
| arcane-power | Arcane Power | 5 | 1 | +3%/rank magic damage | None |
| mana-well | Mana Well | 5 | 1 | +5%/rank max MP | None |
| spell-efficiency | Spell Efficiency | 3 | 1 | +5%/rank MP cost reduction | None |
| elemental-mastery | Elemental Mastery | 3 | 2 | +5%/rank elemental damage | arcane-power |
| meditation | Meditation | 3 | 2 | +2/rank MP regen | mana-well |
| spell-penetration | Spell Penetration | 3 | 2 | +5%/rank magic pen | spell-efficiency |
| archmage | Archmage | 2 | 3 | +10%/rank free spell chance | elemental-mastery, meditation |

### Utility Talents (7 total)

| Talent ID | Name | Max Rank | Tier | Effect | Prerequisites |
|-----------|------|----------|------|--------|---------------|
| treasure-hunter | Treasure Hunter | 5 | 1 | +5%/rank gold bonus | None |
| quick-learner | Quick Learner | 5 | 1 | +4%/rank XP bonus | None |
| lucky | Lucky | 3 | 1 | +5%/rank item drop rate | None |
| merchant | Merchant | 3 | 2 | +5%/rank shop discount | treasure-hunter |
| veteran | Veteran | 3 | 2 | +3%/rank battle start bonus | quick-learner |
| scavenger | Scavenger | 3 | 2 | +10%/rank exploration finds | lucky |
| fortune-favors | Fortune Favors | 2 | 3 | +5%/rank rare item chance | merchant, scavenger |

---

## Testing Reference

Related test files:
- `tests/talents-test.mjs` - Core talent logic tests
- `tests/talents-data-test.mjs` - Talent data validation

Key test scenarios:
1. Creating fresh talent state
2. Allocating talents with sufficient points
3. Blocking allocation without points
4. Blocking allocation at max rank
5. Tier requirement validation
6. Prerequisite chain validation
7. Deallocating independent talents
8. Blocking deallocation of required talents
9. Full reset and refund
10. Bonus calculation accuracy

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Day 343 | Initial documentation |

---

*Documentation generated from #voted-out by Claude Opus 4.5*
