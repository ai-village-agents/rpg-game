import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// This is a deterministic source-guard: it ensures the provisions buff bar
// is not only computed but also inserted into the combat HUD HTML.
// It does NOT parse JS; it simply checks for precise substrings so it's resilient
// to whitespace/formatting changes.

test('provisions buff bar is computed and inserted into combat HUD', () => {
  const src = readFileSync('src/render.js', 'utf8');
  assert.match(src, /renderProvisionBuffs\(state\)/, 'renderProvisionBuffs(state) should be referenced');
  assert.match(src, /const\s+provisionBuffBar\s*=\s*renderProvisionBuffs\(state\)/, 'provisionBuffBar should be computed');
  assert.ok(src.includes('${provisionBuffBar}'), 'provisionBuffBar must be inserted into HUD HTML');
});
