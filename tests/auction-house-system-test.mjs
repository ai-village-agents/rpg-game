/**
 * Auction House System Tests
 * Comprehensive tests for marketplace trading mechanics
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
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
} from '../src/auction-house-system.js';

import {
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
} from '../src/auction-house-system-ui.js';

// ==================== Constants Tests ====================

describe('Listing Categories', () => {
  it('should have all expected categories', () => {
    assert.strictEqual(LISTING_CATEGORY.WEAPONS, 'weapons');
    assert.strictEqual(LISTING_CATEGORY.ARMOR, 'armor');
    assert.strictEqual(LISTING_CATEGORY.CONSUMABLES, 'consumables');
    assert.strictEqual(LISTING_CATEGORY.MATERIALS, 'materials');
    assert.strictEqual(LISTING_CATEGORY.RECIPES, 'recipes');
    assert.strictEqual(LISTING_CATEGORY.GEMS, 'gems');
    assert.strictEqual(LISTING_CATEGORY.MOUNTS, 'mounts');
    assert.strictEqual(LISTING_CATEGORY.PETS, 'pets');
    assert.strictEqual(LISTING_CATEGORY.MISCELLANEOUS, 'miscellaneous');
  });

  it('should have 9 categories', () => {
    assert.strictEqual(Object.keys(LISTING_CATEGORY).length, 9);
  });
});

describe('Listing Status', () => {
  it('should have all status types', () => {
    assert.strictEqual(LISTING_STATUS.ACTIVE, 'active');
    assert.strictEqual(LISTING_STATUS.SOLD, 'sold');
    assert.strictEqual(LISTING_STATUS.EXPIRED, 'expired');
    assert.strictEqual(LISTING_STATUS.CANCELLED, 'cancelled');
  });
});

describe('Listing Duration', () => {
  it('should have all duration options', () => {
    assert.strictEqual(LISTING_DURATION.SHORT, 12);
    assert.strictEqual(LISTING_DURATION.MEDIUM, 24);
    assert.strictEqual(LISTING_DURATION.LONG, 48);
  });

  it('should have deposit rates for each duration', () => {
    Object.values(LISTING_DURATION).forEach(duration => {
      assert.ok(DEPOSIT_RATES[duration] !== undefined, `Missing rate for ${duration}`);
    });
  });

  it('should have increasing deposit rates for longer durations', () => {
    assert.ok(DEPOSIT_RATES[LISTING_DURATION.LONG] > DEPOSIT_RATES[LISTING_DURATION.SHORT]);
  });
});

describe('Fee Rates', () => {
  it('should have valid sale fee rate', () => {
    assert.ok(SALE_FEE_RATE > 0 && SALE_FEE_RATE < 1);
  });

  it('should have valid min bid increment', () => {
    assert.ok(MIN_BID_INCREMENT > 0 && MIN_BID_INCREMENT < 1);
  });

  it('should have max active listings', () => {
    assert.ok(MAX_ACTIVE_LISTINGS > 0);
  });
});

// ==================== State Creation Tests ====================

describe('createAuctionHouseState', () => {
  it('should create empty state', () => {
    const state = createAuctionHouseState();
    assert.deepStrictEqual(state.listings, {});
    assert.deepStrictEqual(state.playerListings, {});
    assert.deepStrictEqual(state.playerBids, {});
    assert.deepStrictEqual(state.history, []);
  });

  it('should initialize stats to zero', () => {
    const state = createAuctionHouseState();
    assert.strictEqual(state.stats.totalListings, 0);
    assert.strictEqual(state.stats.totalSales, 0);
    assert.strictEqual(state.stats.totalVolume, 0);
  });
});

// ==================== Calculation Tests ====================

describe('calculateDeposit', () => {
  it('should calculate deposit correctly', () => {
    const deposit = calculateDeposit(1000, LISTING_DURATION.MEDIUM);
    assert.strictEqual(deposit, Math.ceil(1000 * DEPOSIT_RATES[LISTING_DURATION.MEDIUM]));
  });

  it('should round up to nearest integer', () => {
    const deposit = calculateDeposit(33, LISTING_DURATION.SHORT);
    assert.strictEqual(deposit, Math.ceil(33 * DEPOSIT_RATES[LISTING_DURATION.SHORT]));
    assert.ok(Number.isInteger(deposit));
  });
});

describe('calculateSaleFee', () => {
  it('should calculate fee correctly', () => {
    const fee = calculateSaleFee(1000);
    assert.strictEqual(fee, Math.ceil(1000 * SALE_FEE_RATE));
  });

  it('should round up to nearest integer', () => {
    const fee = calculateSaleFee(123);
    assert.ok(Number.isInteger(fee));
  });
});

// ==================== Listing Creation Tests ====================

describe('createListing', () => {
  it('should create listing successfully', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, 'player1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.listing);
    assert.strictEqual(result.listing.sellerId, 'player1');
    assert.strictEqual(result.listing.status, LISTING_STATUS.ACTIVE);
  });

  it('should fail without seller ID', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, null, item);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Seller ID is required');
  });

  it('should fail without valid item', () => {
    const state = createAuctionHouseState();

    const result = createListing(state, 'player1', null);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Valid item is required');
  });

  it('should fail with invalid starting price', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, 'player1', item, { startingPrice: 0 });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Starting price'));
  });

  it('should fail if buyout not higher than starting price', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, 'player1', item, {
      startingPrice: 100,
      buyoutPrice: 50
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Buyout price'));
  });

  it('should return correct deposit', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, 'player1', item, {
      startingPrice: 1000,
      duration: LISTING_DURATION.LONG
    });

    assert.strictEqual(result.deposit, calculateDeposit(1000, LISTING_DURATION.LONG));
  });

  it('should add to player listings index', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, 'player1', item);

    assert.ok(result.state.playerListings['player1'].includes(result.listing.id));
  });

  it('should fail at max listings', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword', name: 'Sword' };

    for (let i = 0; i < MAX_ACTIVE_LISTINGS; i++) {
      state = createListing(state, 'player1', { ...item, id: `sword_${i}` }).state;
    }

    const result = createListing(state, 'player1', { id: 'extra', name: 'Extra' });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Maximum'));
  });

  it('should increment total listings stat', () => {
    const state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };

    const result = createListing(state, 'player1', item);

    assert.strictEqual(result.state.stats.totalListings, 1);
  });
});

// ==================== Bidding Tests ====================

describe('placeBid', () => {
  it('should place bid successfully', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    const result = placeBid(state, createResult.listing.id, 'bidder1', 100);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.listings[createResult.listing.id].currentBid, 100);
    assert.strictEqual(result.state.listings[createResult.listing.id].currentBidderId, 'bidder1');
  });

  it('should fail for non-existent listing', () => {
    const state = createAuctionHouseState();

    const result = placeBid(state, 'fake_listing', 'bidder1', 100);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Listing not found');
  });

  it('should fail if seller bids on own listing', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item);
    state = createResult.state;

    const result = placeBid(state, createResult.listing.id, 'seller1', 100);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('own listing'));
  });

  it('should fail if bid below minimum', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    const result = placeBid(state, createResult.listing.id, 'bidder1', 50);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Minimum bid'));
  });

  it('should require minimum increment over current bid', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 100).state;

    const minimumNext = Math.ceil(100 * (1 + MIN_BID_INCREMENT));
    const result = placeBid(state, createResult.listing.id, 'bidder2', minimumNext - 1);

    assert.strictEqual(result.success, false);
  });

  it('should return outbid player info', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 100).state;
    const result = placeBid(state, createResult.listing.id, 'bidder2', 150);

    assert.strictEqual(result.outbidPlayer, 'bidder1');
    assert.strictEqual(result.outbidAmount, 100);
  });

  it('should increment bid count', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 100).state;
    state = placeBid(state, createResult.listing.id, 'bidder2', 150).state;

    assert.strictEqual(state.listings[createResult.listing.id].bidCount, 2);
  });

  it('should add to player bids index', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    const result = placeBid(state, createResult.listing.id, 'bidder1', 100);

    assert.ok(result.state.playerBids['bidder1'].includes(createResult.listing.id));
  });
});

// ==================== Buyout Tests ====================

describe('executeBuyout', () => {
  it('should execute buyout successfully', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    const result = executeBuyout(state, createResult.listing.id, 'buyer1');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.salePrice, 500);
    assert.strictEqual(result.state.listings[createResult.listing.id].status, LISTING_STATUS.SOLD);
  });

  it('should fail for listing without buyout', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100
      // No buyout
    });
    state = createResult.state;

    const result = executeBuyout(state, createResult.listing.id, 'buyer1');

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('buyout'));
  });

  it('should fail if seller tries to buy', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    const result = executeBuyout(state, createResult.listing.id, 'seller1');

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('own listing'));
  });

  it('should return correct fee calculation', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    const result = executeBuyout(state, createResult.listing.id, 'buyer1');

    assert.strictEqual(result.fee, calculateSaleFee(500));
  });

  it('should refund previous bidder', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 150).state;
    const result = executeBuyout(state, createResult.listing.id, 'buyer2');

    assert.strictEqual(result.refundBidderId, 'bidder1');
    assert.strictEqual(result.refundAmount, 150);
  });

  it('should add to history', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    const result = executeBuyout(state, createResult.listing.id, 'buyer1');

    assert.strictEqual(result.state.history.length, 1);
    assert.strictEqual(result.state.history[0].buyerId, 'buyer1');
  });

  it('should update stats', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    const result = executeBuyout(state, createResult.listing.id, 'buyer1');

    assert.strictEqual(result.state.stats.totalSales, 1);
    assert.strictEqual(result.state.stats.totalVolume, 500);
  });
});

// ==================== Cancel Tests ====================

describe('cancelListing', () => {
  it('should cancel listing successfully', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item);
    state = createResult.state;

    const result = cancelListing(state, createResult.listing.id, 'seller1');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.listings[createResult.listing.id].status, LISTING_STATUS.CANCELLED);
  });

  it('should return deposit', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 1000 });
    state = createResult.state;

    const result = cancelListing(state, createResult.listing.id, 'seller1');

    assert.strictEqual(result.depositReturn, createResult.deposit);
  });

  it('should fail if not the seller', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item);
    state = createResult.state;

    const result = cancelListing(state, createResult.listing.id, 'other_player');

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('seller'));
  });

  it('should fail if has bids', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 100).state;
    const result = cancelListing(state, createResult.listing.id, 'seller1');

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('bids'));
  });

  it('should return the item', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item);
    state = createResult.state;

    const result = cancelListing(state, createResult.listing.id, 'seller1');

    assert.strictEqual(result.item.id, 'sword_1');
  });
});

// ==================== Expiration Tests ====================

describe('processExpiredListings', () => {
  it('should process expired listing with bids as sale', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      duration: LISTING_DURATION.SHORT
    });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 150).state;

    // Simulate expiration
    const futureTime = Date.now() + LISTING_DURATION.SHORT * 60 * 60 * 1000 + 1000;
    const result = processExpiredListings(state, futureTime);

    assert.strictEqual(result.processedCount, 1);
    assert.strictEqual(result.expiredListings[0].sold, true);
    assert.strictEqual(result.state.listings[createResult.listing.id].status, LISTING_STATUS.SOLD);
  });

  it('should process expired listing without bids as expired', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item, {
      startingPrice: 100,
      duration: LISTING_DURATION.SHORT
    });
    state = createResult.state;

    const futureTime = Date.now() + LISTING_DURATION.SHORT * 60 * 60 * 1000 + 1000;
    const result = processExpiredListings(state, futureTime);

    assert.strictEqual(result.processedCount, 1);
    assert.strictEqual(result.expiredListings[0].sold, false);
    assert.ok(result.expiredListings[0].depositLost > 0);
    assert.strictEqual(result.state.listings[createResult.listing.id].status, LISTING_STATUS.EXPIRED);
  });

  it('should not process active listings', () => {
    let state = createAuctionHouseState();
    const item = { id: 'sword_1', name: 'Iron Sword' };
    const createResult = createListing(state, 'seller1', item);
    state = createResult.state;

    const result = processExpiredListings(state);

    assert.strictEqual(result.processedCount, 0);
  });
});

// ==================== Search Tests ====================

describe('searchListings', () => {
  it('should return active listings', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'seller1', { id: 'sword', name: 'Sword' }).state;
    state = createListing(state, 'seller2', { id: 'shield', name: 'Shield' }).state;

    const { results } = searchListings(state);

    assert.strictEqual(results.length, 2);
  });

  it('should filter by category', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'seller1', { id: 'sword', name: 'Sword' }, {
      category: LISTING_CATEGORY.WEAPONS
    }).state;
    state = createListing(state, 'seller2', { id: 'potion', name: 'Potion' }, {
      category: LISTING_CATEGORY.CONSUMABLES
    }).state;

    const { results } = searchListings(state, { category: LISTING_CATEGORY.WEAPONS });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].category, LISTING_CATEGORY.WEAPONS);
  });

  it('should filter by price range', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'seller1', { id: 'cheap', name: 'Cheap' }, { startingPrice: 50 }).state;
    state = createListing(state, 'seller2', { id: 'expensive', name: 'Expensive' }, { startingPrice: 500 }).state;

    const { results } = searchListings(state, { minPrice: 100 });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].item.name, 'Expensive');
  });

  it('should filter by search term', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'seller1', { id: 'iron_sword', name: 'Iron Sword' }).state;
    state = createListing(state, 'seller2', { id: 'steel_axe', name: 'Steel Axe' }).state;

    const { results } = searchListings(state, { searchTerm: 'sword' });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].item.name, 'Iron Sword');
  });

  it('should respect limit and offset', () => {
    let state = createAuctionHouseState();
    for (let i = 0; i < 10; i++) {
      state = createListing(state, 'seller1', { id: `item_${i}`, name: `Item ${i}` }).state;
    }

    const { results, total, hasMore } = searchListings(state, { limit: 5, offset: 0 });

    assert.strictEqual(results.length, 5);
    assert.strictEqual(total, 10);
    assert.strictEqual(hasMore, true);
  });

  it('should sort by price', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'seller1', { id: 'high', name: 'High' }, { startingPrice: 500 }).state;
    state = createListing(state, 'seller2', { id: 'low', name: 'Low' }, { startingPrice: 100 }).state;

    const { results } = searchListings(state, { sortBy: 'price', sortOrder: 'asc' });

    assert.strictEqual(results[0].item.name, 'Low');
  });
});

// ==================== Player Query Tests ====================

describe('getPlayerActiveListings', () => {
  it('should return player listings', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'player1', { id: 'item1', name: 'Item 1' }).state;
    state = createListing(state, 'player1', { id: 'item2', name: 'Item 2' }).state;
    state = createListing(state, 'player2', { id: 'item3', name: 'Item 3' }).state;

    const listings = getPlayerActiveListings(state, 'player1');

    assert.strictEqual(listings.length, 2);
  });

  it('should only return active listings', () => {
    let state = createAuctionHouseState();
    const result = createListing(state, 'player1', { id: 'item1', name: 'Item 1' });
    state = result.state;

    state = cancelListing(state, result.listing.id, 'player1').state;

    const listings = getPlayerActiveListings(state, 'player1');

    assert.strictEqual(listings.length, 0);
  });
});

describe('getPlayerBids', () => {
  it('should return player bids where they are highest', () => {
    let state = createAuctionHouseState();
    const createResult = createListing(state, 'seller1', { id: 'item1', name: 'Item 1' }, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 150).state;

    const bids = getPlayerBids(state, 'bidder1');

    assert.strictEqual(bids.length, 1);
  });

  it('should not return bids where outbid', () => {
    let state = createAuctionHouseState();
    const createResult = createListing(state, 'seller1', { id: 'item1', name: 'Item 1' }, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 150).state;
    state = placeBid(state, createResult.listing.id, 'bidder2', 200).state;

    const bids = getPlayerBids(state, 'bidder1');

    assert.strictEqual(bids.length, 0);
  });
});

// ==================== Detail and Stats Tests ====================

describe('getListingDetails', () => {
  it('should return null for non-existent listing', () => {
    const state = createAuctionHouseState();
    const details = getListingDetails(state, 'fake_id');

    assert.strictEqual(details, null);
  });

  it('should return details with calculated values', () => {
    let state = createAuctionHouseState();
    const createResult = createListing(state, 'seller1', { id: 'item1', name: 'Item 1' }, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    const details = getListingDetails(state, createResult.listing.id);

    assert.strictEqual(details.currentPrice, 100);
    assert.strictEqual(details.minimumBid, 100);
    assert.ok(details.timeRemaining > 0);
    assert.strictEqual(details.isExpired, false);
  });

  it('should calculate minimum bid after bid placed', () => {
    let state = createAuctionHouseState();
    const createResult = createListing(state, 'seller1', { id: 'item1', name: 'Item 1' }, { startingPrice: 100 });
    state = createResult.state;

    state = placeBid(state, createResult.listing.id, 'bidder1', 100).state;

    const details = getListingDetails(state, createResult.listing.id);
    const expectedMin = Math.ceil(100 * (1 + MIN_BID_INCREMENT));

    assert.strictEqual(details.minimumBid, expectedMin);
  });
});

describe('getAuctionHouseStats', () => {
  it('should return stats', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'seller1', { id: 'item1', name: 'Item 1' }, {
      category: LISTING_CATEGORY.WEAPONS
    }).state;
    state = createListing(state, 'seller2', { id: 'item2', name: 'Item 2' }, {
      category: LISTING_CATEGORY.ARMOR
    }).state;

    const stats = getAuctionHouseStats(state);

    assert.strictEqual(stats.activeListings, 2);
    assert.strictEqual(stats.categoryBreakdown[LISTING_CATEGORY.WEAPONS], 1);
    assert.strictEqual(stats.categoryBreakdown[LISTING_CATEGORY.ARMOR], 1);
  });
});

describe('getPriceHistory', () => {
  it('should return empty array for no sales', () => {
    const state = createAuctionHouseState();
    const history = getPriceHistory(state, 'item1');

    assert.deepStrictEqual(history, []);
  });

  it('should return sale history', () => {
    let state = createAuctionHouseState();
    const createResult = createListing(state, 'seller1', { id: 'sword', name: 'Sword' }, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = createResult.state;

    state = executeBuyout(state, createResult.listing.id, 'buyer1').state;

    const history = getPriceHistory(state, 'sword');

    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].price, 500);
  });
});

describe('getAveragePrice', () => {
  it('should return null for no sales', () => {
    const state = createAuctionHouseState();
    const avg = getAveragePrice(state, 'item1');

    assert.strictEqual(avg, null);
  });

  it('should calculate average', () => {
    let state = createAuctionHouseState();

    // Create and sell two items
    let result1 = createListing(state, 'seller1', { id: 'sword', name: 'Sword' }, {
      startingPrice: 100, buyoutPrice: 300
    });
    state = result1.state;
    state = executeBuyout(state, result1.listing.id, 'buyer1').state;

    let result2 = createListing(state, 'seller2', { id: 'sword', name: 'Sword' }, {
      startingPrice: 100, buyoutPrice: 500
    });
    state = result2.state;
    state = executeBuyout(state, result2.listing.id, 'buyer2').state;

    const avg = getAveragePrice(state, 'sword');

    assert.strictEqual(avg, 400); // (300 + 500) / 2
  });
});

// ==================== UI Tests ====================

describe('formatTimeRemaining', () => {
  it('should return Expired for 0 or negative', () => {
    assert.strictEqual(formatTimeRemaining(0), 'Expired');
    assert.strictEqual(formatTimeRemaining(-1000), 'Expired');
  });

  it('should format hours and minutes', () => {
    const result = formatTimeRemaining(2 * 60 * 60 * 1000 + 30 * 60 * 1000);
    assert.ok(result.includes('2h'));
    assert.ok(result.includes('30m'));
  });

  it('should format minutes only when less than 1 hour', () => {
    const result = formatTimeRemaining(45 * 60 * 1000);
    assert.strictEqual(result, '45m');
  });
});

describe('formatGold', () => {
  it('should format millions', () => {
    assert.ok(formatGold(1500000).includes('M'));
  });

  it('should format thousands', () => {
    assert.ok(formatGold(5000).includes('K'));
  });

  it('should return raw number for small amounts', () => {
    assert.strictEqual(formatGold(500), '500');
  });
});

describe('renderAuctionHousePanel', () => {
  it('should render auction house panel', () => {
    const state = createAuctionHouseState();
    const html = renderAuctionHousePanel(state, 'player1');

    assert.ok(html.includes('auction-house-panel'));
    assert.ok(html.includes('Auction House'));
  });
});

describe('renderBrowseTab', () => {
  it('should render browse tab', () => {
    const state = createAuctionHouseState();
    const html = renderBrowseTab(state);

    assert.ok(html.includes('browse-tab'));
  });

  it('should show no results message when empty', () => {
    const state = createAuctionHouseState();
    const html = renderBrowseTab(state);

    assert.ok(html.includes('No listings'));
  });
});

describe('renderCategoryBar', () => {
  it('should render all categories', () => {
    const html = renderCategoryBar();

    Object.values(LISTING_CATEGORY).forEach(cat => {
      assert.ok(html.includes(cat));
    });
  });

  it('should mark active category', () => {
    const html = renderCategoryBar(LISTING_CATEGORY.WEAPONS);

    assert.ok(html.includes('active'));
  });
});

describe('renderListingCard', () => {
  it('should render listing card', () => {
    let state = createAuctionHouseState();
    const result = createListing(state, 'seller1', { id: 'sword', name: 'Iron Sword' }, {
      startingPrice: 100,
      buyoutPrice: 500
    });

    const html = renderListingCard(result.listing);

    assert.ok(html.includes('listing-card'));
    assert.ok(html.includes('Iron Sword'));
    assert.ok(html.includes('Buyout'));
  });
});

describe('renderListingDetail', () => {
  it('should show error for non-existent listing', () => {
    const state = createAuctionHouseState();
    const html = renderListingDetail(state, 'fake_id', 'player1');

    assert.ok(html.includes('error'));
  });

  it('should render listing detail', () => {
    let state = createAuctionHouseState();
    const result = createListing(state, 'seller1', { id: 'sword', name: 'Iron Sword' }, {
      startingPrice: 100,
      buyoutPrice: 500
    });
    state = result.state;

    const html = renderListingDetail(state, result.listing.id, 'player2');

    assert.ok(html.includes('listing-detail'));
    assert.ok(html.includes('Iron Sword'));
    assert.ok(html.includes('Place Bid'));
  });

  it('should show cancel button for owner', () => {
    let state = createAuctionHouseState();
    const result = createListing(state, 'seller1', { id: 'sword', name: 'Iron Sword' });
    state = result.state;

    const html = renderListingDetail(state, result.listing.id, 'seller1');

    assert.ok(html.includes('Cancel Listing'));
  });
});

describe('renderSellForm', () => {
  it('should render sell form', () => {
    const html = renderSellForm();

    assert.ok(html.includes('sell-form'));
    assert.ok(html.includes('Create Listing'));
  });

  it('should show item when provided', () => {
    const html = renderSellForm({ id: 'sword', name: 'Magic Sword' });

    assert.ok(html.includes('Magic Sword'));
  });
});

describe('renderMyListingsTab', () => {
  it('should show empty message', () => {
    const state = createAuctionHouseState();
    const html = renderMyListingsTab(state, 'player1');

    assert.ok(html.includes('no active listings'));
  });

  it('should render listings', () => {
    let state = createAuctionHouseState();
    state = createListing(state, 'player1', { id: 'sword', name: 'Sword' }).state;

    const html = renderMyListingsTab(state, 'player1');

    assert.ok(html.includes('Sword'));
  });
});

describe('renderMyBidsTab', () => {
  it('should show empty message', () => {
    const state = createAuctionHouseState();
    const html = renderMyBidsTab(state, 'player1');

    assert.ok(html.includes('no active bids'));
  });
});

describe('renderConfirmationDialog', () => {
  it('should render bid confirmation', () => {
    const html = renderConfirmationDialog('bid', { amount: 150, itemName: 'Sword' });

    assert.ok(html.includes('confirmation-dialog'));
    assert.ok(html.includes('Place Bid'));
  });

  it('should render buyout confirmation', () => {
    const html = renderConfirmationDialog('buyout', { price: 500, itemName: 'Shield' });

    assert.ok(html.includes('Buy Now'));
  });
});

describe('renderOutbidNotification', () => {
  it('should render outbid notification', () => {
    const html = renderOutbidNotification('Iron Sword', 200, 150);

    assert.ok(html.includes('outbid-notification'));
    assert.ok(html.includes('Outbid'));
    assert.ok(html.includes('Iron Sword'));
  });
});

describe('renderSaleNotification', () => {
  it('should render sale notification', () => {
    const html = renderSaleNotification('Magic Staff', 1000, 50, 950);

    assert.ok(html.includes('sale-notification'));
    assert.ok(html.includes('Item Sold'));
    assert.ok(html.includes('Magic Staff'));
  });
});

describe('UI Constants', () => {
  it('should have category icons', () => {
    Object.values(LISTING_CATEGORY).forEach(cat => {
      assert.ok(CATEGORY_ICONS[cat]);
    });
  });

  it('should have status colors', () => {
    Object.values(LISTING_STATUS).forEach(status => {
      assert.ok(STATUS_COLORS[status]);
    });
  });
});
