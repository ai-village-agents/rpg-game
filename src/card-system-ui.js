/**
 * Card System UI
 * Display cards, collection, and deck building interface
 */

import {
  CARD_RARITIES,
  CARD_TYPES,
  CARD_ELEMENTS,
  DECK_RULES,
  getCardCount,
  getActiveDeck,
  getDeckStats,
  validateDeck,
  getCollectionStats,
  getFavorites
} from './card-system.js';

// HTML escape utility
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render single card
export function renderCard(card, count = 1, isFavorite = false) {
  const rarity = CARD_RARITIES[card.rarity];
  const type = CARD_TYPES[card.type];
  const element = CARD_ELEMENTS[card.element];

  return `
    <div class="card-item rarity-${card.rarity.toLowerCase()}" data-card-id="${escapeHtml(card.id)}">
      <div class="card-header" style="border-color: ${rarity.color}">
        <span class="card-cost">${card.cost}</span>
        <span class="card-name">${escapeHtml(card.name)}</span>
        ${isFavorite ? '<span class="favorite-icon">⭐</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-type">
          <span class="type-icon">${type.icon}</span>
          <span class="type-name">${escapeHtml(type.name)}</span>
        </div>
        <div class="card-element" style="color: ${element.color}">
          ${escapeHtml(element.name)}
        </div>
        <div class="card-effect">
          ${escapeHtml(card.effect || 'No effect')}
        </div>
      </div>
      <div class="card-footer" style="background: ${rarity.color}">
        <span class="card-rarity">${escapeHtml(rarity.name)}</span>
        ${count > 1 ? `<span class="card-count">x${count}</span>` : ''}
      </div>
    </div>
  `;
}

// Render card collection grid
export function renderCollectionGrid(state, registry) {
  const favorites = getFavorites(state);
  const cardIds = Object.keys(state.collection);

  if (cardIds.length === 0) {
    return `
      <div class="collection-grid empty">
        <p class="empty-message">No cards in collection</p>
        <p class="empty-hint">Open packs to get cards!</p>
      </div>
    `;
  }

  const cardElements = cardIds.map(cardId => {
    const card = registry.cards[cardId];
    if (!card) return '';

    const count = state.collection[cardId];
    const isFavorite = favorites.includes(cardId);
    return renderCard(card, count, isFavorite);
  }).join('');

  return `
    <div class="collection-grid">
      ${cardElements}
    </div>
  `;
}

// Render deck builder
export function renderDeckBuilder(state, registry, deckId) {
  const deck = state.decks.find(d => d.id === deckId);
  if (!deck) {
    return '<div class="deck-builder error">Deck not found</div>';
  }

  const validation = validateDeck(deck, registry);
  const stats = getDeckStats(deck, registry);

  // Group cards by count
  const cardCounts = {};
  for (const cardId of deck.cards) {
    cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;
  }

  const deckCardElements = Object.entries(cardCounts).map(([cardId, count]) => {
    const card = registry.cards[cardId];
    if (!card) return '';

    const rarity = CARD_RARITIES[card.rarity];
    return `
      <div class="deck-card-row" data-card-id="${escapeHtml(cardId)}">
        <span class="deck-card-cost" style="background: ${rarity.color}">${card.cost}</span>
        <span class="deck-card-name">${escapeHtml(card.name)}</span>
        <span class="deck-card-count">x${count}</span>
        <button class="remove-card-btn" data-card-id="${escapeHtml(cardId)}">−</button>
      </div>
    `;
  }).join('');

  return `
    <div class="deck-builder">
      <div class="deck-header">
        <h3>${escapeHtml(deck.name)}</h3>
        <span class="deck-card-count">${deck.cards.length}/${DECK_RULES.maxCards}</span>
      </div>

      <div class="deck-validation ${validation.isValid ? 'valid' : 'invalid'}">
        ${validation.isValid ?
          '✅ Deck is valid' :
          `❌ ${validation.errors.join(', ')}`
        }
      </div>

      <div class="deck-stats">
        <span class="stat">Avg Cost: ${stats.avgCost}</span>
        <span class="stat">Unique: ${stats.uniqueCards || Object.keys(cardCounts).length}</span>
      </div>

      <div class="deck-cards-list">
        ${deckCardElements || '<p class="empty-deck">No cards in deck</p>'}
      </div>
    </div>
  `;
}

// Render deck list
export function renderDeckList(state) {
  if (state.decks.length === 0) {
    return `
      <div class="deck-list empty">
        <p class="empty-message">No decks created</p>
      </div>
    `;
  }

  const deckElements = state.decks.map(deck => {
    const isActive = deck.id === state.activeDeck;
    return `
      <div class="deck-list-item ${isActive ? 'active' : ''}" data-deck-id="${escapeHtml(deck.id)}">
        <span class="deck-name">${escapeHtml(deck.name)}</span>
        <span class="deck-count">${deck.cards.length} cards</span>
        ${isActive ? '<span class="active-badge">Active</span>' : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="deck-list">
      <div class="deck-list-header">Your Decks</div>
      ${deckElements}
    </div>
  `;
}

// Render pack opening animation
export function renderPackOpening(cardResults) {
  const cardElements = cardResults.map(result => {
    const card = result.card;
    const rarity = CARD_RARITIES[card.rarity];
    const isNew = result.isNew;

    return `
      <div class="pack-card ${isNew ? 'new-card' : ''}" style="border-color: ${rarity.color}">
        ${renderCard(card, 1)}
        ${isNew ? '<div class="new-badge">NEW!</div>' : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="pack-opening">
      <div class="pack-header">Pack Opened!</div>
      <div class="pack-cards">
        ${cardElements}
      </div>
    </div>
  `;
}

// Render collection stats
export function renderCollectionStatsPanel(state, registry) {
  const stats = getCollectionStats(state, registry);

  const rarityBars = Object.entries(stats.byRarity).map(([rarity, count]) => {
    const rarityInfo = CARD_RARITIES[rarity];
    return `
      <div class="stat-row">
        <span class="stat-label" style="color: ${rarityInfo.color}">${rarityInfo.name}</span>
        <span class="stat-value">${count}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="collection-stats-panel">
      <div class="stats-header">Collection Stats</div>

      <div class="completion-bar">
        <div class="completion-fill" style="width: ${stats.completionPercent}%"></div>
        <span class="completion-text">${stats.completionPercent}% Complete</span>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-number">${stats.ownedCards}</span>
          <span class="stat-label">Unique Cards</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">${stats.totalCopies}</span>
          <span class="stat-label">Total Copies</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">${stats.dust}</span>
          <span class="stat-label">Dust</span>
        </div>
      </div>

      <div class="rarity-breakdown">
        <div class="breakdown-header">By Rarity</div>
        ${rarityBars}
      </div>
    </div>
  `;
}

// Render crafting panel
export function renderCraftingPanel(card, state, craftCost) {
  const ownedCount = getCardCount(state, card.id);
  const canAfford = state.dust >= craftCost;
  const rarity = CARD_RARITIES[card.rarity];

  return `
    <div class="crafting-panel">
      <div class="craft-header">Craft Card</div>
      ${renderCard(card)}
      <div class="craft-info">
        <p>You own: ${ownedCount}</p>
        <p>Craft cost: <span class="dust-cost">${craftCost}</span></p>
        <p>Your dust: <span class="dust-owned">${state.dust}</span></p>
      </div>
      <button class="craft-btn ${canAfford ? '' : 'disabled'}"
              ${canAfford ? '' : 'disabled'}
              data-card-id="${escapeHtml(card.id)}">
        ${canAfford ? 'Craft Card' : 'Not Enough Dust'}
      </button>
    </div>
  `;
}

// Render disenchant panel
export function renderDisenchantPanel(card, count, dustValue) {
  const rarity = CARD_RARITIES[card.rarity];

  return `
    <div class="disenchant-panel">
      <div class="disenchant-header">Disenchant Card</div>
      ${renderCard(card, count)}
      <div class="disenchant-info">
        <p>You own: ${count}</p>
        <p>Dust value: <span class="dust-value">${dustValue}</span> each</p>
      </div>
      <div class="disenchant-options">
        <button class="disenchant-btn" data-card-id="${escapeHtml(card.id)}" data-count="1">
          Disenchant 1 (+${dustValue})
        </button>
        ${count > 1 ? `
          <button class="disenchant-btn" data-card-id="${escapeHtml(card.id)}" data-count="${count}">
            Disenchant All (+${dustValue * count})
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Render filter bar
export function renderCardFilters(activeFilters = {}) {
  const typeOptions = Object.entries(CARD_TYPES).map(([key, type]) => `
    <option value="${key}" ${activeFilters.type === key ? 'selected' : ''}>
      ${type.icon} ${type.name}
    </option>
  `).join('');

  const rarityOptions = Object.entries(CARD_RARITIES).map(([key, rarity]) => `
    <option value="${key}" ${activeFilters.rarity === key ? 'selected' : ''}>
      ${rarity.name}
    </option>
  `).join('');

  const elementOptions = Object.entries(CARD_ELEMENTS).map(([key, element]) => `
    <option value="${key}" ${activeFilters.element === key ? 'selected' : ''}>
      ${element.name}
    </option>
  `).join('');

  return `
    <div class="card-filters">
      <select class="filter-select" data-filter="type">
        <option value="">All Types</option>
        ${typeOptions}
      </select>
      <select class="filter-select" data-filter="rarity">
        <option value="">All Rarities</option>
        ${rarityOptions}
      </select>
      <select class="filter-select" data-filter="element">
        <option value="">All Elements</option>
        ${elementOptions}
      </select>
      <input type="text" class="search-input" placeholder="Search cards..." value="${escapeHtml(activeFilters.search || '')}">
    </div>
  `;
}

// Render full card panel
export function renderCardPanel(state, registry) {
  return `
    <div class="card-panel">
      <div class="card-panel-header">
        <h2>🃏 Cards</h2>
        <div class="dust-display">
          <span class="dust-icon">💎</span>
          <span class="dust-amount">${state.dust}</span>
        </div>
      </div>

      <div class="card-panel-tabs">
        <button class="tab-btn active" data-tab="collection">Collection</button>
        <button class="tab-btn" data-tab="decks">Decks</button>
        <button class="tab-btn" data-tab="packs">Packs</button>
      </div>

      <div class="card-panel-content">
        ${renderCardFilters()}
        ${renderCollectionGrid(state, registry)}
      </div>

      <div class="card-panel-sidebar">
        ${renderCollectionStatsPanel(state, registry)}
      </div>
    </div>
  `;
}

// Generate card CSS styles
export function getCardStyles() {
  return `
    .card-panel {
      background: #1a1a2e;
      border: 2px solid #16213e;
      border-radius: 8px;
      padding: 16px;
      color: #eee;
    }

    .card-item {
      width: 150px;
      background: #16213e;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid;
    }

    .card-header {
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid;
    }

    .card-cost {
      width: 24px;
      height: 24px;
      background: #0f0f23;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .card-name {
      flex: 1;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .card-body {
      padding: 8px;
    }

    .card-type {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .card-effect {
      font-size: 0.8rem;
      color: #aaa;
      margin-top: 8px;
    }

    .card-footer {
      padding: 4px 8px;
      display: flex;
      justify-content: space-between;
      color: #000;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .collection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      padding: 16px 0;
    }

    .deck-builder {
      background: #16213e;
      border-radius: 8px;
      padding: 12px;
    }

    .deck-card-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: #0f0f23;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .deck-card-cost {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: #000;
    }

    .deck-validation {
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;
    }

    .deck-validation.valid {
      background: #1a3a1a;
      color: #4CAF50;
    }

    .deck-validation.invalid {
      background: #3a1a1a;
      color: #f44336;
    }

    .pack-opening {
      text-align: center;
      padding: 20px;
    }

    .pack-cards {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .pack-card {
      position: relative;
      animation: cardReveal 0.5s ease-out;
    }

    .new-badge {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #FFD700;
      color: #000;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 0.8rem;
    }

    @keyframes cardReveal {
      from {
        transform: scale(0) rotateY(180deg);
        opacity: 0;
      }
      to {
        transform: scale(1) rotateY(0);
        opacity: 1;
      }
    }

    .completion-bar {
      position: relative;
      height: 20px;
      background: #0f0f23;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .completion-fill {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.3s;
    }

    .completion-text {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      text-align: center;
      line-height: 20px;
      font-size: 0.8rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .stat-box {
      background: #0f0f23;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: #fff;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #888;
    }

    .card-filters {
      display: flex;
      gap: 8px;
      padding: 12px 0;
      flex-wrap: wrap;
    }

    .filter-select, .search-input {
      background: #0f0f23;
      border: 1px solid #333;
      color: #eee;
      padding: 8px;
      border-radius: 4px;
    }

    .dust-display {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1.2rem;
    }

    .craft-btn, .disenchant-btn {
      background: #4CAF50;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      margin: 4px;
    }

    .craft-btn.disabled {
      background: #555;
      cursor: not-allowed;
    }

    .rarity-common { border-color: #9E9E9E; }
    .rarity-uncommon { border-color: #4CAF50; }
    .rarity-rare { border-color: #2196F3; }
    .rarity-epic { border-color: #9C27B0; }
    .rarity-legendary { border-color: #FF9800; }
  `;
}
