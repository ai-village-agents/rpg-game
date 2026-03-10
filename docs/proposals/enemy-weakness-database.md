# Enemy Weakness Database

**Author:** Opus 4.5 (Claude Code)
**Date:** Day 343 (Shield/Break System Data)
**Status:** PROPOSAL - Shield/Break Integration Data
**Companion Docs:** `shield-break-system.md`, `boss-design-templates.md`

---

## Purpose

This document defines the `shieldCount`, `weaknesses`, and `immunities` properties for all enemies and bosses to integrate with the proposed Shield/Break combat system. These values are ready to be merged into `src/data/enemies.js` and `src/data/bosses.js`.

---

## Element Relationships

### Elemental Wheel
```
         FIRE
        /    \
   NATURE    ICE
      \      /
       SHADOW
         |
        HOLY
```

**Counter Relationships:**
| Element | Weak To | Strong Against |
|---------|---------|----------------|
| Fire | Ice, Holy | Nature |
| Ice | Fire, Lightning | Physical |
| Nature | Fire, Shadow | Ice, Physical |
| Shadow | Holy, Lightning | Nature |
| Physical | Fire, Ice | - |
| Holy | Shadow | Shadow, Fire |
| Lightning | Nature | Ice, Physical |

---

## Basic Enemies (Zone 1-2)

### Slime
```javascript
{
  id: 'slime',
  shieldCount: 2,
  weaknesses: ['fire', 'lightning'],
  immunities: []
}
```
**Rationale:** Low shields, weak to fire (evaporation) and lightning (conductivity)

### Goblin
```javascript
{
  id: 'goblin',
  shieldCount: 2,
  weaknesses: ['fire', 'holy'],
  immunities: []
}
```
**Rationale:** Standard physical enemy, weak to fire and holy light

### Cave Bat
```javascript
{
  id: 'cave_bat',
  shieldCount: 1,
  weaknesses: ['fire', 'lightning', 'holy'],
  immunities: []
}
```
**Rationale:** Very fragile, many weaknesses - easy to break

### Wolf
```javascript
{
  id: 'wolf',
  shieldCount: 2,
  weaknesses: ['fire', 'ice'],
  immunities: []
}
```
**Rationale:** Beast type, standard elemental weaknesses

### Giant Spider
```javascript
{
  id: 'giant_spider',
  shieldCount: 2,
  weaknesses: ['fire', 'ice'],
  immunities: ['nature']
}
```
**Rationale:** Insect type, weak to elements, immune to nature

### Training Dummy
```javascript
{
  id: 'training_dummy',
  shieldCount: 2,
  weaknesses: ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'],
  immunities: [],
  breakImmune: true  // For testing, cannot enter Break state
}
```
**Rationale:** Testing target - all weaknesses, but cannot Break

---

## Standard Enemies (Zone 2-3)

### Skeleton
```javascript
{
  id: 'skeleton',
  shieldCount: 3,
  weaknesses: ['holy', 'fire'],
  immunities: ['shadow']
}
```
**Rationale:** Undead type, weak to holy, immune to darkness

### Bandit
```javascript
{
  id: 'bandit',
  shieldCount: 3,
  weaknesses: ['lightning', 'ice'],
  immunities: []
}
```
**Rationale:** Human type, standard elemental weaknesses

### Orc
```javascript
{
  id: 'orc',
  shieldCount: 4,
  weaknesses: ['fire', 'holy'],
  immunities: []
}
```
**Rationale:** Tough humanoid, higher shields, standard weaknesses

---

## Elemental Enemies (Zone 3-4)

### Fire Spirit
```javascript
{
  id: 'fire-spirit',
  shieldCount: 3,
  weaknesses: ['ice', 'holy'],
  immunities: ['fire'],
  absorbs: ['fire']  // Heals from fire damage
}
```
**Rationale:** Fire elemental, standard counter-element weakness

### Ice Spirit
```javascript
{
  id: 'ice-spirit',
  shieldCount: 3,
  weaknesses: ['fire', 'lightning'],
  immunities: ['ice'],
  absorbs: ['ice']
}
```
**Rationale:** Ice elemental, weak to heat and electricity

### Thunder Hawk
```javascript
{
  id: 'thunder-hawk',
  shieldCount: 2,
  weaknesses: ['ice', 'nature'],
  immunities: ['lightning']
}
```
**Rationale:** Flying electric type, grounded by ice/nature

---

## Dark Enemies (Zone 4-5)

### Dark Cultist
```javascript
{
  id: 'dark-cultist',
  shieldCount: 4,
  weaknesses: ['holy', 'lightning'],
  immunities: ['shadow']
}
```
**Rationale:** Shadow user, weak to holy light and shocking

### Wraith
```javascript
{
  id: 'wraith',
  shieldCount: 4,
  weaknesses: ['holy', 'fire'],
  immunities: ['shadow', 'physical']
}
```
**Rationale:** Incorporeal undead, immune to physical attacks

### Stone Golem
```javascript
{
  id: 'stone-golem',
  shieldCount: 5,
  weaknesses: ['ice', 'nature'],
  immunities: ['fire', 'lightning']
}
```
**Rationale:** Stone construct, shattered by ice, crumbled by nature

---

## Mini-Boss: Goblin Chief
```javascript
{
  id: 'goblin_chief',
  shieldCount: 5,
  weaknesses: ['fire', 'holy'],
  immunities: [],
  phases: [
    {
      trigger: 'hp_below_75',
      shieldRegen: 2
    },
    {
      trigger: 'hp_below_40',
      newWeaknesses: ['fire', 'holy', 'lightning']  // Desperation reveals more weakness
    }
  ]
}
```

---

## Boss: Dragon
```javascript
{
  id: 'dragon',
  shieldCount: 8,
  weaknesses: ['ice', 'holy'],
  immunities: ['fire'],
  phases: [
    {
      trigger: 'hp_below_60',
      action: 'begin_channel',
      shieldCount: 6
    },
    {
      trigger: 'hp_below_25',
      newWeaknesses: ['ice', 'holy', 'lightning'],
      shieldCount: 5
    }
  ]
}
```

---

## Existing Bosses (from bosses.js)

### Forest Guardian
```javascript
{
  id: 'forest-guardian',
  shieldCount: 6,
  weaknesses: ['fire', 'ice'],
  immunities: ['nature'],
  phases: [
    {
      phase: 1,
      shieldCount: 6
    },
    {
      phase: 2,
      shieldCount: 5,
      newWeaknesses: ['fire', 'ice', 'lightning']
    }
  ]
}
```

### Fire Drake
```javascript
{
  id: 'fire-drake',
  shieldCount: 7,
  weaknesses: ['ice', 'holy'],
  immunities: ['fire'],
  phases: [
    {
      phase: 1,
      shieldCount: 7
    },
    {
      phase: 2,
      shieldCount: 6,
      action: 'begin_channel',  // Fire Breath charge
      channelTurns: 2
    },
    {
      phase: 3,
      shieldCount: 5,
      newWeaknesses: ['ice', 'holy', 'nature']
    }
  ]
}
```

### Shadow Wraith (Boss)
```javascript
{
  id: 'shadow-wraith',
  shieldCount: 6,
  weaknesses: ['holy', 'lightning'],
  immunities: ['shadow', 'physical'],
  phases: [
    {
      phase: 1,
      shieldCount: 6
    },
    {
      phase: 2,
      shieldCount: 4,
      newImmunities: []  // Becomes corporeal, loses physical immunity
    }
  ]
}
```

---

## Summary Table

### Basic Enemies
| Enemy | Shields | Weaknesses | Immunities |
|-------|---------|------------|------------|
| Slime | 2 | Fire, Lightning | - |
| Goblin | 2 | Fire, Holy | - |
| Cave Bat | 1 | Fire, Lightning, Holy | - |
| Wolf | 2 | Fire, Ice | - |
| Giant Spider | 2 | Fire, Ice | Nature |
| Training Dummy | 2 | All (Break-immune) | - |

### Standard Enemies
| Enemy | Shields | Weaknesses | Immunities |
|-------|---------|------------|------------|
| Skeleton | 3 | Holy, Fire | Shadow |
| Bandit | 3 | Lightning, Ice | - |
| Orc | 4 | Fire, Holy | - |

### Elemental Enemies
| Enemy | Shields | Weaknesses | Immunities | Absorbs |
|-------|---------|------------|------------|---------|
| Fire Spirit | 3 | Ice, Holy | Fire | Fire |
| Ice Spirit | 3 | Fire, Lightning | Ice | Ice |
| Thunder Hawk | 2 | Ice, Nature | Lightning | - |

### Dark Enemies
| Enemy | Shields | Weaknesses | Immunities |
|-------|---------|------------|------------|
| Dark Cultist | 4 | Holy, Lightning | Shadow |
| Wraith | 4 | Holy, Fire | Shadow, Physical |
| Stone Golem | 5 | Ice, Nature | Fire, Lightning |

### Mini-Bosses
| Boss | Shields | Weaknesses | Immunities |
|------|---------|------------|------------|
| Goblin Chief | 5 | Fire, Holy | - |

### Major Bosses
| Boss | Shields | Weaknesses | Immunities |
|------|---------|------------|------------|
| Dragon | 8 | Ice, Holy | Fire |
| Forest Guardian | 6 | Fire, Ice | Nature |
| Fire Drake | 7 | Ice, Holy | Fire |
| Shadow Wraith | 6 | Holy, Lightning | Shadow, Physical |

---

## Implementation Code Snippet

```javascript
// Add to src/data/enemies.js after existing enemy definitions

export const ENEMY_SHIELD_DATA = {
  'slime': { shieldCount: 2, weaknesses: ['fire', 'lightning'], immunities: [] },
  'goblin': { shieldCount: 2, weaknesses: ['fire', 'holy'], immunities: [] },
  'cave_bat': { shieldCount: 1, weaknesses: ['fire', 'lightning', 'holy'], immunities: [] },
  'wolf': { shieldCount: 2, weaknesses: ['fire', 'ice'], immunities: [] },
  'giant_spider': { shieldCount: 2, weaknesses: ['fire', 'ice'], immunities: ['nature'] },
  'training_dummy': { shieldCount: 2, weaknesses: ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'], immunities: [], breakImmune: true },
  'skeleton': { shieldCount: 3, weaknesses: ['holy', 'fire'], immunities: ['shadow'] },
  'bandit': { shieldCount: 3, weaknesses: ['lightning', 'ice'], immunities: [] },
  'orc': { shieldCount: 4, weaknesses: ['fire', 'holy'], immunities: [] },
  'fire-spirit': { shieldCount: 3, weaknesses: ['ice', 'holy'], immunities: ['fire'], absorbs: ['fire'] },
  'ice-spirit': { shieldCount: 3, weaknesses: ['fire', 'lightning'], immunities: ['ice'], absorbs: ['ice'] },
  'thunder-hawk': { shieldCount: 2, weaknesses: ['ice', 'nature'], immunities: ['lightning'] },
  'dark-cultist': { shieldCount: 4, weaknesses: ['holy', 'lightning'], immunities: ['shadow'] },
  'wraith': { shieldCount: 4, weaknesses: ['holy', 'fire'], immunities: ['shadow', 'physical'] },
  'stone-golem': { shieldCount: 5, weaknesses: ['ice', 'nature'], immunities: ['fire', 'lightning'] },
  'goblin_chief': { shieldCount: 5, weaknesses: ['fire', 'holy'], immunities: [] },
  'dragon': { shieldCount: 8, weaknesses: ['ice', 'holy'], immunities: ['fire'] }
};

/**
 * Get shield/weakness data for an enemy
 * @param {string} enemyId
 * @returns {Object} Shield data with shieldCount, weaknesses, immunities
 */
export function getEnemyShieldData(enemyId) {
  return ENEMY_SHIELD_DATA[enemyId] || { shieldCount: 2, weaknesses: [], immunities: [] };
}
```

---

## Test Requirements (15+ tests)

- [ ] All basic enemies have correct shield counts
- [ ] Weakness hits reduce shields by 1
- [ ] Immunity prevents shield damage AND regular damage
- [ ] Absorb heals instead of damaging
- [ ] Fire Spirit absorbs fire attacks
- [ ] Ice Spirit absorbs ice attacks
- [ ] Wraith immune to physical attacks
- [ ] Training Dummy cannot enter Break state
- [ ] Boss phase transitions update weaknesses
- [ ] Boss phase transitions update shield counts
- [ ] Shadow Wraith loses physical immunity in phase 2
- [ ] Multi-weakness enemies break faster
- [ ] Single-weakness enemies require specific strategies
- [ ] Elemental wheel relationships correct
- [ ] getEnemyShieldData returns defaults for unknown enemies

---

## Security Notes

**Verified Names (No Banned Words):**
- All enemy names checked against BANNED_WORDS list
- No egg, easter, yolk, omelet, bunny, rabbit, chick, basket, cockatrice, basilisk references
- Bird-type enemies (Thunder Hawk) verified safe

**Element Names (Pre-Approved):**
- fire, ice, lightning, shadow, nature, holy, physical

---

*Drafted during #voted-out research phase, Day 343*
*Pairs with Shield/Break System and Boss Design Templates*
