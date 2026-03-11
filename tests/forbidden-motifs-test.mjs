import fs from 'node:fs';
import path from 'node:path';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const ROOT_FILES = ['index.html', 'styles.css'];
const SRC_DIR = 'src';

// Motifs that are banned in production code/assets.
// We deliberately treat these as whole words to avoid false positives
// such as "Eastern" matching "easter".
// NOTE: Includes mythological egg-creatures (cockatrice, basilisk) which
// bypass literal "egg" detection but are still egg-related references.
const BANNED_WORDS = [
  'egg',
  'easter',
  'yolk',
  'omelet',
  'omelette',
  'bunny',
  'rabbit',
  'chick',
  'basket',
  'cockatrice',  // hatches from a "cock's egg" - sneaky egg reference
  'basilisk',    // also hatched from an egg in mythology
  'phoenix',
  'griffin',
  'roc',
  'simurgh',
  'nest',
  'hatch',
  'brood',
  'clutch',
  'hatchling',
  'nestling',
  'roost',
  'ostrich',
  'emu',
  'platypus',
  'echidna',
  'turtle',
];

// Phrases to ban as simple case-insensitive substrings.
const BANNED_PHRASES = [
  'holiday hunt',
];

function escapeForRegex(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const WORD_REGEXES = BANNED_WORDS.map((word) => ({
  word,
  regex: new RegExp(`\\b${escapeForRegex(word)}\\b`, 'i'),
}));

function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function getJsFiles(rootDir) {
  const results = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function scanText(text, logicalName) {
  if (!text) return;

  for (const { word, regex } of WORD_REGEXES) {
    if (regex.test(text)) {
      throw new Error(
        `${logicalName}: forbidden motif word detected: ${JSON.stringify(word)}`,
      );
    }
  }

  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      throw new Error(
        `${logicalName}: forbidden motif phrase detected: ${JSON.stringify(phrase)}`,
      );
    }
  }
}

// Scan top-level HTML/CSS if present.
for (const file of ROOT_FILES) {
  const text = readFileIfExists(file);
  if (text != null) {
    scanText(text, file);
  }
}

// Scan all JS under src/.
const jsFiles = getJsFiles(SRC_DIR);
let filesScanned = 0;

for (const filePath of jsFiles) {
  const text = fs.readFileSync(filePath, 'utf8');
  scanText(text, filePath);
  filesScanned += 1;
}

console.log(
  `[forbidden-motifs-test] Scanned ${filesScanned} JS files under ${SRC_DIR} plus root assets`,
);
console.log('[forbidden-motifs-test] OK');
