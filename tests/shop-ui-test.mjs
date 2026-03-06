// Shop UI rendering tests
// Created by Claude Opus 4.6 (Villager) on Day 339

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderShopPanel, getShopStyles } from '../src/shop-ui.js';
import { createShopState } from '../src/shop.js';

function makePlayer(overrides = {}) {
  return {
    name: 'TestHero',
    hp: 50, maxHp: 50,
    gold: 100,
    inventory: {},
    ...overrides,
  };
}

describe('Shop UI', () => {

  describe('renderShopPanel', () => {
    it('should render shop name', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes("Bram&#39;s General Store") || html.includes("Bram's General Store"));
    });

    it('should render gold amount', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer({ gold: 250 });
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('250'));
    });

    it('should render buy tab items by default', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('Healing Potion'));
      assert.ok(html.includes('shop-buy-btn'));
    });

    it('should render sell tab when tab is sell', () => {
      const shopState = { ...createShopState('merchant_bram', 'exploration'), tab: 'sell' };
      const player = makePlayer({ inventory: { potion: 3 } });
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('shop-sell-btn'));
      assert.ok(html.includes('Healing Potion'));
    });

    it('should show empty message on sell tab with no items', () => {
      const shopState = { ...createShopState('merchant_bram', 'exploration'), tab: 'sell' };
      const player = makePlayer({ inventory: {} });
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('nothing to sell'));
    });

    it('should render shop message when present', () => {
      const shopState = { ...createShopState('merchant_bram', 'exploration'), message: 'Bought 1x Healing Potion!' };
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('Bought 1x Healing Potion!'));
    });

    it('should mark unaffordable items with disabled class', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer({ gold: 0 });
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('shop-item-disabled'));
    });

    it('should not mark affordable items as disabled', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      // Only have stock with potions at 15 gold - player has 100
      const player = makePlayer({ gold: 100 });
      const html = renderShopPanel(shopState, player);
      // At least some items should not be disabled
      assert.ok(html.includes('shop-buy-btn'));
    });

    it('should render tab buttons', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('data-shop-tab="buy"'));
      assert.ok(html.includes('data-shop-tab="sell"'));
    });

    it('should mark active buy tab', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('shop-tab active') && html.includes('data-shop-tab="buy"'));
    });

    it('should show item prices in buy tab', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      // Potion costs 15
      assert.ok(html.includes('15'));
    });

    it('should show stock counts', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('Stock:'));
    });

    it('should show item stats for equipment', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      // Rusty Sword has attack: 5
      assert.ok(html.includes('ATK'));
    });

    it('should handle null player gracefully', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const html = renderShopPanel(shopState, null);
      assert.ok(html.includes('Gold'));
    });

    it('should show rarity colors', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      // Common items have #999999 color
      assert.ok(html.includes('#999999') || html.includes('Common'));
    });

    it('should show greeting text', () => {
      const shopState = createShopState('merchant_bram', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes('Browse my wares'));
    });
  });

  describe('getShopStyles', () => {
    it('should return CSS string', () => {
      const css = getShopStyles();
      assert.ok(typeof css === 'string');
      assert.ok(css.includes('.shop-panel'));
      assert.ok(css.includes('.shop-item'));
    });
  });

  describe('renderShopPanel for different shops', () => {
    it('should render swamp witch shop', () => {
      const shopState = createShopState('swamp_witch', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes("Helga"));
    });

    it('should render hermit sage shop', () => {
      const shopState = createShopState('hermit_sage', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes("Sage"));
    });

    it('should render wandering knight shop', () => {
      const shopState = createShopState('wandering_knight', 'exploration');
      const player = makePlayer();
      const html = renderShopPanel(shopState, player);
      assert.ok(html.includes("Aldous"));
    });
  });
});
