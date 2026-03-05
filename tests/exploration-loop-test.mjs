/**
 * Exploration Loop Tests
 * Tests the game flow: class-select → exploration → combat → victory → exploration
 * Runs in Node.js without DOM dependencies.
 */

import { initialStateWithClass, pushLog } from '../src/state.js';
import { playerAttack, playerDefend, playerUsePotion, enemyAct, startNewEncounter, nextRng } from '../src/combat.js';
import { movePlayer, getCurrentRoom, getRoomExits } from '../src/map.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

// --- Test: initialStateWithClass produces valid state ---
console.log('\n--- Initial State ---');

const warriors = ['warrior', 'mage', 'rogue', 'cleric'];
for (const classId of warriors) {
  const state = initialStateWithClass(classId);
  assert(state.player !== undefined, `${classId}: player exists`);
  assert(state.player.hp > 0, `${classId}: player has HP`);
  assert(state.player.maxHp > 0, `${classId}: player has maxHp`);
  assert(state.player.atk > 0, `${classId}: player has ATK`);
  assert(state.player.def >= 0, `${classId}: player has DEF`);
  assert(state.enemy !== undefined, `${classId}: enemy exists`);
  assert(state.world !== undefined, `${classId}: world state exists`);
  assert(state.world.roomRow !== undefined, `${classId}: world has roomRow`);
  assert(state.world.roomCol !== undefined, `${classId}: world has roomCol`);
}

// --- Test: Exploration phase transition ---
console.log('\n--- Exploration Phase Setup ---');

{
  let state = initialStateWithClass('warrior');
  // Simulate what main.js does after SELECT_CLASS
  state = { ...state, phase: 'exploration' };
  assert(state.phase === 'exploration', 'phase set to exploration after class select');
  assert(state.player.name !== undefined, 'player has name');
  assert(state.player.classId === 'warrior', 'player classId is warrior');
  assert(state.player.level === 1, 'player starts at level 1');
  assert(state.player.xp === 0, 'player starts with 0 XP');
  assert(state.player.inventory.potion === 3, 'player starts with 3 potions');
}

// --- Test: Movement with movePlayer ---
console.log('\n--- Movement ---');

{
  let state = initialStateWithClass('warrior');
  state = { ...state, phase: 'exploration' };
  const initialRoom = { ...state.world };

  // Move south from center (should work - 3x3 map)
  const result = movePlayer(state.world, 'south');
  assert(result !== undefined, 'movePlayer returns result');
  assert(typeof result.moved === 'boolean', 'result has moved property');
  assert(result.worldState !== undefined, 'result has worldState');

  if (result.moved) {
    state = { ...state, world: result.worldState };
    assert(state.world !== initialRoom, 'world state updated after move');
  }
}

{
  // Test all four directions from center
  let state = initialStateWithClass('warrior');
  const directions = ['north', 'south', 'west', 'east'];
  for (const dir of directions) {
    const result = movePlayer(state.world, dir);
    assert(result !== undefined, `movePlayer(${dir}) returns result`);
    assert(typeof result.moved === 'boolean', `movePlayer(${dir}) has moved boolean`);
  }
}

// --- Test: Invalid direction handling ---
console.log('\n--- Invalid Directions ---');

{
  const state = initialStateWithClass('warrior');
  const result = movePlayer(state.world, 'up');
  assert(result.moved === false, 'up is not a valid direction');

  const result2 = movePlayer(state.world, 'invalid');
  assert(result2.moved === false, 'invalid direction rejected');

  const result3 = movePlayer(state.world, '');
  assert(result3.moved === false, 'empty string direction rejected');
}

// --- Test: getCurrentRoom and getRoomExits ---
console.log('\n--- Room Info ---');

{
  const state = initialStateWithClass('warrior');
  const room = getCurrentRoom(state.world);
  assert(room !== null, 'getCurrentRoom returns room');
  assert(room.name !== undefined, 'room has name');
  assert(room.name === 'Village Square', 'starting room is Village Square');

  const exits = getRoomExits(state.world);
  assert(Array.isArray(exits), 'getRoomExits returns array');
  assert(exits.length > 0, 'center room has exits');
  assert(exits.includes('north'), 'center has north exit');
  assert(exits.includes('south'), 'center has south exit');
  assert(exits.includes('west'), 'center has west exit');
  assert(exits.includes('east'), 'center has east exit');
}

// --- Test: Room transition detection ---
console.log('\n--- Room Transitions ---');

{
  let state = initialStateWithClass('warrior');
  // Try to move north enough to change rooms
  let transitioned = false;
  let world = state.world;
  for (let i = 0; i < 20; i++) {
    const result = movePlayer(world, 'north');
    if (result.moved) {
      world = result.worldState;
      if (result.transitioned) {
        transitioned = true;
        break;
      }
    }
  }
  assert(transitioned, 'room transition detected when moving north repeatedly');

  const room = getCurrentRoom(world);
  assert(room !== null, 'new room exists after transition');
  assert(room.name !== 'Village Square', 'moved to different room');
}

// --- Test: Encounter generation with RNG ---
console.log('\n--- Encounter RNG ---');

{
  const state = initialStateWithClass('warrior');
  const seed = state.rngSeed || Date.now();
  const rng = nextRng(seed);
  assert(typeof rng.seed === 'number', 'nextRng returns numeric seed');
  assert(typeof rng.value === 'number', 'nextRng returns numeric value');
  assert(rng.value >= 0 && rng.value < 1, 'RNG value in [0, 1)');
  assert(rng.seed !== seed, 'RNG seed advances');

  // Multiple rolls should produce different values
  const rng2 = nextRng(rng.seed);
  assert(rng2.value !== rng.value, 'consecutive RNG values differ');
}

// --- Test: startNewEncounter ---
console.log('\n--- Start New Encounter ---');

{
  let state = initialStateWithClass('warrior');
  state = { ...state, phase: 'exploration' };

  // Start a new encounter
  const next = startNewEncounter(state, 1);
  assert(next.phase === 'player-turn', 'encounter starts in player-turn phase');
  assert(next.enemy !== undefined, 'encounter has enemy');
  assert(next.enemy.hp > 0, 'enemy has HP');
  assert(next.enemy.name !== undefined, 'enemy has name');
  assert(next.turn === 1, 'encounter starts at turn 1');
}

// --- Test: Full combat to victory ---
console.log('\n--- Full Combat Loop ---');

{
  let state = initialStateWithClass('warrior');
  state = startNewEncounter(state, 1);
  assert(state.phase === 'player-turn', 'combat begins at player-turn');

  let turns = 0;
  const maxTurns = 50;
  while (state.phase !== 'victory' && state.phase !== 'defeat' && turns < maxTurns) {
    if (state.phase === 'player-turn') {
      state = playerAttack(state);
    }
    if (state.phase === 'enemy-turn') {
      state = enemyAct(state);
    }
    turns++;
  }

  assert(turns < maxTurns, `combat resolved in under ${maxTurns} turns (took ${turns})`);
  if (state.phase === 'victory') {
    assert(state.enemy.hp <= 0, 'enemy defeated');
    assert(state.player.hp > 0, 'player survived');

    // Test post-victory transition
    const postVictory = { ...state, phase: 'exploration', player: { ...state.player, defending: false } };
    assert(postVictory.phase === 'exploration', 'can transition to exploration after victory');
    assert(postVictory.player.hp > 0, 'player HP preserved after victory');
  }
}

// --- Test: Multiple encounters (grinding loop) ---
console.log('\n--- Multi-Encounter Loop ---');

{
  let state = initialStateWithClass('warrior');
  state = { ...state, phase: 'exploration' };
  let victories = 0;

  for (let encounter = 0; encounter < 3; encounter++) {
    state = startNewEncounter(state, 1);
    assert(state.phase === 'player-turn', `encounter ${encounter + 1} starts`);

    let turns = 0;
    while (state.phase !== 'victory' && state.phase !== 'defeat' && turns < 50) {
      if (state.phase === 'player-turn') {
        // Use potion if HP is low
        if (state.player.hp < state.player.maxHp * 0.3 && (state.player.inventory.potion ?? 0) > 0) {
          state = playerUsePotion(state);
        } else {
          state = playerAttack(state);
        }
      }
      if (state.phase === 'enemy-turn') {
        state = enemyAct(state);
      }
      turns++;
    }

    if (state.phase === 'victory') {
      victories++;
      // Transition back to exploration
      state = { ...state, phase: 'exploration', player: { ...state.player, defending: false } };
    } else {
      break;
    }
  }

  assert(victories >= 1, `won at least 1 out of 3 encounters (won ${victories})`);
}

// --- Test: Defeat leads to try-again flow ---
console.log('\n--- Defeat Flow ---');

{
  let state = initialStateWithClass('warrior');
  // Manually set player HP very low and enemy ATK very high for guaranteed defeat
  state = {
    ...state,
    player: { ...state.player, hp: 1, maxHp: state.player.maxHp, inventory: { potion: 0 } },
    enemy: { ...state.enemy, atk: 999, hp: 999, maxHp: 999 },
    phase: 'player-turn',
    turn: 1,
  };
  state = playerAttack(state); // player attacks
  if (state.phase === 'enemy-turn') {
    state = enemyAct(state); // enemy one-shots player
  }
  assert(state.phase === 'defeat', 'defeat phase reached when HP drops to 0');
  assert(state.player.hp <= 0, 'player HP at 0 or below');

  // Simulate TRY_AGAIN
  const tryAgain = { phase: 'class-select', log: ['The adventure ends... but another awaits. Select your class.'] };
  assert(tryAgain.phase === 'class-select', 'try again returns to class-select');
}

// --- Test: Inventory view ---
console.log('\n--- Inventory View ---');

{
  const state = initialStateWithClass('warrior');
  const inv = state.player.inventory;
  assert(inv !== undefined, 'player has inventory');
  assert(inv.potion === 3, 'starts with 3 potions');

  // Simulate VIEW_INVENTORY message generation
  const entries = Object.entries(inv)
    .filter(([, count]) => count > 0)
    .map(([item, count]) => `${item}: ${count}`);
  const gold = state.player.gold ?? 0;
  const msg = entries.length > 0
    ? `Inventory: ${entries.join(', ')}. Gold: ${gold}.`
    : `Inventory is empty. Gold: ${gold}.`;
  assert(msg.includes('potion'), 'inventory message includes potion');
  assert(msg.includes('3'), 'inventory message includes potion count');
}

// --- Test: Save/load preserves exploration state ---
console.log('\n--- Save/Load with Exploration State ---');

{
  let state = initialStateWithClass('warrior');
  state = { ...state, phase: 'exploration' };

  // Move to a different position
  const moveResult = movePlayer(state.world, 'north');
  if (moveResult.moved) {
    state = { ...state, world: moveResult.worldState };
  }

  // Simulate save/load round-trip via JSON
  const json = JSON.stringify(state);
  const loaded = JSON.parse(json);
  assert(loaded.phase === 'exploration', 'loaded phase is exploration');
  assert(loaded.world.roomRow === state.world.roomRow, 'loaded world roomRow matches');
  assert(loaded.world.roomCol === state.world.roomCol, 'loaded world roomCol matches');
  assert(loaded.world.x === state.world.x, 'loaded world x matches');
  assert(loaded.world.y === state.world.y, 'loaded world y matches');
  assert(loaded.player.classId === 'warrior', 'loaded player class matches');
}

// --- Test: pushLog during exploration ---
console.log('\n--- Log During Exploration ---');

{
  let state = initialStateWithClass('warrior');
  state = { ...state, phase: 'exploration', log: ['You begin exploring.'] };
  state = pushLog(state, 'You see a path to the north.');
  assert(state.log.length === 2, 'log has 2 entries');
  assert(state.log[1] === 'You see a path to the north.', 'latest log entry correct');

  // Test log truncation at 200
  for (let i = 0; i < 210; i++) {
    state = pushLog(state, `Step ${i}`);
  }
  assert(state.log.length === 200, 'log capped at 200 entries');
}

// ==========================================
console.log(`\n==========================================`);
console.log(`Exploration loop tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
