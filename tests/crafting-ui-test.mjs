import assert from 'node:assert/strict';

const loadModule = async () => {
  const module = await import('../src/crafting-ui.js');
  assert.ok(module, 'crafting-ui module should load');
};

await loadModule();
