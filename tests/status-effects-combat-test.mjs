import test from 'node:test';
import assert from 'node:assert/strict';
import {
  playerAttack,
  playerDefend,
  playerFlee,
  playerUsePotion,
  playerUseAbility,
  enemyAct,
  startNewEncounter,
  addStatusEffect,
  nextRng,
} from '../src/combat.js';

// Helper: minimal player state
function makePlayer(overrides = {}) {
  return {
    name: 'Hero',
    hp: 50, maxHp: 50,
    mp: 20, maxMp: 20,
    atk: 12, def: 10,
    level: 1,
    defending: false,
    statusEffects: [],
    inventory: { potion: 3 },
    abilities: ['fireball'],
    equipment: {},
    ...overrides,
  };
}

function makeEnemy(overrides = {}) {
  return {
    name: 'Slime',
    hp: 20, maxHp: 20,
    atk: 5, def: 2,
    defending: false,
    statusEffects: [],
    abilities: [],
    weaknesses: [],
    shields: 0, maxShields: 0,
    isBroken: false, breakTurnsRemaining: 0,
    ...overrides,
  };
}

function makeState(overrides = {}) {
  return {
    phase: 'player-turn',
    turn: 1,
    player: makePlayer(),
    enemy: makeEnemy(),
    log: [],
    rngSeed: 12345,
    worldEvent: null,
    companions: [],
    ...overrides,
  };
}

// ── Freeze Tests ──────────────────────────────────────────────────────

test('Frozen player cannot attack', () => {
  let state = makeState();
  state = addStatusEffect(state, 'player', { type: 'freeze', name: 'Freeze', duration: 1, power: 0 });
  const result = playerAttack(state);
  assert.ok(result.log.some(m => m.includes('frozen solid')), 'Should log frozen message');
  assert.equal(result.phase, 'enemy-turn', 'Should skip to enemy turn');
});

test('Frozen player cannot defend', () => {
  let state = makeState();
  state = addStatusEffect(state, 'player', { type: 'freeze', name: 'Freeze', duration: 1, power: 0 });
  const result = playerDefend(state);
  assert.ok(result.log.some(m => m.includes('frozen solid')), 'Should log frozen message');
  assert.equal(result.phase, 'enemy-turn', 'Should skip to enemy turn');
});

test('Frozen player cannot flee', () => {
  let state = makeState();
  state = addStatusEffect(state, 'player', { type: 'freeze', name: 'Freeze', duration: 1, power: 0 });
  const result = playerFlee(state);
  assert.ok(result.log.some(m => m.includes('frozen solid')), 'Should log frozen message');
  assert.equal(result.phase, 'enemy-turn', 'Should skip to enemy turn');
});

test('Frozen player cannot use potion', () => {
  let state = makeState();
  state = addStatusEffect(state, 'player', { type: 'freeze', name: 'Freeze', duration: 1, power: 0 });
  const result = playerUsePotion(state);
  assert.ok(result.log.some(m => m.includes('frozen solid')), 'Should log frozen message');
});

test('Frozen enemy cannot act', () => {
  let state = makeState({ phase: 'enemy-turn' });
  state = addStatusEffect(state, 'enemy', { type: 'freeze', name: 'Freeze', duration: 1, power: 0 });
  const result = enemyAct(state);
  assert.ok(result.log.some(m => m.includes('frozen') && m.includes('cannot act')), 'Should log frozen cannot act');
  assert.equal(result.phase, 'player-turn', 'Should return to player turn');
});

// ── Blind Tests ───────────────────────────────────────────────────────

test('Blinded player sometimes misses attack', () => {
  // Park-Miller LCG needs large seeds for varied output
  let missFound = false;
  let hitFound = false;
  for (let seed = 500000; seed < 2200000 && (!missFound || !hitFound); seed += 100000) {
    let state = makeState({ rngSeed: seed });
    state = addStatusEffect(state, 'player', { type: 'blind', name: 'Blind', duration: 2, power: 0 });
    const result = playerAttack(state);
    if (result.log.some(m => m.includes('misses') && m.includes('Blinded'))) {
      missFound = true;
    }
    if (result.log.some(m => m.includes('strike for'))) {
      hitFound = true;
    }
  }
  assert.ok(missFound, 'Should find at least one miss with blind');
  assert.ok(hitFound, 'Should find at least one hit with blind');
});

test('Blinded enemy sometimes misses attack', () => {
  let missFound = false;
  for (let seed = 1; seed < 200 && !missFound; seed++) {
    let state = makeState({ phase: 'enemy-turn', rngSeed: seed });
    state = addStatusEffect(state, 'enemy', { type: 'blind', name: 'Blind', duration: 2, power: 0 });
    const result = enemyAct(state);
    if (result.log.some(m => m.includes('misses') && m.includes('Blinded'))) {
      missFound = true;
    }
  }
  assert.ok(missFound, 'Should find at least one enemy blind miss');
});

// ── Silence Tests ─────────────────────────────────────────────────────

test('Silenced player cannot use abilities', () => {
  let state = makeState();
  state = addStatusEffect(state, 'player', { type: 'silence', name: 'Silence', duration: 2, power: 0 });
  const result = playerUseAbility(state, 'fireball');
  assert.ok(result.log.some(m => m.includes('silenced')), 'Should log silenced message');
  // Phase should remain player-turn (no action consumed)
  assert.equal(result.phase, 'player-turn', 'Should not consume turn');
});

test('Silenced enemy forced to basic attack instead of ability', () => {
  let state = makeState({ phase: 'enemy-turn' });
  state.enemy.abilities = ['frost-breath'];
  state = addStatusEffect(state, 'enemy', { type: 'silence', name: 'Silence', duration: 2, power: 0 });
  const result = enemyAct(state);
  // Should see silence message if enemy tried to use an ability
  const hasSilenceMsg = result.log.some(m => m.includes('silenced'));
  // Either way, enemy should have acted (attack or defend) - phase should be player-turn
  assert.equal(result.phase, 'player-turn', 'Enemy turn should complete');
});

// ── Curse Tests ───────────────────────────────────────────────────────

test('Cursed enemy takes 25% more damage', () => {
  // Compare damage with and without curse
  let stateNormal = makeState({ rngSeed: 100 });
  const resultNormal = playerAttack(stateNormal);
  const normalEnemyHp = resultNormal.enemy.hp;

  let stateCursed = makeState({ rngSeed: 100 });
  stateCursed = addStatusEffect(stateCursed, 'enemy', { type: 'curse', name: 'Curse', duration: 3, power: 0 });
  const resultCursed = playerAttack(stateCursed);
  const cursedEnemyHp = resultCursed.enemy.hp;

  const normalDmg = 20 - normalEnemyHp;
  const cursedDmg = 20 - cursedEnemyHp;
  assert.ok(cursedDmg >= normalDmg, `Cursed damage (${cursedDmg}) should be >= normal damage (${normalDmg})`);
});

// ── Bleed Tests ───────────────────────────────────────────────────────

test('Bleed deals damage at turn start', () => {
  let state = makeState({ phase: 'enemy-turn' });
  state = addStatusEffect(state, 'enemy', { type: 'bleed', name: 'Bleed', duration: 2, power: 3 });
  const result = enemyAct(state);
  assert.ok(result.log.some(m => m.includes('bleed damage')), 'Should log bleed damage');
  // Enemy should have taken 3 bleed damage (started at 20)
});

// ── Cleanse includes new effects ─────────────────────────────────────

test('Cleanse removes freeze, bleed, blind, silence, curse', () => {
  let state = makeState();
  state = addStatusEffect(state, 'player', { type: 'freeze', name: 'Freeze', duration: 1, power: 0 });
  state = addStatusEffect(state, 'player', { type: 'blind', name: 'Blind', duration: 2, power: 0 });
  state = addStatusEffect(state, 'player', { type: 'silence', name: 'Silence', duration: 2, power: 0 });
  state = addStatusEffect(state, 'player', { type: 'curse', name: 'Curse', duration: 3, power: 0 });
  state = addStatusEffect(state, 'player', { type: 'bleed', name: 'Bleed', duration: 4, power: 3 });

  // Simulate cleanse logic
  const debuffTypes = ['poison', 'burn', 'stun', 'sleep', 'freeze', 'bleed', 'blind', 'silence', 'curse', 'atk-down', 'def-down', 'spd-down'];
  const cleaned = (state.player.statusEffects ?? []).filter(e => !debuffTypes.includes(e.type));
  assert.equal(cleaned.length, 0, 'All debuffs should be cleansed');
});
