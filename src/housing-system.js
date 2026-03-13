/**
 * Housing System
 * Allows players to own, upgrade, and customize their homes
 */

// House types
const HOUSE_TYPE = {
  COTTAGE: 'cottage',
  TOWNHOUSE: 'townhouse',
  MANOR: 'manor',
  CASTLE: 'castle',
  TREEHOUSE: 'treehouse',
  FLOATING_ISLAND: 'floating_island'
};

// Room types
const ROOM_TYPE = {
  BEDROOM: 'bedroom',
  KITCHEN: 'kitchen',
  LIVING_ROOM: 'living_room',
  STORAGE: 'storage',
  WORKSHOP: 'workshop',
  GARDEN: 'garden',
  TROPHY_ROOM: 'trophy_room',
  LIBRARY: 'library',
  ALCHEMY_LAB: 'alchemy_lab',
  ARMORY: 'armory'
};

// Furniture categories
const FURNITURE_CATEGORY = {
  SEATING: 'seating',
  TABLES: 'tables',
  BEDS: 'beds',
  STORAGE: 'storage',
  LIGHTING: 'lighting',
  DECORATION: 'decoration',
  CRAFTING: 'crafting',
  FUNCTIONAL: 'functional'
};

// Furniture rarity
const FURNITURE_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// House tier bonuses
const HOUSE_BONUSES = {
  [HOUSE_TYPE.COTTAGE]: {
    restBonus: 1.0,
    storageSlots: 50,
    maxRooms: 4,
    baseCost: 1000
  },
  [HOUSE_TYPE.TOWNHOUSE]: {
    restBonus: 1.15,
    storageSlots: 100,
    maxRooms: 6,
    baseCost: 5000
  },
  [HOUSE_TYPE.MANOR]: {
    restBonus: 1.3,
    storageSlots: 200,
    maxRooms: 10,
    baseCost: 25000
  },
  [HOUSE_TYPE.CASTLE]: {
    restBonus: 1.5,
    storageSlots: 500,
    maxRooms: 20,
    baseCost: 100000
  },
  [HOUSE_TYPE.TREEHOUSE]: {
    restBonus: 1.25,
    storageSlots: 80,
    maxRooms: 5,
    baseCost: 15000
  },
  [HOUSE_TYPE.FLOATING_ISLAND]: {
    restBonus: 1.75,
    storageSlots: 300,
    maxRooms: 12,
    baseCost: 200000
  }
};

// Room bonuses
const ROOM_BONUSES = {
  [ROOM_TYPE.BEDROOM]: { restMultiplier: 1.2 },
  [ROOM_TYPE.KITCHEN]: { foodBuffDuration: 1.5 },
  [ROOM_TYPE.LIVING_ROOM]: { socialBonus: 1.1 },
  [ROOM_TYPE.STORAGE]: { extraSlots: 50 },
  [ROOM_TYPE.WORKSHOP]: { craftingSpeed: 1.25 },
  [ROOM_TYPE.GARDEN]: { herbGrowthRate: 1.5 },
  [ROOM_TYPE.TROPHY_ROOM]: { xpDisplayBonus: 1.05 },
  [ROOM_TYPE.LIBRARY]: { skillXpBonus: 1.1 },
  [ROOM_TYPE.ALCHEMY_LAB]: { potionEfficiency: 1.3 },
  [ROOM_TYPE.ARMORY]: { equipmentDurability: 1.2 }
};

// Furniture database
const FURNITURE_DATA = {
  // Seating
  wooden_chair: { name: 'Wooden Chair', category: FURNITURE_CATEGORY.SEATING, rarity: FURNITURE_RARITY.COMMON, comfort: 5, cost: 50 },
  cushioned_chair: { name: 'Cushioned Chair', category: FURNITURE_CATEGORY.SEATING, rarity: FURNITURE_RARITY.UNCOMMON, comfort: 10, cost: 150 },
  throne: { name: 'Royal Throne', category: FURNITURE_CATEGORY.SEATING, rarity: FURNITURE_RARITY.LEGENDARY, comfort: 50, cost: 10000 },
  sofa: { name: 'Comfortable Sofa', category: FURNITURE_CATEGORY.SEATING, rarity: FURNITURE_RARITY.RARE, comfort: 25, cost: 500 },

  // Tables
  wooden_table: { name: 'Wooden Table', category: FURNITURE_CATEGORY.TABLES, rarity: FURNITURE_RARITY.COMMON, utility: 5, cost: 75 },
  dining_table: { name: 'Dining Table', category: FURNITURE_CATEGORY.TABLES, rarity: FURNITURE_RARITY.UNCOMMON, utility: 15, cost: 300 },
  enchanted_desk: { name: 'Enchanted Desk', category: FURNITURE_CATEGORY.TABLES, rarity: FURNITURE_RARITY.EPIC, utility: 40, cost: 2500 },

  // Beds
  straw_bed: { name: 'Straw Bed', category: FURNITURE_CATEGORY.BEDS, rarity: FURNITURE_RARITY.COMMON, restBonus: 0.05, cost: 100 },
  wooden_bed: { name: 'Wooden Bed', category: FURNITURE_CATEGORY.BEDS, rarity: FURNITURE_RARITY.UNCOMMON, restBonus: 0.1, cost: 300 },
  canopy_bed: { name: 'Canopy Bed', category: FURNITURE_CATEGORY.BEDS, rarity: FURNITURE_RARITY.RARE, restBonus: 0.2, cost: 1000 },
  royal_bed: { name: 'Royal Bed', category: FURNITURE_CATEGORY.BEDS, rarity: FURNITURE_RARITY.LEGENDARY, restBonus: 0.5, cost: 15000 },

  // Storage
  small_chest: { name: 'Small Chest', category: FURNITURE_CATEGORY.STORAGE, rarity: FURNITURE_RARITY.COMMON, slots: 10, cost: 100 },
  large_chest: { name: 'Large Chest', category: FURNITURE_CATEGORY.STORAGE, rarity: FURNITURE_RARITY.UNCOMMON, slots: 25, cost: 350 },
  wardrobe: { name: 'Wardrobe', category: FURNITURE_CATEGORY.STORAGE, rarity: FURNITURE_RARITY.RARE, slots: 50, cost: 800 },
  vault: { name: 'Secure Vault', category: FURNITURE_CATEGORY.STORAGE, rarity: FURNITURE_RARITY.EPIC, slots: 100, cost: 5000 },

  // Lighting
  candle: { name: 'Candle', category: FURNITURE_CATEGORY.LIGHTING, rarity: FURNITURE_RARITY.COMMON, ambiance: 5, cost: 10 },
  lantern: { name: 'Lantern', category: FURNITURE_CATEGORY.LIGHTING, rarity: FURNITURE_RARITY.UNCOMMON, ambiance: 15, cost: 75 },
  chandelier: { name: 'Crystal Chandelier', category: FURNITURE_CATEGORY.LIGHTING, rarity: FURNITURE_RARITY.EPIC, ambiance: 50, cost: 3000 },
  magic_orb: { name: 'Floating Magic Orb', category: FURNITURE_CATEGORY.LIGHTING, rarity: FURNITURE_RARITY.LEGENDARY, ambiance: 75, cost: 8000 },

  // Decoration
  painting: { name: 'Painting', category: FURNITURE_CATEGORY.DECORATION, rarity: FURNITURE_RARITY.COMMON, beauty: 10, cost: 100 },
  statue: { name: 'Marble Statue', category: FURNITURE_CATEGORY.DECORATION, rarity: FURNITURE_RARITY.RARE, beauty: 35, cost: 1500 },
  trophy_mount: { name: 'Trophy Mount', category: FURNITURE_CATEGORY.DECORATION, rarity: FURNITURE_RARITY.UNCOMMON, beauty: 20, cost: 200 },
  aquarium: { name: 'Enchanted Aquarium', category: FURNITURE_CATEGORY.DECORATION, rarity: FURNITURE_RARITY.EPIC, beauty: 60, cost: 4000 },

  // Crafting
  basic_workbench: { name: 'Basic Workbench', category: FURNITURE_CATEGORY.CRAFTING, rarity: FURNITURE_RARITY.COMMON, craftBonus: 0.05, cost: 200 },
  smithing_anvil: { name: 'Smithing Anvil', category: FURNITURE_CATEGORY.CRAFTING, rarity: FURNITURE_RARITY.UNCOMMON, craftBonus: 0.1, cost: 500 },
  alchemy_station: { name: 'Alchemy Station', category: FURNITURE_CATEGORY.CRAFTING, rarity: FURNITURE_RARITY.RARE, craftBonus: 0.2, cost: 1200 },
  enchanting_table: { name: 'Enchanting Table', category: FURNITURE_CATEGORY.CRAFTING, rarity: FURNITURE_RARITY.EPIC, craftBonus: 0.35, cost: 5000 },

  // Functional
  cooking_pot: { name: 'Cooking Pot', category: FURNITURE_CATEGORY.FUNCTIONAL, rarity: FURNITURE_RARITY.COMMON, function: 'cooking', cost: 150 },
  fireplace: { name: 'Fireplace', category: FURNITURE_CATEGORY.FUNCTIONAL, rarity: FURNITURE_RARITY.UNCOMMON, function: 'warmth', cost: 400 },
  teleport_crystal: { name: 'Teleport Crystal', category: FURNITURE_CATEGORY.FUNCTIONAL, rarity: FURNITURE_RARITY.LEGENDARY, function: 'teleport', cost: 20000 }
};

/**
 * Create initial housing state
 */
function createHousingState() {
  return {
    house: null,
    rooms: [],
    furniture: {},
    storage: [],
    visitors: [],
    stats: {
      totalComfort: 0,
      totalBeauty: 0,
      totalAmbiance: 0,
      houseLevel: 0
    },
    upgrades: {
      storageExpansion: 0,
      gardenSize: 0,
      securityLevel: 0
    }
  };
}

/**
 * Purchase a house
 */
function purchaseHouse(state, houseType) {
  if (!HOUSE_BONUSES[houseType]) {
    return {
      success: false,
      error: 'Invalid house type',
      state
    };
  }

  if (state.house !== null) {
    return {
      success: false,
      error: 'You already own a house. Sell it first.',
      state
    };
  }

  const houseData = HOUSE_BONUSES[houseType];

  return {
    success: true,
    cost: houseData.baseCost,
    state: {
      ...state,
      house: {
        type: houseType,
        purchasedAt: Date.now(),
        level: 1
      },
      stats: {
        ...state.stats,
        houseLevel: 1
      }
    }
  };
}

/**
 * Sell current house
 */
function sellHouse(state) {
  if (!state.house) {
    return {
      success: false,
      error: 'You do not own a house',
      state
    };
  }

  const houseData = HOUSE_BONUSES[state.house.type];
  const sellValue = Math.floor(houseData.baseCost * 0.5); // 50% return

  return {
    success: true,
    goldReceived: sellValue,
    state: {
      ...state,
      house: null,
      rooms: [],
      furniture: {},
      stats: {
        totalComfort: 0,
        totalBeauty: 0,
        totalAmbiance: 0,
        houseLevel: 0
      }
    }
  };
}

/**
 * Upgrade house level
 */
function upgradeHouse(state) {
  if (!state.house) {
    return {
      success: false,
      error: 'You do not own a house',
      state
    };
  }

  const maxLevel = 10;
  if (state.house.level >= maxLevel) {
    return {
      success: false,
      error: 'House already at maximum level',
      state
    };
  }

  const upgradeCost = Math.floor(HOUSE_BONUSES[state.house.type].baseCost * state.house.level * 0.5);

  return {
    success: true,
    cost: upgradeCost,
    newLevel: state.house.level + 1,
    state: {
      ...state,
      house: {
        ...state.house,
        level: state.house.level + 1
      },
      stats: {
        ...state.stats,
        houseLevel: state.house.level + 1
      }
    }
  };
}

/**
 * Add a room to the house
 */
function addRoom(state, roomType, roomName = null) {
  if (!state.house) {
    return {
      success: false,
      error: 'You do not own a house',
      state
    };
  }

  if (!ROOM_BONUSES[roomType]) {
    return {
      success: false,
      error: 'Invalid room type',
      state
    };
  }

  const houseData = HOUSE_BONUSES[state.house.type];
  if (state.rooms.length >= houseData.maxRooms) {
    return {
      success: false,
      error: 'Maximum rooms reached for this house type',
      state
    };
  }

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const roomCost = 500 * (state.rooms.length + 1);

  const newRoom = {
    id: roomId,
    type: roomType,
    name: roomName || roomType.replace(/_/g, ' '),
    furniture: [],
    createdAt: Date.now()
  };

  return {
    success: true,
    cost: roomCost,
    room: newRoom,
    state: {
      ...state,
      rooms: [...state.rooms, newRoom]
    }
  };
}

/**
 * Remove a room
 */
function removeRoom(state, roomId) {
  const roomIndex = state.rooms.findIndex(r => r.id === roomId);

  if (roomIndex === -1) {
    return {
      success: false,
      error: 'Room not found',
      state
    };
  }

  const newRooms = [...state.rooms];
  newRooms.splice(roomIndex, 1);

  // Remove furniture in that room
  const newFurniture = { ...state.furniture };
  delete newFurniture[roomId];

  return {
    success: true,
    state: {
      ...state,
      rooms: newRooms,
      furniture: newFurniture
    }
  };
}

/**
 * Purchase furniture
 */
function purchaseFurniture(state, furnitureId) {
  const furnitureData = FURNITURE_DATA[furnitureId];

  if (!furnitureData) {
    return {
      success: false,
      error: 'Invalid furniture type',
      state
    };
  }

  const itemId = `furn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newItem = {
    id: itemId,
    furnitureId,
    placedIn: null, // Not placed yet
    purchasedAt: Date.now()
  };

  return {
    success: true,
    cost: furnitureData.cost,
    item: newItem,
    state: {
      ...state,
      storage: [...state.storage, newItem]
    }
  };
}

/**
 * Place furniture in a room
 */
function placeFurniture(state, itemId, roomId) {
  // Find item in storage
  const itemIndex = state.storage.findIndex(i => i.id === itemId);

  if (itemIndex === -1) {
    return {
      success: false,
      error: 'Furniture not found in storage',
      state
    };
  }

  // Find room
  const room = state.rooms.find(r => r.id === roomId);

  if (!room) {
    return {
      success: false,
      error: 'Room not found',
      state
    };
  }

  const item = state.storage[itemIndex];

  // Remove from storage
  const newStorage = [...state.storage];
  newStorage.splice(itemIndex, 1);

  // Add to room furniture
  const roomFurniture = state.furniture[roomId] || [];
  const placedItem = { ...item, placedIn: roomId };

  // Recalculate stats
  const newStats = calculateHouseStats({
    ...state,
    storage: newStorage,
    furniture: {
      ...state.furniture,
      [roomId]: [...roomFurniture, placedItem]
    }
  });

  return {
    success: true,
    state: {
      ...state,
      storage: newStorage,
      furniture: {
        ...state.furniture,
        [roomId]: [...roomFurniture, placedItem]
      },
      stats: newStats
    }
  };
}

/**
 * Remove furniture from room (back to storage)
 */
function removeFurniture(state, itemId, roomId) {
  const roomFurniture = state.furniture[roomId];

  if (!roomFurniture) {
    return {
      success: false,
      error: 'No furniture in this room',
      state
    };
  }

  const itemIndex = roomFurniture.findIndex(i => i.id === itemId);

  if (itemIndex === -1) {
    return {
      success: false,
      error: 'Furniture not found in room',
      state
    };
  }

  const item = roomFurniture[itemIndex];
  const newRoomFurniture = [...roomFurniture];
  newRoomFurniture.splice(itemIndex, 1);

  // Add back to storage
  const unplacedItem = { ...item, placedIn: null };

  const newStats = calculateHouseStats({
    ...state,
    storage: [...state.storage, unplacedItem],
    furniture: {
      ...state.furniture,
      [roomId]: newRoomFurniture
    }
  });

  return {
    success: true,
    state: {
      ...state,
      storage: [...state.storage, unplacedItem],
      furniture: {
        ...state.furniture,
        [roomId]: newRoomFurniture
      },
      stats: newStats
    }
  };
}

/**
 * Calculate house stats based on furniture
 */
function calculateHouseStats(state) {
  let totalComfort = 0;
  let totalBeauty = 0;
  let totalAmbiance = 0;

  // Add stats from all placed furniture
  Object.values(state.furniture).forEach(roomFurniture => {
    roomFurniture.forEach(item => {
      const data = FURNITURE_DATA[item.furnitureId];
      if (data) {
        totalComfort += data.comfort || 0;
        totalBeauty += data.beauty || 0;
        totalAmbiance += data.ambiance || 0;
      }
    });
  });

  return {
    ...state.stats,
    totalComfort,
    totalBeauty,
    totalAmbiance
  };
}

/**
 * Get rest bonus multiplier
 */
function getRestBonus(state) {
  if (!state.house) return 1.0;

  const houseBonus = HOUSE_BONUSES[state.house.type].restBonus;
  let bedBonus = 0;

  // Check for beds
  Object.values(state.furniture).forEach(roomFurniture => {
    roomFurniture.forEach(item => {
      const data = FURNITURE_DATA[item.furnitureId];
      if (data && data.restBonus) {
        bedBonus += data.restBonus;
      }
    });
  });

  // Level bonus (2% per level)
  const levelBonus = 1 + (state.house.level - 1) * 0.02;

  return houseBonus * (1 + bedBonus) * levelBonus;
}

/**
 * Get total storage capacity
 */
function getStorageCapacity(state) {
  if (!state.house) return 0;

  let capacity = HOUSE_BONUSES[state.house.type].storageSlots;

  // Add from storage rooms
  state.rooms.forEach(room => {
    if (room.type === ROOM_TYPE.STORAGE) {
      capacity += ROOM_BONUSES[ROOM_TYPE.STORAGE].extraSlots;
    }
  });

  // Add from storage furniture
  Object.values(state.furniture).forEach(roomFurniture => {
    roomFurniture.forEach(item => {
      const data = FURNITURE_DATA[item.furnitureId];
      if (data && data.slots) {
        capacity += data.slots;
      }
    });
  });

  // Storage expansion upgrade
  capacity += state.upgrades.storageExpansion * 25;

  return capacity;
}

/**
 * Get crafting bonus from house
 */
function getCraftingBonus(state) {
  if (!state.house) return 0;

  let bonus = 0;

  // Workshop room bonus
  state.rooms.forEach(room => {
    if (room.type === ROOM_TYPE.WORKSHOP) {
      bonus += ROOM_BONUSES[ROOM_TYPE.WORKSHOP].craftingSpeed - 1;
    }
  });

  // Crafting furniture bonus
  Object.values(state.furniture).forEach(roomFurniture => {
    roomFurniture.forEach(item => {
      const data = FURNITURE_DATA[item.furnitureId];
      if (data && data.craftBonus) {
        bonus += data.craftBonus;
      }
    });
  });

  return bonus;
}

/**
 * Add visitor to house
 */
function addVisitor(state, visitorName, visitorType = 'friend') {
  if (!state.house) {
    return {
      success: false,
      error: 'You do not own a house',
      state
    };
  }

  const maxVisitors = 10;
  if (state.visitors.length >= maxVisitors) {
    return {
      success: false,
      error: 'House is at maximum visitor capacity',
      state
    };
  }

  const visitor = {
    id: `visitor_${Date.now()}`,
    name: visitorName,
    type: visitorType,
    arrivedAt: Date.now()
  };

  return {
    success: true,
    visitor,
    state: {
      ...state,
      visitors: [...state.visitors, visitor]
    }
  };
}

/**
 * Remove visitor
 */
function removeVisitor(state, visitorId) {
  const index = state.visitors.findIndex(v => v.id === visitorId);

  if (index === -1) {
    return {
      success: false,
      error: 'Visitor not found',
      state
    };
  }

  const newVisitors = [...state.visitors];
  newVisitors.splice(index, 1);

  return {
    success: true,
    state: {
      ...state,
      visitors: newVisitors
    }
  };
}

/**
 * Purchase upgrade
 */
function purchaseUpgrade(state, upgradeType) {
  if (!state.house) {
    return {
      success: false,
      error: 'You do not own a house',
      state
    };
  }

  const maxUpgrade = 5;
  const currentLevel = state.upgrades[upgradeType];

  if (currentLevel === undefined) {
    return {
      success: false,
      error: 'Invalid upgrade type',
      state
    };
  }

  if (currentLevel >= maxUpgrade) {
    return {
      success: false,
      error: 'Upgrade already at maximum level',
      state
    };
  }

  const cost = 1000 * (currentLevel + 1);

  return {
    success: true,
    cost,
    newLevel: currentLevel + 1,
    state: {
      ...state,
      upgrades: {
        ...state.upgrades,
        [upgradeType]: currentLevel + 1
      }
    }
  };
}

/**
 * Get house summary
 */
function getHouseSummary(state) {
  if (!state.house) {
    return {
      hasHouse: false
    };
  }

  const houseData = HOUSE_BONUSES[state.house.type];

  return {
    hasHouse: true,
    type: state.house.type,
    level: state.house.level,
    maxRooms: houseData.maxRooms,
    currentRooms: state.rooms.length,
    storageCapacity: getStorageCapacity(state),
    restBonus: getRestBonus(state),
    craftingBonus: getCraftingBonus(state),
    totalComfort: state.stats.totalComfort,
    totalBeauty: state.stats.totalBeauty,
    totalAmbiance: state.stats.totalAmbiance,
    visitorCount: state.visitors.length,
    furnitutrePlaced: Object.values(state.furniture).reduce((sum, arr) => sum + arr.length, 0),
    furnitureInStorage: state.storage.length
  };
}

/**
 * Get room summary
 */
function getRoomSummary(state, roomId) {
  const room = state.rooms.find(r => r.id === roomId);

  if (!room) {
    return null;
  }

  const roomFurniture = state.furniture[roomId] || [];
  const roomBonus = ROOM_BONUSES[room.type];

  return {
    id: room.id,
    type: room.type,
    name: room.name,
    furnitureCount: roomFurniture.length,
    bonus: roomBonus,
    furniture: roomFurniture.map(item => ({
      id: item.id,
      ...FURNITURE_DATA[item.furnitureId]
    }))
  };
}

/**
 * Rename room
 */
function renameRoom(state, roomId, newName) {
  const roomIndex = state.rooms.findIndex(r => r.id === roomId);

  if (roomIndex === -1) {
    return {
      success: false,
      error: 'Room not found',
      state
    };
  }

  if (!newName || newName.trim().length === 0) {
    return {
      success: false,
      error: 'Name cannot be empty',
      state
    };
  }

  if (newName.length > 30) {
    return {
      success: false,
      error: 'Name too long (max 30 characters)',
      state
    };
  }

  const newRooms = [...state.rooms];
  newRooms[roomIndex] = {
    ...newRooms[roomIndex],
    name: newName.trim()
  };

  return {
    success: true,
    state: {
      ...state,
      rooms: newRooms
    }
  };
}

// Export everything
export {
  HOUSE_TYPE,
  ROOM_TYPE,
  FURNITURE_CATEGORY,
  FURNITURE_RARITY,
  HOUSE_BONUSES,
  ROOM_BONUSES,
  FURNITURE_DATA,
  createHousingState,
  purchaseHouse,
  sellHouse,
  upgradeHouse,
  addRoom,
  removeRoom,
  purchaseFurniture,
  placeFurniture,
  removeFurniture,
  calculateHouseStats,
  getRestBonus,
  getStorageCapacity,
  getCraftingBonus,
  addVisitor,
  removeVisitor,
  purchaseUpgrade,
  getHouseSummary,
  getRoomSummary,
  renameRoom
};
