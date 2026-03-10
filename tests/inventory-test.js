import assert from 'node:assert/strict';

const MODULE_PATH = '../src/inventory.js';

try {
  const module = await import(MODULE_PATH);
  assert.ok(module, 'Expected inventory UI module to import.');
  console.log('[inventory-ui-test] Imported', MODULE_PATH, 'successfully.');
} catch (error) {
  console.error('[inventory-ui-test] Failed to import', MODULE_PATH);
  console.error(error);
  process.exit(1);
}
