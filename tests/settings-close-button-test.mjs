/**
 * Tests for Settings Close Button Fix (Issue #176)
 * Verifies the settings panel includes a close button and it works correctly.
 */

import { renderSettingsPanel, getSettingsStyles, attachSettingsHandlers } from '../src/settings-ui.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

// Test 1: renderSettingsPanel includes close button
{
  const html = renderSettingsPanel({});
  assert(html.includes('btnCloseSettings'), 'Settings panel should include btnCloseSettings button');
  assert(html.includes('Close Settings'), 'Settings panel should include "Close Settings" text');
}

// Test 2: Close button appears before reset button
{
  const html = renderSettingsPanel({});
  const closeIdx = html.indexOf('btnCloseSettings');
  const resetIdx = html.indexOf('btnResetSettings');
  assert(closeIdx < resetIdx, 'Close button should appear before reset button');
}

// Test 3: Close button has proper structure
{
  const html = renderSettingsPanel({});
  assert(html.includes('<button id="btnCloseSettings">'), 'Close button should be a proper button element');
}

// Test 4: CSS includes close button styling
{
  const css = getSettingsStyles();
  assert(css.includes('#btnCloseSettings'), 'CSS should include close button styling');
  assert(css.includes('background:') || css.includes('background :'), 'Close button should have background color');
}

// Test 5: Settings panel renders all sections
{
  const html = renderSettingsPanel({
    audio: { muted: false, masterVolume: 0.7 },
    display: { showDamageNumbers: true },
    gameplay: { autoSave: true }
  });
  assert(html.includes('Audio'), 'Should render Audio section');
  assert(html.includes('Display'), 'Should render Display section');
  assert(html.includes('Gameplay'), 'Should render Gameplay section');
}

// Test 6: Settings panel with null/undefined settings
{
  const html1 = renderSettingsPanel(null);
  const html2 = renderSettingsPanel(undefined);
  assert(html1.includes('btnCloseSettings'), 'Should render close button with null settings');
  assert(html2.includes('btnCloseSettings'), 'Should render close button with undefined settings');
}

// Test 7: Close button is inside settings-actions div
{
  const html = renderSettingsPanel({});
  const actionsStart = html.indexOf('settings-actions');
  const closeBtn = html.indexOf('btnCloseSettings');
  assert(closeBtn > actionsStart, 'Close button should be inside settings-actions div');
}

console.log(`\nSettings Close Button Tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
