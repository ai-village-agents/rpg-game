/**
 * Status Effects UI Components
 * Renders status effect displays and notifications
 */

import {
  STATUS_TYPES,
  STATUS_DATA,
  EFFECT_CATEGORIES,
  getStatusData,
  getActiveStatusEffects,
  getBuffs,
  getDebuffs,
} from './status-effects.js';

/**
 * Get CSS styles for status effects UI
 * @returns {string} CSS styles
 */
export function getStatusEffectsStyles() {
  return `
.status-effects-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
}

.status-effect-icon {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 2px solid;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.status-effect-icon:hover {
  transform: scale(1.1);
  z-index: 10;
}

.status-effect-icon.buff {
  border-color: #4a8;
  background: rgba(68, 170, 136, 0.2);
}

.status-effect-icon.debuff {
  border-color: #a44;
  background: rgba(170, 68, 68, 0.2);
}

.status-effect-icon.control {
  border-color: #a8a;
  background: rgba(170, 136, 170, 0.2);
}

.status-effect-icon.shield {
  border-color: #48a;
  background: rgba(68, 136, 170, 0.2);
}

.status-effect-icon.special {
  border-color: #aa8;
  background: rgba(170, 170, 136, 0.2);
}

.status-duration {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #222;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
}

.status-stacks {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #aa4;
  color: #000;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: bold;
}

/* Status effect tooltip */
.status-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 8px 12px;
  min-width: 150px;
  z-index: 100;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.status-effect-icon:hover .status-tooltip {
  opacity: 1;
}

.status-tooltip-name {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 4px;
}

.status-tooltip-desc {
  font-size: 10px;
  color: #aaa;
  margin-bottom: 4px;
}

.status-tooltip-duration {
  font-size: 10px;
  color: #888;
}

/* Status bar display */
.status-bar {
  display: flex;
  gap: 2px;
  padding: 2px 4px;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
}

.status-bar-item {
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Status notification */
.status-notification {
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: status-notify 0.3s ease-out;
}

@keyframes status-notify {
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.status-notification.applied {
  background: linear-gradient(90deg, rgba(68, 170, 136, 0.3), transparent);
  border-left: 3px solid #4a8;
}

.status-notification.removed {
  background: linear-gradient(90deg, rgba(136, 136, 136, 0.3), transparent);
  border-left: 3px solid #888;
}

.status-notification.damage {
  background: linear-gradient(90deg, rgba(170, 68, 68, 0.3), transparent);
  border-left: 3px solid #a44;
}

.status-notification.heal {
  background: linear-gradient(90deg, rgba(68, 170, 68, 0.3), transparent);
  border-left: 3px solid #4a4;
}

.status-notification-icon {
  font-size: 18px;
}

.status-notification-text {
  font-size: 11px;
  color: #ddd;
}

/* Detailed status panel */
.status-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 12px;
}

.status-panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #e8e8e8;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-panel-section {
  margin-bottom: 12px;
}

.status-panel-section-title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.status-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  margin-bottom: 4px;
}

.status-list-item .icon {
  font-size: 18px;
}

.status-list-item .info {
  flex: 1;
}

.status-list-item .name {
  font-size: 12px;
  color: #e8e8e8;
}

.status-list-item .desc {
  font-size: 10px;
  color: #888;
}

.status-list-item .duration {
  font-size: 11px;
  color: #aaa;
  padding: 2px 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
}

/* Tick result display */
.status-tick-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tick-result {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
}

.tick-result.damage {
  background: rgba(170, 68, 68, 0.2);
  color: #f88;
}

.tick-result.heal {
  background: rgba(68, 170, 68, 0.2);
  color: #8f8;
}

.tick-result.mana {
  background: rgba(68, 68, 170, 0.2);
  color: #88f;
}

.tick-result.expired {
  background: rgba(136, 136, 136, 0.2);
  color: #aaa;
}
`;
}

/**
 * Get category class for styling
 * @param {Object} statusData - Status data
 * @returns {string} CSS class
 */
function getCategoryClass(statusData) {
  if (!statusData) return 'special';
  if (statusData.isBuff === true) return 'buff';
  if (statusData.category === EFFECT_CATEGORIES.CONTROL) return 'control';
  if (statusData.category === EFFECT_CATEGORIES.SHIELD) return 'shield';
  if (statusData.category === EFFECT_CATEGORIES.SPECIAL) return 'special';
  return 'debuff';
}

/**
 * Render status effect icon with tooltip
 * @param {Object} effect - Status effect instance
 * @returns {string} HTML string
 */
export function renderStatusIcon(effect) {
  const data = getStatusData(effect.type);
  if (!data) return '';
  
  const categoryClass = getCategoryClass(data);
  const stacksHtml = effect.stacks > 1 
    ? `<span class="status-stacks">${effect.stacks}</span>`
    : '';
  
  return `
    <div class="status-effect-icon ${categoryClass}" title="${escapeHtml(data.name)}">
      ${escapeHtml(data.icon)}
      <span class="status-duration">${effect.turnsRemaining}</span>
      ${stacksHtml}
      <div class="status-tooltip">
        <div class="status-tooltip-name">${escapeHtml(data.name)}</div>
        <div class="status-tooltip-desc">${escapeHtml(data.description)}</div>
        <div class="status-tooltip-duration">${effect.turnsRemaining} turns remaining</div>
      </div>
    </div>
  `.trim();
}

/**
 * Render all status effects for an entity
 * @param {Object} entity - Entity with statusEffects
 * @returns {string} HTML string
 */
export function renderStatusEffects(entity) {
  if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
    return '';
  }
  
  const icons = entity.statusEffects.map(effect => renderStatusIcon(effect)).join('');
  
  return `
    <div class="status-effects-container">
      ${icons}
    </div>
  `.trim();
}

/**
 * Render compact status bar
 * @param {Object} entity - Entity with statusEffects
 * @returns {string} HTML string
 */
export function renderStatusBar(entity) {
  if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
    return '';
  }
  
  const icons = entity.statusEffects.map(effect => {
    const data = getStatusData(effect.type);
    return `<span class="status-bar-item" title="${escapeHtml(data?.name || effect.type)}">${escapeHtml(data?.icon || '?')}</span>`;
  }).join('');
  
  return `<div class="status-bar">${icons}</div>`;
}

/**
 * Render status application notification
 * @param {Object} effect - Applied effect
 * @param {string} targetName - Name of target
 * @param {boolean} refreshed - Whether effect was refreshed
 * @returns {string} HTML string
 */
export function renderStatusAppliedNotice(effect, targetName, refreshed = false) {
  const data = getStatusData(effect.type);
  if (!data) return '';
  
  const action = refreshed ? 'refreshed on' : 'applied to';
  
  return `
    <div class="status-notification applied">
      <span class="status-notification-icon">${escapeHtml(data.icon)}</span>
      <span class="status-notification-text">${escapeHtml(data.name)} ${action} ${escapeHtml(targetName)}</span>
    </div>
  `.trim();
}

/**
 * Render status removal notification
 * @param {string} statusType - Status type removed
 * @param {string} targetName - Name of target
 * @returns {string} HTML string
 */
export function renderStatusRemovedNotice(statusType, targetName) {
  const data = getStatusData(statusType);
  if (!data) return '';
  
  return `
    <div class="status-notification removed">
      <span class="status-notification-icon">${escapeHtml(data.icon)}</span>
      <span class="status-notification-text">${escapeHtml(data.name)} wore off from ${escapeHtml(targetName)}</span>
    </div>
  `.trim();
}

/**
 * Render tick results
 * @param {Array} results - Array of tick results
 * @param {string} entityName - Entity name
 * @returns {string} HTML string
 */
export function renderTickResults(results, entityName) {
  if (!results || results.length === 0) return '';
  
  const resultHtml = results.map(r => {
    const data = getStatusData(r.type);
    const icon = data?.icon || '?';
    
    if (r.damage) {
      return `
        <div class="tick-result damage">
          <span>${escapeHtml(icon)}</span>
          <span>${escapeHtml(entityName)} took ${r.damage} damage from ${escapeHtml(r.name)}</span>
        </div>
      `;
    }
    
    if (r.heal) {
      return `
        <div class="tick-result heal">
          <span>${escapeHtml(icon)}</span>
          <span>${escapeHtml(entityName)} recovered ${r.heal} HP from ${escapeHtml(r.name)}</span>
        </div>
      `;
    }
    
    if (r.mana) {
      return `
        <div class="tick-result mana">
          <span>${escapeHtml(icon)}</span>
          <span>${escapeHtml(entityName)} recovered ${r.mana} MP from ${escapeHtml(r.name)}</span>
        </div>
      `;
    }
    
    if (r.expired) {
      return `
        <div class="tick-result expired">
          <span>${escapeHtml(icon)}</span>
          <span>${escapeHtml(r.name)} wore off from ${escapeHtml(entityName)}</span>
        </div>
      `;
    }
    
    return '';
  }).join('');
  
  return `<div class="status-tick-results">${resultHtml}</div>`;
}

/**
 * Render detailed status panel
 * @param {Object} entity - Entity with statusEffects
 * @returns {string} HTML string
 */
export function renderStatusPanel(entity) {
  if (!entity) {
    return `<div class="status-panel"><div class="status-panel-title">No Target</div></div>`;
  }
  
  const buffs = getBuffs(entity);
  const debuffs = getDebuffs(entity);
  
  const renderSection = (title, effects) => {
    if (effects.length === 0) return '';
    
    const items = effects.map(e => {
      const data = e.data || getStatusData(e.type);
      return `
        <div class="status-list-item">
          <span class="icon">${escapeHtml(data?.icon || '?')}</span>
          <div class="info">
            <div class="name">${escapeHtml(data?.name || e.type)}</div>
            <div class="desc">${escapeHtml(data?.description || '')}</div>
          </div>
          <span class="duration">${e.turnsRemaining}T</span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="status-panel-section">
        <div class="status-panel-section-title">${escapeHtml(title)}</div>
        ${items}
      </div>
    `;
  };
  
  const entityName = entity.name || 'Unknown';
  const buffsHtml = renderSection('Buffs', buffs);
  const debuffsHtml = renderSection('Debuffs', debuffs);
  
  return `
    <div class="status-panel">
      <div class="status-panel-title">
        ${escapeHtml(entityName)} - Status Effects
      </div>
      ${buffsHtml || ''}
      ${debuffsHtml || ''}
      ${!buffsHtml && !debuffsHtml ? '<div style="color: #888; font-size: 11px;">No active status effects</div>' : ''}
    </div>
  `.trim();
}

/**
 * Render status effect catalog (all types)
 * @returns {string} HTML string
 */
export function renderStatusCatalog() {
  const categories = {
    [EFFECT_CATEGORIES.DAMAGE_OVER_TIME]: 'Damage Over Time',
    [EFFECT_CATEGORIES.HEAL_OVER_TIME]: 'Healing Over Time',
    [EFFECT_CATEGORIES.STAT_MODIFIER]: 'Stat Modifiers',
    [EFFECT_CATEGORIES.CONTROL]: 'Control Effects',
    [EFFECT_CATEGORIES.SHIELD]: 'Shield Effects',
    [EFFECT_CATEGORIES.SPECIAL]: 'Special Effects',
  };
  
  const sections = Object.entries(categories).map(([cat, title]) => {
    const effects = Object.entries(STATUS_DATA)
      .filter(([_, data]) => data.category === cat)
      .map(([type, data]) => `
        <div class="status-list-item">
          <span class="icon">${escapeHtml(data.icon)}</span>
          <div class="info">
            <div class="name">${escapeHtml(data.name)}</div>
            <div class="desc">${escapeHtml(data.description)}</div>
          </div>
        </div>
      `).join('');
    
    return `
      <div class="status-panel-section">
        <div class="status-panel-section-title">${escapeHtml(title)}</div>
        ${effects}
      </div>
    `;
  }).join('');
  
  return `
    <div class="status-panel">
      <div class="status-panel-title">Status Effects Catalog</div>
      ${sections}
    </div>
  `.trim();
}

/**
 * Render cannot act notification
 * @param {string} entityName - Entity name
 * @param {string} effectName - Effect preventing action
 * @returns {string} HTML string
 */
export function renderCannotActNotice(entityName, effectName) {
  return `
    <div class="status-notification damage">
      <span class="status-notification-icon">\uD83D\uDEAB</span>
      <span class="status-notification-text">${escapeHtml(entityName)} cannot act - ${escapeHtml(effectName)}!</span>
    </div>
  `.trim();
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
