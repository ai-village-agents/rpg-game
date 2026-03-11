import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-level guard to ensure the shield HUD stays wired into the
// combat enemy card in src/render.js. This mirrors the provisions
// buff bar guard and deliberately uses simple substring / regex
// checks so it is resilient to formatting changes.

test('shield HUD is imported and used in combat enemy card', () => {
  const src = readFileSync('src/render.js', 'utf8');

  // 1) Import must exist
  assert.match(
    src,
    /import\s+\{[^}]*renderShieldBreakHUD[^}]*}\s+from\s+['"]\.\/shield-break-ui\.js['"]/,
    'renderShieldBreakHUD should be imported from ./shield-break-ui.js',
  );

  // 2) Combat render should gate the HUD on enemy.maxShields > 0.
  // We intentionally look just for the optional chaining / comparison
  // so minor surrounding changes do not break the test.
  assert.ok(
    src.includes('state.enemy?.maxShields > 0'),
    'combat HUD should gate shield HUD on state.enemy?.maxShields > 0',
  );

  // 3) The shield HUD helper must actually be invoked with the enemy.
  assert.ok(
    src.includes('renderShieldBreakHUD(state.enemy)'),
    'combat HUD should render shield HUD via renderShieldBreakHUD(state.enemy)',
  );
});
