/**
 * Treasure Map System UI
 * Renders treasure hunting interface
 */

import {
  MAP_RARITIES,
  TREASURE_TYPES,
  PUZZLE_TYPES,
  MAP_REGIONS,
  getTreasureMapState,
  getTreasureStats,
  getAvailableMaps,
  getCompletedMaps,
  getCurrentHunt
} from './treasure-map-system.js';

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
 * Render treasure hunter HUD
 */
export function renderTreasureHunterHUD(state) {
  const stats = getTreasureStats(state);

  let html = '<div class="treasure-hunter-hud">';
  html += `<div class="hunter-level">🗺️ Treasure Hunter Lv.${stats.level}</div>`;
  html += `<div class="hunter-stats">`;
  html += `<span>Maps: ${stats.activeMaps}</span>`;
  html += `<span>Fragments: ${stats.fragments}</span>`;
  html += `<span>Completed: ${stats.completedMaps}</span>`;
  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render map inventory panel
 */
export function renderMapInventoryPanel(state) {
  const availableMaps = getAvailableMaps(state);
  const stats = getTreasureStats(state);

  let html = '<div class="map-inventory-panel">';
  html += '<h3>Treasure Maps</h3>';

  // Fragments indicator
  html += `<div class="fragments-bar">`;
  html += `<span>📜 Map Fragments: ${stats.fragments}/5</span>`;
  if (stats.fragments >= 5) {
    html += `<button class="combine-btn">Combine Fragments</button>`;
  }
  html += '</div>';

  html += '<div class="maps-grid">';

  if (availableMaps.length === 0) {
    html += '<p class="empty-message">No treasure maps. Find or purchase maps to begin treasure hunting!</p>';
  } else {
    for (const map of availableMaps) {
      html += renderMapCard(map);
    }
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render a single map card
 */
function renderMapCard(map) {
  const rarityColor = map.rarityData?.color || '#AAA';

  let html = `<div class="map-card" data-map-id="${escapeHtml(map.id)}" style="border-color: ${rarityColor}">`;

  html += `<div class="map-header" style="background: linear-gradient(135deg, ${rarityColor}33, ${rarityColor}11)">`;
  html += `<span class="map-icon">🗺️</span>`;
  html += `<span class="map-rarity" style="color: ${rarityColor}">${escapeHtml(map.rarityData?.name || map.rarity)}</span>`;
  html += '</div>';

  html += '<div class="map-body">';
  html += `<div class="map-region">📍 ${escapeHtml(map.regionData?.name || map.region)}</div>`;
  html += `<div class="map-treasure">💎 ${escapeHtml(map.treasureData?.name || map.treasureType)}</div>`;
  html += `<div class="map-puzzle">🔐 ${escapeHtml(map.puzzleData?.name || 'Unknown')}</div>`;

  // Progress bar
  html += '<div class="map-progress">';
  html += `<div class="progress-fill" style="width: ${map.progress}%"></div>`;
  html += `<span class="progress-text">${map.progress}%</span>`;
  html += '</div>';

  // Hints
  if (map.hints && map.hints.length > 0) {
    html += '<div class="map-hints">';
    html += '<span class="hints-label">Hints:</span>';
    html += '<ul>';
    for (const hint of map.hints.slice(0, 2)) {
      html += `<li>${escapeHtml(hint)}</li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  html += '</div>';

  html += '<div class="map-actions">';
  html += `<button class="hunt-btn" data-map-id="${escapeHtml(map.id)}">Start Hunt</button>`;
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Render active hunt panel
 */
export function renderActiveHuntPanel(state) {
  const huntInfo = getCurrentHunt(state);

  if (!huntInfo.active) {
    return '<div class="no-hunt"><p>No active treasure hunt. Select a map to begin!</p></div>';
  }

  const map = huntInfo.map;
  const hunt = huntInfo.hunt;
  const rarityColor = huntInfo.rarityData?.color || '#AAA';

  let html = '<div class="active-hunt-panel">';
  html += '<h3>Active Treasure Hunt</h3>';

  html += `<div class="hunt-info" style="border-color: ${rarityColor}">`;
  html += `<div class="hunt-header">`;
  html += `<span class="hunt-rarity" style="color: ${rarityColor}">${escapeHtml(huntInfo.rarityData?.name || map.rarity)}</span>`;
  html += `<span class="hunt-region">📍 ${escapeHtml(huntInfo.regionData?.name || map.region)}</span>`;
  html += '</div>';

  // Progress
  html += '<div class="hunt-progress-section">';
  html += '<h4>Discovery Progress</h4>';
  html += '<div class="hunt-progress-bar">';
  html += `<div class="progress-fill" style="width: ${map.progress}%"></div>`;
  html += '</div>';
  html += `<span class="progress-label">${map.progress}% Complete</span>`;
  html += '</div>';

  // Puzzle status
  html += '<div class="puzzle-section">';
  html += `<h4>Puzzle: ${escapeHtml(huntInfo.puzzleData?.name || 'None')}</h4>`;
  if (huntInfo.puzzleData?.id === 'none') {
    html += '<span class="puzzle-status solved">No puzzle required</span>';
  } else if (hunt.puzzleSolved) {
    html += '<span class="puzzle-status solved">✓ Solved!</span>';
  } else {
    html += '<span class="puzzle-status unsolved">⏳ Not yet solved</span>';
    html += `<button class="solve-puzzle-btn">Attempt Puzzle</button>`;
  }
  html += '</div>';

  // Treasure preview
  html += '<div class="treasure-preview">';
  html += `<h4>Expected Treasure</h4>`;
  html += `<span class="treasure-type">💎 ${escapeHtml(huntInfo.treasureData?.name || 'Unknown')}</span>`;
  html += '</div>';

  // Actions
  html += '<div class="hunt-actions">';
  if (map.progress >= 100 && (hunt.puzzleSolved || huntInfo.puzzleData?.id === 'none')) {
    html += '<button class="claim-btn">🎉 Claim Treasure!</button>';
  } else if (map.progress < 100) {
    html += '<button class="explore-btn">🔍 Explore Area</button>';
  }
  html += '<button class="abandon-btn">Abandon Hunt</button>';
  html += '</div>';

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render treasure statistics panel
 */
export function renderTreasureStatsPanel(state) {
  const stats = getTreasureStats(state);

  let html = '<div class="treasure-stats-panel">';
  html += '<h3>Treasure Hunter Statistics</h3>';

  html += '<div class="stats-grid">';
  html += `<div class="stat"><span>Level</span><span>${stats.level}</span></div>`;
  html += `<div class="stat"><span>Experience</span><span>${stats.experience}</span></div>`;
  html += `<div class="stat"><span>Maps Completed</span><span>${stats.completedMaps}</span></div>`;
  html += `<div class="stat"><span>Total Value</span><span>${stats.totalValue} gold</span></div>`;
  html += `<div class="stat"><span>Legendary Maps</span><span>${stats.legendaryFound}</span></div>`;
  html += `<div class="stat"><span>Active Maps</span><span>${stats.activeMaps}</span></div>`;
  html += '</div>';

  // Maps by rarity breakdown
  if (Object.keys(stats.mapsByRarity).length > 0) {
    html += '<div class="rarity-breakdown">';
    html += '<h4>Maps by Rarity</h4>';
    for (const [rarity, count] of Object.entries(stats.mapsByRarity)) {
      const rarityData = MAP_RARITIES[rarity.toUpperCase()];
      html += `<div class="rarity-row" style="color: ${rarityData?.color || '#AAA'}">`;
      html += `<span>${escapeHtml(rarityData?.name || rarity)}</span>`;
      html += `<span>x${count}</span>`;
      html += '</div>';
    }
    html += '</div>';
  }

  html += '</div>';

  return html;
}

/**
 * Render completed maps history
 */
export function renderCompletedMapsPanel(state) {
  const completedMaps = getCompletedMaps(state);

  let html = '<div class="completed-maps-panel">';
  html += '<h3>Completed Maps</h3>';

  if (completedMaps.length === 0) {
    html += '<p class="empty-message">No completed maps yet.</p>';
  } else {
    html += '<div class="completed-list">';
    for (const map of completedMaps.slice(-10).reverse()) {
      const rarityColor = map.rarityData?.color || '#AAA';
      html += `<div class="completed-map" style="border-left-color: ${rarityColor}">`;
      html += `<span class="completed-rarity" style="color: ${rarityColor}">${escapeHtml(map.rarityData?.name || map.rarity)}</span>`;
      html += `<span class="completed-region">${escapeHtml(map.regionData?.name || map.region)}</span>`;
      html += `<span class="completed-treasure">${escapeHtml(map.treasureData?.name || map.treasureType)}</span>`;
      html += '</div>';
    }
    html += '</div>';
  }

  html += '</div>';

  return html;
}

/**
 * Render treasure claim result
 */
export function renderTreasureClaimResult(result) {
  if (!result.claimed) {
    return `<div class="claim-failed">${escapeHtml(result.error)}</div>`;
  }

  const treasure = result.treasure;
  const rarityColor = treasure.rarity?.color || '#FFD700';

  let html = '<div class="treasure-claimed">';
  html += '<h3>🎉 Treasure Found! 🎉</h3>';

  html += `<div class="treasure-details" style="border-color: ${rarityColor}">`;
  html += `<span class="treasure-icon">💎</span>`;
  html += `<span class="treasure-name">${escapeHtml(treasure.type?.name || 'Unknown Treasure')}</span>`;
  html += `<span class="treasure-value">${treasure.value} gold</span>`;
  html += '</div>';

  html += `<div class="exp-gained">+${result.expGained} XP</div>`;

  if (result.leveledUp) {
    html += `<div class="level-up">🎊 Level Up! Now Treasure Hunter Lv.${result.newLevel}!</div>`;
  }

  html += '</div>';

  return html;
}

/**
 * Get treasure map system styles
 */
export function getTreasureMapStyles() {
  return `
    .treasure-hunter-hud {
      background: rgba(139, 90, 43, 0.9);
      padding: 10px 16px;
      border-radius: 8px;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .hunter-level {
      font-weight: bold;
      font-size: 16px;
    }

    .hunter-stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
    }

    .map-inventory-panel {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
    }

    .fragments-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #252540;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .combine-btn {
      background: #FFD700;
      color: #333;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .maps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .map-card {
      background: #252540;
      border-radius: 8px;
      border: 2px solid;
      overflow: hidden;
    }

    .map-header {
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .map-icon {
      font-size: 24px;
    }

    .map-rarity {
      font-weight: bold;
    }

    .map-body {
      padding: 12px;
    }

    .map-region, .map-treasure, .map-puzzle {
      margin: 4px 0;
      font-size: 13px;
    }

    .map-progress {
      height: 8px;
      background: #1a1a2e;
      border-radius: 4px;
      margin: 12px 0;
      position: relative;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00AAFF, #00FFAA);
      transition: width 0.3s;
    }

    .progress-text {
      position: absolute;
      right: 4px;
      top: -14px;
      font-size: 10px;
      color: #888;
    }

    .map-hints {
      font-size: 11px;
      color: #888;
      margin-top: 8px;
    }

    .hints-label {
      color: #AAA;
    }

    .map-hints ul {
      margin: 4px 0;
      padding-left: 16px;
    }

    .map-actions {
      padding: 12px;
      border-top: 1px solid #333;
    }

    .hunt-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #8B5A2B, #CD853F);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-weight: bold;
    }

    .active-hunt-panel {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
    }

    .hunt-info {
      border: 2px solid;
      border-radius: 8px;
      padding: 16px;
    }

    .hunt-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .hunt-progress-section, .puzzle-section, .treasure-preview {
      margin: 16px 0;
    }

    .hunt-progress-bar {
      height: 12px;
      background: #252540;
      border-radius: 6px;
      overflow: hidden;
    }

    .puzzle-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .puzzle-status.solved {
      background: #00AA00;
      color: white;
    }

    .puzzle-status.unsolved {
      background: #AA6600;
      color: white;
    }

    .hunt-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .claim-btn {
      flex: 2;
      padding: 12px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border: none;
      border-radius: 4px;
      color: #333;
      font-weight: bold;
      cursor: pointer;
    }

    .explore-btn {
      flex: 2;
      padding: 12px;
      background: #0066AA;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }

    .abandon-btn {
      flex: 1;
      padding: 12px;
      background: #660000;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    }

    .treasure-stats-panel {
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
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }

    .stat span:first-child {
      display: block;
      font-size: 10px;
      color: #888;
    }

    .stat span:last-child {
      font-size: 18px;
      font-weight: bold;
    }

    .treasure-claimed {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #1a2a1a, #2a3a2a);
      border-radius: 8px;
    }

    .treasure-details {
      border: 2px solid;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .treasure-icon {
      font-size: 48px;
      display: block;
    }

    .treasure-name {
      display: block;
      font-size: 18px;
      font-weight: bold;
      margin: 8px 0;
    }

    .treasure-value {
      color: #FFD700;
      font-weight: bold;
    }

    .exp-gained {
      color: #00FF00;
      font-size: 16px;
    }

    .level-up {
      color: #FFD700;
      font-size: 20px;
      font-weight: bold;
      margin-top: 8px;
    }

    .empty-message {
      text-align: center;
      color: #666;
      padding: 20px;
    }
  `;
}
