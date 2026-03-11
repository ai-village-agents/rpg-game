# Crafting System API Documentation

**Version:** 1.0.0  
**Last Updated:** Day 343  
**Author:** Claude Opus 4.5 (from #voted-out)  
**Source File:** `src/crafting.js` (260 lines)

## Table of Contents

1. [Overview](#overview)
2. [Data Structures](#data-structures)
3. [State Management](#state-management)
4. [Recipe Functions](#recipe-functions)
5. [Crafting Functions](#crafting-functions)
6. [Material Drop System](#material-drop-system)
7. [Integration Guide](#integration-guide)
8. [Usage Examples](#usage-examples)

---

## Overview

The Crafting System enables players to discover recipes and craft items from collected materials. It integrates with the items system and provides a recipe discovery mechanic for progression.

### Key Features

- **Recipe Discovery:** Players unlock recipes through gameplay
- **Ingredient Checking:** Validates player has required materials
- **Level Requirements:** Some recipes require minimum player level
- **Craft Counting:** Tracks how many times each item was crafted
- **Material Drops:** Enemy-level-based crafting material drops

### Architecture Flow

```
Discovery event → discoverRecipe(state, recipeId)
       ↓
Player opens crafting UI → getAvailableRecipes(state)
       ↓
Player selects recipe → canCraftRecipe(state, recipeId)
       ↓
Ingredients sufficient → craftItem(state, recipeId)
       ↓
Remove ingredients, add result, update craft count
```

---

## Data Structures

### Crafting State

Stored in `state.crafting`:

```javascript
{
  discoveredRecipes: ['basicHealthPotion', 'ironSword'],  // Known recipe IDs
  craftCount: {                                           // Times crafted
    'basicHealthPotion': 5,
    'ironSword': 2
  }
}
```

### Recipe Structure

From `src/data/recipes.js`:

```javascript
{
  id: 'basicHealthPotion',
  name: 'Basic Health Potion',
  category: 'consumable',          // 'consumable' | 'weapon' | 'armor' | 'accessory'
  requiredLevel: 1,                // Minimum player level
  ingredients: [
    { itemId: 'herbBundle', quantity: 2 },
    { itemId: 'crystalLens', quantity: 1 }
  ],
  result: {
    itemId: 'healthPotion',
    quantity: 1
  }
}
```

### Missing Ingredient Info

Returned by validation functions:

```javascript
{
  itemId: 'herbBundle',
  name: 'Herb Bundle',
  required: 2,
  have: 1
}
```

---

## State Management

### createCraftingState()

Create a new empty crafting state.

```javascript
import { createCraftingState } from './crafting.js';

const crafting = createCraftingState();
// { discoveredRecipes: [], craftCount: {} }
```

**Returns:** `{ discoveredRecipes: string[], craftCount: Record<string, number> }`

---

### ensureCraftingState(state) [Internal]

Ensures crafting state exists on game state. Creates if missing, validates structure.

**Note:** Called internally by other functions - not exported.

---

## Recipe Functions

### getRecipeById(recipeId)

Get a recipe definition by ID.

```javascript
import { getRecipeById } from './crafting.js';

const recipe = getRecipeById('basicHealthPotion');
// { id, name, category, requiredLevel, ingredients, result }
```

**Returns:** `object | null`

---

### getRecipesByCategory(category)

Get all recipes in a category.

```javascript
import { getRecipesByCategory } from './crafting.js';

const weaponRecipes = getRecipesByCategory('weapon');
// Array of weapon recipes
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| category | string | 'consumable', 'weapon', 'armor', 'accessory' |

**Returns:** `Recipe[]`

---

### discoverRecipe(state, recipeId)

Unlock a recipe for the player.

```javascript
import { discoverRecipe } from './crafting.js';

const result = discoverRecipe(state, 'basicHealthPotion');
if (result.success) {
  showNotification(result.message); // "Discovered recipe: Basic Health Potion."
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| state | object | Game state (mutated) |
| recipeId | string | Recipe to discover |

**Returns:** `{ success: boolean, message: string }`

**Possible Messages:**
- `"Invalid recipe id."`
- `"Recipe not found: {recipeId}"`
- `"{name} is already discovered."`
- `"Discovered recipe: {name}."`

---

### getAvailableRecipes(state)

Get all discovered recipes with crafting availability info.

```javascript
import { getAvailableRecipes } from './crafting.js';

const recipes = getAvailableRecipes(state);
recipes.forEach(recipe => {
  console.log(recipe.name, recipe.canCraft ? '✓' : '✗');
  if (!recipe.canCraft) {
    recipe.missingIngredients.forEach(ing => {
      console.log(`  Need ${ing.required - ing.have} more ${ing.name}`);
    });
  }
});
```

**Returns:** Array of recipe objects with additional fields:

```javascript
{
  ...recipe,
  canCraft: boolean,           // Can craft right now?
  missingIngredients: [        // What's missing (if any)
    { itemId, name, required, have }
  ]
}
```

---

### canCraftRecipe(state, recipeId)

Check if a specific recipe can be crafted.

```javascript
import { canCraftRecipe } from './crafting.js';

const { canCraft, reason, missingIngredients } = canCraftRecipe(state, 'ironSword');
if (!canCraft) {
  console.log(`Cannot craft: ${reason}`);
}
```

**Returns:**
```javascript
{
  canCraft: boolean,
  reason: string | null,      // Why it can't be crafted
  missingIngredients: Array   // Missing ingredient details
}
```

**Possible Reasons:**
- `"Recipe not found: {recipeId}"`
- `"Recipe not discovered."`
- `"Requires level {n}."`
- `"Missing required ingredients."`
- `null` (if can craft)

---

## Crafting Functions

### craftItem(state, recipeId)

Craft an item. Mutates state in place.

```javascript
import { craftItem } from './crafting.js';

const result = craftItem(state, 'basicHealthPotion');
if (result.success) {
  showNotification(result.message); // "Crafted Basic Health Potion!"
  displayItem(result.item);
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| state | object | Game state (mutated) |
| recipeId | string | Recipe to craft |

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  item?: object    // Crafted item details (if success)
}
```

**Side Effects (on success):**
- Removes ingredients from `state.player.inventory`
- Adds result item to `state.player.inventory`
- Increments `state.crafting.craftCount[recipeId]`

---

### lookupItem(itemId)

Look up item across all item sources (base items, materials, crafted items).

```javascript
import { lookupItem } from './crafting.js';

const item = lookupItem('herbBundle');
// { id, name, description, type, rarity, ... }
```

**Returns:** `object | null`

---

### getAllItems()

Get merged item map including base items, crafting materials, and crafted items.

```javascript
import { getAllItems } from './crafting.js';

const allItems = getAllItems();
// { healthPotion: {...}, herbBundle: {...}, ironSword: {...}, ... }
```

**Returns:** `Record<string, object>` - All items merged

---

## Material Drop System

### getCraftingMaterialDrops(enemyLevel, rng)

Generate random crafting material drops based on enemy level.

```javascript
import { getCraftingMaterialDrops } from './crafting.js';

const drops = getCraftingMaterialDrops(5);
// [{ materialId: 'ironOre', quantity: 1 }, { materialId: 'arcaneEssence', quantity: 1 }]

// With custom RNG for testing:
const testDrops = getCraftingMaterialDrops(10, () => 0.1); // Always drops
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| enemyLevel | number | - | Enemy level (affects pool) |
| rng | () => number | Math.random | Random function (0-1) |

**Returns:** `Array<{ materialId: string, quantity: number }>`

**Drop Pool by Level:**

| Level | Available Materials |
|-------|---------------------|
| 1+ | herbBundle, ironOre, beastFang |
| 4+ | + arcaneEssence, enchantedThread, crystalLens |
| 7+ | + dragonScale, shadowShard |
| 10+ | + ancientRune, phoenixFeather |

**Drop Chance:** 30% per material in pool

---

## Integration Guide

### Victory Screen Integration

```javascript
import { getCraftingMaterialDrops } from './crafting.js';
import { addItemToInventory } from './items.js';

function handleVictory(state, enemy) {
  const drops = getCraftingMaterialDrops(enemy.level);
  let inventory = state.player.inventory;
  
  for (const drop of drops) {
    inventory = addItemToInventory(inventory, drop.materialId, drop.quantity);
  }
  
  return {
    ...state,
    player: { ...state.player, inventory },
    victoryDrops: drops
  };
}
```

### Recipe Discovery Events

```javascript
import { discoverRecipe } from './crafting.js';

// Discover recipe from quest reward
function rewardQuestRecipe(state, questId) {
  const recipes = {
    'blacksmith_intro': 'basicIronSword',
    'alchemist_intro': 'basicHealthPotion'
  };
  
  const recipeId = recipes[questId];
  if (recipeId) {
    return discoverRecipe(state, recipeId);
  }
  return { success: false, message: 'No recipe for this quest.' };
}
```

### Crafting UI

```javascript
import { getAvailableRecipes, craftItem, lookupItem } from './crafting.js';

function renderCraftingUI(state) {
  const recipes = getAvailableRecipes(state);
  
  return recipes.map(recipe => ({
    name: recipe.name,
    category: recipe.category,
    canCraft: recipe.canCraft,
    ingredients: recipe.ingredients.map(ing => {
      const item = lookupItem(ing.itemId);
      const have = state.player.inventory[ing.itemId] || 0;
      return {
        name: item?.name || ing.itemId,
        required: ing.quantity,
        have,
        satisfied: have >= ing.quantity
      };
    }),
    onCraft: () => craftItem(state, recipe.id)
  }));
}
```

---

## Usage Examples

### Example 1: Complete Crafting Flow

```javascript
import { discoverRecipe, canCraftRecipe, craftItem } from './crafting.js';
import { addItemToInventory } from './items.js';

// Setup: Player finds recipe scroll
let state = {
  player: { level: 3, inventory: {} },
  crafting: { discoveredRecipes: [], craftCount: {} }
};

// Discover the recipe
discoverRecipe(state, 'basicHealthPotion');
// state.crafting.discoveredRecipes = ['basicHealthPotion']

// Add materials to inventory
state.player.inventory = addItemToInventory(state.player.inventory, 'herbBundle', 3);
state.player.inventory = addItemToInventory(state.player.inventory, 'crystalLens', 1);

// Check if craftable
const check = canCraftRecipe(state, 'basicHealthPotion');
console.log(check.canCraft); // true

// Craft the item
const result = craftItem(state, 'basicHealthPotion');
console.log(result.message); // "Crafted Basic Health Potion!"
// state.player.inventory now has healthPotion
// state.crafting.craftCount.basicHealthPotion = 1
```

### Example 2: Material Drop Processing

```javascript
import { getCraftingMaterialDrops, lookupItem } from './crafting.js';

function processCombatDrops(enemyLevel) {
  const drops = getCraftingMaterialDrops(enemyLevel);
  
  if (drops.length === 0) {
    return 'No crafting materials dropped.';
  }
  
  const messages = drops.map(drop => {
    const item = lookupItem(drop.materialId);
    return `Found ${drop.quantity}x ${item?.name || drop.materialId}!`;
  });
  
  return messages.join(' ');
}

// High-level enemy drops rarer materials
console.log(processCombatDrops(12));
// "Found 1x Dragon Scale! Found 1x Phoenix Feather!"
```

### Example 3: Recipe Availability Summary

```javascript
import { getAvailableRecipes } from './crafting.js';

function getCraftingSummary(state) {
  const recipes = getAvailableRecipes(state);
  
  const craftable = recipes.filter(r => r.canCraft);
  const blocked = recipes.filter(r => !r.canCraft);
  
  return {
    totalDiscovered: recipes.length,
    readyToCraft: craftable.map(r => r.name),
    needsIngredients: blocked.map(r => ({
      name: r.name,
      missing: r.missingIngredients.map(i => 
        `${i.required - i.have}x ${i.name}`
      )
    }))
  };
}
```

---

## Dependencies

- `src/data/recipes.js` - Recipe definitions, craftingMaterials, craftedItems
- `src/data/items.js` - Base item definitions
- `src/items.js` - addItemToInventory, removeItemFromInventory, getItemCount

---

## Related Files

- `src/crafting-ui.js` - UI rendering for crafting screen
- `src/crafting-integration.js` - Integration hooks

---

## Testing Reference

Related test files:
- `tests/crafting-test.mjs` - Core crafting logic tests
- `tests/crafting-import-test.mjs` - Import validation

Key test scenarios:
1. Creating fresh crafting state
2. Discovering recipes (success and duplicate)
3. Getting available recipes with availability info
4. Checking craftability with level requirements
5. Checking craftability with missing ingredients
6. Crafting items (ingredient removal, result addition)
7. Craft count tracking
8. Material drops by enemy level
9. Material drop randomness (using seeded RNG)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Day 343 | Initial documentation |

---

*Documentation generated from #voted-out by Claude Opus 4.5*
