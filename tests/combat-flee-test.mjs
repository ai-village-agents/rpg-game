import { handleCombatAction } from '../src/handlers/combat-handler.js';

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

function makeBaseState(overrides = {}) {
  return {
    phase: 'player-turn',
    rngSeed: 1,
    player: {
      name: 'Hero',
      hp: 50,
      maxHp: 100,
      atk: 10,
      def: 5,
      defending: false,
      inventory: { potion: 1 },
      statusEffects: [],
    },
    enemy: {
      name: 'Slime',
      hp: 30,
      maxHp: 30,
      atk: 5,
      def: 1,
      defending: false,
      statusEffects: [],
      xpReward: 0,
      goldReward: 0,
    },
    log: [],
    ...overrides,
  };
}

console.log('--- Combat Flee Tests ---');

// Test: PLAYER_FLEE only handled in player-turn
{
  const wrongPhase = makeBaseState({ phase: 'enemy-turn' });
  const result = handleCombatAction(wrongPhase, { type: 'PLAYER_FLEE' });
  assert(result === null, 'PLAYER_FLEE ignored outside player-turn');
}

// Test: flee can succeed
{
  const successState = makeBaseState({ rngSeed: 1 });
  const result = handleCombatAction(successState, { type: 'PLAYER_FLEE' });
  assert(result !== null, 'PLAYER_FLEE handled during player-turn');
  assert(result.phase === 'fled', 'flee success sets phase to fled');
}

// Test: flee can fail
{
  const failState = makeBaseState({ rngSeed: 200000 });
  const result = handleCombatAction(failState, { type: 'PLAYER_FLEE' });
  assert(result !== null, 'PLAYER_FLEE handled during player-turn');
  assert(result.phase === 'enemy-turn', 'flee failure moves to enemy-turn');
}

console.log('========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
