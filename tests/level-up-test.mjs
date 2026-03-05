/**
 * Level-Up System Tests
 * Tests for src/level-up.js — XP threshold detection, stat diff display,
 * level-up state management, and integration with characters/stats.js.
 */

import {
  checkLevelUps,
  createLevelUpState,
  advanceLevelUp,
  getCurrentLevelUp,
  getStatDiffs,
  formatStatName,
  xpForNextLevel,
  DISPLAY_STATS,
} from '../src/level-up.js';
import { createCharacter } from '../src/characters/character.js';
import { calcLevel, XP_THRESHOLDS, STAT_GROWTH, applyLevelUp } from '../src/characters/stats.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed += 1;
    process.stdout.write(`  \u2705 ${label}\n`);
  } else {
    failed += 1;
    process.stdout.write(`  \u274c ${label}\n`);
  }
}

// ─── Helper: create a party member at a given level/xp ───

function makeMember(name, classId, xp) {
  const char = createCharacter({ name, classId, id: name.toLowerCase() });
  // Manually set XP and level to simulate progression
  let c = { ...char, xp };
  const targetLevel = calcLevel(xp);
  while (c.level < targetLevel) {
    c = applyLevelUp(c);
  }
  return c;
}

// ═══════════════════════════════════════════
// checkLevelUps
// ═══════════════════════════════════════════

console.log('\n--- checkLevelUps: basic detection ---');

{
  const warrior = makeMember('Hero', 'warrior', 0);
  assert(warrior.level === 1, 'warrior starts at level 1');
  assert(warrior.xp === 0, 'warrior starts with 0 XP');

  // 100 XP should reach level 2
  const results = checkLevelUps([warrior], 100);
  assert(results.length === 1, 'one member levels up');
  assert(results[0].name === 'Hero', 'correct member name');
  assert(results[0].oldLevel === 1, 'old level is 1');
  assert(results[0].newLevel === 2, 'new level is 2');
  assert(results[0].classId === 'warrior', 'classId preserved');
}

console.log('\n--- checkLevelUps: no level up ---');

{
  const warrior = makeMember('Hero', 'warrior', 0);
  const results = checkLevelUps([warrior], 50);
  assert(results.length === 0, 'no level up with 50 XP (need 100)');
}

console.log('\n--- checkLevelUps: multi-level jump ---');

{
  const warrior = makeMember('Hero', 'warrior', 0);
  // 250 XP should reach level 3 (thresholds: 0, 100, 250)
  const results = checkLevelUps([warrior], 250);
  assert(results.length === 1, 'one member levels up');
  assert(results[0].oldLevel === 1, 'from level 1');
  assert(results[0].newLevel === 3, 'to level 3 (multi-level jump)');
}

console.log('\n--- checkLevelUps: multiple party members ---');

{
  const warrior = makeMember('Hero', 'warrior', 0);
  const mage = makeMember('Sage', 'mage', 0);
  const rogue = makeMember('Shadow', 'rogue', 90);

  // 100 XP: warrior 0→100 (lv2), mage 0→100 (lv2), rogue 90→190 (lv2 at 100)
  const results = checkLevelUps([warrior, mage, rogue], 100);
  assert(results.length === 3, 'all three level up');
  assert(results[0].name === 'Hero', 'Hero levels up');
  assert(results[1].name === 'Sage', 'Sage levels up');
  assert(results[2].name === 'Shadow', 'Shadow levels up');
}

console.log('\n--- checkLevelUps: already at threshold ---');

{
  const warrior = makeMember('Hero', 'warrior', 100);
  assert(warrior.level === 2, 'starts at level 2');

  // Need 250 total for level 3, already at 100, so 150 more
  const results = checkLevelUps([warrior], 150);
  assert(results.length === 1, 'levels up');
  assert(results[0].oldLevel === 2, 'from level 2');
  assert(results[0].newLevel === 3, 'to level 3');
}

console.log('\n--- checkLevelUps: max level ---');

{
  const warrior = makeMember('Hero', 'warrior', 10450);
  assert(warrior.level === 20, 'starts at max level 20');

  const results = checkLevelUps([warrior], 1000);
  assert(results.length === 0, 'no level up at max level');
}

console.log('\n--- checkLevelUps: edge cases ---');

{
  assert(checkLevelUps([], 100).length === 0, 'empty members array');
  assert(checkLevelUps(null, 100).length === 0, 'null members');
  assert(checkLevelUps([makeMember('Hero', 'warrior', 0)], 0).length === 0, 'zero XP');
  assert(checkLevelUps([makeMember('Hero', 'warrior', 0)], -50).length === 0, 'negative XP');
  assert(checkLevelUps([null, undefined], 100).length === 0, 'null/undefined members skipped');
}

console.log('\n--- checkLevelUps: stat snapshots ---');

{
  const warrior = makeMember('Hero', 'warrior', 0);
  const results = checkLevelUps([warrior], 100);
  const r = results[0];

  // Warrior growth: hp+10, mp+2, atk+3, def+3, spd+1, int+0, lck+1
  assert(r.newStats.maxHp === r.oldStats.maxHp + 10, 'warrior maxHp +10');
  assert(r.newStats.maxMp === r.oldStats.maxMp + 2, 'warrior maxMp +2');
  assert(r.newStats.atk === r.oldStats.atk + 3, 'warrior atk +3');
  assert(r.newStats.def === r.oldStats.def + 3, 'warrior def +3');
  assert(r.newStats.spd === r.oldStats.spd + 1, 'warrior spd +1');
  assert(r.newStats.lck === r.oldStats.lck + 1, 'warrior lck +1');
}

console.log('\n--- checkLevelUps: different classes ---');

{
  const mage = makeMember('Sage', 'mage', 0);
  const results = checkLevelUps([mage], 100);
  const r = results[0];

  // Mage growth: hp+4, mp+8, atk+1, def+1, spd+1, int+4, lck+1
  assert(r.newStats.maxHp === r.oldStats.maxHp + 4, 'mage maxHp +4');
  assert(r.newStats.maxMp === r.oldStats.maxMp + 8, 'mage maxMp +8');
  assert(r.newStats.int === r.oldStats.int + 4, 'mage int +4');
}

{
  const rogue = makeMember('Shadow', 'rogue', 0);
  const results = checkLevelUps([rogue], 100);
  const r = results[0];

  // Rogue growth: hp+6, mp+3, atk+2, def+1, spd+3, int+1, lck+2
  assert(r.newStats.spd === r.oldStats.spd + 3, 'rogue spd +3');
  assert(r.newStats.lck === r.oldStats.lck + 2, 'rogue lck +2');
}

{
  const cleric = makeMember('Healer', 'cleric', 0);
  const results = checkLevelUps([cleric], 100);
  const r = results[0];

  // Cleric growth: hp+7, mp+6, atk+2, def+2, spd+1, int+2, lck+1
  assert(r.newStats.maxHp === r.oldStats.maxHp + 7, 'cleric maxHp +7');
  assert(r.newStats.maxMp === r.oldStats.maxMp + 6, 'cleric maxMp +6');
}

// ═══════════════════════════════════════════
// createLevelUpState
// ═══════════════════════════════════════════

console.log('\n--- createLevelUpState ---');

{
  const levelUps = [{ name: 'Hero', oldLevel: 1, newLevel: 2 }];
  const state = createLevelUpState(levelUps, 'victory');

  assert(state.screen === 'level-up', 'screen is level-up');
  assert(state.levelUps.length === 1, 'has 1 level-up entry');
  assert(state.currentIndex === 0, 'starts at index 0');
  assert(state.returnPhase === 'victory', 'returnPhase is victory');
}

{
  const state = createLevelUpState(null, 'exploration');
  assert(state.levelUps.length === 0, 'null levelUps defaults to empty array');
  assert(state.returnPhase === 'exploration', 'custom returnPhase');
}

{
  const state = createLevelUpState([], undefined);
  assert(state.returnPhase === 'victory', 'default returnPhase is victory');
}

// ═══════════════════════════════════════════
// advanceLevelUp
// ═══════════════════════════════════════════

console.log('\n--- advanceLevelUp ---');

{
  const state = createLevelUpState([
    { name: 'Hero', oldLevel: 1, newLevel: 2 },
    { name: 'Sage', oldLevel: 1, newLevel: 2 },
  ], 'victory');

  // First advance: move from index 0 → 1
  const { levelUpState: next1, done: done1 } = advanceLevelUp(state);
  assert(!done1, 'not done after first advance');
  assert(next1.currentIndex === 1, 'advanced to index 1');

  // Second advance: index 1 → 2 (out of range = done)
  const { levelUpState: next2, done: done2 } = advanceLevelUp(next1);
  assert(done2, 'done after all level-ups viewed');
  assert(next2 === null, 'state is null when done');
}

{
  const { levelUpState, done } = advanceLevelUp(null);
  assert(done, 'null state is done');
  assert(levelUpState === null, 'null state returns null');
}

{
  const state = createLevelUpState([{ name: 'Hero' }], 'victory');
  const { done } = advanceLevelUp(state);
  assert(done, 'single entry: done after first advance');
}

// ═══════════════════════════════════════════
// getCurrentLevelUp
// ═══════════════════════════════════════════

console.log('\n--- getCurrentLevelUp ---');

{
  const entries = [
    { name: 'Hero', oldLevel: 1, newLevel: 2 },
    { name: 'Sage', oldLevel: 1, newLevel: 3 },
  ];
  const state = createLevelUpState(entries, 'victory');

  const current = getCurrentLevelUp(state);
  assert(current.name === 'Hero', 'first entry is Hero');
  assert(current.newLevel === 2, 'Hero new level is 2');

  const next = advanceLevelUp(state).levelUpState;
  const current2 = getCurrentLevelUp(next);
  assert(current2.name === 'Sage', 'second entry is Sage');
  assert(current2.newLevel === 3, 'Sage new level is 3');
}

{
  assert(getCurrentLevelUp(null) === null, 'null state returns null');
  assert(getCurrentLevelUp({}) === null, 'empty state returns null');
  assert(getCurrentLevelUp({ levelUps: [], currentIndex: 0 }) === null, 'out of range returns null (via ??)');
}

// ═══════════════════════════════════════════
// getStatDiffs
// ═══════════════════════════════════════════

console.log('\n--- getStatDiffs ---');

{
  const oldStats = { maxHp: 50, maxMp: 10, atk: 8, def: 6, spd: 5, int: 3, lck: 2 };
  const newStats = { maxHp: 60, maxMp: 12, atk: 11, def: 9, spd: 6, int: 3, lck: 3 };

  const diffs = getStatDiffs(oldStats, newStats);
  assert(diffs.length === 6, '6 stats changed (int unchanged)');

  const hpDiff = diffs.find(d => d.stat === 'maxHp');
  assert(hpDiff.oldValue === 50, 'maxHp old value');
  assert(hpDiff.newValue === 60, 'maxHp new value');
  assert(hpDiff.diff === 10, 'maxHp diff is +10');

  const atkDiff = diffs.find(d => d.stat === 'atk');
  assert(atkDiff.diff === 3, 'atk diff is +3');

  const intDiff = diffs.find(d => d.stat === 'int');
  assert(intDiff === undefined, 'int not in diffs (unchanged)');
}

{
  assert(getStatDiffs(null, {}).length === 0, 'null oldStats returns empty');
  assert(getStatDiffs({}, null).length === 0, 'null newStats returns empty');
  assert(getStatDiffs(null, null).length === 0, 'both null returns empty');
}

{
  const same = { maxHp: 50, maxMp: 10, atk: 8, def: 6, spd: 5, int: 3, lck: 2 };
  assert(getStatDiffs(same, same).length === 0, 'identical stats = no diffs');
}

// ═══════════════════════════════════════════
// formatStatName
// ═══════════════════════════════════════════

console.log('\n--- formatStatName ---');

{
  assert(formatStatName('maxHp') === 'Max HP', 'maxHp → Max HP');
  assert(formatStatName('maxMp') === 'Max MP', 'maxMp → Max MP');
  assert(formatStatName('atk') === 'ATK', 'atk → ATK');
  assert(formatStatName('def') === 'DEF', 'def → DEF');
  assert(formatStatName('spd') === 'SPD', 'spd → SPD');
  assert(formatStatName('int') === 'INT', 'int → INT');
  assert(formatStatName('lck') === 'LCK', 'lck → LCK');
  assert(formatStatName('hp') === 'HP', 'hp → HP');
  assert(formatStatName('mp') === 'MP', 'mp → MP');
  assert(formatStatName('unknownStat') === 'unknownStat', 'unknown stat passes through');
}

// ═══════════════════════════════════════════
// xpForNextLevel
// ═══════════════════════════════════════════

console.log('\n--- xpForNextLevel ---');

{
  assert(xpForNextLevel(1) === 100, 'level 1 → need 100 XP for level 2');
  assert(xpForNextLevel(2) === 250, 'level 2 → need 250 total for level 3');
  assert(xpForNextLevel(19) === 10450, 'level 19 → need 10450 for level 20');
  assert(xpForNextLevel(20) === 0, 'level 20 → max level, 0 needed');
  assert(xpForNextLevel(99) === 0, 'beyond max → 0');
}

// ═══════════════════════════════════════════
// DISPLAY_STATS constant
// ═══════════════════════════════════════════

console.log('\n--- DISPLAY_STATS ---');

{
  assert(Array.isArray(DISPLAY_STATS), 'DISPLAY_STATS is an array');
  assert(DISPLAY_STATS.length === 7, 'has 7 display stats');
  assert(DISPLAY_STATS.includes('maxHp'), 'includes maxHp');
  assert(DISPLAY_STATS.includes('maxMp'), 'includes maxMp');
  assert(DISPLAY_STATS.includes('atk'), 'includes atk');
  assert(DISPLAY_STATS.includes('def'), 'includes def');
  assert(DISPLAY_STATS.includes('spd'), 'includes spd');
  assert(DISPLAY_STATS.includes('int'), 'includes int');
  assert(DISPLAY_STATS.includes('lck'), 'includes lck');
}

// ═══════════════════════════════════════════
// Integration: full level-up flow
// ═══════════════════════════════════════════

console.log('\n--- Full level-up flow integration ---');

{
  // Simulate a 4-member party gaining XP after combat
  const party = [
    makeMember('Hero', 'warrior', 80),
    makeMember('Sage', 'mage', 90),
    makeMember('Shadow', 'rogue', 50),
    makeMember('Healer', 'cleric', 95),
  ];

  // 25 XP each: Hero 80→105 (lv2!), Sage 90→115 (lv2!), Shadow 50→75 (no), Healer 95→120 (lv2!)
  const levelUps = checkLevelUps(party, 25);
  assert(levelUps.length === 3, '3 of 4 party members level up');

  const luState = createLevelUpState(levelUps, 'victory');
  assert(getCurrentLevelUp(luState).name === 'Hero', 'first is Hero');

  const { levelUpState: s2, done: d2 } = advanceLevelUp(luState);
  assert(!d2, 'not done after Hero');
  assert(getCurrentLevelUp(s2).name === 'Sage', 'second is Sage');

  const { levelUpState: s3, done: d3 } = advanceLevelUp(s2);
  assert(!d3, 'not done after Sage');
  assert(getCurrentLevelUp(s3).name === 'Healer', 'third is Healer');

  const { done: d4 } = advanceLevelUp(s3);
  assert(d4, 'done after all three');

  // Verify stat diffs for Hero (warrior)
  const heroDiffs = getStatDiffs(levelUps[0].oldStats, levelUps[0].newStats);
  assert(heroDiffs.length > 0, 'Hero has stat changes');
  const heroHpDiff = heroDiffs.find(d => d.stat === 'maxHp');
  assert(heroHpDiff && heroHpDiff.diff === 10, 'Hero HP grew by 10');
}

console.log('\n--- Party with mixed levels ---');

{
  // One member already high level, one just short of level up
  const party = [
    makeMember('Hero', 'warrior', 240),  // Just under lv3 (250)
    makeMember('Sage', 'mage', 10450),    // Max level 20
  ];

  const levelUps = checkLevelUps(party, 15);
  assert(levelUps.length === 1, 'only Hero levels up (Sage at max)');
  assert(levelUps[0].name === 'Hero', 'Hero levels up');
  assert(levelUps[0].oldLevel === 2, 'Hero was level 2');
  assert(levelUps[0].newLevel === 3, 'Hero reaches level 3');
}

console.log('\n--- Rogue multi-level: verify all stats ---');

{
  const rogue = makeMember('Shadow', 'rogue', 0);
  // 450 XP → level 4 (thresholds: 0, 100, 250, 450)
  const results = checkLevelUps([rogue], 450);
  assert(results.length === 1, 'rogue levels up');
  assert(results[0].newLevel === 4, 'reaches level 4 (3 level-ups)');

  const growth = STAT_GROWTH.rogue;
  const r = results[0];
  assert(r.newStats.maxHp === r.oldStats.maxHp + growth.hp * 3, 'rogue HP grew 3x');
  assert(r.newStats.atk === r.oldStats.atk + growth.atk * 3, 'rogue ATK grew 3x');
  assert(r.newStats.spd === r.oldStats.spd + growth.spd * 3, 'rogue SPD grew 3x');
}

// ═══════════════════════════════════════════
// Easter egg scan
// ═══════════════════════════════════════════

console.log('\n--- Easter egg scan ---');

{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/level-up.js', import.meta.url), 'utf8');
  const lower = src.toLowerCase();
  assert(!lower.includes('easter'), 'no "easter" in level-up.js');
  assert(!lower.includes('egg'), 'no "egg" in level-up.js');
  assert(!lower.includes('bunny'), 'no "bunny" in level-up.js');
  assert(!lower.includes('rabbit'), 'no "rabbit" in level-up.js');
  assert(!src.includes('eval('), 'no eval() in level-up.js');
  assert(!src.includes('atob'), 'no atob in level-up.js');
  assert(!src.includes('btoa'), 'no btoa in level-up.js');
  assert(!src.includes('fromCharCode'), 'no fromCharCode in level-up.js');
}

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════


// ═══════════════════════════════════════════
// Wiring tests: main.js dispatch + render.js
// ═══════════════════════════════════════════

console.log('\n--- Wiring: main.js imports level-up module ---');

{
  const fs = await import('node:fs');
  const mainSrc = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  assert(mainSrc.includes("from './level-up.js'"), 'main.js imports from level-up.js');
  assert(mainSrc.includes('checkLevelUps'), 'main.js imports checkLevelUps');
  assert(mainSrc.includes('createLevelUpState'), 'main.js imports createLevelUpState');
  assert(mainSrc.includes('advanceLevelUp'), 'main.js imports advanceLevelUp');
  assert(mainSrc.includes('getCurrentLevelUp'), 'main.js imports getCurrentLevelUp');
  assert(mainSrc.includes('calcLevel'), 'main.js imports calcLevel');
}

console.log('\n--- Wiring: main.js dispatch actions ---');

{
  const fs = await import('node:fs');
  const mainSrc = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  assert(mainSrc.includes("'VIEW_LEVEL_UPS'"), 'main.js handles VIEW_LEVEL_UPS action');
  assert(mainSrc.includes("'LEVEL_UP_CONTINUE'"), 'main.js handles LEVEL_UP_CONTINUE action');
  assert(mainSrc.includes('pendingLevelUps'), 'main.js tracks pendingLevelUps');
  assert(mainSrc.includes("phase: 'level-up'"), 'main.js sets level-up phase');
}

console.log('\n--- Wiring: main.js victory detection ---');

{
  const fs = await import('node:fs');
  const mainSrc = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  // setState should detect level-ups when entering victory
  assert(mainSrc.includes("next.phase === 'victory'"), 'setState detects victory phase');
  assert(mainSrc.includes('calcLevel(player.xp'), 'setState calculates new level from XP');
  assert(mainSrc.includes('newLevel > oldLevel'), 'setState checks for level increase');
}

console.log('\n--- Wiring: render.js level-up phase ---');

{
  const fs = await import('node:fs');
  const renderSrc = fs.readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');

  assert(renderSrc.includes("from './level-up.js'"), 'render.js imports from level-up.js');
  assert(renderSrc.includes('getCurrentLevelUp'), 'render.js imports getCurrentLevelUp');
  assert(renderSrc.includes('getStatDiffs'), 'render.js imports getStatDiffs');
  assert(renderSrc.includes('formatStatName'), 'render.js imports formatStatName');
  assert(renderSrc.includes('xpForNextLevel'), 'render.js imports xpForNextLevel');
  assert(renderSrc.includes("phase === 'level-up'"), 'render.js handles level-up phase');
  assert(renderSrc.includes('Level Up'), 'render.js shows Level Up heading');
  assert(renderSrc.includes('Stat Growth'), 'render.js shows Stat Growth section');
  assert(renderSrc.includes('btnLevelUpContinue'), 'render.js has continue button');
  assert(renderSrc.includes('LEVEL_UP_CONTINUE'), 'render.js dispatches LEVEL_UP_CONTINUE');
}

console.log('\n--- Wiring: render.js victory shows level-up button ---');

{
  const fs = await import('node:fs');
  const renderSrc = fs.readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');

  assert(renderSrc.includes('pendingLevelUps'), 'render.js checks pendingLevelUps');
  assert(renderSrc.includes('btnViewLevelUps'), 'render.js has View Level Ups button');
  assert(renderSrc.includes('VIEW_LEVEL_UPS'), 'render.js dispatches VIEW_LEVEL_UPS');
}

console.log('\n--- Wiring: easter egg scan on main.js and render.js ---');

{
  const fs = await import('node:fs');
  const mainSrc = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const renderSrc = fs.readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  const mainLower = mainSrc.toLowerCase();
  const renderLower = renderSrc.toLowerCase();

  // Note: "level" contains no egg references. Check for actual sabotage patterns.
  assert(!mainLower.includes('easter'), 'main.js: no "easter"');
  assert(!mainLower.includes('bunny'), 'main.js: no "bunny"');
  assert(!mainLower.includes('rabbit'), 'main.js: no "rabbit"');
  assert(!mainSrc.includes('eval('), 'main.js: no eval()');
  assert(!mainSrc.includes('atob'), 'main.js: no atob');
  assert(!mainSrc.includes('fromCharCode'), 'main.js: no fromCharCode');

  assert(!renderLower.includes('easter'), 'render.js: no "easter"');
  assert(!renderLower.includes('bunny'), 'render.js: no "bunny"');
  assert(!renderLower.includes('rabbit'), 'render.js: no "rabbit"');
  assert(!renderSrc.includes('eval('), 'render.js: no eval()');
  assert(!renderSrc.includes('atob'), 'render.js: no atob');
  assert(!renderSrc.includes('fromCharCode'), 'render.js: no fromCharCode');
}

// Update summary
console.log(`\n==========================================`);
console.log(`Level-Up System Tests: ${passed} passed, ${failed} failed`);
console.log(`==========================================`);

process.exit(failed > 0 ? 1 : 0);
