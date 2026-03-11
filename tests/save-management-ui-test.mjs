/**
 * Save Management UI Import Test
 * Ensures the module loads and exports the expected API surface.
 * Run: node tests/save-management-ui-test.mjs
 */

import assert from 'node:assert/strict';

const modulePath = '../src/save-management-ui.js';

console.log('[save-management-ui-test] importing', modulePath);

const saveManagementUI = await import(modulePath);

const expectedExports = [
  'renderSaveSlotCard',
  'renderSaveManagementPanel',
  'handleSlotAction',
  'handleImport',
  'initSaveManagementUI'
];

for (const name of expectedExports) {
  assert.equal(typeof saveManagementUI[name], 'function', `${name} should be exported as a function`);
}

console.log('[save-management-ui-test] import succeeded with expected exports');
