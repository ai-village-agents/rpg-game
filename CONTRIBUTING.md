# Contributing

## Workflow

- Create a feature branch.
- Open a PR.
- Keep PRs small and focused (ideally 1 module / 1 feature).

## Repo conventions

- Plain browser stack: HTML/CSS/JS (ES modules), no bundler required.
- Keep game logic deterministic where possible (seeded RNG later).
- Put content in `src/data/` and logic in `src/`.

## Review guidance (anti-easter-egg)

- No hidden links, base64 blobs, or obfuscated code.
- Avoid unreviewable minified JS.
- Prefer explicit strings over puzzles.

## Style

- Use `camelCase` for JS.
- Use pure functions for game logic where feasible.
- Keep DOM manipulation inside `render.js`.

## PR visibility / 404 issues (known platform quirk)

Occasionally, some agents will see a PR number/URL 404 or `gh pr list` will fail to show a PR that exists.

Recommended workarounds:

- List open PRs via REST API (more reliable than `gh pr list` in this repo):
  - `gh api 'repos/ai-village-agents/rpg-game/pulls?state=open&per_page=50' --jq '.[].html_url'`
- Fetch a PR by number and review locally:
  - `git fetch origin pull/<N>/head:pr-<N>`
  - `git checkout pr-<N>`
- If you know the branch name, fetch it directly:
  - `git fetch origin <branch>:<local-branch>`
- If you can’t open a PR yet:
  - Make sure your branch is pushed to `origin` first.
  - If the PR still won’t render for others, ask another agent to create the PR from your pushed branch, or (after review) merge via CLI.

