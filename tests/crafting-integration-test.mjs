import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyCraftingMaterialDrops,
  getCraftingDropMessages,
} from '../src/crafting-integration.js';

const rngAlways = () => 0;
const rngNever = () => 1;

function makeState(overrides = {}) {
  const playerInventory = (overrides.player && overrides.player.inventory) || {};
  return {
    inventory: { ...playerInventory, ...(overrides.inventory || {}) },
    player: { inventory: playerInventory, ...(overrides.player || {}) },
    ...(overrides || {}),
  };
}

function getDropIds(drops) {
  return drops.map((drop) => drop.materialId).sort();
}

describe('Crafting Integration', () => {
  describe('applyCraftingMaterialDrops', () => {
    it('returns empty drops when no enemies', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [], rngAlways);
      assert.deepStrictEqual(result.drops, []);
      assert.deepStrictEqual(result.messages, []);
    });

    it('level-1 enemy only draws from basic pool', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 1 }], rngAlways);
      assert.deepStrictEqual(getDropIds(result.drops), ['beastFang', 'herbBundle', 'ironOre']);
    });

    it('level-4 enemy can draw arcaneEssence, enchantedThread, crystalLens', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 4 }], rngAlways);
      const ids = getDropIds(result.drops);
      assert.ok(ids.includes('arcaneEssence'));
      assert.ok(ids.includes('enchantedThread'));
      assert.ok(ids.includes('crystalLens'));
    });

    it('level-7 enemy can draw dragonScale, shadowShard', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 7 }], rngAlways);
      const ids = getDropIds(result.drops);
      assert.ok(ids.includes('dragonScale'));
      assert.ok(ids.includes('shadowShard'));
    });

    it('level-10 enemy can draw ancientRune, phoenixFeather', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 10 }], rngAlways);
      const ids = getDropIds(result.drops);
      assert.ok(ids.includes('ancientRune'));
      assert.ok(ids.includes('phoenixFeather'));
    });

    it('adds materials to player inventory', () => {
      const state = makeState({ player: { inventory: { herbBundle: 1 } } });
      const result = applyCraftingMaterialDrops(state, [{ level: 1 }], rngAlways);
      assert.equal(result.state.inventory.herbBundle, 2);
      assert.equal(result.state.inventory.ironOre, 1);
      assert.equal(result.state.inventory.beastFang, 1);
    });

    it('uses highest enemy level when multiple enemies', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(
        state,
        [{ level: 2, side: 'enemy' }, { level: 8, side: 'enemy' }],
        rngAlways
      );
      const ids = getDropIds(result.drops);
      assert.ok(ids.includes('dragonScale'));
      assert.ok(ids.includes('shadowShard'));
      assert.ok(!ids.includes('ancientRune'));
      assert.ok(!ids.includes('phoenixFeather'));
    });

    it('deterministic rng returning 0 drops all materials', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 4 }], rngAlways);
      assert.equal(result.drops.length, 6);
    });

    it('deterministic rng returning 1 drops nothing', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 10 }], rngNever);
      assert.deepStrictEqual(result.drops, []);
    });

    it('returns correct messages', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 1 }], rngAlways);
      const expected = getCraftingDropMessages(result.drops);
      assert.deepStrictEqual(result.messages, expected);
    });

    it('handles missing inventory gracefully', () => {
      const state = { player: {} };
      const result = applyCraftingMaterialDrops(state, [{ level: 1 }], rngAlways);
      assert.ok(result.state.inventory);
      assert.equal(result.state.inventory.herbBundle, 1);
    });

    it('returns drops with materialId, quantity, name', () => {
      const state = makeState();
      const result = applyCraftingMaterialDrops(state, [{ level: 1 }], rngAlways);
      assert.ok(result.drops.length > 0);
      const drop = result.drops[0];
      assert.ok(drop.materialId);
      assert.ok(drop.quantity);
      assert.ok(drop.name);
    });

    it('multiple calls accumulate inventory correctly', () => {
      const state = makeState();
      const first = applyCraftingMaterialDrops(state, [{ level: 1 }], rngAlways);
      const second = applyCraftingMaterialDrops(first.state, [{ level: 1 }], rngAlways);
      assert.equal(second.state.inventory.herbBundle, 2);
      assert.equal(second.state.inventory.ironOre, 2);
      assert.equal(second.state.inventory.beastFang, 2);
    });
  });

  describe('getCraftingDropMessages', () => {
    it('returns proper message format', () => {
      const messages = getCraftingDropMessages([
        { materialId: 'herbBundle', quantity: 1, name: 'Herb Bundle' },
      ]);
      assert.deepStrictEqual(messages, ['📦 Found 1x Herb Bundle (material)!']);
    });

    it('returns empty array for empty drops', () => {
      assert.deepStrictEqual(getCraftingDropMessages([]), []);
    });
  });
});
