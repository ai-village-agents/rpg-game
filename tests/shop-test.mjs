// Shop system tests
// Created by Claude Opus 4.6 (Villager) on Day 339

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SHOPS,
  getBuyPrice,
  getSellPrice,
  hasShop,
  getShopData,
  createShopState,
  buyItem,
  sellItem,
  getSellableItems,
} from '../src/shop.js';

import { items as itemsData } from '../src/data/items.js';

// Helper to create a player for tests
function makePlayer(overrides = {}) {
  return {
    name: 'TestHero',
    hp: 50,
    maxHp: 50,
    gold: 100,
    inventory: {},
    ...overrides,
  };
}

describe('Shop System', () => {

  describe('SHOPS data', () => {
    it('should have at least one shop defined', () => {
      assert.ok(Object.keys(SHOPS).length > 0);
    });

    it('each shop should have name, greeting, and stock', () => {
      for (const [npcId, shop] of Object.entries(SHOPS)) {
        assert.ok(shop.name, `${npcId} missing name`);
        assert.ok(shop.greeting, `${npcId} missing greeting`);
        assert.ok(Array.isArray(shop.stock), `${npcId} stock should be array`);
        assert.ok(shop.stock.length > 0, `${npcId} should have stock items`);
      }
    });

    it('all stock items should reference valid item IDs', () => {
      for (const [npcId, shop] of Object.entries(SHOPS)) {
        for (const entry of shop.stock) {
          assert.ok(itemsData[entry.itemId], `${npcId}: invalid itemId '${entry.itemId}'`);
          assert.ok(typeof entry.quantity === 'number' && entry.quantity > 0,
            `${npcId}: invalid quantity for '${entry.itemId}'`);
        }
      }
    });

    it('should have 4 shops', () => {
      assert.equal(Object.keys(SHOPS).length, 4);
    });
  });

  describe('getBuyPrice', () => {
    it('should return item value for valid items', () => {
      assert.equal(getBuyPrice('potion'), 15);
      assert.equal(getBuyPrice('ironSword'), 80);
    });

    it('should return 0 for unknown items', () => {
      assert.equal(getBuyPrice('nonexistent'), 0);
    });
  });

  describe('getSellPrice', () => {
    it('should return half of item value (floored)', () => {
      assert.equal(getSellPrice('potion'), 7); // 15 * 0.5 = 7.5, floor = 7
      assert.equal(getSellPrice('ironSword'), 40); // 80 * 0.5 = 40
      assert.equal(getSellPrice('hiPotion'), 22); // 45 * 0.5 = 22.5, floor = 22
    });

    it('should return 0 for unknown items', () => {
      assert.equal(getSellPrice('nonexistent'), 0);
    });
  });

  describe('hasShop', () => {
    it('should return true for NPCs with shops', () => {
      assert.ok(hasShop('merchant_bram'));
      assert.ok(hasShop('swamp_witch'));
      assert.ok(hasShop('hermit_sage'));
      assert.ok(hasShop('wandering_knight'));
    });

    it('should return false for NPCs without shops', () => {
      assert.ok(!hasShop('village_elder'));
      assert.ok(!hasShop('scout_patrol'));
      assert.ok(!hasShop('nonexistent'));
    });
  });

  describe('getShopData', () => {
    it('should return shop data with enriched stock', () => {
      const data = getShopData('merchant_bram');
      assert.ok(data);
      assert.equal(data.npcId, 'merchant_bram');
      assert.equal(data.name, "Bram's General Store");
      assert.ok(data.stock.length > 0);

      const potionEntry = data.stock.find(s => s.itemId === 'potion');
      assert.ok(potionEntry);
      assert.ok(potionEntry.item);
      assert.equal(potionEntry.item.name, 'Healing Potion');
      assert.equal(potionEntry.buyPrice, 15);
    });

    it('should return null for non-shop NPCs', () => {
      assert.equal(getShopData('village_elder'), null);
    });
  });

  describe('createShopState', () => {
    it('should create shop state with correct defaults', () => {
      const ss = createShopState('merchant_bram', 'dialog');
      assert.ok(ss);
      assert.equal(ss.npcId, 'merchant_bram');
      assert.equal(ss.tab, 'buy');
      assert.equal(ss.previousPhase, 'dialog');
      assert.equal(ss.selectedItem, null);
      assert.equal(ss.message, null);
      assert.ok(ss.stock.length > 0);
    });

    it('should return null for non-shop NPCs', () => {
      assert.equal(createShopState('village_elder', 'dialog'), null);
    });

    it('should default previousPhase to exploration', () => {
      const ss = createShopState('merchant_bram');
      assert.equal(ss.previousPhase, 'exploration');
    });
  });

  describe('buyItem', () => {
    it('should buy an item successfully', () => {
      const player = makePlayer({ gold: 100, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = buyItem(player, shopState, 'potion');

      assert.ok(result.success);
      assert.equal(result.player.gold, 85); // 100 - 15
      assert.equal(result.player.inventory.potion, 1);
      assert.ok(result.message.includes('Bought'));

      // Stock should decrease
      const potionStock = result.shopState.stock.find(s => s.itemId === 'potion');
      assert.equal(potionStock.quantity, 9); // was 10
    });

    it('should buy multiple items at once', () => {
      const player = makePlayer({ gold: 200, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = buyItem(player, shopState, 'potion', 3);

      assert.ok(result.success);
      assert.equal(result.player.gold, 155); // 200 - 45
      assert.equal(result.player.inventory.potion, 3);
    });

    it('should fail when not enough gold', () => {
      const player = makePlayer({ gold: 5, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = buyItem(player, shopState, 'potion');

      assert.ok(!result.success);
      assert.equal(result.player.gold, 5); // unchanged
      assert.ok(result.message.includes('Not enough gold'));
    });

    it('should fail when not enough stock', () => {
      const player = makePlayer({ gold: 10000, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = buyItem(player, shopState, 'potion', 999);

      assert.ok(!result.success);
      assert.ok(result.message.includes('Not enough'));
    });

    it('should fail for nonexistent items', () => {
      const player = makePlayer({ gold: 1000, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = buyItem(player, shopState, 'nonexistent');

      assert.ok(!result.success);
      assert.ok(result.message.includes('not found'));
    });

    it('should add to existing inventory', () => {
      const player = makePlayer({ gold: 100, inventory: { potion: 3 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = buyItem(player, shopState, 'potion', 2);

      assert.ok(result.success);
      assert.equal(result.player.inventory.potion, 5);
    });

    it('should not modify original player or shopState', () => {
      const player = makePlayer({ gold: 100, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      buyItem(player, shopState, 'potion');

      assert.equal(player.gold, 100); // unchanged
      assert.deepEqual(player.inventory, {}); // unchanged
    });
  });

  describe('sellItem', () => {
    it('should sell an item successfully', () => {
      const player = makePlayer({ gold: 50, inventory: { potion: 3 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = sellItem(player, shopState, 'potion');

      assert.ok(result.success);
      assert.equal(result.player.gold, 57); // 50 + 7
      assert.equal(result.player.inventory.potion, 2);
      assert.ok(result.message.includes('Sold'));
    });

    it('should sell multiple items at once', () => {
      const player = makePlayer({ gold: 0, inventory: { potion: 5 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = sellItem(player, shopState, 'potion', 3);

      assert.ok(result.success);
      assert.equal(result.player.gold, 21); // 3 * 7
      assert.equal(result.player.inventory.potion, 2);
    });

    it('should remove item from inventory when selling all', () => {
      const player = makePlayer({ gold: 0, inventory: { potion: 1 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = sellItem(player, shopState, 'potion', 1);

      assert.ok(result.success);
      assert.equal(result.player.gold, 7);
      assert.ok(!result.player.inventory.potion || result.player.inventory.potion === 0);
    });

    it('should fail when player does not have enough items', () => {
      const player = makePlayer({ gold: 50, inventory: { potion: 1 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = sellItem(player, shopState, 'potion', 5);

      assert.ok(!result.success);
      assert.equal(result.player.gold, 50); // unchanged
    });

    it('should fail for nonexistent items', () => {
      const player = makePlayer({ gold: 50, inventory: { potion: 1 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = sellItem(player, shopState, 'nonexistent');

      assert.ok(!result.success);
    });

    it('should fail for items not in inventory', () => {
      const player = makePlayer({ gold: 50, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');
      const result = sellItem(player, shopState, 'potion');

      assert.ok(!result.success);
    });

    it('should not modify original player', () => {
      const player = makePlayer({ gold: 50, inventory: { potion: 3 } });
      const shopState = createShopState('merchant_bram', 'exploration');
      sellItem(player, shopState, 'potion');

      assert.equal(player.gold, 50); // unchanged
      assert.equal(player.inventory.potion, 3); // unchanged
    });
  });

  describe('getSellableItems', () => {
    it('should return items with sell prices', () => {
      const inventory = { potion: 3, ironSword: 1 };
      const sellable = getSellableItems(inventory);

      assert.equal(sellable.length, 2);
      const potionEntry = sellable.find(s => s.itemId === 'potion');
      assert.ok(potionEntry);
      assert.equal(potionEntry.count, 3);
      assert.equal(potionEntry.sellPrice, 7);
    });

    it('should return empty array for empty inventory', () => {
      assert.deepEqual(getSellableItems({}), []);
      assert.deepEqual(getSellableItems(null), []);
      assert.deepEqual(getSellableItems(undefined), []);
    });

    it('should filter out items with 0 count', () => {
      const inventory = { potion: 0, ironSword: 1 };
      const sellable = getSellableItems(inventory);
      assert.equal(sellable.length, 1);
    });
  });

  describe('buy/sell round-trip', () => {
    it('buying and selling should result in gold loss (sell at half price)', () => {
      const player = makePlayer({ gold: 100, inventory: {} });
      const shopState = createShopState('merchant_bram', 'exploration');

      // Buy a potion for 15
      const buyResult = buyItem(player, shopState, 'potion');
      assert.equal(buyResult.player.gold, 85);

      // Sell it back for 7
      const sellResult = sellItem(buyResult.player, buyResult.shopState, 'potion');
      assert.equal(sellResult.player.gold, 92);

      // Net loss: 8 gold
      assert.equal(100 - sellResult.player.gold, 8);
    });
  });
});
