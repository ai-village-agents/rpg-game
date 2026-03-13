import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { handleEncounterAction, shouldCheckForEncounter, getCurrentLocationType } from '../src/handlers/encounter-handler.js';
import { createEncounterState, LOCATION_TYPE } from '../src/random-encounter-system.js';

describe('Encounter Handler', () => {
  let baseState;

  beforeEach(() => {
    baseState = {
      phase: 'exploration',
      player: { level: 5 },
      world: { currentRoom: 'nw' },
      encounterState: createEncounterState(),
    };
  });

  describe('handleEncounterAction', () => {
    it('returns null for unknown actions', () => {
      const result = handleEncounterAction(baseState, { type: 'UNKNOWN_ACTION' });
      assert.strictEqual(result, null);
    });

    it('handles OPEN_ENCOUNTER_STATS action', () => {
      const result = handleEncounterAction(baseState, { type: 'OPEN_ENCOUNTER_STATS' });
      assert.strictEqual(result.phase, 'encounter-stats');
      assert.strictEqual(result.previousPhase, 'exploration');
    });

    it('handles CLOSE_ENCOUNTER_STATS action', () => {
      const state = { ...baseState, phase: 'encounter-stats', previousPhase: 'exploration' };
      const result = handleEncounterAction(state, { type: 'CLOSE_ENCOUNTER_STATS' });
      assert.strictEqual(result.phase, 'exploration');
    });

    it('handles TRIGGER_RANDOM_ENCOUNTER action', () => {
      const result = handleEncounterAction(baseState, { type: 'TRIGGER_RANDOM_ENCOUNTER' });
      assert.ok(result);
      assert.ok(result.encounterState);
    });

    it('handles FLEE_ENCOUNTER action', () => {
      const state = {
        ...baseState,
        currentEncounter: { id: 'test-encounter', type: 'combat' },
        previousPhase: 'exploration',
      };
      const result = handleEncounterAction(state, { type: 'FLEE_ENCOUNTER' });
      assert.strictEqual(result.currentEncounter, null);
      assert.strictEqual(result.phase, 'exploration');
    });

    it('handles ADD_ENCOUNTER_MODIFIER action', () => {
      const modifier = {
        id: 'test-mod',
        type: 'encounter-rate',
        value: 1.5,
      };
      const result = handleEncounterAction(baseState, {
        type: 'ADD_ENCOUNTER_MODIFIER',
        payload: { modifier },
      });
      assert.ok(result.encounterState.modifiers.some(m => m.id === 'test-mod'));
    });

    it('handles REMOVE_ENCOUNTER_MODIFIER action', () => {
      const stateWithModifier = {
        ...baseState,
        encounterState: {
          ...createEncounterState(),
          modifiers: [{ id: 'test-mod', type: 'encounter-rate', value: 1.5 }],
        },
      };
      const result = handleEncounterAction(stateWithModifier, {
        type: 'REMOVE_ENCOUNTER_MODIFIER',
        payload: { modifierId: 'test-mod' },
      });
      assert.strictEqual(result.encounterState.modifiers.length, 0);
    });
  });

  describe('shouldCheckForEncounter', () => {
    it('returns true for exploration phase outside town', () => {
      assert.strictEqual(shouldCheckForEncounter(baseState), true);
    });

    it('returns false when in town (center room)', () => {
      const townState = { ...baseState, world: { currentRoom: 'center' } };
      assert.strictEqual(shouldCheckForEncounter(townState), false);
    });

    it('returns false when not in exploration phase', () => {
      const combatState = { ...baseState, phase: 'player-turn' };
      assert.strictEqual(shouldCheckForEncounter(combatState), false);
    });

    it('returns false when encounter is on cooldown', () => {
      const cooldownState = {
        ...baseState,
        encounterState: { ...createEncounterState(), encounterCooldown: 5 },
      };
      assert.strictEqual(shouldCheckForEncounter(cooldownState), false);
    });
  });

  describe('getCurrentLocationType', () => {
    it('maps nw room to forest', () => {
      assert.strictEqual(getCurrentLocationType(baseState), LOCATION_TYPE.FOREST);
    });

    it('maps n room to mountain', () => {
      const state = { ...baseState, world: { currentRoom: 'n' } };
      assert.strictEqual(getCurrentLocationType(state), LOCATION_TYPE.MOUNTAIN);
    });

    it('maps ne room to ruins', () => {
      const state = { ...baseState, world: { currentRoom: 'ne' } };
      assert.strictEqual(getCurrentLocationType(state), LOCATION_TYPE.RUINS);
    });

    it('maps center room to town', () => {
      const state = { ...baseState, world: { currentRoom: 'center' } };
      assert.strictEqual(getCurrentLocationType(state), LOCATION_TYPE.TOWN);
    });

    it('maps sw room to cave', () => {
      const state = { ...baseState, world: { currentRoom: 'sw' } };
      assert.strictEqual(getCurrentLocationType(state), LOCATION_TYPE.CAVE);
    });

    it('maps se room to dungeon', () => {
      const state = { ...baseState, world: { currentRoom: 'se' } };
      assert.strictEqual(getCurrentLocationType(state), LOCATION_TYPE.DUNGEON);
    });

    it('defaults to road for unknown rooms', () => {
      const state = { ...baseState, world: { currentRoom: 'unknown' } };
      assert.strictEqual(getCurrentLocationType(state), LOCATION_TYPE.ROAD);
    });
  });
});
