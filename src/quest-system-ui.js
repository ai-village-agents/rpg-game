/**
 * Quest System UI Components
 * UI for quest log, objectives, and tracking
 */

import {
  QUEST_TYPES,
  QUEST_STATUS,
  OBJECTIVE_TYPES,
  getQuestProgress,
  getAvailableQuests,
  getActiveQuests,
  getChainProgress,
  getQuestStats
} from './quest-system.js';

// HTML escape helper
function escapeHtml(text) {
  const div = { textContent: text, innerHTML: '' };
  div.textContent = text;
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render quest card
export function renderQuestCard(quest, progress = null) {
  const typeInfo = QUEST_TYPES[quest.type];
  const typeColor = typeInfo?.color || '#888888';
  const progressPercent = progress?.percentComplete || 0;

  let statusBadge = '';
  if (progress) {
    statusBadge = `<span class="quest-status quest-status-active">In Progress</span>`;
  }

  let timeWarning = '';
  if (progress?.timeRemaining !== null && progress.timeRemaining < 3600000) {
    const minutes = Math.floor(progress.timeRemaining / 60000);
    timeWarning = `<span class="quest-time-warning">⏰ ${minutes}m remaining</span>`;
  }

  return `
    <div class="quest-card" data-quest-id="${escapeHtml(quest.id)}" data-quest-type="${escapeHtml(quest.type)}">
      <div class="quest-card-header">
        <span class="quest-type-badge" style="background-color: ${typeColor}">${escapeHtml(typeInfo?.name || quest.type)}</span>
        ${statusBadge}
        ${timeWarning}
      </div>
      <h3 class="quest-name">${escapeHtml(quest.name)}</h3>
      <p class="quest-description">${escapeHtml(quest.description)}</p>
      ${progress ? `
        <div class="quest-progress-bar">
          <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <span class="quest-progress-text">${progressPercent}% Complete</span>
      ` : ''}
      <div class="quest-meta">
        <span class="quest-level">Level ${quest.levelRequirement || 1}+</span>
        ${quest.chainId ? `<span class="quest-chain">🔗 Chain Quest</span>` : ''}
      </div>
    </div>
  `;
}

// Render objectives list
export function renderObjectives(objectives) {
  if (!objectives || objectives.length === 0) {
    return '<p class="no-objectives">No objectives</p>';
  }

  const objectiveItems = objectives.map(obj => {
    const typeInfo = OBJECTIVE_TYPES[obj.type] || { verb: 'Complete' };
    const isComplete = obj.completed;
    const statusClass = isComplete ? 'objective-complete' : 'objective-incomplete';
    const checkmark = isComplete ? '✓' : '○';

    return `
      <li class="objective-item ${statusClass}">
        <span class="objective-check">${checkmark}</span>
        <span class="objective-text">${escapeHtml(obj.description || `${typeInfo.verb} target`)}</span>
        <span class="objective-progress">${obj.current}/${obj.target}</span>
      </li>
    `;
  }).join('');

  return `<ul class="objectives-list">${objectiveItems}</ul>`;
}

// Render rewards list
export function renderRewards(rewards) {
  if (!rewards || rewards.length === 0) {
    return '<p class="no-rewards">No rewards</p>';
  }

  const rewardItems = rewards.map(reward => {
    let icon = '🎁';
    switch (reward.type) {
      case 'gold': icon = '💰'; break;
      case 'experience': icon = '⭐'; break;
      case 'item': icon = '📦'; break;
      case 'reputation': icon = '🏆'; break;
      case 'skill_point': icon = '💫'; break;
      case 'unlock': icon = '🔓'; break;
    }

    return `
      <li class="reward-item">
        <span class="reward-icon">${icon}</span>
        <span class="reward-amount">${reward.amount}</span>
        <span class="reward-type">${escapeHtml(reward.type)}</span>
      </li>
    `;
  }).join('');

  return `<ul class="rewards-list">${rewardItems}</ul>`;
}

// Render quest details panel
export function renderQuestDetails(quest, state, registry) {
  const progress = getQuestProgress(state, quest.id);
  const typeInfo = QUEST_TYPES[quest.type];
  const isActive = state.activeQuests.includes(quest.id);
  const isCompleted = state.completedQuests.includes(quest.id);

  let actionButton = '';
  if (isActive) {
    if (progress && progress.completedObjectives === progress.totalObjectives) {
      actionButton = `<button class="btn-complete-quest" data-quest-id="${escapeHtml(quest.id)}">Complete Quest</button>`;
    } else {
      actionButton = `<button class="btn-abandon-quest" data-quest-id="${escapeHtml(quest.id)}">Abandon</button>`;
    }
  } else if (!isCompleted) {
    actionButton = `<button class="btn-accept-quest" data-quest-id="${escapeHtml(quest.id)}">Accept Quest</button>`;
  }

  return `
    <div class="quest-details-panel">
      <div class="quest-details-header" style="border-color: ${typeInfo?.color || '#888'}">
        <span class="quest-type-badge" style="background-color: ${typeInfo?.color || '#888'}">${escapeHtml(typeInfo?.name || quest.type)}</span>
        <h2 class="quest-details-title">${escapeHtml(quest.name)}</h2>
      </div>

      <div class="quest-details-body">
        <p class="quest-details-description">${escapeHtml(quest.description)}</p>

        <div class="quest-details-section">
          <h4>Objectives</h4>
          ${renderObjectives(progress?.objectives || quest.objectives)}
        </div>

        <div class="quest-details-section">
          <h4>Rewards</h4>
          ${renderRewards(quest.rewards)}
        </div>

        ${quest.chainId ? `
          <div class="quest-details-section">
            <h4>Quest Chain</h4>
            ${renderChainProgress(state, registry, quest.chainId)}
          </div>
        ` : ''}
      </div>

      <div class="quest-details-footer">
        ${actionButton}
      </div>
    </div>
  `;
}

// Render chain progress
export function renderChainProgress(state, registry, chainId) {
  const progress = getChainProgress(state, registry, chainId);
  if (!progress) {
    return '<p>Chain not found</p>';
  }

  return `
    <div class="chain-progress">
      <div class="chain-progress-bar">
        <div class="chain-progress-fill" style="width: ${progress.percentComplete}%"></div>
      </div>
      <span class="chain-progress-text">${progress.completed}/${progress.total} Complete</span>
      ${progress.isComplete ? '<span class="chain-complete-badge">🏆 Chain Complete!</span>' : ''}
    </div>
  `;
}

// Render quest tracker (sidebar widget)
export function renderQuestTracker(state, registry, maxQuests = 3) {
  const activeQuests = getActiveQuests(state, registry).slice(0, maxQuests);

  if (activeQuests.length === 0) {
    return `
      <div class="quest-tracker">
        <h3 class="quest-tracker-title">Quest Tracker</h3>
        <p class="no-tracked-quests">No active quests</p>
      </div>
    `;
  }

  const questItems = activeQuests.map(quest => {
    const typeInfo = QUEST_TYPES[quest.type];
    const progress = quest.progress;

    const currentObj = progress?.objectives.find(o => !o.completed);
    const objText = currentObj ? `${currentObj.description || 'Complete objective'}: ${currentObj.current}/${currentObj.target}` : 'All objectives complete!';

    return `
      <div class="tracker-quest" data-quest-id="${escapeHtml(quest.id)}">
        <div class="tracker-quest-header">
          <span class="tracker-quest-dot" style="background-color: ${typeInfo?.color || '#888'}"></span>
          <span class="tracker-quest-name">${escapeHtml(quest.name)}</span>
        </div>
        <div class="tracker-quest-objective">${escapeHtml(objText)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="quest-tracker">
      <h3 class="quest-tracker-title">Quest Tracker</h3>
      ${questItems}
    </div>
  `;
}

// Render quest log
export function renderQuestLog(state, registry) {
  const available = getAvailableQuests(state, registry);
  const active = getActiveQuests(state, registry);

  const tabs = `
    <div class="quest-log-tabs">
      <button class="quest-tab active" data-tab="active">Active (${active.length})</button>
      <button class="quest-tab" data-tab="available">Available (${available.length})</button>
      <button class="quest-tab" data-tab="completed">Completed (${state.completedQuests.length})</button>
    </div>
  `;

  const activeContent = active.length > 0
    ? active.map(q => renderQuestCard(q, q.progress)).join('')
    : '<p class="no-quests">No active quests</p>';

  const availableContent = available.length > 0
    ? available.map(q => renderQuestCard(q)).join('')
    : '<p class="no-quests">No available quests</p>';

  const completedContent = state.completedQuests.length > 0
    ? state.completedQuests.map(qId => {
        const quest = registry.quests[qId];
        return quest ? renderQuestCard(quest) : '';
      }).join('')
    : '<p class="no-quests">No completed quests</p>';

  return `
    <div class="quest-log">
      <h2 class="quest-log-title">Quest Log</h2>
      ${tabs}
      <div class="quest-log-content">
        <div class="quest-tab-content active" data-tab="active">${activeContent}</div>
        <div class="quest-tab-content" data-tab="available">${availableContent}</div>
        <div class="quest-tab-content" data-tab="completed">${completedContent}</div>
      </div>
    </div>
  `;
}

// Render quest stats panel
export function renderQuestStatsPanel(state) {
  const stats = getQuestStats(state);

  return `
    <div class="quest-stats-panel">
      <h3>Quest Statistics</h3>
      <div class="quest-stats-grid">
        <div class="quest-stat">
          <span class="quest-stat-value">${stats.totalCompleted}</span>
          <span class="quest-stat-label">Completed</span>
        </div>
        <div class="quest-stat">
          <span class="quest-stat-value">${stats.activeCount}</span>
          <span class="quest-stat-label">Active</span>
        </div>
        <div class="quest-stat">
          <span class="quest-stat-value">${stats.completionRate}%</span>
          <span class="quest-stat-label">Success Rate</span>
        </div>
        <div class="quest-stat">
          <span class="quest-stat-value">${stats.mainQuestsCompleted}</span>
          <span class="quest-stat-label">Main Quests</span>
        </div>
      </div>
    </div>
  `;
}

// Render quest notification
export function renderQuestNotification(type, questName, details = '') {
  let icon = '📜';
  let title = 'Quest Update';

  switch (type) {
    case 'accepted':
      icon = '📜';
      title = 'Quest Accepted';
      break;
    case 'completed':
      icon = '🏆';
      title = 'Quest Complete!';
      break;
    case 'failed':
      icon = '❌';
      title = 'Quest Failed';
      break;
    case 'objective':
      icon = '✓';
      title = 'Objective Complete';
      break;
  }

  return `
    <div class="quest-notification quest-notification-${escapeHtml(type)}">
      <span class="quest-notification-icon">${icon}</span>
      <div class="quest-notification-content">
        <span class="quest-notification-title">${title}</span>
        <span class="quest-notification-quest">${escapeHtml(questName)}</span>
        ${details ? `<span class="quest-notification-details">${escapeHtml(details)}</span>` : ''}
      </div>
    </div>
  `;
}

// Render quest giver dialog
export function renderQuestGiverDialog(npcName, quests, registry) {
  if (quests.length === 0) {
    return `
      <div class="quest-giver-dialog">
        <div class="quest-giver-header">
          <h3>${escapeHtml(npcName)}</h3>
        </div>
        <p class="no-quests-available">No quests available</p>
      </div>
    `;
  }

  const questList = quests.map(quest => {
    const typeInfo = QUEST_TYPES[quest.type];
    return `
      <div class="quest-giver-quest" data-quest-id="${escapeHtml(quest.id)}">
        <span class="quest-giver-dot" style="background-color: ${typeInfo?.color || '#888'}"></span>
        <span class="quest-giver-quest-name">${escapeHtml(quest.name)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="quest-giver-dialog">
      <div class="quest-giver-header">
        <h3>${escapeHtml(npcName)}</h3>
        <span class="quest-giver-badge">${quests.length} Quest${quests.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="quest-giver-list">
        ${questList}
      </div>
    </div>
  `;
}

// Get quest log styles
export function getQuestLogStyles() {
  return `
    .quest-log { padding: 20px; max-width: 800px; margin: 0 auto; }
    .quest-log-title { margin-bottom: 15px; }
    .quest-log-tabs { display: flex; gap: 10px; margin-bottom: 15px; }
    .quest-tab { padding: 8px 16px; background: #444; border: none; border-radius: 4px; cursor: pointer; }
    .quest-tab.active { background: #666; }
    .quest-tab-content { display: none; }
    .quest-tab-content.active { display: block; }

    .quest-card { background: #333; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
    .quest-card-header { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
    .quest-type-badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; }
    .quest-name { margin: 0 0 8px 0; }
    .quest-description { color: #aaa; margin-bottom: 10px; }
    .quest-progress-bar { height: 6px; background: #555; border-radius: 3px; margin-bottom: 5px; }
    .quest-progress-fill { height: 100%; background: #4CAF50; border-radius: 3px; }
    .quest-progress-text { font-size: 12px; color: #888; }
    .quest-meta { display: flex; gap: 15px; font-size: 12px; color: #888; margin-top: 10px; }

    .objectives-list { list-style: none; padding: 0; }
    .objective-item { display: flex; gap: 10px; padding: 5px 0; align-items: center; }
    .objective-complete { color: #4CAF50; text-decoration: line-through; }
    .objective-check { width: 20px; }
    .objective-progress { margin-left: auto; color: #888; }

    .rewards-list { list-style: none; padding: 0; display: flex; gap: 15px; flex-wrap: wrap; }
    .reward-item { display: flex; gap: 5px; align-items: center; }

    .quest-tracker { background: #2a2a2a; padding: 15px; border-radius: 8px; }
    .quest-tracker-title { margin: 0 0 10px 0; font-size: 14px; }
    .tracker-quest { margin-bottom: 10px; }
    .tracker-quest-header { display: flex; gap: 8px; align-items: center; }
    .tracker-quest-dot { width: 8px; height: 8px; border-radius: 50%; }
    .tracker-quest-name { font-weight: bold; font-size: 13px; }
    .tracker-quest-objective { font-size: 12px; color: #aaa; margin-left: 16px; }

    .quest-notification { display: flex; gap: 10px; padding: 12px; background: #333; border-radius: 8px; align-items: center; }
    .quest-notification-icon { font-size: 24px; }
    .quest-notification-title { font-weight: bold; display: block; }
    .quest-notification-quest { color: #aaa; font-size: 13px; }

    .quest-time-warning { color: #FF6B6B; font-size: 12px; }
    .quest-status-active { background: #4CAF50; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
  `;
}
