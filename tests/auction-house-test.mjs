/**
 * Auction House System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  LISTING_DURATIONS,
  LISTING_STATUS,
  ITEM_CATEGORIES,
  SORT_OPTIONS,
  RARITY_FILTERS,
  initAuctionState,
  createListing,
  placeBid,
  buyoutListing,
  cancelListing,
  processExpiredListings,
  searchListings,
  getPlayerListings,
  getPlayerBids,
  addFavorite,
  removeFavorite,
  getPlayerFavorites,
  getListingDetails,
  getAuctionStats,
  getPriceHistory
} from '../src/auction-house.js';

import {
  renderAuctionHouse,
  renderSearchPanel,
  renderCategoryFilter,
  renderRarityFilter,
  renderPriceFilter,
  renderSortOptions,
  renderListingRow,
  renderListingDetail,
  renderSellForm,
  renderMyListings,
  renderMyListingRow,
  renderMyBids,
  renderBidRow,
  renderFavorites,
  renderAuctionStatsPanel,
  renderAuctionNotification
} from '../src/auction-house-ui.js';

describe('Auction House System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initAuctionState(state);
    state = result.state;
  });

  describe('LISTING_DURATIONS', () => {
    it('has all durations', () => {
      assert.ok(LISTING_DURATIONS.SHORT);
      assert.ok(LISTING_DURATIONS.MEDIUM);
      assert.ok(LISTING_DURATIONS.LONG);
      assert.ok(LISTING_DURATIONS.EXTENDED);
    });

    it('durations have hours and fees', () => {
      Object.values(LISTING_DURATIONS).forEach(d => {
        assert.ok(typeof d.hours === 'number');
        assert.ok(typeof d.fee === 'number');
        assert.ok(d.fee >= 0 && d.fee <= 1);
      });
    });
  });

  describe('LISTING_STATUS', () => {
    it('has all statuses', () => {
      assert.ok(LISTING_STATUS.ACTIVE);
      assert.ok(LISTING_STATUS.SOLD);
      assert.ok(LISTING_STATUS.EXPIRED);
      assert.ok(LISTING_STATUS.CANCELLED);
    });
  });

  describe('ITEM_CATEGORIES', () => {
    it('has categories', () => {
      assert.ok(Object.keys(ITEM_CATEGORIES).length >= 5);
    });

    it('categories have id and name', () => {
      Object.values(ITEM_CATEGORIES).forEach(cat => {
        assert.ok(cat.id);
        assert.ok(cat.name);
      });
    });
  });

  describe('SORT_OPTIONS', () => {
    it('has sort options', () => {
      assert.ok(Object.keys(SORT_OPTIONS).length >= 4);
    });
  });

  describe('RARITY_FILTERS', () => {
    it('has rarity levels', () => {
      assert.ok(RARITY_FILTERS.COMMON);
      assert.ok(RARITY_FILTERS.RARE);
      assert.ok(RARITY_FILTERS.LEGENDARY);
    });
  });

  describe('initAuctionState', () => {
    it('creates initial state', () => {
      const result = initAuctionState({});
      assert.ok(result.success);
      assert.ok(result.state.auctionHouse);
      assert.deepStrictEqual(result.state.auctionHouse.listings, {});
    });
  });

  describe('createListing', () => {
    it('creates a listing', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'player1', item, {
        startingBid: 100,
        buyoutPrice: 500
      });
      
      assert.ok(result.success);
      assert.ok(result.listingId);
      assert.strictEqual(result.listing.startingBid, 100);
      assert.strictEqual(result.listing.buyoutPrice, 500);
    });

    it('fails without seller', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, null, item);
      assert.ok(!result.success);
    });

    it('fails without item', () => {
      const result = createListing(state, 'player1', null);
      assert.ok(!result.success);
    });

    it('fails with invalid item', () => {
      const result = createListing(state, 'player1', {});
      assert.ok(!result.success);
    });

    it('fails with invalid starting bid', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'player1', item, { startingBid: 0 });
      assert.ok(!result.success);
    });

    it('fails if buyout less than starting bid', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'player1', item, {
        startingBid: 100,
        buyoutPrice: 50
      });
      assert.ok(!result.success);
    });

    it('increments total listings stat', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'player1', item);
      assert.strictEqual(result.state.auctionHouse.stats.totalListings, 1);
    });

    it('adds to player listings', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'player1', item);
      assert.strictEqual(result.state.auctionHouse.playerListings['player1'].length, 1);
    });
  });

  describe('placeBid', () => {
    let listingId;

    beforeEach(() => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'seller1', item, {
        startingBid: 100,
        buyoutPrice: 500
      });
      state = result.state;
      listingId = result.listingId;
    });

    it('places a bid', () => {
      const result = placeBid(state, 'bidder1', listingId, 100);
      assert.ok(result.success);
      assert.strictEqual(result.bidAmount, 100);
    });

    it('fails on non-existent listing', () => {
      const result = placeBid(state, 'bidder1', 'fake_id', 100);
      assert.ok(!result.success);
    });

    it('fails if bidding on own listing', () => {
      const result = placeBid(state, 'seller1', listingId, 100);
      assert.ok(!result.success);
    });

    it('fails if bid too low', () => {
      const result = placeBid(state, 'bidder1', listingId, 50);
      assert.ok(!result.success);
    });

    it('requires 5% increment on existing bids', () => {
      let result = placeBid(state, 'bidder1', listingId, 100);
      state = result.state;
      
      // 5% of 100 = 5, so min next bid is 105
      result = placeBid(state, 'bidder2', listingId, 103);
      assert.ok(!result.success);
      
      result = placeBid(state, 'bidder2', listingId, 105);
      assert.ok(result.success);
    });

    it('marks outbid status', () => {
      let result = placeBid(state, 'bidder1', listingId, 100);
      state = result.state;
      
      result = placeBid(state, 'bidder2', listingId, 150);
      assert.ok(result.success);
      assert.ok(result.outbid);
      assert.strictEqual(result.previousBidderId, 'bidder1');
    });

    it('updates bid count', () => {
      let result = placeBid(state, 'bidder1', listingId, 100);
      state = result.state;
      
      result = placeBid(state, 'bidder2', listingId, 150);
      state = result.state;
      
      const listing = state.auctionHouse.listings[listingId];
      assert.strictEqual(listing.bidCount, 2);
    });

    it('adds to player bids', () => {
      const result = placeBid(state, 'bidder1', listingId, 100);
      assert.ok(result.state.auctionHouse.playerBids['bidder1'].includes(listingId));
    });
  });

  describe('buyoutListing', () => {
    let listingId;

    beforeEach(() => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'seller1', item, {
        startingBid: 100,
        buyoutPrice: 500
      });
      state = result.state;
      listingId = result.listingId;
    });

    it('buys out a listing', () => {
      const result = buyoutListing(state, 'buyer1', listingId);
      assert.ok(result.success);
      assert.strictEqual(result.price, 500);
    });

    it('calculates fee and proceeds', () => {
      const result = buyoutListing(state, 'buyer1', listingId);
      assert.ok(result.fee > 0);
      assert.strictEqual(result.proceeds, result.price - result.fee);
    });

    it('marks listing as sold', () => {
      const result = buyoutListing(state, 'buyer1', listingId);
      const listing = result.state.auctionHouse.listings[listingId];
      assert.strictEqual(listing.status, LISTING_STATUS.SOLD);
    });

    it('fails on non-existent listing', () => {
      const result = buyoutListing(state, 'buyer1', 'fake_id');
      assert.ok(!result.success);
    });

    it('fails if buying own listing', () => {
      const result = buyoutListing(state, 'seller1', listingId);
      assert.ok(!result.success);
    });

    it('fails if no buyout price', () => {
      const item = { id: 'sword2', name: 'Steel Sword' };
      let result = createListing(state, 'seller1', item, { startingBid: 100 });
      state = result.state;
      const noBuyoutId = result.listingId;
      
      result = buyoutListing(state, 'buyer1', noBuyoutId);
      assert.ok(!result.success);
    });

    it('updates stats', () => {
      const result = buyoutListing(state, 'buyer1', listingId);
      assert.strictEqual(result.state.auctionHouse.stats.totalSales, 1);
      assert.strictEqual(result.state.auctionHouse.stats.totalVolume, 500);
    });

    it('adds to history', () => {
      const result = buyoutListing(state, 'buyer1', listingId);
      assert.strictEqual(result.state.auctionHouse.history.length, 1);
    });
  });

  describe('cancelListing', () => {
    let listingId;

    beforeEach(() => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'seller1', item, {
        startingBid: 100
      });
      state = result.state;
      listingId = result.listingId;
    });

    it('cancels a listing', () => {
      const result = cancelListing(state, 'seller1', listingId);
      assert.ok(result.success);
    });

    it('marks as cancelled', () => {
      const result = cancelListing(state, 'seller1', listingId);
      const listing = result.state.auctionHouse.listings[listingId];
      assert.strictEqual(listing.status, LISTING_STATUS.CANCELLED);
    });

    it('fails if not owner', () => {
      const result = cancelListing(state, 'other_player', listingId);
      assert.ok(!result.success);
    });

    it('fails if has bids', () => {
      let result = placeBid(state, 'bidder1', listingId, 100);
      state = result.state;
      
      result = cancelListing(state, 'seller1', listingId);
      assert.ok(!result.success);
    });

    it('fails on non-existent listing', () => {
      const result = cancelListing(state, 'seller1', 'fake_id');
      assert.ok(!result.success);
    });
  });

  describe('processExpiredListings', () => {
    it('expires listings with no bids', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      let result = createListing(state, 'seller1', item, {
        startingBid: 100,
        duration: 'short'
      });
      state = result.state;
      const listingId = result.listingId;
      
      // Force expiration
      state.auctionHouse.listings[listingId].expiresAt = Date.now() - 1000;
      
      result = processExpiredListings(state);
      assert.ok(result.success);
      assert.strictEqual(result.results[0].result, 'expired');
    });

    it('sells to highest bidder on expiration', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      let result = createListing(state, 'seller1', item, {
        startingBid: 100,
        duration: 'short'
      });
      state = result.state;
      const listingId = result.listingId;
      
      result = placeBid(state, 'bidder1', listingId, 150);
      state = result.state;
      
      // Force expiration
      state.auctionHouse.listings[listingId].expiresAt = Date.now() - 1000;
      
      result = processExpiredListings(state);
      assert.ok(result.success);
      assert.strictEqual(result.results[0].result, 'sold');
      assert.strictEqual(result.results[0].buyerId, 'bidder1');
    });
  });

  describe('searchListings', () => {
    beforeEach(() => {
      const items = [
        { id: 'sword1', name: 'Iron Sword', rarity: 'common', level: 5 },
        { id: 'sword2', name: 'Steel Sword', rarity: 'uncommon', level: 10 },
        { id: 'armor1', name: 'Iron Armor', rarity: 'common', level: 5 }
      ];
      
      items.forEach((item, i) => {
        const result = createListing(state, `seller${i}`, item, {
          startingBid: (i + 1) * 100,
          category: item.name.includes('Sword') ? 'weapons' : 'armor'
        });
        state = result.state;
      });
    });

    it('returns all active listings', () => {
      const results = searchListings(state);
      assert.strictEqual(results.total, 3);
    });

    it('filters by name', () => {
      const results = searchListings(state, { name: 'sword' });
      assert.strictEqual(results.total, 2);
    });

    it('filters by category', () => {
      const results = searchListings(state, { category: 'weapons' });
      assert.strictEqual(results.total, 2);
    });

    it('filters by rarity', () => {
      const results = searchListings(state, { rarity: 'common' });
      assert.strictEqual(results.total, 2);
    });

    it('filters by price range', () => {
      const results = searchListings(state, { minPrice: 150, maxPrice: 250 });
      assert.strictEqual(results.total, 1);
    });

    it('sorts by price low', () => {
      const results = searchListings(state, { sort: 'price_low' });
      assert.ok(results.results[0].startingBid <= results.results[1].startingBid);
    });

    it('sorts by price high', () => {
      const results = searchListings(state, { sort: 'price_high' });
      assert.ok(results.results[0].startingBid >= results.results[1].startingBid);
    });

    it('paginates results', () => {
      const results = searchListings(state, { page: 1, perPage: 2 });
      assert.strictEqual(results.results.length, 2);
      assert.strictEqual(results.totalPages, 2);
    });
  });

  describe('getPlayerListings', () => {
    it('returns player listings by status', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'player1', item);
      state = result.state;
      
      const listings = getPlayerListings(state, 'player1');
      assert.strictEqual(listings.active.length, 1);
      assert.strictEqual(listings.sold.length, 0);
    });
  });

  describe('getPlayerBids', () => {
    it('returns player bid status', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      let result = createListing(state, 'seller1', item, { startingBid: 100 });
      state = result.state;
      const listingId = result.listingId;
      
      result = placeBid(state, 'bidder1', listingId, 100);
      state = result.state;
      
      const bids = getPlayerBids(state, 'bidder1');
      assert.strictEqual(bids.winning.length, 1);
      assert.strictEqual(bids.outbid.length, 0);
    });
  });

  describe('favorites', () => {
    let listingId;

    beforeEach(() => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      const result = createListing(state, 'seller1', item);
      state = result.state;
      listingId = result.listingId;
    });

    it('adds to favorites', () => {
      const result = addFavorite(state, 'player1', listingId);
      assert.ok(result.success);
    });

    it('fails if already favorited', () => {
      let result = addFavorite(state, 'player1', listingId);
      state = result.state;
      
      result = addFavorite(state, 'player1', listingId);
      assert.ok(!result.success);
    });

    it('removes from favorites', () => {
      let result = addFavorite(state, 'player1', listingId);
      state = result.state;
      
      result = removeFavorite(state, 'player1', listingId);
      assert.ok(result.success);
    });

    it('fails to remove if not favorited', () => {
      const result = removeFavorite(state, 'player1', listingId);
      assert.ok(!result.success);
    });

    it('gets player favorites', () => {
      let result = addFavorite(state, 'player1', listingId);
      state = result.state;
      
      const favorites = getPlayerFavorites(state, 'player1');
      assert.strictEqual(favorites.count, 1);
    });
  });

  describe('getListingDetails', () => {
    it('returns listing details', () => {
      const item = { id: 'sword1', name: 'Iron Sword' };
      let result = createListing(state, 'seller1', item, { startingBid: 100 });
      state = result.state;
      
      const details = getListingDetails(state, result.listingId);
      assert.ok(details.found);
      assert.strictEqual(details.minNextBid, 100);
    });

    it('returns not found for invalid id', () => {
      const details = getListingDetails(state, 'fake_id');
      assert.ok(!details.found);
    });
  });

  describe('getAuctionStats', () => {
    it('returns auction statistics', () => {
      const stats = getAuctionStats(state);
      assert.strictEqual(stats.activeListings, 0);
      assert.strictEqual(stats.totalSales, 0);
    });
  });

  describe('getPriceHistory', () => {
    it('returns empty history for new items', () => {
      const history = getPriceHistory(state, 'unknown_item');
      assert.strictEqual(history.sales.length, 0);
      assert.strictEqual(history.averagePrice, 0);
    });
  });
});

describe('Auction House UI', () => {
  let state;

  beforeEach(() => {
    const result = initAuctionState({});
    state = result.state;
  });

  describe('renderAuctionHouse', () => {
    it('renders main panel', () => {
      const html = renderAuctionHouse(state, 'player1');
      assert.ok(html.includes('auction-house'));
      assert.ok(html.includes('Auction House'));
    });

    it('shows stats', () => {
      const html = renderAuctionHouse(state, 'player1');
      assert.ok(html.includes('auction-stats'));
    });

    it('has navigation tabs', () => {
      const html = renderAuctionHouse(state, 'player1');
      assert.ok(html.includes('Browse'));
      assert.ok(html.includes('Sell'));
      assert.ok(html.includes('My Listings'));
    });
  });

  describe('renderSearchPanel', () => {
    it('renders search panel', () => {
      const html = renderSearchPanel(state);
      assert.ok(html.includes('search-panel'));
      assert.ok(html.includes('Search'));
    });

    it('shows no results message', () => {
      const html = renderSearchPanel(state);
      assert.ok(html.includes('No listings found'));
    });
  });

  describe('renderCategoryFilter', () => {
    it('renders category dropdown', () => {
      const html = renderCategoryFilter();
      assert.ok(html.includes('category-filter'));
      assert.ok(html.includes('All Categories'));
    });

    it('marks selected category', () => {
      const html = renderCategoryFilter('weapons');
      assert.ok(html.includes('selected'));
    });
  });

  describe('renderRarityFilter', () => {
    it('renders rarity dropdown', () => {
      const html = renderRarityFilter();
      assert.ok(html.includes('rarity-filter'));
      assert.ok(html.includes('All Rarities'));
    });
  });

  describe('renderPriceFilter', () => {
    it('renders price inputs', () => {
      const html = renderPriceFilter();
      assert.ok(html.includes('price-filter'));
      assert.ok(html.includes('Min'));
      assert.ok(html.includes('Max'));
    });

    it('shows existing values', () => {
      const html = renderPriceFilter(100, 500);
      assert.ok(html.includes('value="100"'));
      assert.ok(html.includes('value="500"'));
    });
  });

  describe('renderSortOptions', () => {
    it('renders sort dropdown', () => {
      const html = renderSortOptions();
      assert.ok(html.includes('sort-options'));
    });
  });

  describe('renderListingRow', () => {
    it('renders listing row', () => {
      const listing = {
        id: 'listing1',
        item: { name: 'Iron Sword', level: 5 },
        startingBid: 100,
        currentBid: 0,
        buyoutPrice: 500,
        bidCount: 0,
        expiresAt: Date.now() + 3600000
      };
      
      const html = renderListingRow(listing);
      assert.ok(html.includes('listing-row'));
      assert.ok(html.includes('Iron Sword'));
    });

    it('shows buyout button when available', () => {
      const listing = {
        id: 'listing1',
        item: { name: 'Iron Sword' },
        startingBid: 100,
        currentBid: 0,
        buyoutPrice: 500,
        bidCount: 0,
        expiresAt: Date.now() + 3600000
      };
      
      const html = renderListingRow(listing);
      assert.ok(html.includes('buyout-btn'));
    });
  });

  describe('renderListingDetail', () => {
    it('returns not found for invalid listing', () => {
      const html = renderListingDetail(state, 'fake_id');
      assert.ok(html.includes('not found'));
    });

    it('renders listing details', () => {
      const item = { id: 'sword1', name: 'Iron Sword', description: 'A basic sword' };
      let result = createListing(state, 'seller1', item, {
        startingBid: 100,
        buyoutPrice: 500
      });
      state = result.state;
      
      const html = renderListingDetail(state, result.listingId);
      assert.ok(html.includes('listing-detail'));
      assert.ok(html.includes('Iron Sword'));
    });
  });

  describe('renderSellForm', () => {
    it('renders sell form', () => {
      const html = renderSellForm();
      assert.ok(html.includes('sell-form'));
      assert.ok(html.includes('Create Listing'));
    });

    it('shows duration options', () => {
      const html = renderSellForm();
      assert.ok(html.includes('duration-select'));
    });
  });

  describe('renderMyListings', () => {
    it('renders my listings panel', () => {
      const html = renderMyListings(state, 'player1');
      assert.ok(html.includes('my-listings'));
    });

    it('shows no listings message', () => {
      const html = renderMyListings(state, 'player1');
      assert.ok(html.includes('No active listings'));
    });
  });

  describe('renderMyListingRow', () => {
    it('renders listing row', () => {
      const listing = {
        id: 'listing1',
        item: { name: 'Iron Sword' },
        currentBid: 100,
        bidCount: 2,
        expiresAt: Date.now() + 3600000,
        status: LISTING_STATUS.ACTIVE
      };
      
      const html = renderMyListingRow(listing);
      assert.ok(html.includes('my-listing-row'));
      assert.ok(html.includes('Iron Sword'));
    });

    it('shows cancel button when no bids', () => {
      const listing = {
        id: 'listing1',
        item: { name: 'Iron Sword' },
        currentBid: 0,
        bidCount: 0,
        expiresAt: Date.now() + 3600000,
        status: LISTING_STATUS.ACTIVE
      };
      
      const html = renderMyListingRow(listing);
      assert.ok(html.includes('cancel-btn'));
    });
  });

  describe('renderMyBids', () => {
    it('renders my bids panel', () => {
      const html = renderMyBids(state, 'player1');
      assert.ok(html.includes('my-bids'));
    });

    it('shows no bids message', () => {
      const html = renderMyBids(state, 'player1');
      assert.ok(html.includes('No active bids'));
    });
  });

  describe('renderBidRow', () => {
    it('renders winning bid', () => {
      const listing = {
        id: 'listing1',
        item: { name: 'Iron Sword' },
        currentBid: 150,
        expiresAt: Date.now() + 3600000
      };
      
      const html = renderBidRow(listing, 'winning');
      assert.ok(html.includes('status-winning'));
      assert.ok(html.includes('Winning'));
    });

    it('renders outbid status', () => {
      const listing = {
        id: 'listing1',
        item: { name: 'Iron Sword' },
        currentBid: 150,
        expiresAt: Date.now() + 3600000
      };
      
      const html = renderBidRow(listing, 'outbid');
      assert.ok(html.includes('status-outbid'));
      assert.ok(html.includes('Rebid'));
    });
  });

  describe('renderFavorites', () => {
    it('renders favorites panel', () => {
      const html = renderFavorites(state, 'player1');
      assert.ok(html.includes('favorites'));
    });

    it('shows no favorites message', () => {
      const html = renderFavorites(state, 'player1');
      assert.ok(html.includes('No favorites'));
    });
  });

  describe('renderAuctionStatsPanel', () => {
    it('renders stats panel', () => {
      const html = renderAuctionStatsPanel(state);
      assert.ok(html.includes('auction-stats-panel'));
      assert.ok(html.includes('Market Overview'));
    });
  });

  describe('renderAuctionNotification', () => {
    it('renders outbid notification', () => {
      const html = renderAuctionNotification('outbid', {
        itemName: 'Iron Sword',
        currentBid: 150
      });
      assert.ok(html.includes('outbid'));
      assert.ok(html.includes('Iron Sword'));
    });

    it('renders won notification', () => {
      const html = renderAuctionNotification('won', {
        itemName: 'Iron Sword',
        price: 200
      });
      assert.ok(html.includes('won'));
    });

    it('renders sold notification', () => {
      const html = renderAuctionNotification('sold', {
        itemName: 'Iron Sword',
        price: 200
      });
      assert.ok(html.includes('sold'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes item names', () => {
      const listing = {
        id: 'listing1',
        item: { name: '<script>alert("xss")</script>' },
        startingBid: 100,
        currentBid: 0,
        bidCount: 0,
        expiresAt: Date.now() + 3600000
      };
      
      const html = renderListingRow(listing);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes seller IDs', () => {
      const item = { id: 'sword1', name: 'Sword', description: 'test' };
      let result = createListing(state, '<script>bad</script>', item);
      state = result.state;
      
      const html = renderListingDetail(state, result.listingId);
      assert.ok(!html.includes('<script>bad</script>'));
    });
  });
});
