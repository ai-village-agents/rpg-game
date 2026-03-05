/**
 * Enemy Abilities Tests - AI Village RPG
 * Tests for selectEnemyAction(), executeEnemyAbility(), getEnemyActionDescription()
 * and enemyAct() integration.
 * Run: node tests/enemy-abilities-test.mjs
 */

import {
  selectEnemyAction,
  executeEnemyAbility,
  getEnemyActionDescription,
} from '../src/enemy-abilities.js';
import { enemyAct, startNewEncounter } from '../src/combat.js';
import { initialStateWithClass } from '../src/state.js';

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

// Helper: create a combat state for enemy turn
function makeEnemyTurnState(enemyOverrides = {}, playerOverrides = {}, rngSeed) {
  const base = initialStateWithClass('warrior');
  return {
    ...base,
    phase: 'enemy-turn',
    turn: 1,
    rngSeed: rngSeed ?? 12345,
    log: [],
    player: {
      ...base.player,
      hp: 50,
      maxHp: 50,
      def: 5,
      atk: 10,
      defending: false,
      statusEffects: [],
      mp: 20,
      maxMp: 20,
      ...playerOverrides,
    },
    enemy: {
      id: 'goblin',
      name: 'Goblin',
      hp: 20,
      maxHp: 20,
      atk: 8,
      def: 3,
      mp: 10,
      maxMp: 10,
      spd: 7,
      abilities: ['power-strike'],
      element: 'physical',
      aiBehavior: 'basic',
      xpReward: 8,
      goldReward: 6,
      defending: false,
      statusEffects: [],
      ...enemyOverrides,
    },
  };
}

const SEED_BASIC_ATTACK = 1; // actionRoll < 0.7
const SEED_BASIC_ABILITY = 31142; // actionRoll ~ 0.7000
const SEED_BASIC_DEFEND = 40040; // actionRoll ~ 0.9000
const SEED_AGGRESSIVE_ABILITY = 24469; // actionRoll ~ 0.55
const SEED_CASTER_ATTACK = 4449; // actionRoll ~ 0.10
const SEED_CASTER_ABILITY = 8898; // actionRoll ~ 0.2000

// ══════════════════════════════════════════════════════════════════════
// SECTION 1: selectEnemyAction
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- selectEnemyAction ---');

{
  const state = makeEnemyTurnState();
  const result = selectEnemyAction(state.enemy, state.player, SEED_BASIC_ATTACK);
  assert(result.action === 'attack', 'basic: roll < 0.7 chooses attack');
  assert(result.abilityId === null, 'basic attack has null abilityId');
}

{
  const state = makeEnemyTurnState();
  const result = selectEnemyAction(state.enemy, state.player, SEED_BASIC_ABILITY);
  assert(result.action === 'ability', 'basic: roll 0.7-0.9 chooses ability');
  assert(result.abilityId === 'power-strike', 'basic ability selects power-strike');
}

{
  const state = makeEnemyTurnState();
  const result = selectEnemyAction(state.enemy, state.player, SEED_BASIC_DEFEND);
  assert(result.action === 'defend', 'basic: roll > 0.9 chooses defend');
  assert(result.abilityId === null, 'basic defend has null abilityId');
}

{
  const state = makeEnemyTurnState({ abilities: [] });
  const result = selectEnemyAction(state.enemy, state.player, SEED_BASIC_ABILITY);
  assert(result.action === 'attack', 'no abilities: fallback to attack');
  assert(result.abilityId === null, 'no abilities: abilityId remains null');
}

{
  const state = makeEnemyTurnState({ mp: 0 });
  const result = selectEnemyAction(state.enemy, state.player, SEED_BASIC_ABILITY);
  assert(result.action === 'attack', 'no MP: fallback to attack when ability chosen');
  assert(result.abilityId === null, 'no MP: abilityId remains null');
}

{
  const basic = makeEnemyTurnState({ aiBehavior: 'basic' });
  const aggressive = makeEnemyTurnState({ aiBehavior: 'aggressive' });
  const basicResult = selectEnemyAction(basic.enemy, basic.player, SEED_AGGRESSIVE_ABILITY);
  const aggressiveResult = selectEnemyAction(aggressive.enemy, aggressive.player, SEED_AGGRESSIVE_ABILITY);
  assert(basicResult.action === 'attack', 'aggressive threshold check: basic uses attack at 0.55');
  assert(aggressiveResult.action === 'ability', 'aggressive threshold check: aggressive uses ability at 0.55');
}

{
  const caster = makeEnemyTurnState({ aiBehavior: 'caster' });
  const lowRoll = selectEnemyAction(caster.enemy, caster.player, SEED_CASTER_ATTACK);
  const highRoll = selectEnemyAction(caster.enemy, caster.player, SEED_CASTER_ABILITY);
  assert(lowRoll.action === 'attack', 'caster: attack threshold is 0.2 (roll 0.10 -> attack)');
  assert(highRoll.action === 'ability', 'caster: roll just above 0.2 -> ability');
}

{
  const boss = makeEnemyTurnState({ aiBehavior: 'boss' });
  const result = selectEnemyAction(boss.enemy, boss.player, SEED_BASIC_ABILITY);
  const validAction = ['attack', 'ability', 'defend'].includes(result.action);
  const abilityOk = result.action === 'ability' ? Boolean(result.abilityId) : result.abilityId === null;
  assert(validAction, 'boss: returns a valid action');
  assert(abilityOk, 'boss: abilityId present only for ability action');
}

{
  const state = makeEnemyTurnState();
  const result = selectEnemyAction(state.enemy, state.player, SEED_BASIC_ATTACK);
  assert(typeof result.newSeed === 'number', 'returns newSeed as a number');
}

{
  const unknown = makeEnemyTurnState({ aiBehavior: 'mystery' });
  const result = selectEnemyAction(unknown.enemy, unknown.player, SEED_BASIC_ATTACK);
  assert(result.action === 'attack', 'unknown aiBehavior defaults to basic');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 2: getEnemyActionDescription
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- getEnemyActionDescription ---');

{
  const desc = getEnemyActionDescription('attack', null, 'Goblin');
  assert(desc.includes('attacks!'), 'attack description contains "attacks!"');
}

{
  const desc = getEnemyActionDescription('defend', null, 'Goblin');
  assert(desc.includes('defends!'), 'defend description contains "defends!"');
}

{
  const desc = getEnemyActionDescription('ability', 'power-strike', 'Goblin');
  assert(desc.includes('Power Strike'), 'ability description contains Power Strike');
}

{
  const desc = getEnemyActionDescription('ability', 'fire-breath', 'Dragon');
  assert(desc.includes('Fire Breath'), 'ability description contains Fire Breath');
}

{
  const desc = getEnemyActionDescription('ability', null, 'Goblin');
  assert(desc.includes('attacks!'), 'ability with null id falls back to attacks');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 3: executeEnemyAbility
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- executeEnemyAbility ---');

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'power-strike');
  assert(result.player.hp < state.player.hp, 'power-strike damages player');
}

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'power-strike');
  assert(result.enemy.mp === state.enemy.mp - 4, 'power-strike deducts 4 MP');
}

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'slime-splash');
  const hasSpdDown = (result.player.statusEffects ?? []).some(e => e.type === 'spd-down');
  assert(hasSpdDown, 'slime-splash applies spd-down to player');
}

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'regenerate');
  const hasRegen = (result.enemy.statusEffects ?? []).some(e => e.type === 'regen');
  assert(hasRegen, 'regenerate applies regen to enemy');
}

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'unknown-ability');
  assert(result === state, 'unknown ability returns state unchanged');
}

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'power-strike');
  assert(result.log.some(l => l.includes('Power Strike')), 'log contains ability name');
}

{
  const state = makeEnemyTurnState({ atk: 999 }, { hp: 10, maxHp: 10, def: 0 });
  const result = executeEnemyAbility(state, 'power-strike');
  assert(result.phase === 'defeat', 'ability sets phase to defeat when player reaches 0 HP');
}

{
  const state = makeEnemyTurnState(
    { defending: true },
    { defending: true }
  );
  const result = executeEnemyAbility(state, 'power-strike');
  assert(!result.player.defending, 'ability clears player defending');
  assert(!result.enemy.defending, 'ability clears enemy defending');
}

{
  const state = makeEnemyTurnState();
  const result = executeEnemyAbility(state, 'regenerate');
  assert(result.enemy.mp === state.enemy.mp - 4, 'regenerate deducts 4 MP');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 4: enemyAct integration
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- enemyAct integration ---');

{
  const state = makeEnemyTurnState({ statusEffects: [{ type: 'stun', duration: 2, power: 0 }] });
  const result = enemyAct(state);
  const stunnedLogged = result.log.some(l => l.toLowerCase().includes('stunned'));
  assert(result.phase === 'player-turn', 'stunned enemy yields player-turn');
  assert(stunnedLogged, 'stunned enemy logs "stunned"');
}

{
  const state = makeEnemyTurnState({ statusEffects: [{ type: 'stun', duration: 1, power: 0 }] });
  const result = enemyAct(state);
  const stunnedLogged = result.log.some(l => l.toLowerCase().includes('stunned'));
  assert(stunnedLogged, 'stun duration 1 is treated as stunned');
}

{
  const state = makeEnemyTurnState({}, {}, SEED_BASIC_ATTACK);
  const result = enemyAct(state);
  assert(result.phase === 'player-turn', 'after enemyAct, phase returns to player-turn');
}

{
  const state = makeEnemyTurnState({}, {}, SEED_BASIC_ATTACK);
  const result = enemyAct(state);
  assert(result.player.hp < state.player.hp, 'normal attack reduces player HP');
  assert(result.phase === 'player-turn', 'normal attack ends at player-turn');
}

{
  const state = makeEnemyTurnState({}, {}, SEED_BASIC_ATTACK);
  const result = enemyAct(state);
  assert(result.turn === state.turn + 1, 'turn increments after enemy acts');
}

{
  const state = makeEnemyTurnState({}, {}, SEED_BASIC_ABILITY);
  const result = enemyAct(state);
  assert(result.log.length > state.log.length, 'enemyAct adds at least one log entry');
}

{
  const base = startNewEncounter(initialStateWithClass('warrior'), 1);
  const state = {
    ...base,
    phase: 'enemy-turn',
    turn: 1,
    rngSeed: SEED_BASIC_ATTACK,
    log: [],
    player: {
      ...base.player,
      hp: 50,
      maxHp: 50,
      def: 5,
      atk: 10,
      defending: false,
      statusEffects: [],
      mp: 20,
      maxMp: 20,
    },
    enemy: {
      ...base.enemy,
      mp: base.enemy.mp ?? 10,
      maxMp: base.enemy.maxMp ?? 10,
      abilities: base.enemy.abilities ?? ['power-strike'],
      aiBehavior: base.enemy.aiBehavior ?? 'basic',
      defending: false,
      statusEffects: [],
    },
  };
  const result = enemyAct(state);
  assert(result.phase === 'player-turn', 'enemyAct works with startNewEncounter state');
}

// Summary
console.log(`\nEnemy Abilities Tests: ${passed} passed, ${failed} failed.`);
process.exitCode = failed > 0 ? 1 : 0;
