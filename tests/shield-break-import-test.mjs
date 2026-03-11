/**
 * Shield/Break Module Import Test — AI Village RPG
 * Run: node tests/shield-break-import-test.mjs
 * Validates that shield-break.js exports work correctly and data is well-formed.
 * Created Day 343 by Claude Opus 4.6.
 */

import {
  checkWeakness,
  applyShieldDamage,
  processBreakState,
  getWeaknessIcons,
  initializeEnemyShields,
  getEnemyShieldData,
  ELEMENT_ICONS,
  BREAK_DURATION,
  ENEMY_SHIELD_DATABASE,
} from '../src/shield-break.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

// ── Exports exist ───────────────────────────────────────────────────────
console.log('\n--- Export presence ---');
assert(typeof checkWeakness === 'function', 'checkWeakness is a function');
assert(typeof applyShieldDamage === 'function', 'applyShieldDamage is a function');
assert(typeof processBreakState === 'function', 'processBreakState is a function');
assert(typeof getWeaknessIcons === 'function', 'getWeaknessIcons is a function');
assert(typeof initializeEnemyShields === 'function', 'initializeEnemyShields is a function');
assert(typeof getEnemyShieldData === 'function', 'getEnemyShieldData is a function');
assert(typeof ELEMENT_ICONS === 'object' && ELEMENT_ICONS !== null, 'ELEMENT_ICONS is an object');
assert(typeof BREAK_DURATION === 'number', 'BREAK_DURATION is a number');
assert(typeof ENEMY_SHIELD_DATABASE === 'object' && ENEMY_SHIELD_DATABASE !== null, 'ENEMY_SHIELD_DATABASE is an object');

// ── Constants ───────────────────────────────────────────────────────────
console.log('\n--- Constants ---');
assert(BREAK_DURATION === 2, 'BREAK_DURATION equals 2');
const expectedElements = ['physical', 'fire', 'ice', 'lightning', 'shadow', 'nature', 'holy'];
for (const el of expectedElements) {
  assert(el in ELEMENT_ICONS, `ELEMENT_ICONS has ${el}`);
  assert(typeof ELEMENT_ICONS[el] === 'string' && ELEMENT_ICONS[el].length > 0, `ELEMENT_ICONS[${el}] is non-empty string`);
}

// ── Enemy Shield Database integrity ─────────────────────────────────────
console.log('\n--- Enemy Shield Database ---');
const requiredEnemies = [
  'slime', 'goblin', 'goblin_chief', 'cave_bat', 'giant_spider',
  'training_dummy', 'wolf', 'skeleton', 'orc', 'fire-spirit',
  'ice-spirit', 'dark-cultist', 'bandit', 'wraith', 'stone-golem',
  'thunder-hawk', 'dragon'
];
assert(Object.keys(ENEMY_SHIELD_DATABASE).length >= 17, 'At least 17 enemies in database');
for (const enemy of requiredEnemies) {
  assert(enemy in ENEMY_SHIELD_DATABASE, `Database has ${enemy}`);
  const data = ENEMY_SHIELD_DATABASE[enemy];
  assert(typeof data.shieldCount === 'number' && data.shieldCount > 0, `${enemy} shieldCount > 0`);
  assert(Array.isArray(data.weaknesses), `${enemy} weaknesses is array`);
  assert(data.weaknesses.length > 0, `${enemy} has at least one weakness`);
  for (const w of data.weaknesses) {
    assert(expectedElements.includes(w), `${enemy} weakness '${w}' is a valid element`);
  }
}

// ── Special properties ──────────────────────────────────────────────────
console.log('\n--- Special enemy properties ---');
assert(ENEMY_SHIELD_DATABASE.training_dummy.breakImmune === true, 'Training dummy is break immune');
assert(ENEMY_SHIELD_DATABASE.dragon.shieldCount === 8, 'Dragon has 8 shields');
assert(ENEMY_SHIELD_DATABASE.wraith.immunities.includes('physical'), 'Wraith immune to physical');
assert(ENEMY_SHIELD_DATABASE.wraith.immunities.includes('shadow'), 'Wraith immune to shadow');
assert(ENEMY_SHIELD_DATABASE.wraith.absorbs.includes('shadow'), 'Wraith absorbs shadow');
assert(ENEMY_SHIELD_DATABASE['fire-spirit'].immunities.includes('fire'), 'Fire-spirit immune to fire');
assert(ENEMY_SHIELD_DATABASE['fire-spirit'].absorbs.includes('fire'), 'Fire-spirit absorbs fire');
assert(ENEMY_SHIELD_DATABASE['ice-spirit'].immunities.includes('ice'), 'Ice-spirit immune to ice');
assert(ENEMY_SHIELD_DATABASE['ice-spirit'].absorbs.includes('ice'), 'Ice-spirit absorbs ice');

// ── checkWeakness ───────────────────────────────────────────────────────
console.log('\n--- checkWeakness ---');
assert(checkWeakness('fire', ['fire', 'ice']) === true, 'fire is weak to fire');
assert(checkWeakness('holy', ['fire', 'ice']) === false, 'holy not in [fire, ice]');
assert(checkWeakness('fire', []) === false, 'empty weaknesses returns false');
assert(checkWeakness(null, ['fire']) === false, 'null element returns false');
assert(checkWeakness('fire', null) === false, 'null weaknesses returns false');

// ── applyShieldDamage ───────────────────────────────────────────────────
console.log('\n--- applyShieldDamage ---');
const e1 = { currentShields: 3, maxShields: 3, isBroken: false, breakImmune: false };
const r1 = applyShieldDamage(e1, 1);
assert(r1.shieldsRemaining === 2, 'Shield reduced by 1 (3->2)');
assert(r1.triggeredBreak === false, 'No break at 2 shields');

const e2 = { currentShields: 1, maxShields: 3, isBroken: false, breakImmune: false };
const r2 = applyShieldDamage(e2, 1);
assert(r2.shieldsRemaining === 0, 'Shield reduced to 0');
assert(r2.triggeredBreak === true, 'Break triggered at 0');

// Note: breakImmune is checked at the combat-integration level, not in applyShieldDamage
const e3 = { currentShields: 2, maxShields: 2, isBroken: false };
const r3 = applyShieldDamage(e3, 5);
assert(r3.shieldsRemaining === 0, 'Overkill damage depletes shields to 0');
assert(r3.triggeredBreak === true, 'Break triggers when shields hit 0');

// Verify already-broken enemy does not re-trigger break
const e4 = { currentShields: 0, maxShields: 3, isBroken: true };
const r4 = applyShieldDamage(e4, 1);
assert(r4.shieldsRemaining === 0, 'Already broken enemy stays at 0');
assert(r4.triggeredBreak === false, 'Already broken does not re-trigger');

// ── processBreakState ───────────────────────────────────────────────────
console.log('\n--- processBreakState ---');
const b1 = { isBroken: true, breakTurnsRemaining: 2, maxShields: 3, currentShields: 0 };
const br1 = processBreakState(b1);
assert(br1.stillBroken === true, 'Still broken at 2 turns remaining');
assert(br1.turnsRemaining === 1, 'Turns decremented');

const b2 = { isBroken: true, breakTurnsRemaining: 1, maxShields: 3, currentShields: 0 };
const br2 = processBreakState(b2);
assert(br2.stillBroken === false, 'Recovered when turns hit 0');
assert(br2.recoveredThisTurn === true, 'recoveredThisTurn flag set');
assert(br2.restoredShields === 3, 'Shields restored to max');

const b3 = { isBroken: false, breakTurnsRemaining: 0, maxShields: 3, currentShields: 3 };
const br3 = processBreakState(b3);
assert(br3.stillBroken === false, 'Non-broken stays non-broken');

// ── getWeaknessIcons ────────────────────────────────────────────────────
console.log('\n--- getWeaknessIcons ---');
const icons1 = getWeaknessIcons(['fire', 'ice']);
assert(typeof icons1 === 'string', 'getWeaknessIcons returns string');
assert(icons1.includes(ELEMENT_ICONS.fire), 'Fire icon in output');
assert(icons1.includes(ELEMENT_ICONS.ice), 'Ice icon in output');

const icons2 = getWeaknessIcons([]);
assert(icons2 === '' || icons2.length === 0, 'Empty weaknesses returns empty');

// ── initializeEnemyShields ──────────────────────────────────────────────
console.log('\n--- initializeEnemyShields ---');
const gs = initializeEnemyShields('goblin', 1);
assert(gs.shieldCount === 2 || gs.currentShields === 2, 'Goblin has 2 shields');
assert(gs.maxShields === 2, 'Goblin max shields = 2');
assert(Array.isArray(gs.weaknesses), 'Goblin weaknesses is array');
assert(gs.weaknesses.includes('fire'), 'Goblin weak to fire');
assert(gs.weaknesses.includes('holy'), 'Goblin weak to holy');
assert(gs.isBroken === false, 'Starts not broken');

const ds = initializeEnemyShields('dragon', 4);
assert(ds.shieldCount === 8 || ds.currentShields === 8, 'Dragon has 8 shields');
assert(ds.weaknesses.includes('ice'), 'Dragon weak to ice');

const us = initializeEnemyShields('unknown_enemy', 1);
assert(us.shieldCount === 2 || us.currentShields === 2, 'Unknown gets default 2');
assert(us.weaknesses.length === 0, 'Unknown has no weaknesses');

// ── getEnemyShieldData ──────────────────────────────────────────────────
console.log('\n--- getEnemyShieldData ---');
const sd = getEnemyShieldData('slime');
assert(sd !== null && sd !== undefined, 'Slime data returned');
assert(sd.shieldCount === 2, 'Slime has 2 shields');
assert(sd.weaknesses.includes('fire'), 'Slime weak to fire');
assert(sd.weaknesses.includes('lightning'), 'Slime weak to lightning');

const nd = getEnemyShieldData('nonexistent');
assert(nd === null || nd === undefined || nd.shieldCount === 2, 'Nonexistent returns null/undefined/default');

// ── Summary ─────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Shield/Break Import Tests: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) process.exit(1);
