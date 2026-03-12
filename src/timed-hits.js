/**
 * Timed Hits System
 * Reflex-based mini-game for enhanced damage and defense
 * Inspired by Super Mario RPG and Paper Mario action commands
 */

/**
 * Timing window ratings
 */
export const TIMING_RATING = {
  PERFECT: 'perfect',   // Hit within perfect window - max bonus
  GOOD: 'good',         // Hit within good window - moderate bonus
  OK: 'ok',             // Hit within acceptable window - small bonus
  MISS: 'miss',         // Missed entirely - no bonus (or penalty)
};

/**
 * Timed hit types
 */
export const HIT_TYPE = {
  ATTACK: 'attack',     // Offensive timing for bonus damage
  DEFEND: 'defend',     // Defensive timing to reduce damage
  COUNTER: 'counter',   // Counter timing for damage reflection
  CHARGE: 'charge',     // Charge timing for power buildup
};

/**
 * Default timing windows in milliseconds
 */
export const DEFAULT_WINDOWS = {
  perfect: 50,    // +/- 50ms from optimal
  good: 150,      // +/- 150ms from optimal
  ok: 300,        // +/- 300ms from optimal
};

/**
 * Bonus multipliers for each rating
 */
export const RATING_BONUSES = {
  attack: {
    [TIMING_RATING.PERFECT]: 1.5,   // 50% bonus damage
    [TIMING_RATING.GOOD]: 1.25,     // 25% bonus damage
    [TIMING_RATING.OK]: 1.1,        // 10% bonus damage
    [TIMING_RATING.MISS]: 1.0,      // No bonus
  },
  defend: {
    [TIMING_RATING.PERFECT]: 0.25,  // Take only 25% damage
    [TIMING_RATING.GOOD]: 0.5,      // Take 50% damage
    [TIMING_RATING.OK]: 0.75,       // Take 75% damage
    [TIMING_RATING.MISS]: 1.0,      // Full damage
  },
  counter: {
    [TIMING_RATING.PERFECT]: 0.5,   // Reflect 50% damage
    [TIMING_RATING.GOOD]: 0.25,     // Reflect 25% damage
    [TIMING_RATING.OK]: 0.1,        // Reflect 10% damage
    [TIMING_RATING.MISS]: 0,        // No reflection
  },
  charge: {
    [TIMING_RATING.PERFECT]: 3,     // Triple charge
    [TIMING_RATING.GOOD]: 2,        // Double charge
    [TIMING_RATING.OK]: 1.5,        // 1.5x charge
    [TIMING_RATING.MISS]: 1,        // Base charge
  },
};

/**
 * Difficulty modifiers for timing windows
 */
export const DIFFICULTY_MODIFIERS = {
  easy: 1.5,      // 50% wider windows
  normal: 1.0,    // Standard windows
  hard: 0.75,     // 25% narrower windows
  expert: 0.5,    // 50% narrower windows
};

/**
 * Create a timed hit challenge
 * @param {Object} options - Challenge options
 * @param {string} options.type - Hit type (attack, defend, counter, charge)
 * @param {number} options.duration - Total duration in ms (default 1000)
 * @param {number} options.optimalTime - When to hit (default middle)
 * @param {string} options.difficulty - Difficulty level
 * @param {Object} options.customWindows - Custom timing windows
 * @returns {Object} Timed hit challenge
 */
export function createTimedHitChallenge(options = {}) {
  const {
    type = HIT_TYPE.ATTACK,
    duration = 1000,
    optimalTime = null,
    difficulty = 'normal',
    customWindows = null,
  } = options;

  const safeDuration = Math.max(500, Math.min(3000, duration));
  const safeOptimalTime = optimalTime ?? safeDuration / 2;

  // Apply difficulty modifier to windows
  const modifier = DIFFICULTY_MODIFIERS[difficulty] || 1.0;
  const baseWindows = customWindows || DEFAULT_WINDOWS;
  const windows = {
    perfect: Math.round(baseWindows.perfect * modifier),
    good: Math.round(baseWindows.good * modifier),
    ok: Math.round(baseWindows.ok * modifier),
  };

  return {
    type,
    duration: safeDuration,
    optimalTime: safeOptimalTime,
    windows,
    difficulty,
    startTime: null,
    inputTime: null,
    rating: null,
    completed: false,
  };
}

/**
 * Start a timed hit challenge
 * @param {Object} challenge - The challenge to start
 * @param {number} timestamp - Start timestamp
 * @returns {Object} Updated challenge
 */
export function startChallenge(challenge, timestamp = Date.now()) {
  if (!challenge) return createTimedHitChallenge();

  return {
    ...challenge,
    startTime: timestamp,
    inputTime: null,
    rating: null,
    completed: false,
  };
}

/**
 * Process player input for a challenge
 * @param {Object} challenge - The active challenge
 * @param {number} inputTimestamp - When the player pressed the button
 * @returns {Object} Result with rating and bonus
 */
export function processInput(challenge, inputTimestamp) {
  if (!challenge || !challenge.startTime || challenge.completed) {
    return {
      challenge: challenge || createTimedHitChallenge(),
      rating: TIMING_RATING.MISS,
      bonus: getBonus(challenge?.type || HIT_TYPE.ATTACK, TIMING_RATING.MISS),
      timeDelta: 0,
    };
  }

  const elapsed = inputTimestamp - challenge.startTime;
  const timeDelta = elapsed - challenge.optimalTime;
  const absoluteDelta = Math.abs(timeDelta);

  const rating = calculateRating(absoluteDelta, challenge.windows);
  const bonus = getBonus(challenge.type, rating);

  return {
    challenge: {
      ...challenge,
      inputTime: inputTimestamp,
      rating,
      completed: true,
    },
    rating,
    bonus,
    timeDelta,
  };
}

/**
 * Check if challenge timed out (no input received)
 * @param {Object} challenge - The challenge
 * @param {number} currentTime - Current timestamp
 * @returns {boolean} Whether challenge has timed out
 */
export function isTimedOut(challenge, currentTime) {
  if (!challenge || !challenge.startTime) return false;
  return currentTime - challenge.startTime > challenge.duration;
}

/**
 * Get timeout result
 * @param {Object} challenge - The challenge
 * @returns {Object} Timeout result
 */
export function getTimeoutResult(challenge) {
  const type = challenge?.type || HIT_TYPE.ATTACK;
  return {
    challenge: {
      ...challenge,
      rating: TIMING_RATING.MISS,
      completed: true,
    },
    rating: TIMING_RATING.MISS,
    bonus: getBonus(type, TIMING_RATING.MISS),
    timeDelta: challenge?.duration || 0,
  };
}

/**
 * Calculate timing rating based on delta
 * @param {number} absoluteDelta - Absolute time difference from optimal
 * @param {Object} windows - Timing windows
 * @returns {string} Timing rating
 */
export function calculateRating(absoluteDelta, windows) {
  const safeWindows = windows || DEFAULT_WINDOWS;

  if (absoluteDelta <= safeWindows.perfect) {
    return TIMING_RATING.PERFECT;
  }
  if (absoluteDelta <= safeWindows.good) {
    return TIMING_RATING.GOOD;
  }
  if (absoluteDelta <= safeWindows.ok) {
    return TIMING_RATING.OK;
  }
  return TIMING_RATING.MISS;
}

/**
 * Get bonus multiplier for a rating
 * @param {string} type - Hit type
 * @param {string} rating - Timing rating
 * @returns {number} Bonus multiplier
 */
export function getBonus(type, rating) {
  const bonuses = RATING_BONUSES[type] || RATING_BONUSES.attack;
  return bonuses[rating] ?? (type === HIT_TYPE.ATTACK ? 1.0 : 0);
}

/**
 * Apply attack timing bonus to damage
 * @param {number} baseDamage - Base damage value
 * @param {string} rating - Timing rating
 * @returns {Object} Damage result
 */
export function applyAttackTiming(baseDamage, rating) {
  const bonus = getBonus(HIT_TYPE.ATTACK, rating);
  const damage = Math.floor(baseDamage * bonus);
  const bonusDamage = damage - baseDamage;

  return {
    damage,
    bonusDamage,
    multiplier: bonus,
    rating,
    isCritical: rating === TIMING_RATING.PERFECT,
  };
}

/**
 * Apply defend timing bonus to incoming damage
 * @param {number} incomingDamage - Damage before defense
 * @param {string} rating - Timing rating
 * @returns {Object} Defense result
 */
export function applyDefendTiming(incomingDamage, rating) {
  const multiplier = getBonus(HIT_TYPE.DEFEND, rating);
  const reducedDamage = Math.floor(incomingDamage * multiplier);
  const damageBlocked = incomingDamage - reducedDamage;

  return {
    damage: reducedDamage,
    damageBlocked,
    multiplier,
    rating,
    isPerfectBlock: rating === TIMING_RATING.PERFECT,
  };
}

/**
 * Apply counter timing for damage reflection
 * @param {number} incomingDamage - Damage to potentially reflect
 * @param {string} rating - Timing rating
 * @returns {Object} Counter result
 */
export function applyCounterTiming(incomingDamage, rating) {
  const reflectRate = getBonus(HIT_TYPE.COUNTER, rating);
  const reflectedDamage = Math.floor(incomingDamage * reflectRate);

  return {
    reflectedDamage,
    reflectRate,
    rating,
    isSuccessful: reflectedDamage > 0,
  };
}

/**
 * Get progress percentage for UI animation
 * @param {Object} challenge - Active challenge
 * @param {number} currentTime - Current timestamp
 * @returns {number} Progress 0-100
 */
export function getChallengeProgress(challenge, currentTime) {
  if (!challenge || !challenge.startTime) return 0;

  const elapsed = currentTime - challenge.startTime;
  const progress = (elapsed / challenge.duration) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Get optimal timing position for UI
 * @param {Object} challenge - Challenge object
 * @returns {number} Optimal position as percentage 0-100
 */
export function getOptimalPosition(challenge) {
  if (!challenge) return 50;
  return (challenge.optimalTime / challenge.duration) * 100;
}

/**
 * Get timing feedback message
 * @param {string} rating - Timing rating
 * @param {string} type - Hit type
 * @returns {string} Feedback message
 */
export function getTimingFeedback(rating, type = HIT_TYPE.ATTACK) {
  const feedbackMap = {
    [HIT_TYPE.ATTACK]: {
      [TIMING_RATING.PERFECT]: 'Perfect timing! Critical hit!',
      [TIMING_RATING.GOOD]: 'Good timing! Bonus damage!',
      [TIMING_RATING.OK]: 'OK timing. Small bonus.',
      [TIMING_RATING.MISS]: 'Missed the timing!',
    },
    [HIT_TYPE.DEFEND]: {
      [TIMING_RATING.PERFECT]: 'Perfect guard! Minimal damage!',
      [TIMING_RATING.GOOD]: 'Good block! Reduced damage.',
      [TIMING_RATING.OK]: 'Partial block. Some damage taken.',
      [TIMING_RATING.MISS]: 'Failed to guard!',
    },
    [HIT_TYPE.COUNTER]: {
      [TIMING_RATING.PERFECT]: 'Perfect counter! Damage reflected!',
      [TIMING_RATING.GOOD]: 'Counter! Partial reflection.',
      [TIMING_RATING.OK]: 'Weak counter. Minor reflection.',
      [TIMING_RATING.MISS]: 'Counter failed!',
    },
    [HIT_TYPE.CHARGE]: {
      [TIMING_RATING.PERFECT]: 'Maximum charge!',
      [TIMING_RATING.GOOD]: 'Strong charge!',
      [TIMING_RATING.OK]: 'Moderate charge.',
      [TIMING_RATING.MISS]: 'Charge incomplete.',
    },
  };

  const typeFeedback = feedbackMap[type] || feedbackMap[HIT_TYPE.ATTACK];
  return typeFeedback[rating] || 'Timing complete.';
}

/**
 * Check if a rating is successful (better than miss)
 * @param {string} rating - Timing rating
 * @returns {boolean} Whether the timing was successful
 */
export function isSuccessfulTiming(rating) {
  return rating === TIMING_RATING.PERFECT ||
         rating === TIMING_RATING.GOOD ||
         rating === TIMING_RATING.OK;
}

/**
 * Get rating color for UI
 * @param {string} rating - Timing rating
 * @returns {string} CSS color
 */
export function getRatingColor(rating) {
  switch (rating) {
    case TIMING_RATING.PERFECT:
      return '#ffd700'; // Gold
    case TIMING_RATING.GOOD:
      return '#00ff00'; // Green
    case TIMING_RATING.OK:
      return '#ffff00'; // Yellow
    case TIMING_RATING.MISS:
    default:
      return '#ff4444'; // Red
  }
}

/**
 * Create a sequence of timed hits (for multi-hit attacks)
 * @param {number} count - Number of hits in sequence
 * @param {Object} options - Challenge options
 * @returns {Array} Array of challenges
 */
export function createHitSequence(count, options = {}) {
  const safeCount = Math.max(1, Math.min(10, count));
  const sequence = [];

  for (let i = 0; i < safeCount; i++) {
    // Each subsequent hit is slightly faster
    const speedModifier = 1 - (i * 0.05);
    const duration = Math.max(400, (options.duration || 800) * speedModifier);

    sequence.push(createTimedHitChallenge({
      ...options,
      duration: Math.round(duration),
    }));
  }

  return sequence;
}

/**
 * Calculate total bonus from a hit sequence
 * @param {Array} results - Array of hit results
 * @returns {Object} Combined results
 */
export function calculateSequenceBonus(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return { totalBonus: 1, perfectCount: 0, averageRating: TIMING_RATING.MISS };
  }

  let totalMultiplier = 0;
  let perfectCount = 0;

  results.forEach(result => {
    totalMultiplier += result.bonus || 1;
    if (result.rating === TIMING_RATING.PERFECT) {
      perfectCount++;
    }
  });

  const averageMultiplier = totalMultiplier / results.length;

  // Bonus for all perfects
  const allPerfectBonus = perfectCount === results.length ? 1.25 : 1;

  return {
    totalBonus: averageMultiplier * allPerfectBonus,
    perfectCount,
    hitCount: results.length,
    allPerfect: perfectCount === results.length,
  };
}
