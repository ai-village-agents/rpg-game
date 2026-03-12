/**
 * Summoning System Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SUMMON_TIER,
  SUMMON_BEHAVIOR,
  SUMMON_DATA,
  DEFAULT_CONFIG,
  createSummon,
  canSummon,
  performSummon,
  processSummonTurn,
  processAllSummonTurns,
  getSummonAction,
  damageSummon,
  healSummon,
  dismissSummon,
  getSummonData,
  getSummonsByTier,
  getSummonsByElement,
  getAllSummons,
  getSummonPowerLevel,
  getSummonSummary,
  getTierDisplayName,
} from '../src/summoning-system.js';

import {
  getSummoningStyles,
  renderSummonMenu,
  renderActiveSummon,
  renderActiveSummons,
  renderSummonAction,
  renderSummonCatalog,
  renderSummonExpiredNotice,
  renderSummonedNotice,
} from '../src/summoning-system-ui.js';

// ============================================================================
// Constants Tests
// ============================================================================

describe('SUMMON_TIER', () => {
  it('should define all tiers', () => {
    assert.strictEqual(SUMMON_TIER.MINOR, 'minor');
    assert.strictEqual(SUMMON_TIER.STANDARD, 'standard');
    assert.strictEqual(SUMMON_TIER.GREATER, 'greater');
    assert.strictEqual(SUMMON_TIER.LEGENDARY, 'legendary');
  });
});

describe('SUMMON_BEHAVIOR', () => {
  it('should define all behaviors', () => {
    assert.strictEqual(SUMMON_BEHAVIOR.AGGRESSIVE, 'aggressive');
    assert.strictEqual(SUMMON_BEHAVIOR.DEFENSIVE, 'defensive');
    assert.strictEqual(SUMMON_BEHAVIOR.SUPPORT, 'support');
    assert.strictEqual(SUMMON_BEHAVIOR.BALANCED, 'balanced');
  });
});

describe('SUMMON_DATA', () => {
  it('should have required properties for each summon', () => {
    for (const [id, data] of Object.entries(SUMMON_DATA)) {
      assert.ok(data.id === id, `${id} id mismatch`);
      assert.ok(data.name, `${id} missing name`);
      assert.ok(data.tier, `${id} missing tier`);
      assert.ok(data.element, `${id} missing element`);
      assert.ok(data.icon, `${id} missing icon`);
      assert.ok(data.behavior, `${id} missing behavior`);
      assert.ok(data.stats, `${id} missing stats`);
      assert.ok(data.mpCost > 0, `${id} missing mpCost`);
      assert.ok(data.duration > 0, `${id} missing duration`);
    }
  });

  it('should have valid stats for each summon', () => {
    for (const [id, data] of Object.entries(SUMMON_DATA)) {
      assert.ok(data.stats.hp > 0, `${id} invalid hp`);
      assert.ok(data.stats.attack > 0, `${id} invalid attack`);
      assert.ok(data.stats.defense >= 0, `${id} invalid defense`);
      assert.ok(data.stats.speed > 0, `${id} invalid speed`);
    }
  });

  it('should have at least one ability for each summon', () => {
    for (const [id, data] of Object.entries(SUMMON_DATA)) {
      assert.ok(data.abilities.length > 0, `${id} missing abilities`);
    }
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should define configuration values', () => {
    assert.strictEqual(DEFAULT_CONFIG.maxActiveSummons, 2);
    assert.strictEqual(DEFAULT_CONFIG.summonSlots, 3);
    assert.strictEqual(DEFAULT_CONFIG.loyaltyDecayPerTurn, 5);
    assert.strictEqual(DEFAULT_CONFIG.baseLoyalty, 100);
  });
});

// ============================================================================
// createSummon Tests
// ============================================================================

describe('createSummon', () => {
  it('should create a summon with base stats', () => {
    const summon = createSummon('fire-sprite');
    assert.ok(summon);
    assert.strictEqual(summon.id, 'fire-sprite');
    assert.strictEqual(summon.name, 'Fire Sprite');
    assert.strictEqual(summon.element, 'fire');
    assert.strictEqual(summon.tier, SUMMON_TIER.MINOR);
    assert.strictEqual(summon.currentHp, summon.stats.hp);
    assert.strictEqual(summon.isActive, true);
    assert.ok(summon.instanceId.includes('fire-sprite'));
  });

  it('should scale stats with level', () => {
    const level1 = createSummon('fire-sprite', { level: 1 });
    const level5 = createSummon('fire-sprite', { level: 5 });

    assert.ok(level5.stats.hp > level1.stats.hp);
    assert.ok(level5.stats.attack > level1.stats.attack);
  });

  it('should accept bonus stats', () => {
    const summon = createSummon('fire-sprite', { bonusStats: { hp: 10, attack: 5 } });
    const base = SUMMON_DATA['fire-sprite'].stats;

    assert.strictEqual(summon.stats.hp, base.hp + 10);
    assert.strictEqual(summon.stats.attack, base.attack + 5);
  });

  it('should return null for invalid summon ID', () => {
    const summon = createSummon('invalid-summon');
    assert.strictEqual(summon, null);
  });

  it('should set duration from data', () => {
    const summon = createSummon('fire-sprite');
    assert.strictEqual(summon.turnsRemaining, SUMMON_DATA['fire-sprite'].duration);
  });

  it('should set initial loyalty', () => {
    const summon = createSummon('ice-wisp');
    assert.strictEqual(summon.loyalty, DEFAULT_CONFIG.baseLoyalty);
  });
});

// ============================================================================
// canSummon Tests
// ============================================================================

describe('canSummon', () => {
  it('should allow summon with enough MP', () => {
    const state = { player: { mp: 100 }, activeSummons: [] };
    const result = canSummon(state, 'fire-sprite');

    assert.strictEqual(result.canSummon, true);
    assert.strictEqual(result.reason, null);
  });

  it('should reject summon without enough MP', () => {
    const state = { player: { mp: 5 }, activeSummons: [] };
    const result = canSummon(state, 'fire-sprite');

    assert.strictEqual(result.canSummon, false);
    assert.ok(result.reason.includes('MP'));
  });

  it('should reject when max summons reached', () => {
    const summon1 = createSummon('fire-sprite');
    const summon2 = createSummon('ice-wisp');
    const state = { player: { mp: 100 }, activeSummons: [summon1, summon2] };
    const result = canSummon(state, 'nature-spirit');

    assert.strictEqual(result.canSummon, false);
    assert.ok(result.reason.includes('Maximum'));
  });

  it('should reject duplicate summon', () => {
    const summon = createSummon('fire-sprite');
    const state = { player: { mp: 100 }, activeSummons: [summon] };
    const result = canSummon(state, 'fire-sprite');

    assert.strictEqual(result.canSummon, false);
    assert.ok(result.reason.includes('already active'));
  });

  it('should reject invalid summon ID', () => {
    const state = { player: { mp: 100 }, activeSummons: [] };
    const result = canSummon(state, 'invalid');

    assert.strictEqual(result.canSummon, false);
    assert.ok(result.reason.includes('Invalid'));
  });
});

// ============================================================================
// performSummon Tests
// ============================================================================

describe('performSummon', () => {
  it('should create summon and deduct MP', () => {
    const state = { player: { mp: 100 }, activeSummons: [] };
    const result = performSummon(state, 'fire-sprite');

    assert.strictEqual(result.success, true);
    assert.ok(result.summon);
    assert.strictEqual(result.state.player.mp, 100 - SUMMON_DATA['fire-sprite'].mpCost);
    assert.strictEqual(result.state.activeSummons.length, 1);
  });

  it('should fail when cannot summon', () => {
    const state = { player: { mp: 5 }, activeSummons: [] };
    const result = performSummon(state, 'fire-sprite');

    assert.strictEqual(result.success, false);
    assert.ok(result.reason);
  });

  it('should pass options to createSummon', () => {
    const state = { player: { mp: 100 }, activeSummons: [] };
    const result = performSummon(state, 'fire-sprite', { level: 3 });

    assert.ok(result.summon.level === 3);
  });
});

// ============================================================================
// processSummonTurn Tests
// ============================================================================

describe('processSummonTurn', () => {
  it('should decrement turns and loyalty', () => {
    const summon = createSummon('fire-sprite');
    const updated = processSummonTurn(summon);

    assert.strictEqual(updated.turnsRemaining, summon.turnsRemaining - 1);
    assert.strictEqual(updated.loyalty, summon.loyalty - DEFAULT_CONFIG.loyaltyDecayPerTurn);
    assert.strictEqual(updated.hasActedThisTurn, false);
  });

  it('should deactivate when turns expire', () => {
    const summon = createSummon('fire-sprite');
    summon.turnsRemaining = 1;
    const updated = processSummonTurn(summon);

    assert.strictEqual(updated.isActive, false);
  });

  it('should deactivate when loyalty depletes', () => {
    const summon = createSummon('fire-sprite');
    summon.loyalty = 3;
    const updated = processSummonTurn(summon);

    assert.strictEqual(updated.isActive, false);
  });

  it('should return inactive summon unchanged', () => {
    const summon = createSummon('fire-sprite');
    summon.isActive = false;
    const updated = processSummonTurn(summon);

    assert.strictEqual(updated, summon);
  });
});

// ============================================================================
// processAllSummonTurns Tests
// ============================================================================

describe('processAllSummonTurns', () => {
  it('should process all summons', () => {
    const summon1 = createSummon('fire-sprite');
    const summon2 = createSummon('ice-wisp');
    const result = processAllSummonTurns([summon1, summon2]);

    assert.strictEqual(result.summons.length, 2);
    assert.strictEqual(result.expired.length, 0);
  });

  it('should separate expired summons', () => {
    const summon1 = createSummon('fire-sprite');
    const summon2 = createSummon('ice-wisp');
    summon2.turnsRemaining = 1;
    const result = processAllSummonTurns([summon1, summon2]);

    assert.strictEqual(result.summons.length, 1);
    assert.strictEqual(result.expired.length, 1);
    assert.strictEqual(result.expired[0].id, 'ice-wisp');
  });

  it('should handle empty array', () => {
    const result = processAllSummonTurns([]);
    assert.strictEqual(result.summons.length, 0);
    assert.strictEqual(result.expired.length, 0);
  });

  it('should handle invalid input', () => {
    const result = processAllSummonTurns(null);
    assert.strictEqual(result.summons.length, 0);
  });
});

// ============================================================================
// getSummonAction Tests
// ============================================================================

describe('getSummonAction', () => {
  it('should return attack for aggressive summon', () => {
    const summon = createSummon('fire-sprite'); // Aggressive
    const action = getSummonAction(summon, { enemies: [{ hp: 50 }] });

    assert.strictEqual(action.action, 'attack');
    assert.ok(action.target);
  });

  it('should return defend for defensive summon when player low HP', () => {
    const summon = createSummon('ice-wisp'); // Defensive
    const action = getSummonAction(summon, {
      enemies: [{ hp: 50 }],
      playerHp: 20,
      playerMaxHp: 100,
    });

    assert.strictEqual(action.action, 'defend');
  });

  it('should return heal for support summon when ally low HP', () => {
    const summon = createSummon('nature-spirit'); // Support
    const action = getSummonAction(summon, {
      allies: [{ hp: 30, maxHp: 100 }],
      playerHp: 100,
      playerMaxHp: 100,
    });

    assert.strictEqual(action.action, 'heal');
  });

  it('should return wait if summon already acted', () => {
    const summon = createSummon('fire-sprite');
    summon.hasActedThisTurn = true;
    const action = getSummonAction(summon, { enemies: [{ hp: 50 }] });

    assert.strictEqual(action.action, 'wait');
  });

  it('should handle null summon', () => {
    const action = getSummonAction(null, {});
    assert.strictEqual(action.action, 'wait');
  });
});

// ============================================================================
// damageSummon Tests
// ============================================================================

describe('damageSummon', () => {
  it('should reduce HP', () => {
    const summon = createSummon('fire-sprite');
    const updated = damageSummon(summon, 10);

    assert.strictEqual(updated.currentHp, summon.currentHp - 10);
    assert.strictEqual(updated.isActive, true);
  });

  it('should not go below 0 HP', () => {
    const summon = createSummon('fire-sprite');
    const updated = damageSummon(summon, 1000);

    assert.strictEqual(updated.currentHp, 0);
  });

  it('should deactivate when HP reaches 0', () => {
    const summon = createSummon('fire-sprite');
    const updated = damageSummon(summon, summon.currentHp);

    assert.strictEqual(updated.isActive, false);
  });

  it('should handle null summon', () => {
    assert.strictEqual(damageSummon(null, 10), null);
  });
});

// ============================================================================
// healSummon Tests
// ============================================================================

describe('healSummon', () => {
  it('should increase HP', () => {
    const summon = createSummon('fire-sprite');
    summon.currentHp = 10;
    const updated = healSummon(summon, 15);

    assert.strictEqual(updated.currentHp, 25);
  });

  it('should not exceed max HP', () => {
    const summon = createSummon('fire-sprite');
    const updated = healSummon(summon, 1000);

    assert.strictEqual(updated.currentHp, summon.stats.hp);
  });

  it('should not heal inactive summon', () => {
    const summon = createSummon('fire-sprite');
    summon.isActive = false;
    summon.currentHp = 0;
    const updated = healSummon(summon, 100);

    assert.strictEqual(updated.currentHp, 0);
  });
});

// ============================================================================
// dismissSummon Tests
// ============================================================================

describe('dismissSummon', () => {
  it('should remove summon by instance ID', () => {
    const summon1 = createSummon('fire-sprite');
    const summon2 = createSummon('ice-wisp');
    const result = dismissSummon([summon1, summon2], summon1.instanceId);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'ice-wisp');
  });

  it('should handle invalid instance ID', () => {
    const summon = createSummon('fire-sprite');
    const result = dismissSummon([summon], 'invalid');

    assert.strictEqual(result.length, 1);
  });

  it('should handle invalid input', () => {
    assert.deepStrictEqual(dismissSummon(null, 'id'), []);
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('getSummonData', () => {
  it('should return data for valid ID', () => {
    const data = getSummonData('fire-sprite');
    assert.ok(data);
    assert.strictEqual(data.name, 'Fire Sprite');
  });

  it('should return null for invalid ID', () => {
    assert.strictEqual(getSummonData('invalid'), null);
  });
});

describe('getSummonsByTier', () => {
  it('should return summons of specified tier', () => {
    const minor = getSummonsByTier(SUMMON_TIER.MINOR);
    assert.ok(minor.includes('fire-sprite'));
    assert.ok(minor.includes('ice-wisp'));
    assert.ok(minor.includes('nature-spirit'));
  });

  it('should return legendary summons', () => {
    const legendary = getSummonsByTier(SUMMON_TIER.LEGENDARY);
    assert.ok(legendary.includes('ancient-dragon'));
    assert.ok(legendary.includes('void-titan'));
  });
});

describe('getSummonsByElement', () => {
  it('should return fire summons', () => {
    const fire = getSummonsByElement('fire');
    assert.ok(fire.includes('fire-sprite'));
    assert.ok(fire.includes('infernal-knight'));
  });

  it('should handle case insensitivity', () => {
    const fire = getSummonsByElement('FIRE');
    assert.ok(fire.includes('fire-sprite'));
  });

  it('should return empty for null', () => {
    assert.strictEqual(getSummonsByElement(null).length, 0);
  });
});

describe('getAllSummons', () => {
  it('should return all summon IDs', () => {
    const all = getAllSummons();
    assert.ok(all.length > 0);
    assert.ok(all.includes('fire-sprite'));
    assert.ok(all.includes('void-titan'));
  });
});

describe('getSummonPowerLevel', () => {
  it('should calculate power level', () => {
    const summon = createSummon('fire-sprite');
    const power = getSummonPowerLevel(summon);
    assert.ok(power > 0);
  });

  it('should return 0 for null', () => {
    assert.strictEqual(getSummonPowerLevel(null), 0);
  });

  it('should scale with stats', () => {
    const minor = getSummonPowerLevel(createSummon('fire-sprite'));
    const legendary = getSummonPowerLevel(createSummon('ancient-dragon'));
    assert.ok(legendary > minor);
  });
});

describe('getSummonSummary', () => {
  it('should return summary for summon', () => {
    const summon = createSummon('fire-sprite');
    const summary = getSummonSummary(summon);

    assert.strictEqual(summary.name, 'Fire Sprite');
    assert.ok(summary.icon);
    assert.strictEqual(summary.hp, summon.currentHp);
    assert.strictEqual(summary.maxHp, summon.stats.hp);
    assert.strictEqual(summary.isActive, true);
  });

  it('should return default for null', () => {
    const summary = getSummonSummary(null);
    assert.strictEqual(summary.name, 'None');
    assert.strictEqual(summary.hp, 0);
  });
});

describe('getTierDisplayName', () => {
  it('should return display names', () => {
    assert.strictEqual(getTierDisplayName(SUMMON_TIER.MINOR), 'Minor');
    assert.strictEqual(getTierDisplayName(SUMMON_TIER.STANDARD), 'Standard');
    assert.strictEqual(getTierDisplayName(SUMMON_TIER.GREATER), 'Greater');
    assert.strictEqual(getTierDisplayName(SUMMON_TIER.LEGENDARY), 'Legendary');
  });

  it('should return Unknown for invalid tier', () => {
    assert.strictEqual(getTierDisplayName('invalid'), 'Unknown');
  });
});

// ============================================================================
// UI Tests
// ============================================================================

describe('getSummoningStyles', () => {
  it('should return CSS string', () => {
    const css = getSummoningStyles();
    assert.ok(typeof css === 'string');
    assert.ok(css.includes('.summon-container'));
    assert.ok(css.includes('.summon-icon'));
    assert.ok(css.includes('.active-summon-card'));
  });

  it('should include tier classes', () => {
    const css = getSummoningStyles();
    assert.ok(css.includes('.tier-minor'));
    assert.ok(css.includes('.tier-legendary'));
  });

  it('should include animations', () => {
    const css = getSummoningStyles();
    assert.ok(css.includes('@keyframes summon-appear'));
  });
});

describe('renderSummonMenu', () => {
  it('should render summon options', () => {
    const state = { player: { mp: 100 }, activeSummons: [] };
    const html = renderSummonMenu(['fire-sprite', 'ice-wisp'], state);

    assert.ok(html.includes('Fire Sprite'));
    assert.ok(html.includes('Ice Wisp'));
    assert.ok(html.includes('summon-option'));
  });

  it('should mark disabled summons', () => {
    const state = { player: { mp: 5 }, activeSummons: [] };
    const html = renderSummonMenu(['fire-sprite'], state);

    assert.ok(html.includes('disabled'));
    assert.ok(html.includes('Not enough MP'));
  });

  it('should handle empty list', () => {
    const html = renderSummonMenu([], {});
    assert.ok(html.includes('No summons available'));
  });
});

describe('renderActiveSummon', () => {
  it('should render summon card', () => {
    const summon = createSummon('fire-sprite');
    const html = renderActiveSummon(summon);

    assert.ok(html.includes('Fire Sprite'));
    assert.ok(html.includes('active-summon-card'));
    assert.ok(html.includes('summon-hp-bar'));
    assert.ok(html.includes('dismiss-btn'));
  });

  it('should mark acted summon', () => {
    const summon = createSummon('fire-sprite');
    summon.hasActedThisTurn = true;
    const html = renderActiveSummon(summon);

    assert.ok(html.includes('acted'));
  });

  it('should return empty for null', () => {
    assert.strictEqual(renderActiveSummon(null), '');
  });
});

describe('renderActiveSummons', () => {
  it('should render all summons', () => {
    const summons = [createSummon('fire-sprite'), createSummon('ice-wisp')];
    const html = renderActiveSummons(summons);

    assert.ok(html.includes('Fire Sprite'));
    assert.ok(html.includes('Ice Wisp'));
    assert.ok(html.includes('active-summons'));
  });

  it('should show message when empty', () => {
    const html = renderActiveSummons([]);
    assert.ok(html.includes('No active summons'));
  });
});

describe('renderSummonAction', () => {
  it('should render action text', () => {
    const summon = createSummon('fire-sprite');
    const html = renderSummonAction({ action: 'attack' }, summon);

    assert.ok(html.includes('attacks'));
    assert.ok(html.includes('Fire Sprite'));
  });

  it('should return empty for null', () => {
    assert.strictEqual(renderSummonAction(null, null), '');
  });
});

describe('renderSummonCatalog', () => {
  it('should render all summons', () => {
    const html = renderSummonCatalog();

    assert.ok(html.includes('Fire Sprite'));
    assert.ok(html.includes('Ice Wisp'));
    assert.ok(html.includes('Ancient Dragon'));
    assert.ok(html.includes('summon-catalog'));
  });
});

describe('renderSummonExpiredNotice', () => {
  it('should render expired notice', () => {
    const summon = createSummon('fire-sprite');
    const html = renderSummonExpiredNotice(summon, 'duration');

    assert.ok(html.includes('Fire Sprite'));
    assert.ok(html.includes('duration expired'));
  });

  it('should handle different reasons', () => {
    const summon = createSummon('ice-wisp');
    const html = renderSummonExpiredNotice(summon, 'defeated');

    assert.ok(html.includes('was defeated'));
  });
});

describe('renderSummonedNotice', () => {
  it('should render summoned notice', () => {
    const summon = createSummon('fire-sprite');
    const html = renderSummonedNotice(summon);

    assert.ok(html.includes('has been summoned'));
    assert.ok(html.includes('Fire Sprite'));
    assert.ok(html.includes('summon-appear'));
  });
});

// ============================================================================
// Security Tests
// ============================================================================

describe('Security: No Banned Words', () => {
  const bannedWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  it('should not contain banned words in summon names', () => {
    for (const data of Object.values(SUMMON_DATA)) {
      const nameLower = data.name.toLowerCase();
      for (const word of bannedWords) {
        assert.ok(
          !nameLower.includes(word),
          `Summon name "${data.name}" contains banned word "${word}"`
        );
      }
    }
  });

  it('should not contain banned words in descriptions', () => {
    for (const data of Object.values(SUMMON_DATA)) {
      const descLower = data.description.toLowerCase();
      for (const word of bannedWords) {
        assert.ok(
          !descLower.includes(word),
          `Description contains banned word "${word}": ${data.description}`
        );
      }
    }
  });

  it('should not contain banned words in ability names', () => {
    for (const data of Object.values(SUMMON_DATA)) {
      for (const ability of data.abilities) {
        const abilityLower = ability.toLowerCase();
        for (const word of bannedWords) {
          assert.ok(
            !abilityLower.includes(word),
            `Ability "${ability}" contains banned word "${word}"`
          );
        }
      }
    }
  });
});
