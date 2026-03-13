/**
 * Shop System
 * Buy and sell items from NPC vendors
 */

// Shop types
export const SHOP_TYPES = {
  GENERAL: { name: 'General Store', icon: '🏪' },
  WEAPONS: { name: 'Weapons Shop', icon: '⚔️' },
  ARMOR: { name: 'Armor Shop', icon: '🛡️' },
  POTIONS: { name: 'Potion Shop', icon: '🧪' },
  MAGIC: { name: 'Magic Shop', icon: '✨' },
  BLACKSMITH: { name: 'Blacksmith', icon: '🔨' },
  JEWELER: { name: 'Jeweler', icon: '💎' },
  TAVERN: { name: 'Tavern', icon: '🍺' }
};

// Transaction types
export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  BUYBACK: 'buyback'
};

// Create initial shop state
export function createShopState() {
  return {
    activeShop: null,
    cart: [],
    sellList: [],
    buybackItems: {},
    lastVisited: {},
    discounts: {},
    stats: {
      totalPurchases: 0,
      totalSales: 0,
      goldSpent: 0,
      goldEarned: 0,
      itemsBought: 0,
      itemsSold: 0
    }
  };
}

// Create a shop definition
export function createShop(id, name, type, inventory, options = {}) {
  if (!id || !name) {
    return { success: false, error: 'Invalid shop id or name' };
  }

  if (!SHOP_TYPES[type?.toUpperCase()]) {
    return { success: false, error: 'Invalid shop type' };
  }

  if (!Array.isArray(inventory) || inventory.length === 0) {
    return { success: false, error: 'Shop must have inventory' };
  }

  return {
    success: true,
    shop: {
      id,
      name,
      type: type.toUpperCase(),
      inventory: inventory.map(item => ({
        itemId: item.itemId,
        basePrice: item.price,
        stock: item.stock ?? -1, // -1 = unlimited
        maxStock: item.maxStock ?? item.stock ?? -1
      })),
      sellPriceMultiplier: options.sellPriceMultiplier || 0.5,
      buybackEnabled: options.buybackEnabled ?? true,
      levelRequirement: options.levelRequirement || 1,
      reputationRequired: options.reputationRequired || null,
      restockInterval: options.restockInterval || 3600000, // 1 hour default
      createdAt: Date.now()
    }
  };
}

// Create shop registry
export function createShopRegistry() {
  return {
    shops: {},
    byType: {},
    itemCatalog: {}
  };
}

// Register shop
export function registerShop(registry, shop) {
  if (!shop || !shop.id) {
    return { success: false, error: 'Invalid shop' };
  }

  if (registry.shops[shop.id]) {
    return { success: false, error: 'Shop already registered' };
  }

  const newShops = { ...registry.shops, [shop.id]: shop };

  // Index by type
  const newByType = { ...registry.byType };
  newByType[shop.type] = [...(newByType[shop.type] || []), shop.id];

  // Index items
  const newItemCatalog = { ...registry.itemCatalog };
  for (const item of shop.inventory) {
    newItemCatalog[item.itemId] = [...(newItemCatalog[item.itemId] || []), shop.id];
  }

  return {
    success: true,
    registry: {
      shops: newShops,
      byType: newByType,
      itemCatalog: newItemCatalog
    }
  };
}

// Register item (for price lookups)
export function registerItem(registry, itemId, name, baseValue) {
  return {
    items: {
      ...registry.items,
      [itemId]: { name, baseValue }
    }
  };
}

// Open shop
export function openShop(state, registry, shopId, playerLevel = 1, reputation = {}) {
  const shop = registry.shops[shopId];
  if (!shop) {
    return { success: false, error: 'Shop not found' };
  }

  if (state.activeShop) {
    return { success: false, error: 'Another shop is already open' };
  }

  if (playerLevel < shop.levelRequirement) {
    return { success: false, error: 'Level requirement not met' };
  }

  if (shop.reputationRequired) {
    const { faction, amount } = shop.reputationRequired;
    if ((reputation[faction] || 0) < amount) {
      return { success: false, error: 'Reputation requirement not met' };
    }
  }

  return {
    success: true,
    shop,
    state: {
      ...state,
      activeShop: shopId,
      cart: [],
      sellList: [],
      lastVisited: {
        ...state.lastVisited,
        [shopId]: Date.now()
      }
    }
  };
}

// Close shop
export function closeShop(state) {
  if (!state.activeShop) {
    return { success: false, error: 'No shop is open' };
  }

  return {
    success: true,
    state: {
      ...state,
      activeShop: null,
      cart: [],
      sellList: []
    }
  };
}

// Get item price (with discounts)
export function getItemPrice(state, registry, shopId, itemId, quantity = 1) {
  const shop = registry.shops[shopId];
  if (!shop) return null;

  const shopItem = shop.inventory.find(i => i.itemId === itemId);
  if (!shopItem) return null;

  let price = shopItem.basePrice;

  // Apply discount if any
  const discount = state.discounts[shopId] || 0;
  price = Math.floor(price * (1 - discount / 100));

  return price * quantity;
}

// Get sell price
export function getSellPrice(registry, shopId, itemId, quantity = 1, baseValue = 0) {
  const shop = registry.shops[shopId];
  if (!shop) return null;

  const sellPrice = Math.floor(baseValue * shop.sellPriceMultiplier);
  return sellPrice * quantity;
}

// Add item to cart
export function addToCart(state, registry, itemId, quantity = 1) {
  if (!state.activeShop) {
    return { success: false, error: 'No shop is open' };
  }

  const shop = registry.shops[state.activeShop];
  const shopItem = shop.inventory.find(i => i.itemId === itemId);

  if (!shopItem) {
    return { success: false, error: 'Item not available in shop' };
  }

  // Check stock
  if (shopItem.stock !== -1) {
    const currentInCart = state.cart
      .filter(c => c.itemId === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);

    if (currentInCart + quantity > shopItem.stock) {
      return { success: false, error: 'Not enough stock' };
    }
  }

  // Find existing cart entry or create new
  const existingIndex = state.cart.findIndex(c => c.itemId === itemId);
  let newCart;

  if (existingIndex >= 0) {
    newCart = [...state.cart];
    newCart[existingIndex] = {
      ...newCart[existingIndex],
      quantity: newCart[existingIndex].quantity + quantity
    };
  } else {
    newCart = [...state.cart, { itemId, quantity }];
  }

  return {
    success: true,
    state: {
      ...state,
      cart: newCart
    }
  };
}

// Remove from cart
export function removeFromCart(state, itemId, quantity = 1) {
  const existingIndex = state.cart.findIndex(c => c.itemId === itemId);

  if (existingIndex < 0) {
    return { success: false, error: 'Item not in cart' };
  }

  const existing = state.cart[existingIndex];
  let newCart;

  if (quantity >= existing.quantity) {
    newCart = state.cart.filter((_, i) => i !== existingIndex);
  } else {
    newCart = [...state.cart];
    newCart[existingIndex] = {
      ...existing,
      quantity: existing.quantity - quantity
    };
  }

  return {
    success: true,
    state: {
      ...state,
      cart: newCart
    }
  };
}

// Clear cart
export function clearCart(state) {
  return {
    ...state,
    cart: []
  };
}

// Add to sell list
export function addToSellList(state, itemId, quantity = 1) {
  if (!state.activeShop) {
    return { success: false, error: 'No shop is open' };
  }

  const existingIndex = state.sellList.findIndex(s => s.itemId === itemId);
  let newSellList;

  if (existingIndex >= 0) {
    newSellList = [...state.sellList];
    newSellList[existingIndex] = {
      ...newSellList[existingIndex],
      quantity: newSellList[existingIndex].quantity + quantity
    };
  } else {
    newSellList = [...state.sellList, { itemId, quantity }];
  }

  return {
    success: true,
    state: {
      ...state,
      sellList: newSellList
    }
  };
}

// Remove from sell list
export function removeFromSellList(state, itemId, quantity = 1) {
  const existingIndex = state.sellList.findIndex(s => s.itemId === itemId);

  if (existingIndex < 0) {
    return { success: false, error: 'Item not in sell list' };
  }

  const existing = state.sellList[existingIndex];
  let newSellList;

  if (quantity >= existing.quantity) {
    newSellList = state.sellList.filter((_, i) => i !== existingIndex);
  } else {
    newSellList = [...state.sellList];
    newSellList[existingIndex] = {
      ...existing,
      quantity: existing.quantity - quantity
    };
  }

  return {
    success: true,
    state: {
      ...state,
      sellList: newSellList
    }
  };
}

// Clear sell list
export function clearSellList(state) {
  return {
    ...state,
    sellList: []
  };
}

// Calculate cart total
export function calculateCartTotal(state, registry) {
  if (!state.activeShop) return 0;

  let total = 0;
  for (const cartItem of state.cart) {
    const price = getItemPrice(state, registry, state.activeShop, cartItem.itemId, cartItem.quantity);
    if (price !== null) {
      total += price;
    }
  }

  return total;
}

// Calculate sell total
export function calculateSellTotal(state, registry, itemValues = {}) {
  if (!state.activeShop) return 0;

  let total = 0;
  for (const sellItem of state.sellList) {
    const baseValue = itemValues[sellItem.itemId] || 0;
    const price = getSellPrice(registry, state.activeShop, sellItem.itemId, sellItem.quantity, baseValue);
    if (price !== null) {
      total += price;
    }
  }

  return total;
}

// Complete purchase
export function completePurchase(state, registry, playerGold, itemValues = {}) {
  if (!state.activeShop) {
    return { success: false, error: 'No shop is open' };
  }

  if (state.cart.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  const total = calculateCartTotal(state, registry);

  if (playerGold < total) {
    return { success: false, error: 'Not enough gold', required: total, available: playerGold };
  }

  // Update shop stock
  const shop = registry.shops[state.activeShop];
  const updatedInventory = shop.inventory.map(item => {
    const cartItem = state.cart.find(c => c.itemId === item.itemId);
    if (cartItem && item.stock !== -1) {
      return { ...item, stock: item.stock - cartItem.quantity };
    }
    return item;
  });

  const purchasedItems = [...state.cart];
  const itemCount = purchasedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    success: true,
    items: purchasedItems,
    goldSpent: total,
    state: {
      ...state,
      cart: [],
      stats: {
        ...state.stats,
        totalPurchases: state.stats.totalPurchases + 1,
        goldSpent: state.stats.goldSpent + total,
        itemsBought: state.stats.itemsBought + itemCount
      }
    },
    updatedShop: {
      ...shop,
      inventory: updatedInventory
    }
  };
}

// Complete sale
export function completeSale(state, registry, itemValues = {}) {
  if (!state.activeShop) {
    return { success: false, error: 'No shop is open' };
  }

  if (state.sellList.length === 0) {
    return { success: false, error: 'Nothing to sell' };
  }

  const total = calculateSellTotal(state, registry, itemValues);
  const shop = registry.shops[state.activeShop];

  // Add to buyback if enabled
  let newBuyback = { ...state.buybackItems };
  if (shop.buybackEnabled) {
    const shopBuyback = newBuyback[state.activeShop] || [];
    const newItems = state.sellList.map(item => ({
      ...item,
      soldAt: Date.now(),
      buybackPrice: Math.floor((itemValues[item.itemId] || 0) * 0.75)
    }));
    newBuyback[state.activeShop] = [...shopBuyback, ...newItems].slice(-20); // Keep last 20
  }

  const soldItems = [...state.sellList];
  const itemCount = soldItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    success: true,
    items: soldItems,
    goldEarned: total,
    state: {
      ...state,
      sellList: [],
      buybackItems: newBuyback,
      stats: {
        ...state.stats,
        totalSales: state.stats.totalSales + 1,
        goldEarned: state.stats.goldEarned + total,
        itemsSold: state.stats.itemsSold + itemCount
      }
    }
  };
}

// Buyback item
export function buybackItem(state, registry, itemIndex, playerGold) {
  if (!state.activeShop) {
    return { success: false, error: 'No shop is open' };
  }

  const shop = registry.shops[state.activeShop];
  if (!shop.buybackEnabled) {
    return { success: false, error: 'Buyback not available' };
  }

  const buybackList = state.buybackItems[state.activeShop] || [];
  if (itemIndex < 0 || itemIndex >= buybackList.length) {
    return { success: false, error: 'Invalid buyback item' };
  }

  const item = buybackList[itemIndex];

  if (playerGold < item.buybackPrice) {
    return { success: false, error: 'Not enough gold' };
  }

  const newBuybackList = buybackList.filter((_, i) => i !== itemIndex);

  return {
    success: true,
    item,
    goldSpent: item.buybackPrice,
    state: {
      ...state,
      buybackItems: {
        ...state.buybackItems,
        [state.activeShop]: newBuybackList
      },
      stats: {
        ...state.stats,
        goldSpent: state.stats.goldSpent + item.buybackPrice
      }
    }
  };
}

// Get buyback items
export function getBuybackItems(state) {
  if (!state.activeShop) return [];
  return state.buybackItems[state.activeShop] || [];
}

// Set discount
export function setDiscount(state, shopId, discountPercent) {
  return {
    ...state,
    discounts: {
      ...state.discounts,
      [shopId]: Math.min(100, Math.max(0, discountPercent))
    }
  };
}

// Get discount
export function getDiscount(state, shopId) {
  return state.discounts[shopId] || 0;
}

// Restock shop
export function restockShop(shop) {
  const updatedInventory = shop.inventory.map(item => ({
    ...item,
    stock: item.maxStock
  }));

  return {
    ...shop,
    inventory: updatedInventory
  };
}

// Check if item available
export function isItemAvailable(registry, shopId, itemId) {
  const shop = registry.shops[shopId];
  if (!shop) return false;

  const item = shop.inventory.find(i => i.itemId === itemId);
  if (!item) return false;

  return item.stock === -1 || item.stock > 0;
}

// Get shop inventory
export function getShopInventory(registry, shopId) {
  const shop = registry.shops[shopId];
  if (!shop) return [];

  return shop.inventory.filter(item => item.stock === -1 || item.stock > 0);
}

// Find shops with item
export function findShopsWithItem(registry, itemId) {
  const shopIds = registry.itemCatalog[itemId] || [];
  return shopIds.map(id => registry.shops[id]);
}

// Get shops by type
export function getShopsByType(registry, type) {
  const typeKey = type.toUpperCase();
  const shopIds = registry.byType[typeKey] || [];
  return shopIds.map(id => registry.shops[id]);
}

// Get shop stats
export function getShopStats(state) {
  return {
    ...state.stats,
    netGold: state.stats.goldEarned - state.stats.goldSpent,
    activeShop: state.activeShop,
    cartItems: state.cart.length,
    sellListItems: state.sellList.length
  };
}

// Get shop type info
export function getShopTypeInfo(type) {
  return SHOP_TYPES[type?.toUpperCase()] || null;
}
