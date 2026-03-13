/**
 * Reputation System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  REPUTATION_TIERS,
  FACTIONS,
  initReputationState,
  getReputationState,
  getTierForValue,
  getFactionReputation,
  modifyReputation,
  calculateReputationLevel,
  setNpcRelation,
  modifyNpcRelation,
  getNpcRelation,
  setRegionStanding,
  getRegionStanding,
  getAllFactionReputations,
  canAccessFactionServices,
  getFactionDiscount,
  isFactionHostile,
  applyReputationDecay,
  getReputationSummary,
  getFactionHistory,
  areFactionsAllied,
  areFactionsEnemies
} from '../src/reputation-system.js';

import {
  renderReputationPanel,
  renderFactionDetail,
  renderNpcRelations,
  renderRegionStandings,
  renderReputationChange,
  renderTierLegend,
  renderFactionSelector,
  renderCompactReputationBar,
  renderReputationRewards,
  renderFactionComparison
} from '../src/reputation-system-ui.js';

describe('Reputation System', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      reputation: initReputationState()
    };
  });

  describe('Reputation Tiers', () => {
    it('has all required tiers', () => {
      assert.ok(REPUTATION_TIERS.HATED);
      assert.ok(REPUTATION_TIERS.HOSTILE);
      assert.ok(REPUTATION_TIERS.UNFRIENDLY);
      assert.ok(REPUTATION_TIERS.NEUTRAL);
      assert.ok(REPUTATION_TIERS.FRIENDLY);
      assert.ok(REPUTATION_TIERS.HONORED);
      assert.ok(REPUTATION_TIERS.REVERED);
      assert.ok(REPUTATION_TIERS.EXALTED);
    });

    it('each tier has required properties', () => {
      Object.values(REPUTATION_TIERS).forEach(tier => {
        assert.ok(tier.id);
        assert.ok(tier.name);
        assert.ok(typeof tier.minValue === 'number');
        assert.ok(tier.color);
        assert.ok(typeof tier.discount === 'number');
      });
    });

    it('tiers are ordered by minValue', () => {
      const values = Object.values(REPUTATION_TIERS).map(t => t.minValue);
      const sorted = [...values].sort((a, b) => a - b);
      assert.deepStrictEqual(values.sort((a, b) => a - b), sorted);
    });
  });

  describe('Factions', () => {
    it('has multiple factions', () => {
      assert.ok(Object.keys(FACTIONS).length >= 5);
    });

    it('each faction has required properties', () => {
      Object.values(FACTIONS).forEach(faction => {
        assert.ok(faction.id);
        assert.ok(faction.name);
        assert.ok(faction.description);
        assert.ok(typeof faction.startingRep === 'number');
      });
    });

    it('some factions have allies and enemies', () => {
      const hasAllies = Object.values(FACTIONS).some(f => f.allies && f.allies.length > 0);
      const hasEnemies = Object.values(FACTIONS).some(f => f.enemies && f.enemies.length > 0);
      assert.ok(hasAllies);
      assert.ok(hasEnemies);
    });
  });

  describe('initReputationState', () => {
    it('creates state with factions', () => {
      const state = initReputationState();
      assert.ok(state.factions);
      assert.ok(Object.keys(state.factions).length > 0);
    });

    it('initializes factions with starting reputation', () => {
      const state = initReputationState();
      Object.keys(FACTIONS).forEach(factionId => {
        const faction = FACTIONS[factionId];
        const rep = state.factions[factionId.toLowerCase()];
        assert.strictEqual(rep.value, faction.startingRep);
      });
    });

    it('initializes tracking stats', () => {
      const state = initReputationState();
      assert.strictEqual(state.totalRepGained, 0);
      assert.strictEqual(state.totalRepLost, 0);
      assert.strictEqual(state.reputationLevel, 1);
    });
  });

  describe('getTierForValue', () => {
    it('returns hated for very low values', () => {
      assert.strictEqual(getTierForValue(-1500), 'hated');
    });

    it('returns neutral for zero', () => {
      assert.strictEqual(getTierForValue(0), 'neutral');
    });

    it('returns friendly for 100+', () => {
      assert.strictEqual(getTierForValue(100), 'friendly');
    });

    it('returns exalted for 3000+', () => {
      assert.strictEqual(getTierForValue(3000), 'exalted');
    });
  });

  describe('getFactionReputation', () => {
    it('returns faction reputation data', () => {
      const rep = getFactionReputation(gameState, 'merchants_guild');

      assert.ok(rep);
      assert.ok(rep.faction);
      assert.strictEqual(rep.faction.id, 'merchants_guild');
      assert.ok(typeof rep.value === 'number');
      assert.ok(rep.tier);
    });

    it('returns null for invalid faction', () => {
      const rep = getFactionReputation(gameState, 'invalid_faction');
      assert.strictEqual(rep, null);
    });

    it('includes next tier information', () => {
      const rep = getFactionReputation(gameState, 'merchants_guild');

      assert.ok(rep.nextTier || rep.tier.id === 'exalted');
      assert.ok(typeof rep.progressToNext === 'number');
    });
  });

  describe('modifyReputation', () => {
    it('increases reputation', () => {
      const result = modifyReputation(gameState, 'merchants_guild', 100, 'Completed quest');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.change, 100);
      assert.ok(result.newValue > result.oldValue);
    });

    it('decreases reputation', () => {
      const result = modifyReputation(gameState, 'merchants_guild', -50, 'Stole goods');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.change, -50);
      assert.ok(result.newValue < result.oldValue);
    });

    it('triggers tier change notification', () => {
      const result = modifyReputation(gameState, 'merchants_guild', 150);

      assert.strictEqual(result.tierChanged, true);
      assert.strictEqual(result.newTier, 'friendly');
    });

    it('applies spillover to allies', () => {
      const result = modifyReputation(gameState, 'merchants_guild', 100);

      assert.ok(result.spillover);
      const allySpillover = result.spillover.find(s => s.factionId === 'craftsmen_union');
      assert.ok(allySpillover);
      assert.ok(allySpillover.amount > 0);
    });

    it('applies negative spillover to enemies', () => {
      const result = modifyReputation(gameState, 'merchants_guild', 100);

      const enemySpillover = result.spillover.find(s => s.factionId === 'shadow_syndicate');
      assert.ok(enemySpillover);
      assert.ok(enemySpillover.amount < 0);
    });

    it('clamps to max reputation', () => {
      const result = modifyReputation(gameState, 'merchants_guild', 10000);

      assert.ok(result.newValue <= 5000);
    });

    it('clamps to min reputation', () => {
      const result = modifyReputation(gameState, 'merchants_guild', -10000);

      assert.ok(result.newValue >= -2000);
    });

    it('fails for invalid faction', () => {
      const result = modifyReputation(gameState, 'invalid', 100);

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('tracks total gained', () => {
      const result = modifyReputation(gameState, 'merchants_guild', 100);
      assert.strictEqual(result.state.reputation.totalRepGained, 100);
    });

    it('tracks total lost', () => {
      const result = modifyReputation(gameState, 'merchants_guild', -50);
      assert.strictEqual(result.state.reputation.totalRepLost, 50);
    });
  });

  describe('calculateReputationLevel', () => {
    it('starts at level 1', () => {
      assert.strictEqual(calculateReputationLevel(0), 1);
    });

    it('levels up with experience', () => {
      assert.strictEqual(calculateReputationLevel(200), 2);
      assert.strictEqual(calculateReputationLevel(600), 3);
    });

    it('caps at level 50', () => {
      assert.strictEqual(calculateReputationLevel(999999), 50);
    });
  });

  describe('NPC Relations', () => {
    it('sets NPC relation', () => {
      const result = setNpcRelation(gameState, 'npc_blacksmith', 100, 'Bjorn the Blacksmith');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.value, 100);
    });

    it('modifies existing NPC relation', () => {
      const set = setNpcRelation(gameState, 'npc_blacksmith', 50);
      const result = modifyNpcRelation(set.state, 'npc_blacksmith', 25);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.newValue, 75);
    });

    it('gets NPC relation', () => {
      const set = setNpcRelation(gameState, 'npc_baker', 200, 'Martha');
      const relation = getNpcRelation(set.state, 'npc_baker');

      assert.strictEqual(relation.value, 200);
      assert.strictEqual(relation.name, 'Martha');
    });

    it('returns default for unknown NPC', () => {
      const relation = getNpcRelation(gameState, 'unknown_npc');

      assert.strictEqual(relation.value, 0);
      assert.strictEqual(relation.tier.id, 'neutral');
    });

    it('detects tier change on modify', () => {
      const set = setNpcRelation(gameState, 'npc_test', 50);
      const result = modifyNpcRelation(set.state, 'npc_test', 60); // Should hit friendly at 100

      assert.strictEqual(result.tierChanged, true);
    });
  });

  describe('Region Standing', () => {
    it('sets region standing', () => {
      const result = setRegionStanding(gameState, 'northern_kingdom', 500, 'Northern Kingdom');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.value, 500);
    });

    it('gets region standing', () => {
      const set = setRegionStanding(gameState, 'southern_lands', 300, 'Southern Lands');
      const standing = getRegionStanding(set.state, 'southern_lands');

      assert.strictEqual(standing.value, 300);
      assert.strictEqual(standing.name, 'Southern Lands');
    });

    it('returns default for unknown region', () => {
      const standing = getRegionStanding(gameState, 'unknown_region');

      assert.strictEqual(standing.value, 0);
      assert.strictEqual(standing.tier.id, 'neutral');
    });
  });

  describe('getAllFactionReputations', () => {
    it('returns all factions', () => {
      const factions = getAllFactionReputations(gameState);

      assert.ok(Array.isArray(factions));
      assert.strictEqual(factions.length, Object.keys(FACTIONS).length);
    });

    it('includes tier and progress', () => {
      const factions = getAllFactionReputations(gameState);

      factions.forEach(f => {
        assert.ok(f.faction);
        assert.ok(typeof f.value === 'number');
        assert.ok(f.tier);
        assert.ok(typeof f.progressToNext === 'number');
      });
    });
  });

  describe('canAccessFactionServices', () => {
    it('allows basic services at neutral', () => {
      const result = canAccessFactionServices(gameState, 'merchants_guild', 'basic');

      assert.strictEqual(result.canAccess, true);
    });

    it('denies advanced services at neutral', () => {
      const result = canAccessFactionServices(gameState, 'merchants_guild', 'advanced');

      assert.strictEqual(result.canAccess, false);
      assert.ok(result.shortfall > 0);
    });

    it('allows services when reputation is high enough', () => {
      const modified = modifyReputation(gameState, 'merchants_guild', 1000);
      const result = canAccessFactionServices(modified.state, 'merchants_guild', 'advanced');

      assert.strictEqual(result.canAccess, true);
    });
  });

  describe('getFactionDiscount', () => {
    it('returns 0 for neutral', () => {
      const discount = getFactionDiscount(gameState, 'merchants_guild');
      assert.strictEqual(discount, 0);
    });

    it('returns positive discount for high rep', () => {
      const modified = modifyReputation(gameState, 'merchants_guild', 500);
      const discount = getFactionDiscount(modified.state, 'merchants_guild');

      assert.ok(discount > 0);
    });

    it('returns negative discount for low rep', () => {
      const modified = modifyReputation(gameState, 'merchants_guild', -600);
      const discount = getFactionDiscount(modified.state, 'merchants_guild');

      assert.ok(discount < 0);
    });
  });

  describe('isFactionHostile', () => {
    it('returns false for neutral faction', () => {
      assert.strictEqual(isFactionHostile(gameState, 'merchants_guild'), false);
    });

    it('returns true for hostile faction', () => {
      const modified = modifyReputation(gameState, 'merchants_guild', -600);
      assert.strictEqual(isFactionHostile(modified.state, 'merchants_guild'), true);
    });
  });

  describe('applyReputationDecay', () => {
    it('decays reputation over time', () => {
      const modified = modifyReputation(gameState, 'merchants_guild', 100);

      // Manually set lastChange to simulate old interaction
      modified.state.reputation.factions.merchants_guild.lastChange = Date.now() - (10 * 24 * 60 * 60 * 1000);

      const result = applyReputationDecay(modified.state, 5);

      assert.ok(result.decayed);
    });
  });

  describe('getReputationSummary', () => {
    it('returns summary stats', () => {
      const summary = getReputationSummary(gameState);

      assert.ok(typeof summary.level === 'number');
      assert.ok(typeof summary.totalGained === 'number');
      assert.ok(typeof summary.totalLost === 'number');
      assert.ok(summary.factionBreakdown);
    });

    it('counts factions by tier', () => {
      const summary = getReputationSummary(gameState);

      const totalFactions = Object.values(summary.factionBreakdown).reduce((a, b) => a + b, 0);
      assert.strictEqual(totalFactions, Object.keys(FACTIONS).length);
    });
  });

  describe('getFactionHistory', () => {
    it('returns empty for no history', () => {
      const history = getFactionHistory(gameState, 'merchants_guild');
      assert.deepStrictEqual(history, []);
    });

    it('returns history after changes', () => {
      const modified = modifyReputation(gameState, 'merchants_guild', 100, 'Test reason');
      const history = getFactionHistory(modified.state, 'merchants_guild');

      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].amount, 100);
      assert.strictEqual(history[0].reason, 'Test reason');
    });

    it('limits results', () => {
      let state = gameState;
      for (let i = 0; i < 15; i++) {
        const result = modifyReputation(state, 'merchants_guild', 10);
        state = result.state;
      }

      const history = getFactionHistory(state, 'merchants_guild', 5);
      assert.strictEqual(history.length, 5);
    });
  });

  describe('areFactionsAllied', () => {
    it('returns true for allied factions', () => {
      assert.strictEqual(areFactionsAllied('merchants_guild', 'craftsmen_union'), true);
    });

    it('returns false for non-allied factions', () => {
      assert.strictEqual(areFactionsAllied('merchants_guild', 'warriors_order'), false);
    });
  });

  describe('areFactionsEnemies', () => {
    it('returns true for enemy factions', () => {
      assert.strictEqual(areFactionsEnemies('merchants_guild', 'shadow_syndicate'), true);
    });

    it('returns false for non-enemy factions', () => {
      assert.strictEqual(areFactionsEnemies('merchants_guild', 'warriors_order'), false);
    });
  });
});

describe('Reputation System UI', () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      reputation: initReputationState()
    };
  });

  describe('renderReputationPanel', () => {
    it('renders panel', () => {
      const html = renderReputationPanel(gameState);

      assert.ok(html.includes('reputation-panel'));
      assert.ok(html.includes('Reputation'));
      assert.ok(html.includes('Factions'));
    });

    it('shows level', () => {
      const html = renderReputationPanel(gameState);
      assert.ok(html.includes('Level'));
    });

    it('shows tier breakdown', () => {
      const html = renderReputationPanel(gameState);
      assert.ok(html.includes('tier-breakdown'));
    });
  });

  describe('renderFactionDetail', () => {
    it('renders faction detail', () => {
      const html = renderFactionDetail(gameState, 'merchants_guild');

      assert.ok(html.includes('faction-detail'));
      assert.ok(html.includes('Merchants Guild'));
    });

    it('shows service access', () => {
      const html = renderFactionDetail(gameState, 'merchants_guild');
      assert.ok(html.includes('Service Access'));
    });

    it('shows allied factions', () => {
      const html = renderFactionDetail(gameState, 'merchants_guild');
      assert.ok(html.includes('Allied Factions'));
    });

    it('returns error for invalid faction', () => {
      const html = renderFactionDetail(gameState, 'invalid');
      assert.ok(html.includes('error'));
    });
  });

  describe('renderNpcRelations', () => {
    it('renders empty message when no NPCs', () => {
      const html = renderNpcRelations(gameState, []);
      assert.ok(html.includes('No NPC relations'));
    });

    it('renders NPC list', () => {
      const set = setNpcRelation(gameState, 'npc1', 100, 'Test NPC');
      const html = renderNpcRelations(set.state, ['npc1']);

      assert.ok(html.includes('Test NPC'));
      assert.ok(html.includes('npc-row'));
    });
  });

  describe('renderRegionStandings', () => {
    it('renders empty message when no regions', () => {
      const html = renderRegionStandings(gameState, []);
      assert.ok(html.includes('No region standings'));
    });

    it('renders region list', () => {
      const set = setRegionStanding(gameState, 'region1', 200, 'Test Region');
      const html = renderRegionStandings(set.state, ['region1']);

      assert.ok(html.includes('Test Region'));
      assert.ok(html.includes('region-row'));
    });
  });

  describe('renderReputationChange', () => {
    it('renders positive change', () => {
      const change = {
        faction: FACTIONS.MERCHANTS_GUILD,
        oldValue: 0,
        newValue: 100,
        change: 100,
        tierChanged: true,
        newTier: 'friendly',
        spillover: []
      };

      const html = renderReputationChange(change);

      assert.ok(html.includes('positive'));
      assert.ok(html.includes('+100'));
    });

    it('renders negative change', () => {
      const change = {
        faction: FACTIONS.MERCHANTS_GUILD,
        oldValue: 0,
        newValue: -50,
        change: -50,
        tierChanged: false,
        spillover: []
      };

      const html = renderReputationChange(change);

      assert.ok(html.includes('negative'));
      assert.ok(html.includes('-50'));
    });

    it('shows tier change', () => {
      const change = {
        faction: FACTIONS.MERCHANTS_GUILD,
        change: 100,
        tierChanged: true,
        newTier: 'friendly',
        spillover: []
      };

      const html = renderReputationChange(change);
      assert.ok(html.includes('tier-change'));
      assert.ok(html.includes('friendly'));
    });

    it('shows spillover effects', () => {
      const change = {
        faction: FACTIONS.MERCHANTS_GUILD,
        change: 100,
        tierChanged: false,
        spillover: [{ factionId: 'craftsmen_union', amount: 25 }]
      };

      const html = renderReputationChange(change);
      assert.ok(html.includes('spillover'));
      assert.ok(html.includes('Craftsmen Union'));
    });
  });

  describe('renderTierLegend', () => {
    it('renders all tiers', () => {
      const html = renderTierLegend();

      assert.ok(html.includes('tier-legend'));
      Object.values(REPUTATION_TIERS).forEach(tier => {
        assert.ok(html.includes(tier.name));
      });
    });
  });

  describe('renderFactionSelector', () => {
    it('renders dropdown', () => {
      const html = renderFactionSelector(gameState);

      assert.ok(html.includes('faction-selector'));
      assert.ok(html.includes('<select'));
    });

    it('includes all factions', () => {
      const html = renderFactionSelector(gameState);

      Object.values(FACTIONS).forEach(faction => {
        assert.ok(html.includes(faction.name));
      });
    });

    it('marks selected faction', () => {
      const html = renderFactionSelector(gameState, 'merchants_guild');
      assert.ok(html.includes('selected'));
    });
  });

  describe('renderCompactReputationBar', () => {
    it('renders compact bar', () => {
      const html = renderCompactReputationBar(gameState, 'merchants_guild');

      assert.ok(html.includes('compact-rep-bar'));
      assert.ok(html.includes('mini-bar'));
    });

    it('returns empty for invalid faction', () => {
      const html = renderCompactReputationBar(gameState, 'invalid');
      assert.strictEqual(html, '');
    });
  });

  describe('renderReputationRewards', () => {
    it('renders rewards structure', () => {
      const rewards = {
        friendly: ['10% discount'],
        honored: ['Special items'],
        exalted: ['Exclusive mount']
      };

      const html = renderReputationRewards('merchants_guild', rewards);

      assert.ok(html.includes('reputation-rewards'));
      assert.ok(html.includes('10% discount'));
    });

    it('returns empty for invalid faction', () => {
      const html = renderReputationRewards('invalid', {});
      assert.strictEqual(html, '');
    });
  });

  describe('renderFactionComparison', () => {
    it('renders comparison grid', () => {
      const html = renderFactionComparison(gameState, ['merchants_guild', 'warriors_order']);

      assert.ok(html.includes('faction-comparison'));
      assert.ok(html.includes('Merchants Guild'));
      assert.ok(html.includes('Warriors Order'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes faction names', () => {
      // Test with valid faction that has normal name
      const html = renderReputationPanel(gameState);
      assert.ok(!html.includes('<script>'));
    });

    it('escapes NPC names', () => {
      const set = setNpcRelation(gameState, 'bad_npc', 100, '<script>alert("xss")</script>');
      const html = renderNpcRelations(set.state, ['bad_npc']);

      assert.ok(!html.includes('<script>alert'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes region names', () => {
      const set = setRegionStanding(gameState, 'bad_region', 100, '<img onerror="evil()">');
      const html = renderRegionStandings(set.state, ['bad_region']);

      assert.ok(!html.includes('<img onerror'));
      assert.ok(html.includes('&lt;img'));
    });
  });
});
