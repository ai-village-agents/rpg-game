/**
 * Party System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PARTY_ROLES,
  FORMATIONS,
  SYNERGIES,
  createPartyState,
  createPartyMember,
  addPartyMember,
  removePartyMember,
  setPartyLeader,
  assignRole,
  setFormation,
  getFormationBonuses,
  assignPosition,
  swapPositions,
  calculateSynergies,
  getSynergyBonuses,
  getPartyStats,
  updateMemberStats,
  healParty,
  applyPartyBuff,
  removePartyBuff,
  cleanExpiredBuffs,
  getPartyBuffs,
  updatePartySettings,
  getPartySettings,
  recordBattleResult,
  getMembersByRole,
  hasRole,
  isPartyReady,
  getPartyMember,
  getPartyLeader,
  disbandParty,
  getPartySummary,
  autoAssignRoles,
  getRoleInfo,
  getFormationInfo
} from '../src/party-system.js';

describe('Party System', () => {
  describe('Constants', () => {
    it('should have 5 party roles', () => {
      assert.strictEqual(Object.keys(PARTY_ROLES).length, 5);
      assert.ok(PARTY_ROLES.TANK.name === 'Tank');
      assert.ok(PARTY_ROLES.HEALER.name === 'Healer');
    });

    it('should have 6 formations', () => {
      assert.strictEqual(Object.keys(FORMATIONS).length, 6);
      assert.ok(FORMATIONS.STANDARD.name === 'Standard');
    });

    it('should have 4 synergies', () => {
      assert.strictEqual(Object.keys(SYNERGIES).length, 4);
    });
  });

  describe('createPartyState', () => {
    it('should create empty party state', () => {
      const state = createPartyState();
      assert.deepStrictEqual(state.members, []);
      assert.strictEqual(state.maxSize, 4);
      assert.strictEqual(state.formation, 'STANDARD');
      assert.strictEqual(state.leader, null);
    });

    it('should accept custom max size', () => {
      const state = createPartyState(6);
      assert.strictEqual(state.maxSize, 6);
    });

    it('should initialize empty buffs and synergies', () => {
      const state = createPartyState();
      assert.deepStrictEqual(state.activeSynergies, []);
      assert.deepStrictEqual(state.partyBuffs, []);
    });
  });

  describe('createPartyMember', () => {
    it('should create member with basic info', () => {
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      assert.strictEqual(member.id, 'hero_001');
      assert.strictEqual(member.name, 'Hero');
      assert.strictEqual(member.classType, 'Warrior');
      assert.strictEqual(member.level, 10);
    });

    it('should have default stats', () => {
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 1);
      assert.strictEqual(member.stats.hp, 100);
      assert.strictEqual(member.stats.maxHp, 100);
      assert.strictEqual(member.stats.attack, 10);
    });

    it('should accept custom stats', () => {
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10, {
        hp: 200,
        maxHp: 200,
        attack: 25
      });
      assert.strictEqual(member.stats.hp, 200);
      assert.strictEqual(member.stats.attack, 25);
    });
  });

  describe('addPartyMember', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
    });

    it('should add member successfully', () => {
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      const result = addPartyMember(state, member);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.state.members.length, 1);
    });

    it('should set first member as leader', () => {
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      const result = addPartyMember(state, member);

      assert.strictEqual(result.state.leader, 'hero_001');
    });

    it('should reject invalid member', () => {
      const result = addPartyMember(state, null);
      assert.strictEqual(result.success, false);
    });

    it('should reject when party is full', () => {
      for (let i = 0; i < 4; i++) {
        const member = createPartyMember(`hero_${i}`, `Hero ${i}`, 'Warrior', 10);
        state = addPartyMember(state, member).state;
      }

      const member = createPartyMember('hero_5', 'Hero 5', 'Warrior', 10);
      const result = addPartyMember(state, member);

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('full'));
    });

    it('should reject duplicate member', () => {
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const result = addPartyMember(state, member);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('already'));
    });
  });

  describe('removePartyMember', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;
    });

    it('should remove member successfully', () => {
      const result = removePartyMember(state, 'hero_001');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.state.members.length, 1);
    });

    it('should return removed member', () => {
      const result = removePartyMember(state, 'hero_001');
      assert.strictEqual(result.removedMember.id, 'hero_001');
    });

    it('should update leader when removing leader', () => {
      const result = removePartyMember(state, 'hero_001');
      assert.strictEqual(result.state.leader, 'hero_002');
    });

    it('should set leader to null when empty', () => {
      let result = removePartyMember(state, 'hero_001');
      result = removePartyMember(result.state, 'hero_002');
      assert.strictEqual(result.state.leader, null);
    });

    it('should reject non-existent member', () => {
      const result = removePartyMember(state, 'invalid_id');
      assert.strictEqual(result.success, false);
    });
  });

  describe('setPartyLeader', () => {
    it('should set new leader', () => {
      let state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;

      const result = setPartyLeader(state, 'hero_002');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.state.leader, 'hero_002');
    });

    it('should reject non-member as leader', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const result = setPartyLeader(state, 'invalid_id');
      assert.strictEqual(result.success, false);
    });
  });

  describe('assignRole', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;
    });

    it('should assign role successfully', () => {
      const result = assignRole(state, 'hero_001', 'TANK');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.state.members[0].role, 'TANK');
    });

    it('should be case insensitive', () => {
      const result = assignRole(state, 'hero_001', 'tank');
      assert.strictEqual(result.state.members[0].role, 'TANK');
    });

    it('should reject invalid role', () => {
      const result = assignRole(state, 'hero_001', 'INVALID');
      assert.strictEqual(result.success, false);
    });

    it('should reject non-member', () => {
      const result = assignRole(state, 'invalid_id', 'TANK');
      assert.strictEqual(result.success, false);
    });
  });

  describe('setFormation', () => {
    it('should set formation successfully', () => {
      const state = createPartyState();
      const result = setFormation(state, 'AGGRESSIVE');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.state.formation, 'AGGRESSIVE');
    });

    it('should be case insensitive', () => {
      const state = createPartyState();
      const result = setFormation(state, 'defensive');

      assert.strictEqual(result.state.formation, 'DEFENSIVE');
    });

    it('should reject invalid formation', () => {
      const state = createPartyState();
      const result = setFormation(state, 'INVALID');

      assert.strictEqual(result.success, false);
    });
  });

  describe('getFormationBonuses', () => {
    it('should return formation bonuses', () => {
      const state = createPartyState();
      const bonuses = getFormationBonuses(state);

      assert.ok('defense' in bonuses);
      assert.ok('attack' in bonuses);
    });

    it('should return correct bonuses for aggressive', () => {
      let state = createPartyState();
      state = setFormation(state, 'AGGRESSIVE').state;

      const bonuses = getFormationBonuses(state);
      assert.strictEqual(bonuses.attack, 0.15);
      assert.strictEqual(bonuses.defense, -0.10);
    });
  });

  describe('Position Management', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;
    });

    describe('assignPosition', () => {
      it('should assign position successfully', () => {
        const result = assignPosition(state, 'hero_001', 0, 1);
        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(result.state.members[0].position, { row: 0, col: 1 });
      });

      it('should reject occupied position', () => {
        state = assignPosition(state, 'hero_001', 0, 1).state;
        const result = assignPosition(state, 'hero_002', 0, 1);

        assert.strictEqual(result.success, false);
        assert.ok(result.error.includes('occupied'));
      });

      it('should reject non-member', () => {
        const result = assignPosition(state, 'invalid_id', 0, 0);
        assert.strictEqual(result.success, false);
      });
    });

    describe('swapPositions', () => {
      it('should swap positions successfully', () => {
        state = assignPosition(state, 'hero_001', 0, 1).state;
        state = assignPosition(state, 'hero_002', 1, 1).state;

        const result = swapPositions(state, 'hero_001', 'hero_002');
        assert.strictEqual(result.success, true);

        const hero1 = result.state.members.find(m => m.id === 'hero_001');
        const hero2 = result.state.members.find(m => m.id === 'hero_002');

        assert.deepStrictEqual(hero1.position, { row: 1, col: 1 });
        assert.deepStrictEqual(hero2.position, { row: 0, col: 1 });
      });

      it('should reject non-member', () => {
        const result = swapPositions(state, 'hero_001', 'invalid_id');
        assert.strictEqual(result.success, false);
      });
    });
  });

  describe('Synergies', () => {
    describe('calculateSynergies', () => {
      it('should detect full party synergy', () => {
        let state = createPartyState(2);
        const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
        const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
        state = addPartyMember(state, member1).state;
        state = addPartyMember(state, member2).state;

        const synergies = calculateSynergies(state);
        assert.ok(synergies.includes('FULL_PARTY'));
      });

      it('should detect class diversity', () => {
        let state = createPartyState();
        const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
        const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
        state = addPartyMember(state, member1).state;
        state = addPartyMember(state, member2).state;

        const synergies = calculateSynergies(state);
        assert.ok(synergies.includes('CLASS_DIVERSITY'));
      });

      it('should detect same element synergy', () => {
        let state = createPartyState();
        const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10, { element: 'fire' });
        const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10, { element: 'fire' });
        state = addPartyMember(state, member1).state;
        state = addPartyMember(state, member2).state;

        const synergies = calculateSynergies(state);
        assert.ok(synergies.includes('SAME_ELEMENT'));
      });
    });

    describe('getSynergyBonuses', () => {
      it('should return synergy bonuses', () => {
        let state = createPartyState(2);
        const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
        const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
        state = addPartyMember(state, member1).state;
        state = addPartyMember(state, member2).state;

        const bonuses = getSynergyBonuses(state);
        assert.ok(Object.keys(bonuses).length > 0);
      });
    });
  });

  describe('getPartyStats', () => {
    it('should calculate party stats', () => {
      let state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10, { attack: 20 });
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 12, { attack: 15 });
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;

      const stats = getPartyStats(state);
      assert.strictEqual(stats.memberCount, 2);
      assert.strictEqual(stats.avgLevel, 11);
      assert.strictEqual(stats.avgAttack, 18); // (20 + 15) / 2 rounded
    });

    it('should return zeros for empty party', () => {
      const state = createPartyState();
      const stats = getPartyStats(state);

      assert.strictEqual(stats.memberCount, 0);
      assert.strictEqual(stats.avgLevel, 0);
    });
  });

  describe('updateMemberStats', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;
    });

    it('should update stats', () => {
      const result = updateMemberStats(state, 'hero_001', { hp: -20 });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.state.members[0].stats.hp, 80);
    });

    it('should not go below 0', () => {
      const result = updateMemberStats(state, 'hero_001', { hp: -200 });
      assert.strictEqual(result.state.members[0].stats.hp, 0);
    });

    it('should cap HP at max', () => {
      let result = updateMemberStats(state, 'hero_001', { hp: -50 });
      result = updateMemberStats(result.state, 'hero_001', { hp: 200 });
      assert.strictEqual(result.state.members[0].stats.hp, 100);
    });

    it('should reject non-member', () => {
      const result = updateMemberStats(state, 'invalid_id', { hp: -10 });
      assert.strictEqual(result.success, false);
    });
  });

  describe('healParty', () => {
    it('should heal all members', () => {
      let state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10, { hp: 50, maxHp: 100 });
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10, { hp: 30, maxHp: 100 });
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;

      state = healParty(state, 25);

      assert.strictEqual(state.members[0].stats.hp, 75);
      assert.strictEqual(state.members[1].stats.hp, 55);
    });

    it('should not exceed max HP', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10, { hp: 90, maxHp: 100 });
      state = addPartyMember(state, member).state;

      state = healParty(state, 50);

      assert.strictEqual(state.members[0].stats.hp, 100);
    });
  });

  describe('Party Buffs', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
    });

    describe('applyPartyBuff', () => {
      it('should apply buff successfully', () => {
        const buff = { id: 'buff_001', name: 'Power Up', effect: { attack: 0.1 }, duration: 60000 };
        const result = applyPartyBuff(state, buff);

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.state.partyBuffs.length, 1);
      });

      it('should reject invalid buff', () => {
        const result = applyPartyBuff(state, null);
        assert.strictEqual(result.success, false);
      });

      it('should reject duplicate buff', () => {
        const buff = { id: 'buff_001', name: 'Power Up' };
        state = applyPartyBuff(state, buff).state;

        const result = applyPartyBuff(state, buff);
        assert.strictEqual(result.success, false);
      });
    });

    describe('removePartyBuff', () => {
      it('should remove buff successfully', () => {
        const buff = { id: 'buff_001', name: 'Power Up' };
        state = applyPartyBuff(state, buff).state;

        const result = removePartyBuff(state, 'buff_001');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.state.partyBuffs.length, 0);
      });

      it('should reject non-existent buff', () => {
        const result = removePartyBuff(state, 'invalid_id');
        assert.strictEqual(result.success, false);
      });
    });

    describe('cleanExpiredBuffs', () => {
      it('should remove expired buffs', () => {
        const buff = { id: 'buff_001', name: 'Power Up' };
        state = applyPartyBuff(state, buff).state;
        state.partyBuffs[0].expiresAt = Date.now() - 1000;

        const result = cleanExpiredBuffs(state);
        assert.strictEqual(result.changed, true);
        assert.strictEqual(result.state.partyBuffs.length, 0);
      });

      it('should keep active buffs', () => {
        const buff = { id: 'buff_001', name: 'Power Up', duration: 60000 };
        state = applyPartyBuff(state, buff).state;

        const result = cleanExpiredBuffs(state);
        assert.strictEqual(result.changed, false);
        assert.strictEqual(result.state.partyBuffs.length, 1);
      });
    });

    describe('getPartyBuffs', () => {
      it('should return active buffs', () => {
        const buff = { id: 'buff_001', name: 'Power Up', duration: 60000 };
        state = applyPartyBuff(state, buff).state;

        const buffs = getPartyBuffs(state);
        assert.strictEqual(buffs.length, 1);
        assert.ok(buffs[0].remainingTime > 0);
      });
    });
  });

  describe('Party Settings', () => {
    it('should update settings', () => {
      let state = createPartyState();
      state = updatePartySettings(state, { autoLoot: 'roundRobin' });

      assert.strictEqual(state.settings.autoLoot, 'roundRobin');
    });

    it('should get settings', () => {
      const state = createPartyState();
      const settings = getPartySettings(state);

      assert.ok('autoLoot' in settings);
      assert.ok('xpShare' in settings);
    });
  });

  describe('recordBattleResult', () => {
    it('should record win', () => {
      let state = createPartyState();
      state = recordBattleResult(state, true, 1000, 500);

      assert.strictEqual(state.stats.battlesWon, 1);
      assert.strictEqual(state.stats.totalDamageDealt, 1000);
    });

    it('should record loss', () => {
      let state = createPartyState();
      state = recordBattleResult(state, false);

      assert.strictEqual(state.stats.battlesLost, 1);
    });
  });

  describe('Role Queries', () => {
    let state;

    beforeEach(() => {
      state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;
      state = assignRole(state, 'hero_001', 'TANK').state;
      state = assignRole(state, 'hero_002', 'HEALER').state;
    });

    describe('getMembersByRole', () => {
      it('should get members by role', () => {
        const tanks = getMembersByRole(state, 'TANK');
        assert.strictEqual(tanks.length, 1);
        assert.strictEqual(tanks[0].id, 'hero_001');
      });

      it('should return empty for missing role', () => {
        const dps = getMembersByRole(state, 'DPS');
        assert.strictEqual(dps.length, 0);
      });
    });

    describe('hasRole', () => {
      it('should detect existing role', () => {
        assert.strictEqual(hasRole(state, 'TANK'), true);
        assert.strictEqual(hasRole(state, 'HEALER'), true);
      });

      it('should not detect missing role', () => {
        assert.strictEqual(hasRole(state, 'DPS'), false);
      });
    });
  });

  describe('isPartyReady', () => {
    it('should return not ready for empty party', () => {
      const state = createPartyState();
      const ready = isPartyReady(state);

      assert.strictEqual(ready.ready, false);
      assert.ok(ready.reason.includes('empty'));
    });

    it('should return ready with members', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const ready = isPartyReady(state);
      assert.strictEqual(ready.ready, true);
    });

    it('should warn about missing healer', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;
      state = assignRole(state, 'hero_001', 'TANK').state;

      const ready = isPartyReady(state);
      assert.ok(ready.warnings.some(w => w.includes('healer')));
    });
  });

  describe('getPartyMember', () => {
    it('should get member by ID', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const found = getPartyMember(state, 'hero_001');
      assert.strictEqual(found.id, 'hero_001');
    });

    it('should return null for non-member', () => {
      const state = createPartyState();
      const found = getPartyMember(state, 'invalid_id');
      assert.strictEqual(found, null);
    });
  });

  describe('getPartyLeader', () => {
    it('should get leader', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const leader = getPartyLeader(state);
      assert.strictEqual(leader.id, 'hero_001');
    });

    it('should return null with no leader', () => {
      const state = createPartyState();
      const leader = getPartyLeader(state);
      assert.strictEqual(leader, null);
    });
  });

  describe('disbandParty', () => {
    it('should disband party', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const result = disbandParty(state);
      assert.strictEqual(result.members.length, 1);
      assert.strictEqual(result.state.members.length, 0);
    });
  });

  describe('getPartySummary', () => {
    it('should return complete summary', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10);
      state = addPartyMember(state, member).state;

      const summary = getPartySummary(state);
      assert.strictEqual(summary.memberCount, 1);
      assert.strictEqual(summary.maxSize, 4);
      assert.ok(summary.formationName);
      assert.ok(summary.isReady);
    });
  });

  describe('autoAssignRoles', () => {
    it('should auto-assign roles', () => {
      let state = createPartyState();
      const warrior = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
      const priest = createPartyMember('hero_002', 'Hero 2', 'Priest', 10);
      state = addPartyMember(state, warrior).state;
      state = addPartyMember(state, priest).state;

      state = autoAssignRoles(state);

      assert.strictEqual(state.members[0].role, 'TANK');
      assert.strictEqual(state.members[1].role, 'HEALER');
    });

    it('should use FLEX for unknown classes', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'UnknownClass', 10);
      state = addPartyMember(state, member).state;

      state = autoAssignRoles(state);

      assert.strictEqual(state.members[0].role, 'FLEX');
    });
  });

  describe('Info Functions', () => {
    describe('getRoleInfo', () => {
      it('should return role info', () => {
        const info = getRoleInfo('TANK');
        assert.strictEqual(info.name, 'Tank');
        assert.ok(info.icon);
      });

      it('should be case insensitive', () => {
        const info = getRoleInfo('tank');
        assert.strictEqual(info.name, 'Tank');
      });

      it('should return null for invalid role', () => {
        const info = getRoleInfo('INVALID');
        assert.strictEqual(info, null);
      });
    });

    describe('getFormationInfo', () => {
      it('should return formation info', () => {
        const info = getFormationInfo('AGGRESSIVE');
        assert.strictEqual(info.name, 'Aggressive');
        assert.ok(info.bonuses);
      });

      it('should return null for invalid formation', () => {
        const info = getFormationInfo('INVALID');
        assert.strictEqual(info, null);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle party with all dead members', () => {
      let state = createPartyState();
      const member = createPartyMember('hero_001', 'Hero', 'Warrior', 10, { hp: 0, maxHp: 100 });
      state = addPartyMember(state, member).state;

      const ready = isPartyReady(state);
      assert.strictEqual(ready.ready, false);
      assert.ok(ready.reason.includes('down'));
    });

    it('should maintain synergies after member removal', () => {
      let state = createPartyState();
      const member1 = createPartyMember('hero_001', 'Hero 1', 'Warrior', 10);
      const member2 = createPartyMember('hero_002', 'Hero 2', 'Mage', 10);
      state = addPartyMember(state, member1).state;
      state = addPartyMember(state, member2).state;

      // Check synergies are calculated
      assert.ok(state.activeSynergies.length > 0);

      // Remove member
      state = removePartyMember(state, 'hero_002').state;

      // Synergies should be recalculated
      assert.ok(Array.isArray(state.activeSynergies));
    });
  });
});
