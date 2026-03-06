import { handleCombatAction, handleEnemyTurnLogic } from '../src/handlers/combat-handler.js';
import { createGameStats } from '../src/game-stats.js';

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

// Mock state
const mockState = {
  phase: 'player-turn',
  player: { name: 'Hero', hp: 50, maxHp: 100, atk: 10, def: 5, defending: false, inventory: { potion: 1 }, level: 1 },
  enemy: { name: 'Slime', hp: 30, maxHp: 30, atk: 5, def: 0, defending: false, xpReward: 10, goldReward: 5 },
  log: [],
  gameStats: createGameStats(),
  rngSeed: 12345
};

console.log('--- Testing Combat Handler ---');

// Test PLAYER_ATTACK
{
  const next = handleCombatAction(mockState, { type: 'PLAYER_ATTACK' });
  assert(next !== null, 'PLAYER_ATTACK handled');
  assert(next.enemy.hp < 30, 'Enemy took damage');
  assert(next.gameStats.totalDamageDealt > 0, 'Damage dealt recorded in stats');
  assert(next.gameStats.turnsPlayed > 0, 'Turn played recorded');
}

// Test PLAYER_DEFEND
{
  const next = handleCombatAction(mockState, { type: 'PLAYER_DEFEND' });
  assert(next !== null, 'PLAYER_DEFEND handled');
  assert(next.player.defending === true, 'Player is defending');
}

// Test PLAYER_POTION
{
  const next = handleCombatAction(mockState, { type: 'PLAYER_POTION' });
  assert(next !== null, 'PLAYER_POTION handled');
  assert(next.player.hp > 50, 'Player healed');
  assert(next.gameStats.itemsUsed === 1, "Item use recorded");
}

// Test Wrong Phase
{
  const wrongPhaseState = { ...mockState, phase: 'exploration' };
  const next = handleCombatAction(wrongPhaseState, { type: 'PLAYER_ATTACK' });
  assert(next === null, 'Action ignored in wrong phase');
}

console.log('--- Testing Enemy Turn Logic ---');

// Test Enemy Turn
{
  const enemyTurnState = { ...mockState, phase: 'enemy-turn' };
  // Mock an enemy that deals damage (high attack)
  const strongEnemyState = { 
    ...enemyTurnState, 
    enemy: { ...enemyTurnState.enemy, atk: 100 } 
  };
  
  const next = handleEnemyTurnLogic(strongEnemyState);
  assert(next.player.hp < 50, 'Player took damage');
  assert(next.gameStats.totalDamageReceived > 0, 'Damage received recorded');
}

console.log('========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
