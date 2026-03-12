/**
 * Tests for sporeling-integration.js
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  getSporeling,
  hasSporeling,
  recruitSporelingCompanion,
  dismissSporeling,
  awardSporelingCombatPoints,
  evolveSporelingCompanion,
  getSporelingStatus,
  getAvailableEvolutionTraits,
  getEvolutionProgress,
  EVOLUTION_STAGES,
  EVOLUTION_TRAITS,
} from '../src/sporeling-integration.js';

describe('sporeling-integration', () => {
  let baseState;

  beforeEach(() => {
    baseState = {
      companions: [],
      maxCompanions: 3,
      log: [],
    };
  });

  describe('getSporeling', () => {
    it('returns null when no sporeling exists', () => {
      const result = getSporeling(baseState);
      assert.strictEqual(result, null);
    });

    it('returns sporeling when one exists', () => {
      const state = recruitSporelingCompanion(baseState, 'TestSporeling');
      const sporeling = getSporeling(state);
      assert.strictEqual(sporeling.name, 'TestSporeling');
      assert.strictEqual(sporeling.type, 'EVOLVING_CREATURE');
    });
  });

  describe('hasSporeling', () => {
    it('returns false when no sporeling', () => {
      assert.strictEqual(hasSporeling(baseState), false);
    });

    it('returns true when sporeling exists', () => {
      const state = recruitSporelingCompanion(baseState, 'MySporeling');
      assert.strictEqual(hasSporeling(state), true);
    });
  });

  describe('recruitSporelingCompanion', () => {
    it('adds a sporeling companion to empty party', () => {
      const state = recruitSporelingCompanion(baseState, 'Spory');
      assert.strictEqual(state.companions.length, 1);
      assert.strictEqual(state.companions[0].name, 'Spory');
      assert.strictEqual(state.companions[0].type, 'EVOLVING_CREATURE');
      assert.strictEqual(state.companions[0].stage, 'CELL');
      assert.strictEqual(state.companions[0].alive, true);
    });

    it('prevents recruiting second sporeling', () => {
      let state = recruitSporelingCompanion(baseState, 'First');
      state = recruitSporelingCompanion(state, 'Second');
      assert.strictEqual(state.companions.length, 1);
      assert.strictEqual(state.companions[0].name, 'First');
    });

    it('prevents recruiting when party is full', () => {
      const fullState = {
        ...baseState,
        companions: [
          { id: 'c1', name: 'Companion1' },
          { id: 'c2', name: 'Companion2' },
          { id: 'c3', name: 'Companion3' },
        ],
        maxCompanions: 3,
      };
      const state = recruitSporelingCompanion(fullState, 'Spory');
      assert.strictEqual(state.companions.length, 3);
      assert.strictEqual(hasSporeling(state), false);
    });

    it('sporeling has correct initial stats', () => {
      const state = recruitSporelingCompanion(baseState);
      const sporeling = getSporeling(state);
      assert.strictEqual(sporeling.stats.hp, EVOLUTION_STAGES.CELL.baseStats.hp);
      assert.strictEqual(sporeling.stats.attack, EVOLUTION_STAGES.CELL.baseStats.attack);
      assert.strictEqual(sporeling.stats.defense, EVOLUTION_STAGES.CELL.baseStats.defense);
    });
  });

  describe('dismissSporeling', () => {
    it('removes sporeling from party', () => {
      let state = recruitSporelingCompanion(baseState, 'ToRemove');
      assert.strictEqual(hasSporeling(state), true);
      state = dismissSporeling(state);
      assert.strictEqual(hasSporeling(state), false);
      assert.strictEqual(state.companions.length, 0);
    });

    it('handles dismissing when no sporeling exists', () => {
      const state = dismissSporeling(baseState);
      assert.strictEqual(state.companions.length, 0);
    });
  });

  describe('awardSporelingCombatPoints', () => {
    it('awards evolution points based on XP', () => {
      let state = recruitSporelingCompanion(baseState, 'Fighter');
      const initialPoints = getSporeling(state).evolutionPoints;

      state = awardSporelingCombatPoints(state, 50);
      const sporeling = getSporeling(state);

      // 50 XP / 5 = 10 points
      assert.strictEqual(sporeling.evolutionPoints, initialPoints + 10);
    });

    it('awards minimum 1 point for small XP amounts', () => {
      let state = recruitSporelingCompanion(baseState);
      state = awardSporelingCombatPoints(state, 3);
      const sporeling = getSporeling(state);
      assert.strictEqual(sporeling.evolutionPoints, 1);
    });

    it('does not award points to dead sporeling', () => {
      let state = recruitSporelingCompanion(baseState);
      // Set sporeling as dead
      state = {
        ...state,
        companions: state.companions.map((c) =>
          c.type === 'EVOLVING_CREATURE' ? { ...c, alive: false } : c
        ),
      };
      const initialPoints = getSporeling(state).evolutionPoints;
      state = awardSporelingCombatPoints(state, 100);
      assert.strictEqual(getSporeling(state).evolutionPoints, initialPoints);
    });

    it('does nothing when no sporeling', () => {
      const state = awardSporelingCombatPoints(baseState, 100);
      assert.strictEqual(state.companions.length, 0);
    });
  });

  describe('evolveSporelingCompanion', () => {
    it('evolves sporeling when enough points', () => {
      let state = recruitSporelingCompanion(baseState, 'Evolver');

      // Award enough points to evolve (50 for CREATURE stage)
      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }

      const beforeStage = getSporeling(state).stage;
      assert.strictEqual(beforeStage, 'CELL');

      state = evolveSporelingCompanion(state);
      const afterStage = getSporeling(state).stage;
      assert.strictEqual(afterStage, 'CREATURE');
    });

    it('updates companion stats after evolution', () => {
      let state = recruitSporelingCompanion(baseState);

      // Award enough points
      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }

      state = evolveSporelingCompanion(state);
      const sporeling = getSporeling(state);

      // Stats should now match CREATURE stage (possibly modified by trait)
      assert.ok(sporeling.stats.hp >= EVOLUTION_STAGES.CREATURE.baseStats.hp);
      assert.ok(sporeling.stats.attack >= EVOLUTION_STAGES.CREATURE.baseStats.attack);
    });

    it('prevents evolution without enough points', () => {
      let state = recruitSporelingCompanion(baseState);
      state = evolveSporelingCompanion(state);
      const sporeling = getSporeling(state);
      assert.strictEqual(sporeling.stage, 'CELL');
    });

    it('can select trait during evolution', () => {
      let state = recruitSporelingCompanion(baseState);

      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }

      state = evolveSporelingCompanion(state, 'SHARP_CLAWS');
      const sporeling = getSporeling(state);

      assert.strictEqual(sporeling.stage, 'CREATURE');
      assert.ok(sporeling.traits.includes('SHARP_CLAWS'));
    });
  });

  describe('getEvolutionProgress', () => {
    it('returns correct progress for new sporeling', () => {
      const state = recruitSporelingCompanion(baseState);
      const sporeling = getSporeling(state);
      const progress = getEvolutionProgress(sporeling);

      assert.strictEqual(progress.evolutionPoints, 0);
      assert.strictEqual(progress.pointsToNextStage, 50); // CREATURE threshold
      assert.strictEqual(progress.canEvolve, false);
    });

    it('shows can evolve when ready', () => {
      let state = recruitSporelingCompanion(baseState);
      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }
      const sporeling = getSporeling(state);
      const progress = getEvolutionProgress(sporeling);

      assert.strictEqual(progress.canEvolve, true);
    });
  });

  describe('getSporelingStatus', () => {
    it('returns null when no sporeling', () => {
      const status = getSporelingStatus(baseState);
      assert.strictEqual(status, null);
    });

    it('returns status object for sporeling', () => {
      const state = recruitSporelingCompanion(baseState, 'StatusTest');
      const status = getSporelingStatus(state);

      assert.strictEqual(status.name, 'StatusTest');
      assert.strictEqual(status.stage, 'Cell');
      assert.strictEqual(status.evolutionPoints, 0);
      assert.strictEqual(status.canEvolve, false);
      assert.ok(Array.isArray(status.traits));
      assert.ok(status.stats);
    });
  });

  describe('getAvailableEvolutionTraits', () => {
    it('returns empty array when no sporeling', () => {
      const traits = getAvailableEvolutionTraits(baseState);
      assert.strictEqual(traits.length, 0);
    });

    it('returns all traits for new sporeling', () => {
      const state = recruitSporelingCompanion(baseState);
      const traits = getAvailableEvolutionTraits(state);
      const traitCount = Object.keys(EVOLUTION_TRAITS).length;
      assert.strictEqual(traits.length, traitCount);
    });

    it('excludes already acquired traits', () => {
      let state = recruitSporelingCompanion(baseState);

      // Award points and evolve with a trait
      for (let i = 0; i < 10; i++) {
        state = awardSporelingCombatPoints(state, 50);
      }
      state = evolveSporelingCompanion(state, 'THICK_HIDE');

      const traits = getAvailableEvolutionTraits(state);
      const hasThickHide = traits.some((t) => t.id === 'THICK_HIDE');
      assert.strictEqual(hasThickHide, false);
    });
  });

  describe('integration with regular companions', () => {
    it('sporeling coexists with regular companions', () => {
      let state = {
        ...baseState,
        companions: [{ id: 'regular1', name: 'RegularCompanion', type: 'COMPANION' }],
      };

      state = recruitSporelingCompanion(state, 'Spory');
      assert.strictEqual(state.companions.length, 2);
      assert.strictEqual(hasSporeling(state), true);

      // Regular companion still exists
      const regular = state.companions.find((c) => c.id === 'regular1');
      assert.ok(regular);
    });

    it('dismissing sporeling keeps regular companions', () => {
      let state = {
        ...baseState,
        companions: [{ id: 'regular1', name: 'RegularCompanion', type: 'COMPANION' }],
      };

      state = recruitSporelingCompanion(state, 'Spory');
      state = dismissSporeling(state);

      assert.strictEqual(state.companions.length, 1);
      assert.strictEqual(state.companions[0].id, 'regular1');
    });
  });
});
