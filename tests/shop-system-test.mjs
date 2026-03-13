/**
 * Shop System Tests
 * 80 tests covering shop types, cart, sell, buyback, discounts, and stock
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  SHOP_TYPES,
  TRANSACTION_TYPES,
  createShopState,
  createShop,
  createShopRegistry,
  registerShop,
  openShop,
  closeShop,
  getItemPrice,
  getSellPrice,
  addToCart,
  removeFromCart,
  clearCart,
  addToSellList,
  removeFromSellList,
  clearSellList,
  calculateCartTotal,
  calculateSellTotal,
  completePurchase,
  completeSale,
  buybackItem,
  getBuybackItems,
  setDiscount,
  getDiscount,
  restockShop,
  isItemAvailable,
  getShopInventory,
  findShopsWithItem,
  getShopsByType,
  getShopStats,
  getShopTypeInfo
} from '../src/shop-system.js';

// ============================================================================
// SHOP_TYPES Tests (8 tests)
// ============================================================================

describe('SHOP_TYPES', () => {
  it('has GENERAL type', () => {
    assert.strictEqual(SHOP_TYPES.GENERAL.name, 'General Store');
    assert.strictEqual(SHOP_TYPES.GENERAL.icon, '🏪');
  });

  it('has WEAPONS type', () => {
    assert.strictEqual(SHOP_TYPES.WEAPONS.name, 'Weapons Shop');
    assert.strictEqual(SHOP_TYPES.WEAPONS.icon, '⚔️');
  });

  it('has ARMOR type', () => {
    assert.strictEqual(SHOP_TYPES.ARMOR.name, 'Armor Shop');
    assert.strictEqual(SHOP_TYPES.ARMOR.icon, '🛡️');
  });

  it('has POTIONS type', () => {
    assert.strictEqual(SHOP_TYPES.POTIONS.name, 'Potion Shop');
    assert.strictEqual(SHOP_TYPES.POTIONS.icon, '🧪');
  });

  it('has MAGIC type', () => {
    assert.strictEqual(SHOP_TYPES.MAGIC.name, 'Magic Shop');
    assert.strictEqual(SHOP_TYPES.MAGIC.icon, '✨');
  });

  it('has BLACKSMITH type', () => {
    assert.strictEqual(SHOP_TYPES.BLACKSMITH.name, 'Blacksmith');
    assert.strictEqual(SHOP_TYPES.BLACKSMITH.icon, '🔨');
  });

  it('has JEWELER type', () => {
    assert.strictEqual(SHOP_TYPES.JEWELER.name, 'Jeweler');
    assert.strictEqual(SHOP_TYPES.JEWELER.icon, '💎');
  });

  it('has TAVERN type', () => {
    assert.strictEqual(SHOP_TYPES.TAVERN.name, 'Tavern');
    assert.strictEqual(SHOP_TYPES.TAVERN.icon, '🍺');
  });
});

// ============================================================================
// TRANSACTION_TYPES Tests (3 tests)
// ============================================================================

describe('TRANSACTION_TYPES', () => {
  it('has BUY type', () => {
    assert.strictEqual(TRANSACTION_TYPES.BUY, 'buy');
  });

  it('has SELL type', () => {
    assert.strictEqual(TRANSACTION_TYPES.SELL, 'sell');
  });

  it('has BUYBACK type', () => {
    assert.strictEqual(TRANSACTION_TYPES.BUYBACK, 'buyback');
  });
});

// ============================================================================
// createShopState Tests (5 tests)
// ============================================================================

describe('createShopState', () => {
  it('creates empty state', () => {
    const state = createShopState();
    assert.strictEqual(state.activeShop, null);
  });

  it('creates empty cart', () => {
    const state = createShopState();
    assert.deepStrictEqual(state.cart, []);
  });

  it('creates empty sell list', () => {
    const state = createShopState();
    assert.deepStrictEqual(state.sellList, []);
  });

  it('creates empty buyback items', () => {
    const state = createShopState();
    assert.deepStrictEqual(state.buybackItems, {});
  });

  it('initializes stats to zero', () => {
    const state = createShopState();
    assert.strictEqual(state.stats.totalPurchases, 0);
    assert.strictEqual(state.stats.goldSpent, 0);
  });
});

// ============================================================================
// createShop Tests (8 tests)
// ============================================================================

describe('createShop', () => {
  it('creates valid shop', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('shop1', 'Test Shop', 'weapons', inventory);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.shop.name, 'Test Shop');
  });

  it('validates shop id', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('', 'Test Shop', 'weapons', inventory);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid'));
  });

  it('validates shop name', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('shop1', '', 'weapons', inventory);
    assert.strictEqual(result.success, false);
  });

  it('validates shop type', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('shop1', 'Test', 'invalid', inventory);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid shop type'));
  });

  it('validates inventory exists', () => {
    const result = createShop('shop1', 'Test', 'weapons', []);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('inventory'));
  });

  it('sets default sell price multiplier', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('shop1', 'Test', 'weapons', inventory);
    assert.strictEqual(result.shop.sellPriceMultiplier, 0.5);
  });

  it('handles unlimited stock', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('shop1', 'Test', 'weapons', inventory);
    assert.strictEqual(result.shop.inventory[0].stock, -1);
  });

  it('accepts custom options', () => {
    const inventory = [{ itemId: 'sword', price: 100 }];
    const result = createShop('shop1', 'Test', 'weapons', inventory, {
      sellPriceMultiplier: 0.75,
      levelRequirement: 10
    });
    assert.strictEqual(result.shop.sellPriceMultiplier, 0.75);
    assert.strictEqual(result.shop.levelRequirement, 10);
  });
});

// ============================================================================
// createShopRegistry Tests (3 tests)
// ============================================================================

describe('createShopRegistry', () => {
  it('creates empty shops', () => {
    const registry = createShopRegistry();
    assert.deepStrictEqual(registry.shops, {});
  });

  it('creates empty byType index', () => {
    const registry = createShopRegistry();
    assert.deepStrictEqual(registry.byType, {});
  });

  it('creates empty item catalog', () => {
    const registry = createShopRegistry();
    assert.deepStrictEqual(registry.itemCatalog, {});
  });
});

// ============================================================================
// registerShop Tests (5 tests)
// ============================================================================

describe('registerShop', () => {
  it('registers valid shop', () => {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    const result = registerShop(registry, shop);
    assert.strictEqual(result.success, true);
    assert.ok(result.registry.shops['shop1']);
  });

  it('indexes by type', () => {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    const result = registerShop(registry, shop);
    assert.deepStrictEqual(result.registry.byType['WEAPONS'], ['shop1']);
  });

  it('indexes items', () => {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    const result = registerShop(registry, shop);
    assert.deepStrictEqual(result.registry.itemCatalog['sword'], ['shop1']);
  });

  it('prevents duplicate registration', () => {
    let registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    registry = registerShop(registry, shop).registry;
    const result = registerShop(registry, shop);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('already registered'));
  });

  it('validates shop', () => {
    const registry = createShopRegistry();
    const result = registerShop(registry, null);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// openShop Tests (6 tests)
// ============================================================================

describe('openShop', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }], {
      levelRequirement: 5,
      reputationRequired: { faction: 'warriors', amount: 100 }
    }).shop;
    return registerShop(registry, shop).registry;
  }

  it('opens valid shop', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const result = openShop(state, registry, 'shop1', 10, { warriors: 200 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeShop, 'shop1');
  });

  it('validates shop exists', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const result = openShop(state, registry, 'nonexistent', 10);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('not found'));
  });

  it('prevents opening another shop', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = openShop(state, registry, 'shop1', 10, { warriors: 200 }).state;
    const result = openShop(state, registry, 'shop1', 10, { warriors: 200 });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('already open'));
  });

  it('checks level requirement', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const result = openShop(state, registry, 'shop1', 1, { warriors: 200 });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Level'));
  });

  it('checks reputation requirement', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const result = openShop(state, registry, 'shop1', 10, { warriors: 50 });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Reputation'));
  });

  it('clears cart when opening', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const result = openShop(state, registry, 'shop1', 10, { warriors: 200 });
    assert.deepStrictEqual(result.state.cart, []);
  });
});

// ============================================================================
// closeShop Tests (3 tests)
// ============================================================================

describe('closeShop', () => {
  it('closes open shop', () => {
    let state = createShopState();
    state = { ...state, activeShop: 'shop1' };
    const result = closeShop(state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeShop, null);
  });

  it('clears cart on close', () => {
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [{ itemId: 'sword', quantity: 1 }] };
    const result = closeShop(state);
    assert.deepStrictEqual(result.state.cart, []);
  });

  it('fails if no shop open', () => {
    const state = createShopState();
    const result = closeShop(state);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// getItemPrice Tests (5 tests)
// ============================================================================

describe('getItemPrice', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    return registerShop(registry, shop).registry;
  }

  it('returns base price', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const price = getItemPrice(state, registry, 'shop1', 'sword');
    assert.strictEqual(price, 100);
  });

  it('calculates quantity price', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const price = getItemPrice(state, registry, 'shop1', 'sword', 3);
    assert.strictEqual(price, 300);
  });

  it('applies discount', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = setDiscount(state, 'shop1', 10);
    const price = getItemPrice(state, registry, 'shop1', 'sword');
    assert.strictEqual(price, 90);
  });

  it('returns null for missing shop', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const price = getItemPrice(state, registry, 'nonexistent', 'sword');
    assert.strictEqual(price, null);
  });

  it('returns null for missing item', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const price = getItemPrice(state, registry, 'shop1', 'nonexistent');
    assert.strictEqual(price, null);
  });
});

// ============================================================================
// getSellPrice Tests (3 tests)
// ============================================================================

describe('getSellPrice', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    return registerShop(registry, shop).registry;
  }

  it('calculates sell price', () => {
    const registry = setupRegistry();
    const price = getSellPrice(registry, 'shop1', 'sword', 1, 100);
    assert.strictEqual(price, 50); // 50% multiplier
  });

  it('calculates quantity sell price', () => {
    const registry = setupRegistry();
    const price = getSellPrice(registry, 'shop1', 'sword', 5, 100);
    assert.strictEqual(price, 250);
  });

  it('returns null for missing shop', () => {
    const registry = setupRegistry();
    const price = getSellPrice(registry, 'nonexistent', 'sword', 1, 100);
    assert.strictEqual(price, null);
  });
});

// ============================================================================
// addToCart Tests (6 tests)
// ============================================================================

describe('addToCart', () => {
  function setupState() {
    let registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [
      { itemId: 'sword', price: 100, stock: 5 }
    ]).shop;
    registry = registerShop(registry, shop).registry;
    let state = createShopState();
    state = openShop(state, registry, 'shop1').state;
    return { state, registry };
  }

  it('adds item to empty cart', () => {
    const { state, registry } = setupState();
    const result = addToCart(state, registry, 'sword', 1);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.cart.length, 1);
    assert.strictEqual(result.state.cart[0].quantity, 1);
  });

  it('increases quantity for existing item', () => {
    let { state, registry } = setupState();
    state = addToCart(state, registry, 'sword', 1).state;
    const result = addToCart(state, registry, 'sword', 2);
    assert.strictEqual(result.state.cart.length, 1);
    assert.strictEqual(result.state.cart[0].quantity, 3);
  });

  it('validates shop is open', () => {
    const { registry } = setupState();
    const state = createShopState();
    const result = addToCart(state, registry, 'sword', 1);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('No shop'));
  });

  it('validates item exists', () => {
    const { state, registry } = setupState();
    const result = addToCart(state, registry, 'nonexistent', 1);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('not available'));
  });

  it('checks stock limit', () => {
    const { state, registry } = setupState();
    const result = addToCart(state, registry, 'sword', 10);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('stock'));
  });

  it('accumulates quantity against stock', () => {
    let { state, registry } = setupState();
    state = addToCart(state, registry, 'sword', 3).state;
    const result = addToCart(state, registry, 'sword', 3);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// removeFromCart Tests (4 tests)
// ============================================================================

describe('removeFromCart', () => {
  it('removes partial quantity', () => {
    let state = createShopState();
    state = { ...state, cart: [{ itemId: 'sword', quantity: 5 }] };
    const result = removeFromCart(state, 'sword', 2);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.cart[0].quantity, 3);
  });

  it('removes entire item when quantity exceeds', () => {
    let state = createShopState();
    state = { ...state, cart: [{ itemId: 'sword', quantity: 2 }] };
    const result = removeFromCart(state, 'sword', 5);
    assert.strictEqual(result.state.cart.length, 0);
  });

  it('fails for non-existent item', () => {
    const state = createShopState();
    const result = removeFromCart(state, 'sword', 1);
    assert.strictEqual(result.success, false);
  });

  it('removes exact quantity', () => {
    let state = createShopState();
    state = { ...state, cart: [{ itemId: 'sword', quantity: 3 }] };
    const result = removeFromCart(state, 'sword', 3);
    assert.strictEqual(result.state.cart.length, 0);
  });
});

// ============================================================================
// clearCart Tests (2 tests)
// ============================================================================

describe('clearCart', () => {
  it('clears all items', () => {
    let state = createShopState();
    state = { ...state, cart: [{ itemId: 'sword', quantity: 5 }] };
    const result = clearCart(state);
    assert.deepStrictEqual(result.cart, []);
  });

  it('works on empty cart', () => {
    const state = createShopState();
    const result = clearCart(state);
    assert.deepStrictEqual(result.cart, []);
  });
});

// ============================================================================
// addToSellList Tests (4 tests)
// ============================================================================

describe('addToSellList', () => {
  it('adds item to sell list', () => {
    let state = createShopState();
    state = { ...state, activeShop: 'shop1' };
    const result = addToSellList(state, 'sword', 1);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.sellList.length, 1);
  });

  it('increases quantity for existing item', () => {
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', sellList: [{ itemId: 'sword', quantity: 2 }] };
    const result = addToSellList(state, 'sword', 3);
    assert.strictEqual(result.state.sellList[0].quantity, 5);
  });

  it('validates shop is open', () => {
    const state = createShopState();
    const result = addToSellList(state, 'sword', 1);
    assert.strictEqual(result.success, false);
  });

  it('adds different items', () => {
    let state = createShopState();
    state = { ...state, activeShop: 'shop1' };
    state = addToSellList(state, 'sword', 1).state;
    const result = addToSellList(state, 'shield', 2);
    assert.strictEqual(result.state.sellList.length, 2);
  });
});

// ============================================================================
// removeFromSellList Tests (3 tests)
// ============================================================================

describe('removeFromSellList', () => {
  it('removes partial quantity', () => {
    let state = createShopState();
    state = { ...state, sellList: [{ itemId: 'sword', quantity: 5 }] };
    const result = removeFromSellList(state, 'sword', 2);
    assert.strictEqual(result.state.sellList[0].quantity, 3);
  });

  it('removes entire item', () => {
    let state = createShopState();
    state = { ...state, sellList: [{ itemId: 'sword', quantity: 2 }] };
    const result = removeFromSellList(state, 'sword', 5);
    assert.strictEqual(result.state.sellList.length, 0);
  });

  it('fails for non-existent item', () => {
    const state = createShopState();
    const result = removeFromSellList(state, 'sword', 1);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// calculateCartTotal Tests (3 tests)
// ============================================================================

describe('calculateCartTotal', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [
      { itemId: 'sword', price: 100 },
      { itemId: 'shield', price: 50 }
    ]).shop;
    return registerShop(registry, shop).registry;
  }

  it('calculates total for single item', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [{ itemId: 'sword', quantity: 2 }] };
    const total = calculateCartTotal(state, registry);
    assert.strictEqual(total, 200);
  });

  it('calculates total for multiple items', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [
      { itemId: 'sword', quantity: 1 },
      { itemId: 'shield', quantity: 2 }
    ]};
    const total = calculateCartTotal(state, registry);
    assert.strictEqual(total, 200); // 100 + 100
  });

  it('returns zero with no shop', () => {
    const registry = setupRegistry();
    const state = createShopState();
    const total = calculateCartTotal(state, registry);
    assert.strictEqual(total, 0);
  });
});

// ============================================================================
// completePurchase Tests (5 tests)
// ============================================================================

describe('completePurchase', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [
      { itemId: 'sword', price: 100, stock: 5 }
    ]).shop;
    return registerShop(registry, shop).registry;
  }

  it('completes valid purchase', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [{ itemId: 'sword', quantity: 2 }] };
    const result = completePurchase(state, registry, 500);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.goldSpent, 200);
  });

  it('updates stats', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [{ itemId: 'sword', quantity: 2 }] };
    const result = completePurchase(state, registry, 500);
    assert.strictEqual(result.state.stats.totalPurchases, 1);
    assert.strictEqual(result.state.stats.goldSpent, 200);
    assert.strictEqual(result.state.stats.itemsBought, 2);
  });

  it('reduces stock', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [{ itemId: 'sword', quantity: 2 }] };
    const result = completePurchase(state, registry, 500);
    assert.strictEqual(result.updatedShop.inventory[0].stock, 3);
  });

  it('fails with insufficient gold', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', cart: [{ itemId: 'sword', quantity: 2 }] };
    const result = completePurchase(state, registry, 100);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('gold'));
  });

  it('fails with empty cart', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1' };
    const result = completePurchase(state, registry, 500);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('empty'));
  });
});

// ============================================================================
// completeSale Tests (4 tests)
// ============================================================================

describe('completeSale', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    return registerShop(registry, shop).registry;
  }

  it('completes valid sale', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', sellList: [{ itemId: 'sword', quantity: 2 }] };
    const result = completeSale(state, registry, { sword: 100 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.goldEarned, 100); // 50% of 100 * 2
  });

  it('updates stats', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', sellList: [{ itemId: 'sword', quantity: 2 }] };
    const result = completeSale(state, registry, { sword: 100 });
    assert.strictEqual(result.state.stats.totalSales, 1);
    assert.strictEqual(result.state.stats.itemsSold, 2);
  });

  it('adds to buyback', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', sellList: [{ itemId: 'sword', quantity: 1 }] };
    const result = completeSale(state, registry, { sword: 100 });
    assert.strictEqual(result.state.buybackItems['shop1'].length, 1);
  });

  it('fails with empty sell list', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1' };
    const result = completeSale(state, registry, {});
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// buybackItem Tests (4 tests)
// ============================================================================

describe('buybackItem', () => {
  function setupRegistry() {
    const registry = createShopRegistry();
    const shop = createShop('shop1', 'Test', 'weapons', [{ itemId: 'sword', price: 100 }]).shop;
    return registerShop(registry, shop).registry;
  }

  it('buys back item', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = {
      ...state,
      activeShop: 'shop1',
      buybackItems: { shop1: [{ itemId: 'sword', quantity: 1, buybackPrice: 75 }] }
    };
    const result = buybackItem(state, registry, 0, 100);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.goldSpent, 75);
  });

  it('removes item from buyback', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = {
      ...state,
      activeShop: 'shop1',
      buybackItems: { shop1: [{ itemId: 'sword', quantity: 1, buybackPrice: 75 }] }
    };
    const result = buybackItem(state, registry, 0, 100);
    assert.strictEqual(result.state.buybackItems['shop1'].length, 0);
  });

  it('fails with insufficient gold', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = {
      ...state,
      activeShop: 'shop1',
      buybackItems: { shop1: [{ itemId: 'sword', quantity: 1, buybackPrice: 75 }] }
    };
    const result = buybackItem(state, registry, 0, 50);
    assert.strictEqual(result.success, false);
  });

  it('fails with invalid index', () => {
    const registry = setupRegistry();
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', buybackItems: { shop1: [] } };
    const result = buybackItem(state, registry, 0, 100);
    assert.strictEqual(result.success, false);
  });
});

// ============================================================================
// Discount Tests (4 tests)
// ============================================================================

describe('Discounts', () => {
  it('sets discount', () => {
    const state = createShopState();
    const result = setDiscount(state, 'shop1', 15);
    assert.strictEqual(result.discounts['shop1'], 15);
  });

  it('caps discount at 100', () => {
    const state = createShopState();
    const result = setDiscount(state, 'shop1', 150);
    assert.strictEqual(result.discounts['shop1'], 100);
  });

  it('floors discount at 0', () => {
    const state = createShopState();
    const result = setDiscount(state, 'shop1', -10);
    assert.strictEqual(result.discounts['shop1'], 0);
  });

  it('gets discount', () => {
    let state = createShopState();
    state = setDiscount(state, 'shop1', 20);
    assert.strictEqual(getDiscount(state, 'shop1'), 20);
    assert.strictEqual(getDiscount(state, 'shop2'), 0);
  });
});

// ============================================================================
// Utility Functions Tests (9 tests)
// ============================================================================

describe('Utility Functions', () => {
  function setupRegistry() {
    let registry = createShopRegistry();
    const shop1 = createShop('shop1', 'Weapons', 'weapons', [
      { itemId: 'sword', price: 100, stock: 5 },
      { itemId: 'axe', price: 150, stock: 0 }
    ]).shop;
    const shop2 = createShop('shop2', 'Magic', 'magic', [
      { itemId: 'wand', price: 200 }
    ]).shop;
    registry = registerShop(registry, shop1).registry;
    registry = registerShop(registry, shop2).registry;
    return registry;
  }

  it('restocks shop', () => {
    const registry = setupRegistry();
    const shop = registry.shops['shop1'];
    const updatedShop = { ...shop, inventory: shop.inventory.map(i => ({ ...i, stock: 0 })) };
    const restocked = restockShop(updatedShop);
    assert.strictEqual(restocked.inventory[0].stock, 5);
  });

  it('checks item availability - in stock', () => {
    const registry = setupRegistry();
    assert.strictEqual(isItemAvailable(registry, 'shop1', 'sword'), true);
  });

  it('checks item availability - out of stock', () => {
    const registry = setupRegistry();
    assert.strictEqual(isItemAvailable(registry, 'shop1', 'axe'), false);
  });

  it('gets shop inventory (available only)', () => {
    const registry = setupRegistry();
    const inventory = getShopInventory(registry, 'shop1');
    assert.strictEqual(inventory.length, 1);
    assert.strictEqual(inventory[0].itemId, 'sword');
  });

  it('finds shops with item', () => {
    const registry = setupRegistry();
    const shops = findShopsWithItem(registry, 'sword');
    assert.strictEqual(shops.length, 1);
    assert.strictEqual(shops[0].id, 'shop1');
  });

  it('gets shops by type', () => {
    const registry = setupRegistry();
    const shops = getShopsByType(registry, 'magic');
    assert.strictEqual(shops.length, 1);
    assert.strictEqual(shops[0].id, 'shop2');
  });

  it('gets shop stats', () => {
    let state = createShopState();
    state = { ...state, activeShop: 'shop1', stats: { ...state.stats, goldSpent: 100, goldEarned: 50 } };
    const stats = getShopStats(state);
    assert.strictEqual(stats.netGold, -50);
    assert.strictEqual(stats.activeShop, 'shop1');
  });

  it('gets shop type info', () => {
    const info = getShopTypeInfo('weapons');
    assert.strictEqual(info.name, 'Weapons Shop');
  });

  it('returns null for invalid type', () => {
    const info = getShopTypeInfo('invalid');
    assert.strictEqual(info, null);
  });
});
