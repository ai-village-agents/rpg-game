import { CLASS_DEFINITIONS } from './characters/classes.js';
import { STAT_GROWTH, XP_THRESHOLDS } from './characters/stats.js';
import { WORLD_EVENTS } from './data/world-events.js';
import { items } from './data/items.js';
import { DEFAULT_WORLD_DATA, WorldMap } from './map.js';
import { applyImmediateEffect, createWorldEvent } from './world-events.js';

const DEV_MODE_KEY = 'devMode';
const GOD_MODE_CAP = 9999;
const GOD_MODE_BACKUP_KEY = '__devBackupStats';
const ROOM_COORDS = {
  nw: { row: 0, col: 0 },
  n: { row: 0, col: 1 },
  ne: { row: 0, col: 2 },
  w: { row: 1, col: 0 },
  center: { row: 1, col: 1 },
  e: { row: 1, col: 2 },
  sw: { row: 2, col: 0 },
  s: { row: 2, col: 1 },
  se: { row: 2, col: 2 },
};

function getStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function ensurePlayer(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('State must be an object.');
  }
  if (!state.player || typeof state.player !== 'object') {
    throw new Error('State is missing player data.');
  }
  return state.player;
}

function assertInteger(value, name) {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${name} must be an integer.`);
  }
  return value;
}

function minXpForLevel(level) {
  if (level <= 1) return 0;
  if (level <= XP_THRESHOLDS.length) {
    return XP_THRESHOLDS[level - 1] ?? 0;
  }
  const base = XP_THRESHOLDS[XP_THRESHOLDS.length - 1] ?? 0;
  const extraLevels = level - XP_THRESHOLDS.length;
  return base + (extraLevels * 500);
}

function computeFallbackStats(player, level) {
  const multiplier = 1 + (Math.max(0, level - 1) * 0.05);
  const baseHp = player.maxHp ?? player.hp ?? 1;
  const baseMp = player.maxMp ?? player.mp ?? 0;
  const baseAtk = player.atk ?? 0;
  const baseDef = player.def ?? 0;
  const baseSpd = player.spd ?? 0;
  const baseInt = player.int ?? 0;
  const baseLck = player.lck ?? 0;

  const maxHp = Math.max(1, Math.round(baseHp * multiplier));
  const maxMp = Math.max(0, Math.round(baseMp * multiplier));

  return {
    maxHp,
    hp: maxHp,
    maxMp,
    mp: maxMp,
    atk: Math.max(0, Math.round(baseAtk * multiplier)),
    def: Math.max(0, Math.round(baseDef * multiplier)),
    spd: Math.max(0, Math.round(baseSpd * multiplier)),
    int: Math.max(0, Math.round(baseInt * multiplier)),
    lck: Math.max(0, Math.round(baseLck * multiplier)),
  };
}

function computeStatsForLevel(player, level) {
  const classId = player?.classId;
  const baseStats = classId ? CLASS_DEFINITIONS[classId]?.baseStats : null;
  const growth = classId ? STAT_GROWTH[classId] : null;

  if (baseStats && growth) {
    const stats = { ...baseStats };
    const levelsToApply = Math.max(0, level - 1);
    for (let i = 0; i < levelsToApply; i += 1) {
      stats.maxHp += growth.hp ?? 0;
      stats.hp = stats.maxHp;
      if (typeof stats.maxMp === 'number') {
        stats.maxMp += growth.mp ?? 0;
      } else if (typeof stats.mp === 'number') {
        stats.mp += growth.mp ?? 0;
        stats.maxMp = stats.mp;
      }
      stats.atk += growth.atk ?? 0;
      stats.def += growth.def ?? 0;
      stats.spd += growth.spd ?? 0;
      stats.int = (stats.int ?? 0) + (growth.int ?? 0);
      stats.lck = (stats.lck ?? 0) + (growth.lck ?? 0);
    }
    stats.hp = stats.maxHp;
    stats.mp = stats.maxMp ?? stats.mp ?? 0;
    return stats;
  }

  return computeFallbackStats(player, level);
}

function applyStatBlock(player, stats) {
  const updatedStats = { ...(player.stats || {}) };
  if (typeof stats.maxHp === 'number') updatedStats.maxHp = stats.maxHp;
  if (typeof stats.maxMp === 'number') updatedStats.maxMp = stats.maxMp;
  if (typeof stats.hp === 'number') updatedStats.hp = stats.hp;
  if (typeof stats.mp === 'number') updatedStats.mp = stats.mp;
  if (typeof stats.atk === 'number') updatedStats.atk = stats.atk;
  if (typeof stats.def === 'number') updatedStats.def = stats.def;
  if (typeof stats.spd === 'number') updatedStats.spd = stats.spd;
  if (typeof stats.int === 'number') updatedStats.int = stats.int;
  if (typeof stats.lck === 'number') updatedStats.lck = stats.lck;
  return updatedStats;
}

function resolveWorldData(state) {
  return state?.map?.worldData ?? state?.worldData ?? DEFAULT_WORLD_DATA;
}

function resolveWorldState(state) {
  return state?.map?.worldState ?? state?.world ?? null;
}

function writeWorldState(state, worldState) {
  if (state?.map) {
    return { ...state, world: worldState, map: { ...state.map, worldState } };
  }
  return { ...state, world: worldState };
}

/**
 * Returns true if dev mode is enabled via the global DEV_MODE flag or localStorage.
 * @returns {boolean}
 */
export function isDevMode() {
  const globalFlag = typeof DEV_MODE !== 'undefined' && !!DEV_MODE;
  if (globalFlag) return true;
  const storage = getStorage();
  if (!storage) return false;
  const stored = storage.getItem(DEV_MODE_KEY);
  return stored === 'true' || stored === '1';
}

/**
 * Enable or disable dev mode. Persists to localStorage when available.
 * @param {boolean} enabled
 * @returns {boolean} - The resulting dev mode state.
 */
export function setDevMode(enabled) {
  const flag = Boolean(enabled);
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(DEV_MODE_KEY, flag ? 'true' : 'false');
    } catch {
      // Ignore storage errors in dev utility.
    }
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.DEV_MODE = flag;
  }
  return flag;
}

/**
 * Set the player to a specific level (1-99) and recalculate stats.
 * @param {object} state
 * @param {number} level
 * @returns {object}
 */
export function setPlayerLevel(state, level) {
  const nextLevel = assertInteger(level, 'level');
  if (nextLevel < 1 || nextLevel > 99) {
    throw new Error('Level must be between 1 and 99.');
  }
  const player = ensurePlayer(state);
  const stats = computeStatsForLevel(player, nextLevel);
  const xp = Math.max(player.xp ?? 0, minXpForLevel(nextLevel));
  const nextPlayer = {
    ...player,
    level: nextLevel,
    xp,
    maxHp: stats.maxHp,
    maxMp: stats.maxMp,
    hp: stats.hp,
    mp: stats.mp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    int: stats.int,
    lck: stats.lck,
    stats: applyStatBlock(player, stats),
  };
  return { ...state, player: nextPlayer };
}

/**
 * Set the player's gold to an exact amount (non-negative integer).
 * @param {object} state
 * @param {number} amount
 * @returns {object}
 */
export function setPlayerGold(state, amount) {
  const value = assertInteger(amount, 'amount');
  if (value < 0) {
    throw new Error('Gold amount must be zero or positive.');
  }
  const player = ensurePlayer(state);
  const nextPlayer = { ...player, gold: value };
  return { ...state, player: nextPlayer };
}

/**
 * Add (or remove) gold from the player. Result is clamped to zero.
 * @param {object} state
 * @param {number} amount
 * @returns {object}
 */
export function addGold(state, amount) {
  const delta = assertInteger(amount, 'amount');
  const player = ensurePlayer(state);
  const current = player.gold ?? 0;
  const total = Math.max(0, current + delta);
  const nextPlayer = { ...player, gold: total };
  return { ...state, player: nextPlayer };
}

/**
 * Add an item to the player's inventory (default quantity 1).
 * @param {object} state
 * @param {string} itemId
 * @param {number} [quantity=1]
 * @returns {object}
 */
export function addItem(state, itemId, quantity = 1) {
  if (!itemId || typeof itemId !== 'string') {
    throw new Error('itemId must be a non-empty string.');
  }
  const itemDef = items[itemId];
  if (!itemDef) {
    throw new Error(`Unknown itemId: ${itemId}`);
  }
  const qty = assertInteger(quantity, 'quantity');
  if (qty <= 0) {
    throw new Error('Quantity must be a positive integer.');
  }
  const player = ensurePlayer(state);
  const inventory = { ...(player.inventory || {}) };
  const current = inventory[itemId] ?? 0;
  inventory[itemId] = current + qty;
  const nextPlayer = { ...player, inventory };
  return { ...state, player: nextPlayer };
}

/**
 * Teleport the player to a specific room id (nw, n, ne, w, center, e, sw, s, se).
 * @param {object} state
 * @param {string} roomId
 * @returns {object}
 */
export function teleportToRoom(state, roomId) {
  if (!ROOM_COORDS[roomId]) {
    throw new Error('Invalid roomId: ' + roomId);
  }
  if (!state || typeof state !== 'object') {
    throw new Error('State must be an object.');
  }
  const worldData = resolveWorldData(state);
  const start = worldData.startPosition ?? DEFAULT_WORLD_DATA.startPosition;
  const baseWorld = resolveWorldState(state) || DEFAULT_WORLD_DATA.startPosition;
  const candidate = {
    ...(baseWorld || {}),
    roomRow: ROOM_COORDS[roomId].row,
    roomCol: ROOM_COORDS[roomId].col,
    x: start.x,
    y: start.y,
  };
  const world = new WorldMap(worldData, candidate);
  const worldState = world.snapshot();
  return writeWorldState(state, worldState);
}

/**
 * Manually trigger a world event by id.
 * @param {object} state
 * @param {string} eventId
 * @returns {object}
 */
export function triggerWorldEvent(state, eventId) {
  if (!eventId || typeof eventId !== 'string') {
    throw new Error('eventId must be a string.');
  }
  if (!WORLD_EVENTS[eventId]) {
    throw new Error('Unknown world event: ' + eventId);
  }
  const seed = Number.isFinite(state?.rngSeed) ? state.rngSeed : Date.now();
  const worldEvent = createWorldEvent(eventId, seed);
  const nextState = { ...state, worldEvent };
  return applyImmediateEffect(nextState, worldEvent);
}

/**
 * Clear any active world event.
 * @param {object} state
 * @returns {object}
 */
export function clearWorldEvent(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('State must be an object.');
  }
  return { ...state, worldEvent: null };
}

/**
 * Toggle god mode on the player (HP/MP set to 9999 while enabled).
 * @param {object} state
 * @returns {object}
 */
export function toggleGodMode(state) {
  const player = ensurePlayer(state);
  if (player.godMode) {
    const backup = player[GOD_MODE_BACKUP_KEY];
    const maxHp = backup?.maxHp ?? player.maxHp ?? player.hp ?? GOD_MODE_CAP;
    const maxMp = backup?.maxMp ?? player.maxMp ?? player.mp ?? GOD_MODE_CAP;
    const hp = Math.min(backup?.hp ?? player.hp ?? maxHp, maxHp);
    const mp = Math.min(backup?.mp ?? player.mp ?? maxMp, maxMp);
    const nextPlayer = {
      ...player,
      godMode: false,
      maxHp,
      maxMp,
      hp,
      mp,
      stats: applyStatBlock(player, { maxHp, maxMp, hp, mp }),
    };
    const { [GOD_MODE_BACKUP_KEY]: _removed, ...cleanPlayer } = nextPlayer;
    return { ...state, player: cleanPlayer };
  }

  const backup = {
    maxHp: player.maxHp ?? player.hp ?? GOD_MODE_CAP,
    hp: player.hp ?? player.maxHp ?? GOD_MODE_CAP,
    maxMp: player.maxMp ?? player.mp ?? GOD_MODE_CAP,
    mp: player.mp ?? player.maxMp ?? GOD_MODE_CAP,
  };

  const nextPlayer = {
    ...player,
    godMode: true,
    maxHp: GOD_MODE_CAP,
    maxMp: GOD_MODE_CAP,
    hp: GOD_MODE_CAP,
    mp: GOD_MODE_CAP,
    [GOD_MODE_BACKUP_KEY]: backup,
    stats: applyStatBlock(player, {
      maxHp: GOD_MODE_CAP,
      maxMp: GOD_MODE_CAP,
      hp: GOD_MODE_CAP,
      mp: GOD_MODE_CAP,
    }),
  };

  return { ...state, player: nextPlayer };
}

/**
 * Fully restore the player's HP/MP to maximum values.
 * @param {object} state
 * @returns {object}
 */
export function fullRestore(state) {
  const player = ensurePlayer(state);
  const maxHp = player.maxHp ?? player.hp ?? 0;
  const maxMp = player.maxMp ?? player.mp ?? 0;
  const nextPlayer = {
    ...player,
    hp: maxHp,
    mp: maxMp,
    stats: applyStatBlock(player, { hp: maxHp, mp: maxMp }),
  };
  return { ...state, player: nextPlayer };
}
