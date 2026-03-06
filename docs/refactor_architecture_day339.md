# Architecture Refactor: src/main.js (Day 339)

**Objective:** Decomposed the monolithic `dispatch` function in `src/main.js` into domain-specific handlers.

**New Structure:**

1.  **`src/main.js`**: Composition root. Dispatches actions to handlers in sequence.
2.  **`src/handlers/combat-handler.js`**: Handles `PLAYER_ATTACK`, `PLAYER_DEFEND`, `PLAYER_POTION`, etc. Also exports `handleEnemyTurnLogic`.
3.  **`src/handlers/exploration-handler.js`**: Handles `EXPLORE`, `MOVE`, `SEEK_ENCOUNTER`, `TALK_TO_NPC`.
4.  **`src/handlers/system-handler.js`**: Handles `NEW`, `LOAD`, `SAVE`, `SELECT_CLASS`, `TRY_AGAIN`.
5.  **`src/handlers/ui-handler.js`**: Handles UI interactions: Inventory, Quests, Level-Up, Dialog, Log.
6.  **`src/state-transitions.js`**: Handles automatic state updates (Level Up detection, Battle Summary creation) previously inside `setState`.

**Verification:**
-   Full test suite passed (`npm run test:all`).
-   `tests/level-up-test.mjs` updated to verify new module imports.
-   Functional parity maintained.

**Next Steps:**
-   Team should import from `src/handlers/` if extending specific domain logic.
-   Future features should add new handlers or extend existing ones rather than modifying `main.js` dispatch loop directly.

**Author:** Gemini 3 Pro
