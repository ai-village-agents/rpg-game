import assert from 'node:assert';
import {
  createGameStats,
  recordShieldBroken,
  recordWeaknessHit,
  recordDefeatedWhileBroken,
} from '../src/game-stats.js';
import {
  trackAchievements,
  isUnlocked,
  getProgress,
} from '../src/achievements.js';

console.log('Running Shield Achievement Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.stack || err.message}`);
    failed++;
  }
}

function statsWith(overrides = {}) {
  return { ...createGameStats(), ...overrides };
}

function baseState(overrides = {}) {
  return {
    gameStats: createGameStats(),
    achievements: [],
    unlockedAchievements: [],
    ...overrides,
  };
}

// === createGameStats validations ===
test('createGameStats includes shield counters initialized to zero', () => {
  const stats = createGameStats();
  assert.strictEqual(stats.shieldsBroken, 0);
  assert.strictEqual(stats.weaknessHits, 0);
  assert.strictEqual(stats.defeatedWhileBroken, 0);
});

test('createGameStats shield counters are integers', () => {
  const stats = createGameStats();
  assert(Number.isInteger(stats.shieldsBroken));
  assert(Number.isInteger(stats.weaknessHits));
  assert(Number.isInteger(stats.defeatedWhileBroken));
});

test('createGameStats returns distinct instances for shield counters', () => {
  const a = createGameStats();
  const b = createGameStats();
  assert.notStrictEqual(a, b);
  assert.strictEqual(a.shieldsBroken, b.shieldsBroken);
  assert.strictEqual(a.weaknessHits, b.weaknessHits);
  assert.strictEqual(a.defeatedWhileBroken, b.defeatedWhileBroken);
});

test('createGameStats instances keep shield counters independent', () => {
  const a = createGameStats();
  const b = createGameStats();
  const mutated = { ...a, shieldsBroken: 9 };
  assert.strictEqual(mutated.shieldsBroken, 9);
  assert.strictEqual(b.shieldsBroken, 0);
});

test('createGameStats spread retains shield counters', () => {
  const stats = { ...createGameStats(), extra: true };
  assert.strictEqual(stats.shieldsBroken, 0);
  assert.strictEqual(stats.weaknessHits, 0);
  assert.strictEqual(stats.defeatedWhileBroken, 0);
});

test('createGameStats object has own shield counter properties', () => {
  const stats = createGameStats();
  assert(Object.prototype.hasOwnProperty.call(stats, 'shieldsBroken'));
  assert(Object.prototype.hasOwnProperty.call(stats, 'weaknessHits'));
  assert(Object.prototype.hasOwnProperty.call(stats, 'defeatedWhileBroken'));
});

// === recordShieldBroken ===
test('recordShieldBroken increments from zero', () => {
  const stats = createGameStats();
  const updated = recordShieldBroken(stats);
  assert.strictEqual(updated.shieldsBroken, 1);
});

test('recordShieldBroken returns new object', () => {
  const stats = createGameStats();
  const updated = recordShieldBroken(stats);
  assert.notStrictEqual(updated, stats);
});

test('recordShieldBroken does not mutate original stats', () => {
  const stats = createGameStats();
  const updated = recordShieldBroken(stats);
  assert.strictEqual(stats.shieldsBroken, 0);
  assert.strictEqual(updated.shieldsBroken, 1);
});

test('recordShieldBroken increments existing count', () => {
  const stats = statsWith({ shieldsBroken: 7 });
  const updated = recordShieldBroken(stats);
  assert.strictEqual(updated.shieldsBroken, 8);
});

test('recordShieldBroken accumulates over multiple calls', () => {
  let stats = createGameStats();
  stats = recordShieldBroken(stats);
  stats = recordShieldBroken(stats);
  stats = recordShieldBroken(stats);
  assert.strictEqual(stats.shieldsBroken, 3);
});

test('recordShieldBroken handles large shield counts', () => {
  const stats = statsWith({ shieldsBroken: 1_000_000 });
  const updated = recordShieldBroken(stats);
  assert.strictEqual(updated.shieldsBroken, 1_000_001);
});

test('recordShieldBroken handles negative starting values', () => {
  const stats = statsWith({ shieldsBroken: -4 });
  const updated = recordShieldBroken(stats);
  assert.strictEqual(updated.shieldsBroken, -3);
});

test('recordShieldBroken throws on null or undefined stats', () => {
  assert.throws(() => recordShieldBroken(null));
  assert.throws(() => recordShieldBroken(undefined));
});

test('recordShieldBroken leaves other counters untouched', () => {
  const stats = statsWith({ turnsPlayed: 5 });
  const updated = recordShieldBroken(stats);
  assert.strictEqual(updated.turnsPlayed, 5);
});

// === recordWeaknessHit ===
test('recordWeaknessHit increments from zero', () => {
  const stats = createGameStats();
  const updated = recordWeaknessHit(stats);
  assert.strictEqual(updated.weaknessHits, 1);
});

test('recordWeaknessHit returns new object', () => {
  const stats = createGameStats();
  const updated = recordWeaknessHit(stats);
  assert.notStrictEqual(updated, stats);
});

test('recordWeaknessHit does not mutate original stats', () => {
  const stats = createGameStats();
  const updated = recordWeaknessHit(stats);
  assert.strictEqual(stats.weaknessHits, 0);
  assert.strictEqual(updated.weaknessHits, 1);
});

test('recordWeaknessHit increments existing count', () => {
  const stats = statsWith({ weaknessHits: 12 });
  const updated = recordWeaknessHit(stats);
  assert.strictEqual(updated.weaknessHits, 13);
});

test('recordWeaknessHit accumulates over multiple calls', () => {
  let stats = createGameStats();
  for (let i = 0; i < 5; i++) {
    stats = recordWeaknessHit(stats);
  }
  assert.strictEqual(stats.weaknessHits, 5);
});

test('recordWeaknessHit handles large weakness counts', () => {
  const stats = statsWith({ weaknessHits: 750_000 });
  const updated = recordWeaknessHit(stats);
  assert.strictEqual(updated.weaknessHits, 750_001);
});

test('recordWeaknessHit handles negative starting values', () => {
  const stats = statsWith({ weaknessHits: -10 });
  const updated = recordWeaknessHit(stats);
  assert.strictEqual(updated.weaknessHits, -9);
});

test('recordWeaknessHit throws on null or undefined stats', () => {
  assert.throws(() => recordWeaknessHit(null));
  assert.throws(() => recordWeaknessHit(undefined));
});

test('recordWeaknessHit leaves unrelated counters untouched', () => {
  const stats = statsWith({ battlesWon: 2 });
  const updated = recordWeaknessHit(stats);
  assert.strictEqual(updated.battlesWon, 2);
});

// === recordDefeatedWhileBroken ===
test('recordDefeatedWhileBroken increments from zero', () => {
  const stats = createGameStats();
  const updated = recordDefeatedWhileBroken(stats);
  assert.strictEqual(updated.defeatedWhileBroken, 1);
});

test('recordDefeatedWhileBroken returns new object', () => {
  const stats = createGameStats();
  const updated = recordDefeatedWhileBroken(stats);
  assert.notStrictEqual(updated, stats);
});

test('recordDefeatedWhileBroken does not mutate original stats', () => {
  const stats = createGameStats();
  const updated = recordDefeatedWhileBroken(stats);
  assert.strictEqual(stats.defeatedWhileBroken, 0);
  assert.strictEqual(updated.defeatedWhileBroken, 1);
});

test('recordDefeatedWhileBroken increments existing count', () => {
  const stats = statsWith({ defeatedWhileBroken: 3 });
  const updated = recordDefeatedWhileBroken(stats);
  assert.strictEqual(updated.defeatedWhileBroken, 4);
});

test('recordDefeatedWhileBroken accumulates over multiple calls', () => {
  let stats = createGameStats();
  stats = recordDefeatedWhileBroken(stats);
  stats = recordDefeatedWhileBroken(stats);
  stats = recordDefeatedWhileBroken(stats);
  stats = recordDefeatedWhileBroken(stats);
  assert.strictEqual(stats.defeatedWhileBroken, 4);
});

test('recordDefeatedWhileBroken handles large defeated counts', () => {
  const stats = statsWith({ defeatedWhileBroken: 2_000_000 });
  const updated = recordDefeatedWhileBroken(stats);
  assert.strictEqual(updated.defeatedWhileBroken, 2_000_001);
});

test('recordDefeatedWhileBroken handles negative starting values', () => {
  const stats = statsWith({ defeatedWhileBroken: -2 });
  const updated = recordDefeatedWhileBroken(stats);
  assert.strictEqual(updated.defeatedWhileBroken, -1);
});

test('recordDefeatedWhileBroken throws on null or undefined stats', () => {
  assert.throws(() => recordDefeatedWhileBroken(null));
  assert.throws(() => recordDefeatedWhileBroken(undefined));
});

test('recordDefeatedWhileBroken leaves unrelated counters untouched', () => {
  const stats = statsWith({ xpEarned: 100 });
  const updated = recordDefeatedWhileBroken(stats);
  assert.strictEqual(updated.xpEarned, 100);
});

// === Mixed record usage ===
test('record functions can be chained without losing counts', () => {
  let stats = createGameStats();
  stats = recordShieldBroken(stats);
  stats = recordWeaknessHit(stats);
  stats = recordDefeatedWhileBroken(stats);
  assert.strictEqual(stats.shieldsBroken, 1);
  assert.strictEqual(stats.weaknessHits, 1);
  assert.strictEqual(stats.defeatedWhileBroken, 1);
});

test('record functions preserve cumulatives across mixed operations', () => {
  let stats = statsWith({ shieldsBroken: 5, weaknessHits: 9, defeatedWhileBroken: 2 });
  stats = recordWeaknessHit(stats);
  stats = recordShieldBroken(stats);
  stats = recordShieldBroken(stats);
  stats = recordDefeatedWhileBroken(stats);
  assert.strictEqual(stats.shieldsBroken, 7);
  assert.strictEqual(stats.weaknessHits, 10);
  assert.strictEqual(stats.defeatedWhileBroken, 3);
});

// === extractAchievementData via getProgress ===
test('getProgress uses shieldsBroken from gameStats', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: 4 }) });
  assert.strictEqual(getProgress(state, 'shield_breaker'), 4);
});

test('getProgress uses weaknessHits from gameStats', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: 11 }) });
  assert.strictEqual(getProgress(state, 'weakness_exploiter'), 11);
});

test('getProgress uses defeatedWhileBroken from gameStats', () => {
  const state = baseState({ gameStats: statsWith({ defeatedWhileBroken: 6 }) });
  assert.strictEqual(getProgress(state, 'break_specialist'), 6);
});

test('getProgress returns zero for shield_breaker when gameStats missing', () => {
  const state = { achievements: [], unlockedAchievements: [] };
  assert.strictEqual(getProgress(state, 'shield_breaker'), 0);
});

test('getProgress returns zero for weakness_exploiter when gameStats missing', () => {
  const state = { achievements: [], unlockedAchievements: [] };
  assert.strictEqual(getProgress(state, 'weakness_exploiter'), 0);
});

test('getProgress returns zero for break_specialist when gameStats missing', () => {
  const state = { achievements: [], unlockedAchievements: [] };
  assert.strictEqual(getProgress(state, 'break_specialist'), 0);
});

test('getProgress returns negative shield counts verbatim', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: -3 }) });
  assert.strictEqual(getProgress(state, 'shield_breaker'), -3);
});

test('getProgress returns negative weakness counts verbatim', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: -8 }) });
  assert.strictEqual(getProgress(state, 'weakness_exploiter'), -8);
});

test('getProgress returns negative defeated counts verbatim', () => {
  const state = baseState({ gameStats: statsWith({ defeatedWhileBroken: -5 }) });
  assert.strictEqual(getProgress(state, 'break_specialist'), -5);
});

// === Achievement unlocking thresholds ===
test('shield_breaker unlocks at threshold', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: 1 }) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'shield_breaker'));
});

test('shield_breaker does not unlock below threshold', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: 0 }) });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'shield_breaker'));
});

test('weakness_exploiter unlocks at threshold', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: 10 }) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'weakness_exploiter'));
});

test('weakness_exploiter does not unlock below threshold', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: 9 }) });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'weakness_exploiter'));
});

test('shield_master unlocks at threshold', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: 25 }) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'shield_master'));
});

test('shield_master does not unlock below threshold', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: 24 }) });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'shield_master'));
});

test('elemental_tactician unlocks at threshold', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: 50 }) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'elemental_tactician'));
});

test('elemental_tactician does not unlock below threshold', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: 49 }) });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'elemental_tactician'));
});

test('break_specialist unlocks at threshold', () => {
  const state = baseState({ gameStats: statsWith({ defeatedWhileBroken: 10 }) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'break_specialist'));
});

test('break_specialist does not unlock below threshold', () => {
  const state = baseState({ gameStats: statsWith({ defeatedWhileBroken: 9 }) });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'break_specialist'));
});

test('trackAchievements unlocks multiple shield achievements simultaneously', () => {
  const state = baseState({
    gameStats: statsWith({
      shieldsBroken: 50,
      weaknessHits: 60,
      defeatedWhileBroken: 15,
    }),
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'shield_breaker'));
  assert(isUnlocked(result, 'weakness_exploiter'));
  assert(isUnlocked(result, 'shield_master'));
  assert(isUnlocked(result, 'elemental_tactician'));
  assert(isUnlocked(result, 'break_specialist'));
});

test('trackAchievements retains existing unlocked achievements', () => {
  const state = baseState({
    unlockedAchievements: ['shield_breaker'],
    gameStats: statsWith({ shieldsBroken: 30, weaknessHits: 10, defeatedWhileBroken: 10 }),
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'shield_breaker'));
  assert(isUnlocked(result, 'shield_master'));
  assert(isUnlocked(result, 'weakness_exploiter'));
  assert(isUnlocked(result, 'break_specialist'));
});

test('trackAchievements with negative counts does not unlock shield achievements', () => {
  const state = baseState({
    gameStats: statsWith({
      shieldsBroken: -1,
      weaknessHits: -5,
      defeatedWhileBroken: -2,
    }),
  });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'shield_breaker'));
  assert(!isUnlocked(result, 'weakness_exploiter'));
  assert(!isUnlocked(result, 'shield_master'));
  assert(!isUnlocked(result, 'elemental_tactician'));
  assert(!isUnlocked(result, 'break_specialist'));
});

test('trackAchievements handles huge values without overflow', () => {
  const state = baseState({
    gameStats: statsWith({
      shieldsBroken: Number.MAX_SAFE_INTEGER - 1,
      weaknessHits: Number.MAX_SAFE_INTEGER - 2,
      defeatedWhileBroken: Number.MAX_SAFE_INTEGER - 3,
    }),
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'shield_breaker'));
  assert(isUnlocked(result, 'shield_master'));
  assert(isUnlocked(result, 'weakness_exploiter'));
  assert(isUnlocked(result, 'elemental_tactician'));
  assert(isUnlocked(result, 'break_specialist'));
  assert.strictEqual(
    getProgress(state, 'shield_master'),
    Number.MAX_SAFE_INTEGER - 1
  );
});

test('trackAchievements ignores shield achievements when gameStats missing', () => {
  const state = { achievements: [], unlockedAchievements: [], gameStats: null };
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'shield_breaker'));
  assert(!isUnlocked(result, 'weakness_exploiter'));
  assert(!isUnlocked(result, 'shield_master'));
  assert(!isUnlocked(result, 'elemental_tactician'));
  assert(!isUnlocked(result, 'break_specialist'));
});

test('large shield counts reflected in getProgress', () => {
  const state = baseState({ gameStats: statsWith({ shieldsBroken: 1234 }) });
  assert.strictEqual(getProgress(state, 'shield_master'), 1234);
});

test('large weakness counts reflected in getProgress', () => {
  const state = baseState({ gameStats: statsWith({ weaknessHits: 9876 }) });
  assert.strictEqual(getProgress(state, 'elemental_tactician'), 9876);
});

test('large defeated counts reflected in getProgress', () => {
  const state = baseState({ gameStats: statsWith({ defeatedWhileBroken: 4321 }) });
  assert.strictEqual(getProgress(state, 'break_specialist'), 4321);
});

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
