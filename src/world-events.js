/**
 * World Event System logic module.
 * Handles triggering, applying, ticking, and querying world events.
 */

import { WORLD_EVENTS, EVENT_POOL, WORLD_EVENT_TRIGGER_CHANCE } from './data/world-events.js';

/**
 * Pick a random event ID from the weighted EVENT_POOL using a seed.
 * Uses a simple LCG PRNG derived from the seed.
 * @param {number} seed
 * @returns {string} eventId
 */
export function pickRandomEvent(seed) {
  const idx = Math.abs(seed) % EVENT_POOL.length;
  return EVENT_POOL[idx];
}

/**
 * Determine how many moves this event lasts.
 * @param {object} eventDef
 * @param {number} seed
 * @returns {number}
 */
export function rollEventDuration(eventDef, seed) {
  const range = eventDef.maxMoves - eventDef.minMoves + 1;
  return eventDef.minMoves + (Math.abs(seed) % range);
}

/**
 * Create a new active world event state object.
 * @param {string} eventId
 * @param {number} seed - used for duration randomness
 * @returns {object} worldEvent state
 */
export function createWorldEvent(eventId, seed) {
  const def = WORLD_EVENTS[eventId];
  if (!def) throw new Error('Unknown world event: ' + eventId);
  const duration = rollEventDuration(def, seed);
  return {
    eventId: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    effect: { ...def.effect },
    movesRemaining: duration,
    totalMoves: duration,
    rarity: def.rarity,
  };
}

/**
 * Try to trigger a world event on room move.
 * Returns the new worldEvent object if triggered, null otherwise.
 * @param {number} seed - current rng seed value (used for probability and selection)
 * @param {object|null} currentEvent - existing active event (null if none)
 * @returns {object|null}
 */
export function tryTriggerWorldEvent(seed, currentEvent) {
  // Don't trigger if an event is already active
  if (currentEvent && currentEvent.movesRemaining > 0) return null;

  // Use seed to determine if event fires
  const roll = (Math.abs(seed * 1103515245 + 12345) % 10000) / 10000;
  if (roll >= WORLD_EVENT_TRIGGER_CHANCE) return null;

  // Pick event
  const selectionSeed = Math.abs(seed * 6364136223846793005 + 1442695040888963407) % EVENT_POOL.length;
  const eventId = EVENT_POOL[selectionSeed];
  const durationSeed = Math.abs(seed ^ (seed >> 17));
  return createWorldEvent(eventId, durationSeed);
}

/**
 * Tick the world event after a room move (decrement movesRemaining).
 * Returns null when the event expires.
 * @param {object|null} worldEvent
 * @returns {object|null}
 */
export function tickWorldEvent(worldEvent) {
  if (!worldEvent) return null;
  const remaining = worldEvent.movesRemaining - 1;
  if (remaining <= 0) return null;
  return { ...worldEvent, movesRemaining: remaining };
}

/**
 * Apply immediate effects of an event to the game state (e.g., full_restore).
 * Returns modified state.
 * @param {object} state
 * @param {object} worldEvent
 * @returns {object}
 */
export function applyImmediateEffect(state, worldEvent) {
  if (!worldEvent) return state;
  const { effect } = worldEvent;
  if (effect.type === 'full_restore') {
    return {
      ...state,
      player: {
        ...state.player,
        hp: state.player.maxHp,
        mp: state.player.maxMp ?? state.player.mp,
      },
    };
  }
  return state;
}

/**
 * Apply per-move effects (e.g., heal_on_move).
 * @param {object} state
 * @param {object|null} worldEvent
 * @returns {object}
 */
export function applyPerMoveEffect(state, worldEvent) {
  if (!worldEvent) return state;
  const { effect } = worldEvent;
  if (effect.type === 'heal_on_move') {
    const healAmount = Math.floor(state.player.maxHp * effect.value);
    const newHp = Math.min(state.player.maxHp, state.player.hp + healAmount);
    return {
      ...state,
      player: { ...state.player, hp: newHp },
    };
  }
  return state;
}

/**
 * Get the effective encounter rate given an active world event.
 * @param {number} baseRate
 * @param {object|null} worldEvent
 * @returns {number}
 */
export function getEffectiveEncounterRate(baseRate, worldEvent) {
  if (!worldEvent) return baseRate;
  if (worldEvent.effect.type === 'encounter_rate_multiplier') {
    return Math.min(1.0, baseRate * worldEvent.effect.value);
  }
  return baseRate;
}

/**
 * Get the effective gold multiplier given an active world event.
 * @param {object|null} worldEvent
 * @returns {number}
 */
export function getGoldMultiplier(worldEvent) {
  if (!worldEvent) return 1.0;
  if (worldEvent.effect.type === 'gold_multiplier') {
    return worldEvent.effect.value;
  }
  return 1.0;
}

/**
 * Get the effective damage multiplier given an active world event.
 * @param {object|null} worldEvent
 * @returns {number}
 */
export function getDamageMultiplier(worldEvent) {
  if (!worldEvent) return 1.0;
  if (worldEvent.effect.type === 'damage_multiplier') {
    return worldEvent.effect.value;
  }
  return 1.0;
}

/**
 * Get the effective shop discount given an active world event.
 * Returns a fraction to subtract from price (0 = no discount).
 * @param {object|null} worldEvent
 * @returns {number}
 */
export function getShopDiscount(worldEvent) {
  if (!worldEvent) return 0;
  if (worldEvent.effect.type === 'shop_discount') {
    return worldEvent.effect.value;
  }
  return 0;
}

/**
 * Get the effective MP cost multiplier given an active world event.
 * @param {object|null} worldEvent
 * @returns {number}
 */
export function getMpCostMultiplier(worldEvent) {
  if (!worldEvent) return 1.0;
  if (worldEvent.effect.type === 'mp_cost_multiplier') {
    return worldEvent.effect.value;
  }
  return 1.0;
}

/**
 * Whether the minimap should be hidden given active world event.
 * @param {object|null} worldEvent
 * @returns {boolean}
 */
export function isMinimapHidden(worldEvent) {
  if (!worldEvent) return false;
  return worldEvent.effect.type === 'hide_minimap' && worldEvent.effect.value === true;
}

/**
 * Check if there is an active world event.
 * @param {object|null} worldEvent
 * @returns {boolean}
 */
export function hasActiveWorldEvent(worldEvent) {
  return !!(worldEvent && worldEvent.movesRemaining > 0);
}

/**
 * Get a short status string for the world event banner.
 * @param {object|null} worldEvent
 * @returns {string|null}
 */
export function getWorldEventBanner(worldEvent) {
  if (!hasActiveWorldEvent(worldEvent)) return null;
  const remaining = worldEvent.movesRemaining;
  const plural = remaining === 1 ? 'move' : 'moves';
  return worldEvent.icon + ' ' + worldEvent.name + ' (' + remaining + ' ' + plural + ' remaining)';
}
