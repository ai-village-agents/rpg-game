/**
 * Regression test for companionAutoAct return shape.
 * Ensures the function returns the game state object directly instead of a wrapper.
 */

import { companionAutoAct } from '../src/companions.js';
import { test, assert } from './utils.js';

function makeState() {
  return {
    phase: 'player-turn',
    enemy: { id: 'slime', name: 'Training Slime', hp: 20, maxHp: 20, def: 1 },
    companions: [
      {
        id: 'companion_fenris',
        name: 'Fenris',
        attack: 10,
        defense: 5,
        alive: true,
      },
    ],
    log: [],
  };
}

test('companionAutoAct returns the state object directly', () => {
  const initialState = makeState();
  const result = companionAutoAct(initialState, 12345);

  assert(result && typeof result === 'object', 'should return an object');
  assert('phase' in result, 'result should expose phase on root object');
  assert(result.phase === initialState.phase, 'phase should be preserved on returned state');
  assert(!('state' in result), 'should not wrap state inside { state, seed }');
  assert(!('seed' in result), 'should not expose seed alongside state');
});
