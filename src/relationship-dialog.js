/**
 * Relationship Dialog Integration — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Extends the dialog system with NPC relationship-aware conditions and helpers.
 */

import { RelationshipLevel, NPCRelationshipManager } from './npc-relationships.js';
import { LOYALTY_TIER_ORDER, getLoyaltyTier, getLoyaltyTierIndex } from './companion-loyalty-events.js';
import { getCompanionById } from './companions.js';
import { DialogManager, conditionalNode } from './story/dialog.js';

export const RELATIONSHIP_LEVEL_ORDER = [
  RelationshipLevel.HOSTILE,
  RelationshipLevel.UNFRIENDLY,
  RelationshipLevel.NEUTRAL,
  RelationshipLevel.FRIENDLY,
  RelationshipLevel.ALLIED
];

/**
 * Compare two relationship levels using the predefined order.
 * @param {string} currentLevel - Current relationship level.
 * @param {string} targetLevel - Target relationship level to compare against.
 * @param {string} operator - Comparison operator (==, !=, >, >=, <, <=).
 * @returns {boolean} True if the comparison passes.
 */
function compareRelationshipLevels(currentLevel, targetLevel, operator) {
  const currentIndex = RELATIONSHIP_LEVEL_ORDER.indexOf(currentLevel);
  const targetIndex = RELATIONSHIP_LEVEL_ORDER.indexOf(targetLevel);
  if (currentIndex === -1 || targetIndex === -1) {
    return false;
  }
  switch (operator) {
    case '==': return currentIndex === targetIndex;
    case '!=': return currentIndex !== targetIndex;
    case '>': return currentIndex > targetIndex;
    case '>=': return currentIndex >= targetIndex;
    case '<': return currentIndex < targetIndex;
    case '<=': return currentIndex <= targetIndex;
    default: return currentIndex === targetIndex;
  }
}

/**
 * Compare a companion's current loyalty tier against a target tier.
 * Uses LOYALTY_TIER_ORDER from companion-loyalty-events as single source of truth.
 * @param {number} loyalty - Current loyalty value (0-100).
 * @param {string} targetTier - Target tier name (e.g. 'Devoted', 'Soulbound').
 * @param {string} operator - Comparison operator (==, !=, >, >=, <, <=).
 * @returns {boolean} True if the comparison passes.
 */
function compareLoyaltyTiers(loyalty, targetTier, operator) {
  const currentIndex = getLoyaltyTierIndex(loyalty);
  const targetIndex = LOYALTY_TIER_ORDER.indexOf(targetTier);
  if (currentIndex === -1 || targetIndex === -1) {
    return false;
  }
  switch (operator) {
    case '==': return currentIndex === targetIndex;
    case '!=': return currentIndex !== targetIndex;
    case '>': return currentIndex > targetIndex;
    case '>=': return currentIndex >= targetIndex;
    case '<': return currentIndex < targetIndex;
    case '<=': return currentIndex <= targetIndex;
    default: return currentIndex === targetIndex;
  }
}

/**
 * Relationship-aware DialogManager wrapper that understands relationship conditions.
 */
export class RelationshipDialogManager extends DialogManager {
  /**
   * @param {NPCRelationshipManager} [relationshipManager=new NPCRelationshipManager()] - Relationship data source.
   */
  constructor(relationshipManager = new NPCRelationshipManager()) {
    super();
    this.relationshipManager = relationshipManager;
  }

  /**
   * Evaluate dialog conditions, including relationship-aware checks.
   * @param {Object} condition - Condition object to evaluate.
   * @param {Object} gameState - Current game state (forwarded to base conditions).
   * @returns {boolean} True if condition succeeds.
   */
  evaluateCondition(condition, gameState = {}) {
    if (!condition) return false;

    switch (condition.type) {
      case 'relationship': {
        const { npcId, level, operator = '==' } = condition;
        if (!npcId || !level) return false;
        const currentLevel = this.relationshipManager.getRelationshipLevel(npcId);
        return compareRelationshipLevels(currentLevel, level, operator);
      }
      case 'reputation': {
        const { npcId, value = 0, operator = '>=' } = condition;
        if (!npcId) return false;
        const { reputation } = this.relationshipManager.getRelationship(npcId);
        return this.compare(reputation, value, operator);
      }
      case 'discussed': {
        const { npcId, topicId } = condition;
        if (!npcId || !topicId) return false;
        return this.relationshipManager.hasDiscussedTopic(npcId, topicId);
      }
      case 'giftGiven': {
        const { npcId, itemId } = condition;
        if (!npcId || !itemId) return false;
        const { gifts } = this.relationshipManager.getRelationship(npcId);
        return gifts.some(gift => gift.itemId === itemId);
      }
      case 'questsCompletedFor': {
        const { npcId, count = 1, operator = '>=' } = condition;
        if (!npcId) return false;
        const { questsCompleted } = this.relationshipManager.getRelationship(npcId);
        const completedCount = Array.isArray(questsCompleted) ? questsCompleted.length : 0;
        return this.compare(completedCount, count, operator);
      }
      case 'companionLoyalty': {
        const { companionId, tier, operator: loyaltyOp = '>=' } = condition;
        if (!companionId || !tier) return false;
        const companion = getCompanionById(gameState, companionId);
        if (!companion) return false;
        return compareLoyaltyTiers(companion.loyalty, tier, loyaltyOp);
      }
      case 'companionInParty': {
        const { companionId: cId } = condition;
        if (!cId) return false;
        const comp = getCompanionById(gameState, cId);
        return comp !== null && comp !== undefined;
      }
      case 'companionSoulbound': {
        const { companionId: sbId } = condition;
        if (!sbId) return false;
        const sbComp = getCompanionById(gameState, sbId);
        return sbComp !== null && sbComp !== undefined && sbComp.soulbound === true;
      }
      default:
        return super.evaluateCondition(condition, gameState);
    }
  }

  /**
   * Derive a dialog ID variant based on current relationship level.
   * @param {string} npcId - NPC identifier.
   * @param {string} baseDialogId - Base dialog ID before relationship suffixing.
   * @returns {string} Relationship-aware dialog ID variant.
   */
  getRelationshipAwareDialogVariant(npcId, baseDialogId) {
    return getRelationshipAwareDialogVariant(npcId, baseDialogId, this.relationshipManager);
  }

  /**
   * Create a conditional dialog node that branches by relationship level.
   * @param {string} npcId - NPC identifier.
   * @param {Object} variants - Map of RelationshipLevel to dialog node IDs.
   * @returns {Object} Conditional dialog node.
   */
  createRelationshipBranchingDialog(npcId, variants) {
    return createRelationshipBranchingDialog(npcId, variants);
  }
}

/**
 * Build a relationship-aware dialog ID variant (base_dialogId_lowercaselevel).
 * @param {string} npcId - NPC identifier.
 * @param {string} baseDialogId - Base dialog ID before modification.
 * @param {NPCRelationshipManager} [relationshipManager] - Optional relationship manager instance.
 * When omitted, the baseDialogId is returned unchanged.
 * @returns {string} Relationship-aware dialog ID.
 */
export function getRelationshipAwareDialogVariant(npcId, baseDialogId, relationshipManager) {
  if (!baseDialogId) {
    return baseDialogId;
  }
  if (!npcId || !relationshipManager) {
    return baseDialogId;
  }
  const level = relationshipManager.getRelationshipLevel(npcId);
  return `${baseDialogId}_${level.toLowerCase()}`;
}

/**
 * Create a conditional dialog node that branches based on relationship levels.
 * Higher relationship levels are evaluated first.
 * @param {string} npcId - NPC identifier.
 * @param {Object} variants - Map of RelationshipLevel to node IDs. Optionally includes "default".
 * @returns {Object} Conditional dialog node definition.
 */
export function createRelationshipBranchingDialog(npcId, variants = {}) {
  const orderedLevels = [...RELATIONSHIP_LEVEL_ORDER].reverse();
  const conditions = orderedLevels
    .filter(level => variants[level])
    .map(level => ({
      check: { type: 'relationship', npcId, level, operator: '>=' },
      then: variants[level]
    }));

  const elseNode = variants.default || variants[RelationshipLevel.NEUTRAL] || null;
  return conditionalNode(conditions, elseNode);
}


/**
 * Create a conditional dialog node that branches based on companion loyalty tiers.
 * Higher loyalty tiers are evaluated first (Soulbound -> Abandoned).
 * @param {string} companionId - Companion identifier.
 * @param {Object} variants - Map of tier name to dialog node IDs.
 *   Optionally includes "default" for fallback.
 * @returns {Object} Conditional dialog node definition.
 */
export function createCompanionLoyaltyBranchingDialog(companionId, variants = {}) {
  const orderedTiers = [...LOYALTY_TIER_ORDER].reverse();
  const conditions = orderedTiers
    .filter(tier => variants[tier])
    .map(tier => ({
      check: { type: 'companionLoyalty', companionId, tier, operator: '>=' },
      then: variants[tier]
    }));

  const elseNode = variants.default || variants['Neutral'] || null;
  return conditionalNode(conditions, elseNode);
}

/**
 * Derive a dialog ID variant based on current companion loyalty tier.
 * Returns baseDialogId_tiername (lowercase).
 * @param {string} companionId - Companion identifier.
 * @param {string} baseDialogId - Base dialog ID before loyalty suffixing.
 * @param {Object} gameState - Current game state (must contain companions array).
 * @returns {string} Loyalty-aware dialog ID variant.
 */
export function getCompanionLoyaltyDialogVariant(companionId, baseDialogId, gameState) {
  if (!baseDialogId) return baseDialogId;
  if (!companionId || !gameState) return baseDialogId;
  const companion = getCompanionById(gameState, companionId);
  if (!companion) return baseDialogId;
  const tier = getLoyaltyTier(companion.loyalty);
  return `${baseDialogId}_${tier.name.toLowerCase()}`;
}
