/**
 * Quest Reputation Notifications Module
 * Generates user-friendly messages when quest completion affects NPC relationships.
 * Integrates with Quest-Relationship Bridge to provide feedback to players.
 * 
 * Created by Claude Opus 4.5 (Villager) on Day 342
 */

import { RelationshipLevel } from './npc-relationships.js';
import { getQuestReputationReward, QUEST_REPUTATION_REWARDS } from './quest-relationship-bridge.js';

/**
 * Emoji icons for relationship levels (for UI display)
 */
export const RELATIONSHIP_ICONS = {
  [RelationshipLevel.HOSTILE]: '💢',
  [RelationshipLevel.UNFRIENDLY]: '😠',
  [RelationshipLevel.NEUTRAL]: '😐',
  [RelationshipLevel.FRIENDLY]: '😊',
  [RelationshipLevel.ALLIED]: '💖',
};

/**
 * Descriptive text for relationship level transitions
 */
export const LEVEL_TRANSITION_TEXT = {
  [RelationshipLevel.HOSTILE]: 'now hostile towards you',
  [RelationshipLevel.UNFRIENDLY]: 'wary of you',
  [RelationshipLevel.NEUTRAL]: 'neutral towards you',
  [RelationshipLevel.FRIENDLY]: 'friendly towards you',
  [RelationshipLevel.ALLIED]: 'now a trusted ally',
};

/**
 * Generate a notification message for reputation change.
 * 
 * @param {string} npcName - Display name of the NPC
 * @param {number} reputationChange - Amount of reputation gained/lost
 * @param {string} previousLevel - Previous relationship level
 * @param {string} newLevel - New relationship level after change
 * @returns {object} Notification object with text and metadata
 */
export function createReputationChangeNotification(npcName, reputationChange, previousLevel, newLevel) {
  const isPositive = reputationChange > 0;
  const absChange = Math.abs(reputationChange);
  const icon = RELATIONSHIP_ICONS[newLevel] || '😐';
  
  let text = '';
  
  if (previousLevel !== newLevel) {
    // Level changed - more significant notification
    const transitionText = LEVEL_TRANSITION_TEXT[newLevel] || `at ${newLevel} standing`;
    text = `${icon} ${npcName} is ${transitionText}! (${isPositive ? '+' : ''}${reputationChange} reputation)`;
  } else {
    // Same level - simple reputation change
    const direction = isPositive ? 'improved' : 'decreased';
    text = `${icon} Reputation with ${npcName} ${direction} by ${absChange}.`;
  }
  
  return {
    text,
    type: 'reputation',
    npcName,
    reputationChange,
    previousLevel,
    newLevel,
    levelChanged: previousLevel !== newLevel,
    isPositive,
  };
}

/**
 * Generate notifications for quest completion reputation changes.
 * 
 * @param {object} quest - The completed quest
 * @param {object} beforeState - NPC reputation states before completion
 * @param {object} afterState - NPC reputation states after completion
 * @param {object} npcNames - Map of npcId to display name
 * @returns {Array<object>} Array of notification objects
 */
export function generateQuestCompletionNotifications(quest, beforeState, afterState, npcNames = {}) {
  const notifications = [];
  
  if (!beforeState || !afterState) {
    return notifications;
  }
  
  // Check each NPC that might have been affected
  const affectedNpcs = new Set([
    ...(beforeState.affectedNpcs || []),
    ...(afterState.affectedNpcs || []),
    quest?.questGiver,
    ...(quest?.beneficiaryNpcs || []),
  ].filter(Boolean));
  
  for (const npcId of affectedNpcs) {
    const before = beforeState.reputations?.[npcId];
    const after = afterState.reputations?.[npcId];
    
    if (before !== undefined && after !== undefined && before !== after) {
      const beforeLevel = beforeState.levels?.[npcId] || RelationshipLevel.NEUTRAL;
      const afterLevel = afterState.levels?.[npcId] || RelationshipLevel.NEUTRAL;
      const npcName = npcNames[npcId] || npcId;
      const change = after - before;
      
      notifications.push(createReputationChangeNotification(
        npcName,
        change,
        beforeLevel,
        afterLevel
      ));
    }
  }
  
  return notifications;
}

/**
 * Get a summary message for quest completion with total reputation gained.
 * 
 * @param {string} questName - Name of the completed quest
 * @param {Array<object>} notifications - Array of reputation notifications
 * @returns {string} Summary message
 */
export function getQuestCompletionSummary(questName, notifications) {
  if (!notifications || notifications.length === 0) {
    return `Quest completed: ${questName}`;
  }
  
  const totalRep = notifications.reduce((sum, n) => sum + (n.reputationChange || 0), 0);
  const levelUps = notifications.filter(n => n.levelChanged && n.isPositive).length;
  
  let summary = `Quest completed: ${questName}`;
  
  if (totalRep !== 0) {
    const sign = totalRep > 0 ? '+' : '';
    summary += ` (${sign}${totalRep} total reputation`;
    if (levelUps > 0) {
      summary += `, ${levelUps} relationship${levelUps > 1 ? 's' : ''} improved`;
    }
    summary += ')';
  }
  
  return summary;
}

/**
 * Format notifications for display in the game log.
 * 
 * @param {Array<object>} notifications - Array of reputation notifications
 * @returns {Array<string>} Array of formatted text strings
 */
export function formatNotificationsForLog(notifications) {
  if (!notifications || !Array.isArray(notifications)) {
    return [];
  }
  
  return notifications.map(n => n.text);
}

/**
 * Capture current reputation state for comparison.
 * 
 * @param {object} relationshipManager - NPCRelationshipManager instance
 * @param {Array<string>} npcIds - List of NPC IDs to capture
 * @returns {object} State snapshot with reputations and levels
 */
export function captureReputationState(relationshipManager, npcIds) {
  if (!relationshipManager || !npcIds || !Array.isArray(npcIds)) {
    return { reputations: {}, levels: {}, affectedNpcs: [] };
  }
  
  const reputations = {};
  const levels = {};
  
  for (const npcId of npcIds) {
    const relationship = relationshipManager.getRelationship(npcId);
    if (relationship) {
      reputations[npcId] = relationship.reputation;
      levels[npcId] = relationshipManager.getRelationshipLevel(npcId);
    }
  }
  
  return {
    reputations,
    levels,
    affectedNpcs: npcIds,
  };
}

/**
 * Get expected reputation preview for a quest (before completion).
 * Useful for showing players what reputation they'll gain.
 * 
 * @param {object} quest - Quest object
 * @param {object} relationshipManager - NPCRelationshipManager instance (optional, for bonus calculation)
 * @returns {object} Preview of expected reputation changes
 */
export function getQuestReputationPreview(quest, relationshipManager = null) {
  if (!quest) {
    return { baseReward: 0, bonusMultiplier: 1, expectedChanges: [] };
  }
  
  const difficulty = quest.difficulty || 'normal';
  const baseReward = getQuestReputationReward(difficulty);
  const expectedChanges = [];
  
  // Quest giver gets full reward
  if (quest.questGiver) {
    let multiplier = 1;
    if (relationshipManager) {
      const level = relationshipManager.getRelationshipLevel(quest.questGiver);
      multiplier = getRelationshipBonusMultiplier(level);
    }
    expectedChanges.push({
      npcId: quest.questGiver,
      baseReward,
      multiplier,
      expectedGain: Math.round(baseReward * multiplier),
      type: 'questGiver',
    });
  }
  
  // Beneficiaries get half reward
  const beneficiaries = quest.beneficiaryNpcs || [];
  for (const npcId of beneficiaries) {
    let multiplier = 1;
    if (relationshipManager) {
      const level = relationshipManager.getRelationshipLevel(npcId);
      multiplier = getRelationshipBonusMultiplier(level);
    }
    const halfReward = Math.floor(baseReward / 2);
    expectedChanges.push({
      npcId,
      baseReward: halfReward,
      multiplier,
      expectedGain: Math.round(halfReward * multiplier),
      type: 'beneficiary',
    });
  }
  
  return {
    questName: quest.name || quest.id,
    difficulty,
    baseReward,
    expectedChanges,
  };
}

/**
 * Get relationship bonus multiplier for a level.
 * Mirrors the logic in quest-relationship-bridge.js for preview purposes.
 * 
 * @param {string} level - Relationship level
 * @returns {number} Bonus multiplier
 */
function getRelationshipBonusMultiplier(level) {
  const multipliers = {
    [RelationshipLevel.HOSTILE]: 0.75,
    [RelationshipLevel.UNFRIENDLY]: 0.9,
    [RelationshipLevel.NEUTRAL]: 1.0,
    [RelationshipLevel.FRIENDLY]: 1.1,
    [RelationshipLevel.ALLIED]: 1.25,
  };
  return multipliers[level] || 1.0;
}
