/**
 * Bestiary Shield Integration Tests
 * Tests that shield/weakness/immunity data renders correctly in the bestiary panel.
 * Day 343 — Claude Opus 4.6
 */

import { strict as assert } from 'node:assert';
import { renderShieldInfo } from '../src/bestiary-ui.js';
import { renderBestiaryPanel } from '../src/bestiary-ui.js';
import { ENEMY_SHIELD_DATABASE, ELEMENT_ICONS } from '../src/shield-break.js';
import { createBestiaryState, recordEncounter, recordDefeat } from '../src/bestiary.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`FAIL: ${name}\n  ${e.message}`);
  }
}

// ── renderShieldInfo basic tests ──

test('renderShieldInfo returns empty string for unknown enemy', () => {
  const result = renderShieldInfo('nonexistent_enemy_xyz');
  assert.equal(result, '');
});

test('renderShieldInfo returns empty string for null input', () => {
  const result = renderShieldInfo(null);
  assert.equal(result, '');
});

test('renderShieldInfo returns empty string for undefined input', () => {
  const result = renderShieldInfo(undefined);
  assert.equal(result, '');
});

test('renderShieldInfo returns non-empty string for known enemy (slime)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.length > 0, 'Should return non-empty HTML');
});

// ── Shield count rendering ──

test('renderShieldInfo shows correct shield count for slime (2)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('Shields: 2'), 'Should show shield count 2');
});

test('renderShieldInfo shows correct shield count for dragon (8)', () => {
  const result = renderShieldInfo('dragon');
  assert.ok(result.includes('Shields: 8'), 'Should show shield count 8');
});

test('renderShieldInfo shows correct shield count for goblin_chief (5)', () => {
  const result = renderShieldInfo('goblin_chief');
  assert.ok(result.includes('Shields: 5'), 'Should show shield count 5');
});

test('renderShieldInfo shows correct shield count for cave_bat (1)', () => {
  const result = renderShieldInfo('cave_bat');
  assert.ok(result.includes('Shields: 1'), 'Should show shield count 1');
});

// ── Break immune rendering ──

test('renderShieldInfo shows Break Immune for training_dummy', () => {
  const result = renderShieldInfo('training_dummy');
  assert.ok(result.includes('(Break Immune)'), 'Should show Break Immune');
});

test('renderShieldInfo does NOT show Break Immune for slime', () => {
  const result = renderShieldInfo('slime');
  assert.ok(!result.includes('Break Immune'), 'Should not show Break Immune');
});

test('renderShieldInfo does NOT show Break Immune for dragon', () => {
  const result = renderShieldInfo('dragon');
  assert.ok(!result.includes('Break Immune'), 'Should not show Break Immune');
});

// ── Weakness rendering ──

test('renderShieldInfo shows weakness icons for slime (fire, lightning)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes(ELEMENT_ICONS.fire), 'Should show fire icon');
  assert.ok(result.includes(ELEMENT_ICONS.lightning), 'Should show lightning icon');
});

test('renderShieldInfo shows weakness icons for dragon (ice, holy)', () => {
  const result = renderShieldInfo('dragon');
  assert.ok(result.includes(ELEMENT_ICONS.ice), 'Should show ice icon');
  assert.ok(result.includes(ELEMENT_ICONS.holy), 'Should show holy icon');
});

test('renderShieldInfo shows weakness icons for skeleton (holy, fire)', () => {
  const result = renderShieldInfo('skeleton');
  assert.ok(result.includes(ELEMENT_ICONS.holy), 'Should show holy icon');
  assert.ok(result.includes(ELEMENT_ICONS.fire), 'Should show fire icon');
});

test('renderShieldInfo weakness section contains Weak: label', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('Weak:'), 'Should contain Weak: label');
});

// ── Immunity rendering ──

test('renderShieldInfo shows immunity for skeleton (shadow)', () => {
  const result = renderShieldInfo('skeleton');
  assert.ok(result.includes('Immune:'), 'Should contain Immune: label');
  assert.ok(result.includes(`title="shadow"`), 'Should show shadow immunity');
});

test('renderShieldInfo shows immunity for dragon (fire)', () => {
  const result = renderShieldInfo('dragon');
  assert.ok(result.includes('Immune:'), 'Should contain Immune: label');
  assert.ok(result.includes(`title="fire"`), 'Should show fire immunity');
});

test('renderShieldInfo shows multiple immunities for wraith (physical, shadow)', () => {
  const result = renderShieldInfo('wraith');
  assert.ok(result.includes(`title="physical"`), 'Should show physical immunity');
  assert.ok(result.includes(`title="shadow"`), 'Should show shadow immunity');
});

test('renderShieldInfo does NOT show Immune: for slime (no immunities)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(!result.includes('Immune:'), 'Should not show Immune: for slime');
});

test('renderShieldInfo does NOT show Immune: for goblin (no immunities)', () => {
  const result = renderShieldInfo('goblin');
  assert.ok(!result.includes('Immune:'), 'Should not show Immune: for goblin');
});

// ── Absorb rendering ──

test('renderShieldInfo shows absorb for fire-spirit (fire)', () => {
  const result = renderShieldInfo('fire-spirit');
  assert.ok(result.includes('Absorbs:'), 'Should contain Absorbs: label');
});

test('renderShieldInfo shows absorb for ice-spirit (ice)', () => {
  const result = renderShieldInfo('ice-spirit');
  assert.ok(result.includes('Absorbs:'), 'Should contain Absorbs: label');
});

test('renderShieldInfo shows absorb for wraith (shadow)', () => {
  const result = renderShieldInfo('wraith');
  assert.ok(result.includes('Absorbs:'), 'Should contain Absorbs: label');
});

test('renderShieldInfo does NOT show Absorbs: for slime (no absorbs)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(!result.includes('Absorbs:'), 'Should not show Absorbs: for slime');
});

test('renderShieldInfo does NOT show Absorbs: for dragon (no absorbs)', () => {
  const result = renderShieldInfo('dragon');
  assert.ok(!result.includes('Absorbs:'), 'Should not show Absorbs: for dragon');
});

// ── CSS class rendering ──

test('renderShieldInfo wraps in bestiary-shield-info div', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('bestiary-shield-info'), 'Should have bestiary-shield-info class');
});

test('renderShieldInfo uses bestiary-element-tag class for weakness icons', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('bestiary-element-tag'), 'Should have bestiary-element-tag class');
});

test('renderShieldInfo uses element-specific class (bestiary-el-fire)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('bestiary-el-fire'), 'Should have bestiary-el-fire class');
});

test('renderShieldInfo uses element-specific class (bestiary-el-lightning)', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('bestiary-el-lightning'), 'Should have bestiary-el-lightning class');
});

test('renderShieldInfo uses title attribute for element names', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('title="fire"'), 'Should have title="fire"');
  assert.ok(result.includes('title="lightning"'), 'Should have title="lightning"');
});

// ── Shield icon rendering ──

test('renderShieldInfo shows shield emoji', () => {
  const result = renderShieldInfo('slime');
  assert.ok(result.includes('🛡️'), 'Should show shield emoji');
});

// ── Full panel integration ──

test('renderBestiaryPanel includes shield info for encountered slime', () => {
  let bestiary = createBestiaryState();
  bestiary = recordEncounter(bestiary, 'slime');
  const html = renderBestiaryPanel({ bestiary });
  assert.ok(html.includes('bestiary-shield-info'), 'Panel should include shield info section');
  assert.ok(html.includes('Shields: 2'), 'Panel should show slime shield count');
});

test('renderBestiaryPanel includes weakness icons for encountered skeleton', () => {
  let bestiary = createBestiaryState();
  bestiary = recordEncounter(bestiary, 'skeleton');
  const html = renderBestiaryPanel({ bestiary });
  assert.ok(html.includes('Weak:'), 'Panel should include Weak: label');
  assert.ok(html.includes(ELEMENT_ICONS.holy), 'Panel should show holy weakness icon');
});

test('renderBestiaryPanel includes immunity info for encountered dragon', () => {
  let bestiary = createBestiaryState();
  bestiary = recordEncounter(bestiary, 'dragon');
  const html = renderBestiaryPanel({ bestiary });
  assert.ok(html.includes('Immune:'), 'Panel should include Immune: label');
  assert.ok(html.includes('Shields: 8'), 'Panel should show dragon shield count');
});

test('renderBestiaryPanel does NOT include shield info for unencountered enemies', () => {
  const bestiary = createBestiaryState();
  const html = renderBestiaryPanel({ bestiary });
  assert.ok(!html.includes('bestiary-shield-info'), 'Panel should NOT include shield info for unencountered');
});

test('renderBestiaryPanel includes shield info for defeated enemy', () => {
  let bestiary = createBestiaryState();
  bestiary = recordDefeat(bestiary, 'goblin');
  const html = renderBestiaryPanel({ bestiary });
  assert.ok(html.includes('bestiary-shield-info'), 'Panel should include shield info after defeat');
  assert.ok(html.includes('Shields: 2'), 'Panel should show goblin shield count');
});

test('renderBestiaryPanel shows absorbs for encountered wraith', () => {
  let bestiary = createBestiaryState();
  bestiary = recordEncounter(bestiary, 'wraith');
  const html = renderBestiaryPanel({ bestiary });
  assert.ok(html.includes('Absorbs:'), 'Panel should show Absorbs: for wraith');
  assert.ok(html.includes('Shields: 4'), 'Panel should show wraith shield count');
});

// ── Coverage for all enemies in shield database ──

for (const [enemyId, data] of Object.entries(ENEMY_SHIELD_DATABASE)) {
  test(`renderShieldInfo renders for ${enemyId} with correct shield count`, () => {
    const result = renderShieldInfo(enemyId);
    assert.ok(result.includes(`Shields: ${data.shieldCount}`),
      `${enemyId} should show shield count ${data.shieldCount}`);
  });

  test(`renderShieldInfo renders weaknesses for ${enemyId}`, () => {
    const result = renderShieldInfo(enemyId);
    for (const w of data.weaknesses) {
      const icon = ELEMENT_ICONS[w] || w;
      assert.ok(result.includes(icon), `${enemyId} should show ${w} weakness icon`);
    }
  });
}

// ── Summary ──

console.log(`\nBestiary Shield Integration Tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
