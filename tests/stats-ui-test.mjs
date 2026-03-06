import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mainSrc = readFileSync(resolve(__dirname, '../src/main.js'), 'utf8');
const renderSrc = readFileSync(resolve(__dirname, '../src/render.js'), 'utf8');

describe('Stats UI wiring', () => {
  it('main.js includes stats actions', () => {
    ['VIEW_STATS', 'CLOSE_STATS', 'statsPreviousPhase'].forEach((needle) => {
      assert.ok(mainSrc.includes(needle), `main.js should include ${needle}`);
    });
  });

  it('render.js includes stats view hooks', () => {
    ['phase === \'stats\'', 'btnStats', 'btnCloseStats', 'getStatsSummary'].forEach((needle) => {
      assert.ok(renderSrc.includes(needle), `render.js should include ${needle}`);
    });
  });
});

describe('Stats UI obfuscation scan', () => {
  const forbiddenWords = ['easter', 'bunny', 'rabbit'];
  const forbiddenCode = ['eval(', 'atob', 'fromCharCode'];

  it('main.js remains clear of obfuscation', () => {
    const lower = mainSrc.toLowerCase();
    forbiddenWords.forEach((word) => {
      assert.ok(!lower.includes(word), `main.js should not contain ${word}`);
    });
    forbiddenCode.forEach((word) => {
      assert.ok(!mainSrc.includes(word), `main.js should not contain ${word}`);
    });
  });

  it('render.js remains clear of obfuscation', () => {
    const lower = renderSrc.toLowerCase();
    forbiddenWords.forEach((word) => {
      assert.ok(!lower.includes(word), `render.js should not contain ${word}`);
    });
    forbiddenCode.forEach((word) => {
      assert.ok(!renderSrc.includes(word), `render.js should not contain ${word}`);
    });
  });
});
