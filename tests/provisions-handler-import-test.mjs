// Import test for provisions-handler.js
// Verifies the module loads in Node without DOM dependencies

import assert from 'node:assert';
import { handleProvisionAction, getProvisionBuffSummary } from '../src/handlers/provisions-handler.js';

// 1. Exports exist
assert.strictEqual(typeof handleProvisionAction, 'function', 'handleProvisionAction should be a function');
assert.strictEqual(typeof getProvisionBuffSummary, 'function', 'getProvisionBuffSummary should be a function');

// 2. handleProvisionAction returns null for unknown actions
assert.strictEqual(handleProvisionAction({}, { type: 'UNKNOWN' }), null);
assert.strictEqual(handleProvisionAction({}, null), null);
assert.strictEqual(handleProvisionAction({}, {}), null);

// 3. OPEN_PROVISIONS sets phase to 'provisions'
const baseState = {
  phase: 'exploration',
  player: { level: 1, hp: 50, maxHp: 50, mp: 15, maxMp: 15, inventory: [] },
  log: [],
};
const opened = handleProvisionAction(baseState, { type: 'OPEN_PROVISIONS' });
assert.strictEqual(opened.phase, 'provisions');
assert.strictEqual(opened.previousPhase, 'exploration');
assert.ok(opened.provisionsUI, 'provisionsUI should be set');
assert.strictEqual(opened.provisionsUI.tab, 'use');

// 4. OPEN_PROVISIONS blocked during class-select
const classSelectState = { ...baseState, phase: 'class-select' };
assert.strictEqual(handleProvisionAction(classSelectState, { type: 'OPEN_PROVISIONS' }), null);

// 5. CLOSE_PROVISIONS returns to previous phase
const provisionPhaseState = { ...opened };
const closed = handleProvisionAction(provisionPhaseState, { type: 'CLOSE_PROVISIONS' });
assert.strictEqual(closed.phase, 'exploration');
assert.strictEqual(closed.provisionsUI, undefined);

// 6. PROVISIONS_SELECT selects a provision
const selected = handleProvisionAction(
  { ...opened },
  { type: 'PROVISIONS_SELECT', provisionId: 'travelerBread' }
);
assert.strictEqual(selected.provisionsUI.selectedProvision, 'travelerBread');

// 7. PROVISIONS_SWITCH_TAB changes tab
const switched = handleProvisionAction(
  { ...opened },
  { type: 'PROVISIONS_SWITCH_TAB', tab: 'cook' }
);
assert.strictEqual(switched.provisionsUI.tab, 'cook');

// 8. USE_PROVISION fails when not in inventory
const useResult = handleProvisionAction(
  { ...opened, provisionState: { activeBuffs: [], provisionsUsed: 0 } },
  { type: 'USE_PROVISION', provisionId: 'travelerBread' }
);
assert.ok(useResult.provisionsUI.message, 'Should have error message');

// 9. USE_PROVISION succeeds when provision is in inventory
const stateWithProvision = {
  ...opened,
  player: {
    ...baseState.player,
    inventory: [{ id: 'travelerBread', name: "Traveler's Bread", type: 'provision', quantity: 2 }],
  },
  provisionState: { activeBuffs: [], provisionsUsed: 0 },
};
const useSuccess = handleProvisionAction(stateWithProvision, { type: 'USE_PROVISION', provisionId: 'travelerBread' });
assert.ok(useSuccess, 'Should return updated state');
assert.strictEqual(useSuccess.provisionState.provisionsUsed, 1);
// Quantity should decrease
const breadAfterUse = useSuccess.player.inventory.find(i => i.id === 'travelerBread');
assert.ok(!breadAfterUse || breadAfterUse.quantity === 1, 'Bread quantity should decrease by 1');

// 10. USE_PROVISION with instant heal
const stateWithMushroom = {
  ...opened,
  player: {
    ...baseState.player,
    hp: 30,
    maxHp: 50,
    inventory: [{ id: 'fieldMushroom', name: 'Field Mushroom', type: 'provision', quantity: 1 }],
  },
  provisionState: { activeBuffs: [], provisionsUsed: 0 },
};
const healResult = handleProvisionAction(stateWithMushroom, { type: 'USE_PROVISION', provisionId: 'fieldMushroom' });
assert.ok(healResult.player.hp > 30, 'HP should increase after using Field Mushroom');
assert.ok(healResult.player.hp <= 50, 'HP should not exceed maxHp');

// 11. TICK_PROVISIONS with no provisionState returns null
assert.strictEqual(handleProvisionAction({}, { type: 'TICK_PROVISIONS' }), null);

// 12. TICK_PROVISIONS ticks down buffs
const stateWithBuff = {
  ...baseState,
  provisionState: {
    activeBuffs: [
      { id: 'heartyStew', name: 'Hearty Stew', turnsRemaining: 3, atkBoost: 3, defBoost: 2, hpRegen: 0, mpRegen: 0 },
    ],
    provisionsUsed: 1,
  },
};
const ticked = handleProvisionAction(stateWithBuff, { type: 'TICK_PROVISIONS' });
assert.ok(ticked, 'Should return updated state');
assert.strictEqual(ticked.provisionState.activeBuffs[0].turnsRemaining, 2);

// 13. TICK_PROVISIONS removes expired buffs
const stateExpiring = {
  ...baseState,
  provisionState: {
    activeBuffs: [
      { id: 'heartyStew', name: 'Hearty Stew', turnsRemaining: 1, atkBoost: 3, defBoost: 2, hpRegen: 0, mpRegen: 0 },
    ],
    provisionsUsed: 1,
  },
};
const expired = handleProvisionAction(stateExpiring, { type: 'TICK_PROVISIONS' });
assert.strictEqual(expired.provisionState.activeBuffs.length, 0, 'Expired buff should be removed');

// 14. COOK_PROVISION requires correct phase
const cookOutOfPhase = handleProvisionAction(baseState, { type: 'COOK_PROVISION', recipeId: 'cookHeartyStew' });
assert.strictEqual(cookOutOfPhase, null);

// 15. COOK_PROVISION checks level requirement
const lowLevelCook = handleProvisionAction(
  {
    ...opened,
    player: { ...baseState.player, level: 1, inventory: [] },
  },
  { type: 'COOK_PROVISION', recipeId: 'cookHeartyStew' }
);
assert.ok(lowLevelCook.provisionsUI.message.includes('Requires level'));

// 16. COOK_PROVISION checks missing ingredients
const noIngredientsCook = handleProvisionAction(
  {
    ...opened,
    player: { ...baseState.player, level: 5, inventory: [] },
  },
  { type: 'COOK_PROVISION', recipeId: 'cookHeartyStew' }
);
assert.ok(noIngredientsCook.provisionsUI.message.includes('Missing ingredient'));

// 17. COOK_PROVISION succeeds with all ingredients
const cookState = {
  ...opened,
  player: {
    ...baseState.player,
    level: 5,
    inventory: [
      { id: 'herbBundle', name: 'Herb Bundle', quantity: 3 },
      { id: 'roastedMeat', name: 'Roasted Meat', quantity: 2 },
    ],
  },
};
const cooked = handleProvisionAction(cookState, { type: 'COOK_PROVISION', recipeId: 'cookHeartyStew' });
assert.ok(cooked, 'Should return updated state after cooking');
const herbAfter = cooked.player.inventory.find(i => i.id === 'herbBundle');
assert.strictEqual(herbAfter.quantity, 1, 'herbBundle should decrease by 2');
const meatAfter = cooked.player.inventory.find(i => i.id === 'roastedMeat');
assert.strictEqual(meatAfter.quantity, 1, 'roastedMeat should decrease by 1');
const stewResult = cooked.player.inventory.find(i => i.id === 'heartyStew');
assert.ok(stewResult, 'heartyStew should be added to inventory');
assert.strictEqual(stewResult.quantity, 1);

// 18. getProvisionBuffSummary with no buffs
const emptySummary = getProvisionBuffSummary({});
assert.strictEqual(emptySummary.buffCount, 0);
assert.strictEqual(emptySummary.totalAtk, 0);
assert.strictEqual(emptySummary.totalDef, 0);

// 19. getProvisionBuffSummary with active buffs
const summaryState = {
  provisionState: {
    activeBuffs: [
      { id: 'heartyStew', name: 'Hearty Stew', turnsRemaining: 3, atkBoost: 3, defBoost: 2, hpRegen: 0, mpRegen: 0 },
      { id: 'dragonPepper', name: 'Dragon Pepper Soup', turnsRemaining: 5, atkBoost: 5, defBoost: 0, hpRegen: 0, mpRegen: 0 },
    ],
  },
};
const summary = getProvisionBuffSummary(summaryState);
assert.strictEqual(summary.buffCount, 2);
assert.strictEqual(summary.totalAtk, 8);
assert.strictEqual(summary.totalDef, 2);
assert.deepStrictEqual(summary.buffNames, ['Hearty Stew', 'Dragon Pepper Soup']);

// 20. USE_PROVISION with no provisionId returns null
assert.strictEqual(handleProvisionAction(opened, { type: 'USE_PROVISION' }), null);

console.log('provisions-handler-import-test: All 20 tests passed ✅');
