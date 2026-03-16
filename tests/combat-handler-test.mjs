import { handleCombatAction, handleEnemyTurnLogic } from '../src/handlers/combat-handler.js';
import { createGameStats } from '../src/game-stats.js';
import { createBattleSummary } from '../src/battle-summary.js';
import { getBattleLogEntries } from '../src/combat-battle-log-integration.js';

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


// Test PLAYER_ABILITY victory records max single hit from ability battle-log damage
{
  const abilityVictoryState = {
    ...mockState,
    player: {
      ...mockState.player,
      hp: 55,
      maxHp: 55,
      mp: 10,
      abilities: ['power-strike'],
      classId: 'warrior',
      inventory: { potion: 1 },
    },
    enemy: {
      ...mockState.enemy,
      name: 'Slime',
      displayName: 'Glorious Slime of the Depths',
      hp: 5,
      maxHp: 5,
      def: 0,
    },
    log: [],
    gameStats: createGameStats(),
    rngSeed: 12345,
  };

  const prevBattleLogLen = getBattleLogEntries().length;
  const next = handleCombatAction(abilityVictoryState, { type: 'PLAYER_ABILITY', abilityId: 'power-strike' });
  const newEntries = getBattleLogEntries().slice(prevBattleLogLen);
  const abilityEntry = newEntries.find((entry) => entry.type === 'ability');
  const summary = createBattleSummary(next);
  const performanceRows = summary.combatStatsDisplay.sections.find((s) => s.type === 'stats' && s.title === 'Performance')?.rows ?? [];
  const actionRows = summary.combatStatsDisplay.sections.find((s) => s.type === 'stats' && s.title === 'Actions')?.rows ?? [];
  const maxSingleHit = performanceRows.find((r) => r.label === 'Max Single Hit')?.value;
  const attacks = actionRows.find((r) => r.label === 'Attacks')?.value;

  assert(next.phase === 'victory', 'PLAYER_ABILITY can produce victory');
  assert(abilityEntry?.details?.source === 'player', 'Ability battle-log entries are marked as player-sourced');
  assert(maxSingleHit && maxSingleHit !== 'N/A', 'Ability-only victory records a max single hit');
  assert(attacks === '1', 'Offensive ability victory counts as one attack in summary');
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

// Test Enemy Turn initializes combat stats when missing
{
  const enemyTurnState = { ...mockState, phase: 'enemy-turn' };
  const strongEnemyState = {
    ...enemyTurnState,
    enemy: { ...enemyTurnState.enemy, atk: 100 },
  };
  delete strongEnemyState.combatStats;

  const next = handleEnemyTurnLogic(strongEnemyState);
  assert(next.combatStats, 'Combat stats initialized when missing on enemy turn');
  assert(next.combatStats.totalDamageReceived > 0, 'Combat stats track damage received');
}

console.log('========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
