/**
 * Buff/Debuff System UI Components
 * Display status effects, shields, and effect tooltips
 */

import {
  EFFECT_TYPES,
  EFFECT_CATEGORIES,
  getEffectSummary,
  getEffectInfo,
  getTotalShieldAmount,
  getRemainingDuration,
  getEffectStacks
} from './buff-debuff-system.js';

// HTML escape helper
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render effect bar (shows all active effects)
export function renderEffectBar(state, registry, targetName = 'Target') {
  const summary = getEffectSummary(state, registry);

  const buffIcons = summary.buffs.map(b => renderEffectIcon(b, 'buff')).join('');
  const debuffIcons = summary.debuffs.map(d => renderEffectIcon(d, 'debuff')).join('');

  return `
    <div class="effect-bar">
      <div class="effect-bar-header">
        <span class="target-name">${escapeHtml(targetName)}</span>
        ${summary.totalShields > 0 ? `<span class="shield-indicator">🛡️ ${summary.totalShields}</span>` : ''}
      </div>
      <div class="effects-container">
        ${buffIcons ? `<div class="buffs">${buffIcons}</div>` : ''}
        ${debuffIcons ? `<div class="debuffs">${debuffIcons}</div>` : ''}
        ${!buffIcons && !debuffIcons ? '<span class="no-effects">No active effects</span>' : ''}
      </div>
    </div>
  `;
}

// Render single effect icon
function renderEffectIcon(effect, type) {
  const typeClass = type === 'buff' ? 'effect-buff' : 'effect-debuff';

  return `
    <div class="effect-icon ${typeClass}"
         data-effect-id="${escapeHtml(effect.effectId)}"
         title="${escapeHtml(effect.name)}">
      <span class="icon">${effect.icon}</span>
      ${effect.stacks > 1 ? `<span class="stacks">${effect.stacks}</span>` : ''}
      <div class="duration-bar">
        <div class="duration-fill" style="width: ${Math.min(100, effect.ticksRemaining * 20)}%"></div>
      </div>
    </div>
  `;
}

// Render effect tooltip
export function renderEffectTooltip(registry, effectId, activeData = null) {
  const effect = getEffectInfo(registry, effectId);
  if (!effect) return '';

  const categoryInfo = EFFECT_CATEGORIES[effect.category];
  const typeLabel = effect.type === 'BUFF' ? 'Buff' : effect.type === 'DEBUFF' ? 'Debuff' : 'Effect';

  let statsSection = '';
  if (Object.keys(effect.statModifiers).length > 0) {
    const mods = Object.entries(effect.statModifiers).map(([stat, mod]) => {
      const value = typeof mod === 'number' ? mod : mod.flat || mod.percent;
      const sign = value >= 0 ? '+' : '';
      const suffix = typeof mod === 'object' && mod.percent ? '%' : '';
      return `<span class="stat-mod">${stat}: ${sign}${value}${suffix}</span>`;
    }).join('');
    statsSection = `<div class="tooltip-stats">${mods}</div>`;
  }

  let dotSection = '';
  if (effect.damagePerTick > 0) {
    dotSection = `<div class="tooltip-dot">Damage: ${effect.damagePerTick} per tick (${effect.damageType})</div>`;
  }
  if (effect.healPerTick > 0) {
    dotSection += `<div class="tooltip-hot">Healing: ${effect.healPerTick} per tick</div>`;
  }
  if (effect.shieldAmount > 0) {
    dotSection += `<div class="tooltip-shield">Shield: ${effect.shieldAmount}</div>`;
  }

  return `
    <div class="effect-tooltip effect-tooltip-${effect.type.toLowerCase()}">
      <div class="tooltip-header">
        <span class="tooltip-icon">${effect.icon}</span>
        <div class="tooltip-title">
          <span class="tooltip-name">${escapeHtml(effect.name)}</span>
          <span class="tooltip-type">${typeLabel} - ${categoryInfo?.name || effect.category}</span>
        </div>
      </div>
      <p class="tooltip-description">${escapeHtml(effect.description)}</p>
      ${statsSection}
      ${dotSection}
      <div class="tooltip-meta">
        <span>Duration: ${effect.duration} turns</span>
        ${effect.maxStacks > 1 ? `<span>Max Stacks: ${effect.maxStacks}</span>` : ''}
        ${!effect.dispellable ? '<span class="undispellable">Cannot be dispelled</span>' : ''}
      </div>
      ${activeData ? `
        <div class="tooltip-active">
          <span>Remaining: ${activeData.ticksRemaining} turns</span>
          ${activeData.stacks > 1 ? `<span>Current Stacks: ${activeData.stacks}</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// Render effect application notification
export function renderEffectAppliedNotification(effect, targetName, stacks = 1) {
  const typeClass = effect.type === 'BUFF' ? 'applied-buff' : 'applied-debuff';

  return `
    <div class="effect-notification ${typeClass}">
      <span class="notification-icon">${effect.icon}</span>
      <div class="notification-content">
        <span class="notification-name">${escapeHtml(effect.name)}</span>
        <span class="notification-target">applied to ${escapeHtml(targetName)}</span>
        ${stacks > 1 ? `<span class="notification-stacks">(${stacks} stacks)</span>` : ''}
      </div>
    </div>
  `;
}

// Render effect removal notification
export function renderEffectRemovedNotification(effect, targetName, reason = 'expired') {
  return `
    <div class="effect-notification removed">
      <span class="notification-icon">${effect.icon}</span>
      <div class="notification-content">
        <span class="notification-name">${escapeHtml(effect.name)}</span>
        <span class="notification-reason">${reason} on ${escapeHtml(targetName)}</span>
      </div>
    </div>
  `;
}

// Render tick notification (for DoT/HoT)
export function renderTickNotification(tickResult, targetName) {
  const isHealing = tickResult.type === 'heal';
  const typeClass = isHealing ? 'tick-heal' : 'tick-damage';
  const sign = isHealing ? '+' : '-';

  return `
    <div class="tick-notification ${typeClass}">
      <span class="tick-amount">${sign}${tickResult.amount}</span>
      <span class="tick-target">${escapeHtml(targetName)}</span>
      ${tickResult.damageType ? `<span class="tick-type">(${tickResult.damageType})</span>` : ''}
    </div>
  `;
}

// Render shield display
export function renderShieldDisplay(state, maxHealth) {
  const shieldAmount = getTotalShieldAmount(state);
  if (shieldAmount === 0) return '';

  const shieldPercent = Math.min(100, (shieldAmount / maxHealth) * 100);

  return `
    <div class="shield-display">
      <div class="shield-bar">
        <div class="shield-fill" style="width: ${shieldPercent}%"></div>
      </div>
      <span class="shield-amount">🛡️ ${shieldAmount}</span>
    </div>
  `;
}

// Render effect list panel (for detailed view)
export function renderEffectListPanel(state, registry) {
  const summary = getEffectSummary(state, registry);

  const renderList = (effects, title) => {
    if (effects.length === 0) return '';

    const items = effects.map(e => {
      const effect = getEffectInfo(registry, e.effectId);
      const categoryInfo = EFFECT_CATEGORIES[effect?.category];

      return `
        <div class="effect-list-item" data-effect-id="${escapeHtml(e.effectId)}">
          <span class="list-icon">${e.icon}</span>
          <div class="list-info">
            <span class="list-name">${escapeHtml(e.name)}</span>
            <span class="list-category">${categoryInfo?.name || 'Unknown'}</span>
          </div>
          <div class="list-meta">
            ${e.stacks > 1 ? `<span class="list-stacks">x${e.stacks}</span>` : ''}
            <span class="list-duration">${e.ticksRemaining}t</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="effect-list-section">
        <h4>${title} (${effects.length})</h4>
        <div class="effect-list">${items}</div>
      </div>
    `;
  };

  return `
    <div class="effect-list-panel">
      ${renderList(summary.buffs, 'Buffs')}
      ${renderList(summary.debuffs, 'Debuffs')}
      ${summary.totalShields > 0 ? `
        <div class="shields-section">
          <h4>Active Shields</h4>
          <span class="total-shields">🛡️ ${summary.totalShields} total absorption</span>
        </div>
      ` : ''}
    </div>
  `;
}

// Render dispel preview
export function renderDispelPreview(state, registry, type = null) {
  const effects = state.activeEffects.filter(active => {
    const effect = getEffectInfo(registry, active.effectId);
    return effect && effect.dispellable && (!type || effect.type === type);
  });

  if (effects.length === 0) {
    return '<p class="no-dispellable">No dispellable effects</p>';
  }

  const items = effects.map(active => {
    const effect = getEffectInfo(registry, active.effectId);
    return `
      <div class="dispel-item">
        <span class="dispel-icon">${effect.icon}</span>
        <span class="dispel-name">${escapeHtml(effect.name)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="dispel-preview">
      <h4>Dispellable Effects</h4>
      <div class="dispel-list">${items}</div>
    </div>
  `;
}

// Get effect styles
export function getEffectStyles() {
  return `
    .effect-bar { background: #2a2a2a; border-radius: 8px; padding: 10px; }
    .effect-bar-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .target-name { font-weight: bold; }
    .shield-indicator { color: #64B5F6; font-weight: bold; }

    .effects-container { display: flex; flex-wrap: wrap; gap: 5px; }
    .buffs, .debuffs { display: flex; gap: 4px; }
    .no-effects { color: #888; font-size: 12px; }

    .effect-icon { position: relative; width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .effect-buff { background: linear-gradient(180deg, #2E7D32, #1B5E20); border: 1px solid #4CAF50; }
    .effect-debuff { background: linear-gradient(180deg, #C62828, #B71C1C); border: 1px solid #f44336; }
    .effect-icon .icon { font-size: 18px; }
    .effect-icon .stacks { position: absolute; bottom: -2px; right: -2px; background: #FFD700; color: #000; font-size: 10px; font-weight: bold; padding: 1px 4px; border-radius: 3px; }
    .duration-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #333; }
    .duration-fill { height: 100%; background: #4CAF50; transition: width 0.3s; }
    .effect-debuff .duration-fill { background: #f44336; }

    .effect-tooltip { background: #1a1a1a; border-radius: 8px; padding: 12px; max-width: 280px; border: 2px solid #444; }
    .effect-tooltip-buff { border-color: #4CAF50; }
    .effect-tooltip-debuff { border-color: #f44336; }
    .tooltip-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .tooltip-icon { font-size: 28px; }
    .tooltip-name { font-weight: bold; display: block; }
    .tooltip-type { font-size: 11px; color: #888; }
    .tooltip-description { font-size: 13px; margin: 8px 0; color: #ccc; }
    .tooltip-stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
    .stat-mod { background: #333; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .tooltip-dot, .tooltip-hot, .tooltip-shield { font-size: 12px; margin: 4px 0; }
    .tooltip-dot { color: #f44336; }
    .tooltip-hot { color: #4CAF50; }
    .tooltip-shield { color: #64B5F6; }
    .tooltip-meta { display: flex; gap: 10px; font-size: 11px; color: #888; margin-top: 8px; }
    .undispellable { color: #ff9800; }
    .tooltip-active { background: #333; padding: 6px; border-radius: 4px; margin-top: 8px; font-size: 12px; }

    .effect-notification { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 6px; margin: 4px 0; }
    .applied-buff { background: rgba(76, 175, 80, 0.3); border-left: 3px solid #4CAF50; }
    .applied-debuff { background: rgba(244, 67, 54, 0.3); border-left: 3px solid #f44336; }
    .removed { background: rgba(158, 158, 158, 0.3); border-left: 3px solid #9e9e9e; }
    .notification-icon { font-size: 20px; }
    .notification-content { display: flex; flex-direction: column; gap: 2px; }
    .notification-name { font-weight: bold; }
    .notification-target, .notification-reason { font-size: 12px; color: #aaa; }

    .tick-notification { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; font-size: 13px; }
    .tick-damage { background: rgba(244, 67, 54, 0.3); color: #ff6b6b; }
    .tick-heal { background: rgba(76, 175, 80, 0.3); color: #69f0ae; }
    .tick-amount { font-weight: bold; }

    .shield-display { margin: 5px 0; }
    .shield-bar { height: 8px; background: #333; border-radius: 4px; overflow: hidden; }
    .shield-fill { height: 100%; background: linear-gradient(90deg, #42A5F5, #64B5F6); }
    .shield-amount { font-size: 12px; color: #64B5F6; }

    .effect-list-panel { background: #2a2a2a; border-radius: 8px; padding: 15px; }
    .effect-list-section { margin-bottom: 15px; }
    .effect-list-section h4 { margin: 0 0 10px 0; color: #888; font-size: 13px; }
    .effect-list { display: flex; flex-direction: column; gap: 6px; }
    .effect-list-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: #333; border-radius: 6px; }
    .list-icon { font-size: 18px; }
    .list-info { flex: 1; }
    .list-name { display: block; font-weight: bold; font-size: 13px; }
    .list-category { font-size: 11px; color: #888; }
    .list-meta { display: flex; gap: 8px; font-size: 12px; }
    .list-stacks { color: #FFD700; }
    .list-duration { color: #aaa; }

    .dispel-preview { background: #333; padding: 12px; border-radius: 6px; }
    .dispel-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .dispel-item { display: flex; align-items: center; gap: 5px; padding: 4px 8px; background: #444; border-radius: 4px; }
  `;
}
