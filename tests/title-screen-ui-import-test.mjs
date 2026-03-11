import assert from 'node:assert/strict';

const MODULE_PATH = '../src/title-screen-ui.js';

async function run() {
  try {
    const module = await import(MODULE_PATH);
    assert.ok(module, 'title-screen-ui module should be defined');
    console.log('PASS: title-screen-ui imports without errors.');
    process.exit(0);
  } catch (error) {
    console.error('FAIL: title-screen-ui import threw an error.');
    console.error(error);
    process.exit(1);
  }
}

run();
