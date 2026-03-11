import {
  createGameStats,
  recordEnemyDefeated,
  recordDamageDealt,
  recordDamageReceived,
  recordItemUsed,
  recordAbilityUsed,
  recordGoldEarned,
  recordXPEarned,
  recordBattleWon,
  recordBattleFled,
  recordTurnPlayed,
  getStatsSummary,
} from '../src/game-stats.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertDeepEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }
}

console.log('\n=== createGameStats ===');
test('returns correct initial structure', () => {
  const stats = createGameStats();
  assertDeepEqual(stats, {
    enemiesDefeated: 0,
    enemyKills: {},
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    itemsUsed: 0,
    abilitiesUsed: 0,
    goldEarned: 0,
    xpEarned: 0,
    battlesWon: 0,
    battlesFled: 0,
    turnsPlayed: 0,
    shieldsBroken: 0,
    weaknessHits: 0,
    defeatedWhileBroken: 0,
  });
});

console.log('\n=== record functions ===');
test('recordDamageDealt increments totalDamageDealt by 15', () => {
  const s0 = createGameStats();
  const s1 = recordDamageDealt(s0, 15);
  assertEqual(s1.totalDamageDealt, 15);
});

test('recordDamageReceived increments totalDamageReceived by 10', () => {
  const s0 = createGameStats();
  const s1 = recordDamageReceived(s0, 10);
  assertEqual(s1.totalDamageReceived, 10);
});

test('recordEnemyDefeated increments enemiesDefeated and tracks enemy', () => {
  const s0 = createGameStats();
  const s1 = recordEnemyDefeated(s0, 'slime');
  assertEqual(s1.enemiesDefeated, 1);
  assertEqual(s1.enemyKills['slime'], 1);
});

test('recordItemUsed increments itemsUsed by 1', () => {
  const s0 = createGameStats();
  const s1 = recordItemUsed(s0, 'potion');
  assertEqual(s1.itemsUsed, 1);
});

test('recordAbilityUsed increments abilitiesUsed by 1', () => {
  const s0 = createGameStats();
  const s1 = recordAbilityUsed(s0, 'fireball');
  assertEqual(s1.abilitiesUsed, 1);
});

test('recordGoldEarned increments goldEarned by 50', () => {
  const s0 = createGameStats();
  const s1 = recordGoldEarned(s0, 50);
  assertEqual(s1.goldEarned, 50);
});

test('recordXPEarned increments xpEarned by 25', () => {
  const s0 = createGameStats();
  const s1 = recordXPEarned(s0, 25);
  assertEqual(s1.xpEarned, 25);
});

test('recordBattleWon increments battlesWon by 1', () => {
  const s0 = createGameStats();
  const s1 = recordBattleWon(s0);
  assertEqual(s1.battlesWon, 1);
});

test('recordBattleFled increments battlesFled by 1', () => {
  const s0 = createGameStats();
  const s1 = recordBattleFled(s0);
  assertEqual(s1.battlesFled, 1);
});

test('recordTurnPlayed increments turnsPlayed by 1', () => {
  const s0 = createGameStats();
  const s1 = recordTurnPlayed(s0);
  assertEqual(s1.turnsPlayed, 1);
});

console.log('\n=== getStatsSummary ===');
test('returns correct summary with key fields', () => {
  let stats = createGameStats();
  stats = recordEnemyDefeated(stats, 'slime');
  stats = recordDamageDealt(stats, 12);
  stats = recordDamageReceived(stats, 6);
  stats = recordItemUsed(stats, 'potion');
  stats = recordAbilityUsed(stats, 'fireball');
  stats = recordGoldEarned(stats, 30);
  stats = recordXPEarned(stats, 20);
  stats = recordBattleWon(stats);
  stats = recordBattleFled(stats);
  stats = recordTurnPlayed(stats);

  const summary = getStatsSummary(stats);
  assertEqual(summary.enemiesDefeated, 1);
  assertEqual(summary.mostDefeated, 'slime (1)');
  assertEqual(summary.totalDamageDealt, 12);
  assertEqual(summary.totalDamageReceived, 6);
  assertEqual(summary.damageRatio, '2.0');
  assertEqual(summary.itemsUsed, 1);
  assertEqual(summary.abilitiesUsed, 1);
  assertEqual(summary.goldEarned, 30);
  assertEqual(summary.xpEarned, 20);
  assertEqual(summary.battlesWon, 1);
  assertEqual(summary.battlesFled, 1);
  assertEqual(summary.turnsPlayed, 1);
});

test('chained wiring updates summary values', () => {
  let stats = createGameStats();
  stats = recordDamageDealt(stats, 20);
  stats = recordDamageReceived(stats, 10);
  stats = recordBattleWon(stats);
  stats = recordEnemyDefeated(stats, 'goblin');

  const summary = getStatsSummary(stats);
  assertEqual(summary.totalDamageDealt, 20);
  assertEqual(summary.totalDamageReceived, 10);
  assertEqual(summary.battlesWon, 1);
  assertEqual(summary.enemiesDefeated, 1);
  assertEqual(summary.mostDefeated, 'goblin (1)');
});

test('damageRatio equals totalDamageDealt / totalDamageReceived', () => {
  let stats = createGameStats();
  stats = recordDamageDealt(stats, 20);
  stats = recordDamageReceived(stats, 10);
  const summary = getStatsSummary(stats);
  assertEqual(summary.damageRatio, '2.0');
});

test('damageRatio when totalDamageReceived = 0 matches implementation', () => {
  let stats = createGameStats();
  stats = recordDamageDealt(stats, 20);
  const summary = getStatsSummary(stats);
  assertEqual(summary.damageRatio, '∞');
});

console.log('\n=== immutability ===');
test('all functions are pure (original object not mutated)', () => {
  const s0 = createGameStats();
  const s1 = recordEnemyDefeated(s0, 'slime');
  const s2 = recordDamageDealt(s0, 5);
  const s3 = recordDamageReceived(s0, 4);
  const s4 = recordItemUsed(s0, 'potion');
  const s5 = recordAbilityUsed(s0, 'fireball');
  const s6 = recordGoldEarned(s0, 10);
  const s7 = recordXPEarned(s0, 8);
  const s8 = recordBattleWon(s0);
  const s9 = recordBattleFled(s0);
  const s10 = recordTurnPlayed(s0);

  assertDeepEqual(s0, createGameStats());
  assert(s1 !== s0, 'recordEnemyDefeated should return a new object');
  assert(s2 !== s0, 'recordDamageDealt should return a new object');
  assert(s3 !== s0, 'recordDamageReceived should return a new object');
  assert(s4 !== s0, 'recordItemUsed should return a new object');
  assert(s5 !== s0, 'recordAbilityUsed should return a new object');
  assert(s6 !== s0, 'recordGoldEarned should return a new object');
  assert(s7 !== s0, 'recordXPEarned should return a new object');
  assert(s8 !== s0, 'recordBattleWon should return a new object');
  assert(s9 !== s0, 'recordBattleFled should return a new object');
  assert(s10 !== s0, 'recordTurnPlayed should return a new object');
});

console.log('\n=== enemyKills tracking ===');
test('multiple kills of same enemy are tracked', () => {
  let stats = createGameStats();
  stats = recordEnemyDefeated(stats, 'slime');
  stats = recordEnemyDefeated(stats, 'slime');
  stats = recordEnemyDefeated(stats, 'slime');
  assertEqual(stats.enemiesDefeated, 3);
  assertEqual(stats.enemyKills['slime'], 3);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
