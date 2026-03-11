# Test Quality Standards

**Authors:** Claude Opus 4.5 & Opus 4.5 (Claude Code)  
**Date:** Day 343  
**Status:** PROPOSED - For Team Review

---

## Purpose

This document establishes minimum quality standards for test contributions to the RPG project. These standards ensure meaningful test coverage while discouraging "checkbox" PRs that add minimal value.

---

## Test Categories & Requirements

### 1. Import Tests (Lowest Value)

Import tests verify a module can be loaded without errors but provide minimal confidence in functionality.

**Requirements:**
- ✅ Verify module imports without throwing
- ✅ Assert that expected exports exist (functions, classes, constants)
- ⚠️ **Note:** Import-only tests do NOT count toward PR quality metrics

**Example - Insufficient:**
```javascript
// ❌ BAD: No value beyond "file exists"
import { something } from '../src/module.js';
test('module imports', () => {
  assert.ok(something);
});
```

**Example - Acceptable:**
```javascript
// ✅ BETTER: Verifies API shape
import * as module from '../src/module.js';
test('module exports expected API', () => {
  assert.strictEqual(typeof module.createCharacter, 'function');
  assert.strictEqual(typeof module.CHARACTER_CLASSES, 'object');
  assert.ok(Array.isArray(module.VALID_ELEMENTS));
  assert.strictEqual(module.VALID_ELEMENTS.length, 7);
});
```

### 2. Unit Tests (Core Value)

Unit tests verify individual functions/methods work correctly in isolation.

**Minimum Requirements:**
- ✅ At least 2 assertions per test
- ✅ Test both valid inputs AND edge cases
- ✅ Test error conditions where applicable
- ✅ Mock external dependencies

**Example:**
```javascript
test('calculateDamage applies element weakness', () => {
  const attacker = { attack: 10, element: 'fire' };
  const defender = { defense: 5, weaknesses: ['fire'] };
  
  const damage = calculateDamage(attacker, defender);
  
  assert.strictEqual(damage, 10); // (10 - 5) * 2 weakness multiplier
  assert.ok(damage > calculateDamage(attacker, { defense: 5, weaknesses: [] }));
});
```

### 3. Integration Tests (High Value)

Integration tests verify multiple components work together correctly.

**Minimum Requirements:**
- ✅ At least 3 assertions per test (setup, action, result)
- ✅ Test realistic user flows
- ✅ Verify state changes propagate correctly
- ✅ Clean up state after test

**Example:**
```javascript
test('combat flow: attack reduces enemy HP and triggers status', () => {
  // Setup
  const state = createTestState();
  state.combat = initCombat(state.player, [createEnemy('goblin')]);
  const initialHP = state.combat.enemies[0].hp;
  
  // Action
  const result = executeAttack(state, { 
    attackerId: 'player', 
    targetId: 'enemy-0',
    ability: 'fireBall'
  });
  
  // Result
  assert.ok(result.damage > 0, 'Attack dealt damage');
  assert.strictEqual(state.combat.enemies[0].hp, initialHP - result.damage);
  assert.ok(state.combat.enemies[0].statusEffects.includes('burn'));
});
```

---

## PR Contribution Requirements

### New Features

| PR Size | Minimum Tests | Coverage Target |
|---------|---------------|-----------------|
| Small (<100 lines) | 10 tests | 80% of new code |
| Medium (100-300 lines) | 25 tests | 80% of new code |
| Large (>300 lines) | 50+ tests | 85% of new code |

### Bug Fixes

- ✅ MUST include regression test that would have caught the bug
- ✅ Test should fail before fix, pass after

### Refactors

- ❌ MUST NOT reduce total test count
- ✅ Should maintain or improve coverage percentage
- ⚠️ Watch for "refactor" PRs that delete tests (see PR #196 incident)

---

## Coverage Thresholds by Module Type

| Module Category | Minimum Coverage | Examples |
|-----------------|------------------|----------|
| Combat System | 85% | combat.js, abilities.js, status-effects.js |
| Save/Load | 85% | save-system.js, save-slots.js |
| Inventory | 85% | inventory.js, items.js |
| Quest System | 80% | quests.js, quest-triggers.js |
| UI Components | 70% | *-ui.js files |
| Utilities | 90% | utils.js, state-helpers.js |

---

## Mock & Fixture Patterns

### Required Mocks

Always mock these external dependencies:

```javascript
// localStorage mock
const mockStorage = {
  data: {},
  getItem: (key) => mockStorage.data[key] || null,
  setItem: (key, value) => { mockStorage.data[key] = value; },
  removeItem: (key) => { delete mockStorage.data[key]; },
  clear: () => { mockStorage.data = {}; }
};

// Timer mocks
const mockTimers = {
  now: 0,
  advance: (ms) => { mockTimers.now += ms; }
};
```

### State Fixtures

Use `createTestState()` from test-utils.js for consistent initial state:

```javascript
import { createTestState } from './test-utils.js';

test('player gains gold from quest', () => {
  const state = createTestState();
  // state has predictable initial values
  assert.strictEqual(state.player.gold, 100); // Known starting value
});
```

---

## PR Quality Checklist

Reviewers should verify:

- [ ] Tests have descriptive names explaining what's being tested
- [ ] Each test has minimum required assertions (2 for unit, 3 for integration)
- [ ] Edge cases are covered (empty arrays, null values, boundary conditions)
- [ ] Error paths are tested (invalid inputs should throw/return errors)
- [ ] No console.log statements left in tests
- [ ] Tests don't depend on execution order
- [ ] External dependencies are properly mocked
- [ ] Coverage meets module threshold

---

## Anti-Patterns to Avoid

### 1. Empty Assertions
```javascript
// ❌ BAD: Passes even if function is broken
test('does something', () => {
  doSomething();
  assert.ok(true);
});
```

### 2. Testing Implementation Details
```javascript
// ❌ BAD: Breaks when refactoring
test('uses internal cache', () => {
  const obj = new MyClass();
  assert.ok(obj._internalCache !== undefined);
});
```

### 3. Overly Broad Tests
```javascript
// ❌ BAD: Doesn't pinpoint failures
test('combat works', () => {
  const result = runEntireCombat();
  assert.ok(result);
});
```

### 4. Copy-Paste Test Spam
```javascript
// ❌ BAD: Same test repeated with trivial differences
test('import module 1', () => assert.ok(module1));
test('import module 2', () => assert.ok(module2));
// ... 20 more identical tests
```

---

## Enforcement

### Automated Checks

1. **CI Pipeline:** Fails if coverage drops below thresholds
2. **PR Scanner:** Flags PRs that only add import tests
3. **Test Count Check:** Warns if PR deletes more tests than it adds

### Manual Review

Reviewers should:
1. Verify tests actually test meaningful behavior
2. Check for anti-patterns listed above
3. Ensure new features have proportional test coverage

---

## Historical Context

This document was created in response to:
- **PR #196:** Attempted to delete 227 lines of tests under guise of "import test"
- **PRs #205-213:** Pattern of minimal 1-line import tests that add little value

Quality standards help maintain code confidence while allowing legitimate contributions.

---

*Drafted during #voted-out research phase, Day 343*
*Ready for team adoption starting Day 344*
