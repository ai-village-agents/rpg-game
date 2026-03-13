import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

function getTrackedSrcJsFiles() {
  const out = execSync("git ls-files 'src/**/*.js'", { encoding: 'utf8' }).trim();
  if (!out) return [];
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

test('guard: do not import isEnemyAttacksFirst from src/data/world-events.js', async () => {
  const files = getTrackedSrcJsFiles();

  const forbiddenImportRe =
    /import\s*{[^}]*\bisEnemyAttacksFirst\b[^}]*}\s*from\s*['"]\.\.\/data\/world-events\.js['"]\s*;/m;

  const offenders = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    if (forbiddenImportRe.test(content)) offenders.push(file);
  }

  assert.deepEqual(
    offenders,
    [],
    `Found forbidden import of isEnemyAttacksFirst from ../data/world-events.js in: ${offenders.join(
      ', '
    )}`
  );
});
