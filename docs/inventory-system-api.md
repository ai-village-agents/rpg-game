# Inventory System API Documentation

**Version:** 1.0.0  
**Last Updated:** Day 343  
**Author:** Claude Opus 4.5 (from #voted-out)  
**Source File:** `src/inventory.js` (395 lines)  
**Original Author:** Claude Opus 4.6 (Day 338)

## Table of Contents

1. [Overview](#overview)
2. [Data Structures](#data-structures)
3. [Equipment Functions](#equipment-functions)
4. [Item Query Functions](#item-query-functions)
5. [Inventory Display Functions](#inventory-display-functions)
6. [Phase Management](#phase-management)
7. [Action Handler](#action-handler)
8. [Integration Guide](#integration-guide)
9. [Usage Examples](#usage-examples)

---

## Overview

The Inventory System manages item storage, equipment, and consumable usage. It integrates with the items system (`src/items.js`) and equipment sets (`src/equipment-sets.js`) to provide a complete inventory management solution.

### Key Features

- **3 Equipment Slots:** Weapon, Armor, Accessory
- **Consumable Usage:** HP/MP restoration, status curing
- **Equipment Bonuses:** Stat bonuses from equipped items + set bonuses
- **Categorized Display:** Items sorted by type for UI
- **Phase State Machine:** Multi-screen inventory navigation

### Architecture Flow

```
Player opens inventory → createInventoryState()
        ↓
UI renders → getCategorizedInventory() + getEquipmentDisplay()
        ↓
Player action → handleInventoryAction(gameState, action)
        ↓
equipItem() / unequipItem() / useConsumable()
        ↓
Updated player state with new inventory/equipment
```

---

## Data Structures

### Equipment Slots

```javascript
export const EQUIPMENT_SLOTS = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
};
```

### Inventory State (for phase management)

```javascript
{
  screen: 'main',           // Current sub-screen
  returnPhase: 'exploration', // Phase to return to on close
  selectedItem: null,       // Item being viewed
  message: null,            // Feedback message
}
```

### Inventory Screens

```javascript
export const INVENTORY_SCREENS = {
  MAIN: 'main',         // Overview: items + equipment summary
  USE_ITEM: 'useItem',  // Selecting a consumable to use
  EQUIP: 'equip',       // Selecting an item to equip
  UNEQUIP: 'unequip',   // Selecting a slot to unequip
  DETAILS: 'details',   // Viewing item details
};
```

### Player Inventory Format

```javascript
// Inventory is a count map:
player.inventory = {
  'healthPotion': 5,
  'ironSword': 1,
  'leatherArmor': 1
}

// Equipment is slot → itemId:
player.equipment = {
  weapon: 'ironSword',
  armor: null,
  accessory: 'luckyCharm'
}
```

---

## Equipment Functions

### getEquipSlot(itemId)

Get the equipment slot for an item.

```javascript
import { getEquipSlot } from './inventory.js';

const slot = getEquipSlot('ironSword');    // 'weapon'
const slot2 = getEquipSlot('healthPotion'); // null (not equippable)
```

**Returns:** `string | null` - Slot name or null

---

### isEquippable(itemId)

Check if an item can be equipped.

```javascript
import { isEquippable } from './inventory.js';

isEquippable('ironSword');    // true
isEquippable('healthPotion'); // false
```

**Returns:** `boolean`

---

### isUsable(itemId)

Check if an item is a consumable.

```javascript
import { isUsable } from './inventory.js';

isUsable('healthPotion'); // true
isUsable('ironSword');    // false
```

**Returns:** `boolean`

---

### ensureEquipment(player)

Initialize equipment object if not present.

```javascript
import { ensureEquipment } from './inventory.js';

const player = ensureEquipment({ hp: 100 });
// player.equipment = { weapon: null, armor: null, accessory: null }
```

**Returns:** `object` - Player with equipment field

---

### getEquipmentBonuses(equipment)

Calculate total stat bonuses from equipped items.

```javascript
import { getEquipmentBonuses } from './inventory.js';

const bonuses = getEquipmentBonuses(player.equipment);
// { attack: 15, defense: 10, speed: 5, magic: 0, critChance: 5 }
```

**Note:** Includes set bonuses from `getEquipmentSetBonuses()`.

**Returns:** `{ attack, defense, speed, magic, critChance }`

---

### equipItem(player, itemId)

Equip an item from inventory.

```javascript
import { equipItem } from './inventory.js';

const result = equipItem(player, 'ironSword');
if (result.success) {
  player = result.player;
  showMessage(result.message); // "Equipped Iron Sword."
}
```

**Behavior:**
- Removes item from inventory
- If slot occupied, returns old item to inventory
- Updates equipment slot

**Returns:**
```javascript
{
  player: object,    // Updated player state
  success: boolean,
  message: string    // Feedback message
}
```

**Possible Messages:**
- `"Item not found: {itemId}"`
- `"{name} cannot be equipped."`
- `"You don't have {name} in your inventory."`
- `"Equipped {name}."`
- `"Equipped {name}. Unequipped {oldName}."`

---

### unequipItem(player, slot)

Remove an item from an equipment slot.

```javascript
import { unequipItem } from './inventory.js';

const result = unequipItem(player, 'weapon');
if (result.success) {
  player = result.player;
  showMessage(result.message); // "Unequipped Iron Sword."
}
```

**Behavior:**
- Returns equipped item to inventory
- Sets slot to null

**Returns:** `{ player, success, message }`

---

### useConsumable(player, itemId)

Use a consumable item on the player.

```javascript
import { useConsumable } from './inventory.js';

const result = useConsumable(player, 'healthPotion');
if (result.success) {
  player = result.player;
  showMessage(result.message); // "Restored 50 HP!"
}
```

**Applied Effects:**
- HP restoration
- MP restoration
- Status effect curing
- Inventory count reduction

**Returns:** `{ player, success, message }`

---

## Item Query Functions

### getItemDetails(itemId)

Get comprehensive item information for display.

```javascript
import { getItemDetails } from './inventory.js';

const details = getItemDetails('ironSword');
// {
//   id: 'ironSword',
//   name: 'Iron Sword',
//   type: 'weapon',
//   rarity: 'common',
//   description: 'A sturdy iron blade.',
//   stats: { attack: 10 },
//   effect: {},
//   value: 50,
//   equippable: true,
//   usable: false,
//   slot: 'weapon'
// }
```

**Returns:** `object | null`

---

## Inventory Display Functions

### getCategorizedInventory(inventory)

Sort inventory items by type for UI display.

```javascript
import { getCategorizedInventory } from './inventory.js';

const categorized = getCategorizedInventory(player.inventory);
// {
//   consumables: [{ id, name, type, rarity, description, count, value, stats }],
//   weapons: [...],
//   armors: [...],
//   accessories: [...],
//   unknown: [...]
// }
```

**Returns:** Object with arrays for each category

---

### getEquipmentDisplay(equipment)

Get display info for all equipment slots.

```javascript
import { getEquipmentDisplay } from './inventory.js';

const display = getEquipmentDisplay(player.equipment);
// {
//   weapon: { id: 'ironSword', name: 'Iron Sword', rarity: 'common', stats: { attack: 10 } },
//   armor: null,
//   accessory: { id: 'luckyCharm', name: 'Lucky Charm', ... }
// }
```

**Returns:** Object with display info per slot (or null if empty)

---

## Phase Management

### createInventoryState(returnPhase)

Create initial inventory phase state.

```javascript
import { createInventoryState } from './inventory.js';

const invState = createInventoryState('exploration');
// {
//   screen: 'main',
//   returnPhase: 'exploration',
//   selectedItem: null,
//   message: null
// }
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| returnPhase | string | 'exploration' | Phase to return to on close |

---

## Action Handler

### handleInventoryAction(gameState, action)

Main dispatch handler for INVENTORY phase.

```javascript
import { handleInventoryAction } from './inventory.js';

const newState = handleInventoryAction(gameState, { type: 'INVENTORY_USE', itemId: 'healthPotion' });
```

**Supported Actions:**

| Action Type | Payload | Description |
|-------------|---------|-------------|
| CLOSE_INVENTORY | - | Return to previous phase |
| INVENTORY_USE | itemId | Use a consumable |
| INVENTORY_EQUIP | itemId | Equip an item |
| INVENTORY_UNEQUIP | slot | Unequip from slot |
| INVENTORY_VIEW_DETAILS | itemId | View item details |
| INVENTORY_BACK | - | Return to main screen |

**Returns:** Updated game state

---

## Integration Guide

### Opening Inventory

```javascript
import { createInventoryState } from './inventory.js';

function openInventory(state) {
  return {
    ...state,
    phase: 'inventory',
    inventoryState: createInventoryState(state.phase)
  };
}
```

### Rendering Inventory UI

```javascript
import { 
  getCategorizedInventory, 
  getEquipmentDisplay, 
  getEquipmentBonuses 
} from './inventory.js';

function renderInventory(player) {
  const categories = getCategorizedInventory(player.inventory);
  const equipment = getEquipmentDisplay(player.equipment);
  const bonuses = getEquipmentBonuses(player.equipment);
  
  return {
    consumables: categories.consumables,
    weapons: categories.weapons,
    armors: categories.armors,
    accessories: categories.accessories,
    equipped: equipment,
    totalBonuses: bonuses
  };
}
```

### Processing Actions

```javascript
import { handleInventoryAction } from './inventory.js';

function dispatch(state, action) {
  if (state.phase === 'inventory') {
    return handleInventoryAction(state, action);
  }
  // ... other phase handlers
}
```

### Combat Integration

```javascript
import { getEquipmentBonuses } from './inventory.js';

function getEffectiveCombatStats(player) {
  const equipBonuses = getEquipmentBonuses(player.equipment);
  
  return {
    attack: player.baseAttack + equipBonuses.attack,
    defense: player.baseDefense + equipBonuses.defense,
    speed: player.baseSpeed + equipBonuses.speed,
    magic: player.baseMagic + equipBonuses.magic,
    critChance: player.baseCritChance + equipBonuses.critChance
  };
}
```

---

## Usage Examples

### Example 1: Complete Equipment Flow

```javascript
import { equipItem, unequipItem, getEquipmentBonuses } from './inventory.js';

// Player starts with sword in inventory
let player = {
  inventory: { ironSword: 1, healthPotion: 3 },
  equipment: { weapon: null, armor: null, accessory: null }
};

// Equip the sword
let result = equipItem(player, 'ironSword');
console.log(result.message); // "Equipped Iron Sword."
player = result.player;
// inventory: { healthPotion: 3 }
// equipment: { weapon: 'ironSword', ... }

// Get bonuses
const bonuses = getEquipmentBonuses(player.equipment);
console.log(bonuses.attack); // 10

// Unequip
result = unequipItem(player, 'weapon');
player = result.player;
// inventory: { ironSword: 1, healthPotion: 3 }
// equipment: { weapon: null, ... }
```

### Example 2: Consumable Usage

```javascript
import { useConsumable, isUsable } from './inventory.js';

let player = {
  hp: 50,
  maxHp: 100,
  inventory: { healthPotion: 2 }
};

if (isUsable('healthPotion')) {
  const result = useConsumable(player, 'healthPotion');
  if (result.success) {
    player = result.player;
    console.log(result.message); // "Restored 50 HP!"
    console.log(player.hp); // 100
    console.log(player.inventory.healthPotion); // 1
  }
}
```

### Example 3: Inventory UI Rendering

```javascript
import { getCategorizedInventory, getItemDetails } from './inventory.js';

function renderInventoryUI(player) {
  const categories = getCategorizedInventory(player.inventory);
  
  const items = [];
  
  for (const consumable of categories.consumables) {
    const details = getItemDetails(consumable.id);
    items.push({
      ...details,
      count: consumable.count,
      action: 'use'
    });
  }
  
  for (const weapon of categories.weapons) {
    const details = getItemDetails(weapon.id);
    items.push({
      ...details,
      count: weapon.count,
      action: 'equip'
    });
  }
  
  return items;
}
```

### Example 4: Equipment Swap

```javascript
import { equipItem } from './inventory.js';

let player = {
  inventory: { steelSword: 1 },
  equipment: { weapon: 'ironSword', armor: null, accessory: null }
};

// Equipping steel sword will auto-unequip iron sword
const result = equipItem(player, 'steelSword');
console.log(result.message); 
// "Equipped Steel Sword. Unequipped Iron Sword."

player = result.player;
// inventory: { ironSword: 1 }  <- old weapon returned
// equipment: { weapon: 'steelSword', ... }
```

---

## Dependencies

- `src/items.js` - `useItem`, `addItemToInventory`, `removeItemFromInventory`
- `src/data/items.js` - Item definitions
- `src/equipment-sets.js` - `getEquipmentSetBonuses`

---

## Testing Reference

Related test files:
- `tests/inventory-test.mjs` - Core inventory logic tests
- `tests/inventory-import-test.mjs` - Import validation

Key test scenarios:
1. Equipping items from inventory
2. Unequipping returns item to inventory
3. Slot swapping (equip over existing)
4. Using consumables reduces count
5. Equipment bonuses calculated correctly
6. Set bonuses included
7. Category sorting works correctly
8. Action handler processes all action types

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Day 343 | Initial documentation |

---

*Documentation generated from #voted-out by Claude Opus 4.5*
