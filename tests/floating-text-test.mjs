/**
 * Tests for floating-text.js
 * Since floating text relies on DOM, we mock the DOM elements.
 */

import assert from 'node:assert';

// --- Mock DOM ---
const mockElements = {};
const mockHead = { appendChild: () => {} };
const createdElements = [];

global.document = {
  getElementById: (id) => mockElements[id] || null,
  createElement: (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      style: { cssText: '', left: '', top: '' },
      children: [],
      parentNode: null,
      addEventListener: (evt, fn) => { el[`_on${evt}`] = fn; },
      remove: () => { 
        if (el.parentNode) {
          el.parentNode.children = el.parentNode.children.filter(c => c !== el);
          el.parentNode = null;
        }
      },
      appendChild: (child) => { child.parentNode = el; el.children.push(child); },
      querySelectorAll: () => [],
      querySelector: () => null,
      contains: () => true,
    };
    createdElements.push(el);
    return el;
  },
  head: mockHead,
  body: {
    appendChild: (child) => { child.parentNode = document.body; },
    contains: (el) => true,
  },
  querySelectorAll: (sel) => {
    if (sel === '#hud .card') return mockCards;
    return [];
  },
};

global.window = {};
global.setTimeout = (fn, ms) => fn();

// Mock cards for positioning
const mockCards = [];
function setupMockCards() {
  mockCards.length = 0;
  const playerCard = {
    querySelector: (sel) => sel === 'h2' ? { textContent: 'Player' } : null,
    getBoundingClientRect: () => ({ left: 50, top: 100, width: 200, height: 150 }),
  };
  const enemyCard = {
    querySelector: (sel) => sel === 'h2' ? { textContent: 'Enemy' } : null,
    getBoundingClientRect: () => ({ left: 300, top: 100, width: 200, height: 150 }),
  };
  mockCards.push(playerCard, enemyCard);
}

// Reset created elements before import
createdElements.length = 0;

const { showFloatingText, triggerFloatingTextFromLog, getFloatingTextStyles } = await import('../src/floating-text.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

console.log('Floating Text Tests');
console.log('===================');

// --- getFloatingTextStyles ---
console.log('\ngetFloatingTextStyles:');

test('returns a non-empty string', () => {
  const styles = getFloatingTextStyles();
  assert.ok(typeof styles === 'string');
  assert.ok(styles.length > 0);
});

test('contains .floating-text class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text'));
});

test('contains damage type class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text--damage'));
});

test('contains heal type class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text--heal'));
});

test('contains critical type class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text--critical'));
});

test('contains miss type class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text--miss'));
});

test('contains status type class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text--status'));
});

test('contains shield type class', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('.floating-text--shield'));
});

test('contains @keyframes floatUp animation', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('@keyframes floatUp'));
});

test('animation goes from opacity 1 to opacity 0', () => {
  const styles = getFloatingTextStyles();
  assert.ok(styles.includes('opacity: 1'));
  assert.ok(styles.includes('opacity: 0'));
});

// --- showFloatingText ---
console.log('\nshowFloatingText:');

test('creates a floating text element with damage class', () => {
  setupMockCards();
  const before = createdElements.length;
  showFloatingText({ text: '-10', type: 'damage', target: 'enemy' });
  // Should have created the container div and the text div
  const newEls = createdElements.slice(before);
  const textEl = newEls.find(e => e.className.includes('floating-text--damage'));
  assert.ok(textEl, 'Should create element with damage class');
  assert.strictEqual(textEl.textContent, '-10');
});

test('creates a floating text element with heal class', () => {
  setupMockCards();
  const before = createdElements.length;
  showFloatingText({ text: '+15', type: 'heal', target: 'player' });
  const newEls = createdElements.slice(before);
  const textEl = newEls.find(e => e.className.includes('floating-text--heal'));
  assert.ok(textEl, 'Should create element with heal class');
  assert.strictEqual(textEl.textContent, '+15');
});

test('creates a floating text element with critical class', () => {
  setupMockCards();
  const before = createdElements.length;
  showFloatingText({ text: '-25', type: 'critical', target: 'enemy' });
  const newEls = createdElements.slice(before);
  const textEl = newEls.find(e => e.className.includes('floating-text--critical'));
  assert.ok(textEl, 'Should create element with critical class');
});

test('creates a miss floating text', () => {
  setupMockCards();
  const before = createdElements.length;
  showFloatingText({ text: 'MISS', type: 'miss', target: 'enemy' });
  const newEls = createdElements.slice(before);
  const textEl = newEls.find(e => e.className.includes('floating-text--miss'));
  assert.ok(textEl, 'Should create element with miss class');
  assert.strictEqual(textEl.textContent, 'MISS');
});

test('creates a shield break floating text', () => {
  setupMockCards();
  const before = createdElements.length;
  showFloatingText({ text: 'BREAK!', type: 'shield', target: 'enemy' });
  const newEls = createdElements.slice(before);
  const textEl = newEls.find(e => e.className.includes('floating-text--shield'));
  assert.ok(textEl, 'Should create element with shield class');
});

test('does nothing when target card not found (no cards)', () => {
  mockCards.length = 0;
  const before = createdElements.length;
  showFloatingText({ text: '-5', type: 'damage', target: 'enemy' });
  // Should not create a floating text element (only possibly the container)
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.strictEqual(newTextEls.length, 0);
});

test('defaults type to damage and target to enemy', () => {
  setupMockCards();
  const before = createdElements.length;
  showFloatingText({ text: '-7' });
  const newEls = createdElements.slice(before);
  const textEl = newEls.find(e => e.className.includes('floating-text--damage'));
  assert.ok(textEl, 'Should default to damage type');
});

// --- triggerFloatingTextFromLog ---
console.log('\ntriggerFloatingTextFromLog:');

test('does nothing when logs are identical', () => {
  setupMockCards();
  const log = ['A wild Slime appears.'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(log, log);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.strictEqual(newTextEls.length, 0);
});

test('does nothing when currentLog is null', () => {
  const before = createdElements.length;
  triggerFloatingTextFromLog(null, []);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.strictEqual(newTextEls.length, 0);
});

test('does nothing when previousLog is null', () => {
  const before = createdElements.length;
  triggerFloatingTextFromLog(['test'], null);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.strictEqual(newTextEls.length, 0);
});

test('detects player strike damage', () => {
  setupMockCards();
  const prev = ['A wild Slime appears.'];
  const curr = [...prev, 'You strike for 12 damage.'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--damage'));
  assert.ok(newTextEls.length > 0, 'Should create damage text for strike');
  assert.strictEqual(newTextEls[0].textContent, '-12');
});

test('detects enemy damage to player', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'Slime slams you for 8 damage.'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--damage'));
  assert.ok(newTextEls.length > 0, 'Should create damage text for enemy attack');
  assert.strictEqual(newTextEls[0].textContent, '-8');
});

test('detects healing', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'You drink a potion and heal 20 HP.'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--heal'));
  assert.ok(newTextEls.length > 0, 'Should create heal text');
  assert.strictEqual(newTextEls[0].textContent, '+20');
});

test('detects miss', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'Your attack misses! (Blinded)'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--miss'));
  assert.ok(newTextEls.length > 0, 'Should create miss text');
});

test('detects poison damage', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'Slime takes 5 poison damage!'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--status'));
  assert.ok(newTextEls.length > 0, 'Should create status damage text');
  assert.strictEqual(newTextEls[0].textContent, '-5');
});

test('detects shield break', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'Enemy shields broken!'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--shield'));
  assert.ok(newTextEls.length > 0, 'Should create shield break text');
});

test('detects ability elemental damage', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'Slime takes 15 fire damage!'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => 
    e.className.includes('floating-text--damage') || e.className.includes('floating-text--critical')
  );
  assert.ok(newTextEls.length > 0, 'Should create damage text for ability');
  assert.strictEqual(newTextEls[0].textContent, '-15');
});

test('detects thrown item damage', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'You throw Bomb for 25 fire damage!'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--damage'));
  assert.ok(newTextEls.length > 0, 'Should create damage text for throw');
  assert.strictEqual(newTextEls[0].textContent, '-25');
});

test('handles multiple new log entries', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'You strike for 10 damage.', 'Slime slams you for 5 damage.'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.ok(newTextEls.length >= 2, `Should create at least 2 floating texts, got ${newTextEls.length}`);
});

test('does nothing for non-combat log messages', () => {
  setupMockCards();
  const prev = ['Your turn.'];
  const curr = [...prev, 'You brace for impact.'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.strictEqual(newTextEls.length, 0, 'Should not create text for defend action');
});

test('does nothing when current log is shorter than previous', () => {
  setupMockCards();
  const prev = ['Line 1', 'Line 2', 'Line 3'];
  const curr = ['Line 1'];
  const before = createdElements.length;
  triggerFloatingTextFromLog(curr, prev);
  const newTextEls = createdElements.slice(before).filter(e => e.className.includes('floating-text--'));
  assert.strictEqual(newTextEls.length, 0);
});

// --- Summary ---
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
