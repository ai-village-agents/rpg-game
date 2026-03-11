import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getEnchantingMenuDefaults,
  getEnchantingMenuState,
  renderEnchantingMenu,
  handleEnchantingMenuAction,
} from '../src/enchanting-ui.js';
import { createEnchantingState } from '../src/enchanting.js';

const baseState = (overrides = {}) => ({
  phase: 'exploration',
  player: {
    level: 1,
    inventory: {},
    ...(overrides.player || {}),
  },
  ...overrides,
});

// ── Defaults ───────────────────────────────────────────────────────

describe('getEnchantingMenuDefaults', () => {
  it('returns the default selected slot', () => {
    assert.deepEqual(getEnchantingMenuDefaults(), { selectedSlot: 'weapon' });
  });
});

// ── getEnchantingMenuState ─────────────────────────────────────────

describe('getEnchantingMenuState', () => {
  it('returns the expected shape', () => {
    const state = baseState();
    const result = getEnchantingMenuState(state);
    assert.ok('selectedSlot' in result);
    assert.ok('availableEnchantments' in result);
    assert.ok('currentEnchantments' in result);
    assert.ok('activeEnchantmentBonuses' in result);
  });

  it('defaults selectedSlot to weapon', () => {
    const result = getEnchantingMenuState(baseState());
    assert.equal(result.selectedSlot, 'weapon');
  });

  it('uses selectedSlot from state when provided', () => {
    const result = getEnchantingMenuState(baseState({ enchantingMenuState: { selectedSlot: 'armor' } }));
    assert.equal(result.selectedSlot, 'armor');
  });

  it('returns available enchantments for the selected slot and level', () => {
    const result = getEnchantingMenuState(baseState());
    const ids = result.availableEnchantments.map((entry) => entry.id);
    assert.deepEqual(ids, ['sharpening']);
  });

  it('returns currentEnchantments for each slot', () => {
    const result = getEnchantingMenuState(baseState());
    assert.ok(Object.keys(result.currentEnchantments).includes('weapon'));
    assert.ok(Object.keys(result.currentEnchantments).includes('armor'));
    assert.ok(Object.keys(result.currentEnchantments).includes('accessory'));
  });

  it('returns empty bonuses when nothing is enchanted', () => {
    const result = getEnchantingMenuState(baseState());
    assert.deepEqual(result.activeEnchantmentBonuses, {});
  });

  it('aggregates bonuses from existing enchantments', () => {
    const state = baseState({
      enchantingState: {
        enchantedSlots: { weapon: 'sharpening', armor: 'fortification', accessory: null },
      },
    });
    const result = getEnchantingMenuState(state);
    assert.equal(result.activeEnchantmentBonuses.atk, 3);
    assert.equal(result.activeEnchantmentBonuses.def, 4);
  });
});

// ── renderEnchantingMenu ───────────────────────────────────────────

describe('renderEnchantingMenu', () => {
  it('returns a string', () => {
    const output = renderEnchantingMenu(baseState());
    assert.equal(typeof output, 'string');
  });

  it('includes the selected slot label', () => {
    const output = renderEnchantingMenu(baseState());
    assert.ok(output.includes('Selected Slot: weapon'));
  });

  it('lists current enchantments per slot', () => {
    const output = renderEnchantingMenu(baseState());
    assert.ok(output.includes('Current Enchantments:'));
    assert.ok(output.includes('- weapon:'));
  });

  it('lists available enchantments for the selected slot', () => {
    const output = renderEnchantingMenu(baseState());
    assert.ok(output.includes('Available Enchantments for weapon:'));
    assert.ok(output.includes('Sharpening'));
  });

  it('includes cost details for enchantments', () => {
    const output = renderEnchantingMenu(baseState());
    assert.ok(output.includes('Cost: arcaneEssence x1'));
  });

  it('marks a ready enchantment when requirements are met', () => {
    const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 1 } } });
    const output = renderEnchantingMenu(state);
    assert.ok(output.includes('[Ready]'));
  });

  it('marks a blocked enchantment when requirements are not met', () => {
    const state = baseState();
    const output = renderEnchantingMenu(state);
    assert.ok(output.includes('Blocked: Missing required materials.'));
  });
});

// ── handleEnchantingMenuAction ─────────────────────────────────────

describe('handleEnchantingMenuAction', () => {
  it('opens enchanting and sets phase', () => {
    const state = baseState();
    const next = handleEnchantingMenuAction(state, { type: 'ENCHANTING_OPEN' });
    assert.equal(next.phase, 'enchanting');
  });

  it('opens enchanting and ensures enchantingState', () => {
    const state = baseState();
    const next = handleEnchantingMenuAction(state, { type: 'ENCHANTING_OPEN' });
    assert.deepEqual(next.enchantingState, createEnchantingState());
  });

  it('opens enchanting and ensures enchantingMenuState defaults', () => {
    const state = baseState();
    const next = handleEnchantingMenuAction(state, { type: 'ENCHANTING_OPEN' });
    assert.deepEqual(next.enchantingMenuState, { selectedSlot: 'weapon' });
  });

  it('closes enchanting and returns to exploration', () => {
    const state = baseState({ phase: 'enchanting' });
    const next = handleEnchantingMenuAction(state, { type: 'ENCHANTING_CLOSE' });
    assert.equal(next.phase, 'exploration');
  });

  it('selects a slot in enchantingMenuState', () => {
    const state = baseState();
    const next = handleEnchantingMenuAction(state, { type: 'ENCHANTING_SELECT_SLOT', slot: 'armor' });
    assert.equal(next.enchantingMenuState.selectedSlot, 'armor');
  });

  it('select slot does not remove other state properties', () => {
    const state = baseState({ gold: 10 });
    const next = handleEnchantingMenuAction(state, { type: 'ENCHANTING_SELECT_SLOT', slot: 'accessory' });
    assert.equal(next.gold, 10);
  });

  it('applies enchantment successfully when requirements are met', () => {
    const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 1 } } });
    const result = handleEnchantingMenuAction(state, {
      type: 'ENCHANTING_APPLY',
      slot: 'weapon',
      enchantmentId: 'sharpening',
    });
    assert.equal(result.success, true);
  });

  it('apply returns a success message', () => {
    const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 1 } } });
    const result = handleEnchantingMenuAction(state, {
      type: 'ENCHANTING_APPLY',
      slot: 'weapon',
      enchantmentId: 'sharpening',
    });
    assert.ok(result.message.includes('applied to weapon'));
  });

  it('apply consumes materials on success', () => {
    const state = baseState({ player: { level: 1, inventory: { arcaneEssence: 1 } } });
    const result = handleEnchantingMenuAction(state, {
      type: 'ENCHANTING_APPLY',
      slot: 'weapon',
      enchantmentId: 'sharpening',
    });
    assert.equal(result.state.player.inventory.arcaneEssence, undefined);
  });

  it('apply fails when materials are missing', () => {
    const state = baseState({ player: { level: 1, inventory: {} } });
    const result = handleEnchantingMenuAction(state, {
      type: 'ENCHANTING_APPLY',
      slot: 'weapon',
      enchantmentId: 'sharpening',
    });
    assert.equal(result.success, false);
  });

  it('apply failure returns the reason message', () => {
    const state = baseState({ player: { level: 1, inventory: {} } });
    const result = handleEnchantingMenuAction(state, {
      type: 'ENCHANTING_APPLY',
      slot: 'weapon',
      enchantmentId: 'sharpening',
    });
    assert.equal(result.message, 'Missing required materials.');
  });

  it('removes enchantment successfully when present', () => {
    const state = baseState({
      enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } },
    });
    const result = handleEnchantingMenuAction(state, { type: 'ENCHANTING_REMOVE', slot: 'weapon' });
    assert.equal(result.success, true);
  });

  it('remove clears the selected slot', () => {
    const state = baseState({
      enchantingState: { enchantedSlots: { weapon: 'sharpening', armor: null, accessory: null } },
    });
    const result = handleEnchantingMenuAction(state, { type: 'ENCHANTING_REMOVE', slot: 'weapon' });
    assert.equal(result.state.enchantingState.enchantedSlots.weapon, null);
  });

  it('remove fails when no enchantment is present', () => {
    const state = baseState({ enchantingState: { enchantedSlots: { weapon: null, armor: null, accessory: null } } });
    const result = handleEnchantingMenuAction(state, { type: 'ENCHANTING_REMOVE', slot: 'weapon' });
    assert.equal(result.success, false);
  });

  it('remove failure returns a message', () => {
    const state = baseState({ enchantingState: { enchantedSlots: { weapon: null, armor: null, accessory: null } } });
    const result = handleEnchantingMenuAction(state, { type: 'ENCHANTING_REMOVE', slot: 'weapon' });
    assert.equal(result.message, 'No enchantment to remove.');
  });
});
