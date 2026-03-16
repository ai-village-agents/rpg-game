import { describe, it } from 'node:test';
import assert from 'node:assert';
import { startNewEncounter } from '../src/combat.js';
import { handleEncounterAction } from '../src/handlers/encounter-handler.js';
import { createEncounterState } from '../src/random-encounter-system.js';

describe('Combat summary reset regressions', () => {
  it('startNewEncounter clears stale combat summary fields from prior victory', () => {
    const previousCombatStats = {
      enemyName: 'Old Slime',
      totalDamageDealt: 42,
    };
    const previousSummary = {
      sections: [{ type: 'header', rating: 'S' }],
    };

    const state = {
      phase: 'victory',
      player: {
        name: 'Hero',
        hp: 50,
        maxHp: 50,
        atk: 10,
        def: 5,
        defending: true,
        statusEffects: ['stun'],
        inventory: { potion: 2 },
      },
      log: ['Victory!'],
      combatStats: previousCombatStats,
      combatStatsSummary: previousSummary,
    };

    const next = startNewEncounter(state, 1);

    assert.strictEqual(next.phase, 'player-turn');
    assert.strictEqual(next.turn, 1);
    assert.strictEqual(next.combatStats, null);
    assert.strictEqual(next.combatStatsSummary, null);
    assert.ok(next.enemy);
  });

  it('ENGAGE_ENCOUNTER clears stale combat summary fields before encounter combat starts', () => {
    const state = {
      phase: 'random-encounter',
      player: {
        name: 'Hero',
        hp: 40,
        maxHp: 50,
        atk: 10,
        def: 5,
        defending: true,
        statusEffects: ['burn'],
        inventory: { potion: 1 },
      },
      world: { roomRow: 0, roomCol: 0 },
      log: ['Previous victory summary shown'],
      difficulty: 'normal',
      encounterState: createEncounterState(),
      currentEncounter: {
        id: 'test-encounter',
        enemies: ['slime'],
      },
      combatStats: { enemyName: 'Goblin', totalDamageDealt: 99 },
      combatStatsSummary: { sections: [{ type: 'header', rating: 'A' }] },
    };

    const next = handleEncounterAction(state, { type: 'ENGAGE_ENCOUNTER' });

    assert.strictEqual(next.phase, 'player-turn');
    assert.strictEqual(next.turn, 1);
    assert.strictEqual(next.combatStats, null);
    assert.strictEqual(next.combatStatsSummary, null);
    assert.strictEqual(next.encounterCombatActive, true);
    assert.strictEqual(next.currentEnemyId, 'slime');
    assert.ok(next.enemy);
  });
});
