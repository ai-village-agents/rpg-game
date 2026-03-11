import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// This test prevents new "egg"-themed easter eggs from creeping into documentation.
// IMPORTANT: Our existing docs already contain some mentions in a defensive context
// (e.g., describing anti-sabotage guardrails). To avoid breaking CI immediately,
// we enforce a strict *baseline*: counts may stay the same or decrease, but must
// never increase.
//
// If we later decide to fully remove these terms from docs, the baseline can be
// reduced in a follow-up PR.

const DOCS_ROOT = 'docs';

// Baseline totals on main @ 2026-03-11 (Day 344).
// Computed by scanning tracked docs/*.md (and nested) with case-insensitive word-boundary matching.
const BASELINE_TOTALS = Object.freeze({
  egg: 24,
  easter: 16,
  yolk: 6,
  omelet: 4,
  omelette: 0,
  bunny: 5,
  rabbit: 5,
  chick: 3,
  basket: 4,
  cockatrice: 6,
  basilisk: 6,
  nest: 5,
  shell: 5,
  hatch: 3,
  hen: 1,
  rooster: 1,
  scramble: 0,
  scrambled: 0,
  souffle: 0,
  'soufflé': 0,
  ovum: 0,
  ova: 0,
});

const EGG_EMOJI = '\u{1F95A}'; // 🥚
const BASELINE_EGG_EMOJI = 0;

function escapeForRegex(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTrackedDocsFiles() {
  let out;
  try {
    out = execSync(`git ls-files ${DOCS_ROOT}`, { encoding: 'utf8' });
  } catch {
    // If docs/ isn't tracked (unlikely), treat as no-op.
    return [];
  }

  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((fp) => /\.(md|txt)$/i.test(fp))
    .filter((fp) => !fp.endsWith(path.join(DOCS_ROOT, '.DS_Store')));
}

function countWordOccurrences(text, word) {
  const re = new RegExp(`\\b${escapeForRegex(word)}\\b`, 'gi');
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

function countEggEmoji(text) {
  const re = new RegExp(EGG_EMOJI, 'gu');
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

function findLineOccurrences(text, word, limit) {
  const re = new RegExp(`\\b${escapeForRegex(word)}\\b`, 'i');
  const lines = text.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (re.test(lines[i])) {
      hits.push({ line: i + 1, preview: lines[i].slice(0, 160) });
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

const files = getTrackedDocsFiles();

// Compute totals.
const totals = {};
for (const word of Object.keys(BASELINE_TOTALS)) {
  totals[word] = 0;
}
let eggEmojiTotal = 0;

const textByFile = new Map();
for (const fp of files) {
  const text = fs.readFileSync(fp, 'utf8');
  textByFile.set(fp, text);
  eggEmojiTotal += countEggEmoji(text);
  for (const word of Object.keys(BASELINE_TOTALS)) {
    totals[word] += countWordOccurrences(text, word);
  }
}

// Hard-fail on any egg emoji in docs.
assert(
  eggEmojiTotal <= BASELINE_EGG_EMOJI,
  `[docs-motif-baseline-guard] docs contain forbidden egg emoji (${eggEmojiTotal} > ${BASELINE_EGG_EMOJI}). Remove ${EGG_EMOJI} from docs.`,
);

// Enforce baseline: no increases.
const increased = [];
for (const [word, baseline] of Object.entries(BASELINE_TOTALS)) {
  const actual = totals[word] ?? 0;
  if (actual > baseline) {
    increased.push({ word, baseline, actual });
  }
}

if (increased.length > 0) {
  const lines = [];
  lines.push('[docs-motif-baseline-guard] Forbidden motif counts increased in docs.');
  lines.push('Counts must not increase above baseline (they may stay the same or decrease).');
  lines.push('');
  for (const { word, baseline, actual } of increased) {
    lines.push(`- ${JSON.stringify(word)}: ${actual} > ${baseline}`);

    // Provide a few breadcrumbs to help fix quickly.
    const samples = [];
    for (const [fp, text] of textByFile.entries()) {
      const hits = findLineOccurrences(text, word, 2);
      for (const h of hits) {
        samples.push(`${fp}:${h.line}: ${h.preview}`);
        if (samples.length >= 6) break;
      }
      if (samples.length >= 6) break;
    }
    if (samples.length > 0) {
      lines.push('  sample locations:');
      for (const s of samples) lines.push(`  - ${s}`);
    }
  }
  lines.push('');
  lines.push('If you intentionally removed occurrences elsewhere and still need to use the term, consider rephrasing to avoid these motifs.');

  throw new Error(lines.join('\n'));
}

console.log(
  `[docs-motif-baseline-guard] Scanned ${files.length} tracked docs files under ${DOCS_ROOT} (baseline guard).`,
);
console.log('[docs-motif-baseline-guard] OK');
