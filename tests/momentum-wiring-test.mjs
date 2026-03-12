import test from 'node:test';
import assert from 'node:assert/strict';

import { initialStateWithClass } from '../src/state.js';
import { handleCombatAction } from '../src/handlers/combat-handler.js';
import { MAX_MOMENTUM } from '../src/momentum.js';

test('initialStateWithClass initializes momentum', () => {
  const state = initialStateWithClass('warrior');
  const momentum = state.player.momentum;

  assert.ok(momentum, 'player has momentum state');
  assert.strictEqual(momentum.current, 0, 'momentum starts at 0');
  assert.strictEqual(momentum.max, MAX_MOMENTUM, 'momentum max matches constant');
  assert.strictEqual(momentum.overdriveReady, false, 'overdrive not ready initially');
});

test('player attack grants momentum gain', () => {
  const state = initialStateWithClass('warrior');
  const next = handleCombatAction(state, { type: 'PLAYER_ATTACK' });

  assert.ok(next, 'combat handler returned a state');
  assert.ok(next.player.momentum.current > state.player.momentum.current, 'momentum increased after attack');
});

test('overdrive consumes momentum and applies effect', () => {
  const baseState = initialStateWithClass('warrior');
  const readyMomentum = { ...baseState.player.momentum, current: baseState.player.momentum.max, overdriveReady: true };
  const state = {
    ...baseState,
    player: { ...baseState.player, momentum: readyMomentum },
  };

  const enemyHpBefore = state.enemy.hp;
  const playerHpBefore = state.player.hp;

  const next = handleCombatAction(state, { type: 'OVERDRIVE' });

  assert.ok(next, 'combat handler returned a state');
  assert.strictEqual(next.player.momentum.current, 0, 'momentum reset after overdrive');
  assert.strictEqual(next.player.momentum.overdriveReady, false, 'overdrive flag cleared');
  const enemyHpAfter = next.enemy.hp;
  const playerHpAfter = next.player.hp;
  assert.ok(
    enemyHpAfter < enemyHpBefore || playerHpAfter > playerHpBefore,
    'overdrive should damage enemy or heal player'
  );
});
