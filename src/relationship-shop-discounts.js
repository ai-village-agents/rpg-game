/**
 * Relationship-Based Shop Discounts Module
 * Calculates shop discounts (or markups) based on NPC relationship levels.
 * Integrates with NPCRelationshipManager from npc-relationships.js
 * 
 * Created by Claude Opus 4.5 (Villager) on Day 342
 */

import { RelationshipLevel } from './npc-relationships.js';

/**
 * Discount/markup percentages for each relationship level.
 * Positive values = discount, negative values = markup (higher prices)
 */
export const RELATIONSHIP_DISCOUNTS = {
  [RelationshipLevel.HOSTILE]: -0.25,    // 25% markup - they don't like you
  [RelationshipLevel.UNFRIENDLY]: -0.10, // 10% markup - slight distrust
  [RelationshipLevel.NEUTRAL]: 0,         // No discount - standard prices
  [RelationshipLevel.FRIENDLY]: 0.10,     // 10% discount - friend pricing
  [RelationshipLevel.ALLIED]: 0.20,       // 20% discount - best friend pricing
};

/**
 * Relationship level order for comparison operations.
 * Matches the order in npc-relationships.js
 */
export const RELATIONSHIP_LEVEL_ORDER = [
  RelationshipLevel.HOSTILE,
  RelationshipLevel.UNFRIENDLY,
  RelationshipLevel.NEUTRAL,
  RelationshipLevel.FRIENDLY,
  RelationshipLevel.ALLIED,
];

/**
 * Get the discount/markup multiplier for a given relationship level.
 * Returns the raw discount value (e.g., 0.10 for 10% discount, -0.25 for 25% markup)
 * 
 * @param {string} relationshipLevel - The relationship level (e.g., 'FRIENDLY')
 * @returns {number} Discount value (-1 to 1, positive = discount, negative = markup)
 */
export function getRelationshipDiscount(relationshipLevel) {
  if (!relationshipLevel || typeof relationshipLevel !== 'string') {
    return 0; // Default to no discount for invalid input
  }
  
  const discount = RELATIONSHIP_DISCOUNTS[relationshipLevel];
  return discount !== undefined ? discount : 0;
}

/**
 * Calculate the final price for an item considering relationship discount.
 * 
 * @param {number} basePrice - The base price of the item
 * @param {string} relationshipLevel - The relationship level with the shop NPC
 * @returns {number} The adjusted price (minimum 1 gold)
 */
export function calculateRelationshipPrice(basePrice, relationshipLevel) {
  if (!basePrice || basePrice <= 0) return 0;
  
  const discount = getRelationshipDiscount(relationshipLevel);
  // Discount is subtracted, so -0.25 becomes +0.25 (markup)
  const adjustedPrice = Math.floor(basePrice * (1 - discount));
  
  // Minimum price is 1 gold
  return Math.max(1, adjustedPrice);
}

/**
 * Get a human-readable description of the price modifier.
 * 
 * @param {string} relationshipLevel - The relationship level
 * @returns {string} Description (e.g., "10% discount", "25% markup")
 */
export function getDiscountDescription(relationshipLevel) {
  const discount = getRelationshipDiscount(relationshipLevel);
  
  if (discount === 0) {
    return 'Standard prices';
  } else if (discount > 0) {
    return `${Math.round(discount * 100)}% discount`;
  } else {
    return `${Math.round(Math.abs(discount) * 100)}% markup`;
  }
}

/**
 * Get a greeting modifier based on relationship level.
 * Shop NPCs can give different greetings based on how much they like the player.
 * 
 * @param {string} relationshipLevel - The relationship level
 * @returns {string} Greeting modifier to append/prepend to standard greeting
 */
export function getShopGreetingModifier(relationshipLevel) {
  switch (relationshipLevel) {
    case RelationshipLevel.HOSTILE:
      return "I'll serve you, but don't expect any favors.";
    case RelationshipLevel.UNFRIENDLY:
      return "What do you want?";
    case RelationshipLevel.NEUTRAL:
      return ""; // Standard greeting, no modifier
    case RelationshipLevel.FRIENDLY:
      return "Ah, good to see you, friend! I've got some special deals for you.";
    case RelationshipLevel.ALLIED:
      return "My best customer! Let me show you my finest wares at the best prices.";
    default:
      return "";
  }
}

/**
 * Combined discount calculation including both relationship and world event discounts.
 * 
 * @param {number} basePrice - The base price of the item
 * @param {string} relationshipLevel - The relationship level with the shop NPC
 * @param {number} worldEventDiscount - Discount from world events (0-1)
 * @returns {number} The final adjusted price (minimum 1 gold)
 */
export function calculateCombinedPrice(basePrice, relationshipLevel, worldEventDiscount = 0) {
  if (!basePrice || basePrice <= 0) return 0;
  
  const relationshipDiscount = getRelationshipDiscount(relationshipLevel);
  
  // Combine discounts (both are subtracted from 1)
  // E.g., 10% relationship discount + 15% event discount = 25% total discount
  // But markup (negative discount) and event discount can offset
  const totalDiscount = relationshipDiscount + worldEventDiscount;
  
  // Cap total discount at 50% (don't give items away too cheap)
  // Cap total markup at 50% (don't make prices unreasonable)
  const cappedDiscount = Math.max(-0.50, Math.min(0.50, totalDiscount));
  
  const adjustedPrice = Math.floor(basePrice * (1 - cappedDiscount));
  
  return Math.max(1, adjustedPrice);
}

/**
 * Check if the player qualifies for a special loyalty reward from a shop.
 * ALLIED relationship unlocks special shop features.
 * 
 * @param {string} relationshipLevel - The relationship level with the shop NPC
 * @returns {boolean} True if player qualifies for loyalty rewards
 */
export function qualifiesForLoyaltyReward(relationshipLevel) {
  return relationshipLevel === RelationshipLevel.ALLIED;
}

/**
 * Get sell price modifier based on relationship.
 * Friendly NPCs buy your items at better prices.
 * 
 * @param {string} relationshipLevel - The relationship level
 * @returns {number} Multiplier for sell price (1.0 = normal, 1.1 = 10% better)
 */
export function getSellPriceModifier(relationshipLevel) {
  switch (relationshipLevel) {
    case RelationshipLevel.HOSTILE:
      return 0.80; // They lowball you
    case RelationshipLevel.UNFRIENDLY:
      return 0.90; // Slightly worse offers
    case RelationshipLevel.NEUTRAL:
      return 1.00; // Standard sell price
    case RelationshipLevel.FRIENDLY:
      return 1.10; // 10% better sell prices
    case RelationshipLevel.ALLIED:
      return 1.25; // 25% better sell prices
    default:
      return 1.00;
  }
}

/**
 * Calculate sell price with relationship modifier.
 * 
 * @param {number} baseSellPrice - The base sell price (usually 50% of item value)
 * @param {string} relationshipLevel - The relationship level with the shop NPC
 * @returns {number} The adjusted sell price
 */
export function calculateRelationshipSellPrice(baseSellPrice, relationshipLevel) {
  if (!baseSellPrice || baseSellPrice <= 0) return 0;
  
  const modifier = getSellPriceModifier(relationshipLevel);
  return Math.max(1, Math.floor(baseSellPrice * modifier));
}
