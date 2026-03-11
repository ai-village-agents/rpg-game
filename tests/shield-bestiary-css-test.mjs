/**
 * Tests for Shield & Bestiary CSS — validates that styles.css contains
 * all required selectors for the bestiary panel, bestiary shield info,
 * element tags, and shield-break combat UI.
 */

import { readFileSync } from 'fs';
import { strict as assert } from 'assert';

const css = readFileSync('./styles.css', 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

function hasSelector(selector) {
  // Escape special CSS chars for regex
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped).test(css);
}

console.log('Shield & Bestiary CSS Tests');
console.log('===========================');

// --- Bestiary Panel Styles ---
console.log('\n[Bestiary Panel]');
test('.bestiary-panel selector exists', () => assert.ok(hasSelector('.bestiary-panel')));
test('.bestiary-summary selector exists', () => assert.ok(hasSelector('.bestiary-summary')));
test('.bestiary-list selector exists', () => assert.ok(hasSelector('.bestiary-list')));
test('.bestiary-entry selector exists', () => assert.ok(hasSelector('.bestiary-entry')));
test('.bestiary-unknown selector exists', () => assert.ok(hasSelector('.bestiary-unknown')));
test('.bestiary-boss selector exists', () => assert.ok(hasSelector('.bestiary-boss')));
test('.bestiary-entry-header selector exists', () => assert.ok(hasSelector('.bestiary-entry-header')));
test('.bestiary-name selector exists', () => assert.ok(hasSelector('.bestiary-name')));
test('.bestiary-boss-tag selector exists', () => assert.ok(hasSelector('.bestiary-boss-tag')));
test('.bestiary-element selector exists', () => assert.ok(hasSelector('.bestiary-element')));
test('.bestiary-description selector exists', () => assert.ok(hasSelector('.bestiary-description')));
test('.bestiary-stats selector exists', () => assert.ok(hasSelector('.bestiary-stats')));
test('.bestiary-rewards selector exists', () => assert.ok(hasSelector('.bestiary-rewards')));
test('.bestiary-defeats selector exists', () => assert.ok(hasSelector('.bestiary-defeats')));
test('.bestiary-close-btn selector exists', () => assert.ok(hasSelector('.bestiary-close-btn')));

// --- Bestiary Shield Info ---
console.log('\n[Bestiary Shield Info]');
test('.bestiary-shield-info selector exists', () => assert.ok(hasSelector('.bestiary-shield-info')));
test('.bestiary-shield-info has flex-direction column', () => assert.ok(css.includes('.bestiary-shield-info') && css.includes('flex-direction: column')));
test('.bestiary-element-tag selector exists', () => assert.ok(hasSelector('.bestiary-element-tag')));
test('.bestiary-element-tag has border-radius 50%', () => {
  const idx = css.indexOf('.bestiary-element-tag');
  const block = css.substring(idx, css.indexOf('}', idx));
  assert.ok(block.includes('border-radius: 50%'));
});

// --- Element Color Tags ---
console.log('\n[Element Color Tags]');
const elements = ['fire', 'ice', 'lightning', 'holy', 'shadow', 'nature', 'physical'];
for (const el of elements) {
  test(`.bestiary-el-${el} selector exists`, () => assert.ok(hasSelector(`.bestiary-el-${el}`)));
}

test('fire element has warm color', () => {
  const idx = css.indexOf('.bestiary-el-fire');
  const block = css.substring(idx, css.indexOf('}', idx));
  assert.ok(block.includes('rgba(255,80,40'));
});

test('ice element has cool color', () => {
  const idx = css.indexOf('.bestiary-el-ice');
  const block = css.substring(idx, css.indexOf('}', idx));
  assert.ok(block.includes('rgba(100,180,255'));
});

test('shadow element has purple color', () => {
  const idx = css.indexOf('.bestiary-el-shadow');
  const block = css.substring(idx, css.indexOf('}', idx));
  assert.ok(block.includes('rgba(130,60,200'));
});

// --- Shield Break Combat UI ---
console.log('\n[Shield Break Combat UI]');
test('.shield-break-hud selector exists', () => assert.ok(hasSelector('.shield-break-hud')));
test('.shield-display selector exists', () => assert.ok(hasSelector('.shield-display')));
test('.shield-full selector exists', () => assert.ok(hasSelector('.shield-full')));
test('.shield-empty selector exists', () => assert.ok(hasSelector('.shield-empty')));
test('.shield-broken selector exists', () => assert.ok(hasSelector('.shield-broken')));
test('.weakness-icon selector exists', () => assert.ok(hasSelector('.weakness-icon')));
test('.break-state-display selector exists', () => assert.ok(hasSelector('.break-state-display')));
test('.break-active selector exists', () => assert.ok(hasSelector('.break-active')));
test('.shield-break-animation selector exists', () => assert.ok(hasSelector('.shield-break-animation')));

// --- Animations ---
console.log('\n[Animations]');
test('@keyframes break-pulse exists', () => assert.ok(css.includes('@keyframes break-pulse')));
test('@keyframes shield-break-flash exists', () => assert.ok(css.includes('@keyframes shield-break-flash')));
test('break-pulse has opacity animation', () => {
  const idx = css.indexOf('@keyframes break-pulse');
  const block = css.substring(idx, css.indexOf('}', css.indexOf('}', idx) + 1) + 1);
  assert.ok(block.includes('opacity'));
});

// --- Design Consistency ---
console.log('\n[Design Consistency]');
test('uses --accent CSS variable', () => assert.ok(css.includes('var(--accent)')));
test('uses --bad CSS variable', () => assert.ok(css.includes('var(--bad)')));
test('uses --good CSS variable', () => assert.ok(css.includes('var(--good)')));
test('uses --muted CSS variable', () => assert.ok(css.includes('var(--muted)')));
test('uses --text CSS variable', () => assert.ok(css.includes('var(--text)')));

// --- Summary ---
console.log(`\n===========================`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
