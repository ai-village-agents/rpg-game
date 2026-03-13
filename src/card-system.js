/**
 * Card Collection System
 * Collect cards, build decks, and use cards in combat
 */

// Card rarities
export const CARD_RARITIES = {
  COMMON: { name: 'Common', color: '#9E9E9E', dropRate: 0.50, dustValue: 5 },
  UNCOMMON: { name: 'Uncommon', color: '#4CAF50', dropRate: 0.30, dustValue: 20 },
  RARE: { name: 'Rare', color: '#2196F3', dropRate: 0.15, dustValue: 100 },
  EPIC: { name: 'Epic', color: '#9C27B0', dropRate: 0.04, dustValue: 400 },
  LEGENDARY: { name: 'Legendary', color: '#FF9800', dropRate: 0.01, dustValue: 1600 }
};

// Card types
export const CARD_TYPES = {
  ATTACK: { name: 'Attack', icon: '⚔️', description: 'Deals damage to enemies' },
  DEFENSE: { name: 'Defense', icon: '🛡️', description: 'Protects from damage' },
  SPELL: { name: 'Spell', icon: '✨', description: 'Magical effects' },
  BUFF: { name: 'Buff', icon: '⬆️', description: 'Enhances stats' },
  DEBUFF: { name: 'Debuff', icon: '⬇️', description: 'Weakens enemies' },
  HEAL: { name: 'Heal', icon: '💚', description: 'Restores health' },
  UTILITY: { name: 'Utility', icon: '🔧', description: 'Special effects' },
  SUMMON: { name: 'Summon', icon: '👾', description: 'Summons creatures' }
};

// Card elements
export const CARD_ELEMENTS = {
  NEUTRAL: { name: 'Neutral', color: '#888888' },
  FIRE: { name: 'Fire', color: '#F44336' },
  WATER: { name: 'Water', color: '#2196F3' },
  EARTH: { name: 'Earth', color: '#795548' },
  AIR: { name: 'Air', color: '#03A9F4' },
  LIGHT: { name: 'Light', color: '#FFEB3B' },
  DARK: { name: 'Dark', color: '#4A148C' }
};

// Deck constraints
export const DECK_RULES = {
  minCards: 20,
  maxCards: 40,
  maxCopies: 3,
  maxLegendaries: 1
};

// Create initial card collection state
export function createCardState() {
  return {
    collection: {},
    decks: [],
    activeDeck: null,
    dust: 0,
    packHistory: [],
    stats: {
      cardsCollected: 0,
      packsOpened: 0,
      decksBuilt: 0,
      cardsPlayed: 0,
      totalDustEarned: 0
    },
    favorites: []
  };
}

// Create a card definition
export function createCard(id, name, type, rarity, element, cost, effect) {
  if (!id || !name) {
    return { success: false, error: 'Invalid card id or name' };
  }

  if (!CARD_TYPES[type?.toUpperCase()]) {
    return { success: false, error: 'Invalid card type' };
  }

  if (!CARD_RARITIES[rarity?.toUpperCase()]) {
    return { success: false, error: 'Invalid rarity' };
  }

  if (!CARD_ELEMENTS[element?.toUpperCase()]) {
    return { success: false, error: 'Invalid element' };
  }

  if (cost < 0 || cost > 10) {
    return { success: false, error: 'Cost must be between 0 and 10' };
  }

  return {
    success: true,
    card: {
      id,
      name,
      type: type.toUpperCase(),
      rarity: rarity.toUpperCase(),
      element: element.toUpperCase(),
      cost,
      effect,
      createdAt: Date.now()
    }
  };
}

// Create a card registry
export function createCardRegistry() {
  return {
    cards: {},
    byType: {},
    byRarity: {},
    byElement: {}
  };
}

// Register a card
export function registerCard(registry, card) {
  if (!card || !card.id) {
    return { success: false, error: 'Invalid card' };
  }

  if (registry.cards[card.id]) {
    return { success: false, error: 'Card already registered' };
  }

  const newCards = { ...registry.cards, [card.id]: card };

  // Index by type
  const newByType = { ...registry.byType };
  newByType[card.type] = [...(newByType[card.type] || []), card.id];

  // Index by rarity
  const newByRarity = { ...registry.byRarity };
  newByRarity[card.rarity] = [...(newByRarity[card.rarity] || []), card.id];

  // Index by element
  const newByElement = { ...registry.byElement };
  newByElement[card.element] = [...(newByElement[card.element] || []), card.id];

  return {
    success: true,
    registry: {
      cards: newCards,
      byType: newByType,
      byRarity: newByRarity,
      byElement: newByElement
    }
  };
}

// Add card to collection
export function addCardToCollection(state, cardId, count = 1) {
  if (!cardId || count <= 0) {
    return { success: false, error: 'Invalid card or count' };
  }

  const currentCount = state.collection[cardId] || 0;
  const newCount = currentCount + count;

  const isNewCard = currentCount === 0;

  return {
    success: true,
    isNewCard,
    newCount,
    state: {
      ...state,
      collection: {
        ...state.collection,
        [cardId]: newCount
      },
      stats: {
        ...state.stats,
        cardsCollected: state.stats.cardsCollected + (isNewCard ? 1 : 0)
      }
    }
  };
}

// Remove card from collection
export function removeCardFromCollection(state, cardId, count = 1) {
  const currentCount = state.collection[cardId] || 0;

  if (currentCount < count) {
    return { success: false, error: 'Not enough cards' };
  }

  const newCount = currentCount - count;
  const newCollection = { ...state.collection };

  if (newCount === 0) {
    delete newCollection[cardId];
  } else {
    newCollection[cardId] = newCount;
  }

  return {
    success: true,
    newCount,
    state: {
      ...state,
      collection: newCollection
    }
  };
}

// Get card count in collection
export function getCardCount(state, cardId) {
  return state.collection[cardId] || 0;
}

// Disenchant card for dust
export function disenchantCard(state, registry, cardId, count = 1) {
  const currentCount = state.collection[cardId] || 0;

  if (currentCount < count) {
    return { success: false, error: 'Not enough cards' };
  }

  const card = registry.cards[cardId];
  if (!card) {
    return { success: false, error: 'Card not found in registry' };
  }

  const rarity = CARD_RARITIES[card.rarity];
  const dustGained = rarity.dustValue * count;

  const result = removeCardFromCollection(state, cardId, count);
  if (!result.success) return result;

  return {
    success: true,
    dustGained,
    state: {
      ...result.state,
      dust: result.state.dust + dustGained,
      stats: {
        ...result.state.stats,
        totalDustEarned: result.state.stats.totalDustEarned + dustGained
      }
    }
  };
}

// Craft card with dust
export function craftCard(state, registry, cardId) {
  const card = registry.cards[cardId];
  if (!card) {
    return { success: false, error: 'Card not found' };
  }

  const rarity = CARD_RARITIES[card.rarity];
  const craftCost = rarity.dustValue * 4; // Crafting costs 4x disenchant value

  if (state.dust < craftCost) {
    return { success: false, error: 'Not enough dust', required: craftCost };
  }

  const addResult = addCardToCollection(state, cardId);
  if (!addResult.success) return addResult;

  return {
    success: true,
    dustSpent: craftCost,
    state: {
      ...addResult.state,
      dust: addResult.state.dust - craftCost
    }
  };
}

// Get crafting cost
export function getCraftCost(registry, cardId) {
  const card = registry.cards[cardId];
  if (!card) return null;

  const rarity = CARD_RARITIES[card.rarity];
  return rarity.dustValue * 4;
}

// Open card pack
export function openCardPack(state, registry, packType = 'standard') {
  const cards = Object.values(registry.cards);
  if (cards.length === 0) {
    return { success: false, error: 'No cards in registry' };
  }

  const packSize = 5;
  const pulledCards = [];

  for (let i = 0; i < packSize; i++) {
    // Guaranteed at least one uncommon or better in each pack (last card)
    const guaranteeRare = i === packSize - 1;
    const card = rollForCard(cards, guaranteeRare);
    pulledCards.push(card);
  }

  // Add cards to collection
  let newState = { ...state };
  const cardResults = [];

  for (const card of pulledCards) {
    const result = addCardToCollection(newState, card.id);
    if (result.success) {
      newState = result.state;
      cardResults.push({
        card,
        isNew: result.isNewCard,
        newCount: result.newCount
      });
    }
  }

  // Track pack opening
  const packEntry = {
    type: packType,
    cards: pulledCards.map(c => c.id),
    timestamp: Date.now()
  };

  return {
    success: true,
    cards: cardResults,
    state: {
      ...newState,
      packHistory: [...newState.packHistory.slice(-49), packEntry],
      stats: {
        ...newState.stats,
        packsOpened: newState.stats.packsOpened + 1
      }
    }
  };
}

// Roll for a random card
function rollForCard(cards, guaranteeRare = false) {
  const roll = Math.random();

  let minRarity = 'COMMON';
  if (guaranteeRare || roll > 0.8) {
    minRarity = 'UNCOMMON';
  }

  // Filter cards by minimum rarity
  const rarityOrder = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  const minIndex = rarityOrder.indexOf(minRarity);
  const eligibleCards = cards.filter(c => rarityOrder.indexOf(c.rarity) >= minIndex);

  if (eligibleCards.length === 0) {
    return cards[Math.floor(Math.random() * cards.length)];
  }

  // Weight by rarity drop rate
  let weightedPool = [];
  for (const card of eligibleCards) {
    const rarity = CARD_RARITIES[card.rarity];
    const weight = Math.max(1, Math.floor((1 / rarity.dropRate) * 10));
    for (let i = 0; i < weight; i++) {
      weightedPool.push(card);
    }
  }

  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

// Create a new deck
export function createDeck(state, name) {
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Invalid deck name' };
  }

  if (state.decks.some(d => d.name === name)) {
    return { success: false, error: 'Deck name already exists' };
  }

  const deck = {
    id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    cards: [],
    createdAt: Date.now(),
    lastModified: Date.now()
  };

  return {
    success: true,
    deck,
    state: {
      ...state,
      decks: [...state.decks, deck],
      stats: {
        ...state.stats,
        decksBuilt: state.stats.decksBuilt + 1
      }
    }
  };
}

// Delete a deck
export function deleteDeck(state, deckId) {
  const deckIndex = state.decks.findIndex(d => d.id === deckId);
  if (deckIndex === -1) {
    return { success: false, error: 'Deck not found' };
  }

  const newDecks = state.decks.filter(d => d.id !== deckId);
  let newActiveDeck = state.activeDeck;

  if (state.activeDeck === deckId) {
    newActiveDeck = newDecks.length > 0 ? newDecks[0].id : null;
  }

  return {
    success: true,
    state: {
      ...state,
      decks: newDecks,
      activeDeck: newActiveDeck
    }
  };
}

// Add card to deck
export function addCardToDeck(state, deckId, cardId) {
  const deckIndex = state.decks.findIndex(d => d.id === deckId);
  if (deckIndex === -1) {
    return { success: false, error: 'Deck not found' };
  }

  const deck = state.decks[deckIndex];

  // Check max deck size
  if (deck.cards.length >= DECK_RULES.maxCards) {
    return { success: false, error: 'Deck is full' };
  }

  // Check max copies
  const cardCount = deck.cards.filter(c => c === cardId).length;
  if (cardCount >= DECK_RULES.maxCopies) {
    return { success: false, error: `Maximum ${DECK_RULES.maxCopies} copies allowed` };
  }

  // Check if card is in collection
  if (getCardCount(state, cardId) <= cardCount) {
    return { success: false, error: 'Not enough copies in collection' };
  }

  const newDeck = {
    ...deck,
    cards: [...deck.cards, cardId],
    lastModified: Date.now()
  };

  const newDecks = [...state.decks];
  newDecks[deckIndex] = newDeck;

  return {
    success: true,
    state: {
      ...state,
      decks: newDecks
    }
  };
}

// Remove card from deck
export function removeCardFromDeck(state, deckId, cardId) {
  const deckIndex = state.decks.findIndex(d => d.id === deckId);
  if (deckIndex === -1) {
    return { success: false, error: 'Deck not found' };
  }

  const deck = state.decks[deckIndex];
  const cardIndex = deck.cards.indexOf(cardId);

  if (cardIndex === -1) {
    return { success: false, error: 'Card not in deck' };
  }

  const newCards = [...deck.cards];
  newCards.splice(cardIndex, 1);

  const newDeck = {
    ...deck,
    cards: newCards,
    lastModified: Date.now()
  };

  const newDecks = [...state.decks];
  newDecks[deckIndex] = newDeck;

  return {
    success: true,
    state: {
      ...state,
      decks: newDecks
    }
  };
}

// Set active deck
export function setActiveDeck(state, deckId) {
  if (!state.decks.some(d => d.id === deckId)) {
    return { success: false, error: 'Deck not found' };
  }

  return {
    success: true,
    state: {
      ...state,
      activeDeck: deckId
    }
  };
}

// Get active deck
export function getActiveDeck(state) {
  if (!state.activeDeck) return null;
  return state.decks.find(d => d.id === state.activeDeck) || null;
}

// Validate deck
export function validateDeck(deck, registry) {
  const errors = [];

  if (deck.cards.length < DECK_RULES.minCards) {
    errors.push(`Deck needs at least ${DECK_RULES.minCards} cards`);
  }

  if (deck.cards.length > DECK_RULES.maxCards) {
    errors.push(`Deck cannot exceed ${DECK_RULES.maxCards} cards`);
  }

  // Check card copies
  const cardCounts = {};
  let legendaryCount = 0;

  for (const cardId of deck.cards) {
    cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;

    const card = registry.cards[cardId];
    if (card && card.rarity === 'LEGENDARY') {
      legendaryCount++;
    }
  }

  for (const [cardId, count] of Object.entries(cardCounts)) {
    if (count > DECK_RULES.maxCopies) {
      const card = registry.cards[cardId];
      errors.push(`${card?.name || cardId}: max ${DECK_RULES.maxCopies} copies`);
    }
  }

  // Check legendary limit per unique card
  const uniqueLegendaries = {};
  for (const cardId of deck.cards) {
    const card = registry.cards[cardId];
    if (card && card.rarity === 'LEGENDARY') {
      if (uniqueLegendaries[cardId]) {
        errors.push(`Legendary cards limited to ${DECK_RULES.maxLegendaries} copy`);
      }
      uniqueLegendaries[cardId] = true;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cardCount: deck.cards.length,
    uniqueCards: Object.keys(cardCounts).length
  };
}

// Get deck stats
export function getDeckStats(deck, registry) {
  const stats = {
    totalCards: deck.cards.length,
    byType: {},
    byRarity: {},
    byElement: {},
    avgCost: 0
  };

  let totalCost = 0;

  for (const cardId of deck.cards) {
    const card = registry.cards[cardId];
    if (!card) continue;

    stats.byType[card.type] = (stats.byType[card.type] || 0) + 1;
    stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
    stats.byElement[card.element] = (stats.byElement[card.element] || 0) + 1;
    totalCost += card.cost;
  }

  stats.avgCost = deck.cards.length > 0 ? Math.round((totalCost / deck.cards.length) * 10) / 10 : 0;

  return stats;
}

// Toggle favorite card
export function toggleFavorite(state, cardId) {
  const isFavorite = state.favorites.includes(cardId);

  return {
    isFavorite: !isFavorite,
    state: {
      ...state,
      favorites: isFavorite
        ? state.favorites.filter(f => f !== cardId)
        : [...state.favorites, cardId]
    }
  };
}

// Get favorite cards
export function getFavorites(state) {
  return [...state.favorites];
}

// Get collection stats
export function getCollectionStats(state, registry) {
  const totalCards = Object.keys(registry.cards).length;
  const ownedCards = Object.keys(state.collection).length;
  const totalCopies = Object.values(state.collection).reduce((a, b) => a + b, 0);

  const byRarity = {};
  const byElement = {};
  const byType = {};

  for (const cardId of Object.keys(state.collection)) {
    const card = registry.cards[cardId];
    if (!card) continue;

    byRarity[card.rarity] = (byRarity[card.rarity] || 0) + 1;
    byElement[card.element] = (byElement[card.element] || 0) + 1;
    byType[card.type] = (byType[card.type] || 0) + 1;
  }

  return {
    totalCards,
    ownedCards,
    completionPercent: totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0,
    totalCopies,
    dust: state.dust,
    byRarity,
    byElement,
    byType
  };
}

// Search cards
export function searchCards(registry, query) {
  const lowerQuery = query.toLowerCase();

  return Object.values(registry.cards).filter(card => {
    return card.name.toLowerCase().includes(lowerQuery) ||
           card.type.toLowerCase().includes(lowerQuery) ||
           card.element.toLowerCase().includes(lowerQuery);
  });
}

// Filter cards
export function filterCards(registry, filters = {}) {
  let cards = Object.values(registry.cards);

  if (filters.type) {
    const typeKey = filters.type.toUpperCase();
    cards = cards.filter(c => c.type === typeKey);
  }

  if (filters.rarity) {
    const rarityKey = filters.rarity.toUpperCase();
    cards = cards.filter(c => c.rarity === rarityKey);
  }

  if (filters.element) {
    const elementKey = filters.element.toUpperCase();
    cards = cards.filter(c => c.element === elementKey);
  }

  if (filters.maxCost !== undefined) {
    cards = cards.filter(c => c.cost <= filters.maxCost);
  }

  if (filters.minCost !== undefined) {
    cards = cards.filter(c => c.cost >= filters.minCost);
  }

  return cards;
}

// Get card rarity info
export function getRarityInfo(rarity) {
  return CARD_RARITIES[rarity?.toUpperCase()] || null;
}

// Get card type info
export function getTypeInfo(type) {
  return CARD_TYPES[type?.toUpperCase()] || null;
}

// Get element info
export function getElementInfo(element) {
  return CARD_ELEMENTS[element?.toUpperCase()] || null;
}

// Record card played
export function recordCardPlayed(state) {
  return {
    ...state,
    stats: {
      ...state.stats,
      cardsPlayed: state.stats.cardsPlayed + 1
    }
  };
}
