import fs from 'node:fs';
import { execSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const ZW_SEQUENCES = [
  { name: 'ZERO WIDTH SPACE', codepoint: 'U+200B', bytes: Buffer.from([0xE2, 0x80, 0x8B]) },
  { name: 'ZERO WIDTH NON-JOINER', codepoint: 'U+200C', bytes: Buffer.from([0xE2, 0x80, 0x8C]) },
  { name: 'ZERO WIDTH JOINER', codepoint: 'U+200D', bytes: Buffer.from([0xE2, 0x80, 0x8D]) },
  { name: 'BYTE ORDER MARK', codepoint: 'U+FEFF', bytes: Buffer.from([0xEF, 0xBB, 0xBF]) },
];

const ALLOWED_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.html',
  '.css',
  '.md',
  '.json',
  '.yml',
  '.yaml',
  '.txt',
]);

function getTrackedFiles() {
  // Tracked files only (prevents scanning build artifacts / node_modules)
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function extname(filePath) {
  const idx = filePath.lastIndexOf('.');
  return idx === -1 ? '' : filePath.slice(idx);
}

function findAllOccurrences(haystackBuf, needleBuf) {
  const hits = [];
  let start = 0;
  while (start <= haystackBuf.length - needleBuf.length) {
    const idx = haystackBuf.indexOf(needleBuf, start);
    if (idx === -1) break;
    hits.push(idx);
    start = idx + 1;
  }
  return hits;
}

function byteOffsetToLineCol(buf, offset) {
  // 1-based line/column, with column measured in bytes since last \n.
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < offset; i += 1) {
    if (buf[i] === 0x0A) {
      line += 1;
      lastNewline = i;
    }
  }
  const col = offset - lastNewline;
  return { line, col };
}

const tracked = getTrackedFiles();
const targets = tracked.filter((p) => ALLOWED_EXTENSIONS.has(extname(p)));

let filesScanned = 0;
let findings = 0;

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) continue;
  const buf = fs.readFileSync(filePath);
  filesScanned += 1;

  for (const zw of ZW_SEQUENCES) {
    const hits = findAllOccurrences(buf, zw.bytes);
    if (hits.length === 0) continue;

    findings += hits.length;
    for (const offset of hits.slice(0, 25)) {
      const { line, col } = byteOffsetToLineCol(buf, offset);
      // Show a tiny snippet for context (best-effort decode)
      const start = Math.max(0, offset - 30);
      const end = Math.min(buf.length, offset + 30);
      const snippet = buf.subarray(start, end).toString('utf8').replaceAll('\n', '\\n');
      console.error(
        `[zero-width-guard-test] ${filePath}:${line}:${col}: ${zw.name} (${zw.codepoint}) detected (byte offset ${offset}). Context: ${JSON.stringify(snippet)}`,
      );
    }
    if (hits.length > 25) {
      console.error(
        `[zero-width-guard-test] ${filePath}: (${zw.codepoint}) additional occurrences not shown: ${hits.length - 25}`,
      );
    }
  }
}

assert(findings === 0, `[zero-width-guard-test] FAILED: Found ${findings} zero-width / BOM sequences in tracked source files.`);

console.log(`[zero-width-guard-test] Scanned ${filesScanned} tracked text/source files.`);
console.log('[zero-width-guard-test] OK');
