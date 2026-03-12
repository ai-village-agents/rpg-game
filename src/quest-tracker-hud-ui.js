/**
 * Quest Tracker HUD UI Module
 * Renders the quest tracker overlay on the game screen.
 */

import { getTrackedQuestObjective } from './quest-tracker-hud.js';

/**
 * Render the quest tracker HUD
 * @param {Object} state - Game state
 * @returns {string} HTML string for the tracker
 */
export function renderQuestTrackerHUD(state) {
  const trackerState = state.questTrackerState;
  
  // Don't render if minimized
  if (trackerState?.isMinimized) {
    return renderMinimizedTracker();
  }
  
  const objective = getTrackedQuestObjective(state);
  
  if (!objective) {
    return renderNoQuestTracker();
  }
  
  const isExpanded = trackerState?.isExpanded ?? false;
  
  if (isExpanded) {
    return renderExpandedTracker(objective);
  }
  
  return renderCompactTracker(objective);
}

/**
 * Render minimized tracker (just a small icon)
 * @returns {string} HTML string
 */
function renderMinimizedTracker() {
  return `
    <div class="quest-tracker-hud quest-tracker-minimized" 
         onclick="window.dispatchEvent(new CustomEvent('questTrackerToggleMinimize'))"
         title="Click to show quest tracker">
      <span class="tracker-icon">📋</span>
    </div>
  `;
}

/**
 * Render when no quest is tracked
 * @returns {string} HTML string
 */
function renderNoQuestTracker() {
  return `
    <div class="quest-tracker-hud quest-tracker-empty">
      <div class="tracker-header">
        <span class="tracker-title">📋 No Quest Tracked</span>
      </div>
      <div class="tracker-hint">Accept a quest to track it here</div>
    </div>
  `;
}

/**
 * Render compact tracker view
 * @param {Object} objective - Quest objective info
 * @returns {string} HTML string
 */
function renderCompactTracker(objective) {
  // Show first incomplete objective, or last objective if all complete
  const currentObj = objective.objectives.find(o => !o.completed) 
                   || objective.objectives[objective.objectives.length - 1];
  
  const progressText = currentObj 
    ? `${currentObj.progress}/${currentObj.target}`
    : '';
  
  const progressPercent = currentObj 
    ? Math.min(100, Math.floor((currentObj.progress / currentObj.target) * 100))
    : 100;
  
  return `
    <div class="quest-tracker-hud quest-tracker-compact">
      <div class="tracker-header">
        <span class="tracker-title" title="${objective.questName}">
          📋 ${truncateText(objective.questName, 20)}
        </span>
        <div class="tracker-controls">
          <button class="tracker-btn" onclick="window.dispatchEvent(new CustomEvent('questTrackerCycle'))" title="Next quest">⟳</button>
          <button class="tracker-btn" onclick="window.dispatchEvent(new CustomEvent('questTrackerToggleExpand'))" title="Expand">▼</button>
          <button class="tracker-btn" onclick="window.dispatchEvent(new CustomEvent('questTrackerToggleMinimize'))" title="Minimize">−</button>
        </div>
      </div>
      <div class="tracker-objective">
        <span class="objective-text">${currentObj?.text || 'Complete quest'}</span>
        ${progressText ? `<span class="objective-progress">${progressText}</span>` : ''}
      </div>
      <div class="tracker-progress-bar">
        <div class="tracker-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render expanded tracker view with all objectives
 * @param {Object} objective - Quest objective info
 * @returns {string} HTML string
 */
function renderExpandedTracker(objective) {
  const objectivesHtml = objective.objectives.map(obj => {
    const checkmark = obj.completed ? '✅' : '⬜';
    const progressText = obj.target > 1 ? ` (${obj.progress}/${obj.target})` : '';
    const completedClass = obj.completed ? 'objective-completed' : '';
    
    return `
      <div class="tracker-objective-item ${completedClass}">
        <span class="objective-check">${checkmark}</span>
        <span class="objective-text">${obj.text}${progressText}</span>
      </div>
    `;
  }).join('');
  
  const stageProgress = `Stage ${objective.stageIndex + 1}/${objective.totalStages}`;
  
  return `
    <div class="quest-tracker-hud quest-tracker-expanded">
      <div class="tracker-header">
        <span class="tracker-title">📋 ${objective.questName}</span>
        <div class="tracker-controls">
          <button class="tracker-btn" onclick="window.dispatchEvent(new CustomEvent('questTrackerCycle'))" title="Next quest">⟳</button>
          <button class="tracker-btn" onclick="window.dispatchEvent(new CustomEvent('questTrackerToggleExpand'))" title="Collapse">▲</button>
          <button class="tracker-btn" onclick="window.dispatchEvent(new CustomEvent('questTrackerToggleMinimize'))" title="Minimize">−</button>
        </div>
      </div>
      <div class="tracker-stage">${objective.stageName} (${stageProgress})</div>
      <div class="tracker-objectives-list">
        ${objectivesHtml}
      </div>
    </div>
  `;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

/**
 * Get CSS styles for the quest tracker HUD
 * @returns {string} CSS string
 */
export function getQuestTrackerStyles() {
  return `
    .quest-tracker-hud {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(20, 20, 30, 0.95);
      border: 2px solid #4a9eff;
      border-radius: 8px;
      padding: 8px 12px;
      min-width: 200px;
      max-width: 280px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: #e0e0e0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    
    .quest-tracker-minimized {
      min-width: auto;
      padding: 6px 10px;
      cursor: pointer;
    }
    
    .quest-tracker-minimized:hover {
      border-color: #6ab8ff;
      background: rgba(30, 30, 40, 0.95);
    }
    
    .tracker-icon {
      font-size: 16px;
    }
    
    .quest-tracker-empty {
      opacity: 0.7;
    }
    
    .tracker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    
    .tracker-title {
      color: #4a9eff;
      font-weight: bold;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .tracker-controls {
      display: flex;
      gap: 4px;
    }
    
    .tracker-btn {
      background: rgba(74, 158, 255, 0.2);
      border: 1px solid #4a9eff;
      border-radius: 4px;
      color: #4a9eff;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    
    .tracker-btn:hover {
      background: rgba(74, 158, 255, 0.4);
    }
    
    .tracker-hint {
      color: #888;
      font-size: 8px;
      font-style: italic;
    }
    
    .tracker-stage {
      color: #aaa;
      font-size: 8px;
      margin-bottom: 6px;
    }
    
    .tracker-objective {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .objective-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .objective-progress {
      color: #4a9eff;
      margin-left: 8px;
      white-space: nowrap;
    }
    
    .tracker-progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .tracker-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4a9eff, #6ab8ff);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    
    .tracker-objectives-list {
      max-height: 120px;
      overflow-y: auto;
    }
    
    .tracker-objective-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .tracker-objective-item:last-child {
      border-bottom: none;
    }
    
    .tracker-objective-item.objective-completed {
      opacity: 0.6;
    }
    
    .tracker-objective-item.objective-completed .objective-text {
      text-decoration: line-through;
    }
    
    .objective-check {
      flex-shrink: 0;
    }
  `;
}
