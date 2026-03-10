# Shield/Break System Balance Guide

*Created by Claude Opus 4.5 from #voted-out on Day 343*
*Companion document to day-344-task-assignments.md*

---

## Purpose

This guide provides numerical balancing recommendations for the Shield/Break system to ensure combat feels rewarding but not trivial. Use these guidelines during implementation and tune as needed through playtesting.

---

## Shield Count Balancing

### By Enemy Tier
| Tier | Floors | Shield Range | Rationale |
|------|--------|--------------|-----------|
| 1 | 1-3 | 2-3 shields | Quick breaks, teaches mechanics |
| 2 | 4-6 | 4-5 shields | Requires strategy |
| 3 | 7-9 | 6-8 shields | Multi-turn commitment |
| 4 (Boss) | 3,6,9,10 | 8-12 shields | Major encounter milestone |

### Formula Suggestion
```javascript
// Base shield count = tier * 2 + floor_within_tier
// Example: Floor 5 (Tier 2, position 2) = 2*2 + 2 = 6 shields
function calculateBaseShields(floor) {
  const tier = Math.ceil(floor / 3);
  const positionInTier = ((floor - 1) % 3) + 1;
  return (tier * 2) + positionInTier;
}
```

---

## Break State Balance

### Damage Multiplier
- **Recommended: 1.5x (50% bonus)**
- Alternative: 1.3x (conservative) to 2.0x (aggressive)
- Rationale: 1.5x is impactful without trivializing enemies

### Break Duration
- **Standard enemies: 2 turns**
- **Mini-bosses: 1 turn** (they recover faster)
- **Bosses: 1 turn** (with phase mechanics)

### Turn Skip Behavior
- Broken enemies skip their entire turn
- They cannot use abilities, items, or defend
- This is the primary reward for breaking

---

## Weakness System Balance

### Number of Weaknesses by Tier
| Tier | Weaknesses | Immunities | Absorbs |
|------|------------|------------|---------|
| 1 | 2-3 | 0-1 | 0 |
| 2 | 2 | 1 | 0-1 |
| 3 | 1-2 | 1-2 | 0-1 |
| 4 (Boss) | 1-2 | 2+ | 1 |

### Element Distribution
Ensure each floor has enemies weak to different elements to encourage:
- Party composition variety
- Ability/spell selection decisions
- Resource management (MP for elemental spells)

---

## Shield Damage Values

### Base Shield Damage by Source
| Attack Type | Shield Damage | Notes |
|-------------|---------------|-------|
| Basic attack (weakness) | 1 | Standard |
| Basic attack (neutral) | 0 | No shield damage |
| Basic attack (resist) | 0 | No shield damage |
| Skill (weakness) | 1 | Same as basic |
| Multi-hit skill (weakness) | 1 per hit | Powerful for breaking |
| Shield Crush ability | 2 | Warrior specialty |

### Shield Damage Modifiers
```javascript
const SHIELD_DAMAGE_MODIFIERS = {
  baseWeaknessHit: 1,
  criticalHit: 0,        // Crits don't add shield damage (separate reward)
  shatterPassive: 1,     // Warrior passive adds +1
  multiHitBonus: 0,      // Each hit counts separately
  brokenTarget: 0        // Can't damage shields while broken
};
```

---

## Class Balance Considerations

### Warrior (Breaker) - Shield Specialists
- Focus: Breaking shields quickly
- Trade-off: Less burst damage when enemy is broken
- Synergy: Sets up other classes for big damage

### Mage (Elementalist) - Weakness Exploiters
- Focus: Hitting weaknesses, AoE coverage
- Trade-off: MP-intensive
- Synergy: Handles multiple weaknesses, reveals enemy data

### Rogue (Exploit) - Break Damage Dealers
- Focus: Maximum damage during break state
- Trade-off: Less useful while shields are up
- Synergy: Capitalizes on Warrior breaks

### Cleric (Sustain) - Hybrid Support
- Focus: Holy damage + party survival
- Trade-off: Lower shield damage
- Synergy: Keeps party alive through long fights

---

## Boss Phase Interactions

### Shield Refresh on Phase Change
- When boss enters new HP phase, shields partially restore
- Recommendation: 50% of max shields on phase change
- Creates multiple "break windows" per boss fight

### Phase-Specific Shield Counts
```javascript
const BOSS_PHASE_SHIELDS = {
  goblinChief: {
    phase1: { shields: 8, hpThreshold: 100 },
    phase2: { shields: 10, hpThreshold: 75 },  // Harder when desperate
    phase3: { shields: 8, hpThreshold: 50 },
    phase4: { shields: 6, hpThreshold: 25 }    // Easier to finish
  }
};
```

---

## Tuning Parameters (Easy to Adjust)

### Configuration Object
```javascript
const SHIELD_BREAK_CONFIG = {
  // Core mechanics
  breakDamageMultiplier: 1.5,
  breakDurationTurns: 2,
  bossBreakDurationTurns: 1,
  
  // Shield recovery
  recoveryRestoresFullShields: true,
  partialRecoveryPercent: 100,
  
  // Phase transitions
  phaseShieldRestorePercent: 50,
  
  // Difficulty scaling (for future difficulty modes)
  easyModeShieldReduction: 0.5,
  hardModeShieldIncrease: 1.5,
  
  // Visual timing
  breakAnimationMs: 500,
  shieldPopAnimationMs: 200
};
```

---

## Playtesting Checklist

### Early Game (Floors 1-3)
- [ ] Can player break Tier 1 enemies in 2-3 turns?
- [ ] Is Goblin Chief breakable with moderate effort?
- [ ] Do weakness hits feel impactful?

### Mid Game (Floors 4-6)
- [ ] Are Tier 2 enemies challenging but breakable?
- [ ] Does party composition matter for shield breaking?
- [ ] Is Prism Guardian's weakness shifting fair?

### Late Game (Floors 7-10)
- [ ] Are Tier 3 enemies tough but satisfying to break?
- [ ] Do boss phases create interesting break windows?
- [ ] Is Ancient Dragon's high shield count manageable?
- [ ] Does Abyss Overlord's multi-part system work?

### General Feel
- [ ] Is breaking enemies the "optimal" strategy?
- [ ] Are there interesting decisions about when to break?
- [ ] Does each class feel useful in the shield/break system?

---

## Anti-Frustration Features

### Recommended Additions
1. **Weakness Preview**: Analyze ability reveals weaknesses
2. **Shield Memory**: Once discovered, weaknesses shown on future encounters
3. **Break Indicator**: Clear visual when enemy is about to break
4. **Combo Counter**: Shows consecutive weakness hits

### Avoid These Pitfalls
- Don't make shields so high that breaking feels impossible
- Don't make break damage so high that it trivializes bosses
- Don't require specific party compositions to progress
- Don't hide weaknesses with no way to discover them

---

*Use this guide during Day 344 implementation. Adjust values based on playtesting!*
