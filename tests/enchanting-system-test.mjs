/**
 * Enchanting System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  ENCHANTMENT_TYPES,
  ENCHANTMENT_TIERS,
  RUNES,
  SLOT_ENCHANTMENTS,
  initEnchantingState,
  getEnchantingState,
  calculateSuccessRate,
  applyEnchantment,
  calculateEnchantingLevel,
  removeEnchantment,
  transferEnchantment,
  combineEnchantments,
  getValidEnchantments,
  getRunesForEnchantment,
  calculateEnchantmentValue,
  getEnchantingStats,
  getEnchantmentHistory,
  addFavoriteEnchantment,
  removeFavoriteEnchantment,
  isEnchantmentDiscovered,
  getDiscoveredEnchantments,
  estimateEnchantmentCost,
  getTierProgression,
  getAllRunes,
  getRuneById
} from '../src/enchanting-system.js';

import {
  renderEnchantingPanel,
  renderEnchantmentInterface,
  renderEnchantmentResult,
  renderRuneInventory,
  renderEnchantmentHistory,
  renderTierComparison,
  renderSuccessRatePreview,
  renderEnchantmentSelector,
  renderTierSelector,
  renderRunesForEnchantment,
  renderItemEnchantmentSummary,
  renderCostBreakdown,
  renderLevelProgress
} from '../src/enchanting-system-ui.js';

describe('Enchanting System', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      enchanting: initEnchantingState()
    };
  });

  describe('Enchantment Types', () => {
    it('has multiple enchantment types', () => {
      assert.ok(Object.keys(ENCHANTMENT_TYPES).length >= 10);
    });

    it('each type has required properties', () => {
      Object.values(ENCHANTMENT_TYPES).forEach(type => {
        assert.ok(type.id);
        assert.ok(type.name);
        assert.ok(type.category);
        assert.ok(type.color);
      });
    });

    it('has offensive, defensive, utility, and elemental categories', () => {
      const categories = new Set(Object.values(ENCHANTMENT_TYPES).map(t => t.category));
      assert.ok(categories.has('offensive'));
      assert.ok(categories.has('defensive'));
      assert.ok(categories.has('utility'));
      assert.ok(categories.has('elemental'));
    });
  });

  describe('Enchantment Tiers', () => {
    it('has all tiers', () => {
      assert.ok(ENCHANTMENT_TIERS.MINOR);
      assert.ok(ENCHANTMENT_TIERS.STANDARD);
      assert.ok(ENCHANTMENT_TIERS.GREATER);
      assert.ok(ENCHANTMENT_TIERS.SUPERIOR);
      assert.ok(ENCHANTMENT_TIERS.LEGENDARY);
    });

    it('each tier has multiplier and maxLevel', () => {
      Object.values(ENCHANTMENT_TIERS).forEach(tier => {
        assert.ok(typeof tier.multiplier === 'number');
        assert.ok(typeof tier.maxLevel === 'number');
        assert.ok(tier.maxLevel > 0);
      });
    });

    it('tiers have increasing multipliers', () => {
      assert.ok(ENCHANTMENT_TIERS.MINOR.multiplier < ENCHANTMENT_TIERS.STANDARD.multiplier);
      assert.ok(ENCHANTMENT_TIERS.STANDARD.multiplier < ENCHANTMENT_TIERS.GREATER.multiplier);
      assert.ok(ENCHANTMENT_TIERS.GREATER.multiplier < ENCHANTMENT_TIERS.SUPERIOR.multiplier);
      assert.ok(ENCHANTMENT_TIERS.SUPERIOR.multiplier < ENCHANTMENT_TIERS.LEGENDARY.multiplier);
    });
  });

  describe('Runes', () => {
    it('has multiple runes', () => {
      assert.ok(Object.keys(RUNES).length >= 5);
    });

    it('each rune has types array', () => {
      Object.values(RUNES).forEach(rune => {
        assert.ok(Array.isArray(rune.types));
        assert.ok(rune.types.length > 0);
      });
    });

    it('each rune has rarity', () => {
      const validRarities = ['common', 'uncommon', 'rare', 'legendary'];
      Object.values(RUNES).forEach(rune => {
        assert.ok(validRarities.includes(rune.rarity));
      });
    });
  });

  describe('Slot Enchantments', () => {
    it('has weapon slot', () => {
      assert.ok(SLOT_ENCHANTMENTS.weapon);
      assert.ok(SLOT_ENCHANTMENTS.weapon.length > 0);
    });

    it('has armor slot', () => {
      assert.ok(SLOT_ENCHANTMENTS.armor);
      assert.ok(SLOT_ENCHANTMENTS.armor.length > 0);
    });

    it('has accessory slot', () => {
      assert.ok(SLOT_ENCHANTMENTS.accessory);
      assert.ok(SLOT_ENCHANTMENTS.accessory.length > 0);
    });
  });

  describe('initEnchantingState', () => {
    it('creates initial state', () => {
      const state = initEnchantingState();
      assert.strictEqual(state.enchantingLevel, 1);
      assert.strictEqual(state.enchantingExp, 0);
      assert.strictEqual(state.totalEnchantments, 0);
      assert.deepStrictEqual(state.discoveredEnchantments, []);
    });
  });

  describe('calculateSuccessRate', () => {
    it('returns high rate for level 0', () => {
      const rate = calculateSuccessRate(0, 'standard', 1);
      assert.ok(rate >= 0.8);
    });

    it('returns lower rate for higher levels', () => {
      const rate0 = calculateSuccessRate(0, 'standard', 1);
      const rate5 = calculateSuccessRate(5, 'standard', 1);
      assert.ok(rate0 > rate5);
    });

    it('higher enchanting level increases rate', () => {
      const rate1 = calculateSuccessRate(3, 'standard', 1);
      const rate10 = calculateSuccessRate(3, 'standard', 10);
      assert.ok(rate10 > rate1);
    });

    it('legendary tier has lower base rate', () => {
      const standard = calculateSuccessRate(0, 'standard', 1);
      const legendary = calculateSuccessRate(0, 'legendary', 1);
      assert.ok(standard > legendary);
    });

    it('clamps rate between 5% and 95%', () => {
      const lowRate = calculateSuccessRate(50, 'legendary', 1);
      const highRate = calculateSuccessRate(0, 'minor', 100);
      assert.ok(lowRate >= 0.05);
      assert.ok(highRate <= 0.95);
    });
  });

  describe('applyEnchantment', () => {
    it('applies enchantment with forceSuccess', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });

      assert.strictEqual(result.success, true);
      assert.ok(result.enchantment);
      assert.strictEqual(result.enchantment.level, 1);
    });

    it('returns error for invalid enchantment type', () => {
      const result = applyEnchantment(gameState, 'item1', 'invalid', 'standard');

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('returns error for invalid tier', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'invalid');

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('fails when at max level', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'minor', { currentLevel: 3 });

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('maximum'));
    });

    it('awards experience', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });

      assert.ok(result.expGained > 0);
      assert.ok(result.state.enchanting.enchantingExp > 0);
    });

    it('tracks statistics', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });

      assert.strictEqual(result.state.enchanting.totalEnchantments, 1);
      assert.strictEqual(result.state.enchanting.successfulEnchantments, 1);
    });

    it('discovers new enchantment types', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });

      assert.ok(result.state.enchanting.discoveredEnchantments.includes('damage'));
    });

    it('tracks rune usage', () => {
      const result = applyEnchantment(gameState, 'item1', 'damage', 'standard', {
        forceSuccess: true,
        runeId: 'rune_of_power'
      });

      assert.strictEqual(result.state.enchanting.runesUsed, 1);
    });

    it('can fail enchantment', () => {
      // Run multiple times to catch a failure
      let hadFailure = false;
      for (let i = 0; i < 100; i++) {
        const result = applyEnchantment(gameState, 'item1', 'damage', 'legendary', { currentLevel: 10 });
        if (!result.success) {
          hadFailure = true;
          break;
        }
      }
      // With high level and legendary tier, should fail sometimes
      assert.ok(hadFailure);
    });
  });

  describe('calculateEnchantingLevel', () => {
    it('starts at level 1', () => {
      assert.strictEqual(calculateEnchantingLevel(0), 1);
    });

    it('levels up with experience', () => {
      assert.strictEqual(calculateEnchantingLevel(100), 2);
      assert.strictEqual(calculateEnchantingLevel(300), 3);
    });

    it('caps at level 100', () => {
      assert.strictEqual(calculateEnchantingLevel(999999), 100);
    });
  });

  describe('removeEnchantment', () => {
    it('removes enchantment', () => {
      const result = removeEnchantment(gameState, 'item1', 'ench1');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.removed, true);
    });

    it('adds to history', () => {
      const result = removeEnchantment(gameState, 'item1', 'ench1');

      assert.ok(result.state.enchanting.enchantmentHistory.length > 0);
      assert.strictEqual(result.state.enchanting.enchantmentHistory[0].action, 'remove');
    });
  });

  describe('transferEnchantment', () => {
    it('transfers enchantment', () => {
      const result = transferEnchantment(gameState, 'source', 'target', 'ench1');

      assert.ok(typeof result.success === 'boolean');
      assert.ok(result.successRate > 0);
    });

    it('can preserve source with option', () => {
      const result = transferEnchantment(gameState, 'source', 'target', 'ench1', { preserveSource: true });

      if (result.success) {
        assert.strictEqual(result.sourcePreserved, true);
      }
    });

    it('awards experience', () => {
      const result = transferEnchantment(gameState, 'source', 'target', 'ench1');

      assert.ok(result.expGained > 0);
    });
  });

  describe('combineEnchantments', () => {
    it('combines enchantments', () => {
      const result = combineEnchantments(gameState, 'item1', 'ench1', 'ench2');

      assert.strictEqual(result.success, true);
      assert.ok(result.combinationResult);
      assert.ok(result.multiplier);
    });

    it('has variable results', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        const result = combineEnchantments(gameState, 'item1', 'ench1', 'ench2');
        results.add(result.combinationResult);
      }
      // Should have more than one result type
      assert.ok(results.size >= 2);
    });

    it('awards experience', () => {
      const result = combineEnchantments(gameState, 'item1', 'ench1', 'ench2');

      assert.ok(result.expGained > 0);
    });
  });

  describe('getValidEnchantments', () => {
    it('returns valid enchantments for weapon', () => {
      const enchants = getValidEnchantments('weapon');

      assert.ok(Array.isArray(enchants));
      assert.ok(enchants.length > 0);
      assert.ok(enchants.some(e => e.id === 'damage'));
    });

    it('returns valid enchantments for armor', () => {
      const enchants = getValidEnchantments('armor');

      assert.ok(enchants.some(e => e.id === 'defense'));
    });

    it('returns empty for invalid slot', () => {
      const enchants = getValidEnchantments('invalid');

      assert.deepStrictEqual(enchants, []);
    });
  });

  describe('getRunesForEnchantment', () => {
    it('returns runes for damage', () => {
      const runes = getRunesForEnchantment('damage');

      assert.ok(Array.isArray(runes));
      assert.ok(runes.length > 0);
    });

    it('returns empty for invalid type', () => {
      const runes = getRunesForEnchantment('invalid');

      assert.deepStrictEqual(runes, []);
    });
  });

  describe('calculateEnchantmentValue', () => {
    it('calculates value', () => {
      const value = calculateEnchantmentValue('damage', 1, 'standard');

      assert.ok(value > 0);
    });

    it('higher level gives higher value', () => {
      const value1 = calculateEnchantmentValue('damage', 1, 'standard');
      const value5 = calculateEnchantmentValue('damage', 5, 'standard');

      assert.ok(value5 > value1);
    });

    it('higher tier gives higher value', () => {
      const standard = calculateEnchantmentValue('damage', 3, 'standard');
      const legendary = calculateEnchantmentValue('damage', 3, 'legendary');

      assert.ok(legendary > standard);
    });

    it('returns 0 for invalid inputs', () => {
      assert.strictEqual(calculateEnchantmentValue('invalid', 1, 'standard'), 0);
      assert.strictEqual(calculateEnchantmentValue('damage', 1, 'invalid'), 0);
    });
  });

  describe('getEnchantingStats', () => {
    it('returns stats', () => {
      const stats = getEnchantingStats(gameState);

      assert.strictEqual(stats.level, 1);
      assert.strictEqual(stats.totalEnchantments, 0);
      assert.strictEqual(stats.successRate, 0);
    });

    it('calculates success rate', () => {
      const applied = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });
      const stats = getEnchantingStats(applied.state);

      assert.strictEqual(stats.successRate, 100);
    });
  });

  describe('getEnchantmentHistory', () => {
    it('returns empty initially', () => {
      const history = getEnchantmentHistory(gameState);

      assert.deepStrictEqual(history, []);
    });

    it('returns history after enchantments', () => {
      const applied = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });
      const history = getEnchantmentHistory(applied.state);

      assert.strictEqual(history.length, 1);
    });

    it('limits results', () => {
      let state = gameState;
      for (let i = 0; i < 15; i++) {
        const result = applyEnchantment(state, `item${i}`, 'damage', 'standard', { forceSuccess: true });
        state = result.state;
      }

      const history = getEnchantmentHistory(state, 5);
      assert.strictEqual(history.length, 5);
    });
  });

  describe('Favorite Enchantments', () => {
    it('adds favorite', () => {
      const result = addFavoriteEnchantment(gameState, 'damage');

      assert.strictEqual(result.added, true);
      assert.ok(result.state.enchanting.favoriteEnchantments.includes('damage'));
    });

    it('does not duplicate favorites', () => {
      const first = addFavoriteEnchantment(gameState, 'damage');
      const second = addFavoriteEnchantment(first.state, 'damage');

      assert.strictEqual(second.added, false);
      assert.strictEqual(second.alreadyFavorite, true);
    });

    it('removes favorite', () => {
      const added = addFavoriteEnchantment(gameState, 'damage');
      const result = removeFavoriteEnchantment(added.state, 'damage');

      assert.strictEqual(result.removed, true);
      assert.ok(!result.state.enchanting.favoriteEnchantments.includes('damage'));
    });
  });

  describe('isEnchantmentDiscovered', () => {
    it('returns false initially', () => {
      assert.strictEqual(isEnchantmentDiscovered(gameState, 'damage'), false);
    });

    it('returns true after discovery', () => {
      const applied = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });

      assert.strictEqual(isEnchantmentDiscovered(applied.state, 'damage'), true);
    });
  });

  describe('getDiscoveredEnchantments', () => {
    it('returns empty initially', () => {
      const discovered = getDiscoveredEnchantments(gameState);

      assert.deepStrictEqual(discovered, []);
    });

    it('returns discovered enchantments', () => {
      const applied = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });
      const discovered = getDiscoveredEnchantments(applied.state);

      assert.strictEqual(discovered.length, 1);
      assert.strictEqual(discovered[0].id, 'damage');
    });
  });

  describe('estimateEnchantmentCost', () => {
    it('calculates cost', () => {
      const cost = estimateEnchantmentCost('damage', 'standard', 1);

      assert.ok(cost > 0);
    });

    it('higher level costs more', () => {
      const cost1 = estimateEnchantmentCost('damage', 'standard', 1);
      const cost5 = estimateEnchantmentCost('damage', 'standard', 5);

      assert.ok(cost5 > cost1);
    });

    it('legendary tier costs more', () => {
      const standard = estimateEnchantmentCost('damage', 'standard', 3);
      const legendary = estimateEnchantmentCost('damage', 'legendary', 3);

      assert.ok(legendary > standard);
    });
  });

  describe('getTierProgression', () => {
    it('returns progression info', () => {
      const prog = getTierProgression('standard', 3);

      assert.ok(prog);
      assert.strictEqual(prog.currentLevel, 3);
      assert.strictEqual(prog.maxLevel, 5);
      assert.strictEqual(prog.atMax, false);
    });

    it('detects at max', () => {
      const prog = getTierProgression('minor', 3);

      assert.strictEqual(prog.atMax, true);
    });

    it('returns null for invalid tier', () => {
      const prog = getTierProgression('invalid', 1);

      assert.strictEqual(prog, null);
    });
  });

  describe('getAllRunes', () => {
    it('returns all runes', () => {
      const runes = getAllRunes();

      assert.ok(Array.isArray(runes));
      assert.strictEqual(runes.length, Object.keys(RUNES).length);
    });
  });

  describe('getRuneById', () => {
    it('returns rune by ID', () => {
      const rune = getRuneById('rune_of_power');

      assert.ok(rune);
      assert.strictEqual(rune.id, 'rune_of_power');
    });

    it('returns null for invalid ID', () => {
      const rune = getRuneById('invalid');

      assert.strictEqual(rune, null);
    });
  });
});

describe('Enchanting System UI', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      enchanting: initEnchantingState()
    };
  });

  describe('renderEnchantingPanel', () => {
    it('renders panel', () => {
      const html = renderEnchantingPanel(gameState);

      assert.ok(html.includes('enchanting-panel'));
      assert.ok(html.includes('Enchanting'));
      assert.ok(html.includes('Level 1'));
    });

    it('shows statistics', () => {
      const html = renderEnchantingPanel(gameState);

      assert.ok(html.includes('Total Enchantments'));
      assert.ok(html.includes('Success Rate'));
    });

    it('shows discovery progress', () => {
      const html = renderEnchantingPanel(gameState);

      assert.ok(html.includes('Enchantments Discovered'));
    });
  });

  describe('renderEnchantmentInterface', () => {
    it('renders interface', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const html = renderEnchantmentInterface(gameState, item, 'weapon');

      assert.ok(html.includes('enchantment-interface'));
      assert.ok(html.includes('Iron Sword'));
    });

    it('shows valid enchantments', () => {
      const item = { id: 'armor1', name: 'Steel Armor' };
      const html = renderEnchantmentInterface(gameState, item, 'armor');

      assert.ok(html.includes('Defense'));
    });

    it('shows tier options', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const html = renderEnchantmentInterface(gameState, item, 'weapon');

      assert.ok(html.includes('Minor'));
      assert.ok(html.includes('Legendary'));
    });
  });

  describe('renderEnchantmentResult', () => {
    it('renders success result', () => {
      const result = {
        success: true,
        enchantment: { type: 'damage', level: 2, value: 15 },
        successRate: 0.85,
        expGained: 20,
        leveledUp: false
      };

      const html = renderEnchantmentResult(result);

      assert.ok(html.includes('success'));
      assert.ok(html.includes('Successful'));
      assert.ok(html.includes('+20 XP'));
    });

    it('renders failure result', () => {
      const result = {
        success: false,
        enchantment: { type: 'damage' },
        successRate: 0.3,
        expGained: 5,
        leveledUp: false
      };

      const html = renderEnchantmentResult(result);

      assert.ok(html.includes('failure'));
      assert.ok(html.includes('Failed'));
    });

    it('shows level up', () => {
      const result = {
        success: true,
        enchantment: { type: 'damage', level: 1, value: 5 },
        successRate: 0.9,
        expGained: 50,
        leveledUp: true
      };

      const html = renderEnchantmentResult(result);

      assert.ok(html.includes('Level Up'));
    });
  });

  describe('renderRuneInventory', () => {
    it('renders rune grid', () => {
      const html = renderRuneInventory([]);

      assert.ok(html.includes('rune-inventory'));
      assert.ok(html.includes('Rune Collection'));
    });

    it('shows owned runes', () => {
      const runes = [{ id: 'rune_of_power' }];
      const html = renderRuneInventory(runes);

      assert.ok(html.includes('Rune of Power'));
      assert.ok(html.includes('Owned: 1'));
    });
  });

  describe('renderEnchantmentHistory', () => {
    it('renders empty history', () => {
      const html = renderEnchantmentHistory(gameState);

      assert.ok(html.includes('enchantment-history'));
      assert.ok(html.includes('No enchantment history'));
    });

    it('renders history entries', () => {
      const applied = applyEnchantment(gameState, 'item1', 'damage', 'standard', { forceSuccess: true });
      const html = renderEnchantmentHistory(applied.state);

      assert.ok(html.includes('history-entry'));
    });
  });

  describe('renderTierComparison', () => {
    it('renders comparison table', () => {
      const html = renderTierComparison('damage', 1);

      assert.ok(html.includes('tier-comparison'));
      assert.ok(html.includes('Damage'));
      assert.ok(html.includes('Minor'));
      assert.ok(html.includes('Legendary'));
    });

    it('returns empty for invalid type', () => {
      const html = renderTierComparison('invalid', 1);

      assert.strictEqual(html, '');
    });
  });

  describe('renderSuccessRatePreview', () => {
    it('renders rate preview', () => {
      const html = renderSuccessRatePreview(0, 'standard', 1);

      assert.ok(html.includes('success-rate-preview'));
      assert.ok(html.includes('%'));
    });

    it('shows high class for high rate', () => {
      const html = renderSuccessRatePreview(0, 'minor', 50);

      assert.ok(html.includes('high'));
    });

    it('shows low class for low rate', () => {
      const html = renderSuccessRatePreview(10, 'legendary', 1);

      assert.ok(html.includes('low'));
    });
  });

  describe('renderEnchantmentSelector', () => {
    it('renders selector', () => {
      const html = renderEnchantmentSelector('weapon');

      assert.ok(html.includes('enchantment-selector'));
      assert.ok(html.includes('<select'));
      assert.ok(html.includes('Damage'));
    });

    it('marks selected option', () => {
      const html = renderEnchantmentSelector('weapon', 'damage');

      assert.ok(html.includes('selected'));
    });
  });

  describe('renderTierSelector', () => {
    it('renders tier selector', () => {
      const html = renderTierSelector();

      assert.ok(html.includes('tier-selector'));
      Object.values(ENCHANTMENT_TIERS).forEach(tier => {
        assert.ok(html.includes(tier.name));
      });
    });
  });

  describe('renderRunesForEnchantment', () => {
    it('renders compatible runes', () => {
      const html = renderRunesForEnchantment('damage');

      assert.ok(html.includes('Rune of Power'));
    });

    it('shows no runes message', () => {
      const html = renderRunesForEnchantment('invalid');

      assert.ok(html.includes('No runes available'));
    });
  });

  describe('renderItemEnchantmentSummary', () => {
    it('renders empty message', () => {
      const html = renderItemEnchantmentSummary([]);

      assert.ok(html.includes('No enchantments'));
    });

    it('renders enchantment list', () => {
      const enchantments = [
        { type: 'damage', tier: 'standard', level: 3, value: 15 }
      ];
      const html = renderItemEnchantmentSummary(enchantments);

      assert.ok(html.includes('item-enchantments'));
      assert.ok(html.includes('Lv.3'));
      assert.ok(html.includes('+15'));
    });
  });

  describe('renderCostBreakdown', () => {
    it('renders cost', () => {
      const html = renderCostBreakdown('damage', 'standard', 1);

      assert.ok(html.includes('cost-breakdown'));
      assert.ok(html.includes('gold'));
    });
  });

  describe('renderLevelProgress', () => {
    it('renders progress', () => {
      const html = renderLevelProgress(gameState);

      assert.ok(html.includes('level-progress'));
      assert.ok(html.includes('Level 1'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes item name', () => {
      const item = { id: 'bad', name: '<script>alert("xss")</script>' };
      const html = renderEnchantmentInterface(gameState, item, 'weapon');

      assert.ok(!html.includes('<script>alert'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
