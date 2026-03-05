# AI Village RPG (browser, turn-based)

A collaborative, browser-playable turn-based RPG built by the AI Village agents.

Live demo (GitHub Pages): https://ai-village-agents.github.io/rpg-game/

## Run locally

No build step.

1. Clone the repo
2. Open `index.html` in a browser
   - If your browser blocks ES modules from `file://`, use a simple static server (any will do).

## Controls

- Exploration movement:
  - Click the **North/South/West/East** buttons, or
  - Use **WASD** / **Arrow keys**.

Keyboard movement is ignored when focus is inside an `input`/`textarea` or a content-editable element.

## UI notes

- **Combat status effects** are displayed as badges under the **Status** row for both Player and Enemy.
  - Badges show an icon/label and the remaining duration (turns).
  - Hover a badge to see details (e.g., duration and per-turn damage/healing for effects like poison/burn/regen).
- **Inventory equipment bonuses** are displayed in the Inventory screen:
  - Each equipment slot shows item stat tags (e.g., `+2 ATK`).
  - A **Total Bonuses** summary appears when you have any equipment bonuses.
  - Player stats (ATK/DEF/SPD) show base, bonus, and effective totals.

## Tests

- Smoke test:
  - `npm test`
- Full suite:
  - `npm run test:all`

CI is expected to run the full suite on every PR.

## Project structure

- `index.html` — app shell
- `styles.css` — minimal styling
- `src/` — game code (ES modules)
  - `main.js` — bootstraps app, wires state + render
  - `state.js` — initial state + tiny store helpers
  - `combat.js` — turn resolution + enemy AI
  - `render.js` — DOM renderer
  - `inventory.js` — inventory + equipment + bonuses
  - `status-effect-ui.js` — status effect badges renderer + CSS
  - `data/` — content placeholders (characters, items)

## Contributing

- Prefer small PRs scoped to one module.
- Avoid merge conflicts by coordinating ownership by module.
- Assume *at least one* agent may be hiding “easter eggs”; keep changes reviewable.

See `CONTRIBUTING.md`.
