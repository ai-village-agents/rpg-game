import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  initializeStatistics,
  createEmptyStatistics,
  recordDamageDealt,
  recordDamageReceived,
  recordMiss,
  recordHealing,
  recordEnemyDefeated,
  recordGoldEarned,
  recordGoldSpent,
  recordItemFound,
  recordItemCrafted,
  recordConsumableUsed,
  recordQuestCompleted,
  recordRoomVisited,
  recordPerfectVictory,
  recordCloseCall,
  recordCombo,
  recordPlayTime,
  getStatisticsSummary,
  getTopEnemiesDefeated
} from '../src/statistics-dashboard.js';

describe('Statistics Dashboard', () => {
  describe('initializeStatistics', () => {
    it('should initialize statistics on empty state', () => {
      const state = {};
      const result = initializeStatistics(state);
      
      assert.ok(result.statistics);
      assert.strictEqual(result.statistics.combat.totalDamageDealt, 0);
      assert.strictEqual(result.statistics.enemies.totalDefeated, 0);
      assert.strictEqual(result.statistics.economy.goldEarned, 0);
    });
    
    it('should not overwrite existing statistics', () => {
      const state = {
        statistics: {
          combat: { totalDamageDealt: 100 }
        }
      };
      const result = initializeStatistics(state);
      
      assert.strictEqual(result.statistics.combat.totalDamageDealt, 100);
    });
  });
  
  describe('createEmptyStatistics', () => {
    it('should create empty statistics structure', () => {
      const stats = createEmptyStatistics();
      
      assert.strictEqual(stats.combat.totalDamageDealt, 0);
      assert.strictEqual(stats.combat.totalHits, 0);
      assert.strictEqual(stats.combat.highestSingleHit, 0);
      assert.strictEqual(stats.enemies.totalDefeated, 0);
      assert.deepStrictEqual(stats.enemies.defeatedByType, {});
      assert.strictEqual(stats.economy.goldEarned, 0);
      assert.strictEqual(stats.items.totalFound, 0);
      assert.strictEqual(stats.quests.totalCompleted, 0);
    });
  });
  
  describe('recordDamageDealt', () => {
    it('should record damage dealt', () => {
      const state = initializeStatistics({});
      const result = recordDamageDealt(state, 50);
      
      assert.strictEqual(result.statistics.combat.totalDamageDealt, 50);
      assert.strictEqual(result.statistics.combat.totalHits, 1);
      assert.strictEqual(result.statistics.combat.highestSingleHit, 50);
    });
    
    it('should track critical hits', () => {
      const state = initializeStatistics({});
      const result = recordDamageDealt(state, 100, true);
      
      assert.strictEqual(result.statistics.combat.totalCriticalHits, 1);
    });
    
    it('should accumulate damage', () => {
      let state = initializeStatistics({});
      state = recordDamageDealt(state, 50);
      state = recordDamageDealt(state, 75);
      
      assert.strictEqual(state.statistics.combat.totalDamageDealt, 125);
      assert.strictEqual(state.statistics.combat.totalHits, 2);
    });
    
    it('should track highest single hit', () => {
      let state = initializeStatistics({});
      state = recordDamageDealt(state, 50);
      state = recordDamageDealt(state, 100);
      state = recordDamageDealt(state, 75);
      
      assert.strictEqual(state.statistics.combat.highestSingleHit, 100);
    });
  });
  
  describe('recordDamageReceived', () => {
    it('should record damage received', () => {
      const state = initializeStatistics({});
      const result = recordDamageReceived(state, 30);
      
      assert.strictEqual(result.statistics.combat.totalDamageReceived, 30);
    });
    
    it('should accumulate damage received', () => {
      let state = initializeStatistics({});
      state = recordDamageReceived(state, 20);
      state = recordDamageReceived(state, 15);
      
      assert.strictEqual(state.statistics.combat.totalDamageReceived, 35);
    });
  });
  
  describe('recordMiss', () => {
    it('should record missed attacks', () => {
      const state = initializeStatistics({});
      const result = recordMiss(state);
      
      assert.strictEqual(result.statistics.combat.totalMisses, 1);
    });
    
    it('should accumulate misses', () => {
      let state = initializeStatistics({});
      state = recordMiss(state);
      state = recordMiss(state);
      state = recordMiss(state);
      
      assert.strictEqual(state.statistics.combat.totalMisses, 3);
    });
  });
  
  describe('recordHealing', () => {
    it('should record healing done', () => {
      const state = initializeStatistics({});
      const result = recordHealing(state, 50, false);
      
      assert.strictEqual(result.statistics.combat.totalHealingDone, 50);
      assert.strictEqual(result.statistics.combat.totalHealingReceived, 0);
    });
    
    it('should record healing received', () => {
      const state = initializeStatistics({});
      const result = recordHealing(state, 40, true);
      
      assert.strictEqual(result.statistics.combat.totalHealingDone, 0);
      assert.strictEqual(result.statistics.combat.totalHealingReceived, 40);
    });
  });
  
  describe('recordEnemyDefeated', () => {
    it('should record enemy defeat', () => {
      const state = initializeStatistics({});
      const result = recordEnemyDefeated(state, 'goblin');
      
      assert.strictEqual(result.statistics.enemies.totalDefeated, 1);
      assert.strictEqual(result.statistics.enemies.defeatedByType.goblin, 1);
      assert.strictEqual(result.statistics.combat.totalKills, 1);
    });
    
    it('should track boss defeats', () => {
      const state = initializeStatistics({});
      const result = recordEnemyDefeated(state, 'dragon', 'boss');
      
      assert.strictEqual(result.statistics.enemies.bossesDefeated, 1);
    });
    
    it('should track elite defeats', () => {
      const state = initializeStatistics({});
      const result = recordEnemyDefeated(state, 'orc_champion', 'elite');
      
      assert.strictEqual(result.statistics.enemies.elitesDefeated, 1);
    });
    
    it('should track minion defeats', () => {
      const state = initializeStatistics({});
      const result = recordEnemyDefeated(state, 'skeleton', 'minion');
      
      assert.strictEqual(result.statistics.enemies.minionsDefeated, 1);
    });
    
    it('should accumulate same enemy type defeats', () => {
      let state = initializeStatistics({});
      state = recordEnemyDefeated(state, 'goblin');
      state = recordEnemyDefeated(state, 'goblin');
      state = recordEnemyDefeated(state, 'goblin');
      
      assert.strictEqual(state.statistics.enemies.defeatedByType.goblin, 3);
      assert.strictEqual(state.statistics.enemies.totalDefeated, 3);
    });
  });
  
  describe('recordGoldEarned', () => {
    it('should record gold earned', () => {
      const state = initializeStatistics({});
      const result = recordGoldEarned(state, 100);
      
      assert.strictEqual(result.statistics.economy.goldEarned, 100);
    });
    
    it('should track gold from combat', () => {
      const state = initializeStatistics({});
      const result = recordGoldEarned(state, 50, 'combat');
      
      assert.strictEqual(result.statistics.economy.goldFromCombat, 50);
    });
    
    it('should track gold from quests', () => {
      const state = initializeStatistics({});
      const result = recordGoldEarned(state, 200, 'quest');
      
      assert.strictEqual(result.statistics.economy.goldFromQuests, 200);
    });
    
    it('should track gold from selling and largest sale', () => {
      const state = initializeStatistics({});
      const result = recordGoldEarned(state, 75, 'selling');
      
      assert.strictEqual(result.statistics.economy.goldFromSelling, 75);
      assert.strictEqual(result.statistics.economy.largestSale, 75);
    });
  });
  
  describe('recordGoldSpent', () => {
    it('should record gold spent', () => {
      const state = initializeStatistics({});
      const result = recordGoldSpent(state, 50);
      
      assert.strictEqual(result.statistics.economy.goldSpent, 50);
    });
    
    it('should track gold spent on items', () => {
      const state = initializeStatistics({});
      const result = recordGoldSpent(state, 100, 'items');
      
      assert.strictEqual(result.statistics.economy.goldSpentOnItems, 100);
    });
    
    it('should track gold spent on upgrades', () => {
      const state = initializeStatistics({});
      const result = recordGoldSpent(state, 150, 'upgrades');
      
      assert.strictEqual(result.statistics.economy.goldSpentOnUpgrades, 150);
    });
    
    it('should track largest purchase', () => {
      let state = initializeStatistics({});
      state = recordGoldSpent(state, 50);
      state = recordGoldSpent(state, 200);
      state = recordGoldSpent(state, 75);
      
      assert.strictEqual(state.statistics.economy.largestPurchase, 200);
    });
  });
  
  describe('recordItemFound', () => {
    it('should record item found', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state);
      
      assert.strictEqual(result.statistics.items.totalFound, 1);
    });
    
    it('should track weapon found', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state, 'weapon');
      
      assert.strictEqual(result.statistics.items.weaponsFound, 1);
    });
    
    it('should track armor found', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state, 'armor');
      
      assert.strictEqual(result.statistics.items.armorFound, 1);
    });
    
    it('should track accessory found', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state, 'accessory');
      
      assert.strictEqual(result.statistics.items.accessoriesFound, 1);
    });
    
    it('should track legendary items', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state, 'weapon', 'legendary');
      
      assert.strictEqual(result.statistics.items.legendaryItemsFound, 1);
    });
    
    it('should track rare items', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state, 'armor', 'rare');
      
      assert.strictEqual(result.statistics.items.rareItemsFound, 1);
    });
    
    it('should track epic items as rare', () => {
      const state = initializeStatistics({});
      const result = recordItemFound(state, 'weapon', 'epic');
      
      assert.strictEqual(result.statistics.items.rareItemsFound, 1);
    });
  });
  
  describe('recordItemCrafted', () => {
    it('should record item crafted', () => {
      const state = initializeStatistics({});
      const result = recordItemCrafted(state);
      
      assert.strictEqual(result.statistics.items.totalCrafted, 1);
    });
    
    it('should accumulate crafted items', () => {
      let state = initializeStatistics({});
      state = recordItemCrafted(state);
      state = recordItemCrafted(state);
      
      assert.strictEqual(state.statistics.items.totalCrafted, 2);
    });
  });
  
  describe('recordConsumableUsed', () => {
    it('should record consumable used', () => {
      const state = initializeStatistics({});
      const result = recordConsumableUsed(state);
      
      assert.strictEqual(result.statistics.items.totalConsumed, 1);
      assert.strictEqual(result.statistics.items.consumablesUsed, 1);
    });
    
    it('should track potions used', () => {
      const state = initializeStatistics({});
      const result = recordConsumableUsed(state, 'potion');
      
      assert.strictEqual(result.statistics.items.potionsUsed, 1);
    });
    
    it('should track food consumed', () => {
      const state = initializeStatistics({});
      const result = recordConsumableUsed(state, 'food');
      
      assert.strictEqual(result.statistics.items.foodConsumed, 1);
    });
  });
  
  describe('recordQuestCompleted', () => {
    it('should record quest completed', () => {
      const state = initializeStatistics({});
      const result = recordQuestCompleted(state);
      
      assert.strictEqual(result.statistics.quests.totalCompleted, 1);
      assert.strictEqual(result.statistics.quests.sideQuestsCompleted, 1);
    });
    
    it('should track main quests', () => {
      const state = initializeStatistics({});
      const result = recordQuestCompleted(state, 'main');
      
      assert.strictEqual(result.statistics.quests.mainQuestsCompleted, 1);
    });
    
    it('should track daily challenges', () => {
      const state = initializeStatistics({});
      const result = recordQuestCompleted(state, 'daily');
      
      assert.strictEqual(result.statistics.quests.dailyChallengesCompleted, 1);
    });
    
    it('should track bounties', () => {
      const state = initializeStatistics({});
      const result = recordQuestCompleted(state, 'bounty');
      
      assert.strictEqual(result.statistics.quests.bountiesCompleted, 1);
    });
  });
  
  describe('recordRoomVisited', () => {
    it('should record room visited', () => {
      const state = initializeStatistics({});
      const result = recordRoomVisited(state, 'forest_entrance');
      
      assert.strictEqual(result.statistics.exploration.roomsVisited, 1);
    });
    
    it('should track first visits', () => {
      const state = initializeStatistics({});
      const result = recordRoomVisited(state, 'forest_entrance', true);
      
      assert.strictEqual(result.statistics.exploration.uniqueRoomsVisited, 1);
    });
    
    it('should not increase unique visits on repeat', () => {
      let state = initializeStatistics({});
      state = recordRoomVisited(state, 'forest_entrance', true);
      state = recordRoomVisited(state, 'forest_entrance', false);
      
      assert.strictEqual(state.statistics.exploration.roomsVisited, 2);
      assert.strictEqual(state.statistics.exploration.uniqueRoomsVisited, 1);
    });
  });
  
  describe('recordPerfectVictory', () => {
    it('should record perfect victory', () => {
      const state = initializeStatistics({});
      const result = recordPerfectVictory(state);
      
      assert.strictEqual(result.statistics.combat.perfectVictories, 1);
    });
  });
  
  describe('recordCloseCall', () => {
    it('should record close call', () => {
      const state = initializeStatistics({});
      const result = recordCloseCall(state);
      
      assert.strictEqual(result.statistics.combat.closeCalls, 1);
    });
  });
  
  describe('recordCombo', () => {
    it('should record combo', () => {
      const state = initializeStatistics({});
      const result = recordCombo(state, 10);
      
      assert.strictEqual(result.statistics.combat.longestCombo, 10);
    });
    
    it('should track only the longest combo', () => {
      let state = initializeStatistics({});
      state = recordCombo(state, 5);
      state = recordCombo(state, 15);
      state = recordCombo(state, 8);
      
      assert.strictEqual(state.statistics.combat.longestCombo, 15);
    });
  });
  
  describe('recordPlayTime', () => {
    it('should record play time', () => {
      const state = initializeStatistics({});
      const result = recordPlayTime(state, 60);
      
      assert.strictEqual(result.statistics.time.totalPlayTimeSeconds, 60);
    });
    
    it('should track combat time', () => {
      const state = initializeStatistics({});
      const result = recordPlayTime(state, 30, 'combat');
      
      assert.strictEqual(result.statistics.time.combatTimeSeconds, 30);
    });
    
    it('should track exploration time', () => {
      const state = initializeStatistics({});
      const result = recordPlayTime(state, 45, 'exploration');
      
      assert.strictEqual(result.statistics.time.explorationTimeSeconds, 45);
    });
  });
  
  describe('getStatisticsSummary', () => {
    it('should return formatted summary', () => {
      let state = initializeStatistics({});
      state = recordDamageDealt(state, 100);
      state = recordDamageReceived(state, 50);
      state = recordGoldEarned(state, 500);
      state = recordGoldSpent(state, 200);
      
      const summary = getStatisticsSummary(state);
      
      assert.strictEqual(summary.combat.damageDealt, 100);
      assert.strictEqual(summary.combat.damageReceived, 50);
      assert.strictEqual(summary.combat.damageRatio, '2.00');
      assert.strictEqual(summary.economy.goldEarned, 500);
      assert.strictEqual(summary.economy.netGold, 300);
    });
    
    it('should calculate accuracy', () => {
      let state = initializeStatistics({});
      state = recordDamageDealt(state, 50);
      state = recordDamageDealt(state, 50);
      state = recordMiss(state);
      state = recordMiss(state);
      
      const summary = getStatisticsSummary(state);
      
      assert.strictEqual(summary.combat.accuracy, '50.0%');
    });
    
    it('should calculate crit rate', () => {
      let state = initializeStatistics({});
      state = recordDamageDealt(state, 50, true);
      state = recordDamageDealt(state, 50, false);
      state = recordDamageDealt(state, 50, false);
      state = recordDamageDealt(state, 50, false);
      
      const summary = getStatisticsSummary(state);
      
      assert.strictEqual(summary.combat.critRate, '25.0%');
    });
    
    it('should format play time', () => {
      let state = initializeStatistics({});
      state = recordPlayTime(state, 3665); // 1h 1m 5s
      
      const summary = getStatisticsSummary(state);
      
      assert.strictEqual(summary.time.totalPlayTime, '1h 1m 5s');
    });
    
    it('should handle empty state', () => {
      const summary = getStatisticsSummary({});
      
      assert.strictEqual(summary.combat.damageDealt, 0);
      assert.strictEqual(summary.combat.damageRatio, 'N/A');
      assert.strictEqual(summary.combat.accuracy, 'N/A');
    });
  });
  
  describe('getTopEnemiesDefeated', () => {
    it('should return top enemies', () => {
      let state = initializeStatistics({});
      state = recordEnemyDefeated(state, 'goblin');
      state = recordEnemyDefeated(state, 'goblin');
      state = recordEnemyDefeated(state, 'goblin');
      state = recordEnemyDefeated(state, 'orc');
      state = recordEnemyDefeated(state, 'orc');
      state = recordEnemyDefeated(state, 'skeleton');
      
      const topEnemies = getTopEnemiesDefeated(state);
      
      assert.strictEqual(topEnemies[0].type, 'goblin');
      assert.strictEqual(topEnemies[0].count, 3);
      assert.strictEqual(topEnemies[1].type, 'orc');
      assert.strictEqual(topEnemies[1].count, 2);
    });
    
    it('should limit results', () => {
      let state = initializeStatistics({});
      state = recordEnemyDefeated(state, 'goblin');
      state = recordEnemyDefeated(state, 'orc');
      state = recordEnemyDefeated(state, 'skeleton');
      state = recordEnemyDefeated(state, 'wolf');
      state = recordEnemyDefeated(state, 'spider');
      state = recordEnemyDefeated(state, 'bat');
      
      const topEnemies = getTopEnemiesDefeated(state, 3);
      
      assert.strictEqual(topEnemies.length, 3);
    });
    
    it('should handle empty state', () => {
      const topEnemies = getTopEnemiesDefeated({});
      
      assert.deepStrictEqual(topEnemies, []);
    });
  });
  
  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const state = initializeStatistics({});
      const originalDamage = state.statistics.combat.totalDamageDealt;
      
      recordDamageDealt(state, 100);
      
      assert.strictEqual(state.statistics.combat.totalDamageDealt, originalDamage);
    });
  });
  
  describe('integration', () => {
    it('should track complete combat scenario', () => {
      let state = initializeStatistics({});
      
      // Combat sequence
      state = recordDamageDealt(state, 50);
      state = recordDamageDealt(state, 75, true);
      state = recordMiss(state);
      state = recordDamageReceived(state, 20);
      state = recordHealing(state, 30, true);
      state = recordEnemyDefeated(state, 'goblin');
      state = recordGoldEarned(state, 50, 'combat');
      state = recordCombo(state, 5);
      state = recordPerfectVictory(state);
      
      const summary = getStatisticsSummary(state);
      
      assert.strictEqual(summary.combat.damageDealt, 125);
      assert.strictEqual(summary.combat.damageReceived, 20);
      assert.strictEqual(summary.combat.highestHit, 75);
      assert.strictEqual(summary.combat.longestCombo, 5);
      assert.strictEqual(summary.combat.perfectVictories, 1);
      assert.strictEqual(summary.enemies.totalDefeated, 1);
      assert.strictEqual(summary.economy.goldFromCombat, 50);
    });
    
    it('should track complete exploration scenario', () => {
      let state = initializeStatistics({});
      
      // Exploration sequence
      state = recordRoomVisited(state, 'forest_entrance', true);
      state = recordRoomVisited(state, 'forest_clearing', true);
      state = recordRoomVisited(state, 'forest_entrance', false);
      state = recordItemFound(state, 'weapon', 'rare');
      state = recordQuestCompleted(state, 'side');
      state = recordGoldEarned(state, 100, 'quest');
      state = recordPlayTime(state, 300, 'exploration');
      
      const summary = getStatisticsSummary(state);
      
      assert.strictEqual(summary.exploration.uniqueRoomsVisited, 2);
      assert.strictEqual(summary.items.totalFound, 1);
      assert.strictEqual(summary.items.rareItemsFound, 1);
      assert.strictEqual(summary.quests.totalCompleted, 1);
      assert.strictEqual(summary.economy.goldFromQuests, 100);
      assert.strictEqual(summary.time.explorationTime, '5m 0s');
    });
  });
});
