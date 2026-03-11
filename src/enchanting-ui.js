import {
  ENCHANTMENTS,
  getAvailableEnchantments,
  canEnchant,
  applyEnchantment,
  removeEnchantment,
  getEnchantmentBonuses,
  getEnchantedSlot,
  describeEnchantmentCost,
  createEnchantingState,
  ensureEnchantingState,
} from './enchanting.js';

const VALID_SLOTS = ['weapon', 'armor', 'accessory'];

export function getEnchantingMenuDefaults() {
  return { selectedSlot: 'weapon' };
}

export function getEnchantingMenuState(state) {
  const selectedSlot = state?.enchantingMenuState?.selectedSlot || 'weapon';
  const playerLevel = state?.player?.level ?? 0;
  const availableEnchantments = getAvailableEnchantments(selectedSlot, playerLevel);
  const currentEnchantments = {
    weapon: getEnchantedSlot(state, 'weapon'),
    armor: getEnchantedSlot(state, 'armor'),
    accessory: getEnchantedSlot(state, 'accessory'),
  };
  const activeEnchantmentBonuses = getEnchantmentBonuses(state || {});

  return {
    selectedSlot,
    availableEnchantments,
    currentEnchantments,
    activeEnchantmentBonuses,
  };
}

function formatBonuses(bonuses) {
  const entries = Object.entries(bonuses);
  if (entries.length === 0) return 'none';
  return entries.map(([stat, value]) => `${stat} +${value}`).join(', ');
}

function formatCurrentEnchantments(current) {
  return VALID_SLOTS.map((slot) => {
    const enchantment = current[slot];
    const label = enchantment ? enchantment.name : 'None';
    return `- ${slot}: ${label}`;
  });
}

function formatAvailableEnchantments(state, selectedSlot, available) {
  if (available.length === 0) {
    return ['- None available'];
  }

  return available.map((enchantment) => {
    const cost = describeEnchantmentCost(enchantment.id);
    const costLabel = cost ? `Cost: ${cost}` : 'Cost: none';
    const levelLabel = `Level ${enchantment.requiredLevel}`;
    const validation = canEnchant(state || {}, selectedSlot, enchantment.id);
    const status = validation.canEnchant ? 'Ready' : `Blocked: ${validation.reason}`;

    return `- ${enchantment.name} (${levelLabel}) ${costLabel} [${status}]`;
  });
}

export function renderEnchantingMenu(state) {
  const menuState = getEnchantingMenuState(state);
  const lines = [];

  lines.push('Enchanting Interface');
  lines.push(`Selected Slot: ${menuState.selectedSlot}`);
  lines.push('Current Enchantments:');
  lines.push(...formatCurrentEnchantments(menuState.currentEnchantments));
  lines.push(`Active Bonuses: ${formatBonuses(menuState.activeEnchantmentBonuses)}`);
  lines.push(`Available Enchantments for ${menuState.selectedSlot}:`);
  lines.push(...formatAvailableEnchantments(state, menuState.selectedSlot, menuState.availableEnchantments));

  return lines.join('\n');
}

function ensureMenuState(state) {
  if (!state.enchantingMenuState) {
    state.enchantingMenuState = getEnchantingMenuDefaults();
  }
  if (!state.enchantingState) {
    state.enchantingState = createEnchantingState();
  }
  return state;
}

export function handleEnchantingMenuAction(state, action) {
  const type = action?.type;

  if (type === 'ENCHANTING_OPEN') {
    const next = { ...ensureEnchantingState(state), phase: 'enchanting' };
    ensureMenuState(next);
    return next;
  }

  if (type === 'ENCHANTING_CLOSE') {
    return { ...state, phase: 'exploration' };
  }

  if (type === 'ENCHANTING_SELECT_SLOT') {
    const selectedSlot = action?.slot ?? action?.equipSlot ?? action?.selectedSlot;
    const next = { ...state };
    ensureMenuState(next);
    next.enchantingMenuState = {
      ...next.enchantingMenuState,
      selectedSlot: selectedSlot || 'weapon',
    };
    return next;
  }

  if (type === 'ENCHANTING_APPLY') {
    const slot = action?.slot ?? action?.equipSlot ?? action?.selectedSlot;
    const enchantmentId = action?.enchantmentId;
    const result = applyEnchantment(state, slot, enchantmentId);
    return { state: result.state, message: result.message, success: result.success };
  }

  if (type === 'ENCHANTING_REMOVE') {
    const slot = action?.slot ?? action?.equipSlot ?? action?.selectedSlot;
    const result = removeEnchantment(state, slot);
    return { state: result.state, message: result.message, success: result.success };
  }

  return state;
}
