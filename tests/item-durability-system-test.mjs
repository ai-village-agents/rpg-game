/**
 * Item Durability System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  DURABILITY_STATUS,
  SLOT_DURABILITY_RATES,
  MATERIAL_DURABILITY,
  REPAIR_ITEMS,
  initDurabilityState,
  getDurabilityState,
  calculateMaxDurability,
  getQualityMultiplier,
  initItemDurability,
  getItemDurability,
  getDurabilityStatus,
  getDurabilityStatModifier,
  isItemBroken,
  hasTemporaryProtection,
  reduceDurability,
  processCombatDurabilityLoss,
  processToolDurabilityLoss,
  repairItem,
  fullyRepairItem,
  calculateRepairCost,
  useRepairItem,
  repairAllEquipped,
  getItemsNeedingRepair,
  getDurabilityWarnings,
  updateDurabilitySettings,
  getDurabilityStats,
  cleanupExpiredProtections,
  removeItemDurability
} from '../src/item-durability-system.js';

import {
  renderDurabilityBar,
  renderDurabilityIndicator,
  renderEquipmentDurabilityPanel,
  renderRepairPanel,
  renderDurabilityWarnings,
  renderBrokenEquipmentNotification,
  renderDurabilitySettingsPanel,
  renderDurabilityStatsPanel,
  renderRepairAllButton,
  renderDurabilityTooltip,
  renderCombatDurabilityLog,
  getDurabilityStyles
} from '../src/item-durability-system-ui.js';

describe('Item Durability System', () => {
  let state;
  const testItem = {
    id: 'test_sword',
    name: 'Test Sword',
    material: 'iron',
    quality: 'common',
    level: 1
  };

  beforeEach(() => {
    state = {
      player: { name: 'TestHero', gold: 5000 },
      durability: initDurabilityState()
    };
  });

  describe('Constants and Definitions', () => {
    it('has durability statuses defined', () => {
      assert.ok(DURABILITY_STATUS.PRISTINE);
      assert.ok(DURABILITY_STATUS.GOOD);
      assert.ok(DURABILITY_STATUS.WORN);
      assert.ok(DURABILITY_STATUS.DAMAGED);
      assert.ok(DURABILITY_STATUS.BROKEN);
    });

    it('has slot durability rates defined', () => {
      assert.ok(SLOT_DURABILITY_RATES.weapon);
      assert.ok(SLOT_DURABILITY_RATES.helmet);
      assert.ok(SLOT_DURABILITY_RATES.chest);
      assert.ok(SLOT_DURABILITY_RATES.shield);
    });

    it('has material durability defined', () => {
      assert.ok(MATERIAL_DURABILITY.cloth);
      assert.ok(MATERIAL_DURABILITY.leather);
      assert.ok(MATERIAL_DURABILITY.plate);
      assert.ok(MATERIAL_DURABILITY.mythril);
    });

    it('has repair items defined', () => {
      assert.ok(REPAIR_ITEMS.repair_kit_basic);
      assert.ok(REPAIR_ITEMS.repair_kit_advanced);
      assert.ok(REPAIR_ITEMS.repair_kit_master);
    });

    it('statuses have decreasing stat modifiers', () => {
      assert.ok(DURABILITY_STATUS.PRISTINE.statMod >= DURABILITY_STATUS.GOOD.statMod);
      assert.ok(DURABILITY_STATUS.GOOD.statMod >= DURABILITY_STATUS.WORN.statMod);
      assert.ok(DURABILITY_STATUS.WORN.statMod >= DURABILITY_STATUS.DAMAGED.statMod);
      assert.ok(DURABILITY_STATUS.DAMAGED.statMod >= DURABILITY_STATUS.BROKEN.statMod);
    });

    it('materials have varying max durability', () => {
      assert.ok(MATERIAL_DURABILITY.cloth.maxDurability < MATERIAL_DURABILITY.plate.maxDurability);
      assert.ok(MATERIAL_DURABILITY.plate.maxDurability < MATERIAL_DURABILITY.dragonscale.maxDurability);
    });
  });

  describe('State Initialization', () => {
    it('initializes empty durability state', () => {
      const durabilityState = initDurabilityState();
      assert.deepStrictEqual(durabilityState.itemDurabilities, {});
      assert.deepStrictEqual(durabilityState.temporaryProtections, {});
      assert.deepStrictEqual(durabilityState.repairHistory, []);
      assert.strictEqual(durabilityState.totalRepairCost, 0);
    });

    it('has default settings', () => {
      const durabilityState = initDurabilityState();
      assert.strictEqual(durabilityState.durabilitySettings.enabled, true);
      assert.strictEqual(durabilityState.durabilitySettings.showWarnings, true);
    });

    it('gets durability state from game state', () => {
      const durabilityState = getDurabilityState(state);
      assert.ok(durabilityState);
      assert.ok(durabilityState.durabilitySettings);
    });

    it('returns default state if durability not present', () => {
      const durabilityState = getDurabilityState({});
      assert.ok(durabilityState);
      assert.deepStrictEqual(durabilityState.itemDurabilities, {});
    });
  });

  describe('Max Durability Calculation', () => {
    it('calculates max durability based on material', () => {
      const ironItem = { material: 'iron', quality: 'common' };
      const clothItem = { material: 'cloth', quality: 'common' };
      assert.ok(calculateMaxDurability(ironItem) > calculateMaxDurability(clothItem));
    });

    it('calculates max durability based on quality', () => {
      const commonItem = { material: 'iron', quality: 'common' };
      const rareItem = { material: 'iron', quality: 'rare' };
      assert.ok(calculateMaxDurability(rareItem) > calculateMaxDurability(commonItem));
    });

    it('uses iron as default material', () => {
      const noMaterialItem = { quality: 'common' };
      const ironItem = { material: 'iron', quality: 'common' };
      assert.strictEqual(calculateMaxDurability(noMaterialItem), calculateMaxDurability(ironItem));
    });

    it('gets quality multipliers', () => {
      assert.strictEqual(getQualityMultiplier('common'), 1.0);
      assert.ok(getQualityMultiplier('legendary') > getQualityMultiplier('common'));
    });
  });

  describe('Item Durability Initialization', () => {
    it('initializes durability for an item', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      assert.ok(result.initialized);
      assert.ok(result.maxDurability > 0);
    });

    it('sets current durability to max', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      assert.strictEqual(durability.current, durability.max);
    });

    it('fails to initialize twice', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = initItemDurability(result.state, 'test_sword', testItem);
      assert.ok(!result.initialized);
      assert.strictEqual(result.error, 'Durability already initialized');
    });
  });

  describe('Durability Status', () => {
    it('gets durability status', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const { status, percent } = getDurabilityStatus(result.state, 'test_sword');
      assert.ok(status);
      assert.strictEqual(status.id, 'pristine');
      assert.strictEqual(percent, 100);
    });

    it('returns null status for unknown item', () => {
      const { status, percent } = getDurabilityStatus(state, 'unknown');
      assert.strictEqual(status, null);
      assert.strictEqual(percent, 0);
    });

    it('gets correct status at different durability levels', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');

      // Reduce to worn level
      const wornAmount = durability.max - (durability.max * 0.4);
      result = reduceDurability(result.state, 'test_sword', wornAmount);
      const { status } = getDurabilityStatus(result.state, 'test_sword');
      assert.strictEqual(status.id, 'worn');
    });
  });

  describe('Stat Modifiers', () => {
    it('returns 1.0 for pristine items', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const mod = getDurabilityStatModifier(result.state, 'test_sword');
      assert.strictEqual(mod, 1.0);
    });

    it('returns 0 for broken items', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      result = reduceDurability(result.state, 'test_sword', durability.max + 10);
      const mod = getDurabilityStatModifier(result.state, 'test_sword');
      assert.strictEqual(mod, 0);
    });

    it('returns 0 for unknown items', () => {
      const mod = getDurabilityStatModifier(state, 'unknown');
      assert.strictEqual(mod, 0);
    });
  });

  describe('Durability Reduction', () => {
    it('reduces durability', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 10);
      assert.ok(result.reduced);
      const durability = getItemDurability(result.state, 'test_sword');
      assert.strictEqual(durability.current, durability.max - 10);
    });

    it('cannot reduce below zero', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 9999);
      const durability = getItemDurability(result.state, 'test_sword');
      assert.strictEqual(durability.current, 0);
    });

    it('tracks when item breaks', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      result = reduceDurability(result.state, 'test_sword', durability.max + 10);
      assert.ok(result.justBroke);
    });

    it('fails for unknown item', () => {
      const result = reduceDurability(state, 'unknown', 10);
      assert.ok(!result.reduced);
      assert.strictEqual(result.error, 'Item has no durability data');
    });

    it('respects temporary protection', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      // Add protection
      result.state.durability.temporaryProtections['test_sword'] = {
        expiresAt: Date.now() + 60000
      };
      result = reduceDurability(result.state, 'test_sword', 10);
      assert.ok(!result.reduced);
      assert.ok(result.protected);
    });

    it('respects disabled setting', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result.state.durability.durabilitySettings.enabled = false;
      result = reduceDurability(result.state, 'test_sword', 10);
      assert.ok(!result.reduced);
      assert.ok(result.disabled);
    });
  });

  describe('Broken Item Check', () => {
    it('returns false for non-broken item', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      assert.ok(!isItemBroken(result.state, 'test_sword'));
    });

    it('returns true for broken item', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      result = reduceDurability(result.state, 'test_sword', durability.max);
      assert.ok(isItemBroken(result.state, 'test_sword'));
    });

    it('returns false for unknown item', () => {
      assert.ok(!isItemBroken(state, 'unknown'));
    });
  });

  describe('Combat Durability Loss', () => {
    it('processes combat durability loss', () => {
      let result = initItemDurability(state, 'test_weapon', { ...testItem, id: 'test_weapon' });
      result = initItemDurability(result.state, 'test_chest', { ...testItem, id: 'test_chest' });

      const equippedItems = { weapon: 'test_weapon', chest: 'test_chest' };
      const combatResult = processCombatDurabilityLoss(result.state, equippedItems, { wasHit: true });

      assert.ok(combatResult.damages.length > 0);
    });

    it('damages armor more when hit', () => {
      let result = initItemDurability(state, 'test_chest', { ...testItem, id: 'test_chest' });

      const equippedItems = { chest: 'test_chest' };
      const noHitResult = processCombatDurabilityLoss(result.state, equippedItems, { wasHit: false });
      const hitResult = processCombatDurabilityLoss(result.state, equippedItems, { wasHit: true });

      const noHitLoss = noHitResult.damages.find(d => d.slot === 'chest')?.loss || 0;
      const hitLoss = hitResult.damages.find(d => d.slot === 'chest')?.loss || 0;
      assert.ok(hitLoss > noHitLoss);
    });
  });

  describe('Tool Durability Loss', () => {
    it('processes tool durability loss', () => {
      const tool = { material: 'iron', quality: 'common' };
      let result = initItemDurability(state, 'test_tool', tool);
      result = processToolDurabilityLoss(result.state, 'test_tool', tool);
      assert.ok(result.reduced);
    });
  });

  describe('Repair', () => {
    it('repairs an item', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      result = repairItem(result.state, 'test_sword', 25);
      assert.ok(result.repaired);
      assert.strictEqual(result.amountRepaired, 25);
    });

    it('cannot repair above max', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 10);
      result = repairItem(result.state, 'test_sword', 100);
      const durability = getItemDurability(result.state, 'test_sword');
      assert.strictEqual(durability.current, durability.max);
    });

    it('cannot repair full durability item', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const repairResult = repairItem(result.state, 'test_sword', 10);
      assert.ok(!repairResult.repaired);
      assert.strictEqual(repairResult.error, 'Item is already at full durability');
    });

    it('tracks repair in history', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      result = repairItem(result.state, 'test_sword', 25, { cost: 100, source: 'test' });
      assert.strictEqual(result.state.durability.repairHistory.length, 1);
      assert.strictEqual(result.state.durability.totalRepairCost, 100);
    });
  });

  describe('Full Repair', () => {
    it('fully repairs an item', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      result = fullyRepairItem(result.state, 'test_sword', testItem);
      assert.ok(result.repaired);
      const durability = getItemDurability(result.state, 'test_sword');
      assert.strictEqual(durability.current, durability.max);
    });

    it('deducts gold', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      const beforeGold = result.state.player.gold;
      result = fullyRepairItem(result.state, 'test_sword', testItem);
      assert.ok(result.state.player.gold < beforeGold);
    });

    it('fails with insufficient gold', () => {
      state.player.gold = 0;
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      result = fullyRepairItem(result.state, 'test_sword', testItem);
      assert.ok(!result.repaired);
      assert.strictEqual(result.error, 'Not enough gold');
    });
  });

  describe('Repair Cost Calculation', () => {
    it('calculates repair cost', () => {
      const cost = calculateRepairCost(testItem, 50);
      assert.ok(cost > 0);
    });

    it('higher level items cost more', () => {
      const lowLevelCost = calculateRepairCost({ ...testItem, level: 1 }, 50);
      const highLevelCost = calculateRepairCost({ ...testItem, level: 50 }, 50);
      assert.ok(highLevelCost > lowLevelCost);
    });

    it('expensive materials cost more', () => {
      const ironCost = calculateRepairCost({ ...testItem, material: 'iron' }, 50);
      const mythrilCost = calculateRepairCost({ ...testItem, material: 'mythril' }, 50);
      assert.ok(mythrilCost > ironCost);
    });
  });

  describe('Repair Items', () => {
    it('uses repair item', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      result = useRepairItem(result.state, 'repair_kit_basic', 'test_sword', testItem);
      assert.ok(result.repaired || result.used);
    });

    it('fails for invalid repair item', () => {
      const result = useRepairItem(state, 'invalid', 'test_sword', testItem);
      assert.ok(!result.used);
      assert.strictEqual(result.error, 'Invalid repair item');
    });

    it('respects quality restrictions', () => {
      const legendaryItem = { ...testItem, quality: 'legendary' };
      let result = initItemDurability(state, 'test_legendary', legendaryItem);
      result = reduceDurability(result.state, 'test_legendary', 50);
      result = useRepairItem(result.state, 'repair_kit_basic', 'test_legendary', legendaryItem);
      assert.ok(!result.used);
      assert.strictEqual(result.error, 'Repair item cannot repair this quality');
    });

    it('applies temporary protection', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = useRepairItem(result.state, 'indestructible_oil', 'test_sword', testItem);
      assert.ok(result.used);
      assert.ok(result.protected);
      assert.ok(hasTemporaryProtection(result.state, 'test_sword'));
    });
  });

  describe('Repair All', () => {
    it('repairs all equipped items', () => {
      let currentState = state;
      const equippedItems = {};
      const itemsData = {};

      for (const slot of ['weapon', 'chest', 'helmet']) {
        const itemId = `test_${slot}`;
        const item = { ...testItem, id: itemId };
        const result = initItemDurability(currentState, itemId, item);
        currentState = reduceDurability(result.state, itemId, 30).state;
        equippedItems[slot] = itemId;
        itemsData[itemId] = item;
      }

      const result = repairAllEquipped(currentState, equippedItems, itemsData);
      assert.ok(result.itemsRepaired > 0);
    });
  });

  describe('Items Needing Repair', () => {
    it('gets items needing repair', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      const equippedItems = { weapon: 'test_sword' };
      const needsRepair = getItemsNeedingRepair(result.state, equippedItems);
      assert.ok(needsRepair.length > 0);
    });

    it('marks urgent items', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      result = reduceDurability(result.state, 'test_sword', durability.max - 5);
      const equippedItems = { weapon: 'test_sword' };
      const needsRepair = getItemsNeedingRepair(result.state, equippedItems);
      assert.ok(needsRepair[0].urgent);
    });
  });

  describe('Durability Warnings', () => {
    it('gets durability warnings', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      result = reduceDurability(result.state, 'test_sword', durability.max - 10);
      const equippedItems = { weapon: 'test_sword' };
      const warnings = getDurabilityWarnings(result.state, equippedItems);
      assert.ok(warnings.length > 0);
    });

    it('respects warning setting', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 90);
      result.state.durability.durabilitySettings.showWarnings = false;
      const equippedItems = { weapon: 'test_sword' };
      const warnings = getDurabilityWarnings(result.state, equippedItems);
      assert.strictEqual(warnings.length, 0);
    });
  });

  describe('Settings', () => {
    it('updates durability settings', () => {
      const result = updateDurabilitySettings(state, { warningThreshold: 30 });
      assert.ok(result.updated);
      assert.strictEqual(result.state.durability.durabilitySettings.warningThreshold, 30);
    });
  });

  describe('Statistics', () => {
    it('gets durability statistics', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const stats = getDurabilityStats(result.state);
      assert.strictEqual(stats.itemCount, 1);
      assert.strictEqual(stats.brokenCount, 0);
    });
  });

  describe('Cleanup', () => {
    it('cleans up expired protections', () => {
      state.durability.temporaryProtections['test_sword'] = {
        expiresAt: Date.now() - 1000
      };
      const result = cleanupExpiredProtections(state);
      assert.strictEqual(result.cleaned, 1);
      assert.ok(!result.state.durability.temporaryProtections['test_sword']);
    });

    it('removes item durability', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = removeItemDurability(result.state, 'test_sword');
      assert.ok(result.removed);
      assert.ok(!getItemDurability(result.state, 'test_sword'));
    });
  });
});

describe('Item Durability System UI', () => {
  let state;
  const testItem = {
    id: 'test_sword',
    name: 'Test Sword',
    material: 'iron',
    quality: 'common',
    level: 1
  };

  beforeEach(() => {
    state = {
      player: { name: 'TestHero', gold: 5000 },
      durability: initDurabilityState()
    };
  });

  describe('Durability Bar Rendering', () => {
    it('renders durability bar', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const html = renderDurabilityBar(result.state, 'test_sword');
      assert.ok(html.includes('durability-bar'));
      assert.ok(html.includes('bar-fill'));
    });

    it('renders no durability for unknown item', () => {
      const html = renderDurabilityBar(state, 'unknown');
      assert.ok(html.includes('no-durability'));
    });

    it('renders compact bar', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const html = renderDurabilityBar(result.state, 'test_sword', { compact: true });
      assert.ok(html.includes('compact'));
    });

    it('shows protected indicator', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result.state.durability.temporaryProtections['test_sword'] = {
        expiresAt: Date.now() + 60000
      };
      const html = renderDurabilityBar(result.state, 'test_sword');
      assert.ok(html.includes('protected'));
    });
  });

  describe('Durability Indicator Rendering', () => {
    it('renders durability indicator', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const html = renderDurabilityIndicator(result.state, 'test_sword');
      assert.ok(html.includes('durability-indicator'));
    });

    it('returns empty for unknown item', () => {
      const html = renderDurabilityIndicator(state, 'unknown');
      assert.strictEqual(html, '');
    });
  });

  describe('Equipment Panel Rendering', () => {
    it('renders equipment durability panel', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const equippedItems = { weapon: 'test_sword' };
      const itemsData = { test_sword: testItem };
      const html = renderEquipmentDurabilityPanel(result.state, equippedItems, itemsData);
      assert.ok(html.includes('equipment-durability-panel'));
      assert.ok(html.includes('Test Sword'));
    });

    it('shows empty slots', () => {
      const html = renderEquipmentDurabilityPanel(state, {}, {});
      assert.ok(html.includes('empty'));
    });
  });

  describe('Repair Panel Rendering', () => {
    it('renders repair panel', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      const html = renderRepairPanel(result.state, 'test_sword', testItem);
      assert.ok(html.includes('repair-panel'));
      assert.ok(html.includes('Full Repair'));
    });

    it('shows fully repaired message', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const html = renderRepairPanel(result.state, 'test_sword', testItem);
      assert.ok(html.includes('full durability'));
    });
  });

  describe('Warnings Rendering', () => {
    it('renders durability warnings', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      const durability = getItemDurability(result.state, 'test_sword');
      result = reduceDurability(result.state, 'test_sword', durability.max - 10);
      const equippedItems = { weapon: 'test_sword' };
      const html = renderDurabilityWarnings(result.state, equippedItems);
      assert.ok(html.includes('durability-warnings'));
    });

    it('returns empty when no warnings', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const equippedItems = { weapon: 'test_sword' };
      const html = renderDurabilityWarnings(result.state, equippedItems);
      assert.strictEqual(html, '');
    });
  });

  describe('Broken Equipment Notification', () => {
    it('renders broken equipment notification', () => {
      const brokenItems = [{ slot: 'weapon', itemId: 'test_sword' }];
      const itemsData = { test_sword: testItem };
      const html = renderBrokenEquipmentNotification(brokenItems, itemsData);
      assert.ok(html.includes('broken-equipment-notification'));
      assert.ok(html.includes('Test Sword'));
    });

    it('returns empty for no broken items', () => {
      const html = renderBrokenEquipmentNotification([], {});
      assert.strictEqual(html, '');
    });
  });

  describe('Settings Panel Rendering', () => {
    it('renders durability settings panel', () => {
      const html = renderDurabilitySettingsPanel(state);
      assert.ok(html.includes('durability-settings-panel'));
      assert.ok(html.includes('Enable Durability'));
    });
  });

  describe('Stats Panel Rendering', () => {
    it('renders durability stats panel', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const html = renderDurabilityStatsPanel(result.state);
      assert.ok(html.includes('durability-stats-panel'));
      assert.ok(html.includes('Tracked Items'));
    });
  });

  describe('Repair All Button Rendering', () => {
    it('renders repair all button', () => {
      let result = initItemDurability(state, 'test_sword', testItem);
      result = reduceDurability(result.state, 'test_sword', 50);
      const equippedItems = { weapon: 'test_sword' };
      const itemsData = { test_sword: testItem };
      const html = renderRepairAllButton(result.state, equippedItems, itemsData);
      assert.ok(html.includes('repair-all'));
    });

    it('shows full durability message', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const equippedItems = { weapon: 'test_sword' };
      const itemsData = { test_sword: testItem };
      const html = renderRepairAllButton(result.state, equippedItems, itemsData);
      assert.ok(html.includes('full durability'));
    });
  });

  describe('Tooltip Rendering', () => {
    it('renders durability tooltip', () => {
      const result = initItemDurability(state, 'test_sword', testItem);
      const html = renderDurabilityTooltip(result.state, 'test_sword', testItem);
      assert.ok(html.includes('durability-tooltip'));
      assert.ok(html.includes('iron'));
    });

    it('returns empty for unknown item', () => {
      const html = renderDurabilityTooltip(state, 'unknown', testItem);
      assert.strictEqual(html, '');
    });
  });

  describe('Combat Log Rendering', () => {
    it('renders combat durability log', () => {
      const damages = [
        { slot: 'weapon', itemId: 'test_sword', loss: 1.5, justBroke: false }
      ];
      const itemsData = { test_sword: testItem };
      const html = renderCombatDurabilityLog(damages, itemsData);
      assert.ok(html.includes('combat-durability-log'));
      assert.ok(html.includes('Test Sword'));
    });

    it('returns empty for no damages', () => {
      const html = renderCombatDurabilityLog([], {});
      assert.strictEqual(html, '');
    });

    it('marks broken items', () => {
      const damages = [
        { slot: 'weapon', itemId: 'test_sword', loss: 100, justBroke: true }
      ];
      const itemsData = { test_sword: testItem };
      const html = renderCombatDurabilityLog(damages, itemsData);
      assert.ok(html.includes('BROKE'));
    });
  });

  describe('CSS Styles', () => {
    it('returns CSS styles', () => {
      const css = getDurabilityStyles();
      assert.ok(css.includes('.durability-bar'));
      assert.ok(css.includes('.broken'));
      assert.ok(css.includes('.protected'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes HTML in item names', () => {
      const maliciousItem = { ...testItem, name: '<script>alert("xss")</script>' };
      const result = initItemDurability(state, 'test_sword', maliciousItem);
      const html = renderRepairPanel(result.state, 'test_sword', maliciousItem);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});

describe('Item Durability Integration', () => {
  let state;
  const testItem = {
    id: 'test_sword',
    name: 'Test Sword',
    material: 'iron',
    quality: 'common',
    level: 1
  };

  beforeEach(() => {
    state = {
      player: { name: 'TestHero', gold: 5000 },
      durability: initDurabilityState()
    };
  });

  it('handles full durability lifecycle', () => {
    // Initialize
    let result = initItemDurability(state, 'test_sword', testItem);
    assert.ok(result.initialized);

    // Use and degrade
    result = reduceDurability(result.state, 'test_sword', 50);
    assert.ok(result.reduced);

    // Repair
    result = repairItem(result.state, 'test_sword', 25);
    assert.ok(result.repaired);

    // Full repair
    result = fullyRepairItem(result.state, 'test_sword', testItem);
    assert.ok(result.repaired);

    // Verify full durability
    const durability = getItemDurability(result.state, 'test_sword');
    assert.strictEqual(durability.current, durability.max);
  });

  it('maintains immutable state', () => {
    const originalState = { ...state };
    initItemDurability(state, 'test_sword', testItem);
    assert.deepStrictEqual(state.durability, originalState.durability);
  });
});
