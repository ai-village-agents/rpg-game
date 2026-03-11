# Shield/Break System Accessibility Guidelines
## Ensuring the Shield System is Usable by All Players

**Author:** Claude Opus 4.5  
**Date:** Day 343 (from #voted-out)  
**Purpose:** Define accessibility requirements for Shield/Break UI components

---

## Overview

The Shield/Break system introduces visual indicators that players rely on for tactical decisions. This document ensures these features are accessible to players with various disabilities including visual impairments, color blindness, motor disabilities, and cognitive differences.

---

## 1. Color Blindness Considerations

### 1.1 Element Color Palette

**Problem:** Our element system uses colors that may be indistinguishable for colorblind players.

**Current Element Colors:**
| Element | Intended Color | Deuteranopia | Protanopia | Tritanopia |
|---------|---------------|--------------|------------|------------|
| Fire 🔥 | Red (#FF4444) | Brown | Brown | Red |
| Ice ❄️ | Light Blue (#88CCFF) | Blue | Blue | Pink |
| Lightning ⚡ | Yellow (#FFDD00) | Yellow | Yellow | Pink |
| Nature 🌿 | Green (#44AA44) | Brown | Yellow | Green |
| Shadow 🌑 | Purple (#8844AA) | Blue | Blue | Red |
| Holy ✨ | Gold (#FFD700) | Yellow | Yellow | Pink |
| Physical ⚔️ | Gray (#888888) | Gray | Gray | Gray |

**Solution: Don't Rely on Color Alone**

```css
/* Each element gets both color AND pattern */
.weakness-icon--fire {
  background-color: #FF4444;
  background-image: url('patterns/fire-stripes.svg');  /* Diagonal stripes */
}

.weakness-icon--ice {
  background-color: #88CCFF;
  background-image: url('patterns/ice-dots.svg');      /* Dot pattern */
}

.weakness-icon--lightning {
  background-color: #FFDD00;
  background-image: url('patterns/lightning-zigzag.svg'); /* Zigzag */
}

.weakness-icon--nature {
  background-color: #44AA44;
  background-image: url('patterns/nature-leaves.svg');  /* Leaf pattern */
}

.weakness-icon--shadow {
  background-color: #8844AA;
  background-image: url('patterns/shadow-swirl.svg');   /* Swirl */
}

.weakness-icon--holy {
  background-color: #FFD700;
  background-image: url('patterns/holy-stars.svg');     /* Star pattern */
}

.weakness-icon--physical {
  background-color: #888888;
  background-image: url('patterns/physical-crosshatch.svg'); /* Crosshatch */
}
```

### 1.2 Shield Bar States

**Problem:** Shield segments changing from "active" to "depleted" using only color change.

**Solution:**

```css
/* Active segments are filled, depleted are outlined only */
.shield-bar__segment--active {
  background: linear-gradient(to bottom, #4488FF, #2266CC);
  border: 2px solid #1155BB;
}

.shield-bar__segment--depleted {
  background: transparent;
  border: 2px dashed #666666;  /* Dashed border = depleted */
}

/* Break state uses animation + pattern, not just color */
.enemy--broken .shield-bar {
  animation: broken-pulse 0.5s infinite alternate;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255,0,0,0.3) 5px,
    rgba(255,0,0,0.3) 10px
  );
}
```

---

## 2. Screen Reader Support

### 2.1 ARIA Labels for Shield Display

```html
<!-- Shield bar with full accessibility -->
<div class="shield-bar" 
     role="meter"
     aria-label="Enemy shield"
     aria-valuenow="5"
     aria-valuemin="0"
     aria-valuemax="8"
     aria-valuetext="Shield: 5 of 8">
  <!-- Visual segments for sighted users -->
  <div class="shield-bar__segment shield-bar__segment--active"></div>
  <div class="shield-bar__segment shield-bar__segment--active"></div>
  <!-- etc -->
</div>

<!-- Weakness icons with labels -->
<div class="weakness-icons" role="list" aria-label="Enemy weaknesses">
  <span class="weakness-icon weakness-icon--fire" 
        role="listitem"
        aria-label="Weak to fire">🔥</span>
  <span class="weakness-icon weakness-icon--lightning"
        role="listitem"
        aria-label="Weak to lightning">⚡</span>
</div>

<!-- Break state announcement -->
<div class="enemy-status"
     role="status"
     aria-live="polite"
     aria-label="Enemy is broken! 2 turns remaining">
  💥 BROKEN (2 turns)
</div>
```

### 2.2 Live Region Announcements

```javascript
/**
 * Announce shield events to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
function announceToScreenReader(message, priority = 'polite') {
  const announcer = document.getElementById('sr-announcer');
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

// Usage in shield-break.js
function applyShieldDamage(shieldState, damageType, shieldDamage = 1) {
  // ... damage logic ...
  
  if (result.hitWeakness) {
    announceToScreenReader(
      `Hit weakness! ${enemy.name} shield reduced to ${result.newState.currentShield}`,
      'polite'
    );
  }
  
  if (result.brokeShield) {
    announceToScreenReader(
      `${enemy.name}'s shield is broken! They will skip their next 2 turns.`,
      'assertive'
    );
  }
  
  return result;
}
```

### 2.3 Hidden Content for Screen Readers

```html
<!-- Add descriptive text that's visually hidden but read by screen readers -->
<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

<div class="enemy-panel">
  <h3>Goblin Warrior</h3>
  <span class="sr-only">Shield status:</span>
  <div class="shield-bar" aria-hidden="true">
    <!-- Visual shield bar -->
  </div>
  <span class="sr-only">4 of 6 shield points remaining. Weak to fire and lightning.</span>
</div>
```

---

## 3. Keyboard Navigation

### 3.1 Focus Management

```javascript
/**
 * Ensure shield UI elements are keyboard accessible
 */
function setupShieldKeyboardNav() {
  // Weakness icons should be tabbable for tooltip access
  document.querySelectorAll('.weakness-icon').forEach(icon => {
    icon.setAttribute('tabindex', '0');
    
    // Show tooltip on focus (not just hover)
    icon.addEventListener('focus', showWeaknessTooltip);
    icon.addEventListener('blur', hideWeaknessTooltip);
  });
  
  // Shield bar should announce on focus
  document.querySelectorAll('.shield-bar').forEach(bar => {
    bar.setAttribute('tabindex', '0');
    bar.addEventListener('focus', announceShieldStatus);
  });
}

/**
 * Handle keyboard interaction with weakness display
 */
function handleWeaknessKeyboard(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    // Trigger same action as click (show detailed tooltip)
    showDetailedWeaknessInfo(event.target);
    event.preventDefault();
  }
}
```

### 3.2 Focus Indicators

```css
/* Ensure visible focus indicators */
.weakness-icon:focus,
.shield-bar:focus {
  outline: 3px solid #FFDD00;
  outline-offset: 2px;
  box-shadow: 0 0 0 5px rgba(255, 221, 0, 0.3);
}

/* High contrast focus for Windows High Contrast Mode */
@media (forced-colors: active) {
  .weakness-icon:focus,
  .shield-bar:focus {
    outline: 3px solid CanvasText;
  }
}
```

---

## 4. Motor Accessibility

### 4.1 Touch Target Sizes

```css
/* Minimum 44x44px touch targets (WCAG 2.1 AAA) */
.weakness-icon {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
  /* Even if visual icon is 24px, touch target is 44px */
}

/* Adequate spacing between targets */
.weakness-icons {
  gap: 8px;  /* Minimum spacing to prevent mis-taps */
}
```

### 4.2 Click/Tap Tolerance

```javascript
/**
 * Accept clicks on larger area than visual element
 * (Pointer events on container, visual on child)
 */
document.querySelector('.weakness-container').addEventListener('click', (e) => {
  // Find closest weakness icon, even if click was slightly off
  const icon = e.target.closest('.weakness-icon');
  if (icon) {
    showWeaknessDetails(icon.dataset.element);
  }
});
```

---

## 5. Cognitive Accessibility

### 5.1 Clear Visual Hierarchy

```css
/* Shield count should be immediately readable */
.shield-bar__counter {
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  /* High contrast text */
  color: #FFFFFF;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

/* Group related information visually */
.enemy-combat-info {
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  padding: 12px;
  /* Clear sections */
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

### 5.2 Consistent Terminology

Use the same terms everywhere:
| Preferred Term | Avoid |
|---------------|-------|
| Shield | Armor, Guard, Defense Bar |
| Break | Stun, Stagger, Daze, Shatter |
| Weakness | Vulnerability, Susceptibility |
| Hit Weakness | Exploit, Target, Strike |

### 5.3 Tooltips and Help Text

```javascript
const WEAKNESS_TOOLTIPS = {
  fire: "Fire attacks deal extra shield damage. Use fire spells or flame weapons.",
  ice: "Ice attacks freeze and shatter. Vulnerable to cold magic.",
  lightning: "Lightning conducts through armor. Electric attacks very effective.",
  nature: "Natural forces disrupt this enemy. Use nature magic or poison.",
  shadow: "Darkness and shadow magic penetrate. Rogues excel here.",
  holy: "Sacred light burns this creature. Clerics deal bonus damage.",
  physical: "Standard weapon attacks are effective. Any physical damage works."
};

function showWeaknessTooltip(element) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.role = 'tooltip';
  tooltip.textContent = WEAKNESS_TOOLTIPS[element];
  // Position and show tooltip
}
```

### 5.4 Tutorial/Onboarding

```javascript
// First-time shield encounter tutorial
const SHIELD_TUTORIAL_STEPS = [
  {
    highlight: '.shield-bar',
    message: "This is the enemy's SHIELD. You need to break it before dealing full damage."
  },
  {
    highlight: '.weakness-icons',
    message: "These icons show weaknesses. Attack with matching elements to reduce the shield faster!"
  },
  {
    highlight: '.enemy--broken',
    message: "When the shield reaches 0, the enemy is BROKEN and takes 50% more damage!"
  }
];

function showShieldTutorial() {
  if (!localStorage.getItem('shieldTutorialComplete')) {
    startTutorialSequence(SHIELD_TUTORIAL_STEPS);
  }
}
```

---

## 6. Motion and Animation

### 6.1 Respect Reduced Motion Preference

```css
/* Default animations */
.shield-damage-animation {
  animation: shield-shake 0.3s ease-out;
}

.break-animation {
  animation: break-flash 0.5s ease-out;
}

/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  .shield-damage-animation,
  .break-animation,
  .enemy--broken {
    animation: none;
    /* Use instant state change instead */
    transition: none;
  }
  
  /* Alternative: subtle opacity change instead of animation */
  .enemy--broken {
    opacity: 0.7;
    filter: grayscale(50%);
  }
}
```

### 6.2 Animation Duration Limits

```javascript
// No animation should exceed 5 seconds (WCAG guideline)
const MAX_ANIMATION_DURATION = 5000;

// Provide pause/stop control for any looping animation
function setupAnimationControls() {
  document.querySelector('.pause-animations-btn')
    .addEventListener('click', () => {
      document.body.classList.toggle('animations-paused');
    });
}
```

```css
.animations-paused * {
  animation-play-state: paused !important;
  transition: none !important;
}
```

---

## 7. High Contrast Mode

```css
/* Support Windows High Contrast Mode */
@media (forced-colors: active) {
  .shield-bar__segment--active {
    background: Canvas;
    border: 2px solid CanvasText;
    forced-color-adjust: none;
  }
  
  .shield-bar__segment--depleted {
    background: transparent;
    border: 2px dashed GrayText;
  }
  
  .enemy--broken {
    border: 3px solid Highlight;
  }
  
  .weakness-icon {
    border: 2px solid CanvasText;
  }
}
```

---

## 8. Text Scaling

```css
/* Support text scaling up to 200% without breaking layout */
.shield-bar {
  /* Use relative units */
  height: 1.5em;
  min-height: 24px;  /* Minimum for very small base fonts */
}

.shield-bar__counter {
  font-size: 1rem;  /* Scales with user preference */
  min-width: 3ch;   /* Character-based width */
}

.weakness-icons {
  flex-wrap: wrap;  /* Allow wrapping at larger text sizes */
  gap: 0.5em;
}

/* Test at 200% zoom - nothing should overflow or overlap */
@media (min-resolution: 2dppx) {
  .shield-bar {
    /* Ensure crisp rendering at high DPI */
    transform: translateZ(0);
  }
}
```

---

## 9. Implementation Checklist

### Must Have (WCAG 2.1 AA)
- [ ] All color meanings have non-color alternative (icons, patterns, text)
- [ ] Shield bar has `role="meter"` with proper ARIA attributes
- [ ] Weakness icons have aria-labels
- [ ] Focus indicators visible (3px minimum)
- [ ] Touch targets 44x44px minimum
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Text scales to 200% without clipping

### Should Have (WCAG 2.1 AAA)
- [ ] Screen reader live announcements for state changes
- [ ] Keyboard-only full access to all shield info
- [ ] High contrast mode support
- [ ] Pattern fills for colorblind users
- [ ] Tutorial available for shield mechanics

### Nice to Have
- [ ] Audio cues for shield break (with mute option)
- [ ] Haptic feedback on mobile (shield break vibration)
- [ ] Custom animation speed settings
- [ ] Dyslexia-friendly font option

---

## 10. Testing Checklist

### Automated Tests
- [ ] axe-core accessibility audit passes
- [ ] Lighthouse accessibility score ≥90
- [ ] Color contrast ratios meet AA standards

### Manual Tests
- [ ] Tab through all shield UI elements
- [ ] Use with screen reader (NVDA, VoiceOver)
- [ ] Test with color blindness simulators
- [ ] Test at 200% browser zoom
- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Test with Windows High Contrast Mode

### User Tests
- [ ] Colorblind user can identify all weaknesses
- [ ] Screen reader user can understand combat state
- [ ] Motor-impaired user can access all interactions

---

## 11. Resources

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Blindness Simulator:** https://www.color-blindness.com/coblis-color-blindness-simulator/
- **axe DevTools:** Browser extension for automated a11y testing
- **NVDA Screen Reader:** Free screen reader for testing

---

*Document created by Claude Opus 4.5 from #voted-out, Day 343*
*Accessibility benefits all players, not just those with disabilities*
