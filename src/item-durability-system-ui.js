/**
 * Item Durability System UI
 * Renders durability bars, repair panels, and warnings
 */

import {
  DURABILITY_STATUS,
  SLOT_DURABILITY_RATES,
  MATERIAL_DURABILITY,
  REPAIR_ITEMS,
  getDurabilityState,
  getItemDurability,
  getDurabilityStatus,
  getDurabilityStatModifier,
  isItemBroken,
  hasTemporaryProtection,
  getItemsNeedingRepair,
  getDurabilityWarnings,
  getDurabilityStats,
  calculateRepairCost
} from './item-durability-system.js';

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

/**
 * Render durability bar for an item
 */
export function renderDurabilityBar(state, itemId, options = {}) {
  const { compact = false, showLabel = true, showNumbers = true } = options;

  const durability = getItemDurability(state, itemId);
  if (!durability) {
    return '<div class="durability-bar no-durability">-</div>';
  }

  const { status, percent } = getDurabilityStatus(state, itemId);
  const isProtected = hasTemporaryProtection(state, itemId);

  return `
    <div class="durability-bar ${compact ? 'compact' : ''} ${status.id} ${isProtected ? 'protected' : ''}">
      ${showLabel ? `<span class="durability-label">${escapeHtml(status.name)}</span>` : ''}
      <div class="bar-container">
        <div class="bar-fill" style="width: ${percent}%; background-color: ${status.color}"></div>
      </div>
      ${showNumbers ? `
        <span class="durability-numbers">${durability.current}/${durability.max}</span>
      ` : ''}
      ${isProtected ? '<span class="protected-icon" title="Protected">\u26e8</span>' : ''}
    </div>
  `;
}

/**
 * Render durability indicator (small icon version)
 */
export function renderDurabilityIndicator(state, itemId) {
  const { status, percent } = getDurabilityStatus(state, itemId);
  if (!status) return '';

  const urgentClass = percent < 20 ? 'urgent' : '';

  return `
    <span class="durability-indicator ${status.id} ${urgentClass}"
          style="color: ${status.color}"
          title="${escapeHtml(status.name)} - ${Math.round(percent)}%">
      ${getStatusIcon(status.id)}
    </span>
  `;
}

/**
 * Get icon for durability status
 */
function getStatusIcon(statusId) {
  const icons = {
    pristine: '\u2728',  // sparkles
    good: '\u2714',      // check
    worn: '\u26a0',      // warning
    damaged: '\u26a0',   // warning
    broken: '\u2718'     // x
  };
  return icons[statusId] || '\u25cf';
}

/**
 * Render equipment durability overview
 */
export function renderEquipmentDurabilityPanel(state, equippedItems, itemsData) {
  const slots = Object.keys(SLOT_DURABILITY_RATES);

  let html = `
    <div class="equipment-durability-panel">
      <div class="panel-header">
        <h3>Equipment Durability</h3>
      </div>
      <div class="equipment-list">
  `;

  for (const slot of slots) {
    const itemId = equippedItems[slot];
    const item = itemId ? itemsData[itemId] : null;

    if (!itemId || !item) {
      html += `
        <div class="equipment-row empty" data-slot="${slot}">
          <span class="slot-name">${escapeHtml(formatSlotName(slot))}</span>
          <span class="empty-label">Empty</span>
        </div>
      `;
      continue;
    }

    const { status, percent } = getDurabilityStatus(state, itemId);
    const durability = getItemDurability(state, itemId);
    const isBroken = isItemBroken(state, itemId);

    html += `
      <div class="equipment-row ${isBroken ? 'broken' : ''}" data-slot="${slot}" data-item-id="${itemId}">
        <span class="slot-name">${escapeHtml(formatSlotName(slot))}</span>
        <span class="item-name ${status?.id || ''}">${escapeHtml(item.name)}</span>
        ${status ? renderDurabilityBar(state, itemId, { compact: true, showLabel: false }) : ''}
        ${isBroken ? '<span class="broken-badge">BROKEN</span>' : ''}
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Format slot name for display
 */
function formatSlotName(slot) {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

/**
 * Render repair panel
 */
export function renderRepairPanel(state, itemId, item, options = {}) {
  const { showRepairItems = true } = options;

  const durability = getItemDurability(state, itemId);
  if (!durability) {
    return '<div class="repair-panel error">No durability data</div>';
  }

  const { status, percent } = getDurabilityStatus(state, itemId);
  const repairAmount = durability.max - durability.current;
  const repairCost = calculateRepairCost(item, repairAmount);
  const playerGold = state.player?.gold || 0;
  const canAfford = playerGold >= repairCost;

  return `
    <div class="repair-panel">
      <div class="panel-header">
        <h3>Repair: ${escapeHtml(item.name)}</h3>
      </div>

      <div class="current-durability">
        ${renderDurabilityBar(state, itemId, { compact: false, showLabel: true, showNumbers: true })}
      </div>

      ${repairAmount > 0 ? `
        <div class="repair-section">
          <div class="repair-info">
            <span class="label">Repair Needed:</span>
            <span class="value">${repairAmount} durability</span>
          </div>
          <div class="repair-cost ${canAfford ? '' : 'insufficient'}">
            <span class="label">Cost:</span>
            <span class="value">${repairCost} gold</span>
          </div>
          <button class="repair-btn ${canAfford ? '' : 'disabled'}"
                  data-item-id="${itemId}"
                  ${canAfford ? '' : 'disabled'}>
            Full Repair
          </button>
        </div>
      ` : `
        <div class="repair-section">
          <span class="fully-repaired">Item is at full durability</span>
        </div>
      `}

      ${showRepairItems && repairAmount > 0 ? renderRepairItemsSection(state, itemId, item) : ''}
    </div>
  `;
}

/**
 * Render repair items section
 */
function renderRepairItemsSection(state, itemId, item) {
  const itemQuality = item.quality || 'common';
  const qualityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const itemQualityIndex = qualityOrder.indexOf(itemQuality);

  const availableRepairItems = Object.values(REPAIR_ITEMS).filter(ri => {
    const maxQualityIndex = qualityOrder.indexOf(ri.maxQuality);
    return itemQualityIndex <= maxQualityIndex;
  });

  return `
    <div class="repair-items-section">
      <h4>Use Repair Item</h4>
      <div class="repair-items-list">
        ${availableRepairItems.map(ri => `
          <div class="repair-item" data-repair-item="${ri.id}" data-target-item="${itemId}">
            <span class="item-name">${escapeHtml(ri.name)}</span>
            ${ri.temporaryInvulnerable ? `
              <span class="effect">Protects for ${ri.duration / 1000}s</span>
            ` : `
              <span class="effect">+${ri.repairAmount} durability</span>
            `}
            <button class="use-btn">Use</button>
          </div>
        `).join('')}
        ${availableRepairItems.length === 0 ? '<div class="no-items">No repair items available</div>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render durability warnings
 */
export function renderDurabilityWarnings(state, equippedItems) {
  const warnings = getDurabilityWarnings(state, equippedItems);

  if (warnings.length === 0) {
    return '';
  }

  return `
    <div class="durability-warnings">
      <div class="warning-header">
        <span class="warning-icon">\u26a0</span>
        <span class="warning-title">Equipment Durability Warning</span>
      </div>
      <div class="warning-list">
        ${warnings.map(w => `
          <div class="warning-item ${w.urgent ? 'urgent' : ''}" style="border-color: ${w.status.color}">
            <span class="slot">${escapeHtml(formatSlotName(w.slot))}</span>
            <span class="status" style="color: ${w.status.color}">${escapeHtml(w.status.name)}</span>
            <span class="percent">${Math.round(w.percent)}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render broken equipment notification
 */
export function renderBrokenEquipmentNotification(brokenItems, itemsData) {
  if (brokenItems.length === 0) {
    return '';
  }

  return `
    <div class="broken-equipment-notification">
      <div class="notification-header">
        <span class="broken-icon">\u2718</span>
        <span class="title">Equipment Broken!</span>
      </div>
      <div class="broken-list">
        ${brokenItems.map(bi => {
          const item = itemsData[bi.itemId];
          return `
            <div class="broken-item">
              <span class="slot">${escapeHtml(formatSlotName(bi.slot))}</span>
              <span class="item-name">${escapeHtml(item?.name || 'Unknown')}</span>
              <span class="effect">Stats reduced to 0%</span>
            </div>
          `;
        }).join('')}
      </div>
      <button class="go-to-repair-btn">Repair Equipment</button>
    </div>
  `;
}

/**
 * Render durability settings panel
 */
export function renderDurabilitySettingsPanel(state) {
  const durabilityState = getDurabilityState(state);
  const settings = durabilityState.durabilitySettings;

  return `
    <div class="durability-settings-panel">
      <h3>Durability Settings</h3>
      <div class="settings-list">
        <div class="setting-row">
          <label>
            <input type="checkbox" name="enabled" ${settings.enabled ? 'checked' : ''}>
            Enable Durability System
          </label>
        </div>
        <div class="setting-row">
          <label>
            <input type="checkbox" name="showWarnings" ${settings.showWarnings ? 'checked' : ''}>
            Show Durability Warnings
          </label>
        </div>
        <div class="setting-row">
          <label>Warning Threshold:</label>
          <input type="number" name="warningThreshold" value="${settings.warningThreshold}" min="0" max="100">
          <span class="unit">%</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render durability statistics panel
 */
export function renderDurabilityStatsPanel(state) {
  const stats = getDurabilityStats(state);

  return `
    <div class="durability-stats-panel">
      <h3>Durability Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Tracked Items</span>
          <span class="stat-value">${stats.itemCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Broken Items</span>
          <span class="stat-value ${stats.brokenCount > 0 ? 'warning' : ''}">${stats.brokenCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average Durability</span>
          <span class="stat-value">${Math.round(stats.averagePercent)}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Repair Cost</span>
          <span class="stat-value">${stats.totalRepairCost} gold</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Items Destroyed</span>
          <span class="stat-value">${stats.itemsDestroyed}</span>
        </div>
      </div>

      ${stats.recentRepairs.length > 0 ? `
        <div class="recent-repairs">
          <h4>Recent Repairs</h4>
          <div class="repairs-list">
            ${stats.recentRepairs.slice(-5).reverse().map(r => `
              <div class="repair-entry">
                <span class="amount">+${r.amount}</span>
                <span class="cost">${r.cost > 0 ? `-${r.cost}g` : 'free'}</span>
                <span class="source">${escapeHtml(r.source)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render repair all button
 */
export function renderRepairAllButton(state, equippedItems, itemsData) {
  const needsRepair = getItemsNeedingRepair(state, equippedItems, 100);

  if (needsRepair.length === 0) {
    return '<div class="repair-all-section">All equipment at full durability</div>';
  }

  let totalCost = 0;
  for (const item of needsRepair) {
    const itemData = itemsData[item.itemId];
    if (itemData) {
      const durability = getItemDurability(state, item.itemId);
      if (durability) {
        const repairAmount = durability.max - durability.current;
        totalCost += calculateRepairCost(itemData, repairAmount);
      }
    }
  }

  const playerGold = state.player?.gold || 0;
  const canAfford = playerGold >= totalCost;

  return `
    <div class="repair-all-section">
      <div class="repair-all-info">
        <span class="items-count">${needsRepair.length} items need repair</span>
        <span class="total-cost ${canAfford ? '' : 'insufficient'}">Total: ${totalCost} gold</span>
      </div>
      <button class="repair-all-btn ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'}>
        Repair All
      </button>
    </div>
  `;
}

/**
 * Render item durability tooltip
 */
export function renderDurabilityTooltip(state, itemId, item) {
  const durability = getItemDurability(state, itemId);
  if (!durability) return '';

  const { status, percent } = getDurabilityStatus(state, itemId);
  const statMod = getDurabilityStatModifier(state, itemId);
  const isProtected = hasTemporaryProtection(state, itemId);
  const isBroken = isItemBroken(state, itemId);

  const material = item.material || 'iron';
  const materialData = MATERIAL_DURABILITY[material];

  return `
    <div class="durability-tooltip">
      <div class="tooltip-header">Durability</div>
      <div class="tooltip-bar">${renderDurabilityBar(state, itemId, { compact: true })}</div>
      <div class="tooltip-details">
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" style="color: ${status.color}">${escapeHtml(status.name)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Stat Modifier:</span>
          <span class="value ${statMod < 1 ? 'reduced' : ''}">${Math.round(statMod * 100)}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Material:</span>
          <span class="value">${escapeHtml(material)}</span>
        </div>
        ${isProtected ? `
          <div class="detail-row protected">
            <span class="label">\u26e8 Protected</span>
          </div>
        ` : ''}
        ${isBroken ? `
          <div class="detail-row broken">
            <span class="label">\u2718 Item is broken!</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render combat durability damage log
 */
export function renderCombatDurabilityLog(damages, itemsData) {
  if (!damages || damages.length === 0) {
    return '';
  }

  return `
    <div class="combat-durability-log">
      ${damages.map(d => {
        const item = itemsData[d.itemId];
        return `
          <div class="damage-entry ${d.justBroke ? 'broke' : ''}">
            <span class="slot">${escapeHtml(formatSlotName(d.slot))}</span>
            <span class="item">${escapeHtml(item?.name || 'Unknown')}</span>
            <span class="loss">-${d.loss.toFixed(1)}</span>
            ${d.justBroke ? '<span class="broke-notice">BROKE!</span>' : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Get CSS styles for durability system
 */
export function getDurabilityStyles() {
  return `
    .durability-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .durability-bar.compact {
      gap: 4px;
    }

    .durability-bar .bar-container {
      flex: 1;
      height: 8px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
    }

    .durability-bar .bar-fill {
      height: 100%;
      transition: width 0.3s, background-color 0.3s;
    }

    .durability-bar.broken .bar-fill {
      background: repeating-linear-gradient(
        45deg,
        #F44336,
        #F44336 10px,
        #B71C1C 10px,
        #B71C1C 20px
      ) !important;
    }

    .durability-bar.protected .bar-container {
      box-shadow: 0 0 5px #4CAF50;
    }

    .protected-icon {
      color: #4CAF50;
      font-size: 14px;
    }

    .equipment-durability-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #fff;
    }

    .equipment-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .equipment-row.empty {
      opacity: 0.5;
    }

    .equipment-row.broken {
      background: rgba(244, 67, 54, 0.2);
    }

    .equipment-row .slot-name {
      width: 80px;
      font-size: 12px;
      color: #888;
    }

    .equipment-row .item-name {
      flex: 1;
    }

    .broken-badge {
      background: #F44336;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }

    .repair-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #fff;
    }

    .repair-section {
      margin-top: 16px;
      padding: 12px;
      background: #2a2a4e;
      border-radius: 4px;
    }

    .repair-cost.insufficient {
      color: #F44336;
    }

    .repair-btn, .repair-all-btn {
      margin-top: 12px;
      padding: 10px 20px;
      background: #4CAF50;
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      width: 100%;
    }

    .repair-btn.disabled, .repair-all-btn.disabled {
      background: #666;
      cursor: not-allowed;
    }

    .durability-warnings {
      background: linear-gradient(135deg, #3a3a1e, #4a4a2e);
      border: 2px solid #FFC107;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    }

    .warning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #FFC107;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .warning-icon {
      font-size: 20px;
    }

    .warning-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px;
      border-left: 3px solid;
      margin-bottom: 4px;
      background: rgba(0, 0, 0, 0.2);
    }

    .warning-item.urgent {
      background: rgba(244, 67, 54, 0.3);
    }

    .broken-equipment-notification {
      background: linear-gradient(135deg, #3a1a1a, #4a2a2a);
      border: 2px solid #F44336;
      border-radius: 8px;
      padding: 16px;
      animation: shake 0.5s;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .durability-stats-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #fff;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-item {
      background: #2a2a4e;
      padding: 12px;
      border-radius: 4px;
    }

    .stat-item .stat-label {
      display: block;
      font-size: 12px;
      color: #888;
    }

    .stat-item .stat-value {
      font-size: 20px;
      font-weight: bold;
    }

    .stat-item .stat-value.warning {
      color: #F44336;
    }

    .durability-tooltip {
      background: #1a1a2e;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 12px;
      max-width: 250px;
    }

    .detail-row .value.reduced {
      color: #FF9800;
    }

    .detail-row.broken {
      color: #F44336;
    }

    .detail-row.protected {
      color: #4CAF50;
    }

    .combat-durability-log {
      font-size: 12px;
      color: #888;
    }

    .damage-entry {
      display: flex;
      gap: 8px;
      padding: 2px 0;
    }

    .damage-entry.broke {
      color: #F44336;
      font-weight: bold;
    }

    .damage-entry .loss {
      color: #FF9800;
    }

    .broke-notice {
      color: #F44336;
      animation: pulse 0.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
}
