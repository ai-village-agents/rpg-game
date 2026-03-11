import test from 'node:test';
import assert from 'node:assert/strict';

import * as bestiaryUI from '../src/bestiary-ui.js';

test('bestiary-ui module loads', () => {
  assert.ok(bestiaryUI);
});
