import { on, emit, saveToSlot, loadFromSlot } from './engine.js';
import { getCurrentRoom } from './map.js';

/** Auto-save slot reserved for system-managed saves. */
export const AUTOSAVE_SLOT = 4;

/** Allowed auto-save event triggers. */
export const AUTO_SAVE_TRIGGERS = [
  'room_change',
  'combat_victory',
  'quest_complete',
  'item_acquired',
  'level_up'
];

let autoSaveEnabled = true;
const autoSaveHandlers = new Map();

/**
 * Enable automatic saving.
 * @returns {boolean} True when auto-save is enabled.
 */
export function enableAutoSave() {
  autoSaveEnabled = true;
  emit('autosave:enabled', { enabled: true });
  return autoSaveEnabled;
}

/**
 * Disable automatic saving.
 * @returns {boolean} False when auto-save is disabled.
 */
export function disableAutoSave() {
  autoSaveEnabled = false;
  emit('autosave:disabled', { enabled: false });
  return autoSaveEnabled;
}

/**
 * Check if auto-save is currently enabled.
 * @returns {boolean}
 */
export function isAutoSaveEnabled() {
  return autoSaveEnabled;
}

/**
 * Create standardized metadata for a save slot.
 * @param {object} state - Game state snapshot.
 * @returns {object} Metadata object for display and auditing.
 */
export function createSaveMetadata(state) {
  const savedAt = new Date().toISOString();
  const player = state?.player ?? {};
  const room = resolveLocation(state);

  return {
    savedAt,
    playerName: player.name ?? 'Unknown Hero',
    playerLevel: player.level ?? player?.stats?.level ?? 1,
    playerClass: player.classId ?? player.class ?? 'Adventurer',
    turn: typeof state?.turn === 'number' ? state.turn : 0,
    gold: player.gold ?? state?.gold ?? 0,
    location: room,
    playTime: state?.playTime ?? state?.stats?.playTime ?? 0,
    version: state?.version ?? 1
  };
}

/**
 * Format an ISO timestamp into a readable string.
 * @param {string} isoString
 * @returns {string} e.g., "Mar 9, 2026 10:15 AM"
 */
export function formatSaveTimestamp(isoString) {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Persist an auto-save to the reserved slot with metadata.
 * @param {object} state - Game state to persist.
 * @param {string} reason - Reason for auto-save (event name).
 * @returns {{success: boolean, error: string|null}}
 */
export function triggerAutoSave(state, reason = 'auto') {
  if (!autoSaveEnabled) {
    return { success: false, error: 'Auto-save is disabled.' };
  }
  if (!state || typeof state !== 'object') {
    return { success: false, error: 'No game state provided.' };
  }

  const normalizedReason = AUTO_SAVE_TRIGGERS.includes(reason) ? reason : String(reason);
  const metadata = createSaveMetadata(state);
  const payload = {
    ...state,
    autoSave: true,
    autoSaveReason: normalizedReason,
    saveMetadata: { ...metadata, reason: normalizedReason }
  };

  const saved = saveToSlot(payload, AUTOSAVE_SLOT);
  if (saved) {
    emit('autosave:completed', { slotIndex: AUTOSAVE_SLOT, reason: normalizedReason, metadata });
  }
  return { success: saved, error: saved ? null : 'Auto-save failed.' };
}

/**
 * Export a save slot to a pretty-printed JSON string.
 * @param {number} slotIndex
 * @returns {string|null} JSON or null if missing/invalid slot.
 */
export function exportSaveToJSON(slotIndex = 0) {
  if (!isValidSlot(slotIndex)) return null;
  const data = loadFromSlot(slotIndex);
  if (!data) return null;
  return JSON.stringify(data, null, 2);
}

/**
 * Validate incoming save data for required fields.
 * @param {object} data
 * @returns {{valid: boolean, missing: string[]}}
 */
export function validateSaveData(data) {
  const missing = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, missing: ['player', 'turn', 'version'] };
  }
  if (!data.player) missing.push('player');
  if (data.turn === undefined) missing.push('turn');
  if (data.version === undefined) missing.push('version');
  return { valid: missing.length === 0, missing };
}

/**
 * Import save data from a JSON string into a slot.
 * @param {string} jsonString
 * @param {number} slotIndex
 * @returns {{success: boolean, error: string|null}}
 */
export function importSaveFromJSON(jsonString, slotIndex = 0) {
  if (!isValidSlot(slotIndex)) {
    return { success: false, error: 'Invalid slot index.' };
  }
  if (typeof jsonString !== 'string') {
    return { success: false, error: 'Invalid JSON input.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { success: false, error: 'Failed to parse JSON.' };
  }

  const validation = validateSaveData(parsed);
  if (!validation.valid) {
    return { success: false, error: `Missing required fields: ${validation.missing.join(', ')}` };
  }

  const saved = saveToSlot(parsed, slotIndex);
  return { success: saved, error: saved ? null : 'Save import failed.' };
}

/**
 * Rename a save slot by applying a customName field.
 * @param {number} slotIndex
 * @param {string} newName
 * @returns {{success: boolean, error: string|null}}
 */
export function renameSave(slotIndex, newName) {
  if (!isValidSlot(slotIndex)) {
    return { success: false, error: 'Invalid slot index.' };
  }
  const data = loadFromSlot(slotIndex);
  if (!data) {
    return { success: false, error: 'No save data found for this slot.' };
  }
  const trimmed = typeof newName === 'string' ? newName.trim() : '';
  const renamed = { ...data, customName: trimmed };
  const saved = saveToSlot(renamed, slotIndex);
  if (saved) emit('save:renamed', { slotIndex, customName: trimmed });
  return { success: saved, error: saved ? null : 'Failed to rename save.' };
}

function isValidSlot(slotIndex) {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex <= AUTOSAVE_SLOT;
}

function resolveLocation(state) {
  try {
    const room = getCurrentRoom(state?.world);
    return room?.name ?? room?.id ?? 'Unknown Location';
  } catch {
    return 'Unknown Location';
  }
}

function registerAutoSaveListeners() {
  if (autoSaveHandlers.size > 0) return;
  AUTO_SAVE_TRIGGERS.forEach((eventName) => {
    const handler = (payload = {}) => {
      const state = payload.state ?? payload.gameState ?? payload;
      triggerAutoSave(state, payload.reason ?? eventName);
    };
    autoSaveHandlers.set(eventName, handler);
    on(eventName, handler);
  });
}

registerAutoSaveListeners();
