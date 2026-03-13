/**
 * Trading System
 * Manages player-to-player and NPC trading, offers, and trade history
 */

// Trade status
export const TRADE_STATUS = {
  PENDING: { id: 'pending', name: 'Pending', color: '#FFAA00' },
  ACCEPTED: { id: 'accepted', name: 'Accepted', color: '#00AA00' },
  DECLINED: { id: 'declined', name: 'Declined', color: '#FF0000' },
  CANCELLED: { id: 'cancelled', name: 'Cancelled', color: '#888888' },
  COMPLETED: { id: 'completed', name: 'Completed', color: '#00FF00' },
  EXPIRED: { id: 'expired', name: 'Expired', color: '#666666' }
};

// Trade types
export const TRADE_TYPES = {
  DIRECT: { id: 'direct', name: 'Direct Trade', description: 'Trade directly with another player' },
  MERCHANT: { id: 'merchant', name: 'Merchant', description: 'Buy or sell with NPC merchants' },
  AUCTION: { id: 'auction', name: 'Auction', description: 'List items for bidding' },
  BARTER: { id: 'barter', name: 'Barter', description: 'Exchange items without gold' }
};

// Merchant types
export const MERCHANT_TYPES = {
  GENERAL: { id: 'general', name: 'General Store', buyMultiplier: 0.5, sellMultiplier: 1.0 },
  BLACKSMITH: { id: 'blacksmith', name: 'Blacksmith', buyMultiplier: 0.6, sellMultiplier: 0.9, categories: ['weapons', 'armor'] },
  ALCHEMIST: { id: 'alchemist', name: 'Alchemist', buyMultiplier: 0.7, sellMultiplier: 0.85, categories: ['potions', 'ingredients'] },
  JEWELER: { id: 'jeweler', name: 'Jeweler', buyMultiplier: 0.55, sellMultiplier: 1.1, categories: ['gems', 'accessories'] },
  PROVISIONER: { id: 'provisioner', name: 'Provisioner', buyMultiplier: 0.4, sellMultiplier: 1.0, categories: ['food', 'supplies'] },
  EXOTIC: { id: 'exotic', name: 'Exotic Trader', buyMultiplier: 0.8, sellMultiplier: 0.7, categories: ['rare', 'legendary'] }
};

// Default trade expiration (24 hours in ms)
const DEFAULT_TRADE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Initialize trading state
 */
export function initTradingState() {
  return {
    activeTrades: [], // { id, type, initiator, receiver, offeredItems, requestedItems, offeredGold, requestedGold, status, createdAt, expiresAt }
    tradeHistory: [],
    merchantFavorability: {}, // merchantId -> favorability score
    totalTradesCompleted: 0,
    totalGoldTraded: 0,
    totalItemsTraded: 0,
    tradingLevel: 1,
    tradingExp: 0,
    blockedTraders: [],
    tradeSettings: {
      autoDeclineBelow: 0,
      allowDirectTrades: true,
      allowBarterOnly: false
    }
  };
}

/**
 * Get trading state from game state
 */
export function getTradingState(state) {
  return state.trading || initTradingState();
}

/**
 * Create a new trade offer
 */
export function createTrade(state, options) {
  const {
    type = 'direct',
    initiator,
    receiver,
    offeredItems = [],
    requestedItems = [],
    offeredGold = 0,
    requestedGold = 0,
    expiresIn = DEFAULT_TRADE_EXPIRATION
  } = options;

  if (!initiator) {
    return { state, created: false, error: 'Initiator required' };
  }

  if (type === 'direct' && !receiver) {
    return { state, created: false, error: 'Receiver required for direct trades' };
  }

  if (offeredItems.length === 0 && requestedItems.length === 0 && offeredGold === 0 && requestedGold === 0) {
    return { state, created: false, error: 'Trade must include items or gold' };
  }

  const tradingState = getTradingState(state);

  // Check if trading is blocked
  if (receiver && tradingState.blockedTraders.includes(receiver)) {
    return { state, created: false, error: 'Cannot trade with blocked player' };
  }

  const trade = {
    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    initiator,
    receiver,
    offeredItems: [...offeredItems],
    requestedItems: [...requestedItems],
    offeredGold,
    requestedGold,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresIn,
    messages: []
  };

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: [...tradingState.activeTrades, trade]
      }
    },
    created: true,
    trade
  };
}

/**
 * Accept a trade offer
 */
export function acceptTrade(state, tradeId, acceptor) {
  const tradingState = getTradingState(state);
  const tradeIndex = tradingState.activeTrades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return { state, accepted: false, error: 'Trade not found' };
  }

  const trade = tradingState.activeTrades[tradeIndex];

  if (trade.status !== 'pending') {
    return { state, accepted: false, error: 'Trade is not pending' };
  }

  if (trade.receiver && trade.receiver !== acceptor) {
    return { state, accepted: false, error: 'Not authorized to accept this trade' };
  }

  if (Date.now() > trade.expiresAt) {
    return expireTrade(state, tradeId);
  }

  const updatedTrade = {
    ...trade,
    status: 'accepted',
    acceptedAt: Date.now(),
    acceptedBy: acceptor
  };

  const updatedTrades = [...tradingState.activeTrades];
  updatedTrades[tradeIndex] = updatedTrade;

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: updatedTrades
      }
    },
    accepted: true,
    trade: updatedTrade
  };
}

/**
 * Decline a trade offer
 */
export function declineTrade(state, tradeId, decliner, reason = null) {
  const tradingState = getTradingState(state);
  const tradeIndex = tradingState.activeTrades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return { state, declined: false, error: 'Trade not found' };
  }

  const trade = tradingState.activeTrades[tradeIndex];

  if (trade.status !== 'pending') {
    return { state, declined: false, error: 'Trade is not pending' };
  }

  const updatedTrade = {
    ...trade,
    status: 'declined',
    declinedAt: Date.now(),
    declinedBy: decliner,
    declineReason: reason
  };

  const updatedTrades = [...tradingState.activeTrades];
  updatedTrades[tradeIndex] = updatedTrade;

  // Move to history
  const newHistory = [...tradingState.tradeHistory, updatedTrade];

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: updatedTrades.filter(t => t.id !== tradeId),
        tradeHistory: newHistory.slice(-100) // Keep last 100 trades
      }
    },
    declined: true,
    trade: updatedTrade
  };
}

/**
 * Cancel a trade offer
 */
export function cancelTrade(state, tradeId, canceller) {
  const tradingState = getTradingState(state);
  const tradeIndex = tradingState.activeTrades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return { state, cancelled: false, error: 'Trade not found' };
  }

  const trade = tradingState.activeTrades[tradeIndex];

  if (trade.initiator !== canceller) {
    return { state, cancelled: false, error: 'Only initiator can cancel' };
  }

  if (trade.status === 'completed') {
    return { state, cancelled: false, error: 'Cannot cancel completed trade' };
  }

  const updatedTrade = {
    ...trade,
    status: 'cancelled',
    cancelledAt: Date.now()
  };

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: tradingState.activeTrades.filter(t => t.id !== tradeId),
        tradeHistory: [...tradingState.tradeHistory, updatedTrade].slice(-100)
      }
    },
    cancelled: true,
    trade: updatedTrade
  };
}

/**
 * Complete a trade (execute the exchange)
 */
export function completeTrade(state, tradeId) {
  const tradingState = getTradingState(state);
  const tradeIndex = tradingState.activeTrades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return { state, completed: false, error: 'Trade not found' };
  }

  const trade = tradingState.activeTrades[tradeIndex];

  if (trade.status !== 'accepted') {
    return { state, completed: false, error: 'Trade must be accepted first' };
  }

  const totalGold = trade.offeredGold + trade.requestedGold;
  const totalItems = trade.offeredItems.length + trade.requestedItems.length;

  // Calculate experience
  const expGained = Math.floor(10 + totalGold / 100 + totalItems * 5);
  const newExp = tradingState.tradingExp + expGained;
  const newLevel = calculateTradingLevel(newExp);
  const leveledUp = newLevel > tradingState.tradingLevel;

  const completedTrade = {
    ...trade,
    status: 'completed',
    completedAt: Date.now()
  };

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: tradingState.activeTrades.filter(t => t.id !== tradeId),
        tradeHistory: [...tradingState.tradeHistory, completedTrade].slice(-100),
        totalTradesCompleted: tradingState.totalTradesCompleted + 1,
        totalGoldTraded: tradingState.totalGoldTraded + totalGold,
        totalItemsTraded: tradingState.totalItemsTraded + totalItems,
        tradingExp: newExp,
        tradingLevel: newLevel
      }
    },
    completed: true,
    trade: completedTrade,
    expGained,
    leveledUp,
    newLevel
  };
}

/**
 * Expire a trade
 */
export function expireTrade(state, tradeId) {
  const tradingState = getTradingState(state);
  const tradeIndex = tradingState.activeTrades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return { state, expired: false, error: 'Trade not found' };
  }

  const trade = tradingState.activeTrades[tradeIndex];

  const expiredTrade = {
    ...trade,
    status: 'expired',
    expiredAt: Date.now()
  };

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: tradingState.activeTrades.filter(t => t.id !== tradeId),
        tradeHistory: [...tradingState.tradeHistory, expiredTrade].slice(-100)
      }
    },
    expired: true,
    trade: expiredTrade
  };
}

/**
 * Modify a pending trade offer
 */
export function modifyTrade(state, tradeId, modifications, modifier) {
  const tradingState = getTradingState(state);
  const tradeIndex = tradingState.activeTrades.findIndex(t => t.id === tradeId);

  if (tradeIndex === -1) {
    return { state, modified: false, error: 'Trade not found' };
  }

  const trade = tradingState.activeTrades[tradeIndex];

  if (trade.status !== 'pending') {
    return { state, modified: false, error: 'Can only modify pending trades' };
  }

  if (trade.initiator !== modifier && trade.receiver !== modifier) {
    return { state, modified: false, error: 'Not authorized to modify this trade' };
  }

  const updatedTrade = {
    ...trade,
    ...modifications,
    modifiedAt: Date.now(),
    modifiedBy: modifier
  };

  const updatedTrades = [...tradingState.activeTrades];
  updatedTrades[tradeIndex] = updatedTrade;

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: updatedTrades
      }
    },
    modified: true,
    trade: updatedTrade
  };
}

/**
 * Trade with a merchant (buy)
 */
export function buyFromMerchant(state, merchantType, itemId, itemValue, quantity = 1) {
  const merchant = MERCHANT_TYPES[merchantType.toUpperCase()];
  if (!merchant) {
    return { state, bought: false, error: 'Invalid merchant type' };
  }

  const tradingState = getTradingState(state);
  const favorability = tradingState.merchantFavorability[merchantType] || 0;
  const discountFromFavor = Math.min(0.1, favorability / 1000); // Max 10% discount

  const price = Math.floor(itemValue * merchant.sellMultiplier * (1 - discountFromFavor) * quantity);

  // Increase favorability
  const newFavorability = (tradingState.merchantFavorability[merchantType] || 0) + quantity;

  // Experience
  const expGained = Math.floor(5 + price / 50);
  const newExp = tradingState.tradingExp + expGained;
  const newLevel = calculateTradingLevel(newExp);

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        merchantFavorability: {
          ...tradingState.merchantFavorability,
          [merchantType]: newFavorability
        },
        totalGoldTraded: tradingState.totalGoldTraded + price,
        totalItemsTraded: tradingState.totalItemsTraded + quantity,
        tradingExp: newExp,
        tradingLevel: newLevel
      }
    },
    bought: true,
    itemId,
    quantity,
    totalPrice: price,
    discount: discountFromFavor,
    expGained
  };
}

/**
 * Trade with a merchant (sell)
 */
export function sellToMerchant(state, merchantType, itemId, itemValue, quantity = 1) {
  const merchant = MERCHANT_TYPES[merchantType.toUpperCase()];
  if (!merchant) {
    return { state, sold: false, error: 'Invalid merchant type' };
  }

  const tradingState = getTradingState(state);
  const favorability = tradingState.merchantFavorability[merchantType] || 0;
  const bonusFromFavor = Math.min(0.1, favorability / 1000); // Max 10% bonus

  const price = Math.floor(itemValue * merchant.buyMultiplier * (1 + bonusFromFavor) * quantity);

  // Increase favorability
  const newFavorability = (tradingState.merchantFavorability[merchantType] || 0) + quantity;

  // Experience
  const expGained = Math.floor(3 + price / 100);
  const newExp = tradingState.tradingExp + expGained;
  const newLevel = calculateTradingLevel(newExp);

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        merchantFavorability: {
          ...tradingState.merchantFavorability,
          [merchantType]: newFavorability
        },
        totalGoldTraded: tradingState.totalGoldTraded + price,
        totalItemsTraded: tradingState.totalItemsTraded + quantity,
        tradingExp: newExp,
        tradingLevel: newLevel
      }
    },
    sold: true,
    itemId,
    quantity,
    totalPrice: price,
    bonus: bonusFromFavor,
    expGained
  };
}

/**
 * Block a trader
 */
export function blockTrader(state, traderId) {
  const tradingState = getTradingState(state);

  if (tradingState.blockedTraders.includes(traderId)) {
    return { state, blocked: false, alreadyBlocked: true };
  }

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        blockedTraders: [...tradingState.blockedTraders, traderId]
      }
    },
    blocked: true
  };
}

/**
 * Unblock a trader
 */
export function unblockTrader(state, traderId) {
  const tradingState = getTradingState(state);

  if (!tradingState.blockedTraders.includes(traderId)) {
    return { state, unblocked: false, notBlocked: true };
  }

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        blockedTraders: tradingState.blockedTraders.filter(id => id !== traderId)
      }
    },
    unblocked: true
  };
}

/**
 * Update trade settings
 */
export function updateTradeSettings(state, settings) {
  const tradingState = getTradingState(state);

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        tradeSettings: {
          ...tradingState.tradeSettings,
          ...settings
        }
      }
    },
    updated: true
  };
}

/**
 * Calculate trading level from experience
 */
export function calculateTradingLevel(experience) {
  let level = 1;
  let requiredExp = 0;

  while (experience >= requiredExp + level * 75) {
    requiredExp += level * 75;
    level++;
    if (level >= 25) break;
  }

  return level;
}

/**
 * Get trading statistics
 */
export function getTradingStats(state) {
  const tradingState = getTradingState(state);

  const pendingTrades = tradingState.activeTrades.filter(t => t.status === 'pending').length;
  const acceptedTrades = tradingState.activeTrades.filter(t => t.status === 'accepted').length;

  return {
    level: tradingState.tradingLevel,
    experience: tradingState.tradingExp,
    totalCompleted: tradingState.totalTradesCompleted,
    totalGoldTraded: tradingState.totalGoldTraded,
    totalItemsTraded: tradingState.totalItemsTraded,
    pendingTrades,
    acceptedTrades,
    blockedCount: tradingState.blockedTraders.length,
    merchantFavorability: { ...tradingState.merchantFavorability }
  };
}

/**
 * Get active trades
 */
export function getActiveTrades(state, playerId = null) {
  const tradingState = getTradingState(state);

  let trades = tradingState.activeTrades;

  if (playerId) {
    trades = trades.filter(t => t.initiator === playerId || t.receiver === playerId);
  }

  return trades.map(trade => ({
    ...trade,
    statusData: TRADE_STATUS[trade.status.toUpperCase()],
    typeData: TRADE_TYPES[trade.type.toUpperCase()],
    isExpired: Date.now() > trade.expiresAt
  }));
}

/**
 * Get trade history
 */
export function getTradeHistory(state, playerId = null, limit = 20) {
  const tradingState = getTradingState(state);

  let history = tradingState.tradeHistory;

  if (playerId) {
    history = history.filter(t => t.initiator === playerId || t.receiver === playerId);
  }

  return history.slice(-limit).reverse().map(trade => ({
    ...trade,
    statusData: TRADE_STATUS[trade.status.toUpperCase()],
    typeData: TRADE_TYPES[trade.type.toUpperCase()]
  }));
}

/**
 * Clean up expired trades
 */
export function cleanupExpiredTrades(state) {
  const tradingState = getTradingState(state);
  const now = Date.now();

  const expiredTrades = tradingState.activeTrades.filter(t =>
    t.status === 'pending' && now > t.expiresAt
  );

  if (expiredTrades.length === 0) {
    return { state, cleaned: 0 };
  }

  const expiredWithStatus = expiredTrades.map(t => ({
    ...t,
    status: 'expired',
    expiredAt: now
  }));

  return {
    state: {
      ...state,
      trading: {
        ...tradingState,
        activeTrades: tradingState.activeTrades.filter(t =>
          !(t.status === 'pending' && now > t.expiresAt)
        ),
        tradeHistory: [...tradingState.tradeHistory, ...expiredWithStatus].slice(-100)
      }
    },
    cleaned: expiredTrades.length
  };
}

/**
 * Get merchant info with player's favorability
 */
export function getMerchantInfo(state, merchantType) {
  const merchant = MERCHANT_TYPES[merchantType.toUpperCase()];
  if (!merchant) return null;

  const tradingState = getTradingState(state);
  const favorability = tradingState.merchantFavorability[merchantType] || 0;
  const discount = Math.min(0.1, favorability / 1000);

  return {
    ...merchant,
    favorability,
    currentDiscount: discount,
    effectiveBuyMultiplier: merchant.buyMultiplier * (1 + discount),
    effectiveSellMultiplier: merchant.sellMultiplier * (1 - discount)
  };
}
