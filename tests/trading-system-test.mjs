/**
 * Trading System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  TRADE_STATUS,
  TRADE_TYPES,
  MERCHANT_TYPES,
  initTradingState,
  getTradingState,
  createTrade,
  acceptTrade,
  declineTrade,
  cancelTrade,
  completeTrade,
  expireTrade,
  modifyTrade,
  buyFromMerchant,
  sellToMerchant,
  blockTrader,
  unblockTrader,
  updateTradeSettings,
  calculateTradingLevel,
  getTradingStats,
  getActiveTrades,
  getTradeHistory,
  cleanupExpiredTrades,
  getMerchantInfo
} from '../src/trading-system.js';

import {
  renderTradingPanel,
  renderTradeCard,
  renderTradeCreationForm,
  renderMerchantShop,
  renderSellInterface,
  renderTradeHistory,
  renderMerchantSelection,
  renderBlockedTraders,
  renderTradeSettings,
  renderTradeNotification,
  renderTransactionConfirm
} from '../src/trading-system-ui.js';

describe('Trading System', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      trading: initTradingState()
    };
  });

  describe('Trade Status', () => {
    it('has all required statuses', () => {
      assert.ok(TRADE_STATUS.PENDING);
      assert.ok(TRADE_STATUS.ACCEPTED);
      assert.ok(TRADE_STATUS.DECLINED);
      assert.ok(TRADE_STATUS.CANCELLED);
      assert.ok(TRADE_STATUS.COMPLETED);
      assert.ok(TRADE_STATUS.EXPIRED);
    });

    it('each status has id, name, and color', () => {
      Object.values(TRADE_STATUS).forEach(status => {
        assert.ok(status.id);
        assert.ok(status.name);
        assert.ok(status.color);
      });
    });
  });

  describe('Trade Types', () => {
    it('has all required types', () => {
      assert.ok(TRADE_TYPES.DIRECT);
      assert.ok(TRADE_TYPES.MERCHANT);
      assert.ok(TRADE_TYPES.AUCTION);
      assert.ok(TRADE_TYPES.BARTER);
    });

    it('each type has id, name, and description', () => {
      Object.values(TRADE_TYPES).forEach(type => {
        assert.ok(type.id);
        assert.ok(type.name);
        assert.ok(type.description);
      });
    });
  });

  describe('Merchant Types', () => {
    it('has all merchant types', () => {
      assert.ok(MERCHANT_TYPES.GENERAL);
      assert.ok(MERCHANT_TYPES.BLACKSMITH);
      assert.ok(MERCHANT_TYPES.ALCHEMIST);
      assert.ok(MERCHANT_TYPES.JEWELER);
      assert.ok(MERCHANT_TYPES.PROVISIONER);
      assert.ok(MERCHANT_TYPES.EXOTIC);
    });

    it('each merchant has buy and sell multipliers', () => {
      Object.values(MERCHANT_TYPES).forEach(merchant => {
        assert.ok(typeof merchant.buyMultiplier === 'number');
        assert.ok(typeof merchant.sellMultiplier === 'number');
        assert.ok(merchant.buyMultiplier > 0 && merchant.buyMultiplier <= 1);
        assert.ok(merchant.sellMultiplier > 0);
      });
    });

    it('specialist merchants have categories', () => {
      assert.ok(MERCHANT_TYPES.BLACKSMITH.categories);
      assert.ok(MERCHANT_TYPES.ALCHEMIST.categories);
      assert.ok(MERCHANT_TYPES.JEWELER.categories);
    });
  });

  describe('initTradingState', () => {
    it('creates empty state', () => {
      const state = initTradingState();
      assert.deepStrictEqual(state.activeTrades, []);
      assert.deepStrictEqual(state.tradeHistory, []);
      assert.strictEqual(state.tradingLevel, 1);
      assert.strictEqual(state.tradingExp, 0);
    });

    it('initializes trade settings', () => {
      const state = initTradingState();
      assert.strictEqual(state.tradeSettings.allowDirectTrades, true);
      assert.strictEqual(state.tradeSettings.allowBarterOnly, false);
    });
  });

  describe('createTrade', () => {
    it('creates a direct trade', () => {
      const result = createTrade(gameState, {
        type: 'direct',
        initiator: 'player1',
        receiver: 'player2',
        offeredItems: [{ id: 'sword', name: 'Iron Sword' }],
        requestedGold: 100
      });

      assert.strictEqual(result.created, true);
      assert.strictEqual(result.trade.status, 'pending');
      assert.strictEqual(result.trade.initiator, 'player1');
      assert.strictEqual(result.trade.receiver, 'player2');
    });

    it('fails without initiator', () => {
      const result = createTrade(gameState, {
        receiver: 'player2',
        offeredGold: 50
      });

      assert.strictEqual(result.created, false);
      assert.ok(result.error);
    });

    it('fails for direct trade without receiver', () => {
      const result = createTrade(gameState, {
        type: 'direct',
        initiator: 'player1',
        offeredGold: 50
      });

      assert.strictEqual(result.created, false);
      assert.ok(result.error.includes('Receiver'));
    });

    it('fails with empty trade', () => {
      const result = createTrade(gameState, {
        type: 'direct',
        initiator: 'player1',
        receiver: 'player2'
      });

      assert.strictEqual(result.created, false);
      assert.ok(result.error.includes('items or gold'));
    });

    it('fails when receiver is blocked', () => {
      gameState.trading.blockedTraders = ['player2'];

      const result = createTrade(gameState, {
        type: 'direct',
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      assert.strictEqual(result.created, false);
      assert.ok(result.error.includes('blocked'));
    });

    it('generates unique trade IDs', () => {
      const result1 = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 50
      });

      const result2 = createTrade(result1.state, {
        initiator: 'player1',
        receiver: 'player3',
        offeredGold: 75
      });

      assert.notStrictEqual(result1.trade.id, result2.trade.id);
    });
  });

  describe('acceptTrade', () => {
    let tradeState;
    let tradeId;

    beforeEach(() => {
      const result = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      tradeState = result.state;
      tradeId = result.trade.id;
    });

    it('accepts a pending trade', () => {
      const result = acceptTrade(tradeState, tradeId, 'player2');

      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.trade.status, 'accepted');
      assert.strictEqual(result.trade.acceptedBy, 'player2');
    });

    it('fails for non-existent trade', () => {
      const result = acceptTrade(tradeState, 'fake_id', 'player2');

      assert.strictEqual(result.accepted, false);
      assert.ok(result.error.includes('not found'));
    });

    it('fails if not the receiver', () => {
      const result = acceptTrade(tradeState, tradeId, 'player3');

      assert.strictEqual(result.accepted, false);
      assert.ok(result.error.includes('Not authorized'));
    });

    it('fails for non-pending trade', () => {
      const accepted = acceptTrade(tradeState, tradeId, 'player2');
      const result = acceptTrade(accepted.state, tradeId, 'player2');

      assert.strictEqual(result.accepted, false);
      assert.ok(result.error.includes('not pending'));
    });
  });

  describe('declineTrade', () => {
    let tradeState;
    let tradeId;

    beforeEach(() => {
      const result = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      tradeState = result.state;
      tradeId = result.trade.id;
    });

    it('declines a pending trade', () => {
      const result = declineTrade(tradeState, tradeId, 'player2', 'Too low');

      assert.strictEqual(result.declined, true);
      assert.strictEqual(result.trade.status, 'declined');
      assert.strictEqual(result.trade.declineReason, 'Too low');
    });

    it('moves declined trade to history', () => {
      const result = declineTrade(tradeState, tradeId, 'player2');

      assert.strictEqual(result.state.trading.activeTrades.length, 0);
      assert.strictEqual(result.state.trading.tradeHistory.length, 1);
    });

    it('fails for non-existent trade', () => {
      const result = declineTrade(tradeState, 'fake_id', 'player2');

      assert.strictEqual(result.declined, false);
    });
  });

  describe('cancelTrade', () => {
    let tradeState;
    let tradeId;

    beforeEach(() => {
      const result = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      tradeState = result.state;
      tradeId = result.trade.id;
    });

    it('cancels a trade by initiator', () => {
      const result = cancelTrade(tradeState, tradeId, 'player1');

      assert.strictEqual(result.cancelled, true);
      assert.strictEqual(result.trade.status, 'cancelled');
    });

    it('fails when cancelled by non-initiator', () => {
      const result = cancelTrade(tradeState, tradeId, 'player2');

      assert.strictEqual(result.cancelled, false);
      assert.ok(result.error.includes('Only initiator'));
    });

    it('moves cancelled trade to history', () => {
      const result = cancelTrade(tradeState, tradeId, 'player1');

      assert.strictEqual(result.state.trading.activeTrades.length, 0);
      assert.strictEqual(result.state.trading.tradeHistory.length, 1);
    });
  });

  describe('completeTrade', () => {
    let tradeState;
    let tradeId;

    beforeEach(() => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100,
        offeredItems: [{ id: 'item1' }]
      });
      const acceptResult = acceptTrade(createResult.state, createResult.trade.id, 'player2');
      tradeState = acceptResult.state;
      tradeId = createResult.trade.id;
    });

    it('completes an accepted trade', () => {
      const result = completeTrade(tradeState, tradeId);

      assert.strictEqual(result.completed, true);
      assert.strictEqual(result.trade.status, 'completed');
    });

    it('awards experience', () => {
      const result = completeTrade(tradeState, tradeId);

      assert.ok(result.expGained > 0);
    });

    it('updates trading statistics', () => {
      const result = completeTrade(tradeState, tradeId);

      assert.strictEqual(result.state.trading.totalTradesCompleted, 1);
      assert.ok(result.state.trading.totalGoldTraded > 0);
      assert.ok(result.state.trading.totalItemsTraded > 0);
    });

    it('fails for non-accepted trade', () => {
      const freshState = { trading: initTradingState() };
      const createResult = createTrade(freshState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const result = completeTrade(createResult.state, createResult.trade.id);

      assert.strictEqual(result.completed, false);
      assert.ok(result.error.includes('accepted'));
    });
  });

  describe('expireTrade', () => {
    it('expires a trade', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const result = expireTrade(createResult.state, createResult.trade.id);

      assert.strictEqual(result.expired, true);
      assert.strictEqual(result.trade.status, 'expired');
    });

    it('moves expired trade to history', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const result = expireTrade(createResult.state, createResult.trade.id);

      assert.strictEqual(result.state.trading.activeTrades.length, 0);
      assert.strictEqual(result.state.trading.tradeHistory.length, 1);
    });
  });

  describe('modifyTrade', () => {
    let tradeState;
    let tradeId;

    beforeEach(() => {
      const result = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      tradeState = result.state;
      tradeId = result.trade.id;
    });

    it('modifies a pending trade', () => {
      const result = modifyTrade(tradeState, tradeId, { offeredGold: 150 }, 'player1');

      assert.strictEqual(result.modified, true);
      assert.strictEqual(result.trade.offeredGold, 150);
    });

    it('fails for non-participant', () => {
      const result = modifyTrade(tradeState, tradeId, { offeredGold: 150 }, 'player3');

      assert.strictEqual(result.modified, false);
    });

    it('fails for non-pending trade', () => {
      const acceptResult = acceptTrade(tradeState, tradeId, 'player2');
      const result = modifyTrade(acceptResult.state, tradeId, { offeredGold: 150 }, 'player1');

      assert.strictEqual(result.modified, false);
    });
  });

  describe('buyFromMerchant', () => {
    it('buys from a merchant', () => {
      const result = buyFromMerchant(gameState, 'general', 'item1', 100, 1);

      assert.strictEqual(result.bought, true);
      assert.ok(result.totalPrice > 0);
      assert.ok(result.expGained > 0);
    });

    it('applies sell multiplier', () => {
      const result = buyFromMerchant(gameState, 'general', 'item1', 100, 1);

      // General store sells at 1.0 multiplier
      assert.strictEqual(result.totalPrice, 100);
    });

    it('applies favorability discount', () => {
      gameState.trading.merchantFavorability = { general: 100 };
      const result = buyFromMerchant(gameState, 'general', 'item1', 100, 1);

      assert.ok(result.totalPrice < 100);
      assert.ok(result.discount > 0);
    });

    it('increases favorability', () => {
      const result = buyFromMerchant(gameState, 'general', 'item1', 100, 2);

      assert.strictEqual(result.state.trading.merchantFavorability.general, 2);
    });

    it('fails for invalid merchant', () => {
      const result = buyFromMerchant(gameState, 'invalid', 'item1', 100);

      assert.strictEqual(result.bought, false);
    });
  });

  describe('sellToMerchant', () => {
    it('sells to a merchant', () => {
      const result = sellToMerchant(gameState, 'general', 'item1', 100, 1);

      assert.strictEqual(result.sold, true);
      assert.ok(result.totalPrice > 0);
      assert.ok(result.expGained > 0);
    });

    it('applies buy multiplier', () => {
      const result = sellToMerchant(gameState, 'general', 'item1', 100, 1);

      // General store buys at 0.5 multiplier
      assert.strictEqual(result.totalPrice, 50);
    });

    it('applies favorability bonus', () => {
      gameState.trading.merchantFavorability = { general: 100 };
      const result = sellToMerchant(gameState, 'general', 'item1', 100, 1);

      assert.ok(result.totalPrice > 50);
      assert.ok(result.bonus > 0);
    });

    it('fails for invalid merchant', () => {
      const result = sellToMerchant(gameState, 'invalid', 'item1', 100);

      assert.strictEqual(result.sold, false);
    });
  });

  describe('blockTrader', () => {
    it('blocks a trader', () => {
      const result = blockTrader(gameState, 'badplayer');

      assert.strictEqual(result.blocked, true);
      assert.ok(result.state.trading.blockedTraders.includes('badplayer'));
    });

    it('does not duplicate blocks', () => {
      const first = blockTrader(gameState, 'badplayer');
      const second = blockTrader(first.state, 'badplayer');

      assert.strictEqual(second.blocked, false);
      assert.strictEqual(second.alreadyBlocked, true);
    });
  });

  describe('unblockTrader', () => {
    it('unblocks a trader', () => {
      const blocked = blockTrader(gameState, 'badplayer');
      const result = unblockTrader(blocked.state, 'badplayer');

      assert.strictEqual(result.unblocked, true);
      assert.ok(!result.state.trading.blockedTraders.includes('badplayer'));
    });

    it('handles unblocking non-blocked trader', () => {
      const result = unblockTrader(gameState, 'goodplayer');

      assert.strictEqual(result.unblocked, false);
      assert.strictEqual(result.notBlocked, true);
    });
  });

  describe('updateTradeSettings', () => {
    it('updates settings', () => {
      const result = updateTradeSettings(gameState, {
        allowDirectTrades: false,
        autoDeclineBelow: 100
      });

      assert.strictEqual(result.updated, true);
      assert.strictEqual(result.state.trading.tradeSettings.allowDirectTrades, false);
      assert.strictEqual(result.state.trading.tradeSettings.autoDeclineBelow, 100);
    });

    it('preserves existing settings', () => {
      const result = updateTradeSettings(gameState, { autoDeclineBelow: 50 });

      assert.strictEqual(result.state.trading.tradeSettings.allowDirectTrades, true);
    });
  });

  describe('calculateTradingLevel', () => {
    it('starts at level 1', () => {
      assert.strictEqual(calculateTradingLevel(0), 1);
    });

    it('levels up with experience', () => {
      assert.strictEqual(calculateTradingLevel(75), 2);
      assert.strictEqual(calculateTradingLevel(225), 3);
    });

    it('caps at level 25', () => {
      assert.strictEqual(calculateTradingLevel(999999), 25);
    });
  });

  describe('getTradingStats', () => {
    it('returns statistics', () => {
      const stats = getTradingStats(gameState);

      assert.strictEqual(stats.level, 1);
      assert.strictEqual(stats.experience, 0);
      assert.strictEqual(stats.totalCompleted, 0);
    });

    it('counts active trades', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const stats = getTradingStats(createResult.state);
      assert.strictEqual(stats.pendingTrades, 1);
    });
  });

  describe('getActiveTrades', () => {
    it('returns all active trades', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const trades = getActiveTrades(createResult.state);
      assert.strictEqual(trades.length, 1);
    });

    it('filters by player ID', () => {
      let state = gameState;

      const create1 = createTrade(state, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      state = create1.state;

      const create2 = createTrade(state, {
        initiator: 'player3',
        receiver: 'player4',
        offeredGold: 100
      });
      state = create2.state;

      const player1Trades = getActiveTrades(state, 'player1');
      assert.strictEqual(player1Trades.length, 1);

      const player3Trades = getActiveTrades(state, 'player3');
      assert.strictEqual(player3Trades.length, 1);
    });
  });

  describe('getTradeHistory', () => {
    it('returns empty history initially', () => {
      const history = getTradeHistory(gameState);
      assert.strictEqual(history.length, 0);
    });

    it('returns completed trades', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      const acceptResult = acceptTrade(createResult.state, createResult.trade.id, 'player2');
      const completeResult = completeTrade(acceptResult.state, createResult.trade.id);

      const history = getTradeHistory(completeResult.state);
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].status, 'completed');
    });

    it('limits results', () => {
      let state = gameState;
      for (let i = 0; i < 5; i++) {
        const create = createTrade(state, {
          initiator: 'player1',
          receiver: 'player2',
          offeredGold: 100
        });
        const decline = declineTrade(create.state, create.trade.id, 'player2');
        state = decline.state;
      }

      const history = getTradeHistory(state, null, 3);
      assert.strictEqual(history.length, 3);
    });
  });

  describe('cleanupExpiredTrades', () => {
    it('cleans up expired trades', () => {
      // Create a trade that's already expired
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100,
        expiresIn: -1000 // Already expired
      });

      const result = cleanupExpiredTrades(createResult.state);

      assert.strictEqual(result.cleaned, 1);
      assert.strictEqual(result.state.trading.activeTrades.length, 0);
      assert.strictEqual(result.state.trading.tradeHistory.length, 1);
    });

    it('preserves non-expired trades', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const result = cleanupExpiredTrades(createResult.state);

      assert.strictEqual(result.cleaned, 0);
      assert.strictEqual(result.state.trading.activeTrades.length, 1);
    });
  });

  describe('getMerchantInfo', () => {
    it('returns merchant info', () => {
      const info = getMerchantInfo(gameState, 'general');

      assert.ok(info);
      assert.strictEqual(info.id, 'general');
      assert.strictEqual(info.name, 'General Store');
    });

    it('includes favorability', () => {
      gameState.trading.merchantFavorability = { general: 50 };
      const info = getMerchantInfo(gameState, 'general');

      assert.strictEqual(info.favorability, 50);
      assert.ok(info.currentDiscount > 0);
    });

    it('returns null for invalid merchant', () => {
      const info = getMerchantInfo(gameState, 'invalid');
      assert.strictEqual(info, null);
    });
  });
});

describe('Trading System UI', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      trading: initTradingState()
    };
  });

  describe('renderTradingPanel', () => {
    it('renders trading panel', () => {
      const html = renderTradingPanel(gameState, 'player1');

      assert.ok(html.includes('trading-panel'));
      assert.ok(html.includes('Level 1'));
      assert.ok(html.includes('Trades Completed'));
    });

    it('shows active trades', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const html = renderTradingPanel(createResult.state, 'player1');
      assert.ok(html.includes('Pending (1)'));
    });
  });

  describe('renderTradeCard', () => {
    it('renders trade card', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const html = renderTradeCard(createResult.trade, 'player1');

      assert.ok(html.includes('trade-card'));
      assert.ok(html.includes('100'));
      assert.ok(html.includes('gold'));
    });

    it('shows correct buttons for initiator', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const html = renderTradeCard(createResult.trade, 'player1');
      assert.ok(html.includes('Cancel'));
    });

    it('shows correct buttons for receiver', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });

      const html = renderTradeCard(createResult.trade, 'player2');
      assert.ok(html.includes('Accept'));
      assert.ok(html.includes('Decline'));
    });
  });

  describe('renderTradeCreationForm', () => {
    it('renders form', () => {
      const html = renderTradeCreationForm();

      assert.ok(html.includes('trade-creation-form'));
      assert.ok(html.includes('Trade Type'));
      assert.ok(html.includes('Trade With'));
    });

    it('lists trade types', () => {
      const html = renderTradeCreationForm();

      assert.ok(html.includes('Direct Trade'));
      assert.ok(html.includes('Merchant'));
    });

    it('shows available items', () => {
      const items = [{ id: 'sword', name: 'Iron Sword', quantity: 1 }];
      const html = renderTradeCreationForm(items);

      assert.ok(html.includes('Iron Sword'));
    });
  });

  describe('renderMerchantShop', () => {
    it('renders merchant shop', () => {
      const html = renderMerchantShop(gameState, 'general', []);

      assert.ok(html.includes('merchant-shop'));
      assert.ok(html.includes('General Store'));
    });

    it('shows favorability', () => {
      gameState.trading.merchantFavorability = { general: 50 };
      const html = renderMerchantShop(gameState, 'general', []);

      assert.ok(html.includes('50'));
      assert.ok(html.includes('Favorability'));
    });

    it('shows inventory items', () => {
      const inventory = [
        { id: 'sword', name: 'Iron Sword', baseValue: 100, icon: 'S' }
      ];
      const html = renderMerchantShop(gameState, 'general', inventory);

      assert.ok(html.includes('Iron Sword'));
      assert.ok(html.includes('Buy'));
    });

    it('returns error for invalid merchant', () => {
      const html = renderMerchantShop(gameState, 'invalid', []);
      assert.ok(html.includes('error'));
    });
  });

  describe('renderSellInterface', () => {
    it('renders sell interface', () => {
      const html = renderSellInterface(gameState, 'general', []);

      assert.ok(html.includes('sell-interface'));
      assert.ok(html.includes('50%'));
    });

    it('shows player items', () => {
      const items = [
        { id: 'gem', name: 'Ruby', baseValue: 200, icon: 'R', quantity: 3 }
      ];
      const html = renderSellInterface(gameState, 'general', items);

      assert.ok(html.includes('Ruby'));
      assert.ok(html.includes('Sell'));
      assert.ok(html.includes('x3'));
    });
  });

  describe('renderTradeHistory', () => {
    it('renders empty history', () => {
      const html = renderTradeHistory(gameState, 'player1');

      assert.ok(html.includes('trade-history'));
      assert.ok(html.includes('No trade history'));
    });

    it('renders completed trades', () => {
      const createResult = createTrade(gameState, {
        initiator: 'player1',
        receiver: 'player2',
        offeredGold: 100
      });
      const acceptResult = acceptTrade(createResult.state, createResult.trade.id, 'player2');
      const completeResult = completeTrade(acceptResult.state, createResult.trade.id);

      const html = renderTradeHistory(completeResult.state, 'player1');
      assert.ok(html.includes('history-entry'));
      assert.ok(html.includes('Completed'));
    });
  });

  describe('renderMerchantSelection', () => {
    it('renders all merchants', () => {
      const html = renderMerchantSelection(gameState);

      assert.ok(html.includes('merchant-selection'));
      assert.ok(html.includes('General Store'));
      assert.ok(html.includes('Blacksmith'));
      assert.ok(html.includes('Alchemist'));
      assert.ok(html.includes('Jeweler'));
      assert.ok(html.includes('Provisioner'));
      assert.ok(html.includes('Exotic Trader'));
    });

    it('shows buy/sell rates', () => {
      const html = renderMerchantSelection(gameState);

      assert.ok(html.includes('Buys at'));
      assert.ok(html.includes('Sells at'));
    });
  });

  describe('renderBlockedTraders', () => {
    it('renders empty blocked list', () => {
      const html = renderBlockedTraders(gameState);

      assert.ok(html.includes('blocked-traders'));
      assert.ok(html.includes('No blocked traders'));
    });

    it('shows blocked traders', () => {
      gameState.trading.blockedTraders = ['badplayer1', 'badplayer2'];
      const html = renderBlockedTraders(gameState);

      assert.ok(html.includes('badplayer1'));
      assert.ok(html.includes('badplayer2'));
      assert.ok(html.includes('Unblock'));
    });
  });

  describe('renderTradeSettings', () => {
    it('renders settings', () => {
      const html = renderTradeSettings(gameState);

      assert.ok(html.includes('trade-settings'));
      assert.ok(html.includes('allowDirectTrades'));
      assert.ok(html.includes('allowBarterOnly'));
    });

    it('reflects current settings', () => {
      gameState.trading.tradeSettings.allowDirectTrades = false;
      const html = renderTradeSettings(gameState);

      // allowDirectTrades should not have checked attribute
      assert.ok(!html.includes('name="allowDirectTrades" checked'));
    });
  });

  describe('renderTradeNotification', () => {
    it('renders notification', () => {
      const trade = {
        id: 'trade1',
        status: 'completed'
      };

      const html = renderTradeNotification(trade, 'completed');

      assert.ok(html.includes('trade-notification'));
      assert.ok(html.includes('completed successfully'));
    });

    it('shows different messages per type', () => {
      const trade = { id: 'trade1', status: 'pending' };

      const newHtml = renderTradeNotification(trade, 'new');
      assert.ok(newHtml.includes('received'));

      const declinedHtml = renderTradeNotification({ ...trade, status: 'declined' }, 'declined');
      assert.ok(declinedHtml.includes('declined'));
    });
  });

  describe('renderTransactionConfirm', () => {
    it('renders buy confirmation', () => {
      const item = { id: 'sword', name: 'Iron Sword' };
      const html = renderTransactionConfirm('buy', item, 100, 'General Store');

      assert.ok(html.includes('Buy'));
      assert.ok(html.includes('Iron Sword'));
      assert.ok(html.includes('100'));
      assert.ok(html.includes('General Store'));
    });

    it('renders sell confirmation', () => {
      const item = { id: 'gem', name: 'Ruby' };
      const html = renderTransactionConfirm('sell', item, 50, 'Jeweler');

      assert.ok(html.includes('Sell'));
      assert.ok(html.includes('Ruby'));
      assert.ok(html.includes('50'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes trade ID in trade card', () => {
      const trade = {
        id: '<script>alert("xss")</script>',
        initiator: 'player1',
        receiver: 'player2',
        status: 'pending',
        type: 'direct',
        offeredItems: [],
        requestedItems: [],
        offeredGold: 100,
        requestedGold: 0,
        expiresAt: Date.now() + 10000
      };

      const html = renderTradeCard(trade, 'player1');
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes merchant name', () => {
      // Test with valid merchant but potentially malicious inventory
      const inventory = [
        { id: 'item1', name: '<img onerror="alert(1)">', baseValue: 100 }
      ];
      const html = renderMerchantShop(gameState, 'general', inventory);

      assert.ok(!html.includes('<img onerror'));
      assert.ok(html.includes('&lt;img'));
    });

    it('escapes trader IDs in blocked list', () => {
      gameState.trading.blockedTraders = ['<script>evil()</script>'];
      const html = renderBlockedTraders(gameState);

      assert.ok(!html.includes('<script>evil'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
