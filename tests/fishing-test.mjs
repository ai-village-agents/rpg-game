/**
 * Fishing Minigame Tests
 */
import { strict as assert } from 'node:assert';

import {
  FISH_DATA,
  FISHING_SPOTS,
  BAIT_TYPES,
  initFishingState,
  startFishing,
  selectFish,
  hookFish,
  reelIn,
  waitAction,
  stopFishing,
  getFishingSummary,
  getFishValue
} from '../src/fishing.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('\n=== Fishing Minigame Tests ===\n');

// --- FISH_DATA ---
console.log('[FISH_DATA]');
test('contains at least 10 fish types', () => {
  assert.ok(Object.keys(FISH_DATA).length >= 10);
});

test('all fish have required fields', () => {
  for (const [id, fish] of Object.entries(FISH_DATA)) {
    assert.ok(fish.id, `${id} missing id`);
    assert.ok(fish.name, `${id} missing name`);
    assert.ok(fish.rarity, `${id} missing rarity`);
    assert.ok(typeof fish.value === 'number', `${id} missing value`);
    assert.ok(fish.description, `${id} missing description`);
  }
});

test('rarity distribution is correct', () => {
  const rarities = Object.values(FISH_DATA).map(f => f.rarity);
  assert.ok(rarities.includes('Common'));
  assert.ok(rarities.includes('Uncommon'));
  assert.ok(rarities.includes('Rare'));
  assert.ok(rarities.includes('Epic'));
});

test('material items are marked', () => {
  assert.ok(FISH_DATA.salmonRoe.isMaterial);
  assert.ok(FISH_DATA.goldenCaviar.isMaterial);
});

// --- FISHING_SPOTS ---
console.log('\n[FISHING_SPOTS]');
test('has at least 2 fishing spots', () => {
  assert.ok(Object.keys(FISHING_SPOTS).length >= 2);
});

test('each spot has a fishPool with weights', () => {
  for (const [id, spot] of Object.entries(FISHING_SPOTS)) {
    assert.ok(Array.isArray(spot.fishPool), `${id} missing fishPool`);
    assert.ok(spot.fishPool.length > 0, `${id} has empty fishPool`);
    for (const entry of spot.fishPool) {
      assert.ok(entry.fishId, 'fishPool entry missing fishId');
      assert.ok(typeof entry.weight === 'number', 'fishPool entry missing weight');
    }
  }
});

test('all fishPool references exist in FISH_DATA', () => {
  for (const spot of Object.values(FISHING_SPOTS)) {
    for (const entry of spot.fishPool) {
      assert.ok(FISH_DATA[entry.fishId], `Unknown fish: ${entry.fishId}`);
    }
  }
});

// --- BAIT_TYPES ---
console.log('\n[BAIT_TYPES]');
test('has at least 3 bait types', () => {
  assert.ok(Object.keys(BAIT_TYPES).length >= 3);
});

test('bait types have required fields', () => {
  for (const [id, bait] of Object.entries(BAIT_TYPES)) {
    assert.ok(bait.id, `${id} missing id`);
    assert.ok(bait.name, `${id} missing name`);
    assert.ok(typeof bait.value === 'number', `${id} missing value`);
  }
});

// --- initFishingState ---
console.log('\n[initFishingState]');
test('returns proper initial state', () => {
  const s = initFishingState();
  assert.equal(s.active, false);
  assert.equal(s.phase, 'idle');
  assert.equal(s.totalCaught, 0);
  assert.equal(s.tension, 0);
  assert.equal(s.reelProgress, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.currentSpot, null);
  assert.equal(s.fishOnLine, null);
});

// --- startFishing ---
console.log('\n[startFishing]');
test('starts fishing at valid spot', () => {
  const state = {};
  const result = startFishing(state, 'village_dock', 'worm');
  assert.equal(result.fishingState.active, true);
  assert.equal(result.fishingState.phase, 'waiting');
  assert.equal(result.fishingState.currentSpot, 'village_dock');
  assert.equal(result.fishingState.bait, 'worm');
});

test('handles invalid spot gracefully', () => {
  const state = {};
  const result = startFishing(state, 'nonexistent', null);
  assert.ok(result.fishingState);
  assert.equal(result.fishingState.phase, 'idle');
});

test('starts without bait', () => {
  const state = {};
  const result = startFishing(state, 'marsh_shallows', null);
  assert.equal(result.fishingState.active, true);
  assert.equal(result.fishingState.bait, null);
});

// --- selectFish ---
console.log('\n[selectFish]');
test('returns a fish from valid spot', () => {
  const fish = selectFish('village_dock', null);
  assert.ok(fish);
  assert.ok(fish.id);
  assert.ok(fish.name);
});

test('returns null for invalid spot', () => {
  const fish = selectFish('nonexistent', null);
  assert.equal(fish, null);
});

test('works with bait', () => {
  const fish = selectFish('village_dock', 'glowbait');
  assert.ok(fish);
});

// --- hookFish ---
console.log('\n[hookFish]');
test('hooks fish in waiting phase', () => {
  let state = startFishing({}, 'village_dock', 'worm');
  state = hookFish(state);
  assert.equal(state.fishingState.phase, 'hooked');
  assert.ok(state.fishingState.fishOnLine);
  assert.equal(state.fishingState.tension, 20);
});

test('does not hook in idle phase', () => {
  const state = { fishingState: initFishingState() };
  const result = hookFish(state);
  assert.equal(result.fishingState.phase, 'idle');
});

// --- reelIn ---
console.log('\n[reelIn]');
test('increases progress and tension', () => {
  let state = startFishing({}, 'village_dock', 'worm');
  state = hookFish(state);
  const before = { ...state.fishingState };
  state = reelIn(state);
  assert.ok(state.fishingState.reelProgress > before.reelProgress);
  assert.ok(state.fishingState.tension > before.tension);
});

test('does nothing outside hooked phase', () => {
  const state = { fishingState: initFishingState() };
  const result = reelIn(state);
  assert.equal(result.fishingState.reelProgress, 0);
});

test('line snaps at max tension', () => {
  let state = startFishing({}, 'village_dock', null);
  state = hookFish(state);
  // Force high tension
  state.fishingState.tension = 95;
  state.fishingState.fishOnLine = { ...FISH_DATA.abyssalLeviathan };
  state = reelIn(state);
  assert.equal(state.fishingState.phase, 'escaped');
  assert.equal(state.fishingState.streak, 0);
});

test('catches fish when progress reaches target', () => {
  let state = startFishing({}, 'village_dock', null);
  state = hookFish(state);
  // Force near-complete progress with low-difficulty fish
  state.fishingState.reelProgress = 95;
  state.fishingState.tension = 10;
  state.fishingState.fishOnLine = { ...FISH_DATA.smallPerch };
  state = reelIn(state);
  assert.equal(state.fishingState.phase, 'caught');
  assert.equal(state.fishingState.totalCaught, 1);
  assert.ok(state.fishingState.fishLog['smallPerch'] >= 1);
});

// --- waitAction ---
console.log('\n[waitAction]');
test('decreases tension', () => {
  let state = startFishing({}, 'village_dock', null);
  state = hookFish(state);
  state = reelIn(state); // increase tension
  const tensionBefore = state.fishingState.tension;
  state = waitAction(state);
  assert.ok(state.fishingState.tension < tensionBefore);
});

test('does not go below 0 tension', () => {
  let state = startFishing({}, 'village_dock', null);
  state = hookFish(state);
  state.fishingState.tension = 3;
  state.fishingState.fishOnLine = FISH_DATA.smallPerch;
  state = waitAction(state);
  assert.ok(state.fishingState.tension >= 0);
});

// --- stopFishing ---
console.log('\n[stopFishing]');
test('resets fishing to idle', () => {
  let state = startFishing({}, 'village_dock', 'worm');
  state = stopFishing(state);
  assert.equal(state.fishingState.active, false);
  assert.equal(state.fishingState.phase, 'idle');
  assert.equal(state.fishingState.currentSpot, null);
});

test('handles no fishingState', () => {
  const result = stopFishing({});
  assert.ok(result);
});

// --- getFishingSummary ---
console.log('\n[getFishingSummary]');
test('returns null for no state', () => {
  assert.equal(getFishingSummary(null), null);
});

test('returns correct summary', () => {
  const fs = initFishingState();
  fs.totalCaught = 5;
  fs.fishLog = { smallPerch: 3, riverTrout: 2 };
  fs.bestCatch = 'riverTrout';
  fs.streak = 2;
  const summary = getFishingSummary(fs);
  assert.equal(summary.totalCaught, 5);
  assert.equal(summary.uniqueTypes, 2);
  assert.ok(summary.totalTypes >= 10);
  assert.equal(summary.bestCatch, 'River Trout');
  assert.equal(summary.currentStreak, 2);
});

// --- getFishValue ---
console.log('\n[getFishValue]');
test('returns base value with no streak', () => {
  assert.equal(getFishValue(FISH_DATA.smallPerch, 0), 3);
});

test('applies streak bonus', () => {
  const val = getFishValue(FISH_DATA.smallPerch, 10);
  assert.ok(val > FISH_DATA.smallPerch.value);
});

test('caps streak bonus at 10', () => {
  const val10 = getFishValue(FISH_DATA.smallPerch, 10);
  const val20 = getFishValue(FISH_DATA.smallPerch, 20);
  assert.equal(val10, val20);
});

test('handles null fish', () => {
  assert.equal(getFishValue(null, 5), 0);
});

// --- Results ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
