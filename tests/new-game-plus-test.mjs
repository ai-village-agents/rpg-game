import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleSystemAction } from '../src/handlers/system-handler.js';

function makeEndgameState(overrides = {}) {
  const bestiary = { goblin: { seen: true } };
  const tutorialState = { seenIntro: true };
  const gameStats = { enemiesDefeated: 99, battlesWon: 50, battlesFled: 3 };
  const state = {
    phase: 'victory',
    gold: 1234,
    log: ['GAME COMPLETE'],
    player: {
      name: 'Hero',
      classId: 'warrior',
      level: 15,
      hp: 1,
      mp: 0,
      maxHp: 120,
      maxMp: 40,
      defending: true,
      equipment: {
        weapon: { id: 'greatsword', atk: 12 },
        armor: { id: 'steel-mail', def: 8 },
      },
      // Intentionally as an object map to assert reset semantics
      inventory: { potion: 5, ether: 1 },
    },
    bestiary,
    tutorialState,
    gameStats,
    newGamePlusCount: overrides.newGamePlusCount ?? 0,
    ...overrides,
  };
  return state;
}

describe('NEW_GAME_PLUS semantics (regression guard for PR #326)', () => {
  it('transitions without throwing and sets expected baseline fields', () => {
    const pre = makeEndgameState();
    const next = handleSystemAction(pre, { type: 'NEW_GAME_PLUS' });

    // No throw and returns an object
    assert.ok(next && typeof next === 'object');

    // Phase set to exploration
    assert.equal(next.phase, 'exploration');

    // Inventory is reset to an object map with exactly { potion: 2 }
    assert.ok(next.inventory && typeof next.inventory === 'object' && !Array.isArray(next.inventory));
    assert.deepEqual(next.inventory, { potion: 2 });

    // Equipment persists under player and is not duplicated into inventory
    assert.ok(next.player && next.player.equipment && typeof next.player.equipment === 'object');
    assert.deepEqual(Object.keys(next.player.equipment).sort(), ['armor', 'weapon']);
    assert.equal(next.inventory.weapon, undefined);
    assert.equal(next.inventory.armor, undefined);

    // HP/MP reset to max values; defending cleared
    assert.equal(next.player.hp, pre.player.maxHp || 50);
    assert.equal(next.player.mp, pre.player.maxMp || 15);
    assert.equal(next.player.defending, false);

    // Gold carryover is halved and floored
    assert.equal(next.gold, Math.floor((pre.gold || 0) * 0.5));

    // Flags and counters
    assert.equal(next.newGamePlus, true);
    assert.equal(next.newGamePlusCount, (pre.newGamePlusCount || 0) + 1);
    assert.equal(next.newGamePlusBonus, next.newGamePlusCount);

    // Log includes NG+ banner and Oblivion Lord message
    const log = next.log || [];
    assert.ok(Array.isArray(log) && log.length >= 2);
    assert.ok(log.some(l => typeof l === 'string' && l.includes('New Game+')));
    assert.ok(log.some(l => typeof l === 'string' && l.includes('Oblivion Lord')));

    // Reference preservation: these should be the exact same object references
    assert.strictEqual(next.bestiary, pre.bestiary);
    assert.strictEqual(next.tutorialState, pre.tutorialState);
    assert.strictEqual(next.gameStats, pre.gameStats);
  });

  it('uses safe fallbacks for missing maxHp/maxMp and gold', () => {
    const pre = makeEndgameState({
      gold: undefined,
      player: {
        name: 'Rogue', classId: 'rogue', level: 10,
        hp: 0, mp: 0, maxHp: undefined, maxMp: undefined,
        defending: true,
        equipment: {},
        inventory: {},
      },
    });

    const next = handleSystemAction(pre, { type: 'NEW_GAME_PLUS' });

    // Fallbacks 50/15 are applied when max values are missing
    assert.equal(next.player.hp, 50);
    assert.equal(next.player.mp, 15);

    // Gold fallback halving: undefined treated as 0
    assert.equal(next.gold, 0);
  });

  it('increments newGamePlusCount across successive NG+ transitions', () => {
    const first = handleSystemAction(makeEndgameState({ newGamePlusCount: 0 }), { type: 'NEW_GAME_PLUS' });
    assert.equal(first.newGamePlusCount, 1);

    const second = handleSystemAction(first, { type: 'NEW_GAME_PLUS' });
    assert.equal(second.newGamePlusCount, 2);
    assert.equal(second.newGamePlusBonus, 2);
  });
});
