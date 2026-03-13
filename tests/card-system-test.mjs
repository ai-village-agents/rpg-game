/**
 * Card System Tests
 * Tests for card collection, deck building, and pack opening
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  CARD_RARITIES,
  CARD_TYPES,
  CARD_ELEMENTS,
  DECK_RULES,
  createCardState,
  createCard,
  createCardRegistry,
  registerCard,
  addCardToCollection,
  removeCardFromCollection,
  getCardCount,
  disenchantCard,
  craftCard,
  getCraftCost,
  openCardPack,
  createDeck,
  deleteDeck,
  addCardToDeck,
  removeCardFromDeck,
  setActiveDeck,
  getActiveDeck,
  validateDeck,
  getDeckStats,
  toggleFavorite,
  getFavorites,
  getCollectionStats,
  searchCards,
  filterCards,
  getRarityInfo,
  getTypeInfo,
  getElementInfo,
  recordCardPlayed
} from '../src/card-system.js';

// Helper to create test cards
function createTestCard(id, name, type = 'ATTACK', rarity = 'COMMON', element = 'FIRE', cost = 2) {
  const result = createCard(id, name, type, rarity, element, cost, 'Test effect');
  return result.card;
}

// Helper to create registry with test cards
function createTestRegistry() {
  let registry = createCardRegistry();
  const testCards = [
    createTestCard('card_1', 'Fire Strike', 'ATTACK', 'COMMON', 'FIRE', 2),
    createTestCard('card_2', 'Water Shield', 'DEFENSE', 'UNCOMMON', 'WATER', 3),
    createTestCard('card_3', 'Earth Slam', 'ATTACK', 'RARE', 'EARTH', 4),
    createTestCard('card_4', 'Wind Fury', 'SPELL', 'EPIC', 'AIR', 5),
    createTestCard('card_5', 'Light Beam', 'ATTACK', 'LEGENDARY', 'LIGHT', 6),
    createTestCard('card_6', 'Dark Void', 'DEBUFF', 'COMMON', 'DARK', 1),
    createTestCard('card_7', 'Healing Touch', 'HEAL', 'UNCOMMON', 'LIGHT', 3),
    createTestCard('card_8', 'Summon Wolf', 'SUMMON', 'RARE', 'NEUTRAL', 4)
  ];

  for (const card of testCards) {
    const result = registerCard(registry, card);
    if (result.success) registry = result.registry;
  }

  return registry;
}

// ============================================
// Constants Tests
// ============================================
describe('Card System Constants', () => {
  test('CARD_RARITIES has all rarities', () => {
    assert.ok(CARD_RARITIES.COMMON);
    assert.ok(CARD_RARITIES.UNCOMMON);
    assert.ok(CARD_RARITIES.RARE);
    assert.ok(CARD_RARITIES.EPIC);
    assert.ok(CARD_RARITIES.LEGENDARY);
    assert.strictEqual(Object.keys(CARD_RARITIES).length, 5);
  });

  test('rarities have required properties', () => {
    for (const [key, rarity] of Object.entries(CARD_RARITIES)) {
      assert.ok(rarity.name, `${key} should have name`);
      assert.ok(rarity.color, `${key} should have color`);
      assert.ok(typeof rarity.dropRate === 'number', `${key} should have dropRate`);
      assert.ok(typeof rarity.dustValue === 'number', `${key} should have dustValue`);
    }
  });

  test('drop rates sum to 1', () => {
    const totalDropRate = Object.values(CARD_RARITIES).reduce((sum, r) => sum + r.dropRate, 0);
    assert.strictEqual(totalDropRate, 1);
  });

  test('CARD_TYPES has all types', () => {
    assert.ok(CARD_TYPES.ATTACK);
    assert.ok(CARD_TYPES.DEFENSE);
    assert.ok(CARD_TYPES.SPELL);
    assert.ok(CARD_TYPES.BUFF);
    assert.ok(CARD_TYPES.DEBUFF);
    assert.ok(CARD_TYPES.HEAL);
    assert.ok(CARD_TYPES.UTILITY);
    assert.ok(CARD_TYPES.SUMMON);
    assert.strictEqual(Object.keys(CARD_TYPES).length, 8);
  });

  test('card types have required properties', () => {
    for (const [key, type] of Object.entries(CARD_TYPES)) {
      assert.ok(type.name, `${key} should have name`);
      assert.ok(type.icon, `${key} should have icon`);
      assert.ok(type.description, `${key} should have description`);
    }
  });

  test('CARD_ELEMENTS has all elements', () => {
    assert.ok(CARD_ELEMENTS.NEUTRAL);
    assert.ok(CARD_ELEMENTS.FIRE);
    assert.ok(CARD_ELEMENTS.WATER);
    assert.ok(CARD_ELEMENTS.EARTH);
    assert.ok(CARD_ELEMENTS.AIR);
    assert.ok(CARD_ELEMENTS.LIGHT);
    assert.ok(CARD_ELEMENTS.DARK);
    assert.strictEqual(Object.keys(CARD_ELEMENTS).length, 7);
  });

  test('DECK_RULES has all constraints', () => {
    assert.strictEqual(DECK_RULES.minCards, 20);
    assert.strictEqual(DECK_RULES.maxCards, 40);
    assert.strictEqual(DECK_RULES.maxCopies, 3);
    assert.strictEqual(DECK_RULES.maxLegendaries, 1);
  });
});

// ============================================
// State Creation Tests
// ============================================
describe('createCardState', () => {
  test('creates initial state', () => {
    const state = createCardState();
    assert.deepStrictEqual(state.collection, {});
    assert.deepStrictEqual(state.decks, []);
    assert.strictEqual(state.activeDeck, null);
    assert.strictEqual(state.dust, 0);
    assert.deepStrictEqual(state.packHistory, []);
    assert.deepStrictEqual(state.favorites, []);
  });

  test('creates initial stats', () => {
    const state = createCardState();
    assert.strictEqual(state.stats.cardsCollected, 0);
    assert.strictEqual(state.stats.packsOpened, 0);
    assert.strictEqual(state.stats.decksBuilt, 0);
    assert.strictEqual(state.stats.cardsPlayed, 0);
    assert.strictEqual(state.stats.totalDustEarned, 0);
  });
});

describe('createCardRegistry', () => {
  test('creates empty registry', () => {
    const registry = createCardRegistry();
    assert.deepStrictEqual(registry.cards, {});
    assert.deepStrictEqual(registry.byType, {});
    assert.deepStrictEqual(registry.byRarity, {});
    assert.deepStrictEqual(registry.byElement, {});
  });
});

// ============================================
// Card Creation Tests
// ============================================
describe('createCard', () => {
  test('creates valid card', () => {
    const result = createCard('card_1', 'Fire Bolt', 'attack', 'common', 'fire', 2, 'Deal 5 damage');
    assert.ok(result.success);
    assert.strictEqual(result.card.id, 'card_1');
    assert.strictEqual(result.card.name, 'Fire Bolt');
    assert.strictEqual(result.card.type, 'ATTACK');
    assert.strictEqual(result.card.rarity, 'COMMON');
    assert.strictEqual(result.card.element, 'FIRE');
    assert.strictEqual(result.card.cost, 2);
    assert.strictEqual(result.card.effect, 'Deal 5 damage');
    assert.ok(result.card.createdAt);
  });

  test('fails without id', () => {
    const result = createCard(null, 'Test', 'attack', 'common', 'fire', 1, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid card id or name');
  });

  test('fails without name', () => {
    const result = createCard('id1', '', 'attack', 'common', 'fire', 1, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid card id or name');
  });

  test('fails with invalid type', () => {
    const result = createCard('id1', 'Test', 'invalid', 'common', 'fire', 1, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid card type');
  });

  test('fails with invalid rarity', () => {
    const result = createCard('id1', 'Test', 'attack', 'invalid', 'fire', 1, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid rarity');
  });

  test('fails with invalid element', () => {
    const result = createCard('id1', 'Test', 'attack', 'common', 'invalid', 1, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid element');
  });

  test('fails with negative cost', () => {
    const result = createCard('id1', 'Test', 'attack', 'common', 'fire', -1, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Cost must be between 0 and 10');
  });

  test('fails with cost over 10', () => {
    const result = createCard('id1', 'Test', 'attack', 'common', 'fire', 11, 'Effect');
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Cost must be between 0 and 10');
  });

  test('accepts cost of 0', () => {
    const result = createCard('id1', 'Free Card', 'attack', 'common', 'fire', 0, 'Effect');
    assert.ok(result.success);
    assert.strictEqual(result.card.cost, 0);
  });

  test('accepts cost of 10', () => {
    const result = createCard('id1', 'Max Cost Card', 'attack', 'legendary', 'fire', 10, 'Effect');
    assert.ok(result.success);
    assert.strictEqual(result.card.cost, 10);
  });
});

// ============================================
// Registry Tests
// ============================================
describe('registerCard', () => {
  test('registers card to registry', () => {
    let registry = createCardRegistry();
    const card = createTestCard('card_1', 'Fire Strike');
    const result = registerCard(registry, card);

    assert.ok(result.success);
    assert.ok(result.registry.cards['card_1']);
    assert.ok(result.registry.byType['ATTACK'].includes('card_1'));
    assert.ok(result.registry.byRarity['COMMON'].includes('card_1'));
    assert.ok(result.registry.byElement['FIRE'].includes('card_1'));
  });

  test('fails with invalid card', () => {
    const registry = createCardRegistry();
    const result = registerCard(registry, null);
    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid card');
  });

  test('fails with duplicate card', () => {
    let registry = createCardRegistry();
    const card = createTestCard('card_1', 'Fire Strike');
    const result1 = registerCard(registry, card);
    const result2 = registerCard(result1.registry, card);

    assert.ok(!result2.success);
    assert.strictEqual(result2.error, 'Card already registered');
  });

  test('indexes multiple cards correctly', () => {
    const registry = createTestRegistry();

    assert.strictEqual(Object.keys(registry.cards).length, 8);
    assert.ok(registry.byType['ATTACK'].length >= 2);
    assert.ok(registry.byRarity['COMMON'].length >= 2);
  });
});

// ============================================
// Collection Tests
// ============================================
describe('addCardToCollection', () => {
  test('adds new card to collection', () => {
    const state = createCardState();
    const result = addCardToCollection(state, 'card_1', 1);

    assert.ok(result.success);
    assert.ok(result.isNewCard);
    assert.strictEqual(result.newCount, 1);
    assert.strictEqual(result.state.collection['card_1'], 1);
    assert.strictEqual(result.state.stats.cardsCollected, 1);
  });

  test('adds multiple copies', () => {
    const state = createCardState();
    const result = addCardToCollection(state, 'card_1', 3);

    assert.ok(result.success);
    assert.ok(result.isNewCard);
    assert.strictEqual(result.newCount, 3);
  });

  test('increments existing card count', () => {
    let state = createCardState();
    let result = addCardToCollection(state, 'card_1', 2);
    result = addCardToCollection(result.state, 'card_1', 3);

    assert.ok(result.success);
    assert.ok(!result.isNewCard);
    assert.strictEqual(result.newCount, 5);
    assert.strictEqual(result.state.stats.cardsCollected, 1);
  });

  test('fails with invalid card id', () => {
    const state = createCardState();
    const result = addCardToCollection(state, null, 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid card or count');
  });

  test('fails with zero count', () => {
    const state = createCardState();
    const result = addCardToCollection(state, 'card_1', 0);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid card or count');
  });
});

describe('removeCardFromCollection', () => {
  test('removes card from collection', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 3).state;
    const result = removeCardFromCollection(state, 'card_1', 1);

    assert.ok(result.success);
    assert.strictEqual(result.newCount, 2);
    assert.strictEqual(result.state.collection['card_1'], 2);
  });

  test('removes card entirely when count reaches 0', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 2).state;
    const result = removeCardFromCollection(state, 'card_1', 2);

    assert.ok(result.success);
    assert.strictEqual(result.newCount, 0);
    assert.ok(!result.state.collection['card_1']);
  });

  test('fails when not enough cards', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 2).state;
    const result = removeCardFromCollection(state, 'card_1', 3);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Not enough cards');
  });

  test('fails for card not in collection', () => {
    const state = createCardState();
    const result = removeCardFromCollection(state, 'card_1', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Not enough cards');
  });
});

describe('getCardCount', () => {
  test('returns card count', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 5).state;

    assert.strictEqual(getCardCount(state, 'card_1'), 5);
  });

  test('returns 0 for card not in collection', () => {
    const state = createCardState();
    assert.strictEqual(getCardCount(state, 'card_1'), 0);
  });
});

// ============================================
// Dust System Tests
// ============================================
describe('disenchantCard', () => {
  test('disenchants card for dust', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 3).state;

    const result = disenchantCard(state, registry, 'card_1', 1);

    assert.ok(result.success);
    assert.strictEqual(result.dustGained, 5); // Common = 5 dust
    assert.strictEqual(result.state.dust, 5);
    assert.strictEqual(result.state.collection['card_1'], 2);
    assert.strictEqual(result.state.stats.totalDustEarned, 5);
  });

  test('disenchants multiple cards', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = addCardToCollection(state, 'card_2', 5).state; // Uncommon = 20 dust

    const result = disenchantCard(state, registry, 'card_2', 3);

    assert.ok(result.success);
    assert.strictEqual(result.dustGained, 60);
    assert.strictEqual(result.state.dust, 60);
  });

  test('fails when not enough cards', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 1).state;

    const result = disenchantCard(state, registry, 'card_1', 2);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Not enough cards');
  });

  test('fails for card not in registry', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = addCardToCollection(state, 'unknown_card', 1).state;

    const result = disenchantCard(state, registry, 'unknown_card', 1);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Card not found in registry');
  });
});

describe('craftCard', () => {
  test('crafts card with dust', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = { ...state, dust: 100 };

    // Common costs 5 * 4 = 20 dust
    const result = craftCard(state, registry, 'card_1');

    assert.ok(result.success);
    assert.strictEqual(result.dustSpent, 20);
    assert.strictEqual(result.state.dust, 80);
    assert.strictEqual(result.state.collection['card_1'], 1);
  });

  test('fails without enough dust', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = { ...state, dust: 10 };

    const result = craftCard(state, registry, 'card_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Not enough dust');
    assert.strictEqual(result.required, 20);
  });

  test('fails for unknown card', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = { ...state, dust: 1000 };

    const result = craftCard(state, registry, 'unknown_card');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Card not found');
  });
});

describe('getCraftCost', () => {
  test('returns correct cost for each rarity', () => {
    const registry = createTestRegistry();

    assert.strictEqual(getCraftCost(registry, 'card_1'), 20);   // Common: 5 * 4
    assert.strictEqual(getCraftCost(registry, 'card_2'), 80);   // Uncommon: 20 * 4
    assert.strictEqual(getCraftCost(registry, 'card_3'), 400);  // Rare: 100 * 4
    assert.strictEqual(getCraftCost(registry, 'card_4'), 1600); // Epic: 400 * 4
    assert.strictEqual(getCraftCost(registry, 'card_5'), 6400); // Legendary: 1600 * 4
  });

  test('returns null for unknown card', () => {
    const registry = createTestRegistry();
    assert.strictEqual(getCraftCost(registry, 'unknown'), null);
  });
});

// ============================================
// Pack Opening Tests
// ============================================
describe('openCardPack', () => {
  test('opens pack and adds cards', () => {
    const registry = createTestRegistry();
    const state = createCardState();

    const result = openCardPack(state, registry);

    assert.ok(result.success);
    assert.strictEqual(result.cards.length, 5);
    assert.strictEqual(result.state.stats.packsOpened, 1);
    assert.ok(result.state.packHistory.length === 1);
  });

  test('tracks new cards', () => {
    const registry = createTestRegistry();
    const state = createCardState();

    const result = openCardPack(state, registry);

    for (const cardResult of result.cards) {
      assert.ok(cardResult.card);
      assert.ok(typeof cardResult.isNew === 'boolean');
      assert.ok(typeof cardResult.newCount === 'number');
    }
  });

  test('fails with empty registry', () => {
    const registry = createCardRegistry();
    const state = createCardState();

    const result = openCardPack(state, registry);

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'No cards in registry');
  });

  test('records pack type in history', () => {
    const registry = createTestRegistry();
    const state = createCardState();

    const result = openCardPack(state, registry, 'premium');

    assert.strictEqual(result.state.packHistory[0].type, 'premium');
  });

  test('limits pack history to 50 entries', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = { ...state, packHistory: Array(50).fill({ type: 'old', cards: [], timestamp: 0 }) };

    const result = openCardPack(state, registry);

    assert.strictEqual(result.state.packHistory.length, 50);
    assert.notStrictEqual(result.state.packHistory[49].type, 'old');
  });
});

// ============================================
// Deck Management Tests
// ============================================
describe('createDeck', () => {
  test('creates new deck', () => {
    const state = createCardState();
    const result = createDeck(state, 'My Deck');

    assert.ok(result.success);
    assert.ok(result.deck.id);
    assert.strictEqual(result.deck.name, 'My Deck');
    assert.deepStrictEqual(result.deck.cards, []);
    assert.ok(result.deck.createdAt);
    assert.strictEqual(result.state.decks.length, 1);
    assert.strictEqual(result.state.stats.decksBuilt, 1);
  });

  test('fails with empty name', () => {
    const state = createCardState();
    const result = createDeck(state, '');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid deck name');
  });

  test('fails with whitespace name', () => {
    const state = createCardState();
    const result = createDeck(state, '   ');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Invalid deck name');
  });

  test('fails with duplicate name', () => {
    let state = createCardState();
    state = createDeck(state, 'My Deck').state;
    const result = createDeck(state, 'My Deck');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Deck name already exists');
  });
});

describe('deleteDeck', () => {
  test('deletes existing deck', () => {
    let state = createCardState();
    const createResult = createDeck(state, 'My Deck');
    state = createResult.state;

    const result = deleteDeck(state, createResult.deck.id);

    assert.ok(result.success);
    assert.strictEqual(result.state.decks.length, 0);
  });

  test('fails for non-existent deck', () => {
    const state = createCardState();
    const result = deleteDeck(state, 'invalid_id');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Deck not found');
  });

  test('clears active deck when deleted', () => {
    let state = createCardState();
    const createResult = createDeck(state, 'My Deck');
    state = setActiveDeck(createResult.state, createResult.deck.id).state;

    const result = deleteDeck(state, createResult.deck.id);

    assert.strictEqual(result.state.activeDeck, null);
  });

  test('switches to first deck when active is deleted', () => {
    let state = createCardState();
    const deck1 = createDeck(state, 'Deck 1');
    state = deck1.state;
    const deck2 = createDeck(state, 'Deck 2');
    state = deck2.state;
    state = setActiveDeck(state, deck2.deck.id).state;

    const result = deleteDeck(state, deck2.deck.id);

    assert.strictEqual(result.state.activeDeck, deck1.deck.id);
  });
});

describe('addCardToDeck', () => {
  test('adds card to deck', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 3).state;
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;

    const result = addCardToDeck(state, deckResult.deck.id, 'card_1');

    assert.ok(result.success);
    const deck = result.state.decks.find(d => d.id === deckResult.deck.id);
    assert.strictEqual(deck.cards.length, 1);
    assert.strictEqual(deck.cards[0], 'card_1');
  });

  test('fails for non-existent deck', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 3).state;

    const result = addCardToDeck(state, 'invalid_id', 'card_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Deck not found');
  });

  test('fails when deck is full', () => {
    let state = createCardState();
    // Add enough cards to collection
    for (let i = 1; i <= 15; i++) {
      state = addCardToCollection(state, `card_${i}`, 3).state;
    }
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;

    // Fill deck to max
    for (let i = 0; i < DECK_RULES.maxCards; i++) {
      const cardNum = (i % 15) + 1;
      const addResult = addCardToDeck(state, deckResult.deck.id, `card_${cardNum}`);
      if (addResult.success) state = addResult.state;
    }

    const result = addCardToDeck(state, deckResult.deck.id, 'card_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Deck is full');
  });

  test('fails when max copies reached', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 5).state;
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;

    // Add max copies
    for (let i = 0; i < DECK_RULES.maxCopies; i++) {
      state = addCardToDeck(state, deckResult.deck.id, 'card_1').state;
    }

    const result = addCardToDeck(state, deckResult.deck.id, 'card_1');

    assert.ok(!result.success);
    assert.ok(result.error.includes('Maximum'));
  });

  test('fails when not enough in collection', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 1).state;
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;
    state = addCardToDeck(state, deckResult.deck.id, 'card_1').state;

    const result = addCardToDeck(state, deckResult.deck.id, 'card_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Not enough copies in collection');
  });
});

describe('removeCardFromDeck', () => {
  test('removes card from deck', () => {
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 3).state;
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;
    state = addCardToDeck(state, deckResult.deck.id, 'card_1').state;

    const result = removeCardFromDeck(state, deckResult.deck.id, 'card_1');

    assert.ok(result.success);
    const deck = result.state.decks.find(d => d.id === deckResult.deck.id);
    assert.strictEqual(deck.cards.length, 0);
  });

  test('fails for non-existent deck', () => {
    const state = createCardState();
    const result = removeCardFromDeck(state, 'invalid_id', 'card_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Deck not found');
  });

  test('fails for card not in deck', () => {
    let state = createCardState();
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;

    const result = removeCardFromDeck(state, deckResult.deck.id, 'card_1');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Card not in deck');
  });
});

describe('setActiveDeck and getActiveDeck', () => {
  test('sets and gets active deck', () => {
    let state = createCardState();
    const deckResult = createDeck(state, 'My Deck');
    state = deckResult.state;

    const setResult = setActiveDeck(state, deckResult.deck.id);
    state = setResult.state;

    assert.ok(setResult.success);
    const activeDeck = getActiveDeck(state);
    assert.strictEqual(activeDeck.id, deckResult.deck.id);
    assert.strictEqual(activeDeck.name, 'My Deck');
  });

  test('fails for non-existent deck', () => {
    const state = createCardState();
    const result = setActiveDeck(state, 'invalid_id');

    assert.ok(!result.success);
    assert.strictEqual(result.error, 'Deck not found');
  });

  test('returns null when no active deck', () => {
    const state = createCardState();
    assert.strictEqual(getActiveDeck(state), null);
  });
});

describe('validateDeck', () => {
  test('validates valid deck', () => {
    const registry = createTestRegistry();
    // Create valid 20-card deck with max 3 copies each, and only 1 legendary (card_5)
    const validDeck = { cards: ['card_1', 'card_2', 'card_3', 'card_4', 'card_5',
                                'card_6', 'card_7', 'card_8', 'card_1', 'card_2',
                                'card_3', 'card_4', 'card_6', 'card_7', 'card_8',
                                'card_1', 'card_2', 'card_3', 'card_4', 'card_6'] };

    const result = validateDeck(validDeck, registry);

    assert.ok(result.isValid);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.cardCount, 20);
  });

  test('fails for too few cards', () => {
    const registry = createTestRegistry();
    const deck = { cards: ['card_1'] };

    const result = validateDeck(deck, registry);

    assert.ok(!result.isValid);
    assert.ok(result.errors.some(e => e.includes('at least')));
  });

  test('fails for too many cards', () => {
    const registry = createTestRegistry();
    const deck = { cards: Array(41).fill('card_1') };

    const result = validateDeck(deck, registry);

    assert.ok(!result.isValid);
    assert.ok(result.errors.some(e => e.includes('exceed')));
  });

  test('fails for too many copies', () => {
    const registry = createTestRegistry();
    const deck = { cards: Array(20).fill('card_1') };

    const result = validateDeck(deck, registry);

    assert.ok(!result.isValid);
    assert.ok(result.errors.some(e => e.includes('max')));
  });

  test('fails for duplicate legendaries', () => {
    const registry = createTestRegistry();
    const deck = { cards: ['card_5', 'card_5', ...Array(18).fill('card_1')] };

    const result = validateDeck(deck, registry);

    assert.ok(!result.isValid);
  });
});

describe('getDeckStats', () => {
  test('calculates deck statistics', () => {
    const registry = createTestRegistry();
    const deck = { cards: ['card_1', 'card_2', 'card_3'] };

    const stats = getDeckStats(deck, registry);

    assert.strictEqual(stats.totalCards, 3);
    assert.ok(stats.byType);
    assert.ok(stats.byRarity);
    assert.ok(stats.byElement);
    assert.ok(typeof stats.avgCost === 'number');
  });

  test('handles empty deck', () => {
    const registry = createTestRegistry();
    const deck = { cards: [] };

    const stats = getDeckStats(deck, registry);

    assert.strictEqual(stats.totalCards, 0);
    assert.strictEqual(stats.avgCost, 0);
  });
});

// ============================================
// Favorites Tests
// ============================================
describe('toggleFavorite and getFavorites', () => {
  test('adds card to favorites', () => {
    const state = createCardState();
    const result = toggleFavorite(state, 'card_1');

    assert.ok(result.isFavorite);
    assert.ok(result.state.favorites.includes('card_1'));
  });

  test('removes card from favorites', () => {
    let state = createCardState();
    state = toggleFavorite(state, 'card_1').state;
    const result = toggleFavorite(state, 'card_1');

    assert.ok(!result.isFavorite);
    assert.ok(!result.state.favorites.includes('card_1'));
  });

  test('gets favorites list', () => {
    let state = createCardState();
    state = toggleFavorite(state, 'card_1').state;
    state = toggleFavorite(state, 'card_2').state;

    const favorites = getFavorites(state);

    assert.strictEqual(favorites.length, 2);
    assert.ok(favorites.includes('card_1'));
    assert.ok(favorites.includes('card_2'));
  });

  test('getFavorites returns a copy', () => {
    let state = createCardState();
    state = toggleFavorite(state, 'card_1').state;

    const favorites = getFavorites(state);
    favorites.push('card_99');

    assert.strictEqual(state.favorites.length, 1);
  });
});

// ============================================
// Collection Stats Tests
// ============================================
describe('getCollectionStats', () => {
  test('calculates collection statistics', () => {
    const registry = createTestRegistry();
    let state = createCardState();
    state = addCardToCollection(state, 'card_1', 3).state;
    state = addCardToCollection(state, 'card_2', 2).state;
    state = { ...state, dust: 500 };

    const stats = getCollectionStats(state, registry);

    assert.strictEqual(stats.totalCards, 8);
    assert.strictEqual(stats.ownedCards, 2);
    assert.strictEqual(stats.totalCopies, 5);
    assert.strictEqual(stats.dust, 500);
    assert.ok(stats.completionPercent >= 0);
    assert.ok(stats.byRarity);
    assert.ok(stats.byElement);
    assert.ok(stats.byType);
  });

  test('handles empty collection', () => {
    const registry = createTestRegistry();
    const state = createCardState();

    const stats = getCollectionStats(state, registry);

    assert.strictEqual(stats.ownedCards, 0);
    assert.strictEqual(stats.totalCopies, 0);
    assert.strictEqual(stats.completionPercent, 0);
  });
});

// ============================================
// Search and Filter Tests
// ============================================
describe('searchCards', () => {
  test('searches by name', () => {
    const registry = createTestRegistry();
    const results = searchCards(registry, 'fire');

    assert.ok(results.length > 0);
    assert.ok(results.some(c => c.name.toLowerCase().includes('fire')));
  });

  test('searches by type', () => {
    const registry = createTestRegistry();
    const results = searchCards(registry, 'attack');

    assert.ok(results.length > 0);
    assert.ok(results.every(c => c.type === 'ATTACK' || c.name.toLowerCase().includes('attack') || c.element.toLowerCase().includes('attack')));
  });

  test('searches by element', () => {
    const registry = createTestRegistry();
    const results = searchCards(registry, 'water');

    assert.ok(results.length > 0);
  });

  test('returns empty for no match', () => {
    const registry = createTestRegistry();
    const results = searchCards(registry, 'xyznonexistent');

    assert.strictEqual(results.length, 0);
  });
});

describe('filterCards', () => {
  test('filters by type', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, { type: 'ATTACK' });

    assert.ok(results.length > 0);
    assert.ok(results.every(c => c.type === 'ATTACK'));
  });

  test('filters by rarity', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, { rarity: 'COMMON' });

    assert.ok(results.length > 0);
    assert.ok(results.every(c => c.rarity === 'COMMON'));
  });

  test('filters by element', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, { element: 'FIRE' });

    assert.ok(results.length > 0);
    assert.ok(results.every(c => c.element === 'FIRE'));
  });

  test('filters by max cost', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, { maxCost: 3 });

    assert.ok(results.length > 0);
    assert.ok(results.every(c => c.cost <= 3));
  });

  test('filters by min cost', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, { minCost: 4 });

    assert.ok(results.length > 0);
    assert.ok(results.every(c => c.cost >= 4));
  });

  test('combines multiple filters', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, { type: 'ATTACK', maxCost: 4 });

    assert.ok(results.every(c => c.type === 'ATTACK' && c.cost <= 4));
  });

  test('returns all cards with no filters', () => {
    const registry = createTestRegistry();
    const results = filterCards(registry, {});

    assert.strictEqual(results.length, 8);
  });
});

// ============================================
// Info Functions Tests
// ============================================
describe('getRarityInfo', () => {
  test('returns rarity info', () => {
    const info = getRarityInfo('common');

    assert.strictEqual(info.name, 'Common');
    assert.ok(info.color);
    assert.ok(typeof info.dropRate === 'number');
    assert.ok(typeof info.dustValue === 'number');
  });

  test('returns null for invalid rarity', () => {
    assert.strictEqual(getRarityInfo('invalid'), null);
    assert.strictEqual(getRarityInfo(null), null);
  });
});

describe('getTypeInfo', () => {
  test('returns type info', () => {
    const info = getTypeInfo('attack');

    assert.strictEqual(info.name, 'Attack');
    assert.ok(info.icon);
    assert.ok(info.description);
  });

  test('returns null for invalid type', () => {
    assert.strictEqual(getTypeInfo('invalid'), null);
    assert.strictEqual(getTypeInfo(null), null);
  });
});

describe('getElementInfo', () => {
  test('returns element info', () => {
    const info = getElementInfo('fire');

    assert.strictEqual(info.name, 'Fire');
    assert.ok(info.color);
  });

  test('returns null for invalid element', () => {
    assert.strictEqual(getElementInfo('invalid'), null);
    assert.strictEqual(getElementInfo(null), null);
  });
});

// ============================================
// Record Card Played Tests
// ============================================
describe('recordCardPlayed', () => {
  test('increments cards played', () => {
    const state = createCardState();
    const result = recordCardPlayed(state);

    assert.strictEqual(result.stats.cardsPlayed, 1);
  });

  test('accumulates over multiple plays', () => {
    let state = createCardState();
    state = recordCardPlayed(state);
    state = recordCardPlayed(state);
    state = recordCardPlayed(state);

    assert.strictEqual(state.stats.cardsPlayed, 3);
  });
});
