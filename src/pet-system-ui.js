/**
 * Pet System UI - Rendering functions for pet collection and management
 */

import {
  PET_SPECIES,
  PET_RARITIES,
  PET_MOODS,
  PET_ACTIVITIES,
  PET_BONUSES,
  getActivePet,
  getCollectionStats,
  getPetsByFilter,
  getActivePetBonus,
  getPetDisplayName
} from './pet-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Render pet card
 */
export function renderPetCard(pet, options = {}) {
  const { isActive = false, isFavorite = false, showStats = true } = options;
  const displayName = escapeHtml(getPetDisplayName(pet));
  const mood = Object.values(PET_MOODS).find(m => m.id === pet.mood) || PET_MOODS.CONTENT;

  return `
    <div class="pet-card ${isActive ? 'active' : ''} rarity-${pet.rarity}" data-pet-id="${escapeHtml(pet.id)}">
      <div class="pet-card-header">
        <span class="pet-icon">${pet.icon}</span>
        ${isFavorite ? '<span class="favorite-star">⭐</span>' : ''}
      </div>
      <div class="pet-card-body">
        <div class="pet-name">${displayName}</div>
        <div class="pet-species">${escapeHtml(pet.speciesName)}</div>
        <div class="pet-rarity" style="color: ${pet.rarityColor}">${escapeHtml(pet.rarityName)}</div>
        <div class="pet-level">Lv. ${pet.level}</div>
        <div class="pet-mood">
          <span class="mood-icon">${mood.icon}</span>
          <span class="mood-name">${escapeHtml(mood.name)}</span>
        </div>
      </div>
      ${showStats ? `
        <div class="pet-card-stats">
          <div class="stat-bar happiness">
            <span class="stat-label">Happiness</span>
            <div class="bar-fill" style="width: ${pet.happiness}%"></div>
          </div>
          <div class="stat-bar hunger">
            <span class="stat-label">Hunger</span>
            <div class="bar-fill" style="width: ${pet.hunger}%"></div>
          </div>
        </div>
      ` : ''}
      <div class="pet-card-bonus">
        <span class="bonus-label">${escapeHtml(pet.primaryBonus.name)}</span>
        <span class="bonus-value">+${pet.primaryBonus.value}%</span>
      </div>
    </div>
  `;
}

/**
 * Render mini pet display (for HUD)
 */
export function renderMiniPet(state) {
  const activePet = getActivePet(state);
  if (!activePet.found) {
    return '<div class="mini-pet empty">No pet active</div>';
  }

  const pet = activePet.pet;
  const mood = Object.values(PET_MOODS).find(m => m.id === pet.mood) || PET_MOODS.CONTENT;

  return `
    <div class="mini-pet">
      <span class="pet-icon">${pet.icon}</span>
      <span class="pet-mood">${mood.icon}</span>
      <span class="pet-level">Lv.${pet.level}</span>
    </div>
  `;
}

/**
 * Render pet collection grid
 */
export function renderPetCollection(state, filter = {}) {
  const { pets, count } = getPetsByFilter(state, filter);

  if (count === 0) {
    return `
      <div class="pet-collection empty">
        <p>No pets found matching your criteria.</p>
      </div>
    `;
  }

  const petCards = pets.map(pet => {
    const isActive = state.pets.activePet === pet.id;
    const isFavorite = state.pets.favorites.includes(pet.id);
    return renderPetCard(pet, { isActive, isFavorite });
  }).join('');

  return `
    <div class="pet-collection">
      <div class="collection-header">
        <span class="collection-count">${count} pet${count !== 1 ? 's' : ''}</span>
      </div>
      <div class="pet-grid">
        ${petCards}
      </div>
    </div>
  `;
}

/**
 * Render pet details panel
 */
export function renderPetDetails(pet, state) {
  if (!pet) {
    return '<div class="pet-details empty">Select a pet to view details</div>';
  }

  const displayName = escapeHtml(getPetDisplayName(pet));
  const mood = Object.values(PET_MOODS).find(m => m.id === pet.mood) || PET_MOODS.CONTENT;
  const activity = Object.values(PET_ACTIVITIES).find(a => a.id === pet.activity) || PET_ACTIVITIES.IDLE;
  const isActive = state.pets.activePet === pet.id;
  const isFavorite = state.pets.favorites.includes(pet.id);

  const expPercent = Math.round((pet.experience / pet.experienceToNextLevel) * 100);

  return `
    <div class="pet-details rarity-${pet.rarity}">
      <div class="pet-header">
        <span class="pet-icon large">${pet.icon}</span>
        <div class="pet-info">
          <h2 class="pet-name">${displayName}</h2>
          ${pet.nickname ? `<span class="pet-species">(${escapeHtml(pet.speciesName)})</span>` : ''}
          <span class="pet-rarity" style="color: ${pet.rarityColor}">${escapeHtml(pet.rarityName)}</span>
        </div>
        <div class="pet-badges">
          ${isActive ? '<span class="badge active">Active</span>' : ''}
          ${isFavorite ? '<span class="badge favorite">⭐ Favorite</span>' : ''}
        </div>
      </div>

      <div class="pet-stats-section">
        <h3>Status</h3>
        <div class="pet-level-exp">
          <span class="level">Level ${pet.level}</span>
          <div class="exp-bar">
            <div class="exp-fill" style="width: ${expPercent}%"></div>
            <span class="exp-text">${formatNumber(pet.experience)} / ${formatNumber(pet.experienceToNextLevel)} XP</span>
          </div>
        </div>

        <div class="status-bars">
          <div class="status-row">
            <span class="label">Mood</span>
            <span class="value">${mood.icon} ${escapeHtml(mood.name)}</span>
          </div>
          <div class="status-row">
            <span class="label">Activity</span>
            <span class="value">${escapeHtml(activity.name)}</span>
          </div>
          <div class="status-row">
            <span class="label">Happiness</span>
            <div class="bar happiness">
              <div class="fill" style="width: ${pet.happiness}%"></div>
            </div>
            <span class="value">${Math.round(pet.happiness)}%</span>
          </div>
          <div class="status-row">
            <span class="label">Hunger</span>
            <div class="bar hunger">
              <div class="fill" style="width: ${pet.hunger}%"></div>
            </div>
            <span class="value">${Math.round(pet.hunger)}%</span>
          </div>
        </div>
      </div>

      <div class="pet-bonus-section">
        <h3>Passive Bonus</h3>
        <div class="bonus-display">
          <span class="bonus-name">${escapeHtml(pet.primaryBonus.name)}</span>
          <span class="bonus-value">+${pet.primaryBonus.value}%</span>
        </div>
        <p class="bonus-description">${escapeHtml(Object.values(PET_BONUSES).find(b => b.id === pet.primaryBonus.type)?.description || '')}</p>
      </div>

      <div class="pet-history-section">
        <h3>History</h3>
        <ul class="history-stats">
          <li>Time Owned: ${formatNumber(pet.stats.timeOwned)} minutes</li>
          <li>Treats Fed: ${formatNumber(pet.stats.treatsFed)}</li>
          <li>Times Played: ${formatNumber(pet.stats.timesPlayed)}</li>
          <li>Obtained: ${new Date(pet.obtainedAt).toLocaleDateString()}</li>
        </ul>
      </div>

      <div class="pet-actions">
        <button class="btn feed" data-action="feed" data-pet-id="${escapeHtml(pet.id)}">🍖 Feed</button>
        <button class="btn play" data-action="play" data-pet-id="${escapeHtml(pet.id)}">🎾 Play</button>
        <button class="btn rename" data-action="rename" data-pet-id="${escapeHtml(pet.id)}">✏️ Rename</button>
        <button class="btn ${isActive ? 'unset' : 'set'}-active" data-action="toggle-active" data-pet-id="${escapeHtml(pet.id)}">
          ${isActive ? '🔕 Unset Active' : '🔔 Set Active'}
        </button>
        <button class="btn favorite" data-action="toggle-favorite" data-pet-id="${escapeHtml(pet.id)}">
          ${isFavorite ? '☆ Unfavorite' : '⭐ Favorite'}
        </button>
        <button class="btn release danger" data-action="release" data-pet-id="${escapeHtml(pet.id)}">🚪 Release</button>
      </div>
    </div>
  `;
}

/**
 * Render collection statistics
 */
export function renderCollectionStats(state) {
  const stats = getCollectionStats(state);

  const rarityRows = Object.values(PET_RARITIES).map(rarity => `
    <div class="stat-row">
      <span class="rarity-name" style="color: ${rarity.color}">${rarity.name}</span>
      <span class="count">${stats.byRarity[rarity.id]}</span>
    </div>
  `).join('');

  return `
    <div class="collection-stats">
      <h3>Collection Statistics</h3>

      <div class="stat-overview">
        <div class="stat-box">
          <span class="value">${stats.totalPets}</span>
          <span class="label">Total Pets</span>
        </div>
        <div class="stat-box">
          <span class="value">${stats.uniqueCombinations}</span>
          <span class="label">Unique Types</span>
        </div>
        <div class="stat-box">
          <span class="value">${stats.completionPercent}%</span>
          <span class="label">Completion</span>
        </div>
      </div>

      <div class="rarity-breakdown">
        <h4>By Rarity</h4>
        ${rarityRows}
      </div>

      <div class="lifetime-stats">
        <h4>Lifetime</h4>
        <ul>
          <li>Total Collected: ${formatNumber(stats.stats.totalCollected)}</li>
          <li>Total Released: ${formatNumber(stats.stats.totalReleased)}</li>
          <li>Treats Given: ${formatNumber(stats.stats.totalTreatsGiven)}</li>
        </ul>
      </div>
    </div>
  `;
}

/**
 * Render species filter
 */
export function renderSpeciesFilter(selectedSpecies = null) {
  const speciesOptions = Object.values(PET_SPECIES).map(species => `
    <button class="filter-btn species ${selectedSpecies === species.id ? 'active' : ''}"
            data-species="${species.id}">
      ${species.icon} ${species.name}
    </button>
  `).join('');

  return `
    <div class="species-filter">
      <button class="filter-btn species ${!selectedSpecies ? 'active' : ''}" data-species="">All</button>
      ${speciesOptions}
    </div>
  `;
}

/**
 * Render rarity filter
 */
export function renderRarityFilter(selectedRarity = null) {
  const rarityOptions = Object.values(PET_RARITIES).map(rarity => `
    <button class="filter-btn rarity ${selectedRarity === rarity.id ? 'active' : ''}"
            data-rarity="${rarity.id}"
            style="border-color: ${rarity.color}">
      ${rarity.name}
    </button>
  `).join('');

  return `
    <div class="rarity-filter">
      <button class="filter-btn rarity ${!selectedRarity ? 'active' : ''}" data-rarity="">All</button>
      ${rarityOptions}
    </div>
  `;
}

/**
 * Render sort options
 */
export function renderSortOptions(currentSort = 'newest') {
  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'rarity', label: 'Rarity' },
    { id: 'level', label: 'Level' },
    { id: 'happiness', label: 'Happiness' },
    { id: 'name', label: 'Name' }
  ];

  const options = sortOptions.map(opt => `
    <option value="${opt.id}" ${currentSort === opt.id ? 'selected' : ''}>${opt.label}</option>
  `).join('');

  return `
    <div class="sort-options">
      <label>Sort by:</label>
      <select class="sort-select" data-action="sort">
        ${options}
      </select>
    </div>
  `;
}

/**
 * Render active pet bonus display
 */
export function renderActivePetBonus(state) {
  const bonus = getActivePetBonus(state);

  if (!bonus.hasBonus) {
    return `
      <div class="active-pet-bonus empty">
        <p>No active pet. Set a pet as active to gain bonuses!</p>
      </div>
    `;
  }

  const bonusEntries = Object.entries(bonus.bonuses).map(([type, value]) => {
    const bonusInfo = Object.values(PET_BONUSES).find(b => b.id === type);
    return `
      <div class="bonus-row">
        <span class="bonus-name">${escapeHtml(bonusInfo?.name || type)}</span>
        <span class="bonus-value">+${value}%</span>
      </div>
    `;
  }).join('');

  return `
    <div class="active-pet-bonus">
      <div class="pet-preview">
        <span class="icon">${bonus.pet.icon}</span>
        <span class="name">${escapeHtml(getPetDisplayName(bonus.pet))}</span>
      </div>
      <div class="bonuses">
        ${bonusEntries}
      </div>
      <div class="multipliers">
        <span>Mood: x${bonus.moodMultiplier.toFixed(2)}</span>
        <span>Level: x${bonus.levelMultiplier.toFixed(2)}</span>
      </div>
    </div>
  `;
}

/**
 * Render pet summon result
 */
export function renderSummonResult(pet) {
  const rarity = Object.values(PET_RARITIES).find(r => r.id === pet.rarity);

  return `
    <div class="summon-result rarity-${pet.rarity}">
      <div class="summon-flash"></div>
      <div class="pet-reveal">
        <span class="pet-icon huge">${pet.icon}</span>
        <h2 class="pet-name">${escapeHtml(pet.speciesName)}</h2>
        <span class="pet-rarity" style="color: ${pet.rarityColor}">${escapeHtml(pet.rarityName)}</span>
      </div>
      <div class="pet-bonus">
        ${escapeHtml(pet.primaryBonus.name)}: +${pet.primaryBonus.value}%
      </div>
      <button class="btn add-to-collection" data-action="add-pet">Add to Collection</button>
    </div>
  `;
}

/**
 * Render pet rename dialog
 */
export function renderRenameDialog(pet) {
  const currentName = escapeHtml(pet.nickname || '');

  return `
    <div class="rename-dialog">
      <h3>Rename ${pet.icon} ${escapeHtml(pet.speciesName)}</h3>
      <input type="text" class="rename-input" value="${currentName}" maxlength="20" placeholder="Enter nickname...">
      <div class="dialog-buttons">
        <button class="btn cancel" data-action="cancel-rename">Cancel</button>
        <button class="btn confirm" data-action="confirm-rename" data-pet-id="${escapeHtml(pet.id)}">Confirm</button>
      </div>
    </div>
  `;
}

/**
 * Render release confirmation dialog
 */
export function renderReleaseConfirmation(pet) {
  return `
    <div class="release-dialog">
      <h3>Release ${pet.icon} ${escapeHtml(getPetDisplayName(pet))}?</h3>
      <p class="warning">This action cannot be undone. Your pet will be gone forever.</p>
      <div class="dialog-buttons">
        <button class="btn cancel" data-action="cancel-release">Keep Pet</button>
        <button class="btn danger confirm" data-action="confirm-release" data-pet-id="${escapeHtml(pet.id)}">Release</button>
      </div>
    </div>
  `;
}

/**
 * Render full pet management page
 */
export function renderPetManagementPage(state, selectedPetId = null, filter = {}) {
  const selectedPet = selectedPetId
    ? state.pets.collection.find(p => p.id === selectedPetId)
    : null;

  return `
    <div class="pet-management-page">
      <header class="page-header">
        <h1>🐾 Pet Collection</h1>
        ${renderMiniPet(state)}
      </header>

      <div class="page-content">
        <aside class="sidebar">
          ${renderCollectionStats(state)}
          ${renderActivePetBonus(state)}
        </aside>

        <main class="main-content">
          <div class="filters">
            ${renderSpeciesFilter(filter.species)}
            ${renderRarityFilter(filter.rarity)}
            ${renderSortOptions(filter.sortBy)}
            <label class="checkbox-filter">
              <input type="checkbox" data-filter="favorites" ${filter.favoritesOnly ? 'checked' : ''}>
              Favorites only
            </label>
          </div>

          ${renderPetCollection(state, filter)}
        </main>

        <aside class="details-panel">
          ${renderPetDetails(selectedPet, state)}
        </aside>
      </div>
    </div>
  `;
}
