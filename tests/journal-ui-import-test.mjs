import test from 'node:test';
import assert from 'node:assert/strict';

test('journal ui module imports without crashing', async () => {
  const module = await import('../src/journal-ui.js');
  assert.ok(module, 'Expected journal-ui module to load');
});
