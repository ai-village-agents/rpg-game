/**
 * Item Durability System
 * Manages equipment degradation, repair, and maintenance
 */

// Durability status thresholds
export const DURABILITY_STATUS = {
  PRISTINE: { id: 'pristine', name: 'Pristine', minPercent: 90, color: '#4CAF50', statMod: 1.0 },
  GOOD: { id: 'good', name: 'Good', minPercent: 60, color: '#8BC34A', statMod: 1.0 },
  WORN: { id: 'worn', name: 'Worn', minPercent: 30, color: '#FFC107', statMod: 0.9 },
  DAMAGED: { id: 'damaged', name: 'Damaged', minPercent: 10, color: '#FF9800', statMod: 0.75 },
  BROKEN: { id: 'broken', name: 'Broken', minPercent: 0, color: '#F44336', statMod: 0 }
};

// Equipment slot durability rates
export const SLOT_DURABILITY_RATES = {
  weapon: { lossPerUse: 1, lossPerHit: 0.5, combatOnly: false },
  helmet: { lossPerUse: 0.3, lossPerHit: 0.8, combatOnly: true },
  chest: { lossPerUse: 0.3, lossPerHit: 1.0, combatOnly: true },
  legs: { lossPerUse: 0.3, lossPerHit: 0.6, combatOnly: true },
  boots: { lossPerUse: 0.2, lossPerHit: 0.4, combatOnly: false },
  gloves: { lossPerUse: 0.4, lossPerHit: 0.5, combatOnly: false },
  shield: { lossPerUse: 0.2, lossPerHit: 1.5, combatOnly: true },
  accessory: { lossPerUse: 0.1, lossPerHit: 0.1, combatOnly: false },
  ring: { lossPerUse: 0.05, lossPerHit: 0.05, combatOnly: false },
  necklace: { lossPerUse: 0.05, lossPerHit: 0.05, combatOnly: false },
  tool: { lossPerUse: 0.5, lossPerHit: 0, combatOnly: false }
};

// Material durability multipliers
export const MATERIAL_DURABILITY = {
  cloth: { maxDurability: 50, repairCostMod: 0.5, degradeRate: 1.5 },
  leather: { maxDurability: 80, repairCostMod: 0.7, degradeRate: 1.2 },
  chainmail: { maxDurability: 120, repairCostMod: 1.0, degradeRate: 1.0 },
  plate: { maxDurability: 150, repairCostMod: 1.3, degradeRate: 0.8 },
  wood: { maxDurability: 60, repairCostMod: 0.4, degradeRate: 1.3 },
  iron: { maxDurability: 100, repairCostMod: 0.8, degradeRate: 1.0 },
  steel: { maxDurability: 130, repairCostMod: 1.0, degradeRate: 0.9 },
  mythril: { maxDurability: 180, repairCostMod: 1.5, degradeRate: 0.6 },
  dragonscale: { maxDurability: 200, repairCostMod: 2.0, degradeRate: 0.5 },
  crystal: { maxDurability: 40, repairCostMod: 2.5, degradeRate: 2.0 }
};

// Repair item definitions
export const REPAIR_ITEMS = {
  repair_kit_basic: {
    id: 'repair_kit_basic',
    name: 'Basic Repair Kit',
    repairAmount: 25,
    maxQuality: 'uncommon',
    cost: 50
  },
  repair_kit_advanced: {
    id: 'repair_kit_advanced',
    name: 'Advanced Repair Kit',
    repairAmount: 50,
    maxQuality: 'rare',
    cost: 150
  },
  repair_kit_master: {
    id: 'repair_kit_master',
    name: 'Master Repair Kit',
    repairAmount: 100,
    maxQuality: 'legendary',
    cost: 400
  },
  repair_powder: {
    id: 'repair_powder',
    name: 'Repair Powder',
    repairAmount: 10,
    maxQuality: 'common',
    cost: 15
  },
  indestructible_oil: {
    id: 'indestructible_oil',
    name: 'Indestructible Oil',
    repairAmount: 0,
    maxQuality: 'legendary',
    temporaryInvulnerable: true,
    duration: 300000, // 5 minutes
    cost: 500
  }
};

/**
 * Initialize durability state
 */
export function initDurabilityState() {
  return {
    itemDurabilities: {}, // itemId -> { current, max }
    temporaryProtections: {}, // itemId -> { expiresAt }
    repairHistory: [],
    totalRepairCost: 0,
    itemsDestroyed: 0,
    durabilitySettings: {
      enabled: true,
      showWarnings: true,
      warningThreshold: 20,
      autoRepairThreshold: 0 // 0 = disabled
    }
  };
}

/**
 * Get durability state from game state
 */
export function getDurabilityState(state) {
  return state.durability || initDurabilityState();
}

/**
 * Calculate max durability for an item
 */
export function calculateMaxDurability(item) {
  const material = item.material || 'iron';
  const materialData = MATERIAL_DURABILITY[material] || MATERIAL_DURABILITY.iron;
  const qualityMultiplier = getQualityMultiplier(item.quality || 'common');
  return Math.floor(materialData.maxDurability * qualityMultiplier);
}

/**
 * Get quality durability multiplier
 */
export function getQualityMultiplier(quality) {
  const multipliers = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 1.8,
    legendary: 2.2
  };
  return multipliers[quality] || 1.0;
}

/**
 * Initialize durability for an item
 */
export function initItemDurability(state, itemId, item) {
  const durabilityState = getDurabilityState(state);

  if (durabilityState.itemDurabilities[itemId]) {
    return { state, initialized: false, error: 'Durability already initialized' };
  }

  const maxDurability = calculateMaxDurability(item);

  return {
    state: {
      ...state,
      durability: {
        ...durabilityState,
        itemDurabilities: {
          ...durabilityState.itemDurabilities,
          [itemId]: {
            current: maxDurability,
            max: maxDurability
          }
        }
      }
    },
    initialized: true,
    maxDurability
  };
}

/**
 * Get current durability for an item
 */
export function getItemDurability(state, itemId) {
  const durabilityState = getDurabilityState(state);
  return durabilityState.itemDurabilities[itemId] || null;
}

/**
 * Get durability status for an item
 */
export function getDurabilityStatus(state, itemId) {
  const durability = getItemDurability(state, itemId);
  if (!durability) {
    return { status: null, percent: 0 };
  }

  const percent = (durability.current / durability.max) * 100;

  for (const status of Object.values(DURABILITY_STATUS)) {
    if (percent >= status.minPercent) {
      return { status, percent };
    }
  }

  return { status: DURABILITY_STATUS.BROKEN, percent: 0 };
}

/**
 * Get stat modifier based on durability
 */
export function getDurabilityStatModifier(state, itemId) {
  const { status } = getDurabilityStatus(state, itemId);
  return status ? status.statMod : 0;
}

/**
 * Check if item is broken
 */
export function isItemBroken(state, itemId) {
  const durability = getItemDurability(state, itemId);
  if (!durability) return false;
  return durability.current <= 0;
}

/**
 * Check if item has temporary protection
 */
export function hasTemporaryProtection(state, itemId) {
  const durabilityState = getDurabilityState(state);
  const protection = durabilityState.temporaryProtections[itemId];
  if (!protection) return false;
  return Date.now() < protection.expiresAt;
}

/**
 * Reduce durability on an item
 */
export function reduceDurability(state, itemId, amount, options = {}) {
  const durabilityState = getDurabilityState(state);
  const durability = durabilityState.itemDurabilities[itemId];

  if (!durability) {
    return { state, reduced: false, error: 'Item has no durability data' };
  }

  // Check temporary protection
  if (hasTemporaryProtection(state, itemId)) {
    return { state, reduced: false, protected: true };
  }

  // Check if durability system is enabled
  if (!durabilityState.durabilitySettings.enabled) {
    return { state, reduced: false, disabled: true };
  }

  const newCurrent = Math.max(0, durability.current - amount);
  const wasBroken = durability.current <= 0;
  const nowBroken = newCurrent <= 0;
  const justBroke = !wasBroken && nowBroken;

  let newItemsDestroyed = durabilityState.itemsDestroyed;
  if (justBroke) {
    newItemsDestroyed++;
  }

  return {
    state: {
      ...state,
      durability: {
        ...durabilityState,
        itemDurabilities: {
          ...durabilityState.itemDurabilities,
          [itemId]: {
            ...durability,
            current: newCurrent
          }
        },
        itemsDestroyed: newItemsDestroyed
      }
    },
    reduced: true,
    newDurability: newCurrent,
    justBroke,
    previousDurability: durability.current
  };
}

/**
 * Process durability loss from combat
 */
export function processCombatDurabilityLoss(state, equippedItems, options = {}) {
  const { wasHit = false, usedWeapon = true, usedShield = false } = options;

  let currentState = state;
  const damages = [];

  for (const [slot, itemId] of Object.entries(equippedItems)) {
    if (!itemId) continue;

    const slotData = SLOT_DURABILITY_RATES[slot];
    if (!slotData) continue;

    let loss = 0;

    // Base loss per combat action
    if (!slotData.combatOnly || wasHit || usedWeapon || usedShield) {
      loss += slotData.lossPerUse;
    }

    // Additional loss if hit
    if (wasHit) {
      loss += slotData.lossPerHit;
    }

    // Weapon gets extra wear if used
    if (slot === 'weapon' && usedWeapon) {
      loss += slotData.lossPerUse;
    }

    // Shield gets extra wear if blocking
    if (slot === 'shield' && usedShield) {
      loss += slotData.lossPerHit;
    }

    if (loss > 0) {
      const result = reduceDurability(currentState, itemId, loss);
      currentState = result.state;
      if (result.reduced) {
        damages.push({
          slot,
          itemId,
          loss,
          newDurability: result.newDurability,
          justBroke: result.justBroke
        });
      }
    }
  }

  return {
    state: currentState,
    damages,
    itemsBroken: damages.filter(d => d.justBroke).length
  };
}

/**
 * Process durability loss from tool use
 */
export function processToolDurabilityLoss(state, toolId, item) {
  const material = item.material || 'iron';
  const materialData = MATERIAL_DURABILITY[material] || MATERIAL_DURABILITY.iron;
  const slotData = SLOT_DURABILITY_RATES.tool;

  const loss = slotData.lossPerUse * materialData.degradeRate;

  return reduceDurability(state, toolId, loss);
}

/**
 * Repair an item
 */
export function repairItem(state, itemId, amount, options = {}) {
  const { cost = 0, source = 'manual' } = options;

  const durabilityState = getDurabilityState(state);
  const durability = durabilityState.itemDurabilities[itemId];

  if (!durability) {
    return { state, repaired: false, error: 'Item has no durability data' };
  }

  if (durability.current >= durability.max) {
    return { state, repaired: false, error: 'Item is already at full durability' };
  }

  const newCurrent = Math.min(durability.max, durability.current + amount);
  const actualRepair = newCurrent - durability.current;

  const repairEntry = {
    itemId,
    amount: actualRepair,
    cost,
    source,
    timestamp: Date.now()
  };

  return {
    state: {
      ...state,
      durability: {
        ...durabilityState,
        itemDurabilities: {
          ...durabilityState.itemDurabilities,
          [itemId]: {
            ...durability,
            current: newCurrent
          }
        },
        repairHistory: [...durabilityState.repairHistory.slice(-99), repairEntry],
        totalRepairCost: durabilityState.totalRepairCost + cost
      }
    },
    repaired: true,
    amountRepaired: actualRepair,
    newDurability: newCurrent,
    cost
  };
}

/**
 * Fully repair an item
 */
export function fullyRepairItem(state, itemId, item, options = {}) {
  const durability = getItemDurability(state, itemId);
  if (!durability) {
    return { state, repaired: false, error: 'Item has no durability data' };
  }

  const repairAmount = durability.max - durability.current;
  if (repairAmount <= 0) {
    return { state, repaired: false, error: 'Item is already at full durability' };
  }

  const cost = calculateRepairCost(item, repairAmount);

  // Check if player has enough gold
  const playerGold = state.player?.gold || 0;
  if (playerGold < cost) {
    return { state, repaired: false, error: 'Not enough gold' };
  }

  const repairResult = repairItem(state, itemId, repairAmount, { cost, source: 'full_repair' });

  if (repairResult.repaired) {
    return {
      ...repairResult,
      state: {
        ...repairResult.state,
        player: {
          ...repairResult.state.player,
          gold: playerGold - cost
        }
      }
    };
  }

  return repairResult;
}

/**
 * Calculate repair cost
 */
export function calculateRepairCost(item, repairAmount) {
  const material = item.material || 'iron';
  const materialData = MATERIAL_DURABILITY[material] || MATERIAL_DURABILITY.iron;
  const itemLevel = item.level || 1;
  const baseCost = repairAmount * materialData.repairCostMod;
  const levelMultiplier = 1 + (itemLevel * 0.1);
  return Math.ceil(baseCost * levelMultiplier);
}

/**
 * Use a repair item
 */
export function useRepairItem(state, repairItemId, targetItemId, item) {
  const repairItemData = REPAIR_ITEMS[repairItemId];
  if (!repairItemData) {
    return { state, used: false, error: 'Invalid repair item' };
  }

  const durability = getItemDurability(state, targetItemId);
  if (!durability) {
    return { state, used: false, error: 'Target item has no durability data' };
  }

  // Check quality restriction
  const itemQuality = item.quality || 'common';
  const qualityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const maxQualityIndex = qualityOrder.indexOf(repairItemData.maxQuality);
  const itemQualityIndex = qualityOrder.indexOf(itemQuality);

  if (itemQualityIndex > maxQualityIndex) {
    return { state, used: false, error: 'Repair item cannot repair this quality' };
  }

  // Handle temporary invulnerability
  if (repairItemData.temporaryInvulnerable) {
    const durabilityState = getDurabilityState(state);
    return {
      state: {
        ...state,
        durability: {
          ...durabilityState,
          temporaryProtections: {
            ...durabilityState.temporaryProtections,
            [targetItemId]: {
              expiresAt: Date.now() + repairItemData.duration
            }
          }
        }
      },
      used: true,
      protected: true,
      duration: repairItemData.duration
    };
  }

  // Regular repair
  return repairItem(state, targetItemId, repairItemData.repairAmount, {
    cost: 0,
    source: repairItemId
  });
}

/**
 * Repair all equipped items
 */
export function repairAllEquipped(state, equippedItems, itemsData) {
  let currentState = state;
  let totalCost = 0;
  const repaired = [];

  for (const [slot, itemId] of Object.entries(equippedItems)) {
    if (!itemId) continue;

    const item = itemsData[itemId];
    if (!item) continue;

    const durability = getItemDurability(currentState, itemId);
    if (!durability) continue;
    if (durability.current >= durability.max) continue;

    const repairAmount = durability.max - durability.current;
    const cost = calculateRepairCost(item, repairAmount);

    const playerGold = currentState.player?.gold || 0;
    if (playerGold < cost) continue;

    const result = fullyRepairItem(currentState, itemId, item);
    if (result.repaired) {
      currentState = result.state;
      totalCost += cost;
      repaired.push({ slot, itemId, cost, amountRepaired: result.amountRepaired });
    }
  }

  return {
    state: currentState,
    totalCost,
    itemsRepaired: repaired.length,
    repaired
  };
}

/**
 * Get items that need repair
 */
export function getItemsNeedingRepair(state, equippedItems, threshold = 100) {
  const needsRepair = [];

  for (const [slot, itemId] of Object.entries(equippedItems)) {
    if (!itemId) continue;

    const { status, percent } = getDurabilityStatus(state, itemId);
    if (!status) continue;

    if (percent < threshold) {
      needsRepair.push({
        slot,
        itemId,
        percent,
        status,
        urgent: percent < 20
      });
    }
  }

  return needsRepair.sort((a, b) => a.percent - b.percent);
}

/**
 * Get durability warnings
 */
export function getDurabilityWarnings(state, equippedItems) {
  const durabilityState = getDurabilityState(state);
  const threshold = durabilityState.durabilitySettings.warningThreshold;

  if (!durabilityState.durabilitySettings.showWarnings) {
    return [];
  }

  return getItemsNeedingRepair(state, equippedItems, threshold);
}

/**
 * Update durability settings
 */
export function updateDurabilitySettings(state, settings) {
  const durabilityState = getDurabilityState(state);

  return {
    state: {
      ...state,
      durability: {
        ...durabilityState,
        durabilitySettings: {
          ...durabilityState.durabilitySettings,
          ...settings
        }
      }
    },
    updated: true
  };
}

/**
 * Get durability statistics
 */
export function getDurabilityStats(state) {
  const durabilityState = getDurabilityState(state);

  const itemCount = Object.keys(durabilityState.itemDurabilities).length;
  const brokenCount = Object.entries(durabilityState.itemDurabilities)
    .filter(([_, d]) => d.current <= 0).length;

  const totalMaxDurability = Object.values(durabilityState.itemDurabilities)
    .reduce((sum, d) => sum + d.max, 0);
  const totalCurrentDurability = Object.values(durabilityState.itemDurabilities)
    .reduce((sum, d) => sum + d.current, 0);

  const averagePercent = itemCount > 0
    ? (totalCurrentDurability / totalMaxDurability) * 100
    : 100;

  return {
    itemCount,
    brokenCount,
    averagePercent,
    totalRepairCost: durabilityState.totalRepairCost,
    itemsDestroyed: durabilityState.itemsDestroyed,
    recentRepairs: durabilityState.repairHistory.slice(-10)
  };
}

/**
 * Clean up expired temporary protections
 */
export function cleanupExpiredProtections(state) {
  const durabilityState = getDurabilityState(state);
  const now = Date.now();

  const newProtections = {};
  let cleaned = 0;

  for (const [itemId, protection] of Object.entries(durabilityState.temporaryProtections)) {
    if (protection.expiresAt > now) {
      newProtections[itemId] = protection;
    } else {
      cleaned++;
    }
  }

  return {
    state: {
      ...state,
      durability: {
        ...durabilityState,
        temporaryProtections: newProtections
      }
    },
    cleaned
  };
}

/**
 * Remove durability data for an item
 */
export function removeItemDurability(state, itemId) {
  const durabilityState = getDurabilityState(state);

  const newDurabilities = { ...durabilityState.itemDurabilities };
  delete newDurabilities[itemId];

  const newProtections = { ...durabilityState.temporaryProtections };
  delete newProtections[itemId];

  return {
    state: {
      ...state,
      durability: {
        ...durabilityState,
        itemDurabilities: newDurabilities,
        temporaryProtections: newProtections
      }
    },
    removed: true
  };
}
