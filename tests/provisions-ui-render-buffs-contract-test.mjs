import test from 'node:test';
import assert from 'node:assert/strict';

// Sanity import test for provisions UI renderer. Node-only; no DOM.
// Verifies the module exists and its primary renderer returns a string
// when called with a minimal mock state.

test('renderProvisionBuffs imports and returns a string', async () => {
  const mod = await import('../src/provisions-ui.js');
  assert.equal(typeof mod.renderProvisionBuffs, 'function', 'renderProvisionBuffs should be exported');
  // Minimal state; renderer should handle missing/empty data gracefully.
  const mockState = { inventory: {}, player: {}, provisions: {} };
  const out = mod.renderProvisionBuffs(mockState);
  assert.equal(typeof out, 'string', 'renderer should return a string');
});
