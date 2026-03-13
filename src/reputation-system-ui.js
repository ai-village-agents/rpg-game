/**
 * Reputation System UI
 * Renders faction standings, NPC relations, and reputation interfaces
 */

import {
  REPUTATION_TIERS,
  FACTIONS,
  getFactionReputation,
  getAllFactionReputations,
  getNpcRelation,
  getRegionStanding,
  getReputationSummary,
  getFactionHistory,
  canAccessFactionServices,
  getFactionDiscount
} from './reputation-system.js';

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
 * Render the main reputation panel
 */
export function renderReputationPanel(state) {
  const summary = getReputationSummary(state);
  const factions = getAllFactionReputations(state);

  return `
    <div class="reputation-panel">
      <div class="reputation-header">
        <h2>Reputation</h2>
        <div class="reputation-level">
          <span class="level-badge">Reputation Level ${summary.level}</span>
          <span class="exp-text">${summary.experience.toLocaleString()} XP</span>
        </div>
      </div>

      <div class="reputation-stats">
        <div class="stat">
          <span class="stat-value positive">+${summary.totalGained.toLocaleString()}</span>
          <span class="stat-label">Total Gained</span>
        </div>
        <div class="stat">
          <span class="stat-value negative">-${summary.totalLost.toLocaleString()}</span>
          <span class="stat-label">Total Lost</span>
        </div>
        <div class="stat">
          <span class="stat-value">${summary.npcRelationsCount}</span>
          <span class="stat-label">NPC Relations</span>
        </div>
      </div>

      <div class="tier-breakdown">
        <h3>Faction Overview</h3>
        <div class="tier-grid">
          ${Object.entries(summary.factionBreakdown).map(([tier, count]) => {
            const tierData = REPUTATION_TIERS[tier.toUpperCase()];
            return `
              <div class="tier-count" style="border-color: ${tierData?.color || '#888'}">
                <span class="count">${count}</span>
                <span class="tier-name">${escapeHtml(tierData?.name || tier)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="factions-list">
        <h3>Factions</h3>
        ${factions.map(f => renderFactionRow(f)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single faction row
 */
function renderFactionRow(factionData) {
  const { faction, value, tier, progressToNext } = factionData;

  return `
    <div class="faction-row" data-faction-id="${escapeHtml(faction.id)}">
      <div class="faction-info">
        <span class="faction-name">${escapeHtml(faction.name)}</span>
        <span class="faction-desc">${escapeHtml(faction.description)}</span>
      </div>
      <div class="faction-standing">
        <span class="tier-badge" style="background-color: ${tier.color}">${escapeHtml(tier.name)}</span>
        <span class="rep-value">${value.toLocaleString()}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressToNext}%; background-color: ${tier.color}"></div>
      </div>
    </div>
  `;
}

/**
 * Render detailed faction view
 */
export function renderFactionDetail(state, factionId) {
  const rep = getFactionReputation(state, factionId);

  if (!rep) {
    return '<div class="error">Unknown faction</div>';
  }

  const { faction, value, tier, nextTier, progressToNext } = rep;
  const discount = getFactionDiscount(state, factionId);
  const history = getFactionHistory(state, factionId, 10);

  // Check service access
  const basicAccess = canAccessFactionServices(state, factionId, 'basic');
  const advancedAccess = canAccessFactionServices(state, factionId, 'advanced');
  const eliteAccess = canAccessFactionServices(state, factionId, 'elite');

  return `
    <div class="faction-detail" data-faction-id="${escapeHtml(factionId)}">
      <div class="faction-header">
        <h2>${escapeHtml(faction.name)}</h2>
        <p class="faction-description">${escapeHtml(faction.description)}</p>
      </div>

      <div class="standing-display">
        <div class="tier-large" style="background-color: ${tier.color}">
          ${escapeHtml(tier.name)}
        </div>
        <div class="rep-details">
          <span class="rep-value">${value.toLocaleString()} reputation</span>
          ${nextTier ? `
            <span class="next-tier">
              Next: ${escapeHtml(nextTier.name)} at ${nextTier.minValue.toLocaleString()}
            </span>
          ` : '<span class="max-tier">Maximum standing achieved!</span>'}
        </div>
        <div class="progress-bar large">
          <div class="progress-fill" style="width: ${progressToNext}%; background-color: ${tier.color}"></div>
          <span class="progress-text">${progressToNext}%</span>
        </div>
      </div>

      ${discount !== 0 ? `
        <div class="discount-info">
          <span class="discount-label">Merchant Discount:</span>
          <span class="discount-value ${discount > 0 ? 'positive' : 'negative'}">
            ${discount > 0 ? '+' : ''}${(discount * 100).toFixed(0)}%
          </span>
        </div>
      ` : ''}

      <div class="service-access">
        <h3>Service Access</h3>
        <ul class="access-list">
          <li class="${basicAccess.canAccess ? 'available' : 'locked'}">
            <span class="service-name">Basic Services</span>
            ${basicAccess.canAccess ? '&#10003;' : `&#10007; Need ${basicAccess.requiredTier}`}
          </li>
          <li class="${advancedAccess.canAccess ? 'available' : 'locked'}">
            <span class="service-name">Advanced Services</span>
            ${advancedAccess.canAccess ? '&#10003;' : `&#10007; Need ${advancedAccess.requiredTier}`}
          </li>
          <li class="${eliteAccess.canAccess ? 'available' : 'locked'}">
            <span class="service-name">Elite Services</span>
            ${eliteAccess.canAccess ? '&#10003;' : `&#10007; Need ${eliteAccess.requiredTier}`}
          </li>
        </ul>
      </div>

      ${faction.allies && faction.allies.length > 0 ? `
        <div class="faction-relations">
          <h4>Allied Factions</h4>
          <div class="relation-tags">
            ${faction.allies.map(allyId => {
              const ally = FACTIONS[allyId.toUpperCase()];
              return ally ? `<span class="ally-tag">${escapeHtml(ally.name)}</span>` : '';
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${faction.enemies && faction.enemies.length > 0 ? `
        <div class="faction-relations">
          <h4>Rival Factions</h4>
          <div class="relation-tags">
            ${faction.enemies.map(enemyId => {
              const enemy = FACTIONS[enemyId.toUpperCase()];
              return enemy ? `<span class="enemy-tag">${escapeHtml(enemy.name)}</span>` : '';
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${history.length > 0 ? `
        <div class="reputation-history">
          <h3>Recent History</h3>
          <ul class="history-list">
            ${history.map(entry => `
              <li class="history-entry ${entry.amount > 0 ? 'positive' : 'negative'}">
                <span class="change">${entry.amount > 0 ? '+' : ''}${entry.amount}</span>
                <span class="reason">${escapeHtml(entry.reason || 'Unknown')}</span>
                <span class="timestamp">${new Date(entry.timestamp).toLocaleDateString()}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="faction-actions">
        <button class="btn-secondary" data-action="back-to-list">Back to Factions</button>
      </div>
    </div>
  `;
}

/**
 * Render NPC relations list
 */
export function renderNpcRelations(state, npcIds = []) {
  if (npcIds.length === 0) {
    return `
      <div class="npc-relations empty">
        <p>No NPC relations tracked yet.</p>
      </div>
    `;
  }

  return `
    <div class="npc-relations">
      <h3>NPC Relations</h3>
      <div class="npc-list">
        ${npcIds.map(npcId => {
          const relation = getNpcRelation(state, npcId);
          return `
            <div class="npc-row" data-npc-id="${escapeHtml(npcId)}">
              <span class="npc-name">${escapeHtml(relation.name)}</span>
              <span class="npc-tier" style="color: ${relation.tier.color}">
                ${escapeHtml(relation.tier.name)}
              </span>
              <span class="npc-value">${relation.value.toLocaleString()}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render region standings
 */
export function renderRegionStandings(state, regionIds = []) {
  if (regionIds.length === 0) {
    return `
      <div class="region-standings empty">
        <p>No region standings tracked yet.</p>
      </div>
    `;
  }

  return `
    <div class="region-standings">
      <h3>Region Standings</h3>
      <div class="region-list">
        ${regionIds.map(regionId => {
          const standing = getRegionStanding(state, regionId);
          return `
            <div class="region-row" data-region-id="${escapeHtml(regionId)}">
              <span class="region-name">${escapeHtml(standing.name)}</span>
              <span class="region-tier" style="color: ${standing.tier.color}">
                ${escapeHtml(standing.tier.name)}
              </span>
              <span class="region-value">${standing.value.toLocaleString()}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render reputation change notification
 */
export function renderReputationChange(change) {
  const { faction, oldValue, newValue, change: amount, tierChanged, newTier, spillover } = change;

  const isPositive = amount > 0;

  return `
    <div class="reputation-change-notification ${isPositive ? 'positive' : 'negative'}">
      <div class="change-header">
        <span class="faction-name">${escapeHtml(faction?.name || 'Unknown')}</span>
        <span class="change-amount">${isPositive ? '+' : ''}${amount}</span>
      </div>

      ${tierChanged && newTier ? `
        <div class="tier-change">
          <span>New standing:</span>
          <span class="new-tier" style="color: ${REPUTATION_TIERS[newTier.toUpperCase()]?.color || '#888'}">
            ${escapeHtml(newTier)}
          </span>
        </div>
      ` : ''}

      ${spillover && spillover.length > 0 ? `
        <div class="spillover-effects">
          <span class="spillover-label">Related changes:</span>
          ${spillover.map(s => {
            const f = FACTIONS[s.factionId.toUpperCase()];
            return f ? `
              <span class="spillover-item ${s.amount > 0 ? 'positive' : 'negative'}">
                ${escapeHtml(f.name)}: ${s.amount > 0 ? '+' : ''}${s.amount}
              </span>
            ` : '';
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render reputation tier legend
 */
export function renderTierLegend() {
  const tiers = Object.values(REPUTATION_TIERS).sort((a, b) => a.minValue - b.minValue);

  return `
    <div class="tier-legend">
      <h3>Reputation Tiers</h3>
      <div class="tier-list">
        ${tiers.map(tier => `
          <div class="tier-item">
            <span class="tier-color" style="background-color: ${tier.color}"></span>
            <span class="tier-name">${escapeHtml(tier.name)}</span>
            <span class="tier-range">${tier.minValue.toLocaleString()}+</span>
            ${tier.discount !== 0 ? `
              <span class="tier-discount">${tier.discount > 0 ? '+' : ''}${(tier.discount * 100).toFixed(0)}% discount</span>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render faction selection menu
 */
export function renderFactionSelector(state, selectedFactionId = null) {
  const factions = getAllFactionReputations(state);

  return `
    <div class="faction-selector">
      <select class="faction-select" name="factionId">
        <option value="">Select a faction...</option>
        ${factions.map(f => `
          <option value="${escapeHtml(f.faction.id)}" ${selectedFactionId === f.faction.id ? 'selected' : ''}>
            ${escapeHtml(f.faction.name)} (${escapeHtml(f.tier.name)})
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render compact reputation bar (for HUD)
 */
export function renderCompactReputationBar(state, factionId) {
  const rep = getFactionReputation(state, factionId);
  if (!rep) return '';

  return `
    <div class="compact-rep-bar" data-faction="${escapeHtml(factionId)}">
      <span class="faction-short">${escapeHtml(rep.faction.name.substring(0, 3))}</span>
      <div class="mini-bar">
        <div class="mini-fill" style="width: ${rep.progressToNext}%; background-color: ${rep.tier.color}"></div>
      </div>
      <span class="tier-icon" style="color: ${rep.tier.color}">${escapeHtml(rep.tier.name.charAt(0))}</span>
    </div>
  `;
}

/**
 * Render reputation rewards preview
 */
export function renderReputationRewards(factionId, tierRewards = {}) {
  const faction = FACTIONS[factionId.toUpperCase()];
  if (!faction) return '';

  const tiers = Object.values(REPUTATION_TIERS).sort((a, b) => a.minValue - b.minValue);

  return `
    <div class="reputation-rewards">
      <h3>Rewards for ${escapeHtml(faction.name)}</h3>
      <div class="rewards-list">
        ${tiers.map(tier => {
          const rewards = tierRewards[tier.id] || [];
          return `
            <div class="tier-rewards">
              <div class="tier-header" style="border-color: ${tier.color}">
                <span class="tier-name">${escapeHtml(tier.name)}</span>
                <span class="tier-req">${tier.minValue.toLocaleString()} rep</span>
              </div>
              ${rewards.length > 0 ? `
                <ul class="reward-items">
                  ${rewards.map(reward => `
                    <li>${escapeHtml(reward)}</li>
                  `).join('')}
                </ul>
              ` : '<p class="no-rewards">No special rewards</p>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render faction comparison
 */
export function renderFactionComparison(state, factionIds) {
  return `
    <div class="faction-comparison">
      <h3>Faction Comparison</h3>
      <div class="comparison-grid">
        ${factionIds.map(factionId => {
          const rep = getFactionReputation(state, factionId);
          if (!rep) return '';

          return `
            <div class="comparison-card">
              <h4>${escapeHtml(rep.faction.name)}</h4>
              <div class="comparison-tier" style="background-color: ${rep.tier.color}">
                ${escapeHtml(rep.tier.name)}
              </div>
              <div class="comparison-value">${rep.value.toLocaleString()}</div>
              <div class="comparison-bar">
                <div class="bar-fill" style="width: ${rep.progressToNext}%; background-color: ${rep.tier.color}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
