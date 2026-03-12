/**
 * Environmental Hazards System
 * Terrain-based combat effects that interact with elemental attacks
 */

/**
 * Hazard types and their properties
 */
export const HAZARD_TYPES = {
  FIRE_ZONE: 'fire-zone',
  ICE_PATCH: 'ice-patch',
  POISON_SWAMP: 'poison-swamp',
  ELECTRIC_FIELD: 'electric-field',
  SHADOW_MIST: 'shadow-mist',
  BLESSED_GROUND: 'blessed-ground',
  THORNS: 'thorns',
  QUICKSAND: 'quicksand',
};

/**
 * Hazard data definitions
 */
export const HAZARD_DATA = {
  [HAZARD_TYPES.FIRE_ZONE]: {
    name: 'Fire Zone',
    element: 'fire',
    icon: '\uD83D\uDD25', // 🔥
    damagePerTurn: 10,
    effect: { type: 'burn', chance: 0.3, duration: 2 },
    description: 'A blazing area that burns those who stand in it.',
    counterElement: 'ice',
    boostElement: 'fire',
  },
  [HAZARD_TYPES.ICE_PATCH]: {
    name: 'Ice Patch',
    element: 'ice',
    icon: '\u2744\uFE0F', // ❄️
    damagePerTurn: 5,
    effect: { type: 'slow', chance: 0.4, duration: 2 },
    description: 'Slippery ice that chills and slows movement.',
    counterElement: 'fire',
    boostElement: 'ice',
  },
  [HAZARD_TYPES.POISON_SWAMP]: {
    name: 'Poison Swamp',
    element: 'nature',
    icon: '\u2620\uFE0F', // ☠️
    damagePerTurn: 8,
    effect: { type: 'poison', chance: 0.5, duration: 3 },
    description: 'Toxic mire that poisons those who wade through.',
    counterElement: 'holy',
    boostElement: 'nature',
  },
  [HAZARD_TYPES.ELECTRIC_FIELD]: {
    name: 'Electric Field',
    element: 'lightning',
    icon: '\u26A1', // ⚡
    damagePerTurn: 12,
    effect: { type: 'stun', chance: 0.2, duration: 1 },
    description: 'Crackling electricity that shocks anyone nearby.',
    counterElement: 'nature',
    boostElement: 'lightning',
  },
  [HAZARD_TYPES.SHADOW_MIST]: {
    name: 'Shadow Mist',
    element: 'shadow',
    icon: '\uD83C\uDF11', // 🌑
    damagePerTurn: 6,
    effect: { type: 'blind', chance: 0.35, duration: 2 },
    description: 'Dark fog that obscures vision and drains vitality.',
    counterElement: 'holy',
    boostElement: 'shadow',
  },
  [HAZARD_TYPES.BLESSED_GROUND]: {
    name: 'Blessed Ground',
    element: 'holy',
    icon: '\u2728', // ✨
    damagePerTurn: 0,
    healPerTurn: 10,
    effect: { type: 'regen', chance: 0.5, duration: 2 },
    description: 'Sacred earth that heals allies standing upon it.',
    counterElement: 'shadow',
    boostElement: 'holy',
    isHelpful: true,
  },
  [HAZARD_TYPES.THORNS]: {
    name: 'Thorns',
    element: 'nature',
    icon: '\uD83C\uDF3F', // 🌿
    damagePerTurn: 7,
    effect: { type: 'bleed', chance: 0.4, duration: 2 },
    description: 'Sharp thorny vines that cut and entangle.',
    counterElement: 'fire',
    boostElement: 'nature',
  },
  [HAZARD_TYPES.QUICKSAND]: {
    name: 'Quicksand',
    element: 'physical',
    icon: '\uD83C\uDFDC\uFE0F', // 🏜️
    damagePerTurn: 5,
    effect: { type: 'immobilize', chance: 0.3, duration: 1 },
    description: 'Shifting sand that pulls victims down.',
    counterElement: null,
    boostElement: null,
  },
};

/**
 * Element interaction results
 */
export const ELEMENT_INTERACTIONS = {
  NEUTRALIZE: 'neutralize',  // Hazard is removed
  INTENSIFY: 'intensify',    // Hazard becomes stronger
  TRANSFORM: 'transform',    // Hazard changes type
  SPREAD: 'spread',          // Hazard expands
};

/**
 * Create a hazard instance
 * @param {string} type - Hazard type
 * @param {Object} options - Additional options
 * @returns {Object} Hazard instance
 */
export function createHazard(type, options = {}) {
  const data = HAZARD_DATA[type];
  if (!data) {
    return null;
  }

  const {
    duration = 5,
    intensity = 1.0,
    position = null,
  } = options;

  return {
    type,
    name: data.name,
    element: data.element,
    icon: data.icon,
    damagePerTurn: Math.floor(data.damagePerTurn * intensity),
    healPerTurn: data.healPerTurn ? Math.floor(data.healPerTurn * intensity) : 0,
    effect: data.effect ? { ...data.effect } : null,
    duration,
    turnsRemaining: duration,
    intensity,
    position,
    isActive: true,
    isHelpful: data.isHelpful || false,
  };
}

/**
 * Apply hazard effects to a target
 * @param {Object} hazard - The hazard
 * @param {Object} target - Target entity { hp, maxHp, statusEffects }
 * @param {number} rngValue - Random value 0-1 for effect chance
 * @returns {Object} Result { damage, healing, effect, messages }
 */
export function applyHazardEffect(hazard, target, rngValue = Math.random()) {
  if (!hazard || !hazard.isActive || !target) {
    return { damage: 0, healing: 0, effect: null, messages: [] };
  }

  const messages = [];
  let damage = 0;
  let healing = 0;
  let appliedEffect = null;

  // Apply damage
  if (hazard.damagePerTurn > 0) {
    damage = hazard.damagePerTurn;
    messages.push(`${hazard.name} deals ${damage} damage!`);
  }

  // Apply healing (for helpful hazards)
  if (hazard.healPerTurn > 0) {
    healing = hazard.healPerTurn;
    messages.push(`${hazard.name} heals for ${healing}!`);
  }

  // Check for status effect
  if (hazard.effect && rngValue < hazard.effect.chance) {
    appliedEffect = {
      type: hazard.effect.type,
      duration: hazard.effect.duration,
      source: hazard.name,
    };
    messages.push(`${hazard.effect.type} applied!`);
  }

  return { damage, healing, effect: appliedEffect, messages };
}

/**
 * Process hazard turn (decay duration)
 * @param {Object} hazard - The hazard
 * @returns {Object} Updated hazard
 */
export function processHazardTurn(hazard) {
  if (!hazard) return null;

  const turnsRemaining = Math.max(0, hazard.turnsRemaining - 1);
  const isActive = turnsRemaining > 0;

  return {
    ...hazard,
    turnsRemaining,
    isActive,
  };
}

/**
 * Determine element interaction between attack and hazard
 * @param {string} attackElement - Element of the attack
 * @param {string} hazardType - Type of hazard
 * @returns {Object} Interaction result { type, newHazard, message }
 */
export function calculateElementInteraction(attackElement, hazardType) {
  const hazardData = HAZARD_DATA[hazardType];
  if (!hazardData || !attackElement) {
    return { type: null, newHazard: null, message: null };
  }

  const normalizedAttack = attackElement.toLowerCase();
  const counterElement = hazardData.counterElement;
  const boostElement = hazardData.boostElement;

  // Counter element neutralizes the hazard
  if (counterElement && normalizedAttack === counterElement.toLowerCase()) {
    return {
      type: ELEMENT_INTERACTIONS.NEUTRALIZE,
      newHazard: null,
      message: `${hazardData.name} is neutralized by ${attackElement}!`,
    };
  }

  // Same element intensifies the hazard
  if (boostElement && normalizedAttack === boostElement.toLowerCase()) {
    return {
      type: ELEMENT_INTERACTIONS.INTENSIFY,
      newHazard: null,
      intensityBonus: 0.25,
      message: `${hazardData.name} grows stronger!`,
    };
  }

  // Special transformations
  const transformation = getTransformation(attackElement, hazardType);
  if (transformation) {
    return {
      type: ELEMENT_INTERACTIONS.TRANSFORM,
      newHazard: transformation.newType,
      message: transformation.message,
    };
  }

  return { type: null, newHazard: null, message: null };
}

/**
 * Get transformation result for element + hazard combination
 * @param {string} element - Attack element
 * @param {string} hazardType - Current hazard type
 * @returns {Object|null} Transformation result or null
 */
function getTransformation(element, hazardType) {
  const transformations = {
    // Fire + Ice = Steam (removes both)
    [`fire:${HAZARD_TYPES.ICE_PATCH}`]: {
      newType: null,
      message: 'Fire melts the ice into steam!',
    },
    // Ice + Fire = Steam (removes both)
    [`ice:${HAZARD_TYPES.FIRE_ZONE}`]: {
      newType: null,
      message: 'Ice extinguishes the flames in a burst of steam!',
    },
    // Lightning + Poison = Electric Field
    [`lightning:${HAZARD_TYPES.POISON_SWAMP}`]: {
      newType: HAZARD_TYPES.ELECTRIC_FIELD,
      message: 'Lightning electrifies the swamp!',
    },
    // Fire + Thorns = Fire Zone
    [`fire:${HAZARD_TYPES.THORNS}`]: {
      newType: HAZARD_TYPES.FIRE_ZONE,
      message: 'The thorns catch fire!',
    },
    // Holy + Shadow = Blessed Ground
    [`holy:${HAZARD_TYPES.SHADOW_MIST}`]: {
      newType: HAZARD_TYPES.BLESSED_GROUND,
      message: 'Holy light purifies the shadow into sacred ground!',
    },
    // Shadow + Blessed = Shadow Mist
    [`shadow:${HAZARD_TYPES.BLESSED_GROUND}`]: {
      newType: HAZARD_TYPES.SHADOW_MIST,
      message: 'Shadow corrupts the blessed ground!',
    },
  };

  const key = `${element.toLowerCase()}:${hazardType}`;
  return transformations[key] || null;
}

/**
 * Apply element interaction to a hazard
 * @param {Object} hazard - The current hazard
 * @param {string} attackElement - Element of the attack
 * @returns {Object} Result { hazard, wasModified, message }
 */
export function applyElementInteraction(hazard, attackElement) {
  if (!hazard || !attackElement) {
    return { hazard, wasModified: false, message: null };
  }

  const interaction = calculateElementInteraction(attackElement, hazard.type);

  if (!interaction.type) {
    return { hazard, wasModified: false, message: null };
  }

  switch (interaction.type) {
    case ELEMENT_INTERACTIONS.NEUTRALIZE:
      return {
        hazard: null,
        wasModified: true,
        message: interaction.message,
      };

    case ELEMENT_INTERACTIONS.INTENSIFY:
      return {
        hazard: {
          ...hazard,
          intensity: hazard.intensity + (interaction.intensityBonus || 0.25),
          damagePerTurn: Math.floor(hazard.damagePerTurn * 1.25),
          healPerTurn: hazard.healPerTurn ? Math.floor(hazard.healPerTurn * 1.25) : 0,
        },
        wasModified: true,
        message: interaction.message,
      };

    case ELEMENT_INTERACTIONS.TRANSFORM:
      if (interaction.newHazard) {
        const newHazard = createHazard(interaction.newHazard, {
          duration: hazard.turnsRemaining,
          intensity: hazard.intensity,
          position: hazard.position,
        });
        return {
          hazard: newHazard,
          wasModified: true,
          message: interaction.message,
        };
      }
      // Transform to nothing (removal)
      return {
        hazard: null,
        wasModified: true,
        message: interaction.message,
      };

    default:
      return { hazard, wasModified: false, message: null };
  }
}

/**
 * Get damage bonus for attack matching hazard element
 * @param {string} attackElement - Element of the attack
 * @param {Object} hazard - The hazard
 * @returns {number} Damage multiplier bonus (0 or positive)
 */
export function getElementalSynergyBonus(attackElement, hazard) {
  if (!hazard || !attackElement) return 0;

  const hazardData = HAZARD_DATA[hazard.type];
  if (!hazardData) return 0;

  // Same element as hazard gets 25% bonus damage
  if (hazardData.element && attackElement.toLowerCase() === hazardData.element.toLowerCase()) {
    return 0.25;
  }

  return 0;
}

/**
 * Check if entity is immune to a hazard
 * @param {Object} entity - Entity with potential immunities
 * @param {Object} hazard - The hazard
 * @returns {boolean} Whether entity is immune
 */
export function isImmuneToHazard(entity, hazard) {
  if (!entity || !hazard) return false;

  const hazardData = HAZARD_DATA[hazard.type];
  if (!hazardData) return false;

  // Check if entity has element immunity
  const immunities = entity.immunities || [];
  return immunities.some(
    imm => imm.toLowerCase() === hazardData.element?.toLowerCase()
  );
}

/**
 * Get hazard info for display
 * @param {string} type - Hazard type
 * @returns {Object} Hazard display info
 */
export function getHazardInfo(type) {
  const data = HAZARD_DATA[type];
  if (!data) {
    return { name: 'Unknown', icon: '?', description: 'Unknown hazard' };
  }

  return {
    name: data.name,
    icon: data.icon,
    element: data.element,
    description: data.description,
    damagePerTurn: data.damagePerTurn,
    healPerTurn: data.healPerTurn || 0,
    effect: data.effect,
    counterElement: data.counterElement,
    boostElement: data.boostElement,
    isHelpful: data.isHelpful || false,
  };
}

/**
 * Get all hazard types
 * @returns {Array} Array of hazard type strings
 */
export function getAllHazardTypes() {
  return Object.values(HAZARD_TYPES);
}

/**
 * Get hazards by element
 * @param {string} element - Element to filter by
 * @returns {Array} Matching hazard types
 */
export function getHazardsByElement(element) {
  if (!element) return [];

  const normalizedElement = element.toLowerCase();
  return Object.entries(HAZARD_DATA)
    .filter(([, data]) => data.element?.toLowerCase() === normalizedElement)
    .map(([type]) => type);
}

/**
 * Create a battle arena with hazards
 * @param {Array} hazardConfigs - Array of { type, position, duration }
 * @returns {Object} Arena state
 */
export function createArena(hazardConfigs = []) {
  const hazards = hazardConfigs
    .map(config => createHazard(config.type, config))
    .filter(h => h !== null);

  return {
    hazards,
    turnCount: 0,
  };
}

/**
 * Process all hazards in arena for a turn
 * @param {Object} arena - Arena state
 * @returns {Object} Updated arena
 */
export function processArenaTurn(arena) {
  if (!arena) return createArena();

  const hazards = arena.hazards
    .map(h => processHazardTurn(h))
    .filter(h => h && h.isActive);

  return {
    ...arena,
    hazards,
    turnCount: arena.turnCount + 1,
  };
}

/**
 * Add hazard to arena
 * @param {Object} arena - Arena state
 * @param {string} type - Hazard type
 * @param {Object} options - Hazard options
 * @returns {Object} Updated arena
 */
export function addHazardToArena(arena, type, options = {}) {
  const hazard = createHazard(type, options);
  if (!hazard) return arena;

  return {
    ...arena,
    hazards: [...arena.hazards, hazard],
  };
}

/**
 * Remove hazard from arena by index
 * @param {Object} arena - Arena state
 * @param {number} index - Hazard index to remove
 * @returns {Object} Updated arena
 */
export function removeHazardFromArena(arena, index) {
  if (!arena || index < 0 || index >= arena.hazards.length) {
    return arena;
  }

  const hazards = arena.hazards.filter((_, i) => i !== index);
  return { ...arena, hazards };
}
