/**
 * Tests for Settings UI Module
 */
import { strict as assert } from 'assert';
import {
  renderSlider,
  renderCheckbox,
  renderSectionHeader,
  renderSettingsPanel,
  getSettingsStyles,
} from '../src/settings-ui.js';

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

console.log('=== Settings UI Module Tests ===\n');

// renderSlider tests
test('renderSlider creates range input with correct id', () => {
  const html = renderSlider('test-slider', 'Test Volume', 0.7);
  assert.ok(html.includes('id="test-slider"'));
});

test('renderSlider converts value to percentage', () => {
  const html = renderSlider('vol', 'Volume', 0.5);
  assert.ok(html.includes('value="50"'));
  assert.ok(html.includes('50%'));
});

test('renderSlider handles 0 value', () => {
  const html = renderSlider('vol', 'Volume', 0);
  assert.ok(html.includes('value="0"'));
  assert.ok(html.includes('0%'));
});

test('renderSlider handles 1 value (100%)', () => {
  const html = renderSlider('vol', 'Volume', 1);
  assert.ok(html.includes('value="100"'));
  assert.ok(html.includes('100%'));
});

test('renderSlider includes disabled attribute when disabled', () => {
  const html = renderSlider('vol', 'Volume', 0.5, true);
  assert.ok(html.includes('disabled'));
});

test('renderSlider does not include disabled when enabled', () => {
  const html = renderSlider('vol', 'Volume', 0.5, false);
  // Count occurrences - should only have 'disabled' in the conditional check area
  const disabledCount = (html.match(/disabled/g) || []).length;
  assert.equal(disabledCount, 0);
});

test('renderSlider escapes HTML in label', () => {
  const html = renderSlider('vol', '<script>alert(1)</script>', 0.5);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

// renderCheckbox tests
test('renderCheckbox creates checkbox input with correct id', () => {
  const html = renderCheckbox('test-check', 'Test Option', true);
  assert.ok(html.includes('id="test-check"'));
  assert.ok(html.includes('type="checkbox"'));
});

test('renderCheckbox includes checked when true', () => {
  const html = renderCheckbox('opt', 'Option', true);
  assert.ok(html.includes('checked'));
});

test('renderCheckbox excludes checked when false', () => {
  const html = renderCheckbox('opt', 'Option', false);
  assert.ok(!html.includes('checked'));
});

test('renderCheckbox escapes HTML in label', () => {
  const html = renderCheckbox('opt', '<b>Bold</b>', false);
  assert.ok(!html.includes('<b>'));
  assert.ok(html.includes('&lt;b&gt;'));
});

// renderSectionHeader tests
test('renderSectionHeader includes title and icon', () => {
  const html = renderSectionHeader('Audio', '🔊');
  assert.ok(html.includes('Audio'));
  assert.ok(html.includes('🔊'));
});

test('renderSectionHeader has correct class', () => {
  const html = renderSectionHeader('Test', '📝');
  assert.ok(html.includes('settings-section-header'));
});

test('renderSectionHeader escapes HTML in title', () => {
  const html = renderSectionHeader('<div>Dangerous</div>', '⚠️');
  assert.ok(!html.includes('<div>'));
  assert.ok(html.includes('&lt;div&gt;'));
});

// renderSettingsPanel tests
test('renderSettingsPanel renders complete panel', () => {
  const settings = {
    audio: { masterVolume: 0.8, sfxVolume: 1.0, musicVolume: 0.5, muted: false },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  assert.ok(html.includes('settings-panel'));
  assert.ok(html.includes('⚙️ Settings'));
});

test('renderSettingsPanel includes all three sections', () => {
  const settings = {
    audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 0.5, muted: false },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  assert.ok(html.includes('🔊')); // Audio
  assert.ok(html.includes('🖥️')); // Display
  assert.ok(html.includes('🎮')); // Gameplay
});

test('renderSettingsPanel includes volume sliders', () => {
  const settings = {
    audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 0.5, muted: false },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  assert.ok(html.includes('setting-master-volume'));
  assert.ok(html.includes('setting-sfx-volume'));
  assert.ok(html.includes('setting-music-volume'));
});

test('renderSettingsPanel includes mute checkbox', () => {
  const settings = {
    audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 0.5, muted: false },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  assert.ok(html.includes('setting-muted'));
  assert.ok(html.includes('Mute All Audio'));
});

test('renderSettingsPanel includes reset button', () => {
  const html = renderSettingsPanel({});
  assert.ok(html.includes('btnResetSettings'));
  assert.ok(html.includes('Reset to Defaults'));
});

test('renderSettingsPanel uses defaults for null settings', () => {
  const html = renderSettingsPanel(null);
  assert.ok(html.includes('settings-panel'));
  // Should use default value 70%
  assert.ok(html.includes('70%'));
});

test('renderSettingsPanel disables volume sliders when muted', () => {
  const settings = {
    audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 0.5, muted: true },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  // Sliders should be disabled
  assert.ok(html.includes('disabled'));
});

test('renderSettingsPanel includes display options', () => {
  const settings = {
    audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 0.5, muted: false },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  assert.ok(html.includes('setting-damage-numbers'));
  assert.ok(html.includes('setting-status-icons'));
  assert.ok(html.includes('setting-compact-log'));
});

test('renderSettingsPanel includes gameplay options', () => {
  const settings = {
    audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 0.5, muted: false },
    display: { showDamageNumbers: true, showStatusIcons: true, compactLog: false },
    gameplay: { autoSave: true, confirmFlee: true, showTutorialHints: true },
  };
  const html = renderSettingsPanel(settings);
  assert.ok(html.includes('setting-auto-save'));
  assert.ok(html.includes('setting-confirm-flee'));
  assert.ok(html.includes('setting-tutorial-hints'));
});

// getSettingsStyles tests
test('getSettingsStyles returns CSS string', () => {
  const css = getSettingsStyles();
  assert.equal(typeof css, 'string');
  assert.ok(css.length > 0);
});

test('getSettingsStyles includes panel styles', () => {
  const css = getSettingsStyles();
  assert.ok(css.includes('.settings-panel'));
});

test('getSettingsStyles includes row styles', () => {
  const css = getSettingsStyles();
  assert.ok(css.includes('.setting-row'));
});

test('getSettingsStyles includes slider styles', () => {
  const css = getSettingsStyles();
  assert.ok(css.includes('.setting-slider'));
});

test('getSettingsStyles includes checkbox styles', () => {
  const css = getSettingsStyles();
  assert.ok(css.includes('.setting-checkbox'));
});

test('getSettingsStyles includes disabled state styles', () => {
  const css = getSettingsStyles();
  assert.ok(css.includes('disabled'));
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
