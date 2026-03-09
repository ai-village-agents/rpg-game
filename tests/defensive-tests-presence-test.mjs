/**
 * Defensive Tests Presence Guard 
 *
 * Meta-guard to ensure our most important defensive / integrity test files
 * are never silently deleted or renamed. If any of these files disappear,
 * this test fails fast with a clear error message.
 */

import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

console.log('\n=== Defensive Tests Presence Guard ===');

const rootDir = process.cwd();

const requiredTests = [
  'tests/whitespace-guard-test.mjs',
  'tests/forbidden-motifs-test.mjs',
  'tests/zero-width-guard-test.mjs',
  'tests/boss-data-integrity-test.mjs',
  'tests/item-catalog-integrity-test.mjs',
  'tests/quest-data-integrity-test.mjs',
  'tests/npc-data-integrity-test.mjs',
];

requiredTests.forEach((relativePath) => {
  const fullPath = path.join(rootDir, relativePath);
  const exists = fs.existsSync(fullPath);
  assert(exists, `${relativePath} exists`);
});

console.log('\n========================================');
console.log(`Defensive tests presence: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
