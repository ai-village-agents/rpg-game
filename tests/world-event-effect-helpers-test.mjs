/**
 * Isolated tests for world event effect helper functions.
 *
 * These avoid depending on the canonical world event data (WORLD_EVENTS) so wiring
 * changes can be validated against the helper contracts.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getEffectiveEncounterRate,
  getGoldMultiplier,
  getDamageMultiplier,
  getShopDiscount,
  getMpCostMultiplier,
  isMinimapHidden,
} from '../src/world-events.js';

// ---- getEffectiveEncounterRate ----

test('getEffectiveEncounterRate returns base rate when worldEvent is null/undefined', () => {
  assert.equal(getEffectiveEncounterRate(0.25, null), 0.25);
  assert.equal(getEffectiveEncounterRate(0.25, undefined), 0.25);
});

test('getEffectiveEncounterRate applies encounter_rate_multiplier and caps at 1.0', () => {
  const worldEvent = { effect: { type: 'encounter_rate_multiplier', value: 3 } };
  assert.ok(Math.abs(getEffectiveEncounterRate(0.2, worldEvent) - 0.6) < 1e-12);
  assert.equal(getEffectiveEncounterRate(0.4, worldEvent), 1.0);
});

test('getEffectiveEncounterRate ignores unrelated event types', () => {
  const worldEvent = { effect: { type: 'gold_multiplier', value: 2 } };
  assert.equal(getEffectiveEncounterRate(0.2, worldEvent), 0.2);
});

// ---- getGoldMultiplier ----

test('getGoldMultiplier returns 1.0 when worldEvent is null/undefined', () => {
  assert.equal(getGoldMultiplier(null), 1.0);
  assert.equal(getGoldMultiplier(undefined), 1.0);
});

test('getGoldMultiplier returns effect value only for gold_multiplier events', () => {
  assert.equal(getGoldMultiplier({ effect: { type: 'gold_multiplier', value: 2 } }), 2);
  assert.equal(getGoldMultiplier({ effect: { type: 'damage_multiplier', value: 1.15 } }), 1.0);
});

// ---- getDamageMultiplier ----

test('getDamageMultiplier returns 1.0 when worldEvent is null/undefined', () => {
  assert.equal(getDamageMultiplier(null), 1.0);
  assert.equal(getDamageMultiplier(undefined), 1.0);
});

test('getDamageMultiplier returns effect value only for damage_multiplier events', () => {
  assert.equal(getDamageMultiplier({ effect: { type: 'damage_multiplier', value: 1.15 } }), 1.15);
  assert.equal(getDamageMultiplier({ effect: { type: 'shop_discount', value: 0.2 } }), 1.0);
});

// ---- getShopDiscount ----

test('getShopDiscount returns 0 when worldEvent is null/undefined', () => {
  assert.equal(getShopDiscount(null), 0);
  assert.equal(getShopDiscount(undefined), 0);
});

test('getShopDiscount returns effect value only for shop_discount events', () => {
  assert.equal(getShopDiscount({ effect: { type: 'shop_discount', value: 0.2 } }), 0.2);
  assert.equal(getShopDiscount({ effect: { type: 'mp_cost_multiplier', value: 0.5 } }), 0);
});

// ---- getMpCostMultiplier ----

test('getMpCostMultiplier returns 1.0 when worldEvent is null/undefined', () => {
  assert.equal(getMpCostMultiplier(null), 1.0);
  assert.equal(getMpCostMultiplier(undefined), 1.0);
});

test('getMpCostMultiplier returns effect value only for mp_cost_multiplier events', () => {
  assert.equal(getMpCostMultiplier({ effect: { type: 'mp_cost_multiplier', value: 0.5 } }), 0.5);
  assert.equal(getMpCostMultiplier({ effect: { type: 'hide_minimap', value: true } }), 1.0);
});

// ---- isMinimapHidden ----

test('isMinimapHidden returns false when worldEvent is null/undefined', () => {
  assert.equal(isMinimapHidden(null), false);
  assert.equal(isMinimapHidden(undefined), false);
});

test('isMinimapHidden requires type hide_minimap and value === true', () => {
  assert.equal(isMinimapHidden({ effect: { type: 'hide_minimap', value: true } }), true);
  assert.equal(isMinimapHidden({ effect: { type: 'hide_minimap', value: false } }), false);
  assert.equal(isMinimapHidden({ effect: { type: 'hide_minimap', value: 1 } }), false);
  assert.equal(isMinimapHidden({ effect: { type: 'shop_discount', value: true } }), false);
});
