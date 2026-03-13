/**
 * Pet System - Collectible cosmetic pets
 * Pets follow players, can be displayed, and provide minor passive bonuses
 */

// Pet species
export const PET_SPECIES = {
  CAT: { id: 'cat', name: 'Cat', icon: '🐱', baseRarity: 'common' },
  DOG: { id: 'dog', name: 'Dog', icon: '🐕', baseRarity: 'common' },
  BIRD: { id: 'bird', name: 'Bird', icon: '🐦', baseRarity: 'common' },
  TURTLE: { id: 'turtle', name: 'Turtle', icon: '🐢', baseRarity: 'uncommon' },
  FOX: { id: 'fox', name: 'Fox', icon: '🦊', baseRarity: 'uncommon' },
  OWL: { id: 'owl', name: 'Owl', icon: '🦉', baseRarity: 'uncommon' },
  WOLF: { id: 'wolf', name: 'Wolf', icon: '🐺', baseRarity: 'rare' },
  BEAR: { id: 'bear', name: 'Bear', icon: '🐻', baseRarity: 'rare' },
  TIGER: { id: 'tiger', name: 'Tiger', icon: '🐯', baseRarity: 'epic' },
  DRAGON: { id: 'dragon', name: 'Dragon', icon: '🐉', baseRarity: 'legendary' },
  UNICORN: { id: 'unicorn', name: 'Unicorn', icon: '🦄', baseRarity: 'legendary' },
  SLIME: { id: 'slime', name: 'Slime', icon: '🟢', baseRarity: 'common' }
};

// Pet rarities
export const PET_RARITIES = {
  COMMON: { id: 'common', name: 'Common', color: '#9e9e9e', dropRate: 0.50, bonusMultiplier: 1.0 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#4caf50', dropRate: 0.30, bonusMultiplier: 1.25 },
  RARE: { id: 'rare', name: 'Rare', color: '#2196f3', dropRate: 0.15, bonusMultiplier: 1.5 },
  EPIC: { id: 'epic', name: 'Epic', color: '#9c27b0', dropRate: 0.04, bonusMultiplier: 2.0 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#ff9800', dropRate: 0.01, bonusMultiplier: 3.0 }
};

// Pet passive bonuses
export const PET_BONUSES = {
  LUCK: { id: 'luck', name: 'Lucky Find', description: 'Increases item drop rate', maxValue: 10 },
  SPEED: { id: 'speed', name: 'Swift Pace', description: 'Increases movement speed', maxValue: 15 },
  XP: { id: 'xp', name: 'Experience Boost', description: 'Increases XP gained', maxValue: 20 },
  GOLD: { id: 'gold', name: 'Gold Sense', description: 'Increases gold drops', maxValue: 15 },
  HEALTH_REGEN: { id: 'health_regen', name: 'Healing Aura', description: 'Regenerates health over time', maxValue: 5 },
  MANA_REGEN: { id: 'mana_regen', name: 'Mystic Aura', description: 'Regenerates mana over time', maxValue: 5 }
};

// Pet activities
export const PET_ACTIVITIES = {
  IDLE: { id: 'idle', name: 'Idle', animation: 'idle' },
  FOLLOWING: { id: 'following', name: 'Following', animation: 'walk' },
  PLAYING: { id: 'playing', name: 'Playing', animation: 'play' },
  SLEEPING: { id: 'sleeping', name: 'Sleeping', animation: 'sleep' },
  EATING: { id: 'eating', name: 'Eating', animation: 'eat' }
};

// Pet moods
export const PET_MOODS = {
  JOYFUL: { id: 'joyful', name: 'Joyful', icon: '😊', bonusMultiplier: 1.5 },
  HAPPY: { id: 'happy', name: 'Happy', icon: '🙂', bonusMultiplier: 1.25 },
  CONTENT: { id: 'content', name: 'Content', icon: '😐', bonusMultiplier: 1.0 },
  SAD: { id: 'sad', name: 'Sad', icon: '😢', bonusMultiplier: 0.75 },
  ANGRY: { id: 'angry', name: 'Angry', icon: '😠', bonusMultiplier: 0.5 }
};

/**
 * Initialize pet system state
 */
export function initPetState(state) {
  return {
    state: {
      ...state,
      pets: {
        collection: [],
        activePet: null,
        favorites: [],
        stats: {
          totalCollected: 0,
          totalReleased: 0,
          totalTreatsGiven: 0
        },
        settings: {
          showPet: true,
          petScale: 1.0,
          followDistance: 2
        }
      }
    },
    success: true
  };
}

/**
 * Generate a unique pet ID
 */
function generatePetId() {
  return `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new pet
 */
export function createPet(speciesId, rarityOverride = null) {
  const species = Object.values(PET_SPECIES).find(s => s.id === speciesId);
  if (!species) {
    return { success: false, error: 'Invalid species' };
  }

  const rarity = rarityOverride
    ? Object.values(PET_RARITIES).find(r => r.id === rarityOverride)
    : Object.values(PET_RARITIES).find(r => r.id === species.baseRarity);

  if (!rarity) {
    return { success: false, error: 'Invalid rarity' };
  }

  // Assign random bonus based on rarity
  const bonusTypes = Object.values(PET_BONUSES);
  const primaryBonus = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
  const bonusValue = Math.ceil(primaryBonus.maxValue * rarity.bonusMultiplier * (0.5 + Math.random() * 0.5));

  const pet = {
    id: generatePetId(),
    species: species.id,
    speciesName: species.name,
    icon: species.icon,
    rarity: rarity.id,
    rarityName: rarity.name,
    rarityColor: rarity.color,
    name: `${species.name}`,
    nickname: null,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    happiness: 100,
    hunger: 0,
    mood: PET_MOODS.HAPPY.id,
    activity: PET_ACTIVITIES.IDLE.id,
    primaryBonus: {
      type: primaryBonus.id,
      name: primaryBonus.name,
      value: bonusValue
    },
    stats: {
      timeOwned: 0,
      treatsFed: 0,
      timesPlayed: 0
    },
    obtainedAt: Date.now(),
    lastInteraction: Date.now()
  };

  return { success: true, pet };
}

/**
 * Add pet to collection
 */
export function addPetToCollection(state, pet) {
  if (!pet || !pet.id) {
    return { success: false, error: 'Invalid pet' };
  }

  const exists = state.pets.collection.some(p => p.id === pet.id);
  if (exists) {
    return { success: false, error: 'Pet already in collection' };
  }

  const newCollection = [...state.pets.collection, pet];
  const newStats = {
    ...state.pets.stats,
    totalCollected: state.pets.stats.totalCollected + 1
  };

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        collection: newCollection,
        stats: newStats
      }
    },
    pet
  };
}

/**
 * Remove pet from collection (release)
 */
export function releasePet(state, petId) {
  const petIndex = state.pets.collection.findIndex(p => p.id === petId);
  if (petIndex === -1) {
    return { success: false, error: 'Pet not found' };
  }

  const pet = state.pets.collection[petIndex];
  const newCollection = state.pets.collection.filter(p => p.id !== petId);
  const newFavorites = state.pets.favorites.filter(id => id !== petId);
  const newActivePet = state.pets.activePet === petId ? null : state.pets.activePet;
  const newStats = {
    ...state.pets.stats,
    totalReleased: state.pets.stats.totalReleased + 1
  };

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        collection: newCollection,
        favorites: newFavorites,
        activePet: newActivePet,
        stats: newStats
      }
    },
    releasedPet: pet
  };
}

/**
 * Set active pet
 */
export function setActivePet(state, petId) {
  if (petId !== null) {
    const pet = state.pets.collection.find(p => p.id === petId);
    if (!pet) {
      return { success: false, error: 'Pet not found' };
    }
  }

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        activePet: petId
      }
    }
  };
}

/**
 * Get active pet
 */
export function getActivePet(state) {
  if (!state.pets.activePet) {
    return { found: false, pet: null };
  }

  const pet = state.pets.collection.find(p => p.id === state.pets.activePet);
  return pet ? { found: true, pet } : { found: false, pet: null };
}

/**
 * Rename pet (set nickname)
 */
export function renamePet(state, petId, nickname) {
  const petIndex = state.pets.collection.findIndex(p => p.id === petId);
  if (petIndex === -1) {
    return { success: false, error: 'Pet not found' };
  }

  if (!nickname || nickname.trim().length === 0) {
    return { success: false, error: 'Invalid nickname' };
  }

  if (nickname.length > 20) {
    return { success: false, error: 'Nickname too long' };
  }

  const updatedPet = {
    ...state.pets.collection[petIndex],
    nickname: nickname.trim()
  };

  const newCollection = [...state.pets.collection];
  newCollection[petIndex] = updatedPet;

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        collection: newCollection
      }
    },
    pet: updatedPet
  };
}

/**
 * Feed pet a treat
 */
export function feedPet(state, petId, treatValue = 10) {
  const petIndex = state.pets.collection.findIndex(p => p.id === petId);
  if (petIndex === -1) {
    return { success: false, error: 'Pet not found' };
  }

  const pet = state.pets.collection[petIndex];
  const newHunger = Math.max(0, pet.hunger - treatValue);
  const happinessGain = Math.min(20, treatValue);
  const newHappiness = Math.min(100, pet.happiness + happinessGain);
  const expGain = Math.floor(treatValue / 2);

  let newLevel = pet.level;
  let newExp = pet.experience + expGain;
  let newExpToNext = pet.experienceToNextLevel;

  // Level up check
  while (newExp >= newExpToNext) {
    newExp -= newExpToNext;
    newLevel++;
    newExpToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
  }

  const updatedPet = {
    ...pet,
    hunger: newHunger,
    happiness: newHappiness,
    level: newLevel,
    experience: newExp,
    experienceToNextLevel: newExpToNext,
    mood: getMoodFromHappiness(newHappiness),
    stats: {
      ...pet.stats,
      treatsFed: pet.stats.treatsFed + 1
    },
    lastInteraction: Date.now()
  };

  const newCollection = [...state.pets.collection];
  newCollection[petIndex] = updatedPet;

  const newStats = {
    ...state.pets.stats,
    totalTreatsGiven: state.pets.stats.totalTreatsGiven + 1
  };

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        collection: newCollection,
        stats: newStats
      }
    },
    pet: updatedPet,
    expGained: expGain,
    leveledUp: newLevel > pet.level
  };
}

/**
 * Play with pet
 */
export function playWithPet(state, petId) {
  const petIndex = state.pets.collection.findIndex(p => p.id === petId);
  if (petIndex === -1) {
    return { success: false, error: 'Pet not found' };
  }

  const pet = state.pets.collection[petIndex];
  const happinessGain = 15;
  const hungerGain = 5;
  const expGain = 10;

  const newHappiness = Math.min(100, pet.happiness + happinessGain);
  const newHunger = Math.min(100, pet.hunger + hungerGain);

  let newLevel = pet.level;
  let newExp = pet.experience + expGain;
  let newExpToNext = pet.experienceToNextLevel;

  while (newExp >= newExpToNext) {
    newExp -= newExpToNext;
    newLevel++;
    newExpToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
  }

  const updatedPet = {
    ...pet,
    happiness: newHappiness,
    hunger: newHunger,
    level: newLevel,
    experience: newExp,
    experienceToNextLevel: newExpToNext,
    mood: getMoodFromHappiness(newHappiness),
    activity: PET_ACTIVITIES.PLAYING.id,
    stats: {
      ...pet.stats,
      timesPlayed: pet.stats.timesPlayed + 1
    },
    lastInteraction: Date.now()
  };

  const newCollection = [...state.pets.collection];
  newCollection[petIndex] = updatedPet;

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        collection: newCollection
      }
    },
    pet: updatedPet,
    expGained: expGain,
    leveledUp: newLevel > pet.level
  };
}

/**
 * Get mood from happiness value
 */
function getMoodFromHappiness(happiness) {
  if (happiness >= 90) return PET_MOODS.JOYFUL.id;
  if (happiness >= 70) return PET_MOODS.HAPPY.id;
  if (happiness >= 40) return PET_MOODS.CONTENT.id;
  if (happiness >= 20) return PET_MOODS.SAD.id;
  return PET_MOODS.ANGRY.id;
}

/**
 * Toggle pet as favorite
 */
export function toggleFavorite(state, petId) {
  const pet = state.pets.collection.find(p => p.id === petId);
  if (!pet) {
    return { success: false, error: 'Pet not found' };
  }

  const isFavorite = state.pets.favorites.includes(petId);
  const newFavorites = isFavorite
    ? state.pets.favorites.filter(id => id !== petId)
    : [...state.pets.favorites, petId];

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        favorites: newFavorites
      }
    },
    isFavorite: !isFavorite
  };
}

/**
 * Get collection stats
 */
export function getCollectionStats(state) {
  const collection = state.pets.collection;

  const byRarity = {};
  const bySpecies = {};

  Object.values(PET_RARITIES).forEach(r => {
    byRarity[r.id] = 0;
  });

  Object.values(PET_SPECIES).forEach(s => {
    bySpecies[s.id] = 0;
  });

  collection.forEach(pet => {
    byRarity[pet.rarity]++;
    bySpecies[pet.species]++;
  });

  const totalPossible = Object.keys(PET_SPECIES).length * Object.keys(PET_RARITIES).length;
  const uniqueCombinations = new Set(collection.map(p => `${p.species}_${p.rarity}`)).size;

  return {
    totalPets: collection.length,
    byRarity,
    bySpecies,
    uniqueCombinations,
    totalPossible,
    completionPercent: Math.round((uniqueCombinations / totalPossible) * 100),
    favoriteCount: state.pets.favorites.length,
    stats: state.pets.stats
  };
}

/**
 * Get pets by filter
 */
export function getPetsByFilter(state, filter = {}) {
  let pets = [...state.pets.collection];

  if (filter.species) {
    pets = pets.filter(p => p.species === filter.species);
  }

  if (filter.rarity) {
    pets = pets.filter(p => p.rarity === filter.rarity);
  }

  if (filter.minLevel) {
    pets = pets.filter(p => p.level >= filter.minLevel);
  }

  if (filter.favoritesOnly) {
    pets = pets.filter(p => state.pets.favorites.includes(p.id));
  }

  // Sort options
  if (filter.sortBy) {
    switch (filter.sortBy) {
      case 'level':
        pets.sort((a, b) => b.level - a.level);
        break;
      case 'happiness':
        pets.sort((a, b) => b.happiness - a.happiness);
        break;
      case 'rarity':
        const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
        pets.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
        break;
      case 'name':
        pets.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
        break;
      case 'newest':
        pets.sort((a, b) => b.obtainedAt - a.obtainedAt);
        break;
      case 'oldest':
        pets.sort((a, b) => a.obtainedAt - b.obtainedAt);
        break;
    }
  }

  return {
    pets,
    count: pets.length
  };
}

/**
 * Calculate active pet bonus
 */
export function getActivePetBonus(state) {
  const activePet = getActivePet(state);
  if (!activePet.found) {
    return { hasBonus: false, bonuses: {} };
  }

  const pet = activePet.pet;
  const mood = Object.values(PET_MOODS).find(m => m.id === pet.mood);
  const moodMultiplier = mood ? mood.bonusMultiplier : 1.0;

  const levelMultiplier = 1 + (pet.level - 1) * 0.05;
  const finalValue = Math.round(pet.primaryBonus.value * moodMultiplier * levelMultiplier);

  return {
    hasBonus: true,
    bonuses: {
      [pet.primaryBonus.type]: finalValue
    },
    pet: pet,
    moodMultiplier,
    levelMultiplier
  };
}

/**
 * Update pet settings
 */
export function updatePetSettings(state, settings) {
  const validSettings = {};

  if (typeof settings.showPet === 'boolean') {
    validSettings.showPet = settings.showPet;
  }

  if (typeof settings.petScale === 'number') {
    validSettings.petScale = Math.max(0.5, Math.min(2.0, settings.petScale));
  }

  if (typeof settings.followDistance === 'number') {
    validSettings.followDistance = Math.max(1, Math.min(5, settings.followDistance));
  }

  return {
    success: true,
    state: {
      ...state,
      pets: {
        ...state.pets,
        settings: {
          ...state.pets.settings,
          ...validSettings
        }
      }
    }
  };
}

/**
 * Simulate pet idle behavior (hunger increases, happiness decreases)
 */
export function tickPetState(state, deltaMinutes = 1) {
  if (state.pets.collection.length === 0) {
    return { state, updated: false };
  }

  const hungerRate = 0.5; // per minute
  const happinessDecayRate = 0.2; // per minute

  const newCollection = state.pets.collection.map(pet => {
    const newHunger = Math.min(100, pet.hunger + (hungerRate * deltaMinutes));
    let newHappiness = pet.happiness - (happinessDecayRate * deltaMinutes);

    // Extra happiness decay when hungry
    if (newHunger > 50) {
      newHappiness -= (hungerRate * deltaMinutes * 0.5);
    }

    newHappiness = Math.max(0, newHappiness);

    return {
      ...pet,
      hunger: newHunger,
      happiness: newHappiness,
      mood: getMoodFromHappiness(newHappiness),
      stats: {
        ...pet.stats,
        timeOwned: pet.stats.timeOwned + deltaMinutes
      }
    };
  });

  return {
    state: {
      ...state,
      pets: {
        ...state.pets,
        collection: newCollection
      }
    },
    updated: true
  };
}

/**
 * Get all species info
 */
export function getAllSpecies() {
  return Object.values(PET_SPECIES);
}

/**
 * Get all rarities info
 */
export function getAllRarities() {
  return Object.values(PET_RARITIES);
}

/**
 * Get pet display name
 */
export function getPetDisplayName(pet) {
  return pet.nickname || pet.name;
}
