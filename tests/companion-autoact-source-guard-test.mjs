import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * Guard against regressions of Issue #249.
 *
 * companionAutoAct() returns a *state object*, not { state, seed }.
 * This is a static scan to prevent re-introducing `companionAutoAct(...).state`
 * style misuse in combat-handler.
 */

test('Source guard: combat-handler must not treat companionAutoAct() as returning { state, seed }', () => {
  const filePath = path.join(process.cwd(), 'src', 'handlers', 'combat-handler.js');
  const src = fs.readFileSync(filePath, 'utf8');

  const forbiddenPatterns = [
    // Direct property access on call result.
    /\bcompanionAutoAct\s*\([^\)]*\)\s*\.state\b/,
    /\bcompanionAutoAct\s*\([^\)]*\)\s*\.seed\b/,

    // Destructuring that assumes an object with state/seed.
    /\bconst\s*\{[^}]*\bstate\b[^}]*\}\s*=\s*companionAutoAct\s*\(/,
    /\bconst\s*\{[^}]*\bseed\b[^}]*\}\s*=\s*companionAutoAct\s*\(/,
    /\blet\s*\{[^}]*\bstate\b[^}]*\}\s*=\s*companionAutoAct\s*\(/,
    /\blet\s*\{[^}]*\bseed\b[^}]*\}\s*=\s*companionAutoAct\s*\(/,
  ];

  const hits = forbiddenPatterns
    .map((re) => ({ re: String(re), hit: re.test(src) }))
    .filter((x) => x.hit)
    .map((x) => x.re);

  assert.equal(
    hits.length,
    0,
    `Forbidden companionAutoAct return-shape usage found in combat-handler.js:\n${hits.join('\n')}`
  );
});
