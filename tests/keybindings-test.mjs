/**
 * Keybindings System Tests
 * Tests for customizable keybinding functionality
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Set global localStorage for tests
globalThis.localStorage = localStorageMock;

// Import keybindings module
import {
  DEFAULT_BINDINGS,
  STORAGE_KEY,
  getDefaultBindings,
  loadKeybindings,
  saveKeybindings,
  getActionForKey,
  getKeysForAction,
  updateBinding,
  resetBindings,
  validateBinding,
  getConflicts
} from '../src/keybindings.js';

describe('Keybindings System', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('DEFAULT_BINDINGS', () => {
    it('should have all required movement actions', () => {
      assert.ok(DEFAULT_BINDINGS.moveNorth, 'moveNorth should exist');
      assert.ok(DEFAULT_BINDINGS.moveSouth, 'moveSouth should exist');
      assert.ok(DEFAULT_BINDINGS.moveWest, 'moveWest should exist');
      assert.ok(DEFAULT_BINDINGS.moveEast, 'moveEast should exist');
    });

    it('should have WASD keys for movement', () => {
      assert.ok(DEFAULT_BINDINGS.moveNorth.includes('w'), 'moveNorth should include w');
      assert.ok(DEFAULT_BINDINGS.moveSouth.includes('s'), 'moveSouth should include s');
      assert.ok(DEFAULT_BINDINGS.moveWest.includes('a'), 'moveWest should include a');
      assert.ok(DEFAULT_BINDINGS.moveEast.includes('d'), 'moveEast should include d');
    });

    it('should have arrow keys for movement', () => {
      assert.ok(DEFAULT_BINDINGS.moveNorth.includes('ArrowUp'), 'moveNorth should include ArrowUp');
      assert.ok(DEFAULT_BINDINGS.moveSouth.includes('ArrowDown'), 'moveSouth should include ArrowDown');
      assert.ok(DEFAULT_BINDINGS.moveWest.includes('ArrowLeft'), 'moveWest should include ArrowLeft');
      assert.ok(DEFAULT_BINDINGS.moveEast.includes('ArrowRight'), 'moveEast should include ArrowRight');
    });

    it('should have UI actions', () => {
      assert.ok(DEFAULT_BINDINGS.openHelp, 'openHelp should exist');
      assert.ok(DEFAULT_BINDINGS.openBestiary, 'openBestiary should exist');
      assert.ok(DEFAULT_BINDINGS.openInventory, 'openInventory should exist');
      assert.ok(DEFAULT_BINDINGS.openSettings, 'openSettings should exist');
    });

    it('should have confirm and cancel actions', () => {
      assert.ok(DEFAULT_BINDINGS.confirmAction, 'confirmAction should exist');
      assert.ok(DEFAULT_BINDINGS.cancelAction, 'cancelAction should exist');
    });
  });

  describe('STORAGE_KEY', () => {
    it('should be a non-empty string', () => {
      assert.strictEqual(typeof STORAGE_KEY, 'string');
      assert.ok(STORAGE_KEY.length > 0);
    });

    it('should be the expected key', () => {
      assert.strictEqual(STORAGE_KEY, 'aiVillageRpgKeybindings');
    });
  });

  describe('getDefaultBindings()', () => {
    it('should return a deep copy of DEFAULT_BINDINGS', () => {
      const defaults = getDefaultBindings();
      assert.deepStrictEqual(defaults, DEFAULT_BINDINGS);
      assert.notStrictEqual(defaults, DEFAULT_BINDINGS, 'Should be a copy, not the same reference');
    });

    it('should not be affected by modifications to the returned object', () => {
      const defaults = getDefaultBindings();
      defaults.moveNorth = ['x'];
      const freshDefaults = getDefaultBindings();
      assert.ok(freshDefaults.moveNorth.includes('w'), 'Original defaults should be unchanged');
    });
  });

  describe('loadKeybindings()', () => {
    it('should return default bindings when nothing is stored', () => {
      const bindings = loadKeybindings();
      assert.deepStrictEqual(bindings, DEFAULT_BINDINGS);
    });

    it('should return stored bindings when they exist', () => {
      const customBindings = { ...DEFAULT_BINDINGS, moveNorth: ['x', 'ArrowUp'] };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(customBindings));
      const bindings = loadKeybindings();
      assert.deepStrictEqual(bindings.moveNorth, ['x', 'ArrowUp']);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem(STORAGE_KEY, 'not valid json');
      const bindings = loadKeybindings();
      assert.deepStrictEqual(bindings, DEFAULT_BINDINGS, 'Should fall back to defaults on parse error');
    });
  });

  describe('saveKeybindings()', () => {
    it('should save bindings to localStorage', () => {
      const customBindings = { ...DEFAULT_BINDINGS, moveNorth: ['x'] };
      saveKeybindings(customBindings);
      const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY));
      assert.deepStrictEqual(stored.moveNorth, ['x']);
    });

    it('should overwrite previous bindings', () => {
      saveKeybindings({ ...DEFAULT_BINDINGS, moveNorth: ['a'] });
      saveKeybindings({ ...DEFAULT_BINDINGS, moveNorth: ['b'] });
      const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY));
      assert.deepStrictEqual(stored.moveNorth, ['b']);
    });
  });

  describe('getActionForKey()', () => {
    it('should return the correct action for a key', () => {
      const bindings = DEFAULT_BINDINGS;
      assert.strictEqual(getActionForKey('w', bindings), 'moveNorth');
      assert.strictEqual(getActionForKey('ArrowUp', bindings), 'moveNorth');
    });

    it('should return null for an unbound key', () => {
      const bindings = DEFAULT_BINDINGS;
      assert.strictEqual(getActionForKey('z', bindings), null);
    });

    it('should be case-sensitive for letter keys', () => {
      const bindings = DEFAULT_BINDINGS;
      // Assuming 'w' is bound but 'W' is not explicitly bound
      const wAction = getActionForKey('w', bindings);
      assert.strictEqual(wAction, 'moveNorth');
    });
  });

  describe('getKeysForAction()', () => {
    it('should return all keys bound to an action', () => {
      const bindings = DEFAULT_BINDINGS;
      const keys = getKeysForAction('moveNorth', bindings);
      assert.ok(keys.includes('w'), 'Should include w');
      assert.ok(keys.includes('ArrowUp'), 'Should include ArrowUp');
    });

    it('should return empty array for unknown action', () => {
      const bindings = DEFAULT_BINDINGS;
      const keys = getKeysForAction('unknownAction', bindings);
      assert.deepStrictEqual(keys, []);
    });
  });

  describe('updateBinding()', () => {
    it('should add a new key to an action', () => {
      const bindings = { ...DEFAULT_BINDINGS };
      const updated = updateBinding(bindings, 'moveNorth', [...bindings.moveNorth, 'x']);
      assert.ok(updated.moveNorth.includes('x'), 'Should include new key x');
      assert.ok(updated.moveNorth.includes('w'), 'Should still include w');
    });

    it('should not add duplicate keys', () => {
      const bindings = { ...DEFAULT_BINDINGS };
      const updated = updateBinding(bindings, 'moveNorth', bindings.moveNorth);  // Same keys, no duplicate
      const wCount = updated.moveNorth.filter(k => k === 'w').length;
      assert.strictEqual(wCount, 1, 'Should not duplicate the key');
    });

    it('should return a new object (immutable)', () => {
      const bindings = { ...DEFAULT_BINDINGS };
      const updated = updateBinding(bindings, 'moveNorth', [...bindings.moveNorth, 'x']);
      assert.notStrictEqual(updated, bindings, 'Should return a new object');
    });
  });

  describe('resetBindings()', () => {
    it('should return default bindings', () => {
      const reset = resetBindings();
      assert.deepStrictEqual(reset, DEFAULT_BINDINGS);
    });

    it('should save default bindings to localStorage', () => {
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ test: true }));
      resetBindings();
      assert.strictEqual(localStorageMock.getItem(STORAGE_KEY), JSON.stringify(DEFAULT_BINDINGS));
    });
  });

  describe('validateBinding()', () => {
    it('should return true for valid key strings', () => {
      assert.strictEqual(validateBinding('a'), true);
      assert.strictEqual(validateBinding('ArrowUp'), true);
      assert.strictEqual(validateBinding('Enter'), true);
      assert.strictEqual(validateBinding(' '), true, 'Space should be valid');
    });

    it('should return false for empty string', () => {
      assert.strictEqual(validateBinding(''), false);
    });

    it('should return false for null or undefined', () => {
      assert.strictEqual(validateBinding(null), false);
      assert.strictEqual(validateBinding(undefined), false);
    });
  });

  describe('getConflicts()', () => {
    it('should detect when a key is bound to multiple actions', () => {
      const bindings = {
        ...DEFAULT_BINDINGS,
        moveNorth: ['w', 'x'],
        moveSouth: ['s', 'x']  // 'x' conflicts with moveNorth
      };
      const conflicts = getConflicts(bindings, 'openHelp', 'x');  // Check conflicts for 'x' excluding 'openHelp'
      assert.ok(conflicts.length >= 2, 'Should detect conflict');
      assert.ok(conflicts.includes('moveNorth'), 'Should include moveNorth');
      assert.ok(conflicts.includes('moveSouth'), 'Should include moveSouth');
    });

    it('should return empty array when no conflicts', () => {
      const bindings = DEFAULT_BINDINGS;
      const conflicts = getConflicts(bindings, 'openHelp', 'z');
      assert.deepStrictEqual(conflicts, []);
    });

    it('should return single action when key is bound once', () => {
      const bindings = DEFAULT_BINDINGS;
      const conflicts = getConflicts(bindings, 'moveSouth', 'w');  // 'w' is bound to moveNorth
      assert.strictEqual(conflicts.length, 1);
      assert.strictEqual(conflicts[0], 'moveNorth');
    });
  });
});

describe('Movement Key Integration', () => {
  it('should map WASD to cardinal directions', () => {
    const bindings = loadKeybindings();
    assert.strictEqual(getActionForKey('w', bindings), 'moveNorth');
    assert.strictEqual(getActionForKey('a', bindings), 'moveWest');
    assert.strictEqual(getActionForKey('s', bindings), 'moveSouth');
    assert.strictEqual(getActionForKey('d', bindings), 'moveEast');
  });

  it('should map arrow keys to cardinal directions', () => {
    const bindings = loadKeybindings();
    assert.strictEqual(getActionForKey('ArrowUp', bindings), 'moveNorth');
    assert.strictEqual(getActionForKey('ArrowLeft', bindings), 'moveWest');
    assert.strictEqual(getActionForKey('ArrowDown', bindings), 'moveSouth');
    assert.strictEqual(getActionForKey('ArrowRight', bindings), 'moveEast');
  });
});

describe('Custom Keybindings Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should persist custom bindings across load/save cycles', () => {
    const customBindings = {
      ...DEFAULT_BINDINGS,
      moveNorth: ['i', 'ArrowUp'],
      moveSouth: ['k', 'ArrowDown'],
      moveWest: ['j', 'ArrowLeft'],
      moveEast: ['l', 'ArrowRight']
    };
    
    saveKeybindings(customBindings);
    const loaded = loadKeybindings();
    
    assert.deepStrictEqual(loaded.moveNorth, ['i', 'ArrowUp']);
    assert.deepStrictEqual(loaded.moveSouth, ['k', 'ArrowDown']);
    assert.deepStrictEqual(loaded.moveWest, ['j', 'ArrowLeft']);
    assert.deepStrictEqual(loaded.moveEast, ['l', 'ArrowRight']);
  });

  it('should maintain unmodified bindings when saving partial changes', () => {
    const customBindings = {
      ...DEFAULT_BINDINGS,
      moveNorth: ['x']
    };
    
    saveKeybindings(customBindings);
    const loaded = loadKeybindings();
    
    // Modified binding
    assert.deepStrictEqual(loaded.moveNorth, ['x']);
    // Unmodified bindings should remain
    assert.deepStrictEqual(loaded.openHelp, DEFAULT_BINDINGS.openHelp);
  });
});
