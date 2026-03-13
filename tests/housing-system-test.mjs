/**
 * Housing System Tests
 * Comprehensive tests for house ownership and customization
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
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
} from '../src/housing-system.js';

import {
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
} from '../src/housing-system-ui.js';

// ==================== Constants Tests ====================

describe('House Types', () => {
  it('should have all expected house types', () => {
    assert.strictEqual(HOUSE_TYPE.COTTAGE, 'cottage');
    assert.strictEqual(HOUSE_TYPE.TOWNHOUSE, 'townhouse');
    assert.strictEqual(HOUSE_TYPE.MANOR, 'manor');
    assert.strictEqual(HOUSE_TYPE.CASTLE, 'castle');
    assert.strictEqual(HOUSE_TYPE.TREEHOUSE, 'treehouse');
    assert.strictEqual(HOUSE_TYPE.FLOATING_ISLAND, 'floating_island');
  });

  it('should have 6 house types', () => {
    assert.strictEqual(Object.keys(HOUSE_TYPE).length, 6);
  });

  it('should have bonuses for all house types', () => {
    Object.values(HOUSE_TYPE).forEach(type => {
      assert.ok(HOUSE_BONUSES[type], `Missing bonus for ${type}`);
    });
  });
});

describe('Room Types', () => {
  it('should have all expected room types', () => {
    assert.strictEqual(ROOM_TYPE.BEDROOM, 'bedroom');
    assert.strictEqual(ROOM_TYPE.KITCHEN, 'kitchen');
    assert.strictEqual(ROOM_TYPE.LIVING_ROOM, 'living_room');
    assert.strictEqual(ROOM_TYPE.STORAGE, 'storage');
    assert.strictEqual(ROOM_TYPE.WORKSHOP, 'workshop');
    assert.strictEqual(ROOM_TYPE.GARDEN, 'garden');
    assert.strictEqual(ROOM_TYPE.TROPHY_ROOM, 'trophy_room');
    assert.strictEqual(ROOM_TYPE.LIBRARY, 'library');
    assert.strictEqual(ROOM_TYPE.ALCHEMY_LAB, 'alchemy_lab');
    assert.strictEqual(ROOM_TYPE.ARMORY, 'armory');
  });

  it('should have 10 room types', () => {
    assert.strictEqual(Object.keys(ROOM_TYPE).length, 10);
  });

  it('should have bonuses for all room types', () => {
    Object.values(ROOM_TYPE).forEach(type => {
      assert.ok(ROOM_BONUSES[type], `Missing bonus for ${type}`);
    });
  });
});

describe('Furniture Categories', () => {
  it('should have all categories', () => {
    assert.strictEqual(FURNITURE_CATEGORY.SEATING, 'seating');
    assert.strictEqual(FURNITURE_CATEGORY.TABLES, 'tables');
    assert.strictEqual(FURNITURE_CATEGORY.BEDS, 'beds');
    assert.strictEqual(FURNITURE_CATEGORY.STORAGE, 'storage');
    assert.strictEqual(FURNITURE_CATEGORY.LIGHTING, 'lighting');
    assert.strictEqual(FURNITURE_CATEGORY.DECORATION, 'decoration');
    assert.strictEqual(FURNITURE_CATEGORY.CRAFTING, 'crafting');
    assert.strictEqual(FURNITURE_CATEGORY.FUNCTIONAL, 'functional');
  });
});

describe('Furniture Rarity', () => {
  it('should have all rarities', () => {
    assert.strictEqual(FURNITURE_RARITY.COMMON, 'common');
    assert.strictEqual(FURNITURE_RARITY.UNCOMMON, 'uncommon');
    assert.strictEqual(FURNITURE_RARITY.RARE, 'rare');
    assert.strictEqual(FURNITURE_RARITY.EPIC, 'epic');
    assert.strictEqual(FURNITURE_RARITY.LEGENDARY, 'legendary');
  });
});

describe('House Bonuses', () => {
  it('should have increasing rest bonuses', () => {
    assert.ok(HOUSE_BONUSES[HOUSE_TYPE.CASTLE].restBonus > HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].restBonus);
  });

  it('should have increasing storage', () => {
    assert.ok(HOUSE_BONUSES[HOUSE_TYPE.CASTLE].storageSlots > HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].storageSlots);
  });

  it('should have increasing room counts', () => {
    assert.ok(HOUSE_BONUSES[HOUSE_TYPE.CASTLE].maxRooms > HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].maxRooms);
  });
});

describe('Furniture Data', () => {
  it('should have furniture defined', () => {
    assert.ok(Object.keys(FURNITURE_DATA).length > 0);
  });

  it('should have valid furniture properties', () => {
    Object.entries(FURNITURE_DATA).forEach(([id, data]) => {
      assert.ok(data.name, `Furniture ${id} missing name`);
      assert.ok(data.category, `Furniture ${id} missing category`);
      assert.ok(data.rarity, `Furniture ${id} missing rarity`);
      assert.ok(data.cost >= 0, `Furniture ${id} missing cost`);
    });
  });

  it('should have legendary items', () => {
    const legendaryItems = Object.values(FURNITURE_DATA).filter(f => f.rarity === FURNITURE_RARITY.LEGENDARY);
    assert.ok(legendaryItems.length > 0);
  });
});

// ==================== State Creation Tests ====================

describe('createHousingState', () => {
  it('should create empty state', () => {
    const state = createHousingState();
    assert.strictEqual(state.house, null);
    assert.deepStrictEqual(state.rooms, []);
    assert.deepStrictEqual(state.furniture, {});
    assert.deepStrictEqual(state.storage, []);
    assert.deepStrictEqual(state.visitors, []);
  });

  it('should initialize stats to zero', () => {
    const state = createHousingState();
    assert.strictEqual(state.stats.totalComfort, 0);
    assert.strictEqual(state.stats.totalBeauty, 0);
    assert.strictEqual(state.stats.totalAmbiance, 0);
    assert.strictEqual(state.stats.houseLevel, 0);
  });

  it('should initialize upgrades to zero', () => {
    const state = createHousingState();
    assert.strictEqual(state.upgrades.storageExpansion, 0);
    assert.strictEqual(state.upgrades.gardenSize, 0);
    assert.strictEqual(state.upgrades.securityLevel, 0);
  });
});

// ==================== House Purchase Tests ====================

describe('purchaseHouse', () => {
  it('should purchase house', () => {
    const state = createHousingState();
    const result = purchaseHouse(state, HOUSE_TYPE.COTTAGE);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.house.type, HOUSE_TYPE.COTTAGE);
    assert.strictEqual(result.state.house.level, 1);
  });

  it('should return cost', () => {
    const state = createHousingState();
    const result = purchaseHouse(state, HOUSE_TYPE.MANOR);

    assert.strictEqual(result.cost, HOUSE_BONUSES[HOUSE_TYPE.MANOR].baseCost);
  });

  it('should fail for invalid house type', () => {
    const state = createHousingState();
    const result = purchaseHouse(state, 'invalid_house');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid house type');
  });

  it('should fail if already own house', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = purchaseHouse(state, HOUSE_TYPE.MANOR);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('already own'));
  });
});

describe('sellHouse', () => {
  it('should sell house', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.TOWNHOUSE).state;

    const result = sellHouse(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.house, null);
  });

  it('should return 50% of value', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.TOWNHOUSE).state;

    const result = sellHouse(state);
    const expectedGold = Math.floor(HOUSE_BONUSES[HOUSE_TYPE.TOWNHOUSE].baseCost * 0.5);

    assert.strictEqual(result.goldReceived, expectedGold);
  });

  it('should fail without house', () => {
    const state = createHousingState();
    const result = sellHouse(state);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'You do not own a house');
  });

  it('should clear rooms and furniture', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state = addRoom(state, ROOM_TYPE.BEDROOM).state;

    const result = sellHouse(state);

    assert.deepStrictEqual(result.state.rooms, []);
    assert.deepStrictEqual(result.state.furniture, {});
  });
});

describe('upgradeHouse', () => {
  it('should upgrade house level', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = upgradeHouse(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newLevel, 2);
    assert.strictEqual(result.state.house.level, 2);
  });

  it('should fail without house', () => {
    const state = createHousingState();
    const result = upgradeHouse(state);

    assert.strictEqual(result.success, false);
  });

  it('should fail at max level', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state.house.level = 10;

    const result = upgradeHouse(state);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('maximum level'));
  });
});

// ==================== Room Tests ====================

describe('addRoom', () => {
  it('should add room to house', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = addRoom(state, ROOM_TYPE.BEDROOM);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.rooms.length, 1);
    assert.strictEqual(result.state.rooms[0].type, ROOM_TYPE.BEDROOM);
  });

  it('should assign unique room ID', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state = addRoom(state, ROOM_TYPE.BEDROOM).state;
    state = addRoom(state, ROOM_TYPE.KITCHEN).state;

    assert.notStrictEqual(state.rooms[0].id, state.rooms[1].id);
  });

  it('should allow custom room name', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = addRoom(state, ROOM_TYPE.BEDROOM, 'Master Suite');

    assert.strictEqual(result.state.rooms[0].name, 'Master Suite');
  });

  it('should fail without house', () => {
    const state = createHousingState();
    const result = addRoom(state, ROOM_TYPE.BEDROOM);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'You do not own a house');
  });

  it('should fail for invalid room type', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = addRoom(state, 'invalid_room');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid room type');
  });

  it('should fail when max rooms reached', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const maxRooms = HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].maxRooms;
    for (let i = 0; i < maxRooms; i++) {
      state = addRoom(state, ROOM_TYPE.STORAGE).state;
    }

    const result = addRoom(state, ROOM_TYPE.BEDROOM);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Maximum rooms'));
  });
});

describe('removeRoom', () => {
  it('should remove room', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const addResult = addRoom(state, ROOM_TYPE.KITCHEN);
    state = addResult.state;
    const roomId = addResult.room.id;

    const result = removeRoom(state, roomId);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.rooms.length, 0);
  });

  it('should fail for non-existent room', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = removeRoom(state, 'fake_id');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Room not found');
  });
});

describe('renameRoom', () => {
  it('should rename room', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const addResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = addResult.state;

    const result = renameRoom(state, addResult.room.id, 'Cozy Bedroom');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.rooms[0].name, 'Cozy Bedroom');
  });

  it('should fail with empty name', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const addResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = addResult.state;

    const result = renameRoom(state, addResult.room.id, '');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Name cannot be empty');
  });

  it('should fail with name too long', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const addResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = addResult.state;

    const longName = 'A'.repeat(31);
    const result = renameRoom(state, addResult.room.id, longName);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('too long'));
  });
});

// ==================== Furniture Tests ====================

describe('purchaseFurniture', () => {
  it('should purchase furniture', () => {
    const state = createHousingState();
    const result = purchaseFurniture(state, 'wooden_chair');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.cost, FURNITURE_DATA.wooden_chair.cost);
    assert.strictEqual(result.state.storage.length, 1);
  });

  it('should fail for invalid furniture', () => {
    const state = createHousingState();
    const result = purchaseFurniture(state, 'invalid_furniture');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid furniture type');
  });

  it('should create unique item IDs', () => {
    let state = createHousingState();
    const result1 = purchaseFurniture(state, 'wooden_chair');
    state = result1.state;
    const result2 = purchaseFurniture(state, 'wooden_chair');

    assert.notStrictEqual(result1.item.id, result2.item.id);
  });
});

describe('placeFurniture', () => {
  it('should place furniture in room', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.LIVING_ROOM);
    state = roomResult.state;
    const furnitureResult = purchaseFurniture(state, 'sofa');
    state = furnitureResult.state;

    const result = placeFurniture(state, furnitureResult.item.id, roomResult.room.id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.storage.length, 0);
    assert.strictEqual(result.state.furniture[roomResult.room.id].length, 1);
  });

  it('should fail for non-existent item', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = roomResult.state;

    const result = placeFurniture(state, 'fake_item', roomResult.room.id);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Furniture not found in storage');
  });

  it('should fail for non-existent room', () => {
    let state = createHousingState();
    const furnitureResult = purchaseFurniture(state, 'candle');
    state = furnitureResult.state;

    const result = placeFurniture(state, furnitureResult.item.id, 'fake_room');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Room not found');
  });
});

describe('removeFurniture', () => {
  it('should remove furniture from room', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = roomResult.state;
    const furnitureResult = purchaseFurniture(state, 'straw_bed');
    state = furnitureResult.state;
    state = placeFurniture(state, furnitureResult.item.id, roomResult.room.id).state;

    const result = removeFurniture(state, furnitureResult.item.id, roomResult.room.id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.furniture[roomResult.room.id].length, 0);
    assert.strictEqual(result.state.storage.length, 1);
  });

  it('should fail for non-existent item in room', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = roomResult.state;
    state.furniture[roomResult.room.id] = [];

    const result = removeFurniture(state, 'fake_item', roomResult.room.id);

    assert.strictEqual(result.success, false);
  });
});

// ==================== Stats Calculation Tests ====================

describe('calculateHouseStats', () => {
  it('should calculate comfort from furniture', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.LIVING_ROOM);
    state = roomResult.state;
    const furnitureResult = purchaseFurniture(state, 'cushioned_chair');
    state = furnitureResult.state;
    state = placeFurniture(state, furnitureResult.item.id, roomResult.room.id).state;

    assert.ok(state.stats.totalComfort > 0);
  });
});

describe('getRestBonus', () => {
  it('should return 1.0 without house', () => {
    const state = createHousingState();
    assert.strictEqual(getRestBonus(state), 1.0);
  });

  it('should return house bonus', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const bonus = getRestBonus(state);
    assert.ok(bonus >= HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].restBonus);
  });

  it('should include bed bonus', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.BEDROOM);
    state = roomResult.state;

    const baseBonusValue = getRestBonus(state);

    const furnitureResult = purchaseFurniture(state, 'canopy_bed');
    state = furnitureResult.state;
    state = placeFurniture(state, furnitureResult.item.id, roomResult.room.id).state;

    const withBedBonus = getRestBonus(state);
    assert.ok(withBedBonus > baseBonusValue);
  });
});

describe('getStorageCapacity', () => {
  it('should return 0 without house', () => {
    const state = createHousingState();
    assert.strictEqual(getStorageCapacity(state), 0);
  });

  it('should return base storage', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const capacity = getStorageCapacity(state);
    assert.strictEqual(capacity, HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].storageSlots);
  });

  it('should add storage room bonus', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const baseCapacity = getStorageCapacity(state);

    state = addRoom(state, ROOM_TYPE.STORAGE).state;

    const newCapacity = getStorageCapacity(state);
    assert.ok(newCapacity > baseCapacity);
  });

  it('should add storage furniture bonus', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.STORAGE);
    state = roomResult.state;

    const baseCapacity = getStorageCapacity(state);

    const furnitureResult = purchaseFurniture(state, 'large_chest');
    state = furnitureResult.state;
    state = placeFurniture(state, furnitureResult.item.id, roomResult.room.id).state;

    const newCapacity = getStorageCapacity(state);
    assert.ok(newCapacity > baseCapacity);
  });
});

describe('getCraftingBonus', () => {
  it('should return 0 without house', () => {
    const state = createHousingState();
    assert.strictEqual(getCraftingBonus(state), 0);
  });

  it('should add workshop bonus', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.MANOR).state;
    state = addRoom(state, ROOM_TYPE.WORKSHOP).state;

    const bonus = getCraftingBonus(state);
    assert.ok(bonus > 0);
  });

  it('should add crafting furniture bonus', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.MANOR).state;
    const roomResult = addRoom(state, ROOM_TYPE.WORKSHOP);
    state = roomResult.state;

    const baseBonus = getCraftingBonus(state);

    const furnitureResult = purchaseFurniture(state, 'smithing_anvil');
    state = furnitureResult.state;
    state = placeFurniture(state, furnitureResult.item.id, roomResult.room.id).state;

    const newBonus = getCraftingBonus(state);
    assert.ok(newBonus > baseBonus);
  });
});

// ==================== Visitor Tests ====================

describe('addVisitor', () => {
  it('should add visitor', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = addVisitor(state, 'Alice');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.visitors.length, 1);
    assert.strictEqual(result.state.visitors[0].name, 'Alice');
  });

  it('should fail without house', () => {
    const state = createHousingState();
    const result = addVisitor(state, 'Bob');

    assert.strictEqual(result.success, false);
  });

  it('should fail at max visitors', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    for (let i = 0; i < 10; i++) {
      state = addVisitor(state, `Visitor${i}`).state;
    }

    const result = addVisitor(state, 'OneMore');

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('maximum'));
  });
});

describe('removeVisitor', () => {
  it('should remove visitor', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const addResult = addVisitor(state, 'Charlie');
    state = addResult.state;

    const result = removeVisitor(state, addResult.visitor.id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.visitors.length, 0);
  });

  it('should fail for non-existent visitor', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = removeVisitor(state, 'fake_visitor');

    assert.strictEqual(result.success, false);
  });
});

// ==================== Upgrade Tests ====================

describe('purchaseUpgrade', () => {
  it('should purchase upgrade', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = purchaseUpgrade(state, 'storageExpansion');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newLevel, 1);
    assert.strictEqual(result.state.upgrades.storageExpansion, 1);
  });

  it('should fail without house', () => {
    const state = createHousingState();
    const result = purchaseUpgrade(state, 'storageExpansion');

    assert.strictEqual(result.success, false);
  });

  it('should fail for invalid upgrade', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const result = purchaseUpgrade(state, 'invalidUpgrade');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid upgrade type');
  });

  it('should fail at max level', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state.upgrades.storageExpansion = 5;

    const result = purchaseUpgrade(state, 'storageExpansion');

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('maximum'));
  });
});

// ==================== Summary Tests ====================

describe('getHouseSummary', () => {
  it('should return no house summary', () => {
    const state = createHousingState();
    const summary = getHouseSummary(state);

    assert.strictEqual(summary.hasHouse, false);
  });

  it('should return house summary', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.MANOR).state;
    state = addRoom(state, ROOM_TYPE.BEDROOM).state;

    const summary = getHouseSummary(state);

    assert.strictEqual(summary.hasHouse, true);
    assert.strictEqual(summary.type, HOUSE_TYPE.MANOR);
    assert.strictEqual(summary.currentRooms, 1);
    assert.ok(summary.storageCapacity > 0);
  });
});

describe('getRoomSummary', () => {
  it('should return null for non-existent room', () => {
    const state = createHousingState();
    const summary = getRoomSummary(state, 'fake_room');

    assert.strictEqual(summary, null);
  });

  it('should return room summary', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.KITCHEN, 'My Kitchen');
    state = roomResult.state;

    const summary = getRoomSummary(state, roomResult.room.id);

    assert.strictEqual(summary.type, ROOM_TYPE.KITCHEN);
    assert.strictEqual(summary.name, 'My Kitchen');
    assert.strictEqual(summary.furnitureCount, 0);
  });
});

// ==================== UI Tests ====================

describe('renderHousingPanel', () => {
  it('should render no house when none owned', () => {
    const state = createHousingState();
    const html = renderHousingPanel(state);

    assert.ok(html.includes('no-house'));
    assert.ok(html.includes('No House Owned'));
  });

  it('should render house panel', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const html = renderHousingPanel(state);

    assert.ok(html.includes('housing-panel'));
    assert.ok(html.includes('cottage'));
  });
});

describe('renderNoHouse', () => {
  it('should render no house message', () => {
    const html = renderNoHouse();

    assert.ok(html.includes('No House Owned'));
    assert.ok(html.includes('Browse Houses'));
  });
});

describe('renderHouseBrowser', () => {
  it('should render all house types', () => {
    const html = renderHouseBrowser();

    assert.ok(html.includes('house-browser'));
    assert.ok(html.includes('cottage'));
    assert.ok(html.includes('castle'));
  });

  it('should show house prices', () => {
    const html = renderHouseBrowser();

    assert.ok(html.includes(HOUSE_BONUSES[HOUSE_TYPE.COTTAGE].baseCost.toLocaleString()));
  });
});

describe('renderRoomList', () => {
  it('should render empty message', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const html = renderRoomList(state);

    assert.ok(html.includes('empty'));
    assert.ok(html.includes('No rooms'));
  });

  it('should render rooms', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state = addRoom(state, ROOM_TYPE.BEDROOM, 'Test Room').state;

    const html = renderRoomList(state);

    assert.ok(html.includes('Test Room'));
    assert.ok(html.includes('room-card'));
  });
});

describe('renderRoomDetail', () => {
  it('should show error for non-existent room', () => {
    const state = createHousingState();
    const html = renderRoomDetail(state, 'fake_id');

    assert.ok(html.includes('error'));
  });

  it('should render room detail', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    const roomResult = addRoom(state, ROOM_TYPE.KITCHEN, 'My Kitchen');
    state = roomResult.state;

    const html = renderRoomDetail(state, roomResult.room.id);

    assert.ok(html.includes('room-detail'));
    assert.ok(html.includes('My Kitchen'));
  });
});

describe('renderFurnitureStorage', () => {
  it('should render empty storage', () => {
    const state = createHousingState();
    const html = renderFurnitureStorage(state);

    assert.ok(html.includes('empty'));
    assert.ok(html.includes('No furniture'));
  });

  it('should render stored items', () => {
    let state = createHousingState();
    state = purchaseFurniture(state, 'wooden_chair').state;

    const html = renderFurnitureStorage(state);

    assert.ok(html.includes('Wooden Chair'));
  });
});

describe('renderFurnitureShop', () => {
  it('should render shop', () => {
    const html = renderFurnitureShop();

    assert.ok(html.includes('furniture-shop'));
    assert.ok(html.includes('Furniture Shop'));
  });

  it('should filter by category', () => {
    const html = renderFurnitureShop(FURNITURE_CATEGORY.BEDS);

    assert.ok(html.includes('Straw Bed'));
  });
});

describe('renderRoomTypeSelector', () => {
  it('should render all room types', () => {
    const html = renderRoomTypeSelector();

    assert.ok(html.includes('room-type-selector'));
    assert.ok(html.includes('bedroom'));
    assert.ok(html.includes('kitchen'));
  });
});

describe('renderVisitorList', () => {
  it('should render empty visitor list', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const html = renderVisitorList(state);

    assert.ok(html.includes('empty'));
    assert.ok(html.includes('No visitors'));
  });

  it('should render visitors', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state = addVisitor(state, 'TestVisitor').state;

    const html = renderVisitorList(state);

    assert.ok(html.includes('TestVisitor'));
  });
});

describe('renderUpgradePanel', () => {
  it('should show error without house', () => {
    const state = createHousingState();
    const html = renderUpgradePanel(state);

    assert.ok(html.includes('error'));
  });

  it('should render upgrades', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;

    const html = renderUpgradePanel(state);

    assert.ok(html.includes('upgrade-panel'));
    assert.ok(html.includes('storageExpansion'));
  });
});

describe('renderPurchaseConfirmation', () => {
  it('should render confirmation', () => {
    const html = renderPurchaseConfirmation('furniture', 'Royal Throne', 10000);

    assert.ok(html.includes('purchase-confirmation'));
    assert.ok(html.includes('Royal Throne'));
    assert.ok(html.includes('10000'));
  });
});

describe('renderPlacementDialog', () => {
  it('should render placement options', () => {
    let state = createHousingState();
    state = purchaseHouse(state, HOUSE_TYPE.COTTAGE).state;
    state = addRoom(state, ROOM_TYPE.BEDROOM, 'Main Bedroom').state;
    const furnitureResult = purchaseFurniture(state, 'candle');
    state = furnitureResult.state;

    const html = renderPlacementDialog(state, furnitureResult.item.id);

    assert.ok(html.includes('placement-dialog'));
    assert.ok(html.includes('Main Bedroom'));
  });
});

describe('UI Constants', () => {
  it('should have rarity colors', () => {
    Object.values(FURNITURE_RARITY).forEach(rarity => {
      assert.ok(RARITY_COLORS[rarity]);
    });
  });

  it('should have house icons', () => {
    Object.values(HOUSE_TYPE).forEach(type => {
      assert.ok(HOUSE_ICONS[type]);
    });
  });

  it('should have room icons', () => {
    Object.values(ROOM_TYPE).forEach(type => {
      assert.ok(ROOM_ICONS[type]);
    });
  });

  it('should have category icons', () => {
    Object.values(FURNITURE_CATEGORY).forEach(cat => {
      assert.ok(CATEGORY_ICONS[cat]);
    });
  });
});
