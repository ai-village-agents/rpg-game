/**
 * Companion Mood Indicators — AI Village RPG
 * Tracks companion mood states based on recent loyalty changes
 * Displays emotional feedback in the UI
 */

import { getLoyaltyTier } from './companion-loyalty-events.js';

/**
 * Mood states based on loyalty tiers
 * Each tier maps to a visual emoji and description
 */
export const MOOD_STATES = {
  ABANDONED: {
    tier: 'Abandoned',
    emoji: '💔',
    label: 'Heartbroken',
    description: 'Will leave the party',
    color: '#8B0000',
  },
  DISCONTENT: {
    tier: 'Discontent',
    emoji: '😠',
    label: 'Upset',
    description: 'Unhappy with current situation',
    color: '#DC143C',
  },
  NEUTRAL: {
    tier: 'Neutral',
    emoji: '😐',
    label: 'Neutral',
    description: 'Indifferent',
    color: '#808080',
  },
  FRIENDLY: {
    tier: 'Friendly',
    emoji: '😊',
    label: 'Happy',
    description: 'Warming up to you',
    color: '#FFD700',
  },
  DEVOTED: {
    tier: 'Devoted',
    emoji: '😄',
    label: 'Devoted',
    description: 'Very loyal',
    color: '#90EE90',
  },
  SOULBOUND: {
    tier: 'Soulbound',
    emoji: '💖',
    label: 'Soulbound',
    description: 'Unbreakable bond',
    color: '#FF1493',
  },
};

/**
 * Get companion mood indicator based on loyalty value
 * @param {number} loyalty - Companion loyalty (0-100)
 * @returns {Object} Mood object with emoji, label, description
 */
export function getCompanionMood(loyalty) {
  const tier = getLoyaltyTier(loyalty);
  return MOOD_STATES[tier.name.toUpperCase()] || MOOD_STATES.NEUTRAL;
}

/**
 * Calculate recent mood change (between last two loyalty values)
 * @param {number} oldLoyalty - Previous loyalty value
 * @param {number} newLoyalty - Current loyalty value
 * @returns {string} One of: 'improved', 'declined', 'stable'
 */
export function getMoodChange(oldLoyalty, newLoyalty) {
  const oldTier = getLoyaltyTier(oldLoyalty);
  const newTier = getLoyaltyTier(newLoyalty);

  if (newTier.threshold > oldTier.threshold) {
    return 'improved';
  } else if (newTier.threshold < oldTier.threshold) {
    return 'declined';
  }
  return 'stable';
}

/**
 * Get mood display text for UI
 * @param {string} companionName - Companion name
 * @param {Object} mood - Mood object from getCompanionMood()
 * @param {string} change - Mood change from getMoodChange()
 * @returns {string} Display text for UI
 */
export function getMoodDisplayText(companionName, mood, change) {
  if (change === 'improved') {
    return `${companionName} is now ${mood.label.toLowerCase()}! ${mood.emoji}`;
  } else if (change === 'declined') {
    return `${companionName} is now ${mood.label.toLowerCase()}... ${mood.emoji}`;
  }
  return `${companionName} remains ${mood.label.toLowerCase()} ${mood.emoji}`;
}

/**
 * Get all companions' current moods from state
 * @param {Object} state - Game state
 * @returns {Object} Map of companionId -> { mood, tier }
 */
export function getAllCompanionMoods(state) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  const moods = {};

  for (const companion of companions) {
    const mood = getCompanionMood(companion.loyalty ?? 0);
    moods[companion.id] = {
      name: companion.name,
      mood,
      loyalty: companion.loyalty ?? 0,
      soulbound: !!companion.soulbound,
    };
  }

  return moods;
}

/**
 * Create mood notification for event log
 * @param {string} companionName - Companion name
 * @param {number} oldLoyalty - Previous loyalty
 * @param {number} newLoyalty - New loyalty
 * @returns {string} Notification text for log
 */
export function createMoodNotification(companionName, oldLoyalty, newLoyalty) {
  const oldMood = getCompanionMood(oldLoyalty);
  const newMood = getCompanionMood(newLoyalty);
  const change = getMoodChange(oldLoyalty, newLoyalty);

  if (change === 'improved') {
    return `${companionName}'s mood improved: ${oldMood.emoji} → ${newMood.emoji}`;
  } else if (change === 'declined') {
    return `${companionName}'s mood declined: ${oldMood.emoji} → ${newMood.emoji}`;
  }

  return `${companionName}'s mood: ${newMood.emoji} ${newMood.label}`;
}
