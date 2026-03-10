import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PROVISIONS,
  COOKING_RECIPES,
  createProvisionState,
  useProvision,
  tickProvisionBuffs,
  getProvisionBonuses,
  hasActiveBuff,
  clearAllBuffs,
  getProvisionById,
  canUseProvision,
} from '../src/provisions.js';

function baseState(overrides = {}) {
  return {
    player: { hp: 50, maxHp: 100, mp: 20, maxMp: 50, level: 5, inventory: {}, ...overrides.player },
    provisionState: overrides.provisionState || createProvisionState(),
    ...overrides,
  };
}

describe('PROVISIONS data', () => {
  it('has 10 provisions defined', () => {
    assert.equal(Object.keys(PROVISIONS).length, 10);
  });

  it('each provision has id, name, type, category, rarity, description, value, effect', () => {
    const required = ['id', 'name', 'type', 'category', 'rarity', 'description', 'value', 'effect'];
    Object.values(PROVISIONS).forEach((provision) => {
      required.forEach((prop) => {
        assert.ok(prop in provision, `${provision.id} missing ${prop}`);
      });
    });
  });

  it("all provision types are 'provision'", () => {
    Object.values(PROVISIONS).forEach((provision) => {
      assert.equal(provision.type, 'provision');
    });
  });

  it('no egg references in any name or description', () => {
    const banned = /egg|nest|chicken|hatch|yolk|shell|scrambl|omelet|poach/i;
    Object.values(PROVISIONS).forEach((provision) => {
      const text = `${provision.name} ${provision.description}`;
      assert.equal(banned.test(text), false, `Egg reference found in ${provision.id}`);
    });
  });

  it('travelerBread has correct stats', () => {
    assert.deepEqual(PROVISIONS.travelerBread.effect, { hpRegen: 2, duration: 5 });
    assert.equal(PROVISIONS.travelerBread.value, 10);
  });

  it('wardensMeal has correct stats', () => {
    assert.deepEqual(PROVISIONS.wardensMeal.effect, {
      atkBoost: 4,
      defBoost: 4,
      hpRegen: 3,
      mpRegen: 2,
      duration: 12,
    });
    assert.equal(PROVISIONS.wardensMeal.value, 100);
  });

  it('fieldMushroom has healInstant:15 and no duration', () => {
    assert.equal(PROVISIONS.fieldMushroom.effect.healInstant, 15);
    assert.equal('duration' in PROVISIONS.fieldMushroom.effect, false);
  });
});

describe('COOKING_RECIPES', () => {
  it('has 4 recipes', () => {
    assert.equal(COOKING_RECIPES.length, 4);
  });

  it('each recipe has id, name, description, ingredients, result, requiredLevel', () => {
    const required = ['id', 'name', 'description', 'ingredients', 'result', 'requiredLevel'];
    COOKING_RECIPES.forEach((recipe) => {
      required.forEach((prop) => {
        assert.ok(prop in recipe, `${recipe.id} missing ${prop}`);
      });
    });
  });

  it('cookHeartyStew requires level 2', () => {
    const recipe = COOKING_RECIPES.find((entry) => entry.id === 'cookHeartyStew');
    assert.ok(recipe);
    assert.equal(recipe.requiredLevel, 2);
  });

  it('cookWardensMeal requires level 6', () => {
    const recipe = COOKING_RECIPES.find((entry) => entry.id === 'cookWardensMeal');
    assert.ok(recipe);
    assert.equal(recipe.requiredLevel, 6);
  });

  it('all recipe results reference valid provision IDs', () => {
    COOKING_RECIPES.forEach((recipe) => {
      assert.ok(PROVISIONS[recipe.result.itemId], `${recipe.id} result invalid`);
    });
  });
});

describe('createProvisionState', () => {
  it('returns object with activeBuffs as empty array', () => {
    const state = createProvisionState();
    assert.ok(Array.isArray(state.activeBuffs));
    assert.equal(state.activeBuffs.length, 0);
  });

  it('returns object with provisionsUsed as 0', () => {
    const state = createProvisionState();
    assert.equal(state.provisionsUsed, 0);
  });

  it('each call returns a new object', () => {
    const first = createProvisionState();
    const second = createProvisionState();
    assert.notEqual(first, second);
  });
});

describe('useProvision', () => {
  it('successfully uses a provision from inventory', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    const result = useProvision(state, 'travelerBread');
    assert.equal(result.success, true);
  });

  it('returns success:true with message', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    const result = useProvision(state, 'travelerBread');
    assert.equal(result.success, true);
    assert.equal(typeof result.message, 'string');
    assert.ok(result.message.includes('Used'));
  });

  it('reduces inventory count by 1', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 2 }] } });
    useProvision(state, 'travelerBread');
    assert.equal(state.player.inventory[0].quantity, 1);
  });

  it('removes inventory entry when quantity hits zero', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    useProvision(state, 'travelerBread');
    assert.equal(state.player.inventory.length, 0);
  });

  it('adds buff to activeBuffs for duration-based provisions', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    useProvision(state, 'travelerBread');
    assert.equal(state.provisionState.activeBuffs.length, 1);
    assert.equal(state.provisionState.activeBuffs[0].id, 'travelerBread');
  });

  it('applies instant healing for roastedMeat (healInstant:30)', () => {
    const state = baseState();
    state.player.hp = 50;
    state.player.inventory = [{ id: 'roastedMeat', quantity: 1 }];
    useProvision(state, 'roastedMeat');
    assert.equal(state.player.hp, 80);
  });

  it('applies instant MP for herbTea (mpInstant:15)', () => {
    const state = baseState();
    state.player.mp = 20;
    state.player.inventory = [{ id: 'herbTea', quantity: 1 }];
    useProvision(state, 'herbTea');
    assert.equal(state.player.mp, 35);
  });

  it('fails when player does not have the item', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 0 }] } });
    const result = useProvision(state, 'travelerBread');
    assert.equal(result.success, false);
    assert.ok(result.message.includes('do not have'));
  });

  it('fails when provisionId is invalid', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    const result = useProvision(state, 'missingProvision');
    assert.equal(result.success, false);
    assert.ok(result.message.includes('not found'));
  });

  it('fails when no inventory exists', () => {
    const state = baseState({ player: { inventory: null } });
    const result = useProvision(state, 'travelerBread');
    assert.equal(result.success, false);
    assert.ok(result.message.includes('No inventory'));
  });

  it('increments provisionsUsed counter', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    useProvision(state, 'travelerBread');
    assert.equal(state.provisionState.provisionsUsed, 1);
  });

  it('initializes provisionState if missing', () => {
    const state = {
      player: { hp: 50, maxHp: 100, mp: 20, maxMp: 50, level: 5, inventory: [{ id: 'travelerBread', quantity: 1 }] },
    };
    useProvision(state, 'travelerBread');
    assert.ok(state.provisionState);
    assert.equal(state.provisionState.provisionsUsed, 1);
  });
});

describe('tickProvisionBuffs', () => {
  it('applies HP regen from active buffs', () => {
    const state = baseState({
      player: { hp: 40, maxHp: 100 },
      provisionState: { activeBuffs: [{ hpRegen: 5, mpRegen: 0, turnsRemaining: 2, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    tickProvisionBuffs(state);
    assert.equal(state.player.hp, 45);
  });

  it('applies MP regen from active buffs', () => {
    const state = baseState({
      player: { mp: 10, maxMp: 50 },
      provisionState: { activeBuffs: [{ hpRegen: 0, mpRegen: 4, turnsRemaining: 2, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    tickProvisionBuffs(state);
    assert.equal(state.player.mp, 14);
  });

  it('decrements turnsRemaining', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ hpRegen: 1, mpRegen: 0, turnsRemaining: 2, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    tickProvisionBuffs(state);
    assert.equal(state.provisionState.activeBuffs[0].turnsRemaining, 1);
  });

  it('removes expired buffs', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ hpRegen: 1, mpRegen: 0, turnsRemaining: 1, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    tickProvisionBuffs(state);
    assert.equal(state.provisionState.activeBuffs.length, 0);
  });

  it('returns messages about regen', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ hpRegen: 2, mpRegen: 3, turnsRemaining: 2, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    const result = tickProvisionBuffs(state);
    assert.ok(result.messages.some((msg) => msg.includes('Regenerated')));
  });

  it('returns message when buff expires', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ hpRegen: 0, mpRegen: 0, turnsRemaining: 1, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    const result = tickProvisionBuffs(state);
    assert.ok(result.messages.some((msg) => msg.includes('worn off')));
  });

  it('does nothing when no buffs active', () => {
    const state = baseState({ provisionState: { activeBuffs: [], provisionsUsed: 0 } });
    const result = tickProvisionBuffs(state);
    assert.equal(result.messages.length, 0);
  });

  it('does nothing when provisionState is null', () => {
    const state = {
      player: { hp: 50, maxHp: 100, mp: 20, maxMp: 50, level: 5, inventory: [] },
      provisionState: null,
    };
    const result = tickProvisionBuffs(state);
    assert.equal(result.messages.length, 0);
  });

  it('caps HP at maxHp', () => {
    const state = baseState({
      player: { hp: 99, maxHp: 100 },
      provisionState: { activeBuffs: [{ hpRegen: 5, mpRegen: 0, turnsRemaining: 2, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    tickProvisionBuffs(state);
    assert.equal(state.player.hp, 100);
  });

  it('caps MP at maxMp', () => {
    const state = baseState({
      player: { mp: 49, maxMp: 50 },
      provisionState: { activeBuffs: [{ hpRegen: 0, mpRegen: 5, turnsRemaining: 2, id: 'buff', name: 'Buff' }], provisionsUsed: 0 },
    });
    tickProvisionBuffs(state);
    assert.equal(state.player.mp, 50);
  });
});

describe('getProvisionBonuses', () => {
  it('returns zero bonuses when no buffs', () => {
    const state = baseState({ provisionState: { activeBuffs: [], provisionsUsed: 0 } });
    assert.deepEqual(getProvisionBonuses(state), { atkBoost: 0, defBoost: 0, hpRegen: 0, mpRegen: 0 });
  });

  it('aggregates atkBoost from multiple buffs', () => {
    const state = baseState({
      provisionState: {
        activeBuffs: [
          { atkBoost: 2, defBoost: 0, hpRegen: 0, mpRegen: 0 },
          { atkBoost: 3, defBoost: 0, hpRegen: 0, mpRegen: 0 },
        ],
        provisionsUsed: 0,
      },
    });
    assert.equal(getProvisionBonuses(state).atkBoost, 5);
  });

  it('aggregates defBoost from multiple buffs', () => {
    const state = baseState({
      provisionState: {
        activeBuffs: [
          { atkBoost: 0, defBoost: 1, hpRegen: 0, mpRegen: 0 },
          { atkBoost: 0, defBoost: 4, hpRegen: 0, mpRegen: 0 },
        ],
        provisionsUsed: 0,
      },
    });
    assert.equal(getProvisionBonuses(state).defBoost, 5);
  });

  it('handles mixed buffs correctly', () => {
    const state = baseState({
      provisionState: {
        activeBuffs: [
          { atkBoost: 2, defBoost: 1, hpRegen: 1, mpRegen: 0 },
          { atkBoost: 1, defBoost: 0, hpRegen: 0, mpRegen: 3 },
        ],
        provisionsUsed: 0,
      },
    });
    assert.deepEqual(getProvisionBonuses(state), { atkBoost: 3, defBoost: 1, hpRegen: 1, mpRegen: 3 });
  });
});

describe('hasActiveBuff', () => {
  it('returns false when no buffs', () => {
    const state = baseState({ provisionState: { activeBuffs: [], provisionsUsed: 0 } });
    assert.equal(hasActiveBuff(state, 'travelerBread'), false);
  });

  it('returns true when buff is active', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ id: 'travelerBread' }], provisionsUsed: 0 },
    });
    assert.equal(hasActiveBuff(state, 'travelerBread'), true);
  });

  it('returns false for inactive buff', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ id: 'travelerBread' }], provisionsUsed: 0 },
    });
    assert.equal(hasActiveBuff(state, 'wardensMeal'), false);
  });
});

describe('clearAllBuffs', () => {
  it('removes all active buffs', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ id: 'travelerBread' }], provisionsUsed: 0 },
    });
    clearAllBuffs(state);
    assert.equal(state.provisionState.activeBuffs.length, 0);
  });

  it('initializes provisionState if missing', () => {
    const state = { player: { hp: 50, maxHp: 100, mp: 20, maxMp: 50, level: 5, inventory: [] } };
    clearAllBuffs(state);
    assert.ok(state.provisionState);
    assert.equal(state.provisionState.activeBuffs.length, 0);
  });

  it('returns state with empty activeBuffs', () => {
    const state = baseState({
      provisionState: { activeBuffs: [{ id: 'travelerBread' }], provisionsUsed: 2 },
    });
    const result = clearAllBuffs(state);
    assert.equal(result.provisionState.activeBuffs.length, 0);
  });
});

describe('getProvisionById', () => {
  it('returns provision for valid ID', () => {
    const provision = getProvisionById('travelerBread');
    assert.ok(provision);
    assert.equal(provision.id, 'travelerBread');
  });

  it('returns null for invalid ID', () => {
    assert.equal(getProvisionById('missingProvision'), null);
  });
});

describe('canUseProvision', () => {
  it('returns canUse:true when player has item', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    const result = canUseProvision(state, 'travelerBread');
    assert.equal(result.canUse, true);
  });

  it('returns canUse:false when item not in inventory', () => {
    const state = baseState({ player: { inventory: [] } });
    const result = canUseProvision(state, 'travelerBread');
    assert.equal(result.canUse, false);
    assert.ok(result.reason.includes('do not have'));
  });

  it('returns canUse:false for invalid provision ID', () => {
    const state = baseState({ player: { inventory: [{ id: 'travelerBread', quantity: 1 }] } });
    const result = canUseProvision(state, 'missingProvision');
    assert.equal(result.canUse, false);
    assert.ok(result.reason.includes('not found'));
  });

  it('returns canUse:false when no inventory', () => {
    const state = baseState({ player: { inventory: null } });
    const result = canUseProvision(state, 'travelerBread');
    assert.equal(result.canUse, false);
    assert.ok(result.reason.includes('No inventory'));
  });
});
