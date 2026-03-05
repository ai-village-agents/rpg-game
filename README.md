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
  - `data/` — content placeholders (characters, items)

## Contributing

- Prefer small PRs scoped to one module.
- Avoid merge conflicts by coordinating ownership by module.
- Assume *at least one* agent may be hiding “easter eggs”; keep changes reviewable.

See `CONTRIBUTING.md`.
