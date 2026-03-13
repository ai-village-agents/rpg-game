/**
 * Gem Socket System UI
 * Rendering functions for gem socketing interface
 */

import {
  GEM_TYPES,
  GEM_QUALITY,
  SOCKET_TYPES,
  SOCKET_BONUS,
  getItemSockets,
  getGemInventory,
  getGemsByType,
  getSocketStats,
  getSocketHistory,
  canSocketGem
} from './gem-socket-system.js';

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
 * Render gem socketing panel
 */
export function renderSocketPanel(state, itemId) {
  const itemInfo = getItemSockets(state, itemId);
  const gems = getGemInventory(state);

  if (!itemInfo.found) {
    return '<div class="socket-panel"><p>Item has no sockets</p></div>';
  }

  const item = itemInfo.item;
  const bonus = SOCKET_BONUS[item.bonusLevel.toUpperCase()] || SOCKET_BONUS.NONE;

  return `
    <div class="socket-panel">
      <div class="socket-header">
        <h3>Gem Sockets</h3>
        <span class="socket-count">${itemInfo.filledSlots}/${item.sockets.length}</span>
      </div>
      <div class="socket-grid">
        ${item.sockets.map((socket, i) => renderSocket(state, itemId, socket, i)).join('')}
      </div>
      <div class="socket-bonus ${bonus.id}">
        <span>${escapeHtml(bonus.name)}</span>
        <span>x${bonus.multiplier}</span>
      </div>
      <div class="socket-stats">
        <h4>Total Bonuses</h4>
        ${Object.entries(item.totalStats).map(([stat, value]) => `
          <div class="stat-row">
            <span class="stat-name">${escapeHtml(stat)}</span>
            <span class="stat-value">+${value}</span>
          </div>
        `).join('') || '<p>No bonuses</p>'}
      </div>
      <div class="gem-inventory">
        <h4>Available Gems (${gems.length})</h4>
        ${renderGemList(gems)}
      </div>
    </div>
  `;
}

/**
 * Render a single socket
 */
export function renderSocket(state, itemId, socket, index) {
  const socketType = SOCKET_TYPES[socket.type.toUpperCase()] || SOCKET_TYPES.PRISMATIC;
  const isEmpty = !socket.gemId;

  let gemHtml = '';
  if (!isEmpty) {
    // Socket has a gem - we can't easily get it since it's no longer in inventory
    // We'll show a placeholder or the gemId
    gemHtml = `<div class="socketed-gem">&#128142;</div>`;
  }

  return `
    <div class="socket ${socketType.id} ${isEmpty ? 'empty' : 'filled'}" 
         data-socket-index="${index}" data-item-id="${escapeHtml(itemId)}">
      <div class="socket-frame">
        ${isEmpty 
          ? `<span class="socket-label">${escapeHtml(socketType.name)}</span>`
          : gemHtml
        }
      </div>
      ${isEmpty 
        ? '<button class="socket-btn">Insert Gem</button>'
        : '<button class="unsocket-btn">Remove</button>'
      }
    </div>
  `;
}

/**
 * Render gem list
 */
export function renderGemList(gems) {
  if (gems.length === 0) {
    return '<div class="no-gems">No gems available</div>';
  }

  return `
    <div class="gem-list">
      ${gems.map(gem => renderGemItem(gem)).join('')}
    </div>
  `;
}

/**
 * Render a single gem item
 */
export function renderGemItem(gem) {
  const quality = GEM_QUALITY[gem.quality.toUpperCase()] || GEM_QUALITY.REGULAR;

  return `
    <div class="gem-item" data-gem-id="${escapeHtml(gem.id)}" style="border-color: ${gem.color}">
      <div class="gem-icon" style="background-color: ${gem.color}">&#128142;</div>
      <div class="gem-info">
        <span class="gem-name">${escapeHtml(gem.name)}</span>
        <span class="gem-stat">+${gem.value} ${escapeHtml(gem.stat)}</span>
      </div>
      <span class="gem-quality ${quality.id}">${escapeHtml(quality.name)}</span>
    </div>
  `;
}

/**
 * Render gem inventory grouped by type
 */
export function renderGemInventoryGrouped(state) {
  const grouped = getGemsByType(state);
  const types = Object.keys(grouped);

  if (types.length === 0) {
    return '<div class="gem-inventory-empty">No gems in inventory</div>';
  }

  return `
    <div class="gem-inventory-grouped">
      ${types.map(type => {
        const typeInfo = GEM_TYPES[type.toUpperCase()];
        const gems = grouped[type];
        return `
          <div class="gem-group">
            <h4 style="color: ${typeInfo.color}">${escapeHtml(typeInfo.name)} (${gems.length})</h4>
            <div class="gem-group-items">
              ${gems.map(gem => renderGemItem(gem)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render gem combine panel
 */
export function renderCombinePanel(state) {
  const grouped = getGemsByType(state);

  return `
    <div class="combine-panel">
      <h3>Combine Gems</h3>
      <p class="combine-info">Select 3 gems of the same type and quality to upgrade</p>
      <div class="combine-slots">
        <div class="combine-slot empty">+</div>
        <div class="combine-slot empty">+</div>
        <div class="combine-slot empty">+</div>
        <span class="combine-arrow">=</span>
        <div class="combine-result empty">?</div>
      </div>
      <button class="combine-btn" disabled>Combine</button>
    </div>
  `;
}

/**
 * Render gem types reference
 */
export function renderGemTypesReference() {
  return `
    <div class="gem-types-reference">
      <h3>Gem Types</h3>
      <div class="type-grid">
        ${Object.values(GEM_TYPES).map(type => `
          <div class="type-entry" style="border-color: ${type.color}">
            <span class="type-color" style="background-color: ${type.color}"></span>
            <span class="type-name">${escapeHtml(type.name)}</span>
            <span class="type-stat">+${escapeHtml(type.stat)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render gem quality tiers
 */
export function renderQualityTiers() {
  return `
    <div class="quality-tiers">
      <h3>Gem Quality</h3>
      <table>
        <thead>
          <tr>
            <th>Quality</th>
            <th>Multiplier</th>
            <th>Level Req</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(GEM_QUALITY).map(q => `
            <tr class="${q.id}">
              <td>${escapeHtml(q.name)}</td>
              <td>x${q.multiplier}</td>
              <td>${q.level}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render socket types reference
 */
export function renderSocketTypes() {
  return `
    <div class="socket-types">
      <h3>Socket Types</h3>
      <ul>
        ${Object.values(SOCKET_TYPES).map(s => `
          <li>
            <span class="socket-type ${s.id}">${escapeHtml(s.name)}</span>
            <span class="accepts">Accepts: ${s.accepts.join(', ')}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render socket stats
 */
export function renderSocketStats(state) {
  const stats = getSocketStats(state);

  return `
    <div class="socket-stats-panel">
      <h3>Socket Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.totalGems}</span>
          <span class="stat-label">Gems Owned</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.gemsSocketed}</span>
          <span class="stat-label">Gems Socketed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.gemsRemoved}</span>
          <span class="stat-label">Gems Removed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.gemsCombined}</span>
          <span class="stat-label">Gems Combined</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render socket history
 */
export function renderSocketHistory(state) {
  const history = getSocketHistory(state);

  if (history.length === 0) {
    return '<div class="no-history">No socket history</div>';
  }

  return `
    <div class="socket-history">
      <h3>Recent Activity</h3>
      <ul>
        ${history.map(entry => {
          let text = '';
          switch (entry.action) {
            case 'socket':
              text = `Socketed ${escapeHtml(entry.gemName || 'gem')}`;
              break;
            case 'unsocket':
              text = `Removed gem${entry.destroyed ? ' (destroyed)' : ''}`;
              break;
            case 'combine':
              text = `Combined ${entry.sourceGems.length} gems into ${escapeHtml(entry.resultName)}`;
              break;
            default:
              text = entry.action;
          }
          return `<li>${text}</li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render gem tooltip
 */
export function renderGemTooltip(gem) {
  const quality = GEM_QUALITY[gem.quality.toUpperCase()] || GEM_QUALITY.REGULAR;

  return `
    <div class="gem-tooltip">
      <h4 style="color: ${gem.color}">${escapeHtml(gem.name)}</h4>
      <p class="gem-quality">${escapeHtml(quality.name)} Quality</p>
      <p class="gem-stat">+${gem.value} ${escapeHtml(gem.stat)}</p>
      <p class="gem-level">Requires Level ${gem.levelReq}</p>
    </div>
  `;
}

/**
 * Render compact gem display
 */
export function renderCompactGemDisplay(gem) {
  return `
    <span class="gem-compact" style="color: ${gem.color}" title="${escapeHtml(gem.name)}">
      &#128142;
    </span>
  `;
}

/**
 * Render socket preview
 */
export function renderSocketPreview(state, itemId, socketIndex, gemId) {
  const check = canSocketGem(state, itemId, socketIndex, gemId);

  return `
    <div class="socket-preview ${check.canSocket ? 'valid' : 'invalid'}">
      ${check.canSocket 
        ? '<span class="check">&#10003; Can socket this gem</span>'
        : `<span class="error">${escapeHtml(check.error)}</span>`
      }
    </div>
  `;
}
