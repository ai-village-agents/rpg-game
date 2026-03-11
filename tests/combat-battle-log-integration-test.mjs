/**
 * Tests for Combat Battle Log Integration
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  initCombatBattleLog,
  logPlayerAttack,
  logPlayerAbility,
  logDamageDealt,
  logDamageReceived,
  logHealing,
  logItemUsed,
  logStatusApplied,
  logStatusExpired,
  logTurnStart,
  logTurnEnd,
  logVictory,
  logDefeat,
  getBattleLogEntries,
  getBattleSummary,
} from '../src/combat-battle-log-integration.js';
import { battleLog } from '../src/battle-log.js';

describe('Combat Battle Log Integration', () => {
  beforeEach(() => {
    battleLog.clear();
  });

  describe('initCombatBattleLog', () => {
    it('clears log and starts turn 1', () => {
      battleLog.addEntry('attack', 'old entry', {});
      const entry = initCombatBattleLog();
      assert.strictEqual(getBattleLogEntries().length, 1);
      assert.strictEqual(entry.type, 'turn-start');
      assert.strictEqual(entry.details.turn, 1);
      assert.strictEqual(entry.details.isPlayerTurn, true);
    });
  });

  describe('logPlayerAttack', () => {
    it('logs attack with damage and enemy name', () => {
      const entry = logPlayerAttack(25, 'Goblin');
      assert.strictEqual(entry.type, 'attack');
      assert.strictEqual(entry.message, 'You strike Goblin for 25 damage.');
      assert.strictEqual(entry.details.damage, 25);
      assert.strictEqual(entry.details.target, 'Goblin');
      assert.strictEqual(entry.details.source, 'player');
    });

    it('uses default enemy name when not provided', () => {
      const entry = logPlayerAttack(10);
      assert.strictEqual(entry.message, 'You strike Enemy for 10 damage.');
    });
  });

  describe('logPlayerAbility', () => {
    it('logs ability with all parameters', () => {
      const entry = logPlayerAbility('Fireball', 50, 'fire', 'Dragon');
      assert.strictEqual(entry.type, 'ability');
      assert.strictEqual(entry.message, 'You use Fireball (fire) on Dragon for 50 damage.');
      assert.strictEqual(entry.details.ability, 'Fireball');
      assert.strictEqual(entry.details.damage, 50);
      assert.strictEqual(entry.details.element, 'fire');
      assert.strictEqual(entry.details.target, 'Dragon');
    });

    it('omits element when not provided', () => {
      const entry = logPlayerAbility('Slash', 30, null, 'Slime');
      assert.strictEqual(entry.message, 'You use Slash on Slime for 30 damage.');
      assert.strictEqual(entry.details.element, null);
    });
  });

  describe('logDamageDealt', () => {
    it('logs damage dealt with source', () => {
      const entry = logDamageDealt(40, 'Orc', 'sword');
      assert.strictEqual(entry.type, 'damage-dealt');
      assert.strictEqual(entry.message, 'Dealt 40 damage to Orc with sword.');
      assert.strictEqual(entry.details.amount, 40);
    });

    it('works without source', () => {
      const entry = logDamageDealt(20, 'Wolf');
      assert.strictEqual(entry.message, 'Dealt 20 damage to Wolf.');
    });
  });

  describe('logDamageReceived', () => {
    it('logs damage received from source', () => {
      const entry = logDamageReceived(15, 'Goblin Archer');
      assert.strictEqual(entry.type, 'damage-received');
      assert.strictEqual(entry.message, 'You take 15 damage from Goblin Archer.');
      assert.strictEqual(entry.details.amount, 15);
    });

    it('uses default source when not provided', () => {
      const entry = logDamageReceived(10);
      assert.strictEqual(entry.message, 'You take 10 damage from enemy attack.');
    });
  });

  describe('logHealing', () => {
    it('logs healing with source', () => {
      const entry = logHealing(30, 'Potion');
      assert.strictEqual(entry.type, 'heal');
      assert.strictEqual(entry.message, 'Restored 30 HP from Potion.');
      assert.strictEqual(entry.details.amount, 30);
      assert.strictEqual(entry.details.source, 'Potion');
    });
  });

  describe('logItemUsed', () => {
    it('logs item usage with effect', () => {
      const entry = logItemUsed('Hi-Potion', 'restored 50 HP');
      assert.strictEqual(entry.type, 'item-used');
      assert.strictEqual(entry.message, 'Used Hi-Potion: restored 50 HP.');
      assert.strictEqual(entry.details.item, 'Hi-Potion');
      assert.strictEqual(entry.details.effect, 'restored 50 HP');
    });

    it('works without effect description', () => {
      const entry = logItemUsed('Bomb');
      assert.strictEqual(entry.message, 'Used Bomb.');
    });
  });

  describe('logStatusApplied', () => {
    it('logs status with duration', () => {
      const entry = logStatusApplied('Poison', 'Slime', 3);
      assert.strictEqual(entry.type, 'status-applied');
      assert.strictEqual(entry.message, 'Poison applied to Slime for 3 turns.');
      assert.strictEqual(entry.details.status, 'Poison');
      assert.strictEqual(entry.details.duration, 3);
    });

    it('handles zero duration', () => {
      const entry = logStatusApplied('Stun', 'Bat', 0);
      assert.strictEqual(entry.message, 'Stun applied to Bat for 0 turns.');
    });

    it('omits duration when not provided', () => {
      const entry = logStatusApplied('Burn', 'Troll');
      assert.strictEqual(entry.message, 'Burn applied to Troll.');
      assert.strictEqual(entry.details.duration, null);
    });
  });

  describe('logStatusExpired', () => {
    it('logs status expiration', () => {
      const entry = logStatusExpired('Poison', 'Player');
      assert.strictEqual(entry.type, 'status-expired');
      assert.strictEqual(entry.message, 'Poison on Player expired.');
    });
  });

  describe('logTurnStart', () => {
    it('logs player turn start', () => {
      const entry = logTurnStart(2, true);
      assert.strictEqual(entry.type, 'turn-start');
      assert.strictEqual(entry.message, "Player's turn begins (Turn 2).");
      assert.strictEqual(entry.details.turn, 2);
      assert.strictEqual(entry.details.isPlayerTurn, true);
    });

    it('logs enemy turn start', () => {
      const entry = logTurnStart(3, false);
      assert.strictEqual(entry.message, 'Enemy turn begins (Turn 3).');
      assert.strictEqual(entry.details.isPlayerTurn, false);
    });

    it('defaults to player turn when isPlayerTurn not specified', () => {
      const entry = logTurnStart(1);
      assert.strictEqual(entry.details.isPlayerTurn, true);
    });
  });

  describe('logTurnEnd', () => {
    it('logs turn end', () => {
      const entry = logTurnEnd(5);
      assert.strictEqual(entry.type, 'turn-end');
      assert.strictEqual(entry.message, 'Turn 5 ends.');
      assert.strictEqual(entry.details.turn, 5);
    });
  });

  describe('logVictory', () => {
    it('logs victory with rewards', () => {
      const entry = logVictory('Dark Knight', 150, 75);
      assert.strictEqual(entry.type, 'victory');
      assert.strictEqual(entry.message, 'Victory over Dark Knight! Gained 150 XP and 75 gold.');
      assert.strictEqual(entry.details.enemy, 'Dark Knight');
      assert.strictEqual(entry.details.xp, 150);
      assert.strictEqual(entry.details.gold, 75);
    });
  });

  describe('logDefeat', () => {
    it('logs defeat', () => {
      const entry = logDefeat();
      assert.strictEqual(entry.type, 'defeat');
      assert.strictEqual(entry.message, 'Defeat! The party has fallen.');
    });
  });

  describe('getBattleLogEntries', () => {
    it('returns all logged entries', () => {
      logPlayerAttack(10, 'Rat');
      logHealing(5, 'Potion');
      const entries = getBattleLogEntries();
      assert.strictEqual(entries.length, 2);
      assert.strictEqual(entries[0].type, 'attack');
      assert.strictEqual(entries[1].type, 'heal');
    });
  });

  describe('getBattleSummary', () => {
    it('returns combat summary with totals', () => {
      initCombatBattleLog();
      logPlayerAttack(20, 'Slime');
      logDamageReceived(8, 'Slime');
      logHealing(15, 'Potion');
      logVictory('Slime', 10, 5);

      const summary = getBattleSummary();
      assert.strictEqual(summary.totalDamageDealt, 20);
      assert.strictEqual(summary.totalDamageReceived, 8);
      assert.strictEqual(summary.totalHealingDone, 15);
    });
  });
});
