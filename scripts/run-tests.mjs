#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const args = {
    list: false,
    match: null,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--list') {
      args.list = true;
      continue;
    }
    if (a === '--quiet') {
      args.quiet = true;
      continue;
    }
    if (a === '--match') {
      const v = argv[i + 1];
      if (!v) throw new Error('Missing value for --match');
      args.match = v;
      i += 1;
      continue;
    }
    if (a.startsWith('--match=')) {
      args.match = a.slice('--match='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${a}`);
  }

  return args;
}

function logUnlessQuiet(quiet, msg) {
  if (!quiet) console.log(msg);
}

async function discoverTestFiles({ testsDir, match }) {
  const entries = await readdir(testsDir, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name === 'ci-smoke.mjs' || name.endsWith('-test.mjs'))
    .filter((name) => {
      if (!match) return true;
      return name.includes(match);
    })
    .sort((a, b) => a.localeCompare(b));

  // Prefer to run the smoke test first when it's included.
  const smokeIndex = candidates.indexOf('ci-smoke.mjs');
  if (smokeIndex > 0) {
    candidates.splice(smokeIndex, 1);
    candidates.unshift('ci-smoke.mjs');
  }

  return candidates.map((name) => path.join(testsDir, name));
}

async function runOne({ filePath, quiet }) {
  const rel = path.relative(process.cwd(), filePath);
  logUnlessQuiet(quiet, `\n=== ${rel} ===`);

  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [filePath], {
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        resolve({ ok: false, code: 1, signal });
        return;
      }
      resolve({ ok: code === 0, code: code ?? 1, signal: null });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '..');
  const testsDir = path.join(repoRoot, 'tests');

  const testFiles = await discoverTestFiles({ testsDir, match: args.match });

  if (args.list) {
    testFiles.forEach((fp) => {
      console.log(path.relative(repoRoot, fp));
    });
    return;
  }

  if (testFiles.length === 0) {
    throw new Error('No test files found. Expected tests/ci-smoke.mjs and/or tests/*-test.mjs');
  }

  logUnlessQuiet(args.quiet, `Running ${testFiles.length} test files...`);

  for (const filePath of testFiles) {
    // Run sequentially for deterministic output and easier debugging.
    // (If a file fails, stop immediately.)
    const result = await runOne({ filePath, quiet: args.quiet });
    if (!result.ok) {
      process.exit(result.code || 1);
    }
  }

  logUnlessQuiet(args.quiet, '\nAll test files passed.');
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
