const VALID_SLOTS = ['weapon', 'armor', 'accessory'];

export const ENCHANTMENTS = {
  sharpening: {
    id: 'sharpening',
    name: 'Sharpening',
    description: 'Hone a weapon to strike with greater force.',
    requiredLevel: 1,
    targetSlots: ['weapon'],
    cost: { arcaneEssence: 1 },
    statBonuses: { atk: 3 },
  },
  fortification: {
    id: 'fortification',
    name: 'Fortification',
    description: 'Reinforce armor with dense threading.',
    requiredLevel: 2,
    targetSlots: ['armor'],
    cost: { enchantedThread: 1 },
    statBonuses: { def: 4 },
  },
  swiftness: {
    id: 'swiftness',
    name: 'Swiftness',
    description: 'Lightweight enchantment that improves mobility.',
    requiredLevel: 2,
    targetSlots: ['any'],
    cost: { crystalLens: 1 },
    statBonuses: { spd: 2 },
  },
  arcaneInfusion: {
    id: 'arcaneInfusion',
    name: 'Arcane Infusion',
    description: 'Infuse gear with raw arcane power.',
    requiredLevel: 3,
    targetSlots: ['any'],
    cost: { arcaneEssence: 2 },
    statBonuses: { int: 5, maxMp: 10 },
  },
  shadowEdge: {
    id: 'shadowEdge',
    name: 'Shadow Edge',
    description: 'A blade etched with lingering dusk energy.',
    requiredLevel: 4,
    targetSlots: ['weapon'],
    cost: { shadowShard: 1, ironOre: 1 },
    statBonuses: { atk: 5, spd: 2 },
    specialEffect: 'Critical strikes briefly increase movement speed.',
  },
  dragonhide: {
    id: 'dragonhide',
    name: 'Dragonhide',
    description: 'Fortify armor with legendary scales.',
    requiredLevel: 5,
    targetSlots: ['armor'],
    cost: { dragonScale: 1 },
    statBonuses: { def: 6 },
    specialEffect: 'Reduces incoming elemental damage by a small amount.',
  },
  runicEdge: {
    id: 'runicEdge',
    name: 'Runic Edge',
    description: 'Runes channel both might and intellect.',
    requiredLevel: 7,
    targetSlots: ['weapon'],
    cost: { ancientRune: 1, arcaneEssence: 2 },
    statBonuses: { atk: 8, int: 5 },
  },
  ancientWard: {
    id: 'ancientWard',
    name: 'Ancient Ward',
    description: 'Ward an item with enduring protective glyphs.',
    requiredLevel: 6,
    targetSlots: ['any'],
    cost: { ancientRune: 1 },
    statBonuses: { def: 8, maxHp: 5 },
  },
  phoenixBlessing: {
    id: 'phoenixBlessing',
    name: 'Phoenix Blessing',
    description: 'A resilient blessing that bolsters vitality.',
    requiredLevel: 8,
    targetSlots: ['any'],
    cost: { phoenixFeather: 1 },
    statBonuses: { maxHp: 10 },
    specialEffect: 'Once per battle, restore a small amount of health when low.',
  },
  shadowCloak: {
    id: 'shadowCloak',
    name: 'Shadow Cloak',
    description: 'A veil of shadow energy that enhances agility and fortune.',
    requiredLevel: 6,
    targetSlots: ['accessory'],
    cost: { shadowShard: 2 },
    statBonuses: { spd: 5, lck: 5 },
  },
};

export function createEnchantingState() {
  return {
    enchantedSlots: {
      weapon: null,
      armor: null,
      accessory: null,
    },
  };
}

export function ensureEnchantingState(state) {
  if (!state.enchantingState) {
    state.enchantingState = createEnchantingState();
    return state;
  }
  if (!state.enchantingState.enchantedSlots) {
    state.enchantingState.enchantedSlots = createEnchantingState().enchantedSlots;
  }
  return state;
}

export function getAvailableEnchantments(equipSlot, playerLevel) {
  if (!VALID_SLOTS.includes(equipSlot)) return [];
  return Object.values(ENCHANTMENTS).filter((enchantment) => {
    const slotMatch = enchantment.targetSlots.includes('any') || enchantment.targetSlots.includes(equipSlot);
    return slotMatch && enchantment.requiredLevel <= playerLevel;
  });
}

export function canEnchant(state, equipSlot, enchantmentId) {
  if (!VALID_SLOTS.includes(equipSlot)) {
    return { canEnchant: false, reason: 'Invalid equipment slot.', missingMaterials: [] };
  }

  const enchantment = ENCHANTMENTS[enchantmentId];
  if (!enchantment) {
    return { canEnchant: false, reason: 'Unknown enchantment.', missingMaterials: [] };
  }

  const slotMatch = enchantment.targetSlots.includes('any') || enchantment.targetSlots.includes(equipSlot);
  if (!slotMatch) {
    return { canEnchant: false, reason: 'Enchantment cannot be applied to this slot.', missingMaterials: [] };
  }

  const playerLevel = state?.player?.level ?? 0;
  if (playerLevel < enchantment.requiredLevel) {
    return { canEnchant: false, reason: 'Player level too low.', missingMaterials: [] };
  }

  const enchantedSlots = state?.enchantingState?.enchantedSlots ?? createEnchantingState().enchantedSlots;
  if (enchantedSlots[equipSlot] === enchantmentId) {
    return { canEnchant: false, reason: 'Enchantment already applied to this slot.', missingMaterials: [] };
  }

  const inventory = state?.player?.inventory ?? {};
  const missingMaterials = Object.entries(enchantment.cost).flatMap(([itemId, quantity]) => {
    const available = inventory[itemId] ?? 0;
    if (available >= quantity) return [];
    return [{ itemId, required: quantity, available, missing: quantity - available }];
  });

  if (missingMaterials.length > 0) {
    return { canEnchant: false, reason: 'Missing required materials.', missingMaterials };
  }

  return { canEnchant: true, reason: 'Ready to enchant.', missingMaterials: [] };
}

export function applyEnchantment(state, equipSlot, enchantmentId) {
  ensureEnchantingState(state);
  const validation = canEnchant(state, equipSlot, enchantmentId);
  if (!validation.canEnchant) {
    return { success: false, message: validation.reason, state };
  }

  const enchantment = ENCHANTMENTS[enchantmentId];
  const inventory = state.player.inventory ?? {};

  Object.entries(enchantment.cost).forEach(([itemId, quantity]) => {
    const remaining = (inventory[itemId] ?? 0) - quantity;
    if (remaining <= 0) {
      delete inventory[itemId];
    } else {
      inventory[itemId] = remaining;
    }
  });

  state.player.inventory = inventory;
  state.enchantingState.enchantedSlots[equipSlot] = enchantmentId;

  return { success: true, message: `${enchantment.name} applied to ${equipSlot}.`, state };
}

export function removeEnchantment(state, equipSlot) {
  ensureEnchantingState(state);
  if (!VALID_SLOTS.includes(equipSlot)) {
    return { success: false, message: 'Invalid equipment slot.', state };
  }

  const current = state.enchantingState.enchantedSlots[equipSlot];
  if (!current) {
    return { success: false, message: 'No enchantment to remove.', state };
  }

  state.enchantingState.enchantedSlots[equipSlot] = null;
  return { success: true, message: `Enchantment removed from ${equipSlot}.`, state };
}

export function getEnchantmentBonuses(state) {
  const bonuses = {};
  const enchantedSlots = state?.enchantingState?.enchantedSlots ?? createEnchantingState().enchantedSlots;

  Object.values(enchantedSlots).forEach((enchantmentId) => {
    if (!enchantmentId) return;
    const enchantment = ENCHANTMENTS[enchantmentId];
    if (!enchantment) return;
    Object.entries(enchantment.statBonuses).forEach(([stat, value]) => {
      bonuses[stat] = (bonuses[stat] ?? 0) + value;
    });
  });

  return bonuses;
}

export function getEnchantedSlot(state, equipSlot) {
  if (!VALID_SLOTS.includes(equipSlot)) return null;
  const enchantmentId = state?.enchantingState?.enchantedSlots?.[equipSlot];
  if (!enchantmentId) return null;
  return ENCHANTMENTS[enchantmentId] ?? null;
}

export function describeEnchantmentCost(enchantmentId) {
  const enchantment = ENCHANTMENTS[enchantmentId];
  if (!enchantment) return '';
  return Object.entries(enchantment.cost)
    .map(([itemId, quantity]) => `${itemId} x${quantity}`)
    .join(', ');
}
