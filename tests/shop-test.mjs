import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { items } from '../src/data/items.js';
import { initialState, buyItem, sellItem } from '../src/shop.js';

describe('shop', () => {
  it('buyItem decreases gold and adds the item to inventory', () => {
    const { success, state } = buyItem(initialState, 'potion');

    assert.ok(success);
    assert.strictEqual(state.gold, initialState.gold - items.potion.value);
    assert.deepStrictEqual(state.inventory, ['potion']);
    assert.deepStrictEqual(initialState.inventory, []);
  });

  it('buyItem fails when insufficient gold', () => {
    const poorState = { ...initialState, gold: 10, inventory: [] };
    const { success, error, state } = buyItem(poorState, 'ironSword');

    assert.strictEqual(success, false);
    assert.strictEqual(error, 'Insufficient gold.');
    assert.strictEqual(state.gold, 10);
    assert.deepStrictEqual(state.inventory, []);
    assert.deepStrictEqual(poorState.inventory, []);
  });

  it('sellItem increases gold and removes the item from inventory', () => {
    const startingGold = 500;
    const startState = {
      ...initialState,
      gold: startingGold,
      inventory: ['potion', 'ether'],
    };

    const { success, state } = sellItem(startState, 'potion');

    assert.ok(success);
    assert.strictEqual(state.gold, startingGold + items.potion.value);
    assert.deepStrictEqual(state.inventory, ['ether']);
    assert.deepStrictEqual(startState.inventory, ['potion', 'ether']);
  });

  it('sellItem fails when the item is not in inventory', () => {
    const startState = { ...initialState, gold: 200, inventory: ['ether'] };
    const { success, error, state } = sellItem(startState, 'potion');

    assert.strictEqual(success, false);
    assert.strictEqual(error, 'potion not in inventory.');
    assert.strictEqual(state.gold, 200);
    assert.deepStrictEqual(state.inventory, ['ether']);
  });
});
