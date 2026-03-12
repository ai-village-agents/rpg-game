import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getUnlockedFastTravelDestinations,
  isRoomUnlockedForFastTravel,
  getRoomCoordinates,
  executeFastTravel,
  canUseFastTravel,
} from '../src/fast-travel.js';

describe('Fast Travel System', () => {
  describe('getUnlockedFastTravelDestinations', () => {
    it('should return empty array for null visitedRooms', () => {
      const result = getUnlockedFastTravelDestinations(null);
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for undefined visitedRooms', () => {
      const result = getUnlockedFastTravelDestinations(undefined);
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for non-array visitedRooms', () => {
      const result = getUnlockedFastTravelDestinations('not an array');
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for empty visitedRooms', () => {
      const result = getUnlockedFastTravelDestinations([]);
      assert.deepStrictEqual(result, []);
    });

    it('should return single destination for one visited room', () => {
      const visitedRooms = [[1, 1]]; // center
      const result = getUnlockedFastTravelDestinations(visitedRooms);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'center');
      assert.equal(result[0].name, 'Village Square');
      assert.equal(result[0].row, 1);
      assert.equal(result[0].col, 1);
      assert.equal(result[0].dangerLevel, 0);
      assert.equal(result[0].dangerLabel, 'Safe');
    });

    it('should return multiple destinations sorted by danger level', () => {
      const visitedRooms = [[2, 0], [1, 1], [0, 1]]; // sw (danger 3), center (danger 0), n (danger 1)
      const result = getUnlockedFastTravelDestinations(visitedRooms);
      assert.equal(result.length, 3);
      // Should be sorted: center (0), n (1), sw (3)
      assert.equal(result[0].id, 'center');
      assert.equal(result[0].dangerLevel, 0);
      assert.equal(result[1].id, 'n');
      assert.equal(result[1].dangerLevel, 1);
      assert.equal(result[2].id, 'sw');
      assert.equal(result[2].dangerLevel, 3);
    });

    it('should sort alphabetically when danger levels are equal', () => {
      const visitedRooms = [[1, 2], [0, 2], [0, 0]]; // e (danger 2), ne (danger 2), nw (danger 2)
      const result = getUnlockedFastTravelDestinations(visitedRooms);
      assert.equal(result.length, 3);
      // All danger 2, sorted alphabetically: Eastern Fields, Northeast Ridge, Northwest Grove
      assert.equal(result[0].name, 'Eastern Fields');
      assert.equal(result[1].name, 'Northeast Ridge');
      assert.equal(result[2].name, 'Northwest Grove');
    });

    it('should skip invalid room coordinates', () => {
      const visitedRooms = [[1, 1], [99, 99], [-1, -1]]; // only center is valid
      const result = getUnlockedFastTravelDestinations(visitedRooms);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'center');
    });

    it('should include danger labels for all danger levels', () => {
      const visitedRooms = [[1, 1], [0, 1], [1, 2], [2, 0]]; // center, n, e, sw
      const result = getUnlockedFastTravelDestinations(visitedRooms);
      const labels = result.map(d => d.dangerLabel);
      assert.ok(labels.includes('Safe'));      // danger 0
      assert.ok(labels.includes('Low risk'));       // danger 1
      assert.ok(labels.includes('Dangerous'));    // danger 2
      assert.ok(labels.includes('Very dangerous'));      // danger 3
    });
  });

  describe('isRoomUnlockedForFastTravel', () => {
    it('should return false for null visitedRooms', () => {
      const result = isRoomUnlockedForFastTravel(null, 'center');
      assert.equal(result, false);
    });

    it('should return false for undefined visitedRooms', () => {
      const result = isRoomUnlockedForFastTravel(undefined, 'center');
      assert.equal(result, false);
    });

    it('should return false for non-array visitedRooms', () => {
      const result = isRoomUnlockedForFastTravel({}, 'center');
      assert.equal(result, false);
    });

    it('should return true for visited center room', () => {
      const visitedRooms = [[1, 1]];
      const result = isRoomUnlockedForFastTravel(visitedRooms, 'center');
      assert.equal(result, true);
    });

    it('should return false for unvisited room', () => {
      const visitedRooms = [[1, 1]]; // only center visited
      const result = isRoomUnlockedForFastTravel(visitedRooms, 'nw');
      assert.equal(result, false);
    });

    it('should return true for visited corner rooms', () => {
      const visitedRooms = [[0, 0], [0, 2], [2, 0], [2, 2]]; // nw, ne, sw, se
      assert.equal(isRoomUnlockedForFastTravel(visitedRooms, 'nw'), true);
      assert.equal(isRoomUnlockedForFastTravel(visitedRooms, 'ne'), true);
      assert.equal(isRoomUnlockedForFastTravel(visitedRooms, 'sw'), true);
      assert.equal(isRoomUnlockedForFastTravel(visitedRooms, 'se'), true);
    });

    it('should return false for unknown room ID', () => {
      const visitedRooms = [[1, 1]];
      const result = isRoomUnlockedForFastTravel(visitedRooms, 'unknown_room');
      assert.equal(result, false);
    });
  });

  describe('getRoomCoordinates', () => {
    it('should return correct coordinates for center', () => {
      const result = getRoomCoordinates('center');
      assert.deepStrictEqual(result, { row: 1, col: 1 });
    });

    it('should return correct coordinates for nw', () => {
      const result = getRoomCoordinates('nw');
      assert.deepStrictEqual(result, { row: 0, col: 0 });
    });

    it('should return correct coordinates for ne', () => {
      const result = getRoomCoordinates('ne');
      assert.deepStrictEqual(result, { row: 0, col: 2 });
    });

    it('should return correct coordinates for sw', () => {
      const result = getRoomCoordinates('sw');
      assert.deepStrictEqual(result, { row: 2, col: 0 });
    });

    it('should return correct coordinates for se', () => {
      const result = getRoomCoordinates('se');
      assert.deepStrictEqual(result, { row: 2, col: 2 });
    });

    it('should return correct coordinates for n', () => {
      const result = getRoomCoordinates('n');
      assert.deepStrictEqual(result, { row: 0, col: 1 });
    });

    it('should return correct coordinates for s', () => {
      const result = getRoomCoordinates('s');
      assert.deepStrictEqual(result, { row: 2, col: 1 });
    });

    it('should return correct coordinates for e', () => {
      const result = getRoomCoordinates('e');
      assert.deepStrictEqual(result, { row: 1, col: 2 });
    });

    it('should return correct coordinates for w', () => {
      const result = getRoomCoordinates('w');
      assert.deepStrictEqual(result, { row: 1, col: 0 });
    });

    it('should return null for unknown room ID', () => {
      const result = getRoomCoordinates('unknown_room');
      assert.equal(result, null);
    });
  });

  describe('executeFastTravel', () => {
    it('should update world state with new room coordinates', () => {
      const worldState = { roomRow: 0, roomCol: 0, x: 5, y: 5, gold: 100 };
      const { worldState: newState, success, message } = executeFastTravel(worldState, 'center');
      
      assert.equal(success, true);
      assert.equal(newState.roomRow, 1);
      assert.equal(newState.roomCol, 1);
      assert.equal(newState.x, 8);  // Center of room
      assert.equal(newState.y, 6);  // Center of room
      assert.equal(newState.gold, 100);  // Other state preserved
      assert.ok(message.includes('Village Square'));
    });

    it('should return failure for unknown destination', () => {
      const worldState = { roomRow: 1, roomCol: 1, x: 8, y: 6 };
      const { worldState: newState, success, message } = executeFastTravel(worldState, 'unknown_room');
      
      assert.equal(success, false);
      assert.deepStrictEqual(newState, worldState);  // State unchanged
      assert.ok(message.includes('Unknown destination'));
    });

    it('should preserve all existing world state properties', () => {
      const worldState = {
        roomRow: 0,
        roomCol: 0,
        x: 5,
        y: 5,
        gold: 250,
        playerLevel: 10,
        inventory: ['sword', 'potion'],
        customProp: 'test',
      };
      const { worldState: newState, success } = executeFastTravel(worldState, 'se');
      
      assert.equal(success, true);
      assert.equal(newState.gold, 250);
      assert.equal(newState.playerLevel, 10);
      assert.deepStrictEqual(newState.inventory, ['sword', 'potion']);
      assert.equal(newState.customProp, 'test');
      assert.equal(newState.roomRow, 2);
      assert.equal(newState.roomCol, 2);
    });

    it('should place player at center of target room (x:8, y:6)', () => {
      const worldState = { roomRow: 0, roomCol: 0, x: 0, y: 0 };
      const { worldState: newState, success } = executeFastTravel(worldState, 'n');
      
      assert.equal(success, true);
      assert.equal(newState.x, 8);
      assert.equal(newState.y, 6);
    });

    it('should include room name in success message', () => {
      const worldState = { roomRow: 1, roomCol: 1, x: 8, y: 6 };
      
      let result = executeFastTravel(worldState, 'nw');
      assert.ok(result.message.includes('Northwest Grove'));
      
      result = executeFastTravel(worldState, 'se');
      assert.ok(result.message.includes('Southeast Dock'));
    });
  });

  describe('canUseFastTravel', () => {
    it('should return canTravel false when not in exploration phase', () => {
      const state = { phase: 'combat', visitedRooms: [[1, 1]] };
      const { canTravel, reason } = canUseFastTravel(state);
      
      assert.equal(canTravel, false);
      assert.ok(reason.includes('exploration'));
    });

    it('should return canTravel false for battle phase', () => {
      const state = { phase: 'battle', visitedRooms: [[1, 1]] };
      const { canTravel, reason } = canUseFastTravel(state);
      
      assert.equal(canTravel, false);
    });

    it('should return canTravel false with no visited rooms', () => {
      const state = { phase: 'exploration', visitedRooms: [] };
      const { canTravel, reason } = canUseFastTravel(state);
      
      assert.equal(canTravel, false);
      assert.ok(reason.includes('not discovered'));
    });

    it('should return canTravel false with null visitedRooms', () => {
      const state = { phase: 'exploration', visitedRooms: null };
      const { canTravel, reason } = canUseFastTravel(state);
      
      assert.equal(canTravel, false);
      assert.ok(reason.includes('not discovered'));
    });

    it('should return canTravel true during exploration with visited rooms', () => {
      const state = { phase: 'exploration', visitedRooms: [[1, 1]] };
      const { canTravel, reason } = canUseFastTravel(state);
      
      assert.equal(canTravel, true);
      assert.equal(reason, null);
    });

    it('should return canTravel true with multiple visited rooms', () => {
      const state = {
        phase: 'exploration',
        visitedRooms: [[0, 0], [1, 1], [2, 2]],
      };
      const { canTravel, reason } = canUseFastTravel(state);
      
      assert.equal(canTravel, true);
      assert.equal(reason, null);
    });
  });
});
