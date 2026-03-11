export const PROVISIONS = {
  travelerBread: {
    id: "travelerBread",
    name: "Traveler's Bread",
    type: "provision",
    category: "food",
    rarity: "Common",
    description: "A crusty trail loaf that steadies the stomach and mends small wounds over time.",
    value: 10,
    effect: { hpRegen: 2, duration: 5 }
  },
  heartyStew: {
    id: "heartyStew",
    name: "Hearty Stew",
    type: "provision",
    category: "food",
    rarity: "Uncommon",
    description: "A thick caravan stew that fortifies muscle and resolve for a long march.",
    value: 25,
    effect: { atkBoost: 3, defBoost: 2, duration: 8 }
  },
  roastedMeat: {
    id: "roastedMeat",
    name: "Roasted Meat",
    type: "provision",
    category: "food",
    rarity: "Common",
    description: "Flame-seared cuts that restore vigor immediately and keep strength flowing.",
    value: 18,
    effect: { healInstant: 30, hpRegen: 1, duration: 3 }
  },
  herbTea: {
    id: "herbTea",
    name: "Herb Tea",
    type: "provision",
    category: "drink",
    rarity: "Common",
    description: "A fragrant brew that clears the mind and renews arcane focus.",
    value: 15,
    effect: { mpInstant: 15, mpRegen: 2, duration: 4 }
  },
  ironRation: {
    id: "ironRation",
    name: "Iron Ration",
    type: "provision",
    category: "food",
    rarity: "Uncommon",
    description: "A salted war ration that hardens the body and sustains slow healing.",
    value: 35,
    effect: { atkBoost: 2, defBoost: 2, hpRegen: 1, duration: 10 }
  },
  dragonPepper: {
    id: "dragonPepper",
    name: "Dragon Pepper Soup",
    type: "provision",
    category: "food",
    rarity: "Rare",
    description: "A searing crimson soup that ignites fierce strength for a few turns.",
    value: 50,
    effect: { atkBoost: 5, duration: 6 }
  },
  frostBerry: {
    id: "frostBerry",
    name: "Frost Berry Tart",
    type: "provision",
    category: "food",
    rarity: "Rare",
    description: "A chilled tart whose sweet frost hardens defenses against harm.",
    value: 50,
    effect: { defBoost: 5, duration: 6 }
  },
  wardensMeal: {
    id: "wardensMeal",
    name: "Warden's Feast",
    type: "provision",
    category: "food",
    rarity: "Epic",
    description: "A guardian's banquet that grants stalwart power and deep restoration.",
    value: 100,
    effect: { atkBoost: 4, defBoost: 4, hpRegen: 3, mpRegen: 2, duration: 12 }
  },
  fieldMushroom: {
    id: "fieldMushroom",
    name: "Field Mushroom",
    type: "provision",
    category: "food",
    rarity: "Common",
    description: "A hardy wildcap that quickly closes minor wounds.",
    value: 8,
    effect: { healInstant: 15 }
  },
  spicedCider: {
    id: "spicedCider",
    name: "Spiced Cider",
    type: "provision",
    category: "drink",
    rarity: "Uncommon",
    description: "A warm cider with ember spices that lifts willpower and battle focus.",
    value: 22,
    effect: { atkBoost: 2, mpInstant: 10, duration: 5 }
  }
};

export const COOKING_RECIPES = [
  {
    id: "cookHeartyStew",
    name: "Cook Hearty Stew",
    description: "Simmer herbs with a hearty base to craft a fortifying stew.",
    ingredients: [
      { itemId: "herbBundle", quantity: 2 },
      { itemId: "roastedMeat", quantity: 1 }
    ],
    result: { itemId: "heartyStew", quantity: 1 },
    requiredLevel: 2
  },
  {
    id: "cookDragonPepper",
    name: "Cook Dragon Pepper Soup",
    description: "Blend dragon spice with herbs for a fiery, strength-granting soup.",
    ingredients: [
      { itemId: "dragonScale", quantity: 1 },
      { itemId: "herbBundle", quantity: 2 }
    ],
    result: { itemId: "dragonPepper", quantity: 1 },
    requiredLevel: 4
  },
  {
    id: "cookWardensMeal",
    name: "Cook Warden's Feast",
    description: "Combine rare dishes into a guardian's feast of enduring power.",
    ingredients: [
      { itemId: "heartyStew", quantity: 1 },
      { itemId: "dragonPepper", quantity: 1 },
      { itemId: "frostBerry", quantity: 1 }
    ],
    result: { itemId: "wardensMeal", quantity: 1 },
    requiredLevel: 6
  },
  {
    id: "cookFrostBerry",
    name: "Cook Frost Berry Tart",
    description: "Bake enchanted berries into a tart that bolsters defense.",
    ingredients: [
      { itemId: "herbBundle", quantity: 2 },
      { itemId: "arcaneEssence", quantity: 1 }
    ],
    result: { itemId: "frostBerry", quantity: 1 },
    requiredLevel: 3
  }
];

export function createProvisionState() {
  return { activeBuffs: [], provisionsUsed: 0 };
}

function getInventoryItem(state, itemId) {
  return state?.player?.inventory?.find((item) => item.id === itemId) || null;
}

function removeInventoryItem(state, itemId, quantity) {
  const inventory = state.player.inventory;
  const index = inventory.findIndex((item) => item.id === itemId);
  if (index === -1) return false;
  inventory[index].quantity -= quantity;
  if (inventory[index].quantity <= 0) {
    inventory.splice(index, 1);
  }
  return true;
}

function applyInstantEffects(state, effect) {
  const player = state.player;
  const messages = [];
  if (effect.healInstant) {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + effect.healInstant);
    const healed = player.hp - before;
    if (healed > 0) messages.push(`Restored ${healed} HP.`);
  }
  if (effect.mpInstant) {
    const before = player.mp;
    player.mp = Math.min(player.maxMp, player.mp + effect.mpInstant);
    const restored = player.mp - before;
    if (restored > 0) messages.push(`Restored ${restored} MP.`);
  }
  return messages;
}

function addBuff(state, provision) {
  const effect = provision.effect || {};
  if (!effect.duration) return null;
  const buff = {
    id: provision.id,
    name: provision.name,
    turnsRemaining: effect.duration,
    atkBoost: effect.atkBoost || 0,
    defBoost: effect.defBoost || 0,
    hpRegen: effect.hpRegen || 0,
    mpRegen: effect.mpRegen || 0
  };
  state.provisionState.activeBuffs.push(buff);
  return buff;
}

export function useProvision(state, provisionId) {
  const provision = PROVISIONS[provisionId];
  if (!provision) {
    return { success: false, message: "Provision not found.", state };
  }
  if (!state?.player?.inventory) {
    return { success: false, message: "No inventory available.", state };
  }
  if (!state.provisionState) {
    state.provisionState = createProvisionState();
  }
  const inventoryItem = getInventoryItem(state, provisionId);
  if (!inventoryItem || inventoryItem.quantity <= 0) {
    return { success: false, message: "You do not have that provision.", state };
  }

  const instantMessages = applyInstantEffects(state, provision.effect || {});
  const buff = addBuff(state, provision);
  removeInventoryItem(state, provisionId, 1);

  state.provisionState.provisionsUsed += 1;

  let message = `Used ${provision.name}.`;
  if (instantMessages.length > 0) {
    message += ` ${instantMessages.join(" ")}`;
  }
  if (buff) {
    message += ` Buff lasts ${buff.turnsRemaining} turns.`;
  }

  return { success: true, message, state };
}

export function tickProvisionBuffs(state) {
  if (!state?.provisionState?.activeBuffs) {
    return { state, messages: [] };
  }
  const player = state.player;
  const messages = [];
  let totalHpRegen = 0;
  let totalMpRegen = 0;

  for (const buff of state.provisionState.activeBuffs) {
    totalHpRegen += buff.hpRegen || 0;
    totalMpRegen += buff.mpRegen || 0;
  }

  if (totalHpRegen > 0) {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + totalHpRegen);
    const healed = player.hp - before;
    if (healed > 0) messages.push(`Regenerated ${healed} HP from provisions.`);
  }

  if (totalMpRegen > 0) {
    const before = player.mp;
    player.mp = Math.min(player.maxMp, player.mp + totalMpRegen);
    const restored = player.mp - before;
    if (restored > 0) messages.push(`Regenerated ${restored} MP from provisions.`);
  }

  for (const buff of state.provisionState.activeBuffs) {
    buff.turnsRemaining -= 1;
  }

  const remaining = [];
  for (const buff of state.provisionState.activeBuffs) {
    if (buff.turnsRemaining > 0) {
      remaining.push(buff);
    } else {
      messages.push(`${buff.name} has worn off.`);
    }
  }
  state.provisionState.activeBuffs = remaining;

  return { state, messages };
}

export function getProvisionBonuses(state) {
  const bonuses = { atkBoost: 0, defBoost: 0, hpRegen: 0, mpRegen: 0 };
  const buffs = state?.provisionState?.activeBuffs || [];
  for (const buff of buffs) {
    bonuses.atkBoost += buff.atkBoost || 0;
    bonuses.defBoost += buff.defBoost || 0;
    bonuses.hpRegen += buff.hpRegen || 0;
    bonuses.mpRegen += buff.mpRegen || 0;
  }
  return bonuses;
}

export function hasActiveBuff(state, provisionId) {
  const buffs = state?.provisionState?.activeBuffs || [];
  return buffs.some((buff) => buff.id === provisionId);
}

export function clearAllBuffs(state) {
  if (!state.provisionState) {
    state.provisionState = createProvisionState();
    return state;
  }
  state.provisionState.activeBuffs = [];
  return state;
}

export function getProvisionById(id) {
  return PROVISIONS[id] || null;
}

export function canUseProvision(state, provisionId) {
  if (!PROVISIONS[provisionId]) {
    return { canUse: false, reason: "Provision not found." };
  }
  if (!state?.player?.inventory) {
    return { canUse: false, reason: "No inventory available." };
  }
  const inventoryItem = getInventoryItem(state, provisionId);
  if (!inventoryItem || inventoryItem.quantity <= 0) {
    return { canUse: false, reason: "You do not have that provision." };
  }
  return { canUse: true, reason: "" };
}
