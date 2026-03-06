/**
 * Tests for Settings Module
 */
import { strict as assert } from 'assert';
import { 
  getDefaultSettings,
  loadSettings,
  saveSettings,
  updateSetting,
  getSetting,
  resetSettings 
} from '../src/settings.js';

// Mock localStorage for Node environment
global.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
  }
}

console.log('=== Settings Module Tests ===\n');

// Reset localStorage between tests
function setup() {
  localStorage.clear();
}

// getDefaultSettings tests
test('getDefaultSettings returns object with audio section', () => {
  setup();
  const defaults = getDefaultSettings();
  assert.equal(typeof defaults.audio, 'object');
  assert.equal(typeof defaults.audio.masterVolume, 'number');
  assert.equal(defaults.audio.masterVolume, 0.7);
});

test('getDefaultSettings returns object with display section', () => {
  setup();
  const defaults = getDefaultSettings();
  assert.equal(typeof defaults.display, 'object');
  assert.equal(defaults.display.showDamageNumbers, true);
});

test('getDefaultSettings returns object with gameplay section', () => {
  setup();
  const defaults = getDefaultSettings();
  assert.equal(typeof defaults.gameplay, 'object');
  assert.equal(defaults.gameplay.autoSave, true);
});

test('getDefaultSettings returns muted as false by default', () => {
  setup();
  const defaults = getDefaultSettings();
  assert.equal(defaults.audio.muted, false);
});

// loadSettings tests
test('loadSettings returns defaults when localStorage is empty', () => {
  setup();
  const settings = loadSettings();
  const defaults = getDefaultSettings();
  assert.deepEqual(settings, defaults);
});

test('loadSettings loads saved settings', () => {
  setup();
  const custom = { audio: { masterVolume: 0.5 } };
  localStorage.setItem('aiVillageRpgSettings', JSON.stringify(custom));
  const loaded = loadSettings();
  assert.equal(loaded.audio.masterVolume, 0.5);
});

test('loadSettings merges with defaults for missing keys', () => {
  setup();
  const partial = { audio: { muted: true } };
  localStorage.setItem('aiVillageRpgSettings', JSON.stringify(partial));
  const loaded = loadSettings();
  assert.equal(loaded.audio.muted, true);
  assert.equal(loaded.audio.masterVolume, 0.7); // default preserved
  assert.equal(loaded.display.showDamageNumbers, true); // default preserved
});

test('loadSettings handles invalid JSON gracefully', () => {
  setup();
  localStorage.setItem('aiVillageRpgSettings', 'not valid json{');
  const loaded = loadSettings();
  const defaults = getDefaultSettings();
  assert.deepEqual(loaded, defaults);
});

// saveSettings tests
test('saveSettings persists settings to localStorage', () => {
  setup();
  const settings = { audio: { muted: true } };
  saveSettings(settings);
  const raw = localStorage.getItem('aiVillageRpgSettings');
  assert.equal(JSON.parse(raw).audio.muted, true);
});

// updateSetting tests
test('updateSetting updates nested path correctly', () => {
  setup();
  const settings = getDefaultSettings();
  const updated = updateSetting(settings, 'audio.masterVolume', 0.3);
  assert.equal(updated.audio.masterVolume, 0.3);
  assert.equal(settings.audio.masterVolume, 0.7); // original unchanged
});

test('updateSetting handles deep paths', () => {
  setup();
  const settings = getDefaultSettings();
  const updated = updateSetting(settings, 'display.showDamageNumbers', false);
  assert.equal(updated.display.showDamageNumbers, false);
  assert.equal(updated.display.showStatusIcons, true); // sibling unchanged
});

test('updateSetting returns new object (immutability)', () => {
  setup();
  const settings = getDefaultSettings();
  const updated = updateSetting(settings, 'gameplay.autoSave', false);
  assert.notEqual(settings, updated);
  assert.notEqual(settings.gameplay, updated.gameplay);
});

// getSetting tests
test('getSetting retrieves value by path', () => {
  setup();
  const settings = getDefaultSettings();
  const value = getSetting(settings, 'audio.sfxVolume');
  assert.equal(value, 1.0);
});

test('getSetting returns undefined for invalid path', () => {
  setup();
  const settings = getDefaultSettings();
  const value = getSetting(settings, 'nonexistent.path');
  assert.equal(value, undefined);
});

test('getSetting handles partial path', () => {
  setup();
  const settings = getDefaultSettings();
  const audio = getSetting(settings, 'audio');
  assert.equal(typeof audio, 'object');
  assert.equal(audio.masterVolume, 0.7);
});

// resetSettings tests
test('resetSettings clears custom settings and returns defaults', () => {
  setup();
  const custom = { audio: { muted: true, masterVolume: 0.1 } };
  saveSettings(custom);
  const reset = resetSettings();
  const defaults = getDefaultSettings();
  assert.deepEqual(reset, defaults);
  assert.equal(loadSettings().audio.muted, false);
});

// Edge cases
test('updateSetting with single-level path', () => {
  setup();
  const settings = { simple: 'value' };
  const updated = updateSetting(settings, 'simple', 'newValue');
  assert.equal(updated.simple, 'newValue');
});

test('settings preserve all audio fields', () => {
  setup();
  const defaults = getDefaultSettings();
  assert.equal(typeof defaults.audio.sfxVolume, 'number');
  assert.equal(typeof defaults.audio.musicVolume, 'number');
  assert.equal(defaults.audio.sfxVolume, 1.0);
  assert.equal(defaults.audio.musicVolume, 0.5);
});

test('settings preserve gameplay options', () => {
  setup();
  const defaults = getDefaultSettings();
  assert.equal(defaults.gameplay.confirmFlee, true);
  assert.equal(defaults.gameplay.showTutorialHints, true);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
