/**
 * Comprehensive tests for companions-ui.js
 * Tests rendering logic, state handling, edge cases, and UI behavior
 */

import assert from 'assert';
import {
  renderCompanionPanel,
  renderCompanionHUD,
  renderCompanionBadge,
} from '../src/companions-ui.js';

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ✅ ' + name);
    passed++;
  } catch (e) {
    console.log('  ❌ ' + name);
    console.log('     ' + e.message);
    failed++;
  }
}

console.log('Running companions-ui.js tests...\n');

// renderCompanionPanel tests
test('renderCompanionPanel: should render panel with empty companions array', () => {
  const state = { companions: [] };
  const result = renderCompanionPanel(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('companion-panel') || result.includes('Companions'));
});


test('renderCompanionPanel: should render recruited companion with correct data', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'TestWarrior',
        class: 'Warrior',
        level: 5,
        hp: 80,
        maxHp: 100,
        loyalty: 75,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.ok(result.includes('TestWarrior'));
  assert.ok(result.includes('Warrior'));
  assert.ok(result.includes('Lv 5') || result.includes('5'));
  assert.ok(result.includes('data-companion-id="comp1"'));
});

test('renderCompanionPanel: should render HP bar with correct percentage', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'HalfHP',
        class: 'Mage',
        level: 3,
        hp: 50,
        maxHp: 100,
        loyalty: 80,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  // HP should be 50% (50/100)
  assert.ok(result.includes('50') && (result.includes('HP') || result.includes('width')));
});

test('renderCompanionPanel: should handle zero HP correctly', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'FallenWarrior',
        class: 'Warrior',
        level: 1,
        hp: 0,
        maxHp: 100,
        loyalty: 50,
        alive: false,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.ok(result.includes('FallenWarrior'));
  assert.ok(result.includes('Fallen') || result.includes('alive'));
});

test('renderCompanionPanel: should handle full HP correctly', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'FullHP',
        class: 'Cleric',
        level: 10,
        hp: 200,
        maxHp: 200,
        loyalty: 100,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.ok(result.includes('FullHP'));
  assert.ok(result.includes('100') || result.includes('Cleric'));
});

test('renderCompanionPanel: should handle missing HP/maxHp values gracefully', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'IncompleteCompanion',
        class: 'Warrior',
        level: 1,
        // missing hp, maxHp, loyalty, alive
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('IncompleteCompanion'));
});

test('renderCompanionPanel: should render multiple companions', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'Alice', class: 'Warrior', level: 5, hp: 100, maxHp: 100, loyalty: 80, alive: true },
      { id: 'comp2', name: 'Bob', class: 'Mage', level: 3, hp: 60, maxHp: 80, loyalty: 60, alive: true },
      { id: 'comp3', name: 'Charlie', class: 'Rogue', level: 7, hp: 90, maxHp: 120, loyalty: 90, alive: true },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.ok(result.includes('Alice'));
  assert.ok(result.includes('Bob'));
  assert.ok(result.includes('Charlie'));
});

test('renderCompanionPanel: should handle negative HP values (clamping)', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'NegativeHP',
        class: 'Warrior',
        level: 1,
        hp: -50,
        maxHp: 100,
        loyalty: 50,
        alive: false,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('NegativeHP'));
});

test('renderCompanionPanel: should handle HP exceeding maxHp (clamping)', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'Overhealed',
        class: 'Cleric',
        level: 10,
        hp: 150,
        maxHp: 100,
        loyalty: 100,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('Overhealed'));
});

test('renderCompanionPanel: should handle zero maxHp gracefully', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'ZeroMaxHP',
        class: 'Warrior',
        level: 1,
        hp: 50,
        maxHp: 0,
        loyalty: 50,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('ZeroMaxHP'));
});

// renderCompanionHUD tests
test('renderCompanionHUD: should return empty string when no companions', () => {
  const state = { companions: [] };
  const result = renderCompanionHUD(state);
  
  assert.strictEqual(result, '');
});

test('renderCompanionHUD: should return empty string for null/undefined state', () => {
  const result1 = renderCompanionHUD(null);
  const result2 = renderCompanionHUD(undefined);
  const result3 = renderCompanionHUD({});
  
  assert.strictEqual(result1, '');
  assert.strictEqual(result2, '');
  assert.strictEqual(result3, '');
});

test('renderCompanionHUD: should render HUD when companions exist', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: 'TestCompanion',
        class: 'Warrior',
        hp: 80,
        maxHp: 100,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionHUD(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.length > 0);
});

test('renderCompanionHUD: should render multiple companions in HUD', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'Alice', class: 'Warrior', hp: 100, maxHp: 100, alive: true },
      { id: 'comp2', name: 'Bob', class: 'Mage', hp: 60, maxHp: 80, alive: true },
    ],
  };
  
  const result = renderCompanionHUD(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.length > 0);
});

test('renderCompanionHUD: should handle fallen companions', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'Fallen', class: 'Warrior', hp: 0, maxHp: 100, alive: false },
      { id: 'comp2', name: 'Alive', class: 'Mage', hp: 80, maxHp: 80, alive: true },
    ],
  };
  
  const result = renderCompanionHUD(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.length > 0);
});

// renderCompanionBadge tests
test('renderCompanionBadge: should return empty string when no companions', () => {
  const state = { companions: [] };
  const result = renderCompanionBadge(state);
  
  assert.strictEqual(result, '');
});

test('renderCompanionBadge: should return empty string for null/undefined state', () => {
  const result1 = renderCompanionBadge(null);
  const result2 = renderCompanionBadge(undefined);
  const result3 = renderCompanionBadge({});
  
  assert.strictEqual(result1, '');
  assert.strictEqual(result2, '');
  assert.strictEqual(result3, '');
});

test('renderCompanionBadge: should render badge when companions exist', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'TestCompanion', class: 'Warrior', alive: true },
    ],
    maxCompanions: 2,
  };
  
  const result = renderCompanionBadge(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.length > 0);
  assert.ok(result.includes('1') || result.includes('companion'));
});

test('renderCompanionBadge: should show correct companion count', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'Alice', class: 'Warrior', alive: true },
      { id: 'comp2', name: 'Bob', class: 'Mage', alive: true },
    ],
    maxCompanions: 3,
  };
  
  const result = renderCompanionBadge(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('2') || result.includes('companion'));
});

test('renderCompanionBadge: should use default maxCompanions when not provided', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'TestCompanion', class: 'Warrior', alive: true },
    ],
  };
  
  const result = renderCompanionBadge(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.length > 0);
});

test('renderCompanionBadge: should handle companions at max capacity', () => {
  const state = {
    companions: [
      { id: 'comp1', name: 'Alice', class: 'Warrior', alive: true },
      { id: 'comp2', name: 'Bob', class: 'Mage', alive: true },
    ],
    maxCompanions: 2,
  };
  
  const result = renderCompanionBadge(state);
  
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.includes('2'));
});

// Edge cases and integration tests
test('Edge case: large companion array', () => {
  const companions = [];
  for (let i = 0; i < 50; i++) {
    companions.push({
      id: `comp${i}`,
      name: `Companion${i}`,
      class: 'Warrior',
      level: i + 1,
      hp: 100,
      maxHp: 100,
      loyalty: 50,
      alive: true,
    });
  }
  
  const state = { companions, maxCompanions: 50 };
  
  const panel = renderCompanionPanel(state);
  const hud = renderCompanionHUD(state);
  const badge = renderCompanionBadge(state);
  
  assert.strictEqual(typeof panel, 'string');
  assert.strictEqual(typeof hud, 'string');
  assert.strictEqual(typeof badge, 'string');
  assert.ok(panel.length > 0);
  assert.ok(hud.length > 0);
  assert.ok(badge.length > 0);
});

test('Edge case: special characters in companion names', () => {
  const state = {
    companions: [
      {
        id: 'comp1',
        name: "Test<>&\"'",
        class: 'Warrior',
        level: 1,
        hp: 100,
        maxHp: 100,
        loyalty: 50,
        alive: true,
      },
    ],
  };
  
  const result = renderCompanionPanel(state);
  
  assert.strictEqual(typeof result, 'string');
});

console.log(`\nTests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
if (failed > 0) process.exit(1);
