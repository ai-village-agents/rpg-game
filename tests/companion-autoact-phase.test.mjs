import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Regression test for Issue #249: Unknown Phase: undefined
// Root cause: handleEnemyTurnLogic() treated companionAutoAct() return as { state, seed }
// but it actually returns the state object directly.

describe('Issue #249 - companionAutoAct phase preservation', () => {
  it('companionAutoAct returns state directly, not wrapped in { state }', async () => {
    const { companionAutoAct } = await import('../src/companions.js');

    // Create a minimal game state with a companion
    const state = {
      phase: 'player-turn',
      player: { hp: 30, maxHp: 50, atk: 10, def: 5, level: 3 },
      enemy: { hp: 20, maxHp: 20, name: 'Slime', atk: 5, def: 2 },
      companions: [
        { id: 'test-companion', name: 'Test Ally', alive: true, hp: 20, maxHp: 20, atk: 8, def: 3 }
      ],
      log: [],
      rngSeed: 12345,
    };

    const result = companionAutoAct(state);

    // The return value should be the state object directly (not wrapped)
    assert.ok(result, 'companionAutoAct should return a truthy value');
    assert.ok(result.phase !== undefined, 'returned state must have a defined phase');
    assert.equal(typeof result.phase, 'string', 'phase should be a string');
    assert.ok(result.player, 'returned state must have player');
    assert.ok(result.enemy !== undefined, 'returned state must have enemy');

    // Critically: result.state should NOT exist (it's not a { state, seed } wrapper)
    // If result.state existed, the old buggy code would have worked fine
    // This test ensures companionAutoAct returns state directly
    if (result.state !== undefined) {
      // If someone refactors companionAutoAct to return { state, seed },
      // the combat handler code would need to be updated too
      assert.fail(
        'companionAutoAct now returns { state, ... } wrapper - ' +
        'update combat-handler.js to use result.state again'
      );
    }
  });

  it('companionAutoAct preserves phase with no companions', async () => {
    const { companionAutoAct } = await import('../src/companions.js');

    const state = {
      phase: 'player-turn',
      player: { hp: 30, maxHp: 50, atk: 10, def: 5 },
      enemy: { hp: 20, maxHp: 20, name: 'Slime', atk: 5, def: 2 },
      companions: [],
      log: [],
      rngSeed: 42,
    };

    const result = companionAutoAct(state);
    assert.equal(result.phase, 'player-turn', 'phase should be preserved when no companions');
    assert.ok(result.player, 'player should be preserved');
    assert.ok(result.enemy, 'enemy should be preserved');
  });

  it('handleEnemyTurnLogic preserves phase after companion actions', async () => {
    const { handleEnemyTurnLogic } = await import('../src/handlers/combat-handler.js');

    // Create a state where enemy deals damage and combat continues
    const state = {
      phase: 'enemy-turn',
      player: { hp: 50, maxHp: 50, atk: 12, def: 10, defending: false, statusEffects: [], level: 3, xp: 0, gold: 0, equipment: {} },
      enemy: {
        name: 'Slime', hp: 18, maxHp: 18, atk: 5, def: 2,
        defending: false, statusEffects: [], xpReward: 10, goldReward: 5,
        abilities: [], isBoss: false
      },
      companions: [
        { id: 'test-ally', name: 'Test Ally', alive: true, hp: 20, maxHp: 20, atk: 8, def: 3 }
      ],
      log: [],
      turn: 2,
      rngSeed: 99999,
    };

    const result = handleEnemyTurnLogic(state);

    // The critical assertion: phase must NOT be undefined
    assert.ok(result.phase !== undefined, 'phase must not be undefined after enemy turn with companions');
    assert.ok(
      ['player-turn', 'enemy-turn', 'victory', 'defeat'].includes(result.phase),
      `phase should be a valid combat phase, got: ${result.phase}`
    );
    assert.ok(result.player, 'player state must be preserved');
    assert.ok(result.enemy !== undefined, 'enemy state must be preserved');
  });
});
