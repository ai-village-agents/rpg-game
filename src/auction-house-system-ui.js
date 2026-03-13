/**
 * Auction House System UI Components
 * Renders marketplace interfaces for trading
 */

import {
  LISTING_CATEGORY,
  LISTING_STATUS,
  LISTING_DURATION,
  DEPOSIT_RATES,
  calculateDeposit,
  calculateSaleFee,
  searchListings,
  getListingDetails,
  getPlayerActiveListings,
  getPlayerBids,
  getAuctionHouseStats,
  getPriceHistory,
  getAveragePrice
} from './auction-house-system.js';

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

// Category icons
const CATEGORY_ICONS = {
  [LISTING_CATEGORY.WEAPONS]: '⚔️',
  [LISTING_CATEGORY.ARMOR]: '🛡️',
  [LISTING_CATEGORY.CONSUMABLES]: '🧪',
  [LISTING_CATEGORY.MATERIALS]: '🪨',
  [LISTING_CATEGORY.RECIPES]: '📜',
  [LISTING_CATEGORY.GEMS]: '💎',
  [LISTING_CATEGORY.MOUNTS]: '🐴',
  [LISTING_CATEGORY.PETS]: '🐾',
  [LISTING_CATEGORY.MISCELLANEOUS]: '📦'
};

// Status colors
const STATUS_COLORS = {
  [LISTING_STATUS.ACTIVE]: '#4CAF50',
  [LISTING_STATUS.SOLD]: '#2196F3',
  [LISTING_STATUS.EXPIRED]: '#9E9E9E',
  [LISTING_STATUS.CANCELLED]: '#F44336'
};

/**
 * Format time remaining
 */
function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Expired';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format gold amount
 */
function formatGold(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

/**
 * Render main auction house panel
 */
function renderAuctionHousePanel(state, currentPlayerId) {
  const stats = getAuctionHouseStats(state);

  return `
    <div class="auction-house-panel">
      <div class="ah-header">
        <h2>🏛️ Auction House</h2>
        <div class="ah-stats">
          <span class="stat">📊 ${stats.activeListings} Active</span>
          <span class="stat">💰 ${formatGold(stats.totalVolume)} Volume</span>
        </div>
      </div>

      <div class="ah-nav">
        <button class="nav-btn active" data-tab="browse">Browse</button>
        <button class="nav-btn" data-tab="sell">Sell</button>
        <button class="nav-btn" data-tab="my-listings">My Listings</button>
        <button class="nav-btn" data-tab="my-bids">My Bids</button>
      </div>

      <div class="ah-content">
        ${renderBrowseTab(state)}
      </div>
    </div>
  `;
}

/**
 * Render browse tab
 */
function renderBrowseTab(state, searchOptions = {}) {
  const { results, total, hasMore } = searchListings(state, searchOptions);

  return `
    <div class="browse-tab">
      ${renderSearchFilters(searchOptions)}
      ${renderCategoryBar()}
      <div class="listings-grid">
        ${results.length > 0 ?
          results.map(listing => renderListingCard(listing)).join('') :
          '<p class="no-results">No listings found</p>'
        }
      </div>
      ${hasMore ? `
        <div class="load-more">
          <button class="btn-load-more">Load More (${total - results.length} remaining)</button>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render search filters
 */
function renderSearchFilters(currentFilters = {}) {
  return `
    <div class="search-filters">
      <div class="filter-row">
        <input type="text" class="search-input" placeholder="Search items..."
               value="${escapeHtml(currentFilters.searchTerm || '')}" />
        <button class="btn-search">🔍</button>
      </div>
      <div class="filter-row">
        <label>Price Range:</label>
        <input type="number" class="price-min" placeholder="Min" value="${currentFilters.minPrice || ''}" />
        <span>-</span>
        <input type="number" class="price-max" placeholder="Max" value="${currentFilters.maxPrice || ''}" />
      </div>
      <div class="filter-row">
        <label>Sort:</label>
        <select class="sort-select">
          <option value="createdAt" ${currentFilters.sortBy === 'createdAt' ? 'selected' : ''}>Newest</option>
          <option value="price" ${currentFilters.sortBy === 'price' ? 'selected' : ''}>Price</option>
          <option value="buyout" ${currentFilters.sortBy === 'buyout' ? 'selected' : ''}>Buyout</option>
          <option value="timeLeft" ${currentFilters.sortBy === 'timeLeft' ? 'selected' : ''}>Time Left</option>
          <option value="bidCount" ${currentFilters.sortBy === 'bidCount' ? 'selected' : ''}>Bids</option>
        </select>
      </div>
    </div>
  `;
}

/**
 * Render category bar
 */
function renderCategoryBar(activeCategory = null) {
  const categories = Object.entries(CATEGORY_ICONS).map(([cat, icon]) => `
    <button class="category-btn ${activeCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">
      ${icon} ${escapeHtml(cat)}
    </button>
  `).join('');

  return `
    <div class="category-bar">
      <button class="category-btn ${!activeCategory ? 'active' : ''}" data-category="">All</button>
      ${categories}
    </div>
  `;
}

/**
 * Render listing card
 */
function renderListingCard(listing) {
  const details = getListingDetails({ listings: { [listing.id]: listing } }, listing.id);
  const timeStr = formatTimeRemaining(details.timeRemaining);
  const categoryIcon = CATEGORY_ICONS[listing.category] || '📦';

  return `
    <div class="listing-card" data-listing-id="${escapeHtml(listing.id)}">
      <div class="listing-header">
        <span class="category-icon">${categoryIcon}</span>
        <span class="item-name">${escapeHtml(listing.item.name)}</span>
      </div>
      <div class="listing-prices">
        <div class="current-price">
          <span class="label">Current:</span>
          <span class="price">💰 ${formatGold(details.currentPrice)}</span>
        </div>
        ${listing.buyoutPrice ? `
          <div class="buyout-price">
            <span class="label">Buyout:</span>
            <span class="price">💰 ${formatGold(listing.buyoutPrice)}</span>
          </div>
        ` : ''}
      </div>
      <div class="listing-info">
        <span class="bid-count">🔨 ${listing.bidCount} bids</span>
        <span class="time-left ${details.timeRemaining < 3600000 ? 'urgent' : ''}">⏱️ ${timeStr}</span>
      </div>
      <div class="listing-actions">
        <button class="btn-view" data-listing-id="${escapeHtml(listing.id)}">View</button>
        ${listing.buyoutPrice ? `
          <button class="btn-buyout" data-listing-id="${escapeHtml(listing.id)}">Buy Now</button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render listing detail modal
 */
function renderListingDetail(state, listingId, currentPlayerId) {
  const details = getListingDetails(state, listingId);

  if (!details) {
    return '<div class="error">Listing not found</div>';
  }

  const timeStr = formatTimeRemaining(details.timeRemaining);
  const categoryIcon = CATEGORY_ICONS[details.category] || '📦';
  const isOwner = details.sellerId === currentPlayerId;
  const isHighBidder = details.currentBidderId === currentPlayerId;

  // Get price history
  const priceHistory = getPriceHistory(state, details.item.id, 5);
  const avgPrice = getAveragePrice(state, details.item.id);

  return `
    <div class="listing-detail">
      <div class="detail-header">
        <span class="category-icon">${categoryIcon}</span>
        <h3>${escapeHtml(details.item.name)}</h3>
        <span class="status" style="color: ${STATUS_COLORS[details.status]}">${details.status}</span>
      </div>

      <div class="detail-item">
        <div class="item-icon">📦</div>
        <div class="item-info">
          ${details.item.description ? `<p class="item-desc">${escapeHtml(details.item.description)}</p>` : ''}
        </div>
      </div>

      <div class="detail-pricing">
        <div class="price-row">
          <span class="label">Current Bid:</span>
          <span class="value">💰 ${formatGold(details.currentPrice)}</span>
        </div>
        <div class="price-row">
          <span class="label">Minimum Bid:</span>
          <span class="value">💰 ${formatGold(details.minimumBid)}</span>
        </div>
        ${details.buyoutPrice ? `
          <div class="price-row buyout">
            <span class="label">Buyout Price:</span>
            <span class="value">💰 ${formatGold(details.buyoutPrice)}</span>
          </div>
        ` : ''}
        ${avgPrice ? `
          <div class="price-row avg">
            <span class="label">Avg. Sold Price:</span>
            <span class="value">💰 ${formatGold(avgPrice)}</span>
          </div>
        ` : ''}
      </div>

      <div class="detail-info">
        <div class="info-row">
          <span class="label">Time Left:</span>
          <span class="value ${details.timeRemaining < 3600000 ? 'urgent' : ''}">${timeStr}</span>
        </div>
        <div class="info-row">
          <span class="label">Bid Count:</span>
          <span class="value">${details.bidCount}</span>
        </div>
        <div class="info-row">
          <span class="label">Seller:</span>
          <span class="value">${escapeHtml(details.sellerId)}</span>
        </div>
        ${isHighBidder ? '<div class="high-bidder-badge">✓ You are the highest bidder</div>' : ''}
      </div>

      ${priceHistory.length > 0 ? `
        <div class="price-history">
          <h4>Recent Sales</h4>
          <div class="history-list">
            ${priceHistory.map(h => `
              <div class="history-item">
                <span class="price">💰 ${formatGold(h.price)}</span>
                <span class="date">${new Date(h.soldAt).toLocaleDateString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="detail-actions">
        ${!isOwner && details.status === LISTING_STATUS.ACTIVE && !details.isExpired ? `
          <div class="bid-form">
            <input type="number" class="bid-input" placeholder="Enter bid" min="${details.minimumBid}" />
            <button class="btn-place-bid" data-listing-id="${escapeHtml(listingId)}">Place Bid</button>
          </div>
          ${details.buyoutPrice ? `
            <button class="btn-buyout" data-listing-id="${escapeHtml(listingId)}">
              Buy Now (💰 ${formatGold(details.buyoutPrice)})
            </button>
          ` : ''}
        ` : ''}
        ${isOwner && details.status === LISTING_STATUS.ACTIVE && !details.currentBid ? `
          <button class="btn-cancel" data-listing-id="${escapeHtml(listingId)}">Cancel Listing</button>
        ` : ''}
        <button class="btn-close">Close</button>
      </div>
    </div>
  `;
}

/**
 * Render sell form
 */
function renderSellForm(item = null) {
  const durationOptions = Object.entries(LISTING_DURATION).map(([name, hours]) => {
    const deposit = item ? calculateDeposit(100, hours) : DEPOSIT_RATES[hours] * 100;
    return `
      <option value="${hours}">${name} (${hours}h) - ${(deposit)}% deposit</option>
    `;
  }).join('');

  const categoryOptions = Object.entries(CATEGORY_ICONS).map(([cat, icon]) => `
    <option value="${escapeHtml(cat)}">${icon} ${escapeHtml(cat)}</option>
  `).join('');

  return `
    <div class="sell-form">
      <h3>Create Listing</h3>

      ${item ? `
        <div class="selected-item">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <button class="btn-clear-item">Clear</button>
        </div>
      ` : `
        <div class="item-selector">
          <button class="btn-select-item">Select Item to Sell</button>
        </div>
      `}

      <div class="form-group">
        <label>Category:</label>
        <select class="category-select">
          ${categoryOptions}
        </select>
      </div>

      <div class="form-group">
        <label>Starting Price:</label>
        <input type="number" class="starting-price" min="1" placeholder="100" />
      </div>

      <div class="form-group">
        <label>Buyout Price (optional):</label>
        <input type="number" class="buyout-price" min="1" placeholder="Leave empty for no buyout" />
      </div>

      <div class="form-group">
        <label>Duration:</label>
        <select class="duration-select">
          ${durationOptions}
        </select>
      </div>

      <div class="deposit-preview">
        <span class="label">Deposit:</span>
        <span class="value">💰 <span class="deposit-amount">--</span></span>
        <span class="note">(Returned on sale, lost on expiry)</span>
      </div>

      <div class="form-actions">
        <button class="btn-create-listing" ${!item ? 'disabled' : ''}>Create Listing</button>
      </div>
    </div>
  `;
}

/**
 * Render my listings tab
 */
function renderMyListingsTab(state, playerId) {
  const listings = getPlayerActiveListings(state, playerId);

  if (listings.length === 0) {
    return `
      <div class="my-listings empty">
        <p>You have no active listings</p>
        <button class="btn-create-listing">Create a Listing</button>
      </div>
    `;
  }

  const listingRows = listings.map(listing => {
    const details = getListingDetails(state, listing.id);
    const timeStr = formatTimeRemaining(details.timeRemaining);

    return `
      <div class="my-listing-row" data-listing-id="${escapeHtml(listing.id)}">
        <div class="item-info">
          <span class="item-name">${escapeHtml(listing.item.name)}</span>
          <span class="category">${CATEGORY_ICONS[listing.category]} ${escapeHtml(listing.category)}</span>
        </div>
        <div class="listing-stats">
          <span class="current-bid">💰 ${formatGold(details.currentPrice)}</span>
          <span class="bid-count">🔨 ${listing.bidCount}</span>
          <span class="time-left">${timeStr}</span>
        </div>
        <div class="listing-actions">
          ${!listing.currentBid ? `
            <button class="btn-cancel" data-listing-id="${escapeHtml(listing.id)}">Cancel</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="my-listings">
      <h3>My Active Listings (${listings.length})</h3>
      <div class="listings-list">
        ${listingRows}
      </div>
    </div>
  `;
}

/**
 * Render my bids tab
 */
function renderMyBidsTab(state, playerId) {
  const bids = getPlayerBids(state, playerId);

  if (bids.length === 0) {
    return `
      <div class="my-bids empty">
        <p>You have no active bids</p>
        <button class="btn-browse">Browse Listings</button>
      </div>
    `;
  }

  const bidRows = bids.map(listing => {
    const details = getListingDetails(state, listing.id);
    const timeStr = formatTimeRemaining(details.timeRemaining);
    const isWinning = listing.currentBidderId === playerId;

    return `
      <div class="my-bid-row ${isWinning ? 'winning' : 'outbid'}" data-listing-id="${escapeHtml(listing.id)}">
        <div class="item-info">
          <span class="item-name">${escapeHtml(listing.item.name)}</span>
          ${isWinning ? '<span class="winning-badge">✓ Winning</span>' : '<span class="outbid-badge">Outbid</span>'}
        </div>
        <div class="bid-info">
          <span class="your-bid">Your bid: 💰 ${formatGold(listing.currentBid)}</span>
          <span class="time-left">${timeStr}</span>
        </div>
        <div class="bid-actions">
          <button class="btn-view" data-listing-id="${escapeHtml(listing.id)}">View</button>
          ${!isWinning ? `
            <button class="btn-rebid" data-listing-id="${escapeHtml(listing.id)}">Rebid</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="my-bids">
      <h3>My Bids (${bids.length})</h3>
      <div class="bids-list">
        ${bidRows}
      </div>
    </div>
  `;
}

/**
 * Render confirmation dialog
 */
function renderConfirmationDialog(action, details) {
  let title = '';
  let message = '';
  let confirmText = 'Confirm';

  switch (action) {
    case 'bid':
      title = 'Confirm Bid';
      message = `Place bid of 💰 ${formatGold(details.amount)} on ${escapeHtml(details.itemName)}?`;
      confirmText = 'Place Bid';
      break;
    case 'buyout':
      const fee = calculateSaleFee(details.price);
      title = 'Confirm Purchase';
      message = `Buy ${escapeHtml(details.itemName)} for 💰 ${formatGold(details.price)}?`;
      confirmText = 'Buy Now';
      break;
    case 'cancel':
      title = 'Cancel Listing';
      message = `Cancel listing for ${escapeHtml(details.itemName)}? Your deposit will be returned.`;
      confirmText = 'Cancel Listing';
      break;
    case 'create':
      title = 'Create Listing';
      message = `
        List ${escapeHtml(details.itemName)} for:
        <br>Starting: 💰 ${formatGold(details.startingPrice)}
        ${details.buyoutPrice ? `<br>Buyout: 💰 ${formatGold(details.buyoutPrice)}` : ''}
        <br>Deposit: 💰 ${formatGold(details.deposit)}
      `;
      confirmText = 'Create Listing';
      break;
  }

  return `
    <div class="confirmation-dialog">
      <h4>${title}</h4>
      <p>${message}</p>
      <div class="dialog-actions">
        <button class="btn-confirm">${confirmText}</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render outbid notification
 */
function renderOutbidNotification(itemName, newBid, yourBid) {
  return `
    <div class="outbid-notification">
      <span class="icon">⚠️</span>
      <div class="message">
        <strong>Outbid!</strong>
        <p>You have been outbid on ${escapeHtml(itemName)}</p>
        <p>New bid: 💰 ${formatGold(newBid)} (Your bid: 💰 ${formatGold(yourBid)})</p>
      </div>
      <button class="btn-rebid">Rebid</button>
      <button class="btn-dismiss">Dismiss</button>
    </div>
  `;
}

/**
 * Render sale notification
 */
function renderSaleNotification(itemName, salePrice, fee, received) {
  return `
    <div class="sale-notification">
      <span class="icon">💰</span>
      <div class="message">
        <strong>Item Sold!</strong>
        <p>${escapeHtml(itemName)} sold for 💰 ${formatGold(salePrice)}</p>
        <p>Fee: 💰 ${formatGold(fee)} | You received: 💰 ${formatGold(received)}</p>
      </div>
      <button class="btn-dismiss">Dismiss</button>
    </div>
  `;
}

// Export all UI components
export {
  renderAuctionHousePanel,
  renderBrowseTab,
  renderSearchFilters,
  renderCategoryBar,
  renderListingCard,
  renderListingDetail,
  renderSellForm,
  renderMyListingsTab,
  renderMyBidsTab,
  renderConfirmationDialog,
  renderOutbidNotification,
  renderSaleNotification,
  formatTimeRemaining,
  formatGold,
  CATEGORY_ICONS,
  STATUS_COLORS
};
