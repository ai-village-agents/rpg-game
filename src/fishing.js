/**
 * Fishing Minigame System
 * Available at Southeast Dock location
 * Players can catch fish and rare items to sell or use in cooking
 */

// Fish data with rarity tiers
export const FISH_DATA = {
  // Common fish (60% chance total)
  smallPerch: {
    id: 'smallPerch',
    name: 'Small Perch',
    rarity: 'Common',
    value: 3,
    description: 'A modest catch, but it fills the belly.',
    weight: 1,
    difficulty: 1
  },
  riverTrout: {
    id: 'riverTrout',
    name: 'River Trout',
    rarity: 'Common',
    value: 5,
    description: 'A shimmering trout from the village river.',
    weight: 2,
    difficulty: 2
  },
  muddyCatfish: {
    id: 'muddyCatfish',
    name: 'Muddy Catfish',
    rarity: 'Common',
    value: 4,
    description: 'Pulled from the murky riverbed.',
    weight: 3,
    difficulty: 2
  },
  // Uncommon fish (25% chance total)
  silverBass: {
    id: 'silverBass',
    name: 'Silver Bass',
    rarity: 'Uncommon',
    value: 12,
    description: 'Its scales glint like polished coins.',
    weight: 4,
    difficulty: 4
  },
  shadowPike: {
    id: 'shadowPike',
    name: 'Shadow Pike',
    rarity: 'Uncommon',
    value: 15,
    description: 'A predator from the deep, dark waters.',
    weight: 5,
    difficulty: 5
  },
  goldenCarp: {
    id: 'goldenCarp',
    name: 'Golden Carp',
    rarity: 'Uncommon',
    value: 18,
    description: 'Said to bring good fortune to whoever catches one.',
    weight: 3,
    difficulty: 5
  },
  // Rare fish (12% chance total)
  crystalSalmon: {
    id: 'crystalSalmon',
    name: 'Crystal Salmon',
    rarity: 'Rare',
    value: 30,
    description: 'Translucent flesh that glows faintly in moonlight. Prized for its delicate roe.',
    weight: 6,
    difficulty: 7
  },
  stormEel: {
    id: 'stormEel',
    name: 'Storm Eel',
    rarity: 'Rare',
    value: 35,
    description: 'Crackles with residual lightning energy.',
    weight: 4,
    difficulty: 8
  },
  // Epic fish (3% chance total)
  abyssalLeviathan: {
    id: 'abyssalLeviathan',
    name: 'Abyssal Leviathan',
    rarity: 'Epic',
    value: 75,
    description: 'A terrifying deep-water predator. Most anglers never see one.',
    weight: 15,
    difficulty: 9
  },
  prismaticKoi: {
    id: 'prismaticKoi',
    name: 'Prismatic Koi',
    rarity: 'Epic',
    value: 80,
    description: 'Changes color as it moves. Highly sought by collectors.',
    weight: 5,
    difficulty: 9
  },
  // Rare collectibles
  salmonRoe: {
    id: 'salmonRoe',
    name: 'Salmon Roe',
    rarity: 'Rare',
    value: 40,
    description: 'Glistening orange pearls harvested from Crystal Salmon. A culinary delicacy.',
    weight: 1,
    difficulty: 0,
    isMaterial: true
  },
  goldenCaviar: {
    id: 'goldenCaviar',
    name: 'Golden Caviar',
    rarity: 'Epic',
    value: 100,
    description: 'The rarest delicacy in the realm, worth a small fortune to the right buyer.',
    weight: 1,
    difficulty: 0,
    isMaterial: true
  }
};

// Fishing spots with different fish pools
export const FISHING_SPOTS = {
  village_dock: {
    id: 'village_dock',
    name: 'Village Dock',
    location: 'southeast_dock',
    description: 'A weathered wooden dock extending over calm waters.',
    fishPool: [
      { fishId: 'smallPerch', weight: 30 },
      { fishId: 'riverTrout', weight: 20 },
      { fishId: 'muddyCatfish', weight: 15 },
      { fishId: 'silverBass', weight: 12 },
      { fishId: 'goldenCarp', weight: 10 },
      { fishId: 'crystalSalmon', weight: 7 },
      { fishId: 'stormEel', weight: 4 },
      { fishId: 'prismaticKoi', weight: 2 }
    ],
    baitBonus: { worm: 1.2, minnow: 1.5, glowbait: 2.0 }
  },
  marsh_shallows: {
    id: 'marsh_shallows',
    name: 'Marsh Shallows',
    location: 'southwest_marsh',
    description: 'Murky waters teeming with strange creatures.',
    fishPool: [
      { fishId: 'muddyCatfish', weight: 25 },
      { fishId: 'shadowPike', weight: 20 },
      { fishId: 'stormEel', weight: 15 },
      { fishId: 'smallPerch', weight: 15 },
      { fishId: 'silverBass', weight: 10 },
      { fishId: 'crystalSalmon', weight: 8 },
      { fishId: 'abyssalLeviathan', weight: 5 },
      { fishId: 'prismaticKoi', weight: 2 }
    ],
    baitBonus: { worm: 1.1, minnow: 1.3, glowbait: 2.5 }
  }
};

// Bait types
export const BAIT_TYPES = {
  worm: {
    id: 'worm',
    name: 'Earthworm',
    value: 2,
    description: 'Basic fishing bait. Works for most common fish.',
    rarityBonus: 0
  },
  minnow: {
    id: 'minnow',
    name: 'Live Minnow',
    value: 8,
    description: 'Attracts larger, more aggressive fish.',
    rarityBonus: 0.1
  },
  glowbait: {
    id: 'glowbait',
    name: 'Glowbait',
    value: 25,
    description: 'Luminescent bait that draws rare deep-water species.',
    rarityBonus: 0.25
  }
};

/**
 * Initialize fishing state
 */
export function initFishingState() {
  return {
    active: false,
    currentSpot: null,
    bait: null,
    castTime: 0,
    fishOnLine: null,
    tension: 0,
    maxTension: 100,
    reelProgress: 0,
    targetProgress: 100,
    phase: 'idle', // idle, waiting, hooked, reeling, caught, escaped
    totalCaught: 0,
    fishLog: {},    // { fishId: count }
    bestCatch: null,
    streak: 0
  };
}

/**
 * Start fishing at a spot
 */
export function startFishing(state, spotId, baitId) {
  const spot = FISHING_SPOTS[spotId];
  if (!spot) return { ...state, fishingState: state.fishingState || initFishingState() };

  const bait = baitId ? BAIT_TYPES[baitId] : null;
  const fishingState = {
    ...(state.fishingState || initFishingState()),
    active: true,
    currentSpot: spotId,
    bait: baitId || null,
    phase: 'waiting',
    castTime: Date.now(),
    tension: 0,
    reelProgress: 0,
    fishOnLine: null
  };

  return { ...state, fishingState };
}

/**
 * Select which fish bites based on weighted random + bait bonus
 */
export function selectFish(spotId, baitId) {
  const spot = FISHING_SPOTS[spotId];
  if (!spot) return null;

  const pool = spot.fishPool;
  const baitMultiplier = (baitId && spot.baitBonus[baitId]) ? spot.baitBonus[baitId] : 1.0;
  const bait = baitId ? BAIT_TYPES[baitId] : null;
  const rarityBonus = bait ? bait.rarityBonus : 0;

  // Apply bait bonus to rarer fish weights
  const adjustedPool = pool.map(entry => {
    const fish = FISH_DATA[entry.fishId];
    let weight = entry.weight;
    if (fish && (fish.rarity === 'Rare' || fish.rarity === 'Epic')) {
      weight = Math.round(weight * baitMultiplier);
    }
    return { ...entry, weight };
  });

  const totalWeight = adjustedPool.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of adjustedPool) {
    roll -= entry.weight;
    if (roll <= 0) {
      return FISH_DATA[entry.fishId];
    }
  }

  return FISH_DATA[pool[0].fishId]; // fallback
}

/**
 * Hook a fish (transition from waiting to hooked)
 */
export function hookFish(state) {
  if (!state.fishingState || state.fishingState.phase !== 'waiting') return state;

  const fish = selectFish(state.fishingState.currentSpot, state.fishingState.bait);
  if (!fish) return state;

  const fishingState = {
    ...state.fishingState,
    phase: 'hooked',
    fishOnLine: fish,
    tension: 20,
    reelProgress: 0
  };

  return { ...state, fishingState };
}

/**
 * Reel action - increases progress but also tension
 */
export function reelIn(state) {
  if (!state.fishingState || state.fishingState.phase !== 'hooked') return state;

  const fish = state.fishingState.fishOnLine;
  if (!fish) return state;

  const difficulty = fish.difficulty || 1;
  const progressGain = Math.max(5, 20 - difficulty * 2);
  const tensionGain = 8 + difficulty * 3;

  let newProgress = state.fishingState.reelProgress + progressGain;
  let newTension = state.fishingState.tension + tensionGain;

  // Check if line snaps
  if (newTension >= state.fishingState.maxTension) {
    return {
      ...state,
      fishingState: {
        ...state.fishingState,
        phase: 'escaped',
        tension: newTension,
        fishOnLine: fish,
        streak: 0
      }
    };
  }

  // Check if caught
  if (newProgress >= state.fishingState.targetProgress) {
    const newStreak = state.fishingState.streak + 1;
    const newTotal = state.fishingState.totalCaught + 1;
    const fishLog = { ...state.fishingState.fishLog };
    fishLog[fish.id] = (fishLog[fish.id] || 0) + 1;

    // Bonus material drops
    const bonusDrops = [];
    if (fish.id === 'crystalSalmon' && Math.random() < 0.3) {
      bonusDrops.push(FISH_DATA.salmonRoe);
    }
    if (fish.id === 'prismaticKoi' && Math.random() < 0.1) {
      bonusDrops.push(FISH_DATA.goldenCaviar);
    }

    return {
      ...state,
      fishingState: {
        ...state.fishingState,
        phase: 'caught',
        reelProgress: newProgress,
        tension: newTension,
        totalCaught: newTotal,
        fishLog,
        streak: newStreak,
        bestCatch: (!state.fishingState.bestCatch || fish.value > (FISH_DATA[state.fishingState.bestCatch]?.value || 0)) ? fish.id : state.fishingState.bestCatch,
        bonusDrops: bonusDrops.length > 0 ? bonusDrops : undefined
      }
    };
  }

  return {
    ...state,
    fishingState: {
      ...state.fishingState,
      reelProgress: newProgress,
      tension: newTension
    }
  };
}

/**
 * Wait/rest action - decreases tension but fish may struggle
 */
export function waitAction(state) {
  if (!state.fishingState || state.fishingState.phase !== 'hooked') return state;

  const fish = state.fishingState.fishOnLine;
  const difficulty = fish ? fish.difficulty : 1;
  const tensionDrop = Math.max(5, 15 - difficulty);
  const progressLoss = Math.min(state.fishingState.reelProgress, difficulty * 2);

  return {
    ...state,
    fishingState: {
      ...state.fishingState,
      tension: Math.max(0, state.fishingState.tension - tensionDrop),
      reelProgress: Math.max(0, state.fishingState.reelProgress - progressLoss)
    }
  };
}

/**
 * Stop fishing
 */
export function stopFishing(state) {
  if (!state.fishingState) return state;

  return {
    ...state,
    fishingState: {
      ...state.fishingState,
      active: false,
      phase: 'idle',
      currentSpot: null,
      fishOnLine: null,
      tension: 0,
      reelProgress: 0
    }
  };
}

/**
 * Get fishing summary for display
 */
export function getFishingSummary(fishingState) {
  if (!fishingState) return null;

  const caughtTypes = Object.keys(fishingState.fishLog || {});
  const totalTypes = Object.keys(FISH_DATA).filter(k => !FISH_DATA[k].isMaterial).length;

  return {
    totalCaught: fishingState.totalCaught || 0,
    uniqueTypes: caughtTypes.length,
    totalTypes,
    bestCatch: fishingState.bestCatch ? FISH_DATA[fishingState.bestCatch]?.name : 'None',
    currentStreak: fishingState.streak || 0,
    completionPercent: Math.round((caughtTypes.length / totalTypes) * 100)
  };
}

/**
 * Get the value of a fish, applying streak bonus
 */
export function getFishValue(fish, streak) {
  if (!fish) return 0;
  const baseValue = fish.value || 0;
  const streakBonus = Math.min(streak || 0, 10) * 0.05; // max 50% bonus
  return Math.round(baseValue * (1 + streakBonus));
}
