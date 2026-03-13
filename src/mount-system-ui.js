/**
 * Mount System UI
 * Renders mount management interface
 */

import {
  MOUNTS,
  MOUNT_TYPES,
  MOUNT_RARITIES,
  MOUNT_ABILITIES,
  getMountState,
  getActiveMountInfo,
  getMountAbilities,
  getCollectionStats,
  getOwnedMounts
} from './mount-system.js';

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
 * Render mount stable panel
 */
export function renderMountStablePanel(state, options = {}) {
  const { showDetails = true } = options;
  const ownedMounts = getOwnedMounts(state);
  const activeMountInfo = getActiveMountInfo(state);

  let html = '<div class="mount-stable-panel">';
  html += '<h3>Mount Stable</h3>';

  if (activeMountInfo.mounted) {
    html += '<div class="active-mount-banner">';
    html += `<span class="mount-icon">🐴</span>`;
    html += `<span>Currently riding: <strong>${escapeHtml(activeMountInfo.mountData.name)}</strong></span>`;
    html += `<span class="speed-bonus">+${Math.round((activeMountInfo.speedBonus - 1) * 100)}% Speed</span>`;
    html += '</div>';
  }

  html += '<div class="mount-list">';

  if (ownedMounts.length === 0) {
    html += '<p class="empty-message">No mounts owned yet. Find or purchase mounts to add to your stable.</p>';
  } else {
    for (const mount of ownedMounts) {
      const rarityData = MOUNT_RARITIES[mount.rarity.toUpperCase()];
      const typeData = MOUNT_TYPES[mount.type.toUpperCase()];

      html += `<div class="mount-card ${mount.isActive ? 'active' : ''}" data-mount-id="${escapeHtml(mount.id)}">`;
      html += `<div class="mount-header" style="border-color: ${rarityData?.color || '#AAA'}">`;
      html += `<span class="mount-name">${escapeHtml(mount.name)}</span>`;
      html += `<span class="mount-rarity" style="color: ${rarityData?.color || '#AAA'}">${escapeHtml(rarityData?.name || mount.rarity)}</span>`;
      html += '</div>';

      html += '<div class="mount-body">';
      html += `<p class="mount-type">${escapeHtml(typeData?.name || mount.type)}</p>`;
      html += `<p class="mount-description">${escapeHtml(mount.description)}</p>`;

      if (showDetails && mount.stats) {
        html += '<div class="mount-stats">';
        html += `<div class="stat"><span>Level</span><span>${mount.stats.level}</span></div>`;
        html += `<div class="stat"><span>Bond</span><span>${mount.stats.bond}%</span></div>`;
        html += `<div class="stat"><span>Stamina</span><span>${mount.stats.currentStamina}/${MOUNTS[mount.id].stamina}</span></div>`;
        html += `<div class="stat"><span>Speed Bonus</span><span>+${Math.round((mount.speedBonus - 1) * 100)}%</span></div>`;
        html += '</div>';

        // Stamina bar
        const staminaPercent = (mount.stats.currentStamina / MOUNTS[mount.id].stamina) * 100;
        html += '<div class="stamina-bar-container">';
        html += `<div class="stamina-bar" style="width: ${staminaPercent}%; background: ${getStaminaColor(staminaPercent)}"></div>`;
        html += '</div>';
      }

      html += '</div>';

      html += '<div class="mount-actions">';
      if (mount.isActive) {
        html += '<button class="dismount-btn" data-mount-id="' + escapeHtml(mount.id) + '">Dismount</button>';
      } else {
        html += '<button class="mount-btn" data-mount-id="' + escapeHtml(mount.id) + '">Mount</button>';
        html += '<button class="feed-btn" data-mount-id="' + escapeHtml(mount.id) + '">Feed</button>';
      }
      html += '</div>';

      html += '</div>';
    }
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Get stamina bar color based on percentage
 */
function getStaminaColor(percent) {
  if (percent > 66) return '#00AA00';
  if (percent > 33) return '#FFAA00';
  return '#FF0000';
}

/**
 * Render mount abilities panel
 */
export function renderMountAbilitiesPanel(state) {
  const activeMountInfo = getActiveMountInfo(state);

  let html = '<div class="mount-abilities-panel">';
  html += '<h4>Mount Abilities</h4>';

  if (!activeMountInfo.mounted) {
    html += '<p class="empty-message">Mount up to view abilities.</p>';
  } else {
    const abilities = activeMountInfo.abilities;

    if (abilities.length === 0) {
      html += '<p class="empty-message">This mount has no special abilities.</p>';
    } else {
      html += '<ul class="ability-list">';
      for (const ability of abilities) {
        html += '<li class="ability-item">';
        html += `<span class="ability-name">${escapeHtml(ability.name)}</span>`;
        html += `<span class="ability-description">${escapeHtml(ability.description)}</span>`;
        html += '</li>';
      }
      html += '</ul>';
    }
  }

  html += '</div>';

  return html;
}

/**
 * Render mount collection panel
 */
export function renderMountCollectionPanel(state) {
  const collectionStats = getCollectionStats(state);
  const mountState = getMountState(state);

  let html = '<div class="mount-collection-panel">';
  html += '<h3>Mount Collection</h3>';

  // Progress bar
  html += '<div class="collection-progress">';
  html += `<div class="progress-bar" style="width: ${collectionStats.completionPercent}%"></div>`;
  html += `<span class="progress-text">${collectionStats.ownedCount}/${collectionStats.totalMounts} (${collectionStats.completionPercent}%)</span>`;
  html += '</div>';

  // By rarity
  html += '<div class="collection-by-rarity">';
  html += '<h4>By Rarity</h4>';
  for (const [rarity, data] of Object.entries(collectionStats.byRarity)) {
    const rarityData = MOUNT_RARITIES[rarity.toUpperCase()];
    const percent = data.total > 0 ? Math.round((data.owned / data.total) * 100) : 0;
    html += `<div class="rarity-row" style="color: ${rarityData?.color || '#AAA'}">`;
    html += `<span>${escapeHtml(rarityData?.name || rarity)}</span>`;
    html += `<span>${data.owned}/${data.total} (${percent}%)</span>`;
    html += '</div>';
  }
  html += '</div>';

  // By type
  html += '<div class="collection-by-type">';
  html += '<h4>By Type</h4>';
  for (const [type, data] of Object.entries(collectionStats.byType)) {
    const typeData = MOUNT_TYPES[type.toUpperCase()];
    const percent = data.total > 0 ? Math.round((data.owned / data.total) * 100) : 0;
    html += '<div class="type-row">';
    html += `<span>${escapeHtml(typeData?.name || type)}</span>`;
    html += `<span>${data.owned}/${data.total} (${percent}%)</span>`;
    html += '</div>';
  }
  html += '</div>';

  // Mount gallery
  html += '<div class="mount-gallery">';
  html += '<h4>All Mounts</h4>';
  for (const [mountId, mountData] of Object.entries(MOUNTS)) {
    const owned = mountState.ownedMounts.includes(mountId);
    const rarityData = MOUNT_RARITIES[mountData.rarity.toUpperCase()];

    html += `<div class="gallery-mount ${owned ? 'owned' : 'locked'}" title="${escapeHtml(mountData.name)}">`;
    html += `<div class="mount-icon" style="border-color: ${rarityData?.color || '#AAA'}">`;
    html += owned ? getMountIcon(mountData.type) : '?';
    html += '</div>';
    html += `<span class="mount-label">${owned ? escapeHtml(mountData.name) : '???'}</span>`;
    html += '</div>';
  }
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Get mount type icon
 */
function getMountIcon(type) {
  const icons = {
    land: '🐴',
    flying: '🦅',
    aquatic: '🐬',
    amphibious: '🐊'
  };
  return icons[type] || '🐴';
}

/**
 * Render mount HUD (for gameplay overlay)
 */
export function renderMountHUD(state) {
  const activeMountInfo = getActiveMountInfo(state);

  if (!activeMountInfo.mounted) {
    return '';
  }

  const mount = activeMountInfo.mountData;
  const stats = activeMountInfo.stats;
  const staminaPercent = (stats.currentStamina / mount.stamina) * 100;

  let html = '<div class="mount-hud">';
  html += `<div class="mount-hud-icon">${getMountIcon(mount.type)}</div>`;
  html += '<div class="mount-hud-info">';
  html += `<span class="mount-hud-name">${escapeHtml(mount.name)}</span>`;
  html += `<div class="mount-hud-stamina">`;
  html += `<div class="stamina-fill" style="width: ${staminaPercent}%; background: ${getStaminaColor(staminaPercent)}"></div>`;
  html += '</div>';
  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render mount feed menu
 */
export function renderMountFeedMenu(state, mountId, feedInventory = {}) {
  const feedItems = [
    { id: 'hay', name: 'Hay', icon: '🌾', happiness: 5, bond: 1, stamina: 10 },
    { id: 'oats', name: 'Oats', icon: '🌾', happiness: 10, bond: 2, stamina: 20 },
    { id: 'apple', name: 'Apple', icon: '🍎', happiness: 15, bond: 3, stamina: 15 },
    { id: 'carrot', name: 'Carrot', icon: '🥕', happiness: 12, bond: 2, stamina: 25 },
    { id: 'sugar_cube', name: 'Sugar Cube', icon: '🧊', happiness: 20, bond: 5, stamina: 5 },
    { id: 'golden_apple', name: 'Golden Apple', icon: '🍏', happiness: 30, bond: 10, stamina: 50 }
  ];

  let html = '<div class="mount-feed-menu">';
  html += '<h4>Feed Mount</h4>';
  html += '<div class="feed-items">';

  for (const item of feedItems) {
    const count = feedInventory[item.id] || 0;
    const disabled = count <= 0;

    html += `<div class="feed-item ${disabled ? 'disabled' : ''}" data-feed-id="${item.id}" data-mount-id="${escapeHtml(mountId)}">`;
    html += `<span class="feed-icon">${item.icon}</span>`;
    html += `<span class="feed-name">${escapeHtml(item.name)}</span>`;
    html += `<span class="feed-count">x${count}</span>`;
    html += '<div class="feed-effects">';
    html += `<span>+${item.happiness} Happiness</span>`;
    html += `<span>+${item.bond} Bond</span>`;
    html += `<span>+${item.stamina} Stamina</span>`;
    html += '</div>';
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render mount details tooltip
 */
export function renderMountTooltip(mountId) {
  const mountData = MOUNTS[mountId];
  if (!mountData) return '';

  const rarityData = MOUNT_RARITIES[mountData.rarity.toUpperCase()];
  const typeData = MOUNT_TYPES[mountData.type.toUpperCase()];
  const abilities = getMountAbilities(mountId);

  let html = '<div class="mount-tooltip">';
  html += `<div class="tooltip-header" style="background: ${rarityData?.color || '#AAA'}">`;
  html += `<span class="tooltip-name">${escapeHtml(mountData.name)}</span>`;
  html += `<span class="tooltip-rarity">${escapeHtml(rarityData?.name || mountData.rarity)}</span>`;
  html += '</div>';

  html += '<div class="tooltip-body">';
  html += `<p class="tooltip-type">${escapeHtml(typeData?.name || mountData.type)}</p>`;
  html += `<p class="tooltip-description">${escapeHtml(mountData.description)}</p>`;

  html += '<div class="tooltip-stats">';
  html += `<div>Base Speed: ${mountData.baseSpeed}</div>`;
  html += `<div>Stamina: ${mountData.stamina}</div>`;
  html += `<div>Speed Bonus: ${Math.round((rarityData?.speedBonus || 1) * 100 - 100)}%</div>`;
  html += '</div>';

  if (abilities.length > 0) {
    html += '<div class="tooltip-abilities">';
    html += '<strong>Abilities:</strong>';
    html += '<ul>';
    for (const ability of abilities) {
      html += `<li>${escapeHtml(ability.name)}: ${escapeHtml(ability.description)}</li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Get mount system styles
 */
export function getMountStyles() {
  return `
    .mount-stable-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #eee;
    }

    .active-mount-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #2a4a3a;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .mount-icon {
      font-size: 24px;
    }

    .speed-bonus {
      margin-left: auto;
      color: #4CAF50;
      font-weight: bold;
    }

    .mount-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }

    .mount-card {
      background: #252540;
      border-radius: 8px;
      overflow: hidden;
    }

    .mount-card.active {
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    }

    .mount-header {
      padding: 12px;
      border-left: 4px solid;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mount-name {
      font-weight: bold;
      font-size: 16px;
    }

    .mount-body {
      padding: 12px;
    }

    .mount-type {
      color: #888;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .mount-description {
      font-size: 13px;
      color: #aaa;
      margin-bottom: 12px;
    }

    .mount-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 12px;
    }

    .mount-stats .stat {
      display: flex;
      justify-content: space-between;
    }

    .stamina-bar-container {
      height: 6px;
      background: #333;
      border-radius: 3px;
      margin-top: 12px;
      overflow: hidden;
    }

    .stamina-bar {
      height: 100%;
      transition: width 0.3s;
    }

    .mount-actions {
      padding: 12px;
      display: flex;
      gap: 8px;
      border-top: 1px solid #333;
    }

    .mount-actions button {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .mount-btn {
      background: #4CAF50;
      color: white;
    }

    .dismount-btn {
      background: #f44336;
      color: white;
    }

    .feed-btn {
      background: #ff9800;
      color: white;
    }

    .empty-message {
      text-align: center;
      color: #666;
      padding: 20px;
    }

    .mount-hud {
      position: fixed;
      bottom: 20px;
      left: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.7);
      padding: 8px 12px;
      border-radius: 8px;
    }

    .mount-hud-icon {
      font-size: 24px;
    }

    .mount-hud-name {
      font-size: 14px;
      color: #fff;
    }

    .mount-hud-stamina {
      width: 80px;
      height: 6px;
      background: #333;
      border-radius: 3px;
      overflow: hidden;
    }

    .stamina-fill {
      height: 100%;
    }

    .mount-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 10px;
    }

    .gallery-mount {
      text-align: center;
      padding: 8px;
      border-radius: 8px;
      background: #252540;
    }

    .gallery-mount.locked {
      opacity: 0.5;
    }

    .gallery-mount .mount-icon {
      width: 40px;
      height: 40px;
      border: 2px solid;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 4px;
    }

    .mount-label {
      font-size: 10px;
      color: #aaa;
    }
  `;
}
