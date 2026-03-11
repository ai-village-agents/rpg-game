# Equipment Upgrade & Crafting System Design
## A Future Feature Proposal for Post-Shield/Break Implementation

**Author:** Claude Opus 4.5  
**Date:** Day 343 (from #voted-out)  
**Status:** PROPOSAL - For Day 345+ implementation  
**Prerequisites:** Shield/Break system complete, Provisions system stable

---

## Executive Summary

This document proposes an Equipment Upgrade and Crafting System that builds naturally on our existing Provisions System. Players will gather materials from combat and exploration, then use them to upgrade weapons/armor or craft new items. The system adds meaningful progression loops and encourages diverse gameplay strategies.

**Design Pillars:**
1. **Meaningful Choices** - Multiple upgrade paths with tradeoffs
2. **Exploration Rewards** - Materials encourage thorough world exploration  
3. **Combat Integration** - Materials drop from enemies, synergize with Shield/Break
4. **Satisfying Progression** - Clear power growth that feels earned

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Material Types](#2-material-types)
3. [Crafting Stations](#3-crafting-stations)
4. [Upgrade Mechanics](#4-upgrade-mechanics)
5. [Recipe System](#5-recipe-system)
6. [UI/UX Design](#6-uiux-design)
7. [Integration Points](#7-integration-points)
8. [Data Structures](#8-data-structures)
9. [Implementation Plan](#9-implementation-plan)
10. [Inspiration Sources](#10-inspiration-sources)

---

## 1. System Overview

### 1.1 Core Loop

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   EXPLORE   │────▶│   GATHER    │────▶│   CRAFT     │
│  (dungeons, │     │ (materials, │     │ (upgrade,   │
│   world)    │     │  recipes)   │     │  create)    │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │
       │                                       │
       └───────── STRONGER GEAR ◀──────────────┘
```

### 1.2 Feature Components

| Component | Description | Priority |
|-----------|-------------|----------|
| Material Collection | Gather from enemies, nodes, chests | High |
| Equipment Upgrading | Enhance existing gear (+1, +2, etc.) | High |
| Trait Transfer | Move abilities between equipment | Medium |
| Recipe Discovery | Learn new crafting patterns | Medium |
| Quality System | Crafting skill affects outcomes | Low |
| Socketing | Add gems/runes to equipment | Low |

### 1.3 Player Experience Goals

- **Early Game:** Simple upgrades (materials → stronger weapon)
- **Mid Game:** Meaningful choices (paths diverge, traits matter)
- **Late Game:** Optimization (min-maxing, rare recipes, perfect rolls)

---

## 2. Material Types

### 2.1 Material Categories

```javascript
export const MATERIAL_CATEGORIES = {
  ORE: 'ore',           // Metal materials (weapons, armor)
  CLOTH: 'cloth',       // Fabric materials (light armor, accessories)
  LEATHER: 'leather',   // Animal hides (medium armor)
  ESSENCE: 'essence',   // Magical components (enchanting)
  COMPONENT: 'component', // Monster parts (special items)
  GEM: 'gem',           // Precious stones (socketing)
  CATALYST: 'catalyst'  // Rare crafting boosters
};
```

### 2.2 Material Tiers

| Tier | Name | Sources | Example Materials |
|------|------|---------|-------------------|
| 1 | Common | Forest, early dungeons | Iron Ore, Cotton, Rat Hide |
| 2 | Uncommon | Caves, mid dungeons | Silver Ore, Silk, Wolf Pelt |
| 3 | Rare | Ruins, late dungeons | Mithril, Arcane Cloth, Drake Scales |
| 4 | Epic | Mountains, bosses | Adamantite, Celestial Silk, Dragon Hide |
| 5 | Legendary | Secret areas, superbosses | Orichalcum, Void Thread, Titan Scales |

### 2.3 Material Data Structure

```javascript
export const MATERIALS = {
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    category: 'ore',
    tier: 1,
    description: 'Common metal ore. The foundation of most weapons.',
    stackLimit: 99,
    sellPrice: 5,
    sources: ['mining_node_forest', 'rock_golem', 'treasure_chest_cave']
  },
  
  fire_essence: {
    id: 'fire_essence',
    name: 'Fire Essence',
    category: 'essence',
    tier: 2,
    description: 'Crystallized flame energy. Used for fire enchantments.',
    stackLimit: 20,
    sellPrice: 50,
    sources: ['fire_elemental', 'volcano_node', 'dragon_boss']
  },
  
  // ... more materials
};
```

### 2.4 Material Sources

**Combat Drops:**
```javascript
// In enemies.js, add loot tables
'goblin_warrior': {
  // ... existing stats ...
  lootTable: [
    { item: 'iron_ore', chance: 0.3, quantity: [1, 2] },
    { item: 'leather_scrap', chance: 0.5, quantity: [1, 3] },
    { item: 'goblin_badge', chance: 0.1, quantity: [1, 1] }  // Component
  ]
}
```

**Gathering Nodes:**
```javascript
// New gathering system
const GATHERING_NODES = {
  forest_ore_node: {
    materials: ['iron_ore', 'copper_ore'],
    respawnTime: 300,  // seconds
    skillRequired: 0
  },
  ancient_herb_patch: {
    materials: ['healing_herb', 'mana_flower', 'rare_mushroom'],
    respawnTime: 600,
    skillRequired: 10
  }
};
```

---

## 3. Crafting Stations

### 3.1 Station Types

| Station | Location | Function | Unlocked |
|---------|----------|----------|----------|
| Workbench | Town | Basic upgrades, repairs | Start |
| Forge | Blacksmith | Weapon/armor crafting | Quest |
| Alchemy Table | Mage Tower | Potions, essences | Quest |
| Enchanting Altar | Ruins | Trait transfer, enchanting | Mid-game |
| Master Forge | Hidden | Legendary crafting | Late-game |

### 3.2 Station UI Concept

```
┌─────────────────────────────────────────────────────────┐
│  🔨 FORGE                                    [Close X]  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────┐  │
│  │  RECIPES    │  │  PREVIEW                        │  │
│  │ ─────────── │  │                                 │  │
│  │ Iron Sword  │  │  Steel Sword +1                 │  │
│  │ Steel Sword │  │  ═══════════════                │  │
│  │ > Flame Sw  │  │  ATK: 24 → 28 (+4)              │  │
│  │             │  │  Element: Fire 🔥                │  │
│  │             │  │  Trait: [Burning Edge]          │  │
│  │             │  │                                 │  │
│  └─────────────┘  │  Materials Required:            │  │
│                   │  ✓ Steel Sword x1               │  │
│  ┌─────────────┐  │  ✓ Fire Essence x3              │  │
│  │ MATERIALS   │  │  ✗ Dragon Scale x1 (0/1)       │  │
│  │ ─────────── │  │                                 │  │
│  │ Iron Ore x12│  │  [CRAFT] (disabled)            │  │
│  │ Fire Ess x5 │  │                                 │  │
│  │ Steel Bar x2│  └─────────────────────────────────┘  │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Upgrade Mechanics

### 4.1 Enhancement Levels (+1 to +10)

```javascript
export const ENHANCEMENT_BONUSES = {
  // Level: { statMultiplier, materialCost, successRate }
  1: { multiplier: 1.05, cost: 1, rate: 1.0 },    // +5%, guaranteed
  2: { multiplier: 1.10, cost: 1, rate: 1.0 },    // +10%, guaranteed
  3: { multiplier: 1.15, cost: 2, rate: 0.95 },   // +15%, 95%
  4: { multiplier: 1.20, cost: 2, rate: 0.90 },   // +20%, 90%
  5: { multiplier: 1.30, cost: 3, rate: 0.80 },   // +30%, 80%
  6: { multiplier: 1.40, cost: 3, rate: 0.70 },   // +40%, 70%
  7: { multiplier: 1.50, cost: 4, rate: 0.60 },   // +50%, 60%
  8: { multiplier: 1.65, cost: 5, rate: 0.50 },   // +65%, 50%
  9: { multiplier: 1.80, cost: 6, rate: 0.40 },   // +80%, 40%
  10: { multiplier: 2.00, cost: 8, rate: 0.25 }   // +100%, 25%
};

// Failure doesn't destroy item - just consumes materials
// Optional: Catalysts can boost success rate
```

### 4.2 Equipment Evolution (Inspired by Dark Cloud 2)

Certain weapons can evolve into new forms when conditions are met:

```javascript
export const WEAPON_EVOLUTION = {
  iron_sword: {
    evolvesTo: ['steel_sword', 'flame_blade'],
    conditions: {
      steel_sword: { 
        level: '+3', 
        materials: ['steel_bar', 'steel_bar'] 
      },
      flame_blade: { 
        level: '+3', 
        materials: ['fire_essence', 'fire_essence', 'dragon_scale'],
        element: 'fire'  // Must have fire enchant first
      }
    }
  }
};
```

### 4.3 Trait System (Inspired by FF9 & Atelier)

Equipment can have traits that transfer:

```javascript
export const EQUIPMENT_TRAITS = {
  burning_edge: {
    id: 'burning_edge',
    name: 'Burning Edge',
    description: 'Attacks may inflict Burn (10% chance)',
    effect: { status: 'burn', chance: 0.10 },
    transferCost: 2  // Fire Essences to transfer
  },
  
  shield_breaker: {
    id: 'shield_breaker',
    name: 'Shield Breaker',
    description: '+1 shield damage on weakness hits',
    effect: { shieldDamageBonus: 1 },
    transferCost: 3
  },
  
  lifesteal: {
    id: 'lifesteal',
    name: 'Lifesteal',
    description: 'Heal 5% of damage dealt',
    effect: { lifestealPercent: 0.05 },
    transferCost: 4
  }
};
```

---

## 5. Recipe System

### 5.1 Recipe Discovery Methods

1. **NPC Vendors** - Buy basic recipes
2. **Quest Rewards** - Unique recipes from questlines
3. **Treasure Chests** - Random recipe scrolls
4. **Experimentation** - Try combinations (limited)
5. **Boss Drops** - Legendary recipes

### 5.2 Recipe Data Structure

```javascript
export const RECIPES = {
  steel_sword: {
    id: 'steel_sword',
    name: 'Steel Sword',
    station: 'forge',
    category: 'weapon',
    materials: [
      { item: 'iron_sword', quantity: 1 },
      { item: 'steel_bar', quantity: 2 }
    ],
    result: { item: 'steel_sword', quantity: 1 },
    unlockMethod: 'default'  // Available from start
  },
  
  flame_blade: {
    id: 'flame_blade',
    name: 'Flame Blade',
    station: 'forge',
    category: 'weapon',
    materials: [
      { item: 'steel_sword', quantity: 1 },
      { item: 'fire_essence', quantity: 5 },
      { item: 'dragon_scale', quantity: 1 }
    ],
    result: { 
      item: 'flame_blade', 
      quantity: 1,
      traits: ['burning_edge']  // Built-in trait
    },
    unlockMethod: 'recipe_scroll_flame_blade'
  },
  
  greater_healing_potion: {
    id: 'greater_healing_potion',
    name: 'Greater Healing Potion',
    station: 'alchemy_table',
    category: 'consumable',
    materials: [
      { item: 'healing_potion', quantity: 2 },
      { item: 'mana_flower', quantity: 1 },
      { item: 'crystal_vial', quantity: 1 }
    ],
    result: { item: 'greater_healing_potion', quantity: 1 },
    unlockMethod: 'quest_alchemist_apprentice'
  }
};
```

### 5.3 Recipe Categories

| Category | Examples | Station |
|----------|----------|---------|
| Weapons | Swords, Staves, Daggers | Forge |
| Armor | Plate, Robes, Leather | Forge |
| Accessories | Rings, Amulets | Enchanting Altar |
| Consumables | Potions, Elixirs | Alchemy Table |
| Materials | Steel Bars, Enchanted Cloth | Workbench |
| Special | Legendary items | Master Forge |

---

## 6. UI/UX Design

### 6.1 Inventory Material Tab

```
┌─────────────────────────────────────────────────────────┐
│  📦 INVENTORY    [Items] [Materials] [Recipes]          │
├─────────────────────────────────────────────────────────┤
│  Filter: [All ▼]  Sort: [Tier ▼]  Search: [________]   │
├─────────────────────────────────────────────────────────┤
│  ORE                                                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                           │
│  │⬛12│ │⬜ 5│ │🔷 2│ │    │                           │
│  │Iron│ │Stl │ │Mith│ │    │                           │
│  └────┘ └────┘ └────┘ └────┘                           │
│                                                         │
│  ESSENCE                                                │
│  ┌────┐ ┌────┐ ┌────┐                                  │
│  │🔥 8│ │❄️ 3│ │⚡ 5│                                  │
│  │Fire│ │Ice │ │Ltng│                                  │
│  └────┘ └────┘ └────┘                                  │
│                                                         │
│  COMPONENT                                              │
│  ┌────┐ ┌────┐                                         │
│  │🐺 4│ │🐉 1│                                         │
│  │Wolf│ │Drgn│                                         │
│  └────┘ └────┘                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Crafting Result Animation

```javascript
// Success animation concept
function showCraftingResult(success, item) {
  if (success) {
    // Sparkle effect around item
    playSound('craft_success');
    showParticles('golden_sparkles', itemPosition);
    showFloatingText(`Created ${item.name}!`, 'success');
  } else {
    // Smoke puff, materials consumed
    playSound('craft_fail');
    showParticles('smoke_puff', itemPosition);
    showFloatingText('Enhancement failed...', 'warning');
  }
}
```

### 6.3 Material Tooltip

```
┌─────────────────────────────────┐
│ 🔥 Fire Essence                 │
│ ══════════════════════════════  │
│ Tier: 2 (Uncommon)              │
│ Category: Essence               │
│                                 │
│ Crystallized flame energy.      │
│ Used for fire enchantments.     │
│                                 │
│ Sources:                        │
│ • Fire Elemental (Drop)         │
│ • Volcano Nodes (Gather)        │
│ • Dragon Boss (Rare)            │
│                                 │
│ Used in:                        │
│ • Flame Blade                   │
│ • Fire Enchant                  │
│ • Greater Fire Resist Potion    │
│                                 │
│ Sell: 50 gold                   │
└─────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Combat System

```javascript
// In combat.js, add material drops after victory
function processCombatVictory(state, enemy) {
  // ... existing XP, gold logic ...
  
  // NEW: Material drops
  const droppedMaterials = rollLootTable(enemy.lootTable);
  droppedMaterials.forEach(drop => {
    addToInventory(state, drop.item, drop.quantity);
    showLootNotification(drop);
  });
  
  return state;
}
```

### 7.2 Shield/Break Synergy

```javascript
// Materials that enhance Shield/Break
export const SHIELD_BREAK_MATERIALS = {
  breaker_shard: {
    name: 'Breaker Shard',
    description: 'Crafted into weapons that deal +1 shield damage',
    dropsFrom: ['broken_enemies'],  // Only from broken enemies
    recipes: ['shield_crusher_blade', 'breaker_gauntlets']
  },
  
  weakness_crystal: {
    name: 'Weakness Crystal',
    description: 'Reveals one random weakness when used',
    dropsFrom: ['enemies_hit_by_weakness'],
    recipes: ['analyze_scroll', 'weakness_lens']
  }
};
```

### 7.3 NPC Relationship System

```javascript
// Crafting affects NPC relationships
function craftItem(state, recipe) {
  // ... crafting logic ...
  
  // Blacksmith relationship bonus for using forge
  if (recipe.station === 'forge') {
    modifyReputation(state, 'blacksmith', 1, 'Used forge');
  }
  
  // Special recipes unlock at higher reputation
  if (getNPCReputation(state, 'master_smith') >= 50) {
    unlockRecipes(state, MASTER_SMITH_RECIPES);
  }
  
  return state;
}
```

### 7.4 Save System

```javascript
// Add to save data
function serializeCraftingState(state) {
  return {
    materials: state.materials,  // Material inventory
    recipes: state.unlockedRecipes,
    craftingStats: {
      totalCrafted: state.totalItemsCrafted,
      enhancementsAttempted: state.enhancementsAttempted,
      enhancementsSucceeded: state.enhancementsSucceeded
    }
  };
}
```

---

## 8. Data Structures

### 8.1 State Shape

```javascript
// Added to main game state
state.crafting = {
  materials: {
    iron_ore: 12,
    fire_essence: 5,
    // ... material_id: quantity
  },
  
  unlockedRecipes: ['steel_sword', 'healing_potion', ...],
  
  discoveredMaterials: ['iron_ore', 'fire_essence', ...],
  
  craftingStats: {
    totalCrafted: 47,
    enhancementsAttempted: 23,
    enhancementsSucceeded: 18,
    highestEnhancement: 7,
    rarestCrafted: 'flame_blade'
  }
};
```

### 8.2 Equipment Enhancement State

```javascript
// Equipment now tracks enhancement
const enhancedSword = {
  id: 'steel_sword',
  baseId: 'steel_sword',  // Original item type
  enhancement: 5,          // +5
  name: 'Steel Sword +5',
  traits: ['burning_edge', 'lifesteal'],
  
  // Stats modified by enhancement
  stats: {
    attack: 30,  // Base 20 * 1.30 = 26, rounded
    // ... other stats
  }
};
```

### 8.3 Module Exports

```javascript
// src/crafting.js - Core crafting logic
export {
  addMaterial,
  removeMaterial,
  getMaterialCount,
  canCraft,
  craftItem,
  enhanceEquipment,
  transferTrait,
  unlockRecipe,
  getAvailableRecipes
};

// src/crafting-data.js - Static data
export {
  MATERIALS,
  RECIPES,
  EQUIPMENT_TRAITS,
  ENHANCEMENT_BONUSES,
  WEAPON_EVOLUTION,
  CRAFTING_STATIONS
};

// src/crafting-ui.js - UI components
export {
  renderCraftingStation,
  renderMaterialInventory,
  renderRecipeList,
  renderCraftingPreview,
  renderEnhancementUI
};
```

---

## 9. Implementation Plan

### 9.1 Phase 1: Foundation (Day 345-346)

| Task | Description | Estimated Lines |
|------|-------------|-----------------|
| Material data | Define all materials | ~300 |
| Material inventory | Add/remove/query materials | ~150 |
| Loot tables | Add to enemy definitions | ~200 |
| Combat integration | Material drops on victory | ~100 |
| Basic UI | Material tab in inventory | ~200 |

### 9.2 Phase 2: Crafting Core (Day 347-348)

| Task | Description | Estimated Lines |
|------|-------------|-----------------|
| Recipe data | Define all recipes | ~400 |
| Recipe system | Craft items from materials | ~200 |
| Station UI | Forge, workbench interfaces | ~400 |
| Recipe discovery | Unlock system | ~100 |

### 9.3 Phase 3: Enhancement (Day 349-350)

| Task | Description | Estimated Lines |
|------|-------------|-----------------|
| Enhancement system | +1 to +10 upgrades | ~200 |
| Success/failure | RNG with visual feedback | ~150 |
| Trait system | Transfer traits between items | ~250 |
| Evolution paths | Weapon evolution trees | ~200 |

### 9.4 Phase 4: Polish (Day 351+)

| Task | Description | Estimated Lines |
|------|-------------|-----------------|
| Gathering nodes | World material sources | ~200 |
| NPC integration | Reputation affects recipes | ~150 |
| Achievements | Crafting milestones | ~100 |
| Balance tuning | Material drop rates, costs | ~50 |

**Total Estimated:** ~3,100 lines + tests

---

## 10. Inspiration Sources

### 10.1 Dragon Quest XI - Fun-Size Forge

**What Works:**
- Mini-game crafting (timing-based quality)
- Reworking items to improve quality
- Any weapon can be improved

**What We Adapt:**
- Enhancement system with quality tiers
- Optional mini-game for bonus success rate
- Reworking failed enhancements

### 10.2 Atelier Series - Synthesis

**What Works:**
- Traits transfer between items
- Quality affects final product
- Complex multi-step recipes

**What We Adapt:**
- Trait transfer system
- Material quality matters
- Keep it simpler for our game's scope

### 10.3 Final Fantasy IX - Equipment Abilities

**What Works:**
- Learn abilities from equipment
- Switch gear to learn new skills
- Permanent skill acquisition

**What We Adapt:**
- Traits learned from equipment
- Can be transferred to new gear
- Encourages using different equipment

### 10.4 Dark Cloud 2 - Weapon Evolution

**What Works:**
- Weapons evolve into new forms
- Multiple evolution paths
- Stat thresholds trigger evolution

**What We Adapt:**
- Enhancement level + materials = evolution
- Branching weapon trees
- Elemental evolution paths

### 10.5 Lufia II - IP System Relevance

**What Works:**
- Equipment grants unique skills
- Skills charge during combat
- Strategic equipment choices

**What We Adapt:**
- Crafted equipment can grant special abilities
- Ties into combat system

---

## 11. Open Questions

1. **Inventory Management:** Separate material storage or shared inventory?
2. **Failure Penalty:** Materials only, or risk item downgrade?
3. **Multiplayer Future:** Would crafting be shared or individual?
4. **Economy Balance:** How does crafting affect shop economy?
5. **Tutorial:** How do we introduce crafting to new players?

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Material types | 30+ unique materials |
| Recipes | 50+ craftable items |
| Enhancement success rate (overall) | 65-70% |
| Player engagement | 80% try crafting by mid-game |
| Material variety per area | 5-8 unique drops |

---

## 13. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | High | Strict phase boundaries |
| Balance issues | Medium | Medium | Extensive testing, easy tuning |
| UI complexity | Medium | High | Progressive disclosure |
| Save compatibility | Low | High | Migration scripts |

---

## Appendix A: Material Drop Tables

See separate document: `crafting-material-drops.md` (to be created)

## Appendix B: Full Recipe List

See separate document: `crafting-recipe-list.md` (to be created)

---

*Design document created by Claude Opus 4.5 from #voted-out, Day 343*
*Based on research into Dragon Quest XI, Atelier, FF9, Dark Cloud 2, Lufia II*
*For implementation after Shield/Break system is complete*
