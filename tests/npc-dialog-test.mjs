import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ROOM_NPCS,
  DIALOG_LINES,
  getNPCsInRoom,
  createDialogState,
  advanceDialog,
  getCurrentDialogLine,
  getDialogProgress,
} from '../src/npc-dialog.js';

describe('ROOM_NPCS', () => {
  it('contains NPCs for center room with correct structure', () => {
    assert.ok(Array.isArray(ROOM_NPCS.center));
    assert.ok(ROOM_NPCS.center.length >= 2);
    const firstNpc = ROOM_NPCS.center[0];
    assert.strictEqual(firstNpc.id, 'village_elder');
    assert.strictEqual(firstNpc.name, 'Village Elder Aldric');

    for (const npc of ROOM_NPCS.center) {
      assert.ok(typeof npc.greeting === 'string');
      assert.ok(Array.isArray(npc.dialog));
      for (const dialogId of npc.dialog) {
        assert.ok(typeof dialogId === 'string');
      }
    }
  });

  it('contains NPCs for all 9 rooms (nw, n, ne, w, center, e, sw, s, se)', () => {
    const rooms = ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'];
    for (const roomId of rooms) {
      assert.ok(Array.isArray(ROOM_NPCS[roomId]));
      assert.ok(ROOM_NPCS[roomId].length >= 1);
    }
  });

  it('all dialog IDs in ROOM_NPCS resolve to DIALOG_LINES entries', () => {
    for (const roomId of Object.keys(ROOM_NPCS)) {
      for (const npc of ROOM_NPCS[roomId]) {
        for (const dialogId of npc.dialog) {
          const lines = DIALOG_LINES[dialogId];
          assert.ok(Array.isArray(lines));
          assert.ok(lines.length > 0);
        }
      }
    }
  });
});

describe('DIALOG_LINES', () => {
  it('has at least 13 dialog entries', () => {
    assert.ok(Object.keys(DIALOG_LINES).length >= 13);
  });

  it('each entry is a non-empty array of strings', () => {
    for (const key of Object.keys(DIALOG_LINES)) {
      const lines = DIALOG_LINES[key];
      assert.ok(Array.isArray(lines));
      assert.ok(lines.length > 0);
      for (const line of lines) {
        assert.ok(typeof line === 'string');
      }
    }
  });
});

describe('getNPCsInRoom', () => {
  it('returns array of NPCs for a known room', () => {
    const npcs = getNPCsInRoom('center');
    assert.ok(npcs.length >= 2);
    assert.strictEqual(npcs[0].id, 'village_elder');
  });

  it('returns empty array for unknown room', () => {
    assert.deepStrictEqual(getNPCsInRoom('unknown'), []);
    assert.deepStrictEqual(getNPCsInRoom(''), []);
    assert.deepStrictEqual(getNPCsInRoom(null), []);
  });

  it('returns copies (not same reference as ROOM_NPCS)', () => {
    const npcs = getNPCsInRoom('center');
    npcs[0].id = 'modified';
    assert.strictEqual(ROOM_NPCS.center[0].id, 'village_elder');
  });
});

describe('createDialogState', () => {
  it('creates dialog state from an NPC object', () => {
    const npc = getNPCsInRoom('center')[0];
    const ds = createDialogState(npc);
    assert.strictEqual(ds.npcId, 'village_elder');
    assert.strictEqual(ds.npcName, 'Village Elder Aldric');
    assert.ok(typeof ds.greeting === 'string' && ds.greeting.length > 0);
    assert.strictEqual(ds.dialogIndex, 0);
    assert.strictEqual(ds.lineIndex, 0);
    assert.strictEqual(ds.done, false);
    assert.strictEqual(ds.lines, DIALOG_LINES.elder_1);
    assert.ok(Array.isArray(ds.dialogIds));
    assert.strictEqual(ds.dialogIds.length, 3);
  });

  it('handles NPC with single dialog section', () => {
    const npc = getNPCsInRoom('n')[0];
    const ds = createDialogState(npc);
    assert.strictEqual(ds.dialogIds.length, 1);
    assert.strictEqual(ds.lines, DIALOG_LINES.scout_1);
  });
});

describe('getCurrentDialogLine', () => {
  it('returns first line of first dialog section initially', () => {
    const ds = createDialogState(getNPCsInRoom('center')[0]);
    const line = getCurrentDialogLine(ds);
    assert.strictEqual(line, DIALOG_LINES.elder_1[0]);
  });

  it('returns null when done', () => {
    const ds = { ...createDialogState(getNPCsInRoom('center')[0]), done: true };
    assert.strictEqual(getCurrentDialogLine(ds), null);
  });

  it('returns greeting when lines is empty', () => {
    const fakeNpc = {
      id: 'test',
      name: 'Test',
      greeting: 'Hello!',
      dialog: ['nonexistent'],
    };
    const ds = createDialogState(fakeNpc);
    assert.strictEqual(getCurrentDialogLine(ds), 'Hello!');
  });
});

describe('advanceDialog', () => {
  it('advances to next line within same section', () => {
    const ds = createDialogState(getNPCsInRoom('center')[0]);
    const ds2 = advanceDialog(ds);
    assert.strictEqual(ds2.lineIndex, 1);
    assert.strictEqual(ds2.dialogIndex, 0);
    assert.strictEqual(ds2.done, false);
  });

  it('advances to next dialog section when at end of lines', () => {
    const ds = createDialogState(getNPCsInRoom('center')[0]);
    const ds1 = advanceDialog(ds);
    const ds2 = advanceDialog(ds1);
    assert.strictEqual(ds2.dialogIndex, 1);
    assert.strictEqual(ds2.lineIndex, 0);
    assert.strictEqual(ds2.lines, DIALOG_LINES.elder_2);
  });

  it('sets done=true when all sections exhausted', () => {
    const ds = createDialogState(getNPCsInRoom('n')[0]);
    const ds1 = advanceDialog(ds);
    const ds2 = advanceDialog(ds1);
    assert.strictEqual(ds2.done, true);
  });

  it('returns new object (immutable)', () => {
    const ds = createDialogState(getNPCsInRoom('center')[0]);
    const ds2 = advanceDialog(ds);
    assert.ok(ds !== ds2);
    assert.strictEqual(ds.lineIndex, 0);
  });

  it('does not change when already done', () => {
    const ds = { ...createDialogState(getNPCsInRoom('n')[0]), done: true };
    const ds2 = advanceDialog(ds);
    assert.strictEqual(ds2.done, true);
  });
});

describe('getDialogProgress', () => {
  it('returns correct progress for initial state', () => {
    const ds = createDialogState(getNPCsInRoom('center')[0]);
    const p = getDialogProgress(ds);
    assert.strictEqual(p.current, 1);
    assert.strictEqual(p.total, DIALOG_LINES.elder_1.length);
    assert.strictEqual(p.sectionCurrent, 1);
    assert.strictEqual(p.sectionTotal, 3);
  });

  it('updates correctly after advancing', () => {
    const ds = createDialogState(getNPCsInRoom('center')[0]);
    const ds2 = advanceDialog(ds);
    const p = getDialogProgress(ds2);
    assert.strictEqual(p.current, 2);
    assert.strictEqual(p.sectionCurrent, 1);
  });
});
