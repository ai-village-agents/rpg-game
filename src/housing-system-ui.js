/**
 * Housing System UI Components
 * Renders house management and decoration interfaces
 */

import {
  HOUSE_TYPE,
  ROOM_TYPE,
  FURNITURE_CATEGORY,
  FURNITURE_RARITY,
  HOUSE_BONUSES,
  ROOM_BONUSES,
  FURNITURE_DATA,
  getHouseSummary,
  getRoomSummary,
  getRestBonus,
  getStorageCapacity,
  getCraftingBonus
} from './housing-system.js';

// HTML escape for XSS prevention
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rarity colors
const RARITY_COLORS = {
  [FURNITURE_RARITY.COMMON]: '#9d9d9d',
  [FURNITURE_RARITY.UNCOMMON]: '#1eff00',
  [FURNITURE_RARITY.RARE]: '#0070dd',
  [FURNITURE_RARITY.EPIC]: '#a335ee',
  [FURNITURE_RARITY.LEGENDARY]: '#ff8000'
};

// House icons
const HOUSE_ICONS = {
  [HOUSE_TYPE.COTTAGE]: '🏠',
  [HOUSE_TYPE.TOWNHOUSE]: '🏘️',
  [HOUSE_TYPE.MANOR]: '🏛️',
  [HOUSE_TYPE.CASTLE]: '🏰',
  [HOUSE_TYPE.TREEHOUSE]: '🌳',
  [HOUSE_TYPE.FLOATING_ISLAND]: '🏝️'
};

// Room icons
const ROOM_ICONS = {
  [ROOM_TYPE.BEDROOM]: '🛏️',
  [ROOM_TYPE.KITCHEN]: '🍳',
  [ROOM_TYPE.LIVING_ROOM]: '🛋️',
  [ROOM_TYPE.STORAGE]: '📦',
  [ROOM_TYPE.WORKSHOP]: '🔨',
  [ROOM_TYPE.GARDEN]: '🌱',
  [ROOM_TYPE.TROPHY_ROOM]: '🏆',
  [ROOM_TYPE.LIBRARY]: '📚',
  [ROOM_TYPE.ALCHEMY_LAB]: '⚗️',
  [ROOM_TYPE.ARMORY]: '⚔️'
};

// Furniture category icons
const CATEGORY_ICONS = {
  [FURNITURE_CATEGORY.SEATING]: '🪑',
  [FURNITURE_CATEGORY.TABLES]: '🪵',
  [FURNITURE_CATEGORY.BEDS]: '🛏️',
  [FURNITURE_CATEGORY.STORAGE]: '📦',
  [FURNITURE_CATEGORY.LIGHTING]: '💡',
  [FURNITURE_CATEGORY.DECORATION]: '🖼️',
  [FURNITURE_CATEGORY.CRAFTING]: '⚒️',
  [FURNITURE_CATEGORY.FUNCTIONAL]: '⚙️'
};

/**
 * Render main housing panel
 */
function renderHousingPanel(state) {
  const summary = getHouseSummary(state);

  if (!summary.hasHouse) {
    return renderNoHouse();
  }

  return `
    <div class="housing-panel">
      <div class="housing-header">
        <span class="house-icon">${HOUSE_ICONS[summary.type]}</span>
        <div class="house-info">
          <h2>${escapeHtml(summary.type.replace(/_/g, ' '))}</h2>
          <span class="house-level">Level ${summary.level}</span>
        </div>
      </div>

      <div class="housing-stats">
        <div class="stat-row">
          <span class="stat-icon">🛏️</span>
          <span class="stat-label">Rest Bonus:</span>
          <span class="stat-value">+${((summary.restBonus - 1) * 100).toFixed(0)}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-icon">📦</span>
          <span class="stat-label">Storage:</span>
          <span class="stat-value">${summary.storageCapacity} slots</span>
        </div>
        <div class="stat-row">
          <span class="stat-icon">🔨</span>
          <span class="stat-label">Crafting Bonus:</span>
          <span class="stat-value">+${(summary.craftingBonus * 100).toFixed(0)}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-icon">🚪</span>
          <span class="stat-label">Rooms:</span>
          <span class="stat-value">${summary.currentRooms} / ${summary.maxRooms}</span>
        </div>
      </div>

      <div class="housing-quality">
        <div class="quality-item">
          <span class="quality-label">Comfort</span>
          <span class="quality-value">${summary.totalComfort}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Beauty</span>
          <span class="quality-value">${summary.totalBeauty}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Ambiance</span>
          <span class="quality-value">${summary.totalAmbiance}</span>
        </div>
      </div>

      <div class="housing-actions">
        <button class="btn-upgrade">⬆️ Upgrade House</button>
        <button class="btn-add-room">➕ Add Room</button>
        <button class="btn-furniture-shop">🪑 Furniture Shop</button>
      </div>
    </div>
  `;
}

/**
 * Render no house state
 */
function renderNoHouse() {
  return `
    <div class="housing-panel no-house">
      <div class="no-house-icon">🏠</div>
      <h2>No House Owned</h2>
      <p>Purchase a house to unlock housing features!</p>
      <button class="btn-buy-house">Browse Houses</button>
    </div>
  `;
}

/**
 * Render house browser (for purchase)
 */
function renderHouseBrowser() {
  const houses = Object.entries(HOUSE_BONUSES).map(([type, data]) => {
    const icon = HOUSE_ICONS[type];

    return `
      <div class="house-card" data-house-type="${escapeHtml(type)}">
        <div class="house-icon">${icon}</div>
        <div class="house-name">${escapeHtml(type.replace(/_/g, ' '))}</div>
        <div class="house-stats">
          <span>🛏️ +${((data.restBonus - 1) * 100).toFixed(0)}% Rest</span>
          <span>📦 ${data.storageSlots} Storage</span>
          <span>🚪 ${data.maxRooms} Rooms</span>
        </div>
        <div class="house-price">💰 ${data.baseCost.toLocaleString()}</div>
        <button class="btn-purchase" data-house-type="${escapeHtml(type)}">Purchase</button>
      </div>
    `;
  }).join('');

  return `
    <div class="house-browser">
      <h3>🏠 Available Houses</h3>
      <div class="house-grid">
        ${houses}
      </div>
    </div>
  `;
}

/**
 * Render room list
 */
function renderRoomList(state) {
  if (state.rooms.length === 0) {
    return `
      <div class="room-list empty">
        <p>No rooms added yet</p>
        <button class="btn-add-room">➕ Add First Room</button>
      </div>
    `;
  }

  const roomCards = state.rooms.map(room => {
    const icon = ROOM_ICONS[room.type] || '🚪';
    const furnitureCount = state.furniture[room.id]?.length || 0;
    const bonus = ROOM_BONUSES[room.type];
    const bonusText = Object.entries(bonus).map(([k, v]) => {
      if (typeof v === 'number') {
        return v > 1 ? `+${((v - 1) * 100).toFixed(0)}%` : `+${v}`;
      }
      return '';
    }).filter(Boolean).join(', ');

    return `
      <div class="room-card" data-room-id="${escapeHtml(room.id)}">
        <div class="room-icon">${icon}</div>
        <div class="room-info">
          <span class="room-name">${escapeHtml(room.name)}</span>
          <span class="room-type">${escapeHtml(room.type.replace(/_/g, ' '))}</span>
        </div>
        <div class="room-details">
          <span class="furniture-count">🪑 ${furnitureCount}</span>
          ${bonusText ? `<span class="room-bonus">${bonusText}</span>` : ''}
        </div>
        <button class="btn-enter-room" data-room-id="${escapeHtml(room.id)}">Enter</button>
      </div>
    `;
  }).join('');

  return `
    <div class="room-list">
      <h3>🚪 Rooms</h3>
      <div class="room-grid">
        ${roomCards}
      </div>
    </div>
  `;
}

/**
 * Render room detail view
 */
function renderRoomDetail(state, roomId) {
  const summary = getRoomSummary(state, roomId);

  if (!summary) {
    return '<div class="error">Room not found</div>';
  }

  const icon = ROOM_ICONS[summary.type] || '🚪';

  const furnitureItems = summary.furniture.map(item => {
    const rarityColor = RARITY_COLORS[item.rarity];

    return `
      <div class="furniture-item placed" data-item-id="${escapeHtml(item.id)}">
        <span class="furniture-name" style="color: ${rarityColor}">${escapeHtml(item.name)}</span>
        <button class="btn-remove-furniture" data-item-id="${escapeHtml(item.id)}">Remove</button>
      </div>
    `;
  }).join('');

  return `
    <div class="room-detail">
      <div class="room-header">
        <span class="room-icon">${icon}</span>
        <div class="room-title">
          <h3>${escapeHtml(summary.name)}</h3>
          <span class="room-type">${escapeHtml(summary.type.replace(/_/g, ' '))}</span>
        </div>
        <button class="btn-rename-room">✏️</button>
      </div>

      <div class="room-furniture">
        <h4>Placed Furniture (${summary.furnitureCount})</h4>
        ${furnitureItems || '<p class="empty">No furniture placed</p>'}
      </div>

      <div class="room-actions">
        <button class="btn-place-furniture" data-room-id="${escapeHtml(roomId)}">Add Furniture</button>
        <button class="btn-back">← Back</button>
      </div>
    </div>
  `;
}

/**
 * Render furniture storage
 */
function renderFurnitureStorage(state) {
  if (state.storage.length === 0) {
    return `
      <div class="furniture-storage empty">
        <p>No furniture in storage</p>
        <button class="btn-furniture-shop">🪑 Visit Shop</button>
      </div>
    `;
  }

  const items = state.storage.map(item => {
    const data = FURNITURE_DATA[item.furnitureId];
    const rarityColor = RARITY_COLORS[data.rarity];
    const categoryIcon = CATEGORY_ICONS[data.category] || '📦';

    return `
      <div class="storage-item" data-item-id="${escapeHtml(item.id)}">
        <span class="category-icon">${categoryIcon}</span>
        <span class="item-name" style="color: ${rarityColor}">${escapeHtml(data.name)}</span>
        <span class="item-rarity">${data.rarity}</span>
        <button class="btn-place" data-item-id="${escapeHtml(item.id)}">Place</button>
      </div>
    `;
  }).join('');

  return `
    <div class="furniture-storage">
      <h3>📦 Furniture Storage (${state.storage.length})</h3>
      <div class="storage-grid">
        ${items}
      </div>
    </div>
  `;
}

/**
 * Render furniture shop
 */
function renderFurnitureShop(category = null) {
  const categories = Object.values(FURNITURE_CATEGORY);

  const categoryTabs = categories.map(cat => {
    const icon = CATEGORY_ICONS[cat];
    const isActive = category === cat;

    return `
      <button class="category-tab ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">
        ${icon} ${escapeHtml(cat.replace(/_/g, ' '))}
      </button>
    `;
  }).join('');

  const filteredFurniture = Object.entries(FURNITURE_DATA)
    .filter(([_, data]) => !category || data.category === category);

  const items = filteredFurniture.map(([id, data]) => {
    const rarityColor = RARITY_COLORS[data.rarity];
    const categoryIcon = CATEGORY_ICONS[data.category];

    let statText = '';
    if (data.comfort) statText += `Comfort: ${data.comfort} `;
    if (data.beauty) statText += `Beauty: ${data.beauty} `;
    if (data.ambiance) statText += `Ambiance: ${data.ambiance} `;
    if (data.slots) statText += `Storage: +${data.slots} `;
    if (data.restBonus) statText += `Rest: +${(data.restBonus * 100).toFixed(0)}% `;
    if (data.craftBonus) statText += `Craft: +${(data.craftBonus * 100).toFixed(0)}% `;

    return `
      <div class="shop-item" data-furniture-id="${escapeHtml(id)}">
        <span class="item-icon">${categoryIcon}</span>
        <div class="item-info">
          <span class="item-name" style="color: ${rarityColor}">${escapeHtml(data.name)}</span>
          <span class="item-stats">${statText}</span>
        </div>
        <span class="item-price">💰 ${data.cost}</span>
        <button class="btn-buy" data-furniture-id="${escapeHtml(id)}">Buy</button>
      </div>
    `;
  }).join('');

  return `
    <div class="furniture-shop">
      <h3>🪑 Furniture Shop</h3>
      <div class="category-tabs">
        <button class="category-tab ${!category ? 'active' : ''}" data-category="">All</button>
        ${categoryTabs}
      </div>
      <div class="shop-items">
        ${items}
      </div>
    </div>
  `;
}

/**
 * Render room type selector
 */
function renderRoomTypeSelector() {
  const roomTypes = Object.entries(ROOM_BONUSES).map(([type, bonus]) => {
    const icon = ROOM_ICONS[type];
    const bonusText = Object.entries(bonus).map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').trim();
      if (typeof v === 'number') {
        return v > 1 ? `${label}: +${((v - 1) * 100).toFixed(0)}%` : `${label}: +${v}`;
      }
      return '';
    }).filter(Boolean).join(', ');

    return `
      <div class="room-type-option" data-room-type="${escapeHtml(type)}">
        <span class="room-icon">${icon}</span>
        <span class="room-name">${escapeHtml(type.replace(/_/g, ' '))}</span>
        <span class="room-bonus">${bonusText}</span>
        <button class="btn-select-room" data-room-type="${escapeHtml(type)}">Add</button>
      </div>
    `;
  }).join('');

  return `
    <div class="room-type-selector">
      <h3>➕ Add New Room</h3>
      <div class="room-types">
        ${roomTypes}
      </div>
    </div>
  `;
}

/**
 * Render visitor list
 */
function renderVisitorList(state) {
  if (state.visitors.length === 0) {
    return `
      <div class="visitor-list empty">
        <p>No visitors currently</p>
      </div>
    `;
  }

  const visitors = state.visitors.map(visitor => {
    return `
      <div class="visitor-card" data-visitor-id="${escapeHtml(visitor.id)}">
        <span class="visitor-icon">👤</span>
        <span class="visitor-name">${escapeHtml(visitor.name)}</span>
        <span class="visitor-type">${escapeHtml(visitor.type)}</span>
        <button class="btn-dismiss" data-visitor-id="${escapeHtml(visitor.id)}">Dismiss</button>
      </div>
    `;
  }).join('');

  return `
    <div class="visitor-list">
      <h3>👥 Visitors (${state.visitors.length})</h3>
      <div class="visitor-grid">
        ${visitors}
      </div>
    </div>
  `;
}

/**
 * Render upgrade panel
 */
function renderUpgradePanel(state) {
  if (!state.house) {
    return '<div class="error">No house owned</div>';
  }

  const upgrades = Object.entries(state.upgrades).map(([type, level]) => {
    const maxLevel = 5;
    const cost = 1000 * (level + 1);
    const isMaxed = level >= maxLevel;

    let description = '';
    switch (type) {
      case 'storageExpansion': description = '+25 storage per level'; break;
      case 'gardenSize': description = 'Larger garden area'; break;
      case 'securityLevel': description = 'Better protection'; break;
    }

    return `
      <div class="upgrade-item" data-upgrade="${escapeHtml(type)}">
        <div class="upgrade-info">
          <span class="upgrade-name">${escapeHtml(type.replace(/([A-Z])/g, ' $1').trim())}</span>
          <span class="upgrade-level">Level ${level} / ${maxLevel}</span>
          <span class="upgrade-desc">${description}</span>
        </div>
        <div class="upgrade-action">
          ${isMaxed ?
            '<span class="maxed">MAX</span>' :
            `<button class="btn-upgrade-item" data-upgrade="${escapeHtml(type)}">
              Upgrade (💰 ${cost})
            </button>`
          }
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="upgrade-panel">
      <h3>⬆️ House Upgrades</h3>
      <div class="upgrade-list">
        ${upgrades}
      </div>
    </div>
  `;
}

/**
 * Render purchase confirmation
 */
function renderPurchaseConfirmation(itemType, itemName, cost) {
  return `
    <div class="purchase-confirmation">
      <h4>Confirm Purchase</h4>
      <p>Purchase ${escapeHtml(itemName)}?</p>
      <p class="cost">Cost: 💰 ${cost}</p>
      <div class="confirmation-actions">
        <button class="btn-confirm">Confirm</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render room placement dialog
 */
function renderPlacementDialog(state, itemId) {
  const rooms = state.rooms.map(room => {
    const icon = ROOM_ICONS[room.type];
    return `
      <div class="room-option" data-room-id="${escapeHtml(room.id)}">
        <span class="room-icon">${icon}</span>
        <span class="room-name">${escapeHtml(room.name)}</span>
        <button class="btn-place-here" data-room-id="${escapeHtml(room.id)}" data-item-id="${escapeHtml(itemId)}">
          Place Here
        </button>
      </div>
    `;
  }).join('');

  return `
    <div class="placement-dialog">
      <h4>Select Room</h4>
      <div class="room-options">
        ${rooms || '<p>No rooms available</p>'}
      </div>
      <button class="btn-cancel">Cancel</button>
    </div>
  `;
}

// Export all UI components
export {
  renderHousingPanel,
  renderNoHouse,
  renderHouseBrowser,
  renderRoomList,
  renderRoomDetail,
  renderFurnitureStorage,
  renderFurnitureShop,
  renderRoomTypeSelector,
  renderVisitorList,
  renderUpgradePanel,
  renderPurchaseConfirmation,
  renderPlacementDialog,
  RARITY_COLORS,
  HOUSE_ICONS,
  ROOM_ICONS,
  CATEGORY_ICONS
};
