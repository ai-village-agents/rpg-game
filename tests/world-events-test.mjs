/**
 * Tests for the World Event System.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { WORLD_EVENTS, EVENT_POOL, WORLD_EVENT_TRIGGER_CHANCE } from '../src/data/world-events.js';
import {
  pickRandomEvent,
  rollEventDuration,
  createWorldEvent,
  tryTriggerWorldEvent,
  tickWorldEvent,
  applyImmediateEffect,
  applyPerMoveEffect,
  getEffectiveEncounterRate,
  getGoldMultiplier,
  getDamageMultiplier,
  getShopDiscount,
  getMpCostMultiplier,
  isMinimapHidden,
  hasActiveWorldEvent,
  getWorldEventBanner,
} from '../src/world-events.js';

// ---- Data integrity tests ----

test('WORLD_EVENTS has at least 8 entries', () => {
  assert.ok(Object.keys(WORLD_EVENTS).length >= 8);
});

test('all WORLD_EVENTS have required fields', () => {
  for (const [id, ev] of Object.entries(WORLD_EVENTS)) {
    assert.equal(ev.id, id, `id mismatch for ${id}`);
    assert.ok(ev.name, `missing name for ${id}`);
    assert.ok(ev.description, `missing description for ${id}`);
    assert.ok(ev.icon, `missing icon for ${id}`);
    assert.ok(ev.minMoves >= 1, `invalid minMoves for ${id}`);
    assert.ok(ev.maxMoves >= ev.minMoves, `maxMoves < minMoves for ${id}`);
    assert.ok(ev.effect && ev.effect.type, `missing effect.type for ${id}`);
    assert.ok(['common', 'uncommon', 'rare'].includes(ev.rarity), `invalid rarity for ${id}`);
  }
});

test('EVENT_POOL contains valid event IDs', () => {
  for (const id of EVENT_POOL) {
    assert.ok(WORLD_EVENTS[id], `Unknown event ID in pool: ${id}`);
  }
});

test('EVENT_POOL has at least 8 entries', () => {
  assert.ok(EVENT_POOL.length >= 8);
});

test('WORLD_EVENT_TRIGGER_CHANCE is between 0 and 1', () => {
  assert.ok(WORLD_EVENT_TRIGGER_CHANCE > 0 && WORLD_EVENT_TRIGGER_CHANCE < 1);
});

test('merchant_caravan has shop_discount effect', () => {
  assert.equal(WORLD_EVENTS.merchant_caravan.effect.type, 'shop_discount');
  assert.ok(WORLD_EVENTS.merchant_caravan.effect.value > 0);
});

test('monster_horde has encounter_rate_multiplier effect > 1', () => {
  assert.equal(WORLD_EVENTS.monster_horde.effect.type, 'encounter_rate_multiplier');
  assert.ok(WORLD_EVENTS.monster_horde.effect.value > 1);
});

test('wandering_healer has rare rarity', () => {
  assert.equal(WORLD_EVENTS.wandering_healer.rarity, 'rare');
});

// ---- pickRandomEvent ----

test('pickRandomEvent returns a valid event ID', () => {
  const id = pickRandomEvent(42);
  assert.ok(WORLD_EVENTS[id], `Invalid event ID: ${id}`);
});

test('pickRandomEvent is deterministic for same seed', () => {
  assert.equal(pickRandomEvent(100), pickRandomEvent(100));
});

test('pickRandomEvent handles seed=0', () => {
  const id = pickRandomEvent(0);
  assert.ok(WORLD_EVENTS[id]);
});

// ---- rollEventDuration ----

test('rollEventDuration returns value within [minMoves, maxMoves]', () => {
  const def = WORLD_EVENTS.merchant_caravan;
  for (let seed = 0; seed < 20; seed++) {
    const d = rollEventDuration(def, seed);
    assert.ok(d >= def.minMoves && d <= def.maxMoves, `duration ${d} out of range for seed ${seed}`);
  }
});

// ---- createWorldEvent ----

test('createWorldEvent returns correct structure', () => {
  const ev = createWorldEvent('merchant_caravan', 1);
  assert.equal(ev.eventId, 'merchant_caravan');
  assert.equal(ev.name, WORLD_EVENTS.merchant_caravan.name);
  assert.ok(ev.icon);
  assert.ok(ev.movesRemaining >= WORLD_EVENTS.merchant_caravan.minMoves);
  assert.ok(ev.movesRemaining <= WORLD_EVENTS.merchant_caravan.maxMoves);
  assert.equal(ev.totalMoves, ev.movesRemaining);
  assert.deepEqual(ev.effect, WORLD_EVENTS.merchant_caravan.effect);
});

test('createWorldEvent throws for unknown eventId', () => {
  assert.throws(() => createWorldEvent('nonexistent_event', 1), /Unknown world event/);
});

test('createWorldEvent copies effect (immutable)', () => {
  const ev = createWorldEvent('dark_omen', 1);
  ev.effect.value = 999;
  assert.equal(WORLD_EVENTS.dark_omen.effect.value, 1.15);
});

// ---- tickWorldEvent ----

test('tickWorldEvent decrements movesRemaining', () => {
  const ev = createWorldEvent('monster_horde', 0); // minMoves=3
  const ticked = tickWorldEvent(ev);
  assert.equal(ticked.movesRemaining, ev.movesRemaining - 1);
});

test('tickWorldEvent returns null when event expires', () => {
  const ev = { ...createWorldEvent('fog_of_war', 0), movesRemaining: 1 };
  assert.equal(tickWorldEvent(ev), null);
});

test('tickWorldEvent returns null for null input', () => {
  assert.equal(tickWorldEvent(null), null);
});

test('tickWorldEvent does not mutate original', () => {
  const ev = createWorldEvent('blessing_of_light', 5);
  const original = ev.movesRemaining;
  tickWorldEvent(ev);
  assert.equal(ev.movesRemaining, original);
});

// ---- applyImmediateEffect ----

test('applyImmediateEffect restores HP for wandering_healer', () => {
  const state = { player: { hp: 30, maxHp: 100, mp: 5, maxMp: 40 } };
  const ev = createWorldEvent('wandering_healer', 0);
  const result = applyImmediateEffect(state, ev);
  assert.equal(result.player.hp, 100);
  assert.equal(result.player.mp, 40);
});

test('applyImmediateEffect does not modify state for non-restore events', () => {
  const state = { player: { hp: 50, maxHp: 100 } };
  const ev = createWorldEvent('dark_omen', 0);
  const result = applyImmediateEffect(state, ev);
  assert.equal(result.player.hp, 50);
});

test('applyImmediateEffect returns state unchanged for null event', () => {
  const state = { player: { hp: 50 } };
  assert.deepEqual(applyImmediateEffect(state, null), state);
});

// ---- applyPerMoveEffect ----

test('applyPerMoveEffect heals 10% maxHp for blessing_of_light', () => {
  const state = { player: { hp: 50, maxHp: 100 } };
  const ev = createWorldEvent('blessing_of_light', 0);
  const result = applyPerMoveEffect(state, ev);
  assert.equal(result.player.hp, 60);
});

test('applyPerMoveEffect does not exceed maxHp', () => {
  const state = { player: { hp: 98, maxHp: 100 } };
  const ev = createWorldEvent('blessing_of_light', 0);
  const result = applyPerMoveEffect(state, ev);
  assert.equal(result.player.hp, 100);
});

test('applyPerMoveEffect returns state unchanged for null event', () => {
  const state = { player: { hp: 50, maxHp: 100 } };
  assert.deepEqual(applyPerMoveEffect(state, null), state);
});

// ---- Effect getters ----

test('getEffectiveEncounterRate doubles rate for monster_horde', () => {
  const ev = createWorldEvent('monster_horde', 0);
  const rate = getEffectiveEncounterRate(0.3, ev);
  assert.equal(rate, 0.6);
});

test('getEffectiveEncounterRate caps at 1.0', () => {
  const ev = createWorldEvent('monster_horde', 0);
  const rate = getEffectiveEncounterRate(0.7, ev);
  assert.equal(rate, 1.0);
});

test('getEffectiveEncounterRate returns base rate for unrelated event', () => {
  const ev = createWorldEvent('dark_omen', 0);
  assert.equal(getEffectiveEncounterRate(0.3, ev), 0.3);
});

test('getEffectiveEncounterRate returns base rate for null', () => {
  assert.equal(getEffectiveEncounterRate(0.3, null), 0.3);
});

test('getGoldMultiplier returns 2.0 for treasure_map_found', () => {
  const ev = createWorldEvent('treasure_map_found', 0);
  assert.equal(getGoldMultiplier(ev), 2.0);
});

test('getGoldMultiplier returns 1.0 for unrelated event', () => {
  const ev = createWorldEvent('dark_omen', 0);
  assert.equal(getGoldMultiplier(ev), 1.0);
});

test('getGoldMultiplier returns 1.0 for null', () => {
  assert.equal(getGoldMultiplier(null), 1.0);
});

test('getDamageMultiplier returns 1.15 for dark_omen', () => {
  const ev = createWorldEvent('dark_omen', 0);
  assert.equal(getDamageMultiplier(ev), 1.15);
});

test('getDamageMultiplier returns 1.0 for unrelated event', () => {
  const ev = createWorldEvent('fog_of_war', 0);
  assert.equal(getDamageMultiplier(ev), 1.0);
});

test('getDamageMultiplier returns 1.0 for null', () => {
  assert.equal(getDamageMultiplier(null), 1.0);
});

test('getShopDiscount returns 0.20 for merchant_caravan', () => {
  const ev = createWorldEvent('merchant_caravan', 0);
  assert.equal(getShopDiscount(ev), 0.20);
});

test('getShopDiscount returns 0 for unrelated event', () => {
  const ev = createWorldEvent('dark_omen', 0);
  assert.equal(getShopDiscount(ev), 0);
});

test('getShopDiscount returns 0 for null', () => {
  assert.equal(getShopDiscount(null), 0);
});

test('getMpCostMultiplier returns 0.50 for ancient_ruins', () => {
  const ev = createWorldEvent('ancient_ruins', 0);
  assert.equal(getMpCostMultiplier(ev), 0.50);
});

test('getMpCostMultiplier returns 1.0 for null', () => {
  assert.equal(getMpCostMultiplier(null), 1.0);
});

test('isMinimapHidden returns true for fog_of_war', () => {
  const ev = createWorldEvent('fog_of_war', 0);
  assert.equal(isMinimapHidden(ev), true);
});

test('isMinimapHidden returns false for other events', () => {
  const ev = createWorldEvent('dark_omen', 0);
  assert.equal(isMinimapHidden(ev), false);
});

test('isMinimapHidden returns false for null', () => {
  assert.equal(isMinimapHidden(null), false);
});

// ---- hasActiveWorldEvent ----

test('hasActiveWorldEvent returns true for active event', () => {
  const ev = createWorldEvent('merchant_caravan', 0);
  assert.equal(hasActiveWorldEvent(ev), true);
});

test('hasActiveWorldEvent returns false for null', () => {
  assert.equal(hasActiveWorldEvent(null), false);
});

test('hasActiveWorldEvent returns false for expired event', () => {
  const ev = { ...createWorldEvent('dark_omen', 0), movesRemaining: 0 };
  assert.equal(hasActiveWorldEvent(ev), false);
});

// ---- getWorldEventBanner ----

test('getWorldEventBanner returns non-null string for active event', () => {
  const ev = createWorldEvent('merchant_caravan', 0);
  const banner = getWorldEventBanner(ev);
  assert.ok(banner && typeof banner === 'string');
  assert.ok(banner.includes('Merchant Caravan'));
});

test('getWorldEventBanner returns null for null event', () => {
  assert.equal(getWorldEventBanner(null), null);
});

test('getWorldEventBanner uses singular "move" when 1 remaining', () => {
  const ev = { ...createWorldEvent('dark_omen', 0), movesRemaining: 1 };
  const banner = getWorldEventBanner(ev);
  assert.ok(banner.includes('1 move remaining'));
  assert.ok(!banner.includes('moves remaining'));
});

test('getWorldEventBanner uses plural "moves" when > 1 remaining', () => {
  const ev = { ...createWorldEvent('dark_omen', 0), movesRemaining: 3 };
  const banner = getWorldEventBanner(ev);
  assert.ok(banner.includes('3 moves remaining'));
});

// ---- tryTriggerWorldEvent ----

test('tryTriggerWorldEvent returns null when event already active', () => {
  const existing = createWorldEvent('dark_omen', 0);
  const result = tryTriggerWorldEvent(999, existing);
  assert.equal(result, null);
});

test('tryTriggerWorldEvent can return an event for seeds that trigger', () => {
  // Test many seeds, some should trigger
  let triggered = false;
  for (let seed = 1; seed < 200; seed++) {
    const result = tryTriggerWorldEvent(seed, null);
    if (result !== null) {
      triggered = true;
      assert.ok(WORLD_EVENTS[result.eventId], `Invalid eventId: ${result.eventId}`);
      assert.ok(result.movesRemaining > 0);
      break;
    }
  }
  assert.ok(triggered, 'No events triggered across 200 seeds');
});

// ---- Forbidden motifs ----

test('no forbidden words in world-events data', async () => {
  const { readFileSync } = await import('node:fs');
  const content = readFileSync(new URL('../src/data/world-events.js', import.meta.url), 'utf8').toLowerCase();
  const banned = ['egg', 'easter', 'yolk', 'omelet', 'omelette', 'rabbit', 'chick', 'basket', 'cockatrice', 'basilisk'];
  for (const word of banned) {
    assert.ok(!content.includes(word), `Forbidden word "${word}" found in src/data/world-events.js`);
  }
});

test('no forbidden words in world-events logic', async () => {
  const { readFileSync } = await import('node:fs');
  const content = readFileSync(new URL('../src/world-events.js', import.meta.url), 'utf8').toLowerCase();
  const banned = ['egg', 'easter', 'yolk', 'omelet', 'omelette', 'rabbit', 'chick', 'basket', 'cockatrice', 'basilisk'];
  for (const word of banned) {
    assert.ok(!content.includes(word), `Forbidden word "${word}" found in src/world-events.js`);
  }
});
