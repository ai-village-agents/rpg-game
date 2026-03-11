import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { DUNGEON_FLOORS, getFloorData } from '../src/dungeon-floors.js';
import { getFlavorText } from '../src/dungeon-ui.js';

describe('DUNGEON_FLOORS flavor text fields', () => {
  test('all 10 floors have entryText string', () => {
    assert.equal(DUNGEON_FLOORS.length, 10);

    for (const floor of DUNGEON_FLOORS) {
      assert.equal(typeof floor.entryText, 'string');
      assert.ok(floor.entryText.length > 0);
    }
  });

  test('all 10 floors have ambientMessages array of 3 strings', () => {
    assert.equal(DUNGEON_FLOORS.length, 10);

    for (const floor of DUNGEON_FLOORS) {
      assert.ok(Array.isArray(floor.ambientMessages));
      assert.equal(floor.ambientMessages.length, 3);

      for (const message of floor.ambientMessages) {
        assert.equal(typeof message, 'string');
        assert.ok(message.length > 0);
      }
    }
  });

  test('all 10 floors have clearText string', () => {
    assert.equal(DUNGEON_FLOORS.length, 10);

    for (const floor of DUNGEON_FLOORS) {
      assert.equal(typeof floor.clearText, 'string');
      assert.ok(floor.clearText.length > 0);
    }
  });

  test('no floor flavor text contains forbidden words', () => {
    const forbidden = /\b(egg|easter|yolk|omelet|omelette|rabbit|chick|basket|cockatrice|basilisk)\b/i;

    for (const floor of DUNGEON_FLOORS) {
      const text = [
        floor.entryText,
        ...(Array.isArray(floor.ambientMessages) ? floor.ambientMessages : []),
        floor.clearText,
      ].join(' ');

      assert.ok(!forbidden.test(text));
    }
  });
});

describe('getFlavorText', () => {
  test('returns all three flavor text fields for floor 1', () => {
    const floor = getFloorData(1);
    const result = getFlavorText(floor, false);

    assert.equal(result.entryText, floor.entryText);
    assert.equal(result.ambientMessages, floor.ambientMessages);
    assert.equal(result.clearText, floor.clearText);
  });

  test('returns empty strings for missing fields', () => {
    const result = getFlavorText({}, false);

    assert.equal(result.entryText, '');
    assert.deepEqual(result.ambientMessages, []);
    assert.equal(result.clearText, '');
  });

  test('returns correct data when cleared=true', () => {
    const floor = getFloorData(5);
    const result = getFlavorText(floor, true);

    assert.equal(typeof result.entryText, 'string');
    assert.ok(result.entryText.length > 0);
    assert.ok(Array.isArray(result.ambientMessages));
    assert.ok(result.ambientMessages.length > 0);
    assert.ok(result.ambientMessages.every((message) => typeof message === 'string' && message.length > 0));
    assert.equal(typeof result.clearText, 'string');
    assert.ok(result.clearText.length > 0);
  });
});

describe('flavor text across all floors', () => {
  test('entryText for each floor is thematically appropriate (non-empty)', () => {
    for (const floor of DUNGEON_FLOORS) {
      assert.ok(typeof floor.entryText === 'string');
      assert.ok(floor.entryText.length >= 20);
    }
  });

  test('clearText for each floor is non-empty and distinct from entryText', () => {
    for (const floor of DUNGEON_FLOORS) {
      assert.ok(typeof floor.clearText === 'string');
      assert.ok(floor.clearText.length > 0);
      assert.notEqual(floor.clearText, floor.entryText);
    }
  });

  test('ambientMessages for each floor are all distinct from each other', () => {
    for (const floor of DUNGEON_FLOORS) {
      assert.ok(Array.isArray(floor.ambientMessages));
      assert.equal(new Set(floor.ambientMessages).size, floor.ambientMessages.length);
    }
  });
});
