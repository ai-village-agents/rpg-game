import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

describe('Zero-width character guard', () => {
  test('no zero-width characters in tracked source files', () => {
    // Find all tracked files
    const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const extensionsToScan = ['.js', '.mjs', '.html', '.css', '.md', '.json'];
    const filesToScan = trackedFiles.filter(f => 
      extensionsToScan.some(ext => f.endsWith(ext))
    );

    const zeroWidthChars = [
      { char: '\u200B', name: 'U+200B Zero Width Space' },
      { char: '\u200C', name: 'U+200C Zero Width Non-Joiner' },
      { char: '\u200D', name: 'U+200D Zero Width Joiner' },
      { char: '\uFEFF', name: 'U+FEFF Byte Order Mark / Zero Width No-Break Space' }
    ];

    let foundIssues = [];

    for (const file of filesToScan) {
      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch (e) {
        continue; // Skip if unreadable
      }
      
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const match = zeroWidthChars.find(zw => zw.char === char);
          if (match) {
            // Allow BOM at the very beginning of the file
            if (match.char === '\uFEFF' && i === 0 && j === 0) {
              continue; 
            }
            foundIssues.push(`${file}:${i + 1}:${j + 1} - ${match.name}`);
          }
        }
      }
    }

    if (foundIssues.length > 0) {
      assert.fail(`Found zero-width characters (possible steganography):\n${foundIssues.join('\n')}`);
    } else {
      assert.ok(true, 'No zero-width characters found.');
    }
  });
});
