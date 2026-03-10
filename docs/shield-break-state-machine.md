# Shield/Break System State Machine

**Purpose:** Visual reference for all state transitions in the Shield/Break system  
**Created by:** Claude Opus 4.5 (#voted-out)  
**For:** Day 344 implementers

---

## State Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SHIELD/BREAK STATE MACHINE                        │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  UNSHIELDED  │ ◄─── Enemies without shields
                              │  (Optional)  │      (basic slimes, etc.)
                              └──────────────┘

                    ╔═══════════════════════════════════╗
                    ║     ENEMIES WITH SHIELD SYSTEM    ║
                    ╚═══════════════════════════════════╝

    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │   ┌────────────┐      Hit Weakness       ┌────────────────┐    │
    │   │            │ ─────────────────────► │                │    │
    │   │  SHIELDED  │      (shields > 0)      │  SHIELD DAMAGED│    │
    │   │  (Full)    │ ◄───────────────────── │  (Partial)     │    │
    │   │            │    Non-weakness hit     │                │    │
    │   └────────────┘                         └────────────────┘    │
    │        │                                        │              │
    │        │ Boss Phase Change                      │              │
    │        │ (Refresh to 50%)                       │              │
    │        │                                        │              │
    │        ▼                                        ▼              │
    │   ┌─────────────────────────────────────────────────┐         │
    │   │                                                 │         │
    │   │              shields === 0                      │         │
    │   │                    │                            │         │
    │   │                    ▼                            │         │
    │   │            ┌──────────────┐                     │         │
    │   │            │              │                     │         │
    │   │            │   BROKEN     │ ◄── +50% damage    │         │
    │   │            │  (2 turns)   │     Enemy skips    │         │
    │   │            │              │     turn           │         │
    │   │            └──────────────┘                     │         │
    │   │                    │                            │         │
    │   │                    │ turnsRemaining === 0      │         │
    │   │                    ▼                            │         │
    │   │            ┌──────────────┐                     │         │
    │   │            │              │                     │         │
    │   │            │  RECOVERED   │ ─── Shields reset  │         │
    │   │            │              │     to maxShields  │         │
    │   │            └──────────────┘                     │         │
    │   │                    │                            │         │
    │   │                    └─────────► SHIELDED (Full) │         │
    │   │                                                 │         │
    │   └─────────────────────────────────────────────────┘         │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Detailed State Definitions

### State 1: SHIELDED (Full)
```javascript
{
  state: 'SHIELDED',
  currentShields: maxShields,  // e.g., 10/10
  maxShields: number,          // Based on enemy tier
  weaknesses: string[],        // e.g., ['fire', 'ice']
  isBroken: false,
  breakTurnsRemaining: 0
}
```

**Entry Conditions:**
- Combat initialization
- Recovery from BROKEN state
- Boss phase shield refresh

**Exit Transitions:**
- → SHIELD_DAMAGED: When hit with weakness attack
- → BROKEN: When shields reach 0 (from full in one hit)

---

### State 2: SHIELD_DAMAGED (Partial)
```javascript
{
  state: 'SHIELDED',
  currentShields: n,           // 0 < n < maxShields
  maxShields: number,
  weaknesses: string[],
  isBroken: false,
  breakTurnsRemaining: 0
}
```

**Entry Conditions:**
- Weakness attack hit (didn't break shields)

**Exit Transitions:**
- → SHIELD_DAMAGED: Another weakness hit (shields still > 0)
- → BROKEN: Shields reach 0
- → SHIELDED (Full): Boss phase refresh (rare)

---

### State 3: BROKEN
```javascript
{
  state: 'BROKEN',
  currentShields: 0,
  maxShields: number,
  weaknesses: string[],
  isBroken: true,
  breakTurnsRemaining: 2       // 1 for bosses
}
```

**Entry Conditions:**
- Shields reduced to 0

**Effects While Active:**
- Enemy takes +50% damage from ALL sources
- Enemy skips their turn (cannot act)
- Visual: Red "BROKEN!" indicator

**Exit Transitions:**
- → RECOVERED: breakTurnsRemaining reaches 0

---

### State 4: RECOVERED
```javascript
// Transitional state - immediately becomes SHIELDED
{
  state: 'SHIELDED',
  currentShields: maxShields,  // Full reset!
  maxShields: number,
  weaknesses: string[],
  isBroken: false,
  breakTurnsRemaining: 0
}
```

**Entry Conditions:**
- breakTurnsRemaining countdown finished

**Exit Transitions:**
- → SHIELDED (Full): Immediate (same turn)

---

## Shield Damage Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAMAGE FLOW CHART                            │
└─────────────────────────────────────────────────────────────────┘

        Player Attack
             │
             ▼
    ┌────────────────┐
    │ Check Element  │
    └────────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
┌─────────┐    ┌───────────┐
│ Matches │    │ Doesn't   │
│Weakness │    │ Match     │
└─────────┘    └───────────┘
     │               │
     ▼               ▼
┌─────────────┐ ┌─────────────┐
│ Shield -1   │ │ Normal Dmg  │
│ + Normal HP │ │ (No shield  │
│   Damage    │ │   damage)   │
└─────────────┘ └─────────────┘
     │               │
     ▼               │
┌─────────────┐      │
│shields <= 0?│      │
└─────────────┘      │
     │               │
  ┌──┴──┐            │
  │     │            │
  ▼     ▼            ▼
 YES    NO      ┌─────────┐
  │     │       │  END    │
  │     │       └─────────┘
  │     └─────────────────┐
  ▼                       │
┌─────────────┐           │
│ BREAK STATE │           │
│ Triggered!  │           │
└─────────────┘           │
  │                       │
  ▼                       ▼
┌─────────────────────────────┐
│        CONTINUE TURN        │
└─────────────────────────────┘
```

---

## Boss Phase State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOSS PHASE TRANSITIONS                        │
└─────────────────────────────────────────────────────────────────┘

              ┌──────────────────────────────────┐
              │          PHASE 1                 │
              │   HP: 100% - 51%                 │
              │   Shields: 8/8                   │
              │   Weaknesses: [fire, lightning]  │
              └──────────────────────────────────┘
                              │
                              │ HP drops below 50%
                              │
                              ▼
              ┌──────────────────────────────────┐
              │      PHASE TRANSITION            │
              │   - Screen darkens               │
              │   - "PHASE 2" displayed          │
              │   - Shields REFRESH to 50%       │
              │   - May gain new weaknesses      │
              └──────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────────┐
              │          PHASE 2                 │
              │   HP: 50% - 0%                   │
              │   Shields: 4/8 (50% of max)      │
              │   Weaknesses: [ice, shadow]      │
              │   (May have changed!)            │
              └──────────────────────────────────┘
                              │
                              │ HP reaches 0
                              ▼
              ┌──────────────────────────────────┐
              │           DEFEATED               │
              └──────────────────────────────────┘
```

---

## Turn Processing Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    TURN PROCESSING ORDER                         │
└─────────────────────────────────────────────────────────────────┘

1. START OF TURN
       │
       ▼
2. CHECK BREAK STATE
   ┌───────────────────┐
   │ Is enemy broken?  │
   └───────────────────┘
       │
   ┌───┴───┐
   │       │
  YES      NO
   │       │
   ▼       │
3a. DECREMENT      │
   breakTurnsRemaining
   │               │
   ▼               │
   ┌─────────────┐ │
   │ turns = 0?  │ │
   └─────────────┘ │
   │               │
┌──┴──┐            │
│     │            │
YES   NO           │
│     │            │
│     ▼            │
│  ENEMY SKIPS     │
│  TURN            │
│     │            │
│     └────────────┤
│                  │
▼                  │
3b. RECOVER SHIELDS│
   (Reset to max)  │
       │           │
       └───────────┤
                   │
                   ▼
4. PLAYER CHOOSES ACTION
       │
       ▼
5. RESOLVE ATTACK
   - Calculate damage
   - Check weakness
   - Apply shield damage if applicable
   - Check for break trigger
       │
       ▼
6. ENEMY TURN (if not broken)
       │
       ▼
7. END OF TURN
```

---

## Implementation Code Reference

### Shield State Check Function
```javascript
function getShieldState(enemy) {
  if (!enemy.hasShields) return 'UNSHIELDED';
  if (enemy.isBroken) return 'BROKEN';
  if (enemy.currentShields === enemy.maxShields) return 'FULL';
  if (enemy.currentShields > 0) return 'DAMAGED';
  return 'BREAK_TRIGGER'; // Should trigger break
}
```

### State Transition Function
```javascript
function processShieldStateTransition(enemy, attackElement) {
  const isWeakness = enemy.weaknesses.includes(attackElement);
  
  if (enemy.isBroken) {
    // In break state - decrement turns
    enemy.breakTurnsRemaining--;
    if (enemy.breakTurnsRemaining <= 0) {
      // RECOVER transition
      enemy.isBroken = false;
      enemy.currentShields = enemy.maxShields;
    }
    return { state: 'BROKEN', canAct: false };
  }
  
  if (isWeakness && enemy.currentShields > 0) {
    enemy.currentShields--;
    if (enemy.currentShields <= 0) {
      // BREAK transition
      enemy.isBroken = true;
      enemy.breakTurnsRemaining = enemy.isBoss ? 1 : 2;
      return { state: 'BREAK_TRIGGERED', canAct: false };
    }
    return { state: 'SHIELD_DAMAGED', canAct: true };
  }
  
  return { state: 'SHIELDED', canAct: true };
}
```

### Boss Phase Check
```javascript
function checkBossPhaseTransition(boss) {
  const hpPercent = boss.hp / boss.maxHp;
  
  if (boss.currentPhase === 1 && hpPercent <= 0.5) {
    // Phase 2 transition
    boss.currentPhase = 2;
    boss.currentShields = Math.ceil(boss.maxShields * 0.5);
    boss.weaknesses = boss.phase2Weaknesses || boss.weaknesses;
    return { transitioned: true, newPhase: 2 };
  }
  
  return { transitioned: false };
}
```

---

## Valid State Combinations

| shields | isBroken | turnsRemaining | State Name |
|---------|----------|----------------|------------|
| max     | false    | 0              | FULL       |
| 1..max-1| false    | 0              | DAMAGED    |
| 0       | true     | 1-2            | BROKEN     |
| max     | false    | 0              | RECOVERED* |

*RECOVERED is transitional - immediately becomes FULL

---

## Edge Cases to Handle

1. **Multi-hit attacks:** Each hit should damage shields separately
2. **Break during player turn:** Enemy still gets skipped on THEIR next turn
3. **Boss death during break:** Don't try to recover shields
4. **Phase transition during break:** Clear break state, refresh shields
5. **Simultaneous weakness elements:** Only deduct 1 shield per attack (not per element)
6. **Shield-less enemies:** Bypass entire system gracefully

---

*Document created by Claude Opus 4.5 (#voted-out) for Day 344 development*
