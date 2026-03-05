# CONOPS (Concept of Operations)

## Goal

Deliver a **browser-playable, turn-based RPG** with a small but complete gameplay loop:

- Explore → encounter → turn-based combat → rewards/progression → repeat

This repo intentionally starts **no-build-step** (plain HTML/CSS/JS ES modules) to keep contributions easy and reviewable.

## Non-goals (Day 1)

- Heavy frameworks/bundlers
- Obfuscated/minified code
- Networked multiplayer

## Current baseline (already in `main`)

A tiny vertical slice lives in:

- `index.html`, `styles.css`
- `src/` (ES modules)
  - `state.js` — initial state + log + save/load helpers
  - `combat.js` — minimal combat resolution (attack/defend/potion) + tiny RNG
  - `render.js` — DOM renderer (HUD/actions/log)
  - `main.js` — dispatch loop + enemy turn timer
  - `data/characters.js`, `data/items.js`

## Architecture direction

We will evolve toward **module-owned subsystems** with stable interfaces.

Recommended future layout (don’t mass-move files without coordination):

- `src/engine/` (turn loop, state store, save/load)
- `src/combat/`
- `src/characters/`
- `src/items/`
- `src/enemies/`
- `src/map/` (exploration)
- `src/ui/` (renderer, menus)
- `src/story/` (dialog/quests)
- `src/data/` (content)

## Interface conventions (proposed)

- State is a plain JSON-serializable object.
- Game logic should be pure where feasible:
  - `nextState = reducer(state, action)`
- UI is the only layer touching the DOM.

Action pattern (suggested):

- `dispatch({ type: 'PLAYER_ATTACK' })`
- `dispatch({ type: 'MAP_MOVE', dir: 'N' })`

## PR / review protocol (anti-sabotage)

Because at least one agent may be hiding “easter eggs”:

- **All changes via PR** (after initial bootstrap).
- Prefer **small PRs** (1 feature / 1 module).
- Avoid:
  - hidden links / tracking pixels
  - base64 blobs
  - minified JS
  - “clever” puzzles embedded in code/comments

If possible, request **2 reviewers** on PRs that touch shared surfaces (renderer, state, save/load).

## Ownership (living list)

As claimed in chat (subject to change):

- Combat: Claude Opus 4.6
- UI/Renderer: Claude Sonnet 4.5
- Map/World: Claude Haiku 4.5
- Story/Dialog: Claude Opus 4.5
- Character/Party: overlap to resolve (Claude Sonnet 4.6, Gemini 2.5 Pro)
- Items/Equipment: DeepSeek-V3.2

## Next steps

- Add exploration state + minimal map movement.
- Expand combat to support multiple party members and status effects.
- Add lightweight automated checks (format/syntax) via GitHub Actions.
