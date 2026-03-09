/**
 * Loyalty-Based Dialog Branching Tests
 * Owner: Claude Opus 4.6
 *
 * Tests for the companionLoyalty, companionInParty, and companionSoulbound
 * condition types in RelationshipDialogManager, plus companion loyalty
 * branching dialog helpers and dialog variant generation.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  LOYALTY_TIERS,
  LOYALTY_TIER_ORDER,
  getLoyaltyTier,
  getLoyaltyTierIndex,
} from '../src/companion-loyalty-events.js';

import {
  RelationshipDialogManager,
  createCompanionLoyaltyBranchingDialog,
  getCompanionLoyaltyDialogVariant,
} from '../src/relationship-dialog.js';

import { NPCRelationshipManager } from '../src/npc-relationships.js';

const counts = { passed: 0, failed: 0 };
const countedTest = (name, fn) => test(name, async (t) => {
  try {
    await fn(t);
    counts.passed += 1;
  } catch (err) {
    counts.failed += 1;
    throw err;
  }
});

process.on('exit', () => {
  console.log(`Test counter - passed: ${counts.passed}, failed: ${counts.failed}`);
});

// ── Helper: create a game state with companions ──────────────────────
function makeState(companions = []) {
  return {
    companions,
    maxCompanions: 2,
    player: { level: 5, gold: 100, inventory: [] },
    questState: { activeQuests: [], completedQuests: [] },
  };
}

function makeCompanion(id, loyalty, opts = {}) {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    class: 'warrior',
    level: 3,
    hp: 50, maxHp: 50,
    mp: 20, maxMp: 20,
    attack: 10, defense: 8, speed: 5,
    skills: [],
    alive: true,
    loyalty,
    soulbound: opts.soulbound || false,
    ...opts,
  };
}

// ── LOYALTY_TIER_ORDER and getLoyaltyTierIndex tests ─────────────────

describe('LOYALTY_TIER_ORDER — single source of truth', () => {
  countedTest('exports an array of 6 tier names', () => {
    assert.ok(Array.isArray(LOYALTY_TIER_ORDER));
    assert.strictEqual(LOYALTY_TIER_ORDER.length, 6);
  });

  countedTest('tier names match LOYALTY_TIERS in order', () => {
    const expected = LOYALTY_TIERS.map(t => t.name);
    assert.deepStrictEqual(LOYALTY_TIER_ORDER, expected);
  });

  countedTest('ascending order: Abandoned < Discontent < Neutral < Friendly < Devoted < Soulbound', () => {
    const expected = ['Abandoned', 'Discontent', 'Neutral', 'Friendly', 'Devoted', 'Soulbound'];
    assert.deepStrictEqual(LOYALTY_TIER_ORDER, expected);
  });
});

describe('getLoyaltyTierIndex — maps loyalty values to tier indices', () => {
  countedTest('loyalty 0 → index 0 (Abandoned)', () => {
    assert.strictEqual(getLoyaltyTierIndex(0), 0);
  });

  countedTest('loyalty 10 → index 1 (Discontent)', () => {
    assert.strictEqual(getLoyaltyTierIndex(10), 1);
  });

  countedTest('loyalty 25 → index 2 (Neutral)', () => {
    assert.strictEqual(getLoyaltyTierIndex(25), 2);
  });

  countedTest('loyalty 50 → index 3 (Friendly)', () => {
    assert.strictEqual(getLoyaltyTierIndex(50), 3);
  });

  countedTest('loyalty 75 → index 4 (Devoted)', () => {
    assert.strictEqual(getLoyaltyTierIndex(75), 4);
  });

  countedTest('loyalty 100 → index 5 (Soulbound)', () => {
    assert.strictEqual(getLoyaltyTierIndex(100), 5);
  });

  countedTest('loyalty 49 → index 2 (Neutral, just below Friendly)', () => {
    assert.strictEqual(getLoyaltyTierIndex(49), 2);
  });

  countedTest('loyalty 74 → index 3 (Friendly, just below Devoted)', () => {
    assert.strictEqual(getLoyaltyTierIndex(74), 3);
  });

  countedTest('loyalty 9 → index 0 (Abandoned, just below Discontent)', () => {
    assert.strictEqual(getLoyaltyTierIndex(9), 0);
  });

  countedTest('non-number loyalty defaults to index 0', () => {
    assert.strictEqual(getLoyaltyTierIndex(undefined), 0);
    assert.strictEqual(getLoyaltyTierIndex(null), 0);
  });
});

// ── companionLoyalty condition type — operator semantics ─────────────

describe('companionLoyalty condition — operator semantics', () => {
  const mgr = new RelationshipDialogManager(new NPCRelationshipManager());

  // Fenris at loyalty 75 = Devoted (index 4)
  const state = makeState([makeCompanion('fenris', 75)]);

  countedTest('>= Devoted (75 >= 75) → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('>= Soulbound (75 >= 100) → false', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Soulbound', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('>= Friendly (75 >= 50) → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Friendly', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('== Devoted (75 == 75) → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '==' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('== Friendly (75 != 50) → false', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Friendly', operator: '==' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('!= Abandoned → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Abandoned', operator: '!=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('!= Devoted → false', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '!=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('> Friendly (Devoted > Friendly) → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Friendly', operator: '>' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('> Devoted (Devoted > Devoted) → false', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '>' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('< Soulbound (Devoted < Soulbound) → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Soulbound', operator: '<' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('< Devoted (Devoted < Devoted) → false', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '<' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('<= Devoted (Devoted <= Devoted) → true', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '<=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('<= Neutral (Devoted <= Neutral) → false', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Neutral', operator: '<=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('default operator is >= when omitted', () => {
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Neutral' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });
});

// ── companionLoyalty condition — edge cases and unknown tiers ─────────

describe('companionLoyalty condition — edge cases', () => {
  const mgr = new RelationshipDialogManager(new NPCRelationshipManager());

  countedTest('unknown tier name → false', () => {
    const state = makeState([makeCompanion('fenris', 75)]);
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'UnknownTier', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('missing companionId → false', () => {
    const state = makeState([makeCompanion('fenris', 75)]);
    const cond = { type: 'companionLoyalty', tier: 'Devoted', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('missing tier → false', () => {
    const state = makeState([makeCompanion('fenris', 75)]);
    const cond = { type: 'companionLoyalty', companionId: 'fenris', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('companion not in party → false', () => {
    const state = makeState([]);
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Neutral', operator: '>=' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('loyalty 0 (Abandoned) == Abandoned → true', () => {
    const state = makeState([makeCompanion('fenris', 0)]);
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Abandoned', operator: '==' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('loyalty 100 (Soulbound) == Soulbound → true', () => {
    const state = makeState([makeCompanion('fenris', 100)]);
    const cond = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Soulbound', operator: '==' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('works with multiple companions — targets correct one', () => {
    const state = makeState([
      makeCompanion('fenris', 75),
      makeCompanion('lyra', 25),
    ]);
    const condFenris = { type: 'companionLoyalty', companionId: 'fenris', tier: 'Devoted', operator: '==' };
    const condLyra = { type: 'companionLoyalty', companionId: 'lyra', tier: 'Neutral', operator: '==' };
    assert.strictEqual(mgr.evaluateCondition(condFenris, state), true);
    assert.strictEqual(mgr.evaluateCondition(condLyra, state), true);
  });
});

// ── companionInParty condition type ──────────────────────────────────

describe('companionInParty condition type', () => {
  const mgr = new RelationshipDialogManager(new NPCRelationshipManager());

  countedTest('companion present → true', () => {
    const state = makeState([makeCompanion('fenris', 50)]);
    const cond = { type: 'companionInParty', companionId: 'fenris' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('companion absent → false', () => {
    const state = makeState([]);
    const cond = { type: 'companionInParty', companionId: 'fenris' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('missing companionId → false', () => {
    const state = makeState([makeCompanion('fenris', 50)]);
    const cond = { type: 'companionInParty' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('different companion present → false for absent one', () => {
    const state = makeState([makeCompanion('lyra', 50)]);
    const cond = { type: 'companionInParty', companionId: 'fenris' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });
});

// ── companionSoulbound condition type ────────────────────────────────

describe('companionSoulbound condition type', () => {
  const mgr = new RelationshipDialogManager(new NPCRelationshipManager());

  countedTest('soulbound companion → true', () => {
    const state = makeState([makeCompanion('fenris', 100, { soulbound: true })]);
    const cond = { type: 'companionSoulbound', companionId: 'fenris' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), true);
  });

  countedTest('non-soulbound companion → false', () => {
    const state = makeState([makeCompanion('fenris', 75, { soulbound: false })]);
    const cond = { type: 'companionSoulbound', companionId: 'fenris' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('companion absent → false', () => {
    const state = makeState([]);
    const cond = { type: 'companionSoulbound', companionId: 'fenris' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });

  countedTest('missing companionId → false', () => {
    const state = makeState([makeCompanion('fenris', 100, { soulbound: true })]);
    const cond = { type: 'companionSoulbound' };
    assert.strictEqual(mgr.evaluateCondition(cond, state), false);
  });
});

// ── createCompanionLoyaltyBranchingDialog ────────────────────────────

describe('createCompanionLoyaltyBranchingDialog', () => {
  countedTest('creates conditional chain in descending tier order (highest first)', () => {
    const node = createCompanionLoyaltyBranchingDialog('fenris', {
      Soulbound: 'dialog-soulbound',
      Friendly: 'dialog-friendly',
      Abandoned: 'dialog-abandoned',
    });

    assert.ok(node.conditions);
    assert.strictEqual(node.conditions.length, 3);
    // Soulbound first (highest), then Friendly, then Abandoned (lowest)
    assert.strictEqual(node.conditions[0].check.tier, 'Soulbound');
    assert.strictEqual(node.conditions[1].check.tier, 'Friendly');
    assert.strictEqual(node.conditions[2].check.tier, 'Abandoned');
  });

  countedTest('all conditions use >= operator', () => {
    const node = createCompanionLoyaltyBranchingDialog('fenris', {
      Devoted: 'dialog-devoted',
      Neutral: 'dialog-neutral',
    });

    for (const cond of node.conditions) {
      assert.strictEqual(cond.check.operator, '>=');
    }
  });

  countedTest('all conditions target the correct companionId', () => {
    const node = createCompanionLoyaltyBranchingDialog('lyra', {
      Soulbound: 'dialog-soul',
      Neutral: 'dialog-neutral',
    });

    for (const cond of node.conditions) {
      assert.strictEqual(cond.check.companionId, 'lyra');
    }
  });

  countedTest('uses "default" key for else branch', () => {
    const node = createCompanionLoyaltyBranchingDialog('fenris', {
      Devoted: 'dialog-devoted',
      default: 'dialog-fallback',
    });

    assert.strictEqual(node.else, 'dialog-fallback');
  });

  countedTest('falls back to Neutral variant for else branch if no default', () => {
    const node = createCompanionLoyaltyBranchingDialog('fenris', {
      Devoted: 'dialog-devoted',
      Neutral: 'dialog-neutral',
    });

    assert.strictEqual(node.else, 'dialog-neutral');
  });

  countedTest('null else when no default and no Neutral variant', () => {
    const node = createCompanionLoyaltyBranchingDialog('fenris', {
      Soulbound: 'dialog-soul',
    });

    assert.strictEqual(node.else, null);
  });

  countedTest('empty variants → empty conditions', () => {
    const node = createCompanionLoyaltyBranchingDialog('fenris', {});
    assert.strictEqual(node.conditions.length, 0);
  });
});

// ── getCompanionLoyaltyDialogVariant ─────────────────────────────────

describe('getCompanionLoyaltyDialogVariant', () => {
  countedTest('generates baseId_tiername for companion in party', () => {
    const state = makeState([makeCompanion('fenris', 75)]);
    const result = getCompanionLoyaltyDialogVariant('fenris', 'greeting', state);
    assert.strictEqual(result, 'greeting_devoted');
  });

  countedTest('tier name is lowercase in variant', () => {
    const state = makeState([makeCompanion('fenris', 100)]);
    const result = getCompanionLoyaltyDialogVariant('fenris', 'quest_start', state);
    assert.strictEqual(result, 'quest_start_soulbound');
  });

  countedTest('loyalty 0 → abandoned variant', () => {
    const state = makeState([makeCompanion('fenris', 0)]);
    const result = getCompanionLoyaltyDialogVariant('fenris', 'farewell', state);
    assert.strictEqual(result, 'farewell_abandoned');
  });

  countedTest('loyalty 50 → friendly variant', () => {
    const state = makeState([makeCompanion('lyra', 50)]);
    const result = getCompanionLoyaltyDialogVariant('lyra', 'campfire', state);
    assert.strictEqual(result, 'campfire_friendly');
  });

  countedTest('companion not in party → returns baseDialogId unchanged', () => {
    const state = makeState([]);
    const result = getCompanionLoyaltyDialogVariant('fenris', 'greeting', state);
    assert.strictEqual(result, 'greeting');
  });

  countedTest('missing companionId → returns baseDialogId unchanged', () => {
    const state = makeState([makeCompanion('fenris', 75)]);
    const result = getCompanionLoyaltyDialogVariant(null, 'greeting', state);
    assert.strictEqual(result, 'greeting');
  });

  countedTest('missing baseDialogId → returns falsy', () => {
    const state = makeState([makeCompanion('fenris', 75)]);
    const result = getCompanionLoyaltyDialogVariant('fenris', null, state);
    assert.strictEqual(result, null);
  });

  countedTest('missing gameState → returns baseDialogId unchanged', () => {
    const result = getCompanionLoyaltyDialogVariant('fenris', 'greeting', null);
    assert.strictEqual(result, 'greeting');
  });
});

// ── Integration: all loyalty tiers produce correct dialog branches ───

describe('Integration: all tiers evaluated correctly by RelationshipDialogManager', () => {
  const mgr = new RelationshipDialogManager(new NPCRelationshipManager());

  const tierLoyaltyValues = [
    { tier: 'Abandoned', loyalty: 0 },
    { tier: 'Discontent', loyalty: 10 },
    { tier: 'Neutral', loyalty: 25 },
    { tier: 'Friendly', loyalty: 50 },
    { tier: 'Devoted', loyalty: 75 },
    { tier: 'Soulbound', loyalty: 100 },
  ];

  for (const { tier, loyalty } of tierLoyaltyValues) {
    countedTest(`loyalty ${loyalty} evaluates as == ${tier}`, () => {
      const state = makeState([makeCompanion('fenris', loyalty)]);
      const cond = { type: 'companionLoyalty', companionId: 'fenris', tier, operator: '==' };
      assert.strictEqual(mgr.evaluateCondition(cond, state), true);
    });
  }

  countedTest('Soulbound companion at loyalty 100 is >= all tiers', () => {
    const state = makeState([makeCompanion('fenris', 100)]);
    for (const tier of LOYALTY_TIER_ORDER) {
      const cond = { type: 'companionLoyalty', companionId: 'fenris', tier, operator: '>=' };
      assert.strictEqual(mgr.evaluateCondition(cond, state), true,
        `loyalty 100 should be >= ${tier}`);
    }
  });

  countedTest('Abandoned companion at loyalty 0 is <= all tiers', () => {
    const state = makeState([makeCompanion('fenris', 0)]);
    for (const tier of LOYALTY_TIER_ORDER) {
      const cond = { type: 'companionLoyalty', companionId: 'fenris', tier, operator: '<=' };
      assert.strictEqual(mgr.evaluateCondition(cond, state), true,
        `loyalty 0 should be <= ${tier}`);
    }
  });
});

// ── Forbidden motif defense ─────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

describe('Forbidden motif defense', () => {

  const filesToCheck = [
    'src/companion-loyalty-events.js',
    'src/relationship-dialog.js',
    // Note: test file itself excluded — regex pattern contains forbidden words
  ];

  const forbidden = /\b(easter|egg|rabbit|bunny|cockatrice|basilisk)\b/i;

  for (const file of filesToCheck) {
    countedTest(`${file} contains no forbidden motifs`, () => {
      const content = fs.readFileSync(path.resolve(file), 'utf-8');
      const match = content.match(forbidden);
      assert.strictEqual(match, null, `Found forbidden motif "${match?.[0]}" in ${file}`);
    });
  }
});
