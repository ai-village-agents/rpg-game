/**
 * Enchanting System UI
 * Renders enchantment interfaces, rune selection, and progress displays
 */

import {
  ENCHANTMENT_TYPES,
  ENCHANTMENT_TIERS,
  RUNES,
  SLOT_ENCHANTMENTS,
  getEnchantingStats,
  getEnchantmentHistory,
  getValidEnchantments,
  getRunesForEnchantment,
  calculateEnchantmentValue,
  calculateSuccessRate,
  getDiscoveredEnchantments,
  estimateEnchantmentCost,
  getTierProgression,
  getAllRunes
} from './enchanting-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render the main enchanting panel
 */
export function renderEnchantingPanel(state) {
  const stats = getEnchantingStats(state);
  const discovered = getDiscoveredEnchantments(state);

  return `
    <div class="enchanting-panel">
      <div class="enchanting-header">
        <h2>Enchanting</h2>
        <div class="enchanting-level">
          <span class="level-badge">Level ${stats.level}</span>
          <span class="exp-text">${stats.experience.toLocaleString()} XP</span>
        </div>
      </div>

      <div class="enchanting-stats">
        <div class="stat">
          <span class="stat-value">${stats.totalEnchantments}</span>
          <span class="stat-label">Total Enchantments</span>
        </div>
        <div class="stat">
          <span class="stat-value success">${stats.successful}</span>
          <span class="stat-label">Successful</span>
        </div>
        <div class="stat">
          <span class="stat-value fail">${stats.failed}</span>
          <span class="stat-label">Failed</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.successRate}%</span>
          <span class="stat-label">Success Rate</span>
        </div>
      </div>

      <div class="discovery-progress">
        <h3>Enchantments Discovered</h3>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(stats.discoveredCount / stats.totalEnchantmentTypes * 100).toFixed(0)}%"></div>
          <span class="progress-text">${stats.discoveredCount} / ${stats.totalEnchantmentTypes}</span>
        </div>
      </div>

      <div class="discovered-enchantments">
        ${discovered.length > 0 ? `
          <div class="enchantment-grid">
            ${discovered.map(ench => `
              <div class="enchantment-badge" style="background-color: ${ench.color}">
                ${escapeHtml(ench.name)}
              </div>
            `).join('')}
          </div>
        ` : '<p class="no-discovered">No enchantments discovered yet</p>'}
      </div>

      <div class="enchanting-actions">
        <button class="btn-primary" data-action="open-enchant">Enchant Item</button>
        <button class="btn-secondary" data-action="view-runes">View Runes</button>
        <button class="btn-secondary" data-action="view-history">View History</button>
      </div>
    </div>
  `;
}

/**
 * Render enchantment interface for an item
 */
export function renderEnchantmentInterface(state, item, slotType) {
  const stats = getEnchantingStats(state);
  const validEnchantments = getValidEnchantments(slotType);

  return `
    <div class="enchantment-interface" data-item-id="${escapeHtml(item.id)}">
      <div class="interface-header">
        <h3>Enchant: ${escapeHtml(item.name)}</h3>
        <span class="slot-type">${escapeHtml(slotType)}</span>
      </div>

      <div class="enchantment-selection">
        <h4>Select Enchantment</h4>
        <div class="enchantment-list">
          ${validEnchantments.map(ench => `
            <div class="enchantment-option" data-enchantment="${escapeHtml(ench.id)}">
              <span class="enchantment-color" style="background-color: ${ench.color}"></span>
              <span class="enchantment-name">${escapeHtml(ench.name)}</span>
              <span class="enchantment-category">${escapeHtml(ench.category)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="tier-selection">
        <h4>Select Tier</h4>
        <div class="tier-options">
          ${Object.values(ENCHANTMENT_TIERS).map(tier => `
            <div class="tier-option" data-tier="${escapeHtml(tier.id)}">
              <span class="tier-badge" style="background-color: ${tier.color}">${escapeHtml(tier.name)}</span>
              <span class="tier-info">Max Level: ${tier.maxLevel}, Power: x${tier.multiplier}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="rune-selection">
        <h4>Select Rune (Optional)</h4>
        <p class="rune-info">Using a rune can improve success rate</p>
        <select class="rune-select" name="runeId">
          <option value="">No rune</option>
          ${getAllRunes().map(rune => `
            <option value="${escapeHtml(rune.id)}">${escapeHtml(rune.name)} (${escapeHtml(rune.rarity)})</option>
          `).join('')}
        </select>
      </div>

      <div class="enchant-preview">
        <div class="preview-stat">
          <span class="label">Your Level:</span>
          <span class="value">${stats.level}</span>
        </div>
        <div class="preview-stat">
          <span class="label">Success Rate:</span>
          <span class="value" id="success-rate">--%</span>
        </div>
        <div class="preview-stat">
          <span class="label">Estimated Cost:</span>
          <span class="value" id="estimated-cost">-- gold</span>
        </div>
      </div>

      <div class="interface-actions">
        <button class="btn-primary" data-action="apply-enchantment">Apply Enchantment</button>
        <button class="btn-secondary" data-action="cancel-enchant">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render enchantment result notification
 */
export function renderEnchantmentResult(result) {
  const { success, enchantment, successRate, expGained, leveledUp } = result;

  const enchType = enchantment ? ENCHANTMENT_TYPES[enchantment.type.toUpperCase()] : null;

  return `
    <div class="enchantment-result ${success ? 'success' : 'failure'}">
      <div class="result-header">
        <span class="result-icon">${success ? '&#10003;' : '&#10007;'}</span>
        <span class="result-title">${success ? 'Enchantment Successful!' : 'Enchantment Failed'}</span>
      </div>

      ${enchantment && enchType ? `
        <div class="result-details">
          <div class="enchantment-info">
            <span class="ench-name" style="color: ${enchType.color}">${escapeHtml(enchType.name)}</span>
            <span class="ench-level">Level ${enchantment.level}</span>
            ${success ? `<span class="ench-value">+${enchantment.value}</span>` : ''}
          </div>
        </div>
      ` : ''}

      <div class="result-stats">
        <span class="success-rate">Success rate was: ${(successRate * 100).toFixed(1)}%</span>
        <span class="exp-gained">+${expGained} XP</span>
      </div>

      ${leveledUp ? `
        <div class="level-up-notice">
          <span>&#11088; Enchanting Level Up!</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render rune inventory
 */
export function renderRuneInventory(runes = []) {
  const allRunes = getAllRunes();

  return `
    <div class="rune-inventory">
      <h3>Rune Collection</h3>

      <div class="rune-grid">
        ${allRunes.map(runeType => {
          const owned = runes.filter(r => r.id === runeType.id).length;
          const rarityColors = {
            common: '#AAAAAA',
            uncommon: '#55FF55',
            rare: '#5555FF',
            legendary: '#FFAA00'
          };

          return `
            <div class="rune-card ${owned > 0 ? 'owned' : 'not-owned'}">
              <div class="rune-header" style="border-color: ${rarityColors[runeType.rarity] || '#888'}">
                <span class="rune-name">${escapeHtml(runeType.name)}</span>
                <span class="rune-rarity" style="color: ${rarityColors[runeType.rarity]}">${escapeHtml(runeType.rarity)}</span>
              </div>
              <div class="rune-types">
                ${runeType.types.map(t => {
                  const enchType = ENCHANTMENT_TYPES[t.toUpperCase()];
                  return enchType ? `
                    <span class="type-badge" style="background-color: ${enchType.color}">${escapeHtml(enchType.name)}</span>
                  ` : '';
                }).join('')}
              </div>
              <div class="rune-count">
                Owned: ${owned}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render enchantment history
 */
export function renderEnchantmentHistory(state, limit = 10) {
  const history = getEnchantmentHistory(state, limit);

  return `
    <div class="enchantment-history">
      <h3>Recent Enchantments</h3>

      ${history.length > 0 ? `
        <div class="history-list">
          ${history.map(entry => {
            const enchType = entry.type ? ENCHANTMENT_TYPES[entry.type.toUpperCase()] : null;
            const isSuccess = entry.succeeded !== false;

            return `
              <div class="history-entry ${isSuccess ? 'success' : 'failure'}">
                <span class="entry-icon">${isSuccess ? '&#10003;' : '&#10007;'}</span>
                <span class="entry-action">${escapeHtml(entry.action || 'enchant')}</span>
                ${enchType ? `
                  <span class="entry-type" style="color: ${enchType.color}">${escapeHtml(enchType.name)}</span>
                ` : ''}
                ${entry.level ? `<span class="entry-level">Lv.${entry.level}</span>` : ''}
                <span class="entry-time">${new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<p class="no-history">No enchantment history</p>'}
    </div>
  `;
}

/**
 * Render tier comparison
 */
export function renderTierComparison(enchantmentType, level = 1) {
  const enchType = ENCHANTMENT_TYPES[enchantmentType.toUpperCase()];
  if (!enchType) return '';

  return `
    <div class="tier-comparison">
      <h3>Tier Comparison: ${escapeHtml(enchType.name)}</h3>

      <table class="comparison-table">
        <thead>
          <tr>
            <th>Tier</th>
            <th>Value at Lv.${level}</th>
            <th>Max Level</th>
            <th>Max Value</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(ENCHANTMENT_TIERS).map(tier => {
            const valueAtLevel = calculateEnchantmentValue(enchantmentType, level, tier.id);
            const maxValue = calculateEnchantmentValue(enchantmentType, tier.maxLevel, tier.id);

            return `
              <tr>
                <td><span class="tier-badge" style="background-color: ${tier.color}">${escapeHtml(tier.name)}</span></td>
                <td>+${valueAtLevel}</td>
                <td>${tier.maxLevel}</td>
                <td>+${maxValue}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render success rate preview
 */
export function renderSuccessRatePreview(currentLevel, tier, enchantingLevel) {
  const rate = calculateSuccessRate(currentLevel, tier, enchantingLevel);
  const percentage = (rate * 100).toFixed(1);

  let rateClass = 'medium';
  if (rate >= 0.8) rateClass = 'high';
  else if (rate < 0.5) rateClass = 'low';

  return `
    <div class="success-rate-preview ${rateClass}">
      <div class="rate-bar">
        <div class="rate-fill" style="width: ${percentage}%"></div>
      </div>
      <span class="rate-text">${percentage}% Success Rate</span>
    </div>
  `;
}

/**
 * Render enchantment type selector
 */
export function renderEnchantmentSelector(slotType, selectedType = null) {
  const validEnchantments = getValidEnchantments(slotType);

  return `
    <div class="enchantment-selector">
      <select class="enchantment-select" name="enchantmentType">
        <option value="">Select enchantment...</option>
        ${validEnchantments.map(ench => `
          <option value="${escapeHtml(ench.id)}" ${selectedType === ench.id ? 'selected' : ''}>
            ${escapeHtml(ench.name)} (${escapeHtml(ench.category)})
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render tier selector
 */
export function renderTierSelector(selectedTier = 'standard') {
  return `
    <div class="tier-selector">
      <select class="tier-select" name="tier">
        ${Object.values(ENCHANTMENT_TIERS).map(tier => `
          <option value="${escapeHtml(tier.id)}" ${selectedTier === tier.id ? 'selected' : ''}>
            ${escapeHtml(tier.name)} (x${tier.multiplier}, max Lv.${tier.maxLevel})
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render runes for specific enchantment
 */
export function renderRunesForEnchantment(enchantmentType) {
  const runes = getRunesForEnchantment(enchantmentType);

  if (runes.length === 0) {
    return '<p class="no-runes">No runes available for this enchantment</p>';
  }

  return `
    <div class="runes-for-enchantment">
      <h4>Compatible Runes</h4>
      <div class="rune-list">
        ${runes.map(rune => `
          <div class="rune-item">
            <span class="rune-name">${escapeHtml(rune.name)}</span>
            <span class="rune-rarity">${escapeHtml(rune.rarity)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render item enchantment summary
 */
export function renderItemEnchantmentSummary(enchantments = []) {
  if (enchantments.length === 0) {
    return '<p class="no-enchantments">No enchantments on this item</p>';
  }

  return `
    <div class="item-enchantments">
      <h4>Current Enchantments</h4>
      <ul class="enchantment-list">
        ${enchantments.map(ench => {
          const enchType = ENCHANTMENT_TYPES[ench.type.toUpperCase()];
          const tierData = ENCHANTMENT_TIERS[ench.tier.toUpperCase()];

          return `
            <li class="enchantment-item">
              <span class="ench-color" style="background-color: ${enchType?.color || '#888'}"></span>
              <span class="ench-name">${escapeHtml(enchType?.name || ench.type)}</span>
              <span class="ench-tier" style="color: ${tierData?.color || '#888'}">${escapeHtml(tierData?.name || ench.tier)}</span>
              <span class="ench-level">Lv.${ench.level}</span>
              <span class="ench-value">+${ench.value}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render cost breakdown
 */
export function renderCostBreakdown(enchantmentType, tier, level) {
  const baseCost = estimateEnchantmentCost(enchantmentType, tier, level);
  const runeCost = 0; // Would be calculated based on rune

  return `
    <div class="cost-breakdown">
      <h4>Cost Breakdown</h4>
      <div class="cost-line">
        <span>Base Cost:</span>
        <span>${baseCost.toLocaleString()} gold</span>
      </div>
      ${runeCost > 0 ? `
        <div class="cost-line">
          <span>Rune Value:</span>
          <span>${runeCost.toLocaleString()} gold</span>
        </div>
      ` : ''}
      <div class="cost-line total">
        <span>Total:</span>
        <span>${(baseCost + runeCost).toLocaleString()} gold</span>
      </div>
    </div>
  `;
}

/**
 * Render enchanting level progress
 */
export function renderLevelProgress(state) {
  const stats = getEnchantingStats(state);
  const currentLevelExp = (stats.level - 1) * 100 * stats.level / 2; // Simplified
  const nextLevelExp = stats.level * 100;
  const progress = Math.min(100, ((stats.experience - currentLevelExp) / nextLevelExp * 100));

  return `
    <div class="level-progress">
      <div class="level-info">
        <span class="current-level">Level ${stats.level}</span>
        <span class="next-level">Level ${stats.level + 1}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress.toFixed(0)}%"></div>
      </div>
      <span class="exp-info">${stats.experience.toLocaleString()} XP</span>
    </div>
  `;
}
