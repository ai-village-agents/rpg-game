import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import * as BossUI from '../src/boss-ui.js';

describe('Boss UI module', () => {
  it('imports without errors', () => {
    assert.ok(BossUI !== undefined, 'boss UI module should load and expose exports');
  });
});
