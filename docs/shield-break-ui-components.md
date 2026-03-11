# Shield/Break UI Component Specifications

**Task 4 Owner:** Claude Sonnet 4.6  
**Dependencies:** Task 1 (shield-break.js core module)  
**Estimated Lines:** 250-350 (plus 30-50 tests)

## Overview

This document provides detailed specifications for all UI components needed to display Shield/Break system information to players. The UI must integrate with the existing battle interface in `src/render.js`.

---

## Component 1: Enemy Shield Display

### Location
- Above enemy name in battle UI
- Positioned at: `.enemy-status` container (line ~85 in render.js)

### Visual Design
```
┌─────────────────────────────────┐
│  🛡️ ▓▓▓▓▓░░░░░ 5/10            │
│  Giant Spider                   │
│  HP: ████████░░ 80/100          │
└─────────────────────────────────┘
```

### HTML Structure
```html
<div class="enemy-shield-container">
  <span class="shield-icon">🛡️</span>
  <div class="shield-bar-container">
    <div class="shield-bar" style="width: 50%"></div>
  </div>
  <span class="shield-count">5/10</span>
</div>
```

### CSS Classes
```css
.enemy-shield-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.shield-bar-container {
  flex: 1;
  height: 12px;
  background: #333;
  border-radius: 6px;
  overflow: hidden;
}

.shield-bar {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff, #2d6bb5);
  transition: width 0.3s ease-out;
}

.shield-bar.low {
  background: linear-gradient(90deg, #ffaa4a, #b57a2d);
}

.shield-bar.critical {
  background: linear-gradient(90deg, #ff4a4a, #b52d2d);
  animation: pulse 0.5s ease-in-out infinite alternate;
}

.shield-count {
  font-family: monospace;
  font-size: 14px;
  min-width: 45px;
  text-align: right;
}
```

### JavaScript Function
```javascript
/**
 * Renders enemy shield display
 * @param {HTMLElement} container - Parent element for shield display
 * @param {number} currentShields - Current shield count
 * @param {number} maxShields - Maximum shield count
 * @returns {HTMLElement} The shield display element
 */
function renderEnemyShieldDisplay(container, currentShields, maxShields) {
  // Implementation details in src/shield-break-ui.js
}
```

### Threshold States
| State | Condition | Visual |
|-------|-----------|--------|
| Normal | shields > 50% | Blue gradient |
| Low | shields 25-50% | Orange gradient |
| Critical | shields < 25% | Red gradient + pulse |
| Broken | shields === 0 | Hidden (show break state instead) |

---

## Component 2: Break State Indicator

### Visual Design
```
┌─────────────────────────────────┐
│  💥 BROKEN! (2 turns)           │
│  Giant Spider                   │
│  HP: ████████░░ 80/100          │
└─────────────────────────────────┘
```

### HTML Structure
```html
<div class="break-state-indicator">
  <span class="break-icon">💥</span>
  <span class="break-text">BROKEN!</span>
  <span class="break-duration">(2 turns)</span>
</div>
```

### CSS Classes
```css
.break-state-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(90deg, #ff6b6b, #ee5a5a);
  border: 2px solid #ffcc00;
  border-radius: 4px;
  animation: break-flash 0.3s ease-in-out 3;
}

@keyframes break-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.break-text {
  font-weight: bold;
  font-size: 16px;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
}

.break-duration {
  font-size: 12px;
  color: #ffcc00;
}
```

---

## Component 3: Weakness Icons Display

### Location
- Below shield bar OR in enemy info tooltip
- Shows exploitable element weaknesses

### Visual Design
```
Weaknesses: 🔥 ⚡ 🌿
```

### Element Icon Map
| Element | Icon | CSS Class |
|---------|------|-----------|
| physical | ⚔️ | `.weakness-physical` |
| fire | 🔥 | `.weakness-fire` |
| ice | ❄️ | `.weakness-ice` |
| lightning | ⚡ | `.weakness-lightning` |
| shadow | 🌑 | `.weakness-shadow` |
| nature | 🌿 | `.weakness-nature` |
| holy | ✨ | `.weakness-holy` |

### HTML Structure
```html
<div class="weakness-icons">
  <span class="weakness-label">Weak:</span>
  <span class="weakness-icon weakness-fire" title="Fire">🔥</span>
  <span class="weakness-icon weakness-lightning" title="Lightning">⚡</span>
  <span class="weakness-icon weakness-nature" title="Nature">🌿</span>
</div>
```

### CSS Classes
```css
.weakness-icons {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.weakness-label {
  color: #aaa;
  font-size: 12px;
  margin-right: 4px;
}

.weakness-icon {
  cursor: help;
  transition: transform 0.2s;
}

.weakness-icon:hover {
  transform: scale(1.3);
}

/* Highlight when player can exploit */
.weakness-icon.exploitable {
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from { filter: drop-shadow(0 0 2px gold); }
  to { filter: drop-shadow(0 0 6px gold); }
}
```

### JavaScript Function
```javascript
/**
 * Renders weakness icons for an enemy
 * @param {string[]} weaknesses - Array of element names
 * @param {string|null} playerCurrentElement - Element of selected ability (for highlighting)
 * @returns {HTMLElement} Weakness icons container
 */
function renderWeaknessIcons(weaknesses, playerCurrentElement = null) {
  // Implementation details in src/shield-break-ui.js
}
```

---

## Component 4: Shield Damage Feedback

### Purpose
Visual feedback when player hits enemy with weakness-exploiting attack.

### Animation Sequence
1. Shield icon shakes (100ms)
2. Shield count decrements with "-1" floating text
3. Shield bar width animates down
4. If broken: Flash entire screen, show break indicator

### CSS Animations
```css
@keyframes shield-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

@keyframes shield-damage-number {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

.shield-damage-feedback {
  position: absolute;
  color: #4a9eff;
  font-weight: bold;
  font-size: 18px;
  animation: shield-damage-number 0.8s ease-out forwards;
}
```

### JavaScript Function
```javascript
/**
 * Shows shield damage animation
 * @param {number} damage - Shield points removed
 * @param {HTMLElement} targetElement - Element to animate near
 * @param {boolean} causedBreak - Whether this caused break state
 */
function showShieldDamageFeedback(damage, targetElement, causedBreak = false) {
  // Implementation details in src/shield-break-ui.js
}
```

---

## Component 5: Action Button Weakness Indicator

### Purpose
Highlight attack buttons that would exploit enemy weakness.

### Visual Design
Attack buttons with matching element get golden border/glow.

### CSS Classes
```css
.attack-button.exploits-weakness {
  border: 2px solid #ffcc00;
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
}

.attack-button.exploits-weakness::after {
  content: "💥";
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
}
```

### JavaScript Function
```javascript
/**
 * Updates attack buttons based on enemy weaknesses
 * @param {string[]} enemyWeaknesses - Array of weakness elements
 * @param {Object[]} playerAbilities - Array of player abilities with element property
 */
function highlightExploitableAttacks(enemyWeaknesses, playerAbilities) {
  // Implementation details in src/shield-break-ui.js
}
```

---

## Component 6: Boss Phase Shield Refresh

### Purpose
Visual indicator when boss enters new phase and refreshes shields.

### Animation Sequence
1. Screen darkens momentarily
2. "PHASE 2" text appears center screen
3. Shield bar fills with sparkle effect
4. Normal combat resumes

### CSS Classes
```css
.boss-phase-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fade-in-out 2s ease-in-out forwards;
}

.boss-phase-text {
  font-size: 48px;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 0 20px #ff0000;
  animation: phase-pulse 0.5s ease-in-out 3;
}

@keyframes phase-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

---

## Integration Points with render.js

### Required Modifications
1. **Line 85-120** (renderEnemyStatus): Add shield display container
2. **Line 145-180** (renderActionButtons): Add weakness highlighting
3. **Line 220-250** (renderBattleMessage): Support shield/break messages

### New Exports from shield-break-ui.js
```javascript
export {
  renderEnemyShieldDisplay,
  renderBreakStateIndicator,
  renderWeaknessIcons,
  showShieldDamageFeedback,
  highlightExploitableAttacks,
  showBossPhaseTransition,
  updateShieldDisplay,       // Called each turn
  hideShieldDisplay,         // When enemy has no shields
  ELEMENT_ICONS,             // Icon mapping constant
  SHIELD_THRESHOLDS          // Percentage thresholds constant
};
```

---

## Test Requirements

### Minimum 30 Tests Required

**Rendering Tests (10)**
1. renderEnemyShieldDisplay shows correct shield count
2. renderEnemyShieldDisplay shows correct bar width percentage
3. renderEnemyShieldDisplay applies 'low' class at 25-50%
4. renderEnemyShieldDisplay applies 'critical' class below 25%
5. renderBreakStateIndicator shows correct turn count
6. renderWeaknessIcons displays correct icons for elements
7. renderWeaknessIcons highlights exploitable weaknesses
8. highlightExploitableAttacks adds class to matching buttons
9. hideShieldDisplay removes container from DOM
10. updateShieldDisplay animates width change

**Animation Tests (5)**
11. showShieldDamageFeedback creates floating number element
12. showShieldDamageFeedback triggers shake animation
13. showBossPhaseTransition creates overlay element
14. showBossPhaseTransition removes overlay after duration
15. Break state transition plays flash animation

**Edge Case Tests (8)**
16. Shield display handles maxShields of 0
17. Shield display handles currentShields > maxShields
18. Weakness icons handles empty array
19. Weakness icons handles invalid element names
20. Break indicator handles 0 remaining turns
21. Boss phase transition handles rapid phase changes
22. Multiple simultaneous shield damage feedbacks
23. Shield display updates during ongoing animation

**Integration Tests (7)**
24. Shield display integrates with enemy status container
25. Weakness highlighting updates when enemy changes
26. Break state replaces shield display correctly
27. Shield refresh after break shows correct state
28. Boss phase refresh restores full shields
29. Multiple enemies show independent shield displays
30. Shield display persists across turn transitions

---

## File Structure

```
src/
├── shield-break-ui.js       # All UI components (new file)
├── render.js                # Modified to import shield-break-ui
└── shield-break.js          # Core logic (Task 1)

tests/
├── shield-break-ui-test.mjs # UI component tests
└── shield-break-test.mjs    # Core logic tests (already created)
```

---

## Constants

```javascript
export const ELEMENT_ICONS = {
  physical: '⚔️',
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  shadow: '🌑',
  nature: '🌿',
  holy: '✨'
};

export const SHIELD_THRESHOLDS = {
  LOW: 0.5,      // Below 50% = orange
  CRITICAL: 0.25 // Below 25% = red + pulse
};

export const BREAK_DURATION = {
  NORMAL: 2,     // Regular enemies
  BOSS: 1        // Bosses recover faster
};
```

---

## Accessibility Considerations

1. **Screen Readers:** Add aria-labels to shield displays
2. **Color Blindness:** Don't rely solely on color - use icons/patterns
3. **Reduced Motion:** Respect `prefers-reduced-motion` media query
4. **Keyboard Navigation:** Ensure tooltips accessible via keyboard

```css
@media (prefers-reduced-motion: reduce) {
  .shield-bar, .break-state-indicator, .shield-damage-feedback {
    animation: none;
    transition: none;
  }
}
```

---

*Document created by Claude Opus 4.5 (#voted-out) for Day 344 development*
