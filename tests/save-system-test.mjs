/**
 * Tests for save-system.js and save-management-ui.js
 * Save System Improvements by Claude Opus 4.5
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null
  };
})();

globalThis.localStorage = localStorageMock;

// Import after setting up mocks
const saveSystem = await import('../src/save-system.js');

describe('Save System Constants', () => {
  it('AUTOSAVE_SLOT should be 4', () => {
    assert.strictEqual(saveSystem.AUTOSAVE_SLOT, 4);
  });

  it('AUTO_SAVE_TRIGGERS should contain expected triggers', () => {
    const expected = ['room_change', 'combat_victory', 'quest_complete', 'item_acquired', 'level_up'];
    assert.deepStrictEqual(saveSystem.AUTO_SAVE_TRIGGERS, expected);
  });

  it('AUTO_SAVE_TRIGGERS should have 5 items', () => {
    assert.strictEqual(saveSystem.AUTO_SAVE_TRIGGERS.length, 5);
  });
});

describe('Auto-save Enable/Disable', () => {
  beforeEach(() => {
    saveSystem.enableAutoSave();
  });

  it('enableAutoSave should return true', () => {
    const result = saveSystem.enableAutoSave();
    assert.strictEqual(result, true);
  });

  it('disableAutoSave should return false', () => {
    const result = saveSystem.disableAutoSave();
    assert.strictEqual(result, false);
  });

  it('isAutoSaveEnabled should reflect current state', () => {
    saveSystem.enableAutoSave();
    assert.strictEqual(saveSystem.isAutoSaveEnabled(), true);
    
    saveSystem.disableAutoSave();
    assert.strictEqual(saveSystem.isAutoSaveEnabled(), false);
  });

  it('toggling auto-save multiple times should work correctly', () => {
    saveSystem.enableAutoSave();
    assert.strictEqual(saveSystem.isAutoSaveEnabled(), true);
    saveSystem.disableAutoSave();
    assert.strictEqual(saveSystem.isAutoSaveEnabled(), false);
    saveSystem.enableAutoSave();
    assert.strictEqual(saveSystem.isAutoSaveEnabled(), true);
  });
});

describe('createSaveMetadata', () => {
  it('should create metadata from full state', () => {
    const state = {
      player: { name: 'TestHero', level: 5, classId: 'warrior', gold: 100 },
      turn: 42,
      version: 2,
      playTime: 3600
    };
    const meta = saveSystem.createSaveMetadata(state);
    
    assert.strictEqual(meta.playerName, 'TestHero');
    assert.strictEqual(meta.playerLevel, 5);
    assert.strictEqual(meta.playerClass, 'warrior');
    assert.strictEqual(meta.turn, 42);
    assert.strictEqual(meta.gold, 100);
    assert.strictEqual(meta.version, 2);
    assert.ok(meta.savedAt);
  });

  it('should use defaults for missing player data', () => {
    const state = { turn: 1, version: 1 };
    const meta = saveSystem.createSaveMetadata(state);
    
    assert.strictEqual(meta.playerName, 'Unknown Hero');
    assert.strictEqual(meta.playerLevel, 1);
    assert.strictEqual(meta.playerClass, 'Adventurer');
  });

  it('should handle null state gracefully', () => {
    const meta = saveSystem.createSaveMetadata(null);
    
    assert.strictEqual(meta.playerName, 'Unknown Hero');
    assert.strictEqual(meta.turn, 0);
    assert.strictEqual(meta.version, 1);
  });

  it('should handle undefined state gracefully', () => {
    const meta = saveSystem.createSaveMetadata(undefined);
    
    assert.strictEqual(meta.playerName, 'Unknown Hero');
    assert.strictEqual(meta.turn, 0);
  });
});

describe('formatSaveTimestamp', () => {
  it('should format valid ISO timestamp', () => {
    const result = saveSystem.formatSaveTimestamp('2026-03-09T10:15:00.000Z');
    assert.ok(result.includes('Mar'));
    assert.ok(result.includes('2026'));
  });

  it('should return Unknown for null input', () => {
    const result = saveSystem.formatSaveTimestamp(null);
    assert.strictEqual(result, 'Unknown');
  });

  it('should return Unknown for undefined input', () => {
    const result = saveSystem.formatSaveTimestamp(undefined);
    assert.strictEqual(result, 'Unknown');
  });

  it('should return Unknown for invalid date string', () => {
    const result = saveSystem.formatSaveTimestamp('not-a-date');
    assert.strictEqual(result, 'Unknown');
  });

  it('should return Unknown for empty string', () => {
    const result = saveSystem.formatSaveTimestamp('');
    assert.strictEqual(result, 'Unknown');
  });
});

describe('validateSaveData', () => {
  it('should validate complete save data', () => {
    const data = { player: { name: 'Hero' }, turn: 1, version: 1 };
    const result = saveSystem.validateSaveData(data);
    
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.missing.length, 0);
  });

  it('should detect missing player field', () => {
    const data = { turn: 1, version: 1 };
    const result = saveSystem.validateSaveData(data);
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.missing.includes('player'));
  });

  it('should detect missing turn field', () => {
    const data = { player: {}, version: 1 };
    const result = saveSystem.validateSaveData(data);
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.missing.includes('turn'));
  });

  it('should detect missing version field', () => {
    const data = { player: {}, turn: 1 };
    const result = saveSystem.validateSaveData(data);
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.missing.includes('version'));
  });

  it('should detect all missing fields for null', () => {
    const result = saveSystem.validateSaveData(null);
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.missing.length, 3);
  });

  it('should detect all missing fields for non-object', () => {
    const result = saveSystem.validateSaveData('not an object');
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.missing.length, 3);
  });
});

describe('triggerAutoSave', () => {
  beforeEach(() => {
    localStorageMock.clear();
    saveSystem.enableAutoSave();
  });

  it('should fail when auto-save is disabled', () => {
    saveSystem.disableAutoSave();
    const state = { player: { name: 'Hero' }, turn: 1, version: 1 };
    const result = saveSystem.triggerAutoSave(state, 'room_change');
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('disabled'));
  });

  it('should fail with null state', () => {
    const result = saveSystem.triggerAutoSave(null, 'room_change');
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('No game state'));
  });

  it('should fail with undefined state', () => {
    const result = saveSystem.triggerAutoSave(undefined, 'room_change');
    
    assert.strictEqual(result.success, false);
  });

  it('should succeed with valid state and reason', () => {
    const state = { player: { name: 'Hero' }, turn: 1, version: 1 };
    const result = saveSystem.triggerAutoSave(state, 'combat_victory');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.error, null);
  });

  it('should save to AUTOSAVE_SLOT', () => {
    const state = { player: { name: 'Hero' }, turn: 1, version: 1 };
    saveSystem.triggerAutoSave(state, 'level_up');
    
    const saved = localStorageMock.getItem('aiVillageRpg_slot_4');
    assert.ok(saved !== null);
    const parsed = JSON.parse(saved);
    assert.strictEqual(parsed.autoSave, true);
  });
});

describe('exportSaveToJSON', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return null for empty slot', () => {
    const result = saveSystem.exportSaveToJSON(0);
    assert.strictEqual(result, null);
  });

  it('should return null for invalid slot index', () => {
    const result = saveSystem.exportSaveToJSON(-1);
    assert.strictEqual(result, null);
  });

  it('should return null for slot index above max', () => {
    const result = saveSystem.exportSaveToJSON(10);
    assert.strictEqual(result, null);
  });

  it('should export valid save data as pretty JSON', () => {
    const data = { player: { name: 'Hero' }, turn: 5, version: 1 };
    localStorageMock.setItem('aiVillageRpg_slot_0', JSON.stringify(data));
    
    const result = saveSystem.exportSaveToJSON(0);
    assert.ok(result !== null);
    assert.ok(result.includes('\n')); // Pretty printed
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.player.name, 'Hero');
  });
});

describe('importSaveFromJSON', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should fail with invalid slot index', () => {
    const json = JSON.stringify({ player: {}, turn: 1, version: 1 });
    const result = saveSystem.importSaveFromJSON(json, -1);
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid slot'));
  });

  it('should fail with non-string input', () => {
    const result = saveSystem.importSaveFromJSON(123, 0);
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid JSON'));
  });

  it('should fail with invalid JSON', () => {
    const result = saveSystem.importSaveFromJSON('not valid json', 0);
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('parse'));
  });

  it('should fail with missing required fields', () => {
    const json = JSON.stringify({ someField: 'value' });
    const result = saveSystem.importSaveFromJSON(json, 0);
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Missing'));
  });

  it('should succeed with valid JSON and data', () => {
    const json = JSON.stringify({ player: { name: 'Hero' }, turn: 1, version: 1 });
    const result = saveSystem.importSaveFromJSON(json, 0);
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.error, null);
  });
});

describe('renameSave', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should fail with invalid slot index', () => {
    const result = saveSystem.renameSave(-1, 'New Name');
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid slot'));
  });

  it('should fail with empty slot', () => {
    const result = saveSystem.renameSave(0, 'New Name');
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('No save data'));
  });

  it('should succeed with valid slot and name', () => {
    const data = { player: {}, turn: 1, version: 1 };
    localStorageMock.setItem('aiVillageRpg_slot_0', JSON.stringify(data));
    
    const result = saveSystem.renameSave(0, 'My Save');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.error, null);
    
    const saved = JSON.parse(localStorageMock.getItem('aiVillageRpg_slot_0'));
    assert.strictEqual(saved.customName, 'My Save');
  });

  it('should trim whitespace from name', () => {
    const data = { player: {}, turn: 1, version: 1 };
    localStorageMock.setItem('aiVillageRpg_slot_0', JSON.stringify(data));
    
    saveSystem.renameSave(0, '  Trimmed Name  ');
    
    const saved = JSON.parse(localStorageMock.getItem('aiVillageRpg_slot_0'));
    assert.strictEqual(saved.customName, 'Trimmed Name');
  });
});

// Easter egg motif check
describe('Easter Egg Motif Check', () => {
  const forbiddenMotifs = ['egg', 'easter', 'rabbit', 'bunny', 'cockatrice', 'basilisk', 'yolk', 'omelet'];
  
  it('save-system.js should not contain forbidden motifs', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const content = fs.readFileSync(path.join(process.cwd(), 'src/save-system.js'), 'utf-8').toLowerCase();
    
    for (const motif of forbiddenMotifs) {
      assert.ok(!content.includes(motif), `Found forbidden motif: ${motif}`);
    }
  });

  it('save-management-ui.js should not contain forbidden motifs', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const content = fs.readFileSync(path.join(process.cwd(), 'src/save-management-ui.js'), 'utf-8').toLowerCase();
    
    for (const motif of forbiddenMotifs) {
      assert.ok(!content.includes(motif), `Found forbidden motif: ${motif}`);
    }
  });
});
