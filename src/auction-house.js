/**
 * Auction House System
 * Player-driven economy with bidding and buyout
 */

// Listing durations
export const LISTING_DURATIONS = {
  SHORT: { id: 'short', name: '12 Hours', hours: 12, fee: 0.05 },
  MEDIUM: { id: 'medium', name: '24 Hours', hours: 24, fee: 0.10 },
  LONG: { id: 'long', name: '48 Hours', hours: 48, fee: 0.15 },
  EXTENDED: { id: 'extended', name: '72 Hours', hours: 72, fee: 0.20 }
};

// Listing statuses
export const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Item categories for filtering
export const ITEM_CATEGORIES = {
  WEAPONS: { id: 'weapons', name: 'Weapons' },
  ARMOR: { id: 'armor', name: 'Armor' },
  ACCESSORIES: { id: 'accessories', name: 'Accessories' },
  CONSUMABLES: { id: 'consumables', name: 'Consumables' },
  MATERIALS: { id: 'materials', name: 'Materials' },
  RECIPES: { id: 'recipes', name: 'Recipes' },
  GEMS: { id: 'gems', name: 'Gems' },
  MOUNTS: { id: 'mounts', name: 'Mounts' },
  PETS: { id: 'pets', name: 'Pets' },
  MISC: { id: 'misc', name: 'Miscellaneous' }
};

// Sort options
export const SORT_OPTIONS = {
  PRICE_LOW: { id: 'price_low', name: 'Price: Low to High' },
  PRICE_HIGH: { id: 'price_high', name: 'Price: High to Low' },
  TIME_ENDING: { id: 'time_ending', name: 'Time: Ending Soon' },
  TIME_NEWEST: { id: 'time_newest', name: 'Time: Newest First' },
  BID_COUNT: { id: 'bid_count', name: 'Most Bids' },
  NAME_AZ: { id: 'name_az', name: 'Name: A-Z' }
};

// Rarity filters
export const RARITY_FILTERS = {
  COMMON: { id: 'common', name: 'Common', color: '#ffffff' },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#00ff00' },
  RARE: { id: 'rare', name: 'Rare', color: '#0088ff' },
  EPIC: { id: 'epic', name: 'Epic', color: '#aa00ff' },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#ffaa00' }
};

/**
 * Get auction state from game state
 */
function getAuctionState(state) {
  return state.auctionHouse || {
    listings: {},
    playerListings: {},
    playerBids: {},
    history: [],
    favorites: [],
    searchHistory: [],
    stats: {
      totalListings: 0,
      totalSales: 0,
      totalVolume: 0
    }
  };
}

/**
 * Initialize auction house state
 */
export function initAuctionState(state) {
  return {
    state: {
      ...state,
      auctionHouse: {
        listings: {},
        playerListings: {},
        playerBids: {},
        history: [],
        favorites: [],
        searchHistory: [],
        stats: {
          totalListings: 0,
          totalSales: 0,
          totalVolume: 0
        }
      }
    },
    success: true
  };
}

/**
 * Create a new listing
 */
export function createListing(state, sellerId, item, options = {}) {
  if (!sellerId || !item) {
    return { state, success: false, error: 'Seller and item required' };
  }

  if (!item.id || !item.name) {
    return { state, success: false, error: 'Invalid item' };
  }

  const startingBid = options.startingBid !== undefined ? options.startingBid : 1;
  const buyoutPrice = options.buyoutPrice || null;

  if (startingBid < 1) {
    return { state, success: false, error: 'Starting bid must be at least 1' };
  }

  if (buyoutPrice !== null && buyoutPrice <= startingBid) {
    return { state, success: false, error: 'Buyout must be higher than starting bid' };
  }

  const durationKey = (options.duration || 'medium').toUpperCase();
  const duration = LISTING_DURATIONS[durationKey] || LISTING_DURATIONS.MEDIUM;

  const auctionState = getAuctionState(state);
  const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const listing = {
    id: listingId,
    sellerId,
    item: { ...item },
    category: options.category || 'misc',
    startingBid,
    currentBid: 0,
    buyoutPrice,
    bidCount: 0,
    highestBidderId: null,
    duration: duration.id,
    fee: duration.fee,
    createdAt: Date.now(),
    expiresAt: Date.now() + (duration.hours * 60 * 60 * 1000),
    status: LISTING_STATUS.ACTIVE,
    bidHistory: []
  };

  const playerListings = auctionState.playerListings[sellerId] || [];

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        listings: {
          ...auctionState.listings,
          [listingId]: listing
        },
        playerListings: {
          ...auctionState.playerListings,
          [sellerId]: [...playerListings, listingId]
        },
        stats: {
          ...auctionState.stats,
          totalListings: auctionState.stats.totalListings + 1
        }
      }
    },
    success: true,
    listingId,
    listing
  };
}

/**
 * Place a bid on a listing
 */
export function placeBid(state, bidderId, listingId, bidAmount) {
  const auctionState = getAuctionState(state);
  const listing = auctionState.listings[listingId];

  if (!listing) {
    return { state, success: false, error: 'Listing not found' };
  }

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return { state, success: false, error: 'Listing is not active' };
  }

  if (listing.sellerId === bidderId) {
    return { state, success: false, error: 'Cannot bid on own listing' };
  }

  if (Date.now() > listing.expiresAt) {
    return { state, success: false, error: 'Listing has expired' };
  }

  const minBid = listing.currentBid > 0 
    ? listing.currentBid + Math.max(1, Math.floor(listing.currentBid * 0.05))
    : listing.startingBid;

  if (bidAmount < minBid) {
    return { state, success: false, error: `Minimum bid is ${minBid}` };
  }

  const bidEntry = {
    bidderId,
    amount: bidAmount,
    timestamp: Date.now()
  };

  const previousBidderId = listing.highestBidderId;
  const playerBids = auctionState.playerBids[bidderId] || [];

  const updatedListing = {
    ...listing,
    currentBid: bidAmount,
    bidCount: listing.bidCount + 1,
    highestBidderId: bidderId,
    bidHistory: [...listing.bidHistory, bidEntry]
  };

  // Add to player's active bids if not already there
  const updatedPlayerBids = playerBids.includes(listingId)
    ? playerBids
    : [...playerBids, listingId];

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        listings: {
          ...auctionState.listings,
          [listingId]: updatedListing
        },
        playerBids: {
          ...auctionState.playerBids,
          [bidderId]: updatedPlayerBids
        }
      }
    },
    success: true,
    listingId,
    bidAmount,
    previousBidderId,
    outbid: previousBidderId !== null && previousBidderId !== bidderId
  };
}

/**
 * Buy out a listing immediately
 */
export function buyoutListing(state, buyerId, listingId) {
  const auctionState = getAuctionState(state);
  const listing = auctionState.listings[listingId];

  if (!listing) {
    return { state, success: false, error: 'Listing not found' };
  }

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return { state, success: false, error: 'Listing is not active' };
  }

  if (listing.sellerId === buyerId) {
    return { state, success: false, error: 'Cannot buy own listing' };
  }

  if (!listing.buyoutPrice) {
    return { state, success: false, error: 'No buyout price set' };
  }

  if (Date.now() > listing.expiresAt) {
    return { state, success: false, error: 'Listing has expired' };
  }

  const saleRecord = {
    listingId,
    itemId: listing.item.id,
    itemName: listing.item.name,
    sellerId: listing.sellerId,
    buyerId,
    price: listing.buyoutPrice,
    type: 'buyout',
    timestamp: Date.now()
  };

  const updatedListing = {
    ...listing,
    status: LISTING_STATUS.SOLD,
    currentBid: listing.buyoutPrice,
    highestBidderId: buyerId,
    soldAt: Date.now()
  };

  // Calculate seller proceeds after fee
  const fee = Math.floor(listing.buyoutPrice * listing.fee);
  const proceeds = listing.buyoutPrice - fee;

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        listings: {
          ...auctionState.listings,
          [listingId]: updatedListing
        },
        history: [...auctionState.history.slice(-99), saleRecord],
        stats: {
          ...auctionState.stats,
          totalSales: auctionState.stats.totalSales + 1,
          totalVolume: auctionState.stats.totalVolume + listing.buyoutPrice
        }
      }
    },
    success: true,
    listingId,
    price: listing.buyoutPrice,
    fee,
    proceeds,
    item: listing.item
  };
}

/**
 * Cancel a listing
 */
export function cancelListing(state, sellerId, listingId) {
  const auctionState = getAuctionState(state);
  const listing = auctionState.listings[listingId];

  if (!listing) {
    return { state, success: false, error: 'Listing not found' };
  }

  if (listing.sellerId !== sellerId) {
    return { state, success: false, error: 'Not your listing' };
  }

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return { state, success: false, error: 'Listing is not active' };
  }

  if (listing.bidCount > 0) {
    return { state, success: false, error: 'Cannot cancel listing with bids' };
  }

  const updatedListing = {
    ...listing,
    status: LISTING_STATUS.CANCELLED,
    cancelledAt: Date.now()
  };

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        listings: {
          ...auctionState.listings,
          [listingId]: updatedListing
        }
      }
    },
    success: true,
    listingId,
    item: listing.item
  };
}

/**
 * Process expired listings
 */
export function processExpiredListings(state) {
  const auctionState = getAuctionState(state);
  const now = Date.now();
  const results = [];

  const updatedListings = { ...auctionState.listings };
  const newHistory = [...auctionState.history];
  let salesCount = 0;
  let volumeAdded = 0;

  Object.values(auctionState.listings).forEach(listing => {
    if (listing.status !== LISTING_STATUS.ACTIVE) return;
    if (now <= listing.expiresAt) return;

    if (listing.bidCount > 0 && listing.highestBidderId) {
      // Sold to highest bidder
      const saleRecord = {
        listingId: listing.id,
        itemId: listing.item.id,
        itemName: listing.item.name,
        sellerId: listing.sellerId,
        buyerId: listing.highestBidderId,
        price: listing.currentBid,
        type: 'auction',
        timestamp: now
      };

      updatedListings[listing.id] = {
        ...listing,
        status: LISTING_STATUS.SOLD,
        soldAt: now
      };

      newHistory.push(saleRecord);
      salesCount++;
      volumeAdded += listing.currentBid;

      results.push({
        listingId: listing.id,
        result: 'sold',
        buyerId: listing.highestBidderId,
        price: listing.currentBid
      });
    } else {
      // No bids, expired
      updatedListings[listing.id] = {
        ...listing,
        status: LISTING_STATUS.EXPIRED,
        expiredAt: now
      };

      results.push({
        listingId: listing.id,
        result: 'expired'
      });
    }
  });

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        listings: updatedListings,
        history: newHistory.slice(-100),
        stats: {
          ...auctionState.stats,
          totalSales: auctionState.stats.totalSales + salesCount,
          totalVolume: auctionState.stats.totalVolume + volumeAdded
        }
      }
    },
    success: true,
    processed: results.length,
    results
  };
}

/**
 * Search listings
 */
export function searchListings(state, query = {}) {
  const auctionState = getAuctionState(state);
  const activeListings = Object.values(auctionState.listings)
    .filter(l => l.status === LISTING_STATUS.ACTIVE && Date.now() <= l.expiresAt);

  let results = [...activeListings];

  // Filter by name
  if (query.name) {
    const searchTerm = query.name.toLowerCase();
    results = results.filter(l => 
      l.item.name.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by category
  if (query.category) {
    results = results.filter(l => l.category === query.category);
  }

  // Filter by rarity
  if (query.rarity) {
    results = results.filter(l => l.item.rarity === query.rarity);
  }

  // Filter by price range
  if (query.minPrice !== undefined) {
    results = results.filter(l => {
      const price = l.currentBid > 0 ? l.currentBid : l.startingBid;
      return price >= query.minPrice;
    });
  }

  if (query.maxPrice !== undefined) {
    results = results.filter(l => {
      const price = l.buyoutPrice || l.currentBid || l.startingBid;
      return price <= query.maxPrice;
    });
  }

  // Filter by level requirement
  if (query.minLevel !== undefined) {
    results = results.filter(l => 
      (l.item.level || 1) >= query.minLevel
    );
  }

  if (query.maxLevel !== undefined) {
    results = results.filter(l => 
      (l.item.level || 1) <= query.maxLevel
    );
  }

  // Sort results
  const sortKey = query.sort || 'time_ending';
  switch (sortKey) {
    case 'price_low':
      results.sort((a, b) => {
        const priceA = a.currentBid || a.startingBid;
        const priceB = b.currentBid || b.startingBid;
        return priceA - priceB;
      });
      break;
    case 'price_high':
      results.sort((a, b) => {
        const priceA = a.currentBid || a.startingBid;
        const priceB = b.currentBid || b.startingBid;
        return priceB - priceA;
      });
      break;
    case 'time_ending':
      results.sort((a, b) => a.expiresAt - b.expiresAt);
      break;
    case 'time_newest':
      results.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'bid_count':
      results.sort((a, b) => b.bidCount - a.bidCount);
      break;
    case 'name_az':
      results.sort((a, b) => a.item.name.localeCompare(b.item.name));
      break;
  }

  // Pagination
  const page = query.page || 1;
  const perPage = query.perPage || 20;
  const startIndex = (page - 1) * perPage;
  const paginatedResults = results.slice(startIndex, startIndex + perPage);

  return {
    results: paginatedResults,
    total: results.length,
    page,
    perPage,
    totalPages: Math.ceil(results.length / perPage)
  };
}

/**
 * Get player's listings
 */
export function getPlayerListings(state, playerId) {
  const auctionState = getAuctionState(state);
  const listingIds = auctionState.playerListings[playerId] || [];

  const listings = listingIds
    .map(id => auctionState.listings[id])
    .filter(l => l !== undefined);

  const active = listings.filter(l => l.status === LISTING_STATUS.ACTIVE);
  const sold = listings.filter(l => l.status === LISTING_STATUS.SOLD);
  const expired = listings.filter(l => l.status === LISTING_STATUS.EXPIRED);
  const cancelled = listings.filter(l => l.status === LISTING_STATUS.CANCELLED);

  return {
    total: listings.length,
    active,
    sold,
    expired,
    cancelled
  };
}

/**
 * Get player's bids
 */
export function getPlayerBids(state, playerId) {
  const auctionState = getAuctionState(state);
  const listingIds = auctionState.playerBids[playerId] || [];

  const listings = listingIds
    .map(id => auctionState.listings[id])
    .filter(l => l !== undefined);

  const winning = listings.filter(l => 
    l.status === LISTING_STATUS.ACTIVE && 
    l.highestBidderId === playerId
  );

  const outbid = listings.filter(l => 
    l.status === LISTING_STATUS.ACTIVE && 
    l.highestBidderId !== playerId
  );

  const won = listings.filter(l => 
    l.status === LISTING_STATUS.SOLD && 
    l.highestBidderId === playerId
  );

  return {
    total: listings.length,
    winning,
    outbid,
    won
  };
}

/**
 * Add listing to favorites
 */
export function addFavorite(state, playerId, listingId) {
  const auctionState = getAuctionState(state);
  
  if (!auctionState.listings[listingId]) {
    return { state, success: false, error: 'Listing not found' };
  }

  const playerFavorites = auctionState.favorites.filter(f => f.playerId === playerId);
  if (playerFavorites.some(f => f.listingId === listingId)) {
    return { state, success: false, error: 'Already favorited' };
  }

  const favorite = {
    playerId,
    listingId,
    addedAt: Date.now()
  };

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        favorites: [...auctionState.favorites, favorite]
      }
    },
    success: true,
    listingId
  };
}

/**
 * Remove from favorites
 */
export function removeFavorite(state, playerId, listingId) {
  const auctionState = getAuctionState(state);

  const updatedFavorites = auctionState.favorites.filter(
    f => !(f.playerId === playerId && f.listingId === listingId)
  );

  if (updatedFavorites.length === auctionState.favorites.length) {
    return { state, success: false, error: 'Not in favorites' };
  }

  return {
    state: {
      ...state,
      auctionHouse: {
        ...auctionState,
        favorites: updatedFavorites
      }
    },
    success: true,
    listingId
  };
}

/**
 * Get player favorites
 */
export function getPlayerFavorites(state, playerId) {
  const auctionState = getAuctionState(state);
  
  const favoriteIds = auctionState.favorites
    .filter(f => f.playerId === playerId)
    .map(f => f.listingId);

  const listings = favoriteIds
    .map(id => auctionState.listings[id])
    .filter(l => l !== undefined);

  return {
    favorites: listings,
    count: listings.length
  };
}

/**
 * Get listing details
 */
export function getListingDetails(state, listingId) {
  const auctionState = getAuctionState(state);
  const listing = auctionState.listings[listingId];

  if (!listing) {
    return { listing: null, found: false };
  }

  const timeRemaining = Math.max(0, listing.expiresAt - Date.now());
  const minNextBid = listing.currentBid > 0
    ? listing.currentBid + Math.max(1, Math.floor(listing.currentBid * 0.05))
    : listing.startingBid;

  return {
    listing,
    found: true,
    timeRemaining,
    minNextBid,
    isExpired: timeRemaining === 0 && listing.status === LISTING_STATUS.ACTIVE
  };
}

/**
 * Get auction house statistics
 */
export function getAuctionStats(state) {
  const auctionState = getAuctionState(state);
  const activeListings = Object.values(auctionState.listings)
    .filter(l => l.status === LISTING_STATUS.ACTIVE && Date.now() <= l.expiresAt);

  // Category breakdown
  const categoryBreakdown = {};
  activeListings.forEach(listing => {
    const cat = listing.category || 'misc';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  // Average prices by category
  const categoryPrices = {};
  activeListings.forEach(listing => {
    const cat = listing.category || 'misc';
    const price = listing.currentBid || listing.startingBid;
    if (!categoryPrices[cat]) {
      categoryPrices[cat] = { total: 0, count: 0 };
    }
    categoryPrices[cat].total += price;
    categoryPrices[cat].count++;
  });

  const averagePrices = {};
  Object.entries(categoryPrices).forEach(([cat, data]) => {
    averagePrices[cat] = Math.floor(data.total / data.count);
  });

  return {
    activeListings: activeListings.length,
    totalListings: auctionState.stats.totalListings,
    totalSales: auctionState.stats.totalSales,
    totalVolume: auctionState.stats.totalVolume,
    categoryBreakdown,
    averagePrices,
    recentSales: auctionState.history.slice(-10)
  };
}

/**
 * Get price history for an item
 */
export function getPriceHistory(state, itemId) {
  const auctionState = getAuctionState(state);
  
  const relevantSales = auctionState.history
    .filter(sale => sale.itemId === itemId)
    .map(sale => ({
      price: sale.price,
      timestamp: sale.timestamp,
      type: sale.type
    }));

  if (relevantSales.length === 0) {
    return {
      itemId,
      sales: [],
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0
    };
  }

  const prices = relevantSales.map(s => s.price);
  const sum = prices.reduce((a, b) => a + b, 0);

  return {
    itemId,
    sales: relevantSales,
    averagePrice: Math.floor(sum / prices.length),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices)
  };
}
