// achievements-ui.js - Achievement System UI Rendering
import { esc } from './util.js';
import { 
  getAllAchievements, 
  getAchievementsByCategory, 
  getUnlockedCount, 
  getTotalCount, 
  isUnlocked, 
  getProgress 
} from './achievements.js';

/**
 * Render the achievements panel with category tabs and progress display
 * @param {Object} state - Current game state
 * @returns {string} HTML string for achievements panel
 */
export function renderAchievementsPanel(state) {
  const currentCategory = state.achievementsCategory || 'All';
  const categories = ['All', 'Combat', 'Exploration', 'Progression', 'Collection', 'Quests'];
  
  const unlockedCount = getUnlockedCount(state);
  const totalCount = getTotalCount();
  const overallProgress = totalCount > 0 ? Math.floor((unlockedCount / totalCount) * 100) : 0;
  
  // Build category tabs
  const tabsHTML = categories.map(cat => {
    const active = cat === currentCategory ? 'active' : '';
    return `<button class="achievement-tab ${active}" data-category="${esc(cat)}">${esc(cat)}</button>`;
  }).join('');
  
  // Get achievements for current category
  const achievements = currentCategory === 'All' 
    ? getAllAchievements() 
    : getAchievementsByCategory(currentCategory);
  
  // Build achievement list
  const achievementsHTML = achievements.map(achievement => {
    const unlocked = isUnlocked(state, achievement.id);
    const progress = getProgress(state, achievement.id);
    const progressPercent = achievement.maxProgress > 0 
      ? Math.floor((progress / achievement.maxProgress) * 100) 
      : (unlocked ? 100 : 0);
    
    const unlockedClass = unlocked ? 'unlocked' : 'locked';
    const icon = unlocked ? '🏆' : '🔒';
    
    return `
      <div class="achievement-item ${unlockedClass}">
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-details">
          <div class="achievement-name">${esc(achievement.name)}</div>
          <div class="achievement-description">${esc(achievement.description)}</div>
          ${achievement.maxProgress > 0 ? `
            <div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <div class="progress-text">${progress} / ${achievement.maxProgress}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="achievements-panel">
      <div class="achievements-header">
        <h2>Achievements</h2>
        <button class="close-btn" data-action="CLOSE_ACHIEVEMENTS">×</button>
      </div>
      <div class="achievements-stats">
        <div class="overall-progress">
          <div class="progress-label">Overall Progress: ${unlockedCount} / ${totalCount} (${overallProgress}%)</div>
          <div class="progress-bar large">
            <div class="progress-fill" style="width: ${overallProgress}%"></div>
          </div>
        </div>
      </div>
      <div class="achievements-tabs">
        ${tabsHTML}
      </div>
      <div class="achievements-list">
        ${achievementsHTML.length > 0 ? achievementsHTML : '<div class="no-achievements">No achievements in this category.</div>'}
      </div>
    </div>
  `;
}

/**
 * Attach click handlers for achievement tabs using event delegation.
 * @param {HTMLElement} container
 * @param {function} dispatch
 */
export function attachAchievementsHandlers(container, dispatch) {
  if (!container) return;

  container.addEventListener('click', (event) => {
    const tab = event.target.closest('.achievement-tab');
    if (!tab || !container.contains(tab)) return;

    const { category } = tab.dataset;
    if (!category) return;

    dispatch({ type: 'SET_ACHIEVEMENT_CATEGORY', category });
  });
}
