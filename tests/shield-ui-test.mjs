import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  renderShieldDisplay,
  renderWeaknessIcons,
  renderBreakState,
  getShieldIconClass,
  animateShieldBreak,
  renderShieldBreakHUD
} from '../src/shield-break-ui.js';

describe('renderShieldDisplay', () => {
  test('returns empty string for null or undefined enemy', () => {
    assert.equal(renderShieldDisplay(null), '');
    assert.equal(renderShieldDisplay(undefined), '');
  });

  test('renders full shields when current equals max', () => {
    const enemy = { maxShields: 3, currentShields: 3, isBroken: false };
    const output = renderShieldDisplay(enemy);
    assert.equal((output.match(/🛡/g) || []).length, 3);
    assert.equal((output.match(/○/g) || []).length, 0);
  });

  test('renders mix of full and empty shields', () => {
    const enemy = { maxShields: 3, currentShields: 1, isBroken: false };
    const output = renderShieldDisplay(enemy);
    assert.equal((output.match(/🛡/g) || []).length, 1);
    assert.equal((output.match(/○/g) || []).length, 2);
  });

  test('renders all empty when broken', () => {
    const enemy = { maxShields: 3, currentShields: 3, isBroken: true };
    const output = renderShieldDisplay(enemy);
    assert.equal((output.match(/🛡/g) || []).length, 0);
    assert.equal((output.match(/○/g) || []).length, 3);
  });

  test('returns div with empty content when maxShields is 0', () => {
    const enemy = { maxShields: 0, currentShields: 0, isBroken: false };
    const output = renderShieldDisplay(enemy);
    assert.equal(output, '<div class="shield-display"></div>');
  });
});

describe('renderWeaknessIcons', () => {
  test('returns empty string for empty array', () => {
    assert.equal(renderWeaknessIcons([]), '');
  });

  test('returns empty string for null', () => {
    assert.equal(renderWeaknessIcons(null), '');
  });

  test('renders single weakness icon with class', () => {
    const output = renderWeaknessIcons(['fire']);
    assert.match(output, /🔥/);
    assert.match(output, /weakness-icon/);
  });

  test('renders multiple weakness icons', () => {
    const output = renderWeaknessIcons(['fire', 'ice']);
    assert.match(output, /🔥/);
    assert.match(output, /❄️/);
  });
});

describe('renderBreakState', () => {
  test('returns empty string for non-broken enemy', () => {
    const enemy = { isBroken: false };
    assert.equal(renderBreakState(enemy), '');
  });

  test('renders broken state text with turn wording', () => {
    const enemy = { isBroken: true, breakTurnsRemaining: 1 };
    const output = renderBreakState(enemy);
    assert.match(output, /BROKEN/);
    assert.match(output, /turn/);
  });

  test('shows remaining turns when broken', () => {
    const enemy = { isBroken: true, breakTurnsRemaining: 2 };
    const output = renderBreakState(enemy);
    assert.match(output, /2/);
  });
});

describe('getShieldIconClass', () => {
  test('returns expected class names', () => {
    assert.equal(getShieldIconClass('full'), 'shield-full');
    assert.equal(getShieldIconClass('empty'), 'shield-empty');
    assert.equal(getShieldIconClass('broken'), 'shield-broken');
  });

  test('returns default class for unknown type', () => {
    assert.equal(getShieldIconClass('unknown'), 'shield-full');
  });
});

describe('animateShieldBreak', () => {
  test('returns empty string for non-broken enemy', () => {
    const enemy = { isBroken: false };
    assert.equal(animateShieldBreak(enemy), '');
  });

  test('returns animation class for broken enemy', () => {
    const enemy = { isBroken: true };
    assert.equal(animateShieldBreak(enemy), 'shield-break-animation');
  });

  test('returns empty string for null enemy', () => {
    assert.equal(animateShieldBreak(null), '');
  });
});

describe('renderShieldBreakHUD', () => {
  test('returns empty string for null enemy', () => {
    assert.equal(renderShieldBreakHUD(null), '');
  });

  test('renders hud container for normal enemy', () => {
    const enemy = { maxShields: 3, currentShields: 3, isBroken: false, weaknesses: [] };
    const output = renderShieldBreakHUD(enemy);
    assert.match(output, /shield-break-hud/);
  });

  test('includes shield display and break state for broken enemy', () => {
    const enemy = { maxShields: 2, currentShields: 1, isBroken: true, breakTurnsRemaining: 1, weaknesses: [] };
    const output = renderShieldBreakHUD(enemy);
    assert.match(output, /shield-display/);
    assert.match(output, /break-state-display/);
  });
});
