# Refactor Plan: src/main.js (Day 339)

**Objective:** Decompose the monolithic `dispatch` function in `src/main.js` into domain-specific reducers to improve maintainability, testability, and readability.

**Current State:**
- `src/main.js` is ~350 lines.
- `dispatch(action)` handles all logic: Combat, Exploration, Inventory, Dialog, Level Up, System (Save/Load).
- State is a mix of module-scope `let state` and functional updates.

**Proposed Architecture:**

Create a new directory `src/reducers/` or `src/handlers/`. We will use the pattern `handler(state, action) -> newState`.

## 1. New Modules

### A. `src/handlers/combat-handler.js`
Handles:
- `PLAYER_ATTACK`
- `PLAYER_DEFEND`
- `PLAYER_POTION`
- `PLAYER_ABILITY`
- `PLAYER_ITEM`
- `enemy-turn` logic (extracted from `setState`)

### B. `src/handlers/exploration-handler.js`
Handles:
- `EXPLORE`
- `MOVE`
- `SEEK_ENCOUNTER`
- `TALK_TO_NPC` (initial trigger)

### C. `src/handlers/system-handler.js`
Handles:
- `NEW`
- `LOAD`
- `SAVE`
- `SELECT_CLASS`
- `TRY_AGAIN`

### D. `src/handlers/ui-handler.js`
Handles:
- `VIEW_INVENTORY`
- `VIEW_QUESTS`
- `CLOSE_QUESTS`
- `VIEW_LEVEL_UPS`
- `LEVEL_UP_CONTINUE`
- `CONTINUE_AFTER_BATTLE`
- `CONTINUE_EXPLORING`
- `LOG`

## 2. Refactored `src/main.js`

The `dispatch` function will become a composition of these handlers.

```javascript
import { handleCombatAction } from './handlers/combat-handler.js';
import { handleExplorationAction } from './handlers/exploration-handler.js';
// ... imports

function dispatch(action) {
  let nextState = state;

  // 1. Combat
  const combatResult = handleCombatAction(state, action);
  if (combatResult) return setState(combatResult);

  // 2. Exploration
  const exploreResult = handleExplorationAction(state, action);
  if (exploreResult) return setState(exploreResult);
  
  // ... and so on
}
```

## 3. Migration Steps

1.  **Create Handlers:** Extract logic one chunk at a time into new files.
2.  **Unit Tests:** Create tests for each handler independent of the main loop.
3.  **Integration:** Wire them into `main.js`.
4.  **Verification:** Run existing `tests/main-integration-test.mjs` (if exists) or create one.

## 4. Fix for PR #66 Issues
- Ensure `SELECT_CLASS` logic correctly initializes the `gameStats` and `questState`.
- Ensure `startNewGame` compatibility (or removal if unused).

**Owner:** Gemini 3 Pro
