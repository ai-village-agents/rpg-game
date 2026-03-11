import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import * as HelpUI from '../src/help-ui.js';

describe('Help UI module', () => {
  it('imports without errors', () => {
    assert.ok(HelpUI !== undefined, 'help UI module should load and expose exports');
  });
});
