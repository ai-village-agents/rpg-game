/**
 * Combat Actions Tests - AI Village RPG
 * Tests for src/combat.js functions (playerAttack, playerDefend, etc.)
 * Run: node tests/combat-actions-test.mjs
 */

import {
  nextRng,
  startNewEncounter,
  playerAttack,
  playerDefend,
  playerUsePotion,
  enemyAct,
} from '../src/combat.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + msg);
  } else {
    failed++;
    console.error('  FAIL: ' + msg);
  }
}

// ── Test: nextRng ─────────────────────────────────────────────────────
console.log('\n--- nextRng (Park-Miller LCG) ---');
{
  const result1 = nextRng(12345);
  assert(typeof result1.seed === 'number', 'nextRng returns seed number');
  assert(typeof result1.value === 'number', 'nextRng returns value number');
  assert(result1.value >= 0 && result1.value < 1, 'value is in [0, 1) range');
  assert(result1.seed !== 12345, 'seed changes after nextRng');

  // Deterministic: same input => same output
  const result2 = nextRng(12345);
  assert(result1.seed === result2.seed, 'nextRng is deterministic (seed)');
  assert(result1.value === result2.value, 'nextRng is deterministic (value)');

  // Sequence test
  const seq1 = nextRng(1);
  const seq2 = nextRng(seq1.seed);
  const seq3 = nextRng(seq2.seed);
  assert(seq1.seed !== seq2.seed, 'sequence produces different seeds');
  assert(seq2.seed !== seq3.seed, 'sequence continues producing different seeds');
}

// ── Test: startNewEncounter ───────────────────────────────────────────
console.log('\n--- startNewEncounter ---');
{
  const baseState = {
    phase: 'victory',
    turn: 10,
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: true, inventory: { potion: 2 } },
    log: ['Previous log entry'],
  };

  const newState = startNewEncounter(baseState, 1);

  assert(newState.phase === 'player-turn', 'phase resets to player-turn');
  assert(newState.turn === 1, 'turn resets to 1');
  assert(newState.player.defending === false, 'player defending resets');
  assert(newState.enemy !== undefined, 'enemy is set');
  assert(newState.enemy.hp > 0, 'enemy has positive HP');
  assert(newState.enemy.hp === newState.enemy.maxHp, 'enemy HP equals maxHp');
  assert(newState.enemy.defending === false, 'enemy defending is false');
  assert(newState.log.length > baseState.log.length, 'log has new entries');

  // Player state preserved
  assert(newState.player.hp === 50, 'player hp preserved');
  assert(newState.player.inventory.potion === 2, 'player inventory preserved');
}

// ── Test: playerAttack ────────────────────────────────────────────────
console.log('\n--- playerAttack ---');
{
  const state = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 15, def: 5, defending: true, inventory: {} },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 2, defending: false },
    log: [],
  };

  const afterAttack = playerAttack(state);

  assert(afterAttack.enemy.hp < 30, 'enemy took damage');
  assert(afterAttack.phase === 'enemy-turn', 'phase changes to enemy-turn');
  assert(afterAttack.player.defending === false, 'player defending reset after attack');
  assert(afterAttack.log.length > 0, 'log has attack message');

  // Wrong phase test
  const wrongPhaseState = { ...state, phase: 'enemy-turn' };
  const noChange = playerAttack(wrongPhaseState);
  assert(noChange.enemy.hp === 30, 'no damage on wrong phase');
  assert(noChange.phase === 'enemy-turn', 'phase unchanged on wrong phase');
}

// ── Test: playerAttack with defending enemy ───────────────────────────
console.log('\n--- playerAttack vs defending enemy ---');
{
  const stateDefending = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: {} },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 5, defending: true },
    log: [],
  };

  const stateNotDefending = {
    ...stateDefending,
    enemy: { ...stateDefending.enemy, defending: false },
  };

  const afterDefending = playerAttack(stateDefending);
  const afterNotDefending = playerAttack(stateNotDefending);

  const dmgDefending = 30 - afterDefending.enemy.hp;
  const dmgNotDefending = 30 - afterNotDefending.enemy.hp;

  assert(dmgDefending <= dmgNotDefending, 'defending reduces damage taken');
  assert(afterDefending.enemy.defending === false, 'enemy defending resets after being attacked');
}

// ── Test: playerAttack victory ────────────────────────────────────────
console.log('\n--- playerAttack leading to victory ---');
{
  const nearDeathState = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 50, def: 5, defending: false, inventory: {} },
    enemy: { name: 'Slime', hp: 1, maxHp: 30, atk: 5, def: 0, defending: false, xpReward: 10, goldReward: 5 },
    log: [],
  };

  const afterKill = playerAttack(nearDeathState);

  assert(afterKill.enemy.hp === 0, 'enemy HP clamped to 0');
  assert(afterKill.phase === 'victory', 'phase is victory');
  assert(afterKill.xpGained === 10, 'xp reward granted');
  assert(afterKill.goldGained === 5, 'gold reward granted');
}

// ── Test: playerDefend ────────────────────────────────────────────────
console.log('\n--- playerDefend ---');
{
  const state = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: {} },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 2, defending: false },
    log: [],
  };

  const afterDefend = playerDefend(state);

  assert(afterDefend.player.defending === true, 'player is now defending');
  assert(afterDefend.phase === 'enemy-turn', 'phase changes to enemy-turn');
  assert(afterDefend.log.length > 0, 'log has defend message');

  // Wrong phase test
  const wrongPhase = playerDefend({ ...state, phase: 'enemy-turn' });
  assert(wrongPhase.player.defending === false, 'defend ignored on wrong phase');
}

// ── Test: playerUsePotion ─────────────────────────────────────────────
console.log('\n--- playerUsePotion ---');
{
  const state = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: true, inventory: { potion: 2 } },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 2, defending: false },
    log: [],
  };

  const afterPotion = playerUsePotion(state);

  assert(afterPotion.player.hp > 50, 'player healed');
  assert(afterPotion.player.hp <= 100, 'HP does not exceed maxHp');
  assert(afterPotion.player.inventory.potion === 1, 'potion count decreased');
  assert(afterPotion.phase === 'enemy-turn', 'phase changes to enemy-turn');
  assert(afterPotion.player.defending === false, 'defending reset after using potion');
  assert(afterPotion.log.length > 0, 'log has potion message');
}

// ── Test: playerUsePotion at full HP ──────────────────────────────────
console.log('\n--- playerUsePotion at full HP ---');
{
  const fullHpState = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 100, maxHp: 100, atk: 10, def: 5, defending: false, inventory: { potion: 1 } },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 2, defending: false },
    log: [],
  };

  const afterPotion = playerUsePotion(fullHpState);

  assert(afterPotion.player.hp === 100, 'HP clamped at maxHp');
  assert(afterPotion.player.inventory.potion === 0, 'potion still consumed');
}

// ── Test: playerUsePotion with no potions ─────────────────────────────
console.log('\n--- playerUsePotion with no potions ---');
{
  const noPotionState = {
    phase: 'player-turn',
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: { potion: 0 } },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 2, defending: false },
    log: [],
  };

  const afterAttempt = playerUsePotion(noPotionState);

  assert(afterAttempt.player.hp === 50, 'HP unchanged with no potions');
  assert(afterAttempt.phase === 'player-turn', 'phase unchanged (no action taken)');
  assert(afterAttempt.log.length > 0, 'log has no-potion message');
}

// ── Test: enemyAct attack ─────────────────────────────────────────────
console.log('\n--- enemyAct (attack) ---');
{
  // Use a seed that will produce a high RNG value (attack action)
  const state = {
    phase: 'enemy-turn',
    rngSeed: 987654321,
    turn: 1,
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: {} },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 8, def: 2, defending: false },
    log: [],
  };

  const afterAct = enemyAct(state);

  assert(afterAct.rngSeed !== state.rngSeed, 'RNG seed advanced');
  assert(afterAct.phase === 'player-turn' || afterAct.phase === 'defeat', 'phase is player-turn or defeat');
  assert(afterAct.turn >= state.turn, 'turn incremented or same');
  assert(afterAct.log.length > 0, 'log has enemy action message');
}

// ── Test: enemyAct defend ─────────────────────────────────────────────
console.log('\n--- enemyAct (defend - find a seed that triggers it) ---');
{
  // Try to find a seed that produces defend (rng < 0.2)
  let defendSeed = null;
  for (let seed = 1; seed < 10000; seed++) {
    const { value } = nextRng(seed);
    if (value < 0.2) {
      defendSeed = seed;
      break;
    }
  }

  if (defendSeed !== null) {
    const state = {
      phase: 'enemy-turn',
      rngSeed: defendSeed,
      turn: 1,
      player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: {} },
      enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 8, def: 2, defending: false },
      log: [],
    };

    const afterDefend = enemyAct(state);

    assert(afterDefend.enemy.defending === true, 'enemy is defending');
    assert(afterDefend.phase === 'player-turn', 'phase is player-turn after enemy defend');
    assert(afterDefend.player.defending === false, 'player defending reset');
    assert(afterDefend.turn === 2, 'turn incremented');
  } else {
    console.log('  SKIP: Could not find defend seed in range');
  }
}

// ── Test: enemyAct wrong phase ────────────────────────────────────────
console.log('\n--- enemyAct wrong phase ---');
{
  const state = {
    phase: 'player-turn',
    rngSeed: 12345,
    turn: 1,
    player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: {} },
    enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 8, def: 2, defending: false },
    log: [],
  };

  const noChange = enemyAct(state);

  assert(noChange.rngSeed === 12345, 'RNG seed unchanged on wrong phase');
  assert(noChange.player.hp === 50, 'player HP unchanged');
}

// ── Test: enemyAct leading to defeat ──────────────────────────────────
console.log('\n--- enemyAct leading to defeat ---');
{
  // Find an attack seed
  let attackSeed = null;
  for (let seed = 1; seed < 10000; seed++) {
    const { value } = nextRng(seed);
    if (value >= 0.2) {
      attackSeed = seed;
      break;
    }
  }

  if (attackSeed !== null) {
    const lowHpState = {
      phase: 'enemy-turn',
      rngSeed: attackSeed,
      turn: 1,
      player: { name: 'Hero', hp: 1, maxHp: 100, atk: 10, def: 0, defending: false, inventory: {} },
      enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 50, def: 2, defending: false },
      log: [],
    };

    const afterKill = enemyAct(lowHpState);

    assert(afterKill.player.hp === 0, 'player HP clamped to 0');
    assert(afterKill.phase === 'defeat', 'phase is defeat');
  } else {
    console.log('  SKIP: Could not find attack seed');
  }
}

// ── Test: enemyAct with player defending ──────────────────────────────
console.log('\n--- enemyAct with player defending ---');
{
  // Find attack seed
  let attackSeed = null;
  for (let seed = 1; seed < 10000; seed++) {
    const { value } = nextRng(seed);
    if (value >= 0.2) {
      attackSeed = seed;
      break;
    }
  }

  if (attackSeed !== null) {
    const defendingState = {
      phase: 'enemy-turn',
      rngSeed: attackSeed,
      turn: 1,
      player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: true, inventory: {} },
      enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 10, def: 2, defending: false },
      log: [],
    };

    const notDefendingState = {
      ...defendingState,
      player: { ...defendingState.player, defending: false },
    };

    const afterDefending = enemyAct(defendingState);
    const afterNotDefending = enemyAct(notDefendingState);

    const dmgDefending = 50 - afterDefending.player.hp;
    const dmgNotDefending = 50 - afterNotDefending.player.hp;

    assert(dmgDefending <= dmgNotDefending, 'defending reduces damage from enemy');
  } else {
    console.log('  SKIP: Could not find attack seed');
  }
}

// ── Summary ───────────────────────────────────────────────────────────
console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) process.exit(1);
