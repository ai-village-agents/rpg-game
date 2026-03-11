import assert from 'node:assert';

const MODULE_PATH = '../src/shop-ui.js';

async function main() {
  console.log('[shop-ui-import-test] Verifying shop UI module import...');

  try {
    const module = await import(MODULE_PATH);
    assert.ok(
      module,
      'Expected shop-ui module import to return an object',
    );
    console.log('[shop-ui-import-test] ✅ shop-ui module imported successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[shop-ui-import-test] ❌ Failed to import shop-ui module.');
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

main();
