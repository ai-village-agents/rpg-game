/**
 * World Event UI rendering functions.
 * Provides HTML strings for the world event banner and detail panel.
 */

import { hasActiveWorldEvent, getWorldEventBanner } from './world-events.js';

/**
 * Render the world event banner (shown in exploration HUD).
 * Returns an HTML string.
 * @param {object|null} worldEvent
 * @returns {string}
 */
export function renderWorldEventBanner(worldEvent) {
  if (!hasActiveWorldEvent(worldEvent)) return '';
  const remaining = worldEvent.movesRemaining;
  const total = worldEvent.totalMoves;
  const pct = Math.round((remaining / total) * 100);
  const rarityClass = 'world-event-rarity-' + worldEvent.rarity;
  return (
    '<div class="world-event-banner ' + rarityClass + '" data-testid="world-event-banner">' +
    '<span class="world-event-icon">' + worldEvent.icon + '</span>' +
    '<span class="world-event-name">' + worldEvent.name + '</span>' +
    '<span class="world-event-desc">' + worldEvent.description + '</span>' +
    '<div class="world-event-timer">' +
    '<span class="world-event-moves">' + remaining + ' move' + (remaining === 1 ? '' : 's') + ' left</span>' +
    '<div class="world-event-progress-bar">' +
    '<div class="world-event-progress-fill" style="width:' + pct + '%"></div>' +
    '</div>' +
    '</div>' +
    '<button class="world-event-dismiss-btn" data-action="DISMISS_WORLD_EVENT" title="Dismiss">✕</button>' +
    '</div>'
  );
}

/**
 * Render the world event notification (full-screen announcement when event starts).
 * @param {object|null} worldEvent
 * @returns {string}
 */
export function renderWorldEventNotification(worldEvent) {
  if (!worldEvent) return '';
  const rarityClass = 'world-event-rarity-' + worldEvent.rarity;
  return (
    '<div class="world-event-notification ' + rarityClass + '" data-testid="world-event-notification">' +
    '<div class="world-event-notification-inner">' +
    '<div class="world-event-notification-icon">' + worldEvent.icon + '</div>' +
    '<h2 class="world-event-notification-title">World Event!</h2>' +
    '<h3 class="world-event-notification-name">' + worldEvent.name + '</h3>' +
    '<p class="world-event-notification-desc">' + worldEvent.description + '</p>' +
    '<p class="world-event-notification-duration">Lasts ' + worldEvent.totalMoves + ' moves</p>' +
    '<button class="world-event-notification-close" data-action="DISMISS_WORLD_EVENT">Continue</button>' +
    '</div>' +
    '</div>'
  );
}

/**
 * Render a small status badge for the exploration HUD showing active event icon + name.
 * @param {object|null} worldEvent
 * @returns {string}
 */
export function renderWorldEventBadge(worldEvent) {
  if (!hasActiveWorldEvent(worldEvent)) return '';
  return (
    '<span class="world-event-badge world-event-rarity-' + worldEvent.rarity + '" data-testid="world-event-badge">' +
    worldEvent.icon + ' ' + worldEvent.name +
    ' <small>(' + worldEvent.movesRemaining + ')</small>' +
    '</span>'
  );
}

/**
 * Get CSS class names for the world event rarity.
 * @param {object|null} worldEvent
 * @returns {string}
 */
export function getWorldEventClasses(worldEvent) {
  if (!worldEvent) return '';
  return 'world-event world-event-rarity-' + worldEvent.rarity;
}
