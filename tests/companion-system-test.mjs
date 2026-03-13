/**
 * Companion System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  COMPANION_TYPES,
  COMPANION_RARITIES,
  COMPANION_MOODS,
  COMPANION_ABILITIES,
  COMPANION_FOODS,
  initCompanionState,
  createCompanion,
  addCompanion,
  releaseCompanion,
  setActiveCompanion,
  getActiveCompanion,
  feedCompanion,
  trainCompanion,
  teachAbility,
  removeAbility,
  useAbility,
  reduceCooldowns,
  damageCompanion,
  healCompanion,
  reviveCompanion,
  updateHunger,
  recordBattle,
  getOwnedCompanions,
  getCompanion,
  getCompanionStats,
  calculateCombatPower,
  getAvailableSlots,
  upgradeMaxSlots
} from '../src/companion-system.js';

import {
  renderCompanionCard,
  renderCompanionList,
  renderCompanionDetails,
  renderCompanionAbilities,
  renderFeedingMenu,
  renderTypeSelector,
  renderRaritySelector,
  renderAbilitySelector,
  renderCompanionStatsSummary,
  renderActiveCompanionIndicator,
  renderCompanionActions,
  renderExpBar,
  renderLoyaltyIndicator
} from '../src/companion-system-ui.js';

describe('Companion System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initCompanionState(state);
    state = result.state;
  });

  describe('COMPANION_TYPES', () => {
    it('has all types', () => {
      assert.ok(COMPANION_TYPES.BEAST);
      assert.ok(COMPANION_TYPES.DRAGON);
      assert.ok(COMPANION_TYPES.ELEMENTAL);
      assert.ok(COMPANION_TYPES.SPIRIT);
    });
  });

  describe('COMPANION_RARITIES', () => {
    it('has rarities with scaling stats', () => {
      assert.ok(COMPANION_RARITIES.COMMON.statMod < COMPANION_RARITIES.LEGENDARY.statMod);
      assert.ok(COMPANION_RARITIES.COMMON.abilitySlots < COMPANION_RARITIES.LEGENDARY.abilitySlots);
    });
  });

  describe('COMPANION_MOODS', () => {
    it('has mood effects', () => {
      assert.ok(COMPANION_MOODS.ECSTATIC.statBonus > 0);
      assert.ok(COMPANION_MOODS.MISERABLE.statBonus < 0);
      assert.strictEqual(COMPANION_MOODS.CONTENT.statBonus, 0);
    });
  });

  describe('initCompanionState', () => {
    it('creates initial state', () => {
      assert.ok(state.companions);
      assert.deepStrictEqual(state.companions.owned, {});
      assert.strictEqual(state.companions.active, null);
    });

    it('sets max slots', () => {
      const result = initCompanionState({}, 5);
      assert.strictEqual(result.state.companions.maxSlots, 5);
    });
  });

  describe('createCompanion', () => {
    it('creates a companion', () => {
      const result = createCompanion({ id: 'wolf1', name: 'Shadow Wolf' });
      assert.ok(result.success);
      assert.strictEqual(result.companion.name, 'Shadow Wolf');
      assert.strictEqual(result.companion.type, 'beast');
    });

    it('fails without id', () => {
      const result = createCompanion({ name: 'Wolf' });
      assert.ok(!result.success);
    });

    it('applies rarity modifier', () => {
      const common = createCompanion({ id: 'c1', name: 'C', rarity: 'common' });
      const legend = createCompanion({ id: 'l1', name: 'L', rarity: 'legendary' });
      assert.ok(legend.companion.maxHealth > common.companion.maxHealth);
    });

    it('sets correct type stats', () => {
      const dragon = createCompanion({ id: 'd1', name: 'D', type: 'dragon' });
      const fairy = createCompanion({ id: 'f1', name: 'F', type: 'fairy' });
      assert.ok(dragon.companion.maxHealth > fairy.companion.maxHealth);
    });
  });

  describe('addCompanion', () => {
    it('adds companion to collection', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      const result = addCompanion(state, companion);
      assert.ok(result.success);
      assert.ok(result.state.companions.owned['wolf1']);
    });

    it('fails when slots full', () => {
      const result1 = initCompanionState({}, 1);
      let s = result1.state;
      const { companion } = createCompanion({ id: 'c1', name: 'C1' });
      s = addCompanion(s, companion).state;
      const { companion: c2 } = createCompanion({ id: 'c2', name: 'C2' });
      const result = addCompanion(s, c2);
      assert.ok(!result.success);
      assert.ok(result.error.includes('slots'));
    });

    it('fails for duplicate id', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = addCompanion(state, companion);
      assert.ok(!result.success);
    });
  });

  describe('releaseCompanion', () => {
    it('releases companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = releaseCompanion(state, 'wolf1');
      assert.ok(result.success);
      assert.ok(!result.state.companions.owned['wolf1']);
    });

    it('clears active if released', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      state = setActiveCompanion(state, 'wolf1').state;
      state = releaseCompanion(state, 'wolf1').state;
      assert.strictEqual(state.companions.active, null);
    });
  });

  describe('setActiveCompanion', () => {
    it('sets active companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = setActiveCompanion(state, 'wolf1');
      assert.ok(result.success);
      assert.strictEqual(result.state.companions.active, 'wolf1');
    });

    it('allows null to dismiss', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      state = setActiveCompanion(state, 'wolf1').state;
      const result = setActiveCompanion(state, null);
      assert.ok(result.success);
      assert.strictEqual(result.state.companions.active, null);
    });
  });

  describe('getActiveCompanion', () => {
    it('returns null when no active', () => {
      const result = getActiveCompanion(state);
      assert.strictEqual(result.companion, null);
      assert.strictEqual(result.isActive, false);
    });

    it('returns active companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      state = setActiveCompanion(state, 'wolf1').state;
      const result = getActiveCompanion(state);
      assert.strictEqual(result.companion.id, 'wolf1');
      assert.strictEqual(result.isActive, true);
    });
  });

  describe('feedCompanion', () => {
    it('feeds companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      companion.hunger = 50;
      state = addCompanion(state, companion).state;
      const result = feedCompanion(state, 'wolf1', 'basic_food');
      assert.ok(result.success);
      assert.ok(result.state.companions.owned['wolf1'].hunger > 50);
    });

    it('increases happiness', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      companion.happiness = 30;
      state = addCompanion(state, companion).state;
      const result = feedCompanion(state, 'wolf1', 'treat');
      assert.ok(result.state.companions.owned['wolf1'].happiness > 30);
    });
  });

  describe('trainCompanion', () => {
    it('gains exp', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = trainCompanion(state, 'wolf1', 50);
      assert.ok(result.success);
      assert.strictEqual(result.state.companions.owned['wolf1'].exp, 50);
    });

    it('levels up', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = trainCompanion(state, 'wolf1', 200);
      assert.ok(result.levelsGained > 0);
      assert.ok(result.state.companions.owned['wolf1'].level > 1);
    });
  });

  describe('teachAbility', () => {
    it('teaches ability', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf', rarity: 'rare' });
      state = addCompanion(state, companion).state;
      const result = teachAbility(state, 'wolf1', 'heal');
      assert.ok(result.success);
      assert.ok(result.state.companions.owned['wolf1'].abilities.includes('heal'));
    });

    it('fails when slots full', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf', rarity: 'common' });
      state = addCompanion(state, companion).state;
      const result = teachAbility(state, 'wolf1', 'heal');
      assert.ok(!result.success);
      assert.ok(result.error.includes('slots'));
    });
  });

  describe('removeAbility', () => {
    it('removes ability', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf', abilities: ['attack', 'defend'], rarity: 'rare' });
      state = addCompanion(state, companion).state;
      const result = removeAbility(state, 'wolf1', 'defend');
      assert.ok(result.success);
      assert.ok(!result.state.companions.owned['wolf1'].abilities.includes('defend'));
    });

    it('fails to remove last ability', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = removeAbility(state, 'wolf1', 'attack');
      assert.ok(!result.success);
    });
  });

  describe('useAbility', () => {
    it('uses ability', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = useAbility(state, 'wolf1', 'attack');
      assert.ok(result.success);
      assert.ok(result.power > 0);
    });

    it('fails when on cooldown', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf', abilities: ['attack', 'defend'], rarity: 'rare' });
      state = addCompanion(state, companion).state;
      state = useAbility(state, 'wolf1', 'defend').state;
      const result = useAbility(state, 'wolf1', 'defend');
      assert.ok(!result.success);
      assert.ok(result.error.includes('cooldown'));
    });
  });

  describe('reduceCooldowns', () => {
    it('reduces cooldowns', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf', abilities: ['attack', 'defend'], rarity: 'rare' });
      state = addCompanion(state, companion).state;
      state = useAbility(state, 'wolf1', 'defend').state;
      const before = state.companions.owned['wolf1'].cooldowns['defend'];
      state = reduceCooldowns(state, 'wolf1').state;
      const after = state.companions.owned['wolf1'].cooldowns['defend'];
      assert.ok(after === undefined || after < before);
    });
  });

  describe('damageCompanion', () => {
    it('damages companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const maxHP = state.companions.owned['wolf1'].maxHealth;
      const result = damageCompanion(state, 'wolf1', 20);
      assert.ok(result.success);
      assert.strictEqual(result.state.companions.owned['wolf1'].health, maxHP - 20);
    });

    it('knocks out at 0 health', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = damageCompanion(state, 'wolf1', 9999);
      assert.strictEqual(result.newHealth, 0);
      assert.ok(result.isKnockedOut);
    });
  });

  describe('healCompanion', () => {
    it('heals companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      state = damageCompanion(state, 'wolf1', 50).state;
      const result = healCompanion(state, 'wolf1', 30);
      assert.ok(result.success);
      assert.ok(result.healed > 0);
    });

    it('caps at max health', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const maxHP = state.companions.owned['wolf1'].maxHealth;
      const result = healCompanion(state, 'wolf1', 9999);
      assert.strictEqual(result.newHealth, maxHP);
    });
  });

  describe('reviveCompanion', () => {
    it('revives knocked out companion', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      state = damageCompanion(state, 'wolf1', 9999).state;
      const result = reviveCompanion(state, 'wolf1', 50);
      assert.ok(result.success);
      assert.ok(result.newHealth > 0);
    });

    it('fails if not knocked out', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = reviveCompanion(state, 'wolf1');
      assert.ok(!result.success);
    });
  });

  describe('updateHunger', () => {
    it('decreases hunger', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const before = state.companions.owned['wolf1'].hunger;
      const result = updateHunger(state, 'wolf1', 10);
      assert.ok(result.success);
      assert.strictEqual(result.newHunger, before - 10);
    });
  });

  describe('recordBattle', () => {
    it('records battle', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      state = addCompanion(state, companion).state;
      const result = recordBattle(state, 'wolf1', 3);
      assert.ok(result.success);
      assert.strictEqual(result.state.companions.owned['wolf1'].battleCount, 1);
      assert.strictEqual(result.state.companions.owned['wolf1'].kills, 3);
    });
  });

  describe('getOwnedCompanions', () => {
    it('returns all companions', () => {
      const { companion: c1 } = createCompanion({ id: 'c1', name: 'C1' });
      const { companion: c2 } = createCompanion({ id: 'c2', name: 'C2' });
      state = addCompanion(state, c1).state;
      state = addCompanion(state, c2).state;
      const result = getOwnedCompanions(state);
      assert.strictEqual(result.length, 2);
    });
  });

  describe('calculateCombatPower', () => {
    it('calculates power', () => {
      const { companion } = createCompanion({ id: 'wolf1', name: 'Wolf' });
      const power = calculateCombatPower(companion);
      assert.ok(power > 0);
    });

    it('scales with level', () => {
      const { companion: low } = createCompanion({ id: 'l', name: 'L', level: 1 });
      const { companion: high } = createCompanion({ id: 'h', name: 'H', level: 10 });
      assert.ok(calculateCombatPower(high) > calculateCombatPower(low));
    });
  });

  describe('getAvailableSlots', () => {
    it('shows available slots', () => {
      const result = getAvailableSlots(state);
      assert.strictEqual(result.used, 0);
      assert.strictEqual(result.max, 3);
      assert.strictEqual(result.available, 3);
    });
  });

  describe('upgradeMaxSlots', () => {
    it('increases slots', () => {
      const result = upgradeMaxSlots(state, 2);
      assert.ok(result.success);
      assert.strictEqual(result.newMax, 5);
    });
  });
});

describe('Companion System UI', () => {
  let state;
  let companion;

  beforeEach(() => {
    state = {};
    const init = initCompanionState(state);
    state = init.state;
    const created = createCompanion({ id: 'wolf1', name: 'Shadow Wolf', rarity: 'rare' });
    companion = created.companion;
    state = addCompanion(state, companion).state;
  });

  describe('renderCompanionCard', () => {
    it('renders card', () => {
      const html = renderCompanionCard(companion);
      assert.ok(html.includes('Shadow Wolf'));
      assert.ok(html.includes('companion-card'));
    });

    it('shows active state', () => {
      const html = renderCompanionCard(companion, true);
      assert.ok(html.includes('active'));
    });
  });

  describe('renderCompanionList', () => {
    it('renders list', () => {
      const html = renderCompanionList(state);
      assert.ok(html.includes('companion-list'));
      assert.ok(html.includes('Shadow Wolf'));
    });

    it('shows empty state', () => {
      const emptyState = initCompanionState({}).state;
      const html = renderCompanionList(emptyState);
      assert.ok(html.includes('No companions'));
    });
  });

  describe('renderCompanionDetails', () => {
    it('renders details', () => {
      const html = renderCompanionDetails(companion);
      assert.ok(html.includes('Shadow Wolf'));
      assert.ok(html.includes('Combat Stats'));
    });

    it('handles null', () => {
      const html = renderCompanionDetails(null);
      assert.ok(html.includes('No companion selected'));
    });
  });

  describe('renderCompanionAbilities', () => {
    it('renders abilities', () => {
      const html = renderCompanionAbilities(companion);
      assert.ok(html.includes('Abilities'));
      assert.ok(html.includes('attack'));
    });
  });

  describe('renderFeedingMenu', () => {
    it('renders menu', () => {
      const html = renderFeedingMenu(companion);
      assert.ok(html.includes('feeding-menu'));
      assert.ok(html.includes('Basic Food'));
    });
  });

  describe('renderTypeSelector', () => {
    it('renders types', () => {
      const html = renderTypeSelector('beast');
      assert.ok(html.includes('Beast'));
      assert.ok(html.includes('Dragon'));
    });
  });

  describe('renderRaritySelector', () => {
    it('renders rarities', () => {
      const html = renderRaritySelector('rare');
      assert.ok(html.includes('Common'));
      assert.ok(html.includes('Legendary'));
    });
  });

  describe('renderAbilitySelector', () => {
    it('renders abilities', () => {
      const html = renderAbilitySelector(['attack']);
      assert.ok(html.includes('Attack'));
      assert.ok(html.includes('Heal'));
    });
  });

  describe('renderCompanionStatsSummary', () => {
    it('renders stats', () => {
      const html = renderCompanionStatsSummary(state);
      assert.ok(html.includes('Companion Statistics'));
      assert.ok(html.includes('Tamed'));
    });
  });

  describe('renderActiveCompanionIndicator', () => {
    it('shows no active', () => {
      const html = renderActiveCompanionIndicator(state);
      assert.ok(html.includes('No active companion'));
    });

    it('shows active', () => {
      state = setActiveCompanion(state, 'wolf1').state;
      const html = renderActiveCompanionIndicator(state);
      assert.ok(html.includes('Shadow Wolf'));
    });
  });

  describe('renderCompanionActions', () => {
    it('renders actions', () => {
      const html = renderCompanionActions(companion);
      assert.ok(html.includes('Feed'));
      assert.ok(html.includes('Train'));
    });
  });

  describe('renderExpBar', () => {
    it('renders exp bar', () => {
      const html = renderExpBar(companion);
      assert.ok(html.includes('exp-bar'));
      assert.ok(html.includes('EXP'));
    });
  });

  describe('renderLoyaltyIndicator', () => {
    it('renders loyalty', () => {
      const html = renderLoyaltyIndicator(75);
      assert.ok(html.includes('Loyalty'));
      assert.ok(html.includes('75%'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes companion name', () => {
      const malicious = createCompanion({ id: 'x', name: '<script>alert("xss")</script>' });
      const html = renderCompanionCard(malicious.companion);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
