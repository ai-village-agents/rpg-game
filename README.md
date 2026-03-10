# AI Village RPG (browser, turn-based)

A collaborative, browser-playable turn-based RPG built by the AI Village agents.

**Live demo (GitHub Pages):** https://ai-village-agents.github.io/rpg-game/

## Features

- **4 playable classes:** Warrior, Mage, Rogue, Cleric — each with unique stats and abilities
- **Turn-based combat** with attack, defend, abilities, items, and potions
- **Status effects:** Poison, burn, stun, regen, and more with duration tracking
- **9 enemy types** across 5 zone tiers, from Slimes to Dragons
- **Boss encounters:** Forest Guardian, Fire Drake, Shadow Wraith — with multi-phase fights
- **Equipment system:** Weapons, armor, and accessories with stat bonuses and set bonuses
- **Shop system:** Buy and sell items with dynamic pricing
- **Crafting system:** Discover and craft recipes from collected materials
- **Talent trees:** Allocate skill points across multiple talent branches
- **Quest system:** Accept, track, and complete multi-stage objectives (KILL/EXPLORE/TALK/DELIVER) with rewards
- **World events:** Dynamic events like Merchant Caravan, Monster Horde, Fog of War, and more
- **NPC dialog system:** Story-driven conversations with NPCs
- **Save/load system:** 5 save slots with full state persistence
- **Settings:** Configurable game options
- **Help/keybindings overlay:** In-game reference for controls
- **Developer menu:** Debug tools for testing (toggle with dev key)
- **Minimap:** Real-time map of explored areas
- **Game statistics:** Track enemies defeated, items used, XP earned, and more
- **Achievement system:** 28 achievements across 5 categories (Combat, Exploration, Progression, Collection, Quests)
- **Companion system:** Recruit companions to join your party with unique abilities and stats
- **Party mechanics:** Manage up to 3 companions with loyalty, mood, and relationship levels
- **NPC relationships:** Build relationships through dialog, quests, and gifts — affects shop prices and dialog
- **Journal system:** Track your adventures, completed quests, and important discoveries
- **Bestiary:** Unlock enemy information as you encounter and defeat them
- **Character customization:** Choose appearance, name, and starting class
- **Tavern minigame:** Test your luck with dice games at the tavern
- **Weather and time:** Dynamic weather and time-of-day effects
- **Crafting material drops:** Enemies drop crafting materials based on enemy type

## Run locally

No build step required — pure vanilla HTML/CSS/JS with ES modules.

1. Clone the repo
2. Open `index.html` in a browser
   - If your browser blocks ES modules from `file://`, use a simple static server (any will do).

## Controls

- **Exploration movement:** Click **North/South/West/East** buttons, or use **WASD** / **Arrow keys**
- **Combat:** Click action buttons (Attack, Defend, Ability, Item, Potion)
- **Menus:** Click buttons or use keyboard shortcuts shown in the Help overlay

Keyboard movement is ignored when focus is inside an `input`/`textarea` or a content-editable element.

## Tests

- Smoke test: `npm test`
- Full suite: `npm run test:all`

CI runs the full suite on every PR. The test suite includes 1100+ tests covering combat, items, equipment, crafting, talents, quests, world events, bosses, UI contracts, and defensive easter-egg detection (forbidden motifs, whitespace/audio whitespace guards, and zero-width character guard).

## Project structure

```
index.html                — app shell
styles.css                — minimal styling
src/
  main.js                 — bootstraps app, wires state + render
  state.js                — initial state + store helpers
  engine.js               — save/load system (5 slots)
  save-system.js          — save logic shared across flows
  render.js               — DOM renderer
  input.js                — keyboard input handling
  combat.js               — turn resolution + enemy AI
  inventory.js            — inventory + equipment + bonuses
  items.js                — item use/add/remove helpers
  equipment-sets.js       — equipment set bonus calculations
  achievements.js / achievements-ui.js — achievements tracking and UI
  companions.js / companions-ui.js — companion recruiting and management
  companion-loyalty-events.js / companion-combat.js — loyalty, mood, and combat hooks for companions
  shop.js / shop-ui.js    — shop logic and UI
  crafting.js / crafting-ui.js — crafting logic and UI
  crafting-integration.js — crafting hooks for quests and drops
  talents.js / talents-ui.js   — talent tree logic and UI
  quest-integration.js    — quest tracking and completion
  quest-relationship-bridge.js — links quests to relationships
  quest-reputation-notifications.js — reputation notifications for quest outcomes
  quest-rewards.js / quest-rewards-ui.js — quest reward handling
  world-events.js / world-events-ui.js   — dynamic world events
  boss.js / boss-ui.js    — boss encounter logic and UI
  npc-dialog.js           — NPC conversation system
  npc-relationships.js    — relationship progression with NPCs
  relationship-dialog.js  — dialog adjustments from relationships
  relationship-shop-discounts.js — shop price adjustments from relationships
  relationship-achievements.js — achievements tied to relationships
  level-up.js             — level progression and stat gains
  minimap.js              — minimap rendering
  map.js                  — map scene interactions
  game-stats.js           — gameplay statistics tracking
  battle-summary.js       — post-combat summary
  settings.js / settings-ui.js — game settings
  save-management-ui.js   — save/load UI and management
  save-slots-ui.js        — save slot UI
  stats-display.js        — player stats display
  character-creation.js   — character builder
  status-effect-ui.js     — status effect badges + tooltips
  combat-tooltips.js      — combat action tooltips
  journal.js / journal-ui.js — journal tracking for quests and discoveries
  bestiary.js / bestiary-ui.js — bestiary entries and UI
  help-ui.js              — help/keybindings overlay
  weather.js / weather-ui.js — weather effects and UI
  tavern-dice.js / tavern-dice-ui.js — tavern dice minigame
  dev-menu.js             — developer debug menu
  state-transitions.js    — game phase transitions
  enemy-abilities.js      — enemy AI ability selection
  audio-system.js         — audio management
  loot-tables.js          — loot table configuration
  game-integration.js     — cross-system integration
  characters/
    classes.js            — class definitions (Warrior, Mage, Rogue, Cleric)
    character.js          — character creation
    stats.js              — stat calculations
    party.js              — party management
  combat/
    abilities.js          — player ability definitions
    damage-calc.js        — damage/heal formulas
    status-effects.js     — status effect definitions
    equipment-bonuses.js  — combat stat bonuses from equipment
  data/
    enemies.js            — enemy definitions + encounter table
    bosses.js             — boss definitions
    items.js              — item catalog
    recipes.js            — crafting recipes
    talents.js            — talent definitions
    world-events.js       — world event definitions
    quests.js             — quest definitions
    exploration-quests.js — exploration quest definitions
    npcs.js               — NPC definitions
    dialogs.js            — dialog scripts
    characters.js         — character data
  handlers/
    system-handler.js     — system-level action dispatch
    ui-handler.js         — UI action dispatch
    combat-handler.js     — combat action dispatch
    exploration-handler.js — exploration action dispatch
  storage/                — persistence utilities
  story/                  — story/dialog engine
  ui/                     — shared UI utilities
  audio/                  — audio assets/utilities
tests/                    — 90+ test files, 1100+ tests
scripts/
  run-tests.mjs           — test runner
```

## Contributing

- Prefer small PRs scoped to one module.
- Avoid merge conflicts by coordinating ownership by module.
- Include tests for new features.
- Run `npm run test:all` before submitting a PR.

See `CONTRIBUTING.md`.
