/**
 * Statistics Dashboard UI
 * Renders comprehensive game statistics in a visual dashboard panel
 * Displays combat, economy, enemy, item, quest, exploration, and time stats
 */

import { getStatisticsSummary, getTopEnemiesDefeated, createEmptyStatistics } from './statistics-dashboard.js';

/**
 * CSS styles for the statistics dashboard
 */
const DASHBOARD_STYLES = `
.stats-dashboard {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a5568;
  border-radius: 8px;
  padding: 16px;
  color: #e2e8f0;
  font-family: 'Segoe UI', sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.stats-dashboard-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
  color: #f6e05e;
  text-shadow: 0 0 10px rgba(246, 224, 94, 0.5);
}

.stats-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.stats-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #90cdf4;
  border-bottom: 1px solid #4a5568;
  padding-bottom: 8px;
}

.stats-section-icon {
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.stat-label {
  color: #a0aec0;
  font-size: 13px;
}

.stat-value {
  font-weight: bold;
  color: #68d391;
}

.stat-value.negative {
  color: #fc8181;
}

.stat-value.neutral {
  color: #f6e05e;
}

.stat-value.highlight {
  color: #b794f4;
}

.enemy-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

.enemy-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.enemy-item:last-child {
  border-bottom: none;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #68d391);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.time-display {
  font-size: 16px;
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: #90cdf4;
}
`;

/**
 * Section icons for visual identification
 */
export const SECTION_ICONS = {
  combat: '⚔️',
  enemies: '👹',
  economy: '💰',
  items: '🎒',
  quests: '📜',
  exploration: '🗺️',
  time: '⏱️'
};

/**
 * Create and inject dashboard CSS styles
 * @param {Document} doc - Document object
 */
export function injectDashboardStyles(doc = document) {
  const existingStyle = doc.getElementById('stats-dashboard-styles');
  if (existingStyle) {
    return;
  }
  
  const style = doc.createElement('style');
  style.id = 'stats-dashboard-styles';
  style.textContent = DASHBOARD_STYLES;
  doc.head.appendChild(style);
}

/**
 * Format a number with commas for readability
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
}

/**
 * Render a single stat item
 * @param {string} label - Stat label
 * @param {string|number} value - Stat value
 * @param {string} valueClass - Optional CSS class for value
 * @returns {string} HTML string for stat item
 */
export function renderStatItem(label, value, valueClass = '') {
  // Handle undefined/null values by defaulting to 0
  const formattedValue = (value === undefined || value === null)
    ? '0'
    : (typeof value === 'number' ? formatNumber(value) : value);
  return `
    <div class="stat-item">
      <span class="stat-label">${label}</span>
      <span class="stat-value ${valueClass}">${formattedValue}</span>
    </div>
  `;
}

/**
 * Render combat statistics section
 * @param {Object} combat - Combat stats from summary
 * @returns {string} HTML string for combat section
 */
export function renderCombatSection(combat) {
  if (!combat) return '';
  
  return `
    <div class="stats-section" data-section="combat">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.combat}</span>
        <span>Combat Statistics</span>
      </div>
      <div class="stats-grid">
        ${renderStatItem('Damage Dealt', combat.totalDamageDealt)}
        ${renderStatItem('Damage Received', combat.totalDamageReceived, 'negative')}
        ${renderStatItem('Healing Done', combat.totalHealingDone, 'highlight')}
        ${renderStatItem('Hits Landed', combat.totalHits)}
        ${renderStatItem('Misses', combat.totalMisses, 'neutral')}
        ${renderStatItem('Critical Hits', combat.totalCriticalHits, 'highlight')}
        ${renderStatItem('Highest Hit', combat.highestSingleHit, 'highlight')}
        ${renderStatItem('Longest Combo', combat.longestCombo)}
        ${renderStatItem('Perfect Victories', combat.perfectVictories, 'highlight')}
        ${renderStatItem('Close Calls', combat.closeCalls, 'neutral')}
      </div>
    </div>
  `;
}

/**
 * Render enemy statistics section
 * @param {Object} enemies - Enemy stats from summary
 * @param {Array} topEnemies - Top enemies defeated list
 * @returns {string} HTML string for enemies section
 */
export function renderEnemiesSection(enemies, topEnemies = []) {
  if (!enemies) return '';
  
  const topEnemiesHtml = topEnemies.length > 0 
    ? `
      <ul class="enemy-list">
        ${topEnemies.map(e => `
          <li class="enemy-item">
            <span>${e.type}</span>
            <span class="stat-value">${formatNumber(e.count)}</span>
          </li>
        `).join('')}
      </ul>
    `
    : '<div class="stat-item"><span class="stat-label">No enemies defeated yet</span></div>';
  
  return `
    <div class="stats-section" data-section="enemies">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.enemies}</span>
        <span>Enemies Defeated</span>
      </div>
      <div class="stats-grid">
        ${renderStatItem('Total Defeated', enemies.totalDefeated)}
        ${renderStatItem('Bosses', enemies.bossesDefeated, 'highlight')}
        ${renderStatItem('Elites', enemies.elitesDefeated, 'neutral')}
      </div>
      <div class="stats-section-header" style="margin-top: 12px; font-size: 14px;">
        <span>Top Enemy Types</span>
      </div>
      ${topEnemiesHtml}
    </div>
  `;
}

/**
 * Render economy statistics section
 * @param {Object} economy - Economy stats from summary
 * @returns {string} HTML string for economy section
 */
export function renderEconomySection(economy) {
  if (!economy) return '';
  
  const netClass = economy.netGold >= 0 ? '' : 'negative';
  
  return `
    <div class="stats-section" data-section="economy">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.economy}</span>
        <span>Economy</span>
      </div>
      <div class="stats-grid">
        ${renderStatItem('Gold Earned', economy.goldEarned)}
        ${renderStatItem('Gold Spent', economy.goldSpent, 'negative')}
        ${renderStatItem('Net Gold', economy.netGold, netClass)}
        ${renderStatItem('From Combat', economy.goldFromCombat)}
        ${renderStatItem('From Quests', economy.goldFromQuests)}
        ${renderStatItem('Largest Purchase', economy.largestPurchase, 'neutral')}
        ${renderStatItem('Largest Sale', economy.largestSale, 'neutral')}
      </div>
    </div>
  `;
}

/**
 * Render items statistics section
 * @param {Object} items - Items stats from summary
 * @returns {string} HTML string for items section
 */
export function renderItemsSection(items) {
  if (!items) return '';
  
  return `
    <div class="stats-section" data-section="items">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.items}</span>
        <span>Items</span>
      </div>
      <div class="stats-grid">
        ${renderStatItem('Total Found', items.totalFound)}
        ${renderStatItem('Total Crafted', items.totalCrafted)}
        ${renderStatItem('Consumables Used', items.consumablesUsed)}
        ${renderStatItem('Legendary Items', items.legendaryItemsFound, 'highlight')}
        ${renderStatItem('Rare Items', items.rareItemsFound, 'neutral')}
      </div>
    </div>
  `;
}

/**
 * Render quests statistics section
 * @param {Object} quests - Quests stats from summary
 * @returns {string} HTML string for quests section
 */
export function renderQuestsSection(quests) {
  if (!quests) return '';
  
  return `
    <div class="stats-section" data-section="quests">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.quests}</span>
        <span>Quests</span>
      </div>
      <div class="stats-grid">
        ${renderStatItem('Total Completed', quests.totalCompleted)}
        ${renderStatItem('Main Quests', quests.mainQuestsCompleted, 'highlight')}
        ${renderStatItem('Side Quests', quests.sideQuestsCompleted)}
        ${renderStatItem('Daily Challenges', quests.dailyChallengesCompleted, 'neutral')}
        ${renderStatItem('Bounties', quests.bountiesCompleted)}
      </div>
    </div>
  `;
}

/**
 * Render exploration statistics section
 * @param {Object} exploration - Exploration stats from summary
 * @returns {string} HTML string for exploration section
 */
export function renderExplorationSection(exploration) {
  if (!exploration) return '';
  
  return `
    <div class="stats-section" data-section="exploration">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.exploration}</span>
        <span>Exploration</span>
      </div>
      <div class="stats-grid">
        ${renderStatItem('Rooms Visited', exploration.uniqueRoomsVisited)}
        ${renderStatItem('Secrets Found', exploration.secretsDiscovered, 'highlight')}
        ${renderStatItem('Chests Opened', exploration.chestsOpened)}
      </div>
    </div>
  `;
}

/**
 * Render time statistics section
 * @param {Object} time - Time stats from summary
 * @returns {string} HTML string for time section
 */
export function renderTimeSection(time) {
  if (!time) return '';
  
  return `
    <div class="stats-section" data-section="time">
      <div class="stats-section-header">
        <span class="stats-section-icon">${SECTION_ICONS.time}</span>
        <span>Time Played</span>
      </div>
      <div class="stats-grid">
        <div class="time-display">
          <div class="stat-label">Total Play Time</div>
          <div class="stat-value highlight" style="font-size: 20px;">${time.totalPlayTime}</div>
        </div>
        <div class="time-display">
          <div class="stat-label">Combat Time</div>
          <div class="stat-value">${time.combatTime}</div>
        </div>
        <div class="time-display">
          <div class="stat-label">Exploration Time</div>
          <div class="stat-value">${time.explorationTime}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the full statistics dashboard
 * @param {Object} state - Current game state
 * @returns {string} Complete HTML string for dashboard
 */
export function renderStatisticsDashboard(state) {
  const summary = getStatisticsSummary(state);
  const topEnemies = getTopEnemiesDefeated(state, 5);
  
  return `
    <div class="stats-dashboard">
      <div class="stats-dashboard-title">📊 Statistics Dashboard</div>
      ${renderCombatSection(summary.combat)}
      ${renderEnemiesSection(summary.enemies, topEnemies)}
      ${renderEconomySection(summary.economy)}
      ${renderItemsSection(summary.items)}
      ${renderQuestsSection(summary.quests)}
      ${renderExplorationSection(summary.exploration)}
      ${renderTimeSection(summary.time)}
    </div>
  `;
}

/**
 * Create a DOM element for the statistics dashboard
 * @param {Object} state - Current game state
 * @param {Document} doc - Document object
 * @returns {HTMLElement} Dashboard DOM element
 */
export function createStatisticsDashboardElement(state, doc = document) {
  injectDashboardStyles(doc);
  
  const container = doc.createElement('div');
  container.innerHTML = renderStatisticsDashboard(state);
  return container.firstElementChild;
}

/**
 * Update an existing dashboard element with new state
 * @param {HTMLElement} element - Existing dashboard element
 * @param {Object} state - New game state
 */
export function updateStatisticsDashboard(element, state) {
  if (!element) return;
  
  const newContent = renderStatisticsDashboard(state);
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = newContent;
  
  element.innerHTML = tempContainer.firstElementChild.innerHTML;
}

/**
 * Toggle visibility of a specific section
 * @param {HTMLElement} dashboard - Dashboard element
 * @param {string} sectionName - Name of section to toggle
 * @returns {boolean} New visibility state
 */
export function toggleSection(dashboard, sectionName) {
  const section = dashboard.querySelector(`[data-section="${sectionName}"]`);
  if (!section) return false;
  
  const isHidden = section.style.display === 'none';
  section.style.display = isHidden ? 'block' : 'none';
  return isHidden;
}

/**
 * Get section visibility states
 * @param {HTMLElement} dashboard - Dashboard element
 * @returns {Object} Map of section names to visibility states
 */
export function getSectionVisibility(dashboard) {
  const sections = ['combat', 'enemies', 'economy', 'items', 'quests', 'exploration', 'time'];
  const visibility = {};
  
  sections.forEach(name => {
    const section = dashboard.querySelector(`[data-section="${name}"]`);
    visibility[name] = section ? section.style.display !== 'none' : true;
  });
  
  return visibility;
}

export default {
  injectDashboardStyles,
  formatNumber,
  renderStatItem,
  renderCombatSection,
  renderEnemiesSection,
  renderEconomySection,
  renderItemsSection,
  renderQuestsSection,
  renderExplorationSection,
  renderTimeSection,
  renderStatisticsDashboard,
  createStatisticsDashboardElement,
  updateStatisticsDashboard,
  toggleSection,
  getSectionVisibility,
  SECTION_ICONS
};
