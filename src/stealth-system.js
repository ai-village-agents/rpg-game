/**
 * Stealth System
 * Sneaking, detection, and ambush mechanics
 */

// Stealth states
export const STEALTH_STATES = {
  VISIBLE: { id: 'visible', name: 'Visible', detectionMod: 0 },
  CONCEALED: { id: 'concealed', name: 'Concealed', detectionMod: -25 },
  HIDDEN: { id: 'hidden', name: 'Hidden', detectionMod: -50 },
  INVISIBLE: { id: 'invisible', name: 'Invisible', detectionMod: -75 }
};

// Detection types
export const DETECTION_TYPES = {
  SIGHT: { id: 'sight', name: 'Sight', range: 100, coneMod: 1.0 },
  SOUND: { id: 'sound', name: 'Sound', range: 50, coneMod: 0 },
  SMELL: { id: 'smell', name: 'Smell', range: 30, coneMod: 0 },
  MAGIC: { id: 'magic', name: 'Magic', range: 75, coneMod: 0 }
};

// Cover levels
export const COVER_LEVELS = {
  NONE: { id: 'none', name: 'No Cover', bonus: 0 },
  LIGHT: { id: 'light', name: 'Light Cover', bonus: 10 },
  MEDIUM: { id: 'medium', name: 'Medium Cover', bonus: 25 },
  HEAVY: { id: 'heavy', name: 'Heavy Cover', bonus: 40 },
  FULL: { id: 'full', name: 'Full Cover', bonus: 60 }
};

// Noise levels
export const NOISE_LEVELS = {
  SILENT: { id: 'silent', name: 'Silent', penalty: 0 },
  QUIET: { id: 'quiet', name: 'Quiet', penalty: 10 },
  NORMAL: { id: 'normal', name: 'Normal', penalty: 25 },
  LOUD: { id: 'loud', name: 'Loud', penalty: 50 },
  DEAFENING: { id: 'deafening', name: 'Deafening', penalty: 100 }
};

// Light levels
export const LIGHT_LEVELS = {
  DARKNESS: { id: 'darkness', name: 'Darkness', stealthBonus: 30, sightPenalty: 50 },
  DIM: { id: 'dim', name: 'Dim Light', stealthBonus: 15, sightPenalty: 20 },
  NORMAL: { id: 'normal', name: 'Normal Light', stealthBonus: 0, sightPenalty: 0 },
  BRIGHT: { id: 'bright', name: 'Bright Light', stealthBonus: -15, sightPenalty: -10 }
};

// Ambush bonuses
export const AMBUSH_BONUSES = {
  NONE: { id: 'none', name: 'No Ambush', damageBonus: 1.0, critBonus: 0 },
  SURPRISE: { id: 'surprise', name: 'Surprise Attack', damageBonus: 1.5, critBonus: 25 },
  BACKSTAB: { id: 'backstab', name: 'Backstab', damageBonus: 2.0, critBonus: 50 },
  ASSASSINATE: { id: 'assassinate', name: 'Assassination', damageBonus: 3.0, critBonus: 100 }
};

/**
 * Get stealth state from game state
 */
function getStealthState(state) {
  return state.stealth || {
    isStealthed: false,
    stealthLevel: 0,
    stealthState: 'visible',
    noiseLevel: 'normal',
    cover: 'none',
    lastDetection: null,
    suspicionLevel: 0,
    cooldowns: {},
    stats: {
      successfulSneaks: 0,
      ambushes: 0,
      timesDetected: 0
    }
  };
}

/**
 * Initialize stealth state
 */
export function initStealthState(state) {
  return {
    state: {
      ...state,
      stealth: {
        isStealthed: false,
        stealthLevel: 0,
        stealthState: 'visible',
        noiseLevel: 'normal',
        cover: 'none',
        lightLevel: 'normal',
        lastDetection: null,
        suspicionLevel: 0,
        cooldowns: {},
        stats: {
          successfulSneaks: 0,
          ambushes: 0,
          timesDetected: 0
        }
      }
    },
    success: true
  };
}

/**
 * Enter stealth mode
 */
export function enterStealth(state, stealthSkill = 50) {
  const stealthState = getStealthState(state);

  if (stealthState.isStealthed) {
    return { state, success: false, error: 'Already in stealth' };
  }

  // Calculate stealth level based on skill and environment
  const coverBonus = COVER_LEVELS[stealthState.cover.toUpperCase()]?.bonus || 0;
  const lightBonus = LIGHT_LEVELS[stealthState.lightLevel?.toUpperCase()]?.stealthBonus || 0;
  const noisePenalty = NOISE_LEVELS[stealthState.noiseLevel.toUpperCase()]?.penalty || 0;

  const stealthLevel = Math.max(0, Math.min(100, stealthSkill + coverBonus + lightBonus - noisePenalty));

  // Determine stealth state
  let newStealthState = 'visible';
  if (stealthLevel >= 75) newStealthState = 'hidden';
  else if (stealthLevel >= 50) newStealthState = 'concealed';

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        isStealthed: true,
        stealthLevel,
        stealthState: newStealthState
      }
    },
    success: true,
    stealthLevel,
    stealthState: newStealthState
  };
}

/**
 * Exit stealth mode
 */
export function exitStealth(state) {
  const stealthState = getStealthState(state);

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        isStealthed: false,
        stealthLevel: 0,
        stealthState: 'visible',
        suspicionLevel: 0
      }
    },
    success: true
  };
}

/**
 * Set cover level
 */
export function setCover(state, coverLevel) {
  const coverKey = coverLevel.toUpperCase();

  if (!COVER_LEVELS[coverKey]) {
    return { state, success: false, error: 'Invalid cover level' };
  }

  const stealthState = getStealthState(state);

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        cover: coverLevel.toLowerCase()
      }
    },
    success: true,
    cover: coverLevel.toLowerCase()
  };
}

/**
 * Set noise level
 */
export function setNoiseLevel(state, noiseLevel) {
  const noiseKey = noiseLevel.toUpperCase();

  if (!NOISE_LEVELS[noiseKey]) {
    return { state, success: false, error: 'Invalid noise level' };
  }

  const stealthState = getStealthState(state);

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        noiseLevel: noiseLevel.toLowerCase()
      }
    },
    success: true,
    noiseLevel: noiseLevel.toLowerCase()
  };
}

/**
 * Set light level
 */
export function setLightLevel(state, lightLevel) {
  const lightKey = lightLevel.toUpperCase();

  if (!LIGHT_LEVELS[lightKey]) {
    return { state, success: false, error: 'Invalid light level' };
  }

  const stealthState = getStealthState(state);

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        lightLevel: lightLevel.toLowerCase()
      }
    },
    success: true,
    lightLevel: lightLevel.toLowerCase()
  };
}

/**
 * Calculate detection chance
 */
export function calculateDetection(state, detecterStats = {}, detectionType = 'sight') {
  const stealthState = getStealthState(state);

  if (!stealthState.isStealthed) {
    return { detected: true, chance: 100 };
  }

  const detection = DETECTION_TYPES[detectionType.toUpperCase()] || DETECTION_TYPES.SIGHT;
  const stealthMod = STEALTH_STATES[stealthState.stealthState.toUpperCase()]?.detectionMod || 0;
  const lightPenalty = LIGHT_LEVELS[stealthState.lightLevel?.toUpperCase()]?.sightPenalty || 0;

  // Base detection chance
  const detecterPerception = detecterStats.perception || 50;
  let detectionChance = detecterPerception + stealthMod;

  // Apply light penalty for sight
  if (detectionType === 'sight') {
    detectionChance -= lightPenalty;
  }

  // Cap between 5 and 95
  detectionChance = Math.max(5, Math.min(95, detectionChance));

  return {
    detected: false,
    chance: detectionChance,
    stealthLevel: stealthState.stealthLevel,
    detectionType
  };
}

/**
 * Perform detection check
 */
export function performDetectionCheck(state, detecterStats = {}, roll = Math.random() * 100) {
  const detection = calculateDetection(state, detecterStats);

  if (detection.detected) {
    return { state, detected: true, reason: 'Not stealthed' };
  }

  const wasDetected = roll <= detection.chance;
  const stealthState = getStealthState(state);

  if (wasDetected) {
    // Detection occurred
    return {
      state: {
        ...state,
        stealth: {
          ...stealthState,
          lastDetection: Date.now(),
          suspicionLevel: Math.min(100, stealthState.suspicionLevel + 50),
          stats: {
            ...stealthState.stats,
            timesDetected: stealthState.stats.timesDetected + 1
          }
        }
      },
      detected: true,
      roll,
      chance: detection.chance
    };
  }

  // Successful stealth
  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        stats: {
          ...stealthState.stats,
          successfulSneaks: stealthState.stats.successfulSneaks + 1
        }
      }
    },
    detected: false,
    roll,
    chance: detection.chance
  };
}

/**
 * Calculate ambush bonus
 */
export function calculateAmbushBonus(state, targetAwareness = 'unaware') {
  const stealthState = getStealthState(state);

  if (!stealthState.isStealthed) {
    return { bonus: AMBUSH_BONUSES.NONE, canAmbush: false };
  }

  let ambushType = 'none';
  const stealthLevel = stealthState.stealthLevel;

  if (targetAwareness === 'unaware') {
    if (stealthLevel >= 80) {
      ambushType = 'assassinate';
    } else if (stealthLevel >= 60) {
      ambushType = 'backstab';
    } else if (stealthLevel >= 40) {
      ambushType = 'surprise';
    }
  } else if (targetAwareness === 'suspicious') {
    if (stealthLevel >= 70) {
      ambushType = 'surprise';
    }
  }

  const bonus = AMBUSH_BONUSES[ambushType.toUpperCase()];

  return {
    bonus,
    canAmbush: ambushType !== 'none',
    ambushType
  };
}

/**
 * Perform ambush attack
 */
export function performAmbush(state, baseDamage, targetAwareness = 'unaware') {
  const stealthState = getStealthState(state);
  const ambushCalc = calculateAmbushBonus(state, targetAwareness);

  if (!ambushCalc.canAmbush) {
    return {
      state,
      success: false,
      error: 'Cannot perform ambush',
      damage: baseDamage
    };
  }

  const damage = Math.floor(baseDamage * ambushCalc.bonus.damageBonus);
  const critBonus = ambushCalc.bonus.critBonus;

  // Exit stealth after ambush
  const exitResult = exitStealth(state);

  return {
    state: {
      ...exitResult.state,
      stealth: {
        ...getStealthState(exitResult.state),
        stats: {
          ...getStealthState(exitResult.state).stats,
          ambushes: stealthState.stats.ambushes + 1
        }
      }
    },
    success: true,
    damage,
    critBonus,
    ambushType: ambushCalc.ambushType
  };
}

/**
 * Increase suspicion level
 */
export function increaseSuspicion(state, amount = 10) {
  const stealthState = getStealthState(state);
  const newSuspicion = Math.min(100, stealthState.suspicionLevel + amount);

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        suspicionLevel: newSuspicion
      }
    },
    success: true,
    suspicionLevel: newSuspicion,
    alert: newSuspicion >= 100
  };
}

/**
 * Decrease suspicion level
 */
export function decreaseSuspicion(state, amount = 5) {
  const stealthState = getStealthState(state);
  const newSuspicion = Math.max(0, stealthState.suspicionLevel - amount);

  return {
    state: {
      ...state,
      stealth: {
        ...stealthState,
        suspicionLevel: newSuspicion
      }
    },
    success: true,
    suspicionLevel: newSuspicion
  };
}

/**
 * Get stealth status summary
 */
export function getStealthStatus(state) {
  const stealthState = getStealthState(state);
  const stealthStateInfo = STEALTH_STATES[stealthState.stealthState.toUpperCase()] || STEALTH_STATES.VISIBLE;
  const coverInfo = COVER_LEVELS[stealthState.cover.toUpperCase()] || COVER_LEVELS.NONE;

  return {
    isStealthed: stealthState.isStealthed,
    stealthLevel: stealthState.stealthLevel,
    stealthState: stealthStateInfo,
    cover: coverInfo,
    noiseLevel: stealthState.noiseLevel,
    lightLevel: stealthState.lightLevel,
    suspicionLevel: stealthState.suspicionLevel,
    alert: stealthState.suspicionLevel >= 100
  };
}

/**
 * Get stealth stats
 */
export function getStealthStats(state) {
  const stealthState = getStealthState(state);
  return { ...stealthState.stats };
}

/**
 * Check if can enter stealth
 */
export function canEnterStealth(state) {
  const stealthState = getStealthState(state);

  if (stealthState.isStealthed) {
    return { canEnter: false, reason: 'Already stealthed' };
  }

  if (stealthState.suspicionLevel >= 100) {
    return { canEnter: false, reason: 'Alert level too high' };
  }

  const noiseKey = stealthState.noiseLevel.toUpperCase();
  if (noiseKey === 'DEAFENING') {
    return { canEnter: false, reason: 'Too loud to stealth' };
  }

  return { canEnter: true };
}
