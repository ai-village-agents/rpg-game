/**
 * Quest System UI Components
 * Renders quest displays, tracking, and notifications
 */

import {
  QUEST_DATA,
  QUEST_TYPES,
  QUEST_STATUS,
  getQuestData,
  getQuestStatus,
  getObjectiveProgress,
  areObjectivesComplete,
  getAvailableQuests,
  getActiveQuestsWithProgress,
  getCompletedQuests,
} from './quest-system.js';

/**
 * Get CSS styles for quest system UI
 * @returns {string} CSS styles
 */
export function getQuestStyles() {
  return `
.quest-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 10px;
  padding: 15px;
}

.quest-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.quest-header h2 {
  margin: 0;
  font-size: 18px;
  color: #e8e8e8;
}

.quest-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 15px;
}

.quest-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 6px;
  background: rgba(50, 50, 50, 0.3);
  color: #888;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.quest-tab:hover {
  background: rgba(100, 100, 100, 0.3);
  color: #ccc;
}

.quest-tab.active {
  background: rgba(100, 180, 100, 0.2);
  border-color: #4a8;
  color: #8f8;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.quest-card {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quest-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #555;
}

.quest-card.main {
  border-left: 3px solid #ffd700;
}

.quest-card.side {
  border-left: 3px solid #4a8;
}

.quest-card.daily {
  border-left: 3px solid #48a;
}

.quest-card.complete {
  opacity: 0.7;
  border-left-color: #888;
}

.quest-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.quest-icon {
  font-size: 20px;
}

.quest-name {
  font-weight: bold;
  color: #e8e8e8;
  font-size: 14px;
  flex: 1;
}

.quest-type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.quest-type-badge.main { background: rgba(255, 215, 0, 0.2); color: #ffd700; }
.quest-type-badge.side { background: rgba(68, 170, 136, 0.2); color: #4a8; }
.quest-type-badge.daily { background: rgba(68, 136, 170, 0.2); color: #48a; }

.quest-description {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 8px;
}

.quest-progress-bar {
  height: 4px;
  background: #333;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.quest-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.3s ease;
}

.quest-progress-fill.complete {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
}

/* Quest details view */
.quest-details {
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-top: 10px;
}

.quest-details-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.quest-details-icon {
  font-size: 28px;
}

.quest-details-title {
  flex: 1;
}

.quest-details-title h3 {
  margin: 0;
  font-size: 16px;
  color: #e8e8e8;
}

.quest-details-title p {
  margin: 0;
  font-size: 11px;
  color: #888;
}

.quest-objectives {
  margin: 12px 0;
}

.quest-objective {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
}

.quest-objective.complete {
  text-decoration: line-through;
  opacity: 0.7;
}

.objective-check {
  width: 16px;
  height: 16px;
  border: 2px solid #555;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.objective-check.done {
  background: #4a8;
  border-color: #4a8;
}

.objective-text {
  flex: 1;
  color: #ccc;
}

.objective-progress {
  color: #888;
  font-size: 11px;
}

.quest-rewards {
  padding: 10px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  margin-top: 10px;
}

.quest-rewards-title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-item {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border-radius: 4px;
}

/* Quest notification */
.quest-notification {
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: quest-notify 0.3s ease-out;
}

@keyframes quest-notify {
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.quest-notification.started {
  background: linear-gradient(90deg, rgba(68, 170, 136, 0.3), transparent);
  border-left: 3px solid #4a8;
}

.quest-notification.completed {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), transparent);
  border-left: 3px solid #ffd700;
}

.quest-notification.objective {
  background: linear-gradient(90deg, rgba(100, 150, 200, 0.3), transparent);
  border-left: 3px solid #68a;
}

.quest-notification-icon {
  font-size: 18px;
}

.quest-notification-text {
  font-size: 12px;
  color: #ddd;
}

/* Quest tracker (HUD) */
.quest-tracker {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 10px;
  min-width: 200px;
}

.quest-tracker-title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.tracked-quest {
  margin-bottom: 10px;
}

.tracked-quest-name {
  font-size: 12px;
  font-weight: bold;
  color: #e8e8e8;
  margin-bottom: 4px;
}

.tracked-objective {
  font-size: 10px;
  color: #aaa;
  padding-left: 10px;
  margin-bottom: 2px;
}

.tracked-objective.complete {
  color: #8f8;
  text-decoration: line-through;
}

/* Quest buttons */
.quest-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.quest-btn.accept {
  background: #4a8;
  color: #fff;
}

.quest-btn.accept:hover {
  background: #5b9;
}

.quest-btn.complete {
  background: #ffd700;
  color: #000;
}

.quest-btn.complete:hover {
  background: #ffaa00;
}

.quest-btn.abandon {
  background: #a44;
  color: #fff;
}

.quest-btn.abandon:hover {
  background: #b55;
}

.quest-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
}

/**
 * Render quest list panel
 * @param {Object} state - Quest state
 * @param {string} activeTab - Active tab ('active', 'available', 'completed')
 * @param {number} playerLevel - Player level
 * @returns {string} HTML string
 */
export function renderQuestPanel(state, activeTab = 'active', playerLevel = 1) {
  const tabs = `
    <div class="quest-tabs">
      <div class="quest-tab ${activeTab === 'active' ? 'active' : ''}" data-tab="active">Active</div>
      <div class="quest-tab ${activeTab === 'available' ? 'active' : ''}" data-tab="available">Available</div>
      <div class="quest-tab ${activeTab === 'completed' ? 'active' : ''}" data-tab="completed">Completed</div>
    </div>
  `;
  
  let content = '';
  
  if (activeTab === 'active') {
    const quests = getActiveQuestsWithProgress(state);
    content = quests.length > 0
      ? quests.map(q => renderQuestCard(q, true)).join('')
      : '<div style="color: #888; text-align: center; padding: 20px;">No active quests</div>';
  } else if (activeTab === 'available') {
    const quests = getAvailableQuests(state, playerLevel);
    content = quests.length > 0
      ? quests.map(q => renderQuestCard(q, false)).join('')
      : '<div style="color: #888; text-align: center; padding: 20px;">No quests available</div>';
  } else {
    const quests = getCompletedQuests(state);
    content = quests.length > 0
      ? quests.map(q => renderQuestCard(q, false, true)).join('')
      : '<div style="color: #888; text-align: center; padding: 20px;">No completed quests</div>';
  }
  
  return `
    <div class="quest-panel">
      <div class="quest-header">
        <h2>\uD83D\uDCDC Quests</h2>
      </div>
      ${tabs}
      <div class="quest-list">
        ${content}
      </div>
    </div>
  `.trim();
}

/**
 * Render quest card
 * @param {Object} quest - Quest data with progress
 * @param {boolean} showProgress - Whether to show progress
 * @param {boolean} isCompleted - Whether quest is completed
 * @returns {string} HTML string
 */
function renderQuestCard(quest, showProgress = false, isCompleted = false) {
  const typeClass = quest.type;
  const progressBar = showProgress && quest.percentComplete !== undefined
    ? `<div class="quest-progress-bar">
         <div class="quest-progress-fill ${quest.isComplete ? 'complete' : ''}" style="width: ${quest.percentComplete}%"></div>
       </div>`
    : '';
  
  return `
    <div class="quest-card ${typeClass} ${isCompleted ? 'complete' : ''}" data-quest="${quest.id}">
      <div class="quest-card-header">
        <span class="quest-icon">${escapeHtml(quest.icon)}</span>
        <span class="quest-name">${escapeHtml(quest.name)}</span>
        <span class="quest-type-badge ${typeClass}">${quest.type}</span>
      </div>
      <div class="quest-description">${escapeHtml(quest.description)}</div>
      ${progressBar}
    </div>
  `;
}

/**
 * Render quest details view
 * @param {Object} state - Quest state
 * @param {string} questId - Quest ID
 * @returns {string} HTML string
 */
export function renderQuestDetails(state, questId) {
  const quest = getQuestData(questId);
  if (!quest) {
    return '<div class="quest-details">Quest not found</div>';
  }
  
  const status = getQuestStatus(state, questId);
  const isActive = status === QUEST_STATUS.ACTIVE;
  const isComplete = areObjectivesComplete(state, questId);
  
  const objectives = quest.objectives.map(obj => {
    const progress = isActive ? getObjectiveProgress(state, questId, obj.id) : 0;
    const done = progress >= obj.amount;
    
    return `
      <div class="quest-objective ${done ? 'complete' : ''}">
        <span class="objective-check ${done ? 'done' : ''}">${done ? '\u2713' : ''}</span>
        <span class="objective-text">${escapeHtml(obj.description)}</span>
        <span class="objective-progress">${progress}/${obj.amount}</span>
      </div>
    `;
  }).join('');
  
  const rewards = [];
  if (quest.rewards.xp) rewards.push(`${quest.rewards.xp} XP`);
  if (quest.rewards.gold) rewards.push(`${quest.rewards.gold} Gold`);
  if (quest.rewards.items) {
    for (const item of quest.rewards.items) {
      rewards.push(item);
    }
  }
  
  let buttons = '';
  if (status === QUEST_STATUS.AVAILABLE) {
    buttons = `<button class="quest-btn accept" data-action="start" data-quest="${questId}">Accept Quest</button>`;
  } else if (isActive && isComplete) {
    buttons = `<button class="quest-btn complete" data-action="complete" data-quest="${questId}">Complete Quest</button>`;
  } else if (isActive) {
    buttons = `<button class="quest-btn abandon" data-action="abandon" data-quest="${questId}">Abandon</button>`;
  }
  
  return `
    <div class="quest-details">
      <div class="quest-details-header">
        <span class="quest-details-icon">${escapeHtml(quest.icon)}</span>
        <div class="quest-details-title">
          <h3>${escapeHtml(quest.name)}</h3>
          <p>Chapter ${quest.chapter} - Level ${quest.minLevel}+</p>
        </div>
      </div>
      <div class="quest-description">${escapeHtml(quest.description)}</div>
      <div class="quest-objectives">
        ${objectives}
      </div>
      <div class="quest-rewards">
        <div class="quest-rewards-title">Rewards</div>
        <div class="reward-list">
          ${rewards.map(r => `<span class="reward-item">${escapeHtml(r)}</span>`).join('')}
        </div>
      </div>
      <div style="margin-top: 12px; text-align: right;">
        ${buttons}
      </div>
    </div>
  `.trim();
}

/**
 * Render quest tracker (HUD element)
 * @param {Object} state - Quest state
 * @param {number} maxQuests - Max quests to show
 * @returns {string} HTML string
 */
export function renderQuestTracker(state, maxQuests = 3) {
  const quests = getActiveQuestsWithProgress(state).slice(0, maxQuests);
  
  if (quests.length === 0) {
    return '';
  }
  
  const questsHtml = quests.map(quest => {
    const objectives = quest.objectives.slice(0, 3).map(obj => {
      const complete = obj.complete;
      return `<div class="tracked-objective ${complete ? 'complete' : ''}">\u2022 ${escapeHtml(obj.description)} (${obj.progress}/${obj.amount})</div>`;
    }).join('');
    
    return `
      <div class="tracked-quest">
        <div class="tracked-quest-name">${escapeHtml(quest.icon)} ${escapeHtml(quest.name)}</div>
        ${objectives}
      </div>
    `;
  }).join('');
  
  return `
    <div class="quest-tracker">
      <div class="quest-tracker-title">Quest Tracker</div>
      ${questsHtml}
    </div>
  `.trim();
}

/**
 * Render quest started notification
 * @param {string} questName - Quest name
 * @returns {string} HTML string
 */
export function renderQuestStartedNotice(questName) {
  return `
    <div class="quest-notification started">
      <span class="quest-notification-icon">\uD83D\uDCDC</span>
      <span class="quest-notification-text">Quest Started: ${escapeHtml(questName)}</span>
    </div>
  `.trim();
}

/**
 * Render quest completed notification
 * @param {string} questName - Quest name
 * @param {Object} rewards - Rewards
 * @returns {string} HTML string
 */
export function renderQuestCompletedNotice(questName, rewards) {
  const rewardText = [];
  if (rewards?.xp) rewardText.push(`+${rewards.xp} XP`);
  if (rewards?.gold) rewardText.push(`+${rewards.gold} Gold`);
  
  return `
    <div class="quest-notification completed">
      <span class="quest-notification-icon">\u2B50</span>
      <span class="quest-notification-text">Quest Complete: ${escapeHtml(questName)}${rewardText.length ? ` (${rewardText.join(', ')})` : ''}</span>
    </div>
  `.trim();
}

/**
 * Render objective completed notification
 * @param {string} description - Objective description
 * @returns {string} HTML string
 */
export function renderObjectiveCompletedNotice(description) {
  return `
    <div class="quest-notification objective">
      <span class="quest-notification-icon">\u2713</span>
      <span class="quest-notification-text">Objective Complete: ${escapeHtml(description)}</span>
    </div>
  `.trim();
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
