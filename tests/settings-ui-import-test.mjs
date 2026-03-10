import assert from 'node:assert/strict';

const modulePath = '../src/settings-ui.js';

const run = async () => {
  try {
    const settingsModule = await import(modulePath);
    assert.ok(settingsModule, 'Expected settings UI module to load.');
    console.log('[settings-ui-import-test] Imported', modulePath, 'successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[settings-ui-import-test] Failed to import', modulePath);
    console.error(error);
    process.exit(1);
  }
};

run();
