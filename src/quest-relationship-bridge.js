/**
 * Quest-Relationship Bridge Module
 * Connects quest completion to the NPC Relationship system.
 * When quests are completed for NPCs, automatically updates relationships.
 * 
 * Addresses the integration gap flagged by GPT-5.2:
 * "If we want relationship-based dialog to react to quest completion,
 * we'll need a bridge (e.g., on quest completion:
 * relationshipManager.recordQuestComplete(npcId, questId) or similar)."
 * 
 * Created by Claude Opus 4.5 (Villager) on Day 342
 */

import { NPCRelationshipManager, RelationshipLevel } from './npc-relationships.js';

/**
 * Reputation rewards for quest completion based on quest difficulty/type.
 * Higher values mean more reputation gain.
 */
export const QUEST_REPUTATION_REWARDS = {
  trivial: 5,      // Simple fetch quests
  easy: 10,        // Basic combat or exploration
  normal: 20,      // Standard quests
  hard: 35,        // Challenging quests
  epic: 50,        // Major questlines
  legendary: 75,   // Endgame content
};

/**
 * Default quest difficulty if not specified.
 */
export const DEFAULT_QUEST_DIFFICULTY = 'normal';

/**
 * Get the reputation reward for completing a quest.
 * 
 * @param {string} difficulty - Quest difficulty level
 * @returns {number} Reputation points to award
 */
export function getQuestReputationReward(difficulty) {
  const reward = QUEST_REPUTATION_REWARDS[difficulty];
  return reward !== undefined ? reward : QUEST_REPUTATION_REWARDS[DEFAULT_QUEST_DIFFICULTY];
}

/**
 * Process quest completion and update NPC relationships.
 * This is the main bridge function that should be called when a quest is completed.
 * 
 * @param {NPCRelationshipManager} relationshipManager - The relationship manager instance
 * @param {object} quest - The completed quest object
 * @param {string} quest.id - Quest ID
 * @param {string} quest.name - Quest name
 * @param {string} [quest.npcId] - NPC who gave the quest (optional)
 * @param {string} [quest.difficulty] - Quest difficulty (trivial/easy/normal/hard/epic/legendary)
 * @param {Array<string>} [quest.beneficiaryNpcs] - Additional NPCs who benefit from quest completion
 * @returns {object} Result with relationship changes
 */
export function processQuestCompletion(relationshipManager, quest) {
  if (!relationshipManager || !quest || !quest.id) {
    return { success: false, changes: [], error: 'Invalid input' };
  }

  const changes = [];
  const difficulty = quest.difficulty || DEFAULT_QUEST_DIFFICULTY;
  const reputationReward = getQuestReputationReward(difficulty);

  // Update relationship with quest giver
  if (quest.npcId) {
    const beforeLevel = relationshipManager.getRelationshipLevel(quest.npcId);
    
    // Manually track quest completion without auto-reputation from recordQuestComplete
    // (recordQuestComplete adds fixed 15 reputation, but we want difficulty-based rewards)
    const relationship = relationshipManager.getRelationship(quest.npcId);
    if (!relationship.questsCompleted.includes(quest.id)) {
      relationship.questsCompleted.push(quest.id);
    }
    
    // Add difficulty-based reputation for completing the quest
    relationshipManager.modifyReputation(quest.npcId, reputationReward);
    
    const afterLevel = relationshipManager.getRelationshipLevel(quest.npcId);
    
    changes.push({
      npcId: quest.npcId,
      type: 'questGiver',
      reputationGained: reputationReward,
      beforeLevel,
      afterLevel,
      leveledUp: beforeLevel !== afterLevel,
    });
  }

  // Update relationships with beneficiary NPCs (if any)
  if (quest.beneficiaryNpcs && Array.isArray(quest.beneficiaryNpcs)) {
    // Beneficiaries get half the reputation reward
    const beneficiaryReward = Math.floor(reputationReward / 2);
    
    for (const npcId of quest.beneficiaryNpcs) {
      if (npcId === quest.npcId) continue; // Skip if same as quest giver
      
      const beforeLevel = relationshipManager.getRelationshipLevel(npcId);
      relationshipManager.modifyReputation(npcId, beneficiaryReward);
      const afterLevel = relationshipManager.getRelationshipLevel(npcId);
      
      changes.push({
        npcId,
        type: 'beneficiary',
        reputationGained: beneficiaryReward,
        beforeLevel,
        afterLevel,
        leveledUp: beforeLevel !== afterLevel,
      });
    }
  }

  return {
    success: true,
    questId: quest.id,
    questName: quest.name,
    difficulty,
    changes,
  };
}

/**
 * Check if a quest has already been completed for an NPC.
 * Useful for preventing duplicate rewards.
 * 
 * @param {NPCRelationshipManager} relationshipManager - The relationship manager instance
 * @param {string} npcId - The NPC ID
 * @param {string} questId - The quest ID
 * @returns {boolean} True if quest was already completed for this NPC
 */
export function isQuestCompletedForNpc(relationshipManager, npcId, questId) {
  if (!relationshipManager || !npcId || !questId) {
    return false;
  }
  
  const data = relationshipManager.getRelationship(npcId);
  if (!data || !data.questsCompleted) {
    return false;
  }
  
  return data.questsCompleted.includes(questId);
}

/**
 * Get the total number of quests completed for an NPC.
 * 
 * @param {NPCRelationshipManager} relationshipManager - The relationship manager instance
 * @param {string} npcId - The NPC ID
 * @returns {number} Number of quests completed
 */
export function getQuestsCompletedCount(relationshipManager, npcId) {
  if (!relationshipManager || !npcId) {
    return 0;
  }
  
  const data = relationshipManager.getRelationship(npcId);
  if (!data || !data.questsCompleted) {
    return 0;
  }
  
  return data.questsCompleted.length;
}

/**
 * Generate a summary of relationship changes from quest completion.
 * Useful for displaying to the player.
 * 
 * @param {object} result - Result from processQuestCompletion
 * @returns {string[]} Array of human-readable messages
 */
export function generateQuestCompletionMessages(result) {
  if (!result || !result.success || !result.changes) {
    return [];
  }

  const messages = [];
  
  for (const change of result.changes) {
    let msg = '';
    
    if (change.type === 'questGiver') {
      msg = `Your relationship with ${change.npcId} improved! (+${change.reputationGained} reputation)`;
    } else if (change.type === 'beneficiary') {
      msg = `${change.npcId} heard about your good deed! (+${change.reputationGained} reputation)`;
    }
    
    if (change.leveledUp) {
      msg += ` Relationship level increased to ${change.afterLevel}!`;
    }
    
    if (msg) {
      messages.push(msg);
    }
  }
  
  return messages;
}

/**
 * Create a quest completion handler that can be integrated into the quest system.
 * Returns a function that processes quest completion and updates relationships.
 * 
 * @param {NPCRelationshipManager} relationshipManager - The relationship manager instance
 * @returns {Function} Handler function (quest) => result
 */
export function createQuestCompletionHandler(relationshipManager) {
  return (quest) => processQuestCompletion(relationshipManager, quest);
}

/**
 * Calculate reputation bonus based on current relationship level.
 * Better relationships may give bonus reputation on quest completion.
 * 
 * @param {string} relationshipLevel - Current relationship level
 * @returns {number} Bonus multiplier (1.0 = no bonus, 1.25 = 25% bonus)
 */
export function getRelationshipReputationBonus(relationshipLevel) {
  switch (relationshipLevel) {
    case RelationshipLevel.HOSTILE:
      return 0.75; // Reduced reputation gain when hostile
    case RelationshipLevel.UNFRIENDLY:
      return 0.90; // Slightly reduced
    case RelationshipLevel.NEUTRAL:
      return 1.00; // Standard
    case RelationshipLevel.FRIENDLY:
      return 1.10; // 10% bonus
    case RelationshipLevel.ALLIED:
      return 1.25; // 25% bonus
    default:
      return 1.00;
  }
}

/**
 * Process quest completion with relationship-based reputation bonuses.
 * Enhanced version that considers current relationship when calculating rewards.
 * 
 * @param {NPCRelationshipManager} relationshipManager - The relationship manager instance
 * @param {object} quest - The completed quest object
 * @returns {object} Result with relationship changes (including bonuses)
 */
export function processQuestCompletionWithBonus(relationshipManager, quest) {
  if (!relationshipManager || !quest || !quest.id) {
    return { success: false, changes: [], error: 'Invalid input' };
  }

  const changes = [];
  const difficulty = quest.difficulty || DEFAULT_QUEST_DIFFICULTY;
  const baseReputationReward = getQuestReputationReward(difficulty);

  // Update relationship with quest giver (with bonus)
  if (quest.npcId) {
    const beforeLevel = relationshipManager.getRelationshipLevel(quest.npcId);
    const bonus = getRelationshipReputationBonus(beforeLevel);
    const finalReward = Math.floor(baseReputationReward * bonus);
    
    // Manually track quest completion without auto-reputation from recordQuestComplete
    const relationship = relationshipManager.getRelationship(quest.npcId);
    if (!relationship.questsCompleted.includes(quest.id)) {
      relationship.questsCompleted.push(quest.id);
    }
    
    // Add reputation with relationship-based bonus
    relationshipManager.modifyReputation(quest.npcId, finalReward);
    
    const afterLevel = relationshipManager.getRelationshipLevel(quest.npcId);
    
    changes.push({
      npcId: quest.npcId,
      type: 'questGiver',
      baseReward: baseReputationReward,
      bonusMultiplier: bonus,
      reputationGained: finalReward,
      beforeLevel,
      afterLevel,
      leveledUp: beforeLevel !== afterLevel,
    });
  }

  // Update relationships with beneficiary NPCs (half reward, no bonus)
  if (quest.beneficiaryNpcs && Array.isArray(quest.beneficiaryNpcs)) {
    const beneficiaryReward = Math.floor(baseReputationReward / 2);
    
    for (const npcId of quest.beneficiaryNpcs) {
      if (npcId === quest.npcId) continue;
      
      const beforeLevel = relationshipManager.getRelationshipLevel(npcId);
      relationshipManager.modifyReputation(npcId, beneficiaryReward);
      const afterLevel = relationshipManager.getRelationshipLevel(npcId);
      
      changes.push({
        npcId,
        type: 'beneficiary',
        reputationGained: beneficiaryReward,
        beforeLevel,
        afterLevel,
        leveledUp: beforeLevel !== afterLevel,
      });
    }
  }

  return {
    success: true,
    questId: quest.id,
    questName: quest.name,
    difficulty,
    changes,
  };
}
