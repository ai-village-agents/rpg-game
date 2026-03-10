# Battle Summary System API Reference

> Complete API documentation for the post-combat battle summary display.  
> **Module:** `src/battle-summary.js` (150 lines)  
> **Tests:** `tests/battle-summary-test.mjs`, `tests/battle-summary-combat-stats-test.mjs` (79+ tests)  
> **Added:** PR #246 (Claude Opus 4.6)

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Data Structures](#data-structures)
4. [API Functions](#api-functions)
5. [HTML Rendering](#html-rendering)
6. [Integration Guide](#integration-guide)
7. [Styling Reference](#styling-reference)

---

## Overview

The Battle Summary System displays detailed post-combat information after a victory:

- **XP Gained:** Experience points earned from the battle
- **Gold Earned:** Currency looted from the enemy
- **Items Looted:** Equipment and consumables found
- **Level Ups:** Characters who gained levels during the battle
- **Combat Stats:** Detailed performance metrics (via integration with combat-stats-tracker)

### Integration Flow

```
Combat Victory → createBattleSummary(state) → formatBattleSummary(summary)
                                            ↓
                               renderCombatStatsHtml(summary.combatStatsDisplay)
                                            ↓
                                    Display to Player
```

---

## Quick Start

```javascript
import {
  createBattleSummary,
  formatBattleSummary,
  renderCombatStatsHtml
} from './battle-summary.js';

// After combat victory, create summary from game state
const summary = createBattleSummary(state);

// Format for display
const displayData = formatBattleSummary(summary);

// Render combat stats HTML (if tracking was enabled)
const statsHtml = renderCombatStatsHtml(summary.combatStatsDisplay);

// Use in UI
console.log(displayData.title);      // "Battle Won!"
console.log(displayData.enemyLine);  // "Defeated: Giant Spider"
console.log(displayData.xpLine);     // "XP Gained: +150"
console.log(displayData.goldLine);   // "Gold Earned: +45"
```

---

## Data Structures

### BattleSummary Object

Created by `createBattleSummary()`:

```javascript
{
  // Core rewards
  xpGained: number,           // Experience points earned
  goldGained: number,         // Gold looted
  enemyName: string,          // Name of defeated enemy
  
  // Items found
  lootedItems: Array<string | {name: string, id?: string}>,
  
  // Level ups
  levelUps: Array<{
    memberName?: string,      // Character name
    name?: string,            // Alternative name field
    newLevel: number          // New level reached
  }>,
  
  // Combat statistics (optional)
  combatStats: CombatStats | null,           // Raw stats object
  combatStatsDisplay: DisplayObject | null,  // Formatted for rendering
}
```

### FormattedSummary Object

Created by `formatBattleSummary()`:

```javascript
{
  title: string,              // "Battle Won!"
  enemyLine: string,          // "Defeated: Giant Spider"
  xpLine: string,             // "XP Gained: +150"
  goldLine: string,           // "Gold Earned: +45"
  lootLines: string[],        // ["Found: Health Potion", "Found: Iron Sword"]
  levelUpLines: string[],     // ["Hero reached level 5!"]
  hasLevelUps: boolean,       // true if any level ups occurred
  hasLoot: boolean,           // true if any items were looted
}
```

### Expected State Shape

The `createBattleSummary()` function expects a state object with:

```javascript
{
  xpGained: number,                    // XP from this battle
  goldGained: number,                  // Gold from this battle
  enemy: { name: string },             // Enemy object
  lootedItems: Array,                  // Items found (optional)
  pendingLevelUps: Array,              // Level ups (optional)
  combatStats: CombatStats | null,     // Combat tracking (optional)
}
```

---

## API Functions

### createBattleSummary(state)

Creates a battle summary object from the victory state.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `state` | object | Current game state (should be in 'victory' phase) |

**Returns:** `BattleSummary` - Battle summary data object

**Behavior:**
- Extracts `xpGained`, `goldGained` (defaults to 0)
- Extracts `enemyName` from `state.enemy.name` (defaults to 'Unknown Enemy')
- Copies `lootedItems` array (creates empty array if not present)
- Copies `pendingLevelUps` as `levelUps` (creates empty array if not present)
- Includes `combatStats` if present
- Generates `combatStatsDisplay` using `formatCombatStatsDisplay()`

**Example:**
```javascript
const state = {
  xpGained: 150,
  goldGained: 45,
  enemy: { name: 'Giant Spider' },
  lootedItems: ['Health Potion', { name: 'Spider Silk', id: 'spider_silk' }],
  pendingLevelUps: [{ memberName: 'Hero', newLevel: 5 }],
  combatStats: { /* ... combat stats object ... */ }
};

const summary = createBattleSummary(state);
// summary.xpGained: 150
// summary.goldGained: 45
// summary.enemyName: 'Giant Spider'
// summary.lootedItems: ['Health Potion', { name: 'Spider Silk', id: 'spider_silk' }]
// summary.levelUps: [{ memberName: 'Hero', newLevel: 5 }]
// summary.combatStats: { ... }
// summary.combatStatsDisplay: { sections: [...] }
```

**Edge Cases:**
```javascript
// Missing state properties
createBattleSummary({});
// Returns: { xpGained: 0, goldGained: 0, enemyName: 'Unknown Enemy', ... }

// Null enemy
createBattleSummary({ enemy: null });
// Returns: { enemyName: 'Unknown Enemy', ... }
```

---

### formatBattleSummary(summary)

Formats a battle summary for display.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `summary` | BattleSummary | Battle summary from `createBattleSummary()` |

**Returns:** `FormattedSummary` - Display-ready object with formatted strings

**Behavior:**
- Generates `title`: "Battle Won!"
- Generates `enemyLine`: "Defeated: {enemyName}"
- Generates `xpLine`: "XP Gained: +{xpGained}"
- Generates `goldLine`: "Gold Earned: +{goldGained}"
- Converts `lootedItems` to `lootLines` array
- Converts `levelUps` to `levelUpLines` array
- Sets `hasLevelUps` and `hasLoot` flags

**Example:**
```javascript
const summary = {
  xpGained: 150,
  goldGained: 45,
  enemyName: 'Giant Spider',
  lootedItems: ['Health Potion', { name: 'Spider Silk' }],
  levelUps: [{ memberName: 'Hero', newLevel: 5 }]
};

const display = formatBattleSummary(summary);
// display.title: "Battle Won!"
// display.enemyLine: "Defeated: Giant Spider"
// display.xpLine: "XP Gained: +150"
// display.goldLine: "Gold Earned: +45"
// display.lootLines: ["Found: Health Potion", "Found: Spider Silk"]
// display.levelUpLines: ["Hero reached level 5!"]
// display.hasLevelUps: true
// display.hasLoot: true
```

**Loot Line Formatting:**
```javascript
// String item
'Health Potion' → "Found: Health Potion"

// Object with name
{ name: 'Iron Sword' } → "Found: Iron Sword"

// Object with id only
{ id: 'iron_sword' } → "Found: iron_sword"

// Empty object
{} → "Found: Unknown Item"
```

**Level Up Formatting:**
```javascript
// With memberName
{ memberName: 'Hero', newLevel: 5 } → "Hero reached level 5!"

// With name instead
{ name: 'Companion', newLevel: 3 } → "Companion reached level 3!"

// Missing level
{ memberName: 'Hero' } → "Hero reached level ?!"
```

**No Loot Case:**
```javascript
const summary = { lootedItems: [] };
const display = formatBattleSummary(summary);
// display.lootLines: ["No items looted."]
// display.hasLoot: false
```

---

### renderCombatStatsHtml(combatStatsDisplay)

Renders combat statistics as HTML for the battle summary panel.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `combatStatsDisplay` | object | Display object from `formatCombatStatsDisplay()` |

**Returns:** `string` - HTML string for rendering combat stats panel

**Behavior:**
- Returns empty string if no valid display data
- Renders 'header' sections with rating badge and title
- Renders 'stats' sections with label/value rows
- Applies color coding for rating grades and good/bad stats

**Example:**
```javascript
const combatStatsDisplay = {
  sections: [
    {
      type: 'header',
      title: 'Battle Complete!',
      subtitle: 'vs Giant Spider',
      rating: 'A',
      outcome: 'victory'
    },
    {
      type: 'stats',
      title: 'Combat Overview',
      rows: [
        { label: 'Turns', value: '8' },
        { label: 'Damage Dealt', value: '523', style: 'good' },
        { label: 'Damage Received', value: '127', style: 'bad' }
      ]
    }
  ]
};

const html = renderCombatStatsHtml(combatStatsDisplay);
// Returns HTML string with styled combat stats panel
```

**Empty/Invalid Input:**
```javascript
renderCombatStatsHtml(null);           // Returns ''
renderCombatStatsHtml({});             // Returns ''
renderCombatStatsHtml({ sections: [] }); // Returns ''
```

---

## HTML Rendering

### Rating Color Scheme

The rating badge uses these colors:

| Rating | Color | Hex |
|--------|-------|-----|
| S | Gold | `#d4af37` |
| A | Green | `#4f4` |
| B | Blue | `#4af` |
| C | Gray | `#999` |
| D | Red | `#f44` |

### Stat Row Styling

| Style | Color | Use Case |
|-------|-------|----------|
| `good` | Green (`#4f4`) | Positive stats (damage dealt, healing) |
| `bad` | Red (`#f44`) | Negative stats (damage received) |
| (none) | Default | Neutral stats (turns, duration) |

### Generated HTML Structure

```html
<div class="combat-stats-panel" style="...">
  <!-- Header Section -->
  <div style="display:flex;align-items:center;gap:12px;margin:10px 0;">
    <div style="font-size:40px;font-weight:700;line-height:1;color:#4f4;...">
      A
    </div>
    <div>
      <div style="font-size:18px;font-weight:700;">Battle Complete!</div>
      <div style="font-size:13px;opacity:0.8;">vs Giant Spider</div>
    </div>
  </div>
  
  <!-- Stats Section -->
  <div style="margin:12px 0;">
    <h3 style="margin:0 0 6px 0;font-size:16px;">Combat Overview</h3>
    <div>
      <div style="display:flex;justify-content:space-between;...">
        <div>Turns</div>
        <div>8</div>
      </div>
      <div style="display:flex;justify-content:space-between;...">
        <div>Damage Dealt</div>
        <div class="good" style="color:#4f4;">523</div>
      </div>
      <!-- ... more rows ... -->
    </div>
  </div>
</div>
```

### XSS Protection

All user-provided values are escaped using `escapeHtml()`:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#39;`

---

## Integration Guide

### With Combat System

```javascript
// In combat-handler.js - when combat ends in victory
import { createBattleSummary, formatBattleSummary, renderCombatStatsHtml } from './battle-summary.js';
import { finalizeCombatStats } from './combat-stats-tracker.js';

function handleVictory(state) {
  // Finalize combat stats first
  if (state.combatStats) {
    finalizeCombatStats(state.combatStats, 'victory', state.player.hp, state.player.maxHp);
  }
  
  // Create summary
  const summary = createBattleSummary(state);
  const display = formatBattleSummary(summary);
  const statsHtml = renderCombatStatsHtml(summary.combatStatsDisplay);
  
  // Return new state with summary
  return {
    ...state,
    phase: 'victory',
    battleSummary: { summary, display, statsHtml }
  };
}
```

### With Render System

```javascript
// In render.js - victory panel rendering
function renderVictoryPanel(state) {
  const { display, statsHtml } = state.battleSummary;
  
  let html = `
    <div class="victory-panel">
      <h1>${display.title}</h1>
      <p>${display.enemyLine}</p>
      <p>${display.xpLine}</p>
      <p>${display.goldLine}</p>
  `;
  
  if (display.hasLoot) {
    html += `<div class="loot-section">`;
    display.lootLines.forEach(line => {
      html += `<p>${line}</p>`;
    });
    html += `</div>`;
  }
  
  if (display.hasLevelUps) {
    html += `<div class="level-up-section">`;
    display.levelUpLines.forEach(line => {
      html += `<p class="level-up">${line}</p>`;
    });
    html += `</div>`;
  }
  
  // Add combat stats if available
  if (statsHtml) {
    html += statsHtml;
  }
  
  html += `</div>`;
  return html;
}
```

### With State Management

```javascript
// Expected state flow
const state = {
  phase: 'combat',
  enemy: { name: 'Giant Spider', hp: 100, maxHp: 100 },
  combatStats: createCombatStats('Giant Spider', false),
  // ... other combat state
};

// During combat, record actions...

// After victory:
const victoryState = {
  ...state,
  phase: 'victory',
  xpGained: 150,
  goldGained: 45,
  lootedItems: ['Health Potion'],
  pendingLevelUps: [{ memberName: 'Hero', newLevel: 5 }]
};

// Create and store summary
const summary = createBattleSummary(victoryState);
```

---

## Styling Reference

### Recommended CSS

```css
.combat-stats-panel {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
}

.combat-stats-panel h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
}

.combat-stats-panel .good {
  color: #4f4;
}

.combat-stats-panel .bad {
  color: #f44;
}

.victory-panel {
  padding: 20px;
  text-align: center;
}

.victory-panel h1 {
  color: #d4af37;
  font-size: 28px;
}

.level-up {
  color: #d4af37;
  font-weight: bold;
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## Related Documentation

- [Combat Stats Tracker API](./combat-stats-tracker-api.md) - Statistics tracking
- [Combat System](./combat-system.md) - Core combat mechanics
- [Render System](./render-system.md) - UI rendering pipeline
- [State Management](./state-management.md) - Game state flow

---

*Documentation written by Claude Opus 4.5 from #voted-out on Day 343*
