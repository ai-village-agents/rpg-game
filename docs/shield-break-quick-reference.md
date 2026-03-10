# Shield/Break Quick Reference Card

*One-page reference for Day 344 implementation*

---

## Core Mechanics at a Glance

| Concept | Value | Notes |
|---------|-------|-------|
| Break Damage Bonus | 1.5x | Multiplied with other bonuses |
| Break Duration | 2 turns | 1 turn for bosses |
| Shield Damage (weakness hit) | 1 | Per hit |
| Shield Damage (neutral) | 0 | No shield effect |
| Shields at 0 | → BROKEN | Enemy skips turns |

---

## Shield Counts by Tier

| Tier | Floors | Shields | Examples |
|------|--------|---------|----------|
| 1 | 1-3 | 2-3 | goblin, slime, bat, rat |
| 2 | 4-6 | 4-5 | skeleton, zombie, ghost, orc |
| 3 | 7-9 | 6-8 | darkKnight, vampire, werewolf, demon |
| Boss | 3,6,9,10 | 8-12 | goblinChief(8), prismGuardian(10), ancientDragon(12), abyssOverlord(12) |

---

## Element Weakness Reference

| Element | Icon | Strong Against |
|---------|------|----------------|
| Fire 🔥 | `fire` | goblin, slime, skeleton, zombie, vampire, werewolf |
| Ice ❄ | `ice` | slime, orc, werewolf, demon, ancientDragon |
| Lightning ⚡ | `lightning` | goblin, bat, ghost, darkKnight, ancientDragon |
| Holy ✨ | `holy` | bat, skeleton, zombie, ghost, darkKnight, vampire, demon, abyssOverlord |
| Shadow 🌑 | `shadow` | (few enemies weak) |
| Nature 🌿 | `nature` | rat |
| Physical 💪 | `physical` | prismGuardian |

---

## Combat.js Integration Points

| Function | Line | What to Add |
|----------|------|-------------|
| `startNewEncounter()` | 148 | Init shields, weaknesses, isBroken |
| `computeDamage()` | 31 | Apply 1.5x if target.isBroken |
| `playerAttack()` | 174 | Check weakness, reduce shields |
| `playerUseAbility()` | 288 | Same + Break abilities |
| `enemyAct()` | 499 | Skip if isBroken |
| `processTurnStart()` | 55 | Break recovery check |

---

## New Abilities Quick List

### Warrior (Breaker)
- Shield Crush (8 MP): 2 shield damage
- Armor Breaker (15 MP): +1 shield damage 3 turns
- Relentless Assault (20 MP): 2x damage if broken
- Shatter (Passive): +1 shield damage always

### Mage (Elementalist)
- Analyze (3 MP): Reveal weaknesses
- Elemental Surge (12 MP): Hit all weaknesses
- Weakness Sense (Passive): Hint at weaknesses
- Prismatic Blast (25 MP): Random element

### Rogue (Exploit)
- Opportunist Strike (6 MP): +50% on broken
- Exploit Weakness (10 MP): Auto-hit weakness
- Chain Breaker (18 MP): Combo shield damage
- Assassinate (30 MP): Kill if broken + <25% HP

### Cleric (Sustain)
- Blessed Judgment (10 MP): Holy + self heal
- Judgment Aura (15 MP): Party holy damage
- Sanctify (20 MP): Strip buffs on break
- Divine Condemnation (40 MP): +1 break turn

---

## Test Requirements Summary

| Task | Min Tests | Focus Areas |
|------|-----------|-------------|
| Core Module | 40 | Shield math, weakness, break state |
| Combat Integration | 20 | Flow, damage multiplier, skip |
| Enemy Data | 25 | Data integrity, boss properties |
| UI Components | 15 | Display, indicators, animations |
| Boss Phases | 20 | Transitions, shield refresh |
| Class Abilities | 20 | Each ability, scaling |
| **TOTAL** | **140** | |

---

## Security Checklist

✅ No "egg", "easter", "rabbit", "bunny" references  
✅ No "cockatrice" or "basilisk"  
✅ No food items with egg ingredients  
✅ No nest/shell/yolk references  
✅ Run scanner before PR submission  

---

## Key Files

```
js/shield-break.js       # NEW - Core module
js/combat.js             # MODIFY - Integration
js/enemy.js              # MODIFY - Shield data
tests/shield-break-test.mjs           # NEW
tests/combat-shield-integration-test.mjs  # NEW
tests/enemy-shield-data-test.mjs      # NEW
tests/shield-ui-test.mjs              # NEW
tests/boss-break-phases-test.mjs      # NEW
tests/class-shield-abilities-test.mjs # NEW
```

---

*Print this for quick reference during implementation!*
