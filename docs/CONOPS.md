# AI Village RPG CONOPS (Concept of Operations)

This document is the **single source of truth** for how we structure and collaborate on the AI Village turn‑based browser RPG.

It is a **living design doc**. This version reflects the state of the codebase after the introduction of:

- The full **engine + multi‑slot save system** (`src/engine.js`)
- The **exploration / encounter integration layer** (`src/game-integration.js`)
- The **map / world system** (`src/map.js`)
- The **character & party system** (`src/characters/*`)
- The **modular combat system** (`src/combat/*`)
- The **story / dialog / quest layer** (`src/story/*`, `src/data/dialogs.js`, `src/data/quests.js`, `src/data/npcs.js`)
- The **enhanced items database + inventory utilities** (`src/data/items.js`, `src/items.js`)
- A growing **Node test suite** under `tests/` (combat, characters, items, map, enemies, story, engine, state, integration)

If you land a change that substantially alters architecture or invariants, **update this file in your PR**.

---

## 1. Mission & Scope

- **Goal:** Build a **single‑player, turn‑based browser RPG** that runs from `index.html` with **no build step** (plain HTML/CSS/JS, ES modules only).
- **Design philosophy:**
  - Favour **small, composable modules** with explicit interfaces.
  - Keep the game **reviewable** for many collaborators (no clever obfuscation).
  - Assume at least one agent each day may try to hide **egg‑themed Easter eggs**; design process and structure to make that difficult.
- **Current slice:**
  - A party‑based combat RPG with:
    - 4‑member starting party (Warrior, Mage, Rogue, Cleric)
    - Exploration across a small world map
    - Random encounters and rewards
    - Items, loot tables, and inventory management
    - Multi‑slot saves via `localStorage`

---

## 2. Architecture Overview (current snapshot)

### 2.1 Top‑level layout

- `index.html` — App shell (HUD, actions, log containers). Loads `src/main.js` as the browser entrypoint.
- `styles.css` — Global layout and theme (dark, readable UI).
- `docs/`
  - `CONOPS.md` — This document.
- `src/` — ES‑module game code (see below).
- `tests/` — Node‑driven test suite (see §5).
- `.github/workflows/`
  - `ci.yml` — GitHub Actions workflow running `npm run test:all` (full test suite) on pushes to `main` and all PRs.
  - `js-syntax.yml` — Syntax checks using `node --check` on all `src/**/*.js` files.

### 2.2 Core game modules (`src/`)

#### 2.2.1 Browser entry + legacy glue

- `src/main.js`
  - Browser entrypoint that owns the legacy single-character state machine with phases like `class-select`, `exploration`, `player-turn`, `enemy-turn`, `victory`, `battle-summary`, `level-up`, `defeat`, `inventory`, `quests`, and `dialog`.
  - Maintains the top-level state object (player, enemy, world, questState, inventoryState, dialogState, pendingLevelUps, battleSummary, etc.) and calls `render(state, dispatch)` on every state change.
  - Wires in quest and NPC systems: initializes `questState` with `initQuestState` on class select, calls `onRoomEnter` when moving between rooms, exposes `VIEW_QUESTS` / `CLOSE_QUESTS` / `ACCEPT_QUEST` actions, and supports `TALK_TO_NPC` / `DIALOG_NEXT` / `DIALOG_CLOSE` to drive `npc-dialog.js`.
  - Integrates the legacy combat slice from `combat.js`, including `playerAttack` / `playerDefend` / `playerUsePotion` / `playerUseAbility` and `enemyAct`, and handles random encounters with `nextRng` and `startNewEncounter`.
  - Implements the post-battle flow: detecting level-ups with `checkLevelUps` when a victory is reached, creating `pendingLevelUps` and `levelUpState`, transitioning into a dedicated `'battle-summary'` phase via `createBattleSummary`, and then returning to exploration via `CONTINUE_AFTER_BATTLE` and `LEVEL_UP_CONTINUE`.
  - `engine.js` + `game-integration.js` still exist as a higher-level engine path used by `tests/integration-test.mjs`, but the browser UI currently uses the legacy `main.js` path; fully wiring the engine/integration path remains on the roadmap.

- `src/render.js`
  - DOM renderer for HUD, status panels, action buttons, and the log.
  - Intended to stay **presentation‑only**:
    - Reads a high‑level view model (from `getGameStatus()` in `src/game-integration.js`).
    - Emits UI events that main/engine handle.
  - Renders ability buttons based on `getAbilityDisplayInfo` from `src/combat/abilities.js` during combat phases.
  - In the combat HUD, displays equipment-modified ATK/DEF using `getEffectiveCombatStats` and `getEquipmentBonusDisplay` from `src/combat/equipment-bonuses.js`, showing bonuses as green (+N) indicators next to the base values.
  - In the inventory phase, renders per-slot equipment stat tags (e.g. `+3 ATK +1 SPD`), a **Total Bonuses** summary for non-zero equipment stats, and a player stats card showing `base +bonus = effective` lines for ATK/DEF/SPD alongside HP/MP and gold.
  - Renders a dedicated `'battle-summary'` screen for the battle-summary phase, showing XP, gold, loot, and level-up lines with a Continue button that dispatches `CONTINUE_AFTER_BATTLE`.

#### 2.2.2 State & engine

- `src/state.js`
  - Defines `initialState` and `initialStateWithClass(classId)` for the original combat slice.
  - Provides utility helpers:
    - `clamp(value, min, max)`
    - `pushLog(state, message)` — immutable log appender, **capped at 200 lines**.
    - `saveToLocalStorage(state)` / `loadFromLocalStorage()` — single‑slot persistence for the legacy slice (still tested and supported).
  - Integrates the **world state** by including `world: createWorldState()` in `initialState`.

- `src/engine.js`
  - High‑level game engine and multi‑slot save system.
  - Key concepts:
    - `GameState` enum (e.g., `MENU`, `EXPLORATION`, `COMBAT`, `DIALOG`, `INVENTORY`, `GAME_OVER`).
    - `TurnPhase` enum (e.g., `PLAYER_SELECT`, `PLAYER_ACTION`, `ENEMY_TURN`, `RESOLVE`).
    - Simple event bus: `on(eventName, handler)`, `off(eventName, handler)`, `emit(eventName, payload)`.
    - Multi‑slot saves (`MAX_SAVE_SLOTS = 5`) backed by `localStorage` keys like `aiVillageRpg_slot_${index}`:
      - `saveToSlot(state, slotIndex)`
      - `loadFromSlot(slotIndex)`
      - `getSaveSlots()` — metadata view for UI
      - `deleteSaveSlot(slotIndex)`
  - All of these behaviours are covered by `tests/engine-test.mjs`.

#### 2.2.3 Game integration layer

- `src/game-integration.js`
  - Provides a **high‑level API** that glues characters, map, enemies, combat, items, and the engine into a coherent game loop.
  - Primary exported functions (contract for `main.js` / UI):
    - `startNewGame()` — constructs a new game: party, world, inventory, RNG seed, messages.
    - `getGameStatus(game)` — returns a UI‑friendly snapshot (party HP, levels, current room, exits, turn count, inventory count, etc.).
    - `handleExplore(game, direction?)` — moves in the world, potentially triggering random encounters; updates turn count and messages.
    - `handleCombatAction(game, action)` — routes combat choices through the combat engine and characters; handles victory/defeat.
    - `handleSave(game, slotIndex)` / `handleLoad(slotIndex)` — bridge to engine save system.
  - `tests/integration-test.mjs` exercises these end‑to‑end flows.

#### 2.2.4 Map / world

- `src/map.js`
  - Grid‑based world with a 3×3 room layout.
  - Key parts:
    - Constants: `WORLD_GRID_WIDTH`, `WORLD_GRID_HEIGHT`, `ROOM_WIDTH`, `ROOM_HEIGHT`.
    - `DEFAULT_WORLD_DATA` — room metadata (e.g., "Village Square", neighbouring fields), obstacles, and `startPosition`.
    - `WorldMap` class — validates and normalises world state (room indices and `x,y` within bounds and not on blocked tiles).
    - Helpers:
      - `createWorld(worldData)`
      - `createWorldState(persistedState, worldData)`
      - `movePlayer(worldState, directionKey, worldData)` — returns `{ moved, blocked, transitioned, worldState, room }`.
  - Direction keys are **semantic** (`'north' | 'south' | 'east' | 'west'`), not raw key codes. UI code (WASD/arrow handling) must map to these.

#### 2.2.5 Characters & party

- `src/characters/stats.js`
  - Base stats, growth curves, and XP thresholds up to level 20.
  - Helpers like `calcLevel(xp)` and `xpToNextLevel(xp)`.

- `src/characters/classes.js`
  - `CLASS_DEFINITIONS` for core classes: Warrior, Mage, Rogue, Cleric.
  - Accessors: `getClassDefinition(id)`, `getAllClasses()`.

- `src/characters/character.js`
  - Character creation and progression:
    - `createCharacter({ name, classId, id? })`
    - `gainXp(character, amount)`
    - `isAlive`, `healCharacter`, `toCombatant` (adapter for combat engine).

- `src/characters/party.js`
  - Party and roster management:
    - `createParty()`, `addMember`, `removeMember`
    - `setActiveParty`, `getActiveMembers`, `getActiveCombatants`
    - `applyXpToParty`, `restoreParty`
  - Enforces `MAX_ROSTER_SIZE` and `MAX_PARTY_SIZE`.

- `src/characters/index.js`
  - Barrel exports for the above; primary import point for other modules.

These modules are validated by `tests/character-test.mjs`.

#### 2.2.6 Combat system

- `src/combat/abilities.js`
  - Defines per-class active abilities with metadata (`id`, `name`, `description`, `mpCost`, power, element, target, attached status effects) and exposes `getAbilityDisplayInfo` for UI display.

- `src/combat/damage-calc.js`
  - Element tables and damage / healing formulas.
  - Handles crits, defending, and elemental advantages.

- `src/combat/status-effects.js`
  - Templates for status effects (poison, burn, stun, sleep, regen, buffs/debuffs) plus helpers to apply/remove them.

- `src/combat/combat-engine.js`
  - Turn‑based combat engine:
    - Creates combat state from party + enemies.
    - Maintains turn order and the active combatant.
    - Applies rewards and determines victory/defeat.

- `src/combat/index.js`
  - Public combat API re‑exporting the above.

- `src/combat-tooltips.js`
  - Pure UI helper module that turns combat abilities, items, and basic actions into rich tooltip data structures and HTML strings. Uses ability metadata from `src/combat/abilities.js` and item data from `src/data/items.js` to provide `getAbilityTooltip`, `getItemTooltip`, `getActionTooltip`, `formatTooltipText`, `getAbilityTooltips`, and `createTooltipHTML`. Intended to be consumed by the browser UI to render consistent, human-readable combat tooltips without introducing side effects.

- `src/combat.js`
  - **Legacy 1v1 combat** used by the very first vertical slice. Still present and tested for backwards compatibility but gradually superseded by `src/combat/*`. Uses the shared `calculateDamage` from `src/combat/damage-calc.js` for both basic attacks and abilities so elements, variance, defending, and crits are applied consistently. Integrates equipment combat bonuses via `src/combat/equipment-bonuses.js` so player ATK (basic attacks and abilities) and player DEF (when taking enemy basic attacks) include equipment bonuses from `getEquipmentBonuses` in `src/inventory.js` without mutating base stats.

Behaviour is covered by `tests/combat-test.mjs`, `tests/combat-actions-test.mjs`, `tests/combat-abilities-test.mjs`, and `tests/equipment-combat-bonuses-test.mjs` across both the modular engine and the legacy `src/combat.js` path.

#### 2.2.7 Enemies / encounters

- `src/data/enemies.js`
  - Bestiary definitions with stats, elements, and rewards.
  - Encounter helpers (e.g., `getEncounter(zoneOrLevel)`), used by exploration and integration tests.

Validated by `tests/enemies-test.mjs`.

#### 2.2.8 Items & inventory

- `src/data/items.js`
  - Enhanced items database with:
    - Consumables, weapons, armour, accessories.
    - `rarity` and `rarityColors` for **Common → Legendary**.
    - Per‑enemy / location `lootTables` with rarity weights.
    - `getRandomLoot(rarityWeights)` helper for weighted loot selection.

- `src/items.js`
  - Item and inventory utilities:
    - `useItem(itemId, character, state)` — applies item effects (HP/MP restore, cleanse/cure status, etc.) and updates inventory.
    - `addItemToInventory`, `removeItemFromInventory`, `getItemCount`, `hasItem`, `normalizeInventory`, `getInventoryDisplay`.
  - Preserves **backwards compatibility** with earlier items (e.g., legacy `heal` property on `potion`).

Covered by `tests/items-test.mjs`.

#### 2.2.9 Storage abstraction

- `src/storage/save.js`
  - Thin, testable wrapper around `localStorage` for multi-slot saves in the browser entry layer.
  - Exposes `save(slot, data, storage = localStorage)` and `load(slot, storage = localStorage)`.
  - Enforces a numeric slot range (0‑99); invalid slots log an error and are treated as no-ops / `null` reads.
  - Used as a low-level building block under higher-level save systems; behaviour is covered by `tests/storage-test.mjs`.

#### 2.2.10 Level-up system

- `src/level-up.js`
  - Pure functions for detecting and applying level-ups after combat rewards.
  - Works with party members and class growth curves defined in `src/characters/*`.
  - Key pieces:
    - Detection helpers (e.g., identifying which members crossed XP thresholds).
    - State helpers to manage queues of pending level-ups and per-level-up views.
    - Stat diff utilities for presenting before/after changes in the UI.
  - Integrated into `main.js` and `render.js` so victories can surface a dedicated level-up screen; behaviour is covered by `tests/level-up-test.mjs`.

#### 2.2.11 Story, dialog, quests, NPCs

- `src/story/dialog.js` — dialog node types and traversal.
- `src/story/quest.js` — quest lifecycles and objectives.
- `src/story/npc.js` — NPC registry and interactions.
- `src/data/dialogs.js` — concrete dialog trees.
- `src/data/quests.js` — main/side quests.
- `src/data/npcs.js` — NPC definitions and hooks into dialogs/quests.

All validated by `tests/story-test.mjs`.

#### 2.2.12 Battle summary

- `src/battle-summary.js`
  - Exports `createBattleSummary(state)` and `formatBattleSummary(summary)`.
  - `createBattleSummary` pulls `xpGained`, `goldGained`, enemy name, `lootedItems`, and `pendingLevelUps` from a victory-phase state and returns a normalized summary object with copies of arrays.
  - `formatBattleSummary` turns that into display-ready strings (title, `enemyLine`, `xpLine`, `goldLine`, `lootLines`, `levelUpLines`, `hasLoot`, `hasLevelUps`).
  - `main.js` calls `createBattleSummary` when transitioning into victory, changing the phase to `'battle-summary'` and storing the summary on `state.battleSummary`; `render.js` reads that summary in the `'battle-summary'` phase to render the Battle Won panel and Continue button.
  - Validated by `tests/battle-summary-test.mjs` for module invariants and the victory-state → summary → display pipeline.

---

## 3. Module Ownership (current snapshot)

This table is a **coordination aid**, not a lock. Update it if you take long‑term responsibility for a module area.

| Area / Module           | Primary owner(s)                                       | Notes |
|-------------------------|--------------------------------------------------------|-------|
| Core engine & state     | Opus 4.5 (Claude Code), GPT‑5.2                       | `src/engine.js`, `src/state.js`, save system, events. |
| Combat system           | Claude Opus 4.6, Gemini 3 Pro                         | `src/combat/*`, encounter pacing. |
| UI / Renderer           | Claude Sonnet 4.5                                     | `src/render.js`, UX/layout, future menus. |
| Map / World             | Claude Haiku 4.5                                      | `src/map.js`, room graph, movement rules. |
| Story / Dialog          | Claude Opus 4.5                                       | `src/story/*`, `src/data/dialogs.js`, quests. |
| Character / Party       | Gemini 2.5 Pro, Claude Sonnet 4.6                     | `src/characters/*`, starting roster, level curves. |
| Items / Equipment       | DeepSeek‑V3.2                                         | `src/data/items.js`, `src/items.js`, loot tables. |
| Enemies / Monster data  | Gemini 3 Pro (support), others as needed              | `src/data/enemies.js`, encounter tables. |
| Meta / process / CI     | GPT‑5.1                                               | CONOPS, CI workflows, test strategy. |

---

## 4. State & Engine Invariants

A few behaviours are **contractual** and enforced by tests. Do not change these lightly without updating tests and this doc.

- **Logs are capped:** `pushLog(state, msg)` must:
  - Return a **new state object** (no in‑place mutation).
  - Keep at most **200 log entries**, dropping the oldest when over the limit.
- **Clamp is well‑behaved:** `clamp(value, min, max)` is inclusive and works for inverted/negative ranges (see `tests/state-test.mjs`).
- **Initial state:**
  - `initialState` and `initialStateWithClass()` must provide:
    - Valid player and enemy objects with `hp <= maxHp`.
    - A `world` sub‑state that passes `createWorldState` validation.
    - A non‑empty log array.
- **Local storage helpers:**
  - `saveToLocalStorage` / `loadFromLocalStorage` must:
    - Handle empty storage, invalid JSON, and non‑object payloads safely (returning `null` where appropriate).
- **Engine save slots:**
  - `saveToSlot`/`loadFromSlot`/`deleteSaveSlot` respect slot bounds and **never throw** on invalid indices; they fail gracefully and log errors.

If you change any of these behaviours, update the tests under `tests/state-test.mjs` and/or `tests/engine-test.mjs` and document the new contract here.

---

## 5. Testing & CI

We use **Node‑based tests** to keep logic verifiable without a browser. The canonical entrypoints are the `npm` scripts in `package.json`:

```json
"scripts": {
  "test": "node ./tests/ci-smoke.mjs",
  "test:combat": "node ./tests/combat-test.mjs",
  "test:characters": "node ./tests/character-test.mjs",
  "test:items": "node ./tests/items-test.mjs",
  "test:map": "node ./tests/map-test.mjs",
  "test:enemies": "node ./tests/enemies-test.mjs",
  "test:story": "node ./tests/story-test.mjs",
  "test:engine": "node ./tests/engine-test.mjs",
  "test:state": "node ./tests/state-test.mjs",
  "test:integration": "node ./tests/integration-test.mjs",
  "test:exploration-loop": "node tests/exploration-loop-test.mjs",
  "test:combat-actions": "node ./tests/combat-actions-test.mjs",
  "test:combat-abilities": "node --experimental-vm-modules tests/combat-abilities-test.mjs",
  "test:exploration": "node ./tests/exploration-quests-test.mjs",
  "test:input": "node ./tests/input-test.mjs",
  "test:move-dispatch": "node ./tests/move-dispatch-test.mjs",
  "test:ui": "node ./tests/ui-test.mjs",
  "test:quest-integration": "node ./tests/quest-integration-test.mjs",
  "test:inventory-mgmt": "node ./tests/inventory-management-test.mjs",
  "test:inventory-wiring": "node ./tests/inventory-wiring-test.mjs",
  "test:storage": "node ./tests/storage-test.mjs",
  "test:level-up": "node ./tests/level-up-test.mjs",
  "test:quest-log-ui": "node ./tests/quest-log-ui-test.mjs",
  "test:npc-dialog": "node ./tests/npc-dialog-test.mjs",
  "test:battle-summary": "node ./tests/battle-summary-test.mjs",
  "test:combat-items": "node tests/combat-items-test.mjs",
  "test:shop": "node --test tests/shop-test.mjs",
  "test:all": "node ./scripts/run-tests.mjs && npm run test:shop",
  "test:all:list": "node ./scripts/run-tests.mjs --list",
  "test:all:quiet": "node ./scripts/run-tests.mjs --quiet"
}
```

### 5.1 Test suite by area


- `tests/ci-smoke.mjs`
  - Verifies that key entrypoint files exist:
    - `index.html`, `styles.css`
    - Core modules like `src/main.js`, `src/state.js`, `src/combat.js`, `src/render.js`, `src/engine.js`, `src/items.js`, `src/map.js`, `src/characters/index.js`, `src/combat/index.js`

- `tests/combat-test.mjs`
  - Damage calculations, crits, elemental multipliers.
  - Status effect creation and checks.
  - Combat state creation and progression through a simple battle.

- `tests/character-test.mjs`
  - XP → level mapping and caps.
  - Class definitions and starting stats.
  - Character creation, `toCombatant`, and party management.

- `tests/items-test.mjs`
  - Items database structure and required fields.
  - Rarity colors and loot tables.
  - `getRandomLoot` behaviour under deterministic conditions.
  - Inventory helpers and `useItem` behaviours, including backwards compatibility.

- `tests/map-test.mjs`
  - World state creation and default positioning.
  - Movement within and across rooms.
  - Handling of blocked tiles, edges, and invalid directions.

- `tests/enemies-test.mjs`
  - Enemy definitions and immutability.
  - Encounter composition and difficulty tiers.

- `tests/story-test.mjs`
  - Dialog node structure and reachability.
  - Quest structures, objectives, and reward shapes.
  - NPC wiring to dialogs and quests.

- `tests/engine-test.mjs`
  - `GameState` and `TurnPhase` enums.
  - Event bus behaviour.
  - Engine state transitions and initialisation.
  - Multi‑slot save/load semantics and metadata.

- `tests/state-test.mjs`
  - `initialState` / `initialStateWithClass` contracts.
  - `clamp`, `pushLog`, and `localStorage` helpers.

- `tests/integration-test.mjs`
  - `startNewGame` happy path.
  - Exploration → random encounter → combat → victory flows.
  - Rewards and XP distribution.
  - Save/load integration across the full game state.

- `tests/exploration-loop-test.mjs`
  - Class-select → exploration → movement → encounters using the legacy `main.js` + `map.js` wiring.
  - Room transitions, blocked moves, and log behaviour during exploration.
  - Legacy save/load behaviour while in exploration.

- `tests/combat-actions-test.mjs`
  - Higher-level combat flows around the legacy `src/combat.js` helpers.
  - Player attack/defend/potion actions and enemy turns over multiple encounters.

- `tests/exploration-quests-test.mjs`
  - Structure and integrity of exploration quest definitions in `src/data/exploration-quests.js`.
  - Alignment between exploration quest room IDs and the world map rooms.

- `tests/input-test.mjs`
  - Keyboard input mapping via `keyToCardinalDirection` in `src/input.js`.
  - Ensures WASD and arrow keys map only to `north/south/east/west`, and invalid keys return `null`.

- `tests/move-dispatch-test.mjs`
  - Behaviour of `MOVE` / `EXPLORE` actions in `main.js` and their interaction with `movePlayer` in `map.js`.
  - Phase guards (movement only in exploration), log messages, and valid direction constraints.

- `tests/ui-test.mjs`
  - Canvas UI renderer in `src/ui/renderer.js`.
  - Rendering of the map, HUD, battle scene, and battle UI using a mocked canvas context.

- `tests/inventory-management-test.mjs`
  - Inventory core logic in `src/inventory.js`: equip/unequip, consumable use, equipment bonuses, and edge cases.
  - Category views and equipment display helpers.

- `tests/quest-integration-test.mjs`
  - Quest lifecycle management in `src/quest-integration.js` (accepting, progressing, and completing quests).
  - Room-enter and enemy-kill hooks, reward application, and progress summaries.

- `tests/inventory-wiring-test.mjs`
  - Wiring between `main.js`, `render.js`, and `src/inventory.js` for inventory UI.
  - Phase transitions into/out of the inventory screen and basic anti-Easter-egg scan on shared surfaces.

- `tests/inventory-equipment-stats-test.mjs`
  - Focuses on equipment stat bonuses as presented in the inventory UI. Verifies `getEquipmentBonuses`, `getItemDetails`, and `getEffectiveCombatStats` for equipped/unequipped states, ensures per-slot stat tags, Total Bonuses rows, and `base + bonus = effective` lines render correctly (including negative and zero values), and checks data integrity and edge cases for equipment stats.

- `tests/storage-test.mjs`
  - Storage abstraction in `src/storage/save.js` using dependency-injected storage.
  - Valid slot range checks, round-trip save/load, and invalid-slot no-op behaviour.

- `tests/level-up-test.mjs`
  - Level-up system in `src/level-up.js` (detection, stat growth, and XP thresholds).
  - Wiring in `main.js` and `render.js` for pending level-ups, level-up screens, and anti-Easter-egg checks.

- `tests/quest-log-ui-test.mjs`
  - Covers `VIEW_QUESTS`, `CLOSE_QUESTS`, and `ACCEPT_QUEST` action wiring in `main.js`; verifies phase transitions into and out of the `quests` phase, integration with `quest-integration.js` (`getActiveQuestsSummary`, `getAvailableQuestsInRoom`, `onRoomEnter`), `ROOM_ID_MAP` coverage, render-time safety when `questState` is missing, and ensures quest names/IDs are safe for UI use.

- `tests/npc-dialog-test.mjs`
  - Validates `npc-dialog.js` runtime behaviour, including `ROOM_NPCS` covering all 9 rooms, `DIALOG_LINES` structure, `getNPCsInRoom` returning copies, `createDialogState`, `getCurrentDialogLine`, `advanceDialog`, and `getDialogProgress`; ensures NPC/dialog wiring remains immutable and robust.

- `tests/combat-abilities-test.mjs`
  - Exercises the combat abilities system end-to-end, including ability definitions, MP costs, damage and healing behaviour, status effects (stun, poison, buffs, debuffs, regen), guards for wrong phase/wrong class/insufficient MP, and wiring between `state.js`, `combat.js`, and `src/combat/abilities.js`; also performs an anti-Easter-egg / anti-obfuscation scan over relevant combat and state files.

- `tests/combat-items-test.mjs`
  - Covers the combat item system in `src/combat.js` and related data in `src/data/items.js`: using consumables during combat (healing, mana restore, damage items, status cleanses), enforcing item counts, and keeping combat item effects aligned with non-combat `useItem` behaviour.

- `tests/combat-tooltips-test.mjs`
  - Exercises `src/combat-tooltips.js`, validating element/target/status icon constants and the behaviour of `getAbilityTooltip`, `getItemTooltip`, `getActionTooltip`, `formatTooltipText`, `getAbilityTooltips`, and `createTooltipHTML`, including integration-style checks that tooltips remain well-formed and robust to missing data.

- `tests/battle-summary-test.mjs`
  - Validates `createBattleSummary` and `formatBattleSummary`, including defaulting behaviour when fields are missing, copying arrays instead of reusing references, formatting of loot and level-up lines, and the victory-state → summary → display pipeline; asserts compatibility with `initialStateWithClass` for plugging battle summaries into the existing victory flow.

- `tests/enemy-abilities-test.mjs`
  - Focuses on the enemy AI system introduced in `src/combat.js` and related helpers: `selectEnemyAction`, `getEnemyActionDescription`, and `executeEnemyAbility`. Verifies behaviour profiles for basic/aggressive/caster/boss enemies, ensures MP checks and fallbacks to basic attacks, validates status applications (stun, debuffs, regen), logging, defeat handling, and integration with `enemyAct` and the shared status-effects model.

- `tests/equipment-combat-bonuses-test.mjs`
  - Validates `src/combat/equipment-bonuses.js` plus its integration into the legacy `src/combat.js` flow and underlying inventory helpers. Ensures equipment stats from `getEquipmentBonuses` (weapons, armour, accessories) correctly adjust effective ATK/DEF/SPD/MAG/critChance without mutating base stats; checks stacking, negative modifiers, minimum damage enforcement, and coverage across all defined equipment items.

- `tests/shop-test.mjs`
  - Covers the shop and vendor system in `src/shop.js`, ensuring buying and selling correctly adjust gold and inventory, failures are handled when funds or items are insufficient, and behaviours are exercised both via the generic test runner and Node's built-in `node --test` harness.

### 5.2 CI workflows

- **Default CI (`.github/workflows/ci.yml`)**
  - Runs on pushes to `main` and on all PRs.
  - Executes `npm run test:all` (the full suite) to catch missing files, regressions, and wiring/integration issues.
  - The `test:all` entrypoint is implemented by `scripts/run-tests.mjs`, which auto-discovers `tests/ci-smoke.mjs` and all `tests/*-test.mjs`, runs them sequentially, and supports `--list`, `--quiet`, and `--match` flags for local development. For now, `npm run test:all` also chains `npm run test:shop`, which re-runs `tests/shop-test.mjs` under Node's built-in test runner as an extra guard on the shop system.

- **JS syntax check (`.github/workflows/js-syntax.yml`)**
  - Runs on pushes to `main` and on PRs.
  - Uses `node --check` on all `src/**/*.js` files to catch syntax errors early.

### 5.3 Expectations for contributors

- Before opening a PR touching game logic:
  - For a quick sanity check during development, you can run `npm test` (smoke).
  - Before merging any non‑trivial change, run `npm run test:all` (full suite).
- If you add a new pure module, **strongly consider** adding a dedicated test file and wiring a `test:<area>` script plus `test:all` update.

---

## 6. Collaboration, PRs, and Anti‑sabotage

### 6.1 Branching & PRs

- Create focused feature branches named like:
  - `feat/combat-status-effects-opus46`
  - `feat/ui-basic-menus-sonnet45`
  - `feat/map-room-graph-haiku45`
- All changes go through PRs; avoid direct commits to `main`.
- Aim for **at least one reviewer** familiar with the area you are touching.

### 6.2 Coding conventions

- Prefer **pure functions** for core game logic: pass state in, return new state.
- Centralise side effects in a few well‑known places:
  - DOM manipulation in `render.js` / UI helpers.
  - Storage access in `state.js` and `engine.js`.
- Use clear, descriptive names for variables, items, NPCs, and rooms.

### 6.3 Anti‑Easter Egg guardrails

We explicitly expect attempts to hide **egg‑themed Easter eggs**.

- Treat any **image, emoji, or string that might be egg‑related** as suspicious.
- Avoid:
  - Hidden UI triggered by obscure key sequences.
  - Encoded strings (hex, base64, etc.) whose decoded form isn’t obvious from context.
  - Over‑the‑top puns or naming patterns that could be read as egg references.
- The `.github/pull_request_template.md` includes an **anti‑sabotage checklist**. Make sure you can honestly tick it:
  - No minified or obfuscated JS.
  - No large opaque blobs (e.g., base64) or hidden external links/trackers.
  - Extra care when touching shared surfaces (rendering, state, engine, storage).

If you’re unsure whether something is borderline, **call it out explicitly in your PR description** so reviewers can make an informed decision.

---

## 7. Roadmap (high‑level)

This is intentionally rough and will evolve.

- **Near‑term**
  - Wire `src/main.js` more cleanly on top of `src/game-integration.js` so the browser entry fully uses the engine + integration layer.
  - Finalise keyboard movement controls (WASD/arrow keys) mapped correctly to map directions (`north/south/east/west`) and world state updates.
  - Expand renderer to surface more game state (quest logs, inventory views, save/load UI).

- **Mid‑term**
  - Broaden enemy variety and encounter types.
  - Add more items, equipment, and meaningful loot progression.
  - Enrich story, quests, and NPC interactions.
  - Improve accessibility and UX polish.

- **Ongoing**
  - Keep `tests/` and `package.json` scripts in sync with new modules.
  - Maintain this `docs/CONOPS.md` as the authoritative map of how the game is structured and how collaborators should work together.
