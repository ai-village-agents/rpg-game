/**
 * Fishing System UI
 * Renders fishing interface and collection panels
 */

import {
  FISHING_ZONES,
  FISH_RARITIES,
  FISH,
  FISHING_RODS,
  BAITS,
  getFishingState,
  getFishingStats,
  getFishCollection,
  getExpToNextLevel,
  getZoneFish,
  getAccessibleZones
} from './fishing-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render fishing HUD
 */
export function renderFishingHUD(state) {
  const fishingState = getFishingState(state);
  const expInfo = getExpToNextLevel(state);

  let html = '<div class="fishing-hud">';
  html += `<div class="fishing-level">🎣 Level ${fishingState.fishingLevel}</div>`;

  // Experience bar
  const expPercent = (expInfo.currentExp / expInfo.requiredExp) * 100;
  html += '<div class="fishing-exp-bar">';
  html += `<div class="exp-fill" style="width: ${expPercent}%"></div>`;
  html += `<span class="exp-text">${expInfo.currentExp}/${expInfo.requiredExp} XP</span>`;
  html += '</div>';

  // Equipped rod and bait
  const rod = FISHING_RODS[fishingState.equippedRod];
  const bait = fishingState.currentBait ? BAITS[fishingState.currentBait] : null;

  html += '<div class="fishing-equipment">';
  html += `<span class="equipped-rod">Rod: ${escapeHtml(rod?.name || 'None')}</span>`;
  html += `<span class="equipped-bait">Bait: ${escapeHtml(bait?.name || 'None')}</span>`;
  html += '</div>';

  // Streak
  if (fishingState.currentStreak > 0) {
    html += `<div class="fishing-streak">🔥 Streak: ${fishingState.currentStreak}</div>`;
  }

  html += '</div>';

  return html;
}

/**
 * Render zone selection panel
 */
export function renderZoneSelectionPanel(state) {
  const zones = getAccessibleZones(state);

  let html = '<div class="fishing-zones-panel">';
  html += '<h3>Fishing Zones</h3>';
  html += '<div class="zones-grid">';

  for (const zone of zones) {
    const statusClass = zone.accessible ? 'accessible' : 'locked';
    html += `<div class="zone-card ${statusClass}" data-zone-id="${escapeHtml(zone.id)}">`;
    html += `<span class="zone-name">${escapeHtml(zone.name)}</span>`;
    html += `<span class="zone-difficulty">Difficulty: ${'⭐'.repeat(zone.difficulty)}</span>`;

    if (!zone.accessible) {
      html += `<span class="zone-requirement">Requires Level ${zone.requiredLevel}</span>`;
    }

    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render fishing panel (active fishing interface)
 */
export function renderFishingPanel(state, currentZone) {
  const zone = FISHING_ZONES[currentZone?.toUpperCase()];
  if (!zone) return '<p class="error">Select a fishing zone to begin.</p>';

  const availableFish = getZoneFish(currentZone);
  const fishingState = getFishingState(state);

  let html = '<div class="fishing-panel">';
  html += `<h3>Fishing at ${escapeHtml(zone.name)}</h3>`;

  // Cast button
  html += '<div class="fishing-controls">';
  html += '<button class="cast-btn" data-zone="' + escapeHtml(currentZone) + '">Cast Line 🎣</button>';
  html += '</div>';

  // Available fish preview
  html += '<div class="available-fish">';
  html += '<h4>Fish in this Zone</h4>';
  html += '<div class="fish-preview-grid">';

  for (const fish of availableFish.slice(0, 6)) {
    const collected = fishingState.fishCollection[fish.id];
    html += `<div class="fish-preview ${collected ? 'collected' : 'uncollected'}">`;
    html += `<span class="fish-icon">${getFishIcon(fish.rarity)}</span>`;
    html += `<span class="fish-name" style="color: ${fish.rarityData?.color || '#AAA'}">${collected ? escapeHtml(fish.name) : '???'}</span>`;
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Get fish icon by rarity
 */
function getFishIcon(rarity) {
  const icons = {
    common: '🐟',
    uncommon: '🐠',
    rare: '🐡',
    epic: '🦈',
    legendary: '🐋'
  };
  return icons[rarity] || '🐟';
}

/**
 * Render catch result
 */
export function renderCatchResult(result) {
  if (!result.caught) {
    return '<div class="catch-result escaped">The fish got away! 💨</div>';
  }

  const fish = result.fish;
  const rarityData = FISH_RARITIES[fish.rarity.toUpperCase()];

  let html = '<div class="catch-result success">';

  if (result.isPerfect) {
    html += '<div class="perfect-catch">⭐ PERFECT CATCH! ⭐</div>';
  }

  html += `<div class="fish-caught" style="border-color: ${rarityData?.color || '#AAA'}">`;
  html += `<span class="fish-icon">${getFishIcon(fish.rarity)}</span>`;
  html += `<span class="fish-name" style="color: ${rarityData?.color || '#AAA'}">${escapeHtml(fish.name)}</span>`;
  html += `<span class="fish-rarity">${escapeHtml(rarityData?.name || fish.rarity)}</span>`;
  html += '</div>';

  html += '<div class="catch-details">';
  html += `<span>Weight: ${result.weight} lbs</span>`;
  html += `<span>Value: ${result.value} gold</span>`;
  html += `<span>+${result.expGained} XP</span>`;
  html += '</div>';

  if (result.isNewSpecies) {
    html += '<div class="new-species">📖 New species discovered!</div>';
  }

  if (result.isNewRecord) {
    html += '<div class="new-record">🏆 New personal record!</div>';
  }

  if (result.leveledUp) {
    html += `<div class="level-up">🎉 Level up! Now level ${result.newLevel}</div>`;
  }

  html += '</div>';

  return html;
}

/**
 * Render fish collection panel
 */
export function renderFishCollectionPanel(state) {
  const collection = getFishCollection(state);
  const stats = getFishingStats(state);

  let html = '<div class="fish-collection-panel">';
  html += '<h3>Fish Collection</h3>';

  // Progress
  html += '<div class="collection-progress">';
  html += `<div class="progress-bar" style="width: ${stats.collectionPercent}%"></div>`;
  html += `<span class="progress-text">${stats.uniqueSpecies}/${stats.totalSpecies} Species (${stats.collectionPercent}%)</span>`;
  html += '</div>';

  // Collected fish
  html += '<div class="collection-grid">';

  if (collection.length === 0) {
    html += '<p class="empty-message">No fish caught yet. Start fishing to build your collection!</p>';
  } else {
    for (const fish of collection) {
      html += `<div class="collection-fish" style="border-color: ${fish.rarityData?.color || '#AAA'}">`;
      html += `<span class="fish-icon">${getFishIcon(fish.rarity)}</span>`;
      html += `<span class="fish-name">${escapeHtml(fish.name)}</span>`;
      html += `<span class="fish-count">x${fish.count}</span>`;
      html += '<div class="fish-records">';
      html += `<span>Largest: ${fish.largestWeight} lbs</span>`;
      html += `<span>Smallest: ${fish.smallestWeight === Infinity ? '-' : fish.smallestWeight + ' lbs'}</span>`;
      html += '</div>';
      html += '</div>';
    }
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render fishing stats panel
 */
export function renderFishingStatsPanel(state) {
  const stats = getFishingStats(state);

  let html = '<div class="fishing-stats-panel">';
  html += '<h3>Fishing Statistics</h3>';

  html += '<div class="stats-grid">';
  html += `<div class="stat"><span>Level</span><span>${stats.fishingLevel}</span></div>`;
  html += `<div class="stat"><span>Total Fish Caught</span><span>${stats.totalFishCaught}</span></div>`;
  html += `<div class="stat"><span>Total Casts</span><span>${stats.totalCasts}</span></div>`;
  html += `<div class="stat"><span>Success Rate</span><span>${stats.successRate}%</span></div>`;
  html += `<div class="stat"><span>Perfect Catches</span><span>${stats.perfectCatches}</span></div>`;
  html += `<div class="stat"><span>Perfect Rate</span><span>${stats.perfectRate}%</span></div>`;
  html += `<div class="stat"><span>Fish Escaped</span><span>${stats.fishEscaped}</span></div>`;
  html += `<div class="stat"><span>Best Streak</span><span>${stats.bestStreak}</span></div>`;
  html += `<div class="stat"><span>Species Found</span><span>${stats.uniqueSpecies}/${stats.totalSpecies}</span></div>`;
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Render bait selection panel
 */
export function renderBaitSelectionPanel(state) {
  const fishingState = getFishingState(state);

  let html = '<div class="bait-selection-panel">';
  html += '<h4>Select Bait</h4>';
  html += '<div class="bait-grid">';

  for (const [baitId, bait] of Object.entries(BAITS)) {
    const count = fishingState.baitInventory[baitId] || 0;
    const isEquipped = fishingState.currentBait === baitId;
    const disabled = count <= 0;

    html += `<div class="bait-item ${isEquipped ? 'equipped' : ''} ${disabled ? 'disabled' : ''}" data-bait-id="${escapeHtml(baitId)}">`;
    html += `<span class="bait-name">${escapeHtml(bait.name)}</span>`;
    html += `<span class="bait-count">x${count}</span>`;
    html += `<span class="bait-bonus">+${Math.round(bait.catchBonus * 100)}% catch rate</span>`;
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render rod selection panel
 */
export function renderRodSelectionPanel(state) {
  const fishingState = getFishingState(state);

  let html = '<div class="rod-selection-panel">';
  html += '<h4>Fishing Rods</h4>';
  html += '<div class="rod-grid">';

  for (const [rodId, rod] of Object.entries(FISHING_RODS)) {
    const isEquipped = fishingState.equippedRod === rodId;

    html += `<div class="rod-item ${isEquipped ? 'equipped' : ''}" data-rod-id="${escapeHtml(rodId)}">`;
    html += `<span class="rod-name">${escapeHtml(rod.name)}</span>`;
    html += '<div class="rod-stats">';
    html += `<span>Catch: +${Math.round(rod.catchBonus * 100)}%</span>`;
    html += `<span>Rarity: +${Math.round(rod.rarityBonus * 100)}%</span>`;
    html += '</div>';
    if (isEquipped) {
      html += '<span class="equipped-badge">Equipped</span>';
    }
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Get fishing system styles
 */
export function getFishingStyles() {
  return `
    .fishing-hud {
      background: rgba(0, 50, 100, 0.8);
      padding: 12px;
      border-radius: 8px;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .fishing-level {
      font-size: 18px;
      font-weight: bold;
    }

    .fishing-exp-bar {
      height: 8px;
      background: #1a1a2e;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .fishing-exp-bar .exp-fill {
      height: 100%;
      background: linear-gradient(90deg, #00AAFF, #00FFAA);
    }

    .fishing-exp-bar .exp-text {
      position: absolute;
      top: -16px;
      right: 0;
      font-size: 10px;
      color: #888;
    }

    .fishing-equipment {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #AAA;
    }

    .fishing-streak {
      color: #FF6600;
      font-weight: bold;
    }

    .fishing-zones-panel {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
    }

    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .zone-card {
      background: #252540;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
      cursor: pointer;
    }

    .zone-card.locked {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .zone-card.accessible:hover {
      background: #303050;
    }

    .zone-name {
      display: block;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .zone-difficulty {
      font-size: 12px;
      color: #FFAA00;
    }

    .zone-requirement {
      display: block;
      font-size: 10px;
      color: #FF6666;
      margin-top: 4px;
    }

    .fishing-panel {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
    }

    .cast-btn {
      width: 100%;
      padding: 16px;
      font-size: 18px;
      background: linear-gradient(135deg, #0066AA, #00AAFF);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-weight: bold;
    }

    .cast-btn:hover {
      background: linear-gradient(135deg, #0077BB, #00BBFF);
    }

    .available-fish {
      margin-top: 16px;
    }

    .fish-preview-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .fish-preview {
      text-align: center;
      padding: 8px;
      background: #252540;
      border-radius: 4px;
    }

    .fish-preview.uncollected {
      opacity: 0.5;
    }

    .fish-icon {
      font-size: 24px;
    }

    .fish-name {
      display: block;
      font-size: 11px;
      margin-top: 4px;
    }

    .catch-result {
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .catch-result.success {
      background: linear-gradient(135deg, #1a3a2e, #2a5a4e);
    }

    .catch-result.escaped {
      background: #3a1a1a;
      color: #FF6666;
    }

    .perfect-catch {
      color: #FFD700;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .fish-caught {
      border: 2px solid;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    }

    .catch-details {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 12px;
      color: #AAA;
    }

    .new-species, .new-record, .level-up {
      margin-top: 8px;
      font-weight: bold;
    }

    .new-species {
      color: #00AAFF;
    }

    .new-record {
      color: #FFD700;
    }

    .level-up {
      color: #00FF00;
    }

    .fish-collection-panel {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
    }

    .collection-progress {
      height: 20px;
      background: #252540;
      border-radius: 10px;
      position: relative;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .collection-progress .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #00AAFF, #00FFAA);
    }

    .collection-progress .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }

    .collection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
    }

    .collection-fish {
      background: #252540;
      padding: 8px;
      border-radius: 4px;
      border-left: 3px solid;
      text-align: center;
    }

    .fish-count {
      display: block;
      font-size: 12px;
      color: #888;
    }

    .fish-records {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
    }

    .fishing-stats-panel {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .stat {
      background: #252540;
      padding: 8px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat span:first-child {
      font-size: 10px;
      color: #888;
    }

    .stat span:last-child {
      font-size: 16px;
      font-weight: bold;
      color: #fff;
    }

    .bait-selection-panel, .rod-selection-panel {
      background: #252540;
      padding: 12px;
      border-radius: 6px;
    }

    .bait-grid, .rod-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }

    .bait-item, .rod-item {
      background: #1a1a2e;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
    }

    .bait-item.equipped, .rod-item.equipped {
      border: 2px solid #00AAFF;
    }

    .bait-item.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .equipped-badge {
      display: inline-block;
      background: #00AAFF;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
    }
  `;
}
