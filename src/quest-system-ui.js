/**
 * Quest System UI
 */

import {
  QUEST_TYPES,
  OBJECTIVE_TYPES,
  QUEST_STATUS,
  getQuest,
  getActiveQuests,
  getAvailableQuests,
  getCompletedQuests,
  getQuestProgress,
  getQuestStats,
  getAllQuestTypes
} from './quest-system.js';

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatNumber(num) { return num.toLocaleString(); }

export function renderQuestCard(quest, options = {}) {
  const { showActions = true, compact = false } = options;
  const progress = quest.objectives ? quest.objectives.reduce((sum, o) => sum + o.current, 0) / quest.objectives.reduce((sum, o) => sum + o.required, 0) * 100 : 0;

  if (compact) {
    return '<div class="quest-card compact" data-quest-id="' + escapeHtml(quest.id) + '" style="border-color: ' + quest.typeColor + '">' +
      '<span class="quest-icon">' + quest.typeIcon + '</span>' +
      '<span class="quest-name">' + escapeHtml(quest.name) + '</span>' +
      '<span class="quest-progress">' + Math.round(progress) + '%</span>' +
    '</div>';
  }

  const objectivesList = quest.objectives.map(obj => {
    const objType = OBJECTIVE_TYPES[obj.type.toUpperCase()] || { verb: 'Complete' };
    return '<div class="objective-row' + (obj.completed ? ' completed' : '') + '">' +
      '<span class="objective-desc">' + objType.verb + ' ' + escapeHtml(obj.targetName) + '</span>' +
      '<span class="objective-progress">' + obj.current + '/' + obj.required + '</span>' +
    '</div>';
  }).join('');

  const rewardsList = [];
  if (quest.rewards.gold > 0) rewardsList.push(formatNumber(quest.rewards.gold) + ' gold');
  if (quest.rewards.experience > 0) rewardsList.push(formatNumber(quest.rewards.experience) + ' XP');
  if (quest.rewards.reputation > 0) rewardsList.push('+' + quest.rewards.reputation + ' rep');

  let actions = '';
  if (showActions) {
    if (quest.status === 'available') {
      actions = '<button class="btn accept" data-action="accept-quest" data-quest-id="' + escapeHtml(quest.id) + '">Accept</button>';
    } else if (quest.status === 'completed') {
      actions = '<button class="btn turn-in" data-action="turn-in-quest" data-quest-id="' + escapeHtml(quest.id) + '">Turn In</button>';
    } else if (quest.status === 'active') {
      actions = '<button class="btn abandon danger" data-action="abandon-quest" data-quest-id="' + escapeHtml(quest.id) + '">Abandon</button>';
    }
  }

  return '<div class="quest-card" data-quest-id="' + escapeHtml(quest.id) + '" style="border-color: ' + quest.typeColor + '">' +
    '<div class="quest-header">' +
      '<span class="quest-icon">' + quest.typeIcon + '</span>' +
      '<span class="quest-name">' + escapeHtml(quest.name) + '</span>' +
      '<span class="quest-type">' + escapeHtml(quest.typeName) + '</span>' +
    '</div>' +
    '<p class="quest-description">' + escapeHtml(quest.description) + '</p>' +
    '<div class="quest-objectives"><h4>Objectives</h4>' + objectivesList + '</div>' +
    '<div class="quest-rewards"><h4>Rewards</h4><span>' + (rewardsList.length > 0 ? rewardsList.join(', ') : 'None') + '</span></div>' +
    '<div class="quest-progress-bar"><div class="fill" style="width: ' + progress + '%"></div></div>' +
    '<div class="quest-actions">' + actions + '</div>' +
  '</div>';
}

export function renderQuestList(quests, title, emptyMessage = 'No quests') {
  if (!quests || quests.length === 0) {
    return '<div class="quest-list empty"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(emptyMessage) + '</p></div>';
  }

  const cards = quests.map(q => renderQuestCard(q)).join('');
  return '<div class="quest-list"><h3>' + escapeHtml(title) + '</h3>' + cards + '</div>';
}

export function renderActiveQuests(state) {
  const quests = getActiveQuests(state);
  return renderQuestList(quests, 'Active Quests', 'No active quests');
}

export function renderAvailableQuests(state) {
  const quests = getAvailableQuests(state);
  return renderQuestList(quests, 'Available Quests', 'No quests available');
}

export function renderCompletedQuests(state) {
  const quests = getCompletedQuests(state);
  return renderQuestList(quests, 'Completed Quests', 'No completed quests');
}

export function renderQuestTracker(state) {
  const active = getActiveQuests(state);
  if (active.length === 0) {
    return '<div class="quest-tracker empty">No tracked quests</div>';
  }

  const entries = active.slice(0, 3).map(q => {
    const progress = getQuestProgress(state, q.id);
    return '<div class="tracker-entry">' +
      '<span class="quest-icon">' + q.typeIcon + '</span>' +
      '<span class="quest-name">' + escapeHtml(q.name) + '</span>' +
      '<span class="quest-progress">' + (progress.found ? progress.progress + '%' : '?') + '</span>' +
    '</div>';
  }).join('');

  return '<div class="quest-tracker">' +
    '<div class="tracker-header">Quest Tracker</div>' +
    entries +
  '</div>';
}

export function renderQuestDetails(state, questId) {
  const result = getQuest(state, questId);
  if (!result.found) return '<div class="quest-details empty">Quest not found</div>';
  return renderQuestCard(result.quest, { showActions: true });
}

export function renderQuestStats(state) {
  const stats = getQuestStats(state);
  return '<div class="quest-stats">' +
    '<h3>Quest Statistics</h3>' +
    '<div class="stat-row"><span>Quests Completed</span><span>' + stats.totalCompleted + '</span></div>' +
    '<div class="stat-row"><span>Quests Failed</span><span>' + stats.totalFailed + '</span></div>' +
    '<div class="stat-row"><span>Dailies Completed</span><span>' + stats.dailiesCompleted + '</span></div>' +
  '</div>';
}

export function renderQuestTypeFilter(selectedType = null) {
  const types = getAllQuestTypes();
  const buttons = types.map(t =>
    '<button class="filter-btn' + (selectedType === t.id ? ' active' : '') + '" data-type="' + t.id + '" style="--type-color: ' + t.color + '">' +
      t.icon + ' ' + escapeHtml(t.name) +
    '</button>'
  ).join('');

  return '<div class="quest-type-filter">' +
    '<button class="filter-btn' + (!selectedType ? ' active' : '') + '" data-type="">All</button>' +
    buttons +
  '</div>';
}

export function renderQuestLogPage(state, selectedType = null) {
  const active = getActiveQuests(state).filter(q => !selectedType || q.type === selectedType);
  const available = getAvailableQuests(state).filter(q => !selectedType || q.type === selectedType);

  return '<div class="quest-log-page">' +
    '<header class="page-header"><h1>Quest Log</h1></header>' +
    '<div class="page-content">' +
      '<aside class="sidebar">' +
        renderQuestTracker(state) +
        renderQuestStats(state) +
      '</aside>' +
      '<main class="main-content">' +
        renderQuestTypeFilter(selectedType) +
        renderQuestList(active, 'Active Quests (' + active.length + ')', 'No active quests') +
        renderQuestList(available, 'Available Quests (' + available.length + ')', 'No available quests') +
      '</main>' +
    '</div>' +
  '</div>';
}

export function renderQuestNotification(quest, type) {
  const messages = {
    accepted: 'Quest Accepted!',
    completed: 'Quest Complete!',
    'turned-in': 'Rewards Received!',
    failed: 'Quest Failed',
    'objective-complete': 'Objective Complete!'
  };

  return '<div class="quest-notification ' + type + '">' +
    '<span class="notification-icon">' + quest.typeIcon + '</span>' +
    '<span class="notification-text">' + (messages[type] || 'Quest Update') + '</span>' +
    '<span class="quest-name">' + escapeHtml(quest.name) + '</span>' +
  '</div>';
}
