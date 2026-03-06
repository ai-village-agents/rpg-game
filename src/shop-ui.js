// Shop UI rendering module
// Created by Claude Opus 4.6 (Villager) on Day 339

import { items as itemsData, rarityColors } from './data/items.js';
import { getBuyPrice, getSellPrice, getSellableItems } from './shop.js';

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Render the shop panel HTML.
 * @param {object} shopState - Current shop state
 * @param {object} player - Player state
 * @returns {string} HTML string
 */
export function renderShopPanel(shopState, player) {
  const gold = player?.gold ?? 0;

  const tabBuyClass = shopState.tab === 'buy' ? 'shop-tab active' : 'shop-tab';
  const tabSellClass = shopState.tab === 'sell' ? 'shop-tab active' : 'shop-tab';

  let itemsHtml = '';
  if (shopState.tab === 'buy') {
    itemsHtml = renderBuyTab(shopState, gold);
  } else {
    itemsHtml = renderSellTab(player);
  }

  const messageHtml = shopState.message
    ? `<div class="shop-message">${esc(shopState.message)}</div>`
    : '';

  return `
    <div class="card shop-panel">
      <h2>🏪 ${esc(shopState.shopName)}</h2>
      <div class="shop-greeting">${esc(shopState.greeting)}</div>
      <div class="shop-gold">💰 Gold: <b>${gold}</b></div>
      ${messageHtml}
      <div class="shop-tabs">
        <button class="${tabBuyClass}" data-shop-tab="buy">Buy</button>
        <button class="${tabSellClass}" data-shop-tab="sell">Sell</button>
      </div>
      <div class="shop-items">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function renderBuyTab(shopState, playerGold) {
  const availableStock = shopState.stock.filter(s => s.quantity > 0);
  if (availableStock.length === 0) {
    return '<div class="shop-empty">Nothing left in stock!</div>';
  }

  return availableStock.map(entry => {
    const item = itemsData[entry.itemId];
    if (!item) return '';
    const price = getBuyPrice(entry.itemId);
    const canAfford = playerGold >= price;
    const rarityColor = rarityColors[item.rarity] || '#999';
    const typeIcon = getTypeIcon(item.type);
    const statsText = getStatsText(item);

    return `
      <div class="shop-item ${canAfford ? '' : 'shop-item-disabled'}">
        <div class="shop-item-header">
          <span class="shop-item-name" style="color:${rarityColor}">${typeIcon} ${esc(item.name)}</span>
          <span class="shop-item-rarity" style="color:${rarityColor}">[${esc(item.rarity)}]</span>
        </div>
        <div class="shop-item-desc">${esc(item.description)}</div>
        ${statsText ? `<div class="shop-item-stats">${statsText}</div>` : ''}
        <div class="shop-item-footer">
          <span class="shop-item-stock">Stock: ${entry.quantity}</span>
          <span class="shop-item-price">💰 ${price}</span>
          <button class="shop-buy-btn" data-item-id="${esc(entry.itemId)}" ${canAfford ? '' : 'disabled'}>Buy</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSellTab(player) {
  const sellable = getSellableItems(player?.inventory);
  if (sellable.length === 0) {
    return '<div class="shop-empty">You have nothing to sell.</div>';
  }

  return sellable.map(entry => {
    const rarityColor = rarityColors[entry.item.rarity] || '#999';
    const typeIcon = getTypeIcon(entry.item.type);

    return `
      <div class="shop-item">
        <div class="shop-item-header">
          <span class="shop-item-name" style="color:${rarityColor}">${typeIcon} ${esc(entry.item.name)}</span>
          <span class="shop-item-count">x${entry.count}</span>
        </div>
        <div class="shop-item-desc">${esc(entry.item.description)}</div>
        <div class="shop-item-footer">
          <span class="shop-item-price">💰 ${entry.sellPrice} each</span>
          <button class="shop-sell-btn" data-item-id="${esc(entry.itemId)}">Sell 1</button>
        </div>
      </div>
    `;
  }).join('');
}

function getTypeIcon(type) {
  switch (type) {
    case 'consumable': return '🧪';
    case 'weapon': return '⚔️';
    case 'armor': return '🛡️';
    case 'accessory': return '💍';
    default: return '📦';
  }
}

function getStatsText(item) {
  if (!item.stats) return '';
  const parts = [];
  for (const [key, val] of Object.entries(item.stats)) {
    if (val !== 0 && val !== undefined) {
      const sign = val > 0 ? '+' : '';
      parts.push(`${formatStatKey(key)}: ${sign}${val}`);
    }
  }
  return parts.join(' | ');
}

function formatStatKey(key) {
  switch (key) {
    case 'attack': return 'ATK';
    case 'defense': return 'DEF';
    case 'magic': return 'MAG';
    case 'speed': return 'SPD';
    case 'critChance': return 'CRIT%';
    default: return key.toUpperCase();
  }
}

/**
 * Attach event handlers for shop buttons.
 * @param {HTMLElement} container - The container element
 * @param {function} dispatch - The dispatch function
 */
export function attachShopHandlers(container, dispatch) {
  // Tab switching
  container.querySelectorAll('.shop-tab').forEach(btn => {
    btn.onclick = () => dispatch({ type: 'SHOP_SWITCH_TAB', tab: btn.dataset.shopTab });
  });

  // Buy buttons
  container.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.onclick = () => dispatch({ type: 'BUY_ITEM', itemId: btn.dataset.itemId });
  });

  // Sell buttons
  container.querySelectorAll('.shop-sell-btn').forEach(btn => {
    btn.onclick = () => dispatch({ type: 'SELL_ITEM', itemId: btn.dataset.itemId });
  });
}

/**
 * Get CSS styles for the shop.
 * @returns {string}
 */
export function getShopStyles() {
  return `
    .shop-panel { max-width: 600px; margin: 0 auto; }
    .shop-greeting { color: #aaa; font-style: italic; margin-bottom: 8px; }
    .shop-gold { font-size: 1.1em; margin-bottom: 8px; padding: 4px 8px; background: #1a1a2e; border-radius: 4px; display: inline-block; }
    .shop-message { padding: 6px 10px; margin: 6px 0; border-radius: 4px; background: #1e3a2e; color: #8f8; font-size: 0.95em; }
    .shop-tabs { display: flex; gap: 4px; margin: 10px 0 8px; }
    .shop-tab { padding: 6px 18px; border: 1px solid #555; background: #222; color: #ccc; cursor: pointer; border-radius: 4px 4px 0 0; font-size: 0.95em; }
    .shop-tab.active { background: #336; color: #fff; border-bottom-color: #336; font-weight: bold; }
    .shop-items { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow-y: auto; }
    .shop-item { background: #1a1a2e; border: 1px solid #333; border-radius: 6px; padding: 8px 10px; }
    .shop-item-disabled { opacity: 0.6; }
    .shop-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .shop-item-name { font-weight: bold; font-size: 0.95em; }
    .shop-item-rarity { font-size: 0.8em; }
    .shop-item-count { font-size: 0.9em; color: #aaa; }
    .shop-item-desc { font-size: 0.85em; color: #999; margin-bottom: 4px; }
    .shop-item-stats { font-size: 0.85em; color: #8af; margin-bottom: 4px; }
    .shop-item-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .shop-item-stock { font-size: 0.85em; color: #aaa; }
    .shop-item-price { font-size: 0.9em; color: #fc0; }
    .shop-buy-btn, .shop-sell-btn { padding: 3px 12px; border-radius: 4px; border: 1px solid #555; background: #2a4a2a; color: #8f8; cursor: pointer; font-size: 0.85em; }
    .shop-buy-btn:hover:not(:disabled), .shop-sell-btn:hover { background: #3a6a3a; }
    .shop-buy-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .shop-empty { color: #888; font-style: italic; padding: 20px 0; text-align: center; }
  `;
}
