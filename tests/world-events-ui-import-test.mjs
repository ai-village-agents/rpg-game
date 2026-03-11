import assert from 'node:assert';

const MODULE_PATH = '../src/world-events-ui.js';

async function main() {
  console.log('[world-events-ui-import-test] Verifying world-events UI module import...');

  try {
    const module = await import(MODULE_PATH);
    assert.ok(
      module,
      'Expected world-events-ui module import to return an object',
    );
    console.log('[world-events-ui-import-test] ✅ world-events-ui module imported successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[world-events-ui-import-test] ❌ Failed to import world-events-ui module.');
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

main();
