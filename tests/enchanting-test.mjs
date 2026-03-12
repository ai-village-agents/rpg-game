/**
 * Enchanting System Tests — AI Village RPG
 * Run: node --test tests/enchanting-test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENCHANTMENTS,
  createEnchantingState,
  ensureEnchantingState,
  getAvailableEnchantments,
  canEnchant,
  applyEnchantment,
  removeEnchantment,
  getEnchantmentBonuses,
  getEnchantedSlot,
  describeEnchantmentCost,
} from '../src/enchanting.js';

const baseState = (overrides = {}) => ({
  player: {
    level: 1,
    inventory: {},
    ...overrides.player,
  },
  ...overrides,
});

// ── createEnchantingState ───────────────────────────────────────────

test('createEnchantingState returns expected shape', () => {
  const state = createEnchantingState();
  assert.deepEqual(state, { enchantedSlots: { weapon: null, armor: null, accessory: null } });
});

// ── ensureEnchantingState ───────────────────────────────────────────

test('ensureEnchantingState creates enchantingState when missing', () => {
  const state = baseState();
  ensureEnchantingState(state);
  assert.ok(state.enchantingState);
  assert.deepEqual(state.enchantingState.enchantedSlots, { weapon: null, armor: null, accessory: null });
});

test('ensureEnchantingState does not overwrite existing enchantingState', () => {
  const state = baseState({ enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } } });
  ensureEnchantingState(state);
  assert.equal(state.enchantingState.enchantedSlots.weapon, 'sharpening');
});

test('ensureEnchantingState fills missing enchantedSlots', () => {
  const state = baseState({ enchantingState: {} });
  ensureEnchantingState(state);
  assert.deepEqual(state.enchantingState.enchantedSlots, { weapon: null, armor: null, accessory: null });
});

test('ensureEnchantingState returns same state reference', () => {
  const state = baseState();
  const result = ensureEnchantingState(state);
  assert.equal(result, state);
});

// ── getAvailableEnchantments ───────────────────────────────────────

test('getAvailableEnchantments filters by slot and level (weapon, level 1)', () => {
  const result = getAvailableEnchantments('weapon', 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'sharpening');
});

test('getAvailableEnchantments includes any-slot enchantments at level 2', () => {
  const result = getAvailableEnchantments('armor', 2).map((entry) => entry.id);
  assert.ok(result.includes('fortification'));
  assert.ok(result.includes('swiftness'));
});

test('getAvailableEnchantments excludes higher level enchantments', () => {
  const result = getAvailableEnchantments('weapon', 3).map((entry) => entry.id);
  assert.ok(!result.includes('shadowEdge'));
});

test('getAvailableEnchantments includes accessory targets', () => {
  const result = getAvailableEnchantments('accessory', 6).map((entry) => entry.id);
  assert.ok(result.includes('shadowCloak'));
  assert.ok(result.includes('ancientWard'));
});

test('getAvailableEnchantments includes any-slot for accessory', () => {
  const result = getAvailableEnchantments('accessory', 2).map((entry) => entry.id);
  assert.ok(result.includes('swiftness'));
});

// ── canEnchant ─────────────────────────────────────────────────────

test('canEnchant rejects invalid slot', () => {
  const state = baseState({ player: { level: 5, inventory: { arcaneEssence: 1 } } });
  const result = canEnchant(state, 'helm', 'sharpening');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Invalid equipment slot.');
});

test('canEnchant rejects unknown enchantment', () => {
  const state = baseState({ player: { level: 5, inventory: { arcaneEssence: 1 } } });
  const result = canEnchant(state, 'weapon', 'unknown');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Unknown enchantment.');
});

test('canEnchant rejects insufficient level', () => {
  const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 2 } } });
  const result = canEnchant(state, 'weapon', 'runicEdge');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Player level too low.');
});

test('canEnchant rejects missing materials', () => {
  const state = baseState({ player: { level: 3, inventory: {} } });
  const result = canEnchant(state, 'weapon', 'arcaneInfusion');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Missing required materials.');
});

test('canEnchant reports missing materials detail', () => {
  const state = baseState({ player: { level: 4, inventory: { shadowShard: 1 } } });
  const result = canEnchant(state, 'weapon', 'shadowEdge');
  assert.equal(result.missingMaterials.length, 1);
  assert.equal(result.missingMaterials[0].itemId, 'ironOre');
  assert.equal(result.missingMaterials[0].missing, 1);
});

test('canEnchant rejects already applied enchantment', () => {
  const state = baseState({
    player: { level: 3, inventory: { arcaneEssence: 2 } },
    enchantingState: { enchantedSlots: { weapon: 'arcaneInfusion', armor: null, accessory: null } },
  });
  const result = canEnchant(state, 'weapon', 'arcaneInfusion');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Enchantment already applied to this slot.');
});

test('canEnchant allows enchant when all conditions met', () => {
  const state = baseState({ player: { level: 3, inventory: { arcaneEssence: 2 } } });
  const result = canEnchant(state, 'weapon', 'arcaneInfusion');
  assert.equal(result.canEnchant, true);
});

test('canEnchant rejects mismatched slot', () => {
  const state = baseState({ player: { level: 5, inventory: { dragonScale: 1 } } });
  const result = canEnchant(state, 'weapon', 'dragonhide');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Enchantment cannot be applied to this slot.');
});

test('canEnchant uses level 0 when player missing', () => {
  const result = canEnchant({}, 'weapon', 'sharpening');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Player level too low.');
});

test('canEnchant treats missing inventory as empty', () => {
  const state = baseState({ player: { level: 2 } });
  const result = canEnchant(state, 'armor', 'fortification');
  assert.equal(result.canEnchant, false);
  assert.equal(result.reason, 'Missing required materials.');
});

// ── applyEnchantment ───────────────────────────────────────────────

test('applyEnchantment fails on invalid slot', () => {
  const state = baseState({ player: { level: 2, inventory: { arcaneEssence: 1 } } });
  const result = applyEnchantment(state, 'ring', 'sharpening');
  assert.equal(result.success, false);
});

test('applyEnchantment fails on unknown enchantment', () => {
  const state = baseState({ player: { level: 2, inventory: { arcaneEssence: 1 } } });
  const result = applyEnchantment(state, 'weapon', 'unknown');
  assert.equal(result.success, false);
});

test('applyEnchantment fails on insufficient level', () => {
  const state = baseState({ player: { level: 1, inventory: { ancientRune: 1 } } });
  const result = applyEnchantment(state, 'armor', 'ancientWard');
  assert.equal(result.success, false);
});

test('applyEnchantment fails on missing materials', () => {
  const state = baseState({ player: { level: 2, inventory: {} } });
  const result = applyEnchantment(state, 'armor', 'fortification');
  assert.equal(result.success, false);
});

test('applyEnchantment does not consume materials on failure', () => {
  const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 1 } } });
  const result = applyEnchantment(state, 'weapon', 'runicEdge');
  assert.equal(result.success, false);
  assert.equal(state.player.inventory.arcaneEssence, 1);
});

test('applyEnchantment consumes materials and sets slot', () => {
  const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 1 } } });
  const result = applyEnchantment(state, 'weapon', 'sharpening');
  assert.equal(result.success, true);
  assert.equal(state.enchantingState.enchantedSlots.weapon, 'sharpening');
  assert.equal(state.player.inventory.arcaneEssence, undefined);
});

test('applyEnchantment handles exact material amounts', () => {
  const state = baseState({ player: { level: 2, inventory: { enchantedThread: 1 } } });
  const result = applyEnchantment(state, 'armor', 'fortification');
  assert.equal(result.success, true);
  assert.equal(state.player.inventory.enchantedThread, undefined);
});

test('applyEnchantment allows replacing a different enchantment', () => {
  const state = baseState({
    player: { level: 3, inventory: { arcaneEssence: 2 } },
    enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } },
  });
  const result = applyEnchantment(state, 'weapon', 'arcaneInfusion');
  assert.equal(result.success, true);
  assert.equal(state.enchantingState.enchantedSlots.weapon, 'arcaneInfusion');
});

// ── removeEnchantment ──────────────────────────────────────────────

test('removeEnchantment rejects invalid slot', () => {
  const state = baseState();
  const result = removeEnchantment(state, 'ring');
  assert.equal(result.success, false);
});

test('removeEnchantment reports empty slot', () => {
  const state = baseState();
  ensureEnchantingState(state);
  const result = removeEnchantment(state, 'weapon');
  assert.equal(result.success, false);
  assert.equal(result.message, 'No enchantment to remove.');
});

test('removeEnchantment clears slot', () => {
  const state = baseState({
    enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } },
  });
  const result = removeEnchantment(state, 'weapon');
  assert.equal(result.success, true);
  assert.equal(state.enchantingState.enchantedSlots.weapon, null);
});

// ── getEnchantmentBonuses ──────────────────────────────────────────

test('getEnchantmentBonuses returns empty object with no enchantments', () => {
  const state = baseState();
  ensureEnchantingState(state);
  const bonuses = getEnchantmentBonuses(state);
  assert.deepEqual(bonuses, {});
});

test('getEnchantmentBonuses returns bonuses for one enchantment', () => {
  const state = baseState({
    enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } },
  });
  const bonuses = getEnchantmentBonuses(state);
  assert.deepEqual(bonuses, { atk: 3 });
});

test('getEnchantmentBonuses sums bonuses from multiple enchantments', () => {
  const state = baseState({
    enchantingState: { enchantedSlots: { weapon: 'shadowEdge', armor: 'fortification', accessory: 'shadowCloak' } },
  });
  const bonuses = getEnchantmentBonuses(state);
  assert.equal(bonuses.atk, 5);
  assert.equal(bonuses.spd, 7);
  assert.equal(bonuses.def, 4);
  assert.equal(bonuses.lck, 5);
});

test('getEnchantmentBonuses ignores unknown enchantment ids', () => {
  const state = baseState({
    enchantingState: { enchantedSlots: { weapon: 'unknown', armor: null, accessory: null } },
  });
  const bonuses = getEnchantmentBonuses(state);
  assert.deepEqual(bonuses, {});
});

// ── getEnchantedSlot ───────────────────────────────────────────────

test('getEnchantedSlot returns null when slot empty', () => {
  const state = baseState();
  ensureEnchantingState(state);
  const result = getEnchantedSlot(state, 'weapon');
  assert.equal(result, null);
});

test('getEnchantedSlot returns enchantment object', () => {
  const state = baseState({
    enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } },
  });
  const result = getEnchantedSlot(state, 'weapon');
  assert.equal(result.id, 'sharpening');
  assert.equal(result.name, ENCHANTMENTS.sharpening.name);
});

test('getEnchantedSlot returns null for invalid slot', () => {
  const state = baseState();
  const result = getEnchantedSlot(state, 'ring');
  assert.equal(result, null);
});

// ── describeEnchantmentCost ────────────────────────────────────────

test('describeEnchantmentCost returns single material string', () => {
  const result = describeEnchantmentCost('sharpening');
  assert.equal(result, 'arcaneEssence x1');
});

test('describeEnchantmentCost returns multiple materials string', () => {
  const result = describeEnchantmentCost('runicEdge');
  assert.equal(result, 'ancientRune x1, arcaneEssence x2');
});

test('describeEnchantmentCost returns empty string for unknown id', () => {
  const result = describeEnchantmentCost('unknown');
  assert.equal(result, '');
});

// ── sanity checks ──────────────────────────────────────────────────

test('ENCHANTMENTS exposes expected ids', () => {
  const ids = Object.keys(ENCHANTMENTS);
  assert.ok(ids.includes('sharpening'));
  assert.ok(ids.includes('infernalBlessing'));
});

test('shadowCloak is restricted to accessory', () => {
  const result = getAvailableEnchantments('weapon', 6).map((entry) => entry.id);
  assert.ok(!result.includes('shadowCloak'));
});

test('infernalBlessing requires level 8', () => {
  const result = getAvailableEnchantments('armor', 7).map((entry) => entry.id);
  assert.ok(!result.includes('infernalBlessing'));
});

test('ancientWard is available at level 6', () => {
  const result = getAvailableEnchantments('armor', 6).map((entry) => entry.id);
  assert.ok(result.includes('ancientWard'));
});

test('canEnchant respects slot match via available list', () => {
  const result = getAvailableEnchantments('armor', 6).map((entry) => entry.id);
  assert.ok(!result.includes('shadowEdge'));
});
