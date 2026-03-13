/**
 * Auction House System
 * Player-to-player trading marketplace with bidding and buyouts
 */

// Listing categories
const LISTING_CATEGORY = {
  WEAPONS: 'weapons',
  ARMOR: 'armor',
  CONSUMABLES: 'consumables',
  MATERIALS: 'materials',
  RECIPES: 'recipes',
  GEMS: 'gems',
  MOUNTS: 'mounts',
  PETS: 'pets',
  MISCELLANEOUS: 'miscellaneous'
};

// Listing status
const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Listing duration options (in hours)
const LISTING_DURATION = {
  SHORT: 12,
  MEDIUM: 24,
  LONG: 48
};

// Deposit percentage based on duration
const DEPOSIT_RATES = {
  [LISTING_DURATION.SHORT]: 0.05,
  [LISTING_DURATION.MEDIUM]: 0.10,
  [LISTING_DURATION.LONG]: 0.15
};

// Sale fee percentage
const SALE_FEE_RATE = 0.05;

// Minimum bid increment percentage
const MIN_BID_INCREMENT = 0.05;

// Maximum active listings per player
const MAX_ACTIVE_LISTINGS = 20;

/**
 * Create initial auction house state
 */
function createAuctionHouseState() {
  return {
    listings: {},
    playerListings: {},
    playerBids: {},
    history: [],
    stats: {
      totalListings: 0,
      totalSales: 0,
      totalVolume: 0
    }
  };
}

/**
 * Generate unique listing ID
 */
function generateListingId() {
  return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate deposit for listing
 */
function calculateDeposit(startingPrice, duration) {
  const rate = DEPOSIT_RATES[duration] || DEPOSIT_RATES[LISTING_DURATION.MEDIUM];
  return Math.ceil(startingPrice * rate);
}

/**
 * Calculate sale fee
 */
function calculateSaleFee(salePrice) {
  return Math.ceil(salePrice * SALE_FEE_RATE);
}

/**
 * Create a new listing
 */
function createListing(state, sellerId, item, options = {}) {
  const {
    startingPrice = 100,
    buyoutPrice = null,
    duration = LISTING_DURATION.MEDIUM,
    category = LISTING_CATEGORY.MISCELLANEOUS
  } = options;

  // Validate inputs
  if (!sellerId) {
    return {
      success: false,
      error: 'Seller ID is required',
      state
    };
  }

  if (!item || !item.id) {
    return {
      success: false,
      error: 'Valid item is required',
      state
    };
  }

  if (startingPrice < 1) {
    return {
      success: false,
      error: 'Starting price must be at least 1 gold',
      state
    };
  }

  if (buyoutPrice !== null && buyoutPrice <= startingPrice) {
    return {
      success: false,
      error: 'Buyout price must be higher than starting price',
      state
    };
  }

  // Check max listings
  const playerActiveListings = getPlayerActiveListings(state, sellerId);
  if (playerActiveListings.length >= MAX_ACTIVE_LISTINGS) {
    return {
      success: false,
      error: 'Maximum active listings reached',
      state
    };
  }

  const listingId = generateListingId();
  const deposit = calculateDeposit(startingPrice, duration);
  const expiresAt = Date.now() + duration * 60 * 60 * 1000;

  const listing = {
    id: listingId,
    sellerId,
    item: { ...item },
    category,
    startingPrice,
    buyoutPrice,
    currentBid: null,
    currentBidderId: null,
    bidCount: 0,
    duration,
    deposit,
    status: LISTING_STATUS.ACTIVE,
    createdAt: Date.now(),
    expiresAt
  };

  // Update player listings index
  const playerListings = state.playerListings[sellerId] || [];

  return {
    success: true,
    listing,
    deposit,
    state: {
      ...state,
      listings: {
        ...state.listings,
        [listingId]: listing
      },
      playerListings: {
        ...state.playerListings,
        [sellerId]: [...playerListings, listingId]
      },
      stats: {
        ...state.stats,
        totalListings: state.stats.totalListings + 1
      }
    }
  };
}

/**
 * Place a bid on a listing
 */
function placeBid(state, listingId, bidderId, bidAmount) {
  const listing = state.listings[listingId];

  if (!listing) {
    return {
      success: false,
      error: 'Listing not found',
      state
    };
  }

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return {
      success: false,
      error: 'Listing is no longer active',
      state
    };
  }

  if (listing.sellerId === bidderId) {
    return {
      success: false,
      error: 'Cannot bid on your own listing',
      state
    };
  }

  if (Date.now() > listing.expiresAt) {
    return {
      success: false,
      error: 'Listing has expired',
      state
    };
  }

  // Calculate minimum bid
  let minimumBid;
  if (listing.currentBid) {
    minimumBid = Math.ceil(listing.currentBid * (1 + MIN_BID_INCREMENT));
  } else {
    minimumBid = listing.startingPrice;
  }

  if (bidAmount < minimumBid) {
    return {
      success: false,
      error: `Minimum bid is ${minimumBid} gold`,
      minimumBid,
      state
    };
  }

  // Record previous bidder for outbid notification
  const previousBidderId = listing.currentBidderId;
  const previousBid = listing.currentBid;

  // Update listing
  const updatedListing = {
    ...listing,
    currentBid: bidAmount,
    currentBidderId: bidderId,
    bidCount: listing.bidCount + 1
  };

  // Update player bids index
  const playerBids = state.playerBids[bidderId] || [];
  if (!playerBids.includes(listingId)) {
    playerBids.push(listingId);
  }

  return {
    success: true,
    outbidPlayer: previousBidderId,
    outbidAmount: previousBid,
    state: {
      ...state,
      listings: {
        ...state.listings,
        [listingId]: updatedListing
      },
      playerBids: {
        ...state.playerBids,
        [bidderId]: playerBids
      }
    }
  };
}

/**
 * Execute buyout on a listing
 */
function executeBuyout(state, listingId, buyerId) {
  const listing = state.listings[listingId];

  if (!listing) {
    return {
      success: false,
      error: 'Listing not found',
      state
    };
  }

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return {
      success: false,
      error: 'Listing is no longer active',
      state
    };
  }

  if (!listing.buyoutPrice) {
    return {
      success: false,
      error: 'This listing does not have a buyout option',
      state
    };
  }

  if (listing.sellerId === buyerId) {
    return {
      success: false,
      error: 'Cannot buy your own listing',
      state
    };
  }

  if (Date.now() > listing.expiresAt) {
    return {
      success: false,
      error: 'Listing has expired',
      state
    };
  }

  const salePrice = listing.buyoutPrice;
  const fee = calculateSaleFee(salePrice);
  const sellerReceives = salePrice - fee + listing.deposit;

  // Update listing status
  const updatedListing = {
    ...listing,
    status: LISTING_STATUS.SOLD,
    currentBid: salePrice,
    currentBidderId: buyerId,
    soldAt: Date.now()
  };

  // Add to history
  const historyEntry = {
    listingId,
    item: listing.item,
    sellerId: listing.sellerId,
    buyerId,
    salePrice,
    fee,
    soldAt: Date.now()
  };

  // Refund previous bidder if any
  const refundBidderId = listing.currentBidderId;
  const refundAmount = listing.currentBid;

  return {
    success: true,
    salePrice,
    fee,
    sellerReceives,
    refundBidderId,
    refundAmount,
    item: listing.item,
    state: {
      ...state,
      listings: {
        ...state.listings,
        [listingId]: updatedListing
      },
      history: [...state.history, historyEntry],
      stats: {
        ...state.stats,
        totalSales: state.stats.totalSales + 1,
        totalVolume: state.stats.totalVolume + salePrice
      }
    }
  };
}

/**
 * Cancel a listing
 */
function cancelListing(state, listingId, requesterId) {
  const listing = state.listings[listingId];

  if (!listing) {
    return {
      success: false,
      error: 'Listing not found',
      state
    };
  }

  if (listing.sellerId !== requesterId) {
    return {
      success: false,
      error: 'Only the seller can cancel this listing',
      state
    };
  }

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return {
      success: false,
      error: 'Listing is no longer active',
      state
    };
  }

  // Cannot cancel if there are bids
  if (listing.currentBid !== null) {
    return {
      success: false,
      error: 'Cannot cancel listing with active bids',
      state
    };
  }

  const updatedListing = {
    ...listing,
    status: LISTING_STATUS.CANCELLED,
    cancelledAt: Date.now()
  };

  // Return deposit
  const depositReturn = listing.deposit;

  return {
    success: true,
    depositReturn,
    item: listing.item,
    state: {
      ...state,
      listings: {
        ...state.listings,
        [listingId]: updatedListing
      }
    }
  };
}

/**
 * Process expired listings
 */
function processExpiredListings(state, currentTime = Date.now()) {
  const expiredListings = [];
  const updatedListings = { ...state.listings };
  const newHistory = [...state.history];
  let totalSales = state.stats.totalSales;
  let totalVolume = state.stats.totalVolume;

  Object.values(state.listings).forEach(listing => {
    if (listing.status !== LISTING_STATUS.ACTIVE) return;
    if (currentTime <= listing.expiresAt) return;

    if (listing.currentBid !== null) {
      // Sale to highest bidder
      const salePrice = listing.currentBid;
      const fee = calculateSaleFee(salePrice);
      const sellerReceives = salePrice - fee + listing.deposit;

      updatedListings[listing.id] = {
        ...listing,
        status: LISTING_STATUS.SOLD,
        soldAt: currentTime
      };

      newHistory.push({
        listingId: listing.id,
        item: listing.item,
        sellerId: listing.sellerId,
        buyerId: listing.currentBidderId,
        salePrice,
        fee,
        soldAt: currentTime
      });

      expiredListings.push({
        listing,
        sold: true,
        buyerId: listing.currentBidderId,
        salePrice,
        fee,
        sellerReceives
      });

      totalSales++;
      totalVolume += salePrice;
    } else {
      // No bids - expired without sale
      updatedListings[listing.id] = {
        ...listing,
        status: LISTING_STATUS.EXPIRED,
        expiredAt: currentTime
      };

      expiredListings.push({
        listing,
        sold: false,
        depositLost: listing.deposit
      });
    }
  });

  return {
    processedCount: expiredListings.length,
    expiredListings,
    state: {
      ...state,
      listings: updatedListings,
      history: newHistory,
      stats: {
        ...state.stats,
        totalSales,
        totalVolume
      }
    }
  };
}

/**
 * Search listings
 */
function searchListings(state, options = {}) {
  const {
    category = null,
    minPrice = null,
    maxPrice = null,
    searchTerm = null,
    sellerId = null,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit = 50,
    offset = 0
  } = options;

  let results = Object.values(state.listings).filter(listing => {
    if (listing.status !== LISTING_STATUS.ACTIVE) return false;
    if (Date.now() > listing.expiresAt) return false;
    if (category && listing.category !== category) return false;
    if (sellerId && listing.sellerId !== sellerId) return false;

    const price = listing.currentBid || listing.startingPrice;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const itemName = (listing.item.name || '').toLowerCase();
      if (!itemName.includes(term)) return false;
    }

    return true;
  });

  // Sort results
  results.sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'price':
        aVal = a.currentBid || a.startingPrice;
        bVal = b.currentBid || b.startingPrice;
        break;
      case 'buyout':
        aVal = a.buyoutPrice || Infinity;
        bVal = b.buyoutPrice || Infinity;
        break;
      case 'timeLeft':
        aVal = a.expiresAt;
        bVal = b.expiresAt;
        break;
      case 'bidCount':
        aVal = a.bidCount;
        bVal = b.bidCount;
        break;
      default:
        aVal = a.createdAt;
        bVal = b.createdAt;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const total = results.length;
  results = results.slice(offset, offset + limit);

  return {
    results,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Get player's active listings
 */
function getPlayerActiveListings(state, playerId) {
  const listingIds = state.playerListings[playerId] || [];
  return listingIds
    .map(id => state.listings[id])
    .filter(listing => listing && listing.status === LISTING_STATUS.ACTIVE);
}

/**
 * Get player's bid history
 */
function getPlayerBids(state, playerId) {
  const listingIds = state.playerBids[playerId] || [];
  return listingIds
    .map(id => state.listings[id])
    .filter(listing => listing && listing.currentBidderId === playerId);
}

/**
 * Get listing details
 */
function getListingDetails(state, listingId) {
  const listing = state.listings[listingId];
  if (!listing) return null;

  const currentPrice = listing.currentBid || listing.startingPrice;
  const minimumBid = listing.currentBid
    ? Math.ceil(listing.currentBid * (1 + MIN_BID_INCREMENT))
    : listing.startingPrice;
  const timeRemaining = Math.max(0, listing.expiresAt - Date.now());
  const isExpired = timeRemaining === 0;

  return {
    ...listing,
    currentPrice,
    minimumBid,
    timeRemaining,
    isExpired
  };
}

/**
 * Get auction house statistics
 */
function getAuctionHouseStats(state) {
  const activeListings = Object.values(state.listings).filter(
    l => l.status === LISTING_STATUS.ACTIVE && Date.now() <= l.expiresAt
  );

  const categoryBreakdown = {};
  activeListings.forEach(listing => {
    categoryBreakdown[listing.category] = (categoryBreakdown[listing.category] || 0) + 1;
  });

  return {
    totalListings: state.stats.totalListings,
    activeListings: activeListings.length,
    totalSales: state.stats.totalSales,
    totalVolume: state.stats.totalVolume,
    categoryBreakdown
  };
}

/**
 * Get price history for an item type
 */
function getPriceHistory(state, itemId, limit = 10) {
  return state.history
    .filter(h => h.item.id === itemId)
    .sort((a, b) => b.soldAt - a.soldAt)
    .slice(0, limit)
    .map(h => ({
      price: h.salePrice,
      soldAt: h.soldAt
    }));
}

/**
 * Get average price for an item
 */
function getAveragePrice(state, itemId) {
  const sales = state.history.filter(h => h.item.id === itemId);
  if (sales.length === 0) return null;

  const total = sales.reduce((sum, s) => sum + s.salePrice, 0);
  return Math.round(total / sales.length);
}

// Export everything
export {
  LISTING_CATEGORY,
  LISTING_STATUS,
  LISTING_DURATION,
  DEPOSIT_RATES,
  SALE_FEE_RATE,
  MIN_BID_INCREMENT,
  MAX_ACTIVE_LISTINGS,
  createAuctionHouseState,
  calculateDeposit,
  calculateSaleFee,
  createListing,
  placeBid,
  executeBuyout,
  cancelListing,
  processExpiredListings,
  searchListings,
  getPlayerActiveListings,
  getPlayerBids,
  getListingDetails,
  getAuctionHouseStats,
  getPriceHistory,
  getAveragePrice
};
