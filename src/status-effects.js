/**
 * Status Effects System
 * Manages buffs, debuffs, and combat status conditions
 */

/**
 * Status effect categories
 */
export const EFFECT_CATEGORIES = {
  DAMAGE_OVER_TIME: 'dot',
  HEAL_OVER_TIME: 'hot',
  STAT_MODIFIER: 'stat',
  CONTROL: 'control',
  SHIELD: 'shield',
  SPECIAL: 'special',
};

/**
 * Status effect types
 */
export const STATUS_TYPES = {
  // Damage over time
  POISON: 'poison',
  BURN: 'burn',
  BLEED: 'bleed',
  CURSE: 'curse',
  
  // Heal over time
  REGEN: 'regen',
  MANA_REGEN: 'mana-regen',
  
  // Stat modifiers - buffs
  ATTACK_UP: 'attack-up',
  DEFENSE_UP: 'defense-up',
  SPEED_UP: 'speed-up',
  MAGIC_UP: 'magic-up',
  CRIT_UP: 'crit-up',
  
  // Stat modifiers - debuffs
  ATTACK_DOWN: 'attack-down',
  DEFENSE_DOWN: 'defense-down',
  SPEED_DOWN: 'speed-down',
  MAGIC_DOWN: 'magic-down',
  ACCURACY_DOWN: 'accuracy-down',
  
  // Control effects
  STUN: 'stun',
  FREEZE: 'freeze',
  SLEEP: 'sleep',
  CONFUSE: 'confuse',
  SILENCE: 'silence',
  
  // Shield effects
  BARRIER: 'barrier',
  REFLECT: 'reflect',
  ABSORB: 'absorb',
  
  // Special effects
  INVINCIBLE: 'invincible',
  TAUNT: 'taunt',
  STEALTH: 'stealth',
  BERSERK: 'berserk',
};

/**
 * Status effect data definitions
 */
export const STATUS_DATA = {
  // Damage over time
  [STATUS_TYPES.POISON]: {
    name: 'Poison',
    icon: '\u2620\uFE0F',
    category: EFFECT_CATEGORIES.DAMAGE_OVER_TIME,
    description: 'Takes damage each turn.',
    color: '#7B3F9E',
    defaultDuration: 3,
    tickDamage: { base: 5, percentMax: 0.05 },
    stackable: true,
    maxStacks: 5,
  },
  [STATUS_TYPES.BURN]: {
    name: 'Burn',
    icon: '\uD83D\uDD25',
    category: EFFECT_CATEGORIES.DAMAGE_OVER_TIME,
    description: 'Fire damage each turn. Reduces defense.',
    color: '#FF6B35',
    defaultDuration: 3,
    tickDamage: { base: 8, percentMax: 0.03 },
    statMod: { defense: -0.1 },
    stackable: false,
  },
  [STATUS_TYPES.BLEED]: {
    name: 'Bleed',
    icon: '\uD83E\uDE78',
    category: EFFECT_CATEGORIES.DAMAGE_OVER_TIME,
    description: 'Loses HP when attacking.',
    color: '#DC143C',
    defaultDuration: 4,
    tickDamage: { base: 3, percentMax: 0.02 },
    onAction: 'attack',
    stackable: true,
    maxStacks: 3,
  },
  [STATUS_TYPES.CURSE]: {
    name: 'Curse',
    icon: '\uD83D\uDC80',
    category: EFFECT_CATEGORIES.DAMAGE_OVER_TIME,
    description: 'Dark energy drains life. Prevents healing.',
    color: '#4B0082',
    defaultDuration: 3,
    tickDamage: { base: 10, percentMax: 0.08 },
    preventsHealing: true,
    stackable: false,
  },
  
  // Heal over time
  [STATUS_TYPES.REGEN]: {
    name: 'Regen',
    icon: '\u2764\uFE0F',
    category: EFFECT_CATEGORIES.HEAL_OVER_TIME,
    description: 'Recovers HP each turn.',
    color: '#32CD32',
    defaultDuration: 5,
    tickHeal: { base: 10, percentMax: 0.05 },
    stackable: false,
  },
  [STATUS_TYPES.MANA_REGEN]: {
    name: 'Mana Flow',
    icon: '\uD83D\uDCA7',
    category: EFFECT_CATEGORIES.HEAL_OVER_TIME,
    description: 'Recovers MP each turn.',
    color: '#4169E1',
    defaultDuration: 4,
    tickMana: { base: 5, percentMax: 0.1 },
    stackable: false,
  },
  
  // Stat buffs
  [STATUS_TYPES.ATTACK_UP]: {
    name: 'Attack Up',
    icon: '\u2694\uFE0F',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Attack power increased.',
    color: '#FF4500',
    defaultDuration: 4,
    statMod: { attack: 0.25 },
    isBuff: true,
    stackable: false,
  },
  [STATUS_TYPES.DEFENSE_UP]: {
    name: 'Defense Up',
    icon: '\uD83D\uDEE1\uFE0F',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Defense power increased.',
    color: '#4682B4',
    defaultDuration: 4,
    statMod: { defense: 0.25 },
    isBuff: true,
    stackable: false,
  },
  [STATUS_TYPES.SPEED_UP]: {
    name: 'Haste',
    icon: '\u26A1',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Speed increased.',
    color: '#FFD700',
    defaultDuration: 3,
    statMod: { speed: 0.3 },
    isBuff: true,
    stackable: false,
  },
  [STATUS_TYPES.MAGIC_UP]: {
    name: 'Magic Up',
    icon: '\u2728',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Magic power increased.',
    color: '#9932CC',
    defaultDuration: 4,
    statMod: { magic: 0.25 },
    isBuff: true,
    stackable: false,
  },
  [STATUS_TYPES.CRIT_UP]: {
    name: 'Critical Focus',
    icon: '\uD83C\uDFAF',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Critical hit chance increased.',
    color: '#FF1493',
    defaultDuration: 3,
    statMod: { critChance: 0.2 },
    isBuff: true,
    stackable: false,
  },
  
  // Stat debuffs
  [STATUS_TYPES.ATTACK_DOWN]: {
    name: 'Weakened',
    icon: '\uD83D\uDCC9',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Attack power reduced.',
    color: '#808080',
    defaultDuration: 3,
    statMod: { attack: -0.2 },
    isBuff: false,
    stackable: false,
  },
  [STATUS_TYPES.DEFENSE_DOWN]: {
    name: 'Armor Break',
    icon: '\uD83D\uDEE1\uFE0F\u200D\u2717',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Defense power reduced.',
    color: '#8B4513',
    defaultDuration: 3,
    statMod: { defense: -0.25 },
    isBuff: false,
    stackable: false,
  },
  [STATUS_TYPES.SPEED_DOWN]: {
    name: 'Slow',
    icon: '\uD83D\uDC22',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Speed reduced.',
    color: '#708090',
    defaultDuration: 3,
    statMod: { speed: -0.3 },
    isBuff: false,
    stackable: false,
  },
  [STATUS_TYPES.MAGIC_DOWN]: {
    name: 'Magic Drain',
    icon: '\uD83D\uDD2E',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Magic power reduced.',
    color: '#483D8B',
    defaultDuration: 3,
    statMod: { magic: -0.2 },
    isBuff: false,
    stackable: false,
  },
  [STATUS_TYPES.ACCURACY_DOWN]: {
    name: 'Blind',
    icon: '\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8\uFE0F',
    category: EFFECT_CATEGORIES.STAT_MODIFIER,
    description: 'Accuracy reduced.',
    color: '#2F4F4F',
    defaultDuration: 2,
    statMod: { accuracy: -0.25 },
    isBuff: false,
    stackable: false,
  },
  
  // Control effects
  [STATUS_TYPES.STUN]: {
    name: 'Stunned',
    icon: '\uD83D\uDCAB',
    category: EFFECT_CATEGORIES.CONTROL,
    description: 'Cannot take actions.',
    color: '#FFD700',
    defaultDuration: 1,
    preventsAction: true,
    stackable: false,
  },
  [STATUS_TYPES.FREEZE]: {
    name: 'Frozen',
    icon: '\u2744\uFE0F',
    category: EFFECT_CATEGORIES.CONTROL,
    description: 'Frozen solid. Cannot act.',
    color: '#87CEEB',
    defaultDuration: 2,
    preventsAction: true,
    breakOnDamage: true,
    damageBonus: 1.5,
    stackable: false,
  },
  [STATUS_TYPES.SLEEP]: {
    name: 'Asleep',
    icon: '\uD83D\uDCA4',
    category: EFFECT_CATEGORIES.CONTROL,
    description: 'Sleeping. Wake on damage.',
    color: '#9370DB',
    defaultDuration: 3,
    preventsAction: true,
    breakOnDamage: true,
    stackable: false,
  },
  [STATUS_TYPES.CONFUSE]: {
    name: 'Confused',
    icon: '\uD83D\uDE35',
    category: EFFECT_CATEGORIES.CONTROL,
    description: 'May attack allies.',
    color: '#FF69B4',
    defaultDuration: 2,
    confuseChance: 0.5,
    stackable: false,
  },
  [STATUS_TYPES.SILENCE]: {
    name: 'Silenced',
    icon: '\uD83E\uDD10',
    category: EFFECT_CATEGORIES.CONTROL,
    description: 'Cannot use skills or magic.',
    color: '#778899',
    defaultDuration: 2,
    preventsSkills: true,
    stackable: false,
  },
  
  // Shield effects
  [STATUS_TYPES.BARRIER]: {
    name: 'Barrier',
    icon: '\uD83D\uDD35',
    category: EFFECT_CATEGORIES.SHIELD,
    description: 'Absorbs incoming damage.',
    color: '#00CED1',
    defaultDuration: 3,
    shieldAmount: 50,
    stackable: false,
  },
  [STATUS_TYPES.REFLECT]: {
    name: 'Reflect',
    icon: '\uD83D\uDD00',
    category: EFFECT_CATEGORIES.SHIELD,
    description: 'Reflects magic damage.',
    color: '#E6E6FA',
    defaultDuration: 2,
    reflectChance: 1.0,
    reflectType: 'magic',
    stackable: false,
  },
  [STATUS_TYPES.ABSORB]: {
    name: 'Absorb',
    icon: '\uD83C\uDF00',
    category: EFFECT_CATEGORIES.SHIELD,
    description: 'Absorbs elemental damage as HP.',
    color: '#98FB98',
    defaultDuration: 2,
    absorbElement: null,
    stackable: false,
  },
  
  // Special effects
  [STATUS_TYPES.INVINCIBLE]: {
    name: 'Invincible',
    icon: '\u2B50',
    category: EFFECT_CATEGORIES.SPECIAL,
    description: 'Cannot take damage.',
    color: '#FFD700',
    defaultDuration: 1,
    immuneToDamage: true,
    stackable: false,
  },
  [STATUS_TYPES.TAUNT]: {
    name: 'Taunt',
    icon: '\uD83E\uDD2C',
    category: EFFECT_CATEGORIES.SPECIAL,
    description: 'Forces enemies to target this unit.',
    color: '#FF0000',
    defaultDuration: 2,
    forcesTarget: true,
    stackable: false,
  },
  [STATUS_TYPES.STEALTH]: {
    name: 'Stealth',
    icon: '\uD83D\uDC7B',
    category: EFFECT_CATEGORIES.SPECIAL,
    description: 'Hidden from enemies. Breaks on action.',
    color: '#696969',
    defaultDuration: 3,
    untargetable: true,
    breakOnAction: true,
    stackable: false,
  },
  [STATUS_TYPES.BERSERK]: {
    name: 'Berserk',
    icon: '\uD83D\uDCA2',
    category: EFFECT_CATEGORIES.SPECIAL,
    description: 'Attack up but cannot control actions.',
    color: '#B22222',
    defaultDuration: 3,
    statMod: { attack: 0.5 },
    autoAttack: true,
    stackable: false,
  },
};

/**
 * Get status effect data
 * @param {string} statusType - Status type
 * @returns {Object|null} Status data
 */
export function getStatusData(statusType) {
  return STATUS_DATA[statusType] || null;
}

/**
 * Create a status effect instance
 * @param {string} statusType - Type of status effect
 * @param {Object} options - Override options
 * @returns {Object} Status effect instance
 */
export function createStatusEffect(statusType, options = {}) {
  const data = STATUS_DATA[statusType];
  if (!data) return null;
  
  const {
    duration = data.defaultDuration,
    potency = 1.0,
    source = null,
    stacks = 1,
    shieldAmount = data.shieldAmount,
    absorbElement = data.absorbElement,
  } = options;
  
  return {
    type: statusType,
    name: data.name,
    icon: data.icon,
    category: data.category,
    duration,
    turnsRemaining: duration,
    potency,
    source,
    stacks: data.stackable ? Math.min(stacks, data.maxStacks || 99) : 1,
    shieldRemaining: shieldAmount,
    absorbElement,
    appliedAt: Date.now(),
  };
}

/**
 * Apply status effect to entity
 * @param {Object} entity - Entity with statusEffects array
 * @param {string} statusType - Type of status to apply
 * @param {Object} options - Effect options
 * @returns {Object} Updated entity and result info
 */
export function applyStatusEffect(entity, statusType, options = {}) {
  if (!entity) return { entity, applied: false, reason: 'invalid_entity' };
  
  const data = STATUS_DATA[statusType];
  if (!data) return { entity, applied: false, reason: 'invalid_status' };
  
  // Check immunity
  if (entity.statusImmunities && entity.statusImmunities.includes(statusType)) {
    return { entity, applied: false, reason: 'immune' };
  }
  
  const statusEffects = [...(entity.statusEffects || [])];
  const existingIndex = statusEffects.findIndex(s => s.type === statusType);
  
  if (existingIndex >= 0) {
    const existing = statusEffects[existingIndex];
    
    if (data.stackable) {
      // Add stacks up to max
      const newStacks = Math.min(
        existing.stacks + (options.stacks || 1),
        data.maxStacks || 99
      );
      statusEffects[existingIndex] = {
        ...existing,
        stacks: newStacks,
        turnsRemaining: Math.max(existing.turnsRemaining, options.duration || data.defaultDuration),
      };
    } else {
      // Refresh duration
      statusEffects[existingIndex] = {
        ...existing,
        turnsRemaining: Math.max(existing.turnsRemaining, options.duration || data.defaultDuration),
      };
    }
    
    return {
      entity: { ...entity, statusEffects },
      applied: true,
      refreshed: true,
      effect: statusEffects[existingIndex],
    };
  }
  
  // Create new effect
  const newEffect = createStatusEffect(statusType, options);
  statusEffects.push(newEffect);
  
  return {
    entity: { ...entity, statusEffects },
    applied: true,
    refreshed: false,
    effect: newEffect,
  };
}

/**
 * Remove status effect from entity
 * @param {Object} entity - Entity with statusEffects
 * @param {string} statusType - Type of status to remove
 * @returns {Object} Updated entity
 */
export function removeStatusEffect(entity, statusType) {
  if (!entity || !entity.statusEffects) return entity;
  
  return {
    ...entity,
    statusEffects: entity.statusEffects.filter(s => s.type !== statusType),
  };
}

/**
 * Remove all status effects of a category
 * @param {Object} entity - Entity with statusEffects
 * @param {string} category - Category to clear
 * @returns {Object} Updated entity
 */
export function clearStatusCategory(entity, category) {
  if (!entity || !entity.statusEffects) return entity;
  
  return {
    ...entity,
    statusEffects: entity.statusEffects.filter(s => {
      const data = STATUS_DATA[s.type];
      return data?.category !== category;
    }),
  };
}

/**
 * Clear all buffs or debuffs
 * @param {Object} entity - Entity
 * @param {boolean} clearBuffs - Clear buffs (isBuff: true)
 * @returns {Object} Updated entity
 */
export function clearBuffsOrDebuffs(entity, clearBuffs = true) {
  if (!entity || !entity.statusEffects) return entity;
  
  return {
    ...entity,
    statusEffects: entity.statusEffects.filter(s => {
      const data = STATUS_DATA[s.type];
      return data?.isBuff !== clearBuffs;
    }),
  };
}

/**
 * Process turn tick for all status effects
 * @param {Object} entity - Entity with statusEffects
 * @returns {Object} Result with updated entity and tick results
 */
export function processStatusTick(entity) {
  if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
    return { entity, results: [] };
  }
  
  const results = [];
  let currentHp = entity.hp || entity.currentHp || 0;
  let currentMp = entity.mp || entity.currentMp || 0;
  const maxHp = entity.maxHp || entity.stats?.hp || currentHp;
  const maxMp = entity.maxMp || entity.stats?.mp || currentMp;
  
  const updatedEffects = [];
  
  for (const effect of entity.statusEffects) {
    const data = STATUS_DATA[effect.type];
    if (!data) continue;
    
    const result = {
      type: effect.type,
      name: effect.name,
    };
    
    // Process damage over time
    if (data.tickDamage && data.category === EFFECT_CATEGORIES.DAMAGE_OVER_TIME) {
      const baseDmg = data.tickDamage.base || 0;
      const percentDmg = Math.floor(maxHp * (data.tickDamage.percentMax || 0));
      const totalDmg = Math.floor((baseDmg + percentDmg) * effect.potency * effect.stacks);
      currentHp = Math.max(0, currentHp - totalDmg);
      result.damage = totalDmg;
    }
    
    // Process heal over time
    if (data.tickHeal && data.category === EFFECT_CATEGORIES.HEAL_OVER_TIME) {
      // Check if healing is prevented
      const cursed = entity.statusEffects.some(s => STATUS_DATA[s.type]?.preventsHealing);
      if (!cursed) {
        const baseHeal = data.tickHeal.base || 0;
        const percentHeal = Math.floor(maxHp * (data.tickHeal.percentMax || 0));
        const totalHeal = Math.floor((baseHeal + percentHeal) * effect.potency);
        currentHp = Math.min(maxHp, currentHp + totalHeal);
        result.heal = totalHeal;
      } else {
        result.healPrevented = true;
      }
    }
    
    // Process mana regen
    if (data.tickMana) {
      const baseMana = data.tickMana.base || 0;
      const percentMana = Math.floor(maxMp * (data.tickMana.percentMax || 0));
      const totalMana = Math.floor((baseMana + percentMana) * effect.potency);
      currentMp = Math.min(maxMp, currentMp + totalMana);
      result.mana = totalMana;
    }
    
    // Decrement duration
    const newTurns = effect.turnsRemaining - 1;
    if (newTurns > 0) {
      updatedEffects.push({ ...effect, turnsRemaining: newTurns });
    } else {
      result.expired = true;
    }
    
    results.push(result);
  }
  
  return {
    entity: {
      ...entity,
      hp: currentHp,
      currentHp,
      mp: currentMp,
      currentMp,
      statusEffects: updatedEffects,
    },
    results,
  };
}

/**
 * Calculate stat modifications from status effects
 * @param {Object} baseStats - Base stats
 * @param {Array} statusEffects - Array of status effects
 * @returns {Object} Modified stats
 */
export function applyStatusModifiers(baseStats, statusEffects) {
  if (!baseStats || !statusEffects || statusEffects.length === 0) {
    return baseStats;
  }
  
  const modifiedStats = { ...baseStats };
  
  for (const effect of statusEffects) {
    const data = STATUS_DATA[effect.type];
    if (!data || !data.statMod) continue;
    
    for (const [stat, modifier] of Object.entries(data.statMod)) {
      if (typeof modifiedStats[stat] === 'number') {
        const change = modifiedStats[stat] * modifier * effect.potency;
        modifiedStats[stat] = Math.floor(modifiedStats[stat] + change);
      }
    }
  }
  
  return modifiedStats;
}

/**
 * Check if entity can act
 * @param {Object} entity - Entity with statusEffects
 * @returns {Object} Result with canAct and reason
 */
export function canEntityAct(entity) {
  if (!entity || !entity.statusEffects) {
    return { canAct: true, reason: null };
  }
  
  for (const effect of entity.statusEffects) {
    const data = STATUS_DATA[effect.type];
    if (data?.preventsAction) {
      return { canAct: false, reason: effect.type, effectName: data.name };
    }
  }
  
  return { canAct: true, reason: null };
}

/**
 * Check if entity can use skills
 * @param {Object} entity - Entity with statusEffects
 * @returns {boolean} Whether skills can be used
 */
export function canUseSkills(entity) {
  if (!entity || !entity.statusEffects) return true;
  
  return !entity.statusEffects.some(effect => {
    const data = STATUS_DATA[effect.type];
    return data?.preventsSkills;
  });
}

/**
 * Check if entity is targetable
 * @param {Object} entity - Entity with statusEffects
 * @returns {boolean} Whether entity can be targeted
 */
export function isTargetable(entity) {
  if (!entity || !entity.statusEffects) return true;
  
  return !entity.statusEffects.some(effect => {
    const data = STATUS_DATA[effect.type];
    return data?.untargetable;
  });
}

/**
 * Get forced target (from taunt)
 * @param {Array} entities - Array of entities
 * @returns {Object|null} Entity with taunt or null
 */
export function getForcedTarget(entities) {
  if (!entities || entities.length === 0) return null;
  
  for (const entity of entities) {
    if (!entity.statusEffects) continue;
    const hasTaunt = entity.statusEffects.some(e => 
      STATUS_DATA[e.type]?.forcesTarget
    );
    if (hasTaunt) return entity;
  }
  
  return null;
}

/**
 * Process damage with status effects
 * @param {Object} target - Target entity
 * @param {number} damage - Incoming damage
 * @param {Object} options - Damage options (type, element)
 * @returns {Object} Result with final damage and effects triggered
 */
export function processIncomingDamage(target, damage, options = {}) {
  if (!target || !target.statusEffects) {
    return { damage, absorbed: 0, reflected: 0, effects: [] };
  }
  
  let finalDamage = damage;
  let absorbed = 0;
  let reflected = 0;
  const effects = [];
  const updatedEffects = [...target.statusEffects];
  
  for (let i = 0; i < updatedEffects.length; i++) {
    const effect = updatedEffects[i];
    const data = STATUS_DATA[effect.type];
    if (!data) continue;
    
    // Check invincibility
    if (data.immuneToDamage) {
      effects.push({ type: 'immune', effectName: data.name });
      return { damage: 0, absorbed: damage, reflected: 0, effects };
    }
    
    // Check absorb (elemental)
    if (data.absorbElement && effect.absorbElement === options.element) {
      effects.push({ type: 'absorb', effectName: data.name, amount: damage });
      return { damage: -damage, absorbed: 0, reflected: 0, effects, heal: damage };
    }
    
    // Check barrier
    if (data.category === EFFECT_CATEGORIES.SHIELD && effect.shieldRemaining > 0) {
      const shieldAbsorb = Math.min(effect.shieldRemaining, finalDamage);
      absorbed += shieldAbsorb;
      finalDamage -= shieldAbsorb;
      updatedEffects[i] = {
        ...effect,
        shieldRemaining: effect.shieldRemaining - shieldAbsorb,
      };
      effects.push({ type: 'shield', effectName: data.name, amount: shieldAbsorb });
      
      // Remove if depleted
      if (updatedEffects[i].shieldRemaining <= 0) {
        updatedEffects.splice(i, 1);
        i--;
        effects.push({ type: 'shield_break', effectName: data.name });
      }
    }
    
    // Check reflect
    if (data.reflectChance && options.type === data.reflectType) {
      if (Math.random() < data.reflectChance) {
        reflected = finalDamage;
        finalDamage = 0;
        effects.push({ type: 'reflect', effectName: data.name, amount: reflected });
      }
    }
    
    // Check freeze/sleep damage bonus and break
    if (data.breakOnDamage && damage > 0) {
      effects.push({ type: 'break', effectName: data.name });
      if (data.damageBonus) {
        finalDamage = Math.floor(finalDamage * data.damageBonus);
        effects.push({ type: 'bonus_damage', multiplier: data.damageBonus });
      }
      updatedEffects.splice(i, 1);
      i--;
    }
  }
  
  return {
    damage: finalDamage,
    absorbed,
    reflected,
    effects,
    statusEffects: updatedEffects,
  };
}

/**
 * Get all active status effects of an entity
 * @param {Object} entity - Entity
 * @returns {Array} Array of status effects with full data
 */
export function getActiveStatusEffects(entity) {
  if (!entity || !entity.statusEffects) return [];
  
  return entity.statusEffects.map(effect => ({
    ...effect,
    data: STATUS_DATA[effect.type] || null,
  }));
}

/**
 * Get buffs only
 * @param {Object} entity - Entity
 * @returns {Array} Array of buff effects
 */
export function getBuffs(entity) {
  return getActiveStatusEffects(entity).filter(e => e.data?.isBuff === true);
}

/**
 * Get debuffs only
 * @param {Object} entity - Entity
 * @returns {Array} Array of debuff effects
 */
export function getDebuffs(entity) {
  const effects = getActiveStatusEffects(entity);
  return effects.filter(e => {
    const data = e.data;
    if (!data) return false;
    return data.isBuff === false || 
           data.category === EFFECT_CATEGORIES.DAMAGE_OVER_TIME ||
           data.category === EFFECT_CATEGORIES.CONTROL;
  });
}

/**
 * Check if entity has specific status
 * @param {Object} entity - Entity
 * @param {string} statusType - Status type to check
 * @returns {boolean} Whether entity has the status
 */
export function hasStatus(entity, statusType) {
  if (!entity || !entity.statusEffects) return false;
  return entity.statusEffects.some(e => e.type === statusType);
}

/**
 * Get status stacks
 * @param {Object} entity - Entity
 * @param {string} statusType - Status type
 * @returns {number} Stack count (0 if not present)
 */
export function getStatusStacks(entity, statusType) {
  if (!entity || !entity.statusEffects) return 0;
  const effect = entity.statusEffects.find(e => e.type === statusType);
  return effect?.stacks || 0;
}

/**
 * Get all status types
 * @returns {Array} Array of status type strings
 */
export function getAllStatusTypes() {
  return Object.values(STATUS_TYPES);
}

/**
 * Get all status data
 * @returns {Object} Status data object
 */
export function getAllStatusData() {
  return STATUS_DATA;
}
