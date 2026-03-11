/**
 * Quest Companion Requirements Tests — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Tests for quest-level companion gates and stage-level companion objectives.
 * Covers: checkCompanionRequirements, acceptQuest with gameState,
 *         checkCompanionObjective, onCompanionStateChange,
 *         getAvailableQuestsInRoom, describeCompanionRequirements,
 *         and the getLoyaltyTierIndex defensive fallback.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkCompanionRequirements,
  checkCompanionObjective,
  onCompanionStateChange,
  describeCompanionRequirements,
  initQuestState,
  acceptQuest,
  getAvailableQuestsInRoom
} from '../src/quest-integration.js';

import {
  getLoyaltyTierIndex,
  LOYALTY_TIER_ORDER,
  LOYALTY_TIERS
} from '../src/companion-loyalty-events.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeGameState(companions = []) {
  return { companions };
}

function makeCompanion(id, overrides = {}) {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    class: 'Adventurer',
    level: 1,
    hp: 50, maxHp: 50,
    mp: 20, maxMp: 20,
    attack: 10, defense: 5, speed: 5,
    skills: [],
    alive: true,
    loyalty: 50,
    ...overrides
  };
}

function makeQuestState(overrides = {}) {
  return { ...initQuestState(), ...overrides };
}

// ── getLoyaltyTierIndex defensive fallback (GPT-5.2 nit) ───────────────

test('getLoyaltyTierIndex — returns 0 for loyalty 0 (Abandoned tier)', () => {
  assert.equal(getLoyaltyTierIndex(0), 0);
});

test('getLoyaltyTierIndex — returns correct index for each tier threshold', () => {
  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    const tier = LOYALTY_TIERS[i];
    assert.equal(getLoyaltyTierIndex(tier.threshold), i,
      `Expected tier index ${i} for loyalty ${tier.threshold} (${tier.name})`);
  }
});

test('getLoyaltyTierIndex — returns 5 for loyalty 100 (Soulbound)', () => {
  assert.equal(getLoyaltyTierIndex(100), 5);
});

test('getLoyaltyTierIndex — returns 3 for loyalty 50 (Friendly)', () => {
  assert.equal(getLoyaltyTierIndex(50), 3);
});

test('getLoyaltyTierIndex — handles undefined gracefully (defensive)', () => {
  // getLoyaltyTier handles non-number by defaulting to 0
  const idx = getLoyaltyTierIndex(undefined);
  assert.equal(idx, 0);
});

test('getLoyaltyTierIndex — handles negative values gracefully', () => {
  const idx = getLoyaltyTierIndex(-10);
  assert.equal(idx, 0);
});

test('getLoyaltyTierIndex — handles NaN gracefully', () => {
  const idx = getLoyaltyTierIndex(NaN);
  assert.equal(idx, 0);
});

test('getLoyaltyTierIndex — mid-tier values return correct tier', () => {
  // loyalty 60 should be Friendly (threshold 50, index 3)
  assert.equal(getLoyaltyTierIndex(60), 3);
  // loyalty 80 should be Devoted (threshold 75, index 4)
  assert.equal(getLoyaltyTierIndex(80), 4);
  // loyalty 15 should be Discontent (threshold 10, index 1)
  assert.equal(getLoyaltyTierIndex(15), 1);
});

// ── checkCompanionRequirements ─────────────────────────────────────────

test('checkCompanionRequirements — returns met:true for null/undefined/empty requirements', () => {
  const gs = makeGameState();
  assert.deepEqual(checkCompanionRequirements(gs, null), { met: true, unmet: [] });
  assert.deepEqual(checkCompanionRequirements(gs, undefined), { met: true, unmet: [] });
  assert.deepEqual(checkCompanionRequirements(gs, []), { met: true, unmet: [] });
});

test('checkCompanionRequirements — returns met:true for non-array requirements', () => {
  const gs = makeGameState();
  assert.deepEqual(checkCompanionRequirements(gs, 'not-an-array'), { met: true, unmet: [] });
});

test('checkCompanionRequirements — skips entries without companionId', () => {
  const gs = makeGameState();
  const result = checkCompanionRequirements(gs, [{ inParty: true }]);
  assert.deepEqual(result, { met: true, unmet: [] });
});

test('checkCompanionRequirements — inParty: passes when companion is in party', () => {
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true }
  ]);
  assert.equal(result.met, true);
  assert.equal(result.unmet.length, 0);
});

test('checkCompanionRequirements — inParty: fails when companion not in party', () => {
  const gs = makeGameState([]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet.length, 1);
  assert.equal(result.unmet[0].companionId, 'lyra');
  assert.equal(result.unmet[0].reason, 'not_in_party');
});

test('checkCompanionRequirements — minLoyaltyTier: passes at exact tier', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 50 })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', minLoyaltyTier: 'Friendly' }
  ]);
  assert.equal(result.met, true);
});

test('checkCompanionRequirements — minLoyaltyTier: passes above tier', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 80 })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', minLoyaltyTier: 'Friendly' }
  ]);
  assert.equal(result.met, true);
});

test('checkCompanionRequirements — minLoyaltyTier: fails below tier', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 30 })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', minLoyaltyTier: 'Friendly' }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet[0].reason, 'loyalty_too_low');
});

test('checkCompanionRequirements — minLoyaltyTier: fails with invalid tier name', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 100 })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', minLoyaltyTier: 'InvalidTier' }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet[0].reason, 'loyalty_too_low');
});

test('checkCompanionRequirements — minLoyaltyTier: skipped when companion not in party (no inParty flag)', () => {
  // If companion not in party but inParty not required, loyalty check uses companion lookup
  // getCompanionById returns null, so companion is falsy, loyalty check skipped
  const gs = makeGameState([]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', minLoyaltyTier: 'Friendly' }
  ]);
  // companion is null, so the `req.minLoyaltyTier && companion` check is false
  assert.equal(result.met, true);
});

test('checkCompanionRequirements — requireSoulbound: passes when soulbound', () => {
  const gs = makeGameState([makeCompanion('lyra', { soulbound: true })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', requireSoulbound: true }
  ]);
  assert.equal(result.met, true);
});

test('checkCompanionRequirements — requireSoulbound: fails when not soulbound', () => {
  const gs = makeGameState([makeCompanion('lyra', { soulbound: false })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', requireSoulbound: true }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet[0].reason, 'not_soulbound');
});

test('checkCompanionRequirements — requireSoulbound: fails when companion not in party', () => {
  const gs = makeGameState([]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', requireSoulbound: true }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet[0].reason, 'not_soulbound');
});

test('checkCompanionRequirements — combined: inParty + minLoyaltyTier + soulbound all pass', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 100, soulbound: true })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true, minLoyaltyTier: 'Soulbound', requireSoulbound: true }
  ]);
  assert.equal(result.met, true);
});

test('checkCompanionRequirements — combined: inParty passes but loyalty fails', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 30 })]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true, minLoyaltyTier: 'Devoted' }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet.length, 1);
  assert.equal(result.unmet[0].reason, 'loyalty_too_low');
});

test('checkCompanionRequirements — inParty fails skips loyalty/soulbound checks', () => {
  const gs = makeGameState([]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true, minLoyaltyTier: 'Devoted', requireSoulbound: true }
  ]);
  // Only not_in_party should appear since continue skips remaining checks
  assert.equal(result.met, false);
  assert.equal(result.unmet.length, 1);
  assert.equal(result.unmet[0].reason, 'not_in_party');
});

test('checkCompanionRequirements — multiple companions: all pass', () => {
  const gs = makeGameState([
    makeCompanion('lyra', { loyalty: 75 }),
    makeCompanion('thorin', { loyalty: 50, soulbound: true })
  ]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true, minLoyaltyTier: 'Devoted' },
    { companionId: 'thorin', inParty: true, requireSoulbound: true }
  ]);
  assert.equal(result.met, true);
});

test('checkCompanionRequirements — multiple companions: one fails', () => {
  const gs = makeGameState([
    makeCompanion('lyra', { loyalty: 75 })
  ]);
  const result = checkCompanionRequirements(gs, [
    { companionId: 'lyra', inParty: true },
    { companionId: 'thorin', inParty: true }
  ]);
  assert.equal(result.met, false);
  assert.equal(result.unmet.length, 1);
  assert.equal(result.unmet[0].companionId, 'thorin');
});

// ── checkCompanionObjective ────────────────────────────────────────────

test('checkCompanionObjective — returns false for null gameState', () => {
  assert.equal(checkCompanionObjective(null, { type: 'COMPANION_IN_PARTY', companionId: 'lyra' }), false);
});

test('checkCompanionObjective — returns false for null objective', () => {
  assert.equal(checkCompanionObjective(makeGameState(), null), false);
});

test('checkCompanionObjective — COMPANION_IN_PARTY: true when in party', () => {
  const gs = makeGameState([makeCompanion('lyra')]);
  assert.equal(checkCompanionObjective(gs, { type: 'COMPANION_IN_PARTY', companionId: 'lyra' }), true);
});

test('checkCompanionObjective — COMPANION_IN_PARTY: false when not in party', () => {
  const gs = makeGameState([]);
  assert.equal(checkCompanionObjective(gs, { type: 'COMPANION_IN_PARTY', companionId: 'lyra' }), false);
});

test('checkCompanionObjective — COMPANION_LOYALTY: true at required tier', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 75 })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Devoted'
  }), true);
});

test('checkCompanionObjective — COMPANION_LOYALTY: true above required tier', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 100 })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Devoted'
  }), true);
});

test('checkCompanionObjective — COMPANION_LOYALTY: false below required tier', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 30 })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Devoted'
  }), false);
});

test('checkCompanionObjective — COMPANION_LOYALTY: false when companion not in party', () => {
  const gs = makeGameState([]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Neutral'
  }), false);
});

test('checkCompanionObjective — COMPANION_LOYALTY: false for invalid tier name', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 100 })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'FakeTier'
  }), false);
});

test('checkCompanionObjective — COMPANION_SOULBOUND: true when soulbound', () => {
  const gs = makeGameState([makeCompanion('lyra', { soulbound: true })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_SOULBOUND', companionId: 'lyra'
  }), true);
});

test('checkCompanionObjective — COMPANION_SOULBOUND: false when not soulbound', () => {
  const gs = makeGameState([makeCompanion('lyra')]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_SOULBOUND', companionId: 'lyra'
  }), false);
});

test('checkCompanionObjective — COMPANION_SOULBOUND: false when not in party', () => {
  const gs = makeGameState([]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_SOULBOUND', companionId: 'lyra'
  }), false);
});

test('checkCompanionObjective — unknown type returns false', () => {
  const gs = makeGameState([makeCompanion('lyra')]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'UNKNOWN_TYPE', companionId: 'lyra'
  }), false);
});

// ── onCompanionStateChange ─────────────────────────────────────────────

// We need to mock getExplorationQuest for these tests.
// Since quest-integration.js imports from exploration-quests.js, we need
// quests that exist in the actual data. We'll test with a carefully
// constructed questState that references a real quest ID but with
// companion objectives injected. Since we can't modify quest data easily,
// let's test the function behavior with edge cases.

test('onCompanionStateChange — returns empty results for no active quests', () => {
  const qs = makeQuestState();
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = onCompanionStateChange(qs, gs);
  assert.deepEqual(result.messages, []);
  assert.deepEqual(result.completedObjectives, []);
  assert.deepEqual(result.completedStages, []);
  assert.deepEqual(result.completedQuests, []);
});

test('onCompanionStateChange — returns empty results for quest with no progress', () => {
  const qs = makeQuestState({ activeQuests: ['explore_village'] });
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = onCompanionStateChange(qs, gs);
  // explore_village has EXPLORE objectives, not companion objectives
  // so nothing should be updated
  assert.deepEqual(result.completedObjectives, []);
});

test('onCompanionStateChange — handles quest with no matching quest data gracefully', () => {
  const qs = makeQuestState({
    activeQuests: ['nonexistent_quest'],
    questProgress: { nonexistent_quest: { stageIndex: 0, objectiveProgress: {} } }
  });
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = onCompanionStateChange(qs, gs);
  assert.deepEqual(result.messages, []);
});

test('onCompanionStateChange — does not modify questState when no companion objectives exist', () => {
  const qs = makeQuestState({
    activeQuests: ['explore_village'],
    questProgress: { explore_village: { stageIndex: 0, objectiveProgress: {} } }
  });
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = onCompanionStateChange(qs, gs);
  // questState should be structurally the same
  assert.deepEqual(result.questState.activeQuests, ['explore_village']);
});

// ── acceptQuest with companion requirements (uses real quest data) ──────

test('acceptQuest — works without gameState (backward compatible)', () => {
  const qs = makeQuestState();
  const result = acceptQuest(qs, 'explore_village');
  assert.equal(result.accepted, true);
  assert.ok(result.message.includes('Know Your Surroundings'));
});

test('acceptQuest — works with gameState when quest has no companion requirements', () => {
  const qs = makeQuestState();
  const gs = makeGameState([]);
  const result = acceptQuest(qs, 'explore_village', gs);
  assert.equal(result.accepted, true);
});

test('acceptQuest — still rejects unknown quests with gameState', () => {
  const qs = makeQuestState();
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = acceptQuest(qs, 'nonexistent', gs);
  assert.equal(result.accepted, false);
  assert.ok(result.message.includes('not found'));
});

test('acceptQuest — still rejects already active quests with gameState', () => {
  const qs = makeQuestState({ activeQuests: ['explore_village'] });
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = acceptQuest(qs, 'explore_village', gs);
  assert.equal(result.accepted, false);
  assert.ok(result.message.includes('already active'));
});

test('acceptQuest — still rejects already completed quests with gameState', () => {
  const qs = makeQuestState({ completedQuests: ['explore_village'] });
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = acceptQuest(qs, 'explore_village', gs);
  assert.equal(result.accepted, false);
  assert.ok(result.message.includes('already completed'));
});

test('acceptQuest — still checks prerequisites with gameState', () => {
  const qs = makeQuestState();
  const gs = makeGameState([makeCompanion('lyra')]);
  const result = acceptQuest(qs, 'marsh_mystery', gs);
  assert.equal(result.accepted, false);
  assert.ok(result.message.includes('prerequisite'));
});

// ── describeCompanionRequirements ──────────────────────────────────────

test('describeCompanionRequirements — returns empty for null/undefined quest', () => {
  assert.deepEqual(describeCompanionRequirements(null), []);
  assert.deepEqual(describeCompanionRequirements(undefined), []);
});

test('describeCompanionRequirements — returns empty for quest without requirements', () => {
  assert.deepEqual(describeCompanionRequirements({ name: 'Test' }), []);
});

test('describeCompanionRequirements — returns empty for empty requirements array', () => {
  assert.deepEqual(describeCompanionRequirements({ companionRequirements: [] }), []);
});

test('describeCompanionRequirements — describes inParty requirement', () => {
  const result = describeCompanionRequirements({
    companionRequirements: [{ companionId: 'lyra', inParty: true }]
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].includes('lyra'));
  assert.ok(result[0].includes('party'));
});

test('describeCompanionRequirements — describes minLoyaltyTier requirement', () => {
  const result = describeCompanionRequirements({
    companionRequirements: [{ companionId: 'lyra', minLoyaltyTier: 'Devoted' }]
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].includes('Devoted'));
});

test('describeCompanionRequirements — describes soulbound requirement', () => {
  const result = describeCompanionRequirements({
    companionRequirements: [{ companionId: 'lyra', requireSoulbound: true }]
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].includes('soulbound'));
});

test('describeCompanionRequirements — describes combined requirements', () => {
  const result = describeCompanionRequirements({
    companionRequirements: [
      { companionId: 'lyra', inParty: true, minLoyaltyTier: 'Devoted', requireSoulbound: true }
    ]
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].includes('party'));
  assert.ok(result[0].includes('Devoted'));
  assert.ok(result[0].includes('soulbound'));
});

test('describeCompanionRequirements — multiple companions', () => {
  const result = describeCompanionRequirements({
    companionRequirements: [
      { companionId: 'lyra', inParty: true },
      { companionId: 'thorin', minLoyaltyTier: 'Friendly' }
    ]
  });
  assert.equal(result.length, 2);
});

test('describeCompanionRequirements — filters out empty entries', () => {
  const result = describeCompanionRequirements({
    companionRequirements: [{ companionId: 'lyra' }] // no flags set
  });
  assert.equal(result.length, 0);
});

// ── LOYALTY_TIER_ORDER consistency ─────────────────────────────────────

test('LOYALTY_TIER_ORDER has 6 tiers in ascending order', () => {
  assert.equal(LOYALTY_TIER_ORDER.length, 6);
  assert.deepEqual(LOYALTY_TIER_ORDER, [
    'Abandoned', 'Discontent', 'Neutral', 'Friendly', 'Devoted', 'Soulbound'
  ]);
});

test('LOYALTY_TIER_ORDER matches LOYALTY_TIERS names', () => {
  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    assert.equal(LOYALTY_TIER_ORDER[i], LOYALTY_TIERS[i].name);
  }
});

// ── Edge cases and integration ─────────────────────────────────────────

test('checkCompanionRequirements — loyalty at each tier boundary', () => {
  const tierValues = [
    { loyalty: 0, tier: 'Abandoned', index: 0 },
    { loyalty: 10, tier: 'Discontent', index: 1 },
    { loyalty: 25, tier: 'Neutral', index: 2 },
    { loyalty: 50, tier: 'Friendly', index: 3 },
    { loyalty: 75, tier: 'Devoted', index: 4 },
    { loyalty: 100, tier: 'Soulbound', index: 5 }
  ];

  for (const { loyalty, tier } of tierValues) {
    const gs = makeGameState([makeCompanion('lyra', { loyalty })]);
    const result = checkCompanionRequirements(gs, [
      { companionId: 'lyra', minLoyaltyTier: tier }
    ]);
    assert.equal(result.met, true, `Loyalty ${loyalty} should meet ${tier} tier`);
  }
});

test('checkCompanionRequirements — loyalty just below each tier boundary fails', () => {
  const tierBoundaries = [
    { loyalty: 9, tier: 'Discontent' },
    { loyalty: 24, tier: 'Neutral' },
    { loyalty: 49, tier: 'Friendly' },
    { loyalty: 74, tier: 'Devoted' },
    { loyalty: 99, tier: 'Soulbound' }
  ];

  for (const { loyalty, tier } of tierBoundaries) {
    const gs = makeGameState([makeCompanion('lyra', { loyalty })]);
    const result = checkCompanionRequirements(gs, [
      { companionId: 'lyra', minLoyaltyTier: tier }
    ]);
    assert.equal(result.met, false, `Loyalty ${loyalty} should NOT meet ${tier} tier`);
  }
});

test('checkCompanionObjective — COMPANION_LOYALTY with loyalty exactly 0', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: 0 })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Abandoned'
  }), true);
});

test('checkCompanionObjective — COMPANION_LOYALTY with undefined loyalty defaults to 0', () => {
  const gs = makeGameState([makeCompanion('lyra', { loyalty: undefined })]);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Abandoned'
  }), true);
  assert.equal(checkCompanionObjective(gs, {
    type: 'COMPANION_LOYALTY', companionId: 'lyra', minLoyaltyTier: 'Discontent'
  }), false);
});

// ── Test counter ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

test.after(() => {
  // Node test runner handles counting, but we log for consistency
});

process.on('exit', () => {
  console.log(`\nQuest Companion Requirements Tests complete.`);
});
