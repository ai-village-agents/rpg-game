/**
 * Auction House UI
 * Rendering functions for auction house interface
 */

import {
  LISTING_DURATIONS,
  LISTING_STATUS,
  ITEM_CATEGORIES,
  SORT_OPTIONS,
  RARITY_FILTERS,
  searchListings,
  getListingDetails,
  getPlayerListings,
  getPlayerBids,
  getPlayerFavorites,
  getAuctionStats
} from './auction-house.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  return String(amount);
}

/**
 * Format time remaining
 */
function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Expired';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Render main auction house panel
 */
export function renderAuctionHouse(state, playerId) {
  const stats = getAuctionStats(state);
  
  return `
    <div class="auction-house">
      <div class="auction-header">
        <h2>Auction House</h2>
        <div class="auction-stats">
          <span class="stat">Active: ${stats.activeListings}</span>
          <span class="stat">Sales: ${stats.totalSales}</span>
          <span class="stat">Volume: ${formatGold(stats.totalVolume)}g</span>
        </div>
      </div>
      <div class="auction-tabs">
        <button class="tab active" data-tab="browse">Browse</button>
        <button class="tab" data-tab="sell">Sell</button>
        <button class="tab" data-tab="my-listings">My Listings</button>
        <button class="tab" data-tab="my-bids">My Bids</button>
        <button class="tab" data-tab="favorites">Favorites</button>
      </div>
      <div class="auction-content">
        ${renderSearchPanel(state)}
      </div>
    </div>
  `;
}

/**
 * Render search/browse panel
 */
export function renderSearchPanel(state, query = {}) {
  const results = searchListings(state, query);
  
  return `
    <div class="search-panel">
      <div class="search-filters">
        ${renderCategoryFilter(query.category)}
        ${renderRarityFilter(query.rarity)}
        ${renderPriceFilter(query.minPrice, query.maxPrice)}
        ${renderSortOptions(query.sort)}
      </div>
      <div class="search-input">
        <input type="text" placeholder="Search items..." value="${escapeHtml(query.name || '')}" />
        <button class="search-btn">Search</button>
      </div>
      <div class="listing-results">
        ${results.results.length === 0 
          ? '<div class="no-results">No listings found</div>'
          : results.results.map(l => renderListingRow(l)).join('')
        }
      </div>
      <div class="pagination">
        <span>Page ${results.page} of ${results.totalPages}</span>
        <span>${results.total} listings</span>
      </div>
    </div>
  `;
}

/**
 * Render category filter dropdown
 */
export function renderCategoryFilter(selected) {
  const options = Object.values(ITEM_CATEGORIES)
    .map(cat => `
      <option value="${cat.id}" ${selected === cat.id ? 'selected' : ''}>
        ${escapeHtml(cat.name)}
      </option>
    `)
    .join('');

  return `
    <select class="category-filter">
      <option value="">All Categories</option>
      ${options}
    </select>
  `;
}

/**
 * Render rarity filter
 */
export function renderRarityFilter(selected) {
  const options = Object.values(RARITY_FILTERS)
    .map(rarity => `
      <option value="${rarity.id}" ${selected === rarity.id ? 'selected' : ''}>
        ${escapeHtml(rarity.name)}
      </option>
    `)
    .join('');

  return `
    <select class="rarity-filter">
      <option value="">All Rarities</option>
      ${options}
    </select>
  `;
}

/**
 * Render price filter inputs
 */
export function renderPriceFilter(minPrice, maxPrice) {
  return `
    <div class="price-filter">
      <input type="number" placeholder="Min" value="${minPrice || ''}" class="min-price" />
      <span>-</span>
      <input type="number" placeholder="Max" value="${maxPrice || ''}" class="max-price" />
      <span>gold</span>
    </div>
  `;
}

/**
 * Render sort options
 */
export function renderSortOptions(selected) {
  const options = Object.values(SORT_OPTIONS)
    .map(opt => `
      <option value="${opt.id}" ${selected === opt.id ? 'selected' : ''}>
        ${escapeHtml(opt.name)}
      </option>
    `)
    .join('');

  return `
    <select class="sort-options">
      ${options}
    </select>
  `;
}

/**
 * Render a single listing row
 */
export function renderListingRow(listing) {
  const timeRemaining = Math.max(0, listing.expiresAt - Date.now());
  const currentPrice = listing.currentBid > 0 ? listing.currentBid : listing.startingBid;
  const rarityClass = listing.item.rarity || 'common';

  return `
    <div class="listing-row" data-listing-id="${escapeHtml(listing.id)}">
      <div class="listing-item">
        <span class="item-name ${rarityClass}">${escapeHtml(listing.item.name)}</span>
        <span class="item-level">Lvl ${listing.item.level || 1}</span>
      </div>
      <div class="listing-bids">
        <span class="bid-count">${listing.bidCount} bids</span>
      </div>
      <div class="listing-price">
        <span class="current-bid">${formatGold(currentPrice)}g</span>
        ${listing.buyoutPrice 
          ? `<span class="buyout">(BO: ${formatGold(listing.buyoutPrice)}g)</span>` 
          : ''
        }
      </div>
      <div class="listing-time">
        <span class="time-remaining">${formatTimeRemaining(timeRemaining)}</span>
      </div>
      <div class="listing-actions">
        <button class="bid-btn">Bid</button>
        ${listing.buyoutPrice ? '<button class="buyout-btn">Buyout</button>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render listing detail modal
 */
export function renderListingDetail(state, listingId) {
  const details = getListingDetails(state, listingId);
  
  if (!details.found) {
    return '<div class="listing-not-found">Listing not found</div>';
  }

  const listing = details.listing;
  const rarityClass = listing.item.rarity || 'common';

  return `
    <div class="listing-detail">
      <div class="detail-header">
        <h3 class="item-name ${rarityClass}">${escapeHtml(listing.item.name)}</h3>
        <span class="item-level">Level ${listing.item.level || 1}</span>
      </div>
      <div class="detail-item-info">
        <p class="item-description">${escapeHtml(listing.item.description || 'No description')}</p>
        <p class="item-category">Category: ${escapeHtml(listing.category)}</p>
      </div>
      <div class="detail-auction-info">
        <div class="price-info">
          <p>Starting Bid: ${formatGold(listing.startingBid)}g</p>
          <p>Current Bid: ${listing.currentBid > 0 ? formatGold(listing.currentBid) + 'g' : 'No bids'}</p>
          ${listing.buyoutPrice 
            ? `<p>Buyout Price: ${formatGold(listing.buyoutPrice)}g</p>` 
            : ''
          }
          <p>Minimum Next Bid: ${formatGold(details.minNextBid)}g</p>
        </div>
        <div class="auction-info">
          <p>Bids: ${listing.bidCount}</p>
          <p>Time Remaining: ${formatTimeRemaining(details.timeRemaining)}</p>
          <p>Seller: ${escapeHtml(listing.sellerId)}</p>
        </div>
      </div>
      <div class="bid-history">
        <h4>Bid History</h4>
        ${listing.bidHistory.length === 0 
          ? '<p class="no-bids">No bids yet</p>'
          : listing.bidHistory.slice(-5).reverse().map(bid => `
              <div class="bid-entry">
                <span class="bidder">${escapeHtml(bid.bidderId)}</span>
                <span class="bid-amount">${formatGold(bid.amount)}g</span>
              </div>
            `).join('')
        }
      </div>
      <div class="detail-actions">
        <input type="number" placeholder="Bid amount" class="bid-input" min="${details.minNextBid}" />
        <button class="place-bid-btn">Place Bid</button>
        ${listing.buyoutPrice 
          ? `<button class="buyout-btn">Buyout (${formatGold(listing.buyoutPrice)}g)</button>` 
          : ''
        }
      </div>
    </div>
  `;
}

/**
 * Render sell item form
 */
export function renderSellForm() {
  const durationOptions = Object.values(LISTING_DURATIONS)
    .map(d => `
      <option value="${d.id}">${escapeHtml(d.name)} (${Math.round(d.fee * 100)}% fee)</option>
    `)
    .join('');

  const categoryOptions = Object.values(ITEM_CATEGORIES)
    .map(cat => `
      <option value="${cat.id}">${escapeHtml(cat.name)}</option>
    `)
    .join('');

  return `
    <div class="sell-form">
      <h3>Create Listing</h3>
      <div class="form-group">
        <label>Item</label>
        <select class="item-select">
          <option value="">Select an item from inventory</option>
        </select>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select class="category-select">
          ${categoryOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Starting Bid</label>
        <input type="number" min="1" class="starting-bid" placeholder="Minimum bid" />
      </div>
      <div class="form-group">
        <label>Buyout Price (optional)</label>
        <input type="number" min="1" class="buyout-price" placeholder="Instant purchase price" />
      </div>
      <div class="form-group">
        <label>Duration</label>
        <select class="duration-select">
          ${durationOptions}
        </select>
      </div>
      <div class="fee-preview">
        <span>Listing Fee: <span class="fee-amount">0g</span></span>
      </div>
      <button class="create-listing-btn">Create Listing</button>
    </div>
  `;
}

/**
 * Render player's listings
 */
export function renderMyListings(state, playerId) {
  const listings = getPlayerListings(state, playerId);

  return `
    <div class="my-listings">
      <div class="listings-tabs">
        <span class="tab active">Active (${listings.active.length})</span>
        <span class="tab">Sold (${listings.sold.length})</span>
        <span class="tab">Expired (${listings.expired.length})</span>
      </div>
      <div class="listings-content">
        ${listings.active.length === 0 
          ? '<div class="no-listings">No active listings</div>'
          : listings.active.map(l => renderMyListingRow(l)).join('')
        }
      </div>
    </div>
  `;
}

/**
 * Render a row in my listings
 */
export function renderMyListingRow(listing) {
  const timeRemaining = Math.max(0, listing.expiresAt - Date.now());
  const canCancel = listing.bidCount === 0 && listing.status === LISTING_STATUS.ACTIVE;

  return `
    <div class="my-listing-row" data-listing-id="${escapeHtml(listing.id)}">
      <div class="listing-item">
        <span class="item-name">${escapeHtml(listing.item.name)}</span>
      </div>
      <div class="listing-info">
        <span>Bids: ${listing.bidCount}</span>
        <span>Current: ${listing.currentBid > 0 ? formatGold(listing.currentBid) + 'g' : 'No bids'}</span>
        <span>Time: ${formatTimeRemaining(timeRemaining)}</span>
      </div>
      <div class="listing-actions">
        ${canCancel ? '<button class="cancel-btn">Cancel</button>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render player's bids
 */
export function renderMyBids(state, playerId) {
  const bids = getPlayerBids(state, playerId);

  return `
    <div class="my-bids">
      <div class="bids-tabs">
        <span class="tab active">Winning (${bids.winning.length})</span>
        <span class="tab">Outbid (${bids.outbid.length})</span>
        <span class="tab">Won (${bids.won.length})</span>
      </div>
      <div class="bids-content">
        ${bids.winning.length === 0 && bids.outbid.length === 0
          ? '<div class="no-bids">No active bids</div>'
          : [...bids.winning.map(l => renderBidRow(l, 'winning')),
             ...bids.outbid.map(l => renderBidRow(l, 'outbid'))].join('')
        }
      </div>
    </div>
  `;
}

/**
 * Render a bid row
 */
export function renderBidRow(listing, status) {
  const timeRemaining = Math.max(0, listing.expiresAt - Date.now());
  const statusClass = status === 'winning' ? 'status-winning' : 'status-outbid';
  const statusText = status === 'winning' ? 'Winning' : 'Outbid';

  return `
    <div class="bid-row ${statusClass}" data-listing-id="${escapeHtml(listing.id)}">
      <div class="listing-item">
        <span class="item-name">${escapeHtml(listing.item.name)}</span>
        <span class="bid-status">${statusText}</span>
      </div>
      <div class="listing-info">
        <span>Current: ${formatGold(listing.currentBid)}g</span>
        <span>Time: ${formatTimeRemaining(timeRemaining)}</span>
      </div>
      <div class="listing-actions">
        ${status === 'outbid' ? '<button class="rebid-btn">Rebid</button>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render favorites
 */
export function renderFavorites(state, playerId) {
  const favorites = getPlayerFavorites(state, playerId);

  return `
    <div class="favorites">
      <h3>Favorite Listings (${favorites.count})</h3>
      ${favorites.count === 0
        ? '<div class="no-favorites">No favorites yet</div>'
        : favorites.favorites.map(l => renderListingRow(l)).join('')
      }
    </div>
  `;
}

/**
 * Render auction stats overview
 */
export function renderAuctionStatsPanel(state) {
  const stats = getAuctionStats(state);

  return `
    <div class="auction-stats-panel">
      <h3>Market Overview</h3>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-value">${stats.activeListings}</span>
          <span class="stat-label">Active Listings</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${stats.totalSales}</span>
          <span class="stat-label">Total Sales</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${formatGold(stats.totalVolume)}g</span>
          <span class="stat-label">Trade Volume</span>
        </div>
      </div>
      <div class="category-breakdown">
        <h4>By Category</h4>
        ${Object.entries(stats.categoryBreakdown)
          .map(([cat, count]) => `
            <div class="category-stat">
              <span class="cat-name">${escapeHtml(cat)}</span>
              <span class="cat-count">${count}</span>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

/**
 * Render compact auction notification
 */
export function renderAuctionNotification(type, data) {
  const notifications = {
    outbid: `You have been outbid on ${escapeHtml(data.itemName)}! Current bid: ${formatGold(data.currentBid)}g`,
    won: `You won the auction for ${escapeHtml(data.itemName)} for ${formatGold(data.price)}g!`,
    sold: `Your ${escapeHtml(data.itemName)} sold for ${formatGold(data.price)}g!`,
    expired: `Your listing for ${escapeHtml(data.itemName)} has expired.`
  };

  const message = notifications[type] || 'Auction update';

  return `
    <div class="auction-notification ${type}">
      <span class="notification-icon">&#128176;</span>
      <span class="notification-text">${message}</span>
    </div>
  `;
}
