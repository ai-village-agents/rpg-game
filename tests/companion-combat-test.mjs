/**
 * Tests for companion-combat.js — Companion Combat Participation
 */

import {
  getAliveCompanions,
  getDeadCompanions,
  getEffectiveCompanionAttack,
  getEffectiveCompanionDefense,
  companionsCombatTurn,
  selectEnemyTarget,
  enemyAttackCompanion,
  reviveCompanion,
  processCompanionCombatRewards,
  processCompanionDefeatPenalty,
  autoReviveCompanionsAfterCombat,
  getCompanionCombatSummary,
} from '../src/companion-combat.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${msg}`);
  }
}

function makeState(overrides = {}) {
  return {
    companions: [],
    maxCompanions: 2,
    enemy: { name: 'Slime', hp: 30, maxHp: 30, def: 2, atk: 5 },
    player: { hp: 50, maxHp: 50 },
    log: [],
    ...overrides,
  };
}

function makeCompanion(overrides = {}) {
  return {
    id: 'kael',
    name: 'Kael',
    class: 'Warrior',
    level: 1,
    hp: 20,
    maxHp: 20,
    mp: 5,
    maxMp: 5,
    attack: 8,
    defense: 3,
    speed: 4,
    skills: [],
    alive: true,
    loyalty: 50,
    ...overrides,
  };
}

// =================== getAliveCompanions ===================

(function testGetAliveCompanions_empty() {
  const state = makeState();
  const alive = getAliveCompanions(state);
  assert(alive.length === 0, 'No alive companions from empty list');
})();

(function testGetAliveCompanions_allAlive() {
  const c1 = makeCompanion({ id: 'kael', alive: true });
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', alive: true });
  const state = makeState({ companions: [c1, c2] });
  const alive = getAliveCompanions(state);
  assert(alive.length === 2, 'Both alive companions returned');
})();

(function testGetAliveCompanions_mixedState() {
  const c1 = makeCompanion({ id: 'kael', alive: true });
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', alive: false, hp: 0 });
  const state = makeState({ companions: [c1, c2] });
  const alive = getAliveCompanions(state);
  assert(alive.length === 1, 'Only alive companion returned');
  assert(alive[0].id === 'kael', 'Correct alive companion');
})();

(function testGetAliveCompanions_noCompanionsField() {
  const state = { enemy: {}, player: {}, log: [] };
  const alive = getAliveCompanions(state);
  assert(alive.length === 0, 'Handles missing companions field');
})();

// =================== getDeadCompanions ===================

(function testGetDeadCompanions_empty() {
  const state = makeState();
  const dead = getDeadCompanions(state);
  assert(dead.length === 0, 'No dead companions from empty list');
})();

(function testGetDeadCompanions_oneDead() {
  const c1 = makeCompanion({ id: 'kael', alive: true });
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', alive: false, hp: 0 });
  const state = makeState({ companions: [c1, c2] });
  const dead = getDeadCompanions(state);
  assert(dead.length === 1, 'One dead companion returned');
  assert(dead[0].id === 'lyra', 'Correct dead companion');
})();

// =================== getEffectiveCompanionAttack ===================

(function testEffectiveAttack_neutral() {
  // loyalty 30 = Neutral tier (25-49), attackMod = 0
  const c = makeCompanion({ attack: 8, loyalty: 30 });
  assert(getEffectiveCompanionAttack(c) === 8, 'Neutral loyalty: base attack unchanged');
})();

(function testEffectiveAttack_friendly() {
  // loyalty 60-79 = Friendly tier, attackMod = +1
  const c = makeCompanion({ attack: 8, loyalty: 65 });
  assert(getEffectiveCompanionAttack(c) === 9, 'Friendly loyalty: attack +1');
})();

(function testEffectiveAttack_devoted() {
  // loyalty 80-99 = Devoted tier, attackMod = +2
  const c = makeCompanion({ attack: 8, loyalty: 85 });
  assert(getEffectiveCompanionAttack(c) === 10, 'Devoted loyalty: attack +2');
})();

(function testEffectiveAttack_soulbound() {
  // loyalty 100 = Soulbound tier, attackMod = +3
  const c = makeCompanion({ attack: 8, loyalty: 100 });
  assert(getEffectiveCompanionAttack(c) === 11, 'Soulbound loyalty: attack +3');
})();

(function testEffectiveAttack_discontent() {
  // loyalty 10-24 = Discontent tier, attackMod = -1
  const c = makeCompanion({ attack: 8, loyalty: 15 });
  assert(getEffectiveCompanionAttack(c) === 7, 'Discontent loyalty: attack -1');
})();

(function testEffectiveAttack_abandoned() {
  // loyalty 0-19 = Abandoned tier, attackMod = 0
  const c = makeCompanion({ attack: 8, loyalty: 5 });
  assert(getEffectiveCompanionAttack(c) === 8, 'Abandoned loyalty: attack unchanged (0 mod)');
})();

(function testEffectiveAttack_minFloor() {
  // Very low attack + negative mod should not go below 0
  const c = makeCompanion({ attack: 0, loyalty: 25 });
  assert(getEffectiveCompanionAttack(c) >= 0, 'Attack never goes below 0');
})();

// =================== getEffectiveCompanionDefense ===================

(function testEffectiveDefense_neutral() {
  const c = makeCompanion({ defense: 3, loyalty: 50 });
  assert(getEffectiveCompanionDefense(c) === 3, 'Neutral loyalty: defense unchanged');
})();

(function testEffectiveDefense_devoted() {
  // Devoted: defenseMod = +1
  const c = makeCompanion({ defense: 3, loyalty: 85 });
  assert(getEffectiveCompanionDefense(c) === 4, 'Devoted loyalty: defense +1');
})();

(function testEffectiveDefense_soulbound() {
  // Soulbound: defenseMod = +2
  const c = makeCompanion({ defense: 3, loyalty: 100 });
  assert(getEffectiveCompanionDefense(c) === 5, 'Soulbound loyalty: defense +2');
})();

// =================== companionsCombatTurn ===================

(function testCompanionsCombatTurn_noCompanions() {
  const state = makeState();
  const result = companionsCombatTurn(state, 12345);
  assert(result.state.enemy.hp === 30, 'No companions: enemy HP unchanged');
  assert(result.seed === 12345, 'Seed unchanged when no companions');
})();

(function testCompanionsCombatTurn_oneAliveCompanion() {
  const c = makeCompanion({ attack: 8, loyalty: 30, alive: true }); // Neutral: +0 atk
  const state = makeState({ companions: [c] });
  const result = companionsCombatTurn(state, 12345);
  // damage = max(1, 8 - 2) = 6
  assert(result.state.enemy.hp === 24, 'One companion attacks for 6 damage (8atk - 2def)');
  assert(result.seed !== 12345, 'Seed advanced');
})();

(function testCompanionsCombatTurn_deadCompanionSkipped() {
  const c = makeCompanion({ attack: 8, loyalty: 50, alive: false, hp: 0 });
  const state = makeState({ companions: [c] });
  const result = companionsCombatTurn(state, 12345);
  assert(result.state.enemy.hp === 30, 'Dead companion does not attack');
  assert(result.seed === 12345, 'Seed unchanged when companion dead');
})();

(function testCompanionsCombatTurn_twoCompanionsAttack() {
  const c1 = makeCompanion({ id: 'kael', attack: 8, loyalty: 30, alive: true }); // Neutral: +0
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', attack: 6, loyalty: 30, alive: true }); // Neutral: +0
  const state = makeState({ companions: [c1, c2] });
  const result = companionsCombatTurn(state, 12345);
  // c1 damage = max(1, 8-2) = 6, c2 damage = max(1, 6-2) = 4, total = 10
  assert(result.state.enemy.hp === 20, 'Two companions deal combined 10 damage');
})();

(function testCompanionsCombatTurn_loyaltyBoostsDamage() {
  const c = makeCompanion({ attack: 8, loyalty: 85, alive: true }); // Devoted: +2 atk
  const state = makeState({ companions: [c] });
  const result = companionsCombatTurn(state, 12345);
  // effective atk = 10, damage = max(1, 10-2) = 8
  assert(result.state.enemy.hp === 22, 'Devoted companion does 8 damage (10atk - 2def)');
})();

(function testCompanionsCombatTurn_abandonedRefuses() {
  const c = makeCompanion({ attack: 8, loyalty: 5, alive: true }); // Abandoned: refuses
  const state = makeState({ companions: [c] });
  const result = companionsCombatTurn(state, 12345);
  assert(result.state.enemy.hp === 30, 'Abandoned companion refuses to fight');
  const hasRefusalLog = result.state.log.some(
    (l) => typeof l === 'string' && l.includes('refuses to fight')
  );
  assert(hasRefusalLog, 'Log mentions refusal');
})();

(function testCompanionsCombatTurn_enemyAlreadyDead() {
  const c = makeCompanion({ attack: 8, alive: true });
  const state = makeState({ companions: [c], enemy: { name: 'Slime', hp: 0, maxHp: 30, def: 2 } });
  const result = companionsCombatTurn(state, 12345);
  assert(result.state.enemy.hp === 0, 'No attack on dead enemy');
})();

(function testCompanionsCombatTurn_overkillClamped() {
  const c = makeCompanion({ attack: 50, alive: true, loyalty: 50 });
  const state = makeState({ companions: [c], enemy: { name: 'Slime', hp: 3, maxHp: 30, def: 2 } });
  const result = companionsCombatTurn(state, 12345);
  assert(result.state.enemy.hp === 0, 'Enemy HP clamped to 0 on overkill');
})();

(function testCompanionsCombatTurn_minimumDamage() {
  const c = makeCompanion({ attack: 1, alive: true, loyalty: 50 });
  const state = makeState({
    companions: [c],
    enemy: { name: 'Tank', hp: 30, maxHp: 30, def: 100 },
  });
  const result = companionsCombatTurn(state, 12345);
  assert(result.state.enemy.hp === 29, 'Minimum 1 damage even if def > atk');
})();

// =================== selectEnemyTarget ===================

(function testSelectEnemyTarget_noCompanions() {
  const state = makeState();
  const result = selectEnemyTarget(state, 12345);
  assert(result.targetType === 'player', 'No companions: target is player');
})();

(function testSelectEnemyTarget_deterministicSeed() {
  const c = makeCompanion({ alive: true });
  const state = makeState({ companions: [c] });
  const r1 = selectEnemyTarget(state, 42);
  const r2 = selectEnemyTarget(state, 42);
  assert(r1.targetType === r2.targetType, 'Same seed produces same target');
  assert(r1.seed === r2.seed, 'Same seed produces same output seed');
})();

(function testSelectEnemyTarget_canTargetCompanion() {
  // Try many seeds, verify companion can be targeted
  const c = makeCompanion({ alive: true });
  const state = makeState({ companions: [c] });
  let companionTargeted = false;
  for (let seed = 1; seed < 100; seed++) {
    const result = selectEnemyTarget(state, seed);
    if (result.targetType === 'companion') {
      companionTargeted = true;
      break;
    }
  }
  assert(companionTargeted, 'Enemy can target companion with some seeds');
})();

(function testSelectEnemyTarget_canTargetPlayer() {
  const c = makeCompanion({ alive: true });
  const state = makeState({ companions: [c] });
  let playerTargeted = false;
  // Park-Miller LCG with small seeds produces small values; use large seeds
  for (let seed = 500000; seed < 600000; seed += 1000) {
    const result = selectEnemyTarget(state, seed);
    if (result.targetType === 'player') {
      playerTargeted = true;
      break;
    }
  }
  assert(playerTargeted, 'Enemy can target player with some seeds');
})();

// =================== enemyAttackCompanion ===================

(function testEnemyAttackCompanion_basic() {
  const c = makeCompanion({ hp: 20, maxHp: 20, defense: 3, loyalty: 50, alive: true });
  const state = makeState({ companions: [c] });
  const next = enemyAttackCompanion(state, 'kael', 8);
  const updated = next.companions.find((x) => x.id === 'kael');
  // damage = max(1, 8 - 3) = 5
  assert(updated.hp === 15, 'Companion takes 5 damage (8atk - 3def)');
})();

(function testEnemyAttackCompanion_loyaltyDefense() {
  // Soulbound companion: defenseMod = +2
  const c = makeCompanion({ hp: 20, maxHp: 20, defense: 3, loyalty: 100, alive: true });
  const state = makeState({ companions: [c] });
  const next = enemyAttackCompanion(state, 'kael', 8);
  const updated = next.companions.find((x) => x.id === 'kael');
  // effective def = 3+2 = 5, damage = max(1, 8-5) = 3
  assert(updated.hp === 17, 'Soulbound companion takes 3 damage (8atk - 5def)');
})();

(function testEnemyAttackCompanion_kills() {
  const c = makeCompanion({ hp: 3, maxHp: 20, defense: 0, loyalty: 50, alive: true });
  const state = makeState({ companions: [c] });
  const next = enemyAttackCompanion(state, 'kael', 10);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.hp === 0, 'Companion HP drops to 0');
  assert(updated.alive === false, 'Companion marked as dead');
})();

(function testEnemyAttackCompanion_deadCompanionIgnored() {
  const c = makeCompanion({ hp: 0, alive: false });
  const state = makeState({ companions: [c] });
  const next = enemyAttackCompanion(state, 'kael', 10);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.hp === 0, 'Dead companion not further damaged');
})();

(function testEnemyAttackCompanion_minDamage() {
  const c = makeCompanion({ hp: 20, defense: 100, loyalty: 50, alive: true });
  const state = makeState({ companions: [c] });
  const next = enemyAttackCompanion(state, 'kael', 1);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.hp === 19, 'Minimum 1 damage dealt');
})();

// =================== reviveCompanion ===================

(function testReviveCompanion_basic() {
  const c = makeCompanion({ hp: 0, maxHp: 20, alive: false });
  const state = makeState({ companions: [c] });
  const next = reviveCompanion(state, 'kael', 0.5);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.alive === true, 'Companion is alive after revive');
  assert(updated.hp === 10, 'Companion has 50% HP after revive');
})();

(function testReviveCompanion_defaultPercent() {
  const c = makeCompanion({ hp: 0, maxHp: 20, alive: false });
  const state = makeState({ companions: [c] });
  const next = reviveCompanion(state, 'kael');
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.hp === 5, 'Default 25% HP after revive');
})();

(function testReviveCompanion_alreadyAlive() {
  const c = makeCompanion({ hp: 15, maxHp: 20, alive: true });
  const state = makeState({ companions: [c] });
  const next = reviveCompanion(state, 'kael');
  const hasAlreadyAliveLog = next.log.some(
    (l) => typeof l === 'string' && l.includes('already alive')
  );
  assert(hasAlreadyAliveLog, 'Log indicates companion already alive');
})();

(function testReviveCompanion_notFound() {
  const state = makeState();
  const next = reviveCompanion(state, 'nobody');
  const hasNotFoundLog = next.log.some(
    (l) => typeof l === 'string' && l.includes('not found')
  );
  assert(hasNotFoundLog, 'Log indicates companion not found');
})();

(function testReviveCompanion_minOneHp() {
  const c = makeCompanion({ hp: 0, maxHp: 1, alive: false });
  const state = makeState({ companions: [c] });
  const next = reviveCompanion(state, 'kael', 0.01);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.hp >= 1, 'Revive always gives at least 1 HP');
})();

// =================== processCompanionCombatRewards ===================

(function testCombatRewards_aliveGainsLoyalty() {
  const c = makeCompanion({ loyalty: 50, alive: true });
  const state = makeState({ companions: [c] });
  const next = processCompanionCombatRewards(state);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.loyalty === 53, 'Alive companion gains +3 loyalty');
})();

(function testCombatRewards_deadLosesLoyalty() {
  const c = makeCompanion({ loyalty: 50, alive: false, hp: 0 });
  const state = makeState({ companions: [c] });
  const next = processCompanionCombatRewards(state);
  const updated = next.companions.find((x) => x.id === 'kael');
  assert(updated.loyalty === 48, 'Dead companion loses -2 loyalty');
})();

(function testCombatRewards_empty() {
  const state = makeState();
  const next = processCompanionCombatRewards(state);
  assert(next.companions.length === 0, 'No error on empty companions');
})();

// =================== processCompanionDefeatPenalty ===================

(function testDefeatPenalty_allLoseLoyalty() {
  const c1 = makeCompanion({ id: 'kael', loyalty: 50, alive: true });
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', loyalty: 60, alive: false, hp: 0 });
  const state = makeState({ companions: [c1, c2] });
  const next = processCompanionDefeatPenalty(state);
  const k = next.companions.find((x) => x.id === 'kael');
  const l = next.companions.find((x) => x.id === 'lyra');
  assert(k.loyalty === 45, 'Alive companion loses -5 loyalty on defeat');
  assert(l.loyalty === 55, 'Dead companion loses -5 loyalty on defeat');
})();

(function testDefeatPenalty_empty() {
  const state = makeState();
  const next = processCompanionDefeatPenalty(state);
  assert(next.companions.length === 0, 'No error on empty companions');
})();

// =================== autoReviveCompanionsAfterCombat ===================

(function testAutoRevive_revivesDeadCompanions() {
  const c1 = makeCompanion({ id: 'kael', hp: 10, maxHp: 20, alive: true });
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', hp: 0, maxHp: 20, alive: false });
  const state = makeState({ companions: [c1, c2] });
  const next = autoReviveCompanionsAfterCombat(state);
  const k = next.companions.find((x) => x.id === 'kael');
  const l = next.companions.find((x) => x.id === 'lyra');
  assert(k.hp === 10, 'Alive companion HP unchanged');
  assert(l.alive === true, 'Dead companion revived');
  assert(l.hp === 5, 'Revived companion has 25% HP');
})();

(function testAutoRevive_noneToRevive() {
  const c = makeCompanion({ hp: 15, alive: true });
  const state = makeState({ companions: [c] });
  const next = autoReviveCompanionsAfterCombat(state);
  assert(next.companions[0].hp === 15, 'No change when all alive');
})();

// =================== getCompanionCombatSummary ===================

(function testCombatSummary_basic() {
  const c1 = makeCompanion({ id: 'kael', name: 'Kael', hp: 15, maxHp: 20, alive: true });
  const c2 = makeCompanion({ id: 'lyra', name: 'Lyra', hp: 0, maxHp: 20, alive: false });
  const state = makeState({ companions: [c1, c2] });
  const summary = getCompanionCombatSummary(state);
  assert(summary.length === 2, 'Summary includes both companions');
  assert(summary[0].name === 'Kael', 'First companion name correct');
  assert(summary[0].alive === true, 'First companion alive');
  assert(summary[0].hp === 15, 'First companion HP correct');
  assert(summary[1].alive === false, 'Second companion dead');
})();

(function testCombatSummary_empty() {
  const state = makeState();
  const summary = getCompanionCombatSummary(state);
  assert(summary.length === 0, 'Empty summary for no companions');
})();

// =================== REPORT ===================

console.log(`\nCompanion Combat Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
