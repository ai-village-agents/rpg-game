/**
 * Statistics Dashboard Integration
 * Integrates the comprehensive statistics dashboard into the game's menu system
 * Provides a dedicated phase for viewing detailed gameplay statistics
 */

import { renderStatisticsDashboard, injectDashboardStyles } from './statistics-dashboard-ui.js';

/**
 * Get CSS styles needed for the statistics dashboard integration
 * @returns {string} CSS styles
 */
export function getStatsDashboardIntegrationStyles() {
  return `
    .stats-dashboard-container {
      padding: 8px;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }
    
    .stats-dashboard-close-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stats-dashboard-close-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .stats-dashboard-actions {
      display: flex;
      justify-content: center;
      padding: 12px;
      gap: 12px;
    }
    
    .stats-dashboard-toggle-btn {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }
    
    .stats-dashboard-toggle-btn:hover {
      opacity: 0.9;
    }
  `;
}

/**
 * Render the statistics dashboard panel for the 'statistics-dashboard' phase
 * @param {Object} state - Current game state
 * @returns {string} HTML string for the dashboard
 */
export function renderStatsDashboardPhase(state) {
  return `
    <div class="stats-dashboard-container">
      ${renderStatisticsDashboard(state)}
    </div>
  `;
}

/**
 * Render action buttons for the statistics dashboard phase
 * @returns {string} HTML string for action buttons
 */
export function renderStatsDashboardActions() {
  return `
    <div class="stats-dashboard-actions buttons">
      <button id="btnCloseStatsDashboard" class="stats-dashboard-close-btn">
        📊 Close Statistics
      </button>
    </div>
  `;
}

/**
 * Attach event handlers for the statistics dashboard phase
 * @param {HTMLElement} container - The container element
 * @param {Function} dispatch - The dispatch function
 */
export function attachStatsDashboardHandlers(container, dispatch) {
  const closeBtn = container.querySelector('#btnCloseStatsDashboard') || 
                   document.getElementById('btnCloseStatsDashboard');
  if (closeBtn) {
    closeBtn.onclick = () => dispatch({ type: 'CLOSE_STATISTICS_DASHBOARD' });
  }
}

/**
 * Initialize the statistics dashboard by injecting styles
 * @param {Document} doc - Document object
 */
export function initStatsDashboard(doc = document) {
  // Inject dashboard UI styles
  injectDashboardStyles(doc);
  
  // Inject integration styles
  if (!doc.getElementById('stats-dashboard-integration-styles')) {
    const styleEl = doc.createElement('style');
    styleEl.id = 'stats-dashboard-integration-styles';
    styleEl.textContent = getStatsDashboardIntegrationStyles();
    doc.head.appendChild(styleEl);
  }
}

/**
 * Check if statistics dashboard is currently open
 * @param {Object} state - Current game state
 * @returns {boolean} True if dashboard is open
 */
export function isStatsDashboardOpen(state) {
  return state.phase === 'statistics-dashboard';
}

export default {
  renderStatsDashboardPhase,
  renderStatsDashboardActions,
  attachStatsDashboardHandlers,
  initStatsDashboard,
  isStatsDashboardOpen,
  getStatsDashboardIntegrationStyles
};
