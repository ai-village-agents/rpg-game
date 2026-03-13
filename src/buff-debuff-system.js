/**
 * Buff/Debuff System
 * Status effects that modify stats, deal damage over time, or provide utility
 */

// Effect types
export const EFFECT_TYPES = {
  BUFF: 'buff',
  DEBUFF: 'debuff',
  NEUTRAL: 'neutral'
};

// Effect categories
export const EFFECT_CATEGORIES = {
  STAT_MOD: { name: 'Stat Modifier', icon: '📊' },
  DAMAGE_OVER_TIME: { name: 'Damage Over Time', icon: '🔥' },
  HEAL_OVER_TIME: { name: 'Heal Over Time', icon: '💚' },
  CROWD_CONTROL: { name: 'Crowd Control', icon: '⛓️' },
  SHIELD: { name: 'Shield', icon: '🛡️' },
  UTILITY: { name: 'Utility', icon: '✨' }
};

// Stat types that can be modified
export const MODIFIABLE_STATS = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SPEED: 'speed',
  ACCURACY: 'accuracy',
  EVASION: 'evasion',
  CRIT_CHANCE: 'critChance',
  CRIT_DAMAGE: 'critDamage',
  MAGIC: 'magic',
  RESISTANCE: 'resistance'
};

// Stack modes
export const STACK_MODES = {
  NONE: 'none',           // Cannot stack, refreshes duration
  INTENSITY: 'intensity', // Stacks increase effect strength
  DURATION: 'duration',   // Stacks increase duration
  SEPARATE: 'separate'    // Each stack tracked separately
};

// Instance ID counter for unique IDs
let instanceIdCounter = 0;

// Create effect definition
export function createEffect(id, name, type, category, options = {}) {
  if (!id || !name) {
    return { success: false, error: 'Invalid effect id or name' };
  }

  if (!EFFECT_TYPES[type?.toUpperCase()]) {
    return { success: false, error: 'Invalid effect type' };
  }

  if (!EFFECT_CATEGORIES[category?.toUpperCase()]) {
    return { success: false, error: 'Invalid effect category' };
  }

  return {
    success: true,
    effect: {
      id,
      name,
      type: type.toUpperCase(),
      category: category.toUpperCase(),
      description: options.description || '',
      icon: options.icon || '⚡',
      duration: options.duration ?? 3,
      tickInterval: options.tickInterval ?? 1,
      stackMode: options.stackMode || STACK_MODES.NONE,
      maxStacks: options.maxStacks || 1,
      statModifiers: options.statModifiers || {},
      damagePerTick: options.damagePerTick || 0,
      healPerTick: options.healPerTick || 0,
      damageType: options.damageType || 'physical',
      shieldAmount: options.shieldAmount || 0,
      dispellable: options.dispellable ?? true,
      hidden: options.hidden ?? false,
      tags: options.tags || []
    }
  };
}

// Create effect registry
export function createEffectRegistry() {
  return {
    effects: {},
    byCategory: {},
    byType: {}
  };
}

// Register effect
export function registerEffect(registry, effect) {
  if (!effect || !effect.id) {
    return { success: false, error: 'Invalid effect' };
  }

  if (registry.effects[effect.id]) {
    return { success: false, error: 'Effect already registered' };
  }

  const newEffects = { ...registry.effects, [effect.id]: effect };

  // Index by category
  const newByCategory = { ...registry.byCategory };
  newByCategory[effect.category] = [...(newByCategory[effect.category] || []), effect.id];

  // Index by type
  const newByType = { ...registry.byType };
  newByType[effect.type] = [...(newByType[effect.type] || []), effect.id];

  return {
    success: true,
    registry: {
      effects: newEffects,
      byCategory: newByCategory,
      byType: newByType
    }
  };
}

// Create target state (holds active effects)
export function createTargetState() {
  return {
    activeEffects: [],
    shields: [],
    immunities: [],
    stats: {
      totalEffectsApplied: 0,
      totalEffectsExpired: 0,
      totalDamageFromDots: 0,
      totalHealingFromHots: 0
    }
  };
}

// Apply effect to target
export function applyEffect(state, registry, effectId, source = null, options = {}) {
  const effect = registry.effects[effectId];

  if (!effect) {
    return { success: false, error: 'Effect not found' };
  }

  // Check immunity
  if (state.immunities.includes(effectId) || state.immunities.includes(effect.category)) {
    return { success: false, error: 'Target is immune', immune: true };
  }

  const now = Date.now();
  const duration = options.duration ?? effect.duration;
  const stacks = options.stacks ?? 1;

  // Find existing effect
  const existingIndex = state.activeEffects.findIndex(e => e.effectId === effectId);

  let newActiveEffects = [...state.activeEffects];

  if (existingIndex >= 0) {
    const existing = newActiveEffects[existingIndex];

    switch (effect.stackMode) {
      case STACK_MODES.NONE:
        // Refresh duration
        newActiveEffects[existingIndex] = {
          ...existing,
          appliedAt: now,
          expiresAt: now + (duration * 1000),
          ticksRemaining: duration
        };
        break;

      case STACK_MODES.INTENSITY:
        // Increase stacks (refresh duration)
        newActiveEffects[existingIndex] = {
          ...existing,
          stacks: Math.min(effect.maxStacks, existing.stacks + stacks),
          appliedAt: now,
          expiresAt: now + (duration * 1000),
          ticksRemaining: duration
        };
        break;

      case STACK_MODES.DURATION:
        // Extend duration
        newActiveEffects[existingIndex] = {
          ...existing,
          expiresAt: existing.expiresAt + (duration * 1000),
          ticksRemaining: existing.ticksRemaining + duration
        };
        break;

      case STACK_MODES.SEPARATE:
        // Add as new instance
        newActiveEffects.push({
          effectId,
          source,
          stacks: Math.min(effect.maxStacks, stacks),
          appliedAt: now,
          expiresAt: now + (duration * 1000),
          ticksRemaining: duration,
          instanceId: `${effectId}_${now}_${++instanceIdCounter}`
        });
        break;
    }
  } else {
    // Add new effect
    newActiveEffects.push({
      effectId,
      source,
      stacks: Math.min(effect.maxStacks, stacks),
      appliedAt: now,
      expiresAt: now + (duration * 1000),
      ticksRemaining: duration,
      instanceId: `${effectId}_${now}_${++instanceIdCounter}`
    });
  }

  // Handle shields
  let newShields = [...state.shields];
  if (effect.shieldAmount > 0) {
    newShields.push({
      effectId,
      amount: effect.shieldAmount * stacks,
      appliedAt: now
    });
  }

  return {
    success: true,
    applied: true,
    effect,
    state: {
      ...state,
      activeEffects: newActiveEffects,
      shields: newShields,
      stats: {
        ...state.stats,
        totalEffectsApplied: state.stats.totalEffectsApplied + 1
      }
    }
  };
}

// Remove effect from target
export function removeEffect(state, effectId, instanceId = null) {
  let removed = false;
  let newActiveEffects;

  if (instanceId) {
    newActiveEffects = state.activeEffects.filter(e => e.instanceId !== instanceId);
    removed = newActiveEffects.length < state.activeEffects.length;
  } else {
    newActiveEffects = state.activeEffects.filter(e => e.effectId !== effectId);
    removed = newActiveEffects.length < state.activeEffects.length;
  }

  if (!removed) {
    return { success: false, error: 'Effect not found' };
  }

  // Remove associated shields
  const newShields = state.shields.filter(s => s.effectId !== effectId);

  return {
    success: true,
    state: {
      ...state,
      activeEffects: newActiveEffects,
      shields: newShields,
      stats: {
        ...state.stats,
        totalEffectsExpired: state.stats.totalEffectsExpired + 1
      }
    }
  };
}

// Process tick (for DoT/HoT effects)
export function processTick(state, registry) {
  let totalDamage = 0;
  let totalHealing = 0;
  const tickResults = [];
  let newActiveEffects = [];
  let expired = [];

  for (const active of state.activeEffects) {
    const effect = registry.effects[active.effectId];
    if (!effect) continue;

    // Decrement tick counter
    const newTicksRemaining = active.ticksRemaining - 1;

    // Process damage/healing
    if (effect.damagePerTick > 0) {
      const damage = effect.damagePerTick * active.stacks;
      totalDamage += damage;
      tickResults.push({
        effectId: active.effectId,
        type: 'damage',
        amount: damage,
        damageType: effect.damageType
      });
    }

    if (effect.healPerTick > 0) {
      const healing = effect.healPerTick * active.stacks;
      totalHealing += healing;
      tickResults.push({
        effectId: active.effectId,
        type: 'heal',
        amount: healing
      });
    }

    // Check expiration
    if (newTicksRemaining <= 0) {
      expired.push(active.effectId);
    } else {
      newActiveEffects.push({
        ...active,
        ticksRemaining: newTicksRemaining
      });
    }
  }

  return {
    state: {
      ...state,
      activeEffects: newActiveEffects,
      stats: {
        ...state.stats,
        totalEffectsExpired: state.stats.totalEffectsExpired + expired.length,
        totalDamageFromDots: state.stats.totalDamageFromDots + totalDamage,
        totalHealingFromHots: state.stats.totalHealingFromHots + totalHealing
      }
    },
    damage: totalDamage,
    healing: totalHealing,
    expired,
    tickResults
  };
}

// Calculate stat modifiers from active effects
export function calculateStatModifiers(state, registry) {
  const modifiers = {};

  for (const statKey of Object.values(MODIFIABLE_STATS)) {
    modifiers[statKey] = { flat: 0, percent: 0 };
  }

  for (const active of state.activeEffects) {
    const effect = registry.effects[active.effectId];
    if (!effect || !effect.statModifiers) continue;

    for (const [stat, mod] of Object.entries(effect.statModifiers)) {
      if (!modifiers[stat]) continue;

      const stackMultiplier = active.stacks;

      if (typeof mod === 'number') {
        modifiers[stat].flat += mod * stackMultiplier;
      } else if (typeof mod === 'object') {
        if (mod.flat) modifiers[stat].flat += mod.flat * stackMultiplier;
        if (mod.percent) modifiers[stat].percent += mod.percent * stackMultiplier;
      }
    }
  }

  return modifiers;
}

// Apply modifiers to base stats
export function applyModifiers(baseStats, modifiers) {
  const result = { ...baseStats };

  for (const [stat, mod] of Object.entries(modifiers)) {
    if (typeof result[stat] === 'number') {
      result[stat] = Math.floor((result[stat] + mod.flat) * (1 + mod.percent / 100));
    }
  }

  return result;
}

// Apply damage to shields first
export function applyDamageToShields(state, damage) {
  let remainingDamage = damage;
  let newShields = [];
  let shieldDamageAbsorbed = 0;

  for (const shield of state.shields) {
    if (remainingDamage <= 0) {
      newShields.push(shield);
      continue;
    }

    const absorbed = Math.min(shield.amount, remainingDamage);
    remainingDamage -= absorbed;
    shieldDamageAbsorbed += absorbed;

    if (shield.amount > absorbed) {
      newShields.push({
        ...shield,
        amount: shield.amount - absorbed
      });
    }
  }

  return {
    state: { ...state, shields: newShields },
    damageToHealth: remainingDamage,
    shieldAbsorbed: shieldDamageAbsorbed
  };
}

// Dispel effects
export function dispelEffects(state, registry, type = null, count = 1) {
  let dispelled = [];
  let newActiveEffects = [];
  let dispelCount = 0;

  for (const active of state.activeEffects) {
    const effect = registry.effects[active.effectId];

    if (!effect) {
      newActiveEffects.push(active);
      continue;
    }

    // Check if dispellable and matches type
    const shouldDispel = effect.dispellable &&
      (!type || effect.type === type) &&
      dispelCount < count;

    if (shouldDispel) {
      dispelled.push(active.effectId);
      dispelCount++;
    } else {
      newActiveEffects.push(active);
    }
  }

  // Remove associated shields for dispelled effects
  const dispelledSet = new Set(dispelled);
  const newShields = state.shields.filter(s => !dispelledSet.has(s.effectId));

  return {
    success: dispelled.length > 0,
    dispelled,
    state: {
      ...state,
      activeEffects: newActiveEffects,
      shields: newShields
    }
  };
}

// Add immunity
export function addImmunity(state, immunityId) {
  if (state.immunities.includes(immunityId)) {
    return state;
  }

  return {
    ...state,
    immunities: [...state.immunities, immunityId]
  };
}

// Remove immunity
export function removeImmunity(state, immunityId) {
  return {
    ...state,
    immunities: state.immunities.filter(i => i !== immunityId)
  };
}

// Check if has effect
export function hasEffect(state, effectId) {
  return state.activeEffects.some(e => e.effectId === effectId);
}

// Get effect stacks
export function getEffectStacks(state, effectId) {
  const active = state.activeEffects.find(e => e.effectId === effectId);
  return active ? active.stacks : 0;
}

// Get remaining duration
export function getRemainingDuration(state, effectId) {
  const active = state.activeEffects.find(e => e.effectId === effectId);
  return active ? active.ticksRemaining : 0;
}

// Get total shield amount
export function getTotalShieldAmount(state) {
  return state.shields.reduce((sum, s) => sum + s.amount, 0);
}

// Get active effects by type
export function getEffectsByType(state, registry, type) {
  return state.activeEffects.filter(active => {
    const effect = registry.effects[active.effectId];
    return effect && effect.type === type;
  });
}

// Get active effects by category
export function getEffectsByCategory(state, registry, category) {
  return state.activeEffects.filter(active => {
    const effect = registry.effects[active.effectId];
    return effect && effect.category === category.toUpperCase();
  });
}

// Get effect info
export function getEffectInfo(registry, effectId) {
  return registry.effects[effectId] || null;
}

// Clear all effects
export function clearAllEffects(state) {
  return {
    ...state,
    activeEffects: [],
    shields: []
  };
}

// Get buff/debuff summary
export function getEffectSummary(state, registry) {
  const buffs = [];
  const debuffs = [];

  for (const active of state.activeEffects) {
    const effect = registry.effects[active.effectId];
    if (!effect || effect.hidden) continue;

    const summary = {
      effectId: active.effectId,
      name: effect.name,
      icon: effect.icon,
      stacks: active.stacks,
      ticksRemaining: active.ticksRemaining,
      category: effect.category
    };

    if (effect.type === 'BUFF') {
      buffs.push(summary);
    } else if (effect.type === 'DEBUFF') {
      debuffs.push(summary);
    }
  }

  return { buffs, debuffs, totalShields: getTotalShieldAmount(state) };
}

// Get category info
export function getCategoryInfo(category) {
  return EFFECT_CATEGORIES[category?.toUpperCase()] || null;
}
