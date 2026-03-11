# Minimap System API Documentation

**Version:** 1.0.0  
**Last Updated:** Day 343  
**Author:** Claude Opus 4.5 (from #voted-out)  
**Source File:** `src/minimap.js` (377 lines)

## Table of Contents

1. [Overview](#overview)
2. [Constants & Configuration](#constants--configuration)
3. [Core API Functions](#core-api-functions)
4. [Room Tracking Functions](#room-tracking-functions)
5. [Rendering Functions](#rendering-functions)
6. [Integration Guide](#integration-guide)
7. [Usage Examples](#usage-examples)

---

## Overview

The Minimap System provides a 3×3 grid UI showing player position, visited rooms, and danger zones. It tracks exploration progress and renders an interactive minimap with tooltips and visual indicators.

### Key Features

- **3×3 Grid Layout:** 9 rooms matching world structure
- **Visit Tracking:** Persistent tracking of explored rooms
- **Danger Levels:** 4-tier danger system (Safe → Very Dangerous)
- **Visual Feedback:** Color-coded cells, icons, and tooltips
- **Serializable State:** Array-based storage for save/load

### Architecture Flow

```
Game Start → initVisitedRooms() → ['center']
      ↓
Player moves → markRoomVisited(visited, row, col)
      ↓
Render cycle → buildMinimapData(worldState, visited)
      ↓
UI update → renderMinimap(worldState, visited) → HTML string
```

---

## Constants & Configuration

### MINIMAP_ROOM_ID_MAP

3×3 grid mapping coordinates to room IDs:

```javascript
export const MINIMAP_ROOM_ID_MAP = [
  ['nw', 'n',      'ne'],   // Row 0
  ['w',  'center', 'e' ],   // Row 1
  ['sw', 's',      'se'],   // Row 2
];
```

**Coordinate System:**
- Row 0 = North, Row 2 = South
- Col 0 = West, Col 2 = East
- (1, 1) = center (Village Square)

### ROOM_NAMES

Display names for each room:

```javascript
export const ROOM_NAMES = {
  nw:     'Northwest Grove',
  n:      'Northern Path',
  ne:     'Northeast Ridge',
  w:      'Western Crossing',
  center: 'Village Square',
  e:      'Eastern Fields',
  sw:     'Southwest Marsh',
  s:      'Southern Road',
  se:     'Southeast Dock',
};
```

### ROOM_DANGER_LEVEL

Danger levels (0-3) per room:

```javascript
export const ROOM_DANGER_LEVEL = {
  center: 0,  // Village Square — safe hub
  n:      1,  // Northern Path — low danger
  w:      1,  // Western Crossing — low danger
  s:      1,  // Southern Road — low danger
  e:      2,  // Eastern Fields — medium danger
  nw:     2,  // Northwest Grove — medium danger
  ne:     2,  // Northeast Ridge — medium danger
  sw:     3,  // Southwest Marsh — high danger
  se:     3,  // Southeast Dock — high danger
};
```

### DANGER_LABELS

Human-readable danger descriptions:

```javascript
export const DANGER_LABELS = {
  0: 'Safe',
  1: 'Low risk',
  2: 'Dangerous',
  3: 'Very dangerous',
};
```

### DANGER_ICONS

Emoji icons for danger levels:

```javascript
export const DANGER_ICONS = {
  0: '🏡',  // Safe
  1: '⚠️',  // Low risk
  2: '☠️',  // Dangerous
  3: '💀',  // Very dangerous
};
```

---

## Core API Functions

### getRoomId(row, col)

Get room ID for grid coordinates.

```javascript
import { getRoomId } from './minimap.js';

const roomId = getRoomId(1, 1);  // 'center'
const invalid = getRoomId(5, 5); // null
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| row | number | Row index (0-2) |
| col | number | Column index (0-2) |

**Returns:** `string | null` - Room ID or null if out of bounds

---

### getCurrentRoomId(worldState)

Get current room ID from world state.

```javascript
import { getCurrentRoomId } from './minimap.js';

const currentRoom = getCurrentRoomId(state.world);
// Returns: 'center', 'nw', etc.
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| worldState | Object | `{ roomRow: number, roomCol: number }` |

**Returns:** `string | null` - Current room ID

---

### getRoomDangerLevel(roomId)

Get numeric danger level for a room.

```javascript
import { getRoomDangerLevel } from './minimap.js';

const danger = getRoomDangerLevel('sw');  // 3 (very dangerous)
const safe = getRoomDangerLevel('center'); // 0 (safe)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| roomId | string | Room identifier |

**Returns:** `number` - Danger level 0-3

---

### getRoomDangerLabel(roomId)

Get human-readable danger description.

```javascript
import { getRoomDangerLabel } from './minimap.js';

const label = getRoomDangerLabel('sw');  // 'Very dangerous'
```

**Returns:** `string` - Danger label

---

### getRoomDangerIcon(roomId)

Get emoji icon for room's danger level.

```javascript
import { getRoomDangerIcon } from './minimap.js';

const icon = getRoomDangerIcon('sw');  // '💀'
const safe = getRoomDangerIcon('center'); // '🏡'
```

**Returns:** `string` - Emoji icon

---

## Room Tracking Functions

### initVisitedRooms(startRow, startCol)

Initialize visited rooms tracking for a new game.

```javascript
import { initVisitedRooms } from './minimap.js';

// Default: start at center (1, 1)
const visited = initVisitedRooms();  // ['center']

// Custom starting position
const visitedNorth = initVisitedRooms(0, 1);  // ['n']
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| startRow | number | 1 | Starting row (0-2) |
| startCol | number | 1 | Starting column (0-2) |

**Returns:** `string[]` - Array with starting room ID

---

### markRoomVisited(visitedRooms, row, col)

Mark a room as visited (on movement).

```javascript
import { markRoomVisited } from './minimap.js';

let visited = ['center'];
visited = markRoomVisited(visited, 0, 1);  // ['center', 'n']
visited = markRoomVisited(visited, 0, 1);  // ['center', 'n'] (no duplicate)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| visitedRooms | string[] | Current visited rooms array |
| row | number | Room row (0-2) |
| col | number | Room column (0-2) |

**Returns:** `string[]` - Updated visited rooms array (no duplicates)

---

### isRoomVisited(visitedRooms, roomId)

Check if a specific room has been visited.

```javascript
import { isRoomVisited } from './minimap.js';

const visited = ['center', 'n', 'e'];
isRoomVisited(visited, 'n');   // true
isRoomVisited(visited, 'sw');  // false
```

**Returns:** `boolean`

---

### getMinimapCellType(roomId, currentRoomId, visitedRooms)

Determine cell display type for rendering.

```javascript
import { getMinimapCellType } from './minimap.js';

const type = getMinimapCellType('center', 'center', ['center']);
// Returns: 'current'

const typeVisited = getMinimapCellType('n', 'center', ['center', 'n']);
// Returns: 'visited'

const typeUnknown = getMinimapCellType('sw', 'center', ['center']);
// Returns: 'unvisited'
```

**Returns:** `'current' | 'visited' | 'unvisited'`

---

## Rendering Functions

### buildMinimapData(worldState, visitedRooms)

Build data structure for rendering all 9 cells.

```javascript
import { buildMinimapData } from './minimap.js';

const cells = buildMinimapData(
  { roomRow: 1, roomCol: 1 },  // At center
  ['center', 'n']              // Visited center and north
);

// Returns array of 9 cell objects
cells.forEach(cell => {
  console.log(cell);
});
```

**Returns:** Array of cell data objects:

```javascript
{
  row: 0,                      // Grid row (0-2)
  col: 1,                      // Grid column (0-2)
  roomId: 'n',                 // Room identifier
  roomName: 'Northern Path',   // Display name
  cellType: 'visited',         // 'current' | 'visited' | 'unvisited'
  danger: 1,                   // Danger level (0-3)
  dangerLabel: 'Low risk',     // Danger description
  dangerIcon: '⚠️',            // Danger emoji
  isCurrent: false,            // Is player here?
  isVisited: true,             // Has been explored?
}
```

---

### getMinimapStyles()

Get CSS styles for minimap rendering (inject once).

```javascript
import { getMinimapStyles } from './minimap.js';

// Add to document once
const styleEl = document.createElement('style');
styleEl.textContent = getMinimapStyles();
document.head.appendChild(styleEl);
```

**Returns:** `string` - Complete CSS for minimap classes

**CSS Classes Provided:**
| Class | Description |
|-------|-------------|
| .minimap-card | Container card |
| .minimap-grid | 3×3 grid layout |
| .minimap-cell | Individual cell |
| .minimap-cell.current | Player's current room |
| .minimap-cell.visited | Explored room |
| .minimap-cell.unvisited | Unexplored room |
| .minimap-cell-abbr | Room abbreviation |
| .minimap-danger-icon | Danger emoji |
| .minimap-player | Player marker (🧍) |
| .minimap-legend | Legend bar |
| .minimap-room-info | Current room info |

---

### renderMinimap(worldState, visitedRooms)

Render complete minimap as HTML string.

```javascript
import { renderMinimap } from './minimap.js';

const html = renderMinimap(
  { roomRow: 1, roomCol: 1 },
  ['center', 'n', 'e']
);

document.getElementById('minimap-container').innerHTML = html;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| worldState | Object | `{ roomRow, roomCol }` |
| visitedRooms | string[] | Array of visited room IDs |

**Returns:** `string` - Complete HTML for minimap card

**Rendered Features:**
- 3×3 grid with colored cells
- Player marker (🧍) on current cell
- Danger icons on visited cells
- Room abbreviations (e.g., "NG" for Northwest Grove)
- Tooltips on hover
- Visit count (e.g., "3/9")
- Current room name and danger badge
- Legend for cell types

---

## Integration Guide

### Initial Setup

```javascript
import { initVisitedRooms, getMinimapStyles } from './minimap.js';

function initGame() {
  // Inject styles once
  const style = document.createElement('style');
  style.textContent = getMinimapStyles();
  document.head.appendChild(style);
  
  // Initialize state
  return {
    world: { roomRow: 1, roomCol: 1 },
    visitedRooms: initVisitedRooms(1, 1)
  };
}
```

### Movement Integration

```javascript
import { markRoomVisited, getRoomId } from './minimap.js';

function handleMove(state, direction) {
  const { roomRow, roomCol } = state.world;
  let newRow = roomRow, newCol = roomCol;
  
  switch (direction) {
    case 'north': newRow--; break;
    case 'south': newRow++; break;
    case 'west':  newCol--; break;
    case 'east':  newCol++; break;
  }
  
  // Validate bounds
  if (newRow < 0 || newRow > 2 || newCol < 0 || newCol > 2) {
    return state; // Can't move there
  }
  
  return {
    ...state,
    world: { roomRow: newRow, roomCol: newCol },
    visitedRooms: markRoomVisited(state.visitedRooms, newRow, newCol)
  };
}
```

### Render Integration

```javascript
import { renderMinimap } from './minimap.js';

function updateUI(state) {
  const minimapHtml = renderMinimap(state.world, state.visitedRooms);
  document.getElementById('minimap').innerHTML = minimapHtml;
}
```

### Save/Load Integration

```javascript
// Saving - visitedRooms is already an array
const saveData = {
  ...state,
  visitedRooms: state.visitedRooms
};
localStorage.setItem('save', JSON.stringify(saveData));

// Loading
const loaded = JSON.parse(localStorage.getItem('save'));
const state = {
  ...loaded,
  visitedRooms: loaded.visitedRooms || initVisitedRooms()
};
```

---

## Usage Examples

### Example 1: Exploration Progress Display

```javascript
import { buildMinimapData, ROOM_NAMES } from './minimap.js';

function getExplorationProgress(worldState, visitedRooms) {
  const cells = buildMinimapData(worldState, visitedRooms);
  const visited = cells.filter(c => c.isVisited);
  const unvisited = cells.filter(c => !c.isVisited);
  
  return {
    percentage: Math.round((visited.length / 9) * 100),
    visited: visited.map(c => c.roomName),
    remaining: unvisited.map(c => ROOM_NAMES[c.roomId])
  };
}

// Example output:
// { percentage: 44, visited: ['Village Square', 'Northern Path', ...], remaining: [...] }
```

### Example 2: Danger Warning System

```javascript
import { getRoomId, getRoomDangerLevel, getRoomDangerLabel, DANGER_ICONS } from './minimap.js';

function getAdjacentDangers(roomRow, roomCol) {
  const directions = [
    { name: 'North', dr: -1, dc: 0 },
    { name: 'South', dr: 1, dc: 0 },
    { name: 'West', dr: 0, dc: -1 },
    { name: 'East', dr: 0, dc: 1 }
  ];
  
  return directions.map(dir => {
    const newRow = roomRow + dir.dr;
    const newCol = roomCol + dir.dc;
    const roomId = getRoomId(newRow, newCol);
    
    if (!roomId) return null;
    
    const danger = getRoomDangerLevel(roomId);
    return {
      direction: dir.name,
      danger,
      label: getRoomDangerLabel(roomId),
      icon: DANGER_ICONS[danger],
      warning: danger >= 2 ? `⚠️ ${dir.name} is dangerous!` : null
    };
  }).filter(Boolean);
}
```

### Example 3: Quest Integration

```javascript
import { isRoomVisited, ROOM_NAMES } from './minimap.js';

function checkExplorationQuest(questState, visitedRooms) {
  const quest = questState.activeQuests.find(q => q.type === 'explore');
  if (!quest) return null;
  
  const targetRooms = quest.targets; // e.g., ['sw', 'se']
  const visitedTargets = targetRooms.filter(r => isRoomVisited(visitedRooms, r));
  
  return {
    questName: quest.name,
    progress: `${visitedTargets.length}/${targetRooms.length}`,
    complete: visitedTargets.length === targetRooms.length,
    remaining: targetRooms
      .filter(r => !isRoomVisited(visitedRooms, r))
      .map(r => ROOM_NAMES[r])
  };
}
```

### Example 4: Custom Minimap Tooltips

```javascript
import { buildMinimapData, getCurrentRoomId } from './minimap.js';

function buildEnhancedTooltips(worldState, visitedRooms, encounterData) {
  const cells = buildMinimapData(worldState, visitedRooms);
  
  return cells.map(cell => {
    if (cell.cellType === 'unvisited') {
      return { ...cell, tooltip: 'Unexplored territory' };
    }
    
    const encounters = encounterData[cell.roomId] || [];
    const bossPresent = encounters.some(e => e.isBoss);
    const questAvailable = encounters.some(e => e.hasQuest);
    
    let tooltip = `${cell.roomName} — ${cell.dangerLabel}`;
    if (bossPresent) tooltip += ' [BOSS]';
    if (questAvailable) tooltip += ' [QUEST]';
    
    return { ...cell, tooltip };
  });
}
```

---

## World Layout Reference

```
     Col 0        Col 1        Col 2
    ┌─────────┬─────────┬─────────┐
Row │   NW    │    N    │   NE    │
 0  │ ☠️ Grove│ ⚠️ Path │ ☠️ Ridge│
    ├─────────┼─────────┼─────────┤
Row │    W    │ CENTER  │    E    │
 1  │⚠️ Cross │🏡Village│ ☠️Fields│
    ├─────────┼─────────┼─────────┤
Row │   SW    │    S    │   SE    │
 2  │💀 Marsh │ ⚠️ Road │ 💀 Dock │
    └─────────┴─────────┴─────────┘

Danger Levels:
🏡 Safe (0)        - center only
⚠️ Low risk (1)    - n, w, s
☠️ Dangerous (2)   - e, nw, ne
💀 Very dangerous (3) - sw, se
```

---

## Testing Reference

Related test files:
- `tests/minimap-test.mjs` - Core minimap logic tests
- `tests/minimap-import-test.mjs` - Import validation

Key test scenarios:
1. getRoomId returns correct IDs for all coordinates
2. getRoomId returns null for out-of-bounds
3. initVisitedRooms includes starting room
4. markRoomVisited adds new rooms without duplicates
5. isRoomVisited returns correct boolean
6. getMinimapCellType classifies correctly
7. buildMinimapData returns 9 cells with correct data
8. Danger levels match expected values

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Day 343 | Initial documentation |

---

*Documentation generated from #voted-out by Claude Opus 4.5*
