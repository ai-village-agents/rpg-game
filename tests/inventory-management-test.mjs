// Inventory Management Tests
// Tests for src/inventory.js - inventory UI phase, equip/unequip, use consumables
// Created by Claude Opus 4.6 (Day 338)

import {
  getEquipSlot,
  isEquippable,
  isUsable,
  getItemDetails,
  ensureEquipment,
  getEquipmentBonuses,
  equipItem,
  unequipItem,
  useConsumable,
  getCategorizedInventory,
  getEquipmentDisplay,
  EQUIPMENT_SLOTS,
  INVENTORY_SCREENS,
  createInventoryState,
  handleInventoryAction,
} from '../src/inventory.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

function makePlayer(overrides = {}) {
  return {
    name: 'TestHero',
    classId: 'warrior',
    hp: 50,
    maxHp: 100,
    mp: 10,
    maxMp: 30,
    atk: 15,
    def: 10,
    spd: 8,
    level: 1,
    xp: 0,
    gold: 100,
    inventory: { potion: 3, ironSword: 1, leatherArmor: 1, ether: 2, antidote: 1 },
    equipment: { weapon: null, armor: null, accessory: null },
    statusEffects: [],
    ...overrides,
  };
}

function makeGameState(overrides = {}) {
  return {
    phase: 'inventory',
    player: makePlayer(),
    inventoryState: createInventoryState('exploration'),
    log: ['Opened inventory.'],
    ...overrides,
  };
}

// ===== getEquipSlot =====
console.log('--- getEquipSlot ---');
assert(getEquipSlot('ironSword') === 'weapon', 'ironSword → weapon slot');
assert(getEquipSlot('rustySword') === 'weapon', 'rustySword → weapon slot');
assert(getEquipSlot('huntersBow') === 'weapon', 'huntersBow → weapon slot');
assert(getEquipSlot('arcaneStaff') === 'weapon', 'arcaneStaff → weapon slot');
assert(getEquipSlot('dragonSpear') === 'weapon', 'dragonSpear → weapon slot');
assert(getEquipSlot('leatherArmor') === 'armor', 'leatherArmor → armor slot');
assert(getEquipSlot('chainmail') === 'armor', 'chainmail → armor slot');
assert(getEquipSlot('mageRobe') === 'armor', 'mageRobe → armor slot');
assert(getEquipSlot('shadowCloak') === 'armor', 'shadowCloak → armor slot');
assert(getEquipSlot('ringOfFortune') === 'accessory', 'ringOfFortune → accessory slot');
assert(getEquipSlot('amuletOfVigor') === 'accessory', 'amuletOfVigor → accessory slot');
assert(getEquipSlot('bootsOfSwiftness') === 'accessory', 'bootsOfSwiftness → accessory slot');
assert(getEquipSlot('potion') === null, 'potion has no equip slot');
assert(getEquipSlot('ether') === null, 'ether has no equip slot');
assert(getEquipSlot('nonexistent') === null, 'nonexistent item returns null');

// ===== isEquippable =====
console.log('--- isEquippable ---');
assert(isEquippable('ironSword') === true, 'ironSword is equippable');
assert(isEquippable('leatherArmor') === true, 'leatherArmor is equippable');
assert(isEquippable('ringOfFortune') === true, 'ringOfFortune is equippable');
assert(isEquippable('potion') === false, 'potion is not equippable');
assert(isEquippable('bomb') === false, 'bomb is not equippable');
assert(isEquippable('nonexistent') === false, 'nonexistent item not equippable');

// ===== isUsable =====
console.log('--- isUsable ---');
assert(isUsable('potion') === true, 'potion is usable');
assert(isUsable('hiPotion') === true, 'hiPotion is usable');
assert(isUsable('ether') === true, 'ether is usable');
assert(isUsable('antidote') === true, 'antidote is usable');
assert(isUsable('bomb') === true, 'bomb is usable (consumable type)');
assert(isUsable('ironSword') === false, 'ironSword is not usable');
assert(isUsable('leatherArmor') === false, 'leatherArmor is not usable');
assert(isUsable('nonexistent') === false, 'nonexistent item not usable');

// ===== getItemDetails =====
console.log('--- getItemDetails ---');
{
  const details = getItemDetails('ironSword');
  assert(details !== null, 'ironSword details not null');
  assert(details.name === 'Iron Sword', 'ironSword name correct');
  assert(details.type === 'weapon', 'ironSword type is weapon');
  assert(details.rarity === 'Uncommon', 'ironSword rarity is Uncommon');
  assert(details.equippable === true, 'ironSword marked equippable');
  assert(details.usable === false, 'ironSword not marked usable');
  assert(details.slot === 'weapon', 'ironSword slot is weapon');
  assert(details.stats.attack === 12, 'ironSword has +12 attack');

  const potionDetails = getItemDetails('potion');
  assert(potionDetails !== null, 'potion details not null');
  assert(potionDetails.usable === true, 'potion marked usable');
  assert(potionDetails.equippable === false, 'potion not equippable');
  assert(potionDetails.slot === null, 'potion has no slot');

  assert(getItemDetails('nonexistent') === null, 'nonexistent returns null');
}

// ===== ensureEquipment =====
console.log('--- ensureEquipment ---');
{
  const noEquip = { name: 'Test', inventory: {} };
  const result = ensureEquipment(noEquip);
  assert(result.equipment !== undefined, 'ensureEquipment adds equipment');
  assert(result.equipment.weapon === null, 'weapon slot null');
  assert(result.equipment.armor === null, 'armor slot null');
  assert(result.equipment.accessory === null, 'accessory slot null');

  const withEquip = { name: 'Test', equipment: { weapon: 'ironSword', armor: null, accessory: null } };
  const result2 = ensureEquipment(withEquip);
  assert(result2.equipment.weapon === 'ironSword', 'existing equipment preserved');
  assert(result2 === withEquip, 'returns same object if equipment exists');
}

// ===== getEquipmentBonuses =====
console.log('--- getEquipmentBonuses ---');
{
  const bonuses = getEquipmentBonuses({ weapon: 'ironSword', armor: 'leatherArmor', accessory: null });
  assert(bonuses.attack === 12, 'ironSword gives +12 attack');
  assert(bonuses.defense === 6, 'leatherArmor gives +6 defense');
  assert(bonuses.speed === 1, 'leatherArmor gives +1 speed');
  assert(bonuses.critChance === 2, 'ironSword gives +2 critChance');

  const fullBonuses = getEquipmentBonuses({ weapon: 'arcaneStaff', armor: 'shadowCloak', accessory: 'amuletOfVigor' });
  assert(fullBonuses.attack === 8, 'arcaneStaff gives +8 attack');
  assert(fullBonuses.defense === 14 + 3, 'shadowCloak +14 + amuletOfVigor +3 defense');
  assert(fullBonuses.magic === 18, 'arcaneStaff gives +18 magic');
  assert(fullBonuses.speed === 4 + 5, 'shadowCloak +4 + amuletOfVigor +5 speed');
  assert(fullBonuses.critChance === 4, 'arcaneStaff gives +4 critChance');

  const emptyBonuses = getEquipmentBonuses(null);
  assert(emptyBonuses.attack === 0, 'null equipment gives 0 bonuses');

  const nothingEquipped = getEquipmentBonuses({ weapon: null, armor: null, accessory: null });
  assert(nothingEquipped.attack === 0, 'no items equipped gives 0 attack');
}

// ===== equipItem =====
console.log('--- equipItem ---');
{
  const player = makePlayer();
  const result = equipItem(player, 'ironSword');
  assert(result.success === true, 'equip ironSword succeeds');
  assert(result.player.equipment.weapon === 'ironSword', 'weapon slot has ironSword');
  assert((result.player.inventory.ironSword || 0) === 0, 'ironSword removed from inventory');
  assert(result.message.includes('Equipped Iron Sword'), 'message mentions equipping');
}
{
  const player = makePlayer();
  const result = equipItem(player, 'leatherArmor');
  assert(result.success === true, 'equip leatherArmor succeeds');
  assert(result.player.equipment.armor === 'leatherArmor', 'armor slot has leatherArmor');
  assert((result.player.inventory.leatherArmor || 0) === 0, 'leatherArmor removed from inventory');
}
{
  // Equip when slot already occupied - swap
  const player = makePlayer({ equipment: { weapon: 'rustySword', armor: null, accessory: null }, inventory: { ironSword: 1, rustySword: 0 } });
  const result = equipItem(player, 'ironSword');
  assert(result.success === true, 'swap equip succeeds');
  assert(result.player.equipment.weapon === 'ironSword', 'new weapon equipped');
  assert(result.player.inventory.rustySword === 1, 'old weapon returned to inventory');
  assert((result.player.inventory.ironSword || 0) === 0, 'new weapon removed from inventory');
  assert(result.message.includes('Unequipped'), 'message mentions unequipping old item');
}
{
  // Try to equip item not in inventory
  const player = makePlayer({ inventory: {} });
  const result = equipItem(player, 'ironSword');
  assert(result.success === false, 'equip fails with no inventory');
  assert(result.message.includes("don't have"), 'message says no item');
}
{
  // Try to equip consumable
  const player = makePlayer();
  const result = equipItem(player, 'potion');
  assert(result.success === false, 'equip potion fails');
  assert(result.message.includes('cannot be equipped'), 'message says cannot equip');
}
{
  // Try to equip nonexistent item
  const player = makePlayer();
  const result = equipItem(player, 'nonexistent');
  assert(result.success === false, 'equip nonexistent fails');
}

// ===== unequipItem =====
console.log('--- unequipItem ---');
{
  const player = makePlayer({ equipment: { weapon: 'ironSword', armor: null, accessory: null } });
  const result = unequipItem(player, 'weapon');
  assert(result.success === true, 'unequip weapon succeeds');
  assert(result.player.equipment.weapon === null, 'weapon slot now null');
  assert(result.player.inventory.ironSword === 2, 'ironSword returned to inventory (had 1 + 1)');
  assert(result.message.includes('Unequipped Iron Sword'), 'message mentions unequipping');
}
{
  const player = makePlayer({ equipment: { weapon: null, armor: null, accessory: null } });
  const result = unequipItem(player, 'weapon');
  assert(result.success === false, 'unequip empty slot fails');
  assert(result.message.includes('Nothing equipped'), 'message says nothing equipped');
}
{
  const player = makePlayer();
  const result = unequipItem(player, 'invalid_slot');
  assert(result.success === false, 'unequip invalid slot fails');
  assert(result.message.includes('Invalid'), 'message says invalid');
}

// ===== useConsumable =====
console.log('--- useConsumable ---');
{
  const player = makePlayer({ hp: 50, maxHp: 100 });
  const result = useConsumable(player, 'potion');
  assert(result.success === true, 'use potion succeeds');
  assert(result.player.hp === 70, 'HP restored by 20 (50+20=70)');
  assert(result.player.inventory.potion === 2, 'potion count decreased (3→2)');
  assert(result.message.includes('restored'), 'message mentions restoration');
}
{
  const player = makePlayer({ hp: 95, maxHp: 100 });
  const result = useConsumable(player, 'potion');
  assert(result.success === true, 'use potion at near-full HP succeeds');
  assert(result.player.hp === 100, 'HP capped at maxHp');
}
{
  const player = makePlayer({ mp: 5, maxMp: 30 });
  const result = useConsumable(player, 'ether');
  assert(result.success === true, 'use ether succeeds');
  assert(result.player.mp <= 30, 'MP does not exceed maxMp');
  assert(result.player.mp > 5, 'MP increased');
}
{
  const player = makePlayer({ statusEffects: ['poison', 'burn'] });
  const result = useConsumable(player, 'antidote');
  assert(result.success === true, 'use antidote succeeds');
  assert(!result.player.statusEffects.includes('poison'), 'poison cured');
  assert(result.player.statusEffects.includes('burn'), 'burn not cured by antidote');
}
{
  const player = makePlayer({ inventory: {} });
  const result = useConsumable(player, 'potion');
  assert(result.success === false, 'use potion with none fails');
}
{
  const player = makePlayer();
  const result = useConsumable(player, 'ironSword');
  assert(result.success === false, 'use ironSword fails (not consumable)');
}

// ===== getCategorizedInventory =====
console.log('--- getCategorizedInventory ---');
{
  const inv = { potion: 3, ironSword: 1, leatherArmor: 1, ringOfFortune: 2, ether: 1 };
  const cats = getCategorizedInventory(inv);
  assert(cats.consumables.length === 2, '2 consumable types (potion + ether)');
  assert(cats.weapons.length === 1, '1 weapon type');
  assert(cats.armors.length === 1, '1 armor type');
  assert(cats.accessories.length === 1, '1 accessory type');
  assert(cats.unknown.length === 0, 'no unknown items');

  const potionEntry = cats.consumables.find(c => c.id === 'potion');
  assert(potionEntry.count === 3, 'potion count is 3');
  assert(potionEntry.name === 'Healing Potion', 'potion name correct');
}
{
  const cats = getCategorizedInventory(null);
  assert(cats.consumables.length === 0, 'null inventory → empty categories');
}
{
  const cats = getCategorizedInventory({ unknownItem: 2 });
  assert(cats.unknown.length === 1, 'unknown item categorized');
  assert(cats.unknown[0].name === 'unknownItem', 'unknown item uses id as name');
}
{
  const cats = getCategorizedInventory({ potion: 0, ironSword: 1 });
  assert(cats.consumables.length === 0, 'zero-count items excluded');
  assert(cats.weapons.length === 1, 'non-zero items included');
}

// ===== getEquipmentDisplay =====
console.log('--- getEquipmentDisplay ---');
{
  const display = getEquipmentDisplay({ weapon: 'ironSword', armor: null, accessory: 'ringOfFortune' });
  assert(display.weapon !== null, 'weapon display not null');
  assert(display.weapon.name === 'Iron Sword', 'weapon display name correct');
  assert(display.armor === null, 'armor display is null');
  assert(display.accessory.name === 'Ring of Fortune', 'accessory display name correct');
}
{
  const display = getEquipmentDisplay(null);
  assert(display.weapon === null, 'null equipment → null weapon');
  assert(display.armor === null, 'null equipment → null armor');
  assert(display.accessory === null, 'null equipment → null accessory');
}

// ===== INVENTORY_SCREENS and createInventoryState =====
console.log('--- createInventoryState ---');
{
  const invState = createInventoryState('exploration');
  assert(invState.screen === INVENTORY_SCREENS.MAIN, 'starts on main screen');
  assert(invState.returnPhase === 'exploration', 'return phase is exploration');
  assert(invState.selectedItem === null, 'no selected item');
  assert(invState.message === null, 'no message');
}
{
  const invState = createInventoryState('victory');
  assert(invState.returnPhase === 'victory', 'return phase is victory');
}
{
  const invState = createInventoryState();
  assert(invState.returnPhase === 'exploration', 'default return phase is exploration');
}

// ===== handleInventoryAction: CLOSE_INVENTORY =====
console.log('--- handleInventoryAction: CLOSE_INVENTORY ---');
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'CLOSE_INVENTORY' });
  assert(result.phase === 'exploration', 'phase returns to exploration');
  assert(result.inventoryState === undefined, 'inventoryState removed');
  assert(result.log.some(l => l.includes('Closed inventory')), 'log mentions closing');
}
{
  const gs = makeGameState({
    inventoryState: createInventoryState('victory'),
  });
  const result = handleInventoryAction(gs, { type: 'CLOSE_INVENTORY' });
  assert(result.phase === 'victory', 'returns to victory phase');
}

// ===== handleInventoryAction: INVENTORY_USE =====
console.log('--- handleInventoryAction: INVENTORY_USE ---');
{
  const gs = makeGameState();
  gs.player.hp = 50;
  gs.player.maxHp = 100;
  const result = handleInventoryAction(gs, { type: 'INVENTORY_USE', itemId: 'potion' });
  assert(result.player.hp === 70, 'potion heals 20 HP via dispatch');
  assert(result.player.inventory.potion === 2, 'potion consumed');
  assert(result.inventoryState.screen === INVENTORY_SCREENS.MAIN, 'returns to main screen');
  assert(result.log.length > gs.log.length, 'log updated');
}
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_USE', itemId: 'ironSword' });
  assert(result.inventoryState.message.includes('cannot be used'), 'non-usable item message');
}
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_USE', itemId: null });
  assert(result.inventoryState.message.includes('cannot be used'), 'null item message');
}

// ===== handleInventoryAction: INVENTORY_EQUIP =====
console.log('--- handleInventoryAction: INVENTORY_EQUIP ---');
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_EQUIP', itemId: 'ironSword' });
  assert(result.player.equipment.weapon === 'ironSword', 'ironSword equipped via dispatch');
  assert((result.player.inventory.ironSword || 0) === 0, 'ironSword removed from inventory');
  assert(result.inventoryState.screen === INVENTORY_SCREENS.MAIN, 'returns to main screen');
}
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_EQUIP', itemId: 'potion' });
  assert(result.inventoryState.message.includes('cannot be equipped'), 'consumable equip rejected');
}
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_EQUIP', itemId: null });
  assert(result.inventoryState.message.includes('cannot be equipped'), 'null equip rejected');
}

// ===== handleInventoryAction: INVENTORY_UNEQUIP =====
console.log('--- handleInventoryAction: INVENTORY_UNEQUIP ---');
{
  const gs = makeGameState();
  gs.player.equipment = { weapon: 'ironSword', armor: null, accessory: null };
  gs.player.inventory = { ...gs.player.inventory, ironSword: 0 };
  const result = handleInventoryAction(gs, { type: 'INVENTORY_UNEQUIP', slot: 'weapon' });
  assert(result.player.equipment.weapon === null, 'weapon slot cleared');
  assert(result.player.inventory.ironSword === 1, 'ironSword returned to inventory');
  assert(result.inventoryState.screen === INVENTORY_SCREENS.MAIN, 'returns to main screen');
}
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_UNEQUIP', slot: 'weapon' });
  assert(result.inventoryState.message.includes('Nothing equipped'), 'empty slot message');
}

// ===== handleInventoryAction: INVENTORY_VIEW_DETAILS =====
console.log('--- handleInventoryAction: INVENTORY_VIEW_DETAILS ---');
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'INVENTORY_VIEW_DETAILS', itemId: 'ironSword' });
  assert(result.inventoryState.screen === INVENTORY_SCREENS.DETAILS, 'screen changed to details');
  assert(result.inventoryState.selectedItem === 'ironSword', 'selected item set');
}

// ===== handleInventoryAction: INVENTORY_BACK =====
console.log('--- handleInventoryAction: INVENTORY_BACK ---');
{
  const gs = makeGameState();
  gs.inventoryState.screen = INVENTORY_SCREENS.DETAILS;
  gs.inventoryState.selectedItem = 'ironSword';
  gs.inventoryState.message = 'some message';
  const result = handleInventoryAction(gs, { type: 'INVENTORY_BACK' });
  assert(result.inventoryState.screen === INVENTORY_SCREENS.MAIN, 'back to main screen');
  assert(result.inventoryState.selectedItem === null, 'selected item cleared');
  assert(result.inventoryState.message === null, 'message cleared');
}

// ===== handleInventoryAction: unknown action =====
console.log('--- handleInventoryAction: unknown ---');
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, { type: 'UNKNOWN_ACTION' });
  assert(result === gs, 'unknown action returns same state');
}
{
  const gs = makeGameState();
  const result = handleInventoryAction(gs, null);
  assert(result === gs, 'null action returns same state');
}

// ===== Complex scenario: full inventory workflow =====
console.log('--- Complex: full workflow ---');
{
  // Start with empty equipment, items in inventory
  let gs = makeGameState();
  gs.player.hp = 40;
  gs.player.maxHp = 100;

  // Step 1: Equip iron sword
  gs = handleInventoryAction(gs, { type: 'INVENTORY_EQUIP', itemId: 'ironSword' });
  assert(gs.player.equipment.weapon === 'ironSword', 'workflow: sword equipped');

  // Step 2: Equip leather armor
  gs = handleInventoryAction(gs, { type: 'INVENTORY_EQUIP', itemId: 'leatherArmor' });
  assert(gs.player.equipment.armor === 'leatherArmor', 'workflow: armor equipped');

  // Step 3: Check bonuses
  const bonuses = getEquipmentBonuses(gs.player.equipment);
  assert(bonuses.attack === 12, 'workflow: +12 attack from sword');
  assert(bonuses.defense === 6, 'workflow: +6 defense from armor');

  // Step 4: Use a potion
  gs = handleInventoryAction(gs, { type: 'INVENTORY_USE', itemId: 'potion' });
  assert(gs.player.hp === 60, 'workflow: HP healed to 60');
  assert(gs.player.inventory.potion === 2, 'workflow: 2 potions left');

  // Step 5: Use another potion
  gs = handleInventoryAction(gs, { type: 'INVENTORY_USE', itemId: 'potion' });
  assert(gs.player.hp === 80, 'workflow: HP healed to 80');

  // Step 6: Close inventory
  gs = handleInventoryAction(gs, { type: 'CLOSE_INVENTORY' });
  assert(gs.phase === 'exploration', 'workflow: back to exploration');
  assert(gs.inventoryState === undefined, 'workflow: inventory state cleaned up');
}

// ===== Edge cases =====
console.log('--- Edge cases ---');
{
  // Player without equipment field
  const player = { name: 'Noob', hp: 20, maxHp: 20, inventory: { rustySword: 1 } };
  const result = equipItem(player, 'rustySword');
  assert(result.success === true, 'equip works on player without equipment field');
  assert(result.player.equipment.weapon === 'rustySword', 'equipment field auto-created');
}
{
  // Equip with multiple of same item
  const player = makePlayer({ inventory: { ironSword: 3 }, equipment: { weapon: null, armor: null, accessory: null } });
  const result = equipItem(player, 'ironSword');
  assert(result.success === true, 'equip with multiple works');
  assert(result.player.inventory.ironSword === 2, 'only 1 removed from stack of 3');
}
{
  // Use last potion
  const player = makePlayer({ inventory: { potion: 1 }, hp: 50, maxHp: 100 });
  const result = useConsumable(player, 'potion');
  assert(result.success === true, 'use last potion succeeds');
  assert((result.player.inventory.potion || 0) === 0, 'potion count is 0 after using last');
}
{
  // handleInventoryAction with missing inventoryState
  const gs = { phase: 'inventory', player: makePlayer(), log: [] };
  const result = handleInventoryAction(gs, { type: 'CLOSE_INVENTORY' });
  assert(result.phase === 'exploration', 'works with missing inventoryState (defaults)');
}

// ===== EQUIPMENT_SLOTS constant =====
console.log('--- EQUIPMENT_SLOTS ---');
assert(EQUIPMENT_SLOTS.weapon === 'Weapon', 'weapon slot display name');
assert(EQUIPMENT_SLOTS.armor === 'Armor', 'armor slot display name');
assert(EQUIPMENT_SLOTS.accessory === 'Accessory', 'accessory slot display name');

// ===== Summary =====
console.log(`\n=== Inventory Management Tests: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
