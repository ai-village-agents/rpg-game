/**
 * Shop System UI Components
 * UI for buying and selling items
 */

import {
  SHOP_TYPES,
  getItemPrice,
  getSellPrice,
  calculateCartTotal,
  calculateSellTotal,
  getShopInventory,
  getBuybackItems,
  getDiscount,
  getShopStats
} from './shop-system.js';

// HTML escape helper
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render shop panel
export function renderShopPanel(state, registry, itemData = {}, playerGold = 0) {
  if (!state.activeShop) {
    return '<p class="no-shop">No shop open</p>';
  }

  const shop = registry.shops[state.activeShop];
  const typeInfo = SHOP_TYPES[shop.type];
  const discount = getDiscount(state, state.activeShop);

  return `
    <div class="shop-panel">
      <div class="shop-header">
        <span class="shop-icon">${typeInfo?.icon || '🏪'}</span>
        <h2 class="shop-name">${escapeHtml(shop.name)}</h2>
        ${discount > 0 ? `<span class="shop-discount">-${discount}% OFF!</span>` : ''}
      </div>

      <div class="shop-tabs">
        <button class="shop-tab active" data-tab="buy">Buy</button>
        <button class="shop-tab" data-tab="sell">Sell</button>
        ${shop.buybackEnabled ? '<button class="shop-tab" data-tab="buyback">Buyback</button>' : ''}
      </div>

      <div class="shop-content">
        <div class="shop-tab-content active" data-tab="buy">
          ${renderBuyTab(state, registry, shop, itemData)}
        </div>
        <div class="shop-tab-content" data-tab="sell">
          ${renderSellTab(state, registry, shop, itemData)}
        </div>
        ${shop.buybackEnabled ? `
          <div class="shop-tab-content" data-tab="buyback">
            ${renderBuybackTab(state, itemData)}
          </div>
        ` : ''}
      </div>

      <div class="shop-footer">
        <span class="player-gold">💰 ${playerGold} gold</span>
        <button class="btn-close-shop" data-action="close">Close Shop</button>
      </div>
    </div>
  `;
}

// Render buy tab
function renderBuyTab(state, registry, shop, itemData) {
  const inventory = getShopInventory(registry, shop.id);
  const cartTotal = calculateCartTotal(state, registry);

  const items = inventory.map(item => {
    const data = itemData[item.itemId] || { name: item.itemId };
    const price = getItemPrice(state, registry, shop.id, item.itemId);
    const inCart = state.cart.find(c => c.itemId === item.itemId)?.quantity || 0;
    const stockText = item.stock === -1 ? '∞' : item.stock;

    return `
      <div class="shop-item" data-item-id="${escapeHtml(item.itemId)}">
        <div class="item-info">
          <span class="item-name">${escapeHtml(data.name)}</span>
          <span class="item-stock">Stock: ${stockText}</span>
        </div>
        <div class="item-actions">
          <span class="item-price">${price} 💰</span>
          <div class="quantity-controls">
            <button class="btn-remove" data-action="remove-from-cart" ${inCart === 0 ? 'disabled' : ''}>-</button>
            <span class="quantity">${inCart}</span>
            <button class="btn-add" data-action="add-to-cart">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="buy-section">
      <div class="shop-items">${items || '<p>No items available</p>'}</div>
      <div class="cart-summary">
        <span class="cart-label">Cart Total:</span>
        <span class="cart-total">${cartTotal} 💰</span>
        <button class="btn-purchase" data-action="purchase" ${state.cart.length === 0 ? 'disabled' : ''}>
          Purchase
        </button>
      </div>
    </div>
  `;
}

// Render sell tab
function renderSellTab(state, registry, shop, itemData) {
  const sellTotal = calculateSellTotal(state, registry, Object.fromEntries(
    Object.entries(itemData).map(([id, data]) => [id, data.value || 0])
  ));

  // Note: In real implementation, this would show player inventory
  const sellListItems = state.sellList.map(item => {
    const data = itemData[item.itemId] || { name: item.itemId, value: 0 };
    const price = getSellPrice(registry, shop.id, item.itemId, item.quantity, data.value);

    return `
      <div class="sell-item" data-item-id="${escapeHtml(item.itemId)}">
        <span class="item-name">${escapeHtml(data.name)} x${item.quantity}</span>
        <span class="item-price">${price} 💰</span>
        <button class="btn-remove-sell" data-action="remove-from-sell">Remove</button>
      </div>
    `;
  }).join('');

  return `
    <div class="sell-section">
      <p class="sell-info">Sell rate: ${Math.round(shop.sellPriceMultiplier * 100)}% of base value</p>
      <div class="sell-list">
        ${sellListItems || '<p class="no-sell-items">No items to sell</p>'}
      </div>
      <div class="sell-summary">
        <span class="sell-label">Total Value:</span>
        <span class="sell-total">${sellTotal} 💰</span>
        <button class="btn-sell" data-action="sell" ${state.sellList.length === 0 ? 'disabled' : ''}>
          Sell All
        </button>
      </div>
    </div>
  `;
}

// Render buyback tab
function renderBuybackTab(state, itemData) {
  const buybackItems = getBuybackItems(state);

  if (buybackItems.length === 0) {
    return '<p class="no-buyback">No items to buy back</p>';
  }

  const items = buybackItems.map((item, index) => {
    const data = itemData[item.itemId] || { name: item.itemId };

    return `
      <div class="buyback-item" data-index="${index}">
        <span class="item-name">${escapeHtml(data.name)} x${item.quantity}</span>
        <span class="buyback-price">${item.buybackPrice} 💰</span>
        <button class="btn-buyback" data-action="buyback">Buy Back</button>
      </div>
    `;
  }).join('');

  return `
    <div class="buyback-section">
      <p class="buyback-info">Recently sold items available for buyback</p>
      <div class="buyback-list">${items}</div>
    </div>
  `;
}

// Render item tooltip
export function renderItemTooltip(itemData) {
  return `
    <div class="item-tooltip">
      <h4 class="tooltip-name">${escapeHtml(itemData.name)}</h4>
      ${itemData.description ? `<p class="tooltip-desc">${escapeHtml(itemData.description)}</p>` : ''}
      <div class="tooltip-stats">
        ${itemData.type ? `<span>Type: ${escapeHtml(itemData.type)}</span>` : ''}
        ${itemData.value ? `<span>Value: ${itemData.value} 💰</span>` : ''}
      </div>
    </div>
  `;
}

// Render shop list (for world map)
export function renderShopList(registry) {
  const shops = Object.values(registry.shops);

  if (shops.length === 0) {
    return '<p>No shops available</p>';
  }

  const items = shops.map(shop => {
    const typeInfo = SHOP_TYPES[shop.type];

    return `
      <div class="shop-list-item" data-shop-id="${escapeHtml(shop.id)}">
        <span class="shop-icon">${typeInfo?.icon || '🏪'}</span>
        <div class="shop-info">
          <span class="shop-name">${escapeHtml(shop.name)}</span>
          <span class="shop-type">${escapeHtml(typeInfo?.name || shop.type)}</span>
        </div>
        <button class="btn-visit-shop" data-action="open">Visit</button>
      </div>
    `;
  }).join('');

  return `<div class="shop-list">${items}</div>`;
}

// Render transaction notification
export function renderTransactionNotification(type, goldAmount, items) {
  const icon = type === 'buy' ? '🛒' : '💰';
  const action = type === 'buy' ? 'Purchased' : 'Sold';
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return `
    <div class="transaction-notification transaction-${escapeHtml(type)}">
      <span class="notification-icon">${icon}</span>
      <div class="notification-content">
        <span class="notification-title">${action} ${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
        <span class="notification-gold">${type === 'buy' ? '-' : '+'}${goldAmount} 💰</span>
      </div>
    </div>
  `;
}

// Render shop stats panel
export function renderShopStatsPanel(state) {
  const stats = getShopStats(state);

  return `
    <div class="shop-stats-panel">
      <h4>Shopping Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.totalPurchases}</span>
          <span class="stat-label">Purchases</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.totalSales}</span>
          <span class="stat-label">Sales</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.goldSpent}</span>
          <span class="stat-label">Gold Spent</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.goldEarned}</span>
          <span class="stat-label">Gold Earned</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.itemsBought}</span>
          <span class="stat-label">Items Bought</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.itemsSold}</span>
          <span class="stat-label">Items Sold</span>
        </div>
      </div>
      <div class="net-gold ${stats.netGold >= 0 ? 'positive' : 'negative'}">
        Net: ${stats.netGold >= 0 ? '+' : ''}${stats.netGold} 💰
      </div>
    </div>
  `;
}

// Get shop styles
export function getShopStyles() {
  return `
    .shop-panel { background: #2a2a2a; border-radius: 12px; padding: 20px; max-width: 600px; margin: 0 auto; }
    .shop-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
    .shop-icon { font-size: 32px; }
    .shop-name { margin: 0; }
    .shop-discount { background: #ff4444; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }

    .shop-tabs { display: flex; gap: 5px; margin-bottom: 15px; }
    .shop-tab { padding: 10px 20px; background: #444; border: none; border-radius: 6px 6px 0 0; cursor: pointer; }
    .shop-tab.active { background: #555; }

    .shop-tab-content { display: none; }
    .shop-tab-content.active { display: block; }

    .shop-items { max-height: 300px; overflow-y: auto; }
    .shop-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #333; border-radius: 6px; margin-bottom: 8px; }
    .item-info { display: flex; flex-direction: column; }
    .item-name { font-weight: bold; }
    .item-stock { font-size: 12px; color: #888; }
    .item-actions { display: flex; align-items: center; gap: 15px; }
    .item-price { color: #FFD700; font-weight: bold; }

    .quantity-controls { display: flex; align-items: center; gap: 8px; }
    .quantity-controls button { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; }
    .btn-add { background: #4CAF50; color: white; }
    .btn-remove { background: #f44336; color: white; }
    .quantity { min-width: 20px; text-align: center; }

    .cart-summary, .sell-summary { display: flex; align-items: center; gap: 15px; padding: 15px; background: #333; border-radius: 6px; margin-top: 15px; }
    .cart-total, .sell-total { font-size: 18px; color: #FFD700; font-weight: bold; }
    .btn-purchase, .btn-sell { padding: 10px 20px; background: #4CAF50; border: none; border-radius: 6px; color: white; cursor: pointer; margin-left: auto; }
    .btn-purchase:disabled, .btn-sell:disabled { background: #666; cursor: not-allowed; }

    .shop-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #444; }
    .player-gold { font-size: 18px; color: #FFD700; }
    .btn-close-shop { padding: 8px 16px; background: #666; border: none; border-radius: 6px; color: white; cursor: pointer; }

    .sell-info, .buyback-info { color: #888; font-size: 13px; margin-bottom: 10px; }
    .sell-item, .buyback-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #333; border-radius: 6px; margin-bottom: 8px; }
    .sell-item .item-name, .buyback-item .item-name { flex: 1; }

    .shop-list-item { display: flex; align-items: center; gap: 15px; padding: 12px; background: #333; border-radius: 8px; margin-bottom: 10px; }
    .shop-list-item .shop-info { flex: 1; }
    .shop-list-item .shop-name { display: block; font-weight: bold; }
    .shop-list-item .shop-type { font-size: 12px; color: #888; }

    .transaction-notification { display: flex; align-items: center; gap: 10px; padding: 12px; background: #333; border-radius: 8px; }
    .transaction-buy { border-left: 3px solid #f44336; }
    .transaction-sell { border-left: 3px solid #4CAF50; }
    .notification-icon { font-size: 24px; }
    .notification-gold { color: #FFD700; font-weight: bold; }

    .shop-stats-panel { background: #333; padding: 15px; border-radius: 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 18px; font-weight: bold; display: block; }
    .stat-label { font-size: 11px; color: #888; }
    .net-gold { text-align: center; font-size: 16px; font-weight: bold; }
    .net-gold.positive { color: #4CAF50; }
    .net-gold.negative { color: #f44336; }
  `;
}
