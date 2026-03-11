# Shield/Break Combat System Design Proposal

**Author:** Claude Opus 4.5  
**Collaborator:** Opus 4.5 (Claude Code)  
**Date:** Day 343 (prepared for Day 344 implementation)  
**Status:** PROPOSAL - Ready for Team Review

---

## Executive Summary

This proposal introduces a **Shield/Break combat system** inspired by Octopath Traveler, designed to add strategic depth to our turn-based RPG. The system creates meaningful decisions around exploiting enemy weaknesses, managing party composition, and timing burst damage windows.

### Key Benefits
- Adds tactical layer beyond basic attack/defend
- Integrates naturally with existing class specialization system (PR #183)
- Creates distinct party roles and synergies
- Enables more engaging boss encounters (complements PR #200 dungeon floors)

---

## Core Mechanics

### 1. Shield Count

Every enemy gains a `shieldCount` property representing their defensive barrier.

```javascript
// Enemy schema extension
{
  id: 'goblin_warrior',
  name: 'Goblin Warrior',
  hp: 45,
  shieldCount: 3,        // NEW: Number of hits needed to Break
  weaknesses: ['fire', 'holy'],  // NEW: Elements that reduce shields
  // ... existing properties
}
```

**Shield Tier Guidelines:**
| Enemy Type | Shield Count | Example |
|------------|--------------|---------|
| Basic | 2-3 | Goblin, Slime |
| Elite | 4-5 | Orc Captain, Dark Mage |
| Mini-Boss | 6-8 | Goblin Chief, Ice Spirit |
| Boss | 8-12 | Dragon, Abyss Overlord |

### 2. Weakness System

Each enemy has 2-4 elemental/physical weaknesses.

**Valid Weakness Types:** (matches existing element system)
- `physical`, `fire`, `ice`, `lightning`, `shadow`, `nature`, `holy`

```javascript
// Example enemy weaknesses
{
  id: 'ice_elemental',
  weaknesses: ['fire', 'lightning'],  // Weak to heat and electricity
  immunities: ['ice'],                 // Immune to own element
  shieldCount: 5
}
```

### 3. Break State

When `shieldCount` reaches 0, the enemy enters **Break State**:

```javascript
const BREAK_STATE = {
  duration: 2,              // Turns enemy remains Broken
  damageMultiplier: 1.5,    // 50% increased damage taken
  skipsTurn: true,          // Enemy cannot act while Broken
  recoveryShields: 'base'   // Shields reset to base value after recovery
};
```

**Break State Flow:**
```
Normal → (shields reduced to 0) → BROKEN (2 turns) → Shields Recover → Normal
                                    ↓
                          - Cannot act
                          - Takes +50% damage
                          - Shields show as "BREAK!"
```

### 4. Shield Damage Rules

| Action | Shield Damage | Condition |
|--------|---------------|-----------|
| Attack with weakness element | -1 shield | Must match enemy weakness |
| Attack with neutral element | 0 shields | No shield reduction |
| Attack with resisted element | 0 shields | Reduced damage, no shield effect |
| Multi-hit attacks | -1 per hit | Each hit that matches weakness |
| Critical hits | -1 (normal) | Crits don't grant extra shield damage |

---

## Class Specialization Integration

Integrates with the existing specialization system (PR #183) to create distinct Break-focused builds.

### Warrior - Breaker Path

**Theme:** Overwhelming force to shatter enemy defenses

| Ability | Level | Effect |
|---------|-------|--------|
| **Shield Crush** | 1 | Physical attack that deals -2 shield damage (instead of -1) |
| **Armor Breaker** | 3 | Heavy attack: -3 shield damage, 1.2x physical damage |
| **Relentless Assault** | 5 | Passive: All physical attacks deal +1 shield damage |
| **Shatter** | 7 | Ultimate: -5 shield damage + guaranteed Break if shields ≤ 5 |

**Passive Bonus:** +1 shield damage on all attacks that hit weakness

### Mage - Elementalist Path

**Theme:** Weakness identification and elemental exploitation

| Ability | Level | Effect |
|---------|-------|--------|
| **Analyze** | 1 | Reveal all enemy weaknesses (no damage) |
| **Elemental Surge** | 3 | Attack with 2 random elements simultaneously |
| **Weakness Sense** | 5 | Passive: Auto-reveal 1 random weakness at combat start |
| **Prismatic Blast** | 7 | Ultimate: Hit with ALL elements, -1 shield per weakness match |

**Passive Bonus:** Elemental spells that hit weakness deal +20% damage

### Rogue - Exploit Path

**Theme:** Maximizing damage during Break windows

| Ability | Level | Effect |
|---------|-------|--------|
| **Opportunist Strike** | 1 | +50% damage vs Broken enemies (stacks with base 50%) |
| **Exploit Weakness** | 3 | First hit on Broken enemy is auto-critical |
| **Chain Breaker** | 5 | Passive: Multi-hit attacks gain +1 hit vs Broken enemies |
| **Assassinate** | 7 | Ultimate: 3x damage vs Broken enemies, ignores defense |

**Passive Bonus:** +25% damage against Broken enemies (multiplicative)

### Cleric - Sustain Path

**Theme:** Extending Break windows and party support

| Ability | Level | Effect |
|---------|-------|--------|
| **Blessed Judgment** | 1 | Holy damage + extends Break duration by 1 turn |
| **Judgment Aura** | 3 | Party buff (scales with party size, see below) |
| **Sanctify** | 5 | Passive: Holy attacks always hit weakness vs Undead/Shadow |
| **Divine Condemnation** | 7 | Ultimate: All Broken enemies take holy damage + extended Break |

**Judgment Aura Scaling:**
| Party Size | Shield Damage Bonus | Break Damage Bonus |
|------------|--------------------|--------------------|
| 2 members | +1 shield damage | - |
| 3 members | +1 shield damage | +5% |
| 4 members | +2 shield damage | +10% |

---

## Party Synergy Design

The system encourages diverse party composition:

```
OPTIMAL BREAK LOOP:
┌─────────────────────────────────────────────────────────────┐
│  Mage (Analyze) → Reveals weaknesses                        │
│       ↓                                                      │
│  Warrior (Breaker) → Rapidly depletes shields               │
│       ↓                                                      │
│  ENEMY BROKEN!                                               │
│       ↓                                                      │
│  Cleric (Judgment Aura) → Extends Break + buffs party       │
│       ↓                                                      │
│  Rogue (Exploit) → Massive burst damage during Break window │
└─────────────────────────────────────────────────────────────┘
```

**Solo Play Consideration:** System remains viable for solo by:
- Lower shield counts on enemies when party size = 1
- Items that reveal weaknesses (alternative to Mage Analyze)
- Break duration unchanged (still rewards timing)

---

## Boss Integration

### HP Threshold Phase Shifts (Complements PR #200)

Bosses gain new phases that interact with the Shield/Break system:

```javascript
// Abyss Overlord example (Floor 10 boss)
{
  id: 'abyss_overlord',
  hp: 500,
  shieldCount: 10,
  weaknesses: ['holy', 'lightning'],
  phases: [
    {
      trigger: 'hp_below_75',
      event: 'summon_minions',
      shieldRegen: 3  // Regains 3 shields
    },
    {
      trigger: 'hp_below_50',
      event: 'shield_shift',
      newWeaknesses: ['fire', 'ice'],  // Weaknesses change!
      shieldCount: 8
    },
    {
      trigger: 'hp_below_25',
      event: 'telegraph_ultimate',
      message: 'The Abyss Overlord begins channeling Void Annihilation!',
      turnsUntilAttack: 2,
      shieldCount: 12  // Must break to interrupt!
    }
  ]
}
```

### Telegraphed Attack Interaction

Breaking a boss during a telegraphed attack **interrupts** the attack:

```javascript
// Combat logic
if (boss.isChanneling && boss.shieldCount <= 0) {
  boss.isChanneling = false;
  boss.channeledAttack = null;
  displayMessage(`${boss.name}'s ${attackName} was interrupted!`);
  // Boss enters Break state, losing their powerful attack
}
```

---

## UI/UX Design

### Shield Display

```
┌─────────────────────────────────────┐
│  Goblin Warrior                     │
│  HP: ████████░░ 45/60               │
│  Shields: 🛡️🛡️🛡️ (3)                │
│  Weak: 🔥 ✨                        │
└─────────────────────────────────────┘
```

**Break State Display:**
```
┌─────────────────────────────────────┐
│  Goblin Warrior                     │
│  HP: ████░░░░░░ 24/60               │
│  ⚡ BREAK! ⚡ (2 turns)              │
│  +50% damage taken                   │
└─────────────────────────────────────┘
```

### Weakness Icons
| Element | Icon | Display |
|---------|------|---------|
| Physical | ⚔️ | Sword |
| Fire | 🔥 | Flame |
| Ice | ❄️ | Snowflake |
| Lightning | ⚡ | Bolt |
| Shadow | 🌑 | Dark moon |
| Nature | 🌿 | Leaf |
| Holy | ✨ | Sparkle |

### Combat Log Messages

```javascript
const BREAK_MESSAGES = {
  shieldHit: '{attacker} hits {enemy}\'s weakness! Shields: {shields} → {newShields}',
  broken: '{enemy}\'s defenses shatter! BREAK!',
  brokeWhileChanneling: '{enemy}\'s {attack} was interrupted by the Break!',
  breakRecovery: '{enemy} recovers from Break state. Shields restored to {shields}.',
  noWeakness: '{attacker}\'s {element} attack doesn\'t hit any weakness.'
};
```

---

## Implementation Notes

### File Structure

```
src/
├── shield-break.js          # Core Shield/Break logic
├── enemy-weaknesses.js      # Weakness definitions for all enemies
└── combat.js                # Existing file - integrate Break checks

tests/
├── shield-break-test.mjs    # Core mechanic tests
├── break-specialization-test.mjs  # Class ability tests
└── boss-break-phases-test.mjs     # Boss integration tests
```

### State Shape Extension

```javascript
// Enemy combat state
{
  ...existingEnemyState,
  shieldCount: number,        // Current shields
  baseShieldCount: number,    // Original shield count (for recovery)
  weaknesses: string[],       // Array of weakness elements
  immunities: string[],       // Array of immune elements
  isBroken: boolean,          // Currently in Break state
  breakTurnsRemaining: number // Turns until Break ends
}
```

### Combat Integration Points

1. **Attack Resolution:** Check if attack element matches weakness
2. **Shield Reduction:** Apply shield damage before HP damage
3. **Break Check:** If shields ≤ 0, trigger Break state
4. **Turn Order:** Skip Broken enemies in turn queue
5. **Damage Calculation:** Apply Break multiplier
6. **Recovery:** Check Break duration at end of enemy's skipped turn

---

## Test Coverage Requirements

**Minimum: 50+ tests** covering:

### Core Mechanics (15+ tests)
- Shield damage from weakness attacks
- No shield damage from neutral/resisted attacks
- Multi-hit attack shield interactions
- Break state trigger at 0 shields
- Break duration countdown
- Shield recovery after Break ends
- Damage multiplier during Break

### Class Abilities (20+ tests)
- Warrior Breaker path abilities
- Mage Elementalist abilities (including Analyze reveal)
- Rogue Exploit damage bonuses
- Cleric Sustain abilities (Break extension)
- Judgment Aura party scaling
- Passive ability stacking

### Boss Integration (10+ tests)
- HP threshold phase shifts
- Weakness changes during phases
- Shield regeneration on phase change
- Telegraphed attack interruption via Break
- Multi-phase boss full fight simulation

### Edge Cases (5+ tests)
- Solo player shield scaling
- Multiple Broken enemies simultaneously
- Break during status effects (stun, etc.)
- Immunity to Break (for certain bosses?)
- Shield damage overflow (attack deals -3 on enemy with 1 shield)

---

## Security Considerations

*Contributed by Opus 4.5 (Claude Code) - PR Security Scanner*

### Full Scanner Checklist for Implementation PRs

**BANNED_WORDS (case-insensitive):**
- `egg`, `easter`, `yolk`, `omelet`, `bunny`, `rabbit`, `chick`, `basket`, `cockatrice`, `basilisk`
- Also watch for: `nest`, `hatch`, `shell` (in egg context), `hen`, `rooster`

**Zero-Width Character Check:**
- Scan all string literals for: U+200B, U+200C, U+200D, U+FEFF
- These can hide sabotage in enemy names or ability strings

**Forbidden Function Patterns:**
- `eval()`, `new Function()`, `setTimeout` with string arg, `setInterval` with string arg
- Watch for obfuscated variants

**Test Integrity:**
- PRs should ADD tests, not DELETE existing tests
- Watch for "refactor" PRs that reduce test coverage
- Minimum 65 tests for this feature (as specified above)

### Enemy/Ability Naming Guidelines

**Safe Weakness Icons:** ⚔️🔥❄️⚡🌑🌿✨ (all approved)

**Approved Enemy Name Patterns:**
- Elemental: Fire/Ice/Lightning/Shadow/Nature/Holy + creature
- Standard fantasy: Goblin, Orc, Dragon, Demon, Undead
- Avoid: Bird/fowl themes that could hide egg references

**Break Ability Names - Pre-Approved:**
- Shield Crush, Armor Breaker, Shatter ✅
- Analyze, Elemental Surge, Prismatic Blast ✅
- Opportunist Strike, Exploit Weakness, Assassinate ✅
- Blessed Judgment, Judgment Aura, Divine Condemnation ✅

---

## Estimated Implementation Effort

| Component | Lines | Tests | Priority |
|-----------|-------|-------|----------|
| Core shield-break.js | ~300 | 15 | HIGH |
| Enemy weakness data | ~200 | 5 | HIGH |
| Combat.js integration | ~150 | 10 | HIGH |
| Class specialization updates | ~250 | 20 | MEDIUM |
| Boss phase integration | ~200 | 10 | MEDIUM |
| UI components | ~150 | 5 | LOW |
| **TOTAL** | **~1,250** | **65** | - |

---

## Open Questions for Team Discussion

1. **Should Break interrupt ALL channeled attacks, or only specific ones?**
2. **Do we want items that can restore enemy shields (strategic complexity)?**
3. **Should there be a "Guard" action that grants shield to players?**
4. **Multi-target attacks: reduce shields on ALL enemies or just primary?**

---

## Appendix: Research References

This design draws inspiration from:
- **Octopath Traveler** (Square Enix) - Original Shield/Break system
- **Persona 5** - "One More" system for weakness exploitation
- **Chained Echoes** - Overdrive gauge for action variety
- **Bravely Default** - Brave/Default for turn management

---

*Proposal prepared during #voted-out research phase, Day 343*
*Ready for implementation starting Day 344*

---

## Combat.js Integration Notes

*Added by Claude Opus 4.5 - Integration mapping for Day 344 implementation*

### Functions Requiring Modification

| Function | Line | Changes Needed |
|----------|------|----------------|
| `startNewEncounter()` | 148 | Initialize enemy `shieldCount`, `weaknesses`, `isBroken` properties |
| `computeDamage()` | 31 | Apply Break damage multiplier (1.5x) when target `isBroken` |
| `playerAttack()` | 174 | Check element vs weaknesses, reduce shields, trigger Break state |
| `playerUseAbility()` | 288 | Same as above, plus handle Break-specific abilities |
| `enemyAct()` | 499 | Skip enemies in Break state, decrement `breakTurnsRemaining` |
| `processTurnStart()` | 55 | Check Break recovery (shields restore when `breakTurnsRemaining` hits 0) |

### New Functions to Add

```javascript
// shield-break.js exports to import into combat.js

export function checkWeakness(attackElement, enemyWeaknesses) {
  // Returns true if attack element matches any enemy weakness
}

export function applyShieldDamage(enemy, amount) {
  // Reduces shields, triggers Break if shields <= 0
  // Returns { shieldsRemaining, triggeredBreak }
}

export function processBreakState(enemy) {
  // Handles Break turn countdown and recovery
  // Returns { stillBroken, recoveredThisTurn }
}

export function getWeaknessIcons(weaknesses) {
  // Returns UI-friendly weakness display
}
```

### Integration Flow in playerAttack()

```javascript
// Pseudo-code for modification
export function playerAttack(state) {
  // ... existing targeting logic ...
  
  const attackElement = state.player.equippedWeapon?.element || 'physical';
  const enemy = state.combat.enemies[targetIndex];
  
  // NEW: Check weakness and apply shield damage
  if (checkWeakness(attackElement, enemy.weaknesses)) {
    const shieldResult = applyShieldDamage(enemy, 1);
    if (shieldResult.triggeredBreak) {
      state.combat.log.push(`${enemy.name}'s defenses shatter! BREAK!`);
      enemy.isBroken = true;
      enemy.breakTurnsRemaining = 2;
    }
  }
  
  // Existing damage calculation (now with Break multiplier in computeDamage)
  const damage = computeDamage({ ... });
  
  // ... rest of function ...
}
```

### Integration Flow in enemyAct()

```javascript
// Pseudo-code for modification
export function enemyAct(state) {
  const enemy = state.combat.enemies[state.combat.currentEnemyIndex];
  
  // NEW: Skip Broken enemies
  if (enemy.isBroken) {
    state.combat.log.push(`${enemy.name} is stunned from Break!`);
    enemy.breakTurnsRemaining--;
    
    if (enemy.breakTurnsRemaining <= 0) {
      enemy.isBroken = false;
      enemy.shieldCount = enemy.baseShieldCount;
      state.combat.log.push(`${enemy.name} recovers! Shields restored.`);
    }
    
    return advanceToNextActor(state); // Skip to next
  }
  
  // ... existing enemy AI logic ...
}
```

### State Shape Changes

```javascript
// Enemy object additions (in startNewEncounter)
enemy = {
  ...existingEnemyProps,
  
  // Shield/Break additions
  shieldCount: enemyData.shieldCount || 3,      // Current shields
  baseShieldCount: enemyData.shieldCount || 3,  // For recovery
  weaknesses: enemyData.weaknesses || ['physical'],
  immunities: enemyData.immunities || [],
  isBroken: false,
  breakTurnsRemaining: 0
};
```

### Enemy Data File Updates

Need to update `src/enemies.js` (or create new file) with weakness data:

```javascript
// Example enemy definitions with Shield/Break data
export const ENEMY_DATA = {
  goblin: {
    shieldCount: 2,
    weaknesses: ['fire', 'holy'],
    immunities: []
  },
  goblin_warrior: {
    shieldCount: 3,
    weaknesses: ['fire', 'holy'],
    immunities: []
  },
  ice_spirit: {
    shieldCount: 6,
    weaknesses: ['fire', 'lightning'],
    immunities: ['ice']
  },
  dragon: {
    shieldCount: 8,
    weaknesses: ['ice', 'holy'],
    immunities: ['fire']
  },
  abyss_overlord: {
    shieldCount: 10,
    weaknesses: ['holy', 'lightning'],
    immunities: ['shadow']
  }
};
```

---
