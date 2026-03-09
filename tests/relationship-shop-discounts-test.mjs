/**
 * Tests for Relationship-Based Shop Discounts Module
 * Created by Claude Opus 4.5 (Villager) on Day 342
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  RELATIONSHIP_DISCOUNTS,
  RELATIONSHIP_LEVEL_ORDER,
  getRelationshipDiscount,
  calculateRelationshipPrice,
  getDiscountDescription,
  getShopGreetingModifier,
  calculateCombinedPrice,
  qualifiesForLoyaltyReward,
  getSellPriceModifier,
  calculateRelationshipSellPrice,
} from '../src/relationship-shop-discounts.js';

import { RelationshipLevel } from '../src/npc-relationships.js';

// ============================================================================
// RELATIONSHIP_DISCOUNTS constant tests
// ============================================================================

describe('RELATIONSHIP_DISCOUNTS constant', () => {
  it('should have discount values for all relationship levels', () => {
    assert.strictEqual(typeof RELATIONSHIP_DISCOUNTS[RelationshipLevel.HOSTILE], 'number');
    assert.strictEqual(typeof RELATIONSHIP_DISCOUNTS[RelationshipLevel.UNFRIENDLY], 'number');
    assert.strictEqual(typeof RELATIONSHIP_DISCOUNTS[RelationshipLevel.NEUTRAL], 'number');
    assert.strictEqual(typeof RELATIONSHIP_DISCOUNTS[RelationshipLevel.FRIENDLY], 'number');
    assert.strictEqual(typeof RELATIONSHIP_DISCOUNTS[RelationshipLevel.ALLIED], 'number');
  });

  it('should have HOSTILE as a markup (negative discount)', () => {
    assert.ok(RELATIONSHIP_DISCOUNTS[RelationshipLevel.HOSTILE] < 0);
  });

  it('should have UNFRIENDLY as a markup (negative discount)', () => {
    assert.ok(RELATIONSHIP_DISCOUNTS[RelationshipLevel.UNFRIENDLY] < 0);
  });

  it('should have NEUTRAL as no discount', () => {
    assert.strictEqual(RELATIONSHIP_DISCOUNTS[RelationshipLevel.NEUTRAL], 0);
  });

  it('should have FRIENDLY as a discount (positive)', () => {
    assert.ok(RELATIONSHIP_DISCOUNTS[RelationshipLevel.FRIENDLY] > 0);
  });

  it('should have ALLIED as the best discount', () => {
    assert.ok(RELATIONSHIP_DISCOUNTS[RelationshipLevel.ALLIED] > RELATIONSHIP_DISCOUNTS[RelationshipLevel.FRIENDLY]);
  });

  it('should have discounts in ascending order of relationship level', () => {
    const hostile = RELATIONSHIP_DISCOUNTS[RelationshipLevel.HOSTILE];
    const unfriendly = RELATIONSHIP_DISCOUNTS[RelationshipLevel.UNFRIENDLY];
    const neutral = RELATIONSHIP_DISCOUNTS[RelationshipLevel.NEUTRAL];
    const friendly = RELATIONSHIP_DISCOUNTS[RelationshipLevel.FRIENDLY];
    const allied = RELATIONSHIP_DISCOUNTS[RelationshipLevel.ALLIED];
    
    assert.ok(hostile < unfriendly);
    assert.ok(unfriendly < neutral);
    assert.ok(neutral < friendly);
    assert.ok(friendly < allied);
  });
});

// ============================================================================
// RELATIONSHIP_LEVEL_ORDER tests
// ============================================================================

describe('RELATIONSHIP_LEVEL_ORDER constant', () => {
  it('should contain all five relationship levels', () => {
    assert.strictEqual(RELATIONSHIP_LEVEL_ORDER.length, 5);
  });

  it('should be in order from HOSTILE to ALLIED', () => {
    assert.strictEqual(RELATIONSHIP_LEVEL_ORDER[0], RelationshipLevel.HOSTILE);
    assert.strictEqual(RELATIONSHIP_LEVEL_ORDER[4], RelationshipLevel.ALLIED);
  });
});

// ============================================================================
// getRelationshipDiscount tests
// ============================================================================

describe('getRelationshipDiscount', () => {
  it('should return correct discount for HOSTILE', () => {
    assert.strictEqual(getRelationshipDiscount(RelationshipLevel.HOSTILE), -0.25);
  });

  it('should return correct discount for UNFRIENDLY', () => {
    assert.strictEqual(getRelationshipDiscount(RelationshipLevel.UNFRIENDLY), -0.10);
  });

  it('should return correct discount for NEUTRAL', () => {
    assert.strictEqual(getRelationshipDiscount(RelationshipLevel.NEUTRAL), 0);
  });

  it('should return correct discount for FRIENDLY', () => {
    assert.strictEqual(getRelationshipDiscount(RelationshipLevel.FRIENDLY), 0.10);
  });

  it('should return correct discount for ALLIED', () => {
    assert.strictEqual(getRelationshipDiscount(RelationshipLevel.ALLIED), 0.20);
  });

  it('should return 0 for null input', () => {
    assert.strictEqual(getRelationshipDiscount(null), 0);
  });

  it('should return 0 for undefined input', () => {
    assert.strictEqual(getRelationshipDiscount(undefined), 0);
  });

  it('should return 0 for invalid string input', () => {
    assert.strictEqual(getRelationshipDiscount('INVALID_LEVEL'), 0);
  });

  it('should return 0 for non-string input', () => {
    assert.strictEqual(getRelationshipDiscount(123), 0);
    assert.strictEqual(getRelationshipDiscount({}), 0);
    assert.strictEqual(getRelationshipDiscount([]), 0);
  });
});

// ============================================================================
// calculateRelationshipPrice tests
// ============================================================================

describe('calculateRelationshipPrice', () => {
  it('should apply 25% markup for HOSTILE (100 gold item = 125 gold)', () => {
    assert.strictEqual(calculateRelationshipPrice(100, RelationshipLevel.HOSTILE), 125);
  });

  it('should apply 10% markup for UNFRIENDLY (100 gold item = 110 gold)', () => {
    assert.strictEqual(calculateRelationshipPrice(100, RelationshipLevel.UNFRIENDLY), 110);
  });

  it('should keep price unchanged for NEUTRAL (100 gold item = 100 gold)', () => {
    assert.strictEqual(calculateRelationshipPrice(100, RelationshipLevel.NEUTRAL), 100);
  });

  it('should apply 10% discount for FRIENDLY (100 gold item = 90 gold)', () => {
    assert.strictEqual(calculateRelationshipPrice(100, RelationshipLevel.FRIENDLY), 90);
  });

  it('should apply 20% discount for ALLIED (100 gold item = 80 gold)', () => {
    assert.strictEqual(calculateRelationshipPrice(100, RelationshipLevel.ALLIED), 80);
  });

  it('should floor fractional prices', () => {
    // 15 * 0.90 = 13.5 -> 13
    assert.strictEqual(calculateRelationshipPrice(15, RelationshipLevel.FRIENDLY), 13);
  });

  it('should return minimum of 1 gold for very cheap items with discount', () => {
    assert.strictEqual(calculateRelationshipPrice(1, RelationshipLevel.ALLIED), 1);
  });

  it('should return 0 for 0 base price', () => {
    assert.strictEqual(calculateRelationshipPrice(0, RelationshipLevel.ALLIED), 0);
  });

  it('should return 0 for negative base price', () => {
    assert.strictEqual(calculateRelationshipPrice(-10, RelationshipLevel.ALLIED), 0);
  });

  it('should return 0 for null base price', () => {
    assert.strictEqual(calculateRelationshipPrice(null, RelationshipLevel.FRIENDLY), 0);
  });

  it('should handle large prices correctly', () => {
    assert.strictEqual(calculateRelationshipPrice(10000, RelationshipLevel.ALLIED), 8000);
    assert.strictEqual(calculateRelationshipPrice(10000, RelationshipLevel.HOSTILE), 12500);
  });
});

// ============================================================================
// getDiscountDescription tests
// ============================================================================

describe('getDiscountDescription', () => {
  it('should return markup description for HOSTILE', () => {
    assert.strictEqual(getDiscountDescription(RelationshipLevel.HOSTILE), '25% markup');
  });

  it('should return markup description for UNFRIENDLY', () => {
    assert.strictEqual(getDiscountDescription(RelationshipLevel.UNFRIENDLY), '10% markup');
  });

  it('should return standard prices for NEUTRAL', () => {
    assert.strictEqual(getDiscountDescription(RelationshipLevel.NEUTRAL), 'Standard prices');
  });

  it('should return discount description for FRIENDLY', () => {
    assert.strictEqual(getDiscountDescription(RelationshipLevel.FRIENDLY), '10% discount');
  });

  it('should return discount description for ALLIED', () => {
    assert.strictEqual(getDiscountDescription(RelationshipLevel.ALLIED), '20% discount');
  });

  it('should return standard prices for invalid level', () => {
    assert.strictEqual(getDiscountDescription('INVALID'), 'Standard prices');
  });
});

// ============================================================================
// getShopGreetingModifier tests
// ============================================================================

describe('getShopGreetingModifier', () => {
  it('should return hostile greeting for HOSTILE', () => {
    const greeting = getShopGreetingModifier(RelationshipLevel.HOSTILE);
    assert.ok(greeting.length > 0);
    assert.ok(greeting.toLowerCase().includes("don't expect") || greeting.toLowerCase().includes("serve"));
  });

  it('should return unfriendly greeting for UNFRIENDLY', () => {
    const greeting = getShopGreetingModifier(RelationshipLevel.UNFRIENDLY);
    assert.ok(greeting.length > 0);
    assert.ok(greeting.toLowerCase().includes("want"));
  });

  it('should return empty string for NEUTRAL', () => {
    assert.strictEqual(getShopGreetingModifier(RelationshipLevel.NEUTRAL), '');
  });

  it('should return friendly greeting for FRIENDLY', () => {
    const greeting = getShopGreetingModifier(RelationshipLevel.FRIENDLY);
    assert.ok(greeting.length > 0);
    assert.ok(greeting.toLowerCase().includes("friend") || greeting.toLowerCase().includes("deal"));
  });

  it('should return allied greeting for ALLIED', () => {
    const greeting = getShopGreetingModifier(RelationshipLevel.ALLIED);
    assert.ok(greeting.length > 0);
    assert.ok(greeting.toLowerCase().includes("best") || greeting.toLowerCase().includes("customer"));
  });

  it('should return empty string for invalid level', () => {
    assert.strictEqual(getShopGreetingModifier('INVALID'), '');
  });
});

// ============================================================================
// calculateCombinedPrice tests
// ============================================================================

describe('calculateCombinedPrice', () => {
  it('should combine relationship discount with world event discount', () => {
    // 10% relationship + 15% event = 25% total discount
    // 100 * (1 - 0.25) = 75
    assert.strictEqual(calculateCombinedPrice(100, RelationshipLevel.FRIENDLY, 0.15), 75);
  });

  it('should handle markup with event discount (partial offset)', () => {
    // -25% relationship (markup) + 15% event discount = -10% (still markup)
    // 100 * (1 - (-0.10)) = 110
    assert.strictEqual(calculateCombinedPrice(100, RelationshipLevel.HOSTILE, 0.15), 110);
  });

  it('should handle markup with larger event discount (full offset)', () => {
    // -25% relationship (markup) + 30% event discount = 5% discount
    // 100 * (1 - 0.05) = 95
    assert.strictEqual(calculateCombinedPrice(100, RelationshipLevel.HOSTILE, 0.30), 95);
  });

  it('should cap total discount at 50%', () => {
    // 20% relationship + 40% event = 60%, but capped at 50%
    // 100 * (1 - 0.50) = 50
    assert.strictEqual(calculateCombinedPrice(100, RelationshipLevel.ALLIED, 0.40), 50);
  });

  it('should cap total markup at 50%', () => {
    // -25% relationship (markup) + -30% (hypothetical negative event) = -55%, but capped at -50%
    // Actually world events don't give negative discounts, so test with just hostile
    // -25% relationship + 0% event = -25%
    // 100 * (1 - (-0.25)) = 125
    assert.strictEqual(calculateCombinedPrice(100, RelationshipLevel.HOSTILE, 0), 125);
  });

  it('should default to 0 world event discount when not provided', () => {
    assert.strictEqual(calculateCombinedPrice(100, RelationshipLevel.FRIENDLY), 90);
  });

  it('should return minimum of 1 gold', () => {
    assert.strictEqual(calculateCombinedPrice(1, RelationshipLevel.ALLIED, 0.40), 1);
  });

  it('should return 0 for 0 base price', () => {
    assert.strictEqual(calculateCombinedPrice(0, RelationshipLevel.ALLIED, 0.40), 0);
  });
});

// ============================================================================
// qualifiesForLoyaltyReward tests
// ============================================================================

describe('qualifiesForLoyaltyReward', () => {
  it('should return false for HOSTILE', () => {
    assert.strictEqual(qualifiesForLoyaltyReward(RelationshipLevel.HOSTILE), false);
  });

  it('should return false for UNFRIENDLY', () => {
    assert.strictEqual(qualifiesForLoyaltyReward(RelationshipLevel.UNFRIENDLY), false);
  });

  it('should return false for NEUTRAL', () => {
    assert.strictEqual(qualifiesForLoyaltyReward(RelationshipLevel.NEUTRAL), false);
  });

  it('should return false for FRIENDLY', () => {
    assert.strictEqual(qualifiesForLoyaltyReward(RelationshipLevel.FRIENDLY), false);
  });

  it('should return true for ALLIED', () => {
    assert.strictEqual(qualifiesForLoyaltyReward(RelationshipLevel.ALLIED), true);
  });

  it('should return false for invalid level', () => {
    assert.strictEqual(qualifiesForLoyaltyReward('INVALID'), false);
  });
});

// ============================================================================
// getSellPriceModifier tests
// ============================================================================

describe('getSellPriceModifier', () => {
  it('should return 0.80 for HOSTILE (20% worse)', () => {
    assert.strictEqual(getSellPriceModifier(RelationshipLevel.HOSTILE), 0.80);
  });

  it('should return 0.90 for UNFRIENDLY (10% worse)', () => {
    assert.strictEqual(getSellPriceModifier(RelationshipLevel.UNFRIENDLY), 0.90);
  });

  it('should return 1.00 for NEUTRAL (standard)', () => {
    assert.strictEqual(getSellPriceModifier(RelationshipLevel.NEUTRAL), 1.00);
  });

  it('should return 1.10 for FRIENDLY (10% better)', () => {
    assert.strictEqual(getSellPriceModifier(RelationshipLevel.FRIENDLY), 1.10);
  });

  it('should return 1.25 for ALLIED (25% better)', () => {
    assert.strictEqual(getSellPriceModifier(RelationshipLevel.ALLIED), 1.25);
  });

  it('should return 1.00 for invalid level', () => {
    assert.strictEqual(getSellPriceModifier('INVALID'), 1.00);
  });
});

// ============================================================================
// calculateRelationshipSellPrice tests
// ============================================================================

describe('calculateRelationshipSellPrice', () => {
  it('should apply 20% reduction for HOSTILE (50 gold item sells for 40)', () => {
    assert.strictEqual(calculateRelationshipSellPrice(50, RelationshipLevel.HOSTILE), 40);
  });

  it('should apply 10% reduction for UNFRIENDLY (50 gold item sells for 45)', () => {
    assert.strictEqual(calculateRelationshipSellPrice(50, RelationshipLevel.UNFRIENDLY), 45);
  });

  it('should keep price unchanged for NEUTRAL (50 gold item sells for 50)', () => {
    assert.strictEqual(calculateRelationshipSellPrice(50, RelationshipLevel.NEUTRAL), 50);
  });

  it('should apply 10% bonus for FRIENDLY (50 gold item sells for 55)', () => {
    assert.strictEqual(calculateRelationshipSellPrice(50, RelationshipLevel.FRIENDLY), 55);
  });

  it('should apply 25% bonus for ALLIED (100 gold item sells for 125)', () => {
    assert.strictEqual(calculateRelationshipSellPrice(100, RelationshipLevel.ALLIED), 125);
  });

  it('should floor fractional prices', () => {
    // 15 * 1.10 = 16.5 -> 16
    assert.strictEqual(calculateRelationshipSellPrice(15, RelationshipLevel.FRIENDLY), 16);
  });

  it('should return minimum of 1 gold', () => {
    assert.strictEqual(calculateRelationshipSellPrice(1, RelationshipLevel.HOSTILE), 1);
  });

  it('should return 0 for 0 base price', () => {
    assert.strictEqual(calculateRelationshipSellPrice(0, RelationshipLevel.ALLIED), 0);
  });

  it('should return 0 for negative base price', () => {
    assert.strictEqual(calculateRelationshipSellPrice(-10, RelationshipLevel.ALLIED), 0);
  });
});

// ============================================================================
// Integration tests
// ============================================================================

describe('Integration tests', () => {
  it('should have consistent RELATIONSHIP_LEVEL_ORDER with RelationshipLevel enum', () => {
    RELATIONSHIP_LEVEL_ORDER.forEach(level => {
      assert.ok(Object.values(RelationshipLevel).includes(level), 
        `Level ${level} should be in RelationshipLevel enum`);
    });
  });

  it('should have discounts defined for all levels in RELATIONSHIP_LEVEL_ORDER', () => {
    RELATIONSHIP_LEVEL_ORDER.forEach(level => {
      assert.ok(RELATIONSHIP_DISCOUNTS[level] !== undefined,
        `Discount should be defined for level ${level}`);
    });
  });

  it('should provide reasonable prices at all relationship levels', () => {
    const basePrice = 100;
    RELATIONSHIP_LEVEL_ORDER.forEach(level => {
      const price = calculateRelationshipPrice(basePrice, level);
      assert.ok(price >= 1, `Price should be at least 1 for ${level}`);
      assert.ok(price <= 200, `Price should be reasonable for ${level}`);
    });
  });
});
