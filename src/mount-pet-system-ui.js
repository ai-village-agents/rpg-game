/**
 * Mount and Pet System UI Components
 * Renders companion management interfaces
 */

import {
  MOUNT_TYPE,
  PET_TYPE,
  COMPANION_RARITY,
  PET_ABILITY,
  MOUNT_ABILITY,
  HAPPINESS_LEVEL,
  MOUNT_CONFIG,
  PET_CONFIG,
  getHappinessLevel,
  calculateMountSpeed,
  getActivePetBonuses,
  getMountAbilities,
  getCompanionsSortedByLevel,
  getCompanionCountByRarity,
  getXpForLevel
} from './mount-pet-system.js';

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
  [COMPANION_RARITY.COMMON]: '#9d9d9d',
  [COMPANION_RARITY.UNCOMMON]: '#1eff00',
  [COMPANION_RARITY.RARE]: '#0070dd',
  [COMPANION_RARITY.EPIC]: '#a335ee',
  [COMPANION_RARITY.LEGENDARY]: '#ff8000'
};

// Happiness icons
const HAPPINESS_ICONS = {
  [HAPPINESS_LEVEL.MISERABLE]: '😢',
  [HAPPINESS_LEVEL.UNHAPPY]: '😞',
  [HAPPINESS_LEVEL.CONTENT]: '😐',
  [HAPPINESS_LEVEL.HAPPY]: '😊',
  [HAPPINESS_LEVEL.ECSTATIC]: '😄'
};

/**
 * Render companion card
 */
function renderCompanionCard(companion, isMount, isActive) {
  const config = isMount ? MOUNT_CONFIG[companion.type] : PET_CONFIG[companion.type];
  const happinessLevel = getHappinessLevel(companion.happiness);
  const rarityColor = RARITY_COLORS[companion.rarity];
  const happinessIcon = HAPPINESS_ICONS[happinessLevel];
  const xpNeeded = getXpForLevel(companion.level + 1);
  const xpPercent = Math.min(100, (companion.xp / xpNeeded) * 100);

  const abilities = companion.abilities.map(a => {
    const abilityName = a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<span class="ability-tag">${escapeHtml(abilityName)}</span>`;
  }).join('');

  return `
    <div class="companion-card ${isActive ? 'active' : ''}" data-id="${escapeHtml(companion.id)}">
      <div class="companion-header" style="border-color: ${rarityColor}">
        <span class="companion-name" style="color: ${rarityColor}">${escapeHtml(companion.name)}</span>
        <span class="companion-level">Lv.${companion.level}</span>
      </div>
      <div class="companion-portrait">
        <span class="companion-icon">${isMount ? '🐴' : '🐾'}</span>
        ${isActive ? '<span class="equipped-badge">ACTIVE</span>' : ''}
      </div>
      <div class="companion-stats">
        <div class="stat-row">
          <span class="stat-label">Happiness:</span>
          <span class="stat-value">${happinessIcon} ${companion.happiness}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Hunger:</span>
          <div class="hunger-bar">
            <div class="hunger-fill" style="width: ${companion.hunger}%"></div>
          </div>
        </div>
        <div class="stat-row">
          <span class="stat-label">Bond:</span>
          <div class="bond-bar">
            <div class="bond-fill" style="width: ${companion.bondLevel}%"></div>
          </div>
        </div>
        <div class="xp-row">
          <span class="xp-label">XP:</span>
          <div class="xp-bar">
            <div class="xp-fill" style="width: ${xpPercent}%"></div>
            <span class="xp-text">${companion.xp} / ${xpNeeded}</span>
          </div>
        </div>
      </div>
      <div class="companion-abilities">
        ${abilities}
      </div>
      <div class="companion-actions">
        ${isActive
          ? `<button class="btn-unequip" data-id="${escapeHtml(companion.id)}">Unequip</button>`
          : `<button class="btn-equip" data-id="${escapeHtml(companion.id)}">Equip</button>`
        }
        <button class="btn-feed" data-id="${escapeHtml(companion.id)}">Feed</button>
        <button class="btn-rename" data-id="${escapeHtml(companion.id)}">Rename</button>
      </div>
    </div>
  `;
}

/**
 * Render stable panel (mounts)
 */
function renderStablePanel(state) {
  const mounts = getCompanionsSortedByLevel(state, true);
  const capacity = state.stable.capacity;
  const used = Object.keys(state.mounts).length;

  const mountCards = mounts.map(mount =>
    renderCompanionCard(mount, true, state.activeMount === mount.id)
  ).join('');

  return `
    <div class="stable-panel">
      <div class="panel-header">
        <h2>🏇 Stable</h2>
        <span class="capacity-indicator">${used} / ${capacity}</span>
      </div>
      <div class="companion-grid">
        ${mountCards || '<p class="empty-message">No mounts in stable</p>'}
      </div>
      <div class="panel-footer">
        <button class="btn-upgrade-stable" ${state.stable.upgrades >= 5 ? 'disabled' : ''}>
          Upgrade Stable (+2 slots)
        </button>
      </div>
    </div>
  `;
}

/**
 * Render kennel panel (pets)
 */
function renderKennelPanel(state) {
  const pets = getCompanionsSortedByLevel(state, false);
  const capacity = state.kennel.capacity;
  const used = Object.keys(state.pets).length;

  const petCards = pets.map(pet =>
    renderCompanionCard(pet, false, state.activePet === pet.id)
  ).join('');

  return `
    <div class="kennel-panel">
      <div class="panel-header">
        <h2>🐕 Kennel</h2>
        <span class="capacity-indicator">${used} / ${capacity}</span>
      </div>
      <div class="companion-grid">
        ${petCards || '<p class="empty-message">No pets in kennel</p>'}
      </div>
      <div class="panel-footer">
        <button class="btn-upgrade-kennel" ${state.kennel.upgrades >= 5 ? 'disabled' : ''}>
          Upgrade Kennel (+2 slots)
        </button>
      </div>
    </div>
  `;
}

/**
 * Render active companion HUD
 */
function renderCompanionHud(state) {
  const mountSection = state.activeMount ? renderActiveMountHud(state) : '<div class="no-mount">No mount</div>';
  const petSection = state.activePet ? renderActivePetHud(state) : '<div class="no-pet">No pet</div>';

  return `
    <div class="companion-hud">
      <div class="hud-mount">
        ${mountSection}
      </div>
      <div class="hud-pet">
        ${petSection}
      </div>
    </div>
  `;
}

/**
 * Render active mount in HUD
 */
function renderActiveMountHud(state) {
  const mount = state.mounts[state.activeMount];
  if (!mount) return '';

  const happinessLevel = getHappinessLevel(mount.happiness);
  const happinessIcon = HAPPINESS_ICONS[happinessLevel];
  const speed = calculateMountSpeed(state).toFixed(2);
  const abilities = getMountAbilities(state);

  const abilityIcons = abilities.map(a => {
    switch(a) {
      case MOUNT_ABILITY.FLYING: return '🦅';
      case MOUNT_ABILITY.SWIMMING: return '🏊';
      case MOUNT_ABILITY.COMBAT_MOUNT: return '⚔️';
      case MOUNT_ABILITY.SPEED_BOOST: return '💨';
      case MOUNT_ABILITY.TERRAIN_MASTERY: return '🏔️';
      default: return '✨';
    }
  }).join(' ');

  return `
    <div class="active-mount-hud">
      <div class="mount-icon">🐴</div>
      <div class="mount-info">
        <span class="mount-name">${escapeHtml(mount.name)}</span>
        <span class="mount-speed">Speed: ${speed}x</span>
      </div>
      <div class="mount-status">
        <span class="happiness">${happinessIcon}</span>
        <span class="abilities">${abilityIcons}</span>
      </div>
    </div>
  `;
}

/**
 * Render active pet in HUD
 */
function renderActivePetHud(state) {
  const pet = state.pets[state.activePet];
  if (!pet) return '';

  const happinessLevel = getHappinessLevel(pet.happiness);
  const happinessIcon = HAPPINESS_ICONS[happinessLevel];
  const bonuses = getActivePetBonuses(state);

  const bonusText = [];
  if (bonuses.xpBoost > 0) bonusText.push(`+${(bonuses.xpBoost * 100).toFixed(0)}% XP`);
  if (bonuses.goldBoost > 0) bonusText.push(`+${(bonuses.goldBoost * 100).toFixed(0)}% Gold`);
  if (bonuses.lootFinder > 0) bonusText.push(`+${(bonuses.lootFinder * 100).toFixed(0)}% Loot`);

  return `
    <div class="active-pet-hud">
      <div class="pet-icon">🐾</div>
      <div class="pet-info">
        <span class="pet-name">${escapeHtml(pet.name)}</span>
        <span class="pet-bonuses">${bonusText.join(', ') || 'No active bonuses'}</span>
      </div>
      <div class="pet-status">
        <span class="happiness">${happinessIcon}</span>
      </div>
    </div>
  `;
}

/**
 * Render feeding dialog
 */
function renderFeedDialog(companion, isMount) {
  const config = isMount ? MOUNT_CONFIG[companion.type] : PET_CONFIG[companion.type];
  const foodOptions = config.foodTypes.map(food => {
    const foodName = food.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `
      <button class="food-option" data-food="${escapeHtml(food)}">
        ${escapeHtml(foodName)}
      </button>
    `;
  }).join('');

  return `
    <div class="feed-dialog">
      <h3>Feed ${escapeHtml(companion.name)}</h3>
      <p>Current Hunger: ${companion.hunger}%</p>
      <div class="food-options">
        ${foodOptions}
      </div>
      <button class="btn-cancel">Cancel</button>
    </div>
  `;
}

/**
 * Render rename dialog
 */
function renderRenameDialog(companion) {
  return `
    <div class="rename-dialog">
      <h3>Rename ${escapeHtml(companion.name)}</h3>
      <input type="text" class="rename-input" value="${escapeHtml(companion.name)}" maxlength="30" />
      <div class="dialog-actions">
        <button class="btn-confirm-rename">Confirm</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render companion collection summary
 */
function renderCollectionSummary(state) {
  const mountCounts = getCompanionCountByRarity(state, true);
  const petCounts = getCompanionCountByRarity(state, false);

  const renderRarityRow = (counts) => {
    return Object.entries(counts).map(([rarity, count]) => `
      <span class="rarity-count" style="color: ${RARITY_COLORS[rarity]}">
        ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${count}
      </span>
    `).join('');
  };

  return `
    <div class="collection-summary">
      <div class="summary-section">
        <h4>Mounts</h4>
        <div class="rarity-counts">${renderRarityRow(mountCounts)}</div>
      </div>
      <div class="summary-section">
        <h4>Pets</h4>
        <div class="rarity-counts">${renderRarityRow(petCounts)}</div>
      </div>
    </div>
  `;
}

/**
 * Render new companion obtained notification
 */
function renderCompanionObtained(companion, isMount) {
  const config = isMount ? MOUNT_CONFIG[companion.type] : PET_CONFIG[companion.type];
  const rarityColor = RARITY_COLORS[companion.rarity];

  return `
    <div class="companion-obtained">
      <div class="obtained-header">New ${isMount ? 'Mount' : 'Pet'} Obtained!</div>
      <div class="obtained-icon">${isMount ? '🐴' : '🐾'}</div>
      <div class="obtained-name" style="color: ${rarityColor}">${escapeHtml(companion.name)}</div>
      <div class="obtained-rarity" style="color: ${rarityColor}">${companion.rarity.toUpperCase()}</div>
      <div class="obtained-abilities">
        ${companion.abilities.map(a => a.replace(/_/g, ' ')).join(', ')}
      </div>
    </div>
  `;
}

/**
 * Render level up notification
 */
function renderLevelUp(companion, newLevel, isMount) {
  const rarityColor = RARITY_COLORS[companion.rarity];

  return `
    <div class="level-up-notification">
      <div class="level-up-icon">⬆️</div>
      <div class="level-up-text">
        <span style="color: ${rarityColor}">${escapeHtml(companion.name)}</span>
        reached level <span class="new-level">${newLevel}</span>!
      </div>
    </div>
  `;
}

/**
 * Render mount selection for travel
 */
function renderMountSelection(state) {
  const mounts = Object.values(state.mounts);

  if (mounts.length === 0) {
    return `
      <div class="mount-selection empty">
        <p>You don't have any mounts yet.</p>
      </div>
    `;
  }

  const mountOptions = mounts.map(mount => {
    const config = MOUNT_CONFIG[mount.type];
    const happinessLevel = getHappinessLevel(mount.happiness);
    const happinessIcon = HAPPINESS_ICONS[happinessLevel];
    const isActive = state.activeMount === mount.id;
    const canFlyMount = mount.abilities.includes(MOUNT_ABILITY.FLYING);
    const canSwimMount = mount.abilities.includes(MOUNT_ABILITY.SWIMMING);

    return `
      <div class="mount-option ${isActive ? 'selected' : ''}" data-id="${escapeHtml(mount.id)}">
        <span class="mount-name">${escapeHtml(mount.name)}</span>
        <span class="mount-speed">${config.baseSpeed}x</span>
        <span class="mount-features">
          ${canFlyMount ? '🦅' : ''}
          ${canSwimMount ? '🏊' : ''}
        </span>
        <span class="mount-mood">${happinessIcon}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="mount-selection">
      <h3>Select Mount</h3>
      <div class="mount-options">
        ${mountOptions}
      </div>
    </div>
  `;
}

/**
 * Render bonuses panel (shows all active bonuses)
 */
function renderBonusesPanel(state) {
  const speed = calculateMountSpeed(state);
  const petBonuses = getActivePetBonuses(state);
  const mountAbilities = getMountAbilities(state);

  return `
    <div class="bonuses-panel">
      <h3>Active Bonuses</h3>
      <div class="bonus-section">
        <h4>Mount</h4>
        <div class="bonus-row">
          <span class="bonus-label">Movement Speed:</span>
          <span class="bonus-value">${speed.toFixed(2)}x</span>
        </div>
        ${mountAbilities.length > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Abilities:</span>
            <span class="bonus-value">${mountAbilities.map(a => a.replace(/_/g, ' ')).join(', ')}</span>
          </div>
        ` : ''}
      </div>
      <div class="bonus-section">
        <h4>Pet</h4>
        ${petBonuses.xpBoost > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">XP Boost:</span>
            <span class="bonus-value">+${(petBonuses.xpBoost * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
        ${petBonuses.goldBoost > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Gold Boost:</span>
            <span class="bonus-value">+${(petBonuses.goldBoost * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
        ${petBonuses.lootFinder > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Loot Find:</span>
            <span class="bonus-value">+${(petBonuses.lootFinder * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
        ${petBonuses.combatAssist > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Combat Assist:</span>
            <span class="bonus-value">+${(petBonuses.combatAssist * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
        ${petBonuses.gatheringBoost > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Gathering:</span>
            <span class="bonus-value">+${(petBonuses.gatheringBoost * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
        ${petBonuses.stealthBonus > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Stealth:</span>
            <span class="bonus-value">+${(petBonuses.stealthBonus * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
        ${petBonuses.healingAura > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Healing Aura:</span>
            <span class="bonus-value">+${(petBonuses.healingAura * 100).toFixed(1)}% HP/sec</span>
          </div>
        ` : ''}
        ${petBonuses.elementalResist > 0 ? `
          <div class="bonus-row">
            <span class="bonus-label">Elemental Resist:</span>
            <span class="bonus-value">+${(petBonuses.elementalResist * 100).toFixed(1)}%</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Export all UI components
export {
  renderCompanionCard,
  renderStablePanel,
  renderKennelPanel,
  renderCompanionHud,
  renderActiveMountHud,
  renderActivePetHud,
  renderFeedDialog,
  renderRenameDialog,
  renderCollectionSummary,
  renderCompanionObtained,
  renderLevelUp,
  renderMountSelection,
  renderBonusesPanel,
  RARITY_COLORS,
  HAPPINESS_ICONS
};
