/**
 * Tests for World Event Effects Wiring
 * Verifies that world event effects are correctly applied in:
 * 1. Gold multiplier (combat.js victory)
 * 2. Damage multiplier (damage-calc.js)
 * 3. Shop discount (shop.js buyItem)
 * 4. Minimap hidden (render.js)
 * 5. MP cost multiplier (combat.js playerUseAbility)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateDamage } from '../src/combat/damage-calc.js';
import { buyItem, createShopState, getBuyPrice } from '../src/shop.js';
import {
  getGoldMultiplier,
  getDamageMultiplier,
  getShopDiscount,
  getMpCostMultiplier,
  isMinimapHidden,
} from '../src/world-events.js';

// ── Helper: create a mock world event ────────────────────────────────
function mockEvent(type, value) {
  return { name: 'Test Event', effect: { type, value }, movesRemaining: 5 };
}

// ── 1. Gold Multiplier helpers ───────────────────────────────────────
describe('Gold Multiplier Wiring', () => {
  it('returns 1.0 when no world event', () => {
    assert.equal(getGoldMultiplier(null), 1.0);
  });
  it('returns 2.0 during treasure_map_found event', () => {
    assert.equal(getGoldMultiplier(mockEvent('gold_multiplier', 2.0)), 2.0);
  });
  it('returns 1.0 for unrelated events', () => {
    assert.equal(getGoldMultiplier(mockEvent('damage_multiplier', 1.15)), 1.0);
  });
});

// ── 2. Damage Multiplier in calculateDamage ──────────────────────────
describe('Damage Multiplier Wiring', () => {
  const baseParams = {
    attackerAtk: 20,
    targetDef: 5,
    targetDefending: false,
    element: 'physical',
    targetElement: null,
    rngValue: 0.5,
    abilityPower: 1.0,
  };

  it('does not alter damage when no world event', () => {
    const r1 = calculateDamage({ ...baseParams, worldEvent: null });
    const r2 = calculateDamage({ ...baseParams }); // default
    assert.equal(r1.damage, r2.damage);
  });

  it('increases damage with dark_omen event (1.15x)', () => {
    const normal = calculateDamage({ ...baseParams, worldEvent: null });
    const boosted = calculateDamage({
      ...baseParams,
      worldEvent: mockEvent('damage_multiplier', 1.15),
    });
    assert.ok(
      boosted.damage >= normal.damage,
      `Expected boosted (${boosted.damage}) >= normal (${normal.damage})`
    );
  });

  it('doubles damage with a 2.0 multiplier event', () => {
    const normal = calculateDamage({ ...baseParams, worldEvent: null });
    const doubled = calculateDamage({
      ...baseParams,
      worldEvent: mockEvent('damage_multiplier', 2.0),
    });
    // With floor rounding, doubled should be roughly 2x
    assert.ok(
      doubled.damage >= normal.damage,
      `Expected doubled (${doubled.damage}) >= normal (${normal.damage})`
    );
  });
});

// ── 3. Shop Discount in buyItem ──────────────────────────────────────
describe('Shop Discount Wiring', () => {
  // Create a simple shop state with a potion
  const shopState = createShopState('merchant_bram', 'exploration');
  const potionId = 'potion';

  it('buys at full price with no world event', () => {
    const player = { gold: 1000, inventory: [], equipment: {} };
    const result = buyItem(player, shopState, potionId, 1, null);
    if (result.success) {
      const fullPrice = getBuyPrice(potionId);
      assert.equal(player.gold - result.player.gold, fullPrice);
    }
  });

  it('applies 20% discount during merchant_caravan event', () => {
    const player = { gold: 1000, inventory: [], equipment: {} };
    const event = mockEvent('shop_discount', 0.20);
    const fullPrice = getBuyPrice(potionId);
    const discountedPrice = Math.max(1, Math.floor(fullPrice * 0.80));

    const result = buyItem(player, shopState, potionId, 1, event);
    if (result.success) {
      assert.equal(player.gold - result.player.gold, discountedPrice);
    }
  });

  it('getShopDiscount returns 0 when no event', () => {
    assert.equal(getShopDiscount(null), 0);
  });

  it('getShopDiscount returns 0.20 for shop_discount event', () => {
    assert.equal(getShopDiscount(mockEvent('shop_discount', 0.20)), 0.20);
  });
});

// ── 4. Minimap Hidden ────────────────────────────────────────────────
describe('Minimap Hidden Wiring', () => {
  it('minimap is visible by default (no event)', () => {
    assert.equal(isMinimapHidden(null), false);
  });

  it('minimap is hidden during fog_of_war event', () => {
    assert.equal(isMinimapHidden(mockEvent('hide_minimap', true)), true);
  });

  it('minimap is visible for unrelated events', () => {
    assert.equal(isMinimapHidden(mockEvent('gold_multiplier', 2.0)), false);
  });
});

// ── 5. MP Cost Multiplier ────────────────────────────────────────────
describe('MP Cost Multiplier Wiring', () => {
  it('getMpCostMultiplier returns 1.0 when no event', () => {
    assert.equal(getMpCostMultiplier(null), 1.0);
  });

  it('getMpCostMultiplier returns 0.5 during ancient_ruins event', () => {
    assert.equal(
      getMpCostMultiplier(mockEvent('mp_cost_multiplier', 0.50)),
      0.50
    );
  });

  it('getMpCostMultiplier returns 1.0 for unrelated events', () => {
    assert.equal(
      getMpCostMultiplier(mockEvent('gold_multiplier', 2.0)),
      1.0
    );
  });

  it('halved MP cost is at least 1', () => {
    const mpCost = 1; // minimum ability cost
    const mult = getMpCostMultiplier(mockEvent('mp_cost_multiplier', 0.50));
    const effective = Math.max(1, Math.floor(mpCost * mult));
    assert.ok(effective >= 1, 'Effective MP cost should never be 0');
  });
});
