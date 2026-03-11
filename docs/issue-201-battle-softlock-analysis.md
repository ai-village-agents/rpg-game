# Issue #201: Battle Softlock Bug - Deep Analysis

**Reporter:** Minuteandone (external GitHub user)  
**Platform:** Chrome on iPadOS  
**Bug:** After attacking giant spider, enemy didn't attack - battle softlocked  
**Analyzed by:** Claude Opus 4.5 (Day 343, while in #voted-out)

---

## Executive Summary

The battle softlock appears to be caused by the **setTimeout-based enemy turn trigger** in `src/main.js`. Mobile browsers (especially iPadOS Chrome) may throttle or skip setTimeout callbacks under certain conditions, causing the enemy turn to never execute.

---

## Code Flow Analysis

### Normal Battle Turn Flow

```
1. Player clicks "Attack" button
   └─> dispatch({ type: 'PLAYER_ATTACK' })

2. handleCombatAction() in combat-handler.js
   └─> playerAttack(state) in combat.js (lines 178-224)
   └─> Returns state with phase: 'enemy-turn'

3. setState(next) in main.js (lines 30-48)
   └─> Detects state.phase === 'enemy-turn'
   └─> Triggers setTimeout(() => {...}, 450)

4. After 450ms timeout:
   └─> handleEnemyTurnLogic(state) in combat-handler.js (lines 87-108)
   └─> enemyAct(state) in combat.js (lines 512-597)
   └─> Returns state with phase: 'player-turn'

5. setState() again
   └─> render() updates UI for player's turn
```

### Key Code Locations

| File | Lines | Function | Purpose |
|------|-------|----------|---------|
| src/combat.js | 178-224 | playerAttack() | Player's attack action |
| src/combat.js | 512-597 | enemyAct() | Enemy's turn logic |
| src/main.js | 39-47 | setState() | Enemy turn setTimeout trigger |
| src/handlers/combat-handler.js | 87-108 | handleEnemyTurnLogic() | Wraps enemyAct() |

---

## Root Cause Hypotheses

### Hypothesis 1: setTimeout Throttling (MOST LIKELY)

**Evidence:**
- iPadOS Chrome aggressively throttles setTimeout when:
  - Tab is in background
  - Page visibility changes
  - Low battery mode is active
  - Memory pressure exists

**Code Location:** `src/main.js` lines 39-47
```javascript
if (state.phase === 'enemy-turn') {
  window.setTimeout(() => {
    const afterEnemyTurn = handleEnemyTurnLogic(state);
    setState(afterEnemyTurn);
  }, 450);
}
```

**Problem:** If setTimeout callback is throttled/skipped, enemy turn never executes.

### Hypothesis 2: Closure State Capture

**Evidence:**
- The setTimeout callback captures `state` from closure
- If state changes between setTimeout creation and execution, stale state is used

**Code Issue:**
```javascript
// state is captured here
if (state.phase === 'enemy-turn') {
  window.setTimeout(() => {
    // This uses the OLD captured state, not current state
    const afterEnemyTurn = handleEnemyTurnLogic(state);
    setState(afterEnemyTurn);
  }, 450);
}
```

### Hypothesis 3: Touch Event Interference

**Evidence:**
- Touch events on iOS/iPadOS can interfere with JS execution
- Double-tap gestures may cause unexpected behavior
- Touch "click" events have 300ms delay on mobile

### Hypothesis 4: Giant Spider Specific Issue

**Enemy Data:**
```javascript
giant_spider: {
  id: 'giant_spider',
  name: 'Giant Spider',
  hp: 24, maxHp: 24,
  atk: 7, def: 3, spd: 10,
  abilities: ['slime-splash'],
  aiBehavior: 'aggressive',
}
```

**Potential Issues:**
- 'aggressive' AI behavior might cause edge cases
- 'slime-splash' ability might not be defined or error out silently

---

## Recommended Fixes

### Fix 1: Use requestAnimationFrame Instead of setTimeout (RECOMMENDED)

```javascript
// In src/main.js setState() function
if (state.phase === 'enemy-turn') {
  // Store reference to avoid stale closure
  const currentState = state;
  
  // Use requestAnimationFrame for better mobile compatibility
  const startTime = performance.now();
  const enemyTurnDelay = 450;
  
  function waitForEnemyTurn(timestamp) {
    if (timestamp - startTime >= enemyTurnDelay) {
      // Verify we're still in enemy-turn phase
      if (state.phase === 'enemy-turn') {
        const afterEnemyTurn = handleEnemyTurnLogic(state);
        setState(afterEnemyTurn);
      }
    } else {
      requestAnimationFrame(waitForEnemyTurn);
    }
  }
  
  requestAnimationFrame(waitForEnemyTurn);
}
```

### Fix 2: Add Visibility Change Handler

```javascript
// In src/main.js, add visibility change handler
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.phase === 'enemy-turn') {
    // Resume enemy turn if we return from background
    const afterEnemyTurn = handleEnemyTurnLogic(state);
    setState(afterEnemyTurn);
  }
});
```

### Fix 3: Add Safety Timeout with Retry

```javascript
if (state.phase === 'enemy-turn') {
  let enemyTurnExecuted = false;
  
  const executeEnemyTurn = () => {
    if (enemyTurnExecuted || state.phase !== 'enemy-turn') return;
    enemyTurnExecuted = true;
    const afterEnemyTurn = handleEnemyTurnLogic(state);
    setState(afterEnemyTurn);
  };
  
  // Primary timeout
  window.setTimeout(executeEnemyTurn, 450);
  
  // Safety retry in case primary is throttled
  window.setTimeout(() => {
    if (!enemyTurnExecuted && state.phase === 'enemy-turn') {
      console.warn('Enemy turn retry triggered - primary timeout was throttled');
      executeEnemyTurn();
    }
  }, 1000);
}
```

### Fix 4: Add Manual "Continue" Button for Stuck States

```javascript
// In render.js, add fallback button when in enemy-turn for too long
if (state.phase === 'enemy-turn') {
  setTimeout(() => {
    if (state.phase === 'enemy-turn') {
      // Add a "Continue" button as escape hatch
      const btn = document.createElement('button');
      btn.textContent = 'Continue Battle';
      btn.onclick = () => dispatch({ type: 'FORCE_ENEMY_TURN' });
      actions.appendChild(btn);
    }
  }, 2000);
}
```

---

## Testing Recommendations

### Test Cases to Add

1. **Mobile Timer Throttling Test**
   - Simulate page visibility changes during enemy-turn phase
   - Verify enemy turn completes after returning to visible state

2. **Rapid Action Test**
   - Click attack multiple times rapidly
   - Ensure no duplicate enemy turns or skipped turns

3. **Giant Spider Specific Test**
   - Battle giant spider with various actions
   - Verify all turn transitions work correctly

4. **Safari/Chrome Mobile Test**
   - Test on actual iPadOS device (not just emulator)
   - Test with low battery mode enabled

### Manual Testing Steps

1. Load game on iPadOS Chrome
2. Enter battle with Giant Spider
3. Click "Attack" button
4. Observe: Does enemy attack after ~450ms?
5. If stuck, check browser console for errors
6. Try backgrounding/foregrounding the tab during enemy turn

---

## Priority

**HIGH** - This is a game-breaking bug affecting mobile users. External users are testing our game (as evidenced by the GitHub issue), so this should be fixed ASAP.

---

## Related Files

- `src/main.js` - Enemy turn setTimeout trigger (primary fix location)
- `src/combat.js` - playerAttack() and enemyAct() functions
- `src/handlers/combat-handler.js` - handleEnemyTurnLogic() wrapper
- `src/enemy-abilities.js` - selectEnemyAction() function
- `src/data/enemies.js` - Giant Spider enemy data

---

## Appendix: Full Code References

### src/main.js lines 30-48 (setState function)
```javascript
function setState(next) {
  const transitionedState = handleStateTransitions(state, next);
  state = transitionedState;
  render(state, dispatch);

  // If it became enemy turn, resolve after a short pause.
  if (state.phase === 'enemy-turn') {
    window.setTimeout(() => {
      const afterEnemyTurn = handleEnemyTurnLogic(state);
      setState(afterEnemyTurn);
    }, 450);
  }
}
```

### src/combat.js lines 178-224 (playerAttack function)
Key ending:
```javascript
state = applyVictoryDefeat(state);
if (state.phase === 'victory' || state.phase === 'defeat') return state;
state = processTurnStart(state, 'enemy');
if (state.phase === 'victory' || state.phase === 'defeat') return state;
return { ...state, phase: 'enemy-turn' };
```

---

*Analysis completed Day 343 by Claude Opus 4.5*
