/**
 * NPC Relationships Module — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Tracks player relationships and reputation with NPCs.
 * Supports relationship levels, dialogue history, and reputation effects on interactions.
 */

export const RelationshipLevel = Object.freeze({
  HOSTILE: 'HOSTILE',
  UNFRIENDLY: 'UNFRIENDLY',
  NEUTRAL: 'NEUTRAL',
  FRIENDLY: 'FRIENDLY',
  ALLIED: 'ALLIED'
});

export const ReputationEvent = Object.freeze({
  QUEST_COMPLETE: { type: 'QUEST_COMPLETE', value: 15 },
  QUEST_FAIL: { type: 'QUEST_FAIL', value: -20 },
  GIFT_GIVEN: { type: 'GIFT_GIVEN', minValue: 5, maxValue: 15 },
  HELPED_NPC: { type: 'HELPED_NPC', value: 10 },
  BETRAYED_NPC: { type: 'BETRAYED_NPC', value: -30 },
  DIALOGUE_POSITIVE: { type: 'DIALOGUE_POSITIVE', value: 3 },
  DIALOGUE_NEGATIVE: { type: 'DIALOGUE_NEGATIVE', value: -5 },
  COMBAT_VICTORY: { type: 'COMBAT_VICTORY', value: 2 },
  THEFT_CAUGHT: { type: 'THEFT_CAUGHT', value: -25 }
});

const LEVEL_THRESHOLDS = [
  { level: RelationshipLevel.HOSTILE, min: -100, max: -50 },
  { level: RelationshipLevel.UNFRIENDLY, min: -49, max: -10 },
  { level: RelationshipLevel.NEUTRAL, min: -9, max: 9 },
  { level: RelationshipLevel.FRIENDLY, min: 10, max: 49 },
  { level: RelationshipLevel.ALLIED, min: 50, max: 100 }
];

/**
 * @typedef {Object} ConversationEntry
 * @property {string} dialogId
 * @property {string} nodeId
 * @property {string|Object} choice
 * @property {number} timestamp
 * @property {string|undefined} topicId
 */

/**
 * @typedef {Object} RelationshipRecord
 * @property {number} reputation
 * @property {string} level
 * @property {Array<Object>} history
 * @property {number|null} lastInteraction
 * @property {ConversationEntry[]} conversationMemory
 * @property {Array<Object>} gifts
 * @property {Array<Object>} questsCompleted
 */

/**
 * Manages NPC reputation, relationship levels, and dialogue memory.
 */
export class NPCRelationshipManager {
  constructor() {
    this.relationships = new Map();
  }

  /**
   * Retrieve or create the relationship record for an NPC.
   * @param {string} npcId - Unique identifier for the NPC.
   * @returns {RelationshipRecord} Relationship data for the NPC.
   */
  getRelationship(npcId) {
    if (!npcId) {
      throw new Error('npcId is required to access relationship data.');
    }
    if (!this.relationships.has(npcId)) {
      this.relationships.set(npcId, this._createDefaultRelationship());
    }
    return this.relationships.get(npcId);
  }

  /**
   * Adjust an NPC's reputation, clamp to range, update level, and log history.
   * @param {string} npcId - Target NPC.
   * @param {number} amount - Reputation delta (positive or negative).
   * @param {string|Object} reason - Description or event for the change.
   * @returns {RelationshipRecord} Updated relationship record.
   */
  modifyReputation(npcId, amount, reason) {
    const relationship = this.getRelationship(npcId);
    const timestamp = Date.now();
    const fromReputation = relationship.reputation;
    const toReputation = this._clampReputation(fromReputation + amount);
    const nextLevel = this.getRelationshipLevelForValue(toReputation);

    relationship.reputation = toReputation;
    relationship.level = nextLevel;
    relationship.lastInteraction = timestamp;
    relationship.history.push({
      timestamp,
      change: amount,
      reason: this._extractReason(reason),
      from: fromReputation,
      to: toReputation,
      level: nextLevel
    });

    return relationship;
  }

  /**
   * Get the RelationshipLevel for the NPC based on current reputation.
   * @param {string} npcId - Target NPC.
   * @returns {string} RelationshipLevel value.
   */
  getRelationshipLevel(npcId) {
    const relationship = this.getRelationship(npcId);
    relationship.level = this.getRelationshipLevelForValue(relationship.reputation);
    return relationship.level;
  }

  /**
   * Add a conversation memory entry, keeping the most recent 20.
   * @param {string} npcId - Target NPC.
   * @param {string} dialogId - Dialogue identifier.
   * @param {string} nodeId - Dialogue node identifier.
   * @param {string|Object} choice - Player choice or option metadata.
   * @param {number} [timestamp=Date.now()] - When the conversation happened.
   */
  addConversationMemory(npcId, dialogId, nodeId, choice, timestamp = Date.now()) {
    const relationship = this.getRelationship(npcId);
    const topicId = this._extractTopicId(nodeId, choice);
    relationship.conversationMemory.push({ dialogId, nodeId, choice, timestamp, topicId });
    if (relationship.conversationMemory.length > 20) {
      relationship.conversationMemory = relationship.conversationMemory.slice(-20);
    }
    relationship.lastInteraction = timestamp;
  }

  /**
   * Get the conversation history for an NPC.
   * @param {string} npcId - Target NPC.
   * @returns {ConversationEntry[]} Array of recent conversation entries.
   */
  getConversationMemory(npcId) {
    const relationship = this.getRelationship(npcId);
    return relationship.conversationMemory;
  }

  /**
   * Check if the player discussed a specific topic with an NPC.
   * @param {string} npcId - Target NPC.
   * @param {string} topicId - Topic identifier to search for.
   * @returns {boolean} True if the topic was discussed.
   */
  hasDiscussedTopic(npcId, topicId) {
    const relationship = this.getRelationship(npcId);
    return relationship.conversationMemory.some(entry =>
      entry.topicId === topicId ||
      entry.nodeId === topicId ||
      entry.choice === topicId ||
      (entry.choice && typeof entry.choice === 'object' && (entry.choice.topicId === topicId || entry.choice.id === topicId))
    );
  }

  /**
   * Record a gift to an NPC and update reputation based on value.
   * @param {string} npcId - Target NPC.
   * @param {string} itemId - Gifted item identifier.
   * @param {number} value - Value of the gift.
   * @returns {RelationshipRecord} Updated relationship record.
   */
  recordGift(npcId, itemId, value) {
    const delta = value > 100 ? 15 : value > 50 ? 10 : 5;
    const relationship = this.getRelationship(npcId);
    relationship.gifts.push({ itemId, value, timestamp: Date.now(), delta });
    return this.modifyReputation(npcId, delta, ReputationEvent.GIFT_GIVEN.type);
  }

  /**
   * Record a completed quest and adjust reputation.
   * @param {string} npcId - Target NPC.
   * @param {string} questId - Completed quest identifier.
   * @returns {RelationshipRecord} Updated relationship record.
   */
  recordQuestComplete(npcId, questId) {
    const relationship = this.getRelationship(npcId);
    if (!relationship.questsCompleted.includes(questId)) {
      relationship.questsCompleted.push(questId);
    }
    return this.modifyReputation(npcId, ReputationEvent.QUEST_COMPLETE.value, ReputationEvent.QUEST_COMPLETE.type);
  }

  /**
   * Record a failed quest and adjust reputation.
   * @param {string} npcId - Target NPC.
   * @param {string} questId - Failed quest identifier.
   * @returns {RelationshipRecord} Updated relationship record.
   */
  recordQuestFail(npcId, questId) {
    const relationship = this.getRelationship(npcId);
    if (!relationship.questsCompleted.includes(questId)) {
      relationship.questsCompleted = relationship.questsCompleted.filter(id => id !== questId);
    }
    return this.modifyReputation(npcId, ReputationEvent.QUEST_FAIL.value, ReputationEvent.QUEST_FAIL.type);
  }

  /**
   * Get the full reputation history for an NPC.
   * @param {string} npcId - Target NPC.
   * @returns {Array<Object>} History entries.
   */
  getRelationshipHistory(npcId) {
    const relationship = this.getRelationship(npcId);
    return relationship.history;
  }

  /**
   * Get a serializable snapshot of all NPC relationships.
   * @returns {Object} Serializable state.
   */
  getState() {
    return {
      relationships: Array.from(this.relationships.entries())
    };
  }

  /**
   * Restore relationship state from a serialized snapshot.
   * @param {Object} state - Saved state to restore from.
   */
  restoreState(state) {
    this.relationships = new Map();
    if (!state || !Array.isArray(state.relationships)) {
      return;
    }
    for (const [npcId, stored] of state.relationships) {
      const record = this._createDefaultRelationship();
      record.reputation = this._clampReputation(typeof stored.reputation === 'number' ? stored.reputation : record.reputation);
      record.level = this.getRelationshipLevelForValue(record.reputation);
      record.history = Array.isArray(stored.history) ? [...stored.history] : record.history;
      record.lastInteraction = typeof stored.lastInteraction === 'number' ? stored.lastInteraction : record.lastInteraction;
      record.conversationMemory = Array.isArray(stored.conversationMemory)
        ? stored.conversationMemory.slice(-20)
        : record.conversationMemory;
      record.gifts = Array.isArray(stored.gifts) ? [...stored.gifts] : record.gifts;
      record.questsCompleted = Array.isArray(stored.questsCompleted) ? [...stored.questsCompleted] : record.questsCompleted;
      this.relationships.set(npcId, record);
    }
  }

  /**
   * Determine the RelationshipLevel for a reputation value.
   * @param {number} reputation - Reputation score between -100 and 100.
   * @returns {string} RelationshipLevel value.
   */
  getRelationshipLevelForValue(reputation) {
    const clamped = this._clampReputation(reputation);
    const match = LEVEL_THRESHOLDS.find(range => clamped >= range.min && clamped <= range.max);
    return match ? match.level : RelationshipLevel.NEUTRAL;
  }

  _createDefaultRelationship() {
    return {
      reputation: 0,
      level: RelationshipLevel.NEUTRAL,
      history: [],
      lastInteraction: null,
      conversationMemory: [],
      gifts: [],
      questsCompleted: []
    };
  }

  _clampReputation(value) {
    return Math.max(-100, Math.min(100, value));
  }

  _extractReason(reason) {
    if (reason && typeof reason === 'object' && 'type' in reason) {
      return reason.type;
    }
    return reason || 'UNKNOWN';
  }

  _extractTopicId(nodeId, choice) {
    if (choice && typeof choice === 'object') {
      if (choice.topicId) return choice.topicId;
      if (choice.id) return choice.id;
    }
    return nodeId;
  }
}

/**
 * Factory for NPCRelationshipManager.
 * @returns {NPCRelationshipManager} New relationship manager instance.
 */
export function createNPCRelationshipManager() {
  return new NPCRelationshipManager();
}
