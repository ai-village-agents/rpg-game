/**
 * Companion Loyalty Events — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Triggers special events when companion loyalty crosses key thresholds.
 * Each companion has personalised flavor text and unique rewards.
 */

import { pushLog } from './state.js';
import { dismissCompanion, getCompanionById } from './companions.js';
import { addJournalEntry, JOURNAL_CATEGORIES } from './journal.js';

/** Loyalty tier definitions (ascending order). */
export const LOYALTY_TIERS = [
  { name: 'Abandoned',   threshold: 0,   label: 'Will leave' },
  { name: 'Discontent',  threshold: 10,  label: 'Unhappy' },
  { name: 'Neutral',     threshold: 25,  label: 'Indifferent' },
  { name: 'Friendly',    threshold: 50,  label: 'Warming up' },
  { name: 'Devoted',     threshold: 75,  label: 'Loyal' },
  { name: 'Soulbound',   threshold: 100, label: 'Unbreakable bond' },
];

/** Ordered tier names (ascending) — single source of truth for tier comparisons. */
export const LOYALTY_TIER_ORDER = LOYALTY_TIERS.map(t => t.name);

/**
 * Get the index of the loyalty tier for a given loyalty value.
 * Uses LOYALTY_TIER_ORDER as the single source of truth.
 * @param {number} loyalty - Current loyalty (0-100).
 * @returns {number} Tier index (0 = Abandoned, 5 = Soulbound).
 */
export function getLoyaltyTierIndex(loyalty) {
  const tier = getLoyaltyTier(loyalty);
  return LOYALTY_TIER_ORDER.indexOf(tier.name);
}

/**
 * Get the loyalty tier for a given loyalty value.
 * @param {number} loyalty - Current loyalty (0-100).
 * @returns {{ name: string, threshold: number, label: string }}
 */
export function getLoyaltyTier(loyalty) {
  const val = typeof loyalty === 'number' ? loyalty : 0;
  let tier = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) {
    if (val >= t.threshold) tier = t;
  }
  return tier;
}

/**
 * Companion-specific flavor text for each loyalty event.
 * Keys are companion IDs, values map tier names to event descriptions.
 */
export const COMPANION_EVENT_TEXT = {
  fenris: {
    Abandoned:  '{name} grumbles, "I didn\'t sign up for this," and walks away.',
    Discontent: '{name} crosses his arms. "We need to talk about how things are going."',
    Neutral:    '{name} nods curtly. "I\'ll follow your lead... for now."',
    Friendly:   '{name} sits by the campfire and tells you about his hometown.',
    Devoted:    '{name} grins. "You\'ve earned my blade. Let me show you a move I\'ve been saving."',
    Soulbound:  '{name} clasps your forearm. "I\'ll fight beside you to the end. Always."',
  },
  lyra: {
    Abandoned:  '{name} closes her spellbook with a snap and vanishes in a shimmer of light.',
    Discontent: '{name} frowns at her scrolls. "This arrangement isn\'t working for me."',
    Neutral:    '{name} studies you curiously. "You\'re an interesting leader, I\'ll give you that."',
    Friendly:   '{name} shares the story of how she discovered her magic as a child.',
    Devoted:    '{name}\'s eyes glow softly. "I trust you. Let me teach you a protective ward."',
    Soulbound:  '{name} weaves a glowing sigil between you. "Our fates are linked now. Together, always."',
  },
};

/** Default fallback text when companion ID has no personalised text. */
const DEFAULT_EVENT_TEXT = {
  Abandoned:  '{name} shakes their head and leaves the party.',
  Discontent: '{name} seems unhappy with your leadership.',
  Neutral:    '{name} regards you with a neutral expression.',
  Friendly:   '{name} opens up and shares a personal story.',
  Devoted:    '{name} pledges deep loyalty and offers to teach you something.',
  Soulbound:  '{name} forms an unbreakable bond with you.',
};

/**
 * Get the event text for a companion and tier.
 * @param {string} companionId
 * @param {string} tierName
 * @param {string} companionName - Display name for {name} replacement.
 * @returns {string}
 */
export function getEventText(companionId, tierName, companionName) {
  const personalised = COMPANION_EVENT_TEXT[companionId];
  const template = (personalised && personalised[tierName])
    || DEFAULT_EVENT_TEXT[tierName]
    || '{name} experiences a change in loyalty.';
  return template.replace(/\{name\}/g, companionName || companionId);
}

/**
 * Loyalty effects granted at each tier.
 * Effects are cumulative — higher tiers include lower tier effects.
 */
export const LOYALTY_EFFECTS = {
  Abandoned:  { attackMod: 0, defenseMod: 0, leaves: true },
  Discontent: { attackMod: -1, defenseMod: 0, leaves: false },
  Neutral:    { attackMod: 0, defenseMod: 0, leaves: false },
  Friendly:   { attackMod: 1, defenseMod: 0, leaves: false },
  Devoted:    { attackMod: 2, defenseMod: 1, leaves: false, unlocksAbility: true },
  Soulbound:  { attackMod: 3, defenseMod: 2, leaves: false, unlocksAbility: true, loyaltyFloor: 25 },
};

/**
 * Get the loyalty effects for a companion at a given loyalty level.
 * @param {number} loyalty
 * @returns {{ attackMod: number, defenseMod: number, leaves: boolean, unlocksAbility?: boolean, loyaltyFloor?: number }}
 */
export function getLoyaltyEffects(loyalty) {
  const tier = getLoyaltyTier(loyalty);
  return { ...(LOYALTY_EFFECTS[tier.name] || LOYALTY_EFFECTS.Neutral) };
}

/**
 * Detect which loyalty thresholds were crossed between old and new values.
 * @param {number} oldLoyalty
 * @param {number} newLoyalty
 * @returns {Array<{ tier: object, direction: 'up'|'down' }>}
 */
export function detectThresholdCrossings(oldLoyalty, newLoyalty) {
  const oldVal = typeof oldLoyalty === 'number' ? oldLoyalty : 0;
  const newVal = typeof newLoyalty === 'number' ? newLoyalty : 0;
  if (oldVal === newVal) return [];

  const crossings = [];
  for (const tier of LOYALTY_TIERS) {
    const t = tier.threshold;
    if (t === 0) {
      // Special handling for Abandoned (threshold 0):
      // Detect reaching exactly 0 as a downward crossing.
      if (oldVal > 0 && newVal <= 0) {
        crossings.push({ tier, direction: 'down' });
      } else if (oldVal <= 0 && newVal > 0) {
        crossings.push({ tier, direction: 'up' });
      }
    } else {
      if (oldVal < t && newVal >= t) {
        crossings.push({ tier, direction: 'up' });
      } else if (oldVal >= t && newVal < t) {
        crossings.push({ tier, direction: 'down' });
      }
    }
  }
  return crossings;
}

/**
 * Process loyalty events after a loyalty change.
 * Returns the updated state with log messages, journal entries, and side effects.
 *
 * @param {Object} state - Game state (must already have the new loyalty value set).
 * @param {string} companionId - Companion whose loyalty changed.
 * @param {number} oldLoyalty - Previous loyalty value.
 * @param {number} newLoyalty - New loyalty value.
 * @returns {Object} Updated state.
 */
export function processLoyaltyEvents(state, companionId, oldLoyalty, newLoyalty) {
  const crossings = detectThresholdCrossings(oldLoyalty, newLoyalty);
  if (crossings.length === 0) return state;

  const companion = getCompanionById(state, companionId);
  const name = companion ? companion.name : companionId;
  let working = state;

  for (const { tier, direction } of crossings) {
    const text = getEventText(companionId, tier.name, name);
    working = pushLog(working, text);

    // Add journal entry for significant events
    if (tier.name !== 'Neutral') {
      const journalTitle = direction === 'up'
        ? `${name}: ${tier.label}`
        : `${name}: Lost ${tier.label} status`;
      working = addJournalEntry(
        working,
        JOURNAL_CATEGORIES.MILESTONES,
        journalTitle,
        text,
        { isImportant: tier.name === 'Soulbound' || tier.name === 'Abandoned' }
      );
    }

    // Handle abandonment — companion leaves
    if (tier.name === 'Abandoned' && direction === 'down') {
      // Loyalty hit 0, companion departs
      working = dismissCompanion(working, companionId);
    }

    // Handle Soulbound loyalty floor
    if (tier.name === 'Soulbound' && direction === 'up') {
      // Mark companion as soulbound (prevents loyalty from dropping below 25)
      const companions = Array.isArray(working.companions) ? working.companions : [];
      working = {
        ...working,
        companions: companions.map(c =>
          c.id === companionId ? { ...c, soulbound: true } : c
        ),
      };
    }
  }

  return working;
}

/**
 * Enhanced adjustLoyalty that triggers loyalty events.
 * Use this instead of the base adjustLoyalty when you want events to fire.
 *
 * @param {Object} state - Current game state.
 * @param {string} companionId - Companion ID.
 * @param {number} amount - Loyalty change amount (positive or negative).
 * @returns {Object} Updated state with events processed.
 */
export function adjustLoyaltyWithEvents(state, companionId, amount) {
  const companions = Array.isArray(state.companions) ? state.companions : [];
  const companion = companions.find(c => c.id === companionId);
  if (!companion) return state;

  const oldLoyalty = companion.loyalty ?? 0;

  // Respect soulbound loyalty floor
  const floor = companion.soulbound ? 25 : 0;
  const newLoyalty = Math.max(floor, Math.min(100, oldLoyalty + amount));

  if (newLoyalty === oldLoyalty) return state;

  // Apply the loyalty change
  const updated = { ...companion, loyalty: newLoyalty };
  let working = {
    ...state,
    companions: companions.map(c => c.id === companionId ? updated : c),
  };

  // Process threshold events
  working = processLoyaltyEvents(working, companionId, oldLoyalty, newLoyalty);

  return working;
}

/**
 * Get a summary of all active loyalty effects for a companion.
 * @param {Object} state
 * @param {string} companionId
 * @returns {{ tier: object, effects: object } | null}
 */
export function getCompanionLoyaltySummary(state, companionId) {
  const companion = getCompanionById(state, companionId);
  if (!companion) return null;

  const tier = getLoyaltyTier(companion.loyalty ?? 0);
  const effects = getLoyaltyEffects(companion.loyalty ?? 0);
  return { tier, effects, soulbound: !!companion.soulbound };
}
