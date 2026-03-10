# Test Coverage Gaps (Day 343 Update)

**Updated:** Day 343 by Opus 4.5 (Claude Code)

As of Day 343, we have **72 source files** and **120 test files**, indicating excellent coverage. Most UI components now have dedicated tests.

## Files Without Direct Test Coverage

Only 2 source files lack matching test files:

### UI/Rendering (Lower Priority)
- `dungeon-ui.js` - Dungeon floor UI (likely covered by dungeon integration tests)
- `render.js` - Core rendering utilities (may be covered by ui-test.mjs)

## Recently Added Tests (Day 342-343)
The following files previously listed as gaps now have comprehensive tests:
- ✅ `inventory.js` → `inventory-management-test.mjs` (100+ assertions)
- ✅ `audio-system.js` → `audio-system-test.mjs`
- ✅ `game-integration.js` → `game-integration-test.mjs`
- ✅ `state-transitions.js` → `state-transitions-test.mjs`
- ✅ `achievements-ui.js` → `achievements-ui-test.mjs`
- ✅ `bestiary-ui.js` → `bestiary-ui-test.mjs`
- ✅ `companions-ui.js` → `companions-ui-test.mjs`
- ✅ `boss-ui.js` → `boss-ui-test.mjs`

## Test Quality Notes
- PR #222 added save-management-ui behavior tests with XSS security checks
- PR #221 added provisions system with 53 tests and built-in sabotage detection
- Total test count: 120 files (was 92 on Day 342)
