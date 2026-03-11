import {
  useProvision,
  tickProvisionBuffs,
  getProvisionBonuses,
  canUseProvision,
  createProvisionState,
  PROVISIONS,
  COOKING_RECIPES,
} from '../provisions.js';
import { pushLog } from '../state.js';

/**
 * Handle provision-related actions.
 * @param {object} state - Current game state
 * @param {object} action - Action to handle
 * @returns {object|null} Updated state, or null if action not handled
 */
export function handleProvisionAction(state, action) {
  if (!action || !action.type) return null;
  const isPreAdventure = state.phase === 'class-select' || state.phase === 'background-select';

  if (action.type === 'OPEN_PROVISIONS') {
    if (isPreAdventure) return null;
    return {
      ...state,
      phase: 'provisions',
      previousPhase: state.phase,
      provisionsUI: { selectedProvision: null, message: null, tab: 'use' },
    };
  }

  if (action.type === 'CLOSE_PROVISIONS') {
    if (state.phase !== 'provisions') return null;
    const returnPhase = state.previousPhase || 'exploration';
    return { ...state, phase: returnPhase, provisionsUI: undefined };
  }

  if (action.type === 'PROVISIONS_SELECT') {
    if (state.phase !== 'provisions') return null;
    return {
      ...state,
      provisionsUI: {
        ...state.provisionsUI,
        selectedProvision: action.provisionId || null,
        message: null,
      },
    };
  }

  if (action.type === 'PROVISIONS_SWITCH_TAB') {
    if (state.phase !== 'provisions') return null;
    return {
      ...state,
      provisionsUI: {
        ...state.provisionsUI,
        tab: action.tab || 'use',
        selectedProvision: null,
        message: null,
      },
    };
  }

  if (action.type === 'USE_PROVISION') {
    if (!action.provisionId) return null;

    if (!state.provisionState) {
      state = { ...state, provisionState: createProvisionState() };
    }

    const check = canUseProvision(state, action.provisionId);
    if (!check.canUse) {
      if (state.phase === 'provisions') {
        return {
          ...state,
          provisionsUI: { ...state.provisionsUI, message: check.reason },
        };
      }
      return pushLog(state, check.reason);
    }

    const result = useProvision(state, action.provisionId);
    if (!result.success) {
      if (state.phase === 'provisions') {
        return {
          ...result.state,
          provisionsUI: { ...state.provisionsUI, message: result.message },
        };
      }
      return pushLog(result.state, result.message);
    }

    let next = result.state;
    if (state.phase === 'provisions') {
      next = {
        ...next,
        provisionsUI: {
          ...state.provisionsUI,
          message: result.message,
          selectedProvision: null,
        },
      };
    }
    return pushLog(next, result.message);
  }

  if (action.type === 'TICK_PROVISIONS') {
    if (!state.provisionState) return null;
    const result = tickProvisionBuffs(state);
    let next = result.state;
    for (const msg of result.messages) {
      next = pushLog(next, msg);
    }
    return next;
  }

  if (action.type === 'COOK_PROVISION') {
    if (state.phase !== 'provisions') return null;
    const recipeId = action.recipeId;
    if (!recipeId) return null;

    const recipe = COOKING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) {
      return {
        ...state,
        provisionsUI: { ...state.provisionsUI, message: 'Recipe not found.' },
      };
    }

    if (state.player.level < recipe.requiredLevel) {
      return {
        ...state,
        provisionsUI: {
          ...state.provisionsUI,
          message: `Requires level ${recipe.requiredLevel}. You are level ${state.player.level}.`,
        },
      };
    }

    const inventory = state.player.inventory || [];
    for (const ingredient of recipe.ingredients) {
      const item = inventory.find((i) => i.id === ingredient.itemId);
      if (!item || item.quantity < ingredient.quantity) {
        return {
          ...state,
          provisionsUI: {
            ...state.provisionsUI,
            message: `Missing ingredient: ${ingredient.itemId} (need ${ingredient.quantity}).`,
          },
        };
      }
    }

    let newInventory = inventory.map((i) => ({ ...i }));
    for (const ingredient of recipe.ingredients) {
      const idx = newInventory.findIndex((i) => i.id === ingredient.itemId);
      if (idx !== -1) {
        newInventory[idx].quantity -= ingredient.quantity;
        if (newInventory[idx].quantity <= 0) {
          newInventory.splice(idx, 1);
        }
      }
    }

    const existingResult = newInventory.find((i) => i.id === recipe.result.itemId);
    if (existingResult) {
      existingResult.quantity += recipe.result.quantity;
    } else {
      const provisionData = PROVISIONS[recipe.result.itemId];
      newInventory.push({
        id: recipe.result.itemId,
        name: provisionData ? provisionData.name : recipe.result.itemId,
        type: 'provision',
        quantity: recipe.result.quantity,
      });
    }

    const msg = `Cooked ${recipe.name}! Received ${recipe.result.quantity}x ${recipe.result.itemId}.`;
    let next = {
      ...state,
      player: { ...state.player, inventory: newInventory },
      provisionsUI: { ...state.provisionsUI, message: msg },
    };
    return pushLog(next, msg);
  }

  return null;
}

/**
 * Get summary of active provision buffs for display in combat/exploration.
 * @param {object} state - Current game state
 * @returns {{ totalAtk: number, totalDef: number, buffCount: number, buffNames: string[] }}
 */
export function getProvisionBuffSummary(state) {
  const bonuses = getProvisionBonuses(state);
  const buffs = state?.provisionState?.activeBuffs || [];
  return {
    totalAtk: bonuses.atkBoost,
    totalDef: bonuses.defBoost,
    totalHpRegen: bonuses.hpRegen,
    totalMpRegen: bonuses.mpRegen,
    buffCount: buffs.length,
    buffNames: buffs.map((b) => b.name),
  };
}
