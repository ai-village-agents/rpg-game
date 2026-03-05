/**
 * Tests for src/status-effect-ui.js
 * Status Effect UI Display — Claude Sonnet 4.6
 */

import {
  STATUS_EFFECT_META,
  getStatusEffectMeta,
  buildEffectTooltip,
  renderStatusBadge,
  renderStatusEffects,
  renderStatusEffectsRow,
  getStatusEffectStyles,
} from '../src/status-effect-ui.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
  }
}

// ── STATUS_EFFECT_META ────────────────────────────────────────────────

console.log('\n=== STATUS_EFFECT_META ===');

const knownTypes = ['poison', 'burn', 'stun', 'sleep', 'regen', 'atk-up', 'def-up', 'spd-up', 'atk-down', 'def-down', 'spd-down'];

assert(typeof STATUS_EFFECT_META === 'object', 'STATUS_EFFECT_META is an object');

for (const type of knownTypes) {
  assert(STATUS_EFFECT_META[type] !== undefined, `STATUS_EFFECT_META has entry for "${type}"`);
  assert(typeof STATUS_EFFECT_META[type].icon === 'string', `"${type}" has icon string`);
  assert(typeof STATUS_EFFECT_META[type].cssClass === 'string', `"${type}" has cssClass string`);
  assert(typeof STATUS_EFFECT_META[type].label === 'string', `"${type}" has label string`);
  assert(typeof STATUS_EFFECT_META[type].category === 'string', `"${type}" has category string`);
  assert(STATUS_EFFECT_META[type].icon.length > 0, `"${type}" icon is not empty`);
  assert(STATUS_EFFECT_META[type].cssClass.startsWith('se-'), `"${type}" cssClass starts with 'se-'`);
}

// Category checks
assert(STATUS_EFFECT_META.poison.category === 'debuff-dot', 'poison is debuff-dot');
assert(STATUS_EFFECT_META.burn.category === 'debuff-dot', 'burn is debuff-dot');
assert(STATUS_EFFECT_META.stun.category === 'debuff-ctrl', 'stun is debuff-ctrl');
assert(STATUS_EFFECT_META.sleep.category === 'debuff-ctrl', 'sleep is debuff-ctrl');
assert(STATUS_EFFECT_META.regen.category === 'buff', 'regen is buff');
assert(STATUS_EFFECT_META['atk-up'].category === 'buff', 'atk-up is buff');
assert(STATUS_EFFECT_META['def-up'].category === 'buff', 'def-up is buff');
assert(STATUS_EFFECT_META['spd-up'].category === 'buff', 'spd-up is buff');
assert(STATUS_EFFECT_META['atk-down'].category === 'debuff', 'atk-down is debuff');
assert(STATUS_EFFECT_META['def-down'].category === 'debuff', 'def-down is debuff');
assert(STATUS_EFFECT_META['spd-down'].category === 'debuff', 'spd-down is debuff');

// ── getStatusEffectMeta ───────────────────────────────────────────────

console.log('\n=== getStatusEffectMeta ===');

const poisonMeta = getStatusEffectMeta('poison');
assert(poisonMeta.label === 'Poison', 'getStatusEffectMeta returns correct label for poison');
assert(poisonMeta.cssClass === 'se-poison', 'getStatusEffectMeta returns correct cssClass for poison');
assert(poisonMeta.category === 'debuff-dot', 'getStatusEffectMeta returns correct category for poison');

const regenMeta = getStatusEffectMeta('regen');
assert(regenMeta.label === 'Regen', 'getStatusEffectMeta returns correct label for regen');
assert(regenMeta.category === 'buff', 'getStatusEffectMeta returns correct category for regen');

// Unknown type returns fallback
const unknownMeta = getStatusEffectMeta('nonexistent-effect');
assert(unknownMeta.icon === '❓', 'getStatusEffectMeta fallback has question mark icon');
assert(unknownMeta.cssClass === 'se-unknown', 'getStatusEffectMeta fallback has se-unknown cssClass');
assert(unknownMeta.label === 'nonexistent-effect', 'getStatusEffectMeta fallback uses type as label');
assert(unknownMeta.category === 'unknown', 'getStatusEffectMeta fallback has unknown category');

// All known types return their meta (not fallback)
for (const type of knownTypes) {
  const meta = getStatusEffectMeta(type);
  assert(meta.cssClass !== 'se-unknown', `getStatusEffectMeta("${type}") does not return fallback`);
}

// ── buildEffectTooltip ────────────────────────────────────────────────

console.log('\n=== buildEffectTooltip ===');

const poisonEffect = { type: 'poison', name: 'Poison', duration: 3, power: 5 };
const poisonTooltip = buildEffectTooltip(poisonEffect);
assert(poisonTooltip.includes('Poison'), 'poison tooltip includes label');
assert(poisonTooltip.includes('3 turns'), 'poison tooltip includes duration');
assert(poisonTooltip.includes('-5 HP/turn'), 'poison tooltip includes damage info');

const regenEffect = { type: 'regen', name: 'Regen', duration: 2, power: 6 };
const regenTooltip = buildEffectTooltip(regenEffect);
assert(regenTooltip.includes('Regen'), 'regen tooltip includes label');
assert(regenTooltip.includes('2 turns'), 'regen tooltip includes duration');
assert(regenTooltip.includes('+6 HP/turn'), 'regen tooltip includes heal info');

// 1 turn duration should use singular "turn"
const stunEffect = { type: 'stun', name: 'Stun', duration: 1, power: 0 };
const stunTooltip = buildEffectTooltip(stunEffect);
assert(stunTooltip.includes('1 turn'), 'stun tooltip uses singular "turn"');
assert(!stunTooltip.includes('1 turns'), 'stun tooltip does not use plural "1 turns"');

// Effect with zero power — no damage/heal info
const atkUpEffect = { type: 'atk-up', name: 'ATK Up', duration: 3, power: 0 };
const atkUpTooltip = buildEffectTooltip(atkUpEffect);
assert(atkUpTooltip.includes('ATK'), 'atk-up tooltip includes label');
assert(!atkUpTooltip.includes('HP/turn'), 'atk-up tooltip does not include HP/turn for zero power');

// Burn effect
const burnEffect = { type: 'burn', name: 'Burn', duration: 2, power: 4 };
const burnTooltip = buildEffectTooltip(burnEffect);
assert(burnTooltip.includes('-4 HP/turn'), 'burn tooltip includes damage info');

// ── renderStatusBadge ─────────────────────────────────────────────────

console.log('\n=== renderStatusBadge ===');

const poisonBadge = renderStatusBadge(poisonEffect);
assert(typeof poisonBadge === 'string', 'renderStatusBadge returns a string');
assert(poisonBadge.includes('status-badge'), 'badge has status-badge class');
assert(poisonBadge.includes('se-poison'), 'badge has se-poison class');
assert(poisonBadge.includes('status-badge-icon'), 'badge has icon element');
assert(poisonBadge.includes('status-badge-label'), 'badge has label element');
assert(poisonBadge.includes('status-badge-duration'), 'badge has duration element');
assert(poisonBadge.includes('3'), 'badge shows duration 3');
assert(poisonBadge.includes('title='), 'badge has tooltip title attribute');

const regenBadge = renderStatusBadge(regenEffect);
assert(regenBadge.includes('se-regen'), 'regen badge has se-regen class');
assert(regenBadge.includes('status-badge'), 'regen badge has status-badge class');

const stunBadge = renderStatusBadge(stunEffect);
assert(stunBadge.includes('se-stun'), 'stun badge has se-stun class');

// Verify HTML escaping works on labels  
const xssEffect = { type: 'poison', name: '<script>alert("xss")</script>', duration: 1, power: 0 };
const xssBadge = renderStatusBadge(xssEffect);
assert(!xssBadge.includes('<script>'), 'badge HTML-escapes tooltip content');

// Unknown type still renders a badge
const unknownEffect = { type: 'mystery', name: 'Mystery', duration: 2, power: 0 };
const unknownBadge = renderStatusBadge(unknownEffect);
assert(unknownBadge.includes('status-badge'), 'unknown effect still renders a badge');
assert(unknownBadge.includes('se-unknown'), 'unknown effect badge has se-unknown class');

// ── renderStatusEffects ───────────────────────────────────────────────

console.log('\n=== renderStatusEffects ===');

// Empty array
const emptyResult = renderStatusEffects([]);
assert(typeof emptyResult === 'string', 'renderStatusEffects returns a string for empty array');
assert(emptyResult.includes('status-none'), 'empty effects show status-none element');
assert(!emptyResult.includes('status-badge'), 'no badges for empty array');

// Null/undefined
const nullResult = renderStatusEffects(null);
assert(nullResult.includes('status-none'), 'null effects show status-none element');

const undefinedResult = renderStatusEffects(undefined);
assert(undefinedResult.includes('status-none'), 'undefined effects show status-none element');

// Single effect
const singleResult = renderStatusEffects([poisonEffect]);
assert(singleResult.includes('status-badge'), 'single effect renders a badge');
assert(singleResult.includes('se-poison'), 'single effect shows poison badge');
assert(!singleResult.includes('status-none'), 'single effect does not show none marker');

// Multiple effects
const multiResult = renderStatusEffects([poisonEffect, stunEffect, regenEffect]);
assert(multiResult.includes('se-poison'), 'multiple effects include poison');
assert(multiResult.includes('se-stun'), 'multiple effects include stun');
assert(multiResult.includes('se-regen'), 'multiple effects include regen');
const badgeCount = (multiResult.match(/status-badge-icon/g) || []).length;
assertEqual(badgeCount, 3, 'multiple effects render correct badge count');

// All status types render without error
for (const type of knownTypes) {
  const effect = { type, name: STATUS_EFFECT_META[type].label, duration: 2, power: 3 };
  const html = renderStatusEffects([effect]);
  assert(html.includes(`se-${type}`), `renderStatusEffects works for type "${type}"`);
}

// ── renderStatusEffectsRow ────────────────────────────────────────────

console.log('\n=== renderStatusEffectsRow ===');

const rowEmpty = renderStatusEffectsRow([]);
assert(typeof rowEmpty === 'string', 'renderStatusEffectsRow returns a string');
assert(rowEmpty.includes('status-row-label'), 'row has label div');
assert(rowEmpty.includes('status-badges-container'), 'row has badges container');
assert(rowEmpty.includes('status-none'), 'empty row shows none marker');

const rowWithEffects = renderStatusEffectsRow([poisonEffect, regenEffect]);
assert(rowWithEffects.includes('status-row-label'), 'row with effects has label div');
assert(rowWithEffects.includes('status-badges-container'), 'row with effects has badges container');
assert(rowWithEffects.includes('se-poison'), 'row includes poison badge');
assert(rowWithEffects.includes('se-regen'), 'row includes regen badge');
assert(!rowWithEffects.includes('status-none'), 'row with effects does not show none marker');

// ── getStatusEffectStyles ─────────────────────────────────────────────

console.log('\n=== getStatusEffectStyles ===');

const styles = getStatusEffectStyles();
assert(typeof styles === 'string', 'getStatusEffectStyles returns a string');
assert(styles.length > 100, 'styles has meaningful content');
assert(styles.includes('.status-badge'), 'styles includes .status-badge rule');
assert(styles.includes('.status-badges-container'), 'styles includes .status-badges-container rule');
assert(styles.includes('.status-none'), 'styles includes .status-none rule');
assert(styles.includes('.status-row-label'), 'styles includes .status-row-label rule');

// All known effect CSS classes are present in styles
for (const type of knownTypes) {
  const cssClass = `.se-${type}`;
  assert(styles.includes(cssClass), `styles includes rule for "${cssClass}"`);
}

// Styles includes color properties
assert(styles.includes('background'), 'styles includes background color properties');
assert(styles.includes('color'), 'styles includes text color properties');

// ── Integration: simulated combat state ──────────────────────────────

console.log('\n=== Integration: simulated combat state ===');

const mockPlayer = {
  statusEffects: [
    { type: 'poison', name: 'Poison', duration: 3, power: 5 },
    { type: 'stun', name: 'Stun', duration: 1, power: 0 },
  ],
};

const mockEnemy = {
  statusEffects: [
    { type: 'burn', name: 'Burn', duration: 2, power: 4 },
  ],
};

const playerRow = renderStatusEffectsRow(mockPlayer.statusEffects);
assert(playerRow.includes('se-poison'), 'player row shows poison');
assert(playerRow.includes('se-stun'), 'player row shows stun');

const enemyRow = renderStatusEffectsRow(mockEnemy.statusEffects);
assert(enemyRow.includes('se-burn'), 'enemy row shows burn');
assert(!enemyRow.includes('se-poison'), 'enemy row does not show player effects');

// Player with no effects
const playerNoEffects = renderStatusEffectsRow([]);
assert(playerNoEffects.includes('status-none'), 'player with no effects shows none marker');

// ── RESULTS ───────────────────────────────────────────────────────────

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
