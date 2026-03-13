/**
 * Trading System UI
 * Renders trading interfaces, merchant shops, and trade history
 */

import {
  TRADE_STATUS,
  TRADE_TYPES,
  MERCHANT_TYPES,
  getTradingStats,
  getActiveTrades,
  getTradeHistory,
  getMerchantInfo
} from './trading-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render the main trading panel
 */
export function renderTradingPanel(state, playerId) {
  const stats = getTradingStats(state);
  const activeTrades = getActiveTrades(state, playerId);

  const pendingTrades = activeTrades.filter(t => t.status === 'pending');
  const acceptedTrades = activeTrades.filter(t => t.status === 'accepted');

  return `
    <div class="trading-panel">
      <div class="trading-header">
        <h2>Trading</h2>
        <div class="trading-level">
          <span class="level-badge">Level ${stats.level}</span>
          <span class="exp-text">${stats.experience} XP</span>
        </div>
      </div>

      <div class="trading-stats">
        <div class="stat">
          <span class="stat-value">${stats.totalCompleted}</span>
          <span class="stat-label">Trades Completed</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.totalGoldTraded.toLocaleString()}</span>
          <span class="stat-label">Gold Traded</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.totalItemsTraded}</span>
          <span class="stat-label">Items Traded</span>
        </div>
      </div>

      <div class="active-trades">
        <h3>Active Trades (${activeTrades.length})</h3>
        ${pendingTrades.length > 0 ? `
          <div class="trade-section">
            <h4>Pending (${pendingTrades.length})</h4>
            ${pendingTrades.map(trade => renderTradeCard(trade, playerId)).join('')}
          </div>
        ` : ''}
        ${acceptedTrades.length > 0 ? `
          <div class="trade-section">
            <h4>Ready to Complete (${acceptedTrades.length})</h4>
            ${acceptedTrades.map(trade => renderTradeCard(trade, playerId)).join('')}
          </div>
        ` : ''}
        ${activeTrades.length === 0 ? '<p class="no-trades">No active trades</p>' : ''}
      </div>

      <div class="trading-actions">
        <button class="btn-primary" data-action="create-trade">Create New Trade</button>
        <button class="btn-secondary" data-action="view-history">View History</button>
      </div>
    </div>
  `;
}

/**
 * Render a single trade card
 */
export function renderTradeCard(trade, currentPlayerId) {
  const isInitiator = trade.initiator === currentPlayerId;
  const statusData = trade.statusData || TRADE_STATUS[trade.status.toUpperCase()];
  const typeData = trade.typeData || TRADE_TYPES[trade.type.toUpperCase()];

  const timeRemaining = trade.expiresAt - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  return `
    <div class="trade-card ${trade.isExpired ? 'expired' : ''}" data-trade-id="${escapeHtml(trade.id)}">
      <div class="trade-header">
        <span class="trade-type">${escapeHtml(typeData.name)}</span>
        <span class="trade-status" style="background-color: ${statusData.color}">
          ${escapeHtml(statusData.name)}
        </span>
      </div>

      <div class="trade-parties">
        <div class="party ${isInitiator ? 'self' : 'other'}">
          <span class="party-label">${isInitiator ? 'You offer' : 'They offer'}</span>
          ${renderTradeContents(trade.offeredItems, trade.offeredGold)}
        </div>
        <div class="trade-arrow">&#8644;</div>
        <div class="party ${!isInitiator ? 'self' : 'other'}">
          <span class="party-label">${isInitiator ? 'You request' : 'They request'}</span>
          ${renderTradeContents(trade.requestedItems, trade.requestedGold)}
        </div>
      </div>

      <div class="trade-footer">
        <span class="trade-time">
          ${trade.isExpired ? 'Expired' : `${hoursRemaining}h ${minutesRemaining}m remaining`}
        </span>
        <div class="trade-actions">
          ${trade.status === 'pending' && !isInitiator ? `
            <button class="btn-accept" data-action="accept-trade" data-trade-id="${escapeHtml(trade.id)}">Accept</button>
            <button class="btn-decline" data-action="decline-trade" data-trade-id="${escapeHtml(trade.id)}">Decline</button>
          ` : ''}
          ${trade.status === 'pending' && isInitiator ? `
            <button class="btn-cancel" data-action="cancel-trade" data-trade-id="${escapeHtml(trade.id)}">Cancel</button>
          ` : ''}
          ${trade.status === 'accepted' ? `
            <button class="btn-complete" data-action="complete-trade" data-trade-id="${escapeHtml(trade.id)}">Complete Trade</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render trade contents (items and gold)
 */
function renderTradeContents(items, gold) {
  const parts = [];

  if (items && items.length > 0) {
    parts.push(`<span class="items-count">${items.length} item${items.length > 1 ? 's' : ''}</span>`);
  }

  if (gold > 0) {
    parts.push(`<span class="gold-amount">${gold.toLocaleString()} gold</span>`);
  }

  if (parts.length === 0) {
    return '<span class="nothing">Nothing</span>';
  }

  return parts.join(' + ');
}

/**
 * Render the trade creation form
 */
export function renderTradeCreationForm(availableItems = []) {
  return `
    <div class="trade-creation-form">
      <h3>Create New Trade</h3>

      <div class="form-section">
        <label>Trade Type</label>
        <select name="tradeType" class="trade-type-select">
          ${Object.values(TRADE_TYPES).map(type => `
            <option value="${type.id}">${escapeHtml(type.name)} - ${escapeHtml(type.description)}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-section">
        <label>Trade With (Player ID)</label>
        <input type="text" name="receiver" placeholder="Enter player ID or name" class="receiver-input" />
      </div>

      <div class="form-section">
        <label>Your Offer</label>
        <div class="offer-section">
          <div class="item-selection">
            ${availableItems.length > 0 ? `
              <select name="offeredItems" multiple class="item-select">
                ${availableItems.map(item => `
                  <option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (x${item.quantity || 1})</option>
                `).join('')}
              </select>
            ` : '<p class="no-items">No items available</p>'}
          </div>
          <div class="gold-input">
            <label>Gold:</label>
            <input type="number" name="offeredGold" min="0" value="0" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <label>Your Request</label>
        <div class="request-section">
          <textarea name="requestedItemsDescription" placeholder="Describe items you want..."></textarea>
          <div class="gold-input">
            <label>Gold:</label>
            <input type="number" name="requestedGold" min="0" value="0" />
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-primary" data-action="submit-trade">Send Trade Offer</button>
        <button class="btn-secondary" data-action="cancel-creation">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render the merchant shop interface
 */
export function renderMerchantShop(state, merchantType, inventory = []) {
  const merchantInfo = getMerchantInfo(state, merchantType);

  if (!merchantInfo) {
    return '<div class="error">Unknown merchant</div>';
  }

  return `
    <div class="merchant-shop" data-merchant-type="${escapeHtml(merchantType)}">
      <div class="merchant-header">
        <h2>${escapeHtml(merchantInfo.name)}</h2>
        <div class="merchant-favor">
          <span class="favor-label">Favorability:</span>
          <span class="favor-value">${merchantInfo.favorability}</span>
          ${merchantInfo.currentDiscount > 0 ? `
            <span class="discount-badge">${(merchantInfo.currentDiscount * 100).toFixed(1)}% discount</span>
          ` : ''}
        </div>
      </div>

      <div class="merchant-info">
        <div class="rate-info">
          <span class="buy-rate">Buy at: ${(merchantInfo.effectiveBuyMultiplier * 100).toFixed(0)}%</span>
          <span class="sell-rate">Sell at: ${(merchantInfo.effectiveSellMultiplier * 100).toFixed(0)}%</span>
        </div>
        ${merchantInfo.categories ? `
          <div class="specialties">
            Specializes in: ${merchantInfo.categories.map(c => escapeHtml(c)).join(', ')}
          </div>
        ` : ''}
      </div>

      <div class="merchant-inventory">
        <h3>Available Items</h3>
        ${inventory.length > 0 ? `
          <div class="item-grid">
            ${inventory.map(item => renderMerchantItem(item, merchantInfo)).join('')}
          </div>
        ` : '<p class="empty-inventory">No items for sale</p>'}
      </div>

      <div class="shop-actions">
        <button class="btn-secondary" data-action="sell-items">Sell Your Items</button>
        <button class="btn-secondary" data-action="leave-shop">Leave Shop</button>
      </div>
    </div>
  `;
}

/**
 * Render a single merchant item
 */
function renderMerchantItem(item, merchantInfo) {
  const sellPrice = Math.floor(item.baseValue * merchantInfo.effectiveSellMultiplier);

  return `
    <div class="merchant-item" data-item-id="${escapeHtml(item.id)}">
      <div class="item-icon">${item.icon || '?'}</div>
      <div class="item-details">
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-price">${sellPrice.toLocaleString()} gold</span>
      </div>
      <button class="btn-buy" data-action="buy-item" data-item-id="${escapeHtml(item.id)}" data-price="${sellPrice}">
        Buy
      </button>
    </div>
  `;
}

/**
 * Render the sell items interface
 */
export function renderSellInterface(state, merchantType, playerItems = []) {
  const merchantInfo = getMerchantInfo(state, merchantType);

  if (!merchantInfo) {
    return '<div class="error">Unknown merchant</div>';
  }

  return `
    <div class="sell-interface" data-merchant-type="${escapeHtml(merchantType)}">
      <h3>Sell Items to ${escapeHtml(merchantInfo.name)}</h3>

      <div class="sell-rate-info">
        <p>This merchant buys at <strong>${(merchantInfo.effectiveBuyMultiplier * 100).toFixed(0)}%</strong> of base value</p>
      </div>

      <div class="player-items">
        ${playerItems.length > 0 ? `
          <div class="item-grid">
            ${playerItems.map(item => renderSellableItem(item, merchantInfo)).join('')}
          </div>
        ` : '<p class="no-items">You have no items to sell</p>'}
      </div>

      <div class="sell-actions">
        <button class="btn-secondary" data-action="back-to-shop">Back to Shop</button>
      </div>
    </div>
  `;
}

/**
 * Render a sellable item
 */
function renderSellableItem(item, merchantInfo) {
  const buyPrice = Math.floor(item.baseValue * merchantInfo.effectiveBuyMultiplier);

  return `
    <div class="sellable-item" data-item-id="${escapeHtml(item.id)}">
      <div class="item-icon">${item.icon || '?'}</div>
      <div class="item-details">
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-quantity">x${item.quantity || 1}</span>
        <span class="item-price">Sells for: ${buyPrice.toLocaleString()} gold</span>
      </div>
      <button class="btn-sell" data-action="sell-item" data-item-id="${escapeHtml(item.id)}" data-price="${buyPrice}">
        Sell
      </button>
    </div>
  `;
}

/**
 * Render trade history
 */
export function renderTradeHistory(state, playerId, limit = 20) {
  const history = getTradeHistory(state, playerId, limit);

  return `
    <div class="trade-history">
      <h3>Trade History</h3>

      ${history.length > 0 ? `
        <div class="history-list">
          ${history.map(trade => renderHistoryEntry(trade, playerId)).join('')}
        </div>
      ` : '<p class="no-history">No trade history</p>'}

      <div class="history-actions">
        <button class="btn-secondary" data-action="back-to-trading">Back to Trading</button>
      </div>
    </div>
  `;
}

/**
 * Render a single history entry
 */
function renderHistoryEntry(trade, currentPlayerId) {
  const isInitiator = trade.initiator === currentPlayerId;
  const statusData = trade.statusData || TRADE_STATUS[trade.status.toUpperCase()];
  const typeData = trade.typeData || TRADE_TYPES[trade.type.toUpperCase()];

  const completedDate = trade.completedAt || trade.declinedAt || trade.cancelledAt || trade.expiredAt;
  const dateStr = completedDate ? new Date(completedDate).toLocaleDateString() : 'Unknown';

  return `
    <div class="history-entry">
      <div class="history-header">
        <span class="history-date">${dateStr}</span>
        <span class="history-type">${escapeHtml(typeData.name)}</span>
        <span class="history-status" style="color: ${statusData.color}">
          ${escapeHtml(statusData.name)}
        </span>
      </div>
      <div class="history-summary">
        <span>${isInitiator ? 'You' : 'They'} offered: ${renderTradeContents(trade.offeredItems, trade.offeredGold)}</span>
        <span>${isInitiator ? 'You' : 'They'} requested: ${renderTradeContents(trade.requestedItems, trade.requestedGold)}</span>
      </div>
    </div>
  `;
}

/**
 * Render merchant selection screen
 */
export function renderMerchantSelection(state) {
  const stats = getTradingStats(state);

  return `
    <div class="merchant-selection">
      <h2>Visit a Merchant</h2>

      <div class="merchant-grid">
        ${Object.values(MERCHANT_TYPES).map(merchant => {
          const info = getMerchantInfo(state, merchant.id);
          return `
            <div class="merchant-card" data-merchant="${escapeHtml(merchant.id)}">
              <h3>${escapeHtml(merchant.name)}</h3>
              <div class="merchant-rates">
                <span>Buys at ${(merchant.buyMultiplier * 100).toFixed(0)}%</span>
                <span>Sells at ${(merchant.sellMultiplier * 100).toFixed(0)}%</span>
              </div>
              ${merchant.categories ? `
                <p class="specialties">${merchant.categories.join(', ')}</p>
              ` : '<p class="specialties">General goods</p>'}
              ${info && info.favorability > 0 ? `
                <span class="favor-badge">Favor: ${info.favorability}</span>
              ` : ''}
              <button class="btn-visit" data-action="visit-merchant" data-merchant="${escapeHtml(merchant.id)}">
                Visit
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render blocked traders list
 */
export function renderBlockedTraders(state) {
  const stats = getTradingStats(state);
  const tradingState = state.trading || {};
  const blockedTraders = tradingState.blockedTraders || [];

  return `
    <div class="blocked-traders">
      <h3>Blocked Traders (${blockedTraders.length})</h3>

      ${blockedTraders.length > 0 ? `
        <ul class="blocked-list">
          ${blockedTraders.map(traderId => `
            <li class="blocked-entry">
              <span class="trader-id">${escapeHtml(traderId)}</span>
              <button class="btn-unblock" data-action="unblock-trader" data-trader-id="${escapeHtml(traderId)}">
                Unblock
              </button>
            </li>
          `).join('')}
        </ul>
      ` : '<p class="no-blocked">No blocked traders</p>'}

      <div class="block-actions">
        <input type="text" name="traderToBlock" placeholder="Enter player ID to block" />
        <button class="btn-block" data-action="block-trader">Block</button>
      </div>
    </div>
  `;
}

/**
 * Render trade settings
 */
export function renderTradeSettings(state) {
  const tradingState = state.trading || {};
  const settings = tradingState.tradeSettings || {};

  return `
    <div class="trade-settings">
      <h3>Trade Settings</h3>

      <div class="setting-row">
        <label>
          <input type="checkbox" name="allowDirectTrades" ${settings.allowDirectTrades !== false ? 'checked' : ''} />
          Allow direct trades from other players
        </label>
      </div>

      <div class="setting-row">
        <label>
          <input type="checkbox" name="allowBarterOnly" ${settings.allowBarterOnly ? 'checked' : ''} />
          Barter only (no gold trades)
        </label>
      </div>

      <div class="setting-row">
        <label>Auto-decline trades below value:</label>
        <input type="number" name="autoDeclineBelow" min="0" value="${settings.autoDeclineBelow || 0}" />
        <span>gold</span>
      </div>

      <div class="settings-actions">
        <button class="btn-primary" data-action="save-settings">Save Settings</button>
      </div>
    </div>
  `;
}

/**
 * Render trade notification
 */
export function renderTradeNotification(trade, type = 'new') {
  const statusData = TRADE_STATUS[trade.status.toUpperCase()];

  const messages = {
    new: 'New trade offer received!',
    accepted: 'Your trade has been accepted!',
    declined: 'Your trade was declined.',
    completed: 'Trade completed successfully!',
    expired: 'A trade has expired.',
    modified: 'A trade has been modified.'
  };

  return `
    <div class="trade-notification ${type}">
      <span class="notification-icon">${type === 'completed' ? '&#10003;' : type === 'declined' ? '&#10007;' : '&#9733;'}</span>
      <span class="notification-message">${messages[type] || 'Trade update'}</span>
      <span class="notification-status" style="color: ${statusData?.color || '#888'}">
        ${escapeHtml(statusData?.name || trade.status)}
      </span>
    </div>
  `;
}

/**
 * Render transaction confirmation dialog
 */
export function renderTransactionConfirm(action, item, price, merchantName) {
  const actionText = action === 'buy' ? 'Buy' : 'Sell';
  const preposition = action === 'buy' ? 'from' : 'to';

  return `
    <div class="transaction-confirm">
      <h4>${actionText} Confirmation</h4>
      <p>${actionText} <strong>${escapeHtml(item.name)}</strong> ${preposition} ${escapeHtml(merchantName)}?</p>
      <p class="price">Price: <strong>${price.toLocaleString()}</strong> gold</p>
      <div class="confirm-actions">
        <button class="btn-primary" data-action="confirm-transaction">Confirm</button>
        <button class="btn-secondary" data-action="cancel-transaction">Cancel</button>
      </div>
    </div>
  `;
}
