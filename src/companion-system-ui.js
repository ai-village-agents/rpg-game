/**
 * Companion System UI
 * Rendering functions for companion interface
 */

import {
  COMPANION_TYPES,
  COMPANION_RARITIES,
  COMPANION_MOODS,
  COMPANION_ABILITIES,
  COMPANION_FOODS,
  getOwnedCompanions,
  getActiveCompanion,
  getAvailableSlots,
  getCompanionStats,
  calculateCombatPower
} from './companion-system.js';

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
 * Render companion card
 */
export function renderCompanionCard(companion, isActive = false) {
  if (!companion) return '';

  const type = COMPANION_TYPES[companion.type.toUpperCase()];
  const rarity = COMPANION_RARITIES[companion.rarity.toUpperCase()];
  const mood = COMPANION_MOODS[companion.mood.toUpperCase()];
  const combatPower = calculateCombatPower(companion);

  return `
    <div class="companion-card ${rarity.id} ${isActive ? 'active' : ''}" data-companion-id="${escapeHtml(companion.id)}">
      <div class="companion-header">
        <span class="companion-name">${escapeHtml(companion.name)}</span>
        <span class="companion-level">Lv.${companion.level}</span>
      </div>
      <div class="companion-type">${escapeHtml(type?.name || companion.type)}</div>
      <div class="companion-rarity rarity-${rarity.id}">${escapeHtml(rarity.name)}</div>
      <div class="companion-stats">
        <div class="stat-bar health">
          <span class="stat-label">HP</span>
          <div class="bar-fill" style="width: ${(companion.health / companion.maxHealth) * 100}%"></div>
          <span class="stat-value">${companion.health}/${companion.maxHealth}</span>
        </div>
        <div class="stat-bar hunger">
          <span class="stat-label">Hunger</span>
          <div class="bar-fill" style="width: ${companion.hunger}%"></div>
          <span class="stat-value">${companion.hunger}%</span>
        </div>
        <div class="stat-bar happiness">
          <span class="stat-label">Happy</span>
          <div class="bar-fill" style="width: ${companion.happiness}%"></div>
          <span class="stat-value">${companion.happiness}%</span>
        </div>
      </div>
      <div class="companion-mood mood-${mood?.id || 'content'}">
        ${getMoodIcon(companion.mood)} ${escapeHtml(mood?.name || 'Content')}
      </div>
      <div class="companion-power">CP: ${combatPower}</div>
    </div>
  `;
}

/**
 * Get mood icon
 */
function getMoodIcon(mood) {
  const icons = {
    ecstatic: '&#128525;',
    happy: '&#128512;',
    content: '&#128528;',
    unhappy: '&#128543;',
    miserable: '&#128557;'
  };
  return icons[mood] || icons.content;
}

/**
 * Render companion list
 */
export function renderCompanionList(state) {
  const companions = getOwnedCompanions(state);
  const { companion: active } = getActiveCompanion(state);
  const slots = getAvailableSlots(state);

  if (companions.length === 0) {
    return `
      <div class="companion-list empty">
        <p>No companions owned</p>
        <p class="slots-info">Slots: 0/${slots.max}</p>
      </div>
    `;
  }

  return `
    <div class="companion-list">
      <div class="slots-info">Companions: ${slots.used}/${slots.max}</div>
      <div class="companions-grid">
        ${companions.map(c => renderCompanionCard(c, active?.id === c.id)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render companion details
 */
export function renderCompanionDetails(companion) {
  if (!companion) {
    return '<div class="companion-details empty">No companion selected</div>';
  }

  const type = COMPANION_TYPES[companion.type.toUpperCase()];
  const rarity = COMPANION_RARITIES[companion.rarity.toUpperCase()];
  const mood = COMPANION_MOODS[companion.mood.toUpperCase()];

  return `
    <div class="companion-details">
      <h3>${escapeHtml(companion.name)}</h3>
      <div class="detail-section">
        <div class="detail-row">
          <span class="label">Type:</span>
          <span class="value">${escapeHtml(type?.name || companion.type)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Rarity:</span>
          <span class="value rarity-${rarity.id}">${escapeHtml(rarity.name)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Level:</span>
          <span class="value">${companion.level}</span>
        </div>
        <div class="detail-row">
          <span class="label">EXP:</span>
          <span class="value">${companion.exp}/${companion.expToLevel}</span>
        </div>
      </div>
      <div class="detail-section">
        <h4>Combat Stats</h4>
        <div class="detail-row">
          <span class="label">Health:</span>
          <span class="value">${companion.health}/${companion.maxHealth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Damage:</span>
          <span class="value">${companion.damage}</span>
        </div>
        <div class="detail-row">
          <span class="label">Combat Power:</span>
          <span class="value">${calculateCombatPower(companion)}</span>
        </div>
      </div>
      <div class="detail-section">
        <h4>Status</h4>
        <div class="detail-row">
          <span class="label">Mood:</span>
          <span class="value">${getMoodIcon(companion.mood)} ${escapeHtml(mood?.name || 'Content')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Loyalty:</span>
          <span class="value">${companion.loyalty}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Hunger:</span>
          <span class="value">${companion.hunger}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Happiness:</span>
          <span class="value">${companion.happiness}%</span>
        </div>
      </div>
      <div class="detail-section">
        <h4>Battle Record</h4>
        <div class="detail-row">
          <span class="label">Battles:</span>
          <span class="value">${companion.battleCount}</span>
        </div>
        <div class="detail-row">
          <span class="label">Kills:</span>
          <span class="value">${companion.kills}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render companion abilities
 */
export function renderCompanionAbilities(companion) {
  if (!companion) return '';

  const rarity = COMPANION_RARITIES[companion.rarity.toUpperCase()];

  return `
    <div class="companion-abilities">
      <h4>Abilities (${companion.abilities.length}/${rarity.abilitySlots})</h4>
      <div class="abilities-list">
        ${companion.abilities.map(abilityId => {
          const ability = COMPANION_ABILITIES[abilityId.toUpperCase()];
          const cooldown = companion.cooldowns[abilityId] || 0;
          const onCooldown = cooldown > 0;

          return `
            <div class="ability ${ability?.type || ''} ${onCooldown ? 'on-cooldown' : ''}"
                 data-ability-id="${escapeHtml(abilityId)}">
              <span class="ability-name">${escapeHtml(ability?.name || abilityId)}</span>
              <span class="ability-type">${escapeHtml(ability?.type || 'unknown')}</span>
              ${onCooldown ? `<span class="cooldown">${cooldown} turns</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render feeding menu
 */
export function renderFeedingMenu(companion) {
  if (!companion) return '';

  return `
    <div class="feeding-menu">
      <h4>Feed ${escapeHtml(companion.name)}</h4>
      <div class="food-options">
        ${Object.values(COMPANION_FOODS).map(food => `
          <button class="food-option" data-food-id="${escapeHtml(food.id)}">
            <span class="food-name">${escapeHtml(food.name)}</span>
            <span class="food-stats">+${food.satiety} Hunger, +${food.happiness} Happy</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render type selector
 */
export function renderTypeSelector(selected) {
  return `
    <div class="type-selector">
      <h4>Companion Type</h4>
      <div class="type-options">
        ${Object.values(COMPANION_TYPES).map(type => `
          <button class="type-option ${selected === type.id ? 'selected' : ''}"
                  data-type="${escapeHtml(type.id)}">
            ${escapeHtml(type.name)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render rarity selector
 */
export function renderRaritySelector(selected) {
  return `
    <div class="rarity-selector">
      <h4>Rarity</h4>
      <div class="rarity-options">
        ${Object.values(COMPANION_RARITIES).map(rarity => `
          <button class="rarity-option ${selected === rarity.id ? 'selected' : ''} rarity-${rarity.id}"
                  data-rarity="${escapeHtml(rarity.id)}">
            ${escapeHtml(rarity.name)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render ability selector
 */
export function renderAbilitySelector(selectedAbilities = []) {
  return `
    <div class="ability-selector">
      <h4>Available Abilities</h4>
      <div class="ability-options">
        ${Object.values(COMPANION_ABILITIES).map(ability => `
          <button class="ability-option ${selectedAbilities.includes(ability.id) ? 'selected' : ''}"
                  data-ability="${escapeHtml(ability.id)}">
            <span class="ability-name">${escapeHtml(ability.name)}</span>
            <span class="ability-info">${escapeHtml(ability.type)} - CD: ${ability.cooldown}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render companion stats summary
 */
export function renderCompanionStatsSummary(state) {
  const stats = getCompanionStats(state);

  return `
    <div class="companion-stats-summary">
      <h4>Companion Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.companionsTamed}</span>
          <span class="stat-label">Tamed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.companionsReleased}</span>
          <span class="stat-label">Released</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.totalBattles}</span>
          <span class="stat-label">Battles</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.totalExp}</span>
          <span class="stat-label">Total EXP</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render active companion indicator
 */
export function renderActiveCompanionIndicator(state) {
  const { companion, isActive } = getActiveCompanion(state);

  if (!isActive || !companion) {
    return '<div class="active-companion-indicator empty">No active companion</div>';
  }

  const mood = COMPANION_MOODS[companion.mood.toUpperCase()];

  return `
    <div class="active-companion-indicator">
      <span class="companion-icon">${getMoodIcon(companion.mood)}</span>
      <span class="companion-name">${escapeHtml(companion.name)}</span>
      <span class="companion-level">Lv.${companion.level}</span>
      <div class="mini-health-bar">
        <div class="bar-fill" style="width: ${(companion.health / companion.maxHealth) * 100}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render companion action buttons
 */
export function renderCompanionActions(companion, isActive = false) {
  if (!companion) return '';

  return `
    <div class="companion-actions">
      ${isActive
        ? '<button class="action-btn dismiss" data-action="dismiss">Dismiss</button>'
        : '<button class="action-btn summon" data-action="summon">Summon</button>'
      }
      <button class="action-btn feed" data-action="feed">Feed</button>
      <button class="action-btn train" data-action="train">Train</button>
      ${companion.health === 0
        ? '<button class="action-btn revive" data-action="revive">Revive</button>'
        : ''
      }
      <button class="action-btn release" data-action="release">Release</button>
    </div>
  `;
}

/**
 * Render exp bar
 */
export function renderExpBar(companion) {
  if (!companion) return '';

  const expPercent = (companion.exp / companion.expToLevel) * 100;

  return `
    <div class="exp-bar">
      <div class="exp-fill" style="width: ${expPercent}%"></div>
      <span class="exp-text">${companion.exp} / ${companion.expToLevel} EXP</span>
    </div>
  `;
}

/**
 * Render loyalty indicator
 */
export function renderLoyaltyIndicator(loyalty) {
  let loyaltyLevel = 'low';
  if (loyalty >= 80) loyaltyLevel = 'high';
  else if (loyalty >= 50) loyaltyLevel = 'medium';

  return `
    <div class="loyalty-indicator ${loyaltyLevel}">
      <span class="loyalty-label">Loyalty</span>
      <div class="loyalty-bar">
        <div class="loyalty-fill" style="width: ${loyalty}%"></div>
      </div>
      <span class="loyalty-value">${loyalty}%</span>
    </div>
  `;
}
