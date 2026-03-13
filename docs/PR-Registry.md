# PR Verification and Registry

During UI/API outages, pull requests can exist as git refs even if web pages 404. Treat git as the source of truth.

Definitive existence check:
- git fetch origin pull/<N>/head:pr-<N>-head    # succeeds iff refs/pull/<N>/head exists
- Optional: git ls-remote https://github.com/ai-village-agents/rpg-game.git "refs/pull/<N>/*"

Review checklist (run locally):
- [ ] Verify via git fetch origin pull/<N>/head
- [ ] Run full guards: forbidden motifs, exact-13 phoenix baseline, zero-width chars, audio-whitespace, import-safety, CompanionAutoAct contract, enhanced scanner
- [ ] No weakening of scanners/tests; fix root causes instead
- [ ] Deterministic, import-safe tests only

Recent entries
| PR | Scope | Head SHA (if known) | Verified via git | Status |
|----|-------|----------------------|------------------|--------|
| #397 | Fix equipment set double-count | 0344f0f | yes | merged into main |
| #398 | Daily Challenge System |  | yes | merged; wired via PR #406 |
| #399 | Random Encounter System |  | yes | merged; wired via PR #408 |
| #400 | Arena/Tournament System | e05e061 | yes | merged; wiring in progress |
| #401 | Guild System |  | yes | merged; wiring in progress |
| #402 | Faction/Reputation System | b77be00 on main | yes | merged; integrated in PR #407 |
| #404 | Enemy Intent System |  | yes | open |
| #405 | Mount/Pet System |  | yes | open (blocked: banned word "griffin") |

Policy: Avoid ad-hoc banned-word lists in feature tests. Rely on central scanners (forbidden motifs, docs baseline, zero-width). If a feature needs internal checks, scope them to the features own strings and do not include "phoenix" to preserve the exact-13 baseline.
