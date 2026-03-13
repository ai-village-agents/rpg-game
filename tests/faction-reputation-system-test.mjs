/**
 * Faction Reputation System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  REPUTATION_LEVEL,
  FACTION_CATEGORY,
  FACTIONS,
  createReputationState,
  getReputationLevel,
  getReputationProgress,
  modifyReputation,
  getFactionStanding,
  claimReward,
  getFactionDiscount,
  getAllStandings,
  canInteract,
  discoverFaction,
  setReputationBonus,
  getFactionRelationships,
  calculateFactionScore,
  validateReputationState,
  escapeHtml
} from '../src/faction-reputation-system.js';

import {
  renderReputationPanel,
  renderFactionDetail,
  renderReputationChange,
  renderFactionHud,
  renderFactionDiscovery,
  renderReputationSummary,
  getFactionStyles
} from '../src/faction-reputation-system-ui.js';

// ============================================
// Constants Tests
// ============================================

describe('Faction Reputation System - Constants', () => {
  it('should define reputation levels', () => {
    assert.strictEqual(REPUTATION_LEVEL.HATED, 'hated');
    assert.strictEqual(REPUTATION_LEVEL.HOSTILE, 'hostile');
    assert.strictEqual(REPUTATION_LEVEL.UNFRIENDLY, 'unfriendly');
    assert.strictEqual(REPUTATION_LEVEL.NEUTRAL, 'neutral');
    assert.strictEqual(REPUTATION_LEVEL.FRIENDLY, 'friendly');
    assert.strictEqual(REPUTATION_LEVEL.HONORED, 'honored');
    assert.strictEqual(REPUTATION_LEVEL.REVERED, 'revered');
    assert.strictEqual(REPUTATION_LEVEL.EXALTED, 'exalted');
  });

  it('should define faction categories', () => {
    assert.strictEqual(FACTION_CATEGORY.KINGDOM, 'kingdom');
    assert.strictEqual(FACTION_CATEGORY.GUILD, 'guild');
    assert.strictEqual(FACTION_CATEGORY.TRIBE, 'tribe');
    assert.strictEqual(FACTION_CATEGORY.ORDER, 'order');
    assert.strictEqual(FACTION_CATEGORY.MERCHANT, 'merchant');
    assert.strictEqual(FACTION_CATEGORY.CREATURE, 'creature');
  });

  it('should have faction definitions', () => {
    assert.ok(FACTIONS.kingdom_valor);
    assert.ok(FACTIONS.forest_guardians);
    assert.ok(FACTIONS.merchant_league);
    assert.ok(FACTIONS.silver_order);
    assert.ok(FACTIONS.shadow_syndicate);
  });

  it('should have valid faction structure', () => {
    const faction = FACTIONS.kingdom_valor;
    assert.ok(faction.id);
    assert.ok(faction.name);
    assert.ok(faction.description);
    assert.ok(faction.category);
    assert.ok(faction.rewards);
  });

  it('should define rivals and allies', () => {
    const faction = FACTIONS.kingdom_valor;
    assert.ok(Array.isArray(faction.rivals));
    assert.ok(Array.isArray(faction.allies));
    assert.ok(faction.rivals.length > 0);
  });
});

// ============================================
// State Creation Tests
// ============================================

describe('Faction Reputation System - State Creation', () => {
  it('should create initial reputation state', () => {
    const state = createReputationState();
    assert.ok(state.standings);
    assert.ok(Array.isArray(state.reputationHistory));
    assert.strictEqual(state.bonusMultiplier, 1.0);
  });

  it('should create standings for all factions', () => {
    const state = createReputationState();
    const factionCount = Object.keys(FACTIONS).length;
    assert.strictEqual(Object.keys(state.standings).length, factionCount);
  });

  it('should start at neutral reputation', () => {
    const state = createReputationState();
    for (const standing of Object.values(state.standings)) {
      assert.strictEqual(standing.reputation, 0);
      assert.strictEqual(standing.level, REPUTATION_LEVEL.NEUTRAL);
    }
  });

  it('should mark hidden factions as undiscovered', () => {
    const state = createReputationState();
    assert.strictEqual(state.standings.shadow_syndicate.discovered, false);
    assert.strictEqual(state.standings.kingdom_valor.discovered, true);
  });

  it('should initialize empty rewards claimed', () => {
    const state = createReputationState();
    for (const standing of Object.values(state.standings)) {
      assert.ok(Array.isArray(standing.rewardsClaimed));
      assert.strictEqual(standing.rewardsClaimed.length, 0);
    }
  });
});

// ============================================
// Reputation Level Tests
// ============================================

describe('Faction Reputation System - Reputation Levels', () => {
  it('should return neutral for 0 reputation', () => {
    assert.strictEqual(getReputationLevel(0), REPUTATION_LEVEL.NEUTRAL);
  });

  it('should return friendly for positive reputation', () => {
    assert.strictEqual(getReputationLevel(3000), REPUTATION_LEVEL.FRIENDLY);
    assert.strictEqual(getReputationLevel(5000), REPUTATION_LEVEL.FRIENDLY);
  });

  it('should return honored for higher reputation', () => {
    assert.strictEqual(getReputationLevel(9000), REPUTATION_LEVEL.HONORED);
    assert.strictEqual(getReputationLevel(15000), REPUTATION_LEVEL.HONORED);
  });

  it('should return revered for high reputation', () => {
    assert.strictEqual(getReputationLevel(21000), REPUTATION_LEVEL.REVERED);
    assert.strictEqual(getReputationLevel(30000), REPUTATION_LEVEL.REVERED);
  });

  it('should return exalted for max reputation', () => {
    assert.strictEqual(getReputationLevel(42000), REPUTATION_LEVEL.EXALTED);
    assert.strictEqual(getReputationLevel(100000), REPUTATION_LEVEL.EXALTED);
  });

  it('should return unfriendly for negative reputation', () => {
    assert.strictEqual(getReputationLevel(-1000), REPUTATION_LEVEL.UNFRIENDLY);
  });

  it('should return hostile at threshold', () => {
    // Hostile threshold is -6000, values below go to hated
    assert.strictEqual(getReputationLevel(-6000), REPUTATION_LEVEL.HOSTILE);
    assert.strictEqual(getReputationLevel(-5999), REPUTATION_LEVEL.HOSTILE);
  });

  it('should return hated for very low reputation', () => {
    assert.strictEqual(getReputationLevel(-42000), REPUTATION_LEVEL.HATED);
    assert.strictEqual(getReputationLevel(-100000), REPUTATION_LEVEL.HATED);
  });
});

// ============================================
// Reputation Progress Tests
// ============================================

describe('Faction Reputation System - Reputation Progress', () => {
  it('should calculate progress within level', () => {
    const progress = getReputationProgress(1500);
    assert.strictEqual(progress.currentLevel, REPUTATION_LEVEL.NEUTRAL);
    assert.strictEqual(progress.nextLevel, REPUTATION_LEVEL.FRIENDLY);
    assert.ok(progress.progress > 0 && progress.progress < 1);
  });

  it('should show max level status', () => {
    const progress = getReputationProgress(50000);
    assert.strictEqual(progress.currentLevel, REPUTATION_LEVEL.EXALTED);
    assert.strictEqual(progress.nextLevel, null);
    assert.strictEqual(progress.isMax, true);
  });

  it('should calculate points needed', () => {
    const progress = getReputationProgress(2000);
    assert.ok(progress.needed > 0);
  });

  it('should clamp progress between 0 and 1', () => {
    const progress = getReputationProgress(100);
    assert.ok(progress.progress >= 0);
    assert.ok(progress.progress <= 1);
  });
});

// ============================================
// Reputation Modification Tests
// ============================================

describe('Faction Reputation System - Reputation Modification', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should increase reputation', () => {
    const result = modifyReputation(state, 'kingdom_valor', 500, 'Quest completed');
    assert.ok(!result.error);
    assert.strictEqual(result.state.standings.kingdom_valor.reputation, 500);
  });

  it('should decrease reputation', () => {
    const result = modifyReputation(state, 'kingdom_valor', -500, 'Crime committed');
    assert.ok(!result.error);
    assert.strictEqual(result.state.standings.kingdom_valor.reputation, -500);
  });

  it('should track total gained', () => {
    const result = modifyReputation(state, 'kingdom_valor', 500);
    assert.strictEqual(result.state.standings.kingdom_valor.totalGained, 500);
  });

  it('should track total lost', () => {
    const result = modifyReputation(state, 'kingdom_valor', -500);
    assert.strictEqual(result.state.standings.kingdom_valor.totalLost, 500);
  });

  it('should detect level changes', () => {
    const result = modifyReputation(state, 'kingdom_valor', 3500);
    assert.ok(result.change.levelChanged);
    assert.strictEqual(result.change.newLevel, REPUTATION_LEVEL.FRIENDLY);
  });

  it('should add to history', () => {
    const result = modifyReputation(state, 'kingdom_valor', 500, 'Test reason');
    assert.strictEqual(result.state.reputationHistory.length, 1);
    assert.strictEqual(result.state.reputationHistory[0].reason, 'Test reason');
  });

  it('should apply bonus multiplier', () => {
    const stateWithBonus = { ...state, bonusMultiplier: 2.0 };
    const result = modifyReputation(stateWithBonus, 'kingdom_valor', 100);
    assert.strictEqual(result.change.amount, 200);
  });

  it('should not apply bonus to losses', () => {
    const stateWithBonus = { ...state, bonusMultiplier: 2.0 };
    const result = modifyReputation(stateWithBonus, 'kingdom_valor', -100);
    assert.strictEqual(result.change.amount, -100);
  });

  it('should decrease rival faction reputation', () => {
    const result = modifyReputation(state, 'kingdom_valor', 1000);
    assert.ok(result.change.rivalChanges.length > 0);
    const rivalChange = result.change.rivalChanges[0];
    assert.ok(rivalChange.amount < 0);
  });

  it('should increase allied faction reputation', () => {
    const result = modifyReputation(state, 'kingdom_valor', 1000);
    assert.ok(result.change.allyChanges.length > 0);
    const allyChange = result.change.allyChanges[0];
    assert.ok(allyChange.amount > 0);
  });

  it('should mark faction as discovered', () => {
    const hiddenFaction = 'shadow_syndicate';
    assert.strictEqual(state.standings[hiddenFaction].discovered, false);
    const result = modifyReputation(state, hiddenFaction, 100);
    assert.strictEqual(result.state.standings[hiddenFaction].discovered, true);
  });

  it('should reject invalid faction', () => {
    const result = modifyReputation(state, 'nonexistent', 100);
    assert.ok(result.error);
  });

  it('should limit history to 100 entries', () => {
    let current = state;
    for (let i = 0; i < 120; i++) {
      const { state: newState } = modifyReputation(current, 'kingdom_valor', 10);
      current = newState;
    }
    assert.ok(current.reputationHistory.length <= 100);
  });
});

// ============================================
// Faction Standing Tests
// ============================================

describe('Faction Reputation System - Faction Standing', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should get faction standing', () => {
    const standing = getFactionStanding(state, 'kingdom_valor');
    assert.ok(standing);
    assert.strictEqual(standing.reputation, 0);
    assert.strictEqual(standing.level, REPUTATION_LEVEL.NEUTRAL);
    assert.ok(standing.faction);
    assert.ok(standing.progress);
  });

  it('should include faction info', () => {
    const standing = getFactionStanding(state, 'kingdom_valor');
    assert.strictEqual(standing.faction.name, 'Kingdom of Valor');
    assert.strictEqual(standing.faction.category, FACTION_CATEGORY.KINGDOM);
  });

  it('should return null for invalid faction', () => {
    const standing = getFactionStanding(state, 'nonexistent');
    assert.strictEqual(standing, null);
  });

  it('should include available rewards', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 4000);
    const standing = getFactionStanding(withRep, 'kingdom_valor');
    assert.ok(standing.availableRewards);
    assert.ok(standing.availableRewards.length > 0);
  });

  it('should include claimable rewards', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 4000);
    const standing = getFactionStanding(withRep, 'kingdom_valor');
    assert.ok(standing.claimableRewards);
  });
});

// ============================================
// Reward Claiming Tests
// ============================================

describe('Faction Reputation System - Reward Claiming', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 10000);
    state = withRep;
  });

  it('should claim reward', () => {
    const result = claimReward(state, 'kingdom_valor', REPUTATION_LEVEL.FRIENDLY);
    assert.ok(!result.error);
    assert.ok(result.reward);
    assert.ok(result.state.standings.kingdom_valor.rewardsClaimed.includes(REPUTATION_LEVEL.FRIENDLY));
  });

  it('should return reward items', () => {
    const result = claimReward(state, 'kingdom_valor', REPUTATION_LEVEL.FRIENDLY);
    assert.ok(result.reward.items);
  });

  it('should reject duplicate claim', () => {
    const { state: afterClaim } = claimReward(state, 'kingdom_valor', REPUTATION_LEVEL.FRIENDLY);
    const result = claimReward(afterClaim, 'kingdom_valor', REPUTATION_LEVEL.FRIENDLY);
    assert.ok(result.error);
    assert.ok(result.error.includes('already'));
  });

  it('should reject insufficient reputation', () => {
    const freshState = createReputationState();
    const result = claimReward(freshState, 'kingdom_valor', REPUTATION_LEVEL.EXALTED);
    assert.ok(result.error);
    assert.ok(result.error.includes('Insufficient'));
  });
});

// ============================================
// Faction Discount Tests
// ============================================

describe('Faction Reputation System - Faction Discounts', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should return 0 discount for neutral', () => {
    const discount = getFactionDiscount(state, 'kingdom_valor');
    assert.strictEqual(discount, 0);
  });

  it('should return discount for friendly', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 4000);
    const discount = getFactionDiscount(withRep, 'kingdom_valor');
    assert.ok(discount > 0);
  });

  it('should return higher discount for higher reputation', () => {
    const { state: friendly } = modifyReputation(state, 'merchant_league', 4000);
    const { state: exalted } = modifyReputation(friendly, 'merchant_league', 50000);

    const friendlyDiscount = getFactionDiscount(friendly, 'merchant_league');
    const exaltedDiscount = getFactionDiscount(exalted, 'merchant_league');

    assert.ok(exaltedDiscount > friendlyDiscount);
  });
});

// ============================================
// All Standings Tests
// ============================================

describe('Faction Reputation System - All Standings', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should get all standings', () => {
    const standings = getAllStandings(state);
    assert.ok(Array.isArray(standings));
  });

  it('should filter by category', () => {
    const standings = getAllStandings(state, { category: FACTION_CATEGORY.KINGDOM });
    assert.ok(standings.every(s => s.category === FACTION_CATEGORY.KINGDOM));
  });

  it('should hide undiscovered by default', () => {
    const standings = getAllStandings(state);
    const hiddenShown = standings.some(s => s.factionId === 'shadow_syndicate');
    assert.strictEqual(hiddenShown, false);
  });

  it('should show hidden when option set', () => {
    const standings = getAllStandings(state, { showHidden: true });
    const hiddenShown = standings.some(s => s.factionId === 'shadow_syndicate');
    assert.strictEqual(hiddenShown, true);
  });

  it('should sort by reputation descending', () => {
    const { state: withRep } = modifyReputation(state, 'merchant_league', 5000);
    const standings = getAllStandings(withRep);
    assert.strictEqual(standings[0].factionId, 'merchant_league');
  });
});

// ============================================
// Interaction Tests
// ============================================

describe('Faction Reputation System - Interactions', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should allow shop interaction at neutral', () => {
    const result = canInteract(state, 'kingdom_valor', 'shop');
    assert.strictEqual(result.canInteract, true);
  });

  it('should deny shop interaction when hostile', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', -5000);
    const result = canInteract(withRep, 'kingdom_valor', 'shop');
    assert.strictEqual(result.canInteract, false);
  });

  it('should require honored for special quests', () => {
    const result = canInteract(state, 'kingdom_valor', 'special_quest');
    assert.strictEqual(result.canInteract, false);

    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 15000);
    const honoredResult = canInteract(withRep, 'kingdom_valor', 'special_quest');
    assert.strictEqual(honoredResult.canInteract, true);
  });

  it('should include discount in interaction result', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 5000);
    const result = canInteract(withRep, 'kingdom_valor', 'shop');
    assert.ok('discount' in result);
  });
});

// ============================================
// Faction Discovery Tests
// ============================================

describe('Faction Reputation System - Faction Discovery', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should discover hidden faction', () => {
    const result = discoverFaction(state, 'shadow_syndicate');
    assert.ok(!result.error);
    assert.strictEqual(result.state.standings.shadow_syndicate.discovered, true);
    assert.ok(result.faction);
  });

  it('should return already discovered flag', () => {
    const result = discoverFaction(state, 'kingdom_valor');
    assert.strictEqual(result.alreadyDiscovered, true);
  });

  it('should reject invalid faction', () => {
    const result = discoverFaction(state, 'nonexistent');
    assert.ok(result.error);
  });
});

// ============================================
// Reputation Bonus Tests
// ============================================

describe('Faction Reputation System - Reputation Bonus', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should set bonus multiplier', () => {
    const result = setReputationBonus(state, 1.5);
    assert.strictEqual(result.state.bonusMultiplier, 1.5);
  });

  it('should clamp bonus to valid range', () => {
    const tooLow = setReputationBonus(state, 0.01);
    const tooHigh = setReputationBonus(state, 10.0);
    assert.strictEqual(tooLow.state.bonusMultiplier, 0.1);
    assert.strictEqual(tooHigh.state.bonusMultiplier, 5.0);
  });
});

// ============================================
// Faction Relationships Tests
// ============================================

describe('Faction Reputation System - Faction Relationships', () => {
  it('should get faction relationships', () => {
    const relationships = getFactionRelationships('kingdom_valor');
    assert.ok(relationships);
    assert.ok(relationships.faction);
    assert.ok(Array.isArray(relationships.rivals));
    assert.ok(Array.isArray(relationships.allies));
  });

  it('should include faction names', () => {
    const relationships = getFactionRelationships('kingdom_valor');
    assert.ok(relationships.rivals[0].name);
  });

  it('should return null for invalid faction', () => {
    const relationships = getFactionRelationships('nonexistent');
    assert.strictEqual(relationships, null);
  });
});

// ============================================
// Faction Score Tests
// ============================================

describe('Faction Reputation System - Faction Score', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should calculate faction score', () => {
    const score = calculateFactionScore(state);
    assert.ok(score);
    assert.strictEqual(score.totalPositive, 0);
    assert.strictEqual(score.totalNegative, 0);
  });

  it('should count discovered factions', () => {
    const score = calculateFactionScore(state);
    assert.ok(score.factionsDiscovered > 0);
    assert.ok(score.totalFactions > 0);
  });

  it('should count exalted factions', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 50000);
    const score = calculateFactionScore(withRep);
    assert.strictEqual(score.factionsAtExalted, 1);
  });

  it('should sum positive and negative reputation', () => {
    let current = state;
    current = modifyReputation(current, 'kingdom_valor', 1000).state;
    current = modifyReputation(current, 'shadow_syndicate', -500).state;

    const score = calculateFactionScore(current);
    assert.ok(score.totalPositive > 0);
    assert.ok(score.totalNegative > 0);
  });
});

// ============================================
// Validation Tests
// ============================================

describe('Faction Reputation System - Validation', () => {
  it('should validate correct state', () => {
    const state = createReputationState();
    assert.strictEqual(validateReputationState(state), true);
  });

  it('should reject null state', () => {
    assert.strictEqual(validateReputationState(null), false);
  });

  it('should reject missing standings', () => {
    assert.strictEqual(validateReputationState({ bonusMultiplier: 1, reputationHistory: [] }), false);
  });

  it('should reject invalid standing level', () => {
    const state = createReputationState();
    state.standings.kingdom_valor.level = 'invalid';
    assert.strictEqual(validateReputationState(state), false);
  });
});

// ============================================
// HTML Escaping Tests
// ============================================

describe('Faction Reputation System - HTML Escaping', () => {
  it('should escape HTML special characters', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
    assert.strictEqual(escapeHtml('"test"'), '&quot;test&quot;');
  });

  it('should handle non-string input', () => {
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(123), '');
  });
});

// ============================================
// UI Rendering Tests
// ============================================

describe('Faction Reputation System - UI Rendering', () => {
  let state;

  beforeEach(() => {
    state = createReputationState();
  });

  it('should render reputation panel', () => {
    const html = renderReputationPanel(state);
    assert.ok(html.includes('faction-panel'));
    assert.ok(html.includes('Factions'));
  });

  it('should handle null state', () => {
    const html = renderReputationPanel(null);
    assert.ok(html.includes('No faction data'));
  });

  it('should render category filters when enabled', () => {
    const html = renderReputationPanel(state, { showFilters: true });
    assert.ok(html.includes('category-filters'));
  });

  it('should render faction detail', () => {
    const html = renderFactionDetail(state, 'kingdom_valor');
    assert.ok(html.includes('faction-detail'));
    assert.ok(html.includes('Kingdom of Valor'));
  });

  it('should handle invalid faction in detail', () => {
    const html = renderFactionDetail(state, 'nonexistent');
    assert.ok(html.includes('not found'));
  });

  it('should render reputation change notification', () => {
    const change = {
      factionId: 'kingdom_valor',
      amount: 500,
      oldReputation: 0,
      newReputation: 500,
      oldLevel: REPUTATION_LEVEL.NEUTRAL,
      newLevel: REPUTATION_LEVEL.NEUTRAL,
      levelChanged: false,
      rivalChanges: [],
      allyChanges: []
    };
    const html = renderReputationChange(change);
    assert.ok(html.includes('reputation-change'));
    assert.ok(html.includes('500'));
  });

  it('should render level change in notification', () => {
    const change = {
      factionId: 'kingdom_valor',
      amount: 5000,
      oldReputation: 0,
      newReputation: 5000,
      oldLevel: REPUTATION_LEVEL.NEUTRAL,
      newLevel: REPUTATION_LEVEL.FRIENDLY,
      levelChanged: true,
      rivalChanges: [],
      allyChanges: []
    };
    const html = renderReputationChange(change);
    assert.ok(html.includes('level-change'));
  });

  it('should render faction HUD', () => {
    const html = renderFactionHud(state, 'kingdom_valor');
    assert.ok(html.includes('faction-hud'));
    assert.ok(html.includes('Kingdom of Valor'));
  });

  it('should return empty HUD for undiscovered faction', () => {
    const html = renderFactionHud(state, 'shadow_syndicate');
    assert.strictEqual(html, '');
  });

  it('should render faction discovery', () => {
    const faction = FACTIONS.shadow_syndicate;
    const html = renderFactionDiscovery(faction);
    assert.ok(html.includes('faction-discovery'));
    assert.ok(html.includes('Shadow Syndicate'));
  });

  it('should render reputation summary', () => {
    const html = renderReputationSummary(state);
    assert.ok(html.includes('reputation-summary'));
    assert.ok(html.includes('discovered'));
  });

  it('should return CSS styles', () => {
    const styles = getFactionStyles();
    assert.ok(styles.includes('.faction-panel'));
    assert.ok(styles.includes('.faction-row'));
  });

  it('should escape HTML in faction names', () => {
    const { state: withRep } = modifyReputation(state, 'kingdom_valor', 100);
    const html = renderReputationPanel(withRep);
    assert.ok(!html.includes('<script>'));
  });
});

// ============================================
// Security Tests
// ============================================

describe('Faction Reputation System - Security', () => {
  it('should not contain banned words in source', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const srcPath = path.join(process.cwd(), 'src', 'faction-reputation-system.js');
    const uiPath = path.join(process.cwd(), 'src', 'faction-reputation-system-ui.js');

    const srcContent = fs.readFileSync(srcPath, 'utf8').toLowerCase();
    const uiContent = fs.readFileSync(uiPath, 'utf8').toLowerCase();
    const content = srcContent + uiContent;

    const bannedWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

    for (const word of bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      assert.ok(!regex.test(content), `Source contains banned word: ${word}`);
    }
  });
});
