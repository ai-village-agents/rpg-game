/**
 * Loot Table System UI Components
 * Display loot drops, previews, and roll results
 */

import {
  RARITY,
  getRarityColor,
  getRarityName,
  getDropPreview,
  simulateDrops
} from './loot-table-system.js';

// HTML escape helper
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render loot drops (after roll)
export function renderLootDrops(drops, itemData = {}) {
  if (!drops || drops.length === 0) {
    return '<p class="no-loot">No loot dropped</p>';
  }

  const items = drops.map(drop => {
    const data = itemData[drop.itemId] || { name: drop.itemId };
    const color = getRarityColor(drop.rarity);
    const rarityName = getRarityName(drop.rarity);

    return `
      <div class="loot-item" data-rarity="${escapeHtml(drop.rarity)}">
        <div class="loot-icon" style="border-color: ${color}">
          ${data.icon || '📦'}
        </div>
        <div class="loot-info">
          <span class="loot-name" style="color: ${color}">${escapeHtml(data.name)}</span>
          <span class="loot-quantity">x${drop.quantity}</span>
        </div>
        <span class="loot-rarity" style="color: ${color}">${rarityName}</span>
        ${drop.guaranteed ? '<span class="guaranteed-badge">Guaranteed</span>' : ''}
      </div>
    `;
  }).join('');

  return `<div class="loot-drops">${items}</div>`;
}

// Render loot drop notification (animated)
export function renderLootNotification(drop, itemData = {}) {
  const data = itemData[drop.itemId] || { name: drop.itemId };
  const color = getRarityColor(drop.rarity);
  const rarityName = getRarityName(drop.rarity);

  return `
    <div class="loot-notification loot-${drop.rarity.toLowerCase()}">
      <span class="notification-icon">${data.icon || '📦'}</span>
      <div class="notification-content">
        <span class="notification-name" style="color: ${color}">${escapeHtml(data.name)}</span>
        <span class="notification-details">x${drop.quantity} (${rarityName})</span>
      </div>
    </div>
  `;
}

// Render loot preview (before opening)
export function renderLootPreview(table, context = {}, itemData = {}) {
  const preview = getDropPreview(table, context);

  if (preview.length === 0) {
    return '<p class="no-preview">No possible drops</p>';
  }

  const items = preview.map(item => {
    const data = itemData[item.itemId] || { name: item.itemId };
    const color = getRarityColor(item.rarity);

    return `
      <div class="preview-item" data-rarity="${escapeHtml(item.rarity)}">
        <span class="preview-name" style="color: ${color}">${escapeHtml(data.name)}</span>
        <div class="preview-meta">
          <span class="preview-chance">${item.chance}%</span>
          ${item.guaranteed ? '<span class="guaranteed">!</span>' : ''}
          <span class="preview-quantity">${item.minQuantity}-${item.maxQuantity}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="loot-preview">
      <h4>Possible Drops</h4>
      <div class="preview-list">${items}</div>
      <p class="preview-note">Drop rates may vary based on conditions</p>
    </div>
  `;
}

// Render loot table editor (for dev tools)
export function renderLootTableEditor(table, itemData = {}) {
  const entries = table.entries.map((entry, index) => {
    const data = itemData[entry.itemId] || { name: entry.itemId };
    const color = getRarityColor(entry.rarity);

    return `
      <div class="table-entry" data-index="${index}">
        <span class="entry-name" style="color: ${color}">${escapeHtml(data.name)}</span>
        <input type="number" class="entry-weight" value="${entry.weight}" min="1">
        <select class="entry-rarity">
          ${Object.keys(RARITY).map(r =>
            `<option value="${r}" ${r === entry.rarity ? 'selected' : ''}>${getRarityName(r)}</option>`
          ).join('')}
        </select>
        <input type="number" class="entry-min" value="${entry.minQuantity}" min="1">
        <span>-</span>
        <input type="number" class="entry-max" value="${entry.maxQuantity}" min="1">
        <label><input type="checkbox" ${entry.guaranteed ? 'checked' : ''}> Guaranteed</label>
        <button class="btn-remove-entry" data-action="remove">×</button>
      </div>
    `;
  }).join('');

  return `
    <div class="loot-table-editor">
      <div class="editor-header">
        <h3>${escapeHtml(table.name)}</h3>
        <span class="table-id">${escapeHtml(table.id)}</span>
      </div>

      <div class="editor-settings">
        <label>Min Drops: <input type="number" value="${table.minDrops}" min="0"></label>
        <label>Max Drops: <input type="number" value="${table.maxDrops}" min="1"></label>
        <label>Empty Chance: <input type="number" value="${table.emptyChance * 100}" min="0" max="100">%</label>
        <label>Bonus Chance: <input type="number" value="${table.bonusChance * 100}" min="0" max="100">%</label>
      </div>

      <div class="entry-list">
        <div class="entry-header">
          <span>Item</span>
          <span>Weight</span>
          <span>Rarity</span>
          <span>Qty Range</span>
          <span>Guaranteed</span>
          <span></span>
        </div>
        ${entries}
      </div>

      <button class="btn-add-entry" data-action="add-entry">+ Add Entry</button>
    </div>
  `;
}

// Render simulation results
export function renderSimulationResults(results, itemData = {}) {
  const items = results.items.map(item => {
    const data = itemData[item.itemId] || { name: item.itemId };
    const color = getRarityColor(item.rarity);

    return `
      <tr>
        <td style="color: ${color}">${escapeHtml(data.name)}</td>
        <td>${item.dropRate}%</td>
        <td>${item.count}</td>
        <td>${item.avgQuantity}</td>
        <td>${item.totalQuantity}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="simulation-results">
      <h4>Simulation Results (${results.iterations} rolls)</h4>

      <div class="sim-stats">
        <div class="sim-stat">
          <span class="stat-value">${results.emptyRate}%</span>
          <span class="stat-label">Empty Rolls</span>
        </div>
        <div class="sim-stat">
          <span class="stat-value">${results.avgDropsPerRoll}</span>
          <span class="stat-label">Avg Drops/Roll</span>
        </div>
      </div>

      <table class="sim-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Drop Rate</th>
            <th>Drop Count</th>
            <th>Avg Qty</th>
            <th>Total Qty</th>
          </tr>
        </thead>
        <tbody>
          ${items}
        </tbody>
      </table>
    </div>
  `;
}

// Render chest opening animation placeholder
export function renderChestOpening(rarity = 'COMMON') {
  const color = getRarityColor(rarity);

  return `
    <div class="chest-opening">
      <div class="chest-container">
        <div class="chest-icon">📦</div>
        <div class="chest-glow" style="background: ${color}"></div>
      </div>
      <p class="opening-text">Opening...</p>
    </div>
  `;
}

// Render roll button
export function renderRollButton(tableId, label = 'Open') {
  return `
    <button class="btn-roll-loot" data-table-id="${escapeHtml(tableId)}">
      ${label}
    </button>
  `;
}

// Get loot styles
export function getLootStyles() {
  return `
    .loot-drops { display: flex; flex-direction: column; gap: 8px; padding: 15px; background: #2a2a2a; border-radius: 8px; }
    .loot-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #333; border-radius: 6px; }
    .loot-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 2px solid; border-radius: 6px; font-size: 20px; }
    .loot-info { flex: 1; }
    .loot-name { font-weight: bold; display: block; }
    .loot-quantity { font-size: 13px; color: #888; }
    .loot-rarity { font-size: 12px; font-weight: bold; }
    .guaranteed-badge { background: #FFD700; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; }
    .no-loot { color: #888; text-align: center; padding: 20px; }

    .loot-notification { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 8px; background: #333; animation: slideIn 0.3s ease; }
    .loot-legendary { border: 2px solid #FF8000; background: linear-gradient(135deg, #332200, #1a1a1a); }
    .loot-epic { border: 2px solid #A335EE; }
    .loot-rare { border: 2px solid #0070DD; }
    .notification-icon { font-size: 24px; }
    .notification-content { display: flex; flex-direction: column; }
    .notification-name { font-weight: bold; }
    .notification-details { font-size: 12px; color: #888; }

    .loot-preview { background: #2a2a2a; padding: 15px; border-radius: 8px; }
    .preview-list { margin: 10px 0; }
    .preview-item { display: flex; justify-content: space-between; padding: 8px; background: #333; border-radius: 4px; margin-bottom: 6px; }
    .preview-meta { display: flex; gap: 10px; align-items: center; }
    .preview-chance { font-weight: bold; min-width: 40px; }
    .preview-quantity { color: #888; font-size: 12px; }
    .guaranteed { color: #FFD700; font-weight: bold; }
    .preview-note { font-size: 11px; color: #666; margin-top: 10px; }

    .loot-table-editor { background: #2a2a2a; padding: 20px; border-radius: 8px; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .table-id { color: #888; font-size: 12px; }
    .editor-settings { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; padding: 10px; background: #333; border-radius: 6px; }
    .editor-settings label { display: flex; align-items: center; gap: 5px; font-size: 13px; }
    .editor-settings input { width: 60px; padding: 4px; background: #444; border: 1px solid #555; border-radius: 4px; color: white; }
    .entry-list { margin: 15px 0; }
    .entry-header, .table-entry { display: grid; grid-template-columns: 1fr 70px 100px 80px 80px 30px; gap: 10px; padding: 8px; align-items: center; }
    .entry-header { background: #333; border-radius: 4px 4px 0 0; font-weight: bold; font-size: 12px; color: #888; }
    .table-entry { background: #3a3a3a; border-bottom: 1px solid #444; }
    .table-entry input, .table-entry select { padding: 4px; background: #444; border: 1px solid #555; border-radius: 4px; color: white; }
    .btn-remove-entry { background: #f44336; border: none; color: white; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; }
    .btn-add-entry { padding: 8px 16px; background: #4CAF50; border: none; border-radius: 4px; color: white; cursor: pointer; }

    .simulation-results { background: #2a2a2a; padding: 15px; border-radius: 8px; }
    .sim-stats { display: flex; gap: 20px; margin: 15px 0; }
    .sim-stat { text-align: center; padding: 10px 20px; background: #333; border-radius: 6px; }
    .stat-value { display: block; font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #888; }
    .sim-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .sim-table th, .sim-table td { padding: 8px; text-align: left; border-bottom: 1px solid #444; }
    .sim-table th { background: #333; font-size: 12px; color: #888; }

    .chest-opening { text-align: center; padding: 30px; }
    .chest-container { position: relative; display: inline-block; }
    .chest-icon { font-size: 64px; animation: bounce 0.5s infinite; }
    .chest-glow { position: absolute; top: 50%; left: 50%; width: 80px; height: 80px; transform: translate(-50%, -50%); border-radius: 50%; opacity: 0.5; filter: blur(20px); animation: pulse 1s infinite; }
    .opening-text { margin-top: 15px; color: #888; }

    .btn-roll-loot { padding: 12px 24px; background: linear-gradient(135deg, #FFD700, #FFA500); border: none; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer; font-size: 16px; }
    .btn-roll-loot:hover { transform: scale(1.05); }

    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `;
}
