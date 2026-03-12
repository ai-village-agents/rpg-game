import assert from 'node:assert/strict';
import test from 'node:test';

test('applyReducedMotion toggles class on documentElement', async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const toggles = [];

  globalThis.window = {};
  globalThis.document = {
    documentElement: {
      classList: {
        toggle: (cls, enabled) => {
          toggles.push([cls, enabled]);
        },
      },
    },
  };

  const { applyReducedMotion } = await import('../src/accessibility.js');

  applyReducedMotion(true);
  applyReducedMotion(false);

  assert.deepEqual(toggles, [
    ['reduced-motion', true],
    ['reduced-motion', false],
  ]);

  if (originalWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }

  if (originalDocument === undefined) {
    delete globalThis.document;
  } else {
    globalThis.document = originalDocument;
  }
});
