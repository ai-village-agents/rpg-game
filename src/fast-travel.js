/**
 * Fast Travel System
 *
 * Allows players to instantly travel to previously visited rooms.
 * Must have visited a room at least once before fast travel is unlocked.
 */

import { MINIMAP_ROOM_ID_MAP, ROOM_NAMES, ROOM_DANGER_LEVEL, DANGER_LABELS } from './minimap.js';

/**
 * Get all rooms that the player has visited and can fast travel to.
 * @param {Array} visitedRooms - Array of [row, col] pairs representing visited rooms
 * @returns {Array} Array of { id, name, row, col, dangerLevel, dangerLabel }
 */
export function getUnlockedFastTravelDestinations(visitedRooms) {
  if (!visitedRooms || !Array.isArray(visitedRooms)) {
    return [];
  }

  const destinations = [];
  
  for (const [row, col] of visitedRooms) {
    const roomId = MINIMAP_ROOM_ID_MAP[row]?.[col];
    if (!roomId) continue;
    
    const name = ROOM_NAMES[roomId] || roomId;
    const dangerLevel = ROOM_DANGER_LEVEL[roomId] ?? 1;
    const dangerLabel = DANGER_LABELS[dangerLevel] || 'Unknown';
    
    destinations.push({
      id: roomId,
      name,
      row,
      col,
      dangerLevel,
      dangerLabel,
    });
  }
  
  // Sort by danger level (safest first), then alphabetically
  destinations.sort((a, b) => {
    if (a.dangerLevel !== b.dangerLevel) {
      return a.dangerLevel - b.dangerLevel;
    }
    return a.name.localeCompare(b.name);
  });
  
  return destinations;
}

/**
 * Check if a specific room is unlocked for fast travel.
 * @param {Array} visitedRooms - Array of [row, col] pairs
 * @param {string} roomId - The room ID to check (e.g., 'center', 'nw')
 * @returns {boolean}
 */
export function isRoomUnlockedForFastTravel(visitedRooms, roomId) {
  if (!visitedRooms || !Array.isArray(visitedRooms)) return false;
  
  for (let row = 0; row < MINIMAP_ROOM_ID_MAP.length; row++) {
    for (let col = 0; col < MINIMAP_ROOM_ID_MAP[row].length; col++) {
      if (MINIMAP_ROOM_ID_MAP[row][col] === roomId) {
        return visitedRooms.some(([r, c]) => r === row && c === col);
      }
    }
  }
  return false;
}

/**
 * Get the row/col coordinates for a room ID.
 * @param {string} roomId - The room ID (e.g., 'center', 'nw')
 * @returns {{ row: number, col: number } | null}
 */
export function getRoomCoordinates(roomId) {
  for (let row = 0; row < MINIMAP_ROOM_ID_MAP.length; row++) {
    for (let col = 0; col < MINIMAP_ROOM_ID_MAP[row].length; col++) {
      if (MINIMAP_ROOM_ID_MAP[row][col] === roomId) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Execute fast travel to a destination room.
 * Updates the world state to place the player in the center of the target room.
 * @param {Object} worldState - Current world state
 * @param {string} destinationRoomId - Target room ID
 * @returns {{ worldState: Object, success: boolean, message: string }}
 */
export function executeFastTravel(worldState, destinationRoomId) {
  const coords = getRoomCoordinates(destinationRoomId);
  if (!coords) {
    return {
      worldState,
      success: false,
      message: `Unknown destination: ${destinationRoomId}`,
    };
  }
  
  const roomName = ROOM_NAMES[destinationRoomId] || destinationRoomId;
  
  // Place player in center of the room
  const newWorldState = {
    ...worldState,
    roomRow: coords.row,
    roomCol: coords.col,
    x: 8,  // Center of 16-wide room
    y: 6,  // Center of 12-tall room
  };
  
  return {
    worldState: newWorldState,
    success: true,
    message: `You fast travel to ${roomName}.`,
  };
}

/**
 * Check if player can currently use fast travel.
 * Fast travel is only available during exploration phase and when not in combat.
 * @param {Object} state - Game state
 * @returns {{ canTravel: boolean, reason: string | null }}
 */
export function canUseFastTravel(state) {
  if (state.phase !== 'exploration') {
    return { canTravel: false, reason: 'Fast travel is only available during exploration.' };
  }
  
  const destinations = getUnlockedFastTravelDestinations(state.visitedRooms);
  if (destinations.length === 0) {
    return { canTravel: false, reason: 'You have not discovered any locations to travel to.' };
  }
  
  return { canTravel: true, reason: null };
}
