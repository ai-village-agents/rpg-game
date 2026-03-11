# Boss Design Templates

**Author:** Claude Opus 4.5  
**Date:** Day 343 (prepared for Day 344 implementation)  
**Status:** PROPOSAL - Companion to Shield/Break System  
**Companion Doc:** `shield-break-system.md`

---

## Purpose

This document provides reusable templates for designing boss encounters that integrate with the Shield/Break system and dungeon floor progression (PR #200). Each template includes mechanical guidelines, example implementations, and test coverage requirements.

---

## Boss Tier System

| Tier | Floor | HP Range | Shield Count | Phases | Example |
|------|-------|----------|--------------|--------|---------|
| **Mini-Boss** | 3, 6 | 100-200 | 4-6 | 2 | Goblin Chief, Ice Spirit |
| **Major Boss** | 9 | 250-400 | 6-8 | 3 | Dragon, Demon Lord |
| **Final Boss** | 10 | 400-600 | 8-12 | 4 | Abyss Overlord |

---

## Template 1: Minion Summoner

**Concept:** Boss that summons adds when damaged, creating resource pressure.

### Mechanical Pattern
```javascript
{
  id: 'goblin_chief',
  tier: 'mini-boss',
  hp: 150,
  shieldCount: 5,
  weaknesses: ['fire', 'holy'],
  
  phases: [
    {
      trigger: 'hp_below_75',
      action: 'summon',
      summons: ['goblin', 'goblin'],
      shieldRegen: 2,
      message: "The Goblin Chief calls for reinforcements!"
    },
    {
      trigger: 'hp_below_40',
      action: 'enrage',
      statModifiers: { attack: 1.5, defense: 0.8 },
      message: "The Goblin Chief flies into a rage!"
    }
  ],
  
  abilities: [
    { id: 'cleave', damage: 15, targets: 'all', cooldown: 3 },
    { id: 'rallying_cry', effect: 'buff_minions', cooldown: 4 }
  ]
}
```

### Strategic Considerations
- **Weakness Exploitation:** Fire spells clear minions AND damage boss
- **Break Timing:** Breaking boss during summon phase prevents reinforcements
- **Party Role:** Mage for AoE clear, Warrior for Break focus

### Test Requirements (8+ tests)
- [ ] Phase trigger at 75% HP
- [ ] Minion spawn behavior
- [ ] Shield regeneration on phase change
- [ ] Enrage stat modifiers
- [ ] Ability cooldowns
- [ ] Break interrupts summon
- [ ] Victory condition with minions alive
- [ ] XP/loot distribution

---

## Template 2: Elemental Shifter

**Concept:** Boss that changes weaknesses mid-fight, requiring adaptation.

### Mechanical Pattern
```javascript
{
  id: 'prism_guardian',
  tier: 'major-boss',
  hp: 300,
  shieldCount: 7,
  weaknesses: ['fire'],  // Initial weakness
  immunities: ['ice'],   // Initial immunity
  
  phases: [
    {
      trigger: 'hp_below_66',
      action: 'shift_element',
      newWeaknesses: ['ice'],
      newImmunities: ['fire'],
      shieldCount: 6,
      message: "The Prism Guardian shifts to a frozen form!"
    },
    {
      trigger: 'hp_below_33',
      action: 'shift_element',
      newWeaknesses: ['lightning'],
      newImmunities: ['ice'],
      shieldCount: 5,
      message: "The Prism Guardian crackles with unstable energy!"
    }
  ],
  
  abilities: [
    { id: 'elemental_blast', element: 'current', damage: 25, cooldown: 2 },
    { id: 'prismatic_shield', effect: 'reflect_first_spell', cooldown: 5 }
  ]
}
```

### Strategic Considerations
- **Mage Elementalist Critical:** Analyze reveals new weaknesses after shift
- **Adaptive Party:** Need multiple damage types available
- **Break Windows:** Each phase gives new shields to break

### Test Requirements (10+ tests)
- [ ] Weakness change at 66% HP
- [ ] Weakness change at 33% HP
- [ ] Previous weakness becomes immunity
- [ ] Shield count adjusts per phase
- [ ] Elemental blast uses current element
- [ ] Prismatic shield reflect mechanics
- [ ] Analyze updates after shift
- [ ] Multi-element attack interaction
- [ ] Break before/after shift
- [ ] Full fight simulation

---

## Template 3: Channeled Ultimate

**Concept:** Boss telegraphs a devastating attack that must be interrupted via Break.

### Mechanical Pattern
```javascript
{
  id: 'dragon',
  tier: 'major-boss',
  hp: 350,
  shieldCount: 8,
  weaknesses: ['ice', 'holy'],
  immunities: ['fire'],
  
  phases: [
    {
      trigger: 'hp_below_60',
      action: 'begin_channel',
      channelTurns: 2,
      channelAbility: 'inferno_breath',
      channelDamage: 80,  // Party wipe if not interrupted
      shieldCount: 6,     // Shields reset for interrupt window
      message: "The Dragon inhales deeply, preparing Inferno Breath!"
    },
    {
      trigger: 'channel_broken',
      action: 'stagger',
      extraBreakTurns: 1,  // Extended vulnerability
      message: "The Dragon chokes on interrupted flames!"
    },
    {
      trigger: 'hp_below_25',
      action: 'desperate',
      statModifiers: { attack: 2.0, speed: 1.5 },
      message: "The Dragon becomes desperate!"
    }
  ],
  
  abilities: [
    { id: 'claw_swipe', damage: 20, targets: 'single', cooldown: 0 },
    { id: 'tail_sweep', damage: 15, targets: 'all', cooldown: 3 },
    { id: 'fire_breath', damage: 30, targets: 'all', element: 'fire', cooldown: 4 }
  ]
}
```

### Strategic Considerations
- **Critical Break Check:** Team MUST break shields before channel completes
- **Shield Management:** Save Warrior abilities for channel phase
- **Cleric Extends:** Blessed Judgment extends the stagger window

### Test Requirements (12+ tests)
- [ ] Channel begins at 60% HP
- [ ] Channel countdown display
- [ ] Inferno Breath damage if not interrupted
- [ ] Break during channel triggers stagger
- [ ] Extended Break duration on stagger
- [ ] Desperate phase stat modifiers
- [ ] Fire breath immunity check
- [ ] Ice/holy weakness multiplier
- [ ] Shield reset on channel start
- [ ] Full fight with interrupt
- [ ] Full fight without interrupt (party wipe)
- [ ] Multiple channel attempts

---

## Template 4: Multi-Part Boss

**Concept:** Boss with targetable parts that have separate HP/shields.

### Mechanical Pattern
```javascript
{
  id: 'abyss_overlord',
  tier: 'final-boss',
  hp: 500,  // Core HP
  shieldCount: 10,
  weaknesses: ['holy', 'lightning'],
  immunities: ['shadow'],
  
  parts: [
    {
      id: 'left_arm',
      hp: 100,
      shieldCount: 3,
      weaknesses: ['fire'],
      abilities: ['shadow_grasp'],
      onDestroy: { message: "The Overlord's grip weakens!", effect: 'reduce_boss_attack' }
    },
    {
      id: 'right_arm',
      hp: 100,
      shieldCount: 3,
      weaknesses: ['ice'],
      abilities: ['void_slash'],
      onDestroy: { message: "The Overlord staggers!", effect: 'reduce_boss_defense' }
    }
  ],
  
  phases: [
    {
      trigger: 'hp_below_75',
      action: 'summon_void',
      effect: 'add_shadow_damage_all_attacks',
      message: "The Abyss Overlord channels void energy!"
    },
    {
      trigger: 'hp_below_50',
      action: 'regenerate_arms',
      condition: 'arms_destroyed',
      armsHp: 50,
      message: "Dark tendrils reform the Overlord's arms!"
    },
    {
      trigger: 'hp_below_25',
      action: 'begin_channel',
      channelTurns: 3,
      channelAbility: 'void_annihilation',
      channelDamage: 999,  // Instant party wipe
      shieldCount: 12,
      message: "The Abyss Overlord begins channeling Void Annihilation!"
    }
  ],
  
  abilities: [
    { id: 'abyssal_strike', damage: 35, targets: 'single', cooldown: 0 },
    { id: 'darkness_wave', damage: 25, targets: 'all', element: 'shadow', cooldown: 3 },
    { id: 'consume_soul', damage: 40, effect: 'heal_boss_20', targets: 'single', cooldown: 5 }
  ]
}
```

### Strategic Considerations
- **Target Priority:** Destroy arms first to weaken boss
- **Different Weaknesses:** Arms have different weaknesses than core
- **Regeneration:** Arms respawn at 50% HP if destroyed early
- **Final Phase:** Must break 12 shields in 3 turns to survive

### Test Requirements (15+ tests)
- [ ] Part targeting system
- [ ] Separate HP pools for parts
- [ ] Separate shield counts for parts
- [ ] Different weaknesses per part
- [ ] onDestroy effects trigger
- [ ] Part abilities function
- [ ] Arm regeneration at 50% HP
- [ ] Void Annihilation channel
- [ ] Break interrupt on final phase
- [ ] Party wipe if channel completes
- [ ] Stat reduction from destroyed arms
- [ ] Shadow damage addition at 75%
- [ ] Consume Soul healing
- [ ] Full fight simulation
- [ ] All arms destroyed before final phase

---

## Boss Loot Tables

### Loot Quality by Tier
```javascript
const BOSS_LOOT_TABLES = {
  'mini-boss': {
    goldRange: [50, 100],
    itemDropChance: 0.75,
    itemPool: ['uncommon', 'rare'],
    guaranteedDrop: 'boss_token_bronze'
  },
  'major-boss': {
    goldRange: [150, 300],
    itemDropChance: 1.0,
    itemPool: ['rare', 'epic'],
    guaranteedDrop: 'boss_token_silver'
  },
  'final-boss': {
    goldRange: [500, 1000],
    itemDropChance: 1.0,
    itemPool: ['epic', 'legendary'],
    guaranteedDrop: 'boss_token_gold'
  }
};
```

---

## UI/UX Guidelines

### Boss Health Bar
```
┌─────────────────────────────────────────────┐
│  ⚔️ GOBLIN CHIEF (Mini-Boss)                │
│  HP: ████████████░░░░░░░░ 112/150           │
│  Shields: 🛡️🛡️🛡️🛡️🛡️ (5/5)                │
│  Weak: 🔥 ✨                                │
│  Phase: Normal                              │
└─────────────────────────────────────────────┘
```

### Channel Warning
```
┌─────────────────────────────────────────────┐
│  ⚠️ DRAGON is channeling INFERNO BREATH!    │
│  ██████░░░░ 2 turns remaining               │
│  💀 80 damage to ALL if not interrupted!    │
│  ➡️ BREAK the shields to interrupt!         │
└─────────────────────────────────────────────┘
```

### Multi-Part Display
```
┌─────────────────────────────────────────────┐
│  👹 ABYSS OVERLORD (Final Boss)             │
│  Core HP: ████████░░░░ 320/500              │
│  Shields: 🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️ (8/10)        │
├─────────────────────────────────────────────┤
│  🦾 Left Arm: ████░░░░ 45/100  🛡️🛡️ (2/3)  │
│  🦾 Right Arm: ██░░░░░░ 20/100 🛡️ (1/3)    │
└─────────────────────────────────────────────┘
```

---

## Integration with Dungeon Floors (PR #200)

| Floor | Boss | Template | Recommended Level |
|-------|------|----------|-------------------|
| 3 | Goblin Chief | Minion Summoner | 3-4 |
| 6 | Ice Spirit | Elemental Shifter | 6-7 |
| 9 | Dragon | Channeled Ultimate | 9-10 |
| 10 | Abyss Overlord | Multi-Part | 10+ |

---

## Total Test Coverage

| Template | Tests Required |
|----------|----------------|
| Minion Summoner | 8 |
| Elemental Shifter | 10 |
| Channeled Ultimate | 12 |
| Multi-Part Boss | 15 |
| Loot Tables | 5 |
| **TOTAL** | **50+** |

---

*Drafted during #voted-out research phase, Day 343*
*Pairs with Shield/Break System proposal for complete boss design framework*
