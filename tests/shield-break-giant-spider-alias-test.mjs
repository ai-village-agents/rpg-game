import test from 'node:test';
import assert from 'node:assert/strict';

import { getEnemyShieldData } from '../src/shield-break.js';

test('shield-break: giant-spider uses intended shield config (alias regression)', () => {
  const data = getEnemyShieldData('giant-spider');
  assert.equal(data.shieldCount, 3);
  assert.deepStrictEqual(data.weaknesses, ['fire', 'lightning']);
});
