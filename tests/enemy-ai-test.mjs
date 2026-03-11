/**
 * Tests for Enemy AI — Tactical Decision Engine
 * Owner: Claude Opus 4.6
 */

import {
  selectTacticalAction,
  getHpPercent,
  getMpPercent,
  hasStatusEffect,
  hasAnyDebuff,
  hasAnyBuff,
  getUsableAbilities,
  categorizeAbilities,
} from '../src/enemy-ai.js';

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

function makeEnemy(overrides = {}) {
  return {
    id: 'test-enemy',
    name: 'Test Enemy',
    hp: 50,
    maxHp: 50,
    mp: 20,
    maxMp: 20,
    atk: 10,
    def: 5,
    spd: 5,
    abilities: ['power-strike', 'fireball'],
    aiBehavior: 'basic',
    statusEffects: [],
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    atk: 12,
    def: 8,
    defending: false,
    statusEffects: [],
    ...overrides,
  };
}

// ── getHpPercent ─────────────────────────────────────────────────────
console.log('Testing getHpPercent...');

assert(getHpPercent({ hp: 50, maxHp: 100 }) === 0.5, 'hp 50/100 should be 0.5');
assert(getHpPercent({ hp: 100, maxHp: 100 }) === 1, 'hp 100/100 should be 1');
assert(getHpPercent({ hp: 0, maxHp: 100 }) === 0, 'hp 0/100 should be 0');
assert(getHpPercent(null) === 1, 'null entity should return 1 (safe default)');
assert(getHpPercent({ hp: 10, maxHp: 0 }) === 1, 'maxHp 0 should return 1 (safe default)');
assert(getHpPercent({ hp: -5, maxHp: 100 }) === 0, 'negative hp should clamp to 0');
assert(getHpPercent({ hp: 150, maxHp: 100 }) === 1, 'over-max hp should clamp to 1');

// ── getMpPercent ─────────────────────────────────────────────────────
console.log('Testing getMpPercent...');

assert(getMpPercent({ mp: 10, maxMp: 20 }) === 0.5, 'mp 10/20 should be 0.5');
assert(getMpPercent({ mp: 0, maxMp: 20 }) === 0, 'mp 0/20 should be 0');
assert(getMpPercent({ maxMp: 0 }) === 0, 'maxMp 0 should return 0');
assert(getMpPercent(null) === 0, 'null entity should return 0');
assert(getMpPercent({ mp: 20, maxMp: 20 }) === 1, 'full mp should be 1');

// ── hasStatusEffect ──────────────────────────────────────────────────
console.log('Testing hasStatusEffect...');

assert(
  hasStatusEffect({ statusEffects: [{ type: 'poison', duration: 2 }] }, 'poison') === true,
  'should detect poison'
);
assert(
  hasStatusEffect({ statusEffects: [{ type: 'poison', duration: 0 }] }, 'poison') === false,
  'expired effect (duration 0) should not count'
);
assert(
  hasStatusEffect({ statusEffects: [] }, 'poison') === false,
  'empty effects should return false'
);
assert(
  hasStatusEffect(null, 'poison') === false,
  'null entity should return false'
);
assert(
  hasStatusEffect({ statusEffects: [{ type: 'burn', duration: 3 }] }, 'poison') === false,
  'different effect type should return false'
);

// ── hasAnyDebuff ─────────────────────────────────────────────────────
console.log('Testing hasAnyDebuff...');

assert(
  hasAnyDebuff({ statusEffects: [{ type: 'poison', duration: 2 }] }) === true,
  'poison should count as debuff'
);
assert(
  hasAnyDebuff({ statusEffects: [{ type: 'burn', duration: 1 }] }) === true,
  'burn should count as debuff'
);
assert(
  hasAnyDebuff({ statusEffects: [{ type: 'atk-up', duration: 2 }] }) === false,
  'atk-up should not count as debuff'
);
assert(
  hasAnyDebuff({ statusEffects: [] }) === false,
  'no effects should return false'
);

// ── hasAnyBuff ───────────────────────────────────────────────────────
console.log('Testing hasAnyBuff...');

assert(
  hasAnyBuff({ statusEffects: [{ type: 'atk-up', duration: 2 }] }) === true,
  'atk-up should count as buff'
);
assert(
  hasAnyBuff({ statusEffects: [{ type: 'regen', duration: 3 }] }) === true,
  'regen should count as buff'
);
assert(
  hasAnyBuff({ statusEffects: [{ type: 'poison', duration: 2 }] }) === false,
  'poison should not count as buff'
);

// ── categorizeAbilities ──────────────────────────────────────────────
console.log('Testing categorizeAbilities...');

const testAbilities = [
  { id: 'a1', name: 'Fireball', power: 1.8, targetType: 'single-enemy', statusEffect: null },
  { id: 'a2', name: 'Web Trap', power: 0.3, targetType: 'single-enemy', statusEffect: { type: 'spd-down', name: 'SPD Down' } },
  { id: 'a3', name: 'Regen', power: 0, targetType: 'self', healPower: 0, statusEffect: { type: 'regen', name: 'Regen', duration: 3, power: 6 } },
  { id: 'a4', name: 'ATK Up', power: 0, targetType: 'self', statusEffect: { type: 'atk-up', name: 'ATK Up', duration: 3 } },
  { id: 'a5', name: 'Flame Lash', power: 1.2, targetType: 'single-enemy', statusEffect: { type: 'burn', name: 'Burn' } },
];

const cats = categorizeAbilities(testAbilities);
assert(cats.damage.length === 2, 'should have 2 damage abilities (fireball + flame lash)');
assert(cats.debuff.length === 2, 'should have 2 debuff abilities (web trap + flame lash)');
assert(cats.selfHeal.length === 1, 'should have 1 self-heal (regen)');
assert(cats.selfBuff.length === 1, 'should have 1 self-buff (atk up)');
assert(cats.damage.some(a => a.id === 'a1'), 'fireball should be in damage');
assert(cats.damage.some(a => a.id === 'a5'), 'flame lash should be in damage');
assert(cats.debuff.some(a => a.id === 'a2'), 'web trap should be in debuff');
assert(cats.selfHeal.some(a => a.id === 'a3'), 'regen should be in selfHeal');
assert(cats.selfBuff.some(a => a.id === 'a4'), 'atk up should be in selfBuff');

// ── selectTacticalAction — return shape ──────────────────────────────
console.log('Testing selectTacticalAction return shape...');

for (const behavior of ['basic', 'aggressive', 'caster', 'support', 'boss']) {
  const enemy = makeEnemy({ aiBehavior: behavior });
  const player = makePlayer();
  const result = selectTacticalAction(enemy, player, 12345, 1);
  assert(result !== null && result !== undefined, `${behavior}: should return a result`);
  assert(
    ['attack', 'ability', 'defend'].includes(result.action),
    `${behavior}: action should be attack/ability/defend, got ${result.action}`
  );
  assert(
    typeof result.newSeed === 'number' && result.newSeed > 0,
    `${behavior}: newSeed should be positive number`
  );
  assert(
    result.action !== 'ability' || typeof result.abilityId === 'string',
    `${behavior}: ability action should have abilityId string`
  );
}

// ── selectTacticalAction — deterministic ─────────────────────────────
console.log('Testing determinism...');

for (const behavior of ['basic', 'aggressive', 'caster', 'support', 'boss']) {
  const enemy = makeEnemy({ aiBehavior: behavior });
  const player = makePlayer();
  const r1 = selectTacticalAction(enemy, player, 99999, 3);
  const r2 = selectTacticalAction(enemy, player, 99999, 3);
  assert(r1.action === r2.action, `${behavior}: same seed should give same action`);
  assert(r1.abilityId === r2.abilityId, `${behavior}: same seed should give same abilityId`);
  assert(r1.newSeed === r2.newSeed, `${behavior}: same seed should give same newSeed`);
}

// ── selectTacticalAction — unknown behavior falls back to basic ──────
console.log('Testing unknown behavior fallback...');

{
  const enemy = makeEnemy({ aiBehavior: 'unknown-type' });
  const player = makePlayer();
  const result = selectTacticalAction(enemy, player, 12345, 1);
  assert(
    ['attack', 'ability', 'defend'].includes(result.action),
    'unknown behavior should still produce valid action'
  );
}

// ── selectTacticalAction — null/missing behavior ─────────────────────
{
  const enemy = makeEnemy({ aiBehavior: undefined });
  const player = makePlayer();
  const result = selectTacticalAction(enemy, player, 12345, 1);
  assert(
    ['attack', 'ability', 'defend'].includes(result.action),
    'undefined behavior should still produce valid action'
  );
}

// ── basic: low HP increases defend chance ────────────────────────────
console.log('Testing basic low HP behavior...');

{
  const lowHpEnemy = makeEnemy({ hp: 10, maxHp: 50, aiBehavior: 'basic' });
  const player = makePlayer();
  let defends = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(lowHpEnemy, player, seed, i);
    if (result.action === 'defend') defends++;
    seed = result.newSeed;
  }
  assert(defends > 5, `basic low HP should defend sometimes (got ${defends}/100)`);
}

// ── aggressive: berserk mode below 50% HP ────────────────────────────
console.log('Testing aggressive berserk mode...');

{
  const lowHpAggressive = makeEnemy({ hp: 20, maxHp: 50, aiBehavior: 'aggressive' });
  const player = makePlayer();
  let defends = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(lowHpAggressive, player, seed, i);
    if (result.action === 'defend') defends++;
    seed = result.newSeed;
  }
  assert(defends === 0, `aggressive berserk should never defend (got ${defends}/100)`);
}

// ── aggressive vs defending player ───────────────────────────────────
console.log('Testing aggressive vs defending player...');

{
  const aggEnemy = makeEnemy({ aiBehavior: 'aggressive' });
  const defendingPlayer = makePlayer({ defending: true });
  let abilities = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(aggEnemy, defendingPlayer, seed, i);
    if (result.action === 'ability') abilities++;
    seed = result.newSeed;
  }
  assert(abilities > 20, `aggressive vs defending player should use abilities often (got ${abilities}/100)`);
}

// ── caster: low MP conserves spells ──────────────────────────────────
console.log('Testing caster low MP...');

{
  const lowMpCaster = makeEnemy({
    mp: 1, maxMp: 20, aiBehavior: 'caster',
    abilities: ['fireball'],  // fireball costs 6 MP, can't use it
  });
  const player = makePlayer();
  let attacks = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(lowMpCaster, player, seed, i);
    if (result.action === 'attack') attacks++;
    seed = result.newSeed;
  }
  assert(attacks > 50, `caster with no usable abilities should mostly attack (got ${attacks}/100)`);
}

// ── caster: prefers debuffs on un-debuffed player ────────────────────
console.log('Testing caster debuff preference...');

{
  const casterEnemy = makeEnemy({
    aiBehavior: 'caster',
    mp: 20, maxMp: 20,
    abilities: ['web-trap', 'venomous-bite', 'fireball'],
  });
  const cleanPlayer = makePlayer();
  let debuffAbilities = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(casterEnemy, cleanPlayer, seed, i);
    if (result.action === 'ability' && (result.abilityId === 'web-trap' || result.abilityId === 'venomous-bite')) {
      debuffAbilities++;
    }
    seed = result.newSeed;
  }
  assert(debuffAbilities > 10, `caster should try debuffs on clean player (got ${debuffAbilities}/100)`);
}

// ── support: self-heal when low HP ───────────────────────────────────
console.log('Testing support self-heal...');

{
  const supportEnemy = makeEnemy({
    aiBehavior: 'support',
    hp: 15, maxHp: 50,
    mp: 20, maxMp: 20,
    abilities: ['regenerate', 'power-strike'],
  });
  const player = makePlayer();
  let heals = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(supportEnemy, player, seed, i);
    if (result.action === 'ability' && result.abilityId === 'regenerate') heals++;
    seed = result.newSeed;
  }
  assert(heals > 20, `support at low HP should try to heal often (got ${heals}/100)`);
}

// ── boss: rotation pattern ───────────────────────────────────────────
console.log('Testing boss rotation...');

{
  const bossEnemy = makeEnemy({
    aiBehavior: 'boss',
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    abilities: ['dark-dominion', 'fireball', 'power-strike'],
  });
  const player = makePlayer();
  // Turn 2 (phase 2, heavy ability turn) — should prefer signature/strongest
  let signatureUses = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(bossEnemy, player, seed, 2);
    if (result.abilityId === 'dark-dominion') signatureUses++;
    seed = result.newSeed;
  }
  assert(signatureUses > 30, `boss on turn 2 (heavy turn) should use signature often (got ${signatureUses}/100)`);
}

// ── boss: desperate mode below 25% HP ────────────────────────────────
console.log('Testing boss desperate mode...');

{
  const desperateBoss = makeEnemy({
    aiBehavior: 'boss',
    hp: 10, maxHp: 100,
    mp: 50, maxMp: 50,
    abilities: ['dark-dominion', 'fireball', 'power-strike'],
  });
  const player = makePlayer();
  let abilityUses = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(desperateBoss, player, seed, i);
    if (result.action === 'ability') abilityUses++;
    seed = result.newSeed;
  }
  assert(abilityUses > 70, `desperate boss should almost always use abilities (got ${abilityUses}/100)`);
}

// ── boss: defend/buff on turn 3 (phase 3) ───────────────────────────
console.log('Testing boss defend/buff turn...');

{
  // Boss with no self-buff abilities should defend on phase 3
  const bossNoBuffs = makeEnemy({
    aiBehavior: 'boss',
    hp: 80, maxHp: 100,
    mp: 50, maxMp: 50,
    abilities: ['fireball', 'power-strike'],  // no self-buff/heal
  });
  const player = makePlayer();
  let defends = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(bossNoBuffs, player, seed, 3);
    if (result.action === 'defend') defends++;
    seed = result.newSeed;
  }
  assert(defends > 50, `boss with no buffs on phase 3 should defend often (got ${defends}/100)`);
}

{
  // Boss WITH self-buff should use it on phase 3
  const bossWithBuff = makeEnemy({
    aiBehavior: 'boss',
    hp: 80, maxHp: 100,
    mp: 50, maxMp: 50,
    abilities: ['dark-dominion', 'fireball'],
  });
  const player = makePlayer();
  let buffUses = 0;
  let total = 100;
  let seed = 1;
  for (let i = 0; i < total; i++) {
    const result = selectTacticalAction(bossWithBuff, player, seed, 3);
    if (result.abilityId === 'dark-dominion') buffUses++;
    seed = result.newSeed;
  }
  assert(buffUses > 50, `boss with self-buff on phase 3 should use buff (got ${buffUses}/100)`);
}

// ── No abilities: should never return 'ability' action ───────────────
console.log('Testing enemy with no abilities...');

{
  const noAbilityEnemy = makeEnemy({ abilities: [], mp: 0, maxMp: 0 });
  const player = makePlayer();
  let seed = 1;
  for (let i = 0; i < 50; i++) {
    const result = selectTacticalAction(noAbilityEnemy, player, seed, i);
    assert(
      result.action !== 'ability',
      `enemy with no abilities should never pick ability (turn ${i})`
    );
    seed = result.newSeed;
  }
}

// ── Different seeds produce different actions ────────────────────────
console.log('Testing seed variation...');

{
  const enemy = makeEnemy({ aiBehavior: 'basic' });
  const player = makePlayer();
  const actions = new Set();
  for (let seed = 1; seed < 100000; seed += 37) {
    const result = selectTacticalAction(enemy, player, seed, 1);
    actions.add(result.action);
  }
  assert(actions.size >= 2, `different seeds should produce varied actions (got ${actions.size} unique)`);
}

// ── All behaviors produce valid results with edge-case entities ──────
console.log('Testing edge cases...');

for (const behavior of ['basic', 'aggressive', 'caster', 'support', 'boss']) {
  // Zero HP enemy
  const zeroHp = makeEnemy({ hp: 0, maxHp: 50, aiBehavior: behavior });
  const r1 = selectTacticalAction(zeroHp, makePlayer(), 12345, 1);
  assert(r1 && typeof r1.action === 'string', `${behavior}: zero HP enemy should still return valid result`);

  // Zero MP enemy
  const zeroMp = makeEnemy({ mp: 0, maxMp: 0, aiBehavior: behavior });
  const r2 = selectTacticalAction(zeroMp, makePlayer(), 12345, 1);
  assert(r2 && typeof r2.action === 'string', `${behavior}: zero MP enemy should still return valid result`);

  // Null player
  const r3 = selectTacticalAction(makeEnemy({ aiBehavior: behavior }), null, 12345, 1);
  assert(r3 && typeof r3.action === 'string', `${behavior}: null player should still return valid result`);
}

// ── Summary ──────────────────────────────────────────────────────────
console.log(`\nEnemy AI tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
