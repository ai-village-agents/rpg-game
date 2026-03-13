/**
 * Tests for Threat/Aggro System
 * Run with: node --test tests/threat-aggro-system-test.mjs
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  THREAT_MODIFIERS,
  THREAT_REDUCTION,
  TANK_STANCES,
  AGGRO_STATE,
  initThreatState,
  getThreatState,
  initEnemyThreatTable,
  generateThreat,
  reduceThreat,
  applyTaunt,
  getThreatTarget,
  updateEnemyTarget,
  setPlayerStance,
  setThreatModifier,
  getThreatTable,
  getTargetThreat,
  clearTargetThreat,
  resetEnemyThreat,
  cleanupExpiredEffects,
  getAggroState,
  setAggroState,
  getThreatStats,
  threatFromDamage,
  threatFromHealing,
  hasAggro,
  getEnemiesTargeting,
  removeEnemy
} from '../src/threat-aggro-system.js';

describe('Threat/Aggro System', () => {
  let gameState;

  beforeEach(() => {
    gameState = { threat: initThreatState() };
  });

  describe('Constants', () => {
    it('has all threat modifiers', () => {
      assert.ok(THREAT_MODIFIERS.DAMAGE);
      assert.ok(THREAT_MODIFIERS.CRITICAL_HIT);
      assert.ok(THREAT_MODIFIERS.DOT_TICK);
      assert.ok(THREAT_MODIFIERS.HEAL_SELF);
      assert.ok(THREAT_MODIFIERS.HEAL_OTHER);
      assert.ok(THREAT_MODIFIERS.OVERHEAL);
      assert.ok(THREAT_MODIFIERS.TAUNT);
      assert.ok(THREAT_MODIFIERS.ATTACK_MISS);
      assert.ok(THREAT_MODIFIERS.BUFF_ALLY);
      assert.ok(THREAT_MODIFIERS.DEBUFF_ENEMY);
      assert.ok(THREAT_MODIFIERS.RESURRECT);
      assert.ok(THREAT_MODIFIERS.SUMMON);
    });

    it('has correct base modifiers for damage types', () => {
      assert.strictEqual(THREAT_MODIFIERS.DAMAGE.baseMod, 1.0);
      assert.strictEqual(THREAT_MODIFIERS.CRITICAL_HIT.baseMod, 1.5);
      assert.strictEqual(THREAT_MODIFIERS.DOT_TICK.baseMod, 0.5);
    });

    it('has correct base modifiers for healing types', () => {
      assert.strictEqual(THREAT_MODIFIERS.HEAL_SELF.baseMod, 0.5);
      assert.strictEqual(THREAT_MODIFIERS.HEAL_OTHER.baseMod, 1.0);
      assert.strictEqual(THREAT_MODIFIERS.OVERHEAL.baseMod, 0.25);
    });

    it('has all threat reduction abilities', () => {
      assert.ok(THREAT_REDUCTION.FADE);
      assert.ok(THREAT_REDUCTION.FEIGN_DEATH);
      assert.ok(THREAT_REDUCTION.VANISH);
      assert.ok(THREAT_REDUCTION.THREAT_DUMP);
    });

    it('has correct reduction values', () => {
      assert.strictEqual(THREAT_REDUCTION.FADE.reduction, 0.5);
      assert.strictEqual(THREAT_REDUCTION.FEIGN_DEATH.reduction, 1.0);
      assert.strictEqual(THREAT_REDUCTION.VANISH.reduction, 1.0);
      assert.strictEqual(THREAT_REDUCTION.THREAT_DUMP.reduction, 0.3);
    });

    it('has all tank stances', () => {
      assert.ok(TANK_STANCES.DEFENSIVE);
      assert.ok(TANK_STANCES.AGGRESSIVE);
      assert.ok(TANK_STANCES.NORMAL);
    });

    it('has correct stance modifiers', () => {
      assert.strictEqual(TANK_STANCES.DEFENSIVE.threatMod, 1.5);
      assert.strictEqual(TANK_STANCES.DEFENSIVE.damageMod, 0.9);
      assert.strictEqual(TANK_STANCES.AGGRESSIVE.threatMod, 1.2);
      assert.strictEqual(TANK_STANCES.NORMAL.threatMod, 1.0);
    });

    it('has all aggro states', () => {
      assert.ok(AGGRO_STATE.IDLE);
      assert.ok(AGGRO_STATE.ENGAGED);
      assert.ok(AGGRO_STATE.ATTACKING);
      assert.ok(AGGRO_STATE.RETURNING);
    });

    it('has colors for aggro states', () => {
      assert.strictEqual(AGGRO_STATE.IDLE.color, '#888888');
      assert.strictEqual(AGGRO_STATE.ENGAGED.color, '#FFAA00');
      assert.strictEqual(AGGRO_STATE.ATTACKING.color, '#FF0000');
      assert.strictEqual(AGGRO_STATE.RETURNING.color, '#00AAFF');
    });
  });

  describe('initThreatState', () => {
    it('creates empty threat state', () => {
      const state = initThreatState();
      assert.deepStrictEqual(state.threatTables, {});
      assert.deepStrictEqual(state.aggroStates, {});
      assert.deepStrictEqual(state.currentTargets, {});
      assert.deepStrictEqual(state.playerStances, {});
      assert.deepStrictEqual(state.threatModifiers, {});
      assert.deepStrictEqual(state.threatHistory, []);
      assert.deepStrictEqual(state.tauntEffects, {});
      assert.deepStrictEqual(state.fixatedTargets, {});
    });
  });

  describe('getThreatState', () => {
    it('returns existing threat state', () => {
      const result = getThreatState(gameState);
      assert.strictEqual(result, gameState.threat);
    });

    it('creates new threat state if none exists', () => {
      const result = getThreatState({});
      assert.ok(result.threatTables);
      assert.ok(result.aggroStates);
    });
  });

  describe('initEnemyThreatTable', () => {
    it('initializes threat table for enemy', () => {
      const result = initEnemyThreatTable(gameState, 'enemy1');
      assert.ok(result.initialized);
      assert.deepStrictEqual(result.state.threat.threatTables.enemy1, {});
      assert.strictEqual(result.state.threat.aggroStates.enemy1, 'idle');
    });

    it('fails if threat table already exists', () => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = initEnemyThreatTable(result1.state, 'enemy1');
      assert.strictEqual(result2.initialized, false);
      assert.ok(result2.error);
    });
  });

  describe('generateThreat', () => {
    beforeEach(() => {
      const result = initEnemyThreatTable(gameState, 'enemy1');
      gameState = result.state;
    });

    it('generates threat from damage', () => {
      const result = generateThreat(gameState, 'player1', 'enemy1', 100);
      assert.ok(result.generated);
      assert.strictEqual(result.totalThreat, 100);
      assert.strictEqual(result.finalThreat, 100);
    });

    it('fails if enemy has no threat table', () => {
      const result = generateThreat(gameState, 'player1', 'unknown', 100);
      assert.strictEqual(result.generated, false);
      assert.ok(result.error);
    });

    it('applies critical hit modifier', () => {
      const result = generateThreat(gameState, 'player1', 'enemy1', 100, { isCritical: true });
      assert.ok(result.generated);
      assert.strictEqual(result.finalThreat, 150);
    });

    it('applies modifier type', () => {
      const result = generateThreat(gameState, 'player1', 'enemy1', 100, { modifierType: 'dot_tick' });
      assert.ok(result.generated);
      assert.strictEqual(result.finalThreat, 50);
    });

    it('applies stance modifier', () => {
      const result = generateThreat(gameState, 'player1', 'enemy1', 100, { stance: 'defensive' });
      assert.ok(result.generated);
      assert.strictEqual(result.finalThreat, 150);
    });

    it('stacks threat from multiple actions', () => {
      const result1 = generateThreat(gameState, 'player1', 'enemy1', 100);
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 50);
      assert.strictEqual(result2.totalThreat, 150);
    });

    it('changes aggro state from idle to engaged', () => {
      const result = generateThreat(gameState, 'player1', 'enemy1', 100);
      assert.strictEqual(result.state.threat.aggroStates.enemy1, 'engaged');
    });

    it('records threat history', () => {
      const result = generateThreat(gameState, 'player1', 'enemy1', 100);
      assert.strictEqual(result.state.threat.threatHistory.length, 1);
      assert.strictEqual(result.state.threat.threatHistory[0].baseAmount, 100);
    });

    it('applies player stance from state', () => {
      const stanceResult = setPlayerStance(gameState, 'player1', 'defensive');
      const result = generateThreat(stanceResult.state, 'player1', 'enemy1', 100);
      assert.strictEqual(result.finalThreat, 150);
    });

    it('applies global threat modifier', () => {
      const modResult = setThreatModifier(gameState, 'player1', 2.0);
      const result = generateThreat(modResult.state, 'player1', 'enemy1', 100);
      assert.strictEqual(result.finalThreat, 200);
    });

    it('handles heal_other modifier type', () => {
      const result = generateThreat(gameState, 'healer1', 'enemy1', 100, { modifierType: 'heal_other' });
      assert.strictEqual(result.finalThreat, 100);
    });

    it('limits threat history to 100 entries', () => {
      let state = gameState;
      for (let i = 0; i < 110; i++) {
        const result = generateThreat(state, 'player1', 'enemy1', 1);
        state = result.state;
      }
      assert.ok(state.threat.threatHistory.length <= 100);
    });
  });

  describe('reduceThreat', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      gameState = result2.state;
    });

    it('reduces threat by amount', () => {
      const result = reduceThreat(gameState, 'player1', 'enemy1', 30);
      assert.ok(result.reduced);
      assert.strictEqual(result.newThreat, 70);
      assert.strictEqual(result.amountReduced, 30);
    });

    it('fails if enemy has no threat table', () => {
      const result = reduceThreat(gameState, 'player1', 'unknown', 30);
      assert.strictEqual(result.reduced, false);
    });

    it('applies fade reduction type', () => {
      const result = reduceThreat(gameState, 'player1', 'enemy1', 0, { reductionType: 'fade' });
      assert.strictEqual(result.newThreat, 50);
    });

    it('applies feign death reduction', () => {
      const result = reduceThreat(gameState, 'player1', 'enemy1', 0, { reductionType: 'feign_death' });
      assert.strictEqual(result.newThreat, 0);
    });

    it('applies percent reduction', () => {
      const result = reduceThreat(gameState, 'player1', 'enemy1', 0, { percentReduction: 0.25 });
      assert.strictEqual(result.newThreat, 75);
    });

    it('does not reduce below zero', () => {
      const result = reduceThreat(gameState, 'player1', 'enemy1', 200);
      assert.strictEqual(result.newThreat, 0);
    });

    it('handles target with no threat', () => {
      const result = reduceThreat(gameState, 'player2', 'enemy1', 50);
      assert.strictEqual(result.newThreat, 0);
      assert.strictEqual(result.amountReduced, 0);
    });
  });

  describe('applyTaunt', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      gameState = result2.state;
    });

    it('applies taunt with bonus threat', () => {
      const result = applyTaunt(gameState, 'tank1', 'player1', 'enemy1');
      assert.ok(result.applied);
      assert.strictEqual(result.newThreat, 200);
    });

    it('fails if enemy has no threat table', () => {
      const result = applyTaunt(gameState, 'tank1', 'player1', 'unknown');
      assert.strictEqual(result.applied, false);
    });

    it('sets fixate on enemy', () => {
      const result = applyTaunt(gameState, 'tank1', 'player1', 'enemy1', 3000);
      assert.ok(result.state.threat.fixatedTargets.enemy1);
      assert.strictEqual(result.state.threat.fixatedTargets.enemy1.targetId, 'tank1');
    });

    it('sets taunt effect on taunter', () => {
      const result = applyTaunt(gameState, 'tank1', 'player1', 'enemy1');
      assert.ok(result.state.threat.tauntEffects.tank1);
      assert.strictEqual(result.state.threat.tauntEffects.tank1.enemyId, 'enemy1');
    });

    it('returns duration', () => {
      const result = applyTaunt(gameState, 'tank1', 'player1', 'enemy1', 7000);
      assert.strictEqual(result.duration, 7000);
    });
  });

  describe('getThreatTarget', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      gameState = result1.state;
    });

    it('returns null when no threat', () => {
      const result = getThreatTarget(gameState, 'enemy1');
      assert.strictEqual(result.targetId, null);
      assert.strictEqual(result.reason, 'no_threat');
    });

    it('returns highest threat target', () => {
      const result1 = generateThreat(gameState, 'player1', 'enemy1', 50);
      const result2 = generateThreat(result1.state, 'player2', 'enemy1', 100);
      const target = getThreatTarget(result2.state, 'enemy1');
      assert.strictEqual(target.targetId, 'player2');
      assert.strictEqual(target.reason, 'threat');
    });

    it('returns fixated target if active', () => {
      const result1 = generateThreat(gameState, 'player1', 'enemy1', 100);
      const result2 = applyTaunt(result1.state, 'tank1', 'player1', 'enemy1', 10000);
      const target = getThreatTarget(result2.state, 'enemy1');
      assert.strictEqual(target.targetId, 'tank1');
      assert.strictEqual(target.reason, 'fixate');
    });
  });

  describe('updateEnemyTarget', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      gameState = result2.state;
    });

    it('updates current target', () => {
      const result = updateEnemyTarget(gameState, 'enemy1');
      assert.strictEqual(result.targetId, 'player1');
      assert.strictEqual(result.state.threat.currentTargets.enemy1, 'player1');
    });

    it('sets attacking aggro state', () => {
      const result = updateEnemyTarget(gameState, 'enemy1');
      assert.strictEqual(result.state.threat.aggroStates.enemy1, 'attacking');
    });

    it('returns previous target', () => {
      const result1 = updateEnemyTarget(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player2', 'enemy1', 200);
      const result3 = updateEnemyTarget(result2.state, 'enemy1');
      assert.strictEqual(result3.previousTarget, 'player1');
    });
  });

  describe('setPlayerStance', () => {
    it('sets defensive stance', () => {
      const result = setPlayerStance(gameState, 'player1', 'defensive');
      assert.ok(result.set);
      assert.strictEqual(result.stance.threatMod, 1.5);
    });

    it('sets aggressive stance', () => {
      const result = setPlayerStance(gameState, 'player1', 'aggressive');
      assert.ok(result.set);
      assert.strictEqual(result.stance.threatMod, 1.2);
    });

    it('fails with invalid stance', () => {
      const result = setPlayerStance(gameState, 'player1', 'invalid');
      assert.strictEqual(result.set, false);
      assert.ok(result.error);
    });

    it('persists stance in state', () => {
      const result = setPlayerStance(gameState, 'player1', 'defensive');
      assert.strictEqual(result.state.threat.playerStances.player1, 'defensive');
    });
  });

  describe('setThreatModifier', () => {
    it('sets global threat modifier', () => {
      const result = setThreatModifier(gameState, 'player1', 1.5);
      assert.ok(result.set);
      assert.strictEqual(result.state.threat.threatModifiers.player1, 1.5);
    });

    it('can set modifier below 1.0', () => {
      const result = setThreatModifier(gameState, 'player1', 0.5);
      assert.strictEqual(result.state.threat.threatModifiers.player1, 0.5);
    });
  });

  describe('getThreatTable', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      const result3 = generateThreat(result2.state, 'player2', 'enemy1', 50);
      gameState = result3.state;
    });

    it('returns sorted threat table', () => {
      const table = getThreatTable(gameState, 'enemy1');
      assert.strictEqual(table.length, 2);
      assert.strictEqual(table[0].targetId, 'player1');
      assert.strictEqual(table[0].threat, 100);
    });

    it('returns empty array for unknown enemy', () => {
      const table = getThreatTable(gameState, 'unknown');
      assert.deepStrictEqual(table, []);
    });
  });

  describe('getTargetThreat', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      gameState = result2.state;
    });

    it('returns threat value', () => {
      const threat = getTargetThreat(gameState, 'player1', 'enemy1');
      assert.strictEqual(threat, 100);
    });

    it('returns 0 for unknown target', () => {
      const threat = getTargetThreat(gameState, 'unknown', 'enemy1');
      assert.strictEqual(threat, 0);
    });

    it('returns 0 for unknown enemy', () => {
      const threat = getTargetThreat(gameState, 'player1', 'unknown');
      assert.strictEqual(threat, 0);
    });
  });

  describe('clearTargetThreat', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = initEnemyThreatTable(result1.state, 'enemy2');
      const result3 = generateThreat(result2.state, 'player1', 'enemy1', 100);
      const result4 = generateThreat(result3.state, 'player1', 'enemy2', 50);
      gameState = result4.state;
    });

    it('clears threat from specific enemy', () => {
      const result = clearTargetThreat(gameState, 'player1', 'enemy1');
      assert.ok(result.cleared);
      assert.strictEqual(getTargetThreat(result.state, 'player1', 'enemy1'), 0);
      assert.strictEqual(getTargetThreat(result.state, 'player1', 'enemy2'), 50);
    });

    it('clears threat from all enemies', () => {
      const result = clearTargetThreat(gameState, 'player1');
      assert.ok(result.cleared);
      assert.strictEqual(getTargetThreat(result.state, 'player1', 'enemy1'), 0);
      assert.strictEqual(getTargetThreat(result.state, 'player1', 'enemy2'), 0);
    });
  });

  describe('resetEnemyThreat', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      const result3 = updateEnemyTarget(result2.state, 'enemy1');
      gameState = result3.state;
    });

    it('resets threat table', () => {
      const result = resetEnemyThreat(gameState, 'enemy1');
      assert.ok(result.reset);
      assert.deepStrictEqual(result.state.threat.threatTables.enemy1, {});
    });

    it('resets current target', () => {
      const result = resetEnemyThreat(gameState, 'enemy1');
      assert.strictEqual(result.state.threat.currentTargets.enemy1, null);
    });

    it('resets aggro state to idle', () => {
      const result = resetEnemyThreat(gameState, 'enemy1');
      assert.strictEqual(result.state.threat.aggroStates.enemy1, 'idle');
    });
  });

  describe('cleanupExpiredEffects', () => {
    it('removes expired taunt effects', async () => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = applyTaunt(result1.state, 'tank1', 'player1', 'enemy1', 1);
      await new Promise(r => setTimeout(r, 10));
      const result3 = cleanupExpiredEffects(result2.state);
      assert.ok(result3.cleaned > 0);
      assert.strictEqual(Object.keys(result3.state.threat.tauntEffects).length, 0);
    });

    it('keeps active effects', () => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = applyTaunt(result1.state, 'tank1', 'player1', 'enemy1', 60000);
      const result3 = cleanupExpiredEffects(result2.state);
      assert.strictEqual(result3.cleaned, 0);
      assert.ok(result3.state.threat.tauntEffects.tank1);
    });
  });

  describe('getAggroState', () => {
    it('returns idle state by default', () => {
      const result = initEnemyThreatTable(gameState, 'enemy1');
      const aggro = getAggroState(result.state, 'enemy1');
      assert.strictEqual(aggro.id, 'idle');
    });

    it('returns engaged state after threat', () => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      const aggro = getAggroState(result2.state, 'enemy1');
      assert.strictEqual(aggro.id, 'engaged');
    });

    it('returns attacking state after target update', () => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      const result3 = updateEnemyTarget(result2.state, 'enemy1');
      const aggro = getAggroState(result3.state, 'enemy1');
      assert.strictEqual(aggro.id, 'attacking');
    });
  });

  describe('setAggroState', () => {
    beforeEach(() => {
      const result = initEnemyThreatTable(gameState, 'enemy1');
      gameState = result.state;
    });

    it('sets aggro state to returning', () => {
      const result = setAggroState(gameState, 'enemy1', 'returning');
      assert.ok(result.set);
      assert.strictEqual(result.aggroState.id, 'returning');
    });

    it('fails with invalid aggro state', () => {
      const result = setAggroState(gameState, 'enemy1', 'invalid');
      assert.strictEqual(result.set, false);
      assert.ok(result.error);
    });
  });

  describe('getThreatStats', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = initEnemyThreatTable(result1.state, 'enemy2');
      const result3 = generateThreat(result2.state, 'player1', 'enemy1', 100);
      const result4 = generateThreat(result3.state, 'player2', 'enemy1', 50);
      gameState = result4.state;
    });

    it('returns enemy count', () => {
      const stats = getThreatStats(gameState);
      assert.strictEqual(stats.enemyCount, 2);
    });

    it('returns active enemy count', () => {
      const stats = getThreatStats(gameState);
      assert.strictEqual(stats.activeEnemies, 1);
    });

    it('returns total threats per target', () => {
      const stats = getThreatStats(gameState);
      assert.strictEqual(stats.totalThreats.player1, 100);
      assert.strictEqual(stats.totalThreats.player2, 50);
    });

    it('returns top threats', () => {
      const stats = getThreatStats(gameState);
      assert.strictEqual(stats.topThreats.length, 2);
      assert.strictEqual(stats.topThreats[0].targetId, 'player1');
    });

    it('returns recent history', () => {
      const stats = getThreatStats(gameState);
      assert.strictEqual(stats.recentHistory.length, 2);
    });
  });

  describe('threatFromDamage', () => {
    it('calculates base threat', () => {
      const threat = threatFromDamage(100);
      assert.strictEqual(threat, 100);
    });

    it('applies critical hit bonus', () => {
      const threat = threatFromDamage(100, { isCritical: true });
      assert.strictEqual(threat, 150);
    });

    it('applies DoT reduction', () => {
      const threat = threatFromDamage(100, { isDoT: true });
      assert.strictEqual(threat, 50);
    });

    it('applies stance modifier', () => {
      const threat = threatFromDamage(100, { stanceMod: 1.5 });
      assert.strictEqual(threat, 150);
    });

    it('combines all modifiers', () => {
      const threat = threatFromDamage(100, { isCritical: true, stanceMod: 1.5 });
      assert.strictEqual(threat, 225);
    });
  });

  describe('threatFromHealing', () => {
    it('calculates base threat', () => {
      const threat = threatFromHealing(100);
      assert.strictEqual(threat, 100);
    });

    it('applies self heal reduction', () => {
      const threat = threatFromHealing(100, { isSelfHeal: true });
      assert.strictEqual(threat, 50);
    });

    it('handles overheal', () => {
      const threat = threatFromHealing(100, { overhealAmount: 30 });
      assert.strictEqual(threat, 77); // 70 + 7.5 rounded
    });
  });

  describe('hasAggro', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      gameState = result2.state;
    });

    it('returns true when target has aggro', () => {
      const result = hasAggro(gameState, 'player1', 'enemy1');
      assert.strictEqual(result, true);
    });

    it('returns false when target does not have aggro', () => {
      const result = hasAggro(gameState, 'player2', 'enemy1');
      assert.strictEqual(result, false);
    });
  });

  describe('getEnemiesTargeting', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = initEnemyThreatTable(result1.state, 'enemy2');
      const result3 = generateThreat(result2.state, 'player1', 'enemy1', 100);
      const result4 = generateThreat(result3.state, 'player1', 'enemy2', 50);
      const result5 = updateEnemyTarget(result4.state, 'enemy1');
      const result6 = updateEnemyTarget(result5.state, 'enemy2');
      gameState = result6.state;
    });

    it('returns all enemies targeting player', () => {
      const enemies = getEnemiesTargeting(gameState, 'player1');
      assert.strictEqual(enemies.length, 2);
      assert.ok(enemies.includes('enemy1'));
      assert.ok(enemies.includes('enemy2'));
    });

    it('returns empty array if no enemies targeting', () => {
      const enemies = getEnemiesTargeting(gameState, 'player2');
      assert.deepStrictEqual(enemies, []);
    });
  });

  describe('removeEnemy', () => {
    beforeEach(() => {
      const result1 = initEnemyThreatTable(gameState, 'enemy1');
      const result2 = generateThreat(result1.state, 'player1', 'enemy1', 100);
      const result3 = updateEnemyTarget(result2.state, 'enemy1');
      gameState = result3.state;
    });

    it('removes enemy from threat system', () => {
      const result = removeEnemy(gameState, 'enemy1');
      assert.ok(result.removed);
      assert.strictEqual(result.state.threat.threatTables.enemy1, undefined);
    });

    it('removes enemy aggro state', () => {
      const result = removeEnemy(gameState, 'enemy1');
      assert.strictEqual(result.state.threat.aggroStates.enemy1, undefined);
    });

    it('removes enemy current target', () => {
      const result = removeEnemy(gameState, 'enemy1');
      assert.strictEqual(result.state.threat.currentTargets.enemy1, undefined);
    });
  });
});
