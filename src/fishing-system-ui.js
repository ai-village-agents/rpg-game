/**
 * Fishing System UI Components
 * Renders fishing interface and mini-game elements
 */

import {
  FISH_RARITY,
  FISHING_LOCATION,
  WEATHER,
  TIME_OF_DAY,
  BAIT_TYPE,
  ROD_TYPE,
  FISH_DATA,
  ROD_STATS,
  BAIT_STATS,
  getFishingStats,
  getFishCollection,
  getAvailableFish,
  calculateCatchChance
} from './fishing-system.js';

// HTML escape for XSS prevention
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rarity colors
const RARITY_COLORS = {
  [FISH_RARITY.COMMON]: '#9d9d9d',
  [FISH_RARITY.UNCOMMON]: '#1eff00',
  [FISH_RARITY.RARE]: '#0070dd',
  [FISH_RARITY.EPIC]: '#a335ee',
  [FISH_RARITY.LEGENDARY]: '#ff8000'
};

// Location icons
const LOCATION_ICONS = {
  [FISHING_LOCATION.POND]: '🏞️',
  [FISHING_LOCATION.RIVER]: '🏞️',
  [FISHING_LOCATION.LAKE]: '🌊',
  [FISHING_LOCATION.OCEAN]: '🌊',
  [FISHING_LOCATION.SWAMP]: '🌿',
  [FISHING_LOCATION.UNDERGROUND]: '🕳️',
  [FISHING_LOCATION.LAVA]: '🔥',
  [FISHING_LOCATION.MAGIC_SPRING]: '✨'
};

// Weather icons
const WEATHER_ICONS = {
  [WEATHER.SUNNY]: '☀️',
  [WEATHER.CLOUDY]: '☁️',
  [WEATHER.RAINY]: '🌧️',
  [WEATHER.STORMY]: '⛈️',
  [WEATHER.FOGGY]: '🌫️'
};

// Time icons
const TIME_ICONS = {
  [TIME_OF_DAY.DAWN]: '🌅',
  [TIME_OF_DAY.DAY]: '☀️',
  [TIME_OF_DAY.DUSK]: '🌇',
  [TIME_OF_DAY.NIGHT]: '🌙'
};

/**
 * Render main fishing panel
 */
function renderFishingPanel(state, currentLocation, weather, timeOfDay) {
  const stats = getFishingStats(state);
  const catchChance = calculateCatchChance(state, weather, timeOfDay);

  return `
    <div class="fishing-panel">
      <div class="fishing-header">
        <h2>🎣 Fishing</h2>
        <div class="fishing-conditions">
          <span class="weather">${WEATHER_ICONS[weather]} ${escapeHtml(weather)}</span>
          <span class="time">${TIME_ICONS[timeOfDay]} ${escapeHtml(timeOfDay)}</span>
        </div>
      </div>

      <div class="fishing-stats">
        <div class="stat">
          <span class="stat-label">Skill Level:</span>
          <span class="stat-value">${stats.skillLevel}</span>
        </div>
        <div class="stat">
          <span class="stat-label">XP:</span>
          <span class="stat-value">${stats.skillXp} / ${stats.xpToNextLevel}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Catch Chance:</span>
          <span class="stat-value">${(catchChance * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div class="fishing-location">
        ${renderLocationInfo(currentLocation, state)}
      </div>

      <div class="fishing-controls">
        ${renderFishingControls(state)}
      </div>
    </div>
  `;
}

/**
 * Render location info
 */
function renderLocationInfo(location, state) {
  const isUnlocked = state.unlockedLocations.includes(location);
  const availableFish = getAvailableFish(location);
  const icon = LOCATION_ICONS[location] || '🌊';

  return `
    <div class="location-info ${isUnlocked ? '' : 'locked'}">
      <div class="location-header">
        <span class="location-icon">${icon}</span>
        <span class="location-name">${escapeHtml(location.replace(/_/g, ' '))}</span>
        ${isUnlocked ? '' : '<span class="lock-icon">🔒</span>'}
      </div>
      ${isUnlocked ? `
        <div class="location-fish">
          <span class="fish-count">${availableFish.length} species available</span>
        </div>
      ` : `
        <div class="location-locked">
          <span>Location locked</span>
        </div>
      `}
    </div>
  `;
}

/**
 * Render fishing controls
 */
function renderFishingControls(state) {
  const hasRod = state.currentRod !== null;
  const rod = hasRod ? state.inventory.rods[state.currentRod] : null;
  const hasBait = Object.values(state.inventory.bait).some(count => count > 0);

  return `
    <div class="fishing-controls-inner">
      ${hasRod ? `
        <div class="equipped-rod">
          <span class="rod-name">${escapeHtml(rod.type)} Rod</span>
          <span class="rod-durability">${rod.currentDurability} / ${rod.maxDurability === Infinity ? '∞' : rod.maxDurability}</span>
        </div>
      ` : `
        <div class="no-rod-warning">⚠️ No rod equipped</div>
      `}

      ${hasBait ? renderBaitSelector(state) : '<div class="no-bait-warning">⚠️ No bait available</div>'}

      <button class="btn-cast" ${hasRod && hasBait ? '' : 'disabled'}>
        🎣 Cast Line
      </button>
    </div>
  `;
}

/**
 * Render bait selector
 */
function renderBaitSelector(state) {
  const baitOptions = Object.entries(state.inventory.bait)
    .filter(([_, count]) => count > 0)
    .map(([baitType, count]) => `
      <option value="${escapeHtml(baitType)}">${escapeHtml(baitType.replace(/_/g, ' '))} (${count})</option>
    `).join('');

  return `
    <div class="bait-selector">
      <label>Select Bait:</label>
      <select class="bait-select">
        ${baitOptions}
      </select>
    </div>
  `;
}

/**
 * Render catch result
 */
function renderCatchResult(result) {
  if (!result.caught) {
    return `
      <div class="catch-result miss">
        <div class="result-icon">💨</div>
        <div class="result-text">The fish got away!</div>
      </div>
    `;
  }

  const fish = result.fish;
  const rarityColor = RARITY_COLORS[fish.rarity];

  return `
    <div class="catch-result success">
      <div class="result-header">🎉 Caught!</div>
      <div class="fish-caught">
        <div class="fish-icon">🐟</div>
        <div class="fish-name" style="color: ${rarityColor}">${escapeHtml(fish.name)}</div>
        <div class="fish-rarity" style="color: ${rarityColor}">${fish.rarity.toUpperCase()}</div>
      </div>
      <div class="fish-details">
        <span class="fish-size">📏 ${fish.size} cm</span>
        <span class="fish-value">💰 ${fish.value} gold</span>
      </div>
      <div class="xp-gained">
        +${result.xpGained} XP
        ${result.leveledUp ? `<span class="level-up">Level Up! Now ${result.newLevel}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Render fish inventory
 */
function renderFishInventory(state) {
  const fishEntries = Object.entries(state.inventory.fish)
    .filter(([_, fishArray]) => fishArray.length > 0);

  if (fishEntries.length === 0) {
    return `
      <div class="fish-inventory empty">
        <p>No fish in inventory</p>
      </div>
    `;
  }

  const fishCards = fishEntries.map(([fishId, fishArray]) => {
    const fishData = FISH_DATA[fishId];
    const rarityColor = RARITY_COLORS[fishData.rarity];
    const totalValue = fishArray.reduce((sum, f) => sum + f.value, 0);

    return `
      <div class="fish-stack" data-fish-id="${escapeHtml(fishId)}">
        <div class="fish-icon">🐟</div>
        <div class="fish-info">
          <span class="fish-name" style="color: ${rarityColor}">${escapeHtml(fishData.name)}</span>
          <span class="fish-count">x${fishArray.length}</span>
        </div>
        <div class="fish-value">💰 ${totalValue}</div>
        <button class="btn-sell-all" data-fish-id="${escapeHtml(fishId)}">Sell All</button>
      </div>
    `;
  }).join('');

  return `
    <div class="fish-inventory">
      <h3>Fish Inventory</h3>
      <div class="fish-grid">
        ${fishCards}
      </div>
    </div>
  `;
}

/**
 * Render fish collection (encyclopedia)
 */
function renderFishCollection(state) {
  const collection = getFishCollection(state);
  const stats = getFishingStats(state);

  const fishEntries = Object.entries(collection).map(([fishId, data]) => {
    const rarityColor = RARITY_COLORS[data.rarity];
    const discovered = data.discovered;

    return `
      <div class="collection-entry ${discovered ? 'discovered' : 'undiscovered'}">
        <div class="fish-icon">${discovered ? '🐟' : '❓'}</div>
        <div class="fish-info">
          <span class="fish-name" style="color: ${discovered ? rarityColor : '#666'}">
            ${discovered ? escapeHtml(data.name) : '???'}
          </span>
          <span class="fish-rarity" style="color: ${discovered ? rarityColor : '#666'}">
            ${discovered ? data.rarity : 'Unknown'}
          </span>
        </div>
        ${discovered ? `
          <div class="fish-stats">
            <span>Caught: ${data.caught}</span>
            <span>Size: ${data.minSize}-${data.maxSize} cm</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="fish-collection">
      <div class="collection-header">
        <h3>🐟 Fish Encyclopedia</h3>
        <span class="completion">${stats.uniqueSpecies} / ${stats.totalSpecies} (${stats.completionPercent}%)</span>
      </div>
      <div class="collection-grid">
        ${fishEntries}
      </div>
    </div>
  `;
}

/**
 * Render rod inventory
 */
function renderRodInventory(state) {
  const rods = Object.values(state.inventory.rods);

  if (rods.length === 0) {
    return `
      <div class="rod-inventory empty">
        <p>No fishing rods</p>
      </div>
    `;
  }

  const rodCards = rods.map(rod => {
    const stats = ROD_STATS[rod.type];
    const isEquipped = state.currentRod === rod.id;
    const durabilityPercent = rod.maxDurability === Infinity ? 100 :
      (rod.currentDurability / rod.maxDurability) * 100;

    return `
      <div class="rod-card ${isEquipped ? 'equipped' : ''}" data-rod-id="${escapeHtml(rod.id)}">
        <div class="rod-icon">🎣</div>
        <div class="rod-info">
          <span class="rod-name">${escapeHtml(rod.type)} Rod</span>
          <div class="rod-stats">
            <span>Catch: +${(stats.catchBonus * 100).toFixed(0)}%</span>
            <span>Rarity: +${(stats.rarityBonus * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div class="rod-durability">
          <div class="durability-bar">
            <div class="durability-fill" style="width: ${durabilityPercent}%"></div>
          </div>
          <span class="durability-text">
            ${rod.currentDurability}/${rod.maxDurability === Infinity ? '∞' : rod.maxDurability}
          </span>
        </div>
        <button class="btn-equip-rod" ${isEquipped ? 'disabled' : ''} data-rod-id="${escapeHtml(rod.id)}">
          ${isEquipped ? 'Equipped' : 'Equip'}
        </button>
      </div>
    `;
  }).join('');

  return `
    <div class="rod-inventory">
      <h3>Fishing Rods</h3>
      <div class="rod-grid">
        ${rodCards}
      </div>
    </div>
  `;
}

/**
 * Render location selector
 */
function renderLocationSelector(state) {
  const locations = Object.values(FISHING_LOCATION);

  const locationOptions = locations.map(location => {
    const isUnlocked = state.unlockedLocations.includes(location);
    const icon = LOCATION_ICONS[location] || '🌊';
    const fishCount = getAvailableFish(location).length;

    return `
      <div class="location-option ${isUnlocked ? '' : 'locked'}" data-location="${escapeHtml(location)}">
        <span class="location-icon">${icon}</span>
        <span class="location-name">${escapeHtml(location.replace(/_/g, ' '))}</span>
        ${isUnlocked ? `
          <span class="fish-count">${fishCount} species</span>
        ` : `
          <span class="lock-icon">🔒</span>
        `}
      </div>
    `;
  }).join('');

  return `
    <div class="location-selector">
      <h3>Fishing Locations</h3>
      <div class="location-grid">
        ${locationOptions}
      </div>
    </div>
  `;
}

/**
 * Render fishing stats summary
 */
function renderFishingStatsSummary(state) {
  const stats = getFishingStats(state);

  return `
    <div class="fishing-stats-summary">
      <h3>📊 Fishing Stats</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Catches:</span>
          <span class="stat-value">${stats.totalCatches}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Species Found:</span>
          <span class="stat-value">${stats.uniqueSpecies} / ${stats.totalSpecies}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Completion:</span>
          <span class="stat-value">${stats.completionPercent}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Value Caught:</span>
          <span class="stat-value">💰 ${stats.totalValue}</span>
        </div>
        ${stats.largestCatch ? `
          <div class="stat-item">
            <span class="stat-label">Largest Catch:</span>
            <span class="stat-value">${escapeHtml(stats.largestCatch.name)} (${stats.largestCatch.size} cm)</span>
          </div>
        ` : ''}
        ${stats.rarestCatch ? `
          <div class="stat-item">
            <span class="stat-label">Rarest Catch:</span>
            <span class="stat-value" style="color: ${RARITY_COLORS[stats.rarestCatch.rarity]}">
              ${escapeHtml(stats.rarestCatch.name)}
            </span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render achievement notification
 */
function renderAchievementUnlocked(achievement) {
  return `
    <div class="achievement-unlocked">
      <div class="achievement-icon">🏆</div>
      <div class="achievement-content">
        <div class="achievement-title">${escapeHtml(achievement.name)}</div>
        <div class="achievement-desc">${escapeHtml(achievement.description)}</div>
      </div>
    </div>
  `;
}

/**
 * Render fishing mini-game
 */
function renderFishingMiniGame(difficulty = 1) {
  const barWidth = 200;
  const targetWidth = Math.max(20, 60 - difficulty * 5);

  return `
    <div class="fishing-mini-game">
      <div class="mini-game-title">Reel it in!</div>
      <div class="catch-bar" style="width: ${barWidth}px">
        <div class="target-zone" style="width: ${targetWidth}px; left: ${Math.random() * (barWidth - targetWidth)}px"></div>
        <div class="cursor"></div>
      </div>
      <div class="mini-game-instructions">
        Press SPACE to stop the cursor in the target zone!
      </div>
    </div>
  `;
}

/**
 * Render bait shop
 */
function renderBaitShop() {
  const baitItems = Object.entries(BAIT_STATS).map(([baitType, stats]) => {
    const price = getBaitPrice(baitType);

    return `
      <div class="shop-item" data-bait="${escapeHtml(baitType)}">
        <div class="item-icon">🪱</div>
        <div class="item-info">
          <span class="item-name">${escapeHtml(baitType.replace(/_/g, ' '))}</span>
          <span class="item-stats">
            Catch: +${(stats.catchBonus * 100).toFixed(0)}%
            Rarity: +${(stats.rarityBonus * 100).toFixed(0)}%
          </span>
        </div>
        <div class="item-price">💰 ${price}</div>
        <button class="btn-buy" data-bait="${escapeHtml(baitType)}">Buy</button>
      </div>
    `;
  }).join('');

  return `
    <div class="bait-shop">
      <h3>🪱 Bait Shop</h3>
      <div class="shop-items">
        ${baitItems}
      </div>
    </div>
  `;
}

/**
 * Get bait price
 */
function getBaitPrice(baitType) {
  const prices = {
    [BAIT_TYPE.WORM]: 5,
    [BAIT_TYPE.INSECT]: 10,
    [BAIT_TYPE.MINNOW]: 20,
    [BAIT_TYPE.SHRIMP]: 35,
    [BAIT_TYPE.MAGIC_LURE]: 100,
    [BAIT_TYPE.GOLDEN_LURE]: 250
  };
  return prices[baitType] || 10;
}

// Export all UI components
export {
  renderFishingPanel,
  renderLocationInfo,
  renderFishingControls,
  renderBaitSelector,
  renderCatchResult,
  renderFishInventory,
  renderFishCollection,
  renderRodInventory,
  renderLocationSelector,
  renderFishingStatsSummary,
  renderAchievementUnlocked,
  renderFishingMiniGame,
  renderBaitShop,
  getBaitPrice,
  RARITY_COLORS,
  LOCATION_ICONS,
  WEATHER_ICONS,
  TIME_ICONS
};
