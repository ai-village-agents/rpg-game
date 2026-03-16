import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  addGold,
  addItem,
  clearWorldEvent,
  fullRestore,
  isDevMode,
  setDevMode,
  setPlayerGold,
  setPlayerLevel,
  teleportToRoom,
  toggleGodMode,
  triggerWorldEvent,
} from '../src/dev-menu.js';

const originalLocalStorage = globalThis.localStorage;
const originalDevModeFlag = globalThis.DEV_MODE;

afterEach(() => {
  if (originalLocalStorage === undefined) {
    delete globalThis.localStorage;
  } else {
    globalThis.localStorage = originalLocalStorage;
  }
  if (originalDevModeFlag === undefined) {
    delete globalThis.DEV_MODE;
  } else {
    globalThis.DEV_MODE = originalDevModeFlag;
  }
});

function createTestState() {
  return {
    player: {
      classId: 'warrior',
      level: 1,
      xp: 0,
      hp: 50,
      maxHp: 50,
      mp: 15,
      maxMp: 15,
      atk: 12,
      def: 10,
      spd: 6,
      int: 3,
      lck: 5,
      gold: 100,
      inventory: { potion: 2 },
      stats: {
        hp: 50,
        maxHp: 50,
        mp: 15,
        maxMp: 15,
        atk: 12,
        def: 10,
        spd: 6,
        int: 3,
        lck: 5,
      },
    },
    world: { roomRow: 1, roomCol: 1, x: 8, y: 6 },
  };
}

describe('isDevMode', () => {
  it('returns false by default when no storage or flag exists', () => {
    delete globalThis.localStorage;
    delete globalThis.DEV_MODE;
    assert.equal(isDevMode(), false);
  });
});

describe('setDevMode', () => {
  it('returns true when enabling and sets the global flag', () => {
    delete globalThis.localStorage;
    delete globalThis.DEV_MODE;
    const enabled = setDevMode(true);
    assert.equal(enabled, true);
    assert.equal(globalThis.DEV_MODE, true);
  });

  it('returns false when disabling and updates the global flag', () => {
    delete globalThis.localStorage;
    globalThis.DEV_MODE = true;
    const disabled = setDevMode(false);
    assert.equal(disabled, false);
    assert.equal(globalThis.DEV_MODE, false);
  });
});

describe('setPlayerLevel', () => {
  it('sets player to level 1 with base warrior stats', () => {
    const state = createTestState();
    const next = setPlayerLevel(state, 1);
    assert.equal(next.player.level, 1);
    assert.equal(next.player.hp, 50);
    assert.equal(next.player.maxHp, 50);
    assert.equal(next.player.mp, 15);
    assert.equal(next.player.maxMp, 15);
    assert.equal(next.player.atk, 12);
    assert.equal(next.player.def, 10);
    assert.equal(next.player.spd, 6);
    assert.equal(next.player.int, 3);
    assert.equal(next.player.lck, 5);
    assert.equal(next.player.xp, 0);
    assert.deepStrictEqual(next.player.stats, {
      hp: 50,
      maxHp: 50,
      mp: 15,
      maxMp: 15,
      atk: 12,
      def: 10,
      spd: 6,
      int: 3,
      lck: 5,
    });
  });

  it('raises player to level 5 and recalculates stats and xp', () => {
    const state = createTestState();
    const next = setPlayerLevel(state, 5);
    assert.equal(next.player.level, 5);
    assert.equal(next.player.hp, 90);
    assert.equal(next.player.maxHp, 90);
    assert.equal(next.player.mp, 23);
    assert.equal(next.player.maxMp, 23);
    assert.equal(next.player.atk, 24);
    assert.equal(next.player.def, 22);
    assert.equal(next.player.spd, 10);
    assert.equal(next.player.int, 3);
    assert.equal(next.player.lck, 9);
    assert.equal(next.player.xp, 700);
    assert.deepStrictEqual(next.player.stats, {
      hp: 90,
      maxHp: 90,
      mp: 23,
      maxMp: 23,
      atk: 24,
      def: 22,
      spd: 10,
      int: 3,
      lck: 9,
    });
  });

  it('handles level 99 with extrapolated stats and xp floor', () => {
    const state = createTestState();
    const next = setPlayerLevel(state, 99);
    assert.equal(next.player.level, 99);
    assert.equal(next.player.hp, 1030);
    assert.equal(next.player.maxHp, 1030);
    assert.equal(next.player.mp, 211);
    assert.equal(next.player.maxMp, 211);
    assert.equal(next.player.atk, 306);
    assert.equal(next.player.def, 304);
    assert.equal(next.player.spd, 104);
    assert.equal(next.player.int, 3);
    assert.equal(next.player.lck, 103);
    assert.equal(next.player.xp, 49950);
  });

  it('throws when level is below 1', () => {
    const state = createTestState();
    assert.throws(() => setPlayerLevel(state, 0), /between 1 and 99/);
  });

  it('throws when level is above 99', () => {
    const state = createTestState();
    assert.throws(() => setPlayerLevel(state, 100), /between 1 and 99/);
  });

  it('throws when level is not an integer', () => {
    const state = createTestState();
    assert.throws(() => setPlayerLevel(state, 4.5), /must be an integer/);
  });
});

describe('setPlayerGold', () => {
  it('sets gold to zero', () => {
    const state = createTestState();
    const next = setPlayerGold(state, 0);
    assert.equal(next.player.gold, 0);
    assert.equal(state.player.gold, 100);
  });

  it('sets gold to a positive value', () => {
    const state = createTestState();
    state.player.gold = 0;
    const next = setPlayerGold(state, 100);
    assert.equal(next.player.gold, 100);
    assert.equal(state.player.gold, 0);
  });

  it('throws when setting gold to negative', () => {
    const state = createTestState();
    assert.throws(() => setPlayerGold(state, -1), /zero or positive/);
  });
});

describe('addGold', () => {
  it('adds positive gold amounts', () => {
    const state = createTestState();
    const next = addGold(state, 50);
    assert.equal(next.player.gold, 150);
  });

  it('subtracts gold when adding negative amounts', () => {
    const state = createTestState();
    const next = addGold(state, -30);
    assert.equal(next.player.gold, 70);
  });

  it('clamps gold to zero when subtraction would go negative', () => {
    const state = createTestState();
    const next = addGold(state, -500);
    assert.equal(next.player.gold, 0);
  });
});

describe('addItem', () => {
  it('adds one potion by default', () => {
    const state = createTestState();
    const next = addItem(state, 'potion');
    assert.equal(next.player.inventory.potion, 3);
  });

  it('adds a custom quantity of potion', () => {
    const state = createTestState();
    const next = addItem(state, 'potion', 5);
    assert.equal(next.player.inventory.potion, 7);
  });

  it('throws for unknown items', () => {
    const state = createTestState();
    assert.throws(() => addItem(state, 'unknown_item'), /Unknown itemId/);
  });

  it('throws when quantity is zero', () => {
    const state = createTestState();
    assert.throws(() => addItem(state, 'potion', 0), /Quantity must be a positive integer/);
  });
});

describe('teleportToRoom', () => {
  it('teleports to the northwest room and resets position', () => {
    const state = createTestState();
    const next = teleportToRoom(state, 'nw');
    assert.equal(next.world.roomRow, 0);
    assert.equal(next.world.roomCol, 0);
    assert.equal(next.world.x, 4);
    assert.equal(next.world.y, 3);
  });

  it('teleports back to center room from another position', () => {
    const state = createTestState();
    state.world = { roomRow: 0, roomCol: 0, x: 1, y: 1 };
    const next = teleportToRoom(state, 'center');
    assert.equal(next.world.roomRow, 1);
    assert.equal(next.world.roomCol, 1);
    assert.equal(next.world.x, 4);
    assert.equal(next.world.y, 3);
  });

  it('throws for invalid room id', () => {
    const state = createTestState();
    assert.throws(() => teleportToRoom(state, 'unknown'), /Invalid roomId/);
  });
});

describe('triggerWorldEvent', () => {
  it('triggers the merchant caravan event with deterministic duration', () => {
    const state = createTestState();
    state.rngSeed = 123;
    const next = triggerWorldEvent(state, 'merchant_caravan');
    assert.equal(next.worldEvent.eventId, 'merchant_caravan');
    assert.equal(next.worldEvent.movesRemaining, 4);
    assert.equal(next.worldEvent.totalMoves, 4);
    assert.equal(next.worldEvent.effect.type, 'shop_discount');
    assert.equal(next.player.hp, state.player.hp);
    assert.equal(next.player.mp, state.player.mp);
  });

  it('throws for unknown world events', () => {
    const state = createTestState();
    assert.throws(() => triggerWorldEvent(state, 'missing_event'), /Unknown world event/);
  });
});

describe('clearWorldEvent', () => {
  it('clears the current world event without touching player data', () => {
    const state = createTestState();
    state.worldEvent = { eventId: 'merchant_caravan', movesRemaining: 3 };
    const next = clearWorldEvent(state);
    assert.equal(next.worldEvent, null);
    assert.equal(next.player.gold, 100);
  });
});

describe('toggleGodMode', () => {
  it('enables god mode and caps stats to 9999', () => {
    const state = createTestState();
    const next = toggleGodMode(state);
    assert.equal(next.player.godMode, true);
    assert.equal(next.player.hp, 9999);
    assert.equal(next.player.mp, 9999);
    assert.equal(next.player.maxHp, 9999);
    assert.equal(next.player.maxMp, 9999);
    assert.equal(next.player.stats.hp, 9999);
    assert.equal(next.player.stats.mp, 9999);
    assert.equal(next.player.stats.maxHp, 9999);
    assert.equal(next.player.stats.maxMp, 9999);
    assert.ok(next.player.__devBackupStats);
    assert.equal(next.player.__devBackupStats.hp, 50);
    assert.equal(next.player.__devBackupStats.mp, 15);
  });

  it('restores previous stats when disabling god mode', () => {
    const state = createTestState();
    state.player.hp = 40;
    state.player.mp = 10;
    const enabled = toggleGodMode(state);
    const disabled = toggleGodMode(enabled);
    assert.equal(disabled.player.godMode, false);
    assert.equal(disabled.player.hp, 40);
    assert.equal(disabled.player.mp, 10);
    assert.equal(disabled.player.maxHp, 50);
    assert.equal(disabled.player.maxMp, 15);
    assert.equal(disabled.player.stats.hp, 40);
    assert.equal(disabled.player.stats.mp, 10);
    assert.equal(disabled.player.stats.maxHp, 50);
    assert.equal(disabled.player.stats.maxMp, 15);
    assert.ok(!('__devBackupStats' in disabled.player));
  });
});

describe('fullRestore', () => {
  it('restores hp and mp to their maximum values', () => {
    const state = createTestState();
    state.player.hp = 10;
    state.player.mp = 2;
    const next = fullRestore(state);
    assert.equal(next.player.hp, 50);
    assert.equal(next.player.mp, 15);
    assert.equal(next.player.stats.hp, 50);
    assert.equal(next.player.stats.mp, 15);
  });
});
