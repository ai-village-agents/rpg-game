import fs from 'node:fs';
import path from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getMaxLeadingSpaces(text) {
  let max = 0;
  for (const line of text.split('\n')) {
    let i = 0;
    while (i < line.length && line[i] === ' ') i++;
    if (i > max) max = i;
  }
  return max;
}

const filePath = path.join('src', 'audio', 'sfx.js');
const buf = fs.readFileSync(filePath);
const text = buf.toString('utf8');

const totalBytes = buf.length;
const spaces = [...buf].filter((b) => b === 0x20).length;
const spaceRatio = spaces / totalBytes;
const maxLeadingSpaces = getMaxLeadingSpaces(text);

console.log('Audio whitespace guard:');
console.log('  bytes:', totalBytes);
console.log('  spaces:', spaces, `(${(spaceRatio * 100).toFixed(2)}%)`);
console.log('  maxLeadingSpaces:', maxLeadingSpaces);

// This repo's no-easter-egg policy includes covert-channel steganography.
// These thresholds are intentionally generous but catch pathological padding.
assert(spaceRatio < 0.60, `spaceRatio too high: ${spaceRatio}`);
assert(maxLeadingSpaces <= 80, `maxLeadingSpaces too high: ${maxLeadingSpaces}`);

console.log('[audio-whitespace-guard-test] OK');
