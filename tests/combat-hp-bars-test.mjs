import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCombatHpSection } from '../src/combat-hp-bars.js';

test('renderCombatHpSection: renders Shield bar for plural shields/maxShields shape', () => {
  const html = renderCombatHpSection({ hp: 10, maxHp: 20, shields: 2, maxShields: 5 });

  assert.match(html, /Shield/);
  // The bar text is escaped, but numeric formatting is plain.
  assert.match(html, /2\s*\/\s*5/);
});

test('renderCombatHpSection: renders Shield bar for singular shield/maxShield shape', () => {
  const html = renderCombatHpSection({ hp: 10, maxHp: 20, shield: 1, maxShield: 3 });

  assert.match(html, /Shield/);
  assert.match(html, /1\s*\/\s*3/);
});
